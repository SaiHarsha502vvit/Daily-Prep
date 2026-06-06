**Navigation**: [Back to Index](00_INDEX.md) | [Algorithms](../03_Algorithms/00_INDEX.md) | [Pattern Trigger Guide](20_Pattern_Trigger_Guide.md)

---

# Competitive Coding Deep Thinking

## How to Read, Reason, Prove, Optimize, and Code Under Pressure

Competitive coding is not just "knowing data structures."

It is the skill of converting a strange story into a precise machine:

```text
problem statement -> mathematical model -> constraints -> pattern -> proof -> code -> tests
```

The best competitive programmers are not faster because they type faster. They are faster because they recognize structure earlier.

> Pair this guide with [Constraint-Based Pattern Selection](../04_Patterns_Templates/25_Constraint_Based_Pattern_Selection.md). This is the exact "if constraints say X, use Y" map.
> For the actual rewrite process, use [Brute Force to Optimal Playbook](22_Brute_Force_To_Optimal_Playbook.md): brute loop -> bottleneck -> DS/Algo replacement.

---

# PART 1: What Competitive Coding Actually Tests

Competitive coding tests six muscles at once.

| Muscle | Meaning | Example |
|--------|---------|---------|
| Translation | Convert story to math | "Cities and roads" becomes graph |
| Constraint reading | Know what time complexity is allowed | `N = 2e5` rejects `O(N^2)` |
| Pattern recognition | Map signal to known family | "subarray" + "sum" -> prefix/sliding |
| Proof thinking | Know why the algorithm is correct | greedy exchange, DP recurrence |
| Implementation control | Avoid off-by-one and overflow | `long`, bounds, indexing |
| Debugging | Find the broken invariant fast | dry run, tiny tests, edge cases |

Deep truth:

> DSA knowledge gives you tools. Competitive coding teaches you when to pick each tool while the clock is loud.

---

# PART 2: The 7-Step Thinking Pipeline

Use this for every problem until it becomes automatic.

## Step 1: Restate the Problem in One Sentence

Bad:

```text
I need to solve this array thing.
```

Good:

```text
Given an array, count subarrays whose sum equals K.
```

Even better:

```text
Need number of index pairs (i, j) where prefix[j] - prefix[i] = K.
```

That last version is already the solution shape.

## Step 2: Extract Input Size and Operation Budget

The constraints are a map.

| Input Size | Usually Acceptable | Think About |
|------------|--------------------|-------------|
| `N <= 10` | `O(N!)`, backtracking | permutations, exhaustive search |
| `N <= 20` | `O(2^N * N)` | bitmask DP, subsets |
| `N <= 100` | `O(N^3)` | Floyd, interval DP |
| `N <= 2,000` | `O(N^2)` | pair DP, 2D loops |
| `N <= 1e5` | `O(N log N)` or `O(N)` | sorting, heap, Fenwick, graph |
| `N <= 1e6` | `O(N)` or near-linear | prefix, two pointers, sieve |
| `N >= 1e9` | `O(log N)` or math | binary search, formulas, fast power |

Rule of thumb:

```text
1 second in Java: roughly 1e8 simple operations, often less with heavy objects
```

So if `N = 2e5`, a nested loop is usually dead before you start.

## Step 3: Write the Brute Force

Brute force is not a waste. It reveals:

- what states exist
- what repeats
- what can be cached
- what order matters
- what operation is too slow

Example:

```text
For every subarray:
    compute sum
    check if sum == K
```

Then ask:

```text
What repeated work is killing me?
```

For subarray sums, repeated summing is the pain. Prefix sum removes it.

## Step 4: Identify the Shape

Ask:

```text
Is this array, tree, graph, string, number theory, DP, or data-structure query?
```

Then ask the sharper question:

```text
What changes?
What is queried?
Can I reorder the work?
```

Examples:

| Statement Signal | Real Shape |
|------------------|------------|
| "continuous segment" | subarray/window/prefix |
| "choose subset" | bitmask/backtracking/knapsack |
| "minimum steps" | BFS/shortest path |
| "dependencies" | DAG/topological sort |
| "many range queries" | prefix/Fenwick/segment/sparse/Mo |
| "kth / rank / count less than" | heap, binary search, order statistic |
| "can we achieve X?" | binary search on answer |

## Step 5: Choose an Invariant

An invariant is the truth your algorithm preserves.

Examples:

| Technique | Invariant |
|-----------|-----------|
| Sliding window | Window always satisfies or nearly satisfies condition |
| Monotonic stack | Stack remains increasing/decreasing |
| Dijkstra | Popped node has final shortest distance |
| DSU | Parent root represents connected component |
| DP | `dp[state]` equals best/count answer for that exact state |
| Binary search | Answer is inside `[lo, hi]` |

