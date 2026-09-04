---
title: DuckDB 嵌入式分析数据库
description: DuckDB 全面指南 - 快速的进程内分析数据库
track: data
section: analytics-engines
difficulty: intermediate
tags:
  - DuckDB
  - Analytics
  - OLAP
  - SQL
  - Data Engineering
  - Embedded Database
status: imported
origin: old/src/content/docs/data/duckdb.zh.md
divergence: 0.216
issues: []
legacy:
  category: Data
  subcategory: Analytics
  order: 21
  lastUpdated: 2026-01-20
---

DuckDB 是一个进程内 SQL OLAP（联机分析处理）数据库管理系统，专为快速分析查询而设计。它通常被描述为"分析领域的 SQLite"，DuckDB 将嵌入式数据库的简洁性带入数据分析领域，让你可以直接在应用程序中运行复杂的分析查询，而无需单独的数据库服务器。

## 概念解释

### 什么是 DuckDB？

DuckDB 是一个开源的嵌入式分析数据库，运行在应用程序进程内部。与 PostgreSQL 或 MySQL 等传统客户端-服务器数据库不同，DuckDB 不需要单独的安装、配置或管理。你只需导入库就可以开始查询。

**核心特性：**

- **进程内运行**：嵌入在应用程序内部运行
- **列式存储**：针对分析工作负载优化
- **向量化执行**：批量处理数据以获得高性能
- **零依赖**：单一库，无外部依赖
- **ACID 兼容**：完整的事务支持和持久性保证

### 历史背景

DuckDB 由 Mark Raasveldt 和 Hannes Muhleisen 在阿姆斯特丹的 CWI（荷兰国家数学与计算机科学研究中心）创建，于 2019 年首次公开发布。该项目源于对分析数据库系统的研究，旨在填补数据库生态系统中的空白：需要一个简单、便携且快速的分析数据库，可以直接嵌入到应用程序中。

### 为什么选择 DuckDB？它解决什么问题

传统数据库在分析工作负载方面存在以下挑战：

| 挑战 | 传统方案 | DuckDB 解决方案 |
|-----------|---------------------|-----------------|
| 设置复杂 | 安装、配置、维护服务器 | 零配置，导入即用 |
| 数据移动 | ETL 到数据库服务器 | 直接查询文件（CSV、Parquet、JSON） |
| 资源开销 | 独立进程，网络延迟 | 进程内运行，内存高效 |
| 可移植性 | 服务器依赖 | 单文件，跨平台 |
| 小数据分析 | 对 GB 级数据来说过于复杂 | 完美适合本地分析 |

### DuckDB vs. SQLite vs. PostgreSQL

```
┌─────────────────┬──────────────────┬──────────────────┬──────────────────┐
│ 特性            │ DuckDB           │ SQLite           │ PostgreSQL       │
├─────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ 架构            │ 嵌入式，OLAP     │ 嵌入式，OLTP     │ 客户端-服务器    │
│ 存储格式        │ 列式             │ 行式             │ 行式             │
│ 执行模型        │ 向量化           │ 逐行处理         │ 逐行处理         │
│ 最适合          │ 分析             │ 事务             │ 通用             │
│ 并发            │ 单写入者         │ 单写入者         │ 多写入者         │
│ 设置            │ 无需             │ 无需             │ 需要服务器       │
└─────────────────┴──────────────────┴──────────────────┴──────────────────┘
```

## 核心原理

### 列式存储架构

DuckDB 使用列式存储，按列而非按行存储数据。这种架构是其分析性能的基础。

```
行式存储（SQLite、PostgreSQL）：
┌────────┬────────┬────────┐
│ 行 1   │ name   │ age    │ revenue │
│ 行 2   │ name   │ age    │ revenue │
│ 行 3   │ name   │ age    │ revenue │
└────────┴────────┴────────┘

列式存储（DuckDB）：
┌─────────────────────────┐
│ name: [n1, n2, n3, ...] │
│ age:  [a1, a2, a3, ...] │
│ revenue: [r1, r2, r3]   │
└─────────────────────────┘
```

**列式存储的优势：**

1. **压缩效率**：相似值存储在一起，压缩效果更好
2. **缓存优化**：只将相关列加载到内存
3. **SIMD 加速**：对连续数据进行向量化操作
4. **减少 I/O**：完全跳过不相关的列

