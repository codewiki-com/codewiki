---
title: Presto/Trino 分布式SQL引擎
description: 使用Presto/Trino进行交互式分析
track: data
section: analytics-engines
difficulty: intermediate
tags:
  - Presto
  - Trino
  - SQL
  - 分布式查询
status: imported
origin: old/src/content/docs/data/presto-trino.zh.md
divergence: 0.078
issues: []
legacy:
  category: Data
  subcategory: Query Engine
  order: 22
  lastUpdated: 2026-01-07
---

Presto/Trino 是一款开源的分布式 SQL 查询引擎，专为交互式分析查询设计。它能够在秒级到分钟级的时间内处理 PB 级别的数据，支持跨多种数据源的联邦查询。本指南将深入讲解 Presto/Trino 的核心概念、架构设计和实战技巧。

## Presto 与 Trino 的关系

### 历史背景

Presto 最初由 Facebook（现 Meta）于 2012 年开发，用于替代 Hive 以满足交互式查询需求。2019 年，Presto 核心创始人离开 Facebook 后创建了 Trino（原名 PrestoSQL），两个项目自此分道扬镳。

### 版本对比

| 特性 | Presto (PrestoDB) | Trino (原 PrestoSQL) |
|------|-------------------|---------------------|
| 维护方 | Meta/Linux Foundation | Trino Software Foundation |
| 社区活跃度 | 较活跃 | 非常活跃 |
| 更新频率 | 较低 | 每周发布 |
| 云服务支持 | AWS Athena | Starburst, Ahana |
| 协议 | Apache 2.0 | Apache 2.0 |

本文内容适用于两个项目，语法和概念基本一致，主要差异会特别标注。

---

## 核心架构

### 整体架构设计

Presto/Trino 采用经典的 Master-Worker 架构：

```
                    ┌─────────────────────────────┐
                    │         Client              │
                    │    (CLI/JDBC/HTTP API)      │
                    └─────────────┬───────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │        Coordinator          │
                    │  ┌─────────────────────┐   │
                    │  │   Query Parser      │   │
                    │  │   Query Planner     │   │
                    │  │   Query Optimizer   │   │
                    │  │   Query Scheduler   │   │
                    │  └─────────────────────┘   │
                    └─────────────┬───────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
┌─────────▼─────────┐  ┌─────────▼─────────┐  ┌─────────▼─────────┐
│      Worker 1     │  │      Worker 2     │  │      Worker N     │
│  ┌─────────────┐  │  │  ┌─────────────┐  │  │  ┌─────────────┐  │
│  │   Task      │  │  │  │   Task      │  │  │  │   Task      │  │
│  │   Task      │  │  │  │   Task      │  │  │  │   Task      │  │
│  └─────────────┘  │  │  └─────────────┘  │  │  └─────────────┘  │
└───────────────────┘  └───────────────────┘  └───────────────────┘
          │                       │                       │
          └───────────────────────┼───────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
    ┌─────▼─────┐          ┌─────▼─────┐          ┌─────▼─────┐
    │   Hive    │          │ PostgreSQL│          │  Kafka    │
    │ Connector │          │ Connector │          │ Connector │
    └───────────┘          └───────────┘          └───────────┘
```

### 核心组件详解

#### Coordinator（协调器）

Coordinator 是 Presto/Trino 集群的大脑，负责：

1. **查询解析**：将 SQL 转换为抽象语法树（AST）
2. **查询计划**：生成逻辑执行计划和物理执行计划
3. **查询优化**：基于代价的优化（CBO）和规则优化
4. **任务调度**：将任务分发到各个 Worker 节点
5. **结果聚合**：收集各 Worker 的执行结果

#### Worker（工作节点）

Worker 是实际执行查询任务的节点：

1. **数据读取**：通过 Connector 读取数据源
2. **数据处理**：执行过滤、聚合、连接等操作
3. **数据交换**：在 Worker 之间交换中间结果
4. **结果返回**：将处理结果返回给 Coordinator

#### Connector（连接器）

Connector 是 Presto/Trino 的可插拔数据源抽象层：

```
┌─────────────────────────────────────────────────────────┐
│                     Connector SPI                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Metadata   │  │   Split     │  │  Page Source│     │
│  │  Provider   │  │  Manager    │  │   Provider  │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

---

## 常用连接器配置

### Hive Connector

Hive Connector 是最常用的连接器，用于访问 HDFS 上的数据：

```properties
# etc/catalog/hive.properties
connector.name=hive
hive.metastore.uri=thrift://metastore-host:9083

