# 🔁 Part 3: Types of Recursion

> **Navigation**: [← Complete Understanding](02_complete_understanding.md) | [Chapter overview](../03b_Recursion_Fundamentals.md)
> Page 3 of 3 in **Recursion Fundamentals**


## Type 1: Linear Recursion

```java
// Each call makes ONE recursive call
// Examples: Factorial, Sum of array

public int sum(int[] arr, int index) {
    if (index == arr.length) return 0;  // Base
    return arr[index] + sum(arr, index + 1);  // One call
}
```

🔬 **Section Challenge — Type 1: Linear Recursion**

**Challenge 1 (Linear Recursion Stack Cost):** `factorial(5)` with linear recursion uses 5 stack frames. If the stack frame for each call is 64 bytes, what is total stack memory for `factorial(10000)`? **When** does this cause `StackOverflowError` in Java? **What** is the iterative alternative?

<details><summary>Answer</summary>

**Stack memory:** 10,000 frames × 64 bytes = 640,000 bytes = 625 KB. Java's default thread stack is 512KB-1MB. 10,000 recursion depth is at the edge — it may StackOverflow on some JVMs depending on frame size. **When StackOverflowError occurs:** Approximately when recursion depth exceeds 5,000-10,000 for typical methods in Java. The exact limit depends on: frame size (local variables, parameters), JVM version, thread stack size (`-Xss`). **Iterative alternative:** A simple `for` loop: `long result = 1; for (int i = 2; i <= n; i++) result *= i; return result;`. Uses O(1) stack space regardless of `n`. For `n > 20`, the result overflows `long` anyway — use `BigInteger.factorial` approach. **Key lesson:** Linear recursion with large input = guaranteed StackOverflow risk. Always prefer iterative for large-n linear recursion. Reserve recursion for naturally recursive structures (trees, graphs).

</details>

## Type 2: Binary/Tree Recursion

```java
// Each call makes TWO (or more) recursive calls
// Examples: Fibonacci, Tree traversal, Merge Sort

public int fibonacci(int n) {
    if (n <= 1) return n;  // Base
    return fibonacci(n - 1) + fibonacci(n - 2);  // Two calls
}

// CALL TREE for fibonacci(5):
//                    fib(5)
//                   /      \
//              fib(4)      fib(3)
//             /    \       /    \
//         fib(3)  fib(2) fib(2) fib(1)
//         /   \    / \    / \
//      fib(2) fib(1) ...
//
// PROBLEM: Same sub-problems computed multiple times!
// fib(3) computed 2 times
// fib(2) computed 3 times
// This is why we need MEMOIZATION (see DP guide)
```

🔬 **Section Challenge — Type 2: Binary/Tree Recursion**

**Challenge 1 (Binary Recursion Cost):** `height(tree)` calls `height(left)` AND `height(right)`. For a complete binary tree of height `h`, how many recursive calls are made total? **Who** pays the O(n) cost? **When** is binary recursion acceptable vs. when does it explode?

<details><summary>Answer</summary>

**Total calls for height h:** A complete binary tree has 2^h leaf nodes and 2^h - 1 internal nodes. Total nodes = 2^(h+1) - 1. `height()` visits EVERY node once (each node is a recursive call) + the root call. Total = 2^(h+1) - 1 recursive calls. For h=20: ~2 million calls. **Who pays O(n):** Every node in the tree. This is unavoidable — to find the height, you MUST visit every node to know which subtree is deepest. **When binary recursion is acceptable:** When the problem is inherently tree-shaped (tree height, tree traversal, merge sort). Work at each call is O(1), total work = O(n nodes). **When it explodes:** Naive Fibonacci! `fib(n)` calls `fib(n-1)` and `fib(n-2)`. Total calls = O(2^n) because subproblems OVERLAP (fib(n-2) is computed separately by both `fib(n-1)` and `fib(n-2)`). Fix: memoization or DP. Binary recursion is only safe when subproblems DON'T overlap (like divide-and-conquer on disjoint ranges).

</details>

**Challenge 2 (Bug Hunt):**

```java
int fib(int n) { return n <= 1 ? n : fib(n-1) + fib(n-2); }
fib(50) // takes forever
```

Why, and what are the 3 fixes?

<details><summary>Answer</summary>

