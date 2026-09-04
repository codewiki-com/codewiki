---
title: 数据仓库完全指南
description: 掌握数据仓库设计与建模，构建企业级分析平台
track: data
section: data-engineering
difficulty: advanced
tags:
  - 数据仓库
  - 维度建模
  - BigQuery
  - Snowflake
status: imported
origin: old/src/content/docs/data/warehouse.zh.md
divergence: 0.16
issues: []
legacy:
  category: Data
  subcategory: Engineering
  order: 7
  lastUpdated: 2026-01-07
---

数据仓库（Data Warehouse）是企业数据分析的核心基础设施，它将来自各个业务系统的数据进行整合、清洗和建模，为企业决策提供统一、可信的数据支持。本文将深入探讨数据仓库的核心概念、设计方法和最佳实践。

## 数据仓库核心概念

### 什么是数据仓库

数据仓库是一个面向主题的、集成的、相对稳定的、反映历史变化的数据集合，用于支持管理决策。这个经典定义由数据仓库之父 Bill Inmon 提出，包含四个关键特性：

- **面向主题（Subject-Oriented）**：围绕业务主题（如客户、产品、销售）组织数据，而非按应用系统划分
- **集成性（Integrated）**：整合来自多个异构数据源的数据，统一数据标准和格式
- **非易失性（Non-Volatile）**：数据一旦进入仓库，一般不会被修改或删除
- **时变性（Time-Variant）**：保留历史数据，支持时间维度的分析

### OLTP vs OLAP

```
┌─────────────────────────────────────────────────────────────────┐
│                    OLTP vs OLAP 对比                            │
├─────────────────────┬───────────────────┬───────────────────────┤
│       特性          │       OLTP        │         OLAP          │
├─────────────────────┼───────────────────┼───────────────────────┤
│     主要用途        │    事务处理       │      分析决策         │
│     数据范围        │    当前数据       │      历史数据         │
│     查询模式        │    简单查询       │      复杂聚合         │
│     响应时间        │    毫秒级         │      秒到分钟         │
│     数据更新        │    频繁更新       │      批量加载         │
│     数据规范化      │    高度规范化     │      反规范化         │
│     典型系统        │  MySQL, PostgreSQL│  BigQuery, Snowflake  │
└─────────────────────┴───────────────────┴───────────────────────┘
```

### 数据仓库架构演进

```
传统架构:
┌─────────┐    ┌─────────┐    ┌─────────┐
│  数据源  │───▶│   ETL   │───▶│  数仓   │───▶ 报表/BI
└─────────┘    └─────────┘    └─────────┘

现代架构 (ELT):
┌─────────┐    ┌─────────┐    ┌─────────┐
│  数据源  │───▶│   EL    │───▶│ 云数仓  │───▶ 转换 ───▶ 分析
└─────────┘    └─────────┘    └─────────┘
                                  ▲
                                  │ dbt 等工具
                                  │ 在仓库内转换
```

## 维度建模

### 维度建模基础

维度建模是 Ralph Kimball 提出的数据仓库设计方法论，其核心思想是将数据组织为事实表（Fact Table）和维度表（Dimension Table）的形式。

```sql
-- 维度建模的核心：围绕业务过程构建
-- 业务过程 = 事实表
-- 业务上下文 = 维度表

-- 示例：电商销售分析
-- 事实表：记录每笔订单的度量值
-- 维度表：描述订单的各个维度（时间、客户、产品、地区）
```

### 星型模型（Star Schema）

星型模型是最常用的维度建模方式，事实表位于中心，维度表呈放射状分布：

```sql
-- 事实表：订单事实表
CREATE TABLE fact_orders (
    order_id BIGINT PRIMARY KEY,
    -- 维度外键
    date_key INT REFERENCES dim_date(date_key),
    customer_key INT REFERENCES dim_customer(customer_key),
    product_key INT REFERENCES dim_product(product_key),
    store_key INT REFERENCES dim_store(store_key),
    -- 度量值
    quantity INT,
    unit_price DECIMAL(10, 2),
    discount_amount DECIMAL(10, 2),
    total_amount DECIMAL(10, 2),
    cost_amount DECIMAL(10, 2),
    -- 元数据
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 维度表：时间维度
CREATE TABLE dim_date (
    date_key INT PRIMARY KEY,      -- 代理键：20240115
    full_date DATE NOT NULL,
    year INT,
    quarter INT,
    month INT,
    month_name VARCHAR(20),
    week_of_year INT,
    day_of_month INT,
    day_of_week INT,
    day_name VARCHAR(20),
    is_weekend BOOLEAN,
    is_holiday BOOLEAN,
    fiscal_year INT,
    fiscal_quarter INT
);

-- 维度表：客户维度
CREATE TABLE dim_customer (
    customer_key INT PRIMARY KEY,  -- 代理键
    customer_id VARCHAR(50),       -- 业务键
    customer_name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    gender VARCHAR(10),
    birth_date DATE,
    age_group VARCHAR(20),
    customer_segment VARCHAR(50),
    registration_date DATE,
    -- SCD 相关字段
    effective_date DATE,
    expiration_date DATE,
    is_current BOOLEAN
);

-- 维度表：产品维度
CREATE TABLE dim_product (
    product_key INT PRIMARY KEY,
    product_id VARCHAR(50),
    product_name VARCHAR(200),
    category_l1 VARCHAR(100),      -- 一级分类
    category_l2 VARCHAR(100),      -- 二级分类
    category_l3 VARCHAR(100),      -- 三级分类
    brand VARCHAR(100),
    supplier VARCHAR(100),
    unit_cost DECIMAL(10, 2),
    is_active BOOLEAN
);
```

