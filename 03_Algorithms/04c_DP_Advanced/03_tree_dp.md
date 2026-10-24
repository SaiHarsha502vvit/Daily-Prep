# Pattern 4: Tree DP

> **Navigation**: [← Pattern 3: Interval DP](02_interval_dp.md) | [Chapter overview](../04c_DP_Advanced.md) | [Complete DP Problem Solutions →](04_complete_dp_problem_solutions.md)
> Page 3 of 7 in **Advanced DP Patterns**


```text
CONCEPT:
DP on tree structures. Usually compute answers for subtrees
and combine at each node.

COMMON PATTERNS:
- dp[node] = something about subtree rooted at node
- dp[node][0/1] = with/without including this node
```

```java
// House Robber III - Rob houses on a tree (can't rob adjacent)
public class TreeDP {
    public int rob(TreeNode root) {
        int[] result = robSub(root);
        return Math.max(result[0], result[1]);
    }

    // Returns [max if not robbing this node, max if robbing this node]
    private int[] robSub(TreeNode node) {
        if (node == null) return new int[]{0, 0};

        int[] left = robSub(node.left);
        int[] right = robSub(node.right);

        // If not robbing this node, children can be robbed or not
        int notRob = Math.max(left[0], left[1]) + Math.max(right[0], right[1]);

        // If robbing this node, children cannot be robbed
        int rob = node.val + left[0] + right[0];

        return new int[]{notRob, rob};
    }
}

// Binary Tree Maximum Path Sum
public int maxPathSum(TreeNode root) {
    int[] maxSum = {Integer.MIN_VALUE};
    maxPath(root, maxSum);
    return maxSum[0];
}

private int maxPath(TreeNode node, int[] maxSum) {
    if (node == null) return 0;

    // Max sum of path going through left/right child
    int leftMax = Math.max(0, maxPath(node.left, maxSum));
    int rightMax = Math.max(0, maxPath(node.right, maxSum));

    // Max path passing through this node
    int pathThrough = node.val + leftMax + rightMax;
    maxSum[0] = Math.max(maxSum[0], pathThrough);

    // Return max path starting at this node and going down
    return node.val + Math.max(leftMax, rightMax);
}
```

## Why Tree DP Works — and the Reroot Technique That Makes O(n²) Problems O(n)

The House Robber III code above computes an answer for a single root. Most tree DP problems stop there. But a huge class of problems — "for each node, compute the answer as if it were the root" — is *naively* O(n²): re-do the whole DP at every root. The reroot technique reduces this to O(n) total. It's the most useful tree DP technique after the basic post-order, and almost no textbook teaches it cleanly.

**Why tree DP works at all.** The structural reason is the same one that makes divide-and-conquer work: **subtrees are independent sub-problems**. A tree has no cycles, so the subtree rooted at any node shares no edges with the rest of the tree. This means: the optimal answer for the subtree rooted at `node` depends only on the answers for the subtrees rooted at `node`'s children — not on anything above `node`. That's the optimal-substructure property, and it lets you compute answers bottom-up (post-order DFS) just like interval DP lets you compute answers by length. The recursion is `dp[node] = f(dp[child1], dp[child2], ..., node.val)`.

**The "post-order first" rule.** Every tree DP starts with a post-order DFS that computes children's answers before the parent's. The invariant: when you're computing `dp[node]`, the values `dp[child]` for all children are already settled. This is the tree analogue of "fill the DP table in increasing order of interval length" from interval DP — same idea, different partial order (ancestor-of vs sub-interval-of).

