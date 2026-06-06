> **Navigation**: [< Previous](11_Dynamic_Programming.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](13_Greedy.md)

> **Problems 12/14** | [Prev](11_Dynamic_Programming.md) | [Index](../00_MASTER_INDEX.md) | [Next](13_Greedy.md)

---

## 🗺️ Pattern Recognition Header — Backtracking

> **Is this a Backtracking problem?**
>

| Signal | Type | Template |
|---|---|---|
| `generate ALL subsets / power set` | Subsets | start from `i+1`, always add to result |
| `generate ALL combinations of k` | Combinations | start from `i+1`, add when `path.size()==k` |
| `generate ALL permutations` | Permutations | `boolean[] used`, start from 0 |
| `partition into valid parts` | Partition BT | Try every cut, check validity |
| `N-Queens / Sudoku solver` | Constraint Sat | isValid() + backtrack |

>
> **The 3-Step Mental Model:**
> ```
> 1. CHOOSE   → Add option to current path
> 2. EXPLORE  → Recurse to next decision
> 3. UNCHOOSE → Remove from path (this is the "backtrack"!)
>
> DP vs Backtracking:
>   COUNT/BEST of combos → DP
>   LIST ALL actual combos → Backtracking
> ```
>
> 📖 **Mental Model:** [01_Recursion_Tree_Thinking.md](../14_Mental_Models/01_Recursion_Tree_Thinking.md)
> 📖 **Greedy vs DP Decision:** [11_Greedy_vs_DP_Decision.md](../14_Mental_Models/11_Greedy_vs_DP_Decision.md)
> 📖 **Full Pattern Guide:** [00_PATTERN_MASTER_GUIDE.md](../04_Patterns_Templates/00_PATTERN_MASTER_GUIDE.md)

---






> 🔬 **Section Challenge — 🗺️ Pattern Recognition Header — Backtracking**

**Challenge 1 (Reasoning):** The pattern table says subsets use `start from i+1` while permutations use `boolean[] used`. Why can't permutations just use `start from 0` without a used array?
<details><summary>Answer</summary>

If permutations used `start from 0` without tracking, the loop would revisit already-placed elements. For `[1,2,3]`: after choosing 1 at position 0, the recursive call starts from 0 again and picks 1 *again* → `[1,1,...]`. The `used[]` array prevents this: `used[0]=true` blocks re-selection of index 0. Subsets don't need `used[]` because `start=i+1` inherently moves forward — you never revisit earlier indices. The deep insight: **subsets care about which elements are IN the set (order doesn't matter)**, so forward-only traversal avoids duplicates naturally. **Permutations care about ORDER**, so every position must consider every unused element.
</details>

# 📚 SECTION 11: BACKTRACKING PROBLEMS

## Backtracking Template

def backtrack(path, choices):
if goal_reached:
result.add(path.copy())
return
for choice in choices:
if is_valid(choice):
path.add(choice)         # Make choice
backtrack(path, choices) # Explore
path.remove(choice)      # Undo choice

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
| Find...               | Use             | Why |
┼─────────────────┼
| Count of valid combos | DP              | Don't need actual combos |
| Best/min/max value    | DP or Greedy    | One answer needed |
| ALL valid combos      | BACKTRACKING    | Must enumerate |
| ANY one valid answer  | Backtracking    | Stop at first found |
| Is a valid answer     | Constraint prop | Sudoku, N-Queens |
| possible?             | + Backtracking  | |
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
Leaf nodes:   VALID solution → add to result  OR  DEAD END → backtrack
Example: Subsets of [1,2,3]
[]
╱           ╲
+1               skip 1
[1]                  []
╱     ╲            ╱      ╲
+2      skip 2     +2       skip 2
[1,2]     [1]       [2]        []
╱    ╲    ╱   ╲     ╱   ╲     ╱   ╲
[1,2,3][1,2][1,3] [1] [2,3] [2] [3]  []
Result: [[], [1], [2], [3], [1,2], [1,3], [2,3], [1,2,3]]

> 💡 **KEY INSIGHT: Backtracking = DFS on this decision tree.**
PRUNING = skip branches that CANNOT lead to valid solutions.
THE CHOOSE-EXPLORE-UNCHOOSE FRAMEWORK:
for each option in choices:

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

