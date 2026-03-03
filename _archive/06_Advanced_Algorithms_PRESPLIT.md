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
✗ Coin change with unusual denominations
✗ 0/1 Knapsack (need DP)
✗ Problems requiring backtracking
```

### Fractional Knapsack Problem

```java
// CAN take fractions of items
// Greedy by value/weight ratio WORKS!

class Item {
    int value, weight;
    double ratio;

    Item(int v, int w) {
        value = v;
        weight = w;
        ratio = (double) v / w;
    }
}

public double fractionalKnapsack(Item[] items, int capacity) {
    // Sort by value/weight ratio (descending)
    Arrays.sort(items, (a, b) -> Double.compare(b.ratio, a.ratio));

    double totalValue = 0;
    int remainingCapacity = capacity;

    for (Item item : items) {
        if (remainingCapacity >= item.weight) {
            // Take whole item
            totalValue += item.value;
            remainingCapacity -= item.weight;
        } else {
            // Take fraction of item
            totalValue += item.ratio * remainingCapacity;
            break;
        }
    }

    return totalValue;
}

// VISUAL EXAMPLE:
// Items: [(60,10), (100,20), (120,30)]
// Capacity: 50
//
// Ratios: 60/10=6, 100/20=5, 120/30=4
// Sorted: [(60,10), (100,20), (120,30)]
//
// Take (60,10): value=60, capacity=40
// Take (100,20): value=160, capacity=20
// Take 20/30 of (120,30): value=160+80=240
//
// Answer: 240

// TIME: O(n log n) for sorting
```

### Job Sequencing with Deadlines

```java
// Jobs with deadlines and profits
// Schedule to maximize profit
// Each job takes 1 unit time

class Job {
    int id, deadline, profit;
    Job(int id, int d, int p) {
        this.id = id;
        deadline = d;
        profit = p;
    }
}

public int jobSequencing(Job[] jobs, int maxDeadline) {
    // Sort by profit (descending)
    Arrays.sort(jobs, (a, b) -> b.profit - a.profit);

    boolean[] slot = new boolean[maxDeadline + 1];
    int[] result = new int[maxDeadline + 1];
    int totalProfit = 0;

    for (Job job : jobs) {
        // Find latest free slot before deadline
        for (int j = job.deadline; j >= 1; j--) {
            if (!slot[j]) {
                slot[j] = true;
                result[j] = job.id;
                totalProfit += job.profit;
                break;
            }
        }
    }

    return totalProfit;
}

// VISUAL EXAMPLE:
// Jobs: [(1,2,100), (2,1,19), (3,2,27), (4,1,25), (5,3,15)]
// Sorted by profit: [J1(100), J3(27), J4(25), J2(19), J5(15)]
//
// J1: deadline=2, slot[2] free → assign
// J3: deadline=2, slot[2] taken, slot[1] free → assign
// J4: deadline=1, slot[1] taken → skip
// J2: deadline=1, slot[1] taken → skip
// J5: deadline=3, slot[3] free → assign
//
// Schedule: [J3, J1, J5] = slots [1, 2, 3]
// Profit: 27 + 100 + 15 = 142

// TIME: O(n² ) naive, O(n log n) with Union-Find
```

### Single Source Shortest Path (Dijkstra's Algorithm)

```java
// Find shortest path from source to all vertices
// Works only for non-negative weights

public int[] dijkstra(int[][] graph, int source, int n) {
    int[] dist = new int[n];
    boolean[] visited = new boolean[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[source] = 0;

    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);
    pq.offer(new int[]{source, 0});

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int u = curr[0];

        if (visited[u]) continue;
        visited[u] = true;

        for (int v = 0; v < n; v++) {
            if (graph[u][v] != 0 && !visited[v]) {
                int newDist = dist[u] + graph[u][v];
                if (newDist < dist[v]) {
                    dist[v] = newDist;
                    pq.offer(new int[]{v, newDist});
                }
            }
        }
    }

    return dist;
}

// VISUAL EXAMPLE:
//
//        (1)---4---(2)
//       / |         |
//      2  1         3
//     /   |         |
//   (0)   (3)---2---(4)
//
// From source 0:
//
// Step 1: dist = [0, ∞, ∞, ∞, ∞], visit 0
//         Update: dist[1] = 2
//
// Step 2: dist = [0, 2, ∞, ∞, ∞], visit 1
//         Update: dist[2] = 2+4 = 6
//         Update: dist[3] = 2+1 = 3
//
// Step 3: dist = [0, 2, 6, 3, ∞], visit 3
//         Update: dist[4] = 3+2 = 5
//
// Step 4: dist = [0, 2, 6, 3, 5], visit 4
//         Update: dist[2] = min(6, 5+3) = 6 (no change)
//
// Final: [0, 2, 6, 3, 5]

