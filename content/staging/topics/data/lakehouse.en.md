---
title: Lakehouse Architecture
description: Complete guide to Lakehouse architecture - combining the best of data lakes and data warehouses
track: data
section: data-engineering
difficulty: advanced
tags:
  - Lakehouse
  - Data Lake
  - Data Warehouse
  - Delta Lake
  - Apache Iceberg
  - Databricks
status: imported
origin: old/src/content/docs/data/lakehouse.en.md
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

The Lakehouse architecture represents a paradigm shift in data management, unifying the best characteristics of data lakes and data warehouses into a single, cohesive platform. By combining the low-cost storage and flexibility of data lakes with the data management capabilities and performance of data warehouses, lakehouses enable organizations to build modern data platforms that serve analytics, data science, and machine learning workloads from a single source of truth.

## Understanding Lakehouse Architecture

### What is a Lakehouse?

A Lakehouse is a modern data architecture that combines the key benefits of data lakes and data warehouses. It stores all data in open formats on low-cost object storage while providing the data management features traditionally found only in data warehouses, such as ACID transactions, schema enforcement, and governance capabilities.

**Core Value Propositions:**

- **Single Source of Truth**: All data resides in one location, eliminating data silos and redundancy
- **Cost Efficiency**: Uses low-cost object storage (S3, ADLS, GCS) instead of proprietary formats
- **Open Standards**: Built on open file formats (Parquet, ORC) and table formats (Delta Lake, Apache Iceberg, Apache Hudi)
- **Unified Analytics**: Supports BI, data science, and machine learning from the same data
- **ACID Transactions**: Ensures data reliability with full transactional guarantees
- **Schema Enforcement**: Prevents data corruption with strict schema validation

### Evolution from Data Lakes and Warehouses

```
Historical Evolution:

1990s-2000s: Data Warehouse Era
+------------------+
|  Data Warehouse  |  - Structured data only
|  (Expensive)     |  - ACID transactions
|                  |  - SQL-based analytics
+------------------+  - High storage costs

2010s: Data Lake Era
+------------------+
|    Data Lake     |  - All data types (structured, semi, unstructured)
|    (Cheap)       |  - No transactions (reliability issues)
|                  |  - Schema-on-read
+------------------+  - "Data swamp" problems

2020s: Lakehouse Era
+------------------+
|    Lakehouse     |  - Best of both worlds
|  (Cost + Power)  |  - ACID on data lake storage
|                  |  - Schema enforcement + flexibility
+------------------+  - Unified analytics platform
```

### The Two-Tier Problem

Before lakehouses, organizations typically maintained separate systems:

```
Traditional Two-Tier Architecture:

                    +-----------+     +-----------+
Raw Data --------->|  Data     |---->|    ETL    |
(All formats)      |   Lake    |     | Pipeline  |
                   +-----------+     +-----------+
                        |                  |
                        v                  v
                   +-----------+     +-----------+
                   |    ML/    |     |   Data    |---> BI/Reports
                   |  DataSci  |     | Warehouse |
                   +-----------+     +-----------+

Problems:
1. Data duplication (2x storage costs)
2. Data staleness (ETL lag)
3. Data inconsistency (different versions)
4. Complex pipelines (multiple hops)
5. Governance challenges (multiple systems)
```

### Lakehouse Architecture Overview

```
Lakehouse Architecture:

+------------------------------------------------------------------+
|                        Lakehouse Platform                         |
|  +------------------------------------------------------------+  |
|  |                    Access Layer                             |  |
|  |   SQL Engine | DataFrame API | ML Frameworks | BI Tools    |  |
|  +------------------------------------------------------------+  |
|  +------------------------------------------------------------+  |
|  |                   Governance Layer                          |  |
|  |   Access Control | Audit | Lineage | Data Quality          |  |
|  +------------------------------------------------------------+  |
|  +------------------------------------------------------------+  |
|  |                   Metadata Layer                            |  |
|  |   Catalog | Schema | Statistics | Transaction Log          |  |
|  +------------------------------------------------------------+  |
|  +------------------------------------------------------------+  |
|  |                 Open Table Format                           |  |
|  |   Delta Lake | Apache Iceberg | Apache Hudi                |  |
|  +------------------------------------------------------------+  |
|  +------------------------------------------------------------+  |
|  |                   Storage Layer                             |  |
|  |   Parquet/ORC Files on Object Storage (S3/ADLS/GCS)        |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
```

## Core Principles

### ACID Transactions on Data Lakes

Lakehouses achieve ACID (Atomicity, Consistency, Isolation, Durability) transactions through innovative use of transaction logs and metadata management:

```python
from delta.tables import DeltaTable
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("LakehouseACID") \
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
    .getOrCreate()

# Atomicity: All operations succeed or fail together
# This write either fully commits or fully rolls back
df = spark.createDataFrame([
    (1, "Alice", 50000),
    (2, "Bob", 60000),
    (3, "Charlie", 55000)
], ["id", "name", "salary"])

df.write.format("delta") \
    .mode("overwrite") \
    .save("/lakehouse/employees")

# Consistency: Constraints ensure data validity
spark.sql("""
    ALTER TABLE delta.`/lakehouse/employees`
    ADD CONSTRAINT salary_positive CHECK (salary > 0)
""")

# Isolation: Concurrent transactions don't interfere
# Reader sees consistent snapshot while writer modifies data
delta_table = DeltaTable.forPath(spark, "/lakehouse/employees")

# Durability: Committed transactions survive failures
# Transaction log ensures recoverability
delta_table.update(
    condition="name = 'Alice'",
    set={"salary": "salary * 1.1"}
)
```

**Transaction Log Mechanics:**

```
Transaction Log Structure:

/lakehouse/employees/
├── _delta_log/                          # Transaction log
│   ├── 00000000000000000000.json       # Initial commit
│   │   └── {add: [file1.parquet]}
│   ├── 00000000000000000001.json       # Update commit
│   │   └── {remove: [file1], add: [file2]}
│   ├── 00000000000000000002.json       # Another update
│   └── 00000000000000000010.checkpoint.parquet
├── part-00000-...snappy.parquet        # Data files
└── part-00001-...snappy.parquet

Each commit is atomic:
1. Write new data files
2. Atomically write commit JSON to log
3. If step 2 fails, step 1 files are orphaned (cleaned by VACUUM)
```

