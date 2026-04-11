> **Navigation**: [Back to Index](00_INDEX.md) | [< Prev](30_Recursive_Queries_Hierarchical.md) | [Next >](32_Partitioning_Sharding_Replication.md)

# Chapter 31 — JSON, XML & Modern SQL

## 5W-H Framework
- **WHO** needs this? → Full-stack devs, API builders, anyone storing semi-structured data in SQL
- **WHAT** is it? → Native JSON/XML functions built into modern SQL engines — query, create, modify
- **WHEN** to use? → API responses, config storage, audit logs, flexible schemas, document-like data
- **WHERE** is it used? → PostgreSQL (JSONB powerhouse), MySQL (JSON), SQL Server (JSON/XML), Oracle
- **WHY** learn it? → Modern apps = JSON everywhere. SQL can handle it without switching to MongoDB
- **HOW** does it work? → SQL provides operators/functions to parse, index, query, and modify JSON/XML

---

## Part 1 — JSON in PostgreSQL (JSONB)

### 1.1 JSON vs JSONB
```
┌─────────────┬──────────────────────────────────────────────┐
│ Type        │ Description                                   │
├─────────────┼──────────────────────────────────────────────┤
│ JSON        │ Stores exact text. Preserves whitespace,      │
│             │ key order, duplicate keys. No indexing.        │
├─────────────┼──────────────────────────────────────────────┤
│ JSONB       │ Binary format. Keys sorted, deduped. FAST     │
│             │ queries, supports GIN indexing. USE THIS!      │
└─────────────┴──────────────────────────────────────────────┘

Rule: ALWAYS use JSONB unless you need exact text preservation.
```

### 1.2 Creating & Inserting JSON Data
```sql
CREATE TABLE products (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200),
    price       DECIMAL(10,2),
    metadata    JSONB DEFAULT '{}'::jsonb,
    created_at  TIMESTAMP DEFAULT NOW()
);

INSERT INTO products (name, price, metadata) VALUES
('MacBook Pro', 2499.99, '{
    "brand": "Apple",
    "specs": {
        "ram": 16,
        "storage": "512GB SSD",
        "processor": "M3 Pro"
    },
    "colors": ["Silver", "Space Black"],
    "ratings": {"average": 4.8, "count": 1250},
    "tags": ["laptop", "professional", "creative"]
}'),
('ThinkPad X1', 1899.99, '{
    "brand": "Lenovo",
    "specs": {
        "ram": 32,
        "storage": "1TB SSD",
        "processor": "Intel i7-13700"
    },
    "colors": ["Black"],
    "ratings": {"average": 4.5, "count": 820},
    "tags": ["laptop", "business", "durable"]
}');
```

### 1.3 Querying JSON Data
```sql
-- Extract a value (-> returns JSON, ->> returns TEXT)
SELECT 
    name,
    metadata->>'brand' AS brand,                     -- text
    metadata->'specs'->>'ram' AS ram_gb,              -- nested text
    (metadata->'ratings'->>'average')::numeric AS avg_rating,  -- cast to number
    metadata->'colors'->0 AS first_color,            -- array index (JSON)
    metadata->'colors'->>0 AS first_color_text       -- array index (text)
FROM products;

-- Deep path extraction with #> and #>>
SELECT 
    name,
    metadata #>> '{specs, processor}' AS processor,  -- path extraction (text)
    metadata #> '{ratings}' AS ratings_obj            -- path extraction (JSON)
FROM products;
```

### 1.4 Filtering with JSON
```sql
-- Find products by brand
SELECT name, price FROM products
WHERE metadata->>'brand' = 'Apple';

-- Find products with RAM >= 32GB
SELECT name FROM products
WHERE (metadata->'specs'->>'ram')::int >= 32;

-- Check if a tag exists in array
SELECT name FROM products
WHERE metadata->'tags' ? 'business';    -- Contains key/element

-- Check if ANY of these tags exist
SELECT name FROM products
WHERE metadata->'tags' ?| ARRAY['creative', 'gaming'];  -- Any match

-- Check if ALL of these tags exist  
SELECT name FROM products
WHERE metadata->'tags' ?& ARRAY['laptop', 'professional'];  -- All match

-- Containment: does JSON contain this sub-object?
SELECT name FROM products
WHERE metadata @> '{"brand": "Apple"}'::jsonb;

-- Rating above threshold
SELECT name FROM products
WHERE metadata @> '{"ratings": {"average": 4.8}}'::jsonb;
```

