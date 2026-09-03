---
title: "Polars: High-Performance DataFrame Library"
description: Explore Polars as a high-performance alternative to Pandas for data processing
track: datascience
section: python-stack
difficulty: intermediate
tags:
  - Polars
  - DataFrame
  - Rust
  - Data Processing
status: imported
origin: old/src/content/docs/data/polars.en.md
divergence: 0.2
issues: []
legacy:
  category: Data
  subcategory: Data Processing
  order: 18
  lastUpdated: 2026-01-07
---

Polars is a blazingly fast DataFrame library implemented in Rust, designed from the ground up for performance. It offers both eager and lazy execution modes, multi-threading, SIMD optimizations, and a powerful expression API. Whether you're working with millions or billions of rows, Polars provides a modern alternative to Pandas with significantly better performance.

## Why Polars?

### Key Advantages Over Pandas

1. **Speed**: Written in Rust with zero-copy Arrow memory format, Polars is often 10-100x faster than Pandas
2. **Memory Efficiency**: Uses Apache Arrow columnar format, reducing memory usage and enabling zero-copy operations
3. **Lazy Evaluation**: Build query plans that are optimized before execution
4. **Parallel Processing**: Automatically parallelizes operations across CPU cores
5. **Consistent API**: Expressions work the same way in both eager and lazy modes
6. **No Index**: Unlike Pandas, Polars has no index, leading to simpler and more predictable behavior

```python
import polars as pl

# Check Polars version
print(pl.__version__)

# Create a simple DataFrame
df = pl.DataFrame({
    "name": ["Alice", "Bob", "Charlie", "David"],
    "age": [25, 30, 35, 28],
    "city": ["New York", "London", "Paris", "Tokyo"],
    "salary": [75000, 85000, 90000, 70000]
})
print(df)
```

## Polars vs Pandas: A Detailed Comparison

Understanding the differences between Polars and Pandas helps you choose the right tool for your use case.

### Feature Comparison

| Feature | Polars | Pandas |
|---------|--------|--------|
| Implementation Language | Rust | Python/C |
| Memory Format | Apache Arrow | NumPy |
| Lazy Evaluation | Yes | No |
| Multi-threading | Built-in | Limited |
| Index | No | Yes |
| Missing Values | null (Arrow) | NaN/None |
| String Type | Native UTF-8 | Object/String |
| Query Optimization | Automatic | Manual |

### Syntax Comparison

```python
import polars as pl
import pandas as pd

# =====================
# Creating DataFrames
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
# Filtering
# =====================

# Pandas
result_pandas = df_pandas[df_pandas["a"] > 2]

# Polars
result_polars = df_polars.filter(pl.col("a") > 2)

# =====================
# GroupBy Aggregation
# =====================

# Pandas
result_pandas = df_pandas.groupby("category")["b"].sum()

# Polars
result_polars = df_polars.group_by("category").agg(pl.col("b").sum())

# =====================
# Multiple Operations
# =====================

# Pandas
result_pandas = (
    df_pandas[df_pandas["a"] > 1]
    .groupby("category")
    .agg({"b": "sum", "a": "mean"})
)

# Polars (more explicit and parallelizable)
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

### When to Use Each

**Use Polars when:**
- Working with large datasets (millions+ rows)
- Performance is critical
- You need parallel processing
- Memory efficiency matters
- Building data pipelines

**Use Pandas when:**
- Working with small datasets
- Extensive ecosystem integration is needed
- Legacy code compatibility is required
- Specific Pandas-only features are needed

## Core Concepts: Eager vs Lazy Evaluation

### Eager Mode (DataFrame)

Eager mode executes operations immediately, similar to Pandas. Use this for interactive exploration and smaller datasets.

```python
import polars as pl

# Eager execution - results computed immediately
df = pl.DataFrame({
    "id": [1, 2, 3, 4, 5],
    "value": [10, 20, 30, 40, 50],
    "category": ["A", "B", "A", "B", "A"]
})

# Operations execute right away
result = df.filter(pl.col("value") > 20).select(["id", "value"])
print(result)
```

### Lazy Mode (LazyFrame)

Lazy mode builds a query plan that gets optimized before execution. This is the recommended approach for production workloads.

```python
import polars as pl

