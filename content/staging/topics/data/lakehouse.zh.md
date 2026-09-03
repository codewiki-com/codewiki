---
title: 湖仓一体架构
description: 湖仓一体架构完全指南 - 融合数据湖与数据仓库的最佳实践
track: data
section: data-engineering
difficulty: advanced
tags:
  - 湖仓一体
  - 数据湖
  - 数据仓库
  - Delta Lake
  - Apache Iceberg
  - Databricks
status: imported
origin: old/src/content/docs/data/lakehouse.zh.md
divergence: 0.212
issues:
  - missing-subcategory-en
  - missing-subcategory-zh
legacy:
  category: Data
  subcategory: ""
  order: 7
  lastUpdated: 2026-01-21
---

湖仓一体架构代表了数据管理领域的范式转变，它将数据湖和数据仓库的最佳特性统一到单一、协调的平台中。通过结合数据湖的低成本存储和灵活性与数据仓库的数据管理能力和性能，湖仓一体使组织能够构建现代数据平台，从单一数据源为分析、数据科学和机器学习工作负载提供服务。

## 理解湖仓一体架构

### 什么是湖仓一体？

湖仓一体是一种现代数据架构，结合了数据湖和数据仓库的关键优势。它将所有数据以开放格式存储在低成本对象存储上，同时提供传统上仅在数据仓库中才有的数据管理功能，如 ACID 事务、Schema 强制和治理能力。

**核心价值主张：**

- **单一数据源**：所有数据位于同一位置，消除数据孤岛和冗余
- **成本效益**：使用低成本对象存储（S3、ADLS、GCS）而非专有格式
- **开放标准**：基于开放文件格式（Parquet、ORC）和表格式（Delta Lake、Apache Iceberg、Apache Hudi）构建
- **统一分析**：从相同数据支持 BI、数据科学和机器学习
- **ACID 事务**：通过完整的事务保证确保数据可靠性
- **Schema 强制**：通过严格的 Schema 验证防止数据损坏

### 从数据湖和数据仓库的演进

```
历史演进：

1990-2000年代：数据仓库时代
+------------------+
|    数据仓库      |  - 仅支持结构化数据
|    (昂贵)        |  - ACID 事务
|                  |  - 基于 SQL 的分析
+------------------+  - 高存储成本

2010年代：数据湖时代
+------------------+
|    数据湖        |  - 所有数据类型（结构化、半结构化、非结构化）
|    (便宜)        |  - 无事务（可靠性问题）
|                  |  - 读取时定义 Schema
+------------------+  - "数据沼泽"问题

2020年代：湖仓一体时代
+------------------+
|   Lakehouse      |  - 两全其美
|  (成本 + 能力)   |  - 数据湖存储上的 ACID
|                  |  - Schema 强制 + 灵活性
+------------------+  - 统一分析平台
```

### 双层架构问题

在湖仓一体出现之前，组织通常需要维护独立的系统：

```
传统双层架构：

                    +-----------+     +-----------+
原始数据 --------->|   数据湖   |---->|    ETL    |
(所有格式)         |           |     |   管道    |
                   +-----------+     +-----------+
                        |                  |
                        v                  v
                   +-----------+     +-----------+
                   |    ML/    |     |   数据    |---> BI/报表
                   |  数据科学  |     |   仓库    |
                   +-----------+     +-----------+

问题：
1. 数据重复（2倍存储成本）
2. 数据陈旧（ETL 延迟）
3. 数据不一致（不同版本）
4. 复杂管道（多次跳转）
5. 治理挑战（多个系统）
```

### 湖仓一体架构概览

```
湖仓一体架构：

+------------------------------------------------------------------+
|                       Lakehouse 平台                              |
|  +------------------------------------------------------------+  |
|  |                       访问层                                |  |
|  |   SQL 引擎 | DataFrame API | ML 框架 | BI 工具              |  |
|  +------------------------------------------------------------+  |
|  +------------------------------------------------------------+  |
|  |                       治理层                                |  |
|  |   访问控制 | 审计 | 血缘 | 数据质量                         |  |
|  +------------------------------------------------------------+  |
|  +------------------------------------------------------------+  |
|  |                      元数据层                               |  |
|  |   目录 | Schema | 统计信息 | 事务日志                       |  |
|  +------------------------------------------------------------+  |
|  +------------------------------------------------------------+  |
|  |                    开放表格式                               |  |
|  |   Delta Lake | Apache Iceberg | Apache Hudi                |  |
|  +------------------------------------------------------------+  |
|  +------------------------------------------------------------+  |
|  |                       存储层                                |  |
|  |   Parquet/ORC 文件存储在对象存储上（S3/ADLS/GCS）            |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
```

## 核心原理

### 数据湖上的 ACID 事务

湖仓一体通过创新使用事务日志和元数据管理实现 ACID（原子性、一致性、隔离性、持久性）事务：

```python
from delta.tables import DeltaTable
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("LakehouseACID") \
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
    .getOrCreate()

# 原子性：所有操作要么全部成功，要么全部失败
# 此写入要么完全提交，要么完全回滚
df = spark.createDataFrame([
    (1, "Alice", 50000),
    (2, "Bob", 60000),
    (3, "Charlie", 55000)
], ["id", "name", "salary"])

df.write.format("delta") \
    .mode("overwrite") \
    .save("/lakehouse/employees")

# 一致性：约束确保数据有效性
spark.sql("""
    ALTER TABLE delta.`/lakehouse/employees`
    ADD CONSTRAINT salary_positive CHECK (salary > 0)
""")

# 隔离性：并发事务互不干扰
# 读取者看到一致的快照，而写入者修改数据
delta_table = DeltaTable.forPath(spark, "/lakehouse/employees")

# 持久性：已提交的事务在故障后仍然存在
# 事务日志确保可恢复性
delta_table.update(
    condition="name = 'Alice'",
    set={"salary": "salary * 1.1"}
)
```

**事务日志机制：**

```
事务日志结构：

/lakehouse/employees/
├── _delta_log/                          # 事务日志
│   ├── 00000000000000000000.json       # 初始提交
│   │   └── {add: [file1.parquet]}
│   ├── 00000000000000000001.json       # 更新提交
│   │   └── {remove: [file1], add: [file2]}
│   ├── 00000000000000000002.json       # 另一次更新
│   └── 00000000000000000010.checkpoint.parquet
├── part-00000-...snappy.parquet        # 数据文件
└── part-00001-...snappy.parquet

每次提交都是原子的：
1. 写入新数据文件
2. 原子性地将提交 JSON 写入日志
3. 如果步骤2失败，步骤1的文件成为孤儿文件（由 VACUUM 清理）
```

### Schema 强制与演进

湖仓一体提供严格的 Schema 强制，同时支持受控的 Schema 演进：

```python
from pyspark.sql.types import *

# 定义显式 Schema
employee_schema = StructType([
    StructField("id", LongType(), nullable=False),
    StructField("name", StringType(), nullable=False),
    StructField("department", StringType(), nullable=True),
    StructField("salary", DecimalType(10, 2), nullable=True),
    StructField("hire_date", DateType(), nullable=True)
])

# Schema 强制阻止错误数据
try:
    bad_data = spark.createDataFrame([
        (1, "Alice", "HR", "not_a_number", "2024-01-01")  # 错误类型
    ], ["id", "name", "department", "salary", "hire_date"])

    bad_data.write.format("delta") \
        .mode("append") \
        .save("/lakehouse/employees")
except Exception as e:
    print(f"Schema 强制阻止了错误数据: {e}")

# Schema 演进（添加列）
# 可以安全地添加新的可空列
updated_df = spark.createDataFrame([
    (4, "Diana", "Sales", 65000.00, "2024-06-01", "diana@company.com")
], ["id", "name", "department", "salary", "hire_date", "email"])

updated_df.write.format("delta") \
    .mode("append") \
    .option("mergeSchema", "true") \
    .save("/lakehouse/employees")

# 查看演进后的 Schema
spark.read.format("delta").load("/lakehouse/employees").printSchema()
```

### 统一存储层

湖仓一体将所有数据统一在单一存储层上：