If you cannot state the invariant, you probably cannot debug the algorithm.

## Step 6: Prove Before Coding

Proof can be short.

Use one of these proof styles:

| Algorithm Family | Proof Style |
|------------------|-------------|
| Greedy | Exchange argument / stays ahead |
| DP | Induction over state order |
| Graph BFS | Layer expansion proof |
| Dijkstra | Cut property / smallest unsettled distance |
| Binary search | Monotonic predicate + invariant |
| Segment tree | Range partition proof |
| DSU | Component representative invariant |

Competitive proof is not formal math theater. It is your bug shield.

## Step 7: Code With a Test Plan

Before writing code, write 3-5 mental tests:

```text
minimum input
all equal
strictly increasing/decreasing
answer does not exist
overflow-sized numbers
```

Then code.

---

# PART 3: Constraint-to-Algorithm Map

This table should live in your head.

| Constraint / Phrase | Brain Says | Common Tools |
|---------------------|------------|--------------|
| `N <= 20` | subset states are possible | bitmask, meet-in-middle |
| `N <= 40` and subset sum | split into two halves | meet-in-the-middle |
| `N <= 100`, all-pairs shortest path | cubic ok | Floyd-Warshall |
| `N <= 2e5`, range queries | need log or O(1) query | Fenwick, segment tree, sparse table |
| static range min | no updates | sparse table |
| range update + range query | lazy propagation | segment tree |
| point update + prefix/range sum | simpler tree | Fenwick |
| graph with unweighted edges | shortest path by levels | BFS |
| graph with non-negative weights | shortest path | Dijkstra |
| graph with negative weights | careful | Bellman-Ford, SPFA rarely, potentials |
| tree path queries | flatten paths | HLD, LCA |
| subtree queries | flatten subtree | Euler Tour |
| exact `K` subarray sum | prefix difference | hashmap |
| longest at most/at least condition | sliding window if monotonic | two pointers |
| "minimum maximum" | binary search answer | monotonic check |
| "number of ways" | DP/combinatorics | modulo arithmetic |
| "large exponent" | fast power | binary exponentiation |
| "gcd of many values" | Euclid, prefix/suffix gcd | gcd math |

---

# PART 4: Pattern Signals and Verification

Pattern recognition is useful only if you verify it.

## 4.1 Sliding Window

Signal:

```text
contiguous subarray / substring
longest or shortest
condition becomes better/worse as window expands
```

Works when:

```text
moving right changes condition predictably
moving left can repair condition
```

Good:

```text
longest substring with at most K distinct chars
```

Bad:

```text
subarray sum equals K with negative numbers
```

Why bad? With negatives, expanding the window can decrease sum, so monotonicity breaks.

## 4.2 Prefix Sum / Prefix XOR

Signal:

```text
subarray sum/xor
range query
count subarrays with exact value
```

Core formulas:

```text
sum(L..R) = prefix[R + 1] - prefix[L]
xor(L..R) = px[R + 1] xor px[L]
```

Count exact K:

```text
prefix[j] - prefix[i] = K
prefix[i] = prefix[j] - K
```

So store frequencies of old prefixes.

## 4.3 Two Pointers

Signal:

```text
sorted array
pairs/triples
opposite ends
need count/closest/existence
```

Invariant:

```text
left and right move only inward; discarded pairs cannot become better later
```

If array is not sorted, ask whether sorting preserves the answer.

## 4.4 Binary Search on Answer

Signal:

```text
minimize maximum
maximize minimum
smallest X such that possible(X)
largest X such that possible(X)
```

Predicate must be monotonic:

```text
false false false true true true
```

or:

```text
true true true false false false
```

Examples:

- minimum ship capacity
- aggressive cows maximum minimum distance
- minimum eating speed
- split array largest sum

## 4.5 Monotonic Stack / Queue

Signal:

```text
next greater/smaller
previous greater/smaller
range where this element is min/max
histogram rectangle
sliding window max
```

Invariant:

```text
stack/deque keeps candidates in useful monotonic order
```

The structure stores candidates, not all elements.

## 4.6 Graph Modeling

Signal:

```text
states and transitions
minimum moves
reachability
dependencies
components
```

Translation examples:

| Story | Graph Model |
|-------|-------------|
| Word ladder | word is node, one-letter change is edge |
| Lock combinations | combination is state, wheel turn is edge |
| Course schedule | prerequisite edge, topological sort |
| Grid maze | cell is node, valid move is edge |
| Social groups | users as nodes, relationships as edges |