# Lazy execution - build a query plan
lf = pl.LazyFrame({
    "id": [1, 2, 3, 4, 5],
    "value": [10, 20, 30, 40, 50],
    "category": ["A", "B", "A", "B", "A"]
})

# Build the query plan (nothing executed yet)
query = (
    lf.filter(pl.col("value") > 20)
    .group_by("category")
    .agg(pl.col("value").sum().alias("total"))
)

# View the query plan
print(query.explain())

# Execute with collect()
result = query.collect()
print(result)

# Convert eager DataFrame to lazy
df = pl.DataFrame({"a": [1, 2, 3]})
lazy_df = df.lazy()

# Convert lazy to eager
eager_df = lazy_df.collect()
```

### Benefits of Lazy Evaluation

1. **Query Optimization**: Polars optimizes the entire query plan
2. **Predicate Pushdown**: Filters are pushed down to read operations
3. **Projection Pushdown**: Only required columns are loaded
4. **Parallel Execution**: Operations are parallelized automatically

```python
# Polars optimizes this entire query
result = (
    pl.scan_parquet("large_file.parquet")  # Lazy read
    .filter(pl.col("date") > "2024-01-01")  # Pushed to file read
    .select(["id", "value", "date"])  # Only these columns loaded
    .group_by("id")
    .agg(pl.col("value").sum())
    .collect()
)
```

## Expressions: The Heart of Polars

Expressions are the building blocks of Polars operations. They describe computations on columns without executing them immediately.

### Basic Expressions

```python
import polars as pl

df = pl.DataFrame({
    "a": [1, 2, 3, 4, 5],
    "b": [10, 20, 30, 40, 50],
    "c": ["x", "y", "x", "y", "x"]
})

# Column selection
df.select(pl.col("a"))
df.select(pl.col("a", "b"))
df.select(pl.col("*"))  # All columns
df.select(pl.exclude("c"))  # All except "c"

# Literal values
df.select(pl.lit(42).alias("constant"))

# Arithmetic operations
df.select(
    pl.col("a"),
    (pl.col("a") + pl.col("b")).alias("sum"),
    (pl.col("a") * 2).alias("doubled"),
    (pl.col("b") / pl.col("a")).alias("ratio")
)

# String expressions
df.select(
    pl.col("c").str.to_uppercase().alias("upper"),
    pl.col("c").str.len_chars().alias("length")
)
```

### Expression Contexts

Expressions are used in different contexts that determine their behavior:

```python
import polars as pl

df = pl.DataFrame({
    "name": ["Alice", "Bob", "Charlie"],
    "height": [165, 180, 175],
    "weight": [55, 80, 70]
})

# SELECT context - choose and transform columns
df.select(
    pl.col("name"),
    pl.col("height").mean().alias("avg_height")
)

# WITH_COLUMNS context - add new columns while keeping existing ones
df.with_columns(
    (pl.col("weight") / (pl.col("height") / 100) ** 2).alias("bmi")
)

# FILTER context - filter rows based on conditions
df.filter(pl.col("height") > 170)

# GROUP_BY context - aggregate within groups
df.group_by("name").agg(
    pl.col("height").mean(),
    pl.col("weight").sum()
)
```

### Conditional Expressions

```python
import polars as pl

df = pl.DataFrame({
    "value": [1, 2, 3, 4, 5],
    "category": ["A", "B", "A", "B", "A"]
})

# when-then-otherwise (like SQL CASE)
df.with_columns(
    pl.when(pl.col("value") > 3)
    .then(pl.lit("high"))
    .otherwise(pl.lit("low"))
    .alias("level")
)

# Multiple conditions
df.with_columns(
    pl.when(pl.col("value") > 4).then(pl.lit("high"))
    .when(pl.col("value") > 2).then(pl.lit("medium"))
    .otherwise(pl.lit("low"))
    .alias("tier")
)

# Nested conditions
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

### Chaining Expressions

