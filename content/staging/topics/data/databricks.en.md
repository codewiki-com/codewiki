---
title: Databricks Unified Analytics Platform
description: Explore Databricks Lakehouse platform for data engineering and machine learning
track: data
section: analytics-engines
difficulty: intermediate
tags:
  - Databricks
  - Spark
  - Data Lake
  - Machine Learning
status: imported
origin: old/src/content/docs/data/databricks.en.md
divergence: 0.13
issues: []
legacy:
  category: Data
  subcategory: Analytics Platform
  order: 16
  lastUpdated: 2026-01-07
---

Databricks is a unified analytics platform that brings together data engineering, data science, and business analytics on a single collaborative platform. Built on Apache Spark and founded by the creators of Spark, Delta Lake, and MLflow, Databricks provides a fully managed cloud service that simplifies big data processing and AI workloads through its innovative lakehouse architecture.

## Introduction to Databricks

### What is Databricks?

Databricks is a cloud-based data intelligence platform that combines the best features of data warehouses and data lakes into a unified lakehouse architecture. It provides a collaborative workspace where data teams can work together on data engineering, analytics, and machine learning projects.

**Core Value Propositions:**

| Capability | Description |
|------------|-------------|
| Unified Platform | Single environment for data engineering, science, and analytics |
| Managed Spark | Fully managed Apache Spark clusters with automatic optimization |
| Collaborative Notebooks | Interactive notebooks supporting Python, SQL, Scala, and R |
| Delta Lake | Native ACID transactions and data reliability |
| MLflow Integration | End-to-end machine learning lifecycle management |
| Unity Catalog | Unified governance for data and AI assets |
| Photon Engine | Vectorized query engine for faster SQL performance |

### The Lakehouse Architecture

The lakehouse architecture represents a paradigm shift in data management, combining the reliability and performance of data warehouses with the flexibility and cost-effectiveness of data lakes.

```
+------------------------------------------------------------------+
|                      Databricks Lakehouse                         |
|  +--------------------------------------------------------------+ |
|  |                     Unity Catalog                             | |
|  |         (Unified Governance, Security, Lineage)              | |
|  +--------------------------------------------------------------+ |
|                              |                                     |
|  +--------------------------------------------------------------+ |
|  |                      Delta Lake                               | |
|  |    (ACID Transactions, Time Travel, Schema Evolution)        | |
|  +--------------------------------------------------------------+ |
|                              |                                     |
|  +---------------+  +---------------+  +---------------+          |
|  |   Data        |  |   Data        |  |   Machine     |          |
|  |   Engineering |  |   Analytics   |  |   Learning    |          |
|  |   (ETL/ELT)   |  |   (SQL/BI)    |  |   (MLflow)    |          |
|  +---------------+  +---------------+  +---------------+          |
|                              |                                     |
|  +--------------------------------------------------------------+ |
|  |              Cloud Object Storage                             | |
|  |         (AWS S3 / Azure ADLS / GCS)                          | |
|  +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

**Benefits of the Lakehouse:**

1. **Single Source of Truth**: One copy of data serves all use cases
2. **Open Standards**: Uses open file formats (Parquet/Delta) and APIs
3. **Cost Efficiency**: Storage on commodity cloud object storage
4. **ACID Transactions**: Full transactional support on data lakes
5. **Schema Enforcement**: Data quality and consistency guarantees
6. **Time Travel**: Historical queries and data versioning
7. **Unified Security**: Consistent governance across all workloads

### Databricks vs Traditional Architectures

| Feature | Data Warehouse | Data Lake | Databricks Lakehouse |
|---------|----------------|-----------|---------------------|
| ACID Transactions | Yes | No | Yes (Delta Lake) |
| Schema Enforcement | Yes | No | Yes |
| BI Support | Excellent | Limited | Excellent |
| ML Support | Limited | Good | Excellent |
| Streaming Support | Limited | Good | Excellent |
| Cost | High | Low | Moderate |
| Data Formats | Proprietary | Open | Open (Delta) |
| Governance | Strong | Weak | Strong (Unity Catalog) |
| Performance | High | Variable | High (Photon) |

## Databricks Workspace

### Workspace Architecture

Databricks workspace is organized into a hierarchical structure that facilitates collaboration and resource management.

```
Databricks Workspace
├── Workspace (Files & Folders)
│   ├── Users/
│   │   └── user@company.com/
│   │       ├── Notebooks
│   │       └── Projects
│   ├── Shared/
│   │   ├── Team Notebooks
│   │   └── Libraries
│   └── Repos/
│       └── Git Integration
├── Data
│   ├── Catalogs (Unity Catalog)
│   ├── Databases/Schemas
│   ├── Tables
│   └── Volumes
├── Compute
│   ├── All-Purpose Clusters
│   ├── Job Clusters
│   └── SQL Warehouses
├── Workflows
│   ├── Jobs
│   └── DLT Pipelines
└── Machine Learning
    ├── Experiments
    ├── Models
    └── Feature Store
```

### Control Plane and Data Plane

```
+-------------------------------------------+
|            CONTROL PLANE                   |
|         (Managed by Databricks)           |
|  +---------------------------------------+ |
|  | Workspace UI | Cluster Management    | |
|  | Job Scheduler | Notebook Storage     | |
|  | Access Control | REST APIs           | |
|  | Unity Catalog Metastore              | |
|  +---------------------------------------+ |
+-------------------------------------------+
                    |
                    | Secure Connection
                    v
