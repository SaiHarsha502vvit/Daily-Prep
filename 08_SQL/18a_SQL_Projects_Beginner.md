---

**SQL Chapter 18/20** | [← Previous](17_Practice_100_Problems.md) | [Index](../00_MASTER_INDEX.md) | [Next →](19_Interview_Top50.md)

---

## Chapter 22: Mini Projects

### Project 1: E-commerce Analytics Dashboard

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- PROJECT 1: E-COMMERCE ANALYTICS DASHBOARD
-- ═══════════════════════════════════════════════════════════════════════════════

-- STEP 1: Create the database schema
CREATE DATABASE ecommerce_analytics;
USE ecommerce_analytics;

-- Create dimension tables
CREATE TABLE dim_date (
    date_key INT PRIMARY KEY,
    full_date DATE,
    day_name VARCHAR(10),
    month_name VARCHAR(10),
    quarter INT,
    year INT
);

CREATE TABLE dim_product (
    product_key INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT UNIQUE,
    name VARCHAR(255),
    category VARCHAR(100),
    brand VARCHAR(100),
    price DECIMAL(10,2)
);

CREATE TABLE dim_customer (
    customer_key INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT UNIQUE,
    name VARCHAR(200),
    email VARCHAR(255),
    city VARCHAR(100),
    country VARCHAR(100),
    segment VARCHAR(50)
);

-- Create fact table
CREATE TABLE fact_orders (
    fact_key BIGINT AUTO_INCREMENT PRIMARY KEY,
    date_key INT,
    product_key INT,
    customer_key INT,
    order_id VARCHAR(50),
    quantity INT,
    unit_price DECIMAL(10,2),
    discount DECIMAL(5,2),
    total_amount DECIMAL(12,2),
    FOREIGN KEY (date_key) REFERENCES dim_date(date_key),
    FOREIGN KEY (product_key) REFERENCES dim_product(product_key),
    FOREIGN KEY (customer_key) REFERENCES dim_customer(customer_key)
);

-- STEP 2: Create analytics views

-- Daily sales summary
CREATE VIEW v_daily_sales AS
SELECT
    dd.full_date,
    dd.day_name,
    COUNT(DISTINCT fo.order_id) AS orders,
    COUNT(DISTINCT fo.customer_key) AS customers,
    SUM(fo.quantity) AS units_sold,
    SUM(fo.total_amount) AS revenue
FROM fact_orders fo
JOIN dim_date dd ON fo.date_key = dd.date_key
GROUP BY dd.full_date, dd.day_name;

-- Product performance
CREATE VIEW v_product_performance AS
SELECT
    dp.category,
    dp.name AS product_name,
    COUNT(DISTINCT fo.order_id) AS times_ordered,
    SUM(fo.quantity) AS total_units,
    SUM(fo.total_amount) AS total_revenue,
    AVG(fo.unit_price) AS avg_price
FROM fact_orders fo
JOIN dim_product dp ON fo.product_key = dp.product_key
GROUP BY dp.category, dp.product_key, dp.name;

-- Customer segments
CREATE VIEW v_customer_segments AS
SELECT
    dc.segment,
    dc.country,
    COUNT(DISTINCT dc.customer_key) AS customers,
    SUM(fo.total_amount) AS total_revenue,
    AVG(fo.total_amount) AS avg_order_value
FROM dim_customer dc
LEFT JOIN fact_orders fo ON dc.customer_key = fo.customer_key
GROUP BY dc.segment, dc.country;

-- STEP 3: Create stored procedure for reports

DELIMITER //
CREATE PROCEDURE sp_monthly_report(IN p_year INT, IN p_month INT)
BEGIN
    -- Summary metrics
    SELECT
        'Monthly Summary' AS report,
        COUNT(DISTINCT order_id) AS total_orders,
        COUNT(DISTINCT customer_key) AS unique_customers,
        SUM(total_amount) AS total_revenue,
        AVG(total_amount) AS avg_order_value
    FROM fact_orders fo
    JOIN dim_date dd ON fo.date_key = dd.date_key
    WHERE dd.year = p_year AND MONTH(dd.full_date) = p_month;

    -- Top 10 products
    SELECT
        'Top Products' AS report,
        dp.name,
        SUM(fo.quantity) AS units,
        SUM(fo.total_amount) AS revenue
    FROM fact_orders fo
    JOIN dim_date dd ON fo.date_key = dd.date_key
    JOIN dim_product dp ON fo.product_key = dp.product_key
    WHERE dd.year = p_year AND MONTH(dd.full_date) = p_month
    GROUP BY dp.product_key, dp.name
    ORDER BY revenue DESC LIMIT 10;

    -- Category breakdown
    SELECT
        'Category Breakdown' AS report,
        dp.category,
        SUM(fo.total_amount) AS revenue,
        SUM(fo.total_amount) * 100.0 / SUM(SUM(fo.total_amount)) OVER () AS percentage
    FROM fact_orders fo
    JOIN dim_date dd ON fo.date_key = dd.date_key
    JOIN dim_product dp ON fo.product_key = dp.product_key
    WHERE dd.year = p_year AND MONTH(dd.full_date) = p_month
    GROUP BY dp.category;
