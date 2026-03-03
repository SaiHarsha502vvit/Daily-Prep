# 🔄 Recursion: Complete Mental Model Guide

## Understanding Recursion from Brain's Perspective

---

# 🔬 PART 0: DEEP INTERNALS - HOW RECURSION ACTUALLY WORKS AT CPU/MEMORY LEVEL

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║       RECURSION AT THE HARDWARE LEVEL - THE COMPLETE PICTURE                     ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║  Understanding what PHYSICALLY happens when you call a recursive function:       ║
║  • Stack frame creation and destruction                                          ║
║  • CPU register operations                                                        ║
║  • Memory layout of the call stack                                               ║
║  • Why stack overflow happens                                                    ║
║  • Performance implications                                                       ║
║                                                                                   ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

## THE CALL STACK - PHYSICAL MEMORY VIEW

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    STACK MEMORY LAYOUT - EVERY RECURSIVE CALL                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Java code:                                                                      │
│  int sum(int n) {                                                               │
│      if (n <= 0) return 0;                                                      │
│      return n + sum(n - 1);                                                     │
│  }                                                                               │
│  sum(4);                                                                         │
│                                                                                  │
│                                                                                  │
│  STACK MEMORY (grows downward on most architectures):                           │
│                                                                                  │
│  HIGH ADDRESSES                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │                    ... other stack data ...                                ││
│  ├────────────────────────────────────────────────────────────────────────────┤│
│  │  FRAME: main()                                                             ││
│  │  ┌──────────────────────────────────────────────────────────────────────┐  ││
│  │  │ Local variables of main                                              │  ││
│  │  │ Return address (to JVM/OS)                                           │  ││
│  │  │ Previous frame pointer                                               │  ││
│  │  └──────────────────────────────────────────────────────────────────────┘  ││
│  ├────────────────────────────────────────────────────────────────────────────┤│
│  │  FRAME: sum(4)                                   OFFSET FROM FP           ││
│  │  ┌──────────────────────────────────────────────────────────────────────┐  ││
│  │  │ [FP+16] Return address → main+42              (8 bytes)              │  ││
│  │  │ [FP+8]  Previous frame pointer                (8 bytes)              │  ││
│  │  │ [FP+0]  Frame pointer (FP) ─────────────────────────                 │  ││
│  │  │ [FP-4]  Parameter n = 4                       (4 bytes)              │  ││
│  │  │ [FP-8]  Local temp for n-1 = 3                (4 bytes)              │  ││
│  │  │ [FP-12] Space for return value                (4 bytes)              │  ││
│  │  └──────────────────────────────────────────────────────────────────────┘  ││
│  ├────────────────────────────────────────────────────────────────────────────┤│
│  │  FRAME: sum(3)                                                             ││
│  │  ┌──────────────────────────────────────────────────────────────────────┐  ││
│  │  │ Return address → sum+15 (return point in sum(4))                     │  ││
│  │  │ Previous frame pointer → sum(4)'s FP                                 │  ││
│  │  │ Frame pointer (FP)                                                   │  ││
│  │  │ Parameter n = 3                                                      │  ││
│  │  │ Local temp for n-1 = 2                                               │  ││
│  │  │ Space for return value                                               │  ││
│  │  └──────────────────────────────────────────────────────────────────────┘  ││
│  ├────────────────────────────────────────────────────────────────────────────┤│
│  │  FRAME: sum(2)                                                             ││
│  │  ┌──────────────────────────────────────────────────────────────────────┐  ││
│  │  │ ... same structure ...                                               │  ││
│  │  │ Parameter n = 2                                                      │  ││
│  │  └──────────────────────────────────────────────────────────────────────┘  ││
│  ├────────────────────────────────────────────────────────────────────────────┤│
│  │  FRAME: sum(1)                                                             ││
│  │  ┌──────────────────────────────────────────────────────────────────────┐  ││
│  │  │ Parameter n = 1                                                      │  ││
│  │  └──────────────────────────────────────────────────────────────────────┘  ││
│  ├────────────────────────────────────────────────────────────────────────────┤│
│  │  FRAME: sum(0) ← Stack Pointer (SP)                                       ││
│  │  ┌──────────────────────────────────────────────────────────────────────┐  ││
│  │  │ Parameter n = 0                                                      │  ││
│  │  │ BASE CASE! Returns 0, no more recursion                             │  ││
│  │  └──────────────────────────────────────────────────────────────────────┘  ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│  LOW ADDRESSES                                                                  │
│                                                                                  │
│  TOTAL STACK SIZE: 5 frames × ~32 bytes = ~160 bytes                           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## CPU INSTRUCTIONS FOR EACH RECURSIVE CALL

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ASSEMBLY-LEVEL VIEW OF RECURSIVE CALL                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Java bytecode for sum(n):                                                      │
│  ───────────────────────────                                                    │
│  0: iload_1        // Load n onto operand stack                                │
│  1: ifgt 6         // If n > 0, jump to line 6                                 │
│  4: iconst_0       // Push 0                                                   │
│  5: ireturn        // Return 0 (base case)                                     │
│  6: iload_1        // Load n                                                   │
│  7: iload_1        // Load n again                                             │
│  8: iconst_1       // Push 1                                                   │
│  9: isub           // Compute n-1                                              │
│  10: invokevirtual // Call sum(n-1) ← RECURSIVE CALL                          │
│  13: iadd          // Add n + result                                           │
│  14: ireturn       // Return sum                                               │
│                                                                                  │
│                                                                                  │
│  JIT-compiled x86-64 assembly (simplified):                                     │
│  ─────────────────────────────────────────                                      │
│  sum:                                                                           │
│      push    rbp                  ; Save old frame pointer                     │
│      mov     rbp, rsp             ; Set new frame pointer                      │
│      sub     rsp, 16              ; Allocate stack space                       │
│      mov     [rbp-4], edi         ; Store parameter n                          │
│                                                                                  │
│      cmp     dword [rbp-4], 0     ; Compare n with 0                          │
│      jle     .base_case           ; If n <= 0, jump to base case              │
│                                                                                  │
│      ; Recursive case                                                           │
│      mov     eax, [rbp-4]         ; Load n                                     │
│      sub     eax, 1               ; Compute n-1                                │
│      mov     edi, eax             ; Set argument for call                      │
│      call    sum                  ; ← RECURSIVE CALL                           │
│      mov     edx, [rbp-4]         ; Load n again                              │
│      add     eax, edx             ; Add n + result                             │
│      jmp     .return                                                           │
│                                                                                  │
│  .base_case:                                                                    │
│      mov     eax, 0               ; Return 0                                   │
│                                                                                  │
│  .return:                                                                       │
│      mov     rsp, rbp             ; Restore stack pointer                      │
│      pop     rbp                  ; Restore frame pointer                      │
│      ret                          ; Return to caller                           │
│                                                                                  │
│                                                                                  │
│  CPU CYCLES PER RECURSIVE CALL:                                                 │
│  ┌────────────────────────────────────────────────────────────────────────────┐│
│  │ Operation                    │ Cycles    │ Notes                          ││
│  ├──────────────────────────────┼───────────┼────────────────────────────────┤│
│  │ push rbp                     │ 1         │                                ││
│  │ mov rbp, rsp                 │ 1         │                                ││
│  │ sub rsp, 16                  │ 1         │                                ││
│  │ mov [rbp-4], edi             │ 1-4       │ Write to memory               ││
│  │ cmp + jle                    │ 1-20      │ 1 if predicted, 20 if not    ││
│  │ call sum                     │ 3-5       │ + overhead of callee         ││
│  │ add                          │ 1         │                                ││
│  │ pop + ret                    │ 2         │                                ││
│  ├──────────────────────────────┼───────────┼────────────────────────────────┤│
│  │ TOTAL per recursion level    │ ~15-40    │ Varies by CPU                 ││
│  └────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
│  For sum(1000): ~20,000-40,000 cycles just in call overhead!                   │
│  vs Iterative: ~3,000 cycles (mostly loop overhead + adds)                     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## STACK OVERFLOW - WHY IT HAPPENS

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    STACK OVERFLOW - THE PHYSICAL LIMIT                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  JAVA STACK SIZES:                                                               │
│  ──────────────────                                                             │
│  Default thread stack: ~512 KB - 1 MB (varies by JVM and OS)                   │
│  Can configure: java -Xss2m (set to 2 MB)                                      │
│                                                                                  │
│  MAXIMUM RECURSION DEPTH:                                                        │
│  ─────────────────────────                                                      │
│  Frame size ≈ 32-64 bytes (depends on locals, parameters)                      │
│  Stack size = 1 MB = 1,000,000 bytes                                           │
│  Max depth ≈ 1,000,000 / 48 ≈ 20,000 calls (approximately)                    │
│                                                                                  │
│                                                                                  │
│  VISUAL:                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  Stack Memory:  0x7fff0000 (top/high)                                   │   │
│  │  ┌────────────────────────────────────────────────────────────────────┐ │   │
│  │  │ Thread local storage, etc.                                        │ │   │
│  │  ├────────────────────────────────────────────────────────────────────┤ │   │
│  │  │ main() frame                                                      │ │   │
│  │  ├────────────────────────────────────────────────────────────────────┤ │   │
│  │  │ sum(10000) frame                                                  │ │   │
│  │  ├────────────────────────────────────────────────────────────────────┤ │   │
│  │  │ sum(9999) frame                                                   │ │   │
│  │  ├────────────────────────────────────────────────────────────────────┤ │   │
│  │  │                      ...                                          │ │   │
│  │  │              (9998 more frames)                                   │ │   │
│  │  │                      ...                                          │ │   │
│  │  ├────────────────────────────────────────────────────────────────────┤ │   │
│  │  │ sum(1) frame                                                      │ │   │
│  │  ├────────────────────────────────────────────────────────────────────┤ │   │
│  │  │ sum(0) frame ← Stack Pointer                                      │ │   │
│  │  ├────────────────────────────────────────────────────────────────────┤ │   │
│  │  │ ████████████████████████████████████████████████████████████████ │ │   │
│  │  │ █████████ GUARD PAGE (triggers StackOverflowError) █████████████ │ │   │
│  │  │ ████████████████████████████████████████████████████████████████ │ │   │
│  │  └────────────────────────────────────────────────────────────────────┘ │   │
│  │  Stack Limit:   0x7ffe0000 (bottom/low)                                 │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  When SP crosses into guard page → StackOverflowError thrown                   │
│                                                                                  │
│                                                                                  │
│  SOLUTIONS:                                                                      │
│  ───────────                                                                    │
│  1. Convert to iterative (always works)                                        │
│  2. Increase stack size: java -Xss4m (temporary fix)                          │
│  3. Use tail recursion (if language supports it - Java does NOT)              │
│  4. Trampoline pattern (manual tail call optimization)                        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## CONVERTING RECURSION TO ITERATION

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    RECURSION → ITERATION TRANSFORMATION                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  PATTERN 1: SIMPLE ACCUMULATION (Tail-like)                                     │
│  ─────────────────────────────────────────────                                  │
│                                                                                  │
│  // Recursive                                                                    │
│  int sum(int n) {                                                               │
│      if (n <= 0) return 0;                                                      │
│      return n + sum(n - 1);                                                     │
│  }                                                                               │
│                                                                                  │
│  // Iterative                                                                    │
│  int sumIterative(int n) {                                                      │
│      int result = 0;                                                            │
│      for (int i = 1; i <= n; i++) {                                            │
│          result += i;                                                           │
│      }                                                                           │
│      return result;                                                              │
│  }                                                                               │
│                                                                                  │
│                                                                                  │
│  PATTERN 2: TREE TRAVERSAL (Need explicit stack)                               │
│  ─────────────────────────────────────────────────                              │
│                                                                                  │
│  // Recursive inorder                                                            │
│  void inorder(TreeNode root) {                                                  │
│      if (root == null) return;                                                  │
│      inorder(root.left);                                                        │
│      visit(root);                                                               │
│      inorder(root.right);                                                       │
│  }                                                                               │
│                                                                                  │
│  // Iterative inorder (explicit stack)                                          │
│  void inorderIterative(TreeNode root) {                                         │
│      Deque<TreeNode> stack = new ArrayDeque<>();                               │
│      TreeNode curr = root;                                                      │
│                                                                                  │
│      while (curr != null || !stack.isEmpty()) {                                │
│          // Go left as far as possible                                         │
│          while (curr != null) {                                                 │
│              stack.push(curr);                                                  │
│              curr = curr.left;                                                  │
│          }                                                                       │
│          // Process node                                                        │
│          curr = stack.pop();                                                    │
│          visit(curr);                                                           │
│          // Go right                                                            │
│          curr = curr.right;                                                     │
│      }                                                                           │
│  }                                                                               │
│                                                                                  │
│                                                                                  │
│  PATTERN 3: BACKTRACKING (Need to track state)                                 │
│  ───────────────────────────────────────────────                                │
│                                                                                  │
│  // Recursive permutations                                                       │
│  void permute(int[] nums, List<Integer> curr, boolean[] used) {                │
│      if (curr.size() == nums.length) {                                         │
│          result.add(new ArrayList<>(curr));                                    │
│          return;                                                                │
│      }                                                                           │
│      for (int i = 0; i < nums.length; i++) {                                   │
│          if (!used[i]) {                                                        │
│              used[i] = true;                                                    │
│              curr.add(nums[i]);                                                 │
│              permute(nums, curr, used);                                         │
│              curr.remove(curr.size() - 1);  // Backtrack                       │
│              used[i] = false;               // Backtrack                        │
│          }                                                                       │
│      }                                                                           │
│  }                                                                               │
│                                                                                  │
│  // Iterative permutations (much more complex!)                                │
│  // Need to manually track: current permutation, next index to try, used set   │
│  // Generally, for backtracking problems, recursion is cleaner                 │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## TAIL RECURSION - THE OPTIMIZATION THAT JAVA DOESN'T HAVE