### Schema Enforcement and Evolution

Lakehouses provide strict schema enforcement while supporting controlled schema evolution:

```python
from pyspark.sql.types import *

# Define explicit schema
employee_schema = StructType([
    StructField("id", LongType(), nullable=False),
    StructField("name", StringType(), nullable=False),
    StructField("department", StringType(), nullable=True),
    StructField("salary", DecimalType(10, 2), nullable=True),
    StructField("hire_date", DateType(), nullable=True)
])

# Schema enforcement prevents bad data
try:
    bad_data = spark.createDataFrame([
        (1, "Alice", "HR", "not_a_number", "2024-01-01")  # Wrong type
    ], ["id", "name", "department", "salary", "hire_date"])

    bad_data.write.format("delta") \
        .mode("append") \
        .save("/lakehouse/employees")
except Exception as e:
    print(f"Schema enforcement blocked bad data: {e}")

# Schema evolution (adding columns)
# New nullable columns can be safely added
updated_df = spark.createDataFrame([
    (4, "Diana", "Sales", 65000.00, "2024-06-01", "diana@company.com")
], ["id", "name", "department", "salary", "hire_date", "email"])

updated_df.write.format("delta") \
    .mode("append") \
    .option("mergeSchema", "true") \
    .save("/lakehouse/employees")

# View evolved schema
spark.read.format("delta").load("/lakehouse/employees").printSchema()
```

### Unified Storage Layer

The lakehouse unifies all data on a single storage layer:

```python
# All data types in one lakehouse
# Structured data
structured_df = spark.read.format("csv") \
    .option("header", "true") \
    .load("/raw/transactions.csv")

structured_df.write.format("delta") \
    .mode("overwrite") \
    .save("/lakehouse/bronze/transactions")

# Semi-structured data (JSON)
semi_structured_df = spark.read.format("json") \
    .load("/raw/events/*.json")

semi_structured_df.write.format("delta") \
    .mode("append") \
    .save("/lakehouse/bronze/events")

# Unstructured data references
# Store metadata and paths, process with specialized tools
unstructured_catalog = spark.createDataFrame([
    ("img_001.jpg", "s3://raw/images/img_001.jpg", "image/jpeg", 1024000),
    ("doc_001.pdf", "s3://raw/documents/doc_001.pdf", "application/pdf", 2048000)
], ["file_name", "path", "content_type", "size_bytes"])

unstructured_catalog.write.format("delta") \
    .mode("overwrite") \
    .save("/lakehouse/bronze/unstructured_files")
```

### Metadata Layer

The metadata layer provides catalog capabilities similar to traditional data warehouses:

```python
# Unity Catalog (Databricks) or Hive Metastore
# Three-level namespace: catalog.schema.table

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

# Rich metadata queries
spark.sql("DESCRIBE EXTENDED enterprise.sales.orders").show(truncate=False)
spark.sql("SHOW TABLE PROPERTIES enterprise.sales.orders").show(truncate=False)

# Statistics for query optimization
spark.sql("ANALYZE TABLE enterprise.sales.orders COMPUTE STATISTICS FOR ALL COLUMNS")
```

## Core Components

### Open Table Formats

The lakehouse relies on open table formats that add data management capabilities to data lake storage:

**Delta Lake:**

```python
# Delta Lake - Original lakehouse table format by Databricks
from delta.tables import DeltaTable

# Create Delta table
df.write.format("delta") \
    .partitionBy("date") \
    .save("/lakehouse/events")

# Key features
delta_table = DeltaTable.forPath(spark, "/lakehouse/events")

# Time travel
spark.read.format("delta") \
    .option("versionAsOf", 5) \
    .load("/lakehouse/events")

# MERGE (upsert)
delta_table.alias("target").merge(
    updates_df.alias("source"),
    "target.id = source.id"
).whenMatchedUpdateAll() \
 .whenNotMatchedInsertAll() \
 .execute()

# Z-ORDER optimization
delta_table.optimize().executeZOrderBy("user_id", "timestamp")

# Change Data Feed
spark.read.format("delta") \
    .option("readChangeFeed", "true") \
    .option("startingVersion", 10) \
    .load("/lakehouse/events")
```

**Apache Iceberg:**

```python
# Apache Iceberg - Open table format for huge analytic tables
spark = SparkSession.builder \
    .config("spark.sql.catalog.iceberg", "org.apache.iceberg.spark.SparkCatalog") \
    .config("spark.sql.catalog.iceberg.type", "hadoop") \
    .config("spark.sql.catalog.iceberg.warehouse", "/lakehouse/iceberg") \
    .getOrCreate()

# Create Iceberg table
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

# Hidden partitioning - no need to specify partition in queries
spark.sql("""
    SELECT * FROM iceberg.db.events
    WHERE timestamp >= '2024-01-01'  -- Partition pruning automatic
""")

# Time travel
spark.sql("SELECT * FROM iceberg.db.events VERSION AS OF 123456789")
spark.sql("SELECT * FROM iceberg.db.events TIMESTAMP AS OF '2024-01-15 10:00:00'")

# Schema evolution
spark.sql("ALTER TABLE iceberg.db.events ADD COLUMNS (session_id STRING)")
spark.sql("ALTER TABLE iceberg.db.events RENAME COLUMN properties TO metadata")

# Partition evolution - change partitioning without rewriting data
spark.sql("ALTER TABLE iceberg.db.events ADD PARTITION FIELD hours(timestamp)")
```

**Apache Hudi:**

