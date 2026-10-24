# Advanced Algo Deep

> **Navigation**: [← Advanced Algorithm Engineering…](07e_Advanced_Algorithm_Engineering_Deep.md) | [Chapter index](00_INDEX.md) | [PART FINAL: MODERN ALGORITHMS AND… →](06e_Algorithm_Patterns.md)

---

<details>
<summary><b>🧠 5W1H: Advanced Algorithms (DP, Backtracking, Branch & Bound, NP-Complete)</b></summary>

- **What**: Core patterns of Dynamic Programming, Backtracking, Branch & Bound, and theoretical limits via NP-Completeness.
- **Why**: Real-world routing/scheduling problems are often intractable (NP-Hard). You must recognize when exact $O(N)$ is impossible so you can switch to DP, Branch & Bound, or approximations.
- **When**: Use DP for overlapping subproblems. Use Backtracking for small constraints to enumerate state spaces. Use Branch & Bound when pruning makes NP-hard feasible for small inputs.
- **Where**: Pathfinding, logistics (TSP), constraint solvers, and algorithmic interviews.
- **Who**: Operations researchers, backend engineers, and algorithm designers.
- **How**: By defining states and transitions (DP), maintaining a state stack (Backtracking), deriving tight lower bounds (B&B), and reducing from known problems (SAT) to prove hardness.
</details>

---

## Historical Evolution

The theory of NP-Completeness represents one of the most consequential intellectual achievements in computer science. **Stephen Cook** presented the theorem in **1971** (STOC 1971; Leonid Levin proved it independently, published 1973, hence "Cook–Levin"), proving that the Boolean satisfiability problem (SAT) was the first known NP-Complete problem — any problem in NP could be reduced to SAT in polynomial time. The following year, **Richard Karp** published his landmark 1972 paper "Reducibility Among Combinatorial Problems" identifying 21 NP-Complete problems including 3-SAT, Vertex Cover, Clique, Hamiltonian circuit, and Knapsack/Subset Sum — this paper transformed the theoretical result into a practical toolkit for algorithm classification. **Branch and Bound** as an exact optimization technique traces to **A. H. Land and G. D. Doig in 1960** in the context of operations research for mixed integer programming, where splitting the problem space and computing lower bounds enabled exact solutions to NP-Hard problems that were previously intractable. Approximation algorithms began with **Graham's scheduling bound (1966)** and **Johnson (1974)**, were systematised in **Garey and Johnson (1979)** and later textbooks such as **Vazirani (2001)**; the classic 2-approximation for Vertex Cover takes both endpoints of a *maximal* matching. Modern practice (post-2010) applies NP-Completeness analysis to guide algorithm selection in production: recognizing a problem is NP-Hard triggers heuristic/approximation strategies rather than exact search.

---

## 🎯 Advanced Algorithms Deep Dive: Implementations

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | All paradigms: [DP](04c_DP_Advanced.md), [Backtracking](11_Backtracking_Complete.md), [Greedy](12_Greedy_Algorithms_Complete.md) |
| **You will learn** | Implementations of DP, backtracking and branch-and-bound; NP-hard and NP-complete problems; Cook's theorem; classic NP-complete problems |
| **Leads to** | [A3 Lower Bounds & NP](A3_Lower_Bounds_And_NP.md), [Approximation](25_Online_Approximation_And_Linear_Programming.md) |
| **Abstraction level** | L2→L7: from algorithms to the edge of tractability |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Advanced Algorithms Deep Dive

### 1. The bottom line

This chapter shows how the main paradigms are implemented in full and where they stop working because the problem is NP-hard.

### 2. The textbook core

- **Branch and bound** prunes with a bound on the best possible completion.
- **P** = solvable in polynomial time; **NP** = checkable in polynomial time; **NP-complete** = hardest in NP.
- Reductions prove hardness: if A reduces to B and A is hard, B is hard.
- Typical NP-complete problems: SAT, 3-SAT, Clique, Vertex Cover, Hamiltonian cycle, TSP (decision).

### 3. The real-world analogy

A **jigsaw puzzle**: checking a finished puzzle is quick (NP), but no known method assembles every puzzle quickly.

### 4. Walkthrough

1. Branch and bound for 0/1 knapsack.
2. Order items by value/weight and compute an optimistic bound (fractional relaxation).
3. Explore include/exclude branches; prune when bound ≤ best known.
4. Return the best complete solution found.

> [!NOTE]
> **Quick check:** What does NP-complete tell you in practice? *Stop looking for a fast exact algorithm; use heuristics, approximation or exponential search with pruning.*

