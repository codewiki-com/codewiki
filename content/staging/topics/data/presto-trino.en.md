---
title: Presto/Trino Distributed SQL Engine
description: Use Presto/Trino for interactive analytics
track: data
section: analytics-engines
difficulty: intermediate
tags:
  - Presto
  - Trino
  - SQL
  - distributed query
status: imported
origin: old/src/content/docs/data/presto-trino.en.md
divergence: 0.078
issues: []
legacy:
  category: Data
  subcategory: Query Engine
  order: 22
  lastUpdated: 2026-01-07
---

Presto and Trino are open-source distributed SQL query engines designed for running interactive analytic queries against data sources of all sizes. They enable querying data where it lives, including Hive, Cassandra, relational databases, and even proprietary data stores, without the need for complex ETL processes.

## Understanding Presto and Trino

### History and Relationship

Presto was originally developed at Facebook in 2012 to address the need for interactive queries on their massive data warehouse. In 2019, the original creators of Presto left Facebook and forked the project, renaming it **Trino** (formerly known as PrestoSQL). Meanwhile, Facebook continued developing their version under the **PrestoDB** umbrella.

**Key Differences:**

| Aspect | Trino (PrestoSQL) | PrestoDB |
|--------|-------------------|----------|
| Governance | Linux Foundation | Presto Foundation |
| Development | Original creators | Facebook-led |
| Release Cadence | More frequent | Less frequent |
| Community | Broader adoption | Enterprise focus |
| Connectors | More diverse | Hadoop ecosystem focus |

For most new deployments, **Trino is recommended** due to its active development and broader community support. This guide uses Trino syntax and features, though concepts apply to both.

### Use Cases

Presto/Trino excels in scenarios requiring:

1. **Interactive Analytics**: Sub-second to minute-level queries on petabyte-scale data
2. **Data Lake Queries**: Querying data directly in object storage (S3, HDFS, GCS)
3. **Federated Queries**: Joining data across multiple heterogeneous data sources
4. **Ad-hoc Exploration**: Data scientists and analysts exploring datasets
5. **BI Tool Integration**: Backend for dashboards and reporting tools

---

## Architecture Overview

### Component Architecture

Trino follows a massively parallel processing (MPP) architecture with two main components:

```
                    +------------------+
                    |   Coordinator    |
                    |  (Query Planning |
                    |   & Scheduling)  |
                    +--------+---------+
                             |
            +----------------+----------------+
            |                |                |
    +-------v------+ +-------v------+ +-------v------+
    |    Worker    | |    Worker    | |    Worker    |
    |   Node 1     | |   Node 2     | |   Node N     |
    | +---------+  | | +---------+  | | +---------+  |
    | |Connector|  | | |Connector|  | | |Connector|  |
    | |  Hive   |  | | |  MySQL  |  | | |  S3     |  |
    | +---------+  | | +---------+  | | +---------+  |
    +-------+------+ +-------+------+ +-------+------+
            |                |                |
            v                v                v
    [Hive Metastore]   [MySQL DB]     [S3 Bucket]
```

### Core Components

**Coordinator Node:**
- Parses SQL queries and creates query plans
- Manages metadata and statistics
- Schedules tasks across worker nodes
- Serves client connections (CLI, JDBC, HTTP)

**Worker Nodes:**
- Execute tasks assigned by the coordinator
- Process data in parallel
- Exchange intermediate results
- Scale horizontally for performance

**Connectors:**
- Plugins that enable communication with data sources
- Handle metadata retrieval and data access
- Translate Trino operations to source-specific operations

### Query Execution Flow

1. **Query Submission**: Client submits SQL query to coordinator
2. **Parsing**: Query is parsed into an abstract syntax tree (AST)
3. **Analysis**: Semantic analysis validates tables, columns, and types
4. **Planning**: Logical plan created and optimized
5. **Scheduling**: Plan distributed across workers as stages and tasks
6. **Execution**: Workers process data in parallel
7. **Aggregation**: Results collected and returned to client

---

## Installation and Configuration

### Docker-based Setup

The quickest way to get started with Trino:

