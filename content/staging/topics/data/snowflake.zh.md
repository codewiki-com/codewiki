---
title: Snowflake 云数据仓库完全指南
description: 深入了解 Snowflake 云原生数据仓库的架构和使用
track: data
section: analytics-engines
difficulty: intermediate
tags:
  - Snowflake
  - 数据仓库
  - 云计算
  - SQL
status: imported
origin: old/src/content/docs/data/snowflake.zh.md
divergence: 0.306
issues: []
legacy:
  category: Data
  subcategory: Data Warehouse
  order: 15
  lastUpdated: 2026-01-07
---

Snowflake 是一款革命性的云原生数据仓库解决方案，以其独特的多集群共享数据架构、完全的存储计算分离以及近乎零运维的特性，在现代数据技术栈中占据核心地位。本文将全面深入地探讨 Snowflake 的核心概念、架构设计、关键功能和最佳实践。

## Snowflake 概述

### 什么是 Snowflake

Snowflake 是一个完全托管的云数据平台，不仅提供传统的数据仓库功能，还支持数据湖、数据工程、数据科学、数据共享和数据应用等多种场景。其核心特点包括：

- **云原生设计**：从零开始为云环境构建，原生支持 AWS、Azure 和 GCP
- **存储计算完全分离**：存储和计算资源独立扩展，互不影响
- **零管理运维**：无需管理基础设施、索引、分区或数据分布
- **弹性按需付费**：按实际使用的计算和存储资源计费
- **多云多区域支持**：支持跨云平台部署和跨区域数据复制与共享

### Snowflake 与传统数据仓库对比

```
+---------------------+----------------------+---------------------------+
|        特性         |     传统数据仓库      |         Snowflake         |
+---------------------+----------------------+---------------------------+
|      部署方式       |    本地或私有云      |       完全云托管           |
|      扩展方式       |    垂直扩展为主      |       弹性水平扩展          |
|      存储计算       |      紧耦合          |       完全分离             |
|      并发处理       |     资源争用         |      多集群自动扩展         |
|      维护成本       |   高（需DBA团队）     |       几乎为零             |
|      数据共享       |    复杂（需ETL）      |      零拷贝即时共享         |
|      定价模式       |    固定许可证        |       按使用量付费          |
|      版本升级       |    停机维护          |       自动无缝升级          |
+---------------------+----------------------+---------------------------+
```

### Snowflake 版本与功能

Snowflake 提供多个版本，功能逐级递增：

| 版本 | 主要功能 |
|------|----------|
| Standard | 基础功能、1天时间旅行、标准安全 |
| Enterprise | 90天时间旅行、多集群仓库、物化视图、数据掩码 |
| Business Critical | HIPAA/PCI合规、AWS PrivateLink、数据库故障转移 |
| Virtual Private Snowflake | 专用环境、完全隔离、客户托管密钥 |

## Snowflake 架构深度解析

### 三层架构设计

Snowflake 采用独特的三层架构，实现了存储、计算和服务的完全分离：

```
+-----------------------------------------------------------------------+
|                      Cloud Services Layer                              |
|                         (云服务层)                                      |
|   +----------+ +----------+ +----------+ +----------+ +----------+    |
|   | 认证授权  | | 查询优化  | | 元数据   | | 事务管理  | | 安全管理  |    |
|   +----------+ +----------+ +----------+ +----------+ +----------+    |
+-----------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------+
|                    Query Processing Layer                              |
|                      (查询处理层)                                       |
|   +----------------+  +----------------+  +----------------+           |
|   | Virtual        |  | Virtual        |  | Virtual        |    ...   |
|   | Warehouse      |  | Warehouse      |  | Warehouse      |           |
|   | (分析团队)      |  | (ETL作业)      |  | (BI报表)       |           |
|   +----------------+  +----------------+  +----------------+           |
+-----------------------------------------------------------------------+
                                  |
                                  v
+-----------------------------------------------------------------------+
|                    Database Storage Layer                              |
|                      (数据存储层)                                       |
|   +---------------------------------------------------------------+   |
|   |            云对象存储 (S3 / Azure Blob / GCS)                   |   |
|   |   +-------+ +-------+ +-------+ +-------+ +-------+ +-------+ |   |
|   |   |微分区 | |微分区 | |微分区 | |微分区 | |微分区 | |微分区 | |   |
|   |   +-------+ +-------+ +-------+ +-------+ +-------+ +-------+ |   |
|   +---------------------------------------------------------------+   |
+-----------------------------------------------------------------------+
```

### 云服务层（Cloud Services Layer）

云服务层是 Snowflake 的"大脑"，负责协调整个系统的运行，主要功能包括：

**认证与访问控制**
```sql
-- 创建用户
CREATE USER analyst_user
    PASSWORD = 'SecurePassword123!'
    DEFAULT_ROLE = analyst_role
    DEFAULT_WAREHOUSE = analytics_wh
    DEFAULT_NAMESPACE = analytics_db.public
    MUST_CHANGE_PASSWORD = TRUE;

-- 多因素认证
ALTER USER analyst_user SET
    MINS_TO_BYPASS_MFA = 0;
```

**元数据管理**
```sql
-- 查看数据库中的所有表
SHOW TABLES IN DATABASE my_database;

-- 查看表结构
DESCRIBE TABLE my_database.my_schema.orders;

-- 查看表的详细元数据
SELECT * FROM my_database.information_schema.tables
WHERE table_name = 'ORDERS';
```

**查询优化与编译**
```sql
-- Snowflake 自动优化查询，无需手动创建索引
-- 使用 EXPLAIN 查看执行计划
EXPLAIN USING TABULAR
SELECT
    c.customer_segment,
    p.category,
    DATE_TRUNC('month', o.order_date) AS month,
    COUNT(DISTINCT o.order_id) AS order_count,
    SUM(o.amount) AS total_revenue
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN products p ON o.product_id = p.product_id
WHERE o.order_date >= '2024-01-01'
GROUP BY 1, 2, 3
ORDER BY 1, 2, 3;
```

### 查询处理层（Virtual Warehouses）

虚拟仓库是 Snowflake 的计算引擎，是一组独立的计算资源，与存储完全解耦：

```sql
-- 创建虚拟仓库
CREATE WAREHOUSE analytics_wh
    WAREHOUSE_SIZE = 'MEDIUM'           -- XS, S, M, L, XL, 2XL, 3XL, 4XL, 5XL, 6XL
    AUTO_SUSPEND = 300                   -- 5分钟无活动自动暂停（秒）
    AUTO_RESUME = TRUE                   -- 有查询时自动恢复
    MIN_CLUSTER_COUNT = 1               -- 多集群模式最小集群数
    MAX_CLUSTER_COUNT = 3               -- 多集群模式最大集群数
    SCALING_POLICY = 'STANDARD'         -- STANDARD 或 ECONOMY
    INITIALLY_SUSPENDED = TRUE          -- 创建时处于暂停状态
    COMMENT = '分析团队专用计算仓库';

-- 即时调整仓库大小（不中断运行中的查询）
ALTER WAREHOUSE analytics_wh SET WAREHOUSE_SIZE = 'LARGE';

-- 手动控制仓库状态
ALTER WAREHOUSE analytics_wh SUSPEND;
ALTER WAREHOUSE analytics_wh RESUME;

-- 查看所有仓库状态
SHOW WAREHOUSES;

-- 查看仓库详细信息
DESCRIBE WAREHOUSE analytics_wh;
```

**仓库大小与计算资源对应关系**

| 仓库大小 | Credits/小时 | 相对计算能力 |
|----------|-------------|-------------|
| X-Small  | 1           | 1x          |
| Small    | 2           | 2x          |
| Medium   | 4           | 4x          |
| Large    | 8           | 8x          |
| X-Large  | 16          | 16x         |
| 2X-Large | 32          | 32x         |
| 3X-Large | 64          | 64x         |
| 4X-Large | 128         | 128x        |

### 存储层（Micro-partitions）

Snowflake 使用微分区（Micro-partitions）来组织数据，这是其性能优化的核心：

```sql
-- 微分区特性
-- 1. 每个微分区包含 50MB 到 500MB 的压缩数据
-- 2. 数据按列存储，自动压缩（通常 4:1 压缩比）
-- 3. Snowflake 自动管理分区，无需手动干预
-- 4. 每个微分区存储列的 MIN/MAX 值用于分区裁剪

-- 查看表的聚类信息
SELECT SYSTEM$CLUSTERING_INFORMATION('orders', '(order_date, customer_id)');

-- 输出示例：
-- {
--   "cluster_by_keys": "LINEAR(order_date, customer_id)",
--   "total_partition_count": 1000,
--   "total_constant_partition_count": 50,
--   "average_overlaps": 2.5,
--   "average_depth": 3.2,
--   "partition_depth_histogram": {...}
-- }

-- 查看聚类深度（越小越好）
SELECT SYSTEM$CLUSTERING_DEPTH('orders');
```

