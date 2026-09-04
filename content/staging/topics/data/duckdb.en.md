---
title: DuckDB Embedded Analytics Database
description: A comprehensive guide to DuckDB - the fast in-process analytical database
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
origin: old/src/content/docs/data/duckdb.en.md
divergence: 0.216
issues: []
legacy:
  category: Data
  subcategory: Analytics
  order: 21
  lastUpdated: 2026-01-20
---

DuckDB is an in-process SQL OLAP (Online Analytical Processing) database management system designed for fast analytical queries. Often described as "SQLite for analytics," DuckDB brings the simplicity of embedded databases to the world of data analytics, allowing you to run complex analytical queries directly within your application without the need for a separate database server.

## Concept Overview

### What is DuckDB?

DuckDB is an open-source, embedded analytical database that runs within your application's process. Unlike traditional client-server databases like PostgreSQL or MySQL, DuckDB requires no separate installation, configuration, or administration. You simply import the library and start querying.

**Key characteristics:**

- **In-process**: Runs embedded within your application
- **Columnar storage**: Optimized for analytical workloads
- **Vectorized execution**: Processes data in batches for high performance
- **Zero dependencies**: Single library with no external dependencies
- **ACID compliant**: Full transaction support with durability guarantees

### Historical Context

DuckDB was created by Mark Raasveldt and Hannes Muhleisen at CWI (Centrum Wiskunde & Informatica) in Amsterdam, with the first public release in 2019. The project emerged from research into analytical database systems and was designed to fill a gap in the database ecosystem: the need for a simple, portable, and fast analytical database that could be embedded directly into applications.

### Why DuckDB? The Problem It Solves

Traditional databases present several challenges for analytical workloads:

| Challenge | Traditional Approach | DuckDB Solution |
|-----------|---------------------|-----------------|
| Setup complexity | Install, configure, maintain server | Zero configuration, import and use |
| Data movement | ETL to database server | Query files directly (CSV, Parquet, JSON) |
| Resource overhead | Separate process, network latency | In-process, memory-efficient |
| Portability | Server dependencies | Single file, cross-platform |
| Small data analysis | Overkill for GBs of data | Perfect for local analytics |

### DuckDB vs. SQLite vs. PostgreSQL

```
┌─────────────────┬──────────────────┬──────────────────┬──────────────────┐
│ Feature         │ DuckDB           │ SQLite           │ PostgreSQL       │
├─────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Architecture    │ Embedded, OLAP   │ Embedded, OLTP   │ Client-Server    │
│ Storage Format  │ Columnar         │ Row-based        │ Row-based        │
│ Execution Model │ Vectorized       │ Row-at-a-time    │ Row-at-a-time    │
│ Best For        │ Analytics        │ Transactions     │ General Purpose  │
│ Concurrency     │ Single writer    │ Single writer    │ Multi-writer     │
│ Setup           │ None             │ None             │ Server required  │
└─────────────────┴──────────────────┴──────────────────┴──────────────────┘
```

## Core Principles

### Columnar Storage Architecture

DuckDB uses columnar storage, which stores data by columns rather than rows. This architecture is fundamental to its analytical performance.

```
Row-based storage (SQLite, PostgreSQL):
┌────────┬────────┬────────┐
│ Row 1  │ name   │ age    │ revenue │
│ Row 2  │ name   │ age    │ revenue │
│ Row 3  │ name   │ age    │ revenue │
└────────┴────────┴────────┘

Columnar storage (DuckDB):
┌─────────────────────────┐
│ name: [n1, n2, n3, ...] │
│ age:  [a1, a2, a3, ...] │
│ revenue: [r1, r2, r3]   │
└─────────────────────────┘
```

**Benefits of columnar storage:**

1. **Compression efficiency**: Similar values stored together compress better
2. **Cache optimization**: Only relevant columns loaded into memory
3. **SIMD acceleration**: Vectorized operations on contiguous data
4. **Reduced I/O**: Skip irrelevant columns entirely

### Vectorized Query Execution

