> **Navigation**: [Back to Index](00_INDEX.md) | [< Prev](26_Python_SQL_Integration.md) | [Next >](28_Data_Analytics_Intermediate.md)

# Chapter 27 — Python + SQL Visualization

## 5W-H Framework

- **WHO** needs this? → Data analysts, backend devs building dashboards, anyone explaining data to stakeholders
- **WHAT** is it? → Creating charts, graphs, and visual reports from SQL query results using Python
- **WHEN** to use? → Reporting, dashboards, presentations, data exploration, debugging data issues
- **WHERE** is it used? → Jupyter notebooks, automated reports, Flask/Django dashboards, Slack bots
- **WHY** learn it? → "A picture is worth a thousand rows" — humans understand visuals 60,000x faster than tables
- **HOW** does it work? → Query SQL → Load into pandas DataFrame → Plot with matplotlib/seaborn/plotly

---

## Part 1 — matplotlib: The Foundation

### 1.1 Setup

```bash
pip install matplotlib pandas
```

### 1.2 Bar Chart — Revenue by Category

```python
import sqlite3
import pandas as pd
import matplotlib.pyplot as plt

conn = sqlite3.connect('sales.db')
df = pd.read_sql("""
    SELECT category, SUM(amount) as total_revenue, COUNT(*) as order_count
    FROM orders
    GROUP BY category
    ORDER BY total_revenue DESC
""", conn)
conn.close()

# Bar chart
fig, ax = plt.subplots(figsize=(10, 6))
bars = ax.bar(df['category'], df['total_revenue'], color='steelblue', edgecolor='black')

# Add value labels on bars
for bar, value in zip(bars, df['total_revenue']):
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 500,
            f'${value:,.0f}', ha='center', va='bottom', fontweight='bold')

ax.set_title('Revenue by Product Category', fontsize=16, fontweight='bold')
ax.set_xlabel('Category', fontsize=12)
ax.set_ylabel('Total Revenue ($)', fontsize=12)
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x:,.0f}'))
plt.xticks(rotation=45, ha='right')
plt.tight_layout()
plt.savefig('revenue_by_category.png', dpi=150)
plt.show()
```

### 1.3 Line Chart — Monthly Trends

```python
df = pd.read_sql("""
    SELECT
        strftime('%Y-%m', order_date) as month,
        SUM(amount) as revenue,
        COUNT(*) as orders
    FROM orders
    WHERE order_date >= date('now', '-12 months')
    GROUP BY month
    ORDER BY month
""", conn)

fig, ax1 = plt.subplots(figsize=(12, 6))

# Revenue line
color1 = 'steelblue'
ax1.plot(df['month'], df['revenue'], color=color1, marker='o', linewidth=2, label='Revenue')
ax1.set_xlabel('Month')
ax1.set_ylabel('Revenue ($)', color=color1)
ax1.tick_params(axis='y', labelcolor=color1)

# Orders line (secondary axis)
ax2 = ax1.twinx()
color2 = 'coral'
ax2.plot(df['month'], df['orders'], color=color2, marker='s', linewidth=2,
         linestyle='--', label='Orders')
ax2.set_ylabel('Number of Orders', color=color2)
ax2.tick_params(axis='y', labelcolor=color2)

# Combined legend
lines1, labels1 = ax1.get_legend_handles_labels()
lines2, labels2 = ax2.get_legend_handles_labels()
ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper left')

plt.title('Monthly Revenue & Order Trends', fontsize=16, fontweight='bold')
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()
```

### 1.4 Pie Chart — Distribution

```python
df = pd.read_sql("""
    SELECT region, COUNT(*) as count
    FROM customers
    GROUP BY region
""", conn)

fig, ax = plt.subplots(figsize=(8, 8))
colors = ['#2196F3', '#4CAF50', '#FF9800', '#F44336', '#9C27B0']
explode = [0.05] * len(df)

wedges, texts, autotexts = ax.pie(
    df['count'], labels=df['region'], autopct='%1.1f%%',
    colors=colors, explode=explode, startangle=90,
    textprops={'fontsize': 12}
)

ax.set_title('Customer Distribution by Region', fontsize=16, fontweight='bold')
plt.tight_layout()
plt.show()
```

### 1.5 Histogram — Value Distribution