## 4.7 DP

Signal:

```text
count ways
best/min/max under choices
overlapping subproblems
future depends on summarized past
```

DP design questions:

1. What is the state?
2. What choice transitions between states?
3. What is the base case?
4. What order ensures dependencies are solved first?
5. Can memory be compressed?

State sentence template:

```text
dp[i][j] = answer for first i items with condition j
```

If you cannot finish the sentence, do not code yet.

---

# PART 5: Deep Reasoning Patterns

## 5.1 Invariant Thinking

Ask:

```text
What is always true before and after each loop iteration?
```

Example: binary search lower bound.

```text
Invariant:
answer is always in [lo, hi]
```

Code shape:

```java
while (lo < hi) {
    int mid = lo + (hi - lo) / 2;
    if (ok(mid)) {
        hi = mid;
    } else {
        lo = mid + 1;
    }
}
```

Why it works:

- If `ok(mid)` is true, answer may be `mid` or smaller.
- If false, answer must be larger.
- The interval shrinks without losing the answer.

## 5.2 Exchange Argument

Used for greedy.

Shape:

```text
Assume an optimal solution does not make my greedy choice.
Show we can swap part of it with my greedy choice without making it worse.
Therefore some optimal solution includes my greedy choice.
```

Example: activity selection.

Greedy picks the meeting with earliest finish time.
If an optimal schedule picked a later-finishing first meeting, swap it with the earliest-finishing meeting. The remaining schedule still has at least as much room.

## 5.3 Cut Property

Used in MST/Dijkstra-like reasoning.

For MST:

```text
Across any cut, the lightest edge crossing that cut is safe.
```

That is why Kruskal can add the smallest edge that connects two components.

## 5.4 State Compression

Ask:

```text
Does dp[i] only need dp[i-1]?
Does dp[i][j] only need previous row?
Can j be represented by a bitmask?
```

Common compressions:

| Original | Compression |
|----------|-------------|
| `dp[i][j]` depends on `i-1` | two rows |
| 0/1 knapsack | one row, iterate capacity backward |
| grid paths | one row if only top/left needed |
| visited subset | bitmask |

## 5.5 Monotonicity Hunting

Many hard problems hide one monotonic question:

```text
If capacity X works, any larger capacity also works.
If distance D works, any smaller distance also works.
If time T can finish all jobs, any larger time can too.
```

Once you find that, binary search appears.

---

# PART 6: Formula Vault

Memorize these, but also understand when they apply.

## 6.1 Basic Sums

```text
1 + 2 + ... + n = n(n + 1) / 2
0 + 1 + ... + (n - 1) = n(n - 1) / 2
sum of arithmetic progression = count * (first + last) / 2
geometric sum: 1 + r + r^2 + ... + r^k = (r^(k+1) - 1) / (r - 1)
```

Common use:

- count pairs
- nested loop complexity
- total movement
- number of substrings/subarrays

## 6.2 Subarray and Substring Counts

```text
number of subarrays of length n = n(n + 1) / 2
number of substrings of length n = n(n + 1) / 2
number of subsequences = 2^n
number of non-empty subsequences = 2^n - 1
```

Subarray is contiguous.
Subsequence can skip.
This distinction matters constantly.

## 6.3 Combinatorics

```text
nPr = n! / (n - r)!
nCr = n! / (r! * (n - r)!)
nC0 = nCn = 1
nCr = nC(n-r)
Pascal: nCr = (n-1)C(r-1) + (n-1)Cr
```

Modulo combination pattern:

```text
nCr mod MOD = fact[n] * invFact[r] * invFact[n-r] mod MOD
```

when `MOD` is prime and factorials are precomputed.

## 6.4 Modular Arithmetic

```text
(a + b) mod M = ((a mod M) + (b mod M)) mod M
(a * b) mod M = ((a mod M) * (b mod M)) mod M
(a - b) mod M = ((a mod M) - (b mod M) + M) mod M
```

Fast power:

```text
a^b in O(log b)
```

Modular inverse under prime `MOD`:

```text
a^-1 mod MOD = a^(MOD - 2) mod MOD
```

by Fermat's little theorem.

## 6.5 GCD / LCM

```text
gcd(a, b) = gcd(b, a mod b)
lcm(a, b) = a / gcd(a, b) * b
```

Use `a / gcd * b` to reduce overflow risk.

Properties:

```text
gcd(a, 0) = a
gcd(a, b, c) = gcd(gcd(a, b), c)
```

## 6.6 Graph and Tree Facts

