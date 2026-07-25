

---

## Reality Check

**"Monotonic stacks are a special data structure"** → A monotonic stack is just a regular stack with a USAGE PATTERN — you only push in a way that maintains a monotonic (always increasing or always decreasing) order. The stack itself is `ArrayDeque` or `int[]`. The invariant: before pushing element x, pop all elements that violate the monotonic property. The popped elements are those for which x is the "answer" (first smaller to the right, next greater element, etc.).

**"Next Greater Element and Next Smaller Element are different problems needing different solutions"** → Same monotonic stack pattern, just reversed. Next Greater Element: maintain a monotonically decreasing stack (stack holds elements without a greater element seen yet). Next Smaller Element: maintain a monotonically increasing stack. The pattern is identical — only the comparison direction changes. Similarly, "previous" versions of these problems are solved by iterating from right to left.

**"Sliding window maximum requires a deque — you can't use a stack"** → Correct — sliding window maximum uses a monotonic deque (monotonically decreasing, front = current window maximum). You need to: add to the back (new element), remove from the front (elements that left the window by index), remove from the back (smaller elements that will never be maximum). Stack only allows one-end access; deque allows both ends. This is the key problem that distinguishes when to use deque vs stack.

**"Monotonic stacks only solve "next greater element" style problems"** → They solve: largest rectangle in a histogram (classic O(n) — pop when you find a shorter bar), trapping rain water (pop when right bar is taller than left), sum of subarray minimums (for each element, compute how many subarrays it is the minimum of via left/right boundaries), remove k digits to make smallest number, maximum width ramp. The common pattern: for each element, find the nearest previous/next element that is smaller/larger.

**"Using a stack here makes the solution O(n) but I don't understand why"** → Each element is pushed ONCE and popped ONCE. Total operations = 2n. Even though there's a while loop inside the for loop, the total iterations across ALL calls to the while loop is bounded by n (each element can only be popped once). This amortised analysis pattern applies to any algorithm where each element enters and exits a data structure exactly once — it's the same reasoning as why array amortised append is O(1).
