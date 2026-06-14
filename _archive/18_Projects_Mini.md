> **SQL Chapter 18/20** | [← Previous](17_Practice_100_Problems.md) | [Index](../00_MASTER_INDEX.md) | [Next →](19_Interview_Top50.md)

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

---

# ═══════════════════════════════════════════════════════════════════

# MERGED FROM: 04_SQL_Practice_Projects.md (WHY-HOW Framework Edition)

# ═══════════════════════════════════════════════════════════════════

# 🎯 SQL Practice Projects & Interview Questions

> Build real skills through project-based learning. Each project simulates actual data analyst work.

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

---

# PROJECT 4: Interview-Style Challenges

## Challenge 1: Second Highest Salary

```sql
-- Multiple solutions:

-- Solution 1: OFFSET
SELECT DISTINCT salary
FROM employees
ORDER BY salary DESC
LIMIT 1 OFFSET 1;

-- Solution 2: Subquery
SELECT MAX(salary)
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);

-- Solution 3: DENSE_RANK (handles ties)
WITH ranked AS (
    SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) as rank
    FROM employees
)
SELECT DISTINCT salary FROM ranked WHERE rank = 2;
```

## Challenge 2: Employees Earning More Than Their Manager

```sql
SELECT
    e.employee_id,
    e.first_name || ' ' || e.last_name as employee_name,
    e.salary as employee_salary,
    m.first_name || ' ' || m.last_name as manager_name,
    m.salary as manager_salary
FROM employees e
JOIN employees m ON e.manager_id = m.employee_id
WHERE e.salary > m.salary;
```

## Challenge 3: Consecutive Login Days

```sql
-- Find users with 3+ consecutive login days
WITH login_days AS (
    SELECT DISTINCT
        user_id,
        DATE(login_time) as login_date
    FROM user_logins
),
with_groups AS (
    SELECT
        user_id,
        login_date,
        login_date - INTERVAL '1 day' * ROW_NUMBER() OVER (
            PARTITION BY user_id ORDER BY login_date
        ) as grp
    FROM login_days
)
SELECT
    user_id,
    MIN(login_date) as streak_start,
    MAX(login_date) as streak_end,
    COUNT(*) as consecutive_days
FROM with_groups
GROUP BY user_id, grp
HAVING COUNT(*) >= 3
ORDER BY consecutive_days DESC;
```

## Challenge 4: Median (Without Built-in Function)

```sql
-- Calculate median salary
WITH ordered AS (
    SELECT
        salary,
        ROW_NUMBER() OVER (ORDER BY salary) as row_num,
        COUNT(*) OVER () as total_count
    FROM employees
    WHERE salary IS NOT NULL
)
SELECT AVG(salary) as median_salary
FROM ordered
WHERE row_num IN (
    (total_count + 1) / 2,
    (total_count + 2) / 2
);
```

## Challenge 5: Department with Highest Average Salary

```sql
-- Without using LIMIT
SELECT department_id, avg_salary
FROM (
    SELECT
        department_id,
        AVG(salary) as avg_salary,
        RANK() OVER (ORDER BY AVG(salary) DESC) as rnk
    FROM employees
    GROUP BY department_id
) ranked
WHERE rnk = 1;
```

## Challenge 6: Pivoting Data

```sql
-- Convert rows to columns (sales by quarter)
SELECT
    product_id,
    SUM(CASE WHEN quarter = 'Q1' THEN sales ELSE 0 END) as Q1,
    SUM(CASE WHEN quarter = 'Q2' THEN sales ELSE 0 END) as Q2,
    SUM(CASE WHEN quarter = 'Q3' THEN sales ELSE 0 END) as Q3,
    SUM(CASE WHEN quarter = 'Q4' THEN sales ELSE 0 END) as Q4,
    SUM(sales) as total
FROM quarterly_sales
GROUP BY product_id;
```

## Challenge 7: Gap Detection

```sql
-- Find missing order IDs
WITH id_range AS (
    SELECT generate_series(MIN(order_id), MAX(order_id)) as expected_id
    FROM orders
)
SELECT expected_id as missing_order_id
FROM id_range
WHERE expected_id NOT IN (SELECT order_id FROM orders);
```

## Challenge 8: Year-over-Year Comparison

```sql
-- Compare each month to same month last year
WITH monthly_sales AS (
    SELECT
        DATE_TRUNC('month', sale_date) as month,
        SUM(amount) as total_sales
    FROM sales
    GROUP BY DATE_TRUNC('month', sale_date)
)
SELECT
    this_year.month,
    this_year.total_sales as current_year,
    last_year.total_sales as previous_year,
    this_year.total_sales - last_year.total_sales as yoy_change,
    ROUND(
        (this_year.total_sales - last_year.total_sales) * 100.0 /
        NULLIF(last_year.total_sales, 0),
        2
    ) as yoy_percent
FROM monthly_sales this_year
LEFT JOIN monthly_sales last_year
    ON this_year.month = last_year.month + INTERVAL '1 year'
WHERE this_year.month >= DATE_TRUNC('year', CURRENT_DATE)
ORDER BY this_year.month;
```