# 认证配置
hive.hdfs.authentication.type=KERBEROS
hive.metastore.authentication.type=KERBEROS
hive.metastore.service.principal=hive/_HOST@REALM

# 性能配置
hive.max-split-size=64MB
hive.max-initial-splits=200
hive.max-partitions-per-scan=100000

# S3 配置（如使用 S3 存储）
hive.s3.aws-access-key=your-access-key
hive.s3.aws-secret-key=your-secret-key
hive.s3.endpoint=s3.amazonaws.com
```

### PostgreSQL Connector

```properties
# etc/catalog/postgresql.properties
connector.name=postgresql
connection-url=jdbc:postgresql://postgres-host:5432/database
connection-user=username
connection-password=password

# 连接池配置
connection-pool.max-connections=100
connection-pool.min-connections=10
```

### MySQL Connector

```properties
# etc/catalog/mysql.properties
connector.name=mysql
connection-url=jdbc:mysql://mysql-host:3306/database
connection-user=username
connection-password=password

# 性能配置
mysql.auto-reconnect=true
mysql.max-reconnects=3
```

### Kafka Connector

```properties
# etc/catalog/kafka.properties
connector.name=kafka
kafka.nodes=kafka1:9092,kafka2:9092,kafka3:9092
kafka.table-description-dir=/etc/trino/kafka

# 消费配置
kafka.hide-internal-columns=false
kafka.timestamp-upper-bound-force-push-down-enabled=true
```

Kafka 表定义文件示例（JSON）：

```json
{
  "tableName": "user_events",
  "schemaName": "default",
  "topicName": "user-events",
  "key": {
    "dataFormat": "raw",
    "fields": [
      {
        "name": "user_id",
        "type": "VARCHAR",
        "mapping": "user_id"
      }
    ]
  },
  "message": {
    "dataFormat": "json",
    "fields": [
      {
        "name": "user_id",
        "type": "BIGINT",
        "mapping": "user_id"
      },
      {
        "name": "event_type",
        "type": "VARCHAR",
        "mapping": "event_type"
      },
      {
        "name": "event_time",
        "type": "TIMESTAMP",
        "mapping": "event_time"
      },
      {
        "name": "properties",
        "type": "VARCHAR",
        "mapping": "properties"
      }
    ]
  }
}
```

### Iceberg Connector

```properties
# etc/catalog/iceberg.properties
connector.name=iceberg
iceberg.catalog.type=hive_metastore
hive.metastore.uri=thrift://metastore-host:9083

# 写入配置
iceberg.compression-codec=ZSTD
iceberg.target-max-file-size=512MB
```

### Delta Lake Connector

```properties
# etc/catalog/delta.properties
connector.name=delta_lake
hive.metastore.uri=thrift://metastore-host:9083

# S3 配置
hive.s3.aws-access-key=your-access-key
hive.s3.aws-secret-key=your-secret-key
```

---

## SQL 方言与语法

### 数据类型

Presto/Trino 支持丰富的数据类型：

```sql
-- 布尔类型
BOOLEAN

-- 整数类型
TINYINT     -- 8位有符号整数
SMALLINT    -- 16位有符号整数
INTEGER     -- 32位有符号整数
BIGINT      -- 64位有符号整数

-- 浮点类型
REAL        -- 32位浮点数
DOUBLE      -- 64位浮点数
DECIMAL(p, s)  -- 精确小数

-- 字符串类型
VARCHAR(n)  -- 可变长度字符串
CHAR(n)     -- 固定长度字符串

-- 日期时间类型
DATE        -- 日期
TIME        -- 时间
TIMESTAMP   -- 时间戳
TIMESTAMP WITH TIME ZONE  -- 带时区时间戳
INTERVAL    -- 时间间隔

-- 复杂类型
ARRAY<T>           -- 数组
MAP<K, V>          -- 映射
ROW(name T, ...)   -- 结构体
JSON               -- JSON 数据
```

### 基础查询语法

```sql
-- 选择特定列
SELECT
    user_id,
    user_name,
    created_at
FROM hive.default.users
WHERE created_at > DATE '2024-01-01'
LIMIT 100;

