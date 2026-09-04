---
title: Apache Iceberg 表格式
description: Apache Iceberg 完全指南 - 面向海量分析数据集的开放表格式
track: data
section: data-engineering
difficulty: intermediate
tags:
  - Apache Iceberg
  - Data Lake
  - Table Format
  - Big Data
  - Spark
  - Trino
  - Flink
status: imported
origin: old/src/content/docs/data/apache-iceberg.zh.md
divergence: 0.224
issues: []
legacy:
  category: Data
  subcategory: Data Lake
  order: 22
  lastUpdated: 2026-01-20
---

Apache Iceberg 是一种专为海量分析数据集设计的开放表格式。它最初由 Netflix 开发,后捐赠给 Apache 软件基金会。Iceberg 解决了传统数据湖表格式(如 Hive)的根本性限制,提供 ACID 事务、模式演进、分区演进和时间旅行等能力,同时在 PB 级规模下保持出色性能。本指南将全面介绍如何理解和在生产数据平台中有效使用 Apache Iceberg。

## 什么是 Apache Iceberg?

### 传统数据湖的问题

基于 Hive 表格式构建的传统数据湖架构存在以下关键问题:

**Hive 表格式的局限性:**

| 问题 | 影响 |
|------|------|
| 基于目录的分区 | 分区发现慢,元数据操作开销大 |
| 无 ACID 事务 | 并发写入时有数据损坏风险 |
| 模式变更需要重写 | ALTER TABLE 操作代价高昂 |
| 无时间旅行 | 无法查询历史数据状态 |
| 分区列存储在数据中 | 冗余存储,查询复杂 |
| 最终一致性 | 读写不一致问题 |

### Iceberg 如何解决这些问题

Iceberg 引入了一种**表格式规范**,将元数据管理与数据存储分离:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Iceberg 表格式                              │
├─────────────────────────────────────────────────────────────────┤
│  Catalog 层           │  元数据指针管理                          │
├─────────────────────────────────────────────────────────────────┤
│  元数据层             │  快照、清单、模式                         │
├─────────────────────────────────────────────────────────────────┤
│  数据层               │  Parquet/ORC/Avro 文件                   │
└─────────────────────────────────────────────────────────────────┘
```

**核心优势:**

- **ACID 事务**: 并发读写的可序列化隔离
- **模式演进**: 添加、重命名、删除或重排列,无需重写数据
- **分区演进**: 变更分区策略无需数据迁移
- **时间旅行**: 查询表的任意历史快照
- **隐藏分区**: 分区值从数据派生,不冗余存储
- **行级更新**: 高效的 UPDATE 和 DELETE 操作

### Iceberg vs Delta Lake vs Hudi

| 特性 | Apache Iceberg | Delta Lake | Apache Hudi |
|------|---------------|------------|-------------|
| **起源** | Netflix | Databricks | Uber |
| **治理** | Apache 基金会 | Linux 基金会 | Apache 基金会 |
| **引擎支持** | Spark, Flink, Trino, Presto, Dremio | 主要是 Spark | Spark, Flink |
| **分区演进** | 完全支持 | 有限支持 | 有限支持 |
| **隐藏分区** | 支持 | 不支持 | 不支持 |
| **模式演进** | 完全支持 | 良好支持 | 良好支持 |
| **时间旅行** | 基于快照 | 基于版本 | 基于时间线 |
| **写时复制** | 支持 | 支持 | 支持 |
| **读时合并** | 支持 | 支持(删除向量) | 支持 |
| **云对象存储** | 优秀 | 良好 | 良好 |

## 核心架构

### 元数据层

Iceberg 的元数据层由三个层级组件构成:

#### 1. 元数据文件

元数据文件是表状态的根节点,包含:

```json
{
  "format-version": 2,
  "table-uuid": "9c12d441-03fe-4693-9a96-a0705ddf69c1",
  "location": "s3://warehouse/db/table",
  "last-sequence-number": 34,
  "last-updated-ms": 1706400000000,
  "last-column-id": 3,
  "current-schema-id": 0,
  "schemas": [...],
  "default-spec-id": 0,
  "partition-specs": [...],
  "current-snapshot-id": 3051729675574597004,
  "snapshots": [...],
  "snapshot-log": [...],
  "metadata-log": [...]
}
```

#### 2. 清单列表(Manifest List)

每个快照指向一个清单列表,包含所有清单文件的条目:

```
快照 1 ──► 清单列表 1 ──┬── 清单 A (数据文件 1-1000)
                        ├── 清单 B (数据文件 1001-2000)
                        └── 清单 C (数据文件 2001-3000)
```

#### 3. 清单文件(Manifest File)

清单文件跟踪单个数据文件及其统计信息:

```
┌─────────────────────────────────────────────────────────────────┐
│ 清单文件                                                         │
├─────────────────────────────────────────────────────────────────┤
│ file_path: s3://bucket/data/part-00001.parquet                  │
│ file_format: PARQUET                                             │
│ partition: {year=2024, month=1}                                  │
│ record_count: 1000000                                            │
│ file_size_in_bytes: 52428800                                     │
│ column_sizes: {1: 10MB, 2: 20MB, 3: 22MB}                       │
│ value_counts: {1: 1000000, 2: 999500, 3: 1000000}               │
│ null_value_counts: {1: 0, 2: 500, 3: 0}                         │
│ lower_bounds: {1: "2024-01-01", 2: 0, 3: "A"}                   │
│ upper_bounds: {1: "2024-01-31", 2: 99999, 3: "Z"}               │
└─────────────────────────────────────────────────────────────────┘
```

### 快照隔离

Iceberg 使用不可变快照实现**快照隔离**:

```
时间 ──────────────────────────────────────────────────────────►

