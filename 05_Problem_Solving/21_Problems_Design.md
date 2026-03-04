> **Problems 21** | [Prev](20_Problems_Sorting.md) | [Index](../00_MASTER_INDEX.md) | [Next](22_Problems_Recursion_Subsets.md)

---

# 📚 SECTION: DESIGN PROBLEMS

```
┌─────────────────────────────────────────────────────────────────┐
│                DESIGN PROBLEMS FUNDAMENTALS                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  WHAT "DESIGN" MEANS IN INTERVIEWS:                             │
│  Not system design (that's a separate round).                   │
│  These are DATA STRUCTURE DESIGN problems:                      │
│  "Implement class X with operations A, B, C in O(?) time"      │
│                                                                 │
│  THE 5 CATEGORIES:                                              │
│  ┌──────────────┬─────────────────────────────────────────────┐ │
│  │ Cache Design  │ LRU, LFU, TTL Cache                       │ │
│  │ Stack/Queue   │ Min Stack, Max Queue, Stack using Queues   │ │
│  │ Iterator      │ Flatten 2D, Peeking Iterator, Zigzag       │ │
│  │ Trie/Search   │ Autocomplete, Word Dictionary, File System │ │
│  │ Composite     │ Twitter Feed, Browser History, Spreadsheet │ │
│  └──────────────┴─────────────────────────────────────────────┘ │
│                                                                 │
│  DECISION FRAMEWORK:                                            │
│  • Need O(1) get + O(1) put?     → HashMap + LinkedList        │
│  • Need O(1) min/max?            → Two stacks / Monotonic      │
│  • Need prefix search?           → Trie                        │
│  • Need ordered iteration?       → TreeMap / BST               │
│  • Need O(1) random access + insert? → HashMap + ArrayList     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## PART 0: WHY Design Problems — Thinking Like an Architect

```
╔══════════════════════════════════════════════════════════════════════════════╗
║          DESIGN PROBLEMS — COMPLETE UNDERSTANDING & GROWTH MINDSET           ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ THE REAL-WORLD ORIGIN                                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ 📖 LRU Cache: Every CPU has an LRU cache. When L1 cache is full, the        │
│    Least Recently Used line gets evicted. Your browser uses LRU for its      │
│    tab memory management. CDNs use LRU for content caching.                  │
│                                                                              │
│ 📖 Min Stack: Trading systems need to track the minimum stock price seen     │
│    so far in O(1). Each new price is "pushed" and we need instant access     │
│    to the running minimum for stop-loss calculations.                        │
│                                                                              │
│ 📖 Trie: Every search engine autocomplete (Google, VSCode Ctrl+P) uses a    │
│    Trie. When you type "mer", it instantly finds "merge", "mercury",         │
│    "merchant" by walking the prefix tree — O(L) instead of O(N·L).          │
│                                                                              │
│ 📖 Iterator: Java's Iterator pattern (hasNext/next) powers every for-each   │
│    loop. Database cursors, file line readers, paginated APIs — all iterators.│
│                                                                              │
│ FUNDAMENTAL PRINCIPLE:                                                        │
│ Design problems test your ability to COMBINE basic data structures           │
│ to achieve better time complexity than any single structure offers.           │
│                                                                              │
│ LRU Cache = HashMap (O(1) lookup) + Doubly Linked List (O(1) removal)       │
│ Neither alone gives O(1) get AND O(1) eviction. Together they do.            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ THE MENTAL MODEL: "What operations do I need and at what cost?"              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STEP 1: List all required operations                                        │
│  STEP 2: For each, what's the target time complexity?                        │
│  STEP 3: What single DS gives that? If none, COMBINE.                        │
│                                                                              │
│  THE COMBINATION RECIPES:                                                    │
│  ┌─────────────────────────┬────────────────────────────────────────────┐    │
│  │ Need                    │ Combine                                    │    │
│  ├─────────────────────────┼────────────────────────────────────────────┤    │
│  │ O(1) access + O(1) order│ HashMap + Doubly Linked List              │    │
│  │ O(1) access + O(1) rand │ HashMap + ArrayList                       │    │
│  │ O(1) min + O(1) push/pop│ Two stacks (main + min tracker)           │    │
│  │ O(L) prefix + O(1) check│ Trie (array of children)                  │    │
│  │ O(log n) rank queries   │ TreeMap + augmented BST                    │    │
│  └─────────────────────────┴────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ COMMON MISTAKES                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ 1. Starting to code before listing ALL operations and their target complexity│
│ 2. Using a single HashMap when you need both key→value AND order management  │
│ 3. Forgetting edge cases: empty structure, single element, capacity=0        │
│ 4. Not separating the "what" (interface) from "how" (implementation)         │
│ 5. Using LinkedHashMap in interviews — shows framework knowledge but not     │
│    understanding. Implement from scratch first, mention LinkedHashMap as      │
│    "production shortcut".                                                     │
│ 6. Thread-safety: interviewers sometimes ask "what if concurrent?" Know      │
│    ConcurrentHashMap, ReadWriteLock, lock striping.                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## PROBLEM 1: LRU Cache (LC 146) — The #1 Design Problem

