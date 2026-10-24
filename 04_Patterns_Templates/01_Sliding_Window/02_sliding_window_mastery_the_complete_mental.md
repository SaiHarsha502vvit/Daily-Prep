# 🎯 SLIDING WINDOW MASTERY - THE COMPLETE MENTAL MODEL

> **Navigation**: [← Section 0 — When Sliding Window Goes Wrong…](01_section_0_when_sliding_window_goes.md) | [Chapter overview](../01_Sliding_Window.md)
> Page 2 of 2 in **Sliding Window — Pattern Guide**


---

## 📚 Part 0: Complete Understanding

### What is sliding window?

A technique that maintains a "window" (a subarray or substring) that "slides" across the data, processing elements as the window moves.

Instead of recomputing everything for each window position, we:

- **add** the new element entering the window,
- **remove** the old element leaving the window,
- **update** the answer.

This avoids redundant work.

### What problem does it solve?

**Core problem:** efficiently compute something over all contiguous subarrays.

**Example:** "Find the maximum sum of any 3 consecutive elements" in `[1, 4, 2, 10, 2, 3, 1, 0, 20]`.

| Approach | Window 0-2 | Window 1-3 | Window 2-4 | Time |
| --- | --- | --- | --- | --- |
| **Brute force:** sum each window from scratch | 1+4+2 = 7 | 4+2+10 = 16 | 2+10+2 = 14 | O(n × k), k = window size |
| **Sliding window:** reuse the previous sum | 7 | 7 − arr[0] + arr[3] = 7 − 1 + 10 = 16 | 16 − arr[1] + arr[4] = 16 − 4 + 2 = 14 | O(n): each element is added and removed once |

**Real-world applications**

- Network: average packets per second over the last 5 seconds.
- Finance: moving average of a stock price over 20 days.
- DNA: find all substrings of length 10 with a given pattern.
- Streaming: process data chunks efficiently.

### Why is it efficient?

**The key insight: consecutive windows overlap.**

| Window | `a` | `b` | `c` | `d` | `e` | `f` |
| --- | --- | --- | --- | --- | --- | --- |
| Window 1 | **[a** | **b** | **c]** | d | e | f |
| Window 2 | a | **[b** | **c** | **d]** | e | f |

`b` and `c` are shared, so do not recompute them.

- **Brute-force waste:** window 1 computes `f(a) + f(b) + f(c)`, and window 2 computes `f(b) + f(c) + f(d)`, so `b` and `c` are computed again.
- **Sliding window:** window 1 computes `result = f(a) + f(b) + f(c)`; window 2 computes `result = result − f(a) + f(d)`, so only what is new is computed.

For `n` elements and window size `k`: brute force is O(n × k) because it recomputes `k` elements for each of `n` windows; sliding window is O(n) because each element is processed twice (add and remove).

### When to use sliding window?

✅ **Use it when the problem signals:**

- "Contiguous subarray/substring"
- "Of size k" or "at most k"
- "Maximum/minimum sum/length"
- "Contains all / distinct / at most k unique"
- The data structure is linear (array, string)
- The window moves in one direction (left to right)

**Two types**

1. **Fixed-size window** ("subarray of size k"): the window always has exactly `k` elements; slide both pointers together.
2. **Variable-size window** ("longest/shortest subarray with a condition"): the size changes with the condition; expand the right pointer and shrink the left pointer when the condition is violated.

❌ **Do not use it when:**

