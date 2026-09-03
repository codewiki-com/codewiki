---
title: Apache Hudi Data Lake
description: A comprehensive guide to Apache Hudi - the transactional data lake platform for incremental processing
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
origin: old/src/content/docs/data/apache-hudi.en.md
divergence: 0.207
issues: []
legacy:
  category: Data
  subcategory: Data Lake
  order: 23
  lastUpdated: 2026-01-20
---

Apache Hudi (Hadoop Upserts Deletes and Incrementals) is an open-source data lake platform designed for efficient incremental data processing and near real-time analytics. Originally developed at Uber to solve streaming data ingestion challenges, Hudi has become one of the three major open table formats alongside Apache Iceberg and Delta Lake. What sets Hudi apart is its first-class support for record-level updates, efficient upsert operations, and built-in CDC (Change Data Capture) capabilities that make it ideal for streaming data pipelines and real-time data lakes.

## What is Apache Hudi?

### The Problem Hudi Solves

Traditional data lakes built on HDFS or cloud object storage face significant challenges when dealing with mutable data:

**Traditional Data Lake Limitations:**

| Challenge | Impact |
|-----------|--------|
| No record-level updates | Must rewrite entire partitions for single row changes |
| CDC complexity | Change data capture requires complex external tooling |
| Batch-only processing | Cannot handle near real-time data requirements |
| No incremental queries | Must re-scan entire datasets for changes |
| Data freshness issues | Long latency between data arrival and availability |
| Write amplification | Small updates cause large rewrites |

### How Hudi Addresses These Challenges

Hudi introduces a **storage layer** that brings record-level operations to data lakes:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Apache Hudi Architecture                    │
├─────────────────────────────────────────────────────────────────┤
│  Query Engines      │  Spark, Flink, Presto, Trino, Hive        │
├─────────────────────────────────────────────────────────────────┤
│  Hudi Table Format  │  Timeline, Index, Compaction, Clustering  │
├─────────────────────────────────────────────────────────────────┤
│  Storage Layer      │  HDFS, S3, GCS, Azure Blob, MinIO         │
├─────────────────────────────────────────────────────────────────┤
│  File Formats       │  Parquet (primary), ORC, HFile            │
└─────────────────────────────────────────────────────────────────┘
```

**Key Value Propositions:**

- **Record-level Operations**: Efficient INSERT, UPDATE, DELETE at record level
- **Incremental Processing**: Process only changed data, not entire datasets
- **Near Real-time Ingestion**: Sub-minute latency for streaming data
- **Built-in CDC**: Native support for change data capture workflows
- **ACID Transactions**: Serializable isolation with optimistic concurrency
- **Time Travel**: Query historical snapshots and audit changes

### Hudi vs. Iceberg vs. Delta Lake

| Feature | Apache Hudi | Apache Iceberg | Delta Lake |
|---------|-------------|----------------|------------|
| **Origin** | Uber | Netflix | Databricks |
| **Primary Focus** | Incremental processing, CDC | Schema/Partition evolution | Unified batch/streaming |
| **Table Types** | Copy-on-Write, Merge-on-Read | Single format (COW/MOR modes) | Single format |
| **Index Support** | Bloom, HBase, Bucket, Record-level | Partition-level only | Partition-level only |
| **Compaction** | Synchronous/Asynchronous | Manual/Scheduled | Auto-optimize |
| **Incremental Query** | First-class support | Snapshot-based | Change Data Feed |
| **Write Latency** | Sub-minute possible | Minutes | Minutes |
| **Record-level Upsert** | Optimized (indexed) | Full partition scan | Full partition scan |
| **Streaming Native** | Yes (DeltaStreamer) | Via Flink integration | Via Spark Streaming |
| **Concurrency Control** | OCC with file-level locking | OCC with snapshot isolation | OCC with version conflicts |

**When to Choose Hudi:**

- High-frequency upsert workloads (CDC, event streams)
- Near real-time data freshness requirements
- Incremental ETL pipelines
- Record-level indexing needs
- Streaming-first architectures

## Core Architecture

### Timeline: The Heart of Hudi

The Timeline is Hudi's core metadata structure that tracks all operations on a table as a sequence of **Instants**:

```
Timeline Structure:
─────────────────────────────────────────────────────────────────►
│ t1        │ t2        │ t3        │ t4        │ t5        │
│ COMMIT    │ COMMIT    │ DELTA     │ COMPACT   │ COMMIT    │
│ (bulk)    │ (upsert)  │ (upsert)  │           │ (upsert)  │
└───────────┴───────────┴───────────┴───────────┴───────────┘

Each Instant contains:
├── <instant_time>.commit              (completed commits)
├── <instant_time>.inflight            (in-progress operations)
├── <instant_time>.requested           (scheduled operations)
├── <instant_time>.deltacommit         (MOR delta commits)
├── <instant_time>.compaction.requested (scheduled compactions)
└── <instant_time>.compaction.inflight (in-progress compactions)
```

**Instant States:**

| State | Description |
|-------|-------------|
| `REQUESTED` | Action scheduled but not started |
| `INFLIGHT` | Action in progress |
| `COMPLETED` | Action finished successfully |

**Action Types:**

| Action | Description |
|--------|-------------|
| `COMMIT` | COW table write completion |
| `DELTACOMMIT` | MOR table write completion |
| `COMPACTION` | Merge delta logs into base files |
| `CLUSTERING` | Reorganize data layout |
| `CLEAN` | Remove old file versions |
| `ROLLBACK` | Undo failed operations |
| `SAVEPOINT` | Mark snapshot for retention |
| `RESTORE` | Revert to savepoint |

### Table Types: Copy-on-Write vs Merge-on-Read

Hudi provides two table types optimized for different workloads:

#### Copy-on-Write (COW)

```
COW Write Operation:
┌──────────────┐    Update    ┌──────────────┐
│  Base File   │  ────────►   │  New Base    │
│  (Parquet)   │   Record     │   File       │
│  v1          │              │   v2         │
└──────────────┘              └──────────────┘