END //
DELIMITER ;

-- Run monthly report
CALL sp_monthly_report(2024, 6);
```

### Project 2: Employee Management System

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- PROJECT 2: EMPLOYEE MANAGEMENT SYSTEM
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create complete HR database with triggers and procedures

CREATE DATABASE hr_system;
USE hr_system;

-- Tables
CREATE TABLE departments (
    dept_id INT AUTO_INCREMENT PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL,
    budget DECIMAL(15,2) DEFAULT 0,
    manager_id INT
);

CREATE TABLE employees (
    emp_id INT AUTO_INCREMENT PRIMARY KEY,
    emp_code VARCHAR(20) UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    hire_date DATE NOT NULL,
    job_title VARCHAR(100),
    salary DECIMAL(10,2) CHECK (salary >= 0),
    dept_id INT,
    manager_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (dept_id) REFERENCES departments(dept_id),
    FOREIGN KEY (manager_id) REFERENCES employees(emp_id)
);

CREATE TABLE salary_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    emp_id INT,
    old_salary DECIMAL(10,2),
    new_salary DECIMAL(10,2),
    change_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    change_reason VARCHAR(200),
    changed_by VARCHAR(100),
    FOREIGN KEY (emp_id) REFERENCES employees(emp_id)
);

CREATE TABLE employee_audit (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    emp_id INT,
    action VARCHAR(20),
    field_changed VARCHAR(50),
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by VARCHAR(100)
);

-- Triggers
DELIMITER //

CREATE TRIGGER before_employee_insert
BEFORE INSERT ON employees
FOR EACH ROW
BEGIN
    SET NEW.emp_code = CONCAT('EMP', LPAD((SELECT IFNULL(MAX(emp_id), 0) + 1 FROM employees), 5, '0'));
END //

CREATE TRIGGER after_salary_update
AFTER UPDATE ON employees
FOR EACH ROW
BEGIN
    IF OLD.salary != NEW.salary THEN
        INSERT INTO salary_history (emp_id, old_salary, new_salary, change_reason, changed_by)
        VALUES (NEW.emp_id, OLD.salary, NEW.salary, 'Salary Update', USER());
    END IF;
END //

DELIMITER ;

-- Stored Procedures
DELIMITER //

CREATE PROCEDURE sp_hire_employee(
    IN p_first_name VARCHAR(50),
    IN p_last_name VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_job_title VARCHAR(100),
    IN p_salary DECIMAL(10,2),
    IN p_dept_id INT
)
BEGIN
    INSERT INTO employees (first_name, last_name, email, job_title, salary, dept_id, hire_date)
    VALUES (p_first_name, p_last_name, p_email, p_job_title, p_salary, p_dept_id, CURDATE());

    SELECT LAST_INSERT_ID() AS new_emp_id,
           (SELECT emp_code FROM employees WHERE emp_id = LAST_INSERT_ID()) AS emp_code;
END //

CREATE PROCEDURE sp_give_raise(
    IN p_dept_id INT,
    IN p_percentage DECIMAL(5,2)
)
BEGIN
    UPDATE employees
    SET salary = salary * (1 + p_percentage/100)
    WHERE dept_id = p_dept_id AND is_active = TRUE;

    SELECT ROW_COUNT() AS employees_updated;
END //

CREATE PROCEDURE sp_org_chart()
BEGIN
    WITH RECURSIVE org AS (
        SELECT emp_id, CONCAT(first_name, ' ', last_name) AS name, job_title, manager_id, 0 AS level
        FROM employees WHERE manager_id IS NULL AND is_active = TRUE
        UNION ALL
        SELECT e.emp_id, CONCAT(e.first_name, ' ', e.last_name), e.job_title, e.manager_id, o.level + 1
        FROM employees e JOIN org o ON e.manager_id = o.emp_id
        WHERE e.is_active = TRUE
    )
    SELECT CONCAT(REPEAT('  ', level), name) AS employee, job_title, level
    FROM org ORDER BY level, name;
END //

DELIMITER ;
```

### Project 3: Data Pipeline (ETL)

```sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- PROJECT 3: SIMPLE ETL DATA PIPELINE
-- ═══════════════════════════════════════════════════════════════════════════════

-- This project demonstrates ETL concepts using SQL

-- Source system (simulated)
CREATE DATABASE source_crm;
USE source_crm;

CREATE TABLE raw_leads (
    lead_id INT PRIMARY KEY,
    company_name VARCHAR(200),
    contact_name VARCHAR(100),
    contact_email VARCHAR(255),
    phone VARCHAR(50),
    source VARCHAR(100),
    status VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Staging area
CREATE DATABASE etl_staging;
USE etl_staging;

CREATE TABLE stg_leads (
    lead_id INT,
    company_name VARCHAR(200),
    contact_name VARCHAR(100),
    contact_email VARCHAR(255),
    phone VARCHAR(50),
    source VARCHAR(100),
    status VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    -- ETL metadata
    etl_batch_id INT,
    etl_loaded_at TIMESTAMP,
    etl_checksum VARCHAR(64),
    is_valid BOOLEAN DEFAULT TRUE,
    validation_errors TEXT
);

-- Data Warehouse
CREATE DATABASE dwh;
USE dwh;

CREATE TABLE dim_lead_source (
    source_key INT AUTO_INCREMENT PRIMARY KEY,
    source_name VARCHAR(100),
    source_category VARCHAR(50),
    effective_date DATE,
    expiry_date DATE DEFAULT '9999-12-31',
    is_current BOOLEAN DEFAULT TRUE
);

CREATE TABLE fact_leads (
    fact_key BIGINT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT,
    source_key INT,
    status VARCHAR(50),
    days_to_convert INT,
    created_date_key INT,
    converted_date_key INT
);

-- ETL Procedures
DELIMITER //

CREATE PROCEDURE etl_extract_leads(IN p_batch_id INT)
BEGIN
    -- Extract from source to staging
    INSERT INTO etl_staging.stg_leads
        (lead_id, company_name, contact_name, contact_email, phone, source, status,
         created_at, updated_at, etl_batch_id, etl_loaded_at, etl_checksum)
    SELECT
        lead_id, company_name, contact_name, contact_email, phone, source, status,
        created_at, updated_at, p_batch_id, NOW(),
        MD5(CONCAT_WS('|', lead_id, company_name, contact_email, status, updated_at))
    FROM source_crm.raw_leads
    WHERE updated_at > (SELECT COALESCE(MAX(updated_at), '1900-01-01') FROM etl_staging.stg_leads);

    SELECT ROW_COUNT() AS records_extracted;
END //

CREATE PROCEDURE etl_transform_leads(IN p_batch_id INT)
BEGIN
    -- Validate data
    UPDATE etl_staging.stg_leads
    SET is_valid = FALSE,
        validation_errors = CONCAT_WS(', ',
            CASE WHEN contact_email NOT REGEXP '^[A-Za-z0-9._%+-]+@' THEN 'Invalid email' END,
            CASE WHEN phone IS NULL OR phone = '' THEN 'Missing phone' END
        )
    WHERE etl_batch_id = p_batch_id
      AND (contact_email NOT REGEXP '^[A-Za-z0-9._%+-]+@'
           OR phone IS NULL OR phone = '');

    -- Transform: Clean and standardize
    UPDATE etl_staging.stg_leads
    SET company_name = TRIM(company_name),
        contact_name = TRIM(contact_name),
        contact_email = LOWER(TRIM(contact_email)),
        phone = REGEXP_REPLACE(phone, '[^0-9]', '')
    WHERE etl_batch_id = p_batch_id AND is_valid = TRUE;

    SELECT
        SUM(CASE WHEN is_valid THEN 1 ELSE 0 END) AS valid_records,
        SUM(CASE WHEN NOT is_valid THEN 1 ELSE 0 END) AS invalid_records
    FROM etl_staging.stg_leads WHERE etl_batch_id = p_batch_id;
END //

CREATE PROCEDURE etl_load_leads(IN p_batch_id INT)
BEGIN
    -- Load to dimension (SCD Type 1 for simplicity)
    INSERT INTO dwh.dim_lead_source (source_name, source_category, effective_date)
    SELECT DISTINCT source,
        CASE
            WHEN source LIKE '%web%' THEN 'Digital'
            WHEN source LIKE '%referral%' THEN 'Referral'
            ELSE 'Other'
        END,
        CURDATE()
    FROM etl_staging.stg_leads s
    WHERE s.etl_batch_id = p_batch_id
      AND s.is_valid = TRUE
      AND NOT EXISTS (SELECT 1 FROM dwh.dim_lead_source d WHERE d.source_name = s.source);

    -- Load to fact
    INSERT INTO dwh.fact_leads (lead_id, source_key, status, created_date_key)
    SELECT s.lead_id, d.source_key, s.status,
        CAST(DATE_FORMAT(s.created_at, '%Y%m%d') AS UNSIGNED)
    FROM etl_staging.stg_leads s
    JOIN dwh.dim_lead_source d ON s.source = d.source_name AND d.is_current = TRUE
    WHERE s.etl_batch_id = p_batch_id AND s.is_valid = TRUE;

    SELECT ROW_COUNT() AS records_loaded;
END //

-- Master ETL procedure
CREATE PROCEDURE run_etl_pipeline()
BEGIN
    DECLARE v_batch_id INT;

    -- Generate batch ID
    SET v_batch_id = UNIX_TIMESTAMP();

    -- Run ETL steps
    CALL etl_extract_leads(v_batch_id);
    CALL etl_transform_leads(v_batch_id);
    CALL etl_load_leads(v_batch_id);

    SELECT 'ETL Pipeline Complete' AS status, v_batch_id AS batch_id;
END //

DELIMITER ;
```

---




# ═══════════════════════════════════════════════════════════════════
# MERGED FROM: 04_SQL_Practice_Projects.md (WHY-HOW Framework Edition)
# ═══════════════════════════════════════════════════════════════════

