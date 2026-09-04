---
title: PySpark Big Data Processing
description: Big data analytics and processing using Spark's Python API
track: data
section: data-engineering
difficulty: intermediate
tags:
  - PySpark
  - Spark
  - Big Data
  - Python
status: imported
origin: old/src/content/docs/data/pyspark.en.md
divergence: 0.225
issues: []
legacy:
  category: Data
  subcategory: Big Data
  order: 17
  lastUpdated: 2026-01-07
---

PySpark is the Python API for Apache Spark, letting you harness the power of distributed computing while writing code in Python. It combines the simplicity of Python with the scalability of Spark, making it an essential tool for data engineers and data scientists working with large-scale datasets. We'll cover everything from core concepts to advanced optimization techniques.

## Core Concepts

### What is PySpark?

PySpark provides a Pythonic interface to Apache Spark, allowing you to write distributed data processing applications using familiar Python syntax. It supports all of Spark's features including:

- **Spark SQL and DataFrames**: Structured data processing with SQL-like operations
- **Spark Streaming**: Real-time data processing
- **MLlib**: Scalable machine learning library
- **GraphX**: Graph processing (via GraphFrames in Python)

### Installation and Setup

```bash
# Install via pip
pip install pyspark

# Install with specific components
pip install pyspark[sql]
pip install pyspark[ml]

# Install all components
pip install pyspark[all]

# Verify installation
python -c "import pyspark; print(pyspark.__version__)"
```

## SparkSession: The Entry Point

SparkSession is the unified entry point for all PySpark functionality since Spark 2.0. It replaces the older SparkContext, SQLContext, and HiveContext.

### Creating a SparkSession

```python
from pyspark.sql import SparkSession

# Basic SparkSession
spark = SparkSession.builder \
    .appName("MyPySparkApp") \
    .getOrCreate()

# SparkSession with configurations
spark = SparkSession.builder \
    .appName("ConfiguredApp") \
    .master("local[*]") \
    .config("spark.executor.memory", "4g") \
    .config("spark.driver.memory", "2g") \
    .config("spark.sql.shuffle.partitions", "200") \
    .config("spark.serializer", "org.apache.spark.serializer.KryoSerializer") \
    .enableHiveSupport() \
    .getOrCreate()

# Access the SparkContext
sc = spark.sparkContext

# Set log level
sc.setLogLevel("WARN")

# Check configuration
print(f"Spark Version: {spark.version}")
print(f"App Name: {spark.sparkContext.appName}")
print(f"Master: {spark.sparkContext.master}")
print(f"Default Parallelism: {spark.sparkContext.defaultParallelism}")

# Get all configurations
for conf in spark.sparkContext.getConf().getAll():
    print(f"{conf[0]}: {conf[1]}")

# Stop the session when done
# spark.stop()
```

### SparkSession Configuration Options

```python
# Common configuration options
spark = SparkSession.builder \
    .appName("OptimizedApp") \
    .config("spark.sql.adaptive.enabled", "true") \
    .config("spark.sql.adaptive.coalescePartitions.enabled", "true") \
    .config("spark.sql.adaptive.skewJoin.enabled", "true") \
    .config("spark.sql.broadcastTimeout", "600") \
    .config("spark.sql.autoBroadcastJoinThreshold", 10 * 1024 * 1024) \
    .config("spark.default.parallelism", "200") \
    .config("spark.sql.shuffle.partitions", "200") \
    .config("spark.memory.fraction", "0.6") \
    .config("spark.memory.storageFraction", "0.5") \
    .getOrCreate()

# Runtime configuration changes
spark.conf.set("spark.sql.shuffle.partitions", 100)
print(spark.conf.get("spark.sql.shuffle.partitions"))
```

## DataFrames: Structured Data Processing

DataFrames are the primary abstraction in PySpark for working with structured data, providing a distributed collection of data organized into named columns.

### Creating DataFrames

```python
from pyspark.sql import SparkSession
from pyspark.sql.types import *

spark = SparkSession.builder.appName("DataFrameDemo").getOrCreate()

# Method 1: From Python list
data = [
    ("Alice", 25, "Engineering", 75000.0),
    ("Bob", 30, "Marketing", 85000.0),
    ("Charlie", 35, "Engineering", 90000.0),
    ("Diana", 28, "Sales", 70000.0)
]
columns = ["name", "age", "department", "salary"]
df = spark.createDataFrame(data, columns)

# Method 2: Using explicit schema
schema = StructType([
    StructField("id", IntegerType(), nullable=False),
    StructField("name", StringType(), nullable=True),
    StructField("age", IntegerType(), nullable=True),
    StructField("salary", DoubleType(), nullable=True),
    StructField("department", StringType(), nullable=True),
    StructField("hire_date", DateType(), nullable=True)
])

data = [
    (1, "Alice", 25, 75000.0, "Engineering", None),
    (2, "Bob", 30, 85000.0, "Marketing", None),
    (3, "Charlie", 35, 90000.0, "Engineering", None)
]

df = spark.createDataFrame(data, schema)
df.printSchema()

# Method 3: Using DDL string
ddl_schema = "id INT, name STRING, age INT, salary DOUBLE, department STRING"
df = spark.createDataFrame(data, ddl_schema)

# Method 4: From pandas DataFrame
import pandas as pd
pandas_df = pd.DataFrame({
    "name": ["Alice", "Bob", "Charlie"],
    "age": [25, 30, 35],
    "salary": [75000, 85000, 90000]
})
df = spark.createDataFrame(pandas_df)

# Method 5: From RDD
rdd = spark.sparkContext.parallelize(data)
df = spark.createDataFrame(rdd, schema)
```

### Reading Data from External Sources

