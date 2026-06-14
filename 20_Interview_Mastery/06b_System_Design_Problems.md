**Navigation**: [< Previous](06_System_Design_Blueprint.md) | [Back to Index](00_INDEX.md) | [Next >](06c_System_Design_Internals.md)

# 🏗️ System Design Problems — Complete Guide

_"System design is not about finding the perfect solution — it's about making the right trade-offs under constraints."_

---

# PART 0: The 5W+H Framework

**Mental Model:** System design is like being an architect for a skyscraper. You don't start by choosing the color of the walls — you start with load-bearing capacity, foundation type, earthquake resistance, and fire codes. Similarly, you start with **scalability, availability, consistency, and latency** before worrying about specific technologies.

| Question  | System Design Context                                                                                                                                                                                                       |
| :-------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **WHAT**  | The process of defining the architecture, components, modules, interfaces, and data flow of a system to satisfy specified requirements at scale.                                                                            |
| **WHY**   | Because building for 100 users is completely different from building for 100 million users. Every decision at scale involves trade-offs between consistency, availability, partition tolerance (CAP), cost, and complexity. |
| **WHEN**  | Senior/Staff engineering interviews, greenfield system architecture, scaling existing systems, and post-mortem analysis of outages.                                                                                         |
| **WHERE** | Every large tech company (FAANG, startups, fintech). Systems like Netflix (video streaming), Uber (real-time dispatch), Twitter (fanout), WhatsApp (messaging at billions-scale).                                           |
| **WHO**   | Pioneered by distributed systems researchers (Lamport, Brewer, DeCandia/Amazon Dynamo). Popularized by Grokking System Design Interview.                                                                                    |
| **HOW**   | Use the **RESHADED** framework: **R**equirements → **E**stimation → **S**torage Schema → **H**igh-level design → **A**PI design → **D**etailed design → **E**valuation → **D**istinctive component deep-dive.               |

---

# PART 1: The RESHADED Framework

_Enriched from Educative "Deep Dive into System Design Interview" — RESHADED Approach_

---

```
THE RESHADED APPROACH — A structured method for ANY system design problem:

R — Requirements Gathering
    Functional:   "What should the system DO?"  (core features)
    Non-functional: "HOW should it perform?"  (scale, latency, availability)

    ALWAYS ASK:
    • How many users? (DAU, MAU)
    • Read-heavy or write-heavy?
    • What latency is acceptable?
    • What consistency model? (strong vs eventual)
    • What's the availability target? (99.9% = 8.7h downtime/year)

E — Estimation (Back-of-the-Envelope)
    • QPS (queries per second) = DAU × avg_queries / 86400
    • Storage = daily_new_data × retention_period
    • Bandwidth = QPS × avg_object_size
    • Memory (cache) = 20% of daily read requests (Pareto principle)

    NAPKIN MATH CHEAT SHEET:
    1 million requests/day ≈ 12 QPS
    1 billion requests/day ≈ 12,000 QPS
    1 KB × 1 billion = 1 TB
    1 MB × 1 million = 1 TB

S — Storage Schema
    Choose: SQL vs NoSQL vs both
    Define tables/collections, primary keys, indexes
    Consider: read patterns, write patterns, joins needed?

H — High-Level Design
    Draw the 30,000-foot architecture:
    Client → Load Balancer → API Servers → Cache → Database
    Add: CDN, Message Queues, Search Index as needed

A — API Design
    Define REST/gRPC endpoints:
    POST /api/v1/tweets  (create)
    GET  /api/v1/timeline?user_id=123&page=1  (read)

D — Detailed Design
    Deep dive into 2-3 critical components:
    • How does the newsfeed get generated?
    • How do we handle concurrent writes?
    • What happens when a server goes down?

E — Evaluation (Trade-offs)
    Discuss alternatives and why you chose this path:
    • SQL vs NoSQL? → chose NoSQL for horizontal scaling
    • Push vs Pull model? → hybrid for different user types
    • Strong vs eventual consistency? → eventual for availability

D — Distinctive Components
    What makes THIS system unique?
    • Twitter: Fanout-on-write vs fanout-on-read
    • Uber: Geospatial indexing + real-time matching
    • WhatsApp: End-to-end encryption + delivery receipts
```

