# PROBLEM 11: Word Search (LC 79)

> **Navigation**: [← WHY Recursion & Subsets — The Heart of…](01_why_recursion_subsets_the_heart_of.md) | [Chapter overview](../22_Recursion_Subsets.md)
> Page 2 of 2 in **SECTION: RECURSION & SUBSETS PROBLEMS**


```
DIFFICULTY: Medium
COMPANIES: Amazon, Facebook, Microsoft, Bloomberg
PATTERN: Backtracking on Grid

PROBLEM: Given m×n board and word, check if word exists in grid.
  Move up/down/left/right, each cell used once.

SOLUTION:
```

```java
public boolean exist(char[][] board, String word) {
    int m = board.length, n = board[0].length;
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (dfs(board, word, i, j, 0)) return true;
        }
    }
    return false;
}

private boolean dfs(char[][] board, String word, int i, int j, int k) {
    if (k == word.length()) return true;
    if (i < 0 || i >= board.length || j < 0 || j >= board[0].length) return false;
    if (board[i][j] != word.charAt(k)) return false;

    char temp = board[i][j];
    board[i][j] = '#';  // Mark visited

    boolean found = dfs(board, word, i + 1, j, k + 1) ||
                    dfs(board, word, i - 1, j, k + 1) ||
                    dfs(board, word, i, j + 1, k + 1) ||
                    dfs(board, word, i, j - 1, k + 1);

    board[i][j] = temp;  // Backtrack
    return found;
}
```

```
COMPLEXITY: Time O(m × n × 4^L) | Space O(L) where L = word length
TRICK: Modify board in-place to mark visited (avoid boolean[][] array).
```

---

🔬 **Section Challenge — PROBLEM 11: Word Search (LC 79)**

**Challenge 1 (Trace — Who/When/What):** On a 2×3 board `[['A','B','C'],['D','E','F']]`, trace the DFS call for `word="ABE"`. At each recursive call, answer: Who holds the current cell? When is the cell marked `#`? What cells are already visited?

<details><summary>Answer</summary>

**Who?** `dfs(board, word, i, j, k)` — the recursive function. **When?** `board[i][j] = '#'` is set BEFORE the 4-directional recursive calls, and restored AFTER.

Call 1: `dfs(0,0,0)` — `board[0][0]='A'`, matches `word[0]='A'`. Mark `board[0][0]='#'`. What's visited? `{(0,0)}`.

- Try right: `dfs(0,1,1)` — `board[0][1]='B'`, matches `word[1]='B'`. Mark `board[0][1]='#'`. Visited: `{(0,0),(0,1)}`.
  - Try up: OOB. Try down: `dfs(1,1,2)` — `board[1][1]='E'`, matches `word[2]='E'`. `k+1=3=word.length()` → return `true`.
  - Propagates `true` all the way up. The in-place `#` marking IS the visited array — no extra space needed. The backtrack `board[i][j] = temp` only runs on the `false` path.

</details>

**Challenge 2 (Debug):** A developer forgets `board[i][j] = temp` (the backtrack step). What goes wrong on `board=[['A','B'],['A','B']]`, `word="ABA"`? Why does the search fail when it should succeed?

<details><summary>Answer</summary>

Without backtracking, `board[0][0]='A'` gets marked `'#'` permanently. The search tries path (0,0)→(0,1)→needs 'A' next. It looks down at (1,1)='B' — no. Looks left at (0,0) — but it's `'#'` now, not 'A'. The DFS fails to find "ABA" even though path (0,0)→(0,1)→(1,1) doesn't work, the path (0,0)→(1,0)→(0,0) would revisit (0,0) which is correctly prevented. The REAL valid path is (0,0)→(0,1)→(1,1) — but word[2]='A' ≠ 'B'. Actually (1,0)→(0,0)→(0,1) works: A→A→B = "AAB" ≠ "ABA". So (0,0)→(1,0)→(1,1): A→A→B = "AAB" ≠ "ABA". Valid: (0,0)→(0,1)→(1,1): A→B→B = "ABB" ≠ "ABA". The answer is this specific board has no valid "ABA" path — but the deeper lesson is: without backtracking, cells stay permanently poisoned across DIFFERENT starting points, causing false negatives when a valid path exists through a cell used by an earlier failed attempt.

</details>

## PROBLEM 12: Generate Parentheses (LC 22)

```
DIFFICULTY: Medium
COMPANIES: Amazon, Google, Facebook, Microsoft
PATTERN: Backtracking with Constraints

PROBLEM: Generate all valid combinations of n pairs of parentheses.
  Input:  n = 3
  Output: ["((()))","(()())","(())()","()(())","()()()"]

CONSTRAINTS:
  1. Can add '(' if open < n
  2. Can add ')' if close < open

SOLUTION:
```