```python
# CSV files
df_csv = spark.read.csv("path/to/file.csv", header=True, inferSchema=True)

# Detailed CSV options
df_csv = spark.read.format("csv") \
    .option("header", "true") \
    .option("inferSchema", "true") \
    .option("delimiter", ",") \
    .option("encoding", "UTF-8") \
    .option("nullValue", "NA") \
    .option("dateFormat", "yyyy-MM-dd") \
    .option("timestampFormat", "yyyy-MM-dd HH:mm:ss") \
    .option("mode", "DROPMALFORMED") \
    .load("path/to/file.csv")

# JSON files
df_json = spark.read.json("path/to/file.json")
df_json = spark.read.format("json") \
    .option("multiline", "true") \
    .option("mode", "PERMISSIVE") \
    .load("path/to/file.json")

# Parquet files (recommended format)
df_parquet = spark.read.parquet("path/to/file.parquet")

# ORC files
df_orc = spark.read.orc("path/to/file.orc")

# Delta Lake
df_delta = spark.read.format("delta").load("path/to/delta_table")

# Read from JDBC database
df_jdbc = spark.read.format("jdbc") \
    .option("url", "jdbc:postgresql://localhost:5432/database") \
    .option("dbtable", "schema.table_name") \
    .option("user", "username") \
    .option("password", "password") \
    .option("driver", "org.postgresql.Driver") \
    .load()

# Parallel JDBC read for large tables
df_jdbc_parallel = spark.read.format("jdbc") \
    .option("url", "jdbc:postgresql://localhost:5432/database") \
    .option("dbtable", "large_table") \
    .option("user", "username") \
    .option("password", "password") \
    .option("partitionColumn", "id") \
    .option("lowerBound", "1") \
    .option("upperBound", "1000000") \
    .option("numPartitions", "10") \
    .load()

# Read from Hive tables
spark.sql("USE my_database")
df_hive = spark.sql("SELECT * FROM my_table")
df_hive = spark.table("my_database.my_table")
```

### DataFrame Operations

```python
from pyspark.sql.functions import *

# Display data
df.show()                    # Show first 20 rows
df.show(10, truncate=False)  # Show 10 rows without truncation
df.display()                 # Databricks-specific display

# View schema
df.printSchema()

# Basic info
print(f"Rows: {df.count()}")
print(f"Columns: {len(df.columns)}")
print(f"Column names: {df.columns}")
print(f"Data types: {df.dtypes}")

# Statistical summary
df.describe().show()
df.summary().show()  # More detailed statistics

# Select columns
df.select("name", "age").show()
df.select(df.name, df.age).show()
df.select(col("name"), col("age")).show()
df.select("*").show()

# Filter rows
df.filter(col("age") > 28).show()
df.filter("age > 28").show()
df.where(col("department").isin(["Engineering", "Sales"])).show()
df.filter((col("age") > 25) & (col("salary") > 70000)).show()

# Add new columns
df = df.withColumn("annual_bonus", col("salary") * 0.1)
df = df.withColumn("tax", col("salary") * 0.25)
df = df.withColumn("net_salary", col("salary") - col("tax"))

# Conditional columns
df = df.withColumn("age_group",
    when(col("age") < 30, "Young")
    .when(col("age") < 40, "Middle")
    .otherwise("Senior"))

# Rename columns
df = df.withColumnRenamed("salary", "base_salary")

# Drop columns
df = df.drop("annual_bonus", "tax")

# Sort data
df.orderBy("age").show()
df.orderBy(col("salary").desc()).show()
df.sort("department", col("salary").desc()).show()

# Distinct values
df.select("department").distinct().show()
df.dropDuplicates(["department"]).show()

# Limit rows
df.limit(5).show()
```

## RDDs: Resilient Distributed Datasets

RDDs are the fundamental data structure in Spark, representing an immutable, distributed collection of elements that can be processed in parallel.

### Creating RDDs

```python
# From collection
data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
rdd = sc.parallelize(data)
rdd_with_partitions = sc.parallelize(data, numSlices=4)

# From external file
text_rdd = sc.textFile("path/to/file.txt")
text_rdd_partitioned = sc.textFile("hdfs://path/to/file.txt", minPartitions=10)

# From DataFrame
rdd_from_df = df.rdd

# Check partitions
print(f"Number of partitions: {rdd.getNumPartitions()}")
```

### RDD Transformations

Transformations are lazy operations that create a new RDD.

```python
numbers = sc.parallelize([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

# map: Apply function to each element
squared = numbers.map(lambda x: x ** 2)

# filter: Keep elements that satisfy condition
evens = numbers.filter(lambda x: x % 2 == 0)

# flatMap: Map then flatten
words = sc.parallelize(["hello world", "spark is great"])
split_words = words.flatMap(lambda line: line.split(" "))

# distinct: Remove duplicates
unique = sc.parallelize([1, 1, 2, 2, 3]).distinct()

# union: Combine two RDDs
rdd1 = sc.parallelize([1, 2, 3])
rdd2 = sc.parallelize([3, 4, 5])
combined = rdd1.union(rdd2)

# intersection: Common elements
common = rdd1.intersection(rdd2)

# subtract: Elements in rdd1 but not in rdd2
diff = rdd1.subtract(rdd2)

# sample: Random sample
sampled = numbers.sample(withReplacement=False, fraction=0.5, seed=42)

# sortBy: Sort by function
sorted_rdd = numbers.sortBy(lambda x: -x)  # Descending

# groupBy: Group by function
grouped = numbers.groupBy(lambda x: x % 2)  # Group by odd/even
```

### Key-Value RDD Operations