```python
# 所有数据类型在一个 Lakehouse 中
# 结构化数据
structured_df = spark.read.format("csv") \
    .option("header", "true") \
    .load("/raw/transactions.csv")

structured_df.write.format("delta") \
    .mode("overwrite") \
    .save("/lakehouse/bronze/transactions")

# 半结构化数据（JSON）
semi_structured_df = spark.read.format("json") \
    .load("/raw/events/*.json")

semi_structured_df.write.format("delta") \
    .mode("append") \
    .save("/lakehouse/bronze/events")

# 非结构化数据引用
# 存储元数据和路径，用专门的工具处理
unstructured_catalog = spark.createDataFrame([
    ("img_001.jpg", "s3://raw/images/img_001.jpg", "image/jpeg", 1024000),
    ("doc_001.pdf", "s3://raw/documents/doc_001.pdf", "application/pdf", 2048000)
], ["file_name", "path", "content_type", "size_bytes"])

unstructured_catalog.write.format("delta") \
    .mode("overwrite") \
    .save("/lakehouse/bronze/unstructured_files")
```

### 元数据层

元数据层提供类似传统数据仓库的目录功能：

```python
# Unity Catalog（Databricks）或 Hive Metastore
# 三级命名空间：catalog.schema.table

spark.sql("CREATE CATALOG IF NOT EXISTS enterprise")
spark.sql("CREATE SCHEMA IF NOT EXISTS enterprise.sales")

spark.sql("""
    CREATE TABLE enterprise.sales.orders (
        order_id BIGINT,
        customer_id BIGINT,
        order_date DATE,
        total_amount DECIMAL(10, 2),
        status STRING
    )
    USING DELTA
    PARTITIONED BY (order_date)
    LOCATION '/lakehouse/gold/orders'
    TBLPROPERTIES (
        'delta.autoOptimize.optimizeWrite' = 'true',
        'delta.autoOptimize.autoCompact' = 'true'
    )
""")

# 丰富的元数据查询
spark.sql("DESCRIBE EXTENDED enterprise.sales.orders").show(truncate=False)
spark.sql("SHOW TABLE PROPERTIES enterprise.sales.orders").show(truncate=False)

# 收集统计信息用于查询优化
spark.sql("ANALYZE TABLE enterprise.sales.orders COMPUTE STATISTICS FOR ALL COLUMNS")
```

## 核心组件

### 开放表格式

湖仓一体依赖开放表格式为数据湖存储添加数据管理能力：

**Delta Lake：**

```python
# Delta Lake - Databricks 创建的原始 Lakehouse 表格式
from delta.tables import DeltaTable

# 创建 Delta 表
df.write.format("delta") \
    .partitionBy("date") \
    .save("/lakehouse/events")

# 核心功能
delta_table = DeltaTable.forPath(spark, "/lakehouse/events")

# 时间旅行
spark.read.format("delta") \
    .option("versionAsOf", 5) \
    .load("/lakehouse/events")

# MERGE（更新插入）
delta_table.alias("target").merge(
    updates_df.alias("source"),
    "target.id = source.id"
).whenMatchedUpdateAll() \
 .whenNotMatchedInsertAll() \
 .execute()

# Z-ORDER 优化
delta_table.optimize().executeZOrderBy("user_id", "timestamp")

# Change Data Feed（变更数据馈送）
spark.read.format("delta") \
    .option("readChangeFeed", "true") \
    .option("startingVersion", 10) \
    .load("/lakehouse/events")
```

**Apache Iceberg：**

```python
# Apache Iceberg - 用于大型分析表的开放表格式
spark = SparkSession.builder \
    .config("spark.sql.catalog.iceberg", "org.apache.iceberg.spark.SparkCatalog") \
    .config("spark.sql.catalog.iceberg.type", "hadoop") \
    .config("spark.sql.catalog.iceberg.warehouse", "/lakehouse/iceberg") \
    .getOrCreate()

# 创建 Iceberg 表
spark.sql("""
    CREATE TABLE iceberg.db.events (
        id BIGINT,
        event_type STRING,
        timestamp TIMESTAMP,
        user_id STRING,
        properties MAP<STRING, STRING>
    )
    USING ICEBERG
    PARTITIONED BY (days(timestamp))
""")

# 隐藏分区 - 查询时无需指定分区
spark.sql("""
    SELECT * FROM iceberg.db.events
    WHERE timestamp >= '2024-01-01'  -- 自动分区裁剪
""")

# 时间旅行
spark.sql("SELECT * FROM iceberg.db.events VERSION AS OF 123456789")
spark.sql("SELECT * FROM iceberg.db.events TIMESTAMP AS OF '2024-01-15 10:00:00'")

# Schema 演进
spark.sql("ALTER TABLE iceberg.db.events ADD COLUMNS (session_id STRING)")
spark.sql("ALTER TABLE iceberg.db.events RENAME COLUMN properties TO metadata")

# 分区演进 - 无需重写数据即可更改分区
spark.sql("ALTER TABLE iceberg.db.events ADD PARTITION FIELD hours(timestamp)")
```

**Apache Hudi：**

```python
# Apache Hudi - 流式数据湖平台
# 使用 Hudi 写入
df.write.format("hudi") \
    .option("hoodie.table.name", "events") \
    .option("hoodie.datasource.write.recordkey.field", "id") \
    .option("hoodie.datasource.write.precombine.field", "timestamp") \
    .option("hoodie.datasource.write.operation", "upsert") \
    .option("hoodie.datasource.write.table.type", "COPY_ON_WRITE") \
    .mode("append") \
    .save("/lakehouse/hudi/events")

# 增量查询 - 仅读取新增/变更数据
spark.read.format("hudi") \
    .option("hoodie.datasource.query.type", "incremental") \
    .option("hoodie.datasource.read.begin.instanttime", "20240115100000") \
    .load("/lakehouse/hudi/events")

# 时间点查询
spark.read.format("hudi") \
    .option("as.of.instant", "20240115100000") \
    .load("/lakehouse/hudi/events")
```

### 查询引擎

湖仓一体支持多种查询引擎以适应不同用例：

```python
# Spark SQL - 大规模处理的主要引擎
spark.sql("""
    SELECT
        date_trunc('day', event_timestamp) as event_date,
        event_type,
        COUNT(*) as event_count,
        COUNT(DISTINCT user_id) as unique_users
    FROM delta.`/lakehouse/events`
    WHERE event_timestamp >= '2024-01-01'
    GROUP BY 1, 2
    ORDER BY event_date, event_count DESC
""")

# Presto/Trino - 快速交互式查询
# presto-cli --catalog delta --schema lakehouse
"""
SELECT
    d.department_name,
    SUM(o.total_amount) as total_sales
FROM delta.lakehouse.orders o
JOIN delta.lakehouse.departments d ON o.department_id = d.id
WHERE o.order_date >= DATE '2024-01-01'
GROUP BY d.department_name
ORDER BY total_sales DESC
LIMIT 10;
"""

# Databricks SQL - 无服务器 SQL 仓库
# 直接 SQL 访问 Lakehouse 表，支持自动扩缩容
"""
SELECT * FROM enterprise.sales.daily_metrics
WHERE metric_date = CURRENT_DATE - 1
"""

# DuckDB - 嵌入式分析
import duckdb

conn = duckdb.connect()
conn.execute("INSTALL delta; LOAD delta;")
result = conn.execute("""
    SELECT * FROM delta_scan('/lakehouse/events')
    WHERE event_type = 'purchase'
    LIMIT 1000
""").fetchdf()
```

### 存储层

对象存储为湖仓一体架构提供基础：