星型模型的优势：
- 查询性能好：连接简单，优化器易于优化
- 易于理解：业务人员容易理解数据结构
- 适合 BI 工具：大多数 BI 工具原生支持

### 雪花模型（Snowflake Schema）

雪花模型是星型模型的扩展，将维度表进一步规范化：

```sql
-- 雪花模型示例：产品维度规范化

-- 产品维度主表
CREATE TABLE dim_product (
    product_key INT PRIMARY KEY,
    product_id VARCHAR(50),
    product_name VARCHAR(200),
    category_key INT REFERENCES dim_category(category_key),
    brand_key INT REFERENCES dim_brand(brand_key),
    unit_cost DECIMAL(10, 2)
);

-- 分类维度表
CREATE TABLE dim_category (
    category_key INT PRIMARY KEY,
    category_l3_name VARCHAR(100),
    category_l2_key INT REFERENCES dim_category_l2(category_l2_key)
);

CREATE TABLE dim_category_l2 (
    category_l2_key INT PRIMARY KEY,
    category_l2_name VARCHAR(100),
    category_l1_key INT REFERENCES dim_category_l1(category_l1_key)
);

CREATE TABLE dim_category_l1 (
    category_l1_key INT PRIMARY KEY,
    category_l1_name VARCHAR(100)
);

-- 品牌维度表
CREATE TABLE dim_brand (
    brand_key INT PRIMARY KEY,
    brand_name VARCHAR(100),
    brand_country VARCHAR(50),
    manufacturer VARCHAR(100)
);
```

星型 vs 雪花模型选择：

| 考虑因素 | 星型模型 | 雪花模型 |
|---------|---------|---------|
| 查询性能 | 更好（连接少） | 较差（连接多） |
| 存储空间 | 较大（冗余） | 较小（规范化） |
| 维护复杂度 | 较低 | 较高 |
| 适用场景 | 大多数 OLAP | 维度层次深、需要灵活分析 |

## 事实表与维度表设计

### 事实表设计原则

事实表按照粒度可分为三类：

```sql
-- 1. 事务事实表（Transaction Fact）
-- 记录业务过程中的每个事务，粒度最细
CREATE TABLE fact_order_line (
    order_line_id BIGINT PRIMARY KEY,
    order_id BIGINT,
    date_key INT,
    product_key INT,
    customer_key INT,
    quantity INT,
    unit_price DECIMAL(10, 2),
    line_amount DECIMAL(10, 2)
);

-- 2. 周期快照事实表（Periodic Snapshot）
-- 按固定时间间隔记录状态快照
CREATE TABLE fact_inventory_daily (
    snapshot_date_key INT,
    product_key INT,
    warehouse_key INT,
    quantity_on_hand INT,
    quantity_reserved INT,
    quantity_available INT,
    inventory_value DECIMAL(12, 2),
    PRIMARY KEY (snapshot_date_key, product_key, warehouse_key)
);

-- 3. 累积快照事实表（Accumulating Snapshot）
-- 跟踪业务流程的多个里程碑
CREATE TABLE fact_order_fulfillment (
    order_id BIGINT PRIMARY KEY,
    customer_key INT,
    -- 里程碑日期键
    order_date_key INT,
    payment_date_key INT,
    ship_date_key INT,
    delivery_date_key INT,
    -- 里程碑间隔（天）
    order_to_payment_days INT,
    payment_to_ship_days INT,
    ship_to_delivery_days INT,
    total_fulfillment_days INT,
    -- 度量
    order_amount DECIMAL(10, 2),
    shipping_cost DECIMAL(10, 2)
);
```

### 事实表度量分类

```sql
-- 度量的可加性分类

-- 1. 可加型度量（Additive）
-- 可以在所有维度上求和
SELECT
    SUM(quantity) as total_quantity,      -- 可加
    SUM(total_amount) as total_revenue    -- 可加
FROM fact_orders;

-- 2. 半可加型度量（Semi-Additive）
-- 只能在部分维度上求和（如余额不能跨时间求和）
SELECT
    date_key,
    SUM(balance) as total_balance  -- 不能跨时间求和
FROM fact_account_balance
WHERE date_key = 20240115
GROUP BY date_key;

-- 3. 不可加型度量（Non-Additive）
-- 不能直接求和，需要转换
SELECT
    -- 比率不能直接求和
    SUM(total_amount) / SUM(quantity) as avg_unit_price,
    -- 百分比需要重新计算
    SUM(profit) / NULLIF(SUM(revenue), 0) * 100 as profit_margin
FROM fact_orders;
```

### 维度表设计最佳实践