```
DIFFICULTY: Medium (but Hard to get right in interview)
COMPANIES: Amazon, Facebook, Google, Microsoft, Apple, Netflix
PATTERN: HashMap + Doubly Linked List

PROBLEM: Design LRU cache with:
  get(key)       → return value if exists, else -1. Mark as used.
  put(key, value)→ insert/update. If at capacity, evict LRU item.
  Both operations must be O(1).

WHY THIS IS #1 INTERVIEW PROBLEM:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Tests: HashMap, Linked List, pointer manipulation, edge cases.
  Asked at nearly EVERY top company. 120+ million submissions on LC.

THE KEY INSIGHT:
  HashMap alone → O(1) get, but can't track access order
  LinkedList alone → tracks order, but O(n) search
  COMBINE: Map<Key, Node> + Doubly Linked List

  ┌─────────────────────────────────────────────────┐
  │                   HashMap                       │
  │ key1 → Node1, key2 → Node2, key3 → Node3        │
  └────────┬──────────┬──────────┬──────────────────┘
           ↓          ↓          ↓
  HEAD ←→ Node1 ←→ Node2 ←→ Node3 ←→ TAIL
  (most recent)              (least recent = evict)

  GET: HashMap O(1) → find node → move to front O(1)
  PUT: create node → add to front → HashMap put O(1)
       if over capacity: remove TAIL.prev → HashMap remove O(1)

SOLUTION:
```

```java
class LRUCache {
    class Node {
        int key, val;
        Node prev, next;
        Node(int k, int v) { key = k; val = v; }
    }
    
    private int capacity;
    private Map<Integer, Node> map = new HashMap<>();
    private Node head = new Node(0, 0);  // Sentinel
    private Node tail = new Node(0, 0);  // Sentinel
    
    public LRUCache(int capacity) {
        this.capacity = capacity;
        head.next = tail;
        tail.prev = head;
    }
    
    public int get(int key) {
        if (!map.containsKey(key)) return -1;
        Node node = map.get(key);
        remove(node);
        addToFront(node);
        return node.val;
    }
    
    public void put(int key, int value) {
        if (map.containsKey(key)) {
            Node node = map.get(key);
            node.val = value;
            remove(node);
            addToFront(node);
        } else {
            if (map.size() == capacity) {
                Node lru = tail.prev;
                remove(lru);
                map.remove(lru.key);
            }
            Node node = new Node(key, value);
            addToFront(node);
            map.put(key, node);
        }
    }
    
    private void remove(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }
    
    private void addToFront(Node node) {
        node.next = head.next;
        node.prev = head;
        head.next.prev = node;
        head.next = node;
    }
}
```

```
COMPLEXITY: O(1) for both get and put | Space O(capacity)
SENTINEL TRICK: Head and Tail dummies avoid null checks — cleaner code.
FOLLOW-UP: "Make it thread-safe" → Use ReentrantReadWriteLock.
```