```bash
# Pull the official Trino image
docker pull trinodb/trino:latest

# Run a single-node Trino cluster
docker run -d --name trino \
    -p 8080:8080 \
    trinodb/trino:latest

# Access the Trino CLI
docker exec -it trino trino
```

### Production Configuration

For production deployments, configure the following files:

**config.properties (Coordinator):**

```properties
coordinator=true
node-scheduler.include-coordinator=false
http-server.http.port=8080
query.max-memory=50GB
query.max-memory-per-node=1GB
query.max-total-memory-per-node=2GB
discovery.uri=http://coordinator:8080
```

**config.properties (Worker):**

```properties
coordinator=false
http-server.http.port=8080
query.max-memory=50GB
query.max-memory-per-node=1GB
query.max-total-memory-per-node=2GB
discovery.uri=http://coordinator:8080
```

**jvm.config:**

```
-server
-Xmx16G
-XX:InitialRAMPercentage=80
-XX:MaxRAMPercentage=80
-XX:G1HeapRegionSize=32M
-XX:+ExplicitGCInvokesConcurrent
-XX:+ExitOnOutOfMemoryError
-XX:+HeapDumpOnOutOfMemoryError
-XX:-OmitStackTraceInFastThrow
-XX:ReservedCodeCacheSize=512M
-XX:PerMethodRecompilationCutoff=10000
-XX:PerBytecodeRecompilationCutoff=10000
-Djdk.attach.allowAttachSelf=true
-Djdk.nio.maxCachedBufferSize=2000000
```

**node.properties:**

```properties
node.environment=production
node.id=unique-node-id
node.data-dir=/var/trino/data
```

---

## Connectors

Connectors are the bridge between Trino and your data sources. Each connector is configured in a catalog properties file under `/etc/trino/catalog/`.

### Hive Connector

The most commonly used connector for data lake access:

**hive.properties:**

```properties
connector.name=hive
hive.metastore.uri=thrift://metastore:9083
hive.config.resources=/etc/hadoop/core-site.xml,/etc/hadoop/hdfs-site.xml

# S3 configuration
hive.s3.path-style-access=true
hive.s3.endpoint=https://s3.amazonaws.com
hive.s3.aws-access-key=${ENV:AWS_ACCESS_KEY}
hive.s3.aws-secret-key=${ENV:AWS_SECRET_KEY}

# Performance tuning
hive.max-partitions-per-scan=100000
hive.max-split-size=64MB
hive.allow-drop-table=true
```

**Querying Hive tables:**

```sql
-- List schemas in the Hive catalog
SHOW SCHEMAS FROM hive;

-- Use a specific schema
USE hive.analytics;

-- Query a partitioned table
SELECT
    date_trunc('month', event_date) AS month,
    COUNT(*) AS event_count
FROM events
WHERE event_date >= DATE '2024-01-01'
GROUP BY 1
ORDER BY 1;
```

### PostgreSQL Connector

Connect to PostgreSQL databases:

**postgresql.properties:**

```properties
connector.name=postgresql
connection-url=jdbc:postgresql://postgres-host:5432/database
connection-user=trino_user
connection-password=${ENV:POSTGRES_PASSWORD}

# Connection pool settings
postgresql.connection-pool.max-size=30
postgresql.connection-pool.min-size=10
```

**Querying PostgreSQL:**

```sql
-- List tables
SHOW TABLES FROM postgresql.public;

-- Query with pushdown (filters execute on PostgreSQL)
SELECT customer_id, SUM(amount) AS total_spend
FROM postgresql.sales.orders
WHERE order_date >= DATE '2024-01-01'
GROUP BY customer_id;
```

### MySQL Connector

**mysql.properties:**

```properties
connector.name=mysql
connection-url=jdbc:mysql://mysql-host:3306
connection-user=trino_user
connection-password=${ENV:MYSQL_PASSWORD}

# Enable SSL
mysql.ssl.enabled=true
mysql.ssl.verify-server-certificate=true
```

### Iceberg Connector

For modern data lakehouse architectures:

**iceberg.properties:**