```java
public List<String> generateParenthesis(int n) {
    List<String> result = new ArrayList<>();
    backtrack(n, 0, 0, new StringBuilder(), result);
    return result;
}

private void backtrack(int n, int open, int close, StringBuilder sb, List<String> result) {
    if (sb.length() == 2 * n) {
        result.add(sb.toString());
        return;
    }
    if (open < n) {
        sb.append('(');
        backtrack(n, open + 1, close, sb, result);
        sb.deleteCharAt(sb.length() - 1);
    }
    if (close < open) {
        sb.append(')');
        backtrack(n, open, close + 1, sb, result);
        sb.deleteCharAt(sb.length() - 1);
    }
}
```

```
COMPLEXITY: Time O(4^n / √n) — Catalan number | Space O(n)
The nth Catalan number C(n) = (2n)! / ((n+1)! × n!)
```

---

### Problem 13: Palindrome Partitioning

**LeetCode 131** | **Difficulty:** Medium

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  PALINDROME PARTITIONING (LeetCode 131 - Medium)                          ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Partition string s so every substring is a palindrome.                   ║
║  Return all possible partitions.                                          ║
║                                                                           ║
║  Example: s = "aab"                                                       ║
║  Output: [["a","a","b"], ["aa","b"]]                                      ║
║                                                                           ║
║  KEY: Backtrack trying each prefix. If prefix is palindrome, recurse      ║
║  on remaining suffix.                                                     ║
║  TIME: O(n × 2^n) | SPACE: O(n) recursion depth                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

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
    for (int end = start + 1; end <= s.length(); end++) {
        String sub = s.substring(start, end);
        if (isPalindrome(sub)) {
            path.add(sub);
            backtrack(s, end, path, result);
            path.remove(path.size() - 1);
        }
    }
}

private boolean isPalindrome(String s) {
    int l = 0, r = s.length() - 1;
    while (l < r) {
        if (s.charAt(l++) != s.charAt(r--)) return false;
    }
    return true;
}
```

---

### Problem 14: Combinations

**LeetCode 77** | **Difficulty:** Medium

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  COMBINATIONS (LeetCode 77 - Medium)                                      ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Given n and k, return all possible combinations of k numbers             ║
║  chosen from range [1, n].                                                ║
║                                                                           ║
║  Example: n = 4, k = 2                                                    ║
║  Output: [[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]                            ║
║                                                                           ║
║  KEY: Standard backtracking. Prune when remaining < needed.               ║
║  TIME: O(C(n,k) × k) | SPACE: O(k)                                        ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

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
    // Pruning: need (k - path.size()) more, so stop early
    for (int i = start; i <= n - (k - path.size()) + 1; i++) {
        path.add(i);
        backtrack(n, k, i + 1, path, result);
        path.remove(path.size() - 1);
    }
}
```

---

### Problem 15: N-Queens

**LeetCode 51** | **Difficulty:** Hard

```
╔═══════════════════════════════════════════════════════════════════════════╗
║  N-QUEENS (LeetCode 51 - Hard)                                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  Place n queens on n×n chessboard so no two attack each other.            ║
║  Return all distinct solutions.                                           ║
║                                                                           ║
║  Example: n = 4                                                           ║
║  Output: [[".Q..","...Q","Q...","..Q."],                                  ║
║           ["..Q.","Q...","...Q",".Q.."]]                                  ║
║                                                                           ║
║  KEY: Place row by row. Track cols, diags, anti-diags with sets.          ║
║  TIME: O(n!) | SPACE: O(n²)                                               ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

```java
public List<List<String>> solveNQueens(int n) {
    List<List<String>> result = new ArrayList<>();
    char[][] board = new char[n][n];
    for (char[] row : board) Arrays.fill(row, '.');
    Set<Integer> cols = new HashSet<>();
    Set<Integer> diags = new HashSet<>();     // row - col
    Set<Integer> antiDiags = new HashSet<>(); // row + col
    backtrack(board, 0, cols, diags, antiDiags, result);
    return result;
}

private void backtrack(char[][] board, int row,
        Set<Integer> cols, Set<Integer> diags, Set<Integer> antiDiags,
        List<List<String>> result) {
    if (row == board.length) {
        List<String> solution = new ArrayList<>();
        for (char[] r : board) solution.add(new String(r));
        result.add(solution);
        return;
    }
    for (int col = 0; col < board.length; col++) {
        if (cols.contains(col) || diags.contains(row - col)
                || antiDiags.contains(row + col)) continue;

        board[row][col] = 'Q';
        cols.add(col); diags.add(row - col); antiDiags.add(row + col);

        backtrack(board, row + 1, cols, diags, antiDiags, result);

        board[row][col] = '.';
        cols.remove(col); diags.remove(row - col); antiDiags.remove(row + col);
    }
}
```

---

[← WHY Recursion & Subsets — The Heart of…](01_why_recursion_subsets_the_heart_of.md) | [Chapter overview](../22_Recursion_Subsets.md)
