---
title: Polars：高性能 DataFrame 库
description: 探索 Polars 作为 Pandas 的高性能数据处理替代方案
track: datascience
section: python-stack
difficulty: intermediate
tags:
  - Polars
  - DataFrame
  - Rust
  - Data Processing
status: imported
origin: old/src/content/docs/data/polars.zh.md
divergence: 0.2
issues: []
legacy:
  category: Data
  subcategory: Data Processing
  order: 18
  lastUpdated: 2026-01-07
---

Polars 是一个用 Rust 实现的极速 DataFrame 库，从底层设计就以性能为核心。它提供即时执行和惰性执行两种模式、多线程、SIMD 优化和强大的表达式 API。无论你处理的是数百万还是数十亿行数据，Polars 都能提供比 Pandas 性能显著更好的现代替代方案。

## 为什么选择 Polars？

### 相比 Pandas 的主要优势

1. **速度**：用 Rust 编写，采用零拷贝 Arrow 内存格式，Polars 通常比 Pandas 快 10-100 倍
2. **内存效率**：使用 Apache Arrow 列式格式，减少内存使用并支持零拷贝操作
3. **惰性求值**：构建查询计划，在执行前进行优化
4. **并行处理**：自动在 CPU 核心间并行化操作
5. **一致的 API**：表达式在即时和惰性模式下的工作方式相同
6. **无索引**：与 Pandas 不同，Polars 没有索引，带来更简单、更可预测的行为

```python
import polars as pl

# 检查 Polars 版本
print(pl.__version__)

# 创建一个简单的 DataFrame
df = pl.DataFrame({
    "name": ["Alice", "Bob", "Charlie", "David"],
    "age": [25, 30, 35, 28],
    "city": ["New York", "London", "Paris", "Tokyo"],
    "salary": [75000, 85000, 90000, 70000]
})
print(df)
```

## Polars vs Pandas：详细对比

了解 Polars 和 Pandas 之间的差异有助于你为用例选择正确的工具。

### 功能对比

| 功能 | Polars | Pandas |
|---------|--------|--------|
| 实现语言 | Rust | Python/C |
| 内存格式 | Apache Arrow | NumPy |
| 惰性求值 | 是 | 否 |
| 多线程 | 内置 | 有限 |
| 索引 | 否 | 是 |
| 缺失值 | null (Arrow) | NaN/None |
| 字符串类型 | 原生 UTF-8 | Object/String |
| 查询优化 | 自动 | 手动 |

### 语法对比

```python
import polars as pl
import pandas as pd

# =====================
# 创建 DataFrame
# =====================

# Pandas
df_pandas = pd.DataFrame({
    "a": [1, 2, 3, 4, 5],
    "b": [10, 20, 30, 40, 50],
    "category": ["X", "Y", "X", "Y", "X"]
})

# Polars
df_polars = pl.DataFrame({
    "a": [1, 2, 3, 4, 5],
    "b": [10, 20, 30, 40, 50],
    "category": ["X", "Y", "X", "Y", "X"]
})

# =====================
# 过滤
# =====================

# Pandas
result_pandas = df_pandas[df_pandas["a"] > 2]

# Polars
result_polars = df_polars.filter(pl.col("a") > 2)

# =====================
# 分组聚合
# =====================

# Pandas
result_pandas = df_pandas.groupby("category")["b"].sum()

# Polars
result_polars = df_polars.group_by("category").agg(pl.col("b").sum())

# =====================
# 多重操作
# =====================

# Pandas
result_pandas = (
    df_pandas[df_pandas["a"] > 1]
    .groupby("category")
    .agg({"b": "sum", "a": "mean"})
)

# Polars（更明确且可并行化）
result_polars = (
    df_polars
    .filter(pl.col("a") > 1)
    .group_by("category")
    .agg(
        pl.col("b").sum().alias("b_sum"),
        pl.col("a").mean().alias("a_mean")
    )
)
```

### 何时使用哪个

**使用 Polars 的情况：**
- 处理大型数据集（百万行以上）
- 性能至关重要
- 需要并行处理
- 内存效率很重要
- 构建数据管道

**使用 Pandas 的情况：**
- 处理小型数据集
- 需要广泛的生态系统集成
- 需要遗留代码兼容性
- 需要特定的 Pandas 专有功能

## 核心概念：即时 vs 惰性求值

### 即时模式（DataFrame）

即时模式立即执行操作，类似于 Pandas。用于交互式探索和较小的数据集。

```python
import polars as pl

# 即时执行 - 结果立即计算
df = pl.DataFrame({
    "id": [1, 2, 3, 4, 5],
    "value": [10, 20, 30, 40, 50],
    "category": ["A", "B", "A", "B", "A"]
})

# 操作立即执行
result = df.filter(pl.col("value") > 20).select(["id", "value"])
print(result)
```

### 惰性模式（LazyFrame）

惰性模式构建在执行前优化的查询计划。这是生产工作负载的推荐方法。

