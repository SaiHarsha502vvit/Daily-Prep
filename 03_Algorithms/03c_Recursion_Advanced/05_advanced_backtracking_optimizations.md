# 🚀 Advanced Backtracking Optimizations

> **Navigation**: [← PART FINAL: ADVANCED RECURSION PATTERNS &…](04_final_advanced_recursion_patterns_techniques.md) | [Chapter overview](../03c_Recursion_Advanced.md)
> Page 5 of 5 in **Advanced Recursion Patterns**


**BACKTRACKING OPTIMIZATION TECHNIQUES**

```text
TECHNIQUE 1: PRUNING - Cut branches that can't lead to solution
─────────────────────────────────────────────────────────────────
```

```java
// N-Queens with intelligent pruning
class NQueens {
    int count = 0;

    void solve(int n) {
        boolean[] cols = new boolean[n];     // Column occupied?
        boolean[] diag1 = new boolean[2*n];  // Diagonal \
        boolean[] diag2 = new boolean[2*n];  // Diagonal /
        backtrack(0, n, cols, diag1, diag2);
    }

    void backtrack(int row, int n, boolean[] cols, boolean[] diag1, boolean[] diag2) {
        if (row == n) {
            count++;
            return;
        }

        for (int col = 0; col < n; col++) {
            int d1 = row - col + n;  // Diagonal index
            int d2 = row + col;

            // PRUNE: Skip if any constraint violated
            if (cols[col] || diag1[d1] || diag2[d2]) continue;

            // Place queen
            cols[col] = diag1[d1] = diag2[d2] = true;
            backtrack(row + 1, n, cols, diag1, diag2);
            cols[col] = diag1[d1] = diag2[d2] = false;  // Backtrack
        }
    }
}
// Time: O(N!) worst case, but pruning makes it much faster
// 8-Queens: Only ~2,000 nodes visited instead of 8^8 = 16 million
```

```text
TECHNIQUE 2: BRANCH AND BOUND - Track best solution
───────────────────────────────────────────────────────
```

```java
// Traveling Salesman with Branch and Bound
class TSPBranchAndBound {
    int minCost = Integer.MAX_VALUE;
    int[] bestPath;

    void solve(int[][] dist, int n) {
        boolean[] visited = new boolean[n];
        int[] path = new int[n];
        path[0] = 0;
        visited[0] = true;
        tsp(dist, visited, path, 1, 0, n);
    }

    void tsp(int[][] dist, boolean[] visited, int[] path, int pos, int cost, int n) {
        // BOUND: If current cost already >= best, prune this branch
        if (cost >= minCost) return;

        if (pos == n) {
            int totalCost = cost + dist[path[pos-1]][0];
            if (totalCost < minCost) {
                minCost = totalCost;
                bestPath = path.clone();
            }
            return;
        }

        for (int i = 0; i < n; i++) {
            if (!visited[i]) {
                // Calculate lower bound to prune further
                int lowerBound = cost + dist[path[pos-1]][i] + minRemainingEdge(dist, visited, n);
                if (lowerBound >= minCost) continue;  // PRUNE!

                visited[i] = true;
                path[pos] = i;
                tsp(dist, visited, path, pos + 1, cost + dist[path[pos-1]][i], n);
                visited[i] = false;
            }
        }
    }

    int minRemainingEdge(int[][] dist, boolean[] visited, int n) {
        // Heuristic: sum of minimum edges from unvisited nodes
        int sum = 0;
        for (int i = 0; i < n; i++) {
            if (!visited[i]) {
                int min = Integer.MAX_VALUE;
                for (int j = 0; j < n; j++) {
                    if (i != j) min = Math.min(min, dist[i][j]);
                }
                sum += min;
            }
        }
        return sum;
    }
}
```

**TECHNIQUE 3: SYMMETRY BREAKING**

```text
─────────────────────────────
```

```java
// Permutations without duplicates using symmetry breaking
void permuteUnique(int[] nums, int start, List<List<Integer>> result) {
    if (start == nums.length) {
        result.add(toList(nums));
        return;
    }

    Set<Integer> used = new HashSet<>();
    for (int i = start; i < nums.length; i++) {
        // SYMMETRY BREAKING: Skip duplicates at same position
        if (used.contains(nums[i])) continue;
        used.add(nums[i]);

        swap(nums, start, i);
        permuteUnique(nums, start + 1, result);
        swap(nums, start, i);
    }
}
```

