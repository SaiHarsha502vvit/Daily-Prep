# 🕸️ Part 4: Graph Algorithms

> **Navigation**: [← Sorting Algorithms](02_sorting_algorithms.md) | [Chapter overview](../25_Problem_Origins.md) | [Specific Problem Origins →](04_specific_problem_origins.md)
> Page 3 of 4 in **Real-World Problem Origins: Where DSA Concepts Were Born**


## BFS - Breadth First Search

### 📜 The Origin Story (1959 - E.F. Moore)

```
SETTING: Bell Labs, Maze-solving research

PROBLEM:
- Find shortest path through a maze
- Robot needs to navigate warehouse

THE INSIGHT:
"Explore all neighbors at distance 1, then distance 2, then distance 3..."

BFS CONCEPT:
Start: S
       S               Distance 0
      /|\
     A B C            Distance 1
    /| | |\
   D E F G H          Distance 2

Explore in waves:
Wave 1: S
Wave 2: A, B, C
Wave 3: D, E, F, G, H

First time we reach destination = SHORTEST PATH!
```

### 💡 Illustrative Scenario (simplified — not a documented incident)

```
SOCIAL-GRAPH DISTANCES (Facebook Research study, 2016):

PROBLEM:
- How many connections between any two people?
- 2 billion users
- Average person has 338 friends

STUDY FOUND:
- Average distance between two users: about 3.57 steps
- Most pairs of users connected within a handful of steps

HOW THEY CALCULATED:
- BFS from user A
- Count levels until reaching user B
- Process billions of connections

RESULT:
- Shorter than the folk "six degrees"
- BFS made it computable
- Would be impossible without BFS
```

---

🔬 **Section Challenge — BFS - Breadth First Search**

**Challenge 1 (BFS Level Tracking):** BFS finds shortest path in unweighted graphs via FIFO queue. But how do you track the CURRENT LEVEL (distance from source)? The queue doesn't mark level boundaries. **Who** tracks levels? **What** is the most concise way to know when you've finished one level?

<details><summary>Answer</summary>

**Who tracks levels:** You must explicitly track level boundaries. Three approaches: (1) **Size snapshot:** At the start of each level, take `int size = queue.size()`. Process exactly `size` nodes — they are all at the current level. After processing `size` nodes, increment `level`. (2) **Null sentinel:** Enqueue `null` after each level. When you dequeue `null`, increment level and enqueue another `null` (if queue is non-empty). Less clean but sometimes seen in older code. (3) **Two queues:** `currentLevel` and `nextLevel`. Process all of `currentLevel`, then swap to `nextLevel`. **Most concise (size snapshot):** `while (!queue.isEmpty()) { int size = queue.size(); for (int i = 0; i < size; i++) { Node node = queue.poll(); /* process */ for (Node child : node.children) queue.offer(child); } level++; }`. **When level tracking is used:** Word Ladder (LC 127), Minimum Depth of Binary Tree (LC 111), Rotting Oranges (LC 994). Any "minimum steps" problem where answer = BFS level count.

</details>

<details><summary>More detail</summary>

lo=0,hi=4 → mid=2(val=5): 5<6 → lo=3. lo=3,hi=4 → mid=3(val=7): 7>6 → hi=2. lo(3)>hi(2): loop ends, return -1 (not found). Key insight: lo overtakes hi — this is the standard termination condition. `lo` ends at the insertion point where 6 would go.

</details>

## DFS - Depth First Search

### 📜 The Origin Story (1882 - Trémaux's Algorithm)

```
SETTING: French mathematician solving mazes

PROBLEM:
- Navigate a maze
- Don't get lost
- Don't revisit paths

THE INSIGHT:
"Go as deep as possible, then backtrack"

DFS CONCEPT:
Maze:
+---+---+---+
| S |   | E |
+---+   +---+
|   |   |   |
+---+---+---+

DFS Path:
1. Go right until wall
2. Go down until wall
3. Backtrack and try different direction
4. Continue until Exit found

vs BFS:
1. Try ALL neighbors at distance 1
2. Then ALL at distance 2
3. Uses more memory (queue)
```