DuckDB implements a vectorized execution engine where operators process data in batches (vectors) of a fixed size (default: 2048 tuples) rather than one row at a time.

```
Traditional row-at-a-time execution:
for each row:
    apply filter
    apply projection
    output row

Vectorized execution (DuckDB):
for each vector (2048 rows):
    apply filter to entire vector
    apply projection to entire vector
    output vector
```

**Performance advantages:**

- Reduced function call overhead
- Better CPU cache utilization
- Enables SIMD (Single Instruction, Multiple Data) operations
- Minimizes branch mispredictions

### Push-Based Query Processing

DuckDB uses a push-based (or data-centric) execution model where data flows through operators without the overhead of virtual function calls for each tuple.

## Key Concepts

### Installation

**Python:**

```bash
# Using pip
pip install duckdb

# Using conda
conda install python-duckdb -c conda-forge
```

**R:**

```r
# From CRAN
install.packages("duckdb")
```

**CLI:**

```bash
# macOS with Homebrew
brew install duckdb

# Linux (download binary)
wget https://github.com/duckdb/duckdb/releases/latest/download/duckdb_cli-linux-amd64.zip
unzip duckdb_cli-linux-amd64.zip

# Windows (download from releases page)
# https://github.com/duckdb/duckdb/releases
```

**Node.js:**

```bash
npm install duckdb
```

### Database Connections

DuckDB supports both in-memory and persistent databases:

```python
import duckdb

# In-memory database (default)
con = duckdb.connect()
# or explicitly
con = duckdb.connect(database=':memory:')

# Persistent database (data saved to file)
con = duckdb.connect('my_database.duckdb')

# Read-only connection
con = duckdb.connect('my_database.duckdb', read_only=True)
```

### Data Import and Export

DuckDB excels at reading various file formats directly:

**CSV Files:**

```sql
-- Read CSV directly
SELECT * FROM 'data.csv';

-- Read with options
SELECT * FROM read_csv('data.csv',
    header = true,
    delim = ',',
    columns = {'id': 'INTEGER', 'name': 'VARCHAR'}
);

-- Read multiple files with glob
SELECT * FROM 'data/*.csv';

-- Create table from CSV
CREATE TABLE sales AS SELECT * FROM 'sales.csv';
```

**Parquet Files:**

```sql
-- Read Parquet directly
SELECT * FROM 'data.parquet';

-- Read from S3 (requires httpfs extension)
SELECT * FROM 's3://bucket/data.parquet';

-- Write to Parquet
COPY (SELECT * FROM sales) TO 'output.parquet' (FORMAT PARQUET);
```

**JSON Files:**

```sql
-- Read JSON
SELECT * FROM read_json('data.json');

-- Read newline-delimited JSON
SELECT * FROM read_json('data.ndjson', format = 'newline_delimited');
```

**Export Data:**

```sql
-- Export to CSV
COPY sales TO 'sales.csv' (HEADER, DELIMITER ',');

-- Export to Parquet with compression
COPY sales TO 'sales.parquet' (FORMAT PARQUET, COMPRESSION 'ZSTD');

-- Export query results
COPY (SELECT * FROM sales WHERE year = 2024) TO 'sales_2024.csv';
```

### SQL Extensions and Features

DuckDB implements a rich SQL dialect with many convenient extensions:

**Friendly SQL Syntax:**

```sql
-- Column aliases in GROUP BY and HAVING
SELECT category, SUM(amount) AS total
FROM sales
GROUP BY category
HAVING total > 1000;

-- String slicing
SELECT 'DuckDB'[1:4];  -- 'Duck'

-- List comprehensions
SELECT [x * x FOR x IN range(10)];  -- [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]

-- Dot notation for function chaining
SELECT ('hello world').upper().replace(' ', '_');  -- 'HELLO_WORLD'

-- EXCLUDE and REPLACE in SELECT
SELECT * EXCLUDE (sensitive_column) FROM users;
SELECT * REPLACE (UPPER(name) AS name) FROM users;
```

