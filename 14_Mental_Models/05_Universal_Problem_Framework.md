**Navigation**: [< Previous](04_Array_String_Thinking.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](06_Implementation_Checklist.md)

# 🧭 Universal Problem-Solving Framework — 6-Step Method for ANY Problem

**The key insight**: Every problem — DSA, SQL, system design — follows the same thinking process. Master this 6-step framework and you'll never freeze in front of a problem again.

> Companion playbook: [Brute Force to Optimal](22_Brute_Force_To_Optimal_Playbook.md) shows how to start with loops, identify the bottleneck, and replace it with the right data structure or algorithm.

---

## The 6 Steps

```
┌──────────────────────────────────────────────────────────────┐
│  1. READ    → Understand what's asked (not what you assume)  │
│  2. CLASSIFY → What type of problem is this?                 │
│  3. PLAN    → Choose strategy, design approach               │
│  4. CODE    → Translate plan to code                         │
│  5. TEST    → Verify with examples and edge cases            │
│  6. OPTIMIZE → Can we do better?                             │
└──────────────────────────────────────────────────────────────┘
```

## NEW DIAGRAM — Constraint → Complexity → Pattern Decision Tree

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  DIAGRAM: Constraint-Based Pattern Selection — Read Constraints, Pick Pattern│
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  THE METHOD:                                                                 │
│  Constraints (N, time limit, special values) → tells you ALLOWED COMPLEXITY │
│  Complexity budget → narrows the pattern search space → correct pattern      │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  STEP 1: Read N (input size) → determine maximum acceptable complexity│    │
│  │                                                                       │    │
│  │  N ≤ 10       → O(N!) permutations, O(2^N) subsets, backtracking      │    │
│  │  N ≤ 20       → O(2^N) bitmask DP, meet-in-the-middle (split in half) │    │
│  │  N ≤ 100      → O(N³) Floyd-Warshall, interval DP, matrix chain       │    │
│  │  N ≤ 2,000    → O(N²) pair DP, 2D grid, nested loops                 │    │
│  │  N ≤ 100,000  → O(N log N) sorting + binary search, segment tree      │    │
│  │                → OR O(N) if O(N log N) still too slow                 │    │
│  │  N ≤ 1,000,000→ O(N) single-pass, prefix sum, two pointers, sliding   │    │
│  │                window                                                   │    │
│  │  N ≥ 10^9     → O(log N) binary search, math formula, fast power      │    │
│  │                                                                       │    │
│  │  TIME BUDGET (1 sec Java ≈ 1e8 ops):                                   │    │
│  │  O(N!) → N ≤ 10       |  O(N·2^N) → N ≤ 20    |  O(N³) → N ≤ 500    │    │
│  │  O(N²) → N ≤ 10,000   |  O(N log N) → N ≤ 1e6 |  O(N) → N ≤ 1e8    │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                              │                                                │
│                              ▼                                                │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  STEP 2: Read special VALUE constraints → OVERRIDE complexity guess   │    │
│  │                                                                       │    │
│  │  NEGATIVE numbers allowed?                                            │    │
│  │  → "subarray sum" problem: NO sliding window (not monotonic)         │    │
│  │    → Use prefix sum + hashmap instead (O(n) still, different tool)   │    │
│  │                                                                       │    │
│  │  UPDATE operations on range queries?                                  │    │
│  │  → "Range sum query" with updates: NO plain prefix sum               │    │
│  │    → Use Fenwick tree or segment tree (O(log N) per operation)       │    │
│  │                                                                       │    │
│  │  WEIGHTED edges in graph?                                             │    │
│  │  → "Shortest path" with weights: NO plain BFS                        │    │
│  │    → Use Dijkstra (non-neg) or Bellman-Ford (with neg)              │    │
│  │                                                                       │    │
│  │  Need to preserve original indices?                                   │    │
│  │  → "Pair sum in array" with original positions: NO sorting (loses pos)│    │
│  │    → Use hashmap complement (O(n) time, preserves indices)          │    │
│  │                                                                       │    │
│  │  O(1) extra space required?                                           │    │
│  │  → No HashMap, no extra array. Use in-place or two pointers.         │    │
│  │                                                                       │    │
│  │  ARRAY is sorted?                                                     │    │
│  │  → Binary search → O(log N)  /  Two pointers → O(N)                  │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                              │                                                │
│                              ▼                                                │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  STEP 3: Match complexity budget + value constraints → PATTERN        │    │
│  │                                                                       │    │
│  │  CONTIGUOUS subarray / SUBSTRING problem?                             │    │
│  │  ├── Positive/all same values → Sliding Window (O(n))                │    │
│  │  └── Negative or mixed → Prefix Sum + HashMap (O(n))                 │    │
│  │                                                                       │    │
│  │  PAIR / SUM / COMPLEMENT problem?                                      │    │
│  │  ├── Sorted array → Two Pointers (O(n))                              │    │
│  │  └── Any array (need indices) → HashMap complement (O(n))            │    │
│  │                                                                       │    │
│  │  RANGE QUERY problem?                                                 │    │
│  │  ├── No updates → Prefix sum / Sparse table (O(1) query)             │    │
│  │  ├── Updates + queries → Fenwick / Segment tree (O(log N))           │    │
│  │  └── Static range min/max → Sparse table (O(1) query, O(n log n) build│    │
│  │                                                                       │    │
│  │  GRAPH problem?                                                       │    │
│  │  ├── Shortest path + unweighted → BFS (O(V+E))                       │    │
│  │  ├── Shortest path + weighted (non-neg) → Dijkstra (O(E log V))      │    │
│  │  ├── Shortest path + neg edges → Bellman-Ford (O(V·E))              │    │
│  │  └── Topological order → Kahn's BFS or DFS postorder (O(V+E))       │    │
│  │                                                                       │    │
│  │  DP problem?                                                          │    │
│  │  ├── 1D state (dp[i]) → O(N) or O(N²) depending on transition       │    │
│  │  ├── 2D state (dp[i][j]) → O(N·M) or O(N²) — check space opt        │    │
│  │  └── State = bitmask (n ≤ 20) → O(2^N · N) — TSP, shortest path all │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  FINAL DECISION:                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  1. Read N → know max acceptable complexity                           │    │
│  │  2. Read value constraints → apply OVERRIDES (negatives, updates, etc)│    │
│  │  3. Match remaining patterns → pick the most efficient valid one     │    │
│  │  4. If unsure → start with brute force, profile, optimize            │    │
│  │                                                                       │    │
│  │  Example: "N=100,000, subarray sum with NEGATIVE numbers"            │    │
│  │  → N=100,000 → budget is O(N log N) or O(N)                          │    │
│  │  → Negatives → sliding window FAILS (not monotonic)                  │    │
│  │  → Pattern: Prefix Sum + HashMap = O(N) time, O(N) space ← CORRECT  │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Step 1: READ — Actually Understand the Problem

### The 5 Questions to Ask

```
1. What is the INPUT? (type, size, constraints, range)
2. What is the OUTPUT? (type, format, what exactly to return)
3. What are the CONSTRAINTS? (time limit, space limit, n ≤ ?)
4. What are the EDGE CASES? (empty, single element, all same, negative)
5. Can I REPHRASE this in my own words?
```

### Constraint-to-Complexity Mapping (CRITICAL)

```
n ≤ 10        → O(n!) or O(2ⁿ) — Brute force, backtracking OK
n ≤ 20        → O(2ⁿ) — Bitmask DP, meet-in-the-middle
n ≤ 100       → O(n³) — Floyd-Warshall, 3D DP
n ≤ 1,000     → O(n²) — Simple DP, Nested loops
n ≤ 10,000    → O(n²) — Might barely pass
n ≤ 100,000   → O(n log n) — Sorting, Binary search, Segment tree
n ≤ 1,000,000 → O(n) — Linear scan, HashMap, Two pointers
n ≤ 10⁸       → O(n) — Must be single pass
n > 10⁸       → O(log n) or O(1) — Math, Binary search on answer
```

### Constraint-to-Pattern Overrides

After choosing the rough complexity, check the value rules:

| If Constraints Say                     | Avoid                      | Prefer                             |
| -------------------------------------- | -------------------------- | ---------------------------------- |
| negative numbers in subarray sum       | naive sliding window       | prefix sum + hashmap/tree/deque    |
| online updates after range queries     | static prefix/sparse table | Fenwick / segment tree             |
| weighted graph edges                   | plain BFS                  | Dijkstra / 0-1 BFS / Bellman-Ford  |
| negative graph edges                   | Dijkstra                   | Bellman-Ford / potentials          |
| original indices required              | sorting blindly            | hashmap/index-preserving structure |
| recursion depth can hit `1e5+` in Java | recursive DFS              | iterative stack/BFS                |

Full map: [Constraint-Based Pattern Selection](../04_Patterns_Templates/25_Constraint_Based_Pattern_Selection.md).

---

## Step 2: CLASSIFY — What Type of Problem Is This?

### The Classification Decision Tree

```
Does the problem ask about...

OPTIMIZATION (min/max/best)?
├── Can previous choices be reused? → Dynamic Programming
├── Does greedy choice lead to global optimum? → Greedy
└── Need to try all combinations? → Backtracking

COUNTING (how many ways/paths/subsets)?
└── → Dynamic Programming (almost always)

SEARCHING/EXISTENCE (is there a...? can we...?)?
├── Sorted data? → Binary Search
├── Graph/tree? → BFS/DFS
└── State space? → BFS (shortest) or DFS (any path)

ORDERING (sequence, schedule, dependency)?
├── Dependencies? → Topological Sort
└── Optimal order? → DP or Greedy

GROUPING (partition, cluster, components)?
├── Graph connected components? → Union-Find or DFS
└── k-groups optimization? → DP or Greedy

DATA RETRIEVAL (query, lookup)?
├── Range queries? → Segment Tree / Prefix Sum
├── Key-value? → HashMap
└── Top-K? → Heap / QuickSelect

STRING MANIPULATION?
├── Pattern matching? → KMP / Rabin-Karp
├── Palindrome? → Two pointers / DP
└── Subsequence comparison? → DP (LCS, Edit Distance)
```

---

🔬 **Section Challenge — Step 2: CLASSIFY — What Type of Problem Is This?**

**Challenge 1 (Reasoning):** A problem asks you to find the "minimum number of jumps to reach the end of an array." What are the two most likely algorithmic classifications for this problem, and what specific constraint would force you to pick one over the other?

<details><summary>Answer</summary>

The two most likely classifications are **Dynamic Programming** (optimization problem with overlapping subproblems) and **Greedy** (if a local optimum leads to the global optimum). If the constraint is `N = 100,000`, O(N^2) DP will fail with `Time Limit Exceeded`, forcing you to find the O(N) Greedy solution. If `N = 1,000`, the O(N^2) DP approach is perfectly acceptable.

</details>

**Challenge 2 (Design):** You are given a list of a million words and must frequently query whether a specific prefix exists in the list. What classification is this, and what is the optimal data structure?

<details><summary>Answer</summary>

This is a **Data Retrieval (Query/Lookup)** classification, specifically involving String Prefix Matching. The optimal data structure is a **Trie (Prefix Tree)**. While a HashMap provides O(1) exact-word lookups, it cannot easily answer "does any word _start with_ this prefix" without iterating over all keys. A Trie answers prefix queries in O(K) time, where K is the length of the prefix.

</details>

## Step 3: PLAN — Design Your Approach

### Planning Template

```
Write this down (mentally or on paper):

1. Data structure(s) I'll use: _______________
2. Algorithm/pattern: _______________
3. Key variables I need: _______________
4. Walk through Example 1 with my approach:
   Input: ___  → Step 1: ___ → Step 2: ___ → Output: ___
5. Walk through Example 2:
   Input: ___  → Step 1: ___ → Step 2: ___ → Output: ___
6. Does it handle edge cases? ___

If your plan doesn't work on examples → GO BACK to Step 2 and reclassify
```

### The "Brute Force First" Principle

```
ALWAYS think of brute force first:
1. What's the simplest way to solve this? (even if O(n³))
2. Where is the repeated work?
3. Can I cache/skip the repeated work? → That's your optimization!

Brute Force → Identify bottleneck → Optimize that specific part

Example: Two Sum
- Brute force: Check all pairs O(n²)
- Bottleneck: "Does complement exist?" is O(n) search each time
- Optimize: HashMap makes search O(1) → Total O(n)
```

---

## Step 4: CODE — Translation Rules

### Code Structure Template

```java
public ReturnType solve(InputType input) {
    // 1. HANDLE EDGE CASES (empty, null, size 0/1)
    if (input == null || input.length == 0) return defaultValue;

    // 2. INITIALIZE data structures and variables
    // (declare what you planned in Step 3)

    // 3. CORE LOGIC (the algorithm)
    // (the main loop/recursion)

    // 4. RETURN the answer
    return answer;
}
```

### Common Pitfalls While Coding

```
❌ Starting to code before having a plan → Write plan first
❌ Trying to optimize while writing → Get correct solution first
❌ Not handling edge cases → Always check empty/null/single
❌ Copy-pasting without understanding → Build from template
❌ Variables named i,j,k,x,y → Use descriptive names: left, right, count
```

---

## Step 5: TEST — Verify Correctness

### Testing Strategy (in order)

```
1. PROVIDED examples — Must pass these first
2. MINIMAL cases — Empty input, single element
3. BOUNDARY cases — n=0, n=1, n=max_value
4. TRICKY cases — All same elements, sorted/reverse-sorted, negatives
5. LARGE cases — Mental check: will this pass within time limit?
```

### Dry Run Template

```
Input: [2, 7, 11, 15], target = 9

Step | Variable States                | Action
-----|-------------------------------|---------------------------
  0  | map={}, i=0                   | Check: 9-2=7 in map? No
  1  | map={2:0}, i=1                | Check: 9-7=2 in map? Yes!
  →  | Return [0, 1]                 | Found pair

✅ Matches expected output [0, 1]
```

---

## Step 6: OPTIMIZE — Can We Do Better?

### Optimization Strategies

```
Strategy 1: REDUCE time complexity
- O(n²) → O(n log n): Sort + binary search / two pointers
- O(n²) → O(n): HashMap for O(1) lookup
- O(2ⁿ) → O(n·2^(n/2)): Meet in the middle

Strategy 2: REDUCE space complexity
- HashMap → Two pointers (if sorted)
- 2D DP table → Two rows → Two variables
- Recursion → Iteration (eliminate call stack)

Strategy 3: PRECOMPUTE
- Prefix sums for range queries
- Sort for binary search
- Build adjacency list once for multiple graph queries
```

### The "Can We Do Better?" Checklist

```
□ Am I doing any repeated computation? → Cache it (DP, memoization)
□ Am I searching linearly? → Can I sort + binary search?
□ Am I using nested loops? → Can HashMap eliminate inner loop?
□ Am I storing more than needed? → Can I use rolling variables?
□ Am I visiting nodes multiple times? → Track visited
□ Am I sorting when I don't need full sort? → Partial sort (QuickSelect for k-th)
```

---

## Applying This to SQL Problems

```
Step 1: READ → What tables? What columns? What's the expected output?
Step 2: CLASSIFY → Is this a JOIN/GROUP BY/SUBQUERY/WINDOW problem?
Step 3: PLAN → Build query mentally: FROM → JOIN → WHERE → GROUP → SELECT
Step 4: CODE → Write the SQL
Step 5: TEST → Run against example data mentally
Step 6: OPTIMIZE → Indexes? Avoid subqueries? Use CTEs?
```

## Applying This to System Design

```
Step 1: READ → What are the requirements? Functional + Non-functional
Step 2: CLASSIFY → Read-heavy? Write-heavy? Real-time? Batch?
Step 3: PLAN → High-level architecture, data model, API design
Step 4: CODE → Draw the architecture diagram
Step 5: TEST → Walk through user scenarios
Step 6: OPTIMIZE → Scaling bottlenecks, caching, CDN, sharding
```

---

## Historical Evolution

> **Why this section**: mental-model pedagogy requires knowing the prior art. The frameworks below all have named predecessors — naming them prevents reinventing the wheel and connects your reasoning to decades of computer-science practice.

| Year | Predecessor | Contribution |
| --- | --- | --- |
| 1945 | Polya | *How to Solve It* — the original 4-phase method |
| 1955-1959 | Newell, Shaw, Simon | GPS — first AI problem-solving program |
| 1969 | Simon | *The Sciences of the Artificial* — design as a discipline |

**Evolution narrative**: The universal problem-solving framework traces to George Polya's 1945 *How to Solve It*, which introduced the 4-phase structure (understanding, planning, executing, reviewing) for mathematical problem-solving. This was the first formalization of the idea that problem-solving is a learnable, teachable skill with transferable heuristics. Allen Newell and Herbert Simon's work at RAND (culminating in the General Problem Solver, 1957-1959) built the first computational implementation of Polya's ideas: a program that could solve problems by searching a state space using means-ends analysis. Simon's 1969 *The Sciences of the Artificial* synthesized this work into a broader theory of design methodology — showing that problem-solving frameworks are not just for mathematics but for any designed artifact, including software.

**Modern practice anchor**: Today's 6-step problem-solving frameworks (used in MIT's undergraduate algorithms curriculum, CTCI's interview prep, competitive programming coaches) are direct descendants of Polya's original work, augmented with Simon's AI-era insights about state-space search and heuristic guidance. The "READ → CLASSIFY → PLAN → CODE → TEST → OPTIMIZE" structure mirrors both Polya's phases and the GPS architecture.

## Production Reality

> **Why this section**: a mental model is only useful if it predicts what breaks in production. Below are named failure modes tied to this mental model, with debug workflows and modern observability tools.

### Failure Mode 1: Incident = Problem Treated as Symptom (On-Call Fires Symptoms, Not Causes)

**What goes wrong**: Engineers skip the "classify" phase and treat the incident symptom (high latency, errors) as the problem. They restart services, scale pods, or add retries without diagnosing the root cause. The symptom returns within minutes or hours. Example: increasing pod count to handle "high load" when the real problem is an N+1 query causing 10x database load.

**Cost**: MTTR increases from minutes to hours. Wasted compute (over-scaling), and the incident recurs. At $5,000/minute for large-scale incidents, a 3-hour recurring incident = $900,000 in unnecessary cost.

**Debug workflow**:
1. Use 5-whys analysis in every incident: "Why is latency high? Because DB queries are slow. Why? Because missing index. Why? Because schema changed last sprint without index. Why? Because no migration review."
2. Tag incidents with "root cause category" — over time, the tag distribution reveals which problem classifications recur.
3. Add "diagnosis checklist" to on-call runbooks: before taking action, confirm (a) you know the root cause, (b) the action addresses the cause, not the symptom.

### Failure Mode 2: Production Query Planner Misclassification (Forces Full-Table Scan)

**What goes wrong**: The query planner classifies a query as "sequential scan" when it should use an index. This happens when statistics are stale (`ANALYZE` hasn't run), or when the planner misestimates row count. At n=10,000 rows, a sequential scan is fine. At n=10,000,000 rows, it's a full-table scan that takes 30+ seconds.

**Cost**: Query timeout in production (typically 5-30 second limit). Affected users see blank screens or error messages. If this is a high-traffic endpoint, hundreds of requests queue behind it.

**Debug workflow**:
1. Run `EXPLAIN ANALYZE <query>` on production query patterns. Look for "Seq Scan" on large tables — if found, investigate why the index wasn't used.
2. Check `pg_stat_user_tables.last_analyze` (PostgreSQL) or `sys.dm_db_stats_properties` (SQL Server) — if stale, run `ANALYZE`.
3. Force index use for testing: `SET enable_seqscan = off;` — if the query becomes fast, the planner needs better statistics or a hint.

### Failure Mode 3: Constraint Misreading = Wrong Pattern = Production Rollback

**What goes wrong**: The "classify" phase misidentifies the constraint type (e.g., reading "find the first k elements" as "sort then take" when it should be "maintain a min-heap of size k"). The implemented solution is O(n log n) when O(n) was achievable, but more critically, it produces correct output with the wrong algorithm that fails at scale.

**Cost**: Feature rollback. Code that works in staging fails in production load tests. Engineering time to reimplement, 3-day delay on feature launch, potential loss of competitive advantage.

**Debug workflow**:
1. Add constraint extraction checklist before coding: "What are the inputs? What are the output requirements? What are the performance constraints (time/space)? What edge cases are specified?"
2. Cross-check with problem bank: "Have I seen this constraint before? What pattern did I use?"
3. Add load testing with production-like data sizes before shipping. Code review gate: "does this solution meet the constraint at max scale?"

### Modern Production Tools

- **PagerDuty + 5-whys tagging**: Tag incidents with root cause categories; over time, build a histogram revealing which problem types recur most.
- **PostgreSQL `pg_stat_statements`**: Tracks query execution times and plans. Find queries with high total time that are full-table scanning large tables.
- **`slow_query_log` (MySQL/PostgreSQL)**: Enable `log_min_duration_statement = 1000` to log queries > 1 second, revealing pattern misclassifications under load.

## Conceptual Depth & Topical Breadth

> **Why this section**: this mental model rests on a specific invariant, and its variants cover a spectrum of trade-offs. Knowing the invariant and the variants lets you apply the model correctly across problems.

### Invariant

Every problem has a **constraint → pattern → complexity → solution** pipeline. The invariant is that the problem's input constraints (size, shape, order, duplicates, range) determine the algorithmic pattern, which determines the complexity class, which determines whether a solution is feasible. This is not circular — constraints are the input, pattern is the algorithm class, complexity is the theoretical bound, and solution is the concrete implementation. The internal mechanism is **constraint inference**: reading a problem statement and extracting quantitative constraints (n = 10^5, O(n log n) required, etc.) is a skill that separates experienced problem-solvers from novices. The constraints are the problem's contract with the algorithm — violating them (e.g., using O(n^2) when O(n log n) is required) produces solutions that fail at scale.

### Variants Comparison

| Constraint Class | Signal in Problem | Implied Pattern | Complexity Hint |
| --- | --- | --- | --- |
| Size n | "n up to 10^5" | Needs O(n) or O(n log n) | O(n^2) too slow |
| Sorted input | "sorted array," "increasing order" | Two-pointer, binary search | Avoid extra sorting |
| Duplicates | "may contain duplicates," "unique pairs" | HashMap deduplication, skip duplicates | Check before insert |
| Range (min/max) | "elements in [0, 10^9]" | HashMap, counting, prefix sum | Sorting may overflow |
| Pair target | "sum to target," "two sum" | Two-pointer (sorted) or hashmap | O(n) or O(n log n) |
| Subarray/sum | "subarray sum equals k" | Prefix sum + hashmap | O(n) avg, O(n^2) brute |
| Graph/shape | "grid," "maze," "connected" | BFS/DFS/Union-Find | O(V+E) traversal |
| Binary/interval | "binary tree," "intervals" | DFS/in-order, interval merge | O(n) or O(n log n) |

### Decision Table

| Constraint Violation | Default Correct Choice | Fix |
| --- | --- | --- |
| n > 10^5, nested loops | O(n^2) too slow | HashMap, sorting, or divide-and-conquer |
| Required O(n log n) | Linear scan | Binary search if sorted |
| Memory limit 256MB | O(n) space OK, O(n^2) not | Compress state, rolling array |
| Negative numbers in array | Prefix sum needs hashmap (not array) | Use dict for frequency |
| Unsorted but need O(1) lookup | HashMap | Sort O(n log n) vs hash O(n) |
| All elements same | HashMap for counting | Special-case output |


---

## Reality Check

**"A universal framework solves problems for you"** ? The framework GUARANTEES coverage, not insight: it ensures you extracted constraints, tried representations, and tested hypotheses in order � so the insight has maximal chance to fire � but the firing is still pattern recognition built from practice. Frameworks fail their users in two symmetric ways: expecting the checklist to produce the idea (it only prevents missing it), and abandoning the checklist once "experienced" (which reintroduces the unforced errors it existed to prevent).

**"Following all steps every time is the discipline"** ? CALIBRATED skipping is the discipline: easy problems collapse steps legitimately (constraints and pattern arrive together), hard problems need every step slowly, and the framework's real job is telling you WHICH situation you are in � when the fast path stalls (two minutes, no traction), the full sequence activates as the fallback protocol. Rigid full-sequence users are slow on easies; rigid skippers are lost on hards; the framework includes its own escalation rule.

**"The framework is for solving; verification is separate"** ? Verification is EMBEDDED at every step or the framework silently derails: the restated problem gets checked against an invented example (comprehension), the chosen pattern against a tiny adversarial input (fit), the coded solution against the nastiest edge (implementation). A framework run without embedded checks produces confident wrong answers WITH excellent process hygiene � the most dangerous failure mode, because it feels like rigor.

**"One framework fits algorithms, design, and debugging"** ? The SKELETON transfers (understand, represent, hypothesize, test, iterate); the FLESH is domain-specific: algorithms hypothesize patterns and test with counterexamples, design hypothesizes architectures and tests with load numbers and failure cases, debugging hypothesizes causes and tests with bisection and instrumentation. Selling one undifferentiated framework for all three produces vague competence; knowing the shared skeleton plus each domain's test-of-choice produces transfer.

**"Experts have internalized the framework and no longer use it"** ? Experts run it SUBCONSCIOUSLY until difficulty spikes � then deliberately re-externalize it: writing constraints down, saying the restatement aloud, listing hypotheses on paper. The observable difference between expert and intermediate under real difficulty is exactly this downshift � intermediates keep flailing at intuition speed, experts drop to framework speed on purpose. Internalization is the default mode, not the retirement of the tool; the tool retires never.
