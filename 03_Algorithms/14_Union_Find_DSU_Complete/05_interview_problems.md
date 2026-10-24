# Interview Problems <a name="interview-problems"></a>

> **Navigation**: [← Advanced Techniques](04_advanced_techniques.md) | [Chapter overview](../14_Union_Find_DSU_Complete.md)
> Page 5 of 5 in **Union-Find / Disjoint Set Union (DSU) Complete Guide**


## Problem Categories

**UNION-FIND PROBLEM TYPES**

```text
CONNECTED COMPONENTS:
• Number of Connected Components
• Number of Provinces
• Making a Large Island

CYCLE DETECTION:
• Redundant Connection I/II
• Graph Valid Tree

DYNAMIC CONNECTIVITY:
• Number of Islands II
• Accounts Merge
• Longest Consecutive Sequence

MST/GRAPH OPTIMIZATION:
• Minimum Cost to Connect All Points
• Connecting Cities With Minimum Cost

WEIGHTED/RATIO PROBLEMS:
• Evaluate Division
• Smallest String With Swaps
```

## Longest Consecutive Sequence (LeetCode 128)

```java
/*
Find longest consecutive sequence in unsorted array.
*/

public int longestConsecutive(int[] nums) {
    if (nums.length == 0) return 0;

    Map<Integer, Integer> numToId = new HashMap<>();
    int id = 0;

    // Assign ID to each unique number
    for (int num : nums) {
        if (!numToId.containsKey(num)) {
            numToId.put(num, id++);
        }
    }

    UnionFindBySize uf = new UnionFindBySize(id);

    // Union consecutive numbers
    for (int num : nums) {
        if (numToId.containsKey(num - 1)) {
            uf.union(numToId.get(num), numToId.get(num - 1));
        }
        if (numToId.containsKey(num + 1)) {
            uf.union(numToId.get(num), numToId.get(num + 1));
        }
    }

    // Find max component size
    int maxLen = 1;
    for (int num : nums) {
        maxLen = Math.max(maxLen, uf.getSize(numToId.get(num)));
    }
    return maxLen;
}
```

## Smallest String With Swaps (LeetCode 1202)

```java
/*
Can swap characters at pairs[i] positions any number of times.
Return lexicographically smallest string.
*/

public String smallestStringWithSwaps(String s, List<List<Integer>> pairs) {
    int n = s.length();
    UnionFind uf = new UnionFind(n);

    // Union all swappable positions
    for (List<Integer> pair : pairs) {
        uf.union(pair.get(0), pair.get(1));
    }

    // Group indices by root
    Map<Integer, List<Integer>> groups = new HashMap<>();
    for (int i = 0; i < n; i++) {
        int root = uf.find(i);
        groups.computeIfAbsent(root, k -> new ArrayList<>()).add(i);
    }

    // For each group, sort characters and assign back
    char[] result = new char[n];
    for (List<Integer> indices : groups.values()) {
        // Collect characters in this group
        List<Character> chars = new ArrayList<>();
        for (int idx : indices) {
            chars.add(s.charAt(idx));
        }
        Collections.sort(chars);
        Collections.sort(indices);

        // Assign sorted characters to sorted positions
        for (int i = 0; i < indices.size(); i++) {
            result[indices.get(i)] = chars.get(i);
        }
    }

    return new String(result);
}
```

## Minimum Cost to Connect All Points (LeetCode 1584)

```java
/*
Connect all points with minimum total manhattan distance.
Classic MST problem.
*/

public int minCostConnectPoints(int[][] points) {
    int n = points.length;
    List<int[]> edges = new ArrayList<>();

    // Generate all edges with costs
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            int cost = Math.abs(points[i][0] - points[j][0]) +
                       Math.abs(points[i][1] - points[j][1]);
            edges.add(new int[]{i, j, cost});
        }
    }

    // Sort by cost
    edges.sort((a, b) -> a[2] - b[2]);

    // Kruskal's MST
    UnionFind uf = new UnionFind(n);
    int totalCost = 0;
    int edgesUsed = 0;

    for (int[] edge : edges) {
        if (uf.union(edge[0], edge[1])) {
            totalCost += edge[2];
            edgesUsed++;
            if (edgesUsed == n - 1) break;
        }
    }

    return totalCost;
}
```

## Making A Large Island (LeetCode 827)