```python
# Create key-value RDD
pairs = sc.parallelize([
    ("New York", 100), ("Boston", 200), ("New York", 150),
    ("Boston", 180), ("Chicago", 120), ("Chicago", 90)
])

# reduceByKey: Aggregate by key
totals = pairs.reduceByKey(lambda a, b: a + b)

# groupByKey: Group values by key
grouped = pairs.groupByKey().mapValues(list)

# sortByKey: Sort by key
sorted_pairs = pairs.sortByKey()

# mapValues: Transform values only
doubled = pairs.mapValues(lambda x: x * 2)

# keys and values
all_keys = pairs.keys()
all_values = pairs.values()

# countByKey: Count by key
counts = pairs.countByKey()

# join: Inner join
other_pairs = sc.parallelize([("New York", "East"), ("Boston", "East"), ("LA", "West")])
joined = pairs.join(other_pairs)

# leftOuterJoin, rightOuterJoin, fullOuterJoin
left_joined = pairs.leftOuterJoin(other_pairs)
right_joined = pairs.rightOuterJoin(other_pairs)
full_joined = pairs.fullOuterJoin(other_pairs)

# cogroup: Group by key across multiple RDDs
cogrouped = pairs.cogroup(other_pairs)
```

### RDD Actions

Actions trigger computation and return results.

```python
numbers = sc.parallelize([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

# collect: Return all elements (use cautiously!)
all_data = numbers.collect()

# count: Number of elements
total_count = numbers.count()

# first: First element
first_element = numbers.first()

# take: First N elements
first_five = numbers.take(5)

# takeOrdered: Smallest N elements
smallest = numbers.takeOrdered(3)

# top: Largest N elements
largest = numbers.top(3)

# reduce: Aggregate all elements
total_sum = numbers.reduce(lambda a, b: a + b)

# fold: Aggregate with initial value
total_with_init = numbers.fold(0, lambda a, b: a + b)

# aggregate: More flexible aggregation
sum_count = numbers.aggregate(
    (0, 0),  # Initial value (sum, count)
    lambda acc, val: (acc[0] + val, acc[1] + 1),  # Within partition
    lambda acc1, acc2: (acc1[0] + acc2[0], acc1[1] + acc2[1])  # Across partitions
)
avg = sum_count[0] / sum_count[1]

# foreach: Apply function to each element (side effects)
numbers.foreach(lambda x: print(x))

# saveAsTextFile: Save to file
numbers.saveAsTextFile("output/numbers")
```

### RDD Persistence

```python
from pyspark import StorageLevel

# Cache in memory
rdd.cache()  # Equivalent to persist(StorageLevel.MEMORY_ONLY)

# Different storage levels
rdd.persist(StorageLevel.MEMORY_ONLY)       # Memory only
rdd.persist(StorageLevel.MEMORY_AND_DISK)   # Memory + disk spillover
rdd.persist(StorageLevel.DISK_ONLY)         # Disk only
rdd.persist(StorageLevel.MEMORY_ONLY_SER)   # Serialized in memory
rdd.persist(StorageLevel.MEMORY_AND_DISK_SER)
rdd.persist(StorageLevel.OFF_HEAP)          # Off-heap memory

# Check if cached
print(f"Is cached: {rdd.is_cached}")

# Unpersist
rdd.unpersist()
```

## Spark SQL

Spark SQL provides a programming abstraction called DataFrames and can also act as a distributed SQL query engine.

### Creating and Querying Views

```python
# Register DataFrame as a temporary view
df.createOrReplaceTempView("employees")

# Register as global temporary view (accessible across sessions)
df.createOrReplaceGlobalTempView("global_employees")

# Simple SQL query
result = spark.sql("""
    SELECT department,
           COUNT(*) as employee_count,
           AVG(salary) as avg_salary,
           SUM(salary) as total_salary
    FROM employees
    WHERE age >= 25
    GROUP BY department
    HAVING COUNT(*) > 0
    ORDER BY avg_salary DESC
""")
result.show()

# Access global temp view
spark.sql("SELECT * FROM global_temp.global_employees").show()
```

### Complex SQL Queries

```python
# Subqueries
spark.sql("""
    SELECT e1.name, e1.salary,
           (SELECT AVG(salary) FROM employees) as company_avg,
           e1.salary - (SELECT AVG(salary) FROM employees) as difference
    FROM employees e1
    WHERE e1.salary > (SELECT AVG(salary) FROM employees)
""").show()

# CTEs (Common Table Expressions)
spark.sql("""
    WITH dept_stats AS (
        SELECT department,
               AVG(salary) as avg_salary,
               COUNT(*) as emp_count
        FROM employees
        GROUP BY department
    ),
    high_paying_depts AS (
        SELECT department
        FROM dept_stats
        WHERE avg_salary > 75000
    )
    SELECT e.name, e.department, e.salary, d.avg_salary
    FROM employees e
    JOIN dept_stats d ON e.department = d.department
    WHERE e.department IN (SELECT department FROM high_paying_depts)
""").show()

# CASE statements
spark.sql("""
    SELECT name, salary,
           CASE
               WHEN salary > 90000 THEN 'Executive'
               WHEN salary > 75000 THEN 'Senior'
               WHEN salary > 60000 THEN 'Mid-level'
               ELSE 'Junior'
           END as level
    FROM employees
""").show()

# String functions
spark.sql("""
    SELECT name,
           UPPER(name) as upper_name,
           LOWER(name) as lower_name,
           LENGTH(name) as name_length,
           SUBSTRING(name, 1, 3) as first_three,
           CONCAT(name, ' - ', department) as full_info
    FROM employees
""").show()

# Date functions
spark.sql("""
    SELECT hire_date,
           YEAR(hire_date) as year,
           MONTH(hire_date) as month,
           DAYOFWEEK(hire_date) as day_of_week,
           DATE_ADD(hire_date, 30) as plus_30_days,
           DATEDIFF(CURRENT_DATE(), hire_date) as days_employed
    FROM employees
    WHERE hire_date IS NOT NULL
""").show()
```

## User-Defined Functions (UDFs)