+-------------------------------------------+
|             DATA PLANE                     |
|      (Customer's Cloud Account)           |
|  +---------------------------------------+ |
|  | Compute Clusters | Data Storage      | |
|  | (VMs/Containers) | (S3/ADLS/GCS)     | |
|  | Photon Engine   | Delta Tables       | |
|  +---------------------------------------+ |
+-------------------------------------------+
```

**Security Benefits:**

- Data never leaves the customer's cloud environment
- Compute resources run in customer's VPC/VNet
- Fine-grained access control through Unity Catalog
- Encryption at rest and in transit

## Databricks Notebooks

### Notebook Fundamentals

Databricks notebooks provide an interactive environment for data exploration, analysis, and collaboration.

```python
# Default language declaration at notebook level
# Supported: Python, SQL, Scala, R

# Magic commands to switch languages within a notebook
# %python, %sql, %scala, %r, %md, %sh, %fs, %pip
```

**Multi-language Support in a Single Notebook:**

```python
# Python cell - Data processing with PySpark
from pyspark.sql import functions as F

df = spark.read.table("catalog.schema.sales_data")
summary = df.groupBy("region").agg(
    F.sum("revenue").alias("total_revenue"),
    F.avg("quantity").alias("avg_quantity"),
    F.count("*").alias("transaction_count")
)
summary.display()
```

```sql
-- SQL cell - Direct SQL queries
%sql
SELECT
    region,
    SUM(revenue) as total_revenue,
    AVG(quantity) as avg_quantity,
    COUNT(*) as transaction_count
FROM catalog.schema.sales_data
GROUP BY region
ORDER BY total_revenue DESC
```

```scala
// Scala cell - High-performance processing
%scala
val df = spark.table("catalog.schema.sales_data")
val result = df.groupBy("region")
  .agg(
    sum("revenue").as("total_revenue"),
    avg("quantity").as("avg_quantity"),
    count("*").as("transaction_count")
  )
result.show()
```

```r
# R cell - Statistical analysis
%r
library(SparkR)
df <- sql("SELECT * FROM catalog.schema.sales_data")
summary(df)
```

### Notebook Widgets

Widgets enable parameterized notebooks for interactive exploration and production job configuration.

```python
# Create different widget types
dbutils.widgets.text("start_date", "2024-01-01", "Start Date")
dbutils.widgets.dropdown("region", "ALL", ["ALL", "US", "EU", "APAC"], "Region")
dbutils.widgets.multiselect("products", "All",
    ["All", "Electronics", "Clothing", "Food", "Home"], "Products")
dbutils.widgets.combobox("threshold", "100",
    ["50", "100", "200", "500", "1000"], "Revenue Threshold")

# Retrieve widget values
start_date = dbutils.widgets.get("start_date")
region = dbutils.widgets.get("region")
products = dbutils.widgets.get("products")
threshold = int(dbutils.widgets.get("threshold"))

# Use in queries with parameterization
query = f"""
    SELECT * FROM catalog.schema.sales
    WHERE sale_date >= '{start_date}'
    AND ('{region}' = 'ALL' OR region = '{region}')
    AND amount >= {threshold}
"""
df = spark.sql(query)

# Remove widgets when done
dbutils.widgets.removeAll()
```

### Databricks Utilities (dbutils)

```python
# File System Utilities
dbutils.fs.ls("/mnt/data")                          # List files
dbutils.fs.cp("/source/path", "/dest/path")         # Copy files
dbutils.fs.mv("/source/path", "/dest/path")         # Move files
dbutils.fs.rm("/path/to/delete", recurse=True)      # Remove files
dbutils.fs.mkdirs("/new/directory")                 # Create directory
dbutils.fs.head("/path/file.txt", 1000)             # Read first bytes
dbutils.fs.put("/path/file.txt", "content", True)   # Write content

# Secrets Management
scopes = dbutils.secrets.listScopes()               # List secret scopes
secrets = dbutils.secrets.list("my-scope")          # List secrets in scope
password = dbutils.secrets.get("my-scope", "db-password")  # Get secret value

# Notebook Utilities
result = dbutils.notebook.run("./child_notebook",
    timeout_seconds=600,
    arguments={"param1": "value1", "param2": "value2"})
dbutils.notebook.exit("Success: processed 1000 records")

# Library Utilities
dbutils.library.installPyPI("pandas==2.0.0")        # Install PyPI package
dbutils.library.restartPython()                     # Restart Python interpreter

# Jobs Utilities (for passing data between tasks)
dbutils.jobs.taskValues.set(key="row_count", value=12345)
dbutils.jobs.taskValues.set(key="output_path", value="/mnt/data/output")
row_count = dbutils.jobs.taskValues.get(taskKey="upstream_task", key="row_count")
```

### Version Control with Repos

```python
# Databricks Repos integrates with Git providers
# Supported: GitHub, GitLab, Bitbucket, Azure DevOps

# Repository structure best practices:
"""
my-databricks-project/
├── notebooks/
│   ├── exploration/
│   │   └── data_analysis.py
│   ├── production/
│   │   ├── bronze_ingestion.py
│   │   ├── silver_transformation.py
│   │   └── gold_aggregation.py
│   └── tests/
│       └── test_transformations.py
├── src/
│   └── my_package/
│       ├── __init__.py
│       ├── transformations.py
│       └── utils.py
├── tests/
│   └── unit/
│       └── test_transformations.py
├── requirements.txt
├── pyproject.toml
└── README.md
"""

# Import custom modules from repo
import sys
sys.path.append("/Workspace/Repos/user/my-project/src")
from my_package.transformations import clean_data, validate_schema
from my_package.utils import get_config
```

## Cluster Management

### Cluster Types

```
Cluster Types Overview:
+--------------------+--------------------------------------------------+
| All-Purpose        | Interactive analysis, development, collaboration |
| Clusters           | - Persistent state between runs                  |
|                    | - Manual or auto-scaling                         |
|                    | - Multiple concurrent users                      |
|                    | - Higher DBU cost                                |
+--------------------+--------------------------------------------------+
| Job Clusters       | Automated workloads, production pipelines        |
|                    | - Created per job run, auto-terminates          |
|                    | - Optimized for single workload                  |
|                    | - Lower DBU cost                                 |
|                    | - Recommended for production                     |
+--------------------+--------------------------------------------------+
| SQL Warehouses     | SQL analytics and BI tool connectivity           |
|                    | - Serverless or classic options                  |
|                    | - T-shirt sizing (2X-Small to 4X-Large)         |
|                    | - Optimized for concurrent queries               |
|                    | - Photon acceleration included                   |
+--------------------+--------------------------------------------------+
```

### Cluster Configuration

```python
# Cluster configuration via API or Terraform
cluster_config = {
    "cluster_name": "production-analytics-cluster",
    "spark_version": "14.3.x-scala2.12",  # Databricks Runtime version
    "node_type_id": "i3.xlarge",          # AWS instance type

    # Fixed size cluster
    "num_workers": 4,

    # OR Auto-scaling configuration
    "autoscale": {
        "min_workers": 2,
        "max_workers": 10
    },

    # Auto-termination (minutes of inactivity)
    "autotermination_minutes": 30,

    # Spark configuration
    "spark_conf": {
        "spark.sql.adaptive.enabled": "true",
        "spark.sql.adaptive.coalescePartitions.enabled": "true",
        "spark.sql.adaptive.skewJoin.enabled": "true",
        "spark.databricks.delta.optimizeWrite.enabled": "true",
        "spark.databricks.delta.autoCompact.enabled": "true",
        "spark.databricks.io.cache.enabled": "true"
    },

    # Environment variables
    "spark_env_vars": {
        "ENVIRONMENT": "production",
        "LOG_LEVEL": "INFO",
        "TZ": "UTC"
    },

    # Init scripts for custom setup
    "init_scripts": [
        {"workspace": {"destination": "/Shared/init-scripts/install-libs.sh"}}
    ],

    # Custom tags for cost allocation
    "custom_tags": {
        "Team": "Data Engineering",
        "Project": "Customer Analytics",
        "CostCenter": "CC-12345",
        "Environment": "Production"
    },

    # Instance pool for faster startup
    "instance_pool_id": "pool-abc123",

    # Policy for governance
    "policy_id": "policy-xyz789"
}
```

### Databricks Runtime Versions

| Runtime Type | Description | Use Case |
|-------------|-------------|----------|
| Standard | Base Spark with Delta Lake | General data engineering |
| ML Runtime | Includes TensorFlow, PyTorch, XGBoost, etc. | Machine learning workloads |
| Photon Runtime | Accelerated vectorized query engine | SQL analytics, fast queries |
| GPU Runtime | GPU-enabled for deep learning | Training neural networks |
| Genomics Runtime | Optimized for life sciences | Genomics data processing |

```python
# Check current runtime version
print(spark.conf.get("spark.databricks.clusterUsageTags.sparkVersion"))

# Photon acceleration (automatic with Photon runtime)
# Provides 2-8x performance improvement for SQL/DataFrame operations

# Query with Photon acceleration
df = spark.read.format("delta").load("/mnt/data/large_table")
result = df.filter("date >= '2024-01-01'") \
    .groupBy("category", "region") \
    .agg({"amount": "sum", "quantity": "avg"})
result.show()
```

### Cluster Policies

Cluster policies enable administrators to control cluster configurations and enforce organizational standards.

```json
{
    "name": "Data Engineering Standard Policy",
    "description": "Standard policy for data engineering workloads",
    "definition": {
        "spark_version": {
            "type": "allowlist",
            "values": ["14.3.x-scala2.12", "13.3.x-scala2.12"],
            "defaultValue": "14.3.x-scala2.12"
        },
        "node_type_id": {
            "type": "allowlist",
            "values": ["i3.xlarge", "i3.2xlarge", "r5.xlarge", "r5.2xlarge"]
        },
        "driver_node_type_id": {
            "type": "fixed",
            "value": "i3.xlarge"
        },
        "autotermination_minutes": {
            "type": "range",
            "minValue": 10,
            "maxValue": 120,
            "defaultValue": 30
        },
        "num_workers": {
            "type": "range",
            "minValue": 1,
            "maxValue": 20
        },
        "autoscale.max_workers": {
            "type": "range",
            "minValue": 2,
            "maxValue": 20
        },
        "custom_tags.Team": {
            "type": "fixed",
            "value": "Data Engineering"
        },
        "custom_tags.CostCenter": {
            "type": "fixed",
            "value": "CC-12345",
            "hidden": true
        },
        "spark_conf.spark.databricks.delta.optimizeWrite.enabled": {
            "type": "fixed",
            "value": "true"
        }
    }
}
```

## Delta Lake Integration

### Creating Delta Tables

```python
from delta.tables import DeltaTable
from pyspark.sql.types import *

# Create Delta table from DataFrame
data = [
    (1, "Alice", "Engineering", 85000.0, "2023-01-15"),
    (2, "Bob", "Marketing", 72000.0, "2023-02-20"),
    (3, "Carol", "Engineering", 92000.0, "2023-03-10"),
    (4, "David", "Sales", 78000.0, "2023-04-05")
]

schema = StructType([
    StructField("id", IntegerType(), False),
    StructField("name", StringType(), True),
    StructField("department", StringType(), True),
    StructField("salary", DoubleType(), True),
    StructField("hire_date", StringType(), True)
])

df = spark.createDataFrame(data, schema)

# Write as managed Delta table
df.write.format("delta") \
    .mode("overwrite") \
    .saveAsTable("catalog.schema.employees")

# Write as external Delta table with partitioning
df.write.format("delta") \
    .partitionBy("department") \
    .mode("overwrite") \
    .option("overwriteSchema", "true") \
    .save("/mnt/data/employees_delta")
```

```sql
-- Create managed Delta table with SQL
CREATE TABLE IF NOT EXISTS catalog.schema.sales (
    transaction_id BIGINT GENERATED ALWAYS AS IDENTITY,
    product_id STRING NOT NULL,
    customer_id STRING NOT NULL,
    quantity INT,
    unit_price DECIMAL(10, 2),
    total_amount DECIMAL(12, 2),
    transaction_date DATE,
    region STRING
)
USING DELTA
PARTITIONED BY (transaction_date)
TBLPROPERTIES (
    'delta.autoOptimize.optimizeWrite' = 'true',
    'delta.autoOptimize.autoCompact' = 'true',
    'delta.logRetentionDuration' = 'interval 30 days',
    'delta.deletedFileRetentionDuration' = 'interval 7 days'
);

-- Create external table pointing to existing Delta location
CREATE TABLE catalog.schema.external_events
USING DELTA
LOCATION 's3://bucket/data/events/';

-- Clone a table (shallow or deep)
CREATE TABLE catalog.schema.sales_backup
SHALLOW CLONE catalog.schema.sales;

CREATE TABLE catalog.schema.sales_archive
DEEP CLONE catalog.schema.sales;
```

### MERGE Operations (Upsert)

```python
from delta.tables import DeltaTable

# Load existing Delta table
deltaTable = DeltaTable.forName(spark, "catalog.schema.employees")

# Prepare updates/inserts DataFrame
updates = spark.createDataFrame([
    (1, "Alice", "Engineering", 90000.0, "2023-01-15"),   # Update salary
    (3, "Carol", "Data Science", 95000.0, "2023-03-10"), # Update dept & salary
    (5, "Eve", "Engineering", 82000.0, "2024-01-10")     # New employee
], schema)

# Perform MERGE (upsert) operation
deltaTable.alias("target").merge(
    updates.alias("source"),
    "target.id = source.id"
).whenMatchedUpdate(
    condition="source.salary > target.salary",
    set={
        "name": "source.name",
        "department": "source.department",
        "salary": "source.salary"
    }
).whenNotMatchedInsert(
    values={
        "id": "source.id",
        "name": "source.name",
        "department": "source.department",
        "salary": "source.salary",
        "hire_date": "source.hire_date"
    }
).execute()
```

```sql
-- MERGE with SQL (SCD Type 2 example)
MERGE INTO catalog.schema.employees_history AS target
USING catalog.schema.employees_updates AS source
ON target.id = source.id AND target.is_current = true
WHEN MATCHED AND (
    target.department != source.department OR
    target.salary != source.salary
) THEN UPDATE SET
    is_current = false,
    end_date = current_date()
WHEN NOT MATCHED THEN INSERT (
    id, name, department, salary, hire_date, is_current, start_date, end_date
) VALUES (
    source.id, source.name, source.department, source.salary,
    source.hire_date, true, current_date(), null
);

-- Insert new current records for changes
INSERT INTO catalog.schema.employees_history
SELECT
    id, name, department, salary, hire_date,
    true as is_current,
    current_date() as start_date,
    null as end_date
FROM catalog.schema.employees_updates source
WHERE EXISTS (
    SELECT 1 FROM catalog.schema.employees_history target
    WHERE target.id = source.id
    AND target.is_current = false
    AND target.end_date = current_date()
);
```

### Time Travel and Data Versioning

```python
# Read table at specific version
df_v0 = spark.read.format("delta") \
    .option("versionAsOf", 0) \
    .table("catalog.schema.employees")

# Read table at specific timestamp
df_timestamp = spark.read.format("delta") \
    .option("timestampAsOf", "2024-01-15 10:30:00") \
    .table("catalog.schema.employees")

# View table history
deltaTable = DeltaTable.forName(spark, "catalog.schema.employees")
history = deltaTable.history()
history.select(
    "version", "timestamp", "operation",
    "operationParameters", "operationMetrics"
).show(truncate=False)

# Restore to previous version
deltaTable.restoreToVersion(5)

# Restore to timestamp
deltaTable.restoreToTimestamp("2024-01-15 10:00:00")
```

```sql
-- Time travel queries with SQL
SELECT * FROM catalog.schema.employees VERSION AS OF 5;
SELECT * FROM catalog.schema.employees TIMESTAMP AS OF '2024-01-15 10:00:00';

-- Compare versions
SELECT
    current.id,
    current.salary as current_salary,
    previous.salary as previous_salary,
    current.salary - previous.salary as salary_change
FROM catalog.schema.employees current
FULL OUTER JOIN catalog.schema.employees VERSION AS OF 5 previous
    ON current.id = previous.id
WHERE current.salary != previous.salary;

-- View history
DESCRIBE HISTORY catalog.schema.employees;

-- Restore table
RESTORE TABLE catalog.schema.employees TO VERSION AS OF 5;
```

### Delta Lake Optimization

```python
from delta.tables import DeltaTable

# Get Delta table reference
deltaTable = DeltaTable.forName(spark, "catalog.schema.large_table")

# Compact small files (bin-packing)
deltaTable.optimize().executeCompaction()

# Z-Order clustering for query optimization
# Best for columns frequently used in WHERE/JOIN clauses
deltaTable.optimize().executeZOrderBy("date", "customer_id", "product_id")

# Vacuum old files (remove files not referenced by table)
# Default retention: 7 days (168 hours)
deltaTable.vacuum(168)

# Analyze table for statistics
spark.sql("ANALYZE TABLE catalog.schema.large_table COMPUTE STATISTICS FOR ALL COLUMNS")
```

```sql
-- Enable auto-optimization at table level
ALTER TABLE catalog.schema.large_table SET TBLPROPERTIES (
    'delta.autoOptimize.optimizeWrite' = 'true',
    'delta.autoOptimize.autoCompact' = 'true',
    'delta.targetFileSize' = '128mb'
);

-- Optimize with predicate
OPTIMIZE catalog.schema.large_table
WHERE date >= current_date() - INTERVAL 7 DAYS
ZORDER BY (customer_id, product_id);

-- Vacuum with retention check
VACUUM catalog.schema.large_table RETAIN 168 HOURS;

-- Enable liquid clustering (Databricks 13.3+)
ALTER TABLE catalog.schema.large_table
CLUSTER BY (date, customer_id);

-- Liquid clustering automatically reorganizes data
-- No manual OPTIMIZE ZORDER needed
```

**Delta Lake Optimization Best Practices:**

| Optimization | When to Use | Impact |
|-------------|-------------|--------|
| Optimize (Compaction) | Many small files | Faster queries, less metadata |
| Z-Order | Frequently filtered columns | Faster point queries |
| Liquid Clustering | Dynamic query patterns | Automatic optimization |
| Partitioning | High-cardinality date/region | Partition pruning |
| Vacuum | Regular maintenance | Storage cost reduction |
| Data Skipping | Large tables | Predicate pushdown |

## Unity Catalog

### Three-Level Namespace

Unity Catalog introduces a three-level namespace for organizing data assets.

```
Unity Catalog Hierarchy:
+--------------------------------------------------+
|                   Metastore                       |
|  (Top-level container, one per cloud region)     |
|  - Stores metadata for all data assets           |
|  - Provides unified access control               |
|  - Tracks data lineage automatically             |
+--------------------------------------------------+
         |
         v
+--------------------------------------------------+
|                    Catalog                        |
|  (Logical grouping of schemas/databases)         |
|  Examples: production, development, sandbox      |
+--------------------------------------------------+
         |
         v
+--------------------------------------------------+
|                    Schema                         |
|  (Collection of tables, views, functions)        |
|  Examples: sales, marketing, finance, raw        |
+--------------------------------------------------+
         |
         v
+--------------------------------------------------+
|              Tables / Views / Functions           |
|  - Managed tables: Databricks manages lifecycle  |
|  - External tables: Data at external location    |
|  - Views: Logical queries over tables            |
|  - Functions: User-defined functions             |
+--------------------------------------------------+

Access Pattern: catalog.schema.table
Example: production.sales.customers
```

### Managing Catalogs and Schemas

```sql
-- Create a new catalog
CREATE CATALOG IF NOT EXISTS production
COMMENT 'Production data catalog for business operations';

-- Set default catalog
USE CATALOG production;

-- Create schema within catalog
CREATE SCHEMA IF NOT EXISTS production.sales
MANAGED LOCATION 's3://data-bucket/production/sales/'
COMMENT 'Sales department data including transactions and customers';

-- Create schema with properties
CREATE SCHEMA production.marketing
COMMENT 'Marketing analytics data'
WITH DBPROPERTIES (
    'owner' = 'marketing-team',
    'retention_days' = '365'
);

-- Create managed table (Databricks manages storage)
CREATE TABLE production.sales.customers (
    customer_id BIGINT GENERATED ALWAYS AS IDENTITY,
    email STRING NOT NULL,
    first_name STRING,
    last_name STRING,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
    updated_at TIMESTAMP,
    CONSTRAINT pk_customers PRIMARY KEY (customer_id)
)
USING DELTA
COMMENT 'Customer master data'
TBLPROPERTIES (
    'delta.autoOptimize.optimizeWrite' = 'true',
    'quality' = 'gold'
);

-- Create external table
CREATE TABLE production.sales.external_transactions
USING DELTA
LOCATION 's3://external-bucket/transactions/'
COMMENT 'External transaction data from legacy system';

-- Create view with column-level documentation
CREATE VIEW production.sales.active_customers
COMMENT 'Customers with activity in last 90 days'
AS
SELECT
    customer_id,
    email,
    first_name,
    last_name,
    last_order_date
FROM production.sales.customers c
JOIN production.sales.orders o ON c.customer_id = o.customer_id
WHERE o.order_date >= CURRENT_DATE() - INTERVAL 90 DAYS;
```

### Access Control and Permissions

```sql
-- Grant catalog-level permissions
GRANT USE CATALOG ON CATALOG production TO `data-team@company.com`;
GRANT CREATE SCHEMA ON CATALOG production TO `data-engineers@company.com`;

-- Grant schema-level permissions
GRANT USE SCHEMA ON SCHEMA production.sales TO `analysts@company.com`;
GRANT SELECT ON SCHEMA production.sales TO `analysts@company.com`;
GRANT ALL PRIVILEGES ON SCHEMA production.sales TO `data-engineers@company.com`;

-- Grant table-level permissions
GRANT SELECT ON TABLE production.sales.customers TO `marketing@company.com`;
GRANT MODIFY ON TABLE production.sales.customers TO `data-engineers@company.com`;
GRANT SELECT (customer_id, first_name, last_name)
    ON TABLE production.sales.customers TO `external-partner`;

-- Row-level security with row filters
CREATE FUNCTION production.security.region_filter(region STRING)
RETURN IF(IS_MEMBER('global-access'), true, region = CURRENT_USER_REGION());

ALTER TABLE production.sales.transactions
SET ROW FILTER production.security.region_filter ON (region);

-- Column-level security with column masks
CREATE FUNCTION production.security.mask_email(email STRING)
RETURN CASE
    WHEN IS_MEMBER('pii-access') THEN email
    ELSE CONCAT(LEFT(email, 2), '****@', SPLIT(email, '@')[1])
END;

CREATE FUNCTION production.security.mask_ssn(ssn STRING)
RETURN CONCAT('XXX-XX-', RIGHT(ssn, 4));

ALTER TABLE production.sales.customers
ALTER COLUMN email SET MASK production.security.mask_email;

-- View effective permissions
SHOW GRANTS ON TABLE production.sales.customers;
SHOW GRANTS TO `user@company.com`;
SHOW GRANTS ON CATALOG production;
```

### Data Lineage

```python
# Unity Catalog automatically tracks data lineage
# View lineage through Catalog Explorer UI or system tables

# Query column-level lineage
column_lineage = spark.sql("""
    SELECT
        source_table_full_name,
        source_column_name,
        target_table_full_name,
        target_column_name,
        event_time
    FROM system.access.column_lineage
    WHERE target_table_full_name = 'production.sales.daily_metrics'
    ORDER BY event_time DESC
    LIMIT 100
""")
column_lineage.display()

# Query table-level lineage
table_lineage = spark.sql("""
    SELECT
        source_table_full_name,
        target_table_full_name,
        source_type,
        target_type,
        created_by,
        event_time
    FROM system.access.table_lineage
    WHERE target_table_full_name LIKE 'production.%'
    ORDER BY event_time DESC
""")
table_lineage.display()

# Query audit logs
audit_logs = spark.sql("""
    SELECT
        event_time,
        action_name,
        user_identity.email as user_email,
        request_params,
        response.status_code
    FROM system.access.audit
    WHERE action_name IN ('createTable', 'deleteTable', 'alterTable')
    AND event_date >= current_date() - INTERVAL 7 DAYS
    ORDER BY event_time DESC
""")
audit_logs.display()
```

### External Locations and Storage Credentials

```sql
-- Create storage credential (admin only)
CREATE STORAGE CREDENTIAL aws_s3_credential
WITH (
    AWS_IAM_ROLE = 'arn:aws:iam::123456789012:role/databricks-unity-catalog'
)
COMMENT 'Credential for accessing company S3 buckets';

-- Create external location
CREATE EXTERNAL LOCATION company_data_lake
URL 's3://company-data-lake/unity-catalog/'
WITH (STORAGE CREDENTIAL aws_s3_credential)
COMMENT 'Company data lake external location';

-- Grant access to external location
GRANT READ FILES ON EXTERNAL LOCATION company_data_lake
    TO `data-engineers@company.com`;
GRANT WRITE FILES ON EXTERNAL LOCATION company_data_lake
    TO `data-engineers@company.com`;
GRANT CREATE EXTERNAL TABLE ON EXTERNAL LOCATION company_data_lake
    TO `data-engineers@company.com`;

-- Create external table using the location
CREATE TABLE production.raw.events
USING DELTA
LOCATION 's3://company-data-lake/unity-catalog/raw/events/';

-- Create volume for unstructured data
CREATE VOLUME production.raw.files
LOCATION 's3://company-data-lake/unity-catalog/raw/files/'
COMMENT 'Volume for raw unstructured files';
```

## MLflow Integration

### Experiment Tracking

```python
import mlflow
import mlflow.sklearn
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
import pandas as pd

# Set experiment (creates if not exists)
mlflow.set_experiment("/Users/user@company.com/customer-churn-prediction")

# Load and prepare data
df = spark.table("production.ml.customer_features").toPandas()
X = df.drop(["customer_id", "churned"], axis=1)
y = df["churned"]
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Start MLflow run with comprehensive tracking
with mlflow.start_run(run_name="rf_baseline_v1") as run:
    # Log parameters
    params = {
        "n_estimators": 100,
        "max_depth": 10,
        "min_samples_split": 5,
        "min_samples_leaf": 2,
        "class_weight": "balanced",
        "random_state": 42
    }
    mlflow.log_params(params)

    # Log data information
    mlflow.log_param("training_samples", len(X_train))
    mlflow.log_param("test_samples", len(X_test))
    mlflow.log_param("feature_count", X_train.shape[1])
    mlflow.log_param("positive_class_ratio", y_train.mean())

    # Train model
    model = RandomForestClassifier(**params)
    model.fit(X_train, y_train)

    # Make predictions
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    # Calculate and log metrics
    metrics = {
        "accuracy": accuracy_score(y_test, y_pred),
        "f1_score": f1_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred),
        "recall": recall_score(y_test, y_pred)
    }
    mlflow.log_metrics(metrics)

    # Log model with signature and input example
    from mlflow.models.signature import infer_signature
    signature = infer_signature(X_train, y_pred)
    input_example = X_train.head(5)

    mlflow.sklearn.log_model(
        model,
        "model",
        signature=signature,
        input_example=input_example,
        registered_model_name="customer-churn-predictor"
    )

    # Log feature importance as artifact
    import matplotlib.pyplot as plt

    feature_importance = pd.DataFrame({
        'feature': X_train.columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)

    fig, ax = plt.subplots(figsize=(10, 8))
    ax.barh(feature_importance['feature'][:20], feature_importance['importance'][:20])
    ax.set_xlabel('Importance')
    ax.set_title('Top 20 Feature Importances')
    plt.tight_layout()
    plt.savefig("/tmp/feature_importance.png")
    mlflow.log_artifact("/tmp/feature_importance.png")

    # Log confusion matrix
    from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay
    cm = confusion_matrix(y_test, y_pred)
    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=['Not Churned', 'Churned'])
    disp.plot()
    plt.savefig("/tmp/confusion_matrix.png")
    mlflow.log_artifact("/tmp/confusion_matrix.png")

    print(f"Run ID: {run.info.run_id}")
    print(f"Metrics: {metrics}")