**Complex Data Types:**

```sql
-- Lists
SELECT [1, 2, 3] AS my_list;
SELECT list[1] FROM (SELECT [1, 2, 3] AS list);  -- First element (1-indexed)
SELECT list[-1] FROM (SELECT [1, 2, 3] AS list); -- Last element

-- Structs
SELECT {'name': 'Alice', 'age': 30} AS person;
SELECT person.name FROM (SELECT {'name': 'Alice', 'age': 30} AS person);

-- Maps
SELECT MAP(['key1', 'key2'], ['value1', 'value2']);

-- Unnest lists
SELECT UNNEST([1, 2, 3]) AS value;
```

**Window Functions:**

```sql
-- Running totals
SELECT
    date,
    amount,
    SUM(amount) OVER (ORDER BY date) AS running_total
FROM sales;

-- Ranking
SELECT
    product,
    revenue,
    RANK() OVER (ORDER BY revenue DESC) AS rank,
    DENSE_RANK() OVER (ORDER BY revenue DESC) AS dense_rank,
    ROW_NUMBER() OVER (ORDER BY revenue DESC) AS row_num
FROM products;

-- Moving averages
SELECT
    date,
    value,
    AVG(value) OVER (
        ORDER BY date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS moving_avg_7d
FROM metrics;
```

### Extensions

DuckDB's functionality can be extended through extensions:

```sql
-- Install and load extensions
INSTALL httpfs;
LOAD httpfs;

-- Common extensions:
-- httpfs: HTTP and S3 file access
-- parquet: Parquet file support (built-in)
-- json: JSON support (built-in)
-- spatial: Geospatial functions
-- postgres: PostgreSQL integration
-- mysql: MySQL integration
-- sqlite: SQLite integration
-- excel: Excel file support
-- fts: Full-text search
-- icu: International Components for Unicode

-- List installed extensions
SELECT * FROM duckdb_extensions();
```

**S3 Access Example:**

```sql
INSTALL httpfs;
LOAD httpfs;

-- Configure S3 credentials
SET s3_region = 'us-east-1';
SET s3_access_key_id = 'your-access-key';
SET s3_secret_access_key = 'your-secret-key';

-- Query S3 directly
SELECT * FROM 's3://my-bucket/data/*.parquet';
```

## Code Examples

### Python Integration

```python
import duckdb
import pandas as pd

# Create a connection
con = duckdb.connect()

# Basic query
result = con.sql("SELECT 42 AS answer").fetchall()
print(result)  # [(42,)]

# Query a Pandas DataFrame directly
df = pd.DataFrame({
    'product': ['A', 'B', 'C', 'A', 'B'],
    'quantity': [10, 20, 15, 30, 25],
    'price': [100, 200, 150, 100, 200]
})

# DuckDB can query the DataFrame by name
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

# Convert results to various formats
query = "SELECT * FROM df WHERE quantity > 15"
con.sql(query).fetchall()      # List of tuples
con.sql(query).df()            # Pandas DataFrame
con.sql(query).pl()            # Polars DataFrame
con.sql(query).arrow()         # PyArrow Table
con.sql(query).fetchnumpy()    # NumPy arrays
```

### Working with Parquet Files

```python
import duckdb

con = duckdb.connect()

# Read and analyze Parquet files
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

# Create a table from Parquet
con.sql("""
    CREATE TABLE orders AS
    SELECT * FROM 'orders/*.parquet'
""")

# Export aggregated data
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

### Pandas and Polars Integration

```python
import duckdb
import pandas as pd
import polars as pl

# Create sample DataFrames
pandas_df = pd.DataFrame({
    'id': range(1000000),
    'value': range(1000000)
})

polars_df = pl.DataFrame({
    'id': range(1000000),
    'category': ['A', 'B', 'C'] * 333333 + ['A']
})

# Query both DataFrames together
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

# Register DataFrame as a virtual table
con = duckdb.connect()
con.register('my_table', pandas_df)

