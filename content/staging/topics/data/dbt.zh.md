---
title: dbt 数据转换
description: 使用dbt进行数据仓库转换和建模
track: data
section: data-engineering
difficulty: intermediate
tags:
  - dbt
  - 数据转换
  - ELT
  - 数据建模
status: imported
origin: old/src/content/docs/data/dbt.zh.md
divergence: 0.275
issues: []
legacy:
  category: Data
  subcategory: ETL
  order: 17
  lastUpdated: 2026-01-07
---

dbt（data build tool）是现代数据栈中最流行的数据转换工具。它让数据分析师和工程师能够使用 SQL 进行数据建模，同时享受软件工程的最佳实践，如版本控制、测试、文档和 CI/CD。本文将全面介绍 dbt 的核心概念和实践方法。

## 什么是 dbt

### dbt 简介

dbt 是一个开源的数据转换工具，专注于 ELT（Extract, Load, Transform）流程中的 **T（Transform）** 部分。与传统 ETL 工具不同，dbt 假设数据已经加载到数据仓库中，然后在仓库内部执行转换。

```
┌─────────────────────────────────────────────────────────────────┐
│                     现代数据栈架构                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   数据源            数据集成          数据仓库          BI 工具    │
│   ──────           ──────          ──────           ──────     │
│                                                                 │
│  ┌─────────┐      ┌─────────┐     ┌─────────┐     ┌─────────┐  │
│  │ MySQL   │      │         │     │         │     │         │  │
│  │ API     │─────▶│ Fivetran│────▶│Snowflake│────▶│ Looker  │  │
│  │ Files   │      │ Airbyte │     │BigQuery │     │ Tableau │  │
│  └─────────┘      └─────────┘     │Redshift │     └─────────┘  │
│                        │          └────┬────┘                   │
│                        │               │                        │
│                    E + L              T (dbt)                   │
│                   (抽取+加载)         (转换)                      │
│                                        │                        │
│                              ┌─────────▼─────────┐              │
│                              │       dbt         │              │
│                              │  ┌─────────────┐  │              │
│                              │  │   Models    │  │              │
│                              │  │   Tests     │  │              │
│                              │  │   Docs      │  │              │
│                              │  └─────────────┘  │              │
│                              └───────────────────┘              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### dbt 的核心理念

dbt 将软件工程的最佳实践引入数据转换领域：

| 软件工程实践 | dbt 中的体现 |
|-------------|-------------|
| 版本控制 | 所有模型代码存储在 Git 仓库中 |
| 模块化 | 模型可以引用其他模型，实现代码复用 |
| 测试 | 内置数据测试框架，确保数据质量 |
| 文档 | 自动生成数据字典和血缘图 |
| 环境隔离 | 支持开发、测试、生产环境分离 |
| CI/CD | 与 GitHub Actions、GitLab CI 等集成 |

### dbt Core vs dbt Cloud

```
┌──────────────────────────────────────────────────────────────┐
│                      dbt 产品对比                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   dbt Core (开源)                    dbt Cloud (商业)         │
│   ───────────                        ────────────            │
│                                                              │
│   • 命令行工具                        • Web IDE               │
│   • 本地运行                          • 托管调度               │
│   • 免费使用                          • 团队协作               │
│   • 需要自行部署                      • 监控和告警             │
│   • 社区支持                          • 企业级支持             │
│                                                              │
│   适合：                              适合：                   │
│   个人项目、小团队                    企业级部署、大型团队      │
│   对基础设施有控制需求                需要开箱即用的解决方案    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## dbt 项目结构

### 标准项目布局

一个典型的 dbt 项目遵循以下目录结构：

```
my_dbt_project/
├── dbt_project.yml              # 项目配置文件
├── profiles.yml                 # 数据库连接配置（通常在 ~/.dbt/）
├── packages.yml                 # 依赖包配置
├── models/                      # SQL 模型目录
│   ├── staging/                 # 数据清洗层
│   │   ├── jaffle_shop/
│   │   │   ├── _jaffle_shop__sources.yml
│   │   │   ├── _jaffle_shop__models.yml
│   │   │   ├── stg_jaffle_shop__customers.sql
│   │   │   └── stg_jaffle_shop__orders.sql
│   │   └── stripe/
│   │       ├── _stripe__sources.yml
│   │       └── stg_stripe__payments.sql
│   ├── intermediate/            # 中间转换层
│   │   └── finance/
│   │       ├── _int_finance__models.yml
│   │       └── int_payments_pivoted_to_orders.sql
│   └── marts/                   # 业务数据集市
│       ├── finance/
│       │   ├── _finance__models.yml
│       │   ├── orders.sql
│       │   └── payments.sql
│       └── marketing/
│           ├── _marketing__models.yml
│           └── customers.sql
├── tests/                       # 自定义测试
│   └── assert_positive_revenue.sql
├── macros/                      # 可复用的 SQL 宏
│   └── generate_schema_name.sql
├── seeds/                       # 静态数据文件（CSV）
│   └── country_codes.csv
├── snapshots/                   # SCD Type 2 快照
│   └── customer_snapshot.sql
└── analyses/                    # 临时分析查询
    └── ad_hoc_analysis.sql
```

