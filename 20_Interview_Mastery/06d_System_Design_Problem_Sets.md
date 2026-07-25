# 📝 System Design — Problem Sets

## `20_Interview_Mastery` Module | Scalability, Load Balancing, Databases, Sharding

> **How to use:** System design is open-ended, but there are standard industry patterns. Read 🔴 **Erklärung** for common anti-patterns during interviews.

---

## Problem Set SYS-PS1 — High Level Design & Trade-offs

**Prerequisites:** `20_Interview_Mastery/06_System_Design_Blueprint.md`

---

### Part A: Theoretical

**A1 (Easy).** Compare a Load Balancer (LB) to a Reverse Proxy. Are they the same thing?

<details><summary>Answer</summary>

- **Load Balancer:** Distributes incoming network traffic across a group of backend servers to ensure no single server bears too much demand. (e.g., AWS ALB, HAProxy).
- **Reverse Proxy:** Sits in front of web servers and forwards client requests to those web servers. It hides the identity of the backend servers. Often handles SSL termination, caching, and compression. (e.g., Nginx, Envoy).

**Overlap:** Modern tools (like Nginx) do _both_. But conceptually, a Reverse Proxy is about _protection and interception_, while a Load Balancer is about _distribution of load_.

</details>

---

**A2 (Medium).** What is consistent hashing, and why is it essential for a distributed cache (like Memcached or Redis cluster)?

<details><summary>Answer</summary>

**The Problem:** Naive hashing uses `hash(key) % N` (where N is the number of servers). If a server crashes, N changes to N-1. Suddenly, almost EVERY key hashes to a different server. A massive cache miss storm hits the database, bringing it down.

**Consistent Hashing:** Both the servers and the keys are hashed onto the same circular ring (e.g., 0 to 360 degrees). A key is routed to the first server found by moving clockwise on the ring.

- **When a server goes down:** Only the keys that mapped to that specific server are reassigned to the next server on the ring. The rest of the keys stay exactly where they were.

🔴 **Erklärung:** If you suggest naive modulo hashing in a system design interview for a scalable cache, it is an instant red flag. Consistent hashing is the mandatory answer for dynamic scale-out/scale-in topologies.

</details>

---

**A3 (Hard).** Contrast **Database Replication** (Master-Slave/Master-Master) with **Database Sharding**. When do you use which?

<details><summary>Answer</summary>

**Replication (Vertical scaling of read throughput):**

- **What it is:** Copying the same data across multiple nodes.
- **Why use it:** High availability (failover) and scaling **reads** (read replicas).
- **Limitation:** Does not scale **writes**. Every node must still process every write. The total data size is limited by the disk capacity of a single node.

**Sharding / Partitioning (Horizontal scaling of capacity & writes):**

- **What it is:** Splitting the data itself into chunks (shards) across multiple independent nodes (e.g., A-M on Server 1, N-Z on Server 2).
- **Why use it:** Scaling **writes** (different servers handle different writes) and scaling **storage capacity** (data exceeds one machine's hard drive).
- **Limitation:** Complex routing. Joins across shards are extremely slow or impossible.

🔴 **Erklärung:** "I'll add read replicas" does not solve a system experiencing heavy WRITE load (like a logging system or IoT ingestion). Only sharding (or a NoSQL DB that auto-shards) solves write bottlenecks.

</details>

---

### Part B: Design Challenge

**B1.** Design a URL Shortener (like bit.ly).
**Constraints:** 100M new URLs per month. 10:1 read to write ratio. URLs expire after 5 years.

<details><summary>Answer Outline</summary>

**1. Capacity Estimation:**

- 100M URLs/month = ~40 writes/sec.
- 10:1 ratio = 400 reads/sec.
- 5 years = 100M _ 12 _ 5 = 6 Billion URLs.
- Storage: 6B \* 500 bytes = ~3 Terabytes.

**2. API Design:**

- `POST /api/v1/data/shorten` (body: `{ "longUrl": "..." }`) → returns `{"shortUrl": "..."}`
- `GET /{shortCode}` → Returns HTTP 301 or 302 Redirect to longUrl.

**3. Database Choice:**

- Need 3TB storage, high read volume, simple key-value lookups, no complex joins.
- **NoSQL (DynamoDB, Cassandra, MongoDB)** is perfect here.
- A Relational DB works too (MySQL) but requires sharding at 3TB.

**4. Key Generation (The core problem):**

- Base62 encoding (A-Z, a-z, 0-9). 7 characters = 62^7 = ~3.5 Trillion combinations (plenty for 6 Billion URLs).
- **Approach:** Standalone "Ticket Server" or Key Generation Service (KGS) that pre-generates random 7-char strings and stores them in a DB. When a new URL comes, pop an unused key. This avoids collisions entirely.

**5. Caching:**

- Add Redis/Memcached in front of the DB.
- Rule of thumb: Cache 20% of the daily traffic (Pareto principle - 80% of clicks go to 20% of links).
- Eviction policy: LRU (Least Recently Used).
</details>

---

[← Back to Master Index](../00_MASTER_INDEX.md)
