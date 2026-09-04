---
title: Apache Hudi 数据湖
description: Apache Hudi 全面指南 - 面向增量处理的事务性数据湖平台
track: data
section: data-engineering
difficulty: intermediate
tags:
  - Apache Hudi
  - Data Lake
  - Incremental Processing
  - CDC
  - Spark
  - Flink
status: imported
origin: old/src/content/docs/data/apache-hudi.zh.md
divergence: 0.207
issues: []
legacy:
  category: Data
  subcategory: Data Lake
  order: 23
  lastUpdated: 2026-01-20
---

Apache Hudi（Hadoop Upserts Deletes and Incrementals）是一个开源数据湖平台，专为高效的增量数据处理和近实时分析而设计。Hudi 最初由 Uber 开发，用于解决流式数据摄取的挑战，如今已成为与 Apache Iceberg 和 Delta Lake 并列的三大开放表格式之一。Hudi 的独特之处在于其一流的记录级更新支持、高效的 upsert 操作，以及内置的 CDC（变更数据捕获）能力，使其成为流式数据管道和实时数据湖的理想选择。

## 什么是 Apache Hudi？

### Hudi 解决的问题

构建在 HDFS 或云对象存储上的传统数据湖在处理可变数据时面临重大挑战：

**传统数据湖的局限性：**

| 挑战 | 影响 |
|------|------|
| 无记录级更新 | 修改单行需要重写整个分区 |
| CDC 复杂性 | 变更数据捕获需要复杂的外部工具 |
| 仅支持批处理 | 无法满足近实时数据需求 |
| 无增量查询 | 必须重新扫描整个数据集以获取变更 |
| 数据新鲜度问题 | 数据到达和可用之间存在较长延迟 |
| 写放大 | 小更新导致大量重写 |

### Hudi 如何解决这些挑战

Hudi 引入了一个**存储层**，为数据湖带来记录级操作能力：

```
┌─────────────────────────────────────────────────────────────────┐
│                      Apache Hudi 架构                            │
├─────────────────────────────────────────────────────────────────┤
│  查询引擎层        │  Spark, Flink, Presto, Trino, Hive         │
├─────────────────────────────────────────────────────────────────┤
│  Hudi 表格式      │  Timeline, Index, Compaction, Clustering    │
├─────────────────────────────────────────────────────────────────┤
│  存储层           │  HDFS, S3, GCS, Azure Blob, MinIO           │
├─────────────────────────────────────────────────────────────────┤
│  文件格式         │  Parquet（主要）, ORC, HFile                 │
└─────────────────────────────────────────────────────────────────┘
```

**核心价值：**

- **记录级操作**：高效的 INSERT、UPDATE、DELETE 记录级操作
- **增量处理**：仅处理变更数据，而非整个数据集
- **近实时摄取**：流式数据的亚分钟级延迟
- **内置 CDC**：原生支持变更数据捕获工作流
- **ACID 事务**：带乐观并发的可序列化隔离
- **时间旅行**：查询历史快照和审计变更

### Hudi vs. Iceberg vs. Delta Lake

| 特性 | Apache Hudi | Apache Iceberg | Delta Lake |
|------|-------------|----------------|------------|
| **起源** | Uber | Netflix | Databricks |
| **核心关注** | 增量处理、CDC | Schema/分区演进 | 统一批流处理 |
| **表类型** | Copy-on-Write, Merge-on-Read | 单一格式（COW/MOR 模式）| 单一格式 |
| **索引支持** | Bloom、HBase、Bucket、记录级 | 仅分区级 | 仅分区级 |
| **Compaction** | 同步/异步 | 手动/调度 | 自动优化 |
| **增量查询** | 一等支持 | 基于快照 | Change Data Feed |
| **写入延迟** | 可达亚分钟级 | 分钟级 | 分钟级 |
| **记录级 Upsert** | 优化（有索引）| 全分区扫描 | 全分区扫描 |
| **流式原生** | 是（DeltaStreamer）| 通过 Flink 集成 | 通过 Spark Streaming |
| **并发控制** | OCC + 文件级锁 | OCC + 快照隔离 | OCC + 版本冲突 |

**何时选择 Hudi：**

- 高频 upsert 工作负载（CDC、事件流）
- 近实时数据新鲜度要求
- 增量 ETL 管道
- 需要记录级索引
- 流式优先架构

## 核心架构

### Timeline：Hudi 的核心

Timeline 是 Hudi 的核心元数据结构，将表上的所有操作追踪为一系列 **Instant**：

```
Timeline 结构：
─────────────────────────────────────────────────────────────────►
│ t1        │ t2        │ t3        │ t4        │ t5        │
│ COMMIT    │ COMMIT    │ DELTA     │ COMPACT   │ COMMIT    │
│ (bulk)    │ (upsert)  │ (upsert)  │           │ (upsert)  │
└───────────┴───────────┴───────────┴───────────┴───────────┘

每个 Instant 包含：
├── <instant_time>.commit              (已完成的提交)
├── <instant_time>.inflight            (进行中的操作)
├── <instant_time>.requested           (已调度的操作)
├── <instant_time>.deltacommit         (MOR 增量提交)
├── <instant_time>.compaction.requested (已调度的压缩)
└── <instant_time>.compaction.inflight (进行中的压缩)
```

**Instant 状态：**

| 状态 | 描述 |
|------|------|
| `REQUESTED` | 操作已调度但未开始 |
| `INFLIGHT` | 操作进行中 |
| `COMPLETED` | 操作成功完成 |

**操作类型：**

| 操作 | 描述 |
|------|------|
| `COMMIT` | COW 表写入完成 |
| `DELTACOMMIT` | MOR 表写入完成 |
| `COMPACTION` | 将增量日志合并到基础文件 |
| `CLUSTERING` | 重组数据布局 |
| `CLEAN` | 删除旧版本文件 |
| `ROLLBACK` | 撤销失败的操作 |
| `SAVEPOINT` | 标记快照以保留 |
| `RESTORE` | 恢复到保存点 |

### 表类型：Copy-on-Write vs Merge-on-Read

Hudi 提供两种针对不同工作负载优化的表类型：

#### Copy-on-Write (COW)

```
COW 写入操作：
┌──────────────┐    更新     ┌──────────────┐
│  基础文件    │  ────────►   │  新基础文件   │
│  (Parquet)   │   记录      │              │
│  v1          │             │   v2         │
└──────────────┘             └──────────────┘

Timeline：
t1: file_1.parquet (100 条记录)
t2: file_1.parquet 删除, file_2.parquet 创建 (100 条记录, 1 条更新)
```

**COW 特点：**

- 数据完全存储在列式文件（Parquet）中
- 更新会重写包含该记录的整个文件
- 最佳读取性能（无需合并）
- 较高的写放大
- 适用于：读多写少、批量更新、小表

#### Merge-on-Read (MOR)

```
MOR 写入操作：
┌──────────────┐             ┌──────────────┐
│  基础文件    │             │  基础文件     │  (不变)
│  (Parquet)   │             │  (Parquet)    │
└──────────────┘             └──────────────┘
                    更新            +
                  ────────►   ┌──────────────┐
                              │  日志文件     │  (追加)
                              │  (.log)      │
                              └──────────────┘

读取操作（快照查询）：
基础文件 + 日志文件 = 合并视图
```

