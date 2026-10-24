# Interview Problems <a name="interview-problems"></a>

> **Navigation**: [← Sliding Window Maximum/Minimum](02_sliding_window_maximum_minimum.md) | [Chapter overview](../15_Monotonic_Stack_Queue_Complete.md)
> Page 3 of 3 in **Monotonic Stack & Queue Complete Guide**


## Problem Categories

```
┌─────────────────────────────────────────────────────────────────┐
│              MONOTONIC STACK/QUEUE PROBLEMS                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  NEXT/PREVIOUS GREATER/SMALLER:                                 │
│  • Next Greater Element I/II                                    │
│  • Daily Temperatures                                           │
│  • Stock Span Problem                                           │
│                                                                 │
│  RECTANGLE PROBLEMS:                                            │
│  • Largest Rectangle in Histogram                               │
│  • Maximal Rectangle in Matrix                                  │
│  • Trapping Rain Water                                          │
│                                                                 │
│  SLIDING WINDOW:                                                │
│  • Sliding Window Maximum                                       │
│  • Shortest Subarray with Sum >= K                              │
│                                                                 │
│  STRING/NUMBER:                                                 │
│  • Remove K Digits                                              │
│  • Remove Duplicate Letters                                     │
│  • 132 Pattern                                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Stock Span Problem (LeetCode 901)

```java
/*
Find how many consecutive days (including today)
where price was <= today's price.
*/

class StockSpanner {
    Deque<int[]> stack;  // [price, span]

    public StockSpanner() {
        stack = new ArrayDeque<>();
    }

    public int next(int price) {
        int span = 1;

        // Pop days with lower price, accumulate their spans
        while (!stack.isEmpty() && stack.peek()[0] <= price) {
            span += stack.pop()[1];
        }

        stack.push(new int[]{price, span});
        return span;
    }
}
```

## Remove Duplicate Letters (LeetCode 316)

```java
/*
Remove duplicates to make smallest lexicographic string.
Must keep relative order. Each letter appears exactly once.
*/

public String removeDuplicateLetters(String s) {
    int[] count = new int[26];  // Remaining count
    boolean[] inStack = new boolean[26];

    for (char c : s.toCharArray()) {
        count[c - 'a']++;
    }

    Deque<Character> stack = new ArrayDeque<>();

    for (char c : s.toCharArray()) {
        count[c - 'a']--;

        if (inStack[c - 'a']) continue;  // Already in result

        // Pop larger chars if they appear later
        while (!stack.isEmpty() && stack.peek() > c && count[stack.peek() - 'a'] > 0) {
            inStack[stack.pop() - 'a'] = false;
        }

        stack.push(c);
        inStack[c - 'a'] = true;
    }

    StringBuilder sb = new StringBuilder();
    while (!stack.isEmpty()) {
        sb.append(stack.pop());
    }
    return sb.reverse().toString();
}
```

## Shortest Subarray with Sum >= K (LeetCode 862)

```java
/*
Find shortest subarray with sum >= k.
Use prefix sum + monotonic deque.
*/

public int shortestSubarray(int[] nums, int k) {
    int n = nums.length;
    long[] prefix = new long[n + 1];

    for (int i = 0; i < n; i++) {
        prefix[i + 1] = prefix[i] + nums[i];
    }

    Deque<Integer> deque = new ArrayDeque<>();
    int minLen = Integer.MAX_VALUE;

    for (int i = 0; i <= n; i++) {
        // Check if current prefix - front >= k
        while (!deque.isEmpty() && prefix[i] - prefix[deque.peekFirst()] >= k) {
            minLen = Math.min(minLen, i - deque.pollFirst());
        }

        // Maintain increasing deque (larger prefix won't help)
        while (!deque.isEmpty() && prefix[i] <= prefix[deque.peekLast()]) {
            deque.pollLast();
        }

        deque.offerLast(i);
    }

    return minLen == Integer.MAX_VALUE ? -1 : minLen;
}
```

## Sum of Subarray Minimums (LeetCode 907)

```java
/*
Find sum of minimum elements in all subarrays.
For each element, count how many subarrays it's the minimum of.
*/