### 💡 Illustrative Scenario (simplified — not a documented incident)

```
WEB CRAWLING:

PROBLEM:
- Index all web pages
- Web is like a giant graph
- Pages = nodes, Links = edges
- Start from known pages, discover new ones

DFS APPROACH:
Page A → follows link → Page B
Page B → follows link → Page C
Page C → no new links → backtrack
Page B → try another link → Page D
...

WHY DFS (not BFS)?
- Memory efficient
- Go deep into a topic
- Good for specific site crawling

HYBRID APPROACH:
- BFS for breadth (many sites)
- DFS for depth (complete site)

THE SAME IDEA APPEARS IN:
- Search-engine crawlers (real crawlers use prioritised, BFS-like frontiers with politeness limits)
- Site mappers and link checkers
- Web scrapers
```

---

🔬 **Section Challenge — DFS - Depth First Search**

**Challenge 1 (DFS Call Stack Depth Analysis):** DFS on a tree of height h uses h recursive frames. **Who** determines the maximum DFS stack depth? **When** does recursive DFS on a tree of 10^6 nodes crash in Java? **What** is the iterative alternative?

<details><summary>Answer</summary>

**Who determines max depth:** The tree's height. Balanced BST: O(log n) depth = log2(10^6) = 20. Safe. Skewed tree (linked-list shaped): O(n) depth = 10^6. Crashes. **When Java recursive DFS crashes:** Default JVM stack: 512KB-1MB. Each DFS frame uses ~200-500 bytes. 10^6 frames × 200 bytes = 200MB of stack. Crashes at depth ~5000-10000. Skewed trees and graphs with long chains trigger this. **Iterative DFS with explicit stack:** `Deque<Node> stack = new ArrayDeque<>(); stack.push(root); while (!stack.isEmpty()) { Node node = stack.pop(); /* process */ if (node.right != null) stack.push(node.right); if (node.left != null) stack.push(node.left); }`. Uses heap memory (no stack limit). Equivalent to pre-order traversal. **Why left pushed after right:** Stack is LIFO. Push right first, then left — left is popped first, maintaining pre-order (root, left, right) traversal order. **Production rule:** For arbitrary depth graphs (not just trees), always use iterative DFS with explicit stack to avoid StackOverflowError.

</details>

<details><summary>More detail</summary>

lo=0,hi=4 → mid=2(val=5): 5<6 → lo=3. lo=3,hi=4 → mid=3(val=7): 7>6 → hi=2. lo(3)>hi(2): loop ends, return -1 (not found). Key insight: lo overtakes hi — this is the standard termination condition. `lo` ends at the insertion point where 6 would go.

</details>

## Dijkstra's Algorithm

### 📜 The Origin Story (1956 - Edsger Dijkstra)

```
SETTING: Coffee shop in Amsterdam

PROBLEM:
- Find shortest route between two cities
- Roads have different lengths
- Created algorithm in 20 minutes!

THE INSIGHT:
"Always expand the closest unexplored city"

DIJKSTRA'S CONCEPT:
      10      5
  A ----→ B ----→ D
  |       |       ↑
  |5      |2      |3
  ↓       ↓       |
  C ----→ E -----→
      7

Starting from A:
1. A: distance 0 (start)
2. Explore neighbors: B(10), C(5)
3. Closest unexplored: C(5)
4. From C: E(5+7=12)
5. Closest unexplored: B(10)
6. From B: D(10+5=15), E(10+2=12)
7. ... continue

Result: Shortest paths from A to all nodes
```

### 💡 Illustrative Scenario (simplified — not a documented incident)