**MOR 特点：**

- 更新写入行式日志文件
- 基础文件在 compaction 之前保持不变
- 更低的写入延迟和写放大
- 轻微的读取开销（查询时合并）
- 后台 compaction 将日志合并到基础文件
- 适用于：写多读少、流式摄取、频繁更新

**对比：**

| 方面 | Copy-on-Write | Merge-on-Read |
|------|---------------|---------------|
| 写入延迟 | 较高 | 较低 |
| 读取延迟 | 较低 | 较高（未 compaction 时）|
| 写放大 | 较高 | 较低 |
| 存储开销 | 较低 | 较高（日志+基础）|
| 需要 Compaction | 否 | 是 |
| 适用场景 | 读多、批处理 | 写多、流式 |

### 索引机制

Hudi 的索引是实现大规模高效记录级操作的关键：

#### Bloom Index（默认）

```
Bloom Index 操作流程：
┌─────────────────────────────────────────────────────────────────┐
│ 入站记录: {id: 12345, name: "Alice", amount: 100}               │
├─────────────────────────────────────────────────────────────────┤
│ 步骤 1: 对记录键哈希 (id: 12345)                                 │
│ 步骤 2: 检查文件页脚中的布隆过滤器                                │
│         file_1.parquet: bloom(12345) = 可能存在                 │
│         file_2.parquet: bloom(12345) = 肯定不存在               │
│         file_3.parquet: bloom(12345) = 肯定不存在               │
│ 步骤 3: 仅扫描 file_1.parquet 进行确认                           │
│ 步骤 4: 更新 file_1 (COW) 或追加到 file_1.log (MOR)             │
└─────────────────────────────────────────────────────────────────┘
```

**配置：**

```properties
hoodie.index.type=BLOOM
hoodie.bloom.index.filter.type=DYNAMIC_V0
hoodie.bloom.index.filter.dynamic.max.entries=100000
hoodie.index.bloom.num.entries=60000
hoodie.index.bloom.fpp=0.000000001
```

#### Simple Index

使用分区路径 + 记录键定位文件。适合追加密集型工作负载。

```properties
hoodie.index.type=SIMPLE
```

#### Bucket Index

基于哈希的分桶，实现可预测的文件位置：

```properties
hoodie.index.type=BUCKET
hoodie.bucket.index.num.buckets=256
hoodie.bucket.index.hash.field=record_key
```

#### HBase Index

使用外部 HBase 实现全局索引（适用于大表高频更新）：

```properties
hoodie.index.type=HBASE
hoodie.index.hbase.zkquorum=zk1:2181,zk2:2181
hoodie.index.hbase.zkport=2181
hoodie.index.hbase.table=hudi_index_table
```

#### Record-level Index（Hudi 0.13+）

基于元数据表的索引，实现 O(1) 记录查找：

```properties
hoodie.index.type=RECORD_INDEX
hoodie.metadata.index.column.stats.enable=true
hoodie.metadata.index.bloom.filter.enable=true
```

### 文件布局

```
hudi_table/
├── .hoodie/                           # 元数据目录
│   ├── hoodie.properties              # 表配置
│   ├── 20240115100000.commit          # 已完成的提交
│   ├── 20240115100000.commit.requested
│   ├── 20240115110000.deltacommit     # MOR 增量提交
│   ├── 20240115120000.compaction.requested
│   └── archived/                      # 归档的 timeline
├── 2024/01/15/                        # 分区路径
│   ├── file_1_<write_token>_<file_id>.parquet    # 基础文件
│   ├── .file_1_<instant>_<file_id>.log           # 日志文件 (MOR)
│   └── .hoodie_partition_metadata     # 分区元数据
└── 2024/01/16/
    └── ...
```

## 核心操作

### 写入操作

#### Insert（插入）

批量插入新记录，不检查重复：

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("HudiInsert") \
    .config("spark.serializer", "org.apache.spark.serializer.KryoSerializer") \
    .config("spark.sql.extensions", "org.apache.spark.sql.hudi.HoodieSparkSessionExtension") \
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.hudi.catalog.HoodieCatalog") \
    .getOrCreate()

# 示例数据
data = [
    (1, "Alice", "Engineering", 75000, "2024-01-15"),
    (2, "Bob", "Marketing", 65000, "2024-01-15"),
    (3, "Charlie", "Engineering", 80000, "2024-01-15")
]

df = spark.createDataFrame(data, ["id", "name", "department", "salary", "date"])

# 批量插入（无去重检查）
hudi_options = {
    "hoodie.table.name": "employees",
    "hoodie.datasource.write.table.type": "COPY_ON_WRITE",
    "hoodie.datasource.write.operation": "bulk_insert",
    "hoodie.datasource.write.recordkey.field": "id",
    "hoodie.datasource.write.partitionpath.field": "date",
    "hoodie.datasource.write.precombine.field": "id"
}

df.write.format("hudi") \
    .options(**hudi_options) \
    .mode("overwrite") \
    .save("/data/hudi/employees")
```

#### Upsert（默认）

插入新记录并更新已存在的记录：

```python
# 新增和更新数据
updates = [
    (1, "Alice", "Engineering", 78000, "2024-01-16"),  # 更新：薪资变更
    (4, "Diana", "Sales", 70000, "2024-01-16")         # 插入：新员工
]

df_updates = spark.createDataFrame(updates, ["id", "name", "department", "salary", "date"])

# Upsert 操作
hudi_options = {
    "hoodie.table.name": "employees",
    "hoodie.datasource.write.table.type": "COPY_ON_WRITE",
    "hoodie.datasource.write.operation": "upsert",
    "hoodie.datasource.write.recordkey.field": "id",
    "hoodie.datasource.write.partitionpath.field": "date",
    "hoodie.datasource.write.precombine.field": "salary",  # 较高薪资优先
    "hoodie.index.type": "BLOOM"
}

df_updates.write.format("hudi") \
    .options(**hudi_options) \
    .mode("append") \
    .save("/data/hudi/employees")
```

#### Delete（删除）

硬删除或软删除记录：

```python
# 硬删除
delete_df = spark.createDataFrame([(2,)], ["id"])

hudi_options = {
    "hoodie.table.name": "employees",
    "hoodie.datasource.write.operation": "delete",
    "hoodie.datasource.write.recordkey.field": "id",
    "hoodie.datasource.write.partitionpath.field": "date",
    "hoodie.datasource.write.precombine.field": "id"
}

delete_df.write.format("hudi") \
    .options(**hudi_options) \
    .mode("append") \
    .save("/data/hudi/employees")

# 软删除（标记为已删除）
from pyspark.sql.functions import lit

soft_delete_df = spark.createDataFrame([(3, "2024-01-15")], ["id", "date"]) \
    .withColumn("_hoodie_is_deleted", lit(True))

hudi_options["hoodie.datasource.write.operation"] = "upsert"

