---
title: Data Analytics Getting Started Guide
description: Master data analytics core skills, tools, and learning path
track: data
section: analytics-engines
difficulty: beginner
tags:
  - Getting Started
  - Data Analytics
  - SQL
  - Python
  - Visualization
status: imported
origin: old/src/content/docs/data/getting-started.en.md
divergence: 0.217
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Data
  subcategory: Introduction
  order: 0
  lastUpdated: 2026-01-07
---

Welcome to the Data Analytics section of Code Wiki! This comprehensive guide will help you understand the core skills, tools, and learning path for becoming a proficient data analyst or data scientist.

## What is Data Analytics

Data analytics is the process of examining, cleaning, transforming, and modeling data to discover useful information, draw conclusions, and support decision-making. It encompasses a range of techniques from simple aggregations to complex machine learning models.

Data analytics helps organizations:

- Understand customer behavior and preferences
- Optimize business operations and processes
- Identify trends and patterns in data
- Make data-driven decisions
- Predict future outcomes and trends
- Measure and improve performance

### Types of Data Analytics

**Descriptive Analytics**: What happened? Summarizing historical data to understand past performance.

**Diagnostic Analytics**: Why did it happen? Analyzing data to understand causes of events.

**Predictive Analytics**: What will happen? Using statistical models to forecast future outcomes.

**Prescriptive Analytics**: What should we do? Recommending actions based on analysis.

### The Data Analytics Workflow

```
Data Collection → Data Cleaning → Data Exploration → Analysis → Visualization → Communication
       ↑                                                                              │
       └──────────────────────── Feedback Loop ──────────────────────────────────────┘
```

## Core Skills

### SQL - The Foundation of Data Analysis

SQL (Structured Query Language) is the primary language for working with relational databases and is essential for any data professional.

```sql
-- Basic Data Exploration
-- Count records and check for nulls
SELECT
    COUNT(*) as total_records,
    COUNT(email) as records_with_email,
    COUNT(*) - COUNT(email) as null_emails
FROM users;

-- Data Aggregation with GROUP BY
SELECT
    DATE_TRUNC('month', order_date) AS month,
    category,
    COUNT(*) AS order_count,
    SUM(amount) AS total_revenue,
    AVG(amount) AS avg_order_value,
    MIN(amount) AS min_order,
    MAX(amount) AS max_order
FROM orders
WHERE order_date >= '2024-01-01'
    AND status = 'completed'
GROUP BY DATE_TRUNC('month', order_date), category
ORDER BY month, total_revenue DESC;

-- Window Functions for Advanced Analysis
SELECT
    user_id,
    order_date,
    amount,
    SUM(amount) OVER (
        PARTITION BY user_id
        ORDER BY order_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS cumulative_spend,
    ROW_NUMBER() OVER (
        PARTITION BY user_id
        ORDER BY order_date
    ) AS order_sequence,
    LAG(order_date) OVER (
        PARTITION BY user_id
        ORDER BY order_date
    ) AS previous_order_date,
    order_date - LAG(order_date) OVER (
        PARTITION BY user_id
        ORDER BY order_date
    ) AS days_since_last_order
FROM orders
WHERE status = 'completed';

-- Cohort Analysis Query
WITH user_cohorts AS (
    SELECT
        user_id,
        DATE_TRUNC('month', MIN(order_date)) AS cohort_month
    FROM orders
    GROUP BY user_id
),
cohort_data AS (
    SELECT
        uc.cohort_month,
        DATE_TRUNC('month', o.order_date) AS order_month,
        COUNT(DISTINCT o.user_id) AS active_users
    FROM orders o
    JOIN user_cohorts uc ON o.user_id = uc.user_id
    GROUP BY uc.cohort_month, DATE_TRUNC('month', o.order_date)
)
SELECT
    cohort_month,
    order_month,
    active_users,
    EXTRACT(MONTH FROM AGE(order_month, cohort_month)) AS months_since_join,
    ROUND(
        100.0 * active_users / FIRST_VALUE(active_users) OVER (
            PARTITION BY cohort_month
            ORDER BY order_month
        ),
        2
    ) AS retention_rate
FROM cohort_data
ORDER BY cohort_month, order_month;

-- Funnel Analysis
WITH funnel_stages AS (
    SELECT
        session_id,
        MAX(CASE WHEN event = 'page_view' THEN 1 ELSE 0 END) AS viewed,
        MAX(CASE WHEN event = 'add_to_cart' THEN 1 ELSE 0 END) AS added_to_cart,
        MAX(CASE WHEN event = 'checkout_start' THEN 1 ELSE 0 END) AS started_checkout,
        MAX(CASE WHEN event = 'purchase' THEN 1 ELSE 0 END) AS purchased
    FROM events
    WHERE event_date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY session_id
)
SELECT
    COUNT(*) AS total_sessions,
    SUM(viewed) AS page_views,
    SUM(added_to_cart) AS add_to_carts,
    SUM(started_checkout) AS checkouts_started,
    SUM(purchased) AS purchases,
    ROUND(100.0 * SUM(added_to_cart) / NULLIF(SUM(viewed), 0), 2) AS view_to_cart_rate,
    ROUND(100.0 * SUM(started_checkout) / NULLIF(SUM(added_to_cart), 0), 2) AS cart_to_checkout_rate,
    ROUND(100.0 * SUM(purchased) / NULLIF(SUM(started_checkout), 0), 2) AS checkout_to_purchase_rate,
    ROUND(100.0 * SUM(purchased) / NULLIF(SUM(viewed), 0), 2) AS overall_conversion_rate
FROM funnel_stages;
```

