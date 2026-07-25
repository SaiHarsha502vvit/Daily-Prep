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

| Question                       | Why It Matters                                           |
| ------------------------------ | -------------------------------------------------------- |
| What is the input shape?       | array, string, tree, graph, matrix, intervals, numbers   |
| What is being asked?           | find, count, maximize, minimize, check, generate         |
| What are the constraints?      | decides allowed complexity                               |
| Are there special value rules? | sorted, positive, negative, duplicates, unique, weighted |
| Are there updates/queries?     | decides static precompute vs dynamic DS                  |

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

| Input Shape        | First Suspects                                       |
| ------------------ | ---------------------------------------------------- |
| array/string       | two pointers, sliding window, prefix, hashmap, stack |
| sorted array       | binary search, two pointers                          |
| linked list        | fast/slow pointers, reversal, dummy node             |
| tree               | DFS, BFS, recursion, LCA, Euler Tour                 |
| graph/grid         | BFS, DFS, Dijkstra, topological sort, DSU            |
| intervals          | sort, merge, sweep line, heap                        |
| numbers/math       | gcd, modulo, combinatorics, binary search answer     |
| stream             | heap, hashmap, monotonic queue, sketches             |
| many range queries | prefix, Fenwick, segment tree, sparse table          |

## Axis 2: Asked Operation

| Asked Operation     | First Suspects                                 |
| ------------------- | ---------------------------------------------- |
| existence           | set/hashmap, binary search, graph reachability |
| count               | hashmap frequency, prefix, DP, combinatorics   |
| min/max             | heap, greedy, DP, binary search answer         |
| shortest            | BFS/Dijkstra/Bellman-Ford                      |
| all ways / generate | backtracking, recursion, DP                    |
| kth/top K           | heap, quickselect, binary search, TreeMap      |
| range aggregate     | prefix/Fenwick/segment/sparse                  |
| dependencies/order  | topological sort                               |
| connectivity        | DFS/BFS/DSU                                    |

Category is not one keyword. It is:

```text
input shape + asked operation + constraints
```

---

# PART 3: Write Brute Force First

Brute force teaches you the structure of the solution.

## Common Brute Force Shapes

| Brute Force Shape  | Example                                   |
| ------------------ | ----------------------------------------- |
| single loop        | scan for max/min/count                    |
| double loop        | all pairs, all subarrays                  |
| triple loop        | all triplets, all ranges with recompute   |
| recursion          | all subsets/permutations/paths            |
| graph state search | try every reachable state                 |
| per-query scan     | answer every query by scanning full array |

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

| Brute Force Bottleneck                  | Replace With           | Why                               |
| --------------------------------------- | ---------------------- | --------------------------------- |
| scanning to find complement             | hashmap                | `O(1)` lookup                     |
| recomputing range sum                   | prefix sum             | `O(1)` range sum                  |
| recomputing range min/max static        | sparse table           | precompute answers by powers of 2 |
| range query with updates                | Fenwick / segment tree | update and query in `O(log N)`    |
| checking all previous greater/smaller   | monotonic stack        | discard useless candidates        |
| checking all window max values          | monotonic deque        | keep best candidates only         |
| trying all sorted pairs                 | two pointers           | sorted order eliminates pairs     |
| linear search over answer               | binary search          | monotonic predicate halves space  |
| repeated recursion states               | memoization / DP       | compute each state once           |
| repeated min/max extraction             | heap                   | get best item in `O(log N)`       |
| repeated connectivity checks            | DSU                    | component lookup almost `O(1)`    |
| repeated substring matching             | KMP / rolling hash     | reuse prefix/hash information     |
| repeated graph shortest path unweighted | BFS                    | layer expansion                   |
| weighted shortest path                  | Dijkstra               | min-distance frontier             |

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

| Constraint            | Tool           |
| --------------------- | -------------- |
| unweighted graph/grid | BFS            |
| weights are 0 or 1    | 0-1 BFS        |
| non-negative weights  | Dijkstra       |
| negative weights      | Bellman-Ford   |
| DAG                   | topological DP |

The category comes from edge weights, not just the phrase "shortest path."

---

# PART 6: How to Choose the Proper DS and Algo

Use this checklist.

## Data Structure Choice

