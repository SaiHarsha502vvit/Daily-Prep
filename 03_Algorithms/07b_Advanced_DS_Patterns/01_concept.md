# Concept

> **Navigation**: [Chapter overview](../07b_Advanced_DS_Patterns.md) | [Disjoint Set (union — Find) →](02_disjoint_set_union_find.md)
> Page 1 of 5 in **Fenwick & Segment Trees — Advanced Data Structure Patterns**


```
FENWICK TREE: More space-efficient than Segment Tree
              for prefix sums and point updates.

Key Insight: Use binary representation of indices!

Index i's parent in Fenwick tree = i - (i & -i)
(Remove the lowest set bit)

Array:     [_, 1, 3, 5, 7, 9, 11, 13, 15]  (1-indexed)
BIT:       [_, 1, 4, 5, 16, 9, 20, 13, 64]

BIT[i] stores sum of elements in range determined by lowest set bit.

BIT[1] = arr[1]                    (binary: 0001, range size 1)
BIT[2] = arr[1] + arr[2]           (binary: 0010, range size 2)
BIT[3] = arr[3]                    (binary: 0011, range size 1)
BIT[4] = arr[1]+arr[2]+arr[3]+arr[4]  (binary: 0100, range size 4)
```

## Implementation

```java
class FenwickTree {
    int[] bit;
    int n;

    public FenwickTree(int[] arr) {
        this.n = arr.length;
        this.bit = new int[n + 1];  // 1-indexed

        // Build BIT
        for (int i = 0; i < n; i++) {
            update(i, arr[i]);
        }
    }

    // UPDATE: O(log n)
    // Add 'delta' to element at index i
    public void update(int i, int delta) {
        i++;  // Convert to 1-indexed
        while (i <= n) {
            bit[i] += delta;
            i += (i & -i);  // Move to next responsible node
        }
    }

    // PREFIX SUM: O(log n)
    // Sum of elements from 0 to i
    public int prefixSum(int i) {
        i++;  // Convert to 1-indexed
        int sum = 0;
        while (i > 0) {
            sum += bit[i];
            i -= (i & -i);  // Move to parent
        }
        return sum;
    }

    // RANGE SUM: O(log n)
    public int rangeSum(int L, int R) {
        if (L == 0) return prefixSum(R);
        return prefixSum(R) - prefixSum(L - 1);
    }
}

// VISUAL TRACE - prefixSum(6):
// BIT indices:  1   2   3   4   5   6   7   8
// BIT values:  [1,  4,  5, 16,  9, 20, 13, 64]
//
// i = 7 (6+1 in 1-indexed)
// Binary: 111
//
// Step 1: i=7 (111), add BIT[7]=13, i = 7 - (7 & -7) = 7-1 = 6
// Step 2: i=6 (110), add BIT[6]=20, i = 6 - (6 & -6) = 6-2 = 4
// Step 3: i=4 (100), add BIT[4]=16, i = 4 - (4 & -4) = 4-4 = 0
// Stop: i=0
//
// Sum = 13 + 20 + 16 = 49
// Verify: 1+3+5+7+9+11+13 = 49 ✓
```

---

## PART 4b: SEGMENT TREE — Complete Implementation

**SEGMENT TREE — THEORY & CODE**

```text
A Segment Tree allows:
• Range Query (sum/min/max/gcd) in O(log n)
• Point Update in O(log n)
• Range Update with Lazy Propagation in O(log n)
• Uses O(4n) space (built as complete binary tree in array)

WHEN TO USE vs BIT/FENWICK:
• BIT: Only prefix-sum/point-update. Simpler, less memory.
• Segment Tree: Range update, range min/max, lazy propagation.
  More powerful but ~2× more code.

VISUAL:
Array: [1, 3, 5, 7, 9, 11]

                  [0,5]=36
                /          \
          [0,2]=9         [3,5]=27
          /    \          /     \
      [0,1]=4  [2]=5  [3,4]=16  [5]=11
      /    \          /    \
   [0]=1  [1]=3   [3]=7  [4]=9

Each node stores aggregate (sum/min/max) of its range.
```

### Segment Tree Implementation (Range Sum + Point Update)

```java
class SegmentTree {
    int[] tree;
    int n;

    public SegmentTree(int[] arr) {
        n = arr.length;
        tree = new int[4 * n];  // 4× for safe sizing
        build(arr, 0, 0, n - 1);
    }

    // BUILD: O(n)
    private void build(int[] arr, int node, int start, int end) {
        if (start == end) {
            tree[node] = arr[start];  // Leaf
        } else {
            int mid = (start + end) / 2;
            build(arr, 2 * node + 1, start, mid);       // Left child
            build(arr, 2 * node + 2, mid + 1, end);     // Right child
            tree[node] = tree[2 * node + 1] + tree[2 * node + 2];  // Merge
        }
    }

    // POINT UPDATE: O(log n)
    public void update(int idx, int val) {
        update(0, 0, n - 1, idx, val);
    }

    private void update(int node, int start, int end, int idx, int val) {
        if (start == end) {
            tree[node] = val;
        } else {
            int mid = (start + end) / 2;
            if (idx <= mid) update(2 * node + 1, start, mid, idx, val);
            else update(2 * node + 2, mid + 1, end, idx, val);
            tree[node] = tree[2 * node + 1] + tree[2 * node + 2];
        }
    }

    // RANGE QUERY: O(log n)
    public int query(int L, int R) {
        return query(0, 0, n - 1, L, R);
    }

    private int query(int node, int start, int end, int L, int R) {
        if (R < start || end < L) return 0;            // No overlap
        if (L <= start && end <= R) return tree[node];  // Total overlap
        int mid = (start + end) / 2;                    // Partial overlap
        return query(2 * node + 1, start, mid, L, R)
             + query(2 * node + 2, mid + 1, end, L, R);
    }
}
```

