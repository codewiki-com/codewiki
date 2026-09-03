---
title: Apache Spark 大数据处理
description: 掌握Spark分布式计算框架，处理大规模数据集
track: data
section: data-engineering
difficulty: advanced
tags:
  - Spark
  - 大数据
  - PySpark
  - 分布式
status: imported
origin: old/src/content/docs/data/spark.zh.md
divergence: 0.139
issues: []
legacy:
  category: Data
  subcategory: Big Data
  order: 8
  lastUpdated: 2026-01-07
---

Apache Spark 是当今最流行的大数据处理框架之一，它以其卓越的性能、易用性和统一的编程模型而闻名。无论是批处理、流处理、机器学习还是图计算，Spark 都能提供强大的支持。本指南将深入讲解 Spark 的核心概念和实战技巧。

## Spark 架构与核心概念

### 什么是 Apache Spark？

Apache Spark 是一个快速、通用的集群计算系统。它提供了 Java、Scala、Python 和 R 的高级 API，以及支持通用执行图的优化引擎。相比传统的 MapReduce，Spark 的内存计算模型使其在迭代算法和交互式数据挖掘中表现出色。

### Spark 核心组件

Spark 生态系统包含以下核心组件：

- **Spark Core**：基础引擎，提供内存计算和调度功能
- **Spark SQL**：结构化数据处理模块
- **Spark Streaming**：实时流数据处理
- **MLlib**：机器学习库
- **GraphX**：图计算引擎

### 架构设计

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

### 核心术语解释

| 术语 | 说明 |
|------|------|
| **Driver** | 运行 main() 函数并创建 SparkContext 的进程 |
| **Executor** | 在 Worker 节点上运行任务的进程 |
| **Task** | 发送到 Executor 的最小工作单元 |
| **Job** | 由 Action 操作触发的并行计算 |
| **Stage** | Job 被划分成的多个阶段 |
| **Partition** | 数据的逻辑分片 |

### 初始化 SparkSession

```python
from pyspark.sql import SparkSession

# 创建 SparkSession（Spark 2.0+ 推荐方式）
spark = SparkSession.builder \
    .appName("MySparkApp") \
    .master("local[*]") \
    .config("spark.executor.memory", "4g") \
    .config("spark.driver.memory", "2g") \
    .config("spark.sql.shuffle.partitions", "200") \
    .getOrCreate()

# 获取 SparkContext
sc = spark.sparkContext

# 设置日志级别
sc.setLogLevel("WARN")

# 查看配置
print(f"Spark 版本: {spark.version}")
print(f"应用名称: {spark.sparkContext.appName}")
print(f"Master: {spark.sparkContext.master}")
```

## RDD 编程模型

### RDD 基础概念

RDD（Resilient Distributed Dataset，弹性分布式数据集）是 Spark 的核心抽象。它是一个不可变的、分区的数据集合，可以在集群上并行处理。

### RDD 的特性

1. **不可变性**：RDD 一旦创建就不能修改
2. **分区性**：数据自动分布在多个节点上
3. **容错性**：通过血统（Lineage）信息自动恢复
4. **惰性求值**：转换操作不会立即执行
5. **持久化**：可以缓存到内存或磁盘

### 创建 RDD

```python
# 方式1：从集合创建
data = [1, 2, 3, 4, 5]
rdd = sc.parallelize(data)
rdd_with_partitions = sc.parallelize(data, numSlices=4)

# 方式2：从外部文件创建
text_rdd = sc.textFile("hdfs://path/to/file.txt")
text_rdd_partitioned = sc.textFile("hdfs://path/to/file.txt", minPartitions=10)

# 方式3：从其他 RDD 转换
rdd2 = rdd.map(lambda x: x * 2)

# 查看分区数
print(f"分区数: {rdd.getNumPartitions()}")
```

### Transformation 操作

Transformation 是惰性的，它们定义了新的 RDD 但不会立即计算。

```python
# 创建示例 RDD
numbers = sc.parallelize([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

# map：对每个元素应用函数
squared = numbers.map(lambda x: x ** 2)

# filter：过滤元素
evens = numbers.filter(lambda x: x % 2 == 0)

# flatMap：一对多映射
words = sc.parallelize(["hello world", "spark is great"])
split_words = words.flatMap(lambda line: line.split(" "))

# distinct：去重
unique = sc.parallelize([1, 1, 2, 2, 3]).distinct()

# union：合并两个 RDD
rdd1 = sc.parallelize([1, 2, 3])
rdd2 = sc.parallelize([3, 4, 5])
combined = rdd1.union(rdd2)

# intersection：交集
common = rdd1.intersection(rdd2)

# subtract：差集
diff = rdd1.subtract(rdd2)

# sample：采样
sampled = numbers.sample(withReplacement=False, fraction=0.5, seed=42)

# sortBy：排序
sorted_rdd = numbers.sortBy(lambda x: -x)  # 降序

# groupBy：分组
grouped = numbers.groupBy(lambda x: x % 2)  # 按奇偶分组
```

