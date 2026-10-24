# 11.4 Grid Backtracking

> **Navigation**: [← 11.3 String Backtracking](03_string_backtracking.md) | [Chapter overview](../12_Backtracking.md)
> Page 4 of 4 in **Backtracking**


> **Pattern:** Explore grid cells recursively with visited tracking. Undo visited on backtrack.
> **N-Queens:** Place one queen per row. Track attacked columns and diagonals with sets.
> **Sudoku:** Try digits 1-9 at each empty cell. Check row/col/box constraints.
> **Key insight:** The more constraints you check EARLY (pruning), the faster it runs.

## Problem 186: Word Search

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

## Problem 187: N-Queens

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

## Problem 188: Sudoku Solver

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

A top-left-to-bottom-right diagonal is defined by all cells where moving one step right (+1 col) also moves one step down (+1 row). So `row` and `col` increase by the same amount → their _difference_ stays constant. Cell (0,0) and (1,1) and (2,2) all have `row-col = 0`. Cell (0,1) and (1,2) have `row-col = -1`. Each unique value of `row-col` identifies exactly one diagonal. Similarly, anti-diagonals go top-right-to-bottom-left: moving right (+1 col) moves UP (-1 row), so `row+col` stays constant. This gives O(1) conflict checking with HashSets instead of O(n) scanning. The values range from `-(n-1)` to `+(n-1)` for diagonals and `0` to `2(n-1)` for anti-diagonals.

</details>

## 🏆 Competitive Programming — Codeforces Problems

