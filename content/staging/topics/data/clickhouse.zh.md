---
title: ClickHouse 列式数据库
description: 学习ClickHouse进行实时分析
track: data
section: analytics-engines
difficulty: intermediate
tags:
  - ClickHouse
  - 列式存储
  - OLAP
  - 实时分析
status: imported
origin: old/src/content/docs/data/clickhouse.zh.md
divergence: 0.226
issues: []
legacy:
  category: Data
  subcategory: Databases
  order: 19
  lastUpdated: 2026-01-07
---

ClickHouse 是由 Yandex 开发的开源列式数据库管理系统（DBMS），专为在线分析处理（OLAP）场景设计。它以其卓越的查询性能、高效的数据压缩和强大的实时分析能力而闻名，是处理 PB 级数据的理想选择。

## 概念解释

### 什么是 ClickHouse？

ClickHouse 是一个面向列的数据库管理系统，设计目标是快速执行分析查询。与传统的行式数据库不同，列式存储将同一列的数据连续存储在一起，这使得分析查询可以只读取需要的列，大幅减少 I/O 操作。

**核心特点**：

1. **列式存储**：数据按列存储，分析查询只读取必要的列
2. **向量化执行**：利用 CPU SIMD 指令并行处理数据
3. **数据压缩**：相同类型的数据连续存储，压缩率极高
4. **实时查询**：毫秒级响应 TB/PB 级数据的聚合查询
5. **线性扩展**：支持分布式架构，可水平扩展

### 列式存储 vs 行式存储

```
行式存储（如 MySQL、PostgreSQL）：
+----+--------+-----+--------+
| id | name   | age | salary |
+----+--------+-----+--------+
| 1  | 张三   | 25  | 15000  |
| 2  | 李四   | 30  | 20000  |
| 3  | 王五   | 35  | 18000  |
+----+--------+-----+--------+
存储顺序：[1,张三,25,15000][2,李四,30,20000][3,王五,35,18000]

列式存储（如 ClickHouse）：
id:     [1, 2, 3]
name:   [张三, 李四, 王五]
age:    [25, 30, 35]
salary: [15000, 20000, 18000]

查询 SELECT AVG(salary) 时：
- 行式存储：需读取所有行的所有列
- 列式存储：只需读取 salary 列，I/O 减少 75%
```

### 发展历史

- **2008年**：Yandex 内部开始开发用于 Yandex.Metrica 分析
- **2016年**：正式开源
- **2019年**：ClickHouse, Inc. 成立
- **2021年**：完成 B 轮融资，估值超 20 亿美元
- **至今**：全球数千家企业使用，包括 Uber、eBay、Cloudflare 等

---

## 核心原理

### MergeTree 表引擎

MergeTree 是 ClickHouse 最强大和最常用的表引擎家族，支持主键索引、数据分区、数据副本等高级特性。

**工作原理**：

```
数据写入流程：
1. 数据批量写入 -> 生成一个 Part（数据片段）
2. 每个 Part 是一个独立的目录，包含列数据文件和索引文件
3. 后台线程定期合并小 Part -> 大 Part（Merge 操作）

Part 目录结构：
partition_name/
├── checksums.txt       # 校验和
├── columns.txt         # 列信息
├── count.txt           # 行数
├── primary.idx         # 主键索引（稀疏索引）
├── column1.bin         # 列1 数据（压缩）
├── column1.mrk2        # 列1 标记文件
├── column2.bin
├── column2.mrk2
└── ...
```

**稀疏索引机制**：

```
传统 B-Tree 索引：为每一行建立索引 -> 索引大（存储成本高）
ClickHouse 稀疏索引：每 8192 行（默认）建立一个索引项 -> 索引小（可全部加载到内存）

示例（index_granularity = 8192）：
+--------+------------+
| 索引项 | 对应行范围  |
+--------+------------+
| mark_0 | 行 0-8191  |
| mark_1 | 行 8192-16383 |
| mark_2 | 行 16384-24575 |
+--------+------------+

查询时：
1. 通过稀疏索引定位可能包含数据的 mark
2. 只读取这些 mark 对应的数据块
3. 跳过不相关的数据块（Data Skipping）
```

### 数据压缩

ClickHouse 采用多层次压缩策略：

```sql
-- 列级压缩设置
CREATE TABLE example (
    id UInt64,
    name String CODEC(LZ4),           -- 快速压缩
    timestamp DateTime CODEC(DoubleDelta, LZ4),  -- 时间序列优化
    value Float64 CODEC(Gorilla),     -- 浮点数优化
    data String CODEC(ZSTD(3))        -- 高压缩率
) ENGINE = MergeTree()
ORDER BY id;

-- 常用压缩编解码器：
-- LZ4：默认，压缩/解压速度快
-- ZSTD：更高压缩率，稍慢
-- DoubleDelta：时间戳/递增整数优化
-- Gorilla：浮点数优化
-- T64：整数优化
-- Delta：差值编码
```

### 向量化执行引擎

```
传统行式处理：
for each row:
    process(row)  # 每行一次函数调用

向量化处理：
for each batch of 8192 rows:
    process(batch)  # 批量处理，利用 SIMD

优势：
1. 减少虚函数调用开销
2. 利用 CPU 缓存局部性
3. SIMD 指令并行处理多个数据
```

---

## 安装与配置

### Docker 安装（推荐）