### Key-Value RDD 操作

```python
# 创建键值对 RDD
pairs = sc.parallelize([
    ("北京", 100), ("上海", 200), ("北京", 150),
    ("上海", 180), ("广州", 120), ("广州", 90)
])

# reduceByKey：按键聚合
totals = pairs.reduceByKey(lambda a, b: a + b)

# groupByKey：按键分组
grouped = pairs.groupByKey().mapValues(list)

# sortByKey：按键排序
sorted_pairs = pairs.sortByKey()

# mapValues：只对值进行映射
doubled = pairs.mapValues(lambda x: x * 2)

# keys 和 values
all_keys = pairs.keys()
all_values = pairs.values()

# countByKey：按键计数
counts = pairs.countByKey()

# join：连接操作
other_pairs = sc.parallelize([("北京", "华北"), ("上海", "华东"), ("深圳", "华南")])
joined = pairs.join(other_pairs)        # 内连接
left_joined = pairs.leftOuterJoin(other_pairs)
right_joined = pairs.rightOuterJoin(other_pairs)
full_joined = pairs.fullOuterJoin(other_pairs)

# cogroup：协同分组
cogrouped = pairs.cogroup(other_pairs)
```

### Action 操作

Action 操作会触发实际的计算并返回结果。

```python
numbers = sc.parallelize([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

# collect：收集所有数据到 Driver
all_data = numbers.collect()

# count：计数
total_count = numbers.count()

# first：第一个元素
first_element = numbers.first()

# take：取前 N 个元素
first_five = numbers.take(5)

# takeOrdered：取最小的 N 个元素
smallest = numbers.takeOrdered(3)

# top：取最大的 N 个元素
largest = numbers.top(3)

# reduce：聚合所有元素
total_sum = numbers.reduce(lambda a, b: a + b)

# fold：带初始值的聚合
total_with_init = numbers.fold(0, lambda a, b: a + b)

# aggregate：更灵活的聚合
sum_count = numbers.aggregate(
    (0, 0),  # 初始值 (sum, count)
    lambda acc, val: (acc[0] + val, acc[1] + 1),  # 分区内聚合
    lambda acc1, acc2: (acc1[0] + acc2[0], acc1[1] + acc2[1])  # 分区间聚合
)
avg = sum_count[0] / sum_count[1]

# foreach：对每个元素执行操作（无返回值）
numbers.foreach(lambda x: print(x))

# saveAsTextFile：保存到文件
numbers.saveAsTextFile("hdfs://path/to/output")
```

### RDD 持久化

```python
from pyspark import StorageLevel

# 缓存到内存（默认级别）
rdd.cache()  # 等同于 rdd.persist(StorageLevel.MEMORY_ONLY)

# 不同的存储级别
rdd.persist(StorageLevel.MEMORY_ONLY)      # 仅内存
rdd.persist(StorageLevel.MEMORY_AND_DISK)  # 内存 + 磁盘
rdd.persist(StorageLevel.DISK_ONLY)        # 仅磁盘
rdd.persist(StorageLevel.MEMORY_ONLY_SER)  # 序列化存储
rdd.persist(StorageLevel.MEMORY_AND_DISK_SER)
rdd.persist(StorageLevel.OFF_HEAP)         # 堆外内存

# 取消持久化
rdd.unpersist()

# 检查是否已缓存
print(f"是否缓存: {rdd.is_cached}")
```

## DataFrame 与 SparkSQL

### DataFrame 基础

DataFrame 是以命名列组织的分布式数据集合，类似于关系数据库中的表或 Pandas DataFrame。

```python
from pyspark.sql import SparkSession
from pyspark.sql.types import *

spark = SparkSession.builder.appName("DataFrameDemo").getOrCreate()

# 从 Python 对象创建 DataFrame
data = [
    ("张三", 25, "北京", 15000.0),
    ("李四", 30, "上海", 20000.0),
    ("王五", 35, "广州", 18000.0),
    ("赵六", 28, "深圳", 22000.0)
]
columns = ["姓名", "年龄", "城市", "薪资"]
df = spark.createDataFrame(data, columns)

# 显示数据
df.show()
df.show(truncate=False)  # 不截断长字符串

# 查看 Schema
df.printSchema()

# 基本信息
print(f"行数: {df.count()}")
print(f"列数: {len(df.columns)}")
print(f"列名: {df.columns}")

# 统计摘要
df.describe().show()
df.summary().show()  # 更详细的统计
```

### 使用 Schema 定义数据结构

