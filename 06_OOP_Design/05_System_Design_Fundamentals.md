**Navigation**: [Back to Index](../00_MASTER_INDEX.md)

# Chapter 05 - System Design Fundamentals

Purpose: Core methodologies and test-driven architecture concepts, focusing on establishing sfocusing on establishing solid foundations before scaling complexity.

---

# 📚 PART 0: The 5W+H Framework

**Mental Model:** Think of System Design like building a city. Before you can plan a city's roads, water systems, and power grid, you need a **Walking Skeleton** — a thin end-to-end slice (one road, one water pipe, one wire) that proves all the systems connect. System Design Fundamentals teaches you to prove technical viability FIRST, then iterate, rather than building big-bang integrations that fail on launch.

| Question  | System Design Fundamentals Context                                                                                                                                                                                                                                                                                 |
| :-------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **WHAT**  | The methodologies, primitives, and architectural patterns that turn a single-process application into a reliable distributed system — vertical vs horizontal scaling, monolith vs microservices, CAP theorem, caching, load balancing, sharding.                                                                   |
| **WHY**   | A 100-user system and a 100M-user system require fundamentally different architectures. Building the wrong architecture first is the #1 cause of multi-year rewrites ("distributed monoliths," "Big Bang integration" failures, Knight Capital-style production disasters).                                        |
| **WHEN**  | Day 1 of any non-trivial project (Walking Skeleton); when traffic grows 10× past single-server capacity (horizontal scaling); when an outage costs >$1M/hour (chaos engineering, redundancy, multi-region); when a single team can no longer hold the entire codebase in their head (microservices decomposition). |
| **WHERE** | At every layer of a modern application: load balancer (Nginx, AWS ALB), cache (Redis, Memcached), database (PostgreSQL primary + read replicas), message queue (Kafka, RabbitMQ), CDN (Cloudflare, Fastly), container orchestration (Kubernetes).                                                                  |
| **WHO**   | Backend engineers (Walking Skeleton and API design), SREs (chaos engineering, observability), platform engineers (load balancing, sharding), architects (CAP trade-offs, microservices decomposition), CTOs (build-vs-buy, monolith-vs-microservices decision).                                                    |
| **HOW**   | By proving a thin end-to-end slice first (Walking Skeleton), then scaling each layer independently (vertical → horizontal → sharding → multi-region), abstracting collaborators behind roles (Dependency Inversion), and deliberately injecting failure (chaos engineering) before users find the bug.             |

### Where It's Used in Real World

- **Netflix**: Chaos Engineering originated here — they inject failures (kill random production instances) to verify the system degrades gracefully. Direct descendant of Walking Skeleton methodology.
- **Amazon Prime Day 2018**: Was protected against failure via horizontal scaling + chaos engineering — a single region going down did not affect global users. Averted a projected $99M revenue loss.
- **Knight Capital 2012**: $440M lost in 45 minutes because they did NOT do Walking Skeleton — they shipped a configuration change without integrating with production. Anti-example.
- **Healthcare.gov 2013**: $1.7B system crashed on launch because they did NOT decompose monolith first — every component tightly coupled, no horizontal scaling. Anti-example.

💡 **Key Insight**: System Design Fundamentals is not "scaling" — it is **architecting for failure from Day 1**. The Walking Skeleton proves architecture; chaos engineering proves resilience; CAP theorem forces explicit trade-offs.

### Historical Evolution

System Design Fundamentals is a child of three converging disciplines: **Test-Driven Development** (1999-2003), **Extreme Programming and Agile** (1999-2001), and **distributed-systems research** (CAP 1999, Paxos 1989/1998, Raft 2014). The **Walking Skeleton** concept itself was formalized in _Growing Object-Oriented Software, Guided by Tests_ (**GOOS, Freeman & Pryce, 2009**), though the underlying "thin slice" idea traces to the **eXtreme Programming (XP) movement** (Kent Beck, 1999) and the **Mock Objects paper** (Freeman et al., 2000, presented at OOPSLA). The **CAP theorem** was conjectured by **Eric Brewer in 1999** at PODC and formally proven by **Gilbert and Lynch in 2002**. **Chaos Engineering** was born at **Netflix around 2010-2011** (Adrian Cockcroft, "Chaos Monkey" released publicly) as a deliberate response to AWS region failures. **Microservices** as a term was popularized by **Lewis and Fowler in 2014**, though the underlying pattern dates to **service-oriented architecture (SOA)** from the late 1990s and **CORBA** (1991). Modern practice (post-2015) blends these: Kubernetes-based microservices, chaos engineering as a discipline (Gremlin, ChaosBlade), and infrastructure-as-code (Terraform, Pulumi) as the modern Walking Skeleton enabler.

| Era       | Concept                            | Origin                      |
| --------- | ---------------------------------- | --------------------------- |
| 1989      | Paxos consensus                    | Leslie Lamport              |
| 1999      | XP + TDD                           | Kent Beck                   |
| 1999      | CAP conjecture                     | Eric Brewer (PODC)          |
| 2000      | Mock Objects paper                 | Freeman et al. (OOPSLA)     |
| 2002      | CAP proof                          | Gilbert & Lynch             |
| 2003      | JUnit, TDD mainstream              | Kent Beck, Erich Gamma      |
| 2009      | Walking Skeleton + Mock Roles      | Freeman & Pryce (GOOS book) |
| 2010-2011 | Chaos Monkey                       | Netflix (Adrian Cockcroft)  |
| 2014      | Raft consensus (understandable)    | Diego Ongaro PhD            |
| 2014      | Microservices term popularized     | Lewis & Fowler              |
| 2015+     | Kubernetes, Infrastructure-as-Code | Borg/Omega → K8s            |

