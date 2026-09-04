---
title: Apache Spark Big Data Guide
description: Master Spark for large-scale data processing
track: data
section: data-engineering
difficulty: advanced
tags:
  - Spark
  - Big Data
  - PySpark
  - Distributed
status: imported
origin: old/src/content/docs/data/spark.en.md
divergence: 0.139
issues: []
legacy:
  category: Data
  subcategory: Big Data
  order: 8
  lastUpdated: 2026-01-07
---

Apache Spark is one of the most popular big data processing frameworks today, renowned for its exceptional performance, ease of use, and unified programming model. Whether it's batch processing, stream processing, machine learning, or graph computation, Spark provides powerful support. We'll thoroughly cover Spark's core concepts and practical techniques.

## Spark Architecture and Core Concepts

### What is Apache Spark?

Apache Spark is a fast, general-purpose cluster computing system. It provides high-level APIs in Java, Scala, Python, and R, along with an optimized engine that supports general execution graphs. Compared to traditional MapReduce, Spark's in-memory computing model makes it excel in iterative algorithms and interactive data mining.

**Key advantages of Spark:**

- **Speed**: Up to 100x faster than Hadoop MapReduce for in-memory operations
- **Unified Engine**: Single framework for batch, streaming, SQL, ML, and graph processing
- **Ease of Use**: High-level APIs in multiple languages
- **Fault Tolerance**: Automatic recovery through lineage tracking
- **Scalability**: Scales from single machine to thousands of nodes

### Spark Core Components

The Spark ecosystem includes the following core components:

- **Spark Core**: The foundation engine providing in-memory computing and scheduling
- **Spark SQL**: Structured data processing module with DataFrame and Dataset APIs
- **Spark Streaming**: Real-time stream data processing (legacy DStream API)
- **Structured Streaming**: Modern stream processing built on Spark SQL
- **MLlib**: Machine learning library with distributed algorithms
- **GraphX**: Graph computation engine for graph-parallel computation

### Architecture Design

```
                    +------------------+
                    |   Driver Program |
                    |   (SparkContext) |
                    +--------+---------+
                             |
                    +--------v---------+
                    |  Cluster Manager |
                    | (Standalone/YARN/|
                    |   Mesos/K8s)     |
                    +--------+---------+
                             |
         +-------------------+-------------------+
         |                   |                   |
+--------v-------+  +--------v-------+  +--------v-------+
|    Worker      |  |    Worker      |  |    Worker      |
|    Node        |  |    Node        |  |    Node        |
| +-----------+  |  | +-----------+  |  | +-----------+  |
| | Executor  |  |  | | Executor  |  |  | | Executor  |  |
| |  Task     |  |  | |  Task     |  |  | |  Task     |  |
| |  Task     |  |  | |  Task     |  |  | |  Task     |  |
| +-----------+  |  | +-----------+  |  | +-----------+  |
+----------------+  +----------------+  +----------------+
```

The Driver Program contains the main application logic and creates the SparkContext. The Cluster Manager allocates resources across worker nodes, where Executors run tasks in parallel.

### Core Terminology

| Term | Description |
|------|-------------|
| **Driver** | The process running the main() function that creates SparkContext |
| **Executor** | Process running tasks on worker nodes, manages memory and disk storage |
| **Task** | The smallest unit of work sent to an Executor |
| **Job** | Parallel computation triggered by an Action operation |
| **Stage** | A Job is divided into multiple stages based on shuffle boundaries |
| **Partition** | Logical division of data distributed across the cluster |
| **DAG** | Directed Acyclic Graph representing the computation workflow |

### Initializing SparkSession

```python
from pyspark.sql import SparkSession

# Create SparkSession (recommended approach since Spark 2.0+)
spark = SparkSession.builder \
    .appName("MySparkApp") \
    .master("local[*]") \
    .config("spark.executor.memory", "4g") \
    .config("spark.driver.memory", "2g") \
    .config("spark.sql.shuffle.partitions", "200") \
    .getOrCreate()

# Get SparkContext from SparkSession
sc = spark.sparkContext

# Set log level to reduce verbosity
sc.setLogLevel("WARN")

# View configuration
print(f"Spark Version: {spark.version}")
print(f"Application Name: {spark.sparkContext.appName}")
print(f"Master: {spark.sparkContext.master}")

# Stop the session when done
# spark.stop()
```

## RDD Programming Model

### RDD Fundamentals

RDD (Resilient Distributed Dataset) is Spark's core abstraction. It is an immutable, partitioned collection of records that can be processed in parallel across the cluster.

### RDD Characteristics

1. **Immutability**: Once created, an RDD cannot be modified
2. **Partitioning**: Data is automatically distributed across multiple nodes
3. **Fault Tolerance**: Automatic recovery through lineage information
4. **Lazy Evaluation**: Transformation operations are not executed immediately
5. **Persistence**: Can be cached to memory or disk for reuse

### Creating RDDs

```python
# Method 1: From a Python collection
data = [1, 2, 3, 4, 5]
rdd = sc.parallelize(data)
rdd_with_partitions = sc.parallelize(data, numSlices=4)

# Method 2: From external files
text_rdd = sc.textFile("hdfs://path/to/file.txt")
text_rdd_partitioned = sc.textFile("hdfs://path/to/file.txt", minPartitions=10)

# Read multiple files with wildcards
all_logs = sc.textFile("hdfs://path/to/logs/*.log")

# Method 3: From another RDD through transformation
rdd2 = rdd.map(lambda x: x * 2)

# Check partition count
print(f"Number of partitions: {rdd.getNumPartitions()}")
```