-- 聚合查询
SELECT
    department,
    COUNT(*) AS employee_count,
    AVG(salary) AS avg_salary,
    MAX(salary) AS max_salary
FROM postgresql.hr.employees
GROUP BY department
HAVING COUNT(*) > 10
ORDER BY avg_salary DESC;

-- 多表连接
SELECT
    o.order_id,
    o.order_date,
    c.customer_name,
    p.product_name,
    oi.quantity,
    oi.unit_price
FROM hive.sales.orders o
JOIN hive.sales.order_items oi ON o.order_id = oi.order_id
JOIN postgresql.crm.customers c ON o.customer_id = c.customer_id
JOIN mysql.catalog.products p ON oi.product_id = p.product_id
WHERE o.order_date >= DATE '2024-01-01';
```

### 窗口函数

```sql
-- 排名函数
SELECT
    employee_id,
    department,
    salary,
    ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) AS row_num,
    RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS rank_num,
    DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dense_rank_num,
    NTILE(4) OVER (PARTITION BY department ORDER BY salary DESC) AS quartile
FROM employees;

-- 累计和移动窗口
SELECT
    order_date,
    daily_revenue,
    SUM(daily_revenue) OVER (ORDER BY order_date) AS running_total,
    AVG(daily_revenue) OVER (
        ORDER BY order_date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS moving_avg_7d,
    LAG(daily_revenue, 1) OVER (ORDER BY order_date) AS prev_day_revenue,
    LEAD(daily_revenue, 1) OVER (ORDER BY order_date) AS next_day_revenue
FROM daily_sales;

-- 百分位和分布函数
SELECT
    department,
    salary,
    PERCENT_RANK() OVER (PARTITION BY department ORDER BY salary) AS percent_rank,
    CUME_DIST() OVER (PARTITION BY department ORDER BY salary) AS cumulative_dist,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary)
        OVER (PARTITION BY department) AS median_salary
FROM employees;
```

### 复杂类型操作

```sql
-- 数组操作
SELECT
    user_id,
    tags,
    CARDINALITY(tags) AS tag_count,
    CONTAINS(tags, 'premium') AS is_premium,
    ARRAY_JOIN(tags, ', ') AS tags_string,
    tags[1] AS first_tag
FROM users
WHERE CARDINALITY(tags) > 0;

-- 数组展开
SELECT
    user_id,
    tag
FROM users
CROSS JOIN UNNEST(tags) AS t(tag);

-- MAP 操作
SELECT
    user_id,
    properties,
    ELEMENT_AT(properties, 'country') AS country,
    MAP_KEYS(properties) AS property_keys,
    MAP_VALUES(properties) AS property_values
FROM user_profiles;

-- ROW/结构体操作
SELECT
    order_id,
    shipping_address.city AS city,
    shipping_address.postal_code AS postal_code
FROM orders;

-- JSON 解析
SELECT
    event_id,
    JSON_EXTRACT_SCALAR(event_data, '$.user_id') AS user_id,
    JSON_EXTRACT_SCALAR(event_data, '$.event_type') AS event_type,
    CAST(JSON_EXTRACT(event_data, '$.properties') AS MAP<VARCHAR, VARCHAR>) AS properties
FROM events;
```

### WITH 子句（CTE）

```sql
-- 基础 CTE
WITH daily_stats AS (
    SELECT
        DATE(order_time) AS order_date,
        COUNT(*) AS order_count,
        SUM(amount) AS total_amount
    FROM orders
    WHERE order_time >= DATE '2024-01-01'
    GROUP BY DATE(order_time)
),
weekly_stats AS (
    SELECT
        DATE_TRUNC('week', order_date) AS week_start,
        SUM(order_count) AS weekly_orders,
        SUM(total_amount) AS weekly_amount
    FROM daily_stats
    GROUP BY DATE_TRUNC('week', order_date)
)
SELECT
    week_start,
    weekly_orders,
    weekly_amount,
    weekly_amount / weekly_orders AS avg_order_value
FROM weekly_stats
ORDER BY week_start;
```

---

## 联邦查询（Federated Query）

联邦查询是 Presto/Trino 最强大的功能之一，允许在单个查询中跨多个数据源进行操作。

### 跨数据源查询示例

```sql
-- 跨 Hive、PostgreSQL、MySQL 的联邦查询
SELECT
    h.user_id,
    h.event_date,
    h.page_views,
    p.user_name,
    p.email,
    m.total_orders,
    m.lifetime_value
