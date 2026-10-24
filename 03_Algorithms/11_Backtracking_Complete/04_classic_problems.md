# Classic Problems <a name="classic-problems"></a>

> **Navigation**: [← Combinations Pattern](03_combinations_pattern.md) | [Chapter overview](../11_Backtracking_Complete.md)
> Page 4 of 4 in **Backtracking Complete Guide**


## N-Queens (LeetCode 51) ⭐⭐⭐

```java
/*
Place n queens on n×n board such that no two attack each other
Queens attack: same row, column, or diagonal
*/

public List<List<String>> solveNQueens(int n) {
    List<List<String>> result = new ArrayList<>();
    int[] queens = new int[n];  // queens[row] = col position
    Arrays.fill(queens, -1);

    Set<Integer> cols = new HashSet<>();      // Columns used
    Set<Integer> diag1 = new HashSet<>();     // r - c (main diagonal)
    Set<Integer> diag2 = new HashSet<>();     // r + c (anti-diagonal)

    backtrack(n, 0, queens, cols, diag1, diag2, result);
    return result;
}

private void backtrack(int n, int row, int[] queens,
                       Set<Integer> cols, Set<Integer> diag1, Set<Integer> diag2,
                       List<List<String>> result) {
    if (row == n) {
        result.add(buildBoard(queens, n));
        return;
    }

    for (int col = 0; col < n; col++) {
        // Check if position is safe
        if (cols.contains(col)) continue;
        if (diag1.contains(row - col)) continue;
        if (diag2.contains(row + col)) continue;

        // Place queen
        queens[row] = col;
        cols.add(col);
        diag1.add(row - col);
        diag2.add(row + col);

        // Recurse to next row
        backtrack(n, row + 1, queens, cols, diag1, diag2, result);

        // Remove queen (backtrack)
        queens[row] = -1;
        cols.remove(col);
        diag1.remove(row - col);
        diag2.remove(row + col);
    }
}

private List<String> buildBoard(int[] queens, int n) {
    List<String> board = new ArrayList<>();
    for (int row = 0; row < n; row++) {
        char[] rowChars = new char[n];
        Arrays.fill(rowChars, '.');
        rowChars[queens[row]] = 'Q';
        board.add(new String(rowChars));
    }
    return board;
}
```

## Visual: N-Queens Conflict Detection

```
Queen at (row, col) attacks:

Same column: col
        ↓
    . . Q . .
    . . ↓ . .
    . . ↓ . .

Main diagonal (r - c is constant):
    Q . . . .   (0,0): r-c = 0
    . ↘ . . .   (1,1): r-c = 0
    . . ↘ . .   (2,2): r-c = 0

Anti-diagonal (r + c is constant):
    . . . . Q   (0,4): r+c = 4
    . . . ↙ .   (1,3): r+c = 4
    . . ↙ . .   (2,2): r+c = 4
```

## Sudoku Solver (LeetCode 37) ⭐⭐⭐

```java
public void solveSudoku(char[][] board) {
    backtrack(board);
}

private boolean backtrack(char[][] board) {
    // Find empty cell
    for (int row = 0; row < 9; row++) {
        for (int col = 0; col < 9; col++) {
            if (board[row][col] != '.') continue;

            // Try digits 1-9
            for (char c = '1'; c <= '9'; c++) {
                if (!isValid(board, row, col, c)) continue;

                board[row][col] = c;  // Place digit

                if (backtrack(board)) return true;  // If solved, done

                board[row][col] = '.';  // Backtrack
            }

            return false;  // No valid digit, need to backtrack
        }
    }
    return true;  // All cells filled
}

private boolean isValid(char[][] board, int row, int col, char c) {
    for (int i = 0; i < 9; i++) {
        // Check row
        if (board[row][i] == c) return false;
        // Check column
        if (board[i][col] == c) return false;
        // Check 3x3 box
        int boxRow = 3 * (row / 3) + i / 3;
        int boxCol = 3 * (col / 3) + i % 3;
        if (board[boxRow][boxCol] == c) return false;
    }
    return true;
}
```

## Word Search (LeetCode 79) ⭐⭐