### Transformation Operations

Transformations are lazy - they define new RDDs but don't compute them immediately.

```python
# Create sample RDD
numbers = sc.parallelize([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

# map: Apply a function to each element
squared = numbers.map(lambda x: x ** 2)

# filter: Select elements matching a condition
evens = numbers.filter(lambda x: x % 2 == 0)

# flatMap: One-to-many mapping (flattens results)
words = sc.parallelize(["hello world", "spark is great"])
split_words = words.flatMap(lambda line: line.split(" "))

# distinct: Remove duplicates
unique = sc.parallelize([1, 1, 2, 2, 3]).distinct()

# union: Combine two RDDs
rdd1 = sc.parallelize([1, 2, 3])
rdd2 = sc.parallelize([3, 4, 5])
combined = rdd1.union(rdd2)  # [1, 2, 3, 3, 4, 5]

# intersection: Elements in both RDDs
common = rdd1.intersection(rdd2)  # [3]

# subtract: Elements in first but not second
diff = rdd1.subtract(rdd2)  # [1, 2]

# sample: Random sampling
sampled = numbers.sample(withReplacement=False, fraction=0.5, seed=42)

# sortBy: Sort elements
sorted_rdd = numbers.sortBy(lambda x: -x)  # Descending order

# groupBy: Group elements by a key function
grouped = numbers.groupBy(lambda x: x % 2)  # Group by odd/even
```

### Key-Value RDD Operations

```python
# Create key-value pair RDD
pairs = sc.parallelize([
    ("Beijing", 100), ("Shanghai", 200), ("Beijing", 150),
    ("Shanghai", 180), ("Guangzhou", 120), ("Guangzhou", 90)
])

# reduceByKey: Aggregate values by key (more efficient than groupByKey)
totals = pairs.reduceByKey(lambda a, b: a + b)
# Result: [("Beijing", 250), ("Shanghai", 380), ("Guangzhou", 210)]

# groupByKey: Group values by key (use sparingly - causes shuffle)
grouped = pairs.groupByKey().mapValues(list)

# sortByKey: Sort by key
sorted_pairs = pairs.sortByKey()
sorted_desc = pairs.sortByKey(ascending=False)

# mapValues: Apply function only to values
doubled = pairs.mapValues(lambda x: x * 2)

# keys and values: Extract keys or values
all_keys = pairs.keys()
all_values = pairs.values()

# countByKey: Count occurrences of each key
counts = pairs.countByKey()  # {"Beijing": 2, "Shanghai": 2, "Guangzhou": 2}

# join operations
other_pairs = sc.parallelize([("Beijing", "North"), ("Shanghai", "East"), ("Shenzhen", "South")])
joined = pairs.join(other_pairs)           # Inner join
left_joined = pairs.leftOuterJoin(other_pairs)
right_joined = pairs.rightOuterJoin(other_pairs)
full_joined = pairs.fullOuterJoin(other_pairs)

# cogroup: Group data from multiple RDDs by key
cogrouped = pairs.cogroup(other_pairs)
```

### Action Operations

Action operations trigger actual computation and return results to the driver.

```python
numbers = sc.parallelize([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

# collect: Retrieve all data to driver (use carefully with large datasets!)
all_data = numbers.collect()

# count: Count elements
total_count = numbers.count()

# first: Get first element
first_element = numbers.first()

# take: Get first N elements
first_five = numbers.take(5)

# takeOrdered: Get smallest N elements
smallest = numbers.takeOrdered(3)  # [1, 2, 3]

# top: Get largest N elements
largest = numbers.top(3)  # [10, 9, 8]

# reduce: Aggregate all elements using a function
total_sum = numbers.reduce(lambda a, b: a + b)

# fold: Aggregate with initial value
total_with_init = numbers.fold(0, lambda a, b: a + b)

# aggregate: Flexible aggregation with different combine logic
sum_count = numbers.aggregate(
    (0, 0),  # Initial value (sum, count)
    lambda acc, val: (acc[0] + val, acc[1] + 1),  # Within partition
    lambda acc1, acc2: (acc1[0] + acc2[0], acc1[1] + acc2[1])  # Between partitions
)
avg = sum_count[0] / sum_count[1]

# foreach: Apply function to each element (no return value)
numbers.foreach(lambda x: print(x))

# saveAsTextFile: Save to file system
numbers.saveAsTextFile("hdfs://path/to/output")
```

### RDD Persistence

```python
from pyspark import StorageLevel

# Cache to memory (default level)
rdd.cache()  # Equivalent to rdd.persist(StorageLevel.MEMORY_ONLY)

# Different storage levels
rdd.persist(StorageLevel.MEMORY_ONLY)        # Memory only, deserialize on read
rdd.persist(StorageLevel.MEMORY_AND_DISK)    # Spill to disk if memory full
rdd.persist(StorageLevel.DISK_ONLY)          # Disk only
rdd.persist(StorageLevel.MEMORY_ONLY_SER)    # Serialized in memory (space efficient)
rdd.persist(StorageLevel.MEMORY_AND_DISK_SER)
rdd.persist(StorageLevel.OFF_HEAP)           # Off-heap memory

# Replicated storage levels for fault tolerance
rdd.persist(StorageLevel.MEMORY_ONLY_2)      # Replicated on 2 nodes

# Remove from cache
rdd.unpersist()

# Check if cached
print(f"Is cached: {rdd.is_cached}")
```

