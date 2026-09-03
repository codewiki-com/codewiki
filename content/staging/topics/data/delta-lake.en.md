---
title: Delta Lake Data Lakehouse
description: Build reliable data lakes with Delta Lake
track: data
section: data-engineering
difficulty: advanced
tags:
  - Delta Lake
  - data lake
  - ACID
  - Spark
status: imported
origin: old/src/content/docs/data/delta-lake.en.md
divergence: 0.235
issues: []
legacy:
  category: Data
  subcategory: Data Lake
  order: 20
  lastUpdated: 2026-01-07
---

Delta Lake is an open-source storage layer that brings ACID transactions, scalable metadata handling, and unified streaming and batch data processing to data lakes. Built on top of Apache Spark, Delta Lake transforms unreliable data lakes into reliable data lakehouses that combine the best features of data lakes and data warehouses.

## Introduction to Delta Lake

### What is Delta Lake?

Delta Lake is an open-source project that enables building a Lakehouse architecture on top of existing data lake storage systems like HDFS, Amazon S3, Azure Data Lake Storage, and Google Cloud Storage. Originally developed by Databricks, Delta Lake is now an open-source project under the Linux Foundation.

**Key Value Propositions:**

- **ACID Transactions**: Ensures data integrity with serializable isolation levels
- **Scalable Metadata**: Handles petabyte-scale tables with billions of partitions
- **Time Travel**: Access and revert to earlier versions of data
- **Unified Batch and Streaming**: Single API for both batch and streaming workloads
- **Schema Enforcement**: Prevents bad data from corrupting your tables
- **Schema Evolution**: Safely evolve table schemas without breaking pipelines

### The Data Lakehouse Paradigm

```
Traditional Architecture:
+-------------+     +-------------+     +-------------+
|  Data Lake  |---->|     ETL     |---->|  Data       |---> BI/Analytics
|  (Raw Data) |     |             |     |  Warehouse  |
+-------------+     +-------------+     +-------------+
     |                                       |
     | Storage Duplication                   | Limited ML Support
     | Data Quality Issues                   | High Cost
     | No ACID Transactions                  |

Lakehouse Architecture with Delta Lake:
+-------------------------------------------------------------+
|                    Delta Lake (Lakehouse)                    |
|  +-------------------------------------------------------+  |
|  |  ACID Transactions | Schema Enforcement | Time Travel |  |
|  +-------------------------------------------------------+  |
|  |              Unified Storage Layer                     |  |
|  |         (Parquet + Transaction Log)                   |  |
|  +-------------------------------------------------------+  |
|                           |                                  |
|     +--------------------+|+--------------------+           |
|     |        BI/SQL      |||     ML/Data Science|           |
|     |   (Spark SQL,      |||   (MLflow, Pandas, |           |
|     |    Presto, etc.)   |||    TensorFlow)     |           |
|     +--------------------+|+--------------------+           |
+-------------------------------------------------------------+
```

### Delta Lake Architecture

Delta Lake stores data in Parquet format with an additional transaction log that tracks all changes to the table:

```
delta_table/
├── _delta_log/                    # Transaction log directory
│   ├── 00000000000000000000.json  # Version 0 commit
│   ├── 00000000000000000001.json  # Version 1 commit
│   ├── 00000000000000000002.json  # Version 2 commit
│   ├── ...
│   └── 00000000000000000010.checkpoint.parquet  # Checkpoint
├── part-00000-...snappy.parquet   # Data files
├── part-00001-...snappy.parquet
└── part-00002-...snappy.parquet
```

The transaction log (`_delta_log`) is the key component that enables:
- Atomicity: All operations either complete entirely or not at all
- Consistency: The table is always in a valid state
- Isolation: Concurrent operations do not interfere with each other
- Durability: Committed changes are permanent

## Getting Started with Delta Lake

### Installation and Configuration

```python
# PySpark with Delta Lake
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("DeltaLakeDemo") \
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
    .config("spark.jars.packages", "io.delta:delta-core_2.12:2.4.0") \
    .getOrCreate()

# For Delta Lake 3.0+ (Spark 3.5+)
spark = SparkSession.builder \
    .appName("DeltaLakeDemo") \
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
    .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
    .config("spark.jars.packages", "io.delta:delta-spark_2.12:3.0.0") \
    .getOrCreate()
```

```scala
// Scala with Delta Lake
import org.apache.spark.sql.SparkSession
import io.delta.tables._

val spark = SparkSession.builder()
  .appName("DeltaLakeDemo")
  .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension")
  .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog")
  .getOrCreate()
```

### Creating Delta Tables