```python
import polars as pl

df = pl.DataFrame({
    "text": ["  Hello World  ", "  POLARS  ", "  Data  "],
    "value": [1, 2, 3]
})

# Chain multiple operations
result = df.select(
    pl.col("text")
    .str.strip_chars()
    .str.to_lowercase()
    .str.replace(" ", "_")
    .alias("processed")
)
print(result)
```

## Reading and Writing Data

### CSV Files

```python
import polars as pl

# Eager reading - loads entire file into memory
df = pl.read_csv(
    "data/sales.csv",
    has_header=True,
    columns=["date", "product", "quantity", "price"],
    dtypes={"product": pl.Categorical, "quantity": pl.Int32},
    try_parse_dates=True
)

# Lazy reading - defers execution for optimization
lf = pl.scan_csv("data/sales.csv")
result = lf.filter(pl.col("quantity") > 10).collect()

# Write CSV
df.write_csv("output.csv")

# Write with options
df.write_csv("output.csv", separator=",", include_header=True)
```

### Parquet Files

Parquet is the recommended format for large datasets due to its columnar storage and compression.

```python
import polars as pl

# Write DataFrame to Parquet
df = pl.DataFrame({
    "id": [1, 2, 3, 4],
    "name": ["Alice", "Bob", "Charlie", "David"],
    "score": [95.5, 87.2, 92.8, 78.9]
})
df.write_parquet("output.parquet", compression="snappy")

# Read Parquet file (eager)
df_read = pl.read_parquet("output.parquet")

# Scan Parquet file (lazy) with predicate pushdown
lf = pl.scan_parquet("output.parquet")
result = (
    lf.filter(pl.col("score") > 90)
    .select(["name", "score"])
    .collect()
)
print(result)

# Read multiple Parquet files with glob pattern
df = pl.read_parquet("data/*.parquet")
lf = pl.scan_parquet("data/**/*.parquet")
```

**Important**: Avoid `read_parquet().lazy()` - this is an antipattern that forces Polars to load the entire file before creating a LazyFrame. Always use `scan_parquet()` for lazy evaluation.

### Other Formats

```python
import polars as pl

# JSON
df = pl.read_json("data.json")
df.write_json("output.json")

# NDJSON (newline-delimited JSON)
df = pl.read_ndjson("data.ndjson")
df.write_ndjson("output.ndjson")

# Excel (requires additional dependencies)
df = pl.read_excel("data.xlsx", sheet_name="Sheet1")

# SQL databases
df = pl.read_database(
    query="SELECT * FROM users",
    connection="postgresql://localhost/db"
)
```

## Filtering Data

```python
import polars as pl

df = pl.DataFrame({
    "name": ["Alice", "Bob", "Charlie", "David", "Eve"],
    "age": [25, 30, 35, 28, 22],
    "city": ["NYC", "London", "Paris", "NYC", "Tokyo"],
    "salary": [75000, 85000, 90000, 70000, 65000]
})

# Simple filter
df.filter(pl.col("age") > 25)

# Multiple conditions with AND (&)
df.filter((pl.col("age") > 25) & (pl.col("salary") > 70000))

# Multiple conditions with OR (|)
df.filter((pl.col("city") == "NYC") | (pl.col("city") == "London"))

# Using is_in for multiple values
df.filter(pl.col("city").is_in(["NYC", "London"]))

# Negation
df.filter(~pl.col("city").is_in(["NYC", "London"]))

# String contains
df.filter(pl.col("name").str.contains("li"))

# Null handling
df.filter(pl.col("salary").is_not_null())

# Between (inclusive)
df.filter(pl.col("age").is_between(25, 30))

# Complex filter with multiple conditions
df.filter(
    (pl.col("age") > 25) &
    (pl.col("salary") > 70000) &
    (pl.col("city").is_in(["NYC", "London", "Paris"]))
)
```

## Joins

Polars supports various join types with excellent performance.

### Basic Joins

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

# Inner join - only matching rows
result = employees.join(departments, on="dept_id", how="inner")
print("Inner join:")
print(result)

# Left join - all rows from left, matching from right
result = employees.join(departments, on="dept_id", how="left")
print("\nLeft join:")
print(result)

# Right join - all rows from right, matching from left
result = employees.join(departments, on="dept_id", how="right")
print("\nRight join:")
print(result)