---

# 🎯 Practice Tips

## How to Practice Effectively

1. **Type it yourself** - Don't copy-paste. Muscle memory matters.
2. **Predict results** - Before running, guess what you'll get.
3. **Break down complex queries** - Use CTEs to think step by step.
4. **Explain your approach** - Practice talking through your logic.

## Practice Platforms

- **HackerRank SQL** - Good for basics
- **LeetCode Database** - Interview-style questions
- **StrataScratch** - Real company interview questions
- **SQLZoo** - Interactive tutorials
- **Mode Analytics SQL Tutorial** - Free with real datasets

## Self-Assessment Checklist

```
□ Can write JOINs without looking up syntax
□ Can use GROUP BY with HAVING confidently
□ Understand when to use subquery vs JOIN vs CTE
□ Can write window functions (ROW_NUMBER, LAG, SUM OVER)
□ Can solve problems multiple ways
□ Can optimize slow queries (know when to check EXPLAIN)
□ Can handle NULL values correctly
□ Can pivot/unpivot data
□ Can calculate running totals and moving averages
□ Can detect gaps and islands in data
```

---

_Practice consistently. Aim for 2-3 problems daily. Review solutions even for problems you solved._

---

# 📊 PART 5: DATA ANALYTICS & ENGINEERING ESSENTIALS

> Everything you need to master SQL for Data Analytics and Data Engineering roles

---

## 🔵 WHY Data Engineers Need SQL Mastery

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DATA ENGINEERING SQL REQUIREMENTS                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Data Engineers deal with:                                                      │
│  • VOLUME: Billions of rows daily                                               │
│  • VELOCITY: Real-time data streams                                             │
│  • VARIETY: Multiple sources, formats                                           │
│  • VERACITY: Data quality issues everywhere                                     │
│                                                                                  │
│  Key SQL Skills Required:                                                       │
│  1. Bulk Data Operations - INSERT millions efficiently                         │
│  2. ETL Transformations - Clean, transform, load                               │
│  3. Query Optimization - Make queries 100x faster                             │
│  4. Window Functions - Analytics without aggregation loss                      │
│  5. CTEs & Recursive Queries - Complex data hierarchies                       │
│  6. Data Quality Checks - Validate before insert                              │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# SECTION 1: BULK DATA OPERATIONS

## 🔵 WHY Bulk Operations Matter

```
Single INSERT: 1 million rows = 1 million round trips = 30+ minutes
Bulk INSERT: 1 million rows = 1 operation = 10 seconds

That's 180x faster!
```

## 1.1 Bulk INSERT Techniques

### Method 1: Multi-Value INSERT

```sql
-- SLOW: One insert per row
INSERT INTO products VALUES (1, 'Item A', 10.00);
INSERT INTO products VALUES (2, 'Item B', 20.00);
INSERT INTO products VALUES (3, 'Item C', 30.00);

-- FAST: Multi-value insert (100x faster)
INSERT INTO products (id, name, price) VALUES
(1, 'Item A', 10.00),
(2, 'Item B', 20.00),
(3, 'Item C', 30.00),
(4, 'Item D', 40.00),
(5, 'Item E', 50.00);
-- Can include up to 1000 rows per statement
```

### Method 2: INSERT...SELECT (Data Migration)

```sql
-- Copy data between tables
INSERT INTO products_archive (id, name, price, archived_date)
SELECT id, name, price, CURRENT_TIMESTAMP
FROM products
WHERE created_at < '2023-01-01';

-- Transform while inserting
INSERT INTO daily_sales_summary (sale_date, total_revenue, order_count, avg_order_value)
SELECT
    DATE(order_date) as sale_date,
    SUM(total_amount) as total_revenue,
    COUNT(*) as order_count,
    AVG(total_amount) as avg_order_value
FROM orders
WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(order_date);
```

### Method 3: COPY Command (PostgreSQL - Fastest)

```sql
-- Import from CSV (FASTEST method - 10 million rows in seconds)
COPY products (id, name, category, price)
FROM '/data/products.csv'
WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- Export to CSV
COPY (SELECT * FROM products WHERE category = 'Electronics')
TO '/exports/electronics.csv'
WITH (FORMAT csv, HEADER true);

-- From stdin (for programmatic loading)
COPY products FROM STDIN WITH (FORMAT csv);
```

