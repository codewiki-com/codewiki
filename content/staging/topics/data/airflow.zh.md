---
title: Apache Airflow 工作流编排
description: 使用Airflow构建和调度数据管道
track: data
section: data-engineering
difficulty: intermediate
tags:
  - Airflow
  - 工作流
  - DAG
  - 数据管道
status: imported
origin: old/src/content/docs/data/airflow.zh.md
divergence: 0.271
issues: []
legacy:
  category: Data
  subcategory: Orchestration
  order: 18
  lastUpdated: 2026-01-07
---

Apache Airflow 是一个开源的工作流编排平台，用于以编程方式创建、调度和监控工作流。它由 Airbnb 于 2014 年开发，并于 2016 年成为 Apache 顶级项目。Airflow 使用 Python 代码定义工作流，使得数据工程师能够用熟悉的编程语言构建复杂的数据管道。

## Airflow 架构

### 核心组件

Airflow 采用分布式架构，由以下核心组件组成：

```
                    ┌─────────────────────────────────────────┐
                    │              Web Server                  │
                    │         (Flask + Gunicorn)               │
                    │    - DAG 可视化                          │
                    │    - 任务状态监控                        │
                    │    - 手动触发/重试                       │
                    └─────────────────────────────────────────┘
                                      │
                    ┌─────────────────────────────────────────┐
                    │              Scheduler                   │
                    │    - 解析 DAG 文件                       │
                    │    - 触发任务执行                        │
                    │    - 监控任务状态                        │
                    └─────────────────────────────────────────┘
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         │                            │                            │
         ▼                            ▼                            ▼
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│     Worker      │        │     Worker      │        │     Worker      │
│  (Celery/K8s)   │        │  (Celery/K8s)   │        │  (Celery/K8s)   │
│  执行具体任务    │        │  执行具体任务    │        │  执行具体任务    │
└─────────────────┘        └─────────────────┘        └─────────────────┘
         │                            │                            │
         └────────────────────────────┼────────────────────────────┘
                                      │
                    ┌─────────────────────────────────────────┐
                    │           Metadata Database              │
                    │    (PostgreSQL / MySQL)                  │
                    │    - DAG 定义                            │
                    │    - 任务实例状态                        │
                    │    - 变量和连接配置                      │
                    └─────────────────────────────────────────┘
```

### 组件详解

| 组件 | 功能 | 说明 |
|------|------|------|
| **Web Server** | UI 界面 | 提供 DAG 可视化、任务监控、日志查看等功能 |
| **Scheduler** | 任务调度 | 解析 DAG 文件，根据调度规则触发任务 |
| **Executor** | 任务执行器 | 决定任务如何被执行（本地、Celery、Kubernetes 等） |
| **Worker** | 工作节点 | 实际执行任务的进程 |
| **Metadata DB** | 元数据存储 | 存储 DAG、任务实例、变量、连接等元数据 |

### Executor 类型

```python
# airflow.cfg 中配置 Executor
# executor = SequentialExecutor  # 顺序执行，仅用于开发
# executor = LocalExecutor       # 本地多进程执行
# executor = CeleryExecutor      # 分布式执行，使用 Celery
# executor = KubernetesExecutor  # 在 Kubernetes 上动态创建 Pod 执行
```

**各 Executor 对比**：

| Executor | 并行度 | 适用场景 | 依赖 |
|----------|--------|----------|------|
| SequentialExecutor | 无 | 开发测试 | 无 |
| LocalExecutor | 单机多进程 | 小规模生产 | 无 |
| CeleryExecutor | 分布式 | 大规模生产 | Redis/RabbitMQ |
| KubernetesExecutor | 动态扩展 | 云原生环境 | Kubernetes |

---

## DAG（有向无环图）

### 什么是 DAG？

DAG（Directed Acyclic Graph，有向无环图）是 Airflow 的核心概念，用于定义任务之间的依赖关系和执行顺序。

```
          ┌─────────┐
          │ extract │
          └────┬────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
┌─────────────┐ ┌─────────────┐
│ transform_a │ │ transform_b │
└──────┬──────┘ └──────┬──────┘
       │               │
       └───────┬───────┘
               │
               ▼
          ┌─────────┐
          │  load   │
          └─────────┘
```

### 创建第一个 DAG

```python
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator

# 定义默认参数
default_args = {
    'owner': 'data_team',
    'depends_on_past': False,
    'email': ['data-alerts@company.com'],
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
    'execution_timeout': timedelta(hours=2),
}

# 创建 DAG
with DAG(
    dag_id='etl_pipeline',
    default_args=default_args,
    description='每日 ETL 数据管道',
    schedule_interval='0 2 * * *',  # 每天凌晨 2 点执行
    start_date=datetime(2024, 1, 1),
    catchup=False,  # 不回填历史数据
    tags=['etl', 'production'],
    max_active_runs=1,  # 同时只能有一个运行实例
) as dag:

    def extract_data(**context):
        """从数据源提取数据"""
        execution_date = context['execution_date']
        print(f"Extracting data for {execution_date}")
        # 提取逻辑...
        return {'records_count': 1000}

    def transform_data(**context):
        """转换数据"""
        ti = context['ti']
        extract_result = ti.xcom_pull(task_ids='extract')
        print(f"Transforming {extract_result['records_count']} records")
        # 转换逻辑...

    def load_data(**context):
        """加载数据到目标"""
        print("Loading data to warehouse")
        # 加载逻辑...

    # 定义任务
    extract = PythonOperator(
        task_id='extract',
        python_callable=extract_data,
    )

    transform = PythonOperator(
        task_id='transform',
        python_callable=transform_data,
    )

    load = PythonOperator(
        task_id='load',
        python_callable=load_data,
    )

    # 定义依赖关系
    extract >> transform >> load
```