### 向量化查询执行

DuckDB 实现了向量化执行引擎，操作符以固定大小的批次（向量，默认 2048 个元组）处理数据，而不是逐行处理。

```
传统逐行执行：
for each row:
    应用过滤
    应用投影
    输出行

向量化执行（DuckDB）：
for each vector（2048 行）:
    对整个向量应用过滤
    对整个向量应用投影
    输出向量
```

**性能优势：**

- 减少函数调用开销
- 更好的 CPU 缓存利用率
- 启用 SIMD（单指令多数据）操作
- 最小化分支预测错误

### 推送式查询处理

DuckDB 使用推送式（或数据中心）执行模型，数据流经操作符时无需为每个元组进行虚函数调用的开销。

## 核心要点

### 安装

**Python：**

```bash
# 使用 pip
pip install duckdb

# 使用 conda
conda install python-duckdb -c conda-forge
```

**R：**

```r
# 从 CRAN
install.packages("duckdb")
```

**CLI：**

```bash
# macOS 使用 Homebrew
brew install duckdb

# Linux（下载二进制文件）
wget https://github.com/duckdb/duckdb/releases/latest/download/duckdb_cli-linux-amd64.zip
unzip duckdb_cli-linux-amd64.zip

# Windows（从发布页面下载）
# https://github.com/duckdb/duckdb/releases
```

**Node.js：**

```bash
npm install duckdb
```

### 数据库连接

DuckDB 支持内存数据库和持久化数据库：

```python
import duckdb

# 内存数据库（默认）
con = duckdb.connect()
# 或明确指定
con = duckdb.connect(database=':memory:')

# 持久化数据库（数据保存到文件）
con = duckdb.connect('my_database.duckdb')

# 只读连接
con = duckdb.connect('my_database.duckdb', read_only=True)
```

### 数据导入和导出

DuckDB 擅长直接读取各种文件格式：

**CSV 文件：**

```sql
-- 直接读取 CSV
SELECT * FROM 'data.csv';

-- 带选项读取
SELECT * FROM read_csv('data.csv',
    header = true,
    delim = ',',
    columns = {'id': 'INTEGER', 'name': 'VARCHAR'}
);

-- 使用通配符读取多个文件
SELECT * FROM 'data/*.csv';

-- 从 CSV 创建表
CREATE TABLE sales AS SELECT * FROM 'sales.csv';
```

**Parquet 文件：**

```sql
-- 直接读取 Parquet
SELECT * FROM 'data.parquet';

-- 从 S3 读取（需要 httpfs 扩展）
SELECT * FROM 's3://bucket/data.parquet';

-- 写入 Parquet
COPY (SELECT * FROM sales) TO 'output.parquet' (FORMAT PARQUET);
```

**JSON 文件：**

```sql
-- 读取 JSON
SELECT * FROM read_json('data.json');

-- 读取换行分隔的 JSON
SELECT * FROM read_json('data.ndjson', format = 'newline_delimited');
```

**导出数据：**

```sql
-- 导出到 CSV
COPY sales TO 'sales.csv' (HEADER, DELIMITER ',');

-- 导出到带压缩的 Parquet
COPY sales TO 'sales.parquet' (FORMAT PARQUET, COMPRESSION 'ZSTD');

-- 导出查询结果
COPY (SELECT * FROM sales WHERE year = 2024) TO 'sales_2024.csv';
```

### SQL 扩展和特性

DuckDB 实现了丰富的 SQL 方言，带有许多便捷扩展：

**友好的 SQL 语法：**

```sql
-- 在 GROUP BY 和 HAVING 中使用列别名
SELECT category, SUM(amount) AS total
FROM sales
GROUP BY category
HAVING total > 1000;

-- 字符串切片
SELECT 'DuckDB'[1:4];  -- 'Duck'

-- 列表推导式
SELECT [x * x FOR x IN range(10)];  -- [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

-- 点号表示法的函数链式调用
SELECT ('hello world').upper().replace(' ', '_');  -- 'HELLO_WORLD'

-- SELECT 中的 EXCLUDE 和 REPLACE
SELECT * EXCLUDE (sensitive_column) FROM users;
SELECT * REPLACE (UPPER(name) AS name) FROM users;
```