# Full outer join - all rows from both
result = employees.join(departments, on="dept_id", how="full")
print("\nFull join:")
print(result)
```

### Semi and Anti Joins

Semi and anti joins are powerful for filtering based on the existence of matching rows.

```python
import polars as pl

orders = pl.DataFrame({
    "order_id": [1, 2, 3, 4, 5],
    "customer_id": [101, 102, 101, 103, 104]
})

active_customers = pl.DataFrame({
    "customer_id": [101, 102]
})

# Semi join - rows from left that have a match in right
# Returns only orders from active customers
result = orders.join(active_customers, on="customer_id", how="semi")
print("Semi join (orders from active customers):")
print(result)

# Anti join - rows from left that have NO match in right
# Returns orders from inactive customers
result = orders.join(active_customers, on="customer_id", how="anti")
print("\nAnti join (orders from inactive customers):")
print(result)
```

### Asof Joins (Time-based Joins)

Asof joins are perfect for time-series data where you want to match on the nearest key rather than exact matches.

```python
import polars as pl

# Stock trades
trades = pl.DataFrame({
    "time": [1, 5, 10, 15],
    "ticker": ["AAPL", "AAPL", "AAPL", "AAPL"],
    "price": [100.0, 101.5, 102.0, 101.8]
})

# Market quotes
quotes = pl.DataFrame({
    "time": [1, 2, 4, 6, 8, 12],
    "ticker": ["AAPL", "AAPL", "AAPL", "AAPL", "AAPL", "AAPL"],
    "bid": [99.5, 99.8, 100.2, 101.0, 101.2, 101.5]
})

# Backward asof join - match with most recent quote at or before trade time
result = trades.join_asof(
    quotes,
    on="time",
    by="ticker",
    strategy="backward"
)
print("Backward asof join:")
print(result)

# Forward asof join - match with next available quote
result = trades.join_asof(
    quotes,
    on="time",
    strategy="forward"
)
print("\nForward asof join:")
print(result)

# Nearest asof join - match with closest quote
result = trades.join_asof(
    quotes,
    on="time",
    strategy="nearest"
)
print("\nNearest asof join:")
print(result)
```

### Join with Different Column Names

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

# Join on differently named columns
result = df1.join(
    df2,
    left_on="id",
    right_on="other_id",
    how="left"
)
print(result)

# Join with suffix for duplicate columns
df3 = pl.DataFrame({
    "id": [1, 2, 3],
    "value": [10, 20, 30]
})

result = df1.join(df3, on="id", suffix="_right")
print(result)
```

### Join Validation

```python
import polars as pl

# Validate join cardinality
result = employees.join(
    departments,
    on="dept_id",
    how="left",
    validate="m:1"  # Many-to-one: checks dept_id is unique in departments
)

# Available validation options:
# "m:m" - Many-to-many (default, no checks)
# "1:1" - One-to-one (unique in both)
# "1:m" - One-to-many (unique in left)
# "m:1" - Many-to-one (unique in right)
```

## GroupBy Operations

### Basic Aggregations

```python
import polars as pl

sales = pl.DataFrame({
    "date": ["2024-01-01", "2024-01-01", "2024-01-02", "2024-01-02"],
    "product": ["A", "B", "A", "B"],
    "region": ["East", "East", "West", "West"],
    "quantity": [100, 150, 200, 180],
    "revenue": [1000, 1500, 2000, 1800]
})

# Single column groupby
result = sales.group_by("product").agg(
    pl.col("quantity").sum().alias("total_qty"),
    pl.col("revenue").mean().alias("avg_revenue"),
    pl.col("revenue").max().alias("max_revenue"),
    pl.len().alias("count")
)
print(result)

# Multiple column groupby
result = sales.group_by(["product", "region"]).agg(
    pl.col("quantity").sum(),
    pl.col("revenue").sum()
)
print(result)
```

### Common Aggregation Functions

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

### Advanced Aggregations