```python
import polars as pl

# 惰性执行 - 构建查询计划
lf = pl.LazyFrame({
    "id": [1, 2, 3, 4, 5],
    "value": [10, 20, 30, 40, 50],
    "category": ["A", "B", "A", "B", "A"]
})

# 构建查询计划（尚未执行）
query = (
    lf.filter(pl.col("value") > 20)
    .group_by("category")
    .agg(pl.col("value").sum().alias("total"))
)

# 查看查询计划
print(query.explain())

# 使用 collect() 执行
result = query.collect()
print(result)

# 将即时 DataFrame 转换为惰性
df = pl.DataFrame({"a": [1, 2, 3]})
lazy_df = df.lazy()

# 将惰性转换为即时
eager_df = lazy_df.collect()
```

### 惰性求值的优势

1. **查询优化**：Polars 优化整个查询计划
2. **谓词下推**：过滤器被下推到读取操作
3. **投影下推**：只加载所需的列
4. **并行执行**：操作自动并行化

```python
# Polars 优化这整个查询
result = (
    pl.scan_parquet("large_file.parquet")  # 惰性读取
    .filter(pl.col("date") > "2024-01-01")  # 下推到文件读取
    .select(["id", "value", "date"])  # 只加载这些列
    .group_by("id")
    .agg(pl.col("value").sum())
    .collect()
)
```

## 表达式：Polars 的核心

表达式是 Polars 操作的构建块。它们描述对列的计算，而不立即执行。

### 基本表达式

```python
import polars as pl

df = pl.DataFrame({
    "a": [1, 2, 3, 4, 5],
    "b": [10, 20, 30, 40, 50],
    "c": ["x", "y", "x", "y", "x"]
})

# 列选择
df.select(pl.col("a"))
df.select(pl.col("a", "b"))
df.select(pl.col("*"))  # 所有列
df.select(pl.exclude("c"))  # 除 "c" 外的所有列

# 字面值
df.select(pl.lit(42).alias("constant"))

# 算术运算
df.select(
    pl.col("a"),
    (pl.col("a") + pl.col("b")).alias("sum"),
    (pl.col("a") * 2).alias("doubled"),
    (pl.col("b") / pl.col("a")).alias("ratio")
)

# 字符串表达式
df.select(
    pl.col("c").str.to_uppercase().alias("upper"),
    pl.col("c").str.len_chars().alias("length")
)
```

### 表达式上下文

表达式在不同的上下文中使用，决定其行为：

```python
import polars as pl

df = pl.DataFrame({
    "name": ["Alice", "Bob", "Charlie"],
    "height": [165, 180, 175],
    "weight": [55, 80, 70]
})

# SELECT 上下文 - 选择和转换列
df.select(
    pl.col("name"),
    pl.col("height").mean().alias("avg_height")
)

# WITH_COLUMNS 上下文 - 添加新列同时保留现有列
df.with_columns(
    (pl.col("weight") / (pl.col("height") / 100) ** 2).alias("bmi")
)

# FILTER 上下文 - 基于条件过滤行
df.filter(pl.col("height") > 170)

# GROUP_BY 上下文 - 在组内聚合
df.group_by("name").agg(
    pl.col("height").mean(),
    pl.col("weight").sum()
)
```

### 条件表达式

```python
import polars as pl

df = pl.DataFrame({
    "value": [1, 2, 3, 4, 5],
    "category": ["A", "B", "A", "B", "A"]
})

# when-then-otherwise（类似 SQL CASE）
df.with_columns(
    pl.when(pl.col("value") > 3)
    .then(pl.lit("high"))
    .otherwise(pl.lit("low"))
    .alias("level")
)

# 多个条件
df.with_columns(
    pl.when(pl.col("value") > 4).then(pl.lit("high"))
    .when(pl.col("value") > 2).then(pl.lit("medium"))
    .otherwise(pl.lit("low"))
    .alias("tier")
)

# 嵌套条件
df.with_columns(
    pl.when(pl.col("category") == "A")
    .then(
        pl.when(pl.col("value") > 3)
        .then(pl.lit("A-high"))
        .otherwise(pl.lit("A-low"))
    )
    .otherwise(pl.lit("B"))
    .alias("detailed_category")
)
```

### 链式表达式

```python
import polars as pl

df = pl.DataFrame({
    "text": ["  Hello World  ", "  POLARS  ", "  Data  "],
    "value": [1, 2, 3]
})

# 链接多个操作
result = df.select(
    pl.col("text")
    .str.strip_chars()
    .str.to_lowercase()
    .str.replace(" ", "_")
    .alias("processed")
)
print(result)
```

## 读取和写入数据

### CSV 文件

