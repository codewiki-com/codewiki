---
title: Data Warehouse Complete Guide
description: Master data warehouse design for enterprise analytics
track: data
section: data-engineering
difficulty: advanced
tags:
  - Data Warehouse
  - Dimensional Modeling
  - BigQuery
  - Snowflake
status: imported
origin: old/src/content/docs/data/warehouse.en.md
divergence: 0.16
issues: []
legacy:
  category: Data
  subcategory: Engineering
  order: 7
  lastUpdated: 2026-01-07
---

A Data Warehouse is the core infrastructure for enterprise data analytics. It integrates, cleanses, and models data from various business systems to provide unified, trustworthy data support for enterprise decision-making. We'll explore the fundamental concepts, design methodologies, and best practices for building enterprise-grade data warehouses.

## Data Warehouse Core Concepts

### What is a Data Warehouse?

A data warehouse is a subject-oriented, integrated, non-volatile, and time-variant collection of data used to support management decision-making. This classic definition was proposed by Bill Inmon, the father of data warehousing, and encompasses four key characteristics:

- **Subject-Oriented**: Data is organized around business subjects (such as customers, products, sales) rather than by application systems
- **Integrated**: Consolidates data from multiple heterogeneous data sources with unified data standards and formats
- **Non-Volatile**: Once data enters the warehouse, it is generally not modified or deleted
- **Time-Variant**: Preserves historical data to support time-dimension analysis

### OLTP vs OLAP

```
+---------------------+-------------------+-----------------------+
|     Characteristic  |       OLTP        |         OLAP          |
+---------------------+-------------------+-----------------------+
|     Primary Use     | Transaction       | Analytics &           |
|                     | Processing        | Decision Making       |
+---------------------+-------------------+-----------------------+
|     Data Scope      | Current Data      | Historical Data       |
+---------------------+-------------------+-----------------------+
|     Query Pattern   | Simple Queries    | Complex Aggregations  |
+---------------------+-------------------+-----------------------+
|     Response Time   | Milliseconds      | Seconds to Minutes    |
+---------------------+-------------------+-----------------------+
|     Data Updates    | Frequent Updates  | Batch Loading         |
+---------------------+-------------------+-----------------------+
|     Normalization   | Highly Normalized | Denormalized          |
+---------------------+-------------------+-----------------------+
|     Typical Systems | MySQL, PostgreSQL | BigQuery, Snowflake   |
+---------------------+-------------------+-----------------------+
```

### Data Warehouse Architecture Evolution

```
Traditional Architecture:
+-----------+    +-----------+    +-----------+
|  Data     |--->|    ETL    |--->|   Data    |---> Reports/BI
|  Sources  |    |           |    | Warehouse |
+-----------+    +-----------+    +-----------+

Modern Architecture (ELT):
+-----------+    +-----------+    +-----------+
|  Data     |--->|    EL     |--->|   Cloud   |---> Transform ---> Analytics
|  Sources  |    |           |    | Warehouse |
+-----------+    +-----------+    +-----------+
                                       ^
                                       | dbt and similar tools
                                       | transform within warehouse
```

## Dimensional Modeling

### Dimensional Modeling Fundamentals

Dimensional modeling is a data warehouse design methodology proposed by Ralph Kimball. Its core idea is to organize data into fact tables and dimension tables.

```sql
-- The core of dimensional modeling: build around business processes
-- Business Process = Fact Table
-- Business Context = Dimension Tables

-- Example: E-commerce Sales Analysis
-- Fact Table: Records measurements for each order
-- Dimension Tables: Describe various dimensions of orders (time, customer, product, location)
```

### Star Schema

The star schema is the most commonly used dimensional modeling approach, with the fact table at the center and dimension tables radiating outward:

```sql
-- Fact Table: Orders Fact Table
CREATE TABLE fact_orders (
    order_id BIGINT PRIMARY KEY,
    -- Dimension foreign keys
    date_key INT REFERENCES dim_date(date_key),
    customer_key INT REFERENCES dim_customer(customer_key),
    product_key INT REFERENCES dim_product(product_key),
    store_key INT REFERENCES dim_store(store_key),
    -- Measures
    quantity INT,
    unit_price DECIMAL(10, 2),
    discount_amount DECIMAL(10, 2),
    total_amount DECIMAL(10, 2),
    cost_amount DECIMAL(10, 2),
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dimension Table: Date Dimension
CREATE TABLE dim_date (
    date_key INT PRIMARY KEY,           -- Surrogate key: 20240115
    full_date DATE NOT NULL,
    year INT,
    quarter INT,
    month INT,
    month_name VARCHAR(20),
    week_of_year INT,
    day_of_month INT,
    day_of_week INT,
    day_name VARCHAR(20),
    is_weekend BOOLEAN,
    is_holiday BOOLEAN,
    fiscal_year INT,
    fiscal_quarter INT
);

-- Dimension Table: Customer Dimension
CREATE TABLE dim_customer (
    customer_key INT PRIMARY KEY,       -- Surrogate key
    customer_id VARCHAR(50),            -- Business key
    customer_name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    gender VARCHAR(10),
    birth_date DATE,
    age_group VARCHAR(20),
    customer_segment VARCHAR(50),
    registration_date DATE,
    -- SCD related fields
    effective_date DATE,
    expiration_date DATE,
    is_current BOOLEAN
);

-- Dimension Table: Product Dimension
CREATE TABLE dim_product (
    product_key INT PRIMARY KEY,
    product_id VARCHAR(50),
    product_name VARCHAR(200),
    category_l1 VARCHAR(100),           -- Level 1 category
    category_l2 VARCHAR(100),           -- Level 2 category
    category_l3 VARCHAR(100),           -- Level 3 category
    brand VARCHAR(100),
    supplier VARCHAR(100),
    unit_cost DECIMAL(10, 2),
    is_active BOOLEAN
);
```