```text
tree with N nodes has N - 1 edges
connected undirected graph has at least N - 1 edges
complete graph has N(N - 1) / 2 undirected edges
complete directed graph has N(N - 1) directed edges
sum of degrees in undirected graph = 2E
sum of indegrees = sum of outdegrees = E
```

BFS on unweighted graph:

```text
first time visiting node = shortest distance in edge count
```

Dijkstra:

```text
works only when edge weights are non-negative
```

## 6.7 Binary and Bitmask Formulas

```text
2^k has exactly one bit set
x & (x - 1) removes the lowest set bit
x & -x extracts the lowest set bit
mask has 2^n possible subsets
iterate submasks: sub = (sub - 1) & mask
```

Subset iteration:

```java
for (int sub = mask; sub > 0; sub = (sub - 1) & mask) {
    // sub is a non-empty submask of mask
}
```

## 6.8 Prefix and Difference Formulas

1D prefix:

```text
prefix[i + 1] = prefix[i] + arr[i]
sum(L..R) = prefix[R + 1] - prefix[L]
```

Difference array range add:

```text
diff[L] += val
diff[R + 1] -= val
```

2D prefix:

```text
sum(r1,c1..r2,c2) =
    pref[r2+1][c2+1]
  - pref[r1][c2+1]
  - pref[r2+1][c1]
  + pref[r1][c1]
```

## 6.9 Complexity Formulas

```text
binary search: O(log N)
sorting: O(N log N)
all pairs: O(N^2)
all triples: O(N^3)
all subsets: O(2^N)
all permutations: O(N!)
DFS/BFS graph: O(V + E)
Dijkstra with heap: O((V + E) log V)
Floyd-Warshall: O(N^3)
Fenwick update/query: O(log N)
Segment tree update/query: O(log N)
Sparse table query: O(1), build O(N log N)
```

---

# PART 7: How to Explain Your Solution

Use this exact structure.

## 7.1 The Explanation Script

```text
1. Brute force:
   I can try X, which costs Y.

2. Bottleneck:
   The repeated work is Z.

3. Optimization:
   I can maintain/cache/precompute Z using structure S.

4. Correctness:
   The invariant is I.

5. Complexity:
   Time is T, space is S.

6. Edge cases:
   I will handle empty/single/duplicates/overflow/etc.
```

Example:

```text
For subarray sum equals K, brute force checks all subarrays in O(N^2).
The repeated work is recomputing sums.
Using prefix sums, sum(i..j) becomes prefix[j] - prefix[i].
So for each current prefix, I need previous prefixes equal to current - K.
A hashmap stores those frequencies.
Time O(N), space O(N).
```

That is clean competitive-coding communication.

## 7.2 When You Are Stuck

Do not stare at the screen.

Run this checklist:

1. Can I solve a smaller version?
2. Can I brute force and inspect repeated work?
3. Can I sort?
4. Can I prefix?
5. Can I binary search the answer?
6. Can I model states as graph nodes?
7. Can I change recursion to DP?
8. Can I process queries offline?
9. Can I use complement thinking? (`need = target - current`)
10. Can I reverse the process?

The stuck state is usually a missing transformation.

---

# PART 8: Implementation Mental Models

## 8.1 Indexing

Pick one indexing style and protect it.

For arrays:

```text
0-based data
prefix has length n + 1
range [L, R] inclusive uses prefix[R + 1] - prefix[L]
```

For Fenwick:

```text
external index: 0-based
internal index: 1-based
```

Write conversion once.

## 8.2 Overflow

Use `long` when:

- values can reach `1e9`
- multiplying two ints
- summing many ints
- counting pairs/subarrays
- computing mid over large bounds

Safer midpoint:

```java
int mid = lo + (hi - lo) / 2;
```

For `long` bounds:

```java
long mid = lo + (hi - lo) / 2;
```

## 8.3 Comparator Trap

Do not write:

```java
(a, b) -> a - b
```

because subtraction can overflow.

Use:

```java
Integer.compare(a, b)
Long.compare(a, b)
```

## 8.4 PriorityQueue Trap

Java `PriorityQueue` is min-heap by default.

Max heap:

```java
PriorityQueue<Integer> pq = new PriorityQueue<>(Comparator.reverseOrder());
```

For pairs, avoid unclear raw arrays when logic is complex. Use small records/classes if it improves correctness.

## 8.5 Recursion Depth

Java recursion can stack overflow for deep DFS with `N = 2e5`.

Options:

- iterative stack
- increase stack only in controlled environments
- use BFS
- use iterative postorder when needed

---

# PART 9: The Competitive Coding Training Loop

Practice is not "solve random problems forever."

Use a loop.

## 9.1 Daily 90-Minute Session