### 项目配置文件

```yaml
# dbt_project.yml
name: 'jaffle_shop'
version: '1.0.0'
config-version: 2

profile: 'jaffle_shop'

model-paths: ["models"]
analysis-paths: ["analyses"]
test-paths: ["tests"]
seed-paths: ["seeds"]
macro-paths: ["macros"]
snapshot-paths: ["snapshots"]

target-path: "target"
clean-targets:
  - "target"
  - "dbt_packages"

# 模型配置
models:
  jaffle_shop:
    # 默认物化方式
    +materialized: view

    staging:
      +materialized: view
      +schema: staging

    intermediate:
      +materialized: ephemeral

    marts:
      +materialized: table
      finance:
        +schema: finance
      marketing:
        +schema: marketing
```

### 连接配置

```yaml
# ~/.dbt/profiles.yml
jaffle_shop:
  target: dev
  outputs:
    dev:
      type: snowflake
      account: xy12345.us-east-1
      user: "{{ env_var('DBT_USER') }}"
      password: "{{ env_var('DBT_PASSWORD') }}"
      role: TRANSFORMER
      database: ANALYTICS_DEV
      warehouse: TRANSFORMING
      schema: DBT_{{ env_var('USER') }}
      threads: 4

    prod:
      type: snowflake
      account: xy12345.us-east-1
      user: "{{ env_var('DBT_PROD_USER') }}"
      password: "{{ env_var('DBT_PROD_PASSWORD') }}"
      role: TRANSFORMER
      database: ANALYTICS
      warehouse: TRANSFORMING
      schema: ANALYTICS
      threads: 8
```

---

## Models（模型）

### 什么是 dbt 模型

dbt 模型是一个 SQL SELECT 语句，dbt 会将其转换为数据仓库中的表或视图。每个 `.sql` 文件代表一个模型。

```sql
-- models/staging/stg_customers.sql
-- 这个 SQL 文件就是一个 dbt 模型

SELECT
    id AS customer_id,
    first_name,
    last_name,
    email,
    created_at
FROM {{ source('raw', 'customers') }}
WHERE id IS NOT NULL
```

### 模型分层架构

dbt 推荐采用分层架构组织模型：

```
┌─────────────────────────────────────────────────────────────────┐
│                        dbt 模型分层                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Sources (数据源)                                               │
│   ────────────────                                              │
│   原始数据表的声明，提供数据血缘追踪                               │
│                      │                                          │
│                      ▼                                          │
│   Staging (清洗层)                                               │
│   ────────────────                                              │
│   • 与源表 1:1 对应                                              │
│   • 重命名列、类型转换                                           │
│   • 过滤无效数据                                                 │
│   • 物化为 view                                                  │
│                      │                                          │
│                      ▼                                          │
│   Intermediate (中间层)                                          │
│   ────────────────────                                          │
│   • 复杂业务逻辑                                                 │
│   • 多表关联                                                     │
│   • 物化为 ephemeral 或 view                                     │
│                      │                                          │
│                      ▼                                          │
│   Marts (集市层)                                                 │
│   ──────────────                                                │
│   • 面向业务的宽表                                               │
│   • 最终供 BI 工具使用                                           │
│   • 物化为 table                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Staging 层示例

```sql
-- models/staging/jaffle_shop/stg_jaffle_shop__orders.sql

{{ config(
    materialized='view',
    schema='staging'
) }}

WITH source AS (
    SELECT * FROM {{ source('jaffle_shop', 'orders') }}
),

renamed AS (
    SELECT
        -- 主键
        id AS order_id,

        -- 外键
        user_id AS customer_id,

        -- 时间戳
        order_date::DATE AS order_date,

        -- 状态字段标准化
        LOWER(TRIM(status)) AS order_status,

        -- 元数据
        _etl_loaded_at,
        CURRENT_TIMESTAMP() AS _dbt_loaded_at

    FROM source
    WHERE id IS NOT NULL
)

SELECT * FROM renamed
```

### Intermediate 层示例

```sql
-- models/intermediate/finance/int_payments_pivoted_to_orders.sql

{{ config(
    materialized='ephemeral'
) }}

WITH payments AS (
    SELECT * FROM {{ ref('stg_stripe__payments') }}
),

