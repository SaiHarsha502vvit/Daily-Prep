**Navigation**: [Back to Index](00_INDEX.md) | [< Prev](27_Python_SQL_Visualization.md) | [Next >](29_Data_Analytics_Advanced.md)

# Chapter 28 — Data Analytics: Intermediate

## 5W-H Framework

- **WHO** needs this? → Data analysts, product managers, growth hackers, business intelligence devs
- **WHAT** is it? → Using SQL + Python to answer business questions: segmentation, funnels, retention, KPIs
- **WHEN** to use? → Weekly/monthly reporting, product decisions, marketing optimization, exec dashboards
- **WHERE** is it used? → E-commerce, SaaS, fintech, healthcare — any business with user/transaction data
- **WHY** learn it? → SQL writes queries; analytics tells STORIES. Companies pay for insights, not queries
- **HOW** does it work? → Business question → SQL query → Python processing → Visualization → Insight → Action

---

## Part 1 — Cohort Analysis

### 1.1 What Is Cohort Analysis?

```
COHORT = A group of users who share a common starting event in a time period.

Example: "All users who signed up in January 2026" = January cohort

WHY?  → Measure how user behavior CHANGES over time
       → Are newer users better/worse than older ones?
       → Is our product improving?

                    Month 0   Month 1   Month 2   Month 3
Jan 2026 cohort:    100%      45%       30%       22%
Feb 2026 cohort:    100%      52%       38%       —
Mar 2026 cohort:    100%      48%       —         —

Reading: "Of users who signed up in Jan, 45% came back in month 1"
```

### 1.2 Cohort Retention Query

```sql
-- Step 1: Find each user's cohort (first purchase month)
WITH user_cohorts AS (
    SELECT
        user_id,
        DATE_TRUNC('month', MIN(order_date)) AS cohort_month
    FROM orders
    GROUP BY user_id
),

-- Step 2: Calculate month number for each subsequent activity
user_activities AS (
    SELECT
        uc.user_id,
        uc.cohort_month,
        DATE_TRUNC('month', o.order_date) AS activity_month,
        -- Month difference from cohort start
        EXTRACT(YEAR FROM AGE(DATE_TRUNC('month', o.order_date), uc.cohort_month)) * 12 +
        EXTRACT(MONTH FROM AGE(DATE_TRUNC('month', o.order_date), uc.cohort_month)) AS month_number
    FROM orders o
    JOIN user_cohorts uc ON o.user_id = uc.user_id
),

-- Step 3: Count unique users per cohort per month
cohort_data AS (
    SELECT
        cohort_month,
        month_number,
        COUNT(DISTINCT user_id) AS users
    FROM user_activities
    GROUP BY cohort_month, month_number
),

-- Step 4: Get cohort sizes (month 0)
cohort_sizes AS (
    SELECT cohort_month, users AS cohort_size
    FROM cohort_data
    WHERE month_number = 0
)

-- Step 5: Calculate retention percentage
SELECT
    cd.cohort_month,
    cd.month_number,
    cd.users,
    cs.cohort_size,
    ROUND(100.0 * cd.users / cs.cohort_size, 1) AS retention_pct
FROM cohort_data cd
JOIN cohort_sizes cs ON cd.cohort_month = cs.cohort_month
ORDER BY cd.cohort_month, cd.month_number;
```

### 1.3 Python Visualization

```python
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

# Assume df has: cohort_month, month_number, retention_pct
pivot = df.pivot_table(index='cohort_month', columns='month_number',
                       values='retention_pct')

fig, ax = plt.subplots(figsize=(14, 8))
sns.heatmap(pivot, annot=True, fmt='.0f', cmap='YlGnBu',
            vmin=0, vmax=100, linewidths=0.5, ax=ax)
ax.set_title('Monthly User Retention by Cohort (%)', fontsize=16, fontweight='bold')
ax.set_xlabel('Months Since First Purchase')
ax.set_ylabel('Cohort (First Purchase Month)')
plt.tight_layout()
plt.show()
```

