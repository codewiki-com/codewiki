---
title: ETL and Data Pipelines Guide
description: Master ETL for efficient data integration
track: data
section: data-engineering
difficulty: advanced
tags:
  - ETL
  - Data Pipeline
  - Airflow
  - dbt
status: imported
origin: old/src/content/docs/data/etl.en.md
divergence: 0.203
issues: []
legacy:
  category: Data
  subcategory: Engineering
  order: 6
  lastUpdated: 2026-01-07
---

In modern data-driven enterprises, data flows from multiple sources and requires cleaning and transformation before it can be used for analysis and decision-making. ETL (Extract, Transform, Load) and data pipelines are the core technologies that enable this capability. We'll take a deep dive into ETL concepts, design principles, and how to build production-grade data pipelines using Apache Airflow and dbt.

## ETL vs ELT Concepts

### What is ETL?

ETL stands for **Extract, Transform, Load** and describes the three core steps of data integration:

```
+-------------+     +-------------+     +-------------+
|   Extract   |---->|  Transform  |---->|    Load     |
| Data Pull   |     | Data Process|     | Data Write  |
+-------------+     +-------------+     +-------------+
      |                   |                   |
      v                   v                   v
  Pull raw data      Clean, aggregate,   Write to target
  from sources       standardize data    warehouse or lake
```

**ETL Stages Explained**:

1. **Extract**: Pull data from various sources including databases, APIs, files, and message queues
2. **Transform**: Clean, validate, aggregate, and standardize data in an intermediate processing layer
3. **Load**: Write the processed data to the target storage system

### What is ELT?

ELT stands for **Extract, Load, Transform** and differs from ETL primarily in when transformation occurs:

```
+-------------+     +-------------+     +-------------+
|   Extract   |---->|    Load     |---->|  Transform  |
| Data Pull   |     | Data Write  |     | Data Process|
+-------------+     +-------------+     +-------------+
      |                   |                   |
      v                   v                   v
  Pull raw data      Load raw data       Transform inside
  from sources       to warehouse        the data warehouse
```

### ETL vs ELT Comparison

| Dimension | ETL | ELT |
|-----------|-----|-----|
| Transform Location | Intermediate layer (ETL tools) | Inside target data warehouse |
| Use Cases | Traditional warehouses, smaller data | Cloud warehouses, big data scenarios |
| Performance Bottleneck | ETL server compute capacity | Data warehouse compute capacity |
| Data Retention | Usually only transformed data | Retains raw data, supports re-transformation |
| Typical Tools | Informatica, Talend, SSIS | dbt, Snowflake, BigQuery |
| Flexibility | Lower, requires predefined logic | Higher, can modify transformation logic anytime |

### Selection Guidelines

```python
# Decision tree pseudocode
def choose_approach(scenario):
    if scenario.cloud_data_warehouse:
        if scenario.need_raw_data_retention:
            return "ELT"
        if scenario.transformation_complexity == "high":
            return "ELT"  # Leverage cloud warehouse compute power

    if scenario.data_volume == "small":
        return "ETL"  # Traditional approach is sufficient

    if scenario.real_time_requirement:
        return "Streaming ETL"  # Consider stream processing

    return "ELT"  # Default choice for modern data stacks
```

---

## Pipeline Design Principles

### Core Design Principles

#### Idempotency

Idempotency ensures that executing the same operation multiple times produces the same result as executing it once. This is critical for failure recovery.

```python
# Non-idempotent operation (incorrect example)
def append_data(df, target_table):
    df.to_sql(target_table, engine, if_exists='append')
    # Repeated execution will create duplicate data

# Idempotent operation (correct example)
def upsert_data(df, target_table, key_columns):
    """Implement idempotent writes using UPSERT"""
    temp_table = f"{target_table}_staging"

    # 1. Write to staging table
    df.to_sql(temp_table, engine, if_exists='replace')

    # 2. Execute UPSERT (PostgreSQL example)
    upsert_sql = f"""
    INSERT INTO {target_table}
    SELECT * FROM {temp_table}
    ON CONFLICT ({', '.join(key_columns)})
    DO UPDATE SET
        {', '.join([f"{col} = EXCLUDED.{col}"
                    for col in df.columns if col not in key_columns])},
        updated_at = NOW()
    """
    engine.execute(upsert_sql)
    engine.execute(f"DROP TABLE {temp_table}")
```

#### Atomicity

Ensure each step of the data pipeline either completely succeeds or completely rolls back on failure.

```python
from contextlib import contextmanager

@contextmanager
def atomic_pipeline(engine):
    """Atomic transaction context manager"""
    connection = engine.connect()
    transaction = connection.begin()
    try:
        yield connection
        transaction.commit()
    except Exception as e:
        transaction.rollback()
        raise e
    finally:
        connection.close()

# Usage example
def run_atomic_etl():
    with atomic_pipeline(engine) as conn:
        # All operations in the same transaction
        conn.execute("DELETE FROM target_table WHERE date = '2024-01-15'")
        conn.execute("INSERT INTO target_table SELECT * FROM staging")
        conn.execute("UPDATE metadata SET last_run = NOW()")
        # If any step fails, all operations will roll back
```

#### Observability

```python
import logging
from datetime import datetime
from dataclasses import dataclass
from typing import Optional

@dataclass
class PipelineMetrics:
    """Pipeline execution metrics"""
    pipeline_name: str
    start_time: datetime
    end_time: Optional[datetime] = None
    records_processed: int = 0
    records_failed: int = 0
    status: str = "running"

    def to_dict(self):
        return {
            "pipeline_name": self.pipeline_name,
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "duration_seconds": (self.end_time - self.start_time).total_seconds()
                               if self.end_time else None,
            "records_processed": self.records_processed,
            "records_failed": self.records_failed,
            "status": self.status
        }

class PipelineLogger:
    """Pipeline logging utility"""

    def __init__(self, pipeline_name: str):
        self.logger = logging.getLogger(pipeline_name)
        self.metrics = PipelineMetrics(
            pipeline_name=pipeline_name,
            start_time=datetime.now()
        )

    def log_extract(self, source: str, record_count: int):
        self.logger.info(f"Extracted {record_count} records from {source}")
        self.metrics.records_processed += record_count

    def log_transform(self, transform_name: str, input_count: int, output_count: int):
        dropped = input_count - output_count
        self.logger.info(
            f"Transform '{transform_name}': {input_count} -> {output_count} "
            f"({dropped} records dropped)"
        )

    def log_error(self, error: Exception, context: dict):
        self.logger.error(f"Pipeline error: {error}", extra=context)
        self.metrics.records_failed += 1

    def finalize(self, status: str):
        self.metrics.end_time = datetime.now()
        self.metrics.status = status
        return self.metrics.to_dict()
```

#### Data Lineage Tracking

```python
class DataLineage:
    """Data lineage tracker"""

    def __init__(self):
        self.lineage_graph = {}

    def register_source(self, source_id: str, metadata: dict):
        """Register a data source"""
        self.lineage_graph[source_id] = {
            "type": "source",
            "metadata": metadata,
            "downstream": []
        }

    def register_transformation(self, transform_id: str,
                                inputs: list, output: str,
                                logic_description: str):
        """Register a transformation operation"""
        self.lineage_graph[transform_id] = {
            "type": "transformation",
            "inputs": inputs,
            "output": output,
            "logic": logic_description,
            "downstream": []
        }
        # Update upstream nodes with downstream references
        for input_id in inputs:
            if input_id in self.lineage_graph:
                self.lineage_graph[input_id]["downstream"].append(transform_id)

    def get_upstream(self, node_id: str) -> list:
        """Get upstream dependencies"""
        node = self.lineage_graph.get(node_id, {})
        if node.get("type") == "transformation":
            return node.get("inputs", [])
        return []

    def get_downstream(self, node_id: str) -> list:
        """Get downstream impact"""
        node = self.lineage_graph.get(node_id, {})
        return node.get("downstream", [])
```

