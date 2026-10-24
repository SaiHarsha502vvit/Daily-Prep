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

| Muscle                 | Meaning                              | Example                              |
| ---------------------- | ------------------------------------ | ------------------------------------ |
| Translation            | Convert story to math                | "Cities and roads" becomes graph     |
| Constraint reading     | Know what time complexity is allowed | `N = 2e5` rejects `O(N^2)`           |
| Pattern recognition    | Map signal to known family           | "subarray" + "sum" -> prefix/sliding |
| Proof thinking         | Know why the algorithm is correct    | greedy exchange, DP recurrence       |
| Implementation control | Avoid off-by-one and overflow        | `long`, bounds, indexing             |
| Debugging              | Find the broken invariant fast       | dry run, tiny tests, edge cases      |

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

| Input Size   | Usually Acceptable     | Think About                         |
| ------------ | ---------------------- | ----------------------------------- |
| `N <= 10`    | `O(N!)`, backtracking  | permutations, exhaustive search     |
| `N <= 20`    | `O(2^N * N)`           | bitmask DP, subsets                 |
| `N <= 100`   | `O(N^3)`               | Floyd, interval DP                  |
| `N <= 2,000` | `O(N^2)`               | pair DP, 2D loops                   |
| `N <= 1e5`   | `O(N log N)` or `O(N)` | sorting, heap, Fenwick, graph       |
| `N <= 1e6`   | `O(N)` or near-linear  | prefix, two pointers, sieve         |
| `N >= 1e9`   | `O(log N)` or math     | binary search, formulas, fast power |

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

| Statement Signal               | Real Shape                           |
| ------------------------------ | ------------------------------------ |
| "continuous segment"           | subarray/window/prefix               |
| "choose subset"                | bitmask/backtracking/knapsack        |
| "minimum steps"                | BFS/shortest path                    |
| "dependencies"                 | DAG/topological sort                 |
| "many range queries"           | prefix/Fenwick/segment/sparse/Mo     |
| "kth / rank / count less than" | heap, binary search, order statistic |
| "can we achieve X?"            | binary search on answer              |

## Step 5: Choose an Invariant

An invariant is the truth your algorithm preserves.

Examples:

| Technique       | Invariant                                                 |
| --------------- | --------------------------------------------------------- |
| Sliding window  | Window always satisfies or nearly satisfies condition     |
| Monotonic stack | Stack remains increasing/decreasing                       |
| Dijkstra        | Popped node has final shortest distance                   |
| DSU             | Parent root represents connected component                |
| DP              | `dp[state]` equals best/count answer for that exact state |
| Binary search   | Answer is inside `[lo, hi]`                               |

If you cannot state the invariant, you probably cannot debug the algorithm.

## Step 6: Prove Before Coding

Proof can be short.

Use one of these proof styles:

| Algorithm Family | Proof Style                                |
| ---------------- | ------------------------------------------ |
| Greedy           | Exchange argument / stays ahead            |
| DP               | Induction over state order                 |
| Graph BFS        | Layer expansion proof                      |
| Dijkstra         | Cut property / smallest unsettled distance |
| Binary search    | Monotonic predicate + invariant            |
| Segment tree     | Range partition proof                      |
| DSU              | Component representative invariant         |

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

| Constraint / Phrase                 | Brain Says                  | Common Tools                          |
| ----------------------------------- | --------------------------- | ------------------------------------- |
| `N <= 20`                           | subset states are possible  | bitmask, meet-in-middle               |
| `N <= 40` and subset sum            | split into two halves       | meet-in-the-middle                    |
| `N <= 100`, all-pairs shortest path | cubic ok                    | Floyd-Warshall                        |
| `N <= 2e5`, range queries           | need log or O(1) query      | Fenwick, segment tree, sparse table   |
| static range min                    | no updates                  | sparse table                          |
| range update + range query          | lazy propagation            | segment tree                          |
| point update + prefix/range sum     | simpler tree                | Fenwick                               |
| graph with unweighted edges         | shortest path by levels     | BFS                                   |
| graph with non-negative weights     | shortest path               | Dijkstra                              |
| graph with negative weights         | careful                     | Bellman-Ford, SPFA rarely, potentials |
| tree path queries                   | flatten paths               | HLD, LCA                              |
| subtree queries                     | flatten subtree             | Euler Tour                            |
| exact `K` subarray sum              | prefix difference           | hashmap                               |
| longest at most/at least condition  | sliding window if monotonic | two pointers                          |
| "minimum maximum"                   | binary search answer        | monotonic check                       |
| "number of ways"                    | DP/combinatorics            | modulo arithmetic                     |
| "large exponent"                    | fast power                  | binary exponentiation                 |
| "gcd of many values"                | Euclid, prefix/suffix gcd   | gcd math                              |

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