```python
from pyspark.sql.types import *
from pyspark.sql.functions import *

# Method 1: Create from DataFrame
data = [
    (1, "Alice", "Engineering", 75000, "2020-01-15"),
    (2, "Bob", "Marketing", 65000, "2019-06-01"),
    (3, "Charlie", "Engineering", 80000, "2021-03-20"),
    (4, "Diana", "Sales", 70000, "2020-11-10")
]

schema = StructType([
    StructField("id", IntegerType(), False),
    StructField("name", StringType(), True),
    StructField("department", StringType(), True),
    StructField("salary", IntegerType(), True),
    StructField("hire_date", StringType(), True)
])

df = spark.createDataFrame(data, schema)

# Write as Delta table
df.write.format("delta").mode("overwrite").save("/data/employees")

# Method 2: Create managed table
df.write.format("delta").saveAsTable("employees")

# Method 3: Create with partitioning
df.write.format("delta") \
    .partitionBy("department") \
    .mode("overwrite") \
    .save("/data/employees_partitioned")

# Method 4: Create using SQL
spark.sql("""
    CREATE TABLE IF NOT EXISTS employees_sql (
        id INT,
        name STRING,
        department STRING,
        salary INT,
        hire_date DATE
    )
    USING DELTA
    PARTITIONED BY (department)
    LOCATION '/data/employees_sql'
""")
```

### Reading Delta Tables

```python
# Read Delta table
df = spark.read.format("delta").load("/data/employees")
df.show()

# Read using table name
df = spark.table("employees")

# Read with SQL
spark.sql("SELECT * FROM delta.`/data/employees`").show()

# Read specific version (Time Travel)
df_v0 = spark.read.format("delta") \
    .option("versionAsOf", 0) \
    .load("/data/employees")

# Read as of timestamp
df_historical = spark.read.format("delta") \
    .option("timestampAsOf", "2024-01-01 00:00:00") \
    .load("/data/employees")
```

## ACID Transactions

### Understanding ACID in Delta Lake

Delta Lake provides full ACID transaction support, which is critical for reliable data pipelines:

```python
from delta.tables import DeltaTable

# Atomicity Example: All-or-nothing operations
# If any part fails, the entire operation is rolled back
try:
    df_updates = spark.createDataFrame([
        (5, "Eve", "Engineering", 85000, "2024-01-01"),
        (6, "Frank", "Marketing", 72000, "2024-01-15")
    ], schema)

    df_updates.write.format("delta") \
        .mode("append") \
        .save("/data/employees")
    print("Transaction committed successfully")
except Exception as e:
    print(f"Transaction failed and rolled back: {e}")

# Isolation Example: Concurrent reads and writes
# Writers don't block readers, readers see consistent snapshots
# Multiple writers are serialized through optimistic concurrency control
```

### Optimistic Concurrency Control

Delta Lake uses optimistic concurrency control to handle concurrent writes:

```python
# Two concurrent transactions on the same table
# Transaction 1: Update salaries in Engineering
delta_table = DeltaTable.forPath(spark, "/data/employees")

delta_table.update(
    condition="department = 'Engineering'",
    set={"salary": "salary * 1.10"}  # 10% raise
)

# Transaction 2: Insert new employee (concurrent)
# Delta Lake will automatically retry if there's a conflict
new_employee = spark.createDataFrame([
    (7, "Grace", "Engineering", 78000, "2024-02-01")
], schema)

new_employee.write.format("delta") \
    .mode("append") \
    .save("/data/employees")

# If both transactions modify the same files, one will fail and retry
# Delta Lake tracks which files are read and written by each transaction
```

### Transaction Log Internals

```python
# View transaction log entries
spark.read.json("/data/employees/_delta_log/*.json").show(truncate=False)

# Each commit JSON contains:
# - add: Files added in this commit
# - remove: Files removed (marked for deletion)
# - metaData: Schema and partition information
# - commitInfo: Timestamp, operation, user info

# View table history
delta_table = DeltaTable.forPath(spark, "/data/employees")
delta_table.history().show(truncate=False)

# History includes:
# - version: Commit version number
# - timestamp: When the commit occurred
# - operation: Type of operation (WRITE, UPDATE, DELETE, MERGE, etc.)
# - operationParameters: Details about the operation
# - readVersion: Version read by this operation
```

## Schema Enforcement and Evolution

### Schema Enforcement

Delta Lake prevents bad data from corrupting your tables by enforcing schema on write:

```python
# Original schema
original_df = spark.createDataFrame([
    (1, "Alice", 75000)
], ["id", "name", "salary"])

original_df.write.format("delta").mode("overwrite").save("/data/employees_strict")

# Attempt to write data with different schema
# This will FAIL due to schema mismatch
try:
    bad_df = spark.createDataFrame([
        (2, "Bob", "Engineering", 65000)  # Extra column
    ], ["id", "name", "department", "salary"])

    bad_df.write.format("delta") \
        .mode("append") \
        .save("/data/employees_strict")
except Exception as e:
    print(f"Schema enforcement error: {e}")

# Attempt to write with wrong data types
try:
    wrong_type_df = spark.createDataFrame([
        (3, "Charlie", "not_a_number")  # String instead of int
    ], ["id", "name", "salary"])

    wrong_type_df.write.format("delta") \
        .mode("append") \
        .save("/data/employees_strict")
except Exception as e:
    print(f"Type mismatch error: {e}")
```

### Schema Evolution

Delta Lake supports safe schema evolution with explicit controls:

```python
# Enable schema evolution with mergeSchema
new_df = spark.createDataFrame([
    (4, "Diana", 70000, "Sales")
], ["id", "name", "salary", "department"])

new_df.write.format("delta") \
    .mode("append") \
    .option("mergeSchema", "true") \
    .save("/data/employees_strict")

# Overwrite schema entirely (use with caution)
completely_new_df = spark.createDataFrame([
    (1, "Alice", "alice@example.com", True)
], ["id", "name", "email", "active"])

completely_new_df.write.format("delta") \
    .mode("overwrite") \
    .option("overwriteSchema", "true") \
    .save("/data/employees_strict")

# Schema evolution with SQL
spark.sql("""
    ALTER TABLE employees ADD COLUMNS (
        email STRING COMMENT 'Employee email address',
        phone STRING COMMENT 'Contact phone number'
    )
""")

# Change column type (limited support)
spark.sql("""
    ALTER TABLE employees ALTER COLUMN salary TYPE BIGINT
""")

# Rename columns (Delta Lake 2.0+)
spark.sql("""
    ALTER TABLE employees RENAME COLUMN hire_date TO start_date
""")
```

### Schema Evolution Best Practices

```python
# Best Practice 1: Use explicit schema definitions
schema = StructType([
    StructField("id", LongType(), nullable=False),
    StructField("name", StringType(), nullable=False),
    StructField("department", StringType(), nullable=True),
    StructField("salary", DecimalType(10, 2), nullable=True),
    StructField("hire_date", DateType(), nullable=True),
    # Add new columns with nullable=True for backward compatibility
    StructField("email", StringType(), nullable=True)
])

# Best Practice 2: Validate schema before writing
def validate_and_write(df, path, expected_schema):
    """Validate DataFrame schema before writing to Delta table."""
    # Check for missing required columns
    expected_cols = {f.name for f in expected_schema.fields if not f.nullable}
    actual_cols = set(df.columns)

    missing = expected_cols - actual_cols
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    # Write with schema enforcement
    df.write.format("delta") \
        .mode("append") \
        .save(path)

# Best Practice 3: Use schema evolution only for additive changes
# Adding new nullable columns: Safe
# Widening numeric types (int -> long): Safe
# Changing column types arbitrarily: Dangerous
# Removing columns: Not supported (use column mapping)
```

## Time Travel

### Querying Historical Data

Delta Lake maintains a complete history of all changes, enabling powerful time travel capabilities:

```python
from delta.tables import DeltaTable

delta_table = DeltaTable.forPath(spark, "/data/employees")

# View table history
history = delta_table.history()
history.select("version", "timestamp", "operation", "operationParameters").show(truncate=False)

# Query by version number
df_v2 = spark.read.format("delta") \
    .option("versionAsOf", 2) \
    .load("/data/employees")

# Query by timestamp
df_yesterday = spark.read.format("delta") \
    .option("timestampAsOf", "2024-01-14") \
    .load("/data/employees")

# SQL syntax for time travel
spark.sql("""
    SELECT * FROM employees VERSION AS OF 2
""").show()

spark.sql("""
    SELECT * FROM employees TIMESTAMP AS OF '2024-01-14 10:00:00'
""").show()

# Compare versions
df_v1 = spark.read.format("delta").option("versionAsOf", 1).load("/data/employees")
df_v3 = spark.read.format("delta").option("versionAsOf", 3).load("/data/employees")

# Find differences between versions
df_v1.exceptAll(df_v3).show()  # Rows in v1 but not in v3
df_v3.exceptAll(df_v1).show()  # Rows in v3 but not in v1
```

### Restoring Previous Versions

```python
# Restore table to a previous version
delta_table = DeltaTable.forPath(spark, "/data/employees")

# Restore to version 2
delta_table.restoreToVersion(2)

# Restore to a timestamp
delta_table.restoreToTimestamp("2024-01-14 10:00:00")

# SQL syntax
spark.sql("RESTORE TABLE employees TO VERSION AS OF 2")
spark.sql("RESTORE TABLE employees TO TIMESTAMP AS OF '2024-01-14 10:00:00'")

# Note: RESTORE creates a new version, it doesn't delete history
# You can always restore back if needed
```

### Managing Table History

```python
# Configure retention period for time travel
spark.sql("""
    ALTER TABLE employees
    SET TBLPROPERTIES (
        'delta.logRetentionDuration' = 'interval 30 days',
        'delta.deletedFileRetentionDuration' = 'interval 7 days'
    )
""")

# Vacuum to remove old files (reclaim storage)
# WARNING: This permanently removes data files older than retention period
delta_table = DeltaTable.forPath(spark, "/data/employees")

# Dry run to see what would be deleted
delta_table.vacuum(168)  # 168 hours = 7 days

# Actually delete (requires disabling safety check)
spark.conf.set("spark.databricks.delta.retentionDurationCheck.enabled", "false")
delta_table.vacuum(0)  # Delete all old files immediately

# Best practice: Keep sufficient history for debugging and auditing
# Default: 30 days for log, 7 days for data files
```

## MERGE Operations (Upserts)

### Basic MERGE Syntax

MERGE (also known as upsert) is one of Delta Lake's most powerful features, enabling complex CDC and SCD patterns:

```python
from delta.tables import DeltaTable

# Create target table
target_data = [
    (1, "Alice", "Engineering", 75000),
    (2, "Bob", "Marketing", 65000),
    (3, "Charlie", "Engineering", 80000)
]
target_df = spark.createDataFrame(target_data, ["id", "name", "department", "salary"])
target_df.write.format("delta").mode("overwrite").save("/data/employees_merge")

# Source data with updates and new records
source_data = [
    (1, "Alice", "Engineering", 78000),  # Update: salary change
    (2, "Bob", "Sales", 68000),           # Update: department and salary
    (4, "Diana", "Marketing", 72000)      # Insert: new employee
]
source_df = spark.createDataFrame(source_data, ["id", "name", "department", "salary"])

# Perform MERGE operation
delta_table = DeltaTable.forPath(spark, "/data/employees_merge")

delta_table.alias("target").merge(
    source_df.alias("source"),
    "target.id = source.id"
).whenMatchedUpdate(
    set={
        "name": "source.name",
        "department": "source.department",
        "salary": "source.salary"
    }
).whenNotMatchedInsert(
    values={
        "id": "source.id",
        "name": "source.name",
        "department": "source.department",
        "salary": "source.salary"
    }
).execute()
```

### Conditional MERGE Operations

```python
# MERGE with conditions
delta_table.alias("target").merge(
    source_df.alias("source"),
    "target.id = source.id"
).whenMatchedUpdate(
    condition="source.salary > target.salary",  # Only update if new salary is higher
    set={
        "salary": "source.salary",
        "department": "source.department"
    }
).whenMatchedDelete(
    condition="source.department = 'Terminated'"  # Delete if marked as terminated
).whenNotMatchedInsert(
    condition="source.department != 'Contractor'",  # Don't insert contractors
    values={
        "id": "source.id",
        "name": "source.name",
        "department": "source.department",
        "salary": "source.salary"
    }
).execute()

# SQL MERGE syntax
spark.sql("""
    MERGE INTO employees_merge AS target
    USING source_updates AS source
    ON target.id = source.id
    WHEN MATCHED AND source.salary > target.salary THEN
        UPDATE SET
            target.salary = source.salary,
            target.department = source.department
    WHEN MATCHED AND source.is_deleted = true THEN
        DELETE
    WHEN NOT MATCHED AND source.department != 'Contractor' THEN
        INSERT (id, name, department, salary)
        VALUES (source.id, source.name, source.department, source.salary)
""")
```

### SCD Type 2 with MERGE

```python
# Slowly Changing Dimension Type 2 implementation
from pyspark.sql.functions import *

# SCD2 target table schema
scd2_schema = StructType([
    StructField("customer_key", IntegerType(), False),  # Surrogate key
    StructField("customer_id", StringType(), False),     # Business key
    StructField("name", StringType(), True),
    StructField("email", StringType(), True),
    StructField("segment", StringType(), True),
    StructField("effective_date", DateType(), False),
    StructField("end_date", DateType(), True),
    StructField("is_current", BooleanType(), False)
])

def apply_scd2_merge(spark, target_path, source_df, business_key, tracked_columns):
    """
    Apply SCD Type 2 logic using Delta Lake MERGE.

    Args:
        spark: SparkSession
        target_path: Path to Delta table
        source_df: DataFrame with new/updated records
        business_key: Column name for business key
        tracked_columns: List of columns to track for changes
    """
    delta_table = DeltaTable.forPath(spark, target_path)

    # Find records that have changed
    change_condition = " OR ".join([
        f"target.{col} != source.{col}" for col in tracked_columns
    ])

    # Generate new surrogate keys
    max_key = spark.read.format("delta").load(target_path) \
        .agg(max("customer_key")).collect()[0][0] or 0

    # Add metadata columns to source
    source_with_meta = source_df \
        .withColumn("effective_date", current_date()) \
        .withColumn("end_date", lit(None).cast(DateType())) \
        .withColumn("is_current", lit(True))

    # Step 1: Close existing current records that have changes
    delta_table.alias("target").merge(
        source_with_meta.alias("source"),
        f"target.{business_key} = source.{business_key} AND target.is_current = true"
    ).whenMatchedUpdate(
        condition=change_condition,
        set={
            "end_date": "current_date()",
            "is_current": "false"
        }
    ).execute()

    # Step 2: Insert new versions for changed records and new records
    # Get current state of target
    target_current = spark.read.format("delta").load(target_path) \
        .filter("is_current = true")

    # Find truly new records (not in target at all)
    new_records = source_with_meta.join(
        target_current,
        source_with_meta[business_key] == target_current[business_key],
        "left_anti"
    )

    # Find changed records (existed but was just closed)
    changed_records = source_with_meta.join(
        target_current.filter("is_current = false"),
        source_with_meta[business_key] == target_current[business_key],
        "left_semi"
    )

    # Combine and add surrogate keys
    records_to_insert = new_records.union(changed_records) \
        .withColumn("customer_key", monotonically_increasing_id() + max_key + 1)

    records_to_insert.write.format("delta") \
        .mode("append") \
        .save(target_path)

# Example usage
source_updates = spark.createDataFrame([
    ("C001", "Alice Smith", "alice.new@example.com", "Premium"),
    ("C004", "David Brown", "david@example.com", "Standard")
], ["customer_id", "name", "email", "segment"])

apply_scd2_merge(
    spark,
    "/data/customers_scd2",
    source_updates,
    "customer_id",
    ["name", "email", "segment"]
)
```

## Z-Ordering and Data Skipping

### Understanding Z-Ordering