UDFs allow you to extend Spark's built-in functionality with custom Python functions.

### Basic UDFs

```python
from pyspark.sql.functions import udf
from pyspark.sql.types import *

# Define a Python function
def categorize_salary(salary):
    if salary is None:
        return "Unknown"
    elif salary > 100000:
        return "Executive"
    elif salary > 75000:
        return "Senior"
    elif salary > 50000:
        return "Mid-level"
    else:
        return "Junior"

# Register as UDF
categorize_salary_udf = udf(categorize_salary, StringType())

# Use the UDF
df = df.withColumn("level", categorize_salary_udf(col("salary")))

# Lambda UDF
square_udf = udf(lambda x: x * x if x else None, DoubleType())
df = df.withColumn("salary_squared", square_udf(col("salary")))

# Decorator syntax
@udf(returnType=StringType())
def format_name(name):
    if name is None:
        return None
    return name.strip().title()

df = df.withColumn("formatted_name", format_name(col("name")))
```

### UDFs with Multiple Arguments

```python
def calculate_bonus(salary, years_of_service, performance_rating):
    if salary is None or years_of_service is None or performance_rating is None:
        return 0.0

    base_bonus = salary * 0.1
    tenure_multiplier = 1 + (years_of_service * 0.02)
    performance_multiplier = performance_rating / 5.0

    return base_bonus * tenure_multiplier * performance_multiplier

calculate_bonus_udf = udf(calculate_bonus, DoubleType())

df = df.withColumn("bonus",
    calculate_bonus_udf(
        col("salary"),
        col("years_of_service"),
        col("performance_rating")
    ))
```

### UDFs Returning Complex Types

```python
# UDF returning struct
schema = StructType([
    StructField("tax", DoubleType()),
    StructField("net_salary", DoubleType()),
    StructField("category", StringType())
])

def calculate_salary_details(salary):
    if salary is None:
        return (0.0, 0.0, "Unknown")

    tax = salary * 0.25
    net_salary = salary - tax

    if salary > 100000:
        category = "High"
    elif salary > 50000:
        category = "Medium"
    else:
        category = "Low"

    return (tax, net_salary, category)

salary_details_udf = udf(calculate_salary_details, schema)

df = df.withColumn("details", salary_details_udf(col("salary")))
df = df.select("*",
    col("details.tax").alias("tax"),
    col("details.net_salary").alias("net_salary"),
    col("details.category").alias("salary_category")
)

# UDF returning array
@udf(ArrayType(StringType()))
def extract_words(text):
    if text is None:
        return []
    return text.split()

df = df.withColumn("words", extract_words(col("description")))
```

### Registering UDFs for SQL

```python
# Register UDF for SQL use
spark.udf.register("categorize_salary", categorize_salary, StringType())

# Use in SQL query
spark.sql("""
    SELECT name, salary, categorize_salary(salary) as level
    FROM employees
""").show()
```

### Pandas UDFs (Vectorized UDFs)

Pandas UDFs are more efficient than regular UDFs as they use Apache Arrow for serialization.

```python
from pyspark.sql.functions import pandas_udf, PandasUDFType
import pandas as pd

# Scalar Pandas UDF
@pandas_udf(DoubleType())
def pandas_salary_tax(salary: pd.Series) -> pd.Series:
    return salary * 0.25

df = df.withColumn("tax", pandas_salary_tax(col("salary")))

# Scalar Pandas UDF with multiple columns
@pandas_udf(DoubleType())
def pandas_bonus(salary: pd.Series, rating: pd.Series) -> pd.Series:
    return salary * rating / 100

df = df.withColumn("bonus", pandas_bonus(col("salary"), col("rating")))

# Grouped Aggregate Pandas UDF
@pandas_udf(DoubleType())
def pandas_mean(v: pd.Series) -> float:
    return v.mean()

df.groupBy("department").agg(
    pandas_mean(col("salary")).alias("avg_salary")
).show()

# Grouped Map Pandas UDF
@pandas_udf(df.schema, PandasUDFType.GROUPED_MAP)
def normalize_within_group(pdf: pd.DataFrame) -> pd.DataFrame:
    pdf["normalized_salary"] = (
        (pdf["salary"] - pdf["salary"].mean()) / pdf["salary"].std()
    )
    return pdf

df = df.groupby("department").apply(normalize_within_group)
```

## Window Functions

Window functions perform calculations across a set of rows related to the current row without collapsing the result set.

### Basic Window Functions

```python
from pyspark.sql.window import Window
from pyspark.sql.functions import *

# Define window specification
window_dept = Window.partitionBy("department").orderBy(col("salary").desc())

# Ranking functions
df = df.withColumn("rank_in_dept", row_number().over(window_dept))
df = df.withColumn("rank", rank().over(window_dept))
df = df.withColumn("dense_rank", dense_rank().over(window_dept))
df = df.withColumn("percent_rank", percent_rank().over(window_dept))
df = df.withColumn("quartile", ntile(4).over(window_dept))

df.show()
```

### Aggregate Window Functions

```python
# Window without ordering (entire partition)
window_dept_all = Window.partitionBy("department")

# Window with ordering (running calculations)
window_dept_ordered = Window.partitionBy("department").orderBy("hire_date")

# Aggregate over entire partition
df = df.withColumn("dept_total_salary", sum("salary").over(window_dept_all))
df = df.withColumn("dept_avg_salary", avg("salary").over(window_dept_all))
df = df.withColumn("dept_count", count("*").over(window_dept_all))
df = df.withColumn("dept_min_salary", min("salary").over(window_dept_all))
df = df.withColumn("dept_max_salary", max("salary").over(window_dept_all))

# Running totals
df = df.withColumn("running_total", sum("salary").over(window_dept_ordered))
df = df.withColumn("running_avg", avg("salary").over(window_dept_ordered))
```