---

# PART 2: Design Problems

---

## 2.1 Design a URL Shortener (TinyURL)

_Enriched from Educative "Deep Dive SD" — Design a URL Shortening Service_

```
REQUIREMENTS:
  Functional:
    • Given a long URL → generate short URL (e.g., tiny.url/abc123)
    • Given short URL → redirect to original URL
    • Custom aliases (optional)
    • Link expiration
  Non-functional:
    • 100M URLs/day created, 10:1 read/write ratio → 1B reads/day
    • URL should be as short as possible
    • 99.99% availability (it's infrastructure!)

ESTIMATION:
  Write: 100M/day = ~1200 QPS
  Read:  1B/day = ~12,000 QPS
  Storage: 100M × 500 bytes = 50 GB/day → 18 TB/year (5 year retention)
  Memory cache: 20% of 1B × 500 bytes = 100 GB (hot URLs in cache)

KEY GENERATION — The Core Challenge:
  Need 100M × 365 × 5 = ~180 billion unique short URLs

  Option 1: Base62 encoding (a-z, A-Z, 0-9)
    6 chars → 62⁶ = 56.8 billion combinations
    7 chars → 62⁷ = 3.5 trillion combinations ✅

  Option 2: MD5/SHA-256 hash → take first 7 chars
    Problem: collisions! Need collision resolution.

  Option 3: Pre-generated Key Service (KGS)
    Generate all possible 7-char keys in advance
    Store in a Key-DB, mark as "used" when assigned
    KGS servers keep some keys in memory for speed
    ✅ No collision, ✅ No computation at request time

HIGH-LEVEL ARCHITECTURE:
  ┌────────┐     ┌──────────┐     ┌───────────┐
  │ Client │────→│   LB     │────→│ App Server│
  └────────┘     └──────────┘     └─────┬─────┘
                                        │
                              ┌─────────┴─────────┐
                              │                   │
                         ┌────▼───┐         ┌─────▼────┐
                         │ Cache  │         │ Key Gen  │
                         │ (Redis)│         │ Service  │
                         └────┬───┘         └──────────┘
                              │
                         ┌────▼────┐
                         │   DB    │
                         │(NoSQL)  │
                         └─────────┘

DATABASE SCHEMA (NoSQL — Cassandra/DynamoDB):
  Table: urls
  | short_url (PK) | long_url | created_at | expires_at | user_id |

TRADE-OFFS:
  • KGS vs hash-based: KGS eliminates collisions but adds a service
  • SQL vs NoSQL: NoSQL for simple key-value lookups at scale
  • Cache eviction: LRU for short URLs (most recent = most accessed)
```

---

## 2.2 Design Twitter / X

_Enriched from Educative "Deep Dive SD" — Design Twitter_

```
REQUIREMENTS:
  • Post tweets (280 chars + media)
  • Follow/unfollow users
  • Home timeline (tweets from people you follow)
  • Search tweets
  • Trending topics
  Scale: 500M users, 200M DAU, 500M tweets/day

ESTIMATION:
  Write QPS: 500M tweets / 86400 = ~6000 QPS
  Read QPS (timeline): 200M × 10 refreshes = 2B / 86400 = ~23,000 QPS
  Storage: 500M × 300 bytes/tweet = 150 GB/day → 55 TB/year

THE CRITICAL DESIGN DECISION — Fanout:

  FANOUT-ON-WRITE (Push model):
    When user A posts a tweet:
    → Push tweet to ALL followers' timelines immediately
    → Store pre-computed timelines in cache (Redis)

    ✅ Timeline read is O(1) — just fetch from cache
    ❌ Celebrity problem: user with 50M followers →
       50M writes per tweet! (write amplification)

  FANOUT-ON-READ (Pull model):
    When user B opens timeline:
    → Fetch latest tweets from ALL users B follows
    → Merge and sort in real-time

    ✅ No write amplification
    ❌ Slow: fetching from hundreds of users at read time

  HYBRID (Twitter's actual approach):
    • Regular users (< 10K followers): fanout-on-write → push to followers
    • Celebrities (> 10K followers): fanout-on-read → pull at read time
    • Merge both at timeline read time

DATA STORAGE:
  User data: SQL (MySQL/PostgreSQL) — relational, ACID
  Tweets: NoSQL (Cassandra) — massive write throughput
  Timelines: Redis — pre-computed, in-memory for O(1) reads
  Media: Object storage (S3) + CDN
  Search: Elasticsearch / Apache Solr

ARCHITECTURE:
  Client → LB → API Servers → {Tweet Service, Timeline Service,
                                 Search Service, Media Service}

  Tweet Service: stores tweets, triggers fanout
  Timeline Service: reads/merges pre-built + celebrity timelines
  Fanout Service: async workers pushing tweets to follower timelines
  Notification Service: push notifications for mentions/likes
```