```python
# 配置存储访问
spark = SparkSession.builder \
    .config("spark.hadoop.fs.s3a.access.key", "ACCESS_KEY") \
    .config("spark.hadoop.fs.s3a.secret.key", "SECRET_KEY") \
    .config("spark.hadoop.fs.s3a.endpoint", "s3.amazonaws.com") \
    .getOrCreate()

# AWS S3
s3_path = "s3a://my-lakehouse/data/"

# Azure Data Lake Storage Gen2
adls_path = "abfss://container@storageaccount.dfs.core.windows.net/lakehouse/"

# Google Cloud Storage
gcs_path = "gs://my-lakehouse/data/"

# 存储组织最佳实践
"""
/lakehouse/
├── bronze/                    # 原始摄入数据
│   ├── events/
│   ├── transactions/
│   └── users/
├── silver/                    # 清洗、规范化数据
│   ├── events_cleaned/
│   ├── transactions_validated/
│   └── users_deduplicated/
├── gold/                      # 业务级聚合
│   ├── daily_metrics/
│   ├── customer_360/
│   └── revenue_summary/
└── _checkpoints/              # 流处理检查点
"""
```

### 治理层

数据治理对企业级湖仓一体部署至关重要：

```python
# Unity Catalog 治理（Databricks）
# 访问控制
spark.sql("""
    GRANT SELECT ON TABLE enterprise.sales.orders
    TO `data-analysts@company.com`
""")

spark.sql("""
    GRANT ALL PRIVILEGES ON SCHEMA enterprise.sales
    TO `data-engineers@company.com`
""")

# 列级安全
spark.sql("""
    ALTER TABLE enterprise.hr.employees
    ALTER COLUMN salary SET MASK mask_salary
""")

# 行级安全
spark.sql("""
    ALTER TABLE enterprise.sales.orders
    SET ROW FILTER region_filter ON (region)
""")

# 数据血缘追踪
# Unity Catalog 表自动捕获血缘
spark.sql("DESCRIBE HISTORY enterprise.sales.orders")

# 数据质量监控
spark.sql("""
    ALTER TABLE enterprise.sales.orders
    ADD CONSTRAINT valid_amount CHECK (total_amount >= 0)
""")

# 审计日志
# 所有访问和修改都会被记录
spark.sql("""
    SELECT * FROM system.access.audit
    WHERE table_name = 'orders'
    AND action_time >= '2024-01-01'
""")
```

## 代码示例

### Databricks/Delta Lake 实现

```python
# 使用 Databricks 和 Delta Lake 的完整湖仓一体管道
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from delta.tables import DeltaTable

spark = SparkSession.builder \
    .appName("LakehousePipeline") \
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
    .getOrCreate()

# Bronze 层：原始摄入
def ingest_to_bronze(source_path: str, bronze_path: str):
    """以最小转换将原始数据摄入到 Bronze 层。"""
    raw_df = spark.read.format("json") \
        .option("inferSchema", "true") \
        .load(source_path)

    # 添加摄入元数据
    bronze_df = raw_df \
        .withColumn("_ingestion_timestamp", current_timestamp()) \
        .withColumn("_source_file", input_file_name()) \
        .withColumn("_ingestion_date", current_date())

    # 追加到 Bronze 表，支持 Schema 合并
    bronze_df.write.format("delta") \
        .mode("append") \
        .option("mergeSchema", "true") \
        .partitionBy("_ingestion_date") \
        .save(bronze_path)

    return bronze_df.count()

# Silver 层：数据清洗和验证
def process_to_silver(bronze_path: str, silver_path: str):
    """清洗和验证数据到 Silver 层。"""
    # 读取 Bronze 数据（基于水位线增量读取）
    bronze_df = spark.read.format("delta").load(bronze_path)

    # 数据质量转换
    silver_df = bronze_df \
        .filter(col("id").isNotNull()) \
        .filter(col("event_timestamp").isNotNull()) \
        .dropDuplicates(["id", "event_timestamp"]) \
        .withColumn("event_date", to_date("event_timestamp")) \
        .withColumn("event_hour", hour("event_timestamp")) \
        .withColumn("is_valid",
            when(col("amount") > 0, True).otherwise(False))

    # 合并到 Silver 表
    if DeltaTable.isDeltaTable(spark, silver_path):
        delta_table = DeltaTable.forPath(spark, silver_path)

        delta_table.alias("target").merge(
            silver_df.alias("source"),
            "target.id = source.id AND target.event_timestamp = source.event_timestamp"
        ).whenMatchedUpdate(
            condition="source._ingestion_timestamp > target._ingestion_timestamp",
            set={
                "amount": "source.amount",
                "status": "source.status",
                "_ingestion_timestamp": "source._ingestion_timestamp"
            }
        ).whenNotMatchedInsertAll() \
         .execute()
    else:
        silver_df.write.format("delta") \
            .mode("overwrite") \
            .partitionBy("event_date") \
            .save(silver_path)

# Gold 层：业务聚合
def aggregate_to_gold(silver_path: str, gold_path: str):
    """为 Gold 层创建业务级聚合。"""
    silver_df = spark.read.format("delta").load(silver_path)

    # 每日指标
    daily_metrics = silver_df \
        .filter("is_valid = true") \
        .groupBy("event_date", "event_type") \
        .agg(
            count("*").alias("event_count"),
            countDistinct("user_id").alias("unique_users"),
            sum("amount").alias("total_amount"),
            avg("amount").alias("avg_amount"),
            percentile_approx("amount", 0.5).alias("median_amount")
        )

    # 写入 Gold 层
    daily_metrics.write.format("delta") \
        .mode("overwrite") \
        .partitionBy("event_date") \
        .save(gold_path)

    # 优化 Gold 表以提升查询性能
    delta_table = DeltaTable.forPath(spark, gold_path)
    delta_table.optimize().executeZOrderBy("event_type")

# 运行管道
bronze_records = ingest_to_bronze(
    "/raw/events/*.json",
    "/lakehouse/bronze/events"
)
print(f"已摄入 {bronze_records} 条记录到 Bronze")

process_to_silver(
    "/lakehouse/bronze/events",
    "/lakehouse/silver/events"
)
print("已处理 Silver 层")

aggregate_to_gold(
    "/lakehouse/silver/events",
    "/lakehouse/gold/daily_metrics"
)
print("已聚合 Gold 层")
```

### 多引擎访问模式

```python
# 相同的湖仓一体数据可从多个引擎访问

# 1. Spark 用于批处理
spark_df = spark.read.format("delta").load("/lakehouse/silver/events")
spark_result = spark_df.groupBy("event_type").count()

# 2. Spark Streaming 用于实时处理
stream_df = spark.readStream \
    .format("delta") \
    .load("/lakehouse/bronze/events")

stream_query = stream_df \
    .groupBy(window("event_timestamp", "5 minutes"), "event_type") \
    .count() \
    .writeStream \
    .format("delta") \
    .outputMode("complete") \
    .option("checkpointLocation", "/lakehouse/_checkpoints/events_agg") \
    .start("/lakehouse/silver/events_5min")

# 3. 通过 Databricks SQL 或 Spark SQL 进行 SQL 查询
spark.sql("""
    SELECT
        event_type,
        COUNT(*) as total_events,
        COUNT(DISTINCT user_id) as unique_users
    FROM delta.`/lakehouse/silver/events`
    WHERE event_date >= CURRENT_DATE - 7
    GROUP BY event_type
    ORDER BY total_events DESC
""").show()

# 4. Pandas 用于数据科学
# 使用 Spark 到 Pandas 转换
pandas_df = spark.read.format("delta") \
    .load("/lakehouse/gold/daily_metrics") \
    .filter("event_date >= '2024-01-01'") \
    .toPandas()

# 或使用 databricks-sql-connector 等连接器
from databricks import sql

with sql.connect(
    server_hostname="your-workspace.cloud.databricks.com",
    http_path="/sql/1.0/warehouses/your-warehouse-id",
    access_token="your-token"
) as connection:
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT * FROM enterprise.gold.daily_metrics
            WHERE event_date >= '2024-01-01'
        """)
        result = cursor.fetchall_arrow().to_pandas()

# 5. BI 工具（Tableau、Power BI）
# 通过 JDBC/ODBC 连接到 Databricks SQL 端点
# 或使用 Unity Catalog 的原生连接器
```

### 流式 Lakehouse 模式

