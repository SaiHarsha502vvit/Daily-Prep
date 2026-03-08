> **Navigation**: [Back to Index](00_INDEX.md) | [< Prev](35_Database_Migration_Schema.md) | [Next >](37_SQL_5WH_Deep_Reasoning.md)

# Chapter 36 — Advanced Data Modeling

## 5W-H Framework
- **WHO** needs this? → Data engineers, warehouse architects, analytics engineers, senior backend devs
- **WHAT** is it? → Blueprint patterns for organizing data: Star, Snowflake, Data Vault, dimensional modeling
- **WHEN** to use? → Building data warehouses, designing analytics databases, restructuring legacy schemas
- **WHERE** is it used? → BI/reporting (Star Schema), enterprise DW (Data Vault), OLTP (3NF)
- **WHY** learn it? → Wrong model = slow queries, painful maintenance. Right model = 10x query speed
- **HOW** does it work? → Choose model based on use case → design dimensions/facts → implement

---

## Part 1 — OLTP vs OLAP Modeling

### 1.1 Two Different Worlds
```
┌─────────────────────────┬──────────────────────────────┐
│      OLTP               │         OLAP                  │
│  (Online Transaction)   │  (Online Analytical)          │
├─────────────────────────┼──────────────────────────────┤
│ INSERT/UPDATE/DELETE     │ SELECT (read-heavy)           │
│ Single row at a time     │ Millions of rows aggregated  │
│ Normalized (3NF)         │ Denormalized (Star/Snowflake) │
│ Many small transactions  │ Few large analytical queries  │
│ Current data             │ Historical data               │
│ MySQL, PostgreSQL        │ Redshift, BigQuery, Snowflake │
│ Application database     │ Data warehouse / Data lake    │
└─────────────────────────┴──────────────────────────────┘

OLTP: "What is customer 42's email?"         → 1 row, < 1ms
OLAP: "What was revenue by region per month?" → 10M rows, 2-30s
```

---

## Part 2 — Star Schema

### 2.1 Concept
```
The Star Schema is the FOUNDATION of data warehousing.

             ┌─────────────┐
             │ dim_customer │
             └──────┬──────┘
                    │
 ┌──────────┐  ┌───┴───────────┐  ┌──────────┐
 │ dim_time  ├──┤  fact_sales   ├──┤ dim_store │
 └──────────┘  └───┬───────────┘  └──────────┘
                    │
             ┌──────┴──────┐
             │ dim_product  │
             └─────────────┘

Fact table = center (measures/metrics: amount, quantity, clicks)
Dimension tables = arms of the star (descriptive: who, what, when, where)
```

### 2.2 Implementation
```sql
-- === DIMENSION TABLES ===

CREATE TABLE dim_date (
    date_key     INT PRIMARY KEY,        -- 20260315
    full_date    DATE NOT NULL,
    year         INT,
    quarter      INT,
    month        INT,
    month_name   VARCHAR(20),
    week         INT,
    day_of_week  INT,
    day_name     VARCHAR(20),
    is_weekend   BOOLEAN,
    is_holiday   BOOLEAN,
    fiscal_year  INT,
    fiscal_quarter INT
);

CREATE TABLE dim_product (
    product_key  SERIAL PRIMARY KEY,
    product_id   INT,              -- Business key (from source)
    product_name VARCHAR(200),
    category     VARCHAR(100),
    subcategory  VARCHAR(100),
    brand        VARCHAR(100),
    unit_price   DECIMAL(10,2),
    -- SCD Type 2 fields
    effective_from DATE,
    effective_to   DATE DEFAULT '9999-12-31',
    is_current     BOOLEAN DEFAULT TRUE
);

CREATE TABLE dim_customer (
    customer_key SERIAL PRIMARY KEY,
    customer_id  INT,
    name         VARCHAR(100),
    city         VARCHAR(100),
    state        VARCHAR(50),
    country      VARCHAR(50),
    segment      VARCHAR(50),   -- 'Consumer', 'Corporate', 'Government'
    tier         VARCHAR(20),   -- 'Bronze', 'Silver', 'Gold', 'Platinum'
    effective_from DATE,
    effective_to   DATE DEFAULT '9999-12-31',
    is_current     BOOLEAN DEFAULT TRUE
);

CREATE TABLE dim_store (
    store_key    SERIAL PRIMARY KEY,
    store_id     INT,
    store_name   VARCHAR(100),
    city         VARCHAR(100),
    state        VARCHAR(50),
    country      VARCHAR(50),
    store_type   VARCHAR(50),  -- 'Flagship', 'Mall', 'Online'
    open_date    DATE,
    manager      VARCHAR(100)
);

-- === FACT TABLE ===

CREATE TABLE fact_sales (
    sale_id       BIGSERIAL PRIMARY KEY,
    date_key      INT REFERENCES dim_date(date_key),
    product_key   INT REFERENCES dim_product(product_key),
    customer_key  INT REFERENCES dim_customer(customer_key),
    store_key     INT REFERENCES dim_store(store_key),
    -- Measures (what you aggregate)
    quantity      INT NOT NULL,
    unit_price    DECIMAL(10,2),
    discount      DECIMAL(5,2) DEFAULT 0,
    sales_amount  DECIMAL(12,2) NOT NULL,
    cost_amount   DECIMAL(12,2),
    profit        DECIMAL(12,2)
);

-- Indexes on foreign keys (critical for JOINs)
CREATE INDEX idx_fact_date ON fact_sales(date_key);
CREATE INDEX idx_fact_product ON fact_sales(product_key);
CREATE INDEX idx_fact_customer ON fact_sales(customer_key);
CREATE INDEX idx_fact_store ON fact_sales(store_key);
```