## DataFrame and SparkSQL

### DataFrame Basics

DataFrame is a distributed collection of data organized into named columns, similar to a table in a relational database or a pandas DataFrame, but distributed across a cluster.

```python
from pyspark.sql import SparkSession
from pyspark.sql.types import *

spark = SparkSession.builder.appName("DataFrameDemo").getOrCreate()

# Create DataFrame from Python objects
data = [
    ("Alice", 25, "New York", 15000.0),
    ("Bob", 30, "San Francisco", 20000.0),
    ("Charlie", 35, "Los Angeles", 18000.0),
    ("Diana", 28, "Seattle", 22000.0)
]
columns = ["name", "age", "city", "salary"]
df = spark.createDataFrame(data, columns)

# Display data
df.show()
df.show(truncate=False)  # Don't truncate long strings
df.show(n=2, vertical=True)  # Show 2 rows vertically

# View schema
df.printSchema()

# Basic information
print(f"Row count: {df.count()}")
print(f"Column count: {len(df.columns)}")
print(f"Column names: {df.columns}")
print(f"Data types: {df.dtypes}")

# Statistical summary
df.describe().show()
df.summary().show()  # More detailed statistics
```

### Defining Schema with StructType

```python
# Method 1: Define schema using StructType
schema = StructType([
    StructField("id", IntegerType(), nullable=False),
    StructField("name", StringType(), nullable=True),
    StructField("age", IntegerType(), nullable=True),
    StructField("salary", DoubleType(), nullable=True),
    StructField("department", StringType(), nullable=True)
])

data = [
    (1, "Alice", 25, 15000.0, "Engineering"),
    (2, "Bob", 30, 20000.0, "Marketing"),
    (3, "Charlie", 35, 18000.0, "Engineering")
]

df = spark.createDataFrame(data, schema)
df.printSchema()

# Method 2: Define schema using DDL string
ddl_schema = "id INT, name STRING, age INT, salary DOUBLE, department STRING"
df = spark.createDataFrame(data, ddl_schema)

# Method 3: Infer schema from data (convenient but slower)
df = spark.createDataFrame(data, ["id", "name", "age", "salary", "department"])
```

### DataFrame Operations

```python
from pyspark.sql.functions import *

# Select columns
df.select("name", "age").show()
df.select(df.name, df.age).show()
df.select(col("name"), col("age")).show()

# Select with expressions
df.select(
    col("name"),
    col("salary"),
    (col("salary") * 12).alias("annual_salary")
).show()

# Add new columns
df = df.withColumn("annual_salary", col("salary") * 12)
df = df.withColumn("age_group",
    when(col("age") < 30, "Young")
    .when(col("age") < 40, "Middle")
    .otherwise("Senior"))

# Rename columns
df = df.withColumnRenamed("salary", "monthly_salary")

# Drop columns
df = df.drop("annual_salary")

# Filter data
df.filter(col("age") > 28).show()
df.filter("age > 28").show()  # SQL expression
df.where(col("city").isin(["New York", "Seattle"])).show()

# Multiple conditions
df.filter((col("age") > 25) & (col("salary") > 17000)).show()

# Sort/Order
df.orderBy("age").show()
df.orderBy(col("age").desc()).show()
df.sort("city", "age").show()

# Remove duplicates
df.distinct().show()
df.dropDuplicates(["city"]).show()

# Limit rows
df.limit(2).show()

# Aggregation operations
df.groupBy("city").agg(
    count("*").alias("count"),
    avg("salary").alias("avg_salary"),
    max("age").alias("max_age"),
    min("age").alias("min_age"),
    sum("salary").alias("total_salary")
).show()
```

### SparkSQL Queries

```python
# Register temporary view
df.createOrReplaceTempView("employees")

# Register global temporary view (available across sessions)
df.createOrReplaceGlobalTempView("global_employees")

# SQL queries
result = spark.sql("""
    SELECT city,
           COUNT(*) as employee_count,
           AVG(salary) as avg_salary,
           SUM(salary) as total_salary
    FROM employees
    WHERE age >= 25
    GROUP BY city
    HAVING COUNT(*) > 0
    ORDER BY avg_salary DESC
""")
result.show()

# Complex query with subqueries
spark.sql("""
    SELECT e1.name, e1.salary,
           (SELECT AVG(salary) FROM employees) as company_avg_salary,
           e1.salary - (SELECT AVG(salary) FROM employees) as difference
    FROM employees e1
    WHERE e1.salary > (SELECT AVG(salary) FROM employees)
""").show()

# Window functions in SQL
spark.sql("""
    SELECT name, city, salary,
           ROW_NUMBER() OVER (PARTITION BY city ORDER BY salary DESC) as city_rank,
           RANK() OVER (ORDER BY salary DESC) as company_rank,
           SUM(salary) OVER (PARTITION BY city) as city_total_salary,
           AVG(salary) OVER () as company_average
    FROM employees
""").show()

# Common Table Expressions (CTEs)
spark.sql("""
    WITH city_stats AS (
        SELECT city, AVG(salary) as avg_salary
        FROM employees
        GROUP BY city
    )
    SELECT e.name, e.salary, c.avg_salary as city_avg
    FROM employees e
    JOIN city_stats c ON e.city = c.city
    WHERE e.salary > c.avg_salary
""").show()
```

