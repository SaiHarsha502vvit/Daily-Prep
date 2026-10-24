# PART 0: COMPLETE UNDERSTANDING — The WHY Before the WHAT <a name="part-0"></a>

> **Navigation**: [Chapter overview](../11_Backtracking_Complete.md) | [Permutations Pattern →](02_permutations_pattern.md)
> Page 1 of 4 in **Backtracking Complete Guide**


## What Problem Does Backtracking Solve?

```
THE FUNDAMENTAL PROBLEM:
Some problems have SO MANY possible solutions that you can't
list them all upfront. But you need to find ONE (or ALL) valid ones.

Examples:
  - How many ways to place 8 queens on a chessboard? (92 solutions out of 4B+)
  - What are all valid combinations of parentheses?
  - Solve this Sudoku puzzle
  - Find a path through this maze

BRUTE FORCE would try everything → for 8 queens: 64^8 = 281 trillion positions
BACKTRACKING prunes early → only explore VALID partial solutions
```

## The Mental Model: Exploring a Tree of Choices

```
Every backtracking problem is a DECISION TREE:

  "Choose a letter for position 1"
           /    |    \
          a     b     c
         /|\   /|\   /|\    ← "Choose for position 2"
        a b c a b c a b c
        ...

At each node, you have CHOICES.
Some branches lead to valid solutions. Others are dead ends.

BACKTRACKING = DFS through this tree, BUT:
  - Before going deeper → CHECK if this partial solution CAN lead to a valid one
  - If NO → PRUNE this branch (don't explore further) → HUGE time savings
  - If dead end → UNDO last choice (backtrack) → try next option
```

## The Universal 3-Step Framework: Choose → Explore → Unchoose

```
for each CHOICE at current position:
    1. CHOOSE:   Make a choice (add to current path)
    2. EXPLORE:  Recurse to next position
    3. UNCHOOSE: Undo the choice (remove from path) ← THIS IS BACKTRACKING

WHY "unchoose"? Because after exploring one branch, you need to
return to the same state to try the NEXT branch. Like hiking:
you go down a trail, hit a dead end, walk BACK to the fork,
then try the other trail.
```

## When to Use Backtracking vs Other Approaches

```
✅ USE BACKTRACKING WHEN:
  - Generate ALL solutions (subsets, permutations, combinations)
  - Constraint satisfaction (Sudoku, N-Queens, crossword)
  - Path finding in a maze
  - Problem says "find all", "list all", "count all valid"

❌ DO NOT USE WHEN:
  - You only need the COUNT (not the actual solutions) → Use DP instead
  - You need the OPTIMAL solution → Use DP or Greedy
  - The state space is too large even with pruning (n > 20-25)
  - There's a mathematical formula (combinations = n! / (k! * (n-k)!))

  BACKTRACKING = "I need to enumerate"
  DP = "I need to optimize"
  GREEDY = "I can make local choices that are globally optimal"
```

## Historical Context

```
1960s: Backtracking was formalized by Walker (1960) and Golomb & Baumert (1965)
The 8-Queens problem (1848, Max Bezzel) was one of the first applications.
Today it's the foundation for:
  - SAT solvers (automated theorem proving)
  - Compiler optimization (register allocation)
  - AI game engines (chess move generation)
  - Regex matchers
```

📖 **Related mental model:** [14_Mental_Models/01_Recursion_Tree_Thinking.md](../../14_Mental_Models/01_Recursion_Tree_Thinking.md) — Part 4 covers the Choose-Explore-Unchoose framework in depth.

---

## What is Backtracking? <a name="what-is-backtracking"></a>

### The Core Idea

**Backtracking = DFS + Undo — Explore all possible paths. — When you hit a dead end, GO BACK and try a different path. — BACKTRACKING FLOW**

```text
1. CHOOSE    →    2. EXPLORE    →    3. UNCHOOSE

Make a            Recursively         Undo the
decision          explore with        decision
                  that choice         (backtrack)
```

### Visual: Decision Tree

```
Problem: Generate all subsets of [1, 2]

                    Start []
                   /        \
        Include 1 /          \ Exclude 1
                 /            \
              [1]              []
             /    \          /    \
      Inc 2 /      \ Exc 2  / Inc 2\ Exc 2
           /        \      /        \
        [1,2]      [1]   [2]        []

Result: [[], [1], [2], [1,2]]
```

### When to Use Backtracking?

**USE BACKTRACKING WHEN YOU SEE:**

```text
 ✓ "Generate all..."
 ✓ "Find all possible..."
 ✓ "Print all combinations/permutations/subsets"
 ✓ "All ways to..."
 ✓ Constraint satisfaction (Sudoku, N-Queens)
 ✓ Path finding with constraints
 ✓ Game solving (word search, crossword)

Time Complexity usually: O(2^n) or O(n!) - exponential
That's OK! Problem asks for ALL solutions.
```

