---
title: Snowflake Cloud Data Warehouse Guide
description: Deep dive into Snowflake cloud-native data warehouse architecture and usage
track: data
section: analytics-engines
difficulty: intermediate
tags:
  - Snowflake
  - Data Warehouse
  - Cloud
  - SQL
status: imported
origin: old/src/content/docs/data/snowflake.en.md
divergence: 0.306
issues: []
legacy:
  category: Data
  subcategory: Data Warehouse
  order: 15
  lastUpdated: 2026-01-07
---

Snowflake is a cloud-native data warehouse platform that has fundamentally transformed how organizations store, process, and analyze data. Built from the ground up for the cloud, Snowflake separates compute from storage, enabling unprecedented scalability, performance, and cost efficiency. This comprehensive guide covers Snowflake's architecture, core features, and best practices for building modern data solutions.

## Snowflake Architecture

### Three-Layer Architecture Overview

Snowflake's revolutionary architecture consists of three independent layers that work together seamlessly, enabling true separation of compute and storage:

```
+===================================================================+
|                    SNOWFLAKE ARCHITECTURE                          |
+===================================================================+
|                                                                    |
|  +--------------------------------------------------------------+  |
|  |              CLOUD SERVICES LAYER (Brain)                     |  |
|  |  +----------------------------------------------------------+  |
|  |  |  - Query Parsing & Optimization                          |  |
|  |  |  - Metadata Management                                    |  |
|  |  |  - Authentication & Access Control                        |  |
|  |  |  - Infrastructure Management                              |  |
|  |  |  - Security & Governance                                  |  |
|  |  +----------------------------------------------------------+  |
|  +--------------------------------------------------------------+  |
|                              |                                     |
|  +--------------------------------------------------------------+  |
|  |              COMPUTE LAYER (Virtual Warehouses)               |  |
|  |  +----------+  +----------+  +----------+  +----------+      |  |
|  |  |   WH 1   |  |   WH 2   |  |   WH 3   |  |   WH 4   |      |  |
|  |  | (XS-4XL) |  | (XS-4XL) |  | (XS-4XL) |  | (XS-4XL) |      |  |
|  |  +----------+  +----------+  +----------+  +----------+      |  |
|  |  Independent compute clusters - scale up/down instantly       |  |
|  +--------------------------------------------------------------+  |
|                              |                                     |
|  +--------------------------------------------------------------+  |
|  |              STORAGE LAYER (Centralized)                      |  |
|  |  +----------------------------------------------------------+  |
|  |  |     Cloud Object Storage (AWS S3 / Azure Blob / GCS)     |  |
|  |  |  - Columnar format (compressed, encrypted)                |  |
|  |  |  - Automatic micro-partitioning                           |  |
|  |  |  - Immutable storage with versioning                      |  |
|  |  +----------------------------------------------------------+  |
|  +--------------------------------------------------------------+  |
|                                                                    |
+===================================================================+
```

**Key Benefits of This Architecture:**

| Benefit | Description |
|---------|-------------|
| **Instant Elasticity** | Scale compute up/down independently without affecting storage |
| **Workload Isolation** | Multiple warehouses can access the same data simultaneously without contention |
| **Cost Efficiency** | Pay only for compute when queries run; storage is always available |
| **Zero Administration** | No infrastructure to manage, tune, or maintain |
| **Automatic Optimization** | Query optimization, data distribution, and caching handled automatically |

### Data Storage and Micro-Partitions

Snowflake stores data in a proprietary columnar format optimized for analytical workloads. Data is automatically organized into micro-partitions:

```
MICRO-PARTITION CONCEPT
=======================

Table Data:
+--------+------------+--------+--------+
| region | sale_date  | amount | status |
+--------+------------+--------+--------+
| US     | 2024-01-01 |  1500  | active |
| EU     | 2024-01-01 |  2200  | active |
| US     | 2024-01-02 |  1800  | active |
| APAC   | 2024-01-02 |  3100  | active |
| ...    | ...        |  ...   | ...    |
+--------+------------+--------+--------+

Automatically organized into Micro-Partitions (50-500MB each):
+-------------------+     +-------------------+     +-------------------+
| Micro-Partition 1 |     | Micro-Partition 2 |     | Micro-Partition 3 |
| region: US, EU    |     | region: APAC      |     | region: US, EU    |
| date: Jan 1-5     |     | date: Jan 1-5     |     | date: Jan 6-10    |
| rows: ~1M         |     | rows: ~1M         |     | rows: ~1M         |
+-------------------+     +-------------------+     +-------------------+

Each partition stores:
- Columnar data (compressed)
- Min/Max values per column (for pruning)
- Null count per column
- Distinct value count
```

**Columnar Storage Benefits:**

```
Row-Based Storage (Traditional):        Columnar Storage (Snowflake):
+----+--------+--------+               Column: ID        Column: Amount
| ID | Name   | Amount |               +----+----+----+  +------+------+------+
+----+--------+--------+               | 1  | 2  | 3  |  | 1000 | 2000 | 1500 |
| 1  | Alice  | 1000   |               +----+----+----+  +------+------+------+
| 2  | Bob    | 2000   |
| 3  | Carol  | 1500   |               Benefits:
+----+--------+--------+               - Read only needed columns
                                       - Better compression (similar values)
Query: SELECT SUM(Amount)              - Vectorized processing
Reads: All rows/columns                - Efficient aggregations
```

```sql
-- View clustering information for a table
SELECT SYSTEM$CLUSTERING_INFORMATION('sales_data', '(sale_date, region)');

-- Check clustering depth (lower is better, indicates better data organization)
SELECT SYSTEM$CLUSTERING_DEPTH('sales_data');

-- View partition statistics
SELECT
    table_name,
    row_count,
    bytes,
    clustering_key
FROM information_schema.tables
WHERE table_name = 'SALES_DATA';
```

### Cloud Services Layer

The Cloud Services Layer is the "brain" of Snowflake, handling all coordination and management:

```sql
-- Cloud Services handles these operations automatically:

-- 1. Query Optimization
-- Snowflake automatically optimizes queries without hints
EXPLAIN
SELECT region, SUM(amount) as total
FROM sales_data
WHERE sale_date >= '2024-01-01'
GROUP BY region;

-- 2. Metadata Management
-- Query system tables for metadata
SELECT *
FROM snowflake.account_usage.table_storage_metrics
WHERE table_name = 'SALES_DATA';

-- 3. Access Control (managed centrally)
SHOW GRANTS ON DATABASE analytics_db;

-- 4. Transaction Management (ACID compliant)
BEGIN TRANSACTION;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
```

## Virtual Warehouses

### Understanding Virtual Warehouses

Virtual warehouses are independent compute clusters that execute queries. They are the key to Snowflake's elastic compute model.

```
VIRTUAL WAREHOUSE SIZES
=======================

Size      | Servers | Credits/Hour | Relative Power | Use Case
----------|---------|--------------|----------------|------------------
X-Small   |    1    |      1       |      1x        | Development, Light BI
Small     |    2    |      2       |      2x        | Small team analytics
Medium    |    4    |      4       |      4x        | Department analytics
Large     |    8    |      8       |      8x        | Enterprise BI
X-Large   |   16    |     16       |     16x        | Complex analytics
2X-Large  |   32    |     32       |     32x        | Data science workloads
3X-Large  |   64    |     64       |     64x        | Large ETL jobs
4X-Large  |  128    |    128       |    128x        | Massive data processing
```

### Creating and Managing Warehouses