pivoted AS (
    SELECT
        order_id,

        -- 按支付方式汇总
        SUM(CASE WHEN payment_method = 'credit_card' THEN amount ELSE 0 END) AS credit_card_amount,
        SUM(CASE WHEN payment_method = 'coupon' THEN amount ELSE 0 END) AS coupon_amount,
        SUM(CASE WHEN payment_method = 'bank_transfer' THEN amount ELSE 0 END) AS bank_transfer_amount,
        SUM(CASE WHEN payment_method = 'gift_card' THEN amount ELSE 0 END) AS gift_card_amount,

        SUM(amount) AS total_amount

    FROM payments
    WHERE status = 'success'
    GROUP BY order_id
)

SELECT * FROM pivoted
```

### Marts 层示例

```sql
-- models/marts/finance/fct_orders.sql

{{ config(
    materialized='table',
    schema='finance'
) }}

WITH orders AS (
    SELECT * FROM {{ ref('stg_jaffle_shop__orders') }}
),

customers AS (
    SELECT * FROM {{ ref('stg_jaffle_shop__customers') }}
),

payments AS (
    SELECT * FROM {{ ref('int_payments_pivoted_to_orders') }}
),

final AS (
    SELECT
        -- 订单维度
        orders.order_id,
        orders.order_date,
        orders.order_status,

        -- 客户维度
        orders.customer_id,
        customers.first_name AS customer_first_name,
        customers.last_name AS customer_last_name,

        -- 支付金额
        payments.credit_card_amount,
        payments.coupon_amount,
        payments.bank_transfer_amount,
        payments.gift_card_amount,
        payments.total_amount AS order_total,

        -- 计算字段
        CASE
            WHEN payments.total_amount > 100 THEN 'high_value'
            WHEN payments.total_amount > 50 THEN 'medium_value'
            ELSE 'low_value'
        END AS order_value_tier,

        -- 时间维度
        DATE_TRUNC('month', orders.order_date) AS order_month,
        DATE_TRUNC('quarter', orders.order_date) AS order_quarter

    FROM orders
    LEFT JOIN customers ON orders.customer_id = customers.customer_id
    LEFT JOIN payments ON orders.order_id = payments.order_id
)

SELECT * FROM final
```

---

## Materializations（物化方式）

### 物化类型对比

dbt 支持多种物化方式，适用于不同场景：

| 物化类型 | 描述 | 使用场景 | 优点 | 缺点 |
|---------|------|---------|------|------|
| `view` | 创建视图 | staging 层、轻量转换 | 不占存储空间 | 查询时计算 |
| `table` | 创建表 | marts 层、频繁查询 | 查询快 | 全量刷新慢 |
| `incremental` | 增量更新 | 大表、事件数据 | 更新快 | 配置复杂 |
| `ephemeral` | 不实际创建 | 中间 CTE | 无物理存储 | 不可直接查询 |

### View 物化

```sql
-- 最简单的物化方式，每次查询时执行
{{ config(materialized='view') }}

SELECT
    customer_id,
    COUNT(*) AS order_count,
    SUM(amount) AS total_spent
FROM {{ ref('stg_orders') }}
GROUP BY customer_id
```

### Table 物化

```sql
-- 创建物理表，适合频繁查询的数据
{{ config(
    materialized='table',
    sort='order_date',
    dist='customer_id'  -- Redshift 特有配置
) }}

SELECT
    order_id,
    customer_id,
    order_date,
    amount
FROM {{ ref('stg_orders') }}
```

### Incremental 物化

增量模型只处理新数据，大幅提升大表的更新效率：

```sql
-- models/marts/fct_events.sql

{{ config(
    materialized='incremental',
    unique_key='event_id',
    incremental_strategy='merge',  -- 或 'delete+insert', 'append'
    on_schema_change='sync_all_columns'
) }}

WITH source_events AS (
    SELECT
        event_id,
        user_id,
        event_type,
        event_timestamp,
        properties
    FROM {{ source('analytics', 'events') }}

    {% if is_incremental() %}
    -- 只处理上次运行后的新数据
    WHERE event_timestamp > (SELECT MAX(event_timestamp) FROM {{ this }})
    {% endif %}
)

SELECT
    event_id,
    user_id,
    event_type,
    event_timestamp,
    properties,
    CURRENT_TIMESTAMP() AS _loaded_at
FROM source_events
```

### Incremental 策略对比

```yaml
# 不同增量策略的适用场景

# append - 仅追加，不处理更新
{{ config(
    materialized='incremental',
    incremental_strategy='append'
) }}
# 适用：日志数据、事件流

# merge - 基于 unique_key 合并更新
{{ config(
    materialized='incremental',
    incremental_strategy='merge',
    unique_key='id'
) }}
# 适用：需要更新历史记录的场景