Timeline:
t1: file_1.parquet (100 records)
t2: file_1.parquet deleted, file_2.parquet created (100 records, 1 updated)
```

**COW Characteristics:**

- Data stored entirely in columnar files (Parquet)
- Updates rewrite entire file containing the record
- Best read performance (no merge required)
- Higher write amplification
- Suitable for: Read-heavy workloads, batch updates, small tables

#### Merge-on-Read (MOR)

```
MOR Write Operation:
┌──────────────┐              ┌──────────────┐
│  Base File   │              │  Base File   │  (unchanged)
│  (Parquet)   │              │  (Parquet)   │
└──────────────┘              └──────────────┘
                    Update           +
                  ────────►   ┌──────────────┐
                              │  Log File    │  (appended)
                              │  (.log)      │
                              └──────────────┘

Read Operation (Snapshot Query):
Base File + Log Files = Merged View
```

**MOR Characteristics:**

- Updates written to row-based log files
- Base files remain unchanged until compaction
- Lower write latency and write amplification
- Slight read overhead (merge at query time)
- Background compaction merges logs into base files
- Suitable for: Write-heavy workloads, streaming ingestion, frequent updates

**Comparison:**

| Aspect | Copy-on-Write | Merge-on-Read |
|--------|---------------|---------------|
| Write Latency | Higher | Lower |
| Read Latency | Lower | Higher (without compaction) |
| Write Amplification | Higher | Lower |
| Storage Overhead | Lower | Higher (logs + base) |
| Compaction Needed | No | Yes |
| Best For | Read-heavy, batch | Write-heavy, streaming |

### Indexing Mechanisms

Hudi's indexing is what enables efficient record-level operations at scale:

#### Bloom Index (Default)

```
Bloom Index Operation:
┌─────────────────────────────────────────────────────────────────┐
│ Incoming Record: {id: 12345, name: "Alice", amount: 100}        │
├─────────────────────────────────────────────────────────────────┤
│ Step 1: Hash record key (id: 12345)                             │
│ Step 2: Check bloom filters in file footers                     │
│         file_1.parquet: bloom(12345) = MAYBE PRESENT           │
│         file_2.parquet: bloom(12345) = DEFINITELY NOT PRESENT  │
│         file_3.parquet: bloom(12345) = DEFINITELY NOT PRESENT  │
│ Step 3: Scan only file_1.parquet to confirm                     │
│ Step 4: Update file_1 (COW) or append to file_1.log (MOR)      │
└─────────────────────────────────────────────────────────────────┘
```

**Configuration:**

```properties
hoodie.index.type=BLOOM
hoodie.bloom.index.filter.type=DYNAMIC_V0
hoodie.bloom.index.filter.dynamic.max.entries=100000
hoodie.index.bloom.num.entries=60000
hoodie.index.bloom.fpp=0.000000001
```

#### Simple Index

Uses partition path + record key to locate files. Good for append-heavy workloads.

```properties
hoodie.index.type=SIMPLE
```

#### Bucket Index

Hash-based bucketing for predictable file locations:

```properties
hoodie.index.type=BUCKET
hoodie.bucket.index.num.buckets=256
hoodie.bucket.index.hash.field=record_key
```

#### HBase Index

External HBase for global index (large tables with many updates):

```properties
hoodie.index.type=HBASE
hoodie.index.hbase.zkquorum=zk1:2181,zk2:2181
hoodie.index.hbase.zkport=2181
hoodie.index.hbase.table=hudi_index_table
```

#### Record-level Index (Hudi 0.13+)

Metadata-table-based index for O(1) record lookups:

```properties
hoodie.index.type=RECORD_INDEX
hoodie.metadata.index.column.stats.enable=true
hoodie.metadata.index.bloom.filter.enable=true
```

### File Layout

```
hudi_table/
├── .hoodie/                           # Metadata directory
│   ├── hoodie.properties              # Table configuration
│   ├── 20240115100000.commit          # Completed commit
│   ├── 20240115100000.commit.requested
│   ├── 20240115110000.deltacommit     # MOR delta commit
│   ├── 20240115120000.compaction.requested
│   └── archived/                      # Archived timeline
├── 2024/01/15/                        # Partition path
│   ├── file_1_<write_token>_<file_id>.parquet    # Base file
│   ├── .file_1_<instant>_<file_id>.log           # Log file (MOR)
│   └── .hoodie_partition_metadata     # Partition metadata
└── 2024/01/16/
    └── ...
```

## Core Operations

### Write Operations

#### Insert

Bulk insert new records without checking for duplicates:

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("HudiInsert") \
    .config("spark.serializer", "org.apache.spark.serializer.KryoSerializer") \
    .config("spark.sql.extensions", "org.apache.spark.sql.hudi.HoodieSparkSessionExtension") \
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.hudi.catalog.HoodieCatalog") \
    .getOrCreate()

# Sample data
data = [
    (1, "Alice", "Engineering", 75000, "2024-01-15"),
    (2, "Bob", "Marketing", 65000, "2024-01-15"),
    (3, "Charlie", "Engineering", 80000, "2024-01-15")
]

df = spark.createDataFrame(data, ["id", "name", "department", "salary", "date"])

# Bulk insert (no dedup check)
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

#### Upsert (Default)

Insert new records and update existing ones:

```python
# New and updated data
updates = [
    (1, "Alice", "Engineering", 78000, "2024-01-16"),  # Update: salary change
    (4, "Diana", "Sales", 70000, "2024-01-16")         # Insert: new employee
]

df_updates = spark.createDataFrame(updates, ["id", "name", "department", "salary", "date"])