```python
# 方式1：使用 StructType 定义 Schema
schema = StructType([
    StructField("id", IntegerType(), nullable=False),
    StructField("name", StringType(), nullable=True),
    StructField("age", IntegerType(), nullable=True),
    StructField("salary", DoubleType(), nullable=True),
    StructField("department", StringType(), nullable=True)
])

data = [
    (1, "张三", 25, 15000.0, "技术部"),
    (2, "李四", 30, 20000.0, "市场部"),
    (3, "王五", 35, 18000.0, "技术部")
]

df = spark.createDataFrame(data, schema)
df.printSchema()

# 方式2：使用 DDL 字符串定义 Schema
ddl_schema = "id INT, name STRING, age INT, salary DOUBLE, department STRING"
df = spark.createDataFrame(data, ddl_schema)
```

### DataFrame 操作

```python
from pyspark.sql.functions import *

# 选择列
df.select("姓名", "年龄").show()
df.select(df.姓名, df.年龄).show()
df.select(col("姓名"), col("年龄")).show()

# 添加列
df = df.withColumn("年薪", col("薪资") * 12)
df = df.withColumn("年龄段",
    when(col("年龄") < 30, "青年")
    .when(col("年龄") < 40, "中年")
    .otherwise("老年"))

# 重命名列
df = df.withColumnRenamed("薪资", "月薪")

# 删除列
df = df.drop("年薪")

# 过滤数据
df.filter(col("年龄") > 28).show()
df.filter("年龄 > 28").show()
df.where(col("城市").isin(["北京", "上海"])).show()

# 排序
df.orderBy("年龄").show()
df.orderBy(col("年龄").desc()).show()
df.sort("城市", "年龄").show()

# 去重
df.distinct().show()
df.dropDuplicates(["城市"]).show()

# 限制行数
df.limit(2).show()

# 聚合操作
df.groupBy("城市").agg(
    count("*").alias("人数"),
    avg("薪资").alias("平均薪资"),
    max("年龄").alias("最大年龄"),
    min("年龄").alias("最小年龄")
).show()
```

### SparkSQL 查询

```python
# 注册临时视图
df.createOrReplaceTempView("employees")

# 注册全局临时视图（跨 Session 可用）
df.createOrReplaceGlobalTempView("global_employees")

# SQL 查询
result = spark.sql("""
    SELECT 城市,
           COUNT(*) as 员工数,
           AVG(薪资) as 平均薪资,
           SUM(薪资) as 总薪资
    FROM employees
    WHERE 年龄 >= 25
    GROUP BY 城市
    HAVING COUNT(*) > 0
    ORDER BY 平均薪资 DESC
""")
result.show()

# 复杂查询示例
spark.sql("""
    SELECT e1.姓名, e1.薪资,
           (SELECT AVG(薪资) FROM employees) as 公司平均薪资,
           e1.薪资 - (SELECT AVG(薪资) FROM employees) as 差额
    FROM employees e1
    WHERE e1.薪资 > (SELECT AVG(薪资) FROM employees)
""").show()

# 窗口函数
spark.sql("""
    SELECT 姓名, 城市, 薪资,
           ROW_NUMBER() OVER (PARTITION BY 城市 ORDER BY 薪资 DESC) as 城市排名,
           RANK() OVER (ORDER BY 薪资 DESC) as 公司排名,
           SUM(薪资) OVER (PARTITION BY 城市) as 城市总薪资,
           AVG(薪资) OVER () as 公司平均
    FROM employees
""").show()
```

### DataFrame 高级操作

```python
from pyspark.sql.window import Window

# 窗口函数（DataFrame API）
window_spec = Window.partitionBy("城市").orderBy(col("薪资").desc())

df_with_rank = df.withColumn("城市排名", row_number().over(window_spec)) \
                 .withColumn("城市总薪资", sum("薪资").over(Window.partitionBy("城市")))

# Join 操作
employees = spark.createDataFrame([
    (1, "张三", 101),
    (2, "李四", 102),
    (3, "王五", 101)
], ["emp_id", "name", "dept_id"])

departments = spark.createDataFrame([
    (101, "技术部"),
    (102, "市场部"),
    (103, "财务部")
], ["dept_id", "dept_name"])

# 内连接
employees.join(departments, "dept_id").show()

# 左连接
employees.join(departments, "dept_id", "left").show()

# 右连接
employees.join(departments, "dept_id", "right").show()

# 全外连接
employees.join(departments, "dept_id", "outer").show()

# 交叉连接
employees.crossJoin(departments).show()

# 多条件连接
employees.join(departments,
    (employees.dept_id == departments.dept_id) &
    (employees.name != "张三"),
    "inner").show()

# Union 操作
df1 = spark.createDataFrame([(1, "A"), (2, "B")], ["id", "name"])
df2 = spark.createDataFrame([(3, "C"), (4, "D")], ["id", "name"])
df1.union(df2).show()
df1.unionByName(df2).show()  # 按列名匹配
```