// TIME: O((V+E) log V) with priority queue
```

### Optimal Merge Pattern (Huffman-like)

```java
// Merge n sorted files with minimum comparisons
// Greedy: Always merge two smallest files

public int optimalMerge(int[] fileSizes) {
    PriorityQueue<Integer> pq = new PriorityQueue<>();

    for (int size : fileSizes) {
        pq.offer(size);
    }

    int totalCost = 0;

    while (pq.size() > 1) {
        int first = pq.poll();
        int second = pq.poll();
        int merged = first + second;

        totalCost += merged;
        pq.offer(merged);
    }

    return totalCost;
}

// VISUAL EXAMPLE:
// Files: [2, 3, 4, 5, 6]
//
// Merge 2+3 = 5, cost = 5
// Files: [4, 5, 5, 6]
//
// Merge 4+5 = 9, cost = 5+9 = 14
// Files: [5, 6, 9]
//
// Merge 5+6 = 11, cost = 14+11 = 25
// Files: [9, 11]
//
// Merge 9+11 = 20, cost = 25+20 = 45
//
// Total cost: 45

// TIME: O(n log n)
```

---

# UNIT 3: DYNAMIC PROGRAMMING

## The General Method

```
DYNAMIC PROGRAMMING:
Solve complex problems by breaking into overlapping subproblems,
solving each subproblem once, and storing results.

DP = RECURSION + MEMOIZATION (or TABULATION)

TWO APPROACHES:
1. TOP-DOWN (Memoization):
   - Start from main problem
   - Recursively solve subproblems
   - Cache results

2. BOTTOM-UP (Tabulation):
   - Start from smallest subproblems
   - Build up to main problem
   - Fill table iteratively

WHEN TO USE DP:
✓ Optimal Substructure
✓ Overlapping Subproblems
✓ Counting problems
✓ Optimization problems (min/max)
```

### 0/1 Knapsack Problem

```java
// CANNOT take fractions - either take item or don't
// Greedy FAILS here - need DP

public int knapsack01(int[] weights, int[] values, int capacity) {
    int n = weights.length;
    int[][] dp = new int[n + 1][capacity + 1];

    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= capacity; w++) {
            // Don't take item i-1
            dp[i][w] = dp[i - 1][w];

            // Take item i-1 (if it fits)
            if (weights[i - 1] <= w) {
                dp[i][w] = Math.max(
                    dp[i][w],
                    dp[i - 1][w - weights[i - 1]] + values[i - 1]
                );
            }
        }
    }

    return dp[n][capacity];
}

// VISUAL DP TABLE:
// weights = [1, 2, 3], values = [6, 10, 12], capacity = 5
//
//        w:  0   1   2   3   4   5
// item 0:    0   0   0   0   0   0
// item 1:    0   6   6   6   6   6   (w=1, v=6)
// item 2:    0   6  10  16  16  16   (w=2, v=10)
// item 3:    0   6  10  16  18  22   (w=3, v=12)
//
// Answer: 22 (items 2 and 3: weights 2+3=5, values 10+12=22)

// TIME: O(n × capacity)
// SPACE: O(n × capacity), can optimize to O(capacity)
```

### Single Source Shortest Path (Bellman-Ford)

```java
// Works with NEGATIVE weights (unlike Dijkstra)
// Can detect negative cycles

public int[] bellmanFord(int[][] edges, int n, int source) {
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[source] = 0;

    // Relax all edges (n-1) times
    for (int i = 0; i < n - 1; i++) {
        for (int[] edge : edges) {
            int u = edge[0], v = edge[1], weight = edge[2];
            if (dist[u] != Integer.MAX_VALUE &&
                dist[u] + weight < dist[v]) {
                dist[v] = dist[u] + weight;
            }
        }
    }

    // Check for negative cycle
    for (int[] edge : edges) {
        int u = edge[0], v = edge[1], weight = edge[2];
        if (dist[u] != Integer.MAX_VALUE &&
            dist[u] + weight < dist[v]) {
            throw new RuntimeException("Negative cycle detected!");
        }
    }

    return dist;
}

