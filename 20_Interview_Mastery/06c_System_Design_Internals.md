> **Navigation**: [< Previous](06b_System_Design_Problems.md) | [Back to Index](00_INDEX.md)

# ⚙️ System Design Internals — Distributed Systems Deep Dive

> _"To design systems at scale, you must first understand the building blocks that make scale possible."_

---

# PART 0: The 5W+H Framework

| Question | Distributed Systems Internals Context |
| :--- | :--- |
| **WHAT** | The internal architecture and algorithms of production distributed systems: key-value stores, messaging systems, distributed file systems, and consensus protocols. |
| **WHY** | Understanding HOW real systems (Dynamo, Kafka, Cassandra) work internally lets you make informed trade-offs during system design interviews and architecture decisions. |
| **WHEN** | During Staff/Principal-level interviews, when choosing between databases, when debugging distributed system failures, when designing new infrastructure. |
| **WHERE** | Amazon (Dynamo → DynamoDB), LinkedIn (Kafka), Facebook (Cassandra), Google (GFS → BigTable → Spanner). |
| **WHO** | DeCandia et al. (Dynamo, 2007), Lakshman & Malik (Cassandra, 2010), Kreps et al. (Kafka, 2011), Ghemawat et al. (GFS, 2003), Chang et al. (BigTable, 2006). |
| **HOW** | Each system makes specific trade-offs in the CAP theorem to optimize for its use case. Understanding these trade-offs is the key. |

---

# PART 1: Distributed Systems Fundamentals

> _Enriched from Educative "Grokking System Design" — Glossary of System Design Basics_

---

```
CAP THEOREM (Brewer, 2000):
  A distributed system can guarantee AT MOST TWO of:
  
  C — Consistency: Every read receives the most recent write
  A — Availability: Every request receives a response (success or failure)
  P — Partition Tolerance: System continues despite network failures
  
  In practice, P is non-negotiable (networks WILL fail).
  So the real choice is: CP or AP.
  
  CP systems: sacrifice availability for consistency
    → Banking, inventory systems, locks
    → Examples: HBase, MongoDB (default), ZooKeeper
  
  AP systems: sacrifice consistency for availability
    → Social media feeds, DNS, shopping carts
    → Examples: Cassandra, DynamoDB, CouchDB

CONSISTENCY MODELS:
  Strong consistency: read always sees latest write (single source of truth)
  Eventual consistency: reads MAY be stale, but will converge eventually
  Causal consistency: preserves cause-and-effect ordering
  Read-your-writes: you see your own writes immediately
  
  Tunable consistency (Cassandra/Dynamo):
    W + R > N → strong consistency
    W = write quorum, R = read quorum, N = replicas
    Example: N=3, W=2, R=2 → 2+2 > 3 → consistent reads

CONSISTENT HASHING:
  Problem: How to distribute data across N servers?
  
  Naive: hash(key) % N
  ❌ When N changes (add/remove server), EVERYTHING moves!
  
  Consistent hashing:
  1. Hash ring: 0 to 2³² mapped to a circle
  2. Servers placed at positions on the ring
  3. Key hashed → walk clockwise → first server = owner
  4. Add/remove server → only K/N keys move (not all!)
  
  Virtual nodes: each server → 100-200 positions on the ring
  → Even distribution even with heterogeneous servers

VECTOR CLOCKS (Detecting conflicts in AP systems):
  Each node maintains a vector of logical clocks:
  [server1: 3, server2: 5, server3: 1]
  
  Increment own counter on each write.
  Merge vectors on sync: take max of each component.
  
  Conflict detection:
  V1 = [3, 5, 1], V2 = [2, 5, 2]
  Neither dominates → CONFLICT → application must resolve
  
  V1 = [3, 5, 1], V2 = [3, 6, 1]
  V2 dominates V1 → no conflict → V2 is newer
```

---

# PART 2: Dynamo — Key-Value Store

> _Enriched from Educative "Grokking SD" — Dynamo: How To Design a Key-Value Store_

---

