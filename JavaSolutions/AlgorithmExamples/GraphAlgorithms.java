import java.util.*;

/**
 * GraphAlgorithms.java — BFS shortest path + Dijkstra + topological sort.
 *
 * Compile: javac GraphAlgorithms.java
 * Run:     java GraphAlgorithms
 *
 * Graph representation: adjacency list as List<List<int[]>> where
 *   adj.get(u) = list of [v, weight] pairs (v = neighbor, weight = edge cost).
 *   For unweighted graphs, weight = 1 or is ignored.
 *
 * Proof Corner reference: 05c_Graphs_Fundamentals.md
 */
public class GraphAlgorithms {

    // -------------------------------------------------------------------------
    // BFS — shortest path in unweighted graph
    // Invariant: when v is first dequeued, dist[v] = true shortest hop count.
    // -------------------------------------------------------------------------
    public static int[] bfsShortestPath(List<List<Integer>> adj, int src) {
        int n = adj.size();
        int[] dist = new int[n];
        Arrays.fill(dist, -1);
        dist[src] = 0;

        Queue<Integer> queue = new ArrayDeque<>();
        queue.offer(src);

        while (!queue.isEmpty()) {
            int u = queue.poll();
            for (int v : adj.get(u)) {
                if (dist[v] == -1) {        // not yet visited
                    dist[v] = dist[u] + 1;
                    queue.offer(v);
                }
            }
        }
        return dist;
    }