**复杂数据类型：**

```sql
-- 列表
SELECT [1, 2, 3] AS my_list;
SELECT list[1] FROM (SELECT [1, 2, 3] AS list);  -- 第一个元素（1 索引）
SELECT list[-1] FROM (SELECT [1, 2, 3] AS list); -- 最后一个元素

-- 结构体
SELECT {'name': 'Alice', 'age': 30} AS person;
SELECT person.name FROM (SELECT {'name': 'Alice', 'age': 30} AS person);

-- 映射
SELECT MAP(['key1', 'key2'], ['value1', 'value2']);

-- 展开列表
SELECT UNNEST([1, 2, 3]) AS value;
```

**窗口函数：**

```sql
-- 累计总和
SELECT
    date,
    amount,
    SUM(amount) OVER (ORDER BY date) AS running_total
FROM sales;

-- 排名
SELECT
    product,
    revenue,
    RANK() OVER (ORDER BY revenue DESC) AS rank,
    DENSE_RANK() OVER (ORDER BY revenue DESC) AS dense_rank,
    ROW_NUMBER() OVER (ORDER BY revenue DESC) AS row_num
FROM products;

-- 移动平均
SELECT
    date,
    value,
    AVG(value) OVER (
        ORDER BY date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS moving_avg_7d
FROM metrics;
```

### 扩展

DuckDB 的功能可以通过扩展来增强：

```sql
-- 安装和加载扩展
INSTALL httpfs;
LOAD httpfs;

-- 常用扩展：
-- httpfs: HTTP 和 S3 文件访问
-- parquet: Parquet 文件支持（内置）
-- json: JSON 支持（内置）
-- spatial: 地理空间函数
-- postgres: PostgreSQL 集成
-- mysql: MySQL 集成
-- sqlite: SQLite 集成
-- excel: Excel 文件支持
-- fts: 全文搜索
-- icu: 国际化组件

-- 列出已安装的扩展
SELECT * FROM duckdb_extensions();
```

**S3 访问示例：**

```sql
INSTALL httpfs;
LOAD httpfs;

-- 配置 S3 凭证
SET s3_region = 'us-east-1';
SET s3_access_key_id = 'your-access-key';
SET s3_secret_access_key = 'your-secret-key';

-- 直接查询 S3
SELECT * FROM 's3://my-bucket/data/*.parquet';
```

## 代码示例

### Python 集成

```python
import duckdb
import pandas as pd

# 创建连接
con = duckdb.connect()

# 基本查询
result = con.sql("SELECT 42 AS answer").fetchall()
print(result)  # [(42,)]

# 直接查询 Pandas DataFrame
df = pd.DataFrame({
    'product': ['A', 'B', 'C', 'A', 'B'],
    'quantity': [10, 20, 15, 30, 25],
    'price': [100, 200, 150, 100, 200]
})

# DuckDB 可以通过名称查询 DataFrame
result = con.sql("""
    SELECT
        product,
        SUM(quantity) AS total_qty,
        SUM(quantity * price) AS revenue
    FROM df
    GROUP BY product
    ORDER BY revenue DESC
""").df()

print(result)

# 将结果转换为各种格式
query = "SELECT * FROM df WHERE quantity > 15"
con.sql(query).fetchall()      # 元组列表
con.sql(query).df()            # Pandas DataFrame
con.sql(query).pl()            # Polars DataFrame
con.sql(query).arrow()         # PyArrow Table
con.sql(query).fetchnumpy()    # NumPy 数组
```

### 处理 Parquet 文件

```python
import duckdb

con = duckdb.connect()

# 读取和分析 Parquet 文件
con.sql("""
    SELECT
        date_trunc('month', order_date) AS month,
        COUNT(*) AS order_count,
        SUM(total_amount) AS revenue
    FROM 'orders/*.parquet'
    WHERE order_date >= '2024-01-01'
    GROUP BY 1
    ORDER BY 1
""").show()

# 从 Parquet 创建表
con.sql("""
    CREATE TABLE orders AS
    SELECT * FROM 'orders/*.parquet'
""")

# 导出聚合数据
con.sql("""
    COPY (
        SELECT
            customer_id,
            COUNT(*) AS order_count,
            SUM(total_amount) AS lifetime_value
        FROM orders
        GROUP BY customer_id
    ) TO 'customer_summary.parquet' (FORMAT PARQUET)
""")
```

