# Master Algorithm Selector

> **How to use**: read the problem signal in the left column, follow to the right for algorithm, data structure, complexity, and the Java idiom. This is a decision matrix — not a cheat sheet. It starts with observable problem properties, not algorithm names.
>
> Cross-references: [Cheat Sheets →](00_CHEAT_SHEETS.md) · [Cross-Domain Bridges →](00_CROSS_DOMAIN_BRIDGES.md) · [Algorithm Timeline →](00_ALGORITHM_TIMELINE.md)

---

## Dimension 1 — Input Shape

| Input shape | Strong signal → | Algorithm family |
|-------------|-----------------|-----------------|
| Array, **sorted** | binary search, two-pointer, prefix sum | CS2 |
| Array, **unsorted**, find pair/triple | sort first (O(n log n)) or hash map (O(n)) | CS2 |
| Array, **unsorted**, find subarray | sliding window or prefix sum | CS10 |
| Array of **intervals** | sort by start; then greedy merge / sweep | CS6 |
| Array with **frequencies** / duplicates | hash map for counts | CS3 |
| **Matrix / 2D grid** | BFS/DFS for connected regions; 2D prefix sum for rectangle queries | CS5, CS10 |
| **String** (pattern matching) | KMP / Z-algorithm / rolling hash; or DP for LCS/edit distance | CS4, CS8 |
| **Two strings** (comparison) | 2D DP (LCS, edit distance, longest common substring) | CS4 |
| **Tree (given)** | recursive DFS; tree DP; euler tour | CS4, CS7 |
| **Graph (given)** | BFS/DFS/Dijkstra depending on weights | CS5 |
| **Stream** (online, unknown size) | monotonic deque; reservoir sampling; Bloom filter | CS9 |

---

## Dimension 2 — Query Type

| What the problem asks for | → Algorithm / DS | Complexity |
|---------------------------|-------------------|-----------|
| Does X **exist**? | Hash set O(1) lookup | O(1) avg |
| **Count** occurrences of X | HashMap frequency table | O(n) build, O(1) query |
| **k-th smallest / largest** | QuickSelect (O(n) avg) or min-heap of size k (O(n log k)) | O(n) / O(n log k) |
| **Range sum** [l, r] | Prefix sum array | O(n) build, O(1) query |
| **Range update** + point query | Difference array | O(n) build, O(1) update, O(n) read |
| **Range update** + range query | Segment tree or BIT (Fenwick) | O(n) build, O(log n) per op |
| **Shortest path**, unweighted | BFS | O(V+E) |
| **Shortest path**, weighted ≥ 0 | Dijkstra + min-heap | O((V+E) log V) |
| **Shortest path**, negative weights | Bellman-Ford | O(VE) |
| **All-pairs** shortest path | Floyd-Warshall | O(V³) |
| **Minimum spanning tree** | Kruskal (sort edges + DSU) or Prim | O(E log V) |
| **Number of connected components** | BFS/DFS or Union-Find | O(V+E) / O(α(n)) |
| **Cycle detection** (undirected) | DFS with parent tracking | O(V+E) |
| **Cycle detection** (directed) | DFS with GRAY/BLACK state | O(V+E) |
| **Topological order** | Kahn's (BFS in-degree) or DFS post-order | O(V+E) |
| **Maximum flow** | Edmonds-Karp (BFS + augmentation) | O(VE²) |
| **Sliding window max/min** | Monotonic deque | O(n) |
| **Next greater element** | Monotonic stack | O(n) |
| **All permutations / subsets** | Backtracking | O(n!/k!) / O(2ⁿ) |
| **Optimal substructure** + overlapping subproblems | Dynamic programming | varies |
| **Greedy** applicable (exchange arg holds) | Greedy | varies |

---

## Dimension 3 — Constraint Signal → Data Structure

