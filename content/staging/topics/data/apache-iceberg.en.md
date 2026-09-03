---
title: Apache Iceberg Table Format
description: A comprehensive guide to Apache Iceberg - the open table format for huge analytic datasets
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
origin: old/src/content/docs/data/apache-iceberg.en.md
divergence: 0.224
issues: []
legacy:
  category: Data
  subcategory: Data Lake
  order: 22
  lastUpdated: 2026-01-20
---

Apache Iceberg is an open table format designed for huge analytic datasets. Originally developed at Netflix and donated to the Apache Software Foundation, Iceberg addresses the fundamental limitations of traditional data lake table formats like Hive. It provides ACID transactions, schema evolution, partition evolution, and time travel capabilities while maintaining excellent performance at petabyte scale. This guide covers everything you need to understand and effectively use Apache Iceberg in production data platforms.

## What is Apache Iceberg?

### The Problem with Traditional Data Lakes

Traditional data lake architectures built on Hive table format suffer from several critical issues:

**Hive Table Format Limitations:**

| Problem | Impact |
|---------|--------|
| Directory-based partitioning | Slow partition discovery, expensive metadata operations |
| No ACID transactions | Data corruption risks during concurrent writes |
| Schema changes require rewrite | Expensive ALTER TABLE operations |
| No time travel | Cannot query historical data states |
| Partition column in data | Redundant storage, query complexity |
| Eventual consistency | Read-after-write inconsistencies |

### How Iceberg Solves These Problems

Iceberg introduces a **table format specification** that separates metadata management from data storage:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Iceberg Table Format                        │
├─────────────────────────────────────────────────────────────────┤
│  Catalog Layer          │  Metadata pointer management           │
├─────────────────────────────────────────────────────────────────┤
│  Metadata Layer         │  Snapshots, manifests, schemas         │
├─────────────────────────────────────────────────────────────────┤
│  Data Layer             │  Parquet/ORC/Avro files                │
└─────────────────────────────────────────────────────────────────┘
```

**Key Benefits:**

- **ACID Transactions**: Serializable isolation for concurrent reads and writes
- **Schema Evolution**: Add, rename, delete, or reorder columns without rewriting data
- **Partition Evolution**: Change partitioning strategy without data migration
- **Time Travel**: Query any historical snapshot of the table
- **Hidden Partitioning**: Partition values derived from data, not stored redundantly
- **Row-level Updates**: Efficient UPDATE and DELETE operations

### Iceberg vs. Delta Lake vs. Hudi

| Feature | Apache Iceberg | Delta Lake | Apache Hudi |
|---------|---------------|------------|-------------|
| **Origin** | Netflix | Databricks | Uber |
| **Governance** | Apache Foundation | Linux Foundation | Apache Foundation |
| **Engine Support** | Spark, Flink, Trino, Presto, Dremio | Primarily Spark | Spark, Flink |
| **Partition Evolution** | Full support | Limited | Limited |
| **Hidden Partitioning** | Yes | No | No |
| **Schema Evolution** | Full support | Good support | Good support |
| **Time Travel** | Snapshot-based | Version-based | Timeline-based |
| **Copy-on-Write** | Yes | Yes | Yes |
| **Merge-on-Read** | Yes | Yes (Deletion Vectors) | Yes |
| **Cloud Object Store** | Excellent | Good | Good |

## Core Architecture

### Metadata Layer

Iceberg's metadata layer consists of three hierarchical components:

#### 1. Metadata Files

The metadata file is the root of the table state, containing:

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

#### 2. Manifest Lists (Snapshot Manifests)

Each snapshot points to a manifest list that contains entries for all manifest files:

```
Snapshot 1 ──► Manifest List 1 ──┬── Manifest A (data files 1-1000)
                                 ├── Manifest B (data files 1001-2000)
                                 └── Manifest C (data files 2001-3000)
```

#### 3. Manifest Files

Manifest files track individual data files with statistics:

```
┌─────────────────────────────────────────────────────────────────┐
│ Manifest File                                                    │
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

### Snapshot Isolation