### Pandas 和 Polars 集成

```python
import duckdb
import pandas as pd
import polars as pl

# 创建示例 DataFrame
pandas_df = pd.DataFrame({
    'id': range(1000000),
    'value': range(1000000)
})

polars_df = pl.DataFrame({
    'id': range(1000000),
    'category': ['A', 'B', 'C'] * 333333 + ['A']
})

# 同时查询两个 DataFrame
result = duckdb.sql("""
    SELECT
        p.category,
        AVG(d.value) AS avg_value,
        COUNT(*) AS count
    FROM pandas_df d
    JOIN polars_df p ON d.id = p.id
    GROUP BY p.category
""").df()

print(result)

# 将 DataFrame 注册为虚拟表
con = duckdb.connect()
con.register('my_table', pandas_df)

# 现在可以通过名称查询
con.sql("SELECT * FROM my_table LIMIT 5").show()
```

### 持久化数据库示例

```python
import duckdb

# 创建持久化数据库
con = duckdb.connect('analytics.duckdb')

# 创建模式和表
con.sql("""
    CREATE SCHEMA IF NOT EXISTS sales;

    CREATE TABLE IF NOT EXISTS sales.transactions (
        transaction_id INTEGER PRIMARY KEY,
        customer_id INTEGER,
        product_id INTEGER,
        quantity INTEGER,
        unit_price DECIMAL(10,2),
        transaction_date DATE
    );

    CREATE TABLE IF NOT EXISTS sales.products (
        product_id INTEGER PRIMARY KEY,
        name VARCHAR,
        category VARCHAR,
        cost DECIMAL(10,2)
    );
""")

# 插入数据
con.sql("""
    INSERT INTO sales.transactions VALUES
        (1, 101, 1, 2, 29.99, '2024-01-15'),
        (2, 102, 2, 1, 49.99, '2024-01-15'),
        (3, 101, 1, 1, 29.99, '2024-01-16');
""")

# 带连接的查询
con.sql("""
    SELECT
        t.transaction_date,
        p.category,
        SUM(t.quantity * t.unit_price) AS revenue
    FROM sales.transactions t
    JOIN sales.products p ON t.product_id = p.product_id
    GROUP BY 1, 2
    ORDER BY 1, 2
""").show()

# 关闭连接
con.close()
```

### CLI 使用

```bash
# 启动交互式 CLI（内存数据库）
duckdb

# 连接到持久化数据库
duckdb my_database.duckdb

# 直接执行查询
duckdb -c "SELECT * FROM 'data.csv' LIMIT 10"

# 从标准输入读取
cat data.csv | duckdb -c "SELECT * FROM read_csv('/dev/stdin')"

# 输出格式
duckdb -c "SELECT * FROM 'data.parquet'" -csv     # CSV 输出
duckdb -c "SELECT * FROM 'data.parquet'" -json    # JSON 输出
duckdb -c "SELECT * FROM 'data.parquet'" -markdown # Markdown 表格
```

**CLI 点命令：**

```sql
-- 显示帮助
.help

-- 更改输出模式
.mode markdown
.mode csv
.mode json

-- 输出到文件
.output results.csv
SELECT * FROM sales;
.output  -- 重置为标准输出

-- 显示表
.tables

-- 描述表
.schema sales

-- 导入 CSV
.import data.csv my_table

-- 查询计时
.timer on
SELECT COUNT(*) FROM large_table;
.timer off

-- 执行 SQL 文件
.read queries.sql
```

### R 集成

```r
library(duckdb)
library(dplyr)

# 创建连接
con <- dbConnect(duckdb())

# 注册数据框
duckdb_register(con, "mtcars_db", mtcars)

# 使用 SQL 查询
dbGetQuery(con, "
    SELECT cyl, AVG(mpg) as avg_mpg, COUNT(*) as count
    FROM mtcars_db
    GROUP BY cyl
    ORDER BY cyl
")

# 使用 dplyr 语法配合 DuckDB 后端
tbl(con, "mtcars_db") %>%
    filter(hp > 100) %>%
    group_by(cyl) %>%
    summarise(
        avg_mpg = mean(mpg),
        avg_hp = mean(hp),
        count = n()
    ) %>%
    collect()

# 直接读取 Parquet 文件
tbl(con, "read_parquet('data/*.parquet')") %>%
    filter(year >= 2024) %>%
    summarise(total = sum(amount)) %>%
    collect()

# 断开连接
dbDisconnect(con, shutdown = TRUE)
```