---

## Apache Airflow Deep Dive

Apache Airflow is currently the most popular workflow orchestration tool. It uses Python code to define data pipelines (DAGs).

### Core Concepts

```
+-----------------------------------------------------------+
|                    Airflow Architecture                    |
+-----------------------------------------------------------+
|                                                           |
|  +----------+  +----------+  +----------+                 |
|  |   DAG    |  |   DAG    |  |   DAG    |   DAGs         |
|  | (Python) |  | (Python) |  | (Python) |                 |
|  +----+-----+  +----+-----+  +----+-----+                 |
|       |             |             |                       |
|       v             v             v                       |
|  +-------------------------------------+                  |
|  |           Scheduler                 |  Scheduler      |
|  |    Parse DAGs, create task          |                  |
|  |    instances                        |                  |
|  +---------------+-----------------+---+                  |
|                  |                                        |
|                  v                                        |
|  +-------------------------------------+                  |
|  |           Executor                  |  Executor       |
|  |   Local/Celery/Kubernetes          |                  |
|  +---------------+-----------------+---+                  |
|                  |                                        |
|       +----------+----------+                             |
|       v          v          v                             |
|  +---------+ +---------+ +---------+                     |
|  | Worker  | | Worker  | | Worker  |   Workers           |
|  +---------+ +---------+ +---------+                     |
|                                                           |
+-----------------------------------------------------------+
```

### Basic DAG Example

```python
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from airflow.providers.postgres.operators.postgres import PostgresOperator
from airflow.utils.dates import days_ago

# DAG default arguments
default_args = {
    'owner': 'data_team',
    'depends_on_past': False,
    'email': ['data-alerts@company.com'],
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
    'retry_exponential_backoff': True,
    'max_retry_delay': timedelta(minutes=30),
}

# Define the DAG
dag = DAG(
    dag_id='sales_etl_pipeline',
    default_args=default_args,
    description='Daily sales data ETL pipeline',
    schedule_interval='0 2 * * *',  # Run daily at 2 AM
    start_date=days_ago(1),
    catchup=False,  # Don't backfill historical data
    max_active_runs=1,  # Only run one instance at a time
    tags=['sales', 'etl', 'daily'],
)

# Extract task
def extract_sales_data(**context):
    """Extract sales data from source system"""
    import pandas as pd
    from sqlalchemy import create_engine

    execution_date = context['ds']  # YYYY-MM-DD format

    source_engine = create_engine('postgresql://source_db')

    query = f"""
    SELECT
        order_id, customer_id, product_id,
        quantity, unit_price, order_date,
        created_at
    FROM orders
    WHERE DATE(order_date) = '{execution_date}'
    """

    df = pd.read_sql(query, source_engine)

    # Save to intermediate storage
    output_path = f'/tmp/sales_raw_{execution_date}.parquet'
    df.to_parquet(output_path)

    # Pass data path and record count via XCom
    context['ti'].xcom_push(key='raw_data_path', value=output_path)
    context['ti'].xcom_push(key='record_count', value=len(df))

    return f"Extracted {len(df)} records"

extract_task = PythonOperator(
    task_id='extract_sales_data',
    python_callable=extract_sales_data,
    dag=dag,
)

# Transform task
def transform_sales_data(**context):
    """Transform sales data"""
    import pandas as pd

    # Get upstream data path from XCom
    ti = context['ti']
    raw_data_path = ti.xcom_pull(task_ids='extract_sales_data', key='raw_data_path')

    df = pd.read_parquet(raw_data_path)

    # Data transformation
    df['total_amount'] = df['quantity'] * df['unit_price']
    df['order_date'] = pd.to_datetime(df['order_date'])
    df['order_month'] = df['order_date'].dt.to_period('M')

    # Data cleaning
    df = df.dropna(subset=['customer_id', 'product_id'])
    df = df[df['quantity'] > 0]

    # Save transformed data
    execution_date = context['ds']
    output_path = f'/tmp/sales_transformed_{execution_date}.parquet'
    df.to_parquet(output_path)

    ti.xcom_push(key='transformed_data_path', value=output_path)

    return f"Transformed {len(df)} records"

transform_task = PythonOperator(
    task_id='transform_sales_data',
    python_callable=transform_sales_data,
    dag=dag,
)

# Load task
def load_sales_data(**context):
    """Load data to data warehouse"""
    import pandas as pd
    from sqlalchemy import create_engine

    ti = context['ti']
    transformed_path = ti.xcom_pull(
        task_ids='transform_sales_data',
        key='transformed_data_path'
    )

    df = pd.read_parquet(transformed_path)

    target_engine = create_engine('postgresql://warehouse_db')

    # Use idempotent write
    execution_date = context['ds']

    with target_engine.begin() as conn:
        # Delete current day's data first
        conn.execute(f"""
            DELETE FROM fact_sales
            WHERE DATE(order_date) = '{execution_date}'
        """)
        # Then insert new data
        df.to_sql('fact_sales', conn, if_exists='append', index=False)

    return f"Loaded {len(df)} records"

load_task = PythonOperator(
    task_id='load_sales_data',
    python_callable=load_sales_data,
    dag=dag,
)

# Data quality check
quality_check_sql = """
WITH daily_stats AS (
    SELECT
        COUNT(*) as record_count,
        SUM(total_amount) as total_revenue,
        COUNT(DISTINCT customer_id) as unique_customers
    FROM fact_sales
    WHERE DATE(order_date) = '{{ ds }}'
)
SELECT
    CASE
        WHEN record_count = 0 THEN 'FAIL: No records loaded'
        WHEN total_revenue < 0 THEN 'FAIL: Negative revenue detected'
        ELSE 'PASS'
    END as check_result
FROM daily_stats;
"""

quality_check_task = PostgresOperator(
    task_id='data_quality_check',
    postgres_conn_id='warehouse_db',
    sql=quality_check_sql,
    dag=dag,
)

# Cleanup temporary files
cleanup_task = BashOperator(
    task_id='cleanup_temp_files',
    bash_command='rm -f /tmp/sales_*.parquet',
    dag=dag,
)

# Define task dependencies
extract_task >> transform_task >> load_task >> quality_check_task >> cleanup_task
```

### Advanced Airflow Patterns

#### TaskGroup for Organizing Complex Pipelines

```python
from airflow.utils.task_group import TaskGroup

with DAG('complex_etl_pipeline', ...) as dag:

    start = DummyOperator(task_id='start')

    # Use TaskGroup to organize related tasks
    with TaskGroup('extract_sources') as extract_group:
        extract_mysql = PythonOperator(
            task_id='extract_mysql',
            python_callable=extract_from_mysql
        )
        extract_api = PythonOperator(
            task_id='extract_api',
            python_callable=extract_from_api
        )
        extract_s3 = PythonOperator(
            task_id='extract_s3',
            python_callable=extract_from_s3
        )

    with TaskGroup('transform') as transform_group:
        clean_data = PythonOperator(
            task_id='clean_data',
            python_callable=clean_data_func
        )
        aggregate_data = PythonOperator(
            task_id='aggregate_data',
            python_callable=aggregate_data_func
        )
        clean_data >> aggregate_data

    with TaskGroup('load_targets') as load_group:
        load_warehouse = PythonOperator(
            task_id='load_warehouse',
            python_callable=load_to_warehouse
        )
        load_elasticsearch = PythonOperator(
            task_id='load_elasticsearch',
            python_callable=load_to_es
        )

    end = DummyOperator(task_id='end')

    start >> extract_group >> transform_group >> load_group >> end
```