```bash
# 拉取官方镜像
docker pull clickhouse/clickhouse-server

# 启动单节点
docker run -d \
    --name clickhouse-server \
    -p 8123:8123 \
    -p 9000:9000 \
    -v clickhouse_data:/var/lib/clickhouse \
    -v clickhouse_logs:/var/log/clickhouse-server \
    clickhouse/clickhouse-server

# 连接客户端
docker exec -it clickhouse-server clickhouse-client

# 使用 Docker Compose
cat > docker-compose.yml << 'EOF'
version: '3'
services:
  clickhouse:
    image: clickhouse/clickhouse-server
    ports:
      - "8123:8123"
      - "9000:9000"
    volumes:
      - ./data:/var/lib/clickhouse
      - ./logs:/var/log/clickhouse-server
      - ./config:/etc/clickhouse-server/config.d
    ulimits:
      nofile:
        soft: 262144
        hard: 262144
EOF

docker-compose up -d
```

### Linux 安装

```bash
# Ubuntu/Debian
sudo apt-get install -y apt-transport-https ca-certificates dirmngr
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 8919F6BD2B48D754
echo "deb https://packages.clickhouse.com/deb stable main" | sudo tee /etc/apt/sources.list.d/clickhouse.list
sudo apt-get update
sudo apt-get install -y clickhouse-server clickhouse-client

# 启动服务
sudo service clickhouse-server start

# CentOS/RHEL
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://packages.clickhouse.com/rpm/clickhouse.repo
sudo yum install -y clickhouse-server clickhouse-client

sudo systemctl start clickhouse-server
```

### 基础配置

```xml
<!-- /etc/clickhouse-server/config.d/custom.xml -->
<clickhouse>
    <!-- 监听地址 -->
    <listen_host>0.0.0.0</listen_host>

    <!-- HTTP 接口端口 -->
    <http_port>8123</http_port>

    <!-- 原生 TCP 端口 -->
    <tcp_port>9000</tcp_port>

    <!-- 最大内存使用 -->
    <max_server_memory_usage_to_ram_ratio>0.9</max_server_memory_usage_to_ram_ratio>

    <!-- 最大并发查询数 -->
    <max_concurrent_queries>100</max_concurrent_queries>

    <!-- 日志级别 -->
    <logger>
        <level>information</level>
        <log>/var/log/clickhouse-server/clickhouse-server.log</log>
        <errorlog>/var/log/clickhouse-server/clickhouse-server.err.log</errorlog>
        <size>1000M</size>
        <count>10</count>
    </logger>
</clickhouse>
```

---

## 数据类型

### 基础数据类型

```sql
-- 整数类型
Int8, Int16, Int32, Int64, Int128, Int256    -- 有符号整数
UInt8, UInt16, UInt32, UInt64, UInt128, UInt256  -- 无符号整数

-- 浮点类型
Float32, Float64

-- 高精度数值
Decimal(P, S)  -- P: 精度（总位数），S: 小数位数
Decimal32(S), Decimal64(S), Decimal128(S), Decimal256(S)

-- 字符串类型
String              -- 任意长度字符串
FixedString(N)      -- 固定长度字符串
UUID                -- 通用唯一标识符

-- 日期时间类型
Date                -- 日期（YYYY-MM-DD）
Date32              -- 扩展日期范围
DateTime            -- 日期时间（精确到秒）
DateTime64(precision, [timezone])  -- 亚秒精度

-- 布尔类型
Bool  -- 实际存储为 UInt8

-- 示例
CREATE TABLE data_types_example (
    id UInt64,
    name String,
    score Decimal(10, 2),
    created_date Date,
    created_time DateTime,
    precise_time DateTime64(3, 'Asia/Shanghai'),
    is_active Bool
) ENGINE = MergeTree()
ORDER BY id;
```

### 复合数据类型

```sql
-- 数组
Array(T)
-- 示例
CREATE TABLE array_example (
    id UInt32,
    tags Array(String),
    scores Array(Float32)
) ENGINE = MergeTree() ORDER BY id;

INSERT INTO array_example VALUES (1, ['技术', '编程'], [90.5, 85.0]);

SELECT id, arrayJoin(tags) AS tag FROM array_example;

-- 元组
Tuple(T1, T2, ...)
-- 示例
SELECT (1, 'hello', 3.14) AS tuple_value;
SELECT tuple_value.1, tuple_value.2 FROM (SELECT (1, 'hello') AS tuple_value);

-- Map（键值对）
Map(K, V)
-- 示例
CREATE TABLE map_example (
    id UInt32,
    attributes Map(String, String)
) ENGINE = MergeTree() ORDER BY id;

INSERT INTO map_example VALUES (1, {'color': 'red', 'size': 'large'});
SELECT attributes['color'] FROM map_example;

-- 嵌套结构
Nested(name1 Type1, name2 Type2, ...)
-- 示例
CREATE TABLE nested_example (
    id UInt32,
    orders Nested(
        order_id UInt32,
        amount Decimal(10, 2),
        created_at DateTime
    )
) ENGINE = MergeTree() ORDER BY id;

INSERT INTO nested_example VALUES (1, [101, 102], [99.99, 149.99], [now(), now()]);
```

### 特殊类型

