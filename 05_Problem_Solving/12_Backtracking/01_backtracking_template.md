# Backtracking Template

> **Navigation**: [Chapter overview](../12_Backtracking.md) | [11.1 Subsets & Combinations →](02_subsets_combinations.md)
> Page 1 of 4 in **Backtracking**


def backtrack(path, choices):
if goal_reached:
result.add(path.copy())
return
for choice in choices:
if is_valid(choice):
path.add(choice) # Make choice
backtrack(path, choices) # Explore
path.remove(choice) # Undo choice

**Key Patterns**:

1. Subsets: Include or exclude each element
2. Permutations: Arrange elements in different orders
3. Combinations: Select k elements from n
4. Partition: Divide into groups
5. Constraint satisfaction: N-Queens, Sudoku

---

> 🔬 **Section Challenge — Backtracking Template**

**Challenge 1 (Reasoning):** In the template, `path.remove(choice)` is the "backtrack" step. What happens if you forget it? Walk through Subsets of `[1,2]` without the remove.

<details><summary>Answer</summary>

Without `path.remove()`, the path accumulates permanently. Trace: start with `[]`, add to result. Choose 1 → path=`[1]`, add to result. Choose 2 → path=`[1,2]`, add to result. Return from recursion — but path is STILL `[1,2]`. Now the outer loop tries i=1 (element 2), and adds 2 → path=`[1,2,2]`. Result: `[[], [1], [1,2], [1,2,2]]` — wrong! The "unchoose" step restores the state so sibling branches in the decision tree start from the SAME state. Without it, each branch **inherits mutations from its siblings**, violating the tree structure. This is why backtracking is called "exhaustive search with state restoration."

</details>

## PART 0: WHY Backtracking — The Algorithm for "Generate ALL Valid Answers"

> 🔬 **Section Challenge — PART 0: WHY Backtracking — The Algorithm for "Generate ALL Valid Answers"**

**Challenge 1 (Reasoning):** The table says "COUNT of valid combos → DP" and "ALL valid combos → Backtracking." But Combination Sum (LC 39) asks for ALL combos and CAN be solved with DP. When would you actually choose DP over backtracking for an "enumerate all" problem?

<details><summary>Answer</summary>

You wouldn't — and here's why. DP for "enumerate all" requires storing ALL paths in the DP table, which destroys DP's advantage (collapsing subproblems). If 50 different subproblem paths lead to the same state, DP collapses them into one entry for counting/optimizing, but must keep all 50 for enumeration — no savings. Backtracking generates each solution lazily (one at a time, O(solution_length) space per path), while DP-enumerate stores ALL simultaneously (O(total_output) space). The rule is precise: **if the output IS the set of solutions, use backtracking. If the output is a SCALAR (count, min, max), use DP.** The exception: if you need both (count + one example), use DP with parent pointer reconstruction.

</details>

## When Is Backtracking The Answer

**Signal**: "Generate ALL valid combinations/permutations/subsets"
If the problem says "find ALL", "list ALL", "generate ALL" → Backtracking.
DP finds the COUNT or BEST. Backtracking finds the ACTUAL solutions.
┬─────────────────┬
| Find... | Use | Why |
┼─────────────────┼
| Count of valid combos | DP | Don't need actual combos |
| Best/min/max value | DP or Greedy | One answer needed |
| ALL valid combos | BACKTRACKING | Must enumerate |
| ANY one valid answer | Backtracking | Stop at first found |
| Is a valid answer | Constraint prop | Sudoku, N-Queens |
| possible? | + Backtracking | |
┴─────────────────┴
REAL-WORLD BACKTRACKING:

- Sudoku solvers: Try a number, check constraints, undo if stuck
- Chess engines: Explore moves, evaluate, undo (minimax + pruning)
- Compiler regex: Match patterns by trying alternatives
- Combinatorial testing: Generate all test case combinations
- Circuit design: SAT solvers use backtracking with clause learning

> 🔬 **Section Challenge — When Is Backtracking The Answer**

**Challenge 1 (Reasoning):** The decision tree for Subsets of `[1,2,3]` has 2³=8 leaf nodes. For Permutations of `[1,2,3]` it has 3!=6 leaves. Both are "exhaustive search." Why does the tree shape differ so drastically?

