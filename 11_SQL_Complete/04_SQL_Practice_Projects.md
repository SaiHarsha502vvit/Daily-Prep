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

*Practice consistently. Aim for 2-3 problems daily. Review solutions even for problems you solved.*