#### Dynamic Task Generation

```python
from airflow.decorators import dag, task

@dag(
    schedule_interval='@daily',
    start_date=days_ago(1),
    catchup=False
)
def dynamic_etl_pipeline():
    """Dynamically generate ETL tasks"""

    @task
    def get_source_tables():
        """Get list of tables to sync"""
        return ['users', 'orders', 'products', 'inventory']

    @task
    def extract_table(table_name: str):
        """Extract a single table"""
        import pandas as pd
        from sqlalchemy import create_engine

        engine = create_engine('postgresql://source_db')
        df = pd.read_sql(f"SELECT * FROM {table_name}", engine)

        output_path = f'/tmp/{table_name}.parquet'
        df.to_parquet(output_path)
        return output_path

    @task
    def load_table(table_name: str, file_path: str):
        """Load a single table"""
        import pandas as pd
        from sqlalchemy import create_engine

        df = pd.read_parquet(file_path)
        engine = create_engine('postgresql://warehouse_db')
        df.to_sql(f'stg_{table_name}', engine, if_exists='replace')
        return f"Loaded {len(df)} records to stg_{table_name}"

    @task
    def summarize(results: list):
        """Summarize results"""
        return f"Completed {len(results)} tables"

    # Dynamic task orchestration
    tables = get_source_tables()

    load_results = []
    for table in tables:
        extracted_path = extract_table(table)
        load_result = load_table(table, extracted_path)
        load_results.append(load_result)

    summarize(load_results)

# Instantiate the DAG
dag = dynamic_etl_pipeline()
```

#### Sensors for Waiting on External Conditions

```python
from airflow.sensors.filesystem import FileSensor
from airflow.sensors.external_task import ExternalTaskSensor
from airflow.sensors.sql import SqlSensor

# Wait for file to appear
wait_for_file = FileSensor(
    task_id='wait_for_source_file',
    filepath='/data/incoming/sales_{{ ds }}.csv',
    poke_interval=300,  # Check every 5 minutes
    timeout=3600,  # Wait up to 1 hour
    mode='poke',  # Or 'reschedule' to save resources
    dag=dag,
)

# Wait for upstream DAG to complete
wait_for_upstream = ExternalTaskSensor(
    task_id='wait_for_upstream_dag',
    external_dag_id='upstream_etl',
    external_task_id='final_task',
    execution_delta=timedelta(hours=1),
    dag=dag,
)

# Wait for database condition
wait_for_data = SqlSensor(
    task_id='wait_for_source_data',
    conn_id='source_db',
    sql="""
        SELECT COUNT(*)
        FROM orders
        WHERE DATE(created_at) = '{{ ds }}'
        HAVING COUNT(*) > 0
    """,
    dag=dag,
)
```

---

## dbt Data Transformation

dbt (data build tool) is a transformation tool used in modern ELT workflows that enables data analysts to perform data modeling using SQL.

### dbt Project Structure

```
my_dbt_project/
|-- dbt_project.yml          # Project configuration
|-- profiles.yml             # Connection config (usually in ~/.dbt/)
|-- models/                  # SQL models
|   |-- staging/            # Data cleaning layer
|   |   |-- stg_orders.sql
|   |   |-- stg_customers.sql
|   |   +-- _staging.yml    # Model docs and tests
|   |-- intermediate/       # Intermediate transformation layer
|   |   +-- int_order_items.sql
|   +-- marts/              # Business data marts
|       |-- finance/
|       |   +-- fct_revenue.sql
|       +-- marketing/
|           +-- dim_customers.sql
|-- tests/                  # Custom tests
|-- macros/                 # Reusable SQL macros
|-- seeds/                  # Static data files
+-- snapshots/              # SCD Type 2 snapshots
```

### dbt Model Examples

#### Staging Layer - Data Cleaning

```sql
-- models/staging/stg_orders.sql

{{ config(
    materialized='view',
    schema='staging'
) }}

WITH source AS (
    SELECT * FROM {{ source('raw', 'orders') }}
),

renamed AS (
    SELECT
        -- Primary key
        id AS order_id,

        -- Foreign keys
        customer_id,
        product_id,

        -- Numeric fields
        quantity,
        CAST(unit_price AS DECIMAL(10, 2)) AS unit_price,

        -- Date fields
        CAST(order_date AS DATE) AS order_date,
        CAST(created_at AS TIMESTAMP) AS created_at,

        -- Status fields
        LOWER(TRIM(status)) AS order_status,

        -- Metadata
        CURRENT_TIMESTAMP AS _loaded_at
    FROM source
    WHERE id IS NOT NULL
      AND quantity > 0
)

SELECT * FROM renamed
```

#### Intermediate Layer - Business Logic

```sql
-- models/intermediate/int_order_metrics.sql

{{ config(
    materialized='table',
    schema='intermediate'
) }}

WITH orders AS (
    SELECT * FROM {{ ref('stg_orders') }}
),

customers AS (
    SELECT * FROM {{ ref('stg_customers') }}
),

order_metrics AS (
    SELECT
        o.order_id,
        o.customer_id,
        o.order_date,
        o.quantity,
        o.unit_price,
        o.quantity * o.unit_price AS order_amount,

        -- Customer dimensions
        c.customer_segment,
        c.region,

        -- Time dimensions
        DATE_TRUNC('month', o.order_date) AS order_month,
        DATE_TRUNC('quarter', o.order_date) AS order_quarter,
        EXTRACT(DOW FROM o.order_date) AS day_of_week,

        -- Weekend order flag
        CASE
            WHEN EXTRACT(DOW FROM o.order_date) IN (0, 6) THEN TRUE
            ELSE FALSE
        END AS is_weekend_order

    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.customer_id
)

SELECT * FROM order_metrics
```

#### Mart Layer - Business Metrics

```sql
-- models/marts/finance/fct_daily_revenue.sql

{{ config(
    materialized='incremental',
    unique_key='date_day',
    schema='finance'
) }}

WITH order_metrics AS (
    SELECT * FROM {{ ref('int_order_metrics') }}
    {% if is_incremental() %}
    WHERE order_date >= (SELECT MAX(date_day) - INTERVAL '3 days' FROM {{ this }})
    {% endif %}
),

daily_revenue AS (
    SELECT
        order_date AS date_day,

        -- Revenue metrics
        COUNT(DISTINCT order_id) AS total_orders,
        SUM(order_amount) AS gross_revenue,
        AVG(order_amount) AS avg_order_value,

        -- Customer metrics
        COUNT(DISTINCT customer_id) AS unique_customers,

        -- Segment metrics
        SUM(CASE WHEN customer_segment = 'premium' THEN order_amount ELSE 0 END) AS premium_revenue,
        SUM(CASE WHEN customer_segment = 'standard' THEN order_amount ELSE 0 END) AS standard_revenue,

        -- Regional metrics
        SUM(CASE WHEN region = 'north' THEN order_amount ELSE 0 END) AS north_revenue,
        SUM(CASE WHEN region = 'south' THEN order_amount ELSE 0 END) AS south_revenue,
        SUM(CASE WHEN region = 'east' THEN order_amount ELSE 0 END) AS east_revenue,
        SUM(CASE WHEN region = 'west' THEN order_amount ELSE 0 END) AS west_revenue

    FROM order_metrics
    GROUP BY order_date
)

SELECT
    *,
    -- Calculate percentage
    ROUND(premium_revenue / NULLIF(gross_revenue, 0) * 100, 2) AS premium_revenue_pct,

    -- Add timestamp
    CURRENT_TIMESTAMP AS _updated_at

FROM daily_revenue
```