### 1.5 Modifying JSON
```sql
-- Set a value
UPDATE products
SET metadata = jsonb_set(metadata, '{specs, ram}', '64')
WHERE name = 'MacBook Pro';

-- Add a new key
UPDATE products
SET metadata = metadata || '{"warranty": "2 years"}'::jsonb;

-- Remove a key
UPDATE products
SET metadata = metadata - 'warranty';

-- Remove from nested path
UPDATE products
SET metadata = metadata #- '{specs, storage}';

-- Append to array
UPDATE products
SET metadata = jsonb_set(
    metadata,
    '{colors}',
    metadata->'colors' || '"Gold"'::jsonb
)
WHERE metadata->>'brand' = 'Apple';
```

### 1.6 JSON Aggregation
```sql
-- Build JSON from rows
SELECT jsonb_agg(
    jsonb_build_object(
        'id', id,
        'name', name,
        'price', price
    )
) AS products_json
FROM products;

-- Build an object from key-value pairs
SELECT jsonb_object_agg(name, price) AS price_map
FROM products;
```

### 1.7 Expanding JSON → Rows
```sql
-- Expand array elements to rows
SELECT 
    p.name,
    tag.value AS tag
FROM products p,
     jsonb_array_elements_text(p.metadata->'tags') AS tag;

-- Expand object to key-value pairs
SELECT 
    p.name,
    kv.key,
    kv.value
FROM products p,
     jsonb_each_text(p.metadata->'specs') AS kv;
```

### 1.8 GIN Index for JSON Performance
```sql
-- Index the ENTIRE jsonb column (supports @>, ?, ?&, ?|)
CREATE INDEX idx_products_metadata ON products USING GIN (metadata);

-- Index a specific path (supports =, <, >, etc.)
CREATE INDEX idx_products_brand ON products USING BTREE (
    (metadata->>'brand')
);

-- Index for full-text search inside JSON
CREATE INDEX idx_products_tags ON products USING GIN (
    (metadata->'tags')
);
```

---




## Part 2 — JSON in MySQL

### 2.1 MySQL JSON Functions
```sql
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(50),
    payload JSON
);

INSERT INTO events (event_type, payload) VALUES
('page_view', '{"url": "/home", "user_id": 42, "device": "mobile"}'),
('purchase', '{"user_id": 42, "items": [{"sku": "A1", "qty": 2}, {"sku": "B3", "qty": 1}]}');

-- Extract values (MySQL uses JSON_EXTRACT or -> shorthand)
SELECT 
    event_type,
    JSON_EXTRACT(payload, '$.user_id') AS user_id,
    payload->>'$.url' AS url,              -- Unquoted text (->>)
    payload->'$.items[0].sku' AS first_sku -- Array access
FROM events;

-- Search in arrays
SELECT * FROM events
WHERE JSON_CONTAINS(payload->'$.items', '{"sku": "A1"}');

-- Check if path exists
SELECT * FROM events
WHERE JSON_CONTAINS_PATH(payload, 'one', '$.url');

-- Modify JSON
UPDATE events
SET payload = JSON_SET(payload, '$.processed', true)
WHERE id = 1;

-- JSON table (MySQL 8.0+): JSON → relational rows
SELECT 
    e.event_type,
    jt.*
FROM events e,
JSON_TABLE(e.payload, '$.items[*]' COLUMNS (
    sku VARCHAR(10) PATH '$.sku',
    qty INT PATH '$.qty'
)) AS jt
WHERE e.event_type = 'purchase';
```

---




## Part 3 — JSON in SQL Server