# delete+insert - 先删后插
{{ config(
    materialized='incremental',
    incremental_strategy='delete+insert',
    unique_key='id'
) }}
# 适用：Redshift 等不支持 MERGE 的平台
```

### Ephemeral 物化

```sql
-- 不创建物理对象，作为 CTE 嵌入下游模型
{{ config(materialized='ephemeral') }}

SELECT
    user_id,
    SUM(amount) AS lifetime_value
FROM {{ ref('stg_orders') }}
GROUP BY user_id
```

---

## Sources 和 Refs

### 定义 Sources（数据源）

Sources 用于声明外部数据表，提供数据血缘追踪和新鲜度检查：

```yaml
# models/staging/jaffle_shop/_jaffle_shop__sources.yml

version: 2

sources:
  - name: jaffle_shop
    description: "Jaffle Shop 交易系统数据"
    database: raw
    schema: jaffle_shop

    # 数据新鲜度检查
    freshness:
      warn_after: { count: 12, period: hour }
      error_after: { count: 24, period: hour }
    loaded_at_field: _etl_loaded_at

    tables:
      - name: customers
        description: "客户主数据表"
        columns:
          - name: id
            description: "客户唯一标识"
            data_tests:
              - unique
              - not_null
          - name: email
            description: "客户邮箱"

      - name: orders
        description: "订单表"
        identifier: raw_orders  # 实际表名与逻辑名不同时使用
        freshness:
          warn_after: { count: 6, period: hour }
        columns:
          - name: id
            description: "订单ID"
          - name: user_id
            description: "关联客户ID"
          - name: status
            description: "订单状态"
```

### 使用 source() 函数

```sql
-- 在模型中引用数据源
SELECT *
FROM {{ source('jaffle_shop', 'customers') }}

-- 编译后生成：
-- SELECT * FROM raw.jaffle_shop.customers
```

### 使用 ref() 函数

`ref()` 是 dbt 最重要的函数，用于引用其他模型并自动构建依赖关系：

```sql
-- 引用同一项目中的模型
SELECT * FROM {{ ref('stg_customers') }}

-- 引用其他项目的模型（dbt Mesh）
SELECT * FROM {{ ref('analytics', 'fct_orders') }}
```

### ref 的工作原理

```
┌─────────────────────────────────────────────────────────────────┐
│                     ref() 函数的作用                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1. 依赖管理                                                    │
│   ────────────                                                  │
│   自动识别模型间的依赖关系，确保正确的执行顺序                      │
│                                                                 │
│   2. 环境适配                                                    │
│   ────────────                                                  │
│   根据目标环境自动生成正确的 schema/database 前缀                  │
│                                                                 │
│   3. 血缘追踪                                                    │
│   ────────────                                                  │
│   构建完整的数据血缘图谱                                          │
│                                                                 │
│   示例：                                                         │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│   │ stg_orders  │────▶│ int_orders  │────▶│ fct_orders  │       │
│   └─────────────┘     └─────────────┘     └─────────────┘       │
│                                                                 │
│   {{ ref('stg_orders') }}      {{ ref('int_orders') }}          │
│                                                                 │
│   开发环境编译：dev_schema.stg_orders                            │
│   生产环境编译：prod_schema.stg_orders                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tests（测试）

### 数据测试概述

dbt 提供两种测试类型：

1. **Generic Tests（通用测试）**：内置的可配置测试
2. **Singular Tests（单一测试）**：自定义 SQL 测试

### 内置通用测试

dbt 提供四种内置测试：

```yaml
# models/staging/_staging__models.yml

version: 2

models:
  - name: stg_orders
    description: "清洗后的订单数据"
    columns:
      - name: order_id
        description: "订单唯一标识"
        data_tests:
          - unique           # 值必须唯一
          - not_null         # 值不能为空

      - name: status
        description: "订单状态"
        data_tests:
          - accepted_values:  # 值必须在指定列表中
              values: ['placed', 'shipped', 'completed', 'returned']

      - name: customer_id
        description: "客户ID"
        data_tests:
          - not_null
          - relationships:    # 引用完整性测试
              to: ref('stg_customers')
              field: customer_id
```

### 测试严重级别

```yaml
# 配置测试的严重级别
columns:
  - name: amount
    data_tests:
      - not_null:
          severity: error     # 失败会导致构建失败
      - dbt_utils.accepted_range:
          min_value: 0
          severity: warn      # 失败只会警告
```

### 自定义单一测试

```sql
-- tests/assert_total_revenue_positive.sql
-- 返回结果的行数 > 0 表示测试失败

SELECT
    order_date,
    SUM(amount) AS daily_revenue
FROM {{ ref('fct_orders') }}
GROUP BY order_date
HAVING SUM(amount) < 0
```

### 自定义通用测试

```sql
-- macros/test_is_positive.sql

{% test is_positive(model, column_name) %}

SELECT
    {{ column_name }} AS failing_value
FROM {{ model }}
WHERE {{ column_name }} < 0

{% endtest %}
```