### dbt Macros and Tests

#### Custom Macros

```sql
-- macros/generate_surrogate_key.sql
{% macro generate_surrogate_key(field_list) %}
    {{ dbt_utils.generate_surrogate_key(field_list) }}
{% endmacro %}

-- macros/cents_to_dollars.sql
{% macro cents_to_dollars(column_name) %}
    ROUND({{ column_name }} / 100.0, 2)
{% endmacro %}

-- macros/date_spine.sql
{% macro date_spine(start_date, end_date) %}
    SELECT
        date_day
    FROM (
        SELECT
            DATE('{{ start_date }}') + INTERVAL '1 day' * generate_series(
                0,
                DATE('{{ end_date }}') - DATE('{{ start_date }}')
            ) AS date_day
    ) dates
{% endmacro %}
```

#### Model Test Configuration

```yaml
# models/staging/_staging.yml
version: 2

sources:
  - name: raw
    database: raw_database
    schema: public
    tables:
      - name: orders
        columns:
          - name: id
            tests:
              - unique
              - not_null
          - name: customer_id
            tests:
              - not_null
              - relationships:
                  to: ref('stg_customers')
                  field: customer_id

models:
  - name: stg_orders
    description: "Cleaned order data"
    columns:
      - name: order_id
        description: "Unique order identifier"
        tests:
          - unique
          - not_null
      - name: order_amount
        tests:
          - not_null
          - dbt_utils.expression_is_true:
              expression: ">= 0"
      - name: order_status
        tests:
          - accepted_values:
              values: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
```

---

## Data Quality Validation

Data quality is the foundation of ETL pipeline reliability. To build a comprehensive data quality validation framework:

### Great Expectations Integration

```python
import great_expectations as gx
from great_expectations.core.batch import RuntimeBatchRequest

# Initialize Great Expectations context
context = gx.get_context()

# Define data quality expectation suite
def create_order_expectations():
    """Create expectation suite for order data"""

    suite = context.add_or_update_expectation_suite(
        expectation_suite_name="orders_quality_suite"
    )

    # Completeness checks
    suite.add_expectation(
        gx.expectations.ExpectColumnValuesToNotBeNull(
            column="order_id"
        )
    )

    suite.add_expectation(
        gx.expectations.ExpectColumnValuesToNotBeNull(
            column="customer_id"
        )
    )

    # Uniqueness checks
    suite.add_expectation(
        gx.expectations.ExpectColumnValuesToBeUnique(
            column="order_id"
        )
    )

    # Range checks
    suite.add_expectation(
        gx.expectations.ExpectColumnValuesToBeBetween(
            column="quantity",
            min_value=1,
            max_value=1000
        )
    )

    suite.add_expectation(
        gx.expectations.ExpectColumnValuesToBeBetween(
            column="unit_price",
            min_value=0,
            max_value=100000
        )
    )

    # Format checks
    suite.add_expectation(
        gx.expectations.ExpectColumnValuesToMatchRegex(
            column="order_id",
            regex=r"^ORD-\d{8}$"
        )
    )

    # Referential integrity
    suite.add_expectation(
        gx.expectations.ExpectColumnValuesToBeInSet(
            column="order_status",
            value_set=["pending", "confirmed", "shipped", "delivered", "cancelled"]
        )
    )

    # Statistical distribution checks
    suite.add_expectation(
        gx.expectations.ExpectColumnMeanToBeBetween(
            column="unit_price",
            min_value=50,
            max_value=500
        )
    )

    return suite

# Use in ETL pipeline
def validate_data(df, suite_name):
    """Validate data quality"""

    batch_request = RuntimeBatchRequest(
        datasource_name="pandas_datasource",
        data_connector_name="runtime_data_connector",
        data_asset_name="order_data",
        runtime_parameters={"batch_data": df},
        batch_identifiers={"default_identifier_name": "default_identifier"},
    )

    checkpoint = context.add_or_update_checkpoint(
        name="order_checkpoint",
        validations=[
            {
                "batch_request": batch_request,
                "expectation_suite_name": suite_name,
            }
        ],
    )

    result = checkpoint.run()

    if not result.success:
        failed_expectations = []
        for validation_result in result.run_results.values():
            for exp_result in validation_result["validation_result"]["results"]:
                if not exp_result["success"]:
                    failed_expectations.append(exp_result["expectation_config"])

        raise DataQualityError(
            f"Data quality check failed: {len(failed_expectations)} expectations failed"
        )

    return result
```

### Custom Data Quality Framework

```python
from dataclasses import dataclass
from typing import Callable, List, Dict, Any
from enum import Enum
import pandas as pd

class CheckSeverity(Enum):
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

@dataclass
class QualityCheckResult:
    check_name: str
    passed: bool
    severity: CheckSeverity
    message: str
    details: Dict[str, Any]

class DataQualityChecker:
    """Data quality checking framework"""

    def __init__(self):
        self.checks: List[Callable] = []
        self.results: List[QualityCheckResult] = []

    def add_check(self, check_func: Callable, severity: CheckSeverity = CheckSeverity.ERROR):
        """Add a quality check"""
        self.checks.append((check_func, severity))

    def run_checks(self, df: pd.DataFrame) -> List[QualityCheckResult]:
        """Run all checks"""
        self.results = []

        for check_func, severity in self.checks:
            try:
                result = check_func(df)
                result.severity = severity
                self.results.append(result)
            except Exception as e:
                self.results.append(QualityCheckResult(
                    check_name=check_func.__name__,
                    passed=False,
                    severity=severity,
                    message=f"Check failed with error: {str(e)}",
                    details={"error": str(e)}
                ))

        return self.results

    def has_critical_failures(self) -> bool:
        """Check if there are critical failures"""
        return any(
            not r.passed and r.severity == CheckSeverity.CRITICAL
            for r in self.results
        )

    def get_summary(self) -> Dict:
        """Get check summary"""
        return {
            "total_checks": len(self.results),
            "passed": sum(1 for r in self.results if r.passed),
            "failed": sum(1 for r in self.results if not r.passed),
            "critical_failures": sum(
                1 for r in self.results
                if not r.passed and r.severity == CheckSeverity.CRITICAL
            )
        }

# Predefined check functions
def check_no_nulls(column: str):
    """Check column has no null values"""
    def _check(df: pd.DataFrame) -> QualityCheckResult:
        null_count = df[column].isnull().sum()
        null_pct = null_count / len(df) * 100

        return QualityCheckResult(
            check_name=f"no_nulls_{column}",
            passed=null_count == 0,
            severity=CheckSeverity.ERROR,
            message=f"Column '{column}' has {null_count} null values ({null_pct:.2f}%)",
            details={"null_count": null_count, "null_percentage": null_pct}
        )
    return _check

def check_unique(column: str):
    """Check column values are unique"""
    def _check(df: pd.DataFrame) -> QualityCheckResult:
        duplicate_count = df[column].duplicated().sum()

        return QualityCheckResult(
            check_name=f"unique_{column}",
            passed=duplicate_count == 0,
            severity=CheckSeverity.ERROR,
            message=f"Column '{column}' has {duplicate_count} duplicate values",
            details={"duplicate_count": duplicate_count}
        )
    return _check

def check_value_range(column: str, min_val: float, max_val: float):
    """Check numeric value range"""
    def _check(df: pd.DataFrame) -> QualityCheckResult:
        out_of_range = df[(df[column] < min_val) | (df[column] > max_val)]

        return QualityCheckResult(
            check_name=f"range_{column}",
            passed=len(out_of_range) == 0,
            severity=CheckSeverity.ERROR,
            message=f"Column '{column}' has {len(out_of_range)} values outside [{min_val}, {max_val}]",
            details={
                "out_of_range_count": len(out_of_range),
                "min_found": df[column].min(),
                "max_found": df[column].max()
            }
        )
    return _check

def check_freshness(date_column: str, max_age_hours: int = 24):
    """Check data freshness"""
    def _check(df: pd.DataFrame) -> QualityCheckResult:
        from datetime import datetime, timedelta

        max_date = pd.to_datetime(df[date_column]).max()
        age_hours = (datetime.now() - max_date).total_seconds() / 3600

        return QualityCheckResult(
            check_name=f"freshness_{date_column}",
            passed=age_hours <= max_age_hours,
            severity=CheckSeverity.WARNING,
            message=f"Latest data is {age_hours:.1f} hours old (threshold: {max_age_hours}h)",
            details={
                "max_date": max_date.isoformat(),
                "age_hours": age_hours
            }
        )
    return _check

# Usage example
checker = DataQualityChecker()
checker.add_check(check_no_nulls("order_id"), CheckSeverity.CRITICAL)
checker.add_check(check_unique("order_id"), CheckSeverity.CRITICAL)
checker.add_check(check_value_range("quantity", 1, 1000), CheckSeverity.ERROR)
checker.add_check(check_freshness("created_at", 24), CheckSeverity.WARNING)

results = checker.run_checks(df)
```

