

---

## Reality Check

**"Third Normal Form (3NF) is always the target for relational schemas"** → 3NF is a commonly taught target, but: BCNF (Boyce-Codd Normal Form) is stricter and removes more anomalies than 3NF. 4NF removes multi-valued dependencies. In practice, denormalisation is common for performance: redundant columns in analytical (OLAP) databases, pre-computed aggregates, read-heavy tables with redundant data to avoid joins. The right normal form depends on write-vs-read balance. OLTP (many small transactions): normalise to 3NF to reduce write anomalies. OLAP (complex queries on large data): denormalise to reduce join cost.

**"A primary key must be a single integer ID"** → A primary key can be: single integer (auto-increment, sequence), UUID (for distributed systems — no coordination needed to generate globally unique IDs), composite key (multiple columns together uniquely identify a row — a junction table's PK is often `(user_id, role_id)`), natural key (email address, social security number, ISIN stock code). Surrogate keys (the auto-increment integer) add an extra column and index; natural keys save space but may change (email addresses change). Neither is universally correct.

**"Denormalisation is always a performance optimisation"** → Denormalisation trades write complexity for read speed. Cost of denormalisation: every update must maintain the redundant data consistently (multiple writes, potential for inconsistency if not done atomically), schema is harder to understand, more storage. It's not free. When to denormalise: report columns that are computed from many joins and read far more often than they're written, caching a column that's expensive to compute, explicitly trading consistency for read speed in analytics tables.

**"An ERD fully captures the database design"** → ERDs show entities, relationships, and cardinalities. They do NOT show: index design (which columns have indexes, composite index ordering), partitioning strategy (how tables are sharded across disks), storage parameters (fill factor, tablespace), constraint implementation details (partial indexes, expression indexes), trigger logic, or RLS (Row Level Security) policies. An ERD is a logical model. The full physical design requires additional documentation.

**"Foreign keys are optional — you can enforce relationships in code"** → You CAN enforce referential integrity in application code. But: concurrent transactions can bypass application-level checks (two concurrent inserts both check "does parent exist?" — both see yes — one parent is deleted between the two checks). Database-level foreign key constraints are enforced atomically within transactions. The cost: write overhead (FK check on insert/update, cascade on parent delete), but the correctness guarantee is exact. "Enforce in application" without FK constraints is a corruption risk at scale.
