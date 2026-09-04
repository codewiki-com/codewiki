---
title: ETL 与数据管道
description: 掌握ETL流程设计和数据管道构建，实现高效数据集成
track: data
section: data-engineering
difficulty: advanced
tags:
  - ETL
  - 数据管道
  - Airflow
  - dbt
status: imported
origin: old/src/content/docs/data/etl.zh.md
divergence: 0.203
issues: []
legacy:
  category: Data
  subcategory: Engineering
  order: 6
  lastUpdated: 2026-01-07
---

在现代数据驱动的企业中，数据从多个来源流入，需要经过清洗、转换后才能用于分析和决策。ETL（Extract, Transform, Load）和数据管道是实现这一目标的核心技术。本文将深入探讨 ETL 的核心概念、设计原则，以及如何使用 Apache Airflow 和 dbt 构建生产级数据管道。

## ETL vs ELT 概念

### 什么是 ETL？

ETL 是 **Extract（抽取）、Transform（转换）、Load（加载）** 的缩写，描述了数据集成的三个核心步骤：

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Extract   │────▶│  Transform  │────▶│    Load     │
│   数据抽取   │     │   数据转换   │     │   数据加载   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                    │                   │
      ▼                    ▼                   ▼
 从源系统提取        清洗、聚合、        写入目标数据仓库
 原始数据           标准化处理           或数据湖
```

**ETL 各阶段详解**：

1. **Extract（抽取）**：从各种数据源提取数据，包括数据库、API、文件、消息队列等
2. **Transform（转换）**：在中间层对数据进行清洗、验证、聚合、标准化等处理
3. **Load（加载）**：将处理后的数据加载到目标存储系统

### 什么是 ELT？

ELT 是 **Extract（抽取）、Load（加载）、Transform（转换）** 的缩写，与 ETL 的主要区别在于转换发生在数据加载之后：

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Extract   │────▶│    Load     │────▶│  Transform  │
│   数据抽取   │     │   数据加载   │     │   数据转换   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                    │                   │
      ▼                    ▼                   ▼
 从源系统提取        先加载原始数据      在数据仓库内部
 原始数据           到数据仓库          完成转换
```

### ETL vs ELT 对比

| 维度 | ETL | ELT |
|------|-----|-----|
| 转换位置 | 中间处理层（ETL 工具） | 目标数据仓库内部 |
| 适用场景 | 传统数据仓库、数据量较小 | 云数据仓库、大数据场景 |
| 性能瓶颈 | ETL 服务器计算能力 | 数据仓库计算能力 |
| 数据保留 | 通常只保留转换后数据 | 保留原始数据，支持重新转换 |
| 典型工具 | Informatica, Talend, SSIS | dbt, Snowflake, BigQuery |
| 灵活性 | 较低，需要预定义转换逻辑 | 较高，可随时修改转换逻辑 |

### 选择建议

```python
# 决策树伪代码
def choose_approach(scenario):
    if scenario.cloud_data_warehouse:
        if scenario.need_raw_data_retention:
            return "ELT"
        if scenario.transformation_complexity == "high":
            return "ELT"  # 利用云数据仓库的计算能力

    if scenario.data_volume == "small":
        return "ETL"  # 传统方式足够

    if scenario.real_time_requirement:
        return "Streaming ETL"  # 考虑流式处理

    return "ELT"  # 现代数据栈的默认选择
```

---

## 数据管道设计原则

### 核心设计原则

#### 幂等性（Idempotency）

幂等性确保同一操作执行多次的结果与执行一次相同，这对于故障恢复至关重要。

```python
# 非幂等操作（错误示例）
def append_data(df, target_table):
    df.to_sql(target_table, engine, if_exists='append')
    # 重复执行会产生重复数据

# 幂等操作（正确示例）
def upsert_data(df, target_table, key_columns):
    """使用 UPSERT 实现幂等写入"""
    temp_table = f"{target_table}_staging"

    # 1. 写入临时表
    df.to_sql(temp_table, engine, if_exists='replace')

    # 2. 执行 UPSERT（以 PostgreSQL 为例）
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

#### 原子性（Atomicity）

确保数据管道的每个步骤要么完全成功，要么完全失败回滚。

```python
from contextlib import contextmanager

@contextmanager
def atomic_pipeline(engine):
    """原子性事务上下文管理器"""
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

# 使用示例
def run_atomic_etl():
    with atomic_pipeline(engine) as conn:
        # 所有操作在同一事务中
        conn.execute("DELETE FROM target_table WHERE date = '2024-01-15'")
        conn.execute("INSERT INTO target_table SELECT * FROM staging")
        conn.execute("UPDATE metadata SET last_run = NOW()")
        # 如果任何一步失败，所有操作都会回滚
```

#### 可观测性（Observability）

```python
import logging
from datetime import datetime
from dataclasses import dataclass
from typing import Optional

@dataclass
class PipelineMetrics:
    """管道运行指标"""
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
    """管道日志记录器"""

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

#### 数据血缘追踪