---

## Part 2 — Funnel Analysis

### 2.1 What Is a Funnel?

```
A funnel tracks users through sequential steps.
Each step has DROP-OFF — users who don't continue.

                    ┌─────────────────────────┐
 Step 1: Visit      │ 10,000 users (100%)     │
                    └────────────┬────────────┘
                                 │ 40% drop-off
                    ┌────────────▼────────────┐
 Step 2: Sign Up    │ 6,000 users (60%)       │
                    └────────────┬────────────┘
                                 │ 33% drop-off
                    ┌────────────▼────────────┐
 Step 3: Add to Cart│ 4,000 users (40%)       │
                    └────────────┬────────────┘
                                 │ 50% drop-off
                    ┌────────────▼────────────┐
 Step 4: Purchase   │ 2,000 users (20%)       │
                    └────────────┬────────────┘
                                 │ 75% drop-off
                    ┌────────────▼────────────┐
 Step 5: Repeat Buy │ 500 users (5%)          │
                    └─────────────────────────┘

Overall conversion: 10,000 → 500 = 5%
Biggest leak: Step 4→5 (75% drop-off) → Focus retention efforts here!
```

### 2.2 Funnel Query

```sql
WITH funnel AS (
    SELECT
        COUNT(DISTINCT CASE WHEN event = 'page_view' THEN user_id END) AS step1_visit,
        COUNT(DISTINCT CASE WHEN event = 'signup' THEN user_id END) AS step2_signup,
        COUNT(DISTINCT CASE WHEN event = 'add_to_cart' THEN user_id END) AS step3_cart,
        COUNT(DISTINCT CASE WHEN event = 'checkout_start' THEN user_id END) AS step4_checkout,
        COUNT(DISTINCT CASE WHEN event = 'purchase' THEN user_id END) AS step5_purchase
    FROM user_events
    WHERE event_date BETWEEN '2026-02-01' AND '2026-02-28'
)
SELECT
    'Visit' AS step, step1_visit AS users, 100.0 AS pct FROM funnel
UNION ALL
SELECT 'Signup', step2_signup, ROUND(100.0 * step2_signup / step1_visit, 1) FROM funnel
UNION ALL
SELECT 'Add to Cart', step3_cart, ROUND(100.0 * step3_cart / step1_visit, 1) FROM funnel
UNION ALL
SELECT 'Checkout', step4_checkout, ROUND(100.0 * step4_checkout / step1_visit, 1) FROM funnel
UNION ALL
SELECT 'Purchase', step5_purchase, ROUND(100.0 * step5_purchase / step1_visit, 1) FROM funnel;
```

### 2.3 Python Funnel Visualization

```python
import plotly.express as px

steps = ['Visit', 'Signup', 'Add to Cart', 'Checkout', 'Purchase']
users = [10000, 6000, 4000, 2500, 2000]

fig = px.funnel(y=steps, x=users,
                title='E-Commerce Conversion Funnel — Feb 2026')
fig.update_traces(textinfo='value+percent initial')
fig.show()
```

---

## Part 3 — RFM Segmentation

### 3.1 What Is RFM?

```
RFM = Recency × Frequency × Monetary

R (Recency)  → How RECENTLY did this customer purchase?
               (Lower = better — they bought recently)
F (Frequency) → How OFTEN do they purchase?
               (Higher = better — they buy frequently)
M (Monetary)  → How MUCH do they spend?
               (Higher = better — they spend more)

Each dimension scored 1-5 → Creates customer segments:

Score 555 → Champions (recent, frequent, high-spending)
Score 511 → New customers (recent, first purchase, low amount)
Score 155 → Can't lose (old but were VIPs — win them back!)
Score 111 → Lost (haven't bought, rarely did, little spent)
```

### 3.2 RFM Query

