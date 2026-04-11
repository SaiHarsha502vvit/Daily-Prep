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


---

## 🏋️ Practice & Interview Questions — SQL

### Predict / Trace
**Q1.** What's the difference between WHERE and HAVING?
<details><summary>Answer</summary>

`WHERE` filters rows **before** grouping. `HAVING` filters groups **after** `GROUP BY`. You can't use aggregate functions in WHERE. `HAVING COUNT(*) > 5` works, `WHERE COUNT(*) > 5` does not.
</details>

**Q2.** What does this return? `SELECT 1 FROM dual WHERE NULL = NULL`
<details><summary>Answer</summary>

**No rows returned.** NULL is not equal to NULL — use `IS NULL` or `IS NOT NULL`. `NULL = NULL` evaluates to UNKNOWN, not TRUE.
</details>

### Coding Problems
**Q3.** ⭐ Second highest salary — handle the case where it doesn't exist (return NULL).
<details><summary>Solution</summary>

```sql
SELECT MAX(salary) AS SecondHighestSalary
FROM Employee
WHERE salary < (SELECT MAX(salary) FROM Employee);
-- or
SELECT IFNULL((SELECT DISTINCT salary FROM Employee ORDER BY salary DESC LIMIT 1 OFFSET 1), NULL)
```
</details>

**Q4.** ⭐ Find employees earning more than their manager.
<details><summary>Solution</summary>

```sql
SELECT e.name FROM Employee e
JOIN Employee m ON e.managerId = m.id
WHERE e.salary > m.salary;
```
</details>

**Q5.** ⭐ Find duplicate emails.
<details><summary>Solution</summary>

```sql
SELECT email FROM Person GROUP BY email HAVING COUNT(*) > 1;
```
</details>

**Q6.** ⭐⭐ Rank scores without RANK() function.
<details><summary>Solution</summary>

```sql
SELECT s.score,
  (SELECT COUNT(DISTINCT s2.score) FROM Scores s2 WHERE s2.score >= s.score) AS rank
FROM Scores s ORDER BY score DESC;
```
</details>

**Q7.** ⭐⭐ Consecutive numbers — find numbers that appear 3+ times consecutively.
<details><summary>Solution</summary>

```sql
SELECT DISTINCT l1.Num AS ConsecutiveNums
FROM Logs l1, Logs l2, Logs l3
WHERE l1.Id=l2.Id-1 AND l2.Id=l3.Id-1
AND l1.Num=l2.Num AND l2.Num=l3.Num;
-- or use LAG/LEAD window functions
```
</details>

**Q8.** ⭐⭐ Department top 3 salaries (dense rank).
<details><summary>Solution</summary>

```sql
SELECT d.name AS Department, e.name AS Employee, e.salary AS Salary
FROM Employee e JOIN Department d ON e.departmentId = d.id
WHERE (SELECT COUNT(DISTINCT e2.salary) FROM Employee e2
       WHERE e2.departmentId=e.departmentId AND e2.salary>e.salary) < 3;
```
</details>

**Q9.** ⭐⭐ Running total with window function.
<details><summary>Solution</summary>

```sql
SELECT date, amount,
  SUM(amount) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total
FROM transactions;
```
</details>

**Q10.** ⭐⭐ Pivot rows to columns (conditional aggregation).
<details><summary>Solution</summary>

```sql
SELECT year,
  SUM(CASE WHEN quarter=1 THEN revenue END) AS Q1,
  SUM(CASE WHEN quarter=2 THEN revenue END) AS Q2,
  SUM(CASE WHEN quarter=3 THEN revenue END) AS Q3,
  SUM(CASE WHEN quarter=4 THEN revenue END) AS Q4
FROM sales GROUP BY year;
```
</details>

**Q11.** ⭐⭐⭐ Find the median salary — without MEDIAN() function.
<details><summary>Solution</summary>

```sql
SELECT AVG(salary) AS median
FROM (SELECT salary, ROW_NUMBER() OVER(ORDER BY salary) AS rn, COUNT(*) OVER() AS cnt FROM Employee) t
WHERE rn IN (FLOOR((cnt+1)/2), CEIL((cnt+1)/2));
```
</details>

### Interview Questions
**Q12.** INNER JOIN vs LEFT JOIN — when does LEFT produce more rows?
<details><summary>Answer</summary>

LEFT JOIN includes ALL rows from the left table even if no match in right table (fills NULLs). INNER JOIN only includes rows where both sides have a match. If left table has rows with no match in right: LEFT produces more rows.
</details>

**Q13.** What is a covering index?
<details><summary>Answer</summary>

An index that contains ALL columns needed by a query — the DB can answer from the index alone without touching the table ("index-only scan"). Faster because it avoids the extra heap fetch.
</details>

**Q14.** EXPLAIN shows "Full Table Scan" — how do you fix it?
<details><summary>Answer</summary>

Add an index on the WHERE/JOIN/ORDER BY column. Check if the column has low cardinality (boolean — index may not help). Ensure the query isn't wrapping the column in a function (`WHERE YEAR(date) = 2024` prevents index use — rewrite as `WHERE date BETWEEN '2024-01-01' AND '2024-12-31'`).
</details>

### MCQ Rapid Fire
| # | Question | Answer |
|---|---|---|
| 1 | NULL = NULL evaluates to? | UNKNOWN (use IS NULL) |
| 2 | COUNT(*) vs COUNT(col) | COUNT(*) counts all rows, COUNT(col) skips NULLs |
| 3 | RANK() vs DENSE_RANK() | RANK() skips numbers after ties, DENSE_RANK() doesn't |
| 4 | CROSS JOIN produces | Cartesian product (m × n rows) |
| 5 | Can you ORDER BY in a subquery? | Only when using TOP/LIMIT |
| 6 | TRUNCATE vs DELETE | TRUNCATE: no WHERE, no undo, faster. DELETE: filterable, transactional |
| 7 | What does COALESCE do? | Returns first non-NULL value from its arguments |
| 8 | Index on VARCHAR — what to watch out for? | Case sensitivity, collation, function-based searches bypass index |