soft_delete_df.write.format("hudi") \
    .options(**hudi_options) \
    .mode("append") \
    .save("/data/hudi/employees")
```

#### Insert Overwrite（覆盖写入）

替换整个分区：

```python
# 覆盖特定分区
new_partition_data = spark.createDataFrame([
    (10, "Eve", "Engineering", 90000, "2024-01-15"),
    (11, "Frank", "Engineering", 85000, "2024-01-15")
], ["id", "name", "department", "salary", "date"])

hudi_options = {
    "hoodie.table.name": "employees",
    "hoodie.datasource.write.operation": "insert_overwrite",
    "hoodie.datasource.write.recordkey.field": "id",
    "hoodie.datasource.write.partitionpath.field": "date",
    "hoodie.datasource.write.precombine.field": "id"
}

new_partition_data.write.format("hudi") \
    .options(**hudi_options) \
    .mode("append") \
    .save("/data/hudi/employees")
```

### 查询类型

#### Snapshot Query（快照查询）

返回表的最新已提交状态：

```python
# 读取最新快照
df = spark.read.format("hudi").load("/data/hudi/employees")
df.show()

# SQL 查询
spark.sql("""
    SELECT * FROM hudi.`/data/hudi/employees`
    WHERE department = 'Engineering'
""").show()
```

#### Incremental Query（增量查询）

仅返回自指定提交时间以来变更的记录：

```python
# 获取自特定提交以来的变更
incremental_options = {
    "hoodie.datasource.query.type": "incremental",
    "hoodie.datasource.read.begin.instanttime": "20240115100000",
    "hoodie.datasource.read.end.instanttime": "20240116100000"  # 可选
}

incremental_df = spark.read.format("hudi") \
    .options(**incremental_options) \
    .load("/data/hudi/employees")

# 返回内容：
# - 开始时间之后的所有插入
# - 开始时间之后的所有更新
# - 包含 _hoodie_is_deleted 用于软删除

incremental_df.show()
```

#### Read Optimized Query（仅 MOR）

仅从基础文件读取数据，跳过日志文件：

```python
# 读取优化（仅 MOR 表）
read_optimized_df = spark.read.format("hudi") \
    .option("hoodie.datasource.query.type", "read_optimized") \
    .load("/data/hudi/employees_mor")

# 更快但可能不包含最近更新
```

#### Time Travel Query（时间旅行查询）

查询历史快照：

```python
# 查询特定提交
historical_df = spark.read.format("hudi") \
    .option("as.of.instant", "20240115100000") \
    .load("/data/hudi/employees")

# 按时间戳查询
from datetime import datetime
timestamp = datetime(2024, 1, 15, 10, 0, 0)

historical_df = spark.read.format("hudi") \
    .option("as.of.instant", timestamp.strftime("%Y%m%d%H%M%S")) \
    .load("/data/hudi/employees")
```

### Schema 演进

Hudi 支持灵活的 Schema 演进：

```python
# 添加新列
df_with_email = df.withColumn("email", lit(None).cast("string"))

hudi_options = {
    "hoodie.table.name": "employees",
    "hoodie.datasource.write.operation": "upsert",
    "hoodie.datasource.write.recordkey.field": "id",
    "hoodie.datasource.write.partitionpath.field": "date",
    "hoodie.datasource.write.precombine.field": "id",
    # 启用 schema 演进
    "hoodie.schema.on.read.enable": "true",
    "hoodie.datasource.write.reconcile.schema": "true"
}

df_with_email.write.format("hudi") \
    .options(**hudi_options) \
    .mode("append") \
    .save("/data/hudi/employees")

# SQL ALTER TABLE（Hudi 0.13+）
spark.sql("""
    ALTER TABLE employees ADD COLUMNS (
        phone STRING COMMENT '联系电话'
    )
""")

spark.sql("""
    ALTER TABLE employees ALTER COLUMN salary TYPE BIGINT
""")
```

## Compaction 和 Clustering

### Compaction（MOR 表）

Compaction 将日志文件合并到 MOR 表的基础文件中：

```python
# 内联 compaction（写入时执行）
hudi_options = {
    "hoodie.table.name": "events",
    "hoodie.datasource.write.table.type": "MERGE_ON_READ",
    "hoodie.compact.inline": "true",
    "hoodie.compact.inline.max.delta.commits": "5"
}

# 异步 compaction
hudi_options = {
    "hoodie.table.name": "events",
    "hoodie.datasource.write.table.type": "MERGE_ON_READ",
    "hoodie.compact.inline": "false",
    "hoodie.compact.schedule.inline": "true"  # 调度但不执行
}

# 单独运行 compaction
spark.sql("""
    CALL run_compaction(
        table => 'hudi.events',
        op => 'run',
        instants => '20240115100000'
    )
""")
```

**Compaction 策略：**

```python
# 策略：基于日志文件大小
hudi_options["hoodie.compaction.strategy"] = "org.apache.hudi.table.action.compact.strategy.LogFileSizeBasedCompactionStrategy"
hudi_options["hoodie.compaction.logfile.size.threshold"] = "104857600"  # 100MB

# 策略：基于增量提交数
hudi_options["hoodie.compaction.strategy"] = "org.apache.hudi.table.action.compact.strategy.BoundedIOCompactionStrategy"

# 策略：基于日期（压缩旧分区）
hudi_options["hoodie.compaction.strategy"] = "org.apache.hudi.table.action.compact.strategy.DayBasedCompactionStrategy"
hudi_options["hoodie.compaction.daybased.target.partitions"] = "7"
```

### Clustering

Clustering 重组数据布局以提高查询性能：

```python
# 启用内联 clustering
hudi_options = {
    "hoodie.table.name": "events",
    "hoodie.clustering.inline": "true",
    "hoodie.clustering.inline.max.commits": "4",
    "hoodie.clustering.plan.strategy.target.file.max.bytes": "1073741824",  # 1GB
    "hoodie.clustering.plan.strategy.small.file.limit": "629145600",  # 600MB

    # Clustering 执行策略
    "hoodie.clustering.execution.strategy.class":
        "org.apache.hudi.client.clustering.run.strategy.SparkSortAndSizeExecutionStrategy",

    # 排序列以获得更好的数据局部性
    "hoodie.clustering.plan.strategy.sort.columns": "user_id,event_time"
}

# Z-Order clustering 用于多维查询
hudi_options["hoodie.clustering.plan.strategy.sort.columns"] = "user_id,event_type"
hudi_options["hoodie.layout.optimize.enable"] = "true"
hudi_options["hoodie.layout.optimize.strategy"] = "z-order"

# 手动运行 clustering
spark.sql("""
    CALL run_clustering(
        table => 'hudi.events',
        predicate => 'date >= "2024-01-01"',
        order => 'user_id'
    )
""")
```

## Spark 集成

### Spark 配置

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("HudiApp") \
    .config("spark.serializer", "org.apache.spark.serializer.KryoSerializer") \
    .config("spark.sql.extensions", "org.apache.spark.sql.hudi.HoodieSparkSessionExtension") \
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.hudi.catalog.HoodieCatalog") \
    .config("spark.jars.packages", "org.apache.hudi:hudi-spark3.4-bundle_2.12:0.14.0") \
    .config("spark.sql.hive.convertMetastoreParquet", "false") \
    .getOrCreate()
```