| Story             | Graph Model                              |
| ----------------- | ---------------------------------------- |
| Word ladder       | word is node, one-letter change is edge  |
| Lock combinations | combination is state, wheel turn is edge |
| Course schedule   | prerequisite edge, topological sort      |
| Grid maze         | cell is node, valid move is edge         |
| Social groups     | users as nodes, relationships as edges   |

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

| Original                    | Compression                        |
| --------------------------- | ---------------------------------- |
| `dp[i][j]` depends on `i-1` | two rows                           |
| 0/1 knapsack                | one row, iterate capacity backward |
| grid paths                  | one row if only top/left needed    |
| visited subset              | bitmask                            |

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

| Mistake Type   | Example                            |
| -------------- | ---------------------------------- |
| Misread        | missed "at most" vs "exactly"      |
| Wrong pattern  | used sliding window with negatives |
| Proof gap      | greedy failed on hidden case       |
| Implementation | off-by-one in prefix               |
| Java trap      | int overflow                       |
| Edge case      | empty answer / duplicates          |

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

## NEW DIAGRAM — Contest Timeline (Time Allocation Per Phase)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│  DIAGRAM: Competitive Coding Contest Timeline — 50-Minute Problem Allocation │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TOTAL CONTEST: ~50 minutes per problem (adjust for total contest length)   │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │                                                                       │    │
│  │  READ PHASE      THINK PHASE          CODE PHASE        TEST PHASE   │    │
│  │  ────────────    ────────────        ────────────       ───────────  │    │
│  │  0 ──────── 5    5 ──────── 15       15 ──────── 40     40 ──── 50  │    │
│  │  │            │               │               │              │      │    │
│  │  │ 5 min      │ 10 min        │ 25 min        │ 10 min       │      │    │
│  │  │            │               │               │              │      │    │
│  │  └────────────┴───────────────┴───────────────┴──────────────┘      │    │
│  │       │              │               │                │              │    │
│  │       ▼              ▼               ▼                ▼              │    │
│  │  ┌──────────┐  ┌───────────┐  ┌───────────┐  ┌──────────────┐        │    │
│  │  │Read twice│  │Brute force│  │Code clean │  │Dry run edge │        │    │
│  │  │Restate in│  │Identify   │  │variables  │  │cases         │        │    │
│  │  │1 sentence│  │bottleneck │  │named well │  │min, max,     │        │    │
│  │  │          │  │Choose     │  │comment key│  │empty, single│        │    │
│  │  │Constraints│  │pattern    │  │parts      │  │negatives,   │        │    │
│  │  │N, time   │  │Prove/verify│ │compile    │  │overflow val │        │    │
│  │  │What asks?│  │transition │  │early +    │  │             │        │    │
│  │  │Edge cases│  │            │  │often      │  │SUBMIT!      │        │    │
│  │  └──────────┘  └───────────┘  └───────────┘  └──────────────┘        │    │
│  │                                                                       │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  STEP-BY-STEP TIME ALLOCATION:                                               │
│                                                                              │
│  ① READ (0-5 min):                                                          │
│     • Read problem statement TWICE before touching keyboard                  │
│     • Restate in one sentence: "Given X, find Y"                            │
│     • Extract N from constraints: n ≤ 10^5 → need O(n log n) or better      │
│     • Identify: sorted? duplicates? negative? updates? → affects pattern    │
│     • Note: 1 second in Java ≈ 1e8 ops → use this to estimate budget        │
│                                                                              │
│  ② THINK (5-15 min):                                                        │
│     • Write brute force first (always) — reveals structure, states, what repeats│
│     • Identify the repeated operation: that is your bottleneck              │
│     • Match bottleneck to data structure: O(1) lookup → HashMap              │
│     • Prove the algorithm (exchange argument for greedy, recurrence for DP)  │
│     • If stuck > 10 min: consider binary search on answer, or model as graph │
│                                                                              │
│  ③ CODE (15-40 min):                                                        │
│     • Code in this order: types → helper functions → main logic → combine   │
│     • Variables named: `left`, `right`, `target`, `count` NOT `i`, `j`, `k` │
│     • Comment the invariant: `// Invariant: window satisfies condition`      │
│     • Compile EARLY (C++: g++ -Wall; Java: javac; Python: python -m py_compile)│
│     • Add fast I/O if needed: ios::sync_with_stdio(false) in C++            │
│     • Verify code compiles WITHOUT RUNNING before proceeding                │
│                                                                              │
│  ④ TEST (40-50 min):                                                        │
│     • Run through test cases mentally AND with actual code:                  │
│       - Minimum input: n=1, empty array, single node                        │
│       - Maximum input: n=10^5, largest values                               │
│       - Edge cases: all same, sorted ascending, sorted descending           │
│       - Negative numbers: if applicable                                     │
│       - Duplicates: if applicable                                           │
│       - Answer = 0 or answer = empty: the 0-case matters!                   │
│     • SUBMIT ONLY AFTER dry run passes on at least 3 test cases            │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │  TIME EMERGENCY RULES:                                                 │    │
│  │  • Stuck for > 10 min → say approach out loud, try constraint check  │    │
│  │  • Code takes > 25 min → explain pseudocode, skip to next problem    │    │
│  │  • TLE after submit → check: is I/O fast? Is loop nested O(n^2)?    │    │
│  │  • Wrong answer → dry run on smallest failing case, add edge cases   │    │
│  │  • Compile error → read the LAST line of error (actual error line)   │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Historical Evolution