```
RIDE-HAILING ROUTING:

PROBLEM:
- Millions of ride requests per day
- Find driver closest to rider
- Route driver to rider
- Route to destination
- Consider traffic!

SOLUTION:
- Graph: intersections = nodes, roads = edges
- Edge weight = travel TIME (not distance!)
- Dynamic weights based on traffic
- Dijkstra finds fastest route

SCALE:
- 15 million trips per day
- Each trip: 2 Dijkstra calls
- 30 million Dijkstra executions DAILY!

OPTIMIZATION:
- Precompute common routes
- Hierarchical graphs (highways vs local)
- A* algorithm (Dijkstra + heuristic)
```

---

## 🌳 Part 5: Tree Algorithms

### Binary Search Tree

#### 📜 The Origin Story (1960 - Various researchers)

```
SETTING: Database research at multiple institutions

PROBLEM:
- Need fast insert, search, delete
- Array: Fast search, slow insert/delete
- Linked list: Fast insert/delete, slow search
- Can we have BOTH?

THE INSIGHT:
"Organize data hierarchically with ordering property"

BST PROPERTY:
- Left subtree < node < Right subtree
- Search: O(log n) by halving each step
- Insert: O(log n) find position + O(1) insert
- Delete: O(log n)

PERFECT BALANCE!
```

#### 💡 Illustrative Scenario (simplified — not a documented incident)

```
DATABASE INDEXES:

PROBLEM:
- Database table with 100 million rows
- Query: SELECT * WHERE id = 12345
- Without index: Scan all 100M rows!

SOLUTION - B-Tree (Enhanced BST):
- Create index on 'id' column
- B-Tree: Balanced tree optimized for disk
- Each node = disk block
- Branching factor: ~100 (not just 2)

SEARCH TIME:
- 100M records
- Branching factor 100
- log₁₀₀(100,000,000) ≈ 4 disk reads!

THIS IS WHY:
- Database queries are fast
- Every DBMS uses B-Trees
- Relational databases such as MySQL (InnoDB) and PostgreSQL use B-tree-family indexes
```

---

🔬 **Section Challenge — Binary Search Tree**

**Challenge 1 (BST Search Path Comparison):** A BST stores `[50, 30, 70, 20, 40, 60, 80]`. Search for 40. **Who** traces the path? **When** does BST search degrade to O(n)? **What** property guarantees O(log n) on average?

<details><summary>Answer</summary>

**Path trace for 40:** Root=50. 40 < 50 → go left. Node=30. 40 > 30 → go right. Node=40. Found! Path: 50 → 30 → 40. 2 comparisons (O(log n) for this balanced tree). **When BST degrades to O(n):** Inserting sorted data `[1,2,3,4,5]` into a plain BST creates a right-skewed tree (effectively a linked list). Search for 5 takes 4 comparisons — O(n). This is the worst case. **What guarantees O(log n):** The BALANCE property. A BST is balanced when the height difference between left and right subtrees is bounded (e.g., ≤1 in AVL trees, ≤2h in Red-Black trees). Java's `TreeMap` uses a Red-Black tree — guarantees O(log n) for all operations. **BST vs Binary Search (array):** Array binary search: O(log n) but O(n) for insert/delete. BST: O(log n) for all three (search/insert/delete) in a balanced tree. **BST property:** Left subtree < root < right subtree for every node. This invariant is what enables divide-and-conquer search without examining every element.

</details>

<details><summary>More detail</summary>

lo=0,hi=4 → mid=2(val=5): 5<6 → lo=3. lo=3,hi=4 → mid=3(val=7): 7>6 → hi=2. lo(3)>hi(2): loop ends, return -1 (not found). Key insight: lo overtakes hi — this is the standard termination condition. `lo` ends at the insertion point where 6 would go.

</details>

## #️⃣ Part 6: Hash Tables

### HashMap Collision Resolution

#### 📜 The Origin Story (1953 - H.P. Luhn at IBM)