---

## Incremental Loading Strategies

Incremental loading is a key strategy for improving efficiency when processing large-scale data.

### Common Incremental Patterns

```python
from enum import Enum
from datetime import datetime, timedelta
import pandas as pd
from sqlalchemy import create_engine, text

class IncrementalStrategy(Enum):
    TIMESTAMP = "timestamp"      # Timestamp-based
    SEQUENCE = "sequence"        # Auto-increment sequence
    CDC = "cdc"                  # Change Data Capture
    HASH = "hash"                # Hash comparison

class IncrementalLoader:
    """Incremental data loader"""

    def __init__(self, source_engine, target_engine):
        self.source = source_engine
        self.target = target_engine

    def load_by_timestamp(
        self,
        source_table: str,
        target_table: str,
        timestamp_column: str,
        lookback_hours: int = 24
    ):
        """Timestamp-based incremental loading"""

        # Get latest timestamp from target table
        with self.target.connect() as conn:
            result = conn.execute(text(f"""
                SELECT COALESCE(MAX({timestamp_column}), '1970-01-01') as max_ts
                FROM {target_table}
            """))
            max_ts = result.scalar()

        # Add safety lookback window (handle late-arriving data)
        safe_ts = max_ts - timedelta(hours=lookback_hours)

        # Extract incremental data from source
        query = f"""
            SELECT * FROM {source_table}
            WHERE {timestamp_column} > '{safe_ts}'
        """
        df = pd.read_sql(query, self.source)

        if len(df) == 0:
            return {"status": "no_new_data", "records": 0}

        # Use UPSERT to write to target table
        self._upsert_data(df, target_table, timestamp_column)

        return {"status": "success", "records": len(df)}

    def load_by_sequence(
        self,
        source_table: str,
        target_table: str,
        sequence_column: str = "id"
    ):
        """Sequence-based incremental loading"""

        # Get maximum sequence number from target table
        with self.target.connect() as conn:
            result = conn.execute(text(f"""
                SELECT COALESCE(MAX({sequence_column}), 0) as max_id
                FROM {target_table}
            """))
            max_id = result.scalar()

        # Extract new data
        query = f"""
            SELECT * FROM {source_table}
            WHERE {sequence_column} > {max_id}
            ORDER BY {sequence_column}
        """
        df = pd.read_sql(query, self.source)

        if len(df) == 0:
            return {"status": "no_new_data", "records": 0}

        # Append (sequence guarantees uniqueness, no UPSERT needed)
        df.to_sql(target_table, self.target, if_exists='append', index=False)

        return {"status": "success", "records": len(df)}

    def load_with_hash_comparison(
        self,
        source_table: str,
        target_table: str,
        key_columns: list,
        compare_columns: list
    ):
        """Hash comparison incremental loading (detect updates)"""
        import hashlib

        def compute_hash(row):
            values = '|'.join(str(row[col]) for col in compare_columns)
            return hashlib.md5(values.encode()).hexdigest()

        # Get source data
        source_df = pd.read_sql(f"SELECT * FROM {source_table}", self.source)
        source_df['_row_hash'] = source_df.apply(compute_hash, axis=1)

        # Get target data hashes
        target_query = f"""
            SELECT {', '.join(key_columns)}, _row_hash
            FROM {target_table}
        """
        try:
            target_hashes = pd.read_sql(target_query, self.target)
        except:
            target_hashes = pd.DataFrame(columns=key_columns + ['_row_hash'])

        # Merge and compare
        merged = source_df.merge(
            target_hashes,
            on=key_columns,
            how='left',
            suffixes=('_source', '_target')
        )

        # Identify new and updated records
        new_records = merged[merged['_row_hash_target'].isna()]
        updated_records = merged[
            (merged['_row_hash_target'].notna()) &
            (merged['_row_hash_source'] != merged['_row_hash_target'])
        ]

        # Process new records
        if len(new_records) > 0:
            insert_df = source_df[
                source_df[key_columns[0]].isin(new_records[key_columns[0]])
            ]
            insert_df.to_sql(target_table, self.target, if_exists='append', index=False)

        # Process updates
        if len(updated_records) > 0:
            update_df = source_df[
                source_df[key_columns[0]].isin(updated_records[key_columns[0]])
            ]
            self._upsert_data(update_df, target_table, key_columns[0])

        return {
            "status": "success",
            "new_records": len(new_records),
            "updated_records": len(updated_records)
        }

    def _upsert_data(self, df, table_name, key_column):
        """Execute UPSERT operation"""
        temp_table = f"{table_name}_staging"

        # Write to staging table
        df.to_sql(temp_table, self.target, if_exists='replace', index=False)

        # Execute UPSERT
        columns = df.columns.tolist()
        update_cols = [c for c in columns if c != key_column]

        upsert_sql = f"""
            INSERT INTO {table_name} ({', '.join(columns)})
            SELECT {', '.join(columns)} FROM {temp_table}
            ON CONFLICT ({key_column})
            DO UPDATE SET
                {', '.join([f"{c} = EXCLUDED.{c}" for c in update_cols])},
                _updated_at = NOW()
        """

        with self.target.begin() as conn:
            conn.execute(text(upsert_sql))
            conn.execute(text(f"DROP TABLE {temp_table}"))
```

### SCD Type 2 Implementation

```sql
-- dbt snapshot for SCD Type 2
-- snapshots/customer_snapshot.sql

{% snapshot customer_snapshot %}

{{
    config(
      target_database='warehouse',
      target_schema='snapshots',
      unique_key='customer_id',
      strategy='timestamp',
      updated_at='updated_at',
      invalidate_hard_deletes=True
    )
}}

SELECT
    customer_id,
    customer_name,
    email,
    customer_segment,
    region,
    updated_at
FROM {{ source('raw', 'customers') }}

{% endsnapshot %}
```