<details><summary>Answer</summary>

The difference is the **branching factor at each level**. Subsets: at each level, you make a binary choice (include/exclude element i) → branching factor = 2 at every level → 2^n leaves. Permutations: at level 0 you choose from n elements, level 1 from n-1, level 2 from n-2... → branching factor decreases → n × (n-1) × ... × 1 = n! leaves. Subsets explore a **binary tree** (depth n, width 2). Permutations explore a **factorial tree** (depth n, decreasing width). This is why subsets of n=20 is feasible (2²⁰ ≈ 1M) but permutations of n=20 is not (20! ≈ 2.4 × 10¹⁸). The tree shape directly determines complexity.

</details>

## The Mental Model: Decision Tree Exploration

EVERY backtracking problem = exploring a DECISION TREE:
At each node: make a CHOICE (include/exclude, pick a number, place queen)
Leaf nodes: VALID solution → add to result OR DEAD END → backtrack
Example: Subsets of [1,2,3]
[]
╱ ╲
+1 skip 1
[1] []
╱ ╲ ╱ ╲
+2 skip 2 +2 skip 2
[1,2] [1] [2] []
╱ ╲ ╱ ╲ ╱ ╲ ╱ ╲
[1,2,3][1,2][1,3] [1] [2,3] [2] [3] []
Result: [[], [1], [2], [3], [1,2], [1,3], [2,3], [1,2,3]]

> 💡 **KEY INSIGHT: Backtracking = DFS on this decision tree.**
> PRUNING = skip branches that CANNOT lead to valid solutions.
> THE CHOOSE-EXPLORE-UNCHOOSE FRAMEWORK:
> for each option in choices:

**Choose**: add option to current path

**Explore**: recurse to next decision

**Unchoose**: remove option from current path (BACKTRACK!)

