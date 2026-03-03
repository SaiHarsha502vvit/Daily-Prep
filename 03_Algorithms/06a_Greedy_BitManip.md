> **Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [Next Chapter >](06c_Advanced_Algo_Deep.md)

---

# 🎯 Advanced Algorithms: Complete University Guide

## From Divide & Conquer to NP-Complete

---
> **Navigation**: [Part A: Core Techniques] | [Part B: Advanced Patterns](06b_Advanced_Algorithms_Patterns.md)

---


# 🔬 PART 0: DEEP INTERNALS - HOW ALGORITHMS ACTUALLY WORK AT CPU/MEMORY LEVEL

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║       ALGORITHM EXECUTION AT THE HARDWARE LEVEL - THE COMPLETE PICTURE          ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║  Before understanding algorithms, you must understand:                           ║
║  • How the CPU executes instructions                                             ║
║  • How memory access patterns affect performance                                 ║
║  • Why the same Big-O can have 100x different performance                        ║
║  • What happens during recursion at the machine level                            ║
║  • Cache effects and branch prediction                                           ║
║                                                                                   ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

## HOW THE CPU ACTUALLY EXECUTES ALGORITHMS

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    CPU INSTRUCTION EXECUTION - DEEP DIVE                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Simple comparison: if (a > b)                                                  │
│                                                                                  │
│  JAVA BYTECODE:                                                                  │
│  iload_1        // Load a from local variable slot 1 onto stack               │
│  iload_2        // Load b from local variable slot 2 onto stack               │
│  if_icmple L1   // If a <= b, jump to L1 (skip true branch)                   │
│                                                                                  │
│  JIT-COMPILED x86-64 ASSEMBLY:                                                  │
│  mov     eax, [rsp+8]     ; Load a into register eax                          │
│  cmp     eax, [rsp+12]    ; Compare eax with b                                │
│  jle     .L1              ; Jump if less or equal                             │
│                                                                                  │
│  CPU CYCLES:                                                                     │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │ Instruction      │ Cycles │ Notes                                        │ │
│  ├───────────────────────────────────────────────────────────────────────────┤ │
│  │ mov (L1 cache)   │ 1-4    │ If in cache                                  │ │
│  │ mov (RAM)        │ ~200   │ Cache miss penalty!                          │ │
│  │ cmp              │ 1      │ Just sets flags                              │ │
│  │ jle (predicted)  │ 1      │ If branch predicted correctly                │ │
│  │ jle (mispredicted)│ 15-20 │ Pipeline flush penalty!                      │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│                                                                                  │
│  WHY THIS MATTERS FOR ALGORITHMS:                                               │
│  ────────────────────────────────                                               │
│                                                                                  │
│  Binary Search (random access):                                                 │
│  • Each comparison accesses random memory location                              │
│  • High cache miss rate                                                          │
│  • Unpredictable branches (50% each way)                                        │
│  • Real performance: ~60-80 cycles per comparison                               │
│                                                                                  │
│  Linear Search (sequential access):                                             │
│  • Sequential memory access → cache prefetching works                          │
│  • Predictable branches (usually false until found)                            │
│  • Real performance: ~4-5 cycles per comparison                                 │
│                                                                                  │
│  SURPRISING RESULT:                                                              │
│  For n < 64, linear search can be FASTER than binary search!                   │
│  Because cache effects dominate for small n.                                    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## THE REAL COST OF OPERATIONS

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    OPERATION COSTS - WHAT THEY DON'T TEACH YOU                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  INSTRUCTION LATENCIES (cycles on modern x86-64):                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Operation                    │ Latency  │ Throughput                    │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │ Integer add/sub              │ 1 cycle  │ 4/cycle (superscalar)        │   │
│  │ Integer multiply             │ 3 cycles │ 1/cycle                       │   │
│  │ Integer divide               │ 20-80 c  │ 1/20 cycles                   │   │
│  │ Floating point add           │ 3-4 c    │ 2/cycle                       │   │
│  │ Floating point multiply      │ 5 c      │ 2/cycle                       │   │
│  │ Floating point divide        │ 14-45 c  │ 1/14 cycles                   │   │
│  │ L1 cache load                │ 4-5 c    │ 2/cycle                       │   │
│  │ L2 cache load                │ 12-14 c  │ 1/2 cycles                    │   │
│  │ L3 cache load                │ 40-50 c  │ depends                       │   │
│  │ RAM load                     │ 200+ c   │ limited by bandwidth          │   │
│  │ Branch (predicted)           │ 1 c      │ 1/cycle                       │   │
│  │ Branch (mispredicted)        │ 15-20 c  │ pipeline flush                │   │
│  │ Function call                │ ~5 c     │ + stack operations            │   │
│  │ Virtual call (Java)          │ ~15-25 c │ vtable lookup                 │   │
│  │ System call                  │ 1000+ c  │ context switch                │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│                                                                                  │
│  IMPLICATIONS FOR ALGORITHM DESIGN:                                             │
│  ──────────────────────────────────                                             │
│                                                                                  │
│  1. Division is EXPENSIVE                                                        │
│     • Avoid: n / 2                                                              │
│     • Prefer: n >> 1 (right shift, 1 cycle)                                    │
│     • Compiler often optimizes, but not always                                  │
│                                                                                  │
│  2. Memory access is the REAL bottleneck                                        │
│     • 1 cache miss = 200 cycles = 200 integer operations!                      │
│     • Design algorithms for cache locality                                      │
│                                                                                  │
│  3. Branch prediction matters                                                   │
│     • Predictable patterns: for (i=0; i<n; i++) → ~99% predicted              │
│     • Unpredictable: if (random < 50%) → ~50% misprediction                   │
│     • Binary search: ~log(n) mispredictions guaranteed                         │
│                                                                                  │
│  4. Function calls have overhead                                                │
│     • Recursive algorithms pay per recursion level                             │
│     • Java virtual calls even more expensive                                   │
│     • JIT inlining helps but has limits                                        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## RECURSION AT THE MACHINE LEVEL

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    WHAT ACTUALLY HAPPENS DURING RECURSION                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Java code:                                                                      │
│  int factorial(int n) {                                                          │
│      if (n <= 1) return 1;                                                       │
│      return n * factorial(n - 1);                                                │
│  }                                                                               │
│                                                                                  │
│  STACK FRAME for each call:                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │ OFFSET    │ CONTENT                                                        ││
│  ├────────────────────────────────────────────────────────────────────────────┤│
│  │ +0        │ Return address (8 bytes on 64-bit)                             ││
│  │ +8        │ Previous frame pointer (8 bytes)                               ││
│  │ +16       │ Parameter n (4 bytes, padded to 8)                             ││
│  │ +24       │ Local variable space (if any)                                  ││
│  │ +32       │ Saved callee-saved registers (varies)                          ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  MINIMUM FRAME SIZE: ~32-48 bytes per call                                     │
│                                                                                  │
│                                                                                  │
│  CALL SEQUENCE for factorial(5):                                                │
│  ═══════════════════════════════                                                │
│                                                                                  │
│  STACK MEMORY:                                                                   │
│  ┌─────────────────────────────────────┐                                       │
│  │ High addresses                      │                                       │
│  │ ┌─────────────────────────────────┐ │                                       │
│  │ │ main() frame                    │ │                                       │
│  │ ├─────────────────────────────────┤ │                                       │
│  │ │ factorial(5) frame              │ │ ← 48 bytes                           │
│  │ │   return addr = main+42         │ │                                       │
│  │ │   n = 5                         │ │                                       │
│  │ ├─────────────────────────────────┤ │                                       │
│  │ │ factorial(4) frame              │ │ ← 48 bytes                           │
│  │ │   return addr = factorial+15    │ │                                       │
│  │ │   n = 4                         │ │                                       │
│  │ ├─────────────────────────────────┤ │                                       │
│  │ │ factorial(3) frame              │ │ ← 48 bytes                           │
│  │ ├─────────────────────────────────┤ │                                       │
│  │ │ factorial(2) frame              │ │                                       │
│  │ ├─────────────────────────────────┤ │                                       │
│  │ │ factorial(1) frame              │ │ ← Stack pointer                      │
│  │ └─────────────────────────────────┘ │                                       │
│  │ Low addresses                       │                                       │
│  └─────────────────────────────────────┘                                       │
│                                                                                  │
│  Total stack for factorial(5): 5 × 48 = 240 bytes                              │
│  Total stack for factorial(10000): 10000 × 48 ≈ 480 KB                        │
│  Default Java stack: ~1 MB → STACK OVERFLOW at ~20,000 depth!                  │
│                                                                                  │
│                                                                                  │
│  CPU OPERATIONS PER RECURSIVE CALL:                                             │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │ Operation                           │ Cycles                               ││
│  ├────────────────────────────────────────────────────────────────────────────┤│
│  │ Push return address                 │ 1-4                                  ││
│  │ Push frame pointer                  │ 1-4                                  ││
│  │ Allocate stack space                │ 1                                    ││
│  │ Push parameter                      │ 1-4                                  ││
│  │ Jump to function                    │ 1-3                                  ││
│  │ Base case check                     │ 1-2                                  ││
│  │ Recursive call (all above again)    │ ~15                                  ││
│  │ Multiply result                     │ 3                                    ││
│  │ Pop stack frame                     │ 1-3                                  ││
│  │ Return                              │ 1-3                                  ││
│  ├────────────────────────────────────────────────────────────────────────────┤│
│  │ TOTAL per recursion level           │ ~30-40 cycles                        ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  For factorial(1000): ~35,000 cycles in overhead alone!                        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## TAIL RECURSION AND OPTIMIZATION

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    TAIL CALL OPTIMIZATION - WHAT IT MEANS                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  REGULAR RECURSION:                     TAIL RECURSION:                         │
│  int fact(int n) {                      int fact(int n, int acc) {              │
│      if (n <= 1) return 1;                  if (n <= 1) return acc;             │
│      return n * fact(n-1);  ←MUST           return fact(n-1, n*acc); ←LAST      │
│  }                      MULTIPLY            }                          THING     │
│                        AFTER RETURN                                              │
│                                                                                  │
│                                                                                  │
│  STACK USAGE COMPARISON:                                                        │
│                                                                                  │
│  Regular (n=5):           Tail-optimized (n=5):                                 │
│  ┌────────────────┐       ┌────────────────┐                                   │
│  │ fact(5)        │       │ fact(5, 1)     │ → becomes:                        │
│  ├────────────────┤       │ fact(4, 5)     │ (reuses same frame)              │
│  │ fact(4)        │       │ fact(3, 20)    │                                   │
│  ├────────────────┤       │ fact(2, 60)    │                                   │
│  │ fact(3)        │       │ fact(1, 120)   │                                   │
│  ├────────────────┤       └────────────────┘                                   │
│  │ fact(2)        │       Only 1 stack frame!                                  │
│  ├────────────────┤                                                             │
│  │ fact(1)        │                                                             │
│  └────────────────┘                                                             │
│  5 stack frames                                                                  │
│                                                                                  │
│                                                                                  │
│  JAVA DOES NOT IMPLEMENT TAIL CALL OPTIMIZATION!                                │
│  ─────────────────────────────────────────────────                              │
│  Why? JVM stack frames are complex (security, profiling, exceptions)            │
│                                                                                  │
│  SOLUTIONS IN JAVA:                                                              │
│  1. Convert to iterative (always works)                                         │
│  2. Use trampolining (functional pattern)                                       │
│  3. Increase stack size: java -Xss4m                                           │
│                                                                                  │
│  // Iterative conversion:                                                        │
│  int factIterative(int n) {                                                      │
│      int result = 1;                                                             │
│      for (int i = 2; i <= n; i++) {                                             │
│          result *= i;                                                            │
│      }                                                                           │
│      return result;                                                              │
│  }                                                                               │
│                                                                                  │
│  // Trampolining:                                                                │
│  interface Trampoline<T> {                                                       │
│      T get();                                                                    │
│      default boolean complete() { return true; }                                │
│      default Trampoline<T> bounce() { return this; }                           │
│  }                                                                               │
│                                                                                  │
│  Languages WITH tail call optimization:                                         │
│  • Scheme, Haskell, Scala (partial), Kotlin (tailrec keyword)                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## BIG-O NOTATION - THE COMPLETE MATHEMATICAL FOUNDATION

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ASYMPTOTIC ANALYSIS - RIGOROUS DEFINITIONS                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  FORMAL DEFINITION OF BIG-O:                                                    │
│  ─────────────────────────────                                                  │
│  f(n) = O(g(n)) if and only if:                                                │
│                                                                                  │
│  ∃ c > 0, n₀ > 0 such that ∀ n ≥ n₀:                                          │
│      f(n) ≤ c · g(n)                                                           │
│                                                                                  │
│  In words: f(n) is bounded above by g(n) multiplied by some constant,          │
│           for all sufficiently large n.                                         │
│                                                                                  │
│                                                                                  │
│  EXAMPLE PROOF: 3n² + 5n + 7 = O(n²)                                           │
│  ──────────────────────────────────────                                         │
│  Need to find c and n₀ such that:                                              │
│      3n² + 5n + 7 ≤ c · n²                                                     │
│                                                                                  │
│  For n ≥ 1:                                                                     │
│      3n² + 5n + 7 ≤ 3n² + 5n² + 7n²  (since n² ≥ n ≥ 1)                       │
│                   = 15n²                                                        │
│                                                                                  │
│  So c = 15, n₀ = 1 works.                                                      │
│  Therefore: 3n² + 5n + 7 = O(n²) ✓                                             │
│                                                                                  │
│                                                                                  │
│  FORMAL DEFINITION OF BIG-Ω:                                                    │
│  ─────────────────────────────                                                  │
│  f(n) = Ω(g(n)) if and only if:                                                │
│                                                                                  │
│  ∃ c > 0, n₀ > 0 such that ∀ n ≥ n₀:                                          │
│      f(n) ≥ c · g(n)                                                           │
│                                                                                  │
│                                                                                  │
│  FORMAL DEFINITION OF BIG-Θ:                                                    │
│  ─────────────────────────────                                                  │
│  f(n) = Θ(g(n)) if and only if:                                                │
│                                                                                  │
│  f(n) = O(g(n)) AND f(n) = Ω(g(n))                                             │
│                                                                                  │
│  Equivalently:                                                                   │
│  ∃ c₁, c₂, n₀ > 0 such that ∀ n ≥ n₀:                                         │
│      c₁ · g(n) ≤ f(n) ≤ c₂ · g(n)                                             │
│                                                                                  │
│                                                                                  │
│  LITTLE-o AND LITTLE-ω:                                                         │
│  ──────────────────────                                                         │
│  f(n) = o(g(n)) means: lim(n→∞) f(n)/g(n) = 0                                  │
│      "f(n) grows strictly slower than g(n)"                                    │
│                                                                                  │
│  f(n) = ω(g(n)) means: lim(n→∞) f(n)/g(n) = ∞                                  │
│      "f(n) grows strictly faster than g(n)"                                    │
│                                                                                  │
│                                                                                  │
│  MASTER THEOREM FOR RECURRENCES:                                                │
│  ────────────────────────────────                                               │
│  For recurrence: T(n) = aT(n/b) + f(n)                                         │
│                                                                                  │
│  Let c_crit = log_b(a)                                                          │
│                                                                                  │
│  Case 1: If f(n) = O(n^(c_crit - ε)) for some ε > 0                           │
│          Then T(n) = Θ(n^c_crit)                                               │
│                                                                                  │
│  Case 2: If f(n) = Θ(n^c_crit · log^k(n))                                      │
│          Then T(n) = Θ(n^c_crit · log^(k+1)(n))                                │
│                                                                                  │
│  Case 3: If f(n) = Ω(n^(c_crit + ε)) and regularity condition holds           │
│          Then T(n) = Θ(f(n))                                                   │
│                                                                                  │
│                                                                                  │
│  MASTER THEOREM EXAMPLES:                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │ Recurrence              │ a  │ b  │ c_crit │ f(n)     │ Result         │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │ T(n) = 2T(n/2) + n      │ 2  │ 2  │ 1      │ n=Θ(n¹)  │ Θ(n log n)    │   │
│  │ T(n) = 2T(n/2) + n²     │ 2  │ 2  │ 1      │ n²=Ω(n¹⁺)│ Θ(n²)         │   │
│  │ T(n) = 2T(n/2) + 1      │ 2  │ 2  │ 1      │ 1=O(n⁰)  │ Θ(n)          │   │
│  │ T(n) = 4T(n/2) + n      │ 4  │ 2  │ 2      │ n=O(n¹)  │ Θ(n²)         │   │
│  │ T(n) = T(n/2) + 1       │ 1  │ 2  │ 0      │ 1=Θ(n⁰)  │ Θ(log n)      │   │
│  │ T(n) = 3T(n/2) + n      │ 3  │ 2  │ 1.58   │ n=O(n¹)  │ Θ(n^1.58)     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## AMORTIZED ANALYSIS - THE COMPLETE PICTURE

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    AMORTIZED ANALYSIS - DEEP UNDERSTANDING                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  WHAT IS AMORTIZED ANALYSIS?                                                    │
│  ────────────────────────────                                                   │
│  Average cost per operation over a sequence of operations.                      │
│  NOT the same as average-case analysis!                                         │
│                                                                                  │
│  Key difference:                                                                 │
│  • Average-case: Random input distribution                                      │
│  • Amortized: Worst-case over sequence, any input                              │
│                                                                                  │
│                                                                                  │
│  DYNAMIC ARRAY (ArrayList) EXAMPLE:                                             │
│  ─────────────────────────────────────                                          │
│                                                                                  │
│  ArrayList starts with capacity 10. When full, doubles capacity.                │
│                                                                                  │
│  Cost of n insertions:                                                           │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │ Insert # │ Capacity │ Is Resize? │ Cost (copies + 1 insert)               ││
│  ├────────────────────────────────────────────────────────────────────────────┤│
│  │ 1-10     │ 10       │ No         │ 1 each = 10 total                      ││
│  │ 11       │ 10→20    │ Yes        │ 10 copies + 1 = 11                     ││
│  │ 12-20    │ 20       │ No         │ 1 each = 9                             ││
│  │ 21       │ 20→40    │ Yes        │ 20 copies + 1 = 21                     ││
│  │ 22-40    │ 40       │ No         │ 1 each = 19                            ││
│  │ 41       │ 40→80    │ Yes        │ 40 copies + 1 = 41                     ││
│  │ ...      │ ...      │ ...        │ ...                                    ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  Total cost for n inserts:                                                       │
│  = n (for n inserts)                                                            │
│  + 10 + 20 + 40 + 80 + ... (for resizes)                                       │
│  = n + (10 + 20 + 40 + ... + n/2)                                              │
│  = n + n (geometric series ≈ n)                                                │
│  = 2n                                                                           │
│                                                                                  │
│  Amortized cost per insert: 2n / n = O(1) amortized!                           │
│                                                                                  │
│                                                                                  │
│  THREE METHODS FOR AMORTIZED ANALYSIS:                                          │
│  ──────────────────────────────────────                                         │
│                                                                                  │
│  1. AGGREGATE METHOD:                                                            │
│     Total cost for n operations / n                                             │
│                                                                                  │
│  2. ACCOUNTING METHOD:                                                           │
│     Charge each operation a fixed amount (amortized cost)                       │
│     Save surplus as "credit" for expensive operations                           │
│                                                                                  │
│     For ArrayList: charge 3 per insert                                          │
│     • 1 for the insert itself                                                   │
│     • 2 saved for future resize (pay for moving this element twice)            │
│                                                                                  │
│  3. POTENTIAL METHOD:                                                            │
│     Define potential function Φ(state)                                          │
│     Amortized cost = actual cost + ΔΦ                                          │
│                                                                                  │
│     For ArrayList: Φ = 2(size - capacity/2)                                    │
│     • After resize: Φ = 2(n/2 - n/2) = 0                                       │
│     • Just before resize: Φ = 2(n - n/2) = n                                   │
│     • Resize cost n, but Φ drops by n, so amortized = 0                        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# UNIT 1: INTRODUCTION & DIVIDE AND CONQUER