```python
class DataLineage:
    """数据血缘追踪"""

    def __init__(self):
        self.lineage_graph = {}

    def register_source(self, source_id: str, metadata: dict):
        """注册数据源"""
        self.lineage_graph[source_id] = {
            "type": "source",
            "metadata": metadata,
            "downstream": []
        }

    def register_transformation(self, transform_id: str,
                                inputs: list, output: str,
                                logic_description: str):
        """注册转换操作"""
        self.lineage_graph[transform_id] = {
            "type": "transformation",
            "inputs": inputs,
            "output": output,
            "logic": logic_description,
            "downstream": []
        }
        # 更新上游节点的下游引用
        for input_id in inputs:
            if input_id in self.lineage_graph:
                self.lineage_graph[input_id]["downstream"].append(transform_id)

    def get_upstream(self, node_id: str) -> list:
        """获取上游依赖"""
        node = self.lineage_graph.get(node_id, {})
        if node.get("type") == "transformation":
            return node.get("inputs", [])
        return []

    def get_downstream(self, node_id: str) -> list:
        """获取下游影响"""
        node = self.lineage_graph.get(node_id, {})
        return node.get("downstream", [])
```

---

## Apache Airflow 详解

Apache Airflow 是目前最流行的工作流编排工具，它使用 Python 代码定义数据管道（DAG）。

### 核心概念

```
┌─────────────────────────────────────────────────────────┐
│                      Airflow 架构                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │   DAG    │  │   DAG    │  │   DAG    │   DAGs       │
│  │ (Python) │  │ (Python) │  │ (Python) │              │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘              │
│       │             │             │                     │
│       ▼             ▼             ▼                     │
│  ┌─────────────────────────────────────┐               │
│  │           Scheduler                  │  调度器       │
│  │    解析 DAG, 创建任务实例             │               │
│  └─────────────────┬───────────────────┘               │
│                    │                                    │
│                    ▼                                    │
│  ┌─────────────────────────────────────┐               │
│  │           Executor                   │  执行器       │
│  │   Local/Celery/Kubernetes           │               │
│  └─────────────────┬───────────────────┘               │
│                    │                                    │
│       ┌────────────┼────────────┐                      │
│       ▼            ▼            ▼                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                  │
│  │ Worker  │ │ Worker  │ │ Worker  │   工作节点       │
│  └─────────┘ └─────────┘ └─────────┘                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 基础 DAG 示例

```python
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from airflow.providers.postgres.operators.postgres import PostgresOperator
from airflow.utils.dates import days_ago

# DAG 默认参数
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

# 定义 DAG
dag = DAG(
    dag_id='sales_etl_pipeline',
    default_args=default_args,
    description='每日销售数据 ETL 管道',
    schedule_interval='0 2 * * *',  # 每天凌晨2点执行
    start_date=days_ago(1),
    catchup=False,  # 不回填历史数据
    max_active_runs=1,  # 同时只运行一个实例
    tags=['sales', 'etl', 'daily'],
)

# 抽取任务
def extract_sales_data(**context):
    """从源系统抽取销售数据"""
    import pandas as pd
    from sqlalchemy import create_engine

    execution_date = context['ds']  # YYYY-MM-DD 格式

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

    # 保存到中间存储
    output_path = f'/tmp/sales_raw_{execution_date}.parquet'
    df.to_parquet(output_path)

    # 通过 XCom 传递数据路径和记录数
    context['ti'].xcom_push(key='raw_data_path', value=output_path)
    context['ti'].xcom_push(key='record_count', value=len(df))

    return f"Extracted {len(df)} records"

extract_task = PythonOperator(
    task_id='extract_sales_data',
    python_callable=extract_sales_data,
    dag=dag,
)

# 转换任务
def transform_sales_data(**context):
    """转换销售数据"""
    import pandas as pd

    # 从 XCom 获取上游数据路径
    ti = context['ti']
    raw_data_path = ti.xcom_pull(task_ids='extract_sales_data', key='raw_data_path')

    df = pd.read_parquet(raw_data_path)

    # 数据转换
    df['total_amount'] = df['quantity'] * df['unit_price']
    df['order_date'] = pd.to_datetime(df['order_date'])
    df['order_month'] = df['order_date'].dt.to_period('M')

    # 数据清洗
    df = df.dropna(subset=['customer_id', 'product_id'])
    df = df[df['quantity'] > 0]

    # 保存转换后的数据
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

# 加载任务
def load_sales_data(**context):
    """加载数据到数据仓库"""
    import pandas as pd
    from sqlalchemy import create_engine

    ti = context['ti']
    transformed_path = ti.xcom_pull(
        task_ids='transform_sales_data',
        key='transformed_data_path'
    )

    df = pd.read_parquet(transformed_path)

    target_engine = create_engine('postgresql://warehouse_db')

    # 使用幂等写入
    execution_date = context['ds']

    with target_engine.begin() as conn:
        # 先删除当天数据
        conn.execute(f"""
            DELETE FROM fact_sales
            WHERE DATE(order_date) = '{execution_date}'
        """)
        # 再插入新数据
        df.to_sql('fact_sales', conn, if_exists='append', index=False)

    return f"Loaded {len(df)} records"