### Advanced DataFrame Operations

```python
from pyspark.sql.window import Window

# Window functions using DataFrame API
window_spec = Window.partitionBy("city").orderBy(col("salary").desc())

df_with_rank = df.withColumn("city_rank", row_number().over(window_spec)) \
                 .withColumn("city_total_salary", sum("salary").over(Window.partitionBy("city")))

# Join operations
employees = spark.createDataFrame([
    (1, "Alice", 101),
    (2, "Bob", 102),
    (3, "Charlie", 101),
    (4, "Diana", None)  # No department
], ["emp_id", "name", "dept_id"])

departments = spark.createDataFrame([
    (101, "Engineering"),
    (102, "Marketing"),
    (103, "Finance")  # No employees
], ["dept_id", "dept_name"])

# Inner join (only matching rows)
employees.join(departments, "dept_id").show()

# Left join (all employees, matching departments)
employees.join(departments, "dept_id", "left").show()

# Right join (all departments, matching employees)
employees.join(departments, "dept_id", "right").show()

# Full outer join (all rows from both)
employees.join(departments, "dept_id", "outer").show()

# Cross join (cartesian product)
employees.crossJoin(departments).show()

# Join with multiple conditions
employees.join(departments,
    (employees.dept_id == departments.dept_id) &
    (employees.name != "Alice"),
    "inner").show()

# Union operations
df1 = spark.createDataFrame([(1, "A"), (2, "B")], ["id", "name"])
df2 = spark.createDataFrame([(3, "C"), (4, "D")], ["id", "name"])
df1.union(df2).show()
df1.unionByName(df2).show()  # Match by column name
```

## Data Sources

### Reading from Multiple Sources

```python
# CSV files
df_csv = spark.read.csv("path/to/file.csv", header=True, inferSchema=True)
df_csv = spark.read.format("csv") \
    .option("header", "true") \
    .option("inferSchema", "true") \
    .option("delimiter", ",") \
    .option("encoding", "UTF-8") \
    .option("nullValue", "NA") \
    .option("dateFormat", "yyyy-MM-dd") \
    .load("path/to/file.csv")

# JSON files
df_json = spark.read.json("path/to/file.json")
df_json = spark.read.format("json") \
    .option("multiline", "true") \
    .load("path/to/file.json")

# Parquet files (recommended columnar format)
df_parquet = spark.read.parquet("path/to/file.parquet")

# ORC files (optimized row columnar)
df_orc = spark.read.orc("path/to/file.orc")

# Avro files
df_avro = spark.read.format("avro").load("path/to/file.avro")

# Delta Lake (ACID transactions)
df_delta = spark.read.format("delta").load("path/to/delta_table")

# JDBC databases
df_jdbc = spark.read.format("jdbc") \
    .option("url", "jdbc:postgresql://localhost:5432/database") \
    .option("dbtable", "table_name") \
    .option("user", "username") \
    .option("password", "password") \
    .option("driver", "org.postgresql.Driver") \
    .load()

# Partitioned JDBC read for large tables (parallel reads)
df_jdbc_partitioned = spark.read.format("jdbc") \
    .option("url", "jdbc:postgresql://localhost:5432/database") \
    .option("dbtable", "large_table") \
    .option("user", "username") \
    .option("password", "password") \
    .option("partitionColumn", "id") \
    .option("lowerBound", "1") \
    .option("upperBound", "1000000") \
    .option("numPartitions", "10") \
    .load()

# Hive tables
spark.sql("USE my_database")
df_hive = spark.sql("SELECT * FROM my_table")
df_hive = spark.table("my_database.my_table")

# Kafka
df_kafka = spark.read.format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "topic_name") \
    .load()
```

### Writing Data

```python
# CSV
df.write.csv("output/csv", header=True, mode="overwrite")

# JSON
df.write.json("output/json", mode="overwrite")

# Parquet (recommended for analytics)
df.write.parquet("output/parquet", mode="overwrite", compression="snappy")

# Partitioned write (efficient for filtering)
df.write.partitionBy("year", "month") \
    .parquet("output/partitioned", mode="overwrite")

# Bucketed write (efficient for joins)
df.write.bucketBy(100, "user_id").sortBy("user_id") \
    .saveAsTable("bucketed_table")

# JDBC
df.write.format("jdbc") \
    .option("url", "jdbc:postgresql://localhost:5432/database") \
    .option("dbtable", "output_table") \
    .option("user", "username") \
    .option("password", "password") \
    .mode("overwrite") \
    .save()

# Hive tables
df.write.saveAsTable("my_database.my_table", mode="overwrite")
df.write.insertInto("my_database.existing_table")

# Delta Lake
df.write.format("delta").mode("overwrite").save("output/delta")

# Write modes:
# - overwrite: Replace existing data
# - append: Add to existing data
# - ignore: Skip if data exists
# - error/errorifexists: Throw error if exists (default)

# Coalesce/Repartition before write
df.coalesce(1).write.csv("output/single_file", header=True)  # Single file
df.repartition(10).write.parquet("output/ten_files")  # Specific file count
```

## Performance Tuning

### Partition Optimization

