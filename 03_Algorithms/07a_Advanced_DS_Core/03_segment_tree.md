# 🌳 Part 3: Segment Tree

> **Navigation**: [← Trie (prefix Tree)](02_trie_prefix_tree.md) | [Chapter overview](../07a_Advanced_DS_Core.md)
> Page 3 of 3 in **Advanced Data Structures: Complete Guide**


## Concept

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    SEGMENT TREE - COMPLETE UNDERSTANDING                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT IS A SEGMENT TREE?                                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ A segment tree is a binary tree where each node represents an INTERVAL       │
│ (segment) of the array and stores an aggregate value (sum, min, max, etc.)   │
│ for that interval.                                                           │
│                                                                              │
│ STRUCTURE:                                                                   │
│ • Root: Represents the ENTIRE array [0, n-1]                                 │
│ • Each internal node: Represents [l, r] = [l, mid] + [mid+1, r]              │
│ • Leaves: Each represents a SINGLE element [i, i]                            │
│                                                                              │
│ INVENTED: Used in computational geometry since 1970s (Bentley)               │
│ POPULARIZED: In competitive programming in 2000s                             │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHAT PROBLEM DOES SEGMENT TREE SOLVE?                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│ CORE PROBLEM: Efficient range queries + point/range updates                  │
│                                                                              │
│ WITHOUT SEGMENT TREE:                                                        │
│ "Find sum of elements from index 2 to 1000"                                  │
│ • Array: O(n) to sum each time → 10 queries on 1M elements = 10M ops         │
│ • Prefix sum: O(1) query BUT O(n) if you need to update an element           │
│                                                                              │
│ WITH SEGMENT TREE:                                                           │
│ • Query: O(log n)                                                            │
│ • Update: O(log n)                                                           │
│ • 10 queries + 5 updates = 15 × log(1M) ≈ 300 ops!                           │
│                                                                              │
│ REAL-WORLD EXAMPLES:                                                         │
│ • Databases: Range queries on changing data                                  │
│ • Finance: Rolling statistics (min/max/avg over time windows)                │
│ • Gaming: Leaderboard queries ("players ranked 50-100")                      │
│ • GIS: Geographic range queries                                              │
│ • Image Processing: 2D range queries (with 2D segment trees)                 │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHY USE SEGMENT TREE OVER ALTERNATIVES?                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ ┌──────────────────────┬──────────────┬──────────────┬────────────────────┐  │
│ │ Data Structure       │ Query Time   │ Update Time  │ Use Case           │  │
│ ├──────────────────────┼──────────────┼──────────────┼────────────────────┤  │
│ │ Plain Array          │ O(n)         │ O(1)         │ Few queries        │  │
│ │ Prefix Sum Array     │ O(1)         │ O(n)         │ No updates         │  │
│ │ Segment Tree         │ O(log n)     │ O(log n)     │ Both! ⭐           │   │
│ │ Fenwick/BIT          │ O(log n)     │ O(log n)     │ Simpler, sum only  │  │
│ │ Sqrt Decomposition   │ O(√n)        │ O(1)         │ Simpler to code    │  │
│ └──────────────────────┴──────────────┴──────────────┴────────────────────┘  │
│                                                                              │
│ SEGMENT TREE ADVANTAGES:                                                     │
│ • Handles ANY associative operation (sum, min, max, gcd, AND, OR, XOR)       │
│ • Supports lazy propagation for range updates                                │
│ • More flexible than Fenwick Tree (BIT)                                      │
│ • Generalizes to 2D, merge sort tree, etc.                                   │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ WHEN TO USE SEGMENT TREE?                                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│ ✅ USE SEGMENT TREE WHEN:                                                     │
│    • Need BOTH range queries AND point/range updates                         │
│    • Operation is ASSOCIATIVE (a⊕(b⊕c) = (a⊕b)⊕c)                            │
│    • Many queries (more than O(n) total)                                     │
│    • Array is fixed size (or use dynamic segment tree)                       │
│                                                                              │
│ ❌ DON'T USE WHEN:                                                            │
│    • Only queries, no updates → use prefix sum (simpler)                     │
│    • Only updates, no queries → just use array                               │
│    • Few queries → brute force is fine                                       │
│    • Operation isn't associative → segment tree won't work                   │
│                                                                              │
│ INTERVIEW SIGNALS:                                                           │
│ • "Range sum query" + "update element" = SEGMENT TREE                        │
│ • "Range minimum query" + "modifications" = SEGMENT TREE                     │
│ • "Query multiple times" on "changing array" = SEGMENT TREE                  │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ HOW DOES SEGMENT TREE WORK?                                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ Array: [1, 3, 5, 7, 9, 11]                                                   │
│                                                                              │
│ Segment Tree for SUM:                                                        │
│                                                                              │
│                     [36]              ← Root: sum of [0,5] = 1+3+5+7+9+11    │
│                    /    \                                                    │
│                [9]      [27]          ← [0,2]=9, [3,5]=27                    │
│               /   \    /    \                                                │
│             [4]  [5]  [16]  [11]      ← [0,1]=4, [2]=5, [3,4]=16, [5]=11     │
│            /  \       /  \                                                   │
│          [1] [3]    [7]  [9]          ← Individual elements                  │
│                                                                              │
│ QUERY: "Sum from index 1 to 4"                                               │
│ • Start at root                                                              │
│ • Node [0,5]: Range [1,4] partially overlaps → go to both children           │
│ • Node [0,2]: Range [1,2] partially overlaps → go to both children           │
│   • Node [0,1]: Range [1,1] partially overlaps → check children              │
│     • Node [0]: outside [1,4], ignore                                        │
│     • Node [1]: completely inside [1,4], return 3                            │
│   • Node [2]: completely inside [1,4], return 5                              │
│ • Node [3,5]: Range [3,4] partially overlaps                                 │
│   • Node [3,4]: completely inside [1,4], return 16                           │
│   • Node [5]: outside [1,4], ignore                                          │
│ • Answer: 3 + 5 + 16 = 24 ✓                                                  │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ DIFFICULTIES & COMMON MISTAKES                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1. TREE SIZE CALCULATION:                                                    │
│    Size needed: 4×n (safe) or 2×2^(ceil(log2(n))) (exact)                    │
│    Common mistake: Using 2n (not enough for non-powers of 2)                 │
│                                                                              │
│ 2. INDEX CONFUSION:                                                          │
│    Left child: 2*i, Right child: 2*i+1 (1-indexed)                           │
│    Left child: 2*i+1, Right child: 2*i+2 (0-indexed)                         │
│    Pick one and stick to it!                                                 │
│                                                                              │
│ 3. BOUNDARY CONDITIONS:                                                      │
│    Query [l,r] where l > r? Return identity element                          │
│    Segment [start,end] where start > end? Should not happen!                 │
│                                                                              │
│ 4. FORGETTING TO UPDATE ALL ANCESTORS:                                       │
│    When updating a leaf, must update all nodes up to root                    │
│                                                                              │
│ 5. LAZY PROPAGATION ERRORS:                                                  │
│    Forgetting to push down lazy values before splitting                      │
│    Not handling lazy values when query visits a node                         │
│                                                                              │
│ 6. WRONG MERGE OPERATION:                                                    │
│    Sum: merge(a,b) = a + b                                                   │
│    Min: merge(a,b) = min(a,b)                                                │
│    Be consistent!                                                            │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ EXPECTED OUTPUTS & COMPLEXITY                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ OPERATION        │ TIME         │ SPACE        │ OUTPUT                      │
│ ─────────────────┼──────────────┼──────────────┼──────────────────────────── │
│ Build            │ O(n)         │ O(n)         │ Segment tree array          │
│ Point Query      │ O(log n)     │ O(log n)*    │ Value at index              │
│ Range Query      │ O(log n)     │ O(log n)*    │ Aggregate over range        │
│ Point Update     │ O(log n)     │ O(log n)*    │ void (modifies tree)        │
│ Range Update**   │ O(log n)     │ O(log n)*    │ void (with lazy prop)       │
│                                                                              │
│ * Stack space for recursion                                                  │
│ ** With lazy propagation                                                     │
│                                                                              │
│ SPACE: O(4n) ≈ O(n) for tree storage                                         │
│                                                                              │
│ EXAMPLE OUTPUT:                                                              │
│ arr = [1, 3, 5, 7, 9, 11]                                                    │
│ query(1, 4) → 24 (3+5+7+9)                                                   │
│ update(2, 10)  → arr becomes [1, 3, 10, 7, 9, 11]                            │
│ query(1, 4) → 29 (3+10+7+9)                                                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Implementation