load_task = PythonOperator(
    task_id='load_sales_data',
    python_callable=load_sales_data,
    dag=dag,
)

# 数据质量检查
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

# 清理临时文件
cleanup_task = BashOperator(
    task_id='cleanup_temp_files',
    bash_command='rm -f /tmp/sales_*.parquet',
    dag=dag,
)

# 定义任务依赖
extract_task >> transform_task >> load_task >> quality_check_task >> cleanup_task
```

### 高级 Airflow 模式

#### TaskGroup 组织复杂管道

```python
from airflow.utils.task_group import TaskGroup

with DAG('complex_etl_pipeline', ...) as dag:

    start = DummyOperator(task_id='start')

    # 使用 TaskGroup 组织相关任务
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

#### 动态任务生成

```python
from airflow.decorators import dag, task

@dag(
    schedule_interval='@daily',
    start_date=days_ago(1),
    catchup=False
)
def dynamic_etl_pipeline():
    """动态生成 ETL 任务"""

    @task
    def get_source_tables():
        """获取需要同步的表列表"""
        return ['users', 'orders', 'products', 'inventory']

    @task
    def extract_table(table_name: str):
        """抽取单个表"""
        import pandas as pd
        from sqlalchemy import create_engine

        engine = create_engine('postgresql://source_db')
        df = pd.read_sql(f"SELECT * FROM {table_name}", engine)

        output_path = f'/tmp/{table_name}.parquet'
        df.to_parquet(output_path)
        return output_path

    @task
    def load_table(table_name: str, file_path: str):
        """加载单个表"""
        import pandas as pd
        from sqlalchemy import create_engine

        df = pd.read_parquet(file_path)
        engine = create_engine('postgresql://warehouse_db')
        df.to_sql(f'stg_{table_name}', engine, if_exists='replace')
        return f"Loaded {len(df)} records to stg_{table_name}"

    @task
    def summarize(results: list):
        """汇总结果"""
        return f"Completed {len(results)} tables"

    # 动态任务编排
    tables = get_source_tables()

    load_results = []
    for table in tables:
        extracted_path = extract_table(table)
        load_result = load_table(table, extracted_path)
        load_results.append(load_result)

    summarize(load_results)

# 实例化 DAG
dag = dynamic_etl_pipeline()
```

#### Sensor 等待外部条件

```python
from airflow.sensors.filesystem import FileSensor
from airflow.sensors.external_task import ExternalTaskSensor
from airflow.sensors.sql import SqlSensor

# 等待文件出现
wait_for_file = FileSensor(
    task_id='wait_for_source_file',
    filepath='/data/incoming/sales_{{ ds }}.csv',
    poke_interval=300,  # 每5分钟检查一次
    timeout=3600,  # 最长等待1小时
    mode='poke',  # 或 'reschedule' 节省资源
    dag=dag,
)

# 等待上游 DAG 完成
wait_for_upstream = ExternalTaskSensor(
    task_id='wait_for_upstream_dag',
    external_dag_id='upstream_etl',
    external_task_id='final_task',
    execution_delta=timedelta(hours=1),
    dag=dag,
)

# 等待数据库条件满足
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

## dbt 数据转换

dbt（data build tool）是现代 ELT 工作流中用于数据转换的工具，它允许数据分析师使用 SQL 进行数据建模。

### dbt 项目结构

```
my_dbt_project/
├── dbt_project.yml          # 项目配置
├── profiles.yml             # 连接配置（通常在 ~/.dbt/）
├── models/                  # SQL 模型
│   ├── staging/            # 数据清洗层
│   │   ├── stg_orders.sql
│   │   ├── stg_customers.sql
│   │   └── _staging.yml    # 模型文档和测试
│   ├── intermediate/       # 中间转换层
│   │   └── int_order_items.sql
│   └── marts/              # 业务数据集市
│       ├── finance/
│       │   └── fct_revenue.sql
│       └── marketing/
│           └── dim_customers.sql
├── tests/                  # 自定义测试
├── macros/                 # 可复用的 SQL 宏
├── seeds/                  # 静态数据文件
└── snapshots/              # SCD Type 2 快照
```

### dbt 模型示例

#### Staging 层 - 数据清洗

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
        -- 主键
        id AS order_id,

        -- 外键
        customer_id,
        product_id,

        -- 数值字段
        quantity,
        CAST(unit_price AS DECIMAL(10, 2)) AS unit_price,

        -- 日期字段
        CAST(order_date AS DATE) AS order_date,
        CAST(created_at AS TIMESTAMP) AS created_at,

        -- 状态字段
        LOWER(TRIM(status)) AS order_status,

        -- 元数据
        CURRENT_TIMESTAMP AS _loaded_at
    FROM source
    WHERE id IS NOT NULL
      AND quantity > 0
)

SELECT * FROM renamed
```