### DAG 参数详解

```python
dag = DAG(
    dag_id='my_dag',                          # DAG 唯一标识符
    description='DAG 描述信息',                # 在 UI 中显示的描述
    schedule_interval='@daily',               # 调度频率
    start_date=datetime(2024, 1, 1),          # 开始日期
    end_date=datetime(2024, 12, 31),          # 结束日期（可选）
    catchup=False,                            # 是否回填历史
    max_active_runs=3,                        # 最大并行运行数
    max_active_tasks=16,                      # 最大并行任务数
    default_args=default_args,                # 默认参数
    tags=['etl', 'production'],               # 标签
    dagrun_timeout=timedelta(hours=6),        # DAG 运行超时
    doc_md="""
    ## DAG 文档
    这是一个用于数据处理的 DAG。
    """,
)
```

### 调度表达式

Airflow 支持多种调度表达式：

```python
# 预设调度
schedule_interval='@once'      # 只执行一次
schedule_interval='@hourly'    # 每小时
schedule_interval='@daily'     # 每天午夜
schedule_interval='@weekly'    # 每周日午夜
schedule_interval='@monthly'   # 每月第一天午夜
schedule_interval='@yearly'    # 每年第一天午夜

# Cron 表达式
schedule_interval='0 2 * * *'           # 每天凌晨 2 点
schedule_interval='0 */6 * * *'         # 每 6 小时
schedule_interval='0 0 * * MON-FRI'     # 工作日午夜
schedule_interval='0 0 1,15 * *'        # 每月 1 号和 15 号

# timedelta 对象
schedule_interval=timedelta(hours=6)    # 每 6 小时
schedule_interval=timedelta(days=1)     # 每天

# Timetable（Airflow 2.2+，更灵活的调度）
from airflow.timetables.trigger import CronTriggerTimetable
schedule=CronTriggerTimetable('0 2 * * *', timezone='Asia/Shanghai')
```

---

## Operators（操作符）

Operator 是 Airflow 中定义单个任务的模板。Airflow 提供了丰富的内置 Operator，也支持自定义。

### 常用 Operators

#### BashOperator

执行 Bash 命令：

```python
from airflow.operators.bash import BashOperator

bash_task = BashOperator(
    task_id='run_script',
    bash_command='python /path/to/script.py --date {{ ds }}',
    env={'CUSTOM_VAR': 'value'},  # 环境变量
    cwd='/working/directory',      # 工作目录
)

# 使用模板
templated_command = """
{% for i in range(5) %}
    echo "Processing batch {{ i }}"
{% endfor %}
"""

batch_task = BashOperator(
    task_id='batch_processing',
    bash_command=templated_command,
)
```

#### PythonOperator

执行 Python 函数：

```python
from airflow.operators.python import PythonOperator, BranchPythonOperator

def process_data(data_path, **context):
    """处理数据的函数"""
    execution_date = context['ds']
    ti = context['ti']

    # 处理逻辑
    result = {'status': 'success', 'rows': 1000}

    # 推送到 XCom
    ti.xcom_push(key='process_result', value=result)
    return result

python_task = PythonOperator(
    task_id='process_data',
    python_callable=process_data,
    op_kwargs={'data_path': '/data/input'},  # 关键字参数
    op_args=[],                               # 位置参数
    provide_context=True,                     # 自动传递 context（Airflow 2.0+ 默认 True）
)

# 分支操作符
def choose_branch(**context):
    """根据条件选择执行分支"""
    ti = context['ti']
    result = ti.xcom_pull(task_ids='check_data')
    if result['has_data']:
        return 'process_data'
    else:
        return 'skip_processing'

branch_task = BranchPythonOperator(
    task_id='branch_decision',
    python_callable=choose_branch,
)
```

#### 数据库 Operators

```python
from airflow.providers.postgres.operators.postgres import PostgresOperator
from airflow.providers.mysql.operators.mysql import MySqlOperator

# PostgreSQL 操作
postgres_task = PostgresOperator(
    task_id='create_table',
    postgres_conn_id='my_postgres',
    sql="""
        CREATE TABLE IF NOT EXISTS daily_metrics (
            date DATE PRIMARY KEY,
            total_users INT,
            active_users INT,
            revenue DECIMAL(10,2)
        );
    """,
)

# 执行 SQL 文件
sql_file_task = PostgresOperator(
    task_id='run_sql_file',
    postgres_conn_id='my_postgres',
    sql='sql/daily_aggregation.sql',  # 从文件加载 SQL
)

# MySQL 操作
mysql_task = MySqlOperator(
    task_id='update_records',
    mysql_conn_id='my_mysql',
    sql="UPDATE users SET status = 'active' WHERE last_login > DATE_SUB(NOW(), INTERVAL 30 DAY)",
)
```

#### 数据传输 Operators

```python
from airflow.providers.amazon.aws.transfers.s3_to_redshift import S3ToRedshiftOperator
from airflow.providers.google.cloud.transfers.gcs_to_bigquery import GCSToBigQueryOperator

# S3 到 Redshift
s3_to_redshift = S3ToRedshiftOperator(
    task_id='s3_to_redshift',
    schema='public',
    table='user_events',
    s3_bucket='my-bucket',
    s3_key='data/events/{{ ds }}.csv',
    redshift_conn_id='my_redshift',
    aws_conn_id='my_aws',
    copy_options=['CSV', 'IGNOREHEADER 1'],
)

# GCS 到 BigQuery
gcs_to_bq = GCSToBigQueryOperator(
    task_id='gcs_to_bigquery',
    bucket='my-gcs-bucket',
    source_objects=['data/{{ ds }}/*.parquet'],
    destination_project_dataset_table='project.dataset.table',
    source_format='PARQUET',
    write_disposition='WRITE_TRUNCATE',
    gcp_conn_id='my_gcp',
)
```