### Python for Data Analysis

Python, with its rich ecosystem of data libraries, is the most popular language for data analysis and data science.

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta

# Reading and Exploring Data
df = pd.read_csv('sales_data.csv', parse_dates=['order_date'])

# Initial exploration
print(f"Dataset shape: {df.shape}")
print(f"\nColumn types:\n{df.dtypes}")
print(f"\nMissing values:\n{df.isnull().sum()}")
print(f"\nBasic statistics:\n{df.describe()}")

# Data Cleaning
# Handle missing values
df['revenue'].fillna(df['revenue'].median(), inplace=True)
df['category'].fillna('Unknown', inplace=True)

# Remove duplicates
df = df.drop_duplicates(subset=['order_id'])

# Data type conversions
df['customer_id'] = df['customer_id'].astype(str)
df['order_date'] = pd.to_datetime(df['order_date'])

# Feature Engineering
df['order_month'] = df['order_date'].dt.to_period('M')
df['day_of_week'] = df['order_date'].dt.day_name()
df['is_weekend'] = df['order_date'].dt.dayofweek >= 5

# Aggregation and Analysis
monthly_revenue = df.groupby('order_month').agg({
    'revenue': ['sum', 'mean', 'count'],
    'customer_id': 'nunique'
}).round(2)

monthly_revenue.columns = ['total_revenue', 'avg_order_value', 'order_count', 'unique_customers']
monthly_revenue['revenue_per_customer'] = (
    monthly_revenue['total_revenue'] / monthly_revenue['unique_customers']
).round(2)

print(monthly_revenue)

# Pivot Table Analysis
pivot = pd.pivot_table(
    df,
    values='revenue',
    index='category',
    columns='order_month',
    aggfunc='sum',
    fill_value=0
)

# Calculate month-over-month growth
mom_growth = pivot.pct_change(axis=1) * 100
print(f"\nMonth-over-Month Growth (%):\n{mom_growth.round(2)}")

# Customer Segmentation with RFM Analysis
today = df['order_date'].max() + timedelta(days=1)

rfm = df.groupby('customer_id').agg({
    'order_date': lambda x: (today - x.max()).days,  # Recency
    'order_id': 'count',  # Frequency
    'revenue': 'sum'  # Monetary
})

rfm.columns = ['recency', 'frequency', 'monetary']

# Score customers (1-5 scale)
rfm['r_score'] = pd.qcut(rfm['recency'], q=5, labels=[5, 4, 3, 2, 1])
rfm['f_score'] = pd.qcut(rfm['frequency'].rank(method='first'), q=5, labels=[1, 2, 3, 4, 5])
rfm['m_score'] = pd.qcut(rfm['monetary'], q=5, labels=[1, 2, 3, 4, 5])

rfm['rfm_segment'] = rfm['r_score'].astype(str) + rfm['f_score'].astype(str) + rfm['m_score'].astype(str)
rfm['rfm_score'] = rfm[['r_score', 'f_score', 'm_score']].astype(int).sum(axis=1)

# Segment classification
def classify_customer(row):
    if row['rfm_score'] >= 12:
        return 'Champions'
    elif row['rfm_score'] >= 9:
        return 'Loyal Customers'
    elif row['rfm_score'] >= 6:
        return 'Potential Loyalists'
    elif row['rfm_score'] >= 4:
        return 'At Risk'
    else:
        return 'Lost'

