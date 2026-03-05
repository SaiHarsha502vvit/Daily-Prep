> **Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [Next Chapter >](03b_Recursion_Fundamentals.md)
> 🧠 **Mental Model**: See [Recursion Tree Thinking](../14_Mental_Models/01_Recursion_Tree_Thinking.md) — call stack visualization and trust-the-recursion framework

---

# 🔄 Recursion: Complete Mental Model Guide

## Understanding Recursion from Brain's Perspective

---

# 🔬 PART 0: Deep Internals — How Recursion Actually Works at CPU/Memory Level

> **🎯 Chapter Goal:** Understand what *physically* happens when you call a recursive function.

**In this section you'll learn:**
- Stack frame creation and destruction
- CPU register operations
- Memory layout of the call stack
- Why stack overflow happens
- Performance implications

## 📦 The Call Stack — Physical Memory View

Every recursive call creates a new **stack frame** in memory. Consider this simple recursive function:

```java
int sum(int n) {
    if (n <= 0) return 0;
    return n + sum(n - 1);
}
sum(4);
```

Here's what the stack looks like when `sum(4)` is called — it grows **downward** on most architectures:

```
  STACK MEMORY (grows downward on most architectures):

HIGH ADDRESSES
┌────────────────────────────────────────────────────────────────────────────┐
│                    ... other stack data ...                                │
├────────────────────────────────────────────────────────────────────────────┤
│  FRAME: main()                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Local variables of main                                              │  │
│  │ Return address (to JVM/OS)                                           │  │
│  │ Previous frame pointer                                               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────────┤
│  FRAME: sum(4)                                   OFFSET FROM FP           │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ [FP+16] Return address → main+42              (8 bytes)              │  │
│  │ [FP+8]  Previous frame pointer                (8 bytes)              │  │
│  │ [FP+0]  Frame pointer (FP) ─────────────────────────                 │  │
│  │ [FP-4]  Parameter n = 4                       (4 bytes)              │  │
│  │ [FP-8]  Local temp for n-1 = 3                (4 bytes)              │  │
│  │ [FP-12] Space for return value                (4 bytes)              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────────┤
│  FRAME: sum(3)                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Return address → sum+15 (return point in sum(4))                     │  │
│  │ Previous frame pointer → sum(4)'s FP                                 │  │
│  │ Frame pointer (FP)                                                   │  │
│  │ Parameter n = 3                                                      │  │
│  │ Local temp for n-1 = 2                                               │  │
│  │ Space for return value                                               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────────┤
│  FRAME: sum(2)                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ... same structure ...                                               │  │
│  │ Parameter n = 2                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────────┤
│  FRAME: sum(1)                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Parameter n = 1                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────────┤
│  FRAME: sum(0) ← Stack Pointer (SP)                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Parameter n = 0                                                      │  │
│  │ BASE CASE! Returns 0, no more recursion                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
  LOW ADDRESSES
```

> 💡 **Key Insight:** Total stack size for `sum(4)` = 5 frames × ~32 bytes = **~160 bytes**

## ⚙️ CPU Instructions for Each Recursive Call

### Java Bytecode for `sum(n)`

```
0: iload_1        // Load n onto operand stack
1: ifgt 6         // If n > 0, jump to line 6
4: iconst_0       // Push 0
5: ireturn        // Return 0 (base case)
6: iload_1        // Load n
7: iload_1        // Load n again
8: iconst_1       // Push 1
9: isub           // Compute n-1
10: invokevirtual // Call sum(n-1) ← RECURSIVE CALL
13: iadd          // Add n + result
14: ireturn       // Return sum
```

### JIT-Compiled x86-64 Assembly (simplified)

```asm
sum:
    push    rbp                  ; Save old frame pointer
    mov     rbp, rsp             ; Set new frame pointer
    sub     rsp, 16              ; Allocate stack space
    mov     [rbp-4], edi         ; Store parameter n

    cmp     dword [rbp-4], 0     ; Compare n with 0
    jle     .base_case           ; If n <= 0, jump to base case

    ; Recursive case
    mov     eax, [rbp-4]         ; Load n
    sub     eax, 1               ; Compute n-1
    mov     edi, eax             ; Set argument for call
    call    sum                  ; ← RECURSIVE CALL
    mov     edx, [rbp-4]         ; Load n again
    add     eax, edx             ; Add n + result
    jmp     .return

.base_case:
    mov     eax, 0               ; Return 0

.return:
    mov     rsp, rbp             ; Restore stack pointer
    pop     rbp                  ; Restore frame pointer
    ret                          ; Return to caller
```