```java
/*
Find if word exists in grid (moving horizontally/vertically)
*/

private int[][] DIRS = {{0,1}, {0,-1}, {1,0}, {-1,0}};

public boolean exist(char[][] board, String word) {
    int m = board.length, n = board[0].length;

    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (backtrack(board, word, i, j, 0)) {
                return true;
            }
        }
    }
    return false;
}

private boolean backtrack(char[][] board, String word,
                          int row, int col, int index) {
    // Base case: found complete word
    if (index == word.length()) return true;

    // Boundary and match check
    if (row < 0 || row >= board.length ||
        col < 0 || col >= board[0].length ||
        board[row][col] != word.charAt(index)) {
        return false;
    }

    // Mark as visited (using the cell itself)
    char temp = board[row][col];
    board[row][col] = '#';

    // Explore all 4 directions
    for (int[] dir : DIRS) {
        if (backtrack(board, word, row + dir[0], col + dir[1], index + 1)) {
            return true;
        }
    }

    // Backtrack: restore original character
    board[row][col] = temp;
    return false;
}
```

## Generate Parentheses (LeetCode 22) ⭐⭐

```java
/*
Generate all valid combinations of n pairs of parentheses
Input: n = 3
Output: ["((()))", "(()())", "(())()", "()(())", "()()()"]
*/

public List<String> generateParenthesis(int n) {
    List<String> result = new ArrayList<>();
    backtrack(n, 0, 0, new StringBuilder(), result);
    return result;
}

private void backtrack(int n, int open, int close,
                       StringBuilder current, List<String> result) {
    // Base case: used all parentheses
    if (current.length() == 2 * n) {
        result.add(current.toString());
        return;
    }

    // Can add open if we have remaining
    if (open < n) {
        current.append('(');
        backtrack(n, open + 1, close, current, result);
        current.deleteCharAt(current.length() - 1);
    }

    // Can add close only if open > close
    if (close < open) {
        current.append(')');
        backtrack(n, open, close + 1, current, result);
        current.deleteCharAt(current.length() - 1);
    }
}
```

## Letter Combinations of Phone Number (LeetCode 17) ⭐

```java
public List<String> letterCombinations(String digits) {
    if (digits.isEmpty()) return new ArrayList<>();

    String[] mapping = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
    List<String> result = new ArrayList<>();
    backtrack(digits, 0, new StringBuilder(), mapping, result);
    return result;
}

private void backtrack(String digits, int index, StringBuilder current,
                       String[] mapping, List<String> result) {
    if (index == digits.length()) {
        result.add(current.toString());
        return;
    }

    String letters = mapping[digits.charAt(index) - '0'];
    for (char c : letters.toCharArray()) {
        current.append(c);
        backtrack(digits, index + 1, current, mapping, result);
        current.deleteCharAt(current.length() - 1);
    }
}
```

## Palindrome Partitioning (LeetCode 131) ⭐⭐

```java
/*
Partition string such that every substring is a palindrome
Input: "aab"
Output: [["a","a","b"], ["aa","b"]]
*/

public List<List<String>> partition(String s) {
    List<List<String>> result = new ArrayList<>();
    backtrack(s, 0, new ArrayList<>(), result);
    return result;
}

private void backtrack(String s, int start,
                       List<String> current, List<List<String>> result) {
    if (start == s.length()) {
        result.add(new ArrayList<>(current));
        return;
    }

    for (int end = start + 1; end <= s.length(); end++) {
        String substring = s.substring(start, end);
        if (isPalindrome(substring)) {
            current.add(substring);
            backtrack(s, end, current, result);
            current.remove(current.size() - 1);
        }
    }
}

private boolean isPalindrome(String s) {
    int left = 0, right = s.length() - 1;
    while (left < right) {
        if (s.charAt(left++) != s.charAt(right--)) return false;
    }
    return true;
}
```

---

## Optimization Techniques <a name="optimization"></a>

### 1. Pruning Strategies Hierarchy (Skiena's Approach)

In _The Algorithm Design Manual_, Steven Skiena categorizes backtracking optimization (pruning) into a clear hierarchy. When your backtracking algorithm is too slow (TLE), apply these strategies in order:

#### A. Look-Ahead (Feasibility Pruning)

Can the current partial solution _ever_ be completed to form a valid solution?

- **Example:** In Sudoku, if placing a '5' leaves another cell with no possible valid numbers (e.g., all 1-9 are blocked in its row/col/box), prune immediately. Don't wait until you actually reach that empty cell.
- _Implementation:_ Often requires maintaining additional state (like remaining capacity or available elements).

#### B. Symmetry Breaking

Are you exploring a branch that is mathematically identical to one you already explored?

- **Example:** In generating combinations, `[1, 2, 3]` is the same as `[2, 1, 3]`. By enforcing an ordering (e.g., `start = i + 1` and skipping duplicates `nums[i] == nums[i-1]`), you break the symmetry and eliminate redundant branches.
- **Example 2:** In N-Queens, the board is symmetrical. You can cut the search space in half by only exploring the first half of the first row and mirroring the results.

