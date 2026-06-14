# 14 Mental Models — Conceptual Depth / Topical Breadth Upgrade Log

Documents all Conceptual Depth (invariant paragraphs) and Topical Breadth (comparison tables) added during the Combined Lens pedagogy upgrade. Each entry records invariants named and comparison tables added per file.

---

## 14_Mental_Models/00_INDEX.md

### Invariants named
- The 6 mental model classes are exhaustive for standard algorithmic/system design problems
- Problem classification is deterministic given correct problem features: same features always map to the same mental model
- Mental model selection precedes algorithm selection: the right model makes the right algorithm obvious

### Comparison tables added
- **6 Mental Model Classes with Files Mapping**: Table with columns: Mental Model, Key Precondition, Problems It Solves, Primary Files. Covers Recursion_Tree, DP_State, Graph_Tree, Array_String, System_Design, and Universal_Problem_Framework.

---

## 14_Mental_Models/01_Recursion_Tree_Thinking.md

### Invariants named
- Recursion works when the problem has self-similar substructure and a clear base case
- Every recursive call reduces the problem size toward the base case
- The call stack depth equals the maximum recursion depth; tail-call optimization eliminates this when applicable
- Memoization is valid when subproblem results are pure (same input always yields same output)

### Comparison tables added
- **7 Recursion Variants** with columns: Variant, Mechanism, Space Complexity, Time Complexity, When to Use. Covers: naive recursion, memoization, tabulation, tail-call, trampoline, accumulator passing, explicit stack.
- **Decision Table for Recursion Choice by Problem Feature**: Problem Feature → Recommended Approach. Self-similar + small input → naive; overlapping subproblems → memoization; known recurrence → tabulation; risk of stack overflow → explicit stack/iterative.

---

## 14_Mental_Models/02_DP_State_Thinking.md

### Invariants named
- DP requires both optimal substructure (optimal solution contains optimal sub-solutions) and overlapping subproblems (same subproblems solved multiple times)
- State definition determines everything: wrong state = wrong algorithm
- DP table fills in topological order of state dependencies; circular dependencies indicate wrong state

### Comparison tables added
- **5 DP Variants** with columns: Variant, Direction, Space, When to Use. Covers: top-down (memoization), bottom-up (tabulation), rolling array, sparse table, bitmask DP.
- **State Definition Checklist**: columns: Question, Why It Matters, Red Flag. Covers: Is the state minimal? Is it sufficient? Are transitions acyclic?

---

## 14_Mental_Models/03_Graph_Tree_Thinking.md

### Invariants named
- Graph traversal visits every reachable vertex exactly once in a connected component
- BFS discovers vertices in order of increasing distance from source
- DFS completes when the recursion stack or explicit stack is empty
- Tree is a special graph with exactly V-1 edges and no cycles

### Comparison tables added
- **6 Traversal Variants** with columns: Variant, Data Structure, Order, Space, When to Use. Covers: recursive DFS, iterative DFS, BFS, Dijkstra, A*, topological sort.
- **Adjacency Representation Comparison**: columns: Representation, Space, Edge Check, Iterate Neighbors, When to Use. Covers: adjacency matrix, adjacency list, edge list.

---

## 14_Mental_Models/04_Array_String_Thinking.md

### Invariants named
- Two-pointer movement preserves the problem invariant (e.g., sum comparison)
- Sliding window maintains a contiguous subsequence satisfying a predicate
- Binary search requires the search space to be monotonic with respect to the predicate

### Comparison tables added
- **5 Two-Pointer Variants** with columns: Variant, Initialization, Move Rules, Invariant, Problems. Covers: opposite ends, fast-slow, fixed distance, sliding window, multiple passes.
- **String Search Algorithm Comparison**: columns: Algorithm, Preprocess Time, Search Time, Space, Best For. Covers: brute force, Boyer-Moore, KMP, Rabin-Karp.

---

## 14_Mental_Models/05_Universal_Problem_Framework.md