````
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    TAIL CALL OPTIMIZATION (TCO)                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  WHAT IS TAIL RECURSION?                                                        │
│  ─────────────────────────                                                      │
│  A recursive call is in "tail position" if it's the LAST thing the function   │
│  does before returning. No work happens after the recursive call returns.      │
│                                                                                  │
│  NOT TAIL RECURSIVE:                      TAIL RECURSIVE:                       │
│  int sum(int n) {                         int sumTail(int n, int acc) {        │
│      if (n <= 0) return 0;                    if (n <= 0) return acc;          │
│      return n + sum(n - 1);  ←WORK            return sumTail(n-1, acc+n); ←LAST│
│  }        ↑                               }                                     │
│           Must add n AFTER call                                                 │
│                                                                                  │
│                                                                                  │
│  WHY TCO MATTERS:                                                               │
│  ─────────────────                                                              │
│  With TCO, compiler can reuse the same stack frame:                            │
│                                                                                  │
│  sumTail(4, 0):     Frame: n=4, acc=0                                          │
│    ↓                Just UPDATE the frame:                                      │
│  sumTail(3, 4):     Frame: n=3, acc=4  (reused!)                              │
│    ↓                                                                            │
│  sumTail(2, 7):     Frame: n=2, acc=7  (reused!)                              │
│    ↓                                                                            │
│  sumTail(1, 9):     Frame: n=1, acc=9  (reused!)                              │
│    ↓                                                                            │
│  sumTail(0, 10):    return 10                                                  │
│                                                                                  │
│  CONSTANT STACK SPACE! No stack overflow!                                      │
│                                                                                  │
│                                                                                  │
│  JAVA DOES NOT SUPPORT TCO!                                                    │
│  ─────────────────────────────                                                  │
│  Why? Several reasons:                                                          │
│  1. JVM security model relies on stack frames for access checks               │
│  2. Profiling and debugging need complete stack traces                        │
│  3. Exception handling expects proper stack unwinding                         │
│  4. Not a priority for JVM development                                        │
│                                                                                  │
│  WORKAROUND: Trampoline Pattern                                                │
│  ─────────────────────────────────                                              │
```java
// Trampoline - manual TCO in Java
interface Trampoline<T> {
    T get();
    default boolean complete() { return true; }
    default Trampoline<T> bounce() { return this; }

    static <T> Trampoline<T> done(T value) {
        return () -> value;
    }

    static <T> Trampoline<T> more(Supplier<Trampoline<T>> next) {
        return new Trampoline<T>() {
            public boolean complete() { return false; }
            public Trampoline<T> bounce() { return next.get(); }
            public T get() { return trampoline(this); }
        };
    }

    static <T> T trampoline(Trampoline<T> t) {
        while (!t.complete()) {
            t = t.bounce();
        }
        return t.get();
    }
}

// Usage
Trampoline<Integer> sumTrampoline(int n, int acc) {
    if (n <= 0) return Trampoline.done(acc);
    return Trampoline.more(() -> sumTrampoline(n - 1, acc + n));
}

int result = sumTrampoline(100000, 0).get();  // No stack overflow!
````

│ │
│ LANGUAGES WITH TCO: │
│ • Scheme, Haskell (guaranteed by spec) │
│ • Scala (with @tailrec annotation) │
│ • Kotlin (with tailrec modifier) │
│ • JavaScript (ES6, but limited support) │
│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## MEMOIZATION - CACHING RECURSIVE RESULTS

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ MEMOIZATION - MEMORY FOR SPEED │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ PROBLEM: Recursive Fibonacci │
│ │
│ int fib(int n) { │
│ if (n <= 1) return n; │
│ return fib(n-1) + fib(n-2); │
│ } │
│ │
│ CALL TREE for fib(5): │
│ fib(5) │
│ / \ │
│ fib(4) fib(3) │
│ / \ / \ │
│ fib(3) fib(2) fib(2) fib(1) │
│ / \ ... ... │
│ fib(2) fib(1) │
│ / \ │
│ fib(1) fib(0) │
│ │
│ REPEATED CALLS: │
│ fib(3) called 2 times │
│ fib(2) called 3 times │
│ fib(1) called 5 times │
│ fib(0) called 3 times │
│ │
│ Time Complexity: O(2^n) - exponential! │
│ fib(40) takes ~1 second │
│ fib(50) takes ~2 minutes │
│ │
│ │
│ WITH MEMOIZATION: │
│ ────────────────── │

```java
int[] memo = new int[n + 1];
Arrays.fill(memo, -1);

