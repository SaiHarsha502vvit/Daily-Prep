> **Navigation**: [< Previous](23_SQL_Deep_Reasoning.md) | [Back to Index](../00_MASTER_INDEX.md)

# Chapter 24 — SQL for Data Analysts: Real-World Patterns That Get You Hired

> **"Knowing SELECT and JOIN makes you a developer who queries databases. Knowing cohort analysis, funnel queries, retention curves, and A/B testing SQL makes you a DATA ANALYST. This chapter bridges the gap."**

---

## Table of Contents

1. [The Data Analyst SQL Mindset](#1-data-analyst-mindset)
2. [Cohort Analysis: User Retention by Signup Month](#2-cohort-analysis)
3. [Funnel Analysis: Where Users Drop Off](#3-funnel-analysis)
4. [Retention Analysis: Are Users Coming Back?](#4-retention-analysis)
5. [A/B Testing SQL: Measuring Experiment Results](#5-ab-testing-sql)
6. [Customer Segmentation & RFM Analysis](#6-customer-segmentation-rfm)
7. [KPI Dashboards: Business Metrics from SQL](#7-kpi-dashboards)
8. [Time Series Analysis: Trends, Moving Averages, YoY](#8-time-series-analysis)
9. [Advanced Window Functions for Analytics](#9-advanced-window-functions)
10. [Session Analysis & User Journey](#10-session-analysis)
11. [Real Interview Questions: Data Analyst SQL](#11-real-interview-questions)
12. [Quick Reference: Analyst SQL Cheat Sheet](#12-quick-reference)

---

## 1. The Data Analyst SQL Mindset


> DEVELOPER SQL vs ANALYST SQL
>
> Developer: "Get me user #42's orders"
> Analyst:   "Show me Week-1 retention for users who signed
> up in January vs February, segmented by plan type"
>
> Developer: SELECT → WHERE → JOIN → done
> Analyst:   WITH → WINDOW → CASE → GROUP BY → HAVING → layers
>
> Developer thinks in ROWS (fetch this record)
> Analyst thinks in GROUPS and TRENDS (what's the pattern?)
>
> KEY TOOLS FOR ANALYSTS:
> → CTEs (WITH clause) — readable multi-step queries
> → Window functions — calculations across related rows
> → CASE WHEN — pivoting and conditional aggregation
> → Date functions — time-based grouping and comparison
> → Self-joins — comparing current vs historical data


### Sample Schema (used throughout this chapter)

```sql
-- Users table
CREATE TABLE users (
    user_id     INT PRIMARY KEY,
    signup_date DATE,
    plan_type   VARCHAR(20),  -- 'free', 'basic', 'premium'
    country     VARCHAR(50),
    utm_source  VARCHAR(50)
);

-- Events table (user actions)
CREATE TABLE events (
    event_id    BIGINT PRIMARY KEY,
    user_id     INT,
    event_type  VARCHAR(50),   -- 'page_view', 'add_to_cart', 'purchase', 'login'
    event_date  TIMESTAMP,
    properties  JSONB           -- metadata
);

-- Orders table
CREATE TABLE orders (
    order_id    INT PRIMARY KEY,
    user_id     INT,
    order_date  DATE,
    amount      DECIMAL(10,2),
    status      VARCHAR(20)     -- 'completed', 'refunded', 'cancelled'
);

-- Experiments table
CREATE TABLE experiments (
    user_id       INT,
    experiment_id VARCHAR(50),
    variant       VARCHAR(20),   -- 'control', 'treatment_a', 'treatment_b'
    assigned_date DATE
);
```

---

## 2. Cohort Analysis: User Retention by Signup Month

### The Freeze Question
> "Show me what percentage of users who signed up each month are still active in subsequent months."

### Deep Reasoning

```
╔══════════════════════════════════════════════════════════════════╗
║  WHAT IS COHORT ANALYSIS?                                        ║
║                                                                  ║
║  A "cohort" = a group of users who share a common trait          ║
║  Usually: "signed up in the same month"                          ║
║                                                                  ║
║  You track each cohort OVER TIME:                                ║
║                                                                  ║
║  Cohort      │ Month 0  │ Month 1  │ Month 2  │ Month 3  │       ║
║  ────────────┼──────────┼──────────┼──────────┼──────────┤       ║
║  Jan signup  │ 1000     │ 400 (40%)│ 250 (25%)│ 200 (20%)│       ║
║  Feb signup  │ 1200     │ 540 (45%)│ 360 (30%)│          │       ║
║  Mar signup  │ 800      │ 400 (50%)│          │          │       ║
║                                                                  ║
║  WHAT THIS TELLS YOU:                                            ║
║  → "Users signing up later months have BETTER retention"         ║
║  → "We lose 50-60% of users in first month — fix onboarding!"    ║
║  → "Month-3 retention stabilizes around 20% — our core users"    ║
╚══════════════════════════════════════════════════════════════════╝
```

**Flow:**
- WHAT IS COHORT ANALYSIS?
- ↓
- A 'cohort' = a group of users who share a common trait
- ↓
- Usually: 'signed up in the same month'
- ↓
- You track each cohort OVER TIME:
- ↓
- Cohort Month 0 Month 1 Month 2 Month 3
- ↓
- Jan signup 1000 400 (40%) 250 (25%) 200 (20%)
- ↓
- Feb signup 1200 540 (45%) 360 (30%)

```mermaid
flowchart TD
    N1["WHAT IS COHORT ANALYSIS?"]
    N2["A 'cohort' = a group of users who share a common trait"]
    N3["Usually: 'signed up in the same month'"]
    N4["You track each cohort OVER TIME:"]
    N5["Cohort Month 0 Month 1 Month 2 Month 3"]
    N6["Jan signup 1000 400 (40%) 250 (25%) 200 (20%)"]
    N7["Feb signup 1200 540 (45%) 360 (30%)"]
    N8["Mar signup 800 400 (50%)"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
```

### The SQL

```sql
WITH cohorts AS (
    -- Step 1: Assign each user to their signup cohort (month)
    SELECT
        user_id,
        DATE_TRUNC('month', signup_date) AS cohort_month
    FROM users
),
user_activity AS (
    -- Step 2: Find which months each user was active
    SELECT DISTINCT
        e.user_id,
        DATE_TRUNC('month', e.event_date) AS activity_month
    FROM events e
    WHERE e.event_type = 'login'  -- Define "active" as logging in
),
cohort_data AS (
    -- Step 3: Calculate months since signup for each activity
    SELECT
        c.cohort_month,
        -- Months between signup month and activity month
        EXTRACT(YEAR FROM age(ua.activity_month, c.cohort_month)) * 12 +
        EXTRACT(MONTH FROM age(ua.activity_month, c.cohort_month)) AS months_since_signup,
        COUNT(DISTINCT c.user_id) AS active_users
    FROM cohorts c
    JOIN user_activity ua ON c.user_id = ua.user_id
    WHERE ua.activity_month >= c.cohort_month
    GROUP BY c.cohort_month, months_since_signup
),
cohort_sizes AS (
    -- Step 4: Get total users per cohort
    SELECT cohort_month, COUNT(DISTINCT user_id) AS cohort_size
    FROM cohorts
    GROUP BY cohort_month
)
-- Step 5: Calculate retention percentages
SELECT
    cd.cohort_month,
    cs.cohort_size,
    cd.months_since_signup,
    cd.active_users,
    ROUND(100.0 * cd.active_users / cs.cohort_size, 1) AS retention_pct
FROM cohort_data cd
JOIN cohort_sizes cs ON cd.cohort_month = cs.cohort_month
ORDER BY cd.cohort_month, cd.months_since_signup;
```

### Pivot to a Heatmap Table

```sql
-- Pivoted cohort table (for visualization):
SELECT
    cohort_month,
    cohort_size,
    ROUND(100.0 * SUM(CASE WHEN months_since_signup = 0 THEN active_users END) / cohort_size, 1) AS "Month 0",
    ROUND(100.0 * SUM(CASE WHEN months_since_signup = 1 THEN active_users END) / cohort_size, 1) AS "Month 1",
    ROUND(100.0 * SUM(CASE WHEN months_since_signup = 2 THEN active_users END) / cohort_size, 1) AS "Month 2",
    ROUND(100.0 * SUM(CASE WHEN months_since_signup = 3 THEN active_users END) / cohort_size, 1) AS "Month 3",
    ROUND(100.0 * SUM(CASE WHEN months_since_signup = 6 THEN active_users END) / cohort_size, 1) AS "Month 6"
FROM cohort_retention_base  -- from the CTE above
GROUP BY cohort_month, cohort_size
ORDER BY cohort_month;
```

---

## 3. Funnel Analysis: Where Users Drop Off

### Deep Reasoning

```
WHAT IS A FUNNEL?

Users flow through a sequence of steps:

┌────────────────────────────────┐
│    Visit Homepage (10,000)     │  100%
│  ┌──────────────────────────┐  │
│  │  View Product (6,000)    │  │  60% (40% dropped off!)
│  │  ┌────────────────────┐  │  │
│  │  │ Add to Cart (2,000)│  │  │  33% of viewers
│  │  │  ┌──────────────┐  │  │  │
│  │  │  │ Purchase(800)│  │  │  │  40% of add-to-cart
│  │  │  └──────────────┘  │  │  │  8% overall conversion!
│  │  └────────────────────┘  │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘

The biggest drop happens Homepage→Product (40% lost).
Fix THAT step for maximum impact!
```

**Flow:**
- WHAT IS A FUNNEL?
- ↓
- Users flow through a sequence of steps:
- ↓
- Visit Homepage (10,000) 100%
- ↓
- View Product (6,000) 60% (40% dropped off!)
- ↓
- Add to Cart (2,000) 33% of viewers
- ↓
- Purchase(800) 40% of add-to-cart
- ↓
- 8% overall conversion!

```mermaid
flowchart TD
    N1["WHAT IS A FUNNEL?"]
    N2["Users flow through a sequence of steps:"]
    N3["Visit Homepage (10,000) 100%"]
    N4["View Product (6,000) 60% (40% dropped off!)"]
    N5["Add to Cart (2,000) 33% of viewers"]
    N6["Purchase(800) 40% of add-to-cart"]
    N7["8% overall conversion!"]
    N8["The biggest drop happens Homepage→Product (40% lost)."]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
```

### The SQL

```sql
WITH funnel_steps AS (
    SELECT
        user_id,
        -- Did user reach each step? (1 = yes, 0 = no)
        MAX(CASE WHEN event_type = 'page_view'     THEN 1 ELSE 0 END) AS visited,
        MAX(CASE WHEN event_type = 'view_product'   THEN 1 ELSE 0 END) AS viewed_product,
        MAX(CASE WHEN event_type = 'add_to_cart'    THEN 1 ELSE 0 END) AS added_to_cart,
        MAX(CASE WHEN event_type = 'purchase'       THEN 1 ELSE 0 END) AS purchased
    FROM events
    WHERE event_date >= '2024-01-01' AND event_date < '2024-02-01'
    GROUP BY user_id
)
SELECT
    COUNT(*)                                               AS total_users,
    SUM(visited)                                           AS step1_visited,
    SUM(viewed_product)                                    AS step2_viewed,
    SUM(added_to_cart)                                     AS step3_cart,
    SUM(purchased)                                         AS step4_purchased,
    -- Conversion rates
    ROUND(100.0 * SUM(viewed_product) / NULLIF(SUM(visited), 0), 1)      AS visit_to_view_pct,
    ROUND(100.0 * SUM(added_to_cart) / NULLIF(SUM(viewed_product), 0), 1) AS view_to_cart_pct,
    ROUND(100.0 * SUM(purchased) / NULLIF(SUM(added_to_cart), 0), 1)      AS cart_to_purchase_pct,
    ROUND(100.0 * SUM(purchased) / NULLIF(SUM(visited), 0), 1)            AS overall_conversion_pct
FROM funnel_steps;
```

### Time-Ordered Funnel (users must do steps IN ORDER)

```sql
-- Strict funnel: user must complete step N before step N+1
WITH user_steps AS (
    SELECT
        user_id,
        MIN(CASE WHEN event_type = 'page_view'   THEN event_date END) AS step1_time,
        MIN(CASE WHEN event_type = 'view_product' THEN event_date END) AS step2_time,
        MIN(CASE WHEN event_type = 'add_to_cart'  THEN event_date END) AS step3_time,
        MIN(CASE WHEN event_type = 'purchase'     THEN event_date END) AS step4_time
    FROM events
    WHERE event_date >= '2024-01-01' AND event_date < '2024-02-01'
    GROUP BY user_id
)
SELECT
    COUNT(*)                                                          AS total_users,
    COUNT(step1_time)                                                 AS reached_step1,
    COUNT(CASE WHEN step2_time > step1_time THEN 1 END)              AS reached_step2,
    COUNT(CASE WHEN step3_time > step2_time AND step2_time > step1_time THEN 1 END) AS reached_step3,
    COUNT(CASE WHEN step4_time > step3_time AND step3_time > step2_time
               AND step2_time > step1_time THEN 1 END)              AS reached_step4
FROM user_steps;
```

---

## 4. Retention Analysis: Are Users Coming Back?

### Day-N Retention

```sql
-- "What % of users who signed up on day X are active on day X+1, X+7, X+30?"
WITH user_first_day AS (
    SELECT
        user_id,
        DATE(signup_date) AS signup_day
    FROM users
),
daily_activity AS (
    SELECT DISTINCT
        user_id,
        DATE(event_date) AS active_day
    FROM events
)
SELECT
    u.signup_day,
    COUNT(DISTINCT u.user_id) AS cohort_size,
    -- Day 1 retention
    COUNT(DISTINCT CASE WHEN da.active_day = u.signup_day + INTERVAL '1 day'
                        THEN da.user_id END) AS day1_retained,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN da.active_day = u.signup_day + INTERVAL '1 day'
                        THEN da.user_id END) / COUNT(DISTINCT u.user_id), 1) AS day1_pct,
    -- Day 7 retention
    COUNT(DISTINCT CASE WHEN da.active_day = u.signup_day + INTERVAL '7 days'
                        THEN da.user_id END) AS day7_retained,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN da.active_day = u.signup_day + INTERVAL '7 days'
                        THEN da.user_id END) / COUNT(DISTINCT u.user_id), 1) AS day7_pct,
    -- Day 30 retention
    COUNT(DISTINCT CASE WHEN da.active_day = u.signup_day + INTERVAL '30 days'
                        THEN da.user_id END) AS day30_retained,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN da.active_day = u.signup_day + INTERVAL '30 days'
                        THEN da.user_id END) / COUNT(DISTINCT u.user_id), 1) AS day30_pct
FROM user_first_day u
LEFT JOIN daily_activity da ON u.user_id = da.user_id
GROUP BY u.signup_day
ORDER BY u.signup_day;
```

### Rolling Retention (Unbounded)

```sql
-- "What % of users from this cohort were active AT ANY POINT on or after day N?"
-- This is more forgiving than exact-day retention
SELECT
    c.cohort_month,
    cs.cohort_size,
    COUNT(DISTINCT CASE WHEN ua.activity_month >= c.cohort_month + INTERVAL '1 month'
                        THEN c.user_id END) AS retained_after_month1,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN ua.activity_month >= c.cohort_month + INTERVAL '1 month'
                        THEN c.user_id END) / cs.cohort_size, 1) AS rolling_retention_pct
FROM cohorts c
LEFT JOIN user_activity ua ON c.user_id = ua.user_id
JOIN cohort_sizes cs ON c.cohort_month = cs.cohort_month
GROUP BY c.cohort_month, cs.cohort_size;
```

---

## 5. A/B Testing SQL: Measuring Experiment Results

### Deep Reasoning

```
╔══════════════════════════════════════════════════════════════════╗
║  A/B TESTING WITH SQL                                            ║
║                                                                  ║
║  Goal: "Did changing the button color increase purchases?"       ║
║                                                                  ║
║  Control (A):   Old blue button → 10,000 users                   ║
║  Treatment (B): New green button → 10,000 users                  ║
║                                                                  ║
║  Metrics to compare:                                             ║
║  → Conversion rate (% who purchased)                             ║
║  → Revenue per user                                              ║
║  → Average order value                                           ║
║                                                                  ║
║  STATISTICAL RIGOR:                                              ║
║  → Sample size: enough users to detect meaningful difference     ║
║  → Significance: p-value or confidence interval                  ║
║  → Segment analysis: does the effect hold across all groups?     ║
╚══════════════════════════════════════════════════════════════════╝
```

**Flow:**
- A/B TESTING WITH SQL
- ↓
- Goal: 'Did changing the button color increase purchases
- ↓
- Control (A): Old blue button
- ↓
- 10,000 users
- ↓
- Control (A): Old blue button
- ↓
- 10,000 users
- ↓
- Treatment (B): New green button
- ↓
- 10,000 users
- ↓
- Treatment (B): New green button
- ↓
- 10,000 users
- ↓
- Metrics to compare:
- ↓
- Conversion rate (% who purchased)
- ↓
- Revenue per user

```mermaid
flowchart TD
    N1["A/B TESTING WITH SQL"]
    N2["Goal: 'Did changing the button color increase purchases"]
    N3["Control (A): Old blue button → 10,000 users"]
    N4["Treatment (B): New green button → 10,000 users"]
    N5["Metrics to compare:"]
    N6["→ Conversion rate (% who purchased)"]
    N7["→ Revenue per user"]
    N8["→ Average order value"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
```

### The SQL

```sql
WITH experiment_metrics AS (
    SELECT
        e.variant,
        COUNT(DISTINCT e.user_id)                              AS total_users,
        COUNT(DISTINCT o.user_id)                              AS converters,
        SUM(COALESCE(o.amount, 0))                             AS total_revenue,
        COUNT(o.order_id)                                       AS total_orders
    FROM experiments e
    LEFT JOIN orders o ON e.user_id = o.user_id
        AND o.order_date >= e.assigned_date              -- Only count post-assignment orders
        AND o.order_date < e.assigned_date + INTERVAL '14 days'  -- Within experiment window
        AND o.status = 'completed'
    WHERE e.experiment_id = 'green_button_test'
    GROUP BY e.variant
)
SELECT
    variant,
    total_users,
    converters,
    ROUND(100.0 * converters / total_users, 2)             AS conversion_rate_pct,
    ROUND(total_revenue / total_users, 2)                   AS revenue_per_user,
    ROUND(total_revenue / NULLIF(converters, 0), 2)         AS avg_order_value,
    total_orders,
    ROUND(1.0 * total_orders / NULLIF(converters, 0), 2)   AS orders_per_converter
FROM experiment_metrics
ORDER BY variant;

-- Output:
-- variant    | users  | converters | conv_rate | rev/user | AOV   | orders
-- control    | 10000  | 800        | 8.00%     | $12.50   | $156  | 900
-- treatment  | 10000  | 960        | 9.60%     | $15.20   | $158  | 1080
-- → Treatment has 20% higher conversion! But is it statistically significant?
```

### Segmented A/B Analysis

```sql
-- Check if effect holds across segments (don't be fooled by Simpson's Paradox!)
SELECT
    e.variant,
    u.plan_type,
    COUNT(DISTINCT e.user_id)                              AS users,
    COUNT(DISTINCT o.user_id)                              AS converters,
    ROUND(100.0 * COUNT(DISTINCT o.user_id) / COUNT(DISTINCT e.user_id), 2) AS conv_rate
FROM experiments e
JOIN users u ON e.user_id = u.user_id
LEFT JOIN orders o ON e.user_id = o.user_id
    AND o.order_date >= e.assigned_date
    AND o.status = 'completed'
WHERE e.experiment_id = 'green_button_test'
GROUP BY e.variant, u.plan_type
ORDER BY u.plan_type, e.variant;

-- Might reveal: treatment helps free users (+30%)
-- but HURTS premium users (-5%)
-- → Decision: roll out only for free users
```

---

## 6. Customer Segmentation & RFM Analysis

### Deep Reasoning

```
╔══════════════════════════════════════════════════════════════════╗
║  RFM = Recency, Frequency, Monetary                              ║
║                                                                  ║
║  Score each customer on 3 dimensions (1-5 each):                 ║
║                                                                  ║
║  Recency:   How RECENTLY did they purchase?                      ║
║             (5 = this week, 1 = 6+ months ago)                   ║
║                                                                  ║
║  Frequency:  How OFTEN do they purchase?                         ║
║             (5 = 50+ orders, 1 = 1 order)                        ║
║                                                                  ║
║  Monetary:   How much do they SPEND?                             ║
║             (5 = top 20%, 1 = bottom 20%)                        ║
║                                                                  ║
║  SEGMENTS:                                                       ║
║  RFM = 555  → Champions (best customers — reward them!)          ║
║  RFM = 511  → New customers (high recency, low frequency)        ║
║  RFM = 155  → At risk (were big spenders, haven't been back)     ║
║  RFM = 111  → Lost (haven't bought recently, rarely, cheaply)    ║
╚══════════════════════════════════════════════════════════════════╝
```

**Flow:**
- RFM = Recency, Frequency, Monetary
- ↓
- Score each customer on 3 dimensions (1-5 each):
- ↓
- Recency: How RECENTLY did they purchase?
- ↓
- (5 = this week, 1 = 6+ months ago)
- ↓
- Frequency: How OFTEN do they purchase?
- ↓
- (5 = 50+ orders, 1 = 1 order)
- ↓
- Monetary: How much do they SPEND?

```mermaid
flowchart TD
    N1["RFM = Recency, Frequency, Monetary"]
    N2["Score each customer on 3 dimensions (1-5 each):"]
    N3["Recency: How RECENTLY did they purchase?"]
    N4["(5 = this week, 1 = 6+ months ago)"]
    N5["Frequency: How OFTEN do they purchase?"]
    N6["(5 = 50+ orders, 1 = 1 order)"]
    N7["Monetary: How much do they SPEND?"]
    N8["(5 = top 20%, 1 = bottom 20%)"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
```

### The SQL

```sql
WITH rfm_base AS (
    SELECT
        user_id,
        -- Recency: days since last order
        CURRENT_DATE - MAX(order_date) AS days_since_last_order,
        -- Frequency: total orders
        COUNT(DISTINCT order_id) AS total_orders,
        -- Monetary: total spend
        SUM(amount) AS total_spend
    FROM orders
    WHERE status = 'completed'
    GROUP BY user_id
),
rfm_scores AS (
    SELECT
        user_id,
        days_since_last_order,
        total_orders,
        total_spend,
        -- Score 1-5 using quintiles (NTILE)
        NTILE(5) OVER (ORDER BY days_since_last_order DESC) AS recency_score,   -- DESC: fewer days = higher score
        NTILE(5) OVER (ORDER BY total_orders ASC)           AS frequency_score,
        NTILE(5) OVER (ORDER BY total_spend ASC)            AS monetary_score
    FROM rfm_base
)
SELECT
    user_id,
    recency_score,
    frequency_score,
    monetary_score,
    recency_score || frequency_score || monetary_score AS rfm_segment,
    CASE
        WHEN recency_score >= 4 AND frequency_score >= 4 AND monetary_score >= 4
            THEN 'Champions'
        WHEN recency_score >= 4 AND frequency_score <= 2
            THEN 'New Customers'
        WHEN recency_score <= 2 AND frequency_score >= 4
            THEN 'At Risk'
        WHEN recency_score <= 2 AND frequency_score <= 2
            THEN 'Lost'
        WHEN recency_score >= 3 AND monetary_score >= 4
            THEN 'Big Spenders'
        ELSE 'Regular'
    END AS customer_segment,
    total_orders,
    total_spend
FROM rfm_scores
ORDER BY total_spend DESC;
```

---

## 7. KPI Dashboards: Business Metrics from SQL

### Monthly Business Report

```sql
WITH monthly_metrics AS (
    SELECT
        DATE_TRUNC('month', order_date) AS month,
        COUNT(DISTINCT user_id)         AS active_customers,
        COUNT(order_id)                 AS total_orders,
        SUM(amount)                     AS gross_revenue,
        SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END) AS refunds,
        AVG(amount)                     AS avg_order_value
    FROM orders
    WHERE order_date >= DATE_TRUNC('year', CURRENT_DATE)
    GROUP BY DATE_TRUNC('month', order_date)
),
with_growth AS (
    SELECT
        *,
        -- Net revenue
        gross_revenue - refunds AS net_revenue,
        -- Month-over-month growth
        ROUND(100.0 * (gross_revenue - LAG(gross_revenue) OVER (ORDER BY month))
              / NULLIF(LAG(gross_revenue) OVER (ORDER BY month), 0), 1) AS revenue_growth_pct,
        -- New vs returning customers
        LAG(active_customers) OVER (ORDER BY month) AS prev_customers
    FROM monthly_metrics
)
SELECT
    month,
    active_customers,
    total_orders,
    ROUND(net_revenue, 2) AS net_revenue,
    ROUND(avg_order_value, 2) AS aov,
    revenue_growth_pct AS mom_growth_pct,
    ROUND(100.0 * refunds / NULLIF(gross_revenue, 0), 1) AS refund_rate_pct
FROM with_growth
ORDER BY month;
```

### Daily Active Users (DAU) / Monthly Active Users (MAU)

```sql
-- DAU/MAU Ratio = "stickiness" (how often monthly users come back daily)
-- Good: >20% (social apps), >50% (messaging apps)
WITH dau AS (
    SELECT
        DATE(event_date) AS day,
        COUNT(DISTINCT user_id) AS daily_active
    FROM events
    WHERE event_type = 'login'
    AND event_date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE(event_date)
),
mau AS (
    SELECT COUNT(DISTINCT user_id) AS monthly_active
    FROM events
    WHERE event_type = 'login'
    AND event_date >= CURRENT_DATE - INTERVAL '30 days'
)
SELECT
    d.day,
    d.daily_active AS dau,
    m.monthly_active AS mau,
    ROUND(100.0 * d.daily_active / m.monthly_active, 1) AS stickiness_pct
FROM dau d, mau m
ORDER BY d.day;
```

---

## 8. Time Series Analysis: Trends, Moving Averages, YoY

### 7-Day Moving Average (Smoothing Daily Noise)

```sql
SELECT
    order_date,
    daily_revenue,
    -- 7-day moving average
    ROUND(AVG(daily_revenue) OVER (
        ORDER BY order_date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ), 2) AS ma_7day,
    -- 28-day moving average
    ROUND(AVG(daily_revenue) OVER (
        ORDER BY order_date
        ROWS BETWEEN 27 PRECEDING AND CURRENT ROW
    ), 2) AS ma_28day
FROM (
    SELECT
        order_date,
        SUM(amount) AS daily_revenue
    FROM orders
    WHERE status = 'completed'
    GROUP BY order_date
) daily
ORDER BY order_date;
```

### Year-over-Year (YoY) Comparison

```sql
WITH monthly_revenue AS (
    SELECT
        DATE_TRUNC('month', order_date) AS month,
        EXTRACT(YEAR FROM order_date) AS year,
        EXTRACT(MONTH FROM order_date) AS month_num,
        SUM(amount) AS revenue
    FROM orders
    WHERE status = 'completed'
    GROUP BY DATE_TRUNC('month', order_date),
             EXTRACT(YEAR FROM order_date),
             EXTRACT(MONTH FROM order_date)
)
SELECT
    curr.month AS current_month,
    curr.revenue AS current_revenue,
    prev.revenue AS prev_year_revenue,
    ROUND(100.0 * (curr.revenue - prev.revenue) / NULLIF(prev.revenue, 0), 1) AS yoy_growth_pct
FROM monthly_revenue curr
LEFT JOIN monthly_revenue prev
    ON curr.month_num = prev.month_num
    AND curr.year = prev.year + 1
WHERE curr.year = EXTRACT(YEAR FROM CURRENT_DATE)
ORDER BY curr.month;
```

### Cumulative Sum (Running Total)

```sql
SELECT
    order_date,
    daily_revenue,
    SUM(daily_revenue) OVER (
        PARTITION BY DATE_TRUNC('month', order_date)
        ORDER BY order_date
    ) AS mtd_revenue  -- Month-to-date running total
FROM (
    SELECT order_date, SUM(amount) AS daily_revenue
    FROM orders WHERE status = 'completed'
    GROUP BY order_date
) daily
ORDER BY order_date;
```

---

## 9. Advanced Window Functions for Analytics

### Window Functions Cheat Sheet for Analysts

```
┌─────────────────────────────────────────────────────────────────────┐
│  FUNCTION              │  PURPOSE                    │  EXAMPLE     │
│ ───────────────────────┼─────────────────────────────┼────────      │
│  ROW_NUMBER()          │  Sequential rank (no ties)  │  Top N       │
│  RANK()                │  Rank with gaps (1,2,2,4)   │  Leaderboard │
│  DENSE_RANK()          │  Rank no gaps (1,2,2,3)     │  Percentile  │
│  NTILE(n)              │  Divide into n equal groups  │  Quartiles  │
│  LAG(col, n)           │  Previous row value          │  Change     │
│  LEAD(col, n)          │  Next row value              │  Forecast   │
│  FIRST_VALUE(col)      │  First in window             │  Baseline   │
│  LAST_VALUE(col)       │  Last in window              │  Latest     │
│  SUM() OVER()          │  Running total              │  Cumulative  │
│  AVG() OVER(ROWS...)   │  Moving average             │  Smoothing   │
│  PERCENT_RANK()        │  Percentile (0-1 range)     │  Distribution│
│  CUME_DIST()           │  Cumulative distribution    │  Percentile  │
└─────────────────────────────────────────────────────────────────────┘
```

**Flow:**
- FUNCTION PURPOSE EXAMPLE
- ↓
- ROW_NUMBER() Sequential rank (no ties) Top N
- ↓
- RANK() Rank with gaps (1,2,2,4) Leaderboard
- ↓
- DENSE_RANK() Rank no gaps (1,2,2,3) Percentile
- ↓
- NTILE(n) Divide into n equal groups Quartiles
- ↓
- LAG(col, n) Previous row value Change
- ↓
- LEAD(col, n) Next row value Forecast

```mermaid
flowchart TD
    N1["FUNCTION PURPOSE EXAMPLE"]
    N2["ROW_NUMBER() Sequential rank (no ties) Top N"]
    N3["RANK() Rank with gaps (1,2,2,4) Leaderboard"]
    N4["DENSE_RANK() Rank no gaps (1,2,2,3) Percentile"]
    N5["NTILE(n) Divide into n equal groups Quartiles"]
    N6["LAG(col, n) Previous row value Change"]
    N7["LEAD(col, n) Next row value Forecast"]
    N8["FIRST_VALUE(col) First in window Baseline"]
    N1 --> N2
    N2 --> N3
    N3 --> N4
    N4 --> N5
    N5 --> N6
    N6 --> N7
    N7 --> N8
```

### Top N Per Group (Analyst's Best Friend)

```sql
-- Top 3 spending customers per country
WITH ranked AS (
    SELECT
        u.country,
        u.user_id,
        SUM(o.amount) AS total_spend,
        ROW_NUMBER() OVER (
            PARTITION BY u.country
            ORDER BY SUM(o.amount) DESC
        ) AS rank_in_country
    FROM users u
    JOIN orders o ON u.user_id = o.user_id
    WHERE o.status = 'completed'
    GROUP BY u.country, u.user_id
)
SELECT country, user_id, total_spend, rank_in_country
FROM ranked
WHERE rank_in_country <= 3
ORDER BY country, rank_in_country;
```

### Gap Analysis (Finding Missing Data)

```sql
-- Find dates with NO orders (gaps in time series)
WITH date_series AS (
    SELECT generate_series(
        '2024-01-01'::date,
        '2024-12-31'::date,
        '1 day'::interval
    )::date AS day
),
daily_orders AS (
    SELECT order_date, COUNT(*) AS order_count
    FROM orders GROUP BY order_date
)
SELECT
    ds.day,
    COALESCE(do.order_count, 0) AS orders,
    CASE WHEN do.order_count IS NULL THEN 'NO ORDERS!' ELSE 'OK' END AS status
FROM date_series ds
LEFT JOIN daily_orders do ON ds.day = do.order_date
WHERE do.order_count IS NULL
ORDER BY ds.day;
```

---

## 10. Session Analysis & User Journey

### Define Sessions from Events

```sql
-- A "session" = events within 30 minutes of each other
WITH events_with_gap AS (
    SELECT
        user_id,
        event_type,
        event_date,
        -- Time since previous event for this user
        EXTRACT(EPOCH FROM (event_date -
            LAG(event_date) OVER (PARTITION BY user_id ORDER BY event_date)
        )) / 60.0 AS minutes_since_prev
    FROM events
),
session_boundaries AS (
    SELECT
        *,
        -- New session if gap > 30 minutes or first event
        CASE WHEN minutes_since_prev > 30 OR minutes_since_prev IS NULL
             THEN 1 ELSE 0 END AS is_new_session
    FROM events_with_gap
),
sessions AS (
    SELECT
        *,
        SUM(is_new_session) OVER (
            PARTITION BY user_id
            ORDER BY event_date
        ) AS session_id
    FROM session_boundaries
)
-- Session metrics:
SELECT
    user_id,
    session_id,
    MIN(event_date) AS session_start,
    MAX(event_date) AS session_end,
    COUNT(*) AS events_in_session,
    EXTRACT(EPOCH FROM (MAX(event_date) - MIN(event_date))) / 60.0 AS session_duration_min,
    -- Did this session lead to a purchase?
    MAX(CASE WHEN event_type = 'purchase' THEN 1 ELSE 0 END) AS had_purchase
FROM sessions
GROUP BY user_id, session_id
ORDER BY user_id, session_start;
```

---

## 11. Real Interview Questions: Data Analyst SQL

### Q1: "Find the first purchase date for each user and their total lifetime value"

```sql
SELECT
    user_id,
    MIN(order_date) AS first_purchase_date,
    MAX(order_date) AS last_purchase_date,
    COUNT(order_id) AS lifetime_orders,
    SUM(amount) AS lifetime_value,
    ROUND(SUM(amount) / COUNT(order_id), 2) AS avg_order_value,
    MAX(order_date) - MIN(order_date) AS customer_lifetime_days
FROM orders
WHERE status = 'completed'
GROUP BY user_id
ORDER BY lifetime_value DESC;
```

### Q2: "Find users who purchased in January but NOT in February"

```sql
-- Analyst approach: set operations
SELECT user_id FROM orders WHERE DATE_TRUNC('month', order_date) = '2024-01-01'
EXCEPT
SELECT user_id FROM orders WHERE DATE_TRUNC('month', order_date) = '2024-02-01';

-- Or with LEFT JOIN (shows WHY they didn't purchase):
SELECT DISTINCT j.user_id
FROM orders j
LEFT JOIN orders f ON j.user_id = f.user_id
    AND DATE_TRUNC('month', f.order_date) = '2024-02-01'
WHERE DATE_TRUNC('month', j.order_date) = '2024-01-01'
AND f.user_id IS NULL;
```

### Q3: "Calculate the median order amount (not the average)"

```sql
-- Method 1: PERCENTILE_CONT (PostgreSQL)
SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount) AS median_amount
FROM orders WHERE status = 'completed';

-- Method 2: Universal (works everywhere)
SELECT AVG(amount) AS median_amount
FROM (
    SELECT amount,
        ROW_NUMBER() OVER (ORDER BY amount) AS rn,
        COUNT(*) OVER () AS total
    FROM orders WHERE status = 'completed'
) sub
WHERE rn IN (FLOOR((total + 1) / 2.0), CEIL((total + 1) / 2.0));
```

### Q4: "Find the longest streak of consecutive days a user logged in"

```sql
WITH daily_logins AS (
    SELECT DISTINCT user_id, DATE(event_date) AS login_date
    FROM events WHERE event_type = 'login'
),
with_groups AS (
    SELECT
        user_id,
        login_date,
        -- Subtract row_number (in days) from login_date
        -- Consecutive days will have the SAME group value
        login_date - (ROW_NUMBER() OVER (
            PARTITION BY user_id ORDER BY login_date
        ))::int AS streak_group
    FROM daily_logins
)
SELECT
    user_id,
    MIN(login_date) AS streak_start,
    MAX(login_date) AS streak_end,
    COUNT(*) AS streak_length
FROM with_groups
GROUP BY user_id, streak_group
ORDER BY streak_length DESC
LIMIT 10;
```

---

## 12. Quick Reference: Analyst SQL Cheat Sheet

| Analysis Type | Key SQL Techniques | Business Question |
|---|---|---|
| **Cohort Analysis** | DATE_TRUNC, age calculation, CASE WHEN pivot | "Are newer signups retaining better?" |
| **Funnel Analysis** | CASE WHEN flags, conditional COUNT DISTINCT | "Where do users drop off?" |
| **Retention** | Self-join on user activity, date arithmetic | "What % come back after day 7?" |
| **A/B Testing** | LEFT JOIN experiment to outcome, GROUP BY variant | "Did the change improve conversion?" |
| **RFM Segmentation** | NTILE(), multi-column scoring, CASE WHEN | "Who are our best customers?" |
| **Time Series** | LAG/LEAD, moving AVG, generate_series | "What's the trend over time?" |
| **Session Analysis** | LAG for gaps, SUM() OVER for session IDs | "How long are user sessions?" |
| **Top-N per Group** | ROW_NUMBER() OVER (PARTITION BY ... ORDER BY) | "Top 3 products per category?" |
| **YoY Comparison** | Self-join on month/year, % change calculation | "How does this January compare to last?" |
| **Streak Detection** | date - ROW_NUMBER trick, GROUP BY streak | "Longest consecutive active days?" |
| **Gap Detection** | generate_series + LEFT JOIN + IS NULL | "Which dates had no data?" |
| **Distribution** | NTILE, PERCENTILE_CONT, PERCENT_RANK | "What's the median? 90th percentile?" |

---

> **Navigation**: [< SQL Deep Reasoning](23_SQL_Deep_Reasoning.md) | [Back to Index](../00_MASTER_INDEX.md) | [DSA Java Mastery >](../03_Algorithms/17_DSA_Java_Implementation_Mastery.md)