### Lag and Lead Functions

```python
window_time = Window.partitionBy("product_id").orderBy("date")

# Previous values
df = df.withColumn("previous_sales", lag("sales", 1).over(window_time))
df = df.withColumn("previous_2_sales", lag("sales", 2).over(window_time))

# Next values
df = df.withColumn("next_sales", lead("sales", 1).over(window_time))

# Calculate differences
df = df.withColumn("sales_change",
    col("sales") - lag("sales", 1).over(window_time))

# Percentage change
df = df.withColumn("sales_pct_change",
    (col("sales") - lag("sales", 1).over(window_time)) /
    lag("sales", 1).over(window_time) * 100)

# First and last values in window
df = df.withColumn("first_sale", first("sales").over(window_time))
df = df.withColumn("last_sale", last("sales").over(window_time))
```

### Window Frame Specifications

```python
# Rows-based window frame
window_rows = Window.partitionBy("department") \
    .orderBy("date") \
    .rowsBetween(-2, 0)  # Current row and 2 previous rows

# 3-day moving average
df = df.withColumn("moving_avg_3", avg("sales").over(window_rows))

# 7-day moving average
window_7day = Window.partitionBy("department") \
    .orderBy("date") \
    .rowsBetween(-6, 0)

df = df.withColumn("moving_avg_7", avg("sales").over(window_7day))

# Range-based window (value-based, not row-based)
window_range = Window.partitionBy("department") \
    .orderBy("salary") \
    .rangeBetween(-1000, 1000)  # Within 1000 of current salary

df = df.withColumn("similar_salary_count", count("*").over(window_range))

# Unbounded windows
window_cumulative = Window.partitionBy("department") \
    .orderBy("date") \
    .rowsBetween(Window.unboundedPreceding, Window.currentRow)

df = df.withColumn("cumulative_sum", sum("sales").over(window_cumulative))

# Complete partition (all rows)
window_all = Window.partitionBy("department") \
    .rowsBetween(Window.unboundedPreceding, Window.unboundedFollowing)

df = df.withColumn("dept_total", sum("sales").over(window_all))
```

### Window Functions in SQL

```python
spark.sql("""
    SELECT
        name,
        department,
        salary,
        ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as row_num,
        RANK() OVER (PARTITION BY department ORDER BY salary DESC) as rank,
        DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) as dense_rank,
        SUM(salary) OVER (PARTITION BY department) as dept_total,
        AVG(salary) OVER (PARTITION BY department) as dept_avg,
        salary - AVG(salary) OVER (PARTITION BY department) as diff_from_avg,
        LAG(salary, 1) OVER (PARTITION BY department ORDER BY salary) as prev_salary,
        LEAD(salary, 1) OVER (PARTITION BY department ORDER BY salary) as next_salary,
        SUM(salary) OVER (
            PARTITION BY department
            ORDER BY salary
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) as running_total
    FROM employees
""").show()
```

## Joins and Data Combination

### Join Types

```python
# Create sample DataFrames
employees = spark.createDataFrame([
    (1, "Alice", 101),
    (2, "Bob", 102),
    (3, "Charlie", 101),
    (4, "Diana", None)
], ["emp_id", "name", "dept_id"])

departments = spark.createDataFrame([
    (101, "Engineering"),
    (102, "Marketing"),
    (103, "Finance")
], ["dept_id", "dept_name"])

# Inner join (default) - only matching rows
inner = employees.join(departments, "dept_id")
inner = employees.join(departments, employees.dept_id == departments.dept_id)

# Left join - all left rows, matching right rows
left = employees.join(departments, "dept_id", "left")
left = employees.join(departments, "dept_id", "left_outer")

# Right join - all right rows, matching left rows
right = employees.join(departments, "dept_id", "right")
right = employees.join(departments, "dept_id", "right_outer")

# Full outer join - all rows from both
full = employees.join(departments, "dept_id", "outer")
full = employees.join(departments, "dept_id", "full_outer")

# Left semi join - left rows that have a match (no right columns)
semi = employees.join(departments, "dept_id", "left_semi")

# Left anti join - left rows that have NO match
anti = employees.join(departments, "dept_id", "left_anti")

# Cross join (cartesian product)
cross = employees.crossJoin(departments)
```

### Complex Join Conditions

```python
# Multiple join conditions
result = df1.join(
    df2,
    (df1.key1 == df2.key1) & (df1.key2 == df2.key2),
    "inner"
)

# Join with different column names
result = employees.join(
    departments,
    employees.dept_id == departments.dept_id,
    "left"
).drop(departments.dept_id)  # Remove duplicate column

# Join on multiple columns (same names)
result = df1.join(df2, ["col1", "col2"], "inner")

# Non-equality joins
result = df1.join(
    df2,
    (df1.start_date <= df2.event_date) & (df1.end_date >= df2.event_date),
    "inner"
)
```

### Union and Set Operations

```python
df1 = spark.createDataFrame([(1, "A"), (2, "B")], ["id", "value"])
df2 = spark.createDataFrame([(3, "C"), (4, "D")], ["id", "value"])
df3 = spark.createDataFrame([(1, "A"), (5, "E")], ["id", "value"])

# Union (append rows, keeps duplicates)
combined = df1.union(df2)
combined = df1.unionAll(df2)  # Same as union

# Union by name (match columns by name, not position)
combined = df1.unionByName(df2)

# Union distinct (remove duplicates)
combined_distinct = df1.union(df3).distinct()

# Intersect (common rows)
common = df1.intersect(df3)

# Except (rows in df1 but not in df3)
diff = df1.exceptAll(df3)
```

## Performance Tuning

### Partitioning Strategies