```sql
-- 维度表设计要点

-- 1. 使用代理键而非业务键作为主键
CREATE TABLE dim_customer (
    customer_key INT PRIMARY KEY AUTO_INCREMENT,  -- 代理键
    customer_id VARCHAR(50) UNIQUE,               -- 业务键
    -- 其他属性...
);

-- 2. 扁平化维度层次
CREATE TABLE dim_product (
    product_key INT PRIMARY KEY,
    -- 将层次结构扁平化存储
    category_l1_id INT,
    category_l1_name VARCHAR(100),
    category_l2_id INT,
    category_l2_name VARCHAR(100),
    category_l3_id INT,
    category_l3_name VARCHAR(100),
    -- 便于快速过滤和分组
    product_name VARCHAR(200)
);

-- 3. 杂项维度（Junk Dimension）
-- 将低基数标志位合并为单一维度
CREATE TABLE dim_order_flags (
    order_flag_key INT PRIMARY KEY,
    is_gift BOOLEAN,
    is_rush BOOLEAN,
    is_fragile BOOLEAN,
    payment_method VARCHAR(20),
    shipping_method VARCHAR(20)
);

-- 4. 角色扮演维度（Role-Playing Dimension）
-- 同一维度表在事实表中多次使用
CREATE TABLE fact_flights (
    flight_id BIGINT PRIMARY KEY,
    departure_date_key INT REFERENCES dim_date(date_key),
    arrival_date_key INT REFERENCES dim_date(date_key),
    departure_airport_key INT REFERENCES dim_airport(airport_key),
    arrival_airport_key INT REFERENCES dim_airport(airport_key),
    passengers INT,
    revenue DECIMAL(12, 2)
);
```

## 缓慢变化维（SCD）

缓慢变化维（Slowly Changing Dimension）是处理维度属性历史变化的技术。

### SCD Type 1 - 覆盖更新

```sql
-- Type 1: 直接覆盖，不保留历史
-- 适用于：错误修正、不需要历史的属性

-- 更新前
-- customer_key | customer_id | address
-- 1           | C001        | 北京市朝阳区

-- 客户搬家后，直接更新
UPDATE dim_customer
SET address = '上海市浦东新区',
    updated_at = CURRENT_TIMESTAMP
WHERE customer_id = 'C001';

-- 更新后
-- customer_key | customer_id | address
-- 1           | C001        | 上海市浦东新区
```

### SCD Type 2 - 新增行

```sql
-- Type 2: 新增记录，完整保留历史
-- 适用于：需要追溯历史的关键属性

CREATE TABLE dim_customer_scd2 (
    customer_key INT PRIMARY KEY AUTO_INCREMENT,
    customer_id VARCHAR(50),        -- 业务键
    customer_name VARCHAR(100),
    address VARCHAR(200),
    customer_segment VARCHAR(50),
    -- SCD 2 控制字段
    effective_date DATE NOT NULL,
    expiration_date DATE,
    is_current BOOLEAN DEFAULT TRUE,
    -- 版本号（可选）
    version INT DEFAULT 1
);

-- 处理 SCD Type 2 变化的存储过程
DELIMITER //
CREATE PROCEDURE update_customer_scd2(
    IN p_customer_id VARCHAR(50),
    IN p_customer_name VARCHAR(100),
    IN p_address VARCHAR(200),
    IN p_customer_segment VARCHAR(50)
)
BEGIN
    DECLARE v_current_key INT;
    DECLARE v_current_version INT;

    -- 查找当前记录
    SELECT customer_key, version INTO v_current_key, v_current_version
    FROM dim_customer_scd2
    WHERE customer_id = p_customer_id AND is_current = TRUE;

    IF v_current_key IS NOT NULL THEN
        -- 关闭当前记录
        UPDATE dim_customer_scd2
        SET expiration_date = DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY),
            is_current = FALSE
        WHERE customer_key = v_current_key;

        -- 插入新记录
        INSERT INTO dim_customer_scd2 (
            customer_id, customer_name, address, customer_segment,
            effective_date, expiration_date, is_current, version
        ) VALUES (
            p_customer_id, p_customer_name, p_address, p_customer_segment,
            CURRENT_DATE, '9999-12-31', TRUE, v_current_version + 1
        );
    ELSE
        -- 新客户，直接插入
        INSERT INTO dim_customer_scd2 (
            customer_id, customer_name, address, customer_segment,
            effective_date, expiration_date, is_current, version
        ) VALUES (
            p_customer_id, p_customer_name, p_address, p_customer_segment,
            CURRENT_DATE, '9999-12-31', TRUE, 1
        );
    END IF;
END //
DELIMITER ;

-- 查询当前状态
SELECT * FROM dim_customer_scd2 WHERE is_current = TRUE;

-- 查询历史状态（某个时间点）
SELECT * FROM dim_customer_scd2
WHERE customer_id = 'C001'
  AND '2023-06-15' BETWEEN effective_date AND expiration_date;
```

### SCD Type 3 - 新增列

```sql
-- Type 3: 新增列保留有限历史
-- 适用于：只需保留前一个版本

CREATE TABLE dim_customer_scd3 (
    customer_key INT PRIMARY KEY,
    customer_id VARCHAR(50),
    -- 当前值
    current_address VARCHAR(200),
    current_segment VARCHAR(50),
    -- 历史值（前一个版本）
    previous_address VARCHAR(200),
    previous_segment VARCHAR(50),
    -- 变更日期
    address_change_date DATE,
    segment_change_date DATE
);

-- 更新 SCD Type 3
UPDATE dim_customer_scd3
SET previous_address = current_address,
    current_address = '上海市浦东新区',
    address_change_date = CURRENT_DATE
WHERE customer_id = 'C001';
```

### 混合 SCD 策略

```sql
-- 实际项目中常用混合策略
CREATE TABLE dim_customer_hybrid (
    customer_key INT PRIMARY KEY AUTO_INCREMENT,
    customer_id VARCHAR(50),
    -- Type 1 属性（直接覆盖）
    email VARCHAR(100),
    phone VARCHAR(20),
    -- Type 2 属性（保留历史）
    customer_segment VARCHAR(50),
    credit_limit DECIMAL(10, 2),
    -- Type 3 属性（保留前值）
    current_address VARCHAR(200),
    previous_address VARCHAR(200),
    -- SCD 2 控制
    effective_date DATE,
    expiration_date DATE,
    is_current BOOLEAN
);
```