```yaml
# 使用自定义测试
columns:
  - name: amount
    data_tests:
      - is_positive
```

### 使用 dbt_utils 扩展测试

```yaml
# packages.yml
packages:
  - package: dbt-labs/dbt_utils
    version: 1.1.1
```

```yaml
# 使用 dbt_utils 提供的测试
models:
  - name: fct_orders
    data_tests:
      # 表级测试
      - dbt_utils.unique_combination_of_columns:
          combination_of_columns:
            - order_id
            - line_item_id

    columns:
      - name: amount
        data_tests:
          - dbt_utils.accepted_range:
              min_value: 0
              max_value: 100000

      - name: email
        data_tests:
          - dbt_utils.not_null_proportion:
              at_least: 0.95  # 至少 95% 非空
```

### 运行测试

```bash
# 运行所有测试
dbt test

# 运行特定模型的测试
dbt test --select stg_orders

# 只运行数据测试（排除单一测试）
dbt test --select test_type:generic

# 运行上游模型的测试
dbt test --select +fct_orders
```

---

## Documentation（文档）

### 编写模型文档

```yaml
# models/marts/finance/_finance__models.yml

version: 2

models:
  - name: fct_orders
    description: |
      **订单事实表**

      包含所有已完成订单的详细信息，是销售分析的核心数据源。

      ### 数据粒度
      每行代表一个订单

      ### 主要用途
      - 销售报表
      - 客户分析
      - 财务对账

      ### 数据刷新
      每日凌晨 2:00 全量刷新

    columns:
      - name: order_id
        description: "订单唯一标识，格式：ORD-YYYYMMDD-XXXX"

      - name: customer_id
        description: "客户ID，关联 dim_customers 表"

      - name: order_total
        description: |
          订单总金额（人民币）

          计算公式：商品金额 - 优惠金额 + 运费

      - name: order_status
        description: |
          订单状态：
          - `placed`: 已下单
          - `shipped`: 已发货
          - `completed`: 已完成
          - `returned`: 已退货
```

### 使用 Doc Blocks

```markdown
-- models/staging/jaffle_shop/_jaffle_shop__docs.md

{% docs customer_id %}
客户唯一标识符。

这是一个自增主键，由交易系统自动生成。可用于关联以下表：
- `stg_orders.customer_id`
- `stg_payments.customer_id`

**注意**：历史数据中可能存在已删除的客户ID。
{% enddocs %}

{% docs order_status %}
订单当前状态。

| 状态值 | 描述 | 后续状态 |
|-------|------|---------|
| placed | 已下单 | shipped, cancelled |
| shipped | 已发货 | completed, returned |
| completed | 已完成 | returned |
| returned | 已退货 | - |
| cancelled | 已取消 | - |

状态转换遵循以上规则，不可逆向转换。
{% enddocs %}
```

```yaml
# 引用 doc blocks
columns:
  - name: customer_id
    description: "{{ doc('customer_id') }}"

  - name: order_status
    description: "{{ doc('order_status') }}"
```

### 生成和查看文档

```bash
# 生成文档
dbt docs generate

# 启动文档服务器
dbt docs serve

# 指定端口
dbt docs serve --port 8001
```

### 文档站点功能

```
┌─────────────────────────────────────────────────────────────────┐
│                     dbt 文档站点                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │  模型列表           模型详情                              │   │
│   │  ─────────          ─────────                            │   │
│   │  📁 staging         名称: fct_orders                     │   │
│   │    📄 stg_orders    描述: 订单事实表                     │   │
│   │    📄 stg_customers 物化: table                          │   │
│   │  📁 marts           Schema: finance                      │   │
│   │    📄 fct_orders                                         │   │
│   │                     列信息:                              │   │
│   │                     ├── order_id (string)                │   │
│   │                     ├── customer_id (integer)            │   │
│   │                     └── order_total (decimal)            │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    数据血缘图 (DAG)                       │   │
│   │                                                         │   │
│   │   [source.orders] ──▶ [stg_orders] ──▶ [fct_orders]     │   │
│   │                                              │          │   │
│   │   [source.customers] ──▶ [stg_customers] ────┘          │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Macros（宏）

### 什么是 Macro

Macro 是 dbt 中的可复用代码块，使用 Jinja 模板语言编写。可以将其理解为 SQL 中的函数。

### 基础 Macro 示例

```sql
-- macros/cents_to_dollars.sql

{% macro cents_to_dollars(column_name, decimal_places=2) %}
    ROUND({{ column_name }} / 100.0, {{ decimal_places }})
{% endmacro %}
```

```sql
-- 在模型中使用
SELECT
    order_id,
    {{ cents_to_dollars('amount_cents') }} AS amount_dollars,
    {{ cents_to_dollars('tax_cents', 4) }} AS tax_dollars
