**Navigation**: [Back to Index](00_INDEX.md) | [Universal Framework](05_Universal_Problem_Framework.md) | [Constraint-Based Selection](../04_Patterns_Templates/25_Constraint_Based_Pattern_Selection.md)

---

# Brute Force to Optimal Playbook

## How to Understand, Categorize, Choose DS/Algo, and Rewrite Loops Into Real Solutions

This guide is for the exact moment when you read a problem and think:

```text
I can do it with nested loops... but how do I improve it?
```

The answer is not magic. You rewrite the slow part of brute force using the correct data structure or algorithm.

---

# PART 1: Understand the Problem Before Choosing a Pattern

Before thinking about code, extract five facts.

| Question | Why It Matters |
|----------|----------------|
| What is the input shape? | array, string, tree, graph, matrix, intervals, numbers |
| What is being asked? | find, count, maximize, minimize, check, generate |
| What are the constraints? | decides allowed complexity |
| Are there special value rules? | sorted, positive, negative, duplicates, unique, weighted |
| Are there updates/queries? | decides static precompute vs dynamic DS |

## The One-Sentence Rewrite

Turn the story into a clean technical sentence.

Example:

```text
Story: "Given daily temperatures, find how many days until a warmer day."
Rewrite: For each index, find the next greater element to its right.
Pattern: Monotonic stack.
```

If you cannot rewrite the problem in one sentence, do not choose a pattern yet.

---

# PART 2: Categorize by Input + Operation

Use this two-axis classifier.

## Axis 1: Input Shape

| Input Shape | First Suspects |
|-------------|----------------|
| array/string | two pointers, sliding window, prefix, hashmap, stack |
| sorted array | binary search, two pointers |
| linked list | fast/slow pointers, reversal, dummy node |
| tree | DFS, BFS, recursion, LCA, Euler Tour |
| graph/grid | BFS, DFS, Dijkstra, topological sort, DSU |
| intervals | sort, merge, sweep line, heap |
| numbers/math | gcd, modulo, combinatorics, binary search answer |
| stream | heap, hashmap, monotonic queue, sketches |
| many range queries | prefix, Fenwick, segment tree, sparse table |

## Axis 2: Asked Operation

| Asked Operation | First Suspects |
|-----------------|----------------|
| existence | set/hashmap, binary search, graph reachability |
| count | hashmap frequency, prefix, DP, combinatorics |
| min/max | heap, greedy, DP, binary search answer |
| shortest | BFS/Dijkstra/Bellman-Ford |
| all ways / generate | backtracking, recursion, DP |
| kth/top K | heap, quickselect, binary search, TreeMap |
| range aggregate | prefix/Fenwick/segment/sparse |
| dependencies/order | topological sort |
| connectivity | DFS/BFS/DSU |

Category is not one keyword. It is:

```text
input shape + asked operation + constraints
```

---

# PART 3: Write Brute Force First

Brute force teaches you the structure of the solution.

## Common Brute Force Shapes

| Brute Force Shape | Example |
|-------------------|---------|
| single loop | scan for max/min/count |
| double loop | all pairs, all subarrays |
| triple loop | all triplets, all ranges with recompute |
| recursion | all subsets/permutations/paths |
| graph state search | try every reachable state |
| per-query scan | answer every query by scanning full array |

## Brute Force Template

Write this mentally:

```text
for every candidate:
    compute answer from scratch
    update result
```

Then ask:

```text
What is being recomputed?
What lookup is too slow?
What search space is too big?
What order/property am I not using?
```

The answer tells you the optimization.

---

# PART 4: Bottleneck to Data Structure Map

This is the heart of the rewrite.

| Brute Force Bottleneck | Replace With | Why |
|------------------------|--------------|-----|
| scanning to find complement | hashmap | `O(1)` lookup |
| recomputing range sum | prefix sum | `O(1)` range sum |
| recomputing range min/max static | sparse table | precompute answers by powers of 2 |
| range query with updates | Fenwick / segment tree | update and query in `O(log N)` |
| checking all previous greater/smaller | monotonic stack | discard useless candidates |
| checking all window max values | monotonic deque | keep best candidates only |
| trying all sorted pairs | two pointers | sorted order eliminates pairs |
| linear search over answer | binary search | monotonic predicate halves space |
| repeated recursion states | memoization / DP | compute each state once |
| repeated min/max extraction | heap | get best item in `O(log N)` |
| repeated connectivity checks | DSU | component lookup almost `O(1)` |
| repeated substring matching | KMP / rolling hash | reuse prefix/hash information |
| repeated graph shortest path unweighted | BFS | layer expansion |
| weighted shortest path | Dijkstra | min-distance frontier |