---

## PROBLEM 2: Min Stack (LC 155)

```
DIFFICULTY: Medium
COMPANIES: Amazon, Google, Bloomberg, Microsoft
PATTERN: Auxiliary Stack

PROBLEM: Design stack supporting push, pop, top, getMin — all in O(1).

KEY INSIGHT:
━━━━━━━━━━━
  Keep a parallel stack that tracks the minimum at each level.
  When you push 5, 3, 7:
    Main:   [5, 3, 7]     ← top = 7
    MinSt:  [5, 3, 3]     ← top = 3 (current min)
  Pop 7:
    Main:   [5, 3]
    MinSt:  [5, 3]        ← min is still 3 ✓

SOLUTION:
```

```java
class MinStack {
    private Deque<Integer> stack = new ArrayDeque<>();
    private Deque<Integer> minStack = new ArrayDeque<>();
    
    public void push(int val) {
        stack.push(val);
        int min = minStack.isEmpty() ? val : Math.min(val, minStack.peek());
        minStack.push(min);
    }
    
    public void pop() {
        stack.pop();
        minStack.pop();
    }
    
    public int top() {
        return stack.peek();
    }
    
    public int getMin() {
        return minStack.peek();
    }
}
```

```
COMPLEXITY: All operations O(1) | Space O(n) for min stack
SPACE OPTIMIZATION: Only push to minStack when new value <= current min.
  Pop from minStack only when popped value == minStack.peek().
```

---

## PROBLEM 3: Implement Trie / Prefix Tree (LC 208)

```
DIFFICULTY: Medium
COMPANIES: Google, Amazon, Facebook, Microsoft
PATTERN: Trie

PROBLEM: Implement Trie with insert, search, startsWith.

WHY TRIE?
━━━━━━━━━
  Searching "apple" in a HashSet: O(L) hash computation
  Searching "app*" prefix in HashSet: O(N·L) check every word
  Searching "app*" in Trie: O(L) just walk 3 nodes

  THE STRUCTURE:
         root
        / | \
       a  b  c
      /
     p
    /
   p
  / \
 l    s      ← "apple" and "apps" share prefix "app"
 |
 e (end)

  Each node has: children[26] + isEnd boolean

SOLUTION:
```

```java
class Trie {
    private Trie[] children = new Trie[26];
    private boolean isEnd = false;
    
    public void insert(String word) {
        Trie node = this;
        for (char c : word.toCharArray()) {
            int idx = c - 'a';
            if (node.children[idx] == null) {
                node.children[idx] = new Trie();
            }
            node = node.children[idx];
        }
        node.isEnd = true;
    }
    
    public boolean search(String word) {
        Trie node = findNode(word);
        return node != null && node.isEnd;
    }
    
    public boolean startsWith(String prefix) {
        return findNode(prefix) != null;
    }
    
    private Trie findNode(String s) {
        Trie node = this;
        for (char c : s.toCharArray()) {
            int idx = c - 'a';
            if (node.children[idx] == null) return null;
            node = node.children[idx];
        }
        return node;
    }
}
```

```
COMPLEXITY: Insert/Search/StartsWith O(L) | Space O(ALPHABET · N · L) worst case
VARIANT: Use HashMap<Character, Trie> instead of array for Unicode support.
```

---

## PROBLEM 4: Design Add and Search Words (LC 211)

```
DIFFICULTY: Medium
COMPANIES: Facebook, Google, Amazon
PATTERN: Trie + DFS for wildcard

PROBLEM: Design word dictionary supporting addWord and search.
  search can contain '.' which matches any letter.
  addWord("bad"); search("b.d") → true; search("b..") → true

INSIGHT: Regular Trie for addWord. DFS with branching for '.'.

SOLUTION:
```