```

### Model Registry

```python
import mlflow
from mlflow.tracking import MlflowClient

client = MlflowClient()

# Register a model from a run
model_uri = f"runs:/{run_id}/model"
mv = mlflow.register_model(model_uri, "customer-churn-predictor")
print(f"Registered model version: {mv.version}")

# Add model version description and tags
client.update_model_version(
    name="customer-churn-predictor",
    version=mv.version,
    description="""
    Random Forest model for customer churn prediction.
    - Training data: 2024 Q1 customer features
    - Test accuracy: 0.92
    - F1 score: 0.87
    """
)

client.set_model_version_tag(
    name="customer-churn-predictor",
    version=mv.version,
    key="validation_status",
    value="pending"
)

# Transition model to staging
client.transition_model_version_stage(
    name="customer-churn-predictor",
    version=mv.version,
    stage="Staging"
)

# After validation, promote to production
client.transition_model_version_stage(
    name="customer-churn-predictor",
    version=mv.version,
    stage="Production",
    archive_existing_versions=True
)

# Load model for inference
# By version
model_v1 = mlflow.pyfunc.load_model("models:/customer-churn-predictor/1")

# By stage
model_prod = mlflow.pyfunc.load_model("models:/customer-churn-predictor/Production")
model_staging = mlflow.pyfunc.load_model("models:/customer-churn-predictor/Staging")