FROM hive.analytics.user_daily_stats h
JOIN postgresql.crm.users p ON h.user_id = p.id
JOIN mysql.ecommerce.customer_summary m ON h.user_id = m.user_id
WHERE h.event_date = CURRENT_DATE - INTERVAL '1' DAY
  AND h.page_views > 10;
```

### 跨数据源聚合

```sql
-- 合并多个数据源的销售数据
WITH online_sales AS (
    SELECT
        product_id,
        'online' AS channel,
        SUM(quantity) AS total_quantity,
        SUM(revenue) AS total_revenue
    FROM postgresql.ecommerce.orders
    WHERE order_date >= DATE '2024-01-01'
    GROUP BY product_id
),
offline_sales AS (
    SELECT
        product_id,
        'offline' AS channel,
        SUM(quantity) AS total_quantity,
        SUM(revenue) AS total_revenue
    FROM mysql.pos.transactions
    WHERE transaction_date >= DATE '2024-01-01'
    GROUP BY product_id
),
all_sales AS (
    SELECT * FROM online_sales
    UNION ALL
    SELECT * FROM offline_sales
)
SELECT
    p.product_name,
    p.category,
    s.channel,
    s.total_quantity,
    s.total_revenue
FROM all_sales s
JOIN hive.catalog.products p ON s.product_id = p.product_id
ORDER BY s.total_revenue DESC;
```

### 数据源间数据同步

```sql
-- 将查询结果写入 Hive 表
CREATE TABLE hive.analytics.user_360_view AS
SELECT
    u.user_id,
    u.email,
    u.created_at AS registration_date,
    COALESCE(o.total_orders, 0) AS total_orders,
    COALESCE(o.total_spent, 0) AS total_spent,
    COALESCE(e.total_events, 0) AS total_events,
    COALESCE(e.last_event_time, u.created_at) AS last_activity
FROM postgresql.crm.users u
LEFT JOIN (
    SELECT
        user_id,
        COUNT(*) AS total_orders,
        SUM(amount) AS total_spent
    FROM mysql.ecommerce.orders
    GROUP BY user_id
) o ON u.user_id = o.user_id
LEFT JOIN (
    SELECT
        user_id,
        COUNT(*) AS total_events,
        MAX(event_time) AS last_event_time
    FROM hive.events.user_events
    GROUP BY user_id
) e ON u.user_id = e.user_id;
```

---

## 性能优化

### 分区裁剪

分区裁剪是提升查询性能的关键技术：

```sql
-- 好：分区列出现在 WHERE 子句中，触发分区裁剪
SELECT *
FROM hive.logs.events
WHERE dt = '2024-01-15'
  AND hour = 10
  AND event_type = 'click';

-- 差：没有使用分区列，全表扫描
SELECT *
FROM hive.logs.events
WHERE event_type = 'click';

-- 使用 EXPLAIN 验证分区裁剪
EXPLAIN
SELECT COUNT(*)
FROM hive.logs.events
WHERE dt BETWEEN '2024-01-01' AND '2024-01-07';
```

### 谓词下推

```sql
-- 好：过滤条件可以下推到数据源
SELECT *
FROM postgresql.sales.orders
WHERE order_date >= DATE '2024-01-01'
  AND status = 'completed';

-- 使用 EXPLAIN 查看谓词下推情况
EXPLAIN (TYPE DISTRIBUTED)
SELECT *
FROM postgresql.sales.orders
WHERE order_date >= DATE '2024-01-01';
```

### JOIN 优化

```sql
-- 1. 小表 Broadcast Join
-- 自动触发（小表 < broadcast-join-threshold）
SELECT o.*, c.customer_name
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id;

-- 2. 手动指定 Join 分布策略
SELECT /*+ BROADCAST(c) */
    o.*, c.customer_name
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id;

-- 3. 大表 Hash Distributed Join
SELECT /*+ HASH_PARTITIONED */
    a.*, b.value
FROM large_table_a a
JOIN large_table_b b ON a.key = b.key;

-- 4. 排序合并 Join（已排序数据）
SELECT /*+ MERGE */
    a.*, b.value