# 🎯 SQL Practice Projects & Interview Questions

Build real skills through project-based learning. Each project simulates actual data analyst work.

---

## 📋 Project Structure

Each project includes:

1. **Business Context** - WHY this analysis matters
2. **Schema Setup** - CREATE tables and sample data
3. **Questions** - Progressively harder challenges
4. **Solutions** - With explanations
5. **Interview Tie-in** - How to discuss this in interviews

---

# PROJECT 1: E-Commerce Analytics Dashboard

## 🏢 Business Context

You're a data analyst at an e-commerce company. The CEO wants a dashboard showing:

- Daily revenue trends
- Top performing products
- Customer retention rates
- Conversion funnel analysis



🔬 **Section Challenge — 🏢 Business Context**

**Challenge 1 (Reasoning):** The conversion funnel query uses `MAX(CASE WHEN page_type = 'cart' THEN 1 ELSE 0 END)` per session. Why not `COUNT(CASE WHEN page_type = 'cart' ...)` instead? When would the results differ?
<details><summary>Answer</summary>

`MAX(CASE...)` produces 0 or 1 — "did this session visit cart at all?" (boolean per session). `COUNT(CASE...)` counts *how many cart page views* per session. If a user visits the cart 5 times in one session, MAX gives 1, COUNT gives 5. For funnel analysis, you want MAX because you're asking "what fraction of sessions reached this stage" — counting page views would inflate the numbers. This is the difference between **session-level** (MAX) and **event-level** (COUNT) aggregation — a critical distinction in analytics queries.
</details>


## 📊 Schema Setup

```sql
-- Create the database schema
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100),
    registration_date DATE NOT NULL,
    country VARCHAR(50),
    customer_segment VARCHAR(20) -- 'regular', 'premium', 'vip'
);

CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    subcategory VARCHAR(50),
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2),
    stock_quantity INT DEFAULT 0
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(customer_id),
    order_date TIMESTAMP NOT NULL,
    status VARCHAR(20), -- 'pending', 'shipped', 'delivered', 'cancelled', 'returned'
    shipping_address TEXT,
    total_amount DECIMAL(10,2)
);

CREATE TABLE order_items (
    item_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(order_id),
    product_id INT REFERENCES products(product_id),
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0
);

CREATE TABLE page_views (
    view_id SERIAL PRIMARY KEY,
    customer_id INT,  -- NULL for anonymous visitors
    session_id VARCHAR(50) NOT NULL,
    page_type VARCHAR(30), -- 'home', 'category', 'product', 'cart', 'checkout', 'thankyou'
    product_id INT,  -- Only for product pages
    viewed_at TIMESTAMP NOT NULL
);

-- Insert sample data (abbreviated)
INSERT INTO customers (email, name, registration_date, country, customer_segment) VALUES
('alice@email.com', 'Alice Smith', '2023-01-15', 'USA', 'premium'),
('bob@email.com', 'Bob Johnson', '2023-03-20', 'USA', 'regular'),
('carol@email.com', 'Carol White', '2023-06-10', 'UK', 'vip'),
('david@email.com', 'David Brown', '2024-01-05', 'Canada', 'regular'),
('eve@email.com', 'Eve Davis', '2024-02-14', 'USA', 'regular');

INSERT INTO products (name, category, subcategory, price, cost, stock_quantity) VALUES
('Laptop Pro 15', 'Electronics', 'Computers', 1299.99, 900.00, 50),
('Wireless Mouse', 'Electronics', 'Accessories', 29.99, 12.00, 200),
('Coffee Maker Deluxe', 'Home', 'Kitchen', 89.99, 45.00, 75),
('Running Shoes X1', 'Sports', 'Footwear', 129.99, 60.00, 100),
('Python Programming Book', 'Books', 'Technology', 49.99, 25.00, 150);
```

---

## Level 1: Basic Queries (Warm-up)

### Q1.1: Daily Revenue

**Task:** Calculate total revenue by date for the last 30 days.

```sql
-- YOUR ATTEMPT HERE

-- SOLUTION:
SELECT
    DATE(order_date) as order_day,
    COUNT(DISTINCT order_id) as total_orders,
    SUM(total_amount) as daily_revenue
FROM orders
WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
  AND status NOT IN ('cancelled', 'returned')
GROUP BY DATE(order_date)
ORDER BY order_day DESC;
```

### Q1.2: Top 10 Products by Revenue

**Task:** Find the top 10 products by total revenue.

```sql
-- SOLUTION:
SELECT
    p.product_id,
    p.name,
    p.category,
    SUM(oi.quantity) as units_sold,
    SUM(oi.quantity * oi.unit_price * (1 - oi.discount_percent/100)) as revenue
FROM products p
JOIN order_items oi ON p.product_id = oi.product_id
JOIN orders o ON oi.order_id = o.order_id
WHERE o.status NOT IN ('cancelled', 'returned')
GROUP BY p.product_id, p.name, p.category
ORDER BY revenue DESC
LIMIT 10;
```

