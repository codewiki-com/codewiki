---
title: Apache Airflow Workflow Orchestration
description: Build and schedule data pipelines with Airflow
track: data
section: data-engineering
difficulty: intermediate
tags:
  - Airflow
  - workflow
  - DAG
  - data pipeline
status: imported
origin: old/src/content/docs/data/airflow.en.md
divergence: 0.271
issues: []
legacy:
  category: Data
  subcategory: Orchestration
  order: 18
  lastUpdated: 2026-01-07
---

Apache Airflow is an open-source platform designed to programmatically author, schedule, and monitor workflows. Originally developed at Airbnb in 2014, it has become the de facto standard for orchestrating complex data pipelines in modern data engineering. We'll cover Airflow's architecture, core concepts, and best practices for building production-grade workflows.

## Airflow Architecture

### Overview

Airflow follows a modular architecture that separates concerns between workflow definition, scheduling, and execution. Understanding these components is essential for deploying and operating Airflow effectively.

```
+------------------------------------------------------------------+
|                      Airflow Architecture                         |
+------------------------------------------------------------------+
|                                                                   |
|  +------------------+      +------------------+                   |
|  |    Web Server    |      |    Scheduler     |                   |
|  |   (Flask App)    |      |  (DAG Processor) |                   |
|  +--------+---------+      +--------+---------+                   |
|           |                         |                             |
|           v                         v                             |
|  +--------------------------------------------------+            |
|  |              Metadata Database                    |            |
|  |         (PostgreSQL / MySQL)                      |            |
|  +--------------------------------------------------+            |
|                         |                                         |
|                         v                                         |
|  +--------------------------------------------------+            |
|  |                   Executor                        |            |
|  |    (Local / Celery / Kubernetes / Dask)          |            |
|  +--------------------------------------------------+            |
|           |              |              |                         |
|           v              v              v                         |
|     +---------+    +---------+    +---------+                    |
|     | Worker  |    | Worker  |    | Worker  |                    |
|     +---------+    +---------+    +---------+                    |
|                                                                   |
+------------------------------------------------------------------+
```

### Core Components

| Component | Description |
|-----------|-------------|
| **Web Server** | Flask application providing the UI for monitoring and managing DAGs |
| **Scheduler** | Monitors all DAGs and triggers task instances when dependencies are met |
| **Executor** | Determines how tasks are actually run (locally, on workers, in containers) |
| **Workers** | Processes that execute the actual task logic |
| **Metadata Database** | Stores DAG definitions, task states, variables, connections, and logs |
| **DAG Directory** | Folder containing Python files that define DAGs |

### Executor Types

```python
# LocalExecutor - Single machine, parallel execution
# Good for development and small-scale production
AIRFLOW__CORE__EXECUTOR=LocalExecutor

# CeleryExecutor - Distributed execution using Celery
# Good for horizontal scaling with worker nodes
AIRFLOW__CORE__EXECUTOR=CeleryExecutor

# KubernetesExecutor - Dynamic pod creation per task
# Good for cloud-native deployments with isolation
AIRFLOW__CORE__EXECUTOR=KubernetesExecutor

# CeleryKubernetesExecutor - Hybrid approach
# Run some tasks on Celery workers, others in Kubernetes pods
AIRFLOW__CORE__EXECUTOR=CeleryKubernetesExecutor
```

### Deployment Options

```yaml
# docker-compose.yaml for local development
version: '3.8'
services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_USER: airflow
      POSTGRES_PASSWORD: airflow
      POSTGRES_DB: airflow
    volumes:
      - postgres-db-volume:/var/lib/postgresql/data

  airflow-webserver:
    image: apache/airflow:2.7.0
    depends_on:
      - postgres
    environment:
      AIRFLOW__CORE__EXECUTOR: LocalExecutor
      AIRFLOW__DATABASE__SQL_ALCHEMY_CONN: postgresql+psycopg2://airflow:airflow@postgres/airflow
      AIRFLOW__CORE__FERNET_KEY: ${FERNET_KEY}
      AIRFLOW__WEBSERVER__SECRET_KEY: ${SECRET_KEY}
    volumes:
      - ./dags:/opt/airflow/dags
      - ./logs:/opt/airflow/logs
      - ./plugins:/opt/airflow/plugins
    ports:
      - "8080:8080"
    command: webserver

  airflow-scheduler:
    image: apache/airflow:2.7.0
    depends_on:
      - postgres
    environment:
      AIRFLOW__CORE__EXECUTOR: LocalExecutor
      AIRFLOW__DATABASE__SQL_ALCHEMY_CONN: postgresql+psycopg2://airflow:airflow@postgres/airflow
    volumes:
      - ./dags:/opt/airflow/dags
      - ./logs:/opt/airflow/logs
      - ./plugins:/opt/airflow/plugins
    command: scheduler

volumes:
  postgres-db-volume:
```

---

## DAGs (Directed Acyclic Graphs)

### What is a DAG?

A DAG is a collection of tasks organized with dependencies and relationships that define how they should run. The "directed" aspect means tasks have a defined direction of execution, and "acyclic" means there are no circular dependencies.

### Basic DAG Definition

```python
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator

# Default arguments applied to all tasks
default_args = {
    'owner': 'data_engineering',
    'depends_on_past': False,
    'email': ['alerts@company.com'],
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
    'retry_exponential_backoff': True,
    'max_retry_delay': timedelta(minutes=30),
}

# DAG definition
dag = DAG(
    dag_id='my_first_dag',
    default_args=default_args,
    description='A simple example DAG',
    schedule_interval='0 6 * * *',  # Run daily at 6 AM
    start_date=datetime(2024, 1, 1),
    catchup=False,
    max_active_runs=1,
    tags=['example', 'tutorial'],
)

# Define tasks
def extract_data(**context):
    print(f"Extracting data for {context['ds']}")
    return "extracted_data_path"

extract_task = PythonOperator(
    task_id='extract_data',
    python_callable=extract_data,
    dag=dag,
)

transform_task = BashOperator(
    task_id='transform_data',
    bash_command='echo "Transforming data..."',
    dag=dag,
)

load_task = BashOperator(
    task_id='load_data',
    bash_command='echo "Loading data..."',
    dag=dag,
)

# Define task dependencies
extract_task >> transform_task >> load_task
```

### Modern DAG Syntax with Decorators

