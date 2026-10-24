# 🧩 Constraint-Based Pattern Selection — Pattern Guide

**Navigation**: [< Previous](24_Kadanes_Subarray_Patterns.md) | [Back to Index](00_INDEX.md) | [Next: Prefix Sum >](26_Prefix_Sum_And_Difference_Array.md) | [Pattern Master Guide](00_PATTERN_MASTER_GUIDE.md) | [Competitive Coding Thinking](../14_Mental_Models/21_Competitive_Coding_Deep_Thinking.md)

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | Every pattern chapter in this folder, [A2 Complexity](../03_Algorithms/A2_Complexity_FirstPrinciples.md) |
| **You will learn** | Input-size budgets, decision tables by problem family (subarray, range, pair, graph, DP, string, math), and anti-traps |
| **Leads to** | [Pattern Master Guide](00_PATTERN_MASTER_GUIDE.md), [Algorithm selector](../03_Algorithms/00_MASTER_ALGORITHM_SELECTOR.md) |
| **Abstraction level** | Pattern name → **constraints decide** → verified choice |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Constraint-Based Pattern Selection

### 1. The bottom line

Read the limits first: they tell you the intended complexity and rule out most patterns before you think about code.

### 2. The textbook core

- About 10⁸ simple operations per second: `n ≤ 10⁵` → `O(n log n)`; `n ≤ 20` → exponential; `n ≤ 5000` → `O(n²)`.
- Properties matter as much as size: sorted? non-negative? static or updating? small value range?
- Filter by complexity, then by question type, then by structural properties.
- The table is a filter, not a guarantee — constants matter.

### 3. The real-world analogy

A **capacity plan** for a bridge: you check the load limits first, then choose the design.

### 4. Walkthrough

1. `n = 2·10⁵`, "count subarrays with sum k", negatives allowed.
2. `O(n²)` is too slow; window fails (negatives).
3. Prefix sums + hash map: `O(n)`.
4. Confirmed by a small example.

> [!NOTE]
> **Quick check:** Why does `n = 2·10⁵` exclude `O(n²)`? *That is 4·10¹⁰ operations, far beyond ~10⁸ per second.*

---

## Historical Evolution

**Inventor / Originator:** The habit of reading input limits to guess the intended complexity is contest folklore, written down in books such as Skiena's *The Algorithm Design Manual* and Laaksonen's *Competitive Programmer's Handbook*. The notation behind it — `O`, `Ω`, `Θ` — was popularised for computer science by Knuth's 1976 note *Big Omicron and Big Omega and Big Theta*; Pólya (1945) supplied the general advice to restate the problem and use its data and conditions.

**Predecessor context:** Selection by keyword ("array" → sliding window) led to wrong tools whenever the constraints differed from the textbook case.

**Evolution narrative:** The constraint tells you the budget: roughly 10⁸ simple operations per second means `n ≈ 10⁵` allows `O(n log n)` but not `O(n²)`; `n ≤ 20` suggests bitmasks; small `W` suggests pseudo-polynomial DP.

**Modern practice:** Treat the table as a **filter** that rules approaches out, then confirm with the problem's structure (sorted? monotone? non-negative? static or updating?).

- **Pólya — 1945**: Heuristics: understand the conditions before choosing a method
- **Knuth — 1976**: Standardised `O`, `Ω`, `Θ` notation for algorithm analysis
- **Contest practice — 1990s onward**: Input limit → complexity table

---

## Production Reality