// VISUAL TRACE:
// Edges: [(0,1,4), (0,2,5), (1,2,-3), (2,3,4)]
// Source: 0
//
// Initial:  dist = [0, ∞, ∞, ∞]
// Pass 1:   dist = [0, 4, 5, ∞]  → [0, 4, 1, 5]
// Pass 2:   dist = [0, 4, 1, 5]  (no change)
// Pass 3:   No change → converged

// TIME: O(V × E)
```

### All Pairs Shortest Paths (Floyd-Warshall)

```java
// Find shortest path between ALL pairs of vertices
// Works with negative weights, detects negative cycles

public int[][] floydWarshall(int[][] graph, int n) {
    int[][] dist = new int[n][n];
    int INF = Integer.MAX_VALUE / 2;

    // Initialize
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            if (i == j) dist[i][j] = 0;
            else if (graph[i][j] != 0) dist[i][j] = graph[i][j];
            else dist[i][j] = INF;
        }
    }

    // DP: Consider each vertex as intermediate
    for (int k = 0; k < n; k++) {           // Intermediate vertex
        for (int i = 0; i < n; i++) {       // Source
            for (int j = 0; j < n; j++) {   // Destination
                if (dist[i][k] + dist[k][j] < dist[i][j]) {
                    dist[i][j] = dist[i][k] + dist[k][j];
                }
            }
        }
    }

    return dist;
}

// VISUAL EXAMPLE:
//     0   1   2   3
// 0 [ 0   5   ∞   10]
// 1 [ ∞   0   3   ∞ ]
// 2 [ ∞   ∞   0   1 ]
// 3 [ ∞   ∞   ∞   0 ]
//
// After k=0: No changes (0 not useful as intermediate)
// After k=1: dist[0][2] = min(∞, 5+3) = 8
// After k=2: dist[0][3] = min(10, 8+1) = 9
//            dist[1][3] = min(∞, 3+1) = 4
// After k=3: No changes
//
// Final:
//     0   1   2   3
// 0 [ 0   5   8   9 ]
// 1 [ ∞   0   3   4 ]
// 2 [ ∞   ∞   0   1 ]
// 3 [ ∞   ∞   ∞   0 ]

// TIME: O(V³)
// SPACE: O(V²)
```

### Traveling Salesperson Problem (DP with Bitmask)

```java
// Visit all cities exactly once and return to start
// Find minimum cost tour

public int tsp(int[][] dist, int n) {
    int VISITED_ALL = (1 << n) - 1;
    int[][] dp = new int[n][1 << n];

    for (int[] row : dp) Arrays.fill(row, Integer.MAX_VALUE / 2);
    dp[0][1] = 0;  // Start at city 0, only city 0 visited

    for (int mask = 1; mask <= VISITED_ALL; mask++) {
        for (int last = 0; last < n; last++) {
            if ((mask & (1 << last)) == 0) continue;  // last not in mask

            for (int next = 0; next < n; next++) {
                if ((mask & (1 << next)) != 0) continue;  // next already visited

                int newMask = mask | (1 << next);
                dp[next][newMask] = Math.min(
                    dp[next][newMask],
                    dp[last][mask] + dist[last][next]
                );
            }
        }
    }

    // Return to starting city
    int ans = Integer.MAX_VALUE;
    for (int last = 1; last < n; last++) {
        ans = Math.min(ans, dp[last][VISITED_ALL] + dist[last][0]);
    }
    return ans;
}

// VISUAL EXAMPLE (4 cities):
// dist = [[0,10,15,20],
//         [10,0,35,25],
//         [15,35,0,30],
//         [20,25,30,0]]
//
// Bitmask representation:
// 0001 = city 0 visited
// 0011 = cities 0,1 visited
// 1111 = all visited
//
// Optimal tour: 0→1→3→2→0
// Cost: 10 + 25 + 30 + 15 = 80

// TIME: O(n² × 2ⁿ)
// SPACE: O(n × 2ⁿ)
```

### String Editing (Edit Distance)

```java
// Minimum operations to convert string1 to string2
// Operations: Insert, Delete, Replace