rfm['customer_segment'] = rfm.apply(classify_customer, axis=1)
print(f"\nCustomer Segments:\n{rfm['customer_segment'].value_counts()}")
```

### Data Visualization

Effective visualization is crucial for communicating insights.

```python
import matplotlib.pyplot as plt
import seaborn as sns

# Set style
plt.style.use('seaborn-v0_8-whitegrid')
sns.set_palette("husl")

# Create a comprehensive dashboard
fig, axes = plt.subplots(2, 2, figsize=(14, 10))

# Revenue Trend Over Time
ax1 = axes[0, 0]
monthly_data = df.groupby(df['order_date'].dt.to_period('M'))['revenue'].sum()
monthly_data.plot(kind='line', ax=ax1, marker='o', linewidth=2)
ax1.set_title('Monthly Revenue Trend', fontsize=12, fontweight='bold')
ax1.set_xlabel('Month')
ax1.set_ylabel('Revenue ($)')
ax1.tick_params(axis='x', rotation=45)

# Add trend line
z = np.polyfit(range(len(monthly_data)), monthly_data.values, 1)
p = np.poly1d(z)
ax1.plot(range(len(monthly_data)), p(range(len(monthly_data))),
         "r--", alpha=0.8, label='Trend')
ax1.legend()

# Revenue by Category
ax2 = axes[0, 1]
category_revenue = df.groupby('category')['revenue'].sum().sort_values(ascending=True)
colors = plt.cm.viridis(np.linspace(0, 0.8, len(category_revenue)))
category_revenue.plot(kind='barh', ax=ax2, color=colors)
ax2.set_title('Revenue by Category', fontsize=12, fontweight='bold')
ax2.set_xlabel('Revenue ($)')

# Add value labels
for i, v in enumerate(category_revenue):
    ax2.text(v + 1000, i, f'${v:,.0f}', va='center', fontsize=9)

# Customer Segment Distribution
ax3 = axes[1, 0]
segment_counts = rfm['customer_segment'].value_counts()
colors = ['#2ecc71', '#3498db', '#f39c12', '#e74c3c', '#95a5a6']
wedges, texts, autotexts = ax3.pie(
    segment_counts,
    labels=segment_counts.index,
    autopct='%1.1f%%',
    colors=colors,
    explode=[0.05 if i == 0 else 0 for i in range(len(segment_counts))]
)
ax3.set_title('Customer Segments', fontsize=12, fontweight='bold')

# Revenue Distribution by Day of Week
ax4 = axes[1, 1]
day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
daily_revenue = df.groupby('day_of_week')['revenue'].mean().reindex(day_order)
bars = ax4.bar(range(len(daily_revenue)), daily_revenue.values, color='steelblue')

# Highlight weekends
for i in [5, 6]:
    bars[i].set_color('coral')

ax4.set_title('Average Revenue by Day of Week', fontsize=12, fontweight='bold')
ax4.set_xticks(range(len(day_order)))
ax4.set_xticklabels([d[:3] for d in day_order])
ax4.set_ylabel('Average Revenue ($)')

plt.tight_layout()
plt.savefig('analytics_dashboard.png', dpi=150, bbox_inches='tight')
plt.show()

# Heatmap for Correlation Analysis
fig, ax = plt.subplots(figsize=(10, 8))
numeric_cols = df.select_dtypes(include=[np.number]).columns
correlation_matrix = df[numeric_cols].corr()