---

## 🧠 Deep Conceptual Questions — SQL Internals & Reasoning

**C1. How does a SQL database execute a SELECT query internally?**
<details><summary>Deep Answer</summary>

1. **Parse**: SQL text → AST (syntax tree)
2. **Bind**: resolve table names, column names, types
3. **Optimize**: query planner generates candidate execution plans, estimates costs (based on statistics: row counts, column cardinality, index existence), picks cheapest
4. **Execute**: follow the plan — scan tables, apply filters, join, sort, project

The optimizer transforms: `SELECT ... WHERE ... JOIN ... ORDER BY` into an operator tree (Volcano model): TableScan → Filter → HashJoin → Sort → Project. Each operator is an iterator: `next()` pulls one row from its child. This pull-based model (lazy evaluation) avoids materializing intermediate results.
</details>

**C2. B-Tree index: why is it the default index structure in databases?**
<details><summary>Deep Answer</summary>

B-Tree (not binary tree — B stands for Balanced, not Binary): a self-balancing tree where each node can hold many keys. Properties: (1) height O(log_m N) where m=fan-out (typically 100-1000) → very short tree for millions of rows, (2) all leaf nodes at same depth → guaranteed O(log N) worst case, (3) range scans efficient — leaves linked in sequence, (4) supports equality AND range queries. Hash index: only equality (no range). Sequential scan: no index at all. B+Tree (variant): internal nodes only store keys (no values), leaves store data. All row pointers in leaves → better range scan (follow linked list of leaves).
</details>

**C3. Why does adding an index sometimes SLOW DOWN a query?**
<details><summary>Deep Answer</summary>

1. **Low cardinality**: index on a boolean column — if 50% rows have `active=true`, index gives you 50% of rows. Database may choose full table scan (cheaper: sequential I/O) over index (random I/O for 50% of rows). 
2. **Function on column**: `WHERE YEAR(created_at) = 2024` — index on `created_at` unused. Rewrite: `WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'`.
3. **Write overhead**: every INSERT/UPDATE/DELETE must update ALL indexes. 5 indexes × N rows = 5× write amplification.
4. **Index not covering**: index exists but the SELECT columns aren't in the index → each index match → separate heap fetch → many random I/O. Solution: covering index (include all needed columns in index).
</details>

**C4. EXPLAIN / query execution plan: what are the key things to look for?**
<details><summary>Deep Answer</summary>

Red flags: (1) **"Full Table Scan" / "Seq Scan"** on a large table → missing index, (2) **high "rows" estimate** in join conditions → cartesian product risk, (3) **"Using filesort"** → ORDER BY can't use index, (4) **"Using temporary"** → intermediate table materialization, (5) **nested loops on large tables** → should be hash join or merge join. Green flags: "Using index" (covering index), "ref" or "eq_ref" access type (index used). Start fixing: add or fix index on WHERE/JOIN/ORDER BY columns, rewrite function-wrapped columns.
</details>

**C5. Window functions vs GROUP BY — when must you use window functions?**
<details><summary>Deep Answer</summary>

`GROUP BY` collapses rows to one per group — individual row data is lost. Window functions compute aggregates but **keep all rows**. Use window when: (1) you need both the aggregate AND the individual row (rank each employee and show their salary), (2) running totals (each row needs sum of all prior rows — GROUP BY can't do this), (3) lag/lead access (compare each row to previous/next — GROUP BY has no row ordering concept), (4) top-N per group (ROW_NUMBER partition — classic GROUP BY can't do this cleanly). Window functions = aggregation without collapsing.
</details>

**C6. Transaction isolation levels — what anomaly does each prevent?**
<details><summary>Deep Answer</summary>

| Level | Dirty Read | Non-repeatable Read | Phantom Read |
|---|---|---|---|
| READ UNCOMMITTED | Possible | Possible | Possible |
| READ COMMITTED | ✅ Prevented | Possible | Possible |
| REPEATABLE READ | ✅ | ✅ | Possible (MySQL InnoDB: prevented!) |
| SERIALIZABLE | ✅ | ✅ | ✅ |

**Dirty read**: read uncommitted data from another transaction (which may rollback). **Non-repeatable**: same query in same transaction returns different row values (another transaction committed update). **Phantom**: same query returns different row COUNT (another transaction inserted/deleted rows). Higher isolation = fewer anomalies but more lock contention. Most production databases use READ COMMITTED or REPEATABLE READ.
</details>

**C7. N+1 query problem: what is it, why does it happen, and how to fix?**
<details><summary>Deep Answer</summary>

**What**: fetching N orders, then for each order making a separate query for the customer = 1 + N queries total. Scales terribly: 1000 orders = 1001 queries. **Why**: ORMs (Hibernate, JPA) with lazy loading — accessing a relationship triggers a new query. **Fix 1**: Eager loading — `JOIN FETCH` or `.fetch()` — load everything in one query. **Fix 2**: Batch loading — fetch all order IDs, then `WHERE customer_id IN (id1, id2, ...)` — 2 queries. **Fix 3**: Projection/DTO query — `SELECT o.id, c.name FROM orders o JOIN customers c` — 1 query. **Detection**: count DB queries in tests (Spring: `@QueryCount`), log slow query warnings.
</details>


> **Navigation**: [Back to Index](00_INDEX.md) | [< Prev](26_Python_SQL_Integration.md) | [Next >](28_Data_Analytics_Intermediate.md)
