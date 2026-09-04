---
title: ClickHouse Columnar Database
description: Learn ClickHouse for real-time analytics
track: data
section: analytics-engines
difficulty: intermediate
tags:
  - ClickHouse
  - columnar storage
  - OLAP
  - real-time analytics
status: imported
origin: old/src/content/docs/data/clickhouse.en.md
divergence: 0.226
issues: []
legacy:
  category: Data
  subcategory: Databases
  order: 19
  lastUpdated: 2026-01-07
---

ClickHouse is an open-source column-oriented database management system designed for online analytical processing (OLAP). Developed by Yandex, it excels at processing billions of rows and petabytes of data with sub-second query performance. We'll cover ClickHouse's architecture, core concepts, and best practices for building high-performance analytics systems.

## Introduction to ClickHouse

### What is ClickHouse?

ClickHouse is a column-oriented database designed for real-time analytics. Unlike traditional row-based databases (MySQL, PostgreSQL), ClickHouse stores data by columns, making it exceptionally efficient for analytical queries that typically access a subset of columns across many rows.

**Key characteristics:**

- **Blazing Fast**: Can process billions of rows per second on a single server
- **Column-Oriented Storage**: Only reads columns needed for queries
- **Real-Time Ingestion**: Handles millions of inserts per second
- **SQL Compatible**: Standard SQL with powerful analytical extensions
- **Horizontally Scalable**: Linear scaling across clusters
- **Open Source**: Free to use under Apache 2.0 license

### Column-Oriented vs Row-Oriented Storage

Understanding the fundamental difference between column and row storage is crucial:

```
Row-Oriented Storage (e.g., MySQL):
+----+--------+-----+--------+
| id | name   | age | salary |
+----+--------+-----+--------+
| 1  | Alice  | 30  | 50000  |
| 2  | Bob    | 25  | 45000  |
| 3  | Carol  | 35  | 60000  |
+----+--------+-----+--------+
Storage: [1,Alice,30,50000][2,Bob,25,45000][3,Carol,35,60000]

Column-Oriented Storage (ClickHouse):
+----+----+----+
| id | id | id |
+----+----+----+
| 1  | 2  | 3  |
+----+----+----+
Storage: [1,2,3][Alice,Bob,Carol][30,25,35][50000,45000,60000]
```

**Benefits of columnar storage for analytics:**

| Aspect | Row-Oriented | Column-Oriented |
|--------|--------------|-----------------|
| Query: SELECT AVG(salary) | Reads all columns | Reads only salary column |
| Compression | Limited (mixed types) | Excellent (same type per column) |
| Aggregations | Slower | Much faster |
| Point lookups | Fast | Slower |
| Insert single row | Fast | Slower |
| Bulk inserts | Moderate | Very fast |

### When to Use ClickHouse

**Ideal use cases:**

- Web and app analytics (clickstream, user behavior)
- Log analysis and monitoring
- Business intelligence and reporting
- Time-series data analysis
- Financial data aggregation
- IoT sensor data processing
- Ad tech and real-time bidding

**Not ideal for:**

- OLTP workloads (frequent single-row updates)
- Transaction processing requiring ACID
- Key-value lookups
- Small datasets (< millions of rows)
- Highly normalized relational data

## Getting Started

### Installation

```bash
# Ubuntu/Debian
sudo apt-get install -y apt-transport-https ca-certificates dirmngr
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 8919F6BD2B48D754
echo "deb https://packages.clickhouse.com/deb stable main" | sudo tee /etc/apt/sources.list.d/clickhouse.list
sudo apt-get update
sudo apt-get install -y clickhouse-server clickhouse-client

# Start the server
sudo service clickhouse-server start

# Connect with client
clickhouse-client

# Docker
docker run -d --name clickhouse-server \
    -p 8123:8123 -p 9000:9000 \
    -v clickhouse_data:/var/lib/clickhouse \
    clickhouse/clickhouse-server

# Connect to Docker container
docker exec -it clickhouse-server clickhouse-client
```

### Basic Configuration

```xml
<!-- /etc/clickhouse-server/config.xml -->
<clickhouse>
    <logger>
        <level>information</level>
        <log>/var/log/clickhouse-server/clickhouse-server.log</log>
        <errorlog>/var/log/clickhouse-server/clickhouse-server.err.log</errorlog>
        <size>1000M</size>
        <count>10</count>
    </logger>

    <http_port>8123</http_port>
    <tcp_port>9000</tcp_port>
    <mysql_port>9004</mysql_port>

    <max_connections>4096</max_connections>
    <keep_alive_timeout>3</keep_alive_timeout>
    <max_concurrent_queries>100</max_concurrent_queries>

    <path>/var/lib/clickhouse/</path>
    <tmp_path>/var/lib/clickhouse/tmp/</tmp_path>
    <user_files_path>/var/lib/clickhouse/user_files/</user_files_path>

    <mark_cache_size>5368709120</mark_cache_size>
    <mmap_cache_size>1073741824</mmap_cache_size>
</clickhouse>
```

### First Queries

```sql
-- Connect and check version
SELECT version();

-- List databases
SHOW DATABASES;

-- Create a database
CREATE DATABASE IF NOT EXISTS analytics;

-- Use the database
USE analytics;

-- Create a simple table
CREATE TABLE events (
    event_date Date,
    event_time DateTime,
    user_id UInt64,
    event_type String,
    page_url String,
    duration_ms UInt32
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_date, user_id, event_time);

-- Insert sample data
INSERT INTO events VALUES
    ('2024-01-15', '2024-01-15 10:30:00', 1001, 'page_view', '/home', 1500),
    ('2024-01-15', '2024-01-15 10:31:00', 1001, 'click', '/products', 200),
    ('2024-01-15', '2024-01-15 10:32:00', 1002, 'page_view', '/home', 2000),
    ('2024-01-15', '2024-01-15 11:00:00', 1001, 'purchase', '/checkout', 5000);

-- Query the data
SELECT
    event_type,
    COUNT(*) AS event_count,
    AVG(duration_ms) AS avg_duration
FROM events
GROUP BY event_type
ORDER BY event_count DESC;
```