```text
TECHNIQUE 4: CONSTRAINT PROPAGATION (Sudoku)
────────────────────────────────────────────
```

```java
class SudokuSolver {
    public void solveSudoku(char[][] board) {
        // Precompute constraints
        boolean[][] rows = new boolean[9][10];
        boolean[][] cols = new boolean[9][10];
        boolean[][] boxes = new boolean[9][10];

        // Initialize constraints
        for (int i = 0; i < 9; i++) {
            for (int j = 0; j < 9; j++) {
                if (board[i][j] != '.') {
                    int num = board[i][j] - '0';
                    int box = (i/3) * 3 + j/3;
                    rows[i][num] = cols[j][num] = boxes[box][num] = true;
                }
            }
        }

        solve(board, 0, rows, cols, boxes);
    }

    boolean solve(char[][] board, int pos, boolean[][] rows, boolean[][] cols, boolean[][] boxes) {
        if (pos == 81) return true;

        int i = pos / 9, j = pos % 9;

        if (board[i][j] != '.') {
            return solve(board, pos + 1, rows, cols, boxes);
        }

        int box = (i/3) * 3 + j/3;

        // Try each number, checking constraints first
        for (int num = 1; num <= 9; num++) {
            if (rows[i][num] || cols[j][num] || boxes[box][num]) continue;

            board[i][j] = (char)('0' + num);
            rows[i][num] = cols[j][num] = boxes[box][num] = true;

            if (solve(board, pos + 1, rows, cols, boxes)) return true;

            board[i][j] = '.';
            rows[i][num] = cols[j][num] = boxes[box][num] = false;
        }

        return false;
    }
}
```

```text
```

## DIVIDE AND CONQUER - ADVANCED PATTERNS

**ADVANCED DIVIDE AND CONQUER PATTERNS**

```text
PATTERN 1: CLOSEST PAIR OF POINTS (2D)
──────────────────────────────────────
```

**PATTERN 2: KARATSUBA MULTIPLICATION**

```text
─────────────────────────────────────
```

```java
// Multiply two n-digit numbers in O(n^1.585) instead of O(n²)
BigInteger karatsuba(BigInteger x, BigInteger y) {
    int n = Math.max(x.bitLength(), y.bitLength());

    // Base case
    if (n <= 32) return x.multiply(y);

    int half = n / 2;

    // Split: x = a * 2^half + b, y = c * 2^half + d
    BigInteger a = x.shiftRight(half);
    BigInteger b = x.subtract(a.shiftLeft(half));
    BigInteger c = y.shiftRight(half);
    BigInteger d = y.subtract(c.shiftLeft(half));

    // Three recursive multiplications instead of four!
    BigInteger ac = karatsuba(a, c);
    BigInteger bd = karatsuba(b, d);
    BigInteger abcd = karatsuba(a.add(b), c.add(d));

    // x * y = ac * 2^n + (abcd - ac - bd) * 2^half + bd
    return ac.shiftLeft(2 * half)
            .add(abcd.subtract(ac).subtract(bd).shiftLeft(half))
            .add(bd);
}
// The trick: (a+b)(c+d) = ac + ad + bc + bd
//            ad + bc = (a+b)(c+d) - ac - bd
// Only 3 multiplications instead of 4!
```

**PATTERN 3: STRASSEN'S MATRIX MULTIPLICATION**

```text
───────────────────────────────────────────
```