### CPU Cycles per Recursive Call

| Operation | Cycles | Notes |
|-----------|--------|-------|
| `push rbp` | 1 | |
| `mov rbp, rsp` | 1 | |
| `sub rsp, 16` | 1 | |
| `mov [rbp-4], edi` | 1–4 | Write to memory |
| `cmp` + `jle` | 1–20 | 1 if predicted, 20 if not |
| `call sum` | 3–5 | + overhead of callee |
| `add` | 1 | |
| `pop` + `ret` | 2 | |
| **TOTAL per level** | **~15–40** | **Varies by CPU** |

> ⚠️ **Performance Impact:** For `sum(1000)` → **~20,000–40,000 cycles** just in call overhead!
> Compare with iterative: **~3,000 cycles** (mostly loop overhead + adds)

## 💥 Stack Overflow — Why It Happens

### Java Stack Sizes

| Setting | Value |
|---------|-------|
| Default thread stack | ~512 KB – 1 MB (varies by JVM/OS) |
| Configure via | `java -Xss2m` (set to 2 MB) |

### Maximum Recursion Depth

- Frame size ≈ **32–64 bytes** (depends on locals, parameters)
- Stack size = **1 MB** = 1,000,000 bytes
- Max depth ≈ 1,000,000 / 48 ≈ **~20,000 calls**

Here's what it looks like when the stack is about to overflow:

```
  Stack Memory:  0x7fff0000 (top/high)
  ┌────────────────────────────────────────────────────────────────────┐
  │ Thread local storage, etc.                                        │
  ├────────────────────────────────────────────────────────────────────┤
  │ main() frame                                                      │
  ├────────────────────────────────────────────────────────────────────┤
  │ sum(10000) frame                                                  │
  ├────────────────────────────────────────────────────────────────────┤
  │ sum(9999) frame                                                   │
  ├────────────────────────────────────────────────────────────────────┤
  │                       ...                                         │
  │               (9998 more frames)                                  │
  │                       ...                                         │
  ├────────────────────────────────────────────────────────────────────┤
  │ sum(1) frame                                                      │
  ├────────────────────────────────────────────────────────────────────┤
  │ sum(0) frame ← Stack Pointer                                      │
  ├────────────────────────────────────────────────────────────────────┤
  │ ████████████████████████████████████████████████████████████████  │
  │ █████████ GUARD PAGE (triggers StackOverflowError) █████████████  │
  │ ████████████████████████████████████████████████████████████████  │
  └────────────────────────────────────────────────────────────────────┘
  Stack Limit:   0x7ffe0000 (bottom/low)
```

> 🚨 **When SP crosses into the guard page → `StackOverflowError` is thrown**

### Solutions to Stack Overflow

| # | Solution | Notes |
|---|----------|-------|
| 1 | **Convert to iterative** | Always works |
| 2 | **Increase stack size** (`java -Xss4m`) | Temporary fix only |
| 3 | **Use tail recursion** | If language supports it — *Java does NOT* |
| 4 | **Trampoline pattern** | Manual tail call optimization |

## 🔄 Converting Recursion to Iteration

### Pattern 1: Simple Accumulation (Tail-like)

```java
// Recursive
int sum(int n) {
    if (n <= 0) return 0;
    return n + sum(n - 1);
}

// Iterative
int sumIterative(int n) {
    int result = 0;
    for (int i = 1; i <= n; i++) {
        result += i;
    }
    return result;
}
```

### Pattern 2: Tree Traversal (Need Explicit Stack)

