# Advanced Techniques <a name="advanced"></a>

> **Navigation**: [← Graph Problems](03_graph_problems.md) | [Chapter overview](../14_Union_Find_DSU_Complete.md) | [Interview Problems →](05_interview_problems.md)
> Page 4 of 5 in **Union-Find / Disjoint Set Union (DSU) Complete Guide**


## Weighted Union-Find

```java
/*
Track relationship/distance from node to its root.
Used in problems like "Evaluate Division".
*/

class WeightedUnionFind {
    private int[] parent;
    private double[] weight;  // weight[i] = relationship from i to parent[i]

    public WeightedUnionFind(int n) {
        parent = new int[n];
        weight = new double[n];
        for (int i = 0; i < n; i++) {
            parent[i] = i;
            weight[i] = 1.0;
        }
    }

    public int find(int x) {
        if (parent[x] != x) {
            int root = find(parent[x]);
            weight[x] *= weight[parent[x]];  // Update weight to root
            parent[x] = root;
        }
        return parent[x];
    }

    public void union(int x, int y, double value) {
        // value = x / y
        int rootX = find(x);
        int rootY = find(y);

        if (rootX == rootY) return;

        // value = x/y = (weight[x] * rootX) / (weight[y] * rootY)
        // So: rootX = weight[y] * value / weight[x] * rootY
        parent[rootX] = rootY;
        weight[rootX] = weight[y] * value / weight[x];
    }

    public double query(int x, int y) {
        if (find(x) != find(y)) return -1.0;
        return weight[x] / weight[y];
    }
}
```

## Evaluate Division (LeetCode 399)

```java
public double[] calcEquation(List<List<String>> equations,
                              double[] values,
                              List<List<String>> queries) {

    // Map string to integer ID
    Map<String, Integer> varToId = new HashMap<>();
    int id = 0;

    for (List<String> eq : equations) {
        if (!varToId.containsKey(eq.get(0))) varToId.put(eq.get(0), id++);
        if (!varToId.containsKey(eq.get(1))) varToId.put(eq.get(1), id++);
    }

    WeightedUnionFind uf = new WeightedUnionFind(id);

    // Process equations
    for (int i = 0; i < equations.size(); i++) {
        int x = varToId.get(equations.get(i).get(0));
        int y = varToId.get(equations.get(i).get(1));
        uf.union(x, y, values[i]);
    }

    // Answer queries
    double[] result = new double[queries.size()];
    for (int i = 0; i < queries.size(); i++) {
        String a = queries.get(i).get(0);
        String b = queries.get(i).get(1);

        if (!varToId.containsKey(a) || !varToId.containsKey(b)) {
            result[i] = -1.0;
        } else {
            result[i] = uf.query(varToId.get(a), varToId.get(b));
        }
    }

    return result;
}
```

## Union-Find with Undo (for offline processing)

```java
/*
Union-Find that supports undo operations.
Used in persistent data structures or offline queries.
NOTE: Cannot use path compression with undo!
*/

class UnionFindWithUndo {
    private int[] parent;
    private int[] rank;
    private Deque<int[]> history;  // Stack of [x, oldParent, oldRank]

    public UnionFindWithUndo(int n) {
        parent = new int[n];
        rank = new int[n];
        history = new ArrayDeque<>();

        for (int i = 0; i < n; i++) {
            parent[i] = i;
            rank[i] = 0;
        }
    }

    // Find WITHOUT path compression
    public int find(int x) {
        while (parent[x] != x) {
            x = parent[x];
        }
        return x;
    }

    public void union(int x, int y) {
        int rootX = find(x);
        int rootY = find(y);

        if (rootX == rootY) {
            history.push(new int[]{-1, -1, -1});  // No-op marker
            return;
        }

        // Union by rank, record old state
        if (rank[rootX] < rank[rootY]) {
            history.push(new int[]{rootX, parent[rootX], rank[rootX]});
            parent[rootX] = rootY;
        } else if (rank[rootX] > rank[rootY]) {
            history.push(new int[]{rootY, parent[rootY], rank[rootY]});
            parent[rootY] = rootX;
        } else {
            history.push(new int[]{rootY, parent[rootY], rank[rootY]});
            parent[rootY] = rootX;
            rank[rootX]++;
        }
    }

    public void undo() {
        int[] op = history.pop();
        if (op[0] != -1) {
            parent[op[0]] = op[1];
            rank[op[0]] = op[2];
        }
    }
}
```

---

[← Graph Problems](03_graph_problems.md) | [Chapter overview](../14_Union_Find_DSU_Complete.md) | [Interview Problems →](05_interview_problems.md)