### 使用 SQL 创建 Hudi 表

```sql
-- 创建 COW 表
CREATE TABLE hudi_cow_table (
    id BIGINT,
    name STRING,
    price DECIMAL(10, 2),
    ts TIMESTAMP,
    date STRING
) USING HUDI
PARTITIONED BY (date)
TBLPROPERTIES (
    type = 'cow',
    primaryKey = 'id',
    preCombineField = 'ts'
);

-- 创建 MOR 表
CREATE TABLE hudi_mor_table (
    id BIGINT,
    name STRING,
    price DECIMAL(10, 2),
    ts TIMESTAMP,
    date STRING
) USING HUDI
PARTITIONED BY (date)
TBLPROPERTIES (
    type = 'mor',
    primaryKey = 'id',
    preCombineField = 'ts',
    'hoodie.compact.inline' = 'true',
    'hoodie.compact.inline.max.delta.commits' = '5'
);

-- 插入数据
INSERT INTO hudi_cow_table
SELECT 1, 'Product A', 99.99, current_timestamp(), '2024-01-15';

-- 使用 MERGE 进行 Upsert
MERGE INTO hudi_cow_table AS target
USING updates AS source
ON target.id = source.id
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *;

-- 删除
DELETE FROM hudi_cow_table WHERE id = 1;

-- 时间旅行
SELECT * FROM hudi_cow_table TIMESTAMP AS OF '2024-01-15 10:00:00';
SELECT * FROM hudi_cow_table VERSION AS OF '20240115100000';
```

### 使用 Hudi 进行 Structured Streaming

```python
from pyspark.sql.functions import *

# 从 Kafka 流式写入 Hudi
kafka_df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "kafka:9092") \
    .option("subscribe", "events") \
    .option("startingOffsets", "latest") \
    .load()

# 解析 JSON 事件
events_df = kafka_df \
    .select(from_json(col("value").cast("string"), event_schema).alias("data")) \
    .select("data.*") \
    .withColumn("date", to_date("event_time"))

# 以流式方式写入 Hudi
hudi_options = {
    "hoodie.table.name": "streaming_events",
    "hoodie.datasource.write.table.type": "MERGE_ON_READ",
    "hoodie.datasource.write.operation": "upsert",
    "hoodie.datasource.write.recordkey.field": "event_id",
    "hoodie.datasource.write.partitionpath.field": "date",
    "hoodie.datasource.write.precombine.field": "event_time",

    # 流式特定配置
    "hoodie.datasource.write.streaming.retry.count": "3",
    "hoodie.datasource.write.streaming.retry.interval.ms": "2000",

    # 索引
    "hoodie.index.type": "BLOOM",
    "hoodie.bloom.index.update.partition.path": "true",

    # Compaction
    "hoodie.compact.inline": "true",
    "hoodie.compact.inline.max.delta.commits": "5"
}

query = events_df.writeStream \
    .format("hudi") \
    .options(**hudi_options) \
    .option("checkpointLocation", "/checkpoints/hudi_events") \
    .trigger(processingTime="1 minute") \
    .start("/data/hudi/streaming_events")

query.awaitTermination()
```

## Flink 集成

### Flink 配置

```java
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.table.api.bridge.java.StreamTableEnvironment;
import org.apache.flink.table.api.EnvironmentSettings;

StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
env.enableCheckpointing(60000);

EnvironmentSettings settings = EnvironmentSettings.newInstance()
    .inStreamingMode()
    .build();

StreamTableEnvironment tableEnv = StreamTableEnvironment.create(env, settings);
```

### 在 Flink 中创建 Hudi 表

```sql
-- 使用 Flink 创建 Hudi 表
CREATE TABLE hudi_flink_table (
    id BIGINT PRIMARY KEY NOT ENFORCED,
    name STRING,
    price DECIMAL(10, 2),
    ts TIMESTAMP(3),
    `date` STRING
) PARTITIONED BY (`date`)
WITH (
    'connector' = 'hudi',
    'path' = 's3://bucket/hudi/flink_table',
    'table.type' = 'MERGE_ON_READ',

    -- 写入选项
    'write.operation' = 'upsert',
    'write.precombine.field' = 'ts',
    'write.tasks' = '4',
    'write.bucket_assign.tasks' = '4',

    -- Compaction
    'compaction.async.enabled' = 'true',
    'compaction.trigger.strategy' = 'num_commits',
    'compaction.delta_commits' = '5',

    -- 索引
    'index.type' = 'BUCKET',
    'hoodie.bucket.index.num.buckets' = '4'
);

-- 从 Kafka 流式写入 Hudi
CREATE TABLE kafka_source (
    id BIGINT,
    name STRING,
    price DECIMAL(10, 2),
    ts TIMESTAMP(3),
    WATERMARK FOR ts AS ts - INTERVAL '5' SECOND
) WITH (
    'connector' = 'kafka',
    'topic' = 'products',
    'properties.bootstrap.servers' = 'kafka:9092',
    'format' = 'json',
    'scan.startup.mode' = 'latest-offset'
);

-- 插入流式数据
INSERT INTO hudi_flink_table
SELECT
    id,
    name,
    price,
    ts,
    DATE_FORMAT(ts, 'yyyy-MM-dd') as `date`
FROM kafka_source;
```

### Flink CDC 到 Hudi

```sql
-- MySQL CDC 源
CREATE TABLE mysql_cdc_source (
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

-- 带 CDC 模式的 Hudi sink
CREATE TABLE hudi_users (
    id BIGINT PRIMARY KEY NOT ENFORCED,
    name STRING,
    email STRING,
    updated_at TIMESTAMP(3),
    `date` STRING
) PARTITIONED BY (`date`)
WITH (
    'connector' = 'hudi',
    'path' = 's3://bucket/hudi/users',
    'table.type' = 'MERGE_ON_READ',
    'write.operation' = 'upsert',
    'write.precombine.field' = 'updated_at',
    'changelog.enabled' = 'true'
);

-- 复制 CDC 变更
INSERT INTO hudi_users
SELECT
    id,
    name,
    email,
    updated_at,
    DATE_FORMAT(updated_at, 'yyyy-MM-dd') as `date`
FROM mysql_cdc_source;
```

## DeltaStreamer：CDC 和增量 ETL

### DeltaStreamer 概述

DeltaStreamer 是 Hudi 的实用工具，用于从各种数据源持续摄取：

```bash
# 基本 DeltaStreamer 命令
spark-submit \
  --class org.apache.hudi.utilities.deltastreamer.HoodieDeltaStreamer \
  hudi-utilities-bundle.jar \
  --props /path/to/deltastreamer.properties \
  --table-type MERGE_ON_READ \
  --target-base-path s3://bucket/hudi/events \
  --target-table events \
  --source-class org.apache.hudi.utilities.sources.JsonKafkaSource \
  --schemaprovider-class org.apache.hudi.utilities.schema.SchemaRegistryProvider \
  --op UPSERT \
  --continuous
```