Iceberg implements **snapshot isolation** using immutable snapshots:

```
Time ──────────────────────────────────────────────────────────►

Snapshot 1 ── Snapshot 2 ── Snapshot 3 ── Snapshot 4 (current)
    │              │              │              │
    ▼              ▼              ▼              ▼
  Files A       Files A+B     Files A+B+C    Files B+C+D
                               (A deleted)
```

**Write Operation Flow:**

1. Writer creates new data files
2. Writer creates new manifest files referencing data files
3. Writer creates new manifest list referencing manifests
4. Writer creates new snapshot pointing to manifest list
5. Atomic commit: Update metadata pointer to new snapshot

**Read Operation Flow:**

1. Reader loads current metadata file
2. Reader gets current snapshot
3. Reader scans manifest list for relevant manifests
4. Reader uses partition pruning and column statistics
5. Reader reads only necessary data files

### Schema Evolution

Iceberg tracks schemas with unique IDs for each column:

```python
# Schema with column IDs
Schema(
    NestedField(field_id=1, name="id", field_type=LongType(), required=True),
    NestedField(field_id=2, name="data", field_type=StringType(), required=False),
    NestedField(field_id=3, name="ts", field_type=TimestampType(), required=True)
)
```

**Supported Schema Changes:**

| Operation | Description | Backward Compatible |
|-----------|-------------|---------------------|
| Add column | Add new column anywhere | Yes |
| Drop column | Remove column by ID | Yes |
| Rename column | Change column name | Yes |
| Update column | Widen type (int → long) | Yes |
| Reorder columns | Change column position | Yes |
| Make required → optional | Relax nullability | Yes |
| Make optional → required | Not allowed without rewrite | No |

## Core Features

### Partition Evolution

Unlike Hive, Iceberg allows changing partition strategy without rewriting data:

```sql
-- Original partitioning by day
ALTER TABLE events ADD PARTITION FIELD days(event_time);

-- Data grows, evolve to hour partitioning
ALTER TABLE events ADD PARTITION FIELD hours(event_time);

-- Old files remain partitioned by day
-- New files are partitioned by hour
-- Queries work seamlessly across both
```

**Partition Evolution Example:**

```
┌────────────────────────────────────────────────────────────────┐
│ Partition Spec v0: partition by days(event_time)               │
├────────────────────────────────────────────────────────────────┤
│ Manifest 1: files partitioned by day (2024-01-01, 2024-01-02) │
│ Manifest 2: files partitioned by day (2024-01-03, 2024-01-04) │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼ ALTER TABLE ... ADD PARTITION FIELD
┌────────────────────────────────────────────────────────────────┐
│ Partition Spec v1: partition by hours(event_time)              │
├────────────────────────────────────────────────────────────────┤
│ Manifest 1: files partitioned by day (unchanged)               │
│ Manifest 2: files partitioned by day (unchanged)               │
│ Manifest 3: files partitioned by hour (2024-01-05-00, ...)    │
└────────────────────────────────────────────────────────────────┘
```

### Hidden Partitioning

Iceberg derives partition values from source columns using transforms:

```sql
CREATE TABLE events (
    event_id BIGINT,
    event_time TIMESTAMP,
    user_id BIGINT,
    event_type STRING
)
PARTITIONED BY (
    days(event_time),           -- Partition by day
    bucket(16, user_id)         -- Bucket users into 16 partitions
);

-- Query automatically uses partitioning
-- No need to specify partition columns
SELECT * FROM events
WHERE event_time >= '2024-01-01'
  AND event_time < '2024-01-02';
```

**Available Partition Transforms:**

| Transform | Description | Example |
|-----------|-------------|---------|
| `identity` | Use value as-is | `identity(country)` |
| `bucket(n, col)` | Hash into n buckets | `bucket(16, user_id)` |
| `truncate(w, col)` | Truncate to width w | `truncate(10, name)` |
| `year(col)` | Extract year | `year(timestamp)` |
| `month(col)` | Extract year-month | `month(timestamp)` |
| `day(col)` | Extract date | `day(timestamp)` |
| `hour(col)` | Extract date-hour | `hour(timestamp)` |

