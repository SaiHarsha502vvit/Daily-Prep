# Cross-Domain Algorithm Bridges

> **"The algorithm you studied in class is running in production right now."**
> This file maps each core algorithm to the real system where it lives — so theory connects to engineering.
> Format per bridge: **Algorithm concept → Production system → Exact mechanism → Failure if broken**.

---

## B01 · Merge Sort → Database Merge Join

**Algorithm**: Merge sort merges two sorted halves in O(n) — compare front elements, take smaller, advance pointer.

**Production system**: PostgreSQL / Oracle `MERGE JOIN` (also called Sort-Merge Join).

**Exact mechanism**: When both input relations are sorted on the join key, the database engine streams through them with two pointers — identical to merge sort's merge step. Cost: O(n + m) where n, m are the table sizes, vs O(n×m) for nested-loop join.

```sql
-- PostgreSQL will choose merge join when both sides have an index on the join key:
EXPLAIN SELECT * FROM orders o JOIN customers c ON o.customer_id = c.id;
-- → Merge Join  (cost=0.00..234.56)
--     → Index Scan on customers (sorted on id)
--     → Index Scan on orders (sorted on customer_id)
```

**Failure if broken**: unsorted input → database falls back to hash join or nested-loop join → O(n²) query for large tables → timeout. Real incident pattern: missing index on join column → full table sort before every join → 10× query slowdown after data growth.

**What to remember**: any "streaming merge of sorted sources" is merge sort's merge step. Shows up in: external sort (merge phase), k-way merge for log aggregation, merging sorted Kafka topic partitions.

---

## B02 · BFS → Kafka Consumer Group Rebalance

**Algorithm**: BFS explores all nodes at distance d before moving to distance d+1. Level-by-level expansion guarantees shortest-hop-count path.

**Production system**: Kafka's consumer group coordinator uses a BFS-like assignment algorithm when rebalancing partitions across consumers.

**Exact mechanism**: When consumers join/leave a group, the group coordinator builds a bipartite graph: consumers on one side, topic partitions on the other. BFS-based round-robin or range assignment finds the partition allocation that minimizes the maximum partition count any single consumer holds (load balancing = shortest-path assignment in the assignment graph).

**Failure if broken**: uneven partition assignment (starved consumers, overloaded consumers) → throughput imbalance → consumer lag → eventual DLQ overflow. Real incident: adding a consumer mid-processing without allowing rebalance to complete → some partitions processed twice (by old + new consumer during transition).

**What to remember**: any "level-by-level resource assignment that minimizes hops from source to all sinks" is a BFS application. Also: BFS = shortest path in message-passing systems where hop count = latency.

---

## B03 · Dijkstra → OSPF Network Routing

**Algorithm**: Dijkstra finds the shortest weighted path from a source to all vertices. Greedy extraction of the minimum-distance vertex, then relaxation of its edges.

**Production system**: OSPF (Open Shortest Path First) — the interior gateway routing protocol used in corporate and ISP networks.

**Exact mechanism**: Each router runs Dijkstra on its local copy of the network topology (link-state database). Each router = vertex; each link = weighted edge (weight = bandwidth, latency, or admin cost). Dijkstra produces the shortest-path tree → the router's forwarding table.

**Why this works**: OSPF guarantees all routers converge to the same topology view (via flooding). Once topology is consistent, Dijkstra produces identical results on all routers → consistent forwarding without loops.

**Failure if broken**: negative-weight edge (e.g., misconfigured negative admin cost) → Dijkstra produces wrong routing table → routing loop → packet count-to-infinity → network segment unreachable. OSPF uses only non-negative link costs precisely because the algorithm requires it.

**What to remember**: any "distributed shortest-path computation on a stable graph where all weights ≥ 0" is Dijkstra. Also drives Google Maps turn-by-turn, GPS navigation, CDN nearest-PoP selection.

---

## B04 · DFS Topological Sort → Build Systems (Gradle/Maven/Bazel)

**Algorithm**: DFS-based topological sort: post-order DFS produces a valid topological ordering of a DAG (directed acyclic graph). Kahn's BFS-based variant: start with in-degree-0 nodes, process, decrement neighbors' in-degrees.

**Production system**: Gradle, Maven, Bazel — any dependency-based build system.

**Exact mechanism**: each build target = vertex; "A depends on B" = directed edge A→B. Topological sort determines compilation order: no target is compiled before all its dependencies. Gradle's task graph is a DAG; `gradle build` runs Kahn's algorithm to schedule tasks in dependency order.

