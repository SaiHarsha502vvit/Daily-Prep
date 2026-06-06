# 🔨 Mini-Project P03 — SQL Analytics Dashboard

> **Semester:** 2, Weeks 9–11  
> **Topics:** Window Functions · CTEs · Aggregations  
> **Est. time:** 5–6 hours  
> **Languages:** MySQL 8.0 AND Oracle 19c (both required)

---

## 🎯 Business Requirement (The PM Brief)

*You are a data analyst at an e-commerce company. The VP of Sales wants a weekly executive dashboard. Every query must run in under 2 seconds on a table of 5 million orders. Build all 7 reports.*

---

## 📋 Schema

```sql
CREATE TABLE orders (
    order_id     INT         PRIMARY KEY,
    customer_id  INT         NOT NULL,
    order_date   DATE        NOT NULL,
    status       VARCHAR(20) NOT NULL, -- PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
    total_amount DECIMAL(10,2) NOT NULL
);

CREATE TABLE order_items (
    item_id    INT         PRIMARY KEY,
    order_id   INT         NOT NULL,
    product_id INT         NOT NULL,
    quantity   INT         NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL
);

CREATE TABLE customers (
    customer_id       INT          PRIMARY KEY,
    name              VARCHAR(100) NOT NULL,
    email             VARCHAR(100) UNIQUE NOT NULL,
    country           VARCHAR(50),
    registration_date DATE         NOT NULL
);

CREATE TABLE products (
    product_id  INT          PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    category    VARCHAR(50),
    cost_price  DECIMAL(10,2) NOT NULL
);
```

---

## 📊 Required Queries

---

### Query 1 — Monthly Revenue Report (Last 12 Months)

Business question: How much revenue did we generate each month, and how many orders did we receive?

```sql
-- ─────────────────── MySQL 8.0 ───────────────────
SELECT DATE_FORMAT(order_date, '%Y-%m') AS month,
       COUNT(order_id)                  AS order_count,
       SUM(total_amount)                AS total_revenue,
       ROUND(AVG(total_amount), 2)      AS avg_order_value
FROM   orders
WHERE  status != 'CANCELLED'
  AND  order_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
GROUP BY DATE_FORMAT(order_date, '%Y-%m')
ORDER BY month;

-- ─────────────────── Oracle 19c ───────────────────
SELECT TO_CHAR(order_date, 'YYYY-MM')  AS month,
       COUNT(order_id)                  AS order_count,
       SUM(total_amount)                AS total_revenue,
       ROUND(AVG(total_amount), 2)      AS avg_order_value
FROM   orders
WHERE  status != 'CANCELLED'
  AND  order_date >= ADD_MONTHS(TRUNC(SYSDATE), -12)
GROUP BY TO_CHAR(order_date, 'YYYY-MM')
ORDER BY month;
```

> **MySQL vs Oracle:** `DATE_FORMAT()` → `TO_CHAR()` | `DATE_SUB(CURDATE(), INTERVAL 12 MONTH)` → `ADD_MONTHS(SYSDATE, -12)` | `CURDATE()` → `SYSDATE`

🔴 **Erklärung:**

| Mistake | Why | Fix |
|---|---|---|
| Filtering `CANCELLED` inside HAVING | Aggregates already include cancelled orders | Filter in WHERE before aggregation |
| `GROUP BY order_date` instead of month | Creates one row per day, not per month | Use `DATE_FORMAT`/`TO_CHAR` to truncate to month |

---

### Query 2 — Top 10 Customers by Lifetime Value (LTV)

```sql
-- ─────────────────── MySQL 8.0 ───────────────────
SELECT c.customer_id,
       c.name,
       c.email,
       COUNT(o.order_id)         AS total_orders,
       SUM(o.total_amount)       AS lifetime_value,
       ROUND(AVG(o.total_amount), 2) AS avg_order_value
FROM   customers c
JOIN   orders o ON c.customer_id = o.customer_id
WHERE  o.status != 'CANCELLED'
GROUP BY c.customer_id, c.name, c.email
ORDER BY lifetime_value DESC
LIMIT 10;

-- ─────────────────── Oracle 19c ───────────────────
SELECT customer_id, name, email, total_orders, lifetime_value, avg_order_value
FROM (
    SELECT c.customer_id,
           c.name,
           c.email,
           COUNT(o.order_id)             AS total_orders,
           SUM(o.total_amount)           AS lifetime_value,
           ROUND(AVG(o.total_amount), 2) AS avg_order_value
    FROM   customers c
    JOIN   orders o ON c.customer_id = o.customer_id
    WHERE  o.status != 'CANCELLED'
    GROUP BY c.customer_id, c.name, c.email
    ORDER BY lifetime_value DESC
)
WHERE ROWNUM <= 10;
-- Oracle 12c+ alternative:
-- FETCH FIRST 10 ROWS ONLY;
```

> **MySQL vs Oracle:** `LIMIT 10` → `WHERE ROWNUM <= 10` (legacy) or `FETCH FIRST 10 ROWS ONLY` (Oracle 12c+)

---

### Query 3 — Product Performance Report