### Time Travel

Query historical snapshots with timestamp or snapshot ID:

```sql
-- Query by timestamp
SELECT * FROM events TIMESTAMP AS OF '2024-01-15 10:00:00';

-- Query by snapshot ID
SELECT * FROM events VERSION AS OF 3051729675574597004;

-- Spark syntax with options
SELECT * FROM events.snapshots;
SELECT * FROM events.history;

-- Compare two snapshots
SELECT * FROM events
WHERE event_time BETWEEN '2024-01-01' AND '2024-01-02'
VERSION AS OF 1234567890  -- old snapshot
EXCEPT ALL
SELECT * FROM events
WHERE event_time BETWEEN '2024-01-01' AND '2024-01-02'
VERSION AS OF 9876543210; -- new snapshot
```

**Rollback Operations:**

```sql
-- Rollback to specific snapshot
CALL catalog.system.rollback_to_snapshot('db.events', 3051729675574597004);

-- Rollback to timestamp
CALL catalog.system.rollback_to_timestamp('db.events', TIMESTAMP '2024-01-15 10:00:00');

-- Set current snapshot (for testing/debugging)
CALL catalog.system.set_current_snapshot('db.events', 3051729675574597004);
```

### Table Maintenance

#### Compaction

Combine small files into larger ones for better query performance:

```sql
-- Rewrite data files to optimize size
CALL catalog.system.rewrite_data_files(
    table => 'db.events',
    strategy => 'binpack',
    options => map(
        'target-file-size-bytes', '536870912',  -- 512 MB
        'min-file-size-bytes', '67108864',       -- 64 MB
        'max-file-size-bytes', '1073741824'      -- 1 GB
    )
);

-- Sort-based compaction for better data clustering
CALL catalog.system.rewrite_data_files(
    table => 'db.events',
    strategy => 'sort',
    sort_order => 'event_time ASC NULLS LAST, user_id ASC NULLS LAST'
);
```

#### Expire Snapshots

Remove old snapshots to reclaim metadata storage:

```sql
-- Expire snapshots older than specific timestamp
CALL catalog.system.expire_snapshots(
    table => 'db.events',
    older_than => TIMESTAMP '2024-01-01 00:00:00',
    retain_last => 10,  -- Keep at least 10 snapshots
    max_concurrent_deletes => 100
);

-- Remove orphan files (data files not referenced by any snapshot)
CALL catalog.system.remove_orphan_files(
    table => 'db.events',
    older_than => TIMESTAMP '2024-01-01 00:00:00'
);
```

#### Rewrite Manifests

Optimize manifest files for better planning performance:

```sql
-- Rewrite small manifest files
CALL catalog.system.rewrite_manifests(
    table => 'db.events',
    use_caching => true
);
```

## Code Examples

### Spark Integration

#### Creating Tables

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

# Create table with SQL
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

#### Insert and Update Operations

```python
from pyspark.sql.functions import current_timestamp, lit, map_from_arrays, array

# Insert data
events_df = spark.createDataFrame([
    (1, "2024-01-15 10:00:00", 100, "click", {"page": "/home"}),
    (2, "2024-01-15 10:01:00", 101, "view", {"page": "/products"}),
    (3, "2024-01-15 10:02:00", 100, "purchase", {"amount": "99.99"}),
], ["event_id", "event_time", "user_id", "event_type", "properties"])

events_df = events_df.withColumn("event_time", events_df.event_time.cast("timestamp"))

events_df.writeTo("local.db.events").append()

# Overwrite partitions dynamically
events_df.writeTo("local.db.events") \
    .overwritePartitions()

# Update specific rows
spark.sql("""
    UPDATE local.db.events
    SET event_type = 'converted_click'
    WHERE event_type = 'click' AND user_id = 100
""")

# Delete rows
spark.sql("""
    DELETE FROM local.db.events
    WHERE event_time < '2024-01-01'
""")

# Merge (upsert) operation
spark.sql("""
    MERGE INTO local.db.events t
    USING updates s
    ON t.event_id = s.event_id
    WHEN MATCHED THEN UPDATE SET *
    WHEN NOT MATCHED THEN INSERT *
""")
```