### Method 4: BULK INSERT (SQL Server)

```sql
-- SQL Server specific
BULK INSERT products
FROM 'C:\data\products.csv'
WITH (
    FIELDTERMINATOR = ',',
    ROWTERMINATOR = '\n',
    FIRSTROW = 2,  -- Skip header
    BATCHSIZE = 50000,
    TABLOCK
);
```

### Method 5: Generate Test Data

```sql
-- PostgreSQL: Generate 1 million rows
INSERT INTO test_data (id, random_value, created_at)
SELECT
    generate_series(1, 1000000) as id,
    random() * 10000 as random_value,
    TIMESTAMP '2020-01-01' + random() * (TIMESTAMP '2024-12-31' - TIMESTAMP '2020-01-01') as created_at;

-- Generate random names
INSERT INTO customers (name, email, signup_date)
SELECT
    'Customer_' || i as name,
    'customer' || i || '@example.com' as email,
    CURRENT_DATE - (random() * 365)::int as signup_date
FROM generate_series(1, 100000) as i;
```

---

## 1.2 Bulk UPDATE Operations

### Update with JOINs

```sql
-- Update prices based on another table
UPDATE products p
SET price = p.price * (1 + pc.markup_percentage/100)
FROM product_categories pc
WHERE p.category_id = pc.id
  AND pc.category_name = 'Electronics';

-- SQL Server syntax
UPDATE p
SET p.price = p.price * 1.10
FROM products p
INNER JOIN product_categories pc ON p.category_id = pc.id
WHERE pc.category_name = 'Electronics';
```

### Conditional Bulk Update (CASE)

```sql
-- Update multiple conditions in single query
UPDATE products
SET status = CASE
    WHEN stock_quantity = 0 THEN 'out_of_stock'
    WHEN stock_quantity < 10 THEN 'low_stock'
    WHEN stock_quantity < 50 THEN 'medium_stock'
    ELSE 'in_stock'
END,
updated_at = CURRENT_TIMESTAMP;
```

### Update with Subquery

```sql
-- Update based on aggregated data
UPDATE products p
SET total_sold = (
    SELECT COALESCE(SUM(quantity), 0)
    FROM order_items oi
    WHERE oi.product_id = p.id
);
```

---

## 1.3 Bulk DELETE Operations

### Delete with JOIN

```sql
-- Delete orders from inactive customers
DELETE FROM orders o
USING customers c
WHERE o.customer_id = c.id
  AND c.status = 'inactive'
  AND c.last_activity < CURRENT_DATE - INTERVAL '2 years';
```

### Delete in Batches (Prevent Lock Issues)

```sql
-- Delete million rows in 10k batches to avoid locking
DO $$
DECLARE
    rows_deleted INT;
BEGIN
    LOOP
        DELETE FROM old_logs
        WHERE id IN (
            SELECT id FROM old_logs
            WHERE created_at < '2020-01-01'
            LIMIT 10000
        );

        GET DIAGNOSTICS rows_deleted = ROW_COUNT;

        IF rows_deleted = 0 THEN
            EXIT;
        END IF;

        COMMIT;
        PERFORM pg_sleep(0.1);  -- Small pause
    END LOOP;
END $$;
```

### TRUNCATE vs DELETE

```sql
-- DELETE: Logs each row, can be rolled back, triggers fire
DELETE FROM large_table;  -- SLOW for millions of rows

-- TRUNCATE: Instant, minimal logging, cannot filter
TRUNCATE TABLE large_table;  -- FAST
TRUNCATE TABLE large_table RESTART IDENTITY CASCADE;  -- Reset sequences, cascade
```

---

# SECTION 2: ETL TRANSFORMATIONS IN SQL

## 🔵 WHY: ETL = Extract, Transform, Load

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    ETL DATA PIPELINE                                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  RAW DATA ──────> STAGING ──────> CLEANED ──────> DATA WAREHOUSE                │
│  (messy)          (as-is)        (validated)     (analytics-ready)              │
│                                                                                  │
│  Source Systems:    Landing Zone:    Cleaning:        Final Tables:             │
│  • CSV files        • raw_sales      • Handle NULLs   • fact_sales              │
│  • APIs             • raw_users      • Fix types      • dim_customers           │
│  • Databases        • raw_products   • Deduplicate    • dim_products            │
│                                      • Validate       • dim_date                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 2.1 Data Cleaning Transformations

### Handle NULL Values