Z-Ordering (also called multi-dimensional clustering) colocates related data in the same files to improve query performance:

```python
# Apply Z-ORDER optimization
from delta.tables import DeltaTable

delta_table = DeltaTable.forPath(spark, "/data/events")

# Z-ORDER by frequently filtered columns
delta_table.optimize().executeZOrderBy("date", "user_id")

# SQL syntax
spark.sql("""
    OPTIMIZE events
    ZORDER BY (date, user_id)
""")

# Z-ORDER with partition filter (more efficient for large tables)
spark.sql("""
    OPTIMIZE events
    WHERE date >= '2024-01-01' AND date < '2024-02-01'
    ZORDER BY (user_id, event_type)
""")
```

### How Z-Ordering Works

```
Without Z-Ordering:
Files contain mixed data, queries must scan many files

File 1: user_id 1,5,9,13,17...  date: mixed
File 2: user_id 2,6,10,14,18... date: mixed
File 3: user_id 3,7,11,15,19... date: mixed

Query: WHERE user_id = 5 --> Scans all files

With Z-Ordering on (date, user_id):
Related data is colocated, enabling data skipping

File 1: user_id 1-100,  date: 2024-01-01 to 2024-01-03
File 2: user_id 1-100,  date: 2024-01-04 to 2024-01-06
File 3: user_id 101-200, date: 2024-01-01 to 2024-01-03

Query: WHERE user_id = 5 AND date = '2024-01-02'
--> Only scans File 1 (min/max statistics enable skipping)
```

### Data Skipping and Statistics

```python
# Delta Lake automatically collects min/max statistics
# These statistics enable efficient data skipping

# View file statistics
spark.sql("""
    DESCRIBE DETAIL delta.`/data/events`
""").show(truncate=False)

# Configure statistics collection
spark.sql("""
    ALTER TABLE events
    SET TBLPROPERTIES (
        'delta.dataSkippingNumIndexedCols' = '32'
    )
""")

# Statistics are collected for:
# - First 32 columns by default (configurable)
# - String columns up to 32 characters
# - Numeric columns (min, max, null count)

# Best practices for data skipping:
# Put frequently filtered columns first in schema
# Use Z-ORDER on high-cardinality filter columns
# Avoid functions on filter columns (WHERE date = '2024-01-01' not WHERE year(date) = 2024)
# Use partition pruning for coarse-grained filtering

# Example: Optimal query pattern
spark.sql("""
    SELECT * FROM events
    WHERE date = '2024-01-15'           -- Partition pruning
      AND user_id BETWEEN 1000 AND 2000  -- Data skipping (Z-ordered)
      AND event_type = 'purchase'        -- Additional filtering
""")
```

### OPTIMIZE and Auto-Compaction

```python
# Manual OPTIMIZE (compact small files)
delta_table = DeltaTable.forPath(spark, "/data/events")
delta_table.optimize().executeCompaction()

# OPTIMIZE with file size target
spark.sql("""
    OPTIMIZE events
    WHERE date >= '2024-01-01'
""")

# Configure target file size
spark.sql("""
    ALTER TABLE events
    SET TBLPROPERTIES (
        'delta.targetFileSize' = '128mb'
    )
""")

# Auto-compaction (Delta Lake 2.0+)
spark.sql("""
    ALTER TABLE events
    SET TBLPROPERTIES (
        'delta.autoOptimize.autoCompact' = 'true',
        'delta.autoOptimize.optimizeWrite' = 'true'
    )
""")

# Optimized writes (automatic file sizing during write)
df.write.format("delta") \
    .option("optimizeWrite", "true") \
    .mode("append") \
    .save("/data/events")
```

## Integration with Apache Spark

### Spark SQL Integration

```python
# Register Delta table in catalog
spark.sql("""
    CREATE TABLE IF NOT EXISTS events
    USING DELTA
    LOCATION '/data/events'
""")

# Standard SQL operations work seamlessly
spark.sql("""
    SELECT
        date,
        event_type,
        COUNT(*) as event_count,
        COUNT(DISTINCT user_id) as unique_users
    FROM events
    WHERE date >= '2024-01-01'
    GROUP BY date, event_type
    ORDER BY date, event_count DESC
""").show()

# Window functions
spark.sql("""
    SELECT
        user_id,
        event_type,
        event_timestamp,
        ROW_NUMBER() OVER (
            PARTITION BY user_id
            ORDER BY event_timestamp
        ) as event_sequence
    FROM events
""").show()

# CTEs and complex queries
spark.sql("""
    WITH daily_stats AS (
        SELECT
            date,
            COUNT(*) as total_events,
            SUM(CASE WHEN event_type = 'purchase' THEN 1 ELSE 0 END) as purchases
        FROM events
        GROUP BY date
    ),
    weekly_avg AS (
        SELECT AVG(total_events) as avg_daily_events
        FROM daily_stats
    )
    SELECT
        d.*,
        w.avg_daily_events,
        d.total_events / w.avg_daily_events as events_vs_avg
    FROM daily_stats d
    CROSS JOIN weekly_avg w
    ORDER BY d.date
""").show()
```

### Structured Streaming with Delta Lake

