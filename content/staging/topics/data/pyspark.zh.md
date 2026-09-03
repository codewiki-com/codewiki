---
title: PySpark 大数据处理
description: 使用 Spark 的 Python API 进行大数据分析和处理
track: data
section: data-engineering
difficulty: intermediate
tags:
  - PySpark
  - Spark
  - Big Data
  - Python
status: imported
origin: old/src/content/docs/data/pyspark.zh.md
divergence: 0.225
issues: []
legacy:
  category: Data
  subcategory: Big Data
  order: 17
  lastUpdated: 2026-01-07
---

PySpark 是 Apache Spark 的 Python API，使你能够在用 Python 编写代码的同时利用分布式计算的能力。它结合了 Python 的简洁性和 Spark 的可扩展性，使其成为处理大规模数据集的数据工程师和数据科学家的必备工具。本指南涵盖了从核心概念到高级优化技术的所有内容。

## 核心概念

### 什么是 PySpark？

PySpark 为 Apache Spark 提供了 Python 风格的接口，允许你使用熟悉的 Python 语法编写分布式数据处理应用程序。它支持 Spark 的所有功能，包括：

- **Spark SQL 和 DataFrames**：使用类 SQL 操作进行结构化数据处理
- **Spark Streaming**：实时数据处理
- **MLlib**：可扩展的机器学习库
- **GraphX**：图处理（在 Python 中通过 GraphFrames）

### 安装和设置

```bash
# 通过 pip 安装
pip install pyspark

# 安装特定组件
pip install pyspark[sql]
pip install pyspark[ml]

# 安装所有组件
pip install pyspark[all]

# 验证安装
python -c "import pyspark; print(pyspark.__version__)"
```

## SparkSession：入口点

SparkSession 是自 Spark 2.0 以来所有 PySpark 功能的统一入口点。它取代了旧的 SparkContext、SQLContext 和 HiveContext。

### 创建 SparkSession

```python
from pyspark.sql import SparkSession

# 基本 SparkSession
spark = SparkSession.builder \
    .appName("MyPySparkApp") \
    .getOrCreate()

# 带配置的 SparkSession
spark = SparkSession.builder \
    .appName("ConfiguredApp") \
    .master("local[*]") \
    .config("spark.executor.memory", "4g") \
    .config("spark.driver.memory", "2g") \
    .config("spark.sql.shuffle.partitions", "200") \
    .config("spark.serializer", "org.apache.spark.serializer.KryoSerializer") \
    .enableHiveSupport() \
    .getOrCreate()

# 访问 SparkContext
sc = spark.sparkContext

# 设置日志级别
sc.setLogLevel("WARN")

# 检查配置
print(f"Spark 版本: {spark.version}")
print(f"应用名称: {spark.sparkContext.appName}")
print(f"Master: {spark.sparkContext.master}")
print(f"默认并行度: {spark.sparkContext.defaultParallelism}")

# 获取所有配置
for conf in spark.sparkContext.getConf().getAll():
    print(f"{conf[0]}: {conf[1]}")

# 完成时停止会话
# spark.stop()
```

### SparkSession 配置选项

```python
# 常用配置选项
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

# 运行时配置更改
spark.conf.set("spark.sql.shuffle.partitions", 100)
print(spark.conf.get("spark.sql.shuffle.partitions"))
```

## DataFrames：结构化数据处理

DataFrames 是 PySpark 中处理结构化数据的主要抽象，提供组织成命名列的分布式数据集合。

### 创建 DataFrames

```python
from pyspark.sql import SparkSession
from pyspark.sql.types import *

spark = SparkSession.builder.appName("DataFrameDemo").getOrCreate()

# 方法 1：从 Python 列表
data = [
    ("Alice", 25, "Engineering", 75000.0),
    ("Bob", 30, "Marketing", 85000.0),
    ("Charlie", 35, "Engineering", 90000.0),
    ("Diana", 28, "Sales", 70000.0)
]
columns = ["name", "age", "department", "salary"]
df = spark.createDataFrame(data, columns)

# 方法 2：使用显式 schema
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

# 方法 3：使用 DDL 字符串
ddl_schema = "id INT, name STRING, age INT, salary DOUBLE, department STRING"
df = spark.createDataFrame(data, ddl_schema)

# 方法 4：从 pandas DataFrame
import pandas as pd
pandas_df = pd.DataFrame({
    "name": ["Alice", "Bob", "Charlie"],
    "age": [25, 30, 35],
    "salary": [75000, 85000, 90000]
})
df = spark.createDataFrame(pandas_df)

# 方法 5：从 RDD
rdd = spark.sparkContext.parallelize(data)
df = spark.createDataFrame(rdd, schema)
```