```sql
-- Replace NULLs with defaults
SELECT
    id,
    COALESCE(name, 'Unknown') as name,
    COALESCE(email, 'no-email@default.com') as email,
    COALESCE(phone, 'N/A') as phone,
    COALESCE(country, (SELECT mode() WITHIN GROUP (ORDER BY country) FROM customers)) as country
FROM raw_customers;

-- NULLIF: Convert empty strings to NULL
SELECT
    NULLIF(TRIM(name), '') as name,  -- '' becomes NULL
    NULLIF(phone, '000-000-0000') as phone  -- Placeholder becomes NULL
FROM raw_data;
```

### Data Type Conversions

```sql
-- Safe casting with error handling
SELECT
    id,
    CASE
        WHEN raw_price ~ '^[0-9]+\.?[0-9]*$' THEN raw_price::DECIMAL(10,2)
        ELSE 0.00
    END as price,
    CASE
        WHEN raw_date ~ '^\d{4}-\d{2}-\d{2}$' THEN raw_date::DATE
        ELSE NULL
    END as order_date,
    CASE
        WHEN raw_quantity ~ '^[0-9]+$' THEN raw_quantity::INT
        ELSE 0
    END as quantity
FROM raw_orders;
```

### String Cleaning

```sql
SELECT
    -- Remove leading/trailing spaces
    TRIM(name) as name,

    -- Standardize case
    UPPER(country_code) as country_code,
    INITCAP(city) as city,  -- 'new york' -> 'New York'
    LOWER(email) as email,

    -- Remove special characters
    REGEXP_REPLACE(phone, '[^0-9]', '', 'g') as phone_digits,

    -- Extract parts
    SPLIT_PART(email, '@', 2) as email_domain,
    SUBSTRING(order_id FROM 1 FOR 3) as order_prefix,

    -- Replace patterns
    REPLACE(description, '  ', ' ') as description,  -- Double space to single
    REGEXP_REPLACE(text, '\s+', ' ', 'g') as normalized_text  -- Any whitespace to single space
FROM raw_data;
```

### Date Transformations

```sql
SELECT
    -- Parse various date formats
    TO_DATE(date_str, 'MM/DD/YYYY') as date_us,
    TO_DATE(date_str, 'DD-Mon-YYYY') as date_uk,
    TO_TIMESTAMP(datetime_str, 'YYYY-MM-DD HH24:MI:SS') as datetime,

    -- Extract components
    EXTRACT(YEAR FROM order_date) as year,
    EXTRACT(MONTH FROM order_date) as month,
    EXTRACT(DOW FROM order_date) as day_of_week,  -- 0=Sunday
    EXTRACT(QUARTER FROM order_date) as quarter,

    -- Date arithmetic
    order_date + INTERVAL '30 days' as due_date,
    AGE(CURRENT_DATE, birth_date) as age,
    DATE_TRUNC('month', order_date) as month_start,

    -- Fiscal year (if fiscal year starts April)
    CASE
        WHEN EXTRACT(MONTH FROM order_date) >= 4
        THEN EXTRACT(YEAR FROM order_date)
        ELSE EXTRACT(YEAR FROM order_date) - 1
    END as fiscal_year
FROM orders;
```

## 2.2 Deduplication Strategies

### Find Duplicates

```sql
-- Identify duplicate records
SELECT email, COUNT(*) as count
FROM customers
GROUP BY email
HAVING COUNT(*) > 1;

-- See all duplicate rows with details
WITH duplicates AS (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
    FROM customers
)
SELECT * FROM duplicates WHERE rn > 1;
```

### Remove Duplicates

```sql
-- Method 1: Keep latest record using CTE
WITH ranked AS (
    SELECT *,
           ROW_NUMBER() OVER (
               PARTITION BY email
               ORDER BY created_at DESC
           ) as rn
    FROM customers
)
DELETE FROM customers
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Method 2: Using DISTINCT ON (PostgreSQL)
INSERT INTO clean_customers
SELECT DISTINCT ON (email) *
FROM raw_customers
ORDER BY email, created_at DESC;

-- Method 3: Create new table (safest for large data)
CREATE TABLE customers_clean AS
SELECT * FROM (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY email ORDER BY id) as rn
    FROM customers
) t WHERE rn = 1;
```

## 2.3 Data Validation Queries

```sql
-- Comprehensive data quality check
SELECT
    'Total Rows' as check_name, COUNT(*)::TEXT as result FROM customers
UNION ALL
SELECT 'NULL Emails', COUNT(*)::TEXT FROM customers WHERE email IS NULL
UNION ALL
SELECT 'Invalid Emails', COUNT(*)::TEXT FROM customers
    WHERE email NOT LIKE '%@%.%'
UNION ALL
SELECT 'Duplicate Emails', COUNT(*)::TEXT FROM (
    SELECT email FROM customers GROUP BY email HAVING COUNT(*) > 1
) d
UNION ALL
SELECT 'Future Dates', COUNT(*)::TEXT FROM customers
    WHERE registration_date > CURRENT_DATE
UNION ALL
SELECT 'Negative Values', COUNT(*)::TEXT FROM orders
    WHERE total_amount < 0;
```

