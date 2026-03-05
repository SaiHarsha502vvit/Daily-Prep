> **Navigation**: [Back to Index](../00_MASTER_INDEX.md) | [Database Internals](../08_SQL_Database/21_Database_Internals.md)
> 🧠 **Mental Model**: See [System Design Thinking](../14_Mental_Models/15_System_Design_Thinking.md)

---

# 🗄️ NoSQL & MongoDB — When SQL Isn't Enough

> Document, Key-Value, Column-Family, Graph — know when to use what

---

## Part 1: NoSQL Categories

```
TYPE              │ EXAMPLES          │ DATA MODEL     │ BEST FOR
────────────────────┼───────────────────┼────────────────┼────────────────────
Document Store    │ MongoDB, CouchDB  │ JSON documents │ Flexible schema,
                  │ Firestore         │ (nested)       │ content mgmt, catalogs
────────────────────┼───────────────────┼────────────────┼────────────────────
Key-Value Store   │ Redis, DynamoDB   │ key → blob     │ Caching, sessions,
                  │ Memcached         │                │ real-time counters
────────────────────┼───────────────────┼────────────────┼────────────────────
Column-Family     │ Cassandra, HBase  │ Wide columns,  │ Time-series, IoT,
                  │ ScyllaDB          │ row key        │ write-heavy workloads
────────────────────┼───────────────────┼────────────────┼────────────────────
Graph Database    │ Neo4j, Amazon     │ Nodes + edges  │ Social networks,
                  │ Neptune           │ + properties   │ recommendations,
                  │                   │                │ fraud detection
```

---

## Part 2: SQL vs NoSQL Decision Framework

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  CHOOSE SQL WHEN:                          CHOOSE NoSQL WHEN:                   │
│  ✅ Complex queries with JOINs             ✅ Flexible/evolving schema            │
│  ✅ ACID transactions required             ✅ Massive write throughput            │
│  ✅ Strong consistency needed              ✅ Horizontal scaling needed           │
│  ✅ Well-defined, stable schema            ✅ Data naturally nested/denorm.       │
│  ✅ Complex reporting/analytics            ✅ Low latency at any scale            │
│                                                                                 │
│  EXAMPLES:                                  EXAMPLES:                           │
│  • Banking, financial systems              • Product catalogs (MongoDB)         │
│  • Order management                        • Session storage (Redis)            │
│  • User accounts with roles                • Chat messages (Cassandra)          │
│  • Anything needing ad-hoc queries         • Social graphs (Neo4j)              │
│                                                                                 │
│  COMMON PATTERN: Polyglot persistence — use BOTH                                │
│  → PostgreSQL for orders (ACID)                                                 │
│  → Redis for caching/sessions                                                   │
│  → Elasticsearch for search                                                     │
│  → MongoDB for product catalog                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 3: MongoDB Deep Dive

```
// ── Document Structure (BSON = Binary JSON) ──
{
  _id: ObjectId("507f1f77bcf86cd799439011"),  // auto-generated unique ID
  name: "John Doe",
  email: "john@example.com",
  address: {                    // embedded document (denormalized)
    street: "123 Main St",
    city: "Springfield",
    state: "IL"
  },
  orders: [                     // embedded array
    { orderId: "ORD001", total: 99.99, date: ISODate("2024-01-15") },
    { orderId: "ORD002", total: 149.50, date: ISODate("2024-02-20") }
  ],
  tags: ["premium", "active"]
}

// ── CRUD Operations ──
db.users.insertOne({ name: "Alice", email: "alice@example.com" })
db.users.find({ "address.city": "Springfield" })           // dot notation for nested
db.users.find({ orders: { $elemMatch: { total: { $gt: 100 } } } })  // array query
db.users.updateOne({ _id: id }, { $set: { name: "Alice Smith" } })
db.users.updateOne({ _id: id }, { $push: { tags: "vip" } })  // add to array
db.users.deleteOne({ _id: id })

// ── Aggregation Pipeline ──
db.orders.aggregate([
  { $match: { status: "completed" } },             // filter
  { $group: { _id: "$customerId",                  // group by customer
              totalSpent: { $sum: "$amount" },
              orderCount: { $sum: 1 } } },
  { $sort: { totalSpent: -1 } },                   // sort descending
  { $limit: 10 }                                    // top 10
])

// ── Indexes ──
db.users.createIndex({ email: 1 }, { unique: true })          // unique index
db.users.createIndex({ "address.city": 1, name: 1 })          // compound index
db.users.createIndex({ name: "text", bio: "text" })            // text search index
db.events.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 }) // TTL index
```