```python
from airflow.decorators import dag, task
from datetime import datetime, timedelta

@dag(
    dag_id='modern_etl_pipeline',
    schedule_interval='@daily',
    start_date=datetime(2024, 1, 1),
    catchup=False,
    default_args={
        'owner': 'data_team',
        'retries': 2,
        'retry_delay': timedelta(minutes=5),
    },
    tags=['etl', 'modern'],
)
def modern_etl_pipeline():
    """
    A modern ETL pipeline using TaskFlow API.
    This docstring appears in the Airflow UI.
    """

    @task()
    def extract() -> dict:
        """Extract data from source systems"""
        import pandas as pd

        # Simulate data extraction
        data = {
            'users': [1, 2, 3, 4, 5],
            'values': [100, 200, 150, 300, 250]
        }
        return data

    @task()
    def transform(raw_data: dict) -> dict:
        """Transform and clean the data"""
        # Apply transformations
        transformed = {
            'users': raw_data['users'],
            'values': [v * 1.1 for v in raw_data['values']],  # 10% increase
            'total': sum(raw_data['values'])
        }
        return transformed

    @task()
    def load(processed_data: dict) -> None:
        """Load data to destination"""
        print(f"Loading {len(processed_data['users'])} records")
        print(f"Total value: {processed_data['total']}")
        # In reality, write to database or file system

    # Define the task flow
    raw_data = extract()
    processed_data = transform(raw_data)
    load(processed_data)

# Instantiate the DAG
dag = modern_etl_pipeline()
```

### DAG Configuration Options

```python
from airflow import DAG
from datetime import datetime, timedelta

dag = DAG(
    dag_id='configured_dag',

    # Scheduling
    schedule_interval='0 */4 * * *',  # Every 4 hours
    start_date=datetime(2024, 1, 1),
    end_date=datetime(2024, 12, 31),  # Optional end date
    catchup=False,  # Don't backfill missed runs

    # Execution limits
    max_active_runs=3,  # Max concurrent DAG runs
    max_active_tasks=10,  # Max concurrent tasks across all runs
    dagrun_timeout=timedelta(hours=2),  # Timeout for entire DAG run

    # Behavior
    is_paused_upon_creation=True,  # Start paused
    orientation='TB',  # Graph orientation: TB, LR, RL, BT

    # Documentation
    description='A well-configured DAG example',
    doc_md="""
    ## DAG Documentation

    This DAG demonstrates various configuration options.

    ### Schedule
    Runs every 4 hours starting from January 1, 2024.

    ### Dependencies
    - Requires database connection `my_db`
    - Uses S3 bucket `my-bucket`
    """,

    # Organization
    tags=['production', 'etl', 'daily'],

    # Access control (requires RBAC)
    access_control={
        'Data Engineers': {'can_read', 'can_edit'},
        'Analysts': {'can_read'},
    },

    # Default task arguments
    default_args={
        'owner': 'data_team',
        'retries': 2,
        'retry_delay': timedelta(minutes=5),
        'execution_timeout': timedelta(hours=1),
    },
)
```

---

## Operators

Operators are the building blocks of Airflow tasks. They define what actually gets executed when a task runs.

### Core Operators

```python
from airflow.operators.python import PythonOperator, BranchPythonOperator
from airflow.operators.bash import BashOperator
from airflow.operators.empty import EmptyOperator
from airflow.operators.trigger_dagrun import TriggerDagRunOperator

# EmptyOperator - Placeholder or checkpoint
start = EmptyOperator(
    task_id='start',
    dag=dag,
)

# BashOperator - Execute bash commands
bash_task = BashOperator(
    task_id='run_script',
    bash_command='python /path/to/script.py --date {{ ds }}',
    env={'MY_VAR': 'value'},
    cwd='/working/directory',
    dag=dag,
)

# PythonOperator - Execute Python functions
def my_python_function(name, **context):
    execution_date = context['ds']
    print(f"Hello {name}, running for {execution_date}")
    return f"Completed for {execution_date}"

python_task = PythonOperator(
    task_id='python_task',
    python_callable=my_python_function,
    op_kwargs={'name': 'Airflow'},
    dag=dag,
)

# BranchPythonOperator - Conditional branching
def choose_branch(**context):
    execution_date = context['ds']
    day = datetime.strptime(execution_date, '%Y-%m-%d').weekday()
    if day < 5:  # Monday to Friday
        return 'weekday_task'
    else:
        return 'weekend_task'

branch_task = BranchPythonOperator(
    task_id='branch_task',
    python_callable=choose_branch,
    dag=dag,
)

# TriggerDagRunOperator - Trigger another DAG
trigger_downstream = TriggerDagRunOperator(
    task_id='trigger_downstream_dag',
    trigger_dag_id='downstream_dag',
    conf={'key': 'value'},
    wait_for_completion=True,
    dag=dag,
)
```

### Database Operators

```python
from airflow.providers.postgres.operators.postgres import PostgresOperator
from airflow.providers.mysql.operators.mysql import MySqlOperator

# PostgresOperator - Execute SQL on PostgreSQL
create_table = PostgresOperator(
    task_id='create_table',
    postgres_conn_id='my_postgres',
    sql="""
        CREATE TABLE IF NOT EXISTS daily_metrics (
            date DATE PRIMARY KEY,
            metric_value NUMERIC,
            created_at TIMESTAMP DEFAULT NOW()
        );
    """,
    dag=dag,
)

# Execute SQL from file
run_sql_file = PostgresOperator(
    task_id='run_sql_file',
    postgres_conn_id='my_postgres',
    sql='sql/transform_data.sql',  # File in DAGs folder
    params={'table_name': 'my_table'},  # Use with {{ params.table_name }}
    dag=dag,
)

# MySqlOperator
mysql_task = MySqlOperator(
    task_id='mysql_query',
    mysql_conn_id='my_mysql',
    sql='SELECT COUNT(*) FROM users WHERE created_at = "{{ ds }}"',
    dag=dag,
)
```

### Cloud Operators

```python
# AWS Operators
from airflow.providers.amazon.aws.operators.s3 import S3CreateBucketOperator
from airflow.providers.amazon.aws.transfers.local_to_s3 import LocalFilesystemToS3Operator
from airflow.providers.amazon.aws.operators.glue import GlueJobOperator

upload_to_s3 = LocalFilesystemToS3Operator(
    task_id='upload_to_s3',
    filename='/local/path/file.csv',
    dest_key='data/{{ ds }}/file.csv',
    dest_bucket='my-bucket',
    aws_conn_id='aws_default',
    replace=True,
    dag=dag,
)

run_glue_job = GlueJobOperator(
    task_id='run_glue_etl',
    job_name='my-glue-job',
    script_args={'--date': '{{ ds }}'},
    aws_conn_id='aws_default',
    dag=dag,
)

# GCP Operators
from airflow.providers.google.cloud.operators.bigquery import BigQueryExecuteQueryOperator
from airflow.providers.google.cloud.transfers.gcs_to_bigquery import GCSToBigQueryOperator

bq_query = BigQueryExecuteQueryOperator(
    task_id='bq_query',
    sql="""
        SELECT * FROM `project.dataset.table`
        WHERE date = '{{ ds }}'
    """,
    destination_dataset_table='project.dataset.results',
    write_disposition='WRITE_TRUNCATE',
    gcp_conn_id='google_cloud_default',
    dag=dag,
)

gcs_to_bq = GCSToBigQueryOperator(
    task_id='load_csv_to_bq',
    bucket='my-bucket',
    source_objects=['data/{{ ds }}/*.csv'],
    destination_project_dataset_table='project.dataset.table',
    schema_fields=[
        {'name': 'id', 'type': 'INTEGER'},
        {'name': 'name', 'type': 'STRING'},
    ],
    write_disposition='WRITE_APPEND',
    dag=dag,
)
```