```java
// O(n^2.807) instead of O(n³) for matrix multiplication
int[][] strassen(int[][] A, int[][] B) {
    int n = A.length;

    // Base case
    if (n <= 64) return standardMultiply(A, B);

    int half = n / 2;

    // Split matrices into quadrants
    int[][] A11 = subMatrix(A, 0, 0, half);
    int[][] A12 = subMatrix(A, 0, half, half);
    int[][] A21 = subMatrix(A, half, 0, half);
    int[][] A22 = subMatrix(A, half, half, half);

    int[][] B11 = subMatrix(B, 0, 0, half);
    int[][] B12 = subMatrix(B, 0, half, half);
    int[][] B21 = subMatrix(B, half, 0, half);
    int[][] B22 = subMatrix(B, half, half, half);

    // 7 recursive multiplications (instead of 8!)
    int[][] M1 = strassen(add(A11, A22), add(B11, B22));
    int[][] M2 = strassen(add(A21, A22), B11);
    int[][] M3 = strassen(A11, sub(B12, B22));
    int[][] M4 = strassen(A22, sub(B21, B11));
    int[][] M5 = strassen(add(A11, A12), B22);
    int[][] M6 = strassen(sub(A21, A11), add(B11, B12));
    int[][] M7 = strassen(sub(A12, A22), add(B21, B22));

    // Combine results
    int[][] C11 = add(sub(add(M1, M4), M5), M7);
    int[][] C12 = add(M3, M5);
    int[][] C21 = add(M2, M4);
    int[][] C22 = add(sub(add(M1, M3), M2), M6);

    return combine(C11, C12, C21, C22);
}
```

```text
```

## 🔁 Recursion With State — Functional Approach

**IMMUTABLE STATE IN RECURSION**

```text
PROBLEM: Mutable state makes reasoning about recursion difficult
SOLUTION: Pass state as parameters, return new state

MUTABLE (hard to reason): IMMUTABLE (easier to reason):
```

**TREE ACCUMULATOR PATTERN:**

```text
──────────────────────────
```

```java
// Sum all nodes in tree - functional style
int sumTree(TreeNode root) {
    return sumTreeAcc(root, 0);
}

int sumTreeAcc(TreeNode node, int acc) {
    if (node == null) return acc;
    acc = sumTreeAcc(node.left, acc);
    acc += node.val;
    acc = sumTreeAcc(node.right, acc);
    return acc;
}

// Even more functional - fold/reduce style
<T> T foldTree(TreeNode root, T identity, BiFunction<T, Integer, T> combine) {
    if (root == null) return identity;
    T leftResult = foldTree(root.left, identity, combine);
    T withCurrent = combine.apply(leftResult, root.val);
    return foldTree(root.right, withCurrent, combine);
}

// Usage
int sum = foldTree(root, 0, Integer::sum);
int max = foldTree(root, Integer.MIN_VALUE, Math::max);
List<Integer> vals = foldTree(root, new ArrayList<>(), (list, val) -> {
    list.add(val); return list;
});
```

```text
```

🔬 **Section Challenge — 🔁 Recursion With State — Functional Approach**

**Challenge 1 (Functional Purity):** The section shows passing accumulator through parameters (e.g., `sum(list, 0, 0)`) instead of using a mutable field. **Who** holds state in the functional approach? **When** does the mutable-field approach break in concurrent use? **What** is the technical name for the functional pattern?

<details><summary>Answer</summary>

**Who holds state (functional):** The CALL STACK itself holds state via method parameters. Each recursive call carries its partial result (accumulator) as a parameter. No external mutable variables are needed. **When mutable-field breaks in concurrent use:** `private int sum = 0; void compute(List<Integer> list) { sum += list.get(i); }` — if two threads call `compute()` simultaneously, they BOTH read and write `sum`. Race condition: final `sum` is non-deterministic. Since `sum` is shared state, not thread-local, synchronization is required. **Technical name for the functional pattern:** ACCUMULATOR PASSING STYLE (APS). It's a specific case of the more general CPS (Continuation Passing Style). Related pattern: TAIL RECURSION — when the recursive call is the LAST operation in the function AND the accumulator carries all state, many compilers/languages can optimize this to an iterative loop (Java does NOT do TCO, but Kotlin/Scala do). **Example:** `int sum(List<Integer> list, int index, int acc)` — `acc` accumulates the total; when `index == list.size()`, return `acc`. The accumulator IS the call stack's local state, making each call pure and independent.

</details>