```python
# Python implementation of SCD Type 2
class SCDType2Handler:
    """SCD Type 2 handler"""

    def __init__(self, engine):
        self.engine = engine

    def apply_changes(
        self,
        source_df: pd.DataFrame,
        target_table: str,
        key_column: str,
        tracked_columns: list
    ):
        """Apply changes and maintain historical versions"""

        current_time = datetime.now()

        # Get current active records
        current_query = f"""
            SELECT * FROM {target_table}
            WHERE is_current = TRUE
        """
        current_df = pd.read_sql(current_query, self.engine)

        # Prepare source data
        source_df = source_df.copy()
        source_df['_source_hash'] = source_df[tracked_columns].apply(
            lambda row: hash(tuple(row)), axis=1
        )

        # Prepare current data
        if len(current_df) > 0:
            current_df['_current_hash'] = current_df[tracked_columns].apply(
                lambda row: hash(tuple(row)), axis=1
            )
        else:
            current_df['_current_hash'] = None

        # Merge to identify changes
        merged = source_df.merge(
            current_df[[key_column, '_current_hash', 'surrogate_key']],
            on=key_column,
            how='left'
        )

        # New records
        new_records = merged[merged['_current_hash'].isna()].copy()

        # Updated records (different hash)
        changed_records = merged[
            (merged['_current_hash'].notna()) &
            (merged['_source_hash'] != merged['_current_hash'])
        ].copy()

        with self.engine.begin() as conn:
            # Close old version records
            if len(changed_records) > 0:
                old_keys = changed_records['surrogate_key'].tolist()
                conn.execute(text(f"""
                    UPDATE {target_table}
                    SET
                        is_current = FALSE,
                        valid_to = '{current_time}'
                    WHERE surrogate_key IN ({','.join(map(str, old_keys))})
                """))

            # Insert new versions
            records_to_insert = pd.concat([
                new_records[source_df.columns],
                changed_records[source_df.columns]
            ])

            if len(records_to_insert) > 0:
                records_to_insert['valid_from'] = current_time
                records_to_insert['valid_to'] = datetime(9999, 12, 31)
                records_to_insert['is_current'] = True
                records_to_insert['surrogate_key'] = range(
                    self._get_next_surrogate_key(target_table),
                    self._get_next_surrogate_key(target_table) + len(records_to_insert)
                )

                records_to_insert.to_sql(
                    target_table, conn, if_exists='append', index=False
                )

        return {
            "new_records": len(new_records),
            "updated_records": len(changed_records)
        }

    def _get_next_surrogate_key(self, table_name):
        """Get next surrogate key value"""
        with self.engine.connect() as conn:
            result = conn.execute(text(f"""
                SELECT COALESCE(MAX(surrogate_key), 0) + 1
                FROM {table_name}
            """))
            return result.scalar()
```

---

## Scheduling and Monitoring

### Airflow Monitoring Configuration

```python
from airflow.models import Variable
from airflow.providers.slack.operators.slack import SlackAPIPostOperator
from airflow.providers.http.operators.http import SimpleHttpOperator

# Failure callback function
def task_failure_callback(context):
    """Callback when task fails"""
    task_instance = context['task_instance']
    dag_id = context['dag'].dag_id
    task_id = task_instance.task_id
    execution_date = context['execution_date']
    exception = context.get('exception')

    # Send Slack alert
    slack_message = f"""
:red_circle: *ETL Task Failure Alert*
- DAG: `{dag_id}`
- Task: `{task_id}`
- Execution Time: {execution_date}
- Error: {str(exception)[:500]}
    """

    SlackAPIPostOperator(
        task_id='slack_alert',
        channel='#data-alerts',
        text=slack_message,
        token=Variable.get('SLACK_TOKEN')
    ).execute(context)

    # Send metrics to monitoring system
    SimpleHttpOperator(
        task_id='send_metric',
        http_conn_id='monitoring_api',
        endpoint='/metrics',
        method='POST',
        data={
            'metric': 'etl_task_failure',
            'tags': {
                'dag': dag_id,
                'task': task_id
            },
            'value': 1
        }
    ).execute(context)

# Success callback function
def task_success_callback(context):
    """Callback when task succeeds"""
    task_instance = context['task_instance']
    duration = (task_instance.end_date - task_instance.start_date).total_seconds()

    # Record execution duration metric
    SimpleHttpOperator(
        task_id='send_duration_metric',
        http_conn_id='monitoring_api',
        endpoint='/metrics',
        method='POST',
        data={
            'metric': 'etl_task_duration_seconds',
            'tags': {
                'dag': context['dag'].dag_id,
                'task': task_instance.task_id
            },
            'value': duration
        }
    ).execute(context)

# Use callbacks in DAG
dag = DAG(
    'monitored_etl_pipeline',
    default_args={
        'on_failure_callback': task_failure_callback,
        'on_success_callback': task_success_callback,
        'sla': timedelta(hours=2),  # SLA timeout alert
    },
    ...
)
```

### Custom Monitoring Dashboard

```python
from prometheus_client import Counter, Histogram, Gauge, start_http_server
import time

# Define Prometheus metrics
ETL_RECORDS_PROCESSED = Counter(
    'etl_records_processed_total',
    'Total number of records processed',
    ['pipeline', 'stage']
)

ETL_DURATION = Histogram(
    'etl_stage_duration_seconds',
    'Duration of ETL stages',
    ['pipeline', 'stage'],
    buckets=[1, 5, 10, 30, 60, 120, 300, 600]
)

ETL_ERRORS = Counter(
    'etl_errors_total',
    'Total number of ETL errors',
    ['pipeline', 'stage', 'error_type']
)

ETL_PIPELINE_STATUS = Gauge(
    'etl_pipeline_status',
    'Current status of ETL pipeline (1=running, 0=idle, -1=failed)',
    ['pipeline']
)

class MetricsCollector:
    """ETL metrics collector"""

    def __init__(self, pipeline_name: str):
        self.pipeline_name = pipeline_name
        self.stage_start_times = {}

    def start_stage(self, stage_name: str):
        """Start timing a stage"""
        self.stage_start_times[stage_name] = time.time()
        ETL_PIPELINE_STATUS.labels(pipeline=self.pipeline_name).set(1)

    def end_stage(self, stage_name: str, record_count: int):
        """End a stage and record metrics"""
        if stage_name in self.stage_start_times:
            duration = time.time() - self.stage_start_times[stage_name]
            ETL_DURATION.labels(
                pipeline=self.pipeline_name,
                stage=stage_name
            ).observe(duration)

        ETL_RECORDS_PROCESSED.labels(
            pipeline=self.pipeline_name,
            stage=stage_name
        ).inc(record_count)

    def record_error(self, stage_name: str, error_type: str):
        """Record an error"""
        ETL_ERRORS.labels(
            pipeline=self.pipeline_name,
            stage=stage_name,
            error_type=error_type
        ).inc()
        ETL_PIPELINE_STATUS.labels(pipeline=self.pipeline_name).set(-1)

    def pipeline_complete(self):
        """Mark pipeline as complete"""
        ETL_PIPELINE_STATUS.labels(pipeline=self.pipeline_name).set(0)

# Usage example
def run_monitored_pipeline():
    metrics = MetricsCollector('sales_etl')

    try:
        # Extract stage
        metrics.start_stage('extract')
        df = extract_data()
        metrics.end_stage('extract', len(df))

        # Transform stage
        metrics.start_stage('transform')
        df = transform_data(df)
        metrics.end_stage('transform', len(df))

        # Load stage
        metrics.start_stage('load')
        load_data(df)
        metrics.end_stage('load', len(df))

        metrics.pipeline_complete()

    except Exception as e:
        metrics.record_error('unknown', type(e).__name__)
        raise
```

