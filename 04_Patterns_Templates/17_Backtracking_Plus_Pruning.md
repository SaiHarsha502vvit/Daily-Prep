**Navigation**: [< Previous](16_DP_Pattern_Recognition.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](18_String_Plus_Advanced.md)

# Backtracking + Pruning — Combined Pattern Guide

**WHY this combination?** Backtracking explores ALL possibilities systematically. Pruning eliminates impossible branches early ⇒ can reduce exponential time dramatically. Together they solve constraint satisfaction problems.

### ⚠️ Constraint Lens

### Historical Evolution

**Inventor / Originator:** Backtracking was formalized by Solomon Golomb and Leonard Baumert (1965). Walker (1960) developed early backtracking algorithms. Knuth published Algorithm 245 (1965) for tree traversal. Tarjan (1972) analyzed backtracking complexity.

**Predecessor context:** Combinatorial problems (N-Queens, Sudoku, scheduling) required brute-force enumeration. The "try-explore-backtrack" framework was not recognized as a pattern.

**Evolution narrative:** Walker and Golomb-Baumert established backtracking as systematic state-space exploration. Knuth formalized the TreeSort algorithms. Pruning strategies (constraint propagation, forward checking) evolved from AI research in the 1970s-80s.

**Modern practice:** Backtracking powers SAT solvers (CDCL algorithm), constraint programming (OR-Tools CP-SAT), and game AI (minimax with alpha-beta pruning).

- **Walker 1960**: Early backtracking algorithm for combinatorial search
- **Golomb-Baumert 1965**: Formalized backtracking as systematic enumeration with pruning
- **Knuth Algorithm 245 — 1965**: Tree traversal patterns; foundational backtracking framework
- **Modern practice**: SAT solvers, Sudoku generators, N-Queens, scheduling with pruning

---

### Production Reality

**Pattern Mis-Selection Debug Workflow — How to identify the wrong pattern:**

When your solution is O(N²) when you expected O(N), or fails on specific inputs, the bug is usually pattern mis-selection, not code. Use this 5-step workflow:

1. **Check the constraint lens**: Did the input violate the pattern's prerequisite? (e.g., sorted input for two pointers, positive numbers for sliding window sum)
2. **Trace the failure input**: For the smallest failing case, identify which invariant broke. Does the algorithm assume the invariant that wasn't true?
3. **Measure the actual complexity**: Add a counter for the inner-loop iterations. O(N²) when O(N) expected usually means a redundant scan, not a wrong algorithm.
4. **Check edge cases the pattern doesn't cover**: Empty input, single element, all-same values, maximum/minimum values. These often reveal the wrong pattern.
5. **Escalate to a different pattern family**: If 4 steps don't fix it, the pattern itself is wrong. Switch to the pattern suggested by the constraint lens.

**Pattern-Specific Failure Modes:**

- **Stack overflow on n>10K recursion depth (JVM default stack ~1MB)** — Backtracking recursion depth equals the decision tree depth. For N-Queens on 15x15, depth=15 is fine. But pathological inputs can cause much deeper recursion. Detection: test with maximum allowed N; profile stack usage.

- **Pruning too aggressive → misses valid solutions** — Over-pruning removes branches that could contain valid solutions. Detection: compare result count with known solutions; if too few, pruning condition may be wrong.

- **Pruning too weak → exponential blowup** — Insufficient pruning causes exponential time growth. For subset sum, weak pruning leads to exploring all 2^n subsets. Detection: add solution count logging; exponential growth indicates weak pruning.

- **Shared mutable state across branches causes wrong answers** — Forgetting to undo mutations (e.g., `path.removeLast()`) between branches causes cross-contamination. Detection: verify state is identical before and after exploring each branch.

**Production Selection Heuristic:** Use backtracking for constraint satisfaction problems (N<=15-20). Always implement undo operations. Profile pruning effectiveness and adjust boundaries.

---

| Given Constraints                      | Do This                               |
| -------------------------------------- | ------------------------------------- |
| `N <= 10`                              | permutations/backtracking can pass    |
| `N <= 20`                              | subsets/bitmask/backtracking can pass |
| duplicates in candidates               | sort + skip duplicate branches        |
| need one solution only                 | return early                          |
| need count/best over repeated states   | memoization / DP                      |
| constraints allow pruning by sum/order | sort before search                    |