## 虚拟仓库深入解析

### 仓库工作原理

虚拟仓库启动时，Snowflake 会从云存储中拉取数据到本地 SSD 缓存：

```
查询执行流程：

1. 客户端提交查询
          |
          v
2. 云服务层解析、优化查询
          |
          v
3. 分配给虚拟仓库执行
          |
          v
4. 仓库节点检查本地 SSD 缓存
          |
    +-----+-----+
    |           |
    v           v
缓存命中     缓存未命中
直接读取    从云存储拉取
    |           |
    +-----+-----+
          |
          v
5. 执行查询，返回结果
```

### 多集群仓库（Multi-Cluster Warehouse）

多集群仓库是 Enterprise 版本的重要功能，用于处理高并发场景：

```sql
-- 创建多集群仓库
CREATE WAREHOUSE high_concurrency_wh
    WAREHOUSE_SIZE = 'MEDIUM'
    MIN_CLUSTER_COUNT = 1           -- 最小1个集群
    MAX_CLUSTER_COUNT = 10          -- 最多扩展到10个集群
    SCALING_POLICY = 'STANDARD'     -- 或 'ECONOMY'
    AUTO_SUSPEND = 300
    AUTO_RESUME = TRUE;

-- 扩展策略说明：
-- STANDARD: 当有查询排队时立即启动新集群，优先保证性能
-- ECONOMY: 只在查询排队超过6分钟后才启动新集群，优先节省成本

-- 监控多集群使用情况
SELECT
    warehouse_name,
    cluster_number,
    start_time,
    end_time,
    credits_used
FROM snowflake.account_usage.warehouse_metering_history
WHERE warehouse_name = 'HIGH_CONCURRENCY_WH'
    AND start_time >= DATEADD('day', -7, CURRENT_DATE())
ORDER BY start_time DESC;
```

### 仓库使用策略

为不同工作负载创建独立仓库，实现资源隔离：

```sql
-- ETL 专用仓库：大规模数据处理
CREATE WAREHOUSE etl_wh
    WAREHOUSE_SIZE = 'XLARGE'
    AUTO_SUSPEND = 60               -- 1分钟无活动暂停
    AUTO_RESUME = TRUE
    STATEMENT_TIMEOUT_IN_SECONDS = 3600  -- 查询超时1小时
    COMMENT = 'ETL 数据加载和转换专用';

-- BI 报表仓库：支持多用户并发查询
CREATE WAREHOUSE bi_wh
    WAREHOUSE_SIZE = 'SMALL'
    MIN_CLUSTER_COUNT = 1
    MAX_CLUSTER_COUNT = 5
    SCALING_POLICY = 'STANDARD'
    AUTO_SUSPEND = 300
    AUTO_RESUME = TRUE
    STATEMENT_QUEUED_TIMEOUT_IN_SECONDS = 300  -- 排队超时5分钟
    COMMENT = 'BI 报表和仪表盘查询';

-- 数据科学仓库：探索性分析
CREATE WAREHOUSE ds_wh
    WAREHOUSE_SIZE = 'LARGE'
    AUTO_SUSPEND = 600              -- 10分钟无活动暂停
    AUTO_RESUME = TRUE
    COMMENT = '数据科学和机器学习任务';

-- 使用特定仓库执行查询
USE WAREHOUSE bi_wh;
SELECT * FROM sales_summary;

-- 或在查询中指定
SELECT /*+ WAREHOUSE(etl_wh) */ * FROM large_table;
```

### 资源监控器

使用资源监控器控制计算成本：

```sql
-- 创建账户级资源监控器
CREATE RESOURCE MONITOR account_monthly_monitor
    WITH
        CREDIT_QUOTA = 5000              -- 每月5000 credits
        FREQUENCY = MONTHLY
        START_TIMESTAMP = IMMEDIATELY
        TRIGGERS
            ON 50 PERCENT DO NOTIFY      -- 50%时发送通知
            ON 75 PERCENT DO NOTIFY      -- 75%时发送通知
            ON 90 PERCENT DO NOTIFY      -- 90%时发送通知
            ON 100 PERCENT DO SUSPEND    -- 100%时暂停仓库
            ON 110 PERCENT DO SUSPEND_IMMEDIATE;  -- 110%立即暂停

-- 将监控器应用到特定仓库
CREATE RESOURCE MONITOR etl_monitor
    WITH
        CREDIT_QUOTA = 1000
        FREQUENCY = WEEKLY
        START_TIMESTAMP = IMMEDIATELY
        TRIGGERS
            ON 90 PERCENT DO NOTIFY
            ON 100 PERCENT DO SUSPEND;

ALTER WAREHOUSE etl_wh SET RESOURCE_MONITOR = etl_monitor;

-- 查看资源监控器状态
SHOW RESOURCE MONITORS;

-- 查看 credit 使用详情
SELECT
    warehouse_name,
    DATE_TRUNC('day', start_time) AS usage_date,
    SUM(credits_used) AS total_credits,
    SUM(credits_used_compute) AS compute_credits,
    SUM(credits_used_cloud_services) AS cloud_services_credits
FROM snowflake.account_usage.warehouse_metering_history
WHERE start_time >= DATE_TRUNC('month', CURRENT_DATE())
GROUP BY 1, 2
ORDER BY 1, 2;
```

## 时间旅行（Time Travel）

### 时间旅行概述

时间旅行是 Snowflake 的标志性功能，允许访问过去任意时间点的历史数据状态：

```sql
-- 时间旅行保留期配置
-- Standard 版本：最多 1 天
-- Enterprise 及以上版本：最多 90 天

-- 在创建表时设置数据保留期
CREATE TABLE orders (
    order_id NUMBER(38, 0),
    customer_id NUMBER(38, 0),
    order_amount DECIMAL(12, 2),
    order_date DATE,
    status VARCHAR(20),
    created_at TIMESTAMP_LTZ DEFAULT CURRENT_TIMESTAMP()
)
DATA_RETENTION_TIME_IN_DAYS = 30;

-- 修改现有表的保留期
ALTER TABLE orders SET DATA_RETENTION_TIME_IN_DAYS = 90;

-- 查看表的数据保留配置
SHOW TABLES LIKE 'orders';
-- 查看 retention_time 列

-- 也可以在 Schema 或 Database 级别设置默认值
ALTER SCHEMA my_schema SET DATA_RETENTION_TIME_IN_DAYS = 14;
ALTER DATABASE my_database SET DATA_RETENTION_TIME_IN_DAYS = 7;
```

### 查询历史数据

Snowflake 提供三种方式访问历史数据：

```sql
-- 方式1：使用时间戳（TIMESTAMP）
SELECT * FROM orders
AT(TIMESTAMP => '2024-01-15 10:30:00'::TIMESTAMP_LTZ);

-- 方式2：使用时间偏移（OFFSET，单位秒）
SELECT * FROM orders
AT(OFFSET => -3600);  -- 1小时前的数据

SELECT * FROM orders
AT(OFFSET => -86400);  -- 24小时前的数据

-- 方式3：使用查询ID（STATEMENT）
-- 返回指定查询执行之前的数据状态
SELECT * FROM orders
BEFORE(STATEMENT => '01b3c5d7-0000-1234-0000-00000000abcd');

-- 比较不同时间点的数据
WITH current_data AS (
    SELECT
        customer_id,
        COUNT(*) AS current_orders,
        SUM(order_amount) AS current_revenue
    FROM orders
    GROUP BY customer_id
),
historical_data AS (
    SELECT
        customer_id,
        COUNT(*) AS historical_orders,
        SUM(order_amount) AS historical_revenue
    FROM orders AT(OFFSET => -86400)  -- 24小时前
    GROUP BY customer_id
)
SELECT
    COALESCE(c.customer_id, h.customer_id) AS customer_id,
    h.historical_orders,
    c.current_orders,
    c.current_orders - COALESCE(h.historical_orders, 0) AS orders_change,
    h.historical_revenue,
    c.current_revenue,
    c.current_revenue - COALESCE(h.historical_revenue, 0) AS revenue_change
FROM current_data c
FULL OUTER JOIN historical_data h ON c.customer_id = h.customer_id
WHERE c.current_orders != h.historical_orders
   OR c.current_orders IS NULL
   OR h.historical_orders IS NULL
ORDER BY ABS(c.current_revenue - COALESCE(h.historical_revenue, 0)) DESC;
```