**Paradigm Evolution**: Big Bang Integration → Walking Skeleton → TDD-driven design → Microservices + Chaos Engineering → Cloud-native + IaC.

olid foundations before scaling complexity.

---

## 1. The "Walking Skeleton" (GOOS Methodology)

In the book _Growing Object-Oriented Software, Guided by Tests_ (GOOS), the authors introduce a critical architectural concept known as the **"Walking Skeleton."**

### What is a Walking Skeleton?

A Walking Skeleton is a tiny implementation of the system that performs a small, thin slice of end-to-end functionality. It links together all the main architectural components (UI, API, database, message queues) but contains almost no business logic.

### Why build it first?

In traditional system design, engineers often build horizontal layers (e.g., spending weeks perfecting the database schema, then weeks on the API, then the UI). This delays integration testing until the very end, causing massive integration headaches (the "Big Bang" integration failure).

The Walking Skeleton solves this by forcing you to:

1. **Prove the Architecture:** It proves that your chosen technologies (e.g., React + Spring Boot + PostgreSQL) can actually communicate with each other in production.
2. **Establish the Pipeline:** It forces you to set up the CI/CD pipeline, automated deployment, and production environments _before_ writing business logic.
3. **Enable End-to-End Testing:** It allows you to write your first automated acceptance test, establishing a safety net for all future development.

### How it differs from an MVP:

- An **MVP (Minimum Viable Product)** is about proving _business value_ to users.
- A **Walking Skeleton** is about proving _technical viability_ and establishing the delivery infrastructure. Users might never see the Walking Skeleton.

### Example Scenario

**Goal:** Build an e-commerce checkout system.

- **Bad Approach:** Design 50 database tables. Write 20 API endpoints. Build a massive UI.
- **Walking Skeleton Approach:**
  1. A plain HTML button that says "Checkout".
  2. Clicking it hits an API endpoint.
  3. The API writes a hardcoded string ("Order 123") to the database.
  4. The UI displays "Success".
     _Result:_ You now have a working UI → API → DB connection deployed to production, with an automated test verifying the flow. Now you can safely iterate.

### Interview Phrasing

_"Before committing to a massive microservice rollout, I would implement a Walking Skeleton. This thin end-to-end slice proves our CI/CD pipeline, network configurations, and component communication are correct before we invest heavily in business logic. It mitigates integration risk on Day 1 rather than Day 100."_

---

## 2. Test-First Design & Mocking Roles (GOOS Methodology)

Another core philosophy from _Growing Object-Oriented Software_ is how we use Test-Driven Development (TDD) not just for verification, but as a primary **design tool**.

### Test-First Design

In GOOS, you do not design the classes and then write tests for them. You write the test _first_ to discover what the API _should_ look like from the perspective of the client using it.

- **Outside-In:** You start with an acceptance test (end-to-end). When that fails, you write a unit test for the outermost component (e.g., the Controller). To make that unit test pass, you discover that you need a collaborating object (e.g., a Service).
- **Discovery:** You don't guess what the Service should look like; you let the Controller's test dictate the Service's interface.

### "Mock Roles, Not Objects"

This is the most misunderstood concept in mocking.

- **The Anti-Pattern:** Developers often create a concrete class `OrderProcessor`, realize it's hard to test, and then create a mock of `OrderProcessor` using a mocking library. This couples the test to the implementation details of the object.
- **The GOOS Way:** You mock **Roles**, not Objects. A Role is an Interface that defines a specific behavior required by the caller.

#### Example:

Suppose an `OrderController` needs to send a notification when an order completes.

1.  **Don't** mock a concrete `SendGridEmailClient` class.
2.  **Instead**, define an interface that describes the _Role_ the collaborator plays from the Controller's perspective: `public interface OrderNotifier`.
3.  In your test, you mock the `OrderNotifier` role.
4.  Later, you implement a concrete `SendGridOrderNotifier` which implements that interface.

**Why this matters for System/Software Design:**
By mocking roles (interfaces) instead of concrete objects, you are naturally driven toward **Dependency Inversion** (the 'D' in SOLID) and **Ports and Adapters Architecture** (Hexagonal). The "Role" becomes the Port, and the concrete class becomes the Adapter. The tests literally force your architecture to be modular and decoupled.

### Production Reality

- **Knight Capital 2012**: Deployed untested trading software with a single enabled-but-unused code path activated by a legacy config flag. Lost **$440M in 45 minutes** before being shut down. Cause: dead-code activation bug, classic regression-test failure. This is the canonical failure of "Big Bang integration" — the code was written, tested piece by piece, but never integrated with the production config in a full stack before launch. The Walking Skeleton would have caught this: a thin slice of end-to-end code run against production infrastructure would have revealed the errant flag.
- **Healthcare.gov 2013**: A **$1.7B** system that crashed immediately on launch due to a monolithic architecture with no load balancing, tightly-coupled components, and synchronous blocking calls between every layer. Cause: violated SRP (one giant team owns one giant codebase, one reason to change becomes "everything"), DIP (no dependency injection — components called each other directly with no abstraction), and basic horizontal-scaling principles. The fix was the inverse of a Walking Skeleton: decompose into independent services with contracts, load-balance them, and test each slice independently.

---

## 3. Scaling Primitives — Vertical, Horizontal, Sharding, Replication