---

## Error Handling and Retries

### Robust Error Handling Framework

```python
from functools import wraps
from typing import Type, Tuple, Callable
import time
import random
from dataclasses import dataclass

@dataclass
class RetryConfig:
    """Retry configuration"""
    max_retries: int = 3
    initial_delay: float = 1.0
    max_delay: float = 60.0
    exponential_base: float = 2.0
    jitter: bool = True
    retryable_exceptions: Tuple[Type[Exception], ...] = (Exception,)

class ETLError(Exception):
    """Base ETL exception"""
    pass

class ExtractError(ETLError):
    """Data extraction exception"""
    pass

class TransformError(ETLError):
    """Data transformation exception"""
    pass

class LoadError(ETLError):
    """Data loading exception"""
    pass

class DataQualityError(ETLError):
    """Data quality exception"""
    pass

def retry_with_backoff(config: RetryConfig = None):
    """Retry decorator with exponential backoff"""
    if config is None:
        config = RetryConfig()

    def decorator(func: Callable):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None

            for attempt in range(config.max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except config.retryable_exceptions as e:
                    last_exception = e

                    if attempt == config.max_retries:
                        raise

                    # Calculate delay
                    delay = min(
                        config.initial_delay * (config.exponential_base ** attempt),
                        config.max_delay
                    )

                    # Add jitter to prevent thundering herd
                    if config.jitter:
                        delay = delay * (0.5 + random.random())

                    print(f"Attempt {attempt + 1} failed: {e}. "
                          f"Retrying in {delay:.2f} seconds...")
                    time.sleep(delay)

            raise last_exception
        return wrapper
    return decorator

# Usage example
@retry_with_backoff(RetryConfig(
    max_retries=3,
    initial_delay=1.0,
    retryable_exceptions=(ConnectionError, TimeoutError)
))
def extract_from_api(endpoint: str):
    """Extract data from API (with retry)"""
    import requests

    response = requests.get(endpoint, timeout=30)
    response.raise_for_status()
    return response.json()

# Dead Letter Queue for handling failed records
class DeadLetterQueue:
    """Dead letter queue for failed records"""

    def __init__(self, engine, table_name='etl_dead_letter_queue'):
        self.engine = engine
        self.table_name = table_name
        self._ensure_table_exists()

    def _ensure_table_exists(self):
        """Ensure dead letter queue table exists"""
        create_sql = f"""
        CREATE TABLE IF NOT EXISTS {self.table_name} (
            id SERIAL PRIMARY KEY,
            pipeline_name VARCHAR(255),
            stage VARCHAR(50),
            record_data JSONB,
            error_message TEXT,
            error_type VARCHAR(255),
            created_at TIMESTAMP DEFAULT NOW(),
            retry_count INT DEFAULT 0,
            last_retry_at TIMESTAMP,
            status VARCHAR(20) DEFAULT 'pending'
        )
        """
        with self.engine.begin() as conn:
            conn.execute(text(create_sql))

    def add_failed_record(
        self,
        pipeline_name: str,
        stage: str,
        record: dict,
        error: Exception
    ):
        """Add failed record to dead letter queue"""
        import json

        insert_sql = f"""
        INSERT INTO {self.table_name}
        (pipeline_name, stage, record_data, error_message, error_type)
        VALUES (:pipeline, :stage, :record, :error_msg, :error_type)
        """

        with self.engine.begin() as conn:
            conn.execute(text(insert_sql), {
                'pipeline': pipeline_name,
                'stage': stage,
                'record': json.dumps(record),
                'error_msg': str(error),
                'error_type': type(error).__name__
            })

    def get_pending_records(self, pipeline_name: str, limit: int = 100):
        """Get pending records for retry"""
        query = f"""
        SELECT * FROM {self.table_name}
        WHERE pipeline_name = :pipeline
          AND status = 'pending'
          AND retry_count < 3
        ORDER BY created_at
        LIMIT :limit
        """
        return pd.read_sql(text(query), self.engine, params={
            'pipeline': pipeline_name,
            'limit': limit
        })

    def mark_resolved(self, record_id: int):
        """Mark record as resolved"""
        update_sql = f"""
        UPDATE {self.table_name}
        SET status = 'resolved', last_retry_at = NOW()
        WHERE id = :id
        """
        with self.engine.begin() as conn:
            conn.execute(text(update_sql), {'id': record_id})

# Using dead letter queue in ETL
def process_with_dlq(df: pd.DataFrame, pipeline_name: str):
    """Process data with failed records going to DLQ"""
    dlq = DeadLetterQueue(engine)
    processed = []

    for idx, row in df.iterrows():
        try:
            result = transform_record(row.to_dict())
            processed.append(result)
        except Exception as e:
            dlq.add_failed_record(
                pipeline_name=pipeline_name,
                stage='transform',
                record=row.to_dict(),
                error=e
            )

    return pd.DataFrame(processed)
```

---

## Best Practices

### Configuration Management

```python
# config/etl_config.py
from dataclasses import dataclass
from typing import Dict, Any
import yaml
import os

@dataclass
class DatabaseConfig:
    host: str
    port: int
    database: str
    username: str
    password: str

    @property
    def connection_string(self) -> str:
        return f"postgresql://{self.username}:{self.password}@{self.host}:{self.port}/{self.database}"

@dataclass
class PipelineConfig:
    name: str
    source_config: DatabaseConfig
    target_config: DatabaseConfig
    batch_size: int = 10000
    parallelism: int = 4
    retry_config: RetryConfig = None

    @classmethod
    def from_yaml(cls, config_path: str) -> 'PipelineConfig':
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)

        # Get sensitive info from environment variables
        source_config = DatabaseConfig(
            host=config['source']['host'],
            port=config['source']['port'],
            database=config['source']['database'],
            username=os.environ.get('SOURCE_DB_USER'),
            password=os.environ.get('SOURCE_DB_PASSWORD')
        )

        target_config = DatabaseConfig(
            host=config['target']['host'],
            port=config['target']['port'],
            database=config['target']['database'],
            username=os.environ.get('TARGET_DB_USER'),
            password=os.environ.get('TARGET_DB_PASSWORD')
        )

        return cls(
            name=config['name'],
            source_config=source_config,
            target_config=target_config,
            batch_size=config.get('batch_size', 10000),
            parallelism=config.get('parallelism', 4)
        )
```

### Testing Strategy