```java
/*
Change at most one 0 to 1 to maximize island size.
*/

public int largestIsland(int[][] grid) {
    int n = grid.length;
    UnionFind uf = new UnionFind(n * n);
    int[] size = new int[n * n];

    // Initialize sizes
    for (int i = 0; i < n * n; i++) {
        int r = i / n, c = i % n;
        size[i] = grid[r][c];
    }

    // Union adjacent 1s
    int[][] dirs = {{0, 1}, {1, 0}};
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            if (grid[i][j] == 1) {
                int id = i * n + j;
                for (int[] dir : dirs) {
                    int ni = i + dir[0], nj = j + dir[1];
                    if (ni < n && nj < n && grid[ni][nj] == 1) {
                        uf.union(id, ni * n + nj);
                    }
                }
            }
        }
    }

    // Calculate component sizes
    int[] compSize = new int[n * n];
    for (int i = 0; i < n * n; i++) {
        int root = uf.find(i);
        compSize[root] += size[i];
    }

    // Try flipping each 0
    int maxSize = 0;
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            if (grid[i][j] == 0) {
                Set<Integer> neighbors = new HashSet<>();
                int[][] allDirs = {{0, 1}, {0, -1}, {1, 0}, {-1, 0}};
                for (int[] dir : allDirs) {
                    int ni = i + dir[0], nj = j + dir[1];
                    if (ni >= 0 && ni < n && nj >= 0 && nj < n && grid[ni][nj] == 1) {
                        neighbors.add(uf.find(ni * n + nj));
                    }
                }
                int total = 1;  // The flipped cell
                for (int root : neighbors) {
                    total += compSize[root];
                }
                maxSize = Math.max(maxSize, total);
            } else {
                maxSize = Math.max(maxSize, compSize[uf.find(i * n + j)]);
            }
        }
    }

    return maxSize == 0 ? 1 : maxSize;  // Handle all 0s case
}
```

---

## Quick Reference <a name="quick-reference"></a>

### When to Use Union-Find

**UNION-FIND vs OTHER APPROACHES**

```text
USE UNION-FIND WHEN:
• Need to merge groups dynamically
• Need to query if elements are in same group
• Process edges to build connected components
• Need MST with Kruskal's algorithm

USE DFS/BFS INSTEAD WHEN:
• Need to find actual path between nodes
• Need to process all nodes in component
• Graph is static (not changing)
• Need shortest path

COMPARISON:

Operation          Union-Find    DFS/BFS
─────────────────────────────────────────
Query connected    O(α(n)) ≈ O(1)   O(V+E)
Add edge           O(α(n)) ≈ O(1)   O(1)
Build components   O(E·α(n))         O(V+E)
```

### Code Template (Copy-Paste Ready)

```java
class UnionFind {
    private int[] parent, rank;
    private int count;

    public UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        count = n;
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    public int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);
        return parent[x];
    }

    public boolean union(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return false;
        if (rank[px] < rank[py]) { parent[px] = py; }
        else if (rank[px] > rank[py]) { parent[py] = px; }
        else { parent[py] = px; rank[px]++; }
        count--;
        return true;
    }

    public boolean connected(int x, int y) { return find(x) == find(y); }
    public int getCount() { return count; }
}
```

### Complexity Summary

**UNION-FIND COMPLEXITIES**

```text
OPERATION        NAIVE      PATH COMP   RANK    BOTH
─────────────────────────────────────────────────────────────
Find             O(n)       O(log n)*   O(log n) O(α(n))
Union            O(n)       O(log n)*   O(log n) O(α(n))
Build (m ops)    O(mn)      O(m log n)  O(m log n) O(m·α(n))

* Amortized

Space: O(n) for parent and rank arrays

α(n) = Inverse Ackermann, practically O(1):
α(10^80) = 4  (# of atoms in universe!)
```

---

## Summary

**UNION-FIND - MASTER CHECKLIST**

```text
1. CORE OPERATIONS
   • find(x): Get representative of x's group
   • union(x,y): Merge groups of x and y
   • connected(x,y): Check if same group

2. OPTIMIZATIONS (ALWAYS USE BOTH!)
   • Path Compression: On find, make nodes point to root
   • Union by Rank/Size: Attach smaller tree to larger

3. COMMON PATTERNS
   • Count components: Track count, decrement on union
   • Detect cycles: union() returns false
   • MST: Kruskal's algorithm with sorted edges

4. PROBLEM RECOGNITION
   • "Group", "Connect", "Component"
   • "Same group/set", "Merge", "Union"
   • Dynamic connectivity queries

5. EDGE CASES
   • Self-loops (union(x,x) should be no-op)
   • Already connected elements
   • Empty graph
```