#### C. Heuristic Ordering

Which choice should you make _first_ to find a solution quickly or prune faster?

- **Fail-First Principle (Most Constrained Variable):** Pick the decision that has the _fewest_ valid options. In Sudoku, pick the empty cell that only has 1 or 2 valid numbers left, rather than just the next cell left-to-right. This forces failures (and thus pruning) as high up in the decision tree as possible.

### 2. Basic Pruning - Code Example

```java
// Without pruning: explores invalid paths
for (int i = start; i < nums.length; i++) {
    current.add(nums[i]);
    backtrack(...);
    current.remove(...);
}

// With pruning: skip impossible cases
for (int i = start; i < nums.length; i++) {
    // Prune 1: Remaining elements won't reach target
    if (sum + nums[i] > target) break;  // (array is sorted)

    // Prune 2: Not enough elements remaining
    if (nums.length - i < k - current.size()) break;

    current.add(nums[i]);
    backtrack(...);
    current.remove(...);
}
```

### 2. Avoid String Concatenation

```java
// ❌ SLOW: Creates new String each time
private void backtrack(String current, ...) {
    // ...
    backtrack(current + c, ...);  // O(n) each call
}

// ✅ FAST: Use StringBuilder
private void backtrack(StringBuilder current, ...) {
    current.append(c);
    backtrack(current, ...);
    current.deleteCharAt(current.length() - 1);
}
```

### 3. Use Primitive Arrays Over Lists When Possible

```java
// ❌ ArrayList overhead
List<Integer> current = new ArrayList<>();

// ✅ Primitive array (when size known)
int[] current = new int[k];
int currentSize = 0;
```

### 4. Pre-sort to Enable Pruning

```java
// Sort once at the beginning
Arrays.sort(nums);

// Now can use pruning like:
if (nums[i] > remaining) break;  // All future elements also > remaining
if (i > start && nums[i] == nums[i-1]) continue;  // Skip duplicates
```

### 5. Cache Expensive Computations

```java
// For palindrome partitioning, precompute palindrome matrix
boolean[][] isPalin = new boolean[n][n];
for (int end = 0; end < n; end++) {
    for (int start = 0; start <= end; start++) {
        isPalin[start][end] = s.charAt(start) == s.charAt(end) &&
                              (end - start <= 2 || isPalin[start+1][end-1]);
    }
}
// Now check isPalin[i][j] in O(1) instead of O(n)
```

---

## Interview Problems <a name="interview-problems"></a>

### Quick Classification

**BACKTRACKING PROBLEM TYPES**

```text
SUBSETS:                    PERMUTATIONS:
- Subsets I, II             - Permutations I, II
- Combination Sum 1-3       - Next Permutation
- Palindrome Partitioning   - Permutation Sequence

COMBINATIONS:               GRID/MATRIX:
- Combinations (n,k)        - N-Queens
- Letter Combinations       - Sudoku Solver
- Generate Parentheses      - Word Search

STRING:                     PATH FINDING:
- Restore IP Addresses      - Path Sum II
- Word Break II             - All Paths from Source to Target
- Decode Ways               - Unique Paths III
```

### Restore IP Addresses (LeetCode 93) ⭐⭐

```java
public List<String> restoreIpAddresses(String s) {
    List<String> result = new ArrayList<>();
    backtrack(s, 0, new ArrayList<>(), result);
    return result;
}

private void backtrack(String s, int start, List<String> parts, List<String> result) {
    // 4 parts and used all characters
    if (parts.size() == 4 && start == s.length()) {
        result.add(String.join(".", parts));
        return;
    }
    // Invalid states
    if (parts.size() == 4 || start == s.length()) return;

    // Try 1, 2, or 3 digits
    for (int len = 1; len <= 3 && start + len <= s.length(); len++) {
        String part = s.substring(start, start + len);

        // Validate: no leading zeros, value <= 255
        if (part.length() > 1 && part.charAt(0) == '0') continue;
        if (Integer.parseInt(part) > 255) continue;

        parts.add(part);
        backtrack(s, start + len, parts, result);
        parts.remove(parts.size() - 1);
    }
}
```

### Word Break II (LeetCode 140) ⭐⭐⭐