### DeltaStreamer 配置

```properties
# deltastreamer.properties

# 数据源配置（Kafka）
hoodie.deltastreamer.source.kafka.topic=events
hoodie.deltastreamer.source.kafka.value.deserializer.class=io.confluent.kafka.serializers.KafkaAvroDeserializer
bootstrap.servers=kafka:9092
auto.offset.reset=earliest
schema.registry.url=http://schema-registry:8081

# 目标表
hoodie.datasource.write.recordkey.field=event_id
hoodie.datasource.write.partitionpath.field=date
hoodie.datasource.write.precombine.field=event_time

# 索引
hoodie.index.type=BLOOM
hoodie.bloom.index.parallelism=100

# Compaction
hoodie.compact.inline=false
hoodie.compact.inline.max.delta.commits=5
hoodie.compaction.async.enabled=true

# 清理
hoodie.clean.automatic=true
hoodie.cleaner.commits.retained=10
hoodie.cleaner.policy=KEEP_LATEST_COMMITS

# Clustering
hoodie.clustering.inline=false
hoodie.clustering.schedule.inline=true
hoodie.clustering.async.enabled=true
```

### DeltaStreamer 与 Debezium CDC

```properties
# Debezium CDC 配置
hoodie.deltastreamer.source.class=org.apache.hudi.utilities.sources.debezium.MysqlDebeziumSource

# MySQL Debezium 设置
hoodie.deltastreamer.source.debezium.database.hostname=mysql
hoodie.deltastreamer.source.debezium.database.port=3306
hoodie.deltastreamer.source.debezium.database.user=debezium
hoodie.deltastreamer.source.debezium.database.password=password
hoodie.deltastreamer.source.debezium.database.dbname=production
hoodie.deltastreamer.source.debezium.database.tablename=orders

# Schema 提供者
hoodie.deltastreamer.schemaprovider.class=org.apache.hudi.utilities.schema.DebeziumSchemaRegistryProvider
hoodie.deltastreamer.schemaprovider.registry.url=http://schema-registry:8081

# CDC 特定配置
hoodie.datasource.write.operation=upsert
hoodie.datasource.write.payload.class=org.apache.hudi.common.model.debezium.MySqlDebeziumAvroPayload
```

### 增量 ETL 管道

```python
# 增量 ETL：Bronze -> Silver -> Gold

# 步骤 1：Bronze - 原始数据摄取
bronze_options = {
    "hoodie.table.name": "bronze_events",
    "hoodie.datasource.write.table.type": "MERGE_ON_READ",
    "hoodie.datasource.write.operation": "upsert",
    "hoodie.datasource.write.recordkey.field": "event_id",
    "hoodie.datasource.write.partitionpath.field": "date",
    "hoodie.datasource.write.precombine.field": "event_time"
}

# 步骤 2：Silver - 从 Bronze 增量读取，清洗，写入
def bronze_to_silver(spark, last_commit):
    # 从 bronze 增量读取
    bronze_incremental = spark.read.format("hudi") \
        .option("hoodie.datasource.query.type", "incremental") \
        .option("hoodie.datasource.read.begin.instanttime", last_commit) \
        .load("/data/hudi/bronze_events")

    # 数据清洗
    silver_df = bronze_incremental \
        .filter("event_id IS NOT NULL") \
        .filter("event_time IS NOT NULL") \
        .dropDuplicates(["event_id"]) \
        .withColumn("processed_time", current_timestamp())

    # 写入 silver
    silver_options = {
        "hoodie.table.name": "silver_events",
        "hoodie.datasource.write.table.type": "COPY_ON_WRITE",
        "hoodie.datasource.write.operation": "upsert",
        "hoodie.datasource.write.recordkey.field": "event_id",
        "hoodie.datasource.write.partitionpath.field": "date",
        "hoodie.datasource.write.precombine.field": "processed_time"
    }

    silver_df.write.format("hudi") \
        .options(**silver_options) \
        .mode("append") \
        .save("/data/hudi/silver_events")

# 步骤 3：Gold - 增量聚合
def silver_to_gold(spark, last_commit):
    # 从 silver 增量读取
    silver_incremental = spark.read.format("hudi") \
        .option("hoodie.datasource.query.type", "incremental") \
        .option("hoodie.datasource.read.begin.instanttime", last_commit) \
        .load("/data/hudi/silver_events")

    # 聚合
    gold_df = silver_incremental \
        .groupBy("date", "event_type") \
        .agg(
            count("*").alias("event_count"),
            countDistinct("user_id").alias("unique_users")
        )

    # 与现有 gold 表合并
    gold_df.write.format("hudi") \
        .option("hoodie.table.name", "gold_metrics") \
        .option("hoodie.datasource.write.operation", "upsert") \
        .option("hoodie.datasource.write.recordkey.field", "date,event_type") \
        .option("hoodie.datasource.write.precombine.field", "event_count") \
        .mode("append") \
        .save("/data/hudi/gold_metrics")

# 获取最后提交时间
def get_last_commit(spark, table_path):
    timeline = spark.read.format("hudi") \
        .load(table_path) \
        .select("_hoodie_commit_time") \
        .orderBy(col("_hoodie_commit_time").desc()) \
        .first()
    return timeline["_hoodie_commit_time"] if timeline else "0"
```

## 最佳实践

### 表类型选择

| 场景 | 推荐类型 | 原因 |
|------|----------|------|
| 读多写少、低频更新 | COW | 最佳读取性能 |
| 写多读少、频繁更新 | MOR | 更低写入延迟 |
| 流式摄取 | MOR | 亚分钟级延迟 |
| 批量 ETL | COW | 更简单，无需 compaction |
| CDC 工作负载 | MOR | 高效变更捕获 |
| 小表（<1GB）| COW | MOR 开销不值得 |
| 大表有更新 | MOR | 更好的写入效率 |

### 索引策略

```python
# Bloom Index：大多数工作负载的默认选择
bloom_options = {
    "hoodie.index.type": "BLOOM",
    "hoodie.bloom.index.filter.dynamic.max.entries": "100000",
    "hoodie.index.bloom.num.entries": "60000",
    "hoodie.index.bloom.fpp": "0.000000001",
    "hoodie.bloom.index.parallelism": "100"
}

# Bucket Index：可预测的文件位置
bucket_options = {
    "hoodie.index.type": "BUCKET",
    "hoodie.bucket.index.num.buckets": "256",
    "hoodie.bucket.index.hash.field": "user_id"
}

# Record Index：大表全局查找
record_options = {
    "hoodie.index.type": "RECORD_INDEX",
    "hoodie.metadata.enable": "true",
    "hoodie.metadata.index.column.stats.enable": "true"
}

# HBase Index：超大表、高更新率
hbase_options = {
    "hoodie.index.type": "HBASE",
    "hoodie.index.hbase.zkquorum": "zk1:2181,zk2:2181",
    "hoodie.hbase.index.update.partition.path": "true"
}
```

### Compaction 调优