Full map: [Constraint-Based Pattern Selection](25_Constraint_Based_Pattern_Selection.md).

### 🧠 Deep Intuition — Why Backtracking Works

Backtracking is **exhaustive search done systematically**. Instead of generating all possible configurations and checking each one, it builds solutions incrementally and abandons ("backtracks from") partial solutions that can't possibly lead to valid complete solutions.

#### The State Space Tree — Visualizing the Search

Every backtracking problem can be visualized as a **tree of choices**:

- **Root** = empty solution
- **Each level** = one decision point (which element to pick, which position to place)
- **Each branch** = one choice at that decision point
- **Leaves** = complete solutions (or dead ends)

Backtracking performs a DFS on this tree. When it reaches a leaf (solution found or dead end), it backs up to the previous decision point and tries the next branch.

#### The CHOOSE-EXPLORE-UNCHOOSE Framework

Every backtracking template follows this exact pattern:

1. **CHOOSE**: Make a decision (add element to current solution, mark as used)
2. **EXPLORE**: Recurse to explore all consequences of that choice
3. **UN-CHOOSE**: Undo the decision (remove element, unmark) so the next iteration tries a different choice at the same position

The "un-choose" step is what makes backtracking work — it's what distinguishes it from regular DFS. Without it, the state would be permanently modified and future branches would be corrupted.

#### Why Pruning Is Critical — The Math

Without pruning, backtracking visits every node in the state space tree — O(n!) for permutations, O(2ⁿ) for subsets. With pruning, entire subtrees are skipped. For example, in N-Queens, checking column and diagonal conflicts before placing a queen eliminates ~50% of branches at each level. For a 4×4 board: brute force checks 4⁴ = 256 placements; with pruning, it checks only ~60.

💡 **Key insight:** The stronger your pruning, the closer backtracking approaches the performance of a smart algorithm. Techniques like constraint propagation (Sudoku) and bounding functions (branch-and-bound) can make exponential algorithms practical for large inputs.

---

## 🧠 WHEN TO RECOGNIZE

```
IF the problem says:
  ✅ "Generate all" combinations/permutations/subsets
  ✅ "Find all valid" arrangements
  ✅ "Place N queens" / "Solve sudoku"
  ✅ "Partition into groups"
  ✅ "Can we achieve X with constraints?"
THEN → Backtracking + Pruning
```

---

## 📐 CORE TEMPLATES

### Template 1: Subsets

```java
void subsets(int[] nums, int start, List<Integer> current, List<List<Integer>> result) {
    result.add(new ArrayList<>(current));  // every state is valid
    for (int i = start; i < nums.length; i++) {
        current.add(nums[i]);             // CHOOSE
        subsets(nums, i + 1, current, result);  // EXPLORE
        current.remove(current.size() - 1); // UN-CHOOSE (backtrack)
    }
}
```

### Template 2: Permutations

```java
void permute(int[] nums, boolean[] used, List<Integer> current, List<List<Integer>> result) {
    if (current.size() == nums.length) { result.add(new ArrayList<>(current)); return; }
    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;           // PRUNE: already used
        used[i] = true;
        current.add(nums[i]);            // CHOOSE
        permute(nums, used, current, result);  // EXPLORE
        current.remove(current.size() - 1);    // UN-CHOOSE
        used[i] = false;
    }
}
```

### Template 3: Combination Sum (with duplicates handling)

```java
void combinationSum(int[] nums, int target, int start, List<Integer> current, List<List<Integer>> result) {
    if (target == 0) { result.add(new ArrayList<>(current)); return; }
    for (int i = start; i < nums.length; i++) {
        if (nums[i] > target) break;    // PRUNE: too big (array sorted!)
        if (i > start && nums[i] == nums[i-1]) continue;  // PRUNE: skip duplicates
        current.add(nums[i]);
        combinationSum(nums, target - nums[i], i + 1, current, result); // i+1: each once
        current.remove(current.size() - 1);
    }
}
```

### Template 4: N-Queens (Constraint Propagation)