### 从外部源读取数据

```python
# CSV 文件
df_csv = spark.read.csv("path/to/file.csv", header=True, inferSchema=True)

# 详细 CSV 选项
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

# JSON 文件
df_json = spark.read.json("path/to/file.json")
df_json = spark.read.format("json") \
    .option("multiline", "true") \
    .option("mode", "PERMISSIVE") \
    .load("path/to/file.json")

# Parquet 文件（推荐格式）
df_parquet = spark.read.parquet("path/to/file.parquet")

# ORC 文件
df_orc = spark.read.orc("path/to/file.orc")

# Delta Lake
df_delta = spark.read.format("delta").load("path/to/delta_table")

# 从 JDBC 数据库读取
df_jdbc = spark.read.format("jdbc") \
    .option("url", "jdbc:postgresql://localhost:5432/database") \
    .option("dbtable", "schema.table_name") \
    .option("user", "username") \
    .option("password", "password") \
    .option("driver", "org.postgresql.Driver") \
    .load()

# 大表的并行 JDBC 读取
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

# 从 Hive 表读取
spark.sql("USE my_database")
df_hive = spark.sql("SELECT * FROM my_table")
df_hive = spark.table("my_database.my_table")
```

### DataFrame 操作

```python
from pyspark.sql.functions import *

# 显示数据
df.show()                    # 显示前 20 行
df.show(10, truncate=False)  # 显示 10 行不截断
df.display()                 # Databricks 特定显示

# 查看 schema
df.printSchema()

# 基本信息
print(f"行数: {df.count()}")
print(f"列数: {len(df.columns)}")
print(f"列名: {df.columns}")
print(f"数据类型: {df.dtypes}")

# 统计摘要
df.describe().show()
df.summary().show()  # 更详细的统计

# 选择列
df.select("name", "age").show()
df.select(df.name, df.age).show()
df.select(col("name"), col("age")).show()
df.select("*").show()

# 过滤行
df.filter(col("age") > 28).show()
df.filter("age > 28").show()
df.where(col("department").isin(["Engineering", "Sales"])).show()
df.filter((col("age") > 25) & (col("salary") > 70000)).show()

# 添加新列
df = df.withColumn("annual_bonus", col("salary") * 0.1)
df = df.withColumn("tax", col("salary") * 0.25)
df = df.withColumn("net_salary", col("salary") - col("tax"))

# 条件列
df = df.withColumn("age_group",
    when(col("age") < 30, "Young")
    .when(col("age") < 40, "Middle")
    .otherwise("Senior"))

# 重命名列
df = df.withColumnRenamed("salary", "base_salary")

# 删除列
df = df.drop("annual_bonus", "tax")

# 排序数据
df.orderBy("age").show()
df.orderBy(col("salary").desc()).show()
df.sort("department", col("salary").desc()).show()

# 去重值
df.select("department").distinct().show()
df.dropDuplicates(["department"]).show()

# 限制行数
df.limit(5).show()
```

## RDDs：弹性分布式数据集

RDDs 是 Spark 中的基本数据结构，表示可以并行处理的不可变、分布式元素集合。

### 创建 RDDs

```python
# 从集合创建
data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
rdd = sc.parallelize(data)
rdd_with_partitions = sc.parallelize(data, numSlices=4)

# 从外部文件创建
text_rdd = sc.textFile("path/to/file.txt")
text_rdd_partitioned = sc.textFile("hdfs://path/to/file.txt", minPartitions=10)

# 从 DataFrame 创建
rdd_from_df = df.rdd

# 检查分区
print(f"分区数: {rdd.getNumPartitions()}")
```

### RDD 转换操作

转换是创建新 RDD 的惰性操作。