# Batch inference
predictions = model_prod.predict(new_data_df)
```

### Model Serving

```python
# Enable model serving through Databricks UI or API
# Once enabled, model is accessible via REST endpoint

import requests
import json

# Inference endpoint URL
workspace_url = "https://your-workspace.cloud.databricks.com"
endpoint_name = "customer-churn-predictor"
endpoint_url = f"{workspace_url}/serving-endpoints/{endpoint_name}/invocations"

# Authentication
token = dbutils.notebook.entry_point.getDbutils().notebook().getContext().apiToken().get()
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Prepare request data
data = {
    "dataframe_records": [
        {
            "feature1": 1.0,
            "feature2": 2.0,
            "feature3": "category_a",
            "feature4": 100
        },
        {
            "feature1": 4.0,
            "feature2": 5.0,
            "feature3": "category_b",
            "feature4": 200
        }
    ]
}

# Make prediction request
response = requests.post(endpoint_url, headers=headers, json=data)
predictions = response.json()
print(f"Predictions: {predictions}")

# For real-time serving with Feature Store
from databricks.feature_store import FeatureStoreClient

fs = FeatureStoreClient()

# Create feature lookup for real-time inference
from databricks.feature_store import FeatureLookup

feature_lookups = [
    FeatureLookup(
        table_name="production.features.customer_features",
        feature_names=["total_purchases", "avg_order_value", "days_since_last_order"],
        lookup_key="customer_id"
    )
]