```sql
WITH rfm_raw AS (
    SELECT
        customer_id,
        -- Recency: days since last purchase (lower = more recent)
        CURRENT_DATE - MAX(order_date)::date AS recency_days,
        -- Frequency: total number of orders
        COUNT(DISTINCT order_id) AS frequency,
        -- Monetary: total amount spent
        SUM(total_amount) AS monetary
    FROM orders
    WHERE order_date >= CURRENT_DATE - INTERVAL '2 years'
    GROUP BY customer_id
),
rfm_scores AS (
    SELECT *,
        NTILE(5) OVER (ORDER BY recency_days DESC) AS r_score,  -- 5=most recent
        NTILE(5) OVER (ORDER BY frequency ASC) AS f_score,       -- 5=most frequent
        NTILE(5) OVER (ORDER BY monetary ASC) AS m_score         -- 5=highest spend
    FROM rfm_raw
)
SELECT
    customer_id,
    recency_days, frequency, monetary,
    r_score, f_score, m_score,
    CONCAT(r_score, f_score, m_score) AS rfm_segment,
    CASE
        WHEN r_score >= 4 AND f_score >= 4 AND m_score >= 4 THEN 'Champions'
        WHEN r_score >= 4 AND f_score >= 3 THEN 'Loyal Customers'
        WHEN r_score >= 4 AND f_score <= 2 THEN 'New Customers'
        WHEN r_score >= 3 AND f_score >= 3 THEN 'Potential Loyalists'
        WHEN r_score <= 2 AND f_score >= 4 AND m_score >= 4 THEN 'Cant Lose'
        WHEN r_score <= 2 AND f_score <= 2 THEN 'Lost'
        WHEN r_score = 3 AND f_score <= 2 THEN 'About to Sleep'
        WHEN r_score <= 2 AND f_score >= 3 THEN 'At Risk'
        ELSE 'Need Attention'
    END AS segment_name
FROM rfm_scores
ORDER BY monetary DESC;
```

### 3.3 Python Visualization

```python
import matplotlib.pyplot as plt

# Count customers per segment
segment_counts = df['segment_name'].value_counts()

fig, axes = plt.subplots(1, 2, figsize=(16, 6))

# Bar chart of segment sizes
colors = ['#2ecc71', '#3498db', '#9b59b6', '#e74c3c', '#f39c12',
          '#1abc9c', '#e67e22', '#95a5a6', '#34495e']
axes[0].barh(segment_counts.index, segment_counts.values, color=colors[:len(segment_counts)])
axes[0].set_title('Customers per RFM Segment', fontweight='bold')
axes[0].set_xlabel('Number of Customers')

# Scatter: Recency vs Monetary, colored by segment
scatter = axes[1].scatter(df['recency_days'], df['monetary'],
                          c=df['r_score'], cmap='RdYlGn', alpha=0.6, s=30)
axes[1].set_xlabel('Recency (Days Since Last Purchase)')
axes[1].set_ylabel('Total Monetary Value ($)')
axes[1].set_title('RFM: Recency vs Monetary', fontweight='bold')
plt.colorbar(scatter, ax=axes[1], label='Recency Score')

plt.tight_layout()
plt.show()
```

---

## Part 4 — Moving Averages & Trend Analysis

### 4.1 Moving Averages in SQL

```sql
SELECT
    date,
    daily_revenue,
    -- Simple Moving Average (7-day)
    AVG(daily_revenue) OVER (
        ORDER BY date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS sma_7,
    -- Simple Moving Average (30-day)
    AVG(daily_revenue) OVER (
        ORDER BY date
        ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
    ) AS sma_30,
    -- Exponential-like weighted (approximate)
    -- Recent days weighted more heavily
    SUM(daily_revenue * (ROW_NUMBER() OVER (ORDER BY date))) OVER (
        ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) / SUM(ROW_NUMBER() OVER (ORDER BY date)) OVER (
        ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS weighted_avg_7
FROM daily_metrics
ORDER BY date;
```

### 4.2 Year-over-Year Comparison