---

## The Universal Template <a name="universal-template"></a>

### 🎯 MEMORIZE THIS TEMPLATE

```java
// ═══════════════════════════════════════════════════════════════
//              THE UNIVERSAL BACKTRACKING TEMPLATE
// ═══════════════════════════════════════════════════════════════

void backtrack(current_state, choices, result) {
    // BASE CASE: When to add to result?
    if (reached_goal) {
        result.add(copy_of_current_state);
        return;
    }

    // RECURSIVE CASE: Try all choices
    for (choice in choices) {
        // 1. Skip invalid choices (pruning)
        if (!isValid(choice)) continue;

        // 2. MAKE the choice
        current_state.add(choice);

        // 3. EXPLORE with that choice
        backtrack(next_state, remaining_choices, result);

        // 4. UNDO the choice (backtrack)
        current_state.remove(choice);
    }
}
```

### Real Java Implementation

```java
public class BacktrackingTemplate {

    public List<List<Integer>> solve(int[] nums) {
        List<List<Integer>> result = new ArrayList<>();
        List<Integer> current = new ArrayList<>();
        backtrack(nums, 0, current, result);
        return result;
    }

    private void backtrack(int[] nums, int start,
                          List<Integer> current,
                          List<List<Integer>> result) {
        // Base case: add current state to result
        result.add(new ArrayList<>(current));  // MUST copy!

        // Try all choices from 'start' onwards
        for (int i = start; i < nums.length; i++) {
            // 1. CHOOSE
            current.add(nums[i]);

            // 2. EXPLORE
            backtrack(nums, i + 1, current, result);

            // 3. UNCHOOSE (backtrack)
            current.remove(current.size() - 1);
        }
    }
}
```

### Critical Points

**CRITICAL IMPLEMENTATION NOTES**

```text
1. ALWAYS COPY before adding to result:
   result.add(new ArrayList<>(current));  ✓
   result.add(current);  ✗ (adds reference, will be modified)

2. REMOVE from END (last element):
   current.remove(current.size() - 1);  ✓
   current.remove(element);  ✗ (removes by value, slower)

3. 'start' parameter controls:
   start = i + 1  →  No duplicates, subsets/combinations
   start = i      →  Can reuse elements
   No start       →  Permutations (use visited array)
```

---

## Why "Unchoose" Is Mandatory — The One Idea That Makes Backtracking Click

Everyone copies the choose → explore → unchoose template. Almost nobody can say why step 3 (unchoose) *has* to be there, and that gap is why backtracking feels like magic instead of mechanics. Here's the whole thing, made concrete.

### There is ONE list, and every recursive call is borrowing it

The mental trap is imagining each recursive call has "its own" `current`. It does not. There is a **single** `current` list in memory, and the recursion is passing that same object up and down the call tree. Each call **mutates the shared list, explores, and must put it back exactly as it found it** — like borrowing a book, writing in it, and erasing your notes before returning it so the next borrower sees a clean copy.

`unchoose` *is* the erasing. Without it, your scribbles leak into the sibling's exploration.

### Watch it break — `[1,2]` without unchoose

Trace generating subsets of `[1,2]`, but **delete** the `current.remove(...)` line:

```
current = []          backtrack(start=0)
  record []                                  result: [ [] ]
  i=0: choose 1 → current=[1]
       backtrack(start=1)
         record [1]                          result: [ [], [1] ]
         i=1: choose 2 → current=[1,2]
              backtrack(start=2)
                record [1,2]                 result: [ [], [1], [1,2] ]
              (no unchoose — current STAYS [1,2])
       (no unchoose — current STAYS [1,2])
  i=1: choose 2 → current=[1,2,2]   ← BUG. We wanted to explore just "[2]",
       record [1,2,2]                          but the leftover [1,2] poisoned it
```

We wanted the `i=1` branch at the top level to explore the subset `{2}`. But because the `i=0` branch never cleaned up its `1`, the list still held `[1,2]`, and we got garbage `[1,2,2]`. **The leftover state from one branch corrupts the next branch.** Unchoose exists to guarantee that when control returns to a node and moves to the *next* sibling choice, the state is exactly what it was before the previous sibling ran. That's the invariant:

> **Backtracking invariant:** every call returns `current` to the precise state it received. So at each `for`-loop iteration, `current` reflects only the choices on the path from the root to *this* node — nothing from already-explored siblings.

### The recursion tree IS the search space

A backtracking algorithm is a depth-first walk over a tree of *partial solutions*. For subsets of `[1,2]`:

```
                      []                     ← root: empty partial solution
              /                  \
   choose 1 /                     \ skip-to-i=1 (choose 2)
          [1]                      [2]
        /     \                      \
choose 2/       \ (end)               \ (end)
     [1,2]      [1]                    [2]

Every NODE is a valid subset → that's why we record at every node (subsets).
For permutations/combinations we'd only record at LEAVES.
```

