**Navigation**: [< Previous](10_Interview_Thinking.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](12_Space_Time_Tradeoffs.md)

**Mental Model 11** | [Index](../00_MASTER_INDEX.md)

---

# 🧠 GREEDY vs DYNAMIC PROGRAMMING — THE DECISION FRAMEWORK

## The Core Difference

**Greedy**: Make the locally optimal choice at each step.
Never look back. Never reconsider.
Works when local optimum → global optimum.
Time: Usually O(n log n) [sort] + O(n) [scan]

**Dp**: Try ALL choices at each step. Remember results.
Build optimal from sub-solutions.
Works when you need to explore all possibilities.
Time: Usually O(n²) or O(n × W) — slower but always correct.

💡 **ANALOGY:**
Greedy = Taking the highway with the fewest current cars (local best)
DP = Checking ALL possible routes on Google Maps (global best)
GREEDY IS FASTER BUT RISKIER.
It only works when you can PROVE local = global.

## The Decision Checklist

Ask these THREE questions. If ALL are YES → Greedy works.
If ANY is NO → Use DP.
Q1: GREEDY CHOICE PROPERTY
"Can I make the best local choice and never regret it?"
Q2: OPTIMAL SUBSTRUCTURE
"Does the optimal solution contain optimal sub-solutions?"
Q3: NO FUTURE DEPENDENCY
"Does my current choice NOT affect future choices'
available options in a complex way?"
BOTH Greedy and DP need Optimal Substructure (Q2).
Greedy ADDITIONALLY needs the Greedy Choice Property (Q1).
DP doesn't need Q1 — it explores everything anyway.

## Proof Techniques For Greedy

How do you PROVE greedy works? Two standard techniques:

### 🔬 Deep Dive: The Exchange Argument (Step-by-Step)

The Exchange Argument is the most mathematically rigorous way to prove a Greedy algorithm works. It follows a strict 5-step template:

1. **Assume an Optimal Solution ($O$) exists** that differs from our Greedy Solution ($G$). Let them share the first $k$ choices, but differ at step $k+1$.
2. **Identify the difference:** At step $k+1$, $G$ picks element $g$, while $O$ picks element $o$. (Because $G$ is greedy, $g$ looks "better" locally than $o$).
3. **Exchange:** Create a new solution $O'$ by taking $O$ and swapping out $o$ for $g$.
4. **Prove no degradation:** Prove that $O'$ is still valid (doesn't break constraints) AND its total value is $\ge O$. Since $O$ was assumed to be optimal, and $O'$ is at least as good, $O'$ must _also_ be optimal.
5. **Induction:** Since we can repeatedly swap elements without worsening the score until $O$ becomes exactly $G$, $G$ must be optimal!

**Walkthrough: Activity Selection (Interval Scheduling)**

- **Greedy Rule:** Always pick the valid activity that _ends earliest_.
- **Step 1:** Assume Optimal $O$ differs from Greedy $G$.
- **Step 2:** At the first point of divergence, $G$ picks activity $g$ (ends at $T_g$). $O$ picks activity $o$ (ends at $T_o$). By definition of our greedy rule, $T_g \le T_o$.
- **Step 3:** Create $O'$ by replacing $o$ with $g$.
- **Step 4:** Does $O'$ break? No. Since $g$ ends _earlier_ than $o$, it frees up MORE time. Any subsequent activities in $O$ that started after $T_o$ will _definitely_ start after $T_g$. The total number of activities remains the same. Thus, $O'$ is just as optimal as $O$.
  TECHNIQUE 2: GREEDY STAYS AHEAD
  "At every step, show greedy solution is at least as good
  as any other solution up to that point."
  Example — Fractional Knapsack:
  Sort by value/weight ratio. Taking highest ratio first → at every stage,
  total value ≥ any alternative selection of the same total weight.

**In Interviews**: You don't need a formal proof. Say:
"I believe greedy works here because [greedy choice property holds] —
choosing the locally best [X] can never make the global answer worse."

🔬 **Section Challenge — Proof Techniques For Greedy**

**Challenge 1 (Reasoning):** Interval scheduling: select maximum number of non-overlapping intervals. Why does sorting by END time work, not by START time or duration?

<details><summary>Answer</summary>

Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others.

</details>

## When Greedy Fails — Classic Traps

- ❌ 0/1 KNAPSACK: Greedy by value/weight ratio FAILS.
  Items: (w=10,v=60), (w=20,v=100), (w=30,v=120). Capacity=50.
  Greedy by ratio: take first (6.0), then second (5.0) → w=30, v=160
  Optimal: take second + third → w=50, v=220. GREEDY LOSES.
  (But Fractional Knapsack → greedy IS optimal.)