```python
import polars as pl

df = pl.DataFrame({
    "category": ["A", "A", "A", "B", "B"],
    "subcategory": ["x", "y", "x", "x", "y"],
    "value": [10, 20, 30, 40, 50]
})

# Multiple aggregations on different columns
result = df.group_by("category").agg(
    # List of all values
    pl.col("value").alias("all_values"),
    # Sorted list
    pl.col("value").sort().alias("sorted_values"),
    # Top 2 values
    pl.col("value").sort(descending=True).head(2).alias("top_2"),
    # Concatenate strings
    pl.col("subcategory").str.concat("-").alias("subcats"),
    # Conditional aggregation
    pl.col("value").filter(pl.col("subcategory") == "x").sum().alias("x_sum")
)
print(result)

# Group by with maintaining order
result = df.group_by("category", maintain_order=True).agg(
    pl.col("value").sum()
)
```

### Dynamic GroupBy

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

# Group by time intervals
result = df.group_by_dynamic("timestamp", every="1d").agg(
    pl.col("value").sum().alias("daily_sum"),
    pl.col("value").mean().alias("daily_avg")
)
print(result)

# Rolling group by
result = df.rolling("timestamp", period="2d").agg(
    pl.col("value").sum().alias("rolling_sum")
)
```

## Window Functions

Window functions perform calculations across a set of rows related to the current row, similar to SQL window functions.

### Basic Window Functions with over()

```python
import polars as pl

df = pl.DataFrame({
    "name": ["Alice", "Bob", "Charlie", "David", "Eve"],
    "department": ["Sales", "Sales", "Engineering", "Engineering", "Sales"],
    "salary": [50000, 60000, 70000, 80000, 55000]
})

# Add department statistics as new columns
result = df.with_columns(
    # Average salary per department
    pl.col("salary").mean().over("department").alias("dept_avg_salary"),
    # Max salary per department
    pl.col("salary").max().over("department").alias("dept_max_salary"),
    # Count per department
    pl.len().over("department").alias("dept_size"),
    # Rank within department
    pl.col("salary").rank().over("department").alias("salary_rank"),
    # Percentage of department total
    (pl.col("salary") / pl.col("salary").sum().over("department") * 100)
        .round(2)
        .alias("pct_of_dept")
)
print(result)
```

### Advanced Window Functions

```python
import polars as pl

df = pl.DataFrame({
    "date": ["2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04", "2024-01-05"],
    "category": ["A", "A", "A", "B", "B"],
    "value": [10, 20, 15, 30, 25]
})

result = df.with_columns(
    # Running sum within category
    pl.col("value").cum_sum().over("category").alias("running_sum"),
    # Running count
    pl.col("value").cum_count().over("category").alias("running_count"),
    # Previous value within category (lag)
    pl.col("value").shift(1).over("category").alias("prev_value"),
    # Next value within category (lead)
    pl.col("value").shift(-1).over("category").alias("next_value"),
    # Difference from previous
    (pl.col("value") - pl.col("value").shift(1).over("category")).alias("diff"),
    # First value in group
    pl.col("value").first().over("category").alias("first_in_group"),
    # Last value in group
    pl.col("value").last().over("category").alias("last_in_group")
)
print(result)
```

### Sorting Within Windows

```python
import polars as pl

df = pl.DataFrame({
    "type": ["Fire", "Fire", "Water", "Water", "Fire"],
    "name": ["Charmander", "Charizard", "Squirtle", "Blastoise", "Flareon"],
    "speed": [65, 100, 43, 78, 65],
    "attack": [52, 84, 48, 83, 65]
})

result = df.with_columns(
    # Sort by speed within each type and get names
    pl.col("name").sort_by("speed", descending=True).over("type").alias("by_speed"),
    # Get fastest 2 speeds per type
    pl.col("speed").sort(descending=True).head(2).over("type").alias("top_2_speeds"),
    # Get the strongest attack per type
    pl.col("attack").sort(descending=True).first().over("type").alias("strongest_attack")
)
print(result)
```

### Rolling Windows

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
    # 3-day moving average
    pl.col("value").rolling_mean(window_size=3).alias("ma_3"),
    # 3-day rolling sum
    pl.col("value").rolling_sum(window_size=3).alias("sum_3"),
    # 3-day rolling standard deviation
    pl.col("value").rolling_std(window_size=3).alias("std_3"),
    # 3-day rolling min/max
    pl.col("value").rolling_min(window_size=3).alias("min_3"),
    pl.col("value").rolling_max(window_size=3).alias("max_3"),
    # Exponential moving average
    pl.col("value").ewm_mean(span=3).alias("ema_3")
)
print(result)
```