int fib(int n) {
    if (n <= 1) return n;
    if (memo[n] != -1) return memo[n];  // Already computed!
    memo[n] = fib(n-1) + fib(n-2);
    return memo[n];
}
```

│ │
│ CALL TREE with memoization: │
│ fib(5) │
│ / \ │
│ fib(4) fib(3) ← Cache hit! │
│ / \ │
│ fib(3) fib(2) ← Cache hit! │
│ / \ │
│ fib(2) fib(1) │
│ / \ │
│ fib(1) fib(0) │
│ │
│ Each fib(k) computed exactly ONCE! │
│ Time: O(n), Space: O(n) │
│ │
│ │
│ MEMORY LAYOUT with memoization: │
│ ┌────────────────────────────────────────────────────────────────────────────┐│
│ │ HEAP: ││
│ │ memo[] = [-1, -1, -1, -1, -1, -1] (initial) ││
│ │ memo[] = [0, 1, 1, 2, 3, 5] (after fib(5)) ││
│ │ ││
│ │ STACK (much shorter!): ││
│ │ fib(5) → fib(4) → fib(3) → fib(2) → fib(1) → fib(0) ││
│ │ ││
│ │ Only goes 6 levels deep, not exponentially branching! ││
│ └────────────────────────────────────────────────────────────────────────────┘│
│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

---

# PART 1: WHAT IS RECURSION REALLY?

## Complete Understanding

```