#### 容器化执行 Operators

```python
from airflow.providers.docker.operators.docker import DockerOperator
from airflow.providers.cncf.kubernetes.operators.kubernetes_pod import KubernetesPodOperator

# Docker 容器执行
docker_task = DockerOperator(
    task_id='docker_task',
    image='my-image:latest',
    command='python /app/process.py --date {{ ds }}',
    environment={
        'DATABASE_URL': '{{ var.value.database_url }}',
    },
    docker_url='unix://var/run/docker.sock',
    network_mode='bridge',
    auto_remove=True,
)

# Kubernetes Pod 执行
k8s_task = KubernetesPodOperator(
    task_id='k8s_task',
    name='data-processor',
    namespace='airflow',
    image='my-image:latest',
    cmds=['python'],
    arguments=['/app/process.py', '--date', '{{ ds }}'],
    env_vars={
        'ENV': 'production',
    },
    resources={
        'request_memory': '512Mi',
        'request_cpu': '500m',
        'limit_memory': '1Gi',
        'limit_cpu': '1000m',
    },
    is_delete_operator_pod=True,
    get_logs=True,
)
```

### 自定义 Operator

```python
from airflow.models import BaseOperator
from airflow.utils.decorators import apply_defaults
from typing import Any, Dict

class DataQualityOperator(BaseOperator):
    """
    自定义数据质量检查操作符
    """

    template_fields = ['sql', 'table_name']
    template_ext = ['.sql']
    ui_color = '#89DA59'

    @apply_defaults
    def __init__(
        self,
        conn_id: str,
        table_name: str,
        sql: str = None,
        expected_result: Any = None,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.conn_id = conn_id
        self.table_name = table_name
        self.sql = sql
        self.expected_result = expected_result

    def execute(self, context: Dict) -> Any:
        from airflow.hooks.base import BaseHook

        hook = BaseHook.get_hook(self.conn_id)
        connection = hook.get_conn()
        cursor = connection.cursor()

        self.log.info(f"Running data quality check on {self.table_name}")
        cursor.execute(self.sql)
        result = cursor.fetchone()[0]

        if self.expected_result is not None:
            if result != self.expected_result:
                raise ValueError(
                    f"Data quality check failed: expected {self.expected_result}, got {result}"
                )

        self.log.info(f"Data quality check passed: {result}")
        return result

# 使用自定义 Operator
quality_check = DataQualityOperator(
    task_id='check_user_count',
    conn_id='my_postgres',
    table_name='users',
    sql='SELECT COUNT(*) FROM users WHERE created_at = {{ ds }}',
    expected_result=lambda x: x > 0,
)
```

---

## Sensors（传感器）

Sensor 是一种特殊的 Operator，用于等待某个条件满足后再继续执行。

### 常用 Sensors

```python
from airflow.sensors.filesystem import FileSensor
from airflow.sensors.sql import SqlSensor
from airflow.sensors.external_task import ExternalTaskSensor
from airflow.providers.amazon.aws.sensors.s3 import S3KeySensor
from airflow.providers.http.sensors.http import HttpSensor

# 文件传感器 - 等待文件出现
file_sensor = FileSensor(
    task_id='wait_for_file',
    filepath='/data/input/{{ ds }}.csv',
    poke_interval=60,           # 检查间隔（秒）
    timeout=3600,               # 超时时间（秒）
    mode='poke',                # poke 或 reschedule
    soft_fail=False,            # 超时是否失败
)

# SQL 传感器 - 等待查询结果满足条件
sql_sensor = SqlSensor(
    task_id='wait_for_data',
    conn_id='my_postgres',
    sql="SELECT COUNT(*) FROM events WHERE date = '{{ ds }}'",
    success=lambda x: x[0][0] > 0,  # 判断条件
    poke_interval=300,
    timeout=7200,
    mode='reschedule',  # 释放 worker 槽位
)

# S3 传感器 - 等待 S3 文件
s3_sensor = S3KeySensor(
    task_id='wait_for_s3_file',
    bucket_name='my-bucket',
    bucket_key='data/{{ ds }}/events.parquet',
    wildcard_match=True,
    aws_conn_id='my_aws',
    poke_interval=120,
    timeout=3600,
)

# HTTP 传感器 - 等待 API 可用
http_sensor = HttpSensor(
    task_id='wait_for_api',
    http_conn_id='my_api',
    endpoint='health',
    method='GET',
    response_check=lambda response: response.json()['status'] == 'healthy',
    poke_interval=60,
    timeout=600,
)

# 外部任务传感器 - 等待其他 DAG 的任务完成
external_sensor = ExternalTaskSensor(
    task_id='wait_for_upstream',
    external_dag_id='upstream_dag',
    external_task_id='final_task',
    execution_delta=timedelta(hours=0),  # 执行时间差
    mode='reschedule',
    timeout=7200,
)
```

### Sensor 模式