**Advantages of Star Schema:**
- Better query performance: Simple joins, easy for optimizer to optimize
- Easy to understand: Business users can easily comprehend the data structure
- BI tool friendly: Most BI tools natively support star schemas

### Snowflake Schema

The snowflake schema is an extension of the star schema that further normalizes dimension tables:

```sql
-- Snowflake Schema Example: Normalized Product Dimension

-- Product Dimension Main Table
CREATE TABLE dim_product (
    product_key INT PRIMARY KEY,
    product_id VARCHAR(50),
    product_name VARCHAR(200),
    category_key INT REFERENCES dim_category(category_key),
    brand_key INT REFERENCES dim_brand(brand_key),
    unit_cost DECIMAL(10, 2)
);

-- Category Dimension Table
CREATE TABLE dim_category (
    category_key INT PRIMARY KEY,
    category_l3_name VARCHAR(100),
    category_l2_key INT REFERENCES dim_category_l2(category_l2_key)
);

CREATE TABLE dim_category_l2 (
    category_l2_key INT PRIMARY KEY,
    category_l2_name VARCHAR(100),
    category_l1_key INT REFERENCES dim_category_l1(category_l1_key)
);

CREATE TABLE dim_category_l1 (
    category_l1_key INT PRIMARY KEY,
    category_l1_name VARCHAR(100)
);

-- Brand Dimension Table
CREATE TABLE dim_brand (
    brand_key INT PRIMARY KEY,
    brand_name VARCHAR(100),
    brand_country VARCHAR(50),
    manufacturer VARCHAR(100)
);
```

**Star vs Snowflake Schema Selection:**

| Consideration | Star Schema | Snowflake Schema |
|--------------|-------------|------------------|
| Query Performance | Better (fewer joins) | Slower (more joins) |
| Storage Space | Larger (redundancy) | Smaller (normalized) |
| Maintenance Complexity | Lower | Higher |
| Use Cases | Most OLAP scenarios | Deep hierarchies, flexible analysis |

## Facts and Dimensions Design

### Fact Table Design Principles

Fact tables can be classified into three types based on granularity:

```sql
-- 1. Transaction Fact Table
-- Records each transaction in a business process, finest granularity
CREATE TABLE fact_order_line (
    order_line_id BIGINT PRIMARY KEY,
    order_id BIGINT,
    date_key INT,
    product_key INT,
    customer_key INT,
    quantity INT,
    unit_price DECIMAL(10, 2),
    line_amount DECIMAL(10, 2)
);

-- 2. Periodic Snapshot Fact Table
-- Records state snapshots at fixed time intervals
CREATE TABLE fact_inventory_daily (
    snapshot_date_key INT,
    product_key INT,
    warehouse_key INT,
    quantity_on_hand INT,
    quantity_reserved INT,
    quantity_available INT,
    inventory_value DECIMAL(12, 2),
    PRIMARY KEY (snapshot_date_key, product_key, warehouse_key)
);

-- 3. Accumulating Snapshot Fact Table
-- Tracks multiple milestones in a business process
CREATE TABLE fact_order_fulfillment (
    order_id BIGINT PRIMARY KEY,
    customer_key INT,
    -- Milestone date keys
    order_date_key INT,
    payment_date_key INT,
    ship_date_key INT,
    delivery_date_key INT,
    -- Milestone intervals (days)
    order_to_payment_days INT,
    payment_to_ship_days INT,
    ship_to_delivery_days INT,
    total_fulfillment_days INT,
    -- Measures
    order_amount DECIMAL(10, 2),
    shipping_cost DECIMAL(10, 2)
);
```

### Measure Additivity Classification

```sql
-- Measure Additivity Classification

-- 1. Additive Measures
-- Can be summed across all dimensions
SELECT
    SUM(quantity) as total_quantity,        -- Additive
    SUM(total_amount) as total_revenue      -- Additive
FROM fact_orders;

-- 2. Semi-Additive Measures
-- Can only be summed across some dimensions (e.g., balance cannot be summed across time)
SELECT
    date_key,
    SUM(balance) as total_balance  -- Cannot be summed across time
FROM fact_account_balance
WHERE date_key = 20240115
GROUP BY date_key;

-- 3. Non-Additive Measures
-- Cannot be summed directly, require transformation
SELECT
    -- Ratios cannot be summed directly
    SUM(total_amount) / SUM(quantity) as avg_unit_price,
    -- Percentages need recalculation
    SUM(profit) / NULLIF(SUM(revenue), 0) * 100 as profit_margin
FROM fact_orders;
```

### Dimension Table Design Best Practices