#### Intermediate 层 - 业务逻辑

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

        -- 客户维度
        c.customer_segment,
        c.region,

        -- 时间维度
        DATE_TRUNC('month', o.order_date) AS order_month,
        DATE_TRUNC('quarter', o.order_date) AS order_quarter,
        EXTRACT(DOW FROM o.order_date) AS day_of_week,

        -- 是否为周末订单
        CASE
            WHEN EXTRACT(DOW FROM o.order_date) IN (0, 6) THEN TRUE
            ELSE FALSE
        END AS is_weekend_order

    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.customer_id
)

SELECT * FROM order_metrics
```

#### Mart 层 - 业务指标

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

        -- 收入指标
        COUNT(DISTINCT order_id) AS total_orders,
        SUM(order_amount) AS gross_revenue,
        AVG(order_amount) AS avg_order_value,

        -- 客户指标
        COUNT(DISTINCT customer_id) AS unique_customers,

        -- 分段指标
        SUM(CASE WHEN customer_segment = 'premium' THEN order_amount ELSE 0 END) AS premium_revenue,
        SUM(CASE WHEN customer_segment = 'standard' THEN order_amount ELSE 0 END) AS standard_revenue,

        -- 区域指标
        SUM(CASE WHEN region = 'north' THEN order_amount ELSE 0 END) AS north_revenue,
        SUM(CASE WHEN region = 'south' THEN order_amount ELSE 0 END) AS south_revenue,
        SUM(CASE WHEN region = 'east' THEN order_amount ELSE 0 END) AS east_revenue,
        SUM(CASE WHEN region = 'west' THEN order_amount ELSE 0 END) AS west_revenue

    FROM order_metrics
    GROUP BY order_date
)

SELECT
    *,
    -- 计算占比
    ROUND(premium_revenue / NULLIF(gross_revenue, 0) * 100, 2) AS premium_revenue_pct,

    -- 添加时间戳
    CURRENT_TIMESTAMP AS _updated_at

FROM daily_revenue
```

### dbt 宏和测试

#### 自定义宏

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

#### 模型测试配置

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
    description: "清洗后的订单数据"
    columns:
      - name: order_id
        description: "订单唯一标识"
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

## 数据质量检测

数据质量是 ETL 管道可靠性的基础。以下是构建全面数据质量检测框架的方法。

### Great Expectations 集成

```python
import great_expectations as gx
from great_expectations.core.batch import RuntimeBatchRequest

# 初始化 Great Expectations 上下文
context = gx.get_context()

# 定义数据质量期望套件
def create_order_expectations():
    """创建订单数据的期望套件"""

    suite = context.add_or_update_expectation_suite(
        expectation_suite_name="orders_quality_suite"
    )

    # 完整性检查
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

    # 唯一性检查
    suite.add_expectation(
        gx.expectations.ExpectColumnValuesToBeUnique(
            column="order_id"
        )
    )

    # 范围检查
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

    # 格式检查
    suite.add_expectation(
        gx.expectations.ExpectColumnValuesToMatchRegex(
            column="order_id",
            regex=r"^ORD-\d{8}$"
        )
    )

    # 引用完整性
    suite.add_expectation(
        gx.expectations.ExpectColumnValuesToBeInSet(
            column="order_status",
            value_set=["pending", "confirmed", "shipped", "delivered", "cancelled"]
        )
    )

    # 统计分布检查
    suite.add_expectation(
        gx.expectations.ExpectColumnMeanToBeBetween(
            column="unit_price",
            min_value=50,
            max_value=500
        )
    )

    return suite

# 在 ETL 管道中使用
def validate_data(df, suite_name):
    """验证数据质量"""

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

### 自定义数据质量框架

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
    """数据质量检查框架"""

    def __init__(self):
        self.checks: List[Callable] = []
        self.results: List[QualityCheckResult] = []

    def add_check(self, check_func: Callable, severity: CheckSeverity = CheckSeverity.ERROR):
        """添加质量检查"""
        self.checks.append((check_func, severity))

    def run_checks(self, df: pd.DataFrame) -> List[QualityCheckResult]:
        """运行所有检查"""
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
        """检查是否有严重失败"""
        return any(
            not r.passed and r.severity == CheckSeverity.CRITICAL
            for r in self.results
        )

    def get_summary(self) -> Dict:
        """获取检查摘要"""
        return {
            "total_checks": len(self.results),
            "passed": sum(1 for r in self.results if r.passed),
            "failed": sum(1 for r in self.results if not r.passed),
            "critical_failures": sum(
                1 for r in self.results
                if not r.passed and r.severity == CheckSeverity.CRITICAL
            )
        }

# 预定义的检查函数
def check_no_nulls(column: str):
    """检查列没有空值"""
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
    """检查列值唯一"""
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
    """检查数值范围"""
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
    """检查数据新鲜度"""
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

# 使用示例
checker = DataQualityChecker()
checker.add_check(check_no_nulls("order_id"), CheckSeverity.CRITICAL)
checker.add_check(check_unique("order_id"), CheckSeverity.CRITICAL)
checker.add_check(check_value_range("quantity", 1, 1000), CheckSeverity.ERROR)
checker.add_check(check_freshness("created_at", 24), CheckSeverity.WARNING)

results = checker.run_checks(df)
```

