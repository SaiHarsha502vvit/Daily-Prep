**Navigation**: [< Previous](12_Backtracking.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](14_Mixed_Competitive.md)

**Problems 13/14** | [Prev](12_Backtracking.md) | [Index](../00_MASTER_INDEX.md) | [Next](14_Mixed_Competitive.md)

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

# 📚 SECTION 12: GREEDY ALGORITHMS

## Greedy Fundamentals

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
<details><summary>Answer</summary>

Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others.

</details>

## PART 0: WHY Greedy — The Algorithm That Feels Like Cheating (But Isn't)

🔬 **Section Challenge — PART 0: WHY Greedy — The Algorithm That Feels Like Cheating (But Isn't)**

**Challenge 1 (Greedy Failure Condition):** Coin change with denominations `[1, 5, 6]` and target `10`. Greedy picks 6 first, then 1+1+1+1 = 5 coins. Optimal is 5+5 = 2 coins. **Who** breaks the greedy? **What** property of the coin system allows greedy to fail? **When** does greedy ALWAYS work for coin change?

<details><summary>Answer</summary>

**Who breaks greedy:** The `6` denomination. After picking `6`, you need 4 more — which requires four `1`s (5 total). But `5+5=10` is optimal (2 coins). **What property allows failure:** The denominations don't have the "greedy-choice property" for this target. Greedy works on coin systems where each denomination is an exact multiple of smaller ones (e.g., `[1, 5, 25, 100]` — US coins). In that case, a bigger coin is always worth more combinations. With `[1, 5, 6]`, `6` is not a multiple of `5` — the domains overlap non-uniformly. **When greedy ALWAYS works:** When denominations are a canonical coin system (each larger denomination = integer multiple of the next smaller). US coins, EU coins work. Also when there's a formal proof via exchange argument for the specific denomination set. **General solution:** Coin change is a DP problem (LC 322). DP is O(amount \* #coins) and handles all denomination sets correctly.

</details>
<details><summary>Answer</summary>

Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others.

</details>

## Why Greedy Problems Are Tricky (And Important)

Greedy algorithms feel simple: "just pick the best choice."
The HARD PART: proving the greedy choice is CORRECT.
Greedy appears in ~15% of interviews. The trap:

- You often RECOGNIZE the greedy answer intuitively
- But you can't PROVE it → interviewer asks "why does this work?"
- Or worse: you assume greedy works when it DOESN'T → wrong answer
  TWO PROPERTIES REQUIRED (must have BOTH):

1. GREEDY CHOICE PROPERTY: The locally best choice leads to global best
2. OPTIMAL SUBSTRUCTURE: After making a choice, the remaining problem
   is a smaller version of the same problem
   WORKS vs DOESN'T WORK:
   ┬

- ✅ Greedy WORKS │ ❌ Greedy FAILS (need DP)
  ┼
  Activity Selection │ 0/1 Knapsack
  Fractional Knapsack │ Longest Increasing Subsequence
  Huffman Coding │ Coin Change (arbitrary coins)
  Dijkstra's Algorithm │ Edit Distance
  Kruskal's MST │ Matrix Chain Multiplication
  Jump Game I │ Palindrome Partitioning min cuts
  ┴

🔬 **Section Challenge — Why Greedy Problems Are Tricky (And Important)**

**Challenge 1 (Why Greedy Is Tricky):** LC 55 (Jump Game) and LC 45 (Jump Game II) look identical but one uses greedy and one "requires" DP. Both are actually solvable with greedy. **Who** defines the greedy choice in Jump Game II? **When** does the local choice (extend reach maximally) guarantee global minimum jumps?

<details><summary>Answer</summary>

**Greedy choice in Jump Game II:** At each position, we track `currentEnd` (the farthest we can reach with the current number of jumps) and `farthest` (the farthest we can reach if we make one more jump from any position seen so far). When we reach `currentEnd`, we MUST make one more jump — we set `currentEnd = farthest` (the furthest reachable in one more jump). **Who defines it:** The implicit interval structure. Each jump "covers" a range. We want to cover `[0, n-1]` with minimum intervals where each interval `[i, i+nums[i]]` overlaps the previous. **Why local maximizes global:** At the point where we must jump (position = `currentEnd`), choosing the jump that extends reach the farthest is always optimal. Taking a shorter jump would only restrict future options. This is the "greedy interval covering" proof: always extend coverage greedily. **Time complexity:** O(n) greedy vs O(n²) naive DP — greedy wins both correctness and efficiency.

</details>
<details><summary>Answer</summary>

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

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ THE 3 GREEDY CATEGORIES IN THIS CHAPTER                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌──────────────────┬─────────────────────────────────┬───────────────────┐   │
│ │ Category         │ Sorting / Scanning Strategy     │ Problems          │   │
│ ├──────────────────┼─────────────────────────────────┼───────────────────┤   │
│ │ 1. INTERVALS     │ Sort by end time (or start time)│ 189-193           │   │
│ │                  │ Pick non-overlapping greedily   │ Meeting Rooms     │   │
│ │                  │                                  │ Merge Intervals   │  │
│ ├──────────────────┼─────────────────────────────────┼───────────────────┤   │
│ │ 2. ARRAY GREEDY  │ Scan L→R, track running state  │ 194-197           │    │
│ │                  │ (farthest reach, surplus, etc.) │ Jump Game         │   │
│ │                  │                                  │ Gas Station       │  │
│ ├──────────────────┼─────────────────────────────────┼───────────────────┤   │
│ │ 3. STRING/MATH   │ Problem-specific ordering       │ 198-201           │   │
│ │                  │ (frequency, digit removal, etc.)│ Task Scheduler    │   │
│ └──────────────────┴─────────────────────────────────┴───────────────────┘   │
│                                                                              │
│ PRIORITY: Master Intervals first — they appear in 50%+ of greedy Qs.         │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ ⚠️  COMMON MISTAKES IN GREEDY PROBLEMS                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ MISTAKE 1: Assuming greedy works without verifying                           │
│   WRONG: "Pick the highest-value item first."                                │
│   0/1 Knapsack counterexample: W=50. Items: (60,10), (100,20), (120,30).     │
│   Greedy by value/weight picks 60+100=160. DP gets 100+120=220.              │
│   RULE: If items can't be split → probably NOT greedy.                       │
│                                                                              │
│ MISTAKE 2: Sorting by wrong criterion for intervals                          │
│   "Non-overlapping intervals" → sort by END time, not start time.            │
│   "Merge intervals" → sort by START time, not end time.                      │
│   Different problems need different sort keys!                               │
│                                                                              │
│ MISTAKE 3: Off-by-one in overlap detection                                   │
│   [1,5] and [5,8] — do they overlap?                                         │
│   If endpoints inclusive: YES (share point 5)                                │
│   If end-exclusive: NO (5 is end of first, start of second)                  │
│   Always check problem definition! LeetCode usually: start ≤ x < end.        │
│                                                                              │
│ MISTAKE 4: Jump Game — forgetting that farthest updates continuously         │
│   Wrong: only check if current index == farthest                             │
│   Right: update farthest = max(farthest, i + nums[i]) at EVERY step          │
│   If i > farthest at any point → can't reach end.                            │
│                                                                              │
│ MISTAKE 5: Gas Station — brute force O(n²) when O(n) suffices                │
│   Key insight: if total gas ≥ total cost → answer always exists.             │
│   Track surplus. When it goes negative → restart from next station.          │
│   Single pass, O(n). Many candidates miss this optimization.                 │
│                                                                              │
│ MISTAKE 6: Trying greedy on Coin Change with arbitrary denominations         │
│   Coins = [1, 3, 4], Amount = 6.                                             │
│   Greedy picks 4+1+1 = 3 coins. Optimal: 3+3 = 2 coins.                      │
│   Greedy only works for canonical coin systems (US coins: 1,5,10,25).        │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES IN LEARNING GREEDY                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. "How do I know if greedy works vs DP?"                                    │
│    → Try to find a counterexample. If you can swap the greedy choice with    │
│      another and get a better answer → greedy fails, use DP.                 │
│                                                                              │
│ 2. "The proof seems obvious but I can't formalize it"                        │
│    → Exchange argument: Assume optimal solution differs from greedy.         │
│      Show you can replace the different choice with greedy's choice          │
│      without making the solution worse. That's the full proof.               │
│                                                                              │
│ 3. "I keep getting TLE on interval problems"                                 │
│    → Are you sorting? Unsorted intervals → O(n²) comparisons.                │
│      Sort by end time first → single O(n) pass after O(n log n) sort.        │
│                                                                              │
│ 4. "Jump Game II was way harder than Jump Game I"                            │
│    → Jump I = "can you reach end?" (track farthest). Jump II = "min          │
│      jumps to reach end?" (BFS-like greedy with level boundaries).           │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ ⭐ EXPECTED OUTPUTS OF MASTERING GREEDY ⭐                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ✅ Instantly distinguish Greedy vs DP based on counterexample thinking        │
│ ✅ Sort intervals by END time for scheduling, START time for merging          │
│ ✅ Write interval greedy template (sort + scan + lastEnd) from memory         │
│ ✅ Solve Jump Game in O(n) with farthest-reachable tracking                   │
│ ✅ Explain exchange argument proof at whiteboard                              │
│ ✅ Recognize when greedy FAILS and pivot to DP                                │
│                                                                              │
│ THE TRANSFORMATION:                                                          │
│ FROM: "I always try greedy and sometimes it's wrong"                         │
│   TO: "I check greedy-choice property + optimal substructure. If both        │
│        hold, I sort by the right key, scan once, never look back.            │
│        If not, I reach for DP and can explain WHY."                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

📖 **Related theory:** [03_Algorithms/12_Greedy_Algorithms_Complete.md](../03_Algorithms/12_Greedy_Algorithms_Complete.md) — Full greedy theory with exchange argument proofs

---

## 12.1 Interval Problems

**Pattern:** Sort by end time. Greedily pick non-overlapping intervals.
**Key insight:** Finishing earliest leaves the most room for future activities.
**Template:** Sort by `end`, keep `lastEnd`, skip if `start < lastEnd`.

### Problem 189: Meeting Rooms

**LeetCode 252 (Premium)** 🔒

```
┌────────────────────────────────────────────────────────────────┐
│  MEETING ROOMS - Can attend all meetings?                      │
├────────────────────────────────────────────────────────────────┤
│  intervals = [[0,30], [5,10], [15,20]]                         │
│                                                                │
│  Timeline:                                                     │
│  0────────────────────────────30  Meeting 1                    │
│       5────10                      Meeting 2 (overlaps!)       │
│            15────20                Meeting 3 (overlaps!)       │
│                                                                │
│  Output: false (meetings overlap)                              │
│                                                                │
│  Constraints:                                                  │
│  - 0 <= intervals.length <= 10^4                               │
│  - intervals[i].length == 2                                    │
│  - 0 <= start < end <= 10^6                                    │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public boolean canAttendMeetings(int[][] intervals) {
    // Sort by start time
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);

    for (int i = 1; i < intervals.length; i++) {
        // If current starts before previous ends → overlap
        if (intervals[i][0] < intervals[i-1][1]) {
            return false;
        }
    }

    return true;
}
```

---

### Problem 190: Meeting Rooms II

**LeetCode 253 (Premium)** 🔒

```
┌────────────────────────────────────────────────────────────────┐
│  MEETING ROOMS II - Minimum rooms needed                       │
├────────────────────────────────────────────────────────────────┤
│  intervals = [[0,30], [5,10], [15,20]]                         │
│                                                                │
│  Room 1: |═══════════════════════════════| [0,30]              │
│  Room 2:      |════|      |═════|          [5,10], [15,20]     │
│                                                                │
│  Output: 2 rooms needed                                        │
│                                                                │
│  Approach: Track concurrent meetings using min-heap            │
│  Heap stores end times of ongoing meetings                     │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int minMeetingRooms(int[][] intervals) {
    if (intervals.length == 0) return 0;

    // Sort by start time
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);

    // Min-heap to track end times
    PriorityQueue<Integer> heap = new PriorityQueue<>();
    heap.offer(intervals[0][1]);

    for (int i = 1; i < intervals.length; i++) {
        // If earliest ending meeting ends before current starts
        if (intervals[i][0] >= heap.peek()) {
            heap.poll();  // Reuse that room
        }
        heap.offer(intervals[i][1]);  // Add current meeting's end
    }

    return heap.size();
}
```

---

### Problem 191: Non-overlapping Intervals

**LeetCode 435** 🔗 https://leetcode.com/problems/non-overlapping-intervals/

```
┌────────────────────────────────────────────────────────────────┐
│  NON-OVERLAPPING INTERVALS - Min removals for no overlap       │
├────────────────────────────────────────────────────────────────┤
│  intervals = [[1,2], [2,3], [3,4], [1,3]]                      │
│                                                                │
│  1──2  2──3  3──4                                              │
│  1─────3     (overlaps with both above)                        │
│                                                                │
│  Remove [1,3] → No overlaps                                    │
│  Output: 1                                                     │
│                                                                │
│  Greedy: Sort by end time, keep non-overlapping                │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int eraseOverlapIntervals(int[][] intervals) {
    if (intervals.length == 0) return 0;

    // Sort by END time (greedy choice)
    Arrays.sort(intervals, (a, b) -> a[1] - b[1]);

    int count = 0;
    int prevEnd = intervals[0][1];

    for (int i = 1; i < intervals.length; i++) {
        if (intervals[i][0] < prevEnd) {
            // Overlap: remove current (it ends later)
            count++;
        } else {
            prevEnd = intervals[i][1];
        }
    }

    return count;
}
```

---

### Problem 192: Merge Intervals

**LeetCode 56** 🔗 https://leetcode.com/problems/merge-intervals/

```
┌────────────────────────────────────────────────────────────────┐
│  MERGE INTERVALS                                               │
├────────────────────────────────────────────────────────────────┤
│  intervals = [[1,3], [2,6], [8,10], [15,18]]                   │
│                                                                │
│  1───3                                                         │
│    2─────6                                                     │
│              8──10                                             │
│                     15──18                                     │
│  └───────┘                                                     │
│  Merged: [1,6]                                                 │
│                                                                │
│  Output: [[1,6], [8,10], [15,18]]                              │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int[][] merge(int[][] intervals) {
    if (intervals.length <= 1) return intervals;

    // Sort by start time
    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);

    List<int[]> result = new ArrayList<>();
    int[] current = intervals[0];
    result.add(current);

    for (int[] interval : intervals) {
        if (interval[0] <= current[1]) {
            // Overlapping: extend current
            current[1] = Math.max(current[1], interval[1]);
        } else {
            // Non-overlapping: add new interval
            current = interval;
            result.add(current);
        }
    }

    return result.toArray(new int[result.size()][]);
}
```

---

### Problem 193: Insert Interval

**LeetCode 57** 🔗 https://leetcode.com/problems/insert-interval/

```
┌────────────────────────────────────────────────────────────────┐
│  INSERT INTERVAL                                               │
├────────────────────────────────────────────────────────────────┤
│  intervals = [[1,3], [6,9]], newInterval = [2,5]               │
│                                                                │
│  1───3    6───9                                                │
│    2─────5                                                     │
│  └─────┘                                                       │
│  Merge [1,3] and [2,5] → [1,5]                                 │
│                                                                │
│  Output: [[1,5], [6,9]]                                        │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int[][] insert(int[][] intervals, int[] newInterval) {
    List<int[]> result = new ArrayList<>();
    int i = 0;

    // Add all intervals ending before newInterval starts
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

    // Add remaining intervals
    while (i < intervals.length) {
        result.add(intervals[i++]);
    }

    return result.toArray(new int[result.size()][]);
}
```

---

## 12.2 Array Greedy

**Pattern:** Scan the array maintaining a greedy invariant (farthest jump, surplus gas, candy needed).
**Jump Game strategy:** Track `farthest = max(farthest, i + nums[i])`. If you can reach end → true.
**Gas Station:** Total gas ≥ total cost → solution exists. Start from the point where deficit resets.

### Problem 194: Jump Game

**LeetCode 55** 🔗 https://leetcode.com/problems/jump-game/

```
┌────────────────────────────────────────────────────────────────┐
│  JUMP GAME - Can reach last index?                             │
├────────────────────────────────────────────────────────────────┤
│  nums = [2, 3, 1, 1, 4]                                        │
│                                                                │
│  Index:  0   1   2   3   4                                     │
│  Value:  2   3   1   1   4                                     │
│          └───┴───┘               From 0, can jump to 1 or 2    │
│              └───┴───┴───┘       From 1, can reach 4!          │
│                                                                │
│  Output: true                                                  │
│                                                                │
│  Greedy: Track max reachable index                             │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public boolean canJump(int[] nums) {
    int maxReach = 0;

    for (int i = 0; i < nums.length; i++) {
        if (i > maxReach) return false;  // Can't reach this index
        maxReach = Math.max(maxReach, i + nums[i]);
        if (maxReach >= nums.length - 1) return true;
    }

    return true;
}
```

---

### Problem 195: Jump Game II

**LeetCode 45** 🔗 https://leetcode.com/problems/jump-game-ii/

```
┌────────────────────────────────────────────────────────────────┐
│  JUMP GAME II - Minimum jumps to reach end                     │
├────────────────────────────────────────────────────────────────┤
│  nums = [2, 3, 1, 1, 4]                                        │
│                                                                │
│  Jump 1: 0 → 1 (jump to index 1)                               │
│  Jump 2: 1 → 4 (jump to index 4)                               │
│                                                                │
│  Output: 2 jumps                                               │
│                                                                │
│  Greedy: BFS-like level traversal                              │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int jump(int[] nums) {
    int jumps = 0;
    int currentEnd = 0;    // End of current jump range
    int farthest = 0;      // Farthest we can reach

    for (int i = 0; i < nums.length - 1; i++) {
        farthest = Math.max(farthest, i + nums[i]);

        if (i == currentEnd) {
            jumps++;
            currentEnd = farthest;
        }
    }

    return jumps;
}
```

---

### Problem 196: Gas Station

**LeetCode 134** 🔗 https://leetcode.com/problems/gas-station/

```
┌────────────────────────────────────────────────────────────────┐
│  GAS STATION - Find starting station for circular trip         │
├────────────────────────────────────────────────────────────────┤
│  gas  = [1, 2, 3, 4, 5]                                        │
│  cost = [3, 4, 5, 1, 2]                                        │
│                                                                │
│  Station: 0   1   2   3   4                                    │
│  net:    -2  -2  -2  +3  +3                                    │
│                                                                │
│  Start at station 3:                                           │
│  3→4: tank = 4-1 = 3                                           │
│  4→0: tank = 3+5-2 = 6                                         │
│  0→1: tank = 6+1-3 = 4                                         │
│  1→2: tank = 4+2-4 = 2                                         │
│  2→3: tank = 2+3-5 = 0 ✓                                       │
│                                                                │
│  Output: 3                                                     │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int canCompleteCircuit(int[] gas, int[] cost) {
    int totalTank = 0;
    int currentTank = 0;
    int startStation = 0;

    for (int i = 0; i < gas.length; i++) {
        int net = gas[i] - cost[i];
        totalTank += net;
        currentTank += net;

        if (currentTank < 0) {
            // Can't reach station i+1 from startStation
            startStation = i + 1;
            currentTank = 0;
        }
    }

    return totalTank >= 0 ? startStation : -1;
}
```

---

### Problem 197: Candy

**LeetCode 135** 🔗 https://leetcode.com/problems/candy/

```
┌────────────────────────────────────────────────────────────────┐
│  CANDY - Min candies for ratings                               │
├────────────────────────────────────────────────────────────────┤
│  ratings = [1, 0, 2]                                           │
│                                                                │
│  Rules:                                                        │
│  - Each child gets at least 1 candy                            │
│  - Higher rating than neighbor → more candies than neighbor    │
│                                                                │
│  Candies: [2, 1, 2]                                            │
│  Child 0: rating 1 > rating 0, gets 2                          │
│  Child 1: lowest rating, gets 1                                │
│  Child 2: rating 2 > rating 0, gets 2                          │
│                                                                │
│  Output: 5 total candies                                       │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int candy(int[] ratings) {
    int n = ratings.length;
    int[] candies = new int[n];
    Arrays.fill(candies, 1);

    // Left to right: handle increasing ratings
    for (int i = 1; i < n; i++) {
        if (ratings[i] > ratings[i-1]) {
            candies[i] = candies[i-1] + 1;
        }
    }

    // Right to left: handle decreasing ratings
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

🔬 **Section Challenge — 12.2 Array Greedy**

**Challenge 1 (Array Greedy — Gas Station):** LC 134: circular gas station. You can complete a circuit if `sum(gas) >= sum(cost)`. **Who** finds the start station? **What** is the greedy insight that makes O(n) possible without trying all starts?

<details><summary>Answer</summary>

**Greedy insight:** If you start at station `i` and run out of gas at station `j`, you CANNOT start at any station between `i` and `j`. Why? If starting at `i` fails at `j`, starting at any `k` between `i` and `j` means you SKIP the gas from stations `i` to `k-1`. Since those stations weren't enough to get you to `j+1` even WITH their gas contribution, having LESS gas from `k` onward certainly fails. **The algorithm:** Scan once. Track `total = sum(gas[i] - cost[i])` and `tank = current tank running balance`. If `tank < 0`, reset: set `start = i+1`, reset `tank = 0`. After full scan: if `total >= 0`, `start` is the answer (guaranteed unique). If `total < 0`, no solution. **Who finds the start:** The O(n) single-pass scan, resetting whenever we'd go negative. The key guarantee: if a solution exists, the last reset point is always the valid start. **This is greedy** because we make a local decision ("this station can't be the start") that permanently eliminates it without backtracking.

</details>
<details><summary>Answer</summary>

Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others.

</details>

## 12.3 String Greedy

**Pattern:** Process characters with greedy rules based on frequency or position.
**Partition Labels:** Track last occurrence of each char. Extend partition end to max last occurrence.
**Task Scheduler:** Most frequent task determines idle slots. Fill idle slots with other tasks.

### Problem 198: Partition Labels

**LeetCode 763** 🔗 https://leetcode.com/problems/partition-labels/

```
┌────────────────────────────────────────────────────────────────┐
│  PARTITION LABELS - Max partitions with unique chars           │
├────────────────────────────────────────────────────────────────┤
│  s = "ababcbacadefegdehijhklij"                                │
│                                                                │
│  Partition such that each letter appears in at most one part:  │
│  "ababcbaca" | "defegde" | "hijhklij"                          │
│       9           7           8                                │
│                                                                │
│  Output: [9, 7, 8]                                             │
│                                                                │
│  Greedy: Track last occurrence of each char                    │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public List<Integer> partitionLabels(String s) {
    // Find last occurrence of each character
    int[] lastIndex = new int[26];
    for (int i = 0; i < s.length(); i++) {
        lastIndex[s.charAt(i) - 'a'] = i;
    }

    List<Integer> result = new ArrayList<>();
    int start = 0, end = 0;

    for (int i = 0; i < s.length(); i++) {
        end = Math.max(end, lastIndex[s.charAt(i) - 'a']);

        if (i == end) {
            result.add(end - start + 1);
            start = i + 1;
        }
    }

    return result;
}
```

---

### Problem 199: Task Scheduler

**LeetCode 621** 🔗 https://leetcode.com/problems/task-scheduler/

```
┌────────────────────────────────────────────────────────────────┐
│  TASK SCHEDULER - Min time with cooldown                       │
├────────────────────────────────────────────────────────────────┤
│  tasks = ["A","A","A","B","B","B"], n = 2                      │
│                                                                │
│  Must wait n intervals before same task again                  │
│                                                                │
│  A → _ → _ → A → _ → _ → A                                     │
│  A → B → _ → A → B → _ → A → B                                 │
│  A → B → idle → A → B → idle → A → B                           │
│                                                                │
│  Output: 8 intervals                                           │
│                                                                │
│  Formula: (maxFreq - 1) * (n + 1) + countMaxFreq               │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int leastInterval(char[] tasks, int n) {
    int[] freq = new int[26];
    for (char task : tasks) {
        freq[task - 'A']++;
    }

    int maxFreq = 0;
    int countMax = 0;

    for (int f : freq) {
        if (f > maxFreq) {
            maxFreq = f;
            countMax = 1;
        } else if (f == maxFreq) {
            countMax++;
        }
    }

    // Formula: (maxFreq - 1) * (n + 1) + countMaxFreq
    int slots = (maxFreq - 1) * (n + 1) + countMax;

    return Math.max(slots, tasks.length);
}
```

---

🔬 **Section Challenge — 12.3 String Greedy**

**Challenge 1 (String Greedy — Task Scheduler):** LC 621: Task Scheduler. Tasks A-Z with cooldown n. **Who** determines the minimum time? **What** greedy choice maximizes CPU utilization?

<details><summary>Answer</summary>

**Greedy choice:** Always schedule the task with the HIGHEST remaining frequency. After each task, wait for cooldown before scheduling the same task again. Fill idle slots with the next most frequent tasks. **Formula (no simulation needed):** `time = max(n_tasks, (max_freq - 1) * (n + 1) + count_max_freq)`. Where `max_freq` = frequency of most common task, `count_max_freq` = number of tasks with that frequency, `n` = cooldown. **Why:** The most frequent task creates "mandatory idle" slots: you need `(max_freq - 1)` cooldown gaps of size `n`. Each gap can be filled with other tasks. If total tasks exceed the formula (many different tasks fill all gaps), no idle time is needed. **Who determines minimum:** The most frequent task acts as the bottleneck. All other tasks either fill gaps or extend beyond the minimum frame. **Example:** Tasks `[A=3, B=3, C=2]`, n=2. `max_freq=3`, `count_max=2`. Answer = `max(8, (3-1)*(2+1)+2) = max(8, 8) = 8`. Sequence: `A B C A B C A B`.

</details>
<details><summary>Answer</summary>

Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others.

</details>

## 12.4 Math Greedy

### Problem 200: Maximum Subarray (Kadane's - also DP)

**LeetCode 53** 🔗 https://leetcode.com/problems/maximum-subarray/

```
┌────────────────────────────────────────────────────────────────┐
│  MAXIMUM SUBARRAY - Kadane's as Greedy                         │
├────────────────────────────────────────────────────────────────┤
│  nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]                        │
│                                                                │
│  Greedy choice: At each position, decide to:                   │
│  - Extend previous subarray, OR                                │
│  - Start fresh from current element                            │
│                                                                │
│  If previous sum is negative, start fresh!                     │
│                                                                │
│  Max subarray: [4, -1, 2, 1] = 6                               │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int maxSubArray(int[] nums) {
    int maxSum = nums[0];
    int currentSum = nums[0];

    for (int i = 1; i < nums.length; i++) {
        // Greedy: extend or start fresh
        currentSum = Math.max(nums[i], currentSum + nums[i]);
        maxSum = Math.max(maxSum, currentSum);
    }

    return maxSum;
}
```

---

### Problem 201: Best Time to Buy and Sell Stock II

**LeetCode 122** 🔗 https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii/

```
┌────────────────────────────────────────────────────────────────┐
│  STOCK II - Multiple transactions allowed                      │
├────────────────────────────────────────────────────────────────┤
│  prices = [7, 1, 5, 3, 6, 4]                                   │
│                                                                │
│      7                                                         │
│       \    5       6                                           │
│        \  /\      /\                                           │
│         1   \   /    4                                         │
│              3                                                 │
│                                                                │
│  Buy at 1, sell at 5: profit = 4                               │
│  Buy at 3, sell at 6: profit = 3                               │
│  Total: 7                                                      │
│                                                                │
│  Greedy: Collect ALL positive differences                      │
└────────────────────────────────────────────────────────────────┘
```

**Solution:**

```java
public int maxProfit(int[] prices) {
    int profit = 0;

    for (int i = 1; i < prices.length; i++) {
        // Greedy: take every positive difference
        if (prices[i] > prices[i-1]) {
            profit += prices[i] - prices[i-1];
        }
    }

    return profit;
}
```

---

---

🔬 **Section Challenge — 12.4 Math Greedy**

**Challenge 1 (Math Greedy — Digit Maximization):** Given non-negative integer `n`, remove `k` digits to make the largest possible number. **Who** makes the greedy choice? **What** local decision guarantees the globally maximum result?

<details><summary>Answer</summary>

**Greedy choice:** To maximize, we want the LARGEST possible digit in each position from left to right. Use a monotonic decreasing stack: scan digits left to right. While the stack is non-empty AND top of stack < current digit AND we still have removals left — pop the stack (remove that digit). Push the current digit. **Why this is locally optimal = globally optimal:** If digit `d[i]` > `d[i-1]` (current digit is larger than the previous), removing `d[i-1]` gives us a larger leading digit in that position. A larger leading digit is ALWAYS better than any combination of smaller digits later. **Example:** `n = 1432219`, `k = 3`. Stack trace: push 1, push 4 (4>1, push), pop 4 and push 3? No — 3<4, push 3. Push 2... pop 3 (3>2, remove count=1), pop 4... wait: scan: `1 4 3 2 2 1 9`. On seeing `9`: pop `1` (k--), pop `2` (k--), pop `2` (k--). Result: `4 3 9` → `439`. **Who makes the choice:** A monotonic decreasing stack scan, O(n). Remove the smallest-place digit when a larger digit appears to its right.

</details>
<details><summary>Answer</summary>

Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others.

</details>

## 🏆 Competitive Programming — Codeforces Problems

| Problem                  | Link                                                         | Technique               | Difficulty  |
| ------------------------ | ------------------------------------------------------------ | ----------------------- | ----------- |
| Taxi                     | [CF 158B](https://codeforces.com/problemset/problem/158/B)   | Greedy pairing          | ⭐ Easy     |
| Vasya and String         | [CF 676C](https://codeforces.com/problemset/problem/676/C)   | Greedy + sliding window | ⭐⭐ Medium |
| Petya and Strings        | [CF 96A](https://codeforces.com/problemset/problem/96/A)     | Lexicographic greedy    | ⭐ Easy     |
| Potions                  | [CF 1526C](https://codeforces.com/problemset/problem/1526/C) | Greedy + min-heap       | ⭐⭐ Medium |
| Minimize the Permutation | [CF 1968B](https://codeforces.com/problemset/problem/1968/B) | Greedy on array         | ⭐⭐ Medium |
| Petya and Exam           | [CF 832B](https://codeforces.com/problemset/problem/832/B)   | Greedy time scheduling  | ⭐⭐ Medium |

---

## 🌍 Real-World Applications of Greedy Algorithms

| Technique                                           | Real-World System                  | How It's Used                                                         |
| --------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------- |
| **Interval scheduling (earliest deadline)**         | Calendar apps / meeting schedulers | Pack maximum non-overlapping meetings in a day                        |
| **Huffman coding**                                  | ZIP, gzip, JPEG compression        | Always merge the two least-frequent characters first                  |
| **Prim's/Kruskal's (MST)**                          | Network infrastructure planning    | Minimum cable to connect all offices                                  |
| **Dijkstra's (greedy relaxation)**                  | GPS navigation                     | At each step, pick the closest unvisited node                         |
| **Job scheduling (OS)**                             | CPU / task schedulers              | Shortest-job-first scheduling minimizes average wait time             |
| **Coin change (denominations designed for greedy)** | Currency systems worldwide         | US/EU coins designed so greedy works (unlike arbitrary denominations) |

```
🔥 HUFFMAN IN EVERY FILE YOU DOWNLOAD:
   Characters: 'e'→15%, 't'→10%, 'a'→8%, others less frequent

   Huffman greedy: always merge 2 rarest nodes into one
   Result: 'e' → "0" (1 bit), 't' → "10" (2 bits), rare chars → longer codes

   On average: ~2.5 bits/char instead of 8 bits = 68% compression
   "This is in EVERY .zip file, every HTTP gzip response, every JPEG"
```

---

---

🔬 **Section Challenge — 🌍 Real-World Applications of Greedy Algorithms**

**Challenge 1 (Huffman Coding Greedy):** Huffman coding uses a greedy algorithm to build a prefix-free encoding tree. **Who** proves that always merging the two lowest-frequency nodes is optimal? **What** property makes prefix-free codes possible?

<details><summary>Answer</summary>

**Who proves it optimal:** Exchange argument. In any optimal code tree, the two symbols with lowest frequency must be deepest (assigned longest codes). Swapping shallower symbols with the two lowest-frequency symbols into deeper positions reduces or maintains total weighted path length. Therefore always merging the two lowest first is optimal. **Greedy algorithm:** Min-heap of (frequency, node). Pop two minimums, merge into parent with combined frequency, push back. Repeat until one node. This is O(n log n) with a heap. **Prefix-free property:** In the Huffman tree, codes are only assigned to LEAF nodes. Since no leaf is an ancestor of another leaf, no code is a prefix of another. Bit strings are read left (0) / right (1) until a leaf is reached — unambiguous decoding. **Why greedy works here:** The cost function (sum of frequency \* depth) has "optimal substructure" — an optimal tree for n symbols contains optimal sub-trees for any subset. Combined with the greedy-choice property (always merge cheapest pair), this guarantees global optimality. Huffman is one of the few greedy algorithms with a formal optimality proof.

</details>
<details><summary>Answer</summary>

Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others.

</details>

---

### Historical Evolution

**Greedy algorithms** trace their origins to two independent lines of work in the late 1950s, both targeting optimization over combinatorial structures. David Huffman (1952) invented Huffman coding at MIT for his Information Theory term paper, greedily merging the two lowest-probability symbols at each step to build optimal prefix-free binary codes — a technique that remains the foundation of JPEG, PNG, MP3, and DEFLATE compression four decades later. Joseph Kruskal (1956) published his minimum spanning tree algorithm in the Proceedings of the American Mathematical Society, greedily adding the cheapest edge that does not form a cycle, with a proof via cut property that became a template for greedy correctness arguments across domains.

Robert Prim (1957) independently discovered the same MST problem using a different greedy strategy — growing a single component from a seed node — while Edsger Dijkstra (1959) formalized his shortest-path algorithm with a greedy relaxation approach that remains virtually unchanged in every production network routing implementation today (OSPF, IS-IS, and interior BGP rely on Dijkstra's SPF calculation). The theoretical framework unifying these disparate results — that a problem admits a greedy optimal solution if and only if it satisfies the matroid or greedoid structure — was established by Bernard Boruvka (1926, early MST work) and later generalized by Jack Edmonds (1971) through the theory of matroids and submodular optimization.

Modern practice anchors greedy algorithms in production systems at Google, Cisco, and Akamai: Dijkstra's algorithm routes billions of packets per second in internet infrastructure, Kruskal's and Prim's MST algorithms appear in network design and cluster analysis, and Huffman's coding underlies every major compression pipeline. Competitive programming platforms like LeetCode, Codeforces, and AtCoder regularly feature greedy problems (activity selection, fractional knapsack, Huffman encoding) as core algorithm challenges, with Huffman's greedy merge step a perennial interview favorite since the early 2010s.

---

### Production Reality

**Greedy Algorithms** patterns introduce several production failure modes that learners must internalize:

**Failure mode 1: Greedy optimality violation.** The classic counterexample is 0/1 knapsack: items with weights (10, 20, 30) and values (60, 100, 120) with capacity 50. Greedy by value/weight ratio picks item 1 (value 60) and is stuck — total value 60. Dynamic programming gets items 2+3 for value 220. Production impact: incorrect optimization results in revenue loss, resource overallocation, or scheduling failures when greedy is applied outside its valid domain.

**Failure mode 2: Comparator overflow in priority queues.** Dijkstra implementations commonly use `(dist[u] - dist[v])` for comparison. With distances reaching Integer.MAX_VALUE, subtracting a small distance from MAX_VALUE causes integer overflow, yielding negative values that corrupt the min-heap ordering. Production impact: routing tables become inconsistent; packets loop or drop. The 2019 Cloudflare outage was partially traceable to integer overflow in routing calculations.

**Failure mode 3: Negative-weight edge handling.** Dijkstra's algorithm with a standard min-heap silently produces wrong shortest paths on graphs with negative-weight edges. Production impact: GPS systems misroute vehicles near elevation changes; financial arbitrage systems compute incorrect paths. Bellman-Ford or SPFA must be used instead.

**Debug workflow:** Before committing to greedy: (1) formally prove the greedy-choice property — every local optimum leads to a global optimum; (2) prove optimal substructure — optimal solution contains optimal solutions to subproblems; (3) test the counterexample case: fractional vs. indivisible items; (4) use `Integer.compare(a, b)` instead of `a - b` in comparators to prevent overflow; (5) verify no negative weights exist before using Dijkstra; otherwise switch to Bellman-Ford.

**Real-world anchor:** Amazon's EC2 scheduler uses greedy bin-packing for instance placement. When capacity calculations overflow at scale boundaries, instances are incorrectly placed, causing "insufficient capacity" errors post-launch — a production incident affecting thousands of deployments in 2017.


---

## Reality Check

**"Greedy practice builds greedy instinct"** — Unchecked, it builds greedy OVERCONFIDENCE — the most expensive interview failure mode, because wrong greedy code looks clean and passes samples. The practice loop that works: for every greedy attempt, either sketch the exchange argument (swapping any deviation toward my choice never worsens) or hunt a 4-element counterexample for two minutes. Jump-game, gas-station, and task-scheduler all have one-line exchange arguments; problems like coin-change with arbitrary denominations have famous counterexamples. Practicing both verdicts is the point.

**"Sort by the obvious key and greed follows"** — Key CHOICE is the whole problem in half the set: intervals by end (not start) for max-non-overlapping, boats by pairing lightest-with-heaviest after sorting, queue-reconstruction by height DESC then k ASC with insert-at-index — each key choice carries the proof, and the plausible-but-wrong key fails specific inputs. When a greedy stalls, the first suspect is the sort key, not the loop.

**"Jump Game II needs careful pointer bookkeeping"** — It reads cleanest as IMPLICIT BFS: current reach is this level's frontier, farthest-seen is next level's, jumps count levels. That reframing eliminates the fencepost bugs of the pointer version and transfers directly to its cousins (minimum-refuels as levels of station choices). Recognizing when a greedy is secretly a BFS-on-levels is one of the quieter senior tells.

**"Candy and queue-reconstruction are one-off puzzles"** — They are the two canonical CONFLICTING-CONSTRAINTS techniques: candy resolves left-neighbor and right-neighbor constraints with two directional passes taking max; queue-reconstruction resolves height and count constraints by ordering one constraint then inserting to satisfy the other. Both moves — decompose-into-directional-passes and sort-one-insert-other — recur across scheduling and ranking problems; filing them as one-offs wastes the two most reusable tricks in the chapter.

**"If greedy passes all tests, the proof is academic"** — Judge acceptance is evidence, not proof — hidden tests share blind spots, and production inputs will not. The two-minute proof habit pays twice: in interviews, articulating WHY (exchange argument) is scored above the code itself; in production, greedy heuristics without correctness notes become load-bearing folklore nobody dares touch. Every greedy in this chapter deserves one sentence of why, written down.