---

## 2.3 Design Instagram

_Enriched from Educative "Deep Dive SD" — Design Instagram_

```
REQUIREMENTS:
  • Upload/view photos and videos
  • Follow users, like/comment on posts
  • Generate personalized feed (explore + home)
  Scale: 1B users, 500M DAU, 100M photos/day

KEY DIFFERENCES FROM TWITTER:
  • Media-heavy (photos/videos) vs text-heavy
  • Feed ranking algorithm (not chronological)
  • Stories (ephemeral content, 24h TTL)

MEDIA STORAGE ARCHITECTURE:
  Upload flow:
  Client → Upload Service → Object Storage (S3)
                          → CDN origin (for caching)
                          → Image Processing (resize, thumbnails, filters)
                          → Metadata DB (PostgreSQL)

  Read flow:
  Client → CDN (cache hit: ~95%) → Object Storage (cache miss)

FEED GENERATION (ML-powered ranking):
  1. Candidate generation: fetch recent posts from followed users
  2. Feature extraction: engagement signals, recency, user affinity
  3. ML ranking model: predict P(engagement) for each post
  4. Re-ranking: diversity, demotion of seen content
  5. Return ranked feed

STORAGE ESTIMATES:
  Photos: 100M/day × 2 MB avg = 200 TB/day raw
  With 4 resolutions: 200 TB × 4 = 800 TB/day
  CDN bandwidth: massive → multi-CDN strategy (Akamai + CloudFront)
```

---

## 2.4 Design WhatsApp

_Enriched from Educative "Deep Dive SD" — Design WhatsApp_

```
REQUIREMENTS:
  • 1-to-1 real-time messaging
  • Group chats (up to 1024 members)
  • Read receipts (sent ✓, delivered ✓✓, read ✓✓ blue)
  • End-to-end encryption
  • Media sharing
  • Online/offline presence
  Scale: 2B users, 100B messages/day

REAL-TIME MESSAGING — WebSocket Architecture:
  1. User A opens app → establishes WebSocket to chat server
  2. User A sends message → chat server receives
  3. Chat server looks up: "Which server is User B connected to?"
     → Session Service (Redis): maps user_id → server_id
  4. Route message to User B's chat server
  5. User B's server pushes via WebSocket

  If User B is OFFLINE:
  → Store in message queue (persistent)
  → Deliver when User B reconnects
  → Push notification via APNs/FCM

MESSAGE DELIVERY GUARANTEES:
  Sent (✓):     Server ACKs receipt from sender
  Delivered (✓✓): Server confirms User B's device received it
  Read (✓✓ blue):  User B's app sends "read receipt" back

END-TO-END ENCRYPTION (Signal Protocol):
  • Key exchange: Diffie-Hellman (X3DH)
  • Message encryption: AES-256-GCM
  • Server CANNOT read messages (only encrypted blobs)
  • Each message has unique key (forward secrecy)

GROUP CHAT DESIGN:
  Small groups (< 256): store messages per group
  Each member decrypts independently (sender encrypts N times)

  Message ordering: Lamport timestamps per group
  Consistency: eventual (slight ordering differences between devices OK)
```

---

## 2.5 Design YouTube

_Enriched from Educative "Deep Dive SD" — Design YouTube_