### 数据恢复

时间旅行最重要的应用场景是数据恢复：

```sql
-- 场景1：误删除数据恢复
-- 假设误执行了 DELETE 操作
DELETE FROM orders WHERE order_date < '2024-01-01';  -- 误操作!

-- 立即恢复：使用时间旅行创建恢复表
CREATE TABLE orders_restored AS
SELECT * FROM orders
AT(OFFSET => -60);  -- 1分钟前

-- 验证恢复的数据
SELECT COUNT(*) FROM orders_restored;
SELECT COUNT(*) FROM orders;

-- 方法1：替换原表
ALTER TABLE orders SWAP WITH orders_restored;

-- 方法2：使用 INSERT 恢复删除的数据
INSERT INTO orders
SELECT * FROM orders AT(OFFSET => -60)
WHERE order_date < '2024-01-01';

-- 场景2：误删除表恢复
DROP TABLE important_table;  -- 误操作!

-- 使用 UNDROP 恢复表
UNDROP TABLE important_table;

-- 如果表名已被重用，先重命名新表
ALTER TABLE important_table RENAME TO important_table_new;
UNDROP TABLE important_table;

-- 场景3：误删除 Schema 恢复
DROP SCHEMA production_schema;  -- 误操作!
UNDROP SCHEMA production_schema;

-- 场景4：误删除数据库恢复
DROP DATABASE production_db;  -- 误操作!
UNDROP DATABASE production_db;

-- 场景5：恢复特定时间点的整个表
CREATE TABLE orders_q4_2023 CLONE orders
AT(TIMESTAMP => '2023-12-31 23:59:59'::TIMESTAMP_LTZ);
```

### 时间旅行存储成本

时间旅行数据会产生额外存储成本：

```sql
-- 查看时间旅行存储使用情况
SELECT
    table_catalog AS database_name,
    table_schema AS schema_name,
    table_name,
    active_bytes / POWER(1024, 3) AS active_gb,
    time_travel_bytes / POWER(1024, 3) AS time_travel_gb,
    failsafe_bytes / POWER(1024, 3) AS failsafe_gb,
    (active_bytes + time_travel_bytes + failsafe_bytes) / POWER(1024, 3) AS total_gb
FROM snowflake.account_usage.table_storage_metrics
WHERE deleted IS NULL
ORDER BY time_travel_bytes DESC
LIMIT 20;

-- 注意：Fail-safe 是时间旅行结束后 Snowflake 保留的额外7天保护期
-- Fail-safe 期间的数据只能由 Snowflake 支持团队恢复
```

## 零拷贝克隆（Zero-Copy Cloning）

### 克隆基础

零拷贝克隆是 Snowflake 的核心功能之一，可以在几秒内创建数据的完整副本而不实际复制数据：

```sql
-- 克隆表（即时完成，无论表多大）
CREATE TABLE orders_dev CLONE orders;

-- 克隆 Schema（包含所有表、视图、函数等）
CREATE SCHEMA dev_schema CLONE prod_schema;

-- 克隆数据库（包含所有 Schema 及其内容）
CREATE DATABASE dev_db CLONE prod_db;

-- 克隆特定时间点的数据（结合时间旅行）
CREATE TABLE orders_snapshot CLONE orders
AT(TIMESTAMP => '2024-01-01 00:00:00'::TIMESTAMP_LTZ);

CREATE DATABASE q4_backup CLONE production
AT(TIMESTAMP => '2023-12-31 23:59:59'::TIMESTAMP_LTZ);

-- 验证克隆成功
SELECT COUNT(*) FROM orders;
SELECT COUNT(*) FROM orders_dev;
-- 两者应该相等

-- 克隆后的表是独立对象，修改不影响原表
UPDATE orders_dev SET status = 'TEST' WHERE order_id = 1;
-- 原表 orders 不受影响
```

### 克隆的工作原理

零拷贝克隆使用写时复制（Copy-on-Write）策略：

```
初始状态（克隆刚完成）：

原始表 (orders)              克隆表 (orders_dev)
+------------------+         +------------------+
| 指针 -> 分区 A   |         | 指针 -> 分区 A   |
| 指针 -> 分区 B   |         | 指针 -> 分区 B   |
| 指针 -> 分区 C   |         | 指针 -> 分区 C   |
+------------------+         +------------------+
          |                           |
          +-----------+---------------+
                      |
                      v
              共享存储层
        +------------------------+
        | 分区A | 分区B | 分区C  |
        +------------------------+

修改克隆表后（写时复制）：

原始表 (orders)              克隆表 (orders_dev)
+------------------+         +------------------+
| 指针 -> 分区 A   |         | 指针 -> 分区 A'  | <- 新创建的分区
| 指针 -> 分区 B   |         | 指针 -> 分区 B   |
| 指针 -> 分区 C   |         | 指针 -> 分区 C   |
+------------------+         +------------------+
          |                           |
          v                           v
   +-------------+            +-------------+
   | 分区B |分区C|            | 分区A'|分区B|分区C|
   +-------------+            +-------------+
        共享                      部分独立
```

### 克隆使用场景

```sql
-- 场景1：开发测试环境快速搭建
-- 为每个开发者创建独立的数据副本
CREATE DATABASE dev_alice CLONE production;
CREATE DATABASE dev_bob CLONE production;
GRANT ALL ON DATABASE dev_alice TO ROLE developer_alice;
GRANT ALL ON DATABASE dev_bob TO ROLE developer_bob;

-- 场景2：数据变更前的安全备份
-- 在执行大规模数据迁移前创建备份
CREATE TABLE orders_backup_20240115 CLONE orders;

-- 执行风险操作
UPDATE orders SET status = 'MIGRATED' WHERE legacy_flag = TRUE;

-- 如果出问题，可以快速回滚
ALTER TABLE orders SWAP WITH orders_backup_20240115;
DROP TABLE orders_backup_20240115;

-- 场景3：数据沙箱环境
-- 为数据科学家创建可自由修改的实验环境
CREATE DATABASE ds_sandbox CLONE production;
GRANT ALL ON DATABASE ds_sandbox TO ROLE data_scientist;

-- 数据科学家可以自由修改而不影响生产数据
USE DATABASE ds_sandbox;
ALTER TABLE customers ADD COLUMN predicted_churn_score FLOAT;

-- 场景4：时间点数据快照（报表、合规）
-- 创建季度末数据快照用于审计
CREATE DATABASE q4_2023_snapshot CLONE production
AT(TIMESTAMP => '2023-12-31 23:59:59'::TIMESTAMP_LTZ);

-- 场景5：A/B 测试数据准备
CREATE SCHEMA ab_test_control CLONE production.public;
CREATE SCHEMA ab_test_treatment CLONE production.public;

-- 在 treatment 组应用新的数据处理逻辑
UPDATE ab_test_treatment.customers
SET segment = calculate_new_segment(customer_id);

-- 场景6：零停机表结构变更
-- 克隆 -> 修改结构 -> 填充数据 -> 交换
CREATE TABLE orders_new CLONE orders;
ALTER TABLE orders_new ADD COLUMN region VARCHAR(50);
UPDATE orders_new SET region = lookup_region(customer_id);
ALTER TABLE orders SWAP WITH orders_new;
DROP TABLE orders_new;
```

### 克隆的存储成本

```sql
-- 克隆不会立即产生存储成本
-- 只有当修改导致创建新分区时才产生成本

-- 查看克隆表的存储情况
SELECT
    table_name,
    active_bytes / POWER(1024, 3) AS active_gb,
    retained_for_clone_bytes / POWER(1024, 3) AS clone_retained_gb
FROM snowflake.account_usage.table_storage_metrics
WHERE table_name IN ('ORDERS', 'ORDERS_DEV')
ORDER BY table_name;

-- 删除克隆后，共享分区可能变为独占
-- 如果原表仍需要这些分区，存储成本会转移到原表
```

## 数据共享（Data Sharing）

### 数据共享概述

Snowflake 的数据共享功能实现了真正的零拷贝数据共享，数据消费者直接访问提供者的实时数据：

```
数据共享架构：

数据提供者账户                         数据消费者账户
+--------------------+                 +--------------------+
| 生产数据库          |                 | 共享数据库（只读）  |
| +----------------+ |    Snowflake    | +----------------+ |
| | fact_sales     | | =============>  | | fact_sales     | |
| | dim_product    | |    数据共享      | | dim_product    | |
| +----------------+ |    （零拷贝）     | +----------------+ |
+--------------------+                 +--------------------+
         |                                       |
         v                                       v
+--------------------------------------------------+
|              共享存储层（无数据复制）               |
+--------------------------------------------------+
```