```python
# Check current partition count
print(f"Partition count: {df.rdd.getNumPartitions()}")

# Repartition (increases or decreases, causes full shuffle)
df_repartitioned = df.repartition(100)
df_repartitioned = df.repartition(10, "city")  # Partition by column

# Coalesce (only decreases, no shuffle - more efficient)
df_coalesced = df.coalesce(10)

# Partition sizing guidelines:
# - Each partition should be ~128MB
# - Partition count = Total data size / 128MB
# - Partition count should be 2-3x the number of executor cores

# Configure shuffle partition count
spark.conf.set("spark.sql.shuffle.partitions", 200)

# Adaptive Query Execution (AQE) - Spark 3.0+
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
spark.conf.set("spark.sql.adaptive.localShuffleReader.enabled", "true")
```

### Caching Strategy

```python
# Cache DataFrame
df.cache()  # Equivalent to persist(StorageLevel.MEMORY_AND_DISK)
df.persist()

# Check if cached
print(f"Is cached: {df.is_cached}")

# Release cache
df.unpersist()

# Cache in SQL
spark.sql("CACHE TABLE my_table")
spark.sql("UNCACHE TABLE my_table")

# Caching best practices:
# Only cache data that will be reused multiple times
# Cache after filtering to reduce memory usage
# Release cache when data is no longer needed
# Monitor memory usage in Spark UI
```

### Shuffle Optimization

```python
# Avoid unnecessary shuffles
# Bad: groupBy then filter
df.groupBy("city").count().filter(col("count") > 10)

# Good: filter then groupBy (less data to shuffle)
df.filter(col("amount") > 0).groupBy("city").count()

# Use Broadcast Join to avoid shuffle
from pyspark.sql.functions import broadcast

# Broadcast small table (< 10MB default threshold)
small_df = spark.createDataFrame([...])
result = large_df.join(broadcast(small_df), "key")

# Configure broadcast threshold
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", 10 * 1024 * 1024)  # 10MB

# Use Sort-Merge Join for large tables
spark.conf.set("spark.sql.join.preferSortMergeJoin", "true")

# Handle data skew with salting
from pyspark.sql.functions import rand, concat, lit

# Add random salt to skewed keys
df_with_salt = df.withColumn("salted_key",
    concat(col("key"), lit("_"), (rand() * 10).cast("int")))

# Use AQE for automatic skew handling
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionFactor", "5")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes", "256MB")
```

### Memory Management

```python
# Executor memory configuration
# spark.executor.memory: Total heap memory per executor
# spark.memory.fraction: Fraction for execution and storage (default 0.6)
# spark.memory.storageFraction: Fraction of spark.memory.fraction for storage (default 0.5)

# Configuration example
spark = SparkSession.builder \
    .appName("MemoryOptimization") \
    .config("spark.executor.memory", "8g") \
    .config("spark.executor.memoryOverhead", "2g") \
    .config("spark.memory.fraction", "0.6") \
    .config("spark.memory.storageFraction", "0.5") \
    .config("spark.sql.shuffle.partitions", "200") \
    .getOrCreate()

# Serialization optimization
spark.conf.set("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
spark.conf.set("spark.kryoserializer.buffer.max", "1024m")

# Register classes with Kryo for better performance
spark.conf.set("spark.kryo.registrationRequired", "false")

# GC optimization recommendations:
# Use G1GC: -XX:+UseG1GC
# Set max GC pause: -XX:MaxGCPauseMillis=500
# Enable GC logging: -XX:+PrintGCDetails -XX:+PrintGCTimeStamps
```

### Execution Plan Analysis

```python
# View logical plan
df.explain()

# View extended execution plan
df.explain(mode="extended")

# View cost estimation
df.explain(mode="cost")

# View formatted output
df.explain(mode="formatted")

# View codegen
df.explain(mode="codegen")

# Practical example
complex_df = df.filter(col("age") > 25) \
    .groupBy("city") \
    .agg(avg("salary").alias("avg_salary")) \
    .orderBy(col("avg_salary").desc())

complex_df.explain(mode="formatted")

# Key things to look for in execution plans:
# - FileScan: How data is being read
# - Exchange: Shuffle operations (expensive)
# - HashAggregate vs SortAggregate
# - BroadcastHashJoin vs SortMergeJoin
# - Filters pushed down to data source
```

## Spark Streaming

### Structured Streaming Basics

Spark Structured Streaming is a scalable, fault-tolerant stream processing engine built on the Spark SQL engine.

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import *

spark = SparkSession.builder \
    .appName("StructuredStreaming") \
    .getOrCreate()

# Read streaming data from socket
lines = spark.readStream \
    .format("socket") \
    .option("host", "localhost") \
    .option("port", 9999) \
    .load()

# Process streaming data - word count example
words = lines.select(explode(split(col("value"), " ")).alias("word"))
word_counts = words.groupBy("word").count()

# Output streaming data
query = word_counts.writeStream \
    .outputMode("complete") \
    .format("console") \
    .start()

query.awaitTermination()
```

### Kafka Stream Processing

```python
# Read from Kafka
df_stream = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "input_topic") \
    .option("startingOffsets", "latest") \
    .option("failOnDataLoss", "false") \
    .load()

# Parse JSON data from Kafka messages
schema = StructType([
    StructField("user_id", StringType()),
    StructField("event_type", StringType()),
    StructField("timestamp", TimestampType()),
    StructField("amount", DoubleType())
])