```properties
connector.name=iceberg
iceberg.catalog.type=hive_metastore
hive.metastore.uri=thrift://metastore:9083
iceberg.file-format=PARQUET

# S3 configuration
hive.s3.endpoint=https://s3.amazonaws.com
hive.s3.aws-access-key=${ENV:AWS_ACCESS_KEY}
hive.s3.aws-secret-key=${ENV:AWS_SECRET_KEY}
```

**Iceberg-specific features:**

```sql
-- Time travel queries
SELECT * FROM iceberg.warehouse.orders
FOR VERSION AS OF 12345678901234567890;

-- Query at a specific timestamp
SELECT * FROM iceberg.warehouse.orders
FOR TIMESTAMP AS OF TIMESTAMP '2024-01-15 10:00:00';

-- View table history
SELECT * FROM iceberg.warehouse."orders$snapshots";

-- View table partitions
SELECT * FROM iceberg.warehouse."orders$partitions";
```

### Delta Lake Connector

**delta.properties:**

```properties
connector.name=delta_lake
hive.metastore.uri=thrift://metastore:9083
delta.enable-non-concurrent-writes=true
```

### Memory Connector

Useful for testing and temporary tables:

**memory.properties:**

```properties
connector.name=memory
memory.max-data-per-node=128MB
```

```sql
-- Create a temporary table in memory
CREATE TABLE memory.default.temp_results AS
SELECT * FROM hive.analytics.large_table
WHERE important_flag = true;
```

---

## SQL Dialect and Syntax

### Standard SQL Support

Trino supports ANSI SQL with extensions. Most standard SQL operations work as expected:

```sql
-- Basic SELECT with common clauses
SELECT
    category,
    COUNT(*) AS item_count,
    SUM(price) AS total_value,
    AVG(price) AS avg_price
FROM products
WHERE status = 'active'
GROUP BY category
HAVING COUNT(*) > 10
ORDER BY total_value DESC
LIMIT 100;
```

### Data Types

Trino provides a rich set of data types:

```sql
-- Numeric types
SELECT
    CAST(123 AS TINYINT),           -- 1 byte
    CAST(123 AS SMALLINT),          -- 2 bytes
    CAST(123 AS INTEGER),           -- 4 bytes
    CAST(123 AS BIGINT),            -- 8 bytes
    CAST(123.45 AS REAL),           -- 4-byte floating point
    CAST(123.45 AS DOUBLE),         -- 8-byte floating point
    CAST(123.45 AS DECIMAL(10,2));  -- Fixed precision

-- String types
SELECT
    CAST('hello' AS VARCHAR(100)),
    CAST('hello' AS CHAR(10)),
    CAST('hello' AS VARBINARY);

-- Date/Time types
SELECT
    DATE '2024-01-15',
    TIME '10:30:00',
    TIMESTAMP '2024-01-15 10:30:00',
    TIMESTAMP '2024-01-15 10:30:00 UTC' AT TIME ZONE 'America/New_York';

-- Complex types
SELECT
    ARRAY[1, 2, 3],
    MAP(ARRAY['a', 'b'], ARRAY[1, 2]),
    ROW(1, 'hello', true);
```

### Window Functions

Trino has excellent window function support:

```sql
-- Ranking functions
SELECT
    product_id,
    category,
    sales,
    ROW_NUMBER() OVER (PARTITION BY category ORDER BY sales DESC) AS row_num,
    RANK() OVER (PARTITION BY category ORDER BY sales DESC) AS rank,
    DENSE_RANK() OVER (PARTITION BY category ORDER BY sales DESC) AS dense_rank,
    NTILE(4) OVER (PARTITION BY category ORDER BY sales DESC) AS quartile
FROM product_sales;

-- Analytic functions
SELECT
    order_date,
    daily_revenue,
    SUM(daily_revenue) OVER (ORDER BY order_date) AS running_total,
    AVG(daily_revenue) OVER (
        ORDER BY order_date
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) AS moving_avg_7day,
    LAG(daily_revenue, 1) OVER (ORDER BY order_date) AS prev_day_revenue,
    LEAD(daily_revenue, 1) OVER (ORDER BY order_date) AS next_day_revenue,
    FIRST_VALUE(daily_revenue) OVER (
        PARTITION BY date_trunc('month', order_date)
        ORDER BY order_date
    ) AS month_first_day_revenue
FROM daily_sales;
```