---

## 增量更新策略

增量更新是处理大规模数据时提高效率的关键策略。

### 常见增量模式

```python
from enum import Enum
from datetime import datetime, timedelta
import pandas as pd
from sqlalchemy import create_engine, text

class IncrementalStrategy(Enum):
    TIMESTAMP = "timestamp"      # 基于时间戳
    SEQUENCE = "sequence"        # 基于自增序列
    CDC = "cdc"                  # 变更数据捕获
    HASH = "hash"                # 基于哈希比较

class IncrementalLoader:
    """增量数据加载器"""

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
        """基于时间戳的增量加载"""

        # 获取目标表最新时间戳
        with self.target.connect() as conn:
            result = conn.execute(text(f"""
                SELECT COALESCE(MAX({timestamp_column}), '1970-01-01') as max_ts
                FROM {target_table}
            """))
            max_ts = result.scalar()

        # 添加安全回溯窗口（处理延迟到达的数据）
        safe_ts = max_ts - timedelta(hours=lookback_hours)

        # 从源表抽取增量数据
        query = f"""
            SELECT * FROM {source_table}
            WHERE {timestamp_column} > '{safe_ts}'
        """
        df = pd.read_sql(query, self.source)

        if len(df) == 0:
            return {"status": "no_new_data", "records": 0}

        # 使用 UPSERT 写入目标表
        self._upsert_data(df, target_table, timestamp_column)

        return {"status": "success", "records": len(df)}

    def load_by_sequence(
        self,
        source_table: str,
        target_table: str,
        sequence_column: str = "id"
    ):
        """基于自增序列的增量加载"""

        # 获取目标表最大序列号
        with self.target.connect() as conn:
            result = conn.execute(text(f"""
                SELECT COALESCE(MAX({sequence_column}), 0) as max_id
                FROM {target_table}
            """))
            max_id = result.scalar()

        # 抽取新增数据
        query = f"""
            SELECT * FROM {source_table}
            WHERE {sequence_column} > {max_id}
            ORDER BY {sequence_column}
        """
        df = pd.read_sql(query, self.source)

        if len(df) == 0:
            return {"status": "no_new_data", "records": 0}

        # 追加写入（序列保证唯一，无需 UPSERT）
        df.to_sql(target_table, self.target, if_exists='append', index=False)

        return {"status": "success", "records": len(df)}

    def load_with_hash_comparison(
        self,
        source_table: str,
        target_table: str,
        key_columns: list,
        compare_columns: list
    ):
        """基于哈希比较的增量加载（检测更新）"""
        import hashlib

        def compute_hash(row):
            values = '|'.join(str(row[col]) for col in compare_columns)
            return hashlib.md5(values.encode()).hexdigest()

        # 获取源数据
        source_df = pd.read_sql(f"SELECT * FROM {source_table}", self.source)
        source_df['_row_hash'] = source_df.apply(compute_hash, axis=1)

        # 获取目标数据哈希
        target_query = f"""
            SELECT {', '.join(key_columns)}, _row_hash
            FROM {target_table}
        """
        try:
            target_hashes = pd.read_sql(target_query, self.target)
        except:
            target_hashes = pd.DataFrame(columns=key_columns + ['_row_hash'])

        # 合并比较
        merged = source_df.merge(
            target_hashes,
            on=key_columns,
            how='left',
            suffixes=('_source', '_target')
        )

        # 识别新增和更新的记录
        new_records = merged[merged['_row_hash_target'].isna()]
        updated_records = merged[
            (merged['_row_hash_target'].notna()) &
            (merged['_row_hash_source'] != merged['_row_hash_target'])
        ]

        # 处理新增
        if len(new_records) > 0:
            insert_df = source_df[
                source_df[key_columns[0]].isin(new_records[key_columns[0]])
            ]
            insert_df.to_sql(target_table, self.target, if_exists='append', index=False)

        # 处理更新
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
        """执行 UPSERT 操作"""
        temp_table = f"{table_name}_staging"

        # 写入临时表
        df.to_sql(temp_table, self.target, if_exists='replace', index=False)

        # 执行 UPSERT
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

### SCD Type 2 实现

```sql
-- dbt snapshot 实现 SCD Type 2
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
# Python 实现 SCD Type 2
class SCDType2Handler:
    """SCD Type 2 处理器"""

    def __init__(self, engine):
        self.engine = engine

    def apply_changes(
        self,
        source_df: pd.DataFrame,
        target_table: str,
        key_column: str,
        tracked_columns: list
    ):
        """应用变更，维护历史版本"""

        current_time = datetime.now()

        # 获取当前有效记录
        current_query = f"""
            SELECT * FROM {target_table}
            WHERE is_current = TRUE
        """
        current_df = pd.read_sql(current_query, self.engine)

        # 准备源数据
        source_df = source_df.copy()
        source_df['_source_hash'] = source_df[tracked_columns].apply(
            lambda row: hash(tuple(row)), axis=1
        )

        # 准备当前数据
        if len(current_df) > 0:
            current_df['_current_hash'] = current_df[tracked_columns].apply(
                lambda row: hash(tuple(row)), axis=1
            )
        else:
            current_df['_current_hash'] = None

        # 合并识别变更
        merged = source_df.merge(
            current_df[[key_column, '_current_hash', 'surrogate_key']],
            on=key_column,
            how='left'
        )

        # 新增记录
        new_records = merged[merged['_current_hash'].isna()].copy()

        # 更新记录（哈希不同）
        changed_records = merged[
            (merged['_current_hash'].notna()) &
            (merged['_source_hash'] != merged['_current_hash'])
        ].copy()

        with self.engine.begin() as conn:
            # 关闭旧版本记录
            if len(changed_records) > 0:
                old_keys = changed_records['surrogate_key'].tolist()
                conn.execute(text(f"""
                    UPDATE {target_table}
                    SET
                        is_current = FALSE,
                        valid_to = '{current_time}'
                    WHERE surrogate_key IN ({','.join(map(str, old_keys))})
                """))

            # 插入新版本
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
        """获取下一个代理键值"""
        with self.engine.connect() as conn:
            result = conn.execute(text(f"""
                SELECT COALESCE(MAX(surrogate_key), 0) + 1
                FROM {table_name}
            """))
            return result.scalar()