```python
# Apache Hudi - Streaming data lake platform
# Write with Hudi
df.write.format("hudi") \
    .option("hoodie.table.name", "events") \
    .option("hoodie.datasource.write.recordkey.field", "id") \
    .option("hoodie.datasource.write.precombine.field", "timestamp") \
    .option("hoodie.datasource.write.operation", "upsert") \
    .option("hoodie.datasource.write.table.type", "COPY_ON_WRITE") \
    .mode("append") \
    .save("/lakehouse/hudi/events")

# Incremental queries - only read new/changed data
spark.read.format("hudi") \
    .option("hoodie.datasource.query.type", "incremental") \
    .option("hoodie.datasource.read.begin.instanttime", "20240115100000") \
    .load("/lakehouse/hudi/events")

# Point-in-time queries
spark.read.format("hudi") \
    .option("as.of.instant", "20240115100000") \
    .load("/lakehouse/hudi/events")
```

### Query Engines

Lakehouses support multiple query engines for different use cases:

```python
# Spark SQL - Primary engine for large-scale processing
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

# Presto/Trino - Fast interactive queries
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

# Databricks SQL - Serverless SQL warehouse
# Direct SQL access to lakehouse tables with auto-scaling
"""
SELECT * FROM enterprise.sales.daily_metrics
WHERE metric_date = CURRENT_DATE - 1
"""

# DuckDB - Embedded analytics
import duckdb

conn = duckdb.connect()
conn.execute("INSTALL delta; LOAD delta;")
result = conn.execute("""
    SELECT * FROM delta_scan('/lakehouse/events')
    WHERE event_type = 'purchase'
    LIMIT 1000
""").fetchdf()
```

### Storage Layer

Object storage provides the foundation for lakehouse architecture:

```python
# Configure storage access
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

# Storage organization best practices
"""
/lakehouse/
├── bronze/                    # Raw ingested data
│   ├── events/
│   ├── transactions/
│   └── users/
├── silver/                    # Cleaned, conformed data
│   ├── events_cleaned/
│   ├── transactions_validated/
│   └── users_deduplicated/
├── gold/                      # Business-level aggregates
│   ├── daily_metrics/
│   ├── customer_360/
│   └── revenue_summary/
└── _checkpoints/              # Streaming checkpoints
"""
```

### Governance Layer

Data governance is essential for enterprise lakehouse deployments:

```python
# Unity Catalog governance (Databricks)
# Access control
spark.sql("""
    GRANT SELECT ON TABLE enterprise.sales.orders
    TO `data-analysts@company.com`
""")

spark.sql("""
    GRANT ALL PRIVILEGES ON SCHEMA enterprise.sales
    TO `data-engineers@company.com`
""")

# Column-level security
spark.sql("""
    ALTER TABLE enterprise.hr.employees
    ALTER COLUMN salary SET MASK mask_salary
""")

# Row-level security
spark.sql("""
    ALTER TABLE enterprise.sales.orders
    SET ROW FILTER region_filter ON (region)
""")

# Data lineage tracking
# Automatically captured for Unity Catalog tables
spark.sql("DESCRIBE HISTORY enterprise.sales.orders")

# Data quality monitoring
spark.sql("""
    ALTER TABLE enterprise.sales.orders
    ADD CONSTRAINT valid_amount CHECK (total_amount >= 0)
""")

# Audit logging
# All access and modifications are logged
spark.sql("""
    SELECT * FROM system.access.audit
    WHERE table_name = 'orders'
    AND action_time >= '2024-01-01'
""")
```

## Code Examples

### Databricks/Delta Lake Implementation

```python
# Complete lakehouse pipeline with Databricks and Delta Lake
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from delta.tables import DeltaTable

spark = SparkSession.builder \
    .appName("LakehousePipeline") \
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
    .getOrCreate()

# Bronze Layer: Raw Ingestion
def ingest_to_bronze(source_path: str, bronze_path: str):
    """Ingest raw data to bronze layer with minimal transformation."""
    raw_df = spark.read.format("json") \
        .option("inferSchema", "true") \
        .load(source_path)

    # Add ingestion metadata
    bronze_df = raw_df \
        .withColumn("_ingestion_timestamp", current_timestamp()) \
        .withColumn("_source_file", input_file_name()) \
        .withColumn("_ingestion_date", current_date())

    # Append to bronze table with schema merge
    bronze_df.write.format("delta") \
        .mode("append") \
        .option("mergeSchema", "true") \
        .partitionBy("_ingestion_date") \
        .save(bronze_path)

    return bronze_df.count()

# Silver Layer: Data Cleansing and Validation
def process_to_silver(bronze_path: str, silver_path: str):
    """Clean and validate data for silver layer."""
    # Read bronze data (incremental based on watermark)
    bronze_df = spark.read.format("delta").load(bronze_path)

    # Data quality transformations
    silver_df = bronze_df \
        .filter(col("id").isNotNull()) \
        .filter(col("event_timestamp").isNotNull()) \
        .dropDuplicates(["id", "event_timestamp"]) \
        .withColumn("event_date", to_date("event_timestamp")) \
        .withColumn("event_hour", hour("event_timestamp")) \
        .withColumn("is_valid",
            when(col("amount") > 0, True).otherwise(False))

    # Merge into silver table
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

# Gold Layer: Business Aggregations
def aggregate_to_gold(silver_path: str, gold_path: str):
    """Create business-level aggregations for gold layer."""
    silver_df = spark.read.format("delta").load(silver_path)

    # Daily metrics
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

    # Write to gold layer
    daily_metrics.write.format("delta") \
        .mode("overwrite") \
        .partitionBy("event_date") \
        .save(gold_path)

    # Optimize gold table for queries
    delta_table = DeltaTable.forPath(spark, gold_path)
    delta_table.optimize().executeZOrderBy("event_type")

# Run the pipeline
bronze_records = ingest_to_bronze(
    "/raw/events/*.json",
    "/lakehouse/bronze/events"
)
print(f"Ingested {bronze_records} records to bronze")

process_to_silver(
    "/lakehouse/bronze/events",
    "/lakehouse/silver/events"
)
print("Processed silver layer")

aggregate_to_gold(
    "/lakehouse/silver/events",
    "/lakehouse/gold/daily_metrics"
)
print("Aggregated gold layer")
```