```python
# 内联 compaction 用于一致的读取性能
inline_compaction = {
    "hoodie.compact.inline": "true",
    "hoodie.compact.inline.max.delta.commits": "5",
    "hoodie.compaction.lazy.block.read": "true",
    "hoodie.compaction.reverse.log.read": "true"
}

# 异步 compaction 用于写密集型工作负载
async_compaction = {
    "hoodie.compact.inline": "false",
    "hoodie.compact.schedule.inline": "true",
    "hoodie.compaction.async.enabled": "true",
    "hoodie.compact.inline.max.delta.commits": "10"
}

# Compaction 调度策略
# 基于时间：压缩超过 N 天的分区
# 基于大小：当日志文件超过阈值时压缩
# 基于提交：在 N 次增量提交后压缩
```

### 分区策略

```python
# 基于日期分区（最常见）
hudi_options = {
    "hoodie.datasource.write.partitionpath.field": "date",
    "hoodie.datasource.write.keygenerator.class":
        "org.apache.hudi.keygen.SimpleKeyGenerator"
}

# 多级分区
hudi_options = {
    "hoodie.datasource.write.partitionpath.field": "region,date",
    "hoodie.datasource.write.keygenerator.class":
        "org.apache.hudi.keygen.ComplexKeyGenerator"
}

# 自定义分区格式
hudi_options = {
    "hoodie.datasource.write.partitionpath.field": "ts",
    "hoodie.datasource.write.keygenerator.class":
        "org.apache.hudi.keygen.TimestampBasedKeyGenerator",
    "hoodie.deltastreamer.keygen.timebased.timestamp.type": "EPOCHMILLISECONDS",
    "hoodie.deltastreamer.keygen.timebased.output.dateformat": "yyyy/MM/dd"
}

# 非分区表（用于小型查找表）
hudi_options = {
    "hoodie.datasource.write.partitionpath.field": "",
    "hoodie.datasource.write.keygenerator.class":
        "org.apache.hudi.keygen.NonpartitionedKeyGenerator"
}
```

## 常见陷阱

### 小文件问题

**问题：** 过多小文件会降低查询性能。

```python
# 诊断：检查文件大小
spark.sql("""
    SELECT
        _hoodie_partition_path,
        COUNT(*) as num_files,
        AVG(input_file_size()) as avg_size_mb
    FROM hudi.events
    GROUP BY _hoodie_partition_path
    ORDER BY num_files DESC
""").show()

# 解决方案 1：配置目标文件大小
hudi_options = {
    "hoodie.parquet.max.file.size": "134217728",  # 128MB
    "hoodie.parquet.small.file.limit": "104857600",  # 100MB
    "hoodie.copyonwrite.insert.split.size": "100000"
}

# 解决方案 2：启用 clustering
hudi_options = {
    "hoodie.clustering.inline": "true",
    "hoodie.clustering.inline.max.commits": "4",
    "hoodie.clustering.plan.strategy.target.file.max.bytes": "134217728",
    "hoodie.clustering.plan.strategy.small.file.limit": "104857600"
}

# 解决方案 3：初始加载使用 bulk_insert
hudi_options["hoodie.datasource.write.operation"] = "bulk_insert"
hudi_options["hoodie.bulkinsert.shuffle.parallelism"] = "100"
```

### Compaction 延迟

**问题：** MOR 表读取因累积的日志文件而变慢。

```python
# 诊断：检查待处理的 compaction
spark.sql("CALL show_compaction(table => 'events')").show()

# 检查日志文件大小
spark.read.format("hudi").load("/data/hudi/events") \
    .select("_hoodie_file_name") \
    .distinct() \
    .filter(col("_hoodie_file_name").contains(".log")) \
    .count()

# 解决方案 1：降低 compaction 触发阈值
hudi_options = {
    "hoodie.compact.inline.max.delta.commits": "3",  # 更频繁压缩
    "hoodie.compaction.strategy":
        "org.apache.hudi.table.action.compact.strategy.LogFileSizeBasedCompactionStrategy",
    "hoodie.compaction.logfile.size.threshold": "52428800"  # 50MB
}

# 解决方案 2：使用更多资源运行异步 compaction
# 使用更多 executor 运行 HoodieCompactor

# 解决方案 3：在低峰期调度 compaction
# 使用外部调度器（Airflow 等）触发 compaction
```

### 写入冲突

**问题：** 并发写入因冲突而失败。

```python
# 诊断：检查失败的提交
spark.sql("""
    SELECT * FROM hudi.events.commits
    WHERE state = 'FAILED'
    ORDER BY instant_time DESC
    LIMIT 10
""").show()

# 解决方案 1：启用多写入者（Hudi 0.12+）
hudi_options = {
    "hoodie.write.concurrency.mode": "optimistic_concurrency_control",
    "hoodie.cleaner.policy.failed.writes": "LAZY",
    "hoodie.write.lock.provider": "org.apache.hudi.client.transaction.lock.ZookeeperBasedLockProvider",
    "hoodie.write.lock.zookeeper.url": "zk1:2181,zk2:2181",
    "hoodie.write.lock.zookeeper.base_path": "/hudi/locks"
}

# 解决方案 2：单写入者使用基于文件的锁
hudi_options = {
    "hoodie.write.lock.provider": "org.apache.hudi.client.transaction.lock.FileSystemBasedLockProvider"
}

# 解决方案 3：按写入者分区写入
# 每个写入者写入不同分区
```

### 索引性能问题

**问题：** Bloom index 假阳性导致全表扫描。

```python
# 诊断：检查索引查找统计
# 在 spark.conf 中启用指标

# 解决方案 1：调优布隆过滤器参数
hudi_options = {
    "hoodie.index.bloom.fpp": "0.0000001",  # 更低的假阳性率
    "hoodie.index.bloom.num.entries": "100000",  # 更多条目
    "hoodie.bloom.index.filter.dynamic.max.entries": "200000"
}

# 解决方案 2：对高基数键使用 bucket index
hudi_options = {
    "hoodie.index.type": "BUCKET",
    "hoodie.bucket.index.num.buckets": "512"
}

# 解决方案 3：对全局查找使用记录级索引
hudi_options = {
    "hoodie.index.type": "RECORD_INDEX",
    "hoodie.metadata.enable": "true"
}
```

## 性能考量

### 写入优化

```python
# 并行度调优
hudi_options = {
    "hoodie.insert.shuffle.parallelism": "200",
    "hoodie.upsert.shuffle.parallelism": "200",
    "hoodie.bulkinsert.shuffle.parallelism": "200",
    "hoodie.bloom.index.parallelism": "200"
}

# 内存配置
spark.conf.set("spark.executor.memory", "8g")
spark.conf.set("spark.driver.memory", "4g")
spark.conf.set("spark.memory.fraction", "0.6")
spark.conf.set("spark.memory.storageFraction", "0.5")

# 高效序列化
spark.conf.set("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
spark.conf.set("spark.kryo.registrationRequired", "false")

# 批量加载时禁用不必要的功能
bulk_load_options = {
    "hoodie.datasource.write.operation": "bulk_insert",
    "hoodie.bulkinsert.sort.mode": "PARTITION_SORT",
    "hoodie.metadata.enable": "false",  # 禁用元数据表
    "hoodie.clean.automatic": "false"   # 禁用自动清理
}
```