Beyond Walking Skeleton methodology, System Design Fundamentals includes a **taxonomy of scaling primitives** that every backend engineer must understand.

### Vertical vs Horizontal Scaling

| Approach                   | How                                 | Cost Curve                                      | Limit                                                     | Use Case                                             |
| -------------------------- | ----------------------------------- | ----------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------- |
| **Vertical (scale up)**    | Bigger machine: more CPU, RAM, disk | Exponential (8× RAM ≠ 8× perf past memory wall) | Single-machine max (1TB RAM, 128 cores — physical limits) | Initial growth, simple workloads, database servers   |
| **Horizontal (scale out)** | More machines behind load balancer  | Linear (2× machines ≈ 2× capacity)              | Coordination overhead, consistency (CAP theorem)          | Stateless services, traffic spikes, geo-distribution |

**Trade-off**: Vertical is simpler (no distributed-systems concerns) but hits a hard ceiling. Horizontal is unbounded but forces you to think about CAP, eventual consistency, sharding. **Default to vertical** until the bottleneck (CPU? memory? IO?) becomes clear; **switch to horizontal** when a single machine cannot handle peak load AND the application is stateless or sharded.

### Monolith vs Microservices

| Aspect                       | Monolith                                           | Microservices                                                 |
| ---------------------------- | -------------------------------------------------- | ------------------------------------------------------------- |
| **Build speed (small team)** | Fast (one repo, one deploy)                        | Slow (N repos, N pipelines, N contracts)                      |
| **Build speed (large team)** | Bottleneck (merge conflicts, coordination)         | Fast (teams own services independently)                       |
| **Failure isolation**        | None (one bad deploy crashes everything)           | Partial (one bad service degrades, others survive)            |
| **Operational complexity**   | Low (one process, one log, one DB)                 | High (N processes, distributed tracing, eventual consistency) |
| **Refactoring scope**        | Local (IDE refactor across all code)               | Cross-service (API versioning, schema migration coordination) |
| **Best for**                 | <10 engineers, unclear domain, early-stage product | >30 engineers, mature domain, high-scale traffic              |

**Trade-off**: Microservices are not a goal; they are a consequence of team size and domain maturity. **Netflix did NOT start with microservices** — they began as a monolith (DVD-by-mail) and decomposed AFTER their domain stabilized and team grew past 100 engineers. Starting with microservices is the most common cause of "distributed monolith" — service-per-engineer without team or domain justification.

### SQL vs NoSQL — When to Use Which

| Database Type                      | Consistency                         | Schema                    | Scaling                                      | Use Cases                                                      |
| ---------------------------------- | ----------------------------------- | ------------------------- | -------------------------------------------- | -------------------------------------------------------------- |
| **Relational (PostgreSQL, MySQL)** | Strong (ACID)                       | Fixed schema (migrations) | Vertical + read replicas + sharding (manual) | Financial, transactional, complex joins, structured data       |
| **Document (MongoDB, CouchDB)**    | Eventual (configurable)             | Flexible schema (JSON)    | Horizontal-native (sharding built-in)        | Catalog, user profiles, content management, varying fields     |
| **Wide-column (Cassandra, HBase)** | Eventual (tunable)                  | Columnar schema           | Horizontal-native (linear scale)             | Time-series, write-heavy IoT, messaging, large-scale telemetry |
| **Key-Value (Redis, DynamoDB)**    | Eventual (Redis single-node strong) | Opaque values             | Horizontal-native                            | Cache, session store, leaderboards, simple lookups             |
| **Graph (Neo4j, Neptune)**         | Strong (graph transactions)         | Schema-on-read            | Vertical (graph traversal expensive)         | Social networks, recommendation engines, fraud detection       |

**Trade-off**: SQL is the safe default — its ACID guarantees, mature tooling, and team familiarity win for 80% of workloads. NoSQL wins when you have a specific property (linear horizontal scaling, flexible schema, time-series) that SQL cannot provide without heroic engineering. **Never pick NoSQL for the "cool factor"** — pick it because you measured SQL and it failed on your specific workload.

### Load Balancing Strategies

| Strategy                 | How It Routes                           | Pros                                          | Cons                                  | Use Case                             |
| ------------------------ | --------------------------------------- | --------------------------------------------- | ------------------------------------- | ------------------------------------ |
| **Round Robin**          | Alternating server index                | Simple, fair                                  | Ignores server load                   | Homogeneous servers, low traffic     |
| **Least Connections**    | Server with fewest active connections   | Better for long-lived connections             | Slightly more expensive               | WebSocket, long-polling              |
| **Weighted Round Robin** | Higher-weight servers get more requests | Handles heterogeneous capacity                | Static weights don't adapt to runtime | Mixed-instance-type fleets           |
| **IP Hash**              | Hash client IP → server                 | Same client → same server (cache locality)    | Rebalancing is hard                   | Sticky sessions, caching             |
| **Consistent Hashing**   | Hash both client and server into a ring | Adding/removing servers affects only K/n keys | Complex to implement                  | Distributed caches (Memcached), CDNs |
| **Least Response Time**  | Server with fastest recent response     | Adapts to runtime conditions                  | Requires monitoring                   | High-traffic public APIs             |

### Caching Layers — Where, What, and Why

