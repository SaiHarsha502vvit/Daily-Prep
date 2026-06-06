# CSE704 — Advanced Algorithms

**Estimated time:** ~20h  
**Prerequisite:** S02 (Data Structures & Algorithms), S03 (OOP for algorithm implementations)

## Description

An advanced algorithms course covering topics typically reserved for graduate study: graph algorithms beyond the basics, linear programming and integer programming, approximation algorithms, randomized algorithms, and parameterized complexity. Builds on S02 foundations to take students to a competitive programming level and prepares them for system design interviews.

## Learning Outcomes

1. Solve complex graph problems: maximum flow/min-cut (Edmonds-Karp, Dinic), minimum spanning tree variations, strongly connected components (Tarjan's algorithm)
2. Apply linear programming and integer programming to combinatorial optimization problems
3. Design and analyze approximation algorithms with proven performance bounds (greedy, PTAS, FPTAS)
4. Use randomization in algorithm design: randomized quicksort analysis, probabilistic data structures (Bloom filters, Skip lists), Monte Carlo vs. Las Vegas algorithms
5. Understand parameterized complexity: fixed-parameter tractability, kernelization, W[1]-hardness

## Syllabus Outline

| Week | Topic |
|------|-------|
| 1 | Review of asymptotic analysis, recurrence relations, and master theorem |
| 2 | Advanced graph algorithms: DFS ordering, Tarjan's SCC, Johnson's algorithm for all-pairs shortest paths |
| 3 | Maximum flow: Ford-Fulkerson, Edmonds-Karp, Dinic's algorithm, min-cut applications |
| 4 | Matchings: bipartite matching, Hall's theorem, Hungarian algorithm, non-bipartite matching |
| 5 | Linear programming: simplex algorithm, duality, zero-sum games |
| 6 | Integer linear programming: branch and bound, cutting planes, Gomory cuts |
| 7 | Approximation algorithms: vertex cover (2-approx), set cover (greedy log n), TSP (triangle inequality) |
| 8 | PTAS and FPTAS: knapsack PTAS, scheduling problems, polynomial-time approximation schemes |
| 9 | Randomized algorithms: randomized quicksort, Karger-MinCut, probabilistic method, Chernoff bounds |
| 10 | Probabilistic data structures: Bloom filters, Count-Min sketch, HyperLogLog, Skip lists |
| 11 | Parameterized complexity: kernelization, fixed-parameter algorithms, treewidth applications |
| 12 | Capstone: competitive programming problem set + algorithm portfolio documentation |

## Linked Existing Content

- [Algorithms — Advanced sections](../../03_Algorithms/)

## Assessment

- Weekly algorithm problem sets (competitive programming format)
- Algorithm analysis write-ups with correctness proofs and complexity analysis
- 3-hour practical exam (design and implement algorithms for unseen problems)