### 读取优化

```python
# 谓词下推
# 确保过滤器被下推到 Hudi
df = spark.read.format("hudi").load("/data/hudi/events") \
    .filter("date >= '2024-01-01'") \
    .filter("event_type = 'purchase'")

# 列裁剪
df = spark.read.format("hudi").load("/data/hudi/events") \
    .select("event_id", "user_id", "amount")

# 当新鲜度不重要时使用读取优化查询
mor_read_optimized = spark.read.format("hudi") \
    .option("hoodie.datasource.query.type", "read_optimized") \
    .load("/data/hudi/mor_events")

# 元数据表加速列表
hudi_options = {
    "hoodie.metadata.enable": "true",
    "hoodie.metadata.index.column.stats.enable": "true"
}

# 文件列表优化
spark.conf.set("hoodie.metadata.enable", "true")
spark.conf.set("hoodie.file.listing.parallelism", "200")
```

### 资源配置

```python
# Hudi 的 Spark 资源设置
spark = SparkSession.builder \
    .config("spark.executor.instances", "50") \
    .config("spark.executor.cores", "4") \
    .config("spark.executor.memory", "16g") \
    .config("spark.driver.memory", "8g") \
    .config("spark.default.parallelism", "200") \
    .config("spark.sql.shuffle.partitions", "200") \
    .config("spark.dynamicAllocation.enabled", "true") \
    .config("spark.dynamicAllocation.minExecutors", "10") \
    .config("spark.dynamicAllocation.maxExecutors", "100") \
    .getOrCreate()

# AWS S3 优化
spark.conf.set("spark.hadoop.fs.s3a.connection.maximum", "100")
spark.conf.set("spark.hadoop.fs.s3a.threads.max", "64")
spark.conf.set("spark.hadoop.fs.s3a.experimental.input.fadvise", "random")
```

## 实战场景

### 实时数据湖

```python
# 架构：Kafka -> Flink/Spark Streaming -> Hudi -> 查询引擎

# Spark Streaming 到 Hudi MOR
from pyspark.sql.streaming import StreamingQuery

def process_streaming_events():
    # 从 Kafka 读取
    kafka_df = spark.readStream \
        .format("kafka") \
        .option("kafka.bootstrap.servers", "kafka:9092") \
        .option("subscribe", "events") \
        .option("startingOffsets", "latest") \
        .load()

    # 解析和转换
    events_df = kafka_df \
        .select(from_json(col("value").cast("string"), schema).alias("event")) \
        .select("event.*") \
        .withColumn("date", to_date("event_time"))

    # 使用微批写入 Hudi
    hudi_options = {
        "hoodie.table.name": "realtime_events",
        "hoodie.datasource.write.table.type": "MERGE_ON_READ",
        "hoodie.datasource.write.operation": "upsert",
        "hoodie.datasource.write.recordkey.field": "event_id",
        "hoodie.datasource.write.partitionpath.field": "date",
        "hoodie.datasource.write.precombine.field": "event_time",

        # 近实时设置
        "hoodie.index.type": "BLOOM",
        "hoodie.compact.inline": "true",
        "hoodie.compact.inline.max.delta.commits": "3",
        "hoodie.clean.automatic": "true",
        "hoodie.cleaner.commits.retained": "5"
    }

    query = events_df.writeStream \
        .format("hudi") \
        .options(**hudi_options) \
        .option("checkpointLocation", "/checkpoints/realtime_events") \
        .trigger(processingTime="30 seconds") \
        .start("/data/hudi/realtime_events")

    return query
```

### 使用 Debezium 的 CDC 管道

```python
# 完整 CDC 管道：MySQL -> Debezium -> Kafka -> Hudi

# CDC 的 DeltaStreamer 配置
"""
# cdc-deltastreamer.properties

# 带 Debezium 格式的 Kafka 源
hoodie.deltastreamer.source.class=org.apache.hudi.utilities.sources.AvroKafkaSource
hoodie.deltastreamer.source.kafka.topic=dbserver1.inventory.orders
hoodie.deltastreamer.source.kafka.value.deserializer.class=io.confluent.kafka.serializers.KafkaAvroDeserializer
bootstrap.servers=kafka:9092
schema.registry.url=http://schema-registry:8081

# CDC payload
hoodie.datasource.write.payload.class=org.apache.hudi.common.model.debezium.MySqlDebeziumAvroPayload

# 目标表
hoodie.datasource.write.recordkey.field=id
hoodie.datasource.write.partitionpath.field=__source_ts_ms
hoodie.datasource.write.precombine.field=__source_ts_ms

# 处理 CDC 删除
hoodie.datasource.write.operation=upsert
hoodie.merge.allow.duplicate.on.inserts=false

# MOR 用于低延迟更新
hoodie.datasource.write.table.type=MERGE_ON_READ
hoodie.compact.inline=true
hoodie.compact.inline.max.delta.commits=5
"""

# DeltaStreamer 的 Python 包装器
import subprocess

def run_deltastreamer_cdc():
    cmd = """
    spark-submit \
        --class org.apache.hudi.utilities.deltastreamer.HoodieDeltaStreamer \
        --master yarn \
        --deploy-mode cluster \
        --num-executors 10 \
        --executor-memory 4g \
        hudi-utilities-bundle.jar \
        --props /config/cdc-deltastreamer.properties \
        --table-type MERGE_ON_READ \
        --target-base-path s3://bucket/hudi/orders \
        --target-table orders \
        --op UPSERT \
        --enable-sync \
        --continuous
    """
    subprocess.run(cmd, shell=True)
```

### 增量数据处理

```python
# 增量物化视图模式

class IncrementalMaterializedView:
    def __init__(self, spark, source_path, target_path, table_name):
        self.spark = spark
        self.source_path = source_path
        self.target_path = target_path
        self.table_name = table_name
        self.checkpoint_path = f"/checkpoints/{table_name}"

    def get_last_checkpoint(self):
        """获取最后处理的提交时间。"""
        try:
            return self.spark.read.text(f"{self.checkpoint_path}/last_commit") \
                .first()[0]
        except:
            return "0"

    def save_checkpoint(self, commit_time):
        """保存最后处理的提交时间。"""
        self.spark.createDataFrame([(commit_time,)], ["commit"]) \
            .write.mode("overwrite").text(f"{self.checkpoint_path}/last_commit")

    def process_incremental(self, transform_func):
        """处理增量变更。"""
        last_commit = self.get_last_checkpoint()

        # 读取增量变更
        source_df = self.spark.read.format("hudi") \
            .option("hoodie.datasource.query.type", "incremental") \
            .option("hoodie.datasource.read.begin.instanttime", last_commit) \
            .load(self.source_path)

        if source_df.count() == 0:
            print("没有新数据需要处理")
            return

        # 获取最大提交时间用于检查点
        max_commit = source_df.agg({"_hoodie_commit_time": "max"}).collect()[0][0]

        # 应用转换
        result_df = transform_func(source_df)

        # 写入目标
        hudi_options = {
            "hoodie.table.name": self.table_name,
            "hoodie.datasource.write.operation": "upsert",
            "hoodie.datasource.write.recordkey.field": "key",
            "hoodie.datasource.write.precombine.field": "updated_at"
        }

        result_df.write.format("hudi") \
            .options(**hudi_options) \
            .mode("append") \
            .save(self.target_path)

        # 保存检查点
        self.save_checkpoint(max_commit)

        print(f"处理了 {source_df.count()} 条记录，截至 {max_commit}")

# 使用示例
def aggregate_orders(df):
    return df.groupBy("customer_id", "date") \
        .agg(
            sum("amount").alias("total_amount"),
            count("*").alias("order_count"),
            max("_hoodie_commit_time").alias("updated_at")
        ) \
        .withColumn("key", concat_ws("_", col("customer_id"), col("date")))

mv = IncrementalMaterializedView(
    spark,
    "/data/hudi/orders",
    "/data/hudi/customer_daily_orders",
    "customer_daily_orders"
)

mv.process_incremental(aggregate_orders)
```