## Algorithm Analysis Fundamentals

### What is an Algorithm?

```
ALGORITHM = Finite sequence of well-defined instructions
            to solve a problem or perform a computation

PROPERTIES:
1. INPUT:      Zero or more inputs
2. OUTPUT:     At least one output
3. DEFINITENESS: Each step clearly defined
4. FINITENESS:   Terminates after finite steps
5. EFFECTIVENESS: Each step is basic enough to be done
```

### Asymptotic Notations

```
┌─────────────────────────────────────────────────────────────────┐
│                    ASYMPTOTIC NOTATIONS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Big-O (O):     UPPER BOUND (Worst Case)                       │
│                 f(n) = O(g(n)) means f(n) ≤ c·g(n)             │
│                 "At most this much"                             │
│                                                                 │
│  Big-Omega (Ω): LOWER BOUND (Best Case)                        │
│                 f(n) = Ω(g(n)) means f(n) ≥ c·g(n)             │
│                 "At least this much"                            │
│                                                                 │
│  Big-Theta (Θ): TIGHT BOUND (Average Case)                     │
│                 f(n) = Θ(g(n)) means c₁·g(n) ≤ f(n) ≤ c₂·g(n) │
│                 "Exactly this much"                             │
│                                                                 │
│  Little-o (o): Strictly less than (not tight)                  │
│  Little-ω (ω): Strictly greater than (not tight)               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

COMMON COMPLEXITIES (Slowest to Fastest):
O(n!) > O(2ⁿ) > O(n³) > O(n²) > O(n log n) > O(n) > O(√n) > O(log n) > O(1)

VISUAL GROWTH:
n=10:
O(1)      = 1
O(log n)  = 3.3
O(n)      = 10
O(n log n)= 33
O(n²)     = 100
O(2ⁿ)     = 1024
O(n!)     = 3,628,800
```

