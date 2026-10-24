# Topological Sort Problems

> **Navigation**: [← Union-Find Problems](27_Union_Find_Problems.md) | [Chapter index](00_INDEX.md) | [Heap →](16_Heap.md)

---

## 🔗 Bridge — Where This Chapter Fits

| Dimension | This chapter |
| --- | --- |
| **Builds on** | [Topological Sort pattern](../04_Patterns_Templates/28_Topological_Sort_Pattern.md), [Graphs](10_Graphs.md) |
| **You will learn** | Course scheduling, alien dictionaries, layered scheduling, minimum height trees by leaf trimming and longest paths in a DAG |
| **Leads to** | [Dynamic Programming](11_Dynamic_Programming.md) (DP over a DAG), [Shortest Path problems](31_Shortest_Path_Problems.md) |
| **Abstraction level** | Rules of the form "A before B" → **a linear order or a proof none exists** |

> [!NOTE]
> The full gap-free reading order and dependency graph are in the [Learning Path](00_LEARNING_PATH.md).

---

## 💬 Explain It Like a Study Partner — Topological Sort Problems

### 1. The bottom line

Repeatedly do whatever has no unmet prerequisites; if you get stuck, there is a cycle.

### 2. The textbook core

- Build edges from prerequisite to dependent and count in-degrees.
- Kahn: queue the zeros, pop, decrement neighbours.
- Output shorter than `n` ⇒ cycle.
- Process the queue level by level to count rounds (semesters).
- On a DAG, longest/shortest paths are one pass in topological order.

### 3. The real-world analogy

**Getting dressed**: socks before shoes.

### 4. Walkthrough

1. Edges `0→1, 0→2, 1→3, 2→3`.
2. In-degrees `[0,1,1,2]`.
3. Pop 0 → queue 1, 2; pop 1; pop 2 → queue 3.
4. Order `[0,1,2,3]`.

> [!NOTE]
> **Quick check:** How does Kahn's algorithm detect a cycle? *Fewer than `n` nodes are output.*


### 5. Check yourself

**Q1.** Can 3 courses be finished with prerequisites `[[1,0],[2,1]]`?

<details><summary>Answer</summary>

Yes: 0 → 1 → 2 has no cycle.

</details>

**Q2.** Alien dictionary for the sorted words `["z","x"]`?

<details><summary>Answer</summary>

`"zx"`: the first differing letters give `z` before `x`.

</details>

---

## 🗺️ Pattern Recognition Header

| Signal in the problem | Technique |
| --- | --- |
| "can all courses be finished?" | Cycle detection |
| "order the courses / tasks" | Topological order |
| "order of letters from sorted words" | Edges from first differing letters |
| "minimum number of rounds" | Layered Kahn |
| "roots of minimum-height trees" | Trim leaves layer by layer |
| "longest path in a DAG" | Topological order + DP |

> [!TIP]
> Rewrite the statement as edges before coding: "to take B you must first take A" is the edge `A → B`.

---

## Problem 1 — Course Schedule

**Task.** Given `n` courses and prerequisite pairs `[course, prerequisite]`, can all courses be finished?

**Brute force.** Search for a cycle from every node: `O(V(V+E))`.

**Better idea.** Run Kahn's algorithm on prerequisite → course edges; finishing all nodes means no cycle.

```java
static List<Integer> topo(int n, int[][] edges) {
    List<List<Integer>> g = new ArrayList<>();
    int[] in = new int[n];
    for (int i = 0; i < n; i++) g.add(new ArrayList<>());
    for (int[] e : edges) {
        g.get(e[0]).add(e[1]);
        in[e[1]]++;
    }
    ArrayDeque<Integer> q = new ArrayDeque<>();
    for (int i = 0; i < n; i++) if (in[i] == 0) q.add(i);
    List<Integer> o = new ArrayList<>();
    while (!q.isEmpty()) {
        int u = q.poll();
        o.add(u);
        for (int v : g.get(u)) if (--in[v] == 0) q.add(v);
    }
    return o.size() == n ? o : null;
}

static boolean canFinish(int n, int[][] prereq) {
    int[][] e = new int[prereq.length][];
    for (int i = 0; i < e.length; i++) e[i] = new int[]{prereq[i][1], prereq[i][0]};
    return topo(n, e) != null;
}
```

**Example.** `n = 2`, `[[1,0]]` → `true`; `[[1,0],[0,1]]` → `false`.

**Complexity.** `O(V + E)`.


## Problem 2 — Alien Dictionary

**Task.** Words are sorted in an unknown alphabet. Recover a valid letter order (or report none).

**Brute force.** Try all letter orders: factorial.

**Better idea.** The first differing letters of adjacent words give edges; topologically sort the letters. Watch the invalid case where a longer word precedes its own prefix.