## 数据读写

### 读取多种数据源

```python
# CSV 文件
df_csv = spark.read.csv("path/to/file.csv", header=True, inferSchema=True)
df_csv = spark.read.format("csv") \
    .option("header", "true") \
    .option("inferSchema", "true") \
    .option("delimiter", ",") \
    .option("encoding", "UTF-8") \
    .option("nullValue", "NA") \
    .load("path/to/file.csv")

# JSON 文件
df_json = spark.read.json("path/to/file.json")
df_json = spark.read.format("json") \
    .option("multiline", "true") \
    .load("path/to/file.json")

# Parquet 文件（推荐格式）
df_parquet = spark.read.parquet("path/to/file.parquet")

# ORC 文件
df_orc = spark.read.orc("path/to/file.orc")

# Avro 文件
df_avro = spark.read.format("avro").load("path/to/file.avro")

# Delta Lake
df_delta = spark.read.format("delta").load("path/to/delta_table")

# JDBC 数据库
df_jdbc = spark.read.format("jdbc") \
    .option("url", "jdbc:mysql://localhost:3306/database") \
    .option("dbtable", "table_name") \
    .option("user", "username") \
    .option("password", "password") \
    .option("driver", "com.mysql.jdbc.Driver") \
    .load()

# 分区读取大表
df_jdbc_partitioned = spark.read.format("jdbc") \
    .option("url", "jdbc:mysql://localhost:3306/database") \
    .option("dbtable", "large_table") \
    .option("user", "username") \
    .option("password", "password") \
    .option("partitionColumn", "id") \
    .option("lowerBound", "1") \
    .option("upperBound", "1000000") \
    .option("numPartitions", "10") \
    .load()

# Hive 表
spark.sql("USE my_database")
df_hive = spark.sql("SELECT * FROM my_table")
df_hive = spark.table("my_database.my_table")

# Kafka
df_kafka = spark.read.format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "topic_name") \
    .load()
```

### 写入数据

```python
# CSV
df.write.csv("output/csv", header=True, mode="overwrite")

# JSON
df.write.json("output/json", mode="overwrite")

# Parquet（推荐）
df.write.parquet("output/parquet", mode="overwrite", compression="snappy")

# 分区写入
df.write.partitionBy("年份", "月份") \
    .parquet("output/partitioned", mode="overwrite")

# JDBC
df.write.format("jdbc") \
    .option("url", "jdbc:mysql://localhost:3306/database") \
    .option("dbtable", "output_table") \
    .option("user", "username") \
    .option("password", "password") \
    .mode("overwrite") \
    .save()

# Hive 表
df.write.saveAsTable("my_database.my_table", mode="overwrite")
df.write.insertInto("my_database.existing_table")

# Delta Lake
df.write.format("delta").mode("overwrite").save("output/delta")

# 写入模式
# - overwrite: 覆盖已有数据
# - append: 追加数据
# - ignore: 如果存在则忽略
# - error/errorifexists: 如果存在则报错（默认）

# 合并小文件后写入
df.coalesce(1).write.csv("output/single_file", header=True)
df.repartition(10).write.parquet("output/ten_files")
```

## 性能调优

### 分区优化

```python
# 查看当前分区数
print(f"分区数: {df.rdd.getNumPartitions()}")

# 重新分区
df_repartitioned = df.repartition(100)  # 增加分区
df_repartitioned = df.repartition(10, "城市")  # 按列重新分区
df_coalesced = df.coalesce(10)  # 减少分区（无 shuffle）

# 分区数设置建议
# - 每个分区大小约 128MB
# - 分区数 = 数据大小 / 128MB
# - 分区数通常是 executor 数量的 2-3 倍

# 配置 shuffle 分区数
spark.conf.set("spark.sql.shuffle.partitions", 200)

# 自适应查询执行（AQE）- Spark 3.0+
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
```

### 缓存策略

```python
# 缓存 DataFrame
df.cache()  # 等同于 persist(StorageLevel.MEMORY_AND_DISK)
df.persist()

# 查看是否已缓存
print(f"是否缓存: {df.is_cached}")

# 释放缓存
df.unpersist()

# 在 SQL 中缓存
spark.sql("CACHE TABLE my_table")
spark.sql("UNCACHE TABLE my_table")

# 缓存策略建议
# 只缓存会被多次使用的数据
# 在 action 后立即缓存
# 数据不再使用时及时释放
```

### Shuffle 优化