```python
numbers = sc.parallelize([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

# map：对每个元素应用函数
squared = numbers.map(lambda x: x ** 2)

# filter：保留满足条件的元素
evens = numbers.filter(lambda x: x % 2 == 0)

# flatMap：映射然后展平
words = sc.parallelize(["hello world", "spark is great"])
split_words = words.flatMap(lambda line: line.split(" "))

# distinct：去重
unique = sc.parallelize([1, 1, 2, 2, 3]).distinct()

# union：合并两个 RDD
rdd1 = sc.parallelize([1, 2, 3])
rdd2 = sc.parallelize([3, 4, 5])
combined = rdd1.union(rdd2)

# intersection：共同元素
common = rdd1.intersection(rdd2)

# subtract：rdd1 中有但 rdd2 中没有的元素
diff = rdd1.subtract(rdd2)

# sample：随机采样
sampled = numbers.sample(withReplacement=False, fraction=0.5, seed=42)

# sortBy：按函数排序
sorted_rdd = numbers.sortBy(lambda x: -x)  # 降序

# groupBy：按函数分组
grouped = numbers.groupBy(lambda x: x % 2)  # 按奇偶分组
```

### 键值对 RDD 操作

```python
# 创建键值对 RDD
pairs = sc.parallelize([
    ("New York", 100), ("Boston", 200), ("New York", 150),
    ("Boston", 180), ("Chicago", 120), ("Chicago", 90)
])

# reduceByKey：按键聚合
totals = pairs.reduceByKey(lambda a, b: a + b)

# groupByKey：按键分组值
grouped = pairs.groupByKey().mapValues(list)

# sortByKey：按键排序
sorted_pairs = pairs.sortByKey()

# mapValues：只转换值
doubled = pairs.mapValues(lambda x: x * 2)

# keys 和 values
all_keys = pairs.keys()
all_values = pairs.values()

# countByKey：按键计数
counts = pairs.countByKey()

# join：内连接
other_pairs = sc.parallelize([("New York", "East"), ("Boston", "East"), ("LA", "West")])
joined = pairs.join(other_pairs)

# leftOuterJoin, rightOuterJoin, fullOuterJoin
left_joined = pairs.leftOuterJoin(other_pairs)
right_joined = pairs.rightOuterJoin(other_pairs)
full_joined = pairs.fullOuterJoin(other_pairs)

# cogroup：跨多个 RDD 按键分组
cogrouped = pairs.cogroup(other_pairs)
```

### RDD 动作操作

动作触发计算并返回结果。

```python
numbers = sc.parallelize([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

# collect：返回所有元素（谨慎使用！）
all_data = numbers.collect()

# count：元素数量
total_count = numbers.count()

# first：第一个元素
first_element = numbers.first()

# take：前 N 个元素
first_five = numbers.take(5)

# takeOrdered：最小的 N 个元素
smallest = numbers.takeOrdered(3)

# top：最大的 N 个元素
largest = numbers.top(3)

# reduce：聚合所有元素
total_sum = numbers.reduce(lambda a, b: a + b)

# fold：带初始值的聚合
total_with_init = numbers.fold(0, lambda a, b: a + b)

# aggregate：更灵活的聚合
sum_count = numbers.aggregate(
    (0, 0),  # 初始值 (sum, count)
    lambda acc, val: (acc[0] + val, acc[1] + 1),  # 分区内
    lambda acc1, acc2: (acc1[0] + acc2[0], acc1[1] + acc2[1])  # 跨分区
)
avg = sum_count[0] / sum_count[1]

# foreach：对每个元素应用函数（副作用）
numbers.foreach(lambda x: print(x))

# saveAsTextFile：保存到文件
numbers.saveAsTextFile("output/numbers")
```

### RDD 持久化

```python
from pyspark import StorageLevel

# 缓存到内存
rdd.cache()  # 等同于 persist(StorageLevel.MEMORY_ONLY)

# 不同的存储级别
rdd.persist(StorageLevel.MEMORY_ONLY)       # 仅内存
rdd.persist(StorageLevel.MEMORY_AND_DISK)   # 内存 + 磁盘溢出
rdd.persist(StorageLevel.DISK_ONLY)         # 仅磁盘
rdd.persist(StorageLevel.MEMORY_ONLY_SER)   # 序列化存储在内存
rdd.persist(StorageLevel.MEMORY_AND_DISK_SER)
rdd.persist(StorageLevel.OFF_HEAP)          # 堆外内存

# 检查是否已缓存
print(f"是否已缓存: {rdd.is_cached}")

# 取消持久化
rdd.unpersist()
```