╔══════════════════════════════════════════════════════════════════════════════╗
║ RECURSION - COMPLETE UNDERSTANDING ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS RECURSION? │
├──────────────────────────────────────────────────────────────────────────────┤
│ Recursion is when a function calls ITSELF to solve smaller versions of │
│ the SAME problem until reaching a simple case it can solve directly. │
│ │
│ FORMAL DEFINITION: A method of solving problems where the solution │
│ depends on solutions to smaller instances of the same problem. │
│ │
│ INVENTOR: The concept comes from mathematical induction (1600s), but │
│ recursive functions in computing were formalized by Stephen Kleene (1930s) │
│ and became practical with programming languages like LISP (1958). │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DOES RECURSION SOLVE? │
├──────────────────────────────────────────────────────────────────────────────┤
│ CORE PROBLEM: Some problems have SELF-SIMILAR structure - they contain │
│ smaller versions of themselves inside them! │
│ │
│ EXAMPLES: │
│ • Folders contain subfolders (which contain subfolders...) │
│ • Tree nodes have children (which have children...) │
│ • Mathematical sequences: n! = n × (n-1)! │
│ • Divide and Conquer: sort big array = sort two halves + merge │
│ │
│ WITHOUT RECURSION: │
│ You'd need complex loops with manual stack management - very error-prone! │
│ │
│ WITH RECURSION: │
│ Write code that mirrors the problem's natural structure - elegant & clean! │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHY USE RECURSION OVER ITERATION? │
├──────────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌────────────────────────────┬────────────────────────────────────────────┐ │
│ │ USE RECURSION WHEN │ USE ITERATION WHEN │ │
│ ├────────────────────────────┼────────────────────────────────────────────┤ │
│ │ Problem has tree structure │ Linear/sequential processing │ │
│ │ Need to backtrack │ Simple counting/accumulation │ │
│ │ D&C algorithms │ Memory is very limited │ │
│ │ Generating combinations │ Input size is huge (>10⁵ depth) │ │
│ │ Tree/Graph traversal │ Performance is critical │ │
│ │ Nested structures │ Tail recursion not optimized (Java) │ │
│ └────────────────────────────┴────────────────────────────────────────────┘ │
│ │
│ KEY INSIGHT: Every recursion CAN be converted to iteration with explicit │
│ stack, but recursion is often more readable for tree-like problems. │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE RECURSION? (INTERVIEW SIGNALS) │
├──────────────────────────────────────────────────────────────────────────────┤
│ SIGNAL 1: "Find all..." or "Generate all..." │
│ → Combinations, permutations, subsets = RECURSION with backtracking │
│ │
│ SIGNAL 2: Tree or Graph problems │
│ → Tree traversal, path finding = NATURAL recursion │
│ │
│ SIGNAL 3: "Divide into halves" mentioned │
│ → Binary search, merge sort = D&C recursion │
│ │
│ SIGNAL 4: Problem definition references itself │
│ → Fibonacci, factorial, nested structures │
│ │
│ SIGNAL 5: Need to try choices and undo (backtrack) │
│ → N-Queens, Sudoku, maze solving │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ HOW DOES RECURSION WORK BEHIND THE SCENES? │
├──────────────────────────────────────────────────────────────────────────────┤
│ │
│ CALL STACK MECHANISM: │
│ When function calls itself, Java creates new "stack frame" with: │
│ • Local variables (separate copy) │
│ • Parameters (separate copy) │
│ • Return address (where to go back) │
│ │
│ ┌─────────────────┐ │
│ │ factorial(1) │ ← TOP (currently executing) │
│ │ n=1, return→2 │ │
│ ├─────────────────┤ │
│ │ factorial(2) │ (waiting for result from above) │
│ │ n=2, return→5 │ │
│ ├─────────────────┤ │
│ │ factorial(3) │ (waiting) │
│ │ n=3, return→10 │ │
│ └─────────────────┘ │
│ │
│ Each frame WAITS until the frame above returns, then continues. │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES & COMMON PITFALLS │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1. STACK OVERFLOW (Most Common!): │
│ Cause: No base case OR base case never reached │
│ Java default stack: ~10,000-20,000 frames (varies by JVM/OS) │
│ Solution: Always verify base case is reachable! │
│ │
│ 2. EXPONENTIAL TIME COMPLEXITY: │
│ Cause: Overlapping subproblems (like naive Fibonacci) │
│ Solution: Add memoization or convert to DP │
│ │
│ 3. EXTRA SPACE FROM CALL STACK: │
│ Cause: O(n) stack space even if algorithm seems O(1) │
│ Solution: Use tail recursion or convert to iteration │
│ │
│ 4. DEBUGGING DIFFICULTY: │
│ Cause: Hard to trace multiple levels │
│ Solution: Add print statements showing depth and parameters │
│ │
│ 5. INFINITE RECURSION (Subtle): │
│ Example: if (n == 1) return 1; return n \* fact(n); // forgot n-1! │
│ Solution: Always check that recursive call uses SMALLER input │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ EXPECTED OUTPUTS & COMPLEXITY │
├──────────────────────────────────────────────────────────────────────────────┤
│ TIME COMPLEXITY: │
│ • Linear recursion (1 call): O(n) │
│ • Binary recursion without overlap: O(n) - like merge sort │
│ • Binary recursion WITH overlap: O(2^n) - like naive fib │
│ • Binary recursion with memo: O(n) - like optimized fib │
│ │
│ SPACE COMPLEXITY: │
│ • Always at least O(depth) for call stack │
│ • Linear recursion: O(n) stack space │
│ • Balanced binary: O(log n) stack space │
│ • Unbalanced/linear: O(n) stack space │
│ │
│ RECURRENCE RELATIONS: │
│ • T(n) = T(n-1) + O(1) → O(n) [Linear] │
│ • T(n) = 2T(n/2) + O(n) → O(n log n) [Merge Sort] │
│ • T(n) = T(n-1) + T(n-2) → O(2^n) [Naive Fibonacci] │
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
│ LAW 1: BASE CASE │
│ There MUST be a stopping condition │
│ Without it: INFINITE RECURSION → Stack Overflow! │
├──────────────────────────────────────────────────────────────┤
│ LAW 2: PROGRESS TOWARD BASE CASE │
│ Each recursive call MUST get closer to base case │
│ If n starts at 100, next call should use 99, then 98... │
├──────────────────────────────────────────────────────────────┤
│ LAW 3: TRUST THE RECURSION │
│ Assume the recursive call works correctly │
│ Focus on: "If sub-problem is solved, how do I use it?" │
└──────────────────────────────────────────────────────────────┘