### Common Table Expressions (CTEs)

```sql
-- Standard CTE
WITH monthly_sales AS (
    SELECT
        date_trunc('month', sale_date) AS month,
        SUM(amount) AS total_sales
    FROM sales
    GROUP BY 1
),
sales_with_growth AS (
    SELECT
        month,
        total_sales,
        LAG(total_sales) OVER (ORDER BY month) AS prev_month_sales,
        (total_sales - LAG(total_sales) OVER (ORDER BY month)) /
            NULLIF(LAG(total_sales) OVER (ORDER BY month), 0) * 100 AS growth_pct
    FROM monthly_sales
)
SELECT * FROM sales_with_growth
WHERE growth_pct IS NOT NULL
ORDER BY month;

-- Recursive CTE for hierarchical data
WITH RECURSIVE org_hierarchy AS (
    -- Anchor: top-level employees
    SELECT
        employee_id,
        name,
        manager_id,
        1 AS level,
        CAST(name AS VARCHAR) AS path
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Recursive: subordinates
    SELECT
        e.employee_id,
        e.name,
        e.manager_id,
        h.level + 1,
        CAST(h.path || ' > ' || e.name AS VARCHAR)
    FROM employees e
    INNER JOIN org_hierarchy h ON e.manager_id = h.employee_id
    WHERE h.level < 10  -- Safety limit
)
SELECT * FROM org_hierarchy
ORDER BY level, name;
```

### Array and Map Functions

```sql
-- Array operations
SELECT
    arr,
    cardinality(arr) AS size,
    arr[1] AS first_element,
    contains(arr, 'target') AS has_target,
    array_join(arr, ', ') AS joined,
    transform(arr, x -> upper(x)) AS uppercased,
    filter(arr, x -> length(x) > 3) AS long_strings
FROM (SELECT ARRAY['apple', 'banana', 'cherry'] AS arr);

-- Map operations
SELECT
    m,
    map_keys(m) AS keys,
    map_values(m) AS values,
    m['key1'] AS value_for_key1,
    element_at(m, 'key2') AS safe_access,
    map_filter(m, (k, v) -> v > 10) AS filtered_map
FROM (SELECT MAP(ARRAY['key1', 'key2'], ARRAY[5, 15]) AS m);

-- Unnesting arrays
SELECT
    order_id,
    item.product_id,
    item.quantity
FROM orders
CROSS JOIN UNNEST(items) AS t(item);

-- Aggregating into arrays
SELECT
    customer_id,
    array_agg(product_id ORDER BY purchase_date) AS purchase_history
FROM purchases
GROUP BY customer_id;
```

### JSON Functions

```sql
-- Parse JSON
SELECT
    json_extract(json_data, '$.name') AS name,
    json_extract_scalar(json_data, '$.age') AS age,
    json_array_get(json_data, 0) AS first_element
FROM (SELECT '{"name": "John", "age": 30}' AS json_data);

-- JSON path queries
SELECT
    json_extract(response, '$.data.users[*].name') AS user_names,
    json_array_length(json_extract(response, '$.data.users')) AS user_count
FROM api_responses;

-- Build JSON
SELECT
    json_object('name': name, 'value': amount) AS json_output
FROM metrics;
```

---

## Federated Queries

One of Trino's most powerful features is the ability to join data across multiple data sources in a single query.

### Cross-Catalog Joins

```sql
-- Join data from Hive (data lake) and PostgreSQL (operational DB)
SELECT
    o.order_id,
    o.order_date,
    o.amount,
    c.customer_name,
    c.email,
    p.product_name,
    p.category
FROM hive.sales.orders o
JOIN postgresql.public.customers c
    ON o.customer_id = c.customer_id
JOIN mysql.inventory.products p
    ON o.product_id = p.product_id
WHERE o.order_date >= DATE '2024-01-01';
```

### Federation Patterns

**Pattern 1: Enrich Data Lake with Operational Data**