快照 1 ── 快照 2 ── 快照 3 ── 快照 4 (当前)
   │         │         │         │
   ▼         ▼         ▼         ▼
 文件 A    文件 A+B   文件 A+B+C  文件 B+C+D
                      (A 已删除)
```

**写操作流程:**

1. 写入者创建新数据文件
2. 写入者创建新清单文件引用数据文件
3. 写入者创建新清单列表引用清单文件
4. 写入者创建新快照指向清单列表
5. 原子提交:更新元数据指针指向新快照

**读操作流程:**

1. 读取者加载当前元数据文件
2. 读取者获取当前快照
3. 读取者扫描清单列表获取相关清单
4. 读取者使用分区裁剪和列统计信息
5. 读取者只读取必要的数据文件

### 模式演进

Iceberg 使用唯一 ID 跟踪每个列的模式:

```python
# 带列 ID 的模式
Schema(
    NestedField(field_id=1, name="id", field_type=LongType(), required=True),
    NestedField(field_id=2, name="data", field_type=StringType(), required=False),
    NestedField(field_id=3, name="ts", field_type=TimestampType(), required=True)
)
```

**支持的模式变更:**

| 操作 | 描述 | 向后兼容 |
|------|------|----------|
| 添加列 | 在任意位置添加新列 | 是 |
| 删除列 | 通过 ID 删除列 | 是 |
| 重命名列 | 更改列名 | 是 |
| 更新列 | 扩展类型 (int → long) | 是 |
| 重排列 | 更改列位置 | 是 |
| 必填改可选 | 放宽空值约束 | 是 |
| 可选改必填 | 不重写不允许 | 否 |

## 核心特性

### 分区演进

与 Hive 不同,Iceberg 允许在不重写数据的情况下更改分区策略:

```sql
-- 原始按天分区
ALTER TABLE events ADD PARTITION FIELD days(event_time);

-- 数据增长,演进为按小时分区
ALTER TABLE events ADD PARTITION FIELD hours(event_time);

-- 旧文件保持按天分区
-- 新文件按小时分区
-- 查询无缝跨越两种分区方式
```

**分区演进示例:**

```
┌────────────────────────────────────────────────────────────────┐
│ 分区规格 v0: 按 days(event_time) 分区                           │
├────────────────────────────────────────────────────────────────┤
│ 清单 1: 按天分区的文件 (2024-01-01, 2024-01-02)                 │
│ 清单 2: 按天分区的文件 (2024-01-03, 2024-01-04)                 │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼ ALTER TABLE ... ADD PARTITION FIELD
┌────────────────────────────────────────────────────────────────┐
│ 分区规格 v1: 按 hours(event_time) 分区                          │
├────────────────────────────────────────────────────────────────┤
│ 清单 1: 按天分区的文件 (不变)                                    │
│ 清单 2: 按天分区的文件 (不变)                                    │
│ 清单 3: 按小时分区的文件 (2024-01-05-00, ...)                   │
└────────────────────────────────────────────────────────────────┘
```

### 隐藏分区

Iceberg 使用转换函数从源列派生分区值:

```sql
CREATE TABLE events (
    event_id BIGINT,
    event_time TIMESTAMP,
    user_id BIGINT,
    event_type STRING
)
PARTITIONED BY (
    days(event_time),           -- 按天分区
    bucket(16, user_id)         -- 将用户分桶到 16 个分区
);

-- 查询自动使用分区
-- 无需指定分区列
SELECT * FROM events
WHERE event_time >= '2024-01-01'
  AND event_time < '2024-01-02';
```

**可用的分区转换:**

| 转换 | 描述 | 示例 |
|------|------|------|
| `identity` | 使用原始值 | `identity(country)` |
| `bucket(n, col)` | 哈希到 n 个桶 | `bucket(16, user_id)` |
| `truncate(w, col)` | 截断到宽度 w | `truncate(10, name)` |
| `year(col)` | 提取年份 | `year(timestamp)` |
| `month(col)` | 提取年月 | `month(timestamp)` |
| `day(col)` | 提取日期 | `day(timestamp)` |
| `hour(col)` | 提取日期时 | `hour(timestamp)` |

### 时间旅行

通过时间戳或快照 ID 查询历史快照:

```sql
-- 按时间戳查询
SELECT * FROM events TIMESTAMP AS OF '2024-01-15 10:00:00';

-- 按快照 ID 查询
SELECT * FROM events VERSION AS OF 3051729675574597004;

-- Spark 语法使用选项
SELECT * FROM events.snapshots;
SELECT * FROM events.history;

