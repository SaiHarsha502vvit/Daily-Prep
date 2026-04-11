> **Navigation**: [⬅ LinkedList, Stack, Queue, Heap](11_DSA_Problems_LinkedList_Stack_Queue_Heap.md) | [📚 Index](00_INDEX.md) | [Next: DP, Greedy, Backtracking ➡](13_DSA_Problems_DP_Greedy_Backtracking.md)

# File 12 — DSA Problems: Trees, Graphs, Trie & Union-Find

## Logic-First, Code-Second: The 5W+H Way

---

## TREES — Binary Trees & BST

---

### Problem 1: Invert Binary Tree

**WHAT**: Mirror a binary tree — every left child becomes right, every right becomes left.

**WHY recursion naturally models tree structure**:
- A tree is recursive: it's a root with two subtrees
- To invert: swap root's children, then invert each subtree
- Base case: null node → do nothing

**WHEN**: "Transform entire tree structure" → DFS recursion, process each node.

**HOW — The Logic Chain**:
```
invertTree(node):
  → If node is null → return null
  → Swap node.left and node.right
  → invertTree(node.left)
  → invertTree(node.right)
  → Return node
```

**How to translate**: 3 lines of real logic. Swap is `temp = left; left = right; right = temp`. The recursion handles the rest.

**Why this is asked**: Tests if you understand recursive tree traversal. Max Howell (inventor of Homebrew) famously couldn't solve this at Google.

---

### Problem 2: Maximum Depth of Binary Tree

**WHAT**: Find the longest root-to-leaf path.

**WHY bottom-up recursion works**:
- Depth of a tree = 1 + max(depth of left subtree, depth of right subtree)
- Base case: null → depth is 0

**HOW — The Logic Chain**:
```
maxDepth(node):
  → If null → return 0
  → return 1 + max(maxDepth(left), maxDepth(right))
```

**DFS vs BFS approach**: BFS counts levels (each level = +1 depth). DFS does it recursively. Both O(n) time.

**Variant — Minimum Depth**: Same but take `min` instead of `max`. **Trap**: if one child is null, don't take min with 0! A null child doesn't make a leaf — only count paths that reach actual leaves.

---

### Problem 3: Validate Binary Search Tree

**WHAT**: Is this tree a valid BST (every left < root < every right)?

**WHY range checking works**:
- Common mistake: only checking node.left < node < node.right. This misses deeper violations.
- Correct: each node must be within a RANGE (min, max). Left subtree narrows max. Right subtree narrows min.

**WHEN**: "Validate BST" → Pass down valid range or use in-order traversal.

**HOW — The Logic Chain (Range approach)**:
```
isValid(node, min, max):
  → If null → return true
  → If node.val ≤ min OR node.val ≥ max → return false
  → return isValid(node.left, min, node.val) AND
           isValid(node.right, node.val, max)

Initial call: isValid(root, -∞, +∞)
```

**Alternative — In-order traversal**: In-order of BST produces sorted sequence. If any element ≤ previous → invalid. Track `prev` variable.

**Interview insight**: The range approach is cleaner and more intuitive. In-order is elegant but requires careful state management (tracking prev).

---

### Problem 4: Binary Tree Level Order Traversal

**WHAT**: Return nodes grouped by level.

**WHY BFS with level counting**:
- BFS naturally processes level by level
- Before processing each level, note queue size = number of nodes in this level
- Process exactly that many nodes, adding their children for the next level

**HOW — The Logic Chain**:
```
Step 1: Queue with root. Result list.
Step 2: While queue not empty:
        → levelSize = queue.size()
        → levelList = new list
        → For i = 0 to levelSize-1:
          → node = queue.poll()
          → levelList.add(node.val)
          → If node.left ≠ null → queue.add(node.left)
          → If node.right ≠ null → queue.add(node.right)
        → result.add(levelList)
```

**Why capture levelSize BEFORE the loop**: The queue keeps growing as we add children. Capturing size first ensures we only process current-level nodes.

**Variants**: Right side view → take last element of each level. Zigzag → reverse odd levels. Average of levels → sum/count per level.

---

### Problem 5: Lowest Common Ancestor of Binary Tree