```
REQUIREMENTS:
  • Upload videos (any format, up to 12 hours)
  • Stream videos (adaptive bitrate)
  • Search videos
  • Recommendations
  Scale: 2B users, 1B hours watched/day, 500 hours uploaded/minute

VIDEO UPLOAD PIPELINE:
  1. Client uploads raw video → Upload Service
  2. Upload Service → Object Storage (raw)
  3. Transcoding Service (async):
     Convert to multiple formats & resolutions:
     • 240p, 360p, 480p, 720p, 1080p, 4K
     • H.264, H.265, VP9, AV1 codecs
     • ~1 hour of video = 10-50 transcoding tasks
  4. Store transcoded segments → CDN origin
  5. Update metadata DB: status = "ready"

ADAPTIVE BITRATE STREAMING (ABR):
  Video split into 2-10 second SEGMENTS
  Each segment available in multiple qualities
  Client dynamically switches quality based on bandwidth:

  Buffering? → drop to 360p
  Fast connection? → upgrade to 1080p

  Protocols: HLS (Apple) or DASH (standard)

RECOMMENDATION ENGINE:
  Collaborative filtering: "Users who watched X also watched Y"
  Content-based: analyze video metadata, thumbnails, transcripts
  Deep learning: user watch history → neural network → ranked candidates

  A/B testing: continuously experiment with ranking algorithms
```

---

## 2.6 Design Uber

_Enriched from Educative "Deep Dive SD" — Design Uber_

```
REQUIREMENTS:
  • Rider requests ride → matched with nearest driver
  • Real-time driver location tracking
  • ETA calculation
  • Fare estimation & payment
  • Trip history
  Scale: 100M riders, 5M drivers, 20M rides/day

GEOSPATIAL INDEXING — The Core Challenge:
  "Find all drivers within 3 km of this location"

  Naive: scan all 5M drivers → O(n) per query → too slow

  Solution 1: GEOHASHING
    Divide world into grid cells, each cell = a hash
    "9q8yy" = a specific ~150m × 150m area in San Francisco
    Adjacent cells have similar prefixes
    Query: find all drivers with geohash prefix "9q8y*"

  Solution 2: QUADTREE
    Recursively divide space into 4 quadrants
    Each leaf node stores drivers in that area
    Search: traverse tree for nearby quadrants

  Uber uses: H3 (Uber's hexagonal hierarchical indexing)

MATCHING ALGORITHM:
  1. Rider requests ride at location (lat, lng)
  2. Find all available drivers within radius (geohash query)
  3. Filter: driver heading toward rider, ETA < threshold
  4. Rank by: ETA, rating, driver preference
  5. Send request to top driver → 15 second timeout
  6. If declined → next driver (cascade)

REAL-TIME LOCATION UPDATES:
  5M drivers × 1 update every 3 seconds = ~1.7M updates/sec

  Architecture:
  Driver app → WebSocket → Location Service →
    → Update driver's geohash in Redis (sorted set by geohash)
    → Push to rider's map (if in active trip)
    → Store in time-series DB (for ETA model, analytics)

FARE CALCULATION:
  Base fare + (time × rate/min) + (distance × rate/km) × surge_multiplier
  Surge pricing: when demand > supply in a geohash region
```

---

## 2.7 Design Google Maps

_Enriched from Educative "Deep Dive SD" — Design Google Maps_

```
REQUIREMENTS:
  • Display map tiles at various zoom levels
  • Search for places (POI)
  • Navigation (turn-by-turn directions)
  • Real-time traffic
  • ETA estimation

MAP TILE SYSTEM:
  World map divided into tiles at each zoom level:
  Zoom 0: 1 tile (entire world)
  Zoom 1: 4 tiles (2×2 grid)
  Zoom 2: 16 tiles (4×4 grid)
  ...
  Zoom 20: ~1 trillion tiles (for street-level detail)

  Each tile = 256×256 pixel PNG/WebP image
  Pre-rendered and stored on CDN
  Client requests tiles for visible viewport + buffer

ROUTING — Shortest Path at Scale:
  Road network = GRAPH (intersections = nodes, roads = edges)

  Dijkstra's?  → too slow for country-scale (millions of nodes)

  CONTRACTION HIERARCHIES:
  1. Pre-process: rank nodes by importance
  2. Add "shortcut edges" between important nodes
  3. At query time: bidirectional search on simplified graph
  4. Result: continental-scale routing in < 1 second

  A* SEARCH with landmarks (ALT algorithm):
  Use triangle inequality with pre-computed landmark distances
  for better heuristic guidance.

REAL-TIME TRAFFIC:
  Sources: driver GPS traces, road sensors, incidents
  Update edge weights in graph every 30-60 seconds
  Recent GPS traces → speed estimation per road segment
  ML model: predict traffic 15-60 minutes ahead
```

