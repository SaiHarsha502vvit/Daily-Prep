**Navigation**: [Back to Index](00_INDEX.md) | [< Prev](28_Data_Analytics_Intermediate.md) | [Next >](30_Recursive_Queries_Hierarchical.md)

# Chapter 29 — Data Analytics: Advanced

## 5W-H Framework

- **WHO** needs this? → Senior data analysts, data scientists, analytics engineers, growth leads
- **WHAT** is it? → Advanced statistical analytics: A/B testing, predictive modeling, anomaly detection, ML-prep
- **WHEN** to use? → Feature launches, pricing experiments, fraud detection, forecasting, ML pipelines
- **WHERE** is it used? → Tech companies (FAANG), fintech, e-commerce, ad-tech — any data-driven org
- **WHY** learn it? → This separates DATA ANALYSTS from DATA SCIENTISTS — the $30K+ salary difference
- **HOW** does it work? → SQL for data extraction + Python (scipy, sklearn) for statistical analysis + viz

---

## Part 1 — A/B Testing with SQL + Python

### 1.1 What Is A/B Testing?

```
A/B Test = Show version A to half your users, version B to the other half.
           Measure which performs better WITH STATISTICAL CONFIDENCE.

                    ┌─────────────────┐
                    │   All Users     │
                    └────────┬────────┘
                             │ Random Split
                    ┌────────┴────────┐
              ┌─────▼─────┐    ┌──────▼─────┐
              │ Control A  │    │ Variant B  │
              │ (old page) │    │ (new page) │
              └─────┬─────┘    └──────┬─────┘
                    │                 │
              10% convert       12% convert
                    │                 │
              IS THE 2% DIFFERENCE REAL OR JUST NOISE?
              → Statistical test answers this!
```

### 1.2 A/B Test Data Query

```sql
-- Extract A/B test results
WITH test_data AS (
    SELECT
        user_id,
        test_group,  -- 'control' or 'variant'
        CASE WHEN purchase_amount > 0 THEN 1 ELSE 0 END AS converted,
        purchase_amount
    FROM ab_test_results
    WHERE test_name = 'homepage_redesign_v2'
    AND test_start_date BETWEEN '2026-02-01' AND '2026-02-28'
)
SELECT
    test_group,
    COUNT(*) AS total_users,
    SUM(converted) AS conversions,
    ROUND(100.0 * SUM(converted) / COUNT(*), 2) AS conversion_rate,
    ROUND(AVG(purchase_amount), 2) AS avg_purchase,
    ROUND(SUM(purchase_amount), 2) AS total_revenue
FROM test_data
GROUP BY test_group;
```

### 1.3 Statistical Significance in Python

```python
import pandas as pd
from scipy import stats
import numpy as np




# Load A/B test data
df = pd.read_sql("""
    SELECT user_id, test_group,
           CASE WHEN purchase_amount > 0 THEN 1 ELSE 0 END AS converted,
           purchase_amount
    FROM ab_test_results
    WHERE test_name = 'homepage_redesign_v2'
""", conn)

control = df[df['test_group'] == 'control']
variant = df[df['test_group'] == 'variant']

# === Test 1: Conversion Rate (proportions) ===
# Chi-squared test for independence
contingency = pd.crosstab(df['test_group'], df['converted'])
chi2, p_value, dof, expected = stats.chi2_contingency(contingency)

print(f"Control conversion: {control['converted'].mean():.4f}")
print(f"Variant conversion: {variant['converted'].mean():.4f}")
print(f"Chi-squared p-value: {p_value:.4f}")
print(f"Significant at 95%? {'YES ✅' if p_value < 0.05 else 'NO ❌'}")

# === Test 2: Revenue per User (continuous) ===
# Mann-Whitney U test (non-parametric, better for skewed revenue data)
stat, p_value_rev = stats.mannwhitneyu(
    control['purchase_amount'],
    variant['purchase_amount'],
    alternative='two-sided'
)
print(f"\nControl avg revenue: ${control['purchase_amount'].mean():.2f}")
print(f"Variant avg revenue: ${variant['purchase_amount'].mean():.2f}")
print(f"Mann-Whitney p-value: {p_value_rev:.4f}")

# === Test 3: Sample Size Calculator ===
from statsmodels.stats.power import NormalIndPower
power_analysis = NormalIndPower()
# How many users do we need for a 2% lift with 80% power?
sample_size = power_analysis.solve_power(
    effect_size=0.02/np.sqrt(0.10*0.90),  # Cohen's h for proportions
    alpha=0.05,
    power=0.80,
    alternative='two-sided'
)
print(f"\nRequired sample size per group: {int(np.ceil(sample_size))}")
```