```sql
SELECT
    DATE_TRUNC('month', order_date) AS month,
    SUM(amount) AS revenue,
    -- Same month last year
    LAG(SUM(amount), 12) OVER (ORDER BY DATE_TRUNC('month', order_date)) AS revenue_last_year,
    -- YoY Growth %
    ROUND(
        100.0 * (SUM(amount) - LAG(SUM(amount), 12) OVER (ORDER BY DATE_TRUNC('month', order_date)))
        / NULLIF(LAG(SUM(amount), 12) OVER (ORDER BY DATE_TRUNC('month', order_date)), 0),
        1
    ) AS yoy_growth_pct
FROM orders
GROUP BY DATE_TRUNC('month', order_date)
ORDER BY month;
```

### 4.3 Python Trend Visualization

```python
fig, ax = plt.subplots(figsize=(14, 6))
ax.plot(df['date'], df['daily_revenue'], alpha=0.3, label='Daily Revenue')
ax.plot(df['date'], df['sma_7'], linewidth=2, label='7-day MA')
ax.plot(df['date'], df['sma_30'], linewidth=2, label='30-day MA')
ax.fill_between(df['date'], df['sma_7'], df['sma_30'], alpha=0.1,
                where=df['sma_7'] > df['sma_30'], color='green', label='Bullish')
ax.fill_between(df['date'], df['sma_7'], df['sma_30'], alpha=0.1,
                where=df['sma_7'] <= df['sma_30'], color='red', label='Bearish')
ax.set_title('Revenue Trend: Moving Averages', fontweight='bold')
ax.legend()
plt.tight_layout()
plt.show()
```

---

## Part 5 — Customer Lifetime Value (CLV)

### 5.1 What Is CLV?

```
CLV = How much total revenue a customer will generate over their lifetime

WHY CARE?
- Spend up to CLV to acquire a customer (CAC < CLV → profitable)
- Focus retention on high-CLV customers
- Predict future revenue

Simple CLV = Avg Order Value × Purchase Frequency × Customer Lifespan

                   AOV          ×        Freq        ×      Lifespan
Example:          $50/order     ×      4x/year       ×     3 years     = $600 CLV
```

### 5.2 CLV Query

```sql
WITH customer_metrics AS (
    SELECT
        customer_id,
        COUNT(DISTINCT order_id) AS total_orders,
        SUM(amount) AS total_revenue,
        AVG(amount) AS avg_order_value,
        MIN(order_date) AS first_purchase,
        MAX(order_date) AS last_purchase,
        -- Customer lifespan in months
        EXTRACT(EPOCH FROM (MAX(order_date) - MIN(order_date))) / (30*86400) AS lifespan_months,
        -- Average days between purchases
        CASE WHEN COUNT(*) > 1
            THEN EXTRACT(EPOCH FROM (MAX(order_date) - MIN(order_date))) / (COUNT(*) - 1) / 86400
            ELSE NULL
        END AS avg_days_between_purchases
    FROM orders
    GROUP BY customer_id
    HAVING COUNT(*) >= 2  -- Need at least 2 purchases to calculate frequency
)
SELECT
    customer_id,
    total_orders,
    ROUND(total_revenue::numeric, 2) AS total_revenue,
    ROUND(avg_order_value::numeric, 2) AS avg_order_value,
    ROUND(lifespan_months::numeric, 1) AS lifespan_months,
    ROUND(avg_days_between_purchases::numeric, 0) AS avg_days_between,
    -- Simple CLV projection (project 3 years)
    ROUND((avg_order_value * (365.0 / NULLIF(avg_days_between_purchases, 0)) * 3)::numeric, 2) AS projected_clv_3yr,
    -- CLV tier
    CASE
        WHEN total_revenue > 1000 THEN 'Platinum'
        WHEN total_revenue > 500 THEN 'Gold'
        WHEN total_revenue > 200 THEN 'Silver'
        ELSE 'Bronze'
    END AS clv_tier
FROM customer_metrics
ORDER BY total_revenue DESC;
```

---