```

---

## 调度与监控

### Airflow 监控配置

```python
from airflow.models import Variable
from airflow.providers.slack.operators.slack import SlackAPIPostOperator
from airflow.providers.http.operators.http import SimpleHttpOperator

# 失败回调函数
def task_failure_callback(context):
    """任务失败时的回调"""
    task_instance = context['task_instance']
    dag_id = context['dag'].dag_id
    task_id = task_instance.task_id
    execution_date = context['execution_date']
    exception = context.get('exception')

    # 发送 Slack 告警
    slack_message = f"""
:red_circle: *ETL 任务失败告警*
- DAG: `{dag_id}`
- Task: `{task_id}`
- 执行时间: {execution_date}
- 错误信息: {str(exception)[:500]}
    """

    SlackAPIPostOperator(
        task_id='slack_alert',
        channel='#data-alerts',
        text=slack_message,
        token=Variable.get('SLACK_TOKEN')
    ).execute(context)

    # 发送指标到监控系统
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

# 成功回调函数
def task_success_callback(context):
    """任务成功时的回调"""
    task_instance = context['task_instance']
    duration = (task_instance.end_date - task_instance.start_date).total_seconds()

    # 记录执行时长指标
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

# 在 DAG 中使用回调
dag = DAG(
    'monitored_etl_pipeline',
    default_args={
        'on_failure_callback': task_failure_callback,
        'on_success_callback': task_success_callback,
        'sla': timedelta(hours=2),  # SLA 超时告警
    },
    ...
)
```

### 自定义监控仪表板

```python
from prometheus_client import Counter, Histogram, Gauge, start_http_server
import time

# 定义 Prometheus 指标
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
    """ETL 指标收集器"""

    def __init__(self, pipeline_name: str):
        self.pipeline_name = pipeline_name
        self.stage_start_times = {}

    def start_stage(self, stage_name: str):
        """开始计时某个阶段"""
        self.stage_start_times[stage_name] = time.time()
        ETL_PIPELINE_STATUS.labels(pipeline=self.pipeline_name).set(1)

    def end_stage(self, stage_name: str, record_count: int):
        """结束某个阶段并记录指标"""
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
        """记录错误"""
        ETL_ERRORS.labels(
            pipeline=self.pipeline_name,
            stage=stage_name,
            error_type=error_type
        ).inc()
        ETL_PIPELINE_STATUS.labels(pipeline=self.pipeline_name).set(-1)

    def pipeline_complete(self):
        """标记管道完成"""
        ETL_PIPELINE_STATUS.labels(pipeline=self.pipeline_name).set(0)

# 使用示例
def run_monitored_pipeline():
    metrics = MetricsCollector('sales_etl')

    try:
        # Extract 阶段
        metrics.start_stage('extract')
        df = extract_data()
        metrics.end_stage('extract', len(df))

        # Transform 阶段
        metrics.start_stage('transform')
        df = transform_data(df)
        metrics.end_stage('transform', len(df))

        # Load 阶段
        metrics.start_stage('load')
        load_data(df)
        metrics.end_stage('load', len(df))

        metrics.pipeline_complete()

    except Exception as e:
        metrics.record_error('unknown', type(e).__name__)
        raise
```

---

## 错误处理与重试

### 健壮的错误处理框架

```python
from functools import wraps
from typing import Type, Tuple, Callable
import time
import random
from dataclasses import dataclass

@dataclass
class RetryConfig:
    """重试配置"""
    max_retries: int = 3
    initial_delay: float = 1.0
    max_delay: float = 60.0
    exponential_base: float = 2.0
    jitter: bool = True
    retryable_exceptions: Tuple[Type[Exception], ...] = (Exception,)

class ETLError(Exception):
    """ETL 基础异常"""
    pass

class ExtractError(ETLError):
    """数据抽取异常"""
    pass