- ❌ COIN CHANGE (arbitrary denominations): Greedy FAILS.
  Coins: [1, 3, 4]. Amount: 6.
  Greedy: 4+1+1 = 3 coins. Optimal: 3+3 = 2 coins.
  (But with US coins [1,5,10,25] → greedy IS optimal.)
- ❌ LONGEST INCREASING SUBSEQUENCE: Greedy "pick smallest" FAILS.
  [1, 100, 2, 3, 4]. Greedy might pick 1, 2 early but needs to
  explore whether 100 leads somewhere. Need DP (or patience sort).
- ✅ ACTIVITY SELECTION: Greedy by earliest end WORKS.
- ✅ HUFFMAN CODING: Greedy merge lowest freq WORKS.
- ✅ DIJKSTRA: Greedy pick nearest unvisited WORKS (non-negative weights).
- ✅ KRUSKAL/PRIM: Greedy pick lightest edge WORKS.

🔬 **Section Challenge — When Greedy Fails — Classic Traps**

**Challenge 1 (Reasoning):** 0/1 Knapsack: greedy by value/weight ratio gives items (6.0, 5.0, 4.0). Why does taking the top-2 ratios fail, and what property does 0/1 Knapsack violate that Fractional Knapsack does not?

<details><summary>Answer</summary>

Fractional Knapsack has the greedy choice property because you can take _partial_ items — filling remaining capacity with a fraction of the next-best item always works. 0/1 Knapsack violates this: you must take or leave entire items. The leftover capacity after a greedy pick might be too small for the next-best item but perfect for a combination of smaller items. In the example: greedy picks items with ratio 6.0+5.0 (w=30, v=160), but optimal is ratio 5.0+4.0 (w=50, v=220) — the leftover 20 units after the greedy pick can't fit the 30-unit item. This is why 0/1 Knapsack needs DP: current choice constrains future capacity in ways that demand exploring all combinations.

</details>

## The Quick Decision Table

| PROBLEM TYPE | USE | WHY |
════════════════════════════════╪═════════╪═════════════════════════════
| Activity Selection/Scheduling | GREEDY | Earliest end → max activities |
| Fractional Knapsack | GREEDY | Can take fractions → ratio |
| 0/1 Knapsack | DP | Can't take fractions |
| Coin Change (arbitrary) | DP | Greedy fails for [1,3,4] |
| Shortest Path (non-negative) | GREEDY | Dijkstra proven optimal |
| Shortest Path (negative edges) | DP | Bellman-Ford needed |
| MST (Kruskal/Prim) | GREEDY | Cut property proves it |
| Huffman Coding | GREEDY | Merge cheapest first |
| LIS | DP | Future elements affect choice |
| Edit Distance | DP | Single char choice ripples |
| Matrix Chain Multiplication | DP | Order matters globally |
| Interval Scheduling Max | GREEDY | Sort by end, always keep early |
| Weighted Job Scheduling | DP | Weights make greedy fail |
| Jump Game I | GREEDY | Track max reachable |
| Jump Game II (min jumps) | GREEDY | BFS-like level expansion |
| Task Scheduler | GREEDY | Most frequent first |
| Stock Buy/Sell (1 transaction) | GREEDY | Track min, max profit |
| Stock Buy/Sell (k transactions) | DP | State: day × transactions |

## The Hybrid Pattern: Greedy + Dp

Some problems use BOTH:

- Weighted Job Scheduling: Sort by end (greedy step), then DP
- LIS with patience sort: Binary search (greedy element) within DP
- Dijkstra: Greedy vertex selection + DP relaxation

**Rule Of Thumb**: If greedy feels right but you're not 100% sure,
start with DP. It's always correct. Then optimize to greedy if proof
becomes clear during implementation.

---

🔬 **Section Challenge — The Hybrid Pattern: Greedy + Dp**

**Challenge 1 (Reasoning):** Dijkstra is called "greedy" but also uses "DP relaxation." What exactly is the greedy part and what is the DP part? Why can't pure greedy or pure DP solve it alone?

<details><summary>Answer</summary>

**Greedy part**: always extract the minimum-distance unvisited vertex from the priority queue — this is a greedy choice (locally nearest = globally nearest, _proven by non-negative edge weights_). **DP part**: relaxation — `dist[v] = min(dist[v], dist[u] + weight(u,v))` is a state transition that builds optimal sub-solutions from smaller sub-solutions. **Why not pure greedy?** Without relaxation, you'd commit to the first path found and never improve it. **Why not pure DP?** Bellman-Ford is pure DP (relax all edges V-1 times), but it's O(VE). Dijkstra's greedy vertex selection _eliminates_ vertices from future consideration, reducing to O(E log V). The hybrid is what makes Dijkstra faster than Bellman-Ford while still being correct.