```python
# Check current partitions
print(f"Partitions: {df.rdd.getNumPartitions()}")

# Repartition (full shuffle, can increase or decrease)
df_repartitioned = df.repartition(100)
df_repartitioned = df.repartition(10, "department")  # Partition by column
df_repartitioned = df.repartition(10, "department", "region")  # Multiple columns

# Coalesce (no shuffle, can only decrease)
df_coalesced = df.coalesce(10)

# Configure shuffle partitions
spark.conf.set("spark.sql.shuffle.partitions", 200)

# Partition recommendations:
# - Target 128MB per partition
# - Partitions = Data Size / 128MB
# - For small data, fewer partitions (avoid overhead)
# - For large data, more partitions (parallelism)
```

### Caching Strategies

```python
from pyspark import StorageLevel

# Cache DataFrame
df.cache()  # Default: MEMORY_AND_DISK

# Different storage levels
df.persist(StorageLevel.MEMORY_ONLY)       # Fast, may fail if not enough memory
df.persist(StorageLevel.MEMORY_AND_DISK)   # Spills to disk if needed
df.persist(StorageLevel.DISK_ONLY)         # Always on disk
df.persist(StorageLevel.MEMORY_ONLY_SER)   # Serialized, saves memory
df.persist(StorageLevel.OFF_HEAP)          # Off-heap memory

# Check if cached
print(f"Is cached: {df.is_cached}")

# Trigger caching with an action
df.cache()
df.count()  # Forces caching

# Unpersist when done
df.unpersist()

# Cache SQL tables
spark.sql("CACHE TABLE employees")
spark.sql("UNCACHE TABLE employees")

# Best practices:
# - Cache DataFrames used multiple times
# - Cache after filtering to reduce memory
# - Unpersist when no longer needed
```

### Broadcast Joins

```python
from pyspark.sql.functions import broadcast

# Broadcast small table for join optimization
large_df = spark.read.parquet("large_table.parquet")
small_df = spark.read.parquet("lookup_table.parquet")  # < 10MB

# Explicit broadcast
result = large_df.join(broadcast(small_df), "key")

# Configure auto-broadcast threshold
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", 10 * 1024 * 1024)  # 10MB

# Disable broadcast (for testing or specific cases)
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", -1)
```

### Adaptive Query Execution (AQE)

```python
# Enable AQE (Spark 3.0+)
spark.conf.set("spark.sql.adaptive.enabled", "true")

# Coalesce shuffle partitions automatically
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.minPartitionNum", "1")

# Handle skewed joins automatically
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionFactor", "5")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes", "256MB")

# Switch join strategies based on runtime statistics
spark.conf.set("spark.sql.adaptive.localShuffleReader.enabled", "true")
```

### Handling Data Skew

```python
# Method 1: Salting technique
from pyspark.sql.functions import rand, concat, lit

# Add random salt to skewed key
salt_factor = 10
df_salted = df.withColumn("salted_key",
    concat(col("key"), lit("_"), (rand() * salt_factor).cast("int")))

# Join with salted keys
# (Requires expanding the smaller table to match all salt values)

# Method 2: Two-phase aggregation
# First aggregate with salt, then aggregate without
result = df \
    .withColumn("salt", (rand() * 10).cast("int")) \
    .groupBy("key", "salt") \
    .agg(sum("value").alias("partial_sum")) \
    .groupBy("key") \
    .agg(sum("partial_sum").alias("total_sum"))

# Method 3: Broadcast join for small tables
result = large_skewed_df.join(broadcast(small_df), "key")

# Method 4: Enable AQE skew handling
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
```

### Execution Plan Analysis

```python
# View logical plan
df.explain()

# View extended plan (logical + physical)
df.explain(mode="extended")

# View cost estimates
df.explain(mode="cost")

# View formatted plan (most readable)
df.explain(mode="formatted")

# View codegen
df.explain(mode="codegen")

# Example analysis workflow
complex_df = df.filter(col("age") > 25) \
    .groupBy("department") \
    .agg(avg("salary").alias("avg_salary")) \
    .orderBy(col("avg_salary").desc())

print("=== Execution Plan ===")
complex_df.explain(mode="formatted")

# Look for:
# - FileScan (partition pruning, predicate pushdown)
# - BroadcastHashJoin vs SortMergeJoin
# - Exchange (shuffle operations)
# - HashAggregate vs SortAggregate
```

## Deployment Modes

### Local Mode

```bash
# Local mode (single JVM)
spark-submit --master local my_app.py

# Local mode with specific cores
spark-submit --master local[4] my_app.py

# Local mode with all cores
spark-submit --master local[*] my_app.py
```

### Standalone Cluster Mode

```bash
# Client mode (driver on local machine)
spark-submit --master spark://master:7077 \
    --deploy-mode client \
    --executor-memory 4g \
    --total-executor-cores 100 \
    my_app.py

# Cluster mode (driver on cluster)
spark-submit --master spark://master:7077 \
    --deploy-mode cluster \
    --executor-memory 4g \
    --total-executor-cores 100 \
    my_app.py
```

### YARN Mode

```bash
# YARN client mode
spark-submit --master yarn \
    --deploy-mode client \
    --executor-memory 4g \
    --executor-cores 2 \
    --num-executors 50 \
    my_app.py

# YARN cluster mode
spark-submit --master yarn \
    --deploy-mode cluster \
    --driver-memory 4g \
    --driver-cores 2 \
    --executor-memory 8g \
    --executor-cores 4 \
    --num-executors 20 \
    --conf spark.dynamicAllocation.enabled=true \
    --conf spark.dynamicAllocation.minExecutors=10 \
    --conf spark.dynamicAllocation.maxExecutors=100 \
    my_app.py
```

### Kubernetes Mode