```sql
-- Enrich clickstream data with user profile information
WITH clickstream AS (
    SELECT
        user_id,
        session_id,
        page_url,
        event_timestamp
    FROM hive.analytics.clickstream
    WHERE event_date = CURRENT_DATE
)
SELECT
    c.*,
    u.username,
    u.account_type,
    u.signup_date
FROM clickstream c
LEFT JOIN postgresql.users.profiles u
    ON c.user_id = u.user_id;
```

**Pattern 2: Validate Data Across Systems**

```sql
-- Find orders in the data warehouse missing from source system
SELECT
    dw.order_id,
    dw.amount,
    dw.order_date
FROM hive.warehouse.fact_orders dw
LEFT JOIN mysql.erp.orders src
    ON dw.order_id = src.order_id
WHERE src.order_id IS NULL
    AND dw.order_date >= DATE '2024-01-01';
```

**Pattern 3: Real-time + Historical Analysis**

```sql
-- Combine real-time metrics with historical trends
WITH current_metrics AS (
    SELECT
        metric_name,
        metric_value,
        recorded_at
    FROM postgresql.monitoring.current_metrics
    WHERE recorded_at >= NOW() - INTERVAL '1' HOUR
),
historical_baseline AS (
    SELECT
        metric_name,
        AVG(metric_value) AS avg_value,
        STDDEV(metric_value) AS stddev_value
    FROM hive.analytics.metric_history
    WHERE recorded_date >= CURRENT_DATE - INTERVAL '30' DAY
    GROUP BY metric_name
)
SELECT
    c.metric_name,
    c.metric_value AS current_value,
    h.avg_value AS baseline_avg,
    (c.metric_value - h.avg_value) / NULLIF(h.stddev_value, 0) AS z_score
FROM current_metrics c
JOIN historical_baseline h ON c.metric_name = h.metric_name
WHERE ABS((c.metric_value - h.avg_value) / NULLIF(h.stddev_value, 0)) > 2;
```

### Best Practices for Federated Queries

1. **Push Down Predicates**: Filter data at the source when possible
2. **Minimize Data Transfer**: Select only needed columns
3. **Use Appropriate Join Order**: Put smaller datasets on the right side
4. **Consider Materialization**: For frequently joined reference data

```sql
-- Good: Filter pushdown works
SELECT * FROM postgresql.public.orders
WHERE order_date >= DATE '2024-01-01';  -- Executed on PostgreSQL

-- Better: Create a local copy for frequently used reference data
CREATE TABLE memory.default.product_catalog AS
SELECT product_id, name, category
FROM mysql.inventory.products;

-- Then join with the local copy
SELECT o.*, p.name, p.category
FROM hive.sales.orders o
JOIN memory.default.product_catalog p
    ON o.product_id = p.product_id;
```

---

## Performance Optimization

### Understanding Query Performance

Use `EXPLAIN` and `EXPLAIN ANALYZE` to understand query execution:

```sql
-- Show logical plan
EXPLAIN
SELECT category, COUNT(*)
FROM products
GROUP BY category;

-- Show distributed plan
EXPLAIN (TYPE DISTRIBUTED)
SELECT category, COUNT(*)
FROM products
GROUP BY category;

-- Execute and show actual statistics
EXPLAIN ANALYZE
SELECT category, COUNT(*)
FROM products
GROUP BY category;
```

### Key Performance Concepts

**Stages and Tasks:**
- Queries are divided into stages that run in parallel
- Each stage contains multiple tasks distributed across workers
- Stages are connected by exchanges (data shuffles)

**Data Distribution:**
- HASH: Redistribute data based on hash of columns
- BROADCAST: Send entire dataset to all nodes
- SINGLE: Collect all data to one node

### Optimization Techniques

#### Predicate Pushdown

Push filters to data sources to minimize data scanning:

```sql
-- Good: Partition pruning and predicate pushdown
SELECT *
FROM hive.sales.orders
WHERE order_date >= DATE '2024-01-01'  -- Partition column
    AND status = 'completed';           -- Pushed to source

-- Verify pushdown with EXPLAIN
EXPLAIN
SELECT * FROM postgresql.public.customers
WHERE region = 'APAC' AND created_at >= DATE '2024-01-01';
```

#### Join Optimization