Exponential time O(2^N) — `fib(n-1)` and `fib(n-2)` each recursively recompute the same subproblems billions of times. Fix 1: Memoization — `Map<Integer,Long> memo`, return early if computed. O(N) time, O(N) space. Fix 2: Bottom-up DP — array `dp[i] = dp[i-1] + dp[i-2]`. O(N) time, O(N) space. Fix 3: O(1) space — just track last two values with two variables. O(N) time, O(1) space.
</details>

---

### The Recursion → DP Ladder — Same Computation, Four Rungs

The Fibonacci bug above isn't a special case; it's the doorway to dynamic programming. There is a **mechanical four-rung ladder** from a slow recursion to an optimal loop, and every DP you will ever write climbs these same rungs. Watch the *same* computation transform without ever changing what it computes:

**Rung 1 — Naive recursion. O(2ⁿ) time.** The call tree branches twice per node:

```java
long fib(int n) {
    if (n <= 1) return n;
    return fib(n-1) + fib(n-2);
}
```

Why it's exponential: `fib(5)` recomputes `fib(3)` twice, `fib(2)` three times, `fib(1)` five times… the recomputation count *is* a Fibonacci number. The tree has ~φⁿ nodes (φ ≈ 1.618). **The disease is overlapping subproblems** — the same `fib(k)` solved over and over.

**Rung 2 — Top-down memoization. O(n) time, O(n) space.** Keep the *exact same recursion*; add a cache that remembers each answer the first time:

```java
long[] memo;                       // sized n+1, filled with -1
long fib(int n) {
    if (n <= 1) return n;
    if (memo[n] != -1) return memo[n];          // already solved? return it
    return memo[n] = fib(n-1) + fib(n-2);       // solve once, store, reuse forever
}
```

This is the *minimal* change that cures the disease: the call tree collapses into a DAG because each `fib(k)` is computed once and read thereafter. n+1 distinct subproblems × O(1) work each = **O(n)**. Notice you did not redesign anything — you bolted a memo onto Rung 1. *This is why memoization is the gateway: it's DP you get for free from a recursion you already wrote.*

**Rung 3 — Bottom-up tabulation. O(n) time, O(n) space.** Now flip the direction. Instead of recursing *down* from n and caching on the way back, fill an array *up* from the base cases. Same dependency graph, walked forward:

```java
long fib(int n) {
    if (n <= 1) return n;
    long[] dp = new long[n+1];
    dp[0] = 0; dp[1] = 1;
    for (int i = 2; i <= n; i++)
        dp[i] = dp[i-1] + dp[i-2];   // every dependency already computed (i-1, i-2 < i)
    return dp[n];
}
```