```
WHAT: Amazon's highly available key-value store (powers shopping cart).
      Inspiration for DynamoDB, Riak, Voldemort.

KEY DESIGN CHOICES (prioritize AVAILABILITY over consistency):
  
  1. DATA PARTITIONING: Consistent hashing with virtual nodes
     Each key → hash → nearest server on ring
     Virtual nodes (150-200 per server) for even distribution
  
  2. REPLICATION: N=3 (each key stored on 3 consecutive servers)
     Coordinator writes to N-1 more servers clockwise on ring
     Preference list: list of N servers responsible for a key
  
  3. CONFLICT RESOLUTION: "Always writable" — never reject writes
     Concurrent writes → create divergent versions
     Client resolves conflicts at read time (e.g., merge shopping carts)
     Use vector clocks for versioning
  
  4. SLOPPY QUORUM + HINTED HANDOFF:
     If target server is down:
     → Write to next available server (sloppy quorum)
     → That server stores a "hint" to forward data when target recovers
     → Guarantees writes succeed even during failures!
  
  5. ANTI-ENTROPY: Merkle trees for synchronization
     Each server builds a Merkle tree of its data
     Compare root hashes → if different, traverse tree to find divergence
     Only transfer differing keys → efficient sync
  
  6. GOSSIP PROTOCOL for membership:
     Servers periodically gossip about who's alive/dead
     No single point of failure for membership
     Eventually all servers converge on same view

READ/WRITE PATH:
  Write: client → coordinator → W replicas ACK → return success
  Read:  client → coordinator → R replicas respond → 
         return most recent version (by vector clock)
  
  If R + W > N → strong consistency
  If R = 1, W = 1 → fastest but weakest consistency
```

---

# PART 3: Kafka — Distributed Messaging

> _Enriched from Educative "Grokking SD" — Kafka: Distributed Messaging System_

---

```
WHAT: A distributed, fault-tolerant, high-throughput messaging system.
      Used for: event streaming, log aggregation, real-time analytics.

KEY CONCEPTS:
  Topic: a named feed of messages (e.g., "user-clicks", "orders")
  Partition: a topic is split into ordered, immutable partitions
  Producer: writes messages to topics
  Consumer: reads messages from topics
  Consumer Group: set of consumers that share the work of reading
  Broker: a Kafka server that stores partitions

PARTITION — The Unit of Parallelism:
  Topic "orders" with 3 partitions:
  
  Partition 0: [msg1, msg4, msg7, msg10, ...]
  Partition 1: [msg2, msg5, msg8, msg11, ...]
  Partition 2: [msg3, msg6, msg9, msg12, ...]
  
  Messages within a partition → ORDERED (guaranteed)
  Messages across partitions → NO global order
  
  Partition assignment: hash(message_key) % num_partitions
  Same key → always same partition → ordering for that key

CONSUMER GROUPS — Scalable Consumption:
  Group "analytics" with 3 consumers:
    Consumer A → reads Partition 0
    Consumer B → reads Partition 1
    Consumer C → reads Partition 2
  
  Each partition consumed by exactly ONE consumer in a group.
  More consumers than partitions → some consumers idle.
  
  Different groups can read the SAME topic independently:
  Group "analytics" reads for metrics
  Group "search" reads for indexing
  → Each group has its own offset (position in the log)

REPLICATION & FAULT TOLERANCE:
  Each partition has 1 LEADER and N-1 FOLLOWERS
  All reads/writes go to leader
  Followers replicate from leader asynchronously
  
  ISR (In-Sync Replicas): followers that are caught up
  If leader dies → elect new leader from ISR
  
  acks=0: don't wait → fastest, may lose msgs
  acks=1: wait for leader → balanced
  acks=all: wait for ALL ISR → slowest, no data loss

EXACTLY-ONCE SEMANTICS (Kafka 0.11+):
  Idempotent producer: each message gets a sequence number
  Transactional producer: atomic writes across partitions
  Consumer: read_committed isolation level
  
  End-to-end exactly-once: produce + consume in same transaction

PERFORMANCE:
  Sequential I/O (append-only log) → disk as fast as network
  Zero-copy: sendfile() system call → kernel sends directly to socket
  Batching: produce/consume in batches → amortize overhead
  Compression: gzip/snappy/lz4 on batches
  
  Throughput: millions of messages/second per cluster
  Latency: single-digit milliseconds (99th percentile)
```

---

# PART 4: Cassandra — Wide-Column NoSQL

> _Enriched from Educative "Grokking SD" — Cassandra: Wide-Column NoSQL Database_

---