```java
public List<String> wordBreak(String s, List<String> wordDict) {
    Set<String> dict = new HashSet<>(wordDict);
    Map<Integer, List<String>> memo = new HashMap<>();
    return backtrack(s, 0, dict, memo);
}

private List<String> backtrack(String s, int start,
                               Set<String> dict, Map<Integer, List<String>> memo) {
    if (memo.containsKey(start)) return memo.get(start);

    List<String> result = new ArrayList<>();

    if (start == s.length()) {
        result.add("");
        return result;
    }

    for (int end = start + 1; end <= s.length(); end++) {
        String word = s.substring(start, end);
        if (!dict.contains(word)) continue;

        List<String> rest = backtrack(s, end, dict, memo);
        for (String sentence : rest) {
            result.add(word + (sentence.isEmpty() ? "" : " " + sentence));
        }
    }

    memo.put(start, result);
    return result;
}
```

---

## Practice Problems List <a name="practice-list"></a>

### Easy 🟢

| Problem             | Pattern      | Key Trick         |
| ------------------- | ------------ | ----------------- |
| Subsets             | Subsets      | Every state valid |
| Letter Combinations | Combinations | Mapping array     |
| Binary Watch        | Combinations | Bit count         |
| Path Sum II         | Path finding | Track path        |

### Medium 🟡

| Problem                 | Pattern      | Key Trick             |
| ----------------------- | ------------ | --------------------- |
| Subsets II              | Subsets      | Skip duplicates       |
| Permutations I, II      | Permutations | Visited array         |
| Combinations            | Combinations | Start parameter       |
| Combination Sum 1-4     | Combinations | Vary start (i vs i+1) |
| Generate Parentheses    | Combinations | open/close count      |
| Word Search             | Grid         | 4-direction DFS       |
| Palindrome Partitioning | Subsets      | isPalindrome check    |
| Restore IP Addresses    | Combinations | Validation            |
| N-Queens                | Constraint   | Diagonal tracking     |
| Sudoku Solver           | Constraint   | isValid check         |

### Hard 🔴

| Problem                    | Pattern         | Key Trick       |
| -------------------------- | --------------- | --------------- |
| N-Queens II                | Constraint      | Count only      |
| Word Break II              | Subsets + Memo  | Memoization     |
| Expression Add Operators   | String          | Track operand   |
| Unique Paths III           | Grid            | Visit all cells |
| Remove Invalid Parentheses | BFS + Backtrack | Min removals    |

---

## Quick Reference <a name="quick-reference"></a>

### The Decision Flow

**WHICH PATTERN TO USE?**

```text
"Generate all subsets" → SUBSETS PATTERN
    start = i + 1, every state valid

"Generate all permutations" → PERMUTATIONS PATTERN
    Use visited[], iterate from 0

"Find k numbers that sum to n" → COMBINATIONS PATTERN
    start = i + 1, size = k is base case

"Can reuse elements" → start = i (not i + 1)

"Has duplicates" → Sort first + skip condition
```

### Skip Duplicates Cheat Sheet

```java
// For SUBSETS/COMBINATIONS with duplicates:
if (i > start && nums[i] == nums[i-1]) continue;

// For PERMUTATIONS with duplicates:
if (i > 0 && nums[i] == nums[i-1] && !visited[i-1]) continue;

// PRE-REQUISITE: Array must be sorted!
Arrays.sort(nums);
```

### Complexity Analysis

**TIME COMPLEXITIES**

```text
 Subsets:           O(n × 2^n)  - 2^n subsets, O(n) to copy
 Permutations:      O(n × n!)   - n! permutations, O(n) copy
 Combinations (k):  O(k × C(n,k))
 N-Queens:          O(n!)       - roughly
 Sudoku:            O(9^m)      - m = empty cells

Space: O(n) for recursion stack (excluding output)
```

### Debug Tips

```
1. Print the decision tree:
   private void backtrack(..., int depth) {
       System.out.println("  ".repeat(depth) + "Current: " + current);
       // ...
   }

2. Common bugs:
   - Forgot new ArrayList<>(current) when adding to result
   - Forgot Arrays.sort() before duplicate handling
   - Wrong skip condition for duplicates
   - Forgot to backtrack (undo the choice)

3. Test cases:
   - Empty input
   - Single element
   - All duplicates
   - Large input (check TLE)
```

---

## Summary: Master These 3 Templates

**THE 3 ESSENTIAL TEMPLATES**

```text
 1. SUBSETS (every state is answer)
    result.add(copy); // at start
    for i = start to n, start = i+1

 2. PERMUTATIONS (full length is answer)
    if size == n: add;
    for i = 0 to n, use visited[]

 3. COMBINATIONS (fixed size k is answer)
    if size == k: add;
    for i = start to n, start = i+1

All three share: CHOOSE → EXPLORE → UNCHOOSE
```

**Pro Tip:** When solving a new backtracking problem, first identify which of these 3 patterns it maps to. Then adapt the template!