```sql
-- Use broadcast join for small tables
SELECT /*+ BROADCAST(dim) */ *
FROM large_fact_table fact
JOIN small_dimension_table dim
    ON fact.dim_key = dim.id;

-- Reorder joins to filter early
WITH filtered_orders AS (
    SELECT * FROM orders
    WHERE order_date >= DATE '2024-01-01'
        AND status = 'active'
)
SELECT fo.*, c.name
FROM filtered_orders fo
JOIN customers c ON fo.customer_id = c.id;
```

#### Partition and Bucket Pruning

```sql
-- Create partitioned table in Hive
CREATE TABLE hive.analytics.events (
    event_id BIGINT,
    user_id BIGINT,
    event_type VARCHAR,
    event_timestamp TIMESTAMP
)
WITH (
    format = 'PARQUET',
    partitioned_by = ARRAY['event_date'],
    bucketed_by = ARRAY['user_id'],
    bucket_count = 64
);

-- Queries benefit from partition pruning
SELECT * FROM hive.analytics.events
WHERE event_date = DATE '2024-01-15'  -- Only scans one partition
    AND user_id = 12345;               -- Bucket pruning
```

#### Column Pruning and Projection

```sql
-- Bad: SELECT * scans all columns
SELECT * FROM wide_table;

-- Good: Select only needed columns
SELECT column1, column2, column3
FROM wide_table;
```

#### Aggregation Optimization

```sql
-- Use approximate functions for large datasets when exact results aren't needed
SELECT
    approx_distinct(user_id) AS unique_users,    -- vs COUNT(DISTINCT user_id)
    approx_percentile(latency, 0.99) AS p99      -- vs exact percentile
FROM request_logs;

-- Pre-aggregate when possible
WITH daily_stats AS (
    SELECT
        event_date,
        event_type,
        COUNT(*) AS event_count
    FROM events
    GROUP BY event_date, event_type
)
SELECT
    date_trunc('month', event_date) AS month,
    SUM(event_count) AS monthly_events
FROM daily_stats
GROUP BY 1;
```

### Session and Query Properties

Tune performance with session properties:

```sql
-- Set session properties
SET SESSION query_max_memory = '10GB';
SET SESSION join_reordering_strategy = 'AUTOMATIC';
SET SESSION join_distribution_type = 'AUTOMATIC';
SET SESSION task_concurrency = 16;

-- Connector-specific properties
SET SESSION hive.parquet_use_column_index = true;
SET SESSION hive.pushdown_filter_enabled = true;

-- View current settings
SHOW SESSION;
```

### Monitoring and Diagnostics

Access the Trino Web UI at `http://coordinator:8080` for:

- Active and completed queries
- Query execution details and stages
- Worker node status
- Resource utilization

Query system tables for programmatic monitoring:

```sql
-- View running queries
SELECT
    query_id,
    state,
    user,
    query,
    created,
    elapsed_time
FROM system.runtime.queries
WHERE state = 'RUNNING';

-- Analyze completed queries
SELECT
    query_id,
    execution_time,
    total_cpu_time,
    peak_memory_bytes / 1024 / 1024 AS peak_memory_mb,
    total_bytes_read / 1024 / 1024 AS data_read_mb
FROM system.runtime.queries
WHERE state = 'FINISHED'
    AND created >= NOW() - INTERVAL '1' HOUR
ORDER BY total_cpu_time DESC
LIMIT 10;
```

---

## Security

### Authentication

Trino supports multiple authentication mechanisms:

**Password Authentication (LDAP):**

```properties
# config.properties
http-server.authentication.type=PASSWORD
```

```properties
# password-authenticator.properties
password-authenticator.name=ldap
ldap.url=ldaps://ldap-server:636
ldap.user-bind-pattern=${USER}@company.com
```

**Kerberos Authentication:**

```properties
http-server.authentication.type=KERBEROS
http.server.authentication.krb5.service-name=trino
http.server.authentication.krb5.keytab=/etc/trino/trino.keytab
http.authentication.krb5.config=/etc/krb5.conf
```

### Authorization

**File-based Access Control:**