```python
import polars as pl

# 即时读取 - 将整个文件加载到内存
df = pl.read_csv(
    "data/sales.csv",
    has_header=True,
    columns=["date", "product", "quantity", "price"],
    dtypes={"product": pl.Categorical, "quantity": pl.Int32},
    try_parse_dates=True
)

# 惰性读取 - 延迟执行以进行优化
lf = pl.scan_csv("data/sales.csv")
result = lf.filter(pl.col("quantity") > 10).collect()

# 写入 CSV
df.write_csv("output.csv")

# 带选项写入
df.write_csv("output.csv", separator=",", include_header=True)
```

### Parquet 文件

由于其列式存储和压缩，Parquet 是大型数据集的推荐格式。

```python
import polars as pl

# 将 DataFrame 写入 Parquet
df = pl.DataFrame({
    "id": [1, 2, 3, 4],
    "name": ["Alice", "Bob", "Charlie", "David"],
    "score": [95.5, 87.2, 92.8, 78.9]
})
df.write_parquet("output.parquet", compression="snappy")

# 读取 Parquet 文件（即时）
df_read = pl.read_parquet("output.parquet")

# 扫描 Parquet 文件（惰性）带谓词下推
lf = pl.scan_parquet("output.parquet")
result = (
    lf.filter(pl.col("score") > 90)
    .select(["name", "score"])
    .collect()
)
print(result)

# 使用 glob 模式读取多个 Parquet 文件
df = pl.read_parquet("data/*.parquet")
lf = pl.scan_parquet("data/**/*.parquet")
```

**重要**：避免 `read_parquet().lazy()` - 这是一个反模式，会强制 Polars 在创建 LazyFrame 之前加载整个文件。惰性求值始终使用 `scan_parquet()`。

### 其他格式

```python
import polars as pl

# JSON
df = pl.read_json("data.json")
df.write_json("output.json")

# NDJSON（换行符分隔的 JSON）
df = pl.read_ndjson("data.ndjson")
df.write_ndjson("output.ndjson")

# Excel（需要额外的依赖）
df = pl.read_excel("data.xlsx", sheet_name="Sheet1")

# SQL 数据库
df = pl.read_database(
    query="SELECT * FROM users",
    connection="postgresql://localhost/db"
)
```

## 过滤数据

```python
import polars as pl

df = pl.DataFrame({
    "name": ["Alice", "Bob", "Charlie", "David", "Eve"],
    "age": [25, 30, 35, 28, 22],
    "city": ["NYC", "London", "Paris", "NYC", "Tokyo"],
    "salary": [75000, 85000, 90000, 70000, 65000]
})

# 简单过滤
df.filter(pl.col("age") > 25)

# 使用 AND (&) 的多个条件
df.filter((pl.col("age") > 25) & (pl.col("salary") > 70000))

# 使用 OR (|) 的多个条件
df.filter((pl.col("city") == "NYC") | (pl.col("city") == "London"))

# 使用 is_in 匹配多个值
df.filter(pl.col("city").is_in(["NYC", "London"]))

# 否定
df.filter(~pl.col("city").is_in(["NYC", "London"]))

# 字符串包含
df.filter(pl.col("name").str.contains("li"))

# Null 处理
df.filter(pl.col("salary").is_not_null())

# 范围内（包含）
df.filter(pl.col("age").is_between(25, 30))

# 多个条件的复杂过滤
df.filter(
    (pl.col("age") > 25) &
    (pl.col("salary") > 70000) &
    (pl.col("city").is_in(["NYC", "London", "Paris"]))
)
```

## 连接

Polars 支持各种连接类型，性能出色。

### 基本连接

```python
import polars as pl

employees = pl.DataFrame({
    "emp_id": [1, 2, 3, 4],
    "name": ["Alice", "Bob", "Charlie", "David"],
    "dept_id": [101, 102, 101, 103]
})

departments = pl.DataFrame({
    "dept_id": [101, 102, 104],
    "dept_name": ["Engineering", "Marketing", "Finance"]
})

# 内连接 - 只有匹配的行
result = employees.join(departments, on="dept_id", how="inner")
print("内连接：")
print(result)

# 左连接 - 左表所有行，右表匹配行
result = employees.join(departments, on="dept_id", how="left")
print("\n左连接：")
print(result)

# 右连接 - 右表所有行，左表匹配行
result = employees.join(departments, on="dept_id", how="right")
print("\n右连接：")
print(result)

# 全外连接 - 两表所有行
result = employees.join(departments, on="dept_id", how="full")
print("\n全连接：")
print(result)
```

### 半连接和反连接

半连接和反连接对于基于匹配行是否存在进行过滤非常强大。

```python
import polars as pl

orders = pl.DataFrame({
    "order_id": [1, 2, 3, 4, 5],
    "customer_id": [101, 102, 101, 103, 104]
})

active_customers = pl.DataFrame({
    "customer_id": [101, 102]
})

# 半连接 - 左表中在右表有匹配的行
# 返回活跃客户的订单
result = orders.join(active_customers, on="customer_id", how="semi")
print("半连接（活跃客户的订单）：")
print(result)

# 反连接 - 左表中在右表没有匹配的行
# 返回非活跃客户的订单
result = orders.join(active_customers, on="customer_id", how="anti")
print("\n反连接（非活跃客户的订单）：")
print(result)
```