### 创建和管理共享

```sql
-- ========== 数据提供者端 ==========

-- 步骤1：创建共享
CREATE SHARE sales_data_share
    COMMENT = '销售数据共享给合作伙伴';

-- 步骤2：向共享添加数据库和 Schema 权限
GRANT USAGE ON DATABASE analytics_db TO SHARE sales_data_share;
GRANT USAGE ON SCHEMA analytics_db.public TO SHARE sales_data_share;

-- 步骤3：向共享添加表权限
GRANT SELECT ON TABLE analytics_db.public.fact_sales TO SHARE sales_data_share;
GRANT SELECT ON TABLE analytics_db.public.dim_product TO SHARE sales_data_share;
GRANT SELECT ON TABLE analytics_db.public.dim_date TO SHARE sales_data_share;

-- 步骤4：添加消费者账户
-- 使用账户定位器（Account Locator）
ALTER SHARE sales_data_share ADD ACCOUNTS = xy12345, ab67890;

-- 使用组织和账户名
ALTER SHARE sales_data_share ADD ACCOUNTS = org_name.account_name;

-- 查看共享详情
SHOW SHARES;
DESCRIBE SHARE sales_data_share;

-- 查看共享中的对象
SHOW GRANTS TO SHARE sales_data_share;
```

### 使用安全视图控制共享数据

```sql
-- 创建安全视图隐藏敏感数据
CREATE SECURE VIEW analytics_db.public.v_sales_summary AS
SELECT
    DATE_TRUNC('month', sale_date) AS month,
    product_category,
    region,
    SUM(quantity) AS total_quantity,
    SUM(revenue) AS total_revenue,
    COUNT(DISTINCT customer_id) AS unique_customers
    -- 注意：不包含客户详细信息
FROM analytics_db.raw.fact_sales
GROUP BY 1, 2, 3;

-- 只共享安全视图而非底层表
GRANT SELECT ON VIEW analytics_db.public.v_sales_summary
TO SHARE sales_data_share;

-- 创建带行级过滤的安全视图
CREATE SECURE VIEW analytics_db.public.v_regional_sales AS
SELECT *
FROM analytics_db.raw.fact_sales
WHERE region IN (
    SELECT allowed_region
    FROM analytics_db.security.consumer_access
    WHERE consumer_account = CURRENT_ACCOUNT()
);
```

### 消费共享数据

```sql
-- ========== 数据消费者端 ==========

-- 查看可用的共享
SHOW SHARES;

-- 从共享创建数据库
CREATE DATABASE shared_sales_data FROM SHARE provider_org.provider_account.sales_data_share;

-- 或者使用账户定位器
CREATE DATABASE partner_data FROM SHARE xy12345.sales_data_share;

-- 共享数据库是只读的，直接查询
SELECT * FROM shared_sales_data.public.fact_sales LIMIT 100;

-- 将共享数据与本地数据结合分析
SELECT
    s.month,
    s.product_category,
    s.total_revenue AS partner_revenue,
    l.total_revenue AS our_revenue,
    s.total_revenue / NULLIF(l.total_revenue, 0) AS partner_share
FROM shared_sales_data.public.v_sales_summary s
JOIN local_analytics.public.sales_summary l
    ON s.month = l.month
    AND s.product_category = l.product_category;

-- 消费者可以创建本地视图简化访问
CREATE VIEW local_analytics.public.partner_sales AS
SELECT * FROM shared_sales_data.public.v_sales_summary;
```

### Snowflake Marketplace

Snowflake Marketplace 是数据共享功能的商业化扩展：

```sql
-- 订阅市场数据产品后（通过 Web UI 完成订阅）
-- 数据会自动出现在账户中

-- 访问天气数据
SELECT * FROM weather_data.public.daily_forecasts
WHERE city = 'Shanghai'
    AND forecast_date >= CURRENT_DATE();

-- 访问人口统计数据
SELECT * FROM demographics_data.public.population_by_region
WHERE country = 'China';

-- 将市场数据与内部数据结合
SELECT
    s.store_id,
    s.sale_date,
    s.revenue,
    w.temperature,
    w.precipitation,
    w.weather_condition
FROM internal_db.sales.daily_sales s
JOIN weather_data.public.daily_weather w
    ON s.store_city = w.city
    AND s.sale_date = w.date
WHERE s.sale_date >= DATEADD('month', -1, CURRENT_DATE());
```

## 数据加载与管道

### 文件格式定义

```sql
-- CSV 格式
CREATE FILE FORMAT csv_format
    TYPE = 'CSV'
    FIELD_DELIMITER = ','
    RECORD_DELIMITER = '\n'
    SKIP_HEADER = 1
    FIELD_OPTIONALLY_ENCLOSED_BY = '"'
    NULL_IF = ('NULL', 'null', '', '\\N')
    EMPTY_FIELD_AS_NULL = TRUE
    TRIM_SPACE = TRUE
    ERROR_ON_COLUMN_COUNT_MISMATCH = FALSE
    ENCODING = 'UTF8'
    COMPRESSION = 'AUTO';

-- JSON 格式
CREATE FILE FORMAT json_format
    TYPE = 'JSON'
    STRIP_OUTER_ARRAY = TRUE
    STRIP_NULL_VALUES = FALSE
    IGNORE_UTF8_ERRORS = FALSE
    ENABLE_OCTAL = FALSE
    ALLOW_DUPLICATE = FALSE
    DATE_FORMAT = 'AUTO'
    TIMESTAMP_FORMAT = 'AUTO';

-- Parquet 格式
CREATE FILE FORMAT parquet_format
    TYPE = 'PARQUET'
    COMPRESSION = 'SNAPPY';

-- Avro 格式
CREATE FILE FORMAT avro_format
    TYPE = 'AVRO'
    COMPRESSION = 'AUTO';

-- ORC 格式
CREATE FILE FORMAT orc_format
    TYPE = 'ORC'
    TRIM_SPACE = FALSE;
```

### Stage 配置

```sql
-- 内部 Stage（Snowflake 托管存储）
CREATE STAGE internal_stage
    FILE_FORMAT = csv_format
    COMMENT = '内部数据暂存区';

-- 外部 Stage - AWS S3
CREATE STORAGE INTEGRATION s3_integration
    TYPE = EXTERNAL_STAGE
    STORAGE_PROVIDER = 'S3'
    STORAGE_AWS_ROLE_ARN = 'arn:aws:iam::123456789012:role/snowflake_role'
    ENABLED = TRUE
    STORAGE_ALLOWED_LOCATIONS = ('s3://my-bucket/data/', 's3://my-bucket/archive/');

CREATE STAGE s3_stage
    URL = 's3://my-bucket/data/'
    STORAGE_INTEGRATION = s3_integration
    FILE_FORMAT = csv_format;

-- 外部 Stage - Azure Blob
CREATE STORAGE INTEGRATION azure_integration
    TYPE = EXTERNAL_STAGE
    STORAGE_PROVIDER = 'AZURE'
    AZURE_TENANT_ID = 'your-tenant-id'
    ENABLED = TRUE
    STORAGE_ALLOWED_LOCATIONS = ('azure://account.blob.core.windows.net/container/');

CREATE STAGE azure_stage
    URL = 'azure://account.blob.core.windows.net/container/data/'
    STORAGE_INTEGRATION = azure_integration
    FILE_FORMAT = json_format;

-- 外部 Stage - GCS
CREATE STORAGE INTEGRATION gcs_integration
    TYPE = EXTERNAL_STAGE
    STORAGE_PROVIDER = 'GCS'
    ENABLED = TRUE
    STORAGE_ALLOWED_LOCATIONS = ('gcs://my-bucket/');

CREATE STAGE gcs_stage
    URL = 'gcs://my-bucket/data/'
    STORAGE_INTEGRATION = gcs_integration
    FILE_FORMAT = parquet_format;

-- 列出 Stage 中的文件
LIST @s3_stage;
LIST @s3_stage PATTERN = '.*orders_2024.*\\.csv';
```

### 批量数据加载（COPY INTO）

