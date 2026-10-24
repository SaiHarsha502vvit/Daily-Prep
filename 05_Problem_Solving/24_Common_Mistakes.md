> **Navigation**: [← Edge Cases Master Guide](23_Edge_Cases.md) | [Chapter index](00_INDEX.md) | [Real-World Problem Origins: Where… →](25_Problem_Origins.md)

# 🚨 COMMON MISTAKES & HOW TO AVOID THEM

## Every mistake you might make, with visual explanations!

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Edge Cases](23_Edge_Cases.md) |
| **You will learn** | Recurring Java and algorithm mistakes: overflow, `==` vs `equals`, mutable keys, integer division, slow I/O |
| **Leads to** | [Problem Origins](25_Problem_Origins.md) |
| **Abstraction level** | Knowing patterns → **knowing how they fail** |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Common Mistakes

### 1. The bottom line

The same dozen mistakes cause most wrong answers; learn them by name.

### 2. The textbook core

- `==` on strings and boxed values.
- `int` overflow in sums and products.
- Integer division truncation.
- Mutating a collection while iterating.
- Slow I/O with `Scanner`.

### 3. The real-world analogy

A **pilot’s checklist**.

### 4. Walkthrough

1. Compare two `Integer` values 1000 with `==`.
2. Values outside −128..127 are different objects.
3. `==` returns false.
4. Use `equals`.

> [!NOTE]
> **Quick check:** Why can `Integer a == Integer b` be false for equal values? *Boxed values outside the cache range are separate objects.*


### 5. Check yourself

**Q1.** `Integer a = 127, b = 127; a == b` and the same with 128?

<details><summary>Answer</summary>

`true` for 127 and `false` for 128: boxed values from −128 to 127 are cached; use `equals`.

</details>

**Q2.** What are `7 / 2` and `-7 / 2` in Java?

<details><summary>Answer</summary>

3 and **−3**: integer division truncates toward zero.

</details>

---


## 📚 TABLE OF CONTENTS