```python
df = pd.read_sql("SELECT amount FROM orders", conn)

fig, ax = plt.subplots(figsize=(10, 6))
ax.hist(df['amount'], bins=30, color='steelblue', edgecolor='black', alpha=0.7)

# Add mean & median lines
mean_val = df['amount'].mean()
median_val = df['amount'].median()
ax.axvline(mean_val, color='red', linestyle='--', linewidth=2, label=f'Mean: ${mean_val:,.0f}')
ax.axvline(median_val, color='green', linestyle='--', linewidth=2, label=f'Median: ${median_val:,.0f}')

ax.set_title('Order Amount Distribution', fontsize=16, fontweight='bold')
ax.set_xlabel('Order Amount ($)')
ax.set_ylabel('Frequency')
ax.legend()
plt.tight_layout()
plt.show()
```

---

## Part 2 — seaborn: Statistical Visualization

### 2.1 Why seaborn?

```
matplotlib = low-level, full control, verbose
seaborn    = high-level, beautiful defaults, statistical focus

seaborn is built ON TOP of matplotlib — you can mix them!
```

```bash
pip install seaborn
```

### 2.2 Heatmap — Correlation Matrix

```python
import seaborn as sns

df = pd.read_sql("""
    SELECT price, quantity, discount, shipping_cost, total_amount
    FROM order_details
""", conn)

fig, ax = plt.subplots(figsize=(10, 8))
correlation = df.corr()
sns.heatmap(correlation, annot=True, cmap='coolwarm', center=0,
            fmt='.2f', square=True, linewidths=0.5, ax=ax)
ax.set_title('Feature Correlation Matrix', fontsize=16, fontweight='bold')
plt.tight_layout()
plt.show()
```

### 2.3 Box Plot — Salary by Department

```python
df = pd.read_sql("""
    SELECT department, salary FROM employees
    WHERE department IN ('Engineering', 'Sales', 'Marketing', 'HR', 'Finance')
""", conn)

fig, ax = plt.subplots(figsize=(10, 6))
sns.boxplot(data=df, x='department', y='salary', palette='Set2', ax=ax)
ax.set_title('Salary Distribution by Department', fontsize=16, fontweight='bold')
ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x:,.0f}'))
plt.tight_layout()
plt.show()
```

### 2.4 Count Plot — Status Distribution

```python
df = pd.read_sql("""
    SELECT status, priority FROM tickets
""", conn)

fig, ax = plt.subplots(figsize=(10, 6))
sns.countplot(data=df, x='status', hue='priority',
              palette='viridis', order=['Open', 'In Progress', 'Resolved', 'Closed'], ax=ax)
ax.set_title('Ticket Status by Priority', fontsize=16, fontweight='bold')
ax.legend(title='Priority')
plt.tight_layout()
plt.show()
```

### 2.5 Scatter Plot with Regression — Price vs Sales

```python
df = pd.read_sql("""
    SELECT p.price, SUM(od.quantity) as total_sold
    FROM products p
    JOIN order_details od ON p.id = od.product_id
    GROUP BY p.id, p.price
""", conn)

fig, ax = plt.subplots(figsize=(10, 6))
sns.regplot(data=df, x='price', y='total_sold',
            scatter_kws={'alpha': 0.6}, line_kws={'color': 'red'}, ax=ax)
ax.set_title('Price vs Units Sold (with Regression)', fontsize=16, fontweight='bold')
ax.set_xlabel('Price ($)')
ax.set_ylabel('Total Units Sold')
plt.tight_layout()
plt.show()
```

---

## Part 3 — plotly: Interactive Visualization

### 3.1 Why plotly?

```
matplotlib/seaborn → Static images (great for reports, papers)
plotly             → Interactive HTML (hover, zoom, pan, click)
                   → Perfect for dashboards, web apps, Jupyter
```

```bash
pip install plotly
```

### 3.2 Interactive Line Chart

```python
import plotly.express as px

df = pd.read_sql("""
    SELECT date, revenue, region
    FROM daily_sales
    WHERE date >= date('now', '-90 days')
    ORDER BY date
""", conn)

fig = px.line(df, x='date', y='revenue', color='region',
              title='Daily Revenue by Region (Last 90 Days)',
              labels={'revenue': 'Revenue ($)', 'date': 'Date'})
fig.update_layout(hovermode='x unified')
fig.show()  # Opens interactive chart in browser
```