## Data Types

### Numeric Types

```sql
-- Integer types (signed and unsigned)
CREATE TABLE numeric_examples (
    tiny_signed Int8,        -- -128 to 127
    tiny_unsigned UInt8,     -- 0 to 255
    small_signed Int16,      -- -32768 to 32767
    small_unsigned UInt16,   -- 0 to 65535
    int_signed Int32,        -- -2^31 to 2^31-1
    int_unsigned UInt32,     -- 0 to 2^32-1
    big_signed Int64,        -- -2^63 to 2^63-1
    big_unsigned UInt64,     -- 0 to 2^64-1
    huge_signed Int128,      -- Very large integers
    huge_unsigned UInt128,
    massive_signed Int256,
    massive_unsigned UInt256
) ENGINE = MergeTree() ORDER BY tiny_signed;

-- Floating point types
CREATE TABLE float_examples (
    float_32 Float32,        -- Single precision
    float_64 Float64,        -- Double precision (recommended)
    decimal_val Decimal(18, 4),  -- Fixed precision: 18 total digits, 4 decimal
    decimal32 Decimal32(4),  -- Up to 9 digits, 4 decimal
    decimal64 Decimal64(8),  -- Up to 18 digits, 8 decimal
    decimal128 Decimal128(10) -- Up to 38 digits, 10 decimal
) ENGINE = MergeTree() ORDER BY float_32;

-- Use Decimal for financial calculations
CREATE TABLE transactions (
    id UInt64,
    amount Decimal64(2),  -- Precise currency values
    exchange_rate Decimal64(6)
) ENGINE = MergeTree() ORDER BY id;
```

### String Types

```sql
CREATE TABLE string_examples (
    -- Variable length string (most common)
    name String,

    -- Fixed length string (faster, good for codes)
    country_code FixedString(2),
    uuid_str FixedString(36),

    -- Low cardinality (dictionary encoded, great for categories)
    status LowCardinality(String),
    category LowCardinality(String),

    -- Enum types (explicit mapping, most efficient for known values)
    log_level Enum8('DEBUG' = 1, 'INFO' = 2, 'WARN' = 3, 'ERROR' = 4),
    order_status Enum16('pending' = 1, 'processing' = 2, 'shipped' = 3, 'delivered' = 4, 'cancelled' = 5)
) ENGINE = MergeTree() ORDER BY name;

-- LowCardinality dramatically improves performance for low-unique-value columns
-- Example: 1M rows with 100 unique categories
-- String: ~50 MB
-- LowCardinality(String): ~5 MB
```

### Date and Time Types

```sql
CREATE TABLE datetime_examples (
    -- Date (days since 1970-01-01, range: 1970-01-01 to 2149-06-06)
    event_date Date,

    -- Date32 (extended range: 1900-01-01 to 2299-12-31)
    birth_date Date32,

    -- DateTime (seconds since epoch, with timezone)
    created_at DateTime,
    created_at_tz DateTime('UTC'),
    created_at_local DateTime('America/New_York'),

    -- DateTime64 (sub-second precision)
    timestamp_ms DateTime64(3),        -- Milliseconds
    timestamp_us DateTime64(6),        -- Microseconds
    timestamp_ns DateTime64(9, 'UTC')  -- Nanoseconds with timezone
) ENGINE = MergeTree() ORDER BY event_date;

-- Date/time functions
SELECT
    now() AS current_time,
    today() AS current_date,
    toDate('2024-01-15') AS parsed_date,
    toDateTime('2024-01-15 10:30:00') AS parsed_datetime,
    toYYYYMM(today()) AS year_month,
    toStartOfMonth(today()) AS month_start,
    toStartOfWeek(today()) AS week_start,
    addDays(today(), 7) AS next_week,
    dateDiff('day', toDate('2024-01-01'), today()) AS days_since_new_year;
```

### Complex Types

```sql
CREATE TABLE complex_examples (
    id UInt64,

    -- Arrays
    tags Array(String),
    scores Array(Float64),
    nested_array Array(Array(Int32)),

    -- Tuples (fixed structure)
    coordinates Tuple(Float64, Float64),
    address Tuple(street String, city String, zip String),

    -- Maps (key-value pairs)
    properties Map(String, String),
    metrics Map(String, Float64),

    -- Nullable (allows NULL values - use sparingly, impacts performance)
    optional_value Nullable(Int32),
    optional_name Nullable(String),

    -- UUID
    session_id UUID,

    -- IP addresses
    client_ip IPv4,
    server_ip IPv6,

    -- JSON (semi-structured data)
    metadata JSON
) ENGINE = MergeTree() ORDER BY id;

-- Working with arrays
INSERT INTO complex_examples (id, tags, scores) VALUES
    (1, ['tech', 'database', 'analytics'], [95.5, 88.0, 92.3]);

SELECT
    id,
    length(tags) AS tag_count,
    arrayJoin(tags) AS tag,  -- Unnest array
    arraySum(scores) AS total_score,
    arrayAvg(scores) AS avg_score,
    has(tags, 'tech') AS is_tech
FROM complex_examples;

-- Working with maps
INSERT INTO complex_examples (id, properties) VALUES
    (2, {'color': 'blue', 'size': 'large', 'material': 'cotton'});

SELECT
    id,
    properties['color'] AS color,
    mapKeys(properties) AS all_keys,
    mapValues(properties) AS all_values
FROM complex_examples WHERE id = 2;
```

