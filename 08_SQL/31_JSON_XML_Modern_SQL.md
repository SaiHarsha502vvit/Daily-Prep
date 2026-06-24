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

### Historical Evolution

**Predecessors (with years):**
- **XML (W3C)** (1998): Extensible Markup Language became the standard for structured document interchange and web services
- **JSON (Crockford)** (2001): Douglas Crockford specified JSON as a lighter alternative to XML for browser-server communication
- **XML in SQL (SQL:2003)** (2003): SQL standard added XML type and XML_query functions for database-integrated XML processing
- **PostgreSQL JSON type** (2012): First major RDBMS added native JSON support with text storage and basic extraction
- **PostgreSQL JSONB** (2014): Binary JSON storage with full-text search indexing, dramatically improving query performance
- **JSON in SQL (SQL:2016)** (2016): SQL standard added JSON functions, validating decades of vendor-specific extensions
- **GIN indexes (PostgreSQL)** (2006): Generalized Inverted Index provided the indexing mechanism that made JSONB queries fast

**Evolution narrative:**
XML (1998) dominated web services and enterprise integration until JSON (2001) offered a simpler data interchange format favored by web developers. SQL databases initially treated these formats as blobs, but SQL:2003 added XML type and SQL:2016 added JSON support to the standard. PostgreSQL's JSONB (2014) combined flexible schema storage with binary representation and GIN indexing, achieving both flexibility and performance that made it a document database competitor.

**Modern practice anchor:**
Today's SQL databases treat JSON as a first-class citizen with JSONB storage, GIN indexing, and rich extraction functions—enabling schema-on-read patterns without sacrificing query performance.

### Production Reality

**Failure modes:**
1. **JSONB indexing missing causing seq scan**: 50M row table with JSONB column `data` queried daily with `WHERE data->>'status' = 'active'` — no GIN index, full table scan takes 180s, blocks other queries
2. **JSON path queries without operator class**: `WHERE jsonb_path_exists(data, '$.items[*] ? (@.price > 100)')` ignores available indexes — Postgres uses generic plan with sequential access
3. **Large JSON documents bloating row size**: API responses storing full payload (avg 500KB) in JSONB column — table size grows from 2GB to 80GB, index size balloons, cache efficiency drops to 15%

**Debug workflow:**
1. Verify GIN index exists: `SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'my_table' AND indexdef LIKE '%jsonb%'`
2. Check for bloat: `SELECT relname, pg_size_pretty(pg_total_relation_size(oid)) FROM pg_class WHERE relname LIKE '%json%'`
3. Test query plan: `EXPLAIN (ANALYZE, BUFFERS)` on JSONB queries — verify index usage and look for `Seq Scan` which indicates missing index

**Modern practice anchor:**
JSONB requires explicit GIN indexing for query performance — storage flexibility does not mean query performance is free.
```


---

## Reality Check

**"Storing JSON in a database column is always an antipattern"** → JSON columns are appropriate when: the data has genuinely variable schema (different products have different attributes), the data is always read/written as a whole document, you need schema flexibility without migrations. They're problematic when: you query individual JSON fields in WHERE clauses frequently (index needed, limited pushdown), you need relational integrity on JSON content (no FK constraints into JSON), the data is actually structured (use columns, not JSON). PostgreSQL JSONB is indexable and queryable — it's not "JSON in a text column." Use it deliberately, not to avoid schema design.

**"PostgreSQL's JSONB and MySQL's JSON are equivalent"** → PostgreSQL JSONB: binary representation, supports GIN/GiST indexes for efficient queries, preserves value types (numbers, booleans distinct from strings), removes duplicate keys (keeps last). PostgreSQL JSON (not JSONB): stored as text, no binary parsing, preserves insertion order and duplicate keys, slower for queries. MySQL JSON: validated JSON, stored in a binary format, supports JSON_EXTRACT, generated columns on JSON fields as indexes. The querying syntax differs significantly: PostgreSQL uses `->`, `->>`, `@>` operators; MySQL uses `JSON_EXTRACT()` or `column->>'$.field'` shorthand.

**"JSON in SQL replaces the need for a document database"** → For simple document storage and retrieval, yes — PostgreSQL with JSONB handles many MongoDB use cases. The limitations of SQL JSON vs dedicated document DBs: no horizontal sharding built-in, no native document-oriented query language (aggregation pipelines), schema validation must be application-side (unless using CHECK constraints with JSON schema validators). The advantage of SQL JSON: you can JOIN JSON data with relational tables in the same query — impossible across a separate MongoDB instance.

**"SQL's XML support is legacy and should be avoided"** → XML in SQL is not just legacy. XML is still the primary format for: SOAP web services (enterprise integrations), Microsoft Office files (DOCX, XLSX are ZIP archives of XML), many industry standard data exchange formats (HL7 FHIR in healthcare, FpML in finance, many government standards). PostgreSQL XML type, SQL Server XML type with XQuery support, and Oracle XMLType are production features used in enterprise systems. The industry has largely moved to JSON for APIs, but XML remains in many integration contexts.

**"JSON functions are always O(1) lookups"** → JSON field extraction is NOT O(1) unless there's a functional index. `column->>'name'` parses the entire JSON value each time. For PostgreSQL JSONB, a GIN index on the whole column: `CREATE INDEX ON t USING GIN (data)` enables fast `@>` (contains) queries. For a specific field: `CREATE INDEX ON t ((data->>'name'))` — a functional index on that expression. Without an index, `WHERE data->>'name' = 'Alice'` is a full table scan parsing every JSONB value. Index your JSON access patterns like any other column.