FROM {{ ref('stg_orders') }}
```

### 生成代理键

```sql
-- macros/generate_surrogate_key.sql

{% macro generate_surrogate_key(field_list) %}
    {{ dbt_utils.generate_surrogate_key(field_list) }}
{% endmacro %}
```

```sql
-- 使用示例
SELECT
    {{ generate_surrogate_key(['order_id', 'line_item_id']) }} AS order_line_key,
    order_id,
    line_item_id,
    amount
FROM {{ ref('stg_order_lines') }}
```

### 日期维度生成

```sql
-- macros/generate_date_spine.sql

{% macro generate_date_spine(start_date, end_date) %}

WITH date_spine AS (
    {{ dbt_utils.date_spine(
        datepart="day",
        start_date="cast('" ~ start_date ~ "' as date)",
        end_date="cast('" ~ end_date ~ "' as date)"
    ) }}
)

SELECT
    date_day,
    EXTRACT(YEAR FROM date_day) AS year,
    EXTRACT(MONTH FROM date_day) AS month,
    EXTRACT(DAY FROM date_day) AS day,
    EXTRACT(DOW FROM date_day) AS day_of_week,
    CASE
        WHEN EXTRACT(DOW FROM date_day) IN (0, 6) THEN TRUE
        ELSE FALSE
    END AS is_weekend
FROM date_spine

{% endmacro %}
```

### 动态 Schema 生成

```sql
-- macros/generate_schema_name.sql

{% macro generate_schema_name(custom_schema_name, node) %}
    {%- set default_schema = target.schema -%}

    {%- if custom_schema_name is none -%}
        {{ default_schema }}
    {%- elif target.name == 'prod' -%}
        {{ custom_schema_name | trim }}
    {%- else -%}
        {{ default_schema }}_{{ custom_schema_name | trim }}
    {%- endif -%}
{% endmacro %}
```

### 条件编译

```sql
-- macros/limit_data_in_dev.sql

{% macro limit_data_in_dev(column_name, days=3) %}
    {% if target.name == 'dev' %}
        WHERE {{ column_name }} >= DATEADD(day, -{{ days }}, CURRENT_DATE())
    {% endif %}
{% endmacro %}
```

```sql
-- 使用示例
SELECT *
FROM {{ source('events', 'page_views') }}
{{ limit_data_in_dev('event_timestamp') }}
```

### 自定义物化

```sql
-- macros/materialization_insert_by_period.sql

{% materialization insert_by_period, adapter='snowflake' %}
    {%- set period = config.get('period', 'day') -%}
    {%- set timestamp_field = config.require('timestamp_field') -%}

    -- 自定义物化逻辑
    {% call statement('main') %}
        -- DDL 和 DML 语句
    {% endcall %}

    {{ return({'relations': [this]}) }}
{% endmaterialization %}
```

---

## Packages（包）

### 什么是 dbt 包

dbt 包是可复用的 dbt 项目，包含模型、宏、测试等资源。使用包可以避免重复造轮子。

### 配置包依赖

```yaml
# packages.yml

packages:
  # 从 dbt Hub 安装
  - package: dbt-labs/dbt_utils
    version: 1.1.1

  - package: dbt-labs/codegen
    version: 0.12.1

  - package: calogica/dbt_expectations
    version: 0.10.1

  # 从 Git 安装
  - git: "https://github.com/company/internal-dbt-package.git"
    revision: v1.0.0

  # 从本地安装
  - local: /path/to/local/package
```

```bash
# 安装包
dbt deps
```

### 常用 dbt 包

| 包名 | 功能 | 常用宏/测试 |
|-----|------|-----------|
| dbt_utils | 通用工具 | `generate_surrogate_key`, `pivot`, `star` |
| dbt_expectations | 高级测试 | `expect_column_values_to_be_between` |
| codegen | 代码生成 | `generate_model_yaml`, `generate_source` |
| dbt_date | 日期处理 | `get_date_dimension`, `periods_since` |
| audit_helper | 数据审计 | `compare_relations`, `compare_column_values` |

### dbt_utils 使用示例

```sql
-- 使用 star 宏选择所有列
SELECT
    {{ dbt_utils.star(from=ref('stg_orders'), except=['_loaded_at']) }}
FROM {{ ref('stg_orders') }}

-- 使用 pivot 宏进行行转列
SELECT
    order_id,
    {{ dbt_utils.pivot(
        column='payment_method',
        values=['credit_card', 'bank_transfer', 'coupon'],
        agg='sum',
        then_value='amount',
        prefix='amount_'
    ) }}
FROM {{ ref('stg_payments') }}
GROUP BY order_id