## MergeTree Engine Family

### MergeTree Fundamentals

The MergeTree engine is the foundation of ClickHouse. It stores data in sorted order and periodically merges data parts in the background.

```sql
CREATE TABLE logs (
    log_date Date,
    log_time DateTime,
    level LowCardinality(String),
    service LowCardinality(String),
    message String,
    request_id UUID,
    duration_ms UInt32,
    user_id Nullable(UInt64)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(log_date)   -- Monthly partitions
ORDER BY (service, level, log_time)  -- Sort order (primary key)
PRIMARY KEY (service, level)       -- Optional: subset of ORDER BY for index
SETTINGS index_granularity = 8192; -- Rows per index mark (default)
```

**Key concepts:**

- **Parts**: Data is stored in immutable parts (directories)
- **Merges**: Background process combines parts
- **Primary Key**: Sparse index for fast lookups
- **Order By**: Physical sort order on disk
- **Granules**: Groups of rows (8192 by default) - smallest read unit

### ReplacingMergeTree

Deduplicates rows with the same sorting key during merges:

```sql
CREATE TABLE user_profiles (
    user_id UInt64,
    name String,
    email String,
    updated_at DateTime
) ENGINE = ReplacingMergeTree(updated_at)  -- Keep row with latest updated_at
PARTITION BY toYYYYMM(updated_at)
ORDER BY user_id;

-- Insert initial data
INSERT INTO user_profiles VALUES (1, 'Alice', 'alice@old.com', '2024-01-01 00:00:00');

-- Insert update (same user_id)
INSERT INTO user_profiles VALUES (1, 'Alice Smith', 'alice@new.com', '2024-01-15 00:00:00');

-- Query with FINAL to see deduplicated results (slower)
SELECT * FROM user_profiles FINAL;

-- Or force merge manually
OPTIMIZE TABLE user_profiles FINAL;

-- Better approach: use argMax for real-time deduplication
SELECT
    user_id,
    argMax(name, updated_at) AS name,
    argMax(email, updated_at) AS email,
    max(updated_at) AS updated_at
FROM user_profiles
GROUP BY user_id;
```

### SummingMergeTree

Automatically sums numeric columns for rows with the same sorting key:

```sql
CREATE TABLE daily_metrics (
    date Date,
    site_id UInt32,
    page_views UInt64,
    unique_visitors UInt64,
    total_duration_ms UInt64,
    bounce_count UInt32
) ENGINE = SummingMergeTree((page_views, unique_visitors, total_duration_ms, bounce_count))
PARTITION BY toYYYYMM(date)
ORDER BY (date, site_id);

-- Insert aggregated data (can insert multiple times, will be summed)
INSERT INTO daily_metrics VALUES ('2024-01-15', 1, 1000, 500, 50000000, 100);
INSERT INTO daily_metrics VALUES ('2024-01-15', 1, 500, 200, 25000000, 50);

-- After merge, these will be combined:
-- ('2024-01-15', 1, 1500, 700, 75000000, 150)

-- Query with SUM to handle unmerged parts
SELECT
    date,
    site_id,
    SUM(page_views) AS page_views,
    SUM(unique_visitors) AS unique_visitors  -- Note: not accurate for UV
FROM daily_metrics
GROUP BY date, site_id;
```

### AggregatingMergeTree

Stores pre-aggregated states for efficient roll-ups:

```sql
-- Create aggregating table with intermediate states
CREATE TABLE hourly_stats (
    hour DateTime,
    site_id UInt32,
    page_views SimpleAggregateFunction(sum, UInt64),
    uniq_users AggregateFunction(uniq, UInt64),
    avg_duration AggregateFunction(avg, Float64)
) ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (hour, site_id);

-- Create a materialized view to populate it
CREATE MATERIALIZED VIEW hourly_stats_mv TO hourly_stats AS
SELECT
    toStartOfHour(event_time) AS hour,
    site_id,
    count() AS page_views,
    uniqState(user_id) AS uniq_users,
    avgState(duration_ms) AS avg_duration
FROM events
GROUP BY hour, site_id;

-- Query aggregated data
SELECT
    hour,
    site_id,
    page_views,
    uniqMerge(uniq_users) AS unique_users,
    avgMerge(avg_duration) AS avg_duration
FROM hourly_stats
GROUP BY hour, site_id, page_views;
```

### CollapsingMergeTree

Handles updates and deletes through sign columns:

```sql
CREATE TABLE orders (
    order_id UInt64,
    user_id UInt64,
    amount Decimal64(2),
    status LowCardinality(String),
    updated_at DateTime,
    sign Int8  -- 1 for insert/update, -1 for delete/old version
) ENGINE = CollapsingMergeTree(sign)
PARTITION BY toYYYYMM(updated_at)
ORDER BY order_id;

-- Insert initial order
INSERT INTO orders VALUES (1, 100, 99.99, 'pending', now(), 1);

-- Update order: insert old row with sign=-1, new row with sign=1
INSERT INTO orders VALUES
    (1, 100, 99.99, 'pending', now(), -1),    -- Cancel old state
    (1, 100, 99.99, 'processing', now(), 1);   -- Insert new state

-- Query current state
SELECT
    order_id,
    sum(amount * sign) AS amount,
    argMax(status, updated_at) AS status
FROM orders
GROUP BY order_id
HAVING sum(sign) > 0;  -- Only show non-deleted orders
```

### VersionedCollapsingMergeTree

Improved collapsing with version numbers for out-of-order handling:

```sql
CREATE TABLE inventory (
    product_id UInt64,
    warehouse_id UInt32,
    quantity Int32,
    version UInt64,
    sign Int8
) ENGINE = VersionedCollapsingMergeTree(sign, version)
PARTITION BY warehouse_id
ORDER BY product_id;

-- Insert initial stock
INSERT INTO inventory VALUES (1001, 1, 100, 1, 1);

-- Update stock (can arrive out of order)
INSERT INTO inventory VALUES
    (1001, 1, 100, 1, -1),  -- Cancel version 1
    (1001, 1, 85, 2, 1);     -- Insert version 2

-- Query current inventory
SELECT
    product_id,
    warehouse_id,
    sum(quantity * sign) AS current_quantity
FROM inventory
GROUP BY product_id, warehouse_id
HAVING sum(sign) > 0;
```

## Partitioning and Primary Keys

### Partition Design

Partitions divide data into manageable chunks for efficient querying and maintenance:

```sql
-- Partition by month (most common)
CREATE TABLE events_monthly (
    event_date Date,
    event_data String
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_date)
ORDER BY event_date;

-- Partition by expression
CREATE TABLE events_custom (
    timestamp DateTime,
    region LowCardinality(String),
    data String
) ENGINE = MergeTree()
PARTITION BY (toYYYYMM(timestamp), region)  -- Compound partition
ORDER BY timestamp;

-- View partitions
SELECT
    partition,
    name,
    rows,
    bytes_on_disk,
    modification_time
FROM system.parts
WHERE table = 'events_monthly'
ORDER BY partition;

-- Partition operations
ALTER TABLE events_monthly DROP PARTITION '202401';  -- Drop January 2024
ALTER TABLE events_monthly DETACH PARTITION '202312';  -- Detach for backup
ALTER TABLE events_monthly ATTACH PARTITION '202312';  -- Reattach
```

**Partition best practices:**

- Keep partition count reasonable (hundreds, not thousands)
- Partition by time for time-series data
- Match partition granularity to data retention policies
- Common patterns: monthly, weekly, daily (for high-volume)

### Primary Key and ORDER BY

The ORDER BY clause determines physical data ordering and primary key:

```sql
-- ORDER BY defines both sort order and sparse primary key
CREATE TABLE user_events (
    user_id UInt64,
    event_type LowCardinality(String),
    event_time DateTime,
    properties String
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (user_id, event_type, event_time);  -- Queries filtering by user_id are fast

-- PRIMARY KEY can be a prefix of ORDER BY
CREATE TABLE user_events_v2 (
    user_id UInt64,
    event_type LowCardinality(String),
    event_time DateTime,
    properties String
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (user_id, event_type, event_time)
PRIMARY KEY (user_id, event_type);  -- Shorter key = smaller index = more memory efficient

-- Check primary key usage in queries
EXPLAIN indexes = 1
SELECT * FROM user_events
WHERE user_id = 12345 AND event_type = 'purchase';
```

**Choosing ORDER BY columns:**

1. Put most frequently filtered columns first
2. Order by cardinality: low to high (for better compression)
3. Include columns used in GROUP BY
4. Consider query patterns over insert patterns

### Secondary Indices (Data Skipping Indices)

```sql
CREATE TABLE logs_indexed (
    timestamp DateTime,
    level LowCardinality(String),
    service String,
    message String,
    trace_id String,

    -- Secondary indices for columns not in ORDER BY
    INDEX idx_trace_id trace_id TYPE bloom_filter GRANULARITY 4,
    INDEX idx_message message TYPE tokenbf_v1(10240, 3, 0) GRANULARITY 4,
    INDEX idx_level level TYPE set(100) GRANULARITY 4
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (service, timestamp);

-- Available index types:
-- minmax      - Stores min/max values (good for ranges)
-- set(n)      - Stores unique values up to n (good for low cardinality)
-- bloom_filter - Probabilistic filter (good for equality on high cardinality)
-- tokenbf_v1  - Token bloom filter (good for text search)
-- ngrambf_v1  - N-gram bloom filter (good for substring search)

-- Add index to existing table
ALTER TABLE logs_indexed ADD INDEX idx_service service TYPE set(1000) GRANULARITY 1;

-- Check if index is used
EXPLAIN indexes = 1
SELECT * FROM logs_indexed WHERE trace_id = 'abc123';
```

## Materialized Views

### Basic Materialized Views

Materialized views automatically transform and aggregate data as it arrives:

```sql
-- Source table
CREATE TABLE raw_events (
    event_id UUID,
    user_id UInt64,
    event_type String,
    event_time DateTime,
    properties String
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (event_time, user_id);

-- Destination table (must exist before MV)
CREATE TABLE daily_user_stats (
    date Date,
    user_id UInt64,
    event_count UInt64,
    unique_event_types UInt32
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, user_id);

-- Materialized view
CREATE MATERIALIZED VIEW daily_user_stats_mv TO daily_user_stats AS
SELECT
    toDate(event_time) AS date,
    user_id,
    count() AS event_count,
    uniqExact(event_type) AS unique_event_types
FROM raw_events
GROUP BY date, user_id;

-- When data is inserted into raw_events, daily_user_stats is automatically updated
INSERT INTO raw_events VALUES
    (generateUUIDv4(), 1, 'login', now(), '{}'),
    (generateUUIDv4(), 1, 'page_view', now(), '{}'),
    (generateUUIDv4(), 1, 'purchase', now(), '{}');

-- Query the aggregated view
SELECT * FROM daily_user_stats WHERE user_id = 1;
```

### Chained Materialized Views

Create multiple aggregation levels:

```sql
-- Raw events -> Hourly aggregates -> Daily aggregates

-- Hourly aggregates
CREATE TABLE hourly_metrics (
    hour DateTime,
    endpoint LowCardinality(String),
    request_count UInt64,
    error_count UInt64,
    total_duration_ms UInt64
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (hour, endpoint);

CREATE MATERIALIZED VIEW hourly_metrics_mv TO hourly_metrics AS
SELECT
    toStartOfHour(timestamp) AS hour,
    endpoint,
    count() AS request_count,
    countIf(status_code >= 400) AS error_count,
    sum(duration_ms) AS total_duration_ms
FROM raw_requests
GROUP BY hour, endpoint;

-- Daily aggregates (from hourly)
CREATE TABLE daily_metrics (
    date Date,
    endpoint LowCardinality(String),
    request_count UInt64,
    error_count UInt64,
    total_duration_ms UInt64
) ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, endpoint);

CREATE MATERIALIZED VIEW daily_metrics_mv TO daily_metrics AS
SELECT
    toDate(hour) AS date,
    endpoint,
    sum(request_count) AS request_count,
    sum(error_count) AS error_count,
    sum(total_duration_ms) AS total_duration_ms
FROM hourly_metrics
GROUP BY date, endpoint;
```

### Materialized Views with Aggregating Functions

```sql
-- Use AggregateFunction for accurate unique counts across merges
CREATE TABLE uniq_visitors (
    date Date,
    page LowCardinality(String),
    visitors AggregateFunction(uniq, UInt64),
    sessions AggregateFunction(uniq, String)
) ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, page);

CREATE MATERIALIZED VIEW uniq_visitors_mv TO uniq_visitors AS
SELECT
    toDate(event_time) AS date,
    page,
    uniqState(user_id) AS visitors,
    uniqState(session_id) AS sessions
FROM raw_events
WHERE event_type = 'page_view'
GROUP BY date, page;

-- Query with Merge suffix
SELECT
    date,
    page,
    uniqMerge(visitors) AS unique_visitors,
    uniqMerge(sessions) AS unique_sessions
FROM uniq_visitors
GROUP BY date, page;
```

## Distributed Queries and Sharding

### Cluster Architecture

```xml
<!-- /etc/clickhouse-server/config.d/clusters.xml -->
<clickhouse>
    <remote_servers>
        <analytics_cluster>
            <shard>
                <replica>
                    <host>node1.example.com</host>
                    <port>9000</port>
                </replica>
                <replica>
                    <host>node2.example.com</host>
                    <port>9000</port>
                </replica>
            </shard>
            <shard>
                <replica>
                    <host>node3.example.com</host>
                    <port>9000</port>
                </replica>
                <replica>
                    <host>node4.example.com</host>
                    <port>9000</port>
                </replica>
            </shard>
        </analytics_cluster>
    </remote_servers>
</clickhouse>
```

### Distributed Tables

```sql
-- Create local table on each shard
CREATE TABLE events_local (
    event_date Date,
    user_id UInt64,
    event_type String,
    data String
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_date, user_id);

-- Create distributed table (facade over local tables)
CREATE TABLE events_distributed AS events_local
ENGINE = Distributed(
    analytics_cluster,           -- Cluster name
    default,                     -- Database
    events_local,                -- Local table
    sipHash64(user_id)           -- Sharding key (hash for even distribution)
);

-- Insert through distributed table (automatically routes to shards)
INSERT INTO events_distributed VALUES
    ('2024-01-15', 1001, 'login', '{}'),
    ('2024-01-15', 1002, 'login', '{}');

-- Query distributed table (aggregates from all shards)
SELECT
    event_type,
    count() AS cnt
FROM events_distributed
WHERE event_date >= '2024-01-01'
GROUP BY event_type;
```

### Replication with ReplicatedMergeTree

```sql
-- Create ZooKeeper path for coordination
-- Requires ZooKeeper or ClickHouse Keeper

CREATE TABLE events_replicated (
    event_date Date,
    user_id UInt64,
    event_type String,
    data String
) ENGINE = ReplicatedMergeTree(
    '/clickhouse/tables/{shard}/events',  -- ZooKeeper path
    '{replica}'                             -- Replica identifier
)
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_date, user_id);

-- On a different replica (same table definition):
CREATE TABLE events_replicated (
    event_date Date,
    user_id UInt64,
    event_type String,
    data String
) ENGINE = ReplicatedMergeTree(
    '/clickhouse/tables/{shard}/events',
    '{replica}'
)
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_date, user_id);

-- Check replication status
SELECT
    database, table, replica_name,
    is_leader, is_readonly,
    absolute_delay
FROM system.replicas;
```

### Distributed Query Execution

```sql
-- View distributed query execution
SET send_logs_level = 'trace';

SELECT count()
FROM events_distributed
WHERE event_date = '2024-01-15';

-- Optimize distributed queries
-- Use GLOBAL IN/JOIN for subqueries on distributed tables
SELECT *
FROM events_distributed
WHERE user_id GLOBAL IN (
    SELECT user_id
    FROM users_distributed
    WHERE country = 'US'
);

-- Monitor distributed queries
SELECT
    query_id,
    type,
    query,
    read_rows,
    elapsed
FROM system.query_log
WHERE event_date = today()
    AND type = 'QueryFinish'
ORDER BY event_time DESC
LIMIT 10;
```

## Performance Tuning

### Query Optimization

