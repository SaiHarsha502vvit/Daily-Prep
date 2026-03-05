> **Mental Model 11** | [Index](../00_MASTER_INDEX.md)

---

# 🧠 GREEDY vs DYNAMIC PROGRAMMING — THE DECISION FRAMEWORK

```
╔══════════════════════════════════════════════════════════════════════════════╗
║       WHEN TO USE GREEDY vs DP — A RIGOROUS DECISION MODEL                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ THE CORE DIFFERENCE                                                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  GREEDY: Make the locally optimal choice at each step.                       │
│          Never look back. Never reconsider.                                  │
│          Works when local optimum → global optimum.                          │
│          Time: Usually O(n log n) [sort] + O(n) [scan]                       │
│                                                                              │
│  DP: Try ALL choices at each step. Remember results.                         │
│      Build optimal from sub-solutions.                                       │
│      Works when you need to explore all possibilities.                       │
│      Time: Usually O(n²) or O(n × W) — slower but always correct.            │
│                                                                              │
│  ANALOGY:                                                                    │
│  Greedy = Taking the highway with the fewest current cars (local best)       │
│  DP     = Checking ALL possible routes on Google Maps (global best)          │
│                                                                              │
│  GREEDY IS FASTER BUT RISKIER.                                               │
│  It only works when you can PROVE local = global.                            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ THE DECISION CHECKLIST                                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Ask these THREE questions. If ALL are YES → Greedy works.                   │
│  If ANY is NO → Use DP.                                                      │
│                                                                              │
│  ┌───────────────────────────────────────────────────────────────┐           │
│  │ Q1: GREEDY CHOICE PROPERTY                                   │            │
│  │     "Can I make the best local choice and never regret it?"  │            │
│  │                                                               │           │
│  │ Q2: OPTIMAL SUBSTRUCTURE                                     │            │
│  │     "Does the optimal solution contain optimal sub-solutions?"│           │
│  │                                                               │           │
│  │ Q3: NO FUTURE DEPENDENCY                                     │            │
│  │     "Does my current choice NOT affect future choices'        │           │
│  │      available options in a complex way?"                     │           │
│  └───────────────────────────────────────────────────────────────┘           │
│                                                                              │
│  BOTH Greedy and DP need Optimal Substructure (Q2).                          │
│  Greedy ADDITIONALLY needs the Greedy Choice Property (Q1).                  │
│  DP doesn't need Q1 — it explores everything anyway.                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ PROOF TECHNIQUES FOR GREEDY                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  How do you PROVE greedy works? Two standard techniques:                     │
│                                                                              │
│  TECHNIQUE 1: EXCHANGE ARGUMENT                                              │
│  "Suppose greedy solution G and optimal solution O differ.                   │
│   Show we can modify O to look more like G without worsening it.             │
│   Therefore G is also optimal."                                              │
│                                                                              │
│  Example — Activity Selection (LC 435 variant):                              │
│  Greedy: Pick activity ending earliest. If optimal picks a later-ending      │
│  activity first, swap it with our earliest-ending one. The swap can't        │
│  cause conflicts (ends earlier → leaves more room). So greedy ≥ optimal.     │
│                                                                              │
│  TECHNIQUE 2: GREEDY STAYS AHEAD                                             │
│  "At every step, show greedy solution is at least as good                    │
│   as any other solution up to that point."                                   │
│                                                                              │
│  Example — Fractional Knapsack:                                              │
│  Sort by value/weight ratio. Taking highest ratio first → at every stage,    │
│  total value ≥ any alternative selection of the same total weight.           │
│                                                                              │
│  IN INTERVIEWS: You don't need a formal proof. Say:                          │
│  "I believe greedy works here because [greedy choice property holds] —       │
│   choosing the locally best [X] can never make the global answer worse."     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHEN GREEDY FAILS — CLASSIC TRAPS                                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ❌ 0/1 KNAPSACK: Greedy by value/weight ratio FAILS.                         │
│     Items: (w=10,v=60), (w=20,v=100), (w=30,v=120). Capacity=50.             │
│     Greedy by ratio: take first (6.0), then second (5.0) → w=30, v=160       │
│     Optimal: take second + third → w=50, v=220. GREEDY LOSES.                │
│     (But Fractional Knapsack → greedy IS optimal.)                           │
│                                                                              │
│  ❌ COIN CHANGE (arbitrary denominations): Greedy FAILS.                      │
│     Coins: [1, 3, 4]. Amount: 6.                                             │
│     Greedy: 4+1+1 = 3 coins. Optimal: 3+3 = 2 coins.                         │
│     (But with US coins [1,5,10,25] → greedy IS optimal.)                     │
│                                                                              │
│  ❌ LONGEST INCREASING SUBSEQUENCE: Greedy "pick smallest" FAILS.             │
│     [1, 100, 2, 3, 4]. Greedy might pick 1, 2 early but needs to             │
│     explore whether 100 leads somewhere. Need DP (or patience sort).         │
│                                                                              │
│  ✅ ACTIVITY SELECTION: Greedy by earliest end WORKS.                         │
│  ✅ HUFFMAN CODING: Greedy merge lowest freq WORKS.                           │
│  ✅ DIJKSTRA: Greedy pick nearest unvisited WORKS (non-negative weights).     │
│  ✅ KRUSKAL/PRIM: Greedy pick lightest edge WORKS.                            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ THE QUICK DECISION TABLE                                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PROBLEM TYPE                    │ USE     │ WHY                             │
│  ════════════════════════════════╪═════════╪═════════════════════════════    │
│  Activity Selection/Scheduling   │ GREEDY  │ Earliest end → max activities   │
│  Fractional Knapsack             │ GREEDY  │ Can take fractions → ratio      │
│  0/1 Knapsack                    │ DP      │ Can't take fractions            │
│  Coin Change (arbitrary)         │ DP      │ Greedy fails for [1,3,4]        │
│  Shortest Path (non-negative)    │ GREEDY  │ Dijkstra proven optimal         │
│  Shortest Path (negative edges)  │ DP      │ Bellman-Ford needed             │
│  MST (Kruskal/Prim)             │ GREEDY  │ Cut property proves it           │
│  Huffman Coding                  │ GREEDY  │ Merge cheapest first            │
│  LIS                             │ DP      │ Future elements affect choice   │
│  Edit Distance                   │ DP      │ Single char choice ripples      │
│  Matrix Chain Multiplication     │ DP      │ Order matters globally          │
│  Interval Scheduling Max         │ GREEDY  │ Sort by end, always keep early  │
│  Weighted Job Scheduling         │ DP      │ Weights make greedy fail        │
│  Jump Game I                     │ GREEDY  │ Track max reachable             │
│  Jump Game II (min jumps)        │ GREEDY  │ BFS-like level expansion        │
│  Task Scheduler                  │ GREEDY  │ Most frequent first             │
│  Stock Buy/Sell (1 transaction)  │ GREEDY  │ Track min, max profit           │
│  Stock Buy/Sell (k transactions) │ DP      │ State: day × transactions       │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ THE HYBRID PATTERN: GREEDY + DP                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Some problems use BOTH:                                                     │
│  • Weighted Job Scheduling: Sort by end (greedy step), then DP               │
│  • LIS with patience sort: Binary search (greedy element) within DP          │
│  • Dijkstra: Greedy vertex selection + DP relaxation                         │
│                                                                              │
│  RULE OF THUMB: If greedy feels right but you're not 100% sure,              │
│  start with DP. It's always correct. Then optimize to greedy if proof        │
│  becomes clear during implementation.                                        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 INTERVIEW SCRIPT

When you see an optimization problem, say this to the interviewer:

> "This has optimal substructure. Let me check if the greedy choice property holds — can I commit to a local choice without regret? [If yes:] Greedy will be O(n log n). [If no:] I'll use DP to explore all subproblems."

This shows you know the theory, even if you pick the wrong approach initially.

---

> **Navigation**: [Back to Index](../00_MASTER_INDEX.md)