```sql
-- Create a basic virtual warehouse for analytics
CREATE WAREHOUSE analytics_wh
    WAREHOUSE_SIZE = 'MEDIUM'
    AUTO_SUSPEND = 300           -- Suspend after 5 minutes of inactivity
    AUTO_RESUME = TRUE           -- Automatically resume when query arrives
    INITIALLY_SUSPENDED = TRUE   -- Start in suspended state to save costs
    COMMENT = 'Primary analytics warehouse for BI team';

-- Create a multi-cluster warehouse for high concurrency
CREATE WAREHOUSE reporting_wh
    WAREHOUSE_SIZE = 'SMALL'
    MIN_CLUSTER_COUNT = 1        -- Minimum clusters running
    MAX_CLUSTER_COUNT = 4        -- Scale out to handle concurrent users
    SCALING_POLICY = 'STANDARD'  -- Balance performance and cost
    AUTO_SUSPEND = 120
    AUTO_RESUME = TRUE
    COMMENT = 'Reporting warehouse with auto-scaling';

-- Create a dedicated ETL warehouse
CREATE WAREHOUSE etl_wh
    WAREHOUSE_SIZE = 'LARGE'
    AUTO_SUSPEND = 60            -- Quick suspend for batch jobs
    AUTO_RESUME = TRUE
    INITIALLY_SUSPENDED = TRUE
    COMMENT = 'ETL and data loading warehouse';

-- Modify warehouse settings
ALTER WAREHOUSE analytics_wh SET
    WAREHOUSE_SIZE = 'LARGE'     -- Scale up
    AUTO_SUSPEND = 600;          -- Longer timeout

-- Scale down after peak hours
ALTER WAREHOUSE analytics_wh SET
    WAREHOUSE_SIZE = 'SMALL';

-- Suspend/Resume manually
ALTER WAREHOUSE analytics_wh SUSPEND;
ALTER WAREHOUSE analytics_wh RESUME;

-- Use a specific warehouse
USE WAREHOUSE analytics_wh;

-- View all warehouses
SHOW WAREHOUSES;
```

### Multi-Cluster Warehouses and Scaling Policies

```sql
-- Standard scaling policy: Prioritizes performance
-- Starts new cluster when query queue time exceeds 6 seconds
CREATE WAREHOUSE high_performance_wh
    WAREHOUSE_SIZE = 'MEDIUM'
    MIN_CLUSTER_COUNT = 1
    MAX_CLUSTER_COUNT = 10
    SCALING_POLICY = 'STANDARD';

-- Economy scaling policy: Prioritizes cost
-- More conservative scaling, tolerates longer queue times
CREATE WAREHOUSE cost_optimized_wh
    WAREHOUSE_SIZE = 'MEDIUM'
    MIN_CLUSTER_COUNT = 1
    MAX_CLUSTER_COUNT = 10
    SCALING_POLICY = 'ECONOMY';
```

```
MULTI-CLUSTER SCALING VISUALIZATION
===================================

Concurrent Users: 10              Concurrent Users: 50
+------------+                    +------------+ +------------+
| Cluster 1  |                    | Cluster 1  | | Cluster 2  |
| (queries)  |                    | (queries)  | | (queries)  |
+------------+                    +------------+ +------------+

Concurrent Users: 100             Concurrent Users: 200
+-----+ +-----+ +-----+          +---+ +---+ +---+ +---+
| C1  | | C2  | | C3  |          |C1 | |C2 | |C3 | |C4 |
+-----+ +-----+ +-----+          +---+ +---+ +---+ +---+

Each cluster provides the same compute power as the warehouse size.
Scaling out = More concurrent query capacity
Scaling up (size) = Faster individual query execution
```

### Resource Monitors for Cost Control

```sql
-- Create a resource monitor with credit limits
CREATE RESOURCE MONITOR monthly_analytics_limit
    WITH
        CREDIT_QUOTA = 1000          -- Monthly credit limit
        FREQUENCY = MONTHLY          -- Reset every month
        START_TIMESTAMP = IMMEDIATELY
        TRIGGERS
            ON 50 PERCENT DO NOTIFY  -- Alert at 50% usage
            ON 75 PERCENT DO NOTIFY  -- Alert at 75% usage
            ON 90 PERCENT DO NOTIFY  -- Alert at 90% usage
            ON 100 PERCENT DO SUSPEND -- Suspend at 100%
            ON 110 PERCENT DO SUSPEND_IMMEDIATE;  -- Hard stop

-- Apply to specific warehouse
ALTER WAREHOUSE analytics_wh
    SET RESOURCE_MONITOR = monthly_analytics_limit;

-- Create account-level resource monitor
CREATE RESOURCE MONITOR account_monthly_limit
    WITH
        CREDIT_QUOTA = 5000
        FREQUENCY = MONTHLY
        START_TIMESTAMP = IMMEDIATELY
        TRIGGERS
            ON 80 PERCENT DO NOTIFY
            ON 100 PERCENT DO SUSPEND;

ALTER ACCOUNT SET RESOURCE_MONITOR = account_monthly_limit;

-- View resource monitor status
SHOW RESOURCE MONITORS;

-- Query resource monitor usage
SELECT *
FROM snowflake.account_usage.resource_monitors
WHERE name = 'MONTHLY_ANALYTICS_LIMIT';
```

### Warehouse Performance Monitoring

```sql
-- Monitor warehouse load and performance
SELECT
    warehouse_name,
    DATE_TRUNC('hour', start_time) AS hour,
    AVG(avg_running) AS avg_queries_running,
    AVG(avg_queued_load) AS avg_queued,
    AVG(avg_blocked) AS avg_blocked,
    MAX(avg_queued_load) AS max_queued
FROM snowflake.account_usage.warehouse_load_history
WHERE start_time >= DATEADD(day, -7, CURRENT_TIMESTAMP())
GROUP BY warehouse_name, DATE_TRUNC('hour', start_time)
ORDER BY hour DESC;

-- Analyze query performance by warehouse
SELECT
    warehouse_name,
    COUNT(*) AS query_count,
    ROUND(AVG(execution_time)/1000, 2) AS avg_execution_sec,
    ROUND(MEDIAN(execution_time)/1000, 2) AS median_execution_sec,
    ROUND(MAX(execution_time)/1000, 2) AS max_execution_sec,
    ROUND(SUM(credits_used_cloud_services), 4) AS cloud_services_credits
FROM snowflake.account_usage.query_history
WHERE start_time >= DATEADD(day, -7, CURRENT_TIMESTAMP())
    AND warehouse_name IS NOT NULL
    AND execution_status = 'SUCCESS'
GROUP BY warehouse_name
ORDER BY query_count DESC;

-- Identify long-running queries
SELECT
    query_id,
    query_text,
    user_name,
    warehouse_name,
    ROUND(execution_time/1000, 2) AS execution_seconds,
    ROUND(bytes_scanned/1024/1024/1024, 2) AS gb_scanned,
    partitions_scanned,
    partitions_total
FROM snowflake.account_usage.query_history
WHERE start_time >= DATEADD(day, -1, CURRENT_TIMESTAMP())
    AND execution_time > 60000  -- Queries over 60 seconds
ORDER BY execution_time DESC
LIMIT 20;
```

## Data Sharing

### Secure Data Sharing Concepts

Snowflake's Secure Data Sharing enables real-time, secure data access without copying or moving data:

```
DATA SHARING ARCHITECTURE
=========================

Data Provider Account                    Data Consumer Account
+-------------------------+              +-------------------------+
|                         |              |                         |
| Source Database         |    SHARE     | Shared Database         |
| +-------------------+   |  (no copy)   | +-------------------+   |
| | fact_sales        |---+------------->| | fact_sales        |   |
| | dim_customers     |   |   metadata   | | dim_customers     |   |
| | dim_products      |   |     only     | | dim_products      |   |
| +-------------------+   |              | +-------------------+   |
|                         |              |                         |
| Storage Layer (owns)    |              | No storage cost         |
| Compute (provider's)    |              | Compute (consumer's)    |
| Full control            |              | Read-only access        |
+-------------------------+              +-------------------------+

Benefits:
- Real-time data (no stale copies)
- No data movement or duplication
- Provider controls access
- Consumer uses own compute
- Cross-region and cross-cloud capable
```