### Custom Operators

```python
from airflow.models import BaseOperator
from airflow.utils.decorators import apply_defaults
from typing import Any, Dict

class MyCustomOperator(BaseOperator):
    """
    Custom operator for specialized processing.

    :param source_path: Path to source data
    :param destination_path: Path for output
    :param processing_mode: Type of processing to apply
    """

    template_fields = ('source_path', 'destination_path')
    template_ext = ('.sql', '.json')
    ui_color = '#e8f7e4'

    @apply_defaults
    def __init__(
        self,
        source_path: str,
        destination_path: str,
        processing_mode: str = 'default',
        **kwargs
    ) -> None:
        super().__init__(**kwargs)
        self.source_path = source_path
        self.destination_path = destination_path
        self.processing_mode = processing_mode

    def execute(self, context: Dict[str, Any]) -> str:
        """Execute the operator logic"""
        self.log.info(f"Processing {self.source_path}")
        self.log.info(f"Mode: {self.processing_mode}")
        self.log.info(f"Execution date: {context['ds']}")

        # Your custom logic here
        result = self._process_data()

        # Push result to XCom
        context['ti'].xcom_push(key='result', value=result)

        return result

    def _process_data(self) -> str:
        """Internal processing method"""
        # Implementation details
        return f"Processed {self.source_path} to {self.destination_path}"

# Usage
custom_task = MyCustomOperator(
    task_id='custom_processing',
    source_path='s3://bucket/input/{{ ds }}/',
    destination_path='s3://bucket/output/{{ ds }}/',
    processing_mode='advanced',
    dag=dag,
)
```

---

## Sensors

Sensors are special operators that wait for a certain condition to be true before proceeding.

### Common Sensors

```python
from airflow.sensors.filesystem import FileSensor
from airflow.sensors.time_sensor import TimeSensor
from airflow.sensors.external_task import ExternalTaskSensor
from airflow.providers.http.sensors.http import HttpSensor
from airflow.providers.amazon.aws.sensors.s3 import S3KeySensor

# FileSensor - Wait for file to exist
wait_for_file = FileSensor(
    task_id='wait_for_file',
    filepath='/data/incoming/file_{{ ds_nodash }}.csv',
    poke_interval=300,  # Check every 5 minutes
    timeout=3600,  # Timeout after 1 hour
    mode='poke',  # 'poke' or 'reschedule'
    dag=dag,
)

# TimeSensor - Wait until specific time
wait_until_time = TimeSensor(
    task_id='wait_until_6am',
    target_time=datetime.time(6, 0, 0),
    dag=dag,
)

# ExternalTaskSensor - Wait for task in another DAG
wait_for_upstream = ExternalTaskSensor(
    task_id='wait_for_upstream_dag',
    external_dag_id='upstream_dag',
    external_task_id='final_task',
    execution_delta=timedelta(hours=1),  # Look for run 1 hour before
    mode='reschedule',
    timeout=7200,
    dag=dag,
)

# HttpSensor - Wait for HTTP endpoint
wait_for_api = HttpSensor(
    task_id='wait_for_api',
    http_conn_id='my_api',
    endpoint='/health',
    request_params={},
    response_check=lambda response: response.status_code == 200,
    poke_interval=60,
    timeout=600,
    dag=dag,
)

# S3KeySensor - Wait for S3 object
wait_for_s3 = S3KeySensor(
    task_id='wait_for_s3_file',
    bucket_name='my-bucket',
    bucket_key='data/{{ ds }}/input.parquet',
    aws_conn_id='aws_default',
    poke_interval=300,
    timeout=3600,
    dag=dag,
)
```

### Sensor Modes

```python
# Poke Mode (default)
# - Keeps the worker slot occupied while waiting
# - Good for short waits or when workers are plentiful
sensor_poke = FileSensor(
    task_id='sensor_poke',
    filepath='/path/to/file',
    mode='poke',
    poke_interval=30,  # Seconds between checks
    dag=dag,
)

# Reschedule Mode
# - Releases worker slot between checks
# - Good for long waits or when workers are scarce
sensor_reschedule = FileSensor(
    task_id='sensor_reschedule',
    filepath='/path/to/file',
    mode='reschedule',
    poke_interval=300,  # 5 minutes between checks
    dag=dag,
)

# Deferrable Operators (Airflow 2.2+)
# - Uses async I/O, no worker slot used while waiting
# - Most efficient for long waits
from airflow.sensors.filesystem import FileSensor

sensor_deferrable = FileSensor(
    task_id='sensor_deferrable',
    filepath='/path/to/file',
    deferrable=True,  # Enable deferrable mode
    dag=dag,
)
```

### Custom Sensors

```python
from airflow.sensors.base import BaseSensorOperator
from airflow.utils.decorators import apply_defaults

class DataQualitySensor(BaseSensorOperator):
    """
    Sensor that checks if data meets quality thresholds.
    """

    template_fields = ('table_name', 'date_column')

    @apply_defaults
    def __init__(
        self,
        conn_id: str,
        table_name: str,
        date_column: str,
        min_row_count: int = 1,
        **kwargs
    ) -> None:
        super().__init__(**kwargs)
        self.conn_id = conn_id
        self.table_name = table_name
        self.date_column = date_column
        self.min_row_count = min_row_count

    def poke(self, context) -> bool:
        """Check if data quality conditions are met"""
        from airflow.hooks.postgres_hook import PostgresHook

        hook = PostgresHook(postgres_conn_id=self.conn_id)

        sql = f"""
            SELECT COUNT(*)
            FROM {self.table_name}
            WHERE {self.date_column} = '{context['ds']}'
        """

        result = hook.get_first(sql)
        row_count = result[0] if result else 0

        self.log.info(f"Found {row_count} rows (minimum: {self.min_row_count})")

        return row_count >= self.min_row_count

# Usage
quality_check = DataQualitySensor(
    task_id='check_data_quality',
    conn_id='my_postgres',
    table_name='staging_table',
    date_column='process_date',
    min_row_count=100,
    poke_interval=300,
    timeout=3600,
    dag=dag,
)
```

---

## Connections and Variables

### Connections

Connections store credentials and connection information for external systems.