### 3.1 SQL Server JSON (No JSON Data Type!)
```sql
-- SQL Server stores JSON as NVARCHAR — no native JSON type
CREATE TABLE api_logs (
    id INT IDENTITY PRIMARY KEY,
    response NVARCHAR(MAX),  -- JSON stored as text
    CONSTRAINT chk_json CHECK (ISJSON(response) = 1)
);

-- Query JSON
SELECT 
    JSON_VALUE(response, '$.status') AS status,        -- Scalar value
    JSON_QUERY(response, '$.data.items') AS items_arr, -- Object/array
    JSON_VALUE(response, '$.data.items[0].name') AS first_item
FROM api_logs;

-- OPENJSON: Expand JSON to rows (like JSON_TABLE in MySQL)
SELECT 
    j.key,
    j.value,
    j.type  -- 0=null, 1=string, 2=number, 3=bool, 4=array, 5=object
FROM api_logs
CROSS APPLY OPENJSON(response, '$.data.items') AS j;

-- OPENJSON with schema
SELECT *
FROM api_logs
CROSS APPLY OPENJSON(response, '$.data.items')
WITH (
    item_name VARCHAR(100) '$.name',
    quantity INT '$.qty',
    price DECIMAL(10,2) '$.price'
) AS items;

-- Build JSON from rows
SELECT id, name, price
FROM products
FOR JSON PATH;  -- Returns JSON array
-- [{"id":1,"name":"Widget","price":9.99},...]
```

---




## Part 4 — XML in SQL

### 4.1 PostgreSQL XML
```sql
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    invoice_xml XML
);

INSERT INTO invoices (invoice_xml) VALUES ('
<invoice id="1001">
    <customer>Acme Corp</customer>
    <date>2026-03-15</date>
    <items>
        <item sku="A1" qty="5">
            <name>Widget</name>
            <price>9.99</price>
        </item>
        <item sku="B2" qty="2">
            <name>Gadget</name>
            <price>29.99</price>
        </item>
    </items>
    <total>109.93</total>
</invoice>
');

-- XPath queries
SELECT 
    (xpath('//customer/text()', invoice_xml))[1]::text AS customer,
    (xpath('//total/text()', invoice_xml))[1]::text::numeric AS total,
    (xpath('count(//item)', invoice_xml))[1]::text::int AS item_count,
    (xpath('//item/@sku', invoice_xml)) AS all_skus
FROM invoices;

-- Expand XML to rows with xmltable (PostgreSQL 10+)
SELECT xt.*
FROM invoices i,
XMLTABLE('//item' PASSING i.invoice_xml
    COLUMNS 
        sku     TEXT PATH '@sku',
        qty     INT  PATH '@qty',
        name    TEXT PATH 'name',
        price   NUMERIC PATH 'price'
) AS xt;
```

### 4.2 SQL Server XML
```sql
-- SQL Server has native XML type
DECLARE @xml XML = '
<employees>
    <employee id="1" dept="Engineering">
        <name>Alice</name><salary>90000</salary>
    </employee>
    <employee id="2" dept="Sales">
        <name>Bob</name><salary>75000</salary>
    </employee>
</employees>';

-- XQuery methods
SELECT 
    @xml.value('(/employees/employee[@id=1]/name)[1]', 'VARCHAR(50)') AS name,
    @xml.value('(/employees/employee[@id=1]/salary)[1]', 'INT') AS salary;

-- Shred XML to rows
SELECT 
    t.c.value('@id', 'INT') AS emp_id,
    t.c.value('@dept', 'VARCHAR(50)') AS department,
    t.c.value('(name)[1]', 'VARCHAR(50)') AS name,
    t.c.value('(salary)[1]', 'INT') AS salary
FROM @xml.nodes('/employees/employee') AS t(c);

-- Build XML from rows
SELECT emp_id AS "@id", name, salary
FROM employees
FOR XML PATH('employee'), ROOT('employees');
```

---




## Part 5 — Array Operations (PostgreSQL)