### Creating and Managing Shares

```sql
-- PROVIDER SIDE: Create and configure a share

-- Step 1: Create the share object
CREATE SHARE sales_analytics_share
    COMMENT = 'Sales analytics data for partner organizations';

-- Step 2: Grant database and schema access
GRANT USAGE ON DATABASE analytics_db TO SHARE sales_analytics_share;
GRANT USAGE ON SCHEMA analytics_db.public TO SHARE sales_analytics_share;

-- Step 3: Grant table access
GRANT SELECT ON TABLE analytics_db.public.fact_sales TO SHARE sales_analytics_share;
GRANT SELECT ON TABLE analytics_db.public.dim_products TO SHARE sales_analytics_share;

-- Step 4: Create secure view for row-level filtering
CREATE OR REPLACE SECURE VIEW analytics_db.public.vw_partner_sales AS
SELECT
    sale_date,
    product_category,
    region,
    SUM(amount) AS total_sales,
    COUNT(*) AS transaction_count
FROM analytics_db.public.fact_sales
WHERE partner_id = CURRENT_ACCOUNT()  -- Row-level security
GROUP BY sale_date, product_category, region;

GRANT SELECT ON VIEW analytics_db.public.vw_partner_sales TO SHARE sales_analytics_share;

-- Step 5: Add consumer accounts
ALTER SHARE sales_analytics_share ADD ACCOUNTS = partner_org.partner_account;
ALTER SHARE sales_analytics_share ADD ACCOUNTS = org2.account2, org3.account3;

-- View share details
SHOW SHARES;
SHOW GRANTS TO SHARE sales_analytics_share;
DESC SHARE sales_analytics_share;

-- Remove access
ALTER SHARE sales_analytics_share REMOVE ACCOUNTS = org3.account3;
REVOKE SELECT ON TABLE analytics_db.public.dim_products FROM SHARE sales_analytics_share;

-- CONSUMER SIDE: Access shared data

-- Create database from the share
CREATE DATABASE partner_data FROM SHARE provider_org.provider_account.sales_analytics_share;

-- Query shared data (uses consumer's compute resources)
USE DATABASE partner_data;
SELECT * FROM public.fact_sales LIMIT 100;

-- Join with local data
SELECT
    s.sale_date,
    s.product_category,
    l.local_metric
FROM partner_data.public.fact_sales s
JOIN my_database.public.local_table l
    ON s.product_id = l.product_id;
```

### Data Marketplace and Data Exchange

```sql
-- Snowflake Marketplace provides access to third-party data

-- After subscribing to a listing through Snowsight UI:
CREATE DATABASE weather_data FROM SHARE weather_source.public_data.weather_share;

-- Use marketplace data for enrichment
SELECT
    s.sale_date,
    s.region,
    s.total_sales,
    w.temperature,
    w.precipitation,
    CASE
        WHEN w.temperature > 80 THEN 'Hot'
        WHEN w.temperature > 60 THEN 'Warm'
        ELSE 'Cold'
    END AS weather_category
FROM analytics_db.public.daily_sales s
JOIN weather_data.public.daily_weather w
    ON s.sale_date = w.date
    AND s.city = w.city
WHERE s.sale_date >= '2024-01-01';

-- Popular marketplace data categories:
-- - Weather data
-- - Financial market data
-- - Demographic data
-- - COVID-19 statistics
-- - Geospatial data
-- - Economic indicators
```

## Time Travel

### Time Travel Concepts and Configuration

Time Travel allows you to access historical data at any point within the retention period:

```
TIME TRAVEL TIMELINE
====================

Past                                                        Present
|-------------------------------------------------------------->|
|                                                                |
|  Retention Period (configurable)                               |
|  Standard: 1 day | Enterprise: up to 90 days                   |
|                                                                |
|   Point A        Point B        Point C                     NOW
|      |              |              |                          |
|   DELETE        UPDATE         DROP TABLE                     |
|   happened      happened        happened                      |
|                                                                |
|  Can query:     Can query:     Can UNDROP:                    |
|  AT(A)          AT(B)          table                          |
|  BEFORE(A)      BEFORE(B)                                     |

Data is automatically retained for Time Travel queries
```

```sql
-- Configure Time Travel retention period
-- Standard Edition: max 1 day
-- Enterprise Edition: up to 90 days
ALTER TABLE sales_data SET DATA_RETENTION_TIME_IN_DAYS = 30;

-- Configure at database level (applies to new tables)
ALTER DATABASE analytics_db SET DATA_RETENTION_TIME_IN_DAYS = 14;

-- Configure at schema level
ALTER SCHEMA analytics_db.public SET DATA_RETENTION_TIME_IN_DAYS = 7;

-- Check current retention settings
SHOW TABLES LIKE 'sales_data';
SHOW PARAMETERS LIKE 'DATA_RETENTION_TIME_IN_DAYS' IN TABLE sales_data;
```

### Querying Historical Data

```sql
-- Query data at a specific timestamp
SELECT *
FROM sales_data
AT(TIMESTAMP => '2024-01-15 10:30:00'::TIMESTAMP_LTZ);

-- Query data from a relative offset (in seconds)
SELECT *
FROM sales_data
AT(OFFSET => -3600);  -- 1 hour ago

SELECT *
FROM sales_data
AT(OFFSET => -86400);  -- 24 hours ago

-- Query data before a specific statement was executed
-- (Useful when you know which query caused the issue)
SELECT *
FROM sales_data
BEFORE(STATEMENT => '019b9ee5-0500-8473-0043-83830009106e');

-- Compare current data with historical data
SELECT
    'current' AS version,
    COUNT(*) AS row_count,
    SUM(amount) AS total_amount,
    AVG(amount) AS avg_amount
FROM sales_data

UNION ALL

SELECT
    'yesterday' AS version,
    COUNT(*) AS row_count,
    SUM(amount) AS total_amount,
    AVG(amount) AS avg_amount
FROM sales_data AT(OFFSET => -86400)

UNION ALL

SELECT
    'last_week' AS version,
    COUNT(*) AS row_count,
    SUM(amount) AS total_amount,
    AVG(amount) AS avg_amount
FROM sales_data AT(OFFSET => -604800);

-- Find what changed between two points in time
SELECT
    current_data.id,
    current_data.amount AS current_amount,
    historical_data.amount AS previous_amount,
    current_data.amount - historical_data.amount AS change
FROM sales_data AS current_data
FULL OUTER JOIN sales_data AT(OFFSET => -3600) AS historical_data
    ON current_data.id = historical_data.id
WHERE current_data.amount != historical_data.amount
   OR current_data.id IS NULL
   OR historical_data.id IS NULL;
```

### Restoring Data with Time Travel

```sql
-- Restore a dropped table
DROP TABLE sales_data;
UNDROP TABLE sales_data;

-- Restore a dropped schema
DROP SCHEMA analytics;
UNDROP SCHEMA analytics;

-- Restore a dropped database
DROP DATABASE production_db;
UNDROP DATABASE production_db;

-- Restore to a previous state using CLONE
-- This creates a new table with data from a specific point
CREATE TABLE sales_data_restored CLONE sales_data
    AT(TIMESTAMP => '2024-01-15 08:00:00'::TIMESTAMP_LTZ);

-- Recover from accidental DELETE
-- Step 1: View the data before deletion
SELECT COUNT(*) FROM sales_data
AT(OFFSET => -3600)
WHERE customer_id = 'C001';

-- Step 2: Insert the deleted rows back
INSERT INTO sales_data
SELECT * FROM sales_data AT(OFFSET => -3600)
WHERE customer_id = 'C001'
    AND id NOT IN (SELECT id FROM sales_data);

-- Recover from accidental UPDATE
-- Step 1: Find the correct historical values
SELECT id, amount, status
FROM sales_data AT(OFFSET => -3600)
WHERE id IN (SELECT id FROM sales_data WHERE status = 'ERROR');

-- Step 2: Restore using MERGE
MERGE INTO sales_data AS target
USING (
    SELECT * FROM sales_data
    AT(OFFSET => -3600)
    WHERE id IN (SELECT id FROM sales_data WHERE status = 'ERROR')
) AS source
ON target.id = source.id
WHEN MATCHED THEN UPDATE SET
    target.amount = source.amount,
    target.status = source.status;

-- Pro tip: Always identify the query that caused issues
SELECT query_id, query_text, start_time, end_time
FROM snowflake.account_usage.query_history
WHERE query_type IN ('UPDATE', 'DELETE', 'MERGE')
    AND database_name = 'ANALYTICS_DB'
    AND start_time >= DATEADD(hour, -2, CURRENT_TIMESTAMP())
ORDER BY start_time DESC;
```