# Upsert operation
hudi_options = {
    "hoodie.table.name": "employees",
    "hoodie.datasource.write.table.type": "COPY_ON_WRITE",
    "hoodie.datasource.write.operation": "upsert",
    "hoodie.datasource.write.recordkey.field": "id",
    "hoodie.datasource.write.partitionpath.field": "date",
    "hoodie.datasource.write.precombine.field": "salary",  # Higher salary wins
    "hoodie.index.type": "BLOOM"
}

df_updates.write.format("hudi") \
    .options(**hudi_options) \
    .mode("append") \
    .save("/data/hudi/employees")
```

#### Delete

Hard delete or soft delete records:

```python
# Hard delete
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

# Soft delete (mark as deleted)
from pyspark.sql.functions import lit

soft_delete_df = spark.createDataFrame([(3, "2024-01-15")], ["id", "date"]) \
    .withColumn("_hoodie_is_deleted", lit(True))

hudi_options["hoodie.datasource.write.operation"] = "upsert"

soft_delete_df.write.format("hudi") \
    .options(**hudi_options) \
    .mode("append") \
    .save("/data/hudi/employees")
```

#### Insert Overwrite

Replace entire partitions:

```python
# Overwrite specific partition
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

### Query Types

#### Snapshot Query

Returns the latest committed state of the table:

```python
# Read latest snapshot
df = spark.read.format("hudi").load("/data/hudi/employees")
df.show()

# SQL query
spark.sql("""
    SELECT * FROM hudi.`/data/hudi/employees`
    WHERE department = 'Engineering'
""").show()
```

#### Incremental Query

Returns only records changed since a given commit time:

```python
# Get changes since a specific commit
incremental_options = {
    "hoodie.datasource.query.type": "incremental",
    "hoodie.datasource.read.begin.instanttime": "20240115100000",
    "hoodie.datasource.read.end.instanttime": "20240116100000"  # Optional
}

incremental_df = spark.read.format("hudi") \
    .options(**incremental_options) \
    .load("/data/hudi/employees")

# This returns:
# - All inserts after begin time
# - All updates after begin time
# - Includes _hoodie_is_deleted for soft deletes

incremental_df.show()
```

#### Read Optimized Query (MOR Only)

Returns data from base files only, skipping log files:

```python
# Read optimized (MOR tables only)
read_optimized_df = spark.read.format("hudi") \
    .option("hoodie.datasource.query.type", "read_optimized") \
    .load("/data/hudi/employees_mor")

# Faster but may not include recent updates
```

#### Time Travel Query

Query historical snapshots:

```python
# Query specific commit
historical_df = spark.read.format("hudi") \
    .option("as.of.instant", "20240115100000") \
    .load("/data/hudi/employees")

# Query by timestamp
from datetime import datetime
timestamp = datetime(2024, 1, 15, 10, 0, 0)

historical_df = spark.read.format("hudi") \
    .option("as.of.instant", timestamp.strftime("%Y%m%d%H%M%S")) \
    .load("/data/hudi/employees")
```

### Schema Evolution

Hudi supports flexible schema evolution:

```python
# Add new column
df_with_email = df.withColumn("email", lit(None).cast("string"))

hudi_options = {
    "hoodie.table.name": "employees",
    "hoodie.datasource.write.operation": "upsert",
    "hoodie.datasource.write.recordkey.field": "id",
    "hoodie.datasource.write.partitionpath.field": "date",
    "hoodie.datasource.write.precombine.field": "id",
    # Enable schema evolution
    "hoodie.schema.on.read.enable": "true",
    "hoodie.datasource.write.reconcile.schema": "true"
}

df_with_email.write.format("hudi") \
    .options(**hudi_options) \
    .mode("append") \
    .save("/data/hudi/employees")

# SQL ALTER TABLE (Hudi 0.13+)
spark.sql("""
    ALTER TABLE employees ADD COLUMNS (
        phone STRING COMMENT 'Contact phone'
    )
""")

spark.sql("""
    ALTER TABLE employees ALTER COLUMN salary TYPE BIGINT
""")
```

## Compaction and Clustering

### Compaction (MOR Tables)

Compaction merges log files into base files for MOR tables:

```python
# Inline compaction (during write)
hudi_options = {
    "hoodie.table.name": "events",
    "hoodie.datasource.write.table.type": "MERGE_ON_READ",
    "hoodie.compact.inline": "true",
    "hoodie.compact.inline.max.delta.commits": "5"
}

# Async compaction
hudi_options = {
    "hoodie.table.name": "events",
    "hoodie.datasource.write.table.type": "MERGE_ON_READ",
    "hoodie.compact.inline": "false",
    "hoodie.compact.schedule.inline": "true"  # Schedule but don't execute
}

# Run compaction separately
from pyspark.sql import SparkSession

spark.sql("""
    CALL run_compaction(
        table => 'hudi.events',
        op => 'run',
        instants => '20240115100000'
    )
""")

# Or using HoodieCompactor
from org.apache.hudi.utilities import HoodieCompactor

# CLI command
# spark-submit --class org.apache.hudi.utilities.HoodieCompactor \
#     hudi-utilities-bundle.jar \
#     --base-path /data/hudi/events \
#     --table-name events \
#     --instant-time 20240115100000 \
#     --parallelism 100
```

**Compaction Strategies:**

```python
# Strategy: Log file size based
hudi_options["hoodie.compaction.strategy"] = "org.apache.hudi.table.action.compact.strategy.LogFileSizeBasedCompactionStrategy"
hudi_options["hoodie.compaction.logfile.size.threshold"] = "104857600"  # 100MB

# Strategy: Number of delta commits
hudi_options["hoodie.compaction.strategy"] = "org.apache.hudi.table.action.compact.strategy.BoundedIOCompactionStrategy"

# Strategy: Day based (compact old partitions)
hudi_options["hoodie.compaction.strategy"] = "org.apache.hudi.table.action.compact.strategy.DayBasedCompactionStrategy"
hudi_options["hoodie.compaction.daybased.target.partitions"] = "7"
```