parsed = df_stream.select(
    from_json(col("value").cast("string"), schema).alias("data")
).select("data.*")

# Windowed aggregation with watermark
windowed = parsed \
    .withWatermark("timestamp", "10 minutes") \
    .groupBy(
        window(col("timestamp"), "5 minutes", "1 minute"),
        col("event_type")
    ).agg(
        count("*").alias("event_count"),
        sum("amount").alias("total_amount")
    )

# Write to Kafka
query = windowed.selectExpr(
    "CAST(event_type AS STRING) AS key",
    "to_json(struct(*)) AS value"
).writeStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("topic", "output_topic") \
    .option("checkpointLocation", "/tmp/checkpoint") \
    .outputMode("update") \
    .start()
```

### Stream Processing Output Modes

```python
# Append mode: Only output new rows (for queries without aggregations)
query = df.writeStream \
    .outputMode("append") \
    .format("parquet") \
    .option("path", "output/parquet") \
    .option("checkpointLocation", "checkpoint/path") \
    .start()

# Complete mode: Output entire result table (for aggregation queries)
query = aggregated_df.writeStream \
    .outputMode("complete") \
    .format("console") \
    .start()

# Update mode: Only output updated rows
query = aggregated_df.writeStream \
    .outputMode("update") \
    .format("console") \
    .start()
```

### Advanced Streaming Features

```python
# Watermarking for handling late data
df_with_watermark = df_stream \
    .withWatermark("event_time", "10 minutes") \
    .groupBy(
        window(col("event_time"), "5 minutes"),
        col("device_id")
    ).count()

# Stream-stream join
impression_stream = spark.readStream.format("kafka")...
click_stream = spark.readStream.format("kafka")...

# Join with watermarks
joined = impression_stream \
    .withWatermark("impression_time", "2 hours") \
    .join(
        click_stream.withWatermark("click_time", "3 hours"),
        expr("""
            impression_id = click_impression_id AND
            click_time >= impression_time AND
            click_time <= impression_time + interval 1 hour
        """),
        "leftOuter"
    )

# foreachBatch for custom output logic
def process_batch(batch_df, batch_id):
    # Custom processing logic
    batch_df.write.mode("append").jdbc(...)
    # Or call external APIs, write to multiple sinks, etc.

query = df.writeStream \
    .foreachBatch(process_batch) \
    .option("checkpointLocation", "checkpoint/path") \
    .start()

# Triggers
query = df.writeStream \
    .trigger(processingTime="10 seconds") \  # Micro-batch every 10s
    # .trigger(once=True) \  # Process once and stop
    # .trigger(continuous="1 second") \  # Continuous processing (experimental)
    .start()
```

## MLlib Machine Learning

### Machine Learning Workflow Overview

```python
from pyspark.ml import Pipeline
from pyspark.ml.feature import *
from pyspark.ml.classification import *
from pyspark.ml.evaluation import *
from pyspark.ml.tuning import *

# Load data
data = spark.read.csv("data.csv", header=True, inferSchema=True)

# View data
data.show(5)
data.printSchema()

# Split data
train_data, test_data = data.randomSplit([0.8, 0.2], seed=42)
```

### Feature Engineering

```python
# String indexing (convert categorical strings to numeric indices)
string_indexer = StringIndexer(inputCol="category", outputCol="category_index")

# One-hot encoding
one_hot_encoder = OneHotEncoder(inputCol="category_index", outputCol="category_vec")

# Vector assembly (combine multiple features into single vector)
assembler = VectorAssembler(
    inputCols=["feature1", "feature2", "feature3", "category_vec"],
    outputCol="features"
)

# Standard scaling (zero mean, unit variance)
scaler = StandardScaler(
    inputCol="features",
    outputCol="scaled_features",
    withMean=True,
    withStd=True
)

# Normalization (scale to unit norm)
normalizer = Normalizer(inputCol="features", outputCol="normalized_features", p=2.0)

# Min-Max scaling (scale to [0, 1])
min_max_scaler = MinMaxScaler(inputCol="features", outputCol="minmax_features")

# PCA dimensionality reduction
pca = PCA(k=3, inputCol="features", outputCol="pca_features")

# Feature selection using Chi-squared test
selector = ChiSqSelector(
    numTopFeatures=50,
    featuresCol="features",
    outputCol="selected_features",
    labelCol="label"
)

# Text processing
tokenizer = Tokenizer(inputCol="text", outputCol="words")
remover = StopWordsRemover(inputCol="words", outputCol="filtered_words")

# TF-IDF
hashing_tf = HashingTF(inputCol="words", outputCol="raw_features", numFeatures=1000)
idf = IDF(inputCol="raw_features", outputCol="tfidf_features")

# Word2Vec
word2vec = Word2Vec(vectorSize=100, minCount=5, inputCol="words", outputCol="word_vectors")
```

### Classification Models

```python
from pyspark.ml.feature import StringIndexer, VectorAssembler

# Label indexing
label_indexer = StringIndexer(inputCol="label", outputCol="indexed_label")

# Feature assembly
assembler = VectorAssembler(inputCols=["col1", "col2", "col3"], outputCol="features")

# Split data
train_data, test_data = data.randomSplit([0.8, 0.2], seed=42)

# Logistic Regression
from pyspark.ml.classification import LogisticRegression