## 面试要点

### 概念问题

**问：Hudi 与 Iceberg 和 Delta Lake 有什么不同？**

答：主要区别：
1. **增量处理**：一等支持增量查询，允许高效地仅处理变更数据
2. **表类型**：两种不同的表类型（COW/MOR）针对不同工作负载优化，而其他格式只有单一格式
3. **索引**：多种索引类型（Bloom、Bucket、HBase、记录级），对 upsert 性能至关重要
4. **CDC 原生**：内置支持 CDC payload（Debezium）、软删除和变更追踪
5. **DeltaStreamer**：开箱即用的生产级流式摄取工具
6. **写入延迟**：MOR 表可实现亚分钟级延迟

**问：什么时候应该选择 MOR 而不是 COW？**

答：选择 MOR 当：
1. 高写入频率（每小时每分区 >10 次写入）
2. 写入延迟至关重要（需要亚分钟级）
3. 从 Kafka/Kinesis 流式摄取
4. 更新影响小比例记录
5. 可以容忍略高的读取延迟

选择 COW 当：
1. 读取性能是首要考虑
2. 批量更新（每日/每小时）
3. 更新影响大比例记录
4. 更简单的操作（无需 compaction）
5. 小表，重写成本可接受

### 架构问题

**问：解释 Hudi 的 Timeline 如何工作。**

答：Timeline 将所有操作追踪为一系列 instant：

1. **结构**：每个 instant 有 `<timestamp>.<action>.<state>`
2. **操作类型**：COMMIT、DELTACOMMIT、COMPACTION、CLUSTERING、CLEAN、ROLLBACK
3. **状态**：REQUESTED -> INFLIGHT -> COMPLETED
4. **存储**：在 `.hoodie/` 目录中作为 JSON/Avro 文件
5. **目的**：
   - 提供操作的全序
   - 支持时间旅行和回滚
   - 通过过滤提交时间支持增量查询
   - 通过 instant 锁定管理并发

**问：Hudi 如何处理并发写入？**

答：Hudi 使用乐观并发控制（OCC）：

1. **文件级锁定**：在被修改的文件组上获取锁
2. **Instant 排序**：Timeline 确保提交的全序
3. **冲突检测**：在提交时检查文件是否被并发事务修改
4. **解决方案**：失败的提交触发带有新文件列表的重试
5. **多写入者模式**：可选的基于 ZooKeeper 或文件系统的分布式锁，用于真正的多写入者场景

### 实践问题

**问：如何使用 Hudi 设计 CDC 管道？**

答：完整的 CDC 架构：

1. **源捕获**：Debezium 捕获 MySQL binlog 变更
2. **消息队列**：Kafka 持有 CDC 事件，带 Schema Registry
3. **摄取**：DeltaStreamer 或 Flink 持续从 Kafka 读取
4. **Hudi 存储**：MOR 表，使用适当的 CDC payload 类
5. **配置**：
   - 使用 `MySqlDebeziumAvroPayload` 正确处理操作
   - 启用软删除以传播删除
   - 配置 compaction 以维护读取性能
6. **查询层**：Trino/Presto 用于分析，作为 Hive 外部表暴露

**问：如何处理 Hudi 中的小文件？**

答：多管齐下的方法：

1. **预防**：
   - 配置适当的 `hoodie.parquet.max.file.size`
   - 初始加载使用 `bulk_insert`
   - 调优 `hoodie.copyonwrite.insert.split.size`

2. **Clustering**：
   - 启用内联或异步 clustering
   - 配置目标文件大小
   - 按常查询列排序

3. **Compaction**（MOR）：
   - 调优 compaction 频率
   - 使用基于大小的策略
   - 在低峰期运行异步 compaction

4. **监控**：
   - 追踪文件数量和大小
   - 小文件累积时告警
   - 定期维护作业

## 延伸阅读

### 官方资源

- [Apache Hudi 文档](https://hudi.apache.org/docs/overview)
- [Hudi GitHub 仓库](https://github.com/apache/hudi)
- [Hudi RFC 文档](https://github.com/apache/hudi/tree/master/rfc)

### 集成指南

- [Spark 集成](https://hudi.apache.org/docs/spark_quick-start-guide)
- [Flink 集成](https://hudi.apache.org/docs/flink-quick-start-guide)
- [Presto/Trino 集成](https://hudi.apache.org/docs/querying_data#presto)
- [DeltaStreamer 指南](https://hudi.apache.org/docs/hoodie_deltastreamer)

### 社区资源

- [Hudi Slack 频道](https://join.slack.com/t/apache-hudi/shared_invite/zt-2ggm1fub8-_yt4Reu9djwqqVRFC7X49g)
- [Apache Hudi 博客](https://hudi.apache.org/blog)
- [Hudi YouTube 频道](https://www.youtube.com/channel/UC5JY4mCGnZpZ9M8XMULYBdA)
- [Onehouse 博客](https://www.onehouse.ai/blog) - Hudi 创始人创建的公司

### 相关技术

- [Apache Spark](https://spark.apache.org/docs/latest/)
- [Apache Flink](https://flink.apache.org/docs/)
- [Debezium](https://debezium.io/documentation/)
- [Apache Kafka](https://kafka.apache.org/documentation/)
- [Apache Iceberg](https://iceberg.apache.org/docs/latest/)
- [Delta Lake](https://delta.io/learn/documentation/)

### 书籍和课程

- "Apache Hudi: The Definitive Guide"（O'Reilly，即将出版）
- [Building a Lakehouse with Apache Hudi](https://www.oreilly.com/library/view/building-a-lakehouse/9781098143664/)
- Onehouse Academy 的 Hudi 课程

通过掌握 Apache Hudi 的架构和能力，你可以构建高效的流式数据管道和实时数据湖，以最小的延迟处理高频更新。灵活的表类型、强大的索引和原生 CDC 支持的结合，使 Hudi 成为增量数据处理工作负载的理想选择，特别是在数据新鲜度和写入效率至关重要的场景中。