### Multi-Engine Access Pattern

```python
# Same lakehouse data accessible from multiple engines

# 1. Spark for batch processing
spark_df = spark.read.format("delta").load("/lakehouse/silver/events")
spark_result = spark_df.groupBy("event_type").count()

# 2. Spark Streaming for real-time
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

# 3. SQL queries via Databricks SQL or Spark SQL
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

# 4. Pandas for data science
# Using Spark to Pandas conversion
pandas_df = spark.read.format("delta") \
    .load("/lakehouse/gold/daily_metrics") \
    .filter("event_date >= '2024-01-01'") \
    .toPandas()

# Or using connectors like databricks-sql-connector
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

# 5. BI Tools (Tableau, Power BI)
# Connect via JDBC/ODBC to Databricks SQL endpoint
# or use native connectors with Unity Catalog
```

### Streaming Lakehouse Pattern

```python
# Real-time data ingestion with lakehouse
from pyspark.sql.functions import *
from pyspark.sql.types import *

# Define schema for streaming data
event_schema = StructType([
    StructField("event_id", StringType(), False),
    StructField("event_type", StringType(), False),
    StructField("user_id", StringType(), True),
    StructField("timestamp", TimestampType(), False),
    StructField("properties", MapType(StringType(), StringType()), True)
])

# Read from Kafka
kafka_df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "events") \
    .option("startingOffsets", "latest") \
    .load()

# Parse and transform
parsed_df = kafka_df \
    .select(from_json(col("value").cast("string"), event_schema).alias("data")) \
    .select("data.*") \
    .withColumn("event_date", to_date("timestamp")) \
    .withColumn("processing_time", current_timestamp())

# Write to Bronze (append-only, raw data)
bronze_query = parsed_df.writeStream \
    .format("delta") \
    .outputMode("append") \
    .option("checkpointLocation", "/lakehouse/_checkpoints/bronze_events") \
    .partitionBy("event_date") \
    .trigger(processingTime="1 minute") \
    .start("/lakehouse/bronze/events_stream")

# Streaming Silver: Deduplicate and enrich
silver_stream = spark.readStream \
    .format("delta") \
    .option("ignoreChanges", "true") \
    .load("/lakehouse/bronze/events_stream")

# Deduplicate within watermark
deduplicated = silver_stream \
    .withWatermark("timestamp", "1 hour") \
    .dropDuplicates(["event_id"])

# Write to Silver with merge
def merge_to_silver(batch_df, batch_id):
    """Merge batch into silver table."""
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

# Streaming Gold: Real-time aggregations
gold_stream = spark.readStream \
    .format("delta") \
    .load("/lakehouse/silver/events_stream")

# 5-minute window aggregations
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

## Best Practices

### Medallion Architecture (Bronze/Silver/Gold)

```python
# Complete Medallion Architecture Implementation

class MedallionPipeline:
    """Implements Bronze-Silver-Gold medallion architecture."""

    def __init__(self, spark, base_path: str):
        self.spark = spark
        self.base_path = base_path
        self.bronze_path = f"{base_path}/bronze"
        self.silver_path = f"{base_path}/silver"
        self.gold_path = f"{base_path}/gold"

    # BRONZE LAYER
    # Purpose: Raw data landing zone
    # Characteristics: Append-only, minimal transformation, full history
    def ingest_bronze(self, source_df, table_name: str):
        """Ingest raw data to bronze layer."""
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

    # SILVER LAYER
    # Purpose: Cleansed, validated, deduplicated data
    # Characteristics: Conformed data model, business keys, type corrections
    def process_silver(self, table_name: str,
                       business_key: list,
                       quality_rules: dict):
        """Process data from bronze to silver with quality rules."""
        bronze_df = self.spark.read.format("delta") \
            .load(f"{self.bronze_path}/{table_name}")

        # Apply quality rules
        silver_df = bronze_df
        for column, rules in quality_rules.items():
            if "not_null" in rules:
                silver_df = silver_df.filter(col(column).isNotNull())
            if "positive" in rules:
                silver_df = silver_df.filter(col(column) > 0)
            if "enum" in rules:
                silver_df = silver_df.filter(col(column).isin(rules["enum"]))

        # Deduplicate on business key
        silver_df = silver_df.dropDuplicates(business_key)

        # Add silver metadata
        silver_df = silver_df \
            .withColumn("_silver_timestamp", current_timestamp()) \
            .withColumn("_is_valid", lit(True))

        # Merge into silver table
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

    # GOLD LAYER
    # Purpose: Business-level aggregates and metrics
    # Characteristics: Denormalized, optimized for analytics, dashboard-ready
    def aggregate_gold(self, silver_tables: list,
                       gold_table: str,
                       aggregation_query: str):
        """Create gold aggregations from silver tables."""
        # Register silver tables as temp views
        for table in silver_tables:
            self.spark.read.format("delta") \
                .load(f"{self.silver_path}/{table}") \
                .createOrReplaceTempView(table)

        # Execute aggregation
        gold_df = self.spark.sql(aggregation_query)

        # Write to gold
        gold_df.write.format("delta") \
            .mode("overwrite") \
            .save(f"{self.gold_path}/{gold_table}")

        # Optimize for queries
        DeltaTable.forPath(self.spark, f"{self.gold_path}/{gold_table}") \
            .optimize().executeCompaction()

# Usage
pipeline = MedallionPipeline(spark, "/lakehouse")

# Bronze ingestion
raw_events = spark.read.json("/raw/events/*.json")
pipeline.ingest_bronze(raw_events, "events")

# Silver processing with quality rules
pipeline.process_silver(
    "events",
    business_key=["event_id"],
    quality_rules={
        "event_id": ["not_null"],
        "amount": ["positive"],
        "event_type": {"enum": ["click", "view", "purchase"]}
    }
)

# Gold aggregation
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

