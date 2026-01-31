# 🔄 Recursion: Complete Mental Model Guide

## Understanding Recursion from Brain's Perspective

---

# PART 1: WHAT IS RECURSION REALLY?

## Complete Understanding

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    RECURSION - COMPLETE UNDERSTANDING                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS RECURSION?                                                           │
├──────────────────────────────────────────────────────────────────────────────┤
│ Recursion is when a function calls ITSELF to solve smaller versions of      │
│ the SAME problem until reaching a simple case it can solve directly.        │
│                                                                              │
│ FORMAL DEFINITION: A method of solving problems where the solution          │
│ depends on solutions to smaller instances of the same problem.              │
│                                                                              │
│ INVENTOR: The concept comes from mathematical induction (1600s), but       │
│ recursive functions in computing were formalized by Stephen Kleene (1930s) │
│ and became practical with programming languages like LISP (1958).           │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DOES RECURSION SOLVE?                                           │
├──────────────────────────────────────────────────────────────────────────────┤
│ CORE PROBLEM: Some problems have SELF-SIMILAR structure - they contain      │
│ smaller versions of themselves inside them!                                  │
│                                                                              │
│ EXAMPLES:                                                                    │
│ • Folders contain subfolders (which contain subfolders...)                   │
│ • Tree nodes have children (which have children...)                          │
│ • Mathematical sequences: n! = n × (n-1)!                                   │
│ • Divide and Conquer: sort big array = sort two halves + merge              │
│                                                                              │
│ WITHOUT RECURSION:                                                           │
│ You'd need complex loops with manual stack management - very error-prone!    │
│                                                                              │
│ WITH RECURSION:                                                              │
│ Write code that mirrors the problem's natural structure - elegant & clean!   │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHY USE RECURSION OVER ITERATION?                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌────────────────────────────┬────────────────────────────────────────────┐ │
│ │ USE RECURSION WHEN         │ USE ITERATION WHEN                         │ │
│ ├────────────────────────────┼────────────────────────────────────────────┤ │
│ │ Problem has tree structure │ Linear/sequential processing               │ │
│ │ Need to backtrack          │ Simple counting/accumulation               │ │
│ │ D&C algorithms             │ Memory is very limited                     │ │
│ │ Generating combinations    │ Input size is huge (>10⁵ depth)           │ │
│ │ Tree/Graph traversal       │ Performance is critical                    │ │
│ │ Nested structures          │ Tail recursion not optimized (Java)       │ │
│ └────────────────────────────┴────────────────────────────────────────────┘ │
│                                                                              │
│ KEY INSIGHT: Every recursion CAN be converted to iteration with explicit    │
│ stack, but recursion is often more readable for tree-like problems.         │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE RECURSION? (INTERVIEW SIGNALS)                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ SIGNAL 1: "Find all..." or "Generate all..."                                │
│    → Combinations, permutations, subsets = RECURSION with backtracking     │
│                                                                              │
│ SIGNAL 2: Tree or Graph problems                                             │
│    → Tree traversal, path finding = NATURAL recursion                        │
│                                                                              │
│ SIGNAL 3: "Divide into halves" mentioned                                     │
│    → Binary search, merge sort = D&C recursion                              │
│                                                                              │
│ SIGNAL 4: Problem definition references itself                               │
│    → Fibonacci, factorial, nested structures                                 │
│                                                                              │
│ SIGNAL 5: Need to try choices and undo (backtrack)                          │
│    → N-Queens, Sudoku, maze solving                                         │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ HOW DOES RECURSION WORK BEHIND THE SCENES?                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ CALL STACK MECHANISM:                                                        │
│ When function calls itself, Java creates new "stack frame" with:            │
│   • Local variables (separate copy)                                          │
│   • Parameters (separate copy)                                               │
│   • Return address (where to go back)                                        │
│                                                                              │
│ ┌─────────────────┐                                                         │
│ │ factorial(1)    │ ← TOP (currently executing)                             │
│ │ n=1, return→2   │                                                         │
│ ├─────────────────┤                                                         │
│ │ factorial(2)    │ (waiting for result from above)                         │
│ │ n=2, return→5   │                                                         │
│ ├─────────────────┤                                                         │
│ │ factorial(3)    │ (waiting)                                               │
│ │ n=3, return→10  │                                                         │
│ └─────────────────┘                                                         │
│                                                                              │
│ Each frame WAITS until the frame above returns, then continues.             │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES & COMMON PITFALLS                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1. STACK OVERFLOW (Most Common!):                                            │
│    Cause: No base case OR base case never reached                            │
│    Java default stack: ~10,000 frames                                        │
│    Solution: Always verify base case is reachable!                           │
│                                                                              │
│ 2. EXPONENTIAL TIME COMPLEXITY:                                              │
│    Cause: Overlapping subproblems (like naive Fibonacci)                     │
│    Solution: Add memoization or convert to DP                                │
│                                                                              │
│ 3. EXTRA SPACE FROM CALL STACK:                                              │
│    Cause: O(n) stack space even if algorithm seems O(1)                      │
│    Solution: Use tail recursion or convert to iteration                      │
│                                                                              │
│ 4. DEBUGGING DIFFICULTY:                                                     │
│    Cause: Hard to trace multiple levels                                      │
│    Solution: Add print statements showing depth and parameters               │
│                                                                              │
│ 5. INFINITE RECURSION (Subtle):                                              │
│    Example: if (n == 1) return 1; return n * fact(n);  // forgot n-1!       │
│    Solution: Always check that recursive call uses SMALLER input             │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ EXPECTED OUTPUTS & COMPLEXITY                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│ TIME COMPLEXITY:                                                             │
│ • Linear recursion (1 call): O(n)                                            │
│ • Binary recursion without overlap: O(n) - like merge sort                   │
│ • Binary recursion WITH overlap: O(2^n) - like naive fib                     │
│ • Binary recursion with memo: O(n) - like optimized fib                      │
│                                                                              │
│ SPACE COMPLEXITY:                                                            │
│ • Always at least O(depth) for call stack                                    │
│ • Linear recursion: O(n) stack space                                         │
│ • Balanced binary: O(log n) stack space                                      │
│ • Unbalanced/linear: O(n) stack space                                        │
│                                                                              │
│ RECURRENCE RELATIONS:                                                        │
│ • T(n) = T(n-1) + O(1)    → O(n)      [Linear]                             │
│ • T(n) = 2T(n/2) + O(n)   → O(n log n) [Merge Sort]                        │
│ • T(n) = T(n-1) + T(n-2)  → O(2^n)     [Naive Fibonacci]                   │
└──────────────────────────────────────────────────────────────────────────────┘
```

## The Mental Model

```
RECURSION = TRUSTING YOUR FUTURE SELF