```sql
-- 从 Stage 加载数据到表
COPY INTO orders
FROM @s3_stage/orders/
PATTERN = '.*orders_202401.*\\.csv'
FILE_FORMAT = csv_format
ON_ERROR = 'CONTINUE'         -- CONTINUE, SKIP_FILE, SKIP_FILE_n, ABORT_STATEMENT
PURGE = FALSE                  -- 加载后是否删除源文件
FORCE = FALSE                  -- 是否重新加载已加载的文件
VALIDATION_MODE = 'RETURN_ERRORS';  -- 仅验证不加载

-- 使用 ON_ERROR 选项处理错误
COPY INTO orders
FROM @s3_stage/orders/
ON_ERROR = 'SKIP_FILE_10%';  -- 错误超过10%跳过文件

-- 加载 JSON 数据到 VARIANT 列
CREATE TABLE events_raw (
    raw_data VARIANT,
    load_time TIMESTAMP_LTZ DEFAULT CURRENT_TIMESTAMP()
);

COPY INTO events_raw (raw_data)
FROM @s3_stage/events/
FILE_FORMAT = json_format;

-- 加载 JSON 并展开到列
COPY INTO events_structured (
    event_id,
    event_type,
    user_id,
    event_time,
    event_data
)
FROM (
    SELECT
        $1:event_id::STRING,
        $1:event_type::STRING,
        $1:user_id::NUMBER,
        $1:timestamp::TIMESTAMP_LTZ,
        $1:data::VARIANT
    FROM @s3_stage/events/
)
FILE_FORMAT = json_format;

-- 查看加载历史
SELECT
    file_name,
    status,
    rows_parsed,
    rows_loaded,
    error_count,
    first_error_message
FROM TABLE(information_schema.copy_history(
    table_name => 'orders',
    start_time => DATEADD('hour', -24, CURRENT_TIMESTAMP())
))
ORDER BY last_load_time DESC;
```

### Snowpipe 持续加载

Snowpipe 实现自动化的持续数据加载：

```sql
-- 创建 Snowpipe
CREATE PIPE orders_pipe
    AUTO_INGEST = TRUE          -- 启用自动摄取
    AWS_SNS_TOPIC = 'arn:aws:sns:us-east-1:123456789012:snowpipe-notifications'
    COMMENT = '订单数据自动加载管道'
AS
COPY INTO orders
FROM @s3_stage/orders/
FILE_FORMAT = csv_format
ON_ERROR = 'SKIP_FILE';

-- 查看 Pipe 状态
SHOW PIPES;
DESCRIBE PIPE orders_pipe;

-- 查看 Pipe 的 SQS 队列 ARN（用于配置 S3 事件通知）
SELECT SYSTEM$PIPE_STATUS('orders_pipe');

-- 手动触发 Pipe 加载（用于测试或重新加载）
ALTER PIPE orders_pipe REFRESH;

-- 指定前缀刷新
ALTER PIPE orders_pipe REFRESH PREFIX = 'orders/2024/01/';

-- 暂停和恢复 Pipe
ALTER PIPE orders_pipe SET PIPE_EXECUTION_PAUSED = TRUE;
ALTER PIPE orders_pipe SET PIPE_EXECUTION_PAUSED = FALSE;

-- 监控 Pipe 加载历史
SELECT
    pipe_name,
    file_name,
    pipe_received_time,
    stage_location,
    status,
    row_count,
    error_count
FROM TABLE(information_schema.pipe_usage_history(
    date_range_start => DATEADD('day', -7, CURRENT_DATE()),
    pipe_name => 'orders_pipe'
))
ORDER BY pipe_received_time DESC;

-- 查看 Snowpipe 的 credit 消耗
SELECT
    pipe_name,
    DATE_TRUNC('day', start_time) AS date,
    SUM(credits_used) AS daily_credits
FROM snowflake.account_usage.pipe_usage_history
WHERE start_time >= DATEADD('day', -30, CURRENT_DATE())
GROUP BY 1, 2
ORDER BY 1, 2;
```

### Streams 和 Tasks（变更数据捕获）

Streams 和 Tasks 实现 Snowflake 原生的 CDC 和任务调度：

```sql
-- ========== Streams（变更数据捕获）==========

-- 创建 Stream 捕获表变更
CREATE STREAM orders_stream ON TABLE raw.orders
    APPEND_ONLY = FALSE        -- 捕获所有变更（INSERT, UPDATE, DELETE）
    SHOW_INITIAL_ROWS = FALSE; -- 不包含创建 Stream 时的现有行

-- 创建仅追加 Stream（仅捕获 INSERT）
CREATE STREAM orders_append_stream ON TABLE raw.orders
    APPEND_ONLY = TRUE;

-- 查看 Stream 中的变更
SELECT * FROM orders_stream;

-- Stream 元数据列说明：
-- METADATA$ACTION: INSERT 或 DELETE
-- METADATA$ISUPDATE: TRUE/FALSE（UPDATE = DELETE + INSERT）
-- METADATA$ROW_ID: 行唯一标识

-- 使用 Stream 识别变更类型
SELECT
    order_id,
    customer_id,
    order_amount,
    METADATA$ACTION AS action,
    METADATA$ISUPDATE AS is_update,
    CASE
        WHEN METADATA$ACTION = 'INSERT' AND METADATA$ISUPDATE = FALSE THEN 'NEW'
        WHEN METADATA$ACTION = 'INSERT' AND METADATA$ISUPDATE = TRUE THEN 'UPDATED'
        WHEN METADATA$ACTION = 'DELETE' AND METADATA$ISUPDATE = FALSE THEN 'DELETED'
    END AS change_type
FROM orders_stream;

-- ========== Tasks（任务调度）==========

-- 创建定时 Task
CREATE TASK refresh_daily_summary
    WAREHOUSE = etl_wh
    SCHEDULE = 'USING CRON 0 6 * * * UTC'  -- 每天 UTC 6:00
    COMMENT = '每日汇总表刷新'
AS
    MERGE INTO dws.daily_summary t
    USING (
        SELECT
            order_date,
            COUNT(*) AS order_count,
            SUM(order_amount) AS total_amount
        FROM dwd.orders
        WHERE order_date >= DATEADD('day', -1, CURRENT_DATE())
        GROUP BY order_date
    ) s
    ON t.order_date = s.order_date
    WHEN MATCHED THEN UPDATE SET
        order_count = s.order_count,
        total_amount = s.total_amount
    WHEN NOT MATCHED THEN INSERT
        (order_date, order_count, total_amount)
        VALUES (s.order_date, s.order_count, s.total_amount);

-- 创建基于 Stream 的 Task（有数据时才执行）
CREATE TASK process_order_changes
    WAREHOUSE = etl_wh
    SCHEDULE = '1 MINUTE'
    WHEN SYSTEM$STREAM_HAS_DATA('orders_stream')
AS
    MERGE INTO dim.orders t
    USING (
        SELECT
            order_id,
            customer_id,
            order_amount,
            status,
            updated_at,
            METADATA$ACTION AS action,
            METADATA$ISUPDATE AS is_update
        FROM orders_stream
    ) s
    ON t.order_id = s.order_id
    WHEN MATCHED AND s.action = 'DELETE' AND NOT s.is_update THEN
        DELETE
    WHEN MATCHED AND s.action = 'INSERT' AND s.is_update THEN
        UPDATE SET
            customer_id = s.customer_id,
            order_amount = s.order_amount,
            status = s.status,
            updated_at = s.updated_at
    WHEN NOT MATCHED AND s.action = 'INSERT' THEN
        INSERT (order_id, customer_id, order_amount, status, updated_at)
        VALUES (s.order_id, s.customer_id, s.order_amount, s.status, s.updated_at);

-- 创建 Task 依赖链
CREATE TASK aggregate_orders
    WAREHOUSE = etl_wh
    AFTER process_order_changes  -- 在父 Task 完成后执行
AS
    INSERT INTO dws.hourly_order_summary
    SELECT
        DATE_TRUNC('hour', CURRENT_TIMESTAMP()) AS hour,
        COUNT(*) AS orders_processed
    FROM dim.orders
    WHERE updated_at >= DATEADD('hour', -1, CURRENT_TIMESTAMP());

-- 启动 Task（需要先启动依赖链末端的 Task）
ALTER TASK aggregate_orders RESUME;
ALTER TASK process_order_changes RESUME;

-- 查看 Task 执行历史
SELECT
    name,
    state,
    scheduled_time,
    completed_time,
    error_code,
    error_message
FROM TABLE(information_schema.task_history(
    task_name => 'process_order_changes',
    scheduled_time_range_start => DATEADD('hour', -24, CURRENT_TIMESTAMP())
))
ORDER BY scheduled_time DESC;

-- 暂停 Task
ALTER TASK process_order_changes SUSPEND;
ALTER TASK aggregate_orders SUSPEND;

-- 手动执行 Task
EXECUTE TASK process_order_changes;
```