📖 **Related theory:** [03_Algorithms/11_Backtracking_Complete.md](../03_Algorithms/11_Backtracking_Complete.md) — Full backtracking theory with Choose-Explore-Unchoose framework

---

## 11.1 Subsets & Combinations

> **Pattern:** "Start index" technique — pass `start` parameter to avoid picking previous elements.
> For duplicates: sort first, then skip `nums[i] == nums[i-1]` at same recursion level.

### Problem 176: Subsets

**LeetCode 78** 🔗 https://leetcode.com/problems/subsets/

```
┌────────────────────────────────────────────────────────────────┐
│  SUBSETS - All possible subsets (power set)                    │
├────────────────────────────────────────────────────────────────┤
│  nums = [1, 2, 3]                                              │
│                                                                │
│  Decision Tree:                                                │
│                    []                                          │
│           ┌────────┴────────┐                                  │
│        include 1         skip 1                                │
│          [1]               []                                  │
│       ┌───┴───┐        ┌───┴───┐                               │
│      [1,2]   [1]      [2]     []                               │
│     ┌─┴─┐   ┌─┴─┐   ┌─┴─┐   ┌─┴─┐                              │
│  [1,2,3][1,2][1,3][1][2,3][2] [3] []                           │
│                                                                │
│  Output: [[], [1], [2], [3], [1,2], [1,3], [2,3], [1,2,3]]     │
└────────────────────────────────────────────────────────────────┘
```


**Solution:**

```java
public List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(nums, 0, new ArrayList<>(), result);
    return result;
}

private void backtrack(int[] nums, int start, List<Integer> path,
                       List<List<Integer>> result) {
    result.add(new ArrayList<>(path));

    for (int i = start; i < nums.length; i++) {
        path.add(nums[i]);
        backtrack(nums, i + 1, path, result);
        path.remove(path.size() - 1);
    }
}
```

---

### Problem 177: Subsets II (With Duplicates)

**LeetCode 90** 🔗 https://leetcode.com/problems/subsets-ii/

```
┌────────────────────────────────────────────────────────────────┐
│  SUBSETS II - Skip duplicates                                  │
├────────────────────────────────────────────────────────────────┤
│  nums = [1, 2, 2]                                              │
│                                                                │
│  Without skip: [1,2], [1,2] would appear twice                 │
│  Key: Skip nums[i] if nums[i] == nums[i-1] at same level       │
│                                                                │
│  Output: [[], [1], [1,2], [1,2,2], [2], [2,2]]                 │
└────────────────────────────────────────────────────────────────┘
```


**Solution:**

```java
public List<List<Integer>> subsetsWithDup(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(nums);  // Sort to handle duplicates
    backtrack(nums, 0, new ArrayList<>(), result);
    return result;
}

private void backtrack(int[] nums, int start, List<Integer> path,
                       List<List<Integer>> result) {
    result.add(new ArrayList<>(path));

    for (int i = start; i < nums.length; i++) {
        // Skip duplicates at same level
        if (i > start && nums[i] == nums[i-1]) continue;

        path.add(nums[i]);
        backtrack(nums, i + 1, path, result);
        path.remove(path.size() - 1);
    }
}
```

---

### Problem 178: Combination Sum

**LeetCode 39** 🔗 https://leetcode.com/problems/combination-sum/

```
┌────────────────────────────────────────────────────────────────┐
│  COMBINATION SUM - Unlimited use of each number                │
├────────────────────────────────────────────────────────────────┤
│  candidates = [2, 3, 6, 7], target = 7                         │
│                                                                │
│  Can reuse same number:                                        │
│  2 + 2 + 3 = 7 ✓                                               │
│  7 = 7 ✓                                                       │
│                                                                │
│  Output: [[2,2,3], [7]]                                        │
└────────────────────────────────────────────────────────────────┘
```


**Solution:**

```java
public List<List<Integer>> combinationSum(int[] candidates, int target) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(candidates, target, 0, new ArrayList<>(), result);
    return result;
}

private void backtrack(int[] candidates, int remain, int start,
                       List<Integer> path, List<List<Integer>> result) {
    if (remain == 0) {
        result.add(new ArrayList<>(path));
        return;
    }

    for (int i = start; i < candidates.length; i++) {
        if (candidates[i] > remain) continue;

        path.add(candidates[i]);
        backtrack(candidates, remain - candidates[i], i, path, result);
        path.remove(path.size() - 1);
    }
}
```