-- 生成代理键
SELECT
    {{ dbt_utils.generate_surrogate_key(['user_id', 'session_id']) }} AS session_key,
    user_id,
    session_id
FROM {{ ref('stg_sessions') }}
```

### codegen 使用示例

```bash
# 生成模型的 YAML 文档
dbt run-operation generate_model_yaml --args '{"model_names": ["stg_orders"]}'

# 生成源的 YAML 配置
dbt run-operation generate_source --args '{"schema_name": "raw", "database_name": "analytics"}'

# 生成基础模型 SQL
dbt run-operation generate_base_model --args '{"source_name": "jaffle_shop", "table_name": "orders"}'
```

---

## CI/CD 集成

### GitHub Actions 配置

```yaml
# .github/workflows/dbt_ci.yml

name: dbt CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

env:
  DBT_PROFILES_DIR: ./
  DBT_USER: ${{ secrets.DBT_USER }}
  DBT_PASSWORD: ${{ secrets.DBT_PASSWORD }}

jobs:
  dbt-test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: Install dependencies
        run: |
          pip install dbt-snowflake==1.7.0
          dbt deps

      - name: Run dbt debug
        run: dbt debug

      - name: Run dbt build (slim CI)
        if: github.event_name == 'pull_request'
        run: |
          # 只构建变更的模型及其下游
          dbt build --select state:modified+ --state ./target-base

      - name: Run dbt build (full)
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        run: dbt build

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: dbt-artifacts
          path: |
            target/manifest.json
            target/run_results.json
```

### Slim CI 策略

```yaml
# 只测试变更的模型
jobs:
  slim-ci:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout PR branch
        uses: actions/checkout@v4

      - name: Download production manifest
        run: |
          # 从生产环境下载 manifest.json
          aws s3 cp s3://dbt-artifacts/manifest.json ./target-base/manifest.json

      - name: Run modified models only
        run: |
          dbt build --select state:modified+ --defer --state ./target-base
```

### GitLab CI 配置

```yaml
# .gitlab-ci.yml

stages:
  - test
  - deploy

variables:
  DBT_PROFILES_DIR: ./

.dbt-base:
  image: python:3.10
  before_script:
    - pip install dbt-snowflake==1.7.0
    - dbt deps

dbt-test:
  extends: .dbt-base
  stage: test
  script:
    - dbt debug
    - dbt build --select state:modified+ --defer --state ./prod-manifest
  only:
    - merge_requests
  artifacts:
    paths:
      - target/

dbt-deploy:
  extends: .dbt-base
  stage: deploy
  script:
    - dbt build --target prod
    - dbt docs generate
  only:
    - main
  artifacts:
    paths:
      - target/manifest.json
      - target/catalog.json
```

### pre-commit 配置

```yaml
# .pre-commit-config.yaml

repos:
  - repo: https://github.com/sqlfluff/sqlfluff
    rev: 2.3.2
    hooks:
      - id: sqlfluff-lint
        args: [--dialect, snowflake]

  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml

  - repo: local
    hooks:
      - id: dbt-compile
        name: dbt compile
        entry: dbt compile
        language: system
        pass_filenames: false
```

### 部署最佳实践

```
┌─────────────────────────────────────────────────────────────────┐
│                     dbt 部署流程                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   开发阶段                                                       │
│   ────────                                                      │
│   1. 开发者在本地开发，使用 dev 环境                              │
│   2. 提交 PR，触发 CI 流水线                                     │
│   3. CI 运行 slim build（只测试变更）                            │
│   4. 代码审查通过后合并                                          │
│                                                                 │
│   部署阶段                                                       │
│   ────────                                                      │
│   1. 合并到 main 触发 CD 流水线                                  │
│   2. 运行完整的 dbt build                                        │
│   3. 生成文档并部署                                              │
│   4. 保存 manifest.json 供下次 slim CI 使用                      │
│                                                                 │
│   调度运行                                                       │
│   ────────                                                      │
│   1. 使用 Airflow/dbt Cloud 调度                                 │
│   2. 定时运行 dbt run                                            │
│   3. 运行 dbt test 验证数据质量                                  │
│   4. 发送运行结果通知                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 实战案例

### 电商数据仓库示例

```sql
-- models/staging/ecommerce/stg_ecommerce__orders.sql

{{ config(
    materialized='view',
    schema='staging'
) }}

WITH source AS (
    SELECT * FROM {{ source('ecommerce', 'orders') }}
),

cleaned AS (
    SELECT
        -- 主键
        order_id,

        -- 外键
        customer_id,

        -- 订单信息
        CAST(order_date AS DATE) AS order_date,
        CAST(ship_date AS DATE) AS ship_date,
        LOWER(TRIM(order_status)) AS order_status,

        -- 金额（分转元）
        {{ cents_to_dollars('subtotal_cents') }} AS subtotal,
        {{ cents_to_dollars('discount_cents') }} AS discount,
        {{ cents_to_dollars('shipping_cents') }} AS shipping,
        {{ cents_to_dollars('tax_cents') }} AS tax,
        {{ cents_to_dollars('total_cents') }} AS total,

        -- 元数据
        _etl_loaded_at

    FROM source
    WHERE order_id IS NOT NULL
)

SELECT * FROM cleaned
```