public int editDistance(String s1, String s2) {
    int m = s1.length(), n = s2.length();
    int[][] dp = new int[m + 1][n + 1];

    // Base cases
    for (int i = 0; i <= m; i++) dp[i][0] = i;  // Delete all
    for (int j = 0; j <= n; j++) dp[0][j] = j;  // Insert all

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (s1.charAt(i - 1) == s2.charAt(j - 1)) {
                dp[i][j] = dp[i - 1][j - 1];  // No operation
            } else {
                dp[i][j] = 1 + Math.min(
                    dp[i - 1][j - 1],  // Replace
                    Math.min(
                        dp[i - 1][j],  // Delete
                        dp[i][j - 1]   // Insert
                    )
                );
            }
        }
    }

    return dp[m][n];
}

// VISUAL DP TABLE:
// s1 = "SUNDAY", s2 = "SATURDAY"
//
//       ""  S  A  T  U  R  D  A  Y
//   ""   0  1  2  3  4  5  6  7  8
//   S    1  0  1  2  3  4  5  6  7
//   U    2  1  1  2  2  3  4  5  6
//   N    3  2  2  2  3  3  4  5  6
//   D    4  3  3  3  3  4  3  4  5
//   A    5  4  3  4  4  4  4  3  4
//   Y    6  5  4  4  5  5  5  4  3
//
// Answer: 3 (Insert A, T, R)

// TIME: O(m × n)
// SPACE: O(m × n), can optimize to O(min(m, n))
```

---

# UNIT 4: BACKTRACKING

## The General Method

```
BACKTRACKING:
Systematic way to try all possible solutions.
Build solution incrementally, abandon ("backtrack") when
solution cannot possibly be completed.

┌─────────────────────────────────────────┐
│           BACKTRACKING TEMPLATE         │
├─────────────────────────────────────────┤
│                                         │
│  void backtrack(state, choices):        │
│      if (isSolution(state)):            │
│          processSolution(state)         │
│          return                         │
│                                         │
│      for each choice in choices:        │
│          if (isValid(choice)):          │
│              makeChoice(choice)         │
│              backtrack(newState)        │
│              undoChoice(choice)  ← KEY! │
│                                         │
└─────────────────────────────────────────┘

STATE SPACE TREE:
                    []
           /    /    \    \
         [1]  [2]   [3]  [4]
         /|\   |\    |
       ...     ...  ...   (pruned branches)
```

### N-Queens Problem

```java
// Place N queens on N×N board so no two attack each other

public List<List<String>> solveNQueens(int n) {
    List<List<String>> result = new ArrayList<>();
    int[] queens = new int[n];  // queens[row] = column
    Arrays.fill(queens, -1);

    backtrack(result, queens, 0, n);
    return result;
}

private void backtrack(List<List<String>> result, int[] queens,
                       int row, int n) {
    if (row == n) {
        result.add(buildBoard(queens, n));
        return;
    }

    for (int col = 0; col < n; col++) {
        if (isValid(queens, row, col)) {
            queens[row] = col;
            backtrack(result, queens, row + 1, n);
            queens[row] = -1;  // Backtrack
        }
    }
}

private boolean isValid(int[] queens, int row, int col) {
    for (int i = 0; i < row; i++) {
        // Same column
        if (queens[i] == col) return false;
        // Diagonal
        if (Math.abs(queens[i] - col) == Math.abs(i - row)) return false;
    }
    return true;
}

// VISUAL SOLUTION for N=4:
//
// Solution 1:        Solution 2:
// . Q . .            . . Q .
// . . . Q            Q . . .
// Q . . .            . . . Q
// . . Q .            . Q . .
//
// State Space Tree (partial):
//                    []
//            /    |    |    \
//          Q0    Q1   Q2   Q3  (row 0, columns 0-3)
//         / |    /\
//       ×  Q3  Q3 ×    (row 1, try each column)
//           |
//          Q0        (row 2)
//           |
//          Q2        (row 3) ✓ SOLUTION

// TIME: O(N!)
// SPACE: O(N) for recursion stack
```

### Sum of Subsets Problem

```java
// Find all subsets that sum to target

public List<List<Integer>> subsetSum(int[] nums, int target) {
    List<List<Integer>> result = new ArrayList<>();
    Arrays.sort(nums);  // For pruning
    backtrack(result, new ArrayList<>(), nums, target, 0);
    return result;
}