Imagine you're standing in a line of 100 people.
Someone asks: "What's your position in the line?"

NON-RECURSIVE (Loop) Thinking:
- Count everyone from the start
- 1, 2, 3, ... 99, 100
- "I'm 100th"

RECURSIVE Thinking:
- Ask the person in front: "What's your position?"
- They ask the person in front of them
- ... continues until the first person
- First person says "I'm 1st" (BASE CASE!)
- Each person adds 1 to the answer they received
- "The person behind me is position 2"
- ... continues back
- You finally get: "I'm 100th"

THE KEY INSIGHT:
You TRUST that asking the person ahead will eventually give you the answer.
You don't worry about HOW they'll figure it out.

WHY THIS WORKS:
1. Base case exists (first person knows they're #1)
2. Each step makes progress (asking person IN FRONT, not behind)
3. Combining is simple (just add 1)
```

## The Three Laws of Recursion

```
┌──────────────────────────────────────────────────────────────┐
│ LAW 1: BASE CASE                                             │
│ There MUST be a stopping condition                           │
│ Without it: INFINITE RECURSION → Stack Overflow!             │
├──────────────────────────────────────────────────────────────┤
│ LAW 2: PROGRESS TOWARD BASE CASE                             │
│ Each recursive call MUST get closer to base case             │
│ If n starts at 100, next call should use 99, then 98...     │
├──────────────────────────────────────────────────────────────┤
│ LAW 3: TRUST THE RECURSION                                   │
│ Assume the recursive call works correctly                    │
│ Focus on: "If sub-problem is solved, how do I use it?"      │
└──────────────────────────────────────────────────────────────┘
```

---

# PART 2: ANATOMY OF A RECURSIVE FUNCTION

```java
public int recursiveFunction(parameters) {

    // 1. BASE CASE - When to stop?
    if (baseCondition) {
        return baseValue;
    }

    // 2. RECURSIVE CASE - Break down the problem
    // Make progress toward base case
    int subResult = recursiveFunction(smallerProblem);

    // 3. COMBINE - Use sub-result to build answer
    return combine(subResult, currentData);
}
```

## Classic Example: Factorial

```java
// ITERATIVE
public int factorialIterative(int n) {
    int result = 1;
    for (int i = 1; i <= n; i++) {
        result *= i;
    }
    return result;
}

// RECURSIVE
public int factorial(int n) {
    // BASE CASE
    if (n == 0 || n == 1) {
        return 1;
    }

    // RECURSIVE CASE + COMBINE
    return n * factorial(n - 1);
}

// TRACING factorial(5):
//
// factorial(5)
//     └── 5 * factorial(4)
//              └── 4 * factorial(3)
//                       └── 3 * factorial(2)
//                                └── 2 * factorial(1)
//                                         └── returns 1 (BASE)
//                                returns 2 * 1 = 2
//                       returns 3 * 2 = 6
//              returns 4 * 6 = 24
//     returns 5 * 24 = 120
//
// CALL STACK VISUALIZATION:
// ┌─────────────┐
// │ factorial(1)│ ← TOP (returns 1)
// ├─────────────┤
// │ factorial(2)│ (waiting)
// ├─────────────┤
// │ factorial(3)│ (waiting)
// ├─────────────┤
// │ factorial(4)│ (waiting)
// ├─────────────┤
// │ factorial(5)│ ← BOTTOM (first call)
// └─────────────┘
```

---

# PART 3: TYPES OF RECURSION

## Type 1: Linear Recursion

```java
// Each call makes ONE recursive call
// Examples: Factorial, Sum of array

public int sum(int[] arr, int index) {
    if (index == arr.length) return 0;  // Base
    return arr[index] + sum(arr, index + 1);  // One call
}
```

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

# PART 4: RECURSION PATTERNS FOR DSA

## Pattern 1: Process and Recurse

```java
// Do something with current element, then recurse on rest
public void printArray(int[] arr, int index) {
    if (index == arr.length) return;  // Base

    System.out.println(arr[index]);   // Process current
    printArray(arr, index + 1);        // Recurse on rest
}
```

## Pattern 2: Recurse then Process

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

## Pattern 3: Binary Recursion with Divide

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

## Pattern 4: Backtracking (Choice, Explore, Unchoose)

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

# PART 5: RECURSION ON DATA STRUCTURES

## Linked List Recursion

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

## Tree Recursion

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

# PART 6: COMMON MISTAKES & HOW TO AVOID

## Mistake 1: No Base Case

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

## Mistake 2: Not Making Progress

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

## Mistake 3: Off-by-One in Base Case

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

## Mistake 4: Modifying Shared State Without Backtracking

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

# PART 7: RECURSION TO ITERATION CONVERSION

## Why Convert?

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

## Conversion Patterns

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

# PART 8: PRACTICE PROBLEMS BY DIFFICULTY

## Easy

1. **Sum of digits** - Add digits of a number
2. **Power of number** - Calculate x^n
3. **Palindrome check** - Is string palindrome?
4. **Count occurrences** - Count x in array
5. **String reverse** - Reverse using recursion

## Medium

1. **Generate parentheses** - All valid combinations
2. **Subsets** - All subsets of array
3. **Permutations** - All permutations
4. **Combination sum** - Find combinations summing to target
5. **Letter combinations** - Phone keypad problem

## Hard

1. **N-Queens** - Place N queens on board
2. **Sudoku solver** - Fill the board
3. **Word search** - Find word in grid
4. **Regular expression matching**
5. **Wildcard matching**

---

# PART 9: MENTAL EXERCISES

## Exercise 1: Trace by Hand

```
Before coding, trace these by hand:

1. factorial(4)
2. fibonacci(6)
3. reverse("hello") using recursion
4. sum([1,2,3,4,5], 0)

Draw the call stack!
Draw the return values!
```

## Exercise 2: Identify the Pattern

```
For each problem, identify:
1. What is the base case?
2. How does problem get smaller?
3. How to combine sub-results?
```

## Exercise 3: Convert

```
Take any recursive solution and:
1. Convert to tail recursion
2. Convert to iteration
3. Add memoization
```

---

# PART 10: REAL-WORLD APPLICATIONS

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

## PART 10: Recursion to Iteration Conversion

### Technique 1: Using Explicit Stack

```java
// RECURSIVE factorial
public int factorialRecursive(int n) {
    if (n <= 1) return 1;
    return n * factorialRecursive(n - 1);
}

// ITERATIVE with stack (simulates call stack)
public int factorialStack(int n) {
    Deque<Integer> stack = new ArrayDeque<>();

    // Push all "calls" onto stack
    while (n > 1) {
        stack.push(n);
        n--;
    }

    // Process stack (return phase)
    int result = 1;
    while (!stack.isEmpty()) {
        result *= stack.pop();
    }
    return result;
}

// SIMPLE iterative (direct conversion)
public int factorialIterative(int n) {
    int result = 1;
    for (int i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}
```

### Technique 2: Tree Traversal Conversion

```java
// RECURSIVE inorder
public void inorderRecursive(TreeNode root) {
    if (root == null) return;
    inorderRecursive(root.left);
    process(root);
    inorderRecursive(root.right);
}

// ITERATIVE inorder using stack
public void inorderIterative(TreeNode root) {
    Deque<TreeNode> stack = new ArrayDeque<>();
    TreeNode current = root;

    while (current != null || !stack.isEmpty()) {
        // Go left as far as possible
        while (current != null) {
            stack.push(current);
            current = current.left;
        }

        // Process current
        current = stack.pop();
        process(current);

        // Move to right subtree
        current = current.right;
    }
}

// MORRIS INORDER (O(1) space!)
public void morrisInorder(TreeNode root) {
    TreeNode current = root;

    while (current != null) {
        if (current.left == null) {
            process(current);
            current = current.right;
        } else {
            // Find inorder predecessor
            TreeNode predecessor = current.left;
            while (predecessor.right != null && predecessor.right != current) {
                predecessor = predecessor.right;
            }

            if (predecessor.right == null) {
                // Make current the right child of predecessor
                predecessor.right = current;
                current = current.left;
            } else {
                // Restore tree and process current
                predecessor.right = null;
                process(current);
                current = current.right;
            }
        }
    }
}
```

### Technique 3: Backtracking to Iteration

```java
// RECURSIVE subsets
public List<List<Integer>> subsetsRecursive(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(nums, 0, new ArrayList<>(), result);
    return result;
}

// ITERATIVE subsets using bit manipulation
public List<List<Integer>> subsetsIterative(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    int n = nums.length;
    int totalSubsets = 1 << n;  // 2^n

    for (int mask = 0; mask < totalSubsets; mask++) {
        List<Integer> subset = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            if ((mask & (1 << i)) != 0) {
                subset.add(nums[i]);
            }
        }
        result.add(subset);
    }
    return result;
}

// ITERATIVE using cascading
public List<List<Integer>> subsetsCascade(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    result.add(new ArrayList<>());  // Start with empty subset

    for (int num : nums) {
        int size = result.size();
        for (int i = 0; i < size; i++) {
            List<Integer> newSubset = new ArrayList<>(result.get(i));
            newSubset.add(num);
            result.add(newSubset);
        }
    }
    return result;
}
```

---

## PART 11: Classic Recursion Problems with Full Solutions

### Problem 1: Generate All Balanced Parentheses

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

### Problem 2: Word Search in Grid

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

### Problem 3: Letter Combinations of Phone Number

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

### Problem 4: Sudoku Solver

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

### Problem 5: Expression Add Operators

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

## PART 12: Recursion Complexity Analysis

### Time Complexity Patterns

```
┌─────────────────────────────────────────────────────────────────┐
│ RECURSION TYPE              │ RECURRENCE       │ TIME           │
├─────────────────────────────────────────────────────────────────┤
│ Linear (1 call, n→n-1)      │ T(n) = T(n-1)+1  │ O(n)           │
│ Linear (1 call, n→n/2)      │ T(n) = T(n/2)+1  │ O(log n)       │
│ Binary (2 calls, n→n-1)     │ T(n) = 2T(n-1)+1 │ O(2^n)         │
│ Binary (2 calls, n→n/2)     │ T(n) = 2T(n/2)+n │ O(n log n)     │
│ Tree traversal              │ T(n) = 2T(n/2)+1 │ O(n)           │
│ Subsets                     │ T(n) = 2T(n-1)+1 │ O(2^n)         │
│ Permutations                │ T(n) = n*T(n-1)  │ O(n!)          │
│ Fibonacci (naive)           │ T(n) = T(n-1)+T(n-2) │ O(φ^n) ≈ O(1.618^n) │
└─────────────────────────────────────────────────────────────────┘

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

_Recursion is not about memorizing - it's about TRUSTING!_ 🔄