### Asof 连接（基于时间的连接）

Asof 连接非常适合时间序列数据，当你想要匹配最近的键而不是精确匹配时。

```python
import polars as pl

# 股票交易
trades = pl.DataFrame({
    "time": [1, 5, 10, 15],
    "ticker": ["AAPL", "AAPL", "AAPL", "AAPL"],
    "price": [100.0, 101.5, 102.0, 101.8]
})

# 市场报价
quotes = pl.DataFrame({
    "time": [1, 2, 4, 6, 8, 12],
    "ticker": ["AAPL", "AAPL", "AAPL", "AAPL", "AAPL", "AAPL"],
    "bid": [99.5, 99.8, 100.2, 101.0, 101.2, 101.5]
})

# 向后 asof 连接 - 匹配交易时间或之前的最近报价
result = trades.join_asof(
    quotes,
    on="time",
    by="ticker",
    strategy="backward"
)
print("向后 asof 连接：")
print(result)

# 向前 asof 连接 - 匹配下一个可用报价
result = trades.join_asof(
    quotes,
    on="time",
    strategy="forward"
)
print("\n向前 asof 连接：")
print(result)

# 最近 asof 连接 - 匹配最近的报价
result = trades.join_asof(
    quotes,
    on="time",
    strategy="nearest"
)
print("\n最近 asof 连接：")
print(result)
```

### 不同列名的连接

```python
import polars as pl

df1 = pl.DataFrame({
    "id": [1, 2, 3],
    "value": ["a", "b", "c"]
})

df2 = pl.DataFrame({
    "other_id": [1, 2, 4],
    "score": [100, 200, 300]
})

# 不同名列的连接
result = df1.join(
    df2,
    left_on="id",
    right_on="other_id",
    how="left"
)
print(result)

# 重复列使用后缀的连接
df3 = pl.DataFrame({
    "id": [1, 2, 3],
    "value": [10, 20, 30]
})

result = df1.join(df3, on="id", suffix="_right")
print(result)
```

### 连接验证

```python
import polars as pl

# 验证连接基数
result = employees.join(
    departments,
    on="dept_id",
    how="left",
    validate="m:1"  # 多对一：检查 dept_id 在 departments 中唯一
)

# 可用的验证选项：
# "m:m" - 多对多（默认，不检查）
# "1:1" - 一对一（两边都唯一）
# "1:m" - 一对多（左边唯一）
# "m:1" - 多对一（右边唯一）
```

## 分组操作

### 基本聚合

```python
import polars as pl

sales = pl.DataFrame({
    "date": ["2024-01-01", "2024-01-01", "2024-01-02", "2024-01-02"],
    "product": ["A", "B", "A", "B"],
    "region": ["East", "East", "West", "West"],
    "quantity": [100, 150, 200, 180],
    "revenue": [1000, 1500, 2000, 1800]
})

# 单列分组
result = sales.group_by("product").agg(
    pl.col("quantity").sum().alias("total_qty"),
    pl.col("revenue").mean().alias("avg_revenue"),
    pl.col("revenue").max().alias("max_revenue"),
    pl.len().alias("count")
)
print(result)

# 多列分组
result = sales.group_by(["product", "region"]).agg(
    pl.col("quantity").sum(),
    pl.col("revenue").sum()
)
print(result)
```

### 常用聚合函数

```python
import polars as pl

df = pl.DataFrame({
    "group": ["A", "A", "B", "B", "B"],
    "value": [1, 2, 3, 4, 5]
})

result = df.group_by("group").agg(
    pl.col("value").count().alias("count"),
    pl.col("value").sum().alias("sum"),
    pl.col("value").mean().alias("mean"),
    pl.col("value").median().alias("median"),
    pl.col("value").std().alias("std"),
    pl.col("value").var().alias("var"),
    pl.col("value").min().alias("min"),
    pl.col("value").max().alias("max"),
    pl.col("value").first().alias("first"),
    pl.col("value").last().alias("last"),
    pl.col("value").n_unique().alias("n_unique"),
    pl.col("value").quantile(0.5).alias("q50"),
    pl.col("value").quantile(0.95).alias("q95")
)
print(result)
```

### 高级聚合

```python
import polars as pl

df = pl.DataFrame({
    "category": ["A", "A", "A", "B", "B"],
    "subcategory": ["x", "y", "x", "x", "y"],
    "value": [10, 20, 30, 40, 50]
})

# 不同列的多个聚合
result = df.group_by("category").agg(
    # 所有值的列表
    pl.col("value").alias("all_values"),
    # 排序列表
    pl.col("value").sort().alias("sorted_values"),
    # 前 2 个值
    pl.col("value").sort(descending=True).head(2).alias("top_2"),
    # 连接字符串
    pl.col("subcategory").str.concat("-").alias("subcats"),
    # 条件聚合
    pl.col("value").filter(pl.col("subcategory") == "x").sum().alias("x_sum")
)
print(result)

# 保持顺序的分组
result = df.group_by("category", maintain_order=True).agg(
    pl.col("value").sum()
)
```