```json
{
  "catalogs": [
    {
      "catalog": "hive",
      "allow": "all"
    },
    {
      "catalog": "postgresql",
      "allow": "read-only"
    }
  ],
  "schemas": [
    {
      "catalog": "hive",
      "schema": "sensitive_data",
      "owner": false
    }
  ],
  "tables": [
    {
      "catalog": "hive",
      "schema": ".*",
      "table": ".*_pii",
      "privileges": []
    }
  ]
}
```

**Column Masking:**

```sql
-- With appropriate authorizer configured
CREATE VIEW masked_customers AS
SELECT
    customer_id,
    name,
    CASE
        WHEN current_user IN ('admin', 'analyst')
        THEN email
        ELSE regexp_replace(email, '.+@', '***@')
    END AS email,
    CASE
        WHEN current_user = 'admin'
        THEN ssn
        ELSE 'XXX-XX-' || substr(ssn, 8)
    END AS ssn
FROM customers;
```

---

## Integration Patterns

### BI Tool Integration

Most BI tools connect via JDBC or ODBC:

**JDBC Connection String:**

```
jdbc:trino://coordinator:8080/hive/analytics
```

**Common BI Tools:**
- Tableau: Native Presto connector
- Looker: JDBC connection
- Superset: SQLAlchemy connection
- Metabase: Presto driver

### Programmatic Access

**Python with trino-python-client:**

```python
from trino.dbapi import connect
from trino.auth import BasicAuthentication

conn = connect(
    host='coordinator',
    port=8080,
    user='analyst',
    catalog='hive',
    schema='analytics',
    auth=BasicAuthentication('analyst', 'password'),
)

cursor = conn.cursor()
cursor.execute('''
    SELECT category, COUNT(*) as count
    FROM products
    GROUP BY category
    ORDER BY count DESC
''')

for row in cursor.fetchall():
    print(row)
```

**Using Pandas:**

```python
import pandas as pd
from sqlalchemy import create_engine

engine = create_engine(
    'trino://analyst:password@coordinator:8080/hive/analytics'
)

df = pd.read_sql('''
    SELECT *
    FROM daily_metrics
    WHERE metric_date >= DATE '2024-01-01'
''', engine)

print(df.describe())
```

### Data Pipeline Integration

**Apache Airflow Operator:**

```python
from airflow.providers.trino.operators.trino import TrinoOperator

refresh_summary = TrinoOperator(
    task_id='refresh_daily_summary',
    trino_conn_id='trino_default',
    sql='''
        INSERT INTO summary_table
        SELECT
            CURRENT_DATE - INTERVAL '1' DAY as summary_date,
            COUNT(*) as total_events
        FROM events
        WHERE event_date = CURRENT_DATE - INTERVAL '1' DAY
    ''',
)
```

---

## Common Patterns and Best Practices

### ETL with Trino

```sql
-- Incremental load pattern
INSERT INTO target_table
SELECT
    source.id,
    source.data,
    CURRENT_TIMESTAMP AS load_timestamp
FROM source_table source
LEFT JOIN target_table target
    ON source.id = target.id
WHERE target.id IS NULL
   OR source.updated_at > target.load_timestamp;

-- SCD Type 2 pattern
MERGE INTO dim_customer AS target
USING (
    SELECT * FROM staging_customer
    WHERE batch_id = 123
) AS source
ON target.customer_id = source.customer_id
    AND target.is_current = true
WHEN MATCHED AND (
    target.email != source.email
    OR target.address != source.address
)
THEN UPDATE SET
    is_current = false,
    end_date = CURRENT_TIMESTAMP
WHEN NOT MATCHED
THEN INSERT (customer_id, email, address, start_date, is_current)
     VALUES (source.customer_id, source.email, source.address,
             CURRENT_TIMESTAMP, true);
```

### Data Quality Checks

```sql
-- Null check
SELECT
    'null_check' AS check_type,
    COUNT(*) AS total_rows,
    COUNT(required_column) AS non_null_rows,
    COUNT(*) - COUNT(required_column) AS null_count
FROM target_table
WHERE load_date = CURRENT_DATE;

-- Uniqueness check
SELECT
    'uniqueness_check' AS check_type,
    COUNT(*) AS total_rows,
    COUNT(DISTINCT primary_key) AS unique_keys,
    COUNT(*) - COUNT(DISTINCT primary_key) AS duplicate_count
FROM target_table;

-- Referential integrity
SELECT
    'referential_integrity' AS check_type,
    COUNT(*) AS orphan_records
FROM fact_table f
LEFT JOIN dim_table d ON f.dim_key = d.id
WHERE d.id IS NULL;
```