```python
# 实时数据摄入到湖仓一体
from pyspark.sql.functions import *
from pyspark.sql.types import *

# 定义流数据 Schema
event_schema = StructType([
    StructField("event_id", StringType(), False),
    StructField("event_type", StringType(), False),
    StructField("user_id", StringType(), True),
    StructField("timestamp", TimestampType(), False),
    StructField("properties", MapType(StringType(), StringType()), True)
])

# 从 Kafka 读取
kafka_df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "events") \
    .option("startingOffsets", "latest") \
    .load()

# 解析和转换
parsed_df = kafka_df \
    .select(from_json(col("value").cast("string"), event_schema).alias("data")) \
    .select("data.*") \
    .withColumn("event_date", to_date("timestamp")) \
    .withColumn("processing_time", current_timestamp())

# 写入 Bronze（仅追加，原始数据）
bronze_query = parsed_df.writeStream \
    .format("delta") \
    .outputMode("append") \
    .option("checkpointLocation", "/lakehouse/_checkpoints/bronze_events") \
    .partitionBy("event_date") \
    .trigger(processingTime="1 minute") \
    .start("/lakehouse/bronze/events_stream")

# 流式 Silver：去重和增强
silver_stream = spark.readStream \
    .format("delta") \
    .option("ignoreChanges", "true") \
    .load("/lakehouse/bronze/events_stream")

# 在水位线内去重
deduplicated = silver_stream \
    .withWatermark("timestamp", "1 hour") \
    .dropDuplicates(["event_id"])

# 使用 merge 写入 Silver
def merge_to_silver(batch_df, batch_id):
    """将批次合并到 Silver 表。"""
    if batch_df.count() > 0:
        silver_table = DeltaTable.forPath(spark, "/lakehouse/silver/events_stream")

        silver_table.alias("target").merge(
            batch_df.alias("source"),
            "target.event_id = source.event_id"
        ).whenMatchedUpdate(
            condition="source.timestamp > target.timestamp",
            set={"*": "source.*"}
        ).whenNotMatchedInsertAll() \
         .execute()

silver_query = deduplicated.writeStream \
    .foreachBatch(merge_to_silver) \
    .option("checkpointLocation", "/lakehouse/_checkpoints/silver_events") \
    .trigger(processingTime="5 minutes") \
    .start()

# 流式 Gold：实时聚合
gold_stream = spark.readStream \
    .format("delta") \
    .load("/lakehouse/silver/events_stream")

# 5分钟窗口聚合
windowed_agg = gold_stream \
    .withWatermark("timestamp", "10 minutes") \
    .groupBy(
        window("timestamp", "5 minutes"),
        "event_type"
    ).agg(
        count("*").alias("event_count"),
        countDistinct("user_id").alias("unique_users")
    )

gold_query = windowed_agg.writeStream \
    .format("delta") \
    .outputMode("complete") \
    .option("checkpointLocation", "/lakehouse/_checkpoints/gold_5min") \
    .trigger(processingTime="5 minutes") \
    .start("/lakehouse/gold/events_5min")
```

## 最佳实践

### 奖章架构（Bronze/Silver/Gold）

```python
# 完整的奖章架构实现

class MedallionPipeline:
    """实现 Bronze-Silver-Gold 奖章架构。"""

    def __init__(self, spark, base_path: str):
        self.spark = spark
        self.base_path = base_path
        self.bronze_path = f"{base_path}/bronze"
        self.silver_path = f"{base_path}/silver"
        self.gold_path = f"{base_path}/gold"

    # BRONZE 层
    # 目的：原始数据落地区
    # 特性：仅追加，最小转换，完整历史
    def ingest_bronze(self, source_df, table_name: str):
        """将原始数据摄入到 Bronze 层。"""
        bronze_df = source_df \
            .withColumn("_bronze_timestamp", current_timestamp()) \
            .withColumn("_source_system", lit("source_system_name")) \
            .withColumn("_bronze_date", current_date())

        bronze_df.write.format("delta") \
            .mode("append") \
            .option("mergeSchema", "true") \
            .partitionBy("_bronze_date") \
            .save(f"{self.bronze_path}/{table_name}")

        return bronze_df.count()

    # SILVER 层
    # 目的：清洗、验证、去重的数据
    # 特性：规范化数据模型，业务键，类型修正
    def process_silver(self, table_name: str,
                       business_key: list,
                       quality_rules: dict):
        """使用质量规则从 Bronze 处理数据到 Silver。"""
        bronze_df = self.spark.read.format("delta") \
            .load(f"{self.bronze_path}/{table_name}")

        # 应用质量规则
        silver_df = bronze_df
        for column, rules in quality_rules.items():
            if "not_null" in rules:
                silver_df = silver_df.filter(col(column).isNotNull())
            if "positive" in rules:
                silver_df = silver_df.filter(col(column) > 0)
            if "enum" in rules:
                silver_df = silver_df.filter(col(column).isin(rules["enum"]))

        # 基于业务键去重
        silver_df = silver_df.dropDuplicates(business_key)

        # 添加 Silver 元数据
        silver_df = silver_df \
            .withColumn("_silver_timestamp", current_timestamp()) \
            .withColumn("_is_valid", lit(True))

        # 合并到 Silver 表
        silver_path = f"{self.silver_path}/{table_name}"

        if DeltaTable.isDeltaTable(self.spark, silver_path):
            merge_condition = " AND ".join([
                f"target.{k} = source.{k}" for k in business_key
            ])

            DeltaTable.forPath(self.spark, silver_path) \
                .alias("target").merge(
                    silver_df.alias("source"),
                    merge_condition
                ).whenMatchedUpdateAll() \
                 .whenNotMatchedInsertAll() \
                 .execute()
        else:
            silver_df.write.format("delta") \
                .mode("overwrite") \
                .save(silver_path)

    # GOLD 层
    # 目的：业务级聚合和指标
    # 特性：反规范化，针对分析优化，仪表板就绪
    def aggregate_gold(self, silver_tables: list,
                       gold_table: str,
                       aggregation_query: str):
        """从 Silver 表创建 Gold 聚合。"""
        # 将 Silver 表注册为临时视图
        for table in silver_tables:
            self.spark.read.format("delta") \
                .load(f"{self.silver_path}/{table}") \
                .createOrReplaceTempView(table)

        # 执行聚合
        gold_df = self.spark.sql(aggregation_query)

        # 写入 Gold
        gold_df.write.format("delta") \
            .mode("overwrite") \
            .save(f"{self.gold_path}/{gold_table}")

        # 优化查询性能
        DeltaTable.forPath(self.spark, f"{self.gold_path}/{gold_table}") \
            .optimize().executeCompaction()

# 使用示例
pipeline = MedallionPipeline(spark, "/lakehouse")

# Bronze 摄入
raw_events = spark.read.json("/raw/events/*.json")
pipeline.ingest_bronze(raw_events, "events")

# Silver 处理与质量规则
pipeline.process_silver(
    "events",
    business_key=["event_id"],
    quality_rules={
        "event_id": ["not_null"],
        "amount": ["positive"],
        "event_type": {"enum": ["click", "view", "purchase"]}
    }
)

# Gold 聚合
pipeline.aggregate_gold(
    silver_tables=["events"],
    gold_table="daily_event_summary",
    aggregation_query="""
        SELECT
            date_trunc('day', event_timestamp) as event_date,
            event_type,
            COUNT(*) as event_count,
            SUM(amount) as total_amount,
            COUNT(DISTINCT user_id) as unique_users
        FROM events
        GROUP BY 1, 2
    """
)
```

### 数据质量实现