## 最佳实践

### 1. 高效使用文件格式

```python
# 推荐：直接查询 Parquet，无需加载到内存
result = duckdb.sql("""
    SELECT * FROM 'large_file.parquet'
    WHERE date >= '2024-01-01'
""").df()

# 避免：先将整个文件加载到 Pandas
import pandas as pd
df = pd.read_parquet('large_file.parquet')  # 加载所有数据
result = df[df['date'] >= '2024-01-01']
```

### 2. 利用谓词下推

```python
# 推荐：在查询中尽早过滤
duckdb.sql("""
    SELECT category, SUM(amount)
    FROM 'sales/*.parquet'
    WHERE year = 2024  -- 过滤条件下推到文件读取
    GROUP BY category
""")

# 避免：尽可能避免在聚合后过滤
duckdb.sql("""
    SELECT * FROM (
        SELECT year, category, SUM(amount) as total
        FROM 'sales/*.parquet'
        GROUP BY year, category
    )
    WHERE year = 2024  -- 效率较低
""")
```

### 3. 使用适当的数据类型

```sql
-- 推荐：使用适当的类型
CREATE TABLE events (
    event_id INTEGER,           -- 如果 INT 范围足够，不用 BIGINT
    event_date DATE,            -- 日期不要用 VARCHAR
    amount DECIMAL(10,2),       -- 金额使用精确类型
    category VARCHAR(50),       -- 已知长度时使用有界长度
    is_active BOOLEAN           -- 布尔值不要用 INTEGER
);

-- 避免：过于通用的类型
CREATE TABLE events (
    event_id BIGINT,            -- 不需要时浪费空间
    event_date VARCHAR,         -- 丢失日期功能
    amount DOUBLE,              -- 金额使用浮点数
    category TEXT,              -- 不需要时使用无界类型
    is_active INTEGER           -- 语义不清
);
```

### 4. 连接管理

```python
# 推荐：使用上下文管理器自动清理
import duckdb

with duckdb.connect('my_db.duckdb') as con:
    result = con.sql("SELECT * FROM sales").df()
# 连接自动关闭

# 推荐：重用连接
con = duckdb.connect()
for file in files:
    con.sql(f"SELECT * FROM '{file}'").show()
con.close()

# 避免：重复创建新连接
for file in files:
    con = duckdb.connect()  # 低效
    con.sql(f"SELECT * FROM '{file}'").show()
    con.close()
```

### 5. 对重复查询使用预处理语句

```python
import duckdb

con = duckdb.connect()

# 创建表
con.sql("CREATE TABLE users (id INT, name VARCHAR)")
con.sql("INSERT INTO users VALUES (1, 'Alice'), (2, 'Bob')")

# 推荐：使用参数化查询
user_id = 1
result = con.execute("SELECT * FROM users WHERE id = ?", [user_id]).fetchall()

# 也支持命名参数
result = con.execute(
    "SELECT * FROM users WHERE id = $user_id",
    {"user_id": 1}
).fetchall()
```

## 常见陷阱

### 1. 将 DuckDB 当作 OLTP 数据库使用

```python
# 错误：使用 DuckDB 进行高频单行操作
for record in records:
    con.sql(f"INSERT INTO table VALUES ({record})")  # 非常慢

# 正确：批量插入操作
con.sql("INSERT INTO table SELECT * FROM df")

# 或使用 COPY 进行批量加载
con.sql("COPY table FROM 'data.csv'")
```

### 2. 忽略内存限制

```python
# 错误：处理大文件时不考虑内存
result = duckdb.sql("SELECT * FROM 'huge_100gb_file.parquet'").df()

# 正确：设置内存限制并分块处理
con = duckdb.connect()
con.sql("SET memory_limit = '4GB'")
con.sql("SET threads = 4")

# 或使用流式/分页处理
con.sql("""
    SELECT * FROM 'huge_file.parquet'
    LIMIT 1000000 OFFSET 0
""")
```