#### Reading with Time Travel

```python
# Read current state
df = spark.table("local.db.events")

# Read at specific timestamp
df_historical = spark.read \
    .option("as-of-timestamp", "2024-01-15 10:00:00") \
    .table("local.db.events")

# Read at specific snapshot
df_snapshot = spark.read \
    .option("snapshot-id", 3051729675574597004) \
    .table("local.db.events")

# Read incremental changes between snapshots
df_changes = spark.read \
    .option("start-snapshot-id", 1234567890) \
    .option("end-snapshot-id", 9876543210) \
    .table("local.db.events")

# Query metadata tables
spark.sql("SELECT * FROM local.db.events.snapshots").show()
spark.sql("SELECT * FROM local.db.events.history").show()
spark.sql("SELECT * FROM local.db.events.manifests").show()
spark.sql("SELECT * FROM local.db.events.files").show()
spark.sql("SELECT * FROM local.db.events.partitions").show()
```

### Trino Integration

#### Configuration

```properties
# etc/catalog/iceberg.properties
connector.name=iceberg
iceberg.catalog.type=hive_metastore
hive.metastore.uri=thrift://metastore:9083

# For Glue catalog
connector.name=iceberg
iceberg.catalog.type=glue
hive.metastore.glue.region=us-east-1

# For REST catalog
connector.name=iceberg
iceberg.catalog.type=rest
iceberg.rest-catalog.uri=http://rest-catalog:8181
```

#### Query Examples

```sql
-- Create table
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

-- Insert data
INSERT INTO iceberg.db.events
SELECT * FROM staging.events;

-- Time travel query
SELECT * FROM iceberg.db.events
FOR TIMESTAMP AS OF TIMESTAMP '2024-01-15 10:00:00 UTC';

-- Snapshot query
SELECT * FROM iceberg.db.events
FOR VERSION AS OF 3051729675574597004;

-- Schema evolution
ALTER TABLE iceberg.db.events ADD COLUMN device_type VARCHAR;
ALTER TABLE iceberg.db.events RENAME COLUMN device_type TO device_category;
ALTER TABLE iceberg.db.events DROP COLUMN device_category;

-- Partition evolution
ALTER TABLE iceberg.db.events
SET PROPERTIES partitioning = ARRAY['hour(event_time)', 'bucket(user_id, 16)'];

-- Optimize (Trino 400+)
ALTER TABLE iceberg.db.events EXECUTE optimize;
ALTER TABLE iceberg.db.events EXECUTE optimize WHERE event_time < DATE '2024-01-01';

-- Expire snapshots (Trino 400+)
ALTER TABLE iceberg.db.events EXECUTE expire_snapshots(retention_threshold => '7d');

-- Remove orphan files
ALTER TABLE iceberg.db.events EXECUTE remove_orphan_files(retention_threshold => '7d');
```

### Flink Integration

#### Streaming Write

```java
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;
import org.apache.flink.table.api.bridge.java.StreamTableEnvironment;
import org.apache.flink.table.api.EnvironmentSettings;

StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
env.enableCheckpointing(60000); // Checkpoint every minute

EnvironmentSettings settings = EnvironmentSettings.newInstance()
    .inStreamingMode()
    .build();
StreamTableEnvironment tableEnv = StreamTableEnvironment.create(env, settings);

// Create Iceberg catalog
tableEnv.executeSql("""
    CREATE CATALOG iceberg_catalog WITH (
        'type' = 'iceberg',
        'catalog-type' = 'hive',
        'uri' = 'thrift://metastore:9083',
        'warehouse' = 's3://my-bucket/warehouse'
    )
""");

// Create streaming source
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

// Create Iceberg sink table
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

// Stream data from Kafka to Iceberg
tableEnv.executeSql("""
    INSERT INTO iceberg_catalog.db.events
    SELECT event_id, event_time, user_id, event_type
    FROM kafka_events
""");
```