| Need                          | Choose            |
| ----------------------------- | ----------------- |
| fast membership               | HashSet           |
| key to value/frequency        | HashMap           |
| sorted keys / floor / ceiling | TreeMap / TreeSet |
| first/last in order           | deque             |
| nested/undo behavior          | stack             |
| level order / BFS             | queue             |
| repeated min/max              | priority queue    |
| range sum with updates        | Fenwick           |
| general range queries/updates | segment tree      |
| static range min/max          | sparse table      |
| connectivity                  | DSU               |
| prefix relationships          | prefix sum/xor    |

## Algorithm Choice

| Need                                       | Choose                |
| ------------------------------------------ | --------------------- |
| reduce pair search in sorted data          | two pointers          |
| contiguous window with monotonic condition | sliding window        |
| exact subarray sum/xor                     | prefix + hashmap      |
| next greater/smaller                       | monotonic stack       |
| search monotonic answer                    | binary search answer  |
| explore all choices                        | backtracking          |
| repeated optimal subproblems               | DP                    |
| local choice has exchange proof            | greedy                |
| unweighted shortest path                   | BFS                   |
| weighted shortest path                     | Dijkstra/Bellman-Ford |
| dependency order                           | topological sort      |

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

## NEW DIAGRAM — Brute Force to Optimal Transformation (Step-by-Step Rewrite)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  DIAGRAM: Brute Force to Optimal — The Bottleneck Rewrite Pipeline          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  THE PATTERN:                                                                │
│  Brute Force O(n²) → Identify repeated work → Replace with DS/Algo → O(n)   │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │  STAGE 1: BRUTE FORCE (make it work first)                            │    │
│  │                                                                        │    │
│  │  Example: Two Sum                                                       │    │
│  │  for i in range(n):                 # O(n) outer                       │    │
│  │    for j in range(i+1, n):          # O(n) inner = O(n²) total         │    │
│  │      if a[i] + a[j] == target:                                        │    │
│  │        return [i, j]                                                  │    │
│  │                                                                        │    │
│  │  Bottleneck identified: For each a[i], scanning all j to find target-a[i]│    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                              │                                                │
│                              ▼ Ask: "What am I rescanning?"                  │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │  STAGE 2: IDENTIFY THE REPEATED OPERATION                              │    │
│  │                                                                        │    │
│  │  For each a[i], we LINEARLY scan a[j..] to find "target - a[i]"       │    │
│  │  This linear scan is O(n). We do it n times. Total: O(n²).            │    │
│  │                                                                        │    │
│  │  Question: "Can I answer 'has target - a[i] appeared before?' in O(1)?"│    │
│  │  Answer: YES! Use a HashMap.                                            │    │
│  │                                                                        │    │
│  │  Bottleneck: O(n) lookup per element                                   │
│  │  Replacement: O(1) lookup (HashMap)                                    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                              │                                                │
│                              ▼ Ask: "Which DS answers this in O(1)?"         │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │  STAGE 3: CHOOSE THE DATA STRUCTURE / ALGORITHM                        │    │
│  │                                                                        │    │
│  │  Need: O(1) complement existence check                                  │    │
│  │   └── HashMap / HashSet: O(1) contains() lookup                       │    │
│  │                                                                        │    │
│  │  Other common bottlenecks and their replacements:                       │    │
│  │  ┌──────────────────────┬──────────────────────────────┐               │    │
│  │  │ Repeated Work        │ Replace With                │ Result        │   │
│  │  ├──────────────────────┼──────────────────────────────┼──────────────┤   │
│  │  │ Scanning for complement │ HashMap                  │ O(n²) → O(n) │   │
│  │  │ Recomputing range sum │ Prefix sum array           │ O(n×q) → O(1)│   │
│  │  │ Recursive fib calls  │ Memoization / DP table      │ O(2^n)→O(n)  │   │
│  │  │ Linear search sorted  │ Binary search             │ O(n) → O(log n)│  │
│  │  │ Repeated min/max     │ Heap / monotonic deque     │ O(n×k)→O(n log k)│ │
│  │  │ Repeated subproblems │ Memoization (top-down)     │ O(k^n)→O(n×k) │  │
│  │  │ All pairs shortest   │ BFS layer expansion       │ O(n²) → O(n)  │   │
│  │  └──────────────────────┴──────────────────────────────┴──────────────┘   │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                              │                                                │
│                              ▼ Apply the chosen DS/Algo                       │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │  STAGE 4: IMPLEMENT THE OPTIMAL SOLUTION                               │    │
│  │                                                                        │    │
│  │  Two Sum Optimized:                                                     │    │
│  │  seen = {}                          # O(n) space for HashMap           │    │
│  │  for x in a:                         # O(n) time, single pass         │    │
│  │    complement = target - x                                          │    │
│  │    if complement in seen:             # O(1) lookup ← THE OPTIMIZATION │    │
│  │      return [seen[complement], index]                                 │    │
│  │    seen[x] = index                   # O(1) insert                    │    │
│  │                                                                        │    │
│  │  Result: Time O(n) + Space O(n) ← Optimal for Two Sum!               │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                              │                                                │
│                              ▼ Verify: same output as brute force on tests   │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │  STAGE 5: VERIFY + COMPLEXITY STAMP                                     │    │
│  │                                                                        │    │
│  │  Before: Time: O(n²)   Space: O(1)  ← document original                │    │
│  │  After:  Time: O(n)    Space: O(n)  ← document optimization            │    │
│  │                                                                        │    │
│  │  Verify with edge cases: empty, single, duplicates, target=0,         │    │
│  │  max integer (overflow check in Java/C++)                              │    │
│  │                                                                        │    │
│  │  THE ONE-SENTENCE SUMMARY:                                             │    │
│  │  "I traded O(n) space (HashMap) to eliminate the O(n) inner scan,      │    │
│  │   reducing total time from O(n²) to O(n)."                            │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Historical Evolution