| Constraint | DS to reach for | Why |
|------------|----------------|-----|
| Need O(1) **lookup by key** | HashMap | Hash, O(1) avg |
| Need **sorted** iteration + O(log n) insert/delete | TreeMap / TreeSet | Red-Black tree |
| Need **sorted** + O(1) min/max | PriorityQueue (heap) | Heap property |
| Need **LIFO** (last in, first out) | ArrayDeque as stack | O(1) push/pop |
| Need **FIFO** (first in, first out) | ArrayDeque as queue | O(1) offer/poll |
| Need **LIFO + FIFO both** | ArrayDeque (deque) | O(1) both ends |
| Need **O(1) insert at arbitrary position** (iterator-based) | LinkedList | Pointer swap |
| Need **O(1) random access** | ArrayList / array | Index arithmetic |
| Need **dynamic connectivity** (union/find) | DSU (Union-Find) | O(α(n)) |
| Need **prefix existence queries** on strings | Trie | O(L) per query |
| Need **approximate membership** (space-efficient) | Bloom filter | O(k) hash, small FP |
| Need **order statistics** (k-th element, rank) | Order-statistic tree / indexed segment tree | O(log n) |
| Need **range min/max queries** static | Sparse table | O(n log n) build, O(1) query |

---

## Dimension 4 — Time Budget → Algorithm Grade

| Available time | n = 10³ | n = 10⁴ | n = 10⁵ | n = 10⁶ | n = 10⁷ |
|----------------|---------|---------|---------|---------|---------|
| O(1) | ✅ trivial | ✅ | ✅ | ✅ | ✅ |
| O(log n) | ✅ | ✅ | ✅ | ✅ | ✅ |
| O(n) | ✅ | ✅ | ✅ | ✅ | ✅ |
| O(n log n) | ✅ | ✅ | ✅ | ✅ | ⚠️ tight |
| O(n√n) | ✅ | ✅ | ⚠️ tight | ❌ | ❌ |
| O(n²) | ✅ | ✅ | ❌ | ❌ | ❌ |
| O(n³) | ✅ | ⚠️ tight | ❌ | ❌ | ❌ |
| O(2ⁿ) | ⚠️ n≤20 | ❌ | ❌ | ❌ | ❌ |
| O(n!) | ⚠️ n≤12 | ❌ | ❌ | ❌ | ❌ |

Assumes 10⁸–10⁹ simple operations per second on a modern JVM with JIT.

---

## Dimension 5 — Problem Archetype → Algorithm Template

### Archetype A: "Count / Find ways to reach a goal"
→ **Dynamic Programming**. Start with brute-force recursion, add memoization.
```java
// Top-down template
int dp(int state, int[] memo) {
    if (isBase(state)) return baseValue(state);
    if (memo[state] != -1) return memo[state];
    return memo[state] = /* combine dp(nextState) */;
}
```

### Archetype B: "Find optimal partition / assignment"
→ **DP if O(n²) acceptable**; **Greedy if exchange argument holds**.
Greedy test: can you always take the locally best choice without regret? If yes → greedy. If swapping a greedy choice can improve the result → DP.

### Archetype C: "Find if path exists / shortest path"
→ **BFS** for unweighted; **Dijkstra** for non-negative weighted; **Bellman-Ford** for negative weights; **Floyd-Warshall** for all-pairs.

### Archetype D: "Process elements in order, maintain running property"
→ **Monotonic stack/queue**. Decreasing stack for "next greater element"; deque for sliding window.

### Archetype E: "Choose from options, explore, backtrack"
→ **Backtracking**. Always: choose → recurse → unchoose. Prune early when partial solution already violates constraints.

### Archetype F: "Connect / group / merge components"
→ **Union-Find** for offline; **BFS/DFS** for online exploration.

### Archetype G: "Sort + scan"
→ **Greedy + sorting**. Sort by one dimension, scan with a stack/heap/set for the other. Activity selection, interval merging, skyline problem.

### Archetype H: "Repeated min/max extraction from dynamic set"
→ **PriorityQueue**. Dijkstra, k-way merge, median maintenance, scheduling.

---

## Dimension 6 — Java API Quick-Select

