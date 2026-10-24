# PART 1: The Senior Decision Frame

> **Navigation**: [Chapter overview](../07e_Advanced_Algorithm_Engineering_Deep.md) | [The Final Mental Model →](02_the_final_mental_model.md)
> Page 1 of 2 in **Advanced Algorithm Engineering: Deep Dive**


Before choosing an advanced technique, ask five questions.

| Question                                    | If Yes, Think About                             |
| ------------------------------------------- | ----------------------------------------------- |
| Are queries mixed with updates?             | Fenwick, Segment Tree, Lazy Segment Tree, Treap |
| Are queries on tree paths/subtrees?         | Euler Tour, LCA, Heavy-Light Decomposition      |
| Can queries be reordered offline?           | Mo's Algorithm, sweep line, DSU offline         |
| Do you need kth/rank/frequency over ranges? | Wavelet Tree, Persistent Segment Tree           |
| Is state changing over time with rollback?  | DSU Rollback, persistent structures             |

## 1.1 Online vs Offline

**Online** means you must answer in the original order:

```text
update
query -> answer now
update
query -> answer now
```

**Offline** means all queries are known first, so you can reorder or batch them:

```text
read all queries
sort/reorder/group
answer efficiently
return answers in original query order
```

Many "impossible" problems become simple once you notice they are offline.

## 1.2 The Three Axes

Most advanced DSA problems are one of these:

```text
1D array + range query/update
tree + path/subtree query/update
graph + connectivity/shortest path/flow over changing constraints
```

The correct structure is usually chosen by the axis:

| Axis          | Static               | Point Updates         | Range Updates                  | Offline                        |
| ------------- | -------------------- | --------------------- | ------------------------------ | ------------------------------ |
| Array         | Prefix, Sparse Table | Fenwick, Segment Tree | Lazy Segment Tree              | Mo's, Sweep Line               |
| Tree subtree  | Euler Tour + Prefix  | Euler Tour + BIT      | Euler Tour + Lazy Segment Tree | DSU on Tree                    |
| Tree path     | LCA binary lifting   | HLD + Segment Tree    | HLD + Lazy Segment Tree        | Tarjan LCA                     |
| Dynamic graph | N/A                  | DSU for additions     | Hard                           | DSU rollback, divide over time |

---

## PART 2: Heavy-Light Decomposition (HLD)

HLD turns tree path queries into `O(log^2 N)` segment tree queries.

### 2.1 The Problem

Given a tree:

```text
update value of node u
query sum/max/min on path u -> v
```

A normal segment tree works on arrays, not trees.
HLD makes the tree behave like a few array intervals.

### 2.2 Heavy Edge Rule

For every node, choose the child with the largest subtree as the **heavy child**.
All other child edges are **light edges**.

Property:

> On any root-to-leaf path, you cross at most `O(log N)` light edges.

Why? Every time you take a light edge, the subtree size at least halves.

### 2.3 Decomposition Output

HLD gives every node:

| Field       | Meaning                         |
| ----------- | ------------------------------- |
| `parent[u]` | Parent in rooted tree           |
| `depth[u]`  | Depth from root                 |
| `heavy[u]`  | Child with largest subtree      |
| `head[u]`   | Top node of current heavy chain |
| `pos[u]`    | Position in base array          |

Nodes on the same heavy chain become contiguous in the base array.

### 2.4 Path Query Logic

```text
while head[u] != head[v]:
    move the deeper chain upward
    query segment [pos[head[u]], pos[u]]
    u = parent[head[u]]

now u and v are in same chain
query segment [pos[minDepthNode], pos[maxDepthNode]]
```

Complexity:

```text
O(log N) chains * O(log N) segment query = O(log^2 N)
```

With a Fenwick tree for sums, it is still `O(log^2 N)`.
With careful segment tree design, many practical cases are extremely fast.

### 2.5 When HLD Is the Right Tool