### Data Quality Implementation

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
    """Data quality framework for lakehouse."""

    def __init__(self, spark):
        self.spark = spark
        self.results = []

    def run_checks(self, df, checks: List[QualityCheck]) -> bool:
        """Run all quality checks and return pass/fail."""
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
                print(f"FAILED: {check.name} - {failed}/{total_rows} rows failed")
            else:
                print(f"PASSED: {check.name}")

        return all_passed

    def get_results_df(self):
        """Get results as DataFrame for persistence."""
        return self.spark.createDataFrame(self.results)

    def save_results(self, path: str):
        """Save quality results to lakehouse."""
        results_df = self.get_results_df() \
            .withColumn("run_timestamp", current_timestamp())

        results_df.write.format("delta") \
            .mode("append") \
            .save(path)

# Usage
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
    raise Exception("Data quality checks failed!")
```

### Cost Optimization Strategies

```python
# Cost optimization techniques for lakehouse

# 1. Efficient partitioning strategy
# Avoid over-partitioning (many small files)
# Target: 1GB+ per partition

# Bad: Too fine-grained partitioning
df.write.partitionBy("year", "month", "day", "hour")  # 8760 partitions/year

# Good: Balanced partitioning
df.write.partitionBy("event_date")  # 365 partitions/year

# 2. File compaction and optimization
delta_table = DeltaTable.forPath(spark, "/lakehouse/events")

# Compact small files
delta_table.optimize().executeCompaction()

# Z-Order for frequent query patterns
delta_table.optimize().executeZOrderBy("user_id", "event_type")

# Auto-optimization settings
spark.sql("""
    ALTER TABLE delta.`/lakehouse/events`
    SET TBLPROPERTIES (
        'delta.autoOptimize.optimizeWrite' = 'true',
        'delta.autoOptimize.autoCompact' = 'true',
        'delta.targetFileSize' = '134217728'
    )
""")

# 3. Lifecycle management
# Set retention policies
spark.sql("""
    ALTER TABLE delta.`/lakehouse/bronze/events`
    SET TBLPROPERTIES (
        'delta.logRetentionDuration' = 'interval 30 days',
        'delta.deletedFileRetentionDuration' = 'interval 7 days'
    )
""")

# Regular vacuum to reclaim storage
delta_table.vacuum(168)  # Keep 7 days of history

# 4. Tiered storage (for cloud providers)
# Move cold data to cheaper storage classes
# AWS: S3 Intelligent-Tiering or Glacier
# Azure: Cool or Archive tier
# GCP: Nearline or Coldline

# 5. Query optimization
# Use predicate pushdown
spark.sql("SELECT * FROM events WHERE event_date = '2024-01-15'")  # Good

# Avoid full scans
spark.sql("SELECT * FROM events WHERE YEAR(event_date) = 2024")  # Bad

# Select only needed columns
spark.sql("SELECT event_id, event_type FROM events")  # Good
spark.sql("SELECT * FROM events")  # Bad

# 6. Compute right-sizing
# Use appropriate cluster size
# Consider serverless for variable workloads
# Use spot instances for non-critical jobs
```

## Common Pitfalls

### Over-Engineering the Architecture

```python
# PITFALL: Over-complicated layer structure
# Don't create unnecessary intermediate layers

# Bad: Too many layers
"""
raw -> landing -> staging -> bronze -> silver_raw -> silver_clean ->
silver_conform -> gold_intermediate -> gold_final -> presentation
"""

# Good: Standard medallion architecture
"""
raw -> bronze -> silver -> gold
"""

# PITFALL: Premature optimization
# Don't optimize before understanding query patterns

# Bad: Z-Order everything immediately
delta_table.optimize().executeZOrderBy(
    "col1", "col2", "col3", "col4", "col5"
)

# Good: Analyze query patterns first, then optimize
# Check query history
spark.sql("""
    SELECT
        query_text,
        COUNT(*) as execution_count
    FROM system.query.history
    WHERE table_name = 'events'
    GROUP BY query_text
    ORDER BY execution_count DESC
""")

# Then optimize based on actual usage
delta_table.optimize().executeZOrderBy("user_id")  # Most filtered column
```

### Ignoring Governance

```python
# PITFALL: No access control
# Bad: Everyone has access to everything
spark.sql("GRANT ALL PRIVILEGES ON CATALOG enterprise TO `all-users`")

# Good: Principle of least privilege
spark.sql("""
    -- Analysts can only read gold layer
    GRANT SELECT ON SCHEMA enterprise.gold TO `analysts`;

    -- Data engineers can modify silver and gold
    GRANT ALL PRIVILEGES ON SCHEMA enterprise.silver TO `data-engineers`;
    GRANT ALL PRIVILEGES ON SCHEMA enterprise.gold TO `data-engineers`;

    -- Only admins can access bronze (raw data)
    GRANT ALL PRIVILEGES ON SCHEMA enterprise.bronze TO `data-admins`;
""")

# PITFALL: No data classification
# Good: Classify sensitive data
spark.sql("""
    ALTER TABLE enterprise.gold.customers
    SET TAGS ('pii' = 'true', 'data_owner' = 'customer-team')
""")

# PITFALL: No lineage tracking
# Good: Use Unity Catalog or similar for automatic lineage
# Or implement manual lineage tracking
lineage_df = spark.createDataFrame([
    ("gold.daily_metrics", "silver.events", "aggregation", "2024-01-15"),
    ("silver.events", "bronze.events", "cleaning", "2024-01-15")
], ["target_table", "source_table", "operation", "run_date"])

lineage_df.write.format("delta") \
    .mode("append") \
    .save("/lakehouse/metadata/lineage")
```

### Poor Table Format Choice

```python
# PITFALL: Using wrong table format for use case

# Delta Lake: Best for
# - Databricks ecosystem
# - Heavy MERGE/UPDATE workloads
# - Streaming + batch unified

# Apache Iceberg: Best for
# - Multi-engine access (Spark, Trino, Flink)
# - Partition evolution needs
# - Very large tables (petabyte scale)

# Apache Hudi: Best for
# - Record-level updates/deletes
# - Near real-time ingestion
# - CDC (Change Data Capture) workloads