### 3. 不使用扩展

```python
# 错误：复杂的 S3 访问变通方案
import boto3
# 先下载文件，然后查询...

# 正确：使用 httpfs 扩展
import duckdb
con = duckdb.connect()
con.sql("INSTALL httpfs; LOAD httpfs;")
con.sql("SET s3_region = 'us-east-1'")
result = con.sql("SELECT * FROM 's3://bucket/data.parquet'")
```

### 4. 低效的 DataFrame 操作

```python
import pandas as pd
import duckdb

df = pd.DataFrame({'a': range(1000000), 'b': range(1000000)})

# 错误：不必要地来回转换
result = duckdb.sql("SELECT * FROM df").df()
result = result[result['a'] > 500000]  # 在 Pandas 中过滤

# 正确：所有操作都在 DuckDB 中完成
result = duckdb.sql("""
    SELECT * FROM df WHERE a > 500000
""").df()
```

### 5. 并发写入尝试

```python
# 错误：多个写入者访问同一数据库
import threading

def writer(db_path, data):
    con = duckdb.connect(db_path)  # 并发写入会失败
    con.sql(f"INSERT INTO table VALUES {data}")
    con.close()

# 正确：单写入者模式或使用内存数据库最后写入
con = duckdb.connect('data.duckdb')
# 所有写入通过单一连接
con.sql("INSERT INTO table SELECT * FROM source1")
con.sql("INSERT INTO table SELECT * FROM source2")
con.close()
```

## 性能考量

### 何时使用 DuckDB

**理想用例：**

- 本地数据分析（GB 到低 TB 级别）
- 对文件的即席查询（CSV、Parquet、JSON）
- 数据转换和 ETL 管道
- Jupyter notebook 分析
- 应用程序中的嵌入式分析
- CLI 数据探索

**考虑替代方案的情况：**

- 高并发 OLTP 工作负载（使用 PostgreSQL）
- 多用户并发写入（使用传统 RDBMS）
- 超大规模（100+ TB）分布式查询（使用 Spark、Trino）
- 实时流处理（使用 Kafka、Flink）

### 内存配置

```sql
-- 检查当前设置
SELECT * FROM duckdb_settings() WHERE name LIKE '%memory%' OR name LIKE '%thread%';

-- 设置内存限制
SET memory_limit = '8GB';

-- 设置线程数
SET threads = 4;

-- 每线程内存建议：
-- 最小：每线程 125 MB
-- 聚合密集型：每线程约 5 GB
-- 连接密集型：每线程约 10 GB
```

### 查询优化技巧

```sql
-- 使用 EXPLAIN 理解查询计划
EXPLAIN SELECT * FROM sales WHERE year = 2024;

-- 使用 EXPLAIN ANALYZE 获取实际执行统计
EXPLAIN ANALYZE SELECT * FROM sales WHERE year = 2024;

-- 为频繁过滤的列创建索引（持久化表）
CREATE INDEX idx_sales_year ON sales(year);

-- 使用 SUMMARIZE 快速数据分析
SUMMARIZE sales;

-- 按常用过滤列对 Parquet 文件进行分区
COPY (SELECT * FROM sales)
TO 'sales' (FORMAT PARQUET, PARTITION_BY (year, month));
```

### 性能比较

```python
import duckdb
import pandas as pd
import time

# 生成测试数据
n = 10_000_000
df = pd.DataFrame({
    'id': range(n),
    'category': ['A', 'B', 'C', 'D'] * (n // 4),
    'value': range(n)
})

# Pandas 聚合
start = time.time()
result_pandas = df.groupby('category')['value'].sum()
pandas_time = time.time() - start

# DuckDB 聚合
start = time.time()
result_duckdb = duckdb.sql("""
    SELECT category, SUM(value)
    FROM df
    GROUP BY category
""").df()
duckdb_time = time.time() - start

print(f"Pandas: {pandas_time:.2f}s")
print(f"DuckDB: {duckdb_time:.2f}s")
# DuckDB 在分析查询上通常快 5-10 倍
```

## 实战场景

### 场景 1：日志分析