```python
from pyspark.sql.functions import *
from dataclasses import dataclass
from typing import List, Dict, Any

@dataclass
class QualityCheck:
    name: str
    column: str
    check_type: str  # null, unique, range, regex, custom
    params: Dict[str, Any]

class LakehouseQuality:
    """湖仓一体的数据质量框架。"""

    def __init__(self, spark):
        self.spark = spark
        self.results = []

    def run_checks(self, df, checks: List[QualityCheck]) -> bool:
        """运行所有质量检查并返回通过/失败结果。"""
        total_rows = df.count()
        all_passed = True

        for check in checks:
            if check.check_type == "null":
                failed = df.filter(col(check.column).isNull()).count()
                passed = failed == 0

            elif check.check_type == "unique":
                distinct = df.select(check.column).distinct().count()
                passed = distinct == total_rows
                failed = total_rows - distinct

            elif check.check_type == "range":
                min_val = check.params.get("min")
                max_val = check.params.get("max")
                failed = df.filter(
                    (col(check.column) < min_val) |
                    (col(check.column) > max_val)
                ).count()
                passed = failed == 0

            elif check.check_type == "regex":
                pattern = check.params["pattern"]
                failed = df.filter(
                    ~col(check.column).rlike(pattern)
                ).count()
                passed = failed == 0

            elif check.check_type == "referential":
                ref_table = check.params["ref_table"]
                ref_column = check.params["ref_column"]
                ref_df = self.spark.read.format("delta").load(ref_table)

                failed = df.join(
                    ref_df,
                    df[check.column] == ref_df[ref_column],
                    "left_anti"
                ).count()
                passed = failed == 0

            result = {
                "check_name": check.name,
                "column": check.column,
                "check_type": check.check_type,
                "total_rows": total_rows,
                "failed_rows": failed,
                "pass_rate": (total_rows - failed) / total_rows if total_rows > 0 else 1.0,
                "passed": passed
            }
            self.results.append(result)

            if not passed:
                all_passed = False
                print(f"失败: {check.name} - {failed}/{total_rows} 行失败")
            else:
                print(f"通过: {check.name}")

        return all_passed

    def get_results_df(self):
        """将结果作为 DataFrame 返回以便持久化。"""
        return self.spark.createDataFrame(self.results)

    def save_results(self, path: str):
        """将质量结果保存到湖仓一体。"""
        results_df = self.get_results_df() \
            .withColumn("run_timestamp", current_timestamp())

        results_df.write.format("delta") \
            .mode("append") \
            .save(path)

# 使用示例
quality = LakehouseQuality(spark)

events_df = spark.read.format("delta").load("/lakehouse/silver/events")

checks = [
    QualityCheck("event_id_not_null", "event_id", "null", {}),
    QualityCheck("event_id_unique", "event_id", "unique", {}),
    QualityCheck("amount_positive", "amount", "range", {"min": 0, "max": 1000000}),
    QualityCheck("email_format", "email", "regex", {"pattern": r"^[\w\.-]+@[\w\.-]+\.\w+$"}),
    QualityCheck("user_exists", "user_id", "referential", {
        "ref_table": "/lakehouse/silver/users",
        "ref_column": "id"
    })
]

passed = quality.run_checks(events_df, checks)
quality.save_results("/lakehouse/monitoring/quality_results")

if not passed:
    raise Exception("数据质量检查失败！")
```

### 成本优化策略

```python
# 湖仓一体成本优化技术

# 1. 高效分区策略
# 避免过度分区（产生大量小文件）
# 目标：每个分区 1GB+

# 错误：分区粒度太细
df.write.partitionBy("year", "month", "day", "hour")  # 每年 8760 个分区

# 正确：平衡的分区
df.write.partitionBy("event_date")  # 每年 365 个分区

# 2. 文件压缩和优化
delta_table = DeltaTable.forPath(spark, "/lakehouse/events")

# 压缩小文件
delta_table.optimize().executeCompaction()

# 针对常见查询模式进行 Z-Order
delta_table.optimize().executeZOrderBy("user_id", "event_type")

# 自动优化设置
spark.sql("""
    ALTER TABLE delta.`/lakehouse/events`
    SET TBLPROPERTIES (
        'delta.autoOptimize.optimizeWrite' = 'true',
        'delta.autoOptimize.autoCompact' = 'true',
        'delta.targetFileSize' = '134217728'
    )
""")

# 3. 生命周期管理
# 设置保留策略
spark.sql("""
    ALTER TABLE delta.`/lakehouse/bronze/events`
    SET TBLPROPERTIES (
        'delta.logRetentionDuration' = 'interval 30 days',
        'delta.deletedFileRetentionDuration' = 'interval 7 days'
    )
""")

# 定期 VACUUM 回收存储空间
delta_table.vacuum(168)  # 保留 7 天历史

# 4. 分层存储（云提供商）
# 将冷数据移动到更便宜的存储类别
# AWS: S3 智能分层或 Glacier
# Azure: Cool 或 Archive 层
# GCP: Nearline 或 Coldline

# 5. 查询优化
# 使用谓词下推
spark.sql("SELECT * FROM events WHERE event_date = '2024-01-15'")  # 正确

# 避免全表扫描
spark.sql("SELECT * FROM events WHERE YEAR(event_date) = 2024")  # 错误

# 只选择需要的列
spark.sql("SELECT event_id, event_type FROM events")  # 正确
spark.sql("SELECT * FROM events")  # 错误

# 6. 计算资源适配
# 使用合适的集群大小
# 对于可变工作负载考虑无服务器
# 对非关键任务使用 Spot 实例
```

## 常见陷阱

### 过度工程化架构

```python
# 陷阱：过度复杂的分层结构
# 不要创建不必要的中间层

# 错误：层数太多
"""
raw -> landing -> staging -> bronze -> silver_raw -> silver_clean ->
silver_conform -> gold_intermediate -> gold_final -> presentation
"""

# 正确：标准奖章架构
"""
raw -> bronze -> silver -> gold
"""

# 陷阱：过早优化
# 在了解查询模式之前不要优化

# 错误：立即 Z-Order 所有内容
delta_table.optimize().executeZOrderBy(
    "col1", "col2", "col3", "col4", "col5"
)

# 正确：先分析查询模式，然后优化
# 检查查询历史
spark.sql("""
    SELECT
        query_text,
        COUNT(*) as execution_count
    FROM system.query.history
    WHERE table_name = 'events'
    GROUP BY query_text
    ORDER BY execution_count DESC
""")

# 然后基于实际使用情况优化
delta_table.optimize().executeZOrderBy("user_id")  # 最常过滤的列
```

### 忽略治理

```python
# 陷阱：没有访问控制
# 错误：所有人都可以访问所有内容
spark.sql("GRANT ALL PRIVILEGES ON CATALOG enterprise TO `all-users`")

# 正确：最小权限原则
spark.sql("""
    -- 分析师只能读取 Gold 层
    GRANT SELECT ON SCHEMA enterprise.gold TO `analysts`;

    -- 数据工程师可以修改 Silver 和 Gold
    GRANT ALL PRIVILEGES ON SCHEMA enterprise.silver TO `data-engineers`;
    GRANT ALL PRIVILEGES ON SCHEMA enterprise.gold TO `data-engineers`;

    -- 只有管理员可以访问 Bronze（原始数据）
    GRANT ALL PRIVILEGES ON SCHEMA enterprise.bronze TO `data-admins`;
""")

# 陷阱：没有数据分类
# 正确：对敏感数据进行分类
spark.sql("""
    ALTER TABLE enterprise.gold.customers
    SET TAGS ('pii' = 'true', 'data_owner' = 'customer-team')
""")

# 陷阱：没有血缘追踪
# 正确：使用 Unity Catalog 或类似工具进行自动血缘追踪
# 或实现手动血缘追踪
lineage_df = spark.createDataFrame([
    ("gold.daily_metrics", "silver.events", "aggregation", "2024-01-15"),
    ("silver.events", "bronze.events", "cleaning", "2024-01-15")
], ["target_table", "source_table", "operation", "run_date"])

lineage_df.write.format("delta") \
    .mode("append") \
    .save("/lakehouse/metadata/lineage")
```

### 表格式选择错误

```python
# 陷阱：为用例选择错误的表格式

# Delta Lake：最适合
# - Databricks 生态系统
# - 大量 MERGE/UPDATE 工作负载
# - 流批一体

# Apache Iceberg：最适合
# - 多引擎访问（Spark、Trino、Flink）
# - 需要分区演进
# - 超大表（PB 级）

# Apache Hudi：最适合
# - 记录级更新/删除
# - 近实时摄入
# - CDC（变更数据捕获）工作负载

# 陷阱：混用格式没有策略
# 错误：随机选择格式
"""
events/ (Delta)
users/ (Iceberg)
transactions/ (Hudi)
"""

# 正确：一致的格式选择与清晰的理由
"""
所有表使用 Delta Lake：
- Databricks 原生集成
- 流批一体
- 团队熟悉度

例外：大型归档表使用 Iceberg：
- 更好的分区演进
- 多引擎读取访问
"""
```

