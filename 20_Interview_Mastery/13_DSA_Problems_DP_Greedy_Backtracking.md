> **Navigation**: [⬅ Trees, Graphs, Trie, Union-Find](12_DSA_Problems_Trees_Graphs_Trie_UnionFind.md) | [📚 Index](00_INDEX.md) | [Next: Binary Search, Two Pointers, Sliding Window ➡](14_DSA_Problems_BinarySearch_TwoPointers_SlidingWindow.md)

# File 13 — DSA Problems: Dynamic Programming, Greedy & Backtracking

## Logic-First, Code-Second: The 5W+H Way

> DP = "What are my choices at each step, and what state do I need to remember?"
> Greedy = "Can I make the locally best choice and still get globally best?"
> Backtracking = "Try everything, but prune impossible branches early."

---

## DYNAMIC PROGRAMMING

---

### Problem 1: Climbing Stairs

**WHAT**: You can climb 1 or 2 steps. How many distinct ways to reach the top?

**WHY DP works here**:
- To reach step n, you came from step n-1 (one step) or step n-2 (two steps)
- So ways(n) = ways(n-1) + ways(n-2) — it's Fibonacci!
- Overlapping subproblems: ways(5) needs ways(4) and ways(3), but ways(4) also needs ways(3)

**WHEN**: "Count ways" + "choices at each step" → DP.

**HOW — The Logic Chain**:
```
State definition: dp[i] = number of ways to reach step i
Transition: dp[i] = dp[i-1] + dp[i-2]
Base cases: dp[0] = 1, dp[1] = 1
Answer: dp[n]
```

**Space optimization**: Only need last two values → two variables instead of array.

**Interview narration**: "At each step I have 2 choices. The total ways to reach step n is the sum of ways to reach n-1 and n-2. This is a linear DP — I just track the last two values."

**The 5W+H DP Framework for EVERY DP Problem**:
```
WHAT: Define the state — what does dp[i] (or dp[i][j]) represent?
WHY:  Write the recurrence — how does dp[i] depend on smaller states?
WHEN: Identify base cases — what's known without computation?
WHERE: Direction of computation — bottom-up (tabulation) or top-down (memoization)?
WHO:  What's the answer? dp[n]? max of dp[]?
HOW:  Can we optimize space? Do we only need last row/value?
```

---

### Problem 2: House Robber