```python
# Accessing connections in code
from airflow.hooks.base import BaseHook

# Get connection object
conn = BaseHook.get_connection('my_postgres')
print(f"Host: {conn.host}")
print(f"Schema: {conn.schema}")
print(f"Login: {conn.login}")
print(f"Password: {conn.password}")  # Be careful with logging!
print(f"Port: {conn.port}")
print(f"Extra: {conn.extra_dejson}")

# Get connection URI
uri = BaseHook.get_connection('my_postgres').get_uri()

# Using hooks with connections
from airflow.providers.postgres.hooks.postgres import PostgresHook

def query_database(**context):
    hook = PostgresHook(postgres_conn_id='my_postgres')

    # Execute query and get results
    records = hook.get_records("SELECT * FROM users LIMIT 10")

    # Get pandas DataFrame
    df = hook.get_pandas_df("SELECT * FROM users")

    # Execute without returning results
    hook.run("INSERT INTO logs VALUES ('task_completed', NOW())")

    return records

# Connection via environment variable
# AIRFLOW_CONN_MY_POSTGRES='postgresql://user:password@host:5432/database'
```

### Creating Connections Programmatically

```python
from airflow.models import Connection
from airflow import settings

def create_connection():
    session = settings.Session()

    # Check if connection exists
    existing = session.query(Connection).filter(
        Connection.conn_id == 'my_new_connection'
    ).first()

    if existing:
        session.delete(existing)

    # Create new connection
    new_conn = Connection(
        conn_id='my_new_connection',
        conn_type='postgres',
        host='localhost',
        schema='my_database',
        login='user',
        password='password',
        port=5432,
        extra='{"sslmode": "require"}'
    )

    session.add(new_conn)
    session.commit()
    session.close()
```

### Variables

Variables are key-value pairs for storing configuration that can change.

```python
from airflow.models import Variable

# Get a variable
api_key = Variable.get('api_key')

# Get with default value
env = Variable.get('environment', default_var='development')

# Get JSON variable
config = Variable.get('pipeline_config', deserialize_json=True)
# Returns: {'batch_size': 1000, 'retry_count': 3}

# Set a variable
Variable.set('last_run_date', '2024-01-15')

# Set JSON variable
Variable.set(
    'pipeline_config',
    {'batch_size': 1000, 'retry_count': 3},
    serialize_json=True
)

# Delete a variable
Variable.delete('temp_variable')
```

### Variables in Templates

```python
# Using variables in templates
task = BashOperator(
    task_id='use_variable',
    bash_command='echo "Environment: {{ var.value.environment }}"',
    dag=dag,
)

# JSON variable in template
task = BashOperator(
    task_id='use_json_variable',
    bash_command='echo "Batch size: {{ var.json.pipeline_config.batch_size }}"',
    dag=dag,
)

# With secrets backend
task = BashOperator(
    task_id='use_secret',
    bash_command='curl -H "Authorization: {{ var.value.api_key }}" https://api.example.com',
    dag=dag,
)
```

### Best Practices for Secrets

```python
# Use secrets backend instead of storing in metadata DB
# Configure in airflow.cfg or environment variables:

# AWS Secrets Manager
# AIRFLOW__SECRETS__BACKEND=airflow.providers.amazon.aws.secrets.secrets_manager.SecretsManagerBackend
# AIRFLOW__SECRETS__BACKEND_KWARGS={"connections_prefix": "airflow/connections", "variables_prefix": "airflow/variables"}

# HashiCorp Vault
# AIRFLOW__SECRETS__BACKEND=airflow.providers.hashicorp.secrets.vault.VaultBackend
# AIRFLOW__SECRETS__BACKEND_KWARGS={"url": "http://vault:8200", "token": "token"}

# Environment variables for connections (development)
# AIRFLOW_CONN_MY_DB='postgresql://user:pass@host/db'

# Never log secrets
def safe_log_connection(conn_id: str):
    conn = BaseHook.get_connection(conn_id)
    print(f"Connected to {conn.host}:{conn.port}/{conn.schema}")
    # DON'T: print(f"Password: {conn.password}")
```

---

## XCom (Cross-Communication)

XCom allows tasks to exchange small amounts of data.

### Basic XCom Usage

```python
from airflow.operators.python import PythonOperator

def push_data(**context):
    """Push data to XCom"""
    # Method 1: Return value (auto-pushed with key 'return_value')
    return {'processed_count': 100, 'status': 'success'}

def push_explicit(**context):
    """Explicitly push to XCom"""
    ti = context['ti']

    # Push multiple values
    ti.xcom_push(key='file_path', value='/data/output.csv')
    ti.xcom_push(key='row_count', value=1000)
    ti.xcom_push(key='metadata', value={'source': 'api', 'version': 2})

def pull_data(**context):
    """Pull data from XCom"""
    ti = context['ti']

    # Pull return value from another task
    result = ti.xcom_pull(task_ids='push_data')
    print(f"Received: {result}")

    # Pull specific key
    file_path = ti.xcom_pull(task_ids='push_explicit', key='file_path')
    row_count = ti.xcom_pull(task_ids='push_explicit', key='row_count')

    # Pull from multiple tasks
    all_results = ti.xcom_pull(task_ids=['task1', 'task2', 'task3'])

push_task = PythonOperator(
    task_id='push_data',
    python_callable=push_data,
    dag=dag,
)

pull_task = PythonOperator(
    task_id='pull_data',
    python_callable=pull_data,
    dag=dag,
)

push_task >> pull_task
```

### XCom in Templates

```python
# Using XCom in Jinja templates
task = BashOperator(
    task_id='use_xcom',
    bash_command="""
        echo "File: {{ ti.xcom_pull(task_ids='extract_task', key='file_path') }}"
        echo "Count: {{ ti.xcom_pull(task_ids='extract_task', key='row_count') }}"
    """,
    dag=dag,
)

# PostgresOperator with XCom
sql_task = PostgresOperator(
    task_id='insert_with_xcom',
    postgres_conn_id='my_postgres',
    sql="""
        INSERT INTO processing_log (file_path, row_count, process_date)
        VALUES (
            '{{ ti.xcom_pull(task_ids="extract", key="file_path") }}',
            {{ ti.xcom_pull(task_ids="extract", key="row_count") }},
            '{{ ds }}'
        )
    """,
    dag=dag,
)
```

### XCom with TaskFlow API

```python
from airflow.decorators import dag, task

@dag(schedule_interval='@daily', start_date=datetime(2024, 1, 1))
def xcom_taskflow_example():

    @task()
    def extract() -> dict:
        """Data is automatically pushed to XCom"""
        return {
            'data': [1, 2, 3, 4, 5],
            'source': 'api'
        }

    @task()
    def transform(extracted_data: dict) -> list:
        """Receives XCom from extract automatically"""
        return [x * 2 for x in extracted_data['data']]

    @task()
    def load(transformed_data: list) -> None:
        """Receives XCom from transform automatically"""
        print(f"Loading {len(transformed_data)} records")

    # TaskFlow handles XCom automatically
    raw = extract()
    processed = transform(raw)
    load(processed)

dag = xcom_taskflow_example()
```

### XCom Best Practices