## 性能考量

### 查询优化策略

```python
# 1. 分区裁剪
# 确保查询首先过滤分区列

# 正确：先过滤分区
spark.sql("""
    SELECT * FROM events
    WHERE event_date = '2024-01-15'  -- 分区列
      AND event_type = 'purchase'
""")

# 错误：函数阻止分区裁剪
spark.sql("""
    SELECT * FROM events
    WHERE YEAR(event_date) = 2024  -- 无分区裁剪！
""")

# 2. 使用 Z-Order 进行数据跳过
# 针对常见过滤模式优化

# 分析查询模式
frequent_filters = ["user_id", "event_type", "product_id"]

# 对最具选择性的列进行 Z-Order
delta_table.optimize().executeZOrderBy("user_id", "event_type")

# 3. 收集统计信息
spark.sql("ANALYZE TABLE events COMPUTE STATISTICS FOR ALL COLUMNS")

# 4. 对小表使用广播连接
from pyspark.sql.functions import broadcast

# 小维度表（< 10MB）
dim_products = spark.read.format("delta").load("/lakehouse/gold/dim_products")

# 大事实表
fact_sales = spark.read.format("delta").load("/lakehouse/gold/fact_sales")

# 广播小表
result = fact_sales.join(
    broadcast(dim_products),
    fact_sales.product_id == dim_products.product_id
)

# 5. 对重复访问使用缓存
events_df = spark.read.format("delta") \
    .load("/lakehouse/silver/events") \
    .filter("event_date >= '2024-01-01'") \
    .cache()

# 物化缓存
events_df.count()

# 对缓存数据执行多个操作
events_df.groupBy("event_type").count().show()
events_df.groupBy("user_id").agg(sum("amount")).show()

events_df.unpersist()  # 完成后释放
```

### 数据布局优化

```python
# 1. 最优文件大小
# 目标：每文件 128MB - 1GB

# 检查当前文件大小
spark.sql("""
    DESCRIBE DETAIL delta.`/lakehouse/events`
""").select("numFiles", "sizeInBytes").show()

# 计算平均文件大小
detail = spark.sql("DESCRIBE DETAIL delta.`/lakehouse/events`").collect()[0]
avg_file_size_mb = (detail["sizeInBytes"] / detail["numFiles"]) / (1024 * 1024)
print(f"平均文件大小: {avg_file_size_mb:.2f} MB")

# 如果文件太小则压缩
if avg_file_size_mb < 64:
    DeltaTable.forPath(spark, "/lakehouse/events").optimize().executeCompaction()

# 2. 最优分区策略
# 经验法则：每分区 1GB+

# 检查分区大小
spark.sql("""
    SELECT
        event_date,
        COUNT(*) as num_files,
        SUM(size) / 1024 / 1024 as size_mb
    FROM delta.`/lakehouse/events`
    GROUP BY event_date
    ORDER BY size_mb
""").show()

# 如果需要则重新分区
df.repartition(col("event_date")) \
    .write.format("delta") \
    .mode("overwrite") \
    .partitionBy("event_date") \
    .save("/lakehouse/events_optimized")

# 3. 列排序以获得更好的压缩
# 将低基数列放在前面以获得更好的压缩

schema_order = [
    "event_type",     # 低基数
    "status",         # 低基数
    "event_date",     # 分区列
    "user_id",        # 中等基数
    "event_id",       # 高基数（唯一）
    "properties"      # 复杂类型
]
```

### 缓存策略

```python
# 1. Delta 缓存（Databricks）
# 自动缓存频繁访问的数据
spark.conf.set("spark.databricks.io.cache.enabled", "true")
spark.conf.set("spark.databricks.io.cache.maxDiskUsage", "50g")
spark.conf.set("spark.databricks.io.cache.maxMetaDataCache", "1g")

# 2. 结果缓存用于重复查询
spark.conf.set("spark.sql.cache.serializer", "org.apache.spark.sql.catalyst.expressions.UnsafeRowSerializer")

# 缓存频繁查询的 Gold 表
spark.sql("CACHE TABLE enterprise.gold.daily_metrics")

# 3. 物化视图（Databricks）
spark.sql("""
    CREATE MATERIALIZED VIEW enterprise.gold.mv_weekly_summary
    AS SELECT
        date_trunc('week', event_date) as week,
        event_type,
        SUM(event_count) as weekly_events,
        SUM(total_amount) as weekly_amount
    FROM enterprise.gold.daily_metrics
    GROUP BY 1, 2
""")

# 刷新物化视图
spark.sql("REFRESH MATERIALIZED VIEW enterprise.gold.mv_weekly_summary")

# 4. 预测优化（Databricks）
# 根据使用模式自动优化表
spark.sql("""
    ALTER TABLE enterprise.gold.events
    SET TBLPROPERTIES ('delta.enablePredictiveOptimization' = 'true')
""")
```

## 实战场景

### 统一分析平台

```python
# 场景：构建服务多个团队的统一分析平台

# 架构：
"""
+-------------------------------------------------------------------+
|                    统一 Lakehouse 平台                             |
+-------------------------------------------------------------------+
|                                                                    |
|  数据源:              处理:                消费者:                 |
|  +-------------+     +-------------+       +-------------+         |
|  | 数据库      |---->|   Bronze    |       | BI 工具     |         |
|  | API         |     |    层       |       | (Tableau)   |         |
|  | 流          |     +------+------+       +-------------+         |
|  | 文件        |            |              +-------------+         |
|  +-------------+     +------v------+       | 数据科学    |         |
|                      |   Silver    |------>| (Notebooks) |         |
|                      |    层       |       +-------------+         |
|                      +------+------+       +-------------+         |
|                             |              | ML 平台     |         |
|                      +------v------+       | (MLflow)    |         |
|                      |    Gold     |------>+-------------+         |
|                      |    层       |       +-------------+         |
|                      +-------------+       | 应用        |         |
|                                            | (APIs)      |         |
+-------------------------------------------------------------------+
"""

# 实现
class UnifiedAnalyticsPlatform:
    def __init__(self, spark):
        self.spark = spark
        self.catalog = "enterprise"

    def setup_schemas(self):
        """为不同团队创建 Schema 结构。"""
        schemas = {
            "bronze": "原始数据落地区",
            "silver": "清洗规范化数据",
            "gold_finance": "财务团队聚合",
            "gold_marketing": "营销分析",
            "gold_product": "产品指标",
            "sandbox": "实验区域"
        }

        for schema, desc in schemas.items():
            self.spark.sql(f"""
                CREATE SCHEMA IF NOT EXISTS {self.catalog}.{schema}
                COMMENT '{desc}'
            """)

    def configure_access(self):
        """设置基于角色的访问控制。"""
        roles = {
            "finance-analysts": ["SELECT ON gold_finance"],
            "marketing-analysts": ["SELECT ON gold_marketing"],
            "product-analysts": ["SELECT ON gold_product"],
            "data-engineers": ["ALL ON bronze", "ALL ON silver"],
            "data-scientists": ["SELECT ON silver", "ALL ON sandbox"]
        }

        for role, permissions in roles.items():
            for perm in permissions:
                parts = perm.split(" ON ")
                action, schema = parts[0], parts[1]
                self.spark.sql(f"""
                    GRANT {action} PRIVILEGES ON SCHEMA {self.catalog}.{schema}
                    TO `{role}`
                """)

    def create_shared_dimensions(self):
        """创建共享维度表。"""
        # 日期维度
        self.spark.sql(f"""
            CREATE TABLE IF NOT EXISTS {self.catalog}.silver.dim_date
            USING DELTA
            AS SELECT
                date_key,
                full_date,
                year,
                quarter,
                month,
                week,
                day_of_week,
                is_weekend,
                is_holiday
            FROM (
                SELECT
                    CAST(date_format(date, 'yyyyMMdd') AS INT) as date_key,
                    date as full_date,
                    YEAR(date) as year,
                    QUARTER(date) as quarter,
                    MONTH(date) as month,
                    WEEKOFYEAR(date) as week,
                    DAYOFWEEK(date) as day_of_week,
                    DAYOFWEEK(date) IN (1, 7) as is_weekend,
                    FALSE as is_holiday
                FROM (
                    SELECT explode(sequence(
                        DATE '2020-01-01',
                        DATE '2030-12-31',
                        INTERVAL 1 DAY
                    )) as date
                )
            )
        """)

# 使用示例
platform = UnifiedAnalyticsPlatform(spark)
platform.setup_schemas()
platform.configure_access()
platform.create_shared_dimensions()
```