## 现代数据仓库架构

### Lambda 架构

```
                    ┌─────────────────────────────────────────────┐
                    │              Lambda Architecture            │
                    └─────────────────────────────────────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    │                                       │
              ┌─────▼─────┐                           ┌─────▼─────┐
              │ Batch Layer│                           │Speed Layer│
              │  (离线层)  │                           │ (实时层)  │
              └─────┬─────┘                           └─────┬─────┘
                    │                                       │
          ┌─────────▼─────────┐                   ┌─────────▼─────────┐
          │  Spark/Hive/Flink │                   │  Kafka/Flink      │
          │  批量处理历史数据  │                   │  实时处理增量数据  │
          └─────────┬─────────┘                   └─────────┬─────────┘
                    │                                       │
                    └───────────────────┬───────────────────┘
                                        │
                              ┌─────────▼─────────┐
                              │   Serving Layer   │
                              │    (服务层)       │
                              │  合并批量+实时结果 │
                              └───────────────────┘
```

### Lakehouse 架构

```python
# Delta Lake 示例 - Lakehouse 架构实现
from delta import DeltaTable
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("Lakehouse Demo") \
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
    .getOrCreate()

# 创建 Delta 表（支持 ACID 事务）
df = spark.read.parquet("s3://data-lake/raw/orders/")
df.write.format("delta").mode("overwrite").save("s3://data-lake/silver/orders/")

# 增量更新（MERGE INTO）
delta_table = DeltaTable.forPath(spark, "s3://data-lake/silver/orders/")
new_orders = spark.read.parquet("s3://data-lake/staging/orders_incremental/")

delta_table.alias("target").merge(
    new_orders.alias("source"),
    "target.order_id = source.order_id"
).whenMatchedUpdateAll() \
 .whenNotMatchedInsertAll() \
 .execute()

# 时间旅行查询
df_history = spark.read.format("delta") \
    .option("versionAsOf", 5) \
    .load("s3://data-lake/silver/orders/")

# 或按时间戳
df_history = spark.read.format("delta") \
    .option("timestampAsOf", "2024-01-01 00:00:00") \
    .load("s3://data-lake/silver/orders/")
```

### 现代数据栈（Modern Data Stack）

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Modern Data Stack                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   数据源           数据集成         数据仓库        转换        分析  │
│  ┌──────┐        ┌────────┐      ┌────────┐    ┌─────┐    ┌─────┐  │
│  │ SaaS │───────▶│Fivetran│─────▶│Snowflake│───▶│ dbt │───▶│Looker│ │
│  │ Apps │        │Airbyte │      │BigQuery │    │     │    │Metaba│ │
│  └──────┘        └────────┘      │Redshift │    └─────┘    │ se   │ │
│                                  └────────┘               └─────┘  │
│  ┌──────┐                                                          │
│  │ 数据库 │        数据编排              数据质量                    │
│  │ MySQL │      ┌────────┐            ┌────────┐                   │
│  │ Postgres│     │Airflow │            │Great   │                   │
│  └──────┘      │Dagster │            │Expecta │                   │
│                 └────────┘            │tions   │                   │
│                                       └────────┘                   │
└─────────────────────────────────────────────────────────────────────┘
```

## 云数据仓库：BigQuery 与 Snowflake

### Google BigQuery

```sql
-- BigQuery 特性演示

-- 1. 分区表（按日期分区）
CREATE TABLE `project.dataset.fact_orders`
(
    order_id INT64,
    customer_id STRING,
    order_date DATE,
    amount NUMERIC
)
PARTITION BY order_date
CLUSTER BY customer_id
OPTIONS(
    partition_expiration_days = 365,
    description = "订单事实表"
);

-- 2. 聚类（Clustering）优化查询
-- 按 customer_id 聚类后，过滤查询更快
SELECT customer_id, SUM(amount) as total
FROM `project.dataset.fact_orders`
WHERE order_date BETWEEN '2024-01-01' AND '2024-01-31'
  AND customer_id = 'C12345'
GROUP BY customer_id;

-- 3. 嵌套和重复字段（Nested & Repeated）
CREATE TABLE `project.dataset.orders_nested`
(
    order_id INT64,
    customer STRUCT<
        id STRING,
        name STRING,
        email STRING
    >,
    items ARRAY<STRUCT<
        product_id STRING,
        quantity INT64,
        price NUMERIC
    >>
);

-- 查询嵌套数据
SELECT
    order_id,
    customer.name as customer_name,
    item.product_id,
    item.quantity * item.price as line_total
FROM `project.dataset.orders_nested`,
     UNNEST(items) as item
WHERE customer.id = 'C001';

-- 4. 物化视图
CREATE MATERIALIZED VIEW `project.dataset.mv_daily_sales`
PARTITION BY order_date
CLUSTER BY category
AS
SELECT
    order_date,
    p.category,
    SUM(o.amount) as daily_revenue,
    COUNT(DISTINCT o.customer_id) as unique_customers
FROM `project.dataset.fact_orders` o
JOIN `project.dataset.dim_product` p ON o.product_id = p.product_id
GROUP BY order_date, p.category;