```sql
-- Dimension Table Design Guidelines

-- 1. Use surrogate keys instead of business keys as primary keys
CREATE TABLE dim_customer (
    customer_key INT PRIMARY KEY AUTO_INCREMENT,  -- Surrogate key
    customer_id VARCHAR(50) UNIQUE,               -- Business key
    -- Other attributes...
);

-- 2. Flatten dimension hierarchies
CREATE TABLE dim_product (
    product_key INT PRIMARY KEY,
    -- Store hierarchy structure in flattened form
    category_l1_id INT,
    category_l1_name VARCHAR(100),
    category_l2_id INT,
    category_l2_name VARCHAR(100),
    category_l3_id INT,
    category_l3_name VARCHAR(100),
    -- Enables quick filtering and grouping
    product_name VARCHAR(200)
);

-- 3. Junk Dimension
-- Combine low-cardinality flags into a single dimension
CREATE TABLE dim_order_flags (
    order_flag_key INT PRIMARY KEY,
    is_gift BOOLEAN,
    is_rush BOOLEAN,
    is_fragile BOOLEAN,
    payment_method VARCHAR(20),
    shipping_method VARCHAR(20)
);

-- 4. Role-Playing Dimension
-- Same dimension table used multiple times in a fact table
CREATE TABLE fact_flights (
    flight_id BIGINT PRIMARY KEY,
    departure_date_key INT REFERENCES dim_date(date_key),
    arrival_date_key INT REFERENCES dim_date(date_key),
    departure_airport_key INT REFERENCES dim_airport(airport_key),
    arrival_airport_key INT REFERENCES dim_airport(airport_key),
    passengers INT,
    revenue DECIMAL(12, 2)
);
```

## Slowly Changing Dimensions (SCD)

Slowly Changing Dimensions (SCD) are techniques for handling historical changes in dimension attributes.

### SCD Type 1 - Overwrite

```sql
-- Type 1: Direct overwrite, no history preserved
-- Use cases: Error correction, attributes that don't require history

-- Before update
-- customer_key | customer_id | address
-- 1            | C001        | 123 Main St, New York

-- After customer moves, directly update
UPDATE dim_customer
SET address = '456 Oak Ave, Los Angeles',
    updated_at = CURRENT_TIMESTAMP
WHERE customer_id = 'C001';

-- After update
-- customer_key | customer_id | address
-- 1            | C001        | 456 Oak Ave, Los Angeles
```

### SCD Type 2 - Add New Row

```sql
-- Type 2: Add new record, preserve complete history
-- Use cases: Key attributes requiring historical tracking

CREATE TABLE dim_customer_scd2 (
    customer_key INT PRIMARY KEY AUTO_INCREMENT,
    customer_id VARCHAR(50),            -- Business key
    customer_name VARCHAR(100),
    address VARCHAR(200),
    customer_segment VARCHAR(50),
    -- SCD 2 control fields
    effective_date DATE NOT NULL,
    expiration_date DATE,
    is_current BOOLEAN DEFAULT TRUE,
    -- Version number (optional)
    version INT DEFAULT 1
);

-- Stored procedure for handling SCD Type 2 changes
DELIMITER //
CREATE PROCEDURE update_customer_scd2(
    IN p_customer_id VARCHAR(50),
    IN p_customer_name VARCHAR(100),
    IN p_address VARCHAR(200),
    IN p_customer_segment VARCHAR(50)
)
BEGIN
    DECLARE v_current_key INT;
    DECLARE v_current_version INT;

    -- Find current record
    SELECT customer_key, version INTO v_current_key, v_current_version
    FROM dim_customer_scd2
    WHERE customer_id = p_customer_id AND is_current = TRUE;

    IF v_current_key IS NOT NULL THEN
        -- Close current record
        UPDATE dim_customer_scd2
        SET expiration_date = DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY),
            is_current = FALSE
        WHERE customer_key = v_current_key;

        -- Insert new record
        INSERT INTO dim_customer_scd2 (
            customer_id, customer_name, address, customer_segment,
            effective_date, expiration_date, is_current, version
        ) VALUES (
            p_customer_id, p_customer_name, p_address, p_customer_segment,
            CURRENT_DATE, '9999-12-31', TRUE, v_current_version + 1
        );
    ELSE
        -- New customer, insert directly
        INSERT INTO dim_customer_scd2 (
            customer_id, customer_name, address, customer_segment,
            effective_date, expiration_date, is_current, version
        ) VALUES (
            p_customer_id, p_customer_name, p_address, p_customer_segment,
            CURRENT_DATE, '9999-12-31', TRUE, 1
        );
    END IF;
END //
DELIMITER ;

-- Query current state
SELECT * FROM dim_customer_scd2 WHERE is_current = TRUE;

-- Query historical state (at a specific point in time)
SELECT * FROM dim_customer_scd2
WHERE customer_id = 'C001'
  AND '2023-06-15' BETWEEN effective_date AND expiration_date;
```

### SCD Type 3 - Add New Column

```sql
-- Type 3: Add new column to preserve limited history
-- Use cases: Only need to preserve the previous version

CREATE TABLE dim_customer_scd3 (
    customer_key INT PRIMARY KEY,
    customer_id VARCHAR(50),
    -- Current values
    current_address VARCHAR(200),
    current_segment VARCHAR(50),
    -- Historical values (previous version)
    previous_address VARCHAR(200),
    previous_segment VARCHAR(50),
    -- Change dates
    address_change_date DATE,
    segment_change_date DATE
);

-- Update SCD Type 3
UPDATE dim_customer_scd3
SET previous_address = current_address,
    current_address = '456 Oak Ave, Los Angeles',
    address_change_date = CURRENT_DATE
WHERE customer_id = 'C001';
```