## 性能优化

### 聚类（Clustering）

聚类是大表性能优化的关键：

```sql
-- 什么时候需要聚类？
-- 1. 表大小超过 1TB
-- 2. 查询经常按特定列过滤
-- 3. 查询扫描大量分区（高分区裁剪率）

-- 定义聚类键
ALTER TABLE fact_sales CLUSTER BY (sale_date, region);

-- 查看聚类效果
SELECT SYSTEM$CLUSTERING_INFORMATION('fact_sales', '(sale_date, region)');

-- 关键指标解读：
-- average_depth: 平均深度，越小越好（理想值 1-2）
-- average_overlaps: 平均重叠，越小越好
-- partition_depth_histogram: 分区深度分布

-- 监控自动聚类状态
SELECT
    table_name,
    start_time,
    end_time,
    credits_used,
    num_partitions_reclustered
FROM snowflake.account_usage.automatic_clustering_history
WHERE table_name = 'FACT_SALES'
    AND start_time >= DATEADD('day', -7, CURRENT_DATE())
ORDER BY start_time DESC;

-- 暂停/恢复自动聚类
ALTER TABLE fact_sales SUSPEND RECLUSTER;
ALTER TABLE fact_sales RESUME RECLUSTER;

-- 手动触发重聚类（通常不需要，Snowflake 自动管理）
-- ALTER TABLE fact_sales RECLUSTER;
```

### 查询优化技巧

```sql
-- 1. 利用分区裁剪
-- 好的写法：使用聚类键进行过滤
SELECT * FROM fact_sales
WHERE sale_date >= '2024-01-01' AND sale_date < '2024-02-01'
    AND region = 'APAC';

-- 避免：在聚类键上使用函数
SELECT * FROM fact_sales
WHERE DATE_TRUNC('month', sale_date) = '2024-01-01';  -- 无法利用分区裁剪

-- 2. 只选择需要的列
-- 好的写法
SELECT order_id, customer_id, order_amount
FROM orders
WHERE order_date >= '2024-01-01';

-- 避免
SELECT * FROM orders WHERE order_date >= '2024-01-01';

-- 3. 优化 JOIN 操作
-- 将小表放在 JOIN 右侧（小表作为 build side）
SELECT f.*, d.product_name, d.category
FROM fact_sales f                    -- 大表
JOIN dim_product d                   -- 小表
    ON f.product_id = d.product_id;

-- 4. 使用 LIMIT 进行开发测试
SELECT * FROM large_table
SAMPLE (1000 ROWS);  -- 随机采样1000行

-- 5. 利用结果缓存（24小时有效）
-- 完全相同的查询会直接返回缓存结果
-- 禁用缓存（用于测试真实性能）
ALTER SESSION SET USE_CACHED_RESULT = FALSE;

-- 6. 分析查询性能
SELECT
    query_id,
    query_text,
    total_elapsed_time / 1000 AS elapsed_seconds,
    bytes_scanned / POWER(1024, 3) AS gb_scanned,
    rows_produced,
    compilation_time / 1000 AS compile_seconds,
    execution_time / 1000 AS execute_seconds,
    partitions_scanned,
    partitions_total,
    ROUND(100 * partitions_scanned / NULLIF(partitions_total, 0), 2) AS partition_scan_pct
FROM snowflake.account_usage.query_history
WHERE start_time >= DATEADD('hour', -1, CURRENT_TIMESTAMP())
    AND query_type = 'SELECT'
ORDER BY total_elapsed_time DESC
LIMIT 20;
```

### 物化视图

```sql
-- 创建物化视图预计算复杂聚合
CREATE MATERIALIZED VIEW mv_daily_sales_summary AS
SELECT
    sale_date,
    product_id,
    region,
    SUM(quantity) AS total_quantity,
    SUM(revenue) AS total_revenue,
    COUNT(*) AS transaction_count,
    AVG(unit_price) AS avg_price
FROM fact_sales
GROUP BY sale_date, product_id, region;

-- 物化视图自动维护和增量刷新
-- 查询会自动路由到物化视图

-- 原始查询
SELECT sale_date, SUM(total_revenue)
FROM fact_sales
WHERE sale_date >= '2024-01-01'
GROUP BY sale_date;

-- Snowflake 自动改写为
SELECT sale_date, SUM(total_revenue)
FROM mv_daily_sales_summary
WHERE sale_date >= '2024-01-01'
GROUP BY sale_date;

-- 监控物化视图刷新
SELECT
    table_name,
    start_time,
    end_time,
    credits_used
FROM snowflake.account_usage.materialized_view_refresh_history
WHERE table_name = 'MV_DAILY_SALES_SUMMARY'
ORDER BY start_time DESC;

-- 暂停/恢复物化视图刷新
ALTER MATERIALIZED VIEW mv_daily_sales_summary SUSPEND;
ALTER MATERIALIZED VIEW mv_daily_sales_summary RESUME;
```

### 表设计优化

```sql
-- 1. 选择合适的数据类型
CREATE TABLE optimized_orders (
    order_id NUMBER(38, 0) NOT NULL,        -- 使用 NUMBER 而非 INT
    order_date DATE NOT NULL,                -- 使用 DATE 而非 TIMESTAMP
    order_time TIME,                         -- 单独存储时间
    order_amount NUMBER(12, 2) NOT NULL,    -- 精确小数
    status VARCHAR(20) NOT NULL,             -- 限制长度
    customer_id NUMBER(38, 0) NOT NULL,
    metadata VARIANT,                        -- 半结构化数据
    tags ARRAY,                              -- 数组类型
    created_at TIMESTAMP_LTZ DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP_LTZ DEFAULT CURRENT_TIMESTAMP()
);

-- 2. 使用 TRANSIENT 表减少存储成本（无 Fail-safe）
CREATE TRANSIENT TABLE staging_orders (
    raw_data VARIANT,
    load_time TIMESTAMP_LTZ DEFAULT CURRENT_TIMESTAMP()
);

-- 3. 使用 TEMPORARY 表处理会话临时数据
CREATE TEMPORARY TABLE session_temp AS
SELECT customer_id, SUM(amount) AS total
FROM orders
GROUP BY customer_id;

-- 4. 搜索优化（Search Optimization）
-- 适用于点查询（等值查询）和子字符串搜索
ALTER TABLE customers ADD SEARCH OPTIMIZATION;

-- 指定特定列
ALTER TABLE customers ADD SEARCH OPTIMIZATION
ON EQUALITY(email, phone);

ALTER TABLE logs ADD SEARCH OPTIMIZATION
ON SUBSTRING(message);

-- 查看搜索优化状态
SHOW TABLES LIKE 'customers';
```

## 成本管理

### 成本构成分析

Snowflake 成本主要由三部分构成：

```sql
-- 1. 计算成本（Virtual Warehouse Credits）
SELECT
    warehouse_name,
    DATE_TRUNC('month', start_time) AS month,
    SUM(credits_used) AS compute_credits,
    SUM(credits_used) * 3.00 AS estimated_cost_usd  -- 假设 $3/credit
FROM snowflake.account_usage.warehouse_metering_history
WHERE start_time >= DATE_TRUNC('year', CURRENT_DATE())
GROUP BY 1, 2
ORDER BY 1, 2;

-- 2. 存储成本
SELECT
    DATE_TRUNC('month', usage_date) AS month,
    AVG(storage_bytes) / POWER(1024, 4) AS avg_storage_tb,
    AVG(stage_bytes) / POWER(1024, 4) AS avg_stage_tb,
    AVG(failsafe_bytes) / POWER(1024, 4) AS avg_failsafe_tb,
    (AVG(storage_bytes + stage_bytes + failsafe_bytes) / POWER(1024, 4)) * 23 AS estimated_cost_usd  -- 假设 $23/TB/月
FROM snowflake.account_usage.storage_usage
WHERE usage_date >= DATE_TRUNC('year', CURRENT_DATE())
GROUP BY 1
ORDER BY 1;

-- 3. 云服务成本（超过计算成本10%的部分收费）
SELECT
    DATE_TRUNC('month', start_time) AS month,
    SUM(credits_used_cloud_services) AS cloud_services_credits,
    SUM(credits_used_compute) AS compute_credits,
    CASE
        WHEN SUM(credits_used_cloud_services) > SUM(credits_used_compute) * 0.1
        THEN (SUM(credits_used_cloud_services) - SUM(credits_used_compute) * 0.1) * 3.00
        ELSE 0
    END AS billable_cloud_services_usd
FROM snowflake.account_usage.metering_history
WHERE start_time >= DATE_TRUNC('year', CURRENT_DATE())
GROUP BY 1
ORDER BY 1;
```

