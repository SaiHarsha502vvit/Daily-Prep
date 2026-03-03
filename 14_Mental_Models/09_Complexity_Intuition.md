# ⏱️ Complexity Intuition — Reason About Time & Space Without Formulas

> **The key insight**: You don't need to do math to estimate complexity. You need to count HOW MANY TIMES the core operation runs. This guide teaches you to "see" complexity at a glance.

---

## Part 1: The Core Principle — Count the Work

### Complexity = "How many times does the MAIN operation execute?"
```
Single loop 0 to n:          → n times → O(n)
Nested loop n × n:            → n² times → O(n²)
Loop that halves each time:   → log n times → O(log n)
Loop for each + sort first:   → n log n + n → O(n log n)
Try all subsets:              → 2ⁿ subsets → O(2ⁿ)
Try all permutations:         → n! orderings → O(n!)
```

### Visual Intuition
```
O(1)       →  Constant: same work regardless of input size
               ●

O(log n)   →  Binary search: halving each step
               ●●●●  (only ~20 steps for n = 1,000,000)

O(n)       →  Single pass: touch each element once
               ●●●●●●●●●●●●●●●●

O(n log n) →  Sort + process: sorting dominates
               ●●●●●●●●●●●●●●●● × ~20

O(n²)      →  Nested loops: each pair
               ██████████████████
               ██████████████████  (n rows × n cols)
               ██████████████████

O(2ⁿ)      →  Exponential: doubles each step
               ●→●●→●●●●→●●●●●●●●  (explodes!)

O(n!)      →  Factorial: even worse
               Everything × everything × everything...
```

---

## Part 2: Pattern Recognition — See Complexity at a Glance

### Pattern → Complexity Mapping
```
CODE PATTERN                                    COMPLEXITY
──────────────────────────────────────────────  ──────────
Single for loop (0 to n)                        O(n)
Two separate for loops (not nested)             O(n) + O(n) = O(n)
Nested for loops (both 0 to n)                  O(n²)
Three nested loops                              O(n³)
for loop + binary search inside                 O(n log n)
Sort array + single pass                        O(n log n)
Loop that halves (i /= 2 or i *= 2)           O(log n)
Recursion with 2 branches, depth n              O(2ⁿ)
Recursion with 2 branches, depth log n          O(n)  (like merge sort)
HashMap lookup inside loop                      O(n) × O(1) = O(n)
BFS/DFS on graph                                O(V + E)
DP with 1D table                                O(n)
DP with 2D table                                O(n × m) or O(n²)
```

### The "How Many Times Does Each Line Run?" Method
```java
// Example 1:
for (int i = 0; i < n; i++) {           // Runs n times
    for (int j = i; j < n; j++) {        //   Runs n-i times
        doSomething();                    //     Total: n + (n-1) + ... + 1 = n(n+1)/2
    }
}
// → O(n²)  (even though inner loop shrinks, it's still n²/2 → O(n²))

// Example 2:
for (int i = 1; i < n; i *= 2) {        // i = 1, 2, 4, 8, ..., n → log₂(n) times
    for (int j = 0; j < n; j++) {        //   Runs n times each
        doSomething();
    }
}
// → O(n log n)

// Example 3:
for (int i = 0; i < n; i++) {           // n times
    for (int j = 0; j < m; j++) {        //   m times
        doSomething();
    }
}
// → O(n × m)  (NOT O(n²) unless n == m)
```

---

## Part 3: Recursion Complexity — Use the Tree Method

### Step 1: Draw the Recursion Tree
### Step 2: Count Total Nodes (= total function calls)
### Step 3: Multiply by work per call

```
Example: Merge Sort
                    mergeSort(n)                → merge work: n
                   /            \
          mergeSort(n/2)    mergeSort(n/2)      → merge work: n/2 + n/2 = n
           /      \          /      \
      ms(n/4)  ms(n/4)  ms(n/4)  ms(n/4)       → merge work: 4 × n/4 = n
      ...                                       → each level does O(n) total work
      
Depth of tree: log₂(n)
Work per level: O(n)
TOTAL: O(n) × log₂(n) = O(n log n)  ✅
```

```
Example: Fibonacci(n) — naive recursion
                    fib(5)
                   /       \
              fib(4)       fib(3)
             /    \        /    \
          fib(3) fib(2) fib(2) fib(1)
          /  \
       fib(2) fib(1)

Branching factor: 2
Depth: n
Total nodes: ~2ⁿ  (each level doubles)
Work per call: O(1)
TOTAL: O(2ⁿ)  ← This is why memoization matters!

With memoization: Each unique state computed ONCE
Unique states: n
Work per state: O(1)
TOTAL: O(n)  ✅ Huge improvement!
```