| Layer                              | Example                        | Hit Latency | Miss Penalty       | Use Case                                          |
| ---------------------------------- | ------------------------------ | ----------- | ------------------ | ------------------------------------------------- |
| **Browser cache**                  | `Cache-Control: max-age=3600`  | 0ms         | Network round trip | Static assets, API responses with explicit TTL    |
| **CDN**                            | Cloudflare, Fastly, CloudFront | 5-50ms      | Origin round trip  | Static assets, geo-distributed read-heavy content |
| **Application cache (in-process)** | Guava Cache, Caffeine          | 0.1ms       | DB query           | Hot keys, recent computations                     |
| **Distributed cache**              | Redis, Memcached               | 1-5ms       | DB query           | Shared state across instances, sessions           |
| **Database query cache**           | PostgreSQL shared_buffers      | 1ms         | Disk I/O           | Hot tables within DB                              |
| **Result cache (computed)**        | Spring Cache, Caffeine         | 0.1ms       | Full recomputation | Expensive aggregations                            |

**Trade-off**: Caching trades consistency for latency. **Cache invalidation** is famously one of the two hard problems in CS (alongside naming). When choosing a cache layer, ask: (1) how stale can the data be? (2) how expensive is a miss? (3) what happens if the cache is wrong?

### Replication Strategies

| Strategy                           | Read Latency                | Write Latency                 | Consistency                               | Use Case                                          |
| ---------------------------------- | --------------------------- | ----------------------------- | ----------------------------------------- | ------------------------------------------------- |
| **Single primary, async replicas** | Low (read from any replica) | Low (write to primary only)   | Eventual (replication lag)                | Read-heavy workloads, geo-replication             |
| **Single primary, sync replicas**  | Low                         | Higher (wait for replica ack) | Strong (after replica ack)                | Financial transactions, durability-critical       |
| **Multi-primary (active-active)**  | Low (local writes)          | Lowest (no coordination)      | Conflict-prone (last-write-wins or CRDTs) | Geo-distributed writes, low-conflict domains      |
| **Quorum-based (Dynamo-style)**    | Tunable                     | Tunable                       | Tunable (R + W > N)                       | DynamoDB, Cassandra, eventually-consistent stores |

**Trade-off**: Single primary is simplest and safest; multi-primary unlocks geo-distributed writes but introduces conflict resolution complexity. **Most systems default to single primary + async replicas** for read scaling, then add complexity only when needed.

### CAP Theorem — The Trade-off Triangle

**Eric Brewer conjectured in 1999** (PODC keynote) and **Gilbert and Lynch formally proved in 2002** that a distributed data store can only deliver two of three guarantees simultaneously:

- **Consistency (C)**: Every read sees the latest write (linearizability).
- **Availability (A)**: Every request receives a response (non-error, non-timeout).
- **Partition tolerance (P)**: The system continues to operate despite network partitions between nodes.

**The trade-off**: When a network partition occurs (which is inevitable in any distributed system), you must choose between consistency and availability:

| Choice                                      | Behavior During Partition                            | Example Systems                                                                |
| ------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| **CP (Consistency + Partition tolerance)**  | Refuse writes or reads until partition heals         | MongoDB (default), HBase, Redis Cluster, ZooKeeper                             |
| **AP (Availability + Partition tolerance)** | Accept writes/reads on any node; reconcile later     | Cassandra, DynamoDB, CouchDB, DNS                                              |
| **CA (Consistency + Availability, no P)**   | Impossible in distributed systems (single-node only) | Traditional RDBMS (single primary), but fails the moment you add a second node |

**Production reality**: Every distributed system is **either CP or AP during a partition** — you don't get to choose. The question is: which failure mode is worse for your domain? Banking: CP (refuse to debit money if you can't reconcile). Social feed: AP (show stale content, never refuse to load).

---

## 4. Production Reality — System Design Failure Modes

Beyond the Knight Capital and Healthcare.gov stories in the existing Production Reality section, here are additional production-grade failure modes every system designer must know:

### AWS Region Outages — 2017, 2023

**2017 S3 outage** (US-EAST-1): A typo during debugging removed more servers than intended from an S3 index subsystem. Half the internet — Slack, Trello, Medium, Quora — went down for 4 hours. **Cause**: Single-region dependency. **Lesson**: Multi-region active-active architecture is expensive but necessary for survival-critical services. Netflix survived because they had already deployed multi-region with chaos engineering.

**2023 AWS US-EAST-1** (load balancer configuration change) — similar pattern: control-plane change cascaded into data-plane failure. **Lesson**: Even the cloud vendor's own control plane is not immune; always have a multi-cloud or hybrid fallback for survival-critical workloads.

### Netflix Chaos Monkey (2010-2011)

Adrian Cockcroft at Netflix introduced **Chaos Monkey** — a tool that randomly kills production instances during business hours. **Rationale**: if your system cannot survive a random instance being terminated, it cannot survive an AWS region going down. **Modern descendants**: Gremlin (commercial), ChaosBlade (Alibaba), LitmusChaos (Kubernetes-native). **Production lesson**: Chaos engineering is not optional for high-scale systems — it is the only way to verify that your Walking Skeleton has matured into a resilient production system. Netflix's entire architecture is built around the assumption that any instance can die at any time.

### Twitter Hybrid Fan-out (2020)

Twitter's timeline was built on a single fan-out strategy: when a celebrity tweets, push to all followers' feeds (expensive — 100M tweets × 30M followers = 3 trillion push notifications). In 2020, they switched to **hybrid fan-out**: regular users get push, celebrities (≥1M followers) get pull-on-demand. **Trade-off**: consistency vs cost. Push gives instant consistency (everyone sees the tweet immediately), pull gives eventual consistency (users see the tweet when they next load their timeline, but writes are O(1) instead of O(followers)). **Lesson**: At scale, even basic data-flow decisions become architecture decisions.