```python
# Delta Lake as streaming source
stream_df = spark.readStream \
    .format("delta") \
    .option("ignoreChanges", "true")  # Ignore updates/deletes
    .load("/data/events")

# Process streaming data
processed = stream_df \
    .withWatermark("event_timestamp", "10 minutes") \
    .groupBy(
        window("event_timestamp", "5 minutes"),
        "event_type"
    ).count()

# Delta Lake as streaming sink
query = processed.writeStream \
    .format("delta") \
    .outputMode("append") \
    .option("checkpointLocation", "/checkpoints/events_agg") \
    .trigger(processingTime="1 minute") \
    .start("/data/events_aggregated")

# Stream-to-stream joins with Delta
orders_stream = spark.readStream.format("delta").load("/data/orders")
products = spark.read.format("delta").load("/data/products")  # Static

# Stream-static join
enriched_orders = orders_stream.join(
    products,
    orders_stream.product_id == products.product_id,
    "left"
)

enriched_orders.writeStream \
    .format("delta") \
    .outputMode("append") \
    .option("checkpointLocation", "/checkpoints/enriched_orders") \
    .start("/data/enriched_orders")
```

### Delta Lake with Change Data Feed

```python
# Enable Change Data Feed (CDC)
spark.sql("""
    ALTER TABLE events
    SET TBLPROPERTIES ('delta.enableChangeDataFeed' = 'true')
""")

# Or when creating table
spark.sql("""
    CREATE TABLE events_cdc (
        id BIGINT,
        event_type STRING,
        event_timestamp TIMESTAMP,
        user_id STRING
    )
    USING DELTA
    TBLPROPERTIES ('delta.enableChangeDataFeed' = 'true')
""")

# Read changes between versions
changes_df = spark.read.format("delta") \
    .option("readChangeFeed", "true") \
    .option("startingVersion", 10) \
    .option("endingVersion", 15) \
    .load("/data/events_cdc")

# Change feed includes metadata columns:
# - _change_type: insert, update_preimage, update_postimage, delete
# - _commit_version: version of the commit
# - _commit_timestamp: timestamp of the commit

changes_df.select(
    "_change_type", "_commit_version", "id", "event_type"
).show()

# Stream changes for real-time CDC
cdc_stream = spark.readStream.format("delta") \
    .option("readChangeFeed", "true") \
    .option("startingVersion", "latest") \
    .load("/data/events_cdc")

# Process only inserts and updates
new_and_updated = cdc_stream.filter(
    "_change_type IN ('insert', 'update_postimage')"
)
```

## Performance Optimization

### Partitioning Strategies

```python
# Partition by low-cardinality columns (date, region, etc.)
df.write.format("delta") \
    .partitionBy("date", "region") \
    .mode("overwrite") \
    .save("/data/events_partitioned")

# Partition pruning in queries
spark.sql("""
    SELECT * FROM events_partitioned
    WHERE date = '2024-01-15'  -- Only reads one partition
      AND region = 'US'
""")

# Best practices for partitioning:
# Choose columns with low cardinality (< 1000 distinct values)
# Partition by commonly filtered columns
# Avoid over-partitioning (too many small files)
# Target partition size: 1GB or more

# Check partition sizes
spark.sql("""
    SELECT
        date,
        region,
        COUNT(*) as num_files,
        SUM(size) / 1024 / 1024 as size_mb
    FROM (
        DESCRIBE DETAIL delta.`/data/events_partitioned`
    )
    GROUP BY date, region
    ORDER BY size_mb DESC
""")
```

### File Size Optimization

```python
# Configure target file size
spark.conf.set("spark.databricks.delta.targetFileSize", "134217728")  # 128MB

# Repartition before write for better file sizes
df.repartition(100) \
    .write.format("delta") \
    .mode("append") \
    .save("/data/events")

# Use coalesce to reduce file count
df.coalesce(10) \
    .write.format("delta") \
    .mode("append") \
    .save("/data/events")

# Auto-optimize settings
spark.sql("""
    ALTER TABLE events SET TBLPROPERTIES (
        'delta.autoOptimize.optimizeWrite' = 'true',
        'delta.autoOptimize.autoCompact' = 'true',
        'delta.targetFileSize' = '128mb'
    )
""")

# Compact small files manually
delta_table = DeltaTable.forPath(spark, "/data/events")
delta_table.optimize().executeCompaction()
```

### Query Optimization Tips

```python
# Use predicate pushdown
# Good: Filter is pushed down to file level
spark.sql("SELECT * FROM events WHERE date = '2024-01-15'")

# Bad: Function prevents pushdown
spark.sql("SELECT * FROM events WHERE year(date) = 2024")

# Select only needed columns
# Good: Column pruning
spark.sql("SELECT user_id, event_type FROM events")

# Bad: SELECT * reads all columns
spark.sql("SELECT * FROM events")

# Use broadcast joins for small tables
from pyspark.sql.functions import broadcast

small_df = spark.read.format("delta").load("/data/dim_products")
large_df = spark.read.format("delta").load("/data/fact_events")

result = large_df.join(
    broadcast(small_df),
    large_df.product_id == small_df.product_id
)

# Leverage caching for repeated access
events_df = spark.read.format("delta").load("/data/events").cache()
events_df.count()  # Materialize cache

# Multiple operations on cached data
events_df.groupBy("event_type").count().show()
events_df.groupBy("user_id").count().show()

events_df.unpersist()  # Release cache when done

# Use Delta Lake's built-in statistics
# Ensure frequently filtered columns are in first 32 positions
# Run OPTIMIZE with ZORDER for multi-column filtering
```