```sql
-- Nullable（可空类型）
Nullable(T)
-- 示例
CREATE TABLE nullable_example (
    id UInt32,
    name Nullable(String),
    age Nullable(UInt8)
) ENGINE = MergeTree() ORDER BY id;

INSERT INTO nullable_example VALUES (1, NULL, 25);

-- LowCardinality（低基数优化）
-- 适用于取值种类少的列，使用字典编码
LowCardinality(T)
-- 示例
CREATE TABLE low_cardinality_example (
    id UInt32,
    status LowCardinality(String),  -- 状态值种类少
    country LowCardinality(String)  -- 国家种类有限
) ENGINE = MergeTree() ORDER BY id;

-- Enum（枚举类型）
Enum8('value1' = 1, 'value2' = 2)
Enum16('value1' = 1, 'value2' = 2)
-- 示例
CREATE TABLE enum_example (
    id UInt32,
    status Enum8('pending' = 0, 'processing' = 1, 'completed' = 2, 'failed' = 3)
) ENGINE = MergeTree() ORDER BY id;

INSERT INTO enum_example VALUES (1, 'pending'), (2, 'completed');

-- IP 地址类型
IPv4, IPv6
-- 示例
CREATE TABLE ip_example (
    id UInt32,
    client_ip IPv4,
    server_ip IPv6
) ENGINE = MergeTree() ORDER BY id;

INSERT INTO ip_example VALUES (1, '192.168.1.1', '::1');
SELECT client_ip, IPv4NumToString(client_ip) FROM ip_example;
```

---

## 表引擎详解

### MergeTree 家族

```sql
-- 1. MergeTree（基础引擎）
CREATE TABLE events (
    event_date Date,
    event_time DateTime,
    user_id UInt64,
    event_type String,
    value Float64
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_type, user_id, event_time)
SETTINGS index_granularity = 8192;

-- 关键参数说明：
-- PARTITION BY: 分区键，数据物理隔离
-- ORDER BY: 排序键，决定数据存储顺序和主键
-- PRIMARY KEY: 主键（默认等于 ORDER BY）
-- SETTINGS index_granularity: 索引粒度

-- 2. ReplacingMergeTree（去重）
-- 按排序键去重，保留最新版本
CREATE TABLE user_status (
    user_id UInt64,
    status String,
    updated_at DateTime
) ENGINE = ReplacingMergeTree(updated_at)
ORDER BY user_id;

-- 3. SummingMergeTree（预聚合）
-- 合并时自动求和数值列
CREATE TABLE daily_stats (
    date Date,
    category String,
    impressions UInt64,
    clicks UInt64,
    revenue Decimal(10, 2)
) ENGINE = SummingMergeTree((impressions, clicks, revenue))
PARTITION BY toYYYYMM(date)
ORDER BY (date, category);

-- 4. AggregatingMergeTree（增量聚合）
-- 存储聚合状态，支持复杂聚合函数
CREATE TABLE aggregated_stats (
    date Date,
    category String,
    count_state AggregateFunction(count, UInt64),
    sum_state AggregateFunction(sum, Float64),
    uniq_state AggregateFunction(uniq, UInt64)
) ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, category);

-- 插入数据使用 -State 后缀函数
INSERT INTO aggregated_stats
SELECT
    toDate(event_time) AS date,
    event_type AS category,
    countState(user_id) AS count_state,
    sumState(value) AS sum_state,
    uniqState(user_id) AS uniq_state
FROM events
GROUP BY date, category;

-- 查询使用 -Merge 后缀函数
SELECT
    date,
    category,
    countMerge(count_state) AS total_count,
    sumMerge(sum_state) AS total_sum,
    uniqMerge(uniq_state) AS unique_users
FROM aggregated_stats
GROUP BY date, category;

-- 5. CollapsingMergeTree（折叠合并）
-- 用于实现更新和删除
CREATE TABLE user_actions (
    user_id UInt64,
    action String,
    value Float64,
    sign Int8  -- 1: 插入，-1: 删除
) ENGINE = CollapsingMergeTree(sign)
ORDER BY user_id;

-- 6. VersionedCollapsingMergeTree（版本化折叠）
CREATE TABLE user_sessions (
    user_id UInt64,
    session_data String,
    version UInt32,
    sign Int8
) ENGINE = VersionedCollapsingMergeTree(sign, version)
ORDER BY user_id;
```

### 分布式表引擎

```sql
-- Distributed 引擎（分布式查询路由）
CREATE TABLE events_distributed
AS events
ENGINE = Distributed(
    cluster_name,       -- 集群名称
    database_name,      -- 数据库
    local_table_name,   -- 本地表名
    rand()              -- 分片键表达式
);

-- ReplicatedMergeTree（复制表）
CREATE TABLE events_replicated (
    event_date Date,
    event_time DateTime,
    user_id UInt64,
    event_type String
) ENGINE = ReplicatedMergeTree(
    '/clickhouse/tables/{shard}/events',  -- ZooKeeper 路径
    '{replica}'                            -- 副本名
)
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_type, user_id);
```

### 其他常用引擎