---

## 2.8 Design a Web Crawler

_Enriched from Educative "Deep Dive SD" — Design a Web Crawler_

```
REQUIREMENTS:
  • Crawl the entire web (~5 billion pages)
  • Respect robots.txt
  • Handle duplicates, traps (infinite URLs)
  • Politeness: don't overload any single server
  • Recrawl pages at appropriate frequency

ARCHITECTURE:
  URL Frontier (priority queue) → DNS Resolver → Fetcher →
  Content Parser → Duplicate Detector → URL Extractor →
  URL Filter → back to URL Frontier

URL FRONTIER — Politeness + Priority:
  Two-level queue:
  1. Priority queue: rank URLs by importance (PageRank, freshness)
  2. Politeness queue: one queue per domain, rate-limited
     → Never more than 1 request/second to same domain

  Backend: Redis sorted sets OR custom distributed queue

DUPLICATE DETECTION:
  Can't store 5 billion full pages to compare!

  Solution: SIMHASH / MINHASH
  Compute fingerprint (64-bit hash) of page content
  Compare fingerprints: if Hamming distance < threshold → duplicate

  URL deduplication: Bloom filter (probabilistic, space-efficient)
  "Have we seen this URL before?" → check bloom filter →
  99.99% accurate with much less memory than a hash set

CRAWLER TRAPS:
  Infinite pagination: /page/1, /page/2, ... /page/999999
  Calendar pages: /calendar/2025/01/01, /calendar/2025/01/02, ...
  Solution: max depth per domain, URL pattern detection
```

---

## 2.9 Design a Newsfeed System

_Enriched from Educative "Deep Dive SD" — Design Newsfeed System_

```
REQUIREMENTS:
  • Generate personalized feed from friends' posts
  • Real-time updates (new posts appear quickly)
  • Rich content: text, images, videos, links
  Scale: 1B users, 500M DAU

FEED GENERATION (same fanout problem as Twitter):

  PUSH MODEL (fanout-on-write):
  Post created → Fan out to all friends' feed caches
  ✅ Fast reads (pre-computed)
  ❌ Expensive writes for popular users

  PULL MODEL (fanout-on-read):
  User opens app → fetch latest posts from all friends → merge + rank
  ✅ Cheap writes
  ❌ Slow reads (merge N sources in real-time)

  HYBRID (Facebook's approach):
  Push for friends with < 10K followers
  Pull for celebrities/pages at read time
  ML ranking layer on top: P(engagement) scoring

RANKING ALGORITHM:
  Features: affinity score, post age, content type, past engagement
  Model: gradient-boosted trees or deep neural network
  Objective: maximize meaningful social interactions (not just clicks)

  Edge Rank (original Facebook formula):
  Score = Σ (Affinity × Weight × Decay)
  Affinity = how close you are to the poster
  Weight = type of interaction (comment > like > view)
  Decay = time since post (exponential decay)
```

---

## 2.10 Design a Typeahead / Autocomplete System

_Enriched from Educative "Deep Dive SD" — Design Typeahead Suggestion_