> [!TIP]
> **Solution fails or is too slow?** Run the five-step [Pattern Mis-Selection Debug Workflow](00_PATTERN_MASTER_GUIDE.md#pattern-mis-selection-debug-workflow) before changing code: the bug is often the pattern, not the implementation.

**Pattern-Specific Failure Modes:**

- **Constraint value boundary at 10⁵/10⁶/10⁷ vs 2×10⁵ changes target complexity O(N log N) vs O(N²)** — Misreading a constraint boundary can lead to selecting O(N²) when O(N log N) is required. Detection: verify the exact constraint value; at N=2×10⁵, O(N²) = 40B operations, too slow.

- **Pattern anti-trap detection misses edge cases** — The anti-trap table identifies common failures but cannot cover all edge cases. Detection: add explicit edge case testing (empty, single element, boundary values) before finalizing pattern selection.

- **Memory constraint 256MB vs 512MB determines in-place vs auxiliary** — Misjudging memory constraints leads to O(N) space solutions failing in production. Detection: verify memory limit; for 256MB with N=10⁵, in-place O(1) space may be required.

**Production Selection Heuristic:** Always verify exact constraint values (N, memory, time limits) before finalizing pattern selection. A 2x difference in N can change the required complexity class from O(N²) to O(N log N).

---

## Constraint-Based Pattern Selection

### If the Constraints Look Like This, Think Like That

Keywords are useful, but constraints decide the final algorithm.

The same phrase can mean different tools:

```text
"subarray sum" + all numbers positive       -> sliding window may work
"subarray sum" + negative numbers allowed   -> prefix sum + hashmap/tree map
"range query" + no updates                  -> prefix/sparse table
"range query" + updates                     -> Fenwick/segment tree
"shortest path" + unweighted                -> BFS
"shortest path" + weighted non-negative     -> Dijkstra
"shortest path" + negative edges            -> Bellman-Ford / potentials
```

This guide is the constraint-first layer you should check before locking a pattern.

For the rewrite workflow, pair it with [Brute Force to Optimal Playbook](../14_Mental_Models/22_Brute_Force_To_Optimal_Playbook.md): write naive loops, find the repeated operation, then replace it with a DS/Algo.

---

## PART 0: Open-Source Reference Anchors

Open-source implementations are useful when they reveal the invariant behind a data structure. Do not paste a large implementation into your notes. Link it, explain what design choice matters, then rewrite the idea in your own contest/interview style.

Use this format:

```text
Source link -> invariant learned -> when to use -> when not to copy directly
```

| Need To Understand                  | Strong Reference                                                                                                                                                                                                                                       | What To Extract                                    | Do Not Blindly Copy                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- | -------------------------------------------------------------- |
| point updates + prefix/range sum    | [AtCoder fenwicktree.hpp](https://github.com/atcoder/ac-library/blob/master/atcoder/fenwicktree.hpp)                                                                                                                                                   | `add` and prefix accumulation are both logarithmic | C++ template details into Java                                 |
| range queries with lazy updates     | [AtCoder lazysegtree.hpp](https://github.com/atcoder/ac-library/blob/master/atcoder/lazysegtree.hpp)                                                                                                                                                   | monoid value + lazy function + composition         | the generic abstraction before you understand the math         |
| compact contest templates           | [KACTL content](https://github.com/kth-competitive-programming/kactl/tree/main/content)                                                                                                                                                                | minimal state, invariant comments, tested snippets | terse macros/style in Java answers                             |
| proof-oriented algorithm notes      | [cp-algorithms repo](https://github.com/cp-algorithms/cp-algorithms)                                                                                                                                                                                   | correctness proof, edge cases, complexity          | C++ implementation assumptions without translating constraints |
| production Java collection behavior | [OpenJDK LinkedList.java](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/LinkedList.java), [PriorityQueue.java](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/PriorityQueue.java) | invariants, iterator behavior, API tradeoffs       | production API complexity for a 20-line interview solution     |

Decision rule:

```text
If the repo code is long, copy the invariant, not the implementation.
If the repo code is short, still translate names, indexing, overflow, and language constraints.
```

---

## PART 1: Input Size Budget

The first constraint is `N`.

| Constraint   | Usually Safe        | Pattern Families                         |
| ------------ | ------------------- | ---------------------------------------- |
| `N <= 10`    | `O(N!)`             | permutations, brute-force ordering       |
| `N <= 20`    | `O(2^N * N)`        | bitmask DP, subset enumeration           |
| `N <= 40`    | `O(2^(N/2))`        | meet-in-the-middle                       |
| `N <= 100`   | `O(N^3)`            | Floyd-Warshall, interval DP              |
| `N <= 2,000` | `O(N^2)`            | pair loops, classic DP                   |
| `N <= 2e5`   | `O(N log N)`        | sort, heap, binary search, segment tree  |
| `N <= 1e6`   | `O(N)`              | prefix, hashmap, sliding window, BFS/DFS |
| `N >= 1e9`   | `O(log N)` / `O(1)` | math, binary search, fast power          |

Rule:

```text
Constraints do not merely limit code. They reveal the intended shape.
```

---

## PART 2: Subarray / Substring Decision Table

The word `subarray` only tells you the answer is contiguous. It does not automatically mean sliding window.

| Problem Shape              | Values                   | Best Pattern                          | Why                                    |
| -------------------------- | ------------------------ | ------------------------------------- | -------------------------------------- |
| fixed size `k`             | any                      | fixed sliding window                  | window length is constant              |
| max sum subarray           | any                      | Kadane                                | local negative prefix can be dropped   |
| count sum exactly `K`      | any, including negatives | prefix sum + hashmap                  | exact difference between prefixes      |
| longest sum `<= K`         | all positive             | variable sliding window               | sum grows when right moves             |
| longest sum `<= K`         | negatives allowed        | prefix sums + balanced tree / offline | monotonicity breaks                    |
| min length sum `>= K`      | all positive             | variable sliding window               | shrinking is safe                      |
| min length sum `>= K`      | negatives allowed        | prefix + monotonic deque              | LeetCode 862 style                     |
| product `< K`              | all positive             | sliding window                        | product grows/shrinks predictably      |
| at most `K` distinct chars | chars/counts             | sliding window + hashmap              | distinct count changes predictably     |
| exactly `K` distinct chars | chars/counts             | atMost(K) - atMost(K-1)               | exact is easier via two at-most counts |
| divisible by `K`           | any                      | prefix remainder count                | same remainder means divisible range   |
| xor exactly `K`            | any                      | prefix xor + hashmap                  | `px[i] xor px[j] = K`                  |

### The Negative Number Trap

Sliding window sum logic usually assumes:

```text
add right  -> sum increases
remove left -> sum decreases
```

With negatives:

```text
[5, -10, 8], target = 6
```

Adding `-10` decreases the sum. Removing `5` also decreases? The "shrink when too large" rule no longer proves anything.

Switch to prefix logic:

```text
sum(i..j) = prefix[j + 1] - prefix[i]
need prefix[i] = prefix[j + 1] - K
```

For count of exact `K`, store old prefix frequencies in a hashmap.

---

## PART 3: Range Query Decision Table

| Query Type                          | Updates?     | Best Tool                              |
| ----------------------------------- | ------------ | -------------------------------------- |
| range sum                           | no           | prefix sum                             |
| range min/max/gcd                   | no           | sparse table                           |
| range sum                           | point update | Fenwick tree                           |
| range min/max/sum                   | point update | segment tree                           |
| range add, point query              | yes          | difference array / Fenwick             |
| range add, range sum/min/max        | yes          | lazy segment tree                      |
| kth/rank in range                   | no/static    | wavelet tree / persistent segment tree |
| many offline range distinct queries | no updates   | Mo's algorithm                         |
| matrix rectangle sum                | no           | 2D prefix sum                          |
| matrix rectangle update             | yes          | 2D difference / 2D BIT                 |

Quick rule:

```text
No updates -> precompute.
Point updates -> Fenwick/segment tree.
Range updates -> lazy propagation or difference trick.
Offline queries -> consider sorting/reordering.
```

---

## PART 4: Sorted / Pair / Search Decision Table

| Situation                           | Pattern                                                   |
| ----------------------------------- | --------------------------------------------------------- |
| sorted array, find one target       | binary search                                             |
| sorted array, pair sum target       | two pointers                                              |
| unsorted array, pair sum target     | hashmap complement                                        |
| unsorted array, return indices      | hashmap complement, do not sort unless indices not needed |
| 3Sum / kSum                         | sort + fix one + two pointers                             |
| minimize maximum / maximize minimum | binary search on answer                                   |
| rotated sorted array                | modified binary search                                    |
| find first/last occurrence          | lower/upper bound                                         |
| search in answer range, not array   | binary search on monotonic predicate                      |

Verification question:

```text
If X works, do larger/smaller X values also work?
```

If yes, binary search on answer is alive.

---

## PART 5: Graph Constraint Decision Table

| Graph Clue                          | Best Tool      | Why                                 |
| ----------------------------------- | -------------- | ----------------------------------- |
| unweighted shortest path            | BFS            | first visit is shortest layer       |
| weighted non-negative shortest path | Dijkstra       | greedy distance finalization works  |
| negative weights                    | Bellman-Ford   | can relax edges repeatedly          |
| negative cycle detection            | Bellman-Ford   | nth relaxation reveals cycle        |
| DAG shortest/longest path           | topological DP | no cycles, process dependencies     |
| connected components                | DFS/BFS/DSU    | mark each component                 |
| dynamic edge additions              | DSU            | union components                    |
| edge deletions offline              | DSU rollback   | deletion becomes time intervals     |
| all-pairs shortest path, `N <= 400` | Floyd-Warshall | `O(N^3)` acceptable                 |
| tree path query                     | LCA/HLD        | exploit tree structure              |
| subtree query                       | Euler Tour     | subtree becomes contiguous interval |

Trap:

```text
Dijkstra does not work with negative edges.
BFS does not work with weighted edges unless all weights are equal.
```

---

## PART 6: DP Constraint Decision Table

| Clue                           | State Shape                  |
| ------------------------------ | ---------------------------- |
| choose / skip items            | 0/1 knapsack                 |
| unlimited use of items         | unbounded knapsack           |
| count ways to make sum         | coin change DP               |
| two strings                    | `dp[i][j]` over prefixes     |
| grid paths                     | `dp[r][c]`                   |
| intervals                      | `dp[l][r]`                   |
| tree choices                   | tree DP                      |
| subset of items, `N <= 20`     | bitmask DP                   |
| digit constraints up to `1e18` | digit DP                     |
| "last choice matters"          | include last state dimension |

When deciding greedy vs DP:

```text
If local best can be exchanged into an optimal solution -> greedy.
If choices affect future and overlap repeats -> DP.
```

---

## PART 7: String Constraint Decision Table

| String Clue                               | Pattern                                                |
| ----------------------------------------- | ------------------------------------------------------ |
| substring with char constraints           | sliding window                                         |
| subsequence comparison                    | DP                                                     |
| exact pattern search                      | KMP / rolling hash                                     |
| many pattern searches                     | Aho-Corasick                                           |
| palindrome substring                      | expand center / Manacher                               |
| anagrams                                  | frequency signature / sliding window                   |
| lexicographically smallest after removals | monotonic stack                                        |
| longest repeated substring                | suffix array / suffix automaton / binary search + hash |

Trap:

```text
Substring is contiguous.
Subsequence can skip.
The pattern changes completely.
```

---

## PART 8: Math and Counting Decision Table

| Clue                             | Tool                          |
| -------------------------------- | ----------------------------- |
| answer modulo `1e9+7`            | modular arithmetic            |
| huge exponent                    | binary exponentiation         |
| divide under modulo prime        | modular inverse               |
| count combinations               | factorial + inverse factorial |
| gcd/lcm constraints              | Euclid                        |
| prime queries                    | sieve                         |
| large coordinates but few points | coordinate compression        |
| parity / odd-even                | modulo 2, XOR                 |
| "exactly one appears once"       | XOR                           |
| "all subsets"                    | bitmask                       |

Overflow rule:

```text
If values are up to 1e9 and you add/multiply/count pairs, use long.
```

---

## PART 9: Pattern Anti-Traps

| Tempting Pattern          | Fails When                            | Use Instead                       |
| ------------------------- | ------------------------------------- | --------------------------------- |
| sliding window for sum    | negatives allowed                     | prefix + hashmap/tree/deque       |
| two pointers for pair sum | unsorted and indices required         | hashmap                           |
| BFS shortest path         | weighted edges                        | Dijkstra / 0-1 BFS                |
| Dijkstra                  | negative edges                        | Bellman-Ford / Johnson potentials |
| greedy                    | no exchange proof                     | DP / search                       |
| prefix sum                | updates arrive online                 | Fenwick/segment tree              |
| sparse table              | updates arrive                        | segment tree                      |
| recursion DFS in Java     | `N` can be `2e5` deep                 | iterative stack                   |
| `int` counters            | pair/subarray counts                  | `long`                            |
| sorting                   | original order/index identity matters | hashmap/index mapping             |

---

## PART 10: 30-Second Constraint Checklist

Before choosing a pattern, answer:

```text
1. What is N? What time complexity fits?
2. Are values positive, negative, bounded, unique, sorted?
3. Is the target exact, at most, at least, min, max, or count?
4. Are there updates or only static queries?
5. Is the graph weighted, unweighted, directed, cyclic, a tree, or DAG?
6. Is the answer contiguous, subsequence, subset, path, or component?
7. Can queries be processed offline?
8. Does the candidate algorithm have a proof invariant?
```

If any answer changes, the pattern may change.


---

## 🏢 Enterprise Lens — Constraint-Based Pattern Selection

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Design reviews, capacity planning, performance budgeting |
| **Failure modes** | Ignoring constants and memory; choosing by keyword; forgetting update patterns (static vs dynamic) |
| **Testing and verification** | Practise the table on past problems: write constraint → chosen pattern → justification |

---

## Reality Check

**"Constraints exist to size the test data"** — Constraints are the setter TELLING you the intended complexity: n up to 10^5 means O(n log n) or better (rules out quadratic), n up to 20 whispers bitmask/backtracking, n up to 500 permits O(n cubed) DP, values up to 10^9 kill counting arrays and hint binary-search-on-answer. Reading them first is not a tip — it is the router that eliminates most of the pattern catalog before you read the story.

**"The 10^8 operations-per-second rule is exact"** — It is a planning heuristic with half-an-order-of-magnitude error bars either way: constant factors (hash overhead vs array walk), language (Java JIT vs Python), and judge hardware move the line. Use it directionally — 10^5 squared = 10^10 is dead-on-arrival, n log n at 10^6 is comfortable — and stop defending 3·10^8 borderline plans; borderline means find the better pattern or tighten constants deliberately (arrays over maps, iteration over recursion).

**"Tight memory limits just mean avoid waste"** — Memory limits ENCODE algorithmic intent the way time limits do: an O(n·m) DP table at 10^4 × 10^4 ints is 400MB — the setter is mandating rolling rows; value ranges beyond 10^7 forbid boolean-array visited sets; "O(1) extra space" on range-1..n arrays is a flashing sign for cyclic sort or value-as-pointer Floyd. Treat the memory line as a second router, not a formality.

**"Multiple patterns fitting means pick your favorite"** — Fit is filtered by the QUESTION TYPE after complexity: existence questions tolerate greedy/binary-search answers; counting questions usually force DP or math (greedy cannot count); construction ("output the actual arrangement") disqualifies approaches that only track optima without parents/choices. The two-router pipeline — constraints prune complexity, answer-type prunes semantics — usually leaves exactly one serious candidate, which is the entire point of this file.

**"Constraint-reading is a competitive-programming habit only"** — It is capacity planning wearing a costume. "How many rows before this endpoint needs an index" and "n up to what before this nested loop pages the dashboard" are the same estimation muscle: bound the input, multiply by per-item cost, compare against the budget (100ms API, 16ms frame). Engineers who practiced constraint-reading do this arithmetic instinctively in design reviews; the ones who skipped it discover complexity limits from production incidents instead.