### Multiple Window Functions in One Call

Polars optimizes multiple window functions over the same grouping by caching the partition.

```python
import polars as pl

df = pl.DataFrame({
    "group": ["A", "A", "B", "B", "A"],
    "subgroup": ["x", "y", "x", "y", "x"],
    "value": [1, 2, 3, 4, 5]
})

# Multiple window functions - Polars caches the grouping
result = df.with_columns(
    pl.col("value").sum().over("group").alias("group_sum"),
    pl.col("value").mean().over("group").alias("group_mean"),
    pl.col("value").count().over("group").alias("group_count"),
    pl.col("value").sum().over("subgroup").alias("subgroup_sum"),
    pl.col("value").rank().over(["group", "subgroup"]).alias("combined_rank")
)
print(result)
```

## String Operations

```python
import polars as pl

df = pl.DataFrame({
    "text": ["  Hello World  ", "POLARS is FAST", "data_science_rocks"],
    "email": ["alice@example.com", "bob@test.org", "charlie@demo.net"]
})

result = df.select(
    # Strip whitespace
    pl.col("text").str.strip_chars().alias("stripped"),
    # Convert case
    pl.col("text").str.to_lowercase().alias("lower"),
    pl.col("text").str.to_uppercase().alias("upper"),
    pl.col("text").str.to_titlecase().alias("title"),
    # Replace
    pl.col("text").str.replace("_", " ").alias("replaced"),
    pl.col("text").str.replace_all("_", " ").alias("replaced_all"),
    # Split
    pl.col("text").str.split("_").alias("split"),
    # Extract with regex
    pl.col("email").str.extract(r"@(.+)\.").alias("domain"),
    # Check contains
    pl.col("text").str.contains("POLARS").alias("has_polars"),
    pl.col("text").str.contains("(?i)polars").alias("has_polars_case_insensitive"),
    # Length
    pl.col("text").str.len_chars().alias("char_count"),
    pl.col("text").str.len_bytes().alias("byte_count"),
    # Starts/ends with
    pl.col("text").str.starts_with("  ").alias("starts_space"),
    pl.col("text").str.ends_with("  ").alias("ends_space")
)
print(result)
```

## Date and Time Operations

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
    # Extract components
    pl.col("timestamp").dt.year().alias("year"),
    pl.col("timestamp").dt.month().alias("month"),
    pl.col("timestamp").dt.day().alias("day"),
    pl.col("timestamp").dt.hour().alias("hour"),
    pl.col("timestamp").dt.minute().alias("minute"),
    pl.col("timestamp").dt.weekday().alias("weekday"),  # 0 = Monday
    pl.col("timestamp").dt.week().alias("week_of_year"),
    pl.col("timestamp").dt.quarter().alias("quarter"),

    # Date arithmetic
    (pl.col("timestamp") + pl.duration(days=7)).alias("plus_week"),
    (pl.col("timestamp") - pl.duration(hours=12)).alias("minus_12h"),

    # Truncate to period
    pl.col("timestamp").dt.truncate("1mo").alias("month_start"),
    pl.col("timestamp").dt.truncate("1w").alias("week_start"),

    # Format as string
    pl.col("timestamp").dt.strftime("%Y-%m-%d %H:%M").alias("formatted")
)
print(result)
```

## Handling Missing Data

```python
import polars as pl

df = pl.DataFrame({
    "a": [1, None, 3, None, 5],
    "b": [None, 2.0, None, 4.0, 5.0],
    "c": ["x", None, "z", None, "w"]
})

# Check for nulls
print("Null counts per column:")
print(df.null_count())

# Filter nulls
print("\nRows where 'a' is not null:")
print(df.filter(pl.col("a").is_not_null()))

