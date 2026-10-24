# UNIT 4: BACKTRACKING

> **Navigation**: [← UNIT 3: DYNAMIC PROGRAMMING](01_unit_3_dynamic_programming.md) | [Chapter overview](../06c_Advanced_Algo_Deep.md) | [UNIT 5: BRANCH AND BOUND →](03_unit_5_branch_and_bound.md)
> Page 2 of 4 in **Advanced Algo Deep**


## The General Method

**BACKTRACKING: — Systematic way to try all possible solutions. — Build solution incrementally, abandon ("backtrack") when — solution cannot possibly be completed. — BACKTRACKING TEMPLATE**

```text
 void backtrack(state, choices):
     if (isSolution(state)):
         processSolution(state)
         return

     for each choice in choices:
         if (isValid(choice)):
             makeChoice(choice)
             backtrack(newState)
             undoChoice(choice)  ← KEY!

STATE SPACE TREE:
                    []
           /    /    \    \
         [1]  [2]   [3]  [4]
         /|\   |\    |
       ...     ...  ...   (pruned branches)
```

### N-Queens Problem

```java
// Place N queens on N×N board so no two attack each other

public List<List<String>> solveNQueens(int n) {
    List<List<String>> result = new ArrayList<>();
    int[] queens = new int[n];  // queens[row] = column
    Arrays.fill(queens, -1);

    backtrack(result, queens, 0, n);
    return result;
}

private void backtrack(List<List<String>> result, int[] queens,
                       int row, int n) {
    if (row == n) {
        result.add(buildBoard(queens, n));
        return;
    }

    for (int col = 0; col < n; col++) {
        if (isValid(queens, row, col)) {
            queens[row] = col;
            backtrack(result, queens, row + 1, n);
            queens[row] = -1;  // Backtrack
        }
    }
}

private boolean isValid(int[] queens, int row, int col) {
    for (int i = 0; i < row; i++) {
        // Same column
        if (queens[i] == col) return false;
        // Diagonal
        if (Math.abs(queens[i] - col) == Math.abs(i - row)) return false;
    }
    return true;
}

// VISUAL SOLUTION for N=4:
//
// Solution 1:        Solution 2:
// . Q . .            . . Q .
// . . . Q            Q . . .
// Q . . .            . . . Q
// . . Q .            . Q . .
//
// State Space Tree (partial):
//                    []
//            /    |    |    \
//          Q0    Q1   Q2   Q3  (row 0, columns 0-3)
//         / |    /\
//       ×  Q3  Q3 ×    (row 1, try each column)
//           |
//          Q0        (row 2)
//           |
//          Q2        (row 3) ✓ SOLUTION

// TIME: O(N!)
// SPACE: O(N) for recursion stack
```

### Sum of Subsets Problem

```java
// Find all subsets that sum to target

public List<List<Integer>> subsetSum(int[] nums, int target) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(nums);  // For pruning
    backtrack(result, new ArrayList<>(), nums, target, 0);
    return result;
}

private void backtrack(List<List<Integer>> result, List<Integer> current,
                       int[] nums, int remaining, int start) {
    if (remaining == 0) {
        result.add(new ArrayList<>(current));
        return;
    }

    for (int i = start; i < nums.length; i++) {
        // Pruning: if number too large, all following are too (sorted)
        if (nums[i] > remaining) break;

        // Skip duplicates
        if (i > start && nums[i] == nums[i - 1]) continue;

        current.add(nums[i]);
        backtrack(result, current, nums, remaining - nums[i], i + 1);
        current.remove(current.size() - 1);  // Backtrack
    }
}

// VISUAL EXAMPLE:
// nums = [2, 3, 5, 7], target = 10
//
// State Space Tree:
//                         []
//           /        |        |       \
//         [2]       [3]      [5]     [7]
//        / | \      /  \       |
//     [2,3][2,5][2,7] [3,5][3,7] [5,7]×
//      |     |
//   [2,3,5] [2,5,7]×
//     ×
//
// Solutions: [3,7], [2,3,5]

// TIME: O(2ⁿ) worst case
```

### Graph Coloring Problem