</details>

## NEW DIAGRAM — Greedy vs DP Decision Flow (3-Question Test)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  DIAGRAM: Greedy vs DP Decision Flow                                         │
│           Follow this 3-question test to choose the right technique          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  START: Is this an OPTIMIZATION problem? (min/max/count ways)               │
│     │                                                                        │
│     └── YES → Go to Question 1                                              │
│         │                                                                    │
│         └── NO → Not DP or Greedy. Use brute force / search.               │
│                                                                              │
│  ① OPTIMAL SUBSTRUCTURE: Does optimal solution = optimal sub-solutions?    │
│     │                                                                        │
│     │  Ask: "If I know the answer for smaller inputs,                        │
│     │        can I construct the answer for current input?"                 │
│     │                                                                        │
│     ├── YES → Continue to Question 2                                        │
│     │        (Both Greedy AND DP require optimal substructure)              │
│     │                                                                    │
│     └── NO  → Neither Greedy nor DP applies.                               │
│               Use brute force, backtracking, or approximation.             │
│                                                                              │
│  ② GREEDY CHOICE PROPERTY: Can you ALWAYS make the local best and win?     │
│     │                                                                        │
│     │  Ask: "If I pick the locally optimal choice right now,                 │
│     │        will I ever REGRET it later?"                                  │
│     │                                                                        │
│     ├── YES → Greedy works!                                                 │
│     │        └─ Go to Question 3 to confirm proof                           │
│     │                                                                    │
│     └── NO  → Greedy FAILS. Use DP (go to bottom).                        │
│                                                                              │
│  ③ PROVE IT: Can you PROVE greedy correctness?                             │
│     │                                                                        │
│     ├── Exchange argument: "Swap any non-greedy choice with greedy,        │
│     │   solution doesn't get worse"                                         │
│     │   Example: Activity selection (earliest end time)                    │
│     │                                                                    │
│     ├── Stays ahead: "At every step, greedy is at least as good           │
│     │   as any alternative"                                                │
│     │   Example: Fractional knapsack (best ratio first)                    │
│     │                                                                    │
│     └── Cut property: "The greedy choice is in some minimum cut"          │
│         Example: MST (lightest edge crossing any cut)                      │
│         │                                                                    │
│         ├── PROOF CLEAR → Use GREEDY (O(n log n) usually)                 │
│         │   └─ Examples: Activity selection, Huffman coding,               │
│         │                Dijkstra, Kruskal, Prim                          │
│         │                                                                    │
│         └── PROOF UNCLEAR → Fall back to DP (safest)                       │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────│
│                                                                              │
│  DP PATH (when greedy fails or proof is unclear):                          │
│                                                                              │
│     Does problem have OVERLAPPING SUBPROBLEMS?                              │
│     │                                                                        │
│     ├── YES → DP applies                                                   │
│     │   ├── Can space be optimized? (rolling array, 2-3 variables)        │
│     │   └── Time: O(n^2) or O(n*W)   Space: O(n*W) or O(n)               │
│     │                                                                    │
│     └── NO  → Exhaust all possibilities (backtracking, DFS)              │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  DECISION SUMMARY BOX:                                                  │    │
│  │  ┌────────────────────────────────────────────────────────────────┐  │    │
│  │  │  Q1: Optimal substructure?                                       │  │    │
│  │  │    ├── NO  → Stop. Neither greedy nor DP applies.               │  │    │
│  │  │    └── YES → Continue.                                          │  │    │
│  │  │                                                                   │  │    │
│  │  │  Q2: Greedy choice property (local best = global best)?         │  │    │
│  │  │    ├── YES → Q3: Can you prove it?                              │  │    │
│  │  │    │   ├── YES proof → GREEDY (fastest)                         │  │    │
│  │  │    │   └── NO proof  → DP (safe fallback)                       │  │    │
│  │  │    └── NO  → DP (greedy fails)                                  │  │    │
│  │  │                                                                   │  │    │
│  │  │  DIAGONAL: "Not sure if greedy works"                           │  │    │
│  │  │    → Try DP first (always correct), then optimize to greedy    │  │    │
│  │  └────────────────────────────────────────────────────────────────┘  │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 🎯 INTERVIEW SCRIPT

