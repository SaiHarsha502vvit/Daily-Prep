# PART 11: Classic Recursion Problems with Full Solutions

> **Navigation**: [← Recursion to Iteration Conversion](02_recursion_to_iteration_conversion.md) | [Chapter overview](../03c_Recursion_Advanced.md) | [PART FINAL: ADVANCED RECURSION PATTERNS &… →](04_final_advanced_recursion_patterns_techniques.md)
> Page 3 of 5 in **Advanced Recursion Patterns**


## Problem 1: Generate All Balanced Parentheses

```java
public List<String> generateParenthesis(int n) {
    List<String> result = new ArrayList<>();
    generate(n, 0, 0, new StringBuilder(), result);
    return result;
}

private void generate(int n, int open, int close,
                      StringBuilder sb, List<String> result) {
    // Base case: used all parentheses
    if (sb.length() == 2 * n) {
        result.add(sb.toString());
        return;
    }

    // Can add open if haven't used all
    if (open < n) {
        sb.append('(');
        generate(n, open + 1, close, sb, result);
        sb.deleteCharAt(sb.length() - 1);  // Backtrack
    }

    // Can add close if it doesn't exceed open
    if (close < open) {
        sb.append(')');
        generate(n, open, close + 1, sb, result);
        sb.deleteCharAt(sb.length() - 1);  // Backtrack
    }
}

// Call tree for n=2:
//                ""
//                ↓ add (
//               "("
//             /      \
//        "(("          "()"
//         ↓              ↓
//       "(()"          "()("
//         ↓              ↓
//       "(())"        "()()"
```

## Problem 2: Word Search in Grid

```java
public boolean exist(char[][] board, String word) {
    int m = board.length, n = board[0].length;

    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (search(board, word, i, j, 0)) {
                return true;
            }
        }
    }
    return false;
}

private boolean search(char[][] board, String word,
                       int i, int j, int index) {
    // Found complete word
    if (index == word.length()) return true;

    // Out of bounds or wrong character
    if (i < 0 || i >= board.length ||
        j < 0 || j >= board[0].length ||
        board[i][j] != word.charAt(index)) {
        return false;
    }

    // Mark as visited
    char temp = board[i][j];
    board[i][j] = '#';

    // Explore 4 directions
    boolean found = search(board, word, i + 1, j, index + 1) ||
                    search(board, word, i - 1, j, index + 1) ||
                    search(board, word, i, j + 1, index + 1) ||
                    search(board, word, i, j - 1, index + 1);

    // Restore cell (backtrack)
    board[i][j] = temp;

    return found;
}
```

## Problem 3: Letter Combinations of Phone Number

```java
private static final String[] MAPPING = {
    "", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"
};

public List<String> letterCombinations(String digits) {
    List<String> result = new ArrayList<>();
    if (digits.isEmpty()) return result;

    combine(digits, 0, new StringBuilder(), result);
    return result;
}

private void combine(String digits, int index,
                     StringBuilder sb, List<String> result) {
    if (index == digits.length()) {
        result.add(sb.toString());
        return;
    }

    String letters = MAPPING[digits.charAt(index) - '0'];
    for (char c : letters.toCharArray()) {
        sb.append(c);
        combine(digits, index + 1, sb, result);
        sb.deleteCharAt(sb.length() - 1);
    }
}

// For "23", call tree:
//                  ""
//          /       |       \
//        "a"      "b"      "c"       (letters for '2')
//      / | \    / | \    / | \
//   "ad" "ae" "af" ...                (letters for '3')
```

## Problem 4: Sudoku Solver

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
                        board[i][j] = c;      // Choose

                        if (solve(board)) {   // Explore
                            return true;
                        }

                        board[i][j] = '.';    // Unchoose
                    }
                }
                return false;  // No valid number found
            }
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

## Problem 5: Expression Add Operators