```
WHAT: A distributed wide-column store designed for massive write throughput.
      Used by: Netflix, Discord, Instagram, Apple (75K+ nodes).

DATA MODEL:
  Keyspace → Table → Row → Columns
  
  PRIMARY KEY = (partition_key, clustering_columns)
  
  Partition key: determines WHICH node stores the row
  Clustering columns: determines ORDER within the partition
  
  Example: messages table
  PRIMARY KEY ((chat_id), message_timestamp)
  → All messages for a chat stored together (partition_key = chat_id)
  → Ordered by timestamp within each partition

WRITE PATH (LSM-Tree based):
  1. Write to COMMIT LOG (append-only, for durability)
  2. Write to MEMTABLE (in-memory sorted structure)
  3. When memtable full → FLUSH to disk as SSTABLE (immutable)
  4. Background: COMPACTION merges SSTables
  
  ✅ All writes are sequential (fast!)
  ✅ No random I/O on write path
  ❌ Reads may need to check multiple SSTables

READ PATH:
  1. Check MEMTABLE (in-memory, fastest)
  2. Check BLOOM FILTER for each SSTable
     → "Might this SSTable contain the key?"
     → False positive rate ~1%, saves unnecessary I/O
  3. Check partition INDEX → find offset in SSTable
  4. Read from SSTable on disk
  
  OPTIMIZATION: row cache, key cache, partition summary

TUNABLE CONSISTENCY:
  ANY: write to any node (sloppy quorum) — weakest
  ONE: at least 1 replica ACKs
  QUORUM: majority (N/2 + 1) ACKs
  ALL: all replicas ACK — strongest, least available
  
  LOCAL_QUORUM: quorum within local datacenter
  → Cross-datacenter deployment: eventually consistent globally
```

---

# PART 5: Building Blocks Reference

> _Enriched from Educative "Deep Dive SD" — Basic Building Blocks_

---

```
DNS (Domain Name System):
  Browser → DNS resolver → root server → TLD → authoritative
  Cache at every level (TTL-based)
  Round-robin DNS: multiple IPs for load distribution

CDN (Content Delivery Network):
  Cache static content at edge servers worldwide
  Push CDN: you upload content proactively
  Pull CDN: first request triggers caching, subsequent requests served from edge
  
  Miss latency: edge → origin → edge (one-time)
  Hit latency: edge → user (sub-10ms for nearby PoP)

LOAD BALANCER:
  Layer 4 (TCP): route based on IP/port (fast, no content inspection)
  Layer 7 (HTTP): route based on URL path, headers, cookies (smarter)
  
  Algorithms: Round-robin, Weighted, Least connections, IP hash, Consistent hash
  Health checks: periodic pings to remove dead servers

CACHE:
  Client → Cache → Database
  
  Cache-aside: app checks cache first, on miss → read DB → write to cache
  Write-through: write to cache AND DB simultaneously
  Write-behind: write to cache, async write to DB (risk of data loss)
  
  Eviction: LRU (most common), LFU, FIFO, Random
  Invalidation: TTL-based, event-driven, write-invalidate

MESSAGE QUEUE:
  Producer → Queue → Consumer
  
  Guarantees: at-least-once, at-most-once, exactly-once
  Ordering: FIFO within partition/channel
  Use cases: async processing, decoupling, load leveling, event sourcing
  
  Options: Kafka (log-based), RabbitMQ (AMQP), SQS (AWS), Redis Streams

DATABASE SHARDING:
  Horizontal partitioning: split data across multiple database servers
  
  Shard key selection is CRITICAL:
  ✅ user_id: even distribution, all user data on one shard
  ❌ country: uneven (US shard overloaded)
  ❌ timestamp: hot shard for recent data
  
  Resharding: when shards become unbalanced
  → Consistent hashing avoids full resharding
  
  Cross-shard queries: expensive! Avoid when possible.
  → Denormalize data to keep related data on same shard
```

---

## 🔗 Cross-References

| Topic | Related Content |
|---|---|
| System design problems | [System Design Problems](06b_System_Design_Problems.md) |
| System design blueprint | [System Design Blueprint](06_System_Design_Blueprint.md) |
| Consistent hashing (DS) | [HashTable](../02_Data_Structures/01e_HashTable.md) |
| Graph algorithms (Gossip) | [Graph Algorithms](../03_Algorithms/05c_Graphs_Fundamentals.md) |
| Trees (B-Trees, LSM) | [Trees & Heaps](../02_Data_Structures/01f_Trees_Heaps.md) |
| Kafka in Spring Boot | [Message Queues](../07_Modern_Java/Ch54_Message_Queues_Kafka.md) |
| Microservices patterns | [Microservices](../07_Modern_Java/Ch62_SB_Microservices_Patterns.md) |

