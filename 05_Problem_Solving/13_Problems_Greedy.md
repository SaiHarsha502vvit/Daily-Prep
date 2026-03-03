> **Problems 13/14** | [Prev](12_Problems_Backtracking.md) | [Index](../00_MASTER_INDEX.md) | [Next](14_Problems_Mixed_Competitive.md)

---

# 📚 SECTION 12: GREEDY ALGORITHMS

```
┌─────────────────────────────────────────────────────────────────┐
│                    GREEDY FUNDAMENTALS                          │
├─────────────────────────────────────────────────────────────────┤
│  KEY INSIGHT:                                                   │
│  Make locally optimal choice at each step → Global optimum      │
│                                                                 │
│  WHEN TO USE GREEDY:                                            │
│  1. Optimal substructure: Optimal solution contains optimal     │
│     solutions to subproblems                                    │
│  2. Greedy choice property: Local optimal leads to global       │
│                                                                 │
│  COMMON PATTERNS:                                               │
│  - Interval scheduling (meetings, activities)                   │
│  - Huffman coding                                               │
│  - Minimum spanning tree (Kruskal's, Prim's)                    │
│  - Dijkstra's shortest path                                     │
│  - Fractional knapsack                                          │
│                                                                 │
│  ⚠️ GREEDY DOESN'T ALWAYS WORK:                                │
│  - 0/1 Knapsack → Need DP                                       │
│  - Longest path → Need DP/Backtracking                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## PART 0: WHY Greedy — The Algorithm That Feels Like Cheating (But Isn't)

```
╔══════════════════════════════════════════════════════════════════════════════╗
║        GREEDY PROBLEMS — COMPLETE UNDERSTANDING & GROWTH MINDSET             ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHY GREEDY PROBLEMS ARE TRICKY (AND IMPORTANT)                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ Greedy algorithms feel simple: "just pick the best choice."                │
│ The HARD PART: proving the greedy choice is CORRECT.                       │
│                                                                              │
│ Greedy appears in ~15% of interviews. The trap:                             │
│   - You often RECOGNIZE the greedy answer intuitively                      │
│   - But you can't PROVE it → interviewer asks "why does this work?"       │
│   - Or worse: you assume greedy works when it DOESN'T → wrong answer     │
│                                                                              │
│ TWO PROPERTIES REQUIRED (must have BOTH):                                   │
│ 1. GREEDY CHOICE PROPERTY: The locally best choice leads to global best    │
│ 2. OPTIMAL SUBSTRUCTURE: After making a choice, the remaining problem     │
│    is a smaller version of the same problem                                │
│                                                                              │
│ WORKS vs DOESN'T WORK:                                                      │
│ ┌────────────────────────┬────────────────────────────────────┐             │
│ │ ✅ Greedy WORKS        │ ❌ Greedy FAILS (need DP)          │             │
│ ├────────────────────────┼────────────────────────────────────┤             │
│ │ Activity Selection     │ 0/1 Knapsack                      │             │
│ │ Fractional Knapsack    │ Longest Increasing Subsequence     │             │
│ │ Huffman Coding         │ Coin Change (arbitrary coins)      │             │
│ │ Dijkstra's Algorithm   │ Edit Distance                     │             │
│ │ Kruskal's MST          │ Matrix Chain Multiplication       │             │
│ │ Jump Game I            │ Palindrome Partitioning min cuts  │             │
│ └────────────────────────┴────────────────────────────────────┘             │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ THE MENTAL MODEL: "Sort + Scan + Never Look Back"                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ Almost EVERY greedy problem follows this 3-step recipe:                     │
│                                                                              │
│   STEP 1: SORT the input by some criterion                                  │
│   STEP 2: SCAN left to right, making the best choice at each step          │
│   STEP 3: NEVER reconsider a past choice                                   │
│                                                                              │
│ The KEY is knowing HOW to sort:                                              │
│   Intervals:    Sort by END TIME → finish earliest, maximize room          │
│   Jump Game:    Don't sort! Scan L→R, track farthest reachable            │
│   Gas Station:  Scan L→R, track surplus (gas - cost). Reset at deficit.   │
│   Task Scheduler: Sort by frequency → schedule most frequent first        │
│   Assign Cookies: Sort both arrays → match smallest cookie to child      │
│                                                                              │
│ HOW TO VERIFY (Exchange Argument — the proof technique):                    │
│   "If I swap my greedy choice with any other choice, the solution         │
│    gets WORSE or stays the SAME → greedy is optimal."                    │
│                                                                              │
│ WORKED EXAMPLE — Activity Selection:                                        │
│   Activities: [(1,3), (2,5), (4,7), (6,8), (5,9)]                         │
│   Sort by end: [(1,3), (2,5), (4,7), (6,8), (5,9)]                        │
│                                                                              │
│   Pick (1,3) ✓ — ends earliest                                            │
│   Skip (2,5)   — starts before 3? No, 2 < 3 ❌ — WAIT, 2 < 3 so skip   │
│   Pick (4,7) ✓ — starts at 4 ≥ 3                                        │
│   Pick (6,8)   — starts at 6 < 7? YES → skip                             │
│   Skip (5,9)   — starts at 5 < 7 → skip                                  │
│   Result: [(1,3), (4,7)] = 2 activities                                    │
│                                                                              │
│   Proof: If we replaced (1,3) with (2,5), we'd free LESS room for        │
│   future activities. Swapping always makes it worse → greedy is correct. │
└──────────────────────────────────────────────────────────────────────────────┘
```

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
│ ┌──────────────────┬─────────────────────────────────┬───────────────────┐  │
│ │ Category         │ Sorting / Scanning Strategy     │ Problems          │  │
│ ├──────────────────┼─────────────────────────────────┼───────────────────┤  │
│ │ 1. INTERVALS     │ Sort by end time (or start time)│ 189-193           │  │
│ │                  │ Pick non-overlapping greedily   │ Meeting Rooms     │  │
│ │                  │                                  │ Merge Intervals   │  │
│ ├──────────────────┼─────────────────────────────────┼───────────────────┤  │
│ │ 2. ARRAY GREEDY  │ Scan L→R, track running state  │ 194-197           │  │
│ │                  │ (farthest reach, surplus, etc.) │ Jump Game         │  │
│ │                  │                                  │ Gas Station       │  │
│ ├──────────────────┼─────────────────────────────────┼───────────────────┤  │
│ │ 3. STRING/MATH   │ Problem-specific ordering       │ 198-201           │  │
│ │                  │ (frequency, digit removal, etc.)│ Task Scheduler    │  │
│ └──────────────────┴─────────────────────────────────┴───────────────────┘  │
│                                                                              │
│ PRIORITY: Master Intervals first — they appear in 50%+ of greedy Qs.      │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ ⚠️  COMMON MISTAKES IN GREEDY PROBLEMS                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ MISTAKE 1: Assuming greedy works without verifying                          │
│   WRONG: "Pick the highest-value item first."                              │
│   0/1 Knapsack counterexample: W=50. Items: (60,10), (100,20), (120,30). │
│   Greedy by value/weight picks 60+100=160. DP gets 100+120=220.           │
│   RULE: If items can't be split → probably NOT greedy.                    │
│                                                                              │
│ MISTAKE 2: Sorting by wrong criterion for intervals                        │
│   "Non-overlapping intervals" → sort by END time, not start time.         │
│   "Merge intervals" → sort by START time, not end time.                   │
│   Different problems need different sort keys!                             │
│                                                                              │
│ MISTAKE 3: Off-by-one in overlap detection                                  │
│   [1,5] and [5,8] — do they overlap?                                      │
│   If endpoints inclusive: YES (share point 5)                              │
│   If end-exclusive: NO (5 is end of first, start of second)              │
│   Always check problem definition! LeetCode usually: start ≤ x < end.   │
│                                                                              │
│ MISTAKE 4: Jump Game — forgetting that farthest updates continuously       │
│   Wrong: only check if current index == farthest                           │
│   Right: update farthest = max(farthest, i + nums[i]) at EVERY step      │
│   If i > farthest at any point → can't reach end.                        │
│                                                                              │
│ MISTAKE 5: Gas Station — brute force O(n²) when O(n) suffices             │
│   Key insight: if total gas ≥ total cost → answer always exists.          │
│   Track surplus. When it goes negative → restart from next station.      │
│   Single pass, O(n). Many candidates miss this optimization.              │
│                                                                              │
│ MISTAKE 6: Trying greedy on Coin Change with arbitrary denominations       │
│   Coins = [1, 3, 4], Amount = 6.                                          │
│   Greedy picks 4+1+1 = 3 coins. Optimal: 3+3 = 2 coins.                 │
│   Greedy only works for canonical coin systems (US coins: 1,5,10,25).     │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES IN LEARNING GREEDY                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 1. "How do I know if greedy works vs DP?"                                   │
│    → Try to find a counterexample. If you can swap the greedy choice with │
│      another and get a better answer → greedy fails, use DP.             │
│                                                                              │
│ 2. "The proof seems obvious but I can't formalize it"                      │
│    → Exchange argument: Assume optimal solution differs from greedy.      │
│      Show you can replace the different choice with greedy's choice       │
│      without making the solution worse. That's the full proof.            │
│                                                                              │
│ 3. "I keep getting TLE on interval problems"                                │
│    → Are you sorting? Unsorted intervals → O(n²) comparisons.           │
│      Sort by end time first → single O(n) pass after O(n log n) sort.   │
│                                                                              │
│ 4. "Jump Game II was way harder than Jump Game I"                           │
│    → Jump I = "can you reach end?" (track farthest). Jump II = "min     │
│      jumps to reach end?" (BFS-like greedy with level boundaries).       │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ ⭐ EXPECTED OUTPUTS OF MASTERING GREEDY ⭐                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ✅ Instantly distinguish Greedy vs DP based on counterexample thinking     │
│ ✅ Sort intervals by END time for scheduling, START time for merging       │
│ ✅ Write interval greedy template (sort + scan + lastEnd) from memory      │
│ ✅ Solve Jump Game in O(n) with farthest-reachable tracking                │
│ ✅ Explain exchange argument proof at whiteboard                           │
│ ✅ Recognize when greedy FAILS and pivot to DP                             │
│                                                                              │
│ THE TRANSFORMATION:                                                          │
│ FROM: "I always try greedy and sometimes it's wrong"                        │
│   TO: "I check greedy-choice property + optimal substructure. If both     │
│        hold, I sort by the right key, scan once, never look back.         │
│        If not, I reach for DP and can explain WHY."                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

📖 **Related theory:** [03_Algorithms/12_Greedy_Algorithms_Complete.md](../03_Algorithms/12_Greedy_Algorithms_Complete.md) — Full greedy theory with exchange argument proofs

---

## 12.1 Interval Problems

> **Pattern:** Sort by end time. Greedily pick non-overlapping intervals.
> **Key insight:** Finishing earliest leaves the most room for future activities.
> **Template:** Sort by `end`, keep `lastEnd`, skip if `start < lastEnd`.

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
│              8──10                                              │
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

> **Pattern:** Scan the array maintaining a greedy invariant (farthest jump, surplus gas, candy needed).
> **Jump Game strategy:** Track `farthest = max(farthest, i + nums[i])`. If you can reach end → true.
> **Gas Station:** Total gas ≥ total cost → solution exists. Start from the point where deficit resets.

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

## 12.3 String Greedy

> **Pattern:** Process characters with greedy rules based on frequency or position.
> **Partition Labels:** Track last occurrence of each char. Extend partition end to max last occurrence.
> **Task Scheduler:** Most frequent task determines idle slots. Fill idle slots with other tasks.

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