### 实时 + 批处理

```python
# 场景：用统一湖仓一体替代 Lambda 架构

# 传统 Lambda（复杂）：
"""
                    +-------------+
        +---------->| 批处理层    |--------+
        |           +-------------+        |
原始数据 |                                  +---> 服务层
        |           +-------------+        |
        +---------->| 速度层      |--------+
                    +-------------+

问题：代码重复，复杂性，不一致性
"""

# Lakehouse（统一）：
"""
                    +---------------------------+
原始数据 ---------> |     Lakehouse (Delta)     | ---> 所有消费者
(流式)              | Bronze -> Silver -> Gold  |
                    +---------------------------+

优势：单一代码库，一致性，简洁性
"""

# 实现
def create_unified_streaming_batch_pipeline():
    """处理流式和批处理的统一管道。"""

    # 单一数据源定义
    events_schema = StructType([
        StructField("event_id", StringType(), False),
        StructField("event_type", StringType(), False),
        StructField("user_id", StringType(), True),
        StructField("timestamp", TimestampType(), False),
        StructField("amount", DecimalType(10, 2), True)
    ])

    # 流式摄入到 Bronze
    def start_streaming_ingestion():
        stream_df = spark.readStream \
            .format("kafka") \
            .option("kafka.bootstrap.servers", "kafka:9092") \
            .option("subscribe", "events") \
            .load()

        parsed = stream_df \
            .select(from_json(
                col("value").cast("string"),
                events_schema
            ).alias("data")) \
            .select("data.*")

        return parsed.writeStream \
            .format("delta") \
            .outputMode("append") \
            .option("checkpointLocation", "/lakehouse/_checkpoints/bronze") \
            .trigger(processingTime="1 minute") \
            .start("/lakehouse/bronze/events")

    # 批量回填到 Bronze（同一张表）
    def backfill_historical_data(source_path: str):
        historical_df = spark.read \
            .schema(events_schema) \
            .json(source_path)

        historical_df.write.format("delta") \
            .mode("append") \
            .save("/lakehouse/bronze/events")

    # 统一 Silver 处理（流批通用）
    def process_silver():
        # 可以作为流或批读取
        silver_stream = spark.readStream \
            .format("delta") \
            .load("/lakehouse/bronze/events")

        cleaned = silver_stream \
            .withWatermark("timestamp", "1 hour") \
            .dropDuplicates(["event_id"]) \
            .withColumn("event_date", to_date("timestamp"))

        return cleaned.writeStream \
            .format("delta") \
            .outputMode("append") \
            .option("checkpointLocation", "/lakehouse/_checkpoints/silver") \
            .trigger(processingTime="5 minutes") \
            .start("/lakehouse/silver/events")

    # Gold：实时聚合
    def create_realtime_gold():
        gold_stream = spark.readStream \
            .format("delta") \
            .load("/lakehouse/silver/events")

        # 5分钟窗口聚合
        windowed = gold_stream \
            .withWatermark("timestamp", "10 minutes") \
            .groupBy(
                window("timestamp", "5 minutes"),
                "event_type"
            ).agg(
                count("*").alias("count"),
                sum("amount").alias("total")
            )

        return windowed.writeStream \
            .format("delta") \
            .outputMode("complete") \
            .option("checkpointLocation", "/lakehouse/_checkpoints/gold_5min") \
            .trigger(processingTime="1 minute") \
            .start("/lakehouse/gold/events_5min")

    # Gold：每日批处理聚合
    def create_daily_gold():
        silver_df = spark.read.format("delta") \
            .load("/lakehouse/silver/events")

        daily = silver_df.groupBy("event_date", "event_type").agg(
            count("*").alias("daily_count"),
            sum("amount").alias("daily_total"),
            countDistinct("user_id").alias("unique_users")
        )

        daily.write.format("delta") \
            .mode("overwrite") \
            .partitionBy("event_date") \
            .save("/lakehouse/gold/events_daily")

    return {
        "streaming": start_streaming_ingestion,
        "backfill": backfill_historical_data,
        "silver": process_silver,
        "gold_realtime": create_realtime_gold,
        "gold_daily": create_daily_gold
    }
```

### ML 特征存储

```python
# 场景：湖仓一体作为 ML 特征存储

class LakehouseFeatureStore:
    """基于湖仓一体架构构建的特征存储。"""

    def __init__(self, spark, base_path: str):
        self.spark = spark
        self.base_path = base_path
        self.feature_path = f"{base_path}/features"
        self.registry_path = f"{base_path}/feature_registry"

    def register_feature_group(self,
                                name: str,
                                description: str,
                                entity_key: str,
                                features: list,
                                owner: str):
        """在目录中注册新的特征组。"""
        registry_entry = spark.createDataFrame([{
            "feature_group": name,
            "description": description,
            "entity_key": entity_key,
            "features": features,
            "owner": owner,
            "created_at": current_timestamp(),
            "version": 1
        }])

        registry_entry.write.format("delta") \
            .mode("append") \
            .save(self.registry_path)

    def create_feature_group(self,
                              name: str,
                              source_df,
                              entity_key: str,
                              timestamp_col: str,
                              features: list):
        """创建或更新特征组。"""
        feature_df = source_df.select(
            entity_key,
            timestamp_col,
            *features
        ).withColumn("_feature_timestamp", current_timestamp())

        path = f"{self.feature_path}/{name}"

        if DeltaTable.isDeltaTable(self.spark, path):
            # 合并新特征
            DeltaTable.forPath(self.spark, path) \
                .alias("target").merge(
                    feature_df.alias("source"),
                    f"target.{entity_key} = source.{entity_key} AND " +
                    f"target.{timestamp_col} = source.{timestamp_col}"
                ).whenMatchedUpdateAll() \
                 .whenNotMatchedInsertAll() \
                 .execute()
        else:
            feature_df.write.format("delta") \
                .partitionBy(timestamp_col) \
                .save(path)

    def get_features(self,
                     feature_groups: list,
                     entity_df,
                     entity_key: str,
                     timestamp_col: str = None,
                     point_in_time: bool = True):
        """获取实体的特征，支持时间点连接。"""
        result = entity_df

        for fg_name in feature_groups:
            fg_df = self.spark.read.format("delta") \
                .load(f"{self.feature_path}/{fg_name}")

            if point_in_time and timestamp_col:
                # 时间点正确的连接
                result = result.alias("e").join(
                    fg_df.alias("f"),
                    (col("e." + entity_key) == col("f." + entity_key)) &
                    (col("f." + timestamp_col) <= col("e." + timestamp_col))
                ).select("e.*", "f.*")

                # 获取事件之前的最新特征
                window = Window.partitionBy(
                    "e." + entity_key,
                    "e." + timestamp_col
                ).orderBy(col("f." + timestamp_col).desc())

                result = result \
                    .withColumn("rn", row_number().over(window)) \
                    .filter("rn = 1") \
                    .drop("rn")
            else:
                # 简单连接
                result = result.join(
                    fg_df,
                    entity_key,
                    "left"
                )

        return result

    def get_training_dataset(self,
                             labels_df,
                             feature_groups: list,
                             entity_key: str,
                             timestamp_col: str):
        """使用时间点特征创建训练数据集。"""
        return self.get_features(
            feature_groups,
            labels_df,
            entity_key,
            timestamp_col,
            point_in_time=True
        )

# 使用示例
feature_store = LakehouseFeatureStore(spark, "/lakehouse")

# 创建用户特征
user_events = spark.read.format("delta").load("/lakehouse/silver/events")

user_features = user_events.groupBy("user_id").agg(
    count("*").alias("total_events"),
    sum("amount").alias("total_spent"),
    avg("amount").alias("avg_order_value"),
    max("timestamp").alias("last_activity")
)

feature_store.register_feature_group(
    name="user_activity",
    description="用户活动聚合",
    entity_key="user_id",
    features=["total_events", "total_spent", "avg_order_value"],
    owner="data-science"
)

feature_store.create_feature_group(
    name="user_activity",
    source_df=user_features,
    entity_key="user_id",
    timestamp_col="last_activity",
    features=["total_events", "total_spent", "avg_order_value"]
)

# 获取训练数据集
labels = spark.read.format("delta").load("/lakehouse/gold/user_labels")

training_data = feature_store.get_training_dataset(
    labels_df=labels,
    feature_groups=["user_activity", "user_demographics"],
    entity_key="user_id",
    timestamp_col="label_date"
)
```