```sql
-- Analyze query performance
EXPLAIN AST SELECT ... ;        -- Abstract Syntax Tree
EXPLAIN SYNTAX SELECT ... ;     -- Optimized query
EXPLAIN PLAN SELECT ... ;       -- Execution plan
EXPLAIN PIPELINE SELECT ... ;   -- Processing pipeline

-- Detailed analysis with indexes
EXPLAIN indexes = 1, actions = 1
SELECT count()
FROM events
WHERE user_id = 12345 AND event_date >= '2024-01-01';

-- Profile query execution
SET log_queries = 1;
SET log_query_threads = 1;

-- View query metrics
SELECT
    query,
    read_rows,
    read_bytes,
    result_rows,
    memory_usage,
    query_duration_ms
FROM system.query_log
WHERE query_id = '<your_query_id>'
    AND type = 'QueryFinish';
```

### Memory and Resource Management

```sql
-- Set memory limits
SET max_memory_usage = 10000000000;  -- 10 GB per query
SET max_memory_usage_for_user = 50000000000;  -- 50 GB per user

-- Limit threads
SET max_threads = 8;

-- External aggregation (spill to disk for large aggregations)
SET max_bytes_before_external_group_by = 5000000000;  -- 5 GB

-- External sorting
SET max_bytes_before_external_sort = 5000000000;

-- Limit query execution time
SET max_execution_time = 300;  -- 5 minutes

-- View current settings
SELECT name, value, description
FROM system.settings
WHERE name LIKE '%memory%' OR name LIKE '%thread%';
```

### Data Compression

```sql
-- Check compression ratios
SELECT
    table,
    formatReadableSize(sum(bytes_on_disk)) AS compressed_size,
    formatReadableSize(sum(data_uncompressed_bytes)) AS uncompressed_size,
    round(sum(data_uncompressed_bytes) / sum(bytes_on_disk), 2) AS ratio
FROM system.parts
WHERE active
GROUP BY table
ORDER BY sum(bytes_on_disk) DESC;

-- Specify compression per column
CREATE TABLE compressed_table (
    id UInt64,
    timestamp DateTime,
    data String CODEC(ZSTD(3)),           -- ZSTD level 3
    metrics Array(Float64) CODEC(Delta, ZSTD), -- Delta + ZSTD (great for time series)
    category LowCardinality(String) CODEC(ZSTD(1)),
    counter UInt32 CODEC(DoubleDelta, LZ4) -- DoubleDelta for incrementing values
) ENGINE = MergeTree()
ORDER BY (id, timestamp);

-- Available codecs:
-- LZ4 (default): Fast, moderate compression
-- ZSTD(level): Better compression, slower
-- Delta: Stores differences (good for timestamps, counters)
-- DoubleDelta: Stores differences of differences
-- Gorilla: For floating point values
-- T64: For integer values
```

### Optimizing INSERT Performance

```sql
-- Batch inserts (avoid frequent small inserts)
-- Recommended: Insert batches of 10,000-1,000,000 rows

-- Async inserts (buffer and batch automatically)
SET async_insert = 1;
SET wait_for_async_insert = 1;
SET async_insert_max_data_size = 10000000;  -- 10 MB
SET async_insert_busy_timeout_ms = 200;     -- Flush after 200ms

-- Monitor insert performance
SELECT
    database,
    table,
    elapsed,
    rows,
    bytes,
    formatReadableSize(bytes / elapsed) AS throughput
FROM system.query_log
WHERE type = 'QueryFinish'
    AND query_kind = 'Insert'
    AND event_date = today()
ORDER BY event_time DESC
LIMIT 10;

-- Buffer tables for high-frequency inserts
CREATE TABLE events_buffer AS events
ENGINE = Buffer(
    default,        -- database
    events,         -- destination table
    16,             -- num_layers
    10,             -- min_time (seconds)
    100,            -- max_time
    10000,          -- min_rows
    1000000,        -- max_rows
    10000000,       -- min_bytes
    100000000       -- max_bytes (100 MB)
);
```

### Monitoring and Diagnostics

```sql
-- System tables for monitoring
SELECT * FROM system.metrics LIMIT 10;
SELECT * FROM system.events LIMIT 10;
SELECT * FROM system.asynchronous_metrics LIMIT 10;

-- Active queries
SELECT
    query_id,
    user,
    query,
    elapsed,
    read_rows,
    memory_usage
FROM system.processes;

-- Kill a query
KILL QUERY WHERE query_id = '<query_id>';

-- Table sizes and statistics
SELECT
    database,
    table,
    formatReadableSize(sum(bytes_on_disk)) AS size,
    sum(rows) AS total_rows,
    count() AS parts,
    max(modification_time) AS last_modified
FROM system.parts
WHERE active
GROUP BY database, table
ORDER BY sum(bytes_on_disk) DESC;

-- Merge and mutation progress
SELECT
    database,
    table,
    progress,
    num_parts,
    result_part_name
FROM system.merges;

SELECT
    database,
    table,
    mutation_id,
    command,
    create_time,
    parts_to_do
FROM system.mutations
WHERE is_done = 0;
```

## Advanced Features

### Window Functions

```sql
-- ClickHouse supports standard window functions
SELECT
    user_id,
    event_time,
    event_type,

    -- Row number within partition
    row_number() OVER (PARTITION BY user_id ORDER BY event_time) AS event_num,

    -- Running total
    sum(amount) OVER (PARTITION BY user_id ORDER BY event_time) AS running_total,

    -- Previous and next values
    lagInFrame(event_type, 1) OVER (PARTITION BY user_id ORDER BY event_time) AS prev_event,
    leadInFrame(event_type, 1) OVER (PARTITION BY user_id ORDER BY event_time) AS next_event,

    -- Ranking functions
    rank() OVER (PARTITION BY toDate(event_time) ORDER BY amount DESC) AS daily_rank,
    dense_rank() OVER (PARTITION BY toDate(event_time) ORDER BY amount DESC) AS dense_daily_rank,

    -- First and last values
    first_value(amount) OVER (PARTITION BY user_id ORDER BY event_time) AS first_amount,
    last_value(amount) OVER (PARTITION BY user_id ORDER BY event_time
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS last_amount
FROM events;
```