---

# PART 5: Rewrite Examples

## Example 1: Two Sum

Brute force:

```java
for (int i = 0; i < n; i++) {
    for (int j = i + 1; j < n; j++) {
        if (a[i] + a[j] == target) return true;
    }
}
```

Bottleneck:

```text
For each a[i], scanning all later elements to find target - a[i].
```

Rewrite:

```text
Use hashmap/set to ask: have I already seen target - a[i]?
```

Optimized:

```java
Set<Integer> seen = new HashSet<>();
for (int x : a) {
    if (seen.contains(target - x)) return true;
    seen.add(x);
}
```

## Example 2: Count Subarrays With Sum K

Brute force:

```text
for every L:
    sum = 0
    for every R >= L:
        sum += a[R]
        if sum == K: count++
```

Bottleneck:

```text
We are testing all starts for every end.
```

Math rewrite:

```text
sum(i..j) = prefix[j + 1] - prefix[i]
need prefix[i] = prefix[j + 1] - K
```

DS rewrite:

```text
HashMap stores frequencies of previous prefixes.
```

Works even with negative numbers because it does not rely on monotonic window movement.

## Example 3: Maximum in Every Window of Size K

Brute force:

```text
for every window:
    scan K elements to find max
```

Cost:

```text
O(NK)
```

Bottleneck:

```text
Most elements are rescanned across overlapping windows.
```

Rewrite:

```text
Use monotonic deque. It stores only indices that can still become maximum.
```

Why it works:

```text
If a new value is bigger than old tail values, those old values can never win any future window.
```

## Example 4: Range Sum Queries

Brute force:

```text
for each query(L, R):
    scan L..R
```

If no updates:

```text
Use prefix sum.
sum(L..R) = prefix[R + 1] - prefix[L]
```

If updates exist:

```text
Use Fenwick tree or segment tree.
```

The same problem statement changes tool depending on update constraints.

## Example 5: Shortest Path

Brute force idea:

```text
try all paths
```

But paths explode exponentially.

Categorize:

| Constraint | Tool |
|------------|------|
| unweighted graph/grid | BFS |
| weights are 0 or 1 | 0-1 BFS |
| non-negative weights | Dijkstra |
| negative weights | Bellman-Ford |
| DAG | topological DP |

The category comes from edge weights, not just the phrase "shortest path."

---

# PART 6: How to Choose the Proper DS and Algo

Use this checklist.

## Data Structure Choice

| Need | Choose |
|------|--------|
| fast membership | HashSet |
| key to value/frequency | HashMap |
| sorted keys / floor / ceiling | TreeMap / TreeSet |
| first/last in order | deque |
| nested/undo behavior | stack |
| level order / BFS | queue |
| repeated min/max | priority queue |
| range sum with updates | Fenwick |
| general range queries/updates | segment tree |
| static range min/max | sparse table |
| connectivity | DSU |
| prefix relationships | prefix sum/xor |

## Algorithm Choice

| Need | Choose |
|------|--------|
| reduce pair search in sorted data | two pointers |
| contiguous window with monotonic condition | sliding window |
| exact subarray sum/xor | prefix + hashmap |
| next greater/smaller | monotonic stack |
| search monotonic answer | binary search answer |
| explore all choices | backtracking |
| repeated optimal subproblems | DP |
| local choice has exchange proof | greedy |
| unweighted shortest path | BFS |
| weighted shortest path | Dijkstra/Bellman-Ford |
| dependency order | topological sort |

---

# PART 7: The Rewrite Formula

When you have brute force, rewrite it using this formula:

```text
1. Name the brute force loops.
2. Identify the repeated operation inside the inner loop.
3. Ask which DS can answer that operation faster.
4. Maintain that DS while scanning.
5. Prove the maintained state is enough.
```

Example pattern:

```text
Nested loop:
    for each right:
        scan all left

Rewrite:
    for each right:
        use DS containing previous left-side information
```

That is how many `O(N^2)` problems become `O(N)`.

---

# PART 8: Category Questions to Ask During Practice

Before coding, answer:

```text
What is the input shape?
What is the asked operation?
What is N?
Are values sorted, positive, negative, unique, duplicated?
Are there updates?
Is the result contiguous, subsequence, subset, path, or range?
What is my brute force?
What part of brute force repeats?
Which DS answers that repeated question faster?
What invariant proves the optimized version?
```

If you can answer these, you can usually choose the right DS and algorithm.

---

# PART 9: The One-Line Mental Model

```text
Brute force shows the work.
Constraints show the budget.
Data structures remove repeated lookup.
Algorithms exploit order, monotonicity, graph shape, or overlapping states.
```

That is the whole game.