### 2.3 Star Schema Queries
```sql
-- Revenue by product category and quarter
SELECT 
    d.year,
    d.quarter,
    p.category,
    SUM(f.sales_amount) AS revenue,
    SUM(f.profit) AS profit,
    SUM(f.quantity) AS units_sold,
    ROUND(SUM(f.profit) / NULLIF(SUM(f.sales_amount), 0) * 100, 1) AS margin_pct
FROM fact_sales f
JOIN dim_date d ON f.date_key = d.date_key
JOIN dim_product p ON f.product_key = p.product_key
WHERE d.year = 2026
GROUP BY d.year, d.quarter, p.category
ORDER BY d.quarter, revenue DESC;

-- Top customers by segment (note: simple JOINs, no subqueries needed)
SELECT 
    c.segment,
    c.tier,
    COUNT(DISTINCT c.customer_key) AS customer_count,
    SUM(f.sales_amount) AS total_revenue,
    ROUND(AVG(f.sales_amount), 2) AS avg_order_value
FROM fact_sales f
JOIN dim_customer c ON f.customer_key = c.customer_key AND c.is_current
WHERE f.date_key BETWEEN 20260101 AND 20261231
GROUP BY c.segment, c.tier
ORDER BY total_revenue DESC;
```

---

## Part 3 — Snowflake Schema

### 3.1 Concept
```
Snowflake = Star Schema with NORMALIZED dimensions.
Dimensions are broken into sub-dimensions.

                      ┌──────────┐
                      │ dim_city │
                      └────┬─────┘
                           │
 ┌──────────┐  ┌──────────┼──────────┐  ┌──────────────┐
 │ dim_time  ├──┤     fact_sales      ├──┤ dim_customer  │
 └──────────┘  └──────────┬──────────┘  └──────────────┘
                           │
                    ┌──────┴──────┐
                    │ dim_product  │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │dim_category  │
                    └──────┬──────┘
                           │
                    ┌──────┴──────────┐
                    │dim_subcategory   │
                    └─────────────────┘

Pros: Less storage (no redundancy), easier maintenance
Cons: More JOINs = slower queries, more complex
```

### 3.2 When to Use What
```
Star Schema:
✅ Simpler queries (fewer JOINs)
✅ Faster query performance
✅ Better for BI tools (Tableau, Power BI)
✅ Use by default for analytics

Snowflake Schema:
✅ Less storage space
✅ Easier to update dimension attributes
✅ Better for very large dimension tables (10M+ rows)
✅ Use when storage is critical or dimensions change frequently
```

---

## Part 4 — Data Vault

### 4.1 Concept
```
Data Vault is designed for ENTERPRISE data warehousing.
It handles: multiple sources, changing business rules, full auditability.

Three building blocks:
┌──────────┐     ┌──────────┐     ┌──────────┐
│   HUB    │────│   LINK   │────│   HUB    │
│ (entity) │     │ (relation)│    │ (entity) │
└────┬─────┘     └──────────┘     └────┬─────┘
     │                                  │
┌────┴─────┐                     ┌─────┴────┐
│ SATELLITE │                     │ SATELLITE │
│ (context) │                     │ (context) │
└──────────┘                     └──────────┘

HUB:       Business keys (customer_id, product_id) — never changes
LINK:      Relationships between hubs (customer bought product)
SATELLITE: Descriptive data (name, address, price) — changes over time
```