### 1.4 A/B Test Visualization

```python
import matplotlib.pyplot as plt
import numpy as np

fig, axes = plt.subplots(1, 3, figsize=(18, 5))

# Chart 1: Conversion rates with confidence intervals
groups = ['Control', 'Variant']
rates = [control['converted'].mean(), variant['converted'].mean()]
ci = [1.96 * np.sqrt(r*(1-r)/len(control)) for r in rates]  # 95% CI
colors = ['#3498db', '#e74c3c']
axes[0].bar(groups, rates, yerr=ci, capsize=10, color=colors, edgecolor='black')
axes[0].set_ylabel('Conversion Rate')
axes[0].set_title('Conversion Rate Comparison')

# Chart 2: Revenue distribution
axes[1].hist(control['purchase_amount'], bins=30, alpha=0.6, color='#3498db', label='Control')
axes[1].hist(variant['purchase_amount'], bins=30, alpha=0.6, color='#e74c3c', label='Variant')
axes[1].set_title('Revenue Distribution')
axes[1].legend()

# Chart 3: Cumulative conversion over time
for group, color, label in [('control', '#3498db', 'Control'), ('variant', '#e74c3c', 'Variant')]:
    grp = df[df['test_group'] == group].sort_values('signup_date')
    grp['cumulative_rate'] = grp['converted'].expanding().mean()
    axes[2].plot(range(len(grp)), grp['cumulative_rate'], color=color, label=label)
axes[2].set_title('Cumulative Conversion Rate')
axes[2].legend()

plt.tight_layout()
plt.show()
```

---

## Part 2 — Anomaly Detection

### 2.1 SQL-Based Anomaly Detection

```sql
-- Z-score method: flag values > 3 standard deviations from mean
WITH stats AS (
    SELECT
        AVG(daily_revenue) AS mean_rev,
        STDDEV(daily_revenue) AS std_rev
    FROM daily_metrics
    WHERE date >= CURRENT_DATE - INTERVAL '90 days'
),
scored AS (
    SELECT
        dm.date,
        dm.daily_revenue,
        s.mean_rev,
        s.std_rev,
        (dm.daily_revenue - s.mean_rev) / NULLIF(s.std_rev, 0) AS z_score
    FROM daily_metrics dm
    CROSS JOIN stats s
    WHERE dm.date >= CURRENT_DATE - INTERVAL '90 days'
)
SELECT
    date,
    daily_revenue,
    ROUND(z_score::numeric, 2) AS z_score,
    CASE
        WHEN ABS(z_score) > 3 THEN '🔴 CRITICAL'
        WHEN ABS(z_score) > 2 THEN '🟡 WARNING'
        ELSE '🟢 NORMAL'
    END AS status
FROM scored
ORDER BY date DESC;
```

### 2.2 IQR Method (Robust to Outliers)

```sql
WITH percentiles AS (
    SELECT
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY amount) AS q1,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY amount) AS q3
    FROM orders
    WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
),
bounds AS (
    SELECT
        q1,
        q3,
        q3 - q1 AS iqr,
        q1 - 1.5 * (q3 - q1) AS lower_bound,
        q3 + 1.5 * (q3 - q1) AS upper_bound
    FROM percentiles
)
SELECT
    o.order_id,
    o.amount,
    b.lower_bound,
    b.upper_bound,
    CASE
        WHEN o.amount < b.lower_bound THEN 'Unusually LOW'
        WHEN o.amount > b.upper_bound THEN 'Unusually HIGH'
        ELSE 'Normal'
    END AS anomaly_status
FROM orders o
CROSS JOIN bounds b
WHERE o.order_date >= CURRENT_DATE - INTERVAL '30 days'
AND (o.amount < b.lower_bound OR o.amount > b.upper_bound)
ORDER BY o.amount DESC;
```

### 2.3 Python: Isolation Forest for Complex Anomalies