**WHAT**: Rob houses (can't rob two adjacent). Maximize money.

**WHY the "rob or skip" recurrence works**:
- At house i, two choices: ROB it (then skip i-1) or SKIP it (take best up to i-1)
- dp[i] = max(dp[i-2] + val[i], dp[i-1])

**HOW — The Logic Chain**:
```
State: dp[i] = max money from first i houses
Transition: dp[i] = max(dp[i-2] + nums[i], dp[i-1])
  → Rob house i: dp[i-2] + nums[i] (skip previous)
  → Skip house i: dp[i-1] (keep previous best)
Base: dp[0] = nums[0], dp[1] = max(nums[0], nums[1])
```

**Space optimization**: Two variables: `prev2` and `prev1`.

**Variant — House Robber II (circular)**: First and last are adjacent. Run twice: once excluding last house, once excluding first. Take max.

**Variant — House Robber III (tree)**: Each node returns (robThis, skipThis). robThis = val + skipLeft + skipRight. skipThis = max(robLeft, skipLeft) + max(robRight, skipRight).

---

### Problem 3: Coin Change

**WHAT**: Minimum coins to make amount. Unlimited supply of each denomination.

**WHY this is the unbounded knapsack family**:
- For each amount, try every coin. Take the option that gives minimum coins.
- dp[amount] = min over all coins c: dp[amount - c] + 1

**WHEN**: "Minimum/maximum" + "unlimited choices from a set" → Unbounded knapsack DP.

**HOW — The Logic Chain**:
```
State: dp[a] = minimum coins to make amount a
Transition: dp[a] = min(dp[a - coin] + 1) for all coins where coin ≤ a
Base: dp[0] = 0 (zero coins for zero amount)
Init: dp[1..amount] = ∞ (impossible until proven otherwise)
Answer: dp[amount] (if still ∞ → return -1)
```

**Why iterate amount 1→target**: Each subproblem only depends on SMALLER amounts. Bottom-up builds answers from small to large.

**Variant — Coin Change II (count ways)**: dp[a] += dp[a - coin]. Iterate coins in OUTER loop to avoid counting same combination multiple times.

---

### Problem 4: Longest Increasing Subsequence (LIS)

**WHAT**: Find length of longest strictly increasing subsequence.

**WHY O(n²) DP works**:
- dp[i] = LIS ending at index i
- For each j < i: if nums[j] < nums[i] → dp[i] = max(dp[i], dp[j] + 1)

**WHEN**: "Longest subsequence with ordering property" → DP or binary search.

**HOW — O(n²) Logic Chain**:
```
State: dp[i] = length of LIS ending at i
Transition: dp[i] = 1 + max(dp[j]) for all j < i where nums[j] < nums[i]
Base: dp[i] = 1 for all (each element alone is LIS of length 1)
Answer: max(dp[0..n-1])
```

**O(n log n) approach using patience sorting**:
```
Maintain an array "tails" where tails[i] = smallest possible tail of LIS of length i+1
For each number:
  → Binary search for position in tails
  → If num > all tails → append (extends longest LIS)
  → Else → replace the first tail ≥ num
Answer = tails.length
```

**Why patience sorting works**: The tails array is always sorted. By always replacing with the smallest possible value, we keep the most room for future elements. Binary search makes it O(n log n).

---

### Problem 5: 0/1 Knapsack

**WHAT**: Given items with weights and values, maximize value within weight capacity. Each item used at most once.

**WHY 2D DP captures "which items, how much capacity"**:
- State: dp[i][w] = max value using first i items with capacity w
- For each item: include it or exclude it

**HOW — The Logic Chain**:
```
State: dp[i][w] = max value from items 1..i with capacity w
Transition:
  → Don't take item i: dp[i][w] = dp[i-1][w]
  → Take item i (if weight[i] ≤ w): dp[i][w] = dp[i-1][w - weight[i]] + value[i]
  → dp[i][w] = max of both options
Base: dp[0][*] = 0 (no items → no value)
Answer: dp[n][W]
```

**Space optimization**: Since dp[i] only depends on dp[i-1], use 1D array. **Iterate w from RIGHT to LEFT** to avoid using updated values:
```
for each item:
  for w = W down to weight[i]:
    dp[w] = max(dp[w], dp[w - weight[i]] + value[i])
```

**Why right-to-left**: If left-to-right, dp[w - weight[i]] may already be updated for this item → effectively uses item multiple times (that's unbounded knapsack).

---

### Problem 6: Longest Common Subsequence (LCS)

**WHAT**: Find the longest subsequence present in both strings.

**WHY 2D table captures "compare prefixes"**:
- Compare s1[0..i] with s2[0..j]
- If characters match → extend previous diagonal answer
- If not → take the better of dropping one character from either string

**HOW — The Logic Chain**:
```
State: dp[i][j] = LCS of s1[0..i-1] and s2[0..j-1]
Transition:
  → If s1[i-1] == s2[j-1]: dp[i][j] = dp[i-1][j-1] + 1
  → Else: dp[i][j] = max(dp[i-1][j], dp[i][j-1])
Base: dp[0][*] = dp[*][0] = 0
Answer: dp[m][n]
```

**Space optimization**: Only need previous row → 1D array with careful updates.

**Reconstructing the actual subsequence**: Backtrack from dp[m][n]: if chars match → include it, move diagonal. If not → move in direction of larger dp value.

**Related**: Edit Distance uses same structure but with 3 operations (insert, delete, replace).

---

### Problem 7: Edit Distance

**WHAT**: Minimum insertions, deletions, replacements to transform word1 into word2.

**WHY it's like LCS but with operations**:
- Same 2D structure comparing prefixes
- If chars match → no operation needed (diagonal)
- If don't match → try all 3 operations, take minimum

**HOW — The Logic Chain**:
```
State: dp[i][j] = min ops to convert word1[0..i-1] to word2[0..j-1]
Transition:
  → If word1[i-1] == word2[j-1]: dp[i][j] = dp[i-1][j-1]
  → Else: dp[i][j] = 1 + min(
      dp[i-1][j-1],   ← replace
      dp[i-1][j],     ← delete from word1
      dp[i][j-1]      ← insert into word1
    )
Base: dp[i][0] = i (delete all), dp[0][j] = j (insert all)
```

**Interview insight**: Drawing the table makes this crystal clear. Interviewers love seeing you fill a small table on the whiteboard (e.g., "horse" → "ros").

---

### Problem 8: Word Break

**WHAT**: Can the string be segmented into space-separated dictionary words?

**WHY substring checking works**:
- dp[i] = "can s[0..i-1] be segmented?"
- For each position j from 0 to i-1: if dp[j] is true AND s[j..i] is in dictionary → dp[i] = true

**HOW — The Logic Chain**:
```
State: dp[i] = can we segment s[0..i-1]?
Transition: dp[i] = true if ∃ j where dp[j] == true AND s[j..i] ∈ dict
Base: dp[0] = true (empty string is valid)
Answer: dp[n]
```

**Optimization**: Instead of checking all j, iterate dictionary words for each position. If word length ≤ remaining and dp[i - word.length] is true and substring matches → dp[i] = true.

---

### Problem 9: Longest Palindromic Subsequence

**WHAT**: Find longest subsequence that reads the same forwards and backwards.

**WHY interval DP works**:
- dp[i][j] = LPS of s[i..j]
- If s[i] == s[j] → they wrap around the inner LPS: dp[i][j] = dp[i+1][j-1] + 2
- If not → dp[i][j] = max(dp[i+1][j], dp[i][j-1])

**HOW — The Logic Chain**:
```
Base: dp[i][i] = 1 (single char is palindrome of length 1)
Fill diagonally (increasing gap):
  → For gap = 1 to n-1:
    → For i = 0, j = i + gap:
      → If s[i] == s[j]: dp[i][j] = dp[i+1][j-1] + 2
      → Else: dp[i][j] = max(dp[i+1][j], dp[i][j-1])
Answer: dp[0][n-1]
```

**Alternative insight**: LPS of string s = LCS of s and reverse(s). If you know LCS, you already know LPS!

---

### Problem 10: Decode Ways

**WHAT**: Given string of digits, count interpretations as letters (1→A, ..., 26→Z).

**WHY it's like climbing stairs with conditions**:
- Single digit (1-9): one way to decode
- Two digits (10-26): another way to decode
- dp[i] = number of ways to decode first i characters

**HOW — The Logic Chain**:
```
State: dp[i] = ways to decode s[0..i-1]
Transition:
  → If s[i-1] ≠ '0': dp[i] += dp[i-1]  (single digit decode)
  → If s[i-2..i-1] forms 10-26: dp[i] += dp[i-2]  (two digit decode)
Base: dp[0] = 1 (empty = one way), dp[1] = (s[0] ≠ '0' ? 1 : 0)
```

**Edge cases**: '0' can't be decoded alone. '30' through '90' can't be two-digit decoded. These trip up most candidates.

---



> 🔬 **Section Challenge — DYNAMIC PROGRAMMING**
>
> **Challenge 1 (Reasoning):** How do you identify that a problem requires DP vs Greedy? What's the key test?
> <details><summary>Answer</summary>
>
> Greedy test: does the locally optimal choice always lead to the globally optimal solution? (Prove via exchange argument.) If yes → greedy. If making a local choice requires knowing future choices → DP. Example: Coin Change with standard coins [1,5,10,25] → greedy works (always pick largest). Coin Change with coins [1,3,4] and amount 6 → greedy picks 4+1+1=3 coins, optimal is 3+3=2 coins. Greedy fails → DP.
> </details>
>
> **Challenge 2 (Design):** You need to find the number of ways to climb N stairs taking 1 or 2 steps at a time. Define the DP state and recurrence.
> <details><summary>Answer</summary>
>
> State: `dp[i]` = number of ways to reach step i. Recurrence: `dp[i] = dp[i-1] + dp[i-2]` (come from step i-1 via 1 step, or from step i-2 via 2 steps). Base: `dp[0]=1` (one way: don't move), `dp[1]=1`. This is exactly Fibonacci. Space optimization: only need last 2 values → O(1) space.
> </details>
>

## GREEDY

---

### Problem 11: Jump Game

**WHAT**: Can you reach the last index? Each element = max jump length.

**WHY greedy "farthest reach" works**:
- Track the farthest index you can reach at any step
- At position i: farthest = max(farthest, i + nums[i])
- If i > farthest → you're stuck → false
- If farthest ≥ last index → true

**WHEN**: "Can you reach the end?" + "greedy forward progress" → Track reachable frontier.

**HOW — The Logic Chain**:
```
farthest = 0
For each i from 0 to n-1:
  → If i > farthest → return false (can't reach this position)
  → farthest = max(farthest, i + nums[i])
  → If farthest ≥ n-1 → return true
```

**Jump Game II (minimum jumps)**: Greedy BFS by levels. At each level, track the farthest you can reach. When you need to go beyond current level → jump, increase count.

---

### Problem 12: Activity Selection / Meeting Rooms II

**WHAT**: Find minimum number of meeting rooms needed for all intervals.

**WHY sorting + min-heap works**:
- Sort meetings by start time
- Heap tracks the END TIME of each room in use
- For each meeting: if earliest ending room ends before this meeting starts → reuse it
- Otherwise → allocate new room

**WHEN**: "Schedule overlapping intervals" + "minimize resources" → Sort + heap.

**HOW — The Logic Chain**:
```
Step 1: Sort by start time
Step 2: Min-heap of end times (one per room)
Step 3: For each meeting:
        → If heap.peek() ≤ meeting.start → heap.poll() (room freed)
        → heap.add(meeting.end)
Step 4: Return heap.size()
```

**Alternative — Event counting**: Create events: +1 for each start, -1 for each end. Sort all events. Sweep through, track running count. Maximum count = rooms needed.

---

### Problem 13: Partition Labels

**WHAT**: Partition string so each character appears in at most one part. Maximum number of parts.

**WHY last-occurrence + greedy works**:
- Precompute last occurrence of each character
- A partition must extend at least to the last occurrence of its first character
- As we scan, any character we encounter might push the partition end further

**HOW — The Logic Chain**:
```
Step 1: Map each character → its last index
Step 2: start = 0, end = 0
Step 3: For each i:
        → end = max(end, lastOccurrence[s[i]])
        → If i == end → this partition is complete
          → Record (end - start + 1), start = i + 1
```

**The insight**: The greedy choice is "a partition can't end until ALL characters in it have been fully contained." The last-occurrence map tells us how far each character forces the partition to extend.

---

### Problem 14: Gas Station (Circular Tour)

**WHAT**: Find starting gas station for a circular trip. gas[i] = fuel gained, cost[i] = fuel spent to next station.

**WHY single-pass greedy works**:
- If total gas ≥ total cost → solution ALWAYS exists (proven mathematically)
- Track surplus (running sum of gas - cost). If surplus goes negative → this start point failed, try next position as start
- The last starting point that doesn't fail is the answer

**HOW — The Logic Chain**:
```
totalSurplus = 0, currentSurplus = 0, start = 0
For each i:
  → totalSurplus += gas[i] - cost[i]
  → currentSurplus += gas[i] - cost[i]
  → If currentSurplus < 0:
    → start = i + 1
    → currentSurplus = 0
Return totalSurplus ≥ 0 ? start : -1
```

**Why the final start is correct**: If all starts from 0 to k fail, they consumed more than they gained. The remaining stations (k+1 to n-1) must have excess fuel that compensates. So starting at k+1 will reach the end AND circle back through the deficit stations.

---



> 🔬 **Section Challenge — GREEDY**
>
> **Challenge 1 (Reasoning):** Interval scheduling: select maximum number of non-overlapping intervals. Why does sorting by END time work, not by START time or duration?
> <details><summary>Answer</summary>
>
> Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others.
> </details>
>

## BACKTRACKING

---

### Problem 15: Subsets

**WHAT**: Generate all subsets of a set.

**WHY backtracking explores the decision tree**:
- For each element: include it or exclude it → 2 choices → 2^n subsets
- Recursion tree: at level i, make choice for element i, then move to i+1
- Base case: processed all elements → add current subset to result

**WHEN**: "Generate all combinations/subsets/permutations" → Backtracking.

**HOW — The Logic Chain**:
```
backtrack(start, currentSubset):
  → Add copy of currentSubset to result
  → For i from start to n-1:
    → currentSubset.add(nums[i])       ← CHOOSE
    → backtrack(i + 1, currentSubset)   ← EXPLORE
    → currentSubset.removeLast()        ← UN-CHOOSE (backtrack)
```

**Why start from `start` not 0**: To avoid duplicates. [1,2] and [2,1] are the same subset. By only looking forward, each combination is generated once.

**With duplicates (Subsets II)**: Sort first. Skip `nums[i]` if `nums[i] == nums[i-1]` and `i > start` (same-level duplicate).

---

### Problem 16: Permutations

**WHAT**: Generate all permutations of distinct numbers.

**WHY backtracking with "used" tracking**:
- Unlike subsets, order matters: [1,2] ≠ [2,1]
- At each position, any unused number can go here
- Track which numbers are used with a boolean array or swap technique

**HOW — The Logic Chain**:
```
backtrack(currentPerm, used):
  → If currentPerm.size == n → add copy to result
  → For i from 0 to n-1:
    → If used[i] → skip
    → used[i] = true
    → currentPerm.add(nums[i])
    → backtrack(currentPerm, used)
    → currentPerm.removeLast()
    → used[i] = false
```

**Duplicate handling (Permutations II)**: Sort first. Skip if `nums[i] == nums[i-1]` and `!used[i-1]` (prevents generating same permutation via different paths).

---

### Problem 17: Combination Sum

**WHAT**: Find all unique combinations that sum to target. Numbers can be reused.

**WHY backtracking with sum tracking**:
- At each step: choose a number (can reuse it), add to running sum
- If sum exceeds target → prune (stop this branch)
- If sum equals target → found a valid combination

**HOW — The Logic Chain**:
```
backtrack(start, remaining, current):
  → If remaining == 0 → add copy to result
  → If remaining < 0 → return (pruned)
  → For i from start to n-1:
    → current.add(candidates[i])
    → backtrack(i, remaining - candidates[i], current)  ← i not i+1 (reuse allowed)
    → current.removeLast()
```

**Combination Sum II (each number used once)**: Change `backtrack(i,...)` to `backtrack(i+1,...)` and add duplicate skipping.

---

### Problem 18: N-Queens

**WHAT**: Place N queens on N×N board so no two attack each other.

**WHY column-by-column placement + constraint tracking**:
- Place one queen per row (no two in same row guaranteed)
- Track used columns, used diagonals, used anti-diagonals
- Diagonal property: row - col is constant. Anti-diagonal: row + col is constant.

**HOW — The Logic Chain**:
```
backtrack(row):
  → If row == n → found valid placement, save it
  → For each col 0..n-1:
    → If col used OR (row-col) used OR (row+col) used → skip
    → Place queen: mark col, diagonal, anti-diagonal
    → backtrack(row + 1)
    → Remove queen: unmark all
```

**Diagonal insight**: All cells on the same diagonal (top-left to bottom-right) have the same `row - col` value. All cells on the same anti-diagonal have the same `row + col` value. Using sets for these = O(1) conflict check.

---

### Problem 19: Sudoku Solver

**WHAT**: Fill a 9×9 Sudoku grid satisfying row, column, and box constraints.

**WHY backtracking with constraint propagation**:
- Find next empty cell. Try digits 1-9. Check validity. Recurse.
- If no digit works → backtrack (this branch is dead)
- Constraint check: same row, column, and 3×3 box

**HOW — The Logic Chain**:
```
solve(board):
  → Find next empty cell (row, col)
  → If no empty cell → solved!
  → For digit 1 to 9:
    → If isValid(row, col, digit):
      → Place digit
      → If solve(board) → return true (solved!)
      → Remove digit (backtrack)
  → return false (no digit works → backtrack)

isValid(row, col, digit):
  → Not in row, not in column, not in 3×3 box
```

**Optimization**: Use bitmasks for constraint tracking instead of scanning row/col/box each time. Precompute available digits for each cell.

---




## MASTER PROBLEM MAP — DP, Greedy, Backtracking

| # | Problem | Core Logic | Family | Key Insight |
|---|---------|------------|--------|-------------|
| 1 | Climbing Stairs | ways(n) = ways(n-1) + ways(n-2) | Linear DP | Fibonacci in disguise |
| 2 | House Robber | rob or skip decision | Linear DP | max(skip prev, rob + 2-back) |
| 3 | Coin Change | min coins for each amount | Unbounded Knapsack | Try all coins, iterate amounts up |
| 4 | LIS | extend or not from each j < i | Subsequence DP | O(n log n) via patience sort |
| 5 | 0/1 Knapsack | take or skip each item | 0/1 Knapsack | 1D: iterate capacity RIGHT to LEFT |
| 6 | LCS | match → diagonal, else max(up, left) | Two-Sequence DP | Reconstruct by backtracking |
| 7 | Edit Distance | 3 operations at mismatch | Two-Sequence DP | Draw the table in interview |
| 8 | Word Break | check all word endings at each pos | String DP | dp[0]=true is the crucial base |
| 9 | Longest Palindromic Subseq | interval DP or LCS(s, reverse(s)) | Interval DP | Same as LCS of s and reversed s |
| 10 | Decode Ways | like stairs but with conditions | Linear DP | '0' edge cases are the trap |
| 11 | Jump Game | track farthest reachable | Greedy Frontier | i > farthest → stuck |
| 12 | Meeting Rooms II | sort + min-heap of end times | Greedy + Heap | heap size = rooms needed |
| 13 | Partition Labels | extend to last occurrence | Greedy Extend | Can't close until all chars covered |
| 14 | Gas Station | running surplus, reset on negative | Greedy Reset | total ≥ 0 guarantees solution exists |
| 15 | Subsets | include or exclude each element | Backtrack Generate | start parameter prevents duplicates |
| 16 | Permutations | try each unused element | Backtrack Generate | used[] array tracks availability |
| 17 | Combination Sum | reuse allowed, prune on excess | Backtrack Prune | i not i+1 for reuse |
| 18 | N-Queens | column + diagonal constraint sets | Backtrack Constrain | row-col and row+col identify diagonals |
| 19 | Sudoku Solver | try 1-9, validate, recurse | Backtrack Constrain | Bitmask for fast constraint check |

---



> 🔬 **Section Challenge — MASTER PROBLEM MAP — DP, Greedy, Backtracking**
>
> **Challenge 1 (Reasoning):** Interval scheduling: select maximum number of non-overlapping intervals. Why does sorting by END time work, not by START time or duration?
> <details><summary>Answer</summary>
>
> Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others.
> </details>
>

## The DP Decision Flowchart — Interview Logic

```
"Can I break this into smaller overlapping subproblems?"
  → YES: Is the answer built from optimal sub-answers?
    → YES → DP
    → Not sure → Still try DP, test with small examples
  → NO: "Can I always take the locally best choice?"
    → YES → Greedy (prove it works or find counterexample)
    → NO: "Do I need to try all possibilities?"
      → YES → Backtracking
      → NO → Maybe a different pattern (graph, math, etc.)
```

**How to identify DP state dimensions**:
- 1 changing parameter → 1D DP (climb stairs, house robber)
- 2 changing parameters → 2D DP (knapsack, LCS, edit distance)
- Interval problems → dp[i][j] for substring s[i..j]

---


---

## 🏋️ Practice & Interview Questions — Algorithms

### Sorting
**Q1.** Which sorting algorithm does Java use for `Arrays.sort(int[])`? Why not MergeSort?
<details><summary>Answer</summary>

**Dual-Pivot QuickSort** — for primitives. MergeSort requires O(N) extra space. QuickSort is in-place and cache-friendly. Stability doesn't matter for primitives (equal ints are indistinguishable). For objects (`Arrays.sort(Object[])`), Java uses **TimSort** (stable, O(N log N) worst).
</details>

**Q2.** Trace Merge Sort on `[4,2,7,1]`.
<details><summary>Answer</summary>

Split: `[4,2]` `[7,1]` → Split: `[4]` `[2]` `[7]` `[1]` → Merge: `[2,4]` `[1,7]` → Merge: `[1,2,4,7]`
</details>

**Q3.** ⭐⭐ Sort Colors (Dutch National Flag — 3-way partition).
<details><summary>Solution</summary>

```java
int lo=0, mid=0, hi=n-1;
while(mid<=hi){
    if(nums[mid]==0) swap(nums,lo++,mid++);
    else if(nums[mid]==1) mid++;
    else swap(nums,mid,hi--);
}
```
</details>

### Binary Search
**Q4.** ⭐ Search in Rotated Sorted Array.
<details><summary>Solution</summary>

```java
int lo=0, hi=n-1;
while(lo<=hi){
    int mid=(lo+hi)/2;
    if(nums[mid]==target) return mid;
    if(nums[lo]<=nums[mid]){ // left half sorted
        if(nums[lo]<=target&&target<nums[mid]) hi=mid-1; else lo=mid+1;
    } else { // right half sorted
        if(nums[mid]<target&&target<=nums[hi]) lo=mid+1; else hi=mid-1;
    }
}
return -1;
```
</details>

**Q5.** ⭐ Find First and Last Position (binary search twice).
<details><summary>Solution</summary>

```java
// First: find leftmost with while(lo<hi){ if arr[mid]>=target hi=mid else lo=mid+1 }
// Last: find rightmost with while(lo<hi){ if arr[mid]<=target lo=mid+1 else hi=mid } return lo-1
```
</details>

**Q6.** ⭐⭐ Koko Eating Bananas — binary search on answer.
<details><summary>Key insight</summary>

Binary search the eating speed k in range [1, max(piles)]. For each k, calculate hours needed. Find minimum k where hours ≤ H.
</details>

### Dynamic Programming
**Q7.** ⭐ Climbing Stairs — n steps, 1 or 2 at a time. How many ways?
<details><summary>Solution</summary>

```java
// Fibonacci sequence! dp[i] = dp[i-1] + dp[i-2]
int a=1, b=1;
for(int i=2;i<=n;i++){ int c=a+b; a=b; b=c; }
return b;
```
</details>

**Q8.** ⭐ Coin Change — minimum coins for amount.
<details><summary>Solution</summary>

```java
int[] dp = new int[amount+1]; Arrays.fill(dp, amount+1);
dp[0]=0;
for(int i=1;i<=amount;i++)
    for(int c:coins) if(c<=i) dp[i]=Math.min(dp[i],dp[i-c]+1);
return dp[amount]>amount?-1:dp[amount];
```
</details>

**Q9.** ⭐⭐ Longest Common Subsequence.
<details><summary>Solution</summary>

```java
int[][] dp=new int[m+1][n+1];
for(int i=1;i<=m;i++) for(int j=1;j<=n;j++){
    if(text1.charAt(i-1)==text2.charAt(j-1)) dp[i][j]=dp[i-1][j-1]+1;
    else dp[i][j]=Math.max(dp[i-1][j],dp[i][j-1]);
}
return dp[m][n];
```
</details>

**Q10.** ⭐⭐ Word Break — can string be segmented using dictionary words?
<details><summary>Solution</summary>

```java
boolean[] dp=new boolean[n+1]; dp[0]=true;
for(int i=1;i<=n;i++) for(String w:wordDict)
    if(i>=w.length()&&dp[i-w.length()]&&s.substring(i-w.length(),i).equals(w)) dp[i]=true;
return dp[n];
```
</details>

**Q11.** ⭐⭐⭐ Edit Distance (Levenshtein).
<details><summary>Solution</summary>

```java
int[][] dp=new int[m+1][n+1];
for(int i=0;i<=m;i++) dp[i][0]=i;
for(int j=0;j<=n;j++) dp[0][j]=j;
for(int i=1;i<=m;i++) for(int j=1;j<=n;j++){
    if(word1.charAt(i-1)==word2.charAt(j-1)) dp[i][j]=dp[i-1][j-1];
    else dp[i][j]=1+Math.min(dp[i-1][j-1],Math.min(dp[i-1][j],dp[i][j-1]));
}
```
</details>

### Graph Algorithms
**Q12.** ⭐ Number of Islands (BFS/DFS grid traversal).
<details><summary>Solution</summary>

```java
for each cell (i,j) if grid[i][j]=='1': count++; BFS/DFS to mark all connected land as visited
```
</details>

**Q13.** ⭐⭐ Course Schedule — detect cycle in directed graph (Topological sort).
<details><summary>Solution</summary>

```java
// Kahn's algorithm: indegree array + BFS queue
// If result size == numCourses → no cycle → can finish
```
</details>

**Q14.** ⭐⭐ Dijkstra's Shortest Path.
<details><summary>Solution</summary>

```java
PriorityQueue<int[]> pq=new PriorityQueue<>((a,b)->a[1]-b[1]); // [node, dist]
pq.offer(new int[]{src,0}); dist[src]=0;
while(!pq.isEmpty()){
    int[] curr=pq.poll(); int u=curr[0],d=curr[1];
    if(d>dist[u]) continue; // stale
    for(int[] neighbor:graph[u]) if(dist[u]+neighbor[1]<dist[neighbor[0]]){
        dist[neighbor[0]]=dist[u]+neighbor[1]; pq.offer(new int[]{neighbor[0],dist[neighbor[0]]});
    }
}
```
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | QuickSort avg/worst | O(N log N) avg, O(N²) worst |
| 2 | MergeSort space complexity | O(N) |
| 3 | HeapSort space complexity | O(1) (in-place) |
| 4 | Binary search precondition | Sorted array |
| 5 | BFS time complexity on graph | O(V+E) |
| 6 | DFS space complexity | O(V) (recursion stack) |
| 7 | Dijkstra fails on | Negative weight edges |
| 8 | Bellman-Ford handles | Negative weights, detects negative cycles |
| 9 | Floyd-Warshall use case | All-pairs shortest path, O(V³) |
| 10 | Topological sort requires | Directed Acyclic Graph (DAG) |



---

## 🧠 Deep Conceptual Questions — Algorithm Design & Analysis

**C1. What does O(N log N) "feel like" and why is it the complexity barrier for comparison-based sorting?**
<details><summary>Deep Answer</summary>

O(N log N) for N=1M ≈ 20M operations. O(N²) ≈ 1 trillion. The difference is 50,000x. **Comparison sort lower bound**: any comparison-based sort must distinguish between N! possible orderings. Each comparison has 2 outcomes. A decision tree with N! leaves needs ≥ log₂(N!) height ≈ N log N (Stirling's approximation). Therefore NO comparison sort can beat O(N log N) in the worst case. Non-comparison sorts (counting sort, radix sort, bucket sort) break this bound by using non-comparison operations — but require constraints on input (e.g., integer range bounded by N).
</details>

**C2. Greedy algorithms: when do they work and what must be proven?**
<details><summary>Deep Answer</summary>

A greedy algorithm makes the locally optimal choice at each step. Works when problem has: (1) **Greedy choice property**: local optimal leads to global optimal — the choice never needs to be revised. (2) **Optimal substructure**: optimal solution to the problem contains optimal solutions to subproblems. To PROVE greedy is correct: use "exchange argument" — assume optimal solution differs from greedy, show you can swap greedy's choice in without making it worse, contradiction. Greedy FAILS when: future choices depend on current choice in complex ways (use DP instead). Classic works: interval scheduling, Huffman coding, Dijkstra. Classic fails: 0-1 knapsack (use DP).
</details>

**C3. Dynamic Programming: what is "overlapping subproblems" and why does it matter?**
<details><summary>Deep Answer</summary>

Overlapping subproblems: the same sub-computation appears multiple times. Fibonacci: `fib(5)` calls `fib(4)` and `fib(3)`. `fib(4)` also calls `fib(3)`. Without memoization: `fib(3)` computed exponentially many times → O(2^N). With memoization: each sub-result computed once and stored → O(N). DP is valuable SPECIFICALLY when: (1) problem has optimal substructure AND (2) subproblems overlap. If no overlap: just use divide-and-conquer (merge sort's subproblems don't overlap → no DP needed). DP = "smart recursion" = avoid recomputing.
</details>

**C4. Top-down (memoization) vs Bottom-up (tabulation) DP — when to choose each?**
<details><summary>Deep Answer</summary>

**Top-down (memoization)**: Write natural recursion + cache results. Easy to implement, only computes needed subproblems (sparse computation). Cons: recursion overhead and stack depth risk. Use when: problem is naturally recursive, only a fraction of subproblems needed. **Bottom-up (tabulation)**: Fill DP table iteratively from base cases. No recursion overhead, better cache performance, easier space optimization. Use when: need all subproblems (or most of them), want to optimize space (can often reduce to 1D from 2D). Rule: start with top-down for correctness verification, optimize to bottom-up for performance.
</details>

**C5. Dijkstra's Algorithm: why does it fail on negative weights?**
<details><summary>Deep Answer</summary>

Dijkstra assumes: once a node is "settled" (extracted from the priority queue with its final shortest distance), that distance is optimal. With negative weights: settling node A at distance 5 might not be final — a path through B (distance 7) → C (edge -10) → A gives distance -3. But A was already settled! Dijkstra doesn't revisit settled nodes. Bellman-Ford handles negatives by relaxing ALL edges N-1 times — no "settled" assumption. For graphs with negative cycles: Bellman-Ford detects them (if distances still decrease after N-1 rounds, there's a negative cycle).
</details>

**C6. Union-Find: why is path compression + union by rank/size nearly O(1)?**
<details><summary>Deep Answer</summary>

**Path compression**: when finding the root of element x, make every node on the path point directly to the root. Flattens the tree. Future finds on those paths: O(1). **Union by rank**: always attach the smaller tree under the larger → limits tree height to O(log N). Combined: inverse Ackermann function α(N) amortized — so slow-growing it's practically constant (α(10^80) = 4). Neither alone is optimal: path compression without union by rank → O(log N) amortized. Union by rank without path compression → O(log N). Together → α(N) ≈ O(1) amortized. Used in: Kruskal's MST, cycle detection, connected components.
</details>

**C7. Binary Search on the Answer — what types of problems does it apply to?**
<details><summary>Deep Answer</summary>

When the answer space is **monotone**: "if X is achievable, then all values less extreme than X are also achievable." Problems: minimize the maximum (aggressive cows, split array), find minimum valid threshold (Koko bananas, minimum days to bloom), divide-and-conquer feasibility. Template: binary search on the answer range [lo, hi], for each mid check `isFeasible(mid)` in O(N) or O(N log N). Total: O(N log(answer_range)). Key insight: reframe "find optimal value" as "find smallest X where condition holds" → enables binary search on a non-array space.
</details>

**C8. Why does merge sort guarantee stability while quicksort doesn't?**
<details><summary>Deep Answer</summary>

**Merge sort stability**: during merge, when two elements are equal, we always take from the LEFT array first → preserves original relative order. **QuickSort instability**: the partition step swaps elements across the pivot without regard to original order. Two equal elements may be placed on opposite sides of the pivot, reversing their order. QuickSort CAN be made stable (Lomuto partition with careful implementation) but loses performance. Java uses TimSort for objects (stable), dual-pivot quicksort for primitives (stability irrelevant since primitives without fields).
</details>

**C9. Backtracking: what's the difference from plain DFS and when to use vs DP?**
<details><summary>Deep Answer</summary>

**Backtracking vs DFS**: DFS visits every path. Backtracking prunes paths early when a constraint is violated — avoids exploring infeasible branches. Same asymptotic but drastically different practical performance with good pruning. **Backtracking vs DP**: backtracking for **combinatorial/enumeration** problems (find all solutions, permutations, subsets). DP for **optimization** problems (find optimal single solution). Backtracking produces exponential solutions in worst case but is necessary when you need ALL solutions. DP finds the optimal in polynomial time when overlapping subproblems exist.
</details>

**C10. What is amortized analysis and how does it differ from average-case analysis?**
<details><summary>Deep Answer</summary>

**Amortized**: analyzes the average cost per operation over a SEQUENCE of operations — in the worst case. No probability involved. Guarantees: N operations ALWAYS take O(N·T) total, even if some individual operations are O(N·T). Example: ArrayList append is O(N) when resizing, but amortized O(1) because resizing is rare. **Average-case**: analyzes expected cost of a SINGLE operation assuming random input. QuickSort is O(N log N) average-case (random pivot). Amortized is a stronger guarantee — it holds even for adversarial input sequences.
</details>


> **Navigation**: [⬅ Trees, Graphs, Trie, Union-Find](12_DSA_Problems_Trees_Graphs_Trie_UnionFind.md) | [📚 Index](00_INDEX.md) | [Next: Binary Search, Two Pointers, Sliding Window ➡](14_DSA_Problems_BinarySearch_TwoPointers_SlidingWindow.md)