```java
class WordDictionary {
    private WordDictionary[] children = new WordDictionary[26];
    private boolean isEnd = false;
    
    public void addWord(String word) {
        WordDictionary node = this;
        for (char c : word.toCharArray()) {
            int idx = c - 'a';
            if (node.children[idx] == null) node.children[idx] = new WordDictionary();
            node = node.children[idx];
        }
        node.isEnd = true;
    }
    
    public boolean search(String word) {
        return dfs(word, 0, this);
    }
    
    private boolean dfs(String word, int i, WordDictionary node) {
        if (node == null) return false;
        if (i == word.length()) return node.isEnd;
        
        char c = word.charAt(i);
        if (c == '.') {
            // Try ALL children
            for (WordDictionary child : node.children) {
                if (dfs(word, i + 1, child)) return true;
            }
            return false;
        } else {
            return dfs(word, i + 1, node.children[c - 'a']);
        }
    }
}
```

```
COMPLEXITY: addWord O(L) | search O(26^L) worst case (all dots) | typically O(L)
```

---

## PROBLEM 5: LFU Cache (LC 460)

```
DIFFICULTY: Hard
COMPANIES: Amazon, Google, Microsoft
PATTERN: HashMap + HashMap of Doubly Linked Lists

PROBLEM: Design Least Frequently Used cache.
  get(key)       → return value, increase frequency
  put(key, value)→ insert/update. At capacity, evict LEAST frequent.
                   Ties broken by LEAST recently used.
  Both O(1).

THE ARCHITECTURE:
━━━━━━━━━━━━━━━━
  keyMap:  key → Node(key, val, freq)
  freqMap: freq → DoublyLinkedList of nodes with that frequency
  minFreq: tracks current minimum frequency

  GET key:
    1. Find node in keyMap
    2. Remove from freqMap[node.freq]
    3. node.freq++
    4. Add to freqMap[node.freq]
    5. Update minFreq if needed

  PUT key:
    If exists → update value + same as GET
    If capacity full → evict tail of freqMap[minFreq]
    Create node with freq=1, add to freqMap[1]
    minFreq = 1

SOLUTION:
```

```java
class LFUCache {
    class Node {
        int key, val, freq;
        Node prev, next;
        Node(int k, int v) { key = k; val = v; freq = 1; }
    }
    
    class DLList {
        Node head = new Node(0, 0), tail = new Node(0, 0);
        int size = 0;
        DLList() { head.next = tail; tail.prev = head; }
        
        void addFirst(Node node) {
            node.next = head.next; node.prev = head;
            head.next.prev = node; head.next = node;
            size++;
        }
        void remove(Node node) {
            node.prev.next = node.next;
            node.next.prev = node.prev;
            size--;
        }
        Node removeLast() {
            Node lru = tail.prev;
            remove(lru);
            return lru;
        }
    }
    
    int capacity, minFreq;
    Map<Integer, Node> keyMap = new HashMap<>();
    Map<Integer, DLList> freqMap = new HashMap<>();
    
    public LFUCache(int capacity) { this.capacity = capacity; }
    
    public int get(int key) {
        if (!keyMap.containsKey(key)) return -1;
        Node node = keyMap.get(key);
        updateFreq(node);
        return node.val;
    }
    
    public void put(int key, int value) {
        if (capacity == 0) return;
        if (keyMap.containsKey(key)) {
            Node node = keyMap.get(key);
            node.val = value;
            updateFreq(node);
        } else {
            if (keyMap.size() == capacity) {
                DLList minList = freqMap.get(minFreq);
                Node evict = minList.removeLast();
                keyMap.remove(evict.key);
            }
            Node node = new Node(key, value);
            keyMap.put(key, node);
            freqMap.computeIfAbsent(1, k -> new DLList()).addFirst(node);
            minFreq = 1;
        }
    }
    
    private void updateFreq(Node node) {
        DLList oldList = freqMap.get(node.freq);
        oldList.remove(node);
        if (node.freq == minFreq && oldList.size == 0) minFreq++;
        node.freq++;
        freqMap.computeIfAbsent(node.freq, k -> new DLList()).addFirst(node);
    }
}
```