```java
// Recursive inorder
void inorder(TreeNode root) {
    if (root == null) return;
    inorder(root.left);
    visit(root);
    inorder(root.right);
}

// Iterative inorder (explicit stack)
void inorderIterative(TreeNode root) {
    Deque<TreeNode> stack = new ArrayDeque<>();
    TreeNode curr = root;

    while (curr != null || !stack.isEmpty()) {
        // Go left as far as possible
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

### Pattern 3: Backtracking (Need to Track State)

```java
// Recursive permutations
void permute(int[] nums, List<Integer> curr, boolean[] used) {
    if (curr.size() == nums.length) {
        result.add(new ArrayList<>(curr));
        return;
    }
    for (int i = 0; i < nums.length; i++) {
        if (!used[i]) {
            used[i] = true;
            curr.add(nums[i]);
            permute(nums, curr, used);
            curr.remove(curr.size() - 1);  // Backtrack
            used[i] = false;               // Backtrack
        }
    }
}
```

> 💡 **Note:** For backtracking problems, recursion is generally **cleaner** than iterative. Iterative permutations require manually tracking: current permutation, next index to try, and used set.

## 🚀 Tail Recursion — The Optimization That Java Doesn't Have

### What Is Tail Recursion?

A recursive call is in **"tail position"** if it's the **LAST thing** the function does before returning. No work happens after the recursive call returns.

```java
// NOT tail recursive — work AFTER call
int sum(int n) {
    if (n <= 0) return 0;
    return n + sum(n - 1);  // ← Must add n AFTER call returns
}

// TAIL recursive — call IS the last operation
int sumTail(int n, int acc) {
    if (n <= 0) return acc;
    return sumTail(n - 1, acc + n);  // ← LAST thing before return
}
```

### Why TCO Matters

With TCO, the compiler can **reuse the same stack frame**:

```
sumTail(4, 0):     Frame: n=4, acc=0
  ↓                Just UPDATE the frame:
sumTail(3, 4):     Frame: n=3, acc=4   (reused!)
  ↓
sumTail(2, 7):     Frame: n=2, acc=7   (reused!)
  ↓
sumTail(1, 9):     Frame: n=1, acc=9   (reused!)
  ↓
sumTail(0, 10):    return 10
```

> ✅ **CONSTANT STACK SPACE!** No stack overflow possible!

### Why Java Does NOT Support TCO

1. JVM security model relies on stack frames for access checks
2. Profiling and debugging need complete stack traces
3. Exception handling expects proper stack unwinding
4. Not a priority for JVM development

### Workaround: Trampoline Pattern

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
```

**Languages with TCO:**

| Language | TCO Support |
|----------|-------------|
| **Scheme, Haskell** | Guaranteed by language spec |
| **Scala** | With `@tailrec` annotation |
| **Kotlin** | With `tailrec` modifier |
| **JavaScript** | ES6 spec, but limited browser support |

## 🧠 Memoization — Caching Recursive Results

### The Problem: Recursive Fibonacci

```java
int fib(int n) {
    if (n <= 1) return n;
    return fib(n-1) + fib(n-2);
}
```

The call tree for `fib(5)` shows **massive redundancy**:

```
                    fib(5)
                   /      \
              fib(4)      fib(3)
             /     \      /     \
         fib(3)  fib(2) fib(2) fib(1)
         /    \   ...    ...
     fib(2) fib(1)
     /    \
  fib(1) fib(0)
```

**Repeated calls:**

| Call | Times Computed |
|------|----------------|
| `fib(3)` | 2 times |
| `fib(2)` | 3 times |
| `fib(1)` | 5 times |
| `fib(0)` | 3 times |

> ⚠️ **Time Complexity: O(2ⁿ) — exponential!**
> - `fib(40)` takes ~1 second
> - `fib(50)` takes ~2 minutes

### The Solution: Memoization

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

Call tree **with** memoization — each value computed exactly **once**:

```
                fib(5)
               /      \
          fib(4)     fib(3) ← Cache hit!
         /      \
    fib(3)     fib(2) ← Cache hit!
   /      \
fib(2)   fib(1)
/      \
fib(1)  fib(0)
```

> ✅ Each `fib(k)` computed exactly **ONCE!**
> **Time: O(n)** · **Space: O(n)**

### Memory Layout with Memoization

```
HEAP:
  memo[] = [-1, -1, -1, -1, -1, -1]    (initial)
  memo[] = [ 0,  1,  1,  2,  3,  5]    (after fib(5))

STACK (much shorter!):
  fib(5) → fib(4) → fib(3) → fib(2) → fib(1) → fib(0)

  Only goes 6 levels deep, not exponentially branching!
```

---

> **Navigation**: [< Back to Index](../00_MASTER_INDEX.md) | [Next: Recursion Fundamentals >](03b_Recursion_Fundamentals.md)