-- 比较两个快照
SELECT * FROM events
WHERE event_time BETWEEN '2024-01-01' AND '2024-01-02'
VERSION AS OF 1234567890  -- 旧快照
EXCEPT ALL
SELECT * FROM events
WHERE event_time BETWEEN '2024-01-01' AND '2024-01-02'
VERSION AS OF 9876543210; -- 新快照
```

**回滚操作:**

```sql
-- 回滚到指定快照
CALL catalog.system.rollback_to_snapshot('db.events', 3051729675574597004);

-- 回滚到指定时间戳
CALL catalog.system.rollback_to_timestamp('db.events', TIMESTAMP '2024-01-15 10:00:00');

-- 设置当前快照(用于测试/调试)
CALL catalog.system.set_current_snapshot('db.events', 3051729675574597004);
```

### 表维护

#### 压缩(Compaction)

合并小文件为大文件以提升查询性能:

```sql
-- 重写数据文件优化大小
CALL catalog.system.rewrite_data_files(
    table => 'db.events',
    strategy => 'binpack',
    options => map(
        'target-file-size-bytes', '536870912',  -- 512 MB
        'min-file-size-bytes', '67108864',       -- 64 MB
        'max-file-size-bytes', '1073741824'      -- 1 GB
    )
);

-- 基于排序的压缩以获得更好的数据聚集
CALL catalog.system.rewrite_data_files(
    table => 'db.events',
    strategy => 'sort',
    sort_order => 'event_time ASC NULLS LAST, user_id ASC NULLS LAST'
);
```

#### 过期快照

删除旧快照以回收元数据存储:

```sql
-- 过期指定时间戳之前的快照
CALL catalog.system.expire_snapshots(
    table => 'db.events',
    older_than => TIMESTAMP '2024-01-01 00:00:00',
    retain_last => 10,  -- 至少保留 10 个快照
    max_concurrent_deletes => 100
);

-- 删除孤立文件(未被任何快照引用的数据文件)
CALL catalog.system.remove_orphan_files(
    table => 'db.events',
    older_than => TIMESTAMP '2024-01-01 00:00:00'
);
```

#### 重写清单

优化清单文件以提升查询规划性能:

```sql
-- 重写小清单文件
CALL catalog.system.rewrite_manifests(
    table => 'db.events',
    use_caching => true
);
```

## 代码示例

### Spark 集成

#### 创建表

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("IcebergExample") \
    .config("spark.sql.extensions", "org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions") \
    .config("spark.sql.catalog.spark_catalog", "org.apache.iceberg.spark.SparkSessionCatalog") \
    .config("spark.sql.catalog.spark_catalog.type", "hive") \
    .config("spark.sql.catalog.local", "org.apache.iceberg.spark.SparkCatalog") \
    .config("spark.sql.catalog.local.type", "hadoop") \
    .config("spark.sql.catalog.local.warehouse", "s3://my-bucket/warehouse") \
    .getOrCreate()

# 使用 SQL 创建表
spark.sql("""
    CREATE TABLE local.db.events (
        event_id BIGINT,
        event_time TIMESTAMP,
        user_id BIGINT,
        event_type STRING,
        properties MAP<STRING, STRING>
    )
    USING iceberg
    PARTITIONED BY (days(event_time), bucket(16, user_id))
    TBLPROPERTIES (
        'write.format.default' = 'parquet',
        'write.parquet.compression-codec' = 'zstd',
        'write.target-file-size-bytes' = '536870912'
    )
""")
```

#### 插入和更新操作

```python
from pyspark.sql.functions import current_timestamp, lit, map_from_arrays, array

# 插入数据
events_df = spark.createDataFrame([
    (1, "2024-01-15 10:00:00", 100, "click", {"page": "/home"}),
    (2, "2024-01-15 10:01:00", 101, "view", {"page": "/products"}),
    (3, "2024-01-15 10:02:00", 100, "purchase", {"amount": "99.99"}),
], ["event_id", "event_time", "user_id", "event_type", "properties"])

events_df = events_df.withColumn("event_time", events_df.event_time.cast("timestamp"))

events_df.writeTo("local.db.events").append()

# 动态覆盖分区
events_df.writeTo("local.db.events") \
    .overwritePartitions()

# 更新特定行
spark.sql("""
    UPDATE local.db.events
    SET event_type = 'converted_click'
    WHERE event_type = 'click' AND user_id = 100
""")

# 删除行
spark.sql("""
    DELETE FROM local.db.events
    WHERE event_time < '2024-01-01'
""")

# 合并(Upsert)操作
spark.sql("""
    MERGE INTO local.db.events t
    USING updates s
    ON t.event_id = s.event_id
    WHEN MATCHED THEN UPDATE SET *
    WHEN NOT MATCHED THEN INSERT *
""")
```

#### 时间旅行读取