#### Streaming Read (CDC)

```java
// Read incremental changes from Iceberg
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

// Process streaming changes
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

# Load catalog
catalog = load_catalog(
    "default",
    **{
        "type": "glue",
        "region_name": "us-east-1"
    }
)

# Or use REST catalog
catalog = load_catalog(
    "default",
    **{
        "type": "rest",
        "uri": "http://rest-catalog:8181"
    }
)

# List namespaces and tables
namespaces = catalog.list_namespaces()
tables = catalog.list_tables("db")

# Load table
table = catalog.load_table("db.events")

# View table schema
print(table.schema())

# View partition spec
print(table.spec())

# View table properties
print(table.properties)

# Read data with filters
scan = table.scan(
    row_filter=And(
        GreaterThanOrEqual("event_time", "2024-01-01T00:00:00"),
        EqualTo("event_type", "click")
    ),
    selected_fields=("event_id", "event_time", "user_id")
)

# Convert to PyArrow
arrow_table = scan.to_arrow()

# Convert to Pandas
df = scan.to_pandas()

# Read specific snapshot
scan = table.scan(snapshot_id=3051729675574597004)
df_historical = scan.to_pandas()

# Append data
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

# Overwrite data
table.overwrite(df_new)

# Schema evolution
with table.update_schema() as update:
    update.add_column("device_type", StringType())
    update.rename_column("device_type", "device_category")

# Update properties
with table.update_properties() as update:
    update.set("write.target-file-size-bytes", "536870912")
```

## Best Practices

### Partition Strategy

Choose partitioning based on query patterns and data volume:

```sql
-- Time-series data: partition by time granularity
-- High volume: hourly partitions
PARTITIONED BY (hours(event_time))

-- Medium volume: daily partitions
PARTITIONED BY (days(event_time))

-- Low volume: monthly partitions
PARTITIONED BY (months(event_time))

-- Multi-tenant data: combine time with tenant
PARTITIONED BY (days(event_time), identity(tenant_id))

-- High cardinality columns: use bucket
PARTITIONED BY (days(event_time), bucket(32, user_id))
```

**Partition Guidelines:**

| Data Volume per Day | Recommended Partitioning |
|---------------------|--------------------------|
| < 100 MB | monthly or no partitioning |
| 100 MB - 10 GB | daily |
| 10 GB - 1 TB | hourly |
| > 1 TB | hourly + bucketing |

### File Size Optimization

Configure optimal file sizes for your workload:

```sql
-- Table properties for file sizing
ALTER TABLE db.events SET TBLPROPERTIES (
    'write.target-file-size-bytes' = '536870912',    -- 512 MB target
    'write.distribution-mode' = 'hash',               -- Distribute writes
    'write.parquet.row-group-size-bytes' = '134217728' -- 128 MB row groups
);

-- Compaction settings for maintenance
CALL catalog.system.rewrite_data_files(
    table => 'db.events',
    strategy => 'binpack',
    options => map(
        'target-file-size-bytes', '536870912',
        'min-file-size-bytes', '104857600',    -- 100 MB min
        'max-file-size-bytes', '1073741824',   -- 1 GB max
        'min-input-files', '5',
        'max-concurrent-file-group-rewrites', '100'
    )
);
```

### Metadata Management

Configure metadata retention and optimization:

```sql
-- Set snapshot retention
ALTER TABLE db.events SET TBLPROPERTIES (
    'history.expire.max-snapshot-age-ms' = '604800000',  -- 7 days
    'history.expire.min-snapshots-to-keep' = '10'
);

-- Enable automatic compaction (Spark 3.4+)
ALTER TABLE db.events SET TBLPROPERTIES (
    'write.spark.fanout.enabled' = 'true',
    'write.metadata.compression-codec' = 'gzip'
);

-- Regular maintenance job
-- Run daily to keep metadata healthy
CALL catalog.system.expire_snapshots('db.events', TIMESTAMP '${7_DAYS_AGO}');
CALL catalog.system.remove_orphan_files('db.events', TIMESTAMP '${7_DAYS_AGO}');
CALL catalog.system.rewrite_manifests('db.events');
```

