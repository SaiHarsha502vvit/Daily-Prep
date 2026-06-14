# Algorithm & Data Structure Timeline

> **Cross-reference for Historical Evolution (HE) dimension** — every algorithm chapter that cites a year, inventor, or predecessor links here as the canonical source. MIT 6.006 / KTH DD1352 / RWTH Aachen layer.

This file answers: "When was this invented, by whom, and what problem forced it into existence?"

---

## Table of Contents

1. [Pre-Computer Era (1700s–1930s)](#1-pre-computer-era)
2. [Birth of Algorithms (1940s–1950s)](#2-birth-of-algorithms)
3. [The Classical Era (1960s)](#3-the-classical-era)
4. [Golden Age (1970s)](#4-golden-age)
5. [Consolidation (1980s)](#5-consolidation)
6. [The Internet Era (1990s–2000s)](#6-the-internet-era)
7. [Modern Era (2010s–present)](#7-modern-era)
8. [Quick Reference by Algorithm](#8-quick-reference-by-algorithm)

---

## 1. Pre-Computer Era (1700s–1930s)

### 1736 — Euler: Birth of Graph Theory
**Leonhard Euler** solved the Königsberg bridge problem: is there a walk crossing each of 7 bridges exactly once and returning to start? Proved: impossible, because 4 land masses had odd degree.
- **Created**: Graph theory, Eulerian circuits, the Handshaking Lemma (Σdeg = 2|E|).
- **Modern use**: Eulerian path algorithms, Chinese Postman problem, circuit board routing.
- **See**: [05b — Graphs Internals](05b_Graphs_Internals.md)

### 1857 — Cayley: Trees and Spanning Trees
**Arthur Cayley** introduced "trees" — connected acyclic graphs — and proved Cayley's formula: there are V^(V-2) distinct labelled spanning trees on V vertices.
- **Created**: Tree data structure concept, spanning tree theory.
- **Modern use**: Minimum Spanning Trees, Prüfer sequences, phylogenetics.

### 1928 — Ackermann: Limits of Recursion
**Wilhelm Ackermann** defined the Ackermann function — the first example of a total computable function that is not primitive recursive. Proved that some recursive computations cannot be expressed with bounded loops.
- **Created**: Hierarchy of recursive functions, computability theory.
- **Modern use**: Union-Find path compression amortized analysis uses inverse Ackermann α(n).
- **See**: [A2 — Complexity](A2_Complexity_FirstPrinciples.md)

### 1931 — König: Bipartite Graphs
**Dénes Kőnig** published the first graph theory textbook and proved König's theorem: in bipartite graphs, max matching = min vertex cover.
- **Created**: Bipartite matching, Hall's marriage theorem.
- **Modern use**: Task scheduling, network flow, matching in online platforms.

### 1936 — Kleene: Recursive Functions
**Stephen Kleene** defined the recursive function hierarchy (primitive recursive, general recursive, partial recursive). Established theoretical basis for all recursive algorithms.
- **See**: [03b — Recursion Fundamentals](03b_Recursion_Fundamentals.md)

---

## 2. Birth of Algorithms (1940s–1950s)

### 1945 — von Neumann: Merge Sort
**John von Neumann** invented merge sort while working on ENIAC, for sorting punch-card runs. The first practical O(n log n) sorting algorithm.
- **Innovation**: Divide two halves independently, merge in linear time.
- **Complexity**: Θ(n log n) worst-case — still optimal for comparison sort.
- **Modern use**: Java's `Arrays.sort(Object[])` uses TimSort (merge sort variant); Python's `sort()` is TimSort.
- **See**: [02a — Sorting Fundamentals](02a_Sorting_Fundamentals.md), [02c — Divide & Conquer](02c_Divide_And_Conquer.md)

### 1956 — Kruskal: Minimum Spanning Tree
**Joseph Kruskal** published Kruskal's algorithm: sort edges by weight, greedily add edge if it doesn't form a cycle.
- **Innovation**: Greedy + Union-Find for cycle detection.
- **Complexity**: O(E log E) with efficient sorting.
- **Modern use**: Network design, cluster analysis, image segmentation.
- **See**: [12 — Greedy Algorithms](12_Greedy_Algorithms_Complete.md), [14 — Union-Find](14_Union_Find_DSU_Complete.md)

### 1957 — Bellman: Dynamic Programming + Shortest Paths
**Richard Bellman** coined the term "dynamic programming" (the name was chosen to sound impressive to military funders) and invented Bellman-Ford shortest path algorithm.
- **Innovation**: Optimal substructure principle — optimal solution composed of optimal sub-solutions.
- **Complexity**: O(VE) — handles negative edge weights, detects negative cycles.
- **Modern use**: Distance vector routing (RIP protocol), arbitrage detection.
- **See**: [04b — DP Fundamentals](04b_DP_Fundamentals.md), [05d — Graphs Advanced](05d_Graphs_Advanced_Algos.md)

### 1957 — Prim: Minimum Spanning Tree (Alternative)
**Robert Prim** independently invented a Dijkstra-like MST algorithm growing from a single vertex.
- **Innovation**: Priority queue–based greedy MST.
- **Complexity**: O((V+E) log V) with binary heap.
- **Modern use**: Often preferred over Kruskal on dense graphs.

### 1959 — Dijkstra: Shortest Path in Weighted Graphs
**Edsger W. Dijkstra** designed his shortest-path algorithm in 20 minutes in a café (self-reported). Original paper was 3 pages with no pseudocode.
- **Innovation**: Greedy relaxation via priority queue; correct only for non-negative weights.
- **Complexity**: O((V+E) log V) with binary heap; O(V² + E) with Fibonacci heap.
- **Key proof**: When a node is extracted from the min-heap, its distance is final — proved by contradiction (see [05c — Graphs Fundamentals](05c_Graphs_Fundamentals.md)).
- **Modern use**: Google Maps, IP routing (OSPF), game pathfinding (A\* generalises it).

### 1959 — Hoare: Quicksort
**Tony Hoare** invented quicksort at age 25, working on machine translation at Moscow State University. Originally called "Partition Sort."
- **Innovation**: In-place partition — O(1) extra space; excellent cache locality.
- **Complexity**: Expected Θ(n log n), worst O(n²) on sorted input. Randomised pivot fixes this.
- **Famous bug**: The integer overflow bug `mid = (lo+hi)/2` was in textbooks for decades; correct form is `lo + (hi-lo)/2`. Fixed in Java JDK in 2006.
- **Modern use**: `Arrays.sort(int[])` in Java uses dual-pivot Quicksort (Yaroslavskiy 2009).
- **See**: [02b — Sorting Advanced](02b_Sorting_Advanced.md)

### 1959 — Floyd: All-Pairs Shortest Path
**Robert Floyd** (and independently **Stephen Warshall** for transitive closure) gave the O(V³) dynamic programming recurrence for all-pairs shortest paths.
- **Innovation**: dp[i][j][k] = shortest path from i to j using only vertices {1..k} as intermediates.
- **See**: [05d — Graphs Advanced](05d_Graphs_Advanced_Algos.md)

### 1959 / 1960 — de la Briandais / Fredkin: Tries
**René de la Briandais (1959)** and **Edward Fredkin (1960)** independently invented tries. Fredkin coined the name (from "retrieval"). Lookup of a word of length k is O(k) regardless of dictionary size N.
- **Modern use**: Autocomplete (browsers, IDEs), IP routing tables (longest prefix match), spell checkers.
- **See**: [07a — Advanced DS Core](07a_Advanced_DS_Core.md), [18 — Bitwise Trie](18_Bitwise_Trie_Java_Complete.md)

---

## 3. The Classical Era (1960s)

### 1960 — McCarthy: LISP and Recursion as Control Flow
**John McCarthy** created LISP, making recursion the primary control structure for the first time. Replaced `for`/`while` with recursive function calls as the universal iteration mechanism.
- **Impact**: Every recursive algorithm written today inherits LISP's model.
- **See**: [03b — Recursion Fundamentals](03b_Recursion_Fundamentals.md)

### 1962 — AVL Trees: First Self-Balancing BST
**Adelson-Velsky and Landis** published the first self-balancing binary search tree. Guarantees height ≤ 1.44 log₂(n).
- **Innovation**: Rotations restore balance in O(1) after each insert/delete.
- **Modern use**: Still used in some language runtimes; Java uses Red-Black trees instead.
- **See**: [07c — Advanced Trees Deep](07c_Advanced_Trees_Deep.md)

### 1964 — Fenwick: Binary Indexed Tree (BIT)
**Peter Fenwick** (University of Canterbury, NZ) invented the Binary Indexed Tree as a compact alternative to segment trees. Key insight: index i stores sum of a range of size `i & (-i)`.
- **Innovation**: Both point update and prefix query in O(log n) with only n integers.
- **Modern use**: Competitive programming (prefix sums with updates), order statistics, financial data.
- **See**: [07a — Advanced DS Core](07a_Advanced_DS_Core.md)

### 1965 — Cooley-Tukey: Fast Fourier Transform
**James Cooley and John Tukey** published the FFT, reducing DFT from O(n²) to O(n log n) using divide-and-conquer on polynomials.
- **Impact**: The most practically important D&C algorithm — underpins signal processing, audio compression (MP3), GPS, 5G, cryptography.
- **See**: [02c — Divide & Conquer](02c_Divide_And_Conquer.md)

### 1965 — Backtracking Formalised: Golomb & Baumert
**Solomon Golomb and Leonard Baumert** published the first systematic description of backtracking search for constraint satisfaction problems.
- **See**: [03c — Recursion Advanced](03c_Recursion_Advanced.md), [11 — Backtracking](11_Backtracking_Complete.md)

### 1968 — Knuth: The Art of Computer Programming
**Donald Knuth** published Volume 1 (fundamental algorithms) and Volume 3 (sorting and searching), establishing the mathematical analysis of algorithms as a discipline. Introduced O-notation as standard.
- **Impact**: Every complexity analysis done today uses Knuth's notation framework.
- **See**: [A2 — Complexity from First Principles](A2_Complexity_FirstPrinciples.md)

### 1968 — Michie: Memoization
**Donald Michie** coined the term "memoization" (note: not "memorisation") for the technique of caching recursive function results to avoid recomputation.
- **Distinction from DP**: Memoization is top-down (lazy); tabulation is bottom-up (eager). Michie formalised the top-down approach.
- **See**: [04a — DP Internals](04a_DP_Internals.md)

### 1969 — Strassen: Sub-Cubic Matrix Multiply
**Volker Strassen** showed that 2×2 matrix multiplication requires only 7 scalar multiplications (not 8), giving O(n^{log₂7}) ≈ O(n^{2.807}) for general matrices — the first algorithm to beat the naive O(n³).
- **See**: [02c — Divide & Conquer](02c_Divide_And_Conquer.md)

---

## 4. Golden Age (1970s)

### 1971 — Cook: P vs NP, NP-Completeness
**Stephen Cook** proved that SAT is NP-complete (Cook's theorem). The first NP-completeness proof — established the entire theory of computational hardness.
- **Impact**: Every NP-completeness reduction traces back to Cook's theorem.
- **See**: [A3 — Lower Bounds & NP](A3_Lower_Bounds_And_NP.md)

### 1972 — Karp: 21 NP-Complete Problems
**Richard Karp** showed 21 classic combinatorial problems are NP-complete (3-SAT, Vertex Cover, Clique, Hamilton Path, etc.), establishing the landscape of intractability.
- **See**: [A3 — Lower Bounds & NP](A3_Lower_Bounds_And_NP.md)

### 1972 — Tarjan: Depth-First Search Applications
**Robert Tarjan** showed DFS computes strongly connected components (SCCs) in O(V+E). Also invented link-cut trees, splay trees, and several amortized data structure results.
- **Innovation**: DFS with discovery/finish timestamps → topological sort, SCCs, bridge finding.
- **See**: [05c — Graphs Fundamentals](05c_Graphs_Fundamentals.md)

### 1973 — Red-Black Trees (Symmetric B-Trees)
**Rudolf Bayer** introduced symmetric binary B-trees; **Guibas and Sedgewick (1978)** renamed them Red-Black trees and gave the current invariant formulation (5 rules including black-height invariance).
- **Modern use**: Java `TreeMap`/`TreeSet`, C++ `std::map`, Linux CFS scheduler, Java 8+ `HashMap` bin treeification (threshold: 8 elements).
- **See**: [07c — Advanced Trees Deep](07c_Advanced_Trees_Deep.md)

### 1977 — Bentley: Segment Trees
**Jon Bentley** formalised segment trees for range query problems (interval scheduling, range minimum/maximum queries).
- **Innovation**: Lazy propagation enables range updates in O(log n).
- **Modern use**: Range sum, range min/max queries with point or range updates.
- **See**: [07a — Advanced DS Core](07a_Advanced_DS_Core.md)

### 1978 — Aho-Corasick: Multi-Pattern String Search
**Alfred Aho and Margaret Corasick** published the Aho-Corasick automaton — simultaneous search for all patterns in a dictionary in O(n + m + z) where z = number of matches.
- **Modern use**: Anti-virus scanners (signature matching), intrusion detection systems, DNS filtering.
- **See**: [13 — String Algorithms](13_String_Algorithms_Complete.md)

### 1977 — KMP: O(n+m) Single-Pattern Search
**Knuth, Morris, and Pratt** published the failure function–based linear-time single-pattern string search, avoiding backtracking in the text pointer.
- **Innovation**: Failure function precomputes longest proper prefix = suffix, enabling O(n+m).
- **See**: [06d — String Algorithms](06d_String_Algorithms.md), [13 — String Algorithms](13_String_Algorithms_Complete.md)

---

## 5. Consolidation (1980s)

### 1984 — Fibonacci Heaps
**Fredman and Tarjan** invented Fibonacci heaps, achieving O(1) amortised `decrease-key` — enabling Dijkstra's to run in O(V log V + E) (vs O((V+E) log V) with binary heap).
- **Practical note**: High constant factors make Fibonacci heaps slower than binary heaps in practice for typical graph sizes. Preferred theoretically; binary heap preferred in practice.

### 1984 — Bloom Filter (Analysis)
**Burton Bloom (1970)** invented Bloom filters; rigorous false-positive probability analysis `(1-e^{-kn/m})^k` was published in the 1980s.
- **See**: [A4 — Randomized Algorithms](A4_Randomized_Algorithms.md)

### 1985 — Splay Trees
**Sleator and Tarjan** invented splay trees — self-adjusting BSTs with O(log n) amortised operations and the working-set property (recently accessed nodes are fast to re-access).
- **Innovation**: No stored balance information; tree restructures itself via splaying.

### 1987 — Skip Lists
**William Pugh** invented skip lists as a probabilistic alternative to balanced BSTs. Expected O(log n) search, insert, delete. Simpler to implement than AVL or Red-Black.
- **Modern use**: Redis sorted sets, MemTable in LevelDB/RocksDB, Java `ConcurrentSkipListMap`.
- **See**: [A4 — Randomized Algorithms](A4_Randomized_Algorithms.md)

### 1989 — Universal Hashing
**Carter and Wegman (1979)** defined universal hash families; **Dietzfelbinger et al. (1989)** gave practical constructions. Guarantees Pr[h(x)=h(y)] ≤ 1/m for any two distinct keys x, y.
- **Impact**: Defends against adversarial hash-flooding attacks (HashDoS).
- **See**: [A4 — Randomized Algorithms](A4_Randomized_Algorithms.md)

### 1990 — CLRS: Introduction to Algorithms
**Cormen, Leiserson, Rivest, Stein** published the definitive algorithms textbook. Standardised pseudocode conventions, Big-O analysis, and BFS/DFS/Dijkstra presentations used worldwide.

---

## 6. The Internet Era (1990s–2000s)

### 1993 — Mo's Algorithm (offline range queries)
**Mo Tao** (competitive programmer, later at Google) published the sqrt-decomposition technique for offline range queries in O((n+q)√n).
- **Innovation**: Sort queries by left endpoint's block, then by right endpoint — minimises total pointer movement.
- **See**: [06e — Algorithm Patterns](06e_Algorithm_Patterns.md)

### 1994 — Cuckoo Hashing (precursor ideas)
Cuckoo hashing formalised by **Pagh and Rodler (2001)**: two hash functions, two tables — guaranteed O(1) worst-case lookup.
- **Modern use**: High-performance network packet lookup, Intel's DPDK, some DNS resolvers.
- **See**: [A4 DS — Randomized Data Structures](../02_Data_Structures/A4_Randomized_Data_Structures.md)

### 1998 — Google PageRank
**Brin and Page** applied power iteration on the web graph's adjacency matrix to compute stationary distribution — effectively a random walk / eigenvector computation on a massive graph.
- **Impact**: Showed that graph algorithms on internet-scale data are practically important.

### 2001 — HyperLogLog (precursor: Flajolet-Martin 1983)
**Flajolet and Martin (1983)** introduced probabilistic counting; **Flajolet, Fusy, Gandouet, Meunier (2007)** published HyperLogLog — estimates cardinality in O(1) space with 2% error using only ~12KB.
- **Modern use**: Redis `PFCOUNT`, BigQuery, ClickHouse — counting unique visitors without storing all IDs.
- **See**: [A4 DS — Randomized Data Structures](../02_Data_Structures/A4_Randomized_Data_Structures.md)

### 2004 — MapReduce
**Dean and Ghemawat (Google)** published MapReduce — a programming model for parallel data processing using distributed sort and reduce phases. Merge sort is the backbone of the shuffle step.
- **Impact**: Spark, Hadoop, Flink all derive from this model.

---

## 7. Modern Era (2010s–present)

### 2006 — Java Binary Search Fix
The `mid = (lo + hi) / 2` integer overflow bug was reported by **Joshua Bloch (Google/Sun)** in a blog post — the bug had been in Java's `Arrays.binarySearch` since 1946 (in academic texts) and was in the JDK since 1997. Fixed to `lo + (hi - lo) / 2`.
- **See**: [02c — Divide & Conquer](02c_Divide_And_Conquer.md)

### 2009 — Dual-Pivot Quicksort (Java 7+)
**Vladimir Yaroslavskiy** proposed dual-pivot quicksort: use two pivots to partition into 3 parts. Adopted in Java 7's `Arrays.sort(int[])`. ~10–15% faster than single-pivot in practice.

### 2011 — HashDoS Attack
Researchers demonstrated that non-randomized hash seeds in Python, Java, PHP, Ruby allowed adversarial string inputs to degrade HashMap from O(1) to O(n) — causing denial-of-service. Resulted in mandatory hash randomisation in all major runtimes.
- **See**: [A4 — Randomized Algorithms](A4_Randomized_Algorithms.md), [01e — Hash Tables](../02_Data_Structures/01e_HashTable.md)

### 2014 — Java 8: HashMap Treeification
Java 8 added treeification of HashMap bins: when a bucket exceeds 8 elements (and table size > 64), the linked-list bin is converted to a Red-Black tree — O(n) worst-case collision degraded to O(log n).
- **See**: [07c — Advanced Trees Deep](07c_Advanced_Trees_Deep.md)

### 2016 — Consistent Hashing at Scale
Consistent hashing (Karger et al. 1997) became universally adopted for distributed caches (DynamoDB, Redis Cluster, Cassandra) — minimises remapping when nodes join/leave.
- **See**: [A4 DS — Randomized Data Structures](../02_Data_Structures/A4_Randomized_Data_Structures.md)

---

## 8. Quick Reference by Algorithm

| Algorithm | Year | Inventor | Complexity | Chapter |
|---|---|---|---|---|
| Graph theory (Eulerian path) | 1736 | Euler | O(E) | [05b](05b_Graphs_Internals.md) |
| Trees (spanning) | 1857 | Cayley | — | [05_Trees](05_Trees.md) |
| Ackermann function | 1928 | Ackermann | non-PR | [A2](A2_Complexity_FirstPrinciples.md) |
| Recursive functions | 1936 | Kleene | — | [03b](03b_Recursion_Fundamentals.md) |
| Merge sort | 1945 | von Neumann | Θ(n log n) | [02a](02a_Sorting_Fundamentals.md) |
| Kruskal's MST | 1956 | Kruskal | O(E log E) | [12_Greedy](12_Greedy_Algorithms_Complete.md) |
| Bellman-Ford | 1957 | Bellman | O(VE) | [05d](05d_Graphs_Advanced_Algos.md) |
| Prim's MST | 1957 | Prim | O((V+E)log V) | [12_Greedy](12_Greedy_Algorithms_Complete.md) |
| Dijkstra | 1959 | Dijkstra | O((V+E)log V) | [05c](05c_Graphs_Fundamentals.md) |
| Quicksort | 1959 | Hoare | Θ(n log n) avg | [02b](02b_Sorting_Advanced.md) |
| Floyd-Warshall | 1959/62 | Floyd/Warshall | O(V³) | [05d](05d_Graphs_Advanced_Algos.md) |
| Trie | 1959/60 | de la Briandais/Fredkin | O(k) lookup | [07a](07a_Advanced_DS_Core.md) |
| LISP recursion | 1960 | McCarthy | — | [03b](03b_Recursion_Fundamentals.md) |
| AVL tree | 1962 | Adelson-Velsky & Landis | O(log n) | [07c](07c_Advanced_Trees_Deep.md) |
| Fenwick tree (BIT) | 1964 | Fenwick | O(log n) | [07a](07a_Advanced_DS_Core.md) |
| FFT | 1965 | Cooley-Tukey | O(n log n) | [02c](02c_Divide_And_Conquer.md) |
| Backtracking formalised | 1965 | Golomb & Baumert | exp | [03c](03c_Recursion_Advanced.md) |
| Knuth TAOCP | 1968 | Knuth | — | [A2](A2_Complexity_FirstPrinciples.md) |
| Memoization term | 1968 | Michie | — | [04a](04a_DP_Internals.md) |
| Strassen | 1969 | Strassen | O(n^2.807) | [02c](02c_Divide_And_Conquer.md) |
| NP-completeness (SAT) | 1971 | Cook | — | [A3](A3_Lower_Bounds_And_NP.md) |
| 21 NP-complete problems | 1972 | Karp | — | [A3](A3_Lower_Bounds_And_NP.md) |
| DFS / SCC (Tarjan) | 1972 | Tarjan | O(V+E) | [05c](05c_Graphs_Fundamentals.md) |
| Red-Black tree | 1972/78 | Bayer / Guibas-Sedgewick | O(log n) | [07c](07c_Advanced_Trees_Deep.md) |
| Segment tree | 1977 | Bentley | O(log n) | [07a](07a_Advanced_DS_Core.md) |
| KMP | 1977 | Knuth-Morris-Pratt | O(n+m) | [06d](06d_String_Algorithms.md) |
| Aho-Corasick | 1978 | Aho-Corasick | O(n+m+z) | [13](13_String_Algorithms_Complete.md) |
| Universal hashing | 1979 | Carter-Wegman | O(1) expected | [A4](A4_Randomized_Algorithms.md) |
| Fibonacci heap | 1984 | Fredman-Tarjan | O(1) amortised decrease-key | — |
| Bloom filter | 1970/80s | Bloom | O(k) | [A4](A4_Randomized_Algorithms.md) |
| Splay tree | 1985 | Sleator-Tarjan | O(log n) amortised | — |
| Skip list | 1987 | Pugh | O(log n) expected | [A4](A4_Randomized_Algorithms.md) |
| CLRS textbook | 1990 | CLRS | — | All chapters |
| Mo's algorithm | 1993 | Mo | O((n+q)√n) | [06e](06e_Algorithm_Patterns.md) |
| Cuckoo hashing | 2001 | Pagh-Rodler | O(1) worst lookup | [A4 DS](../02_Data_Structures/A4_Randomized_Data_Structures.md) |
| HyperLogLog | 2007 | Flajolet et al. | O(1) space | [A4 DS](../02_Data_Structures/A4_Randomized_Data_Structures.md) |
| Binary search overflow fix | 2006 | Bloch | — | [02c](02c_Divide_And_Conquer.md) |
| Dual-pivot quicksort | 2009 | Yaroslavskiy | Θ(n log n) | [02b](02b_Sorting_Advanced.md) |
| HashDoS mitigation | 2011 | — | — | [A4](A4_Randomized_Algorithms.md) |
| Java 8 HashMap treeify | 2014 | Oracle | O(log n) worst | [07c](07c_Advanced_Trees_Deep.md) |

---

> **Usage note**: When writing a chapter section that references an inventor or year, link to this file for the full context. Format: `(Dijkstra 1959 — see [Algorithm Timeline](00_ALGORITHM_TIMELINE.md))`.