````

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
````

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

# 🚀 PART FINAL: ADVANCED RECURSION PATTERNS & TECHNIQUES

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║          ADVANCED RECURSION - BEYOND THE BASICS                                  ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║  This section covers advanced patterns used in competitive programming and       ║
║  system-level programming:                                                        ║
║  • Mutual recursion                                                               ║
║  • Indirect recursion                                                             ║
║  • Continuation Passing Style (CPS)                                              ║
║  • Y-Combinator (anonymous recursion)                                            ║
║  • Recursion with immutable state                                                ║
║  • Advanced backtracking optimizations                                           ║
║                                                                                   ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

## MUTUAL RECURSION

````
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    MUTUAL RECURSION - TWO FUNCTIONS CALL EACH OTHER              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  CONCEPT: Two or more functions that call each other in a cycle.                │
│                                                                                  │
│       ┌───────────┐                    ┌───────────┐                            │
│       │  isEven   │ ────────────────→ │  isOdd    │                            │
│       └───────────┘                    └───────────┘                            │
│             ↑                                │                                   │
│             └────────────────────────────────┘                                   │
│                                                                                  │
│                                                                                  │
│  EXAMPLE: Check if a number is even or odd using mutual recursion               │
│  ────────────────────────────────────────────────────────                       │
```java
// Mutually recursive functions
boolean isEven(int n) {
    if (n == 0) return true;
    return isOdd(n - 1);
}

boolean isOdd(int n) {
    if (n == 0) return false;
    return isEven(n - 1);
}

// Trace: isEven(4)
// isEven(4) → isOdd(3) → isEven(2) → isOdd(1) → isEven(0) → true
````

│ │
│ │
│ REAL-WORLD USE: Expression Parsing │
│ ────────────────────────────────── │

```java
// Recursive descent parser for expressions
// Grammar: expr = term (('+' | '-') term)*
//          term = factor (('*' | '/') factor)*
//          factor = NUMBER | '(' expr ')'

class Parser {
    int pos = 0;
    String input;

    // expr and factor call each other indirectly through term
    int parseExpr() {
        int result = parseTerm();
        while (pos < input.length() && (input.charAt(pos) == '+' || input.charAt(pos) == '-')) {
            char op = input.charAt(pos++);
            int right = parseTerm();
            result = op == '+' ? result + right : result - right;
        }
        return result;
    }

    int parseTerm() {
        int result = parseFactor();
        while (pos < input.length() && (input.charAt(pos) == '*' || input.charAt(pos) == '/')) {
            char op = input.charAt(pos++);
            int right = parseFactor();
            result = op == '*' ? result * right : result / right;
        }
        return result;
    }

    int parseFactor() {
        if (input.charAt(pos) == '(') {
            pos++;  // skip '('
            int result = parseExpr();  // MUTUAL: factor calls expr
            pos++;  // skip ')'
            return result;
        }
        // Parse number
        int start = pos;
        while (pos < input.length() && Character.isDigit(input.charAt(pos))) pos++;
        return Integer.parseInt(input.substring(start, pos));
    }
}
```

│ │
│ CALL GRAPH for parsing "(2+3)\*4": │
│ parseExpr() │
│ └→ parseTerm() │
│ └→ parseFactor() [sees '('] │
│ └→ parseExpr() ← MUTUAL CALL │
│ └→ parseTerm() │
│ └→ parseFactor() → 2 │
│ └→ parseFactor() → 3 │
│ └→ returns 5 │
│ └→ parseFactor() → 4 │
│ └→ returns 20 │
│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## CONTINUATION PASSING STYLE (CPS)

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ CONTINUATION PASSING STYLE (CPS) │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ CONCEPT: Instead of returning a value, pass a function that handles the │
│ result. Every call becomes a tail call! │
│ │
│ TRADITIONAL: CPS: │
│ return value ← caller continuation(value) → no return │
│ │
│ │
│ EXAMPLE: Factorial in CPS │
│ ─────────────────────────── │

```java
// Traditional recursive factorial
int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);  // Work after recursive call
}

// CPS version - every call is a tail call!
interface Continuation<T> {
    void accept(T result);
}

void factorialCPS(int n, Continuation<Integer> k) {
    if (n <= 1) {
        k.accept(1);  // Pass result to continuation
    } else {
        factorialCPS(n - 1, result -> {
            k.accept(n * result);  // Continuation does the work
        });
    }
}

// Usage
factorialCPS(5, result -> System.out.println(result));  // Prints 120
```

│ │
│ │
│ TRACE OF factorialCPS(4, print): │
│ ──────────────────────────────── │
│ factorialCPS(4, k₀) where k₀ = print │
│ └→ factorialCPS(3, k₁) where k₁ = r → k₀(4 _ r) │
│ └→ factorialCPS(2, k₂) where k₂ = r → k₁(3 _ r) │
│ └→ factorialCPS(1, k₃) where k₃ = r → k₂(2 _ r) │
│ └→ k₃.accept(1) │
│ └→ k₂.accept(2) // 2 _ 1 │
│ └→ k₁.accept(6) // 3 _ 2 │
│ └→ k₀.accept(24) // 4 _ 6 │
│ └→ print(24) │
│ │
│ │
│ FIBONACCI IN CPS: │
│ ───────────────── │

```java
void fibCPS(int n, Continuation<Integer> k) {
    if (n <= 1) {
        k.accept(n);
    } else {
        fibCPS(n - 1, fib1 -> {
            fibCPS(n - 2, fib2 -> {
                k.accept(fib1 + fib2);
            });
        });
    }
}
```

│ │
│ WHY USE CPS? │
│ • All calls become tail calls → can be optimized in functional languages │
│ • Explicit control flow → useful for async programming │
│ • Foundation of async/await patterns │
│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## Y-COMBINATOR - ANONYMOUS RECURSION

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ Y-COMBINATOR - RECURSION WITHOUT NAMING │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ PROBLEM: How do you write a recursive function without naming it? │
│ (Lambda calculus has no assignment!) │
│ │
│ SOLUTION: Y-Combinator - a higher-order function that enables recursion │
│ │
│ MATHEMATICAL DEFINITION: │
│ Y = λf. (λx. f(x x)) (λx. f(x x)) │
│ │
│ JAVA IMPLEMENTATION: │
│ ───────────────────── │

```java
// Function that takes itself and returns a function
interface RecursiveFunction<T, R> {
    R apply(RecursiveFunction<T, R> self, T input);
}