### Write Optimization

```python
# Spark write settings
df.writeTo("db.events") \
    .option("write.distribution-mode", "hash") \
    .option("fanout-enabled", "true") \
    .option("write.target-file-size-bytes", "536870912") \
    .append()

# For streaming writes, use checkpointing
spark.conf.set("spark.sql.streaming.checkpointLocation", "s3://bucket/checkpoints")

# Batch large inserts
events_df.repartition(100).writeTo("db.events").append()

# Sort data for better compression and query performance
events_df.sortWithinPartitions("event_time", "user_id") \
    .writeTo("db.events").append()
```

## Common Pitfalls

### Small Files Problem

**Problem:** Many small files degrade query performance.

```python
# Check file sizes
spark.sql("""
    SELECT
        file_path,
        file_size_in_bytes / 1024 / 1024 as size_mb,
        record_count
    FROM db.events.files
    ORDER BY file_size_in_bytes
    LIMIT 100
""").show()

# Solution: Regular compaction
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

# Prevention: Configure write distribution
spark.conf.set("spark.sql.iceberg.distribution-mode", "hash")
```

### Snapshot Accumulation

**Problem:** Too many snapshots slow metadata operations.

```python
# Check snapshot count
spark.sql("SELECT COUNT(*) FROM db.events.snapshots").show()

# View snapshot history
spark.sql("""
    SELECT
        snapshot_id,
        committed_at,
        operation,
        summary
    FROM db.events.history
    ORDER BY committed_at DESC
""").show(50)

# Solution: Expire old snapshots
spark.sql("""
    CALL catalog.system.expire_snapshots(
        table => 'db.events',
        older_than => TIMESTAMP '2024-01-01 00:00:00',
        retain_last => 10
    )
""")
```

### Concurrent Write Conflicts

**Problem:** Multiple writers cause commit conflicts.

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=1, min=2, max=30)
)
def write_with_retry(df, table_name):
    """Write with automatic retry on commit conflicts."""
    try:
        df.writeTo(table_name).append()
    except Exception as e:
        if "CommitFailedException" in str(e):
            print(f"Commit conflict detected, retrying...")
            raise
        raise

# Use isolation level appropriately
spark.sql("""
    ALTER TABLE db.events SET TBLPROPERTIES (
        'write.wap.enabled' = 'true',
        'commit.retry.num-retries' = '5',
        'commit.retry.min-wait-ms' = '1000'
    )
""")
```

### Orphan Files

**Problem:** Failed writes leave unreferenced data files.

```python
# Find orphan files
spark.sql("""
    CALL catalog.system.remove_orphan_files(
        table => 'db.events',
        older_than => TIMESTAMP '2024-01-01 00:00:00',
        dry_run => true
    )
""")

# Remove orphan files (after verifying)
spark.sql("""
    CALL catalog.system.remove_orphan_files(
        table => 'db.events',
        older_than => TIMESTAMP '2024-01-01 00:00:00'
    )
""")
```

### Partition Column in Queries

**Problem:** Forgetting Iceberg handles partitioning automatically.

```sql
-- WRONG: Don't add partition columns to data
CREATE TABLE events (
    event_id BIGINT,
    event_time TIMESTAMP,
    event_date DATE,  -- Don't do this!
    user_id BIGINT
)
PARTITIONED BY (event_date);

-- RIGHT: Let Iceberg derive partitions
CREATE TABLE events (
    event_id BIGINT,
    event_time TIMESTAMP,
    user_id BIGINT
)
PARTITIONED BY (days(event_time));

-- Query without specifying partition column
-- Iceberg automatically prunes partitions
SELECT * FROM events
WHERE event_time >= '2024-01-15'
  AND event_time < '2024-01-16';
```

## Performance Considerations

### Query Planning Optimization

```sql
-- Use column statistics for predicate pushdown
ALTER TABLE db.events SET TBLPROPERTIES (
    'write.metadata.metrics.default' = 'full',
    'write.metadata.metrics.column.event_type' = 'full',
    'write.metadata.metrics.column.user_id' = 'full'
);