```python
# poke 模式：持续占用 worker 槽位
file_sensor_poke = FileSensor(
    task_id='wait_poke',
    filepath='/data/file.csv',
    mode='poke',           # 持续检查，占用 worker
    poke_interval=60,      # 每 60 秒检查一次
)

# reschedule 模式：释放 worker 槽位
file_sensor_reschedule = FileSensor(
    task_id='wait_reschedule',
    filepath='/data/file.csv',
    mode='reschedule',     # 检查后释放 worker，重新调度
    poke_interval=300,     # 每 5 分钟检查一次
)
```

### 自定义 Sensor

```python
from airflow.sensors.base import BaseSensorOperator

class DataFreshnessSensor(BaseSensorOperator):
    """
    检查数据是否足够新鲜
    """

    template_fields = ['table_name', 'timestamp_column']

    def __init__(
        self,
        conn_id: str,
        table_name: str,
        timestamp_column: str,
        max_age_hours: int = 24,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.conn_id = conn_id
        self.table_name = table_name
        self.timestamp_column = timestamp_column
        self.max_age_hours = max_age_hours

    def poke(self, context) -> bool:
        from airflow.hooks.base import BaseHook
        from datetime import datetime, timedelta

        hook = BaseHook.get_hook(self.conn_id)
        connection = hook.get_conn()
        cursor = connection.cursor()

        sql = f"""
            SELECT MAX({self.timestamp_column})
            FROM {self.table_name}
        """
        cursor.execute(sql)
        result = cursor.fetchone()[0]

        if result is None:
            self.log.warning(f"No data found in {self.table_name}")
            return False

        age = datetime.now() - result
        is_fresh = age < timedelta(hours=self.max_age_hours)

        self.log.info(f"Data age: {age}, Fresh: {is_fresh}")
        return is_fresh
```

---

## Connections（连接）

Connections 用于存储外部系统的连接信息，如数据库、云服务等。

### 配置方式

#### 通过 Web UI 配置

在 Admin -> Connections 中添加连接。

#### 通过环境变量配置

```bash
# 格式：AIRFLOW_CONN_{CONN_ID}='{conn_type}://{login}:{password}@{host}:{port}/{schema}?{extra}'

# PostgreSQL 连接
export AIRFLOW_CONN_MY_POSTGRES='postgresql://user:password@localhost:5432/mydb'

# 带额外参数
export AIRFLOW_CONN_MY_POSTGRES='postgresql://user:password@localhost:5432/mydb?sslmode=require'

# AWS 连接
export AIRFLOW_CONN_MY_AWS='aws://?aws_access_key_id=xxx&aws_secret_access_key=yyy&region_name=us-east-1'

# 使用 JSON 格式（推荐）
export AIRFLOW_CONN_MY_POSTGRES='{
    "conn_type": "postgres",
    "host": "localhost",
    "schema": "mydb",
    "login": "user",
    "password": "password",
    "port": 5432,
    "extra": {"sslmode": "require"}
}'
```

#### 通过 CLI 配置

```bash
# 添加连接
airflow connections add 'my_postgres' \
    --conn-type 'postgres' \
    --conn-host 'localhost' \
    --conn-schema 'mydb' \
    --conn-login 'user' \
    --conn-password 'password' \
    --conn-port 5432

# 列出连接
airflow connections list

# 删除连接
airflow connections delete 'my_postgres'
```

### 在代码中使用连接

```python
from airflow.hooks.base import BaseHook
from airflow.providers.postgres.hooks.postgres import PostgresHook

# 获取连接对象
connection = BaseHook.get_connection('my_postgres')
print(f"Host: {connection.host}")
print(f"Schema: {connection.schema}")
print(f"Login: {connection.login}")
# 注意：不要打印密码到日志

# 使用 Hook（推荐）
def query_database(**context):
    hook = PostgresHook(postgres_conn_id='my_postgres')

    # 执行查询
    records = hook.get_records("SELECT * FROM users LIMIT 10")

    # 获取 Pandas DataFrame
    df = hook.get_pandas_df("SELECT * FROM users")

    # 执行插入
    hook.insert_rows(
        table='events',
        rows=[(1, 'event_a'), (2, 'event_b')],
        target_fields=['id', 'event_name'],
    )

    return len(records)

# 使用原生连接
def raw_connection(**context):
    hook = PostgresHook(postgres_conn_id='my_postgres')
    conn = hook.get_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM users")
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    return result[0]
```

---

## Variables（变量）

Variables 用于存储全局配置值，可以在 DAG 中动态获取。

### 配置方式

```bash
# 通过 CLI
airflow variables set 'my_config' '{"key": "value"}'
airflow variables get 'my_config'
airflow variables list

# 通过环境变量
export AIRFLOW_VAR_MY_CONFIG='{"key": "value"}'
```

### 在代码中使用

```python
from airflow.models import Variable

# 获取变量值
config = Variable.get('my_config')
config_json = Variable.get('my_config', deserialize_json=True)
config_default = Variable.get('missing_key', default_var='default_value')

# 设置变量
Variable.set('my_key', 'my_value')
Variable.set('my_json', {'key': 'value'}, serialize_json=True)

# 在模板中使用
task = BashOperator(
    task_id='use_variable',
    bash_command='echo {{ var.value.my_config }}',
)

# JSON 变量
task_json = BashOperator(
    task_id='use_json_variable',
    bash_command='echo {{ var.json.my_config.key }}',
)
```

### 最佳实践

```python
# 避免在 DAG 定义时获取变量（会增加调度器负载）
# 错误示例
config = Variable.get('config')  # 每次解析 DAG 都会查询数据库

with DAG(...) as dag:
    task = PythonOperator(
        task_id='task',
        op_kwargs={'config': config},  # 静态值
    )

# 正确示例：在模板中使用
with DAG(...) as dag:
    task = PythonOperator(
        task_id='task',
        op_kwargs={'config': '{{ var.json.config }}'},  # 运行时解析
    )

# 或在任务执行时获取
def my_task(**context):
    config = Variable.get('config', deserialize_json=True)
    # 使用 config...
```