### Approximate Functions

```sql
-- Approximate count distinct (HyperLogLog)
SELECT uniq(user_id) AS approx_users FROM events;
SELECT uniqHLL12(user_id) AS approx_users FROM events;  -- Explicit HLL

-- Exact count distinct (more memory intensive)
SELECT uniqExact(user_id) AS exact_users FROM events;

-- Approximate quantiles
SELECT
    quantile(0.5)(duration_ms) AS median,
    quantile(0.95)(duration_ms) AS p95,
    quantile(0.99)(duration_ms) AS p99,
    quantiles(0.5, 0.9, 0.95, 0.99)(duration_ms) AS quantile_array
FROM events;

-- T-Digest for streaming quantiles
SELECT quantileTDigest(0.95)(duration_ms) AS p95 FROM events;

-- TopK approximation
SELECT topK(10)(url) AS top_urls FROM events;
SELECT topKWeighted(10)(url, page_views) AS top_urls_weighted FROM events;
```

### Projections

Projections are alternative data orderings stored alongside main data:

```sql
CREATE TABLE events_with_projections (
    event_id UUID,
    user_id UInt64,
    event_type LowCardinality(String),
    event_time DateTime,
    duration_ms UInt32,

    -- Projection for time-based queries
    PROJECTION by_time (
        SELECT * ORDER BY event_time
    ),

    -- Projection for event type aggregations
    PROJECTION agg_by_type (
        SELECT
            event_type,
            toDate(event_time) AS date,
            count() AS event_count,
            avg(duration_ms) AS avg_duration
        GROUP BY event_type, date
    )
) ENGINE = MergeTree()
ORDER BY user_id;

-- ClickHouse automatically uses projections when beneficial
EXPLAIN
SELECT event_type, count()
FROM events_with_projections
WHERE toDate(event_time) = '2024-01-15'
GROUP BY event_type;
```

### Dictionary Tables

External dictionaries for fast lookups:

```sql
-- Create dictionary from file or database
CREATE DICTIONARY country_dict (
    country_code String,
    country_name String,
    continent String,
    population UInt64
)
PRIMARY KEY country_code
SOURCE(HTTP(
    URL 'https://example.com/countries.csv'
    FORMAT 'CSVWithNames'
))
LAYOUT(HASHED())
LIFETIME(MIN 3600 MAX 7200);

-- Use dictionary in queries
SELECT
    user_id,
    country_code,
    dictGet('country_dict', 'country_name', country_code) AS country_name,
    dictGet('country_dict', 'continent', country_code) AS continent
FROM users;

-- Dictionary from ClickHouse table
CREATE DICTIONARY user_dict (
    user_id UInt64,
    name String,
    email String
)
PRIMARY KEY user_id
SOURCE(CLICKHOUSE(
    HOST 'localhost'
    PORT 9000
    USER 'default'
    TABLE 'users'
    DB 'default'
))
LAYOUT(HASHED())
LIFETIME(MIN 300 MAX 600);
```

### User-Defined Functions

```sql
-- SQL UDFs
CREATE FUNCTION linear_scale AS (x, min_in, max_in, min_out, max_out) ->
    min_out + (x - min_in) * (max_out - min_out) / (max_in - min_in);

SELECT linear_scale(50, 0, 100, 0, 1);  -- Returns 0.5

-- Executable UDFs (external scripts)
CREATE FUNCTION sentiment_score AS
    command = 'python3 /scripts/sentiment.py'
    format = 'TabSeparated'
    return_type = 'Float64'
    argument_type = 'String';

-- Lambda functions in queries
SELECT
    arrayMap(x -> x * 2, [1, 2, 3, 4, 5]) AS doubled,
    arrayFilter(x -> x > 2, [1, 2, 3, 4, 5]) AS filtered,
    arrayReduce('sum', [1, 2, 3, 4, 5]) AS total;
```

## Best Practices

### Schema Design Guidelines

```sql
-- 1. Choose appropriate data types (smallest that fits)
-- Bad
CREATE TABLE bad_schema (
    id String,           -- Should be UInt64
    amount String,       -- Should be Decimal64(2)
    created_at String    -- Should be DateTime
);

-- Good
CREATE TABLE good_schema (
    id UInt64,
    amount Decimal64(2),
    created_at DateTime
);

-- 2. Use LowCardinality for categorical columns
-- Bad
CREATE TABLE categories_bad (
    category String,
    subcategory String,
    status String
);

-- Good
CREATE TABLE categories_good (
    category LowCardinality(String),
    subcategory LowCardinality(String),
    status LowCardinality(String)
);

-- 3. Design ORDER BY for common query patterns
-- If most queries filter by date and user:
ORDER BY (toDate(event_time), user_id, event_time)

-- 4. Use appropriate partition granularity
-- Monthly for long-term data, daily for high-volume short-term
PARTITION BY toYYYYMM(event_date)  -- Monthly
PARTITION BY toYYYYMMDD(event_date)  -- Daily (if > 1B rows/month)

-- 5. Denormalize where beneficial (avoid JOINs)
-- Include frequently accessed lookup data directly
```

### Query Best Practices