```python
# DO: Use XCom for small metadata
def good_xcom_usage(**context):
    context['ti'].xcom_push(key='file_path', value='s3://bucket/file.parquet')
    context['ti'].xcom_push(key='row_count', value=10000)
    context['ti'].xcom_push(key='status', value='success')

# DON'T: Use XCom for large data (default max is 48KB in MySQL, larger in Postgres)
def bad_xcom_usage(**context):
    import pandas as pd
    df = pd.read_csv('large_file.csv')
    context['ti'].xcom_push(key='data', value=df.to_dict())  # BAD!

# INSTEAD: Store data in external storage and pass reference
def better_approach(**context):
    import pandas as pd

    df = pd.read_csv('large_file.csv')
    output_path = f"s3://bucket/processed/{context['ds']}/data.parquet"
    df.to_parquet(output_path)

    context['ti'].xcom_push(key='output_path', value=output_path)

# Custom XCom Backend for large data (Airflow 2.0+)
# Configure: AIRFLOW__CORE__XCOM_BACKEND=my_module.S3XComBackend
```

---

## Task Dependencies

### Basic Dependencies

```python
from airflow.operators.empty import EmptyOperator

# Create tasks
start = EmptyOperator(task_id='start', dag=dag)
extract = EmptyOperator(task_id='extract', dag=dag)
transform = EmptyOperator(task_id='transform', dag=dag)
load = EmptyOperator(task_id='load', dag=dag)
end = EmptyOperator(task_id='end', dag=dag)

# Method 1: Bitshift operators
start >> extract >> transform >> load >> end

# Method 2: set_downstream / set_upstream
start.set_downstream(extract)
extract.set_upstream(start)

# Method 3: Chain multiple tasks
from airflow.models.baseoperator import chain
chain(start, extract, transform, load, end)

# Parallel tasks
#         -> task_a ->
# start ->            -> end
#         -> task_b ->

task_a = EmptyOperator(task_id='task_a', dag=dag)
task_b = EmptyOperator(task_id='task_b', dag=dag)

start >> [task_a, task_b] >> end

# Complex dependencies
#         -> b ->
# a ->            -> d -> e
#         -> c ->

a >> [b, c] >> d >> e

# Or using chain with cross_downstream
from airflow.models.baseoperator import chain, cross_downstream

chain(a, [b, c], d, e)  # Same result
```

### TaskGroups

```python
from airflow.utils.task_group import TaskGroup

with DAG('taskgroup_example', ...) as dag:

    start = EmptyOperator(task_id='start')

    # Group related tasks
    with TaskGroup('extract_sources') as extract_group:
        extract_db = PythonOperator(
            task_id='extract_db',
            python_callable=extract_from_db,
        )
        extract_api = PythonOperator(
            task_id='extract_api',
            python_callable=extract_from_api,
        )
        extract_files = PythonOperator(
            task_id='extract_files',
            python_callable=extract_from_files,
        )

    with TaskGroup('transform') as transform_group:
        clean = PythonOperator(
            task_id='clean_data',
            python_callable=clean_data,
        )
        aggregate = PythonOperator(
            task_id='aggregate_data',
            python_callable=aggregate_data,
        )
        clean >> aggregate

    with TaskGroup('load_destinations') as load_group:
        load_warehouse = PythonOperator(
            task_id='load_warehouse',
            python_callable=load_to_warehouse,
        )
        load_cache = PythonOperator(
            task_id='load_cache',
            python_callable=load_to_cache,
        )

    end = EmptyOperator(task_id='end')

    # Connect groups
    start >> extract_group >> transform_group >> load_group >> end
```

### Trigger Rules

```python
from airflow.utils.trigger_rule import TriggerRule

# all_success (default): All upstream tasks succeed
task1 = EmptyOperator(
    task_id='task1',
    trigger_rule=TriggerRule.ALL_SUCCESS,
    dag=dag,
)

# all_failed: All upstream tasks fail
cleanup_on_failure = EmptyOperator(
    task_id='cleanup_on_failure',
    trigger_rule=TriggerRule.ALL_FAILED,
    dag=dag,
)

# one_success: At least one upstream succeeds
proceed_if_any_success = EmptyOperator(
    task_id='proceed_if_any_success',
    trigger_rule=TriggerRule.ONE_SUCCESS,
    dag=dag,
)

# one_failed: At least one upstream fails
alert_on_any_failure = EmptyOperator(
    task_id='alert_on_any_failure',
    trigger_rule=TriggerRule.ONE_FAILED,
    dag=dag,
)

# all_done: All upstream tasks complete (success, fail, or skip)
always_run = EmptyOperator(
    task_id='always_run',
    trigger_rule=TriggerRule.ALL_DONE,
    dag=dag,
)

# none_failed: No upstream task failed (success or skipped allowed)
proceed_unless_failure = EmptyOperator(
    task_id='proceed_unless_failure',
    trigger_rule=TriggerRule.NONE_FAILED,
    dag=dag,
)

# none_skipped: No upstream task was skipped
require_all_executed = EmptyOperator(
    task_id='require_all_executed',
    trigger_rule=TriggerRule.NONE_SKIPPED,
    dag=dag,
)
```

### Branching

```python
from airflow.operators.python import BranchPythonOperator
from airflow.operators.empty import EmptyOperator

def decide_branch(**context):
    """Return task_id to execute next"""
    value = context['ti'].xcom_pull(task_ids='get_data')

    if value > 100:
        return 'high_value_path'
    elif value > 50:
        return 'medium_value_path'
    else:
        return 'low_value_path'

branch = BranchPythonOperator(
    task_id='branch_decision',
    python_callable=decide_branch,
    dag=dag,
)

high_path = EmptyOperator(task_id='high_value_path', dag=dag)
medium_path = EmptyOperator(task_id='medium_value_path', dag=dag)
low_path = EmptyOperator(task_id='low_value_path', dag=dag)

# Join paths (requires trigger_rule)
join = EmptyOperator(
    task_id='join',
    trigger_rule=TriggerRule.NONE_FAILED_MIN_ONE_SUCCESS,
    dag=dag,
)

branch >> [high_path, medium_path, low_path] >> join
```

### Dynamic Task Mapping

```python
from airflow.decorators import dag, task

@dag(schedule_interval='@daily', start_date=datetime(2024, 1, 1))
def dynamic_task_mapping():

    @task
    def get_files() -> list:
        """Get list of files to process"""
        return ['file1.csv', 'file2.csv', 'file3.csv', 'file4.csv']

    @task
    def process_file(filename: str) -> dict:
        """Process a single file - this will be mapped"""
        print(f"Processing {filename}")
        return {'file': filename, 'rows': 100}

    @task
    def summarize(results: list) -> None:
        """Aggregate all results"""
        total_rows = sum(r['rows'] for r in results)
        print(f"Total rows processed: {total_rows}")

    files = get_files()

    # Dynamic task mapping - creates tasks at runtime
    processed = process_file.expand(filename=files)

    summarize(processed)

dag = dynamic_task_mapping()
```

---

## Scheduling

### Schedule Interval Options