class TransformError(ETLError):
    """数据转换异常"""
    pass

class LoadError(ETLError):
    """数据加载异常"""
    pass

class DataQualityError(ETLError):
    """数据质量异常"""
    pass

def retry_with_backoff(config: RetryConfig = None):
    """带指数退避的重试装饰器"""
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

                    # 计算延迟时间
                    delay = min(
                        config.initial_delay * (config.exponential_base ** attempt),
                        config.max_delay
                    )

                    # 添加抖动防止雷群效应
                    if config.jitter:
                        delay = delay * (0.5 + random.random())

                    print(f"Attempt {attempt + 1} failed: {e}. "
                          f"Retrying in {delay:.2f} seconds...")
                    time.sleep(delay)

            raise last_exception
        return wrapper
    return decorator

# 使用示例
@retry_with_backoff(RetryConfig(
    max_retries=3,
    initial_delay=1.0,
    retryable_exceptions=(ConnectionError, TimeoutError)
))
def extract_from_api(endpoint: str):
    """从 API 抽取数据（带重试）"""
    import requests

    response = requests.get(endpoint, timeout=30)
    response.raise_for_status()
    return response.json()

# 带死信队列的处理
class DeadLetterQueue:
    """死信队列处理失败记录"""

    def __init__(self, engine, table_name='etl_dead_letter_queue'):
        self.engine = engine
        self.table_name = table_name
        self._ensure_table_exists()

    def _ensure_table_exists(self):
        """确保死信队列表存在"""
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
        """添加失败记录到死信队列"""
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
        """获取待重试的记录"""
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
        """标记记录已解决"""
        update_sql = f"""
        UPDATE {self.table_name}
        SET status = 'resolved', last_retry_at = NOW()
        WHERE id = :id
        """
        with self.engine.begin() as conn:
            conn.execute(text(update_sql), {'id': record_id})

# 在 ETL 中使用死信队列
def process_with_dlq(df: pd.DataFrame, pipeline_name: str):
    """处理数据，失败记录进入死信队列"""
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

## 最佳实践

### 配置管理

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

        # 从环境变量获取敏感信息
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

### 测试策略

```python
# tests/test_etl_pipeline.py
import pytest
import pandas as pd
from unittest.mock import Mock, patch

class TestTransformations:
    """测试数据转换逻辑"""

    @pytest.fixture
    def sample_orders(self):
        return pd.DataFrame({
            'order_id': ['ORD-001', 'ORD-002', 'ORD-003'],
            'quantity': [2, 3, 1],
            'unit_price': [100.0, 200.0, 150.0],
            'order_date': ['2024-01-15', '2024-01-16', '2024-01-17']
        })

    def test_calculate_total_amount(self, sample_orders):
        """测试总金额计算"""
        result = transform_orders(sample_orders)

        expected_amounts = [200.0, 600.0, 150.0]
        assert result['total_amount'].tolist() == expected_amounts

    def test_handle_null_values(self):
        """测试空值处理"""
        df_with_nulls = pd.DataFrame({
            'order_id': ['ORD-001', None, 'ORD-003'],
            'quantity': [2, 3, None],
            'unit_price': [100.0, None, 150.0]
        })

        result = transform_orders(df_with_nulls)

        # 验证空值被正确处理
        assert result['order_id'].notna().all()
        assert result['quantity'].notna().all()

    def test_data_quality_checks_pass(self, sample_orders):
        """测试数据质量检查通过"""
        checker = DataQualityChecker()
        checker.add_check(check_no_nulls('order_id'))
        checker.add_check(check_value_range('quantity', 1, 1000))

        results = checker.run_checks(sample_orders)

        assert all(r.passed for r in results)

    def test_data_quality_checks_fail(self):
        """测试数据质量检查失败"""
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
    """测试增量加载逻辑"""

    @pytest.fixture
    def mock_engines(self):
        source = Mock()
        target = Mock()
        return source, target

    def test_timestamp_based_incremental(self, mock_engines):
        """测试基于时间戳的增量加载"""
        source, target = mock_engines

        # 模拟目标表返回最大时间戳
        target.connect().execute.return_value.scalar.return_value = '2024-01-14 00:00:00'

        loader = IncrementalLoader(source, target)
        result = loader.load_by_timestamp(
            'source_orders',
            'target_orders',
            'updated_at'
        )

        # 验证查询使用了正确的时间戳过滤
        # 具体断言根据实现调整
```

### 文档和数据字典