> **Why this section**: mental-model pedagogy requires knowing the prior art. The frameworks below all have named predecessors — naming them prevents reinventing the wheel and connects your reasoning to decades of computer-science practice.

| Year | Predecessor | Contribution |
| --- | --- | --- |
| 1978 | Horowitz & Sahni | *Fundamentals of Computer Algorithms* — brute-to-optimal methodology |
| 1974 | Aho, Hopcroft, Ullman | *Design and Analysis* — systematic bottleneck identification |
| 1986 | Bentley | *Programming Pearls* — loop rewriting case studies |
| 1998 | Skiena | *The Algorithm Design Manual* — algorithm selection by problem type |
| 1989 | Manber | *Introduction to Algorithms: A Creative Approach* — constructive algorithm derivation |

**Evolution narrative**: The "brute force to optimal" rewrite methodology traces to the formalization of algorithm design in the 1970s and 1980s. Ellis Horowitz and Sartaj Sahni's 1978 *Fundamentals of Computer Algorithms* established the canonical approach: for every problem, start with an exhaustive search (brute force), analyze its complexity, identify the dominant cost, then replace that specific operation with a more efficient data structure or algorithm — the exact pipeline this guide teaches. Aho, Hopcroft, and Ullman's 1974 *Design and Analysis of Computer Algorithms* provided the mathematical framework for bottleneck identification. Bentley's 1986 *Programming Pearls* demonstrated this on concrete case studies: Two Sum O(N^2) → HashMap O(N), prefix sum for range queries, etc. Steven Skiena's 1998 *Algorithm Design Manual* organized algorithm selection by problem type with explicit decision trees. Udi Manber's 1989 *Introduction to Algorithms* introduced the creative approach: algorithms as constructions, not discoveries — the insight that optimal solutions are engineered from known building blocks.

**Modern practice anchor**: Today's competitive programming and interview prep (LeetCode editorials, CTCI optimization sections, competitive coding coaches) use the brute-force-to-optimal pipeline that directly descends from the Horowitz-Sahni/Bentley lineage: name the repeated operation, replace it with the appropriate data structure, prove the invariant.

## Production Reality

> **Why this section**: a mental model is only useful if it predicts what breaks in production. Below are named failure modes tied to this mental model, with debug workflows and modern observability tools.

### Failure Mode 1: ReDoS (Regex Catastrophic Backtracking) — Cloudflare 2019