### 5.1 PostgreSQL Arrays
```sql
CREATE TABLE surveys (
    id SERIAL PRIMARY KEY,
    respondent VARCHAR(100),
    skills TEXT[],           -- Array of text
    scores INT[]             -- Array of integers
);

INSERT INTO surveys VALUES
(1, 'Alice', ARRAY['Python', 'SQL', 'Java'], ARRAY[85, 92, 78]),
(2, 'Bob', ARRAY['SQL', 'JavaScript', 'Go'], ARRAY[95, 80, 70]),
(3, 'Carol', ARRAY['Python', 'SQL'], ARRAY[88, 96]);

-- Access elements (1-indexed!)
SELECT respondent, skills[1] AS first_skill, scores[2] AS second_score
FROM surveys;

-- Contains check
SELECT respondent FROM surveys WHERE 'Python' = ANY(skills);
SELECT respondent FROM surveys WHERE skills @> ARRAY['Python', 'SQL'];  -- Contains all

-- Expand array to rows
SELECT respondent, skill
FROM surveys, UNNEST(skills) AS skill;

-- Expand with ordinality (index)
SELECT respondent, skill, idx
FROM surveys, UNNEST(skills) WITH ORDINALITY AS t(skill, idx);

-- Array aggregation
SELECT ARRAY_AGG(DISTINCT skill ORDER BY skill) AS all_skills
FROM surveys, UNNEST(skills) AS skill;

-- Array operations
SELECT 
    ARRAY_LENGTH(skills, 1) AS skill_count,
    ARRAY_APPEND(skills, 'Docker') AS with_docker,
    ARRAY_REMOVE(skills, 'Java') AS without_java,
    ARRAY_CAT(skills, ARRAY['Linux', 'AWS']) AS combined
FROM surveys WHERE id = 1;
```

---

## Part 6 — Real-World Patterns

### 6.1 Event Sourcing with JSON
```sql
-- Store events as immutable JSON
CREATE TABLE event_store (
    event_id    BIGSERIAL PRIMARY KEY,
    aggregate_id UUID NOT NULL,
    event_type  VARCHAR(100) NOT NULL,
    payload     JSONB NOT NULL,
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_event_aggregate ON event_store (aggregate_id, event_id);

-- Reconstruct current state from events
WITH ordered_events AS (
    SELECT payload
    FROM event_store
    WHERE aggregate_id = 'abc-123'::uuid
    ORDER BY event_id
)
SELECT 
    jsonb_agg(payload) AS all_events,
    -- Merge all payloads (last write wins)
    (SELECT jsonb_object_agg(key, value)
     FROM ordered_events, jsonb_each(payload)) AS current_state
FROM ordered_events;
```

### 6.2 Configuration Table
```sql
-- Flexible config storage
CREATE TABLE app_config (
    config_key   VARCHAR(100) PRIMARY KEY,
    config_value JSONB NOT NULL,
    description  TEXT,
    updated_at   TIMESTAMP DEFAULT NOW()
);

INSERT INTO app_config VALUES
('email_settings', '{"smtp_host": "smtp.example.com", "port": 587, "tls": true}', 'Email configuration', NOW()),
('feature_flags', '{"dark_mode": true, "beta_search": false, "max_upload_mb": 50}', 'Feature toggles', NOW());

-- Check a feature flag
SELECT config_value->>'dark_mode' FROM app_config WHERE config_key = 'feature_flags';

-- Update one flag
UPDATE app_config
SET config_value = jsonb_set(config_value, '{beta_search}', 'true'::jsonb),
    updated_at = NOW()
WHERE config_key = 'feature_flags';
```

### 6.3 Audit Log with JSON Diff
```sql
CREATE TABLE audit_log (
    id         BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(50),
    record_id  INT,
    action     VARCHAR(10),  -- INSERT, UPDATE, DELETE
    old_data   JSONB,
    new_data   JSONB,
    changed_by VARCHAR(100),
    changed_at TIMESTAMP DEFAULT NOW()
);

-- View what changed
SELECT 
    changed_at,
    action,
    -- Show only changed fields
    (SELECT jsonb_object_agg(key, value) 
     FROM jsonb_each(new_data) 
     WHERE NOT old_data ? key OR old_data->key != new_data->key) AS changes
FROM audit_log
WHERE table_name = 'users' AND record_id = 42
ORDER BY changed_at DESC;
```