## Best Practices and Patterns

### Data Pipeline Patterns

```python
# Bronze-Silver-Gold (Medallion) Architecture with Delta Lake

# Bronze Layer: Raw data ingestion
def ingest_to_bronze(source_path, bronze_path):
    """Ingest raw data with minimal transformation."""
    raw_df = spark.read.json(source_path)

    raw_df.withColumn("_ingestion_timestamp", current_timestamp()) \
        .withColumn("_source_file", input_file_name()) \
        .write.format("delta") \
        .mode("append") \
        .option("mergeSchema", "true") \
        .save(bronze_path)

# Silver Layer: Cleansed and conformed data
def transform_to_silver(bronze_path, silver_path):
    """Apply data quality rules and transformations."""
    bronze_df = spark.read.format("delta").load(bronze_path)

    silver_df = bronze_df \
        .filter("id IS NOT NULL") \
        .dropDuplicates(["id", "event_timestamp"]) \
        .withColumn("event_date", to_date("event_timestamp")) \
        .withColumn("event_hour", hour("event_timestamp"))

    delta_table = DeltaTable.forPath(spark, silver_path)

    delta_table.alias("target").merge(
        silver_df.alias("source"),
        "target.id = source.id AND target.event_timestamp = source.event_timestamp"
    ).whenMatchedUpdateAll() \
     .whenNotMatchedInsertAll() \
     .execute()

# Gold Layer: Business-level aggregates
def aggregate_to_gold(silver_path, gold_path):
    """Create business metrics and aggregations."""
    silver_df = spark.read.format("delta").load(silver_path)

    daily_metrics = silver_df.groupBy("event_date", "event_type") \
        .agg(
            count("*").alias("event_count"),
            countDistinct("user_id").alias("unique_users"),
            avg("duration").alias("avg_duration")
        )

    daily_metrics.write.format("delta") \
        .mode("overwrite") \
        .partitionBy("event_date") \
        .save(gold_path)
```

### Data Quality with Delta Lake

```python
from pyspark.sql.functions import *

# Define data quality checks
def run_data_quality_checks(df, table_name):
    """Run data quality checks and return results."""
    checks = []

    # Null checks
    for col_name in ["id", "event_timestamp", "user_id"]:
        null_count = df.filter(col(col_name).isNull()).count()
        checks.append({
            "check": f"null_check_{col_name}",
            "passed": null_count == 0,
            "details": f"Found {null_count} null values"
        })

    # Duplicate check
    total = df.count()
    distinct = df.dropDuplicates(["id"]).count()
    checks.append({
        "check": "duplicate_check",
        "passed": total == distinct,
        "details": f"Found {total - distinct} duplicates"
    })

    # Range check
    future_events = df.filter(col("event_timestamp") > current_timestamp()).count()
    checks.append({
        "check": "future_timestamp_check",
        "passed": future_events == 0,
        "details": f"Found {future_events} future events"
    })

    # Log results
    for check in checks:
        status = "PASSED" if check["passed"] else "FAILED"
        print(f"{table_name} - {check['check']}: {status} - {check['details']}")

    return all(c["passed"] for c in checks)

# Use constraints (Delta Lake 2.0+)
spark.sql("""
    ALTER TABLE events ADD CONSTRAINT id_not_null CHECK (id IS NOT NULL)
""")

spark.sql("""
    ALTER TABLE events ADD CONSTRAINT valid_event_type
    CHECK (event_type IN ('click', 'view', 'purchase', 'signup'))
""")

# View constraints
spark.sql("SHOW TBLPROPERTIES events").filter("key LIKE 'delta.constraints%'").show()
```

### Maintenance and Operations

```python
# Regular maintenance tasks

def run_table_maintenance(table_path, vacuum_hours=168):
    """Run routine maintenance on Delta table."""
    delta_table = DeltaTable.forPath(spark, table_path)

    # 1. Optimize and Z-Order
    print("Running OPTIMIZE...")
    delta_table.optimize().executeZOrderBy("date", "user_id")

    # 2. Vacuum old files
    print(f"Running VACUUM with {vacuum_hours} hour retention...")
    delta_table.vacuum(vacuum_hours)

    # 3. Generate manifest for external tools
    print("Generating manifest...")
    delta_table.generate("symlink_format_manifest")

    # 4. Collect statistics
    print("Analyzing table...")
    spark.sql(f"ANALYZE TABLE delta.`{table_path}` COMPUTE STATISTICS")

    print("Maintenance complete!")

# Schedule maintenance
# Run daily during low-usage periods

# Monitor table health
def get_table_health(table_path):
    """Get health metrics for Delta table."""
    delta_table = DeltaTable.forPath(spark, table_path)

    # Table details
    details = spark.sql(f"DESCRIBE DETAIL delta.`{table_path}`").collect()[0]

    # File statistics
    file_stats = spark.sql(f"""
        SELECT
            COUNT(*) as num_files,
            SUM(size) / 1024 / 1024 / 1024 as size_gb,
            AVG(size) / 1024 / 1024 as avg_file_size_mb,
            MIN(size) / 1024 / 1024 as min_file_size_mb,
            MAX(size) / 1024 / 1024 as max_file_size_mb
        FROM (
            SELECT size FROM delta.`{table_path}@v{details['version']}`
        )
    """).collect()[0]

    # History length
    history_length = delta_table.history().count()

    return {
        "version": details["version"],
        "num_files": file_stats["num_files"],
        "size_gb": file_stats["size_gb"],
        "avg_file_size_mb": file_stats["avg_file_size_mb"],
        "history_versions": history_length
    }
```