- The problem asks about non-contiguous elements.
- Order does not matter (use sorting or a hash map).
- You need subarrays that are not consecutive.
- The problem has negative numbers with sum conditions (it can be tricky; see Kadane's algorithm below).

### How does it work?

**Fixed-size window template**

1. Initialise: process the first `k` elements to build the first window.
2. Slide: for each new position, (a) add the new element entering from the right, (b) remove the old element leaving from the left, (c) update the answer.
3. Return the answer.

**Variable-size window template**

1. `left = 0, right = 0`.
2. Expand `right` until the condition is met or the window is too big.
3. While the condition is violated: (a) remove `arr[left]` from the window, (b) `left++`.
4. Update the answer if the window is valid.
5. `right++`.
6. Repeat until `right` reaches the end.

### Difficulties & common mistakes

| # | Mistake | Solution |
| --- | --- | --- |
| 1 | **Off-by-one errors (most common):** "window has k elements" is `j - i + 1 == k`, not `j - i == k` | Count = `rightIndex - leftIndex + 1` |
| 2 | **Forgetting to remove when shrinking:** you must undo the effect of the leaving element (sum: `sum -= arr[left]`; frequency map: decrement and remove at 0) | Write the removal next to the addition |
| 3 | **Variable-window termination:** when to shrink, when to stop expanding | Use a clear condition check before or after each operation |
| 4 | **Negative numbers:** "max-sum subarray" with negatives does not work with a plain window | Use Kadane's algorithm for that problem |
| 5 | **Edge cases:** empty array, `k > length`, single element | Validate the input first |

### Expected outputs and complexity

**Time: O(n).** Each element is added to the window once and removed at most once, so total operations ≤ 2n.

**Space:** O(1) for the basic version (pointers and a running total); O(k) or O(alphabet size) with a frequency map.

**Typical outputs:** a single value (max/min sum or length), all valid windows or their properties, or a count of valid subarrays.

---

## The Two Things Everyone Gets Wrong — Both Explained, Not Just Warned

The chapter above tells you sliding window is O(n) and that negatives are "tricky." Both deserve the *why*, because they're the two questions an interviewer uses to separate pattern-memorizers from people who understand.

### "Isn't it O(n²)? There's a `while` loop inside the `for` loop!"

This is the single most common doubt, and the answer is the most important amortization argument in all of pattern-based interviewing. Look at the variable-window skeleton:

```java
int left = 0;
for (int right = 0; right < n; right++) {   // outer: right moves n times
    add(arr[right]);
    while (windowInvalid()) {                // inner: looks like it could run n times each → O(n²)?
        remove(arr[left]);
        left++;
    }
    updateAnswer();
}
```

The naive fear: "for each of n `right` positions, the inner `while` could run up to n times → n × n = O(n²)." **Wrong, and here's the precise reason.** Don't count the inner loop *per outer iteration* — count `left`'s **total** movement across the *entire* run. `left` starts at 0, only ever **increases**, and can never exceed `n` (it can't pass `right`, which stops at n). So across the *whole algorithm*, the inner `while` body executes **at most n times total — not n times per outer step.**

```
right moves forward:  n times total      (the for loop)
left  moves forward:  ≤ n times total    (left only goes up, capped at n)
                      ─────────────
total pointer moves:  ≤ 2n  →  O(n)
```

The key shift in thinking: **amortized accounting charges the work to the pointer, not to the iteration.** Each element is added once (by `right`) and removed at most once (by `left`) — so each element is touched ≤ 2 times over the algorithm's *lifetime*, regardless of how the inner-loop bursts are distributed. Some `right` steps trigger a long shrink burst; most trigger none; but the bursts *sum* to ≤ n because there are only n elements `left` can ever march past. This is the exact same amortization that makes the monotonic stack/queue O(n) (each element pushed once, popped once) — recognize the pattern and you'll never miscount a two-pointer complexity again.

### Why negatives break it — and the precise property sliding window *requires*

The chapter says "negative numbers are tricky → use Kadane's." But *why*? Understanding this tells you, for any new problem, whether sliding window is even **legal** before you write a line.

Sliding window works only when the window has a **monotonic relationship with the constraint** — formally:

> **The validity precondition:** *growing* the window must move the quantity monotonically in one direction, so that once the window becomes invalid, the *only* way to fix it is to **shrink from the left** — and shrinking can *only* help, never hurt.

Concretely, "longest subarray with sum ≤ K, all numbers positive":
- Adding an element on the right → sum **only goes up** (positives). So if the window overshoots K, it's *definitely* too big, and removing from the left → sum **only goes down**. Shrinking is guaranteed to make progress toward valid. **Monotonic → sliding window is correct.**

