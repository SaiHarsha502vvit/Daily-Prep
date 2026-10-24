# 🎯 PATTERN PROBLEM SOLVING CHEAT SHEET

> **Navigation**: [← ═══════════════════════════════════════════════════════════](05_section.md) | [Chapter overview](../09_Pattern_Programs_Complete.md)
> Page 6 of 6 in **Complete Pattern Programs - From Zero to Hero**


```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        PATTERN SOLVING FORMULAS                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  RIGHT TRIANGLE:  Row i → print (i+1) items, starting col=0                     │
│  LEFT TRIANGLE:   Row i → print (n-i) spaces, then (i+1) items                  │
│  PYRAMID:         Row i → print (n-i-1) spaces, then (2i+1) items               │
│  INVERTED:        Row i → print i spaces, then (2(n-i)-1) items                 │
│  DIAMOND:         Pyramid (0 to n-1) + Inverted Pyramid (n-2 to 0)              │
│  SANDGLASS:       Inverted (0 to n-1) + Pyramid (1 to n-1)                      │
│                                                                                 │
│  HOLLOW:          Print content only when:                                      │
│                   i==0 OR i==n-1 OR j==0 OR j==current_row_width-1              │
│                                                                                 │
│  NUMBER PATTERNS:                                                               │
│    Row number:     Print (i) for all columns                                    │
│    Column number:  Print (j) for all columns                                    │
│    Floyd's:        Use single counter (num++), don't reset                      │
│    Pascal's:       value = prev_value * (row - col) / col                       │
│                                                                                 │
│  CHARACTER PATTERNS:                                                            │
│    Convert: 'A' + index gives character                                         │
│    Wrap:    if (ch > 'Z') ch = 'A' or use '*'                                   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🏋️ Practice Order for Feb 10, 2026

| Day   | Patterns        | Focus                    |
| ----- | --------------- | ------------------------ |
| Day 1 | 1-4             | Basic triangles          |
| Day 2 | 5-8             | Pyramids & Diamond       |
| Day 3 | 9-12            | Hollow patterns          |
| Day 4 | N1-N5           | Basic number patterns    |
| Day 5 | N6-N10          | Advanced number patterns |
| Day 6 | C1-C5           | Alphabet patterns        |
| Day 7 | S1-S5           | Special patterns         |
| Day 8 | Interview Q1-Q5 | Real interview problems  |

---

### Topical Breadth — Pattern Construction Variant Trade-offs

Pattern programs have several alternative construction approaches that trade off readability, flexibility, and performance. **Clockwise vs counter-clockwise traversal** for diamond/sandglass patterns: building the upper half first (pyramid logic) then mirroring the lower half is the standard approach — the trade-off is that this requires two loops with a direction flag, whereas a single directional loop (starting wide, shrinking to a point, then reversing direction) is harder to reason about but produces cleaner symmetry in the code. **Clockwise** is the conventional mental model for pattern problems; counter-clockwise is equivalent but flips the role of leading-space vs trailing-space formulas, making it harder to adapt from standard references. For pattern symmetry problems, the clockwise-then-mirror approach is preferred because it directly mirrors the visual construction of the shape. **Nested loop vs single counter** for number patterns: Floyd's Triangle uses a single incrementing counter across all rows (cleaner, O(n^2) time regardless of n), while Pascal's Triangle recomputes binomial coefficients per element (more complex, same time complexity); the trade-off is that a single counter is simpler and less error-prone, while per-element computation is more flexible for custom formulas. For simple sequential patterns (Floyd's, sequential numbers), use a single counter. For mathematical patterns (Pascal's, Fibonacci), use per-element computation. **Recursive vs iterative** for fractal/symmetric patterns: recursion naturally expresses self-similarity (e.g., drawing a fractal tree or Sierpinski triangle) but risks stack overflow for depth > 1000; iteration avoids stack overflow but requires explicit state tracking that mirrors recursive call frames. The trade-off is that recursion is the natural language for self-similar patterns — writing it iteratively is possible but requires storing partial results explicitly, which is more error-prone. Use recursion for fractal patterns; use iteration for all linear patterns (triangles, pyramids, diamonds).

| Variant                                   | Time   | Space      | Readability                    | When to Prefer                                            |
| ----------------------------------------- | ------ | ---------- | ------------------------------ | --------------------------------------------------------- |
| Clockwise + mirror (standard)             | O(n^2) | O(1)       | High — follows visual order    | Most pattern programs; standard interview approach        |
| Counter-clockwise (reversed mental model) | O(n^2) | O(1)       | Lower — reversed formulas      | Only when adapting counter-clockwise reference solutions  |
| Single counter (Floyd's style)            | O(n^2) | O(1)       | High — no per-cell computation | Sequential number patterns, Floyd's Triangle              |
| Per-element computation (Pascal's style)  | O(n^2) | O(1)       | Lower — formula per cell       | Mathematical patterns where each cell is computed         |
| Recursive (fractal/symmetric)             | O(n^2) | O(n) stack | High for self-similar          | Fractal patterns, tree-like structures                    |
| Iterative (all cases)                     | O(n^2) | O(1)       | Medium — explicit state        | All linear patterns; required when depth may exceed stack |

For interviews, use the **standard clockwise + mirror approach** with nested loops — it is the most readable and directly maps to the visual output. Use a **single counter** for sequential patterns to minimize formula complexity. Reserve **recursion** for fractal or self-similar problems where the recursive definition is cleaner than the iterative equivalent.

_Master patterns = Master loops = Master DSA_

---



---

## Proof Corner -- Two Pointers O(n) Correctness

**Claim**: The two-pointer technique for finding a pair with a given sum in a sorted array runs in O(n) and is correct.

**Algorithm**: Initialize lo=0, hi=n-1. While lo < hi:
- If arr[lo]+arr[hi] == target: found.
- If arr[lo]+arr[hi] < target: lo++ (need larger sum).
- If arr[lo]+arr[hi] > target: hi-- (need smaller sum).

**Correctness proof**: We maintain the invariant: if a pair (a,b) exists with a=arr[i] for some i < lo, then b cannot be in arr[lo..hi] (because arr[lo]+arr[i's old pair] < target, and arr[lo] > arr[i], so arr[lo] + arr[hi] >= target; we needed a larger value for arr[i] but that would require hi >= hi_when_we_moved_lo, contradiction).

**Simpler argument by elimination**: Each lo++ eliminates arr[lo] as a valid left element for any remaining right element (too small). Each hi-- eliminates arr[hi] as a valid right element (too large). We only eliminate elements that cannot be part of a valid pair.

---

## When It Breaks -- Algorithm Patterns

**1. Two pointers on unsorted array** -- the elimination argument only works because the array is sorted. On an unsorted array, lo++ doesn't guarantee we've eliminated arr[lo] as a valid partner for all remaining elements. Fix: sort first (O(n log n)), or use a HashSet for O(n) on unsorted.

**2. Sliding window with invalid state** -- expanding the window when it's already invalid (before shrinking to fix the violation) leads to double-counting or missed elements. Fix: always shrink to a valid state before moving the right pointer forward.

**3. BFS/DFS layer confusion** -- using DFS to find shortest path (minimum edges) in an unweighted graph. DFS finds A path, not the SHORTEST path. Fix: always use BFS for shortest unweighted path.

**4. Missing visited set in graph traversal** -- DFS/BFS without a visited set revisits nodes, causing infinite loops in cyclic graphs. Symptom: StackOverflowError (DFS) or infinite loop (BFS).

---

## Reference Anchor

**JDK -- pattern-applicable utilities**:
```java
// Two pointers pattern -- standard Java idiom:
int lo = 0, hi = arr.length - 1;
while (lo < hi) {
    int sum = arr[lo] + arr[hi];
    if (sum == target) { /* found */ break; }
    else if (sum < target) lo++;
    else hi--;
}