---

### Problem 179: Combination Sum II

**LeetCode 40** 🔗 https://leetcode.com/problems/combination-sum-ii/

```
┌────────────────────────────────────────────────────────────────┐
│  COMBINATION SUM II - Each number used once                    │
├────────────────────────────────────────────────────────────────┤
│  candidates = [10,1,2,7,6,1,5], target = 8                     │
│                                                                │
│  Output: [[1,1,6], [1,2,5], [1,7], [2,6]]                      │
│                                                                │
│  Key: Sort + skip duplicates at same level                     │
└────────────────────────────────────────────────────────────────┘
```


**Solution:**

```java
public List<List<Integer>> combinationSum2(int[] candidates, int target) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(candidates);
    backtrack(candidates, target, 0, new ArrayList<>(), result);
    return result;
}

private void backtrack(int[] candidates, int remain, int start,
                       List<Integer> path, List<List<Integer>> result) {
    if (remain == 0) {
        result.add(new ArrayList<>(path));
        return;
    }

    for (int i = start; i < candidates.length; i++) {
        if (candidates[i] > remain) break;
        if (i > start && candidates[i] == candidates[i-1]) continue;

        path.add(candidates[i]);
        backtrack(candidates, remain - candidates[i], i + 1, path, result);
        path.remove(path.size() - 1);
    }
}
```

---

### Problem 180: Combinations

**LeetCode 77** 🔗 https://leetcode.com/problems/combinations/

```
┌────────────────────────────────────────────────────────────────┐
│  COMBINATIONS - Choose k from n                                │
├────────────────────────────────────────────────────────────────┤
│  n = 4, k = 2                                                  │
│  Choose 2 numbers from [1, 2, 3, 4]                            │
│                                                                │
│  Output: [[1,2], [1,3], [1,4], [2,3], [2,4], [3,4]]            │
└────────────────────────────────────────────────────────────────┘
```


**Solution:**

```java
public List<List<Integer>> combine(int n, int k) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(n, k, 1, new ArrayList<>(), result);
    return result;
}

private void backtrack(int n, int k, int start, List<Integer> path,
                       List<List<Integer>> result) {
    if (path.size() == k) {
        result.add(new ArrayList<>(path));
        return;
    }

    // Pruning: need k-path.size() more elements
    for (int i = start; i <= n - (k - path.size()) + 1; i++) {
        path.add(i);
        backtrack(n, k, i + 1, path, result);
        path.remove(path.size() - 1);
    }
}
```

---






> 🔬 **Section Challenge — 11.1 Subsets & Combinations**

**Challenge 1 (Reasoning):** In Combination Sum II (LC 40), the skip condition is `if (i > start && nums[i] == nums[i-1]) continue`. Why `i > start` and not `i > 0`? What breaks if you use `i > 0`?
<details><summary>Answer</summary>

With `i > 0`: for input `[1,1,6]` target 8, at the root level (start=0), i=1 sees `nums[1]==nums[0]` (both 1) and skips. Result: you can never pick TWO 1s, so `[1,1,6]` is missing from the output. With `i > start`: at root (start=0), i=1 is NOT `> start=0` in the skip-sense — wait, actually `1 > 0` is true but the condition is `i > start`, and start=0, so it would skip. No — the key: when we RECURSE after choosing `nums[0]=1`, the next call has `start=1`. Now at i=1, `i > start` is `1 > 1` = FALSE, so we DON'T skip — we CAN pick the second 1. `i > start` means "skip duplicates only among *siblings* (same recursion level)," not across parent-child. `i > 0` would skip duplicates globally, preventing valid combinations like `[1,1,6]`.
</details>

## 11.2 Permutations

> **Pattern:** Use a `boolean[] used` array to track which elements are already placed.
> For duplicates: sort first, then skip `nums[i] == nums[i-1] && !used[i-1]`.
> **Key insight:** Unlike subsets, ORDER matters in permutations, so always start from index 0.

### Problem 181: Permutations

**LeetCode 46** 🔗 https://leetcode.com/problems/permutations/