### Cloudflare 2019 Regex Bug

A single regex match (used to block hotlink protection) reached CPU 100% across Cloudflare's edge, taking down 1.1.1.1 (DNS) and large swaths of the internet for ~30 minutes. **Cause**: catastrophic backtracking in regex on adversarial input. **Lesson**: regex compilation/evaluation can be a denial-of-service vector. Always test regex with ReDoS (regex denial of service) analysis; use RE2 or Rust's regex crate for linear-time guarantees.

---

## 5. Pedagogical Craft — Challenges with Answers

### Challenge 1: Walking Skeleton vs MVP — Pick the Right One

**Scenario:** Your startup has 2 engineers, 6 months of runway, and a vague product idea (a "personal AI assistant"). Your technical co-founder wants to spend month 1 building a Kubernetes cluster with 7 microservices. You push back. What do you actually build in month 1?

<details><summary>Answer</summary>

**Build an MVP, not a Walking Skeleton.**

**MVP** proves _business value_ — does anyone want this product? Deploy the simplest possible thing that delivers the core promise (maybe just an LLM wrapper around GPT-4 with a web form). Get 10 users. Learn from them.

**Walking Skeleton** proves _technical viability_ — but the technical viability of "OpenAI API call → web form → response" is trivially obvious. There is no architectural risk to integrate. Save Walking Skeleton methodology for when the architecture is _unproven_ (new database, new message queue, new deployment target).

**Anti-pattern**: spending 6 months of runway on Kubernetes + microservices for a 2-person team and a product nobody has validated. Healthcare.gov in miniature.

**Rule of thumb**: Walking Skeleton when the architecture is risky AND the integration hasn't been proven. MVP when the architecture is trivial AND the business value is unknown.

</details>

---

### Challenge 2: CAP Trade-off for a Banking System

**Scenario:** You are designing a money-transfer service. During a network partition between the US-East and US-West database replicas, which do you choose: refuse the transfer (CP) or accept it and reconcile later (AP)? Justify your answer in terms of the failure mode that is _less_ bad.

<details><summary>Answer</summary>

**Choose CP (refuse the transfer) — and explain the failure mode.**

**Why CP**: Money is conserved. A double-spend (where the same $100 is transferred twice during reconciliation) is worse than a failed transfer. Refusing during a partition means the user sees "transfer temporarily unavailable, please retry" — annoying but recoverable. Accepting and reconciling later means the bank might discover that $1M was transferred twice and now owes money it cannot recover — bankruptcy-class failure.

**Why AP is wrong here**: Cassandra-style eventual consistency + last-write-wins reconciliation is acceptable for social feeds (a stale post is harmless), but NOT for money. The "reconcile later" step in banking means manual intervention, customer trust loss, and potentially regulatory violations.

**Real-world parallel**: Banks use synchronous replication (CP) for the ledger, not asynchronous (AP). When you transfer money, the receiving bank confirms the debit BEFORE your account is updated — this is the "two-phase commit" pattern (or, in modern systems, distributed transactions with saga compensation, but the principle is the same: refuse if you cannot guarantee consistency).

**Trade-off to acknowledge**: CP during partition means lower availability — some legitimate transfers are refused. This is the _correct_ trade-off for money.

**Anti-example**: Amazon's Dynamo paper (2007) explicitly chose AP for the shopping cart — accepting that during a partition, a customer might add an item to cart, lose connection, and re-add it, resulting in duplicate cart entries. This is acceptable for shopping carts. It is NOT acceptable for the actual order placement — which is why Amazon orders use a different (CP) system.

</details>

---

### Challenge 3: Chaos Engineering — Why Kill Production on Purpose?

**Scenario:** Your team is debating whether to run Netflix's Chaos Monkey against your production services. The VP of Engineering says: "We cannot risk killing production — our SLA is 99.99% and we will lose our biggest customer if we go down." How do you respond?

<details><summary>Answer</summary>

**Response: "Chaos engineering will PREVENT us from going down for hours. The alternative is finding out about the failure mode when a real outage hits."**

**The math**:

- A real outage lasts 30 minutes to 4 hours. Your 99.99% SLA = 52 minutes/year of allowed downtime. One 2-hour outage consumes 23% of your entire yearly budget.
- A chaos engineering experiment lasts 5-30 seconds. If it kills a service, you recover in under a minute. Total budget consumed: <0.01%.
- Ratio: chaos experiment costs 1/2000th of a real outage.

**Netflix's data**: They run Chaos Monkey continuously in production during business hours. In 12 years, they have not had a multi-hour outage from a single instance failure. The system is designed so that any instance can die at any time and the system degrades gracefully. **They have effectively eliminated single-instance failures as a failure mode.**

**How to start safely**:

1. **Game Days** (manual chaos): pick one production service, announce a time, kill it, observe recovery.
2. **Staging first**: run chaos against staging, not production, until you trust it.
3. **Blast radius control**: Chaos Monkey kills ONE instance at a time, not an entire region.
4. **Automated rollback**: if the chaos experiment causes real customer impact, roll back the chaos tool (not the production code).

**Counter-argument to the VP**: "You don't have a choice between chaos engineering and no chaos engineering. You have a choice between finding failure modes with controlled experiments, or finding them with real outages at 3am. Which do you prefer?"

**Real-world adoption**: Google DiRT (Disaster Recovery Testing), Amazon Game Days, Microsoft Azure Chaos Studio, Alibaba ChaosBlade — all major cloud vendors run continuous chaos engineering in production.