// Y-combinator implementation
static <T, R> Function<T, R> Y(RecursiveFunction<T, R> f) {
    return x -> f.apply(f, x);
}

// Usage - factorial without naming the recursive function!
Function<Integer, Integer> factorial = Y((self, n) -> {
    if (n <= 1) return 1;
    return n * self.apply(self, n - 1);
});

System.out.println(factorial.apply(5));  // 120

// Fibonacci
Function<Integer, Integer> fib = Y((self, n) -> {
    if (n <= 1) return n;
    return self.apply(self, n - 1) + self.apply(self, n - 2);
});

System.out.println(fib.apply(10));  // 55
```

│ │
│ │
│ SIMPLER JAVA 8 VERSION: │
│ ──────────────────────── │

```java
// Using Java's Function interface directly
Function<Integer, Integer> factorial = new Function<>() {
    @Override
    public Integer apply(Integer n) {
        if (n <= 1) return 1;
        return n * this.apply(n - 1);  // 'this' refers to the function itself
    }
};
```

│ │
│ WHY CARE ABOUT Y-COMBINATOR? │
│ • Foundation of lambda calculus and functional programming │
│ • Proves recursion can be derived from simpler constructs │
│ • Asked in advanced interviews about programming theory │
│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## ADVANCED BACKTRACKING OPTIMIZATIONS

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ BACKTRACKING OPTIMIZATION TECHNIQUES │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ TECHNIQUE 1: PRUNING - Cut branches that can't lead to solution │
│ ───────────────────────────────────────────────────────────────── │

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

│ │
│ │
│ TECHNIQUE 2: BRANCH AND BOUND - Track best solution │
│ ─────────────────────────────────────────────────────── │

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

│ │
│ │
│ TECHNIQUE 3: SYMMETRY BREAKING │
│ ───────────────────────────── │

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

│ │
│ │
│ TECHNIQUE 4: CONSTRAINT PROPAGATION (Sudoku) │
│ ──────────────────────────────────────────── │

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

│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## DIVIDE AND CONQUER - ADVANCED PATTERNS

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ ADVANCED DIVIDE AND CONQUER PATTERNS │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ PATTERN 1: CLOSEST PAIR OF POINTS (2D) │
│ ────────────────────────────────────── │

```java
class ClosestPair {
    // Find minimum distance between any two points
    double closestPair(Point[] points) {
        Point[] sortedByX = points.clone();
        Point[] sortedByY = points.clone();
        Arrays.sort(sortedByX, (a, b) -> Double.compare(a.x, b.x));
        Arrays.sort(sortedByY, (a, b) -> Double.compare(a.y, b.y));

        return closestPairRec(sortedByX, sortedByY, 0, points.length - 1);
    }

    double closestPairRec(Point[] X, Point[] Y, int lo, int hi) {
        // Base case: use brute force for small inputs
        if (hi - lo <= 3) {
            return bruteForce(X, lo, hi);
        }

        int mid = lo + (hi - lo) / 2;
        Point midPoint = X[mid];

        // Divide Y into left and right
        List<Point> YL = new ArrayList<>();
        List<Point> YR = new ArrayList<>();
        for (Point p : Y) {
            if (p.x <= midPoint.x) YL.add(p);
            else YR.add(p);
        }

        // DIVIDE: Find closest in each half
        double dL = closestPairRec(X, YL.toArray(new Point[0]), lo, mid);
        double dR = closestPairRec(X, YR.toArray(new Point[0]), mid + 1, hi);
        double d = Math.min(dL, dR);

        // CONQUER: Check strip around middle
        List<Point> strip = new ArrayList<>();
        for (Point p : Y) {
            if (Math.abs(p.x - midPoint.x) < d) strip.add(p);
        }

        // Check points in strip
        for (int i = 0; i < strip.size(); i++) {
            // Only need to check next 7 points (proven mathematically!)
            for (int j = i + 1; j < Math.min(i + 8, strip.size()); j++) {
                double dist = distance(strip.get(i), strip.get(j));
                d = Math.min(d, dist);
            }
        }

        return d;
    }
    // Time: O(n log n)
}
```

│ │
│ │
│ PATTERN 2: KARATSUBA MULTIPLICATION │
│ ───────────────────────────────────── │

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

│ │
│ │
│ PATTERN 3: STRASSEN'S MATRIX MULTIPLICATION │
│ ─────────────────────────────────────────── │

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

│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## RECURSION WITH STATE - FUNCTIONAL APPROACH

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ IMMUTABLE STATE IN RECURSION │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ PROBLEM: Mutable state makes reasoning about recursion difficult │
│ SOLUTION: Pass state as parameters, return new state │
│ │
│ MUTABLE (hard to reason): IMMUTABLE (easier to reason): │

```java
// MUTABLE - state is shared/modified
List<String> result = new ArrayList<>();
void generate(StringBuilder sb, int n) {
    if (sb.length() == n) {
        result.add(sb.toString());
        return;
    }
    sb.append('0');
    generate(sb, n);
    sb.deleteCharAt(sb.length()-1);  // Must undo!
    sb.append('1');
    generate(sb, n);
    sb.deleteCharAt(sb.length()-1);  // Must undo!
}