### Hybrid SCD Strategy

```sql
-- Practical projects often use hybrid strategies
CREATE TABLE dim_customer_hybrid (
    customer_key INT PRIMARY KEY AUTO_INCREMENT,
    customer_id VARCHAR(50),
    -- Type 1 attributes (direct overwrite)
    email VARCHAR(100),
    phone VARCHAR(20),
    -- Type 2 attributes (preserve history)
    customer_segment VARCHAR(50),
    credit_limit DECIMAL(10, 2),
    -- Type 3 attributes (preserve previous value)
    current_address VARCHAR(200),
    previous_address VARCHAR(200),
    -- SCD 2 control fields
    effective_date DATE,
    expiration_date DATE,
    is_current BOOLEAN
);
```

## Modern Data Warehouse Architectures

### Lambda Architecture

```
                    +---------------------------------------------+
                    |              Lambda Architecture            |
                    +---------------------------------------------+
                                        |
                    +-------------------+-------------------+
                    |                                       |
              +-----v-----+                           +-----v-----+
              | Batch Layer|                           |Speed Layer|
              | (Offline)  |                           | (Real-time)|
              +-----+-----+                           +-----+-----+
                    |                                       |
          +---------v---------+                   +---------v---------+
          |  Spark/Hive/Flink |                   |  Kafka/Flink      |
          |  Batch process    |                   |  Real-time process|
          |  historical data  |                   |  incremental data |
          +---------+---------+                   +---------+---------+
                    |                                       |
                    +-------------------+-------------------+
                                        |
                              +---------v---------+
                              |   Serving Layer   |
                              |   Merge batch +   |
                              |   real-time views |
                              +-------------------+
```

### Lakehouse Architecture

```python
# Delta Lake Example - Lakehouse Architecture Implementation
from delta import DeltaTable
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("Lakehouse Demo") \
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
    .getOrCreate()

# Create Delta table (supports ACID transactions)
df = spark.read.parquet("s3://data-lake/raw/orders/")
df.write.format("delta").mode("overwrite").save("s3://data-lake/silver/orders/")

# Incremental update (MERGE INTO)
delta_table = DeltaTable.forPath(spark, "s3://data-lake/silver/orders/")
new_orders = spark.read.parquet("s3://data-lake/staging/orders_incremental/")

delta_table.alias("target").merge(
    new_orders.alias("source"),
    "target.order_id = source.order_id"
).whenMatchedUpdateAll() \
 .whenNotMatchedInsertAll() \
 .execute()

# Time travel queries
df_history = spark.read.format("delta") \
    .option("versionAsOf", 5) \
    .load("s3://data-lake/silver/orders/")

# Or by timestamp
df_history = spark.read.format("delta") \
    .option("timestampAsOf", "2024-01-01 00:00:00") \
    .load("s3://data-lake/silver/orders/")
```

### Modern Data Stack

```
+---------------------------------------------------------------------+
|                      Modern Data Stack                               |
+---------------------------------------------------------------------+
|                                                                     |
|   Data Sources      Integration       Warehouse     Transform  Analytics|
|   +------+         +--------+        +--------+    +-----+    +-----+  |
|   | SaaS |-------->|Fivetran|------->|Snowflake|-->| dbt |--->|Looker| |
|   | Apps |         |Airbyte |        |BigQuery |   |     |    |Metabase|
|   +------+         +--------+        |Redshift |   +-----+    +-----+  |
|                                      +--------+                        |
|   +------+                                                             |
|   |Databases|       Orchestration              Data Quality            |
|   | MySQL  |       +--------+                 +--------+               |
|   |Postgres|       |Airflow |                 |Great   |               |
|   +------+         |Dagster |                 |Expectations|           |
|                    +--------+                 +--------+               |
|                                                                        |
+---------------------------------------------------------------------+
```

## Cloud Data Warehouses: BigQuery and Snowflake

### Google BigQuery

```sql
-- BigQuery Features Demo

-- 1. Partitioned Table (by date)
CREATE TABLE `project.dataset.fact_orders`
(
    order_id INT64,
    customer_id STRING,
    order_date DATE,
    amount NUMERIC
)
PARTITION BY order_date
CLUSTER BY customer_id
OPTIONS(
    partition_expiration_days = 365,
    description = "Orders fact table"
);

-- 2. Clustering for Query Optimization
-- After clustering by customer_id, filter queries are faster
SELECT customer_id, SUM(amount) as total
FROM `project.dataset.fact_orders`
WHERE order_date BETWEEN '2024-01-01' AND '2024-01-31'
  AND customer_id = 'C12345'
GROUP BY customer_id;

-- 3. Nested and Repeated Fields
CREATE TABLE `project.dataset.orders_nested`
(
    order_id INT64,
    customer STRUCT<
        id STRING,
        name STRING,
        email STRING
    >,
    items ARRAY<STRUCT<
        product_id STRING,
        quantity INT64,
        price NUMERIC
    >>
);

-- Query nested data
SELECT
    order_id,
    customer.name as customer_name,
    item.product_id,
    item.quantity * item.price as line_total
FROM `project.dataset.orders_nested`,
     UNNEST(items) as item
WHERE customer.id = 'C001';

-- 4. Materialized Views
CREATE MATERIALIZED VIEW `project.dataset.mv_daily_sales`
PARTITION BY order_date
CLUSTER BY category
AS
SELECT
    order_date,
    p.category,
    SUM(o.amount) as daily_revenue,
    COUNT(DISTINCT o.customer_id) as unique_customers
FROM `project.dataset.fact_orders` o
JOIN `project.dataset.dim_product` p ON o.product_id = p.product_id
GROUP BY order_date, p.category;

-- 5. JavaScript UDF
CREATE FUNCTION `project.dataset.parse_user_agent`(ua STRING)
RETURNS STRUCT<browser STRING, os STRING>
LANGUAGE js AS """
    var parser = {
        browser: ua.includes('Chrome') ? 'Chrome' :
                 ua.includes('Firefox') ? 'Firefox' : 'Other',
        os: ua.includes('Windows') ? 'Windows' :
            ua.includes('Mac') ? 'MacOS' : 'Other'
    };
    return parser;
""";
```