### Invariants named
- Every problem has exactly one optimal complexity class given its constraints
- Pattern selection is reversible: you can verify pattern correctness by deriving the algorithm from the pattern
- The gap between brute-force complexity and optimal complexity narrows as problem structure is better understood

### Comparison tables added
- **8 Constraint Classes with Implied Patterns**: columns: Constraint Type, n Range, Implied Complexity, Pattern. Covers: n≤12 → O(2ⁿ) brute force; n≤20 → O(n·2ⁿ) DP-bitmask; n≤2000 → O(n²); n≤10⁵ → O(n log n); etc.

---

## 14_Mental_Models/06_Implementation_Checklist.md

### Invariants named
- Every bug has a root cause; treating symptoms produces复发
- Off-by-one errors are the most common correctness bug; always test boundary conditions
- Type safety prevents a class of bugs entirely; rely on the type system

### Comparison tables added
- **8 Bug Classes** with columns: Bug Class, Common Cause, Detection Method, Prevention. Covers: off-by-one, null/undefined, integer overflow, race condition, memory leak, type mismatch, logic error, concurrency error.
- **Debug Tool Selection Table**: Problem Type → Tool. Memory leak → Valgrind/ASAN; Race → ThreadSanitizer; Performance → perf/FlameGraph; Logic → unit test.

---

## 14_Mental_Models/07_SQL_Mental_Pipeline.md

### Invariants named
- SQL executes stages in fixed order; understanding the order resolves ambiguity
- Indexes speed up lookups but slow down writes; there is no free lunch
- A query plan is correct regardless of its cost, but an expensive plan may indicate a missing index

### Comparison tables added
- **5 JOIN Types** with columns: Type, Description, Venn Analogy, When to Use. Covers: INNER, LEFT, RIGHT, FULL, CROSS.
- **WHERE vs HAVING Decision Table**: columns: Context, Filter Timing, Works With, Example. Clarifies that WHERE filters rows before grouping; HAVING filters groups after GROUP BY.

---

## 14_Mental_Models/08_Debugging_DryRun.md

### Invariants named
- The bug is always between the observed behavior and the assumption; challenge assumptions first
- Reproducibility is necessary for debugging; if it cannot be reproduced, it cannot be verified as fixed
- The simplest explanation is usually wrong for persistent bugs; examine all interactions

### Comparison tables added
- **7 Debug Strategies** with columns: Strategy, When to Apply, Tools, Limitation. Covers: binary search (divide state space), delta debugging (automated isolation), print debugging (quick), profiler (performance), replay (race conditions), bisect (regression), flame graph (hot path).
- **Heisenbug Identification Checklist**: Observable clues that suggest a Heisenbug vs a standard bug.

---

## 14_Mental_Models/09_Complexity_Intuition.md

### Invariants named
- Complexity is an upper bound; the actual running time depends on constant factors and implementation quality
- Amortized analysis guarantees average cost per operation over a sequence, not per operation in isolation
- Space complexity is equally important as time; O(n) space can be as limiting as O(n²) time

### Comparison tables added
- **Big-O Classes at Scale**: columns: Class, n=10³ ops, n=10⁶ ops, n=10⁹ ops, Real-Time at 10⁹ ops/sec. Covers: O(1), O(log n), O(n), O(n log n), O(n²), O(2ⁿ). Shows which algorithms are feasible at which scale.
- **Complexity Class Decision Table**: Input Size + Problem Type → Recommended Approach.

---

## 14_Mental_Models/10_Interview_Thinking.md

### Invariants named
- Communication is evaluated continuously; silence is interpreted negatively
- The interviewer is testing both solution quality and collaborative problem-solving
- The first solution is never the final solution; iterate publicly

### Comparison tables added
- **6 Interview Stages** with columns: Stage, Duration, Goal, Watch For, Red Flag. Covers: read problem, clarify constraints, design algorithm, implement, test, discuss.
- **Interviewer Signal Decision Table**: columns: Signal Observed, Interpretation, Recommended Response. Covers: nodding, checking phone, asking for space complexity, asking about edge cases.