```python
from airflow import DAG
from datetime import datetime, timedelta

# Cron expressions
dag = DAG(
    dag_id='cron_examples',
    schedule_interval='0 6 * * *',  # Daily at 6 AM
    # schedule_interval='0 */4 * * *',  # Every 4 hours
    # schedule_interval='0 0 * * 0',  # Weekly on Sunday midnight
    # schedule_interval='0 0 1 * *',  # Monthly on first day
    # schedule_interval='30 14 * * 1-5',  # Weekdays at 2:30 PM
    start_date=datetime(2024, 1, 1),
)

# Preset schedules
dag = DAG(
    dag_id='preset_examples',
    schedule_interval='@daily',  # Midnight daily
    # schedule_interval='@hourly',  # Every hour at minute 0
    # schedule_interval='@weekly',  # Sunday midnight
    # schedule_interval='@monthly',  # First of month midnight
    # schedule_interval='@yearly',  # January 1st midnight
    # schedule_interval='@once',  # Run only once
    start_date=datetime(2024, 1, 1),
)

# timedelta for interval-based scheduling
dag = DAG(
    dag_id='timedelta_example',
    schedule_interval=timedelta(hours=6),  # Every 6 hours
    start_date=datetime(2024, 1, 1),
)

# No schedule (triggered externally only)
dag = DAG(
    dag_id='manual_trigger_only',
    schedule_interval=None,
    start_date=datetime(2024, 1, 1),
)
```

### Data Interval Concept

```python
"""
Airflow 2.0+ uses data intervals for scheduling.

For a DAG with:
- schedule_interval='@daily'
- start_date=2024-01-01

The FIRST run will be:
- logical_date (execution_date): 2024-01-01
- data_interval_start: 2024-01-01 00:00:00
- data_interval_end: 2024-01-02 00:00:00
- Scheduled to run: 2024-01-02 00:00:00 (after data interval ends)

This means the DAG runs AFTER the data interval has passed,
processing data FROM that interval.
"""

def demonstrate_intervals(**context):
    print(f"Logical Date: {context['logical_date']}")
    print(f"Data Interval Start: {context['data_interval_start']}")
    print(f"Data Interval End: {context['data_interval_end']}")
    print(f"ds (date string): {context['ds']}")
    print(f"ds_nodash: {context['ds_nodash']}")

# Template variables
task = BashOperator(
    task_id='show_dates',
    bash_command="""
        echo "Logical Date: {{ ds }}"
        echo "Previous Date: {{ prev_ds }}"
        echo "Next Date: {{ next_ds }}"
        echo "Data Interval Start: {{ data_interval_start }}"
        echo "Data Interval End: {{ data_interval_end }}"
    """,
    dag=dag,
)
```

### Timetables (Airflow 2.2+)

```python
from airflow.timetables.base import DagRunInfo, DataInterval, TimeRestriction, Timetable
from pendulum import DateTime, Duration

class BusinessDaysTimetable(Timetable):
    """Custom timetable for business days only"""

    def infer_manual_data_interval(self, run_after: DateTime) -> DataInterval:
        """Handle manually triggered runs"""
        return DataInterval(
            start=run_after.subtract(days=1),
            end=run_after
        )

    def next_dagrun_info(
        self,
        *,
        last_automated_data_interval: DataInterval | None,
        restriction: TimeRestriction,
    ) -> DagRunInfo | None:
        if last_automated_data_interval is None:
            next_start = restriction.earliest
        else:
            next_start = last_automated_data_interval.end

        # Skip weekends
        while next_start.weekday() >= 5:  # Saturday=5, Sunday=6
            next_start = next_start.add(days=1)

        if restriction.latest is not None and next_start > restriction.latest:
            return None

        return DagRunInfo.interval(
            start=next_start,
            end=next_start.add(days=1),
        )

# Usage
dag = DAG(
    dag_id='business_days_only',
    timetable=BusinessDaysTimetable(),
    start_date=datetime(2024, 1, 1),
)
```

### Catchup and Backfill

```python
# Catchup: automatically run missed DAG runs
dag = DAG(
    dag_id='with_catchup',
    schedule_interval='@daily',
    start_date=datetime(2024, 1, 1),
    catchup=True,  # Will run all missed days since start_date
)

# Without catchup
dag = DAG(
    dag_id='without_catchup',
    schedule_interval='@daily',
    start_date=datetime(2024, 1, 1),
    catchup=False,  # Only run from current date forward
)

# Manual backfill via CLI
# airflow dags backfill -s 2024-01-01 -e 2024-01-31 my_dag

# Limit active runs to prevent overwhelming system during catchup
dag = DAG(
    dag_id='safe_catchup',
    schedule_interval='@daily',
    start_date=datetime(2024, 1, 1),
    catchup=True,
    max_active_runs=3,  # Only 3 runs at a time
)
```

---

## Best Practices

### DAG Design Principles

```python
"""
1. Keep DAGs Simple and Focused
   - One DAG should represent one workflow
   - Avoid mega-DAGs with hundreds of tasks
   - Split complex workflows into multiple DAGs
"""

# BAD: One DAG doing everything
dag = DAG(dag_id='do_everything', ...)  # 200+ tasks

# GOOD: Separate DAGs for different concerns
etl_dag = DAG(dag_id='etl_pipeline', ...)
ml_dag = DAG(dag_id='ml_training', ...)
reporting_dag = DAG(dag_id='reporting', ...)

"""
2. Make Tasks Idempotent
   - Running a task multiple times should produce the same result
   - Use UPSERT instead of INSERT
   - Delete then insert for atomic updates
"""

def idempotent_load(**context):
    """Idempotent data load"""
    execution_date = context['ds']

    # Delete existing data for this date
    delete_sql = f"DELETE FROM target WHERE date = '{execution_date}'"
    execute(delete_sql)

    # Insert new data
    insert_sql = f"INSERT INTO target SELECT * FROM staging WHERE date = '{execution_date}'"
    execute(insert_sql)

"""
3. Use Atomic Transactions
   - Wrap related operations in transactions
   - All-or-nothing execution
"""

def atomic_operation(**context):
    with database.begin() as transaction:
        try:
            step1()
            step2()
            step3()
            transaction.commit()
        except Exception:
            transaction.rollback()
            raise

"""
4. Avoid Top-Level Code in DAG Files
   - DAG files are parsed frequently by scheduler
   - Heavy operations slow down parsing
"""

# BAD: Heavy operation at module level
import pandas as pd
data = pd.read_csv('large_file.csv')  # Runs every time file is parsed

def process():
    return data.process()

# GOOD: Heavy operations inside task
def process(**context):
    import pandas as pd
    data = pd.read_csv('large_file.csv')
    return data.process()
```

### Testing DAGs