```python
from sklearn.ensemble import IsolationForest
import pandas as pd

# Multi-feature anomaly detection
df = pd.read_sql("""
    SELECT
        user_id, order_count, total_spent, avg_order_value,
        days_since_signup, login_count
    FROM user_metrics
""", conn)

features = ['order_count', 'total_spent', 'avg_order_value', 'days_since_signup', 'login_count']
X = df[features].fillna(0)

# Fit Isolation Forest
iso = IsolationForest(contamination=0.05, random_state=42)  # Expect 5% anomalies
df['anomaly'] = iso.fit_predict(X)  # 1=normal, -1=anomaly
df['anomaly_score'] = iso.decision_function(X)

# Anomalous users
anomalies = df[df['anomaly'] == -1].sort_values('anomaly_score')
print(f"Found {len(anomalies)} anomalous users out of {len(df)}")
print(anomalies[['user_id'] + features + ['anomaly_score']].head(10))
```

---

## Part 3 — Predictive Analytics

### 3.1 Churn Prediction: SQL Feature Engineering

```sql
-- Build features for churn prediction model
WITH user_features AS (
    SELECT
        u.user_id,
        -- Recency features
        CURRENT_DATE - MAX(o.order_date)::date AS days_since_last_order,
        CURRENT_DATE - MIN(o.order_date)::date AS account_age_days,

        -- Frequency features
        COUNT(DISTINCT o.order_id) AS total_orders,
        COUNT(DISTINCT DATE_TRUNC('month', o.order_date)) AS active_months,

        -- Monetary features
        SUM(o.amount) AS total_spent,
        AVG(o.amount) AS avg_order_value,
        MAX(o.amount) AS max_order_value,
        STDDEV(o.amount) AS order_value_stddev,

        -- Behavioral features
        COUNT(DISTINCT o.product_category) AS categories_purchased,
        AVG(o.items_count) AS avg_items_per_order,

        -- Trend features
        SUM(CASE WHEN o.order_date >= CURRENT_DATE - 30 THEN 1 ELSE 0 END) AS orders_last_30d,
        SUM(CASE WHEN o.order_date >= CURRENT_DATE - 90 THEN 1 ELSE 0 END) AS orders_last_90d,

        -- Target: churned if no order in 60 days
        CASE WHEN CURRENT_DATE - MAX(o.order_date)::date > 60 THEN 1 ELSE 0 END AS churned
    FROM users u
    LEFT JOIN orders o ON u.user_id = o.user_id
    GROUP BY u.user_id
    HAVING COUNT(o.order_id) >= 2  -- Need history to predict
)
SELECT * FROM user_features;
```

### 3.2 Python: Logistic Regression for Churn

```python
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.preprocessing import StandardScaler
import pandas as pd

# Load features from SQL
df = pd.read_sql("SELECT * FROM user_features", conn)

# Prepare features and target
feature_cols = ['days_since_last_order', 'account_age_days', 'total_orders',
                'active_months', 'total_spent', 'avg_order_value',
                'categories_purchased', 'orders_last_30d', 'orders_last_90d']
X = df[feature_cols].fillna(0)
y = df['churned']

# Split & scale
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train model
model = LogisticRegression(random_state=42, max_iter=1000)
model.fit(X_train_scaled, y_train)

# Evaluate
y_pred = model.predict(X_test_scaled)
y_prob = model.predict_proba(X_test_scaled)[:, 1]
print(classification_report(y_test, y_pred))
print(f"AUC-ROC: {roc_auc_score(y_test, y_prob):.3f}")

# Feature importance
importance = pd.DataFrame({
    'feature': feature_cols,
    'coefficient': model.coef_[0]
}).sort_values('coefficient', key=abs, ascending=False)
print("\nTop churn predictors:")
print(importance)
```

---

## Part 4 — Advanced Window Functions for Analytics

### 4.1 Sessionization — Group Events into Sessions