lr = LogisticRegression(
    featuresCol="features",
    labelCol="indexed_label",
    maxIter=100,
    regParam=0.01,
    elasticNetParam=0.8  # L1/L2 regularization mix
)

# Decision Tree
from pyspark.ml.classification import DecisionTreeClassifier

dt = DecisionTreeClassifier(
    featuresCol="features",
    labelCol="indexed_label",
    maxDepth=5,
    minInstancesPerNode=1
)

# Random Forest
from pyspark.ml.classification import RandomForestClassifier

rf = RandomForestClassifier(
    featuresCol="features",
    labelCol="indexed_label",
    numTrees=100,
    maxDepth=10,
    featureSubsetStrategy="auto"
)

# Gradient Boosted Trees
from pyspark.ml.classification import GBTClassifier

gbt = GBTClassifier(
    featuresCol="features",
    labelCol="indexed_label",
    maxIter=100,
    maxDepth=5
)

# Multilayer Perceptron (Neural Network)
from pyspark.ml.classification import MultilayerPerceptronClassifier

layers = [4, 8, 4, 2]  # Input, hidden layers, output
mlp = MultilayerPerceptronClassifier(
    layers=layers,
    featuresCol="features",
    labelCol="indexed_label",
    maxIter=100
)
```

### Building ML Pipeline

```python
from pyspark.ml import Pipeline

# Define pipeline stages
pipeline = Pipeline(stages=[
    string_indexer,
    assembler,
    scaler,
    rf
])

# Train model
model = pipeline.fit(train_data)

# Make predictions
predictions = model.transform(test_data)
predictions.select("features", "label", "prediction", "probability").show()

# Evaluate model
from pyspark.ml.evaluation import MulticlassClassificationEvaluator

evaluator = MulticlassClassificationEvaluator(
    labelCol="indexed_label",
    predictionCol="prediction",
    metricName="accuracy"
)

accuracy = evaluator.evaluate(predictions)
print(f"Accuracy: {accuracy:.4f}")

# Other evaluation metrics
for metric in ["accuracy", "weightedPrecision", "weightedRecall", "f1"]:
    evaluator.setMetricName(metric)
    print(f"{metric}: {evaluator.evaluate(predictions):.4f}")

# Binary classification metrics
from pyspark.ml.evaluation import BinaryClassificationEvaluator

binary_evaluator = BinaryClassificationEvaluator(
    labelCol="indexed_label",
    metricName="areaUnderROC"
)
auc = binary_evaluator.evaluate(predictions)
print(f"AUC: {auc:.4f}")
```

### Hyperparameter Tuning

```python
from pyspark.ml.tuning import CrossValidator, ParamGridBuilder

# Define parameter grid
param_grid = ParamGridBuilder() \
    .addGrid(rf.numTrees, [50, 100, 200]) \
    .addGrid(rf.maxDepth, [5, 10, 15]) \
    .addGrid(rf.minInstancesPerNode, [1, 2, 5]) \
    .build()

# Cross-validation
cv = CrossValidator(
    estimator=pipeline,
    estimatorParamMaps=param_grid,
    evaluator=evaluator,
    numFolds=5,
    parallelism=4  # Parallel model training
)

# Train and find best model
cv_model = cv.fit(train_data)

# Best model
best_model = cv_model.bestModel

# View best parameters
print(f"Best number of trees: {best_model.stages[-1].getNumTrees}")

# View cross-validation metrics
print(f"Average metrics: {cv_model.avgMetrics}")

# TrainValidationSplit (faster but less stable than CV)
from pyspark.ml.tuning import TrainValidationSplit

tvs = TrainValidationSplit(
    estimator=pipeline,
    estimatorParamMaps=param_grid,
    evaluator=evaluator,
    trainRatio=0.8
)

tvs_model = tvs.fit(train_data)
```

### Save and Load Models

```python
# Save model
model.save("models/my_model")
pipeline.save("models/my_pipeline")

# Save best model from cross-validation
cv_model.bestModel.save("models/best_model")

# Load model
from pyspark.ml import PipelineModel
loaded_model = PipelineModel.load("models/my_model")

# Use loaded model for predictions
predictions = loaded_model.transform(new_data)

# Save/load individual stages
from pyspark.ml.classification import RandomForestClassificationModel
rf_model = RandomForestClassificationModel.load("models/rf_model")
```

## Interview Key Points

### Differences Between RDD, DataFrame, and Dataset

| Feature | RDD | DataFrame | Dataset |
|---------|-----|-----------|---------|
| Type Safety | Yes | No | Yes |
| Optimizer | None | Catalyst | Catalyst |
| Serialization | Java/Kryo | Tungsten | Tungsten |
| API Style | Functional | Declarative | Mixed |
| Languages | All | All | Scala/Java |
| Schema | Unstructured | Structured | Structured |
| Performance | Lower | Higher | Higher |

### How Does Spark Implement Fault Tolerance?

- **RDD Fault Tolerance**: Through Lineage (lineage graph) that records transformation operations; lost partitions can be recomputed
- **Checkpointing**: Persist RDD to reliable storage, truncating the lineage
- **WAL (Write-Ahead Log)**: In Streaming, use write-ahead logs to ensure data is not lost
- **Task Retry**: Failed tasks are automatically retried on different executors
- **Stage Retry**: If a stage fails, Spark reruns the entire stage

### Wide Dependencies vs Narrow Dependencies

```python
# Narrow dependencies: Each parent RDD partition is used by at most one child partition
# Examples: map, filter, union, flatMap
# - Can be computed in parallel without shuffle
# - Allows pipelining of operations