**Pro Tip:** When you see problems involving merging groups, checking connectivity, or building spanning trees, Union-Find should be your first thought!

---


---

## 📎 Reference Anchor

**OpenJDK / Apache Commons — Union-Find in production**
- Apache Commons `UnionFind`: [UnionFind.java](https://github.com/apache/commons-math/blob/master/commons-math-core/src/main/java/org/apache/commons/math4/legacy/graph/spanning/UnionFind.java) — implements path compression and union by rank. **Invariant**: `parent[x] == x` iff x is a root; `rank[x]` is an upper bound on subtree height, never decreased.
- JGraphT `AsUndirectedGraph.getConnectedComponents()` uses Union-Find internally for static connectivity queries.
- **Local rewrite rule**: Use `int[] parent` and `int[] rank` primitive arrays, NOT `HashMap<Integer,Integer>` — the map version has 3–5× overhead per operation from boxing and hash computation.
- **Constraint warning**: Do NOT call `find()` and then immediately check `parent[x] == x` to determine if x is a root — after path compression, `parent[x]` may have been updated but `find()` returns the root. Always compare `find(x) == find(y)`, never compare parents directly.

---

## When Union-Find Breaks

### 1. Calling `union()` Without Path Compression in `find()` — O(n) Degeneration
**What breaks**: Union by rank without path compression keeps trees shallow, but without either optimization, a chain of unions produces a bamboo (linear chain) with O(n) `find()`. Without both optimizations together, worst case is O(log n) not O(α(n)).
**Fix**: Always implement BOTH — path compression in `find()` AND union by rank/size in `union()`.

### 2. Using `parent[x] == x` to Check for Roots After Merging
**What breaks**: After `union(x, y)`, if y becomes the root of x, then `parent[x] = y`. Checking `parent[x] == x` returns false, which you might interpret as "x is not in the set" — but x IS in the set, it's just not a root. The root check is `find(x) == x`, not `parent[x] == x`.

### 3. Forgetting to Initialize All Nodes
**What breaks**: Calling `union(3, 7)` before initializing all nodes 0..n-1 leaves `parent[5]`, `parent[6]`, etc. as 0 (Java default) instead of pointing to themselves. Subsequent `find(5)` follows the chain `5 → 0 → 0` (a loop!) and diverges.
**Fix**: Always `for (int i = 0; i < n; i++) parent[i] = i;` before any `union()` or `find()` calls.

---

## Proof Corner

### Union-Find Amortized O(α(n)) — Sketch

**Claim**: A sequence of m `union` and `find` operations on n elements costs O((m+n)·α(n)) total, where α is the inverse Ackermann function.

**Key ideas**:
1. **Union by rank**: if `rank[x] < rank[y]`, set `parent[x] = y`. Rank never decreases. A tree of rank r has ≥ 2ʳ nodes (proof by induction). Max rank = log₂(n).
2. **Path compression**: `find(x)` makes every node on the path from x to root point directly at the root. Amortizes future `find` costs.
3. **Tarjan's proof (1975)**: Assigns a "potential" to each node based on its rank relationship to its parent. Path compression reduces potential; union increases it by at most 1. The amortized cost per operation is bounded by O(α(n)).

**Practical implication**: For all n ≤ 10⁸⁰ (more atoms than the observable universe), α(n) ≤ 4. So O(α(n)) is effectively O(1) in all real-world usage.

🔬 **Section Challenge — Union-Find**

**Challenge 1 (Analysis — 7 min):** Why does Union-Find with only path compression (no union by rank) have O(log n) amortized cost, but with both optimizations it drops to O(α(n))?

<details><summary>Model Answer</summary>

**Path compression alone**: Compresses paths on `find()`, but without rank, `union()` may always attach higher-ranked trees under lower-ranked ones, creating tall trees. The inverse Ackermann bound requires that both the tree height AND the path compression work together — compression must "see" short paths to be effective.

**Union by rank alone**: Keeps tree height at most log₂(n), so `find()` is O(log n). But compression doesn't happen, so every `find()` takes O(log n) — no amortization.

**Both together**: Union by rank ensures trees stay "structured" (bounded height). Path compression then effectively short-circuits future finds. The combined analysis (Tarjan 1975, Seidel-Sharir 2005) shows the amortized cost is O(α(n)) — below O(log* n) and for all practical n, O(1).

</details>

---

[← Advanced Techniques](04_advanced_techniques.md) | [Chapter overview](../14_Union_Find_DSU_Complete.md)