---


---

## 📎 Reference Anchor

**OpenJDK / Apache Commons — backtracking in production**
- Java `regex` engine (NFA backtracking): [Pattern.java](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/regex/Pattern.java) — uses Thompson NFA with backtracking for quantifiers. **Invariant**: tries each alternative left-to-right; on failure, backtracks to the last choice point. `(a+)+b` on `"aaa...a"` (no trailing b) causes O(2ⁿ) backtracking — ReDoS vulnerability.
- Apache Commons `PermutationIterator`: [PermutationIterator.java](https://github.com/apache/commons-collections/blob/master/src/main/java/org/apache/commons/collections4/iterators/PermutationIterator.java) — generates permutations using Steinhaus-Johnson-Trotter algorithm (no backtracking, O(1) per step). Use this instead of recursive backtracking when you need ALL permutations of large n.
- **Local rewrite rule**: Prune before recursing, not after. Every early prune saves an entire subtree — check `if (invalid(partial)) return` before the recursive call, not inside it.
- **Constraint warning**: N-Queens with n > 15 takes seconds; n > 20 takes minutes. Pure backtracking is exponential — add pruning (column/diagonal bitmasks) to make n=15 run in < 1ms.

---

## When Backtracking Breaks

### 1. Forgetting to Unchoose — State Leaks Between Branches
**What breaks**: Adding an element to `currentPath` and recursing, but forgetting `currentPath.remove(currentPath.size()-1)` before the next branch. Result: subsequent branches inherit polluted state → wrong subsets/permutations.
**Fix**: The choose/recurse/unchoose triple is atomic. Write all three before testing. Alternatively, pass a new list copy to each recursive call (cleaner but uses O(n) extra space per level).

### 2. Generating Duplicates from Duplicate Input
**What breaks**: Subsets of `[1,1,2]` without deduplication produces `{1,2}` twice (once for each `1`). The backtracking tree visits both `1`s identically.
**Fix**: Sort the input. Skip `nums[i]` if `i > start && nums[i] == nums[i-1]` within the same recursion level.

### 3. Pruning Too Late — Exponential Work Before Pruning
**What breaks**: Generating a complete candidate and then checking validity at the leaf. For N-Queens, this means generating all N! arrangements and filtering — O(N! × N) instead of O(N!/(N/3)!) with diagonal pruning.
**Fix**: Check constraints incrementally at each step (is this column/diagonal safe?) and prune the whole branch early.

---

## Proof Corner

### Backtracking Correctness — Exhaustive Search Invariant

**Claim**: The choose→recurse→unchoose template correctly enumerates all valid solutions without duplicates (given unique input).

**Proof by induction on tree depth**:
- **Base**: At depth 0 (empty partial solution), the invariant holds trivially — the partial solution is valid and complete solutions are the leaves.
- **Step**: Assume at depth d, all partial solutions of length d have been correctly enumerated. At depth d+1: for each choice c available at the current state:
  1. **Choose**: add c to partial solution — the invariant holds (c was a valid next step by the check before recursion).
  2. **Recurse**: by induction hypothesis, all extensions of the partial solution with c prepended are correctly enumerated.
  3. **Unchoose**: restore state to exactly what it was before choosing c — the invariant holds for subsequent choices.
- Since we try all available choices exhaustively and restore state between them, every valid solution is reached exactly once. □

**Corollary**: Any pruning that eliminates a subtree must prove that NO valid solution exists in that subtree. If the pruning condition is sound (never eliminates valid solutions), the algorithm remains correct while reducing work.

🔬 **Section Challenge — Backtracking**

**Challenge 1 (Design — 8 min)**: Explain why the backtracking template for permutations uses a `boolean[] used` array rather than removing the element from the list. What bug does removing from list introduce?

<details><summary>Model Answer</summary>

**Why `used[]` instead of list removal**: Removing element at index i from the list shifts all subsequent elements left. When the recursion backtracks and we "unchoose" element at position i, the index i now points to a different element (the one that was shifted). This produces incorrect permutations — we'd skip some elements and repeat others.

**Correct approach**: Mark `used[i] = true` before recursion, mark `used[i] = false` after (unchoose). The element stays at its index throughout. Access via `nums[i]` is always stable.

**Alternative**: Swap `nums[i]` with `nums[start]`, recurse on `nums[start+1..n-1]`, then swap back. This avoids the `used[]` array entirely — O(1) space for the marker — but changes iteration order.

</details>

---

[← Combinations Pattern](03_combinations_pattern.md) | [Chapter overview](../11_Backtracking_Complete.md)