### 动态分组

```python
import polars as pl
from datetime import datetime

df = pl.DataFrame({
    "timestamp": pl.datetime_range(
        start=datetime(2024, 1, 1),
        end=datetime(2024, 1, 10),
        interval="6h",
        eager=True
    ),
    "value": list(range(37))
})

# 按时间间隔分组
result = df.group_by_dynamic("timestamp", every="1d").agg(
    pl.col("value").sum().alias("daily_sum"),
    pl.col("value").mean().alias("daily_avg")
)
print(result)

# 滚动分组
result = df.rolling("timestamp", period="2d").agg(
    pl.col("value").sum().alias("rolling_sum")
)
```

## 窗口函数

窗口函数在与当前行相关的一组行上执行计算，类似于 SQL 窗口函数。

### 使用 over() 的基本窗口函数

```python
import polars as pl

df = pl.DataFrame({
    "name": ["Alice", "Bob", "Charlie", "David", "Eve"],
    "department": ["Sales", "Sales", "Engineering", "Engineering", "Sales"],
    "salary": [50000, 60000, 70000, 80000, 55000]
})

# 将部门统计作为新列添加
result = df.with_columns(
    # 每个部门的平均工资
    pl.col("salary").mean().over("department").alias("dept_avg_salary"),
    # 每个部门的最高工资
    pl.col("salary").max().over("department").alias("dept_max_salary"),
    # 每个部门的人数
    pl.len().over("department").alias("dept_size"),
    # 部门内排名
    pl.col("salary").rank().over("department").alias("salary_rank"),
    # 占部门总额的百分比
    (pl.col("salary") / pl.col("salary").sum().over("department") * 100)
        .round(2)
        .alias("pct_of_dept")
)
print(result)
```

### 高级窗口函数

```python
import polars as pl

df = pl.DataFrame({
    "date": ["2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04", "2024-01-05"],
    "category": ["A", "A", "A", "B", "B"],
    "value": [10, 20, 15, 30, 25]
})

result = df.with_columns(
    # 分类内的累计和
    pl.col("value").cum_sum().over("category").alias("running_sum"),
    # 累计计数
    pl.col("value").cum_count().over("category").alias("running_count"),
    # 分类内的前一个值（lag）
    pl.col("value").shift(1).over("category").alias("prev_value"),
    # 分类内的下一个值（lead）
    pl.col("value").shift(-1).over("category").alias("next_value"),
    # 与前一个的差值
    (pl.col("value") - pl.col("value").shift(1).over("category")).alias("diff"),
    # 组内第一个值
    pl.col("value").first().over("category").alias("first_in_group"),
    # 组内最后一个值
    pl.col("value").last().over("category").alias("last_in_group")
)
print(result)
```

### 窗口内排序

```python
import polars as pl

df = pl.DataFrame({
    "type": ["Fire", "Fire", "Water", "Water", "Fire"],
    "name": ["Charmander", "Charizard", "Squirtle", "Blastoise", "Flareon"],
    "speed": [65, 100, 43, 78, 65],
    "attack": [52, 84, 48, 83, 65]
})

result = df.with_columns(
    # 在每种类型内按速度排序并获取名称
    pl.col("name").sort_by("speed", descending=True).over("type").alias("by_speed"),
    # 获取每种类型速度最快的 2 个
    pl.col("speed").sort(descending=True).head(2).over("type").alias("top_2_speeds"),
    # 获取每种类型攻击力最强的
    pl.col("attack").sort(descending=True).first().over("type").alias("strongest_attack")
)
print(result)
```

### 滚动窗口

```python
import polars as pl
from datetime import datetime

df = pl.DataFrame({
    "date": pl.date_range(
        start=datetime(2024, 1, 1),
        end=datetime(2024, 1, 10),
        interval="1d",
        eager=True
    ),
    "value": [10, 12, 15, 14, 18, 20, 22, 19, 25, 24]
})

result = df.with_columns(
    # 3 天移动平均
    pl.col("value").rolling_mean(window_size=3).alias("ma_3"),
    # 3 天滚动和
    pl.col("value").rolling_sum(window_size=3).alias("sum_3"),
    # 3 天滚动标准差
    pl.col("value").rolling_std(window_size=3).alias("std_3"),
    # 3 天滚动最小/最大值
    pl.col("value").rolling_min(window_size=3).alias("min_3"),
    pl.col("value").rolling_max(window_size=3).alias("max_3"),
    # 指数移动平均
    pl.col("value").ewm_mean(span=3).alias("ema_3")
)
print(result)
```

### 一次调用中的多个窗口函数