## Zero-Copy Cloning

### Understanding Zero-Copy Cloning

Zero-copy cloning creates instant copies of databases, schemas, or tables without physically duplicating the underlying data:

```
ZERO-COPY CLONING CONCEPT
=========================

Production Table                         Cloned Table
+------------------+                    +------------------+
| Table Metadata   |                    | Table Metadata   |
| +------------+   |                    | +------------+   |
| | Pointers   |---+----+     +--------+--| Pointers   |   |
| +------------+   |    |     |         | +------------+   |
+------------------+    |     |         +------------------+
                        v     v
                 +------------------+
                 |  Shared Data     |
                 | (Micro-partitions)|
                 |  Partition 1     |
                 |  Partition 2     |
                 |  Partition 3     |
                 +------------------+

After modifications to clone:

Production Table                         Cloned Table
+------------------+                    +------------------+
| Table Metadata   |                    | Table Metadata   |
| +------------+   |                    | +------------+   |
| | Pointers   |---+----+     +--------+--| Pointers   |   |
| +------------+   |    |     |    |    | +------------+   |
+------------------+    |     |    |    +------------------+
                        v     v    |
                 +-------------+   |     +-------------+
                 | Shared Data |   +---->| New Data    |
                 | Partition 1 |         | (clone only)|
                 | Partition 2 |         +-------------+
                 | Partition 3 |
                 +-------------+

Only modified data consumes additional storage (copy-on-write)
```

### Creating Clones

```sql
-- Clone a table (instant, zero storage until changes)
CREATE TABLE sales_data_dev CLONE sales_data;

-- Clone with a different name in the same schema
CREATE TABLE sales_data_backup CLONE sales_data;

-- Clone to a different schema
CREATE TABLE dev_schema.sales_data CLONE prod_schema.sales_data;

-- Clone a schema (includes all tables, views, sequences, etc.)
CREATE SCHEMA dev_schema CLONE production_schema;

-- Clone a database (includes all schemas and objects)
CREATE DATABASE dev_db CLONE production_db;

-- Clone at a specific point in time (Time Travel + Clone)
CREATE DATABASE dev_db CLONE production_db
    AT(TIMESTAMP => '2024-01-15 00:00:00'::TIMESTAMP_LTZ);

CREATE TABLE sales_snapshot CLONE sales_data
    AT(OFFSET => -86400);  -- Clone from 24 hours ago

-- Clone with transient storage (reduced Time Travel, lower cost)
CREATE TRANSIENT TABLE temp_analysis CLONE sales_data;

-- Verify the clone
SHOW TABLES LIKE 'sales_data%';
SELECT COUNT(*) FROM sales_data_dev;
```

### Clone Use Cases and Patterns

```sql
-- USE CASE 1: Development Environment
-- Create isolated development environment from production
CREATE DATABASE dev_environment CLONE production
    AT(TIMESTAMP => CURRENT_TIMESTAMP());

-- Developers can safely experiment
USE DATABASE dev_environment;
ALTER TABLE customers ADD COLUMN new_feature VARCHAR;
UPDATE orders SET status = 'TEST' WHERE order_date < '2020-01-01';

-- When done, simply drop the clone
DROP DATABASE dev_environment;

-- USE CASE 2: Pre-deployment Testing
-- Clone before deploying changes
CREATE SCHEMA staging_test CLONE production_schema;

-- Run migration scripts
USE SCHEMA staging_test;
-- Execute DDL changes
ALTER TABLE orders ADD COLUMN shipping_method VARCHAR;

-- Test queries
SELECT * FROM orders WHERE shipping_method IS NOT NULL;

-- If issues found, drop and fix
DROP SCHEMA staging_test;

-- USE CASE 3: Backup Before Risky Operations
-- Create backup before major changes
CREATE TABLE orders_backup CLONE orders;

-- Perform risky operation
DELETE FROM orders WHERE order_date < '2020-01-01';

-- If something goes wrong, restore immediately
CREATE OR REPLACE TABLE orders CLONE orders_backup;

-- Clean up backup when confident
DROP TABLE orders_backup;

-- USE CASE 4: Data Science Snapshots
-- Create reproducible dataset for ML training
CREATE SCHEMA ml_training_jan2024 CLONE production_schema
    AT(TIMESTAMP => '2024-01-01 00:00:00'::TIMESTAMP_LTZ);

-- Data scientists use consistent dataset
-- Results are reproducible even if production data changes

-- USE CASE 5: Point-in-Time Reporting
-- Monthly snapshots for regulatory reporting
CREATE SCHEMA financial_jan2024 CLONE financial_data
    AT(TIMESTAMP => '2024-01-31 23:59:59'::TIMESTAMP_LTZ);

-- Reports always reference the same data state
SELECT * FROM financial_jan2024.transactions
WHERE report_type = 'REGULATORY';
```

## Performance Optimization

### Clustering Keys

Clustering keys define how data is physically organized in micro-partitions:

```sql
-- Add clustering key to existing table
ALTER TABLE fact_sales CLUSTER BY (sale_date, region);

-- Create table with clustering key
CREATE TABLE fact_orders (
    order_id BIGINT,
    order_date DATE,
    customer_id BIGINT,
    region VARCHAR(50),
    amount DECIMAL(18, 2)
)
CLUSTER BY (order_date, region);

-- Check clustering quality
SELECT SYSTEM$CLUSTERING_INFORMATION('fact_sales');

-- Returns JSON with:
-- {
--   "cluster_by_keys": "LINEAR(sale_date, region)",
--   "total_partition_count": 1000,
--   "total_constant_partition_count": 850,
--   "average_overlaps": 2.5,
--   "average_depth": 1.2,
--   "partition_depth_histogram": { ... }
-- }

-- Interpretation:
-- - Lower average_depth = better clustering (ideal is 1.0)
-- - Lower average_overlaps = less data scanned per query
-- - Higher constant_partition_count = more uniformly clustered

-- Drop clustering key
ALTER TABLE fact_sales DROP CLUSTERING KEY;

-- Monitor automatic reclustering
SELECT *
FROM snowflake.account_usage.automatic_clustering_history
WHERE table_name = 'FACT_SALES'
    AND start_time >= DATEADD(day, -7, CURRENT_TIMESTAMP())
ORDER BY start_time DESC;
```

**Clustering Key Best Practices:**

| Scenario | Recommended Clustering Key |
|----------|---------------------------|
| Time-series data | (date_column) |
| Multi-tenant SaaS | (tenant_id, date_column) |
| Geographic data | (region, date_column) |
| High cardinality joins | (join_key_column) |

### Query Optimization Techniques