## Spark SQL

Spark SQL 提供称为 DataFrames 的编程抽象，也可以作为分布式 SQL 查询引擎。

### 创建和查询视图

```python
# 将 DataFrame 注册为临时视图
df.createOrReplaceTempView("employees")

# 注册为全局临时视图（跨会话可访问）
df.createOrReplaceGlobalTempView("global_employees")

# 简单 SQL 查询
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

# 访问全局临时视图
spark.sql("SELECT * FROM global_temp.global_employees").show()
```

### 复杂 SQL 查询

```python
# 子查询
spark.sql("""
    SELECT e1.name, e1.salary,
           (SELECT AVG(salary) FROM employees) as company_avg,
           e1.salary - (SELECT AVG(salary) FROM employees) as difference
    FROM employees e1
    WHERE e1.salary > (SELECT AVG(salary) FROM employees)
""").show()

# CTE（公共表表达式）
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

# CASE 语句
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

# 字符串函数
spark.sql("""
    SELECT name,
           UPPER(name) as upper_name,
           LOWER(name) as lower_name,
           LENGTH(name) as name_length,
           SUBSTRING(name, 1, 3) as first_three,
           CONCAT(name, ' - ', department) as full_info
    FROM employees
""").show()

# 日期函数
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

## 用户自定义函数 (UDFs)

UDFs 允许你使用自定义 Python 函数扩展 Spark 的内置功能。

### 基本 UDFs

```python
from pyspark.sql.functions import udf
from pyspark.sql.types import *

# 定义 Python 函数
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

# 注册为 UDF
categorize_salary_udf = udf(categorize_salary, StringType())

# 使用 UDF
df = df.withColumn("level", categorize_salary_udf(col("salary")))

# Lambda UDF
square_udf = udf(lambda x: x * x if x else None, DoubleType())
df = df.withColumn("salary_squared", square_udf(col("salary")))

# 装饰器语法
@udf(returnType=StringType())
def format_name(name):
    if name is None:
        return None
    return name.strip().title()

df = df.withColumn("formatted_name", format_name(col("name")))
```

### 多参数 UDFs

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

### Pandas UDFs（向量化 UDFs）

Pandas UDFs 比普通 UDFs 更高效，因为它们使用 Apache Arrow 进行序列化。

```python
from pyspark.sql.functions import pandas_udf, PandasUDFType
import pandas as pd

# 标量 Pandas UDF
@pandas_udf(DoubleType())
def pandas_salary_tax(salary: pd.Series) -> pd.Series:
    return salary * 0.25

df = df.withColumn("tax", pandas_salary_tax(col("salary")))

# 多列标量 Pandas UDF
@pandas_udf(DoubleType())
def pandas_bonus(salary: pd.Series, rating: pd.Series) -> pd.Series:
    return salary * rating / 100

df = df.withColumn("bonus", pandas_bonus(col("salary"), col("rating")))

# 分组聚合 Pandas UDF
@pandas_udf(DoubleType())
def pandas_mean(v: pd.Series) -> float:
    return v.mean()

df.groupBy("department").agg(
    pandas_mean(col("salary")).alias("avg_salary")
).show()
```

## 窗口函数

窗口函数在与当前行相关的行集上执行计算，而不折叠结果集。

### 基本窗口函数

```python
from pyspark.sql.window import Window
from pyspark.sql.functions import *

# 定义窗口规范
window_dept = Window.partitionBy("department").orderBy(col("salary").desc())

# 排名函数
df = df.withColumn("rank_in_dept", row_number().over(window_dept))
df = df.withColumn("rank", rank().over(window_dept))
df = df.withColumn("dense_rank", dense_rank().over(window_dept))
df = df.withColumn("percent_rank", percent_rank().over(window_dept))
df = df.withColumn("quartile", ntile(4).over(window_dept))