```python
import pytest
from datetime import datetime
from airflow.models import DagBag

class TestDagIntegrity:
    """Test DAG file integrity"""

    def test_dag_import(self):
        """Test that all DAGs can be imported without errors"""
        dagbag = DagBag(include_examples=False)

        assert len(dagbag.import_errors) == 0, \
            f"DAG import errors: {dagbag.import_errors}"

    def test_dag_has_tasks(self):
        """Test that DAGs have at least one task"""
        dagbag = DagBag(include_examples=False)

        for dag_id, dag in dagbag.dags.items():
            assert len(dag.tasks) > 0, f"DAG {dag_id} has no tasks"

    def test_dag_has_no_cycles(self):
        """Test that DAGs don't have cycles"""
        dagbag = DagBag(include_examples=False)

        for dag_id, dag in dagbag.dags.items():
            # Airflow automatically checks for cycles during parsing
            # This test passes if we got here
            assert dag.is_valid()


class TestDagTasks:
    """Test individual task logic"""

    def test_extract_function(self):
        """Test extract function"""
        from dags.my_dag import extract_data

        result = extract_data(ds='2024-01-15')

        assert result is not None
        assert 'file_path' in result

    def test_transform_function(self):
        """Test transform function"""
        from dags.my_dag import transform_data

        input_data = {'value': 100}
        result = transform_data(input_data)

        assert result['value'] == 110  # 10% increase


class TestDagExecution:
    """Test DAG execution"""

    @pytest.fixture
    def dag(self):
        from dags.my_dag import dag
        return dag

    def test_dag_runs(self, dag):
        """Test that DAG can run"""
        dag.test(execution_date=datetime(2024, 1, 15))
```

### Error Handling and Alerting

```python
from airflow.operators.python import PythonOperator
from airflow.providers.slack.operators.slack import SlackAPIPostOperator

def on_failure_callback(context):
    """Callback when task fails"""
    task_instance = context['task_instance']
    dag_id = context['dag'].dag_id
    task_id = task_instance.task_id
    exception = context.get('exception')

    # Send Slack alert
    message = f"""
    :red_circle: *Task Failed*
    - DAG: `{dag_id}`
    - Task: `{task_id}`
    - Execution Date: {context['ds']}
    - Error: {str(exception)[:500]}
    """

    # Send to Slack
    SlackAPIPostOperator(
        task_id='slack_alert',
        channel='#alerts',
        text=message,
        slack_conn_id='slack_default',
    ).execute(context)

def on_success_callback(context):
    """Callback when task succeeds"""
    # Log success, update metrics, etc.
    pass

def on_retry_callback(context):
    """Callback when task retries"""
    task_instance = context['task_instance']
    try_number = task_instance.try_number

    if try_number >= 2:
        # Alert on multiple retries
        pass

# Apply callbacks
task = PythonOperator(
    task_id='important_task',
    python_callable=my_function,
    on_failure_callback=on_failure_callback,
    on_success_callback=on_success_callback,
    on_retry_callback=on_retry_callback,
    dag=dag,
)

# DAG-level callbacks
dag = DAG(
    dag_id='monitored_dag',
    default_args={
        'on_failure_callback': on_failure_callback,
        'retries': 3,
        'retry_delay': timedelta(minutes=5),
    },
    on_success_callback=dag_success_callback,
    on_failure_callback=dag_failure_callback,
)
```

### Performance Optimization

```python
"""
1. Use Efficient Operators
   - Prefer provider operators over generic Python operators
   - Use batch operations when possible
"""

# BAD: Process one record at a time
def process_records(**context):
    for record in get_all_records():
        process(record)

# GOOD: Batch processing
def process_records_batch(**context):
    records = get_all_records()
    process_batch(records)  # Single database call, bulk insert

"""
2. Optimize DAG Parsing
   - Minimize imports at top level
   - Use lazy loading
"""

# BAD: Heavy imports at module level
import tensorflow as tf
import pytorch
import large_library

# GOOD: Import inside tasks
def train_model(**context):
    import tensorflow as tf
    # Now it only loads when task runs

"""
3. Right-size Resources
"""

# Configure resources per task
task = PythonOperator(
    task_id='heavy_task',
    python_callable=heavy_function,
    pool='heavy_processing_pool',  # Use task pools
    queue='high_memory',  # Route to specific queue
    executor_config={
        'KubernetesExecutor': {
            'request_memory': '4Gi',
            'request_cpu': '2',
            'limit_memory': '8Gi',
            'limit_cpu': '4',
        }
    },
    dag=dag,
)

"""
4. Use Pools for Resource Management
"""

# Create pools via UI or API
# Or in airflow.cfg: pools = my_pool:10:Description

task = PythonOperator(
    task_id='db_task',
    python_callable=db_operation,
    pool='database_connections',  # Limit concurrent DB tasks
    pool_slots=2,  # This task uses 2 slots
    dag=dag,
)

"""
5. Smart Caching and State Management
"""

from airflow.models import Variable

def expensive_operation(**context):
    cache_key = f"result_{context['ds']}"

    # Check cache first
    cached = Variable.get(cache_key, default_var=None, deserialize_json=True)
    if cached:
        return cached

    # Compute and cache
    result = compute_expensive_result()
    Variable.set(cache_key, result, serialize_json=True)

    return result
```

### Project Structure

```
airflow_project/
|-- dags/
|   |-- __init__.py
|   |-- etl/
|   |   |-- __init__.py
|   |   |-- sales_etl.py
|   |   |-- customer_etl.py
|   |   +-- inventory_etl.py
|   |-- ml/
|   |   |-- __init__.py
|   |   |-- training_pipeline.py
|   |   +-- inference_pipeline.py
|   +-- reporting/
|       |-- __init__.py
|       +-- daily_reports.py
|
|-- plugins/
|   |-- __init__.py
|   |-- operators/
|   |   |-- __init__.py
|   |   +-- custom_operators.py
|   |-- hooks/
|   |   |-- __init__.py
|   |   +-- custom_hooks.py
|   +-- sensors/
|       |-- __init__.py
|       +-- custom_sensors.py
|
|-- include/
|   |-- sql/
|   |   |-- extract/
|   |   |-- transform/
|   |   +-- load/
|   +-- config/
|       |-- dev.yaml
|       |-- staging.yaml
|       +-- prod.yaml
|
|-- tests/
|   |-- dags/
|   |   +-- test_dag_integrity.py
|   +-- plugins/
|       +-- test_operators.py
|
|-- docker-compose.yaml
|-- requirements.txt
|-- airflow.cfg
+-- README.md
```

---

## Common Patterns

### ETL Pipeline Pattern