</details>

---

### Challenge 4: Database Sharding — When and How

**Scenario:** Your PostgreSQL database is 5TB, serving 10K QPS, and read replicas are not keeping up. The natural next step is sharding (splitting data across multiple databases by some key). What are the key design decisions and the most common production failure modes?

<details><summary>Answer</summary>

**Key design decisions**:

1. **Shard key choice**: must be high-cardinality AND frequently-queried AND evenly distributed. User ID (UUID or hash) is the standard. Email is bad (low cardinality, can change, case-sensitivity).
2. **Shard routing**: application-side (shard key in URL/query → lookup shard ID) vs middleware (proxy like Vitess, ProxySQL). Application-side is simpler; middleware is more flexible.
3. **Cross-shard queries**: forbidden if possible (no JOINs across shards). If needed, denormalize data or use a separate analytics database.
4. **Resharding**: how do you add a 6th shard when shard 5 fills up? Consistent hashing helps; Vitess has built-in resharding; rolling your own is **extremely difficult** and a common production failure.

**Most common production failure modes**:

1. **Hotspot shard**: one shard key value (a celebrity user, a "today's deal" product) gets 100× the traffic of others. Solution: hash the shard key to distribute evenly; or split that specific shard further.
2. **Cross-shard JOIN**: developer writes `SELECT * FROM orders JOIN users ON ...` and the query planner can't optimize it because data is on different physical machines. The query times out. **Solution: enforce no-cross-shard-JOIN at the schema layer**.
3. **Resharding outage**: trying to add a new shard causes 5-30 minutes of unavailability because data must be migrated while serving traffic. **Solution: use Vitess or a tool that supports online resharding; never do it manually**.
4. **Shard key changes**: business needs to let users change their email (which was the shard key). Now all that user's data must move to a different shard during the update. **Solution: never use a mutable field as shard key; use a stable hash**.

**Walking Skeleton for sharding**: before going to production, test (1) rebalancing 1 shard → 2 shards online, (2) killing 1 shard's primary, (3) cross-shard query failure mode. If any of these surprises you in production, you did not do your Walking Skeleton.

</details>

---

💡 **Key Insight**: System Design Fundamentals is not a list of patterns to memorize — it is a discipline of **proving architecture incrementally, failing safely on purpose, and choosing explicit trade-offs**. Walking Skeleton forces you to integrate from Day 1. Chaos engineering forces you to assume failure from Day 1. CAP forces you to choose explicitly when partitions happen. The principles compose: a Walking Skeleton → chaos engineering → resilient production system.

---

## 6. Observability — Logging, Metrics, Tracing

A production system without observability is a black box. When it fails (and it will), you cannot diagnose it. Observability has three pillars, each answering a different question:

### Three Pillars of Observability

| Pillar                | What It Answers                                          | Tool Examples                 | Production Use                                                     |
| --------------------- | -------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------ |
| **Logs (events)**     | "What happened at this moment?"                          | ELK, Splunk, Loki             | Debug individual requests; audit trail                             |
| **Metrics (numbers)** | "How is the system performing over time?"                | Prometheus + Grafana, Datadog | Capacity planning, alerting on SLO violations                      |
| **Traces (flows)**    | "Where did this request spend its time across services?" | Jaeger, Zipkin, OpenTelemetry | Find slow service in microservices; debug distributed transactions |

**Trade-off**: Logs are cheap to write but expensive to store; metrics are cheap to store but lose detail; traces are expensive to instrument but invaluable for debugging. **Start with structured logging + a few key metrics** (request rate, error rate, latency, saturation — the "Four Golden Signals"); add tracing when you have multiple services.

### The Four Golden Signals (Google SRE Book)

| Signal         | What                      | Healthy Value                                 | Alert Threshold                            |
| -------------- | ------------------------- | --------------------------------------------- | ------------------------------------------ |
| **Latency**    | Time to serve a request   | p50 < 100ms, p99 < 500ms                      | p99 > 1s for 5 minutes                     |
| **Traffic**    | Requests per second       | Varies by service                             | Drop to 0 (outage), or sudden spike (DDoS) |
| **Errors**     | Rate of failed requests   | < 0.1% for non-critical, < 0.01% for critical | Error rate > 1% for 5 minutes              |
| **Saturation** | How "full" the service is | CPU < 70%, memory < 80%                       | CPU > 90% for 10 minutes                   |

**Production lesson**: Without these four signals graphed in real-time, you cannot tell if your Walking Skeleton has degraded into a slow, error-prone production system. **Always set up dashboards BEFORE the first user**.

---

## 7. Disaster Recovery and Backup

A system that does not have backups is a system you will lose. Period. Disaster recovery planning answers: "When the worst happens, how long until we are back online?"

### Recovery Metrics

| Metric                             | Definition                      | Industry Target                        | Cost                                                   |
| ---------------------------------- | ------------------------------- | -------------------------------------- | ------------------------------------------------------ |
| **RPO (Recovery Point Objective)** | Maximum data loss in time       | 1 hour for most, 0 for financial       | Higher RPO = cheaper (less frequent backups)           |
| **RTO (Recovery Time Objective)**  | Maximum downtime after disaster | 4 hours for most, minutes for critical | Lower RTO = more expensive (hot standby, multi-region) |
| **MTTR (Mean Time To Recover)**    | Average actual recovery time    | Track, alert on degradation            | Operational metric                                     |

### Disaster Recovery Strategies (Cost vs Recovery Time)