```sql
-- Log 家族（适合小表/临时数据）
CREATE TABLE log_table (id UInt32, data String) ENGINE = Log;
CREATE TABLE tiny_log_table (id UInt32) ENGINE = TinyLog;
CREATE TABLE stripe_log_table (id UInt32, data String) ENGINE = StripeLog;

-- Memory（内存表）
CREATE TABLE memory_table (id UInt32, value Float64) ENGINE = Memory;

-- File（文件表）
CREATE TABLE file_table (id UInt32, name String)
ENGINE = File(CSV);

-- URL（远程 URL 数据）
CREATE TABLE url_table (id UInt32, name String)
ENGINE = URL('http://example.com/data.csv', CSV);

-- MySQL（MySQL 外表）
CREATE TABLE mysql_table
ENGINE = MySQL('host:port', 'database', 'table', 'user', 'password');

-- PostgreSQL（PostgreSQL 外表）
CREATE TABLE pg_table
ENGINE = PostgreSQL('host:port', 'database', 'table', 'user', 'password');

-- Kafka（Kafka 数据源）
CREATE TABLE kafka_events (
    event_time DateTime,
    event_type String,
    data String
) ENGINE = Kafka()
SETTINGS
    kafka_broker_list = 'localhost:9092',
    kafka_topic_list = 'events',
    kafka_group_name = 'clickhouse_consumer',
    kafka_format = 'JSONEachRow';

-- Buffer（缓冲表，批量写入优化）
CREATE TABLE events_buffer AS events
ENGINE = Buffer(
    currentDatabase(), 'events',  -- 目标表
    16,                           -- 缓冲区数量
    10, 100,                      -- 最小/最大刷新秒数
    10000, 1000000,               -- 最小/最大行数
    10000000, 100000000           -- 最小/最大字节数
);
```

---

## 数据分区

### 分区策略

```sql
-- 按月分区（最常用）
CREATE TABLE events_monthly (
    event_date Date,
    event_time DateTime,
    user_id UInt64,
    event_type String
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_type, user_id);

-- 按日分区（高频写入场景）
CREATE TABLE events_daily (
    event_date Date,
    event_time DateTime,
    user_id UInt64
) ENGINE = MergeTree()
PARTITION BY event_date
ORDER BY user_id;

-- 多列分区
CREATE TABLE events_multi_partition (
    event_date Date,
    region String,
    user_id UInt64
) ENGINE = MergeTree()
PARTITION BY (toYYYYMM(event_date), region)
ORDER BY user_id;

-- 表达式分区
CREATE TABLE events_expression_partition (
    event_time DateTime,
    user_id UInt64
) ENGINE = MergeTree()
PARTITION BY (toYYYYMM(event_time), user_id % 10)
ORDER BY event_time;
```

### 分区管理

```sql
-- 查看分区信息
SELECT
    partition,
    name,
    rows,
    bytes_on_disk,
    modification_time
FROM system.parts
WHERE table = 'events'
ORDER BY partition;

-- 删除分区
ALTER TABLE events DROP PARTITION '202401';

-- 分离分区（移到 detached 目录）
ALTER TABLE events DETACH PARTITION '202401';

-- 附加分区
ALTER TABLE events ATTACH PARTITION '202401';

-- 清空分区
ALTER TABLE events CLEAR COLUMN column_name IN PARTITION '202401';

-- 移动分区到另一个表
ALTER TABLE events_archive
ATTACH PARTITION '202401' FROM events;

-- 优化分区（强制合并）
OPTIMIZE TABLE events PARTITION '202401' FINAL;

-- 冻结分区（备份）
ALTER TABLE events FREEZE PARTITION '202401';
```

---

## 物化视图

### 基本概念

物化视图是预先计算并存储查询结果的视图，在 ClickHouse 中主要用于实时聚合和数据预处理。

```sql
-- 创建源表
CREATE TABLE raw_events (
    event_time DateTime,
    user_id UInt64,
    event_type String,
    value Float64
) ENGINE = MergeTree()
PARTITION BY toYYYYMMDD(event_time)
ORDER BY (event_type, user_id, event_time);

-- 创建目标表（存储聚合结果）
CREATE TABLE hourly_stats (
    hour DateTime,
    event_type String,
    event_count UInt64,
    unique_users UInt64,
    total_value Float64,
    avg_value Float64
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (hour, event_type);

-- 创建物化视图（自动增量更新）
CREATE MATERIALIZED VIEW hourly_stats_mv
TO hourly_stats
AS SELECT
    toStartOfHour(event_time) AS hour,
    event_type,
    count() AS event_count,
    uniq(user_id) AS unique_users,
    sum(value) AS total_value,
    avg(value) AS avg_value
FROM raw_events
GROUP BY hour, event_type;

-- 现在向 raw_events 插入数据会自动更新 hourly_stats
INSERT INTO raw_events VALUES
    (now(), 1, 'click', 10.5),
    (now(), 2, 'click', 15.0),
    (now(), 1, 'view', 5.0);

-- 查询预聚合结果
SELECT * FROM hourly_stats;
```

### 高级物化视图

```sql
-- 使用 AggregatingMergeTree 实现精确聚合
CREATE TABLE aggregated_events (
    date Date,
    event_type String,
    count_state AggregateFunction(count, UInt64),
    uniq_state AggregateFunction(uniq, UInt64),
    sum_state AggregateFunction(sum, Float64),
    avg_state AggregateFunction(avg, Float64),
    quantile_state AggregateFunction(quantile(0.95), Float64)
) ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, event_type);

CREATE MATERIALIZED VIEW aggregated_events_mv
TO aggregated_events
AS SELECT
    toDate(event_time) AS date,
    event_type,
    countState(user_id) AS count_state,
    uniqState(user_id) AS uniq_state,
    sumState(value) AS sum_state,
    avgState(value) AS avg_state,
    quantileState(0.95)(value) AS quantile_state
FROM raw_events
GROUP BY date, event_type;

-- 查询时使用 -Merge 函数
SELECT
    date,
    event_type,
    countMerge(count_state) AS total_events,
    uniqMerge(uniq_state) AS unique_users,
    sumMerge(sum_state) AS total_value,
    avgMerge(avg_state) AS avg_value,
    quantileMerge(0.95)(quantile_state) AS p95_value
FROM aggregated_events
GROUP BY date, event_type;

-- 多级物化视图（漏斗分析示例）
-- 第一层：提取关键事件
CREATE MATERIALIZED VIEW funnel_events_mv
ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (user_id, event_time)
AS SELECT
    event_time,
    user_id,
    event_type,
    JSONExtractString(properties, 'page') AS page
FROM raw_events
WHERE event_type IN ('page_view', 'add_to_cart', 'checkout', 'purchase');

-- 第二层：计算用户漏斗
CREATE MATERIALIZED VIEW funnel_stats_mv
ENGINE = SummingMergeTree()
ORDER BY date
AS SELECT
    toDate(min_time) AS date,
    count() AS step1_users,
    countIf(has_step2) AS step2_users,
    countIf(has_step3) AS step3_users,
    countIf(has_step4) AS step4_users
FROM (
    SELECT
        user_id,
        min(event_time) AS min_time,
        countIf(event_type = 'add_to_cart') > 0 AS has_step2,
        countIf(event_type = 'checkout') > 0 AS has_step3,
        countIf(event_type = 'purchase') > 0 AS has_step4
    FROM funnel_events_mv
    WHERE event_type = 'page_view'
    GROUP BY user_id
);
```