Now allow **negatives**, same problem:
- Adding a right element might *decrease* the sum (a negative). So a window that overshot K could become valid *again by extending further right* — without shrinking at all. The core assumption ("once invalid, shrink to fix") is **false**. Worse: shrinking from the left might *remove a negative*, making the sum *go up* and the situation *worse*. The greedy "shrink when invalid" logic now gives wrong answers, silently. That's why you switch to **Kadane's** (which is really a different DP recurrence) or a **prefix-sum + hashmap** approach (which doesn't rely on monotonic shrinking).

> **The reusable test — apply it to any candidate problem:** *"If I extend the window, does my tracked quantity move in one consistent direction? And if the window goes invalid, is shrinking from the left guaranteed to recover validity?"* If **yes** to both → sliding window is valid and O(n). If **no** (negatives, or a non-monotonic constraint) → you need prefix sums, DP, or a different tool. This precondition — not the template — is what you're actually being tested on.

This is also exactly why the "at most K distinct characters" family works beautifully (adding a char can only *increase* distinct count, removing can only *decrease* it → monotonic), while "subarray summing to exactly K with negatives" does not.

---

## 🔥 THE CRITICAL CONFUSION (And How To Never Have It Again)

**This is the #1 confusion that stops 90% of students from mastering sliding window.**

---

## 🧠 THE WRONG WAY (How You Were Thinking Before)

```
"Should I use j < i + k or j <= i + k?"
"What about i + k - 1?"
"Why does the boundary keep confusing me?"
```

**Problem:** You're doing **index gymnastics** — trying to remember formulas.

---

## ✅ THE RIGHT WAY (How You Think Now)

```
"How many elements are currently in my window?"
```

**Solution:** Think in **element counts**, not indices.

---

## 🎨 VISUAL PROOF (The Moment It Clicks)

### Sliding window: the complete visual guide

Array: `[2, 1, 5, 1, 3, 2]`, window size `K = 3`, indexes 0 to 5.

| Window | `i` | `j` | Elements in the window | Count = `j - i + 1` |
| --- | --- | --- | --- | --- |
| 1 | 0 | 2 | `[2, 1, 5]` | 2 − 0 + 1 = 3 ✅ (equals k: process the window) |
| 2 (after sliding) | 1 | 3 | `[1, 5, 1]` | 3 − 1 + 1 = 3 ✅ |
| 3 | 2 | 4 | `[5, 1, 3]` | 4 − 2 + 1 = 3 ✅ |
| 4 (final) | 3 | 5 | `[1, 3, 2]` | 5 − 3 + 1 = 3 ✅ |

> [!IMPORTANT]
> **Key insight:** we never think about `i + k` or `i + k - 1`. We only ask: "Does my window have `k` elements?" Check `j - i + 1 == k`.

### Setup:

```
Array: [2, 1, 5, 1, 3, 2]
Index:  0  1  2  3  4  5

Window Size K = 3
```

### Count Elements, Not Indices:

| Window | Position in `[2, 1, 5, 1, 3, 2]` | `i` | `j` | Count = `j - i + 1` |
| --- | --- | --- | --- | --- |
| At i=0, j=2 | **[2, 1, 5]** , _, _, _ | 0 | 2 | 2 − 0 + 1 = 3 ✅ |
| At i=1, j=3 | _, **[1, 5, 1]** , _, _ | 1 | 3 | 3 − 1 + 1 = 3 ✅ |
| At i=2, j=4 | _, _, **[5, 1, 3]** , _ | 2 | 4 | 4 − 2 + 1 = 3 ✅ |

**Notice:** We never had to think about `i + k` or `i + k - 1`!

---

## 🔗 THE EQUIVALENCE CHAIN (Memorize This)

### The equivalence chain: why `j - i + 1 = k` works

These three expressions are mathematically equivalent:

| Form | Reads as |
| --- | --- |
| `j - i + 1 = k` | "Window has K elements" ⭐ best |
| `j = i + k - 1` | "j is at the last valid position" |
| `j < i + k` | "j has not crossed the boundary" |

**Proof.** Start with `j - i + 1 = k`. Rearranging gives `j - i = k - 1`, so `j = i + k - 1` (second form). For a loop where `j` runs from `i` to `i + k - 1`, the loop condition is `j < i + k` (third form).

**Why the first is best**

- ❌ `j < i + k`: you wonder, "is it `<` or `<=`?"
- ❌ `j = i + k - 1`: you wonder, "should I subtract 1?"
- ✅ `j - i + 1 = k`: you ask, "do I have k elements?" Simple.

The first form is a **question**, not a formula, and questions are easier to remember than formulas.

These three expressions mean **exactly** the same thing:

```
j - i + 1 = k          ← "Window has K elements" (BEST!)
     ⇕
j = i + k - 1          ← "j is at last valid position"
     ⇕
j < i + k              ← "j hasn't crossed boundary"
```

**Why the first is best:** You're counting, not calculating indices.

---

## 🧪 WHY THE OTHER FORMS CONFUSE YOU

**Why other forms are confusing**

Test Case: i = 0, k = 3

We want elements at indices: 0, 1, 2 (3 elements)

```text
USING j < i + k:

  j < 0 + 3
  j < 3

  Valid j: 0, 1, 2  ✅ (3 elements — CORRECT!)
```

```text
USING j <= i + k:  ❌ WRONG

  j <= 0 + 3
  j <= 3

  Valid j: 0, 1, 2, 3  ❌ (4 elements — TOO MANY!)
```

```text
USING j < k:  ❌ WRONG (after first window)

  After i moves to 1:
  j < 3

  Valid j: 0, 1, 2  ❌ (We need 1, 2, 3 now!)
```

CONCLUSION: Only "j < i + k" works, but it's HARD to remember!

SOLUTION: Use "j - i + 1 == k" and NEVER think about it again!

### Test Case: i = 0, k = 3

#### 1. Using `j < i + k`:

```
j < 0 + 3
j < 3

Valid j: 0, 1, 2  ✅ (3 elements — correct!)
```

#### 2. Using `j <= i + k`: ❌ WRONG

```
j <= 0 + 3
j <= 3

Valid j: 0, 1, 2, 3  ❌ (4 elements — too many!)
```

#### 3. Using `j < k`: ❌ WRONG after first window

```
After i moves to 1:
j < 3

Valid j: 0, 1, 2  ❌ (We need 1, 2, 3!)
```

**Lesson:** Only `j < i + k` works, but it's hard to remember.

**Better:** Use `j - i + 1 == k` and never think about it again.

---

## ✅ THE EXAM-SAFE PATTERN

**Exam-safe sliding-window template**

```java
int i = 0;                                  // window start (left pointer)

for (int j = 0; j < n; j++) {               // j expands the window (right pointer)

    // STEP 1: EXPAND - include arr[j] in the window
    // (add to sum, add to hashmap, etc.)

    if (j - i + 1 == k) {                   // STEP 2: CHECK - "do I have K elements?"

        // STEP 3: PROCESS - the window is ready, do something
        // (compare max, record result, etc.)

        // STEP 4: SHRINK - remove arr[i] from the window
        // (subtract from sum, remove from hashmap, etc.)

        i++;                                // STEP 5: SLIDE - move the window forward
    }
}
```

**Why this is the safe template**

- ✅ You count elements (`j - i + 1`), not indices
- ✅ No confusion about `<` versus `<=`
- ✅ Clear 5-step process: expand → check → process → shrink → slide
- ✅ Works for any window problem with small modifications

### Pattern 1: Count-Based (Recommended)

```java
int i = 0;  // Window start

for (int j = 0; j < n; j++) {  // j expands window

    // Include arr[j] in window

    if (j - i + 1 == k) {  // "Do I have K elements?"
        // Window is ready — process it

        // Example: print first element
        System.out.println(arr[i]);

        // Slide window forward
        i++;
    }
}
```

**Why This Is Perfect:**

1. ✅ You count elements (`j - i + 1`), not indices
2. ✅ No confusion about `<` vs `<=`
3. ✅ Works for any K
4. ✅ Window automatically slides when size reaches K
5. ✅ Matches how you think naturally

---

## 🎨 DRY RUN (Do This On Paper)

```
Array: [10, -1, 3, -2, 5], K=2

j=0: i=0, window=[10], count=0-0+1=1 (not ready)
j=1: i=0, window=[10,-1], count=1-0+1=2 ✅ PROCESS → i becomes 1
j=2: i=1, window=[-1,3], count=2-1+1=2 ✅ PROCESS → i becomes 2
j=3: i=2, window=[3,-2], count=3-2+1=2 ✅ PROCESS → i becomes 3
j=4: i=3, window=[-2,5], count=4-3+1=2 ✅ PROCESS → i becomes 4

Total windows processed: 4 = n - k + 1 = 5 - 2 + 1 ✅
```

---

## 🔧 OTHER VALID PATTERNS (Once You Understand)

### Pattern 2: Index-Based (Works but harder)

```java
// Time: O(N × K)
for (int i = 0; i <= n - k; i++) {

    for (int j = i; j < i + k; j++) {  // Note: j < i + k
        // Process arr[j]
    }
}
```

**When to use:** When problem explicitly needs nested loops.

### Pattern 3: Pre-Calculate + Slide

```java
// Time: O(N) - Optimal for sum/product
int sum = 0;

// First window
for (int i = 0; i < k; i++) {
    sum += arr[i];
}
System.out.println(sum);

// Slide window
for (int i = k; i < n; i++) {
    sum = sum - arr[i - k] + arr[i];  // Remove left, add right
    System.out.println(sum);
}
```

**When to use:** When you can optimize by reusing previous calculation.

---

## 🎯 EXAMPLE PROBLEMS USING COUNT-BASED THINKING

### Problem 1: First Negative in Each Window

```java
public static void firstNegativeInWindow(int[] arr, int k) {
    int n = arr.length;
    int i = 0;

    for (int j = 0; j < n; j++) {

        // Window ready?
        if (j - i + 1 == k) {

            // Find first negative
            boolean found = false;
            for (int idx = i; idx <= j; idx++) {
                if (arr[idx] < 0) {
                    System.out.println(arr[idx]);
                    found = true;
                    break;
                }
            }

            if (!found) {
                System.out.println("0");
            }

            i++;  // Slide
        }
    }
}

// Test: [12, -1, -7, 8, -15, 30, 16, 28], K=3
// Output: -1, -1, -7, -15, -15, 0
```

### Problem 2: Maximum in Each Window

```java
public static void maxInWindow(int[] arr, int k) {
    int i = 0;

    for (int j = 0; j < arr.length; j++) {

        if (j - i + 1 == k) {

            int max = Integer.MIN_VALUE;
            for (int idx = i; idx <= j; idx++) {
                max = Math.max(max, arr[idx]);
            }
            System.out.println(max);

            i++;
        }
    }
}

// Test: [1, 3, -1, -3, 5, 3, 6, 7], K=3
// Output: 3, 3, 5, 5, 6, 7
```

### Problem 3: Count Positives in Each Window

```java
public static void countPositivesInWindow(int[] arr, int k) {
    int i = 0;

    for (int j = 0; j < arr.length; j++) {

        if (j - i + 1 == k) {

            int count = 0;
            for (int idx = i; idx <= j; idx++) {
                if (arr[idx] > 0) count++;
            }
            System.out.println(count);

            i++;
        }
    }
}
```

---

## 🧠 THE MENTAL MODEL (Final Summary)

### Before Your Breakthrough:

```
"Let me remember... is it j < i+k or j <= i+k?"
→ Stress, confusion, mistakes
```

### After Your Breakthrough:

```
"How many elements? j - i + 1
When it equals k, I'm ready."
→ Confidence, clarity, correctness
```

---

## 🎓 PRACTICE CHECKLIST

Do these to lock in your understanding:

### ✅ Step 1: Dry Run These Arrays

```
Array: [5, 2, -1, 0, 3], K=3
Array: [1, -2, 3, -4, 5, 6], K=2
Array: [10, 20, 30, 40, 50], K=4
```

For each:

- Track `i`, `j`, and `j - i + 1`
- Note when window becomes ready
- Verify window slides correctly

### ✅ Step 2: Solve These Problems

1. Print sum of each window
2. Print first even number in each window
3. Count zeros in each window
4. Find minimum in each window

### ✅ Step 3: Challenge Yourself

- Can you convert the nested loop pattern to count-based?
- Can you explain why `j - i + 1 = k` works to a friend?
- Can you spot the mistake in code using `j <= i + k`?

---

## 🏆 SUCCESS INDICATORS

You've truly mastered sliding window when:

✅ You automatically think "How many elements?" instead of index bounds  
✅ You can dry-run any window problem in under 2 minutes  
✅ You feel confident during exams, not stressed  
✅ You can explain the pattern to others clearly  
✅ Level 4+ problems feel natural, not intimidating

---

## 🔥 FINAL WISDOM

**The formula `j < i + k` is correct, but it makes you think wrong.**

**The pattern `j - i + 1 == k` is also correct, and makes you think right.**

**Use the one that keeps your brain calm.**

---

## 📚 WHAT'S NEXT?

Now that sliding window is mastered, move to:

1. **Variable-size sliding window** (subarray sum = K)
2. **Two pointers** (pair sum, sorted arrays)
3. **Sliding window + HashMaps** (longest substring problems)

You're ready. 🚀

---

[← Section 0 — When Sliding Window Goes Wrong…](01_section_0_when_sliding_window_goes.md) | [Chapter overview](../01_Sliding_Window.md)