```python
# tests/test_etl_pipeline.py
import pytest
import pandas as pd
from unittest.mock import Mock, patch

class TestTransformations:
    """Test data transformation logic"""

    @pytest.fixture
    def sample_orders(self):
        return pd.DataFrame({
            'order_id': ['ORD-001', 'ORD-002', 'ORD-003'],
            'quantity': [2, 3, 1],
            'unit_price': [100.0, 200.0, 150.0],
            'order_date': ['2024-01-15', '2024-01-16', '2024-01-17']
        })

    def test_calculate_total_amount(self, sample_orders):
        """Test total amount calculation"""
        result = transform_orders(sample_orders)

        expected_amounts = [200.0, 600.0, 150.0]
        assert result['total_amount'].tolist() == expected_amounts

    def test_handle_null_values(self):
        """Test null value handling"""
        df_with_nulls = pd.DataFrame({
            'order_id': ['ORD-001', None, 'ORD-003'],
            'quantity': [2, 3, None],
            'unit_price': [100.0, None, 150.0]
        })

        result = transform_orders(df_with_nulls)

        # Verify nulls are properly handled
        assert result['order_id'].notna().all()
        assert result['quantity'].notna().all()

    def test_data_quality_checks_pass(self, sample_orders):
        """Test data quality checks pass"""
        checker = DataQualityChecker()
        checker.add_check(check_no_nulls('order_id'))
        checker.add_check(check_value_range('quantity', 1, 1000))

        results = checker.run_checks(sample_orders)

        assert all(r.passed for r in results)

    def test_data_quality_checks_fail(self):
        """Test data quality checks fail"""
        bad_data = pd.DataFrame({
            'order_id': [None, 'ORD-002'],
            'quantity': [-1, 5]
        })

        checker = DataQualityChecker()
        checker.add_check(check_no_nulls('order_id'))
        checker.add_check(check_value_range('quantity', 1, 1000))

        results = checker.run_checks(bad_data)

        assert checker.has_critical_failures() or any(not r.passed for r in results)

class TestIncrementalLoading:
    """Test incremental loading logic"""

    @pytest.fixture
    def mock_engines(self):
        source = Mock()
        target = Mock()
        return source, target

    def test_timestamp_based_incremental(self, mock_engines):
        """Test timestamp-based incremental loading"""
        source, target = mock_engines

        # Mock target table returning max timestamp
        target.connect().execute.return_value.scalar.return_value = '2024-01-14 00:00:00'

        loader = IncrementalLoader(source, target)
        result = loader.load_by_timestamp(
            'source_orders',
            'target_orders',
            'updated_at'
        )

        # Verify query uses correct timestamp filter
        # Specific assertions depend on implementation
```

### Documentation and Data Dictionary

```yaml
# docs/data_dictionary.yml
models:
  - name: fact_sales
    description: "Sales fact table recording detailed order information"
    owner: "data_team"
    update_frequency: "daily"
    columns:
      - name: order_id
        description: "Unique order identifier"
        type: "VARCHAR(20)"
        is_nullable: false
        is_primary_key: true
        example: "ORD-20240115-001"

      - name: customer_id
        description: "Customer ID, references dim_customers table"
        type: "INTEGER"
        is_nullable: false
        is_foreign_key: true
        references: "dim_customers.customer_id"

      - name: order_date
        description: "Order date"
        type: "DATE"
        is_nullable: false
        partition_key: true

      - name: total_amount
        description: "Total order amount"
        type: "DECIMAL(12,2)"
        is_nullable: false
        valid_range: ">= 0"

    data_quality_rules:
      - rule: "no_null_primary_key"
        column: "order_id"
        severity: "critical"

      - rule: "referential_integrity"
        column: "customer_id"
        reference: "dim_customers"
        severity: "error"

      - rule: "positive_amount"
        column: "total_amount"
        condition: ">= 0"
        severity: "error"

    sla:
      freshness: "24 hours"
      availability: "99.9%"
```

---

## Interview Key Points

### Frequently Asked Interview Questions

**Q1: What is the difference between ETL and ELT? When would you choose each approach?**

A: The main difference is where transformation occurs:
- ETL: Transformation happens in an intermediate processing layer before loading to the target system
- ELT: Raw data is loaded to the target system first, then transformation occurs within the target system

Selection guidelines:
- Cloud data warehouses (Snowflake/BigQuery): Choose ELT to leverage their powerful compute capabilities
- Traditional data warehouses: Choose ETL to reduce warehouse load
- Need to retain raw data: Choose ELT
- Small data volume, simple transformations: ETL is sufficient

**Q2: How do you ensure ETL pipeline idempotency?**

A: Idempotency ensures repeated execution produces the same result. Implementation methods:
1. Use UPSERT instead of INSERT
2. Delete corresponding partition data before writing
3. Use transactions to ensure atomicity
4. Deduplicate incremental data using unique keys

```sql
-- Idempotent write example
DELETE FROM target_table WHERE date_partition = '2024-01-15';
INSERT INTO target_table SELECT * FROM staging WHERE date_partition = '2024-01-15';
```

**Q3: Describe a data quality issue you've handled**

A: Typical answer framework:
1. **Discovery**: Found sudden increase in null rate for a field through data quality checks
2. **Root cause analysis**: Traced to upstream system releasing a new version with field format changes
3. **Temporary fix**: Modified ETL logic to be compatible with new format, backfilled affected data
4. **Long-term solution**: Established data contracts, added upstream change notification mechanism
5. **Prevention**: Strengthened data quality monitoring, set threshold alerts

**Q4: What is the relationship between DAG, Task, and Operator in Airflow?**

A:
- **DAG** (Directed Acyclic Graph): Defines the overall structure and task dependencies of a workflow
- **Task**: A node in the DAG representing a specific unit of work
- **Operator**: A template that defines what operation a Task performs (e.g., PythonOperator, BashOperator)

```python
# DAG contains multiple Tasks, each Task is created by an Operator
with DAG('example_dag') as dag:
    task1 = PythonOperator(task_id='task1', ...)  # Task created by Operator
    task2 = BashOperator(task_id='task2', ...)
    task1 >> task2  # Define dependencies
```

**Q5: How would you design an incremental data sync solution?**

A: Common approaches:
1. **Timestamp-based**: Suitable for scenarios with `updated_at` field
2. **Sequence-based**: Suitable for append-only scenarios without updates
3. **Hash comparison**: Suitable for scenarios needing to detect updates
4. **CDC (Change Data Capture)**: Suitable for high real-time requirements

Key considerations:
- Whether source system supports CDC
- Data latency tolerance
- Need for historical data backfill

**Q6: How does dbt's incremental model work?**

A: dbt incremental models achieve incremental updates through:
1. First run: Creates complete table
2. Subsequent runs: Only processes new data, uses `is_incremental()` macro to determine

```sql
{{ config(materialized='incremental', unique_key='id') }}

SELECT * FROM source
{% if is_incremental() %}
WHERE updated_at > (SELECT MAX(updated_at) FROM {{ this }})
{% endif %}
```

Key configurations:
- `unique_key`: Key used for merging
- `incremental_strategy`: append/merge/delete+insert

---

## Further Reading

### Official Documentation

- [Apache Airflow Documentation](https://airflow.apache.org/docs/) - Official Airflow documentation
- [dbt Documentation](https://docs.getdbt.com/) - Official dbt documentation
- [Great Expectations Documentation](https://docs.greatexpectations.io/) - Data quality framework

### Recommended Books

- **"Fundamentals of Data Engineering"** - Joe Reis, Matt Housley
- **"The Data Warehouse Toolkit"** - Ralph Kimball (Data warehousing classic)
- **"Designing Data-Intensive Applications"** - Martin Kleppmann

### Online Resources

- [Data Engineering Zoomcamp](https://github.com/DataTalksClub/data-engineering-zoomcamp) - Free data engineering course
- [Awesome Data Engineering](https://github.com/igorbarinov/awesome-data-engineering) - Data engineering resource collection
- [dbt Learn](https://courses.getdbt.com/) - Official dbt learning courses

### Related Tools

- **Orchestration Tools**: Apache Airflow, Prefect, Dagster, Luigi
- **Transformation Tools**: dbt, Spark, Pandas
- **Data Quality**: Great Expectations, Soda, dbt tests
- **CDC Tools**: Debezium, Maxwell, AWS DMS
- **Data Integration**: Fivetran, Airbyte, Stitch

---

> **Summary**: Building reliable ETL and data pipelines requires comprehensive consideration of data quality, performance, observability, and error handling. Modern data stacks recommend adopting ELT architecture, using Airflow for orchestration, dbt for transformation, and Great Expectations for data quality validation. Mastering these tools and best practices will enable you to build enterprise-grade data platforms.