```java
static String alienOrder(String[] words) {
    Map<Character, Set<Character>> g = new LinkedHashMap<>();
    Map<Character, Integer> in = new LinkedHashMap<>();
    for (String w : words) for (char c : w.toCharArray()) {
        g.putIfAbsent(c, new LinkedHashSet<>());
        in.putIfAbsent(c, 0);
    }
    for (int i = 0; i + 1 < words.length; i++) {
        String a = words[i], b = words[i + 1];
        int m = Math.min(a.length(), b.length());
        int k = 0;
        while (k < m && a.charAt(k) == b.charAt(k)) k++;
        if (k == m) {
            if (a.length() > b.length()) return "";
            continue;
        }
        if (g.get(a.charAt(k)).add(b.charAt(k))) in.merge(b.charAt(k), 1, Integer::sum);
    }
    ArrayDeque<Character> q = new ArrayDeque<>();
    for (var e : in.entrySet()) if (e.getValue() == 0) q.add(e.getKey());
    StringBuilder sb = new StringBuilder();
    while (!q.isEmpty()) {
        char c = q.poll();
        sb.append(c);
        for (char d : g.get(c)) if (in.merge(d, -1, Integer::sum) == 0) q.add(d);
    }
    return sb.length() == in.size() ? sb.toString() : "";
}
```

**Example.** `["wrt","wrf","er","ett","rftt"]` → `"wertf"`.

**Complexity.** `O(total characters)`.


## Problem 3 — Parallel Courses

**Task.** You can take any number of courses per semester if their prerequisites are done in earlier semesters. What is the minimum number of semesters?

**Brute force.** Simulate every choice: exponential.

**Better idea.** Layered Kahn: each queue layer is one semester.

```java
static int minSemesters(int n, int[][] rel) {
    List<List<Integer>> g = new ArrayList<>();
    int[] in = new int[n + 1];
    for (int i = 0; i <= n; i++) g.add(new ArrayList<>());
    for (int[] r : rel) {
        g.get(r[0]).add(r[1]);
        in[r[1]]++;
    }
    ArrayDeque<Integer> q = new ArrayDeque<>();
    for (int i = 1; i <= n; i++) if (in[i] == 0) q.add(i);
    int sem = 0, done = 0;
    while (!q.isEmpty()) {
        sem++;
        for (int k = q.size(); k > 0; k--) {
            int u = q.poll();
            done++;
            for (int v : g.get(u)) if (--in[v] == 0) q.add(v);
        }
    }
    return done == n ? sem : -1;
}
```

**Example.** `n = 3`, `[[1,3],[2,3]]` → `2`.

**Complexity.** `O(V + E)`.


## Problem 4 — Minimum Height Trees

**Task.** For a tree, which roots give the minimum height?

**Brute force.** BFS from every node: `O(n²)`.

**Better idea.** Repeatedly remove all leaves; the last one or two nodes are the roots.

```java
static List<Integer> minHeightTrees(int n, int[][] edges) {
    if (n == 1) return List.of(0);
    List<Set<Integer>> g = new ArrayList<>();
    for (int i = 0; i < n; i++) g.add(new HashSet<>());
    for (int[] e : edges) {
        g.get(e[0]).add(e[1]);
        g.get(e[1]).add(e[0]);
    }
    List<Integer> leaves = new ArrayList<>();
    for (int i = 0; i < n; i++) if (g.get(i).size() == 1) leaves.add(i);
    int rem = n;
    while (rem > 2) {
        rem -= leaves.size();
        List<Integer> nl = new ArrayList<>();
        for (int l : leaves) {
            int nb = g.get(l).iterator().next();
            g.get(nb).remove(l);
            if (g.get(nb).size() == 1) nl.add(nb);
        }
        leaves = nl;
    }
    Collections.sort(leaves);
    return leaves;
}
```

**Example.** `n = 6`, `[[3,0],[3,1],[3,2],[3,4],[5,4]]` → `[3,4]`.

**Complexity.** `O(n)`.


## Problem 5 — Longest Path in a DAG

**Task.** Find the number of edges on the longest path in a directed acyclic graph.

**Brute force.** Explore all paths: exponential.

**Better idea.** Process nodes in topological order and relax `dp[v] = max(dp[v], dp[u] + 1)`.

```java
static int longestPathDag(int n, int[][] edges) {
    List<Integer> order = topo(n, edges);
    int[] dp = new int[n];
    List<List<Integer>> g = new ArrayList<>();
    for (int i = 0; i < n; i++) g.add(new ArrayList<>());
    for (int[] e : edges) g.get(e[0]).add(e[1]);
    int best = 0;
    for (int u : order) {
        best = Math.max(best, dp[u]);
        for (int v : g.get(u)) dp[v] = Math.max(dp[v], dp[u] + 1);
    }
    return best;
}
```

**Example.** Edges `0→1,1→2,0→3,3→2,2→4` → `3`.

**Complexity.** `O(V + E)`.

---

## 🏢 Enterprise Lens — Topological Sort Problems

| Area | What top-tier engineering looks like |
| ---- | ------------------------------------ |
| **Where it runs in production** | Build systems, package managers, workflow engines, spreadsheet recalculation |
| **Failure modes** | Edge direction reversed; duplicate edges counted twice; assuming the order is unique |
| **Testing and verification** | Compare with a transitive-closure cycle check and verify every edge goes forward in the produced order (1 500 random graphs here); minimum height trees checked against all-roots BFS |

---

## Reality Check

> [!CAUTION]
> "Topological sort is only for course schedules." It is the tool for any dependency order, and the order unlocks one-pass DP on DAGs.

---

[← Prefix Sum Problems](28_Prefix_Sum_Problems.md) | [Index](00_INDEX.md) | [Trie Problems →](30_Trie_Problems.md)