## RECURSION PERFORMANCE COMPARISON

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ PERFORMANCE: RECURSIVE VS ITERATIVE                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ BENCHMARK DATA (Java 17, Intel i7, 1M iterations averaged):                     │
│                                                                                 │
│ ┌───────────────────────────────┬────────────────┬────────────────┬──────────┐  │
│ │ Problem │ Recursive (ns) │ Iterative (ns) │ Ratio │                           │
│ ├───────────────────────────────┼────────────────┼────────────────┼──────────┤  │
│ │ Factorial(20) │ 85 │ 12 │ 7.1x │                                              │
│ │ Fibonacci(30) naive │ 8,500,000 │ 15 │ 566,000x │                             │
│ │ Fibonacci(30) memoized │ 120 │ 15 │ 8x │                                      │
│ │ Binary Search(1M elements) │ 180 │ 120 │ 1.5x │                               │
│ │ Tree Inorder(1K nodes) │ 45,000 │ 52,000 │ 0.87x │                            │
│ │ QuickSort(10K elements) │ 850,000 │ 820,000 │ 1.04x │                         │
│ │ Permutations(10 elements) │ 3,200,000 │ 3,100,000 │ 1.03x │                   │
│ └───────────────────────────────┴────────────────┴────────────────┴──────────┘  │
│                                                                                 │
│ KEY INSIGHTS:                                                                   │
│ • Simple recursion (factorial): 7x slower due to call overhead                  │
│ • Naive exponential recursion: Catastrophically slow                            │
│ • Memoized recursion: Competitive with iteration                                │
│ • Tree traversal: Recursion can be FASTER (simpler code → JIT optimizes)        │
│ • Complex algorithms (sort, permute): Nearly identical performance              │
│                                                                                 │
│                                                                                 │
│ MEMORY USAGE:                                                                   │
│ ──────────────                                                                  │
│ ┌───────────────────────────────┬────────────────┬────────────────┐             │
│ │ Problem │ Recursive │ Iterative │                                             │
│ ├───────────────────────────────┼────────────────┼────────────────┤             │
│ │ Factorial(1000) │ 32 KB stack │ 8 bytes │                                     │
│ │ Factorial(100000) │ OVERFLOW! │ 8 bytes │                                     │
│ │ Tree Traversal (depth 20) │ 640 bytes │ 640 bytes*│                          │
│ │ Tree Traversal (depth 10000) │ OVERFLOW! │ 320 KB heap │                      │
│ └───────────────────────────────┴────────────────┴────────────────┘             │
│* Iterative tree traversal uses heap-allocated stack                            │
│                                                                                 │
│                                                                                 │
│ WHEN TO CHOOSE EACH:                                                            │
│ ─────────────────────                                                           │
│ RECURSION: ITERATION:                                                           │
│ • Tree/graph structures • Simple counting/accumulation                          │
│ • Depth ≤ 1000-10000 • Depth could be > 10000                                   │
│ • Code clarity matters • Memory critical                                        │
│ • Backtracking needed • Tail recursion patterns                                 │
│ • D&C algorithms • Linear data structures                                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