FROM sorted_table_a a
JOIN sorted_table_b b ON a.key = b.key;
```

### 资源管理配置

```properties
# etc/config.properties

# 查询内存限制
query.max-memory=50GB
query.max-memory-per-node=10GB
query.max-total-memory-per-node=12GB

# 并发配置
query.max-queued-queries=5000
query.max-concurrent-queries=100

# 任务配置
task.max-worker-threads=8
task.min-drivers=4
task.concurrency=16

# 交换数据配置
exchange.max-buffer-size=32MB
exchange.concurrent-request-multiplier=3
```

### 资源组配置

```json
{
  "rootGroups": [
    {
      "name": "global",
      "softMemoryLimit": "80%",
      "hardConcurrencyLimit": 100,
      "maxQueued": 1000,
      "subGroups": [
        {
          "name": "adhoc",
          "softMemoryLimit": "30%",
          "hardConcurrencyLimit": 30,
          "maxQueued": 200,
          "schedulingPolicy": "weighted_fair",
          "schedulingWeight": 1
        },
        {
          "name": "etl",
          "softMemoryLimit": "50%",
          "hardConcurrencyLimit": 50,
          "maxQueued": 500,
          "schedulingPolicy": "weighted_fair",
          "schedulingWeight": 2
        },
        {
          "name": "priority",
          "softMemoryLimit": "20%",
          "hardConcurrencyLimit": 20,
          "maxQueued": 100,
          "schedulingPolicy": "query_priority"
        }
      ]
    }
  ],
  "selectors": [
    {
      "group": "global.priority",
      "source": ".*dashboard.*"
    },
    {
      "group": "global.etl",
      "source": ".*airflow.*"
    },
    {
      "group": "global.adhoc"
    }
  ]
}
```

### 查询优化技巧

```sql
-- 1. 只选择需要的列
-- 差
SELECT * FROM large_table;
-- 好
SELECT id, name, created_at FROM large_table;

-- 2. 限制数据量
-- 开发测试时使用 LIMIT
SELECT * FROM large_table LIMIT 1000;

-- 3. 使用 TABLESAMPLE 采样
SELECT * FROM large_table TABLESAMPLE BERNOULLI(1);  -- 1% 采样

-- 4. 避免 SELECT DISTINCT 用于大结果集
-- 差
SELECT DISTINCT user_id FROM events;
-- 好（如果只需要去重计数）
SELECT COUNT(DISTINCT user_id) FROM events;

-- 5. 使用 APPROX_DISTINCT 近似计算
SELECT APPROX_DISTINCT(user_id) AS approx_users
FROM events;

-- 6. 使用 APPROX_PERCENTILE 近似百分位
SELECT
    APPROX_PERCENTILE(response_time, 0.5) AS p50,
    APPROX_PERCENTILE(response_time, 0.95) AS p95,
    APPROX_PERCENTILE(response_time, 0.99) AS p99
FROM request_logs;

-- 7. 预聚合优化
-- 先在子查询中过滤和聚合
WITH filtered_data AS (
    SELECT user_id, SUM(amount) AS total_amount
    FROM orders
    WHERE order_date >= DATE '2024-01-01'
    GROUP BY user_id
)
SELECT u.*, f.total_amount
FROM users u
JOIN filtered_data f ON u.id = f.user_id;
```

---

## 执行计划分析

### EXPLAIN 详解

```sql
-- 基础执行计划
EXPLAIN
SELECT department, AVG(salary)
FROM employees
GROUP BY department;

-- 分布式执行计划
EXPLAIN (TYPE DISTRIBUTED)
SELECT department, AVG(salary)
FROM employees
GROUP BY department;

-- IO 分析
EXPLAIN (TYPE IO)
SELECT *
FROM hive.default.orders
WHERE order_date = DATE '2024-01-15';

-- 完整分析
EXPLAIN ANALYZE
SELECT department, AVG(salary)
FROM employees
GROUP BY department;
```

### 执行计划解读

```
执行计划示例：

Fragment 0 [SINGLE]
    - Output[department, _col1]
        - RemoteSource[1]

Fragment 1 [HASH]
    - Aggregate(FINAL)[department]
        - LocalExchange[HASH][$hashvalue]
            - RemoteSource[2]

Fragment 2 [SOURCE]
    - Aggregate(PARTIAL)[department]
        - TableScan[hive:default.employees]
            department := department:string
            salary := salary:double

