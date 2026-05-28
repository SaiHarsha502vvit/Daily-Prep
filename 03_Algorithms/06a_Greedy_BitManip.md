**Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [Next Chapter >](06c_Advanced_Algo_Deep.md)
🧠 **Mental Model**: See [Greedy vs DP Decision](../14_Mental_Models/11_Greedy_vs_DP_Decision.md) — when greedy works and when you need DP

---

# 🎯 Advanced Algorithms: Complete University Guide

## From Divide & Conquer to NP-Complete

---
**Navigation**: [Part A: Core Techniques] | [Part B: Advanced Patterns](06e_Algorithm_Patterns.md)

---

# 🔬 PART 0: DEEP INTERNALS - HOW ALGORITHMS ACTUALLY WORK AT CPU/MEMORY LEVEL

## Cpu Instruction Execution - Deep Dive

Simple comparison: if (a > b)

**Java Bytecode**:
iload_1        // Load a from local variable slot 1 onto stack
iload_2        // Load b from local variable slot 2 onto stack
if_icmple L1   // If a <= b, jump to L1 (skip true branch)
JIT-COMPILED x86-64 ASSEMBLY:
mov     eax, [rsp+8]     ; Load a into register eax
cmp     eax, [rsp+12]    ; Compare eax with b
jle     .L1              ; Jump if less or equal

**Cpu Cycles**:
| Instruction      | Cycles | Notes |
| mov (L1 cache)   | 1-4    | If in cache |
| mov (RAM)        | ~200   | Cache miss penalty! |
| cmp              | 1      | Just sets flags |
| jle (predicted)  | 1      | If branch predicted correctly |
| jle (mispredicted)| 15-20 | Pipeline flush penalty! |

**Why This Matters For Algorithms**:
Binary Search (random access):
- Each comparison accesses random memory location
- High cache miss rate
- Unpredictable branches (50% each way)
- Real performance: ~60-80 cycles per comparison
Linear Search (sequential access):
- Sequential memory access → cache prefetching works
- Predictable branches (usually false until found)
- Real performance: ~4-5 cycles per comparison

**Surprising Result**:
For n < 64, linear search can be FASTER than binary search!
Because cache effects dominate for small n.

## Operation Costs - What They Don'T Teach You

INSTRUCTION LATENCIES (cycles on modern x86-64):
| Operation                    | Latency  | Throughput |
| Integer add/sub              | 1 cycle  | 4/cycle (superscalar) |
| Integer multiply             | 3 cycles | 1/cycle |
| Integer divide               | 20-80 c  | 1/20 cycles |
| Floating point add           | 3-4 c    | 2/cycle |
| Floating point multiply      | 5 c      | 2/cycle |
| Floating point divide        | 14-45 c  | 1/14 cycles |
| L1 cache load                | 4-5 c    | 2/cycle |
| L2 cache load                | 12-14 c  | 1/2 cycles |
| L3 cache load                | 40-50 c  | depends |
| RAM load                     | 200+ c   | limited by bandwidth |
| Branch (predicted)           | 1 c      | 1/cycle |
| Branch (mispredicted)        | 15-20 c  | pipeline flush |
| Function call                | ~5 c     | + stack operations |
| Virtual call (Java)          | ~15-25 c | vtable lookup |
| System call                  | 1000+ c  | context switch |

**Implications For Algorithm Design**:
1. Division is EXPENSIVE
- Avoid: n / 2
- Prefer: n >> 1 (right shift, 1 cycle)
- Compiler often optimizes, but not always
1. Memory access is the REAL bottleneck
- 1 cache miss = 200 cycles = 200 integer operations!
- Design algorithms for cache locality
1. Branch prediction matters
- Predictable patterns: for (i=0; i<n; i++) → ~99% predicted
- Unpredictable: if (random < 50%) → ~50% misprediction
- Binary search: ~log(n) mispredictions guaranteed
1. Function calls have overhead
- Recursive algorithms pay per recursion level
- Java virtual calls even more expensive
- JIT inlining helps but has limits

## What Actually Happens During Recursion

Java code:
int factorial(int n) {
if (n <= 1) return 1;
return n * factorial(n - 1);
}
STACK FRAME for each call:
OFFSET    │ CONTENT
+0        │ Return address (8 bytes on 64-bit)
+8        │ Previous frame pointer (8 bytes)
+16       │ Parameter n (4 bytes, padded to 8)
+24       │ Local variable space (if any)
+32       │ Saved callee-saved registers (varies)