### Q1.3: Customer Count by Country

**Task:** How many customers from each country? Show countries with 10+ customers.

```sql
-- SOLUTION:
SELECT
    country,
    COUNT(*) as customer_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM customers
GROUP BY country
HAVING COUNT(*) >= 10
ORDER BY customer_count DESC;
```

---

## Level 2: Intermediate Analysis

### Q2.1: Month-over-Month Growth

**Task:** Calculate MoM revenue growth rate.

```sql
-- SOLUTION:
WITH monthly_revenue AS (
    SELECT
        DATE_TRUNC('month', order_date) as month,
        SUM(total_amount) as revenue
    FROM orders
    WHERE status NOT IN ('cancelled', 'returned')
    GROUP BY DATE_TRUNC('month', order_date)
)
SELECT
    month,
    revenue as current_month_revenue,
    LAG(revenue) OVER (ORDER BY month) as previous_month_revenue,
    ROUND(
        (revenue - LAG(revenue) OVER (ORDER BY month)) * 100.0 /
        NULLIF(LAG(revenue) OVER (ORDER BY month), 0),
        2
    ) as mom_growth_percent
FROM monthly_revenue
ORDER BY month DESC;
```

### Q2.2: Customer Lifetime Value (CLV)

**Task:** Calculate total CLV and average order value for each customer segment.

```sql
-- SOLUTION:
SELECT
    c.customer_segment,
    COUNT(DISTINCT c.customer_id) as customer_count,
    COUNT(o.order_id) as total_orders,
    SUM(o.total_amount) as total_revenue,
    ROUND(SUM(o.total_amount) / COUNT(DISTINCT c.customer_id), 2) as avg_clv,
    ROUND(SUM(o.total_amount) / NULLIF(COUNT(o.order_id), 0), 2) as avg_order_value
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
    AND o.status NOT IN ('cancelled', 'returned')
GROUP BY c.customer_segment
ORDER BY total_revenue DESC;
```

### Q2.3: Product Affinity (Frequently Bought Together)

**Task:** Find products that are frequently purchased together.

```sql
-- SOLUTION:
WITH order_pairs AS (
    SELECT
        a.product_id as product_a,
        b.product_id as product_b,
        COUNT(DISTINCT a.order_id) as times_bought_together
    FROM order_items a
    JOIN order_items b ON a.order_id = b.order_id
        AND a.product_id < b.product_id  -- Avoid duplicates
    GROUP BY a.product_id, b.product_id
    HAVING COUNT(DISTINCT a.order_id) >= 5
)
SELECT
    pa.name as product_a_name,
    pb.name as product_b_name,
    op.times_bought_together
FROM order_pairs op
JOIN products pa ON op.product_a = pa.product_id
JOIN products pb ON op.product_b = pb.product_id
ORDER BY times_bought_together DESC
LIMIT 20;
```

---

## Level 3: Advanced Analytics

### Q3.1: Cohort Retention Analysis

**Task:** Monthly cohort retention (what % of customers return each month after signup).

```sql
-- SOLUTION:
WITH customer_cohorts AS (
    SELECT
        customer_id,
        DATE_TRUNC('month', registration_date) as cohort_month
    FROM customers
),
customer_orders AS (
    SELECT
        o.customer_id,
        DATE_TRUNC('month', o.order_date) as order_month
    FROM orders o
    WHERE o.status NOT IN ('cancelled', 'returned')
),
cohort_data AS (
    SELECT
        cc.cohort_month,
        co.order_month,
        COUNT(DISTINCT cc.customer_id) as customers
    FROM customer_cohorts cc
    JOIN customer_orders co ON cc.customer_id = co.customer_id
    GROUP BY cc.cohort_month, co.order_month
),
cohort_size AS (
    SELECT cohort_month, COUNT(*) as total_customers
    FROM customer_cohorts
    GROUP BY cohort_month
)
SELECT
    cd.cohort_month,
    EXTRACT(MONTH FROM AGE(cd.order_month, cd.cohort_month)) as months_since_signup,
    cd.customers as active_customers,
    cs.total_customers,
    ROUND(cd.customers * 100.0 / cs.total_customers, 2) as retention_percent
FROM cohort_data cd
JOIN cohort_size cs ON cd.cohort_month = cs.cohort_month
WHERE cd.order_month >= cd.cohort_month
ORDER BY cd.cohort_month, months_since_signup;
```

### Q3.2: Conversion Funnel Analysis

**Task:** Calculate conversion rates through the purchase funnel.

