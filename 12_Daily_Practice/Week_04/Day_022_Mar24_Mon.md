> **Navigation**: [Back to Index](../../00_MASTER_INDEX.md) | [Next >](Day_023_Mar25_Tue.md)

# DAY 022 — Monday, March 24, 2026
## WEEK 04: Trie + Graph BFS/DFS + SQL Indexes

> **Theme**: Trie data structure + Graph traversal mastery + SQL Performance

---

## 📅 SCHEDULE

| Time Block | Duration | Topic |
|------------|----------|-------|
| 0:00–0:30 | 30 min | DS: Trie — Build from Scratch |
| 0:30–1:00 | 30 min | ALGO: Graph BFS — Level-Order on Graphs |
| 1:00–1:20 | 20 min | COMBO: LC 208 + LC 200 |
| 1:20–1:40 | 20 min | REAL-WORLD: Autocomplete = Trie |
| 1:40–2:20 | 40 min | SQL: Indexes — Why Queries Are Slow |
| 2:20–3:00 | 40 min | PROBLEMS: Q1 + Q2 |

---

> ## 📖 CHAPTER REFERENCES — Deep Dive Links
>
> Today's topics link to detailed chapter files for deeper study:
>
> | **DS: Trie (Prefix Tree)** | [Advanced DS: Segment Tree, Trie & More](../../03_Algorithms/07a_Advanced_DS_Core.md) |
> | **ALGO: Graph BFS** | [Graph Fundamentals](../../03_Algorithms/05c_Graphs_Fundamentals.md) |
> | **SQL: Indexes & Performance** | [SQL: Indexes & Performance](../../08_SQL/11_Indexes_Performance.md) |
>
> *Open the linked file for full theory, diagrams, and practice problems.*

---


## 🧱 DS BLOCK: Trie (Prefix Tree)

### WHY Does a Trie Exist?

```
Problem: You have 1 million words. User types "app"
         → Find all words starting with "app"

HashMap approach: Check ALL 1M words → O(N * L)
Trie approach:   Walk 3 nodes a→p→p → O(L) then collect children

Trie = Tree where each edge is a CHARACTER
       Path from root = PREFIX
```


### WHAT: Trie Structure

```
Insert: "apple", "app", "apt", "bat"

            root
           /    \
          a      b
         /        \
        p          a
       / \          \
      p   t          t
     /     (end)     (end)
    l
   /
  e (end)

Each node = array of 26 children (a-z)
           + boolean isEnd
```

### HOW: Complete Java Implementation

```java
class TrieNode {
    TrieNode[] children = new TrieNode[26];
    boolean isEnd = false;
}

class Trie {
    TrieNode root = new TrieNode();
    
    // INSERT: O(L) where L = word length
    void insert(String word) {
        TrieNode curr = root;
        for (char c : word.toCharArray()) {
            int idx = c - 'a';
            if (curr.children[idx] == null) {
                curr.children[idx] = new TrieNode();
            }
            curr = curr.children[idx];
        }
        curr.isEnd = true;
    }
    
    // SEARCH: O(L) — exact match
    boolean search(String word) {
        TrieNode node = findNode(word);
        return node != null && node.isEnd;
    }
    
    // STARTS WITH: O(L) — prefix match
    boolean startsWith(String prefix) {
        return findNode(prefix) != null;
    }
    
    private TrieNode findNode(String s) {
        TrieNode curr = root;
        for (char c : s.toCharArray()) {
            int idx = c - 'a';
            if (curr.children[idx] == null) return null;
            curr = curr.children[idx];
        }
        return curr;
    }
}
```

---

## ⚡ ALGO BLOCK: Graph BFS (Breadth-First Search)

### BFS Template for Graphs (Adjacency List)

```java
// BFS from source node — finds shortest path in unweighted graph
void bfs(List<List<Integer>> graph, int source) {
    boolean[] visited = new boolean[graph.size()];
    Queue<Integer> queue = new LinkedList<>();
    
    visited[source] = true;
    queue.offer(source);
    int level = 0;
    
    while (!queue.isEmpty()) {
        int size = queue.size();  // Process level by level
        for (int i = 0; i < size; i++) {
            int node = queue.poll();
            // Process node at this level
            
            for (int neighbor : graph.get(node)) {
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    queue.offer(neighbor);
                }
            }
        }
        level++;
    }
}
```