-- 5. 使用 JavaScript UDF
CREATE FUNCTION `project.dataset.parse_user_agent`(ua STRING)
RETURNS STRUCT<browser STRING, os STRING>
LANGUAGE js AS """
    var parser = {
        browser: ua.includes('Chrome') ? 'Chrome' :
                 ua.includes('Firefox') ? 'Firefox' : 'Other',
        os: ua.includes('Windows') ? 'Windows' :
            ua.includes('Mac') ? 'MacOS' : 'Other'
    };
    return parser;
""";
```

### Snowflake

```sql
-- Snowflake 特性演示

-- 1. 创建虚拟仓库（计算资源）
CREATE WAREHOUSE analytics_wh
    WAREHOUSE_SIZE = 'MEDIUM'
    AUTO_SUSPEND = 300
    AUTO_RESUME = TRUE
    MIN_CLUSTER_COUNT = 1
    MAX_CLUSTER_COUNT = 3
    SCALING_POLICY = 'STANDARD';

-- 2. 零拷贝克隆
CREATE DATABASE dev_db CLONE prod_db;
CREATE TABLE orders_backup CLONE orders;

-- 3. Time Travel（时间旅行）
-- 查询历史数据
SELECT * FROM orders AT(TIMESTAMP => '2024-01-01 10:00:00'::TIMESTAMP);
SELECT * FROM orders AT(OFFSET => -60*60);  -- 1小时前
SELECT * FROM orders BEFORE(STATEMENT => 'query_id_here');

-- 恢复误删数据
CREATE TABLE orders_restored CLONE orders
    AT(TIMESTAMP => '2024-01-10 08:00:00'::TIMESTAMP);

-- 4. Streams 和 Tasks（变更数据捕获）
-- 创建 Stream 捕获变更
CREATE STREAM orders_stream ON TABLE raw_orders;

-- 创建 Task 自动处理变更
CREATE TASK process_orders_task
    WAREHOUSE = analytics_wh
    SCHEDULE = '1 MINUTE'
    WHEN SYSTEM$STREAM_HAS_DATA('orders_stream')
AS
MERGE INTO dim_orders t
USING (
    SELECT * FROM orders_stream
    WHERE METADATA$ACTION = 'INSERT'
) s
ON t.order_id = s.order_id
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *;

ALTER TASK process_orders_task RESUME;

-- 5. 数据共享
CREATE SHARE sales_share;
GRANT USAGE ON DATABASE analytics_db TO SHARE sales_share;
GRANT SELECT ON TABLE analytics_db.public.fact_sales TO SHARE sales_share;

-- 添加消费者账户
ALTER SHARE sales_share ADD ACCOUNTS = 'partner_account';

-- 6. Snowpipe（持续数据加载）
CREATE PIPE orders_pipe
    AUTO_INGEST = TRUE
AS
COPY INTO raw_orders
FROM @orders_stage
FILE_FORMAT = (TYPE = 'JSON');
```

## 数据分层架构

### 标准四层架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                        数据仓库分层架构                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  ADS (Application Data Service) - 应用数据层                 │   │
│  │  面向具体应用的数据集，如报表、接口、推荐系统输入              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ▲                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  DWS (Data Warehouse Service) - 数据服务层                   │   │
│  │  轻度汇总层，按主题组织的宽表，如用户画像宽表、商品宽表        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ▲                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  DWD (Data Warehouse Detail) - 明细数据层                    │   │
│  │  清洗后的明细数据，保持最细粒度，是数仓的核心层               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ▲                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  ODS (Operational Data Store) - 操作数据层                   │   │
│  │  源系统数据的原始副本，保持原貌，仅做简单清洗                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ▲                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  数据源：MySQL, PostgreSQL, MongoDB, Kafka, API, Files       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 各层建模示例

```sql
-- ODS 层：保持源系统原貌
CREATE TABLE ods_order_info (
    id BIGINT,
    order_no VARCHAR(50),
    user_id BIGINT,
    shop_id BIGINT,
    order_status TINYINT,
    pay_type TINYINT,
    total_amount DECIMAL(10, 2),
    pay_amount DECIMAL(10, 2),
    create_time DATETIME,
    pay_time DATETIME,
    -- 元数据
    dt STRING COMMENT '分区日期',
    etl_time TIMESTAMP COMMENT 'ETL时间'
)
PARTITIONED BY (dt)
STORED AS PARQUET;

-- DWD 层：清洗、标准化、维度退化
CREATE TABLE dwd_order_detail (
    order_id BIGINT COMMENT '订单ID',
    order_no STRING COMMENT '订单编号',
    user_id BIGINT COMMENT '用户ID',
    user_name STRING COMMENT '用户名（维度退化）',
    shop_id BIGINT COMMENT '店铺ID',
    shop_name STRING COMMENT '店铺名（维度退化）',
    order_status STRING COMMENT '订单状态（代码转描述）',
    pay_type STRING COMMENT '支付方式',
    total_amount DECIMAL(10, 2) COMMENT '订单总金额',
    discount_amount DECIMAL(10, 2) COMMENT '优惠金额',
    pay_amount DECIMAL(10, 2) COMMENT '实付金额',
    create_date DATE COMMENT '创建日期',
    create_time TIMESTAMP COMMENT '创建时间',
    pay_date DATE COMMENT '支付日期',
    pay_time TIMESTAMP COMMENT '支付时间'
)
PARTITIONED BY (dt)
STORED AS PARQUET;