```
COMPLEXITY: O(1) for both get and put | Space O(capacity)
THIS IS THE HARDEST DESIGN PROBLEM. Master LRU first, then LFU.
```

---

## PROBLEM 6: Design HashMap (LC 706)

```
DIFFICULTY: Easy
COMPANIES: Amazon, Google, Apple
PATTERN: Array + Chaining (LinkedList)

PROBLEM: Implement HashMap without using built-in hash libraries.

INSIGHT: Hash function + bucket array + collision handling.

SOLUTION:
```

```java
class MyHashMap {
    private static final int SIZE = 1001;
    private List<int[]>[] buckets;
    
    public MyHashMap() {
        buckets = new List[SIZE];
    }
    
    private int hash(int key) { return key % SIZE; }
    
    public void put(int key, int value) {
        int h = hash(key);
        if (buckets[h] == null) buckets[h] = new ArrayList<>();
        for (int[] pair : buckets[h]) {
            if (pair[0] == key) { pair[1] = value; return; }
        }
        buckets[h].add(new int[]{key, value});
    }
    
    public int get(int key) {
        int h = hash(key);
        if (buckets[h] == null) return -1;
        for (int[] pair : buckets[h]) {
            if (pair[0] == key) return pair[1];
        }
        return -1;
    }
    
    public void remove(int key) {
        int h = hash(key);
        if (buckets[h] == null) return;
        buckets[h].removeIf(pair -> pair[0] == key);
    }
}
```

```
COMPLEXITY: O(n/k) average per operation | Space O(n + k)
FOLLOW-UP: Real HashMap uses power-of-2 sizing, tree-ify at 8 collisions,
           load factor 0.75, rehash at threshold.
```

---

## PROBLEM 7: Insert Delete GetRandom O(1) (LC 380)

```
DIFFICULTY: Medium
COMPANIES: Facebook, Amazon, Google, Uber
PATTERN: HashMap + ArrayList

PROBLEM: Design structure with insert, remove, getRandom — all O(1).

KEY INSIGHT:
━━━━━━━━━━━
  ArrayList → O(1) random access by index
  But O(n) remove from middle...UNLESS:
  Swap target with LAST element, then remove last → O(1)!
  HashMap: val → index in ArrayList

  Insert 1,2,3:
    list: [1, 2, 3]
    map:  {1:0, 2:1, 3:2}

  Remove 2:
    Swap list[1] and list[2]: [1, 3, 2]
    Remove last: [1, 3]
    Update map: {1:0, 3:1}

SOLUTION:
```

```java
class RandomizedSet {
    private List<Integer> list = new ArrayList<>();
    private Map<Integer, Integer> map = new HashMap<>();
    private Random rand = new Random();
    
    public boolean insert(int val) {
        if (map.containsKey(val)) return false;
        map.put(val, list.size());
        list.add(val);
        return true;
    }
    
    public boolean remove(int val) {
        if (!map.containsKey(val)) return false;
        int idx = map.get(val);
        int last = list.get(list.size() - 1);
        
        list.set(idx, last);       // Overwrite with last
        map.put(last, idx);        // Update last's index
        
        list.remove(list.size() - 1);
        map.remove(val);
        return true;
    }
    
    public int getRandom() {
        return list.get(rand.nextInt(list.size()));
    }
}
```

```
COMPLEXITY: All operations O(1) | Space O(n)
VARIANT: LC 381 — allow duplicates. Use Map<Integer, Set<Integer>> for indices.
```

---

## PROBLEM 8: Design Browser History (LC 1472)

```
DIFFICULTY: Medium
COMPANIES: Amazon, Microsoft
PATTERN: Doubly Linked List / Two Stacks / ArrayList

PROBLEM: Implement browser with visit(url), back(steps), forward(steps).

SOLUTION (ArrayList approach — simplest):
```