Use HLD when:

- Queries are on paths, not just subtrees.
- Updates happen after queries start.
- The tree is mostly static.
- You need aggregate values like sum, max, min, gcd, xor.

Do not use HLD when:

- Only subtree queries exist. Euler Tour is simpler.
- The tree topology changes frequently. Consider dynamic trees.
- You need only LCA. Binary lifting is simpler.

---

## PART 3: Euler Tour Techniques

Euler Tour converts a rooted tree into an array.

### 3.1 Subtree as Contiguous Range

During DFS:

```text
tin[u] = timer++
visit children
tout[u] = timer - 1
```

Then:

```text
subtree(u) = [tin[u], tout[u]]
```

That means subtree sum/update becomes a normal range query/update.

### 3.2 Common Patterns

| Tree Problem             | Transformation                           |
| ------------------------ | ---------------------------------------- |
| Subtree sum              | Euler Tour + Fenwick                     |
| Subtree add, point query | Euler Tour + difference BIT              |
| Subtree add, subtree sum | Euler Tour + lazy segment tree           |
| Ancestor check           | `tin[a] <= tin[b] && tout[b] <= tout[a]` |
| LCA preprocessing        | Euler depth tour + RMQ                   |

### 3.3 Euler Tour vs HLD

| Need                         | Best Tool                         |
| ---------------------------- | --------------------------------- |
| Query whole subtree          | Euler Tour                        |
| Query root-to-node path only | Euler Tour prefix trick sometimes |
| Query arbitrary path `u-v`   | HLD                               |
| Query only ancestor/LCA      | Binary Lifting / RMQ              |

---

## PART 4: Mo's Algorithm

Mo's Algorithm answers many offline range queries by reordering them to minimize pointer movement.

### 4.1 The Problem Shape

Given static array and many queries:

```text
query(L, R): answer something about arr[L..R]
```

Examples:

- number of distinct values
- frequency of most common value
- pair counts
- xor/frequency statistics

### 4.2 The Trick

Maintain a current window `[curL, curR]`.

For each query in special sorted order:

```text
while curL > L: add(--curL)
while curR < R: add(++curR)
while curL < L: remove(curL++)
while curR > R: remove(curR--)
answer query from maintained state
```

Sort queries by:

```text
block(L), then R
```

where:

```text
blockSize ≈ sqrt(N)
```

Complexity is roughly:

```text
O((N + Q) * sqrt(N) * cost(add/remove))
```

### 4.3 Why It Works

Normal query order may jump wildly:

```text
[1, 100000] -> [50000, 50001] -> [2, 99999]
```

Mo's order keeps nearby `L` values together and moves `R` in a controlled way.

The core requirement:

> You must be able to update the answer when one element enters or leaves the range.

If add/remove is not cheap, Mo's Algorithm is not useful.

### 4.4 Variants

| Variant          | Handles                                             |
| ---------------- | --------------------------------------------------- |
| Standard Mo      | Static array range queries                          |
| Mo with updates  | Offline point updates + range queries               |
| Mo on trees      | Path/subtree queries via Euler Tour                 |
| Hilbert order Mo | Better practical locality than block sorting        |
| Rollback Mo      | Cases where remove is hard but rollback is possible |

---

## PART 5: Wavelet Tree

A Wavelet Tree answers rank/select/kth queries over ranges.

### 5.1 What It Solves

Given an array:

```text
arr = [5, 1, 2, 7, 3, 5, 9]
```

Wavelet Tree can answer:

| Query                    | Meaning                            |
| ------------------------ | ---------------------------------- |
| `kth(L, R, k)`           | kth smallest in subarray           |
| `countLTE(L, R, x)`      | how many values `<= x` in subarray |
| `freq(L, R, x)`          | frequency of `x` in subarray       |
| `rangeCount(L, R, a, b)` | count values in `[a, b]`           |

Complexity:

```text
O(log ValueRange)
```

or `O(log Sigma)` after coordinate compression.

### 5.2 Mental Model

Each node owns a value range:

```text
[low..high]
```

Split by midpoint:

```text
left values  <= mid
right values > mid
```

Store a prefix count array that says how many elements up to each position went left.

To answer kth:

```text
leftCount = number of elements in query range that went left
if k <= leftCount:
    go left with mapped range
else:
    go right with k -= leftCount
```

### 5.3 Wavelet Tree vs Persistent Segment Tree

| Need             | Wavelet Tree         | Persistent Segment Tree                |
| ---------------- | -------------------- | -------------------------------------- |
| Static array     | Excellent            | Excellent                              |
| kth in range     | Excellent            | Excellent                              |
| Point updates    | Harder               | Possible with versions or dynamic tree |
| Memory           | Compact              | More nodes                             |
| Conceptual model | Value partition tree | Versioned frequency segment trees      |

---

## PART 6: Persistent Segment Tree

A Persistent Segment Tree keeps old versions after updates.

### 6.1 Classic kth Smallest in Subarray

Build prefix versions:

```text
root[0] = empty frequency tree
root[i] = root[i-1] + arr[i]
```

To query kth smallest in `arr[L..R]`:

```text
use root[R] - root[L-1]
descend both trees together
```

At each value-range node:

```text
countLeft = rootR.left.sum - rootLminus1.left.sum

if k <= countLeft:
    go left
else:
    k -= countLeft
    go right
```

Complexity:

```text
build: O(N log V)
query: O(log V)
memory: O(N log V) nodes
```

### 6.2 Why Version Subtraction Works

Each version represents frequencies in prefix `[1..i]`.

So:

```text
frequency in [L..R] = frequency prefix [1..R] - frequency prefix [1..L-1]
```

This is prefix sums, but the "sum" lives inside a segment tree over values.

---

## PART 7: DSU Rollback and Dynamic Connectivity

Normal DSU supports adding edges.
It does not support deleting edges easily.

DSU Rollback handles offline dynamic connectivity:

```text
add edge
remove edge
query connected(u, v)
```

### 7.1 Rollback Rule

When unioning two components, push the changed fields onto a stack:

```text
changed parent
changed size/rank
component count
```

Rollback pops changes and restores the previous state.

Important: avoid path compression because it changes many parent pointers invisibly.
Use union by size/rank only.

### 7.2 Segment Tree Over Time

For each edge, compute the time interval during which it is active:

```text
edge (u, v) active from t1 to t2
```

Add that edge to segment tree nodes covering `[t1, t2]`.

DFS the time segment tree:

```text
enter node:
    apply all edges stored here

if leaf:
    answer queries at this time
else:
    recurse children

exit node:
    rollback to snapshot
```

This is one of the cleanest examples of "offline makes hard deletions manageable."

---

## PART 8: Dynamic Trees - Link-Cut Trees and Euler Tour Trees

Sometimes the tree topology changes:

```text
link(u, v)   // add edge between two trees
cut(u, v)    // remove tree edge
query path u-v
```

Now HLD is not enough because HLD assumes the tree shape is static.

### 8.1 Link-Cut Tree

A Link-Cut Tree represents preferred paths using splay trees.

Supported operations:

| Operation         | Meaning                        | Complexity           |
| ----------------- | ------------------------------ | -------------------- |
| `makeroot(u)`     | Reroot represented tree at `u` | `O(log N)` amortized |
| `findroot(u)`     | Find tree root                 | `O(log N)` amortized |
| `link(u, v)`      | Connect two trees              | `O(log N)` amortized |
| `cut(u, v)`       | Remove edge                    | `O(log N)` amortized |
| `pathQuery(u, v)` | Aggregate on path              | `O(log N)` amortized |

Use when tree edges change online and path aggregates are required.

### 8.2 Euler Tour Tree