# Fill nulls with various strategies
result = df.with_columns(
    # Fill with constant
    pl.col("a").fill_null(0).alias("a_zero"),
    # Fill with mean
    pl.col("b").fill_null(pl.col("b").mean()).alias("b_mean"),
    # Fill with forward fill (last valid value)
    pl.col("b").fill_null(strategy="forward").alias("b_ffill"),
    # Fill with backward fill
    pl.col("b").fill_null(strategy="backward").alias("b_bfill"),
    # Fill string column
    pl.col("c").fill_null("unknown").alias("c_filled")
)
print("\nFilled DataFrame:")
print(result)

# Drop rows with any null
print("\nDrop rows with any null:")
print(df.drop_nulls())

# Drop rows with null in specific columns
print("\nDrop rows with null in 'a' or 'b':")
print(df.drop_nulls(subset=["a", "b"]))

# Replace specific values with null
result = df.with_columns(
    pl.when(pl.col("a") == 1).then(None).otherwise(pl.col("a")).alias("a_modified")
)
```

## Performance Comparison with Pandas

```python
import polars as pl
import pandas as pd
import numpy as np
import time

# Create test data
n_rows = 10_000_000
data = {
    "id": np.random.randint(0, 1000, n_rows),
    "value": np.random.randn(n_rows),
    "category": np.random.choice(["A", "B", "C", "D"], n_rows)
}

# Benchmark: GroupBy Sum
print("=== GroupBy Sum Benchmark ===")

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
print(f"Speedup: {pandas_time / polars_time:.1f}x")

# Benchmark: Filter + GroupBy + Sort
print("\n=== Complex Query Benchmark ===")

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
print(f"Speedup: {pandas_time / polars_time:.1f}x")
```

Typical results show Polars being 5-20x faster for groupby operations, with even larger speedups for complex queries due to query optimization.

## Performance Tips

### Use Lazy Mode for Large Datasets

```python
# Good - optimized query plan
result = (
    pl.scan_parquet("large_data/*.parquet")
    .filter(pl.col("date") > "2024-01-01")
    .group_by("category")
    .agg(pl.col("value").sum())
    .collect()
)

# Avoid - loads everything first
df = pl.read_parquet("large_data/*.parquet")
result = df.filter(pl.col("date") > "2024-01-01")
```

### Use Expressions Instead of apply()

```python
# Good - vectorized
df.with_columns(
    (pl.col("a") * 2 + pl.col("b")).alias("result")
)

# Avoid - slow Python loop
df.with_columns(
    pl.struct(["a", "b"]).map_elements(
        lambda x: x["a"] * 2 + x["b"]
    ).alias("result")
)
```

### Use Appropriate Data Types

```python
import polars as pl

# Use Categorical for low-cardinality string columns
df = df.with_columns(
    pl.col("category").cast(pl.Categorical)
)

# Use appropriate integer sizes
df = df.with_columns(
    pl.col("small_int").cast(pl.Int8),  # -128 to 127
    pl.col("medium_int").cast(pl.Int32),  # -2B to 2B
    pl.col("large_int").cast(pl.Int64)  # Full range
)

# Use Float32 when Float64 precision isn't needed
df = df.with_columns(
    pl.col("percentage").cast(pl.Float32)
)
```

### Streaming for Very Large Datasets

```python
# Process data in streaming mode for datasets larger than memory
result = (
    pl.scan_parquet("huge_data/*.parquet")
    .filter(pl.col("value") > 100)
    .group_by("category")
    .agg(pl.col("value").sum())
    .collect(streaming=True)  # Enable streaming
)
```

### Use sink_ Methods for Output

```python
# Write results directly without loading all into memory
(
    pl.scan_parquet("input/*.parquet")
    .filter(pl.col("active") == True)
    .sink_parquet("output/filtered.parquet")
)

# Sink to CSV
(
    pl.scan_csv("input/*.csv")
    .filter(pl.col("status") == "active")
    .sink_csv("output/filtered.csv")
)
```

### Select Only Needed Columns Early

```python
# Good - projection pushdown
result = (
    pl.scan_parquet("data.parquet")
    .select(["id", "value", "category"])  # Only read these columns
    .filter(pl.col("value") > 100)
    .collect()
)