```java
class BrowserHistory {
    private List<String> history = new ArrayList<>();
    private int current = 0;
    
    public BrowserHistory(String homepage) {
        history.add(homepage);
    }
    
    public void visit(String url) {
        // Clear forward history
        while (history.size() > current + 1) {
            history.remove(history.size() - 1);
        }
        history.add(url);
        current++;
    }
    
    public String back(int steps) {
        current = Math.max(0, current - steps);
        return history.get(current);
    }
    
    public String forward(int steps) {
        current = Math.min(history.size() - 1, current + steps);
        return history.get(current);
    }
}
```

```
COMPLEXITY: visit O(1) amortized | back/forward O(1) | Space O(n)
```

---

## PROBLEM 9: Design Twitter (LC 355)

```
DIFFICULTY: Medium
COMPANIES: Amazon, Twitter
PATTERN: HashMap + Merge K Sorted Lists (Heap)

PROBLEM: Design simplified Twitter:
  postTweet(userId, tweetId)
  getNewsFeed(userId) → 10 most recent tweets from user + followees
  follow(followerId, followeeId)
  unfollow(followerId, followeeId)

INSIGHT: getNewsFeed = Merge K sorted lists (each user's tweets sorted by time)

SOLUTION:
```

```java
class Twitter {
    private int timestamp = 0;
    private Map<Integer, List<int[]>> tweets = new HashMap<>();  // userId → [(time, tweetId)]
    private Map<Integer, Set<Integer>> following = new HashMap<>();
    
    public void postTweet(int userId, int tweetId) {
        tweets.computeIfAbsent(userId, k -> new ArrayList<>())
              .add(new int[]{timestamp++, tweetId});
    }
    
    public List<Integer> getNewsFeed(int userId) {
        // Max-heap by timestamp
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> b[0] - a[0]);
        
        Set<Integer> users = new HashSet<>();
        users.add(userId);
        if (following.containsKey(userId)) users.addAll(following.get(userId));
        
        for (int uid : users) {
            List<int[]> userTweets = tweets.getOrDefault(uid, List.of());
            for (int[] t : userTweets) pq.offer(t);
        }
        
        List<Integer> feed = new ArrayList<>();
        while (!pq.isEmpty() && feed.size() < 10) {
            feed.add(pq.poll()[1]);
        }
        return feed;
    }
    
    public void follow(int followerId, int followeeId) {
        following.computeIfAbsent(followerId, k -> new HashSet<>()).add(followeeId);
    }
    
    public void unfollow(int followerId, int followeeId) {
        if (following.containsKey(followerId)) 
            following.get(followerId).remove(followeeId);
    }
}
```

```
COMPLEXITY: getNewsFeed O(T log T) where T = total tweets of followed users
OPTIMIZATION: Only put last tweet from each user in heap, track index.
```

---

## PROBLEM 10: Serialize and Deserialize Binary Tree (LC 297)

```
DIFFICULTY: Hard
COMPANIES: Amazon, Facebook, Google, Microsoft
PATTERN: BFS/DFS + String encoding

PROBLEM: Encode a binary tree to string and decode back.

SOLUTION (Preorder DFS):
```

```java
public class Codec {
    public String serialize(TreeNode root) {
        StringBuilder sb = new StringBuilder();
        serializeDFS(root, sb);
        return sb.toString();
    }
    
    private void serializeDFS(TreeNode node, StringBuilder sb) {
        if (node == null) { sb.append("null,"); return; }
        sb.append(node.val).append(",");
        serializeDFS(node.left, sb);
        serializeDFS(node.right, sb);
    }
    
    public TreeNode deserialize(String data) {
        Queue<String> queue = new LinkedList<>(Arrays.asList(data.split(",")));
        return deserializeDFS(queue);
    }
    
    private TreeNode deserializeDFS(Queue<String> queue) {
        String val = queue.poll();
        if ("null".equals(val)) return null;
        TreeNode node = new TreeNode(Integer.parseInt(val));
        node.left = deserializeDFS(queue);
        node.right = deserializeDFS(queue);
        return node;
    }
}
```

```
COMPLEXITY: O(n) for both serialize and deserialize | Space O(n)
KEY: Using "null" markers preserves the tree structure uniquely.
```