---

## XCom（任务间通信）

XCom（Cross-Communication）用于在任务之间传递数据。

### 基本用法

```python
from airflow.operators.python import PythonOperator

def push_data(**context):
    """推送数据到 XCom"""
    ti = context['ti']

    # 方式 1：使用 xcom_push
    ti.xcom_push(key='user_count', value=1000)
    ti.xcom_push(key='status', value='success')

    # 方式 2：通过 return 自动推送（key 为 'return_value'）
    return {'processed_rows': 5000}

def pull_data(**context):
    """从 XCom 拉取数据"""
    ti = context['ti']

    # 拉取指定 key
    user_count = ti.xcom_pull(task_ids='push_task', key='user_count')
    status = ti.xcom_pull(task_ids='push_task', key='status')

    # 拉取 return 值（默认 key）
    result = ti.xcom_pull(task_ids='push_task')

    print(f"User count: {user_count}, Status: {status}")
    print(f"Return value: {result}")

push_task = PythonOperator(
    task_id='push_task',
    python_callable=push_data,
)

pull_task = PythonOperator(
    task_id='pull_task',
    python_callable=pull_data,
)

push_task >> pull_task
```

### 在模板中使用 XCom

```python
# 使用 Jinja 模板
bash_task = BashOperator(
    task_id='use_xcom',
    bash_command='echo "Count: {{ ti.xcom_pull(task_ids=\'push_task\', key=\'user_count\') }}"',
)

# 或使用简化语法
bash_task2 = BashOperator(
    task_id='use_xcom_simple',
    bash_command='echo "Result: {{ task_instance.xcom_pull(task_ids=\'push_task\') }}"',
)
```

### 自定义 XCom 后端

对于大数据量，可以使用自定义后端存储 XCom：

```python
# airflow.cfg
# xcom_backend = airflow.models.xcom.BaseXCom
# xcom_backend = my_module.S3XComBackend

from airflow.models.xcom import BaseXCom
import json

class S3XComBackend(BaseXCom):
    """将 XCom 数据存储到 S3"""

    @staticmethod
    def serialize_value(value):
        # 大数据存储到 S3，返回 S3 路径
        if isinstance(value, dict) and len(json.dumps(value)) > 10000:
            s3_path = upload_to_s3(value)
            return json.dumps({'_s3_path': s3_path})
        return json.dumps(value)

    @staticmethod
    def deserialize_value(result):
        data = json.loads(result.value)
        if isinstance(data, dict) and '_s3_path' in data:
            return download_from_s3(data['_s3_path'])
        return data
```

---

## Task Dependencies（任务依赖）

### 基本依赖设置

```python
from airflow.operators.empty import EmptyOperator

# 方式 1：使用位移运算符
task_a >> task_b >> task_c

# 方式 2：使用 set_downstream / set_upstream
task_a.set_downstream(task_b)
task_b.set_upstream(task_a)

# 并行任务
task_a >> [task_b, task_c] >> task_d

# 复杂依赖
start = EmptyOperator(task_id='start')
end = EmptyOperator(task_id='end')

task_a = EmptyOperator(task_id='task_a')
task_b = EmptyOperator(task_id='task_b')
task_c = EmptyOperator(task_id='task_c')

start >> task_a >> task_c
start >> task_b >> task_c
task_c >> end

# 等价于
start >> [task_a, task_b] >> task_c >> end
```

### 使用 TaskGroup 组织任务

```python
from airflow.utils.task_group import TaskGroup

with DAG(...) as dag:
    start = EmptyOperator(task_id='start')

    with TaskGroup(group_id='extract') as extract_group:
        extract_users = PythonOperator(task_id='users', ...)
        extract_orders = PythonOperator(task_id='orders', ...)
        extract_products = PythonOperator(task_id='products', ...)

    with TaskGroup(group_id='transform') as transform_group:
        transform_users = PythonOperator(task_id='users', ...)
        transform_orders = PythonOperator(task_id='orders', ...)

    with TaskGroup(group_id='load') as load_group:
        load_warehouse = PythonOperator(task_id='warehouse', ...)

    end = EmptyOperator(task_id='end')

    start >> extract_group >> transform_group >> load_group >> end
```

### 动态任务生成

```python
from airflow.decorators import dag, task

@dag(schedule_interval='@daily', start_date=datetime(2024, 1, 1))
def dynamic_dag():

    @task
    def get_data_sources():
        return ['source_a', 'source_b', 'source_c']

    @task
    def process_source(source: str):
        print(f"Processing {source}")
        return f"{source}_processed"

    @task
    def aggregate(results: list):
        print(f"Aggregating {len(results)} results")

    sources = get_data_sources()
    processed = process_source.expand(source=sources)  # 动态扩展
    aggregate(processed)

dag_instance = dynamic_dag()
```

### Trigger Rules（触发规则）