```text
10 min: review pattern/formula sheet
35 min: solve one medium problem
15 min: debug and submit
20 min: read/editorial compare
10 min: write one lesson learned
```

The lesson learned is the actual growth.

Examples:

```text
I missed that negative numbers break sliding window.
I used BFS but edge weights required Dijkstra.
I forgot that TreeSet comparator defines equality.
I could binary search because the predicate was monotonic.
```

## 9.2 Problem Ladder

For each pattern:

1. Solve 3 easy recognition problems.
2. Solve 5 medium implementation problems.
3. Solve 2 mixed-pattern problems.
4. Re-solve the hardest one after 7 days.
5. Explain the pattern without looking.

## 9.3 Mistake Log

Keep categories:

| Mistake Type | Example |
|--------------|---------|
| Misread | missed "at most" vs "exactly" |
| Wrong pattern | used sliding window with negatives |
| Proof gap | greedy failed on hidden case |
| Implementation | off-by-one in prefix |
| Java trap | int overflow |
| Edge case | empty answer / duplicates |

If the same category repeats, train that category.

---

# PART 10: Topic Mastery Map

Use this as your competitive-coding roadmap.

## Level 1: Core Recognition

- arrays, strings, hashing
- two pointers
- sliding window
- prefix sums/xor
- sorting + binary search
- stack/queue
- recursion/backtracking basics

## Level 2: Standard DSA

- linked list
- binary tree/BST
- heap/priority queue
- graph BFS/DFS
- topological sort
- DSU
- greedy basics
- DP basics

## Level 3: Interview Strong

- Dijkstra, Bellman-Ford, MST
- trie
- monotonic stack/queue
- interval problems
- bit manipulation
- knapsack, LIS, LCS, grid DP
- binary search on answer
- combinatorics + modulo

## Level 4: Competitive Advanced

- segment tree + lazy propagation
- Fenwick variants
- sparse table
- LCA/binary lifting
- Euler Tour
- HLD
- Mo's Algorithm
- persistent segment tree
- flows/matching
- advanced string algorithms
- DP optimization

## Level 5: System-Level DSA Thinking

- B+ trees and LSM trees
- Bloom filters and sketches
- consistent hashing
- Merkle trees
- CRDTs
- cache-aware thinking
- memory and object overhead

---

# PART 11: Deep Examples

## Example 1: Count Subarrays With Sum K

Brute force:

```text
try all L,R and compute sum
O(N^2) or O(N^3)
```

Transformation:

```text
sum(i..j) = prefix[j + 1] - prefix[i]
need prefix[i] = prefix[j + 1] - K
```

Invariant:

```text
map stores frequencies of prefixes before current position
```

Algorithm:

```text
count += freq[currentPrefix - K]
freq[currentPrefix]++
```

Complexity:

```text
O(N) time, O(N) space
```

## Example 2: Minimum Capacity to Ship Packages

Signal:

```text
minimum capacity
can test if capacity X works
```

Monotonicity:

```text
if capacity X works, any larger capacity works
```

Binary search:

```text
lo = max(package)
hi = sum(package)
```

Check:

```text
count days needed with capacity mid
```

Proof:

```text
The predicate works(mid) is monotonic, and binary search preserves the answer interval.
```

## Example 3: Course Schedule

Translation:

```text
course = node
prerequisite = directed edge
can finish all = graph has no cycle
```

Tools:

```text
topological sort with indegree
```

Invariant:

```text
queue contains nodes whose prerequisites are already satisfied
```

If processed count equals `N`, no cycle blocks completion.

---

# PART 12: The One-Page Brain Sheet

Before coding, ask:

```text
What is N?
What complexity fits?
Is order important?
Is the data sorted or can I sort it?
Is it contiguous?
Is there a monotonic predicate?
Is there repeated work?
Can prefix/hash remove repeated work?
Is this a graph in disguise?
Is this a DP state/choice problem?
Can I process queries offline?
What invariant will my loop preserve?
What are the first 5 edge cases?
```

Pattern triggers:

```text
contiguous + positive/monotonic condition -> sliding window
contiguous + exact sum/xor -> prefix + hashmap
sorted + pair/triplet -> two pointers
minimize maximum -> binary search answer
next greater/smaller -> monotonic stack
range query/update -> Fenwick/segment/sparse
tree subtree -> Euler Tour
tree path -> LCA/HLD
connectivity -> DSU
minimum moves unweighted -> BFS
weighted shortest path -> Dijkstra
count/best choices -> DP
large counts -> combinatorics/modulo
```

Final mindset:

> Competitive coding is not magic. It is disciplined transformation. Read the constraints, find the shape, choose the invariant, prove the move, then code carefully.