---



## JSON vs XML Decision Guide

```
Need to choose? Ask:
┌─────────────────────────────────────────────────────────────┐
│ Is it API data from a REST service?         → JSON          │
│ Is it a legacy SOAP/enterprise integration? → XML           │
│ Do you need flexible schemas?               → JSONB         │
│ Do you need complex validation (XSD)?       → XML           │
│ Do you need fast queries and indexing?       → JSONB + GIN   │
│ Is it configuration data?                   → JSONB          │
│ Is it a document interchange format?        → XML or JSON    │
│ Default for new projects?                   → JSON (always)  │
└─────────────────────────────────────────────────────────────┘
```

---


---

## 🏋️ Practice & Interview Questions — SQL

### Predict / Trace
**Q1.** What's the difference between WHERE and HAVING?
<details><summary>Answer</summary>

`WHERE` filters rows **before** grouping. `HAVING` filters groups **after** `GROUP BY`. You can't use aggregate functions in WHERE. `HAVING COUNT(*) > 5` works, `WHERE COUNT(*) > 5` does not.
</details>

**Q2.** What does this return? `SELECT 1 FROM dual WHERE NULL = NULL`
<details><summary>Answer</summary>

**No rows returned.** NULL is not equal to NULL — use `IS NULL` or `IS NOT NULL`. `NULL = NULL` evaluates to UNKNOWN, not TRUE.
</details>

### Coding Problems
**Q3.** ⭐ Second highest salary — handle the case where it doesn't exist (return NULL).
<details><summary>Solution</summary>

```sql
SELECT MAX(salary) AS SecondHighestSalary
FROM Employee
WHERE salary < (SELECT MAX(salary) FROM Employee);
-- or
SELECT IFNULL((SELECT DISTINCT salary FROM Employee ORDER BY salary DESC LIMIT 1 OFFSET 1), NULL)
```
</details>

**Q4.** ⭐ Find employees earning more than their manager.
<details><summary>Solution</summary>

```sql
SELECT e.name FROM Employee e
JOIN Employee m ON e.managerId = m.id
WHERE e.salary > m.salary;
```
</details>

**Q5.** ⭐ Find duplicate emails.
<details><summary>Solution</summary>

```sql
SELECT email FROM Person GROUP BY email HAVING COUNT(*) > 1;
```
</details>

**Q6.** ⭐⭐ Rank scores without RANK() function.
<details><summary>Solution</summary>

```sql
SELECT s.score,
  (SELECT COUNT(DISTINCT s2.score) FROM Scores s2 WHERE s2.score >= s.score) AS rank
FROM Scores s ORDER BY score DESC;
```
</details>

**Q7.** ⭐⭐ Consecutive numbers — find numbers that appear 3+ times consecutively.
<details><summary>Solution</summary>

```sql
SELECT DISTINCT l1.Num AS ConsecutiveNums
FROM Logs l1, Logs l2, Logs l3
WHERE l1.Id=l2.Id-1 AND l2.Id=l3.Id-1
AND l1.Num=l2.Num AND l2.Num=l3.Num;
-- or use LAG/LEAD window functions
```
</details>

**Q8.** ⭐⭐ Department top 3 salaries (dense rank).
<details><summary>Solution</summary>

```sql
SELECT d.name AS Department, e.name AS Employee, e.salary AS Salary
FROM Employee e JOIN Department d ON e.departmentId = d.id
WHERE (SELECT COUNT(DISTINCT e2.salary) FROM Employee e2
       WHERE e2.departmentId=e.departmentId AND e2.salary>e.salary) < 3;
```
</details>

**Q9.** ⭐⭐ Running total with window function.
<details><summary>Solution</summary>

```sql
SELECT date, amount,
  SUM(amount) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
FROM transactions;
```
</details>

**Q10.** ⭐⭐ Pivot rows to columns (conditional aggregation).
<details><summary>Solution</summary>