### Segment Tree with Lazy Propagation (Range Update)

```java
class LazySegTree {
    int[] tree, lazy;
    int n;

    public LazySegTree(int[] arr) {
        n = arr.length;
        tree = new int[4 * n];
        lazy = new int[4 * n];
        build(arr, 0, 0, n - 1);
    }

    private void build(int[] arr, int node, int start, int end) {
        if (start == end) { tree[node] = arr[start]; return; }
        int mid = (start + end) / 2;
        build(arr, 2*node+1, start, mid);
        build(arr, 2*node+2, mid+1, end);
        tree[node] = tree[2*node+1] + tree[2*node+2];
    }

    private void pushDown(int node, int start, int end) {
        if (lazy[node] != 0) {
            int mid = (start + end) / 2;
            tree[2*node+1] += lazy[node] * (mid - start + 1);
            tree[2*node+2] += lazy[node] * (end - mid);
            lazy[2*node+1] += lazy[node];
            lazy[2*node+2] += lazy[node];
            lazy[node] = 0;
        }
    }

    // RANGE UPDATE: add val to all elements in [L,R]
    public void rangeUpdate(int L, int R, int val) {
        rangeUpdate(0, 0, n-1, L, R, val);
    }

    private void rangeUpdate(int node, int start, int end, int L, int R, int val) {
        if (R < start || end < L) return;
        if (L <= start && end <= R) {
            tree[node] += val * (end - start + 1);
            lazy[node] += val;
            return;
        }
        pushDown(node, start, end);
        int mid = (start + end) / 2;
        rangeUpdate(2*node+1, start, mid, L, R, val);
        rangeUpdate(2*node+2, mid+1, end, L, R, val);
        tree[node] = tree[2*node+1] + tree[2*node+2];
    }

    public int query(int L, int R) { return query(0, 0, n-1, L, R); }

    private int query(int node, int start, int end, int L, int R) {
        if (R < start || end < L) return 0;
        if (L <= start && end <= R) return tree[node];
        pushDown(node, start, end);
        int mid = (start + end) / 2;
        return query(2*node+1, start, mid, L, R) + query(2*node+2, mid+1, end, L, R);
    }
}
```

### Curated Segment Tree / BIT Problems

| #   | Problem                                                                                                   | LC# | Pattern                   | Difficulty |
| --- | --------------------------------------------------------------------------------------------------------- | --- | ------------------------- | ---------- |
| 1   | [Range Sum Query - Mutable](https://leetcode.com/problems/range-sum-query-mutable/)                       | 307 | BIT or Segment Tree       | Medium     |
| 2   | [Count of Smaller Numbers After Self](https://leetcode.com/problems/count-of-smaller-numbers-after-self/) | 315 | BIT + coordinate compress | Hard       |
| 3   | [My Calendar I](https://leetcode.com/problems/my-calendar-i/)                                             | 729 | Segment Tree / TreeMap    | Medium     |
| 4   | [My Calendar II](https://leetcode.com/problems/my-calendar-ii/)                                           | 731 | Segment Tree with lazy    | Medium     |
| 5   | [My Calendar III](https://leetcode.com/problems/my-calendar-iii/)                                         | 732 | Segment Tree with lazy    | Hard       |
| 6   | [Count of Range Sum](https://leetcode.com/problems/count-of-range-sum/)                                   | 327 | BIT / Merge Sort          | Hard       |
| 7   | [Reverse Pairs](https://leetcode.com/problems/reverse-pairs/)                                             | 493 | BIT / Merge Sort          | Hard       |
| 8   | [Rectangle Area II](https://leetcode.com/problems/rectangle-area-ii/)                                     | 850 | Segment Tree + sweep      | Hard       |
| 9   | [Falling Squares](https://leetcode.com/problems/falling-squares/)                                         | 699 | Segment Tree (range max)  | Hard       |
| 10  | [Range Sum Query 2D - Mutable](https://leetcode.com/problems/range-sum-query-2d-mutable/)                 | 308 | 2D BIT                    | Hard       |

---

[Chapter overview](../07b_Advanced_DS_Patterns.md) | [Disjoint Set (union — Find) →](02_disjoint_set_union_find.md)