```python
# 读取当前状态
df = spark.table("local.db.events")

# 读取指定时间戳的数据
df_historical = spark.read \
    .option("as-of-timestamp", "2024-01-15 10:00:00") \
    .table("local.db.events")

# 读取指定快照
df_snapshot = spark.read \
    .option("snapshot-id", 3051729675574597004) \
    .table("local.db.events")

# 读取两个快照之间的增量变更
df_changes = spark.read \
    .option("start-snapshot-id", 1234567890) \
    .option("end-snapshot-id", 9876543210) \
    .table("local.db.events")

# 查询元数据表
spark.sql("SELECT * FROM local.db.events.snapshots").show()
spark.sql("SELECT * FROM local.db.events.history").show()
spark.sql("SELECT * FROM local.db.events.manifests").show()
spark.sql("SELECT * FROM local.db.events.files").show()
spark.sql("SELECT * FROM local.db.events.partitions").show()
```

### Trino 集成

#### 配置

```properties
# etc/catalog/iceberg.properties
connector.name=iceberg
iceberg.catalog.type=hive_metastore
hive.metastore.uri=thrift://metastore:9083

# Glue catalog 配置
connector.name=iceberg
iceberg.catalog.type=glue
hive.metastore.glue.region=us-east-1

# REST catalog 配置
connector.name=iceberg
iceberg.catalog.type=rest
iceberg.rest-catalog.uri=http://rest-catalog:8181
```

#### 查询示例

```sql
-- 创建表
CREATE TABLE iceberg.db.events (
    event_id BIGINT,
    event_time TIMESTAMP(6) WITH TIME ZONE,
    user_id BIGINT,
    event_type VARCHAR
)
WITH (
    format = 'PARQUET',
    partitioning = ARRAY['day(event_time)', 'bucket(user_id, 16)']
);

-- 插入数据
INSERT INTO iceberg.db.events
SELECT * FROM staging.events;

-- 时间旅行查询
SELECT * FROM iceberg.db.events
FOR TIMESTAMP AS OF TIMESTAMP '2024-01-15 10:00:00 UTC';

-- 快照查询
SELECT * FROM iceberg.db.events
FOR VERSION AS OF 3051729675574597004;

-- 模式演进
ALTER TABLE iceberg.db.events ADD COLUMN device_type VARCHAR;
ALTER TABLE iceberg.db.events RENAME COLUMN device_type TO device_category;
ALTER TABLE iceberg.db.events DROP COLUMN device_category;

-- 分区演进
ALTER TABLE iceberg.db.events
SET PROPERTIES partitioning = ARRAY['hour(event_time)', 'bucket(user_id, 16)'];

-- 优化 (Trino 400+)
ALTER TABLE iceberg.db.events EXECUTE optimize;
ALTER TABLE iceberg.db.events EXECUTE optimize WHERE event_time < DATE '2024-01-01';

-- 过期快照 (Trino 400+)
ALTER TABLE iceberg.db.events EXECUTE expire_snapshots(retention_threshold => '7d');

-- 删除孤立文件
ALTER TABLE iceberg.db.events EXECUTE remove_orphan_files(retention_threshold => '7d');
```

### Flink 集成

#### 流式写入

```java
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.table.api.bridge.java.StreamTableEnvironment;
import org.apache.flink.table.api.EnvironmentSettings;

StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
env.enableCheckpointing(60000); // 每分钟 checkpoint

EnvironmentSettings settings = EnvironmentSettings.newInstance()
    .inStreamingMode()
    .build();
StreamTableEnvironment tableEnv = StreamTableEnvironment.create(env, settings);

// 创建 Iceberg catalog
tableEnv.executeSql("""
    CREATE CATALOG iceberg_catalog WITH (
        'type' = 'iceberg',
        'catalog-type' = 'hive',
        'uri' = 'thrift://metastore:9083',
        'warehouse' = 's3://my-bucket/warehouse'
    )
""");

// 创建流式数据源
tableEnv.executeSql("""
    CREATE TABLE kafka_events (
        event_id BIGINT,
        event_time TIMESTAMP(3),
        user_id BIGINT,
        event_type STRING,
        WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
    ) WITH (
        'connector' = 'kafka',
        'topic' = 'events',
        'properties.bootstrap.servers' = 'kafka:9092',
        'format' = 'json'
    )
""");

// 创建 Iceberg sink 表
tableEnv.executeSql("""
    CREATE TABLE iceberg_catalog.db.events (
        event_id BIGINT,
        event_time TIMESTAMP(3),
        user_id BIGINT,
        event_type STRING
    ) WITH (
        'format-version' = '2',
        'write.upsert.enabled' = 'true'
    )
""");

// 从 Kafka 流式写入 Iceberg
tableEnv.executeSql("""
    INSERT INTO iceberg_catalog.db.events
    SELECT event_id, event_time, user_id, event_type
    FROM kafka_events
""");
```

#### 流式读取(CDC)

```java
// 从 Iceberg 读取增量变更
tableEnv.executeSql("""
    CREATE TABLE iceberg_source (
        event_id BIGINT,
        event_time TIMESTAMP(3),
        user_id BIGINT,
        event_type STRING
    ) WITH (
        'connector' = 'iceberg',
        'catalog-type' = 'hive',
        'uri' = 'thrift://metastore:9083',
        'warehouse' = 's3://my-bucket/warehouse',
        'streaming' = 'true',
        'monitor-interval' = '10s'
    )
""");

// 处理流式变更
tableEnv.executeSql("""
    SELECT
        window_start,
        window_end,
        event_type,
        COUNT(*) as event_count
    FROM TABLE(
        TUMBLE(TABLE iceberg_source, DESCRIPTOR(event_time), INTERVAL '1' HOUR)
    )
    GROUP BY window_start, window_end, event_type
""");
```