### Debugging Tips

```sql
-- Check table statistics
SHOW STATS FOR hive.analytics.large_table;

-- Analyze table to update statistics
ANALYZE hive.analytics.large_table;

-- View table properties
SHOW CREATE TABLE hive.analytics.events;

-- Check connector status
SELECT * FROM system.runtime.nodes;

-- Kill a problematic query
CALL system.runtime.kill_query('query_id', 'Too resource intensive');
```

---

## Interview Topics

### Frequently Asked Questions

**Q1: What is the difference between Presto and Trino?**

A: Trino is a fork of Presto created by its original founders. Key differences:
- Trino has more frequent releases and active development
- Different governance (Linux Foundation vs Presto Foundation)
- Trino has more connectors and features
- Both share the same core architecture and SQL capabilities

**Q2: How does Trino achieve high query performance?**

A: Trino achieves performance through:
- In-memory pipelined execution (no intermediate disk writes)
- Vectorized processing of columnar data
- Dynamic code generation and optimization
- Parallel execution across multiple worker nodes
- Intelligent query planning with cost-based optimization
- Predicate and projection pushdown to connectors

**Q3: When would you use Trino vs Spark SQL?**

| Trino | Spark SQL |
|-------|-----------|
| Interactive queries (seconds to minutes) | Batch processing (minutes to hours) |
| Ad-hoc analytics | Complex ETL pipelines |
| Federated queries | Machine learning workflows |
| BI tool backend | Large-scale transformations |
| Low latency requirements | Iterative algorithms |

**Q4: How do you optimize a slow Trino query?**

1. Use `EXPLAIN ANALYZE` to identify bottlenecks
2. Ensure partition pruning is working
3. Check for data skew in joins
4. Use broadcast joins for small dimension tables
5. Add appropriate filters early in the query
6. Select only necessary columns
7. Consider approximate functions for aggregations
8. Update table statistics with `ANALYZE`

**Q5: Explain the connector architecture.**

A: Connectors are plugins that provide:
- **Metadata operations**: Schema, table, column information
- **Data access**: Reading and optionally writing data
- **Pushdown capabilities**: Predicates, projections, aggregations
- **Type mapping**: Converting between Trino and source types

Each connector implements the Connector SPI (Service Provider Interface) and is configured via catalog properties files.

---

## Further Reading

### Official Documentation

- [Trino Documentation](https://trino.io/docs/current/) - Comprehensive official guide
- [Trino GitHub Repository](https://github.com/trinodb/trino) - Source code and issues
- [PrestoDB Documentation](https://prestodb.io/docs/current/) - Facebook's Presto fork

### Books and Resources

- **"Trino: The Definitive Guide"** - O'Reilly, comprehensive coverage of Trino
- **"Learning and Operating Presto"** - Practical guide to running Presto
- [Trino Community Slack](https://trino.io/slack.html) - Active community support

### Related Technologies

- **Apache Iceberg**: Modern table format with Trino integration
- **Delta Lake**: Lakehouse storage layer
- **Apache Hive**: Metadata management and SQL interface
- **Apache Spark**: Complementary batch processing engine
- **dbt**: SQL transformation framework compatible with Trino

### Practice Resources

- [Trino Getting Started Tutorial](https://trino.io/docs/current/getting-started.html)
- [Trino Community Resources](https://trino.io/community.html)
- [Starburst Academy](https://academy.starburst.io/) - Free Trino courses

---

> **Summary**: Presto/Trino provides a powerful platform for interactive analytics across diverse data sources. Its federated query capabilities enable joining data from data lakes, databases, and other systems without ETL. Understanding the architecture, connector ecosystem, SQL dialect, and optimization techniques is essential for building efficient analytical workloads. As data architectures evolve toward data mesh and lakehouse patterns, Trino's role as a universal query layer continues to grow in importance.