```java
// Given "123" and target 6, return ["1+2+3", "1*2*3"]
public List<String> addOperators(String num, int target) {
    List<String> result = new ArrayList<>();
    if (num.isEmpty()) return result;

    helper(num, target, 0, 0, 0, "", result);
    return result;
}

private void helper(String num, int target, int index,
                    long eval, long multed, String path,
                    List<String> result) {
    if (index == num.length()) {
        if (eval == target) {
            result.add(path);
        }
        return;
    }

    for (int i = index; i < num.length(); i++) {
        // Skip numbers with leading zeros
        if (i != index && num.charAt(index) == '0') break;

        long curr = Long.parseLong(num.substring(index, i + 1));

        if (index == 0) {
            helper(num, target, i + 1, curr, curr, "" + curr, result);
        } else {
            // Addition
            helper(num, target, i + 1, eval + curr, curr,
                   path + "+" + curr, result);

            // Subtraction
            helper(num, target, i + 1, eval - curr, -curr,
                   path + "-" + curr, result);

            // Multiplication (need to handle precedence!)
            helper(num, target, i + 1, eval - multed + multed * curr,
                   multed * curr, path + "*" + curr, result);
        }
    }
}
```

---

🔬 **Section Challenge — PART 11: Classic Recursion Problems with Full Solutions**

**Challenge 1 (N-Queens Pruning):** The `solve()` function in N-Queens tries all 9 columns for each row. **What** is the exact worst-case number of `isValid()` calls for N=8? **When** does pruning kick in to reduce actual calls? **What** data structure change reduces `isValid()` from O(N) to O(1)?

<details><summary>Answer</summary>

**Worst-case `isValid()` calls:** Without pruning: 8^8 = 16,777,216 board states × 8 rows of isValid checks per row = up to 134M calls. In practice, with pruning (invalid columns are abandoned early), actual calls for N=8 = ~15,720. **When pruning kicks in:** On the first invalid placement at any row, the entire subtree of that partial configuration is skipped. For N=8, most branches are pruned at rows 3-5. The 92 solutions are found among ~15,720 actual explored states (vs. theoretical 16.7M worst-case). **O(1) `isValid()` with sets:** Track three boolean arrays/sets: `cols[n]`, `diag1[2n-1]` (row+col), `diag2[2n-1]` (row-col+n). On placing queen at (row,col): check `cols[col] || diag1[row+col] || diag2[row-col+n]`. If all false — valid placement. Mark all three. On backtrack: unmark all three. Each check is O(1). This reduces isValid from O(N) loop to O(1) set lookup, making N-Queens about 3x faster for large N.

</details>


## PART 12: Recursion Complexity Analysis

### Time Complexity Patterns

```
┌──────────────────────────────────────────────────────────────────────────┐
│ RECURSION TYPE              │ RECURRENCE       │ TIME                    │
├──────────────────────────────────────────────────────────────────────────┤
│ Linear (1 call, n→n-1)      │ T(n) = T(n-1)+1  │ O(n)                    │
│ Linear (1 call, n→n/2)      │ T(n) = T(n/2)+1  │ O(log n)                │
│ Binary (2 calls, n→n-1)     │ T(n) = 2T(n-1)+1 │ O(2^n)                  │
│ Binary (2 calls, n→n/2)     │ T(n) = 2T(n/2)+n │ O(n log n)              │
│ Tree traversal              │ T(n) = 2T(n/2)+1 │ O(n)                    │
│ Subsets                     │ T(n) = 2T(n-1)+1 │ O(2^n)                  │
│ Permutations                │ T(n) = n*T(n-1)  │ O(n!)                   │
│ Fibonacci (naive)           │ T(n) = T(n-1)+T(n-2) │ O(φ^n) ≈ O(1.618^n) │
└──────────────────────────────────────────────────────────────────────────┘

SPACE COMPLEXITY:
- Usually O(max recursion depth)
- For trees: O(height) = O(log n) balanced, O(n) skewed
- For subsets/permutations: O(n) for the path being built
- Plus any data structures passed/returned
```

### Counting Recursive Calls

```java
// Example: Count calls in Fibonacci
static int calls = 0;

public int fib(int n) {
    calls++;  // Count this call
    if (n <= 1) return n;
    return fib(n-1) + fib(n-2);
}

// fib(5) makes 15 calls
// fib(10) makes 177 calls
// fib(20) makes 21,891 calls
// fib(30) makes 2,692,537 calls
// fib(40) makes 331,160,281 calls!

// With memoization, fib(n) makes exactly n calls
```