```python
import duckdb

con = duckdb.connect()

# 分析 Web 服务器日志
con.sql("""
    CREATE VIEW logs AS
    SELECT
        regexp_extract(line, '(\d+\.\d+\.\d+\.\d+)', 1) AS ip,
        regexp_extract(line, '\[([^\]]+)\]', 1) AS timestamp,
        regexp_extract(line, '"(\w+) ([^"]+)"', 1) AS method,
        regexp_extract(line, '"(\w+) ([^"]+)"', 2) AS path,
        CAST(regexp_extract(line, '" (\d+) ', 1) AS INTEGER) AS status,
        CAST(regexp_extract(line, ' (\d+)$', 1) AS INTEGER) AS bytes
    FROM read_csv('access.log', columns={'line': 'VARCHAR'}, header=false)
""")

# 请求数最多的 IP
con.sql("""
    SELECT ip, COUNT(*) as requests
    FROM logs
    GROUP BY ip
    ORDER BY requests DESC
    LIMIT 10
""").show()

# 按小时统计错误率
con.sql("""
    SELECT
        date_trunc('hour', strptime(timestamp, '%d/%b/%Y:%H:%M:%S %z')) AS hour,
        COUNT(*) FILTER (WHERE status >= 400) * 100.0 / COUNT(*) AS error_rate
    FROM logs
    GROUP BY 1
    ORDER BY 1
""").show()
```

### 场景 2：ETL 管道

```python
import duckdb

def etl_pipeline():
    con = duckdb.connect()

    # 提取：从多个源读取
    con.sql("""
        CREATE TABLE raw_orders AS
        SELECT * FROM 's3://data-lake/orders/*.parquet'
        WHERE order_date >= '2024-01-01'
    """)

    con.sql("""
        CREATE TABLE raw_customers AS
        SELECT * FROM read_csv('customers.csv')
    """)

    # 转换：清洗和聚合
    con.sql("""
        CREATE TABLE transformed AS
        SELECT
            o.order_id,
            o.order_date,
            c.customer_segment,
            o.quantity * o.unit_price AS revenue,
            CASE
                WHEN o.quantity * o.unit_price > 1000 THEN 'High'
                WHEN o.quantity * o.unit_price > 100 THEN 'Medium'
                ELSE 'Low'
            END AS order_tier
        FROM raw_orders o
        JOIN raw_customers c ON o.customer_id = c.customer_id
        WHERE o.status != 'cancelled'
    """)

    # 加载：写入输出
    con.sql("""
        COPY (
            SELECT
                date_trunc('month', order_date) AS month,
                customer_segment,
                order_tier,
                COUNT(*) AS order_count,
                SUM(revenue) AS total_revenue
            FROM transformed
            GROUP BY 1, 2, 3
        ) TO 'output/monthly_summary.parquet' (FORMAT PARQUET)
    """)

    con.close()

etl_pipeline()
```

### 场景 3：数据质量检查

```python
import duckdb

def run_data_quality_checks(table_name: str):
    con = duckdb.connect()

    checks = []

    # 空值检查
    null_check = con.sql(f"""
        SELECT
            column_name,
            COUNT(*) FILTER (WHERE value IS NULL) AS null_count,
            COUNT(*) AS total_count,
            ROUND(COUNT(*) FILTER (WHERE value IS NULL) * 100.0 / COUNT(*), 2) AS null_pct
        FROM (
            SELECT column_name, value
            FROM (SELECT * FROM {table_name})
            UNPIVOT (value FOR column_name IN (*))
        )
        GROUP BY column_name
        HAVING null_count > 0
    """).df()
    checks.append(('空值', null_check))

    # 重复检查（假设有 id 列）
    dup_check = con.sql(f"""
        SELECT id, COUNT(*) AS occurrences
        FROM {table_name}
        GROUP BY id
        HAVING COUNT(*) > 1
        LIMIT 10
    """).df()
    checks.append(('重复值', dup_check))

    # 统计摘要
    summary = con.sql(f"SUMMARIZE {table_name}").df()
    checks.append(('统计摘要', summary))

    con.close()
    return checks
```

### 场景 4：Jupyter 中的交互式分析