### 识别成本优化机会

```sql
-- 找出最消耗资源的查询
SELECT
    query_id,
    user_name,
    warehouse_name,
    warehouse_size,
    ROUND(total_elapsed_time / 1000, 2) AS elapsed_seconds,
    ROUND(bytes_scanned / POWER(1024, 3), 2) AS gb_scanned,
    ROUND(credits_used_cloud_services, 4) AS cloud_credits,
    LEFT(query_text, 100) AS query_preview
FROM snowflake.account_usage.query_history
WHERE start_time >= DATEADD('day', -7, CURRENT_DATE())
    AND execution_status = 'SUCCESS'
ORDER BY total_elapsed_time DESC
LIMIT 20;

-- 找出空闲仓库
SELECT
    warehouse_name,
    AVG(avg_running) AS avg_running_queries,
    AVG(avg_queued_load) AS avg_queued,
    SUM(credits_used) AS total_credits
FROM snowflake.account_usage.warehouse_load_history
WHERE start_time >= DATEADD('day', -7, CURRENT_DATE())
GROUP BY 1
HAVING AVG(avg_running) < 0.1  -- 平均运行查询数小于0.1
ORDER BY total_credits DESC;

-- 找出过大的仓库
WITH query_times AS (
    SELECT
        warehouse_name,
        warehouse_size,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_elapsed_time) AS median_time_ms,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY total_elapsed_time) AS p95_time_ms
    FROM snowflake.account_usage.query_history
    WHERE start_time >= DATEADD('day', -7, CURRENT_DATE())
        AND total_elapsed_time > 0
    GROUP BY 1, 2
)
SELECT *
FROM query_times
WHERE median_time_ms < 5000  -- 中位数小于5秒可能仓库过大
ORDER BY warehouse_name;

-- 存储使用分析
SELECT
    table_catalog AS database_name,
    table_schema AS schema_name,
    table_name,
    row_count,
    ROUND(bytes / POWER(1024, 3), 2) AS size_gb,
    ROUND(time_travel_bytes / POWER(1024, 3), 2) AS time_travel_gb,
    ROUND(failsafe_bytes / POWER(1024, 3), 2) AS failsafe_gb,
    CASE WHEN is_transient = 'YES' THEN 'TRANSIENT' ELSE 'PERMANENT' END AS table_type
FROM snowflake.account_usage.table_storage_metrics
WHERE deleted IS NULL
ORDER BY bytes DESC
LIMIT 50;
```

### 成本优化策略

```sql
-- 1. 优化仓库配置
-- 设置合适的 AUTO_SUSPEND
ALTER WAREHOUSE analytics_wh SET AUTO_SUSPEND = 60;  -- 1分钟

-- 使用 ECONOMY 扩展策略
ALTER WAREHOUSE bi_wh SET SCALING_POLICY = 'ECONOMY';

-- 2. 减少存储成本
-- 降低非关键表的时间旅行保留期
ALTER TABLE staging_data SET DATA_RETENTION_TIME_IN_DAYS = 1;

-- 使用 TRANSIENT 表
ALTER TABLE temp_processing_data SET DATA_RETENTION_TIME_IN_DAYS = 0;

-- 清理未使用的表
-- 先查找
SELECT table_name, last_altered
FROM information_schema.tables
WHERE last_altered < DATEADD('month', -6, CURRENT_DATE())
    AND table_type = 'BASE TABLE';

-- 3. 实施资源监控器
CREATE RESOURCE MONITOR cost_control
    WITH
        CREDIT_QUOTA = 1000
        FREQUENCY = MONTHLY
        START_TIMESTAMP = IMMEDIATELY
        TRIGGERS
            ON 80 PERCENT DO NOTIFY
            ON 100 PERCENT DO SUSPEND;

-- 4. 使用标签追踪成本
ALTER WAREHOUSE analytics_wh SET TAG cost_center = 'analytics-team';
ALTER DATABASE production SET TAG cost_center = 'production';

-- 按标签查询成本
SELECT
    tag_value,
    SUM(credits_used) AS total_credits
FROM snowflake.account_usage.warehouse_metering_history wh
JOIN snowflake.account_usage.tag_references tr
    ON wh.warehouse_name = tr.object_name
WHERE tr.tag_name = 'COST_CENTER'
    AND wh.start_time >= DATE_TRUNC('month', CURRENT_DATE())
GROUP BY 1;
```

## 安全与治理

### 角色与访问控制

```sql
-- Snowflake 使用 RBAC（基于角色的访问控制）

-- 创建角色层次结构
CREATE ROLE data_viewer;      -- 只读
CREATE ROLE data_analyst;     -- 分析
CREATE ROLE data_engineer;    -- 工程
CREATE ROLE data_admin;       -- 管理

-- 设置角色继承
GRANT ROLE data_viewer TO ROLE data_analyst;
GRANT ROLE data_analyst TO ROLE data_engineer;
GRANT ROLE data_engineer TO ROLE data_admin;
GRANT ROLE data_admin TO ROLE SYSADMIN;

-- 授予权限
-- 数据查看者
GRANT USAGE ON DATABASE analytics TO ROLE data_viewer;
GRANT USAGE ON ALL SCHEMAS IN DATABASE analytics TO ROLE data_viewer;
GRANT SELECT ON ALL TABLES IN DATABASE analytics TO ROLE data_viewer;
GRANT SELECT ON FUTURE TABLES IN DATABASE analytics TO ROLE data_viewer;

-- 数据分析师
GRANT USAGE ON WAREHOUSE bi_wh TO ROLE data_analyst;
GRANT CREATE VIEW ON ALL SCHEMAS IN DATABASE analytics TO ROLE data_analyst;

-- 数据工程师
GRANT USAGE ON WAREHOUSE etl_wh TO ROLE data_engineer;
GRANT CREATE TABLE ON ALL SCHEMAS IN DATABASE analytics TO ROLE data_engineer;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN DATABASE analytics TO ROLE data_engineer;

-- 创建用户并分配角色
CREATE USER alice
    PASSWORD = 'SecurePass123!'
    DEFAULT_ROLE = data_analyst
    DEFAULT_WAREHOUSE = bi_wh
    DEFAULT_NAMESPACE = analytics.public
    MUST_CHANGE_PASSWORD = TRUE
    EMAIL = 'alice@company.com';

GRANT ROLE data_analyst TO USER alice;
```

### 数据掩码（Dynamic Data Masking）

```sql
-- 创建掩码策略
CREATE MASKING POLICY email_mask AS (val STRING) RETURNS STRING ->
    CASE
        WHEN CURRENT_ROLE() IN ('DATA_ADMIN', 'DATA_ENGINEER') THEN val
        WHEN CURRENT_ROLE() = 'DATA_ANALYST' THEN
            CONCAT(LEFT(val, 2), '***@', SPLIT_PART(val, '@', 2))
        ELSE '***@***.***'
    END;

CREATE MASKING POLICY phone_mask AS (val STRING) RETURNS STRING ->
    CASE
        WHEN CURRENT_ROLE() IN ('DATA_ADMIN') THEN val
        ELSE CONCAT('***-***-', RIGHT(val, 4))
    END;

CREATE MASKING POLICY ssn_mask AS (val STRING) RETURNS STRING ->
    CASE
        WHEN CURRENT_ROLE() = 'DATA_ADMIN' THEN val
        ELSE CONCAT('***-**-', RIGHT(val, 4))
    END;

CREATE MASKING POLICY salary_mask AS (val NUMBER) RETURNS NUMBER ->
    CASE
        WHEN CURRENT_ROLE() IN ('HR_ADMIN', 'DATA_ADMIN') THEN val
        ELSE NULL
    END;

-- 应用掩码策略
ALTER TABLE customers MODIFY COLUMN email SET MASKING POLICY email_mask;
ALTER TABLE customers MODIFY COLUMN phone SET MASKING POLICY phone_mask;
ALTER TABLE employees MODIFY COLUMN ssn SET MASKING POLICY ssn_mask;
ALTER TABLE employees MODIFY COLUMN salary SET MASKING POLICY salary_mask;

-- 测试掩码效果
USE ROLE data_analyst;
SELECT customer_id, email, phone FROM customers LIMIT 5;
-- 结果: al***@example.com, ***-***-1234

USE ROLE data_admin;
SELECT customer_id, email, phone FROM customers LIMIT 5;
-- 结果: alice@example.com, 123-456-1234
```