```
┌────────────────────────────────────────────────────────────────┐
│  PERMUTATIONS - All arrangements                               │
├────────────────────────────────────────────────────────────────┤
│  nums = [1, 2, 3]                                              │
│                                                                │
│  Tree (swap approach):                                         │
│                [1,2,3]                                         │
│        ┌─────────┼─────────┐                                   │
│     [1,2,3]   [2,1,3]   [3,2,1]                                │
│      ┌─┴─┐     ┌─┴─┐     ┌─┴─┐                                 │
│  [1,2,3][1,3,2][2,1,3][2,3,1][3,2,1][3,1,2]                    │
│                                                                │
│  Output: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]     │
└────────────────────────────────────────────────────────────────┘
```


**Solution:**

```java
public List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(nums, new ArrayList<>(), new boolean[nums.length], result);
    return result;
}

private void backtrack(int[] nums, List<Integer> path, boolean[] used,
                       List<List<Integer>> result) {
    if (path.size() == nums.length) {
        result.add(new ArrayList<>(path));
        return;
    }

    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;

        used[i] = true;
        path.add(nums[i]);
        backtrack(nums, path, used, result);
        path.remove(path.size() - 1);
        used[i] = false;
    }
}
```

---

### Problem 182: Permutations II (With Duplicates)

**LeetCode 47** 🔗 https://leetcode.com/problems/permutations-ii/

```
┌────────────────────────────────────────────────────────────────┐
│  PERMUTATIONS II - Unique permutations                         │
├────────────────────────────────────────────────────────────────┤
│  nums = [1, 1, 2]                                              │
│                                                                │
│  Output: [[1,1,2], [1,2,1], [2,1,1]]                           │
│                                                                │
│  Key: Sort + skip if same as previous AND previous not used    │
└────────────────────────────────────────────────────────────────┘
```


**Solution:**

```java
public List<List<Integer>> permuteUnique(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(nums);
    backtrack(nums, new ArrayList<>(), new boolean[nums.length], result);
    return result;
}

private void backtrack(int[] nums, List<Integer> path, boolean[] used,
                       List<List<Integer>> result) {
    if (path.size() == nums.length) {
        result.add(new ArrayList<>(path));
        return;
    }

    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;
        // Skip duplicate: same as previous AND previous not used
        if (i > 0 && nums[i] == nums[i-1] && !used[i-1]) continue;

        used[i] = true;
        path.add(nums[i]);
        backtrack(nums, path, used, result);
        path.remove(path.size() - 1);
        used[i] = false;
    }
}
```

---

## 11.3 String Backtracking

> **Pattern:** Build strings character-by-character with validity checks.
> **Palindrome Partitioning:** Try every possible first cut, check if it's a palindrome, recurse on remainder.
> **Generate Parentheses:** Track open/close counts. Can add '(' if open < n. Can add ')' if close < open.

### Problem 183: Palindrome Partitioning

**LeetCode 131** 🔗 https://leetcode.com/problems/palindrome-partitioning/

```
┌────────────────────────────────────────────────────────────────┐
│  PALINDROME PARTITIONING                                       │
├────────────────────────────────────────────────────────────────┤
│  s = "aab"                                                     │
│                                                                │
│  Partitions where each part is palindrome:                     │
│  "a" | "a" | "b" ✓                                             │
│  "aa" | "b" ✓                                                  │
│                                                                │
│  Output: [["a","a","b"], ["aa","b"]]                           │
└────────────────────────────────────────────────────────────────┘
```


**Solution:**

```java
public List<List<String>> partition(String s) {
    List<List<String>> result = new ArrayList<>();
    backtrack(s, 0, new ArrayList<>(), result);
    return result;
}

private void backtrack(String s, int start, List<String> path,
                       List<List<String>> result) {
    if (start == s.length()) {
        result.add(new ArrayList<>(path));
        return;
    }

    for (int end = start; end < s.length(); end++) {
        if (isPalindrome(s, start, end)) {
            path.add(s.substring(start, end + 1));
            backtrack(s, end + 1, path, result);
            path.remove(path.size() - 1);
        }
    }
}

private boolean isPalindrome(String s, int left, int right) {
    while (left < right) {
        if (s.charAt(left++) != s.charAt(right--)) return false;
    }
    return true;
}
```

---

### Problem 184: Letter Combinations of Phone