### 3.3 Interactive Scatter Plot

```python
df = pd.read_sql("""
    SELECT name, revenue, employees, industry, founded_year
    FROM companies
""", conn)

fig = px.scatter(df, x='employees', y='revenue',
                 color='industry', size='revenue',
                 hover_name='name',
                 title='Company Size vs Revenue',
                 log_x=True, log_y=True)  # Log scale for wide ranges
fig.show()
```

### 3.4 Sunburst Chart — Hierarchical Data

```python
df = pd.read_sql("""
    SELECT region, country, city, SUM(revenue) as revenue
    FROM sales
    GROUP BY region, country, city
""", conn)

fig = px.sunburst(df, path=['region', 'country', 'city'],
                  values='revenue',
                  title='Revenue Breakdown: Region → Country → City')
fig.show()
```

### 3.5 Funnel Chart — Conversion Pipeline

```python
stages = pd.read_sql("""
    SELECT stage, COUNT(*) as count
    FROM user_journey
    GROUP BY stage
    ORDER BY CASE stage
        WHEN 'Visit' THEN 1
        WHEN 'Signup' THEN 2
        WHEN 'Activate' THEN 3
        WHEN 'Purchase' THEN 4
        WHEN 'Repeat' THEN 5
    END
""", conn)

fig = px.funnel(stages, x='count', y='stage',
                title='User Conversion Funnel')
fig.show()
```

---

## Part 4 — Dashboard Pattern: Multi-Chart Reports

### 4.1 matplotlib Subplots Dashboard

```python
import matplotlib.pyplot as plt
import pandas as pd
import sqlite3

conn = sqlite3.connect('business.db')

fig, axes = plt.subplots(2, 2, figsize=(16, 12))
fig.suptitle('Monthly Business Dashboard — March 2026', fontsize=20, fontweight='bold')



# Chart 1: Revenue trend (top-left)
df1 = pd.read_sql("SELECT month, revenue FROM monthly_stats ORDER BY month", conn)
axes[0, 0].plot(df1['month'], df1['revenue'], 'b-o', linewidth=2)
axes[0, 0].set_title('Revenue Trend')
axes[0, 0].set_ylabel('Revenue ($)')

# Chart 2: Top products (top-right)
df2 = pd.read_sql("""
    SELECT name, SUM(quantity) as sold FROM products p
    JOIN sales s ON p.id = s.product_id
    GROUP BY name ORDER BY sold DESC LIMIT 5
""", conn)
axes[0, 1].barh(df2['name'], df2['sold'], color='teal')
axes[0, 1].set_title('Top 5 Products')

# Chart 3: Customer segments (bottom-left)
df3 = pd.read_sql("SELECT segment, COUNT(*) as count FROM customers GROUP BY segment", conn)
axes[1, 0].pie(df3['count'], labels=df3['segment'], autopct='%1.1f%%')
axes[1, 0].set_title('Customer Segments')

# Chart 4: Order distribution (bottom-right)
df4 = pd.read_sql("SELECT amount FROM orders", conn)
axes[1, 1].hist(df4['amount'], bins=25, color='salmon', edgecolor='black')
axes[1, 1].set_title('Order Amount Distribution')

plt.tight_layout()
plt.savefig('monthly_dashboard.png', dpi=150, bbox_inches='tight')
plt.show()
conn.close()
```

### 4.2 Automated Report Generation

```python
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
import pandas as pd
from datetime import datetime

def generate_monthly_report(db_path, output_path):
    """Generate multi-page PDF report from database."""
    conn = sqlite3.connect(db_path)

    with PdfPages(output_path) as pdf:
        # Page 1: KPI Summary
        fig, axes = plt.subplots(2, 2, figsize=(11, 8.5))
        fig.suptitle(f'Business Report — {datetime.now().strftime("%B %Y")}', fontsize=18)

        # ... add charts to each axis ...

        pdf.savefig(fig)
        plt.close()

        # Page 2: Detailed analysis
        fig, axes = plt.subplots(1, 2, figsize=(11, 8.5))
        # ... more charts ...
        pdf.savefig(fig)
        plt.close()

    conn.close()
    print(f"Report saved to {output_path}")

# generate_monthly_report('business.db', 'march_2026_report.pdf')
```

---

## Part 5 — Real-World Visualization Recipes

### 5.1 Time-Series Anomaly Detection