```sql
-- ─────────────────── MySQL 8.0 ───────────────────
SELECT p.product_id,
       p.name,
       p.category,
       SUM(oi.quantity)                               AS units_sold,
       SUM(oi.quantity * oi.unit_price)               AS revenue,
       SUM(oi.quantity * (oi.unit_price - p.cost_price)) AS gross_profit,
       ROUND(SUM(oi.quantity * (oi.unit_price - p.cost_price))
             / NULLIF(SUM(oi.quantity * oi.unit_price), 0) * 100, 2) AS margin_pct
FROM   products p
JOIN   order_items oi ON p.product_id = oi.product_id
JOIN   orders o ON oi.order_id = o.order_id
WHERE  o.status != 'CANCELLED'
GROUP BY p.product_id, p.name, p.category
ORDER BY revenue DESC;

-- ─────────────────── Oracle 19c ───────────────────
-- Identical except: NULLIF works the same in both.
-- No syntax differences for this query.
SELECT p.product_id,
       p.name,
       p.category,
       SUM(oi.quantity)                               AS units_sold,
       SUM(oi.quantity * oi.unit_price)               AS revenue,
       SUM(oi.quantity * (oi.unit_price - p.cost_price)) AS gross_profit,
       ROUND(SUM(oi.quantity * (oi.unit_price - p.cost_price))
             / NULLIF(SUM(oi.quantity * oi.unit_price), 0) * 100, 2) AS margin_pct
FROM   products p
JOIN   order_items oi ON p.product_id = oi.product_id
JOIN   orders o ON oi.order_id = o.order_id
WHERE  o.status != 'CANCELLED'
GROUP BY p.product_id, p.name, p.category
ORDER BY revenue DESC;
```

> **Key:** `NULLIF(denominator, 0)` prevents division-by-zero. Never divide without this guard in SQL.

---

### Query 4 — Customer Cohort Analysis

Business question: For each registration-month cohort, how many customers placed orders in month 1, 2, 3 after registration?

```sql
-- ─────────────────── MySQL 8.0 ───────────────────
WITH cohorts AS (
    SELECT c.customer_id,
           DATE_FORMAT(c.registration_date, '%Y-%m') AS cohort_month
    FROM   customers c
),
activity AS (
    SELECT o.customer_id,
           TIMESTAMPDIFF(MONTH, c.registration_date, o.order_date) AS months_since_reg
    FROM   orders o
    JOIN   customers c ON o.customer_id = c.customer_id
    WHERE  o.status != 'CANCELLED'
      AND  months_since_reg BETWEEN 0 AND 2
)
SELECT co.cohort_month,
       COUNT(DISTINCT co.customer_id)                                    AS cohort_size,
       COUNT(DISTINCT CASE WHEN a.months_since_reg = 0 THEN a.customer_id END) AS month_1,
       COUNT(DISTINCT CASE WHEN a.months_since_reg = 1 THEN a.customer_id END) AS month_2,
       COUNT(DISTINCT CASE WHEN a.months_since_reg = 2 THEN a.customer_id END) AS month_3
FROM   cohorts co
LEFT JOIN activity a ON co.customer_id = a.customer_id
GROUP BY co.cohort_month
ORDER BY co.cohort_month;

-- ─────────────────── Oracle 19c ───────────────────
WITH cohorts AS (
    SELECT c.customer_id,
           TO_CHAR(c.registration_date, 'YYYY-MM') AS cohort_month
    FROM   customers c
),
activity AS (
    SELECT o.customer_id,
           MONTHS_BETWEEN(TRUNC(o.order_date, 'MM'), TRUNC(c.registration_date, 'MM')) AS months_since_reg
    FROM   orders o
    JOIN   customers c ON o.customer_id = c.customer_id
    WHERE  o.status != 'CANCELLED'
)
SELECT co.cohort_month,
       COUNT(DISTINCT co.customer_id) AS cohort_size,
       COUNT(DISTINCT CASE WHEN a.months_since_reg = 0 THEN a.customer_id END) AS month_1,
       COUNT(DISTINCT CASE WHEN a.months_since_reg = 1 THEN a.customer_id END) AS month_2,
       COUNT(DISTINCT CASE WHEN a.months_since_reg = 2 THEN a.customer_id END) AS month_3
FROM   cohorts co
LEFT JOIN activity a ON co.customer_id = a.customer_id
GROUP BY co.cohort_month
ORDER BY co.cohort_month;
```

> **MySQL vs Oracle:** `TIMESTAMPDIFF(MONTH, d1, d2)` → `MONTHS_BETWEEN(d1, d2)` | `DATE_FORMAT()` → `TO_CHAR()`

---

### Query 5 — Churn Detection

Business question: Which customers ordered before but have NOT ordered in the last 90 days?