# Score batch with features
predictions = fs.score_batch(
    model_uri="models:/customer-churn-predictor/Production",
    df=customer_ids_df,
    feature_lookups=feature_lookups
)
```

### Databricks AutoML

```python
from databricks import automl

# Prepare data
train_df = spark.table("production.ml.customer_features")

# Run AutoML classification
summary = automl.classify(
    dataset=train_df,
    target_col="churned",
    primary_metric="f1",
    timeout_minutes=60,
    max_trials=50,
    exclude_cols=["customer_id"]  # Exclude non-feature columns
)

# Access results
print(f"Best trial notebook: {summary.best_trial.notebook_path}")
print(f"Best trial metrics: {summary.best_trial.metrics}")
print(f"Best model URI: {summary.best_trial.model_path}")

# Load best model
best_model = mlflow.pyfunc.load_model(summary.best_trial.model_path)

# View data exploration notebook
print(f"Data exploration: {summary.data_exploration_notebook}")

# Run AutoML regression
regression_summary = automl.regress(
    dataset=spark.table("production.ml.sales_features"),
    target_col="revenue",
    primary_metric="rmse",
    timeout_minutes=30
)

# Run AutoML forecasting
forecast_summary = automl.forecast(
    dataset=spark.table("production.ml.time_series_data"),
    target_col="sales",
    time_col="date",
    horizon=30,  # Forecast 30 periods ahead
    frequency="D",  # Daily frequency
    primary_metric="smape"
)
```

## SQL Analytics

### SQL Warehouses

SQL Warehouses provide a serverless or classic compute option optimized for BI and SQL workloads.

```sql
-- SQL Warehouse features:
-- 1. Photon acceleration for 3-8x faster queries
-- 2. Query caching for repeated queries
-- 3. Auto-scaling for variable workloads
-- 4. Query federation to external databases

-- Example analytics query
WITH daily_sales AS (
    SELECT
        DATE_TRUNC('day', transaction_date) as sale_date,
        region,
        product_category,
        SUM(quantity) as total_quantity,
        SUM(revenue) as total_revenue,
        COUNT(DISTINCT customer_id) as unique_customers
    FROM production.sales.transactions
    WHERE transaction_date >= CURRENT_DATE - INTERVAL 90 DAYS
    GROUP BY 1, 2, 3
),
rolling_metrics AS (
    SELECT
        sale_date,
        region,
        product_category,
        total_revenue,
        AVG(total_revenue) OVER (
            PARTITION BY region, product_category
            ORDER BY sale_date
            ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
        ) as revenue_7day_avg,
        SUM(total_revenue) OVER (
            PARTITION BY region, product_category
            ORDER BY sale_date
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) as cumulative_revenue
    FROM daily_sales
)
SELECT * FROM rolling_metrics
ORDER BY sale_date DESC, total_revenue DESC;
```

### SQL Dashboards and Visualizations

```sql
-- Create parameterized dashboard query
-- Parameters use {{parameter_name}} syntax

SELECT
    DATE_TRUNC('{{granularity}}', order_date) as period,
    region,
    SUM(revenue) as total_revenue,
    COUNT(DISTINCT customer_id) as unique_customers,
    SUM(quantity) as total_units,
    SUM(revenue) / NULLIF(SUM(quantity), 0) as avg_unit_price
FROM production.sales.orders
WHERE order_date BETWEEN '{{start_date}}' AND '{{end_date}}'
    AND region IN ({{regions}})
    AND product_category IN ({{categories}})
GROUP BY 1, 2
ORDER BY 1, total_revenue DESC;