    // -------------------------------------------------------------------------
    // Dijkstra — shortest path in weighted graph (non-negative weights only)
    // Invariant: when (d, u) is extracted from PQ, dist[u] = δ(src, u) (final).
    // -------------------------------------------------------------------------
    public static int[] dijkstra(List<List<int[]>> adj, int src) {
        int n = adj.size();
        int[] dist = new int[n];
        Arrays.fill(dist, Integer.MAX_VALUE);
        dist[src] = 0;

        // PQ entries: [distance, vertex]
        PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[0]));
        pq.offer(new int[]{0, src});

        while (!pq.isEmpty()) {
            int[] cur = pq.poll();
            int d = cur[0], u = cur[1];

            if (d > dist[u]) continue;   // stale entry — skip (key insight)

            for (int[] edge : adj.get(u)) {
                int v = edge[0], w = edge[1];
                if (dist[u] + w < dist[v]) {
                    dist[v] = dist[u] + w;
                    pq.offer(new int[]{dist[v], v});
                }
            }
        }
        return dist;
    }

    // -------------------------------------------------------------------------
    // Topological Sort (Kahn's BFS algorithm)
    // Returns topological order, or empty list if cycle exists.
    // Invariant: a node enters the queue only when all its predecessors
    //            have already been added to the result.
    // -------------------------------------------------------------------------
    public static List<Integer> topologicalSort(List<List<Integer>> adj, int n) {
        int[] inDegree = new int[n];
        for (int u = 0; u < n; u++)
            for (int v : adj.get(u)) inDegree[v]++;

        Queue<Integer> queue = new ArrayDeque<>();
        for (int i = 0; i < n; i++)
            if (inDegree[i] == 0) queue.offer(i);

        List<Integer> order = new ArrayList<>();
        while (!queue.isEmpty()) {
            int u = queue.poll();
            order.add(u);
            for (int v : adj.get(u)) {
                if (--inDegree[v] == 0) queue.offer(v);
            }
        }
        return order.size() == n ? order : Collections.emptyList(); // empty = cycle
    }

    // -------------------------------------------------------------------------
    // Tests
    // -------------------------------------------------------------------------
    public static void main(String[] args) {
        testBFS();
        testDijkstra();
        testTopologicalSort();
        System.out.println("All GraphAlgorithms tests PASSED ✓");
    }

    private static void testBFS() {
        // Graph: 0-1, 0-2, 1-3, 2-3, 3-4 (unweighted)
        int n = 5;
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        addUndirected(adj, 0, 1); addUndirected(adj, 0, 2);
        addUndirected(adj, 1, 3); addUndirected(adj, 2, 3);
        addUndirected(adj, 3, 4);

        int[] dist = bfsShortestPath(adj, 0);
        assert dist[0] == 0 : "dist[0] = 0";
        assert dist[1] == 1 : "dist[1] = 1";
        assert dist[2] == 1 : "dist[2] = 1";
        assert dist[3] == 2 : "dist[3] = 2";
        assert dist[4] == 3 : "dist[4] = 3";

        // Disconnected node
        List<List<Integer>> adj2 = new ArrayList<>();
        for (int i = 0; i < 3; i++) adj2.add(new ArrayList<>());
        addUndirected(adj2, 0, 1);
        int[] dist2 = bfsShortestPath(adj2, 0);
        assert dist2[2] == -1 : "unreachable node = -1";

        System.out.println("PASS: BFS shortest path");
    }

    private static void testDijkstra() {
        // Graph from cheat sheet trace: A=0, B=1, C=2, D=3
        // A→B(4), A→C(2), C→B(1), B→D(3), C→D(5)
        int n = 4;
        List<List<int[]>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        addWeighted(adj, 0, 1, 4);
        addWeighted(adj, 0, 2, 2);
        addWeighted(adj, 2, 1, 1);
        addWeighted(adj, 1, 3, 3);
        addWeighted(adj, 2, 3, 5);

        int[] dist = dijkstra(adj, 0);
        assert dist[0] == 0 : "A→A = 0";
        assert dist[1] == 3 : "A→B = 3 (via C)";
        assert dist[2] == 2 : "A→C = 2";
        assert dist[3] == 6 : "A→D = 6 (via C→B→D)";

        // Unreachable node
        List<List<int[]>> adj2 = new ArrayList<>();
        for (int i = 0; i < 3; i++) adj2.add(new ArrayList<>());
        addWeighted(adj2, 0, 1, 5);
        int[] dist2 = dijkstra(adj2, 0);
        assert dist2[2] == Integer.MAX_VALUE : "unreachable = MAX_VALUE";

        System.out.println("PASS: Dijkstra");
    }

    private static void testTopologicalSort() {
        // DAG: 5→2, 5→0, 4→0, 4→1, 2→3, 3→1
        int n = 6;
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        adj.get(5).add(2); adj.get(5).add(0);
        adj.get(4).add(0); adj.get(4).add(1);
        adj.get(2).add(3); adj.get(3).add(1);

        List<Integer> order = topologicalSort(adj, n);
        assert order.size() == n : "all nodes in topo order";
        // Verify: each edge u→v has u before v in order
        int[] pos = new int[n];
        for (int i = 0; i < order.size(); i++) pos[order.get(i)] = i;
        assert pos[5] < pos[2] : "5 before 2";
        assert pos[5] < pos[0] : "5 before 0";
        assert pos[4] < pos[1] : "4 before 1";
        assert pos[2] < pos[3] : "2 before 3";
        assert pos[3] < pos[1] : "3 before 1";

        // Cycle detection
        List<List<Integer>> cyclic = new ArrayList<>();
        for (int i = 0; i < 3; i++) cyclic.add(new ArrayList<>());
        cyclic.get(0).add(1); cyclic.get(1).add(2); cyclic.get(2).add(0);
        List<Integer> cycleResult = topologicalSort(cyclic, 3);
        assert cycleResult.isEmpty() : "cycle → empty result";

        System.out.println("PASS: Topological Sort");
    }

    private static void addUndirected(List<List<Integer>> adj, int u, int v) {
        adj.get(u).add(v); adj.get(v).add(u);
    }

    private static void addWeighted(List<List<int[]>> adj, int u, int v, int w) {
        adj.get(u).add(new int[]{v, w});
    }
}