```java
class SegmentTree {
    int[] tree;
    int[] arr;
    int n;

    public SegmentTree(int[] arr) {
        this.arr = arr;
        this.n = arr.length;
        this.tree = new int[4 * n];  // Safe size
        build(0, 0, n - 1);
    }

    // BUILD: O(n)
    private void build(int node, int start, int end) {
        if (start == end) {
            tree[node] = arr[start];
            return;
        }

        int mid = (start + end) / 2;
        int leftChild = 2 * node + 1;
        int rightChild = 2 * node + 2;

        build(leftChild, start, mid);
        build(rightChild, mid + 1, end);

        tree[node] = tree[leftChild] + tree[rightChild];  // Sum
    }

    // RANGE QUERY: O(log n)
    public int query(int L, int R) {
        return query(0, 0, n - 1, L, R);
    }

    private int query(int node, int start, int end, int L, int R) {
        // No overlap
        if (R < start || L > end) {
            return 0;  // Identity for sum
        }

        // Complete overlap
        if (L <= start && end <= R) {
            return tree[node];
        }

        // Partial overlap
        int mid = (start + end) / 2;
        int leftSum = query(2 * node + 1, start, mid, L, R);
        int rightSum = query(2 * node + 2, mid + 1, end, L, R);

        return leftSum + rightSum;
    }

    // POINT UPDATE: O(log n)
    public void update(int idx, int newVal) {
        arr[idx] = newVal;
        update(0, 0, n - 1, idx, newVal);
    }

    private void update(int node, int start, int end, int idx, int val) {
        if (start == end) {
            tree[node] = val;
            return;
        }

        int mid = (start + end) / 2;
        if (idx <= mid) {
            update(2 * node + 1, start, mid, idx, val);
        } else {
            update(2 * node + 2, mid + 1, end, idx, val);
        }

        tree[node] = tree[2 * node + 1] + tree[2 * node + 2];
    }
}

// VISUAL QUERY TRACE:
// Array: [1, 3, 5, 7, 9, 11]
// Query: sum(1, 4) = 3 + 5 + 7 + 9 = 24
//
//                    [36] (0-5)
//                   /    \
//               [9]      [27]
//              /   \    /    \
//            [4]  [5]  [16]  [11]
//           /  \       /  \
//         [1] [3]    [7]  [9]
//
// Query(1,4):
// At root (0-5): partial overlap → go both sides
// Left (0-2): partial → go both
//   (0-1): partial → go both
//     (0): no overlap → return 0
//     (1): complete → return 3
//   (2): complete → return 5
// Right (3-5): partial → go both
//   (3-4): complete → return 16
//   (5): no overlap → return 0
//
// Result: 0 + 3 + 5 + 16 + 0 = 24 ✓
```