```java
// Color graph with m colors so no adjacent vertices have same color

public boolean graphColoring(int[][] graph, int m, int n) {
    int[] colors = new int[n];
    return backtrack(graph, colors, m, 0);
}

private boolean backtrack(int[][] graph, int[] colors, int m, int vertex) {
    if (vertex == colors.length) {
        return true;  // All vertices colored
    }

    for (int c = 1; c <= m; c++) {
        if (isSafe(graph, colors, vertex, c)) {
            colors[vertex] = c;
            if (backtrack(graph, colors, m, vertex + 1)) {
                return true;
            }
            colors[vertex] = 0;  // Backtrack
        }
    }

    return false;  // No valid coloring
}

private boolean isSafe(int[][] graph, int[] colors, int vertex, int color) {
    for (int i = 0; i < colors.length; i++) {
        if (graph[vertex][i] == 1 && colors[i] == color) {
            return false;
        }
    }
    return true;
}

// VISUAL EXAMPLE:
// Graph:     0---1
//            |\ /|
//            | X |
//            |/ \|
//            3---2
//
// m=3 colors (R=1, G=2, B=3)
//
// vertex 0: try R → colors = [R, _, _, _]
// vertex 1: try R (conflict with 0)
//           try G → colors = [R, G, _, _]
// vertex 2: try R (conflict with 0)
//           try G (conflict with 1)
//           try B → colors = [R, G, B, _]
// vertex 3: try R (conflict with 0)
//           try G → colors = [R, G, B, G]
//
// Valid coloring found!
```

### Hamiltonian Cycle Problem

```java
// Find cycle that visits every vertex exactly once

public List<Integer> hamiltonianCycle(int[][] graph, int n) {
    int[] path = new int[n];
    Arrays.fill(path, -1);
    path[0] = 0;  // Start at vertex 0

    if (backtrack(graph, path, 1)) {
        List<Integer> result = new ArrayList<>();
        for (int v : path) result.add(v);
        result.add(0);  // Complete the cycle
        return result;
    }
    return null;
}

private boolean backtrack(int[][] graph, int[] path, int pos) {
    if (pos == path.length) {
        // Check if there's edge from last vertex to first
        return graph[path[pos - 1]][path[0]] == 1;
    }

    for (int v = 1; v < path.length; v++) {
        if (isSafe(graph, path, pos, v)) {
            path[pos] = v;
            if (backtrack(graph, path, pos + 1)) {
                return true;
            }
            path[pos] = -1;  // Backtrack
        }
    }

    return false;
}

private boolean isSafe(int[][] graph, int[] path, int pos, int v) {
    // Check if v is adjacent to previously added vertex
    if (graph[path[pos - 1]][v] == 0) return false;

    // Check if v already in path
    for (int i = 0; i < pos; i++) {
        if (path[i] == v) return false;
    }

    return true;
}

// VISUAL EXAMPLE:
// Graph:
//     0---1
//    /|   |\
//   3 |   | 2
//    \|   |/
//     4---5
//
// Finding Hamiltonian Cycle starting from 0:
// 0 → 1 → 2 → 5 → 4 → 3 → 0 ✓

// TIME: O(N!) worst case
```

---

🔬 **Section Challenge — Backtracking**

**Challenge 1 (Symmetry Pruning):** In the N-Queens problem, finding all solutions for $N=8$ takes 92 iterations. However, we can cut the search space nearly in half. How?

<details><summary>Answer</summary>

Symmetry. A chessboard is symmetric horizontally, vertically, and diagonally. Instead of searching all columns for the first row (`row = 0`), we only need to place the first queen in the first half of the columns ($0$ to $N/2 - 1$). Any valid board found can be mirrored horizontally to produce another valid board. For odd $N$, the middle column requires a full search but cannot be mirrored. This dramatically cuts the branches of the state space tree at the very top.

</details>

---

[← UNIT 3: DYNAMIC PROGRAMMING](01_unit_3_dynamic_programming.md) | [Chapter overview](../06c_Advanced_Algo_Deep.md) | [UNIT 5: BRANCH AND BOUND →](03_unit_5_branch_and_bound.md)