```sql
-- SOLUTION:
WITH funnel AS (
    SELECT
        session_id,
        MAX(CASE WHEN page_type = 'home' THEN 1 ELSE 0 END) as visited_home,
        MAX(CASE WHEN page_type = 'category' THEN 1 ELSE 0 END) as visited_category,
        MAX(CASE WHEN page_type = 'product' THEN 1 ELSE 0 END) as visited_product,
        MAX(CASE WHEN page_type = 'cart' THEN 1 ELSE 0 END) as visited_cart,
        MAX(CASE WHEN page_type = 'checkout' THEN 1 ELSE 0 END) as visited_checkout,
        MAX(CASE WHEN page_type = 'thankyou' THEN 1 ELSE 0 END) as completed_purchase
    FROM page_views
    WHERE viewed_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY session_id
)
SELECT
    'Total Sessions' as stage,
    COUNT(*) as sessions,
    100.0 as conversion_pct
FROM funnel

UNION ALL

SELECT 'Viewed Product', SUM(visited_product),
       ROUND(SUM(visited_product) * 100.0 / COUNT(*), 2)
FROM funnel

UNION ALL

SELECT 'Added to Cart', SUM(visited_cart),
       ROUND(SUM(visited_cart) * 100.0 / COUNT(*), 2)
FROM funnel

UNION ALL

SELECT 'Started Checkout', SUM(visited_checkout),
       ROUND(SUM(visited_checkout) * 100.0 / COUNT(*), 2)
FROM funnel

UNION ALL

SELECT 'Completed Purchase', SUM(completed_purchase),
       ROUND(SUM(completed_purchase) * 100.0 / COUNT(*), 2)
FROM funnel;
```

### Q3.3: RFM Segmentation

**Task:** Segment customers by Recency, Frequency, Monetary value.

```sql
-- SOLUTION:
WITH rfm_raw AS (
    SELECT
        c.customer_id,
        c.name,
        -- Recency: Days since last order
        CURRENT_DATE - MAX(DATE(o.order_date)) as recency_days,
        -- Frequency: Number of orders
        COUNT(o.order_id) as frequency,
        -- Monetary: Total spend
        SUM(o.total_amount) as monetary
    FROM customers c
    LEFT JOIN orders o ON c.customer_id = o.customer_id
        AND o.status NOT IN ('cancelled', 'returned')
    GROUP BY c.customer_id, c.name
),
rfm_scores AS (
    SELECT
        customer_id,
        name,
        recency_days,
        frequency,
        monetary,
        -- Score 1-5 (5 is best)
        NTILE(5) OVER (ORDER BY recency_days DESC) as r_score,  -- Lower recency = higher score
        NTILE(5) OVER (ORDER BY frequency) as f_score,
        NTILE(5) OVER (ORDER BY monetary) as m_score
    FROM rfm_raw
    WHERE frequency > 0  -- Exclude customers with no orders
)
SELECT
    customer_id,
    name,
    recency_days,
    frequency,
    monetary,
    r_score,
    f_score,
    m_score,
    CONCAT(r_score, f_score, m_score) as rfm_segment,
    CASE
        WHEN r_score >= 4 AND f_score >= 4 AND m_score >= 4 THEN 'Champions'
        WHEN r_score >= 3 AND f_score >= 3 AND m_score >= 3 THEN 'Loyal Customers'
        WHEN r_score >= 4 AND f_score <= 2 THEN 'New Customers'
        WHEN r_score <= 2 AND f_score >= 3 THEN 'At Risk'
        WHEN r_score <= 2 AND f_score <= 2 THEN 'Lost'
        ELSE 'Potential'
    END as customer_segment
FROM rfm_scores
ORDER BY monetary DESC;
```

---

# PROJECT 2: HR Analytics

## 🏢 Business Context

You're analyzing HR data to help with:

- Salary benchmarking
- Attrition prediction
- Performance analysis
- Diversity reporting



🔬 **Section Challenge — 🏢 Business Context**

**Challenge 1 (Reasoning):** The salary benchmarking query uses `NTILE(4) OVER (PARTITION BY department ORDER BY salary)` to assign quartiles. Why can NTILE give misleading results when departments have very few employees (e.g., 3 people in 4 quartiles)?
<details><summary>Answer</summary>

`NTILE(4)` divides rows into *exactly* 4 buckets as evenly as possible. With 3 employees, you get buckets of size 1, 1, 1, 0 — one quartile is empty, and the "top 25%" is just 1 person. This makes percentile comparisons meaningless for small groups. **Fix**: use `PERCENT_RANK()` or `CUME_DIST()` instead, which compute actual percentile positions regardless of group size. Alternatively, only compute quartiles for departments with ≥ 20 employees (statistical minimum for meaningful distribution analysis). This is why real HR analytics platforms use `PERCENT_RANK` for salary benchmarking, not `NTILE`.
</details>


## 📊 Schema Setup

```sql
CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    budget DECIMAL(12,2),
    manager_id INT
);

CREATE TABLE employees (
    employee_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE,
    hire_date DATE NOT NULL,
    job_title VARCHAR(100),
    department_id INT REFERENCES departments(department_id),
    manager_id INT REFERENCES employees(employee_id),
    salary DECIMAL(10,2),
    employment_status VARCHAR(20), -- 'active', 'resigned', 'terminated'
    termination_date DATE
);

CREATE TABLE performance_reviews (
    review_id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(employee_id),
    review_date DATE NOT NULL,
    reviewer_id INT REFERENCES employees(employee_id),
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comments TEXT
);

CREATE TABLE salary_history (
    history_id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(employee_id),
    effective_date DATE NOT NULL,
    salary DECIMAL(10,2) NOT NULL,
    change_reason VARCHAR(50) -- 'hire', 'promotion', 'annual', 'market_adjustment'
);
```