> **Why this section**: mental-model pedagogy requires knowing the prior art. The frameworks below all have named predecessors — naming them prevents reinventing the wheel and connects your reasoning to decades of computer-science practice.

| Year | Predecessor | Contribution |
| --- | --- | --- |
| 1970/1977 | ACM | ICPC — competitive programming as a discipline |
| 1968/1973 | Knuth | *TAOCP Vol 1-3* — algorithm analysis and competitive fundamentals |
| 1986 | Bentley | *Programming Pearls* — column-based competitive coding essays |
| 2010 | Halim & Halim | *Competitive Programming 3* — systematic CP training |
| 1983/2011 | Sedgewick | *Algorithms* — textbook algorithm analysis and implementation |

**Evolution narrative**: Competitive coding as a systematic practice emerged from the formalization of algorithm analysis and the competitive programming movement. Donald Knuth's 1968-1973 *Art of Computer Programming* Volumes 1-3 established the mathematical vocabulary for analyzing algorithms and provided the baseline algorithms (sorting, searching, graph traversal) that competitive programmers still build upon. Jon Bentley's 1986 *Programming Pearls* (column in Communications of the ACM, later collected into books in 1986 and 2000) pioneered the case-study approach to competitive coding: here is a problem, here is the naive solution, here is why it is slow, here is the O(N log N) rewrite. The ACM International Collegiate Programming Contest (ICPC, regionals starting 1970, world finals 1977) provided the competitive venue that tested and refined these techniques under time pressure. Steven Halim's 2010 *Competitive Programming 3* synthesized the training methodology into a learnable curriculum. Robert Sedgewick's 1983/2011 *Algorithms* textbooks provided the rigorous analysis and clean implementations that competitive programmers reference daily.

**Modern practice anchor**: Today's competitive coding practice (CP-Algorithms, KACTL, AtCoder Library, LeetCode) directly inherits from the Knuth-Bentley-Halim lineage: mathematical rigor in complexity analysis, clean algorithm templates, and the disciplined problem-solving pipeline (read constraints → find shape → choose invariant → prove move → code carefully).

## Production Reality

> **Why this section**: a mental model is only useful if it predicts what breaks in production. Below are named failure modes tied to this mental model, with debug workflows and modern observability tools.

### Failure Mode 1: TLE (Time Limit Exceeded) — O(n^2) Brute Force at n=10^5

**What goes wrong**: A contestant writes a nested-loop solution. It passes all sample tests (n=100). At n=100,000, O(n^2) = 10 billion operations, and the judge terminates the submission at the 2-second limit. The solution is correct but too slow. The contestant wasted 40 minutes trying to debug "why is my O(n^2) algorithm wrong?" — it wasn't wrong, it was slow.