```python
# 避免不必要的 Shuffle
# 差：先 groupBy 再 filter
df.groupBy("城市").count().filter(col("count") > 10)

# 好：先 filter 再 groupBy
df.filter(col("金额") > 0).groupBy("城市").count()

# 使用 Broadcast Join 避免 Shuffle
from pyspark.sql.functions import broadcast

# 小表广播
small_df = spark.createDataFrame([...])  # 小于 10MB 的表
result = large_df.join(broadcast(small_df), "key")

# 配置广播阈值
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", 10 * 1024 * 1024)  # 10MB

# 使用 Bucket Join 优化
# 写入时创建 Bucket
df.write.bucketBy(100, "user_id").sortBy("user_id") \
    .saveAsTable("bucketed_table")

# 处理数据倾斜
# 方法1：增加随机前缀
from pyspark.sql.functions import rand, concat, lit

df_with_salt = df.withColumn("salted_key",
    concat(col("key"), lit("_"), (rand() * 10).cast("int")))

# 方法2：使用 AQE 自动处理
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
```

### 内存管理

```python
# Executor 内存配置
# spark.executor.memory: 总内存
# spark.memory.fraction: 执行和存储内存占比（默认 0.6）
# spark.memory.storageFraction: 存储内存占比（默认 0.5）

# 配置示例
spark = SparkSession.builder \
    .appName("MemoryOptimization") \
    .config("spark.executor.memory", "8g") \
    .config("spark.executor.memoryOverhead", "2g") \
    .config("spark.memory.fraction", "0.6") \
    .config("spark.memory.storageFraction", "0.5") \
    .config("spark.sql.shuffle.partitions", "200") \
    .getOrCreate()

# 序列化优化
spark.conf.set("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
spark.conf.set("spark.kryoserializer.buffer.max", "1024m")

# GC 优化建议
# 使用 G1GC: -XX:+UseG1GC
# 设置最大 GC 暂停时间: -XX:MaxGCPauseMillis=500
```

### 执行计划分析

```python
# 查看逻辑计划
df.explain()

# 查看完整执行计划
df.explain(mode="extended")

# 查看代价估算
df.explain(mode="cost")

# 查看格式化输出
df.explain(mode="formatted")

# 查看物理计划
df.explain(mode="simple")

# 实际示例
complex_df = df.filter(col("年龄") > 25) \
    .groupBy("城市") \
    .agg(avg("薪资").alias("平均薪资")) \
    .orderBy(col("平均薪资").desc())

complex_df.explain(mode="formatted")
```

## Spark Streaming

### Structured Streaming 基础

Spark Structured Streaming 是基于 Spark SQL 引擎的可扩展、容错的流处理引擎。

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import *

spark = SparkSession.builder \
    .appName("StructuredStreaming") \
    .getOrCreate()

# 从 Socket 读取流数据
lines = spark.readStream \
    .format("socket") \
    .option("host", "localhost") \
    .option("port", 9999) \
    .load()

# 处理流数据
words = lines.select(explode(split(col("value"), " ")).alias("word"))
word_counts = words.groupBy("word").count()

# 输出流数据
query = word_counts.writeStream \
    .outputMode("complete") \
    .format("console") \
    .start()

query.awaitTermination()
```

### Kafka 流处理

```python
# 从 Kafka 读取
df_stream = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "input_topic") \
    .option("startingOffsets", "latest") \
    .load()

# 解析 JSON 数据
schema = StructType([
    StructField("user_id", StringType()),
    StructField("event_type", StringType()),
    StructField("timestamp", TimestampType()),
    StructField("amount", DoubleType())
])

parsed = df_stream.select(
    from_json(col("value").cast("string"), schema).alias("data")
).select("data.*")

# 窗口聚合
windowed = parsed \
    .withWatermark("timestamp", "10 minutes") \
    .groupBy(
        window(col("timestamp"), "5 minutes", "1 minute"),
        col("event_type")
    ).agg(
        count("*").alias("event_count"),
        sum("amount").alias("total_amount")
    )

# 写入 Kafka
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

### 流处理输出模式

```python
# Append 模式：只输出新行（适用于不含聚合的查询）
query = df.writeStream \
    .outputMode("append") \
    .format("parquet") \
    .option("path", "output/parquet") \
    .option("checkpointLocation", "checkpoint/path") \
    .start()

# Complete 模式：输出完整结果表（适用于聚合查询）
query = aggregated_df.writeStream \
    .outputMode("complete") \
    .format("console") \
    .start()

# Update 模式：只输出更新的行
query = aggregated_df.writeStream \
    .outputMode("update") \
    .format("console") \
    .start()
```

### 流处理高级特性