```java
// UNIVERSAL BACKTRACKING TEMPLATE
void backtrack(List<List<Integer>> result, List<Integer> current,
               int[] nums, int start) {
    // Base case: add current state to result (for subsets: always add)
    result.add(new ArrayList<>(current));  // COPY! (current will change)

    for (int i = start; i < nums.length; i++) {
        // PRUNE: skip duplicates (if input has duplicates)
        if (i > start && nums[i] == nums[i-1]) continue;

        current.add(nums[i]);              // CHOOSE
        backtrack(result, current, nums, i + 1);  // EXPLORE
        current.remove(current.size() - 1);        // UNCHOOSE (backtrack!)
    }
}
```

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ THE 4 TYPES OF BACKTRACKING PROBLEMS                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌──────────────────┬───────────────────────────┬───────────────────────┐     │
│ │ Type             │ Decision at each step     │ Avoid duplicates      │     │
│ ├──────────────────┼───────────────────────────┼───────────────────────┤     │
│ │ SUBSETS           │ Include or skip element i │ start from i+1        │    │
│ │ COMBINATIONS      │ Pick k from n             │ start from i+1        │    │
│ │ PERMUTATIONS      │ Place each unused element │ boolean[] used        │    │
│ │ CONSTRAINT SAT.   │ Try valid values at pos   │ isValid() check       │    │
│ └──────────────────┴───────────────────────────┴───────────────────────┘     │
│                                                                              │
│ WORKED EXAMPLES OF EACH:                                                     │
│                                                                              │
│ SUBSETS [1,2,3]: Start from index i. Include or skip.                        │
│   Each node can add to result → 2ⁿ = 8 subsets.                              │
│                                                                              │
│ COMBINATIONS (k=2): Same as subsets but only add when path.size() == k.      │
│   Result: [1,2], [1,3], [2,3]. Never go back to earlier indices.             │
│                                                                              │
│ PERMUTATIONS [1,2,3]: Can use any unused element at each position.           │
│   Position 0: try 1,2,3. Position 1: try remaining 2. Position 2: last 1.    │
│   Result: [1,2,3], [1,3,2], [2,1,3], [2,3,1], [3,1,2], [3,2,1].              │
│                                                                              │
│ N-QUEENS: Place queen in each row. Check no attacks.                         │
│   Row 0: try col 0,1,...,n-1. Row 1: try cols that don't conflict. Etc.      │
│   Prune: skip cols that are attacked by existing queens.                     │
│                                                                              │
│ HANDLING DUPLICATES (critical for variants):                                 │
│   Input [1,2,2]: Without handling → [1,2,2] appears twice.                   │
│   Fix: 1. SORT the input array first                                         │
│        2. Skip if nums[i] == nums[i-1] AND i > start                         │
│   This prunes duplicate branches at the SAME tree level.                     │
│                                                                              │
│   Visual:      [1, 2a, 2b]  (sorted)                                         │
│      Level 1: Try 1, Try 2a, SKIP 2b (same as 2a at this level)              │
│      Under 1: Try 2a, Try 2b (OK, different level)                           │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ ⚠️  COMMON MISTAKES IN BACKTRACKING                                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ MISTAKE 1: Forgetting to make a COPY when adding to result                   │
│   WRONG: result.add(current)     → current keeps changing!                   │
│   RIGHT: result.add(new ArrayList<>(current))                                │
│                                                                              │
│ MISTAKE 2: Wrong starting index for combinations/subsets                     │
│   Subsets: start from i+1 (don't pick same element again)                    │
│   Combo with repeat: start from i (CAN reuse same element)                   │
│   Permutations: start from 0 with used[] array                               │
│                                                                              │
│ MISTAKE 3: Not sorting before duplicate handling                             │
│   Duplicate skip works ONLY on sorted input.                                 │
│   [2,1,2] → skip logic breaks. Sort to [1,2,2] first.                        │
│                                                                              │
│ MISTAKE 4: Wrong pruning in N-Queens (forgetting diagonals)                  │
│   Must check: same column, same diagonal (r-c), same anti-diagonal (r+c).    │
│   Use HashSets for O(1) conflict checking.                                   │
│                                                                              │
│ MISTAKE 5: Stack overflow on deep recursion                                  │
│   Permutations of n=15 elements = 15! = 1.3 TRILLION → don't even try.       │
│   Always check constraints: n ≤ 8 for permutations, n ≤ 20 for subsets.      │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ COMPLEXITY — WHY THIS IS ALWAYS EXPONENTIAL                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌──────────────────┬──────────────────┬───────────────────────────┐          │
│ │ Problem Type     │ Time Complexity  │ Example for n=10          │          │
│ ├──────────────────┼──────────────────┼───────────────────────────┤          │
│ │ Subsets          │ O(n × 2ⁿ)       │ 10 × 1024 = 10,240      │             │
│ │ Combinations C(n,k)│ O(C(n,k) × k)│ C(10,5) × 5 = 1,260     │              │
│ │ Permutations     │ O(n × n!)       │ 10 × 3,628,800 = 36M    │             │
│ │ N-Queens         │ O(n!)           │ 10! = 3,628,800          │            │
│ │ Sudoku           │ O(9^empty)      │ Varies, heavily pruned   │            │
│ └──────────────────┴──────────────────┴───────────────────────────┘          │
│                                                                              │
│ Backtracking is EXPONENTIAL — but that's OK!                                 │
│ These problems fundamentally REQUIRE exponential output.                     │
│ The efficiency comes from PRUNING, not from avoiding exponential time.       │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ ⭐ EXPECTED OUTPUTS OF MASTERING BACKTRACKING ⭐                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ✅ Instantly classify: subsets / combinations / permutations / constraint     │
│ ✅ Write the Choose-Explore-Unchoose template from memory                     │
│ ✅ Handle duplicates with sort + skip pattern                                 │
│ ✅ Know when to use start index vs used[] array                               │
│ ✅ Implement N-Queens with proper pruning (cols, diags, anti-diags)           │
│ ✅ Always remember to COPY current list before adding to result               │
│                                                                              │
│ THE TRANSFORMATION:                                                          │
│ FROM: "I have no idea how to generate all combinations"                      │
│   TO: "This is a subsets problem. Sort, start from i+1, skip duplicates.     │
│        Choose-Explore-Unchoose. O(n × 2ⁿ)."                                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

📖 **Related theory:** [03_Algorithms/11_Backtracking_Complete.md](../../03_Algorithms/11_Backtracking_Complete.md) — Full backtracking theory with Choose-Explore-Unchoose framework

---

[Chapter overview](../12_Backtracking.md) | [11.1 Subsets & Combinations →](02_subsets_combinations.md)