```sql
-- A session ends after 30 minutes of inactivity
WITH events_with_gap AS (
    SELECT
        user_id,
        event_timestamp,
        event_type,
        -- Time since previous event for this user
        event_timestamp - LAG(event_timestamp) OVER (
            PARTITION BY user_id ORDER BY event_timestamp
        ) AS time_since_prev
    FROM user_events
),
session_markers AS (
    SELECT *,
        -- New session if gap > 30 min or first event
        CASE
            WHEN time_since_prev IS NULL THEN 1
            WHEN time_since_prev > INTERVAL '30 minutes' THEN 1
            ELSE 0
        END AS is_new_session
    FROM events_with_gap
),
sessions AS (
    SELECT *,
        SUM(is_new_session) OVER (
            PARTITION BY user_id ORDER BY event_timestamp
        ) AS session_id
    FROM session_markers
)
SELECT
    user_id,
    session_id,
    MIN(event_timestamp) AS session_start,
    MAX(event_timestamp) AS session_end,
    COUNT(*) AS events_count,
    MAX(event_timestamp) - MIN(event_timestamp) AS session_duration,
    ARRAY_AGG(event_type ORDER BY event_timestamp) AS event_sequence
FROM sessions
GROUP BY user_id, session_id
ORDER BY user_id, session_start;
```

### 4.2 Running Percentile Rank

```sql
SELECT
    salesperson_id,
    sale_date,
    amount,
    -- Percentile rank: what % of their own sales is this below?
    PERCENT_RANK() OVER (
        PARTITION BY salesperson_id ORDER BY amount
    ) AS pct_rank_self,
    -- Percentile vs ALL salespeople
    PERCENT_RANK() OVER (ORDER BY amount) AS pct_rank_overall,
    -- Cumulative distribution
    CUME_DIST() OVER (
        PARTITION BY salesperson_id ORDER BY amount
    ) AS cumulative_dist
FROM sales;
```

### 4.3 Gap Analysis — Finding Missing Dates

```sql
-- Find days with no orders (should have data every day)
WITH date_series AS (
    SELECT generate_series(
        (SELECT MIN(order_date) FROM orders),
        (SELECT MAX(order_date) FROM orders),
        '1 day'::interval
    )::date AS date
),
actual_dates AS (
    SELECT DISTINCT order_date::date AS date FROM orders
)
SELECT
    ds.date AS missing_date,
    EXTRACT(DOW FROM ds.date) AS day_of_week,
    CASE EXTRACT(DOW FROM ds.date)
        WHEN 0 THEN 'Sunday'
        WHEN 6 THEN 'Saturday'
        ELSE 'Weekday'
    END AS day_type
FROM date_series ds
LEFT JOIN actual_dates ad ON ds.date = ad.date
WHERE ad.date IS NULL
ORDER BY ds.date;
```

---

🔬 **Section Challenge — Part 4 — Advanced Window Functions for Analytics**

**Challenge 2 (Design):** `ROW_NUMBER()` vs `RANK()` vs `DENSE_RANK()` — show with an example where they produce different results.

<details><summary>Answer</summary>

Scores: [100, 90, 90, 80]. ROW_NUMBER: 1,2,3,4 (always unique, arbitrary for ties). RANK: 1,2,2,4 (gives same rank to ties, SKIPS the next rank). DENSE_RANK: 1,2,2,3 (same rank to ties, NO skipping). Use: ROW_NUMBER for pagination (must be unique). RANK when you want 'no 3rd place if two tied for 2nd'. DENSE_RANK when you want consecutive ranks despite ties.

</details>

## Part 5 — Attribution Modeling

### 5.1 First-Touch vs Last-Touch vs Multi-Touch

```sql
-- Multi-touch attribution
WITH touchpoints AS (
    SELECT
        user_id,
        channel,    -- 'google_ads', 'email', 'organic', 'social', 'direct'
        touch_date,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY touch_date) AS touch_order,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY touch_date DESC) AS reverse_order,
        COUNT(*) OVER (PARTITION BY user_id) AS total_touches
    FROM marketing_touches
),
conversions AS (
    SELECT user_id, conversion_value
    FROM purchases
    WHERE purchase_date BETWEEN '2026-02-01' AND '2026-02-28'
)
SELECT
    t.channel,
    -- First-touch attribution
    SUM(CASE WHEN t.touch_order = 1 THEN c.conversion_value ELSE 0 END) AS first_touch_revenue,
    -- Last-touch attribution
    SUM(CASE WHEN t.reverse_order = 1 THEN c.conversion_value ELSE 0 END) AS last_touch_revenue,
    -- Linear attribution (equal credit to all touches)
    SUM(c.conversion_value / t.total_touches) AS linear_revenue,
    -- Time-decay (recent touches get more credit)
    SUM(c.conversion_value * t.touch_order / (t.total_touches * (t.total_touches + 1) / 2.0))
        AS time_decay_revenue,
    -- Count of touches
    COUNT(*) AS total_touches
FROM touchpoints t
JOIN conversions c ON t.user_id = c.user_id
GROUP BY t.channel
ORDER BY linear_revenue DESC;
```