```python
# Watermark 处理延迟数据
df_with_watermark = df_stream \
    .withWatermark("event_time", "10 minutes") \
    .groupBy(
        window(col("event_time"), "5 minutes"),
        col("device_id")
    ).count()

# 流-流 Join
impression_stream = spark.readStream.format("kafka")...
click_stream = spark.readStream.format("kafka")...

# 带 Watermark 的 Join
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

# foreachBatch 自定义输出
def process_batch(batch_df, batch_id):
    # 自定义处理逻辑
    batch_df.write.mode("append").jdbc(...)

query = df.writeStream \
    .foreachBatch(process_batch) \
    .start()
```

## MLlib 机器学习

### 机器学习流程概述

```python
from pyspark.ml import Pipeline
from pyspark.ml.feature import *
from pyspark.ml.classification import *
from pyspark.ml.evaluation import *
from pyspark.ml.tuning import *

# 加载数据
data = spark.read.csv("data.csv", header=True, inferSchema=True)

# 查看数据
data.show(5)
data.printSchema()
```

### 特征工程

```python
# 字符串索引化
string_indexer = StringIndexer(inputCol="category", outputCol="category_index")

# 独热编码
one_hot_encoder = OneHotEncoder(inputCol="category_index", outputCol="category_vec")

# 向量组装
assembler = VectorAssembler(
    inputCols=["feature1", "feature2", "feature3", "category_vec"],
    outputCol="features"
)

# 特征标准化
scaler = StandardScaler(inputCol="features", outputCol="scaled_features")

# 特征归一化
normalizer = Normalizer(inputCol="features", outputCol="normalized_features", p=2.0)

# 最小最大缩放
min_max_scaler = MinMaxScaler(inputCol="features", outputCol="minmax_features")

# PCA 降维
pca = PCA(k=3, inputCol="features", outputCol="pca_features")

# 特征选择
selector = ChiSqSelector(
    numTopFeatures=50,
    featuresCol="features",
    outputCol="selected_features",
    labelCol="label"
)

# 分词器
tokenizer = Tokenizer(inputCol="text", outputCol="words")

# TF-IDF
hashing_tf = HashingTF(inputCol="words", outputCol="raw_features", numFeatures=1000)
idf = IDF(inputCol="raw_features", outputCol="tfidf_features")

# Word2Vec
word2vec = Word2Vec(vectorSize=100, minCount=5, inputCol="words", outputCol="word_vectors")
```

### 分类模型

```python
# 准备数据
from pyspark.ml.feature import StringIndexer, VectorAssembler

# 标签索引
label_indexer = StringIndexer(inputCol="label", outputCol="indexed_label")

# 特征组装
assembler = VectorAssembler(inputCols=["col1", "col2", "col3"], outputCol="features")

# 数据划分
train_data, test_data = data.randomSplit([0.8, 0.2], seed=42)

# 逻辑回归
from pyspark.ml.classification import LogisticRegression

lr = LogisticRegression(
    featuresCol="features",
    labelCol="indexed_label",
    maxIter=100,
    regParam=0.01,
    elasticNetParam=0.8
)

# 决策树
from pyspark.ml.classification import DecisionTreeClassifier

dt = DecisionTreeClassifier(
    featuresCol="features",
    labelCol="indexed_label",
    maxDepth=5
)

# 随机森林
from pyspark.ml.classification import RandomForestClassifier

rf = RandomForestClassifier(
    featuresCol="features",
    labelCol="indexed_label",
    numTrees=100,
    maxDepth=10
)

# 梯度提升树
from pyspark.ml.classification import GBTClassifier

gbt = GBTClassifier(
    featuresCol="features",
    labelCol="indexed_label",
    maxIter=100
)

# 多层感知机
from pyspark.ml.classification import MultilayerPerceptronClassifier

layers = [4, 8, 4, 2]  # 输入层、隐藏层、输出层
mlp = MultilayerPerceptronClassifier(
    layers=layers,
    featuresCol="features",
    labelCol="indexed_label"
)
```

### 构建 Pipeline

```python
from pyspark.ml import Pipeline

# 定义 Pipeline
pipeline = Pipeline(stages=[
    string_indexer,
    assembler,
    scaler,
    rf
])

# 训练模型
model = pipeline.fit(train_data)

# 预测
predictions = model.transform(test_data)
predictions.select("features", "label", "prediction", "probability").show()

# 评估模型
from pyspark.ml.evaluation import MulticlassClassificationEvaluator

evaluator = MulticlassClassificationEvaluator(
    labelCol="indexed_label",
    predictionCol="prediction",
    metricName="accuracy"
)

accuracy = evaluator.evaluate(predictions)
print(f"准确率: {accuracy:.4f}")

# 其他评估指标
for metric in ["accuracy", "weightedPrecision", "weightedRecall", "f1"]:
    evaluator.setMetricName(metric)
    print(f"{metric}: {evaluator.evaluate(predictions):.4f}")
```

### 超参数调优

