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
origin: old/src/content/docs/data/getting-started.zh.md
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

欢迎来到 Code Wiki 的数据分析板块！本综合指南将帮助您了解成为熟练数据分析师或数据科学家所需的核心技能、工具和学习路径。

## 什么是数据分析

数据分析是检查、清洗、转换和建模数据的过程，旨在发现有用信息、得出结论并支持决策制定。它涵盖了从简单聚合到复杂机器学习模型的一系列技术。

数据分析帮助组织：

- 了解客户行为和偏好
- 优化业务运营和流程
- 识别数据中的趋势和模式
- 做出数据驱动的决策
- 预测未来结果和趋势
- 衡量和提升绩效

### 数据分析的类型

**描述性分析**：发生了什么？总结历史数据以了解过去的表现。

**诊断性分析**：为什么会发生？分析数据以了解事件原因。

**预测性分析**：将会发生什么？使用统计模型预测未来结果。

**规范性分析**：我们应该怎么做？基于分析结果提供行动建议。

### 数据分析工作流程

```
数据收集 → 数据清洗 → 数据探索 → 分析 → 可视化 → 沟通
     ↑                                                │
     └──────────────────── 反馈循环 ─────────────────────┘
```

## 核心技能

### SQL - 数据分析的基础

SQL（结构化查询语言）是处理关系型数据库的主要语言，对任何数据专业人员都至关重要。

```sql
-- 基础数据探索
-- 统计记录数量并检查空值
SELECT
    COUNT(*) as total_records,
    COUNT(email) as records_with_email,
    COUNT(*) - COUNT(email) as null_emails
FROM users;

-- 使用 GROUP BY 进行数据聚合
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

-- 用于高级分析的窗口函数
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

-- 群组分析查询
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

-- 漏斗分析
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

### Python 数据分析

Python 拥有丰富的数据库生态系统，是数据分析和数据科学中最流行的语言。

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta

# 读取和探索数据
df = pd.read_csv('sales_data.csv', parse_dates=['order_date'])

# 初步探索
print(f"数据集形状: {df.shape}")
print(f"\n列类型:\n{df.dtypes}")
print(f"\n缺失值:\n{df.isnull().sum()}")
print(f"\n基本统计:\n{df.describe()}")

# 数据清洗
# 处理缺失值
df['revenue'].fillna(df['revenue'].median(), inplace=True)
df['category'].fillna('Unknown', inplace=True)

# 删除重复项
df = df.drop_duplicates(subset=['order_id'])

# 数据类型转换
df['customer_id'] = df['customer_id'].astype(str)
df['order_date'] = pd.to_datetime(df['order_date'])

# 特征工程
df['order_month'] = df['order_date'].dt.to_period('M')
df['day_of_week'] = df['order_date'].dt.day_name()
df['is_weekend'] = df['order_date'].dt.dayofweek >= 5

# 聚合和分析
monthly_revenue = df.groupby('order_month').agg({
    'revenue': ['sum', 'mean', 'count'],
    'customer_id': 'nunique'
}).round(2)

monthly_revenue.columns = ['total_revenue', 'avg_order_value', 'order_count', 'unique_customers']
monthly_revenue['revenue_per_customer'] = (
    monthly_revenue['total_revenue'] / monthly_revenue['unique_customers']
).round(2)

print(monthly_revenue)

# 数据透视表分析
pivot = pd.pivot_table(
    df,
    values='revenue',
    index='category',
    columns='order_month',
    aggfunc='sum',
    fill_value=0
)

# 计算环比增长
mom_growth = pivot.pct_change(axis=1) * 100
print(f"\n环比增长率 (%):\n{mom_growth.round(2)}")

# 使用 RFM 分析进行客户细分
today = df['order_date'].max() + timedelta(days=1)

rfm = df.groupby('customer_id').agg({
    'order_date': lambda x: (today - x.max()).days,  # 最近一次消费（Recency）
    'order_id': 'count',  # 消费频率（Frequency）
    'revenue': 'sum'  # 消费金额（Monetary）
})

rfm.columns = ['recency', 'frequency', 'monetary']

# 客户评分（1-5 分制）
rfm['r_score'] = pd.qcut(rfm['recency'], q=5, labels=[5, 4, 3, 2, 1])
rfm['f_score'] = pd.qcut(rfm['frequency'].rank(method='first'), q=5, labels=[1, 2, 3, 4, 5])
rfm['m_score'] = pd.qcut(rfm['monetary'], q=5, labels=[1, 2, 3, 4, 5])

rfm['rfm_segment'] = rfm['r_score'].astype(str) + rfm['f_score'].astype(str) + rfm['m_score'].astype(str)
rfm['rfm_score'] = rfm[['r_score', 'f_score', 'm_score']].astype(int).sum(axis=1)

# 客户分类
def classify_customer(row):
    if row['rfm_score'] >= 12:
        return '冠军客户'
    elif row['rfm_score'] >= 9:
        return '忠实客户'
    elif row['rfm_score'] >= 6:
        return '潜力客户'
    elif row['rfm_score'] >= 4:
        return '风险客户'
    else:
        return '流失客户'

rfm['customer_segment'] = rfm.apply(classify_customer, axis=1)
print(f"\n客户细分:\n{rfm['customer_segment'].value_counts()}")
```