关键指标：
- Fragment: 执行阶段
- SINGLE: 单节点执行
- HASH: 按哈希分布
- SOURCE: 数据源扫描阶段
- RemoteSource: 从其他 Fragment 获取数据
- Aggregate(PARTIAL/FINAL): 部分/最终聚合
```

### 性能分析查询

```sql
-- 查看运行中的查询
SELECT
    query_id,
    state,
    user,
    source,
    query,
    started,
    elapsed_time,
    queued_time,
    execution_time
FROM system.runtime.queries
WHERE state = 'RUNNING'
ORDER BY started;

-- 查看已完成查询的性能统计
SELECT
    query_id,
    state,
    elapsed_time,
    queued_time,
    planning_time,
    execution_time,
    peak_memory_bytes / 1024 / 1024 AS peak_memory_mb,
    cumulative_user_memory / 1024 / 1024 AS cumulative_memory_mb,
    output_rows,
    output_bytes / 1024 / 1024 AS output_mb
FROM system.runtime.queries
WHERE state = 'FINISHED'
  AND query LIKE '%my_table%'
ORDER BY started DESC
LIMIT 20;

-- 查看任务级别统计
SELECT
    task_id,
    stage_id,
    state,
    cpu_time_millis,
    user_memory_reservation_bytes / 1024 / 1024 AS memory_mb,
    peak_user_memory_reservation_bytes / 1024 / 1024 AS peak_memory_mb
FROM system.runtime.tasks
WHERE query_id = 'your_query_id'
ORDER BY stage_id, task_id;
```

---

## 集群部署与配置

### 单节点部署

```bash
# 下载 Trino
wget https://repo1.maven.org/maven2/io/trino/trino-server/435/trino-server-435.tar.gz
tar -xzf trino-server-435.tar.gz
cd trino-server-435

# 创建配置目录
mkdir -p etc/catalog

# 配置节点属性
cat > etc/node.properties << 'EOF'
node.environment=production
node.id=node-1
node.data-dir=/var/trino/data
EOF

# 配置 JVM
cat > etc/jvm.config << 'EOF'
-server
-Xmx16G
-XX:InitialRAMPercentage=80
-XX:MaxRAMPercentage=80
-XX:G1HeapRegionSize=32M
-XX:+ExplicitGCInvokesConcurrent
-XX:+ExitOnOutOfMemoryError
-XX:+HeapDumpOnOutOfMemoryError
-XX:-OmitStackTraceInFastThrow
-XX:ReservedCodeCacheSize=512M
-XX:PerMethodRecompilationCutoff=10000
-XX:PerBytecodeRecompilationCutoff=10000
-Djdk.attach.allowAttachSelf=true
-Djdk.nio.maxCachedBufferSize=2000000
EOF

# 配置 Coordinator
cat > etc/config.properties << 'EOF'
coordinator=true
node-scheduler.include-coordinator=true
http-server.http.port=8080
query.max-memory=5GB
query.max-memory-per-node=1GB
discovery.uri=http://localhost:8080
EOF

# 添加 Hive Catalog
cat > etc/catalog/hive.properties << 'EOF'
connector.name=hive
hive.metastore.uri=thrift://metastore:9083
EOF

# 启动服务
bin/launcher start
```

### 集群部署配置

**Coordinator 配置：**

```properties
# etc/config.properties (Coordinator)
coordinator=true
node-scheduler.include-coordinator=false
http-server.http.port=8080
query.max-memory=50GB
query.max-memory-per-node=10GB
query.max-total-memory-per-node=12GB
discovery.uri=http://coordinator:8080

# 调度配置
node-scheduler.max-splits-per-node=100
node-scheduler.max-pending-splits-per-task=10

# HTTP 配置
http-server.threads.max=200
http-server.log.enabled=true
```

**Worker 配置：**

```properties
# etc/config.properties (Worker)
coordinator=false
http-server.http.port=8080
query.max-memory=50GB
query.max-memory-per-node=10GB
query.max-total-memory-per-node=12GB
discovery.uri=http://coordinator:8080