```python
from pyspark.ml.tuning import CrossValidator, ParamGridBuilder

# 定义参数网格
param_grid = ParamGridBuilder() \
    .addGrid(rf.numTrees, [50, 100, 200]) \
    .addGrid(rf.maxDepth, [5, 10, 15]) \
    .addGrid(rf.minInstancesPerNode, [1, 2, 5]) \
    .build()

# 交叉验证
cv = CrossValidator(
    estimator=pipeline,
    estimatorParamMaps=param_grid,
    evaluator=evaluator,
    numFolds=5,
    parallelism=4
)

# 训练并找到最佳模型
cv_model = cv.fit(train_data)

# 最佳模型
best_model = cv_model.bestModel

# 查看最佳参数
print(f"最佳树数量: {best_model.stages[-1].getNumTrees}")

# 使用 TrainValidationSplit（更快但不如 CV 稳定）
from pyspark.ml.tuning import TrainValidationSplit

tvs = TrainValidationSplit(
    estimator=pipeline,
    estimatorParamMaps=param_grid,
    evaluator=evaluator,
    trainRatio=0.8
)

tvs_model = tvs.fit(train_data)
```

### 保存和加载模型

```python
# 保存模型
model.save("models/my_model")
pipeline.save("models/my_pipeline")

# 加载模型
from pyspark.ml import PipelineModel
loaded_model = PipelineModel.load("models/my_model")

# 使用加载的模型预测
predictions = loaded_model.transform(new_data)
```

## 集群部署与监控

### 部署模式

```bash
# Local 模式（本地测试）
spark-submit --master local[*] my_app.py

# Standalone 集群模式
spark-submit --master spark://master:7077 \
    --deploy-mode cluster \
    --executor-memory 4g \
    --total-executor-cores 100 \
    my_app.py

# YARN 集群模式
spark-submit --master yarn \
    --deploy-mode cluster \
    --executor-memory 4g \
    --executor-cores 2 \
    --num-executors 50 \
    my_app.py

# Kubernetes 模式
spark-submit --master k8s://https://kubernetes:6443 \
    --deploy-mode cluster \
    --conf spark.kubernetes.container.image=spark:latest \
    my_app.py
```

### 资源配置

```bash
# 常用配置参数
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
    --conf spark.memory.fraction=0.6 \
    --conf spark.memory.storageFraction=0.5 \
    --conf spark.serializer=org.apache.spark.serializer.KryoSerializer \
    --conf spark.dynamicAllocation.enabled=true \
    --conf spark.dynamicAllocation.minExecutors=10 \
    --conf spark.dynamicAllocation.maxExecutors=100 \
    --conf spark.sql.adaptive.enabled=true \
    my_app.py
```

### Spark UI 监控

```python
# Spark UI 默认端口
# - Driver UI: 4040
# - History Server: 18080
# - Master UI (Standalone): 8080
# - Worker UI: 8081

# 配置 History Server
# spark.eventLog.enabled=true
# spark.eventLog.dir=hdfs://path/to/spark-events
# spark.history.fs.logDirectory=hdfs://path/to/spark-events

# 在代码中设置
spark = SparkSession.builder \
    .appName("MonitoredApp") \
    .config("spark.eventLog.enabled", "true") \
    .config("spark.eventLog.dir", "hdfs://path/to/spark-events") \
    .getOrCreate()
```

### 监控指标

```python
# 通过 SparkContext 获取指标
sc = spark.sparkContext

# 获取状态追踪器
status_tracker = sc.statusTracker()

# 获取活跃的 Job
active_jobs = status_tracker.getActiveJobIds()

# 获取活跃的 Stage
active_stages = status_tracker.getActiveStageIds()

# 在 SQL 查询中监控
spark.sql("SELECT * FROM my_table").explain("cost")

# 使用 Spark Listener 自定义监控
from pyspark import SparkContext

class MySparkListener:
    def onStageCompleted(self, stageCompleted):
        print(f"Stage {stageCompleted.stageInfo.stageId} 完成")

    def onJobEnd(self, jobEnd):
        print(f"Job {jobEnd.jobId} 完成")

# 注册 Listener
# sc.addSparkListener(MySparkListener())
```

### 常见问题排查

```python
# OOM 问题
# - 增加 executor 内存
# - 减少分区大小
# - 使用磁盘持久化

# 数据倾斜
# - 检查 key 分布
df.groupBy("key").count().orderBy(col("count").desc()).show()

# - 使用 salting 技术
# - 启用 AQE

# Shuffle 问题
# - 减少 shuffle 操作
# - 使用 broadcast join
# - 调整 shuffle 分区数

# 序列化问题
# - 使用 Kryo 序列化
# - 避免传递大对象到 executor

# 检查执行计划
df.explain(mode="formatted")
```