**Minimum Frame Size**: ~32-48 bytes per call
CALL SEQUENCE for factorial(5):
═══════════════════════════════

**Stack Memory**:
High addresses
┌─────────────────────────────────┐
| | main() frame                    | |
├─────────────────────────────────┤
| | factorial(5) frame              | | ← 48 bytes |
| |   return addr = main+42         | |
| |   n = 5                         | |
├─────────────────────────────────┤
| | factorial(4) frame              | | ← 48 bytes |
| |   return addr = factorial+15    | |
| |   n = 4                         | |
├─────────────────────────────────┤
| | factorial(3) frame              | | ← 48 bytes |
├─────────────────────────────────┤
| | factorial(2) frame              | |
├─────────────────────────────────┤
| | factorial(1) frame              | | ← Stack pointer |
└─────────────────────────────────┘
Low addresses
Total stack for factorial(5): 5 × 48 = 240 bytes
Total stack for factorial(10000): 10000 × 48 ≈ 480 KB
Default Java stack: ~1 MB → STACK OVERFLOW at ~20,000 depth!

**Cpu Operations Per Recursive Call**:
Operation                           │ Cycles
Push return address                 │ 1-4
Push frame pointer                  │ 1-4
Allocate stack space                │ 1
Push parameter                      │ 1-4
Jump to function                    │ 1-3
Base case check                     │ 1-2
Recursive call (all above again)    │ ~15
Multiply result                     │ 3
Pop stack frame                     │ 1-3
Return                              │ 1-3
TOTAL per recursion level           │ ~30-40 cycles
For factorial(1000): ~35,000 cycles in overhead alone!

🔬 **Section Challenge — What Actually Happens During Recursion**

**Challenge 1 (Reasoning):** Every recursive algorithm can be converted to iterative. What data structure replaces the call stack?
<details><summary>Answer</summary>

An explicit `Stack<State>` where State holds what the stack frame would hold (current node, remaining work, partial results). DFS → explicit stack. Factorial → accumulator variable (tail recursion → loop). Tree traversal → stack with nodes + 'visited' flag. When to use recursion vs iteration: recursion = cleaner code when tree/graph depth is bounded. Iteration = necessary when depth is unbounded (stack overflow risk) or when performance is critical.
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


## Tail Call Optimization - What It Means


**Regular Recursion**: TAIL RECURSION:
int fact(int n) {                      int fact(int n, int acc) {
if (n <= 1) return 1;                  if (n <= 1) return acc;
return n * fact(n-1);  ←MUST           return fact(n-1, n*acc); ←LAST
}                      MULTIPLY            }                          THING
AFTER RETURN

**Stack Usage Comparison**:
Regular (n=5):           Tail-optimized (n=5):
| fact(5)        |       | fact(5, 1)     | → becomes: |
| | fact(4, 5)     | (reuses same frame) |
| fact(4)        |       | fact(3, 20) |
│ fact(2, 60)
| fact(3)        |       | fact(1, 120) |
fact(2)        │       Only 1 stack frame!
fact(1)
5 stack frames
JAVA DOES NOT IMPLEMENT TAIL CALL OPTIMIZATION!
Why? JVM stack frames are complex (security, profiling, exceptions)

**Solutions In Java**:
1. Convert to iterative (always works)
2. Use trampolining (functional pattern)
3. Increase stack size: java -Xss4m
// Iterative conversion:
int factIterative(int n) {
int result = 1;
for (int i = 2; i <= n; i++) {
result *= i;
}
return result;
}
// Trampolining:
interface Trampoline<T> {
T get();
default boolean complete() { return true; }
default Trampoline<T> bounce() { return this; }
}
Languages WITH tail call optimization:
- Scheme, Haskell, Scala (partial), Kotlin (tailrec keyword)
## Asymptotic Analysis - Rigorous Definitions

FORMAL DEFINITION OF BIG-O:
f(n) = O(g(n)) if and only if:
∃ c > 0, n₀ > 0 such that ∀ n ≥ n₀:
f(n) ≤ c · g(n)
In words: f(n) is bounded above by g(n) multiplied by some constant,
for all sufficiently large n.