When you see an optimization problem, say this to the interviewer:

"This has optimal substructure. Let me check if the greedy choice property holds — can I commit to a local choice without regret? [If yes:] Greedy will be O(n log n). [If no:] I'll use DP to explore all subproblems."

This shows you know the theory, even if you pick the wrong approach initially.

## Historical Evolution

> **Why this section**: mental-model pedagogy requires knowing the prior art. The frameworks below all have named predecessors — naming them prevents reinventing the wheel and connects your reasoning to decades of computer-science practice.

| Year | Predecessor | Contribution |
| --- | --- | --- |
| 1952 | Huffman | Huffman coding — greedy optimal prefix codes |
| 1956 | Kruskal | Minimum spanning tree — greedy edge selection |
| 1957 | Prim | MST — greedy vertex selection |
| 1954/1957 | Bellman | DP theory — optimal substructure foundation |
| 1959 | Dijkstra | Shortest path — greedy works because non-negative weights |

**Evolution narrative**: The greedy vs. DP decision framework crystallized from the parallel development of optimality proofs for specific algorithms. The foundational greedy algorithms emerged in the 1950s: David Huffman's 1952 optimal prefix code construction, Joseph Kruskal's 1956 MST algorithm via union-find edge selection, and Robert Prim's 1957 MST algorithm via growing a vertex set. These three algorithms each came with explicit exchange arguments proving greedy optimality. Richard Bellman's 1954-1957 DP work established the complementary principle: when exchange arguments fail (no greedy choice property), the algorithm must explore all states — the DP fallback. Dijkstra's 1959 shortest-path algorithm demonstrated the critical boundary: greedy works when all edge weights are non-negative (the weights never force a future "regret").

**Modern practice anchor**: Today's greedy-vs-DP decision framework (LeetCode "greedy or DP" problems, competitive programming strategy) uses the three-question checklist (greedy choice property, optimal substructure, no future dependency) that descends directly from this 1950s foundation, enabling programmers to make the greedy vs. DP decision in under 60 seconds.

## Production Reality

> **Why this section**: a mental model is only useful if it predicts what breaks in production. Below are named failure modes tied to this mental model, with debug workflows and modern observability tools.

### Failure Mode 1: Greedy Fail on Coin System {1,3,4} — Suboptimal Solution in Production

**What goes wrong**: A payment system uses a greedy coin change algorithm. Works perfectly for USD (denominations {1,5,10,25} — greedy is provably optimal). But a new product region uses denominations {1,3,4}. A customer is billed 6 units. Greedy computes 4+1+1 = 3 coins. Optimal is 3+3 = 2 coins. The system overcharges the customer.

**Cost**: Customer overcharge complaint. Regulatory violation in regions where "minimum coins" is a billing requirement. PR incident if widely reported. Engineering time to audit all denomination-specific code paths.

**Debug workflow**:
1. Unit test against canonical greedy-failure counterexamples: {1,3,4} for amount 6, {1,5,10} for amount 30, and any custom denominations before deployment.
2. Replace greedy coin change with DP for all non-standard denominations: `dp[i] = min(dp[i-coin] + 1)` — this is O(amount × n) and always optimal.
3. Add regression test: if a new denomination is added to the system, CI should warn "greedy may not be optimal for this set" and require DP or formal proof of greedy optimality.
4. For known-safe denominations, document the proof: "greedy optimal for US coins due to canonical coin system property."

### Failure Mode 2: Huffman Optimality Assumption Broken — Adaptive Compression Fails

**What goes wrong**: A streaming data pipeline uses static Huffman coding (fixed frequency table). A new data distribution arrives (e.g., different log types, sensor data with different probability distribution). The Huffman tree built on old data is suboptimal for new data — some symbols now have long codes that were short before. Compression ratio degrades from 3x to 1.2x. Pipeline storage costs spike.

**Cost**: Storage cost spike. Pipeline throughput impact (decompressing with a suboptimal tree is slower). At scale (TB/day), even a 0.1x compression degradation means millions in extra storage costs.

**Debug workflow**:
1. Measure compression ratio per data batch: if ratio drops below a threshold (e.g., <2x for text, <1.5x for binary), rebuild the Huffman tree dynamically.
2. Use adaptive arithmetic coding or LZ77 instead of static Huffman — these adapt to local frequency distributions without needing a prior model.
3. Monitor entropy of incoming data streams: `shannon_entropy = -sum(p * log2(p))` for each byte frequency. A large shift in entropy signals a distribution change requiring tree rebuild.
4. Implement adaptive block switching: divide data into blocks, build a Huffman tree per block, and prepend the tree index to each block's encoded data.