-- Check if statistics are being used
EXPLAIN SELECT * FROM db.events WHERE user_id = 100;
```

### Data Layout Optimization

```sql
-- Sort data for better locality
CALL catalog.system.rewrite_data_files(
    table => 'db.events',
    strategy => 'sort',
    sort_order => 'user_id ASC NULLS LAST, event_time DESC NULLS LAST',
    options => map('target-file-size-bytes', '536870912')
);

-- Z-order for multi-dimensional queries
CALL catalog.system.rewrite_data_files(
    table => 'db.events',
    strategy => 'sort',
    sort_order => 'zorder(user_id, event_type)',
    options => map('target-file-size-bytes', '536870912')
);
```

### Read Optimization

```python
# Use projection pushdown
df = spark.read.table("db.events") \
    .select("event_id", "event_time", "user_id")  # Only read needed columns

# Use predicate pushdown
df = spark.read.table("db.events") \
    .filter("event_time >= '2024-01-01'") \
    .filter("event_type = 'click'")

# Enable vectorized reads
spark.conf.set("spark.sql.iceberg.vectorization.enabled", "true")

# Configure read parallelism
spark.conf.set("spark.sql.iceberg.split.size", "134217728")  # 128 MB splits
```

### Metadata Caching

```python
# Enable metadata caching in Spark
spark.conf.set("spark.sql.catalog.local.cache-enabled", "true")
spark.conf.set("spark.sql.catalog.local.cache.expiration-interval-ms", "300000")

# Trino metadata caching
# iceberg.properties
# iceberg.file-status-cache-expire-time=10m
# iceberg.file-status-cache-max-size=100000
```

## Real-World Scenarios

### Building a Data Lakehouse

```python
# Bronze layer: Raw ingestion
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

# Silver layer: Cleaned and validated
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

# Gold layer: Business aggregates
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

# ETL: Bronze to Silver
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

### Stream-Batch Unification

```java
// Flink: Unified stream and batch processing
StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment();
StreamTableEnvironment tableEnv = StreamTableEnvironment.create(env);

// Streaming source
tableEnv.executeSql("""
    CREATE TABLE kafka_events (...)
    WITH ('connector' = 'kafka', ...)
""");

// Iceberg sink supporting both streaming and batch
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

// Streaming write with exactly-once semantics
tableEnv.executeSql("""
    INSERT INTO iceberg_events
    SELECT event_id, event_time, user_id, event_type
    FROM kafka_events
""");

// Batch query on same table
tableEnv.executeSql("""
    SELECT event_type, COUNT(*)
    FROM iceberg_events
    WHERE event_time >= TIMESTAMP '2024-01-01 00:00:00'
    GROUP BY event_type
""").print();
```

### CDC with Iceberg

```python
# Capture changes from source database
# Using Debezium + Kafka + Flink + Iceberg

# Flink CDC Table
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

-- Replicate changes to Iceberg
INSERT INTO iceberg_users SELECT * FROM mysql_cdc;
"""

# Query historical state of CDC table
spark.sql("""
    SELECT * FROM iceberg_users
    FOR TIMESTAMP AS OF '2024-01-15 10:00:00'
    WHERE id = 12345
""")
```

## Interview Questions

### Conceptual Questions

**Q: What problems does Iceberg solve that Hive tables cannot?**

A: Iceberg addresses several Hive limitations:
1. **ACID transactions** - Hive lacks true ACID support; Iceberg provides snapshot isolation
2. **Schema evolution** - Hive requires expensive table rewrites; Iceberg uses column IDs for seamless evolution
3. **Partition evolution** - Hive cannot change partitioning without data migration; Iceberg supports partition evolution
4. **Hidden partitioning** - Hive requires partition columns in queries; Iceberg derives partitions automatically
5. **Time travel** - Hive has no versioning; Iceberg maintains snapshot history
6. **Performance** - Hive scans directories for files; Iceberg uses manifest files with statistics for efficient planning