Euler Tour Trees represent each dynamic tree by the sequence of its Euler tour, stored in a balanced BST/treap/splay tree.

Good at:

- dynamic connectivity in forests
- subtree-like aggregate maintenance
- link/cut in forests

Deep takeaway:

> Dynamic trees are not new trees. They are balanced binary trees used to store a changing representation of another tree.

---

## PART 9: Flow Algorithms

Flow algorithms solve allocation under capacity constraints.

### 9.1 Max Flow

You have:

```text
source -> network -> sink
```

Each edge has capacity.
Goal: push as much flow as possible from source to sink.

Common algorithms:

| Algorithm      | Idea                           | Good For                        |
| -------------- | ------------------------------ | ------------------------------- |
| Ford-Fulkerson | Repeated augmenting paths      | Teaching, small graphs          |
| Edmonds-Karp   | BFS shortest augmenting path   | Simple proof, moderate size     |
| Dinic          | BFS levels + DFS blocking flow | Competitive programming default |
| Push-Relabel   | Local excess pushing           | Dense/practical cases           |

### 9.2 Dinic Mental Model

Each phase:

1. BFS builds a level graph from source.
2. DFS sends blocking flow only along level-increasing edges.
3. Repeat until sink is unreachable.

Why it is fast:

> One BFS phase sends many augmenting paths instead of only one.

### 9.3 Modeling Max Flow Problems

| Problem Phrase                           | Flow Model                       |
| ---------------------------------------- | -------------------------------- |
| "assign workers to jobs"                 | bipartite matching               |
| "capacity-limited routes"                | max flow                         |
| "minimum cut / remove cheapest barriers" | min cut                          |
| "each node has capacity"                 | split node into `in -> out` edge |
| "choose with prerequisites"              | min-cut closure modeling         |

### 9.4 Min-Cost Max-Flow

Max flow asks:

```text
how much can we send?
```

Min-cost max-flow asks:

```text
how cheaply can we send that much?
```

Common use cases:

- assignment with costs
- transportation
- scheduling
- matching where not all matches are equally good

Implementation warning:

> Negative costs require potentials or Bellman-Ford/SPFA initialization. Plain Dijkstra is not enough unless reduced costs are non-negative.

---

## PART 10: DP Optimization Toolkit

Advanced DP is often about reducing transitions.

### 10.1 Monotonic Queue Optimization

Use when transition asks for max/min over a sliding window:

```text
dp[i] = value[i] + max(dp[j]) for j in [i-k, i-1]
```

Maintain candidates in a deque:

```text
remove indices out of window
remove worse candidates from back
front is best
```

Complexity goes from `O(NK)` to `O(N)`.

### 10.2 Convex Hull Trick (CHT)

Use when transition looks like:

```text
dp[i] = min(m[j] * x[i] + b[j])
```

Each previous state `j` defines a line:

```text
y = m[j]x + b[j]
```

Query the best line at `x[i]`.

| Situation                     | Tool                 |
| ----------------------------- | -------------------- |
| Slopes monotonic, x monotonic | Deque CHT            |
| Arbitrary insert/query x      | Li Chao Tree         |
| Need delete old lines         | Dynamic CHT variants |

### 10.3 Li Chao Segment Tree

Li Chao Tree stores lines over an x-coordinate domain.

At each node:

1. Keep one currently best line for the midpoint.
2. When adding a new line, keep the better line at midpoint.
3. Push the worse line to the side where it may still win.

Complexity:

```text
add line: O(log X)
query x:  O(log X)
```

Good when x values are large or not monotonic.

### 10.4 Divide and Conquer DP Optimization

For DP:

```text
dp[g][i] = min over k < i of dp[g-1][k] + cost(k+1, i)
```

If the best `k` for `i` is monotonic:

```text
opt[g][i] <= opt[g][i+1]
```

then compute row `g` with divide and conquer:

```text
solve(l, r, optL, optR)
```

Complexity often drops from:

```text
O(KN^2) -> O(KN log N)
```

### 10.5 Knuth Optimization

Use for interval DP:

```text
dp[l][r] = min over k in [l, r) of dp[l][k] + dp[k+1][r] + cost(l, r)
```

When quadrangle inequality / monotone opt conditions hold:

```text
opt[l][r-1] <= opt[l][r] <= opt[l+1][r]
```

Search only that smaller range.

Classic examples:

- optimal binary search tree
- merging stones/files under certain cost forms

Do not force Knuth. If the monotonicity condition is false, answers break silently.

---

## PART 11: String Automata and Multi-Pattern Matching

String algorithms become advanced when you stop matching one pattern against one text.

### 11.1 Aho-Corasick Automaton

Solves:

```text
find many patterns in one text
```

Build a trie of patterns, then add failure links like KMP.

Use cases:

- dictionary matching
- content moderation
- virus signatures
- log pattern detection

Complexity:

```text
build: O(total pattern length * alphabet handling)
scan:  O(text length + matches)
```

### 11.2 Suffix Automaton

A Suffix Automaton is a compact automaton representing all substrings of a string.

It can answer:

| Query                     | How                                             |
| ------------------------- | ----------------------------------------------- |
| Count distinct substrings | sum over states `len[state] - len[link[state]]` |
| Longest common substring  | Walk second string through automaton            |
| Occurrence count          | Propagate terminal counts by length order       |
| Substring existence       | Automaton traversal                             |

Deep invariant:

```text
state represents an equivalence class of substrings
with the same set of ending positions
```

If suffix array feels like sorting suffixes, suffix automaton feels like compressing all substring states.

---

## PART 12: Sweep Line Algorithms

Sweep line processes events in sorted order.

### 12.1 The Shape

Convert geometry/time intervals into events:

```text
start event
end event
query event
```

Sort events and maintain active state.

Examples:

| Problem               | Active Structure                 |
| --------------------- | -------------------------------- |
| Meeting rooms         | min-heap of end times            |
| Skyline               | multiset/TreeMap of heights      |
| Rectangle union area  | segment tree over compressed y   |
| Intersections         | balanced tree of active segments |
| Offline range queries | Fenwick over sorted events       |

### 12.2 Rectangle Union Area

Events:

```text
x = left:  add y-interval
x = right: remove y-interval
```

Between two consecutive x-values:

```text
area += coveredYLength * (nextX - currentX)
```

A segment tree over compressed y-coordinates maintains total covered y-length.

This is the same pattern as logs, bookings, and resource allocation:

> Sort boundary events, maintain active aggregate.

---

## PART 13: Recognition Cheat Sheet

| If You See                                | Think                                  |
| ----------------------------------------- | -------------------------------------- |
| "path query on tree"                      | HLD                                    |
| "subtree update/query"                    | Euler Tour + BIT/Segment Tree          |
| "kth smallest in subarray"                | Wavelet Tree / Persistent Segment Tree |
| "many static range distinct queries"      | Mo's Algorithm                         |
| "add/remove edges offline + connectivity" | DSU Rollback                           |
| "dynamic forest online"                   | Link-Cut Tree / Euler Tour Tree        |
| "minimize cost under capacity"            | Min-Cost Max-Flow                      |
| "max assignment count"                    | Bipartite Matching / Max Flow          |
| "DP transition is best line at x"         | CHT / Li Chao                          |
| "DP opt index moves monotonically"        | Divide & Conquer DP / Knuth            |
| "many patterns in text"                   | Aho-Corasick                           |
| "all substrings of one string"            | Suffix Automaton                       |
| "events over time/coordinates"            | Sweep Line                             |

---

[Chapter overview](../07e_Advanced_Algorithm_Engineering_Deep.md) | [The Final Mental Model →](02_the_final_mental_model.md)