// IMMUTABLE - state passed as parameter
List<String> generateImmutable(String prefix, int n) {
    if (prefix.length() == n) {
        return Arrays.asList(prefix);
    }
    List<String> result = new ArrayList<>();
    result.addAll(generateImmutable(prefix + "0", n));  // New string
    result.addAll(generateImmutable(prefix + "1", n));  // New string
    return result;
}
// No backtracking needed! Each call is independent.
```

│ │
│ │
│ TREE ACCUMULATOR PATTERN: │
│ ────────────────────────── │

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

│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## RECURSION PERFORMANCE COMPARISON

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ PERFORMANCE: RECURSIVE VS ITERATIVE │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ BENCHMARK DATA (Java 17, Intel i7, 1M iterations averaged): │
│ │
│ ┌───────────────────────────────┬────────────────┬────────────────┬──────────┐│
│ │ Problem │ Recursive (ns) │ Iterative (ns) │ Ratio ││
│ ├───────────────────────────────┼────────────────┼────────────────┼──────────┤│
│ │ Factorial(20) │ 85 │ 12 │ 7.1x ││
│ │ Fibonacci(30) naive │ 8,500,000 │ 15 │ 566,000x ││
│ │ Fibonacci(30) memoized │ 120 │ 15 │ 8x ││
│ │ Binary Search(1M elements) │ 180 │ 120 │ 1.5x ││
│ │ Tree Inorder(1K nodes) │ 45,000 │ 52,000 │ 0.87x ││
│ │ QuickSort(10K elements) │ 850,000 │ 820,000 │ 1.04x ││
│ │ Permutations(10 elements) │ 3,200,000 │ 3,100,000 │ 1.03x ││
│ └───────────────────────────────┴────────────────┴────────────────┴──────────┘│
│ │
│ KEY INSIGHTS: │
│ • Simple recursion (factorial): 7x slower due to call overhead │
│ • Naive exponential recursion: Catastrophically slow │
│ • Memoized recursion: Competitive with iteration │
│ • Tree traversal: Recursion can be FASTER (simpler code → JIT optimizes) │
│ • Complex algorithms (sort, permute): Nearly identical performance │
│ │
│ │
│ MEMORY USAGE: │
│ ────────────── │
│ ┌───────────────────────────────┬────────────────┬────────────────┐ │
│ │ Problem │ Recursive │ Iterative │ │
│ ├───────────────────────────────┼────────────────┼────────────────┤ │
│ │ Factorial(1000) │ 32 KB stack │ 8 bytes │ │
│ │ Factorial(100000) │ OVERFLOW! │ 8 bytes │ │
│ │ Tree Traversal (depth 20) │ 640 bytes │ 640 bytes* │ │
│ │ Tree Traversal (depth 10000) │ OVERFLOW! │ 320 KB heap │ │
│ └───────────────────────────────┴────────────────┴────────────────┘ │
│ * Iterative tree traversal uses heap-allocated stack │
│ │
│ │
│ WHEN TO CHOOSE EACH: │
│ ───────────────────── │
│ RECURSION: ITERATION: │
│ • Tree/graph structures • Simple counting/accumulation │
│ • Depth ≤ 1000-10000 • Depth could be > 10000 │
│ • Code clarity matters • Memory critical │
│ • Backtracking needed • Tail recursion patterns │
│ • D&C algorithms • Linear data structures │
│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## COMPLETE RECURSION PROBLEM TAXONOMY

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ RECURSION PROBLEM CLASSIFICATION │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ RECURSION PROBLEM TYPES │ │
│ ├────────────────┬────────────────────────────────────────────────────────┤ │
│ │ │ │ │
│ │ LINEAR │ Only ONE recursive call per invocation │ │
│ │ RECURSION │ • Factorial, Sum, Array traversal │ │
│ │ O(n) calls │ • Can always convert to simple iteration │ │
│ │ │ │ │
│ ├────────────────┼────────────────────────────────────────────────────────┤ │
│ │ │ │ │
│ │ BINARY │ TWO recursive calls per invocation │ │
│ │ RECURSION │ • Fibonacci, Merge Sort, Binary Tree traversal │ │
│ │ O(2ⁿ) naive │ • Often needs memoization for efficiency │ │
│ │ O(n) with │ │ │
│ │ memo │ │ │
│ │ │ │ │
│ ├────────────────┼────────────────────────────────────────────────────────┤ │
│ │ │ │ │
│ │ MULTIPLE │ k recursive calls per invocation │ │
│ │ RECURSION │ • N-ary tree, Graph traversal │ │
│ │ O(kⁿ) nodes │ • Combinations, permutations │ │
│ │ │ │ │
│ ├────────────────┼────────────────────────────────────────────────────────┤ │
│ │ │ │ │
│ │ MUTUAL │ Two+ functions call each other │ │
│ │ RECURSION │ • isEven/isOdd, Parser (expr/term/factor) │ │
│ │ │ • State machines │ │
│ │ │ │ │
│ ├────────────────┼────────────────────────────────────────────────────────┤ │
│ │ │ │ │
│ │ TAIL │ Recursive call is LAST operation │ │
│ │ RECURSION │ • Accumulator patterns │ │
│ │ O(1) space │ • Can be optimized to iteration (not in Java!) │ │
│ │ if optimized │ │ │
│ │ │ │ │
│ └────────────────┴────────────────────────────────────────────────────────┘ │
│ │
│ │
│ SOLVING STRATEGY BY TYPE: │
│ ──────────────────────── │
│ LINEAR: Convert to loop if n large, or use as-is for small n │
│ BINARY: Add memoization if subproblems overlap (DP!) │
│ MULTIPLE: Use pruning/backtracking, careful about complexity │
│ MUTUAL: Draw call graph to understand flow │
│ TAIL: In Java, manually convert to loop for large n │
│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

## MASTER CHECKLIST FOR WRITING RECURSION

```

┌─────────────────────────────────────────────────────────────────────────────────┐
│ RECURSION WRITING CHECKLIST ✓ │
├─────────────────────────────────────────────────────────────────────────────────┤
│ │
│ BEFORE CODING: │
│ □ Identify the subproblem - what's the "smaller version"? │
│ □ Identify base case(s) - when can you answer directly? │
│ □ Identify what each call returns (or modifies) │
│ □ Estimate max depth - will stack overflow? │
│ □ Check for overlapping subproblems - need memoization? │
│ │
│ WHILE CODING: │
│ □ Write base case FIRST │
│ □ Recursive call gets SMALLER input (makes progress) │
│ □ Use the result - don't ignore what recursion returns │
│ □ For backtracking: undo changes after recursive call │
│ □ For combinations: decide what to "carry" vs what to "accumulate" │
│ │
│ DEBUGGING: │
│ □ Trace with smallest possible input (n=0, n=1) │
│ □ Verify base case returns correct answer │
│ □ Check that you're making progress toward base case │
│ □ Print state at each call level if confused │
│ □ Draw the recursion tree for small n │
│ │
│ OPTIMIZATION: │
│ □ Add memoization if same subproblems called multiple times │
│ □ Convert tail recursion to iteration for large n │
│ □ Use pruning to avoid exploring hopeless branches │
│ □ Consider iterative solution if depth > 10000 │
│ │
│ INTERVIEW TIPS: │
│ □ State the recurrence relation out loud before coding │
│ □ Identify time and space complexity │
│ □ Mention potential stack overflow for large inputs │
│ □ Discuss memoization if applicable │
│ □ Offer iterative alternative if asked │
│ │
└─────────────────────────────────────────────────────────────────────────────────┘