# PITFALL: Mixing formats without strategy
# Bad: Random format choices
"""
events/ (Delta)
users/ (Iceberg)
transactions/ (Hudi)
"""

# Good: Consistent format with clear rationale
"""
All tables use Delta Lake for:
- Databricks-native integration
- Unified batch/streaming
- Team familiarity

Exception: Large archival tables use Iceberg for:
- Better partition evolution
- Multi-engine read access
"""
```

## Performance Considerations

### Query Optimization Strategies

```python
# 1. Partition pruning
# Ensure queries filter on partition columns first

# Good: Partition filter first
spark.sql("""
    SELECT * FROM events
    WHERE event_date = '2024-01-15'  -- Partition column
      AND event_type = 'purchase'
""")

# Bad: Function on partition column prevents pruning
spark.sql("""
    SELECT * FROM events
    WHERE YEAR(event_date) = 2024  -- No partition pruning!
""")

# 2. Data skipping with Z-Order
# Optimize for common filter patterns

# Analyze query patterns
frequent_filters = ["user_id", "event_type", "product_id"]

# Z-Order on most selective columns
delta_table.optimize().executeZOrderBy("user_id", "event_type")

# 3. Statistics collection
spark.sql("ANALYZE TABLE events COMPUTE STATISTICS FOR ALL COLUMNS")

# 4. Broadcast joins for small tables
from pyspark.sql.functions import broadcast

# Small dimension table (< 10MB)
dim_products = spark.read.format("delta").load("/lakehouse/gold/dim_products")

# Large fact table
fact_sales = spark.read.format("delta").load("/lakehouse/gold/fact_sales")

# Broadcast the small table
result = fact_sales.join(
    broadcast(dim_products),
    fact_sales.product_id == dim_products.product_id
)

# 5. Caching for repeated access
events_df = spark.read.format("delta") \
    .load("/lakehouse/silver/events") \
    .filter("event_date >= '2024-01-01'") \
    .cache()

# Materialize cache
events_df.count()

# Multiple operations on cached data
events_df.groupBy("event_type").count().show()
events_df.groupBy("user_id").agg(sum("amount")).show()

events_df.unpersist()  # Release when done
```

### Data Layout Optimization

```python
# 1. Optimal file sizes
# Target: 128MB - 1GB per file

# Check current file sizes
spark.sql("""
    DESCRIBE DETAIL delta.`/lakehouse/events`
""").select("numFiles", "sizeInBytes").show()

# Calculate average file size
detail = spark.sql("DESCRIBE DETAIL delta.`/lakehouse/events`").collect()[0]
avg_file_size_mb = (detail["sizeInBytes"] / detail["numFiles"]) / (1024 * 1024)
print(f"Average file size: {avg_file_size_mb:.2f} MB")

# Compact if files are too small
if avg_file_size_mb < 64:
    DeltaTable.forPath(spark, "/lakehouse/events").optimize().executeCompaction()

# 2. Optimal partition strategy
# Rule of thumb: 1GB+ per partition

# Check partition sizes
spark.sql("""
    SELECT
        event_date,
        COUNT(*) as num_files,
        SUM(size) / 1024 / 1024 as size_mb
    FROM delta.`/lakehouse/events`
    GROUP BY event_date
    ORDER BY size_mb
""").show()

# Repartition if needed
df.repartition(col("event_date")) \
    .write.format("delta") \
    .mode("overwrite") \
    .partitionBy("event_date") \
    .save("/lakehouse/events_optimized")

# 3. Column ordering for better compression
# Put low-cardinality columns first for better compression

schema_order = [
    "event_type",     # Low cardinality
    "status",         # Low cardinality
    "event_date",     # Partition column
    "user_id",        # Medium cardinality
    "event_id",       # High cardinality (unique)
    "properties"      # Complex type
]
```

### Caching Strategies

```python
# 1. Delta caching (Databricks)
# Automatic caching of frequently accessed data
spark.conf.set("spark.databricks.io.cache.enabled", "true")
spark.conf.set("spark.databricks.io.cache.maxDiskUsage", "50g")
spark.conf.set("spark.databricks.io.cache.maxMetaDataCache", "1g")

# 2. Result caching for repeated queries
spark.conf.set("spark.sql.cache.serializer", "org.apache.spark.sql.catalyst.expressions.UnsafeRowSerializer")

# Cache gold tables that are frequently queried
spark.sql("CACHE TABLE enterprise.gold.daily_metrics")

# 3. Materialized views (Databricks)
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

# Refresh materialized view
spark.sql("REFRESH MATERIALIZED VIEW enterprise.gold.mv_weekly_summary")

# 4. Predictive optimization (Databricks)
# Automatically optimizes tables based on usage patterns
spark.sql("""
    ALTER TABLE enterprise.gold.events
    SET TBLPROPERTIES ('delta.enablePredictiveOptimization' = 'true')
""")
```

## Real-World Scenarios

### Unified Analytics Platform

```python
# Scenario: Build a unified analytics platform serving multiple teams

# Architecture:
"""
+-------------------------------------------------------------------+
|                    Unified Lakehouse Platform                      |
+-------------------------------------------------------------------+
|                                                                    |
|  Data Sources:          Processing:           Consumers:          |
|  +-------------+        +-------------+       +-------------+     |
|  | Databases   |------->|   Bronze    |       | BI Tools    |     |
|  | APIs        |        |   Layer     |       | (Tableau)   |     |
|  | Streams     |        +------+------+       +-------------+     |
|  | Files       |               |              +-------------+     |
|  +-------------+        +------v------+       | Data Science|     |
|                         |   Silver    |------>| (Notebooks) |     |
|                         |   Layer     |       +-------------+     |
|                         +------+------+       +-------------+     |
|                                |              | ML Platform |     |
|                         +------v------+       | (MLflow)    |     |
|                         |    Gold     |------>+-------------+     |
|                         |   Layer     |       +-------------+     |
|                         +-------------+       | Applications|     |
|                                               | (APIs)      |     |
+-------------------------------------------------------------------+
"""