---

## Part 6 — SQL for Machine Learning Prep

### 6.1 Feature Store Pattern

```sql
-- Create a feature store table for ML
CREATE TABLE ml_user_features AS
WITH base AS (
    SELECT
        u.user_id,
        u.signup_date,
        u.country,
        u.device_type
    FROM users u
),
order_features AS (
    SELECT
        user_id,
        COUNT(*) AS order_count,
        SUM(amount) AS total_spent,
        AVG(amount) AS avg_spent,
        STDDEV(amount) AS std_spent,
        MIN(amount) AS min_order,
        MAX(amount) AS max_order,
        COUNT(DISTINCT product_category) AS unique_categories,
        SUM(CASE WHEN returned THEN 1 ELSE 0 END) AS return_count,
        AVG(CASE WHEN returned THEN 1.0 ELSE 0.0 END) AS return_rate
    FROM orders
    GROUP BY user_id
),
engagement AS (
    SELECT
        user_id,
        COUNT(*) AS total_events,
        COUNT(DISTINCT DATE(event_time)) AS active_days,
        SUM(CASE WHEN event = 'search' THEN 1 ELSE 0 END) AS search_count,
        SUM(CASE WHEN event = 'wishlist' THEN 1 ELSE 0 END) AS wishlist_count,
        AVG(session_duration) AS avg_session_duration
    FROM user_events
    GROUP BY user_id
)
SELECT
    b.*,
    COALESCE(of.order_count, 0) AS order_count,
    COALESCE(of.total_spent, 0) AS total_spent,
    COALESCE(of.avg_spent, 0) AS avg_spent,
    COALESCE(of.return_rate, 0) AS return_rate,
    COALESCE(e.active_days, 0) AS active_days,
    COALESCE(e.search_count, 0) AS search_count,
    -- One-hot encode device_type
    CASE WHEN b.device_type = 'mobile' THEN 1 ELSE 0 END AS is_mobile,
    CASE WHEN b.device_type = 'desktop' THEN 1 ELSE 0 END AS is_desktop,
    CASE WHEN b.device_type = 'tablet' THEN 1 ELSE 0 END AS is_tablet
FROM base b
LEFT JOIN order_features of ON b.user_id = of.user_id
LEFT JOIN engagement e ON b.user_id = e.user_id;
```

### 6.2 Pipeline: SQL → Python → Model → SQL

```python
import pandas as pd
from sqlalchemy import create_engine
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
import joblib

engine = create_engine("postgresql://user:pass@localhost/mydb")




# 1. EXTRACT features from SQL
df = pd.read_sql("SELECT * FROM ml_user_features", engine)

# 2. TRAIN model in Python
X = df.drop(['user_id', 'signup_date', 'country', 'device_type', 'churned'], axis=1)
y = df['churned']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = GradientBoostingClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 3. SCORE all users
df['churn_probability'] = model.predict_proba(X.fillna(0))[:, 1]
df['risk_tier'] = pd.cut(df['churn_probability'],
    bins=[0, 0.3, 0.6, 0.8, 1.0],
    labels=['Low', 'Medium', 'High', 'Critical'])

# 4. WRITE predictions back to SQL
df[['user_id', 'churn_probability', 'risk_tier']].to_sql(
    'churn_predictions', engine, if_exists='replace', index=False
)
print("Predictions written to database!")
```

---

## Analytics Maturity Model

```
Level 1: DESCRIPTIVE   → "What happened?"      → SQL GROUP BY, aggregations
Level 2: DIAGNOSTIC    → "Why did it happen?"   → Cohort, funnel, segmentation
Level 3: PREDICTIVE    → "What will happen?"    → ML models, churn prediction
Level 4: PRESCRIPTIVE  → "What should we do?"   → A/B testing, optimization
Level 5: AUTOMATED     → "Do it for me"         → ML pipelines, auto-decisions

This chapter covers Levels 2-4. Keep climbing! 🏔️
```

---

### Historical Evolution