# Wide dependencies: Each parent RDD partition may be used by multiple child partitions
# Examples: groupByKey, reduceByKey, join, repartition
# - Requires shuffle (expensive network I/O)
# - Forms stage boundaries in execution

# Wide dependencies trigger shuffle - the performance bottleneck
```

### The Shuffle Process

1. **Map Phase**: Data is partitioned by key and written to local disk
2. **Shuffle Phase**: Data is transferred over the network to target nodes
3. **Reduce Phase**: Data with the same key is aggregated

**Optimization strategies:**
- Reduce shuffle data volume (filter early, use reduceByKey instead of groupByKey)
- Use Broadcast Join for small tables
- Adjust partition count appropriately
- Enable compression (spark.shuffle.compress)
- Use external shuffle service for stability

### Spark Memory Management

```
Executor Memory = Execution Memory + Storage Memory + User Memory + Reserved Memory

- Execution Memory: Shuffle, Join, Sort, Aggregation buffers
- Storage Memory: Cached RDDs, Broadcast variables
- User Memory: User data structures, metadata
- Reserved Memory: System reserved (~300MB)

Unified Memory Management (Spark 1.6+): Execution and Storage can borrow from each other
```

### How to Handle Data Skew?

```python
# Method 1: Increase parallelism
spark.conf.set("spark.sql.shuffle.partitions", 1000)

# Method 2: Salting (add random prefix to skewed keys)
df = df.withColumn("salted_key", concat(col("key"), lit("_"), (rand() * 10).cast("int")))
# Then aggregate with salted keys and re-aggregate to remove salt

# Method 3: Two-phase aggregation
# First partial aggregation, then global aggregation

# Method 4: Broadcast Join (for join skew)
result = large_df.join(broadcast(small_df), "key")

# Method 5: Adaptive Query Execution (AQE) - Spark 3.0+
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")

# Method 6: Custom partitioner for known skew patterns
```

### Spark Streaming vs Structured Streaming

| Feature | Spark Streaming (Legacy) | Structured Streaming |
|---------|-------------------------|---------------------|
| Programming Model | DStream (RDD-based) | DataFrame/Dataset |
| Semantics | At-least-once | Exactly-once |
| Event Time | Not supported | Supported |
| Watermarking | Not supported | Supported |
| Stream-Stream Join | Limited support | Full support |
| Late Data Handling | Manual | Watermark-based |
| Recommended | No (legacy) | Yes |

### Common Optimization Techniques Summary

```python
# Choose appropriate API
# DataFrame/SQL > RDD (Catalyst optimizer provides significant benefits)

# Set partition count appropriately
# Partition count = Data size / 128MB

# Use columnar storage formats
# Parquet > ORC > JSON > CSV

# Enable AQE (Spark 3.0+)
spark.conf.set("spark.sql.adaptive.enabled", "true")

# Use Broadcast Join for small tables
from pyspark.sql.functions import broadcast
result = large_df.join(broadcast(small_df), "key")

# Cache wisely
df.cache()  # Only for data used multiple times

# Avoid UDFs when possible
# Prefer built-in functions (they run in optimized native code)

# Use Kryo serialization
spark.conf.set("spark.serializer", "org.apache.spark.serializer.KryoSerializer")

# Predicate pushdown
# Filter early, let Spark push filters to data source

# Column pruning
# Select only needed columns early in the pipeline
```

## Further Reading

### Official Resources

- [Apache Spark Official Documentation](https://spark.apache.org/docs/latest/)
- [Spark SQL Guide](https://spark.apache.org/docs/latest/sql-programming-guide.html)
- [MLlib Machine Learning Guide](https://spark.apache.org/docs/latest/ml-guide.html)
- [Structured Streaming Programming Guide](https://spark.apache.org/docs/latest/structured-streaming-programming-guide.html)

### Recommended Books

- **"Learning Spark, 2nd Edition"** - O'Reilly (covers Spark 3.0)
- **"Spark: The Definitive Guide"** - Bill Chambers, Matei Zaharia
- **"High Performance Spark"** - Holden Karau (deep dive into optimization)
- **"Stream Processing with Apache Spark"** - Francois Garillot

### Related Technologies

- **Delta Lake**: ACID transaction support for data lakes
- **Apache Iceberg**: Open table format for analytics
- **Apache Hudi**: Incremental data processing framework
- **Databricks**: Commercial Spark platform with additional features
- **Apache Flink**: Alternative stream processing framework
- **Presto/Trino**: Distributed SQL query engine

### Practice Projects

- Real-time log analysis system with alerting
- User behavior recommendation engine
- Large-scale feature engineering pipeline
- Real-time data warehouse ETL with Delta Lake
- Streaming machine learning with MLlib
- Multi-source data integration platform

---

Apache Spark is a core technology for big data processing, and mastering its principles and best practices is essential for data engineers and data scientists. After reading this guide, you should be able to: design efficient Spark applications, optimize job performance, process real-time streaming data, and build machine learning pipelines. I recommend continuous practice in real projects to fully understand Spark's internal mechanisms and become proficient in tuning applications for production workloads.