-- DWS 层：轻度汇总宽表
CREATE TABLE dws_user_order_1d (
    user_id BIGINT COMMENT '用户ID',
    user_name STRING COMMENT '用户名',
    order_count BIGINT COMMENT '订单数',
    order_amount DECIMAL(12, 2) COMMENT '订单金额',
    pay_count BIGINT COMMENT '支付订单数',
    pay_amount DECIMAL(12, 2) COMMENT '支付金额',
    avg_order_amount DECIMAL(10, 2) COMMENT '平均订单金额',
    first_order_time TIMESTAMP COMMENT '首单时间',
    last_order_time TIMESTAMP COMMENT '末单时间'
)
PARTITIONED BY (dt)
STORED AS PARQUET;

-- ADS 层：面向应用的数据集
CREATE TABLE ads_user_retention (
    cohort_date DATE COMMENT '注册日期',
    day_n INT COMMENT '第N天',
    cohort_users BIGINT COMMENT '注册用户数',
    retained_users BIGINT COMMENT '留存用户数',
    retention_rate DECIMAL(5, 2) COMMENT '留存率'
)
STORED AS PARQUET;

-- 用户 RFM 分析表
CREATE TABLE ads_user_rfm (
    user_id BIGINT,
    recency_days INT COMMENT '最近购买距今天数',
    frequency INT COMMENT '购买频次',
    monetary DECIMAL(12, 2) COMMENT '消费金额',
    r_score INT COMMENT 'R评分',
    f_score INT COMMENT 'F评分',
    m_score INT COMMENT 'M评分',
    rfm_segment STRING COMMENT 'RFM分群',
    stat_date DATE COMMENT '统计日期'
)
STORED AS PARQUET;
```

### dbt 实现数据分层

```yaml
# dbt_project.yml
name: 'ecommerce_dw'
version: '1.0.0'

model-paths: ["models"]

models:
  ecommerce_dw:
    staging:  # ODS 层
      +materialized: view
      +schema: staging
    intermediate:  # DWD 层
      +materialized: table
      +schema: dwd
    marts:  # DWS/ADS 层
      +materialized: table
      +schema: analytics
```

```sql
-- models/staging/stg_orders.sql (ODS -> Staging)
{{ config(materialized='view') }}

SELECT
    id as order_id,
    order_no,
    user_id,
    shop_id,
    CASE order_status
        WHEN 1 THEN '待支付'
        WHEN 2 THEN '已支付'
        WHEN 3 THEN '已发货'
        WHEN 4 THEN '已完成'
        WHEN 5 THEN '已取消'
    END as order_status,
    total_amount,
    pay_amount,
    create_time,
    pay_time
FROM {{ source('raw', 'orders') }}
WHERE create_time >= '{{ var("start_date") }}'

-- models/intermediate/int_order_detail.sql (DWD)
{{ config(
    materialized='incremental',
    unique_key='order_id',
    partition_by={'field': 'order_date', 'data_type': 'date'}
) }}

SELECT
    o.order_id,
    o.order_no,
    o.user_id,
    u.user_name,
    o.shop_id,
    s.shop_name,
    o.order_status,
    o.total_amount,
    o.pay_amount,
    DATE(o.create_time) as order_date,
    o.create_time,
    o.pay_time
FROM {{ ref('stg_orders') }} o
LEFT JOIN {{ ref('stg_users') }} u ON o.user_id = u.user_id
LEFT JOIN {{ ref('stg_shops') }} s ON o.shop_id = s.shop_id

{% if is_incremental() %}
WHERE o.create_time > (SELECT MAX(create_time) FROM {{ this }})
{% endif %}

-- models/marts/mart_daily_sales.sql (DWS)
{{ config(
    materialized='table',
    partition_by={'field': 'order_date', 'data_type': 'date'}
) }}

SELECT
    order_date,
    shop_id,
    shop_name,
    COUNT(DISTINCT order_id) as order_count,
    COUNT(DISTINCT user_id) as customer_count,
    SUM(pay_amount) as total_revenue,
    AVG(pay_amount) as avg_order_value
FROM {{ ref('int_order_detail') }}
WHERE order_status IN ('已支付', '已发货', '已完成')
GROUP BY order_date, shop_id, shop_name
```

## 性能优化

### 分区策略

```sql
-- BigQuery 分区示例
CREATE TABLE `project.dataset.fact_events`
(
    event_id STRING,
    user_id STRING,
    event_type STRING,
    event_timestamp TIMESTAMP,
    properties JSON
)
PARTITION BY DATE(event_timestamp)
OPTIONS(
    partition_expiration_days = 90,
    require_partition_filter = TRUE  -- 强制分区过滤
);

-- 按整数范围分区
CREATE TABLE `project.dataset.fact_transactions`
PARTITION BY RANGE_BUCKET(customer_id, GENERATE_ARRAY(0, 1000000, 10000))
AS
SELECT * FROM raw_transactions;

-- Snowflake 自动聚类
CREATE TABLE fact_orders (
    order_id INT,
    order_date DATE,
    customer_id INT,
    amount DECIMAL(10, 2)
)
CLUSTER BY (order_date, customer_id);

-- 查看聚类深度
SELECT SYSTEM$CLUSTERING_DEPTH('fact_orders');
SELECT SYSTEM$CLUSTERING_INFORMATION('fact_orders');
```

### 查询优化技巧

```sql
-- 1. 避免 SELECT *
-- Bad
SELECT * FROM fact_orders WHERE order_date = '2024-01-15';
-- Good
SELECT order_id, customer_id, amount
FROM fact_orders
WHERE order_date = '2024-01-15';