```python
from airflow.decorators import dag, task
from airflow.utils.task_group import TaskGroup
from datetime import datetime, timedelta

@dag(
    dag_id='etl_pipeline_pattern',
    schedule_interval='0 6 * * *',
    start_date=datetime(2024, 1, 1),
    catchup=False,
    default_args={'retries': 2, 'retry_delay': timedelta(minutes=5)},
    tags=['etl', 'production'],
)
def etl_pipeline():

    @task()
    def check_source_availability():
        """Verify source systems are available"""
        # Check database connections, API health, etc.
        return True

    @task()
    def extract_from_database() -> str:
        """Extract data from primary database"""
        # Extract logic
        return 's3://bucket/raw/db/{{ ds }}/'

    @task()
    def extract_from_api() -> str:
        """Extract data from REST API"""
        # API extraction logic
        return 's3://bucket/raw/api/{{ ds }}/'

    @task()
    def validate_extracted_data(paths: list) -> dict:
        """Validate extracted data quality"""
        # Data validation logic
        return {'valid': True, 'paths': paths}

    @task()
    def transform_data(validation_result: dict) -> str:
        """Apply business transformations"""
        if not validation_result['valid']:
            raise ValueError("Data validation failed")
        # Transformation logic
        return 's3://bucket/transformed/{{ ds }}/'

    @task()
    def load_to_warehouse(transformed_path: str) -> int:
        """Load data to data warehouse"""
        # Load logic
        return 10000  # Row count

    @task()
    def update_data_catalog(row_count: int):
        """Update data catalog with metadata"""
        # Catalog update logic
        pass

    @task()
    def send_completion_notification(row_count: int):
        """Send pipeline completion notification"""
        # Notification logic
        pass

    # Define workflow
    check = check_source_availability()

    # Parallel extraction
    db_data = extract_from_database()
    api_data = extract_from_api()

    # Validate extracted data
    validation = validate_extracted_data([db_data, api_data])

    # Transform
    transformed = transform_data(validation)

    # Load
    rows = load_to_warehouse(transformed)

    # Post-load tasks (parallel)
    update_data_catalog(rows)
    send_completion_notification(rows)

    # Set dependencies
    check >> [db_data, api_data]

dag = etl_pipeline()
```

### Retry Pattern with Dead Letter Queue

```python
from airflow.decorators import dag, task
from airflow.operators.python import BranchPythonOperator
from datetime import datetime

@dag(
    dag_id='retry_with_dlq',
    schedule_interval='@hourly',
    start_date=datetime(2024, 1, 1),
    catchup=False,
)
def retry_with_dlq():

    @task()
    def get_messages() -> list:
        """Get messages to process"""
        return [{'id': 1}, {'id': 2}, {'id': 3}]

    @task()
    def process_message(message: dict) -> dict:
        """Process a single message"""
        try:
            # Processing logic that might fail
            result = process(message)
            return {'status': 'success', 'message': message, 'result': result}
        except Exception as e:
            return {'status': 'failed', 'message': message, 'error': str(e)}

    @task()
    def handle_results(results: list) -> tuple:
        """Separate successes from failures"""
        successes = [r for r in results if r['status'] == 'success']
        failures = [r for r in results if r['status'] == 'failed']
        return successes, failures

    @task()
    def commit_successes(successes: list):
        """Commit successful processing"""
        for s in successes:
            commit(s)

    @task()
    def send_to_dlq(failures: list):
        """Send failed messages to dead letter queue"""
        for f in failures:
            send_to_dead_letter_queue(f)

    messages = get_messages()
    processed = process_message.expand(message=messages)
    successes, failures = handle_results(processed)

    commit_successes(successes)
    send_to_dlq(failures)

dag = retry_with_dlq()
```

---

## Monitoring and Observability

### Logging Best Practices

```python
import logging
from airflow.operators.python import PythonOperator

def task_with_logging(**context):
    """Task demonstrating logging best practices"""
    logger = logging.getLogger(__name__)

    # Use context in log messages
    execution_date = context['ds']
    task_id = context['task'].task_id

    logger.info(f"Starting {task_id} for {execution_date}")

    try:
        records = fetch_data()
        logger.info(f"Fetched {len(records)} records")

        processed = process_data(records)
        logger.info(f"Processed {len(processed)} records successfully")

        return processed

    except Exception as e:
        logger.error(f"Task failed: {str(e)}", exc_info=True)
        raise

# Configure logging in airflow.cfg or environment
# AIRFLOW__LOGGING__REMOTE_LOGGING=True
# AIRFLOW__LOGGING__REMOTE_BASE_LOG_FOLDER=s3://my-bucket/logs
```

### Metrics and Monitoring

```python
from airflow.operators.python import PythonOperator
import statsd

# StatsD integration for metrics
client = statsd.StatsClient('statsd-host', 8125)

def monitored_task(**context):
    """Task with metrics collection"""
    dag_id = context['dag'].dag_id
    task_id = context['task'].task_id

    with client.timer(f'airflow.{dag_id}.{task_id}.duration'):
        try:
            result = process_data()

            # Record success metrics
            client.incr(f'airflow.{dag_id}.{task_id}.success')
            client.gauge(f'airflow.{dag_id}.{task_id}.rows', result['row_count'])

            return result

        except Exception as e:
            client.incr(f'airflow.{dag_id}.{task_id}.failure')
            raise

# Health check endpoint
def dag_health_check(**context):
    """Check DAG health and alert on issues"""
    from airflow.models import DagRun
    from airflow import settings

    session = settings.Session()

    # Check for stuck DAG runs
    stuck_runs = session.query(DagRun).filter(
        DagRun.state == 'running',
        DagRun.start_date < datetime.now() - timedelta(hours=6)
    ).all()

    if stuck_runs:
        send_alert(f"Found {len(stuck_runs)} stuck DAG runs")

    session.close()
```

---

## Further Reading

### Official Resources

- [Apache Airflow Documentation](https://airflow.apache.org/docs/) - Official documentation
- [Airflow GitHub Repository](https://github.com/apache/airflow) - Source code and examples
- [Airflow Provider Packages](https://airflow.apache.org/docs/apache-airflow-providers/) - Available providers

### Recommended Books

- **"Data Pipelines with Apache Airflow"** - Bas Harenslak, Julian de Ruiter (Manning)
- **"Fundamentals of Data Engineering"** - Joe Reis, Matt Housley (O'Reilly)

### Online Courses

- [Astronomer Academy](https://academy.astronomer.io/) - Free Airflow courses
- [Apache Airflow Fundamentals](https://www.udemy.com/course/the-complete-hands-on-course-to-master-apache-airflow/) - Udemy course

### Community Resources

- [Airflow Slack](https://apache-airflow.slack.com/) - Community Slack workspace
- [Stack Overflow](https://stackoverflow.com/questions/tagged/airflow) - Q&A tagged with Airflow
- [Astronomer Blog](https://www.astronomer.io/blog/) - Best practices and tutorials

### Related Tools

- **Dagster** - Alternative workflow orchestrator with software-defined assets
- **Prefect** - Python-native workflow orchestration
- **Luigi** - Spotify's batch pipeline framework
- **dbt** - Transform layer for data warehouses
- **Great Expectations** - Data validation framework

---

> **Summary**: Apache Airflow is a powerful workflow orchestration platform that has become the industry standard for scheduling and monitoring data pipelines. Understanding its architecture, mastering DAG design, and following best practices for operators, sensors, connections, and XCom will enable you to build robust, maintainable, and scalable data workflows. Start simple, test thoroughly, and gradually adopt advanced patterns as your needs grow.