public int sumSubarrayMins(int[] arr) {
    int n = arr.length;
    int MOD = 1_000_000_007;

    // For each element, find:
    // - left: how far left we can extend while being minimum
    // - right: how far right we can extend while being minimum
    int[] left = new int[n];   // Previous smaller or equal
    int[] right = new int[n];  // Next smaller

    Deque<Integer> stack = new ArrayDeque<>();

    // Previous smaller or equal
    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && arr[stack.peek()] > arr[i]) {
            stack.pop();
        }
        left[i] = stack.isEmpty() ? i + 1 : i - stack.peek();
        stack.push(i);
    }

    stack.clear();

    // Next smaller (strictly)
    for (int i = n - 1; i >= 0; i--) {
        while (!stack.isEmpty() && arr[stack.peek()] >= arr[i]) {
            stack.pop();
        }
        right[i] = stack.isEmpty() ? n - i : stack.peek() - i;
        stack.push(i);
    }

    // Calculate contribution of each element
    long result = 0;
    for (int i = 0; i < n; i++) {
        result = (result + (long) arr[i] * left[i] * right[i]) % MOD;
    }

    return (int) result;
}
```

## Why `left[i] * right[i]` Counts the Subarrays Where `arr[i]` Is the Minimum — Derived

The code above calls `arr[i] * left[i] * right[i]` and trusts it. Most people do. The product looks like it fell out of the sky — but it's the *only* quantity that works, and once you see why, you can re-derive it on any "contribution-style" problem (subarray maximums, sum of subarray ranges, number of subarrays where X is the strict max/min). The trick is to stop thinking about subarrays and start thinking about each element's **territory**.

**The territory view.** Every subarray has a minimum. So every subarray is "owned" by exactly one element — whichever element is its minimum. To compute the sum, you ask each element: *how many subarrays do you own, and what is your value in each one?* Then sum `value × count` over all elements. That's it. No clever enumeration of subarrays — just delegate.

**The counting question: how many subarrays has `arr[i]` as its minimum?** A subarray `[L, R]` (with `L ≤ i ≤ R`) has `arr[i]` as its minimum if and only if:
1. `arr[i]` is smaller than everything to its left inside the subarray: every element in `[L, i-1]` is `> arr[i]`. So `L` cannot extend past the nearest element to the left that is **≤ arr[i]** (call its index `L_min - 1` is the leftmost legal `L`). The number of valid `L` choices is `i - L_min + 1` = distance to previous-smaller-or-equal.
2. `arr[i]` is smaller than everything to its right inside the subarray: every element in `[i+1, R]` is `≥ arr[i]`. So `R` cannot extend past the nearest element to the right that is **< arr[i]** (call its index `R_min - 1`). The number of valid `R` choices is `R_min - i` = distance to next-smaller-strict.

**The multiplication is forced by independence.** Choosing `L` and choosing `R` are independent decisions — once you pick `L` (any legal one), every legal `R` still gives a valid subarray. So total subarrays owned by `arr[i]` = `(# valid L) × (# valid R)` = `left[i] * right[i]`. There's no other shape the answer can take; subarrays are products of left-extension and right-extension choices.

```
            i
... [ ≤ ] [arr[i]] [ < ] ...
     ↑                ↑
   L choices      R choices
   left[i]        right[i]
   = i - prevSmallerOrEqual(i)
   = nextSmallerStrict(i) - i
```

**The asymmetry that breaks the formula if you get it wrong.** Notice the *asymmetry* in the bounds: on the left we stop at "smaller OR EQUAL," on the right we stop at "smaller STRICT." Why? Because of duplicates. Suppose `arr = [3, 1, 3]`. Both the left `3` and the right `3` equal `arr[1] = 1`'s value… wait, that's not the case here. Better example: `arr = [1, 1]`. The subarrays are `[1]₀`, `[1]₁`, `[1, 1]`. The minimum of each is `1`. Naively, `arr[0]` "wants" to own `[1]₁` and `[1, 1]`, and `arr[1]` "wants" to own `[1]₀` and `[1, 1]`. Both can't own `[1, 1]`. The asymmetry rule says: equal values are "owned" by the leftmost one. So `arr[0]` owns all three; `arr[1]` owns only `[1]₁`. Implementation: use **strict** `<` on the left (prev smaller *strict*, so equals stay in stack and become `arr[1]`'s left boundary) and **non-strict** `<=` on the right (next smaller *or equal*, so equals block `arr[1]`'s right boundary). Or vice versa — pick one side to "own ties" and stick with it. **If both sides are strict, every duplicate is double-counted; if both sides are non-strict, every duplicate is missed.** This is the single most common bug in this problem.

**The invariant you can feel.** Throughout the scan, the stack is not just "monotonic" — it's a **sorted list of elements still waiting to find their next-greater-or-smaller**. The invariant is: "for every element on the stack, the answer (whatever it is — NGE, prev smaller, etc.) has not yet arrived." The moment a new element arrives that *resolves* an answer, the affected element pops. Every pop is an "answer event." That's why the algorithm is O(n): every element experiences exactly one push (entering the waiting list) and exactly one pop (its answer event firing), so total work is 2n. The structure *is* the invariant.

**Generalization recipe** (apply this to any "sum over subarrays where X is the min/max" problem):
1. For each element, find its `left[i]` = distance to the previous element that would *disqualify* it from being the min/max on the left.
2. Find its `right[i]` = distance to the next element that would *disqualify* it on the right.
3. Contribution = `value[i] × left[i] × right[i]`. Sum.
4. Decide tie-ownership direction once (left wins or right wins) and apply the corresponding strict/non-strict asymmetry consistently.

This pattern also gives you: sum of subarray maximums (mirror with `>` instead of `<`), count of subarrays where `arr[i]` is the strict minimum (just `left[i] * right[i]` as a count), and the "subarray range sum" problem (sum of max - sum of min, same machinery on both sides).

🔬 **Section Challenge — Contribution Counting**

**Challenge 1 (Sum of Subarray Minimums, 12 min):** For `arr = [3, 1, 2, 4, 1]`, compute by hand the contribution of `arr[4] = 1` (the last element) to the total sum. Then compute `arr[1] = 1`'s contribution. Why are they different — and what does that tell you about the asymmetry rule?

<details><summary>Answer</summary>

For `arr[4] = 1`:
- Previous smaller-or-equal: there is no element to the left that is `≤ 1` (the only equal-or-smaller candidate, `arr[1] = 1`, is `≤ 1`, but check: is `arr[1] ≤ arr[4]`? `1 ≤ 1`, yes — so prev smaller-or-equal index = 1). So `left[4] = 4 - 1 = 3`.
- Next smaller-strict: nothing to the right is `< 1`. So `right[4] = n - 4 = 1`.
- Contribution = `1 × 3 × 1 = 3`. The 3 subarrays owned by `arr[4]` are `[3,1,2,4,1]`, `[2,4,1]`, `[4,1]`.

For `arr[1] = 1`:
- Previous smaller-or-equal: nothing to the left. `left[1] = 1 + 1 = 2`.
- Next smaller-strict: nothing to the right is `< 1`. `right[1] = 5 - 1 = 4`.
- Contribution = `1 × 2 × 4 = 8`. The 8 subarrays owned by `arr[1]` are every subarray that contains index 1 except `[3,1]`, `[3,1,2]`, `[3,1,2,4]` — those three are "stolen" by `arr[4]` because `arr[4]` is also `1` and the asymmetry says left wins ties.

Notice: `arr[1]` and `arr[4]` have the same value but vastly different contributions (`8` vs `3`). That's because `arr[4]` is closer to the right edge AND there are duplicates — and the asymmetry rule resolves the tie in `arr[1]`'s favor (left wins). If you used strict on both sides, both `1`s would claim the same 3 "middle" subarrays and you'd double-count. If you used non-strict on both sides, the middle ones would be claimed by neither. The asymmetry is the tiebreaker.

</details>

---

## Quick Reference <a name="quick-reference"></a>

### Which Stack Type to Use

```
┌─────────────────────────────────────────────────────────────────┐
│              STACK TYPE SELECTION                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DECREASING STACK (larger at bottom):                           │
│  • Next/Previous GREATER element                                │
│  • Largest rectangle (find boundaries)                          │
│  • Stock span (count higher prices)                             │
│                                                                 │
│  INCREASING STACK (smaller at bottom):                          │
│  • Next/Previous SMALLER element                                │
│  • Sum of subarray minimums                                     │
│  • Remove K digits                                              │
│                                                                 │
│  MEMORY TRICK:                                                  │
│  • Finding GREATER → maintain DECREASING                        │
│  • Finding SMALLER → maintain INCREASING                        │
│  (The stack is the "opposite" of what you're looking for)       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Code Templates

```java
// TEMPLATE: Next Greater Element
public int[] nextGreater(int[] arr) {
    int n = arr.length;
    int[] result = new int[n];
    Arrays.fill(result, -1);
    Deque<Integer> stack = new ArrayDeque<>();  // Decreasing

    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && arr[stack.peek()] < arr[i]) {
            result[stack.pop()] = arr[i];
        }
        stack.push(i);
    }
    return result;
}