---

## HR Analytics Questions

### Q1: Salary Analysis by Department

```sql
-- Find avg, min, max salary by department with headcount
SELECT
    d.name as department,
    COUNT(e.employee_id) as headcount,
    ROUND(AVG(e.salary), 2) as avg_salary,
    MIN(e.salary) as min_salary,
    MAX(e.salary) as max_salary,
    ROUND(STDDEV(e.salary), 2) as salary_stddev
FROM departments d
LEFT JOIN employees e ON d.department_id = e.department_id
    AND e.employment_status = 'active'
GROUP BY d.department_id, d.name
ORDER BY avg_salary DESC;
```

### Q2: Employee Tenure Distribution

```sql
-- How long do employees stay?
SELECT
    CASE
        WHEN tenure_months < 6 THEN '0-6 months'
        WHEN tenure_months < 12 THEN '6-12 months'
        WHEN tenure_months < 24 THEN '1-2 years'
        WHEN tenure_months < 36 THEN '2-3 years'
        WHEN tenure_months < 60 THEN '3-5 years'
        ELSE '5+ years'
    END as tenure_bucket,
    COUNT(*) as employee_count,
    ROUND(AVG(salary), 2) as avg_salary
FROM (
    SELECT
        employee_id,
        salary,
        EXTRACT(MONTH FROM AGE(
            COALESCE(termination_date, CURRENT_DATE),
            hire_date
        )) as tenure_months
    FROM employees
) tenure_calc
GROUP BY 1
ORDER BY MIN(tenure_months);
```

### Q3: Attrition Rate by Department

```sql
-- Calculate monthly attrition rate
WITH monthly_stats AS (
    SELECT
        d.name as department,
        DATE_TRUNC('month', e.termination_date) as month,
        COUNT(*) as terminations
    FROM employees e
    JOIN departments d ON e.department_id = d.department_id
    WHERE e.termination_date IS NOT NULL
    GROUP BY d.name, DATE_TRUNC('month', e.termination_date)
),
monthly_headcount AS (
    SELECT
        d.name as department,
        DATE_TRUNC('month', m.month) as month,
        COUNT(DISTINCT e.employee_id) as active_employees
    FROM departments d
    CROSS JOIN generate_series(
        '2023-01-01'::date,
        CURRENT_DATE,
        '1 month'::interval
    ) m(month)
    LEFT JOIN employees e ON d.department_id = e.department_id
        AND e.hire_date <= m.month
        AND (e.termination_date IS NULL OR e.termination_date > m.month)
    GROUP BY d.name, DATE_TRUNC('month', m.month)
)
SELECT
    mh.department,
    mh.month,
    mh.active_employees,
    COALESCE(ms.terminations, 0) as terminations,
    ROUND(COALESCE(ms.terminations, 0) * 100.0 / NULLIF(mh.active_employees, 0), 2) as attrition_rate
FROM monthly_headcount mh
LEFT JOIN monthly_stats ms ON mh.department = ms.department AND mh.month = ms.month
WHERE mh.active_employees > 0
ORDER BY mh.department, mh.month;
```

### Q4: Performance vs Salary Correlation

```sql
-- Are high performers being paid well?
WITH latest_reviews AS (
    SELECT DISTINCT ON (employee_id)
        employee_id,
        rating,
        review_date
    FROM performance_reviews
    ORDER BY employee_id, review_date DESC
)
SELECT
    lr.rating,
    COUNT(*) as employee_count,
    ROUND(AVG(e.salary), 2) as avg_salary,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY e.salary) as median_salary
FROM latest_reviews lr
JOIN employees e ON lr.employee_id = e.employee_id
WHERE e.employment_status = 'active'
GROUP BY lr.rating
ORDER BY lr.rating DESC;
```

---

# PROJECT 3: Financial Analysis

## 🏢 Business Context

You're analyzing financial transactions for:

- Fraud detection
- Cash flow analysis
- Budget vs Actual reporting
- Expense categorization



🔬 **Section Challenge — 🏢 Business Context**

**Challenge 1 (Reasoning):** For fraud detection, you flag transactions where a customer's spending is > 3 standard deviations above their average. Why is this approach dangerous with `AVG()` and `STDDEV()` window functions on raw transaction data?
<details><summary>Answer</summary>

The fraudulent transactions themselves are *included* in the AVG and STDDEV calculation, inflating both values. A single $10,000 fraud on an account with typical $50 transactions raises the average and standard deviation, making the fraud appear *less* anomalous than it actually is. **Fix**: use a *rolling* window that excludes the current row: `AVG(amount) OVER (PARTITION BY customer_id ORDER BY txn_date ROWS BETWEEN 90 PRECEDING AND 1 PRECEDING)` — this computes the baseline from historical data only. Alternatively, use `MEDIAN` (via `PERCENTILE_CONT(0.5)`) which is robust to outliers, unlike `AVG`.
</details>


