# 🔗 JIT Connection — When You Need This

> **Navigation**: [Chapter overview](../03b_Recursion_Fundamentals.md) | [Complete Understanding →](02_complete_understanding.md)
> Page 1 of 3 in **Recursion Fundamentals**


**Arrived here from a problem that said "find all..." or involved a tree/graph?**

| Recursion type                             | When you use it                   | Jump to PS Problems                                         |
| ------------------------------------------ | --------------------------------- | ----------------------------------------------------------- |
| **Linear recursion**                       | Factorial, linked list operations | [LinkedList PS](../../05_Problem_Solving/15_LinkedList.md)     |
| **Binary recursion** (no overlap)          | Tree height, Merge Sort           | [Trees PS](../../05_Problem_Solving/09_Trees.md)               |
| **Binary recursion** (with overlap)        | Fibonacci → **add memo → DP!**    | [DP PS](../../05_Problem_Solving/11_Dynamic_Programming.md)                     |
| **Backtracking** (Choose-Explore-Unchoose) | Subsets, Permutations, N-Queens   | [Backtracking PS](../../05_Problem_Solving/12_Backtracking.md) |
| **DFS** on graph                           | Islands, connected components     | [Graphs PS](../../05_Problem_Solving/10_Graphs.md)             |

**Signal → Tool mapping:**

```
"Find ALL combinations/subsets/paths" → Backtracking (recursion + undo)
"Repeated sub-problems in recursion?" → Add memoization → DP
"Tree problem?" → Recursion (trust child returns the right answer)
```

📋 **All Patterns Hub:** [00_PATTERN_MASTER_GUIDE.md](../../04_Patterns_Templates/00_PATTERN_MASTER_GUIDE.md)

---

## 🎓 University Proof Corner

> **MIT 6.042J / KTH DD1352 / TU Munich MA1401 layer** — How to prove any recursive algorithm correct using structural induction, and why "the recursive leap of faith" is induction in disguise.

### Correctness: Structural Induction

For recursive algorithms the proof mirrors the recursion itself:

1. **Base case**: Prove the algorithm is correct for the smallest valid input (n = 0 or n = 1).
2. **Inductive hypothesis**: Assume the recursive call on a **strictly smaller** input returns the correct answer.
3. **Inductive step**: Show the current call is correct, given a correct result from the recursive call.

**Worked example — `factorial(n)` returns n!:**
- Base (n=0): returns 1 = 0!. ✓
- Hypothesis: `factorial(n-1)` returns (n-1)!.
- Step: `factorial(n) = n × factorial(n-1) = n × (n-1)! = n!`. ✓

**Worked example — `fib(n)` returns the n-th Fibonacci number:**
- Base (n=0, n=1): returns 0, 1 by definition. ✓
- Hypothesis: `fib(n-1)` returns Fₙ₋₁ and `fib(n-2)` returns Fₙ₋₂.
- Step: `fib(n) = fib(n-1) + fib(n-2) = Fₙ₋₁ + Fₙ₋₂ = Fₙ`. ✓

### The Recursive Leap of Faith = The Inductive Hypothesis

When you say "trust that the recursive call is correct for smaller input," you are stating the inductive hypothesis. The two mental models are identical — structural induction is the formal name for the leap of faith.

### Historical Grounding

Recursive function theory was formalized by **Wilhelm Ackermann (1928)** — the Ackermann function is the canonical example of a total computable function that is not primitive recursive. **Stephen Kleene (1936)** defined the full hierarchy of recursive functions as part of the theoretical foundations of computability. **John McCarthy (1960)** made recursion the primary control structure in LISP — the first language where recursive definitions were first-class citizens, replacing `for` and `while` as the universal iteration mechanism. Modern constraint: the JVM default stack allows ~10,000 recursive frames; iterative rewrites with explicit stacks are needed for deeper recursion in production.

> Full structural induction proofs and worked examples: [A1 — Algorithm Correctness](../A1_Correctness_Proofs.md) (Section 3)

- 📎 **Reference Anchor**: [OpenJDK TreeMap (recursive operations)](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/TreeMap.java) · [JVM spec — method invocation](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-6.html#jvms-6.5.invokevirtual)
- **Invariant learned**: `TreeMap.getEntry(key)` uses a while loop (not recursion) for lookup — a reminder that recursive logic at the mathematical level becomes iterative in production to avoid stack overflow at scale. The recursive structure (BST left < root < right) is preserved by BST invariants, not by recursive calls at runtime.
- **Local rewrite**: The "structural induction on binary trees" pattern in this chapter's Proof Corner directly models how `TreeMap`'s invariant is maintained: at every insertion, the tree height invariant (Red-Black property) holds by inductive argument on the tree structure.
- **Constraint warning**: Default JVM thread stack is ~512KB (client) to ~1MB (server). A recursive method with one `long` local variable allows ~8,000–15,000 frames before `StackOverflowError`. Always provide an iterative path for inputs of unknown depth.

---

[Chapter overview](../03b_Recursion_Fundamentals.md) | [Complete Understanding →](02_complete_understanding.md)