---

## 14_Mental_Models/11_Greedy_vs_DP_Decision.md

### Invariants named
- Greedy correctness requires matroid structure or exchange argument; if you cannot prove it, it is likely wrong
- DP is the safe choice when greedy correctness is uncertain; correctness over speed on first pass
- The greedy/DP boundary is determined by whether local optimal implies global optimal

### Comparison tables added
- **Greedy/DP/Brute/D&C Variants Comparison**: columns: Approach, When to Use, Proof Method, Time, Space. Covers: greedy with proof, DP memoization, DP tabulation, brute force, divide and conquer.
- **Greedy Algorithm Catalog** with columns: Problem, Greedy Criterion, Correctness Condition. Covers: activity selection, Huffman coding, minimum spanning tree, Dijkstra's algorithm.

---

## 14_Mental_Models/12_Space_Time_Tradeoffs.md

### Invariants named
- Memory hierarchy is real; cache-aware algorithms consistently outperform cache-agnostic ones by orders of magnitude
- A Bloom filter's false positive rate is determined solely by m/n and k (hash functions); it cannot be reduced without more space

### Comparison tables added
- **6 Caching Strategies** with columns: Strategy, Mechanism, Hit Rate, Memory Cost, Invalidation. Covers: LRU, LFU, FIFO, Random, Arc, TinyLFU.
- **Online vs Offline Algorithm Comparison**: columns: Property, Online, Offline. Covers: decision timing (before/after seeing full input), typical techniques, approximation ratio.

---

## 14_Mental_Models/13_Pattern_Composition.md

### Invariants named
- Outer and inner patterns must be compatible: inner pattern output must match outer pattern input type
- Composition is correct if the inner pattern's result satisfies the outer pattern's preconditions
- Pattern interaction bugs occur when the inner pattern violates an implicit invariant of the outer pattern

### Comparison tables added
- **8 Outer-Inner Pattern Combinations** with columns: Outer Pattern, Inner Pattern, Combined Mechanism, Problems Solved, Interaction Risk. Covers: sliding-window + hashmap, two-pointer + binary-search, DFS + memoization, BFS + DP, etc.
- **Composition Compatibility Matrix**: rows/columns are patterns; cell = compatible (yes/no/conditional).

---

## 14_Mental_Models/14_Optimization_Pipeline.md

### Invariants named
- Optimization without measurement is speculation; always profile before optimizing
- The hot path accounts for >90% of runtime; optimizing cold code is wasted effort
- Amdahl's law sets the upper bound on achievable speedup; parallelization gains are limited by serial fraction

### Comparison tables added
- **8 Optimization Techniques with Typical Gain**: columns: Technique, Mechanism, Typical Speedup, When to Apply, Risk. Covers: algorithm change, data structure change, caching, parallelism, prefetching, locality, compression, approximation.

---

## 14_Mental_Models/15_System_Design_Thinking.md

### Invariants named
- CAP theorem is a constraint, not a choice; every distributed system makes an implicit CAP commitment
- The design decision flow determines the fundamental tradeoffs; changing later is expensive

### Comparison tables added
- **CAP + 6 Scaling Patterns**: columns: Pattern, CAP Implication, Consistency Model, When to Use. Covers: single node, read replicas, write replicas, sharding, consensus, eventual consistency.
- **System Design Decision Checklist**: columns: Question, Why It Matters, Common Mistakes.

---

## 14_Mental_Models/16_Distributed_Systems_Thinking.md

### Invariants named
- FLP impossibility is a fundamental result; no algorithm can achieve all three of safety, liveness, and fault tolerance simultaneously in an asynchronous system
- Consensus algorithms trade off between responsiveness and consistency; the tradeoff is unavoidable