**Cost**: 40 minutes of contest time lost. Rank drop from top 100 to top 1000. For interviews: candidate submits a correct solution that times out — automatic rejection regardless of correctness.

**Debug workflow**:
1. Always compute complexity before submitting: n=10^5 → O(n log n) or O(n). If nested loops, it's O(n^2) → will TLE.
2. Add fast I/O as a habit: `ios::sync_with_stdio(false); cin.tie(nullptr);` in C++, `sys.stdin.readline` in Python. Slow I/O alone can cause TLE at n=10^5.
3. Use the constraint quick-check: "n ≤ 10^5 → need O(n log n) or O(n)." If your solution is O(n^2), it will TLE before you debug correctness.
4. In practice: run your solution locally on n=10^5 before submitting. If it takes >2 seconds locally, it's a TLE.

### Failure Mode 2: Codeforces Round Penalty — Wrong Submission Counts Against Score

**What goes wrong**: A contestant submits a solution that fails on hidden test cases. The wrong answer is locked in. They spend 25 minutes debugging, submit again — wrong again. Each wrong submission adds 10-20 minute penalty. The contest ends with 2 solved problems and 3 wrong attempts, placing 500th instead of 200th. The penalty system in Codeforces means a single wrong submission can cost 50+ minutes of time.

**Cost**: Rank degradation of 300+ positions. Prize money lost. Psychological impact of seeing the scoreboard drop. For interview prep: wrong submissions on LeetCode "contest mode" reduce your contest rating.

**Debug workflow**:
1. Always dry-run on edge cases before submitting: empty input, single element, all same values, maximum values, negative numbers.
2. Use the 2-submission rule: submit once, then only submit again after dry-running your code on paper for all edge cases.
3. For each problem, write the solution complexity at the top of your code. Before submitting, verify it matches the constraint requirement.
4. Practice on Codeforces with penalty tracking on. Build the habit of only submitting when you've verified edge cases.

### Failure Mode 3: Contest Template Failures — Missing Fast I/O

**What goes wrong**: A contestant copies their template from a previous contest. It has `cin.tie(nullptr)` but is missing `ios::sync_with_stdio(false)`. At n=10^5 with 10^5 queries, `cin` alone takes 3+ seconds vs 0.2 seconds with sync disabled. The solution is O(n log n) correct, but the I/O overhead causes TLE. The contestant spends 20 minutes micro-optimizing the algorithm when the fix is two lines.

**Cost**: 20 minutes wasted on irrelevant optimization. TLE submission. Rank drop. Psychological: "my O(n log n) solution should be fast enough!" — the real problem is I/O.

**Debug workflow**:
1. Always include fast I/O in your template. For C++: `ios::sync_with_stdio(false); cin.tie(nullptr);`. For Python: `import sys; input = sys.stdin.readline`.
2. Time your template's I/O: read 10^5 integers with your template and verify it completes in <0.5 seconds.
3. Use `#ifdef LOCAL` to enable debug output in practice but strip it in submissions.
4. Have a minimal "safe template" with fast I/O, long type aliases, and no extra includes that compiles in <1 second.

### Failure Mode 4: Brute Force O(n^2) at Scale — SLA Breach in System Design Context

**What goes wrong**: A production service needs to find all pairs of users with matching attributes. The engineer uses nested loops (O(n^2)) because it worked in development with 100 users. In production with 1 million users, 10^12 operations run for 6+ hours before timing out. The feature is rolled back.

**Cost**: Feature rollback. Engineering time to implement correct solution. Delayed product launch. If discovered during a live demo, reputational damage.

**Debug workflow**:
1. Always compute: n=10^6 → O(n^2) = 10^12 ops, which is ~2.7 hours at 10^8 ops/sec. Any nested loop over production data volume is a guaranteed timeout.
2. Add a complexity comment in PR review: "// O(n^2) — acceptable for n < 1000" — this prevents O(n^2) from sneaking into production code paths.
3. Implement a "complexity budget" in CI: if a new function has nested loops over unbounded collections, fail the PR with a comment.
4. Use production-like data volumes in staging testing: test with 100K-1M rows before merging any code touching large datasets.

### Modern Production Tools