df.show()
```

### 聚合窗口函数

```python
# 无排序的窗口（整个分区）
window_dept_all = Window.partitionBy("department")

# 有排序的窗口（运行计算）
window_dept_ordered = Window.partitionBy("department").orderBy("hire_date")

# 在整个分区上聚合
df = df.withColumn("dept_total_salary", sum("salary").over(window_dept_all))
df = df.withColumn("dept_avg_salary", avg("salary").over(window_dept_all))
df = df.withColumn("dept_count", count("*").over(window_dept_all))
df = df.withColumn("dept_min_salary", min("salary").over(window_dept_all))
df = df.withColumn("dept_max_salary", max("salary").over(window_dept_all))

# 运行总计
df = df.withColumn("running_total", sum("salary").over(window_dept_ordered))
df = df.withColumn("running_avg", avg("salary").over(window_dept_ordered))
```

### Lag 和 Lead 函数

```python
window_time = Window.partitionBy("product_id").orderBy("date")

# 前一个值
df = df.withColumn("previous_sales", lag("sales", 1).over(window_time))
df = df.withColumn("previous_2_sales", lag("sales", 2).over(window_time))

# 下一个值
df = df.withColumn("next_sales", lead("sales", 1).over(window_time))

# 计算差异
df = df.withColumn("sales_change",
    col("sales") - lag("sales", 1).over(window_time))

# 百分比变化
df = df.withColumn("sales_pct_change",
    (col("sales") - lag("sales", 1).over(window_time)) /
    lag("sales", 1).over(window_time) * 100)

# 窗口中的第一个和最后一个值
df = df.withColumn("first_sale", first("sales").over(window_time))
df = df.withColumn("last_sale", last("sales").over(window_time))
```

### 窗口框架规范

```python
# 基于行的窗口框架
window_rows = Window.partitionBy("department") \
    .orderBy("date") \
    .rowsBetween(-2, 0)  # 当前行和前 2 行

# 3 天移动平均
df = df.withColumn("moving_avg_3", avg("sales").over(window_rows))

# 7 天移动平均
window_7day = Window.partitionBy("department") \
    .orderBy("date") \
    .rowsBetween(-6, 0)

df = df.withColumn("moving_avg_7", avg("sales").over(window_7day))

# 基于范围的窗口（基于值，而非基于行）
window_range = Window.partitionBy("department") \
    .orderBy("salary") \
    .rangeBetween(-1000, 1000)  # 当前工资 1000 范围内

df = df.withColumn("similar_salary_count", count("*").over(window_range))

# 无界窗口
window_cumulative = Window.partitionBy("department") \
    .orderBy("date") \
    .rowsBetween(Window.unboundedPreceding, Window.currentRow)

df = df.withColumn("cumulative_sum", sum("sales").over(window_cumulative))

# 完整分区（所有行）
window_all = Window.partitionBy("department") \
    .rowsBetween(Window.unboundedPreceding, Window.unboundedFollowing)

df = df.withColumn("dept_total", sum("sales").over(window_all))
```

## 连接和数据组合

### 连接类型

```python
# 创建示例 DataFrames
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

# 内连接（默认）- 只有匹配的行
inner = employees.join(departments, "dept_id")
inner = employees.join(departments, employees.dept_id == departments.dept_id)

# 左连接 - 所有左行，匹配的右行
left = employees.join(departments, "dept_id", "left")
left = employees.join(departments, "dept_id", "left_outer")

# 右连接 - 所有右行，匹配的左行
right = employees.join(departments, "dept_id", "right")
right = employees.join(departments, "dept_id", "right_outer")

# 全外连接 - 两边所有行
full = employees.join(departments, "dept_id", "outer")
full = employees.join(departments, "dept_id", "full_outer")

# 左半连接 - 有匹配的左行（无右列）
semi = employees.join(departments, "dept_id", "left_semi")

# 左反连接 - 无匹配的左行
anti = employees.join(departments, "dept_id", "left_anti")

# 交叉连接（笛卡尔积）
cross = employees.crossJoin(departments)
```

### 复杂连接条件

```python
# 多个连接条件
result = df1.join(
    df2,
    (df1.key1 == df2.key1) & (df1.key2 == df2.key2),
    "inner"
)