1. [Off-By-One Errors](#-1-off--by--one-errors)
2. [Array Index Out of Bounds](#-2-array-index-out-of-bounds)
3. [Integer Overflow](#-3-integer-overflow)
4. [String Comparison Mistakes](#-4-string-comparison-mistakes)
5. [Scanner Input Mistakes](#-5-scanner-input-mistakes)
6. [Loop Mistakes](#-6-loop-mistakes)
7. [Edge Case Mistakes](#-7-edge-case-mistakes)
8. [Logic Mistakes](#-8-logic-mistakes)
9. [Return Statement Mistakes](#-9-return-statement-mistakes)
10. [Variable Initialization Mistakes](#-10-variable-initialization-mistakes)

---

## 📌 1. Off — By — One Errors

> OFF-BY-ONE ERRORS
>
> MISTAKE 1: Wrong loop bound
> ─────────────────────────────
>
> ✗ WRONG:
> for (int i = 0; i <= arr.length; i++) // Goes ONE past end!
> System.out.println(arr[i]); // CRASH at last iteration
>
> Array: [1, 2, 3, 4, 5]
> Index: 0 1 2 3 4 5 ← Does not exist!
> ↑
> Crash here
>
> ✓ CORRECT:
> for (int i = 0; i < arr.length; i++) // Stops at last valid index
> System.out.println(arr[i]);
>
> ═══════════════════════════════════════════════════════════════════════
>
> MISTAKE 2: Substring wrong end index
> ────────────────────────────────────
>
> String s = "hello"; // indices 0-4, length 5
>
> ✗ WRONG (to get "ell"):
> s.substring(1, 3) // Returns "el" (end is exclusive!)
>
> ✓ CORRECT:
> s.substring(1, 4) // Returns "ell" (end is exclusive, so 1,2,3)
>
> Visual:
> String: h e l l o
> Index: 0 1 2 3 4
> [start, end) ← end is EXCLUSIVE
>
> ═══════════════════════════════════════════════════════════════════════
>
> MISTAKE 3: Wrong mid calculation
> ─────────────────────────────────
>
> ✗ WRONG (can overflow for large arrays):
> int mid = (low + high) / 2; // If low + high > Integer.MAX_VALUE
>
> ✓ CORRECT:
> int mid = low + (high - low) / 2; // Never overflows

### Quick Reference: < vs <=

```java
// Iterating through array (0 to n-1)
for (int i = 0; i < n; i++)       // CORRECT: < n

// Iterating through pairs
for (int i = 0; i < n - 1; i++)   // Compare arr[i] with arr[i+1]

// Binary search
while (low <= high)               // CORRECT: <= for standard binary search

// Two pointers from ends
while (left < right)              // CORRECT: < (stop when they meet)
```

---

## 📊 2. Array Index Out of Bounds

**ARRAY INDEX OUT OF BOUNDS**

```text
MISTAKE 1: Accessing negative index
────────────────────────────────────

int[] arr = {1, 2, 3};
int x = arr[-1];  // CRASH! ArrayIndexOutOfBoundsException

═══════════════════════════════════════════════════════════════════════

MISTAKE 2: Accessing arr[i-1] without check
────────────────────────────────────────────

✗ WRONG:
for (int i = 0; i < arr.length; i++) {
    if (arr[i] != arr[i-1]) ...  // When i=0, arr[i-1] = arr[-1]!
}

✓ CORRECT:
for (int i = 1; i < arr.length; i++) {  // Start from 1
    if (arr[i] != arr[i-1]) ...
}

═══════════════════════════════════════════════════════════════════════

MISTAKE 3: Accessing arr[i+1] without check
────────────────────────────────────────────

✗ WRONG:
for (int i = 0; i < arr.length; i++) {
    if (arr[i] < arr[i+1]) ...  // When i=last, arr[i+1] crashes!
}

✓ CORRECT:
for (int i = 0; i < arr.length - 1; i++) {  // Stop one early
    if (arr[i] < arr[i+1]) ...
}

═══════════════════════════════════════════════════════════════════════

MISTAKE 4: Empty array access
─────────────────────────────

✗ WRONG:
int first = arr[0];  // CRASH if arr is empty!

✓ CORRECT:
if (arr.length > 0) {
    int first = arr[0];
}
```

---

## 💥 3. Integer Overflow

**INTEGER OVERFLOW**

```text
Java int range: -2,147,483,648 to 2,147,483,647 (about ±2 billion)

MISTAKE 1: Factorial overflow
─────────────────────────────

13! = 6,227,020,800 > Integer.MAX_VALUE

✗ WRONG:
int factorial = 1;
for (int i = 1; i <= n; i++) {
    factorial *= i;  // Overflows at n=13
}

✓ CORRECT (use long):
long factorial = 1L;
for (int i = 1; i <= n; i++) {
    factorial *= i;  // Works up to n=20
}

═══════════════════════════════════════════════════════════════════════

MISTAKE 2: Sum overflow
───────────────────────

Array: [1,000,000,000, 1,000,000,000, 1,000,000,000]
Sum: 3,000,000,000 > Integer.MAX_VALUE

✗ WRONG:
int sum = 0;
for (int num : arr) sum += num;  // Overflow!

✓ CORRECT:
long sum = 0L;
for (int num : arr) sum += num;  // Safe

═══════════════════════════════════════════════════════════════════════

MISTAKE 3: Multiplication overflow
──────────────────────────────────

✗ WRONG:
int area = width * height;  // Can overflow for large rectangles

✓ CORRECT:
long area = (long) width * height;  // Cast BEFORE multiplication

⚠️ Note: long area = (long)(width * height) is WRONG!
   The overflow happens in (width * height) BEFORE the cast.
```

---

> 🔬 **Section Challenge — 💥 3. Integer Overflow**

**Challenge (Debug — Who/When/What):** `int result = 100000 * 100000;` returns a negative number. Who computed this multiplication? When did the overflow occur? What was already true about Java's `int` type that made this inevitable, and what is the minimal fix?

<details><summary>Answer</summary>

**Who?** The JVM's integer arithmetic unit. **When?** At the multiplication instruction, before any assignment. **What already exists?** Java `int` is a 32-bit signed type with max value 2,147,483,647. `100,000 × 100,000 = 10,000,000,000` which exceeds this by ~8× — the result wraps around (two's complement overflow) to a large negative value.

**Minimal fix:** `long result = 100000L * 100000;` (or `(long) 100000 * 100000`). The `L` suffix forces the multiplication to happen in `long` arithmetic BEFORE the result is stored. **Critical rule:** Cast BEFORE the operation, not after: `(long)(100000 * 100000)` is WRONG — overflow already occurred inside the parentheses.

</details>

## 📝 4. String Comparison Mistakes

```
                  STRING COMPARISON MISTAKES
──────────────────────────────────────────────────

MISTAKE: Using == instead of .equals()
────────────────────────────────────────

✗ WRONG:
String s1 = "hello";
String s2 = new String("hello");
if (s1 == s2) { ... }  // FALSE! Compares references, not content

Visual:
┌─────────┐         ┌─────────┐
│   s1    │         │   s2    │
│ (ref A) │         │ (ref B) │
└────┬────┘         └────┬────┘
     │                   │
     ↓                   ↓
┌─────────┐         ┌─────────┐
│ "hello" │         │ "hello" │  ← Same CONTENT, different OBJECTS
└─────────┘         └─────────┘

s1 == s2 checks: Are they the SAME object? → NO (different refs)
s1.equals(s2): Are the CONTENTS equal? → YES

✓ CORRECT:
if (s1.equals(s2)) { ... }  // TRUE! Compares content

✓ Also correct (null-safe):
if ("hello".equals(s1)) { ... }  // Won't crash if s1 is null

═══════════════════════════════════════════════════════════════════════

EXCEPTION: String literals from pool
────────────────────────────────────

String s1 = "hello";
String s2 = "hello";
s1 == s2;  // TRUE! (Both point to same string in pool)

But DON'T rely on this! Always use .equals() to be safe.

```

---

> 🔬 **Section Challenge — 📝 4. String Comparison Mistakes**

**Challenge (Trace — Who/When/What):** `String s1 = "hello"; String s2 = new String("hello"); System.out.println(s1 == s2);` What does this print, and why? Then: `String s3 = "hello"; System.out.println(s1 == s3);` — what does THIS print and why is it different?

<details><summary>Answer</summary>

**s1 == s2 prints `false`.** Who compares? The `==` operator. When? At runtime. What already exists? `s1` points to the String Pool literal `"hello"`. `s2` was created with `new String(...)`, which forces allocation of a NEW heap object even if content is identical. The `==` operator compares reference addresses, not content. Different heap addresses → `false`.

**s1 == s3 prints `true`.** Why different? Both `s1 = "hello"` and `s3 = "hello"` are string literals. At compile time, the JVM interns them to the **same** String Pool entry. Both references point to the same memory address → `==` returns `true`. **Never rely on this.** Always use `.equals()` for content comparison — the pool optimization is an implementation detail, not a language guarantee.

</details>

## 📌 5. Scanner Input Mistakes

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    SCANNER INPUT MISTAKES                                 ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  MISTAKE 1: nextInt() leaves newline                                      ║
║  ────────────────────────────────────                                     ║
║                                                                           ║
║  Input: "5\nhello"                                                        ║
║                                                                           ║
║  ✗ WRONG:                                                                 ║
║  int n = scanner.nextInt();     // Reads "5", leaves "\n"                 ║
║  String s = scanner.nextLine(); // Reads empty "\n", NOT "hello"!         ║
║                                                                           ║
║  Buffer state:                                                            ║
║  Before: "5\nhello"                                                       ║
║           ↑                                                               ║
║  After nextInt(): "5\nhello"                                              ║
║                     ↑ (still at newline!)                                 ║
║  After nextLine(): "5\nhello"                                             ║
║                       ↑ (consumed just the newline)                       ║
║                                                                           ║
║  ✓ CORRECT:                                                               ║
║  int n = scanner.nextInt();                                               ║
║  scanner.nextLine();  // Consume leftover newline                         ║
║  String s = scanner.nextLine();  // Now reads "hello"                     ║
║                                                                           ║
║  ═══════════════════════════════════════════════════════════════════════  ║
║                                                                           ║
║  MISTAKE 2: Not closing Scanner                                           ║
║  ──────────────────────────────                                           ║
║                                                                           ║
║  ✗ WARNING: Resource leak                                                 ║
║  Scanner sc = new Scanner(System.in);                                     ║
║  // ... use scanner ...                                                   ║
║  // Forgot to close!                                                      ║
║                                                                           ║
║  ✓ BETTER (try-with-resources):                                           ║
║  try (Scanner sc = new Scanner(System.in)) {                              ║
║      // ... use scanner ...                                               ║
║  }  // Automatically closed                                               ║
║                                                                           ║
║  ═══════════════════════════════════════════════════════════════════════  ║
║                                                                           ║
║  MISTAKE 3: hasNext() confusion                                           ║
║  ──────────────────────────────                                           ║
║                                                                           ║
║  // Reading until no more input:                                          ║
║  while (scanner.hasNext()) {      // hasNext() for any token              ║
║      String word = scanner.next();                                        ║
║  }                                                                        ║
║                                                                           ║
║  while (scanner.hasNextInt()) {   // hasNextInt() for integers            ║
║      int num = scanner.nextInt();                                         ║
║  }                                                                        ║
║                                                                           ║
║  while (scanner.hasNextLine()) {  // hasNextLine() for lines              ║
║      String line = scanner.nextLine();                                    ║
║  }                                                                        ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

> 🔬 **Section Challenge — 📌 5. Scanner Input Mistakes**

**Challenge (Debug — Who/When/What):** A student reads an integer then a full line:

```java
int n = scanner.nextInt();
String s = scanner.nextLine();
```

For input `"5\nhello"`, what does `s` contain and why? State exactly **who** consumed what, **when**, and **what state** the buffer was in before `nextLine()` executed.

<details><summary>Answer</summary>

`s` contains `""` (empty string), NOT `"hello"`.

**Who?** `nextInt()` reads token `"5"` but does NOT consume the `\n` newline that follows. **When?** After `nextInt()` returns, the buffer pointer is positioned AT the `\n` character. **What already exists in the buffer?** `"\nhello"` — the newline is still there.

`nextLine()` then reads everything up to the NEXT newline — which is the `\n` immediately ahead. It consumes just that `\n` and returns an empty string `""`. The `"hello"` text is still buffered, unread.

**Fix:** Insert `scanner.nextLine();` as a flush call between `nextInt()` and the string-reading `nextLine()`. This consumes the stale `\n`, positioning the buffer at `"hello"` for the next call.

</details>

## 🏛️ 6. Loop Mistakes

```
                  LOOP MISTAKES
──────────────────────────────────────────────────

MISTAKE 1: Infinite loop
────────────────────────

✗ WRONG:
int i = 0;
while (i < 10) {
    System.out.println(i);
    // Forgot i++! Loop runs forever
}

✗ ALSO WRONG:
for (int i = 0; i < 10; ) {  // Missing increment!
    System.out.println(i);
}

═══════════════════════════════════════════════════════════════════════

MISTAKE 2: Modifying loop variable inside loop
──────────────────────────────────────────────

✗ CONFUSING:
for (int i = 0; i < 10; i++) {
    if (someCondition) i++;  // Now iteration is skipped!
}

═══════════════════════════════════════════════════════════════════════

MISTAKE 3: Wrong loop type
──────────────────────────

✗ WRONG (modifying while iterating):
for (int num : list) {
    if (num < 0) list.remove(num);  // ConcurrentModificationException!
}

✓ CORRECT (use iterator or index-based):
Iterator<Integer> it = list.iterator();
while (it.hasNext()) {
    if (it.next() < 0) it.remove();  // Safe removal
}

═══════════════════════════════════════════════════════════════════════

MISTAKE 4: Off-by-one in nested loops
─────────────────────────────────────

For upper triangle of matrix (excluding diagonal):
┌───┬───┬───┬───┐
│ X │ ✓ │ ✓ │ ✓ │   i=0: j from 1 to 3
├───┼───┼───┼───┤
│   │ X │ ✓ │ ✓ │   i=1: j from 2 to 3
├───┼───┼───┼───┤
│   │   │ X │ ✓ │   i=2: j from 3 to 3
├───┼───┼───┼───┤
│   │   │   │ X │   i=3: j from 4 to 3 (no iterations)
└───┴───┴───┴───┘

for (int i = 0; i < n; i++) {
    for (int j = i + 1; j < n; j++) {  // j starts at i+1
        // Process upper triangle
    }
}

```

---

## 📌 7. Edge Case Mistakes

**Edge case mistakes**

**Always check these before submitting**

**1. empty input**

```text
arr = []
str = ""
n = 0
```

**2. single element**

```text
arr = [5]
str = "a"
n = 1
```

**3. two elements**

```text
arr = [1, 2]  (minimum for comparison)
str = "ab"
```

**4. all same elements**

```text
arr = [5, 5, 5, 5, 5]
str = "aaaa"
```

**5. negative numbers**

```text
arr = [-5, -3, -1]
sum with negatives
max of all negatives
```

**6. boundary values**

```text
Integer.MAX_VALUE, Integer.MIN_VALUE
k = 0, k = n (window size edge cases)
First/last element special handling
```

**7. sorted/reverse sorted**

```text
arr = [1, 2, 3, 4, 5]  (already sorted)
arr = [5, 4, 3, 2, 1]  (reverse sorted)
```

---

## 📌 8. Logic Mistakes

**LOGIC MISTAKES**

```text
MISTAKE 1: Wrong boolean logic
──────────────────────────────

De Morgan's Laws:
!(A && B) = !A || !B
!(A || B) = !A && !B

✗ WRONG:
if (!(x > 5 && x < 10))  // Confusing

✓ CLEARER:
if (x <= 5 || x >= 10)  // Same logic, easier to read

═══════════════════════════════════════════════════════════════════════

MISTAKE 2: && vs || confusion
─────────────────────────────

"x is between 5 and 10" (inclusive):

✗ WRONG:
if (x >= 5 || x <= 10)  // Always true for any x!

✓ CORRECT:
if (x >= 5 && x <= 10)  // Both conditions must be true

═══════════════════════════════════════════════════════════════════════

MISTAKE 3: Assignment vs comparison
────────────────────────────────────

✗ WRONG:
if (x = 5) { ... }  // Assignment! Always "true" in some languages
                    // Java: Compile error (thankfully!)

✓ CORRECT:
if (x == 5) { ... }  // Comparison

═══════════════════════════════════════════════════════════════════════

MISTAKE 4: Short-circuit evaluation
────────────────────────────────────

✗ DANGEROUS:
if (arr[i] != null && arr.length > i) { ... }
// If arr[i] throws exception, arr.length is never checked!

✓ CORRECT ORDER:
if (i < arr.length && arr[i] != null) { ... }
// Check bounds FIRST, then access
```

---

## 📦 9. Return Statement Mistakes

**RETURN STATEMENT MISTAKES**

```text
MISTAKE 1: Missing return statement
────────────────────────────────────

✗ WRONG (compile error):
public int findMax(int[] arr) {
    int max = arr[0];
    for (int num : arr) {
        if (num > max) max = num;
    }
    // Forgot return! Compile error: "missing return statement"
}

✓ CORRECT:
public int findMax(int[] arr) {
    int max = arr[0];
    for (int num : arr) {
        if (num > max) max = num;
    }
    return max;  // Don't forget!
}

═══════════════════════════════════════════════════════════════════════

MISTAKE 2: Return inside loop (early exit)
───────────────────────────────────────────

✗ WRONG (returns on first iteration):
public int sum(int[] arr) {
    int sum = 0;
    for (int num : arr) {
        sum += num;
        return sum;  // Returns immediately after first element!
    }
    return sum;
}

✓ CORRECT:
public int sum(int[] arr) {
    int sum = 0;
    for (int num : arr) {
        sum += num;
    }
    return sum;  // Return AFTER loop
}

═══════════════════════════════════════════════════════════════════════

MISTAKE 3: Wrong return type
────────────────────────────

✗ WRONG:
public int divide(int a, int b) {
    return a / b;  // Integer division! 5/2 = 2, not 2.5
}

✓ CORRECT (if you need decimal):
public double divide(int a, int b) {
    return (double) a / b;  // Cast to double first
}
```

---

## 📌 10. Variable Initialization Mistakes

```
                  VARIABLE INITIALIZATION MISTAKES
──────────────────────────────────────────────────

MISTAKE 1: Wrong initial value for min/max
───────────────────────────────────────────

✗ WRONG:
int max = 0;  // What if all numbers are negative?
for (int num : arr) {
    if (num > max) max = num;
}
// arr = [-5, -3, -1] → max = 0 (wrong! should be -1)

✓ CORRECT OPTIONS:
int max = Integer.MIN_VALUE;  // Smallest possible value
int max = arr[0];             // First element (if array not empty)

═══════════════════════════════════════════════════════════════════════

MISTAKE 2: Wrong initial value for sum with subtraction
──────────────────────────────────────────────────────────

For finding minimum sum:
✗ WRONG:
int minSum = 0;  // What if all sums are positive?

✓ CORRECT:
int minSum = Integer.MAX_VALUE;  // Largest possible value

═══════════════════════════════════════════════════════════════════════

MISTAKE 3: Not resetting variables in nested loops
──────────────────────────────────────────────────

✗ WRONG:
int count = 0;
for (int i = 0; i < n; i++) {
    // Forgot to reset count!
    for (int j = 0; j < m; j++) {
        if (condition) count++;
    }
    System.out.println(count);  // Keeps accumulating!
}

✓ CORRECT:
for (int i = 0; i < n; i++) {
    int count = 0;  // Reset for each outer iteration
    for (int j = 0; j < m; j++) {
        if (condition) count++;
    }
    System.out.println(count);
}

═══════════════════════════════════════════════════════════════════════

REFERENCE TABLE:
┌────────────────────────────────────────────────────────────────────┐
│ Finding Maximum  → Initialize with Integer.MIN_VALUE or arr[0]     │
│ Finding Minimum  → Initialize with Integer.MAX_VALUE or arr[0]     │
│ Counting         → Initialize with 0                               │
│ Sum              → Initialize with 0                               │
│ Product          → Initialize with 1                               │
│ Boolean flag     → Initialize with true or false (think carefully!)│
└────────────────────────────────────────────────────────────────────┘

```

---

> 🔬 **Section Challenge — 📌 10. Variable Initialization Mistakes**

**Challenge (Debug — Who/When/What):** Find the bug: `int max = 0; for (int num : arr) { if (num > max) max = num; }` on `arr = [-5, -3, -1]`. Who reads `max` during comparison? When does the comparison fail? What must already be true for the result to be correct, and what is the fix?

<details><summary>Answer</summary>

**Who reads max?** The `if (num > max)` comparison on every iteration. **When does it fail?** On EVERY iteration — no element is greater than `0`. After the loop, `max = 0` which is not even in the array. **What must be true for correctness?** The initial value must be ≤ every possible element. `0` violates this when all elements are negative.

**Fix 1:** `int max = Integer.MIN_VALUE;` — guaranteed to be less than every valid `int`. **Fix 2:** `int max = arr[0];` then iterate from index 1 — valid as long as you guard `arr.length > 0`. **Why Fix 2 is preferred:** It avoids magic constants and is correct for both positive and negative arrays. Always ask: "What is the identity element for my operation?" For `max`: the smallest possible value (`arr[0]` or `Integer.MIN_VALUE`). For `min`: the largest.

</details>

## 📋 PRE-SUBMISSION CHECKLIST

**BEFORE YOU SUBMIT - CHECK THESE!**

```text
□ Did I handle empty input (n=0, empty array, empty string)?
□ Did I handle single element input?
□ Did I handle all negative numbers?
□ Did I handle all same elements?
□ Is my loop bound correct (< vs <=)?
□ Did I use .equals() for string comparison (not ==)?
□ Did I handle Scanner newline after nextInt()?
□ Will my code overflow? (use long if needed)
□ Did I initialize min/max correctly?
□ Does my function have a return statement on all paths?
□ Did I test with the given examples?
```

---

## 🎯 GOOD LUCK!

Remember: **Most bugs are in boundaries, not logic!**

Check edges, check bounds, and you'll catch 80% of bugs before they happen.

---


---

### Historical Evolution

Tony Hoare introduced the null reference in ALGOL W (1965) and called it his "billion-dollar mistake" in a 2009 talk. Other recurring classes of bug have well-known incidents: the Therac-25 radiation overdoses (1985–87) involved a race condition, and Heartbleed (2014) was a missing bounds check in OpenSSL. Modern languages respond with null-safety (Kotlin, Rust's `Option`) and memory safety (Rust's ownership).

- **Hoare — 1965/2009**: Null reference and the "billion-dollar mistake"
- **Therac-25 — 1985–87**: Race condition in safety software
- **Heartbleed — 2014**: Missing bounds check

### Production Reality

**Common Mistakes** patterns introduce several production failure modes that learners must internalize:

**Failure mode 1: Integer overflow in `mid * mid` for binary search on answer.** In `long mid = (low + high) / 2`, the expression `(low + high)` can overflow before division if both are near `Integer.MAX_VALUE`. Then `mid * mid > sqrt(Integer.MAX_VALUE)` causes overflow. Illustrative impact: A rate-limiting service using binary search to find the maximum concurrent requests per second crashes when testing upper bounds, causing a denial-of-service.

**Failure mode 2: `==` vs `.equals()` for String comparison in Java.** `if (s1 == s2)` compares references, not content. For `String s1 = "hello"; String s2 = new String("hello");`, `s1 == s2` is `false` even though values match. Illustrative impact: An authentication service comparing user tokens: `if (storedToken == inputToken)` — tokens with identical content but different heap allocations always fail, locking out all users after a server restart.

**Failure mode 3: Scanner slow vs BufferedReader for high-throughput input.** `Scanner` is typically several times slower than `BufferedReader` for large inputs (it uses regular expressions per token). Illustrative impact: A data pipeline using `Scanner` to parse 1 million log entries causes backpressure, queue buildup, and eventual request timeout failures.

**Debug workflow:** For overflow in binary search, replace `mid * mid` with `mid > target / mid` (no multiplication needed). For string comparison, always use `.equals()` and add a test: `assertEquals("token match", expected, actual)`. For Scanner, replace with `BufferedReader br = new BufferedReader(new InputStreamReader(System.in));` and parse with `Integer.parseInt(br.readLine().split(" ")[i])` or `StringTokenizer`.

**Real-world anchor:** The Therac-25 radiation overdoses (1985–87) involved race conditions in the control software, a reminder that concurrency and state bugs are as dangerous as arithmetic ones.


---

## 🏢 Enterprise Lens — Common Mistakes

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Code reviews, linters, onboarding |
| **Failure modes** | Repeating the same mistake |
| **Testing and verification** | Add a regression test for each mistake you meet |

---

## Reality Check

**"Reading a mistake catalog prevents the mistakes"** — Recognition in a list and prevention under pressure are different memory systems: the catalog primes RETROSPECTIVE diagnosis (why is this failing?) far more than prospective avoidance. The conversion mechanism is personal: after every practice session, tag which catalog entries YOU hit; three sessions of tags reveal your top-three signature — and drilling those three specifically (with deliberate slow-writing of that construct) is what moves them from catalog to reflex.

**"Off-by-one errors are carelessness"** — They are unstated INTERVAL CONVENTIONS: whether ranges are half-open, whether right is inclusive, whether length or index is being tracked. The cure is not care but declaration — one comment line fixing the convention, then mechanical consistency. Codebases and candidates who declare conventions have near-zero fencepost rates; those who re-derive per line have them at every boundary. Same programmer, different discipline, order-of-magnitude different bug rate.

**"Comparing boxed Integers with == fails randomly"** — It fails PREDICTABLY: the byte-range cache (-128..127) makes small boxed values reference-equal and larger ones not — so tests with small numbers pass and production values fail. File it with its family: string interning ==, floating-point ==, and mutable-object hash keys — all cases where identity, equality, and stability get conflated. The unified rule that ends the family: equals for content, == only for primitives and intentional identity checks, and never mutate what you hashed.

**"Modifying a collection while iterating fails loudly, so it self-corrects"** — ConcurrentModificationException is the LOUD sibling; the quiet ones ship: index-based removal shifting subsequent elements (skips every second match), removeIf on the wrong predicate polarity, and mutating a list captured by a stream mid-pipeline (undefined). The professional idioms — iterator.remove, removeIf, or collect-then-apply — exist because manual mutation-during-traversal is wrong in more ways than it can fail loudly.

**"Recursion mistakes are missing base cases"** — The missing base case crashes visibly; the EXPENSIVE recursion mistakes are silent: shared mutable state across branches (the un-undone modification — wrong answers, no crash), memo keys omitting a state dimension (subtly wrong on inputs where the dimension mattered), and progress-free recursion on the same arguments under a different guard (hangs). The audit heuristic for all three: every recursive call should differ from its parent in a named, shrinking quantity, and every mutation before a call should have a visible mirror after it.