- **KACTL / AtCoder Library (ACL)**: Pre-built, pre-tested templates with fast I/O included. Use them instead of custom templates — they compile in <2 seconds and have been stress-tested in contests.
- **pytest-benchmark / JMH**: Measure actual throughput of your algorithm on production-like data sizes. Verify O(n log n) beats O(n^2) at the actual n before shipping.
- **Codeforces / AtCoder practice rounds**: Build the habit of dry-running before submitting. The scoreboard consequence (penalty minutes) trains discipline.
- **LeetCode "Contest Mode"**: Practice under time pressure without knowing problem difficulty. Build pattern recognition speed under stress.
- **GitHub Actions complexity linter**: Run static analysis on PR that flags `for i in range(n): for j in range(n)` without a comment explaining why it's acceptable for the given constraints.

## Conceptual Depth & Topical Breadth

> **Why this section**: this mental model rests on a specific invariant, and its variants cover a spectrum of trade-offs. Knowing the invariant and the variants lets you apply the model correctly across problems.

### Invariant

**Time pressure requires pre-built mental templates**. The invariant is that competitive programming success depends on recognizing problem types instantly and applying pre-practiced solutions. Under contest pressure, there is no time for derivation — the solution must flow from pattern recognition. The internal mechanism is **schema-based problem solving**: problems are categorized by structure and solution type, and each category has a standard approach.

### Variants Comparison

| Problem Class | Strategy | Common Pitfalls | Time Allocation |
| --- | --- | --- | --- |
| Constructive | Build incrementally, verify | Missing edge case | High (novel) |
| Interactive | Think from both sides | Wrong query assumption | High (novel) |
| Output-only | Analyze for pattern / formula | Missing insight | Medium |
| Standard (array/tree/graph) | Pattern recognition + template | Implementation bugs | Low (known) |
| Optimization (DP/greedy) | State definition + transition | State explosion | Medium |
| Query-based (segment tree) | Preprocess, answer | Index confusion | Medium |


---

## Reality Check

**"Deep thinking means staring longer at hard problems"** — Deep thinking is STRUCTURED descent, and its stages have names: restate until the problem is yours (invariants exposed by rephrasing), shrink until solvable by hand (n=3, watch your own reasoning — your hand-solution IS an algorithm candidate), perturb the solved version back toward the real one (which step breaks, and why), and hunt the problem's conserved quantity (what stays invariant under the allowed operations — parity, sum modulo k, sorted-relative-order). Staring recycles the same failed retrieval; the stages each force a NEW representation, which is where insight mechanically comes from.

**"Contest intuition is a gift"** — The observable behaviors of high-rated solvers are trainable mechanics: they read constraints as the intended-complexity oracle, they classify the problem's ANSWER structure before solving (monotone? convex? decomposable?), they maintain a personal trick inventory indexed by structure ("contribution counting when sums over all subarrays appear," "invert: count the complement"), and they abandon approaches on a timer with explicit re-entry notes. The gift narrative survives because the mechanics are silent; transcribe any strong solver thinking aloud and the checklist appears verbatim.

**"Editorial reading after solving is optional review"** — Editorial DELTA-MINING is where competitive practice pays compound interest: your solution versus theirs differs in approach (log the trigger you missed), in proof (log the argument style — exchange, invariant, extremal), or in implementation economy (log the idiom). Solved-and-moved-on extracts one unit of value per problem; delta-mined problems extract three — and the extremal-principle and invariant-argument styles editorials teach are precisely the reasoning tools interviews at the highest tier probe with "why is this correct?"

**"Speed comes from typing and template pastes"** — Contest speed decomposes into recognition latency (dominant — trained by breadth of mined problems), decision commitment (second — trained by the timer-and-abandon discipline; rated solvers commit to an approach in minutes and REVISE cheaply, unrated ones oscillate), and only then mechanical throughput. The practice error is optimizing typing while recognition and commitment lag; the diagnostic is your own timeline — where did the 40 minutes go on the last miss? Almost never into keystrokes.

**"Competitive depth transfers automatically to engineering"** — The transfer is real but SELECTIVE, and knowing the selection prevents both over- and under-valuing it: constraint-to-budget arithmetic, adversarial input construction, and invariant-based correctness arguments transfer whole; solo-silent workflow, golf idioms, and disregard for maintainability transfer NEGATIVELY and must be consciously shed. The strongest engineers from competitive backgrounds name this split themselves — they kept the proof habits, retrained the collaboration habits, and can tell you which is which.