## 面试要点

### RDD、DataFrame 和 Dataset 的区别

| 特性 | RDD | DataFrame | Dataset |
|------|-----|-----------|---------|
| 类型安全 | 是 | 否 | 是 |
| 优化器 | 无 | Catalyst | Catalyst |
| 序列化 | Java/Kryo | Tungsten | Tungsten |
| API | 函数式 | 声明式 | 混合 |
| 适用语言 | 所有 | 所有 | Scala/Java |

### Spark 如何实现容错？

- **RDD 容错**：通过 Lineage（血统）记录转换操作，丢失分区可重新计算
- **Checkpoint**：将 RDD 持久化到可靠存储，截断 Lineage
- **WAL**：Streaming 中使用预写日志保证数据不丢失

### 宽依赖和窄依赖

```python
# 窄依赖：父 RDD 的每个分区最多被子 RDD 的一个分区使用
# 示例：map, filter, union

# 宽依赖：父 RDD 的每个分区可能被子 RDD 的多个分区使用
# 示例：groupByKey, reduceByKey, join

# 宽依赖会触发 Shuffle，是性能瓶颈
```

### Shuffle 过程

1. **Map 阶段**：将数据按 key 分组写入磁盘
2. **Shuffle 阶段**：网络传输数据到目标节点
3. **Reduce 阶段**：聚合相同 key 的数据

优化策略：
- 减少 Shuffle 数据量（提前 filter）
- 使用 Broadcast Join
- 调整分区数
- 启用压缩

### Spark 内存管理

```
Executor 内存 = 执行内存 + 存储内存 + 用户内存 + 保留内存

- 执行内存：Shuffle、Join、Sort、聚合
- 存储内存：缓存、广播变量
- 用户内存：用户数据结构、元数据
- 保留内存：系统保留（300MB）

统一内存管理（Spark 1.6+）：执行和存储内存可互相借用
```

### 如何处理数据倾斜？

```python
# 方法1：增加并行度
spark.conf.set("spark.sql.shuffle.partitions", 1000)

# 方法2：Salting（加盐）
df = df.withColumn("salted_key", concat(col("key"), lit("_"), (rand() * 10).cast("int")))

# 方法3：两阶段聚合
# 先局部聚合，再全局聚合

# 方法4：Broadcast Join
result = large_df.join(broadcast(small_df), "key")

# 方法5：自适应查询执行（AQE）
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
```

### Spark Streaming 与 Structured Streaming 区别

| 特性 | Spark Streaming | Structured Streaming |
|------|-----------------|---------------------|
| 编程模型 | DStream (RDD) | DataFrame/Dataset |
| 语义 | At-least-once | Exactly-once |
| 事件时间 | 不支持 | 支持 |
| Watermark | 不支持 | 支持 |
| 流-流 Join | 有限支持 | 完整支持 |

### 常用优化技巧总结

```python
# 选择合适的 API
# DataFrame/SQL > RDD（Catalyst 优化器）

# 合理设置分区数
# 分区数 = 数据量 / 128MB

# 使用列式存储格式
# Parquet > ORC > JSON > CSV

# 启用 AQE
spark.conf.set("spark.sql.adaptive.enabled", "true")

# 使用 Broadcast Join
from pyspark.sql.functions import broadcast
result = large_df.join(broadcast(small_df), "key")

# 合理使用缓存
df.cache()  # 多次使用的数据

# 避免 UDF
# 优先使用内置函数

# 使用 Kryo 序列化
spark.conf.set("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
```

## 延伸阅读

### 官方资源

- [Apache Spark 官方文档](https://spark.apache.org/docs/latest/)
- [Spark SQL 指南](https://spark.apache.org/docs/latest/sql-programming-guide.html)
- [MLlib 机器学习指南](https://spark.apache.org/docs/latest/ml-guide.html)

### 推荐书籍

- **《Learning Spark, 2nd Edition》** - O'Reilly
- **《Spark: The Definitive Guide》** - Bill Chambers, Matei Zaharia
- **《High Performance Spark》** - Holden Karau

### 相关技术

- **Delta Lake**：ACID 事务支持的数据湖
- **Apache Iceberg**：开放表格式
- **Apache Hudi**：增量数据处理
- **Databricks**：商业 Spark 平台

### 实践项目

- 实时日志分析系统
- 用户行为推荐引擎
- 大规模特征工程 Pipeline
- 实时数据仓库 ETL

---

Apache Spark 是大数据处理的核心技术，掌握其原理和最佳实践对于数据工程师和数据科学家至关重要。通过本指南的学习，你应该能够：设计高效的 Spark 应用、优化作业性能、处理实时流数据，以及构建机器学习 Pipeline。建议在实际项目中持续实践，深入理解 Spark 的内部机制。