---


### Fractional Knapsack Problem

```java
// CAN take fractions of items
// Greedy by value/weight ratio WORKS!

class Item {
    int value, weight;
    double ratio;

    Item(int v, int w) {
        value = v;
        weight = w;
        ratio = (double) v / w;
    }
}

public double fractionalKnapsack(Item[] items, int capacity) {
    // Sort by value/weight ratio (descending)
    Arrays.sort(items, (a, b) -> Double.compare(b.ratio, a.ratio));

    double totalValue = 0;
    int remainingCapacity = capacity;

    for (Item item : items) {
        if (remainingCapacity >= item.weight) {
            // Take whole item
            totalValue += item.value;
            remainingCapacity -= item.weight;
        } else {
            // Take fraction of item
            totalValue += item.ratio * remainingCapacity;
            break;
        }
    }

    return totalValue;
}

// VISUAL EXAMPLE:
// Items: [(60,10), (100,20), (120,30)]
// Capacity: 50
//
// Ratios: 60/10=6, 100/20=5, 120/30=4
// Sorted: [(60,10), (100,20), (120,30)]
//
// Take (60,10): value=60, capacity=40
// Take (100,20): value=160, capacity=20
// Take 20/30 of (120,30): value=160+80=240
//
// Answer: 240

// TIME: O(n log n) for sorting
```

### Job Sequencing with Deadlines

```java
// Jobs with deadlines and profits
// Schedule to maximize profit
// Each job takes 1 unit time

class Job {
    int id, deadline, profit;
    Job(int id, int d, int p) {
        this.id = id;
        deadline = d;
        profit = p;
    }
}

public int jobSequencing(Job[] jobs, int maxDeadline) {
    // Sort by profit (descending)
    Arrays.sort(jobs, (a, b) -> b.profit - a.profit);

    boolean[] slot = new boolean[maxDeadline + 1];
    int[] result = new int[maxDeadline + 1];
    int totalProfit = 0;

    for (Job job : jobs) {
        // Find latest free slot before deadline
        for (int j = job.deadline; j >= 1; j--) {
            if (!slot[j]) {
                slot[j] = true;
                result[j] = job.id;
                totalProfit += job.profit;
                break;
            }
        }
    }

    return totalProfit;
}

// VISUAL EXAMPLE:
// Jobs: [(1,2,100), (2,1,19), (3,2,27), (4,1,25), (5,3,15)]
// Sorted by profit: [J1(100), J3(27), J4(25), J2(19), J5(15)]
//
// J1: deadline=2, slot[2] free → assign
// J3: deadline=2, slot[2] taken, slot[1] free → assign
// J4: deadline=1, slot[1] taken → skip
// J2: deadline=1, slot[1] taken → skip
// J5: deadline=3, slot[3] free → assign
//
// Schedule: [J3, J1, J5] = slots [1, 2, 3]
// Profit: 27 + 100 + 15 = 142

// TIME: O(n² ) naive, O(n log n) with Union-Find
```

### Single Source Shortest Path (Dijkstra's Algorithm)

```java
// Find shortest path from source to all vertices
// Works only for non-negative weights

public int[] dijkstra(int[][] graph, int source, int n) {
    int[] dist = new int[n];
    boolean[] visited = new boolean[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[source] = 0;

    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);
    pq.offer(new int[]{source, 0});

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int u = curr[0];

        if (visited[u]) continue;
        visited[u] = true;

        for (int v = 0; v < n; v++) {
            if (graph[u][v] != 0 && !visited[v]) {
                int newDist = dist[u] + graph[u][v];
                if (newDist < dist[v]) {
                    dist[v] = newDist;
                    pq.offer(new int[]{v, newDist});
                }
            }
        }
    }

    return dist;
}

// VISUAL EXAMPLE:
//
//        (1)---4---(2)
//       / |         |
//      2  1         3
//     /   |         |
//   (0)   (3)---2---(4)
//
// From source 0:
//
// Step 1: dist = [0, ∞, ∞, ∞, ∞], visit 0
//         Update: dist[1] = 2
//
// Step 2: dist = [0, 2, ∞, ∞, ∞], visit 1
//         Update: dist[2] = 2+4 = 6
//         Update: dist[3] = 2+1 = 3
//
// Step 3: dist = [0, 2, 6, 3, ∞], visit 3
//         Update: dist[4] = 3+2 = 5
//
// Step 4: dist = [0, 2, 6, 3, 5], visit 4
//         Update: dist[2] = min(6, 5+3) = 6 (no change)
//
// Final: [0, 2, 6, 3, 5]

// TIME: O((V+E) log V) with priority queue
```