```sql
-- 1. Use appropriate data types
-- Bad: String comparison for dates
SELECT * FROM sales WHERE sale_date_varchar > '2024-01-01';

-- Good: Native date type with proper casting
SELECT * FROM sales WHERE sale_date > '2024-01-01'::DATE;

-- 2. Avoid SELECT * in production
-- Bad
SELECT * FROM large_table WHERE condition;

-- Good: Select only needed columns
SELECT order_id, customer_id, amount
FROM large_table
WHERE condition;

-- 3. Leverage partition pruning
-- Bad: Function on partition column prevents pruning
SELECT * FROM fact_sales
WHERE DATE_TRUNC('month', sale_date) = '2024-01-01';

-- Good: Direct range comparison
SELECT * FROM fact_sales
WHERE sale_date >= '2024-01-01' AND sale_date < '2024-02-01';

-- 4. Push filters to subqueries
-- Less efficient: Filter after join
SELECT *
FROM fact_sales f
JOIN dim_products p ON f.product_id = p.product_id
WHERE p.category = 'Electronics';

-- More efficient: Filter before join
SELECT *
FROM fact_sales f
JOIN (
    SELECT product_id, product_name
    FROM dim_products
    WHERE category = 'Electronics'
) p ON f.product_id = p.product_id;

-- 5. Use LIMIT for exploratory queries
SELECT * FROM large_table LIMIT 100;

-- 6. Use approximate functions for large datasets
-- Exact (slower for large datasets)
SELECT COUNT(DISTINCT customer_id) FROM fact_sales;

-- Approximate (faster, typically <2% error)
SELECT APPROX_COUNT_DISTINCT(customer_id) FROM fact_sales;
SELECT HLL(customer_id) FROM fact_sales;  -- HyperLogLog

-- 7. Materialize common subqueries
-- Create a temporary table for repeated use
CREATE TEMPORARY TABLE temp_active_customers AS
SELECT DISTINCT customer_id
FROM fact_sales
WHERE sale_date >= DATEADD(day, -30, CURRENT_DATE());

-- Use in multiple queries
SELECT c.*, 'active' AS status
FROM dim_customers c
WHERE c.customer_id IN (SELECT customer_id FROM temp_active_customers);
```

### Result Caching

```sql
-- Snowflake automatically caches query results for 24 hours
-- Same query returns instantly from cache

-- Check if query used cache
SELECT
    query_id,
    query_text,
    warehouse_name,
    execution_time,
    bytes_scanned,
    percentage_scanned_from_cache
FROM snowflake.account_usage.query_history
WHERE query_id = 'your_query_id';

-- Cache is invalidated when:
-- 1. Underlying data changes
-- 2. Query text differs (even whitespace)
-- 3. 24 hours have passed
-- 4. User doesn't have access to cached results

-- Force cache miss for testing
ALTER SESSION SET USE_CACHED_RESULT = FALSE;
SELECT * FROM my_table;
ALTER SESSION SET USE_CACHED_RESULT = TRUE;
```

### Search Optimization Service

```sql
-- Enable search optimization for point lookups
ALTER TABLE customers ADD SEARCH OPTIMIZATION
    ON EQUALITY(customer_id, email);

-- Enable for substring searches (LIKE, ILIKE)
ALTER TABLE products ADD SEARCH OPTIMIZATION
    ON SUBSTRING(product_name, description);

-- Enable for geographic searches
ALTER TABLE locations ADD SEARCH OPTIMIZATION
    ON GEO(coordinates);

-- Enable for variant/JSON fields
ALTER TABLE events ADD SEARCH OPTIMIZATION
    ON EQUALITY(event_data:user_id::VARCHAR);

-- Check search optimization status
DESCRIBE SEARCH OPTIMIZATION ON customers;

-- Monitor search optimization cost
SELECT *
FROM snowflake.account_usage.search_optimization_history
WHERE table_name = 'CUSTOMERS'
    AND start_time >= DATEADD(day, -7, CURRENT_TIMESTAMP());

-- Remove search optimization
ALTER TABLE customers DROP SEARCH OPTIMIZATION
    ON EQUALITY(email);
```

### Query Profile Analysis

```sql
-- Use EXPLAIN to see query plan
EXPLAIN
SELECT
    c.customer_name,
    SUM(s.amount) AS total_sales
FROM fact_sales s
JOIN dim_customers c ON s.customer_id = c.customer_id
WHERE s.sale_date >= '2024-01-01'
GROUP BY c.customer_name
ORDER BY total_sales DESC
LIMIT 100;

-- Key metrics to watch in Query Profile (Snowsight):
-- 1. Bytes Scanned vs Total Bytes (partition pruning effectiveness)
-- 2. Percentage Scanned from Cache
-- 3. Spilling to Local/Remote Storage (memory pressure)
-- 4. Network Wait Time (data transfer overhead)
-- 5. Compilation Time (query complexity)

-- Query to find queries with spilling (performance issue)
SELECT
    query_id,
    query_text,
    bytes_spilled_to_local_storage,
    bytes_spilled_to_remote_storage,
    execution_time
FROM snowflake.account_usage.query_history
WHERE bytes_spilled_to_local_storage > 0
   OR bytes_spilled_to_remote_storage > 0
ORDER BY execution_time DESC
LIMIT 20;
```

## Cost Management

### Understanding Snowflake Costs

```
SNOWFLAKE COST COMPONENTS
=========================

1. COMPUTE COSTS (Credits)
   - Virtual Warehouse usage
   - Serverless features (Snowpipe, Tasks, etc.)
   - Cloud Services (>10% of daily compute)

2. STORAGE COSTS ($/TB/month)
   - Active storage (tables, stages)
   - Time Travel storage
   - Fail-safe storage (7 days after Time Travel)

3. DATA TRANSFER COSTS
   - Cross-region data transfer
   - Cross-cloud data transfer
   - Egress to non-Snowflake destinations

Credit pricing varies by:
- Cloud provider (AWS, Azure, GCP)
- Region
- Edition (Standard, Enterprise, Business Critical)
```

### Cost Monitoring Queries

```sql
-- Total credit usage by warehouse (last 30 days)
SELECT
    warehouse_name,
    SUM(credits_used) AS total_credits,
    SUM(credits_used_compute) AS compute_credits,
    SUM(credits_used_cloud_services) AS cloud_services_credits
FROM snowflake.account_usage.warehouse_metering_history
WHERE start_time >= DATEADD(day, -30, CURRENT_TIMESTAMP())
GROUP BY warehouse_name
ORDER BY total_credits DESC;

-- Daily credit consumption trend
SELECT
    DATE(start_time) AS date,
    warehouse_name,
    SUM(credits_used) AS daily_credits
FROM snowflake.account_usage.warehouse_metering_history
WHERE start_time >= DATEADD(day, -30, CURRENT_TIMESTAMP())
GROUP BY DATE(start_time), warehouse_name
ORDER BY date DESC, daily_credits DESC;

-- Storage costs breakdown
SELECT
    DATE(usage_date) AS date,
    SUM(average_stage_bytes) / POWER(1024, 4) AS stage_tb,
    SUM(average_database_bytes) / POWER(1024, 4) AS database_tb,
    SUM(average_failsafe_bytes) / POWER(1024, 4) AS failsafe_tb
FROM snowflake.account_usage.storage_usage
WHERE usage_date >= DATEADD(day, -30, CURRENT_DATE())
GROUP BY DATE(usage_date)
ORDER BY date DESC;

-- Most expensive queries
SELECT
    query_id,
    user_name,
    warehouse_name,
    ROUND(credits_used_cloud_services, 4) AS cloud_credits,
    ROUND(execution_time/1000, 2) AS execution_seconds,
    bytes_scanned / POWER(1024, 3) AS gb_scanned,
    SUBSTR(query_text, 1, 100) AS query_preview
FROM snowflake.account_usage.query_history
WHERE start_time >= DATEADD(day, -7, CURRENT_TIMESTAMP())
    AND credits_used_cloud_services > 0
ORDER BY credits_used_cloud_services DESC
LIMIT 50;

-- Identify unused tables (candidates for cleanup)
SELECT
    table_catalog,
    table_schema,
    table_name,
    row_count,
    bytes / POWER(1024, 3) AS size_gb,
    last_altered
FROM snowflake.account_usage.tables
WHERE deleted IS NULL
    AND last_altered < DATEADD(month, -6, CURRENT_TIMESTAMP())
ORDER BY bytes DESC
LIMIT 100;
```