```java
void nQueens(int n, int row, boolean[] cols, boolean[] diag1, boolean[] diag2,
             List<String> board, List<List<String>> result) {
    if (row == n) { result.add(new ArrayList<>(board)); return; }
    for (int col = 0; col < n; col++) {
        if (cols[col] || diag1[row-col+n-1] || diag2[row+col]) continue;  // PRUNE
        cols[col] = diag1[row-col+n-1] = diag2[row+col] = true;
        board.add(buildRow(n, col));
        nQueens(n, row + 1, cols, diag1, diag2, board, result);
        board.remove(board.size() - 1);
        cols[col] = diag1[row-col+n-1] = diag2[row+col] = false;
    }
}
```

---

## 🔬 VISUAL: Backtracking Decision Tree

```
Subsets of [1,2,3]:

                    []
                 /  |  \
              [1]  [2]  [3]
             / \    |
        [1,2] [1,3] [2,3]
          |
      [1,2,3]

Each path from root = one subset
Backtrack = go up one level, try next branch

With PRUNING (target sum = 4, sorted [1,2,3,5]):
                    []
                 /  |  \  \
              [1]  [2]  [3] [5]←PRUNE(5>4)
             / \    |
        [1,2] [1,3]←OK(=4) [2,3]←PRUNE(5>4)
          |
      [1,2,3]←PRUNE(6>4)
```

---

## � FULL WALKTHROUGH: Combination Sum with Pruning

```
Problem: Find combinations that sum to target=7.
         candidates = [2, 3, 6, 7] (can reuse)

Approach: Backtracking with pruning. Sort first!
Decision tree (with pruning shown):

                         []
                    /    |    \    \
                  [2]   [3]   [6]  [7]✅
               /  |  \    |  \    |
           [2,2] [2,3] [2,6] [3,3] [3,6]❌PRUNE(9>7)
           /  \    |     ❌    |
      [2,2,2][2,2,3]✅ [2,3,3]❌  [3,3,3]❌PRUNE
        |
   [2,2,2,2]❌PRUNE(8>7)


WHY pruning matters:
  Without pruning: explore ALL 2^n combinations
  With pruning: skip entire subtrees where remaining sum < 0
  After sorting: if candidates[i] > remaining, ALL future
  candidates are also too big → break the loop!

Result: [[2,2,3], [7]] ✅

Time: O(n^(t/m)) where t=target, m=min candidate | Space: O(t/m)
```

---

## 🔬 FULL WALKTHROUGH 2: Permutations II — Handling Duplicates

```
Problem: Generate unique permutations of [1, 1, 2].

Approach: Sort first. Use boolean[] used.
          Skip nums[i] if: same as nums[i-1] AND nums[i-1] was NOT used.
          (This means we're at the SAME position trying the SAME value again.)

Decision tree (after sort: [1a, 1b, 2]):
   Position 0: Try 1a ✅
     Position 1: Try 1b ✅ → [1a,1b,2] ✅
                 Try 2 ✅ → [1a,2,1b] ✅
   Position 0: Try 1b ← SKIP! 1b==1a and 1a not used → duplicate branch
   Position 0: Try 2 ✅
     Position 1: Try 1a ✅ → [2,1a,1b] ✅
                 Try 1b ← SKIP! 1b==1a and 1a not used

  Result: [[1,1,2], [1,2,1], [2,1,1]] ✅ (3 unique, not 6)

WHY "not used" check? If 1a WAS used (at an earlier position), then 1b
at this position is a DIFFERENT choice. But if 1a was NOT used and we're
trying 1b at the same position → we'd generate the same subtree → skip!

Time: O(n! × n) | Space: O(n)
```

---

## 🛡️ EDGE CASES & COMMON MISTAKES

```
EDGE CASES:
┌────────────────────────────────┬───────────────────────────────────────────┐
│ Edge Case                      │ Handling                                  │
├────────────────────────────────┼───────────────────────────────────────────┤
│ Empty candidates/array         │ Return [[]] (one empty subset) or []      │
│ Target = 0                     │ Return [[]] (empty combination works)     │
│ All candidates > target        │ Return [] (no valid combination)          │
│ Single element                 │ Subsets: [[], [x]]. Perms: [[x]]          │
│ All duplicates [2,2,2]         │ Subsets: [[], [2], [2,2], [2,2,2]]        │
│ n=0 for N-Queens              │ Return [[]] (vacuously true)               │
└────────────────────────────────┴───────────────────────────────────────────┘

COMMON MISTAKES:
1. Not sorting before duplicate elimination → skip logic fails
2. Forgetting result.add(new ArrayList<>(current))
   MUST copy! current is mutable and gets modified by backtracking.
3. Wrong skip condition: i > start (subsets) vs !used[i-1] (permutations)
   Subsets/combos: skip if i > start && nums[i] == nums[i-1]
   Permutations: skip if !used[i-1] && nums[i] == nums[i-1]
4. N-Queens: only checking column, forgetting BOTH diagonals
   Need 3 sets: columns, diag (row-col), antiDiag (row+col)
5. Combination Sum: forgetting to pass i (not i+1) when reuse is allowed
```