# Implementation
class UnifiedAnalyticsPlatform:
    def __init__(self, spark):
        self.spark = spark
        self.catalog = "enterprise"

    def setup_schemas(self):
        """Create schema structure for different teams."""
        schemas = {
            "bronze": "Raw data landing zone",
            "silver": "Cleansed and conformed data",
            "gold_finance": "Finance team aggregates",
            "gold_marketing": "Marketing analytics",
            "gold_product": "Product metrics",
            "sandbox": "Experimentation area"
        }

        for schema, desc in schemas.items():
            self.spark.sql(f"""
                CREATE SCHEMA IF NOT EXISTS {self.catalog}.{schema}
                COMMENT '{desc}'
            """)

    def configure_access(self):
        """Setup role-based access control."""
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
        """Create shared dimension tables."""
        # Date dimension
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

# Usage
platform = UnifiedAnalyticsPlatform(spark)
platform.setup_schemas()
platform.configure_access()
platform.create_shared_dimensions()
```

### Real-Time + Batch Processing

```python
# Scenario: Lambda architecture replacement with unified lakehouse

# Traditional Lambda (complex):
"""
                    +-------------+
        +---------->| Batch Layer |--------+
        |           +-------------+        |
Raw Data|                                  +---> Serving
        |           +-------------+        |     Layer
        +---------->| Speed Layer |--------+
                    +-------------+

Problems: Code duplication, complexity, inconsistency
"""

# Lakehouse (unified):
"""
                    +---------------------------+
Raw Data ---------> |     Lakehouse (Delta)     | ---> All Consumers
(Streaming)         | Bronze -> Silver -> Gold  |
                    +---------------------------+

Benefits: Single codebase, consistency, simplicity
"""

# Implementation
def create_unified_streaming_batch_pipeline():
    """Unified pipeline handling both streaming and batch."""

    # Single source definition
    events_schema = StructType([
        StructField("event_id", StringType(), False),
        StructField("event_type", StringType(), False),
        StructField("user_id", StringType(), True),
        StructField("timestamp", TimestampType(), False),
        StructField("amount", DecimalType(10, 2), True)
    ])

    # Streaming ingestion to Bronze
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

    # Batch backfill to Bronze (same table)
    def backfill_historical_data(source_path: str):
        historical_df = spark.read \
            .schema(events_schema) \
            .json(source_path)

        historical_df.write.format("delta") \
            .mode("append") \
            .save("/lakehouse/bronze/events")

    # Unified Silver processing (works for both)
    def process_silver():
        # Can read as stream or batch
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

    # Gold: Real-time aggregations
    def create_realtime_gold():
        gold_stream = spark.readStream \
            .format("delta") \
            .load("/lakehouse/silver/events")

        # 5-minute windowed aggregations
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

    # Gold: Daily batch aggregations
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

### ML Feature Store

```python
# Scenario: Lakehouse as ML Feature Store

class LakehouseFeatureStore:
    """Feature store built on lakehouse architecture."""

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
        """Register a new feature group in the catalog."""
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
        """Create or update a feature group."""
        feature_df = source_df.select(
            entity_key,
            timestamp_col,
            *features
        ).withColumn("_feature_timestamp", current_timestamp())

        path = f"{self.feature_path}/{name}"

        if DeltaTable.isDeltaTable(self.spark, path):
            # Merge new features
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
        """Get features for entities with optional point-in-time join."""
        result = entity_df

        for fg_name in feature_groups:
            fg_df = self.spark.read.format("delta") \
                .load(f"{self.feature_path}/{fg_name}")

            if point_in_time and timestamp_col:
                # Point-in-time correct join
                result = result.alias("e").join(
                    fg_df.alias("f"),
                    (col("e." + entity_key) == col("f." + entity_key)) &
                    (col("f." + timestamp_col) <= col("e." + timestamp_col))
                ).select("e.*", "f.*")

                # Get latest feature before event
                window = Window.partitionBy(
                    "e." + entity_key,
                    "e." + timestamp_col
                ).orderBy(col("f." + timestamp_col).desc())

                result = result \
                    .withColumn("rn", row_number().over(window)) \
                    .filter("rn = 1") \
                    .drop("rn")
            else:
                # Simple join
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
        """Create training dataset with point-in-time features."""
        return self.get_features(
            feature_groups,
            labels_df,
            entity_key,
            timestamp_col,
            point_in_time=True
        )

# Usage
feature_store = LakehouseFeatureStore(spark, "/lakehouse")

# Create user features
user_events = spark.read.format("delta").load("/lakehouse/silver/events")

user_features = user_events.groupBy("user_id").agg(
    count("*").alias("total_events"),
    sum("amount").alias("total_spent"),
    avg("amount").alias("avg_order_value"),
    max("timestamp").alias("last_activity")
)

feature_store.register_feature_group(
    name="user_activity",
    description="User activity aggregations",
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

# Get training dataset
labels = spark.read.format("delta").load("/lakehouse/gold/user_labels")

training_data = feature_store.get_training_dataset(
    labels_df=labels,
    feature_groups=["user_activity", "user_demographics"],
    entity_key="user_id",
    timestamp_col="label_date"
)
```

## Interview Key Points

### Common Interview Questions

**Q1: What is a Lakehouse and how does it differ from a Data Lake and Data Warehouse?**

```
Lakehouse = Data Lake storage + Data Warehouse capabilities

Data Lake:
- Cheap object storage (S3, ADLS, GCS)
- Schema-on-read (flexible)
- All data types (structured, semi, unstructured)
- No ACID transactions (reliability issues)
- "Data swamp" problems

Data Warehouse:
- Expensive proprietary storage
- Schema-on-write (rigid)
- Structured data only
- ACID transactions (reliable)
- SQL-based analytics

Lakehouse:
- Cheap object storage (like data lake)
- Schema enforcement + evolution (best of both)
- All data types (like data lake)
- ACID transactions (like warehouse)
- Unified analytics + ML workloads
```

**Q2: What are the key components of a Lakehouse architecture?**

