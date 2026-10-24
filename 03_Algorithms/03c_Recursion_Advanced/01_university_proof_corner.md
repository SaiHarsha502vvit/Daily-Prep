# 🎓 University Proof Corner

> **Navigation**: [Chapter overview](../03c_Recursion_Advanced.md) | [Recursion to Iteration Conversion →](02_recursion_to_iteration_conversion.md)
> Page 1 of 5 in **Advanced Recursion Patterns**


> **MIT 6.006 / KTH DD1352 / RWTH Aachen layer** — Why backtracking is complete (finds all solutions, misses none) and how to bound the state-space cost.

## Correctness: Backtracking is Complete by Construction

**Claim**: The Choose-Explore-Unchoose pattern visits every valid solution exactly once.

**Proof**:
- The recursion builds an implicit search tree. Each node = partial assignment; each edge = one choice.
- `unchoose` restores state to exactly what it was before the child was entered — so the parent state is preserved perfectly between branch explorations.
- Every leaf reachable without constraint violation is a valid solution (no valid solution is skipped before the constraint check).
- Because all choices are tried and state is restored after each, the DFS is complete. ✓

**Pruning is sound**: Pruning removes only branches where a constraint C is already violated. Since C is monotone (once violated by a prefix, all extensions also violate it), no valid solution exists in the pruned subtree. ✓

## State-Space Complexity

| Problem | Tree size (no pruning) | With good pruning |
|---|---|---|
| Subsets of n elements | 2ⁿ leaves | O(2ⁿ) unavoidable |
| Permutations of n elements | n! leaves | O(n!) worst-case |
| N-Queens (n×n) | n! worst case | Empirically near-polynomial |
| Sudoku (9×9) | 9^81 trivially | ≈20 guesses with arc-consistency |

Exponential state space is unavoidable for NP-hard problems; pruning reduces the constant factor dramatically but cannot change the asymptotic class.

> Backtracking completeness and constraint satisfaction: [A3 — Lower Bounds & NP](../A3_Lower_Bounds_And_NP.md)

📎 **Reference Anchor**: [OpenJDK regex engine (backtracking NFA)](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/regex/Pattern.java)
**Invariant learned**: Java's `java.util.regex.Pattern` uses a non-deterministic finite automaton (NFA) with backtracking. The engine tries each alternative; on failure it backtracks and tries the next. This is exactly the "choose/explore/unchoose" pattern — the engine's "state" is the current position in the regex and string; backtracking restores both. Catastrophic backtracking occurs when the NFA generates exponential paths (e.g., `(a+)+b` on "aaaaaaa") — same exponential root as worst-case backtracking search.
**Local rewrite**: The completeness proof in this Proof Corner ("unchoose restores state exactly → no valid solution skipped") directly explains why regex backtracks find every possible match: the unchoose restores the string position, so no prefix-position pair is skipped.
**Constraint warning**: `Pattern.compile("(a+)+b").matcher("aaaaaa").matches()` runs in O(2ⁿ) time — a real DoS vector (ReDoS). Mitigation: use possessive quantifiers `(a++)` or atomic groups, or replace with a DFA-based library.

---

## PART 9: Advanced Recursion Patterns

### Pattern 1: Include/Exclude Pattern

```
CONCEPT:
At each step, make a choice: include current element or exclude it.
This generates all possible subsets/combinations.

WHEN TO USE:
- Subset generation
- Combination problems
- 0/1 Knapsack variants
- Partition problems
```

```java
// Template: Include/Exclude Pattern
public void includeExclude(int index, int[] arr, List<Integer> current,
                           List<List<Integer>> result) {
    // Base case: processed all elements
    if (index == arr.length) {
        result.add(new ArrayList<>(current));
        return;
    }

    // EXCLUDE current element
    includeExclude(index + 1, arr, current, result);

    // INCLUDE current element
    current.add(arr[index]);
    includeExclude(index + 1, arr, current, result);
    current.remove(current.size() - 1);  // Backtrack
}

// Example: All Subsets of [1, 2, 3]
// Call tree:
//                    []
//           /                  \
//       []                      [1]
//      /    \                  /    \
//    []      [2]           [1]      [1,2]
//   /  \    /   \         /   \    /    \
// [] [3] [2] [2,3]     [1] [1,3] [1,2] [1,2,3]
```