**LeetCode 17** 🔗 https://leetcode.com/problems/letter-combinations-of-a-phone-number/

```
┌────────────────────────────────────────────────────────────────┐
│  LETTER COMBINATIONS OF PHONE NUMBER                           │
├────────────────────────────────────────────────────────────────┤
│  digits = "23"                                                 │
│                                                                │
│  2 → "abc", 3 → "def"                                          │
│                                                                │
│       ┌───┬───┬───┐                                            │
│       │ a │ b │ c │  ← digit 2                                 │
│       └─┬─┴─┬─┴─┬─┘                                            │
│    ┌────┴┐ ┌┴───┐ ┌┴────┐                                      │
│  d,e,f  d,e,f  d,e,f     ← digit 3                             │
│                                                                │
│  Output: ["ad","ae","af","bd","be","bf","cd","ce","cf"]        │
└────────────────────────────────────────────────────────────────┘
```


**Solution:**

```java
private String[] mapping = {"", "", "abc", "def", "ghi", "jkl",
                            "mno", "pqrs", "tuv", "wxyz"};

public List<String> letterCombinations(String digits) {
    List<String> result = new ArrayList<>();
    if (digits.isEmpty()) return result;

    backtrack(digits, 0, new StringBuilder(), result);
    return result;
}

private void backtrack(String digits, int index, StringBuilder path,
                       List<String> result) {
    if (index == digits.length()) {
        result.add(path.toString());
        return;
    }

    String letters = mapping[digits.charAt(index) - '0'];
    for (char c : letters.toCharArray()) {
        path.append(c);
        backtrack(digits, index + 1, path, result);
        path.deleteCharAt(path.length() - 1);
    }
}
```

---

### Problem 185: Generate Parentheses

**LeetCode 22** 🔗 https://leetcode.com/problems/generate-parentheses/

```
┌────────────────────────────────────────────────────────────────┐
│  GENERATE PARENTHESES                                          │
├────────────────────────────────────────────────────────────────┤
│  n = 3 (3 pairs)                                               │
│                                                                │
│  Rules:                                                        │
│  - Can add '(' if open < n                                     │
│  - Can add ')' if close < open                                 │
│                                                                │
│  Output: ["((()))","(()())","(())()","()(())","()()()"]        │
└────────────────────────────────────────────────────────────────┘
```


**Solution:**

```java
public List<String> generateParenthesis(int n) {
    List<String> result = new ArrayList<>();
    backtrack(n, 0, 0, new StringBuilder(), result);
    return result;
}

private void backtrack(int n, int open, int close, StringBuilder path,
                       List<String> result) {
    if (path.length() == 2 * n) {
        result.add(path.toString());
        return;
    }

    if (open < n) {
        path.append('(');
        backtrack(n, open + 1, close, path, result);
        path.deleteCharAt(path.length() - 1);
    }

    if (close < open) {
        path.append(')');
        backtrack(n, open, close + 1, path, result);
        path.deleteCharAt(path.length() - 1);
    }
}
```

---






> 🔬 **Section Challenge — 11.3 String Backtracking**

**Challenge 1 (Reasoning):** In Generate Parentheses (LC 22), the constraint is "add '(' if open < n, add ')' if close < open." Why specifically `close < open` and not `close < n`?
<details><summary>Answer</summary>

