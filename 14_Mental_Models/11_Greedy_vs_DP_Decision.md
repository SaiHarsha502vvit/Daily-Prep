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
DP     = Checking ALL possible routes on Google Maps (global best)
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
4. **Prove no degradation:** Prove that $O'$ is still valid (doesn't break constraints) AND its total value is $\ge O$. Since $O$ was assumed to be optimal, and $O'$ is at least as good, $O'$ must *also* be optimal.
5. **Induction:** Since we can repeatedly swap elements without worsening the score until $O$ becomes exactly $G$, $G$ must be optimal!

**Walkthrough: Activity Selection (Interval Scheduling)**
- **Greedy Rule:** Always pick the valid activity that *ends earliest*.
- **Step 1:** Assume Optimal $O$ differs from Greedy $G$.
- **Step 2:** At the first point of divergence, $G$ picks activity $g$ (ends at $T_g$). $O$ picks activity $o$ (ends at $T_o$). By definition of our greedy rule, $T_g \le T_o$.
- **Step 3:** Create $O'$ by replacing $o$ with $g$.
- **Step 4:** Does $O'$ break? No. Since $g$ ends *earlier* than $o$, it frees up MORE time. Any subsequent activities in $O$ that started after $T_o$ will *definitely* start after $T_g$. The total number of activities remains the same. Thus, $O'$ is just as optimal as $O$.
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

Fractional Knapsack has the greedy choice property because you can take *partial* items — filling remaining capacity with a fraction of the next-best item always works. 0/1 Knapsack violates this: you must take or leave entire items. The leftover capacity after a greedy pick might be too small for the next-best item but perfect for a combination of smaller items. In the example: greedy picks items with ratio 6.0+5.0 (w=30, v=160), but optimal is ratio 5.0+4.0 (w=50, v=220) — the leftover 20 units after the greedy pick can't fit the 30-unit item. This is why 0/1 Knapsack needs DP: current choice constrains future capacity in ways that demand exploring all combinations.
</details>


## The Quick Decision Table

| PROBLEM TYPE                    | USE     | WHY |
════════════════════════════════╪═════════╪═════════════════════════════
| Activity Selection/Scheduling   | GREEDY  | Earliest end → max activities |
| Fractional Knapsack             | GREEDY  | Can take fractions → ratio |
| 0/1 Knapsack                    | DP      | Can't take fractions |
| Coin Change (arbitrary)         | DP      | Greedy fails for [1,3,4] |
| Shortest Path (non-negative)    | GREEDY  | Dijkstra proven optimal |
| Shortest Path (negative edges)  | DP      | Bellman-Ford needed |
| MST (Kruskal/Prim)             | GREEDY  | Cut property proves it |
| Huffman Coding                  | GREEDY  | Merge cheapest first |
| LIS                             | DP      | Future elements affect choice |
| Edit Distance                   | DP      | Single char choice ripples |
| Matrix Chain Multiplication     | DP      | Order matters globally |
| Interval Scheduling Max         | GREEDY  | Sort by end, always keep early |
| Weighted Job Scheduling         | DP      | Weights make greedy fail |
| Jump Game I                     | GREEDY  | Track max reachable |
| Jump Game II (min jumps)        | GREEDY  | BFS-like level expansion |
| Task Scheduler                  | GREEDY  | Most frequent first |
| Stock Buy/Sell (1 transaction)  | GREEDY  | Track min, max profit |
| Stock Buy/Sell (k transactions) | DP      | State: day × transactions |
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

**Greedy part**: always extract the minimum-distance unvisited vertex from the priority queue — this is a greedy choice (locally nearest = globally nearest, *proven by non-negative edge weights*). **DP part**: relaxation — `dist[v] = min(dist[v], dist[u] + weight(u,v))` is a state transition that builds optimal sub-solutions from smaller sub-solutions. **Why not pure greedy?** Without relaxation, you'd commit to the first path found and never improve it. **Why not pure DP?** Bellman-Ford is pure DP (relax all edges V-1 times), but it's O(VE). Dijkstra's greedy vertex selection *eliminates* vertices from future consideration, reducing to O(E log V). The hybrid is what makes Dijkstra faster than Bellman-Ford while still being correct.
</details>


## 🎯 INTERVIEW SCRIPT

When you see an optimization problem, say this to the interviewer:

"This has optimal substructure. Let me check if the greedy choice property holds — can I commit to a local choice without regret? [If yes:] Greedy will be O(n log n). [If no:] I'll use DP to explore all subproblems."

This shows you know the theory, even if you pick the wrong approach initially.