# 任务配置
task.max-worker-threads=16
task.min-drivers=4
```

### Kubernetes 部署

```yaml
# trino-coordinator.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: trino-coordinator
spec:
  replicas: 1
  selector:
    matchLabels:
      app: trino
      component: coordinator
  template:
    metadata:
      labels:
        app: trino
        component: coordinator
    spec:
      containers:
      - name: trino
        image: trinodb/trino:435
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "16Gi"
            cpu: "4"
          limits:
            memory: "16Gi"
            cpu: "8"
        volumeMounts:
        - name: config
          mountPath: /etc/trino
        - name: catalog
          mountPath: /etc/trino/catalog
      volumes:
      - name: config
        configMap:
          name: trino-coordinator-config
      - name: catalog
        configMap:
          name: trino-catalog-config
---
# trino-worker.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: trino-worker
spec:
  replicas: 5
  selector:
    matchLabels:
      app: trino
      component: worker
  template:
    metadata:
      labels:
        app: trino
        component: worker
    spec:
      containers:
      - name: trino
        image: trinodb/trino:435
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "32Gi"
            cpu: "8"
          limits:
            memory: "32Gi"
            cpu: "16"
        volumeMounts:
        - name: config
          mountPath: /etc/trino
        - name: catalog
          mountPath: /etc/trino/catalog
      volumes:
      - name: config
        configMap:
          name: trino-worker-config
      - name: catalog
        configMap:
          name: trino-catalog-config
```

---

## 安全配置

### 认证配置

```properties
# etc/config.properties
http-server.authentication.type=PASSWORD

# etc/password-authenticator.properties
password-authenticator.name=ldap
ldap.url=ldaps://ldap-server:636
ldap.user-bind-pattern=uid=${USER},ou=users,dc=example,dc=com
ldap.group-auth-pattern=(&(objectClass=groupOfNames)(member=uid=${USER},ou=users,dc=example,dc=com))
ldap.user-base-dn=ou=users,dc=example,dc=com
```

### 授权配置

```properties
# etc/config.properties
access-control.name=file
access-control.config-file=etc/access-control.properties
```

```json
// etc/rules.json
{
  "catalogs": [
    {
      "catalog": "hive",
      "allow": "all"
    },
    {
      "catalog": "postgresql",
      "allow": "read-only"
    }
  ],
  "schemas": [
    {
      "catalog": "hive",
      "schema": "sensitive_data",
      "owner": false
    }
  ],
  "tables": [
    {
      "catalog": "hive",
      "schema": "default",
      "table": ".*",
      "privileges": ["SELECT", "INSERT", "DELETE"]
    }
  ]
}
```

### SSL/TLS 配置

```properties
# etc/config.properties
http-server.https.enabled=true
http-server.https.port=8443
http-server.https.keystore.path=/etc/trino/keystore.jks
http-server.https.keystore.key=your-keystore-password

# 内部通信加密
internal-communication.https.required=true
internal-communication.shared-secret=your-shared-secret
```

---

## 常见使用场景

### 数据湖查询分析

```sql
-- 分析 Iceberg 表的数据
SELECT
    DATE_TRUNC('day', event_time) AS event_date,
    event_type,
    COUNT(*) AS event_count,
    COUNT(DISTINCT user_id) AS unique_users
FROM iceberg.analytics.events
WHERE event_time >= CURRENT_TIMESTAMP - INTERVAL '7' DAY
GROUP BY
    DATE_TRUNC('day', event_time),
    event_type
ORDER BY event_date, event_count DESC;

-- 时间旅行查询（Iceberg）
SELECT COUNT(*)
FROM iceberg.analytics.events
FOR TIMESTAMP AS OF TIMESTAMP '2024-01-15 10:00:00';

-- 查看表快照历史
SELECT *
FROM iceberg.analytics."events$snapshots"
ORDER BY committed_at DESC
LIMIT 10;
```

### 实时数据分析

```sql
-- 分析 Kafka 实时事件流
SELECT
    window_start,
    event_type,
    COUNT(*) AS event_count
FROM (
    SELECT
        event_type,
        TUMBLE(event_time, INTERVAL '1' MINUTE) AS window_start
    FROM kafka.default.user_events
    WHERE event_time >= CURRENT_TIMESTAMP - INTERVAL '1' HOUR
)
GROUP BY window_start, event_type
ORDER BY window_start DESC, event_count DESC;
```

### ETL 数据管道

```sql
-- 增量数据同步
INSERT INTO hive.dwh.orders_fact
SELECT
    o.order_id,
    o.customer_id,
    o.order_date,
    o.total_amount,
    c.customer_segment,
    p.product_category,
    CURRENT_TIMESTAMP AS etl_time