Polars 通过缓存分区来优化相同分组上的多个窗口函数。

```python
import polars as pl

df = pl.DataFrame({
    "group": ["A", "A", "B", "B", "A"],
    "subgroup": ["x", "y", "x", "y", "x"],
    "value": [1, 2, 3, 4, 5]
})

# 多个窗口函数 - Polars 缓存分组
result = df.with_columns(
    pl.col("value").sum().over("group").alias("group_sum"),
    pl.col("value").mean().over("group").alias("group_mean"),
    pl.col("value").count().over("group").alias("group_count"),
    pl.col("value").sum().over("subgroup").alias("subgroup_sum"),
    pl.col("value").rank().over(["group", "subgroup"]).alias("combined_rank")
)
print(result)
```

## 字符串操作

```python
import polars as pl

df = pl.DataFrame({
    "text": ["  Hello World  ", "POLARS is FAST", "data_science_rocks"],
    "email": ["alice@example.com", "bob@test.org", "charlie@demo.net"]
})

result = df.select(
    # 去除空白
    pl.col("text").str.strip_chars().alias("stripped"),
    # 大小写转换
    pl.col("text").str.to_lowercase().alias("lower"),
    pl.col("text").str.to_uppercase().alias("upper"),
    pl.col("text").str.to_titlecase().alias("title"),
    # 替换
    pl.col("text").str.replace("_", " ").alias("replaced"),
    pl.col("text").str.replace_all("_", " ").alias("replaced_all"),
    # 分割
    pl.col("text").str.split("_").alias("split"),
    # 使用正则表达式提取
    pl.col("email").str.extract(r"@(.+)\.").alias("domain"),
    # 检查包含
    pl.col("text").str.contains("POLARS").alias("has_polars"),
    pl.col("text").str.contains("(?i)polars").alias("has_polars_case_insensitive"),
    # 长度
    pl.col("text").str.len_chars().alias("char_count"),
    pl.col("text").str.len_bytes().alias("byte_count"),
    # 开头/结尾
    pl.col("text").str.starts_with("  ").alias("starts_space"),
    pl.col("text").str.ends_with("  ").alias("ends_space")
)
print(result)
```

## 日期和时间操作

```python
import polars as pl
from datetime import datetime, timedelta

df = pl.DataFrame({
    "timestamp": [
        datetime(2024, 1, 15, 10, 30),
        datetime(2024, 2, 20, 14, 45),
        datetime(2024, 3, 25, 9, 15)
    ],
    "value": [100, 200, 300]
})

result = df.with_columns(
    # 提取组件
    pl.col("timestamp").dt.year().alias("year"),
    pl.col("timestamp").dt.month().alias("month"),
    pl.col("timestamp").dt.day().alias("day"),
    pl.col("timestamp").dt.hour().alias("hour"),
    pl.col("timestamp").dt.minute().alias("minute"),
    pl.col("timestamp").dt.weekday().alias("weekday"),  # 0 = 周一
    pl.col("timestamp").dt.week().alias("week_of_year"),
    pl.col("timestamp").dt.quarter().alias("quarter"),

    # 日期运算
    (pl.col("timestamp") + pl.duration(days=7)).alias("plus_week"),
    (pl.col("timestamp") - pl.duration(hours=12)).alias("minus_12h"),

    # 截断到周期
    pl.col("timestamp").dt.truncate("1mo").alias("month_start"),
    pl.col("timestamp").dt.truncate("1w").alias("week_start"),

    # 格式化为字符串
    pl.col("timestamp").dt.strftime("%Y-%m-%d %H:%M").alias("formatted")
)
print(result)
```

## 处理缺失数据

```python
import polars as pl

df = pl.DataFrame({
    "a": [1, None, 3, None, 5],
    "b": [None, 2.0, None, 4.0, 5.0],
    "c": ["x", None, "z", None, "w"]
})

# 检查空值
print("每列的空值计数：")
print(df.null_count())

# 过滤空值
print("\n'a' 不为空的行：")
print(df.filter(pl.col("a").is_not_null()))

# 使用各种策略填充空值
result = df.with_columns(
    # 用常量填充
    pl.col("a").fill_null(0).alias("a_zero"),
    # 用平均值填充
    pl.col("b").fill_null(pl.col("b").mean()).alias("b_mean"),
    # 向前填充（最后一个有效值）
    pl.col("b").fill_null(strategy="forward").alias("b_ffill"),
    # 向后填充
    pl.col("b").fill_null(strategy="backward").alias("b_bfill"),
    # 填充字符串列
    pl.col("c").fill_null("unknown").alias("c_filled")
)
print("\n填充后的 DataFrame：")
print(result)

# 删除有任何空值的行
print("\n删除有任何空值的行：")
print(df.drop_nulls())

# 删除特定列有空值的行
print("\n删除 'a' 或 'b' 有空值的行：")
print(df.drop_nulls(subset=["a", "b"]))

# 将特定值替换为空值
result = df.with_columns(
    pl.when(pl.col("a") == 1).then(None).otherwise(pl.col("a")).alias("a_modified")
)
```