```sql
SELECT year,
  SUM(CASE WHEN quarter=1 THEN revenue END) AS Q1,
  SUM(CASE WHEN quarter=2 THEN revenue END) AS Q2,
  SUM(CASE WHEN quarter=3 THEN revenue END) AS Q3,
  SUM(CASE WHEN quarter=4 THEN revenue END) AS Q4
FROM sales GROUP BY year;
```
</details>

**Q11.** ⭐⭐⭐ Find the median salary — without MEDIAN() function.
<details><summary>Solution</summary>

```sql
SELECT AVG(salary) AS median
FROM (SELECT salary, ROW_NUMBER() OVER(ORDER BY salary) AS rn, COUNT(*) OVER() AS cnt FROM Employee) t
WHERE rn IN (FLOOR((cnt+1)/2), CEIL((cnt+1)/2));
```
</details>

### Interview Questions
**Q12.** INNER JOIN vs LEFT JOIN — when does LEFT produce more rows?
<details><summary>Answer</summary>

LEFT JOIN includes ALL rows from the left table even if no match in right table (fills NULLs). INNER JOIN only includes rows where both sides have a match. If left table has rows with no match in right: LEFT produces more rows.
</details>

**Q13.** What is a covering index?
<details><summary>Answer</summary>

An index that contains ALL columns needed by a query — the DB can answer from the index alone without touching the table ("index-only scan"). Faster because it avoids the extra heap fetch.
</details>

**Q14.** EXPLAIN shows "Full Table Scan" — how do you fix it?
<details><summary>Answer</summary>

Add an index on the WHERE/JOIN/ORDER BY column. Check if the column has low cardinality (boolean — index may not help). Ensure the query isn't wrapping the column in a function (`WHERE YEAR(date) = 2024` prevents index use — rewrite as `WHERE date BETWEEN '2024-01-01' AND '2024-12-31'`).
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | NULL = NULL evaluates to? | UNKNOWN (use IS NULL) |
| 2 | COUNT(*) vs COUNT(col) | COUNT(*) counts all rows, COUNT(col) skips NULLs |
| 3 | RANK() vs DENSE_RANK() | RANK() skips numbers after ties, DENSE_RANK() doesn't |
| 4 | CROSS JOIN produces | Cartesian product (m × n rows) |
| 5 | Can you ORDER BY in a subquery? | Only when using TOP/LIMIT |
| 6 | TRUNCATE vs DELETE | TRUNCATE: no WHERE, no undo, faster. DELETE: filterable, transactional |
| 7 | What does COALESCE do? | Returns first non-NULL value from its arguments |
| 8 | Index on VARCHAR — what to watch out for? | Case sensitivity, collation, function-based searches bypass index |



---

## 🧠 Deep Conceptual Questions — SQL Internals & Reasoning

**C1. How does a SQL database execute a SELECT query internally?**
<details><summary>Deep Answer</summary>

1. **Parse**: SQL text → AST (syntax tree)
2. **Bind**: resolve table names, column names, types
3. **Optimize**: query planner generates candidate execution plans, estimates costs (based on statistics: row counts, column cardinality, index existence), picks cheapest
4. **Execute**: follow the plan — scan tables, apply filters, join, sort, project

The optimizer transforms: `SELECT ... WHERE ... JOIN ... ORDER BY` into an operator tree (Volcano model): TableScan → Filter → HashJoin → Sort → Project. Each operator is an iterator: `next()` pulls one row from its child. This pull-based model (lazy evaluation) avoids materializing intermediate results.
</details>

**C2. B-Tree index: why is it the default index structure in databases?**
<details><summary>Deep Answer</summary>

B-Tree (not binary tree — B stands for Balanced, not Binary): a self-balancing tree where each node can hold many keys. Properties: (1) height O(log_m N) where m=fan-out (typically 100-1000) → very short tree for millions of rows, (2) all leaf nodes at same depth → guaranteed O(log N) worst case, (3) range scans efficient — leaves linked in sequence, (4) supports equality AND range queries. Hash index: only equality (no range). Sequential scan: no index at all. B+Tree (variant): internal nodes only store keys (no values), leaves store data. All row pointers in leaves → better range scan (follow linked list of leaves).
</details>