-- Query-based dropdown parameter
-- This query populates a dropdown with available regions
SELECT DISTINCT region
FROM production.sales.orders
WHERE order_date >= CURRENT_DATE - INTERVAL 1 YEAR
ORDER BY region;

-- Alert query (triggers notification when condition met)
SELECT
    COUNT(*) as failed_jobs,
    MAX(end_time) as last_failure
FROM production.monitoring.job_runs
WHERE status = 'FAILED'
    AND end_time >= CURRENT_TIMESTAMP - INTERVAL 1 HOUR
HAVING COUNT(*) > 0;
```

### BI Tool Integration

```python
# Python connector for programmatic access
from databricks import sql

# Connect to SQL Warehouse
connection = sql.connect(
    server_hostname="your-workspace.cloud.databricks.com",
    http_path="/sql/1.0/warehouses/your-warehouse-id",
    access_token=dbutils.secrets.get("my-scope", "databricks-token")
)

# Execute query
cursor = connection.cursor()
cursor.execute("""
    SELECT region, SUM(revenue) as total_revenue
    FROM production.sales.transactions
    WHERE transaction_date >= '2024-01-01'
    GROUP BY region
    ORDER BY total_revenue DESC
""")

# Fetch results
results = cursor.fetchall()
for row in results:
    print(f"Region: {row[0]}, Revenue: ${row[1]:,.2f}")

# Close connection
cursor.close()
connection.close()

# JDBC connection string for BI tools (Tableau, Power BI, Looker)
jdbc_url = """
jdbc:databricks://your-workspace.cloud.databricks.com:443/default;
transportMode=http;
ssl=1;
httpPath=/sql/1.0/warehouses/your-warehouse-id;
AuthMech=3;
UID=token;
PWD=your-access-token
"""

# ODBC DSN configuration for Excel, etc.
odbc_config = {
    "Driver": "Simba Spark ODBC Driver",
    "Host": "your-workspace.cloud.databricks.com",
    "Port": "443",
    "HTTPPath": "/sql/1.0/warehouses/your-warehouse-id",
    "ThriftTransport": "2",
    "SSL": "1",
    "AuthMech": "3",
    "UID": "token",
    "PWD": "your-access-token"
}
```

## Delta Live Tables (DLT)

### DLT Pipeline Concepts

Delta Live Tables provides a declarative framework for building reliable, maintainable data pipelines.

```python
import dlt
from pyspark.sql.functions import *

# Bronze layer: Raw data ingestion
@dlt.table(
    name="raw_events",
    comment="Raw event data from source systems",
    table_properties={
        "quality": "bronze",
        "pipelines.autoOptimize.managed": "true"
    }
)
def raw_events():
    return (
        spark.readStream
        .format("cloudFiles")
        .option("cloudFiles.format", "json")
        .option("cloudFiles.inferColumnTypes", "true")
        .option("cloudFiles.schemaLocation", "/mnt/checkpoints/raw_events/schema")
        .option("cloudFiles.schemaEvolutionMode", "addNewColumns")
        .load("/mnt/landing/events/")
    )

# Silver layer: Cleaned and validated data
@dlt.table(
    name="cleaned_events",
    comment="Cleaned and validated event data",
    table_properties={"quality": "silver"}
)
@dlt.expect_or_drop("valid_event_id", "event_id IS NOT NULL")
@dlt.expect_or_drop("valid_timestamp", "event_timestamp IS NOT NULL")
@dlt.expect_or_fail("valid_event_type", "event_type IN ('click', 'view', 'purchase', 'signup')")
@dlt.expect("valid_user", "user_id IS NOT NULL", on_violation="drop")
def cleaned_events():
    return (
        dlt.read_stream("raw_events")
        .withColumn("event_date", to_date("event_timestamp"))
        .withColumn("event_hour", hour("event_timestamp"))
        .withColumn("processed_at", current_timestamp())
        .dropDuplicates(["event_id"])
        .select(
            "event_id",
            "user_id",
            "event_type",
            "event_timestamp",
            "event_date",
            "event_hour",
            "page_url",
            "device_type",
            "processed_at"
        )
    )

# Gold layer: Aggregated business metrics
@dlt.table(
    name="hourly_event_metrics",
    comment="Hourly aggregated event metrics",
    table_properties={"quality": "gold"},
    partition_cols=["event_date"]
)
def hourly_event_metrics():
    return (
        dlt.read("cleaned_events")
        .groupBy("event_date", "event_hour", "event_type")
        .agg(
            count("*").alias("event_count"),
            countDistinct("user_id").alias("unique_users"),
            countDistinct("page_url").alias("unique_pages")
        )
    )

# Streaming aggregation with watermark
@dlt.table(name="realtime_user_activity")
def realtime_user_activity():
    return (
        dlt.read_stream("cleaned_events")
        .withWatermark("event_timestamp", "10 minutes")
        .groupBy(
            window("event_timestamp", "5 minutes"),
            "user_id"
        )
        .agg(
            count("*").alias("event_count"),
            collect_set("event_type").alias("event_types")
        )
    )
```

### Data Quality Expectations

```python
import dlt

# Multiple expectation types
@dlt.table(name="validated_transactions")
@dlt.expect("positive_amount", "amount > 0")  # Warn but keep
@dlt.expect_or_drop("valid_currency", "currency IN ('USD', 'EUR', 'GBP')")  # Drop invalid
@dlt.expect_or_fail("not_null_id", "transaction_id IS NOT NULL")  # Fail pipeline
def validated_transactions():
    return dlt.read("raw_transactions")

# Expectation dictionary for multiple rules
@dlt.table(name="validated_customers")
@dlt.expect_all({
    "valid_email": "email RLIKE '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\\\.[A-Za-z]{2,}$'",
    "valid_age": "age IS NULL OR (age BETWEEN 0 AND 120)",
    "valid_country": "country IS NOT NULL",
    "valid_status": "status IN ('active', 'inactive', 'pending')"
})
def validated_customers():
    return dlt.read("raw_customers")

# Quarantine pattern for invalid records
@dlt.table(name="valid_orders")
@dlt.expect_all_or_drop({
    "valid_total": "total_amount > 0",
    "valid_items": "item_count > 0",
    "valid_customer": "customer_id IS NOT NULL"
})
def valid_orders():
    return dlt.read("raw_orders")

@dlt.table(name="quarantined_orders")
def quarantined_orders():
    return (
        dlt.read("raw_orders")
        .filter(
            (col("total_amount") <= 0) |
            (col("item_count") <= 0) |
            (col("customer_id").isNull())
        )
        .withColumn("quarantine_reason",
            when(col("total_amount") <= 0, "invalid_total")
            .when(col("item_count") <= 0, "invalid_items")
            .when(col("customer_id").isNull(), "missing_customer")
        )
        .withColumn("quarantined_at", current_timestamp())
    )