- **Going down an edge** = choose (add an element, mutate `current`).
- **Returning up an edge** = unchoose (remove it, restore `current`).
- **The `for` loop** = fanning out to all the children of the current node.
- **Pruning (`if (!isValid) continue;`)** = refusing to descend into a subtree you can prove holds no solution — you chop the whole branch, turning exponential work into something tractable. This is the *only* lever that makes NP-flavored search feasible: a good prune kills millions of nodes.

Once you see the tree, the three template rules stop being arbitrary: **choose** walks down, **explore** recurses into the subtree, **unchoose** walks back up so the parent can try its next child with a clean slate. Choose and unchoose are mirror operations on the *same edge* of the tree — that's why they must be paired and symmetric.

### Why "copy before adding to result" is the same bug, caught at the finish line

`result.add(new ArrayList<>(current))` — the copy is non-negotiable for the *identical* reason. `result.add(current)` stores a **reference** to the one shared list. Since `current` keeps mutating as the walk continues, every entry in `result` would point at the same object and end up showing its *final* state (usually empty, after all the unchooses). You'd get a result list of N identical empty lists. The copy freezes a snapshot at the moment of recording. Same root cause as the unchoose lesson — **one mutable object, shared across the whole traversal** — surfacing in two places.

> **The complete mental model in one breath:** there is a single `current` list; the recursion is a DFS over a tree of partial solutions; going down mutates it, coming back up un-mutates it, and you snapshot-copy whenever you record an answer — because everything is aliasing the same object.

---

## Subsets Pattern <a name="subsets-pattern"></a>

### Problem: Subsets (LeetCode 78)

```
Input: [1, 2, 3]
Output: [[], [1], [2], [3], [1,2], [1,3], [2,3], [1,2,3]]

Each element: include OR exclude → 2^n subsets
```

### Solution

```java
public List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(nums, 0, new ArrayList<>(), result);
    return result;
}

private void backtrack(int[] nums, int start,
                       List<Integer> current,
                       List<List<Integer>> result) {
    // Every state is a valid subset - add it!
    result.add(new ArrayList<>(current));

    for (int i = start; i < nums.length; i++) {
        current.add(nums[i]);                    // Choose
        backtrack(nums, i + 1, current, result); // Explore
        current.remove(current.size() - 1);      // Unchoose
    }
}
```

### Visual Trace

```
backtrack(start=0, current=[])
├── Add []
├── i=0: Choose 1
│   └── backtrack(start=1, current=[1])
│       ├── Add [1]
│       ├── i=1: Choose 2
│       │   └── backtrack(start=2, current=[1,2])
│       │       ├── Add [1,2]
│       │       ├── i=2: Choose 3
│       │       │   └── backtrack(start=3, current=[1,2,3])
│       │       │       └── Add [1,2,3]
│       │       └── Unchoose 3
│       │       └── return
│       ├── Unchoose 2
│       ├── i=2: Choose 3
│       │   └── backtrack(start=3, current=[1,3])
│       │       └── Add [1,3]
│       └── Unchoose 3
│       └── return
├── Unchoose 1
├── i=1: Choose 2
│   └── backtrack(start=2, current=[2])
│       ├── Add [2]
│       ├── i=2: Choose 3
│       │   └── backtrack(start=3, current=[2,3])
│       │       └── Add [2,3]
│       └── Unchoose 3
├── Unchoose 2
├── i=2: Choose 3
│   └── backtrack(start=3, current=[3])
│       └── Add [3]
└── Unchoose 3

Result: [[], [1], [1,2], [1,2,3], [1,3], [2], [2,3], [3]]
```

### Subsets II - With Duplicates (LeetCode 90)

```java
/*
Input: [1, 2, 2]
Output: [[], [1], [1,2], [1,2,2], [2], [2,2]]
No duplicate subsets!
*/

public List<List<Integer>> subsetsWithDup(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(nums);  // CRITICAL: Sort first!
    backtrack(nums, 0, new ArrayList<>(), result);
    return result;
}

private void backtrack(int[] nums, int start,
                       List<Integer> current,
                       List<List<Integer>> result) {
    result.add(new ArrayList<>(current));

    for (int i = start; i < nums.length; i++) {
        // SKIP DUPLICATES: If same as previous element, skip
        if (i > start && nums[i] == nums[i - 1]) continue;

        current.add(nums[i]);
        backtrack(nums, i + 1, current, result);
        current.remove(current.size() - 1);
    }
}

/*
Why i > start (not i > 0)?
- i > start means: among siblings at same level
- First occurrence at level is OK
- Duplicates at same level create duplicate subsets
*/
```

---

[Chapter overview](../11_Backtracking_Complete.md) | [Permutations Pattern →](02_permutations_pattern.md)