**C3. Why does adding an index sometimes SLOW DOWN a query?**
<details><summary>Deep Answer</summary>

1. **Low cardinality**: index on a boolean column — if 50% rows have `active=true`, index gives you 50% of rows. Database may choose full table scan (cheaper: sequential I/O) over index (random I/O for 50% of rows). 
2. **Function on column**: `WHERE YEAR(created_at) = 2024` — index on `created_at` unused. Rewrite: `WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'`.
3. **Write overhead**: every INSERT/UPDATE/DELETE must update ALL indexes. 5 indexes × N rows = 5× write amplification.
4. **Index not covering**: index exists but the SELECT columns aren't in the index → each index match → separate heap fetch → many random I/O. Solution: covering index (include all needed columns in index).
</details>

**C4. EXPLAIN / query execution plan: what are the key things to look for?**
<details><summary>Deep Answer</summary>

Red flags: (1) **"Full Table Scan" / "Seq Scan"** on a large table → missing index, (2) **high "rows" estimate** in join conditions → cartesian product risk, (3) **"Using filesort"** → ORDER BY can't use index, (4) **"Using temporary"** → intermediate table materialization, (5) **nested loops on large tables** → should be hash join or merge join. Green flags: "Using index" (covering index), "ref" or "eq_ref" access type (index used). Start fixing: add or fix index on WHERE/JOIN/ORDER BY columns, rewrite function-wrapped columns.
</details>

**C5. Window functions vs GROUP BY — when must you use window functions?**
<details><summary>Deep Answer</summary>

`GROUP BY` collapses rows to one per group — individual row data is lost. Window functions compute aggregates but **keep all rows**. Use window when: (1) you need both the aggregate AND the individual row (rank each employee and show their salary), (2) running totals (each row needs sum of all prior rows — GROUP BY can't do this), (3) lag/lead access (compare each row to previous/next — GROUP BY has no row ordering concept), (4) top-N per group (ROW_NUMBER partition — classic GROUP BY can't do this cleanly). Window functions = aggregation without collapsing.
</details>

**C6. Transaction isolation levels — what anomaly does each prevent?**
<details><summary>Deep Answer</summary>

| Level | Dirty Read | Non-repeatable Read | Phantom Read |
|---|---|---|---|
| READ UNCOMMITTED | Possible | Possible | Possible |
| READ COMMITTED | ✅ Prevented | Possible | Possible |
| REPEATABLE READ | ✅ | ✅ | Possible (MySQL InnoDB: prevented!) |
| SERIALIZABLE | ✅ | ✅ | ✅ |

**Dirty read**: read uncommitted data from another transaction (which may rollback). **Non-repeatable**: same query in same transaction returns different row values (another transaction committed update). **Phantom**: same query returns different row COUNT (another transaction inserted/deleted rows). Higher isolation = fewer anomalies but more lock contention. Most production databases use READ COMMITTED or REPEATABLE READ.
</details>

**C7. N+1 query problem: what is it, why does it happen, and how to fix?**
<details><summary>Deep Answer</summary>

**What**: fetching N orders, then for each order making a separate query for the customer = 1 + N queries total. Scales terribly: 1000 orders = 1001 queries. **Why**: ORMs (Hibernate, JPA) with lazy loading — accessing a relationship triggers a new query. **Fix 1**: Eager loading — `JOIN FETCH` or `.fetch()` — load everything in one query. **Fix 2**: Batch loading — fetch all order IDs, then `WHERE customer_id IN (id1, id2, ...)` — 2 queries. **Fix 3**: Projection/DTO query — `SELECT o.id, c.name FROM orders o JOIN customers c` — 1 query. **Detection**: count DB queries in tests (Spring: `@QueryCount`), log slow query warnings.
</details>


> **Navigation**: [Back to Index](00_INDEX.md) | [< Prev](30_Recursive_Queries_Hierarchical.md) | [Next >](32_Partitioning_Sharding_Replication.md)