---

# SECTION 3: ADVANCED ANALYTICS QUERIES

## 3.1 Cohort Analysis

```sql
-- Customer cohort retention analysis
WITH cohort AS (
    SELECT
        customer_id,
        DATE_TRUNC('month', MIN(order_date)) as cohort_month
    FROM orders
    GROUP BY customer_id
),
activities AS (
    SELECT
        o.customer_id,
        c.cohort_month,
        DATE_TRUNC('month', o.order_date) as activity_month
    FROM orders o
    JOIN cohort c ON o.customer_id = c.customer_id
)
SELECT
    cohort_month,
    activity_month,
    (EXTRACT(YEAR FROM activity_month) - EXTRACT(YEAR FROM cohort_month)) * 12 +
    (EXTRACT(MONTH FROM activity_month) - EXTRACT(MONTH FROM cohort_month)) as months_since_first,
    COUNT(DISTINCT customer_id) as customers
FROM activities
GROUP BY cohort_month, activity_month
ORDER BY cohort_month, months_since_first;
```

## 3.2 Funnel Analysis

```sql
-- E-commerce conversion funnel
WITH funnel AS (
    SELECT
        session_id,
        MAX(CASE WHEN page_type = 'home' THEN 1 ELSE 0 END) as visited_home,
        MAX(CASE WHEN page_type = 'product' THEN 1 ELSE 0 END) as viewed_product,
        MAX(CASE WHEN page_type = 'cart' THEN 1 ELSE 0 END) as added_to_cart,
        MAX(CASE WHEN page_type = 'checkout' THEN 1 ELSE 0 END) as started_checkout,
        MAX(CASE WHEN page_type = 'thankyou' THEN 1 ELSE 0 END) as completed_purchase
    FROM page_views
    WHERE viewed_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY session_id
)
SELECT
    SUM(visited_home) as step1_home,
    SUM(viewed_product) as step2_product,
    SUM(added_to_cart) as step3_cart,
    SUM(started_checkout) as step4_checkout,
    SUM(completed_purchase) as step5_purchase,
    ROUND(SUM(viewed_product)::DECIMAL / NULLIF(SUM(visited_home), 0) * 100, 2) as home_to_product_pct,
    ROUND(SUM(added_to_cart)::DECIMAL / NULLIF(SUM(viewed_product), 0) * 100, 2) as product_to_cart_pct,
    ROUND(SUM(started_checkout)::DECIMAL / NULLIF(SUM(added_to_cart), 0) * 100, 2) as cart_to_checkout_pct,
    ROUND(SUM(completed_purchase)::DECIMAL / NULLIF(SUM(started_checkout), 0) * 100, 2) as checkout_to_purchase_pct
FROM funnel;
```

## 3.3 RFM Analysis (Recency, Frequency, Monetary)

```sql
-- Customer segmentation using RFM
WITH rfm_calc AS (
    SELECT
        customer_id,
        CURRENT_DATE - MAX(order_date)::DATE as recency_days,
        COUNT(*) as frequency,
        SUM(total_amount) as monetary
    FROM orders
    WHERE status = 'completed'
    GROUP BY customer_id
),
rfm_scores AS (
    SELECT
        customer_id,
        recency_days,
        frequency,
        monetary,
        NTILE(5) OVER (ORDER BY recency_days DESC) as r_score,  -- Lower recency = higher score
        NTILE(5) OVER (ORDER BY frequency) as f_score,
        NTILE(5) OVER (ORDER BY monetary) as m_score
    FROM rfm_calc
)
SELECT
    customer_id,
    r_score, f_score, m_score,
    r_score + f_score + m_score as rfm_total,
    CASE
        WHEN r_score >= 4 AND f_score >= 4 AND m_score >= 4 THEN 'Champions'
        WHEN r_score >= 4 AND f_score >= 3 THEN 'Loyal Customers'
        WHEN r_score >= 3 AND f_score <= 2 THEN 'Potential Loyalists'
        WHEN r_score <= 2 AND f_score >= 4 THEN 'At Risk'
        WHEN r_score <= 2 AND f_score <= 2 THEN 'Lost'
        ELSE 'Others'
    END as segment
FROM rfm_scores;
```

## 3.4 Moving Averages & Trends