```bash
# Kubernetes cluster mode
spark-submit --master k8s://https://kubernetes:6443 \
    --deploy-mode cluster \
    --conf spark.kubernetes.container.image=spark:latest \
    --conf spark.kubernetes.namespace=spark \
    --conf spark.executor.instances=5 \
    --conf spark.kubernetes.driver.request.cores=1 \
    --conf spark.kubernetes.executor.request.cores=1 \
    my_app.py
```

### Common Configuration Options

```bash
spark-submit \
    --master yarn \
    --deploy-mode cluster \
    --driver-memory 4g \
    --driver-cores 2 \
    --executor-memory 8g \
    --executor-cores 4 \
    --num-executors 20 \
    --conf spark.default.parallelism=200 \
    --conf spark.sql.shuffle.partitions=200 \
    --conf spark.sql.adaptive.enabled=true \
    --conf spark.serializer=org.apache.spark.serializer.KryoSerializer \
    --conf spark.memory.fraction=0.6 \
    --conf spark.memory.storageFraction=0.5 \
    --conf spark.sql.broadcastTimeout=600 \
    --conf spark.network.timeout=800s \
    --conf spark.executor.heartbeatInterval=60s \
    --packages org.apache.spark:spark-sql-kafka-0-10_2.12:3.4.0 \
    --py-files dependencies.zip \
    my_app.py arg1 arg2
```

## Writing Data

### Writing to Files

```python
# CSV
df.write.csv("output/csv_data", header=True, mode="overwrite")

# JSON
df.write.json("output/json_data", mode="overwrite")

# Parquet (recommended)
df.write.parquet("output/parquet_data",
    mode="overwrite",
    compression="snappy")

# ORC
df.write.orc("output/orc_data",
    mode="overwrite",
    compression="zlib")

# Partitioned output
df.write.partitionBy("year", "month") \
    .parquet("output/partitioned", mode="overwrite")

# Control file count
df.coalesce(1).write.csv("output/single_file", header=True)
df.repartition(10).write.parquet("output/ten_files")

# Write modes:
# - overwrite: Replace existing data
# - append: Add to existing data
# - ignore: Skip if exists
# - error: Fail if exists (default)
```

### Writing to Databases

```python
# Write to JDBC
df.write.format("jdbc") \
    .option("url", "jdbc:postgresql://localhost:5432/database") \
    .option("dbtable", "schema.output_table") \
    .option("user", "username") \
    .option("password", "password") \
    .option("driver", "org.postgresql.Driver") \
    .mode("overwrite") \
    .save()

# Optimized batch insert
df.write.format("jdbc") \
    .option("url", "jdbc:postgresql://localhost:5432/database") \
    .option("dbtable", "output_table") \
    .option("user", "username") \
    .option("password", "password") \
    .option("batchsize", 10000) \
    .option("numPartitions", 10) \
    .option("truncate", "true") \
    .mode("overwrite") \
    .save()

# Write to Hive
df.write.saveAsTable("database.table_name", mode="overwrite")
df.write.insertInto("database.existing_table")
```

## Practical Examples

### Example 1: ETL Pipeline

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import *

spark = SparkSession.builder \
    .appName("Sales ETL Pipeline") \
    .getOrCreate()

# Extract: Read from multiple sources
sales_df = spark.read.csv("data/sales.csv", header=True, inferSchema=True)
products_df = spark.read.json("data/products.json")
customers_df = spark.read.parquet("data/customers.parquet")

# Transform: Clean and enrich data
sales_clean = sales_df \
    .filter(col("amount") > 0) \
    .withColumn("sale_date", to_date(col("sale_date"))) \
    .withColumn("year", year(col("sale_date"))) \
    .withColumn("month", month(col("sale_date"))) \
    .withColumn("quarter", quarter(col("sale_date")))

# Join with dimension tables
enriched_sales = sales_clean \
    .join(broadcast(products_df), "product_id", "left") \
    .join(broadcast(customers_df), "customer_id", "left")

# Aggregate for analytics
monthly_summary = enriched_sales \
    .groupBy("year", "month", "product_category", "customer_segment") \
    .agg(
        count("*").alias("transaction_count"),
        sum("amount").alias("total_revenue"),
        avg("amount").alias("avg_transaction"),
        countDistinct("customer_id").alias("unique_customers")
    ) \
    .orderBy("year", "month")

# Load: Write partitioned output
monthly_summary.write \
    .partitionBy("year", "month") \
    .parquet("output/monthly_summary", mode="overwrite")

print("ETL Pipeline completed successfully!")
```

### Example 2: Data Quality Framework

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *

def data_quality_report(df, table_name):
    """Generate comprehensive data quality report."""

    report = {"table_name": table_name}

    # Basic statistics
    report["total_rows"] = df.count()
    report["total_columns"] = len(df.columns)

    # Null analysis
    null_counts = df.select([
        sum(when(col(c).isNull(), 1).otherwise(0)).alias(c)
        for c in df.columns
    ]).collect()[0]

    report["null_counts"] = {c: null_counts[c] for c in df.columns}
    report["null_percentages"] = {
        c: round(null_counts[c] / report["total_rows"] * 100, 2)
        for c in df.columns
    }

    # Duplicate analysis
    report["duplicate_rows"] = df.count() - df.distinct().count()

    # Numeric column statistics
    numeric_cols = [f.name for f in df.schema.fields
                   if isinstance(f.dataType, (IntegerType, LongType,
                                              DoubleType, FloatType))]

    if numeric_cols:
        stats = df.select(numeric_cols).summary().toPandas()
        report["numeric_stats"] = stats.to_dict()

    # String column analysis
    string_cols = [f.name for f in df.schema.fields
                  if isinstance(f.dataType, StringType)]

    for col_name in string_cols:
        report[f"{col_name}_cardinality"] = df.select(col_name).distinct().count()

    return report

# Example usage
df = spark.read.parquet("data/sample.parquet")
quality_report = data_quality_report(df, "sample_table")

for key, value in quality_report.items():
    print(f"{key}: {value}")
```