```
REQUIREMENTS:
  • As user types, show top-10 suggestions
  • Latency < 100ms (feels instant)
  • Suggestions ranked by popularity/relevance
  Scale: 5 billion searches/day, 200K QPS at peak

DATA STRUCTURE — TRIE (Prefix Tree):

  Root
  ├── t
  │   ├── tr
  │   │   ├── tre → "tree" (freq: 1000)
  │   │   └── tri → "triangle" (freq: 500)
  │   └── tw
  │       └── twi → "twitter" (freq: 8000)
  └── u
      └── ub
          └── ube → "uber" (freq: 5000)

  Each node stores: top-K results for that prefix
  Lookup "tw" → instantly return ["twitter", "twitch", "tweet"]

  OPTIMIZATION:
  • Store top-K at each node (avoid traversing subtree)
  • Shard trie by first 2 chars: "aa"-"az" on server 1, etc.
  • Cache hot prefixes in Redis

  TRIE UPDATE:
  • Don't update on every search (too expensive)
  • Batch update: aggregate search counts every 15 minutes
  • Rebuild trie weekly, apply incremental updates in between

PERSONALIZATION:
  Combine: global_frequency × 0.3 + personal_history × 0.5 + recency × 0.2
  Store user's recent searches separately (Redis per user)
```

---

🔬 **Section Challenge — 2.10 Design a Typeahead / Autocomplete System**

**Challenge 1 (Design — Who/When/What):** You shard the autocomplete Trie by first 2 chars. A user types "tw". **Who** routes the request? **When** does the top-K list get stale? **What** happens if the "tw" shard goes down?\n\n<details><summary>Answer</summary>\n\n**Who routes?** The API Gateway / Load Balancer — it hashes the 2-char prefix to determine the correct Trie shard. "tw" always maps to shard 3 (or whichever is assigned). **When stale?** Top-K counts are batch-updated every 15-30 minutes (real-time updates are too expensive for 200K QPS). So trending terms (viral tweet, breaking news) may not appear for 15 minutes. **If shard down?** All queries starting with "tw" fail — 1/676 (2-char combos) of all queries degrade. Mitigation: (1) Replica per shard for read failover. (2) Cache hot prefixes in Redis as a warm fallback — even if Redis has 5-minute-old top-K, it's better than empty results. (3) Graceful degradation: return empty suggestions rather than error.\n\n</details>

# Quick Reference — System Design Cheat Sheet

| System            | Core Challenge                | Key Pattern                 |
| ----------------- | ----------------------------- | --------------------------- |
| **URL Shortener** | Key generation at scale       | Pre-generated keys + NoSQL  |
| **Twitter**       | Timeline at scale             | Hybrid fanout (push + pull) |
| **Instagram**     | Media storage + ML feed       | CDN + ML ranking            |
| **WhatsApp**      | Real-time messaging           | WebSocket + message queue   |
| **YouTube**       | Video transcoding + streaming | Adaptive bitrate + CDN      |
| **Uber**          | Geospatial matching           | Geohashing + WebSocket      |
| **Google Maps**   | Routing at scale              | Contraction hierarchies     |
| **Web Crawler**   | Scale + politeness            | URL frontier + bloom filter |
| **Newsfeed**      | Personalized ranking          | Hybrid fanout + ML ranking  |
| **Typeahead**     | Low-latency prefix search     | Trie + top-K caching        |

---

## 🔗 Cross-References

| Topic                        | Related Content                                                               |
| ---------------------------- | ----------------------------------------------------------------------------- |
| Distributed system internals | [System Design Internals](06c_System_Design_Internals.md)                     |
| System design fundamentals   | [System Design Blueprint](06_System_Design_Blueprint.md)                      |
| Caching patterns             | [Spring Boot Caching](../07_Modern_Java/Ch44_SB_Caching_Scheduling.md)        |
| Message queues (Kafka)       | [Message Queues](../07_Modern_Java/Ch54_Message_Queues_Kafka.md)              |
| Microservices patterns       | [Microservices Patterns](../07_Modern_Java/Ch62_SB_Microservices_Patterns.md) |
| Trie (typeahead)             | [Advanced DS](../03_Algorithms/07a_Advanced_DS_Core.md)                       |
| Graph algorithms (routing)   | [Graph Algorithms](../03_Algorithms/05c_Graphs_Fundamentals.md)               |
| Hashing (consistent hashing) | [HashTable DS](../02_Data_Structures/01e_HashTable.md)                        |