### 4.2 Implementation
```sql
-- === HUBS ===
CREATE TABLE hub_customer (
    hub_customer_key  BIGSERIAL PRIMARY KEY,
    customer_bk       VARCHAR(50) NOT NULL UNIQUE,  -- Business key
    load_date         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    record_source     VARCHAR(100) NOT NULL
);

CREATE TABLE hub_product (
    hub_product_key   BIGSERIAL PRIMARY KEY,
    product_bk        VARCHAR(50) NOT NULL UNIQUE,
    load_date         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    record_source     VARCHAR(100) NOT NULL
);

-- === LINK ===
CREATE TABLE link_purchase (
    link_purchase_key BIGSERIAL PRIMARY KEY,
    hub_customer_key  BIGINT REFERENCES hub_customer(hub_customer_key),
    hub_product_key   BIGINT REFERENCES hub_product(hub_product_key),
    purchase_date     DATE,
    load_date         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    record_source     VARCHAR(100) NOT NULL,
    UNIQUE (hub_customer_key, hub_product_key, purchase_date)
);

-- === SATELLITES ===
CREATE TABLE sat_customer_details (
    hub_customer_key  BIGINT REFERENCES hub_customer(hub_customer_key),
    load_date         TIMESTAMPTZ NOT NULL,
    name              VARCHAR(100),
    email             VARCHAR(200),
    city              VARCHAR(100),
    tier              VARCHAR(20),
    hash_diff         VARCHAR(64),  -- Hash of all attributes for change detection
    record_source     VARCHAR(100),
    PRIMARY KEY (hub_customer_key, load_date)
);

CREATE TABLE sat_product_details (
    hub_product_key   BIGINT REFERENCES hub_product(hub_product_key),
    load_date         TIMESTAMPTZ NOT NULL,
    product_name      VARCHAR(200),
    category          VARCHAR(100),
    price             DECIMAL(10,2),
    hash_diff         VARCHAR(64),
    record_source     VARCHAR(100),
    PRIMARY KEY (hub_product_key, load_date)
);
```

---

## Part 5 — Modeling Patterns

### 5.1 Fact Table Types
```
┌─────────────────┬──────────────────────────────────────────┐
│ Fact Type       │ Description                               │
├─────────────────┼──────────────────────────────────────────┤
│ Transaction     │ One row per event (sale, click, payment)  │
│                 │ Most detailed. Most common.                │
├─────────────────┼──────────────────────────────────────────┤
│ Periodic        │ One row per time period (daily summary,    │
│ Snapshot        │ monthly balance). Pre-aggregated.          │
├─────────────────┼──────────────────────────────────────────┤
│ Accumulating    │ One row per lifecycle (order: created →     │
│ Snapshot        │ shipped → delivered → returned). Updated.  │
├─────────────────┼──────────────────────────────────────────┤
│ Factless Fact   │ Records events with no measures (student   │
│                 │ attendance, page views without amounts)     │
└─────────────────┴──────────────────────────────────────────┘
```

### 5.2 Accumulating Snapshot Example
```sql
-- Track order lifecycle (updated as order progresses)
CREATE TABLE fact_order_lifecycle (
    order_key          BIGINT PRIMARY KEY,
    customer_key       INT REFERENCES dim_customer(customer_key),
    product_key        INT REFERENCES dim_product(product_key),
    -- Milestone date keys
    order_date_key     INT REFERENCES dim_date(date_key),
    payment_date_key   INT REFERENCES dim_date(date_key),
    ship_date_key      INT REFERENCES dim_date(date_key),
    delivery_date_key  INT REFERENCES dim_date(date_key),
    return_date_key    INT REFERENCES dim_date(date_key),
    -- Lag measures (days between stages)
    order_to_payment_days  INT,
    payment_to_ship_days   INT,
    ship_to_delivery_days  INT,
    -- Measures
    order_amount       DECIMAL(12,2),
    current_status     VARCHAR(20)  -- 'ordered', 'paid', 'shipped', 'delivered', 'returned'
);
```