```python
from airflow.utils.trigger_rule import TriggerRule

# 所有上游成功（默认）
task_a = EmptyOperator(task_id='task_a', trigger_rule=TriggerRule.ALL_SUCCESS)

# 至少一个上游成功
task_b = EmptyOperator(task_id='task_b', trigger_rule=TriggerRule.ONE_SUCCESS)

# 所有上游完成（不管成功或失败）
task_c = EmptyOperator(task_id='task_c', trigger_rule=TriggerRule.ALL_DONE)

# 至少一个上游失败
task_d = EmptyOperator(task_id='task_d', trigger_rule=TriggerRule.ONE_FAILED)

# 所有上游失败
task_e = EmptyOperator(task_id='task_e', trigger_rule=TriggerRule.ALL_FAILED)

# 没有上游失败（包括跳过）
task_f = EmptyOperator(task_id='task_f', trigger_rule=TriggerRule.NONE_FAILED)

# 没有上游跳过
task_g = EmptyOperator(task_id='task_g', trigger_rule=TriggerRule.NONE_SKIPPED)

# 常用场景：清理任务
cleanup = PythonOperator(
    task_id='cleanup',
    python_callable=cleanup_function,
    trigger_rule=TriggerRule.ALL_DONE,  # 无论成功失败都执行清理
)

[task_a, task_b, task_c] >> cleanup
```

---

## 调度与执行

### 理解 execution_date

```python
# execution_date 是数据区间的开始时间，不是实际执行时间
# 例如：每日调度 @daily
# execution_date = 2024-01-15 00:00:00
# 实际执行时间 = 2024-01-16 00:00:00 (下一个调度点)

with DAG(
    dag_id='daily_etl',
    schedule_interval='@daily',
    start_date=datetime(2024, 1, 1),
) as dag:

    task = BashOperator(
        task_id='show_dates',
        bash_command='''
            echo "execution_date: {{ ds }}"
            echo "next_execution_date: {{ next_ds }}"
            echo "prev_execution_date: {{ prev_ds }}"
            echo "data_interval_start: {{ data_interval_start }}"
            echo "data_interval_end: {{ data_interval_end }}"
        ''',
    )
```

### 常用模板变量

```python
# 日期相关
{{ ds }}                    # execution_date，格式 YYYY-MM-DD
{{ ds_nodash }}             # 格式 YYYYMMDD
{{ ts }}                    # 完整时间戳
{{ ts_nodash }}             # 无分隔符时间戳
{{ execution_date }}        # DateTime 对象
{{ next_ds }}               # 下一个 execution_date
{{ prev_ds }}               # 上一个 execution_date
{{ data_interval_start }}   # 数据区间开始（Airflow 2.2+）
{{ data_interval_end }}     # 数据区间结束（Airflow 2.2+）

# DAG 和任务相关
{{ dag.dag_id }}            # DAG ID
{{ task.task_id }}          # 任务 ID
{{ task_instance }}         # 任务实例对象
{{ ti }}                    # task_instance 别名
{{ run_id }}                # DAG 运行 ID
{{ dag_run }}               # DAG 运行对象

# 参数和配置
{{ params.my_param }}       # 任务参数
{{ var.value.my_var }}      # Airflow 变量
{{ var.json.my_json.key }}  # JSON 变量
{{ conn.my_conn.host }}     # 连接信息

# 宏函数
{{ macros.ds_add(ds, 7) }}  # 日期加 7 天
{{ macros.ds_format(ds, "%Y-%m-%d", "%Y/%m/%d") }}  # 日期格式转换
{{ macros.datetime }}       # datetime 模块
{{ macros.timedelta }}      # timedelta
{{ macros.uuid }}           # uuid 模块
```

### 回填（Backfill）

```python
# CLI 回填
# airflow dags backfill -s 2024-01-01 -e 2024-01-31 my_dag

# 防止意外回填
with DAG(
    dag_id='no_backfill_dag',
    catchup=False,  # 禁用自动回填
    start_date=datetime(2024, 1, 1),
) as dag:
    ...

# 限制并行回填
with DAG(
    dag_id='limited_backfill',
    max_active_runs=3,  # 限制同时运行的实例数
) as dag:
    ...
```

---

## 最佳实践

### DAG 设计原则

```python
# 遵循原子性：每个任务应该是独立的、可重试的
# 错误示例：一个任务做太多事情
def do_everything():
    extract_data()
    transform_data()
    load_data()
    send_notification()

# 正确示例：拆分为多个任务
extract >> transform >> load >> notify
```

### 幂等性设计

```python
# 确保任务可以安全重试
def idempotent_load(**context):
    execution_date = context['ds']

    # 先删除已存在的数据，再插入
    hook = PostgresHook('my_postgres')
    hook.run(f"DELETE FROM daily_stats WHERE date = '{execution_date}'")
    hook.run(f"""
        INSERT INTO daily_stats (date, value)
        SELECT '{execution_date}', COUNT(*)
        FROM events
        WHERE event_date = '{execution_date}'
    """)
```

### 错误处理与告警

```python
from airflow.operators.python import PythonOperator
from airflow.exceptions import AirflowException

def task_with_error_handling(**context):
    try:
        # 业务逻辑
        result = process_data()
        if result['status'] != 'success':
            raise AirflowException(f"Processing failed: {result['error']}")
        return result
    except Exception as e:
        # 记录详细错误信息
        context['ti'].xcom_push(key='error_details', value=str(e))
        raise

def on_failure_callback(context):
    """任务失败回调"""
    task_instance = context['task_instance']
    dag_id = context['dag'].dag_id
    task_id = task_instance.task_id
    execution_date = context['execution_date']
    error = context.get('exception')

    # 发送告警
    send_alert(
        subject=f"Airflow Task Failed: {dag_id}.{task_id}",
        body=f"""
        DAG: {dag_id}
        Task: {task_id}
        Execution Date: {execution_date}
        Error: {error}
        Log URL: {task_instance.log_url}
        """
    )

with DAG(
    dag_id='dag_with_callbacks',
    default_args={
        'on_failure_callback': on_failure_callback,
        'on_retry_callback': on_retry_callback,
        'on_success_callback': on_success_callback,
    },
) as dag:
    ...
```