🔬 **Section Challenge — Segment Tree Mechanics & Spring Boot Integration**

**Challenge 1 (Algorithmic Rigor):** Standard Segment Trees offer `O(log N)` point updates. However, if you need to perform a **Range Update** (e.g., add `+5` to all elements from index `100` to `50000`), a standard Segment Tree degrades to `O(N)`. Why? And how does "Lazy Propagation" restore `O(log N)`?

<details><summary>Answer</summary>

**The Problem:** A naive range update requires updating every single leaf node in the range `[100, 50000]`. Even though finding the covering segments takes `O(log N)`, pushing the update down to the individual leaves requires traversing the entire subtree, which is `O(K)` where `K` is the range size. In the worst case, this is `O(N)`.
**Lazy Propagation (Deferred Resolution):** Instead of pushing the update to the leaves, Lazy Propagation updates only the highest possible covering nodes and marks them with a `lazy` flag. It _defers_ updating the children. Only when a subsequent query or update forces traversal _through_ that node do we push the lazy value down one level. By deferring work until absolutely necessary, we touch at most `4 * log(N)` nodes per range update, restoring the `O(log N)` bound.

</details>

**Challenge 2 (Spring Boot AutoConfiguration):** You have wrapped your highly optimized Segment Tree in a service class: `RangeQueryEngine`. How would you write a custom Spring Boot Starter that automatically provisions this engine into the ApplicationContext **only if** the user hasn't defined their own, and **only if** a specific property `engine.type=segment-tree` is set?

<details><summary>Answer</summary>

**AutoConfiguration Design:**
Create a `@Configuration` class named `RangeQueryAutoConfiguration`. To enforce the conditions, you apply Spring Boot's conditional annotations:

```java
@Configuration
@ConditionalOnProperty(name = "engine.type", havingValue = "segment-tree")
public class RangeQueryAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean(RangeQueryEngine.class)
    public RangeQueryEngine rangeQueryEngine() {
        return new SegmentTreeRangeQueryEngine();
    }
}
```

Register this class in `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` (Spring Boot 2.7/3.0+). When the application starts, Spring evaluates the environment. If the property matches, and no other `@Bean` of type `RangeQueryEngine` exists, it instantiates the Segment Tree. This is exactly how Spring Boot's internal caching (`@EnableCaching`) seamlessly provisions `ConcurrentHashMapCacheManager` by default.

</details>

---


---

## Proof Corner -- Segment Tree O(log n) Update and Query

**Claim**: A segment tree on n elements supports point update and range query each in O(log n) time.

**Tree structure**: A full binary tree with 4n nodes. Node covering [l, r] has children covering [l, mid] and [mid+1, r]. At most 2*ceil(n) - 1 internal nodes plus n leaves. Height = ceil(log_2 n).

**Update proof**: Updating position i requires updating all ancestors of leaf i. The path from root to leaf i has length = height = O(log n). Each ancestor update is O(1) (recompute from children). Total: O(log n).

**Query proof**: Query [ql, qr] recursively visits children only if they intersect [ql, qr]. At each level, at most 2 "boundary" nodes are visited (leftmost and rightmost intersecting nodes). All others are either fully inside (return precomputed value) or fully outside (return identity). Total nodes visited at each of log n levels: O(1) boundary + O(1) = O(1) per level. Total: O(log n). QED.

**Lazy propagation invariant**: A lazy tag at node v means "this tag must be pushed down to children before accessing children". Before any child access, call `pushdown(v)`. This ensures every query and update sees the correct values.

---

## When It Breaks -- Advanced Data Structures

**1. Wrong identity element in segment tree** -- for range minimum queries, the identity is `Integer.MAX_VALUE` (not 0). For range XOR, identity is 0. For range AND, identity is `~0` (all bits set). Using 0 as identity for min-query silently returns 0 for any range that has no elements, corrupting empty-range results.

**2. Lazy propagation push-down order** -- when the lazy tag represents "add delta to all elements in range," the push-down must first apply the parent tag to the child values AND propagate the tag further down. Applying the tag to children but NOT propagating it means the next push-down will double-apply. Standard bug: lazy applied twice.

**3. Segment tree index bounds (4n rule)** -- allocating exactly n nodes causes ArrayIndexOutOfBoundsException for certain n values where the tree is not a perfect binary tree. Always allocate 4*n nodes. The exact bound is 4*n for safety; tight bound is 2*nextPowerOf2(n).

**4. Persistent segment tree version aliasing** -- in a persistent segment tree, creating a new version shares unchanged subtrees with the previous version. If you mistakenly update a shared node in-place, all versions sharing that node see the change. Fix: always create new nodes on the update path; never mutate shared nodes.

---

## Reference Anchor

**No standard JDK segment tree** -- Java provides only `java.util.TreeMap` (BST, not segment tree). For production use, implement from scratch:

```java
// Segment tree with lazy propagation for range add + range sum:
class SegTree {
    long[] sum, lazy;
    int n;
    SegTree(int n) { this.n = n; sum = new long[4*n]; lazy = new long[4*n]; }
    void push(int node, int l, int r) {
        if (lazy[node] != 0) {
            int mid = (l+r)/2;
            apply(2*node, l, mid, lazy[node]);
            apply(2*node+1, mid+1, r, lazy[node]);
            lazy[node] = 0;
        }
    }
    void apply(int node, int l, int r, long delta) {
        sum[node] += delta * (r - l + 1);
        lazy[node] += delta;
    }
    void update(int node, int l, int r, int ql, int qr, long delta) {
        if (ql > r || qr < l) return;
        if (ql <= l && r <= qr) { apply(node, l, r, delta); return; }
        push(node, l, r);
        int mid = (l+r)/2;
        update(2*node, l, mid, ql, qr, delta);
        update(2*node+1, mid+1, r, ql, qr, delta);
        sum[node] = sum[2*node] + sum[2*node+1];
    }
}
// Used in: Netflix job scheduling, database range queries, competitive programming
```

---


---

[← Trie (prefix Tree)](02_trie_prefix_tree.md) | [Chapter overview](../07a_Advanced_DS_Core.md)