---

🔬 **Section Challenge — PART 12: Recursion Complexity Analysis**

**Challenge 1 (Recurrence Solving):** The table shows `T(n) = 2T(n/2) + n → O(N log N)`. Apply the Master Theorem to solve: (A) `T(n) = 4T(n/2) + n`. (B) `T(n) = 2T(n/2) + n²`. (C) `T(n) = 3T(n/3) + n`. Identify which Master Theorem case applies.

<details><summary>Answer</summary>

**Master Theorem framework:** `T(n) = aT(n/b) + f(n)`. Compare f(n) with n^(log_b(a)). Case 1: f(n) < n^(log_b a) → T(n) = Θ(n^(log_b a)). Case 2: f(n) = n^(log_b a) → T(n) = Θ(n^(log_b a) log n). Case 3: f(n) > n^(log_b a) AND regularity → T(n) = Θ(f(n)). **(A) T(n) = 4T(n/2) + n:** log_2(4) = 2. n^2 vs. n: f(n) = n < n^2. **Case 1 → T(n) = Θ(n²).** Work dominated by leaves. **(B) T(n) = 2T(n/2) + n²:** log_2(2) = 1. n^1 vs. n²: f(n) = n² > n^1. **Case 3 → T(n) = Θ(n²).** Work dominated by root. **(C) T(n) = 3T(n/3) + n:** log_3(3) = 1. n^1 vs. n: equal. **Case 2 → T(n) = Θ(n log n).** Like Merge Sort but with base 3 split. **Real application:** Merge Sort = 2T(n/2)+n = Case 2 = O(N log N). Binary search = T(n/2)+1 = log_2(1)=0, f(n)=1 > n^0=1? Equal → Case 2 = O(log N).

</details>


## PART 13: Recursion Mental Models

### Model 1: The Manager Delegation Model

```
YOU (CEO) → Don't do all the work yourself!
Delegate to subordinates and combine their results.

factorial(5):
- You: "Hey factorial(4), what's your answer?"
- factorial(4): "24"
- You: "Great! My answer is 5 * 24 = 120"

You don't care HOW factorial(4) got 24.
You just trust that it did its job correctly.
```

### Model 2: The Smaller Copy Model

```
Recursion = Making smaller copies of the same problem

Problem: Sort [5, 2, 8, 1, 9]
         ↓
Sort smaller: Sort [2, 8, 1, 9]
              ↓
Sort smaller: Sort [8, 1, 9]
              ↓
... eventually sort [9] → trivially sorted!

Then combine results back up.
```

### Model 3: The Trust Model

```
TRUST that your recursive call works correctly.

Example: Reverse a linked list

reverseList(1 → 2 → 3 → 4 → null)

TRUST: reverseList(2 → 3 → 4 → null) = 4 → 3 → 2 → null

Now just attach node 1:
4 → 3 → 2 → 1 → null

Don't trace through every call!
Just trust the smaller call works.
```

### Model 4: The Leap of Faith

```
LEAP OF FAITH STEPS:
1. Define what your function SHOULD do
2. Write the base case
3. Make the recursive call assuming it works
4. Use the result to solve current problem

Example: Check if tree is balanced
1. isBalanced(node) returns true if subtree is balanced
2. Base: null node is balanced
3. Recursive: isBalanced(left) AND isBalanced(right)
4. Combine: Both balanced AND heights differ by ≤ 1
```

---

🔬 **Section Challenge — PART 13: Recursion Mental Models**

**Challenge 1 (Leap of Faith Apply):** Apply the 4-step Leap of Faith model to write `reverseLinkedList(Node head)` recursively. **Who** is delegated to? **What** do you trust the recursive call to return? **When** do you attach node 1, and how?

<details><summary>Answer</summary>

**Step 1 — Define:** `reverseList(head)` returns the head of the REVERSED list starting at `head`. **Step 2 — Base case:** `if (head == null || head.next == null) return head;` (single node or empty is already reversed). **Step 3 — Delegate:** `Node reversedHead = reverseList(head.next);` — TRUST that this reverses the sub-list starting at `head.next` and returns the new head of the reversed sub-list. **Step 4 — Use result:** At this point, `head.next` is the TAIL of the reversed sub-list. Attach `head` after it: `head.next.next = head; head.next = null;`. Return `reversedHead`. **The key insight (who is delegated to):** `reverseList(head.next)` reverses everything except `head`. We trust it completely. Our only job is to take the current `head` node and append it to the END of the reversed sub-list (which is the current `head.next`). Don't simulate the recursion — trust it and just wire the ONE extra connection.