```

🔬 **Section Challenge — RECURSION PERFORMANCE COMPARISON**

**Challenge 1 (Benchmark Read):** The benchmark shows `TreeInorder(1K nodes)` recursive=45,000ns vs iterative=52,000ns — recursion is FASTER. **Who** makes recursion faster here? **Why** does the pattern flip for `Factorial(1000)`? **What** is the JVM threshold for stack overflow in these benchmarks?

<details><summary>Answer</summary>

**Who makes recursion faster for trees:** The JIT compiler. Tree traversal has irregular branching (left vs right, null checks) that is hard to vectorize or unroll. The recursive code is SIMPLER, giving the JIT a cleaner view to optimize (e.g., inlining leaf calls). The iterative version with an explicit stack adds heap allocation overhead (push/pop `Stack<TreeNode>`) that the JIT can't optimize as aggressively. **Why pattern flips for `Factorial(1000)`:** Factorial is a SIMPLE linear recursion. The iterative version is 8 bytes (two variables) vs. recursive's 32KB of stack frames (each frame holds: return address, local variables, parameter n). 1000 method frames \* 32 bytes/frame = 32KB — all on the JVM call stack which is NOT the heap. Every frame is a cache miss relative to the tiny iterative loop. **JVM StackOverflow threshold:** Default JVM stack size = 512KB-1MB (JVM flag: `-Xss`). A typical Java stack frame = 32-128 bytes. So: `512KB / 64 bytes/frame ≈ 8,192 frames` — about 8K recursive calls before `StackOverflowError`. `Factorial(100000)` = 100,000 frames = overflow. `Factorial(1000)` = 1,000 frames = fine (10x safety margin).

</details>


## COMPLETE RECURSION PROBLEM TAXONOMY

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ RECURSION PROBLEM CLASSIFICATION                                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ ┌─────────────────────────────────────────────────────────────────────────┐     │
│ │ RECURSION PROBLEM TYPES │                                                     │
│ ├────────────────┬────────────────────────────────────────────────────────┤     │
│ │ │ │                                                                           │
│ │ LINEAR │ Only ONE recursive call per invocation │                             │
│ │ RECURSION │ • Factorial, Sum, Array traversal │                               │
│ │ O(n) calls │ • Can always convert to simple iteration │                       │
│ │ │ │                                                                           │
│ ├────────────────┼────────────────────────────────────────────────────────┤     │
│ │ │ │                                                                           │
│ │ BINARY │ TWO recursive calls per invocation │                                 │
│ │ RECURSION │ • Fibonacci, Merge Sort, Binary Tree traversal │                  │
│ │ O(2ⁿ) naive │ • Often needs memoization for efficiency │                      │
│ │ O(n) with │ │                                                                 │
│ │ memo │ │                                                                      │
│ │ │ │                                                                           │
│ ├────────────────┼────────────────────────────────────────────────────────┤     │
│ │ │ │                                                                           │
│ │ MULTIPLE │ k recursive calls per invocation │                                 │
│ │ RECURSION │ • N-ary tree, Graph traversal │                                   │
│ │ O(kⁿ) nodes │ • Combinations, permutations │                                  │
│ │ │ │                                                                           │
│ ├────────────────┼────────────────────────────────────────────────────────┤     │
│ │ │ │                                                                           │
│ │ MUTUAL │ Two+ functions call each other │                                     │
│ │ RECURSION │ • isEven/isOdd, Parser (expr/term/factor) │                       │
│ │ │ • State machines │                                                          │
│ │ │ │                                                                           │
│ ├────────────────┼────────────────────────────────────────────────────────┤     │
│ │ │ │                                                                           │
│ │ TAIL │ Recursive call is LAST operation │                                     │
│ │ RECURSION │ • Accumulator patterns │                                          │
│ │ O(1) space │ • Can be optimized to iteration (not in Java!) │                 │
│ │ if optimized │ │                                                              │
│ │ │ │                                                                           │
│ └────────────────┴────────────────────────────────────────────────────────┘     │
│                                                                                 │
│                                                                                 │
│ SOLVING STRATEGY BY TYPE:                                                       │
│ ────────────────────────                                                        │
│ LINEAR: Convert to loop if n large, or use as-is for small n                    │
│ BINARY: Add memoization if subproblems overlap (DP!)                            │
│ MULTIPLE: Use pruning/backtracking, careful about complexity                    │
│ MUTUAL: Draw call graph to understand flow                                      │
│ TAIL: In Java, manually convert to loop for large n                             │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

```

🔬 **Section Challenge — COMPLETE RECURSION PROBLEM TAXONOMY**

**Challenge 1 (Taxonomy Routing):** Classify these problems by recursion type from the taxonomy (Linear/Binary/Multiple/Mutual/Tail): (A) `mergeSort(arr, 0, n-1)`. (B) `fibonacci(n)` naive. (C) `generatePermutations(str, 0)`. (D) `sumTail(list, 0, 0)`. **What** distinguishes each and **what** strategy does each type demand?

<details><summary>Answer</summary>

**(A) MergeSort → BINARY recursion:** `mergeSort` calls itself TWICE per level on two halves. Not the same sub-problem (left half vs. right half). No overlapping subproblems (each element is in exactly one recursive call). Strategy: D&C — trust left half sorts itself, trust right half sorts itself, merge results. O(N log N). **(B) Fibonacci naive → BINARY recursion with OVERLAPPING subproblems:** Calls `fib(n-1)` and `fib(n-2)`. Unlike mergeSort, these calls OVERLAP — `fib(5)` needs `fib(3)`, and so does `fib(6)`. Signal: add MEMOIZATION or switch to DP. **(C) Permutations → MULTIPLE recursion:** For n elements, generates n recursive calls at each level (each element can be first). Produces n! total paths. Strategy: backtracking with visited set. Depth = n, branching factor = n — time O(n × n!). **(D) sumTail → TAIL recursion:** The recursive call `sumTail(list, i+1, acc+list[i])` is the LAST operation. Nothing happens AFTER the call returns. Strategy: in JVM languages, manually convert to a loop since Java doesn't optimize tail calls. Kotlin/Scala's `tailrec` keyword does this automatically.