**What goes wrong**: A developer writes a regex for URL validation: `(a+)+$` or `(.*abc.*)+`. The regex has nested quantifiers. When given a carefully crafted input string (e.g., `aaaaaaaaaaaaaaaaaaaaaaaaaaaaa!`), the regex engine tries all possible match paths. Time complexity degrades from O(n) to O(2^n). A single request with a malicious URL takes 30+ seconds of CPU — enough to saturate a single core. 100 concurrent malicious requests = 100% CPU, service unavailable.

**Cost**: Cloudflare 2019 outage — regex DOS took down all Cloudflare services globally. Service unavailability for millions of sites. Estimated $50M+ business impact.

**Debug workflow**:
1. Use the regex static analyzer `re2` or `hyperscan` — these use linear-time algorithms and fail to compile catastrophic backtracking patterns.
2. Run `regex-benchmark` on your regex against a worst-case input before deploying: test with `a{50}!` vs `a{100}!`. If processing time grows exponentially with input length, your regex is vulnerable.
3. Avoid nested quantifiers: `(a+)+`, `(.*a.*)+`, `(a*)*` are all dangerous. Use `a+` or `a{1,100}` instead of `(a+)+`.
4. Add rate limiting on user-provided regex: if a user submits a custom regex, execute it in a sandboxed subprocess with a 1-second timeout.

### Failure Mode 2: Data Structure Rewrite at Scale — List to HashMap 100x Speedup

**What goes wrong**: A recommendation service uses an `ArrayList` for user lookups. With 1M users, `list.contains(user)` is O(n) = 1M operations per lookup. At 10,000 lookups/sec, that's 10 billion operations/sec. The engineer migrates to `HashMap` — O(1) lookup. Throughput jumps from 10 QPS to 1,000 QPS. But the migration introduced a subtle bug: the HashMap's hash function collisions on the `userId` string prefix caused O(n) degradation in the 1% of users with numeric-prefixed IDs.

**Cost**: Migration time invested, but O(1) claim was false for edge cases. A 1% error rate on 1M users = 10,000 users with degraded performance. Requires hotfix to fix the hash function.

**Debug workflow**:
1. After any DS migration (list→map, array→heap), run tests with adversarial inputs: duplicate keys, sorted input, reverse order, all-same values.
2. Measure p50/p95/p99 latency per bucket in the new structure. If p99 latency > 10x p50, there's a hash collision or ordering issue.
3. Benchmark the new DS with production-like data size and distribution. Test the 99th percentile user profile, not just average.
4. Add DS migration integration tests: after the HashMap migration, verify `get()` still returns the correct value for all input keys.

### Failure Mode 3: Nested Loop Rewrite Missed — O(n^2) SLA Breach in Production

**What goes wrong**: An order-processing service has a nested loop: for each order, scan all items to find the matching product. 10,000 orders × 10,000 products = 100M comparisons per batch. The engineer optimizes the inner scan to O(1) with a product HashMap — 10,000 HashMap lookups = 10M operations, 10x faster. But the outer loop is still there — the O(n^2) was reduced to O(n), not eliminated. At 1M orders/day, the service still processes 10^12 operations over 24 hours.

**Debug workflow**:
1. Verify total complexity after optimization: if the bottleneck was the inner loop, reducing it from O(n) to O(1) changes O(n^2) to O(n). If there are still nested loops, verify the outer loop is bounded.
2. Profile the optimized code: if the new inner-loop optimization accounts for <20% of total time, there may be another bottleneck (possibly the outer loop itself).
3. Add asymptotic complexity as a comment in code: `// Optimization: O(n^2) → O(n)` — this prevents future engineers from accidentally adding back the nested loop.
4. Run load tests with production data volumes before and after: verify the batch job time actually improves to the expected O(n) scale.

### Modern Production Tools

- **re2 / hyperscan**: Linear-time regex engines that reject catastrophic backtracking patterns at compile time. Use these for all user-facing regex validation.
- **JMH (Java Microbenchmark Harness)**: Benchmark DS transitions (ArrayList→HashMap, Array→Heap) with production data sizes. Verify p99 latency actually improved, not just average.
- **perf stat -e branch-misses,cache-misses**: Identify cache and branch prediction misses after DS migration. High cache misses after HashMap migration signal a collision or locality issue.
- **Datadog APM histogram**: Track p50/p95/p99 latency for batch jobs. After optimization, verify the latency histogram shifted left — not just average improvement.
- **Complexity budget in PR template**: Require engineers to state the time/space complexity before and after any optimization. If complexity didn't change (O(n^2)→O(n^2)), reject the PR with "optimization didn't address the bottleneck."