```python
# 在 Jupyter Notebook 中
import duckdb
import pandas as pd

# 启用自动结果显示
%load_ext duckdb.magic

# 现在可以直接在单元格中使用 SQL
%%duckdb
SELECT
    strftime(order_date, '%Y-%m') AS month,
    product_category,
    SUM(amount) AS revenue
FROM 'sales.parquet'
GROUP BY 1, 2
PIVOT (SUM(revenue) FOR product_category IN ('Electronics', 'Clothing', 'Food'))
ORDER BY month
```

## 面试要点

### 概念问题

**问：什么是 DuckDB，它与 SQLite 有什么不同？**

答：DuckDB 是一个进程内 OLAP（分析型）数据库，而 SQLite 是一个进程内 OLTP（事务型）数据库。主要区别：
- DuckDB 使用列式存储；SQLite 使用行式存储
- DuckDB 采用向量化执行，针对分析查询优化
- DuckDB 擅长聚合和扫描；SQLite 擅长点查询和事务
- DuckDB 针对读密集型分析工作负载优化；SQLite 针对写密集型事务工作负载优化

**问：解释 DuckDB 中的向量化查询执行。**

答：向量化执行以固定大小的批次（向量，默认 2048 个元组）处理数据，而不是逐行处理。优势包括：
- 减少函数调用开销
- 更好的 CPU 缓存利用率
- 启用 SIMD 操作
- 减少解释开销
这使得 DuckDB 在分析查询上比逐行执行快得多。

**问：什么时候选择 DuckDB 而不是 Spark 或 Trino？**

答：选择 DuckDB 当：
- 数据适合单机（GB 到低 TB 级别）
- 需要快速本地分析，无需集群设置
- 在应用程序中嵌入分析
- 在 Jupyter notebook 或脚本中工作
- 直接分析文件，无需 ETL

选择 Spark/Trino 当：
- 数据超出单机容量
- 需要分布式处理
- 需要高并发
- 已有集群基础设施

### 实践问题

**问：如何优化慢的 DuckDB 查询？**

答：优化步骤：
1. 使用 `EXPLAIN ANALYZE` 理解查询计划
2. 确保过滤条件尽早应用（谓词下推）
3. 使用 `SELECT * FROM duckdb_settings()` 检查内存设置
4. 使用适当的数据类型
5. 对持久化表，在过滤列上创建索引
6. 按常用过滤列对 Parquet 文件分区
7. 根据工作负载调整线程和内存限制

**问：编写查询找出每个类别中收入前 3 的产品。**

```sql
WITH ranked AS (
    SELECT
        category,
        product_name,
        SUM(quantity * price) AS revenue,
        RANK() OVER (PARTITION BY category ORDER BY SUM(quantity * price) DESC) AS rank
    FROM sales
    GROUP BY category, product_name
)
SELECT category, product_name, revenue
FROM ranked
WHERE rank <= 3
ORDER BY category, rank;
```

## 延伸阅读

### 官方资源

- [DuckDB 文档](https://duckdb.org/docs/) - 全面的官方文档
- [DuckDB GitHub 仓库](https://github.com/duckdb/duckdb) - 源代码和问题追踪
- [DuckDB 博客](https://duckdb.org/news/) - 发布说明和技术文章

### 教程和指南

- [DuckDB Python API 指南](https://duckdb.org/docs/api/python/overview) - Python 集成详情
- [DuckDB R API 指南](https://duckdb.org/docs/api/r) - R 与 dplyr 集成
- [DuckDB CLI 文档](https://duckdb.org/docs/api/cli/overview) - 命令行界面

### 社区资源

- [DuckDB Discord](https://discord.duckdb.org/) - 社区聊天和支持
- [DuckDB Twitter/X](https://twitter.com/daborosgram) - 团队更新
- [Awesome DuckDB](https://github.com/davidgasquez/awesome-duckdb) - 精选资源列表

### 相关技术

- [Apache Parquet](https://parquet.apache.org/) - 列式文件格式
- [Apache Arrow](https://arrow.apache.org/) - 内存列式格式
- [Polars](https://pola.rs/) - 快速 DataFrame 库（使用类似概念）

通过理解 DuckDB 的架构和功能，你可以利用其强大能力处理高效的分析工作负载，同时避免可能影响性能的常见陷阱。