```sql
-- models/marts/core/dim_customers.sql

{{ config(
    materialized='table',
    schema='core'
) }}

WITH customers AS (
    SELECT * FROM {{ ref('stg_ecommerce__customers') }}
),

orders AS (
    SELECT * FROM {{ ref('stg_ecommerce__orders') }}
),

customer_orders AS (
    SELECT
        customer_id,
        MIN(order_date) AS first_order_date,
        MAX(order_date) AS most_recent_order_date,
        COUNT(*) AS number_of_orders,
        SUM(total) AS lifetime_value
    FROM orders
    GROUP BY customer_id
),

final AS (
    SELECT
        customers.customer_id,
        customers.first_name,
        customers.last_name,
        customers.email,
        customers.created_at AS customer_created_at,

        -- 订单汇总
        COALESCE(customer_orders.first_order_date, NULL) AS first_order_date,
        COALESCE(customer_orders.most_recent_order_date, NULL) AS most_recent_order_date,
        COALESCE(customer_orders.number_of_orders, 0) AS number_of_orders,
        COALESCE(customer_orders.lifetime_value, 0) AS lifetime_value,

        -- 客户分层
        CASE
            WHEN customer_orders.lifetime_value >= 1000 THEN 'platinum'
            WHEN customer_orders.lifetime_value >= 500 THEN 'gold'
            WHEN customer_orders.lifetime_value >= 100 THEN 'silver'
            WHEN customer_orders.number_of_orders >= 1 THEN 'bronze'
            ELSE 'prospect'
        END AS customer_tier,

        -- 计算客户活跃天数
        DATEDIFF(day, customers.created_at, CURRENT_DATE()) AS days_as_customer

    FROM customers
    LEFT JOIN customer_orders USING (customer_id)
)

SELECT * FROM final
```

---

## 面试要点

### 常见面试题

**Q1: dbt 是什么？它解决了什么问题？**

A: dbt 是一个数据转换工具，专注于 ELT 流程中的 Transform 环节。它解决的问题包括：
- 将软件工程最佳实践引入数据转换
- 提供模块化、可测试的 SQL 开发体验
- 自动化数据血缘追踪和文档生成
- 支持增量更新和 CI/CD 集成

**Q2: ref() 函数的作用是什么？**

A: `ref()` 是 dbt 最核心的函数，有三个主要作用：
1. 自动构建模型间的依赖关系
2. 根据目标环境生成正确的表引用
3. 支持数据血缘图的生成

**Q3: 什么时候使用 incremental 物化？**

A: 适合使用 incremental 物化的场景：
- 数据量大，全量刷新耗时过长
- 数据有明确的时间戳或自增ID
- 历史数据不会被修改
- 需要保持高频更新

**Q4: dbt 如何保证数据质量？**

A: dbt 通过多层次机制保证数据质量：
- 内置通用测试（unique, not_null, accepted_values, relationships）
- 自定义单一测试（SQL 查询）
- dbt_expectations 等扩展包
- 源数据新鲜度检查
- CI/CD 流水线集成

**Q5: 如何组织 dbt 项目结构？**

A: 推荐的分层结构：
1. **staging**：1:1 映射源表，负责清洗和标准化
2. **intermediate**：处理复杂业务逻辑，通常为 ephemeral
3. **marts**：面向业务的最终宽表，供 BI 工具使用

---

## 延伸阅读

### 官方资源

- [dbt 官方文档](https://docs.getdbt.com/) - 最权威的学习资源
- [dbt Learn](https://courses.getdbt.com/) - 官方免费课程
- [dbt Community](https://community.getdbt.com/) - 社区论坛

### 推荐书籍

- **《Analytics Engineering with dbt》** - 官方出品的实践指南
- **《The Data Warehouse Toolkit》** - 维度建模经典

### 相关工具

- **调度工具**：Airflow、Prefect、Dagster
- **数据集成**：Fivetran、Airbyte、Stitch
- **数据仓库**：Snowflake、BigQuery、Redshift、Databricks
- **BI 工具**：Looker、Tableau、Metabase

---

> **总结**：dbt 已成为现代数据栈的核心组件，它让数据团队能够像软件工程师一样工作。掌握 dbt 的模型分层、测试策略、文档规范和 CI/CD 集成，将大幅提升数据工程的效率和质量。建议从官方教程开始，逐步在实际项目中应用这些最佳实践。
