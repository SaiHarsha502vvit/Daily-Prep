# 🧠 Mental Models & Theory — How to THINK About Problems

> **This folder teaches you HOW to think, not just WHAT to code.**
> Every file here is a thinking framework — the bridge between reading a problem and writing a solution.

---

## What's Different About These Files?

Other folders teach: "Here's the Two Pointer template, here's the code."
**This folder teaches**: "You see a sorted array and a target sum — here's **WHY** your brain should jump to two pointers, **HOW** to verify that instinct, and **WHAT** mental steps to take before writing a single line of code."

---

## 🗺️ Core Mental Models (Read These First)

| # | Guide | What You'll Learn | Use When |
|---|-------|------------------|----------|
| 01 | [🌳 Recursion & Tree Thinking](01_Recursion_Tree_Thinking.md) | Draw recursion trees, leap of faith, recursion→memo→tabulation | Recursion / Tree / Backtracking problems |
| 02 | [🎯 DP: State & Transition Thinking](02_DP_State_Thinking.md) | Identify states, define transitions, optimize space | Any DP problem |
| 03 | [🗺️ Graph & Tree Problem Thinking](03_Graph_Tree_Thinking.md) | Model as graphs, BFS vs DFS, detect patterns | Tree / Graph problems |
| 04 | [📊 Array & String Pattern Selection](04_Array_String_Thinking.md) | Decision tree: which pattern for which problem | Array / String / Sliding Window |
| 05 | [🏗️ Universal Problem Framework](05_Universal_Problem_Framework.md) | 6-step method for ANY problem (Read→Classify→Plan→Code→Test→Optimize) | **Every single problem** |
| 06 | [✅ Implementation Checklist](06_Implementation_Checklist.md) | What to check WHILE coding, edge cases, off-by-one prevention | **During coding** |
| 07 | [🗄️ SQL Query Building Pipeline](07_SQL_Mental_Pipeline.md) | Think in sets, build queries step-by-step | SQL problems |
| 08 | [🐛 Debugging & Dry Run](08_Debugging_DryRun.md) | Trace code mentally, find bugs systematically | **When stuck / wrong output** |
| 09 | [📐 Complexity Analysis: Intuitive](09_Complexity_Intuition.md) | Reason about time/space without memorizing formulas | **After every solution** |
| 10 | [🎓 Interview Thinking: Live Problem](10_Interview_Thinking.md) | Think out loud, handle blanks, manage time under pressure | **Mock interviews / assessments** |

---

## 🔬 Advanced Mental Models

| # | Guide | What You'll Learn | Use When |
|---|-------|------------------|----------|
| 11 | [⚖️ Greedy vs DP Decision](11_Greedy_vs_DP_Decision.md) | When greedy works, when you need DP, proof techniques | Optimization problems |
| 12 | [🔄 Space-Time Tradeoffs](12_Space_Time_Tradeoffs.md) | Trading memory for speed, caching, bit tricks | Performance-critical code |
| 13 | [🧩 Pattern Composition](13_Pattern_Composition.md) | Combining multiple patterns in one solution | Hard / multi-technique problems |
| 14 | [🚀 Optimization Pipeline](14_Optimization_Pipeline.md) | Brute force → optimal: identify redundancy, choose technique | **Hard problems** |
| 20 | [🎯 Pattern Trigger Guide](20_Pattern_Trigger_Guide.md) | **NEW** — I see X in a problem → my brain says Y → how to verify | **First thing to read every morning** |

---

## 🏗️ Production & System Thinking

| # | Guide | What You'll Learn | Use When |
|---|-------|------------------|----------|
| 15 | [🏗️ System Design Thinking](15_System_Design_Thinking.md) | Scalability, CAP theorem, trade-offs in system design | System design interviews |
| 16 | [🌐 Distributed Systems Thinking](16_Distributed_Systems_Thinking.md) | Consensus, replication, consistency models | Senior/staff interviews |
| 17 | [🖥️ Frontend Architecture Thinking](17_Frontend_Architecture_Thinking.md) | Component design, state management, rendering pipeline | Frontend interviews |
| 18 | [🔍 Production Debugging Thinking](18_Production_Debugging_Thinking.md) | Root cause analysis, observability, distributed tracing | On-call / debugging interviews |

---

## 🗺️ Which Mental Model to Read First?

| Working on... | Read this first | Then read... |
|---|---|---|
| Array / Sliding Window / Two Pointer | [04 Array & String Thinking](04_Array_String_Thinking.md) | [20 Pattern Trigger Guide](20_Pattern_Trigger_Guide.md) |
| Recursion / Tree / Graph | [01 Recursion Tree](01_Recursion_Tree_Thinking.md) | [03 Graph & Tree](03_Graph_Tree_Thinking.md) |
| Dynamic Programming | [02 DP State Thinking](02_DP_State_Thinking.md) | [11 Greedy vs DP](11_Greedy_vs_DP_Decision.md) |
| Backtracking | [01 Recursion Tree](01_Recursion_Tree_Thinking.md) | [13 Pattern Composition](13_Pattern_Composition.md) |
| New / unknown problem | [20 Pattern Trigger Guide](20_Pattern_Trigger_Guide.md) | [05 Universal Framework](05_Universal_Problem_Framework.md) |
| Hard problem | [14 Optimization Pipeline](14_Optimization_Pipeline.md) | [11 Greedy vs DP](11_Greedy_vs_DP_Decision.md) |
| Interview in 1 hour | [10 Interview Thinking](10_Interview_Thinking.md) | [06 Implementation Checklist](06_Implementation_Checklist.md) |
| Stuck / wrong output | [08 Debugging Dry Run](08_Debugging_DryRun.md) | — |
| Complexity question | [09 Complexity Intuition](09_Complexity_Intuition.md) | — |

---

## 🔥 The Daily Mental Model Warm-Up (5 min before problems)

```
Morning Routine (Do this before solving ANY problem):

1. Open 20_Pattern_Trigger_Guide.md — scan the signal table (2 min)
2. Open 06_Implementation_Checklist.md — glance at the checklist (1 min)
3. Open 09_Complexity_Intuition.md — recall what O(n log n) feels like (1 min)
4. Then start solving.

Why? Your pattern recognition fires BEFORE conscious thought.
Reading these primes your brain to see signals automatically.
```

---

📖 **Related Folders:**
- [03_Algorithms/](../03_Algorithms/) — The algorithms themselves
- [04_Patterns_Templates/](../04_Patterns_Templates/) — Combined DS+Algo pattern templates
- [05_Problem_Solving/](../05_Problem_Solving/) — Practice problems by topic
- [02_Data_Structures/00_DS_PROBLEM_BRIDGES.md](../02_Data_Structures/00_DS_PROBLEM_BRIDGES.md) — DS → Pattern → Problems bridge map

---
_Updated: April 2026 — 20 MIT/KTH-style mental model guides_