private void backtrack(List<List<Integer>> result, List<Integer> current,
                       int[] nums, int remaining, int start) {
    if (remaining == 0) {
        result.add(new ArrayList<>(current));
        return;
    }

    for (int i = start; i < nums.length; i++) {
        // Pruning: if number too large, all following are too (sorted)
        if (nums[i] > remaining) break;

        // Skip duplicates
        if (i > start && nums[i] == nums[i - 1]) continue;

        current.add(nums[i]);
        backtrack(result, current, nums, remaining - nums[i], i + 1);
        current.remove(current.size() - 1);  // Backtrack
    }
}

// VISUAL EXAMPLE:
// nums = [2, 3, 5, 7], target = 10
//
// State Space Tree:
//                         []
//           /        |        |       \
//         [2]       [3]      [5]     [7]
//        / | \      /  \       |
//     [2,3][2,5][2,7] [3,5][3,7] [5,7]×
//      |     |
//   [2,3,5] [2,5,7]×
//     ×
//
// Solutions: [3,7], [2,3,5]

// TIME: O(2ⁿ) worst case
```

### Graph Coloring Problem

```java
// Color graph with m colors so no adjacent vertices have same color

public boolean graphColoring(int[][] graph, int m, int n) {
    int[] colors = new int[n];
    return backtrack(graph, colors, m, 0);
}

private boolean backtrack(int[][] graph, int[] colors, int m, int vertex) {
    if (vertex == colors.length) {
        return true;  // All vertices colored
    }

    for (int c = 1; c <= m; c++) {
        if (isSafe(graph, colors, vertex, c)) {
            colors[vertex] = c;
            if (backtrack(graph, colors, m, vertex + 1)) {
                return true;
            }
            colors[vertex] = 0;  // Backtrack
        }
    }

    return false;  // No valid coloring
}

private boolean isSafe(int[][] graph, int[] colors, int vertex, int color) {
    for (int i = 0; i < colors.length; i++) {
        if (graph[vertex][i] == 1 && colors[i] == color) {
            return false;
        }
    }
    return true;
}

// VISUAL EXAMPLE:
// Graph:     0---1
//            |\ /|
//            | X |
//            |/ \|
//            3---2
//
// m=3 colors (R=1, G=2, B=3)
//
// vertex 0: try R → colors = [R, _, _, _]
// vertex 1: try R (conflict with 0)
//           try G → colors = [R, G, _, _]
// vertex 2: try R (conflict with 0)
//           try G (conflict with 1)
//           try B → colors = [R, G, B, _]
// vertex 3: try R (conflict with 0)
//           try G → colors = [R, G, B, G]
//
// Valid coloring found!
```

### Hamiltonian Cycle Problem

```java
// Find cycle that visits every vertex exactly once

public List<Integer> hamiltonianCycle(int[][] graph, int n) {
    int[] path = new int[n];
    Arrays.fill(path, -1);
    path[0] = 0;  // Start at vertex 0

    if (backtrack(graph, path, 1)) {
        List<Integer> result = new ArrayList<>();
        for (int v : path) result.add(v);
        result.add(0);  // Complete the cycle
        return result;
    }
    return null;
}

private boolean backtrack(int[][] graph, int[] path, int pos) {
    if (pos == path.length) {
        // Check if there's edge from last vertex to first
        return graph[path[pos - 1]][path[0]] == 1;
    }

    for (int v = 1; v < path.length; v++) {
        if (isSafe(graph, path, pos, v)) {
            path[pos] = v;
            if (backtrack(graph, path, pos + 1)) {
                return true;
            }
            path[pos] = -1;  // Backtrack
        }
    }

    return false;
}

private boolean isSafe(int[][] graph, int[] path, int pos, int v) {
    // Check if v is adjacent to previously added vertex
    if (graph[path[pos - 1]][v] == 0) return false;

    // Check if v already in path
    for (int i = 0; i < pos; i++) {
        if (path[i] == v) return false;
    }

    return true;
}

// VISUAL EXAMPLE:
// Graph:
//     0---1
//    /|   |\
//   3 |   | 2
//    \|   |/
//     4---5
//
// Finding Hamiltonian Cycle starting from 0:
// 0 → 1 → 2 → 5 → 4 → 3 → 0 ✓

// TIME: O(N!) worst case
```

---

# UNIT 5: BRANCH AND BOUND

## The General Method

```
BRANCH AND BOUND:
Like backtracking, but uses BOUNDS to prune more aggressively.

KEY DIFFERENCE FROM BACKTRACKING:
- Backtracking: Prune when solution CANNOT be completed
- Branch & Bound: Prune when solution CANNOT be optimal