-- 2. 利用分区裁剪
-- Bad：分区列使用函数
SELECT * FROM fact_orders WHERE YEAR(order_date) = 2024;
-- Good：直接比较
SELECT * FROM fact_orders
WHERE order_date >= '2024-01-01' AND order_date < '2025-01-01';

-- 3. 使用近似聚合函数（大数据量场景）
-- 精确计数（慢）
SELECT COUNT(DISTINCT user_id) FROM fact_events;
-- 近似计数（快，误差 <1%）
SELECT APPROX_COUNT_DISTINCT(user_id) FROM fact_events;

-- 4. 物化中间结果
CREATE TABLE temp_active_users AS
SELECT DISTINCT user_id
FROM fact_events
WHERE event_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY);

SELECT u.*, t.active
FROM dim_user u
LEFT JOIN temp_active_users t ON u.user_id = t.user_id;

-- 5. 使用 WITH 子句优化复杂查询
WITH daily_sales AS (
    SELECT
        order_date,
        SUM(amount) as revenue
    FROM fact_orders
    GROUP BY order_date
),
monthly_avg AS (
    SELECT AVG(revenue) as avg_daily_revenue
    FROM daily_sales
)
SELECT
    d.order_date,
    d.revenue,
    m.avg_daily_revenue,
    d.revenue / m.avg_daily_revenue as revenue_index
FROM daily_sales d
CROSS JOIN monthly_avg m;

-- 6. BigQuery 查询优化：使用嵌套结构避免 JOIN
-- 反规范化存储
CREATE TABLE orders_denormalized AS
SELECT
    o.order_id,
    o.order_date,
    STRUCT(
        c.customer_id,
        c.customer_name,
        c.segment
    ) as customer,
    ARRAY_AGG(STRUCT(
        i.product_id,
        i.quantity,
        i.price
    )) as items
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN order_items i ON o.order_id = i.order_id
GROUP BY o.order_id, o.order_date, c.customer_id, c.customer_name, c.segment;
```

### 索引与统计信息

```sql
-- Snowflake Search Optimization（搜索优化）
ALTER TABLE dim_customer ADD SEARCH OPTIMIZATION ON EQUALITY(customer_id);
ALTER TABLE fact_orders ADD SEARCH OPTIMIZATION ON EQUALITY(order_id, customer_id);

-- 查看搜索优化状态
SHOW TABLES LIKE 'dim_customer';
DESCRIBE SEARCH OPTIMIZATION ON dim_customer;

-- BigQuery BI Engine（加速 BI 查询）
-- 在 BigQuery 控制台启用 BI Engine 并分配内存

-- PostgreSQL/Redshift 统计信息
ANALYZE fact_orders;
ANALYZE dim_customer;

-- 查看表统计信息
SELECT
    schemaname,
    relname,
    n_live_tup,
    n_dead_tup,
    last_vacuum,
    last_analyze
FROM pg_stat_user_tables
WHERE relname = 'fact_orders';
```

## 数据治理

### 数据质量管理

```python
# 使用 Great Expectations 进行数据质量检查
import great_expectations as gx

# 创建数据上下文
context = gx.get_context()

# 定义期望套件
suite = context.add_expectation_suite("order_quality_suite")

# 添加期望
validator = context.get_validator(
    batch_request=batch_request,
    expectation_suite_name="order_quality_suite"
)

# 数据完整性检查
validator.expect_column_values_to_not_be_null("order_id")
validator.expect_column_values_to_not_be_null("customer_id")
validator.expect_column_values_to_not_be_null("order_date")

# 数据有效性检查
validator.expect_column_values_to_be_between(
    "amount", min_value=0, max_value=1000000
)
validator.expect_column_values_to_match_regex(
    "email", r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
)

# 数据一致性检查
validator.expect_column_pair_values_A_to_be_greater_than_B(
    "pay_amount", "discount_amount"
)

# 数据唯一性检查
validator.expect_column_values_to_be_unique("order_id")
validator.expect_compound_columns_to_be_unique(["order_id", "product_id"])

# 保存并运行检查点
checkpoint = context.add_or_update_checkpoint(
    name="order_checkpoint",
    validator=validator
)
checkpoint_result = checkpoint.run()
```

```sql
-- dbt 数据测试
-- models/schema.yml
version: 2

models:
  - name: fact_orders
    description: "订单事实表"
    columns:
      - name: order_id
        description: "订单ID"
        tests:
          - unique
          - not_null
      - name: customer_id
        tests:
          - not_null
          - relationships:
              to: ref('dim_customer')
              field: customer_id
      - name: order_amount
        tests:
          - not_null
          - dbt_utils.accepted_range:
              min_value: 0
              max_value: 1000000

  - name: dim_customer
    tests:
      - dbt_utils.unique_combination_of_columns:
          combination_of_columns:
            - customer_id
            - effective_date
```

### 元数据管理

```sql
-- 使用系统表查询元数据

-- BigQuery 元数据查询
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM `project.dataset.INFORMATION_SCHEMA.COLUMNS`
WHERE table_name = 'fact_orders';

-- 查看表级元数据
SELECT
    table_name,
    creation_time,
    last_modified_time,
    row_count,
    size_bytes / (1024*1024*1024) as size_gb
FROM `project.dataset.INFORMATION_SCHEMA.TABLES`;

-- Snowflake 元数据
SELECT *
FROM SNOWFLAKE.ACCOUNT_USAGE.TABLES
WHERE TABLE_NAME = 'FACT_ORDERS';