### Python (PyIceberg)

```python
from pyiceberg.catalog import load_catalog
from pyiceberg.expressions import GreaterThanOrEqual, And, EqualTo
from pyiceberg.types import NestedField, StringType, LongType, TimestampType
from pyiceberg.schema import Schema
import pyarrow as pa

# 加载 catalog
catalog = load_catalog(
    "default",
    **{
        "type": "glue",
        "region_name": "us-east-1"
    }
)

# 或使用 REST catalog
catalog = load_catalog(
    "default",
    **{
        "type": "rest",
        "uri": "http://rest-catalog:8181"
    }
)

# 列出命名空间和表
namespaces = catalog.list_namespaces()
tables = catalog.list_tables("db")

# 加载表
table = catalog.load_table("db.events")

# 查看表模式
print(table.schema())

# 查看分区规格
print(table.spec())

# 查看表属性
print(table.properties)

# 带过滤条件读取数据
scan = table.scan(
    row_filter=And(
        GreaterThanOrEqual("event_time", "2024-01-01T00:00:00"),
        EqualTo("event_type", "click")
    ),
    selected_fields=("event_id", "event_time", "user_id")
)

# 转换为 PyArrow
arrow_table = scan.to_arrow()

# 转换为 Pandas
df = scan.to_pandas()

# 读取指定快照
scan = table.scan(snapshot_id=3051729675574597004)
df_historical = scan.to_pandas()

# 追加数据
df_new = pa.table({
    "event_id": [1001, 1002, 1003],
    "event_time": pa.array([
        "2024-01-20T10:00:00",
        "2024-01-20T10:01:00",
        "2024-01-20T10:02:00"
    ]).cast(pa.timestamp("us")),
    "user_id": [100, 101, 102],
    "event_type": ["click", "view", "purchase"]
})

table.append(df_new)

# 覆盖数据
table.overwrite(df_new)

# 模式演进
with table.update_schema() as update:
    update.add_column("device_type", StringType())
    update.rename_column("device_type", "device_category")

# 更新属性
with table.update_properties() as update:
    update.set("write.target-file-size-bytes", "536870912")
```

## 最佳实践

### 分区策略

根据查询模式和数据量选择分区方式:

```sql
-- 时序数据:按时间粒度分区
-- 高数据量:按小时分区
PARTITIONED BY (hours(event_time))

-- 中等数据量:按天分区
PARTITIONED BY (days(event_time))

-- 低数据量:按月分区
PARTITIONED BY (months(event_time))

-- 多租户数据:时间与租户组合
PARTITIONED BY (days(event_time), identity(tenant_id))

-- 高基数列:使用分桶
PARTITIONED BY (days(event_time), bucket(32, user_id))
```

**分区指南:**

| 每日数据量 | 推荐分区方式 |
|-----------|-------------|
| < 100 MB | 按月或不分区 |
| 100 MB - 10 GB | 按天 |
| 10 GB - 1 TB | 按小时 |
| > 1 TB | 按小时 + 分桶 |

### 文件大小优化

为你的工作负载配置最优文件大小:

```sql
-- 文件大小的表属性
ALTER TABLE db.events SET TBLPROPERTIES (
    'write.target-file-size-bytes' = '536870912',    -- 512 MB 目标
    'write.distribution-mode' = 'hash',               -- 分布式写入
    'write.parquet.row-group-size-bytes' = '134217728' -- 128 MB 行组
);

-- 维护时的压缩设置
CALL catalog.system.rewrite_data_files(
    table => 'db.events',
    strategy => 'binpack',
    options => map(
        'target-file-size-bytes', '536870912',
        'min-file-size-bytes', '104857600',    -- 100 MB 最小
        'max-file-size-bytes', '1073741824',   -- 1 GB 最大
        'min-input-files', '5',
        'max-concurrent-file-group-rewrites', '100'
    )
);
```

### 元数据管理

配置元数据保留和优化:

```sql
-- 设置快照保留
ALTER TABLE db.events SET TBLPROPERTIES (
    'history.expire.max-snapshot-age-ms' = '604800000',  -- 7 天
    'history.expire.min-snapshots-to-keep' = '10'
);

-- 启用自动压缩 (Spark 3.4+)
ALTER TABLE db.events SET TBLPROPERTIES (
    'write.spark.fanout.enabled' = 'true',
    'write.metadata.compression-codec' = 'gzip'
);

-- 定期维护作业
-- 每天运行以保持元数据健康
CALL catalog.system.expire_snapshots('db.events', TIMESTAMP '${7_DAYS_AGO}');
CALL catalog.system.remove_orphan_files('db.events', TIMESTAMP '${7_DAYS_AGO}');
CALL catalog.system.rewrite_manifests('db.events');
```

### 写入优化