🔬 **Section Challenge — Part 5 — Customer Lifetime Value (CLV)**

**Challenge 1 (Reasoning):** A CLV query classifies customers into Bronze/Silver/Gold/Platinum tiers. Which constraints can make those tiers misleading?

<details><summary>Trace, Reasoning & Debug</summary>

Raw revenue tiers can mislead when returns, discounts, shipping, taxes, one-time bulk purchases, or different customer ages are ignored. A fair CLV model should define the time window, use net revenue or margin when possible, normalize by customer age/cohort, and separate active customers from churned customers before assigning tiers.

</details>

## Part 6 — Churn Analysis

### 6.1 Churn Detection

```sql
-- Define churn: no purchase in last 90 days (for a business with ~monthly purchases)
WITH customer_activity AS (
    SELECT
        customer_id,
        MAX(order_date) AS last_purchase,
        COUNT(*) AS total_orders,
        SUM(amount) AS total_spent,
        CURRENT_DATE - MAX(order_date)::date AS days_since_last
    FROM orders
    GROUP BY customer_id
)
SELECT
    customer_id,
    last_purchase,
    days_since_last,
    total_orders,
    total_spent,
    CASE
        WHEN days_since_last <= 30 THEN 'Active'
        WHEN days_since_last <= 60 THEN 'Cooling'
        WHEN days_since_last <= 90 THEN 'At Risk'
        ELSE 'Churned'
    END AS status
FROM customer_activity
ORDER BY days_since_last DESC;
```

### 6.2 Churn Rate Over Time

```sql
WITH monthly_active AS (
    SELECT
        DATE_TRUNC('month', order_date) AS month,
        COUNT(DISTINCT customer_id) AS active_customers
    FROM orders
    GROUP BY DATE_TRUNC('month', order_date)
),
monthly_new AS (
    SELECT
        DATE_TRUNC('month', MIN(order_date)) AS month,
        COUNT(DISTINCT customer_id) AS new_customers
    FROM orders
    GROUP BY customer_id
)
SELECT
    ma.month,
    ma.active_customers,
    COALESCE(mn.new_customers, 0) AS new_customers,
    LAG(ma.active_customers) OVER (ORDER BY ma.month) AS prev_month_active,
    -- Churn rate: (prev_active + new - current_active) / prev_active
    ROUND(
        100.0 * (LAG(ma.active_customers) OVER (ORDER BY ma.month)
                 + COALESCE(mn.new_customers, 0)
                 - ma.active_customers)
        / NULLIF(LAG(ma.active_customers) OVER (ORDER BY ma.month), 0),
        1
    ) AS churn_rate_pct
FROM monthly_active ma
LEFT JOIN (SELECT month, SUM(new_customers) AS new_customers FROM monthly_new GROUP BY month) mn
    ON ma.month = mn.month
ORDER BY ma.month;
```

---

## Part 7 — Market Basket Analysis

### 7.1 What Products Are Bought Together?

```sql
-- Find product pairs frequently bought together
WITH order_products AS (
    SELECT DISTINCT order_id, product_id, product_name
    FROM order_items
)
SELECT
    a.product_name AS product_a,
    b.product_name AS product_b,
    COUNT(*) AS times_bought_together,
    -- Support: % of all orders containing this pair
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(DISTINCT order_id) FROM orders), 2) AS support_pct,
    -- Confidence: if bought A, probability of also buying B
    ROUND(100.0 * COUNT(*) /
        (SELECT COUNT(DISTINCT order_id) FROM order_items WHERE product_name = a.product_name),
        2) AS confidence_a_to_b
FROM order_products a
JOIN order_products b ON a.order_id = b.order_id AND a.product_id < b.product_id
GROUP BY a.product_name, b.product_name
HAVING COUNT(*) >= 10  -- Minimum co-occurrence threshold
ORDER BY times_bought_together DESC
LIMIT 20;
```

---

## Part 8 — KPI Dashboard Queries

### 8.1 Essential Business KPIs