---

## 📊 COMPLEXITY SUMMARY

| Problem            | Time       | Space  | Pruning Impact                      |
| ------------------ | ---------- | ------ | ----------------------------------- |
| Subsets            | O(n × 2ⁿ)  | O(n)   | Minimal                             |
| Subsets II (dedup) | O(n × 2ⁿ)  | O(n)   | Skips duplicate branches            |
| Permutations       | O(n × n!)  | O(n)   | Minimal                             |
| Combination Sum    | O(n^(t/m)) | O(t/m) | Sorting enables early break         |
| N-Queens           | O(n!)      | O(n)   | ~50% branches pruned                |
| Sudoku             | O(9^empty) | O(81)  | Constraint propagation helps hugely |

---

🔬 **Section Challenge — 📊 COMPLEXITY SUMMARY**

**Challenge 1 (Reasoning):** Prefix sum initialized as `prefix[0] = 0` — why the leading zero and not `prefix[0] = arr[0]`?

<details><summary>Answer</summary>

`prefix[0] = 0` (empty prefix) makes range sum formula uniform: `sum(l,r) = prefix[r+1] - prefix[l]`. Without the 0: `sum(0,r) = prefix[r] - 0` (special case needed). With it: `sum(0,r) = prefix[r+1] - prefix[0] = prefix[r+1]`. Same formula everywhere. This is the 'sentinel' pattern — adding a dummy initial value to eliminate special cases. Same trick used in dummy linked list nodes.

</details>

## 📋 PRACTICE PROBLEMS — From Your Excel Sheet