### Snowflake

```sql
-- Snowflake Features Demo

-- 1. Create Virtual Warehouse (Compute Resources)
CREATE WAREHOUSE analytics_wh
    WAREHOUSE_SIZE = 'MEDIUM'
    AUTO_SUSPEND = 300
    AUTO_RESUME = TRUE
    MIN_CLUSTER_COUNT = 1
    MAX_CLUSTER_COUNT = 3
    SCALING_POLICY = 'STANDARD';

-- 2. Zero-Copy Cloning
CREATE DATABASE dev_db CLONE prod_db;
CREATE TABLE orders_backup CLONE orders;

-- 3. Time Travel
-- Query historical data
SELECT * FROM orders AT(TIMESTAMP => '2024-01-01 10:00:00'::TIMESTAMP);
SELECT * FROM orders AT(OFFSET => -60*60);  -- 1 hour ago
SELECT * FROM orders BEFORE(STATEMENT => 'query_id_here');

-- Recover accidentally deleted data
CREATE TABLE orders_restored CLONE orders
    AT(TIMESTAMP => '2024-01-10 08:00:00'::TIMESTAMP);

-- 4. Streams and Tasks (Change Data Capture)
-- Create Stream to capture changes
CREATE STREAM orders_stream ON TABLE raw_orders;

-- Create Task to automatically process changes
CREATE TASK process_orders_task
    WAREHOUSE = analytics_wh
    SCHEDULE = '1 MINUTE'
    WHEN SYSTEM$STREAM_HAS_DATA('orders_stream')
AS
MERGE INTO dim_orders t
USING (
    SELECT * FROM orders_stream
    WHERE METADATA$ACTION = 'INSERT'
) s
ON t.order_id = s.order_id
WHEN MATCHED THEN UPDATE SET *
WHEN NOT MATCHED THEN INSERT *;

ALTER TASK process_orders_task RESUME;

-- 5. Data Sharing
CREATE SHARE sales_share;
GRANT USAGE ON DATABASE analytics_db TO SHARE sales_share;
GRANT SELECT ON TABLE analytics_db.public.fact_sales TO SHARE sales_share;

-- Add consumer account
ALTER SHARE sales_share ADD ACCOUNTS = 'partner_account';

-- 6. Snowpipe (Continuous Data Loading)
CREATE PIPE orders_pipe
    AUTO_INGEST = TRUE
AS
COPY INTO raw_orders
FROM @orders_stage
FILE_FORMAT = (TYPE = 'JSON');
```

## Data Layer Architecture

### Standard Four-Layer Architecture

```
+---------------------------------------------------------------------+
|                    Data Warehouse Layer Architecture                 |
+---------------------------------------------------------------------+
|                                                                     |
|  +---------------------------------------------------------------+  |
|  |  ADS (Application Data Service) - Application Data Layer      |  |
|  |  Application-specific datasets: reports, APIs, ML inputs      |  |
|  +---------------------------------------------------------------+  |
|                              ^                                      |
|  +---------------------------------------------------------------+  |
|  |  DWS (Data Warehouse Service) - Data Service Layer            |  |
|  |  Lightly aggregated layer, subject-oriented wide tables       |  |
|  |  Examples: user profile tables, product attribute tables      |  |
|  +---------------------------------------------------------------+  |
|                              ^                                      |
|  +---------------------------------------------------------------+  |
|  |  DWD (Data Warehouse Detail) - Detail Data Layer              |  |
|  |  Cleansed detailed data, maintains finest granularity         |  |
|  |  Core layer of the data warehouse                             |  |
|  +---------------------------------------------------------------+  |
|                              ^                                      |
|  +---------------------------------------------------------------+  |
|  |  ODS (Operational Data Store) - Operational Data Layer        |  |
|  |  Raw copy of source system data, minimal cleansing            |  |
|  +---------------------------------------------------------------+  |
|                              ^                                      |
|  +---------------------------------------------------------------+  |
|  |  Data Sources: MySQL, PostgreSQL, MongoDB, Kafka, APIs, Files |  |
|  +---------------------------------------------------------------+  |
|                                                                     |
+---------------------------------------------------------------------+
```

### Layer Modeling Examples