```sql
-- 1. Always filter by partition key when possible
-- Bad (scans all partitions)
SELECT * FROM events WHERE user_id = 123;

-- Good (single partition)
SELECT * FROM events
WHERE event_date >= '2024-01-01' AND event_date < '2024-02-01'
    AND user_id = 123;

-- 2. Use PREWHERE for selective filters
SELECT * FROM events
PREWHERE event_type = 'purchase'  -- Evaluated first, reduces data read
WHERE amount > 100;

-- 3. Limit data scanned with SAMPLE
SELECT avg(duration_ms)
FROM events
SAMPLE 0.1  -- 10% sample
WHERE event_date = today();

-- 4. Use LIMIT early in development
SELECT * FROM events LIMIT 100;

-- 5. Avoid SELECT * in production
-- Bad
SELECT * FROM events;

-- Good
SELECT event_id, user_id, event_time FROM events;

-- 6. Use appropriate JOINs
-- Use dictGet for dimension lookups (fastest)
-- Use GLOBAL IN/JOIN for distributed subqueries
-- Prefer ANY JOIN over ALL JOIN when duplicates don't matter
```

### Maintenance and Operations

```sql
-- Regular OPTIMIZE for ReplacingMergeTree
OPTIMIZE TABLE user_profiles FINAL;

-- Schedule during low-traffic periods
-- Use OPTIMIZE with DEDUPLICATE for specific columns
OPTIMIZE TABLE events FINAL DEDUPLICATE BY user_id, event_time;

-- Monitor part count (too many = slow queries)
SELECT
    table,
    count() AS parts,
    sum(rows) AS rows,
    formatReadableSize(sum(bytes_on_disk)) AS size
FROM system.parts
WHERE active
GROUP BY table
HAVING parts > 100
ORDER BY parts DESC;

-- TTL for automatic data cleanup
CREATE TABLE logs_with_ttl (
    timestamp DateTime,
    message String
) ENGINE = MergeTree()
ORDER BY timestamp
TTL timestamp + INTERVAL 30 DAY DELETE,  -- Delete after 30 days
    timestamp + INTERVAL 7 DAY TO DISK 'slow_storage';  -- Move after 7 days

-- Backups
BACKUP TABLE events TO Disk('backups', 'events_backup');
RESTORE TABLE events FROM Disk('backups', 'events_backup');
```

## Integration Patterns

### Common Integration Methods

```python
# Python with clickhouse-connect (official)
import clickhouse_connect

client = clickhouse_connect.get_client(
    host='localhost',
    port=8123,
    username='default',
    password=''
)

# Query data
result = client.query('SELECT * FROM events LIMIT 10')
for row in result.result_rows:
    print(row)

# Insert data
data = [
    ('2024-01-15', 1001, 'page_view', '/home'),
    ('2024-01-15', 1002, 'page_view', '/products'),
]
client.insert('events', data, column_names=['event_date', 'user_id', 'event_type', 'page'])

# Pandas integration
import pandas as pd

df = client.query_df('SELECT * FROM events WHERE event_date = today()')
print(df.head())

# Insert from DataFrame
client.insert_df('events', df)
```

```javascript
// Node.js with @clickhouse/client
import { createClient } from '@clickhouse/client';

const client = createClient({
  host: 'http://localhost:8123',
  username: 'default',
  password: '',
});

// Query
const resultSet = await client.query({
  query: 'SELECT * FROM events LIMIT 10',
  format: 'JSONEachRow',
});
const data = await resultSet.json();

// Insert
await client.insert({
  table: 'events',
  values: [
    { event_date: '2024-01-15', user_id: 1001, event_type: 'click' },
  ],
  format: 'JSONEachRow',
});
```

### Kafka Integration

```sql
-- Create Kafka engine table
CREATE TABLE events_kafka (
    event_id String,
    user_id UInt64,
    event_type String,
    event_time DateTime,
    properties String
) ENGINE = Kafka()
SETTINGS
    kafka_broker_list = 'kafka1:9092,kafka2:9092',
    kafka_topic_list = 'events',
    kafka_group_name = 'clickhouse_consumer',
    kafka_format = 'JSONEachRow',
    kafka_num_consumers = 4;

-- Create destination table
CREATE TABLE events (
    event_id String,
    user_id UInt64,
    event_type String,
    event_time DateTime,
    properties String
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(event_time)
ORDER BY (event_time, user_id);

-- Create materialized view to move data
CREATE MATERIALIZED VIEW events_kafka_mv TO events AS
SELECT * FROM events_kafka;
```

## Further Reading

### Official Resources

- [ClickHouse Documentation](https://clickhouse.com/docs)
- [ClickHouse GitHub Repository](https://github.com/ClickHouse/ClickHouse)
- [ClickHouse Blog](https://clickhouse.com/blog)
- [ClickHouse Playground](https://play.clickhouse.com)

### Community Resources

- [ClickHouse Slack Community](https://clickhouse.com/slack)
- [Altinity Knowledge Base](https://kb.altinity.com)
- [ClickHouse Meetups](https://www.meetup.com/pro/clickhouse)

### Related Technologies

- **Grafana**: Visualization and dashboards for ClickHouse
- **dbt**: Data transformation with ClickHouse adapter
- **Airbyte**: Data integration platform with ClickHouse connector
- **Superset**: Business intelligence with ClickHouse support
- **Vector**: Log collection and shipping to ClickHouse

### Books and Courses

- "ClickHouse in Action" - Practical guide to ClickHouse operations
- Altinity ClickHouse Training - Comprehensive certification courses
- ClickHouse Academy - Official learning resources

---

ClickHouse is a powerful tool for real-time analytics, capable of processing petabytes of data with sub-second query latency. By understanding its columnar architecture, choosing appropriate table engines, designing effective schemas, and following optimization best practices, you can build highly performant analytical systems. The key to success with ClickHouse is matching its strengths (bulk reads, aggregations, time-series data) to your use case while working around its limitations (single-row operations, heavy updates). Start with proper schema design, leverage materialized views for pre-aggregation, and continuously monitor performance to achieve optimal results.