### Pattern 2: Swap Pattern (Permutations)

```java
// Template: Generate All Permutations
public void permute(int[] arr, int start, List<List<Integer>> result) {
    if (start == arr.length) {
        List<Integer> perm = new ArrayList<>();
        for (int num : arr) perm.add(num);
        result.add(perm);
        return;
    }

    for (int i = start; i < arr.length; i++) {
        swap(arr, start, i);        // Choose
        permute(arr, start + 1, result);  // Explore
        swap(arr, start, i);        // Un-choose (backtrack)
    }
}

// Visual:
// [1, 2, 3] at start=0
//     swap(0,0)         swap(0,1)         swap(0,2)
//        ↓                  ↓                  ↓
//    [1, 2, 3]         [2, 1, 3]         [3, 2, 1]
//      /   \             /   \             /   \
// [1,2,3] [1,3,2]   [2,1,3] [2,3,1]   [3,2,1] [3,1,2]
```

### Pattern 3: Choose/Explore/Unchoose (Backtracking)

```java
// Template: N-Queens Problem
public void solveNQueens(int n) {
    int[] queens = new int[n];  // queens[row] = column
    Arrays.fill(queens, -1);
    solve(0, n, queens, new ArrayList<>());
}

private void solve(int row, int n, int[] queens, List<List<String>> result) {
    if (row == n) {
        result.add(buildBoard(queens, n));
        return;
    }

    for (int col = 0; col < n; col++) {
        if (isValid(queens, row, col)) {
            queens[row] = col;           // CHOOSE
            solve(row + 1, n, queens, result);  // EXPLORE
            queens[row] = -1;            // UNCHOOSE
        }
    }
}

private boolean isValid(int[] queens, int row, int col) {
    for (int i = 0; i < row; i++) {
        // Same column or diagonal
        if (queens[i] == col ||
            Math.abs(queens[i] - col) == Math.abs(i - row)) {
            return false;
        }
    }
    return true;
}
```

### Pattern 4: Multiple Recursive Calls (Divide and Conquer)

```java
// Template: Merge Sort
public void mergeSort(int[] arr, int left, int right) {
    if (left >= right) return;  // Base case: single element

    int mid = left + (right - left) / 2;

    // Two recursive calls - divide
    mergeSort(arr, left, mid);
    mergeSort(arr, mid + 1, right);

    // Conquer - merge sorted halves
    merge(arr, left, mid, right);
}

// Call pattern:
//           mergeSort(0,7)
//          /              \
//   mergeSort(0,3)    mergeSort(4,7)
//      /     \           /      \
//  ms(0,1)  ms(2,3)  ms(4,5)  ms(6,7)
//   / \      / \      / \      / \
// ms ms    ms ms    ms ms    ms ms
```

### Pattern 5: State Passing vs Return Value

```java
// APPROACH 1: Pass state through parameters (accumulator pattern)
public int sumArray(int[] arr, int index, int currentSum) {
    if (index == arr.length) return currentSum;
    return sumArray(arr, index + 1, currentSum + arr[index]);
}
// This is TAIL RECURSIVE - can be optimized to iteration

// APPROACH 2: Return and combine
public int sumArray(int[] arr, int index) {
    if (index == arr.length) return 0;
    return arr[index] + sumArray(arr, index + 1);
}
// This builds up the call stack

// APPROACH 3: Use mutable state (not recommended but common)
int sum = 0;
public void sumArray(int[] arr, int index) {
    if (index == arr.length) return;
    sum += arr[index];
    sumArray(arr, index + 1);
}
```

---

[Chapter overview](../03c_Recursion_Advanced.md) | [Recursion to Iteration Conversion →](02_recursion_to_iteration_conversion.md)
