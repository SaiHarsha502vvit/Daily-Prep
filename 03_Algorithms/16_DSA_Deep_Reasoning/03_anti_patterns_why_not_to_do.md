# 13. Anti-Patterns — WHY NOT to Do Certain Things

> **Navigation**: [← 12. How to Articulate DSA Solutions in…](02_how_to_articulate_dsa_solutions_in.md) | [Chapter overview](../16_DSA_Deep_Reasoning.md)
> Page 3 of 3 in **DSA Deep Reasoning**


## Common DSA Anti-Patterns That Lose Interviews

```
╔══════════════════════════════════════════════════════════════════╗
║  ANTI-PATTERN 1: Using HashMap When Sorting Is Simpler           ║
║                                                                  ║
║  Problem: "Find if array has duplicates"                          ║
║  ❌ Overkill: HashMap O(n) time, O(n) space                      ║
║  ✅ Better: Sort first O(n log n), then check adjacent O(n)      ║
║     → Same effective speed, O(1) extra space (in-place sort)     ║
║                                                                  ║
║  WHEN HashMap IS better: When you need the COUNT of each         ║
║  element, or when the original order matters (sorting destroys   ║
║  it), or when the data is streaming and you can't sort.          ║
╚══════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════╗
║  ANTI-PATTERN 2: Premature Optimization                          ║
║                                                                  ║
║  Problem: Input size is ≤ 100                                     ║
║  ❌ Bad: "I'll use a Segment Tree for O(log n) range queries"     ║
║  ✅ Good: "n ≤ 100, so O(n²) brute force takes 10,000 ops —     ║
║     perfectly fine. Simpler code = fewer bugs = faster delivery." ║
║                                                                  ║
║  RULE: If n ≤ 1000, O(n²) is fine (~10⁶ ops).                   ║
║        If n ≤ 10⁶, need O(n log n) (~2×10⁷ ops).                ║
║        If n ≤ 10⁸, need O(n) (~10⁸ ops).                        ║
║        ~10⁸ operations per second is a safe estimate.             ║
╚══════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════╗
║  ANTI-PATTERN 3: Using Recursion Without Considering Stack       ║
║                                                                  ║
║  Problem: Tree traversal on very deep tree (100,000+ nodes)      ║
║  ❌ Bad: Recursive DFS → StackOverflowError at ~10,000 depth     ║
║  ✅ Good: Iterative DFS with explicit stack (no depth limit)     ║
║                                                                  ║
║  WHEN recursion IS fine: Balanced trees (depth ≤ log₂(n) ≈ 20   ║
║  for 1 million nodes), problems with small n, or when the        ║
║  recursive solution is dramatically clearer.                     ║
╚══════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════╗
║  ANTI-PATTERN 4: Greedy When DP Is Needed                        ║
║                                                                  ║
║  Problem: "Minimum coins to make change"                          ║
║  Coins = [1, 3, 4], target = 6                                   ║
║  ❌ Greedy: Take largest first → 4+1+1 = 3 coins                 ║
║  ✅ DP: Considers all options → 3+3 = 2 coins                    ║
║                                                                  ║
║  HOW TO DETECT: Try to find a counterexample. If "always take    ║
║  the locally best choice" fails for ANY input, you need DP.      ║
║  Greedy works ONLY when local optimum = global optimum, which    ║
║  requires mathematical proof (exchange argument or greedy stays  ║
║  ahead argument).                                                ║
╚══════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════╗
║  ANTI-PATTERN 5: BFS When DFS Is Correct (and Vice Versa)        ║
║                                                                  ║
║  Problem: "Does a path exist from A to B?"                        ║
║  ❌ Using BFS: Correct but wastes O(width) memory on wide graphs ║
║  ✅ Using DFS: Same correctness, O(depth) memory — much less     ║
║                                                                  ║
║  Problem: "What's the shortest path from A to B?"                 ║
║  ❌ Using DFS: May find a path, but NOT guaranteed shortest!     ║
║  ✅ Using BFS: Level-by-level = first path found IS shortest     ║
║     (in unweighted graphs)                                       ║
║                                                                  ║
║  MATHEMATICAL PROOF — BFS gives shortest path:                    ║
║  BFS explores nodes in order of distance from source.            ║
║  At step k, all nodes at distance k are in the queue.            ║
║  If node v is first dequeued at step k, no shorter path exists   ║
║  (otherwise v would have been seen at step < k). □               ║
╚══════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════╗
║  ANTI-PATTERN 6: Using Sets/Maps for Tiny Data                   ║
║                                                                  ║
║  Problem: "Check if char is a vowel"                              ║
║  ❌ Overkill: Set<Character> vowels = Set.of('a','e','i','o','u')║
║     → Hash computation + set lookup for 5 elements!              ║
║  ✅ Better: "aeiouAEIOU".indexOf(c) >= 0                         ║
║     → Simple string scan, faster for tiny sets                   ║
║  ✅ Best: switch/case or boolean array (O(1) lookup, no hash)    ║
║                                                                  ║
║  RULE OF THUMB: For < ~30 elements, a sorted array with binary   ║
║  search or even a linear scan beats HashMap due to overhead.     ║
╚══════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════╗
║  ANTI-PATTERN 7: String Concatenation in Loops                   ║
║                                                                  ║
║  ❌ O(n²): String is immutable in Java. Each += creates a new    ║
║     String object and copies all previous characters.            ║
║     Loop of n iterations: 1+2+3+...+n = n(n+1)/2 = O(n²) chars  ║
║     copied total.                                                ║
║                                                                  ║
║     String result = "";                                           ║
║     for (String s : list) result += s;  // O(n²) !               ║
║                                                                  ║
║  ✅ O(n): StringBuilder uses a resizable char array. Appending   ║
║     is amortized O(1). Total: O(n).                              ║
║                                                                  ║
║     StringBuilder sb = new StringBuilder();                       ║
║     for (String s : list) sb.append(s);  // O(n)                 ║
╚══════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════╗
║  ANTI-PATTERN 8: Not Considering Integer Overflow                ║
║                                                                  ║
║  ❌ Bug: int mid = (left + right) / 2;                            ║
║     If left + right > Integer.MAX_VALUE → negative number!       ║
║  ✅ Fix: int mid = left + (right - left) / 2;                    ║
║     Mathematically identical, but never overflows.               ║
║                                                                  ║
║  ❌ Bug: int product = a * b;  // may overflow                    ║
║  ✅ Fix: long product = (long) a * b;  // cast before multiply   ║
║                                                                  ║
║  INTERVIEW TIP: Mentioning overflow handling unprompted shows     ║
║  production experience — interviewers notice.                    ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 14. Mathematical Proof Techniques for Interviews

### You Don't Need Formal Proofs — But Proof Sketches Win Interviews

```
╔══════════════════════════════════════════════════════════════════╗
║  TECHNIQUE 1: LOOP INVARIANT — Prove Your Algorithm Is Correct   ║
║                                                                  ║
║  A loop invariant is a condition that is TRUE before and after   ║
║  every iteration of a loop. If you can state it, you've proven  ║
║  your algorithm is correct.                                      ║
║                                                                  ║
║  EXAMPLE: Binary Search                                           ║
║  Invariant: "If target exists, it is in arr[left..right]"        ║
║  • Before loop: left=0, right=n-1 → entire array. ✅             ║
║  • Each iteration: mid = (left+right)/2                          ║
║    - If arr[mid] < target → target must be in right half         ║
║      → set left = mid+1. Invariant preserved. ✅                 ║
║    - If arr[mid] > target → target must be in left half          ║
║      → set right = mid-1. Invariant preserved. ✅                ║
║  • Loop ends when left > right → search space is empty           ║
║    → target not found (or was found during loop). ✅             ║
║                                                                  ║
║  INTERVIEW PHRASE: "The invariant I'm maintaining is that        ║
║  [condition]. Each step preserves this by [reasoning]."          ║
╚══════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════╗
║  TECHNIQUE 2: CONTRADICTION — Prove No Better Solution Exists    ║
║                                                                  ║
║  "Assume there exists a better solution S*. Show that S* leads  ║
║  to a contradiction, therefore our solution is optimal."          ║
║                                                                  ║
║  EXAMPLE: Two Sum with Sorted Array + Two Pointers               ║
║  Claim: We never skip a valid pair.                               ║
║  Proof: Suppose we skip pair (i,j) where arr[i]+arr[j]=target.  ║
║  • If left passed i: left moved right because                    ║
║    arr[left]+arr[right] < target. Since arr[left] ≤ arr[i]      ║
║    and arr[right] ≥ arr[j], we'd have                            ║
║    arr[i]+arr[j] ≤ arr[i]+arr[right], but arr[left]+arr[right]  ║
║    < target, and we moved left. This means arr[i]+arr[right] ≥  ║
║    target (since i ≥ left), contradiction with arr[left] < need. ║
║  • The monotonic property ensures no valid pair is skipped. □    ║
║                                                                  ║
║  INTERVIEW PHRASE: "This works because if we could skip a valid ║
║  answer, the monotonic property would be violated."              ║
╚══════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════╗
║  TECHNIQUE 3: EXCHANGE ARGUMENT — Prove Greedy Works             ║
║                                                                  ║
║  "Take any optimal solution. Show that swapping one element for  ║
║  the greedy choice doesn't make it worse → greedy is optimal."   ║
║                                                                  ║
║  EXAMPLE: Activity Selection (pick max non-overlapping events)   ║
║  Greedy: Always pick the event that ends EARLIEST.                ║
║  Proof: Suppose optimal solution O picks event X first, but      ║
║  greedy picks event G first (G ends earlier or same as X).       ║
║  Replace X with G in O. Since G ends ≤ X, G doesn't conflict    ║
║  with any remaining events in O. So |O| remains the same.       ║
║  We didn't lose any events → greedy is at least as good. □       ║
║                                                                  ║
║  INTERVIEW PHRASE: "Greedy works here because swapping any       ║
║  choice for the greedy choice never reduces the solution quality."║
╚══════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════╗
║  TECHNIQUE 4: AMORTIZED ANALYSIS — "Expensive Operations Are     ║
║  Rare, So It Averages Out"                                       ║
║                                                                  ║
║  EXAMPLE: Dynamic Array (ArrayList) resize                        ║
║  • Most append operations: O(1) — just place element             ║
║  • When array is full: O(n) — copy everything to new 2x array   ║
║                                                                  ║
║  "But resize is rare!" How rare?                                  ║
║  Array doubles: size 1→2→4→8→16→...→n                            ║
║  Copies: 1+2+4+8+...+n = 2n-1 total copies for n insertions     ║
║  Amortized cost per insertion: (2n-1)/n ≈ 2 = O(1)              ║
║                                                                  ║
║  EXAMPLE: Sliding Window with inner while-loop                    ║
║  "The while-loop inside the for-loop looks O(n²), but each      ║
║  element enters and leaves the window at most once.              ║
║  Total work across all iterations ≤ 2n = O(n)."                  ║
║                                                                  ║
║  INTERVIEW PHRASE: "This looks like it could be O(n²) because   ║
║  of the nested loop, but each element is processed at most       ║
║  twice (once added, once removed), so the total work across all  ║
║  iterations is O(n) — which is amortized O(1) per element."      ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 15. Pattern-to-Problem Mapping — The Interview Cheat Sheet