# Less efficient - reads all columns first
result = (
    pl.scan_parquet("data.parquet")
    .filter(pl.col("value") > 100)
    .select(["id", "value", "category"])
    .collect()
)
```

## Real-World Example: Sales Analysis Pipeline

```python
import polars as pl
from datetime import datetime

def analyze_sales(file_path: str) -> dict:
    """Complete sales analysis pipeline using Polars."""

    # Build the query plan
    analysis = (
        pl.scan_parquet(file_path)
        # Filter to recent data
        .filter(pl.col("date") >= datetime(2024, 1, 1))
        # Add computed columns
        .with_columns(
            (pl.col("quantity") * pl.col("unit_price")).alias("revenue"),
            pl.col("date").dt.month().alias("month"),
            pl.col("date").dt.weekday().alias("weekday")
        )
    )

    # Monthly summary
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

    # Product performance with rankings
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

    # Day of week analysis
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

# Usage
# results = analyze_sales("sales_data/*.parquet")
# print(results["monthly"])
# print(results["products"])
```

## Common Interview Questions

### What is the difference between eager and lazy evaluation in Polars?

**Eager evaluation** (DataFrame) executes operations immediately, like Pandas. **Lazy evaluation** (LazyFrame) builds a query plan that is optimized before execution. Use `collect()` to execute a lazy query. Lazy mode enables predicate pushdown, projection pushdown, and parallel execution optimization.

### Why is Polars faster than Pandas?

- Written in Rust with efficient memory management
- Uses Apache Arrow columnar format
- Automatic multi-threading and SIMD optimization
- Query optimization in lazy mode
- No GIL (Global Interpreter Lock) constraints
- Zero-copy operations where possible

### How do window functions work in Polars?

Window functions use the `over()` method to define partitions:
```python
pl.col("value").sum().over("category")
```
This calculates the sum of "value" for each unique "category" and broadcasts the result back to each row.

### What are the different join types in Polars?

- `inner`: Only matching rows
- `left`: All left rows + matching right
- `right`: All right rows + matching left
- `full`: All rows from both
- `semi`: Left rows that have a match in right (no right columns)
- `anti`: Left rows that have NO match in right
- `cross`: Cartesian product
- `join_asof`: Match on nearest key (for time-series)

### How do you handle missing data in Polars?

```python
df.fill_null(0)  # Fill with value
df.fill_null(strategy="forward")  # Forward fill
df.fill_null(pl.col("x").mean())  # Fill with computed value
df.drop_nulls()  # Remove rows with nulls
df.filter(pl.col("x").is_not_null())  # Filter out nulls
```

### When should you use scan_ vs read_ functions?

Use `scan_` (e.g., `scan_parquet`, `scan_csv`) for:
- Large files where you want lazy evaluation
- Queries that can benefit from predicate/projection pushdown
- Building optimized query plans

Use `read_` for:
- Small files where immediate execution is fine
- Interactive exploration
- When you need the entire dataset in memory

## Further Reading

### Official Resources

- [Polars Documentation](https://docs.pola.rs/)
- [Polars GitHub Repository](https://github.com/pola-rs/polars)
- [Polars User Guide](https://docs.pola.rs/user-guide/)

### Migration Guides

- [From Pandas to Polars](https://docs.pola.rs/user-guide/migration/pandas/)
- [From SQL to Polars](https://docs.pola.rs/user-guide/migration/sql/)

### Related Libraries

- **DuckDB**: SQL-based analytical database that integrates well with Polars
- **PyArrow**: Apache Arrow implementation for Python
- **Dask**: Parallel computing library for larger-than-memory datasets

### Community

- [Polars Discord](https://discord.gg/4UfP5cfBE7)
- [Stack Overflow - python-polars tag](https://stackoverflow.com/questions/tagged/python-polars)

---

Polars represents a significant leap forward in DataFrame performance for Python users. By leveraging Rust's speed and Apache Arrow's memory efficiency, it enables data processing at scales that would be impractical with Pandas. Start with lazy evaluation, use expressions instead of apply(), and let Polars optimize your queries automatically.