**WHAT**: Find the deepest node that is an ancestor of both p and q.

**WHY recursive return-based approach works**:
- If current node IS p or q → return it (this subtree contains a target)
- Recurse left and right
- If both sides return non-null → current node is the LCA
- If only one side returns non-null → that side has the LCA

**HOW — The Logic Chain**:
```
LCA(node, p, q):
  → If node is null → return null
  → If node == p OR node == q → return node
  → left = LCA(node.left, p, q)
  → right = LCA(node.right, p, q)
  → If left ≠ null AND right ≠ null → return node (this is the LCA!)
  → Return left ≠ null ? left : right
```

**The beautiful logic**: Information flows UPWARD. Each subtree reports whether it found a target. The first node where both subtrees report "found" is the LCA.

**For BST**: Much simpler — if both p,q < node → go left. If both > node → go right. Otherwise, current node is LCA (they split here).

---

### Problem 6: Binary Tree Maximum Path Sum

**WHAT**: Find the maximum sum path (can start and end anywhere).

**WHY the "gain" concept works**:
- At each node, compute the maximum "gain" — best sum from this node going DOWN into one subtree
- The "path through this node" = node.val + leftGain + rightGain
- But when returning to parent, we can only go through ONE child (path can't fork)

**HOW — The Logic Chain**:
```
Global: maxSum = -∞

maxGain(node):
  → If null → return 0
  → leftGain = max(0, maxGain(left))    ← 0 means don't take negative path
  → rightGain = max(0, maxGain(right))
  
  → pathThroughNode = node.val + leftGain + rightGain
  → maxSum = max(maxSum, pathThroughNode)
  
  → return node.val + max(leftGain, rightGain)   ← only one side to parent
```

**Key insight**: The function returns the best SINGLE path (for parent's use), but internally considers the SPLIT path (through both children). This dual-purpose is what makes it tricky.

---

### Problem 7: Serialize and Deserialize Binary Tree

**WHAT**: Convert tree to string and back.

**WHY preorder with null markers works**:
- Preorder visits root first → natural for reconstruction
- Recording null children makes the structure UNAMBIGUOUS
- `"1,2,null,null,3,4,null,null,5,null,null"`

**HOW — The Logic Chain**:
```
Serialize (preorder):
  → If null → append "null,"
  → Append node.val + ","
  → Serialize(left)
  → Serialize(right)

Deserialize:
  → Split string by ","
  → Use a queue/index to consume tokens
  → If token == "null" → return null
  → Create node with token value
  → node.left = deserialize(queue)
  → node.right = deserialize(queue)
  → Return node
```

**Why preorder + null markers**: Any other traversal (inorder, postorder) with null markers would also work. Preorder is most natural because we create the root first.

---




## GRAPHS

---

### Problem 8: Number of Islands

**WHAT**: Count connected components of '1's in a grid.

**WHY DFS flood fill works**:
- When you find a '1', that's a new island
- DFS marks all connected '1's as visited (flood fill)
- Continue scanning. Each new unvisited '1' = new island.

**WHEN**: "Count connected components in grid/graph" → DFS/BFS + visited marking.

**HOW — The Logic Chain**:
```
Step 1: Scan every cell
Step 2: When grid[i][j] == '1':
        → count++
        → DFS(i, j): mark as '0' (visited), recurse 4 directions
Step 3: Return count
```

**Why mark as '0' instead of separate visited array**: Saves O(m×n) space. Modifying input is usually OK in interviews (mention you'd use a visited array if input must be preserved).

**BFS alternative**: Same idea, use queue instead of recursion. Better for interview if recursion depth could overflow (very large grids).

---

### Problem 9: Clone Graph

**WHAT**: Create a deep copy of an undirected graph.

**WHY HashMap + DFS works**:
- Need to avoid infinite loops (graph has cycles)
- HashMap maps original node → cloned node
- If already cloned → return the clone. If not → create clone, then clone neighbors.

**HOW — The Logic Chain**:
```
HashMap<Node, Node> visited

clone(node):
  → If null → return null
  → If node in visited → return visited.get(node)
  → Create newNode(node.val)
  → visited.put(node, newNode)    ← BEFORE recursing (breaks cycles)
  → For each neighbor:
    → newNode.neighbors.add(clone(neighbor))
  → Return newNode
```

**Critical order**: Add to map BEFORE recursing. Otherwise, cycles cause infinite recursion.

---

### Problem 10: Course Schedule (Cycle Detection / Topological Sort)

**WHAT**: Can you finish all courses given prerequisites? (Cycle detection in directed graph).

**WHY topological sort detects cycles**:
- Prerequisites form a directed graph
- If there's a cycle → impossible to finish
- Topological sort succeeds only on DAGs (directed acyclic graphs)

**WHEN**: "Order with dependencies", "detect cycle in directed graph" → Topological sort (Kahn's BFS or DFS).

**HOW — Kahn's BFS Logic**:
```
Step 1: Compute in-degree for each node
Step 2: Queue all nodes with in-degree 0 (no prerequisites)
Step 3: While queue not empty:
        → Take node, mark as processed
        → For each neighbor: decrease in-degree
          → If in-degree becomes 0 → add to queue
Step 4: If processed count == total nodes → no cycle → possible
        If processed count < total nodes → cycle exists → impossible
```

**DFS alternative**: Use 3 states (unvisited, in-progress, visited). If we revisit an "in-progress" node → cycle.

**Course Schedule II (return the order)**: Same algorithm, just collect nodes in processing order.

---

### Problem 11: Word Ladder (Shortest Transformation)

**WHAT**: Transform one word to another, changing one letter at a time, each step must be a valid word.

**WHY BFS (not DFS) is essential**:
- Need SHORTEST path → BFS guarantees shortest path in unweighted graph
- Each word is a node. Two words are connected if they differ by exactly one letter.

**HOW — The Logic Chain**:
```
Step 1: Put all words in a set for O(1) lookup
Step 2: BFS from beginWord:
        → For each word in current level:
          → Try changing each character to a-z
          → If new word in set → add to next level, remove from set
Step 3: return level count when endWord found, 0 if not found
```

**Optimization — Bidirectional BFS**: Start from both ends, alternate expansion, meet in the middle. Reduces search space exponentially. Impress interviewers by mentioning this even if you implement standard BFS.

---

### Problem 12: Graph Valid Tree

**WHAT**: Is the given graph a valid tree? (Connected + no cycles + n nodes + n-1 edges).

**WHY Union-Find is elegant here**:
- Tree = connected graph with exactly n-1 edges and no cycles
- Quick check: if edges ≠ n-1 → not a tree
- Union-Find: for each edge, union the two nodes. If they're already in the same set → cycle → not a tree
- Finally: check if all nodes in one component

**HOW — The Logic Chain**:
```
Step 1: If edges ≠ n-1 → return false
Step 2: Initialize Union-Find with n components
Step 3: For each edge (u, v):
        → If find(u) == find(v) → cycle → return false
        → Union(u, v)
Step 4: Return true (n-1 edges + no cycle → connected tree)
```

---

### Problem 13: Dijkstra's — Network Delay Time

**WHAT**: Find shortest time for a signal to reach all nodes from source (weighted graph).

**WHY Dijkstra's algorithm**:
- Finding shortest path in graph with non-negative weights
- Greedy: always process the closest unvisited node
- Min-heap gives O((V+E) log V)

**WHEN**: "Shortest path" + "non-negative weights" → Dijkstra's. "Negative weights" → Bellman-Ford.

**HOW — The Logic Chain**:
```
Step 1: dist[] = infinity for all, dist[source] = 0
Step 2: Min-heap with (0, source)
Step 3: While heap not empty:
        → (d, u) = poll min
        → If d > dist[u] → skip (already found shorter path)
        → For each neighbor v with weight w:
          → If dist[u] + w < dist[v]:
            → dist[v] = dist[u] + w
            → heap.add(dist[v], v)
Step 4: Return max(dist[]) if all reachable, else -1
```

**The lazy deletion trick**: Instead of decreasing key (hard in Java), just add a new entry. Skip stale entries when polled (line: `if d > dist[u] → skip`).

---



> 🔬 **Section Challenge — GRAPHS**
>
> **Challenge 1 (Reasoning):** BFS finds shortest path in unweighted graphs but not in weighted graphs. Why exactly?
> <details><summary>Answer</summary>
>
> BFS explores by 'hop count' (number of edges). Each level = one more edge away from source. All edges are treated as weight=1. In a weighted graph, the 'shortest by hop count' path may not be 'shortest by weight sum'. Example: A→B (weight 1, 1 hop) vs A→C→B (weight 0.1+0.1=0.2, 2 hops). BFS finds A→B (1 hop), Dijkstra finds A→C→B (lower total weight). BFS is optimal ONLY when all edges have equal weight.
> </details>
>
> **Challenge 2 (Design):** Detect if a directed graph has a cycle. Write the algorithm and explain why we need 3 states (not 2).
> <details><summary>Answer</summary>
>
> 3 states: UNVISITED, IN_PROGRESS (currently in DFS path), DONE. DFS: mark node IN_PROGRESS before visiting neighbors. If we reach an IN_PROGRESS node → cycle found. Mark DONE when all neighbors processed. Why 3 states: with 2 (visited/unvisited), we'd get false positives — reaching a VISITED node that was processed in a DIFFERENT DFS subtree is not a cycle. IN_PROGRESS specifically marks nodes in the CURRENT DFS path (potential back edge).
> </details>
>

## TRIE

---

### Problem 14: Implement Trie (Prefix Tree)

**WHAT**: Build a tree where each path from root to a node represents a prefix.

**WHY Trie for string operations**:
- O(L) insert and search where L = word length (vs O(n) for searching list of words)
- Each node has up to 26 children (for lowercase English)
- A boolean flag marks "a complete word ends here"

**WHEN**: "Prefix search", "autocomplete", "word dictionary", "starts with" → Trie.

**HOW — The Logic Chain**:
```
TrieNode: children[26], isEnd boolean

insert(word):
  → node = root
  → For each char c: 
    → index = c - 'a'
    → If children[index] is null → create new node
    → Move to children[index]
  → Mark isEnd = true

search(word):
  → Traverse same as insert
  → Return: reached end of word AND node.isEnd == true

startsWith(prefix):
  → Traverse same as insert
  → Return: reached end of prefix (isEnd doesn't matter)
```

**Why array[26] vs HashMap**: Array is faster for fixed alphabet. HashMap for Unicode or sparse alphabets.

---

### Problem 15: Word Search II (Multiple words in grid)

**WHAT**: Find all words from a dictionary that can be formed in a grid.

**WHY Trie + DFS beats repeated single-word search**:
- Searching each word separately: O(words × m × n × 4^L)
- Build a Trie of all words, then DFS from each cell, traversing the Trie simultaneously
- If current path doesn't match any Trie prefix → prune early

**HOW — The Logic Chain**:
```
Step 1: Build Trie from all words
Step 2: For each cell (i,j) as starting point:
        → DFS(i, j, trieRoot)
Step 3: DFS explores 4 directions, moving down Trie:
        → If current Trie node has isEnd → found a word, add to result
        → If no Trie child for current cell char → prune (return)
        → Mark cell visited, recurse 4 directions, unmark
```

**Optimization**: After finding a word, remove it from Trie to avoid duplicates and prune dead branches.

---

## UNION-FIND

---

### Problem 16: Number of Connected Components

**WHAT**: Count connected components in an undirected graph.

**WHY Union-Find is ideal**:
- Start with n components (each node is its own component)
- For each edge, union the two nodes → decreases component count by 1
- Final answer = remaining component count

**HOW — The Logic Chain**:
```
Step 1: parent[i] = i for all, components = n
Step 2: For each edge (u, v):
        → If find(u) ≠ find(v):
          → union(u, v)
          → components--
Step 3: Return components
```

**Optimizations**:
- **Path compression**: In `find()`, make each node point directly to root
- **Union by rank**: Attach smaller tree under larger tree's root
- Together: nearly O(1) per operation (amortized)

---

### Problem 17: Accounts Merge

**WHAT**: Merge accounts that share an email (same person).

**WHY Union-Find groups related items**:
- Each email is a node. Emails in the same account are connected.
- Union all emails within each account.
- After all unions, each component = one person's merged account.

**HOW — The Logic Chain**:
```
Step 1: For each account: union all its emails with the first email
Step 2: Map each email to its root representative
Step 3: Group emails by root → these are merged accounts
Step 4: Sort emails within each group, attach the name
```

**Why Union-Find over DFS**: Both work. Union-Find is incremental (can handle streaming data). DFS requires building full graph first.

---



> 🔬 **Section Challenge — UNION-FIND**
>
> **Challenge 1 (Reasoning):** Without path compression in Union-Find, what's the worst-case tree height after N unions? With path compression?
> <details><summary>Answer</summary>
>
> Without path compression + union by rank: O(N) height possible (linear chain). With union by rank only: O(log N). With path compression only: amortized O(log N). With BOTH: amortized O(α(N)) where α is the inverse Ackermann function — practically constant (4 for any N up to 10^80). Union by rank prevents tall trees from forming. Path compression flattens existing trees. Together they're nearly optimal.
> </details>
>

## MASTER PROBLEM MAP — Trees, Graphs, Trie, Union-Find

| # | Problem | Core Logic | Pattern | Key Insight |
|---|---------|------------|---------|-------------|
| 1 | Invert Binary Tree | swap children recursively | DFS Transform | 3 lines of logic |
| 2 | Max Depth | 1 + max(left, right) | Bottom-up Recursion | Base: null → 0 |
| 3 | Validate BST | range (min, max) per node | Range Propagation | Pass tighter bounds down |
| 4 | Level Order | BFS + levelSize snapshot | BFS Level-by-Level | Capture queue.size() BEFORE loop |
| 5 | LCA | both sides non-null → LCA | Recursive Return | Info flows upward |
| 6 | Max Path Sum | gain vs path-through | Dual-purpose Return | Return single path, track split path |
| 7 | Serialize Tree | preorder + null markers | Preorder Encoding | Null markers make structure unique |
| 8 | Number of Islands | DFS flood fill | Connected Components | Mark visited by modifying grid |
| 9 | Clone Graph | HashMap original→clone | DFS + Map | Add to map BEFORE recursing |
| 10 | Course Schedule | topological sort / cycle | Kahn's BFS | processed < total → cycle exists |
| 11 | Word Ladder | BFS for shortest | BFS Shortest Path | Try all 26 chars at each position |
| 12 | Graph Valid Tree | n-1 edges + no cycle | Union-Find | Same-set union = cycle |
| 13 | Dijkstra's | greedy closest node | Min-Heap BFS | Lazy deletion: skip stale entries |
| 14 | Implement Trie | children[26] + isEnd | Trie Structure | O(L) per operation |
| 15 | Word Search II | Trie + grid DFS | Trie-guided DFS | Trie prunes impossible paths early |
| 16 | Connected Components | union edges, count groups | Union-Find | components-- on each successful union |
| 17 | Accounts Merge | union shared emails | Union-Find | Group by root after all unions |

---



> 🔬 **Section Challenge — MASTER PROBLEM MAP — Trees, Graphs, Trie, Union-Find**
>
> **Challenge 1 (Reasoning):** BFS finds shortest path in unweighted graphs but not in weighted graphs. Why exactly?
> <details><summary>Answer</summary>
>
> BFS explores by 'hop count' (number of edges). Each level = one more edge away from source. All edges are treated as weight=1. In a weighted graph, the 'shortest by hop count' path may not be 'shortest by weight sum'. Example: A→B (weight 1, 1 hop) vs A→C→B (weight 0.1+0.1=0.2, 2 hops). BFS finds A→B (1 hop), Dijkstra finds A→C→B (lower total weight). BFS is optimal ONLY when all edges have equal weight.
> </details>
>
> **Challenge 2 (Design):** Detect if a directed graph has a cycle. Write the algorithm and explain why we need 3 states (not 2).
> <details><summary>Answer</summary>
>
> 3 states: UNVISITED, IN_PROGRESS (currently in DFS path), DONE. DFS: mark node IN_PROGRESS before visiting neighbors. If we reach an IN_PROGRESS node → cycle found. Mark DONE when all neighbors processed. Why 3 states: with 2 (visited/unvisited), we'd get false positives — reaching a VISITED node that was processed in a DIFFERENT DFS subtree is not a cycle. IN_PROGRESS specifically marks nodes in the CURRENT DFS path (potential back edge).
> </details>
>

## Interview Quick-Fire: Trees / Graphs / Trie / Union-Find

**Q: "DFS or BFS for trees?"**
- DFS (recursion): when you need bottom-up info (depth, path sum, LCA)
- BFS (queue): when you need level-by-level processing

**Q: "When to use Trie vs HashMap?"**
- Trie: prefix queries, autocomplete, word search with pruning
- HashMap: exact match only, no prefix operations needed

**Q: "Topological sort — when Kahn's BFS vs DFS?"**
- Kahn's: easier to get the ordering, detects cycle by count
- DFS: natural for recursive problems, cycle = revisiting in-progress node

**Q: "Union-Find vs DFS for connected components?"**
- Union-Find: incremental (edges arrive one by one), nearly O(1) per op
- DFS: batch processing, simpler if you have full graph upfront

**Q: "How to handle graph with negative weights?"**
- Dijkstra FAILS with negative weights
- Use Bellman-Ford O(VE) or SPFA
- For all-pairs: Floyd-Warshall O(V³)

---


---

## 🏋️ Practice & Interview Questions — Trees & Heaps

### Predict / Trace
**Q1.** BST insert 5,3,7,1,4. Draw the tree. What is inorder traversal?
<details><summary>Answer</summary>

```
      5
     / \
    3   7
   / \
  1   4
```
Inorder: 1, 3, 4, 5, 7 (always sorted for BST!)
</details>

**Q2.** PriorityQueue in Java — is it a min-heap or max-heap by default?
<details><summary>Answer</summary>

**Min-heap** by default (`poll()` returns the minimum). For max-heap: `new PriorityQueue<>(Comparator.reverseOrder())`.
</details>

### LeetCode / Coding
**Q3.** ⭐ Maximum Depth of Binary Tree.
<details><summary>Solution</summary>

```java
int maxDepth(TreeNode root){
    if(root==null) return 0;
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```
</details>

**Q4.** ⭐ Invert Binary Tree.
<details><summary>Solution</summary>

```java
TreeNode invertTree(TreeNode root){
    if(root==null) return null;
    TreeNode tmp=root.left; root.left=root.right; root.right=tmp;
    invertTree(root.left); invertTree(root.right);
    return root;
}
```
</details>

**Q5.** ⭐ Validate Binary Search Tree.
<details><summary>Solution</summary>

```java
boolean validate(TreeNode node, long min, long max){
    if(node==null) return true;
    if(node.val<=min||node.val>=max) return false;
    return validate(node.left,min,node.val)&&validate(node.right,node.val,max);
}
// call: validate(root, Long.MIN_VALUE, Long.MAX_VALUE)
```
</details>

**Q6.** ⭐ Level Order Traversal (BFS with Queue).
<details><summary>Solution</summary>

```java
Queue<TreeNode> q=new LinkedList<>(); q.offer(root);
while(!q.isEmpty()){
    int size=q.size();
    for(int i=0;i<size;i++){
        TreeNode n=q.poll(); process(n);
        if(n.left!=null) q.offer(n.left);
        if(n.right!=null) q.offer(n.right);
    }
}
```
</details>

**Q7.** ⭐ Lowest Common Ancestor of BST.
<details><summary>Solution</summary>

```java
TreeNode lca(TreeNode root, TreeNode p, TreeNode q){
    if(p.val<root.val&&q.val<root.val) return lca(root.left,p,q);
    if(p.val>root.val&&q.val>root.val) return lca(root.right,p,q);
    return root; // split point = LCA
}
```
</details>

**Q8.** ⭐⭐ Binary Tree Right Side View.
<details><summary>Solution</summary>

```java
// BFS, take last element of each level
// or DFS: track level, add to result only when level==result.size()
void dfs(TreeNode node, int level){
    if(node==null) return;
    if(level==res.size()) res.add(node.val);
    dfs(node.right,level+1); dfs(node.left,level+1);
}
```
</details>

**Q9.** ⭐⭐ Kth Smallest Element in BST.
<details><summary>Solution</summary>

```java
// Inorder traversal is sorted — take kth element
int k, result;
void inorder(TreeNode node){
    if(node==null) return;
    inorder(node.left);
    if(--k==0){ result=node.val; return; }
    inorder(node.right);
}
```
</details>

**Q10.** ⭐⭐ Serialize and Deserialize Binary Tree.
<details><summary>Key approach</summary>

BFS level-order with null markers. Serialize: `1,2,3,null,null,4,5`. Deserialize: queue-based reconstruction level by level.
</details>

**Q11.** ⭐⭐⭐ Binary Tree Maximum Path Sum.
<details><summary>Solution</summary>

```java
int maxSum = Integer.MIN_VALUE;
int dfs(TreeNode node){
    if(node==null) return 0;
    int left=Math.max(0,dfs(node.left)), right=Math.max(0,dfs(node.right));
    maxSum=Math.max(maxSum, node.val+left+right); // path through this node
    return node.val+Math.max(left,right); // return single path
}
```
</details>

### Heap / Priority Queue Problems
**Q12.** ⭐ Kth Largest Element in Array.
<details><summary>Solution</summary>

```java
PriorityQueue<Integer> minHeap=new PriorityQueue<>();
for(int n:nums){ minHeap.offer(n); if(minHeap.size()>k) minHeap.poll(); }
return minHeap.peek(); // kth largest
```
</details>

**Q13.** ⭐⭐ Median from Data Stream (two heaps).
<details><summary>Solution</summary>

```java
PriorityQueue<Integer> lo=new PriorityQueue<>(Comparator.reverseOrder()); // max-heap
PriorityQueue<Integer> hi=new PriorityQueue<>(); // min-heap
void addNum(int n){
    lo.offer(n);
    hi.offer(lo.poll());
    if(lo.size()<hi.size()) lo.offer(hi.poll());
}
double findMedian(){ return lo.size()>hi.size()?lo.peek():(lo.peek()+hi.peek())/2.0; }
```
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | BST search avg/worst | O(log N) avg, O(N) worst (degenerate) |
| 2 | Complete binary tree with N nodes height | O(log N) |
| 3 | Heap insertHeapify direction | Bubble up |
| 4 | Heap extractMin direction | Bubble down (sift down) |
| 5 | Java PriorityQueue poll() time | O(log N) |
| 6 | Tree DFS pre/in/post order uses | Stack (or recursion) |
| 7 | Tree BFS uses | Queue |
| 8 | Red-Black Tree guarantee | O(log N) worst case for search/insert/delete |



---

## 🧠 Deep Conceptual Questions — Trees & Heaps

**C1. Why is the inorder traversal of a BST always sorted?**
<details><summary>Deep Answer</summary>

BST invariant: every node's left subtree contains ONLY values less than the node, right subtree ONLY values greater. Inorder traversal visits: left subtree (all smaller) → root → right subtree (all larger). Applied recursively at every node, this produces values in ascending order. This is the defining property that makes BST useful: O(log N) search because at each step, half the tree is eliminated. Broken BST (invariant violated) → inorder not sorted → BST operations return wrong results. That's why "Validate BST" is a fundamental problem.
</details>

**C2. Why does heap not support O(log N) arbitrary deletion (only min/max removal)?**
<details><summary>Deep Answer</summary>

Heap invariant: parent ≤ children (min-heap). When you remove the minimum (root): replace with last element, sift down — O(log N). But for an arbitrary element: you'd need to FIND it first (O(N) scan — heap has no lookup index), then restore the heap property. Without indexing, you can't efficiently locate an element. **d-ary heaps** exist, and indexed heaps (priority queues with decrease-key, like Fibonacci heap) support O(log N) arbitrary deletion — but Java's PriorityQueue doesn't. Dijkstra's with "lazy deletion" (add stale entries, skip when popped) works around this.
</details>

**C3. Why is tree height critical for BST operations?**
<details><summary>Deep Answer</summary>

BST search = walk from root to target, one comparison per level. Operations: O(height). **Balanced BST** (AVL, Red-Black): height = O(log N) → operations O(log N). **Degenerate BST** (insert sorted data: 1,2,3,4,5): each node has only right child → height = N → operations O(N) = linked list performance! This is why TreeMap uses Red-Black Tree (self-balancing): guarantees height ≤ 2*log(N) regardless of insertion order. Red-Black Tree balance condition is weaker than AVL (allows "approximately balanced") but cheaper to maintain: at most 3 rotations per insert (AVL: potentially O(log N)).
</details>

**C4. Why does BFS on a tree need a Queue but DFS needs a Stack (or recursion)?**
<details><summary>Deep Answer</summary>

BFS explores level by level: all children of current nodes must be processed before their children. Queue's FIFO ensures: nodes added to queue at level L are processed before level L+1 nodes (which are added during L's processing). DFS explores as deep as possible before backtracking. Stack's LIFO ensures: the most recently discovered (deepest) node is explored next. Recursive DFS implicitly uses the call stack — each recursive call IS a stack frame push. Iterative DFS when chosen over recursive: avoids stack overflow for very deep trees (N deep right-skewed tree → N recursion levels → StackOverflowError).
</details>

**C5. Lowest Common Ancestor — why does the recursive approach work in O(N)?**
<details><summary>Deep Answer</summary>

The recursive logic: `lca(node, p, q)` returns the LCA if it exists in the subtree of `node`, or p/q if one is found but not the other, or null if neither found. At each node: check left subtree and right subtree results. If BOTH return non-null: this node is the LCA (p is in one subtree, q in another — this is the split point). If only one: that subtree contains both (one is ancestor of the other). The algorithm visits each node once → O(N). For BST: we can do O(log N) by comparing values (if both < node: go left; both > node: go right; one each side: node is LCA).
</details>

**C6. Why is heap built in O(N) time but inserting N elements one-by-one takes O(N log N)?**
<details><summary>Deep Answer</summary>

**Bottom-up `heapify`**: Only nodes with children need sifting-down. Bottom half are leaves (no children) — zero work. Next level: height-1 sift-down each. Total work = Σ(height * nodes at that height) = O(N) (geometric series). **N individual inserts**: each can trigger O(log N) sift-up. Total = O(N log N). The bottom-up approach is 2x faster in practice. Java's `PriorityQueue(Collection)` constructor uses O(N) heapify. `Arrays.stream().forEach(pq::add)` is O(N log N). When converting an array to a heap, always prefer the constructor form.
</details>

**C7. Binary Tree Maximum Path Sum — why can a node contribute ONE branch to its parent but TWO internally?**
<details><summary>Deep Answer</summary>

A path cannot branch twice — if you go left and right from a node, the path "bends" at that node and can't continue upward (a path is a sequence of nodes with edges between them, no branching). So: **to a parent**: this node contributes max(left_gain, right_gain, 0) + node.val — choose the better single branch. **For the global answer**: the path could USE this node as the "bend" — include left_gain + node.val + right_gain. This might be the overall maximum even if it can't be passed upward. The DFS returns the single-branch value to parent but updates the global max with the bend value at each node.
</details>

**C8. Two-heap approach for median — why one max-heap and one min-heap?**
<details><summary>Deep Answer</summary>

Maintain two properties: (1) bottom half of numbers in a max-heap (quick access to max of lower half), (2) top half in a min-heap (quick access to min of upper half). Median = either the top of one heap (odd total) or average of both tops (even total). Invariant: max-heap size ≥ min-heap size, and max-heap.top ≤ min-heap.top. Adding a number: if > min-heap.top → it's in the top half → add to min-heap; else bottom half → add to max-heap. Then rebalance if sizes differ by 2. Both heaps stay O(log N) operations per insert. This pattern generalizes: ANY running statistic that needs the "boundary" between two halves uses this two-heap technique.
</details>


> **Navigation**: [⬅ LinkedList, Stack, Queue, Heap](11_DSA_Problems_LinkedList_Stack_Queue_Heap.md) | [📚 Index](00_INDEX.md) | [Next: DP, Greedy, Backtracking ➡](13_DSA_Problems_DP_Greedy_Backtracking.md)