### Data Modeling: Embed vs Reference

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║  EMBED (Denormalize):                      REFERENCE (Normalize):                ║
║  Store related data in same document       Store ID, look up separately          ║
║                                                                                  ║
║  // Embedded                               // Referenced                         ║
║  { name: "John",                           { name: "John",                       ║
║    address: { city: "NYC" } }                addressId: ObjectId("...") }        ║
║                                                                                  ║
║  ✅ Single read (fast)                     ✅ Data not duplicated                  ║
║  ✅ Atomic updates                         ✅ Many-to-many relationships           ║
║  ❌ Document size limit (16MB)             ❌ Requires $lookup (JOIN)              ║
║  ❌ Data duplication                       ❌ Multiple reads                       ║
║                                                                                  ║
║  RULE OF THUMB:                                                                  ║
║  → 1:1 or 1:Few → EMBED (address in user)                                        ║
║  → 1:Many (bounded) → EMBED (orders in user, if < 100)                           ║
║  → 1:Many (unbounded) → REFERENCE (comments on a viral post)                     ║
║  → Many:Many → REFERENCE (students ↔ courses)                                    ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

---

## Part 4: Redis Quick Reference

```
// ── Data Structures ──
SET user:1:name "John"            // String
GET user:1:name                   // → "John"

HSET user:1 name "John" age 30   // Hash (like a mini document)
HGETALL user:1                    // → name: John, age: 30

LPUSH queue:orders "order123"     // List (queue/stack)
RPOP queue:orders                 // → "order123"

SADD user:1:tags "premium" "vip"  // Set (unique values)
SISMEMBER user:1:tags "premium"   // → true

ZADD leaderboard 100 "Alice" 85 "Bob"  // Sorted Set (ranked data)
ZREVRANGE leaderboard 0 9              // Top 10 by score

// ── Common Use Cases ──
// Caching: SET + TTL
SET api:response:key "{json}" EX 300    // cache for 5 minutes

// Rate Limiting
INCR rate:user:123:minute
EXPIRE rate:user:123:minute 60

// Session Storage
HSET session:abc userId "123" role "admin" expiry "1700000000"

// Distributed Lock (Redlock)
SET lock:order:456 "owner-id" NX EX 30  // acquire lock for 30s
// NX = only if not exists (atomic)
```

---

## Part 5: Interview Questions

```
Q: "When would you choose MongoDB over PostgreSQL?"
A: When schema changes frequently (e.g., product catalog with varying attributes),
   when data is naturally document-shaped, when horizontal scaling is priority,
   and when you don't need complex multi-collection JOINs or ACID across documents.

Q: "How does MongoDB handle transactions?"
A: Since v4.0: multi-document ACID transactions (like SQL).
   But they're expensive — design your schema to minimize their need.
   Embed related data so single-document operations are atomic by default.

Q: "Redis vs Memcached?"
A: Redis: data structures (hashes, lists, sets, sorted sets), persistence,
   pub/sub, Lua scripting, clustering. Full-featured.
   Memcached: simpler, multi-threaded, pure key-value cache.
   Redis wins for most use cases unless you need raw multi-threaded speed.
```

---

> **Navigation**: [< Previous](21_Database_Internals.md) | [Back to Index](../00_MASTER_INDEX.md) | [Next >](23_SQL_Deep_Reasoning.md)