### Optimal Merge Pattern (Huffman-like)

```java
// Merge n sorted files with minimum comparisons
// Greedy: Always merge two smallest files

public int optimalMerge(int[] fileSizes) {
    PriorityQueue<Integer> pq = new PriorityQueue<>();

    for (int size : fileSizes) {
        pq.offer(size);
    }

    int totalCost = 0;

    while (pq.size() > 1) {
        int first = pq.poll();
        int second = pq.poll();
        int merged = first + second;

        totalCost += merged;
        pq.offer(merged);
    }

    return totalCost;
}

// VISUAL EXAMPLE:
// Files: [2, 3, 4, 5, 6]
//
// Merge 2+3 = 5, cost = 5
// Files: [4, 5, 5, 6]
//
// Merge 4+5 = 9, cost = 5+9 = 14
// Files: [5, 6, 9]
//
// Merge 5+6 = 11, cost = 14+11 = 25
// Files: [9, 11]
//
// Merge 9+11 = 20, cost = 25+20 = 45
//
// Total cost: 45

// TIME: O(n log n)
```

---

## 📚 Topic Pages in This Chapter

This chapter is split into focused pages so each topic can be read on its own. Read them in order the first time; use the table to jump back later.

| # | Page | What is inside | Lines |
| --- | --- | --- | --- |
| 1 | [UNIT 3: DYNAMIC PROGRAMMING](06c_Advanced_Algo_Deep/01_unit_3_dynamic_programming.md) | UNIT 3: DYNAMIC PROGRAMMING | 295 |
| 2 | [UNIT 4: BACKTRACKING](06c_Advanced_Algo_Deep/02_unit_4_backtracking.md) | UNIT 4: BACKTRACKING | 284 |
| 3 | [UNIT 5: BRANCH AND BOUND](06c_Advanced_Algo_Deep/03_unit_5_branch_and_bound.md) | UNIT 5: BRANCH AND BOUND | 229 |
| 4 | [NP-HARD AND NP-COMPLETE](06c_Advanced_Algo_Deep/04_np_hard_and_np_complete.md) | NP-HARD AND NP-COMPLETE | 174 |

## 🏢 Enterprise Lens — Advanced Algorithms Deep Dive

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Combinatorial optimisation in logistics, scheduling and chip design; SAT solvers in verification |
| **Failure modes** | Wasting time seeking polynomial exact algorithms; weak bounds making branch and bound exponential |
| **Testing and verification** | Verify against brute force; track node counts to see pruning efficiency |

---

## Reality Check

**"Advanced algorithms are only for competitive programming"** → Segment trees power range queries in databases and analytics engines. Suffix arrays and suffix trees power full-text search in search engines. Network flow algorithms solve resource allocation, bipartite matching (job assignment), and maximum bandwidth routing. Advanced algorithms are infrastructure-level tools that appear in production systems at scale.

**"Understanding the concept is enough without implementation"** → Implementing a segment tree with lazy propagation or a suffix array with LCP array reveals edge cases that conceptual understanding misses: off-by-one errors in range boundaries, handling lazy propagation correctly during queries, and managing the transition between recursive and iterative implementations. Implementation experience builds the intuition needed to debug algorithmic code under time pressure.

**"Algorithm complexity is the only factor in choosing between approaches"** → A balanced BST and a skip list both provide O(log n) operations. But skip lists are easier to implement correctly, support concurrent access more naturally, and have better cache locality for sequential access. A B-tree is O(log n) like a BST but is specifically designed for disk-based storage where minimizing I/O operations matters more than minimizing comparisons.

**"Randomized algorithms are unreliable"** → Randomized algorithms with high-probability guarantees (like randomized quicksort, skip lists, or Bloom filters) fail with probability so low it is negligible in practice. Quicksort with random pivot selection has O(n log n) expected time with probability 1 - 1/n^c for any constant c. The probability of worst-case O(n squared) is astronomically small — you are more likely to experience hardware failure.

**"Amortized analysis and average-case analysis are the same"** → Average-case analysis assumes a probability distribution over inputs (e.g., random input). Amortized analysis makes NO distributional assumptions — it guarantees that ANY sequence of n operations takes at most f(n) total time. Amortized O(1) for dynamic array append means EVERY sequence of n appends costs O(n) total. Average-case O(1) means the EXPECTED cost over random inputs is O(1), but specific inputs could be worse.