COMPONENTS:
1. BRANCHING: Split problem into subproblems
2. BOUNDING: Calculate bounds for each subproblem
3. PRUNING: Discard subproblems with bad bounds

┌─────────────────────────────────────────┐
│        BRANCH AND BOUND TYPES           │
├─────────────────────────────────────────┤
│                                         │
│  FIFO (BFS-like):                       │
│    - Process nodes in queue order       │
│    - Explores level by level            │
│                                         │
│  LC (Least Cost):                       │
│    - Process most promising node first  │
│    - Uses priority queue                │
│                                         │
│  LIFO (DFS-like):                       │
│    - Process most recent node first     │
│    - Memory efficient                   │
│                                         │
└─────────────────────────────────────────┘
```

### 0/1 Knapsack using Branch and Bound

```java
class Node {
    int level, profit, weight;
    double bound;
}

public int knapsackBB(int[] values, int[] weights, int capacity) {
    int n = values.length;

    // Sort by value/weight ratio
    Integer[] idx = new Integer[n];
    for (int i = 0; i < n; i++) idx[i] = i;
    Arrays.sort(idx, (a, b) ->
        Double.compare((double)values[b]/weights[b],
                      (double)values[a]/weights[a]));

    PriorityQueue<Node> pq = new PriorityQueue<>(
        (a, b) -> Double.compare(b.bound, a.bound)
    );

    Node root = new Node();
    root.level = -1;
    root.profit = 0;
    root.weight = 0;
    root.bound = calculateBound(root, values, weights, capacity, idx, n);

    pq.offer(root);
    int maxProfit = 0;

    while (!pq.isEmpty()) {
        Node node = pq.poll();

        if (node.bound <= maxProfit) continue;  // Prune!

        int i = node.level + 1;
        if (i >= n) continue;

        int itemIdx = idx[i];

        // Include item
        Node include = new Node();
        include.level = i;
        include.weight = node.weight + weights[itemIdx];
        include.profit = node.profit + values[itemIdx];

        if (include.weight <= capacity) {
            maxProfit = Math.max(maxProfit, include.profit);
            include.bound = calculateBound(include, values, weights,
                                          capacity, idx, n);
            if (include.bound > maxProfit) {
                pq.offer(include);
            }
        }

        // Exclude item
        Node exclude = new Node();
        exclude.level = i;
        exclude.weight = node.weight;
        exclude.profit = node.profit;
        exclude.bound = calculateBound(exclude, values, weights,
                                       capacity, idx, n);
        if (exclude.bound > maxProfit) {
            pq.offer(exclude);
        }
    }

    return maxProfit;
}

// Bound = current profit + fractional knapsack on remaining items
private double calculateBound(Node node, int[] values, int[] weights,
                              int capacity, Integer[] idx, int n) {
    if (node.weight >= capacity) return 0;

    double bound = node.profit;
    int w = node.weight;
    int i = node.level + 1;

    while (i < n && w + weights[idx[i]] <= capacity) {
        w += weights[idx[i]];
        bound += values[idx[i]];
        i++;
    }

    if (i < n) {
        bound += (capacity - w) * ((double)values[idx[i]] / weights[idx[i]]);
    }

    return bound;
}

// VISUAL EXAMPLE:
// values = [40, 30, 50, 10], weights = [2, 5, 10, 5], capacity = 16
// Sorted by ratio: items [0, 1, 2, 3] with ratios [20, 6, 5, 2]
//
// Root: profit=0, weight=0, bound=98
//
//                    [root, bound=98]
//                   /              \
//         [include 0]          [exclude 0]
//         p=40,w=2              p=0,w=0
//         bound=98              bound=58
//              |                     |
//         [include 1]          (explored...)
//         p=70,w=7
//         bound=80
//              |
//         [include 2]
//         p=120,w=17 > capacity (PRUNED)
//              |
//         [exclude 2]
//         p=70,w=7
//         bound=76
```

### Traveling Salesperson using Branch and Bound

```java
// Find minimum cost Hamiltonian cycle

class TSPNode {
    int level;
    int[] path;
    boolean[] visited;
    int cost;
    int bound;
}