| #   | Problem                                                                                   | Key Insight                             |
| --- | ----------------------------------------------------------------------------------------- | --------------------------------------- |
| 1   | [Combination Sum II](https://leetcode.com/problems/combination-sum-ii/)                   | Sort + skip duplicates                  |
| 2   | [Subset Sum](https://practice.geeksforgeeks.org/problems/subset-sum-problem2014/1)        | Include/exclude each element            |
| 3   | [Combinations](https://leetcode.com/problems/combinations/)                               | Fixed size k selection                  |
| 4   | [Subsets II](https://leetcode.com/problems/subsets-ii/)                                   | Sort + skip duplicates at same level    |
| 5   | [M-Coloring](https://practice.geeksforgeeks.org/problems/m-coloring-problem-1587115620/1) | Graph coloring backtrack                |
| 6   | [Beautiful Arrangement](https://leetcode.com/problems/beautiful-arrangement/)             | Permutation with divisibility prune     |
| 7   | [Palindrome Partitioning](https://leetcode.com/problems/palindrome-partitioning/)         | Partition + isPalindrome check          |
| 8   | [Permutations II](https://leetcode.com/problems/permutations-ii/)                         | Sort + skip same value at same position |

### Hard

| #   | Problem                                                                                                       | Key Insight                        |
| --- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 9   | [Word Search II](https://leetcode.com/problems/word-search-ii/)                                               | Trie + DFS backtrack               |
| 10  | [Sudoku Solver](https://leetcode.com/problems/sudoku-solver/)                                                 | Constraint propagation + backtrack |
| 11  | [N-Queens](https://leetcode.com/problems/n-queens/)                                                           | Column + diagonal pruning          |
| 12  | [Unique Paths III](https://leetcode.com/problems/unique-paths-iii/)                                           | Visit all cells + backtrack        |
| 13  | [Max Number by K Swaps](https://www.geeksforgeeks.org/find-maximum-number-possible-by-doing-at-most-k-swaps/) | Swap + prune if no improvement     |
| 14  | [Partition K Equal Sum Subsets](https://www.geeksforgeeks.org/partition-set-k-subsets-equal-sum/)             | Bucket filling + sorting prune     |
| 15  | [Tug of War](https://www.geeksforgeeks.org/tug-of-war/)                                                       | Minimize subset sum difference     |
| 16  | [Corner to Middle in Maze](https://www.geeksforgeeks.org/find-paths-from-corner-cell-to-middle-cell-in-maze/) | Path finding backtrack             |
| 17  | [Cryptarithmetic Puzzle](https://www.geeksforgeeks.org/solving-cryptarithmetic-puzzles-backtracking-8/)       | Digit assignment + verify          |
| 18  | [Palindromic Partitions](https://www.geeksforgeeks.org/print-palindromic-partitions-string/)                  | Generate all palindrome partitions |

### Additional from Bonus Section

| #   | Problem                         | Key Insight                      |
| --- | ------------------------------- | -------------------------------- |
| 19  | Find path of more than K length | DFS + distance tracking          |
| 20  | Pattern matching without regex  | Character-by-character backtrack |

---

## 🔥 PRUNING TECHNIQUES

| Technique               | How                                               | Speedup                     |
| ----------------------- | ------------------------------------------------- | --------------------------- |
| **Sort first**          | Can break/skip when too large                     | Often 10x+                  |
| **Skip duplicates**     | `if (i > start && nums[i] == nums[i-1]) continue` | Avoids duplicate results    |
| **Constraint checking** | Check validity before recursion                   | Early termination           |
| **Bounding**            | If remaining can't meet target, skip              | Critical for optimization   |
| **Symmetry breaking**   | First element fixed                               | Eliminates mirror solutions |

---

## 🎯 INTERVIEW ARTICULATION — How to Explain Backtracking

**When the interviewer gives you a backtracking problem, say this:**

"This problem requires exploring all valid configurations. I'll use backtracking — which is DFS on the state space tree. At each level, I make a choice, recurse, then undo the choice (un-choose) to explore other branches. Pruning eliminates impossible branches early, dramatically reducing the effective search space."

**The CHOOSE-EXPLORE-UNCHOOSE framework:**
"For each candidate at position k: (1) CHOOSE — add it to the current solution and mark it used, (2) EXPLORE — recurse to fill position k+1, (3) UN-CHOOSE — remove it and unmark it. The un-choose step is critical — it's what distinguishes backtracking from simple DFS."

**Key mathematical justification:**

- "Without pruning: permutations = O(n!), subsets = O(2ⁿ), combinations = O(C(n,k)). These are inherently exponential — backtracking doesn't change that."
- "Pruning effectiveness: for N-Queens on 8×8, brute force checks 8⁸ ≈ 16 million; with column+diagonal pruning, it checks only ~15,000 — a 1000x improvement."
- "Sorting the input before backtracking enables skip-duplicate pruning: `if (i > start && nums[i] == nums[i-1]) continue` — this eliminates duplicate subsets/combinations."

**Common mistakes to proactively mention:**

- ❌ "Always UN-CHOOSE after recursion returns — forgetting this corrupts future branches."
- ❌ "To avoid duplicate combinations when input has duplicates: sort first, then skip equal elements at the same recursion level."
- ❌ "Permutations vs combinations: permutations = order matters (start from 0 each time), combinations = order doesn't matter (start from `i+1`)."

**Real-world applications:**

- Constraint satisfaction (Sudoku solvers, crossword generators)
- Compiler optimization (register allocation)
- Game AI (chess, Go — alpha-beta pruning is backtracking + bounding)
- Configuration testing (generate all valid configurations for test coverage)
- Route planning with constraints (vehicle routing with time windows)

---

📖 **Related Chapters:**

- [03_Algorithms/03a_Recursion_Internals.md](../03_Algorithms/03a_Recursion_Internals.md) — Recursion fundamentals
- [03_Algorithms/11_Backtracking_Complete.md](../03_Algorithms/11_Backtracking_Complete.md) — Backtracking deep dive

---

[← 16 DP Patterns](16_DP_Pattern_Recognition.md) | [18 String+Advanced →](18_String_Plus_Advanced.md)

---

> **Navigation**: [< Previous](16_DP_Pattern_Recognition.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](18_String_Plus_Advanced.md)