## 面试要点

### 常见面试问题

**Q1：什么是湖仓一体，它与数据湖和数据仓库有什么区别？**

```
湖仓一体 = 数据湖存储 + 数据仓库能力

数据湖：
- 便宜的对象存储（S3、ADLS、GCS）
- 读取时定义 Schema（灵活）
- 所有数据类型（结构化、半结构化、非结构化）
- 无 ACID 事务（可靠性问题）
- "数据沼泽"问题

数据仓库：
- 昂贵的专有存储
- 写入时定义 Schema（严格）
- 仅结构化数据
- ACID 事务（可靠）
- 基于 SQL 的分析

湖仓一体：
- 便宜的对象存储（像数据湖）
- Schema 强制 + 演进（两者兼顾）
- 所有数据类型（像数据湖）
- ACID 事务（像数据仓库）
- 统一分析 + ML 工作负载
```

**Q2：湖仓一体架构的关键组件是什么？**

```
1. 存储层
   - 对象存储（S3、ADLS、GCS）
   - 开放文件格式（Parquet、ORC）

2. 开放表格式
   - Delta Lake、Apache Iceberg、Apache Hudi
   - 提供 ACID 事务
   - Schema 强制
   - 时间旅行

3. 元数据层
   - 目录（Unity Catalog、Hive Metastore）
   - Schema 管理
   - 优化统计信息

4. 查询引擎
   - Spark SQL、Presto/Trino、DuckDB
   - 支持 SQL 和 DataFrame API

5. 治理层
   - 访问控制
   - 审计日志
   - 数据血缘
   - 质量监控
```

**Q3：开放表格式（Delta Lake、Iceberg、Hudi）如何实现 ACID 事务？**

```
事务日志架构：

1. 预写日志
   - 所有变更首先记录在事务日志中
   - 日志条目是原子的 JSON/Avro 文件

2. 乐观并发控制
   - 多个写入者可以并发工作
   - 提交时检测冲突
   - 失败的事务重试

3. 快照隔离
   - 读取者看到一致的时间点视图
   - 写入者不阻塞读取者

4. 原子提交
   - 首先写入新数据文件
   - 单个原子写入提交日志
   - 整个提交要么成功要么失败

示例（Delta Lake）：
_delta_log/
  00000000.json  <- 版本 0（初始）
  00000001.json  <- 版本 1（更新）
  00000010.checkpoint.parquet  <- 检查点用于快速读取
```

**Q4：解释奖章架构（Bronze/Silver/Gold）**

```
Bronze 层（原始）：
- 原始数据落地区
- 最小转换
- 仅追加，保留源保真度
- 启用 Schema 演进
- 用例：审计，重新处理

Silver 层（清洗）：
- 验证和去重
- 规范化数据类型
- 建立业务键
- 连接就绪质量
- 用例：分析，特征工程

Gold 层（聚合）：
- 业务级指标
- 反规范化以提高性能
- 仪表板和报表就绪
- 针对特定用例优化
- 用例：BI、ML 模型、API

关键原则：
- 数据仅向下游流动
- 每层有明确的 SLA
- 治理随层级增加
```

**Q5：何时选择 Delta Lake vs Iceberg vs Hudi？**

```
选择 Delta Lake 当：
- 使用 Databricks 生态系统
- 需要紧密的 Spark 集成
- 大量 MERGE/UPDATE 工作负载
- 流批一体

选择 Apache Iceberg 当：
- 需要多引擎访问（Spark、Trino、Flink）
- 需要分区演进
- 超大表（PB+）
- 隐藏分区有价值

选择 Apache Hudi 当：
- 记录级更新为主
- 需要近实时摄入
- 强 CDC 需求
- 增量处理焦点

三者都提供：
- ACID 事务
- Schema 演进
- 时间旅行
- 高效更新插入
```

### 系统设计考量

```python
# 面试中设计湖仓一体

"""
需求分析问题：
1. 数据量（GB/TB/PB）？
2. 延迟要求（实时/近实时/批处理）？
3. 用户类型（分析师/数据科学家/应用）？
4. 查询模式（即席/仪表板/ML）？
5. 数据敏感性（PII/合规）？

设计考量：

1. 表格式选择
   - 评估 Delta vs Iceberg vs Hudi
   - 考虑生态系统和团队技能

2. 分区策略
   - 低基数用于分区
   - 目标每分区 1GB+
   - 考虑基于时间 + 功能分区

3. 存储优化
   - 文件大小：128MB-1GB
   - 压缩计划
   - 对频繁过滤列进行 Z-Order

4. 查询性能
   - 缓存策略
   - 物化视图
   - 统计信息收集

5. 治理
   - 访问控制模型
   - 数据分类
   - 血缘追踪

6. 成本优化
   - 存储分层
   - 计算资源适配
   - 保留策略
"""
```

## 延伸阅读

### 重要论文和文档

- **Databricks 湖仓一体论文**：[Lakehouse: A New Generation of Open Platforms](https://www.cidrdb.org/cidr2021/papers/cidr2021_paper17.pdf) - 介绍湖仓一体概念的基础论文
- **Delta Lake 文档**：[docs.delta.io](https://docs.delta.io) - 全面的 Delta Lake 参考
- **Apache Iceberg 文档**：[iceberg.apache.org](https://iceberg.apache.org/docs/latest/) - Iceberg 表格式文档
- **Apache Hudi 文档**：[hudi.apache.org](https://hudi.apache.org/docs/overview) - Hudi 文档和教程

### 推荐书籍

- **"The Data Lakehouse"** by Bill Inmon, Mary Levins - 湖仓一体架构全面指南
- **"Delta Lake: The Definitive Guide"** by Denny Lee, Tathagata Das - 深入了解 Delta Lake
- **"Fundamentals of Data Engineering"** by Joe Reis, Matt Housley - 现代数据架构模式

### 在线资源

- [Databricks Blog](https://www.databricks.com/blog) - 最新的湖仓一体模式和最佳实践
- [Apache Iceberg Community](https://iceberg.apache.org/community/) - Iceberg 社区资源
- [Data Engineering Weekly](https://www.dataengineeringweekly.com/) - 行业新闻和趋势

### 相关主题

- **Data Mesh**：与湖仓一体互补的去中心化数据架构
- **数据契约**：Schema 管理和 API 保证
- **特征存储**：ML 特定的湖仓一体模式
- **流式架构**：Kappa 架构和流优先设计
- **数据可观测性**：湖仓一体环境中的监控和质量

---

湖仓一体架构代表了数据平台的未来，它结合了数据湖的经济性和灵活性与数据仓库的可靠性和性能。通过建立在开放标准和格式之上，湖仓一体使组织能够整合其数据基础设施，同时支持从 BI 到机器学习的多样化工作负载。成功使用湖仓一体架构需要理解技术组件（表格式、查询引擎、治理）和使其在大规模环境下有效的组织实践（奖章架构、数据质量、成本管理）。