```python
# Spark 写入设置
df.writeTo("db.events") \
    .option("write.distribution-mode", "hash") \
    .option("fanout-enabled", "true") \
    .option("write.target-file-size-bytes", "536870912") \
    .append()

# 流式写入使用 checkpoint
spark.conf.set("spark.sql.streaming.checkpointLocation", "s3://bucket/checkpoints")

# 批量大插入
events_df.repartition(100).writeTo("db.events").append()

# 排序数据以获得更好的压缩和查询性能
events_df.sortWithinPartitions("event_time", "user_id") \
    .writeTo("db.events").append()
```

## 常见陷阱

### 小文件问题

**问题:** 大量小文件会降低查询性能。

```python
# 检查文件大小
spark.sql("""
    SELECT
        file_path,
        file_size_in_bytes / 1024 / 1024 as size_mb,
        record_count
    FROM db.events.files
    ORDER BY file_size_in_bytes
    LIMIT 100
""").show()

# 解决方案:定期压缩
spark.sql("""
    CALL catalog.system.rewrite_data_files(
        table => 'db.events',
        strategy => 'binpack',
        options => map(
            'min-file-size-bytes', '104857600',
            'target-file-size-bytes', '536870912'
        )
    )
""")

# 预防:配置写入分布
spark.conf.set("spark.sql.iceberg.distribution-mode", "hash")
```

### 快照堆积

**问题:** 过多快照会拖慢元数据操作。

```python
# 检查快照数量
spark.sql("SELECT COUNT(*) FROM db.events.snapshots").show()

# 查看快照历史
spark.sql("""
    SELECT
        snapshot_id,
        committed_at,
        operation,
        summary
    FROM db.events.history
    ORDER BY committed_at DESC
""").show(50)

# 解决方案:过期旧快照
spark.sql("""
    CALL catalog.system.expire_snapshots(
        table => 'db.events',
        older_than => TIMESTAMP '2024-01-01 00:00:00',
        retain_last => 10
    )
""")
```

### 并发写入冲突

**问题:** 多个写入者导致提交冲突。

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=2, max=30)
)
def write_with_retry(df, table_name):
    """带自动重试的写入。"""
    try:
        df.writeTo(table_name).append()
    except Exception as e:
        if "CommitFailedException" in str(e):
            print(f"检测到提交冲突,正在重试...")
            raise
        raise

# 适当使用隔离级别
spark.sql("""
    ALTER TABLE db.events SET TBLPROPERTIES (
        'write.wap.enabled' = 'true',
        'commit.retry.num-retries' = '5',
        'commit.retry.min-wait-ms' = '1000'
    )
""")
```

### 孤立文件

**问题:** 失败的写入留下未引用的数据文件。

```python
# 查找孤立文件
spark.sql("""
    CALL catalog.system.remove_orphan_files(
        table => 'db.events',
        older_than => TIMESTAMP '2024-01-01 00:00:00',
        dry_run => true
    )
""")

# 删除孤立文件(确认后)
spark.sql("""
    CALL catalog.system.remove_orphan_files(
        table => 'db.events',
        older_than => TIMESTAMP '2024-01-01 00:00:00'
    )
""")
```

### 查询中使用分区列

**问题:** 忘记 Iceberg 自动处理分区。

```sql
-- 错误:不要在数据中添加分区列
CREATE TABLE events (
    event_id BIGINT,
    event_time TIMESTAMP,
    event_date DATE,  -- 不要这样做!
    user_id BIGINT
)
PARTITIONED BY (event_date);

-- 正确:让 Iceberg 派生分区
CREATE TABLE events (
    event_id BIGINT,
    event_time TIMESTAMP,
    user_id BIGINT
)
PARTITIONED BY (days(event_time));

-- 查询时无需指定分区列
-- Iceberg 自动裁剪分区
SELECT * FROM events
WHERE event_time >= '2024-01-15'
  AND event_time < '2024-01-16';
```

## 性能考量

### 查询规划优化

```sql
-- 使用列统计信息进行谓词下推
ALTER TABLE db.events SET TBLPROPERTIES (
    'write.metadata.metrics.default' = 'full',
    'write.metadata.metrics.column.event_type' = 'full',
    'write.metadata.metrics.column.user_id' = 'full'
);

-- 检查统计信息是否被使用
EXPLAIN SELECT * FROM db.events WHERE user_id = 100;
```

### 数据布局优化

```sql
-- 排序数据以获得更好的局部性
CALL catalog.system.rewrite_data_files(
    table => 'db.events',
    strategy => 'sort',
    sort_order => 'user_id ASC NULLS LAST, event_time DESC NULLS LAST',
    options => map('target-file-size-bytes', '536870912')
);

-- Z-order 用于多维查询
CALL catalog.system.rewrite_data_files(
    table => 'db.events',
    strategy => 'sort',
    sort_order => 'zorder(user_id, event_type)',
    options => map('target-file-size-bytes', '536870912')
);
```

### 读取优化

```python
# 使用投影下推
df = spark.read.table("db.events") \
    .select("event_id", "event_time", "user_id")  # 只读取需要的列

# 使用谓词下推
df = spark.read.table("db.events") \
    .filter("event_time >= '2024-01-01'") \
    .filter("event_type = 'click'")

# 启用向量化读取
spark.conf.set("spark.sql.iceberg.vectorization.enabled", "true")