### Failure Mode 3: MST Greedy Wrong on Negative-Weight Edge Conventions

**What goes wrong**: A network routing system uses Kruskal's algorithm (greedy by lightest edge) to build minimum spanning trees. An engineer adds negative-weight edges to the system (e.g., credits for routing traffic through certain nodes). Kruskal's is still correct with negative edges — but a modified version that uses edge weights as "cost to add" may produce wrong trees if the implementation was written assuming all weights are non-negative (e.g., using `Integer.MAX_VALUE` as a sentinel).

**Cost**: Suboptimal routing paths in production. Network traffic routed through expensive paths instead of cheap ones. Increased network costs and latency. Debugging requires deep understanding of which algorithm variant was actually deployed.

**Debug workflow**:
1. Validate MST output with cycle property: for every edge NOT in the MST, its weight must be >= the maximum weight edge on the unique path between its endpoints. Write an automated MST validation test and run it against any MST-generated network topology.
2. Never assume non-negative weights: use `long` for all edge weights and handle `Integer.MIN_VALUE` sentinel values explicitly.
3. Run network topology tests: generate random graphs (including negative edges) and verify MST output matches a reference DP solution for small graphs.
4. Document which MST variant is deployed (Kruskal vs Prim) and why — this determines whether negative weights are handled correctly.

### Modern Production Tools

- **JUnit / pytest parametrize**: Run coin-change tests against all known denomination sets (USD, EUR, custom) in CI. Fail build if any set produces a suboptimal result.
- **Apache Commons Compress**: Adaptive compression library that handles varying data distributions without requiring manual Huffman tree rebuilds.
- **NetworkX `minimum_spanning_tree`**: Python library with reference MST implementation. Compare against deployed MST output in integration tests to catch negative-weight handling bugs.
- **Prometheus compression ratio gauge**: Track compression_ratio per data batch. Alert when ratio drops below threshold — signals distribution shift requiring tree rebuild.
- **Formal verification (TLA+ / PlusCal)**: For critical routing algorithms, specify the greedy property formally and model-check against all possible edge weight combinations, including negative values.

## Conceptual Depth & Topical Breadth

> **Why this section**: this mental model rests on a specific invariant, and its variants cover a spectrum of trade-offs. Knowing the invariant and the variants lets you apply the model correctly across problems.

### Invariant

Greedy works when **local optimal = global optimal** — the choice that looks best right now is also best in the final solution. This is formalized in two ways: the **matroid structure** (the set of feasible solutions forms a matroid, and greedy on the weight function produces an optimal solution) and the **exchange argument** (any optimal solution can be transformed into the greedy solution by repeatedly swapping elements). The invariant is that greedy correctness requires a proof, not just intuition — if you cannot construct an exchange argument or prove matroid structure, greedy is guessing. The internal mechanism is that greedy makes irrevocable choices: once an element is selected or rejected, it is never reconsidered. This is both the speed advantage (O(n log n) vs O(n^2) for DP) and the risk — a single locally-optimal but globally-suboptimal choice dooms the solution.

### Variants Comparison

| Algorithm Type | Local Choice | Proof Required | Complexity | Counter-Example |
| --- | --- | --- | --- | --- |
| Greedy | Take best local option | Exchange argument or matroid | O(n log n) | Coins {1,3,4} for 6 |
| Dynamic Programming | Consider all options, store best | Optimal substructure | O(n^2) or O(n) | None if conditions met |
| Brute Force | Explore all possibilities | None needed | O(2^n) or O(n!) | None (exhaustive) |
| Divide & Conquer | Split, solve, combine | Recursive correctness | O(n log n) avg | Stack overflow at depth |

### Decision Table

| Problem Property | Algorithm | Why Greedy Works or Fails |
| --- | --- | --- |
| Coin denominations (US coins) | Greedy | Canonical coin system — exchange argument holds |
| Coin denominations (any) | DP | Counterexample {1,3,4} for 6 exists |
| Activity selection (max non-overlapping) | Greedy | Earliest finish time is optimal |
| Fractional knapsack | Greedy | Value/weight ratio ordering is optimal |
| 0/1 knapsack | DP | Taking locally high-value item can waste capacity |
| Huffman coding | Greedy | Merging lowest-frequency nodes is optimal (matroid) |
| Minimum spanning tree | Greedy | Edge weight ordering (Kruskal/Prim) is optimal |
| Job sequencing with deadlines | Greedy with sorting | Select by profit, greedy on time slot availability |