| Strategy                     | RPO                              | RTO                | Cost                  | Use Case                              |
| ---------------------------- | -------------------------------- | ------------------ | --------------------- | ------------------------------------- |
| **Backup & restore**         | Hours (last backup)              | Hours to days      | $ (just storage)      | Cold data, dev environments           |
| **Pilot light**              | Minutes (replicated)             | 10-60 minutes      | $$ (minimal standby)  | Internal tools, non-critical services |
| **Warm standby**             | Seconds (continuous replication) | Minutes            | $$$ (full secondary)  | Customer-facing services              |
| **Multi-site active-active** | 0 (synchronous)                  | Seconds to minutes | $$$$ (full duplicate) | Mission-critical, financial           |

**Trade-off**: Lower RPO and RTO = exponentially more expensive. Most startups should start with **backup & restore** (RPO=hours, RTO=hours), then graduate to **pilot light** when revenue depends on uptime.

### Production Failure Mode: Backup Not Tested

The most common disaster recovery failure is **never testing the restore**. Companies back up nightly but discover during an actual outage that the backup is corrupted, the restore script has a bug, or the data format has changed. **Rule**: test a full restore every quarter, end-to-end, with a stopwatch. If RTO exceeds your target, you don't have disaster recovery — you have a backup you cannot use.

---

## 8. Walking Skeleton Checklist — Pre-Launch Verification

Before declaring your Walking Skeleton ready for production, verify ALL of the following:

- [ ] End-to-end happy path works: user action → API → database → response
- [ ] All architectural components communicate: frontend, backend, database, message queue, cache
- [ ] CI/CD pipeline deploys to production automatically on `git push`
- [ ] Monitoring dashboards exist for the Four Golden Signals
- [ ] Alerting fires when error rate > 1% or p99 latency > 1s
- [ ] Logs are structured (JSON) and searchable
- [ ] Database backups are configured AND tested for restore
- [ ] Chaos experiment on ONE instance causes no customer-visible impact
- [ ] Load test with 10× expected traffic shows the system degrades gracefully
- [ ] Security headers (HTTPS, HSTS, CSP) are configured
- [ ] Secrets are NOT in source code (use Vault, AWS Secrets Manager)
- [ ] Database credentials are rotated quarterly
- [ ] Dependency vulnerability scan (Snyk, Dependabot) runs on every PR
- [ ] Documentation explains how to deploy, debug, and roll back

If any of these are unchecked, your Walking Skeleton is not production-ready.

---

💡 **Final Key Insight**: System Design Fundamentals is not a one-time event — it is an **ongoing discipline**. Walking Skeleton forces you to integrate from Day 1. Chaos engineering forces you to assume failure from Day 1. CAP forces you to choose explicitly when partitions happen. Observability lets you know what is happening. Disaster recovery lets you survive when it is not. **The principles compose: a Walking Skeleton → chaos engineering → resilient production system.**

---

## PLUS Enhancements

### Crystal-Clear Diagrams

#### 1. Walking Skeleton Flow Diagram

```
   ┌──────────────────────────────────────────────────────┐
   │ User clicks "Buy" button                            │
   └────────────────────┬─────────────────────────────────┘
                        │ 1. HTTPS POST /checkout
                        ▼
   ┌──────────────────────────────────────────────────────┐
   │ Frontend (React)                                    │
   │  - Validates input                                  │
   │  - Sends authenticated request                      │
   └────────────────────┬─────────────────────────────────┘
                        │ 2. JSON over HTTP
                        ▼
   ┌──────────────────────────────────────────────────────┐
   │ API Gateway (Spring Boot)                           │
   │  - Auth check (JWT verify)                          │
   │  - Rate limit                                       │
   │  - Routes to Order Service                          │
   └────────────────────┬─────────────────────────────────┘
                        │ 3. Internal call
                        ▼
   ┌──────────────────────────────────────────────────────┐
   │ Order Service                                       │
   │  - Create order in DB                               │
   │  - Publish OrderCreated event to Kafka               │
   └────────────────────┬─────────────────────────────────┘
                        │ 4. SQL INSERT
                        ▼
   ┌──────────────────────────────────────────────────────┐
   │ Database (PostgreSQL)                               │
   │  - Returns order_id                                 │
   └────────────────────┬─────────────────────────────────┘
                        │ 5. Response back up the chain
                        ▼
   ┌──────────────────────────────────────────────────────┐
   │ User sees "Order #12345 created!"                   │
   └──────────────────────────────────────────────────────┘

Walking Skeleton = ALL these components connected, even if Order Service
just hardcodes "Order #12345" instead of doing real work.
```

#### 2. Chaos Engineering Experiment Flow

```
   ┌──────────────────────────────────────┐
   │ 1. Define hypothesis:                │
   │    "Killing one API server has no    │
   │     customer-visible impact"         │
   └────────────────┬─────────────────────┘
                    ▼
   ┌──────────────────────────────────────┐
   │ 2. Set blast radius:                │
   │    ONE instance (not an AZ)         │
   │    5-minute window                   │
   └────────────────┬─────────────────────┘
                    ▼
   ┌──────────────────────────────────────┐
   │ 3. Inject failure (Chaos Monkey):   │
   │    SIGKILL one API server           │
   └────────────────┬─────────────────────┘
                    ▼
   ┌──────────────────────────────────────┐
   │ 4. Observe metrics in real-time:    │
   │    - Error rate                      │
   │    - Latency p99                     │
   │    - Customer support tickets        │
   └────────────────┬─────────────────────┘
                    ▼
   ┌──────────────────────────────────────┐
   │ 5. Verify hypothesis:               │
   │    ✓ Confirmed: no impact           │
   │    OR                                │
   │    ✗ Refuted: error rate spiked     │
   └────────────────┬─────────────────────┘
                    ▼
   ┌──────────────────────────────────────┐
   │ 6. If refuted: fix root cause,      │
   │    re-run experiment                 │
   │    If confirmed: expand blast radius│
   └──────────────────────────────────────┘
```