```sql
-- ODS Layer: Preserve source system structure
CREATE TABLE ods_order_info (
    id BIGINT,
    order_no VARCHAR(50),
    user_id BIGINT,
    shop_id BIGINT,
    order_status TINYINT,
    pay_type TINYINT,
    total_amount DECIMAL(10, 2),
    pay_amount DECIMAL(10, 2),
    create_time DATETIME,
    pay_time DATETIME,
    -- Metadata
    dt STRING COMMENT 'Partition date',
    etl_time TIMESTAMP COMMENT 'ETL timestamp'
)
PARTITIONED BY (dt)
STORED AS PARQUET;

-- DWD Layer: Cleansed, standardized, dimension denormalized
CREATE TABLE dwd_order_detail (
    order_id BIGINT COMMENT 'Order ID',
    order_no STRING COMMENT 'Order number',
    user_id BIGINT COMMENT 'User ID',
    user_name STRING COMMENT 'User name (denormalized)',
    shop_id BIGINT COMMENT 'Shop ID',
    shop_name STRING COMMENT 'Shop name (denormalized)',
    order_status STRING COMMENT 'Order status (code to description)',
    pay_type STRING COMMENT 'Payment type',
    total_amount DECIMAL(10, 2) COMMENT 'Total order amount',
    discount_amount DECIMAL(10, 2) COMMENT 'Discount amount',
    pay_amount DECIMAL(10, 2) COMMENT 'Actual payment amount',
    create_date DATE COMMENT 'Creation date',
    create_time TIMESTAMP COMMENT 'Creation time',
    pay_date DATE COMMENT 'Payment date',
    pay_time TIMESTAMP COMMENT 'Payment time'
)
PARTITIONED BY (dt)
STORED AS PARQUET;

-- DWS Layer: Lightly aggregated wide table
CREATE TABLE dws_user_order_1d (
    user_id BIGINT COMMENT 'User ID',
    user_name STRING COMMENT 'User name',
    order_count BIGINT COMMENT 'Order count',
    order_amount DECIMAL(12, 2) COMMENT 'Order amount',
    pay_count BIGINT COMMENT 'Paid order count',
    pay_amount DECIMAL(12, 2) COMMENT 'Payment amount',
    avg_order_amount DECIMAL(10, 2) COMMENT 'Average order amount',
    first_order_time TIMESTAMP COMMENT 'First order time',
    last_order_time TIMESTAMP COMMENT 'Last order time'
)
PARTITIONED BY (dt)
STORED AS PARQUET;

-- ADS Layer: Application-specific datasets
CREATE TABLE ads_user_retention (
    cohort_date DATE COMMENT 'Registration date',
    day_n INT COMMENT 'Day N',
    cohort_users BIGINT COMMENT 'Registered users',
    retained_users BIGINT COMMENT 'Retained users',
    retention_rate DECIMAL(5, 2) COMMENT 'Retention rate'
)
STORED AS PARQUET;

-- User RFM Analysis Table
CREATE TABLE ads_user_rfm (
    user_id BIGINT,
    recency_days INT COMMENT 'Days since last purchase',
    frequency INT COMMENT 'Purchase frequency',
    monetary DECIMAL(12, 2) COMMENT 'Total spending',
    r_score INT COMMENT 'Recency score',
    f_score INT COMMENT 'Frequency score',
    m_score INT COMMENT 'Monetary score',
    rfm_segment STRING COMMENT 'RFM segment',
    stat_date DATE COMMENT 'Statistics date'
)
STORED AS PARQUET;
```

### Implementing Data Layers with dbt

```yaml
# dbt_project.yml
name: 'ecommerce_dw'
version: '1.0.0'

model-paths: ["models"]

models:
  ecommerce_dw:
    staging:  # ODS Layer
      +materialized: view
      +schema: staging
    intermediate:  # DWD Layer
      +materialized: table
      +schema: dwd
    marts:  # DWS/ADS Layer
      +materialized: table
      +schema: analytics
```

```sql
-- models/staging/stg_orders.sql (ODS -> Staging)
{{ config(materialized='view') }}

SELECT
    id as order_id,
    order_no,
    user_id,
    shop_id,
    CASE order_status
        WHEN 1 THEN 'Pending Payment'
        WHEN 2 THEN 'Paid'
        WHEN 3 THEN 'Shipped'
        WHEN 4 THEN 'Completed'
        WHEN 5 THEN 'Cancelled'
    END as order_status,
    total_amount,
    pay_amount,
    create_time,
    pay_time
FROM {{ source('raw', 'orders') }}
WHERE create_time >= '{{ var("start_date") }}'

-- models/intermediate/int_order_detail.sql (DWD)
{{ config(
    materialized='incremental',
    unique_key='order_id',
    partition_by={'field': 'order_date', 'data_type': 'date'}
) }}

SELECT
    o.order_id,
    o.order_no,
    o.user_id,
    u.user_name,
    o.shop_id,
    s.shop_name,
    o.order_status,
    o.total_amount,
    o.pay_amount,
    DATE(o.create_time) as order_date,
    o.create_time,
    o.pay_time
FROM {{ ref('stg_orders') }} o
LEFT JOIN {{ ref('stg_users') }} u ON o.user_id = u.user_id
LEFT JOIN {{ ref('stg_shops') }} s ON o.shop_id = s.shop_id

{% if is_incremental() %}
WHERE o.create_time > (SELECT MAX(create_time) FROM {{ this }})
{% endif %}

-- models/marts/mart_daily_sales.sql (DWS)
{{ config(
    materialized='table',
    partition_by={'field': 'order_date', 'data_type': 'date'}
) }}

SELECT
    order_date,
    shop_id,
    shop_name,
    COUNT(DISTINCT order_id) as order_count,
    COUNT(DISTINCT user_id) as customer_count,
    SUM(pay_amount) as total_revenue,
    AVG(pay_amount) as avg_order_value
FROM {{ ref('int_order_detail') }}
WHERE order_status IN ('Paid', 'Shipped', 'Completed')
GROUP BY order_date, shop_id, shop_name
```