### Clustering

Clustering reorganizes data layout for better query performance:

```python
# Enable inline clustering
hudi_options = {
    "hoodie.table.name": "events",
    "hoodie.clustering.inline": "true",
    "hoodie.clustering.inline.max.commits": "4",
    "hoodie.clustering.plan.strategy.target.file.max.bytes": "1073741824",  # 1GB
    "hoodie.clustering.plan.strategy.small.file.limit": "629145600",  # 600MB

    # Clustering execution strategy
    "hoodie.clustering.execution.strategy.class":
        "org.apache.hudi.client.clustering.run.strategy.SparkSortAndSizeExecutionStrategy",

    # Sort columns for better data locality
    "hoodie.clustering.plan.strategy.sort.columns": "user_id,event_time"
}

# Z-Order clustering for multi-dimensional queries
hudi_options["hoodie.clustering.plan.strategy.sort.columns"] = "user_id,event_type"
hudi_options["hoodie.layout.optimize.enable"] = "true"
hudi_options["hoodie.layout.optimize.strategy"] = "z-order"

# Run clustering manually
spark.sql("""
    CALL run_clustering(
        table => 'hudi.events',
        predicate => 'date >= "2024-01-01"',
        order => 'user_id'
    )
""")
```

## Spark Integration

### Spark Configuration

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

### Creating Hudi Tables with SQL

```sql
-- Create COW table
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

-- Create MOR table
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

-- Insert data
INSERT INTO hudi_cow_table
SELECT 1, 'Product A', 99.99, current_timestamp(), '2024-01-15';

-- Upsert with MERGE
MERGE INTO hudi_cow_table AS target
USING updates AS source
ON target.id = source.id
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *;

-- Delete
DELETE FROM hudi_cow_table WHERE id = 1;

-- Time travel
SELECT * FROM hudi_cow_table TIMESTAMP AS OF '2024-01-15 10:00:00';
SELECT * FROM hudi_cow_table VERSION AS OF '20240115100000';
```

### Structured Streaming with Hudi

```python
from pyspark.sql.functions import *

# Stream from Kafka to Hudi
kafka_df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "kafka:9092") \
    .option("subscribe", "events") \
    .option("startingOffsets", "latest") \
    .load()

# Parse JSON events
events_df = kafka_df \
    .select(from_json(col("value").cast("string"), event_schema).alias("data")) \
    .select("data.*") \
    .withColumn("date", to_date("event_time"))

# Write to Hudi with streaming
hudi_options = {
    "hoodie.table.name": "streaming_events",
    "hoodie.datasource.write.table.type": "MERGE_ON_READ",
    "hoodie.datasource.write.operation": "upsert",
    "hoodie.datasource.write.recordkey.field": "event_id",
    "hoodie.datasource.write.partitionpath.field": "date",
    "hoodie.datasource.write.precombine.field": "event_time",

    # Streaming specific
    "hoodie.datasource.write.streaming.retry.count": "3",
    "hoodie.datasource.write.streaming.retry.interval.ms": "2000",

    # Index
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

## Flink Integration

### Flink Configuration

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

### Creating Hudi Tables in Flink

```sql
-- Create Hudi table with Flink
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

    -- Write options
    'write.operation' = 'upsert',
    'write.precombine.field' = 'ts',
    'write.tasks' = '4',
    'write.bucket_assign.tasks' = '4',

    -- Compaction
    'compaction.async.enabled' = 'true',
    'compaction.trigger.strategy' = 'num_commits',
    'compaction.delta_commits' = '5',

    -- Index
    'index.type' = 'BUCKET',
    'hoodie.bucket.index.num.buckets' = '4'
);

-- Stream from Kafka to Hudi
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

-- Insert streaming data
INSERT INTO hudi_flink_table
SELECT
    id,
    name,
    price,
    ts,
    DATE_FORMAT(ts, 'yyyy-MM-dd') as `date`
FROM kafka_source;
```

### Flink CDC to Hudi

```sql
-- MySQL CDC source
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

-- Hudi sink with CDC mode
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

-- Replicate CDC changes
INSERT INTO hudi_users
SELECT
    id,
    name,
    email,
    updated_at,
    DATE_FORMAT(updated_at, 'yyyy-MM-dd') as `date`
FROM mysql_cdc_source;
```

## DeltaStreamer: CDC and Incremental ETL

### DeltaStreamer Overview

DeltaStreamer is Hudi's utility for continuous ingestion from various sources:

```bash
# Basic DeltaStreamer command
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

### DeltaStreamer Configuration

```properties
# deltastreamer.properties

# Source configuration (Kafka)
hoodie.deltastreamer.source.kafka.topic=events
hoodie.deltastreamer.source.kafka.value.deserializer.class=io.confluent.kafka.serializers.KafkaAvroDeserializer
bootstrap.servers=kafka:9092
auto.offset.reset=earliest
schema.registry.url=http://schema-registry:8081

# Target table
hoodie.datasource.write.recordkey.field=event_id
hoodie.datasource.write.partitionpath.field=date
hoodie.datasource.write.precombine.field=event_time

# Index
hoodie.index.type=BLOOM
hoodie.bloom.index.parallelism=100

# Compaction
hoodie.compact.inline=false
hoodie.compact.inline.max.delta.commits=5
hoodie.compaction.async.enabled=true

# Cleaning
hoodie.clean.automatic=true
hoodie.cleaner.commits.retained=10
hoodie.cleaner.policy=KEEP_LATEST_COMMITS

# Clustering
hoodie.clustering.inline=false
hoodie.clustering.schedule.inline=true
hoodie.clustering.async.enabled=true
```

### DeltaStreamer with Debezium CDC