# 配置读取并行度
spark.conf.set("spark.sql.iceberg.split.size", "134217728")  # 128 MB 分片
```

### 元数据缓存

```python
# 在 Spark 中启用元数据缓存
spark.conf.set("spark.sql.catalog.local.cache-enabled", "true")
spark.conf.set("spark.sql.catalog.local.cache.expiration-interval-ms", "300000")

# Trino 元数据缓存
# iceberg.properties
# iceberg.file-status-cache-expire-time=10m
# iceberg.file-status-cache-max-size=100000
```

## 实战场景

### 构建数据湖仓

```python
# Bronze 层:原始摄入
spark.sql("""
    CREATE TABLE lakehouse.bronze.raw_events (
        raw_data STRING,
        ingestion_time TIMESTAMP,
        source STRING
    )
    USING iceberg
    PARTITIONED BY (days(ingestion_time), source)
    TBLPROPERTIES (
        'write.format.default' = 'parquet',
        'format-version' = '2'
    )
""")

# Silver 层:清洗和验证
spark.sql("""
    CREATE TABLE lakehouse.silver.events (
        event_id BIGINT,
        event_time TIMESTAMP,
        user_id BIGINT,
        event_type STRING,
        properties MAP<STRING, STRING>,
        processing_time TIMESTAMP
    )
    USING iceberg
    PARTITIONED BY (days(event_time))
    TBLPROPERTIES (
        'write.format.default' = 'parquet',
        'format-version' = '2'
    )
""")

# Gold 层:业务聚合
spark.sql("""
    CREATE TABLE lakehouse.gold.daily_metrics (
        date DATE,
        event_type STRING,
        user_count BIGINT,
        event_count BIGINT,
        unique_users BIGINT
    )
    USING iceberg
    PARTITIONED BY (months(date))
""")

# ETL: Bronze 到 Silver
spark.sql("""
    MERGE INTO lakehouse.silver.events t
    USING (
        SELECT
            get_json_object(raw_data, '$.event_id') as event_id,
            to_timestamp(get_json_object(raw_data, '$.event_time')) as event_time,
            get_json_object(raw_data, '$.user_id') as user_id,
            get_json_object(raw_data, '$.event_type') as event_type,
            from_json(get_json_object(raw_data, '$.properties'), 'MAP<STRING,STRING>') as properties,
            current_timestamp() as processing_time
        FROM lakehouse.bronze.raw_events
        WHERE ingestion_time >= current_date() - INTERVAL 1 DAY
    ) s
    ON t.event_id = s.event_id
    WHEN MATCHED THEN UPDATE SET *
    WHEN NOT MATCHED THEN INSERT *
""")
```

### 流批一体

```java
// Flink: 统一流式和批处理
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
StreamTableEnvironment tableEnv = StreamTableEnvironment.create(env);

// 流式数据源
tableEnv.executeSql("""
    CREATE TABLE kafka_events (...)
    WITH ('connector' = 'kafka', ...)
""");

// Iceberg sink 同时支持流式和批处理
tableEnv.executeSql("""
    CREATE TABLE iceberg_events (
        event_id BIGINT,
        event_time TIMESTAMP(3),
        user_id BIGINT,
        event_type STRING,
        PRIMARY KEY (event_id) NOT ENFORCED
    ) WITH (
        'connector' = 'iceberg',
        'catalog-type' = 'hive',
        'warehouse' = 's3://bucket/warehouse',
        'format-version' = '2',
        'write.upsert.enabled' = 'true'
    )
""");

// 精确一次语义的流式写入
tableEnv.executeSql("""
    INSERT INTO iceberg_events
    SELECT event_id, event_time, user_id, event_type
    FROM kafka_events
""");

// 在同一张表上进行批量查询
tableEnv.executeSql("""
    SELECT event_type, COUNT(*)
    FROM iceberg_events
    WHERE event_time >= TIMESTAMP '2024-01-01 00:00:00'
    GROUP BY event_type
""").print();
```

### CDC 场景

```python
# 从源数据库捕获变更
# 使用 Debezium + Kafka + Flink + Iceberg

# Flink CDC 表
"""
CREATE TABLE mysql_cdc (
    id BIGINT,
    name STRING,
    email STRING,
    updated_at TIMESTAMP(3),
    PRIMARY KEY (id) NOT ENFORCED
) WITH (
    'connector' = 'mysql-cdc',
    'hostname' = 'mysql',
    'port' = '3306',
    'username' = 'cdc_user',
    'password' = 'password',
    'database-name' = 'production',
    'table-name' = 'users'
);

CREATE TABLE iceberg_users (
    id BIGINT,
    name STRING,
    email STRING,
    updated_at TIMESTAMP(3),
    PRIMARY KEY (id) NOT ENFORCED
) WITH (
    'connector' = 'iceberg',
    'catalog-type' = 'hive',
    'warehouse' = 's3://bucket/warehouse',
    'format-version' = '2',
    'write.upsert.enabled' = 'true'
);

-- 将变更复制到 Iceberg
INSERT INTO iceberg_users SELECT * FROM mysql_cdc;
"""