### Performance Measurement

```java
// TIME COMPLEXITY: Count operations as function of input size

// Example: Finding sum of array
int sum = 0;           // 1 operation
for (int i = 0; i < n; i++) {  // n iterations
    sum += arr[i];     // 1 operation per iteration
}
// Total: 1 + n = O(n)

// Example: Nested loops
for (int i = 0; i < n; i++) {      // n times
    for (int j = 0; j < n; j++) {  // n times each
        // operation              // n × n = n²
    }
}
// Total: O(n²)

// SPACE COMPLEXITY: Memory used as function of input size
int[] arr = new int[n];    // O(n) space
int[][] matrix = new int[n][n];  // O(n²) space
```

---

## Divide and Conquer

### The General Method

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    DIVIDE AND CONQUER - COMPLETE UNDERSTANDING               ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS DIVIDE AND CONQUER?                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ A problem-solving paradigm that breaks a problem into SMALLER INDEPENDENT   │
│ subproblems of the SAME TYPE, solves them recursively, then COMBINES        │
│ their solutions.                                                            │
│                                                                             │
│ HISTORICAL CONTEXT:                                                         │
│ - Named after military strategy "divide et impera" (divide and rule)       │
│ - Formalized in computer science in 1960s                                   │
│ - Foundation for many efficient algorithms                                  │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DOES IT SOLVE?                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ CORE PROBLEM: Large problems that are too complex to solve directly         │
│                                                                             │
│ EXAMPLE - Sorting 1 million numbers:                                        │
│ BRUTE FORCE: Compare all pairs → O(n²) = 10¹² comparisons 😢               │
│ D&C (Merge Sort): Split, sort halves, merge → O(n log n) = 2×10⁷ 🎉       │
│                                                                             │
│ WHY DOES D&C WORK BETTER?                                                   │
│ • Reduces problem size EXPONENTIALLY (n → n/2 → n/4 → ...)                 │
│ • Each level does O(n) work, but only log(n) levels                         │
│ • Total: O(n) × O(log n) = O(n log n)                                      │
│                                                                             │
│ REAL-WORLD ANALOGY:                                                         │
│ Organizing a library of 1000 books alphabetically:                          │
│ • One person doing everything: VERY SLOW                                    │
│ • Split books in half, give each half to a helper, merge results: FASTER   │
│ • Keep splitting until each person has ~10 books: FASTEST                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ THE THREE STEPS (HOW IT WORKS)                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 1. DIVIDE:   Break problem into smaller subproblems of SAME TYPE            │
│              Key: Subproblems must be INDEPENDENT (no overlap)              │
│                                                                             │
│ 2. CONQUER:  Solve subproblems recursively                                  │
│              Base case: Problem small enough to solve directly              │
│                                                                             │
│ 3. COMBINE:  Merge solutions to get final answer                            │
│              This is often where the "magic" happens                        │
│                                                                             │
│ ┌─────────────────────────────────────────┐                                 │
│ │              ORIGINAL PROBLEM           │                                 │
│ └───────────────────┬─────────────────────┘                                 │
│                     │ DIVIDE                                                │
│         ┌───────────┴───────────┐                                           │
│         ▼                       ▼                                           │
│ ┌───────────────┐       ┌───────────────┐                                   │
│ │  SUBPROBLEM 1 │       │  SUBPROBLEM 2 │                                   │
│ └───────┬───────┘       └───────┬───────┘                                   │
│         │ CONQUER               │ CONQUER                                   │
│         ▼                       ▼                                           │
│ ┌───────────────┐       ┌───────────────┐                                   │
│ │   SOLUTION 1  │       │   SOLUTION 2  │                                   │
│ └───────┬───────┘       └───────┬───────┘                                   │
│         │                       │                                           │
│         └───────────┬───────────┘                                           │
│                     │ COMBINE                                               │
│                     ▼                                                       │
│         ┌───────────────────────┐                                           │
│         │    FINAL SOLUTION     │                                           │
│         └───────────────────────┘                                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE DIVIDE AND CONQUER?                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ ✅ USE D&C WHEN:                                                            │
│    • Problem can be broken into SIMILAR subproblems                         │
│    • Subproblems are INDEPENDENT (don't share data/state)                   │
│    • Solutions can be COMBINED efficiently                                  │
│    • Problem has a NATURAL recursive structure                              │
│                                                                             │
│ ❌ DON'T USE D&C WHEN:                                                      │
│    • Subproblems OVERLAP (use Dynamic Programming instead)                  │
│    • Problem doesn't break into similar subproblems                         │
│    • Combining solutions is as expensive as solving original                │
│                                                                             │
│ D&C vs DYNAMIC PROGRAMMING:                                                 │
│ ┌───────────────────────────────────────────────────────────────────────┐   │
│ │ Divide & Conquer          │ Dynamic Programming                       │   │
│ ├───────────────────────────┼───────────────────────────────────────────┤   │
│ │ Independent subproblems   │ Overlapping subproblems                   │   │
│ │ Top-down recursive        │ Bottom-up iterative (usually)             │   │
│ │ Merge Sort, Quick Sort    │ Fibonacci, Knapsack, LCS                  │   │
│ │ No memoization needed     │ Memoization essential                     │   │
│ └───────────────────────────┴───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES & COMMON MISTAKES                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. CHOOSING WRONG BASE CASE:                                                │
│    Wrong: if (n == 0) → causes infinite recursion for n=1                  │
│    Right: if (n <= 1) → handles both 0 and 1                               │
│                                                                             │
│ 2. NOT REDUCING PROBLEM SIZE:                                               │
│    Wrong: mergeSort(arr, 0, n) recursively with same range                 │
│    Right: mergeSort(arr, 0, mid) and mergeSort(arr, mid+1, n)              │
│                                                                             │
│ 3. STACK OVERFLOW:                                                          │
│    Problem: Too deep recursion (n = 10^6)                                   │
│    Solution: Convert to iterative or increase stack size                    │
│                                                                             │
│ 4. INEFFICIENT COMBINE STEP:                                                │
│    If combine is O(n²), overall becomes O(n² log n) - defeats purpose!     │
│                                                                             │
│ 5. OVERLAPPING SUBPROBLEMS (misusing D&C):                                  │
│    Fibonacci with D&C → O(2ⁿ) because subproblems overlap                  │
│    Solution: Use DP with memoization instead                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ EXPECTED OUTPUTS & COMPLEXITY ANALYSIS                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ RECURRENCE RELATION:                                                        │
│ T(n) = aT(n/b) + f(n)                                                       │
│ where:                                                                      │
│   a = number of subproblems                                                 │
│   b = size reduction factor                                                 │
│   f(n) = work done outside recursion (divide + combine)                    │
│                                                                             │
│ COMMON D&C ALGORITHMS & THEIR COMPLEXITY:                                   │
│ ┌────────────────────┬──────────┬───────────────────┬────────────────────┐  │
│ │ Algorithm          │ a  │ b  │ f(n)  │ T(n)                            │  │
│ ├────────────────────┼────┼────┼───────┼────────────────────────────────┤  │
│ │ Binary Search      │ 1  │ 2  │ O(1)  │ O(log n)                        │  │
│ │ Merge Sort         │ 2  │ 2  │ O(n)  │ O(n log n)                      │  │
│ │ Quick Sort (avg)   │ 2  │ 2  │ O(n)  │ O(n log n)                      │  │
│ │ Strassen's Matrix  │ 7  │ 2  │ O(n²) │ O(n^2.807) [log₂7]             │  │
│ │ Karatsuba Multiply │ 3  │ 2  │ O(n)  │ O(n^1.585) [log₂3]             │  │
│ └────────────────────┴────┴────┴───────┴────────────────────────────────┘  │
│                                                                             │
│ EXAMPLE OUTPUT (Merge Sort):                                                │
│ Input:  [38, 27, 43, 3, 9, 82, 10]                                         │
│ Divide: [38, 27, 43, 3] | [9, 82, 10]                                      │
│ Divide: [38, 27] | [43, 3] | [9, 82] | [10]                                │
│ Conquer: [27, 38] | [3, 43] | [9, 82] | [10]                               │
│ Combine: [3, 27, 38, 43] | [9, 10, 82]                                     │
│ Output: [3, 9, 10, 27, 38, 43, 82]                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Binary Search

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    BINARY SEARCH - COMPLETE UNDERSTANDING                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS BINARY SEARCH?                                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│ A search algorithm that finds a target value in a SORTED array by           │
│ repeatedly dividing the search interval in half.                             │
│                                                                              │
│ INVENTOR: While the concept is ancient, the first bug-free implementation   │
│ took 16 years after the algorithm was published (1946-1962)!                │
│                                                                              │
│ FUN FACT: Even experienced programmers often write buggy binary search.     │
│ Jon Bentley found that 90% of professional programmers couldn't write      │
│ a correct binary search in 2 hours!                                         │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DOES IT SOLVE?                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ CORE PROBLEM: Finding an element in sorted data FAST                         │
│                                                                              │
│ LINEAR SEARCH: Check every element → O(n)                                    │
│ BINARY SEARCH: Eliminate half each step → O(log n)                           │
│                                                                              │
│ DRAMATIC DIFFERENCE:                                                         │
│ Array size 1,000,000:                                                        │
│ • Linear: Up to 1,000,000 comparisons                                        │
│ • Binary: Up to 20 comparisons (log₂ 1,000,000 ≈ 20)                        │
│                                                                              │
│ That's 50,000x fewer comparisons!                                            │
│                                                                              │
│ REAL-WORLD ANALOGY:                                                          │
│ Dictionary lookup: You don't start from page 1!                              │
│ • Open to middle                                                             │
│ • Word comes before? Check first half                                        │
│ • Word comes after? Check second half                                        │
│ • Repeat until found                                                         │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHY DOES BINARY SEARCH WORK?                                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│ PREREQUISITE: Array MUST be sorted!                                          │
│                                                                              │
│ THE LOGIC:                                                                   │
│ If array is sorted and middle element is:                                    │
│ • Equal to target → FOUND!                                                   │
│ • Greater than target → Target must be in LEFT half (all right are bigger)  │
│ • Less than target → Target must be in RIGHT half (all left are smaller)   │
│                                                                              │
│ Each comparison eliminates HALF of remaining elements!                       │
│ n → n/2 → n/4 → n/8 → ... → 1                                               │
│ This takes log₂(n) steps                                                     │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE BINARY SEARCH?                                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ ✅ USE WHEN:                                                                │
│    • Data is SORTED (or can be sorted once, searched many times)            │
│    • Random access is possible (arrays, not linked lists)                    │
│    • Finding exact match                                                     │
│    • Finding insertion point                                                 │
│    • Finding first/last occurrence of a value                                │
│    • Search space can be divided (not just arrays - see variations!)        │
│                                                                              │
│ ❌ DON'T USE WHEN:                                                          │
│    • Data is unsorted and won't be searched again                            │
│    • Data changes frequently (maintain sorted = expensive)                   │
│    • Sequential access only (linked lists)                                   │
│    • Very small arrays (linear search is fine for n < 10)                   │
│                                                                              │
│ INTERVIEW SIGNAL: "Find in sorted array" or "Search space" = BINARY SEARCH  │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES & COMMON BUGS                                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1. INTEGER OVERFLOW IN MID CALCULATION:                                      │
│    WRONG: int mid = (left + right) / 2;  // Can overflow!                   │
│    RIGHT: int mid = left + (right - left) / 2;                              │
│                                                                              │
│ 2. INFINITE LOOP (Wrong termination):                                        │
│    WRONG: while (left < right)  with mid = left + (right-left)/2           │
│           If left=4, right=5: mid=4, never terminates!                       │
│    RIGHT: Match loop condition with update logic                             │
│                                                                              │
│ 3. OFF-BY-ONE ERRORS:                                                        │
│    When to use left = mid vs left = mid + 1?                                │
│    When to use right = mid vs right = mid - 1?                              │
│    Solution: Think about whether mid could be the answer                     │
│                                                                              │
│ 4. EMPTY ARRAY:                                                              │
│    Always check if array is empty before searching!                          │
│                                                                              │
│ 5. DUPLICATES:                                                               │
│    Standard binary search finds ANY occurrence                               │
│    For first/last, need modified versions (see below)                        │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ EXPECTED OUTPUTS & COMPLEXITY                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│ TIME COMPLEXITY:  O(log n) - halving each iteration                          │
│ SPACE COMPLEXITY: O(1) iterative, O(log n) recursive                         │
│                                                                              │
│ OUTPUTS:                                                                     │
│ • Found: Return index of target                                              │
│ • Not found: Return -1 OR insertion point (depends on variant)              │
│                                                                              │
│ NUMBER OF COMPARISONS:                                                       │
│ • Best case: 1 (target is at mid)                                            │
│ • Worst case: ⌈log₂(n+1)⌉                                                   │
│ • Average case: log₂(n) - 1                                                  │
│                                                                              │
│ ┌────────────────┬──────────────────────────────────────────────────────────┐│
│ │ Array Size     │ Max Comparisons                                          ││
│ ├────────────────┼──────────────────────────────────────────────────────────┤│
│ │ 10             │ 4                                                        ││
│ │ 100            │ 7                                                        ││
│ │ 1,000          │ 10                                                       ││
│ │ 1,000,000      │ 20                                                       ││
│ │ 1,000,000,000  │ 30                                                       ││
│ └────────────────┴──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

```java
// STANDARD BINARY SEARCH
// PROBLEM: Find target in sorted array
// DIVIDE: Look at middle, decide which half to search
// CONQUER: Search in chosen half
// COMBINE: No combining needed

public int binarySearch(int[] arr, int target) {
    int left = 0, right = arr.length - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;  // Avoid overflow

        if (arr[mid] == target) {
            return mid;
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return -1;  // Not found
}

// VISUAL TRACE:
// arr = [1, 3, 5, 7, 9, 11, 13], target = 7
//
// Step 1: left=0, right=6, mid=3
//         arr[3]=7 == target ✓ FOUND at index 3!
//
// If target = 11:
// Step 1: left=0, right=6, mid=3
//         arr[3]=7 < 11, so left=4
// Step 2: left=4, right=6, mid=5
//         arr[5]=11 == target ✓ FOUND at index 5!
//
// If target = 6 (not in array):
// Step 1: left=0, right=6, mid=3, arr[3]=7 > 6, right=2
// Step 2: left=0, right=2, mid=1, arr[1]=3 < 6, left=2
// Step 3: left=2, right=2, mid=2, arr[2]=5 < 6, left=3
// Step 4: left=3, right=2 → left > right, EXIT, return -1

// TIME: O(log n) - halving each time
// SPACE: O(1) iterative, O(log n) recursive

// RECURRENCE: T(n) = T(n/2) + O(1) = O(log n)

// VARIANT: Find first occurrence (when duplicates exist)
public int findFirst(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    int result = -1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (arr[mid] == target) {
            result = mid;      // Found one, but keep searching left
            right = mid - 1;   // for potentially earlier occurrence
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return result;
}

// VARIANT: Find last occurrence
public int findLast(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    int result = -1;

    while (left <= right) {
        int mid = left + (right - left) / 2;

        if (arr[mid] == target) {
            result = mid;     // Found one, but keep searching right
            left = mid + 1;   // for potentially later occurrence
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return result;
}
```

### Finding Maximum and Minimum

```java
// NAIVE: 2n-2 comparisons
// D&C: 3n/2 - 2 comparisons (25% fewer!)

class Pair {
    int min, max;
    Pair(int min, int max) {
        this.min = min;
        this.max = max;
    }
}

public Pair findMinMax(int[] arr, int low, int high) {
    // Base case: single element
    if (low == high) {
        return new Pair(arr[low], arr[low]);
    }

    // Base case: two elements
    if (high == low + 1) {
        if (arr[low] < arr[high]) {
            return new Pair(arr[low], arr[high]);
        } else {
            return new Pair(arr[high], arr[low]);
        }
    }

    // Divide
    int mid = (low + high) / 2;
    Pair left = findMinMax(arr, low, mid);
    Pair right = findMinMax(arr, mid + 1, high);

    // Combine
    return new Pair(
        Math.min(left.min, right.min),
        Math.max(left.max, right.max)
    );
}

// VISUAL TRACE:
// arr = [3, 5, 1, 8, 2, 9]
//
//              [3,5,1,8,2,9]
//              /            \
//         [3,5,1]        [8,2,9]
//         /    \          /    \
//       [3,5]  [1]     [8,2]  [9]
//        ↓      ↓        ↓      ↓
//     (3,5)   (1,1)   (2,8)  (9,9)
//         \    /          \    /
//        (1,5)           (2,9)
//              \        /
//              (1,9)
//
// Answer: min=1, max=9
```

### Quick Sort

```java
// DIVIDE: Partition around pivot
// CONQUER: Recursively sort left and right
// COMBINE: No combining needed (in-place)

public void quickSort(int[] arr, int low, int high) {
    if (low < high) {
        int pivotIndex = partition(arr, low, high);
        quickSort(arr, low, pivotIndex - 1);
        quickSort(arr, pivotIndex + 1, high);
    }
}

private int partition(int[] arr, int low, int high) {
    int pivot = arr[high];  // Choose last element as pivot
    int i = low - 1;        // Index of smaller element

    for (int j = low; j < high; j++) {
        if (arr[j] <= pivot) {
            i++;
            swap(arr, i, j);
        }
    }

    swap(arr, i + 1, high);
    return i + 1;
}

// VISUAL TRACE:
// arr = [10, 7, 8, 9, 1, 5]
//
// Step 1: pivot = 5
//         Partition: [1] [5] [10, 7, 8, 9]
//
// Step 2: Sort left [1] - already sorted
//         Sort right [10, 7, 8, 9], pivot = 9
//         Partition: [7, 8] [9] [10]
//
// Step 3: Sort [7, 8], pivot = 8
//         Result: [7, 8]
//
// Final: [1, 5, 7, 8, 9, 10]

// TIME: O(n log n) average, O(n²) worst (sorted array + bad pivot)
// SPACE: O(log n) stack space
// RECURRENCE: T(n) = 2T(n/2) + O(n) = O(n log n)
```

### Merge Sort (D&C)

```java
public void mergeSort(int[] arr, int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2;

        // Divide
        mergeSort(arr, left, mid);
        mergeSort(arr, mid + 1, right);

        // Combine
        merge(arr, left, mid, right);
    }
}

// VISUAL TRACE:
// arr = [38, 27, 43, 3, 9, 82, 10]
//
//           [38, 27, 43, 3, 9, 82, 10]
//          /                          \
//    [38, 27, 43, 3]          [9, 82, 10]
//    /            \            /        \
// [38, 27]    [43, 3]      [9, 82]    [10]
//  /    \      /    \       /    \      |
// [38] [27]  [43]  [3]    [9]  [82]   [10]
//  \    /      \    /       \    /      |
// [27, 38]    [3, 43]      [9, 82]    [10]
//    \          /            \        /
//   [3, 27, 38, 43]         [9, 10, 82]
//          \                  /
//      [3, 9, 10, 27, 38, 43, 82]

// TIME: O(n log n) always
// SPACE: O(n) for temp arrays
```

### Master Theorem

```
For recurrence: T(n) = aT(n/b) + f(n)

Let c = log_b(a)

CASE 1: If f(n) = O(n^(c-ε)) for some ε > 0
        Then T(n) = Θ(n^c)
        (Work dominated by leaves)

CASE 2: If f(n) = Θ(n^c)
        Then T(n) = Θ(n^c · log n)
        (Work evenly distributed)

CASE 3: If f(n) = Ω(n^(c+ε)) for some ε > 0
        And af(n/b) ≤ kf(n) for k < 1
        Then T(n) = Θ(f(n))
        (Work dominated by root)

EXAMPLES:
Binary Search:  T(n) = T(n/2) + O(1)
                a=1, b=2, f(n)=O(1), c=0
                Case 2: T(n) = O(log n)

Merge Sort:     T(n) = 2T(n/2) + O(n)
                a=2, b=2, f(n)=O(n), c=1
                Case 2: T(n) = O(n log n)

Strassen:       T(n) = 7T(n/2) + O(n²)
                a=7, b=2, f(n)=O(n²), c=log₂7≈2.81
                Case 1: T(n) = O(n^2.807)  // log₂7 ≈ 2.807
```

---

# UNIT 2: THE GREEDY METHOD

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