```properties
# Debezium CDC configuration
hoodie.deltastreamer.source.class=org.apache.hudi.utilities.sources.debezium.MysqlDebeziumSource

# MySQL Debezium settings
hoodie.deltastreamer.source.debezium.database.hostname=mysql
hoodie.deltastreamer.source.debezium.database.port=3306
hoodie.deltastreamer.source.debezium.database.user=debezium
hoodie.deltastreamer.source.debezium.database.password=password
hoodie.deltastreamer.source.debezium.database.dbname=production
hoodie.deltastreamer.source.debezium.database.tablename=orders

# Schema provider
hoodie.deltastreamer.schemaprovider.class=org.apache.hudi.utilities.schema.DebeziumSchemaRegistryProvider
hoodie.deltastreamer.schemaprovider.registry.url=http://schema-registry:8081

# CDC specific
hoodie.datasource.write.operation=upsert
hoodie.datasource.write.payload.class=org.apache.hudi.common.model.debezium.MySqlDebeziumAvroPayload
```

### Incremental ETL Pipeline

```python
# Incremental ETL: Bronze -> Silver -> Gold

# Step 1: Bronze - Raw ingestion
bronze_options = {
    "hoodie.table.name": "bronze_events",
    "hoodie.datasource.write.table.type": "MERGE_ON_READ",
    "hoodie.datasource.write.operation": "upsert",
    "hoodie.datasource.write.recordkey.field": "event_id",
    "hoodie.datasource.write.partitionpath.field": "date",
    "hoodie.datasource.write.precombine.field": "event_time"
}

# Step 2: Silver - Incremental read from Bronze, cleanse, write
def bronze_to_silver(spark, last_commit):
    # Incremental read from bronze
    bronze_incremental = spark.read.format("hudi") \
        .option("hoodie.datasource.query.type", "incremental") \
        .option("hoodie.datasource.read.begin.instanttime", last_commit) \
        .load("/data/hudi/bronze_events")

    # Data cleansing
    silver_df = bronze_incremental \
        .filter("event_id IS NOT NULL") \
        .filter("event_time IS NOT NULL") \
        .dropDuplicates(["event_id"]) \
        .withColumn("processed_time", current_timestamp())

    # Write to silver
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

# Step 3: Gold - Incremental aggregation
def silver_to_gold(spark, last_commit):
    # Incremental read from silver
    silver_incremental = spark.read.format("hudi") \
        .option("hoodie.datasource.query.type", "incremental") \
        .option("hoodie.datasource.read.begin.instanttime", last_commit) \
        .load("/data/hudi/silver_events")

    # Aggregate
    gold_df = silver_incremental \
        .groupBy("date", "event_type") \
        .agg(
            count("*").alias("event_count"),
            countDistinct("user_id").alias("unique_users")
        )

    # Merge with existing gold table
    gold_df.write.format("hudi") \
        .option("hoodie.table.name", "gold_metrics") \
        .option("hoodie.datasource.write.operation", "upsert") \
        .option("hoodie.datasource.write.recordkey.field", "date,event_type") \
        .option("hoodie.datasource.write.precombine.field", "event_count") \
        .mode("append") \
        .save("/data/hudi/gold_metrics")

# Get last commit time
def get_last_commit(spark, table_path):
    timeline = spark.read.format("hudi") \
        .load(table_path) \
        .select("_hoodie_commit_time") \
        .orderBy(col("_hoodie_commit_time").desc()) \
        .first()
    return timeline["_hoodie_commit_time"] if timeline else "0"
```

## Best Practices

### Table Type Selection

| Scenario | Recommended Type | Reason |
|----------|------------------|--------|
| Read-heavy, infrequent updates | COW | Best read performance |
| Write-heavy, frequent updates | MOR | Lower write latency |
| Streaming ingestion | MOR | Sub-minute latency |
| Batch ETL | COW | Simpler, no compaction |
| CDC workloads | MOR | Efficient change capture |
| Small tables (<1GB) | COW | Overhead not worth MOR |
| Large tables with updates | MOR | Better write efficiency |

### Index Strategy

```python
# Bloom Index: Default choice for most workloads
bloom_options = {
    "hoodie.index.type": "BLOOM",
    "hoodie.bloom.index.filter.dynamic.max.entries": "100000",
    "hoodie.index.bloom.num.entries": "60000",
    "hoodie.index.bloom.fpp": "0.000000001",
    "hoodie.bloom.index.parallelism": "100"
}

# Bucket Index: Predictable file locations
bucket_options = {
    "hoodie.index.type": "BUCKET",
    "hoodie.bucket.index.num.buckets": "256",
    "hoodie.bucket.index.hash.field": "user_id"
}

# Record Index: Large tables with global lookups
record_options = {
    "hoodie.index.type": "RECORD_INDEX",
    "hoodie.metadata.enable": "true",
    "hoodie.metadata.index.column.stats.enable": "true"
}

# HBase Index: Very large tables, high update rates
hbase_options = {
    "hoodie.index.type": "HBASE",
    "hoodie.index.hbase.zkquorum": "zk1:2181,zk2:2181",
    "hoodie.hbase.index.update.partition.path": "true"
}
```

### Compaction Tuning

```python
# Inline compaction for consistent read performance
inline_compaction = {
    "hoodie.compact.inline": "true",
    "hoodie.compact.inline.max.delta.commits": "5",
    "hoodie.compaction.lazy.block.read": "true",
    "hoodie.compaction.reverse.log.read": "true"
}

# Async compaction for write-heavy workloads
async_compaction = {
    "hoodie.compact.inline": "false",
    "hoodie.compact.schedule.inline": "true",
    "hoodie.compaction.async.enabled": "true",
    "hoodie.compact.inline.max.delta.commits": "10"
}

# Compaction scheduling strategies
# Time-based: Compact partitions older than N days
# Size-based: Compact when log files exceed threshold
# Commit-based: Compact after N delta commits
```

### Partition Strategy