### "I see the problem. Which pattern do I use?"

| Problem Signal                      | Pattern To Use                             |
| ----------------------------------- | ------------------------------------------ |
| "Find pair with target sum"         | Two Pointers (sorted) / HashMap (unsorted) |
| "Longest/shortest substring with X" | Sliding Window                             |
| "K-th largest/smallest"             | Heap (PriorityQueue)                       |
| "Top K frequent"                    | HashMap + Heap                             |
| "Detect cycle"                      | Floyd's (slow+fast pointer) / DFS          |
| "Shortest path (unweighted)"        | BFS                                        |
| "Shortest path (weighted)"          | Dijkstra                                   |
| "Number of islands / connected"     | DFS/BFS on grid / Union-Find               |
| "All permutations/combinations"     | Backtracking                               |
| "Can/Cannot partition"              | DP (usually knapsack variant)              |
| "Minimum/Maximum cost/path"         | DP                                         |
| "Valid parentheses / nesting"       | Stack                                      |
| "Next greater element"              | Monotonic Stack                            |
| "Merge intervals / overlapping"     | Sort by start + sweep                      |
| "Binary matrix/grid traversal"      | BFS/DFS with visited array                 |
| "Search in sorted array"            | Binary Search                              |
| "Prefix sum questions"              | Prefix Sum Array / HashMap                 |
| "Find missing/duplicate in 1..n"    | Cyclic Sort / XOR / Math                   |
| "Build order / task dependencies"   | Topological Sort (DFS/Kahn's)              |
| "Palindrome substring"              | Expand around center / DP                  |
| "Linked list operations"            | Two Pointers + Dummy Node                  |
| "Level-order / zigzag tree"         | BFS with level tracking                    |
| "Serialize/deserialize tree"        | DFS preorder + delimiter                   |
| "Meeting rooms / intervals"         | Sort + heap or sweep line                  |
| "Stock buy/sell"                    | Kadane's / State Machine DP                |
| "Word search in grid"               | DFS + Backtracking                         |
| "LRU/LFU Cache"                     | HashMap + Doubly Linked List               |
| "Range sum / update queries"        | Segment Tree / BIT (Fenwick Tree)          |
| "String matching"                   | KMP / Rabin-Karp / Trie                    |

### Complexity Quick-Reference by Pattern

| Pattern         | Time           | Space    | When To Use            |
| --------------- | -------------- | -------- | ---------------------- |
| Two Pointers    | O(n)           | O(1)     | Sorted or in-place     |
| Sliding Window  | O(n)           | O(k)     | Contiguous subarray    |
| Binary Search   | O(log n)       | O(1)     | Sorted, monotonic      |
| HashMap lookup  | O(n)           | O(n)     | Need fast lookups      |
| Sorting + scan  | O(n log n)     | O(1)\*   | Order matters          |
| Heap (top-K)    | O(n log k)     | O(k)     | Stream / top-K         |
| BFS             | O(V+E)         | O(V)     | Shortest path          |
| DFS             | O(V+E)         | O(V)     | Explore all paths      |
| Backtracking    | O(k × nᵏ)      | O(k)     | All combinations       |
| DP (1D)         | O(n)           | O(n)\*   | Optimal substructure   |
| DP (2D)         | O(n×m)         | O(n×m)\* | Two sequences          |
| Union-Find      | O(α(n)) ≈ O(1) | O(n)     | Connectivity           |
| Monotonic Stack | O(n)           | O(n)     | Next greater/smaller   |
| Trie            | O(m)           | O(Σ×m)   | Prefix matching        |
| Segment Tree    | O(log n)       | O(n)     | Range queries + update |

_Space can often be optimized with rolling array (O(n) -> O(1) or O(n/row))._

---

## 16. Edge Cases That Break Solutions — The Interview Killer List

Every experienced interviewer tests these. Mention them **before** the interviewer asks:

| Category      | Edge Cases To Always Check                                                                                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Array         | Empty array `[]`<br>Single element `[5]`<br>All elements same `[3,3,3,3]`<br>Already sorted / reverse sorted<br>Negative numbers, zeros<br>Integer overflow (sum of two large ints) |
| String        | Empty string `""`<br>Single character `"a"`<br>All same characters `"aaaa"`<br>Unicode / special characters<br>Case sensitivity (`"A"` vs `"a"`)                                    |
| Linked List   | Empty list (`head = null`)<br>Single node<br>Cycle in the list<br>Head needs to be removed<br>Use dummy node to avoid special cases                                                 |
| Tree          | Empty tree (`root = null`)<br>Single node (leaf)<br>Skewed tree (all left or all right)<br>Depth = n, not log n                                                                     |
| Graph         | Disconnected graph (multiple components)<br>Self-loops, parallel edges<br>Single node, no edges<br>Negative edge weights (Dijkstra fails)                                           |
| Binary Search | Empty array<br>Target smaller than all elements<br>Target larger than all elements<br>Duplicates (leftmost vs rightmost vs any)<br>Off-by-one: `left <= right` vs `left < right`    |
| DP            | Base cases (`dp[0]`, `dp[1]`)<br>Negative values in input<br>Very large n (can we optimize space?)                                                                                  |

### The "Negative Numbers" Trap — Why It Breaks Common Algorithms

```
╔══════════════════════════════════════════════════════════════════╗
║  Sliding Window BREAKS with negative numbers:                    ║
║                                                                  ║
║  Problem: "Maximum subarray sum of length K"                      ║
║  [2, -3, 5, 1, -2, 4], K=3                                      ║
║  Sliding window works: just slide and track sum. ✅               ║
║                                                                  ║
║  Problem: "Smallest subarray with sum ≥ target"                   ║
║  [2, -3, 5, 1, -2, 4], target=5                                  ║
║  Sliding window FAILS: when right adds a negative number,        ║
║  shrinking from left may skip valid answers because the          ║
║  sum is no longer monotonically increasing with window size.     ║
║                                                                  ║
║  WHY: Sliding window relies on the invariant that expanding     ║
║  the window INCREASES the sum (or count). Negative numbers      ║
║  break this monotonicity.                                        ║
║                                                                  ║
║  SOLUTION: Use prefix sums + monotonic deque or binary search   ║
║  on prefix sums, which handle non-monotonic sums correctly.     ║
╚══════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════╗
║  Dijkstra BREAKS with negative edges:                            ║
║                                                                  ║
║  Dijkstra assumes: once a node is "settled" (dequeued from       ║
║  priority queue), its shortest distance is final.                 ║
║                                                                  ║
║  With negative edge A→B (cost -5):                                ║
║  Node B may already be "settled" with distance 10.                ║
║  Then A is settled with distance 12. Path A→B = 12+(-5) = 7.    ║
║  But B was already finalized at 10! The shorter path (7) is      ║
║  never considered.                                               ║
║                                                                  ║
║  SOLUTION: Use Bellman-Ford O(V×E) for negative edges.           ║
║  For negative CYCLES (sum < 0), no shortest path exists.        ║
╚══════════════════════════════════════════════════════════════════╝
```

---

← Previous: [Chapter 15 — Pattern Programs](../09_Pattern_Programs_Complete.md) | [📚 Index](../../00_MASTER_INDEX.md) | Next: [SQL Deep Reasoning →](../../08_SQL/23_SQL_Deep_Reasoning.md)

---


---

[← 12. How to Articulate DSA Solutions in…](02_how_to_articulate_dsa_solutions_in.md) | [Chapter overview](../16_DSA_Deep_Reasoning.md)