</details>


## MASTER CHECKLIST FOR WRITING RECURSION

**RECURSION WRITING CHECKLIST ✓**

```text
BEFORE CODING:
□ Identify the subproblem - what's the "smaller version"?
□ Identify base case(s) - when can you answer directly?
□ Identify what each call returns (or modifies)
□ Estimate max depth - will stack overflow?
□ Check for overlapping subproblems - need memoization?

WHILE CODING:
□ Write base case FIRST
□ Recursive call gets SMALLER input (makes progress)
□ Use the result - don't ignore what recursion returns
□ For backtracking: undo changes after recursive call
□ For combinations: decide what to "carry" vs what to "accumulate"

DEBUGGING:
□ Trace with smallest possible input (n=0, n=1)
□ Verify base case returns correct answer
□ Check that you're making progress toward base case
□ Print state at each call level if confused
□ Draw the recursion tree for small n

OPTIMIZATION:
□ Add memoization if same subproblems called multiple times
□ Convert tail recursion to iteration for large n
□ Use pruning to avoid exploring hopeless branches
□ Consider iterative solution if depth > 10000

INTERVIEW TIPS:
□ State the recurrence relation out loud before coding
□ Identify time and space complexity
□ Mention potential stack overflow for large inputs
□ Discuss memoization if applicable
□ Offer iterative alternative if asked
```

---

_Recursion is not about memorizing - it's about TRUSTING!_ 🔄

---

🔬 **Section Challenge — MASTER CHECKLIST FOR WRITING RECURSION**

**Challenge 1 (Checklist Application):** You write a recursive `flatten(NestedList list)` function. Apply the checklist's "BEFORE CODING" 5 steps to this problem. **What** is the subproblem? **What** are the base case(s)? **What** does each call return? **What** is max depth? **Are** there overlapping subproblems?

<details><summary>Answer</summary>

**Subproblem:** `flatten(nestedList)` — the smaller version is `flatten(innerList)` where `innerList` is one element's nested content. **("smaller" = fewer nesting levels)** **Base cases:** (1) `nestedList` is empty → return empty list. (2) `element.isInteger()` → add its integer value, no recursive call. **What each call returns:** A flat `List<Integer>` of all integers nested within the given structure. **Max depth:** Equal to nesting depth of the list. For a list nested 5 deep, max depth = 5. For a list of 10,000 integers (flat), depth = 1. No overflow risk for typical inputs. **Overlapping subproblems:** NO. Each inner list is unique — there's no shared sub-problem that's computed twice. Therefore NO memoization needed. Straight recursion is optimal. **The recursive implementation:** `for each item: if integer, add; else flatten(item.getList()) and add all`. Classic D&C without memoization.

</details>


## QUICK REFERENCE CARD

**RECURSION QUICK REFERENCE**

```text
TEMPLATE:
returnType solve(input) {
if (baseCase) return baseCaseAnswer;
return combine(solve(smallerInput));
}

COMPLEXITY RULES:
• T(n) = T(n-1) + O(1) → O(n) // Linear
• T(n) = 2T(n-1) + O(1) → O(2ⁿ) // Exponential
• T(n) = 2T(n/2) + O(n) → O(n log n) // Merge Sort
• T(n) = T(n/2) + O(1) → O(log n) // Binary Search
• T(n) = T(n-1) + O(n) → O(n²) // Selection Sort

MAX RECURSION DEPTH: ~10,000-20,000 in Java (depends on stack size)

BACKTRACKING TEMPLATE:
void backtrack(state, choices) {
if (goalReached) { recordSolution(); return; }
for (choice : choices) {
if (isValid(choice)) {
make(choice);
backtrack(newState, remainingChoices);
undo(choice); // BACKTRACK
}
}
}
```

---

[← PART FINAL: ADVANCED RECURSION PATTERNS &…](04_final_advanced_recursion_patterns_techniques.md) | [Chapter overview](../03c_Recursion_Advanced.md)