### BFS on Grid (Number of Islands pattern)

```java
// LC 200: Number of Islands
int numIslands(char[][] grid) {
    int count = 0;
    int rows = grid.length, cols = grid[0].length;
    int[][] dirs = {{0,1},{0,-1},{1,0},{-1,0}};
    
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (grid[r][c] == '1') {
                count++;
                // BFS flood fill
                Queue<int[]> q = new LinkedList<>();
                q.offer(new int[]{r, c});
                grid[r][c] = '0';  // mark visited
                
                while (!q.isEmpty()) {
                    int[] cell = q.poll();
                    for (int[] d : dirs) {
                        int nr = cell[0] + d[0], nc = cell[1] + d[1];
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols 
                            && grid[nr][nc] == '1') {
                            grid[nr][nc] = '0';
                            q.offer(new int[]{nr, nc});
                        }
                    }
                }
            }
        }
    }
    return count;
}
```

---

## 🗃️ SQL BLOCK: Indexes — Why Queries Are Slow

### WHY: Without Indexes

```sql
-- Without index: database scans EVERY row (Full Table Scan)
-- 1 million rows → checks all 1 million

SELECT * FROM employees WHERE last_name = 'Smith';
-- Without index: O(N) = 1,000,000 comparisons
-- With index:    O(log N) = ~20 comparisons (B-tree)
```

### WHAT: How Indexes Work

```
B-TREE INDEX (default in most databases):

Level 0 (root):     [M]
                    /   \
Level 1:        [D,H]   [R,V]
               / | \    / | \
Level 2:    [A-C][D-G][H-K] [M-Q][R-U][V-Z]
               ↓    ↓    ↓    ↓    ↓    ↓
            (leaf pages point to actual rows)

Finding 'Smith': root → R (go right) → S is in R-U → leaf → found!
Only 3 levels checked instead of 1M rows
```


### HOW: Create and Use Indexes

```sql
-- Create an index
CREATE INDEX idx_employee_lastname ON employees(last_name);

-- Compound index (for queries filtering on multiple columns)
CREATE INDEX idx_emp_dept_salary ON employees(department_id, salary);

-- Check if query uses index (EXPLAIN)
EXPLAIN SELECT * FROM employees WHERE last_name = 'Smith';
-- Look for: "type: ref" or "type: range" (good)
-- Avoid: "type: ALL" (full table scan = bad)

-- When indexes HELP:
-- WHERE clauses, JOIN conditions, ORDER BY, GROUP BY

-- When indexes HURT:
-- INSERT/UPDATE/DELETE (must update index too)
-- Small tables (overhead not worth it)
-- Columns with few distinct values (low cardinality)
```

### Key Rules

```
1. Primary Key = automatic index (clustered)
2. Foreign Keys = ALWAYS add index (JOINs need it)
3. WHERE columns = add index if queried frequently
4. Don't over-index: each index slows writes
5. Compound index order matters: (A, B) helps WHERE A=? AND B=?
                                  but NOT WHERE B=? alone
```

---

## 🎯 PROBLEMS

### Q1: Implement Trie (LC 208) — Medium

```
Implement a trie with insert, search, and startsWith.

Trie trie = new Trie();
trie.insert("apple");
trie.search("apple");   // true
trie.search("app");     // false
trie.startsWith("app"); // true
trie.insert("app");
trie.search("app");     // true
```

**Pattern**: Direct implementation from DS block above.

### Q2: Number of Islands (LC 200) — Medium

```
Given m x n grid of '1's (land) and '0's (water), 
count the number of islands.

Input: grid = [
  ["1","1","0","0","0"],
  ["1","1","0","0","0"],
  ["0","0","1","0","0"],
  ["0","0","0","1","1"]
]
Output: 3
```

**Pattern**: BFS/DFS flood fill from DS block.

---

## ✅ CHECKLIST

- [ ] Built Trie from scratch (insert + search + startsWith)
- [ ] BFS on graph (level-order traversal)
- [ ] BFS on grid (flood fill pattern)
- [ ] SQL: CREATE INDEX, EXPLAIN query
- [ ] Solved LC 208 (Trie)
- [ ] Solved LC 200 (Number of Islands)
- [ ] Can explain: "Why does an index make queries faster?"

---

> **Navigation**: [Back to Index](../../00_MASTER_INDEX.md) | [Next >](Day_023_Mar25_Tue.md)