```sql
-- All-in-one KPI query
SELECT
    -- Revenue KPIs
    SUM(amount) AS total_revenue,
    AVG(amount) AS avg_order_value,
    COUNT(DISTINCT order_id) AS total_orders,

    -- Customer KPIs
    COUNT(DISTINCT customer_id) AS unique_customers,
    SUM(amount) / COUNT(DISTINCT customer_id) AS revenue_per_customer,

    -- Growth KPIs (vs last month)
    SUM(CASE WHEN order_date >= DATE_TRUNC('month', CURRENT_DATE) THEN amount ELSE 0 END) AS mtd_revenue,
    SUM(CASE WHEN order_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
             AND order_date < DATE_TRUNC('month', CURRENT_DATE) THEN amount ELSE 0 END) AS last_month_revenue,

    -- New vs returning
    COUNT(DISTINCT CASE WHEN is_first_order THEN customer_id END) AS new_customers,
    COUNT(DISTINCT CASE WHEN NOT is_first_order THEN customer_id END) AS returning_customers
FROM orders
WHERE order_date >= CURRENT_DATE - INTERVAL '2 months';
```

### 8.2 Daily Metrics Trend

```sql
SELECT
    order_date::date AS date,
    COUNT(*) AS orders,
    COUNT(DISTINCT customer_id) AS customers,
    SUM(amount) AS revenue,
    AVG(amount) AS aov,
    -- Running totals
    SUM(SUM(amount)) OVER (ORDER BY order_date::date) AS cumulative_revenue,
    -- 7-day averages
    AVG(COUNT(*)) OVER (ORDER BY order_date::date ROWS 6 PRECEDING) AS avg_daily_orders_7d,
    AVG(SUM(amount)) OVER (ORDER BY order_date::date ROWS 6 PRECEDING) AS avg_daily_revenue_7d
FROM orders
WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY order_date::date
ORDER BY date;
```

---

## Real-World Practice — Build These Dashboards

| #   | Dashboard               | Key Metrics                                         | Charts                  |
| --- | ----------------------- | --------------------------------------------------- | ----------------------- |
| 1   | **Executive Dashboard** | Revenue, Orders, AOV, Customers                     | Line trends + KPI cards |
| 2   | **Customer Health**     | Cohort retention, Churn rate, CLV distribution      | Heatmap + funnel        |
| 3   | **Product Performance** | Top sellers, Revenue by category, Basket analysis   | Bar + treemap           |
| 4   | **Marketing Funnel**    | Conversion rates per stage, Drop-off analysis       | Funnel + waterfall      |
| 5   | **Regional Analysis**   | Revenue by region, Growth rates, Market penetration | Choropleth + bar        |

---

### Historical Evolution

**Predecessors (with years):**
- **OLAP (Codd)** (1993): E.F. Codd defined online analytical processing with 12 rules distinguishing OLAP from OLTP systems
- **RFM Analysis** (1960s): Recency, Frequency, Monetary analysis emerged in direct marketing to predict customer response patterns
- **Cohort Analysis** (2000s): Emerged from academic retention studies, later adopted by SaaS companies to track user behavior over time
- **KPI Dashboards** (2000s): Business intelligence tools like Business Objects and MicroStrategy formalized metric monitoring for executives

**Evolution narrative:**
Business analytics evolved from simple reporting (what happened) toward diagnostic analysis (why it happened). RFM analysis from direct marketing pioneered customer segmentation by behavior, while cohort analysis added the temporal dimension of tracking groups over time. The OLAP cube model (Codd 1993) formalized multi-dimensional analysis, and KPI dashboards emerged as organizations recognized that raw data without interpretive context was insufficient for decision-making. SQL aggregation functions became the practical tool implementing these analytical frameworks.

**Modern practice anchor:**
Modern intermediate analytics combines SQL aggregations for KPI computation, cohort analysis with window functions for retention tracking, and funnel analysis for conversion optimization—all powered by modern BI tools that connect directly to data warehouses.