# 不同列名的连接
result = employees.join(
    departments,
    employees.dept_id == departments.dept_id,
    "left"
).drop(departments.dept_id)  # 删除重复列

# 多列连接（相同名称）
result = df1.join(df2, ["col1", "col2"], "inner")

# 非等值连接
result = df1.join(
    df2,
    (df1.start_date <= df2.event_date) & (df1.end_date >= df2.event_date),
    "inner"
)
```

### Union 和集合操作

```python
df1 = spark.createDataFrame([(1, "A"), (2, "B")], ["id", "value"])
df2 = spark.createDataFrame([(3, "C"), (4, "D")], ["id", "value"])
df3 = spark.createDataFrame([(1, "A"), (5, "E")], ["id", "value"])

# Union（追加行，保留重复）
combined = df1.union(df2)
combined = df1.unionAll(df2)  # 与 union 相同

# 按名称 Union（按名称匹配列，而非位置）
combined = df1.unionByName(df2)

# Union 去重（移除重复）
combined_distinct = df1.union(df3).distinct()

# Intersect（共同行）
common = df1.intersect(df3)

# Except（df1 中有但 df3 中没有的行）
diff = df1.exceptAll(df3)
```

## 性能调优

### 分区策略

```python
# 检查当前分区
print(f"分区数: {df.rdd.getNumPartitions()}")

# Repartition（完全 shuffle，可增可减）
df_repartitioned = df.repartition(100)
df_repartitioned = df.repartition(10, "department")  # 按列分区
df_repartitioned = df.repartition(10, "department", "region")  # 多列

# Coalesce（无 shuffle，只能减少）
df_coalesced = df.coalesce(10)

# 配置 shuffle 分区
spark.conf.set("spark.sql.shuffle.partitions", 200)

# 分区建议：
# - 目标每个分区 128MB
# - 分区数 = 数据大小 / 128MB
# - 小数据用较少分区（避免开销）
# - 大数据用更多分区（并行性）
```

### 缓存策略

```python
from pyspark import StorageLevel

# 缓存 DataFrame
df.cache()  # 默认：MEMORY_AND_DISK

# 不同存储级别
df.persist(StorageLevel.MEMORY_ONLY)       # 快速，内存不足可能失败
df.persist(StorageLevel.MEMORY_AND_DISK)   # 需要时溢出到磁盘
df.persist(StorageLevel.DISK_ONLY)         # 始终在磁盘
df.persist(StorageLevel.MEMORY_ONLY_SER)   # 序列化，节省内存
df.persist(StorageLevel.OFF_HEAP)          # 堆外内存

# 检查是否已缓存
print(f"是否已缓存: {df.is_cached}")

# 用动作触发缓存
df.cache()
df.count()  # 强制缓存

# 完成时取消持久化
df.unpersist()

# 缓存 SQL 表
spark.sql("CACHE TABLE employees")
spark.sql("UNCACHE TABLE employees")

# 最佳实践：
# - 缓存多次使用的 DataFrames
# - 过滤后再缓存以减少内存
# - 不再需要时取消持久化
```

### 广播连接

```python
from pyspark.sql.functions import broadcast

# 广播小表以优化连接
large_df = spark.read.parquet("large_table.parquet")
small_df = spark.read.parquet("lookup_table.parquet")  # < 10MB

# 显式广播
result = large_df.join(broadcast(small_df), "key")

# 配置自动广播阈值
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", 10 * 1024 * 1024)  # 10MB

# 禁用广播（用于测试或特定情况）
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", -1)
```

### 自适应查询执行 (AQE)

```python
# 启用 AQE（Spark 3.0+）
spark.conf.set("spark.sql.adaptive.enabled", "true")

# 自动合并 shuffle 分区
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.minPartitionNum", "1")

# 自动处理倾斜连接
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionFactor", "5")
spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes", "256MB")

# 基于运行时统计切换连接策略
spark.conf.set("spark.sql.adaptive.localShuffleReader.enabled", "true")
```

### 处理数据倾斜

```python
# 方法 1：加盐技术
from pyspark.sql.functions import rand, concat, lit