// TEMPLATE: Previous Greater Element
public int[] prevGreater(int[] arr) {
    int n = arr.length;
    int[] result = new int[n];
    Arrays.fill(result, -1);
    Deque<Integer> stack = new ArrayDeque<>();

    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && arr[stack.peek()] <= arr[i]) {
            stack.pop();
        }
        if (!stack.isEmpty()) result[i] = arr[stack.peek()];
        stack.push(i);
    }
    return result;
}

// TEMPLATE: Sliding Window Maximum
public int[] maxWindow(int[] arr, int k) {
    int[] result = new int[arr.length - k + 1];
    Deque<Integer> deque = new ArrayDeque<>();  // Decreasing

    for (int i = 0; i < arr.length; i++) {
        // Remove out-of-window
        if (!deque.isEmpty() && deque.peekFirst() < i - k + 1) {
            deque.pollFirst();
        }
        // Maintain decreasing
        while (!deque.isEmpty() && arr[deque.peekLast()] < arr[i]) {
            deque.pollLast();
        }
        deque.offerLast(i);
        // Record result
        if (i >= k - 1) {
            result[i - k + 1] = arr[deque.peekFirst()];
        }
    }
    return result;
}
```

### Complexity Summary

```
┌─────────────────────────────────────────────────────────────────┐
│              MONOTONIC STACK/QUEUE COMPLEXITIES                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Next Greater Element:            O(n) time, O(n) space         │
│  Daily Temperatures:              O(n) time, O(n) space         │
│  Largest Rectangle Histogram:     O(n) time, O(n) space         │
│  Sliding Window Maximum:          O(n) time, O(k) space         │
│  Remove K Digits:                 O(n) time, O(n) space         │
│                                                                 │
│  KEY INSIGHT:                                                   │
│  Each element is pushed and popped at most ONCE.                │
│  Total operations = 2n → O(n)                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary

```
╔═══════════════════════════════════════════════════════════════╗
║         MONOTONIC STACK/QUEUE - MASTER CHECKLIST              ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  1. IDENTIFY THE PATTERN                                      ║
║     • "Next greater/smaller" → Monotonic Stack                ║
║     • "Sliding window max/min" → Monotonic Queue              ║
║     • "Rectangle area" → Usually needs both boundaries        ║
║                                                               ║
║  2. CHOOSE STACK TYPE                                         ║
║     • Looking for GREATER → Decreasing stack                  ║
║     • Looking for SMALLER → Increasing stack                  ║
║                                                               ║
║  3. KNOW WHEN ANSWER IS FOUND                                 ║
║     • Next element: Answer when POPPING                       ║
║     • Previous element: Answer when PUSHING (check top)       ║
║                                                               ║
║  4. HANDLE EDGE CASES                                         ║
║     • No greater/smaller exists: default to -1 or n           ║
║     • Circular array: iterate 2n times                        ║
║     • Duplicates: decide on < vs ≤ carefully                  ║
║                                                               ║
║  5. COMMON APPLICATIONS                                       ║
║     • Histogram problems                                      ║
║     • Temperature/Stock problems                              ║
║     • String manipulation                                     ║
║     • Sliding window extremes                                 ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

**Pro Tip:** When you see "next greater/smaller", "sliding window max/min", or problems involving "how far can we extend", think monotonic stack/queue!

---

---

---

## 📎 Reference Anchor

**OpenJDK `ArrayDeque` — the production monotonic stack/queue**
- `ArrayDeque`: [ArrayDeque.java](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/ArrayDeque.java) — backed by a circular array; `offerFirst/Last()` and `pollFirst/Last()` all O(1) amortized. **Invariant**: `head` and `tail` indices modulo capacity; `size = (tail - head) & (elements.length - 1)`.
- **Local rewrite rule**: Never use `java.util.Stack` or `LinkedList` as a stack/queue for monotonic operations — `Stack` is synchronized (10-50× slower), `LinkedList` has O(1) amortized but worse cache locality than `ArrayDeque`'s contiguous array.
- **Constraint warning**: `ArrayDeque.peekFirst()` / `peekLast()` return `null` on empty deque (not exception). For monotonic stack, always check `!dq.isEmpty()` before peeking. Using `peek()` without the check is a silent NPE on the first element.

---

## When Monotonic Stack/Queue Breaks

### 1. Wrong Monotonic Direction — Increasing vs Decreasing
**What breaks**: "Next Greater Element" requires a *decreasing* monotonic stack (pop when arr[i] > stack.top). Using an *increasing* stack instead produces "Next Smaller Element." The direction is load-bearing and the bug is silent — results look plausible but are systematically wrong.
**Mnemonic**: "What do I pop for?" If you pop when you find something BIGGER → the popped elements needed BIGGER → you're finding next greater. If you pop when you find something SMALLER → finding next smaller.

### 2. Sliding Window Max — Queue Direction and Window Expiry
**What breaks**: Monotonic deque for sliding window max must:
  a. Pop from FRONT when `deque.peekFirst() < i - k` (element left the window).
  b. Pop from BACK when `arr[i] >= arr[deque.peekLast()]` (new element dominates older smaller ones).
Swapping a or b causes wrong answers — missing expired elements or keeping dominated elements.

### 3. Storing Values Instead of Indices
**What breaks**: Storing `arr[i]` in the deque instead of `i`. When you need to check if an element is outside the sliding window (`deque.peekFirst() < i - k`), you can't — you stored the value, not the index.
**Fix**: Always store indices in the deque. Access the value via `arr[deque.peekFirst()]`.

---

## Proof Corner

### Monotonic Stack O(n) — Each Element Pushed and Popped Exactly Once

**Claim**: A monotonic stack processes an array of n elements in O(n) total time, even though the inner `while (!stack.isEmpty() && ...)` loop runs many times.

**Proof**: Consider the total number of push and pop operations across the entire algorithm.
- Each element is pushed at most once (when we process index i, we push i once).
- Each element is popped at most once (once an element is popped from the stack, it is never re-pushed).
- Total pushes ≤ n. Total pops ≤ n.
- Therefore: total operations = pushes + pops ≤ 2n = O(n). □

**Key insight**: The apparent O(n²) from the nested `while` loop is a fallacy. The inner loop doesn't run n times *per outer iteration* — it runs *in total* at most n times across all outer iterations. This is the "aggregate method" of amortized analysis.

🔬 **Section Challenge — Monotonic Stack/Queue**

**Challenge 1 (Analysis — 8 min):** Prove that the monotonic stack algorithm for "Next Greater Element" runs in O(n) time even though there is a `while` loop inside the `for` loop.

<details><summary>Model Answer</summary>

Use the aggregate amortized method. Consider the total number of push and pop operations:
- Each of the n elements is pushed exactly once (when i = that element's index).
- Each element is popped at most once (once popped, it is never re-pushed).
- Total pushes = n, total pops ≤ n.
- All other work per iteration is O(1) (the `arr[i] > arr[stack.peek()]` comparison and the `result[popped] = arr[i]` assignment).

Therefore: total work = O(pushes + pops + n comparisons) = O(n + n + n) = O(n).

The `while` loop amortizes over all iterations of the `for` loop — it can run a total of at most n times, not n times per iteration.

</details>

---

[← Sliding Window Maximum/Minimum](02_sliding_window_maximum_minimum.md) | [Chapter overview](../15_Monotonic_Stack_Queue_Complete.md)