```
1. Storage Layer
   - Object storage (S3, ADLS, GCS)
   - Open file formats (Parquet, ORC)

2. Open Table Format
   - Delta Lake, Apache Iceberg, Apache Hudi
   - Provides ACID transactions
   - Schema enforcement
   - Time travel

3. Metadata Layer
   - Catalog (Unity Catalog, Hive Metastore)
   - Schema management
   - Statistics for optimization

4. Query Engine
   - Spark SQL, Presto/Trino, DuckDB
   - Supports SQL and DataFrame APIs

5. Governance Layer
   - Access control
   - Audit logging
   - Data lineage
   - Quality monitoring
```

**Q3: How do open table formats (Delta Lake, Iceberg, Hudi) enable ACID transactions?**

```
Transaction Log Architecture:

1. Write-Ahead Logging
   - All changes recorded in transaction log first
   - Log entries are atomic JSON/Avro files

2. Optimistic Concurrency Control
   - Multiple writers can work concurrently
   - Conflicts detected at commit time
   - Failed transactions retry

3. Snapshot Isolation
   - Readers see consistent point-in-time view
   - Writers don't block readers

4. Atomic Commits
   - New data files written first
   - Single atomic write to commit log
   - Either entire commit succeeds or fails

Example (Delta Lake):
_delta_log/
  00000000.json  <- Version 0 (initial)
  00000001.json  <- Version 1 (update)
  00000010.checkpoint.parquet  <- Checkpoint for fast reads
```

**Q4: Explain the Medallion Architecture (Bronze/Silver/Gold)**

```
Bronze Layer (Raw):
- Landing zone for raw data
- Minimal transformation
- Append-only, preserves source fidelity
- Schema evolution enabled
- Use case: Auditing, reprocessing

Silver Layer (Cleansed):
- Validated and deduplicated
- Conformed data types
- Business keys established
- Join-ready quality
- Use case: Analysis, feature engineering

Gold Layer (Aggregated):
- Business-level metrics
- Denormalized for performance
- Dashboard and report ready
- Optimized for specific use cases
- Use case: BI, ML models, APIs

Key Principles:
- Data flows downstream only
- Each layer has clear SLAs
- Governance increases with layers
```

**Q5: When would you choose Delta Lake vs Iceberg vs Hudi?**

```
Choose Delta Lake when:
- Using Databricks ecosystem
- Need tight Spark integration
- Heavy MERGE/UPDATE workloads
- Unified streaming + batch

Choose Apache Iceberg when:
- Multi-engine access required (Spark, Trino, Flink)
- Need partition evolution
- Very large tables (petabyte+)
- Hidden partitioning is valuable

Choose Apache Hudi when:
- Record-level updates dominant
- Near real-time ingestion required
- Strong CDC requirements
- Incremental processing focus

All three provide:
- ACID transactions
- Schema evolution
- Time travel
- Efficient upserts
```

### System Design Considerations

```python
# Designing a lakehouse for interviews

"""
Requirements Analysis Questions:
1. Data volume (GB/TB/PB)?
2. Latency requirements (real-time/near real-time/batch)?
3. User types (analysts/data scientists/applications)?
4. Query patterns (ad-hoc/dashboards/ML)?
5. Data sensitivity (PII/compliance)?

Design Considerations:

1. Table Format Selection
   - Evaluate Delta vs Iceberg vs Hudi
   - Consider ecosystem and team skills

2. Partitioning Strategy
   - Low cardinality for partitions
   - Target 1GB+ per partition
   - Consider time-based + functional

3. Storage Optimization
   - File sizes: 128MB-1GB
   - Compaction schedule
   - Z-Ordering for frequent filters

4. Query Performance
   - Caching strategy
   - Materialized views
   - Statistics collection

5. Governance
   - Access control model
   - Data classification
   - Lineage tracking

6. Cost Optimization
   - Storage tiering
   - Compute right-sizing
   - Retention policies
"""
```

## Further Reading

### Essential Papers and Documentation

- **Databricks Lakehouse Paper**: [Lakehouse: A New Generation of Open Platforms](https://www.cidrdb.org/cidr2021/papers/cidr2021_paper17.pdf) - The foundational paper introducing the lakehouse concept
- **Delta Lake Documentation**: [docs.delta.io](https://docs.delta.io) - Comprehensive Delta Lake reference
- **Apache Iceberg Documentation**: [iceberg.apache.org](https://iceberg.apache.org/docs/latest/) - Iceberg table format documentation
- **Apache Hudi Documentation**: [hudi.apache.org](https://hudi.apache.org/docs/overview) - Hudi documentation and tutorials

### Recommended Books

- **"The Data Lakehouse"** by Bill Inmon, Mary Levins - Comprehensive guide to lakehouse architecture
- **"Delta Lake: The Definitive Guide"** by Denny Lee, Tathagata Das - Deep dive into Delta Lake
- **"Fundamentals of Data Engineering"** by Joe Reis, Matt Housley - Modern data architecture patterns

### Online Resources

- [Databricks Blog](https://www.databricks.com/blog) - Latest lakehouse patterns and best practices
- [Apache Iceberg Community](https://iceberg.apache.org/community/) - Iceberg community resources
- [Data Engineering Weekly](https://www.dataengineeringweekly.com/) - Industry news and trends

### Related Topics

- **Data Mesh**: Decentralized data architecture that complements lakehouse
- **Data Contracts**: Schema management and API guarantees
- **Feature Stores**: ML-specific lakehouse patterns
- **Streaming Architectures**: Kappa architecture and streaming-first designs
- **Data Observability**: Monitoring and quality in lakehouse environments

---

The Lakehouse architecture represents the future of data platforms, combining the economics and flexibility of data lakes with the reliability and performance of data warehouses. By building on open standards and formats, lakehouses enable organizations to consolidate their data infrastructure while supporting diverse workloads from BI to machine learning. Success with lakehouse architecture requires understanding both the technical components (table formats, query engines, governance) and the organizational practices (medallion architecture, data quality, cost management) that make it effective at scale.