**Failure if broken**: circular dependency (A→B→A) → topological sort fails → Gradle throws `CircularDependencyException` → build fails with no output. Maven uses a simpler cycle detection but has historically produced silent incorrect builds when circular imports were split across modules.

**What to remember**: any "order tasks so dependencies always complete first" is topological sort. Also: CSS cascade (specificity order), webpack module bundling order, database migration ordering, service startup order in Kubernetes.

---

## B05 · Union-Find → Network Partition Detection / Kruskal's MST

**Algorithm**: Union-Find maintains connected components dynamically. `union(u, v)` merges components; `find(u)` returns component ID. Near-O(1) per operation with path compression + rank.

**Production system 1 — Network monitoring**: detect when a network segment becomes isolated. Each switch/router = a node. Physical links = union operations. `find(a) ≠ find(b)` → a and b are in different partitions → alert.

**Production system 2 — Kruskal's MST in network design**: used when designing minimum-cost spanning trees for data center topologies or backbone networks. Sort edges by cost; add edge if `find(u) ≠ find(v)` (no cycle); `union(u, v)`.

**Failure if broken**: missed union on link restoration → algorithm reports partition even after link is restored → false alert → human escalation for a non-existent outage. Real production issue: idempotent union (union of already-connected nodes must be a no-op) not handled correctly → overcounting.

**What to remember**: any "are these two things still connected?" query over a dynamic set of merges is Union-Find. Also: image segmentation (connected pixels), duplicate account detection (same entity, different IDs), social network friend-of-friend (same component?).

---

## B06 · Hash Table (Consistent Hashing) → Distributed Cache Sharding

**Algorithm**: Standard hashing maps key → bucket via `hash(key) % n`. Consistent hashing maps both keys and servers to a ring of positions; each key is owned by the nearest server clockwise.

**Production system**: Memcached, Redis Cluster, Amazon DynamoDB, Cassandra.

**Exact mechanism**: With n servers, adding one server in consistent hashing reassigns only ~1/n fraction of keys. With standard modulo hashing, adding one server reassigns ~(n-1)/n of all keys → cache stampede → all traffic hits the database simultaneously.

**Failure if broken**: standard modulo hashing used for cache sharding → any server add/remove invalidates ~83% of cache keys (for n=6) → simultaneous miss storm → database overload → cascading failure. This is the "cache avalanche" production pattern.

**What to remember**: hash table = O(1) lookup; consistent hash = O(1) lookup + O(1/n) resharding cost. The birthday paradox (~√n keys needed for first collision in n-bucket table) is the mathematical reason load factor > 0.75 degrades to O(n).

---

## B07 · Heap / Priority Queue → OS Process Scheduler

**Algorithm**: min-heap maintains the minimum-priority element at the root. `insert` O(log n), `extractMin` O(log n), `peek` O(1).

**Production system**: Linux Completely Fair Scheduler (CFS) uses a red-black tree (functionally equivalent to a priority queue) keyed by `vruntime` (virtual runtime = actual runtime scaled by priority).

**Exact mechanism**: each runnable process is inserted into the RB-tree with its vruntime as the key. The scheduler always runs the process with the lowest vruntime (leftmost node = minimum). After running for a timeslice, the process's vruntime increases → it moves right in the tree → another process becomes the minimum.

**Failure if broken**: if priority queue operations degrade to O(n) (e.g., using a sorted array), scheduling overhead becomes O(n) per context switch → system throughput collapses under high process count. Real issue: naive `O(n)` task queues in embedded systems → scheduler becomes the bottleneck at ~100 tasks.

**What to remember**: "always process the highest-priority pending task" = priority queue. Also: A* search (min-heap on f-score), Huffman encoding (two minimum-frequency merges), Dijkstra (min-heap on distance), event-driven simulation (min-heap on event time).

---

## B08 · Dynamic Programming → Smith-Waterman DNA Alignment

**Algorithm**: 2D DP table where `dp[i][j]` = best alignment score for prefixes of length i and j. Recurrence fills the table bottom-up; backtracking through max-scoring cells recovers the alignment.

**Production system**: BLAST (Basic Local Alignment Search Tool), BWA (Burrows-Wheeler Aligner) — tools used in genome sequencing pipelines.