## 与 Pandas 的性能对比

```python
import polars as pl
import pandas as pd
import numpy as np
import time

# 创建测试数据
n_rows = 10_000_000
data = {
    "id": np.random.randint(0, 1000, n_rows),
    "value": np.random.randn(n_rows),
    "category": np.random.choice(["A", "B", "C", "D"], n_rows)
}

# 基准测试：分组求和
print("=== 分组求和基准测试 ===")

# Pandas
df_pandas = pd.DataFrame(data)
start = time.time()
result_pandas = df_pandas.groupby("category")["value"].sum()
pandas_time = time.time() - start
print(f"Pandas: {pandas_time:.3f}s")

# Polars
df_polars = pl.DataFrame(data)
start = time.time()
result_polars = df_polars.group_by("category").agg(pl.col("value").sum())
polars_time = time.time() - start
print(f"Polars: {polars_time:.3f}s")
print(f"加速比：{pandas_time / polars_time:.1f}x")

# 基准测试：过滤 + 分组 + 排序
print("\n=== 复杂查询基准测试 ===")

# Pandas
start = time.time()
result_pandas = (
    df_pandas[df_pandas["value"] > 0]
    .groupby("category")
    .agg({"value": ["sum", "mean", "count"]})
    .sort_values(("value", "sum"), ascending=False)
)
pandas_time = time.time() - start
print(f"Pandas: {pandas_time:.3f}s")

# Polars
start = time.time()
result_polars = (
    df_polars
    .filter(pl.col("value") > 0)
    .group_by("category")
    .agg(
        pl.col("value").sum().alias("sum"),
        pl.col("value").mean().alias("mean"),
        pl.len().alias("count")
    )
    .sort("sum", descending=True)
)
polars_time = time.time() - start
print(f"Polars: {polars_time:.3f}s")
print(f"加速比：{pandas_time / polars_time:.1f}x")
```

典型结果显示 Polars 在分组操作上快 5-20 倍，由于查询优化，复杂查询的加速比更大。

## 性能技巧

### 对大型数据集使用惰性模式

```python
# 好的做法 - 优化的查询计划
result = (
    pl.scan_parquet("large_data/*.parquet")
    .filter(pl.col("date") > "2024-01-01")
    .group_by("category")
    .agg(pl.col("value").sum())
    .collect()
)

# 避免 - 首先加载所有内容
df = pl.read_parquet("large_data/*.parquet")
result = df.filter(pl.col("date") > "2024-01-01")
```

### 使用表达式而不是 apply()

```python
# 好的做法 - 向量化
df.with_columns(
    (pl.col("a") * 2 + pl.col("b")).alias("result")
)

# 避免 - 慢速 Python 循环
df.with_columns(
    pl.struct(["a", "b"]).map_elements(
        lambda x: x["a"] * 2 + x["b"]
    ).alias("result")
)
```

### 使用适当的数据类型

```python
import polars as pl

# 对低基数字符串列使用 Categorical
df = df.with_columns(
    pl.col("category").cast(pl.Categorical)
)

# 使用适当的整数大小
df = df.with_columns(
    pl.col("small_int").cast(pl.Int8),  # -128 到 127
    pl.col("medium_int").cast(pl.Int32),  # -2B 到 2B
    pl.col("large_int").cast(pl.Int64)  # 完整范围
)

# 当不需要 Float64 精度时使用 Float32
df = df.with_columns(
    pl.col("percentage").cast(pl.Float32)
)
```

### 对超大数据集使用流式处理

```python
# 对大于内存的数据集使用流式模式处理
result = (
    pl.scan_parquet("huge_data/*.parquet")
    .filter(pl.col("value") > 100)
    .group_by("category")
    .agg(pl.col("value").sum())
    .collect(streaming=True)  # 启用流式处理
)
```

### 使用 sink_ 方法输出

```python
# 直接写入结果而不将所有内容加载到内存
(
    pl.scan_parquet("input/*.parquet")
    .filter(pl.col("active") == True)
    .sink_parquet("output/filtered.parquet")
)

# Sink 到 CSV
(
    pl.scan_csv("input/*.csv")
    .filter(pl.col("status") == "active")
    .sink_csv("output/filtered.csv")
)
```

### 尽早只选择需要的列

```python
# 好的做法 - 投影下推
result = (
    pl.scan_parquet("data.parquet")
    .select(["id", "value", "category"])  # 只读取这些列
    .filter(pl.col("value") > 100)
    .collect()
)

# 效率较低 - 首先读取所有列
result = (
    pl.scan_parquet("data.parquet")
    .filter(pl.col("value") > 100)
    .select(["id", "value", "category"])
    .collect()
)
```

## 实际案例：销售分析管道