# 给倾斜的键添加随机盐
salt_factor = 10
df_salted = df.withColumn("salted_key",
    concat(col("key"), lit("_"), (rand() * salt_factor).cast("int")))

# 使用加盐的键连接
# （需要扩展小表以匹配所有盐值）

# 方法 2：两阶段聚合
# 首先带盐聚合，然后不带盐聚合
result = df \
    .withColumn("salt", (rand() * 10).cast("int")) \
    .groupBy("key", "salt") \
    .agg(sum("value").alias("partial_sum")) \
    .groupBy("key") \
    .agg(sum("partial_sum").alias("total_sum"))

# 方法 3：小表广播连接
result = large_skewed_df.join(broadcast(small_df), "key")

# 方法 4：启用 AQE 倾斜处理
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
```

### 执行计划分析

```python
# 查看逻辑计划
df.explain()

# 查看扩展计划（逻辑 + 物理）
df.explain(mode="extended")

# 查看成本估算
df.explain(mode="cost")

# 查看格式化计划（最易读）
df.explain(mode="formatted")

# 查看代码生成
df.explain(mode="codegen")

# 示例分析工作流
complex_df = df.filter(col("age") > 25) \
    .groupBy("department") \
    .agg(avg("salary").alias("avg_salary")) \
    .orderBy(col("avg_salary").desc())

print("=== 执行计划 ===")
complex_df.explain(mode="formatted")

# 注意查看：
# - FileScan（分区裁剪、谓词下推）
# - BroadcastHashJoin vs SortMergeJoin
# - Exchange（shuffle 操作）
# - HashAggregate vs SortAggregate
```

## 部署模式

### 本地模式

```bash
# 本地模式（单 JVM）
spark-submit --master local my_app.py

# 指定核心数的本地模式
spark-submit --master local[4] my_app.py

# 使用所有核心的本地模式
spark-submit --master local[*] my_app.py
```

### 独立集群模式

```bash
# Client 模式（driver 在本地机器）
spark-submit --master spark://master:7077 \
    --deploy-mode client \
    --executor-memory 4g \
    --total-executor-cores 100 \
    my_app.py

# Cluster 模式（driver 在集群上）
spark-submit --master spark://master:7077 \
    --deploy-mode cluster \
    --executor-memory 4g \
    --total-executor-cores 100 \
    my_app.py
```

### YARN 模式

```bash
# YARN client 模式
spark-submit --master yarn \
    --deploy-mode client \
    --executor-memory 4g \
    --executor-cores 2 \
    --num-executors 50 \
    my_app.py

# YARN cluster 模式
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

### Kubernetes 模式

```bash
# Kubernetes cluster 模式
spark-submit --master k8s://https://kubernetes:6443 \
    --deploy-mode cluster \
    --conf spark.kubernetes.container.image=spark:latest \
    --conf spark.kubernetes.namespace=spark \
    --conf spark.executor.instances=5 \
    --conf spark.kubernetes.driver.request.cores=1 \
    --conf spark.kubernetes.executor.request.cores=1 \
    my_app.py
```

## 写入数据

### 写入文件

```python
# CSV
df.write.csv("output/csv_data", header=True, mode="overwrite")

# JSON
df.write.json("output/json_data", mode="overwrite")

# Parquet（推荐）
df.write.parquet("output/parquet_data",
    mode="overwrite",
    compression="snappy")

# ORC
df.write.orc("output/orc_data",
    mode="overwrite",
    compression="zlib")

# 分区输出
df.write.partitionBy("year", "month") \
    .parquet("output/partitioned", mode="overwrite")

# 控制文件数量
df.coalesce(1).write.csv("output/single_file", header=True)
df.repartition(10).write.parquet("output/ten_files")

# 写入模式：
# - overwrite：替换现有数据
# - append：追加到现有数据
# - ignore：如果存在则跳过
# - error：如果存在则失败（默认）
```

### 写入数据库

```python
# 写入 JDBC
df.write.format("jdbc") \
    .option("url", "jdbc:postgresql://localhost:5432/database") \
    .option("dbtable", "schema.output_table") \
    .option("user", "username") \
    .option("password", "password") \
    .option("driver", "org.postgresql.Driver") \
    .mode("overwrite") \
    .save()

# 优化批量插入
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

# 写入 Hive
df.write.saveAsTable("database.table_name", mode="overwrite")
df.write.insertInto("database.existing_table")
```