sns.heatmap(
    correlation_matrix,
    annot=True,
    fmt='.2f',
    cmap='RdBu_r',
    center=0,
    square=True,
    linewidths=0.5,
    ax=ax
)
ax.set_title('Correlation Matrix', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig('correlation_heatmap.png', dpi=150)
```

### Statistical Analysis

Understanding statistical concepts is fundamental for meaningful analysis.

```python
from scipy import stats
import numpy as np

# A/B Testing Analysis
# Scenario: Testing two landing page designs

control_conversions = 120
control_visitors = 1000
treatment_conversions = 145
treatment_visitors = 1000

# Calculate conversion rates
control_rate = control_conversions / control_visitors
treatment_rate = treatment_conversions / treatment_visitors
lift = (treatment_rate - control_rate) / control_rate * 100

print(f"Control Conversion Rate: {control_rate:.2%}")
print(f"Treatment Conversion Rate: {treatment_rate:.2%}")
print(f"Relative Lift: {lift:.1f}%")

# Chi-square test for significance
contingency_table = np.array([
    [control_conversions, control_visitors - control_conversions],
    [treatment_conversions, treatment_visitors - treatment_conversions]
])

chi2, p_value, dof, expected = stats.chi2_contingency(contingency_table)

print(f"\nChi-square statistic: {chi2:.4f}")
print(f"P-value: {p_value:.4f}")
print(f"Significant at 95% confidence: {'Yes' if p_value < 0.05 else 'No'}")

# Calculate confidence interval for the difference
from statsmodels.stats.proportion import confint_proportions_2indep

ci_low, ci_high = confint_proportions_2indep(
    treatment_conversions, treatment_visitors,
    control_conversions, control_visitors,
    method='wald'
)
print(f"95% Confidence Interval: [{ci_low:.4f}, {ci_high:.4f}]")

# Sample Size Calculator for Future Tests
def calculate_sample_size(baseline_rate, minimum_detectable_effect, alpha=0.05, power=0.8):
    """Calculate required sample size per variation for A/B test"""
    from statsmodels.stats.power import NormalIndPower

    effect_size = minimum_detectable_effect / np.sqrt(baseline_rate * (1 - baseline_rate))
    analysis = NormalIndPower()
    sample_size = analysis.solve_power(
        effect_size=effect_size,
        alpha=alpha,
        power=power,
        alternative='two-sided'
    )
    return int(np.ceil(sample_size))

# Example: Plan next test
baseline = 0.12  # 12% baseline conversion
mde = 0.02  # Want to detect 2% absolute improvement
required_n = calculate_sample_size(baseline, mde)
print(f"\nRequired sample size per variation: {required_n:,}")
```

## Tool Stack Overview

### Data Storage and Querying

- **SQL Databases**: PostgreSQL, MySQL, SQL Server
- **Data Warehouses**: BigQuery, Snowflake, Redshift
- **Query Engines**: Presto, Trino, Apache Spark SQL

### Data Processing

- **Python Libraries**: Pandas, NumPy, Polars
- **Big Data**: Apache Spark, Dask
- **ETL Tools**: dbt, Apache Airflow, Prefect

### Visualization and BI

- **Python**: Matplotlib, Seaborn, Plotly
- **BI Platforms**: Tableau, Power BI, Looker, Metabase
- **Notebooks**: Jupyter, Observable

### Statistical and ML

- **Statistics**: SciPy, Statsmodels
- **Machine Learning**: Scikit-learn, XGBoost, LightGBM

## Learning Path Recommendations

### Foundation (1-3 Months)

1. **SQL Fundamentals** - SELECT, JOINs, GROUP BY, subqueries
2. **Basic Statistics** - Descriptive statistics, distributions, hypothesis testing
3. **Excel/Sheets** - Formulas, pivot tables, basic charting
4. **Data Literacy** - Understanding data types, quality, and common issues

### Intermediate (3-6 Months)

1. **Advanced SQL** - Window functions, CTEs, query optimization
2. **Python with Pandas** - Data manipulation, cleaning, transformation
3. **Data Visualization** - Best practices, tool proficiency
4. **Statistical Analysis** - A/B testing, correlation, regression basics

### Advanced (6-12 Months)

1. **Data Modeling** - Dimensional modeling, star schema
2. **ETL/ELT Pipelines** - dbt, Airflow
3. **Machine Learning Basics** - Classification, regression, clustering
4. **Communication** - Storytelling with data, executive presentations

## Interview Key Points

Prepare for these common data analytics interview topics:

### SQL Skills

- Window functions (ROW_NUMBER, RANK, LAG, LEAD)
- Complex JOINs and subqueries
- Performance optimization and indexing
- Common table expressions (CTEs)

### Analysis Methods

- Cohort analysis and retention
- Funnel analysis
- A/B test design and interpretation
- Customer segmentation (RFM)

### Statistics

- Hypothesis testing and p-values
- Confidence intervals
- Sample size calculation
- Common statistical pitfalls

### Tools and Process

- Data cleaning best practices
- Visualization principles
- ETL pipeline design
- Metric definition and tracking

### Business Acumen

- Translating business questions to analytical approaches
- Communicating findings to stakeholders
- Identifying actionable insights
- Understanding common business metrics (CAC, LTV, churn)

## Further Reading

Continue exploring Code Wiki for deep dives into:

- Advanced SQL techniques
- Python data engineering
- Statistical methods for business
- Machine learning for analysts
- Data visualization best practices
- Building data pipelines

Data analytics is a field that combines technical skills with business understanding. Focus on mastering SQL and Python fundamentals, develop strong statistical intuition, and always keep the business context in mind when analyzing data.