# 查询 CDC 表的历史状态
spark.sql("""
    SELECT * FROM iceberg_users
    FOR TIMESTAMP AS OF '2024-01-15 10:00:00'
    WHERE id = 12345
""")
```

## 面试要点

### 概念性问题

**Q: Iceberg 解决了 Hive 表无法解决的哪些问题?**

A: Iceberg 解决了 Hive 的多个限制:
1. **ACID 事务** - Hive 缺乏真正的 ACID 支持;Iceberg 提供快照隔离
2. **模式演进** - Hive 需要昂贵的表重写;Iceberg 使用列 ID 实现无缝演进
3. **分区演进** - Hive 无法在不迁移数据的情况下更改分区;Iceberg 支持分区演进
4. **隐藏分区** - Hive 要求在查询中使用分区列;Iceberg 自动派生分区
5. **时间旅行** - Hive 没有版本控制;Iceberg 维护快照历史
6. **性能** - Hive 扫描目录获取文件;Iceberg 使用带统计信息的清单文件进行高效规划

**Q: 解释 Iceberg 如何实现快照隔离。**

A: Iceberg 的快照隔离通过以下方式工作:
1. **不可变快照** - 每次写入创建新快照而不修改现有快照
2. **原子提交** - 元数据指针更新通过文件系统重命名或 catalog CAS 实现原子性
3. **读隔离** - 读取者在查询开始时加载快照,整个过程看到一致的数据
4. **写隔离** - 写入者创建新文件并原子提交;在提交时检测冲突
5. **乐观并发** - 多个写入者可以同时工作;仅在修改相同文件时发生提交冲突

### 架构问题

**Q: 描述 Iceberg 的元数据结构。**

A: 三层层级:
1. **元数据文件** - JSON 文件,包含表模式、分区规格、当前快照和快照历史
2. **清单列表** - Avro 文件,列出快照的所有清单文件及分区摘要
3. **清单文件** - Avro 文件,跟踪单个数据文件的列统计信息、边界和计数

这种结构实现:
- 在清单列表级别进行高效分区裁剪
- 在清单级别进行基于统计的文件裁剪
- 查询规划的最小化元数据读取

**Q: Iceberg 中的分区演进是如何工作的?**

A: Iceberg 使用唯一 ID 跟踪分区规格:
1. 每个数据文件使用特定的分区规格版本写入
2. 当分区规格更改时,新文件使用新规格;旧文件保持不变
3. 查询理解多个分区规格并应用适当的过滤器
4. 无需重写数据;系统透明处理混合分区布局

### 实践问题

**Q: 如何处理 Iceberg 中的小文件?**

A: 多种策略:
1. **预防** - 使用 `write.distribution-mode=hash` 和适当的 `target-file-size-bytes`
2. **压缩** - 定期运行 binpack 策略的 `rewrite_data_files`
3. **排序压缩** - 使用 sort 策略获得更好的数据局部性
4. **流式处理** - 增加 checkpoint 间隔,使用 upsert 模式
5. **监控** - 查询 `table.files` 元数据跟踪文件大小分布

**Q: 如何使用 Iceberg 实现数据湖仓?**

A: 多层架构:
1. **Bronze(原始层)** - 摄入原始数据,最小转换,按摄入时间分区
2. **Silver(清洗层)** - 应用数据质量、去重、模式规范化
3. **Gold(策展层)** - 业务聚合、预关联数据集用于分析
4. 使用 MERGE 进行增量更新,时间旅行用于审计,随数据增长进行分区演进

## 延伸阅读

### 官方资源

- [Apache Iceberg 文档](https://iceberg.apache.org/docs/latest/)
- [Iceberg 规范](https://iceberg.apache.org/spec/)
- [Iceberg GitHub 仓库](https://github.com/apache/iceberg)

### 集成指南

- [Spark 集成](https://iceberg.apache.org/docs/latest/spark-getting-started/)
- [Flink 集成](https://iceberg.apache.org/docs/latest/flink/)
- [Trino Iceberg 连接器](https://trino.io/docs/current/connector/iceberg.html)
- [PyIceberg 文档](https://py.iceberg.apache.org/)

### 社区资源

- [Iceberg 社区 Slack](https://iceberg.apache.org/community/)
- [Apache Iceberg 博客](https://iceberg.apache.org/blogs/)
- [Tabular 博客](https://tabular.io/blog/) - Iceberg 创建者创办的公司
- [Dremio Iceberg 资源](https://www.dremio.com/apache-iceberg/)

### 书籍和课程

- "Apache Iceberg: The Definitive Guide" (O'Reilly, 2024)
- [Data Engineering with Apache Iceberg](https://www.oreilly.com/library/view/data-engineering-with/9781098148614/)

### 相关技术

- [Apache Spark](https://spark.apache.org/docs/latest/)
- [Apache Flink](https://flink.apache.org/docs/)
- [Trino](https://trino.io/docs/current/)
- [Delta Lake](https://delta.io/learn/documentation/)
- [Apache Hudi](https://hudi.apache.org/docs/overview/)

通过理解 Iceberg 的架构和能力,你可以构建现代数据平台,在 PB 级分析中提供事务保证、灵活的模式演进和强大的时间旅行功能。