## 📊 Schema Setup

```sql
CREATE TABLE accounts (
    account_id SERIAL PRIMARY KEY,
    account_number VARCHAR(20) UNIQUE,
    account_type VARCHAR(30), -- 'checking', 'savings', 'credit', 'investment'
    customer_id INT,
    opened_date DATE,
    balance DECIMAL(15,2),
    credit_limit DECIMAL(15,2), -- For credit accounts
    status VARCHAR(20) -- 'active', 'closed', 'frozen'
);

CREATE TABLE transactions (
    transaction_id SERIAL PRIMARY KEY,
    account_id INT REFERENCES accounts(account_id),
    transaction_date TIMESTAMP NOT NULL,
    transaction_type VARCHAR(20), -- 'deposit', 'withdrawal', 'transfer', 'payment', 'fee'
    amount DECIMAL(12,2) NOT NULL,
    merchant_name VARCHAR(100),
    merchant_category VARCHAR(50),
    location_city VARCHAR(50),
    location_country VARCHAR(50),
    is_flagged BOOLEAN DEFAULT false
);

CREATE TABLE budgets (
    budget_id SERIAL PRIMARY KEY,
    department VARCHAR(100),
    category VARCHAR(100),
    budget_month DATE,
    budgeted_amount DECIMAL(12,2)
);

CREATE TABLE actuals (
    actual_id SERIAL PRIMARY KEY,
    department VARCHAR(100),
    category VARCHAR(100),
    transaction_date DATE,
    actual_amount DECIMAL(12,2)
);
```

---

## Financial Analysis Questions

### Q1: Running Balance Calculation

```sql
-- Calculate running balance after each transaction
SELECT
    t.transaction_id,
    t.transaction_date,
    t.transaction_type,
    t.amount,
    CASE
        WHEN t.transaction_type IN ('deposit') THEN t.amount
        ELSE -t.amount
    END as signed_amount,
    SUM(
        CASE
            WHEN t.transaction_type IN ('deposit') THEN t.amount
            ELSE -t.amount
        END
    ) OVER (
        PARTITION BY t.account_id
        ORDER BY t.transaction_date, t.transaction_id
    ) as running_balance
FROM transactions t
WHERE t.account_id = 1
ORDER BY t.transaction_date, t.transaction_id;
```

### Q2: Fraud Detection - Unusual Patterns

```sql
-- Find transactions that are 3+ standard deviations from normal
WITH account_stats AS (
    SELECT
        account_id,
        AVG(amount) as avg_amount,
        STDDEV(amount) as stddev_amount
    FROM transactions
    WHERE transaction_type = 'withdrawal'
    GROUP BY account_id
    HAVING COUNT(*) >= 10  -- Need enough data
)
SELECT
    t.transaction_id,
    t.account_id,
    t.transaction_date,
    t.amount,
    s.avg_amount,
    ROUND((t.amount - s.avg_amount) / NULLIF(s.stddev_amount, 0), 2) as z_score
FROM transactions t
JOIN account_stats s ON t.account_id = s.account_id
WHERE t.transaction_type = 'withdrawal'
  AND t.amount > s.avg_amount + (3 * s.stddev_amount)
ORDER BY z_score DESC;
```

### Q3: Velocity Check - Rapid Transactions

```sql
-- Find accounts with 5+ transactions in 1 hour (potential fraud)
SELECT
    account_id,
    DATE_TRUNC('hour', transaction_date) as hour_window,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    ARRAY_AGG(DISTINCT location_city) as locations
FROM transactions
WHERE transaction_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY account_id, DATE_TRUNC('hour', transaction_date)
HAVING COUNT(*) >= 5
ORDER BY transaction_count DESC;
```

### Q4: Budget vs Actual Variance

```sql
-- Compare budgeted vs actual spending
WITH monthly_actuals AS (
    SELECT
        department,
        category,
        DATE_TRUNC('month', transaction_date) as month,
        SUM(actual_amount) as total_actual
    FROM actuals
    GROUP BY department, category, DATE_TRUNC('month', transaction_date)
)
SELECT
    b.department,
    b.category,
    b.budget_month,
    b.budgeted_amount,
    COALESCE(ma.total_actual, 0) as actual_amount,
    b.budgeted_amount - COALESCE(ma.total_actual, 0) as variance,
    ROUND(
        (COALESCE(ma.total_actual, 0) / NULLIF(b.budgeted_amount, 0)) * 100,
        2
    ) as utilization_percent,
    CASE
        WHEN ma.total_actual > b.budgeted_amount * 1.1 THEN 'Over Budget'
        WHEN ma.total_actual < b.budgeted_amount * 0.8 THEN 'Under Budget'
        ELSE 'On Track'
    END as status
FROM budgets b
LEFT JOIN monthly_actuals ma
    ON b.department = ma.department
    AND b.category = ma.category
    AND b.budget_month = ma.month
ORDER BY b.department, b.category, b.budget_month;
```