-- 查看列血缘
SELECT *
FROM SNOWFLAKE.ACCOUNT_USAGE.ACCESS_HISTORY
WHERE QUERY_ID = 'your_query_id';
```

### 数据安全

```sql
-- 行级安全（Row-Level Security）

-- BigQuery 行级安全
CREATE ROW ACCESS POLICY region_filter
ON `project.dataset.fact_sales`
GRANT TO ('user:analyst@company.com')
FILTER USING (region = 'APAC');

-- Snowflake 动态数据掩码
CREATE MASKING POLICY email_mask AS (val STRING)
RETURNS STRING ->
    CASE
        WHEN CURRENT_ROLE() IN ('ADMIN', 'DATA_ENGINEER') THEN val
        ELSE REGEXP_REPLACE(val, '.+@', '***@')
    END;

ALTER TABLE dim_customer MODIFY COLUMN email
SET MASKING POLICY email_mask;

-- 列级安全
CREATE TAG pii_tag;
ALTER TABLE dim_customer MODIFY COLUMN ssn SET TAG pii_tag = 'sensitive';

-- 基于标签的访问控制
CREATE ROW ACCESS POLICY pii_policy
ON dim_customer
AS (ssn STRING) RETURNS BOOLEAN ->
    CURRENT_ROLE() IN ('ADMIN') OR ssn IS NULL;
```

## 面试要点

### 高频面试题

**Q1：星型模型和雪花模型的区别？何时使用？**

```
星型模型：
- 维度表不进一步规范化
- 查询性能更好（连接少）
- 存储冗余但简单易理解
- 适用：大多数 BI 场景

雪花模型：
- 维度表规范化为多表
- 节省存储空间
- 维护复杂度高
- 适用：维度层次深、需要灵活分析
```

**Q2：SCD Type 2 如何实现？**

```sql
-- 关键字段：
-- effective_date: 生效日期
-- expiration_date: 失效日期
-- is_current: 是否当前有效

-- 变更处理流程：
-- 1. 将当前记录的 is_current 设为 FALSE
-- 2. 更新 expiration_date 为变更日期前一天
-- 3. 插入新记录，is_current = TRUE
```

**Q3：事实表有哪些类型？各自适用场景？**

```
1. 事务事实表：记录每笔事务，最细粒度
   - 示例：订单明细、交易流水

2. 周期快照事实表：定期记录状态
   - 示例：每日库存、每月账户余额

3. 累积快照事实表：跟踪流程多个里程碑
   - 示例：订单履约流程（下单->支付->发货->签收）
```

**Q4：数据仓库分层的意义？**

```
ODS：保持源数据原貌，便于数据溯源
DWD：统一清洗，是数仓的核心层
DWS：按主题轻度汇总，提高查询效率
ADS：面向应用，满足特定分析需求

分层好处：
- 清晰的数据流转
- 复用性高
- 便于维护和问题排查
- 性能分层优化
```

**Q5：如何优化慢查询？**

```sql
-- 1. 检查执行计划
EXPLAIN ANALYZE SELECT ...;

-- 2. 优化策略：
-- - 使用分区裁剪
-- - 避免 SELECT *
-- - 使用适当的 JOIN 策略
-- - 添加聚类/索引
-- - 物化中间结果
-- - 使用近似函数处理大数据量
```

### 实战设计题

**题目：设计电商订单分析数仓**

```sql
-- 核心事实表
CREATE TABLE fact_order_detail (
    order_detail_id BIGINT,
    order_id BIGINT,
    -- 维度外键
    date_key INT,
    customer_key INT,
    product_key INT,
    seller_key INT,
    promotion_key INT,
    -- 退化维度
    order_no STRING,
    -- 度量
    quantity INT,
    unit_price DECIMAL(10,2),
    discount_amount DECIMAL(10,2),
    pay_amount DECIMAL(10,2),
    cost_amount DECIMAL(10,2)
);

-- 核心分析指标
-- GMV、订单量、客单价、复购率、转化率

-- 典型分析 SQL
-- 按日期和品类的销售趋势
SELECT
    d.full_date,
    p.category_l1,
    SUM(f.pay_amount) as gmv,
    COUNT(DISTINCT f.order_id) as order_count,
    COUNT(DISTINCT f.customer_key) as buyer_count
FROM fact_order_detail f
JOIN dim_date d ON f.date_key = d.date_key
JOIN dim_product p ON f.product_key = p.product_key
WHERE d.full_date BETWEEN '2024-01-01' AND '2024-01-31'
GROUP BY d.full_date, p.category_l1
ORDER BY d.full_date, gmv DESC;
```

## 总结

数据仓库是企业数据分析的基石。本文涵盖了从基础概念到实践应用的完整知识体系：

1. **核心概念**：理解数据仓库的四大特性和 OLAP 特点
2. **维度建模**：掌握星型/雪花模型的设计方法
3. **事实与维度**：深入理解不同类型的事实表和维度设计技巧
4. **SCD 处理**：熟练运用各种缓慢变化维处理策略
5. **现代架构**：了解 Lakehouse、Lambda 等现代数据架构
6. **云数据仓库**：掌握 BigQuery 和 Snowflake 的核心特性
7. **数据分层**：构建清晰的 ODS-DWD-DWS-ADS 分层架构
8. **性能优化**：运用分区、聚类等技术提升查询性能
9. **数据治理**：建立完善的数据质量和安全管控体系

掌握这些知识，你将能够设计和构建企业级的数据仓库系统，为业务决策提供强有力的数据支持。