### Example 3: Time Series Analysis

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.window import Window

spark = SparkSession.builder.appName("TimeSeriesAnalysis").getOrCreate()

# Sample data
data = [
    ("2024-01-01", "ProductA", 100),
    ("2024-01-02", "ProductA", 120),
    ("2024-01-03", "ProductA", 115),
    ("2024-01-04", "ProductA", 130),
    ("2024-01-05", "ProductA", 125),
    ("2024-01-01", "ProductB", 200),
    ("2024-01-02", "ProductB", 210),
    ("2024-01-03", "ProductB", 205),
    ("2024-01-04", "ProductB", 220),
    ("2024-01-05", "ProductB", 230),
]

df = spark.createDataFrame(data, ["date", "product", "sales"])
df = df.withColumn("date", to_date(col("date")))

# Define windows
window_product = Window.partitionBy("product").orderBy("date")
window_7day = Window.partitionBy("product").orderBy("date").rowsBetween(-6, 0)
window_cumulative = Window.partitionBy("product").orderBy("date") \
    .rowsBetween(Window.unboundedPreceding, Window.currentRow)

# Calculate metrics
result = df \
    .withColumn("previous_sales", lag("sales", 1).over(window_product)) \
    .withColumn("daily_change", col("sales") - col("previous_sales")) \
    .withColumn("pct_change",
        round((col("sales") - col("previous_sales")) /
              col("previous_sales") * 100, 2)) \
    .withColumn("moving_avg_7", round(avg("sales").over(window_7day), 2)) \
    .withColumn("cumulative_sales", sum("sales").over(window_cumulative)) \
    .withColumn("sales_rank", row_number().over(
        Window.partitionBy("product").orderBy(col("sales").desc())))

result.show(truncate=False)
```

## Interview Questions

### Transformations vs Actions

**Q: What is the difference between transformations and actions in PySpark?**

Transformations are lazy operations that define a new RDD/DataFrame but don't compute results immediately (e.g., `filter`, `map`, `join`). Actions trigger actual computation and return results to the driver or write to storage (e.g., `collect`, `count`, `write`).

### Cache vs Persist

**Q: Explain the difference between `cache()` and `persist()`.**

`cache()` is a shorthand for `persist(StorageLevel.MEMORY_AND_DISK)`. `persist()` allows you to specify different storage levels like MEMORY_ONLY, DISK_ONLY, MEMORY_ONLY_SER, etc.

### Repartition vs Coalesce

**Q: When would you use `repartition()` vs `coalesce()`?**

- `repartition()`: Full shuffle, can increase or decrease partitions, use when increasing partitions or redistributing data
- `coalesce()`: No shuffle (if decreasing), can only decrease partitions, more efficient for reducing partition count

### Handling Data Skew

**Q: How do you handle skewed data in PySpark?**

```python
# Salting technique
df = df.withColumn("salted_key",
    concat(col("key"), lit("_"), (rand() * 10).cast("int")))

# Broadcast join for small tables
result = large_df.join(broadcast(small_df), "key")

# Enable AQE skew handling
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")

# Increase parallelism
spark.conf.set("spark.sql.shuffle.partitions", 1000)
```

### UDF vs Pandas UDF

**Q: When would you use a Pandas UDF over a regular UDF?**

Pandas UDFs are preferred when:
- Processing large amounts of data (better serialization with Arrow)
- Using pandas/numpy operations
- Need better performance
- Working with complex aggregations

Regular UDFs are simpler for small-scale operations.

### Broadcast Joins

**Q: Explain when and how to use broadcast joins.**

Use broadcast joins when one table is small enough to fit in executor memory (typically < 10MB). The small table is broadcast to all executors, avoiding expensive shuffle operations.

```python
from pyspark.sql.functions import broadcast
result = large_df.join(broadcast(small_df), "key")
```

## Best Practices Summary

1. **Use DataFrames over RDDs** - Better optimization through Catalyst optimizer
2. **Prefer built-in functions** - Avoid UDFs when possible; use Pandas UDFs when needed
3. **Cache wisely** - Only cache DataFrames used multiple times; unpersist when done
4. **Monitor partitions** - Aim for 128MB per partition; use repartition/coalesce appropriately
5. **Use broadcast joins** - When one table fits in memory
6. **Enable AQE** - Automatic optimization in Spark 3.0+
7. **Write to columnar formats** - Parquet is preferred for most use cases
8. **Filter early** - Reduce data volume as soon as possible in the pipeline
9. **Avoid collecting large datasets** - Use take() or show() for sampling
10. **Analyze execution plans** - Use explain() to understand and optimize queries

## Further Reading

### Official Resources

- [PySpark Documentation](https://spark.apache.org/docs/latest/api/python/)
- [Spark SQL Programming Guide](https://spark.apache.org/docs/latest/sql-programming-guide.html)
- [PySpark API Reference](https://spark.apache.org/docs/latest/api/python/reference/index.html)

### Recommended Books

- **"Learning Spark, 2nd Edition"** - O'Reilly
- **"Spark: The Definitive Guide"** - Bill Chambers, Matei Zaharia
- **"High Performance Spark"** - Holden Karau

### Related Technologies

- **Delta Lake**: ACID transactions for data lakes
- **Apache Iceberg**: Open table format for analytics
- **Databricks**: Commercial Spark platform
- **AWS EMR / Azure HDInsight / Google Dataproc**: Cloud-managed Spark

---

PySpark is an essential skill for data professionals working with large-scale data. By mastering SparkSession, DataFrames, RDDs, Spark SQL, UDFs, window functions, joins, and performance optimization techniques covered in this guide, you will be well-equipped to build efficient and scalable data processing applications. Remember that hands-on practice with real datasets is the best way to solidify your understanding.