**Example Proof**: 3n² + 5n + 7 = O(n²)
Need to find c and n₀ such that:
3n² + 5n + 7 ≤ c · n²
For n ≥ 1:
3n² + 5n + 7 ≤ 3n² + 5n² + 7n²  (since n² ≥ n ≥ 1)
= 15n²
So c = 15, n₀ = 1 works.
Therefore: 3n² + 5n + 7 = O(n²) ✓
FORMAL DEFINITION OF BIG-Ω:
f(n) = Ω(g(n)) if and only if:
∃ c > 0, n₀ > 0 such that ∀ n ≥ n₀:
f(n) ≥ c · g(n)
FORMAL DEFINITION OF BIG-Θ:
f(n) = Θ(g(n)) if and only if:
f(n) = O(g(n)) AND f(n) = Ω(g(n))
Equivalently:
∃ c₁, c₂, n₀ > 0 such that ∀ n ≥ n₀:
c₁ · g(n) ≤ f(n) ≤ c₂ · g(n)
LITTLE-o AND LITTLE-ω:
f(n) = o(g(n)) means: lim(n→∞) f(n)/g(n) = 0
"f(n) grows strictly slower than g(n)"
f(n) = ω(g(n)) means: lim(n→∞) f(n)/g(n) = ∞
"f(n) grows strictly faster than g(n)"

**Master Theorem For Recurrences**:
For recurrence: T(n) = aT(n/b) + f(n)
Let c_crit = log_b(a)
Case 1: If f(n) = O(n^(c_crit - ε)) for some ε > 0
Then T(n) = Θ(n^c_crit)
Case 2: If f(n) = Θ(n^c_crit · log^k(n))
Then T(n) = Θ(n^c_crit · log^(k+1)(n))
Case 3: If f(n) = Ω(n^(c_crit + ε)) and regularity condition holds
Then T(n) = Θ(f(n))

**Master Theorem Examples**:
| Recurrence              | a  | b  | c_crit | f(n)     | Result |
| T(n) = 2T(n/2) + n      | 2  | 2  | 1      | n=Θ(n¹)  | Θ(n log n) |
| T(n) = 2T(n/2) + n²     | 2  | 2  | 1      | n²=Ω(n¹⁺)| Θ(n²) |
| T(n) = 2T(n/2) + 1      | 2  | 2  | 1      | 1=O(n⁰)  | Θ(n) |
| T(n) = 4T(n/2) + n      | 4  | 2  | 2      | n=O(n¹)  | Θ(n²) |
| T(n) = T(n/2) + 1       | 1  | 2  | 0      | 1=Θ(n⁰)  | Θ(log n) |
| T(n) = 3T(n/2) + n      | 3  | 2  | 1.58   | n=O(n¹)  | Θ(n^1.58) |



## Amortized Analysis - Deep Understanding

WHAT IS AMORTIZED ANALYSIS?
Average cost per operation over a sequence of operations.
NOT the same as average-case analysis!
Key difference:
- Average-case: Random input distribution
- Amortized: Worst-case over sequence, any input
DYNAMIC ARRAY (ArrayList) EXAMPLE:
ArrayList starts with capacity 10. When full, doubles capacity.
Cost of n insertions:
| Insert # | Capacity | Is Resize? | Cost (copies + 1 insert) |
| 1-10     | 10       | No         | 1 each = 10 total |
| 11       | 10→20    | Yes        | 10 copies + 1 = 11 |
| 12-20    | 20       | No         | 1 each = 9 |
| 21       | 20→40    | Yes        | 20 copies + 1 = 21 |
| 22-40    | 40       | No         | 1 each = 19 |
| 41       | 40→80    | Yes        | 40 copies + 1 = 41 |
| ...      | ...      | ...        | ... |
Total cost for n inserts:
= n (for n inserts)
+ 10 + 20 + 40 + 80 + ... (for resizes)
= n + (10 + 20 + 40 + ... + n/2)
= n + n (geometric series ≈ n)
= 2n
Amortized cost per insert: 2n / n = O(1) amortized!