```python
# Date-based partitioning (most common)
hudi_options = {
    "hoodie.datasource.write.partitionpath.field": "date",
    "hoodie.datasource.write.keygenerator.class":
        "org.apache.hudi.keygen.SimpleKeyGenerator"
}

# Multi-level partitioning
hudi_options = {
    "hoodie.datasource.write.partitionpath.field": "region,date",
    "hoodie.datasource.write.keygenerator.class":
        "org.apache.hudi.keygen.ComplexKeyGenerator"
}

# Custom partition format
hudi_options = {
    "hoodie.datasource.write.partitionpath.field": "ts",
    "hoodie.datasource.write.keygenerator.class":
        "org.apache.hudi.keygen.TimestampBasedKeyGenerator",
    "hoodie.deltastreamer.keygen.timebased.timestamp.type": "EPOCHMILLISECONDS",
    "hoodie.deltastreamer.keygen.timebased.output.dateformat": "yyyy/MM/dd"
}

# Non-partitioned table (for small lookup tables)
hudi_options = {
    "hoodie.datasource.write.partitionpath.field": "",
    "hoodie.datasource.write.keygenerator.class":
        "org.apache.hudi.keygen.NonpartitionedKeyGenerator"
}
```

## Common Pitfalls

### Small Files Problem

**Problem:** Too many small files degrade query performance.

```python
# Diagnosis: Check file sizes
spark.sql("""
    SELECT
        _hoodie_partition_path,
        COUNT(*) as num_files,
        AVG(input_file_size()) as avg_size_mb
    FROM hudi.events
    GROUP BY _hoodie_partition_path
    ORDER BY num_files DESC
""").show()

# Solution 1: Configure target file size
hudi_options = {
    "hoodie.parquet.max.file.size": "134217728",  # 128MB
    "hoodie.parquet.small.file.limit": "104857600",  # 100MB
    "hoodie.copyonwrite.insert.split.size": "100000"
}

# Solution 2: Enable clustering
hudi_options = {
    "hoodie.clustering.inline": "true",
    "hoodie.clustering.inline.max.commits": "4",
    "hoodie.clustering.plan.strategy.target.file.max.bytes": "134217728",
    "hoodie.clustering.plan.strategy.small.file.limit": "104857600"
}

# Solution 3: Use bulk_insert for initial loads
hudi_options["hoodie.datasource.write.operation"] = "bulk_insert"
hudi_options["hoodie.bulkinsert.shuffle.parallelism"] = "100"
```

### Compaction Delays

**Problem:** MOR table reads become slow due to accumulated log files.

```python
# Diagnosis: Check pending compactions
spark.sql("CALL show_compaction(table => 'events')").show()

# Check log file sizes
spark.read.format("hudi").load("/data/hudi/events") \
    .select("_hoodie_file_name") \
    .distinct() \
    .filter(col("_hoodie_file_name").contains(".log")) \
    .count()

# Solution 1: Reduce compaction trigger threshold
hudi_options = {
    "hoodie.compact.inline.max.delta.commits": "3",  # Compact more frequently
    "hoodie.compaction.strategy":
        "org.apache.hudi.table.action.compact.strategy.LogFileSizeBasedCompactionStrategy",
    "hoodie.compaction.logfile.size.threshold": "52428800"  # 50MB
}

# Solution 2: Run async compaction with more resources
# spark-submit with more executors for HoodieCompactor

# Solution 3: Schedule off-peak compaction
# Use external scheduler (Airflow, etc.) to trigger compaction
```

### Write Conflicts

**Problem:** Concurrent writes fail due to conflicts.

```python
# Diagnosis: Check failed commits
spark.sql("""
    SELECT * FROM hudi.events.commits
    WHERE state = 'FAILED'
    ORDER BY instant_time DESC
    LIMIT 10
""").show()

# Solution 1: Enable multi-writer (Hudi 0.12+)
hudi_options = {
    "hoodie.write.concurrency.mode": "optimistic_concurrency_control",
    "hoodie.cleaner.policy.failed.writes": "LAZY",
    "hoodie.write.lock.provider": "org.apache.hudi.client.transaction.lock.ZookeeperBasedLockProvider",
    "hoodie.write.lock.zookeeper.url": "zk1:2181,zk2:2181",
    "hoodie.write.lock.zookeeper.base_path": "/hudi/locks"
}

# Solution 2: Use file-based locking for single-writer
hudi_options = {
    "hoodie.write.lock.provider": "org.apache.hudi.client.transaction.lock.FileSystemBasedLockProvider"
}

# Solution 3: Partition writes by writer
# Each writer writes to different partitions
```

### Index Performance Issues

**Problem:** Bloom index false positives causing full scans.

```python
# Diagnosis: Check index lookup stats
# Enable metrics in spark.conf

# Solution 1: Tune bloom filter parameters
hudi_options = {
    "hoodie.index.bloom.fpp": "0.0000001",  # Lower FPP
    "hoodie.index.bloom.num.entries": "100000",  # More entries
    "hoodie.bloom.index.filter.dynamic.max.entries": "200000"
}

# Solution 2: Switch to bucket index for high-cardinality keys
hudi_options = {
    "hoodie.index.type": "BUCKET",
    "hoodie.bucket.index.num.buckets": "512"
}

# Solution 3: Use record-level index for global lookups
hudi_options = {
    "hoodie.index.type": "RECORD_INDEX",
    "hoodie.metadata.enable": "true"
}
```

## Performance Considerations

### Write Optimization

```python
# Parallelism tuning
hudi_options = {
    "hoodie.insert.shuffle.parallelism": "200",
    "hoodie.upsert.shuffle.parallelism": "200",
    "hoodie.bulkinsert.shuffle.parallelism": "200",
    "hoodie.bloom.index.parallelism": "200"
}

# Memory configuration
spark.conf.set("spark.executor.memory", "8g")
spark.conf.set("spark.driver.memory", "4g")
spark.conf.set("spark.memory.fraction", "0.6")
spark.conf.set("spark.memory.storageFraction", "0.5")

# Efficient serialization
spark.conf.set("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
spark.conf.set("spark.kryo.registrationRequired", "false")

# Disable unnecessary features for bulk loads
bulk_load_options = {
    "hoodie.datasource.write.operation": "bulk_insert",
    "hoodie.bulkinsert.sort.mode": "PARTITION_SORT",
    "hoodie.metadata.enable": "false",  # Disable metadata table
    "hoodie.clean.automatic": "false"   # Disable auto clean
}
```