### The Master Theorem (Intuitive Version)
```
For divide-and-conquer: T(n) = a · T(n/b) + O(nᶜ)
  a = number of subproblems
  b = how much smaller each subproblem is
  c = cost of dividing + combining

Intuitive rules:
- If splitting work is cheap → O(n^(log_b(a)))       [leaves dominate]
- If splitting work matches → O(nᶜ · log n)          [balanced]  
- If splitting work is expensive → O(nᶜ)              [root dominates]

Examples:
  Binary Search: T(n) = 1·T(n/2) + O(1) → O(log n)
  Merge Sort:    T(n) = 2·T(n/2) + O(n) → O(n log n)
  Karatsuba:     T(n) = 3·T(n/2) + O(n) → O(n^1.58)
```

---

## Part 4: Space Complexity — What Counts?

### What Uses Space
```
1. Variables:           O(1) — int, long, boolean
2. Arrays/Lists:        O(n) — size n
3. 2D Arrays:           O(n²) or O(n×m)
4. HashMap:             O(n) — up to n entries
5. Recursion stack:     O(depth) — hidden space!
6. Queue (BFS):         O(width) — max nodes at one level
7. String concatenation: O(n) per new string created
```

### Common Space Complexities
```
APPROACH                          SPACE
────────────────────────────      ──────
In-place swap/pointer             O(1)
Single extra array                O(n)
HashMap/HashSet                   O(n)
2D DP table                       O(n²) → can often reduce to O(n)
Recursive DFS                     O(height) — O(log n) balanced, O(n) worst
BFS queue                         O(width) — O(n) worst (complete binary tree last level)
Adjacency list                    O(V + E)
Sorting (merge sort)              O(n) extra; quicksort O(log n) stack
```

### The "Rolling Array" Optimization
```
When DP row i only depends on row i-1:
  Original: dp[n][m] → O(n × m) space
  Optimized: dp[2][m] → O(m) space (alternate between rows)
  Even better: dp[m] → O(m) (overwrite in-place if direction allows)
```

---

## Part 5: Amortized Complexity — "Average Over Time"

### The Bank Account Analogy
```
ArrayList.add():
  Usually O(1) — just append
  Sometimes O(n) — array full, must copy to larger array

But after n additions:
  Total work = n (appending) + n (one copy at end) = 2n
  Average per operation = 2n / n = O(1) amortized

It's like saving coins daily (O(1)) and occasionally paying a big bill (O(n)),
but the savings always cover the bill. On AVERAGE, each day costs O(1).
```

### Common Amortized O(1) Operations
```
ArrayList.add()         → O(1) amortized (despite occasional O(n) resize)
HashMap.put()           → O(1) amortized (despite occasional O(n) rehash)
Stack operations in     → O(1) amortized (push/pop over all operations)
  monotonic stack
Union-Find with path    → O(α(n)) ≈ O(1) amortized (inverse Ackermann)
  compression
```

---

## Part 6: Constraint → Complexity Quick Reference

### Given n, What Complexity Do I Need?
```
n ≤ 10      → Anything goes: O(n!), O(2ⁿ), O(n⁴)
n ≤ 20      → O(2ⁿ), O(n² · 2ⁿ)
n ≤ 100     → O(n³)
n ≤ 500     → O(n³) with small constant
n ≤ 1,000   → O(n²)
n ≤ 5,000   → O(n²) comfortably
n ≤ 10,000  → O(n²) barely, prefer O(n log n)
n ≤ 100,000 → O(n log n) or O(n)
n ≤ 500,000 → O(n log n)
n ≤ 10⁶     → O(n) or O(n log n) with small constant
n ≤ 10⁸     → O(n) only
n > 10⁸     → O(log n), O(√n), or O(1)
```

### Given Complexity, How Fast In Practice?
```
Assume ~10⁸ operations per second (rough estimate):

O(n)       with n = 10⁸  → ~1 second
O(n log n) with n = 10⁶  → ~20 million ops → ~0.2 seconds
O(n²)      with n = 10⁴  → 10⁸ → ~1 second
O(n³)      with n = 500   → 1.25 × 10⁸ → ~1.2 seconds
O(2ⁿ)      with n = 25    → ~33 million → ~0.3 seconds
O(n!)      with n = 11    → ~40 million → ~0.4 seconds
```

---

## Part 7: Quick Complexity Checklist

```
After writing code, for TIME complexity:
□ Count nested loop depth → O(n^depth)
□ Does any loop halve? → Multiply by log n
□ Recursion? → Draw tree, count total calls
□ Using sorting? → At least O(n log n)
□ HashMap operations → O(1) each
□ Does my complexity fit the constraint?

For SPACE complexity:
□ What data structures did I create? What size?
□ Recursion? → Stack depth = O(depth)
□ Am I creating strings in a loop? → O(n) per iteration!
□ Can I reduce 2D DP to 1D?
□ Can I do it in-place?
```

---

📖 **Related Files:**
- [01_Recursion_Tree_Thinking.md](01_Recursion_Tree_Thinking.md) — Recursion tree complexity
- [02_DP_State_Thinking.md](02_DP_State_Thinking.md) — DP complexity analysis
- [05_Universal_Problem_Framework.md](05_Universal_Problem_Framework.md) — Constraint-to-complexity mapping

---
[← 08 Debugging & Dry Run](08_Debugging_DryRun.md) | [10 Interview Thinking →](10_Interview_Thinking.md)