public int tspBranchBound(int[][] dist, int n) {
    PriorityQueue<TSPNode> pq = new PriorityQueue<>(
        (a, b) -> a.bound - b.bound
    );

    TSPNode root = createNode(dist, n, -1, 0);
    root.path[0] = 0;
    root.visited[0] = true;
    root.level = 0;
    root.cost = 0;
    root.bound = calculateBound(root, dist, n);

    pq.offer(root);
    int minCost = Integer.MAX_VALUE;

    while (!pq.isEmpty()) {
        TSPNode node = pq.poll();

        if (node.bound >= minCost) continue;  // Prune

        if (node.level == n - 1) {
            // Complete tour
            int lastCity = node.path[node.level];
            int tourCost = node.cost + dist[lastCity][0];
            minCost = Math.min(minCost, tourCost);
            continue;
        }

        for (int city = 0; city < n; city++) {
            if (!node.visited[city]) {
                TSPNode child = createChild(node, dist, n, city);
                if (child.bound < minCost) {
                    pq.offer(child);
                }
            }
        }
    }

    return minCost;
}

// Bound calculation: Cost so far + minimum outgoing edges from unvisited
private int calculateBound(TSPNode node, int[][] dist, int n) {
    int bound = node.cost;

    for (int i = 0; i < n; i++) {
        if (!node.visited[i] || i == node.path[node.level]) {
            int minEdge = Integer.MAX_VALUE;
            for (int j = 0; j < n; j++) {
                if (i != j && (!node.visited[j] || j == 0)) {
                    minEdge = Math.min(minEdge, dist[i][j]);
                }
            }
            bound += minEdge;
        }
    }

    return bound;
}
```

---

# NP-HARD AND NP-COMPLETE

## Basic Concepts

```
COMPLEXITY CLASSES:

P (Polynomial):
  - Problems solvable in polynomial time
  - Examples: Sorting, Searching, Shortest Path

NP (Nondeterministic Polynomial):
  - Solutions verifiable in polynomial time
  - Examples: SAT, Traveling Salesman, Graph Coloring

NP-Complete:
  - Hardest problems in NP
  - If any NP-Complete solved in P → P = NP
  - Examples: SAT, 3-SAT, Vertex Cover, Hamiltonian Cycle

NP-Hard:
  - At least as hard as NP-Complete
  - May not be in NP (not verifiable in poly time)
  - Examples: Halting Problem, TSP Optimization

┌─────────────────────────────────────────┐
│                 NP-Hard                 │
│         ┌───────────────────┐           │
│         │   NP-Complete     │           │
│    ┌────┼──────┐            │           │
│    │ P  │      │    NP      │           │
│    │    │      │            │           │
│    └────┼──────┘            │           │
│         └───────────────────┘           │
└─────────────────────────────────────────┘
        (If P ≠ NP, which is believed)
```

## Cook's Theorem

```
COOK'S THEOREM (1971):
SAT (Boolean Satisfiability) is NP-Complete.

SIGNIFICANCE:
- First problem proven to be NP-Complete
- All other NP-Complete proofs reduce FROM SAT

SAT PROBLEM:
Given a Boolean formula, is there an assignment
of TRUE/FALSE to variables that makes it TRUE?

Example: (x₁ ∨ ¬x₂) ∧ (¬x₁ ∨ x₃) ∧ (x₂ ∨ x₃)
Solution: x₁=TRUE, x₂=FALSE, x₃=TRUE

3-SAT:
Each clause has exactly 3 literals.
Also NP-Complete.

PROVING NP-COMPLETENESS:
1. Show problem is in NP (solution verifiable in poly time)
2. Reduce known NP-Complete problem TO your problem
3. The reduction must be polynomial time
```

## Famous NP-Complete Problems

```
1. SATISFIABILITY (SAT)
   Input: Boolean formula
   Question: Is there a satisfying assignment?

2. VERTEX COVER
   Input: Graph G, integer k
   Question: Is there a set of ≤k vertices covering all edges?

3. CLIQUE
   Input: Graph G, integer k
   Question: Is there a complete subgraph of size k?

4. HAMILTONIAN CYCLE
   Input: Graph G
   Question: Is there a cycle visiting all vertices exactly once?

5. SUBSET SUM
   Input: Set of integers, target sum S
   Question: Is there a subset summing to S?

6. GRAPH COLORING
   Input: Graph G, integer k
   Question: Can vertices be colored with k colors (no adjacent same)?

REDUCTION CHAIN:
SAT → 3-SAT → CLIQUE → VERTEX COVER → HAMILTONIAN → TSP
```

---


---

> **Next**: [Part B: Advanced Patterns & Competitive Programming](06b_Advanced_Algorithms_Patterns.md)