```sql
-- 7-day and 30-day moving averages
SELECT
    sale_date,
    daily_revenue,
    AVG(daily_revenue) OVER (
        ORDER BY sale_date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) as ma_7day,
    AVG(daily_revenue) OVER (
        ORDER BY sale_date
        ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
    ) as ma_30day,
    -- Compare to previous period
    daily_revenue - LAG(daily_revenue, 7) OVER (ORDER BY sale_date) as wow_change,
    daily_revenue - LAG(daily_revenue, 30) OVER (ORDER BY sale_date) as mom_change
FROM (
    SELECT
        DATE(order_date) as sale_date,
        SUM(total_amount) as daily_revenue
    FROM orders
    GROUP BY DATE(order_date)
) daily
ORDER BY sale_date;
```

## 3.5 Customer Lifetime Value (CLV)

```sql
-- Calculate CLV with survival analysis
WITH customer_stats AS (
    SELECT
        customer_id,
        MIN(order_date) as first_order,
        MAX(order_date) as last_order,
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_order_value,
        EXTRACT(DAYS FROM MAX(order_date) - MIN(order_date)) / NULLIF(COUNT(*) - 1, 0) as avg_days_between_orders
    FROM orders
    WHERE status = 'completed'
    GROUP BY customer_id
)
SELECT
    customer_id,
    total_revenue as historical_clv,
    avg_order_value,
    CASE
        WHEN avg_days_between_orders > 0
        THEN avg_order_value * (365.0 / avg_days_between_orders) * 3  -- 3 year projection
        ELSE avg_order_value
    END as projected_clv_3yr,
    CASE
        WHEN CURRENT_DATE - last_order::DATE > 180 THEN 'Churned'
        WHEN CURRENT_DATE - last_order::DATE > 90 THEN 'At Risk'
        ELSE 'Active'
    END as status
FROM customer_stats;
```

---

# SECTION 4: WINDOW FUNCTIONS DEEP DIVE

## 4.1 Ranking Functions Comparison

```sql
-- All ranking functions side by side
SELECT
    department,
    name,
    salary,
    ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as row_num,    -- 1,2,3,4,5
    RANK() OVER (PARTITION BY department ORDER BY salary DESC) as rank,             -- 1,2,2,4,5 (gaps)
    DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) as dense_rank, -- 1,2,2,3,4 (no gaps)
    NTILE(4) OVER (PARTITION BY department ORDER BY salary DESC) as quartile,       -- Divide into 4 groups
    PERCENT_RANK() OVER (PARTITION BY department ORDER BY salary DESC) as pct_rank, -- 0 to 1
    CUME_DIST() OVER (PARTITION BY department ORDER BY salary DESC) as cume_dist    -- Cumulative distribution
FROM employees;
```

## 4.2 Value Functions

```sql
SELECT
    order_date,
    customer_id,
    total_amount,
    -- Previous and next values
    LAG(total_amount, 1, 0) OVER (PARTITION BY customer_id ORDER BY order_date) as prev_order,
    LEAD(total_amount, 1, 0) OVER (PARTITION BY customer_id ORDER BY order_date) as next_order,
    -- First and last in partition
    FIRST_VALUE(total_amount) OVER (PARTITION BY customer_id ORDER BY order_date) as first_order,
    LAST_VALUE(total_amount) OVER (
        PARTITION BY customer_id ORDER BY order_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) as last_order,
    -- Nth value
    NTH_VALUE(total_amount, 2) OVER (PARTITION BY customer_id ORDER BY order_date) as second_order
FROM orders;
```

## 4.3 Aggregate Window Functions

```sql
SELECT
    order_date,
    amount,
    -- Running totals
    SUM(amount) OVER (ORDER BY order_date) as running_total,
    SUM(amount) OVER (ORDER BY order_date ROWS UNBOUNDED PRECEDING) as running_total_explicit,

    -- Running average
    AVG(amount) OVER (ORDER BY order_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as ma_7,

    -- Running count
    COUNT(*) OVER (ORDER BY order_date) as running_count,

    -- Percentage of total
    amount / SUM(amount) OVER () * 100 as pct_of_total,

    -- Percentage within partition
    amount / SUM(amount) OVER (PARTITION BY customer_id) * 100 as pct_of_customer_total
FROM orders;
```

---

# SECTION 5: MORE INTERVIEW QUESTIONS

## Questions Set 1: Data Cleaning