## Performance Optimization

### Partitioning Strategies

```sql
-- BigQuery Partitioning Example
CREATE TABLE `project.dataset.fact_events`
(
    event_id STRING,
    user_id STRING,
    event_type STRING,
    event_timestamp TIMESTAMP,
    properties JSON
)
PARTITION BY DATE(event_timestamp)
OPTIONS(
    partition_expiration_days = 90,
    require_partition_filter = TRUE  -- Force partition filter
);

-- Partition by integer range
CREATE TABLE `project.dataset.fact_transactions`
PARTITION BY RANGE_BUCKET(customer_id, GENERATE_ARRAY(0, 1000000, 10000))
AS
SELECT * FROM raw_transactions;

-- Snowflake Automatic Clustering
CREATE TABLE fact_orders (
    order_id INT,
    order_date DATE,
    customer_id INT,
    amount DECIMAL(10, 2)
)
CLUSTER BY (order_date, customer_id);

-- Check clustering depth
SELECT SYSTEM$CLUSTERING_DEPTH('fact_orders');
SELECT SYSTEM$CLUSTERING_INFORMATION('fact_orders');
```

### Query Optimization Techniques

```sql
-- 1. Avoid SELECT *
-- Bad
SELECT * FROM fact_orders WHERE order_date = '2024-01-15';
-- Good
SELECT order_id, customer_id, amount
FROM fact_orders
WHERE order_date = '2024-01-15';

-- 2. Leverage Partition Pruning
-- Bad: Function on partition column
SELECT * FROM fact_orders WHERE YEAR(order_date) = 2024;
-- Good: Direct comparison
SELECT * FROM fact_orders
WHERE order_date >= '2024-01-01' AND order_date < '2025-01-01';

-- 3. Use Approximate Aggregation Functions (for large datasets)
-- Exact count (slow)
SELECT COUNT(DISTINCT user_id) FROM fact_events;
-- Approximate count (fast, <1% error)
SELECT APPROX_COUNT_DISTINCT(user_id) FROM fact_events;

-- 4. Materialize Intermediate Results
CREATE TABLE temp_active_users AS
SELECT DISTINCT user_id
FROM fact_events
WHERE event_date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY);

SELECT u.*, t.active
FROM dim_user u
LEFT JOIN temp_active_users t ON u.user_id = t.user_id;

-- 5. Use CTEs to Optimize Complex Queries
WITH daily_sales AS (
    SELECT
        order_date,
        SUM(amount) as revenue
    FROM fact_orders
    GROUP BY order_date
),
monthly_avg AS (
    SELECT AVG(revenue) as avg_daily_revenue
    FROM daily_sales
)
SELECT
    d.order_date,
    d.revenue,
    m.avg_daily_revenue,
    d.revenue / m.avg_daily_revenue as revenue_index
FROM daily_sales d
CROSS JOIN monthly_avg m;

-- 6. BigQuery: Use Nested Structures to Avoid JOINs
-- Denormalized storage
CREATE TABLE orders_denormalized AS
SELECT
    o.order_id,
    o.order_date,
    STRUCT(
        c.customer_id,
        c.customer_name,
        c.segment
    ) as customer,
    ARRAY_AGG(STRUCT(
        i.product_id,
        i.quantity,
        i.price
    )) as items
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN order_items i ON o.order_id = i.order_id
GROUP BY o.order_id, o.order_date, c.customer_id, c.customer_name, c.segment;
```

### Indexing and Statistics

```sql
-- Snowflake Search Optimization
ALTER TABLE dim_customer ADD SEARCH OPTIMIZATION ON EQUALITY(customer_id);
ALTER TABLE fact_orders ADD SEARCH OPTIMIZATION ON EQUALITY(order_id, customer_id);

-- Check search optimization status
SHOW TABLES LIKE 'dim_customer';
DESCRIBE SEARCH OPTIMIZATION ON dim_customer;

-- BigQuery BI Engine (accelerates BI queries)
-- Enable BI Engine in BigQuery console and allocate memory

-- PostgreSQL/Redshift Statistics
ANALYZE fact_orders;
ANALYZE dim_customer;

-- View table statistics
SELECT
    schemaname,
    relname,
    n_live_tup,
    n_dead_tup,
    last_vacuum,
    last_analyze
FROM pg_stat_user_tables
WHERE relname = 'fact_orders';
```

## Interview Key Points

### Frequently Asked Interview Questions

**Q1: What's the difference between Star Schema and Snowflake Schema? When to use each?**

```
Star Schema:
- Dimension tables are not further normalized
- Better query performance (fewer joins)
- Storage redundancy but simple to understand
- Use case: Most BI scenarios

Snowflake Schema:
- Dimension tables normalized into multiple tables
- Saves storage space
- Higher maintenance complexity
- Use case: Deep dimension hierarchies, flexible analysis needs
```

**Q2: How do you implement SCD Type 2?**