**Predecessors (with years):**
- **Statistical testing (Student)** (1908): William Gosset developed the t-distribution and t-test under the "Student" pseudonym for Guinness Brewery quality control
- **Mann-Whitney U test** (1947): Non-parametric alternative to t-test, enabling comparison without assuming normal distribution
- **Chi-squared test (Pearson)** (1900): Karl Pearson's goodness-of-fit test became foundational for categorical data analysis
- **A/B testing** (1920s): Statistical experiments in pharmaceutical trials evolved into modern controlled experiments for product optimization

**Evolution narrative:**
Statistical testing methods were developed to make decisions under uncertainty before large-scale computing existed. The t-test (1908) allowed quality engineers to assess differences with small samples, the Mann-Whitney test (1947) provided robustness against non-normal distributions, and chi-squared (1900) enabled categorical analysis. A/B testing migrated from medical trials to web product development in the 2000s, requiring SQL-based implementation for large-scale online experiments. Modern analytics combines these classical statistical frameworks with SQL's ability to compute metrics across millions of observations.

**Modern practice anchor:**
Today's advanced SQL analytics implements statistical testing (t-tests, chi-squared, confidence intervals) directly in SQL using window functions, enabling data teams to conduct rigorous experiments without exporting data to statistical software.
### Production Reality

**Failure modes:**
1. **A/B test false positive from underpowered sample**: Experiment launched with only 500 users per variant — p-value 0.04 declared winner, but 3 days later metric reverts as sample grows and p-value rises to 0.35
2. **Anomaly detection false positive flood**: Static threshold (3 sigma) on metrics with diurnal pattern triggers 200 alerts during peak hours when normal variation exceeds threshold — on-call team ignores real incidents
3. **Model drift in production**: Churn prediction model trained on 2023 data continues scoring 2024 users — accuracy drops from 87% to 61% over 6 months, no monitoring catches degradation

**Debug workflow:**
1. Run power analysis before launch: `SELECT power_t_test(alpha => 0.05, power => 0.8, effect_size => 0.05, std_dev => NULL)` to determine required sample size
2. Validate statistical assumptions in SQL: check for normality with `SELECT skewness(val), kurtosis(val) FROM metric_series` before applying parametric tests
3. Implement champion-challenger deployment with automatic rollback: query `experiment_results` table daily for p-value crossing significance threshold

**Modern practice anchor:**
Production analytics requires statistical rigor at experimental design phase — not post-hoc correction of flawed experiments.


---

## Reality Check

**"A/B test results are valid after a few days"** → Statistical significance requires sufficient sample size, which depends on: baseline conversion rate, minimum detectable effect, and desired confidence level. A 2 percent conversion rate with a 10 percent relative improvement requires roughly 39000 observations per variant. Running the test for 3 days with 500 users produces noise, not signal. Peeking at results before reaching significance inflates false positive rates.

**"Funnel analysis shows where users drop off"** → Funnel analysis shows WHAT percentage drops at each step but not WHY. A 60 percent drop at checkout could be: price shock, complex form, payment failures, page load timeout, or users comparison-shopping. Combine funnel metrics with session recordings, error logs, and user surveys to understand the reason behind the drop. Quantitative data reveals the problem; qualitative data reveals the cause.

**"Retention metrics predict business health"** → Retention measures whether users RETURN, not whether they DERIVE VALUE. A user who logs in daily to check if a bug is fixed has perfect retention but zero satisfaction. Combine retention with engagement depth metrics: feature usage, time-in-app, conversion events. Healthy retention is users returning because they get value, not because they are stuck.

**"Time series analysis requires specialized databases"** → SQL window functions handle most time series analysis: LAG and LEAD for period comparisons, running averages with ROWS BETWEEN, gap detection with date arithmetic, and seasonality with EXTRACT and GROUP BY. TimescaleDB and InfluxDB optimize for high-frequency ingestion (millions of data points per second), but analytical queries on daily or hourly aggregates work fine in PostgreSQL.

**"Machine learning replaces SQL analytics"** → ML models are black boxes that predict but do not explain. A model predicting customer churn with 85 percent accuracy does not tell you WHY customers churn. SQL-based cohort analysis, segmentation, and funnel analysis provide the explanatory understanding. Use SQL analytics to formulate hypotheses about what matters, then ML to scale predictions based on those hypotheses. ML without analytical foundation is automated guessing.