### Cost Optimization Strategies

```sql
-- 1. Right-size warehouses
-- Start small, scale up based on actual needs
ALTER WAREHOUSE analytics_wh SET WAREHOUSE_SIZE = 'SMALL';

-- 2. Aggressive auto-suspend
-- Suspend quickly for ad-hoc workloads
ALTER WAREHOUSE adhoc_wh SET AUTO_SUSPEND = 60;  -- 1 minute

-- 3. Use transient tables for temporary data
CREATE TRANSIENT TABLE temp_staging (
    id INT,
    data VARCHAR
);
-- No fail-safe storage, reduced Time Travel = lower cost

-- 4. Reduce Time Travel for non-critical tables
ALTER TABLE staging_table SET DATA_RETENTION_TIME_IN_DAYS = 0;

-- 5. Drop unused objects
DROP TABLE IF EXISTS old_table;
DROP DATABASE IF EXISTS test_database;

-- 6. Use table clustering wisely (only for frequently filtered columns)
-- Clustering has maintenance costs

-- 7. Implement query timeout
ALTER WAREHOUSE analytics_wh SET
    STATEMENT_TIMEOUT_IN_SECONDS = 3600;  -- 1 hour max

-- 8. Schedule ETL during off-peak hours
-- Create tasks that run during cheaper periods

-- 9. Compress data before loading
-- Use GZIP, BZIP2, or ZSTD compression

-- 10. Archive historical data
-- Move old data to cheaper storage tiers
CREATE TABLE archive_2023 AS
SELECT * FROM fact_sales
WHERE sale_date < '2024-01-01';

DELETE FROM fact_sales
WHERE sale_date < '2024-01-01';
```

## Security and Access Control

### Role-Based Access Control (RBAC)

```sql
-- Create role hierarchy
CREATE ROLE data_viewer;
CREATE ROLE data_analyst;
CREATE ROLE data_engineer;
CREATE ROLE data_admin;

-- Build hierarchy (inherited permissions)
GRANT ROLE data_viewer TO ROLE data_analyst;
GRANT ROLE data_analyst TO ROLE data_engineer;
GRANT ROLE data_engineer TO ROLE data_admin;

-- Grant warehouse access
GRANT USAGE ON WAREHOUSE analytics_wh TO ROLE data_viewer;
GRANT OPERATE ON WAREHOUSE analytics_wh TO ROLE data_engineer;
GRANT MONITOR ON WAREHOUSE analytics_wh TO ROLE data_admin;

-- Grant database access
GRANT USAGE ON DATABASE analytics_db TO ROLE data_viewer;
GRANT USAGE ON ALL SCHEMAS IN DATABASE analytics_db TO ROLE data_viewer;
GRANT SELECT ON ALL TABLES IN DATABASE analytics_db TO ROLE data_viewer;

-- Grant future object permissions
GRANT SELECT ON FUTURE TABLES IN DATABASE analytics_db TO ROLE data_viewer;
GRANT SELECT ON FUTURE VIEWS IN DATABASE analytics_db TO ROLE data_viewer;

-- Grant modify permissions to data engineers
GRANT CREATE TABLE ON SCHEMA analytics_db.public TO ROLE data_engineer;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA analytics_db.public TO ROLE data_engineer;

-- Assign roles to users
GRANT ROLE data_analyst TO USER john_doe;
GRANT ROLE data_engineer TO USER jane_smith;

-- View grants
SHOW GRANTS TO ROLE data_analyst;
SHOW GRANTS ON DATABASE analytics_db;
SHOW GRANTS TO USER john_doe;
```

### Row-Level Security (Row Access Policies)

```sql
-- Create row access policy for multi-tenant data
CREATE OR REPLACE ROW ACCESS POLICY tenant_isolation_policy
AS (tenant_id_col VARCHAR) RETURNS BOOLEAN ->
    CASE
        -- Admins see all data
        WHEN CURRENT_ROLE() = 'DATA_ADMIN' THEN TRUE
        -- Users see only their tenant's data
        WHEN tenant_id_col = CURRENT_USER() THEN TRUE
        -- Use a mapping table for complex rules
        WHEN tenant_id_col IN (
            SELECT tenant_id FROM user_tenant_mapping
            WHERE user_name = CURRENT_USER()
        ) THEN TRUE
        ELSE FALSE
    END;

-- Apply policy to table
ALTER TABLE multi_tenant_data
    ADD ROW ACCESS POLICY tenant_isolation_policy ON (tenant_id);

-- Create regional access policy
CREATE OR REPLACE ROW ACCESS POLICY regional_access_policy
AS (region_col VARCHAR) RETURNS BOOLEAN ->
    CASE
        WHEN CURRENT_ROLE() = 'GLOBAL_ADMIN' THEN TRUE
        WHEN CURRENT_ROLE() = 'APAC_ANALYST' AND region_col = 'APAC' THEN TRUE
        WHEN CURRENT_ROLE() = 'EMEA_ANALYST' AND region_col = 'EMEA' THEN TRUE
        WHEN CURRENT_ROLE() = 'AMERICAS_ANALYST' AND region_col = 'AMERICAS' THEN TRUE
        ELSE FALSE
    END;

ALTER TABLE regional_sales
    ADD ROW ACCESS POLICY regional_access_policy ON (region);

-- View applied policies
SELECT * FROM information_schema.policy_references
WHERE policy_name = 'TENANT_ISOLATION_POLICY';

-- Remove policy
ALTER TABLE multi_tenant_data
    DROP ROW ACCESS POLICY tenant_isolation_policy;
```

### Dynamic Data Masking

```sql
-- Create masking policy for email addresses
CREATE OR REPLACE MASKING POLICY email_mask AS (val STRING)
RETURNS STRING ->
    CASE
        WHEN CURRENT_ROLE() IN ('DATA_ADMIN', 'COMPLIANCE') THEN val
        WHEN CURRENT_ROLE() = 'DATA_ANALYST' THEN
            REGEXP_REPLACE(val, '^(.{2})(.*)(@.*)$', '\\1***\\3')
        ELSE '***@***.***'
    END;

-- Create masking policy for phone numbers
CREATE OR REPLACE MASKING POLICY phone_mask AS (val STRING)
RETURNS STRING ->
    CASE
        WHEN CURRENT_ROLE() IN ('DATA_ADMIN', 'SUPPORT') THEN val
        ELSE REGEXP_REPLACE(val, '\\d', '*')
    END;

-- Create masking policy for SSN/Tax IDs
CREATE OR REPLACE MASKING POLICY ssn_mask AS (val STRING)
RETURNS STRING ->
    CASE
        WHEN CURRENT_ROLE() = 'DATA_ADMIN' THEN val
        WHEN CURRENT_ROLE() = 'COMPLIANCE' THEN 'XXX-XX-' || RIGHT(val, 4)
        ELSE 'XXX-XX-XXXX'
    END;

-- Create conditional masking based on data classification
CREATE OR REPLACE MASKING POLICY conditional_mask AS (val STRING)
RETURNS STRING ->
    CASE
        WHEN SYSTEM$GET_TAG_ON_CURRENT_COLUMN('pii_classification') = 'HIGHLY_SENSITIVE'
            AND CURRENT_ROLE() NOT IN ('DATA_ADMIN') THEN '***REDACTED***'
        WHEN SYSTEM$GET_TAG_ON_CURRENT_COLUMN('pii_classification') = 'SENSITIVE'
            AND CURRENT_ROLE() NOT IN ('DATA_ADMIN', 'ANALYST') THEN '***MASKED***'
        ELSE val
    END;

-- Apply masking policies to columns
ALTER TABLE customers MODIFY COLUMN email SET MASKING POLICY email_mask;
ALTER TABLE customers MODIFY COLUMN phone SET MASKING POLICY phone_mask;
ALTER TABLE customers MODIFY COLUMN ssn SET MASKING POLICY ssn_mask;

-- Test masking
USE ROLE data_analyst;
SELECT customer_id, email, phone, ssn FROM customers LIMIT 5;
-- Results: 1, jo***@example.com, ***-***-****, XXX-XX-XXXX

USE ROLE data_admin;
SELECT customer_id, email, phone, ssn FROM customers LIMIT 5;
-- Results: 1, john.doe@example.com, 555-123-4567, 123-45-6789

-- Remove masking policy
ALTER TABLE customers MODIFY COLUMN email UNSET MASKING POLICY;
```