```

### DLT Pipeline Configuration

```json
{
    "name": "production-data-pipeline",
    "target": "production.analytics",
    "catalog": "production",
    "storage": "s3://databricks-data/dlt/production",
    "configuration": {
        "pipelines.enableTrackHistory": "true",
        "spark.databricks.delta.preview.enabled": "true"
    },
    "clusters": [
        {
            "label": "default",
            "autoscale": {
                "min_workers": 1,
                "max_workers": 10,
                "mode": "ENHANCED"
            },
            "spark_conf": {
                "spark.databricks.delta.optimizeWrite.enabled": "true"
            },
            "custom_tags": {
                "team": "data-engineering",
                "cost_center": "CC-123"
            }
        }
    ],
    "libraries": [
        {"notebook": {"path": "/Repos/team/pipelines/bronze_layer"}},
        {"notebook": {"path": "/Repos/team/pipelines/silver_layer"}},
        {"notebook": {"path": "/Repos/team/pipelines/gold_layer"}}
    ],
    "continuous": false,
    "development": false,
    "photon": true,
    "channel": "CURRENT",
    "edition": "ADVANCED",
    "notifications": [
        {
            "email_recipients": ["data-team@company.com"],
            "alerts": ["on_failure", "on_flow_failure"]
        }
    ]
}
```

## Workflows and Job Orchestration

### Creating Jobs

```python
# Job configuration via API
job_config = {
    "name": "Daily ETL Pipeline",
    "email_notifications": {
        "on_failure": ["alerts@company.com"],
        "on_success": ["reports@company.com"],
        "no_alert_for_skipped_runs": True
    },
    "webhook_notifications": {
        "on_failure": [
            {"id": "webhook-id-123"}
        ]
    },
    "schedule": {
        "quartz_cron_expression": "0 0 6 * * ?",  # Daily at 6 AM UTC
        "timezone_id": "UTC",
        "pause_status": "UNPAUSED"
    },
    "max_concurrent_runs": 1,
    "timeout_seconds": 3600,
    "tasks": [
        {
            "task_key": "ingest_data",
            "description": "Ingest raw data from sources",
            "notebook_task": {
                "notebook_path": "/Repos/team/etl/01_ingest",
                "base_parameters": {
                    "date": "{{job.start_time.iso_date}}",
                    "env": "production"
                },
                "source": "GIT"
            },
            "new_cluster": {
                "spark_version": "14.3.x-scala2.12",
                "node_type_id": "i3.xlarge",
                "num_workers": 2,
                "spark_conf": {
                    "spark.databricks.delta.optimizeWrite.enabled": "true"
                }
            },
            "timeout_seconds": 1800,
            "retry_on_timeout": True,
            "max_retries": 2,
            "min_retry_interval_millis": 60000
        },
        {
            "task_key": "transform_data",
            "depends_on": [{"task_key": "ingest_data"}],
            "notebook_task": {
                "notebook_path": "/Repos/team/etl/02_transform"
            },
            "existing_cluster_id": "cluster-id-123"
        },
        {
            "task_key": "run_dbt",
            "depends_on": [{"task_key": "transform_data"}],
            "dbt_task": {
                "project_directory": "/Repos/team/dbt-project",
                "commands": [
                    "dbt run --select staging.*",
                    "dbt run --select marts.*",
                    "dbt test"
                ],
                "schema": "analytics",
                "warehouse_id": "warehouse-id-123"
            }
        },
        {
            "task_key": "quality_checks",
            "depends_on": [{"task_key": "run_dbt"}],
            "sql_task": {
                "warehouse_id": "warehouse-id-123",
                "query": {
                    "query_id": "query-id-123"
                }
            }
        },
        {
            "task_key": "send_report",
            "depends_on": [{"task_key": "quality_checks"}],
            "condition_task": {
                "op": "EQUAL_TO",
                "left": "{{tasks.quality_checks.values.status}}",
                "right": "PASSED"
            }
        }
    ],
    "git_source": {
        "git_url": "https://github.com/company/databricks-etl.git",
        "git_provider": "gitHub",
        "git_branch": "main"
    },
    "tags": {
        "team": "data-engineering",
        "cost_center": "CC-123"
    }
}
```

### Multi-Task DAG Orchestration

```
Task Dependency Graph:
                        +-------------------+
                        |   ingest_data     |
                        +-------------------+
                                |
                +---------------+---------------+
                |                               |
                v                               v
    +-------------------+           +-------------------+
    | transform_customers|          | transform_orders  |
    +-------------------+           +-------------------+
                |                               |
                +---------------+---------------+
                                |
                                v
                        +-------------------+
                        |   build_features  |
                        +-------------------+
                                |
                +---------------+---------------+
                |               |               |
                v               v               v
    +----------------+  +----------------+  +----------------+
    | train_model    |  | update_reports |  | data_quality   |
    +----------------+  +----------------+  +----------------+
                |                               |
                +---------------+---------------+
                                |
                                v
                        +-------------------+
                        |   notify_status   |
                        +-------------------+
```

### Task Values and Dynamic Configuration

```python
# In upstream task: Set task values
dbutils.jobs.taskValues.set(key="record_count", value=150000)
dbutils.jobs.taskValues.set(key="output_path", value="/mnt/data/output/2024-01-15")
dbutils.jobs.taskValues.set(key="status", value="SUCCESS")
dbutils.jobs.taskValues.set(key="metrics", value={
    "rows_processed": 150000,
    "rows_failed": 25,
    "processing_time_seconds": 342
})

# In downstream task: Get task values
record_count = dbutils.jobs.taskValues.get(
    taskKey="ingest_data",
    key="record_count",
    default=0,
    debugValue=1000  # Used in interactive runs
)
output_path = dbutils.jobs.taskValues.get(taskKey="ingest_data", key="output_path")
metrics = dbutils.jobs.taskValues.get(taskKey="ingest_data", key="metrics")

print(f"Processing {record_count} records from {output_path}")

# Dynamic value references in job configuration
"""
Available dynamic value references:
- {{job.id}} - Job ID
- {{job.name}} - Job name
- {{job.run_id}} - Current run ID
- {{job.start_time.epoch_ms}} - Epoch milliseconds
- {{job.start_time.iso_datetime}} - ISO 8601 datetime
- {{job.start_time.iso_date}} - ISO 8601 date
- {{task.task_key}} - Current task key
- {{tasks.task_key.result_state}} - Result of another task (SUCCESS, FAILED, etc.)
- {{tasks.task_key.values.key}} - Output value from another task
"""

# Example: Conditional task based on upstream output
{
    "task_key": "send_alert",
    "depends_on": [{"task_key": "data_quality"}],
    "condition_task": {
        "op": "GREATER_THAN",
        "left": "{{tasks.data_quality.values.failed_rows}}",
        "right": "100"
    }
}
```

## Cost Optimization

### Cluster Cost Management

```python
# Use job clusters instead of all-purpose clusters for production
# Job clusters are created per run and auto-terminate

# Configure auto-termination for interactive clusters
cluster_config = {
    "autotermination_minutes": 30,  # Terminate after 30 min idle
    "enable_elastic_disk": True,    # Scale disk as needed
}

# Right-size clusters based on workload
# Use Ganglia metrics to monitor CPU/memory utilization
# Target 60-80% utilization

# Use spot instances for fault-tolerant workloads
cluster_config = {
    "aws_attributes": {
        "first_on_demand": 1,  # Driver on on-demand
        "availability": "SPOT_WITH_FALLBACK",
        "spot_bid_price_percent": 100
    }
}

# Instance pools for faster startup
pool_config = {
    "instance_pool_name": "data-engineering-pool",
    "min_idle_instances": 2,
    "max_capacity": 20,
    "idle_instance_autotermination_minutes": 30,
    "node_type_id": "i3.xlarge",
    "preloaded_spark_versions": ["14.3.x-scala2.12"]
}

# Monitor costs with system tables
cost_analysis = spark.sql("""
    SELECT
        date_trunc('day', usage_date) as date,
        workspace_id,
        sku_name,
        usage_metadata.cluster_id,
        usage_metadata.job_id,
        SUM(usage_quantity) as total_dbus,
        SUM(usage_quantity * list_price) as estimated_cost
    FROM system.billing.usage
    WHERE usage_date >= current_date() - INTERVAL 30 DAYS
    GROUP BY 1, 2, 3, 4, 5
    ORDER BY estimated_cost DESC
""")
cost_analysis.display()
```

### Storage Cost Optimization

```python
# Use appropriate file formats
# Parquet/Delta: Best for analytics (columnar, compressed)
# JSON/CSV: Only for interchange, not storage

# Implement data lifecycle policies
spark.sql("""
    ALTER TABLE catalog.schema.events
    SET TBLPROPERTIES (
        'delta.logRetentionDuration' = 'interval 7 days',
        'delta.deletedFileRetentionDuration' = 'interval 1 day'
    )
""")

# Regular vacuum to remove old files
spark.sql("VACUUM catalog.schema.events RETAIN 168 HOURS")

# Use Z-Order to reduce data scanned
spark.sql("""
    OPTIMIZE catalog.schema.events
    ZORDER BY (event_date, user_id)
""")

# Archive old data to cheaper storage tiers
# Move data older than 1 year to S3 Glacier
archive_query = """
    CREATE TABLE catalog.archive.events_2022
    USING DELTA
    LOCATION 's3://archive-bucket/events/2022/'
    AS SELECT * FROM catalog.schema.events
    WHERE event_date < '2023-01-01'
"""