## Interview Key Points

### Common Interview Questions

**Q1: What is Delta Lake and what problems does it solve?**

```
Delta Lake is an open-source storage layer that brings ACID transactions
to data lakes. It solves:

1. Data reliability: ACID transactions prevent partial writes
2. Data quality: Schema enforcement prevents bad data
3. Data versioning: Time travel enables auditing and rollbacks
4. Performance: Z-Ordering and data skipping improve query speed
5. Unified batch/streaming: Same table for both workloads
```

**Q2: How does Delta Lake achieve ACID transactions?**

```
Delta Lake uses a transaction log (_delta_log) that:

1. Records all operations atomically as JSON files
2. Uses optimistic concurrency control for isolation
3. Provides serializable isolation level
4. Enables rollback by replaying log from checkpoints

Key mechanisms:
- Write-ahead logging
- Atomic file renames for commits
- Checkpointing for faster reads
- Conflict resolution via retry
```

**Q3: When should you use Z-Ordering vs Partitioning?**

```
Partitioning:
- Low cardinality columns (< 1000 distinct values)
- Columns frequently used in exact match filters
- Example: date, region, status

Z-Ordering:
- High cardinality columns
- Columns used in range queries
- When you need multi-column optimization
- Example: user_id, timestamp

Best practice: Partition by low-cardinality, Z-Order by high-cardinality
```

**Q4: How do you handle schema evolution in Delta Lake?**

```python
# Safe evolution (adding columns):
df.write.option("mergeSchema", "true").save()

# Complete schema change (use carefully):
df.write.option("overwriteSchema", "true").save()

# Best practices:
# Add new columns as nullable
# Use explicit schema definitions
# Test schema changes in dev first
# Consider column mapping for renames
```

**Q5: What is the medallion architecture?**

```
Three-layer data organization pattern:

Bronze (Raw):
- Ingested data with minimal transformation
- Append-only, preserves source fidelity
- Schema evolution enabled

Silver (Cleansed):
- Deduplicated, validated, conformed
- Business keys established
- Type corrections applied

Gold (Aggregated):
- Business-level metrics and aggregates
- Optimized for BI and reporting
- Denormalized for performance
```

### Performance Troubleshooting

```python
# Diagnose slow queries

# Check file statistics
spark.sql("DESCRIBE DETAIL delta.`/data/events`").show()

# Check if OPTIMIZE is needed
spark.sql("""
    SELECT
        COUNT(*) as num_files,
        AVG(size) / 1024 / 1024 as avg_size_mb
    FROM delta.`/data/events`
""").show()

# Verify partition pruning
spark.sql("EXPLAIN EXTENDED SELECT * FROM events WHERE date = '2024-01-15'").show()

# Check query execution plan
spark.sql("EXPLAIN COST SELECT * FROM events WHERE user_id = '12345'").show()

# Review table properties
spark.sql("SHOW TBLPROPERTIES events").show()
```

## Further Reading

### Official Resources

- [Delta Lake Documentation](https://docs.delta.io/) - Official documentation and guides
- [Delta Lake GitHub](https://github.com/delta-io/delta) - Source code and examples
- [Delta Lake Blog](https://delta.io/blog/) - Latest features and best practices

### Recommended Learning Path

1. **Beginner**: Start with basic CRUD operations and understand the transaction log
2. **Intermediate**: Learn MERGE operations, schema evolution, and time travel
3. **Advanced**: Master Z-Ordering, Change Data Feed, and streaming integration
4. **Expert**: Implement medallion architecture and optimize for production workloads

### Related Technologies

- **Apache Iceberg**: Alternative open table format with similar capabilities
- **Apache Hudi**: Another data lake table format focused on incremental processing
- **Databricks**: Commercial platform with enhanced Delta Lake features
- **dbt**: Transformation framework that works well with Delta Lake
- **Apache Spark**: The primary compute engine for Delta Lake

### Books and Courses

- **"Delta Lake: The Definitive Guide"** by Denny Lee, Tathagata Das - Comprehensive Delta Lake reference
- **"Data Engineering with Apache Spark, Delta Lake, and Lakehouse"** - Modern data architecture patterns
- Databricks Academy courses on Delta Lake and Lakehouse architecture

---

Delta Lake has become the foundation of modern data lakehouse architectures, providing the reliability of data warehouses with the flexibility of data lakes. By understanding its core features - ACID transactions, schema enforcement, time travel, and optimization techniques - you can build robust, scalable data pipelines that serve both analytics and machine learning workloads. The key is to leverage Delta Lake's strengths while following best practices for partitioning, file optimization, and maintenance to achieve optimal performance at scale.