### 数据可视化

有效的可视化对于传达洞察至关重要。

```python
import matplotlib.pyplot as plt
import seaborn as sns

# 设置样式
plt.style.use('seaborn-v0_8-whitegrid')
sns.set_palette("husl")

# 创建综合仪表板
fig, axes = plt.subplots(2, 2, figsize=(14, 10))

# 收入趋势随时间变化
ax1 = axes[0, 0]
monthly_data = df.groupby(df['order_date'].dt.to_period('M'))['revenue'].sum()
monthly_data.plot(kind='line', ax=ax1, marker='o', linewidth=2)
ax1.set_title('月度收入趋势', fontsize=12, fontweight='bold')
ax1.set_xlabel('月份')
ax1.set_ylabel('收入 ($)')
ax1.tick_params(axis='x', rotation=45)

# 添加趋势线
z = np.polyfit(range(len(monthly_data)), monthly_data.values, 1)
p = np.poly1d(z)
ax1.plot(range(len(monthly_data)), p(range(len(monthly_data))),
         "r--", alpha=0.8, label='趋势')
ax1.legend()

# 按类别统计收入
ax2 = axes[0, 1]
category_revenue = df.groupby('category')['revenue'].sum().sort_values(ascending=True)
colors = plt.cm.viridis(np.linspace(0, 0.8, len(category_revenue)))
category_revenue.plot(kind='barh', ax=ax2, color=colors)
ax2.set_title('按类别统计收入', fontsize=12, fontweight='bold')
ax2.set_xlabel('收入 ($)')

# 添加数值标签
for i, v in enumerate(category_revenue):
    ax2.text(v + 1000, i, f'${v:,.0f}', va='center', fontsize=9)

# 客户细分分布
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
ax3.set_title('客户细分', fontsize=12, fontweight='bold')

# 按星期统计收入分布
ax4 = axes[1, 1]
day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
daily_revenue = df.groupby('day_of_week')['revenue'].mean().reindex(day_order)
bars = ax4.bar(range(len(daily_revenue)), daily_revenue.values, color='steelblue')

# 突出显示周末
for i in [5, 6]:
    bars[i].set_color('coral')

ax4.set_title('按星期统计平均收入', fontsize=12, fontweight='bold')
ax4.set_xticks(range(len(day_order)))
ax4.set_xticklabels([d[:3] for d in day_order])
ax4.set_ylabel('平均收入 ($)')

plt.tight_layout()
plt.savefig('analytics_dashboard.png', dpi=150, bbox_inches='tight')
plt.show()

# 相关性分析热力图
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
ax.set_title('相关性矩阵', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.savefig('correlation_heatmap.png', dpi=150)
```

### 统计分析

理解统计概念是进行有意义分析的基础。