## Streams and Tasks

### Change Data Capture with Streams

```sql
-- Create a stream to track changes on a table
CREATE OR REPLACE STREAM orders_stream ON TABLE raw_orders;

-- View stream metadata
SHOW STREAMS;
DESC STREAM orders_stream;

-- Insert some data to generate stream records
INSERT INTO raw_orders VALUES (1, 'C001', 100.00, CURRENT_TIMESTAMP());
INSERT INTO raw_orders VALUES (2, 'C002', 200.00, CURRENT_TIMESTAMP());

-- Query the stream to see changes
SELECT
    order_id,
    customer_id,
    amount,
    METADATA$ACTION,      -- 'INSERT' or 'DELETE'
    METADATA$ISUPDATE,    -- TRUE if part of UPDATE
    METADATA$ROW_ID       -- Unique row identifier
FROM orders_stream;

-- Process stream data (consumes the stream)
INSERT INTO processed_orders
SELECT
    order_id,
    customer_id,
    amount,
    order_date,
    CURRENT_TIMESTAMP() AS processed_at,
    'NEW' AS status
FROM orders_stream
WHERE METADATA$ACTION = 'INSERT';

-- After DML, stream offset advances
-- Query again shows empty (new changes only)
SELECT * FROM orders_stream;

-- Create append-only stream (tracks only inserts, more efficient)
CREATE OR REPLACE STREAM orders_append_stream
ON TABLE raw_orders
APPEND_ONLY = TRUE;

-- Create stream on external table
CREATE OR REPLACE STREAM external_stream
ON EXTERNAL TABLE my_external_table;
```

### Automating Pipelines with Tasks

```sql
-- Create a simple scheduled task
CREATE OR REPLACE TASK daily_aggregation_task
    WAREHOUSE = etl_wh
    SCHEDULE = 'USING CRON 0 2 * * * America/Los_Angeles'  -- 2 AM daily
AS
    INSERT INTO daily_sales_summary
    SELECT
        DATE(sale_date) AS sale_date,
        SUM(amount) AS total_sales,
        COUNT(*) AS order_count
    FROM fact_sales
    WHERE sale_date = CURRENT_DATE() - 1
    GROUP BY DATE(sale_date);

-- Create task triggered by stream data availability
CREATE OR REPLACE TASK process_new_orders_task
    WAREHOUSE = etl_wh
    SCHEDULE = '1 MINUTE'
    WHEN SYSTEM$STREAM_HAS_DATA('orders_stream')
AS
    MERGE INTO dim_orders target
    USING (
        SELECT * FROM orders_stream
        WHERE METADATA$ACTION = 'INSERT'
    ) source
    ON target.order_id = source.order_id
    WHEN MATCHED THEN UPDATE SET
        target.amount = source.amount,
        target.updated_at = CURRENT_TIMESTAMP()
    WHEN NOT MATCHED THEN INSERT (order_id, customer_id, amount, created_at)
        VALUES (source.order_id, source.customer_id, source.amount, CURRENT_TIMESTAMP());

-- Create a task tree (DAG) for complex pipelines
CREATE OR REPLACE TASK load_raw_data
    WAREHOUSE = etl_wh
    SCHEDULE = 'USING CRON 0 1 * * * UTC'  -- 1 AM UTC daily
AS
    CALL load_data_from_s3();

CREATE OR REPLACE TASK transform_customers
    WAREHOUSE = etl_wh
    AFTER load_raw_data  -- Dependency
AS
    INSERT INTO dim_customers
    SELECT * FROM raw_customers_staging;

CREATE OR REPLACE TASK transform_orders
    WAREHOUSE = etl_wh
    AFTER load_raw_data  -- Also depends on load_raw_data
AS
    INSERT INTO dim_orders
    SELECT * FROM raw_orders_staging;

CREATE OR REPLACE TASK build_fact_table
    WAREHOUSE = etl_wh
    AFTER transform_customers, transform_orders  -- Multiple dependencies
AS
    INSERT INTO fact_sales
    SELECT
        o.order_id,
        c.customer_key,
        o.amount,
        o.order_date
    FROM dim_orders o
    JOIN dim_customers c ON o.customer_id = c.customer_id;

-- Enable/resume tasks (must start from root)
ALTER TASK load_raw_data RESUME;

-- Suspend tasks
ALTER TASK load_raw_data SUSPEND;

-- Execute task manually
EXECUTE TASK load_raw_data;

-- View task history
SELECT *
FROM TABLE(information_schema.task_history(
    scheduled_time_range_start => DATEADD(hour, -24, CURRENT_TIMESTAMP()),
    task_name => 'LOAD_RAW_DATA'
))
ORDER BY scheduled_time DESC;
```

### Monitoring Streams and Tasks

```sql
-- Check stream freshness (staleness)
SELECT
    name AS stream_name,
    stale,
    stale_after,
    DATEDIFF(minute, CURRENT_TIMESTAMP(), stale_after) AS minutes_until_stale
FROM information_schema.streams
WHERE stream_name = 'ORDERS_STREAM';

-- Monitor task execution history
SELECT
    name,
    database_name,
    schema_name,
    state,
    scheduled_time,
    completed_time,
    DATEDIFF(second, scheduled_time, completed_time) AS duration_seconds,
    error_code,
    error_message
FROM snowflake.account_usage.task_history
WHERE name = 'PROCESS_NEW_ORDERS_TASK'
ORDER BY scheduled_time DESC
LIMIT 50;

-- Find failed tasks
SELECT
    name,
    scheduled_time,
    error_code,
    error_message
FROM snowflake.account_usage.task_history
WHERE state = 'FAILED'
    AND scheduled_time >= DATEADD(day, -7, CURRENT_TIMESTAMP())
ORDER BY scheduled_time DESC;

-- Task dependency visualization query
SELECT
    t.name AS task_name,
    t.schedule,
    ARRAY_AGG(DISTINCT p.name) AS predecessor_tasks
FROM information_schema.tasks t
LEFT JOIN information_schema.task_graph tg
    ON t.name = tg.name
LEFT JOIN information_schema.tasks p
    ON tg.predecessor = p.name
GROUP BY t.name, t.schedule;
```

## Best Practices Summary

### Development Best Practices

```sql
-- 1. Use naming conventions consistently
-- Tables: snake_case, plural
CREATE TABLE fact_orders (...);
CREATE TABLE dim_customers (...);

-- Views: prefix with vw_
CREATE VIEW vw_active_customers AS ...;

-- Staging tables: prefix with stg_
CREATE TABLE stg_raw_orders (...);

-- 2. Document objects with comments
CREATE TABLE sales_transactions (
    transaction_id BIGINT COMMENT 'Unique transaction identifier',
    sale_date DATE COMMENT 'Date of sale in UTC',
    amount DECIMAL(18,2) COMMENT 'Transaction amount in USD'
) COMMENT = 'Daily sales transactions from POS system';

-- 3. Use version control for DDL
-- Store all CREATE statements in git
-- Use tools like SchemaChange, dbt, or Terraform

-- 4. Implement CI/CD
-- Separate environments: dev -> staging -> production
CREATE DATABASE dev_analytics CLONE production_analytics;

-- 5. Use parameterized queries (prevent SQL injection)
-- Use prepared statements in application code

-- 6. Test before deployment
CREATE DATABASE test_db CLONE production_db;
-- Run tests
DROP DATABASE test_db;
```