**Q: Explain how Iceberg achieves snapshot isolation.**

A: Iceberg's snapshot isolation works through:
1. **Immutable snapshots** - Each write creates a new snapshot without modifying existing ones
2. **Atomic commits** - Metadata pointer update is atomic using file system rename or catalog CAS
3. **Read isolation** - Readers load a snapshot at query start and see consistent data throughout
4. **Write isolation** - Writers create new files and commit atomically; conflicts detected at commit time
5. **Optimistic concurrency** - Multiple writers can work simultaneously; only commit conflicts when modifying same files

### Architecture Questions

**Q: Describe Iceberg's metadata structure.**

A: Three-layer hierarchy:
1. **Metadata files** - JSON files containing table schema, partition specs, current snapshot, and snapshot history
2. **Manifest lists** - Avro files listing all manifest files for a snapshot with partition summaries
3. **Manifest files** - Avro files tracking individual data files with column statistics, bounds, and counts

This structure enables:
- Efficient partition pruning at manifest list level
- Statistics-based file pruning at manifest level
- Minimal metadata reads for query planning

**Q: How does partition evolution work in Iceberg?**

A: Iceberg tracks partition specs with unique IDs:
1. Each data file is written with a specific partition spec version
2. When partition spec changes, new files use new spec; old files remain unchanged
3. Queries understand multiple partition specs and apply appropriate filters
4. No data rewriting required; system handles mixed partition layouts transparently

### Practical Questions

**Q: How would you handle small files in Iceberg?**

A: Multiple strategies:
1. **Prevention** - Use `write.distribution-mode=hash` and appropriate `target-file-size-bytes`
2. **Compaction** - Run `rewrite_data_files` with binpack strategy regularly
3. **Sort compaction** - Use sort strategy for better data locality
4. **Streaming** - Increase checkpoint intervals, use upsert mode
5. **Monitoring** - Query `table.files` metadata to track file size distribution

**Q: How would you implement a data lakehouse with Iceberg?**

A: Multi-layer architecture:
1. **Bronze (raw)** - Ingest raw data with minimal transformation, partition by ingestion time
2. **Silver (cleaned)** - Apply data quality, deduplication, schema normalization
3. **Gold (curated)** - Business aggregates, pre-joined datasets for analytics
4. Use MERGE for incremental updates, time travel for auditing, partition evolution as data grows

## Further Reading

### Official Resources

- [Apache Iceberg Documentation](https://iceberg.apache.org/docs/latest/)
- [Iceberg Spec](https://iceberg.apache.org/spec/)
- [Iceberg GitHub Repository](https://github.com/apache/iceberg)

### Integration Guides

- [Spark Integration](https://iceberg.apache.org/docs/latest/spark-getting-started/)
- [Flink Integration](https://iceberg.apache.org/docs/latest/flink/)
- [Trino Iceberg Connector](https://trino.io/docs/current/connector/iceberg.html)
- [PyIceberg Documentation](https://py.iceberg.apache.org/)

### Community Resources

- [Iceberg Community Slack](https://iceberg.apache.org/community/)
- [Apache Iceberg Blog](https://iceberg.apache.org/blogs/)
- [Tabular Blog](https://tabular.io/blog/) - Company founded by Iceberg creators
- [Dremio Iceberg Resources](https://www.dremio.com/apache-iceberg/)

### Books and Courses

- "Apache Iceberg: The Definitive Guide" (O'Reilly, 2024)
- [Data Engineering with Apache Iceberg](https://www.oreilly.com/library/view/data-engineering-with/9781098148614/)

### Related Technologies

- [Apache Spark](https://spark.apache.org/docs/latest/)
- [Apache Flink](https://flink.apache.org/docs/)
- [Trino](https://trino.io/docs/current/)
- [Delta Lake](https://delta.io/learn/documentation/)
- [Apache Hudi](https://hudi.apache.org/docs/overview/)

By understanding Iceberg's architecture and capabilities, you can build modern data platforms that handle petabyte-scale analytics with transactional guarantees, flexible schema evolution, and powerful time travel features.