## 面试问题

### 转换 vs 动作

**问：PySpark 中转换和动作有什么区别？**

转换是定义新 RDD/DataFrame 但不立即计算结果的惰性操作（如 `filter`、`map`、`join`）。动作触发实际计算并将结果返回给 driver 或写入存储（如 `collect`、`count`、`write`）。

### Cache vs Persist

**问：解释 `cache()` 和 `persist()` 的区别。**

`cache()` 是 `persist(StorageLevel.MEMORY_AND_DISK)` 的简写。`persist()` 允许你指定不同的存储级别，如 MEMORY_ONLY、DISK_ONLY、MEMORY_ONLY_SER 等。

### Repartition vs Coalesce

**问：什么时候使用 `repartition()` vs `coalesce()`？**

- `repartition()`：完全 shuffle，可以增加或减少分区，增加分区或重新分布数据时使用
- `coalesce()`：无 shuffle（如果减少），只能减少分区，减少分区数更高效

### 处理数据倾斜

**问：如何在 PySpark 中处理倾斜数据？**

```python
# 加盐技术
df = df.withColumn("salted_key",
    concat(col("key"), lit("_"), (rand() * 10).cast("int")))

# 小表广播连接
result = large_df.join(broadcast(small_df), "key")

# 启用 AQE 倾斜处理
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")

# 增加并行度
spark.conf.set("spark.sql.shuffle.partitions", 1000)
```

### UDF vs Pandas UDF

**问：什么时候使用 Pandas UDF 而不是普通 UDF？**

Pandas UDFs 更适合：
- 处理大量数据（使用 Arrow 更好的序列化）
- 使用 pandas/numpy 操作
- 需要更好的性能
- 复杂聚合

普通 UDFs 对小规模操作更简单。

### 广播连接

**问：解释何时以及如何使用广播连接。**

当一个表足够小可以放入 executor 内存时使用广播连接（通常 < 10MB）。小表被广播到所有 executor，避免昂贵的 shuffle 操作。

```python
from pyspark.sql.functions import broadcast
result = large_df.join(broadcast(small_df), "key")
```

## 最佳实践总结

1. **使用 DataFrames 而非 RDDs** - 通过 Catalyst 优化器获得更好的优化
2. **优先使用内置函数** - 尽可能避免 UDFs；需要时使用 Pandas UDFs
3. **明智地缓存** - 只缓存多次使用的 DataFrames；完成时取消持久化
4. **监控分区** - 目标每个分区 128MB；适当使用 repartition/coalesce
5. **使用广播连接** - 当一个表能放入内存时
6. **启用 AQE** - Spark 3.0+ 的自动优化
7. **写入列式格式** - 大多数用例首选 Parquet
8. **尽早过滤** - 尽快减少管道中的数据量
9. **避免收集大数据集** - 使用 take() 或 show() 进行采样
10. **分析执行计划** - 使用 explain() 理解和优化查询

## 延伸阅读

### 官方资源

- [PySpark 文档](https://spark.apache.org/docs/latest/api/python/)
- [Spark SQL 编程指南](https://spark.apache.org/docs/latest/sql-programming-guide.html)
- [PySpark API 参考](https://spark.apache.org/docs/latest/api/python/reference/index.html)

### 推荐书籍

- **"Learning Spark, 2nd Edition"** - O'Reilly
- **"Spark: The Definitive Guide"** - Bill Chambers, Matei Zaharia
- **"High Performance Spark"** - Holden Karau

### 相关技术

- **Delta Lake**：数据湖的 ACID 事务
- **Apache Iceberg**：分析的开放表格式
- **Databricks**：商业 Spark 平台
- **AWS EMR / Azure HDInsight / Google Dataproc**：云托管 Spark

---

PySpark 是处理大规模数据的数据专业人员的必备技能。通过掌握本指南中涵盖的 SparkSession、DataFrames、RDDs、Spark SQL、UDFs、窗口函数、连接和性能优化技术，你将能够构建高效且可扩展的数据处理应用程序。记住，使用真实数据集的实践是巩固理解的最佳方式。