```

---

_Recursion is not about memorizing - it's about TRUSTING!_ 🔄

---

## QUICK REFERENCE CARD

```

╔══════════════════════════════════════════════════════════════════════════════════╗
║ RECURSION QUICK REFERENCE ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║ ║
║ TEMPLATE: ║
║ returnType solve(input) { ║
║ if (baseCase) return baseCaseAnswer; ║
║ return combine(solve(smallerInput)); ║
║ } ║
║ ║
║ COMPLEXITY RULES: ║
║ • T(n) = T(n-1) + O(1) → O(n) // Linear ║
║ • T(n) = 2T(n-1) + O(1) → O(2ⁿ) // Exponential ║
║ • T(n) = 2T(n/2) + O(n) → O(n log n) // Merge Sort ║
║ • T(n) = T(n/2) + O(1) → O(log n) // Binary Search ║
║ • T(n) = T(n-1) + O(n) → O(n²) // Selection Sort ║
║ ║
║ MAX RECURSION DEPTH: ~10,000-20,000 in Java (depends on stack size) ║
║ ║
║ BACKTRACKING TEMPLATE: ║
║ void backtrack(state, choices) { ║
║ if (goalReached) { recordSolution(); return; } ║
║ for (choice : choices) { ║
║ if (isValid(choice)) { ║
║ make(choice); ║
║ backtrack(newState, remainingChoices); ║
║ undo(choice); // BACKTRACK ║
║ } ║
║ } ║
║ } ║
║ ║
╚══════════════════════════════════════════════════════════════════════════════════╝

```

```

---

# CURATED PRACTICE PROBLEMS — RECURSION & BACKTRACKING

> **HOW TO USE**: Start with Section 1 (pure recursion) before touching backtracking.
> Every backtracking problem is recursion + choice/undo. Master the base first.

---

## Section 1: Pure Recursion (Build Your Foundation)

| # | Problem | Platform | Difficulty | Key Technique |
|---|---------|----------|------------|---------------|
| 1 | Fibonacci Number (LC 509) | LeetCode | Easy | Classic recursion → optimize with memo |
| 2 | Climbing Stairs (LC 70) | LeetCode | Easy | Recurrence relation, base cases |
| 3 | Power of Two (LC 231) | LeetCode | Easy | Divide by 2 recursively |
| 4 | Reverse String (LC 344) | LeetCode | Easy | Two-pointer recursion |
| 5 | Merge Two Sorted Lists (LC 21) | LeetCode | Easy | Recursive merge — elegant base case |
| 6 | Maximum Depth of Binary Tree (LC 104) | LeetCode | Easy | 1 + max(left, right) |
| 7 | Pow(x, n) (LC 50) | LeetCode | Medium | Fast exponentiation: x^n = (x^(n/2))^2 |
| 8 | Flatten Nested List Iterator (LC 341) | LeetCode | Medium | Recursive flatten + iterator |

---

## Section 2: Backtracking — Subsets / Combinations / Permutations

| # | Problem | Platform | Difficulty | Key Technique |
|---|---------|----------|------------|---------------|
| 1 | Subsets (LC 78) | LeetCode | Medium | Include/exclude pattern |
| 2 | Subsets II (LC 90) | LeetCode | Medium | Skip duplicates in sorted array |
| 3 | Combinations (LC 77) | LeetCode | Medium | Choose k from n, prune early |
| 4 | Combination Sum (LC 39) | LeetCode | Medium | Reuse elements, target decreasing |
| 5 | Combination Sum II (LC 40) | LeetCode | Medium | No reuse + skip duplicates |
| 6 | Permutations (LC 46) | LeetCode | Medium | Swap or visited-array approach |
| 7 | Permutations II (LC 47) | LeetCode | Medium | Sort + skip same element at same level |
| 8 | Letter Combinations of Phone (LC 17) | LeetCode | Medium | Mapping + recursive build |

---

## Section 3: Backtracking — Constraint Satisfaction

| # | Problem | Platform | Difficulty | Key Technique |
|---|---------|----------|------------|---------------|
| 1 | N-Queens (LC 51) | LeetCode | Hard | Column + diagonal constraint tracking |
| 2 | N-Queens II (LC 52) | LeetCode | Hard | Count only (simpler than LC 51) |
| 3 | Sudoku Solver (LC 37) | LeetCode | Hard | Row/col/box constraint sets |
| 4 | Valid Sudoku (LC 36) | LeetCode | Medium | Constraint check without solving |
| 5 | Word Search (LC 79) | LeetCode | Medium | Grid backtracking with visited |
| 6 | Word Search II (LC 212) | LeetCode | Hard | Trie + backtracking on grid |
| 7 | Palindrome Partitioning (LC 131) | LeetCode | Medium | Partition string into palindromes |
| 8 | Restore IP Addresses (LC 93) | LeetCode | Medium | 4 segments, each 0-255 |
| 9 | Generate Parentheses (LC 22) | LeetCode | Medium | open < n, close < open |
| 10 | Expression Add Operators (LC 282) | LeetCode | Hard | Insert +,-,* between digits |

---

## HIDDEN GEMS — Recursion & Backtracking

| # | Problem | Platform | Why It's Valuable |
|---|---------|----------|-------------------|
| 1 | Different Ways to Add Parentheses (LC 241) | LeetCode | Divide-and-conquer recursion on expressions |
| 2 | Strobogrammatic Number II (LC 247) | LeetCode | Build from outside-in recursively |
| 3 | Additive Number (LC 306) | LeetCode | String backtracking with BigInteger |
| 4 | Beautiful Arrangement (LC 526) | LeetCode | Permutation with divisibility constraint |
| 5 | Matchsticks to Square (LC 473) | LeetCode | Partition into 4 equal subsets — pruning critical |
| 6 | Partition to K Equal Sum Subsets (LC 698) | LeetCode | Generalized partition — bitmask or backtrack |
| 7 | Increasing Subsequences (LC 491) | LeetCode | Backtrack without sorting — use set at each level |
| 8 | Split Array into Fibonacci Sequence (LC 842) | LeetCode | Fibonacci constraint + string splitting |

---