### Performance Best Practices

```sql
-- 1. Choose appropriate table types
CREATE TABLE production_data (...);           -- Permanent (full Time Travel + Fail-safe)
CREATE TRANSIENT TABLE staging_data (...);    -- Transient (no Fail-safe)
CREATE TEMPORARY TABLE session_temp (...);    -- Temporary (session-only)

-- 2. Use clustering for large tables (>1TB) with known query patterns
ALTER TABLE fact_sales CLUSTER BY (sale_date, region);

-- 3. Enable search optimization for point lookups
ALTER TABLE customers ADD SEARCH OPTIMIZATION ON EQUALITY(customer_id);

-- 4. Size warehouses appropriately
-- Start small, scale up based on query profile

-- 5. Use result caching
-- Run identical queries within 24 hours

-- 6. Minimize data scanning
-- Filter early, select only needed columns

-- 7. Use appropriate file formats for loading
-- Parquet > ORC > AVRO > CSV/JSON
```

### Cost Best Practices

```sql
-- 1. Set aggressive auto-suspend
ALTER WAREHOUSE analytics_wh SET AUTO_SUSPEND = 60;

-- 2. Use resource monitors
CREATE RESOURCE MONITOR monthly_limit WITH CREDIT_QUOTA = 1000;

-- 3. Reduce Time Travel for non-critical data
ALTER TABLE staging_data SET DATA_RETENTION_TIME_IN_DAYS = 1;

-- 4. Archive old data
CREATE TABLE archive_2022 AS SELECT * FROM fact_sales WHERE year = 2022;
DELETE FROM fact_sales WHERE year = 2022;

-- 5. Clean up unused objects regularly
-- Review tables not accessed in 90+ days

-- 6. Use transient tables for ETL staging

-- 7. Schedule heavy workloads during off-peak hours
```

## Interview Key Points

### Frequently Asked Questions

**Q1: Explain Snowflake's three-layer architecture and its benefits.**

```
Answer:
Snowflake has a unique three-layer architecture:

1. Storage Layer:
   - Cloud object storage (AWS S3, Azure Blob, GCS)
   - Data stored in columnar format, compressed and encrypted
   - Automatic micro-partitioning (50-500MB each)
   - Pay for storage used, independent of compute

2. Compute Layer (Virtual Warehouses):
   - Independent compute clusters (XS to 4XL)
   - Scale up/down in seconds
   - Multiple warehouses access same data
   - Pay only when running

3. Cloud Services Layer:
   - Query optimization and compilation
   - Metadata management
   - Access control and security
   - Transaction management

Benefits:
- True separation of storage and compute
- Instant, independent scaling
- Workload isolation (no contention)
- Pay-per-use pricing model
- Zero maintenance required
```

**Q2: What is Time Travel and how does it work?**

```sql
-- Time Travel allows querying historical data

-- By timestamp
SELECT * FROM table_name AT(TIMESTAMP => '2024-01-15 10:00:00');

-- By offset (seconds)
SELECT * FROM table_name AT(OFFSET => -3600);  -- 1 hour ago

-- Before a specific query
SELECT * FROM table_name BEFORE(STATEMENT => 'query_id');

-- Restore dropped objects
UNDROP TABLE table_name;
UNDROP DATABASE database_name;

-- Retention: 1 day (Standard) to 90 days (Enterprise)
ALTER TABLE table_name SET DATA_RETENTION_TIME_IN_DAYS = 30;

-- Use case: Create backup from historical point
CREATE TABLE backup CLONE source_table AT(TIMESTAMP => '...');
```

**Q3: How does Zero-Copy Cloning work?**

```
Answer:
Zero-Copy Cloning creates instant copies without duplicating data:

- Clone shares the same micro-partitions as source
- No additional storage until data changes
- Changes create new micro-partitions (copy-on-write)
- Can clone tables, schemas, or entire databases
- Supports Time Travel (clone at specific point)

Use cases:
- Development/testing environments
- Pre-deployment validation
- Disaster recovery backups
- Data science snapshots
```

**Q4: Explain Secure Data Sharing in Snowflake.**

```sql
-- Provider creates share
CREATE SHARE sales_share;
GRANT USAGE ON DATABASE db TO SHARE sales_share;
GRANT SELECT ON TABLE db.schema.table TO SHARE sales_share;
ALTER SHARE sales_share ADD ACCOUNTS = consumer_account;

-- Consumer accesses shared data
CREATE DATABASE shared_data FROM SHARE provider.sales_share;
SELECT * FROM shared_data.schema.table;

-- Key points:
-- - No data copying or movement
-- - Real-time access to provider's data
-- - Consumer uses own compute resources
-- - Provider maintains full control
-- - Cross-region/cross-cloud capable
```

**Q5: How do Streams and Tasks enable real-time pipelines?**

```sql
-- Streams capture changes (CDC)
CREATE STREAM orders_stream ON TABLE orders;
-- Tracks INSERT, UPDATE, DELETE operations
-- Provides METADATA$ACTION, METADATA$ISUPDATE, METADATA$ROW_ID

-- Tasks automate processing
CREATE TASK process_task
    WAREHOUSE = wh
    SCHEDULE = '1 MINUTE'
    WHEN SYSTEM$STREAM_HAS_DATA('orders_stream')
AS
    MERGE INTO target USING orders_stream ...;

-- Together they enable:
-- - Change data capture
-- - Incremental processing
-- - Event-driven pipelines
-- - Near real-time data warehousing
```

## Further Reading

### Official Documentation

- [Snowflake Documentation](https://docs.snowflake.com/) - Complete official documentation
- [Snowflake SQL Reference](https://docs.snowflake.com/en/sql-reference) - SQL command reference
- [Best Practices Guide](https://docs.snowflake.com/en/user-guide/best-practices) - Official best practices

### Learning Resources

- [Snowflake University](https://learn.snowflake.com/) - Free official training
- [Snowflake Community](https://community.snowflake.com/) - Forums and knowledge base
- [Snowflake Quickstarts](https://quickstarts.snowflake.com/) - Hands-on tutorials

### Certifications

- **SnowPro Core** - Foundation level certification
- **SnowPro Advanced: Architect** - Architecture specialization
- **SnowPro Advanced: Data Engineer** - Engineering specialization
- **SnowPro Advanced: Administrator** - Administration specialization

### Recommended Books

- **"Snowflake: The Definitive Guide"** by Joyce Kay Avila - Comprehensive Snowflake coverage
- **"Data Engineering with Snowflake"** - Modern data engineering patterns
- **"Building the Data Lakehouse"** by Bill Inmon - Lakehouse architecture concepts

---

## Summary

Snowflake has transformed the data warehousing landscape with its innovative cloud-native architecture. Key takeaways from this guide:

1. **Architecture**: Three-layer design (storage, compute, services) enables true elasticity and separation of concerns

2. **Virtual Warehouses**: Independent compute clusters that scale instantly based on workload demands

3. **Data Sharing**: Real-time, secure data sharing without data movement or copying

4. **Time Travel**: Query historical data and recover from mistakes with point-in-time access

5. **Zero-Copy Cloning**: Instant database copies for development, testing, and backups without storage overhead

6. **Performance**: Automatic optimization with clustering, caching, and search optimization

7. **Cost Management**: Pay-per-use model with resource monitors and optimization strategies

8. **Security**: Comprehensive RBAC, row-level security, and dynamic data masking

9. **Automation**: Streams and Tasks enable event-driven, near real-time data pipelines

By mastering these Snowflake features and best practices, you can build scalable, cost-effective, and performant data solutions that meet modern enterprise analytics demands.