```python
import polars as pl
from datetime import datetime

def analyze_sales(file_path: str) -> dict:
    """使用 Polars 的完整销售分析管道。"""

    # 构建查询计划
    analysis = (
        pl.scan_parquet(file_path)
        # 过滤到最近的数据
        .filter(pl.col("date") >= datetime(2024, 1, 1))
        # 添加计算列
        .with_columns(
            (pl.col("quantity") * pl.col("unit_price")).alias("revenue"),
            pl.col("date").dt.month().alias("month"),
            pl.col("date").dt.weekday().alias("weekday")
        )
    )

    # 月度摘要
    monthly_summary = (
        analysis
        .group_by("month")
        .agg(
            pl.col("revenue").sum().alias("total_revenue"),
            pl.col("revenue").mean().alias("avg_order_value"),
            pl.len().alias("order_count")
        )
        .sort("month")
        .collect()
    )

    # 产品性能和排名
    product_performance = (
        analysis
        .group_by("product")
        .agg(
            pl.col("revenue").sum().alias("total_revenue"),
            pl.col("quantity").sum().alias("total_quantity"),
            pl.len().alias("order_count")
        )
        .with_columns(
            pl.col("total_revenue").rank(descending=True).alias("revenue_rank")
        )
        .sort("revenue_rank")
        .collect()
    )

    # 星期几分析
    dow_analysis = (
        analysis
        .group_by("weekday")
        .agg(
            pl.col("revenue").sum().alias("total_revenue"),
            pl.col("revenue").mean().alias("avg_revenue")
        )
        .sort("weekday")
        .collect()
    )

    return {
        "monthly": monthly_summary,
        "products": product_performance,
        "day_of_week": dow_analysis
    }

# 用法
# results = analyze_sales("sales_data/*.parquet")
# print(results["monthly"])
# print(results["products"])
```

## 常见面试问题

### Polars 中即时求值和惰性求值有什么区别？

**即时求值**（DataFrame）立即执行操作，类似 Pandas。**惰性求值**（LazyFrame）构建在执行前优化的查询计划。使用 `collect()` 执行惰性查询。惰性模式支持谓词下推、投影下推和并行执行优化。

### 为什么 Polars 比 Pandas 快？

- 用 Rust 编写，具有高效的内存管理
- 使用 Apache Arrow 列式格式
- 自动多线程和 SIMD 优化
- 惰性模式的查询优化
- 无 GIL（全局解释器锁）限制
- 尽可能零拷贝操作

### Polars 中的窗口函数如何工作？

窗口函数使用 `over()` 方法定义分区：
```python
pl.col("value").sum().over("category")
```
这计算每个唯一"category"的"value"总和，并将结果广播回每一行。

### Polars 中有哪些不同的连接类型？

- `inner`：只有匹配的行
- `left`：所有左行 + 匹配的右行
- `right`：所有右行 + 匹配的左行
- `full`：两边所有行
- `semi`：左边在右边有匹配的行（无右列）
- `anti`：左边在右边没有匹配的行
- `cross`：笛卡尔积
- `join_asof`：匹配最近的键（用于时间序列）

### 如何在 Polars 中处理缺失数据？

```python
df.fill_null(0)  # 用值填充
df.fill_null(strategy="forward")  # 向前填充
df.fill_null(pl.col("x").mean())  # 用计算值填充
df.drop_nulls()  # 删除有空值的行
df.filter(pl.col("x").is_not_null())  # 过滤掉空值
```

### 什么时候应该使用 scan_ 而不是 read_ 函数？

使用 `scan_`（如 `scan_parquet`、`scan_csv`）用于：
- 想要惰性求值的大文件
- 可以从谓词/投影下推中受益的查询
- 构建优化的查询计划

使用 `read_` 用于：
- 立即执行即可的小文件
- 交互式探索
- 需要将整个数据集加载到内存时

## 延伸阅读

### 官方资源

- [Polars 文档](https://docs.pola.rs/)
- [Polars GitHub 仓库](https://github.com/pola-rs/polars)
- [Polars 用户指南](https://docs.pola.rs/user-guide/)

### 迁移指南

- [从 Pandas 到 Polars](https://docs.pola.rs/user-guide/migration/pandas/)
- [从 SQL 到 Polars](https://docs.pola.rs/user-guide/migration/sql/)

### 相关库

- **DuckDB**：与 Polars 集成良好的基于 SQL 的分析数据库
- **PyArrow**：Python 的 Apache Arrow 实现
- **Dask**：用于大于内存数据集的并行计算库

### 社区

- [Polars Discord](https://discord.gg/4UfP5cfBE7)
- [Stack Overflow - python-polars 标签](https://stackoverflow.com/questions/tagged/python-polars)

---

Polars 代表了 Python 用户 DataFrame 性能的重大飞跃。通过利用 Rust 的速度和 Apache Arrow 的内存效率，它能够处理用 Pandas 不切实际的规模的数据。从惰性求值开始，使用表达式而不是 apply()，让 Polars 自动优化你的查询。