| Need | Java class | Key method | Complexity |
|------|-----------|------------|-----------|
| Sort array (primitive) | `Arrays` | `Arrays.sort(arr)` | O(n log n) unstable |
| Sort array (object) | `Arrays` | `Arrays.sort(arr, cmp)` | O(n log n) stable |
| Sort list | `Collections` | `Collections.sort(list)` | O(n log n) stable |
| Binary search (array) | `Arrays` | `Arrays.binarySearch(arr, key)` | O(log n) |
| Sorted set | `TreeSet<E>` | `.floor()`, `.ceiling()`, `.subSet()` | O(log n) |
| Sorted map | `TreeMap<K,V>` | `.floorKey()`, `.ceilingKey()` | O(log n) |
| Min-heap | `PriorityQueue<E>` | `.offer()`, `.poll()`, `.peek()` | O(log n) / O(1) |
| Max-heap | `PriorityQueue<E>` | `new PQ<>(Comparator.reverseOrder())` | O(log n) |
| Hash map | `HashMap<K,V>` | `.getOrDefault()`, `.merge()`, `.computeIfAbsent()` | O(1) avg |
| Linked hash map (LRU) | `LinkedHashMap<K,V>` | override `removeEldestEntry()` | O(1) |
| Stack | `ArrayDeque<E>` | `.push()`, `.pop()`, `.peek()` | O(1) |
| Queue | `ArrayDeque<E>` | `.offer()`, `.poll()`, `.peek()` | O(1) |
| Deque | `ArrayDeque<E>` | `.offerFirst/Last()`, `.pollFirst/Last()` | O(1) |
| Bit set | `BitSet` | `.set()`, `.get()`, `.and()`, `.cardinality()` | O(n/64) ops |
| Graph (adjacency list) | `List<List<int[]>>` | manual build | O(V+E) space |
| DSU | manual `int[]` | see CS8 template | O(α(n)) |

---

## Dimension 7 — "Should I use DP or Greedy?" Decision Flow

```
Does the problem have OPTIMAL SUBSTRUCTURE?
  → No → brute force / backtracking
  → Yes → continue

Are the subproblems OVERLAPPING (same sub-call many times)?
  → No → pure recursion or divide-and-conquer (e.g., merge sort)
  → Yes → continue to DP or Greedy

Does a GREEDY CHOICE PROPERTY hold?
  (Can I always pick the locally best choice and never regret it?)
  → Try exchange argument: can swapping greedy choice for any other choice improve result?
    → No improvement possible → GREEDY (faster, simpler)
    → Yes, swapping can help   → DYNAMIC PROGRAMMING

Test the greedy: try the adversarial case first.
  Coin change {1,3,4}, target=6: greedy picks 4+1+1=3 coins; DP finds 3+3=2 coins → DP needed.
  Coin change {1,5,10,25}, target=30: greedy picks 25+5=2 coins; DP confirms 2 coins → Greedy works.
```

---

## Dimension 8 — Red Flags (Algorithm Anti-Patterns)

| You wrote... | Red flag | Fix |
|-------------|---------|-----|
| `list.contains(x)` in a loop | O(n²) hidden scan | Use `HashSet` for O(1) contains |
| `Collections.sort()` inside a loop | O(n² log n) | Sort once outside; or use `TreeSet` |
| `java.util.Stack` | Synchronized `Vector` under the hood | Use `ArrayDeque` |
| `new ArrayList<>()` for a set | O(n) contains | Use `HashSet` or `LinkedHashSet` |
| `PriorityQueue` + for-each for sorted order | Not sorted | Use `poll()` in a loop |
| Recursive DFS without cycle tracking | Infinite loop / StackOverflow on cyclic graph | Add `visited` set |
| `int mid = (lo + hi) / 2` | Overflow when lo+hi > Integer.MAX_VALUE | Use `lo + (hi-lo)/2` |
| Mutable object as HashMap key | Silent corruption when key mutated | Use immutable keys |
| `Arrays.sort()` on parallel arrays | Breaks key↔value correspondence | Use array of pairs |
| `HashMap.get()` without null check | NullPointerException | Use `getOrDefault()` or `containsKey()` |

---

> **Tier cross-reference**:
> - Full algorithm proofs: [A1 Correctness](A1_Correctness_Proofs.md) · [A2 Complexity](A2_Complexity_FirstPrinciples.md) · [A3 Lower Bounds](A3_Lower_Bounds_And_NP.md) · [A4 Randomized](A4_Randomized_Algorithms.md)
> - Per-family deep dives: [Cheat Sheets](00_CHEAT_SHEETS.md)
> - Production context: [Cross-Domain Bridges](00_CROSS_DOMAIN_BRIDGES.md)
> - History: [Algorithm Timeline](00_ALGORITHM_TIMELINE.md)