### Read Optimization

```python
# Predicate pushdown
# Ensure filters are pushed down to Hudi
df = spark.read.format("hudi").load("/data/hudi/events") \
    .filter("date >= '2024-01-01'") \
    .filter("event_type = 'purchase'")

# Column pruning
df = spark.read.format("hudi").load("/data/hudi/events") \
    .select("event_id", "user_id", "amount")

# Use read-optimized queries for MOR when freshness isn't critical
mor_read_optimized = spark.read.format("hudi") \
    .option("hoodie.datasource.query.type", "read_optimized") \
    .load("/data/hudi/mor_events")

# Metadata table for faster listing
hudi_options = {
    "hoodie.metadata.enable": "true",
    "hoodie.metadata.index.column.stats.enable": "true"
}

# File listing optimization
spark.conf.set("hoodie.metadata.enable", "true")
spark.conf.set("hoodie.file.listing.parallelism", "200")
```

### Resource Configuration

```python
# Spark resource settings for Hudi
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

# AWS S3 optimization
spark.conf.set("spark.hadoop.fs.s3a.connection.maximum", "100")
spark.conf.set("spark.hadoop.fs.s3a.threads.max", "64")
spark.conf.set("spark.hadoop.fs.s3a.experimental.input.fadvise", "random")
```

## Real-World Scenarios

### Real-time Data Lake

```python
# Architecture: Kafka -> Flink/Spark Streaming -> Hudi -> Query Engines

# Spark Streaming to Hudi MOR
from pyspark.sql.streaming import StreamingQuery

def process_streaming_events():
    # Read from Kafka
    kafka_df = spark.readStream \
        .format("kafka") \
        .option("kafka.bootstrap.servers", "kafka:9092") \
        .option("subscribe", "events") \
        .option("startingOffsets", "latest") \
        .load()

    # Parse and transform
    events_df = kafka_df \
        .select(from_json(col("value").cast("string"), schema).alias("event")) \
        .select("event.*") \
        .withColumn("date", to_date("event_time"))

    # Write to Hudi with micro-batch
    hudi_options = {
        "hoodie.table.name": "realtime_events",
        "hoodie.datasource.write.table.type": "MERGE_ON_READ",
        "hoodie.datasource.write.operation": "upsert",
        "hoodie.datasource.write.recordkey.field": "event_id",
        "hoodie.datasource.write.partitionpath.field": "date",
        "hoodie.datasource.write.precombine.field": "event_time",

        # Near real-time settings
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

### CDC Pipeline with Debezium

```python
# Complete CDC pipeline: MySQL -> Debezium -> Kafka -> Hudi

# DeltaStreamer configuration for CDC
"""
# cdc-deltastreamer.properties

# Kafka source with Debezium format
hoodie.deltastreamer.source.class=org.apache.hudi.utilities.sources.AvroKafkaSource
hoodie.deltastreamer.source.kafka.topic=dbserver1.inventory.orders
hoodie.deltastreamer.source.kafka.value.deserializer.class=io.confluent.kafka.serializers.KafkaAvroDeserializer
bootstrap.servers=kafka:9092
schema.registry.url=http://schema-registry:8081

# CDC payload
hoodie.datasource.write.payload.class=org.apache.hudi.common.model.debezium.MySqlDebeziumAvroPayload

# Target table
hoodie.datasource.write.recordkey.field=id
hoodie.datasource.write.partitionpath.field=__source_ts_ms
hoodie.datasource.write.precombine.field=__source_ts_ms

# Handle deletes from CDC
hoodie.datasource.write.operation=upsert
hoodie.merge.allow.duplicate.on.inserts=false

# MOR for low-latency updates
hoodie.datasource.write.table.type=MERGE_ON_READ
hoodie.compact.inline=true
hoodie.compact.inline.max.delta.commits=5
"""

# Python wrapper for DeltaStreamer
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

### Incremental Data Processing