---

## 📋 CURATED PRACTICE PROBLEMS

### Easy

| # | Problem | LC# | Pattern | Company |
|---|---------|-----|---------|---------|
| 1 | [Design HashMap](https://leetcode.com/problems/design-hashmap/) | 706 | Array + Chaining | Amazon |
| 2 | [Design HashSet](https://leetcode.com/problems/design-hashset/) | 705 | Array + Chaining | Amazon |
| 3 | [Min Stack](https://leetcode.com/problems/min-stack/) | 155 | Auxiliary Stack | Amazon, Google |
| 4 | [Implement Queue using Stacks](https://leetcode.com/problems/implement-queue-using-stacks/) | 232 | Two Stacks | Microsoft |
| 5 | [Implement Stack using Queues](https://leetcode.com/problems/implement-stack-using-queues/) | 225 | Queue rotation | Amazon |
| 6 | [Design Parking System](https://leetcode.com/problems/design-parking-system/) | 1603 | Counter | Amazon |

### Medium

| # | Problem | LC# | Pattern | Company |
|---|---------|-----|---------|---------|
| 1 | [LRU Cache](https://leetcode.com/problems/lru-cache/) | 146 | HashMap + DLL | Amazon, Facebook |
| 2 | [Implement Trie](https://leetcode.com/problems/implement-trie-prefix-tree/) | 208 | Trie | Google, Amazon |
| 3 | [Design Add and Search Words](https://leetcode.com/problems/design-add-and-search-words-data-structure/) | 211 | Trie + DFS | Facebook |
| 4 | [Insert Delete GetRandom O(1)](https://leetcode.com/problems/insert-delete-getrandom-o1/) | 380 | HashMap + ArrayList | Facebook |
| 5 | [Design Browser History](https://leetcode.com/problems/design-browser-history/) | 1472 | DLL / ArrayList | Amazon |
| 6 | [Design Twitter](https://leetcode.com/problems/design-twitter/) | 355 | Heap + HashMap | Amazon, Twitter |
| 7 | [Design Circular Queue](https://leetcode.com/problems/design-circular-queue/) | 622 | Array modular | Amazon |
| 8 | [Design Circular Deque](https://leetcode.com/problems/design-circular-deque/) | 641 | Array modular | Google |
| 9 | [Snapshot Array](https://leetcode.com/problems/snapshot-array/) | 1146 | Binary Search | Google |
| 10 | [Time Based Key-Value Store](https://leetcode.com/problems/time-based-key-value-store/) | 981 | HashMap + Binary Search | Google |
| 11 | [Design Underground System](https://leetcode.com/problems/design-underground-system/) | 1396 | HashMap | Amazon |
| 12 | [Online Stock Span](https://leetcode.com/problems/online-stock-span/) | 901 | Monotonic Stack | Amazon |

### Hard

| # | Problem | LC# | Pattern | Company |
|---|---------|-----|---------|---------|
| 1 | [LFU Cache](https://leetcode.com/problems/lfu-cache/) | 460 | HashMap + Freq DLL | Amazon, Google |
| 2 | [Serialize and Deserialize Binary Tree](https://leetcode.com/problems/serialize-and-deserialize-binary-tree/) | 297 | DFS/BFS encoding | Amazon, Facebook |
| 3 | [Find Median from Data Stream](https://leetcode.com/problems/find-median-from-data-stream/) | 295 | Two Heaps | Amazon, Google |
| 4 | [Design Search Autocomplete](https://leetcode.com/problems/design-search-autocomplete-system/) | 642 | Trie + Priority | Google |
| 5 | [All O(1) Data Structure](https://leetcode.com/problems/all-oone-data-structure/) | 432 | HashMap + DLL | Amazon |
| 6 | [Design Skiplist](https://leetcode.com/problems/design-skiplist/) | 1206 | Probabilistic | — |

---

> **Navigation**: [< Previous](20_Problems_Sorting.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](22_Problems_Recursion_Subsets.md)