`close < n` would allow adding ')' even when there's no matching '(' yet. Example with n=2: start with `""`, add ')' → `")"` — this is already invalid! No prefix of a valid parentheses string can have more ')' than '('. The invariant is: **at every point in construction, count(')') ≤ count('(')**. `close < open` enforces this exactly — you can only close a parenthesis that was previously opened. This is actually the **Catalan number** constraint in disguise: valid parentheses = monotonic lattice paths that never cross the diagonal, and `close < open` keeps you above/on the diagonal. The total valid strings = C(n) = (2n)! / ((n+1)! × n!).
</details>

## 11.4 Grid Backtracking

> **Pattern:** Explore grid cells recursively with visited tracking. Undo visited on backtrack.
> **N-Queens:** Place one queen per row. Track attacked columns and diagonals with sets.
> **Sudoku:** Try digits 1-9 at each empty cell. Check row/col/box constraints.
> **Key insight:** The more constraints you check EARLY (pruning), the faster it runs.

### Problem 186: Word Search

**LeetCode 79** 🔗 https://leetcode.com/problems/word-search/

```
┌────────────────────────────────────────────────────────────────┐
│  WORD SEARCH - Find word in grid                               │
├────────────────────────────────────────────────────────────────┤
│  board = [["A","B","C","E"],                                   │
│           ["S","F","C","S"],                                   │
│           ["A","D","E","E"]]                                   │
│  word = "ABCCED"                                               │
│                                                                │
│  ┌───┬───┬───┬───┐                                             │
│  │ A→│ B→│ C │ E │                                             │
│  ├───┼───┼─↓─┼───┤                                             │
│  │ S │ F │ C │ S │                                             │
│  ├───┼───┼─↓─┼───┤                                             │
│  │ A │ D←│ E │ E │                                             │
│  └───┴───┴───┴───┘                                             │
│                                                                │
│  Output: true                                                  │
└────────────────────────────────────────────────────────────────┘
```


**Solution:**

```java
public boolean exist(char[][] board, String word) {
    int rows = board.length, cols = board[0].length;

    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            if (backtrack(board, word, i, j, 0)) {
                return true;
            }
        }
    }

    return false;
}

private boolean backtrack(char[][] board, String word, int r, int c, int idx) {
    if (idx == word.length()) return true;

    if (r < 0 || r >= board.length || c < 0 || c >= board[0].length
        || board[r][c] != word.charAt(idx)) {
        return false;
    }

    char temp = board[r][c];
    board[r][c] = '#';  // Mark visited

    boolean found = backtrack(board, word, r+1, c, idx+1) ||
                    backtrack(board, word, r-1, c, idx+1) ||
                    backtrack(board, word, r, c+1, idx+1) ||
                    backtrack(board, word, r, c-1, idx+1);

    board[r][c] = temp;  // Restore
    return found;
}
```

---

### Problem 187: N-Queens

**LeetCode 51** 🔗 https://leetcode.com/problems/n-queens/

```
┌────────────────────────────────────────────────────────────────┐
│  N-QUEENS - Place n queens on n×n board                        │
├────────────────────────────────────────────────────────────────┤
│  n = 4                                                         │
│                                                                │
│  Solution 1:          Solution 2:                              │
│  ┌───┬───┬───┬───┐    ┌───┬───┬───┬───┐                        │
│  │ . │ Q │ . │ . │    │ . │ . │ Q │ . │                        │
│  ├───┼───┼───┼───┤    ├───┼───┼───┼───┤                        │
│  │ . │ . │ . │ Q │    │ Q │ . │ . │ . │                        │
│  ├───┼───┼───┼───┤    ├───┼───┼───┼───┤                        │
│  │ Q │ . │ . │ . │    │ . │ . │ . │ Q │                        │
│  ├───┼───┼───┼───┤    ├───┼───┼───┼───┤                        │
│  │ . │ . │ Q │ . │    │ . │ Q │ . │ . │                        │
│  └───┴───┴───┴───┘    └───┴───┴───┴───┘                        │
│                                                                │
│  Constraints: No two queens on same row, col, or diagonal      │
└────────────────────────────────────────────────────────────────┘
```


**Solution:**

```java
public List<List<String>> solveNQueens(int n) {
    List<List<String>> result = new ArrayList<>();
    char[][] board = new char[n][n];

    for (char[] row : board) Arrays.fill(row, '.');

    backtrack(board, 0, result);
    return result;
}

private void backtrack(char[][] board, int row, List<List<String>> result) {
    if (row == board.length) {
        result.add(construct(board));
        return;
    }

    for (int col = 0; col < board.length; col++) {
        if (isValid(board, row, col)) {
            board[row][col] = 'Q';
            backtrack(board, row + 1, result);
            board[row][col] = '.';
        }
    }
}

private boolean isValid(char[][] board, int row, int col) {
    // Check column
    for (int i = 0; i < row; i++) {
        if (board[i][col] == 'Q') return false;
    }
    // Check upper-left diagonal
    for (int i = row-1, j = col-1; i >= 0 && j >= 0; i--, j--) {
        if (board[i][j] == 'Q') return false;
    }
    // Check upper-right diagonal
    for (int i = row-1, j = col+1; i >= 0 && j < board.length; i--, j++) {
        if (board[i][j] == 'Q') return false;
    }
    return true;
}

private List<String> construct(char[][] board) {
    List<String> res = new ArrayList<>();
    for (char[] row : board) res.add(new String(row));
    return res;
}
```

---

### Problem 188: Sudoku Solver

**LeetCode 37** 🔗 https://leetcode.com/problems/sudoku-solver/

```
┌────────────────────────────────────────────────────────────────┐
│  SUDOKU SOLVER                                                 │
├────────────────────────────────────────────────────────────────┤
│  Fill 9x9 grid so each row, column, and 3x3 box                │
│  contains digits 1-9 exactly once                              │
│                                                                │
│  ┌───┬───┬───╫───┬───┬───╫───┬───┬───┐                         │
│  │ 5 │ 3 │ . ║ . │ 7 │ . ║ . │ . │ . │                         │
│  │ 6 │ . │ . ║ 1 │ 9 │ 5 ║ . │ . │ . │                         │
│  │ . │ 9 │ 8 ║ . │ . │ . ║ . │ 6 │ . │                         │
│  ╠═══╬═══╬═══╬═══╬═══╬═══╬═══╬═══╬═══╣                         │
│  │ 8 │ . │ . ║ . │ 6 │ . ║ . │ . │ 3 │                         │
│  │ 4 │ . │ . ║ 8 │ . │ 3 ║ . │ . │ 1 │                         │
│  │ 7 │ . │ . ║ . │ 2 │ . ║ . │ . │ 6 │                         │
│  ╠═══╬═══╬═══╬═══╬═══╬═══╬═══╬═══╬═══╣                         │
│  │ . │ 6 │ . ║ . │ . │ . ║ 2 │ 8 │ . │                         │
│  │ . │ . │ . ║ 4 │ 1 │ 9 ║ . │ . │ 5 │                         │
│  │ . │ . │ . ║ . │ 8 │ . ║ . │ 7 │ 9 │                         │
│  └───┴───┴───╨───┴───┴───╨───┴───┴───┘                         │
└────────────────────────────────────────────────────────────────┘
```


**Solution:**

```java
public void solveSudoku(char[][] board) {
    solve(board);
}

private boolean solve(char[][] board) {
    for (int i = 0; i < 9; i++) {
        for (int j = 0; j < 9; j++) {
            if (board[i][j] == '.') {
                for (char c = '1'; c <= '9'; c++) {
                    if (isValid(board, i, j, c)) {
                        board[i][j] = c;

                        if (solve(board)) return true;

                        board[i][j] = '.';
                    }
                }
                return false;  // No valid number found
            }
        }
    }
    return true;  // Solved
}

private boolean isValid(char[][] board, int row, int col, char c) {
    for (int i = 0; i < 9; i++) {
        if (board[row][i] == c) return false;  // Check row
        if (board[i][col] == c) return false;  // Check column

        // Check 3x3 box
        int boxRow = 3 * (row / 3) + i / 3;
        int boxCol = 3 * (col / 3) + i % 3;
        if (board[boxRow][boxCol] == c) return false;
    }
    return true;
}
```

---

---






> 🔬 **Section Challenge — 11.4 Grid Backtracking**

**Challenge 1 (Reasoning):** In N-Queens, you track attacked columns, diagonals (`row-col`), and anti-diagonals (`row+col`). Why does `row-col` uniquely identify a diagonal? Prove it geometrically.
<details><summary>Answer</summary>

A top-left-to-bottom-right diagonal is defined by all cells where moving one step right (+1 col) also moves one step down (+1 row). So `row` and `col` increase by the same amount → their *difference* stays constant. Cell (0,0) and (1,1) and (2,2) all have `row-col = 0`. Cell (0,1) and (1,2) have `row-col = -1`. Each unique value of `row-col` identifies exactly one diagonal. Similarly, anti-diagonals go top-right-to-bottom-left: moving right (+1 col) moves UP (-1 row), so `row+col` stays constant. This gives O(1) conflict checking with HashSets instead of O(n) scanning. The values range from `-(n-1)` to `+(n-1)` for diagonals and `0` to `2(n-1)` for anti-diagonals.
</details>

## 🏆 Competitive Programming — Codeforces Problems

| Problem | Link | Technique | Difficulty |
|---|---|---|---|
| Vitaly and Strange Function | [CF 493B](https://codeforces.com/problemset/problem/493/B) | Backtracking + math | ⭐⭐ Medium |
| Pashmak's Garden | [CF 459D](https://codeforces.com/problemset/problem/459/D) | Permutation backtracking | ⭐⭐ Medium |
| Colorful Bricks | [CF 1081B](https://codeforces.com/problemset/problem/1081/B) | Combinatorics (BT reduced) | ⭐ Easy |
| Dreamoon and Stairs | [CF 476B](https://codeforces.com/problemset/problem/476/B) | BT with fixed path | ⭐ Easy |
| Tokitsukaze and Brackets | [CF 1303D](https://codeforces.com/problemset/problem/1303/D) | BT + stack validation | ⭐⭐ Medium |

---






> 🔬 **Section Challenge — 🏆 Competitive Programming — Codeforces Problems**

**Challenge 1 (Reasoning):** The table mentions "BT with fixed path" and "BT + stack validation." When does adding a constraint (like a stack) actually HELP performance rather than hurt it?
<details><summary>Answer</summary>

Constraints HELP when they enable **early pruning** — rejecting invalid branches before fully exploring them. Without the stack constraint in bracket validation, you'd generate ALL 2^n binary strings and check validity afterward (O(2^n × n)). With the stack, you reject `")("` at the second character instead of generating all 2^n suffixes. The stack acts as a **running invariant**: if it's violated at depth d, you prune the entire subtree of size 2^(n-d). More constraints = more pruning = fewer nodes visited. This is why Sudoku with constraint propagation (naked singles, hidden singles) visits ~100 nodes, while brute-force backtracking visits ~100,000. **Constraints are not overhead — they are the pruning function.**
</details>

## 🌍 Real-World Applications of Backtracking

| Technique | Real-World System | How It's Used |
|---|---|---|
| **Constraint satisfaction** | Sudoku validators (apps, games) | DFS with pruning: if constraint violated, backtrack immediately |
| **Route planning** | Delivery route optimization | Vehicle routing = TSP approximation via backtracking + heuristics |
| **Regex matching** | Every text editor, grep, IntelliJ | Regular expression engine uses backtracking on NFA state graph |
| **Parsing** | Compilers (recursive-descent parsers) | Parse grammar by trying rules; backtrack on failure |
| **Puzzle solvers** | 8-queens, crossword generators | Classic backtracking: place piece, check valid, recurse, undo |

```
🔥 REGEX ENGINE = BACKTRACKING:
   Pattern: "a*b" on string "aaac"
   - Try: a→a→a→a (matched 4 a's), then expect 'b' → fail
   - Backtrack: a→a→a (3 a's), then expect 'b' → fail
   - Backtrack: a→a (2 a's), then 'b' → fail
   - ... until all options exhausted → NO MATCH
   
   "Catastrophic backtracking" = ReDoS attack that crashes servers by
    crafting an input that triggers exponential regex backtracking
```

---

> **Navigation**: [< Previous](11_Dynamic_Programming.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](13_Greedy.md)




> 🔬 **Section Challenge — 🌍 Real-World Applications of Backtracking**

**Challenge 1 (Reasoning):** The regex example shows `a*b` causing backtracking on `"aaac"`. Explain why the pattern `(a+)+b` on input `"aaaaaaaaaaaaaac"` causes *exponential* backtracking (ReDoS), while `a+b` on the same input doesn't.
<details><summary>Answer</summary>

`a+b`: the engine matches all a's greedily, fails on 'c', backtracks one 'a' at a time. Total attempts = n (one per 'a' released). Linear. `(a+)+b`: the OUTER `+` means "one or more groups of (a+)." The engine can split the a's into groups in exponentially many ways: `(aaaa)`, `(aaa)(a)`, `(aa)(aa)`, `(aa)(a)(a)`, `(a)(a)(a)(a)`, etc. For n a's, there are 2^(n-1) ways to partition — and the engine tries ALL of them before concluding no match. This is **catastrophic backtracking** / ReDoS. Fix: use atomic groups `(?>a+)+b` or possessive quantifiers `(a++)b` which prevent the engine from backtracking into a group once it's matched. Modern regex engines (RE2, Rust regex) use NFA simulation instead of backtracking, making them immune.
</details>
