# 50. Schema Design From Requirements — The Backend Engineer's Core Skill

**Navigation**: [← 49: SQL Internals Deep](49_SQL_Internals_Deep.md) | [📚 SQL Index](00_INDEX.md) | [36: Advanced Data Modeling (OLAP) →](36_Advanced_Data_Modeling.md)

> **KTH ID2212 / TU Munich Database Systems / CMU 15-445 design track**
>
> Every other SQL chapter teaches you to *query* a schema someone else designed. This one teaches you to **produce the schema** — the decision that constrains every query, every migration, and every performance problem for the lifetime of the system.

> **Why this is the highest-stakes chapter in the module.** A bad query is a bad afternoon. A bad schema is a bad *year* — it is the one artifact that resists change once data and code depend on it. [Ch36](36_Advanced_Data_Modeling.md) covers analytical (OLAP) modeling; this chapter covers the transactional (OLTP) schema that the business actually runs on.

---

## Table of Contents

1. [5W1H](#5w1h)
2. [The Design Pipeline — Requirements to DDL](#1-the-design-pipeline--requirements-to-ddl)
3. [Step 1: Extract Entities and Relationships](#2-step-1-extract-entities-and-relationships-from-prose)
4. [Step 2: Key Design](#3-step-2-key-design-the-decision-you-cannot-undo)
5. [Step 3: Constraints Are the Correctness Layer](#4-step-3-constraints-are-the-correctness-layer)
6. [Step 4: Index Strategy as a Design Discipline](#5-step-4-index-strategy-as-a-design-discipline)
7. [Modeling the Hard Things](#6-modeling-the-hard-things)
8. [Deliberate Denormalization](#7-deliberate-denormalization--and-how-to-do-it-safely)
9. [Schema Evolution Under Load](#8-schema-evolution-under-load--expandcontract)
10. [The Design Review Checklist](#9-the-design-review-checklist)
11. [Worked Design: An Order System, End to End](#10-worked-design-an-order-system-end-to-end)
12. [Practice Challenges](#-practice-challenges)
13. [Reality Check](#reality-check)

---

## 5W1H

- **WHAT**: The repeatable process for turning business requirements into a transactional schema — tables, keys, constraints, and indexes — that is correct, performant, and survivable under change.
- **WHY**: Because the schema is the most expensive thing in the system to get wrong. Application code can be refactored in an afternoon; a schema with 400 million rows and eleven services reading it cannot. **Schema mistakes compound; code mistakes do not.**
- **WHO**: Every backend engineer. This is not a DBA specialty — the person who writes the feature designs the tables, and the DBA (if one exists) reviews them.
- **WHEN**: Before writing any application code. The schema is the contract that the code implements, not the residue the ORM leaves behind.
- **WHERE**: The gap between a product requirement written in English and a `CREATE TABLE` statement.
- **HOW**: Entities → relationships → keys → constraints → *then* query patterns → indexes. In that order, because indexes are derived from queries and queries are derived from the model.

---

## 1. The Design Pipeline — Requirements to DDL

```
┌─ 1. ENTITIES ────────────────────────────────────────────┐
│  Nouns the business cares about that have IDENTITY       │
│  and a lifecycle. (Not every noun is an entity — §2.)    │
└────────────────────┬─────────────────────────────────────┘
                     ▼
┌─ 2. RELATIONSHIPS ───────────────────────────────────────┐
│  Cardinality (1:1, 1:N, M:N) and OPTIONALITY for each.   │
│  M:N always becomes a join table — and that table        │
│  usually turns out to be an entity in its own right.     │
└────────────────────┬─────────────────────────────────────┘
                     ▼
┌─ 3. KEYS ────────────────────────────────────────────────┐
│  Primary keys (surrogate vs natural), foreign keys,      │
│  and the UNIQUE constraints that encode business rules.  │
└────────────────────┬─────────────────────────────────────┘
                     ▼
┌─ 4. CONSTRAINTS ─────────────────────────────────────────┐
│  NOT NULL, CHECK, FK actions, uniqueness.                │
│  This is the correctness layer — the LAST line of        │
│  defense that survives every buggy client. (§4)          │
└────────────────────┬─────────────────────────────────────┘
                     ▼
┌─ 5. QUERY PATTERNS ──────────────────────────────────────┐
│  ONLY NOW: write the 10-20 queries the app will run,     │
│  with their frequency and latency requirements.          │
└────────────────────┬─────────────────────────────────────┘
                     ▼
┌─ 6. INDEXES ─────────────────────────────────────────────┐
│  Derived from step 5. Never sprinkled. Every index is    │
│  a read-speed purchase paid for with write cost. (§5)    │
└────────────────────┬─────────────────────────────────────┘
                     ▼
┌─ 7. EVOLUTION PLAN ──────────────────────────────────────┐
│  How does this change under load without downtime? (§8)  │
└──────────────────────────────────────────────────────────┘
```

**The ordering is load-bearing.** The most common failure is designing indexes at step 3 (before knowing the queries) or letting an ORM generate the schema from classes (which skips steps 1–4 entirely and produces a model shaped by the object graph rather than by the data's actual relationships and invariants).

---

## 2. Step 1: Extract Entities and Relationships From Prose

### 2.1 The requirement, as you actually receive it

> *"Customers place orders. An order contains one or more products with quantities. Orders have a status that changes over time, and we need to know who changed it and when. Customers have multiple shipping addresses, and an order ships to one of them — but if a customer edits an address later, old orders must still show the address as it was at the time of shipping."*

**⏸️ Before reading on: extract the entities and relationships yourself.** That last sentence is the one that carries the real design decision.

### 2.2 The extraction

**Candidate nouns:** customer, order, product, quantity, status, address.

**Which are entities?** An entity has (a) identity — you can meaningfully say "*this* one" — and (b) an independent lifecycle.

| Noun | Entity? | Why |
| --- | --- | --- |
| Customer | ✅ | Has identity, exists independent of orders |
| Order | ✅ | Has identity and a lifecycle |
| Product | ✅ | Exists independent of any order |
| Address | ✅ | Has identity, edited independently |
| **Quantity** | ❌ | An *attribute of the relationship* between order and product |
| **Status** | ❌ *and* ✅ | The current value is an attribute; the *history* ("who changed it and when") is an entity — `order_status_history` |

**That status row is the whole point of this step.** "We need to know who changed it and when" converts an attribute into an entity. Requirements phrased as history, audit, or "as it was at the time" are always telling you to add a table.

### 2.3 Relationships and cardinality

| Relationship | Cardinality | Optionality | Becomes |
| --- | --- | --- | --- |
| Customer → Order | 1:N | An order *must* have a customer | FK `orders.customer_id NOT NULL` |
| Order ↔ Product | **M:N with attributes** | — | Join table `order_items` (qty, price) |
| Customer → Address | 1:N | A customer may have zero | FK `addresses.customer_id` |
| Order → shipping address | 1:1 | — | **⚠️ see §2.4** |
| Order → status history | 1:N | At least one (creation) | `order_status_history` |

### 2.4 The temporal trap — the sentence that changes the design

> *"if a customer edits an address later, old orders must still show the address as it was at the time of shipping"*

The naive model is `orders.shipping_address_id → addresses.id`. **This is wrong**, and it is wrong in a way that only shows up months later in a customer-service dispute: when the customer edits the address, every historical order retroactively "shipped" to the new address. You have destroyed history.

**The three correct options:**

| Option | How | When to use |
| --- | --- | --- |
| **Snapshot (copy)** | Copy the address fields onto the order at ship time | ✅ Best here — simple, immune to later edits, and the order genuinely *needs* its own copy |
| **Immutable versions** | Never UPDATE an address; INSERT a new version; orders point at a version id | When you need the full edit history of addresses themselves |
| **Bitemporal** | Track both valid-time and transaction-time | Regulated/financial domains ([10_Enterprise Finance](../10_Enterprise_Systems/03_ERP_Finance_Core.md)) |

```sql
-- The snapshot approach: the order OWNS its shipping address at ship time.
CREATE TABLE orders (
    id                  BIGSERIAL PRIMARY KEY,
    customer_id         BIGINT NOT NULL REFERENCES customers(id),
    -- FK kept for "which address did they pick", nullable because the
    -- address row may later be deleted; the snapshot below is the truth.
    shipping_address_id BIGINT REFERENCES addresses(id) ON DELETE SET NULL,
    -- the snapshot — this is what is displayed and disputed
    ship_line1          TEXT NOT NULL,
    ship_city           TEXT NOT NULL,
    ship_postcode       TEXT NOT NULL,
    ship_country        CHAR(2) NOT NULL,
    ...
);
```

> **The general rule:** *if a value must be true "as of" a moment, it belongs to the thing that happened, not to the thing that changes.* Order totals, tax rates, prices, and addresses on an order are all snapshots for exactly this reason — which is why `order_items` stores `unit_price` rather than joining to `products.price`.

---

## 3. Step 2: Key Design (The Decision You Cannot Undo)

### 3.1 Surrogate vs natural keys

| | Surrogate (`BIGSERIAL` / UUID) | Natural (email, ISBN, country code) |
| --- | --- | --- |
| Stable when business data changes | ✅ | ❌ *email changes; the PK cannot* |
| Meaningful without a join | ❌ | ✅ |
| Narrow (index/FK size) | ✅ | ❌ often wide text |
| Leaks information | ❌ (sequential leaks *volume* — see below) | ✅ |

**The default is a surrogate primary key, with the natural key as a `UNIQUE` constraint.** You get stability *and* the business rule is still enforced:

```sql
CREATE TABLE customers (
    id    BIGSERIAL PRIMARY KEY,           -- surrogate: stable forever
    email TEXT NOT NULL UNIQUE,            -- natural key: still enforced
    ...
);
```

This combination is the single most reliable key decision in transactional design. Using `email` as the PK means an email change rewrites every foreign key referencing that customer.

### 3.2 Sequential vs UUID — the real trade-off

| | `BIGSERIAL` | `UUIDv4` (random) | `UUIDv7` / ULID (time-ordered) |
| --- | --- | --- | --- |
| Index locality | ✅ appends to the B-tree's right edge | ❌ **random inserts fragment the index** | ✅ mostly ordered |
| Generatable client-side | ❌ needs a DB round-trip | ✅ | ✅ |
| Safe across shards/merges | ❌ collides | ✅ | ✅ |
| Leaks business volume | ⚠️ `/orders/5231` tells a competitor your order count | ✅ no leak | ⚠️ leaks time only |

**The UUIDv4 write-performance problem is real and under-appreciated:** random keys insert into random B-tree pages, so every insert dirties a different page, destroying cache locality and causing page splits ([Ch21 Database Internals](21_Database_Internals.md)). At scale this can be a several-fold write slowdown versus sequential keys.

**UUIDv7 (time-ordered) is the modern default when you need client-generated or shard-safe IDs** — it keeps insert locality while remaining globally unique.

### 3.3 Composite keys — when the key *is* the relationship

For a pure join table, the natural PK is the pair:

```sql
CREATE TABLE order_items (
    order_id   BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity   INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),  -- snapshot! (§2.4)
    PRIMARY KEY (order_id, product_id)   -- encodes "one row per product per order"
);
```

That composite PK **is a business rule**: the same product cannot appear twice on one order. If the business says it *can* (two line items of the same product with different discounts), then the PK must become a surrogate and the rule disappears — a genuine requirements question, decided at design time.

> **Note the column order in the composite key.** `(order_id, product_id)` makes the index usable for "all items in this order" (the leftmost-prefix rule, §5.2) — which is the dominant query. Reversing it would optimize a query nobody runs.

---

## 4. Step 3: Constraints Are the Correctness Layer

**The principle:** the database is the **last line of defense**, and it is the only one that every client passes through. Application validation is bypassable — by a second service, a migration script, a manual fix in production, or next year's rewrite in a different language. A `CHECK` constraint is not.

### 4.1 The constraint catalogue

```sql
CREATE TABLE orders (
    id           BIGSERIAL PRIMARY KEY,
    customer_id  BIGINT      NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    status       TEXT        NOT NULL DEFAULT 'PENDING',
    total_cents  BIGINT      NOT NULL,          -- money as integer (§4.3)
    currency     CHAR(3)     NOT NULL,
    placed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    shipped_at   TIMESTAMPTZ,

    CONSTRAINT ck_status  CHECK (status IN ('PENDING','PAID','SHIPPED','CANCELLED')),
    CONSTRAINT ck_total   CHECK (total_cents >= 0),
    CONSTRAINT ck_shipped CHECK (shipped_at IS NULL OR shipped_at >= placed_at)
);
```

Each line is a bug that can never happen: no order without a customer, no negative total, no shipment before placement, no typo'd status.

### 4.2 Foreign-key actions encode business policy

`ON DELETE` is not boilerplate — it is a *decision about what deletion means*:

| Action | Meaning | Use for |
| --- | --- | --- |
| `RESTRICT` / `NO ACTION` | "You may not delete a customer who has orders" | **Default for anything with history** |
| `CASCADE` | "Deleting the order deletes its line items" | True composition — children have no independent existence |
| `SET NULL` | "Keep the child; forget the link" | The address snapshot case (§2.4) |

**Getting this wrong is a data-loss bug**: `CASCADE` on `customers → orders` means one customer deletion silently erases their entire order history — and the accounting reconciliation that depends on it.

### 4.3 Type choices that are really correctness choices

| Instead of | Use | Why |
| --- | --- | --- |
| `FLOAT` for money | `NUMERIC(12,2)` or integer cents | Binary floats cannot represent 0.10 — totals drift and fail audit ([10_Enterprise Finance](../10_Enterprise_Systems/03_ERP_Finance_Core.md)) |
| `TIMESTAMP` | `TIMESTAMPTZ` | Without a zone, "3 PM" is meaningless across regions; DST arithmetic silently breaks |
| `VARCHAR(255)` by default | Length reflecting the real rule, or `TEXT` | 255 is a historical accident, not a business rule |
| `TEXT` status field | `CHECK (... IN ...)` or an enum | Prevents `'shiped'` from existing in production forever |
| Nullable everything | `NOT NULL` unless nullability is *meaningful* | Every nullable column doubles the states callers must handle ([16_JS](../16_JavaScript/01_JS_Foundations.md), [17_TS](../17_TypeScript/01_TS_Foundations.md) null discipline) |

> **`NULL` must mean something specific.** "Not yet known," "not applicable," and "zero" are three different things, and conflating them creates queries that are wrong in ways `COUNT` and `AVG` silently hide ([14_MM SQL Pipeline](../14_Mental_Models/07_SQL_Mental_Pipeline.md)). Decide the meaning per column, and write it in a comment.

---

## 5. Step 4: Index Strategy as a Design Discipline

### 5.1 The rule: indexes are derived, not sprinkled

> **Every index is a purchase: you buy read speed with write cost and storage.** A table with eight indexes has roughly halved its insert throughput, because every insert updates nine B-trees.

So you do not "add indexes." You **write down the queries first** (pipeline step 5), then derive the minimum index set that serves them.

| # | Query | Freq | Latency budget |
| --- | --- | --- | --- |
| Q1 | Orders for a customer, newest first | very high | < 50 ms |
| Q2 | Order by id (+ its items) | very high | < 20 ms |
| Q3 | Orders in status X placed before T (job) | hourly | < 5 s |
| Q4 | Items of an order | very high | < 20 ms |

Derived index set — and **nothing else**:

```sql
-- Q1: composite, with DESC matching the ORDER BY so no sort is needed
CREATE INDEX idx_orders_customer_placed ON orders (customer_id, placed_at DESC);

-- Q2: served by the PK index. No new index needed.
-- Q3: partial index — only the rows the job ever looks at
CREATE INDEX idx_orders_pending ON orders (placed_at)
    WHERE status IN ('PENDING','PAID');

-- Q4: served by the leftmost prefix of order_items' composite PK. Nothing needed.
```

Two indexes for four hot queries. Notice Q2 and Q4 needed **zero** new indexes — recognizing what the PK already covers is half of index design.

### 5.2 The leftmost-prefix rule (the one people get wrong)

A composite index on `(a, b, c)` can serve queries filtering on:
- `a` ✅
- `a, b` ✅
- `a, b, c` ✅
- `b` alone ❌ — **the index is useless**
- `b, c` ❌

The index is a B-tree sorted by `a`, then `b` within equal `a`, then `c`. Without a value for `a`, there is no starting point to descend to ([Ch11 Indexes](11_Indexes_Performance.md), [Ch21 Internals](21_Database_Internals.md)).

**Consequence for design:** the column order in a composite index is not cosmetic. Put the column used in **equality** filters first, and the **range/sort** column last.

### 5.3 The design-time index checklist

| Check | Why |
| --- | --- |
| Every FK has an index | Un-indexed FKs make joins and `ON DELETE` checks table scans |
| Composite order = equality columns first, range/sort last | Leftmost-prefix + avoiding a sort step |
| Is the query **sargable**? | `WHERE lower(email) = ?` cannot use an index on `email` — use an expression index or normalize on write |
| Would a **partial** index be smaller? | Indexing only the rows queried (Q3) can shrink an index by 99% |
| Would a **covering** index avoid the table lookup? | `INCLUDE (...)` lets the index answer alone (index-only scan) |
| Is any index **redundant**? | `(a)` is redundant if `(a, b)` exists — drop it, it costs writes for nothing |
| Have I verified with `EXPLAIN`? | The optimizer decides, not you. **Always confirm.** |

> **Sargability is the most common silent index failure.** Wrapping the indexed column in a function (`lower(col)`, `DATE(col)`, `col + 0`) disables the index. Transform the *parameter* instead, or build an expression index.

---

## 6. Modeling the Hard Things

These five recur in nearly every real system, and each has a right answer that beginners reliably get wrong.

### 6.1 Soft deletes

```sql
ALTER TABLE customers ADD COLUMN deleted_at TIMESTAMPTZ;
-- and now EVERY query must remember: WHERE deleted_at IS NULL
```

**The hidden costs:** every query that forgets the filter is a bug that leaks deleted data; unique constraints break (a "deleted" email still blocks re-registration); indexes carry dead rows forever.

**Better:** a **partial unique index** so deleted rows stop blocking, plus a view that applies the filter once:

```sql
CREATE UNIQUE INDEX uq_customers_email_active
    ON customers (email) WHERE deleted_at IS NULL;

CREATE VIEW active_customers AS
    SELECT * FROM customers WHERE deleted_at IS NULL;
```

**Or better still:** ask whether the requirement is *deletion* or *archival*. If rows must be retained for audit, an `archived` state on an explicit lifecycle is more honest than pretending the row is gone.

### 6.2 Hierarchies (categories, org charts, threaded comments)

| Model | Read a subtree | Move a subtree | Use when |
| --- | --- | --- | --- |
| **Adjacency list** (`parent_id`) | recursive CTE | ✅ O(1) | Default; shallow trees; frequent moves |
| **Path enumeration** (`'/1/7/22/'`) | ✅ prefix `LIKE` + index | ❌ rewrite all descendants | Read-heavy, rare moves |
| **Closure table** (ancestor, descendant, depth) | ✅ single join | moderate | Read-heavy with frequent subtree queries |
| **Nested sets** (left/right) | ✅ range query | ❌ rewrites much of the table | Almost never — writes are brutal |

Modern Postgres/SQL Server make **adjacency list + recursive CTE** the sane default:

```sql
WITH RECURSIVE subtree AS (
    SELECT id, parent_id, name, 1 AS depth
    FROM categories WHERE id = :root
  UNION ALL
    SELECT c.id, c.parent_id, c.name, s.depth + 1
    FROM categories c JOIN subtree s ON c.parent_id = s.id
)
SELECT * FROM subtree;
```

### 6.3 Polymorphic associations (comments on posts *and* photos *and* orders)

**The anti-pattern** — an untyped pointer the database cannot check:

```sql
-- ❌ commentable_id has NO foreign key. Nothing prevents orphans or wrong types.
CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    commentable_type TEXT,   -- 'post' | 'photo'
    commentable_id   BIGINT
);
```

**Fix A — exclusive-arc** (nullable FKs + a CHECK that exactly one is set). Referential integrity preserved:

```sql
CREATE TABLE comments (
    id       BIGSERIAL PRIMARY KEY,
    post_id  BIGINT REFERENCES posts(id)  ON DELETE CASCADE,
    photo_id BIGINT REFERENCES photos(id) ON DELETE CASCADE,
    body     TEXT NOT NULL,
    CONSTRAINT ck_one_parent CHECK (
        (post_id IS NOT NULL)::int + (photo_id IS NOT NULL)::int = 1
    )
);
```

**Fix B — a shared parent entity** (`commentable` table that posts and photos both reference). Scales to many types without adding columns; costs one join.

Choose A for 2–3 types, B beyond that. **Never the untyped version** — you are asking the application to maintain referential integrity, which it will eventually fail to do.

### 6.4 Status as a state machine

A `status` column plus a `CHECK` prevents invalid *values*. It does not prevent invalid *transitions* (`CANCELLED → SHIPPED`). Options:

1. Enforce transitions in one service-layer function (pragmatic default — but only if it is genuinely the single writer).
2. Enforce in the DB with a trigger comparing `OLD.status`/`NEW.status`.
3. Model the history as the source of truth (`order_status_history`), with the current status derived or denormalized (§7).

Requirements mentioning "who changed it and when" (§2.2) mean you need option 3 regardless.

### 6.5 Multi-tenancy

| Model | Isolation | Ops cost | Use when |
| --- | --- | --- | --- |
| `tenant_id` column | Weakest — one missing `WHERE` leaks data | ✅ lowest | Most SaaS; pair with **row-level security** |
| Schema per tenant | Better | Migrations × N schemas | Tens–hundreds of tenants, compliance pressure |
| Database per tenant | Strongest | Highest | Enterprise/regulated; few large tenants |

With a `tenant_id` column, **put it first in every composite index and enable row-level security** — the "forgot the tenant filter" bug is the most serious class of bug in multi-tenant systems, and RLS makes the database enforce what the application might forget.

---

## 7. Deliberate Denormalization — And How To Do It Safely

Normalize first ([Ch10](10_Normalization.md)). Denormalize **only** with a measured reason, and always with a stated consistency plan.

| Legitimate reason | Example | The obligation you accept |
| --- | --- | --- |
| A join is measurably too slow at scale | `orders.customer_name` alongside `customer_id` | Update it when the customer renames — or accept staleness deliberately |
| An aggregate is recomputed constantly | `posts.comment_count` | Trigger, or periodic reconciliation |
| A historical snapshot is *required* | `order_items.unit_price` (§2.4) | **None — this is not denormalization**, it is correct modeling |

**The rule that makes it safe:** every denormalized field needs a **named mechanism** keeping it consistent (trigger, transactional write, or scheduled reconciliation job) **and** a reconciliation query that detects drift. Without both, the copy silently diverges and you learn about it from a customer.

```sql
-- The reconciliation query is not optional. Run it in a scheduled job.
SELECT p.id, p.comment_count, COUNT(c.id) AS actual
FROM posts p LEFT JOIN comments c ON c.post_id = p.id
GROUP BY p.id, p.comment_count
HAVING p.comment_count <> COUNT(c.id);
```

---

## 8. Schema Evolution Under Load — Expand/Contract

You will change this schema while it holds hundreds of millions of rows and serves live traffic. **Design for that now.**

### 8.1 Which operations are safe

| Operation | Cost on a large table | Safe? |
| --- | --- | --- |
| `ADD COLUMN` (nullable, no default) | Metadata-only in modern Postgres/MySQL 8 | ✅ |
| `ADD COLUMN NOT NULL DEFAULT x` | Modern PG: metadata-only. Older/other engines: **full rewrite** | ⚠️ check your version |
| `CREATE INDEX` | **Locks writes** unless concurrent | ⚠️ use `CREATE INDEX CONCURRENTLY` |
| `ALTER COLUMN TYPE` | Usually a full rewrite + exclusive lock | ❌ use expand/contract |
| `DROP COLUMN` | Metadata-only, but **breaks deployed code** | ⚠️ only after contract phase |
| Adding a `CHECK` / `FK` | Validates all rows under lock | ⚠️ add `NOT VALID`, then `VALIDATE` separately |

### 8.2 The expand/contract pattern (rename a column with zero downtime)

The naive `ALTER TABLE ... RENAME COLUMN` breaks every running instance of the old code the instant it commits. Instead, **decouple the schema change from the code change** across deploys:

```
Phase 1 — EXPAND    Add the new column. Deploy code that WRITES BOTH,
                    reads the old.               (schema and old code coexist)
Phase 2 — BACKFILL  Copy old → new in batches.   (no lock; throttled)
Phase 3 — MIGRATE   Deploy code that reads the NEW, still writes both.
Phase 4 — CONTRACT  Deploy code that uses only the new. Then drop the old.
```

Each phase is independently deployable and reversible. This is the same **make-the-change-easy-then-make-the-easy-change** discipline as [13_DE Clean Code](../13_Developer_Essentials/05_Clean_Code.md), applied where mistakes are most expensive.

> **The rule with no exceptions:** a migration must be safe to run **while the previous version of the application is still serving traffic**, because during a rolling deploy it always is.

---

## 9. The Design Review Checklist

Run this before any `CREATE TABLE` reaches production.

**Model**
- [ ] Every entity has a clear identity and lifecycle (§2)
- [ ] Every relationship's cardinality *and optionality* is decided
- [ ] Anything needing "as it was at the time" is snapshotted, not joined (§2.4)
- [ ] Normalized to at least 3NF, with any denormalization justified and mechanized (§7)

**Keys**
- [ ] Surrogate PK + natural `UNIQUE` where a natural key exists (§3.1)
- [ ] ID type chosen deliberately (sequential vs UUIDv7) with locality understood (§3.2)
- [ ] Composite key column order matches the dominant access pattern (§3.3)

**Correctness**
- [ ] `NOT NULL` unless nullability is *meaningful*, and the meaning is documented
- [ ] `CHECK` constraints for every enumerable/bounded value
- [ ] Every FK's `ON DELETE` action is a deliberate business decision (§4.2)
- [ ] Money is `NUMERIC`/integer, timestamps are `TIMESTAMPTZ` (§4.3)

**Performance**
- [ ] The 10–20 real queries are written down with frequency and latency budget (§5.1)
- [ ] Indexes derived from those queries — no others
- [ ] Every FK is indexed; no redundant indexes
- [ ] Queries verified sargable and confirmed with `EXPLAIN`

**Evolution**
- [ ] Estimated row count at 1 year and 3 years
- [ ] Every planned migration is expand/contract-safe (§8)

---

## 10. Worked Design: An Order System, End to End

Bringing §2–§5 together into the DDL the requirement in §2.1 actually implies.

```sql
-- ── Entities ────────────────────────────────────────────────────────────
CREATE TABLE customers (
    id         BIGSERIAL PRIMARY KEY,
    email      TEXT NOT NULL UNIQUE,              -- natural key as constraint
    name       TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE addresses (
    id          BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    line1       TEXT NOT NULL,
    city        TEXT NOT NULL,
    postcode    TEXT NOT NULL,
    country     CHAR(2) NOT NULL
);

CREATE TABLE products (
    id          BIGSERIAL PRIMARY KEY,
    sku         TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    price_cents BIGINT NOT NULL CHECK (price_cents >= 0)  -- current price
);

CREATE TABLE orders (
    id                  BIGSERIAL PRIMARY KEY,
    customer_id         BIGINT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    status              TEXT   NOT NULL DEFAULT 'PENDING',
    -- address SNAPSHOT (§2.4): survives later edits to addresses
    shipping_address_id BIGINT REFERENCES addresses(id) ON DELETE SET NULL,
    ship_line1          TEXT NOT NULL,
    ship_city           TEXT NOT NULL,
    ship_postcode       TEXT NOT NULL,
    ship_country        CHAR(2) NOT NULL,
    total_cents         BIGINT NOT NULL CHECK (total_cents >= 0),
    currency            CHAR(3) NOT NULL,
    placed_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    shipped_at          TIMESTAMPTZ,
    CONSTRAINT ck_orders_status  CHECK (status IN ('PENDING','PAID','SHIPPED','CANCELLED')),
    CONSTRAINT ck_orders_shipped CHECK (shipped_at IS NULL OR shipped_at >= placed_at)
);

-- M:N with attributes; composite PK encodes "one line per product per order"
CREATE TABLE order_items (
    order_id   BIGINT  NOT NULL REFERENCES orders(id)   ON DELETE CASCADE,
    product_id BIGINT  NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity   INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_cents BIGINT NOT NULL CHECK (unit_price_cents >= 0), -- price SNAPSHOT
    PRIMARY KEY (order_id, product_id)
);

-- "who changed it and when" (§2.2) → history is an entity
CREATE TABLE order_status_history (
    id         BIGSERIAL PRIMARY KEY,
    order_id   BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    old_status TEXT,                                   -- NULL on creation
    new_status TEXT NOT NULL,
    changed_by BIGINT REFERENCES users(id),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes: derived from the query table in §5.1, nothing more ─────────
CREATE INDEX idx_orders_customer_placed ON orders (customer_id, placed_at DESC);
CREATE INDEX idx_orders_pending         ON orders (placed_at)
    WHERE status IN ('PENDING','PAID');
CREATE INDEX idx_addresses_customer     ON addresses (customer_id);   -- FK index
CREATE INDEX idx_items_product          ON order_items (product_id);  -- FK index
CREATE INDEX idx_status_hist_order      ON order_status_history (order_id, changed_at DESC);
-- order_items(order_id, ...) is served by the composite PK's leftmost prefix.
```

**Trace the requirement sentences to the schema:** "one or more products with quantities" → `order_items` with `quantity`; "status changes, who and when" → `order_status_history`; "old orders show the address as it was" → the `ship_*` snapshot columns. **Every design decision is traceable to a sentence.** That traceability is what makes a schema defensible in review.

---

## 🏋️ Practice Challenges

**Challenge 1 — Extraction.** *"Doctors work at clinics. A patient books an appointment with a doctor at a clinic for a time slot. Appointments can be rescheduled or cancelled, and we must keep the full history. A doctor's consultation fee changes over time, and invoices must show the fee that applied on the appointment date."* Produce entities, relationships with cardinality **and optionality**, and identify every place a snapshot is required.

**Challenge 2 — Index derivation.** For your Challenge 1 schema, write the 10 queries the app will run with frequencies, then derive the minimum index set. For each index, state which query it serves and why the column order is what it is. Then find one query that is *not* sargable as naturally written, and fix it.

**Challenge 3 — Evolution.** You must split `customers.name` into `first_name`/`last_name` on a 200M-row table with zero downtime. Write the four expand/contract phases, the batched backfill, and the rollback plan for each phase.

**Challenge 4 — Review.** Take a schema from your current work and run the §9 checklist against it. Every unchecked box is a finding — write the top three up with the concrete failure each one permits. *(This is a strong Lane C action — [FTE plan](../12_Daily_Practice/00_FTE_CONVERSION_PLAN_2026.md) Week 8.)*

---

## 📎 Cross-References

- [Ch10: Normalization](10_Normalization.md) — the 1NF→BCNF theory this applies
- [Ch11: Indexes & Performance](11_Indexes_Performance.md) — index mechanics behind §5
- [Ch13: Transactions & ACID](13_Transactions_ACID.md) — the isolation these constraints run under
- [Ch21: Database Internals](21_Database_Internals.md) — B-trees, why UUIDv4 hurts inserts
- [Ch36: Advanced Data Modeling](36_Advanced_Data_Modeling.md) — the OLAP counterpart
- [10_Enterprise: DDD Entity Design](../10_Enterprise_Systems/01c_Domain_Driven_Entity_Design.md) — the object-model side of the same problem
- [13_DE: API Design](../13_Developer_Essentials/07_API_Design_REST.md) — the schema's public face
- [DS A5: Designing Your Own Data Structures](../02_Data_Structures/A5_Designing_Your_Own_Data_Structures.md) — the same contract-first design discipline

---

**Navigation**: [← 49: SQL Internals Deep](49_SQL_Internals_Deep.md) | [📚 SQL Index](00_INDEX.md) | [36: Advanced Data Modeling (OLAP) →](36_Advanced_Data_Modeling.md)

---

## Reality Check

**"The ORM will generate the schema, so schema design does not matter"** → ORM-generated schemas encode the *object graph*, not the data's relationships and invariants — which is why they routinely ship without CHECK constraints, with nullable columns that should not be, with `FLOAT` money, with missing FK indexes, and with `CASCADE` deletes nobody chose. The ORM is a mapping tool, not a design tool. Design the schema first and let the ORM map to it; the reverse produces a model you will fight for years.

**"Add indexes to make it fast"** → Every index is a purchase paid for on **every write**, and a table with eight indexes has roughly halved its insert throughput. Indexes must be *derived* from a written-down query set (§5.1), verified with `EXPLAIN`, and audited for redundancy — `(a)` is dead weight if `(a,b)` exists. And the most common failure is not a missing index but a **non-sargable query** that cannot use the perfectly good index already there.

**"Constraints slow things down; validate in the application"** → Application validation is bypassable by every path that is not your application: the second service, the migration script, the manual production fix, the next rewrite. Constraints are the only validation that *every* writer passes through, their cost is small relative to the I/O they guard, and they turn an entire class of data-corruption incident into an error at write time. The database is the last line of defense precisely because it cannot be routed around.

**"We'll normalize now and denormalize later if it's slow"** → Half right, and the missing half is what causes the damage: denormalization is legitimate **with a measured reason plus a named consistency mechanism plus a reconciliation query** (§7). Denormalizing without those produces copies that silently diverge, and you find out from a customer rather than a monitor. Also note that snapshots (order prices, shipping addresses) are *not* denormalization — they are correct modeling of a historical fact, and treating them as a performance optimization is how teams "clean them up" into a bug.

**"Schema changes are just migrations; we'll figure it out when we need to"** → At 200M rows and live traffic, the naive `ALTER` locks the table, the rolling deploy guarantees old and new code run simultaneously, and "figure it out later" becomes an outage. Expand/contract (§8) exists because a migration must be safe **while the previous version is still serving traffic** — always true during a deploy. Designing with that constraint in mind from the start costs nothing; retrofitting it under pressure costs a maintenance window and a lot of adrenaline.