### 物化视图管理

```sql
-- 查看物化视图
SELECT
    name,
    engine,
    create_table_query
FROM system.tables
WHERE engine LIKE '%MaterializedView%';

-- 暂停物化视图（不再接收新数据）
DETACH VIEW hourly_stats_mv;

-- 恢复物化视图
ATTACH MATERIALIZED VIEW hourly_stats_mv;

-- 删除物化视图
DROP VIEW IF EXISTS hourly_stats_mv;

-- 重建物化视图数据（先删除目标表数据）
TRUNCATE TABLE hourly_stats;

-- 手动填充历史数据
INSERT INTO hourly_stats
SELECT
    toStartOfHour(event_time) AS hour,
    event_type,
    count() AS event_count,
    uniq(user_id) AS unique_users,
    sum(value) AS total_value,
    avg(value) AS avg_value
FROM raw_events
GROUP BY hour, event_type;
```

---

## 分布式查询

### 集群配置

```xml
<!-- /etc/clickhouse-server/config.d/cluster.xml -->
<clickhouse>
    <remote_servers>
        <my_cluster>
            <!-- 分片1 -->
            <shard>
                <weight>1</weight>
                <internal_replication>true</internal_replication>
                <replica>
                    <host>node1</host>
                    <port>9000</port>
                </replica>
                <replica>
                    <host>node2</host>
                    <port>9000</port>
                </replica>
            </shard>
            <!-- 分片2 -->
            <shard>
                <weight>1</weight>
                <internal_replication>true</internal_replication>
                <replica>
                    <host>node3</host>
                    <port>9000</port>
                </replica>
                <replica>
                    <host>node4</host>
                    <port>9000</port>
                </replica>
            </shard>
        </my_cluster>
    </remote_servers>

    <!-- ZooKeeper 配置（副本同步需要） -->
    <zookeeper>
        <node>
            <host>zk1</host>
            <port>2181</port>
        </node>
        <node>
            <host>zk2</host>
            <port>2181</port>
        </node>
        <node>
            <host>zk3</host>
            <port>2181</port>
        </node>
    </zookeeper>

    <!-- 宏定义 -->
    <macros>
        <shard>01</shard>
        <replica>node1</replica>
    </macros>
</clickhouse>
```

### 分布式表创建

```sql
-- 在每个节点创建本地表（使用 ReplicatedMergeTree）
CREATE TABLE events_local ON CLUSTER my_cluster (
    event_date Date,
    event_time DateTime,
    user_id UInt64,
    event_type String,
    value Float64
) ENGINE = ReplicatedMergeTree(
    '/clickhouse/tables/{shard}/events',
    '{replica}'
)
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_type, user_id, event_time);

-- 创建分布式表（在任一节点）
CREATE TABLE events_distributed ON CLUSTER my_cluster
AS events_local
ENGINE = Distributed(
    my_cluster,        -- 集群名
    default,           -- 数据库名
    events_local,      -- 本地表名
    sipHash64(user_id) -- 分片键
);

-- 通过分布式表写入数据
INSERT INTO events_distributed VALUES
    (today(), now(), 1001, 'click', 10.5),
    (today(), now(), 1002, 'view', 5.0);

-- 查询分布式表（自动路由到所有分片）
SELECT
    event_type,
    count() AS cnt,
    uniq(user_id) AS users
FROM events_distributed
WHERE event_date = today()
GROUP BY event_type;
```

### 分布式查询优化

```sql
-- 使用 GLOBAL IN/JOIN（避免数据重复广播）
-- 错误做法：子查询会在每个分片执行
SELECT * FROM events_distributed
WHERE user_id IN (SELECT user_id FROM active_users_distributed);

-- 正确做法：使用 GLOBAL IN
SELECT * FROM events_distributed
WHERE user_id IN (SELECT user_id FROM active_users_local);
-- 或
SELECT * FROM events_distributed
WHERE user_id GLOBAL IN (SELECT user_id FROM active_users_distributed);

-- 分布式 JOIN 优化
-- 小表放右边，使用 GLOBAL JOIN
SELECT e.*, u.name
FROM events_distributed e
GLOBAL JOIN users_distributed u ON e.user_id = u.user_id;

-- 使用 distributed_product_mode 设置
SET distributed_product_mode = 'global';

-- 查看查询路由计划
EXPLAIN PLAN
SELECT count() FROM events_distributed WHERE event_type = 'click';
```