# Now queryable by name
con.sql("SELECT * FROM my_table LIMIT 5").show()
```

### Persistent Database Example

```python
import duckdb

# Create persistent database
con = duckdb.connect('analytics.duckdb')

# Create schema and tables
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

# Insert data
con.sql("""
    INSERT INTO sales.transactions VALUES
        (1, 101, 1, 2, 29.99, '2024-01-15'),
        (2, 102, 2, 1, 49.99, '2024-01-15'),
        (3, 101, 1, 1, 29.99, '2024-01-16');
""")

# Query with joins
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

# Close connection
con.close()
```

### CLI Usage

```bash
# Start interactive CLI with in-memory database
duckdb

# Connect to persistent database
duckdb my_database.duckdb

# Execute query directly
duckdb -c "SELECT * FROM 'data.csv' LIMIT 10"

# Read from stdin
cat data.csv | duckdb -c "SELECT * FROM read_csv('/dev/stdin')"

# Output formats
duckdb -c "SELECT * FROM 'data.parquet'" -csv     # CSV output
duckdb -c "SELECT * FROM 'data.parquet'" -json    # JSON output
duckdb -c "SELECT * FROM 'data.parquet'" -markdown # Markdown table
```

**CLI Dot Commands:**

```sql
-- Show help
.help

-- Change output mode
.mode markdown
.mode csv
.mode json

-- Output to file
.output results.csv
SELECT * FROM sales;
.output  -- Reset to stdout

-- Show tables
.tables

-- Describe table
.schema sales

-- Import CSV
.import data.csv my_table

-- Timer for queries
.timer on
SELECT COUNT(*) FROM large_table;
.timer off

-- Execute SQL file
.read queries.sql
```

### R Integration

```r
library(duckdb)
library(dplyr)

# Create connection
con <- dbConnect(duckdb())

# Register a data frame
duckdb_register(con, "mtcars_db", mtcars)