### 资源管理

```python
from airflow.operators.python import PythonOperator
from airflow.models import Pool

# 使用 Pool 限制并发
# 通过 UI 或 CLI 创建 Pool
# airflow pools set my_pool 5 "My pool description"

heavy_task = PythonOperator(
    task_id='heavy_task',
    python_callable=heavy_function,
    pool='my_pool',           # 使用 Pool
    pool_slots=2,             # 占用的槽位数
    priority_weight=10,       # 优先级
    queue='high_priority',    # 队列（Celery）
)
```

### 测试 DAG

```python
# tests/test_my_dag.py
import pytest
from airflow.models import DagBag

@pytest.fixture
def dagbag():
    return DagBag(include_examples=False)

def test_dag_loaded(dagbag):
    """测试 DAG 能否正确加载"""
    dag = dagbag.get_dag('my_dag')
    assert dag is not None
    assert len(dag.tasks) > 0

def test_dag_structure(dagbag):
    """测试 DAG 结构"""
    dag = dagbag.get_dag('my_dag')
    assert 'extract' in [t.task_id for t in dag.tasks]
    assert 'transform' in [t.task_id for t in dag.tasks]
    assert 'load' in [t.task_id for t in dag.tasks]

def test_task_dependencies(dagbag):
    """测试任务依赖"""
    dag = dagbag.get_dag('my_dag')
    extract = dag.get_task('extract')
    transform = dag.get_task('transform')

    assert transform in extract.downstream_list

# 单元测试任务函数
def test_process_function():
    """测试处理函数"""
    from dags.my_dag import process_data

    result = process_data(test_input)
    assert result['status'] == 'success'
    assert result['count'] > 0
```

### 生产环境配置

```python
# airflow.cfg 关键配置

# 调度器
[scheduler]
scheduler_heartbeat_sec = 5
min_file_process_interval = 30
dag_dir_list_interval = 300

# 性能
[core]
parallelism = 32                    # 全局并行任务数
dag_concurrency = 16                # 每个 DAG 并行任务数
max_active_runs_per_dag = 16        # 每个 DAG 并行运行实例数

# 日志
[logging]
remote_logging = True
remote_base_log_folder = s3://my-bucket/airflow/logs
remote_log_conn_id = my_s3

# 监控
[metrics]
statsd_on = True
statsd_host = statsd.example.com
statsd_port = 8125
statsd_prefix = airflow
```

---

## 完整示例：生产级 ETL 管道