## Conceptual Depth & Topical Breadth

> **Why this section**: this mental model rests on a specific invariant, and its variants cover a spectrum of trade-offs. Knowing the invariant and the variants lets you apply the model correctly across problems.

### Invariant

**Brute force always works**; optimization escapes its limits. The invariant is that the naive solution is always correct but always slow. The optimization path is: write brute force correctly first, profile to find the bottleneck, then replace that specific bottleneck with a more efficient data structure or algorithm. The internal mechanism is **bottleneck isolation**: not all slow code is equally slow.

### Variants Comparison

| Optimization Lever | Bottleneck Pattern | Replacement | Typical Gain |
| --- | --- | --- | --- |
| HashMap for lookup | Nested loop with `in` check | dict/HashMap | O(n) per lookup → O(1) |
| Sorting | Unsorted pair enumeration | Sort + two-pointer | O(n^2) → O(n log n) |
| Prefix sum | Repeated range sum in loop | Prefix array | O(k) per query → O(1) |
| Sorting precomputation | Repeated computation | Sort once | O(n!) → O(n log n) |
| Heap for selection | Full scan for k-th largest | quickselect/heap | O(n) avg vs O(n log n) |
| Bit manipulation | Set operations via loops | Bitwise ops | O(n) → O(1) per operation |
| Memoization | Repeated subcomputation | Lookup table | Exponential → polynomial |


---

## Reality Check

**"Brute force is what you write when you cannot do better"** ? Brute force is the ANALYSIS INSTRUMENT the playbook is named for: writing it (or precisely sketching it) exposes the redundancy structure � WHAT work repeats � and each redundancy type names its own cure: recomputed subproblems ? memoize; rescanned ranges ? prefix/window; re-searched candidates ? sort/hash/heap; re-tested hopeless branches ? prune. Skipping brute force to "think optimal directly" discards the diagnostic that makes optimization systematic instead of oracular.

**"The optimization ladder climbs one rung per problem"** ? Real climbs CHAIN rungs, and the chain order matters: enumerate-all-subarrays (n squared space) ? running-sum (n squared time) ? prefix-map (n) is two distinct moves with different justifications; backtracking ? memoized ? tabulated ? space-rolled is three. The playbook skill is knowing at each rung WHICH lever remains (the state is still fat; the scan is still redundant; the branch factor is still raw) � a ladder where you can name the next rung is progress; one where you re-derive from scratch each time is not a ladder at all.

**"From brute force, optimization proceeds by making the code faster"** ? Half the playbook's moves change the QUESTION before touching the code: count the complement instead (at-most-k minus at-most-k-minus-one), sum contributions per element instead of per subarray (each element counts in this-many windows � the contribution flip), binary-search the answer instead of computing it (monotone feasibility replaces construction), process offline in sorted order instead of arriving order. These reformulations routinely jump two complexity classes where code-tightening jumps none � the playbook's deepest rungs are rhetorical, not mechanical.

**"Getting stuck mid-ladder means the approach is wrong"** ? Mid-ladder stalls have a THREE-QUESTION diagnostic before any restart: is the state minimal (fat state blocks the memo table's reuse � shrink what the future needs)? is work shared across iterations (the window that rebuilds instead of updating � find the incremental delta)? is information thrown away that was paid for (the sort you did but never exploit; the failure position KMP would reuse)? Most stalls yield to one of the three; restarting from scratch abandons the diagnostic value the climb already produced.

**"The playbook ends at the optimal complexity"** ? The playbook ends at the JUSTIFIED STOP: matching a known lower bound (comparison sort's n log n; reading all input is Omega(n)), matching the constraint budget with headroom, or hitting the rung where further gains cost correctness risk disproportionate to need. "Can you do better?" is answered as often by "no, and here is why � every element must be examined" as by another rung � and the lower-bound answer, delivered with its one-line proof, is the strongest possible finish. Optimal is a claim about the problem; knowing when you hold that claim is the playbook's final page.