**Three Methods For Amortized Analysis**:
1. AGGREGATE METHOD:
Total cost for n operations / n
2. ACCOUNTING METHOD:
Charge each operation a fixed amount (amortized cost)
Save surplus as "credit" for expensive operations
For ArrayList: charge 3 per insert
- 1 for the insert itself
- 2 saved for future resize (pay for moving this element twice)
3. POTENTIAL METHOD:
Define potential function Φ(state)
Amortized cost = actual cost + ΔΦ
For ArrayList: Φ = 2(size - capacity/2)
- After resize: Φ = 2(n/2 - n/2) = 0
- Just before resize: Φ = 2(n - n/2) = n
- Resize cost n, but Φ drops by n, so amortized = 0

---

⚠️ **MOVED**: Unit 1 (Algorithm Analysis + Divide & Conquer + Binary Search + Master Theorem)
has been extracted to its own dedicated file for discoverability:
**→ [02c_Divide_And_Conquer.md](02c_Divide_And_Conquer.md)**

---




# 🎯 Unit 2: the Greedy Method

## The General Method

```
GREEDY APPROACH:
Make the locally optimal choice at each step,
hoping to find a global optimum.

┌─────────────────────────────────────────┐
│           GREEDY STRATEGY               │
├─────────────────────────────────────────┤
│                                         │
│  1. FEASIBILITY: Check if choice valid  │
│  2. LOCAL OPTIMUM: Pick best option NOW │
│  3. IRREVOCABLE: Never reconsider       │
│                                         │
└─────────────────────────────────────────┘

WHEN GREEDY WORKS:
✓ Greedy Choice Property: Local optimal → Global optimal
✓ Optimal Substructure: Optimal solution contains optimal subsolutions

WHEN GREEDY FAILS:
✗ Subproblems overlap in ways that restrict future choices (e.g., 0/1 Knapsack)
✗ Non-monotonic conditions (e.g., Coin change with arbitrary denominations)
```

## 🔬 Deep Dive: The Matroid Connection (Why Greedy Actually Works)

While the "Exchange Argument" proves greedy works for a *specific* problem, **Matroid Theory** explains the underlying mathematical structure that makes greedy work for an entire *class* of problems. If a problem's solution space forms a weighted Matroid, the standard Greedy algorithm is **guaranteed** to find the optimal solution.

### What is a Matroid?
A Matroid is a structure $M = (S, I)$ where $S$ is a finite set of elements, and $I$ is a family of "independent" subsets of $S$, satisfying two critical axioms:
1. **Hereditary Property:** If subset $B \in I$ and $A \subset B$, then $A \in I$. *(Every subset of a valid set is also valid).*
2. **Exchange Property:** If $A, B \in I$ and $|A| < |B|$, there exists some element $x \in B \setminus A$ such that $A \cup \{x\} \in I$. *(You can always grow a smaller valid set by borrowing an element from a larger valid set).*

### How it connects to the Greedy Algorithm:
If your problem can be mapped to finding the maximum-weight independent set of a Matroid, the canonical Greedy Algorithm works flawlessly:
1. Sort all elements in $S$ by weight descending.
2. Initialize an empty set $A$.
3. For each element $x$ in sorted order: if $A \cup \{x\}$ is independent (maintains constraints), add $x$ to $A$.

### Classic Matroid Successes:
- **Kruskal's MST:** The set $S$ is graph edges. Independent sets $I$ are acyclic edge sets (forests). Because graphs satisfy the exchange property (graphic matroids), sorting edges by weight and adding them if they don't form a cycle *mathematically guarantees* the MST.
- **Task Scheduling with Deadlines & Penalties:** Tasks are $S$. A set of tasks is independent if there exists a valid schedule where *all* of them meet their deadlines. This forms a transversal matroid. Sorting by penalty and greedily scheduling guarantees the minimum penalty.

### Why Greedy Fails (Not a Matroid):
- **0/1 Knapsack:** Let capacity be 10kg. Suppose $A=\{6kg\}$ and $B=\{5kg, 5kg\}$. Both sets are valid (weight $\le 10$). Notice $|A| = 1$ and $|B| = 2$, so $|A| < |B|$. According to the Matroid Exchange Property, we should be able to take a 5kg item from $B$ and add it to $A$ to get a valid set. But $\{6kg\} \cup \{5kg\} = 11kg$, which exceeds capacity and is INVALID. The exchange property fails! Therefore, the knapsack problem does not form a matroid, and the greedy algorithm is doomed to fail, requiring Dynamic Programming instead.