FROM postgresql.ecommerce.orders o
JOIN postgresql.crm.customers c ON o.customer_id = c.customer_id
JOIN mysql.catalog.products p ON o.product_id = p.product_id
WHERE o.updated_at > (
    SELECT COALESCE(MAX(etl_time), TIMESTAMP '1970-01-01')
    FROM hive.dwh.orders_fact
);

-- 创建物化视图（使用 CTAS）
CREATE TABLE hive.analytics.daily_sales_summary
WITH (
    format = 'PARQUET',
    partitioned_by = ARRAY['sale_date']
) AS
SELECT
    DATE(order_time) AS sale_date,
    product_category,
    COUNT(*) AS order_count,
    SUM(amount) AS total_revenue,
    AVG(amount) AS avg_order_value
FROM hive.sales.orders
WHERE order_time >= DATE '2024-01-01'
GROUP BY DATE(order_time), product_category;
```

---

## 面试要点

### Presto/Trino 与其他查询引擎的对比

| 特性 | Presto/Trino | Spark SQL | Hive |
|------|--------------|-----------|------|
| 查询延迟 | 秒级 | 分钟级 | 分钟级 |
| 容错机制 | 无（任务级重试） | 完整容错 | 完整容错 |
| 内存使用 | 纯内存 | 内存+磁盘 | 磁盘为主 |
| 适用场景 | 交互式查询 | 批处理/ML | 大规模ETL |
| 联邦查询 | 优秀 | 一般 | 较弱 |

### 为什么 Presto/Trino 查询速度快？

- **纯内存计算**：所有中间结果都在内存中处理
- **Pipeline 执行**：数据流式处理，不需要等待上游完成
- **动态代码生成**：JIT 编译优化热点代码
- **向量化执行**：批量处理数据，减少函数调用开销
- **高效的网络传输**：优化的序列化和压缩

### Presto/Trino 的局限性

- **无容错机制**：查询失败需要重新执行
- **内存限制**：大规模聚合可能 OOM
- **不适合 ETL**：缺乏持久化和检查点
- **Join 限制**：超大表 Join 可能性能问题

### 如何优化慢查询？

```sql
-- 1. 分析执行计划
EXPLAIN ANALYZE SELECT ...;

-- 2. 检查分区裁剪
-- 确保 WHERE 子句包含分区列

-- 3. 减少数据扫描
-- 只选择需要的列
-- 使用 LIMIT 限制结果集

-- 4. 优化 JOIN
-- 小表放在 JOIN 右侧
-- 使用 BROADCAST hint

-- 5. 使用近似函数
APPROX_DISTINCT, APPROX_PERCENTILE
```

### Connector 如何工作？

Connector 通过 SPI（Service Provider Interface）与 Presto/Trino 集成：

1. **Metadata**：提供表结构、分区信息
2. **Split**：将数据划分为可并行处理的单元
3. **PageSource**：实际读取数据
4. **PageSink**：写入数据（如支持写入）

---

## 延伸阅读

### 官方资源

- [Trino 官方文档](https://trino.io/docs/current/)
- [PrestoDB 官方文档](https://prestodb.io/docs/current/)
- [Trino GitHub](https://github.com/trinodb/trino)
- [Trino Slack 社区](https://trinodb.io/slack.html)

### 推荐书籍

- **《Trino: The Definitive Guide》** - O'Reilly，Trino 权威指南
- **《Learning Presto》** - 掌握 Presto 核心概念

### 相关技术

- **Apache Iceberg**：开放表格式，与 Trino 深度集成
- **Delta Lake**：Databricks 开源数据湖格式
- **Apache Hudi**：增量数据处理框架
- **Starburst**：企业级 Trino 发行版

### 云服务

- **AWS Athena**：基于 Presto 的 Serverless 查询服务
- **Starburst Galaxy**：托管 Trino 服务
- **Ahana Cloud**：Presto 云服务

---

> **总结**：Presto/Trino 是现代数据架构中不可或缺的交互式查询引擎。它的联邦查询能力使其成为数据湖和数据仓库的理想查询层，而其高性能特性则满足了实时分析的需求。掌握 Presto/Trino 的架构原理、SQL 方言和优化技巧，将帮助你构建高效的数据分析平台。