### Comparison tables added
- **6 Consistency Models** with columns: Model, Definition, Latency, Availability, Example Use. Covers: strong, sequential, causal, eventual, read-your-writes, monotonic reads.
- **5 Consensus Algorithms Comparison**: columns: Algorithm, Fault Tolerance, Latency, Leader, When to Use. Covers: Paxos, Raft, Zab, Viewstamped Replication, Chain Replication.

---

## 14_Mental_Models/17_Frontend_Architecture_Thinking.md

### Invariants named
- State lives closest to where it is used; moving state too high causes over-rendering; moving it too low causes prop drilling
- React reconciliation is O(n) where n is the number of React elements; component count matters for performance

### Comparison tables added
- **5 State Management Approaches** with columns: Approach, State Location, Re-render Scope, Best For, Boilerplate. Covers: local state, lifted state, Context, Redux, server state (React Query/SWR).

---

## 14_Mental_Models/18_Production_Debugging_Thinking.md

### Invariants named
- Incidents follow a predictable lifecycle: detection → triage → communication → mitigation → resolution
- Observability is the ability to infer internal state from external outputs; you cannot debug what you cannot observe
- SLOs define acceptable behavior; breaking an SLO is the trigger for incident response

### Comparison tables added
- **4 Observability Pillars** with columns: Pillar, Data Collected, Tools, What It Reveals. Covers: logs, metrics, traces, profiles.
- **5 Incident Stages** with columns: Stage, Typical Duration, Key Actions, Stakeholders. Covers: detection, triage, communication, mitigation, resolution.

---

## 14_Mental_Models/20_Pattern_Trigger_Guide.md

### Invariants named
- A pattern trigger is a necessary but not sufficient condition; confirming a trigger still requires algorithm verification
- Trigger precision increases with problem feature specificity; vague triggers lead to misdiagnosis
- Pattern triggers are bi-directional: identifying the problem class helps identify the pattern, and seeing the pattern helps identify the problem class

### Comparison tables added
- **10 Input Signal Categories with Triggers**: columns: Signal Category, Specific Trigger, Pattern Implied, Confidence. Covers: sorted array → binary search; tree with parent pointer → upward traversal; string + substring → KMP; graph + shortest path → Dijkstra; etc.
- **Pattern Trigger Reverse Lookup**: columns: Pattern, Common False Triggers, Differentiation Test.

---

## 14_Mental_Models/21_Competitive_Coding_Deep_Thinking.md

### Invariants named
- Contest performance is determined by problem classification speed and implementation speed, not algorithmic sophistication
- The time budget (45 minutes) forces optimal time allocation; spending too long on one problem is always wrong
- Code correctness is verified by the judge's test suite; passing local tests is necessary but not sufficient

### Comparison tables added
- **6 Problem Classes** with columns: Class, Key Feature, Algorithm Family, Complexity Budget. Covers: array/sliding window, string/pattern, tree/graph, DP, math/number theory, geometry.
- **Contest Decision Table**: columns: Situation, Recommended Action, Time Budget. Covers: TLE on first submission, WA on test 3, unsure between two algorithms, stuck for 15 minutes.

---

## 14_Mental_Models/22_Brute_Force_To_Optimal_Playbook.md

### Invariants named
- Brute force is always a valid first step; it establishes correctness before optimization
- Bottleneck identification is the highest-leverage step in optimization; the bottleneck is almost never where you think
- Optimization preserves correctness: every transformation must be verified against the brute-force baseline

### Comparison tables added
- **7 Optimization Levers with Typical Gain**: columns: Lever, What It Eliminates, Typical Speedup, Precondition. Covers: remove nested loop → O(n²)→O(n); add hashmap → O(n)→O(1) lookup; use better data structure → varies; caching → repeated computation; prefix sum → range query; sorting pre-processing → enable two-pointer; bitmask → O(2ⁿ)→O(n·2ⁿ) for subset problems.
- **Brute-to-Optimal Transformation Checklist**: columns: Step, What to Check, Red Flag.