---

## 性能调优

### 查询优化

```sql
-- 1. 使用 PREWHERE 代替 WHERE（减少读取数据量）
-- ClickHouse 会自动优化，但可以手动指定
SELECT * FROM events
PREWHERE event_type = 'click'  -- 先过滤
WHERE value > 10;               -- 再过滤

-- 2. 选择合适的 ORDER BY
-- 高频过滤条件放在前面
CREATE TABLE events_optimized (
    event_type LowCardinality(String),  -- 高频过滤
    user_id UInt64,                      -- 次高频
    event_time DateTime,
    value Float64
) ENGINE = MergeTree()
ORDER BY (event_type, user_id, event_time);

-- 3. 使用跳数索引（Data Skipping Index）
-- 跳过不包含目标数据的 granule
ALTER TABLE events ADD INDEX idx_value (value)
TYPE minmax GRANULARITY 4;

ALTER TABLE events ADD INDEX idx_type (event_type)
TYPE set(100) GRANULARITY 4;

ALTER TABLE events ADD INDEX idx_content (content)
TYPE tokenbf_v1(10240, 3, 0) GRANULARITY 4;

-- 常用索引类型：
-- minmax: 最小最大值
-- set(n): 唯一值集合（最多n个）
-- bloom_filter: 布隆过滤器
-- tokenbf_v1: 文本分词布隆过滤器
-- ngrambf_v1: N-gram 布隆过滤器

-- 4. 使用 FINAL 谨慎
-- FINAL 会合并所有 part，性能开销大
SELECT * FROM events_replacing FINAL WHERE event_date = today();

-- 更好的做法：手动去重
SELECT argMax(value, updated_at) AS value
FROM events_replacing
WHERE event_date = today()
GROUP BY id;

-- 5. 避免 SELECT *
-- 只选择需要的列
SELECT event_type, count() FROM events GROUP BY event_type;

-- 6. 使用近似函数
-- 精确去重
SELECT uniq(user_id) FROM events;
-- 近似去重（更快，误差约 2%）
SELECT uniqHLL12(user_id) FROM events;
-- 组合估算
SELECT uniqCombined(user_id) FROM events;

-- 7. 采样查询
SELECT count() * 10 AS estimated_count
FROM events SAMPLE 0.1
WHERE event_type = 'click';
```

### 写入优化

```sql
-- 1. 批量写入（每次写入至少数千行）
-- 避免频繁小批量写入，会产生大量小 Part

-- 2. 使用 Buffer 表缓冲写入
CREATE TABLE events_buffer AS events
ENGINE = Buffer(
    currentDatabase(), 'events',
    16,              -- 缓冲区数量
    10, 100,         -- 刷新时间范围（秒）
    10000, 1000000,  -- 刷新行数范围
    10000000, 100000000  -- 刷新字节范围
);

-- 3. 异步插入
SET async_insert = 1;
SET wait_for_async_insert = 0;
INSERT INTO events VALUES (...);

-- 4. 使用 INSERT ... SELECT 批量导入
INSERT INTO events_new
SELECT * FROM events_old WHERE event_date >= '2024-01-01';

-- 5. 并行导入多个文件
-- 使用 clickhouse-local 或 clickhouse-client 并行处理
```

### 资源配置

```sql
-- 查看当前设置
SELECT name, value, description
FROM system.settings
WHERE name LIKE '%memory%';

-- 会话级别设置
SET max_memory_usage = 10000000000;  -- 10GB
SET max_threads = 8;
SET max_execution_time = 300;  -- 5分钟

-- 用户级别设置（users.xml）
-- 查询内存限制
SET max_memory_usage_for_user = 20000000000;  -- 所有查询总内存

-- 并行度设置
SET max_threads = 16;
SET max_insert_threads = 8;

-- JOIN 优化
SET join_algorithm = 'hash';  -- hash, partial_merge, parallel_hash
SET max_bytes_in_join = 1000000000;
SET join_overflow_mode = 'throw';  -- throw, break

-- 聚合优化
SET max_bytes_before_external_group_by = 20000000000;
SET max_bytes_before_external_sort = 20000000000;

-- 分布式查询优化
SET distributed_aggregation_memory_efficient = 1;
SET distributed_group_by_no_merge = 0;
```

### 监控与诊断

```sql
-- 查询运行状态
SELECT
    query_id,
    user,
    query,
    elapsed,
    read_rows,
    read_bytes,
    memory_usage
FROM system.processes;

-- 取消查询
KILL QUERY WHERE query_id = 'xxx';

-- 查看慢查询日志
SELECT
    query_start_time,
    query_duration_ms,
    read_rows,
    read_bytes,
    memory_usage,
    query
FROM system.query_log
WHERE type = 'QueryFinish'
    AND query_duration_ms > 1000
ORDER BY query_start_time DESC
LIMIT 20;

-- 查看 Part 信息
SELECT
    table,
    partition,
    name,
    rows,
    bytes_on_disk,
    modification_time,
    level
FROM system.parts
WHERE active AND database = currentDatabase()
ORDER BY bytes_on_disk DESC
LIMIT 20;

-- 查看合并状态
SELECT
    database,
    table,
    elapsed,
    progress,
    num_parts,
    result_part_name,
    total_size_bytes_compressed
FROM system.merges;

-- 表存储分析
SELECT
    table,
    sum(rows) AS total_rows,
    formatReadableSize(sum(bytes_on_disk)) AS disk_size,
    formatReadableSize(sum(data_uncompressed_bytes)) AS uncompressed_size,
    round(sum(data_compressed_bytes) / sum(data_uncompressed_bytes), 3) AS compression_ratio
FROM system.parts
WHERE active AND database = currentDatabase()
GROUP BY table
ORDER BY sum(bytes_on_disk) DESC;
```