# Use liquid clustering for automatic optimization
spark.sql("""
    ALTER TABLE catalog.schema.events
    CLUSTER BY (event_date, region)
""")
```

### Query Cost Optimization

```sql
-- 1. Use partition pruning
SELECT * FROM catalog.schema.events
WHERE event_date = '2024-01-15'  -- Partition column filter
AND region = 'US';

-- 2. Use column pruning - select only needed columns
SELECT user_id, event_type, event_timestamp
FROM catalog.schema.events
WHERE event_date = '2024-01-15';
-- Not: SELECT * FROM ...

-- 3. Cache frequently accessed data
CACHE TABLE catalog.schema.dimension_product;

-- 4. Use approximate functions for exploration
SELECT APPROX_COUNT_DISTINCT(user_id) as approx_users
FROM catalog.schema.events
WHERE event_date >= '2024-01-01';

-- 5. Use query result caching
-- Results are automatically cached in SQL Warehouses

-- 6. Monitor query performance
SELECT
    query_id,
    query_text,
    total_time_ms,
    rows_produced,
    bytes_scanned
FROM system.query.history
WHERE start_time >= current_date() - INTERVAL 1 DAY
ORDER BY bytes_scanned DESC
LIMIT 20;
```

## Best Practices Summary

### Data Engineering Best Practices

```python
# Use Delta Lake for all tables
df.write.format("delta").mode("append").saveAsTable("catalog.schema.table")

# Enable auto-optimization
spark.sql("""
    ALTER TABLE catalog.schema.table SET TBLPROPERTIES (
        'delta.autoOptimize.optimizeWrite' = 'true',
        'delta.autoOptimize.autoCompact' = 'true'
    )
""")

# Use structured streaming for real-time pipelines
(spark.readStream
    .format("cloudFiles")
    .option("cloudFiles.format", "json")
    .load("/mnt/landing/")
    .writeStream
    .format("delta")
    .option("checkpointLocation", "/mnt/checkpoints/")
    .trigger(availableNow=True)
    .toTable("catalog.schema.events")
)

# Implement medallion architecture
# Bronze -> Silver -> Gold

# Use Unity Catalog for governance
# Always use three-level namespace: catalog.schema.table

# Version control notebooks with Repos
# Use Git for all production code

# Use secrets for credentials - never hardcode
password = dbutils.secrets.get("scope", "key")
```

### Performance Best Practices

```python
# Use Photon runtime for SQL workloads
# Select Photon-enabled runtime when creating clusters

# Partition wisely - avoid over-partitioning
# Good: Partition by date for time-series data
# Bad: Partition by high-cardinality columns

# Use broadcast joins for small tables
from pyspark.sql.functions import broadcast
result = large_df.join(broadcast(small_df), "key")

# Enable Adaptive Query Execution
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")

# Cache intermediate results wisely
expensive_df.cache()
expensive_df.count()  # Trigger caching

# Use Z-Order for frequently filtered columns
spark.sql("OPTIMIZE table ZORDER BY (col1, col2)")

# Monitor with Spark UI and Query Profile
```

### Security Best Practices

```python
# Use Unity Catalog for centralized governance
# Enable Unity Catalog at workspace level

# Implement least privilege access
# GRANT SELECT ON TABLE ... TO ...
# Avoid GRANT ALL PRIVILEGES

# Use row-level and column-level security
# CREATE FUNCTION for dynamic masking

# Audit access with system tables
audit_df = spark.sql("""
    SELECT * FROM system.access.audit
    WHERE event_date >= current_date() - INTERVAL 7 DAYS
    AND action_name = 'commandExecution'
""")

# Use private endpoints for network isolation
# Configure PrivateLink/Private Endpoints in cloud provider

# Encrypt data at rest and in transit
# Use customer-managed keys for sensitive data

# Regular access reviews
permissions_df = spark.sql("""
    SELECT grantee, privilege_type, table_catalog, table_schema, table_name
    FROM system.information_schema.table_privileges
    ORDER BY grantee
""")
```

## Troubleshooting Common Issues

### Cluster Issues

```python
# Issue: Cluster fails to start
# Check: Event log in cluster details
# Common causes:
# - Instance type not available in region
# - VPC/networking misconfiguration
# - Init script failures
# - Library installation failures

# Issue: Out of memory errors
# Solutions:
# Increase executor memory
spark.conf.set("spark.executor.memory", "8g")
# Increase driver memory for collect operations
spark.conf.set("spark.driver.memory", "4g")
# Reduce partition size
spark.conf.set("spark.sql.shuffle.partitions", "400")
# Use disk spilling
spark.conf.set("spark.memory.fraction", "0.6")

# Issue: Slow cluster startup
# Solutions:
# Use instance pools
# Reduce init script operations
# Use smaller cluster initially, then scale
```

### Query Performance Issues

```sql
-- Use EXPLAIN to analyze query plan
EXPLAIN FORMATTED
SELECT * FROM catalog.schema.large_table
WHERE date_col = '2024-01-15';

-- Check for data skew
SELECT
    partition_column,
    COUNT(*) as row_count
FROM catalog.schema.large_table
GROUP BY partition_column
ORDER BY row_count DESC
LIMIT 20;

-- Check table statistics
DESCRIBE EXTENDED catalog.schema.large_table;
DESCRIBE DETAIL catalog.schema.large_table;

-- Analyze table for statistics
ANALYZE TABLE catalog.schema.large_table
COMPUTE STATISTICS FOR ALL COLUMNS;

-- Check small file problem
SELECT
    COUNT(*) as num_files,
    SUM(size) / 1024 / 1024 as total_size_mb,
    AVG(size) / 1024 / 1024 as avg_file_size_mb
FROM (DESCRIBE DETAIL catalog.schema.large_table);

-- Fix small files with OPTIMIZE
OPTIMIZE catalog.schema.large_table;
```

### Delta Lake Issues

```python
# Issue: Concurrent write conflicts
# Use merge or ACID transactions properly
try:
    deltaTable.merge(...).execute()
except Exception as e:
    if "ConcurrentModificationException" in str(e):
        # Retry with backoff
        import time
        time.sleep(5)
        deltaTable.merge(...).execute()

# Issue: Schema evolution errors
# Enable schema evolution
spark.conf.set("spark.databricks.delta.schema.autoMerge.enabled", "true")

# Or explicitly add new columns
df.write.format("delta") \
    .mode("append") \
    .option("mergeSchema", "true") \
    .saveAsTable("catalog.schema.table")

# Issue: Time travel query fails
# Check log retention
spark.sql("DESCRIBE DETAIL catalog.schema.table").select("properties").show()

# Increase retention if needed
spark.sql("""
    ALTER TABLE catalog.schema.table SET TBLPROPERTIES (
        'delta.logRetentionDuration' = 'interval 30 days'
    )
""")

# Issue: Vacuum not removing files
# Check retention settings
spark.sql("SET spark.databricks.delta.retentionDurationCheck.enabled = false")
spark.sql("VACUUM catalog.schema.table RETAIN 0 HOURS")
# Warning: This can break time travel!
```

## Summary

Databricks provides a unified platform that transforms how organizations work with data and AI:

1. **Lakehouse Architecture**: Combines data lake flexibility with data warehouse reliability
2. **Collaborative Notebooks**: Multi-language support with real-time collaboration
3. **Managed Compute**: Auto-scaling clusters with Photon acceleration
4. **Delta Lake**: ACID transactions, time travel, and schema evolution
5. **Unity Catalog**: Unified governance, security, and lineage tracking
6. **MLflow**: End-to-end ML lifecycle management
7. **Delta Live Tables**: Declarative ETL with built-in data quality
8. **SQL Analytics**: Serverless SQL warehouses for BI integration

The platform's strength lies in unifying data engineering, data science, and analytics teams on a single platform, reducing complexity and accelerating time to value for data and AI initiatives. By following the best practices outlined in this guide, organizations can build reliable, performant, and cost-effective data solutions on Databricks.