```sql
-- Key fields:
-- effective_date: Start date when record becomes valid
-- expiration_date: End date when record expires
-- is_current: Whether the record is currently active

-- Change handling process:
-- 1. Set is_current to FALSE for current record
-- 2. Update expiration_date to day before change
-- 3. Insert new record with is_current = TRUE
```

**Q3: What are the types of fact tables? When to use each?**

```
1. Transaction Fact Table: Records each transaction, finest granularity
   - Examples: Order line items, transaction logs

2. Periodic Snapshot Fact Table: Records state at regular intervals
   - Examples: Daily inventory, monthly account balances

3. Accumulating Snapshot Fact Table: Tracks multiple process milestones
   - Examples: Order fulfillment (ordered->paid->shipped->delivered)
```

**Q4: What's the purpose of data warehouse layering?**

```
ODS: Preserve source data as-is, enables data lineage
DWD: Unified cleansing, core layer of the warehouse
DWS: Subject-oriented light aggregation, improves query efficiency
ADS: Application-specific, meets targeted analysis needs

Benefits of layering:
- Clear data flow
- High reusability
- Easier maintenance and troubleshooting
- Performance optimization at each layer
```

**Q5: How do you optimize slow queries?**

```sql
-- 1. Check execution plan
EXPLAIN ANALYZE SELECT ...;

-- 2. Optimization strategies:
-- - Use partition pruning
-- - Avoid SELECT *
-- - Use appropriate JOIN strategies
-- - Add clustering/indexes
-- - Materialize intermediate results
-- - Use approximate functions for large datasets
```

### Practical Design Exercise

**Problem: Design an E-commerce Order Analytics Data Warehouse**

```sql
-- Core Fact Table
CREATE TABLE fact_order_detail (
    order_detail_id BIGINT,
    order_id BIGINT,
    -- Dimension foreign keys
    date_key INT,
    customer_key INT,
    product_key INT,
    seller_key INT,
    promotion_key INT,
    -- Degenerate dimension
    order_no STRING,
    -- Measures
    quantity INT,
    unit_price DECIMAL(10,2),
    discount_amount DECIMAL(10,2),
    pay_amount DECIMAL(10,2),
    cost_amount DECIMAL(10,2)
);

-- Core analytics metrics
-- GMV, order count, average order value, repeat purchase rate, conversion rate

-- Typical analysis SQL
-- Sales trend by date and category
SELECT
    d.full_date,
    p.category_l1,
    SUM(f.pay_amount) as gmv,
    COUNT(DISTINCT f.order_id) as order_count,
    COUNT(DISTINCT f.customer_key) as buyer_count
FROM fact_order_detail f
JOIN dim_date d ON f.date_key = d.date_key
JOIN dim_product p ON f.product_key = p.product_key
WHERE d.full_date BETWEEN '2024-01-01' AND '2024-01-31'
GROUP BY d.full_date, p.category_l1
ORDER BY d.full_date, gmv DESC;
```

## Further Reading

### Official Documentation

- [Google BigQuery Documentation](https://cloud.google.com/bigquery/docs) - Comprehensive BigQuery guide
- [Snowflake Documentation](https://docs.snowflake.com/) - Complete Snowflake reference
- [Apache Spark SQL Guide](https://spark.apache.org/docs/latest/sql-programming-guide.html) - Spark SQL documentation
- [dbt Documentation](https://docs.getdbt.com/) - Analytics engineering with dbt

### Classic Books

- **"The Data Warehouse Toolkit"** by Ralph Kimball - The definitive guide to dimensional modeling
- **"Building the Data Warehouse"** by W.H. Inmon - Data warehousing fundamentals by the pioneer
- **"Star Schema: The Complete Reference"** by Christopher Adamson - Comprehensive star schema design
- **"Agile Data Warehouse Design"** by Lawrence Corr - Modern data warehouse design patterns

### Online Resources

- [Kimball Group Design Tips](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/) - Dimensional modeling best practices
- [Modern Data Stack](https://www.moderndatastack.xyz/) - Tools and technologies for modern data engineering
- [Data Engineering Weekly](https://www.dataengineeringweekly.com/) - Weekly newsletter on data engineering
- [dbt Community](https://www.getdbt.com/community/) - Analytics engineering community and resources

### Certifications

- Google Cloud Professional Data Engineer
- Snowflake SnowPro Core Certification
- AWS Certified Data Analytics - Specialty
- Databricks Certified Data Engineer

---

## Summary

The data warehouse is the cornerstone of enterprise data analytics. We've covered a complete knowledge system from fundamental concepts to practical applications:

1. **Core Concepts**: Understanding the four characteristics of data warehouses and OLAP features
2. **Dimensional Modeling**: Mastering star/snowflake schema design methodologies
3. **Facts and Dimensions**: Deep understanding of different fact table types and dimension design techniques
4. **SCD Processing**: Proficient use of various slowly changing dimension strategies
5. **Modern Architectures**: Understanding Lakehouse, Lambda, and other contemporary data architectures
6. **Cloud Data Warehouses**: Mastering core features of BigQuery and Snowflake
7. **Data Layering**: Building clear ODS-DWD-DWS-ADS layer architecture
8. **Performance Optimization**: Using partitioning, clustering, and other techniques to improve query performance
9. **Data Governance**: Establishing comprehensive data quality and security controls

By mastering these concepts and techniques, you will be able to design and build enterprise-grade data warehouse systems that provide powerful data support for business decision-making.