// Sliding window pattern -- fixed size k:
int windowSum = 0;
for (int i = 0; i < k; i++) windowSum += arr[i]; // initial window
int maxSum = windowSum;
for (int i = k; i < arr.length; i++) {
    windowSum += arr[i] - arr[i-k]; // slide: add new, remove old
    maxSum = Math.max(maxSum, windowSum);
}

// BFS for shortest path:
int[] dist = new int[n];
Arrays.fill(dist, -1);
Queue<Integer> queue = new ArrayDeque<>();
dist[src] = 0; queue.offer(src);
while (!queue.isEmpty()) {
    int u = queue.poll();
    for (int v : adj[u]) if (dist[v] == -1) { dist[v] = dist[u]+1; queue.offer(v); }
}
```

---

## Brute Force to Optimal -- Common Patterns

| Pattern | Brute Force | Optimal | Condition |
|---------|-------------|---------|-----------|
| Pair sum in array | O(n^2) check all pairs | Two pointers O(n) | Sorted array |
| Subarray max/min | O(k) per window | Sliding window O(n) | Fixed-size window |
| Shortest path | DFS finds a path | BFS O(V+E) | Unweighted graph |
| Count subarrays with sum k | O(n^2) | Prefix sum + HashMap O(n) | Any array |
**Navigation**: [< Previous](../08b_NumberTheory_Advanced.md) | [Back to Index](../../00_MASTER_INDEX.md) | [Next >](../10_Bit_Manipulation_Complete.md)

---

[← ═══════════════════════════════════════════════════════════](05_section.md) | [Chapter overview](../09_Pattern_Programs_Complete.md)