#### 3. Sharding Topology Diagram

```
                ┌──────────────────────────────────┐
                │      Client request:            │
                │      GET /users/42              │
                └────────────────┬─────────────────┘
                                 ▼
                ┌──────────────────────────────────┐
                │   Router (application-side):    │
                │   shard = hash(42) % 4 = 2      │
                └────────────────┬─────────────────┘
                                 ▼
   ┌─────────────┬──────────────┼──────────────┬─────────────┐
   ▼             ▼              ▼              ▼             ▼
┌────────┐  ┌────────┐    ┌────────────┐  ┌────────┐    ┌────────┐
│Shard 0 │  │Shard 1 │    │  Shard 2   │  │Shard 3 │    │ Shard 4│
│IDs:    │  │IDs:    │    │  IDs:      │  │IDs:    │    │ (full) │
│0-24%   │  │25-49%  │    │  50-74%    │  │75-99%  │    │        │
└────────┘  └────────┘    └────────────┘  └────────┘    └────────┘
                                ▲
                                │
                          User 42 lives here
                          (range 50-74%)

   Resharding (adding Shard 4): consistent hashing moves ~25% of keys
   from each existing shard to Shard 4 — minimal disruption
```

### In-Depth Explanations

#### Mechanism Deep-Dive: CAP During Network Partition

**The setup**: Three nodes (A, B, C) form a distributed key-value store. A and B are in datacenter US-East; C is in datacenter US-West. The network between US-East and US-West fails (partition).

**CP system (e.g., ZooKeeper)**:
```
1. A and B can talk to each other; C is isolated
2. Majority quorum: A + B = 2 of 3 (66%) → still functional
3. C cannot reach a majority → C REFUSES writes and reads
4. User trying to write to C sees "Service Unavailable"
5. When partition heals, C rejoins via catch-up replication
```

**AP system (e.g., Cassandra)**:
```
1. A and B can talk to each other; C is isolated
2. A continues accepting writes (W=1, R=1, N=3 — any node can serve)
3. C continues accepting writes (independently)
4. Conflict! Same key may have different values on A/B vs C
5. When partition heals, conflict resolution via last-write-wins or vector clocks
6. User sees their write "succeed" on both sides, but values may differ temporarily
```

**The CAP trade-off**: A system cannot deliver BOTH consistency AND availability during a partition. CP refuses to serve (availability loss). AP serves potentially-inconsistent data (consistency loss).

#### Why-This-Not-That: Paxos vs Raft

| Aspect | Paxos | Raft |
|--------|-------|------|
| **Inventor** | Leslie Lamport, 1989 | Diego Ongaro, 2014 |
| **Design goal** | Correctness proof in distributed systems theory | Understandability for practitioners |
| **Variants** | Multi-Paxos, Cheap Paxos, Fast Paxos, many confusing variants | Single algorithm, easy to teach |
| **Leader** | Optional (can be leader-less) | Required (one leader per term) |
| **Implementation complexity** | Very high (months of debugging) | Moderate (days-to-weeks) |
| **Production usage** | Google Chubby (lock service) | etcd (Kubernetes), Consul, TiKV |
| **Equivalent guarantees** | Yes | Yes |

**Why Raft won**: Paxos is provably correct but notoriously hard to implement. Raft was designed specifically to be understandable — same correctness guarantees, ~10× simpler implementation. **etcd (which runs Kubernetes)** uses Raft, which is why every K8s deployment implicitly depends on Raft.

### Breadth Comparisons

#### Consistency Model Comparison

| Model | Guarantee | Latency | Example Systems | Use Case |
|-------|-----------|---------|----------------|----------|
| **Strong (linearizable)** | All reads see latest write | High (sync coordination) | Google Spanner, CockroachDB, etcd | Financial, leader election |
| **Causal** | Reads see causally-related writes | Medium | Cosmos DB (configurable) | Collaborative editing, messaging |
| **Read-your-writes** | User sees their own writes immediately | Low | DynamoDB (with consistent read flag) | User profile updates |
| **Monotonic reads** | User never sees older data after newer | Low | Cassandra (with proper read consistency) | Social feeds |
| **Eventual** | All replicas converge given enough time | Lowest | DNS, Cassandra (default), DynamoDB | Social feeds, analytics |

#### Replication Topology Comparison

| Topology | Pros | Cons | Use Case |
|----------|------|------|----------|
| **Single primary + async replicas** | Simple, fast writes | Eventual consistency, replica lag | Read-heavy workloads |
| **Single primary + sync replicas** | Strong consistency, no data loss | Higher write latency, primary bottleneck | Financial, durability-critical |
| **Multi-primary (active-active)** | Geo-distributed writes, no single point | Conflict resolution complexity, last-write-wins issues | Geo-distributed apps with low conflict |
| **Quorum (R + W > N)** | Tunable consistency/availability | Latency = max(R, W) replicas | DynamoDB, Cassandra |
| **Chain replication** | Strong consistency with high throughput | Reorganization on failure | Microsoft Azure Storage |

---

**Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [Next >](05_SD_Interview_Problems.md)