---

## 实战场景

### 场景一：用户行为分析

```sql
-- 创建用户行为表
CREATE TABLE user_events (
    event_date Date,
    event_time DateTime64(3),
    user_id UInt64,
    session_id String,
    event_type LowCardinality(String),
    page_url String,
    referrer String,
    device_type LowCardinality(String),
    country LowCardinality(String),
    properties String  -- JSON 格式的额外属性
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_type, user_id, event_time)
TTL event_date + INTERVAL 90 DAY;  -- 90天后过期

-- 日活用户统计
SELECT
    toDate(event_time) AS date,
    uniq(user_id) AS dau
FROM user_events
WHERE event_date >= today() - 30
GROUP BY date
ORDER BY date;

-- 用户留存分析
WITH
    first_visit AS (
        SELECT user_id, min(toDate(event_time)) AS first_date
        FROM user_events
        GROUP BY user_id
    ),
    retention AS (
        SELECT
            fv.first_date AS cohort_date,
            dateDiff('day', fv.first_date, toDate(ue.event_time)) AS day_n,
            uniq(ue.user_id) AS users
        FROM user_events ue
        JOIN first_visit fv ON ue.user_id = fv.user_id
        WHERE fv.first_date >= today() - 30
        GROUP BY cohort_date, day_n
    )
SELECT
    cohort_date,
    users AS day_0,
    dictGetOrDefault('retention_dict', 'users', (cohort_date, 1), 0) AS day_1,
    dictGetOrDefault('retention_dict', 'users', (cohort_date, 7), 0) AS day_7,
    dictGetOrDefault('retention_dict', 'users', (cohort_date, 30), 0) AS day_30
FROM retention
WHERE day_n = 0
ORDER BY cohort_date;

-- 漏斗分析
SELECT
    level,
    count() AS users,
    round(count() * 100 / max(count()) OVER (), 2) AS conversion_rate
FROM (
    SELECT
        user_id,
        windowFunnel(86400)(
            event_time,
            event_type = 'page_view',
            event_type = 'add_to_cart',
            event_type = 'checkout',
            event_type = 'purchase'
        ) AS level
    FROM user_events
    WHERE event_date = today()
    GROUP BY user_id
)
GROUP BY level
ORDER BY level;

-- 用户路径分析（最近一周）
SELECT
    groupArray(event_type) AS path,
    count() AS users
FROM (
    SELECT
        user_id,
        event_type,
        row_number() OVER (PARTITION BY user_id ORDER BY event_time) AS rn
    FROM user_events
    WHERE event_date >= today() - 7
        AND event_type IN ('page_view', 'search', 'add_to_cart', 'purchase')
)
WHERE rn <= 5
GROUP BY user_id
HAVING length(path) >= 3
ORDER BY users DESC
LIMIT 20;
```

### 场景二：实时日志分析

```sql
-- 创建日志表
CREATE TABLE application_logs (
    log_date Date DEFAULT toDate(timestamp),
    timestamp DateTime64(3),
    level LowCardinality(String),
    service LowCardinality(String),
    host LowCardinality(String),
    message String,
    trace_id String,
    span_id String,
    duration_ms UInt32,
    error_code Nullable(String)
) ENGINE = MergeTree()
PARTITION BY toYYYYMMDD(log_date)
ORDER BY (service, level, timestamp)
TTL log_date + INTERVAL 30 DAY
SETTINGS index_granularity = 8192;

-- 添加全文索引
ALTER TABLE application_logs
ADD INDEX idx_message (message) TYPE tokenbf_v1(10240, 3, 0) GRANULARITY 4;

-- 实时错误监控（最近1小时）
SELECT
    toStartOfMinute(timestamp) AS minute,
    service,
    count() AS error_count,
    uniq(error_code) AS unique_errors
FROM application_logs
WHERE level = 'ERROR'
    AND timestamp >= now() - INTERVAL 1 HOUR
GROUP BY minute, service
ORDER BY minute DESC, error_count DESC;

-- 服务响应时间分析
SELECT
    service,
    count() AS requests,
    avg(duration_ms) AS avg_duration,
    quantile(0.5)(duration_ms) AS p50,
    quantile(0.95)(duration_ms) AS p95,
    quantile(0.99)(duration_ms) AS p99,
    max(duration_ms) AS max_duration
FROM application_logs
WHERE log_date = today()
    AND duration_ms > 0
GROUP BY service
ORDER BY avg_duration DESC;

-- 错误追踪
SELECT
    timestamp,
    service,
    host,
    level,
    message,
    trace_id
FROM application_logs
WHERE level = 'ERROR'
    AND timestamp >= now() - INTERVAL 10 MINUTE
ORDER BY timestamp DESC
LIMIT 100;

-- 基于 trace_id 的链路追踪
SELECT
    timestamp,
    service,
    span_id,
    duration_ms,
    level,
    message
FROM application_logs
WHERE trace_id = 'abc123'
ORDER BY timestamp;
```

### 场景三：时序数据分析