```python
from scipy import stats
import numpy as np

# A/B 测试分析
# 场景：测试两个着陆页设计

control_conversions = 120
control_visitors = 1000
treatment_conversions = 145
treatment_visitors = 1000

# 计算转化率
control_rate = control_conversions / control_visitors
treatment_rate = treatment_conversions / treatment_visitors
lift = (treatment_rate - control_rate) / control_rate * 100

print(f"对照组转化率: {control_rate:.2%}")
print(f"实验组转化率: {treatment_rate:.2%}")
print(f"相对提升: {lift:.1f}%")

# 卡方检验以判断显著性
contingency_table = np.array([
    [control_conversions, control_visitors - control_conversions],
    [treatment_conversions, treatment_visitors - treatment_conversions]
])

chi2, p_value, dof, expected = stats.chi2_contingency(contingency_table)

print(f"\n卡方统计量: {chi2:.4f}")
print(f"P 值: {p_value:.4f}")
print(f"在 95% 置信水平下显著: {'是' if p_value < 0.05 else '否'}")

# 计算差异的置信区间
from statsmodels.stats.proportion import confint_proportions_2indep

ci_low, ci_high = confint_proportions_2indep(
    treatment_conversions, treatment_visitors,
    control_conversions, control_visitors,
    method='wald'
)
print(f"95% 置信区间: [{ci_low:.4f}, {ci_high:.4f}]")

# 未来测试的样本量计算器
def calculate_sample_size(baseline_rate, minimum_detectable_effect, alpha=0.05, power=0.8):
    """计算 A/B 测试每个变体所需的样本量"""
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

# 示例：规划下一次测试
baseline = 0.12  # 12% 基线转化率
mde = 0.02  # 希望检测到 2% 的绝对提升
required_n = calculate_sample_size(baseline, mde)
print(f"\n每个变体所需样本量: {required_n:,}")
```

## 工具栈概览

### 数据存储和查询

- **SQL 数据库**：PostgreSQL、MySQL、SQL Server
- **数据仓库**：BigQuery、Snowflake、Redshift
- **查询引擎**：Presto、Trino、Apache Spark SQL

### 数据处理

- **Python 库**：Pandas、NumPy、Polars
- **大数据**：Apache Spark、Dask
- **ETL 工具**：dbt、Apache Airflow、Prefect

### 可视化和 BI

- **Python**：Matplotlib、Seaborn、Plotly
- **BI 平台**：Tableau、Power BI、Looker、Metabase
- **笔记本**：Jupyter、Observable

### 统计和机器学习

- **统计**：SciPy、Statsmodels
- **机器学习**：Scikit-learn、XGBoost、LightGBM

## 学习路径建议

### 基础阶段（1-3 个月）

1. **SQL 基础** - SELECT、JOIN、GROUP BY、子查询
2. **基础统计** - 描述性统计、分布、假设检验
3. **Excel/Sheets** - 公式、数据透视表、基础图表
4. **数据素养** - 理解数据类型、质量和常见问题

### 中级阶段（3-6 个月）

1. **高级 SQL** - 窗口函数、CTE、查询优化
2. **Python 与 Pandas** - 数据处理、清洗、转换
3. **数据可视化** - 最佳实践、工具熟练度
4. **统计分析** - A/B 测试、相关性、回归基础

### 高级阶段（6-12 个月）

1. **数据建模** - 维度建模、星型模式
2. **ETL/ELT 管道** - dbt、Airflow
3. **机器学习基础** - 分类、回归、聚类
4. **沟通能力** - 用数据讲故事、高管汇报

## 面试重点

为以下常见数据分析面试主题做准备：

### SQL 技能

- 窗口函数（ROW_NUMBER、RANK、LAG、LEAD）
- 复杂 JOIN 和子查询
- 性能优化和索引
- 公用表表达式（CTE）

### 分析方法

- 群组分析和留存率
- 漏斗分析
- A/B 测试设计和解读
- 客户细分（RFM）

### 统计学

- 假设检验和 P 值
- 置信区间
- 样本量计算
- 常见统计陷阱

### 工具和流程

- 数据清洗最佳实践
- 可视化原则
- ETL 管道设计
- 指标定义和追踪

### 商业洞察力

- 将业务问题转化为分析方法
- 向利益相关者传达发现
- 识别可操作的洞察
- 理解常见业务指标（CAC、LTV、流失率）

## 延伸阅读

继续探索 Code Wiki 以深入了解：

- 高级 SQL 技术
- Python 数据工程
- 商业统计方法
- 面向分析师的机器学习
- 数据可视化最佳实践
- 构建数据管道

数据分析是一个将技术技能与商业理解相结合的领域。专注于掌握 SQL 和 Python 基础，培养敏锐的统计直觉，并在分析数据时始终牢记业务背景。