| Problem                     | Link                                                         | Technique                  | Difficulty  |
| --------------------------- | ------------------------------------------------------------ | -------------------------- | ----------- |
| Vitaly and Strange Function | [CF 493B](https://codeforces.com/problemset/problem/493/B)   | Backtracking + math        | ⭐⭐ Medium |
| Pashmak's Garden            | [CF 459D](https://codeforces.com/problemset/problem/459/D)   | Permutation backtracking   | ⭐⭐ Medium |
| Colorful Bricks             | [CF 1081B](https://codeforces.com/problemset/problem/1081/B) | Combinatorics (BT reduced) | ⭐ Easy     |
| Dreamoon and Stairs         | [CF 476B](https://codeforces.com/problemset/problem/476/B)   | BT with fixed path         | ⭐ Easy     |
| Tokitsukaze and Brackets    | [CF 1303D](https://codeforces.com/problemset/problem/1303/D) | BT + stack validation      | ⭐⭐ Medium |

---

> 🔬 **Section Challenge — 🏆 Competitive Programming — Codeforces Problems**

**Challenge 1 (Reasoning):** The table mentions "BT with fixed path" and "BT + stack validation." When does adding a constraint (like a stack) actually HELP performance rather than hurt it?

<details><summary>Answer</summary>

Constraints HELP when they enable **early pruning** — rejecting invalid branches before fully exploring them. Without the stack constraint in bracket validation, you'd generate ALL 2^n binary strings and check validity afterward (O(2^n × n)). With the stack, you reject `")("` at the second character instead of generating all 2^n suffixes. The stack acts as a **running invariant**: if it's violated at depth d, you prune the entire subtree of size 2^(n-d). More constraints = more pruning = fewer nodes visited. This is why Sudoku with constraint propagation (naked singles, hidden singles) visits ~100 nodes, while brute-force backtracking visits ~100,000. **Constraints are not overhead — they are the pruning function.**

</details>

## 🌍 Real-World Applications of Backtracking

| Technique                   | Real-World System                     | How It's Used                                                     |
| --------------------------- | ------------------------------------- | ----------------------------------------------------------------- |
| **Constraint satisfaction** | Sudoku validators (apps, games)       | DFS with pruning: if constraint violated, backtrack immediately   |
| **Route planning**          | Delivery route optimization           | Vehicle routing = TSP approximation via backtracking + heuristics |
| **Regex matching**          | Every text editor, grep, IntelliJ     | Regular expression engine uses backtracking on NFA state graph    |
| **Parsing**                 | Compilers (recursive-descent parsers) | Parse grammar by trying rules; backtrack on failure               |
| **Puzzle solvers**          | 8-queens, crossword generators        | Classic backtracking: place piece, check valid, recurse, undo     |

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


> 🔬 **Section Challenge — 🌍 Real-World Applications of Backtracking**

**Challenge 1 (Reasoning):** The regex example shows `a*b` causing backtracking on `"aaac"`. Explain why the pattern `(a+)+b` on input `"aaaaaaaaaaaaaac"` causes _exponential_ backtracking (ReDoS), while `a+b` on the same input doesn't.

<details><summary>Answer</summary>

`a+b`: the engine matches all a's greedily, fails on 'c', backtracks one 'a' at a time. Total attempts = n (one per 'a' released). Linear. `(a+)+b`: the OUTER `+` means "one or more groups of (a+)." The engine can split the a's into groups in exponentially many ways: `(aaaa)`, `(aaa)(a)`, `(aa)(aa)`, `(aa)(a)(a)`, `(a)(a)(a)(a)`, etc. For n a's, there are 2^(n-1) ways to partition — and the engine tries ALL of them before concluding no match. This is **catastrophic backtracking** / ReDoS. Fix: use atomic groups `(?>a+)+b` or possessive quantifiers `(a++)b` which prevent the engine from backtracking into a group once it's matched. Modern regex engines (RE2, Rust regex) use NFA simulation instead of backtracking, making them immune.

</details>

---

### Historical Evolution

The word *backtrack* was coined by D. H. Lehmer in the 1950s; R. J. Walker described an enumerative backtracking method in 1960 and Golomb and Baumert's *Backtrack Programming* (1965) gave the general framework. The eight-queens puzzle dates to Bezzel (1848) and was studied by Nauck and Gauss in the 1850s; Dijkstra used it in 1972 to illustrate structured programming. Davis, Putnam, Logemann and Loveland (1960–62) applied backtracking to satisfiability, and Knuth's Dancing Links (2000) sped up exact-cover search.

- **Bezzel — 1848**: Eight queens puzzle
- **Walker — 1960**: Enumerative backtracking
- **DPLL — 1960–62**: Backtracking SAT solver
- **Golomb & Baumert — 1965**: *Backtrack Programming*
- **Knuth — 2000**: Dancing Links

### Production Reality

**Backtracking** patterns introduce several production failure modes that learners must internalize:

**Failure mode 1: Exponential blowup (2^N) without pruning.** Generating all subsets of n=25 elements produces 2^25 = 33,554,432 results. With n=30, this jumps to 1,073,741,824. Storing all results in a `List<List<Integer>>` exhausts heap memory, causing `OutOfMemoryError`. Illustrative impact: A product recommendation engine generating all combinations of 25 product tags for a user profile crashes in production.

**Failure mode 2: Missing state restoration (UNCHOOSE step).** Forgetting `path.remove(path.size() - 1)` after recursion means the path carries forward into sibling branches. For subsets of [1,2], this produces [[],[1],[1,2],[1,2,2]] instead of the correct 8 subsets. Illustrative impact: A Sudoku solver returns wrong solutions, allowing invalid game states through.

**Failure mode 3: Stack overflow for deep recursion.** Permutations of n=15,000 has depth 15,000, crashing well before generating any output. Illustrative impact: A regex engine processing a long string with catastrophic backtracking (e.g., pattern `(a+)+b` on input `aaaaaaaaaac`) causes request timeouts and denial-of-service on web servers.

**Debug workflow:** Set a maximum depth guard: `if (depth > maxDepth) return;`. Add memoization via a `Set<String>` of serialized paths to avoid recomputing identical subtrees. For missing UNCHOOSE, add a unit test that prints the path after each backtrack call and verifies path size returns to its pre-recursion value. For exponential blowup, profile the result list size: if it exceeds `10^6`, switch to a lazy generator or streaming approach.

**Real-world anchor:** On 2 July 2019 a regular expression in a Cloudflare web-application-firewall rule with catastrophic backtracking drove CPU usage to 100% across its edge servers, causing about 27 minutes of errors worldwide. Unbounded backtracking is a production risk, not just a contest problem.

---

[← 11.3 String Backtracking](03_string_backtracking.md) | [Chapter overview](../12_Backtracking.md)