# Query with SQL
dbGetQuery(con, "
    SELECT cyl, AVG(mpg) as avg_mpg, COUNT(*) as count
    FROM mtcars_db
    GROUP BY cyl
    ORDER BY cyl
")

# Use dplyr syntax with DuckDB backend
tbl(con, "mtcars_db") %>%
    filter(hp > 100) %>%
    group_by(cyl) %>%
    summarise(
        avg_mpg = mean(mpg),
        avg_hp = mean(hp),
        count = n()
    ) %>%
    collect()

# Read Parquet files directly
tbl(con, "read_parquet('data/*.parquet')") %>%
    filter(year >= 2024) %>%
    summarise(total = sum(amount)) %>%
    collect()

# Disconnect
dbDisconnect(con, shutdown = TRUE)
```

## Best Practices

### 1. Use File Formats Efficiently

```python
# GOOD: Query Parquet directly without loading into memory
result = duckdb.sql("""
    SELECT * FROM 'large_file.parquet'
    WHERE date >= '2024-01-01'
""").df()

# AVOID: Loading entire file into Pandas first
import pandas as pd
df = pd.read_parquet('large_file.parquet')  # Loads all data
result = df[df['date'] >= '2024-01-01']
```

### 2. Leverage Predicate Pushdown

```python
# GOOD: Filter early in the query
duckdb.sql("""
    SELECT category, SUM(amount)
    FROM 'sales/*.parquet'
    WHERE year = 2024  -- Filter pushed down to file reading
    GROUP BY category
""")

# AVOID: Filtering after aggregation when possible
duckdb.sql("""
    SELECT * FROM (
        SELECT year, category, SUM(amount) as total
        FROM 'sales/*.parquet'
        GROUP BY year, category
    )
    WHERE year = 2024  -- Less efficient
""")
```

### 3. Use Appropriate Data Types

```sql
-- GOOD: Use appropriate types
CREATE TABLE events (
    event_id INTEGER,           -- Not BIGINT if INT range is sufficient
    event_date DATE,            -- Not VARCHAR for dates
    amount DECIMAL(10,2),       -- Precise for money
    category VARCHAR(50),       -- Bounded length when known
    is_active BOOLEAN           -- Not INTEGER for booleans
);

-- AVOID: Overly generic types
CREATE TABLE events (
    event_id BIGINT,            -- Wastes space if not needed
    event_date VARCHAR,         -- Loses date functionality
    amount DOUBLE,              -- Floating point for money
    category TEXT,              -- Unbounded when not needed
    is_active INTEGER           -- Unclear semantics
);
```

### 4. Connection Management

```python
# GOOD: Use context managers for automatic cleanup
import duckdb

with duckdb.connect('my_db.duckdb') as con:
    result = con.sql("SELECT * FROM sales").df()
# Connection automatically closed

# GOOD: Reuse connections
con = duckdb.connect()
for file in files:
    con.sql(f"SELECT * FROM '{file}'").show()
con.close()

# AVOID: Creating new connections repeatedly
for file in files:
    con = duckdb.connect()  # Inefficient
    con.sql(f"SELECT * FROM '{file}'").show()
    con.close()
```

### 5. Use Prepared Statements for Repeated Queries

```python
import duckdb

con = duckdb.connect()

# Create table
con.sql("CREATE TABLE users (id INT, name VARCHAR)")
con.sql("INSERT INTO users VALUES (1, 'Alice'), (2, 'Bob')")

# GOOD: Use parameterized queries
user_id = 1
result = con.execute("SELECT * FROM users WHERE id = ?", [user_id]).fetchall()

# Also works with named parameters
result = con.execute(
    "SELECT * FROM users WHERE id = $user_id",
    {"user_id": 1}
).fetchall()
```

## Common Pitfalls

### 1. Treating DuckDB as an OLTP Database

```python
# WRONG: Using DuckDB for high-frequency single-row operations
for record in records:
    con.sql(f"INSERT INTO table VALUES ({record})")  # Very slow

# RIGHT: Batch insert operations
con.sql("INSERT INTO table SELECT * FROM df")

# Or use COPY for bulk loading
con.sql("COPY table FROM 'data.csv'")
```

### 2. Ignoring Memory Limits

```python
# WRONG: Processing huge files without memory consideration
result = duckdb.sql("SELECT * FROM 'huge_100gb_file.parquet'").df()

# RIGHT: Set memory limits and process in chunks
con = duckdb.connect()
con.sql("SET memory_limit = '4GB'")
con.sql("SET threads = 4")

# Or use streaming/pagination
con.sql("""
    SELECT * FROM 'huge_file.parquet'
    LIMIT 1000000 OFFSET 0
""")
```

### 3. Not Using Extensions

```python
# WRONG: Complex workarounds for S3 access
import boto3
# Download file first, then query...

# RIGHT: Use httpfs extension
import duckdb
con = duckdb.connect()
con.sql("INSTALL httpfs; LOAD httpfs;")
con.sql("SET s3_region = 'us-east-1'")
result = con.sql("SELECT * FROM 's3://bucket/data.parquet'")
```

### 4. Inefficient DataFrame Operations

```python
import pandas as pd
import duckdb

df = pd.DataFrame({'a': range(1000000), 'b': range(1000000)})

# WRONG: Converting back and forth unnecessarily
result = duckdb.sql("SELECT * FROM df").df()
result = result[result['a'] > 500000]  # Filtering in Pandas

# RIGHT: Do all operations in DuckDB
result = duckdb.sql("""
    SELECT * FROM df WHERE a > 500000
""").df()
```

### 5. Concurrent Write Attempts

```python
# WRONG: Multiple writers to same database
import threading

def writer(db_path, data):
    con = duckdb.connect(db_path)  # Will fail with concurrent writes
    con.sql(f"INSERT INTO table VALUES {data}")
    con.close()

# RIGHT: Single writer pattern or use in-memory with final write
con = duckdb.connect('data.duckdb')
# All writes through single connection
con.sql("INSERT INTO table SELECT * FROM source1")
con.sql("INSERT INTO table SELECT * FROM source2")
con.close()
```

## Performance Considerations

### When to Use DuckDB

**Ideal use cases:**

- Local data analysis (GBs to low TBs)
- Ad-hoc queries on files (CSV, Parquet, JSON)
- Data transformation and ETL pipelines
- Jupyter notebook analysis
- Embedded analytics in applications
- CLI data exploration

**When to consider alternatives:**

- High-concurrency OLTP workloads (use PostgreSQL)
- Multi-user concurrent writes (use traditional RDBMS)
- Very large scale (100+ TB) distributed queries (use Spark, Trino)
- Real-time streaming (use Kafka, Flink)

### Memory Configuration

```sql
-- Check current settings
SELECT * FROM duckdb_settings() WHERE name LIKE '%memory%' OR name LIKE '%thread%';

-- Set memory limit
SET memory_limit = '8GB';

-- Set number of threads
SET threads = 4;

-- Memory per thread recommendation:
-- Minimum: 125 MB per thread
-- Aggregation-heavy: ~5 GB per thread
-- Join-heavy: ~10 GB per thread
```

### Query Optimization Tips

```sql
-- Use EXPLAIN to understand query plans
EXPLAIN SELECT * FROM sales WHERE year = 2024;

-- Use EXPLAIN ANALYZE for actual execution statistics
EXPLAIN ANALYZE SELECT * FROM sales WHERE year = 2024;

-- Create indexes for frequently filtered columns (for persistent tables)
CREATE INDEX idx_sales_year ON sales(year);

-- Use SUMMARIZE for quick data profiling
SUMMARIZE sales;

-- Partition data in Parquet files by common filter columns
COPY (SELECT * FROM sales)
TO 'sales' (FORMAT PARQUET, PARTITION_BY (year, month));
```

### Comparing Performance

```python
import duckdb
import pandas as pd
import time

# Generate test data
n = 10_000_000
df = pd.DataFrame({
    'id': range(n),
    'category': ['A', 'B', 'C', 'D'] * (n // 4),
    'value': range(n)
})

# Pandas aggregation
start = time.time()
result_pandas = df.groupby('category')['value'].sum()
pandas_time = time.time() - start

# DuckDB aggregation
start = time.time()
result_duckdb = duckdb.sql("""
    SELECT category, SUM(value)
    FROM df
    GROUP BY category
""").df()
duckdb_time = time.time() - start

print(f"Pandas: {pandas_time:.2f}s")
print(f"DuckDB: {duckdb_time:.2f}s")
# DuckDB is typically 5-10x faster for analytical queries
```

## Practical Scenarios

### Scenario 1: Log Analysis

```python
import duckdb

con = duckdb.connect()

# Analyze web server logs
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

# Top IPs by request count
con.sql("""
    SELECT ip, COUNT(*) as requests
    FROM logs
    GROUP BY ip
    ORDER BY requests DESC
    LIMIT 10
""").show()

# Error rate by hour
con.sql("""
    SELECT
        date_trunc('hour', strptime(timestamp, '%d/%b/%Y:%H:%M:%S %z')) AS hour,
        COUNT(*) FILTER (WHERE status >= 400) * 100.0 / COUNT(*) AS error_rate
    FROM logs
    GROUP BY 1
    ORDER BY 1
""").show()
```

### Scenario 2: ETL Pipeline

```python
import duckdb

def etl_pipeline():
    con = duckdb.connect()

    # Extract: Read from multiple sources
    con.sql("""
        CREATE TABLE raw_orders AS
        SELECT * FROM 's3://data-lake/orders/*.parquet'
        WHERE order_date >= '2024-01-01'
    """)

    con.sql("""
        CREATE TABLE raw_customers AS
        SELECT * FROM read_csv('customers.csv')
    """)

    # Transform: Clean and aggregate
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

    # Load: Write to output
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

### Scenario 3: Data Quality Checks

```python
import duckdb

def run_data_quality_checks(table_name: str):
    con = duckdb.connect()

    checks = []

    # Null check
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
    checks.append(('Null Values', null_check))

    # Duplicate check (assuming id column)
    dup_check = con.sql(f"""
        SELECT id, COUNT(*) AS occurrences
        FROM {table_name}
        GROUP BY id
        HAVING COUNT(*) > 1
        LIMIT 10
    """).df()
    checks.append(('Duplicates', dup_check))

    # Statistical summary
    summary = con.sql(f"SUMMARIZE {table_name}").df()
    checks.append(('Summary Statistics', summary))

    con.close()
    return checks
```

### Scenario 4: Interactive Analysis in Jupyter

```python
# In Jupyter Notebook
import duckdb
import pandas as pd

# Enable automatic result display
%load_ext duckdb.magic

# Now you can use SQL directly in cells
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

## Interview Questions

### Conceptual Questions

**Q: What is DuckDB and how does it differ from SQLite?**

A: DuckDB is an in-process OLAP (analytical) database, while SQLite is an in-process OLTP (transactional) database. Key differences:
- DuckDB uses columnar storage; SQLite uses row-based storage
- DuckDB has vectorized execution optimized for analytical queries
- DuckDB excels at aggregations and scans; SQLite excels at point lookups and transactions
- DuckDB is optimized for read-heavy analytical workloads; SQLite for write-heavy transactional workloads

**Q: Explain vectorized query execution in DuckDB.**

A: Vectorized execution processes data in batches (vectors) of fixed size (default 2048 tuples) rather than one row at a time. Benefits include:
- Reduced function call overhead
- Better CPU cache utilization
- Enables SIMD operations
- Reduced interpretation overhead
This makes DuckDB significantly faster for analytical queries compared to row-at-a-time execution.

**Q: When would you choose DuckDB over Spark or Trino?**

A: Choose DuckDB when:
- Data fits on a single machine (GBs to low TBs)
- Need fast local analysis without cluster setup
- Embedding analytics in an application
- Working in Jupyter notebooks or scripts
- Analyzing files directly without ETL

Choose Spark/Trino when:
- Data exceeds single-machine capacity
- Need distributed processing
- Require high concurrency
- Have existing cluster infrastructure

### Practical Questions

**Q: How would you optimize a slow DuckDB query?**

A: Steps to optimize:
1. Use `EXPLAIN ANALYZE` to understand the query plan
2. Ensure filters are applied early (predicate pushdown)
3. Check memory settings with `SELECT * FROM duckdb_settings()`
4. Use appropriate data types
5. For persistent tables, create indexes on filter columns
6. Partition Parquet files by common filter columns
7. Adjust threads and memory limits for your workload

**Q: Write a query to find the top 3 products by revenue in each category.**

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

## Further Reading

### Official Resources

- [DuckDB Documentation](https://duckdb.org/docs/) - Comprehensive official documentation
- [DuckDB GitHub Repository](https://github.com/duckdb/duckdb) - Source code and issues
- [DuckDB Blog](https://duckdb.org/news/) - Release notes and technical articles

### Tutorials and Guides

- [DuckDB Python API Guide](https://duckdb.org/docs/api/python/overview) - Python integration details
- [DuckDB R API Guide](https://duckdb.org/docs/api/r) - R integration with dplyr
- [DuckDB CLI Documentation](https://duckdb.org/docs/api/cli/overview) - Command-line interface

### Community Resources

- [DuckDB Discord](https://discord.duckdb.org/) - Community chat and support
- [DuckDB Twitter/X](https://twitter.com/daborosgram) - Updates from the team
- [Awesome DuckDB](https://github.com/davidgasquez/awesome-duckdb) - Curated list of resources

### Related Technologies

- [Apache Parquet](https://parquet.apache.org/) - Columnar file format
- [Apache Arrow](https://arrow.apache.org/) - In-memory columnar format
- [Polars](https://pola.rs/) - Fast DataFrame library (uses similar concepts)

By understanding DuckDB's architecture and capabilities, you can leverage its power for efficient analytical workloads while avoiding common pitfalls that could impact performance.