</details>


## PART 14: Common Recursion Mistakes and Fixes

### Mistake 1: Missing or Wrong Base Case

```java
// WRONG - no base case, infinite recursion!
public int sum(int n) {
    return n + sum(n - 1);  // Never stops!
}

// FIXED
public int sum(int n) {
    if (n <= 0) return 0;  // Base case
    return n + sum(n - 1);
}
```

### Mistake 2: Not Making Progress Toward Base Case

```java
// WRONG - doesn't decrease n
public int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n);  // Should be n-1!
}

// FIXED
public int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);  // Progress!
}
```

### Mistake 3: Forgetting to Return

```java
// WRONG - missing return
public boolean find(TreeNode root, int target) {
    if (root == null) return false;
    if (root.val == target) return true;
    find(root.left, target);   // Result ignored!
    find(root.right, target);  // Result ignored!
    return false;
}

// FIXED
public boolean find(TreeNode root, int target) {
    if (root == null) return false;
    if (root.val == target) return true;
    return find(root.left, target) || find(root.right, target);
}
```

### Mistake 4: Not Backtracking Properly

```java
// WRONG - modifies list but doesn't restore
public void subsets(int[] nums, int i, List<Integer> curr, List<List<Integer>> res) {
    if (i == nums.length) {
        res.add(curr);  // Adding reference, not copy!
        return;
    }
    curr.add(nums[i]);
    subsets(nums, i + 1, curr, res);
    // Forgot to remove!
    subsets(nums, i + 1, curr, res);
}

// FIXED
public void subsets(int[] nums, int i, List<Integer> curr, List<List<Integer>> res) {
    if (i == nums.length) {
        res.add(new ArrayList<>(curr));  // Add COPY!
        return;
    }
    curr.add(nums[i]);
    subsets(nums, i + 1, curr, res);
    curr.remove(curr.size() - 1);  // BACKTRACK!
    subsets(nums, i + 1, curr, res);
}
```

### Mistake 5: Stack Overflow

```java
// WRONG - may overflow for large n
public long factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}
// factorial(100000) → StackOverflowError

// FIXED - use iteration for deep recursion
public long factorial(int n) {
    long result = 1;
    for (int i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

// Or use memoization to reduce depth
```

---

🔬 **Section Challenge — PART 14: Common Recursion Mistakes and Fixes**

**Challenge 1 (Bug Diagnosis):** You write: `public boolean find(TreeNode root, int target) { if (root == null) return false; if (root.val == target) return true; find(root.left, target); find(root.right, target); return false; }`. The function always returns `false` even when `target` exists. **Who** discards the answer? **When** does `true` get swallowed? **What** is the one-line fix?

<details><summary>Answer</summary>

**Who discards the answer:** The caller — `find(root.left, target)` and `find(root.right, target)` are called but their RETURN VALUES are ignored. The results are computed and then thrown away. **When `true` gets swallowed:** When `find(root.left, target)` correctly finds the target and returns `true`, that `true` is discarded. Execution continues to `find(root.right, target)` (also discarded), then falls through to `return false`. **One-line fix:** `return find(root.left, target) || find(root.right, target);`. This propagates the `true` up the call stack via short-circuit evaluation — if left subtree finds it, right subtree isn't even searched. **Common pattern:** Whenever a recursive function returns a meaningful value (boolean, int, object), you MUST capture or propagate that return value. The compiler doesn't warn you that `find(root.left, target)` without `return` discards a `boolean` — it's legal but wrong.

</details>

---

[← Recursion to Iteration Conversion](02_recursion_to_iteration_conversion.md) | [Chapter overview](../03c_Recursion_Advanced.md) | [PART FINAL: ADVANCED RECURSION PATTERNS &… →](04_final_advanced_recursion_patterns_techniques.md)