The loop order isn't arbitrary — it's a **topological sort of the subproblem dependency graph**. `dp[i]` needs `dp[i-1]` and `dp[i-2]`, so iterating `i` upward guarantees both are ready. (That ordering question — "which subproblem must I solve before which?" — is the whole skill of writing tabulated DP. Here it's trivially left-to-right; in grid DP it's row-by-row; in interval DP it's by increasing length.) Bonus: no recursion means no call-stack, so no `StackOverflowError` for large n.

**Rung 4 — Rolling-array space optimization. O(n) time, O(1) space.** Look at the loop body: `dp[i]` only ever reads `dp[i-1]` and `dp[i-2]`. You never look further back. So why store the whole array? Keep two variables:

```java
long fib(int n) {
    if (n <= 1) return n;
    long prev2 = 0, prev1 = 1;       // dp[i-2], dp[i-1]
    for (int i = 2; i <= n; i++) {
        long cur = prev1 + prev2;    // dp[i]
        prev2 = prev1;               // slide the window forward
        prev1 = cur;
    }
    return prev1;
}
```

The general rule this illustrates: **if `dp[i]` depends only on the last k rows/cells, you need only k rows/cells of memory, not all n.** This is exactly the trick behind the 1D-rolling knapsack and the two-row edit-distance table — same move, different problem.

**The ladder as a table — memorize the rungs, not the problems:**

| Rung | Technique | Time | Space | What changed from the rung above |
|------|-----------|------|-------|----------------------------------|
| 1 | Naive recursion | O(2ⁿ) | O(n) stack | — (the starting point) |
| 2 | + Memoization | O(n) | O(n) | bolted a cache onto the recursion |
| 3 | Bottom-up tabulation | O(n) | O(n) | reversed direction; loop = topo-sort of deps |
| 4 | Rolling array | O(n) | **O(1)** | dropped cells the recurrence never reads |

You climb this *exact* ladder for House Robber, Climbing Stairs, Coin Change, Knapsack — every linear DP. The problem changes; the rungs don't. When an interviewer says "optimize further," they are asking you to climb one rung. (Full DP state-design method: [04a_DP_Internals.md](../04a_DP_Internals.md) → "How to Derive a DP From Scratch".)


## Type 3: Tail Recursion

```java
// Recursive call is the LAST operation
// Can be optimized by compiler (no stack buildup)

// NOT TAIL RECURSIVE (has multiplication AFTER recursive call)
public int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);  // Multiply happens AFTER call returns
}

// TAIL RECURSIVE (accumulator pattern)
public int factorialTail(int n, int accumulator) {
    if (n <= 1) return accumulator;
    return factorialTail(n - 1, n * accumulator);  // Nothing after call
}

// Usage: factorialTail(5, 1)
// Trace:
// factorialTail(5, 1) → factorialTail(4, 5) → factorialTail(3, 20)
// → factorialTail(2, 60) → factorialTail(1, 120) → returns 120
```
🔬 **Section Challenge — Type 3: Tail Recursion**

**Challenge 1 (Tail Recursion in Java):** Most functional languages (Scala, Haskell) optimize tail calls. Java does NOT. **Who** makes the decision NOT to optimize tail calls in Java? **When** does tail recursion STILL cause StackOverflowError in Java? **What** is the recommended Java pattern for tail-recursive algorithms?

<details><summary>Answer</summary>

**Who decides:** The JVM specification and Java language designers. The JVM bytecode spec doesn't mandate tail-call elimination (TCE). Sun/Oracle chose not to implement TCE in HotSpot JIT to maintain stack trace fidelity (TCE would eliminate frames from stack traces, making debugging harder). Scala's `@tailrec` annotation: Scala COMPILER transforms tail-recursive methods into loops at compile time before generating bytecode — it doesn't rely on JVM TCE. **When it still causes StackOverflow:** Always, for deep recursion in Java. A "tail recursive" Java method is just a regular recursive method at the bytecode level. `factorial_tail(n, acc)` calling `factorial_tail(n-1, n*acc)` still adds a frame each call. **Recommended Java pattern:** Convert to a `while` loop (trampoline pattern or direct loop). The compiler can't do it automatically. You must manually transform: `while (n > 1) { acc *= n; n--; } return acc;`. For complex mutual recursion, use a trampoline: return a `Supplier<Result>` and bounce in a loop instead of recursing.

</details>

## Type 4: Mutual Recursion

```java
// Two or more functions call each other

public boolean isEven(int n) {
    if (n == 0) return true;
    return isOdd(n - 1);
}

public boolean isOdd(int n) {
    if (n == 0) return false;
    return isEven(n - 1);
}

// Trace isEven(4):
// isEven(4) → isOdd(3) → isEven(2) → isOdd(1) → isEven(0) → true
```
---

🔬 **Section Challenge — Type 4: Mutual Recursion**

**Challenge 1 (Mutual Recursion Base Case):** `isEven(n)` calls `isOdd(n-1)`. `isOdd(n)` calls `isEven(n-1)`. **Who** terminates the mutual recursion? **When** does this mutual recursion fail? **What** is the exact base case needed for both positive and negative inputs?

<details><summary>Answer</summary>

**Who terminates:** The base cases. Without them, mutual recursion is infinite. **Correct base cases:** `isEven(0) = true`, `isOdd(0) = false`. For positive n, both functions decrease n by 1 per call, eventually reaching 0. **When it fails:** (1) **Negative input:** `isEven(-2)` calls `isOdd(-3)` calls `isEven(-4)` — n decreases infinitely, never reaches 0. Add base case: `if (n < 0) return isEven(-n)`. (2) **No base case at all:** Immediate StackOverflow. (3) **Wrong base case:** `isEven(1) = true` — wrong, but terminates. The logical error is silent. **Complete implementation:** `isEven(0)=true, isEven(n<0)=isEven(-n), isEven(n>0)=isOdd(n-1)`. Similarly for isOdd. **Key lesson:** Mutual recursion requires base cases in ALL mutually recursive methods, and input validation must handle all domains (negative, zero, positive). Missing one edge creates an infinite recursion that's hard to debug.

</details>

## 🔁 Part 4: Recursion Patterns for DSA

### Pattern 1: Process and Recurse

```java
// Do something with current element, then recurse on rest
public void printArray(int[] arr, int index) {
    if (index == arr.length) return;  // Base

    System.out.println(arr[index]);   // Process current
    printArray(arr, index + 1);        // Recurse on rest
}
```

### Pattern 2: Recurse then Process

```java
// Recurse first, then do something (reverse order!)
public void printArrayReverse(int[] arr, int index) {
    if (index == arr.length) return;  // Base

    printArrayReverse(arr, index + 1); // Recurse first
    System.out.println(arr[index]);    // Process after return
}

// For arr = [1, 2, 3]:
// Call printReverse(0)
//   Call printReverse(1)
//     Call printReverse(2)
//       Call printReverse(3) → base case, return
//     Print arr[2] = 3
//   Print arr[1] = 2
// Print arr[0] = 1
// Output: 3, 2, 1
```

### Pattern 3: Binary Recursion with Divide

```java
// Split problem in half, solve both, combine
public int maxElement(int[] arr, int left, int right) {
    // Base: single element
    if (left == right) return arr[left];

    int mid = left + (right - left) / 2;

    // Recurse on both halves
    int leftMax = maxElement(arr, left, mid);
    int rightMax = maxElement(arr, mid + 1, right);

    // Combine results
    return Math.max(leftMax, rightMax);
}
```

🔬 **Section Challenge — Pattern 3: Binary Recursion with Divide**

**Challenge 1 (Merge Sort Merge Step):** Merge sort's divide step halves the array. The merge step combines two sorted halves. **Who** does the O(n) work in merge? **When** does the merge step require extra memory? **What** is the total space complexity of recursive merge sort?

<details><summary>Answer</summary>

**Who does O(n) work:** The merge function. Two sorted arrays `L` and `R` must be combined into one sorted array. The standard implementation uses two pointers (one per array) and a TEMP array of size n. Each element is compared once and copied to temp. Total comparisons per level = O(n). **When it requires extra memory:** Always. Standard merge sort needs O(n) auxiliary space for the merge temp array. This is a key disadvantage vs QuickSort (O(log n) stack space, O(1) extra for in-place variant). **Total space complexity:** O(n) for the temp array (reused across merges) + O(log n) for the recursive call stack. Total = O(n). **In-place merge sort exists** but is O(n log² n) due to complex in-place merge logic. Not practical. **Production use:** Java's `Arrays.sort()` for objects uses TimSort (merge sort + insertion sort hybrid). `Arrays.sort()` for primitives uses dual-pivot QuickSort. The distinction: merge sort is STABLE (equal elements maintain relative order), QuickSort is NOT stable. For objects where stability matters (sort by name, then by salary), use merge sort.

</details>

**Challenge 2 (Bug Hunt):**

```java
void fib(int n) { return n<=1 ? n : fib(n-1) + fib(n-2); }
fib(50) // takes forever

```
Why and what are the 3 fixes?
<details><summary>Answer</summary>

Exponential time O(2^N) — `fib(n-1)` and `fib(n-2)` each recursively recompute the same subproblems billions of times. Fix 1: Memoization — `Map<Integer,Long> memo`, return early if computed. O(N) time, O(N) space. Fix 2: Bottom-up DP — array `dp[i] = dp[i-1] + dp[i-2]`. O(N) time, O(N) space. Fix 3: O(1) space — just track last two values with two variables. O(N) time, O(1) space.
</details>


### Pattern 4: Backtracking (Choice, Explore, Unchoose)

```java
// Make a choice, explore, undo the choice
public void generateSubsets(int[] nums, int index, List<Integer> current,
                            List<List<Integer>> result) {
    // Base: processed all elements
    if (index == nums.length) {
        result.add(new ArrayList<>(current));
        return;
    }

    // CHOICE 1: Include current element
    current.add(nums[index]);
    generateSubsets(nums, index + 1, current, result);  // Explore
    current.remove(current.size() - 1);  // UNCHOOSE (backtrack)

    // CHOICE 2: Exclude current element
    generateSubsets(nums, index + 1, current, result);  // Explore
}

// TREE VISUALIZATION for nums = [1, 2]:
//                    []
//                  /    \
//               [1]      []
//              /   \    /   \
//           [1,2]  [1] [2]  []
//
// Result: [[1,2], [1], [2], []]
```
---

## 🔁 Part 5: Recursion on Data Structures

### Linked List Recursion

```java
// Reverse a linked list
public ListNode reverseList(ListNode head) {
    // Base cases
    if (head == null || head.next == null) {
        return head;
    }

    // Recursively reverse the rest
    ListNode newHead = reverseList(head.next);

    // head.next is now the TAIL of reversed list
    // Make it point back to head
    head.next.next = head;
    head.next = null;

    return newHead;
}

// TRACING for 1→2→3→null:
//
// reverseList(1)
//   reverseList(2)
//     reverseList(3) → returns 3 (base case)
//   Now: 3→null, head=2, head.next=3
//   3.next = 2, 2.next = null → 3→2→null
//   Returns 3
// Now: head=1, head.next=2
// 2.next = 1, 1.next = null → 3→2→1→null
// Returns 3
```

🔬 **Section Challenge — Linked List Recursion**

**Challenge 1 (Linked List Reversal Trace):** `reverse(head)` recursively reverses a linked list. Trace `reverse(1→2→3→null)`. **Who** holds the new head? **When** does the recursion unwind and reconnect pointers? **What** is the pointer-manipulation order?

<details><summary>Answer</summary>

**Trace:** `reverse(1→2→3)` calls `reverse(2→3)` calls `reverse(3→null)`. Base case: returns `3` (the new head). **Unwinding (reverse order):** Frame 3 returns: `newHead=3`, `head=2`, `head.next=3`, `3.next=null`. Then: `head.next.next = head` → `3.next = 2` (3 now points back to 2). `head.next = null` → `2.next = null` (break original link). Frame 2 returns `newHead=3` to frame 1. Frame 1: `head=1`, `head.next=2`, `2.next=null` currently. `head.next.next = head` → `2.next = 1`. `head.next = null` → `1.next = null`. **Final:** `3→2→1→null`, return `newHead=3`. **Who holds new head:** `newHead` is passed up through all recursive returns. **Pointer order is critical:** MUST do `head.next.next = head` BEFORE `head.next = null`. If you set `head.next = null` first, you lose the reference to `head.next` and can't set `head.next.next`. This is the most common bug in recursive linked list reversal.

</details>

### Tree Recursion

```java
// Tree traversals
public void inorder(TreeNode root) {
    if (root == null) return;

    inorder(root.left);          // L
    System.out.print(root.val);  // N
    inorder(root.right);         // R
}

// Calculate tree height
public int height(TreeNode root) {
    if (root == null) return 0;

    int leftHeight = height(root.left);
    int rightHeight = height(root.right);

    return 1 + Math.max(leftHeight, rightHeight);
}

// Check if tree is balanced
public boolean isBalanced(TreeNode root) {
    return checkHeight(root) != -1;
}

private int checkHeight(TreeNode root) {
    if (root == null) return 0;

    int leftHeight = checkHeight(root.left);
    if (leftHeight == -1) return -1;  // Left subtree unbalanced

    int rightHeight = checkHeight(root.right);
    if (rightHeight == -1) return -1;  // Right subtree unbalanced

    if (Math.abs(leftHeight - rightHeight) > 1) return -1;  // Current unbalanced

    return 1 + Math.max(leftHeight, rightHeight);
}
```
---

🔬 **Section Challenge — Tree Recursion**

**Challenge 1 (Tree Traversal Order Selection):** A BST stores integers. You need to: (A) print values in sorted order, (B) evaluate a math expression tree, (C) delete a tree safely (free memory bottom-up). **Who** determines the correct traversal order for each? **What** order (pre/in/post) is used?

<details><summary>Answer</summary>

**(A) Print BST in sorted order → In-order (Left, Root, Right).** In a BST, in-order traversal visits nodes in ascending order. This is a fundamental BST property: left subtree < root < right subtree, so left→root→right = ascending. **(B) Evaluate expression tree → Post-order (Left, Right, Root).** Expression `(3 + 4) * 2` as a tree: root=`*`, left=`+` (children 3,4), right=`2`. To evaluate, you need the VALUE of left and right subtrees BEFORE applying the root operation. Post-order ensures operands are evaluated before operators. **(C) Delete tree safely → Post-order (Left, Right, Root).** You must delete children BEFORE their parent. In C/C++, freeing a node before its children would make children inaccessible (memory leak). Post-order ensures all descendants are freed first. **Pre-order (Root, Left, Right):** Used for: creating a copy of a tree (node must exist before children), serialization (root first for easy deserialization), file system traversal (parent dir before contents).

</details>

## 🔍 Part 6: Common Mistakes & How to Avoid

### Mistake 1: No Base Case

```java
// ❌ WRONG - Infinite recursion!
public int sum(int n) {
    return n + sum(n - 1);  // Never stops!
}

// ✅ CORRECT
public int sum(int n) {
    if (n == 0) return 0;   // BASE CASE!
    return n + sum(n - 1);
}
```

### Mistake 2: Not Making Progress

```java
// ❌ WRONG - Never reaches base case!
public void print(int n) {
    if (n == 0) return;
    print(n);  // Same n every time!
}

// ✅ CORRECT
public void print(int n) {
    if (n == 0) return;
    print(n - 1);  // n decreases toward 0
}
```

### Mistake 3: Off-by-One in Base Case

```java
// ❌ WRONG - Misses the last element
public int sumArray(int[] arr, int i) {
    if (i == arr.length - 1) return 0;  // Stops too early!
    return arr[i] + sumArray(arr, i + 1);
}

// ✅ CORRECT
public int sumArray(int[] arr, int i) {
    if (i == arr.length) return 0;  // Stops when past array
    return arr[i] + sumArray(arr, i + 1);
}
```

### Mistake 4: Modifying Shared State Without Backtracking

```java
// ❌ WRONG - path keeps accumulating
List<Integer> path = new ArrayList<>();
public void explore(int n) {
    if (n == 0) {
        result.add(path);  // All paths share same list!
        return;
    }
    path.add(n);
    explore(n - 1);
    // Missing: path.remove(path.size() - 1);
}

// ✅ CORRECT
public void explore(int n) {
    if (n == 0) {
        result.add(new ArrayList<>(path));  // Copy!
        return;
    }
    path.add(n);
    explore(n - 1);
    path.remove(path.size() - 1);  // BACKTRACK!
}
```

---

## 🔁 Part 7: Recursion to Iteration Conversion

### Why Convert?

```
RECURSION DRAWBACKS:
1. Stack space: Each call uses memory
2. Stack overflow: Too many calls
3. Overhead: Function call has cost

WHEN TO CONVERT:
- Deep recursion (n > 10000)
- Tail recursion (easy to convert)
- Performance critical code
```

### Conversion Patterns

```java
// TAIL RECURSION → Simple Loop
// Recursive
public int factorialRec(int n, int acc) {
    if (n <= 1) return acc;
    return factorialRec(n - 1, n * acc);
}

// Iterative
public int factorialIter(int n) {
    int acc = 1;
    while (n > 1) {
        acc *= n;
        n--;
    }
    return acc;
}

// TREE RECURSION → Stack-based Iteration
// Recursive inorder
public void inorderRec(TreeNode root) {
    if (root == null) return;
    inorderRec(root.left);
    visit(root);
    inorderRec(root.right);
}

// Iterative inorder
public void inorderIter(TreeNode root) {
    Stack<TreeNode> stack = new Stack<>();
    TreeNode curr = root;

    while (curr != null || !stack.isEmpty()) {
        // Go all the way left
        while (curr != null) {
            stack.push(curr);
            curr = curr.left;
        }

        // Process node
        curr = stack.pop();
        visit(curr);

        // Go right
        curr = curr.right;
    }
}
```

---

## PART 7.5: TOWER OF HANOI — The Classic First Recursion Problem

```
THE PROBLEM:
Move n disks from Source (A) to Target (C) using Auxiliary (B).
Rules: 1. Move one disk at a time
       2. Never place larger disk on smaller disk

WHY THIS IS THE PERFECT RECURSION PROBLEM:
- Base case is obvious (1 disk → just move it)
- Recursive step is elegant (move n-1, move biggest, move n-1)
- Self-similar: solving for n uses the solution for n-1 twice

THE INSIGHT (MIT 6.006 Style):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To move n disks from A → C:
  1. Move top n-1 disks from A → B (using C as helper)
  2. Move disk n (the largest) from A → C
  3. Move n-1 disks from B → C (using A as helper)

3-DISK TRACE:
  Start:     A=[3,2,1]   B=[]       C=[]

  Step 1: Move disk 1: A→C
           A=[3,2]      B=[]       C=[1]
  Step 2: Move disk 2: A→B
           A=[3]        B=[2]      C=[1]
  Step 3: Move disk 1: C→B
           A=[3]        B=[2,1]    C=[]
  Step 4: Move disk 3: A→C          ← THE BIG MOVE
           A=[]         B=[2,1]    C=[3]
  Step 5: Move disk 1: B→A
           A=[1]        B=[2]      C=[3]
  Step 6: Move disk 2: B→C
           A=[1]        B=[]       C=[3,2]
  Step 7: Move disk 1: A→C
           A=[]         B=[]       C=[3,2,1]  ✓ DONE!

  Total moves = 2^n - 1 = 2^3 - 1 = 7 moves
```

```java
// Tower of Hanoi — Classic Recursive Solution
public void towerOfHanoi(int n, char source, char target, char auxiliary) {
    if (n == 1) {
        System.out.println("Move disk 1 from " + source + " to " + target);
        return;
    }
    // Step 1: Move n-1 disks from source to auxiliary (using target as helper)
    towerOfHanoi(n - 1, source, auxiliary, target);

    // Step 2: Move the largest disk from source to target
    System.out.println("Move disk " + n + " from " + source + " to " + target);

    // Step 3: Move n-1 disks from auxiliary to target (using source as helper)
    towerOfHanoi(n - 1, auxiliary, target, source);
}

// Usage: towerOfHanoi(3, 'A', 'C', 'B');
```

```
COMPLEXITY: Time O(2^n) — must make 2^n - 1 moves (provably optimal!)
            Space O(n) — recursion depth

WHY 2^n - 1 IS OPTIMAL:
  T(n) = 2·T(n-1) + 1
  T(1) = 1
  T(n) = 2^n - 1  (by induction or Master Theorem)

  You CANNOT do better. Every state transition is necessary.
  This makes Tower of Hanoi the simplest exponential-time problem
  that's PROVABLY exponential — no clever algorithm can speed it up.

LEGEND: Buddhist monks in Hanoi are said to be moving 64 golden disks.
When they finish (2^64 - 1 moves), the world will end.
At 1 move/second, that's 585 billion years. The universe is 13.8 billion.
```

---

## 💪 Part 8: Practice Problems By Difficulty

### Easy

| #   | Problem                                                             | LC# | Pattern                  |
| --- | ------------------------------------------------------------------- | --- | ------------------------ |
| 1   | [Sum of Digits](https://leetcode.com/problems/add-digits/)          | 258 | Recursion / Math         |
| 2   | [Power of Two](https://leetcode.com/problems/power-of-two/)         | 231 | Recursion / Bit          |
| 3   | [Palindrome Check](https://leetcode.com/problems/valid-palindrome/) | 125 | Recursion / Two Pointers |
| 4   | [Reverse String](https://leetcode.com/problems/reverse-string/)     | 344 | Recursion / Two Pointers |
| 5   | [Fibonacci Number](https://leetcode.com/problems/fibonacci-number/) | 509 | Recursion → DP           |

### Medium

| #   | Problem                                                                                              | LC# | Pattern               |
| --- | ---------------------------------------------------------------------------------------------------- | --- | --------------------- |
| 1   | [Generate Parentheses](https://leetcode.com/problems/generate-parentheses/)                          | 22  | Constrained Backtrack |
| 2   | [Subsets](https://leetcode.com/problems/subsets/)                                                    | 78  | Include/Exclude       |
| 3   | [Permutations](https://leetcode.com/problems/permutations/)                                          | 46  | Backtrack + visited   |
| 4   | [Combination Sum](https://leetcode.com/problems/combination-sum/)                                    | 39  | Unbounded Backtrack   |
| 5   | [Letter Combinations of Phone](https://leetcode.com/problems/letter-combinations-of-a-phone-number/) | 17  | Backtracking          |

### Hard

| #   | Problem                                                                                   | LC# | Pattern              |
| --- | ----------------------------------------------------------------------------------------- | --- | -------------------- |
| 1   | [N-Queens](https://leetcode.com/problems/n-queens/)                                       | 51  | Constraint Backtrack |
| 2   | [Sudoku Solver](https://leetcode.com/problems/sudoku-solver/)                             | 37  | Constraint Backtrack |
| 3   | [Word Search](https://leetcode.com/problems/word-search/)                                 | 79  | Grid Backtrack       |
| 4   | [Regular Expression Matching](https://leetcode.com/problems/regular-expression-matching/) | 10  | Recursion → DP       |
| 5   | [Wildcard Matching](https://leetcode.com/problems/wildcard-matching/)                     | 44  | Recursion → DP       |

---

## 📌 Part 9: Mental Exercises

### Exercise 1: Trace by Hand

```text
Before coding, trace these by hand:

1. factorial(4)
2. fibonacci(6)
3. reverse("hello") using recursion
4. sum([1,2,3,4,5], 0)

Draw the call stack!
Draw the return values!
```

### Exercise 2: Identify the Pattern

```text
For each problem, identify:
1. What is the base case?
2. How does problem get smaller?
3. How to combine sub-results?
```

### Exercise 3: Convert

```text
Take any recursive solution and:
1. Convert to tail recursion
2. Convert to iteration
3. Add memoization
```


---

## 📌 Part 10: Real — World Applications

```
1. FILE SYSTEM TRAVERSAL
   - List all files in a directory and subdirectories
   - "Go into folder, list files, recurse into subfolders"

2. DOM TREE PARSING
   - Web browsers parse HTML recursively
   - Each element can contain child elements

3. JSON/XML PARSING
   - Nested structures need recursive parsing
   - Objects containing objects

4. COMPILER DESIGN
   - Expression parsing: (1 + (2 * (3 + 4)))
   - Each sub-expression parsed recursively

5. GAME AI
   - Minimax algorithm for chess
   - "If I move here, opponent will move there, then I..."

6. FRACTALS
   - Mandelbrot set, Sierpinski triangle
   - Self-similar patterns generated recursively
```

---

### Brute Force → Optimal: Recursion Patterns

#### Problem: Fibonacci (nth term)

**Brute Force — O(2ⁿ) naive recursion:**
```java
int fib(int n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);   // exponential: fib(40) = 10⁸ calls
}
```
**Why it's bad**: The recursion tree has height n, branching factor 2. Every call to `fib(n)` recomputes `fib(n-2)` from scratch in both branches. `fib(40)` takes ~1s; `fib(60)` takes centuries.

**The insight**: Overlapping subproblems — `fib(k)` is computed O(2ⁿ) times even though there are only n distinct values. Cache the results.

**Optimal — O(n) memoized / O(1) bottom-up:**
```java
// Memoized top-down: O(n) time, O(n) space
int fib(int n, int[] memo) {
    if (n <= 1) return n;
    if (memo[n] != -1) return memo[n];
    return memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
}

// Bottom-up: O(n) time, O(1) space
int fib(int n) {
    if (n <= 1) return n;
    int prev2 = 0, prev1 = 1;
    for (int i = 2; i <= n; i++) { int c = prev1 + prev2; prev2 = prev1; prev1 = c; }
    return prev1;
}
```
**Pattern signal**: If a recursive problem recomputes the same subproblems → memoize (top-down DP). If call order is clear → tabulate (bottom-up DP, lower overhead).

#### Problem: Power Set (all subsets)

**Brute Force — O(n · 2ⁿ) via bitmask:**
```java
// Generate all 2^n subsets using bitmask; iterate through n bits for each
for (int mask = 0; mask < (1 << n); mask++) {
    List<Integer> subset = new ArrayList<>();
    for (int i = 0; i < n; i++)
        if ((mask >> i & 1) == 1) subset.add(nums[i]);
    result.add(subset);
}
```

**Optimal — O(n · 2ⁿ) recursive backtracking (same asymptotic, better constant):**
```java
void backtrack(int[] nums, int start, List<Integer> cur, List<List<Integer>> res) {
    res.add(new ArrayList<>(cur));
    for (int i = start; i < nums.length; i++) {
        cur.add(nums[i]);
        backtrack(nums, i + 1, cur, res);
        cur.remove(cur.size() - 1);
    }
}
```
**Why backtracking wins**: It avoids allocating a list per bitmask and can prune branches early (for constrained subsets). The choose→recurse→unchoose pattern is the canonical recursion template.

---


---

[← Complete Understanding](02_complete_understanding.md) | [Chapter overview](../03b_Recursion_Fundamentals.md)