```
SETTING: IBM Research, early 1950s — fast lookup in large tables (H. P. Luhn's 1953 internal memo)

PROBLEM:
- Compiler has thousands of variable names
- Need O(1) lookup
- But what if two names hash to same index?

COLLISION EXAMPLE:
hash("alice") = 5
hash("bob") = 5  ← Collision!

SOLUTION 1 - CHAINING:
Index 5: alice → bob → null
         (linked list)

SOLUTION 2 - OPEN ADDRESSING:
Index 5: alice
Index 6: bob (probe to next empty)

TRADE-OFFS:
Chaining: Simpler, uses extra memory
Open Addressing: Cache-friendly, more complex
```

#### 💡 Illustrative Scenario (simplified — not a documented incident)

```
HASH-COLLISION DENIAL OF SERVICE (analysed since 2003, widely publicised in 2011):

PROBLEM:
- Attackers send millions of requests
- All requests hash to same bucket!
- HashMap degrades to O(n)
- Server crashes

ATTACK TECHNIQUE:
- Attacker knows hash function
- Crafts inputs that all collide
- "Hash collision attack"

SOLUTION - SipHash:
- Cryptographic hash function
- Attacker can't predict collisions
- Used by the default hash maps of Python, Ruby and Rust (SipHash variants)

THIS IS WHY:
- Java 8+ converts long `HashMap` chains into balanced trees (tree bins)
- Languages switched to secure hashes
- Security matters in DS design!
```

---

🔬 **Section Challenge — HashMap Collision Resolution**

**Challenge 1 (Open Addressing vs Chaining):** HashMap collision resolution: chaining uses `LinkedList/TreeMap` per bucket. Open addressing uses probing (linear, quadratic, double hashing). **Who** uses which in Java? **When** does chaining outperform open addressing? **What** is the load factor threshold where Java HashMap converts a chain to a tree?

<details><summary>Answer</summary>

**Who uses which:** Java 8+ `HashMap` uses chaining (with an upgrade). Each bucket is initially a `LinkedList` (singly linked using `HashMap.Entry`). When a single bucket's chain length reaches 8 AND total capacity >= 64, the chain converts to a `TreeMap` (Red-Black tree) — `O(n)` chain becomes `O(log n)` tree search. **When chaining outperforms open addressing:** High load factors (>0.7). Open addressing with linear probing suffers "primary clustering" — filled slots clump together, making probes longer. Chaining degrades gracefully: even at load factor 1.0, average chain length is 1 (by Poisson distribution). Chaining also handles deletions cleanly (no "tombstone" markers needed). **Java HashMap's load factor threshold:** `TREEIFY_THRESHOLD = 8` for chain → tree conversion. `UNTREEIFY_THRESHOLD = 6` for tree → chain reversion (after removal). `MIN_TREEIFY_CAPACITY = 64` (the capacity must be at least 64 before treeification — below 64, HashMap just resizes instead). **Default load factor:** 0.75 — chosen to balance memory vs time. At 0.75, ~22% of buckets empty (good probe locality) while memory waste is minimal.

</details>

<details><summary>More detail</summary>

Resize threshold = capacity × 0.75. Resizes at: 12 (16→32), 24 (32→64), 48 (64→128), 96 (128→256), 192 (256→512), 384 (512→1024). Total: 6 resizes. Each resize copies all entries to new bucket array. Pre-sizing: `new HashMap<>(1334)` (1000/0.75 ≈ 1334 → next power of 2 = 2048) avoids all resizes.

</details>

**Challenge 2 (Bug Hunt):** Two `Person` objects with same name and age. You override `equals()` to return true but not `hashCode()`. What happens when used as `HashMap` keys?

<details><summary>Answer</summary>

Both objects land in DIFFERENT buckets (different hashCodes → different bucket index). The HashMap doesn't check `equals()` across buckets — it goes straight to one bucket. So `map.get(person2)` returns NULL even though `person1.equals(person2)`. Overriding `equals` without `hashCode` violates the contract and breaks all hash-based collections. Always override both together.

</details>

---

[← Sorting Algorithms](02_sorting_algorithms.md) | [Chapter overview](../25_Problem_Origins.md) | [Specific Problem Origins →](04_specific_problem_origins.md)