**The two-state [0/1] pattern (House Robber III).** When the choice at a node is "include me or don't," the natural state is `dp[node][0]` (don't include) and `dp[node][1]` (include). The recurrence:
- `dp[node][1] = node.val + Σ dp[child][0]` (if I include myself, my children cannot be)
- `dp[node][0] = Σ max(dp[child][0], dp[child][1])` (if I don't include, each child can choose optimally)

This same pattern handles: independent set on trees, vertex cover, "minimum dominating set," and any problem where the constraint between adjacent nodes is "at most one can be selected." The two states encode "I'm in the answer" vs "I'm not" — the transition rules encode the constraint. Once you see the pattern, you can re-derive the recurrence for any such problem in 30 seconds: write down the two states, write the constraints, and the recurrence falls out.

**The reroot DP technique — the killer app.** Many problems ask: "for every node, compute the answer if the tree were rooted at that node." Examples:
- "For every node, sum of distances to all other nodes"
- "For every node, number of subtrees rooted at that node with some property"
- "For every node, maximum path sum starting from that node"

Naive: do a full DP at every root. That's O(n) DP per root × n roots = **O(n²)**. For `n = 10^5`, that's `10^10` — impossible.

The reroot trick: do the DP **once**, then compute "what changes when I move the root from `parent` to `child`?" in O(1). Iterate this across all edges → O(n) total.

The general form:
1. **First pass (post-order from an arbitrary root `r`):** compute `dp_down[node]` = answer for the subtree rooted at `node` going *down*. This is the "standard" tree DP.
2. **Second pass (pre-order / reroot pass):** compute `dp_all[node]` = answer for the entire tree as if rooted at `node`. Start with `dp_all[r] = dp_down[r]` (no contribution from above `r` since it doesn't exist). Then for each edge `parent → child`, compute:

```
dp_all[child] = combine(
    dp_down[child],                                    // child's subtree (already known)
    contribution from parent's side, excluding child   // the "rest of the tree"
)
```

The "contribution from parent's side excluding child" is the hard part. For the "sum of distances" problem, if moving the root from `parent` to `child` shifts every node in `parent`'s subtree (excluding child's subtree) one step further from the new root, and every node in child's subtree one step closer:

```
dp_all[child] = dp_all[parent]
              + (n - size[child])    // nodes now 1 step further
              - size[child]          // nodes now 1 step closer
```

Where `size[child]` is the size of child's subtree (computed in pass 1). This is the classic "reroot to compute all distances in O(n)" technique that solves LeetCode 834 (Sum of Distances in Tree) and many tree-CF problems.

**The invariant for reroot DP.** After pass 1: `dp_down[node]` is correct for the subtree at `node`. After pass 2: `dp_all[node]` is correct for the whole tree rooted at `node`. The transition from `dp_all[parent]` to `dp_all[child]` uses only values that are already computed (post-order ensures `size[]` and `dp_down[]` are known; pre-order ensures `dp_all[parent]` is known before its children). So the entire algorithm runs in O(n) — one DFS for each pass.

**When tree DP fails.** Trees are acyclic, so:
- If your structure has cycles (graph, not tree), tree DP doesn't directly apply. You need to either pick a spanning tree and handle back-edges, or use a different DP (e.g., on DAGs).
- If your "tree" is actually a forest (multiple components), root each tree separately and combine.
- If the answer depends on the global structure in a way that's not decomposable by subtree (rare), reroot won't help.

🔬 **Section Challenge — Tree DP**

**Challenge 1 (Pattern Recognition, 5 min):** Which tree DP pattern applies to "minimum vertex cover on a tree"? The state, the recurrence, and the base case. (Vertex cover = smallest set of vertices such that every edge has at least one endpoint in the set.)

<details><summary>Answer</summary>

The two-state [0/1] pattern applies directly:
- `dp[node][1]` = minimum vertex cover of subtree at `node` when `node` IS in the cover
- `dp[node][0]` = minimum vertex cover of subtree at `node` when `node` is NOT in the cover

Recurrence:
- `dp[node][1] = 1 + Σ dp[child][0]` (if `node` is in the cover, every edge `(node, child)` is already covered, so children are free to be excluded — but children still need their *other* edges covered, which means each child's subtree must be covered *as if* the child is excluded. So children must contribute `dp[child][0]`.)
- `dp[node][0] = Σ min(dp[child][0], dp[child][1])` (if `node` is NOT in the cover, every edge `(node, child)` must be covered by the child, so each child must be in the cover OR have all its own edges covered by its descendants. Either way, the child's subtree needs an optimal cover, which is `min(dp[child][0], dp[child][1])`.)

Base case: leaf node, `dp[leaf][0] = 0`, `dp[leaf][1] = 1`.

Final answer: `min(dp[root][0], dp[root][1])`.

This is a textbook problem and the pattern generalizes: any "binary choice per node with adjacency constraint" maps to this two-state form. The constraint you encode determines the recurrence — the structure is the same.

</details>

**Challenge 2 (Reroot Reasoning, 8 min):** For the "sum of distances to all other nodes" problem on a tree (LeetCode 834), the reroot transition is:

```
dp_all[child] = dp_all[parent] + (n - size[child]) - size[child]
```

where `size[child]` is the size of child's subtree when rooted at `parent`. Explain the two terms `(n - size[child])` and `-size[child]` — what does each represent, and why is one added and one subtracted?

<details><summary>Answer</summary>

Imagine we move the root from `parent` to `child`. Every node's distance to the new root changes by +1 or -1:
- Nodes in `child`'s subtree (size `size[child]`): their distance to `child` is 1 less than their distance to `parent` (because the path to `child` goes through one fewer edge — the edge from `parent` to `child` is now "down" instead of "up"). So each of these `size[child]` nodes contributes `-1` to the total distance sum.
- Nodes *outside* `child`'s subtree (i.e., everywhere else in the tree, count = `n - size[child]`): their distance to `child` is 1 more than their distance to `parent` (because the path now goes through `parent → child`, adding one edge). So each of these `n - size[child]` nodes contributes `+1` to the total.

Total change in distance sum = `(+1) × (n - size[child]) + (-1) × size[child]` = `(n - size[child]) - size[child]`.

So `dp_all[child] = dp_all[parent] + (n - size[child]) - size[child]`.

This works because the *tree structure* (set of edges, parent-child relationships) doesn't change when you reroot — only the "direction" of each edge flips if you cross the new root. The size of each subtree is well-defined given the original arbitrary root. The transition is O(1) because it only needs `size[child]` (already computed in pass 1) and `dp_all[parent]` (already computed in pass 2 by the time we process this edge).

This is why the reroot trick is O(n) total: O(n) for pass 1 (sizes + `dp_down`), O(n) for pass 2 (one O(1) transition per edge). Compare to the naive O(n²) of recomputing at every root.

</details>


## Pattern 5: DP with Monotonic Optimization

```text
CONCEPT:
Use monotonic data structures to optimize DP transitions.
Reduces O(n²) to O(n) or O(n log n).
```

```java
// Sliding Window Maximum approach in DP
// dp[i] = max(dp[j] + cost[j]) for j in [i-k, i-1]
public int[] dpWithDeque(int[] arr, int k) {
    int n = arr.length;
    int[] dp = new int[n];
    Deque<Integer> deque = new ArrayDeque<>();

    for (int i = 0; i < n; i++) {
        // Remove elements outside window
        while (!deque.isEmpty() && deque.peekFirst() < i - k) {
            deque.pollFirst();
        }

        // Current dp value uses best in window
        if (!deque.isEmpty()) {
            dp[i] = dp[deque.peekFirst()] + arr[i];
        } else {
            dp[i] = arr[i];
        }

        // Maintain monotonic decreasing
        while (!deque.isEmpty() && dp[deque.peekLast()] <= dp[i]) {
            deque.pollLast();
        }
        deque.addLast(i);
    }

    return dp;
}
```

---

[← Pattern 3: Interval DP](02_interval_dp.md) | [Chapter overview](../04c_DP_Advanced.md) | [Complete DP Problem Solutions →](04_complete_dp_problem_solutions.md)
