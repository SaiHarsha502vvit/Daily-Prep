**Navigation**: [< Previous Chapter](06d_String_Algorithms.md) | [Back to Index](../00_MASTER_INDEX.md)
🧠 **Mental Model**: See [Optimization Pipeline](../14_Mental_Models/14_Optimization_Pipeline.md) — systematic brute force to optimal approach

---

# 🔬 PART FINAL: MODERN ALGORITHMS AND ADVANCED TOPICS

<details>
<summary><b>🧠 5W1H: Modern Algorithms & Advanced Topics</b></summary>

- **What**: Theoretical foundations (P vs NP), Randomized Algorithms (Monte Carlo, Las Vegas), Advanced Strings (Aho-Corasick), Network Flows (Dinic), and Computational Geometry.
- **Why**: Standard algorithms assume exact, deterministic answers in polynomial time. These topics address problems where polynomial time fails (NP-Hard), where randomness provides better average/practical bounds, or where continuous space (geometry) applies.
- **When**: Used in complex routing (Network Flow), computational geometry (game engines, CAD), pattern matching (search engines), and handling intractable problems (Approximation algorithms).
- **Where**: High-level systems design, competitive programming, and research.
- **Who**: Algorithm engineers, researchers, and advanced software engineers.
- **How**: By accepting approximations, using randomization for expected bounds, and applying advanced mathematical frameworks (Flow Networks, Geometry).
</details>

---

### Historical Evolution

Advanced offline query algorithms emerged from the intersection of competitive programming and database query optimization. **Mo's Algorithm** (offline range query answering) was introduced by **Mo, Q. I. in 1993** as a technique for answering offline queries on static arrays by reordering them to minimize the movement of the query window — the key insight is that sorting queries by block size ($n/\sqrt{q}$) reduces the total movement to $O(n\sqrt{q})$. **Heavy-Light Decomposition (HLD)** was developed by **Harold Djidjev and Robert Tarjan in the 1980s** for network flow applications, with the classic "Maintaining trees in a linear ordering" paper by **Sleator and Tarjan (1983)** formalizing heavy-path concepts for link-cut trees. **Wavelet Trees** were introduced by **Grossi, Gupta, and Vitter in 2003** for high-dimensional rank/select queries on static strings — they generalize binary indexed trees to multiple dimensions and enable $O(\log \sigma)$ queries on sequences over alphabets of size $\sigma$, critical for bioinformatics (FM-index, BWT-based searching). **Dinic's algorithm** for maximum flow was published by **Yefim Dinic in 1970** with the capacity scaling optimization (Goldberg 1985), and remains the go-to algorithm for network flow problems. Modern practice (post-2010) applies these patterns in competitive programming (CF, AtCoder), database index structures, and network analysis tools.

---

## 📚 NP — Completeness — the Complete Understanding

## P Vs Np - The Millennium Prize Problem

**Complexity Classes**:
P (Polynomial Time):

- Problems solvable in O(n^k) for some constant k
- Examples: Sorting, Shortest Path, MST, Matrix Multiplication
- These are "tractable" - efficient algorithms exist
  NP (Nondeterministic Polynomial Time):
- Problems where solutions can be VERIFIED in polynomial time
- NOT "Non-Polynomial"!
- Examples: SAT, Traveling Salesman, Vertex Cover
  NP-Complete:
- Hardest problems in NP
- If any NP-Complete problem has a polynomial solution → P = NP
- 21 original NP-Complete problems (Karp's 21)
  NP-Hard:
- At least as hard as NP-Complete
- May not even be in NP (solution might not be verifiable in poly time)
- Example: Halting Problem (undecidable!)
  VISUAL RELATIONSHIP (if P ≠ NP):

```text
NP-Hard
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  ┌────────────────────────────── NP ─────────────────────────────────────────┐  │
│  │                                                                           │  │
│  │  ┌────────────── P ──────────────┐   ┌──────── NP-Complete ────────────┐ │  │
│  │  │                               │   │ • SAT                            │ │  │
│  │  │                               │   │ • 3-SAT                          │ │  │
│  │  └───────────────────────────────┘   │ • Vertex Cover                   │ │  │
│  │                                      │ • Hamiltonian Path               │ │  │
│  │                                      │ • Traveling Salesman             │ │  │
│  │                                      │ • Graph Coloring                 │ │  │
│  │                                      │ • Subset Sum                     │ │  │
│  │                                      └───────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  NP-Hard may also contain problems outside NP (e.g., Halting Problem).         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

PROVING NP-COMPLETENESS:
To show problem X is NP-Complete:

1. Show X is in NP (solution verifiable in poly time)
2. Show X is NP-Hard (reduce known NP-Complete problem to X in poly time)
   Reduction: If A reduces to B in polynomial time, written A ≤_p B:

- We can transform any instance of A to an instance of B
- Transformation takes polynomial time
- Solution to transformed B gives solution to original A
  If B has polynomial solution and A ≤_p B → A has polynomial solution
  Contrapositive: If A has no poly solution and A ≤_p B → B has no poly sol

```java
public Set<Integer> vertexCover2Approx(int n, int[][] edges) {
    Set<Integer> cover = new HashSet<>();
    Set<String> remaining = new HashSet<>();

    for (int[] e : edges) {
        remaining.add(e[0] + "," + e[1]);
    }

    for (int[] e : edges) {
        String key = e[0] + "," + e[1];
        if (remaining.contains(key)) {
            cover.add(e[0]);
            cover.add(e[1]);

            // Remove all edges incident to e[0] or e[1]
            remaining.removeIf(s -> {
                String[] parts = s.split(",");
                int u = Integer.parseInt(parts[0]);
                int v = Integer.parseInt(parts[1]);
                return u == e[0] || u == e[1] || v == e[0] || v == e[1];
            });
        }
    }
    return cover;
}
```

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ EXAMPLE 2: SET COVER (log n - Approximation)                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Problem: Given universe U and sets S₁...Sₘ, find minimum number of sets that  │
│ cover all elements.                                                             │
│                                                                                 │
│ Greedy Algorithm:                                                               │
│ 1. While uncovered elements exist:                                              │
│    a. Pick set Sᵢ that covers most uncovered elements                          │
│    b. Add Sᵢ to solution                                                        │
│    c. Mark covered elements                                                     │
│                                                                                 │
│ Approximation ratio: O(log n), where n = |U|                                   │
│ (This is optimal unless P = NP.)                                                │
│                                                                                 │
│ EXAMPLE 3: TSP with Triangle Inequality (1.5-Approximation)                     │
│ Christofides Algorithm:                                                         │
│ 1. Find MST of graph                                                            │
│ 2. Find minimum weight perfect matching on odd-degree vertices                  │
│ 3. Combine MST + matching (Eulerian graph)                                      │
│ 4. Find Euler tour                                                              │
│ 5. Shortcut to Hamiltonian cycle                                                │
│                                                                                 │
│ Approximation ratio: 3/2 = 1.5                                                  │
│ (Best known for metric TSP.)                                                    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 📌 Randomized Algorithms

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ RANDOMIZED ALGORITHMS - DEEP DIVE                                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ TWO TYPES:                                                                      │
│ ───────────                                                                     │
│ 1. Las Vegas: Always correct, expected polynomial time                          │
│ Example: Randomized QuickSort                                                   │
│                                                                                 │
│ 2. Monte Carlo: May be wrong, but guaranteed polynomial time                    │
│ Example: Primality testing, Min-Cut                                             │
│                                                                                 │
│                                                                                 │
│ RANDOMIZED QUICKSORT:                                                           │
│ ─────────────────────                                                           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

```java
void randomizedQuickSort(int[] arr, int low, int high) {
    if (low < high) {
        // Random pivot selection
        int randomIndex = low + random.nextInt(high - low + 1);
        swap(arr, randomIndex, high);  // Move pivot to end

        int pivotIndex = partition(arr, low, high);
        randomizedQuickSort(arr, low, pivotIndex - 1);
        randomizedQuickSort(arr, pivotIndex + 1, high);
    }
}

// Expected time: O(n log n)
// Worst case: O(n²) but probability is 1/n! → negligible
```

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ KARGER'S MIN-CUT ALGORITHM                                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│ Find minimum cut in undirected graph.                                          │
│                                                                                 │
│ Algorithm:                                                                      │
│ 1. While more than 2 vertices:                                                 │
│    a. Pick random edge (u, v)                                                  │
│    b. Contract u and v into single vertex                                      │
│    c. Remove self-loops                                                        │
│ 2. Return number of edges between final 2 vertices                             │
│                                                                                 │
│ Probability of finding min-cut: ≥ 1/n²                                         │
│ Run n² log n times → P(failure) < 1/n                                          │
│ Total time: O(n⁴ log n) basic, O(n² log³ n) improved                           │
│                                                                                 │
│ MILLER-RABIN PRIMALITY TEST:                                                    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

```java
// Monte Carlo: May report composite as prime, never reports prime as composite
public boolean isProbablePrime(long n, int iterations) {
    if (n < 2) return false;
    if (n == 2 || n == 3) return true;
    if (n % 2 == 0) return false;

    // Write n-1 as 2^r * d
    long d = n - 1;
    int r = 0;
    while (d % 2 == 0) {
        d /= 2;
        r++;
    }

    // Witness loop
    for (int i = 0; i < iterations; i++) {
        long a = 2 + random.nextLong() % (n - 3);
        if (!millerRabinTest(n, d, r, a)) {
            return false;  // Definitely composite
        }
    }
    return true;  // Probably prime
}

private boolean millerRabinTest(long n, long d, int r, long a) {
    long x = modPow(a, d, n);
    if (x == 1 || x == n - 1) return true;

    for (int i = 0; i < r - 1; i++) {
        x = modPow(x, 2, n);
        if (x == n - 1) return true;
    }
    return false;
}

// Probability of error after k iterations: ≤ (1/4)^k
// For k = 40: error probability < 10^-24
```

## 📝 Advanced String Algorithms

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ STRING MATCHING ALGORITHMS - COMPLETE COMPARISON                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ ALGORITHM COMPARISON:                                                           │
│ ┌─────────────────────┬────────────────┬────────────────┬──────────────────┐    │
│ │ Algorithm │ Preprocessing │ Search Time │ Space │                             │
│ ├─────────────────────┼────────────────┼────────────────┼──────────────────┤    │
│ │ Naive │ O(1) │ O(nm) │ O(1) │                                                 │
│ │ KMP │ O(m) │ O(n) │ O(m) │                                                    │
│ │ Boyer-Moore │ O(m + σ) │ O(nm) worst │ O(m + σ) │                             │
│ │ │ │ O(n/m) best │ │                                                           │
│ │ Rabin-Karp │ O(m) │ O(nm) worst │ O(1) │                                      │
│ │ │ │ O(n+m) expected│ │                                                        │
│ │ Z-Algorithm │ O(m) │ O(n) │ O(n+m) │                                          │
│ │ Suffix Array │ O(n log n) │ O(m log n) │ O(n) │                               │
│ │ Suffix Tree │ O(n) │ O(m) │ O(n) │                                            │
│ │ Aho-Corasick │ O(Σ|patterns|) │ O(n+matches) │ O(Σ|patterns|·σ) │             │
│ └─────────────────────┴────────────────┴────────────────┴──────────────────┘    │
│                                                                                 │
│ n = text length, m = pattern length, σ = alphabet size                          │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

```java
// Z-ALGORITHM: Find all occurrences of pattern in text
// Z[i] = length of longest substring starting at i that matches prefix
public int[] zFunction(String s) {
    int n = s.length();
    int[] z = new int[n];
    int l = 0, r = 0;

    for (int i = 1; i < n; i++) {
        if (i < r) {
            z[i] = Math.min(r - i, z[i - l]);
        }
        while (i + z[i] < n && s.charAt(z[i]) == s.charAt(i + z[i])) {
            z[i]++;
        }
        if (i + z[i] > r) {
            l = i;
            r = i + z[i];
        }
    }
    return z;
}

// Usage: Find pattern P in text T
// Create S = P + "$" + T
// All positions where z[i] == len(P) are matches

// AHO-CORASICK: Multiple pattern matching
class AhoCorasick {
    int[][] trie;
    int[] fail, output;
    int size = 0;

    public AhoCorasick(int maxStates, int alphabetSize) {
        trie = new int[maxStates][alphabetSize];
        fail = new int[maxStates];
        output = new int[maxStates];
        Arrays.fill(trie[0], -1);
    }

    public void addPattern(String pattern, int index) {
        int state = 0;
        for (char c : pattern.toCharArray()) {
            int ch = c - 'a';
            if (trie[state][ch] == -1) {
                trie[state][ch] = ++size;
                Arrays.fill(trie[size], -1);
            }
            state = trie[state][ch];
        }
        output[state] |= (1 << index);
    }

    public void build() {
        Queue<Integer> queue = new LinkedList<>();

        // Initialize fail function for depth 1
        for (int c = 0; c < 26; c++) {
            if (trie[0][c] != -1) {
                fail[trie[0][c]] = 0;
                queue.offer(trie[0][c]);
            } else {
                trie[0][c] = 0;
            }
        }

        // BFS to compute fail function
        while (!queue.isEmpty()) {
            int state = queue.poll();
            for (int c = 0; c < 26; c++) {
                if (trie[state][c] != -1) {
                    int next = trie[state][c];
                    int f = fail[state];
                    while (trie[f][c] == -1) f = fail[f];
                    fail[next] = trie[f][c];
                    output[next] |= output[fail[next]];
                    queue.offer(next);
                }
            }
        }
    }

    public List<int[]> search(String text) {
        List<int[]> matches = new ArrayList<>();
        int state = 0;

        for (int i = 0; i < text.length(); i++) {
            int c = text.charAt(i) - 'a';
            while (trie[state][c] == -1) state = fail[state];
            state = trie[state][c];

            if (output[state] != 0) {
                for (int j = 0; j < 32; j++) {
                    if ((output[state] & (1 << j)) != 0) {
                        matches.add(new int[]{i, j});  // position, pattern index
                    }
                }
            }
        }
        return matches;
    }
}
```

## 🌐 Network Flow Algorithms

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ MAXIMUM FLOW - COMPLETE GUIDE                                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ PROBLEM: Find maximum flow from source s to sink t in a directed graph          │
│ with edge capacities                                                            │
│                                                                                 │
│ ALGORITHM COMPARISON:                                                           │
│ ┌─────────────────────┬────────────────────────┬────────────────────────────┐   │
│ │ Algorithm │ Time Complexity │ Notes │                                         │
│ ├─────────────────────┼────────────────────────┼────────────────────────────┤   │
│ │ Ford-Fulkerson │ O(E × maxFlow) │ Uses DFS, may not terminate│                │
│ │ Edmonds-Karp │ O(V × E²) │ Uses BFS for augmenting │                          │
│ │ Dinic │ O(V² × E) │ Level graph + blocking flow│                              │
│ │ Push-Relabel │ O(V² × E) │ Different approach │                               │
│ │ Dinic (unit cap) │ O(E × √V) │ For unit capacity graphs │                     │
│ └─────────────────────┴────────────────────────┴────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

```java
// DINIC'S ALGORITHM - O(V²E)
class Dinic {
    int[] level, iter;
    List<int[]>[] graph;  // int[] = {to, capacity, rev_index}
    int n;

    public Dinic(int n) {
        this.n = n;
        graph = new ArrayList[n];
        for (int i = 0; i < n; i++) graph[i] = new ArrayList<>();
        level = new int[n];
        iter = new int[n];
    }

    public void addEdge(int from, int to, int cap) {
        graph[from].add(new int[]{to, cap, graph[to].size()});
        graph[to].add(new int[]{from, 0, graph[from].size() - 1});  // Reverse edge
    }

    private boolean bfs(int s, int t) {
        Arrays.fill(level, -1);
        Queue<Integer> q = new LinkedList<>();
        level[s] = 0;
        q.offer(s);

        while (!q.isEmpty()) {
            int v = q.poll();
            for (int[] e : graph[v]) {
                if (e[1] > 0 && level[e[0]] < 0) {
                    level[e[0]] = level[v] + 1;
                    q.offer(e[0]);
                }
            }
        }
        return level[t] >= 0;
    }

    private int dfs(int v, int t, int f) {
        if (v == t) return f;

        for (; iter[v] < graph[v].size(); iter[v]++) {
            int[] e = graph[v].get(iter[v]);
            if (e[1] > 0 && level[v] < level[e[0]]) {
                int d = dfs(e[0], t, Math.min(f, e[1]));
                if (d > 0) {
                    e[1] -= d;
                    graph[e[0]].get(e[2])[1] += d;
                    return d;
                }
            }
        }
        return 0;
    }

    public int maxFlow(int s, int t) {
        int flow = 0;
        while (bfs(s, t)) {
            Arrays.fill(iter, 0);
            int f;
            while ((f = dfs(s, t, Integer.MAX_VALUE)) > 0) {
                flow += f;
            }
        }
        return flow;
    }
}

// APPLICATIONS OF MAX FLOW:
// 1. Bipartite Matching: Add source to left, sink to right, unit capacities
// 2. Min Cut: Run max flow, find reachable vertices from source in residual
// 3. Maximum Edge-Disjoint Paths: Unit capacities, max flow = # paths
// 4. Circulation with Demands: Add super-source and super-sink
```

🔬 **Section Challenge — 🌐 Network Flow Algorithms**

**Challenge 1 (Reasoning):** Two-pointer pattern reduces O(N²) brute force to O(N). What is the KEY invariant that makes this safe?

<details><summary>Answer</summary>

The invariant: all pairs we SKIP are guaranteed to not contain the answer. In 3Sum: once we fix `nums[i]` and use l/r pointers, we can safely skip because the array is sorted. If `sum > 0`: decreasing r decreases the sum (smaller right value). If `sum < 0`: increasing l increases the sum (larger left value). We never skip a valid pair because monotonicity guarantees it.

</details>

## 📌 Computational Geometry Basics

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ COMPUTATIONAL GEOMETRY - ESSENTIAL ALGORITHMS                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

```java
// CONVEX HULL - Graham Scan O(n log n)
public List<int[]> convexHull(int[][] points) {
    int n = points.length;
    if (n < 3) return Arrays.asList(points);

    // Find bottom-most point (or left-most if tie)
    int minIdx = 0;
    for (int i = 1; i < n; i++) {
        if (points[i][1] < points[minIdx][1] ||
            (points[i][1] == points[minIdx][1] && points[i][0] < points[minIdx][0])) {
            minIdx = i;
        }
    }
    swap(points, 0, minIdx);
    int[] pivot = points[0];

    // Sort by polar angle with pivot
    Arrays.sort(points, 1, n, (a, b) -> {
        int cross = crossProduct(pivot, a, b);
        if (cross == 0) {  // Collinear
            return distance(pivot, a) - distance(pivot, b);
        }
        return -cross;  // Counter-clockwise order
    });

    // Build hull
    List<int[]> hull = new ArrayList<>();
    for (int[] p : points) {
        while (hull.size() > 1 &&
               crossProduct(hull.get(hull.size()-2), hull.get(hull.size()-1), p) <= 0) {
            hull.remove(hull.size() - 1);
        }
        hull.add(p);
    }
    return hull;
}

// Cross product: (b-a) × (c-a)
// > 0: counter-clockwise, < 0: clockwise, = 0: collinear
int crossProduct(int[] a, int[] b, int[] c) {
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

// LINE SEGMENT INTERSECTION
boolean intersects(int[] p1, int[] p2, int[] p3, int[] p4) {
    int d1 = direction(p3, p4, p1);
    int d2 = direction(p3, p4, p2);
    int d3 = direction(p1, p2, p3);
    int d4 = direction(p1, p2, p4);

    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
        ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
        return true;
    }

    // Collinear cases
    if (d1 == 0 && onSegment(p3, p4, p1)) return true;
    if (d2 == 0 && onSegment(p3, p4, p2)) return true;
    if (d3 == 0 && onSegment(p1, p2, p3)) return true;
    if (d4 == 0 && onSegment(p1, p2, p4)) return true;

    return false;
}

int direction(int[] a, int[] b, int[] c) {
    return (c[0] - a[0]) * (b[1] - a[1]) - (b[0] - a[0]) * (c[1] - a[1]);
}

boolean onSegment(int[] a, int[] b, int[] c) {
    return Math.min(a[0], b[0]) <= c[0] && c[0] <= Math.max(a[0], b[0]) &&
           Math.min(a[1], b[1]) <= c[1] && c[1] <= Math.max(a[1], b[1]);
}

// CLOSEST PAIR OF POINTS - O(n log n)
// Divide and conquer: split, solve recursively, merge considering strip
```

## 📋 Algorithm Design Paradigms — Summary

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE WHICH PARADIGM                                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ DIVIDE AND CONQUER:                                                             │
│ • Problem can be split into independent subproblems                             │
│ • Subproblems are similar to original                                           │
│ • Examples: Merge Sort, Quick Sort, Binary Search, Strassen's Matrix            │
│                                                                                 │
│ DYNAMIC PROGRAMMING:                                                            │
│ • Optimal substructure: optimal solution uses optimal subsolutions              │
│ • Overlapping subproblems: same subproblems solved multiple times               │
│ • Examples: Fibonacci, Knapsack, LCS, Edit Distance, Matrix Chain               │
│                                                                                 │
│ GREEDY:                                                                         │
│ • Local optimal choice leads to global optimal                                  │
│ • No need to reconsider past choices                                            │
│ • Examples: Huffman, Activity Selection, Dijkstra, MST (Prim, Kruskal)          │
│                                                                                 │
│ BACKTRACKING:                                                                   │
│ • Find all (or some) solutions                                                  │
│ • Build solution incrementally, abandon if invalid                              │
│ • Examples: N-Queens, Sudoku, Subset Sum, Permutations                          │
│                                                                                 │
│ BRANCH AND BOUND:                                                               │
│ • Optimization problems                                                         │
│ • Use bounds to prune search space                                              │
│ • Examples: TSP, Integer Linear Programming, 0/1 Knapsack                       │
│                                                                                 │
│                                                                                 │
│ COMPLEXITY CHEAT SHEET:                                                         │
│ ┌──────────────────────┬────────────────────────────────────────────────────┐   │
│ │ If you see... │ Think about... │                                              │
│ ├──────────────────────┼────────────────────────────────────────────────────┤   │
│ │ Sorted array │ Binary search O(log n) │                                       │
│ │ Find all subsets │ 2^n solutions (exponential) │                              │
│ │ Find all permutations│ n! solutions (factorial) │                             │
│ │ Shortest path │ BFS (unweighted), Dijkstra (weighted) │                       │
│ │ Connected components │ DFS/BFS/Union-Find │                                   │
│ │ Optimal order │ DP on intervals │                                             │
│ │ Maximum/Minimum │ DP, Greedy, or Binary search on answer │                    │
│ │ Graph with cycles │ May need to detect or handle cycles │                     │
│ │ String matching │ KMP, Z-algorithm, Rolling hash │                            │
│ │ Range queries │ Segment Tree, Fenwick Tree │                                  │
│ │ Multiple patterns │ Trie, Aho-Corasick │                                      │
│ └──────────────────────┴────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

_Master these algorithms to understand the foundations of computer science!_ 🎯

---

**Prev**: [Part A: Core Algorithm Techniques](06a_Greedy_BitManip.md)

---

# 💪 Curated Practice Problems — Advanced Algorithms

**HOW TO USE**: These are harder problems covering greedy, bit manipulation, string algorithms, and competitive patterns.
Attempt only after mastering the fundamentals in earlier chapters.

---

## Section 1: Greedy Algorithms

| #   | Problem                            | Platform | Difficulty | Key Technique                         |
| --- | ---------------------------------- | -------- | ---------- | ------------------------------------- |
| 1   | Jump Game (LC 55)                  | LeetCode | Medium     | Track farthest reachable              |
| 2   | Jump Game II (LC 45)               | LeetCode | Medium     | Greedy BFS-style levels               |
| 3   | Gas Station (LC 134)               | LeetCode | Medium     | If total >= 0, solution exists        |
| 4   | Task Scheduler (LC 621)            | LeetCode | Medium     | Most frequent first + idle slots      |
| 5   | Non-overlapping Intervals (LC 435) | LeetCode | Medium     | Sort by end, count kept               |
| 6   | Merge Intervals (LC 56)            | LeetCode | Medium     | Sort by start, merge overlapping      |
| 7   | Meeting Rooms II (LC 253)          | LeetCode | Medium     | Min heap for end times                |
| 8   | Partition Labels (LC 763)          | LeetCode | Medium     | Last occurrence of each char          |
| 9   | Minimum Number of Arrows (LC 452)  | LeetCode | Medium     | Interval scheduling                   |
| 10  | Candy (LC 135)                     | LeetCode | Hard       | Two-pass left-to-right, right-to-left |

---

🔬 **Section Challenge — Section 1: Greedy Algorithms**

**Challenge 1 (Reasoning):** Interval scheduling: select maximum number of non-overlapping intervals. Why does sorting by END time work, not by START time or duration?

<details><summary>Answer</summary>

Sorting by end time: greedily picking the interval that ends earliest leaves maximum time for future intervals. Formal proof (exchange argument): suppose optimal solution picks interval A instead of interval B (B ends earlier). We can swap A for B without losing any other interval (B ends ≤ A ends, so anything compatible with A is also compatible with B). Sorting by start time fails: a very long interval starting early would block many shorter intervals. Sorting by duration fails: a short interval might overlap two others.

</details>

## Section 2: Bit Manipulation

| #   | Problem                                           | Platform | Difficulty | Key Technique                 |
| --- | ------------------------------------------------- | -------- | ---------- | ----------------------------- |
| 1   | Single Number (LC 136)                            | LeetCode | Easy       | XOR all elements              |
| 2   | Number of 1 Bits (LC 191)                         | LeetCode | Easy       | n & (n-1) clears last set bit |
| 3   | Counting Bits (LC 338)                            | LeetCode | Easy       | dp[i] = dp[i>>1] + (i&1)      |
| 4   | Missing Number (LC 268)                           | LeetCode | Easy       | XOR with indices              |
| 5   | Reverse Bits (LC 190)                             | LeetCode | Easy       | Shift and build result        |
| 6   | Single Number II (LC 137)                         | LeetCode | Medium     | Count bits mod 3              |
| 7   | Single Number III (LC 260)                        | LeetCode | Medium     | XOR + rightmost set bit split |
| 8   | Subsets (LC 78)                                   | LeetCode | Medium     | Bitmask 0 to 2^n-1            |
| 9   | Maximum XOR of Two Numbers (LC 421)               | LeetCode | Medium     | Trie on binary representation |
| 10  | Minimum Flips to Make a OR b Equal to c (LC 1318) | LeetCode | Medium     | Bit-by-bit analysis           |

---

## Section 3: String Algorithms

| #   | Problem                                  | Platform | Difficulty | Key Technique                    |
| --- | ---------------------------------------- | -------- | ---------- | -------------------------------- |
| 1   | Longest Common Prefix (LC 14)            | LeetCode | Easy       | Vertical scan or binary search   |
| 2   | Implement strStr() / KMP (LC 28)         | LeetCode | Easy       | KMP failure function             |
| 3   | Longest Palindromic Substring (LC 5)     | LeetCode | Medium     | Expand around center or Manacher |
| 4   | Longest Palindromic Subsequence (LC 516) | LeetCode | Medium     | 2D DP                            |
| 5   | Edit Distance (LC 72)                    | LeetCode | Medium     | Classic 2D DP                    |
| 6   | Wildcard Matching (LC 44)                | LeetCode | Hard       | DP or greedy with backtrack      |
| 7   | Regular Expression Matching (LC 10)      | LeetCode | Hard       | DP with \* handling              |
| 8   | Shortest Palindrome (LC 214)             | LeetCode | Hard       | KMP on s + "#" + reverse(s)      |
| 9   | Repeated Substring Pattern (LC 459)      | LeetCode | Easy       | KMP failure function insight     |
| 10  | Minimum Window Substring (LC 76)         | LeetCode | Hard       | Sliding window + freq map        |

---

## HIDDEN GEMS — Advanced

| #   | Problem                                  | Platform | Why It's Valuable                        |
| --- | ---------------------------------------- | -------- | ---------------------------------------- |
| 1   | Maximum Product of Word Lengths (LC 318) | LeetCode | Bitmask for character sets               |
| 2   | Wiggle Sort II (LC 324)                  | LeetCode | Median + 3-way partition                 |
| 3   | Queue Reconstruction by Height (LC 406)  | LeetCode | Sort desc height, insert by k            |
| 4   | UTF-8 Validation (LC 393)                | LeetCode | Bit manipulation for encoding            |
| 5   | Gray Code (LC 89)                        | LeetCode | i XOR (i &gt;&gt; 1) elegant bit pattern |
| 6   | Circular Array Loop (LC 457)             | LeetCode | Slow/fast pointer on circular            |

### Topical Breadth — Advanced Pattern Selection Trade-offs

The advanced patterns in this chapter each exploit a different constraint boundary, and the selection hinges on whether the problem is static or dynamic, online or offline. **Meet-in-the-Middle** reduces O(2^n) to O(2^(n/2) * n) by splitting the set and enumerating both halves — the trade-off is it requires O(2^(n/2)) space and works only when you can enumerate all partial solutions cleanly; the practical threshold is n <= 30 where 2^30 is too large for brute force but 2^15 is manageable. **Sqrt Decomposition** answers range queries in O(sqrt(n)) by dividing the array into blocks — the trade-off versus segment tree is that sqrt decomposition is simpler to implement and faster for static arrays with O(1) point updates, but degrades to O(sqrt(n)) per query where segment tree gives O(log n). **Mo's Algorithm** answers offline range queries in O((n+q)*sqrt(n)) on static arrays — the trade-off is it requires the array to be static (no updates) and needs block size tuning; it outperforms segment tree when you have many queries (q >> n) on read-only data. **Heavy-Light Decomposition (HLD)** enables O(log^2 n) path queries on trees by decomposing into O(log n) heavy paths — the trade-off versus Euler tour with BIT is that HLD handles both path and subtree queries efficiently, while Euler tour + BIT is O(log n) for subtree but O(n) for arbitrary paths; use HLD when the problem mixes path aggregates with point updates. **Wavelet Tree** answers static range k-th order statistics in O(log sigma) where sigma is alphabet size — the trade-off versus segment tree is that wavelet tree handles static arrays with range k-th/min/max queries elegantly but cannot handle updates; use wavelet tree when the array never changes and you need median/k-th frequently.

| Pattern                   | Time per Query    | Update             | Space          | When to Prefer                              |
| ------------------------- | ----------------- | ------------------ | -------------- | ------------------------------------------- |
| Meet-in-the-Middle        | O(2^(n/2))        | N/A                | O(2^(n/2))     | n <= 30, subset sum, TSP small n            |
| Sqrt Decomposition        | O(sqrt(n))        | O(1)               | O(n)           | Static queries, simple updates, low q       |
| Mo's Algorithm            | O((n+q)\*sqrt(n)) | None (static only) | O(n)           | Many offline range queries, read-only array |
| Heavy-Light Decomposition | O(log^2 n)        | O(log^2 n)         | O(n)           | Path queries + point updates on trees       |
| Wavelet Tree              | O(log sigma)      | None (static only) | O(n log sigma) | Static range k-th order, median queries     |

Select **Meet-in-the-Middle** when n is between 20-30 and the problem is a subset or partition problem. Select **Sqrt Decomposition** as the simplest offline range query structure before reaching for segment tree. Select **Mo's** when you have hundreds of range queries on a static array. Select **HLD** when the problem explicitly asks for path aggregates on a tree. Default to **Segment Tree** for dynamic range queries with updates.


---

## Proof Corner -- Sqrt Decomposition O(sqrt(n)) per Query

**Claim**: With sqrt decomposition, each range-sum query over [l, r] costs O(sqrt(n)) time.

**Setup**: Partition array A[0..n-1] into blocks of size B = sqrt(n). Precompute block sums B[k] = sum of A[k*B..(k+1)*B-1].

**Query[l, r]**: Three parts:
1. Left partial block: sum A[l..end of its block] -- at most B-1 elements.
2. Complete middle blocks: sum B[k] for whole blocks inside [l,r] -- at most n/B blocks.
3. Right partial block: sum A[start of last partial block..r] -- at most B-1 elements.

**Total work**: O(B) + O(n/B) + O(B) = O(B + n/B).

**Optimal B**: Minimise B + n/B. By AM-GM, B + n/B >= 2*sqrt(n), achieved when B = sqrt(n).

**Therefore**: Each query costs O(sqrt(n)). Preprocessing O(n). n queries total: O(n + n*sqrt(n)) = O(n*sqrt(n)). QED.

---

## When It Breaks -- Algorithm Patterns

**1. Mo's algorithm on dynamic arrays** -- Mo's algorithm requires a STATIC array (no updates). If the problem has point updates, you need Mo's with updates (3D sorting) which is O(n^(5/3)). Applying standard Mo's with updates gives wrong answers silently.

**2. Meet-in-the-Middle for n > 30** -- MitM halves the search space from 2^n to 2*2^(n/2). For n=40, 2^20 = 1M (fine). For n=60, 2^30 = 1B (too slow). Always compute 2^(n/2) from the problem's n before choosing MitM.

**3. HLD with wrong DFS entry order** -- Heavy-Light Decomposition requires the DFS to visit the heavy child first to guarantee each heavy chain occupies a contiguous segment tree range. Visiting light children first breaks the contiguity invariant: the chain segment tree range becomes non-contiguous, and path queries give wrong results.

**4. Wavelet tree on mutable arrays** -- wavelet trees are static-only (built once). For range k-th queries with updates, you need persistent segment trees or sqrt decomposition. Wavelet tree on a modified array gives stale/wrong answers.

---

## Reference Anchor

**No standard JDK implementations** for sqrt decomp, Mo's, or HLD -- these are competitive programming patterns. Reference implementations:

```java
// Sqrt Decomposition -- range sum with point update:
int[] arr = new int[n];
int B = (int) Math.sqrt(n);
int[] block = new int[(n + B - 1) / B];
// Build: for (int i = 0; i < n; i++) block[i/B] += arr[i];
// Update(i, val): block[i/B] += val - arr[i]; arr[i] = val;
// Query(l, r): sum partial left + sum complete blocks + sum partial right

// Segment tree -- standard pattern in Java:
int[] tree = new int[4 * n];
void build(int node, int l, int r) {
    if (l == r) { tree[node] = arr[l]; return; }
    int mid = (l + r) / 2;
    build(2*node, l, mid); build(2*node+1, mid+1, r);
    tree[node] = tree[2*node] + tree[2*node+1];
}
int query(int node, int l, int r, int ql, int qr) {
    if (ql > r || qr < l) return 0; // identity for sum
    if (ql <= l && r <= qr) return tree[node];
    int mid = (l + r) / 2;
    return query(2*node, l, mid, ql, qr) + query(2*node+1, mid+1, r, ql, qr);
}
// Key: tree[node] covers [l,r]. Children cover [l,mid] and [mid+1,r]. 4*n space for safety.
```


---

## Reality Check

**"Learning more algorithms is better than mastering patterns"** → Knowing 50 algorithms at surface level is less useful than deeply understanding 10 patterns that each apply to dozens of problems. Sliding window, two pointers, binary search on answer, BFS/DFS, dynamic programming, and greedy cover 80 percent of algorithmic problems. Recognizing WHICH pattern applies to a new problem is the skill that transfers.

**"Pattern recognition is about memorizing problem-solution mappings"** → Pattern recognition is about identifying the STRUCTURAL similarity between a new problem and known patterns. A problem asking for the longest substring with at most k distinct characters maps to sliding window, not because you memorized that specific problem, but because you recognize the constraint of maintaining a window property while maximizing window size.

**"Each problem has exactly one correct pattern"** → Many problems can be solved with multiple patterns: finding the kth largest element can use sorting (O(n log n)), a max-heap of size k (O(n log k)), or quickselect (O(n) average). The optimal choice depends on constraints: quickselect for one-time queries, a heap for streaming data where new elements arrive continuously.

**"Dynamic programming is the hardest pattern"** → DP difficulty comes from two separate skills: identifying that a problem has overlapping subproblems (pattern recognition) and defining the recurrence relation (mathematical modeling). Many developers who struggle with DP can solve the same problems with memoized recursion (top-down DP), which requires only recognizing the recursive structure and adding a cache. Bottom-up DP is an optimization of top-down, not a prerequisite.

**"Two pointers is a simple pattern"** → Two pointers has multiple variants: converging pointers (sorted array sum pairs), slow-fast pointers (cycle detection, middle of linked list), sliding window (variable-size subarray), and partition pointers (Dutch national flag problem). Each variant has different invariants and termination conditions. Treating all two-pointer problems as the same pattern leads to incorrect solutions.