```sql
-- ─────────────────── MySQL 8.0 ───────────────────
SELECT c.customer_id, c.name, c.email,
       MAX(o.order_date) AS last_order_date,
       DATEDIFF(CURDATE(), MAX(o.order_date)) AS days_since_last_order
FROM   customers c
JOIN   orders o ON c.customer_id = o.customer_id
WHERE  o.status != 'CANCELLED'
GROUP BY c.customer_id, c.name, c.email
HAVING MAX(o.order_date) < DATE_SUB(CURDATE(), INTERVAL 90 DAY)
ORDER BY last_order_date ASC;

-- ─────────────────── Oracle 19c ───────────────────
SELECT c.customer_id, c.name, c.email,
       MAX(o.order_date)           AS last_order_date,
       SYSDATE - MAX(o.order_date) AS days_since_last_order
FROM   customers c
JOIN   orders o ON c.customer_id = o.customer_id
WHERE  o.status != 'CANCELLED'
GROUP BY c.customer_id, c.name, c.email
HAVING MAX(o.order_date) < SYSDATE - 90
ORDER BY last_order_date ASC;
```

> **MySQL vs Oracle:** `DATEDIFF(CURDATE(), date)` → `SYSDATE - date` | `DATE_SUB(CURDATE(), INTERVAL 90 DAY)` → `SYSDATE - 90`

---

### Query 6 — Cumulative Daily Revenue (Current Year)

```sql
-- ─────────────────── MySQL 8.0 ───────────────────
SELECT order_date,
       SUM(total_amount)                                    AS daily_revenue,
       SUM(SUM(total_amount)) OVER (ORDER BY order_date
           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_revenue
FROM   orders
WHERE  status != 'CANCELLED'
  AND  YEAR(order_date) = YEAR(CURDATE())
GROUP BY order_date
ORDER BY order_date;

-- ─────────────────── Oracle 19c ───────────────────
SELECT order_date,
       SUM(total_amount)                                    AS daily_revenue,
       SUM(SUM(total_amount)) OVER (ORDER BY order_date
           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_revenue
FROM   orders
WHERE  status != 'CANCELLED'
  AND  EXTRACT(YEAR FROM order_date) = EXTRACT(YEAR FROM SYSDATE)
GROUP BY order_date
ORDER BY order_date;
```

> **MySQL vs Oracle:** `YEAR(date)` → `EXTRACT(YEAR FROM date)`

---

### Query 7 — Month-over-Month Revenue Growth

```sql
-- ─────────────────── MySQL 8.0 ───────────────────
WITH monthly AS (
    SELECT DATE_FORMAT(order_date, '%Y-%m') AS month,
           SUM(total_amount)               AS revenue
    FROM   orders
    WHERE  status != 'CANCELLED'
    GROUP BY DATE_FORMAT(order_date, '%Y-%m')
)
SELECT month, revenue,
       LAG(revenue) OVER (ORDER BY month)     AS prev_month_revenue,
       ROUND(
           (revenue - LAG(revenue) OVER (ORDER BY month))
           / NULLIF(LAG(revenue) OVER (ORDER BY month), 0) * 100, 2
       ) AS growth_pct
FROM monthly
ORDER BY month;

-- ─────────────────── Oracle 19c ───────────────────
WITH monthly AS (
    SELECT TO_CHAR(order_date, 'YYYY-MM') AS month,
           SUM(total_amount)              AS revenue
    FROM   orders
    WHERE  status != 'CANCELLED'
    GROUP BY TO_CHAR(order_date, 'YYYY-MM')
)
SELECT month, revenue,
       LAG(revenue) OVER (ORDER BY month)     AS prev_month_revenue,
       ROUND(
           (revenue - LAG(revenue) OVER (ORDER BY month))
           / NULLIF(LAG(revenue) OVER (ORDER BY month), 0) * 100, 2
       ) AS growth_pct
FROM monthly
ORDER BY month;
```

---

## 🔴 Common Mistakes (Erklärungen)

| Mistake | MySQL Symptom | Oracle Symptom | Fix |
|---|---|---|---|
| `LIMIT n` in subquery | Works in MySQL | ORA-00907: missing right parenthesis | Use `ROWNUM` or `FETCH FIRST` in Oracle |
| `YEAR(date)` | Works | ORA-00904: invalid identifier | Use `EXTRACT(YEAR FROM date)` in both for portability |
| Division without `NULLIF` | Returns NULL for zero denominator | Same | Always `/ NULLIF(denominator, 0)` |
| `DATE_FORMAT()` | Works | ORA-00904 | Use `TO_CHAR(date, 'YYYY-MM')` in Oracle |
| `IFNULL(a, b)` | Works | ORA-00904 | Use `COALESCE(a, b)` — ANSI standard, works in both |
| `GROUP_CONCAT()` | Works | ORA-00904 | Use `LISTAGG(col, ',') WITHIN GROUP (ORDER BY col)` in Oracle |

---

## 🚀 Extension Challenges

1. **Market Basket Analysis:** Find the most commonly co-purchased product pairs using a self-join on `order_items`
2. **Seasonal Analysis:** Add a computed `is_peak_season` flag and compare peak vs off-season revenue
3. **Customer Segmentation:** Label customers as CHAMPION / LOYAL / AT_RISK / CHURNED based on RFM (Recency, Frequency, Monetary) scoring

---

[← Back to Semester 2 Guide](../../00_CURRICULUM/SEMESTER_2_GUIDE.md)