**Exact mechanism**: Smith-Waterman (local alignment) is a DP variant of edit distance: `dp[i][j] = max(0, dp[i-1][j-1] + match/mismatch, dp[i-1][j] + gap, dp[i][j-1] + gap)`. The `max(0, ...)` ensures local (not global) alignment. Used to align short sequencing reads (~150bp) against a reference genome (3.2 billion bp for humans).

**Scale challenge**: full O(n×m) DP on genome-scale inputs is infeasible. BLAST uses a heuristic: find short exact k-mer matches (seed), extend only near seeds. This reduces practical runtime to O(n + hits × extension_cost) — still DP at its core, but seeded.

**What to remember**: "score / count / find optimal arrangement of two sequences" → DP on a 2D table. Appears in: edit distance (autocorrect, diff), sequence alignment (genomics), string matching, regex NFA simulation.

---

## B09 · Bloom Filter → Database / CDN Cache Existence Queries

**Algorithm**: Bloom filter = array of m bits + k hash functions. Insert: set k bit positions. Query: check k bit positions — if all 1, probably present; if any 0, definitely absent. False positives possible; no false negatives.

**Production system**: Google BigTable, Apache HBase (SSTable compaction), Apache Cassandra (per-SSTable bloom filter), CDN edge caches.

**Exact mechanism in HBase**: each HFile (on-disk SSTable) has an associated Bloom filter. On a read request, HBase checks the Bloom filter before opening the HFile. If the Bloom filter says "not present" → skip the file. This avoids expensive disk reads for ~95% of "key not found" queries, reducing read amplification from O(files) to O(1) on average.

**Failure if broken**: without Bloom filter, every read-miss must scan all SSTables on disk → read amplification = number of SSTable files → read latency spikes after many compactions. Observed: HBase without Bloom filters shows 10–50× read latency increase under random-read workloads.

**Parameters**: false positive rate ≈ (1 − e^{−kn/m})^k; optimal k = (m/n) ln 2. For 1% FP rate: ~9.6 bits per element. Space cost: ~10× smaller than a full set.

---

## B10 · Trie → Auto-Complete / IP Routing (LPM)

**Algorithm**: Trie (prefix tree) stores strings character by character. All strings sharing a prefix share a path from the root. Insert/search/prefix-query all O(L) where L = string length.

**Production system 1 — Auto-complete**: Google Search, IDEs, terminal shells. The Trie stores indexed terms; a prefix query traverses to the prefix node then DFS/BFS collects all children.

**Production system 2 — IP Longest Prefix Match (LPM)**: every router's forwarding table is a binary trie keyed on IP address bits. `192.168.1.0/24` is a 24-bit prefix. LPM = traverse the trie on the destination IP's bits until the longest matching prefix node → forwarding rule.

**Why trie beats HashMap for LPM**: a HashMap `get("192.168.1.5")` finds an exact match only. A trie naturally finds the longest prefix match by stopping at the deepest matching node — this is structurally impossible with a flat hash table.

**Failure if broken**: using HashMap for IP routing → can only match exact /32 routes, no subnet aggregation → forwarding table size explodes from ~800K routes (BGP full table) to billions → router memory exhausted. Real: DFZ (Default-Free Zone) routers carry a full BGP table; Trie (PATRICIA trie variant) enables O(32) worst-case lookup.

---

## Quick Bridge Matrix

| CS Concept | Where it runs in production | Failure if concept is violated |
|------------|----------------------------|-------------------------------|
| Merge sort merge step | SQL MERGE JOIN | O(n²) query without index-sort |
| BFS level-by-level | Kafka partition rebalance | Skewed consumer assignment |
| Dijkstra | OSPF, GPS routing | Routing loops on negative weights |
| Topological sort | Gradle/Bazel build order | Circular dependency → build fail |
| Union-Find | Network partition detection | False isolation alerts |
| Consistent hashing | Redis Cluster, Cassandra | Cache avalanche on server change |
| Priority queue | Linux CFS scheduler | O(n) scheduling overhead |
| 2D DP table | BLAST DNA alignment | O(n²) infeasible at genome scale |
| Bloom filter | HBase SSTable reads | 50× read amplification |
| Trie / LPM | IP routing (BGP) | Router memory exhaustion |

---

> **See also**: [Algorithm Timeline →](00_ALGORITHM_TIMELINE.md) · [Cheat Sheets →](00_CHEAT_SHEETS.md) · [Graphs →](05c_Graphs_Fundamentals.md) · [DP →](04b_DP_Fundamentals.md) · [Hash Table →](../02_Data_Structures/01e_HashTable.md)