### 5.3 Junk Dimension (Low-Cardinality Flags)
```sql
-- Instead of 5 boolean flags on the fact table,
-- create a "junk" dimension with all combinations
CREATE TABLE dim_order_flags (
    flag_key     SERIAL PRIMARY KEY,
    is_gift      BOOLEAN,
    is_rush      BOOLEAN,
    is_online    BOOLEAN,
    is_first_order BOOLEAN,
    used_coupon  BOOLEAN
);

-- Pre-populate all combinations (2^5 = 32 rows)
INSERT INTO dim_order_flags (is_gift, is_rush, is_online, is_first_order, used_coupon)
SELECT g, r, o, f, c
FROM (VALUES (TRUE), (FALSE)) AS t1(g)
CROSS JOIN (VALUES (TRUE), (FALSE)) AS t2(r)
CROSS JOIN (VALUES (TRUE), (FALSE)) AS t3(o)
CROSS JOIN (VALUES (TRUE), (FALSE)) AS t4(f)
CROSS JOIN (VALUES (TRUE), (FALSE)) AS t5(c);

-- Fact table uses single FK instead of 5 columns
ALTER TABLE fact_sales ADD COLUMN flag_key INT REFERENCES dim_order_flags(flag_key);
```

---

## Part 6 — Python: Schema Visualization

```python
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

def draw_star_schema():
    fig, ax = plt.subplots(figsize=(12, 10))
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 10)
    ax.axis('off')
    
    # Fact table (center)
    fact = mpatches.FancyBboxPatch((4, 3.5), 4, 3, boxstyle="round,pad=0.1",
                                    facecolor='#e74c3c', edgecolor='black', linewidth=2)
    ax.add_patch(fact)
    ax.text(6, 5, "fact_sales\n─────────\ndate_key (FK)\nproduct_key (FK)\ncustomer_key (FK)\nstore_key (FK)\n─────────\nquantity\nsales_amount\nprofit",
            ha='center', va='center', fontsize=8, fontfamily='monospace', color='white')
    
    # Dimension tables
    dims = [
        (0.5, 7, 'dim_date\n────\ndate_key (PK)\nyear, quarter\nmonth, day'),
        (8.5, 7, 'dim_product\n────\nproduct_key (PK)\nname, category\nbrand, price'),
        (0.5, 0, 'dim_customer\n────\ncustomer_key (PK)\nname, city\nsegment, tier'),
        (8.5, 0, 'dim_store\n────\nstore_key (PK)\nname, city\ntype, manager'),
    ]
    
    for x, y, text in dims:
        box = mpatches.FancyBboxPatch((x, y), 3, 2.5, boxstyle="round,pad=0.1",
                                       facecolor='#3498db', edgecolor='black', linewidth=2)
        ax.add_patch(box)
        ax.text(x + 1.5, y + 1.25, text, ha='center', va='center', fontsize=7,
                fontfamily='monospace', color='white')
    
    # Draw lines from fact to dims
    lines = [
        ((4, 5), (3.5, 8.25)),    # to dim_date
        ((8, 5), (8.5, 8.25)),    # to dim_product
        ((4, 3.5), (3.5, 2.5)),   # to dim_customer
        ((8, 3.5), (8.5, 2.5)),   # to dim_store
    ]
    for (x1, y1), (x2, y2) in lines:
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle='->', lw=2, color='gray'))
    
    ax.set_title("Star Schema — Sales Data Warehouse", fontsize=16, fontweight='bold')
    plt.tight_layout()
    plt.show()

draw_star_schema()
```

---

## Model Selection Guide

```
┌───────────────────┬──────────────────────────────────────────┐
│ Use Case          │ Recommended Model                         │
├───────────────────┼──────────────────────────────────────────┤
│ BI / Reporting    │ Star Schema (simple, fast, BI-friendly)  │
│ Ad-hoc analytics  │ Star Schema                               │
│ Enterprise DW     │ Data Vault (auditability, multi-source)  │
│ Regulatory/audit  │ Data Vault (full history, traceability)  │
│ Application DB    │ 3NF (normalized, OLTP optimized)         │
│ Data lake         │ Schema-on-read (Parquet/Delta Lake)      │
│ ML feature store  │ Wide denormalized tables                  │
│ Real-time analytics│ Star Schema + materialized views         │
└───────────────────┴──────────────────────────────────────────┘
```

---

> **Navigation**: [Back to Index](00_INDEX.md) | [< Prev](35_Database_Migration_Schema.md) | [Next >](37_SQL_5WH_Deep_Reasoning.md)