```sql
-- 创建监控指标表
CREATE TABLE metrics (
    timestamp DateTime,
    metric_name LowCardinality(String),
    tags Map(String, String),
    value Float64
) ENGINE = MergeTree()
PARTITION BY toYYYYMMDD(timestamp)
ORDER BY (metric_name, timestamp)
TTL timestamp + INTERVAL 7 DAY;

-- 按时间窗口聚合
SELECT
    toStartOfInterval(timestamp, INTERVAL 5 MINUTE) AS time_bucket,
    metric_name,
    avg(value) AS avg_value,
    max(value) AS max_value,
    min(value) AS min_value
FROM metrics
WHERE timestamp >= now() - INTERVAL 1 HOUR
    AND metric_name = 'cpu_usage'
GROUP BY time_bucket, metric_name
ORDER BY time_bucket;

-- 异常检测（超过3个标准差）
WITH stats AS (
    SELECT
        metric_name,
        avg(value) AS mean_val,
        stddevPop(value) AS std_val
    FROM metrics
    WHERE timestamp >= now() - INTERVAL 1 HOUR
    GROUP BY metric_name
)
SELECT
    m.timestamp,
    m.metric_name,
    m.value,
    s.mean_val,
    s.std_val,
    (m.value - s.mean_val) / s.std_val AS z_score
FROM metrics m
JOIN stats s ON m.metric_name = s.metric_name
WHERE m.timestamp >= now() - INTERVAL 10 MINUTE
    AND abs((m.value - s.mean_val) / s.std_val) > 3
ORDER BY m.timestamp DESC;

-- 降采样查询（1分钟 -> 1小时）
SELECT
    toStartOfHour(timestamp) AS hour,
    metric_name,
    tags['host'] AS host,
    avg(value) AS avg_value,
    max(value) AS max_value,
    min(value) AS min_value,
    count() AS sample_count
FROM metrics
WHERE timestamp >= now() - INTERVAL 24 HOUR
GROUP BY hour, metric_name, host
ORDER BY hour, metric_name;
```

---

## 面试要点

### ClickHouse 为什么这么快？

1. **列式存储**：分析查询只读取需要的列，减少 I/O
2. **数据压缩**：同类型数据连续存储，压缩率高（通常 10:1）
3. **向量化执行**：批量处理数据，利用 SIMD 指令
4. **稀疏索引**：索引小，可全部加载到内存
5. **并行处理**：充分利用多核 CPU
6. **MergeTree 引擎**：高效的数据组织和查询

### MergeTree 的工作原理？

- 数据按 Part 组织，每个 Part 是有序的
- 后台持续合并小 Part 为大 Part
- 使用稀疏主键索引定位数据块
- 支持分区、TTL、二级索引等特性

### 如何处理数据更新？

ClickHouse 不支持传统的 UPDATE/DELETE，替代方案：

```sql
-- 1. CollapsingMergeTree：通过正负标记实现
-- 2. ReplacingMergeTree：保留最新版本
-- 3. AggregatingMergeTree：增量聚合
-- 4. ALTER TABLE ... UPDATE/DELETE（异步mutation）
ALTER TABLE events UPDATE value = 100 WHERE id = 1;
ALTER TABLE events DELETE WHERE id = 1;
```

### 分布式表的注意事项？

- Distributed 表只是查询路由，数据存储在本地表
- 使用 GLOBAL IN/JOIN 避免数据重复广播
- 分片键选择要考虑数据均匀分布
- 副本使用 ReplicatedMergeTree + ZooKeeper

### 如何优化慢查询？

```sql
-- 分析执行计划
EXPLAIN PLAN SELECT ...;
EXPLAIN PIPELINE SELECT ...;

-- 优化策略：
-- 1. 合适的 ORDER BY（高频过滤条件在前）
-- 2. 使用 PREWHERE
-- 3. 添加跳数索引
-- 4. 避免 SELECT *
-- 5. 使用物化视图预聚合
-- 6. 使用近似函数
```

---

## 延伸阅读

### 官方资源

- [ClickHouse 官方文档](https://clickhouse.com/docs) - 最权威的参考资料
- [ClickHouse GitHub](https://github.com/ClickHouse/ClickHouse) - 源码和问题追踪
- [ClickHouse 博客](https://clickhouse.com/blog) - 技术文章和最佳实践

### 推荐书籍

- **《ClickHouse 原理解析与应用实践》** - 深入讲解内部原理
- **《大数据分析：ClickHouse 从入门到精通》** - 实战案例丰富

### 社区资源

- [ClickHouse Slack](https://clickhouse.com/slack) - 官方交流社区
- [Altinity 博客](https://altinity.com/blog/) - ClickHouse 托管服务商的技术博客
- [ClickHouse 中文社区](https://clickhouse.com.cn/) - 中文资料汇总

### 相关技术

- **Kafka + ClickHouse**：实时数据流接入
- **Grafana + ClickHouse**：可视化监控
- **dbt + ClickHouse**：数据转换工程
- **Superset + ClickHouse**：自助分析平台

### 实践项目

- 实时用户行为分析平台
- 应用性能监控（APM）系统
- 时序数据存储与分析
- 实时广告效果分析

---

> **总结**：ClickHouse 是一个专为 OLAP 场景设计的高性能列式数据库。其列式存储、向量化执行和 MergeTree 引擎是性能的核心保障。在实际应用中，需要根据业务特点选择合适的表引擎、设计合理的分区策略、善用物化视图预聚合，并持续监控和优化查询性能。掌握 ClickHouse，你将拥有处理 PB 级数据实时分析的能力。