```sql
-- Q1: Find and count all data quality issues in one query
SELECT
    'Missing email' as issue_type, COUNT(*) as count
    FROM users WHERE email IS NULL OR email = ''
UNION ALL
SELECT 'Invalid phone', COUNT(*)
    FROM users WHERE phone NOT SIMILAR TO '[0-9]{10}'
UNION ALL
SELECT 'Duplicate records', COUNT(*) - COUNT(DISTINCT email)
    FROM users
UNION ALL
SELECT 'Future birth dates', COUNT(*)
    FROM users WHERE birth_date > CURRENT_DATE
UNION ALL
SELECT 'Negative values', COUNT(*)
    FROM transactions WHERE amount < 0;

-- Q2: Standardize inconsistent data
UPDATE users
SET country = CASE UPPER(TRIM(country))
    WHEN 'US' THEN 'USA'
    WHEN 'U.S.' THEN 'USA'
    WHEN 'U.S.A.' THEN 'USA'
    WHEN 'UNITED STATES' THEN 'USA'
    WHEN 'AMERICA' THEN 'USA'
    WHEN 'UK' THEN 'United Kingdom'
    WHEN 'ENGLAND' THEN 'United Kingdom'
    WHEN 'BRITAIN' THEN 'United Kingdom'
    ELSE country
END;
```

## Questions Set 2: Time Series

```sql
-- Q3: Fill gaps in time series data
WITH date_range AS (
    SELECT generate_series(
        (SELECT MIN(sale_date) FROM sales),
        (SELECT MAX(sale_date) FROM sales),
        '1 day'::interval
    )::DATE as date
),
daily_sales AS (
    SELECT DATE(sale_date) as date, SUM(amount) as revenue
    FROM sales
    GROUP BY DATE(sale_date)
)
SELECT
    d.date,
    COALESCE(s.revenue, 0) as revenue,
    COALESCE(s.revenue, LAG(s.revenue) OVER (ORDER BY d.date)) as revenue_filled_forward
FROM date_range d
LEFT JOIN daily_sales s ON d.date = s.date;

-- Q4: Find consecutive days with sales above threshold
WITH daily_stats AS (
    SELECT
        sale_date,
        SUM(amount) as daily_total,
        CASE WHEN SUM(amount) > 10000 THEN 1 ELSE 0 END as above_threshold
    FROM sales
    GROUP BY sale_date
),
grouped AS (
    SELECT *,
           sale_date - (ROW_NUMBER() OVER (ORDER BY sale_date) || ' days')::INTERVAL as grp
    FROM daily_stats
    WHERE above_threshold = 1
)
SELECT
    MIN(sale_date) as streak_start,
    MAX(sale_date) as streak_end,
    COUNT(*) as consecutive_days
FROM grouped
GROUP BY grp
HAVING COUNT(*) >= 3
ORDER BY streak_start;
```

## Questions Set 3: Complex JOINs

```sql
-- Q5: Self-join to find manager hierarchy
WITH RECURSIVE org_chart AS (
    -- Base case: CEO (no manager)
    SELECT id, name, manager_id, name as path, 1 as level
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Recursive case
    SELECT e.id, e.name, e.manager_id,
           oc.path || ' -> ' || e.name,
           oc.level + 1
    FROM employees e
    JOIN org_chart oc ON e.manager_id = oc.id
)
SELECT * FROM org_chart ORDER BY path;

-- Q6: Find products never ordered together
SELECT
    p1.name as product1,
    p2.name as product2
FROM products p1
CROSS JOIN products p2
WHERE p1.id < p2.id
  AND NOT EXISTS (
      SELECT 1 FROM order_items oi1
      JOIN order_items oi2 ON oi1.order_id = oi2.order_id
      WHERE oi1.product_id = p1.id
        AND oi2.product_id = p2.id
  );
```

## Questions Set 4: Performance Optimization

```sql
-- Q7: Explain these index decisions
-- Index for: SELECT * FROM orders WHERE customer_id = ? AND order_date > ?
CREATE INDEX idx_orders_customer_date ON orders(customer_id, order_date);

-- Index for: SELECT * FROM orders WHERE status = 'pending' (only 1% are pending)
CREATE INDEX idx_orders_pending ON orders(status) WHERE status = 'pending';  -- Partial index

-- Index for: SELECT customer_id, SUM(amount) FROM orders GROUP BY customer_id
CREATE INDEX idx_orders_customer_amount ON orders(customer_id) INCLUDE (amount);  -- Covering index

-- Q8: Rewrite correlated subquery as JOIN
-- SLOW: Correlated subquery (runs for each row)
SELECT o.*
FROM orders o
WHERE o.total_amount > (
    SELECT AVG(total_amount)
    FROM orders
    WHERE customer_id = o.customer_id
);

-- FAST: Rewritten with JOIN
SELECT o.*
FROM orders o
JOIN (
    SELECT customer_id, AVG(total_amount) as avg_amount
    FROM orders
    GROUP BY customer_id
) ca ON o.customer_id = ca.customer_id
WHERE o.total_amount > ca.avg_amount;
```

---

# SECTION 6: DATA ENGINEERING SPECIFIC

## 6.1 Slowly Changing Dimensions (SCD)

