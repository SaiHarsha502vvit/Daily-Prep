/**
 * UnionFind.java — Disjoint Set Union (DSU) with path compression + union by rank.
 *
 * Compile: javac UnionFind.java
 * Run:     java UnionFind
 *
 * Operations:
 *   find(x)      — returns representative (root) of x's component. O(α(n)) amortized.
 *   union(x, y)  — merges the two components. O(α(n)) amortized.
 *   connected(x, y) — true iff x and y are in the same component.
 *   count()      — number of connected components.
 *
 * Why O(α(n))?
 *   Path compression (find) makes every node point directly at the root.
 *   Union by rank keeps trees shallow (rank = upper bound on tree height).
 *   Together: amortized O(α(n)) per operation, where α is the inverse Ackermann
 *   function — effectively O(1) for all practical n.
 *
 * Proof Corner reference: A2_Complexity_FirstPrinciples.md (amortized analysis)
 * Cross-domain bridges: 00_CROSS_DOMAIN_BRIDGES.md B05 (network partition + Kruskal MST)
 */
public class UnionFind {

    private final int[] parent;
    private final int[] rank;    // rank = upper bound on subtree height
    private int components;

    public UnionFind(int n) {
        parent = new int[n];
        rank   = new int[n];
        components = n;
        for (int i = 0; i < n; i++) parent[i] = i;  // init: each node is its own root
    }

    /**
     * Find with path compression.
     * Invariant: parent[x] is closer to root after each call (never further).
     */
    public int find(int x) {
        if (parent[x] != x)
            parent[x] = find(parent[x]);  // path compression: flatten the path
        return parent[x];
    }

    /**
     * Union by rank.
     * Attaches smaller-rank tree under larger-rank tree.
     * Returns true if x and y were in different components (merge happened).
     */
    public boolean union(int x, int y) {
        int rx = find(x), ry = find(y);
        if (rx == ry) return false;   // already connected — no merge

        // Merge smaller tree under larger tree
        if (rank[rx] < rank[ry]) {
            parent[rx] = ry;
        } else if (rank[rx] > rank[ry]) {
            parent[ry] = rx;
        } else {
            parent[ry] = rx;
            rank[rx]++;              // equal rank: promote rx, bump its rank
        }
        components--;
        return true;
    }

    public boolean connected(int x, int y) {
        return find(x) == find(y);
    }

    public int count() {
        return components;
    }

    // =========================================================================
    // Application 1 — Kruskal's Minimum Spanning Tree
    //
    // Algorithm:
    //   1. Sort edges by weight (ascending).
    //   2. For each edge (u, v, w): if u and v not yet connected, add edge to MST.
    //   3. Stop when n-1 edges added (MST complete) or all edges tried (forest).
    //
    // Correctness: Exchange argument — if the MST omits the lightest crossing edge
    //   of any cut, we can swap it in without increasing MST weight.
    // Time: O(E log E) for sort + O(E α(V)) for union-find ≈ O(E log E).
    // =========================================================================
    public static int kruskalMST(int n, int[][] edges) {
        // Sort edges by weight
        java.util.Arrays.sort(edges, (a, b) -> a[2] - b[2]);

        UnionFind uf = new UnionFind(n);
        int totalWeight = 0;
        int edgesAdded = 0;

        for (int[] edge : edges) {
            int u = edge[0], v = edge[1], w = edge[2];
            if (uf.union(u, v)) {
                totalWeight += w;
                edgesAdded++;
                if (edgesAdded == n - 1) break;   // MST complete
            }
        }
        return edgesAdded == n - 1 ? totalWeight : -1;  // -1 if disconnected graph
    }

    // =========================================================================
    // Application 2 — Number of connected components in an undirected graph
    // =========================================================================
    public static int countComponents(int n, int[][] edges) {
        UnionFind uf = new UnionFind(n);
        for (int[] e : edges) uf.union(e[0], e[1]);
        return uf.count();
    }

    // =========================================================================
    // Tests
    // =========================================================================
    public static void main(String[] args) {
        testBasicOps();
        testKruskal();
        testConnectedComponents();
        testPathCompression();
        System.out.println("All UnionFind tests PASSED ✓");
    }

    private static void testBasicOps() {
        UnionFind uf = new UnionFind(5);  // nodes 0..4
        assert uf.count() == 5 : "initial: 5 components";
        assert !uf.connected(0, 1) : "0 and 1 not connected";

        assert uf.union(0, 1) == true  : "merge 0-1";
        assert uf.union(2, 3) == true  : "merge 2-3";
        assert uf.count()     == 3     : "3 components: {0,1},{2,3},{4}";
        assert uf.connected(0, 1)      : "0 and 1 now connected";
        assert !uf.connected(0, 2)     : "0 and 2 not connected";

        assert uf.union(1, 2) == true  : "merge {0,1} and {2,3}";
        assert uf.count()     == 2     : "2 components: {0,1,2,3},{4}";
        assert uf.connected(0, 3)      : "0 and 3 connected via bridge";

        assert uf.union(0, 3) == false : "already connected — no merge";
        assert uf.count()     == 2     : "still 2 components";

        uf.union(4, 0);
        assert uf.count() == 1 : "all merged into 1 component";

        System.out.println("PASS: basic ops");
    }

    private static void testKruskal() {
        // Triangle graph: A=0, B=1, C=2 with edges AB=1, AC=4, BC=2
        // MST should be AB(1) + BC(2) = 3
        int[][] edges = {{0, 1, 1}, {0, 2, 4}, {1, 2, 2}};
        assert kruskalMST(3, edges) == 3 : "triangle MST = 3";

        // Standard 4-node example
        // 0-1(10), 0-2(6), 0-3(5), 1-3(15), 2-3(4)
        // MST: 2-3(4) + 0-3(5) + 0-1(10) = 19
        int[][] edges2 = {{0, 1, 10}, {0, 2, 6}, {0, 3, 5}, {1, 3, 15}, {2, 3, 4}};
        assert kruskalMST(4, edges2) == 19 : "4-node MST = 19";

        // Disconnected graph → -1
        int[][] edges3 = {{0, 1, 1}};
        assert kruskalMST(3, edges3) == -1 : "disconnected → -1";

        System.out.println("PASS: Kruskal MST");
    }

    private static void testConnectedComponents() {
        // 5 nodes, edges: 0-1, 1-2, 3-4
        int[][] edges = {{0, 1}, {1, 2}, {3, 4}};
        assert countComponents(5, edges) == 2 : "2 components: {0,1,2} and {3,4}";

        // Isolated nodes only
        assert countComponents(4, new int[][]{}) == 4 : "4 isolated nodes";

        // Fully connected
        int[][] full = {{0,1},{1,2},{2,3}};
        assert countComponents(4, full) == 1 : "fully connected chain";

        System.out.println("PASS: connected components");
    }

    private static void testPathCompression() {
        // Build a worst-case chain: 0→1→2→...→9, then verify find flattens it.
        // After enough finds the tree height should collapse to 1.
        UnionFind uf = new UnionFind(10);
        // Force a chain by always unioning x with x+1 in order
        for (int i = 0; i < 9; i++) uf.union(i, i + 1);

        // All should be in one component
        assert uf.count() == 1 : "chain: 1 component";
        assert uf.connected(0, 9) : "0 and 9 connected";

        // Path compression: after calling find on a deep node,
        // its parent should be the root (no intermediate nodes).
        int root = uf.find(0);
        int prev = uf.find(5);
        // After find(5), parent[5] should equal root (path compressed)
        assert uf.parent[5] == root : "path compression: 5 points to root";

        System.out.println("PASS: path compression");
    }
}