### 行级安全（Row Access Policies）

```sql
-- 创建行访问策略
CREATE ROW ACCESS POLICY region_access_policy AS (region_col VARCHAR) RETURNS BOOLEAN ->
    CASE
        WHEN CURRENT_ROLE() = 'DATA_ADMIN' THEN TRUE
        WHEN CURRENT_ROLE() = 'APAC_ANALYST' AND region_col = 'APAC' THEN TRUE
        WHEN CURRENT_ROLE() = 'EMEA_ANALYST' AND region_col = 'EMEA' THEN TRUE
        WHEN CURRENT_ROLE() = 'AMERICAS_ANALYST' AND region_col = 'AMERICAS' THEN TRUE
        ELSE FALSE
    END;

-- 应用行访问策略
ALTER TABLE fact_sales ADD ROW ACCESS POLICY region_access_policy ON (region);

-- 创建基于用户属性的策略
CREATE ROW ACCESS POLICY user_data_policy AS (user_id_col NUMBER) RETURNS BOOLEAN ->
    CASE
        WHEN CURRENT_ROLE() IN ('DATA_ADMIN', 'SUPPORT_ADMIN') THEN TRUE
        WHEN user_id_col = CURRENT_USER_SESSION_DATA()::OBJECT:user_id::NUMBER THEN TRUE
        ELSE FALSE
    END;

-- 使用映射表的策略
CREATE TABLE security.user_region_access (
    user_name VARCHAR,
    allowed_region VARCHAR
);

CREATE ROW ACCESS POLICY dynamic_region_policy AS (region_col VARCHAR) RETURNS BOOLEAN ->
    EXISTS (
        SELECT 1
        FROM security.user_region_access
        WHERE user_name = CURRENT_USER()
            AND allowed_region = region_col
    )
    OR CURRENT_ROLE() = 'DATA_ADMIN';

-- 测试
USE ROLE apac_analyst;
SELECT DISTINCT region FROM fact_sales;  -- 只返回 'APAC'
```

### 审计与合规

```sql
-- 查看登录历史
SELECT
    event_timestamp,
    user_name,
    client_ip,
    reported_client_type,
    reported_client_version,
    first_authentication_factor,
    second_authentication_factor,
    is_success,
    error_code,
    error_message
FROM snowflake.account_usage.login_history
WHERE event_timestamp >= DATEADD('day', -7, CURRENT_TIMESTAMP())
ORDER BY event_timestamp DESC;

-- 查看访问历史（哪些数据被访问）
SELECT
    query_id,
    query_start_time,
    user_name,
    role_name,
    direct_objects_accessed,
    base_objects_accessed,
    objects_modified
FROM snowflake.account_usage.access_history
WHERE query_start_time >= DATEADD('day', -1, CURRENT_TIMESTAMP())
ORDER BY query_start_time DESC;

-- 查看权限变更
SELECT
    query_id,
    query_text,
    user_name,
    role_name,
    start_time
FROM snowflake.account_usage.query_history
WHERE query_text ILIKE '%GRANT%'
   OR query_text ILIKE '%REVOKE%'
ORDER BY start_time DESC
LIMIT 100;

-- 创建审计视图
CREATE VIEW admin.security.daily_access_summary AS
SELECT
    DATE_TRUNC('day', query_start_time) AS access_date,
    user_name,
    role_name,
    COUNT(DISTINCT query_id) AS query_count,
    COUNT(DISTINCT PARSE_JSON(direct_objects_accessed)[0]:objectName) AS objects_accessed
FROM snowflake.account_usage.access_history
GROUP BY 1, 2, 3;
```

## 最佳实践汇总

### 命名规范

```sql
-- 数据库命名: {环境}_{业务域}
CREATE DATABASE prod_analytics;
CREATE DATABASE dev_analytics;
CREATE DATABASE staging_analytics;

-- Schema 命名: {数据层} 或 {业务模块}
CREATE SCHEMA raw;       -- 原始数据层
CREATE SCHEMA staging;   -- 暂存层
CREATE SCHEMA dwd;       -- 明细数据层（Data Warehouse Detail）
CREATE SCHEMA dws;       -- 汇总数据层（Data Warehouse Summary）
CREATE SCHEMA ads;       -- 应用数据层（Application Data Service）

-- 表命名: {层级}_{主题}_{描述}
CREATE TABLE dwd.dwd_order_detail;
CREATE TABLE dws.dws_customer_daily_summary;
CREATE TABLE ads.ads_sales_dashboard;

-- 视图命名
CREATE VIEW v_active_customers;           -- 普通视图
CREATE SECURE VIEW sv_customer_with_pii;  -- 安全视图
CREATE MATERIALIZED VIEW mv_daily_sales;  -- 物化视图

-- 仓库命名: {用途}_{大小}
CREATE WAREHOUSE etl_wh_large;
CREATE WAREHOUSE bi_wh_medium;
CREATE WAREHOUSE ds_wh_xlarge;
```

### 开发与部署流程

```sql
-- 1. 使用克隆创建开发环境
CREATE DATABASE dev_analytics CLONE prod_analytics;

-- 2. 开发和测试
USE DATABASE dev_analytics;
CREATE OR REPLACE TABLE dwd.orders_v2 AS
SELECT
    order_id,
    customer_id,
    customer_segment,
    order_amount,
    order_date,
    CURRENT_TIMESTAMP() AS etl_timestamp
FROM ...;

-- 3. 验证
SELECT COUNT(*) FROM dwd.orders_v2;
SELECT * FROM dwd.orders_v2 SAMPLE (100 ROWS);

-- 4. 部署到生产（使用 CI/CD 管道）
-- 通过版本控制管理 DDL 脚本

-- 5. 清理开发环境
DROP DATABASE dev_analytics;
```

### 监控与告警

```sql
-- 创建监控任务
CREATE TASK monitor_long_running_queries
    WAREHOUSE = admin_wh
    SCHEDULE = 'USING CRON */15 * * * * UTC'  -- 每15分钟
AS
    INSERT INTO admin.monitoring.long_running_queries
    SELECT
        CURRENT_TIMESTAMP() AS check_time,
        query_id,
        user_name,
        warehouse_name,
        total_elapsed_time / 1000 AS elapsed_seconds,
        query_text
    FROM TABLE(information_schema.query_history(
        end_time_range_start => DATEADD('minute', -15, CURRENT_TIMESTAMP()),
        result_limit => 100
    ))
    WHERE total_elapsed_time > 300000;  -- 超过5分钟

ALTER TASK monitor_long_running_queries RESUME;

-- 创建告警（Enterprise 版本）
CREATE ALERT credit_usage_alert
    WAREHOUSE = admin_wh
    SCHEDULE = 'USING CRON 0 * * * * UTC'  -- 每小时
    IF (EXISTS (
        SELECT 1
        FROM snowflake.account_usage.warehouse_metering_history
        WHERE start_time >= DATEADD('hour', -1, CURRENT_TIMESTAMP())
        GROUP BY warehouse_name
        HAVING SUM(credits_used) > 50
    ))
    THEN CALL system$send_email(
        'alerts@company.com',
        'High Credit Usage Alert',
        'Warehouse credit usage exceeded 50 credits in the last hour.'
    );

ALTER ALERT credit_usage_alert RESUME;
```

## 总结

Snowflake 作为现代云数据仓库的典范，凭借其革命性的架构设计和丰富的功能特性，正在重新定义企业数据分析的方式。本指南深入探讨了 Snowflake 的核心知识：

1. **架构设计**：三层架构实现存储计算完全分离，支持独立弹性扩展
2. **虚拟仓库**：灵活的计算资源配置，多集群自动扩展应对并发
3. **时间旅行**：强大的历史数据访问能力，支持数据恢复和审计
4. **零拷贝克隆**：秒级创建数据副本，高效支持开发测试
5. **数据共享**：真正的零拷贝实时数据共享，打破数据孤岛
6. **数据管道**：Snowpipe、Streams、Tasks 构建完整的数据流水线
7. **性能优化**：聚类、物化视图、查询优化技巧提升查询效率
8. **成本管理**：资源监控器、使用分析帮助控制云支出
9. **安全治理**：RBAC、数据掩码、行级安全确保数据安全

掌握这些知识和技能，将帮助你充分发挥 Snowflake 的能力，构建高效、安全、可扩展的现代数据分析平台。随着数据量的持续增长和分析需求的不断深化，Snowflake 的云原生优势将愈发凸显。
