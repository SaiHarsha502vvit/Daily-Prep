# 09b. DSA × System Design — Algorithms You Studied, Systems That Use Them

**Navigation**: [← Problem Decomposition](../08_Problem_Decomposition_Framework.md) | [📚 Index](../00_INDEX.md) | [Elite Rounds →](10_Elite_Cross_Domain_Rounds.md)

**Cross-links:**
- [`02_Data_Structures/`](../02_Data_Structures/) — DS foundations
- [`03_Algorithms/`](../03_Algorithms/) — Algorithm chapters
- [`06_OOP_Design/03_System_Design.md`](../../06_OOP_Design/03_System_Design.md) — System Design foundations
- [`20_Interview_Mastery/06_System_Design_Blueprint.md`](../06_System_Design_Blueprint.md) — SD interview framework

---

> **Reading contract**: You studied algorithms and data structures. This file shows the real distributed systems — Redis, Kafka, DNS, Google Search, CDNs, databases — that ARE those data structures at scale. By the end, every system design question will have a DSA concept you recognize underneath it.

---

## Table of Contents

1. [HashMap → Consistent Hashing (CDNs and Distributed Caches)](#1-hashmap--consistent-hashing-cdns-and-distributed-caches)
2. [B-Tree → Database Indexes (How PostgreSQL Finds Your Row)](#2-b-tree--database-indexes-how-postgresql-finds-your-row)
3. [LRU Cache = HashMap + Doubly Linked List → Redis Eviction](#3-lru-cache--hashmap--doubly-linked-list--redis-eviction)
4. [Heap (Priority Queue) → Task Schedulers and Rate Limiting](#4-heap-priority-queue--task-schedulers-and-rate-limiting)
5. [Graph BFS/DFS → Service Dependency Graphs and Package Resolution](#5-graph-bfsdfs--service-dependency-graphs-and-package-resolution)
6. [Bloom Filter → Distributed Set Membership Without Storing Everything](#6-bloom-filter--distributed-set-membership-without-storing-everything)
7. [Trie → Autocomplete and DNS Resolution](#7-trie--autocomplete-and-dns-resolution)
8. [Merge Sort → Kafka Log Compaction and LSM Trees](#8-merge-sort--kafka-log-compaction-and-lsm-trees)

---

## 1. HashMap → Consistent Hashing (CDNs and Distributed Caches)

### 🧠 Foundation — What a HashMap does

A HashMap maps keys to values in O(1) average time using a hash function:

```
key → hash(key) → array index → value
"user:123" → 45829372 → 45829372 % 8 = 4 → slot[4] → { name: "Alice" }
```

**The problem with simple modulo hashing in distributed systems:**

```
Cluster of 4 cache servers: servers[0..3]
key → hash(key) % 4 → which server holds this key

User "alice" → hash("alice") = 5723 → 5723 % 4 = 3 → server[3]
```

Add a 5th server:
```
User "alice" → hash("alice") = 5723 → 5723 % 5 = 3 → still server[3] (lucky)
User "bob"   → hash("bob") = 4820 → 4820 % 4 = 0 → was on server[0]
                              4820 % 5 = 0 → still server[0] (lucky)
User "carol" → hash("carol") = 9241 → 9241 % 4 = 1 → was on server[1]
                                9241 % 5 = 1 → still server[1] (lucky, rarely happens)
```

In practice, when you add or remove one server from N, approximately **(N-1)/N keys must be remapped**. For a 10-server cluster: 9/10 = 90% of cached data is invalidated. This causes a massive cache miss storm, hammering the database.

---

### 🔍 The System Design Solution — Consistent Hashing

Consistent hashing uses a **virtual ring** (conceptually: a circular array of 2^32 positions). Servers are placed at positions on the ring by hashing their IDs. Each key goes to the nearest server clockwise:

```
Ring positions (0 to 2^32-1):

                 0
                 │
       ┌─────────────────┐
    S3 │                 │ S1
       │                 │
  2^32/4 ─────────── 2^32/4 * 2
       │      ring       │
    S2 │                 │ (empty)
       └─────────────────┘
              2^32/4 * 3

Key "alice" → hash("alice") = X → walk clockwise → lands at S1
Key "bob"   → hash("bob") = Y → walk clockwise → lands at S2
```

Adding server S4 only displaces the keys between S3 and S4's new position — roughly 1/N of total keys, not (N-1)/N.

**Used by:** Amazon DynamoDB, Apache Cassandra, Redis Cluster, Chord (distributed hash table), Akamai CDN.

---

### Interview Question Mapping

> "Design a distributed cache for a high-traffic API (1M+ users, 50K req/sec)."

Your answer uses consistent hashing:
1. Hash keys → determine which cache node owns the key
2. When adding nodes: ~1/N keys remigrate, not all
3. Virtual nodes: each physical server occupies multiple ring positions for balanced distribution
4. Replication factor: each key is stored on the next 3 servers clockwise (N=3 typical) for fault tolerance

**DSA you use:** HashMap (O(1) lookup of which node handles a key), sorted array or TreeMap (for the ring, ordered by hash value, binary search to find nearest node).

---

### 📝 Practice Challenges

1. Draw a consistent hashing ring with 3 servers (S1, S2, S3). Add S4 between S1 and S2. Which keys remigrate? Which stay?
2. Without virtual nodes, what happens if all 3 servers hash to the same quarter of the ring? How do virtual nodes fix this?
3. A system uses simple modulo hashing. One server goes down. What percentage of cache keys are invalidated?

---

## 2. B-Tree → Database Indexes (How PostgreSQL Finds Your Row)

### 🧠 Foundation — What a Binary Search Tree does

A BST keeps elements sorted so search is O(log n) instead of O(n):

```
       50
      /  \
    30    70
   /  \  /  \
  20  40 60  80

Search for 40:
  50 → is 40 < 50? Yes → go left
  30 → is 40 < 30? No → go right
  40 → found! (3 comparisons for 7 elements)
```

A B-Tree generalizes this: each node holds **multiple keys** and has **multiple children**. A B-Tree of order M has up to M children per node:

```
B-Tree node (order 4): can hold 3 keys, 4 child pointers

[10 | 30 | 50]
 /    |    |   \
<10 10-30 30-50 >50
```

---

### 🔍 The System Design Equivalent — PostgreSQL B-Tree Index

When you run `CREATE INDEX idx_name ON users(email)`, PostgreSQL builds a B-Tree where:
- Each node holds ~hundreds of `(email_value, row_pointer)` pairs
- The tree is balanced — every leaf is at the same depth
- Search is O(log n) disk reads instead of O(n) (full table scan)

```
SQL: SELECT * FROM users WHERE email = 'alice@example.com'

B-Tree walk:
  Root: ['bob@', 'mary@', 'zach@']
         ← alice comes before bob → go to leftmost child
  Node: ['aaron@', 'adam@', 'alice@']
         ← found alice@ → pointer to row heap location
  Heap: read the actual row from disk
  Total: 3 disk reads (for a table with billions of rows)

vs. Full table scan: read ALL rows → could be millions of disk reads
```

**Why B-Tree over BST for databases?**

Disk reads are 1000× slower than RAM reads. B-Trees are optimized to minimize disk reads by keeping each node large (~8KB, the size of a disk page) and wide (hundreds of keys per node). This keeps the tree height small: a table with 1 billion rows needs only ~5–6 levels in a B-Tree, meaning at most 6 disk reads per lookup.

A binary tree of 1 billion rows would be ~30 levels → 30 disk reads. The fan-out (width of B-Tree nodes) directly reduces tree height.

---

### The Index Decision Matrix

| Query pattern | Index type | Why |
|---------------|-----------|-----|
| `WHERE email = ?` (equality) | B-Tree | fast point lookup O(log n) |
| `WHERE salary BETWEEN 50k AND 80k` (range) | B-Tree | sorted structure, scan range |
| `ORDER BY created_at` | B-Tree | pre-sorted, avoids disk sort |
| `WHERE name LIKE '%smith%'` (leading wildcard) | **None** (B-Tree won't help) | B-Tree is sorted, leading wildcard can't use sorted order |
| `WHERE name LIKE 'smith%'` (trailing wildcard) | B-Tree | can use prefix match |
| `WHERE tags @> ARRAY['redis']` (array contains) | GIN index | inverted index, like a search engine |
| Full-text search | GIN/GiST | different tree structure for text matching |

---

### 💥 War Story — The Index That Made Inserts 10× Slower

A team added 8 indexes to a `transactions` table (logging ~50,000 transactions/minute). Write throughput dropped from 50K/min to 5K/min. Every insert had to update 8 B-Trees.

Lesson: indexes speed reads, slow writes. For write-heavy tables, index only the columns actually used in WHERE/ORDER BY/JOIN in production queries. Check `pg_stat_user_indexes` for `idx_scan = 0` — unused indexes cost write throughput for no read benefit.

---

### 📝 Practice Challenges

1. A PostgreSQL table has 100M rows. Query: `WHERE country = 'US' AND created_at > '2024-01-01'`. Design the optimal composite index and explain which column goes first.
2. Why is `LIKE '%smith%'` unable to use a B-Tree index, but `LIKE 'smith%'` can? Draw the B-Tree to explain.
3. A HashMap gives O(1) lookup. A B-Tree gives O(log n). Why don't databases use HashMaps (hash indexes) as the default?

---

## 3. LRU Cache = HashMap + Doubly Linked List → Redis Eviction

### 🧠 Foundation — LRU Cache Data Structure

LRU (Least Recently Used) cache evicts the item that was accessed longest ago. The classic implementation uses:
- **HashMap** for O(1) key lookup
- **Doubly Linked List** to track recency order (most recent at head, least recent at tail)

```
Cache capacity = 3

PUT "a" → [a] → tail
PUT "b" → [a, b] → tail
PUT "c" → [a, b, c] → tail

GET "a"  → [b, c, a] → move "a" to head (most recent)
PUT "d"  → [c, a, d] → "b" was LRU (at tail) → evict "b"
```

Implementation:

```python
class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.map = {}          # key → node
        self.head = Node()     # dummy head (most recent)
        self.tail = Node()     # dummy tail (least recent)
        self.head.next = self.tail
        self.tail.prev = self.head

    def get(self, key):
        if key not in self.map:
            return -1
        node = self.map[key]
        self._move_to_head(node)  # mark as recently used
        return node.val

    def put(self, key, val):
        if key in self.map:
            self._move_to_head(self.map[key])
            self.map[key].val = val
        else:
            if len(self.map) == self.capacity:
                lru = self._remove_tail()
                del self.map[lru.key]
            node = Node(key, val)
            self.map[key] = node
            self._add_to_head(node)
```

---

### 🔍 The System Design Equivalent — Redis Eviction Policies

Redis is an in-memory key-value store with configurable eviction. Its `maxmemory-policy` setting maps directly to the LRU problem:

```
allkeys-lru    → evict any key using LRU (like the classic problem above)
volatile-lru   → evict only keys with TTL set, using LRU
allkeys-lfu    → evict any key using LFU (Least Frequently Used)
volatile-lfu   → evict keys with TTL using LFU
allkeys-random → evict random key (when access pattern is uniform)
noeviction     → return error when memory full (fail fast — use for session stores)
```

Redis doesn't implement **true** LRU (it would require O(n) memory for the linked list across millions of keys). Instead it uses **approximate LRU**: sample 5 random keys, evict the least recently used among those 5. The `maxmemory-samples` config controls sample size — higher = more accurate, slower.

---

### The Cache Design Decision Tree

```
Is the data expensive to compute? (>50ms)
├── YES → Cache it
│   ├── Does the data change often? (<1min)
│   │   ├── YES → Short TTL (30–60s) or no cache
│   │   └── NO → Long TTL (hours) with explicit invalidation on write
│   ├── What to evict when cache is full?
│   │   ├── All keys equally important → allkeys-lru
│   │   ├── Some keys more important (paid users) → volatile-lru with TTL on non-critical keys
│   │   └── Frequency matters (hot content) → allkeys-lfu
└── NO → Don't cache (complexity not worth it)
```

---

### 💥 War Story — The Redis OOM That Took Down Production

A team set `maxmemory-policy noeviction` and didn't set a `maxmemory` limit. Their cache usage grew to fill the entire 8GB of RAM on the Redis server. When Redis tried to allocate more memory, it returned `OOM command not allowed when used memory > 'maxmemory'` for every write operation. Their API returned 500 errors for all write paths.

Fix: always set `maxmemory` + `maxmemory-policy allkeys-lru` (graceful degradation — cache misses are survivable, full Redis crash is not).

---

### 📝 Practice Challenges

1. Implement LRU with `get` and `put` both O(1). Why is a doubly linked list needed (not singly linked)?
2. A social media feed is cached in Redis. Posts go viral unexpectedly. LRU evicts them (they're "old") just as traffic spikes. Which Redis eviction policy would have been better?
3. Redis is used as a session store (user must stay logged in). What `maxmemory-policy` should you use, and why is `allkeys-lru` dangerous here?

---

## 4. Heap (Priority Queue) → Task Schedulers and Rate Limiting

### 🧠 Foundation — What a Heap does

A min-heap keeps the smallest element at the top, extractable in O(log n):

```
Min-heap of task priorities:
        1
       / \
      3   2
     / \ / \
    5  4 6  7

pop() → returns 1 (minimum), re-heapifies in O(log n)
push(0) → adds 0, bubbles up in O(log n)
```

Operations:
- `push`: O(log n) — insert and bubble up
- `pop` (extract min): O(log n) — remove root and heapify down
- `peek` (read min): O(1) — just look at root

---

### 🔍 The System Design Equivalent — Task Schedulers

A distributed task scheduler (Celery, AWS SQS with priorities, Kubernetes scheduler) is a heap:

```
Job queue ordered by (priority, scheduled_time):

High-priority at 9:00AM  → heap position 0 (runs next)
Medium-priority at 8:59AM → heap position 1
Low-priority at 8:00AM   → heap position 2

A new high-priority job arrives at 9:01AM:
push(high, 9:01AM) → heapify → still position 0 compared to medium? No
→ Actually, the new high-priority < existing medium in priority
→ heapify correctly places it
```

**Kubernetes scheduler** uses a heap ordered by node resource availability. When a Pod needs to be scheduled:
1. Filter nodes that can accommodate the Pod (sufficient CPU, memory)
2. Score remaining nodes
3. **Heap the scored nodes, pick the top**

**Rate limiting with a min-heap:**

Token bucket rate limiting (100 requests/second) can be implemented with a min-heap of request timestamps:

```
Window: last 1 second
Heap: [t-900ms, t-800ms, t-600ms, t-200ms]  ← min = oldest request

New request arrives at time T:
1. Pop timestamps older than T-1000ms from heap (expired)
2. If heap.size() < 100 (capacity): allow request, push(T)
3. Else: reject request (rate limit hit)
```

Sliding window rate limiting is more accurate than fixed window, and the heap gives O(log n) eviction of expired entries vs O(n) for a list scan.

---

### 💥 War Story — The Celery Queue That Starved High-Priority Jobs

A team had a Celery task queue with "high" and "low" priority queues. They ran 10 workers, all consuming from both queues. During a batch import (1M low-priority tasks), the workers consumed low-priority tasks at near-100% utilization. High-priority user-triggered tasks waited for hours.

Fix: separate worker pools with minimum capacity guarantees:
- 8 workers for both queues (can consume low if no high available)
- 2 workers **exclusively** for high-priority (never starved)

This is the **priority queue with starvation prevention** problem. A pure min-heap will age low-priority items if high-priority keep arriving — common fix: increase item priority the longer it waits (aging/priority boosting).

---

### 📝 Practice Challenges

1. Design a task scheduler that handles 1M jobs/second with priorities 1-100. Tasks can have a scheduled time in the future. What data structure? What's the time complexity per enqueue/dequeue?
2. A sliding window rate limiter allows 100 requests per minute. Using a heap, write pseudo-code for `allow(timestamp)` returning true/false.
3. Kubernetes needs to schedule 1000 pods across 50 nodes. What's the worst case if it uses a linear scan to find the best node? How does a heap help?

---

## 5. Graph BFS/DFS → Service Dependency Graphs and Package Resolution

### 🧠 Foundation — BFS and DFS

**BFS** explores neighbors level by level (uses a queue):
```
Graph: A → B, A → C, B → D, C → D

BFS from A: queue = [A]
Process A: queue = [B, C]
Process B: queue = [C, D]
Process C: queue = [D, D]
Process D (dedup): done
Order: A, B, C, D (shortest path guarantees)
```

**DFS** explores as deep as possible before backtracking (uses a stack/recursion):
```
DFS from A: stack = [A]
Process A: push B and C → stack = [C, B]
Process B: push D → stack = [C, D]
Process D: no neighbors → stack = [C]
Process C: D already visited → stack = []
Order: A, B, D, C
```

---

### 🔍 The System Design Equivalent — Service Dependency Resolution

A microservices deployment system must start services in the correct order — a service can't start until all its dependencies are running:

```
Service graph:
  API → Auth, DB, Cache
  Auth → DB
  Cache → (no deps)
  DB → (no deps)

Topological sort (DFS-based):
  Start with nodes having no incoming edges: [Cache, DB]
  Remove them, update graph
  Next: Auth (its dep DB is started)
  Then: API (Auth and DB and Cache all started)
  Order: [Cache, DB, Auth, API]
```

This is topological sort, which only works on a **Directed Acyclic Graph (DAG)**. A cycle means two services depend on each other — an impossible startup order. Kubernetes Helm, Docker Compose, and npm all use topological sort for dependency resolution.

**npm's `package.json` resolution** is also a graph problem:
- Each package is a node
- `dependencies` are directed edges
- `npm install` does a BFS/DFS to collect all transitive dependencies
- Circular dependencies in npm → warning (CommonJS can handle it; ES modules cannot)

---

### BFS vs DFS in System Design

| Problem | Algorithm | Why |
|---------|----------|-----|
| Shortest path in a network | BFS | BFS guarantees minimum hops |
| Dependency startup order | DFS + topological sort | DFS naturally finds finishing order |
| Finding all connected microservices | BFS | Explores all neighbors at current "distance" |
| Detecting cycles in imports | DFS (look for back edge) | Back edge in DFS = cycle |
| Service mesh routing | Dijkstra (weighted BFS) | Shortest latency path, not fewest hops |
| Garbage collection (unreachable objects) | DFS/BFS from roots | Mark all reachable objects; rest = garbage |

---

### 💥 War Story — The Circular Import That Silently Returned `undefined`

A Node.js service had a circular require:
```
a.js: const b = require('./b');
b.js: const a = require('./a');
```

Node.js handles circular CommonJS requires by returning the **partially loaded module** at the point of the cycle. When `b.js` imported `a.js`, `a.js` hadn't finished executing, so `b.js` got `module.exports = {}` (empty object). When `b.js`'s function called `a.doSomething()`, it was `undefined` — but only at runtime, not at require time.

The bug appeared only in production load order — in tests, the import order was different and the cycle resolved differently. 3 hours to diagnose.

Fix: DFS cycle detection at build time with a tool like `madge`:
```bash
npx madge --circular src/
# Output: Circular dependencies: a.js → b.js → a.js
```

---

### 📝 Practice Challenges

1. You're designing a Helm chart for 15 microservices. Service A depends on B and C; B depends on D; C depends on D. Write the topological order for deployment. What if there's a cycle (A depends on B, B depends on A)?
2. A web crawler needs to find all pages within 3 hops of the homepage. Which algorithm? Why?
3. Given a dependency graph of npm packages as an adjacency list, write BFS to find all packages that would break if package "lodash" is removed (i.e., all transitive dependents).

---

## 6. Bloom Filter → Distributed Set Membership Without Storing Everything

### 🧠 Foundation — What a Bloom Filter is

A Bloom filter answers "is this element probably in the set?" using a bit array + multiple hash functions:

```
Bit array: [0, 0, 0, 0, 0, 0, 0, 0]  ← 8 bits, all 0

Add "alice":
  hash1("alice") = 2 → set bit[2] = 1
  hash2("alice") = 5 → set bit[5] = 1
  
Add "bob":
  hash1("bob") = 1 → set bit[1] = 1
  hash2("bob") = 6 → set bit[6] = 1

Bit array: [0, 1, 1, 0, 0, 1, 1, 0]

Query "carol":
  hash1("carol") = 3 → bit[3] = 0 → DEFINITELY NOT in set

Query "dave":
  hash1("dave") = 1 → bit[1] = 1
  hash2("dave") = 5 → bit[5] = 1
  → Both bits are set → PROBABLY in set (but might be false positive from alice+bob)
```

**Guarantees:**
- False negatives: NEVER (if an element is in the set, the filter always says "probably yes")
- False positives: POSSIBLE (filter might say "probably yes" for an element not in the set)

The false positive rate is tunable by adjusting the bit array size and number of hash functions.

---

### 🔍 The System Design Equivalent — Where Bloom Filters Live in Production

**1. Avoiding expensive database lookups for non-existent keys:**

```
User requests profile for userId = "nonexistent_user_xyz"

Without Bloom filter:
  → DB query: SELECT * FROM users WHERE id = 'nonexistent_...' → empty result
  → Costs: 1 DB round trip per "cache miss" for non-existent user
  → Attackers can enumerate IDs to overwhelm DB with empty queries

With Bloom filter:
  → Check Bloom filter: "is this userId probably in the DB?"
  → If NO (definite miss): return 404 immediately (no DB query)
  → If YES (probable hit): query DB (may still be a false positive → 404)
```

Used by: Cassandra, HBase, PostgreSQL (for checking if a row might be in a particular SSTable file).

**2. Google Bigtable** uses Bloom filters at the SSTable level to avoid disk reads for non-existent rows.

**3. npm registry** (content-addressable storage) uses Bloom filters to check if a package version exists before querying the full database.

**4. Chrome's Safe Browsing** uses Bloom filters to check if a URL is probably malicious before contacting Google's servers.

---

### The Space Efficiency

For 1 million items with 1% false positive rate:
- HashSet: ~32MB (storing actual keys)
- Bloom filter: ~1.2MB (bit array)

At 10M items, 1% false positive rate:
- HashSet: ~320MB
- Bloom filter: ~12MB

The tradeoff: no deletions (you can't unset bits without a Counting Bloom Filter), and false positives (tunable but non-zero).

---

### 📝 Practice Challenges

1. Design a URL shortener where `shortCode → longURL` is stored in a database. You want to avoid DB queries for short codes that don't exist (invalid links from bots). How does a Bloom filter help? What's the cost of a false positive in this context?
2. A Bloom filter for 10M items has a 0.1% false positive rate. What would you calculate the false positive rate to be after adding 20M items (double the design capacity)?
3. Why can't you delete items from a standard Bloom filter? What data structure modification allows deletion?

---

## 7. Trie → Autocomplete and DNS Resolution

### 🧠 Foundation — What a Trie does

A Trie (prefix tree) stores strings character by character, sharing common prefixes:

```
Inserting: ["app", "apple", "apply", "apt", "bat"]

        root
       /    \
      a      b
      |      |
      p      a
     / \     |
    p   t    t
    |
   l-e (end: "apple")
   |
   y   (end: "apply")
(end: "app")
```

Search for prefix "app": follow `a → p → p` → all words under this node start with "app" → ["app", "apple", "apply"]

Time: O(m) where m = prefix length. Much faster than scanning all words: O(n × m).

---

### 🔍 The System Design Equivalent — Autocomplete

Google's search autocomplete, Elasticsearch, Redis's built-in autocomplete all use Tries internally:

```
User types "prog"

Trie query:
  root → p → r → o → g → all children
  
Results: ["program", "programming", "programmer", "progress", "progressive"]

Frequency-sorted (each node stores top-K completions by search count):
  1. "programming" (5M searches/day)
  2. "programmer"  (3M)
  3. "program"     (2M)
```

**Why not a HashMap?**

A HashMap of all words gives O(1) for exact lookup but O(n) for prefix search (you'd have to scan all keys). A Trie gives O(m) prefix search where m is the query length — faster for autocomplete.

**DNS Resolution is also a Trie:**

A domain name like `mail.google.com` is a reversed Trie:
```
DNS lookup: mail.google.com
  Root nameservers → .com TLD nameservers → google.com authoritative nameserver → mail.google.com → IP
  
This is a Trie traversal: . → com → google → mail
```

Each DNS server knows one level of the Trie. The root servers know TLDs, TLD servers know second-level domains, etc.

---

### 📝 Practice Challenges

1. Design an autocomplete system for a text editor with 10M words. The user wants top-5 suggestions for any prefix. A naive solution scans all 10M words. How does a Trie help? What extra data do you store at each node for the "top-5" requirement?
2. How does DNS caching (TTL on records) relate to Trie node values being invalidated? If `google.com` changes IP, how long before all resolvers get the new value?
3. A Trie uses too much memory for storing English words (one node per character). What compression technique makes Tries more memory-efficient? (Hint: PATRICIA tree / compressed trie / radix tree)

---

## 8. Merge Sort → Kafka Log Compaction and LSM Trees

### 🧠 Foundation — What Merge Sort does

Merge sort: divide array into halves, sort each recursively, then **merge two sorted halves** in O(n):

```
[8, 3, 1, 5, 2, 7, 4, 6]

Split: [8,3,1,5] | [2,7,4,6]
Sort:  [1,3,5,8] | [2,4,6,7]

Merge (two sorted lists → one sorted):
  Compare heads: 1 < 2 → take 1
  Compare heads: 2 < 3 → take 2
  ...
  Result: [1,2,3,4,5,6,7,8]
```

Key property: merging two sorted lists is O(n) — you scan each list once.

---

### 🔍 The System Design Equivalent — LSM Trees (Log-Structured Merge Trees)

LSM Trees (used by Cassandra, LevelDB, RocksDB, Apache HBase) use the merge-sort pattern to make **writes extremely fast** while keeping reads acceptable:

```
Write path (fast — in-memory):
  1. All writes go to an in-memory buffer (MemTable) — O(1) write
  2. When MemTable is full → flush to disk as a sorted file (SSTable)
  
  MemTable: { key1:v1, key3:v3, key2:v2 } → sort → SSTable_L0_1: [key1:v1, key2:v2, key3:v3]

Multiple SSTables accumulate:
  SSTable_L0_1: [key1:v1, key2:v2, key3:v3]
  SSTable_L0_2: [key2:v2_new, key4:v4]   ← key2 updated

Compaction (merge sort of SSTables):
  Merge L0 files → single sorted L1 file
  Result: [key1:v1, key2:v2_new, key3:v3, key4:v4]  ← newer value wins for key2
```

This is exactly merge sort — merging sorted lists, keeping the most recent value for duplicate keys.

**Kafka Log Compaction** also uses the merge pattern:

```
Topic partition log (append-only):
  offset 0: key="user:1" value="name=Alice"
  offset 1: key="user:2" value="name=Bob"
  offset 2: key="user:1" value="name=Alice_Updated"  ← user:1 appears again

Log compaction: keep only the latest value per key
  → Merges all segments, retains most recent per key
  Result: key="user:2" value="Bob", key="user:1" value="Alice_Updated"
```

---

### The Write Amplification Trade-off

| Storage structure | Write speed | Read speed | Use case |
|-------------------|------------|-----------|----------|
| B-Tree (PostgreSQL) | Moderate (in-place) | Fast (single tree) | OLTP (balanced reads/writes) |
| LSM Tree (Cassandra) | Very fast (append) | Moderate (merge multiple SSTables) | Write-heavy (IoT, logging, timeseries) |
| Heap table (no index) | Fast | Slow (full scan) | Rarely queried temp data |

Write amplification: LSM Trees write data multiple times during compaction (data is rewritten as SSTables merge). This is the cost of fast ingestion.

---

### 📝 Practice Challenges

1. A timeseries database needs to ingest 500K data points/second from IoT sensors. Reads happen in range queries (e.g., last 1 hour of readings). Which storage engine: B-Tree or LSM Tree? Why?
2. In Kafka log compaction, if `key="user:1"` appears at offsets 0, 100, 500, and 9999 — which offset's value is kept after compaction?
3. Why does reading from an LSM Tree require reading multiple SSTables (and how does a Bloom filter help)? Connect this back to Chapter 6 of this file.

---

## Quick Reference: DSA → System Design Cheat Sheet

```
Algorithm / Data Structure │ Where it lives in production
───────────────────────────┼──────────────────────────────────────────────────────────
HashMap + modulo hashing   │ Cache sharding (simple, breaks on resize)
Consistent hashing (ring)  │ CDN routing, Cassandra/DynamoDB partition keys
B-Tree                     │ PostgreSQL/MySQL indexes, B-Tree file systems (ext4)
HashMap (in memory)        │ Redis, Memcached key lookup
LRU = HashMap + DLL        │ Redis eviction, OS page cache, CPU cache replacement
Min-Heap                   │ Kubernetes scheduler, Celery priority queues, Dijkstra
BFS                        │ Shortest path routing, web crawler, peer discovery
DFS + topological sort     │ npm install dependency order, Helm chart deploy order
DFS cycle detection        │ Import cycle detection (madge), deadlock detection
Bloom Filter               │ Cassandra SSTable lookup, Chrome Safe Browsing, HBase
Trie                       │ Search autocomplete, DNS resolution, IP routing tables
Merge sort                 │ LSM Tree compaction (Cassandra/RocksDB), Kafka log compaction
Segment tree               │ Prometheus range queries, time-series aggregations
Union-Find (Disjoint Set)  │ Network partition detection, Kruskal's MST (service mesh)
```

---

*[Back to Index](../00_INDEX.md) | [DSA Foundations](../02_Data_Structures/) | [System Design](../../06_OOP_Design/03_System_Design.md)*


---

## Reality Check

**"DSA and system design are separate interview tracks"** ? Senior rounds increasingly FUSE them � the system design whose one component is a DSA problem ([06_OOP system-design, 03_Algorithms/13]): the rate limiter that is a sliding-window, the top-K trending that is a heap, the deduplication that is a Bloom filter, the consistent-hashing ring. The progressive rounds drill exactly this fusion (design the system, then go deep on the component that is an algorithm), and treating them as separate misses the seam where the DSA lives inside the design.

**"System design doesn't need algorithmic depth"** ? The deep-dive is where a DSA problem surfaces inside the design ([06_OOP/06c internals, 03_Algorithms]): the "how does your top-K actually work" (a heap or count-min-sketch), the "how do you dedupe at scale" (Bloom filter, the space-time trade), the "how do you shard" (consistent hashing). The design provides the context and the algorithm provides the mechanism � and the candidate strong at design but unable to go algorithmically deep on the component fails exactly the deep-dive the fusion rounds test.

**"Algorithm choice in a system is just picking the fastest one"** ? In a system the algorithm choice weighs SCALE, memory, distribution, and approximation-tolerance ([14_MM space-time, 25_Python]): the exact-count that needs too much memory versus the approximate HyperLogLog, the in-memory structure that does not fit the data versus the sketch, the algorithm that must work distributed. The fusion rounds drill choosing the algorithm for the SYSTEM constraints (memory budget, distribution, acceptable error) not the interview-clean fastest-asymptotic � the [14_MM] streaming-and-approximation reality.

**"Estimation and algorithm analysis are different skills"** ? They are the same complexity-reasoning at different scales ([04_Complexity_Analysis, 06_System_Design_Blueprint]): the back-of-envelope QPS-and-storage ([06_OOP] estimation) is the same arithmetic as the algorithm's operation-counting ([04_Complexity]), applied to the system. The fusion rounds reward carrying the complexity intuition across both (the algorithm that is O(n) per request times the QPS is the system's load), and treating estimation and algorithm-analysis as separate misses that they are one reasoning skill at two scales.

**"Cross-domain rounds are just two interviews stapled together"** ? The value is the INTEGRATION � reasoning about the algorithm in the system's context and the system around the algorithm's constraints ([13_Pattern_Composition]'s composition at the interview-round level): the algorithm whose memory cost drives the system's sharding, the system whose scale forces the approximate algorithm. Stapled-together misses the integration the rounds test � the seam where the two domains constrain each other, which is exactly the senior-level thinking (the algorithm and the system as one design) that distinguishes the fused round from two separate ones.