```python
# Incremental materialized view pattern

class IncrementalMaterializedView:
    def __init__(self, spark, source_path, target_path, table_name):
        self.spark = spark
        self.source_path = source_path
        self.target_path = target_path
        self.table_name = table_name
        self.checkpoint_path = f"/checkpoints/{table_name}"

    def get_last_checkpoint(self):
        """Get last processed commit time."""
        try:
            return self.spark.read.text(f"{self.checkpoint_path}/last_commit") \
                .first()[0]
        except:
            return "0"

    def save_checkpoint(self, commit_time):
        """Save last processed commit time."""
        self.spark.createDataFrame([(commit_time,)], ["commit"]) \
            .write.mode("overwrite").text(f"{self.checkpoint_path}/last_commit")

    def process_incremental(self, transform_func):
        """Process incremental changes."""
        last_commit = self.get_last_checkpoint()

        # Read incremental changes
        source_df = self.spark.read.format("hudi") \
            .option("hoodie.datasource.query.type", "incremental") \
            .option("hoodie.datasource.read.begin.instanttime", last_commit) \
            .load(self.source_path)

        if source_df.count() == 0:
            print("No new data to process")
            return

        # Get max commit time for checkpoint
        max_commit = source_df.agg({"_hoodie_commit_time": "max"}).collect()[0][0]

        # Apply transformation
        result_df = transform_func(source_df)

        # Write to target
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

        # Save checkpoint
        self.save_checkpoint(max_commit)

        print(f"Processed {source_df.count()} records up to {max_commit}")

# Usage
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

## Interview Questions

### Conceptual Questions

**Q: What makes Hudi different from Iceberg and Delta Lake?**

A: Key differentiators:
1. **Incremental Processing**: First-class support for incremental queries, allowing efficient processing of only changed data
2. **Table Types**: Two distinct table types (COW/MOR) optimized for different workloads, versus single format in others
3. **Indexing**: Multiple index types (Bloom, Bucket, HBase, Record-level) for efficient record lookups, critical for upsert performance
4. **CDC Native**: Built-in support for CDC payloads (Debezium), soft deletes, and change tracking
5. **DeltaStreamer**: Production-ready streaming ingestion utility out of the box
6. **Write Latency**: Sub-minute latency achievable with MOR tables

**Q: When would you choose MOR over COW?**

A: Choose MOR when:
1. High write frequency (>10 writes per hour per partition)
2. Write latency is critical (need sub-minute)
3. Streaming ingestion from Kafka/Kinesis
4. Updates affect small percentage of records
5. Can tolerate slightly higher read latency

Choose COW when:
1. Read performance is paramount
2. Batch updates (daily/hourly)
3. Updates affect large percentage of records
4. Simpler operations (no compaction)
5. Smaller tables where rewrite cost is acceptable

### Architecture Questions

**Q: Explain how Hudi's timeline works.**

A: The timeline tracks all operations as a sequence of instants:

1. **Structure**: Each instant has `<timestamp>.<action>.<state>`
2. **Actions**: COMMIT, DELTACOMMIT, COMPACTION, CLUSTERING, CLEAN, ROLLBACK
3. **States**: REQUESTED -> INFLIGHT -> COMPLETED
4. **Storage**: In `.hoodie/` directory as JSON/Avro files
5. **Purpose**:
   - Provides total ordering of operations
   - Enables time travel and rollback
   - Supports incremental queries by filtering commit times
   - Manages concurrency through instant locking

**Q: How does Hudi handle concurrent writes?**

A: Hudi uses optimistic concurrency control (OCC):

1. **File-level Locking**: Lock acquired on file groups being modified
2. **Instant Ordering**: Timeline ensures total ordering of commits
3. **Conflict Detection**: At commit time, checks if files were modified by concurrent transaction
4. **Resolution**: Failed commit triggers retry with fresh file list
5. **Multi-writer Mode**: Optional ZooKeeper or filesystem-based distributed locking for true multi-writer scenarios

### Practical Questions

**Q: How would you design a CDC pipeline with Hudi?**

A: Complete CDC architecture:

1. **Source Capture**: Debezium captures MySQL binlog changes
2. **Message Queue**: Kafka holds CDC events with Schema Registry
3. **Ingestion**: DeltaStreamer or Flink reads from Kafka continuously
4. **Hudi Storage**: MOR table with appropriate CDC payload class
5. **Configuration**:
   - Use `MySqlDebeziumAvroPayload` for correct handling of ops
   - Enable soft deletes for delete propagation
   - Configure compaction to maintain read performance
6. **Query Layer**: Trino/Presto for analytics, expose as Hive external table

**Q: How do you handle small files in Hudi?**

A: Multi-pronged approach:

1. **Prevention**:
   - Configure appropriate `hoodie.parquet.max.file.size`
   - Use `bulk_insert` for initial loads
   - Tune `hoodie.copyonwrite.insert.split.size`

2. **Clustering**:
   - Enable inline or async clustering
   - Configure target file sizes
   - Sort by frequently queried columns

3. **Compaction** (MOR):
   - Tune compaction frequency
   - Use size-based strategy
   - Run async compaction during off-peak

4. **Monitoring**:
   - Track file count and sizes
   - Alert on small file accumulation
   - Regular maintenance jobs

## Further Reading

### Official Resources

- [Apache Hudi Documentation](https://hudi.apache.org/docs/overview)
- [Hudi GitHub Repository](https://github.com/apache/hudi)
- [Hudi RFC Documents](https://github.com/apache/hudi/tree/master/rfc)

### Integration Guides

- [Spark Integration](https://hudi.apache.org/docs/spark_quick-start-guide)
- [Flink Integration](https://hudi.apache.org/docs/flink-quick-start-guide)
- [Presto/Trino Integration](https://hudi.apache.org/docs/querying_data#presto)
- [DeltaStreamer Guide](https://hudi.apache.org/docs/hoodie_deltastreamer)

### Community Resources

- [Hudi Slack Channel](https://join.slack.com/t/apache-hudi/shared_invite/zt-2ggm1fub8-_yt4Reu9djwqqVRFC7X49g)
- [Apache Hudi Blog](https://hudi.apache.org/blog)
- [Hudi YouTube Channel](https://www.youtube.com/channel/UC5JY4mCGnZpZ9M8XMULYBdA)
- [Onehouse Blog](https://www.onehouse.ai/blog) - Company founded by Hudi creators

### Related Technologies

- [Apache Spark](https://spark.apache.org/docs/latest/)
- [Apache Flink](https://flink.apache.org/docs/)
- [Debezium](https://debezium.io/documentation/)
- [Apache Kafka](https://kafka.apache.org/documentation/)
- [Apache Iceberg](https://iceberg.apache.org/docs/latest/)
- [Delta Lake](https://delta.io/learn/documentation/)

### Books and Courses

- "Apache Hudi: The Definitive Guide" (O'Reilly, forthcoming)
- [Building a Lakehouse with Apache Hudi](https://www.oreilly.com/library/view/building-a-lakehouse/9781098143664/)
- Onehouse Academy courses on Hudi

By mastering Apache Hudi's architecture and capabilities, you can build efficient streaming data pipelines and real-time data lakes that handle high-frequency updates with minimal latency. The combination of flexible table types, powerful indexing, and native CDC support makes Hudi the ideal choice for incremental data processing workloads where data freshness and write efficiency are paramount.