```sql
-- SCD Type 2: Track historical changes
CREATE TABLE dim_customer (
    customer_key SERIAL PRIMARY KEY,
    customer_id INT,
    name VARCHAR(100),
    email VARCHAR(100),
    address TEXT,
    valid_from DATE,
    valid_to DATE,
    is_current BOOLEAN
);

-- Insert new version when customer changes
WITH changed AS (
    SELECT * FROM staging_customers s
    WHERE EXISTS (
        SELECT 1 FROM dim_customer d
        WHERE d.customer_id = s.customer_id
          AND d.is_current = true
          AND (d.name != s.name OR d.address != s.address)
    )
)
-- End old record
UPDATE dim_customer d
SET valid_to = CURRENT_DATE - 1, is_current = false
FROM changed c
WHERE d.customer_id = c.customer_id AND d.is_current = true;

-- Insert new record
INSERT INTO dim_customer (customer_id, name, email, address, valid_from, valid_to, is_current)
SELECT customer_id, name, email, address, CURRENT_DATE, '9999-12-31', true
FROM staging_customers s
WHERE EXISTS (SELECT 1 FROM changed c WHERE c.customer_id = s.customer_id);
```

## 6.2 Data Warehouse Star Schema

```sql
-- Fact table
CREATE TABLE fact_sales (
    sale_key SERIAL PRIMARY KEY,
    date_key INT REFERENCES dim_date(date_key),
    product_key INT REFERENCES dim_product(product_key),
    customer_key INT REFERENCES dim_customer(customer_key),
    store_key INT REFERENCES dim_store(store_key),
    quantity INT,
    unit_price DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    discount_amount DECIMAL(10,2)
);

-- Dimension tables
CREATE TABLE dim_date (
    date_key INT PRIMARY KEY,  -- YYYYMMDD format
    full_date DATE,
    day_of_week INT,
    day_name VARCHAR(10),
    week_of_year INT,
    month_num INT,
    month_name VARCHAR(10),
    quarter INT,
    year INT,
    is_weekend BOOLEAN,
    is_holiday BOOLEAN
);

-- Populate date dimension (10 years)
INSERT INTO dim_date
SELECT
    TO_CHAR(d, 'YYYYMMDD')::INT as date_key,
    d as full_date,
    EXTRACT(DOW FROM d) as day_of_week,
    TO_CHAR(d, 'Day') as day_name,
    EXTRACT(WEEK FROM d) as week_of_year,
    EXTRACT(MONTH FROM d) as month_num,
    TO_CHAR(d, 'Month') as month_name,
    EXTRACT(QUARTER FROM d) as quarter,
    EXTRACT(YEAR FROM d) as year,
    EXTRACT(DOW FROM d) IN (0, 6) as is_weekend,
    false as is_holiday
FROM generate_series('2020-01-01'::DATE, '2030-12-31'::DATE, '1 day') as d;
```

## 6.3 Incremental Loading

```sql
-- Load only new/changed records since last run
INSERT INTO fact_sales (date_key, product_key, customer_key, quantity, total_amount)
SELECT
    TO_CHAR(o.order_date, 'YYYYMMDD')::INT,
    dp.product_key,
    dc.customer_key,
    oi.quantity,
    oi.quantity * oi.unit_price
FROM staging_orders o
JOIN staging_order_items oi ON o.order_id = oi.order_id
JOIN dim_product dp ON oi.product_id = dp.product_id
JOIN dim_customer dc ON o.customer_id = dc.customer_id AND dc.is_current = true
WHERE o.updated_at > (SELECT COALESCE(MAX(load_timestamp), '1900-01-01') FROM etl_log WHERE table_name = 'fact_sales')
ON CONFLICT (order_id, product_id)
DO UPDATE SET
    quantity = EXCLUDED.quantity,
    total_amount = EXCLUDED.total_amount;

-- Track ETL runs
INSERT INTO etl_log (table_name, rows_loaded, load_timestamp)
VALUES ('fact_sales', @@ROWCOUNT, CURRENT_TIMESTAMP);
```

---

# 📋 SQL Data Engineering Checklist

```
□ Can write efficient bulk INSERT/UPDATE/DELETE
□ Understand COPY vs INSERT performance difference
□ Can build ETL transformations in pure SQL
□ Know all window function types (RANK, LAG, SUM OVER)
□ Can implement SCD Type 1 and Type 2
□ Understand star schema design
□ Can perform incremental loads
□ Know when to use indexes and which type
□ Can optimize slow queries using EXPLAIN
□ Can handle data quality issues in SQL
□ Can perform cohort, funnel, and RFM analysis
□ Can work with time series data (gaps, islands)
□ Understand partitioning for large tables
□ Can write recursive CTEs for hierarchies
```

---

_Data Engineering is 80% SQL. Master these patterns and you'll excel in any DE interview!_