```python
"""
生产级 ETL 管道示例
包含错误处理、重试、监控和数据质量检查
"""
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator, BranchPythonOperator
from airflow.operators.empty import EmptyOperator
from airflow.providers.postgres.operators.postgres import PostgresOperator
from airflow.providers.postgres.hooks.postgres import PostgresHook
from airflow.sensors.sql import SqlSensor
from airflow.utils.task_group import TaskGroup
from airflow.utils.trigger_rule import TriggerRule
from airflow.exceptions import AirflowException

# 默认参数
default_args = {
    'owner': 'data_engineering',
    'depends_on_past': False,
    'email': ['data-alerts@company.com'],
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
    'retry_exponential_backoff': True,
    'max_retry_delay': timedelta(minutes=30),
    'execution_timeout': timedelta(hours=2),
    'sla': timedelta(hours=4),
}

def on_failure_callback(context):
    """失败回调：发送告警"""
    # 发送到 Slack/PagerDuty 等
    pass

def extract_from_source(source_name: str, **context):
    """从源系统提取数据"""
    hook = PostgresHook(postgres_conn_id=f'{source_name}_db')
    execution_date = context['ds']

    df = hook.get_pandas_df(f"""
        SELECT * FROM events
        WHERE event_date = '{execution_date}'
    """)

    if df.empty:
        raise AirflowException(f"No data found for {execution_date}")

    # 保存到临时存储
    output_path = f'/tmp/airflow/{source_name}_{execution_date}.parquet'
    df.to_parquet(output_path, index=False)

    return {'path': output_path, 'row_count': len(df)}

def transform_data(**context):
    """转换数据"""
    import pandas as pd

    ti = context['ti']
    extract_results = ti.xcom_pull(task_ids=[
        'extract.source_a',
        'extract.source_b',
    ])

    dfs = []
    for result in extract_results:
        df = pd.read_parquet(result['path'])
        dfs.append(df)

    combined = pd.concat(dfs, ignore_index=True)

    # 数据清洗和转换
    combined['processed_at'] = datetime.now()
    combined = combined.drop_duplicates(subset=['event_id'])

    output_path = f'/tmp/airflow/transformed_{context["ds"]}.parquet'
    combined.to_parquet(output_path, index=False)

    return {'path': output_path, 'row_count': len(combined)}

def check_data_quality(**context):
    """数据质量检查"""
    ti = context['ti']
    transform_result = ti.xcom_pull(task_ids='transform')

    import pandas as pd
    df = pd.read_parquet(transform_result['path'])

    # 检查空值
    null_counts = df.isnull().sum()
    critical_nulls = null_counts[null_counts > 0]

    if not critical_nulls.empty:
        ti.xcom_push(key='quality_issues', value=critical_nulls.to_dict())
        return 'handle_quality_issues'

    return 'load_to_warehouse'

def load_to_warehouse(**context):
    """加载到数据仓库"""
    ti = context['ti']
    transform_result = ti.xcom_pull(task_ids='transform')

    import pandas as pd
    df = pd.read_parquet(transform_result['path'])

    hook = PostgresHook(postgres_conn_id='warehouse_db')

    # 先删除已存在的数据（幂等性）
    hook.run(f"DELETE FROM warehouse.events WHERE date = '{context['ds']}'")

    # 插入新数据
    df.to_sql(
        'events',
        hook.get_sqlalchemy_engine(),
        schema='warehouse',
        if_exists='append',
        index=False,
        method='multi',
        chunksize=10000,
    )

    return {'loaded_rows': len(df)}

with DAG(
    dag_id='production_etl_pipeline',
    default_args=default_args,
    description='生产级 ETL 数据管道',
    schedule_interval='0 2 * * *',
    start_date=datetime(2024, 1, 1),
    catchup=False,
    max_active_runs=1,
    tags=['etl', 'production', 'daily'],
    doc_md="""
    ## 生产 ETL 管道

    ### 概述
    每日从多个数据源提取数据，转换后加载到数据仓库。

    ### 依赖
    - source_a_db: 源数据库 A
    - source_b_db: 源数据库 B
    - warehouse_db: 目标数据仓库

    ### SLA
    - 预期完成时间: 06:00 UTC
    - 告警阈值: 04:00 UTC
    """,
    on_failure_callback=on_failure_callback,
) as dag:

    start = EmptyOperator(task_id='start')

    # 等待上游数据就绪
    wait_for_data = SqlSensor(
        task_id='wait_for_upstream_data',
        conn_id='source_a_db',
        sql="SELECT COUNT(*) FROM events WHERE event_date = '{{ ds }}'",
        success=lambda x: x[0][0] > 0,
        poke_interval=300,
        timeout=3600,
        mode='reschedule',
    )

    # 提取任务组
    with TaskGroup(group_id='extract') as extract_group:
        extract_a = PythonOperator(
            task_id='source_a',
            python_callable=extract_from_source,
            op_kwargs={'source_name': 'source_a'},
            pool='db_connections',
        )

        extract_b = PythonOperator(
            task_id='source_b',
            python_callable=extract_from_source,
            op_kwargs={'source_name': 'source_b'},
            pool='db_connections',
        )

    # 转换
    transform = PythonOperator(
        task_id='transform',
        python_callable=transform_data,
    )

    # 数据质量检查（分支）
    quality_check = BranchPythonOperator(
        task_id='quality_check',
        python_callable=check_data_quality,
    )

    # 质量问题处理
    handle_quality = PythonOperator(
        task_id='handle_quality_issues',
        python_callable=lambda **ctx: print("Handling quality issues..."),
    )

    # 加载
    load = PythonOperator(
        task_id='load_to_warehouse',
        python_callable=load_to_warehouse,
        pool='warehouse_loads',
    )

    # 验证
    verify = PostgresOperator(
        task_id='verify_load',
        postgres_conn_id='warehouse_db',
        sql="""
            SELECT
                CASE
                    WHEN COUNT(*) > 0 THEN 'PASS'
                    ELSE 'FAIL'
                END as status
            FROM warehouse.events
            WHERE date = '{{ ds }}'
        """,
        trigger_rule=TriggerRule.ONE_SUCCESS,
    )

    # 清理
    cleanup = PythonOperator(
        task_id='cleanup',
        python_callable=lambda **ctx: print("Cleaning up temp files..."),
        trigger_rule=TriggerRule.ALL_DONE,
    )

    end = EmptyOperator(
        task_id='end',
        trigger_rule=TriggerRule.NONE_FAILED_MIN_ONE_SUCCESS,
    )

    # 定义依赖
    start >> wait_for_data >> extract_group >> transform >> quality_check
    quality_check >> [handle_quality, load]
    [handle_quality, load] >> verify >> cleanup >> end
```

---

## 监控与运维

### 健康检查命令

```bash
# 检查调度器状态
airflow jobs check --job-type SchedulerJob --hostname $(hostname)

# 检查元数据库连接
airflow db check

# 列出活跃的 DAG
airflow dags list

# 检查 DAG 运行状态
airflow dags list-runs -d my_dag

# 查看任务日志
airflow tasks logs my_dag my_task 2024-01-15
```

### Prometheus 指标

```python
# 配置 StatsD 导出器
[metrics]
statsd_on = True
statsd_host = localhost
statsd_port = 8125
statsd_prefix = airflow

# 常用监控指标
# airflow.scheduler.heartbeat - 调度器心跳
# airflow.dag_processing.total_parse_time - DAG 解析时间
# airflow.executor.running_tasks - 运行中的任务数
# airflow.executor.queued_tasks - 队列中的任务数
# airflow.ti.successes - 成功的任务实例
# airflow.ti.failures - 失败的任务实例
```

---

## 总结

Apache Airflow 是现代数据工程的核心组件，提供了强大的工作流编排能力。关键要点包括：

1. **架构理解**：掌握 Scheduler、Worker、Web Server 等组件的作用
2. **DAG 设计**：使用 Python 代码定义清晰的任务依赖关系
3. **Operator 选择**：根据任务类型选择合适的 Operator
4. **Sensor 使用**：合理使用 Sensor 等待外部条件
5. **任务通信**：使用 XCom 在任务间传递数据
6. **最佳实践**：遵循幂等性、原子性等设计原则
7. **监控运维**：建立完善的监控和告警机制

通过本指南的学习，你应该能够使用 Airflow 构建生产级的数据管道，实现可靠的数据处理和调度。