```python
df = pd.read_sql("""
    SELECT date, daily_revenue FROM revenue_daily
    ORDER BY date
""", conn)

df['date'] = pd.to_datetime(df['date'])
df['rolling_mean'] = df['daily_revenue'].rolling(7).mean()
df['rolling_std'] = df['daily_revenue'].rolling(7).std()
df['upper'] = df['rolling_mean'] + 2 * df['rolling_std']
df['lower'] = df['rolling_mean'] - 2 * df['rolling_std']
df['anomaly'] = (df['daily_revenue'] > df['upper']) | (df['daily_revenue'] < df['lower'])

fig, ax = plt.subplots(figsize=(14, 6))
ax.plot(df['date'], df['daily_revenue'], 'b-', alpha=0.5, label='Daily Revenue')
ax.plot(df['date'], df['rolling_mean'], 'g-', linewidth=2, label='7-day Moving Avg')
ax.fill_between(df['date'], df['lower'], df['upper'], alpha=0.2, color='green')
anomalies = df[df['anomaly']]
ax.scatter(anomalies['date'], anomalies['daily_revenue'],
           color='red', s=100, zorder=5, label='Anomalies')
ax.set_title('Revenue Anomaly Detection')
ax.legend()
plt.tight_layout()
plt.show()
```

### 5.2 Cohort Retention Heatmap

```python
# Query: monthly cohort retention
df = pd.read_sql("""
    WITH cohorts AS (
        SELECT user_id,
               MIN(strftime('%Y-%m', order_date)) as cohort_month
        FROM orders GROUP BY user_id
    )
    SELECT c.cohort_month,
           (CAST((julianday(o.order_date) - julianday(c.cohort_month || '-01')) / 30 AS INT)) as month_number,
           COUNT(DISTINCT o.user_id) as users
    FROM orders o
    JOIN cohorts c ON o.user_id = c.user_id
    GROUP BY c.cohort_month, month_number
""", conn)

pivot = df.pivot_table(index='cohort_month', columns='month_number', values='users')
# Convert to retention %
pivot_pct = pivot.div(pivot[0], axis=0) * 100

fig, ax = plt.subplots(figsize=(14, 8))
sns.heatmap(pivot_pct, annot=True, fmt='.0f', cmap='YlGnBu',
            vmin=0, vmax=100, ax=ax)
ax.set_title('Monthly Cohort Retention (%)', fontsize=16, fontweight='bold')
ax.set_xlabel('Months Since First Purchase')
ax.set_ylabel('Cohort Month')
plt.tight_layout()
plt.show()
```

### 5.3 Geographic Visualization

```python
import plotly.express as px

df = pd.read_sql("""
    SELECT country, SUM(revenue) as revenue, COUNT(*) as customers
    FROM customers
    GROUP BY country
""", conn)

fig = px.choropleth(df, locations='country', locationmode='country names',
                    color='revenue', hover_name='country',
                    color_continuous_scale='Viridis',
                    title='Revenue by Country')
fig.show()
```

---

## Visualization Decision Guide

```
What are you trying to show?
│
├── Comparison → Bar chart (categories) / Grouped bar (sub-categories)
├── Trend over time → Line chart (continuous) / Area chart (cumulative)
├── Distribution → Histogram (single) / Box plot (compare groups) / Violin
├── Composition → Pie/Donut (few items) / Stacked bar (many) / Treemap
├── Relationship → Scatter (2 vars) / Bubble (3 vars) / Heatmap (matrix)
├── Ranking → Horizontal bar / Lollipop chart
├── Hierarchy → Sunburst / Treemap
├── Flow/Process → Sankey / Funnel
└── Geographic → Choropleth / Scatter on map

Static report? → matplotlib/seaborn
Interactive dashboard? → plotly
Quick exploration? → pandas .plot()
```

---

### Historical Evolution

**Predecessors (with years):**
- **matplotlib** (2003): 2D plotting library that became Python's visualization foundation, inspired by MATLAB's plotting commands
- **ggplot2 (Wickham)** (2007): Introduced the grammar of graphics to R, proving that declarative visualization mappings outperform imperative approaches
- **Tableau** (2003): Pioneered drag-and-drop business intelligence dashboards, bringing visualization to non-technical business users
- **seaborn** (2012): Built on matplotlib to provide statistical visualization with better defaults and aesthetic coherence
- **plotly** (2013): Brought interactive, web-native visualizations to Python with the open-source Plotly.js as backend