### Production Reality

**Failure modes:**
1. **Cohort miscalculation across timezone boundaries**: `DATE_TRUNC('month', signup_date)` stores UTC dates. A user in UTC+8 who signs up at 2024-01-31 23:00 UTC (2024-02-01 07:00 in their timezone) gets assigned to February cohort in UTC but expects January cohort. With 30% of users in Asia-Pacific, monthly cohort reports show 8-12% of users in the wrong cohort month, distorting retention curves.
2. **CLV formula errors on short-history customers**: `avg_order_value * (365.0 / avg_days_between) * 3` projects CLV for all customers using the same formula. A customer with 2 orders in 1 day (avg gap = 0.5 days) gets projected CLV = $500 × 730 × 3 = $1.1M — absurd. The formula treats zero-day gaps as infinite purchase frequency.
3. **RFM scoring outliers distort quintiles**: NTILE(5) on `monetary` puts a $500K customer in the top 20% (score=5) alongside a $10K customer. When segments are used for campaign budgets, both get the same treatment, wasting spend on the $500K customer who would have purchased anyway.

**Debug workflow:**
1. Normalize all dates to a single timezone before cohort assignment: `DATE_TRUNC('month', signup_date AT TIME ZONE 'UTC' AT TIME ZONE user_timezone)`. Validate by checking min/max signup_date per cohort — if cohorts span more than one calendar month, timezone mismatch is likely.
2. Add a minimum observation window before CLV projection: `HAVING AVG(days_between) >= 7 AND total_orders >= 2` — this excludes customers with insufficient purchase history for reliable frequency estimation.
3. After RFM scoring, validate quintile boundaries: `SELECT monetary_quintile, MIN(monetary), MAX(monetary), COUNT(*) FROM rfm_scores GROUP BY monetary_quintile ORDER BY monetary_quintile` — if top quintile spans $10K-$500K, use `PERCENTILE_CONT(0.8)` within group boundaries instead of global NTILE.

**Modern practice anchor:**
Production analytics requires timezone-aware cohort assignment, minimum observation windows before CLV projection, and segment boundary validation (not just score distribution) before campaign deployment.

---

## Reality Check

**"Year-over-year comparison is always meaningful"** ? Comparing this June to last June assumes comparable conditions. If the company launched in 3 new countries, grew from 10 to 50 employees, or changed pricing, the year-over-year comparison conflates growth effects with organic change. Normalize comparisons: revenue per customer, conversion rate per cohort, or same-store sales. Raw number comparisons across different scales mislead.

**"Correlation implies causation in data analysis"** ? Two metrics trending together (website visits and sales) could be: causal (visits drive sales), reverse-causal (sales drive visits via word-of-mouth), jointly caused by a third variable (marketing campaign drives both), or coincidental. SQL can identify correlations through JOINs and aggregations but cannot distinguish causation. That requires controlled experiments (A/B tests) or causal inference frameworks.

**"Averages represent the typical value"** ? In a right-skewed distribution (income, response times, order values), the mean is pulled higher by outliers. Median is resistant to outliers. Mode shows the most common value. For response time analysis, the P50 (median) might be 100ms while the P99 is 5000ms � meaning 1 percent of users experience 50x worse performance. Report percentiles, not just averages.

**"Cohort analysis requires special tools"** ? Cohort analysis groups users by their start date and tracks behavior over time. This is a SQL query: GROUP BY user_signup_month and DATEDIFF between signup and action. The insight is retention curves: what percentage of January signups are still active in month 3? Comparing cohort curves reveals whether product changes improve retention for new cohorts. It is a query pattern, not a tool feature.

**"More dimensions in GROUP BY provide more insight"** ? Grouping by region, product, date, customer_segment, and channel creates thousands of groups with tiny sample sizes. A group with 3 data points showing 67 percent conversion is not statistically meaningful. Start with one dimension, understand the pattern, then add a second dimension to explain anomalies. Never interpret metrics from groups with fewer than 30 observations.