```yaml
# docs/data_dictionary.yml
models:
  - name: fact_sales
    description: "销售事实表，记录每笔订单的详细信息"
    owner: "data_team"
    update_frequency: "daily"
    columns:
      - name: order_id
        description: "订单唯一标识"
        type: "VARCHAR(20)"
        is_nullable: false
        is_primary_key: true
        example: "ORD-20240115-001"

      - name: customer_id
        description: "客户ID，关联 dim_customers 表"
        type: "INTEGER"
        is_nullable: false
        is_foreign_key: true
        references: "dim_customers.customer_id"

      - name: order_date
        description: "订单日期"
        type: "DATE"
        is_nullable: false
        partition_key: true

      - name: total_amount
        description: "订单总金额（元）"
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

## 面试要点

### 高频面试题

**Q1: ETL 和 ELT 的区别是什么？什么场景下选择哪种方案？**

A: 主要区别在于转换（Transform）发生的位置：
- ETL：在中间处理层完成转换后再加载到目标系统
- ELT：先加载原始数据到目标系统，再在目标系统内部完成转换

选择建议：
- 云数据仓库（Snowflake/BigQuery）：选择 ELT，利用其强大的计算能力
- 传统数据仓库：选择 ETL，减轻数据仓库负担
- 需要保留原始数据：选择 ELT
- 数据量小、转换简单：ETL 足够

**Q2: 如何保证 ETL 管道的幂等性？**

A: 幂等性确保重复执行产生相同结果，实现方法：
1. 使用 UPSERT 而非 INSERT
2. 在写入前先删除对应分区数据
3. 使用事务保证原子性
4. 对增量数据使用唯一键去重

```sql
-- 幂等写入示例
DELETE FROM target_table WHERE date_partition = '2024-01-15';
INSERT INTO target_table SELECT * FROM staging WHERE date_partition = '2024-01-15';
```

**Q3: 描述一个你处理过的数据质量问题**

A: 典型回答框架：
1. **问题发现**：通过数据质量检查发现某字段空值率突然上升
2. **根因分析**：追溯到上游系统发布了新版本，字段格式变更
3. **临时方案**：修改 ETL 逻辑兼容新格式，回填受影响数据
4. **长期方案**：建立数据契约，增加上游变更通知机制
5. **预防措施**：加强数据质量监控，设置阈值告警

**Q4: Airflow 中 DAG、Task、Operator 的关系是什么？**

A:
- **DAG**（有向无环图）：定义工作流的整体结构和任务依赖关系
- **Task**：DAG 中的一个节点，代表一个具体的工作单元
- **Operator**：定义 Task 执行什么操作的模板（如 PythonOperator、BashOperator）

```python
# DAG 包含多个 Task，每个 Task 由 Operator 创建
with DAG('example_dag') as dag:
    task1 = PythonOperator(task_id='task1', ...)  # Task 由 Operator 创建
    task2 = BashOperator(task_id='task2', ...)
    task1 >> task2  # 定义依赖关系
```

**Q5: 如何设计增量数据同步方案？**

A: 常见方案：
1. **基于时间戳**：适用于有 `updated_at` 字段的场景
2. **基于自增ID**：适用于只追加不更新的场景
3. **基于哈希比较**：适用于需要检测更新的场景
4. **CDC（变更数据捕获）**：适用于实时性要求高的场景

选择要点：
- 考虑源系统是否支持 CDC
- 评估数据延迟容忍度
- 考虑回填历史数据的需求

**Q6: dbt 的 incremental 模型是如何工作的？**

A: dbt incremental 模型通过以下方式实现增量更新：
1. 首次运行：创建完整表
2. 后续运行：只处理新数据，使用 `is_incremental()` 宏判断

```sql
{{ config(materialized='incremental', unique_key='id') }}

SELECT * FROM source
{% if is_incremental() %}
WHERE updated_at > (SELECT MAX(updated_at) FROM {{ this }})
{% endif %}
```

关键配置：
- `unique_key`：用于合并的键
- `incremental_strategy`：append/merge/delete+insert

---

## 延伸阅读

### 官方文档

- [Apache Airflow Documentation](https://airflow.apache.org/docs/) - Airflow 官方文档
- [dbt Documentation](https://docs.getdbt.com/) - dbt 官方文档
- [Great Expectations Documentation](https://docs.greatexpectations.io/) - 数据质量框架

### 推荐书籍

- **《Fundamentals of Data Engineering》** - Joe Reis, Matt Housley
- **《The Data Warehouse Toolkit》** - Ralph Kimball（数据仓库经典）
- **《Designing Data-Intensive Applications》** - Martin Kleppmann

### 在线资源

- [Data Engineering Zoomcamp](https://github.com/DataTalksClub/data-engineering-zoomcamp) - 免费数据工程课程
- [Awesome Data Engineering](https://github.com/igorbarinov/awesome-data-engineering) - 数据工程资源汇总
- [dbt Learn](https://courses.getdbt.com/) - dbt 官方学习课程

### 相关工具

- **编排工具**：Apache Airflow, Prefect, Dagster, Luigi
- **转换工具**：dbt, Spark, Pandas
- **数据质量**：Great Expectations, Soda, dbt tests
- **CDC 工具**：Debezium, Maxwell, AWS DMS
- **数据集成**：Fivetran, Airbyte, Stitch

---

> **总结**：构建可靠的 ETL 和数据管道需要综合考虑数据质量、性能、可观测性和错误处理。现代数据栈推荐采用 ELT 架构，使用 Airflow 进行编排，dbt 进行转换，Great Expectations 进行数据质量验证。掌握这些工具和最佳实践，将使你能够构建企业级的数据平台。