**Evolution narrative:**
Python's early visualization landscape was dominated by matplotlib (2003), which prioritized publication-quality static output over interactivity. The ggplot2 grammar-of-graphics paradigm demonstrated that treating visualization as a mapping between aesthetic attributes and data variables was more composable than MATLAB-style imperative plotting. Seaborn and plotly later addressed matplotlib's weaknesses—seaborn for statistical aesthetics, plotly for interactivity—while SQL result visualization emerged as pandas made database outputs natural inputs to visualization pipelines.

**Modern practice anchor:**
Modern Python/SQL visualization typically uses pandas to extract data, then matplotlib/seaborn for statistical charts or plotly for interactive dashboards that can be embedded in web applications.

### Production Reality

**Failure modes:**
1. **Loading 100M rows into pandas (memory exhaustion)**: `pd.read_sql("SELECT * FROM events", conn)` on a 100M-row table with 1KB/row = 100GB of RAM. The process is killed by OOM killer (exit code 137). The chart never renders; the job fails silently in cron.
2. **No sampling leading to misleading charts**: `SELECT amount FROM orders` without `LIMIT` returns 10M rows. The histogram shows every outlier (one-time $500K orders), making the distribution look highly skewed. Executives conclude "most orders are huge" — when 99.9% of orders are under $100.
3. **Missing datetime parsing**: `df['date'] = df['date']` without `pd.to_datetime()` causes matplotlib to treat dates as strings. The line chart renders alphabetically ("Jan", "Feb", "Mar" sorted as strings: "Apr", "Aug", "Dec") with no time-series continuity. The spike-and-dip pattern looks like a bug but passes code review.

**Debug workflow:**
1. Before loading, estimate row count: `SELECT COUNT(*) FROM events WHERE date >= '2024-01-01'` — if > 1M rows, add `LIMIT 100000` or use server-side sampling: `SELECT * FROM events TABLESAMPLE SYSTEM (1)` (1% sample).
2. After fetch, run `df.describe()` before plotting — check if `mean >> median` (extreme skew) and cap outliers with `df['amount'] = df['amount'].clip(upper=df['amount'].quantile(0.99))` before visualization.
3. Add datetime validation: `df['date'] = pd.to_datetime(df['date'], errors='coerce')` — if any rows become NaT, those rows had unparseable dates (wrong format, timezone strings) that would have rendered incorrectly.

**Modern practice anchor:**
Production visualization pipelines require server-side aggregation (SQL GROUP BY) before pandas ingest, not loading raw rows — this reduces 100M rows to 365 annual summary rows with correct dtype parsing.


---

## Reality Check

**"Visualization makes data self-explanatory"** → A chart without context is ambiguous. A line going up could be good (revenue) or bad (error rate). Visualizations need: titles that state what the chart shows, axis labels with units, reference lines for targets or baselines, and annotations for unusual data points. A chart that requires verbal explanation to understand is a failed visualization.

**"More data points make better charts"** → Plotting 10 million raw data points creates an unreadable scatter cloud that takes minutes to render. Aggregate before visualizing: hourly averages instead of per-second values, percentile distributions instead of individual observations. The purpose of visualization is pattern recognition, which requires reducing data to its essential structure.

**"Pie charts are good for showing proportions"** → Humans are poor at comparing angles and areas. Two pie slices of 27 percent and 32 percent are visually indistinguishable. A sorted horizontal bar chart conveys the same proportional information with precise visual comparison. Use pie charts only when showing two or three categories where the relative sizes are dramatically different (80/20 split).

**"Color makes charts more informative"** → Color without semantic meaning is decoration. Using 12 different colors for 12 product categories creates a chart that requires constant legend reference. Use color to encode meaning: red for negative, green for positive, sequential color scale for magnitude. Ensure charts are readable in grayscale (10 percent of men are colorblind) by using patterns or labels in addition to color.

**"Interactive dashboards are better than static reports"** → Interactive dashboards invite exploration but not analysis. A stakeholder clicking through 20 filters draws random conclusions from sample sizes too small to be statistically significant. A curated static report with pre-analyzed insights, controlled comparisons, and written conclusions drives better decisions. Build dashboards for monitoring and static reports for decision-making.
