---
title: Databricks 统一数据分析平台
description: 探索 Databricks Lakehouse 平台的数据工程和机器学习能力
track: data
section: analytics-engines
difficulty: intermediate
tags:
  - Databricks
  - Spark
  - 数据湖
  - 机器学习
status: imported
origin: old/src/content/docs/data/databricks.zh.md
divergence: 0.13
issues: []
legacy:
  category: Data
  subcategory: Analytics Platform
  order: 16
  lastUpdated: 2026-01-07
---

Databricks 是由 Apache Spark 的创始人创建的统一数据分析平台，它将数据工程、数据科学和机器学习融合在一个协作环境中。作为业界领先的 Lakehouse（湖仓一体）平台，Databricks 让团队能够在云端高效处理大规模数据、构建机器学习模型，并实现从数据到洞察的全流程自动化。

## Databricks 工作区 (Workspace)

### 工作区概述

Databricks 工作区是一个统一的协作环境，为数据工程师、数据科学家和业务分析师提供了完整的数据处理能力。工作区将所有资源集中管理，包括 Notebooks、数据、集群、作业和模型。

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Databricks 工作区架构                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        用户界面层                                     │   │
│  │   Workspace │ Repos │ Data │ Compute │ Workflows │ Machine Learning  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        协作与开发层                                    │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        │   │
│  │  │ Notebooks │  │  Repos    │  │  Queries  │  │  Alerts   │        │   │
│  │  │ 交互开发   │  │ Git集成   │  │ SQL编辑器 │  │  监控告警  │        │   │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        数据治理层 (Unity Catalog)                     │   │
│  │       Catalogs → Schemas → Tables/Views/Functions/Models             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 工作区组织结构

```python
"""
Databricks 工作区目录结构示例：

/Workspace
├── /Users
│   ├── /user1@company.com
│   │   ├── /Projects
│   │   │   ├── ETL_Pipeline.py
│   │   │   └── ML_Training.py
│   │   └── /Experiments
│   └── /user2@company.com
├── /Shared
│   ├── /Common_Libraries
│   ├── /Utilities
│   └── /Templates
├── /Repos
│   ├── /user1@company.com
│   │   └── /data-engineering
│   └── /user2@company.com
│       └── /ml-models
└── /Settings
    ├── /Admin Console
    └── /Workspace Settings
"""

# 使用 dbutils 管理工作区文件
# 列出工作区目录
dbutils.notebook.list("/Workspace/Users/user@company.com/")

# 获取当前 Notebook 路径
current_path = dbutils.notebook.entry_point.getDbutils() \
    .notebook().getContext().notebookPath().get()
print(f"当前 Notebook: {current_path}")

# 运行其他 Notebook
result = dbutils.notebook.run(
    "/Shared/Utilities/common_functions",
    timeout_seconds=600,
    arguments={"param1": "value1"}
)
print(f"执行结果: {result}")
```

### 工作区权限管理

```python
# 工作区权限级别说明
"""
权限级别（从低到高）：
1. NO PERMISSIONS - 无权限
2. CAN READ - 可读取
3. CAN RUN - 可运行（Notebooks）
4. CAN EDIT - 可编辑
5. CAN MANAGE - 完全管理权限

文件夹权限继承：
- 子文件夹默认继承父文件夹权限
- 可以在子级别覆盖权限设置
"""

# 使用 REST API 管理权限
import requests
import json

DATABRICKS_HOST = "https://your-workspace.cloud.databricks.com"
DATABRICKS_TOKEN = "your-access-token"

headers = {
    "Authorization": f"Bearer {DATABRICKS_TOKEN}",
    "Content-Type": "application/json"
}

# 获取对象权限
def get_permissions(object_type, object_id):
    """获取工作区对象的权限设置"""
    response = requests.get(
        f"{DATABRICKS_HOST}/api/2.0/permissions/{object_type}/{object_id}",
        headers=headers
    )
    return response.json()

# 设置权限
def set_permissions(object_type, object_id, access_control_list):
    """设置工作区对象的权限"""
    response = requests.put(
        f"{DATABRICKS_HOST}/api/2.0/permissions/{object_type}/{object_id}",
        headers=headers,
        json={"access_control_list": access_control_list}
    )
    return response.json()

# 示例：为 Notebook 设置权限
notebook_permissions = [
    {
        "user_name": "analyst@company.com",
        "permission_level": "CAN_RUN"
    },
    {
        "group_name": "data_engineers",
        "permission_level": "CAN_EDIT"
    }
]

# 注意：object_id 是工作区路径或 ID
# set_permissions("notebooks", notebook_id, notebook_permissions)
```

## Notebooks 交互式开发

### Notebook 基础操作

Databricks Notebooks 是一个强大的交互式开发环境，支持多种编程语言，并提供丰富的可视化功能。

```python
# ============================================
# Notebook 魔术命令详解
# ============================================

# %python - Python 代码（默认语言）
print("Hello from Python!")
df = spark.range(10)
display(df)

# %sql - 直接执行 SQL 查询
# %sql
# SELECT * FROM my_database.my_table LIMIT 10

# %scala - Scala 代码
# %scala
# val df = spark.read.format("delta").load("/data/table")
# df.show()

# %r - R 语言代码
# %r
# library(SparkR)
# df <- read.df("/data/table", source = "delta")
# head(df)

# %md - Markdown 文档（支持 LaTeX 数学公式）
# %md
# # 数据分析报告
# ## 概述
# 这是一份关于 **销售数据** 的分析报告。
#
# 数学公式示例：$E = mc^2$

# %run - 运行另一个 Notebook（导入函数和变量）
# %run /Users/user@company.com/Shared/utilities

# %fs - 文件系统操作
# %fs ls /databricks-datasets/

# %sh - Shell 命令
# %sh
# pip list | grep pandas
# echo "当前目录: $(pwd)"

# %pip - Python 包管理（推荐方式）
# %pip install plotly==5.18.0
```

### Notebook 数据探索

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *

# spark 变量在 Databricks 中已预定义
# 读取示例数据集
df = spark.read.format("csv") \
    .option("header", "true") \
    .option("inferSchema", "true") \
    .load("/databricks-datasets/retail-org/customers/")

# 基本数据探索
print(f"总记录数: {df.count():,}")
print(f"列数: {len(df.columns)}")
print(f"分区数: {df.rdd.getNumPartitions()}")

# 查看 Schema
df.printSchema()

# 使用 Databricks 增强的 display 函数
# display() 支持：
# - 自动分页
# - 多种图表类型
# - 数据下载
# - 列排序和筛选
display(df.limit(100))

# 查看数据统计摘要
display(df.describe())

# 查看唯一值分布
display(
    df.groupBy("customer_segment")
    .count()
    .orderBy(desc("count"))
)

# 数据质量检查
null_counts = df.select([
    sum(col(c).isNull().cast("int")).alias(c)
    for c in df.columns
])
display(null_counts)
```

### Notebook 小组件 (Widgets)

```python
# ============================================
# 创建交互式小组件
# ============================================

# 文本输入框
dbutils.widgets.text(
    name="start_date",
    defaultValue="2024-01-01",
    label="开始日期"
)

dbutils.widgets.text(
    name="end_date",
    defaultValue="2024-12-31",
    label="结束日期"
)

# 下拉选择框
dbutils.widgets.dropdown(
    name="region",
    defaultValue="全部",
    choices=["全部", "华东", "华南", "华北", "西部", "东北"],
    label="选择区域"
)

# 多选框
dbutils.widgets.multiselect(
    name="product_categories",
    defaultValue="电子产品",
    choices=["电子产品", "服装", "食品", "家居", "图书"],
    label="产品类别"
)

# 组合框（可输入可选择）
dbutils.widgets.combobox(
    name="customer_id",
    defaultValue="",
    choices=["C001", "C002", "C003"],
    label="客户ID"
)

# 获取小组件值
start_date = dbutils.widgets.get("start_date")
end_date = dbutils.widgets.get("end_date")
region = dbutils.widgets.get("region")
categories = dbutils.widgets.get("product_categories").split(",")

print(f"日期范围: {start_date} 至 {end_date}")
print(f"区域: {region}")
print(f"类别: {categories}")

# 使用参数构建动态查询
query = f"""
SELECT
    transaction_date,
    region,
    category,
    SUM(amount) as total_amount
FROM sales.transactions
WHERE transaction_date BETWEEN '{start_date}' AND '{end_date}'
"""

if region != "全部":
    query += f"\n  AND region = '{region}'"

if categories:
    categories_str = "', '".join(categories)
    query += f"\n  AND category IN ('{categories_str}')"

query += "\nGROUP BY 1, 2, 3\nORDER BY 1, 2, 3"

print("生成的查询:")
print(query)

# result_df = spark.sql(query)
# display(result_df)

# 清理小组件
# dbutils.widgets.remove("start_date")
# dbutils.widgets.removeAll()
```

### Notebook 可视化

```python
import matplotlib.pyplot as plt
import pandas as pd

# 使用 Databricks 原生 display() 图表
# 执行后可在 UI 中选择图表类型
df_viz = spark.sql("""
    SELECT
        date_trunc('month', transaction_date) as month,
        category,
        SUM(amount) as total_sales
    FROM sales.transactions
    WHERE transaction_date >= '2023-01-01'
    GROUP BY 1, 2
    ORDER BY 1, 2
""")

display(df_viz)  # 点击图表图标选择可视化类型

# 使用 Matplotlib
pdf = df_viz.toPandas()
pivot_df = pdf.pivot(index='month', columns='category', values='total_sales')

fig, axes = plt.subplots(2, 2, figsize=(14, 10))

# 折线图
pivot_df.plot(kind='line', ax=axes[0, 0], marker='o')
axes[0, 0].set_title('月度销售趋势')
axes[0, 0].set_xlabel('月份')
axes[0, 0].set_ylabel('销售额')
axes[0, 0].legend(title='类别', loc='upper left')
axes[0, 0].tick_params(axis='x', rotation=45)

# 堆叠柱状图
pivot_df.plot(kind='bar', stacked=True, ax=axes[0, 1])
axes[0, 1].set_title('月度销售构成')
axes[0, 1].tick_params(axis='x', rotation=45)

# 饼图
total_by_category = pdf.groupby('category')['total_sales'].sum()
axes[1, 0].pie(total_by_category.values, labels=total_by_category.index,
               autopct='%1.1f%%', startangle=90)
axes[1, 0].set_title('销售额占比')

# 热力图
import numpy as np
heatmap_data = pivot_df.values
im = axes[1, 1].imshow(heatmap_data, cmap='YlOrRd', aspect='auto')
axes[1, 1].set_xticks(range(len(pivot_df.columns)))
axes[1, 1].set_xticklabels(pivot_df.columns, rotation=45)
axes[1, 1].set_yticks(range(len(pivot_df.index)))
axes[1, 1].set_yticklabels([str(idx)[:7] for idx in pivot_df.index])
axes[1, 1].set_title('销售热力图')
plt.colorbar(im, ax=axes[1, 1])

plt.tight_layout()
display(fig)

# 使用 Plotly（交互式图表）
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots

# 交互式折线图
fig = px.line(pdf, x='month', y='total_sales', color='category',
              title='销售趋势分析（交互式）',
              labels={'month': '月份', 'total_sales': '销售额', 'category': '类别'})
fig.update_layout(hovermode='x unified')
display(fig)

# 交互式桑基图示例
fig_sankey = go.Figure(data=[go.Sankey(
    node=dict(
        pad=15,
        thickness=20,
        line=dict(color="black", width=0.5),
        label=["华东", "华南", "华北", "电子产品", "服装", "食品"],
        color=["blue", "green", "red", "purple", "orange", "cyan"]
    ),
    link=dict(
        source=[0, 0, 0, 1, 1, 1, 2, 2, 2],
        target=[3, 4, 5, 3, 4, 5, 3, 4, 5],
        value=[100, 80, 60, 90, 70, 50, 70, 60, 40]
    )
)])
fig_sankey.update_layout(title_text="区域-类别销售流向", font_size=12)
display(fig_sankey)
```

## 集群 (Clusters)

### 集群类型详解

```python
"""
Databricks 集群类型：

1. All-Purpose Clusters（通用集群）
   - 适用于交互式分析、开发和调试
   - 支持多用户共享
   - 按运行时间计费
   - 可手动或自动启停

2. Job Clusters（作业集群）
   - 专门用于运行自动化作业
   - 作业完成后自动终止
   - 成本更低（通常配合 Spot 实例）
   - 每个作业独立的集群

3. SQL Warehouses（SQL 仓库）
   - 专用于 SQL 查询和 BI 工具连接
   - 支持 Serverless 模式
   - 自动扩缩容
   - 优化的 SQL 执行引擎
"""
```

### 集群配置与创建

```python
import requests
import json

# 开发/探索集群配置
dev_cluster_config = {
    "cluster_name": "dev-exploration-cluster",
    "spark_version": "14.3.x-scala2.12",  # 使用最新稳定版本
    "node_type_id": "m5.xlarge",
    "num_workers": 0,  # 单节点模式
    "spark_conf": {
        "spark.databricks.cluster.profile": "singleNode",
        "spark.master": "local[*]"
    },
    "autotermination_minutes": 30,  # 30分钟无活动自动终止
    "custom_tags": {
        "environment": "development",
        "team": "data-engineering",
        "cost_center": "DE-001"
    }
}

# 数据处理集群配置（自动扩缩容）
etl_cluster_config = {
    "cluster_name": "etl-processing-cluster",
    "spark_version": "14.3.x-scala2.12",
    "node_type_id": "r5.2xlarge",  # 内存优化实例
    "driver_node_type_id": "r5.xlarge",
    "autoscale": {
        "min_workers": 2,
        "max_workers": 10
    },
    "spark_conf": {
        "spark.sql.shuffle.partitions": "auto",
        "spark.sql.adaptive.enabled": "true",
        "spark.sql.adaptive.coalescePartitions.enabled": "true",
        "spark.databricks.delta.optimizeWrite.enabled": "true",
        "spark.databricks.delta.autoCompact.enabled": "true"
    },
    "aws_attributes": {
        "availability": "SPOT_WITH_FALLBACK",
        "spot_bid_price_percent": 100,
        "first_on_demand": 1  # Driver 使用按需实例
    },
    "autotermination_minutes": 60,
    "enable_elastic_disk": True,
    "custom_tags": {
        "environment": "production",
        "workload": "etl"
    }
}

# 机器学习集群配置（GPU）
ml_cluster_config = {
    "cluster_name": "ml-training-cluster",
    "spark_version": "14.3.x-gpu-ml-scala2.12",  # GPU ML Runtime
    "node_type_id": "p3.2xlarge",  # GPU 实例
    "driver_node_type_id": "p3.2xlarge",
    "num_workers": 4,
    "spark_conf": {
        "spark.task.resource.gpu.amount": "1",
        "spark.databricks.delta.preview.enabled": "true"
    },
    "aws_attributes": {
        "ebs_volume_type": "GENERAL_PURPOSE_SSD",
        "ebs_volume_count": 1,
        "ebs_volume_size": 200
    },
    "custom_tags": {
        "environment": "production",
        "workload": "ml-training"
    }
}

# Photon 加速集群配置
photon_cluster_config = {
    "cluster_name": "photon-analytics-cluster",
    "spark_version": "14.3.x-photon-scala2.12",  # Photon Runtime
    "runtime_engine": "PHOTON",
    "node_type_id": "i3.2xlarge",  # 存储优化实例
    "autoscale": {
        "min_workers": 2,
        "max_workers": 8
    },
    "spark_conf": {
        "spark.sql.shuffle.partitions": "auto"
    }
}

# 创建集群
def create_cluster(config):
    response = requests.post(
        f"{DATABRICKS_HOST}/api/2.0/clusters/create",
        headers=headers,
        json=config
    )
    if response.status_code == 200:
        cluster_id = response.json()["cluster_id"]
        print(f"集群创建成功: {cluster_id}")
        return cluster_id
    else:
        print(f"创建失败: {response.text}")
        return None

# cluster_id = create_cluster(etl_cluster_config)
```

### 集群管理操作

```python
# 集群管理工具类
class ClusterManager:
    def __init__(self, host, token):
        self.host = host
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

    def list_clusters(self):
        """列出所有集群"""
        response = requests.get(
            f"{self.host}/api/2.0/clusters/list",
            headers=self.headers
        )
        clusters = response.json().get("clusters", [])
        for cluster in clusters:
            print(f"名称: {cluster['cluster_name']}")
            print(f"  ID: {cluster['cluster_id']}")
            print(f"  状态: {cluster['state']}")
            print(f"  类型: {cluster.get('cluster_source', 'N/A')}")
            print()
        return clusters

    def get_cluster_status(self, cluster_id):
        """获取集群详细状态"""
        response = requests.get(
            f"{self.host}/api/2.0/clusters/get",
            headers=self.headers,
            params={"cluster_id": cluster_id}
        )
        return response.json()

    def start_cluster(self, cluster_id):
        """启动集群"""
        response = requests.post(
            f"{self.host}/api/2.0/clusters/start",
            headers=self.headers,
            json={"cluster_id": cluster_id}
        )
        return response.json()

    def terminate_cluster(self, cluster_id):
        """终止集群"""
        response = requests.post(
            f"{self.host}/api/2.0/clusters/delete",
            headers=self.headers,
            json={"cluster_id": cluster_id}
        )
        return response.json()

    def resize_cluster(self, cluster_id, num_workers):
        """调整集群大小"""
        response = requests.post(
            f"{self.host}/api/2.0/clusters/resize",
            headers=self.headers,
            json={
                "cluster_id": cluster_id,
                "num_workers": num_workers
            }
        )
        return response.json()

    def get_cluster_events(self, cluster_id, limit=50):
        """获取集群事件日志"""
        response = requests.post(
            f"{self.host}/api/2.0/clusters/events",
            headers=self.headers,
            json={
                "cluster_id": cluster_id,
                "limit": limit
            }
        )
        return response.json()

    def wait_for_cluster(self, cluster_id, target_state="RUNNING", timeout=600):
        """等待集群达到目标状态"""
        import time
        start_time = time.time()

        while time.time() - start_time < timeout:
            status = self.get_cluster_status(cluster_id)
            current_state = status["state"]
            print(f"当前状态: {current_state}")

            if current_state == target_state:
                print(f"集群已达到目标状态: {target_state}")
                return True
            elif current_state in ["ERROR", "TERMINATED"]:
                print(f"集群进入异常状态: {current_state}")
                return False

            time.sleep(30)

        print("等待超时")
        return False

# 使用示例
# manager = ClusterManager(DATABRICKS_HOST, DATABRICKS_TOKEN)
# manager.list_clusters()
# manager.start_cluster("cluster-id")
# manager.wait_for_cluster("cluster-id", "RUNNING")
```

### 集群策略 (Cluster Policies)

```python
# 集群策略用于限制和标准化集群配置
cluster_policy = {
    "name": "standard-data-engineering-policy",
    "definition": json.dumps({
        # 限制 Spark 版本
        "spark_version": {
            "type": "allowlist",
            "values": ["14.3.x-scala2.12", "13.3.x-scala2.12"],
            "defaultValue": "14.3.x-scala2.12"
        },
        # 限制节点类型
        "node_type_id": {
            "type": "allowlist",
            "values": ["m5.large", "m5.xlarge", "m5.2xlarge", "r5.xlarge", "r5.2xlarge"]
        },
        # 限制最大 Worker 数量
        "autoscale.max_workers": {
            "type": "range",
            "maxValue": 20,
            "defaultValue": 8
        },
        # 强制设置自动终止
        "autotermination_minutes": {
            "type": "range",
            "minValue": 10,
            "maxValue": 120,
            "defaultValue": 60
        },
        # 强制使用 Spot 实例
        "aws_attributes.availability": {
            "type": "fixed",
            "value": "SPOT_WITH_FALLBACK"
        },
        # 强制添加标签
        "custom_tags.environment": {
            "type": "fixed",
            "value": "production"
        },
        "custom_tags.cost_center": {
            "type": "unlimited",
            "isOptional": False
        }
    })
}

# 创建集群策略
# response = requests.post(
#     f"{DATABRICKS_HOST}/api/2.0/policies/clusters/create",
#     headers=headers,
#     json=cluster_policy
# )
```

## Delta Lake 深度集成

### Delta Lake 基础操作

```python
from delta.tables import DeltaTable
from pyspark.sql.functions import *

# 创建 Delta 表
data = [
    (1, "张三", "技术部", 15000.00, "2024-01-15"),
    (2, "李四", "市场部", 12000.00, "2024-01-20"),
    (3, "王五", "财务部", 13000.00, "2024-02-01"),
    (4, "赵六", "技术部", 18000.00, "2024-02-15"),
    (5, "钱七", "人事部", 11000.00, "2024-03-01"),
]
columns = ["emp_id", "name", "department", "salary", "hire_date"]

df = spark.createDataFrame(data, columns)

# 方式1：保存为 Delta 表（托管表）
df.write.format("delta") \
    .mode("overwrite") \
    .saveAsTable("hr.employees")

# 方式2：保存为外部 Delta 表
df.write.format("delta") \
    .mode("overwrite") \
    .option("path", "/data/hr/employees") \
    .saveAsTable("hr.employees_external")

# 方式3：使用 SQL 创建表
spark.sql("""
    CREATE TABLE IF NOT EXISTS hr.departments (
        dept_id INT,
        dept_name STRING,
        manager_id INT,
        budget DECIMAL(15, 2),
        created_at TIMESTAMP,
        updated_at TIMESTAMP
    )
    USING DELTA
    PARTITIONED BY (dept_id)
    LOCATION '/data/hr/departments'
    TBLPROPERTIES (
        'delta.autoOptimize.optimizeWrite' = 'true',
        'delta.autoOptimize.autoCompact' = 'true',
        'delta.columnMapping.mode' = 'name',
        'delta.minReaderVersion' = '2',
        'delta.minWriterVersion' = '5'
    )
    COMMENT '部门信息表'
""")

# 读取 Delta 表
employees_df = spark.table("hr.employees")
display(employees_df)

# 也可以直接从路径读取
employees_df = spark.read.format("delta").load("/data/hr/employees")
```

### MERGE 操作（Upsert）

```python
from delta.tables import DeltaTable

# 获取目标表
target_table = DeltaTable.forName(spark, "hr.employees")

# 准备源数据（CDC 变更数据）
updates = [
    (1, "张三", "技术部", 16000.00, "2024-01-15"),  # 更新：涨薪
    (3, "王五", "研发部", 14000.00, "2024-02-01"),  # 更新：转岗
    (6, "孙八", "运营部", 10000.00, "2024-03-15"),  # 新增
    (7, "周九", "技术部", 20000.00, "2024-04-01"),  # 新增
]
updates_df = spark.createDataFrame(updates, columns)

# 执行 MERGE 操作
target_table.alias("target").merge(
    updates_df.alias("source"),
    "target.emp_id = source.emp_id"
).whenMatchedUpdate(
    condition="source.salary != target.salary OR source.department != target.department",
    set={
        "name": col("source.name"),
        "department": col("source.department"),
        "salary": col("source.salary"),
        "hire_date": col("source.hire_date")
    }
).whenNotMatchedInsert(
    values={
        "emp_id": col("source.emp_id"),
        "name": col("source.name"),
        "department": col("source.department"),
        "salary": col("source.salary"),
        "hire_date": col("source.hire_date")
    }
).execute()

# 验证结果
display(spark.table("hr.employees").orderBy("emp_id"))

# 复杂 MERGE 示例：SCD Type 2
spark.sql("""
    MERGE INTO hr.employees_scd2 AS target
    USING (
        SELECT
            emp_id,
            name,
            department,
            salary,
            hire_date,
            current_timestamp() as effective_date
        FROM hr.employees_staging
    ) AS source
    ON target.emp_id = source.emp_id AND target.is_current = true

    -- 当有变化时，关闭旧记录
    WHEN MATCHED AND (
        target.salary != source.salary OR
        target.department != source.department
    ) THEN UPDATE SET
        is_current = false,
        end_date = source.effective_date

    -- 插入新记录（包括新员工和变更后的记录）
    WHEN NOT MATCHED THEN INSERT (
        emp_id, name, department, salary, hire_date,
        effective_date, end_date, is_current
    ) VALUES (
        source.emp_id, source.name, source.department, source.salary,
        source.hire_date, source.effective_date, null, true
    )
""")
```

### 时间旅行 (Time Travel)

```python
# 查看表历史版本
history_df = spark.sql("DESCRIBE HISTORY hr.employees")
display(history_df)

# 通过版本号查询历史数据
df_v0 = spark.read.format("delta") \
    .option("versionAsOf", 0) \
    .table("hr.employees")
display(df_v0)

# 通过时间戳查询历史数据
df_historical = spark.sql("""
    SELECT * FROM hr.employees
    TIMESTAMP AS OF '2024-01-20 10:00:00'
""")
display(df_historical)

# 比较不同版本的数据
spark.sql("""
    -- 查看版本1相对于版本0的新增数据
    SELECT * FROM hr.employees VERSION AS OF 1
    EXCEPT
    SELECT * FROM hr.employees VERSION AS OF 0
""").show()

spark.sql("""
    -- 查看版本1相对于版本0的删除数据
    SELECT * FROM hr.employees VERSION AS OF 0
    EXCEPT
    SELECT * FROM hr.employees VERSION AS OF 1
""").show()

# 恢复到特定版本
spark.sql("RESTORE TABLE hr.employees TO VERSION AS OF 0")

# 恢复到特定时间点
spark.sql("""
    RESTORE TABLE hr.employees
    TO TIMESTAMP AS OF '2024-01-15 00:00:00'
""")

# 克隆表（浅克隆 - 不复制数据文件）
spark.sql("""
    CREATE TABLE hr.employees_clone
    SHALLOW CLONE hr.employees
    VERSION AS OF 5
""")

# 深度克隆（完整复制）
spark.sql("""
    CREATE TABLE hr.employees_backup
    DEEP CLONE hr.employees
""")
```

### 表优化与维护

```python
# OPTIMIZE - 文件压缩
# 将小文件合并成大文件，提高查询性能
spark.sql("OPTIMIZE hr.employees")

# 带条件的优化
spark.sql("""
    OPTIMIZE hr.employees
    WHERE hire_date >= '2024-01-01'
""")

# Z-ORDER - 数据布局优化
# 将相关数据物理上放在一起，提高查询效率
spark.sql("""
    OPTIMIZE hr.employees
    ZORDER BY (department, hire_date)
""")

# VACUUM - 清理历史文件
# 删除不再需要的旧数据文件
# 默认保留7天，防止正在运行的查询失败
spark.sql("VACUUM hr.employees RETAIN 168 HOURS")  # 7天

# 清理更短时间（需要先禁用安全检查 - 生产环境慎用）
# spark.conf.set("spark.databricks.delta.retentionDurationCheck.enabled", "false")
# spark.sql("VACUUM hr.employees RETAIN 0 HOURS")

# ANALYZE TABLE - 更新统计信息
spark.sql("ANALYZE TABLE hr.employees COMPUTE STATISTICS")
spark.sql("ANALYZE TABLE hr.employees COMPUTE STATISTICS FOR COLUMNS emp_id, salary, department")

# 查看表详细信息
display(spark.sql("DESCRIBE DETAIL hr.employees"))
display(spark.sql("DESCRIBE EXTENDED hr.employees"))

# 检查表健康状态
def check_delta_table_health(table_name):
    """检查 Delta 表健康状态"""
    detail = spark.sql(f"DESCRIBE DETAIL {table_name}").collect()[0]

    print(f"表名: {table_name}")
    print(f"位置: {detail['location']}")
    print(f"文件数: {detail['numFiles']}")
    print(f"数据大小: {detail['sizeInBytes'] / (1024**3):.2f} GB")
    print(f"分区列: {detail['partitionColumns']}")
    print(f"创建时间: {detail['createdAt']}")
    print(f"最后修改: {detail['lastModified']}")

    # 检查小文件问题
    files_info = spark.sql(f"""
        SELECT
            count(*) as file_count,
            avg(size) as avg_size,
            min(size) as min_size,
            max(size) as max_size
        FROM (
            DESCRIBE DETAIL {table_name}
        )
    """)

    return detail

# check_delta_table_health("hr.employees")
```

## Unity Catalog 数据治理

### Unity Catalog 架构

```
Unity Catalog 三级命名空间：

┌─────────────────────────────────────────────────────────────────┐
│                     Metastore (元存储)                           │
│                 账户级别，跨工作区共享                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │  Catalog    │    │  Catalog    │    │  Catalog    │         │
│  │  (prod)     │    │  (dev)      │    │  (staging)  │         │
│  │  生产环境    │    │  开发环境    │    │  预发布环境  │         │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘         │
│         │                  │                  │                 │
│  ┌──────┴──────┐    ┌──────┴──────┐    ┌──────┴──────┐         │
│  │   Schema    │    │   Schema    │    │   Schema    │         │
│  │  (sales)    │    │  (sales)    │    │  (sales)    │         │
│  └──────┬──────┘    └──────┴──────┘    └──────┴──────┘         │
│         │                                                       │
│  ┌──────┴───────────────────────────────────────────┐          │
│  │  Tables  │  Views  │  Functions  │  Models       │          │
│  │  表       │  视图    │  函数        │  ML模型      │          │
│  └──────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘

完整路径示例：prod.sales.transactions
             catalog.schema.table
```

### 创建和管理数据对象

```sql
-- 1. 创建 Catalog
CREATE CATALOG IF NOT EXISTS production
MANAGED LOCATION 's3://my-bucket/unity-catalog/production'
COMMENT '生产环境数据目录';

CREATE CATALOG IF NOT EXISTS development
COMMENT '开发环境数据目录';

-- 查看所有 Catalog
SHOW CATALOGS;

-- 2. 创建 Schema
USE CATALOG production;

CREATE SCHEMA IF NOT EXISTS sales
MANAGED LOCATION 's3://my-bucket/unity-catalog/production/sales'
COMMENT '销售业务数据';

CREATE SCHEMA IF NOT EXISTS hr
COMMENT '人力资源数据';

-- 查看 Schema
SHOW SCHEMAS IN production;

-- 3. 创建表
USE SCHEMA sales;

-- 托管表（Managed Table）
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id BIGINT GENERATED ALWAYS AS IDENTITY,
    customer_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT,
    unit_price DECIMAL(10, 2),
    total_amount DECIMAL(15, 2),
    transaction_date DATE,
    region STRING,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
USING DELTA
PARTITIONED BY (region)
COMMENT '销售交易明细表'
TBLPROPERTIES (
    'delta.autoOptimize.optimizeWrite' = 'true',
    'delta.autoOptimize.autoCompact' = 'true'
);

-- 外部表（External Table）
CREATE EXTERNAL TABLE IF NOT EXISTS external_logs (
    log_id BIGINT,
    timestamp TIMESTAMP,
    service STRING,
    level STRING,
    message STRING
)
USING DELTA
LOCATION 's3://external-bucket/logs/'
COMMENT '外部系统日志';

-- 4. 创建视图
CREATE OR REPLACE VIEW daily_sales_summary AS
SELECT
    transaction_date,
    region,
    COUNT(*) as transaction_count,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_order_value
FROM transactions
GROUP BY transaction_date, region;

-- 创建物化视图（需要 SQL Warehouse）
-- CREATE MATERIALIZED VIEW monthly_sales AS
-- SELECT ...

-- 5. 创建函数
CREATE OR REPLACE FUNCTION calculate_discount(
    amount DECIMAL(15, 2),
    discount_rate DECIMAL(5, 2)
)
RETURNS DECIMAL(15, 2)
COMMENT '计算折扣金额'
RETURN amount * (1 - discount_rate);

-- 使用函数
SELECT calculate_discount(1000.00, 0.15) as discounted_price;
```

### 权限管理

```sql
-- Unity Catalog 权限模型
-- 权限类型：
-- - USE CATALOG/SCHEMA: 使用 Catalog/Schema
-- - SELECT: 查询数据
-- - MODIFY: 插入、更新、删除数据
-- - CREATE: 创建子对象
-- - ALL PRIVILEGES: 所有权限

-- 1. Catalog 级别权限
GRANT USE CATALOG ON CATALOG production TO `data_analysts`;
GRANT CREATE SCHEMA ON CATALOG production TO `data_engineers`;
GRANT ALL PRIVILEGES ON CATALOG development TO `developers`;

-- 2. Schema 级别权限
GRANT USE SCHEMA ON SCHEMA production.sales TO `data_analysts`;
GRANT SELECT ON SCHEMA production.sales TO `data_analysts`;
GRANT CREATE TABLE ON SCHEMA production.sales TO `data_engineers`;
GRANT ALL PRIVILEGES ON SCHEMA production.sales TO `data_admins`;

-- 3. 表级别权限
GRANT SELECT ON TABLE production.sales.transactions TO `data_analysts`;
GRANT SELECT, MODIFY ON TABLE production.sales.transactions TO `data_engineers`;

-- 4. 列级别权限（通过视图实现）
CREATE OR REPLACE VIEW production.sales.transactions_masked AS
SELECT
    transaction_id,
    -- 敏感列脱敏
    CASE
        WHEN is_account_group_member('pii_access') THEN customer_id
        ELSE NULL
    END as customer_id,
    product_id,
    quantity,
    unit_price,
    total_amount,
    transaction_date,
    region
FROM production.sales.transactions;

GRANT SELECT ON VIEW production.sales.transactions_masked TO `business_users`;

-- 5. 行级别安全（Row-Level Security）
CREATE OR REPLACE FUNCTION production.sales.region_filter()
RETURNS BOOLEAN
RETURN
    is_account_group_member('global_access') OR
    (is_account_group_member('apac_team') AND region IN ('华东', '华南', '华北')) OR
    (is_account_group_member('emea_team') AND region = 'Europe');

ALTER TABLE production.sales.transactions
SET ROW FILTER production.sales.region_filter ON ();

-- 6. 列掩码（Column Masking）
CREATE OR REPLACE FUNCTION production.sales.mask_customer_id(customer_id BIGINT)
RETURNS BIGINT
RETURN CASE
    WHEN is_account_group_member('pii_access') THEN customer_id
    ELSE CAST(CONCAT('XXXX', RIGHT(CAST(customer_id AS STRING), 4)) AS BIGINT)
END;

ALTER TABLE production.sales.transactions
ALTER COLUMN customer_id SET MASK production.sales.mask_customer_id;

-- 7. 查看权限
SHOW GRANTS ON CATALOG production;
SHOW GRANTS ON SCHEMA production.sales;
SHOW GRANTS ON TABLE production.sales.transactions;
SHOW GRANTS TO `data_analysts`;

-- 8. 撤销权限
REVOKE SELECT ON TABLE production.sales.transactions FROM `data_analysts`;
```

### 数据血缘 (Data Lineage)

```python
# Unity Catalog 自动追踪数据血缘
# 血缘信息包括：表依赖关系、列级血缘、作业血缘

# 创建具有血缘关系的数据管道
spark.sql("""
    CREATE OR REPLACE TABLE production.sales.daily_aggregates AS
    SELECT
        t.transaction_date,
        t.region,
        p.category,
        COUNT(*) as order_count,
        SUM(t.total_amount) as revenue,
        COUNT(DISTINCT t.customer_id) as unique_customers
    FROM production.sales.transactions t
    JOIN production.catalog.products p ON t.product_id = p.product_id
    GROUP BY t.transaction_date, t.region, p.category
""")

spark.sql("""
    CREATE OR REPLACE TABLE production.sales.weekly_summary AS
    SELECT
        DATE_TRUNC('week', transaction_date) as week_start,
        region,
        category,
        SUM(order_count) as total_orders,
        SUM(revenue) as total_revenue,
        SUM(unique_customers) as total_unique_customers
    FROM production.sales.daily_aggregates
    GROUP BY 1, 2, 3
""")

# 通过 REST API 查询血缘信息
def get_table_lineage(table_full_name):
    """获取表的血缘信息"""
    # table_full_name 格式: catalog.schema.table
    response = requests.get(
        f"{DATABRICKS_HOST}/api/2.1/unity-catalog/lineage/table-lineage",
        headers=headers,
        params={"table_name": table_full_name}
    )
    return response.json()

def get_column_lineage(table_full_name, column_name):
    """获取列的血缘信息"""
    response = requests.get(
        f"{DATABRICKS_HOST}/api/2.1/unity-catalog/lineage/column-lineage",
        headers=headers,
        params={
            "table_name": table_full_name,
            "column_name": column_name
        }
    )
    return response.json()

# 示例使用
# lineage = get_table_lineage("production.sales.weekly_summary")
# print(json.dumps(lineage, indent=2, ensure_ascii=False))

# 血缘信息输出示例：
"""
{
    "upstreams": [
        {
            "tableInfo": {
                "catalog_name": "production",
                "schema_name": "sales",
                "name": "daily_aggregates"
            }
        }
    ],
    "downstreams": [
        {
            "tableInfo": {
                "catalog_name": "production",
                "schema_name": "reports",
                "name": "executive_dashboard"
            }
        }
    ]
}
"""
```

### 标签与分类

```sql
-- 1. 表标签
ALTER TABLE production.sales.transactions
SET TAGS ('data_classification' = 'confidential',
          'retention_days' = '365',
          'data_owner' = 'sales_team',
          'pii' = 'true');

-- 2. 列标签
ALTER TABLE production.sales.transactions
ALTER COLUMN customer_id SET TAGS ('pii' = 'true', 'sensitivity' = 'high');

ALTER TABLE production.sales.transactions
ALTER COLUMN total_amount SET TAGS ('sensitivity' = 'medium');

-- 3. 查看标签
DESCRIBE TABLE EXTENDED production.sales.transactions;

-- 4. 移除标签
ALTER TABLE production.sales.transactions
UNSET TAGS ('retention_days');

-- 5. 使用系统表查询带特定标签的表
SELECT
    catalog_name,
    schema_name,
    table_name,
    tag_name,
    tag_value
FROM system.information_schema.table_tags
WHERE tag_name = 'pii' AND tag_value = 'true';
```

## MLflow 机器学习集成

### MLflow 实验跟踪

```python
import mlflow
import mlflow.sklearn
from mlflow.tracking import MlflowClient
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix
)
import matplotlib.pyplot as plt

# 设置实验
experiment_name = "/Users/user@company.com/customer_churn_prediction"
mlflow.set_experiment(experiment_name)

# 准备数据
df = spark.table("ml.customer_features").toPandas()
X = df.drop(["customer_id", "churn"], axis=1)
y = df["churn"]
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 定义模型配置
model_configs = [
    {
        "name": "logistic_regression",
        "model": LogisticRegression(max_iter=1000),
        "params": {"max_iter": 1000, "solver": "lbfgs"}
    },
    {
        "name": "random_forest",
        "model": RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42),
        "params": {"n_estimators": 100, "max_depth": 10}
    },
    {
        "name": "gradient_boosting",
        "model": GradientBoostingClassifier(n_estimators=100, max_depth=5, random_state=42),
        "params": {"n_estimators": 100, "max_depth": 5, "learning_rate": 0.1}
    }
]

# 训练和记录多个模型
for config in model_configs:
    with mlflow.start_run(run_name=config["name"]):
        # 记录参数
        mlflow.log_params(config["params"])
        mlflow.set_tag("model_type", config["name"])
        mlflow.set_tag("dataset_version", "v1.0")

        # 训练模型
        model = config["model"]
        model.fit(X_train, y_train)

        # 预测
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)[:, 1]

        # 计算指标
        metrics = {
            "accuracy": accuracy_score(y_test, y_pred),
            "precision": precision_score(y_test, y_pred),
            "recall": recall_score(y_test, y_pred),
            "f1_score": f1_score(y_test, y_pred),
            "roc_auc": roc_auc_score(y_test, y_pred_proba)
        }

        # 交叉验证分数
        cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='f1')
        metrics["cv_f1_mean"] = cv_scores.mean()
        metrics["cv_f1_std"] = cv_scores.std()

        # 记录指标
        mlflow.log_metrics(metrics)

        # 记录混淆矩阵图
        cm = confusion_matrix(y_test, y_pred)
        fig, ax = plt.subplots(figsize=(8, 6))
        im = ax.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
        ax.figure.colorbar(im, ax=ax)
        ax.set(xticks=[0, 1], yticks=[0, 1],
               xticklabels=['保留', '流失'], yticklabels=['保留', '流失'],
               xlabel='预测标签', ylabel='真实标签',
               title=f'{config["name"]} 混淆矩阵')
        for i in range(2):
            for j in range(2):
                ax.text(j, i, format(cm[i, j], 'd'),
                       ha="center", va="center", color="white" if cm[i, j] > cm.max()/2 else "black")
        plt.tight_layout()
        mlflow.log_figure(fig, f"confusion_matrix_{config['name']}.png")
        plt.close()

        # 记录特征重要性（如果支持）
        if hasattr(model, 'feature_importances_'):
            feature_importance = pd.DataFrame({
                'feature': X.columns,
                'importance': model.feature_importances_
            }).sort_values('importance', ascending=False)

            fig, ax = plt.subplots(figsize=(10, 8))
            ax.barh(feature_importance['feature'][:15],
                   feature_importance['importance'][:15])
            ax.set_xlabel('重要性')
            ax.set_title(f'{config["name"]} 特征重要性 Top 15')
            ax.invert_yaxis()
            plt.tight_layout()
            mlflow.log_figure(fig, f"feature_importance_{config['name']}.png")
            plt.close()

            # 保存特征重要性为 CSV
            feature_importance.to_csv(f"/tmp/feature_importance_{config['name']}.csv", index=False)
            mlflow.log_artifact(f"/tmp/feature_importance_{config['name']}.csv")

        # 记录模型
        mlflow.sklearn.log_model(
            model,
            config["name"],
            registered_model_name=f"churn_model_{config['name']}"
        )

        print(f"模型 {config['name']}: F1={metrics['f1_score']:.4f}, AUC={metrics['roc_auc']:.4f}")
```

### 模型注册与版本管理

```python
from mlflow.tracking import MlflowClient

client = MlflowClient()

# 查找最佳模型
experiment = mlflow.get_experiment_by_name(experiment_name)
runs = mlflow.search_runs(
    experiment_ids=[experiment.experiment_id],
    order_by=["metrics.f1_score DESC"],
    max_results=1
)

best_run_id = runs.iloc[0]["run_id"]
best_model_name = runs.iloc[0]["tags.model_type"]
print(f"最佳模型: {best_model_name}, Run ID: {best_run_id}")

# 注册模型到 Model Registry
model_name = "customer_churn_production"
model_uri = f"runs:/{best_run_id}/{best_model_name}"

registered_model = mlflow.register_model(
    model_uri=model_uri,
    name=model_name
)

print(f"注册模型版本: {registered_model.version}")

# 更新模型元数据
client.update_registered_model(
    name=model_name,
    description="客户流失预测模型 - 用于识别高流失风险客户"
)

client.update_model_version(
    name=model_name,
    version=registered_model.version,
    description=f"基于 {best_model_name} 算法，F1 分数: {runs.iloc[0]['metrics.f1_score']:.4f}"
)

# 添加模型标签
client.set_model_version_tag(
    name=model_name,
    version=registered_model.version,
    key="validation_status",
    value="pending"
)

# 模型阶段转换
# 阶段：None -> Staging -> Production -> Archived

# 转移到 Staging
client.transition_model_version_stage(
    name=model_name,
    version=registered_model.version,
    stage="Staging"
)

# 验证后转移到 Production
# client.transition_model_version_stage(
#     name=model_name,
#     version=registered_model.version,
#     stage="Production",
#     archive_existing_versions=True  # 自动归档当前生产版本
# )

# 查看模型版本
for mv in client.search_model_versions(f"name='{model_name}'"):
    print(f"版本: {mv.version}, 阶段: {mv.current_stage}, 状态: {mv.status}")
```

### 模型部署与推理

```python
# 加载注册的模型
model_uri = f"models:/{model_name}/Staging"
loaded_model = mlflow.sklearn.load_model(model_uri)

# 批量推理
new_customers_df = spark.table("ml.new_customers")
new_customers_pdf = new_customers_df.toPandas()

# 提取特征
feature_columns = [col for col in new_customers_pdf.columns
                   if col not in ['customer_id', 'churn']]
X_new = new_customers_pdf[feature_columns]

# 预测
predictions = loaded_model.predict(X_new)
probabilities = loaded_model.predict_proba(X_new)[:, 1]

# 添加预测结果
new_customers_pdf['churn_prediction'] = predictions
new_customers_pdf['churn_probability'] = probabilities

# 转回 Spark DataFrame 并保存
result_df = spark.createDataFrame(new_customers_pdf)
result_df.write.format("delta").mode("overwrite").saveAsTable("ml.churn_predictions")

# 使用 Spark UDF 进行分布式推理
from pyspark.sql.functions import pandas_udf, struct
from pyspark.sql.types import DoubleType
import pandas as pd

# 广播模型到所有 Worker
broadcast_model = spark.sparkContext.broadcast(loaded_model)

@pandas_udf(DoubleType())
def predict_churn_udf(*features):
    """分布式预测 UDF"""
    model = broadcast_model.value
    X = pd.concat(features, axis=1)
    X.columns = feature_columns
    return pd.Series(model.predict_proba(X)[:, 1])

# 应用 UDF
predictions_df = new_customers_df.withColumn(
    "churn_probability",
    predict_churn_udf(*[col(c) for c in feature_columns])
)

display(predictions_df.select("customer_id", "churn_probability"))

# 模型服务（REST API）
# 在 Databricks UI 中启用模型服务后
import requests

serving_url = f"{DATABRICKS_HOST}/serving-endpoints/churn-model/invocations"

# 准备请求数据
inference_data = {
    "dataframe_records": [
        {"feature1": 1.5, "feature2": 2.3, "feature3": 0.8},
        {"feature1": 2.1, "feature2": 1.9, "feature3": 1.2}
    ]
}

# 发送推理请求
response = requests.post(
    serving_url,
    headers={"Authorization": f"Bearer {DATABRICKS_TOKEN}"},
    json=inference_data
)

predictions = response.json()
print(predictions)
```

### AutoML 自动机器学习

```python
from databricks import automl

# 准备数据
df = spark.table("ml.customer_features")

# 运行 AutoML 分类
classification_summary = automl.classify(
    dataset=df,
    target_col="churn",
    primary_metric="f1",
    timeout_minutes=60,
    max_trials=50,
    exclude_cols=["customer_id"],  # 排除非特征列
    experiment_dir="/Users/user@company.com/automl_experiments"
)

# 查看结果
print(f"最佳试验 Run ID: {classification_summary.best_trial.mlflow_run_id}")
print(f"最佳 F1 分数: {classification_summary.best_trial.metrics['val_f1_score']:.4f}")
print(f"训练 Notebook: {classification_summary.best_trial.notebook_path}")

# 获取所有试验
trials_df = classification_summary.trials
display(trials_df.sort_values("val_f1_score", ascending=False))

# 加载最佳模型
best_model = mlflow.sklearn.load_model(
    f"runs:/{classification_summary.best_trial.mlflow_run_id}/model"
)

# 运行 AutoML 回归
regression_summary = automl.regress(
    dataset=spark.table("ml.sales_features"),
    target_col="revenue",
    primary_metric="rmse",
    timeout_minutes=30,
    max_trials=30
)

# 运行 AutoML 时间序列预测
forecasting_summary = automl.forecast(
    dataset=spark.table("ml.time_series_data"),
    target_col="value",
    time_col="date",
    horizon=30,  # 预测未来30个时间点
    frequency="D",  # 每日频率
    primary_metric="smape",
    timeout_minutes=45
)
```

## SQL Analytics

### SQL Warehouse 配置

```python
# SQL Warehouse 配置选项
sql_warehouse_config = {
    "name": "analytics-warehouse",
    "cluster_size": "Medium",  # 2X-Small, X-Small, Small, Medium, Large, X-Large, 2X-Large, 3X-Large, 4X-Large
    "min_num_clusters": 1,
    "max_num_clusters": 10,
    "auto_stop_mins": 30,
    "warehouse_type": "PRO",  # CLASSIC, PRO, SERVERLESS
    "enable_photon": True,
    "spot_instance_policy": "COST_OPTIMIZED",  # COST_OPTIMIZED, RELIABILITY_OPTIMIZED
    "channel": {
        "name": "CHANNEL_NAME_CURRENT"  # 使用最新版本
    },
    "tags": {
        "custom_tags": [
            {"key": "team", "value": "analytics"},
            {"key": "cost_center", "value": "BI-001"}
        ]
    }
}

# 创建 SQL Warehouse
response = requests.post(
    f"{DATABRICKS_HOST}/api/2.0/sql/warehouses",
    headers=headers,
    json=sql_warehouse_config
)

warehouse_id = response.json().get("id")
print(f"SQL Warehouse ID: {warehouse_id}")
```

### 分析查询示例

```sql
-- =============================================
-- 销售分析仪表板查询集
-- =============================================

-- 1. 销售概览 KPIs
WITH current_period AS (
    SELECT
        SUM(total_amount) as revenue,
        COUNT(*) as orders,
        COUNT(DISTINCT customer_id) as customers,
        AVG(total_amount) as avg_order_value
    FROM production.sales.transactions
    WHERE transaction_date >= DATE_TRUNC('month', CURRENT_DATE())
),
previous_period AS (
    SELECT
        SUM(total_amount) as revenue,
        COUNT(*) as orders,
        COUNT(DISTINCT customer_id) as customers,
        AVG(total_amount) as avg_order_value
    FROM production.sales.transactions
    WHERE transaction_date >= DATE_SUB(DATE_TRUNC('month', CURRENT_DATE()), 30)
      AND transaction_date < DATE_TRUNC('month', CURRENT_DATE())
)
SELECT
    c.revenue as current_revenue,
    p.revenue as previous_revenue,
    (c.revenue - p.revenue) / p.revenue * 100 as revenue_growth_pct,
    c.orders as current_orders,
    c.customers as current_customers,
    c.avg_order_value as current_aov
FROM current_period c, previous_period p;

-- 2. 销售趋势（按日/周/月）
SELECT
    DATE_TRUNC('day', transaction_date) as date,
    region,
    COUNT(*) as order_count,
    SUM(total_amount) as revenue,
    COUNT(DISTINCT customer_id) as unique_customers,
    AVG(total_amount) as avg_order_value
FROM production.sales.transactions
WHERE transaction_date >= DATE_SUB(CURRENT_DATE(), 90)
GROUP BY 1, 2
ORDER BY 1, 2;

-- 3. 产品表现分析
SELECT
    p.category,
    p.product_name,
    COUNT(DISTINCT t.transaction_id) as order_count,
    SUM(t.quantity) as units_sold,
    SUM(t.total_amount) as revenue,
    SUM(t.total_amount) / SUM(SUM(t.total_amount)) OVER () * 100 as revenue_share_pct,
    ROW_NUMBER() OVER (PARTITION BY p.category ORDER BY SUM(t.total_amount) DESC) as rank_in_category
FROM production.sales.transactions t
JOIN production.catalog.products p ON t.product_id = p.product_id
WHERE t.transaction_date >= DATE_SUB(CURRENT_DATE(), 30)
GROUP BY p.category, p.product_name
ORDER BY revenue DESC;

-- 4. 客户细分 RFM 分析
WITH customer_rfm AS (
    SELECT
        customer_id,
        DATEDIFF(CURRENT_DATE(), MAX(transaction_date)) as recency,
        COUNT(DISTINCT transaction_id) as frequency,
        SUM(total_amount) as monetary
    FROM production.sales.transactions
    WHERE transaction_date >= DATE_SUB(CURRENT_DATE(), 365)
    GROUP BY customer_id
),
rfm_scores AS (
    SELECT
        customer_id,
        recency,
        frequency,
        monetary,
        NTILE(5) OVER (ORDER BY recency DESC) as r_score,
        NTILE(5) OVER (ORDER BY frequency) as f_score,
        NTILE(5) OVER (ORDER BY monetary) as m_score
    FROM customer_rfm
)
SELECT
    CASE
        WHEN r_score >= 4 AND f_score >= 4 AND m_score >= 4 THEN '高价值客户'
        WHEN r_score >= 4 AND f_score >= 3 THEN '忠诚客户'
        WHEN r_score >= 3 AND m_score >= 4 THEN '大额消费者'
        WHEN r_score <= 2 AND f_score >= 4 THEN '流失风险'
        WHEN r_score <= 2 AND f_score <= 2 THEN '休眠客户'
        ELSE '普通客户'
    END as customer_segment,
    COUNT(*) as customer_count,
    AVG(monetary) as avg_lifetime_value,
    AVG(frequency) as avg_frequency
FROM rfm_scores
GROUP BY 1
ORDER BY avg_lifetime_value DESC;

-- 5. 漏斗分析
WITH funnel AS (
    SELECT
        DATE_TRUNC('week', event_date) as week,
        COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN user_id END) as page_views,
        COUNT(DISTINCT CASE WHEN event_type = 'add_to_cart' THEN user_id END) as add_to_cart,
        COUNT(DISTINCT CASE WHEN event_type = 'checkout' THEN user_id END) as checkout,
        COUNT(DISTINCT CASE WHEN event_type = 'purchase' THEN user_id END) as purchase
    FROM production.analytics.events
    WHERE event_date >= DATE_SUB(CURRENT_DATE(), 28)
    GROUP BY 1
)
SELECT
    week,
    page_views,
    add_to_cart,
    checkout,
    purchase,
    add_to_cart * 100.0 / NULLIF(page_views, 0) as view_to_cart_rate,
    checkout * 100.0 / NULLIF(add_to_cart, 0) as cart_to_checkout_rate,
    purchase * 100.0 / NULLIF(checkout, 0) as checkout_to_purchase_rate,
    purchase * 100.0 / NULLIF(page_views, 0) as overall_conversion_rate
FROM funnel
ORDER BY week;

-- 6. 队列分析（Cohort Analysis）
WITH first_purchase AS (
    SELECT
        customer_id,
        DATE_TRUNC('month', MIN(transaction_date)) as cohort_month
    FROM production.sales.transactions
    GROUP BY customer_id
),
customer_activity AS (
    SELECT
        f.customer_id,
        f.cohort_month,
        DATE_TRUNC('month', t.transaction_date) as activity_month,
        MONTHS_BETWEEN(DATE_TRUNC('month', t.transaction_date), f.cohort_month) as months_since_first
    FROM first_purchase f
    JOIN production.sales.transactions t ON f.customer_id = t.customer_id
)
SELECT
    cohort_month,
    months_since_first,
    COUNT(DISTINCT customer_id) as customers,
    FIRST_VALUE(COUNT(DISTINCT customer_id)) OVER (
        PARTITION BY cohort_month ORDER BY months_since_first
    ) as cohort_size,
    COUNT(DISTINCT customer_id) * 100.0 /
        FIRST_VALUE(COUNT(DISTINCT customer_id)) OVER (
            PARTITION BY cohort_month ORDER BY months_since_first
        ) as retention_rate
FROM customer_activity
WHERE months_since_first <= 12
GROUP BY cohort_month, months_since_first
ORDER BY cohort_month, months_since_first;
```

### 参数化查询与警报

```sql
-- 参数化查询示例
-- 在 Databricks SQL 中使用 {{ parameter }} 语法

-- 销售报告（带参数）
SELECT
    transaction_date,
    region,
    category,
    SUM(total_amount) as revenue,
    COUNT(*) as orders
FROM production.sales.transactions t
JOIN production.catalog.products p ON t.product_id = p.product_id
WHERE
    transaction_date BETWEEN {{ date_range.start }} AND {{ date_range.end }}
    AND region IN ({{ regions }})
    AND ({{ category }} = 'All' OR p.category = {{ category }})
GROUP BY 1, 2, 3
ORDER BY 1, 2, 3;

-- 创建警报查询
-- 监控销售异常
SELECT
    CURRENT_DATE() as check_date,
    SUM(total_amount) as today_revenue,
    AVG(historical_avg) as avg_daily_revenue,
    (SUM(total_amount) - AVG(historical_avg)) / AVG(historical_avg) * 100 as deviation_pct
FROM production.sales.transactions t
CROSS JOIN (
    SELECT AVG(daily_revenue) as historical_avg
    FROM (
        SELECT DATE(transaction_date), SUM(total_amount) as daily_revenue
        FROM production.sales.transactions
        WHERE transaction_date >= DATE_SUB(CURRENT_DATE(), 30)
          AND transaction_date < CURRENT_DATE()
        GROUP BY 1
    )
) h
WHERE DATE(t.transaction_date) = CURRENT_DATE()
HAVING ABS(deviation_pct) > 20;  -- 偏差超过 20% 触发警报
```

## 成本优化策略

### 集群成本优化

```python
# =============================================
# 成本优化最佳实践
# =============================================

# 使用 Spot 实例
cost_optimized_cluster = {
    "cluster_name": "cost-optimized-cluster",
    "spark_version": "14.3.x-scala2.12",
    "node_type_id": "m5.xlarge",
    "autoscale": {
        "min_workers": 2,
        "max_workers": 10
    },
    "aws_attributes": {
        "availability": "SPOT_WITH_FALLBACK",
        "spot_bid_price_percent": 100,
        "first_on_demand": 1,  # Driver 使用按需实例确保稳定性
        "zone_id": "auto"
    },
    "autotermination_minutes": 30
}

# 实例池（Instance Pools）减少启动时间
instance_pool_config = {
    "instance_pool_name": "data-engineering-pool",
    "node_type_id": "m5.xlarge",
    "min_idle_instances": 2,  # 保持2个空闲实例
    "max_capacity": 20,
    "idle_instance_autotermination_minutes": 10,
    "aws_attributes": {
        "availability": "SPOT_WITH_FALLBACK",
        "spot_bid_price_percent": 100
    },
    "custom_tags": {
        "pool_purpose": "data-engineering"
    }
}

# 使用实例池的集群配置
cluster_with_pool = {
    "cluster_name": "pooled-cluster",
    "spark_version": "14.3.x-scala2.12",
    "instance_pool_id": "pool-id",
    "driver_instance_pool_id": "pool-id",
    "num_workers": 4
}

# Photon 加速
# Photon 在处理复杂查询时可节省 30-50% 成本
photon_cluster = {
    "spark_version": "14.3.x-photon-scala2.12",
    "runtime_engine": "PHOTON"
}

# 自动扩缩容配置优化
autoscale_config = {
    "autoscale": {
        "min_workers": 1,
        "max_workers": 10
    },
    "spark_conf": {
        # 更激进的缩容策略
        "spark.databricks.aggressiveWindowDownS": "60",
        "spark.databricks.deltaAutoscale.downscaleSpeedFactor": "0.5"
    }
}
```

### 存储成本优化

```python
# 数据生命周期管理
spark.sql("""
    -- 设置表保留策略
    ALTER TABLE production.logs.application_logs
    SET TBLPROPERTIES (
        'delta.logRetentionDuration' = '7 days',
        'delta.deletedFileRetentionDuration' = '1 day'
    )
""")

# 定期执行 VACUUM
def vacuum_tables(catalog, schema, retain_hours=168):
    """批量清理 Delta 表历史文件"""
    tables = spark.sql(f"SHOW TABLES IN {catalog}.{schema}").collect()

    for table in tables:
        table_name = f"{catalog}.{schema}.{table.tableName}"
        try:
            spark.sql(f"VACUUM {table_name} RETAIN {retain_hours} HOURS")
            print(f"已清理: {table_name}")
        except Exception as e:
            print(f"清理失败 {table_name}: {e}")

# vacuum_tables("production", "logs", 168)

# 数据压缩优化
spark.sql("""
    -- 优化表存储
    OPTIMIZE production.sales.transactions
    ZORDER BY (customer_id, transaction_date)
""")

# 选择合适的文件格式和压缩
spark.conf.set("spark.sql.parquet.compression.codec", "zstd")
spark.conf.set("delta.targetFileSize", "134217728")  # 128MB

df.write.format("delta") \
    .option("compression", "zstd") \
    .mode("overwrite") \
    .saveAsTable("production.sales.transactions_optimized")

# 分区策略优化
# 避免过度分区，每个分区建议至少 1GB
# 好的分区示例
df.write.format("delta") \
    .partitionBy("year", "month") \
    .mode("overwrite") \
    .save("/data/sales")

# 避免：过度分区
# .partitionBy("year", "month", "day", "hour")  # 分区数过多
```

### 成本监控与分析

```python
# 使用系统表监控成本
cost_analysis_queries = """
-- 1. 按集群查看 DBU 消耗
SELECT
    workspace_id,
    cluster_id,
    cluster_name,
    SUM(usage_quantity) as total_dbus,
    SUM(usage_quantity * list_price) as estimated_cost
FROM system.billing.usage
WHERE usage_date >= DATE_SUB(CURRENT_DATE(), 30)
GROUP BY workspace_id, cluster_id, cluster_name
ORDER BY total_dbus DESC;

-- 2. 按用户查看资源使用
SELECT
    user_identity.email as user_email,
    SUM(usage_quantity) as total_dbus,
    COUNT(DISTINCT cluster_id) as clusters_used
FROM system.billing.usage
WHERE usage_date >= DATE_SUB(CURRENT_DATE(), 30)
GROUP BY user_identity.email
ORDER BY total_dbus DESC;

-- 3. 按工作负载类型分析
SELECT
    sku_name,
    SUM(usage_quantity) as total_dbus,
    SUM(usage_quantity * list_price) as estimated_cost
FROM system.billing.usage
WHERE usage_date >= DATE_SUB(CURRENT_DATE(), 30)
GROUP BY sku_name
ORDER BY total_dbus DESC;

-- 4. 每日成本趋势
SELECT
    usage_date,
    SUM(usage_quantity) as daily_dbus,
    SUM(usage_quantity * list_price) as daily_cost
FROM system.billing.usage
WHERE usage_date >= DATE_SUB(CURRENT_DATE(), 30)
GROUP BY usage_date
ORDER BY usage_date;
"""

# 设置成本预算警报
cost_alert_query = """
SELECT
    SUM(usage_quantity * list_price) as mtd_cost,
    :monthly_budget as budget,
    SUM(usage_quantity * list_price) / :monthly_budget * 100 as budget_usage_pct
FROM system.billing.usage
WHERE usage_date >= DATE_TRUNC('month', CURRENT_DATE())
HAVING budget_usage_pct > 80
"""
```

## 最佳实践总结

### 开发最佳实践

```python
"""
1. Notebook 开发规范
   - 使用有意义的 Notebook 名称和清晰的目录结构
   - 在 Notebook 开头添加文档说明（%md）
   - 使用小组件（Widgets）实现参数化
   - 将可复用代码提取到共享库

2. 代码组织
   - 使用 Repos 进行版本控制
   - 遵循模块化设计原则
   - 编写单元测试

3. 数据处理
   - 使用 Delta Lake 作为默认存储格式
   - 实现增量处理而非全量重跑
   - 合理设计分区策略
   - 定期执行 OPTIMIZE 和 VACUUM

4. 性能优化
   - 使用 Photon 加速 SQL 工作负载
   - 启用 Adaptive Query Execution
   - 合理配置 Shuffle 分区数
   - 使用 Z-Order 优化常用查询列
"""

# 推荐的 Spark 配置
recommended_spark_conf = {
    # 自适应查询执行
    "spark.sql.adaptive.enabled": "true",
    "spark.sql.adaptive.coalescePartitions.enabled": "true",
    "spark.sql.adaptive.skewJoin.enabled": "true",

    # Delta Lake 优化
    "spark.databricks.delta.optimizeWrite.enabled": "true",
    "spark.databricks.delta.autoCompact.enabled": "true",

    # 缓存配置
    "spark.sql.cacheTableAsSelect.enabled": "true",

    # 动态分区
    "spark.sql.shuffle.partitions": "auto"
}
```

### 安全最佳实践

```python
"""
1. 访问控制
   - 使用 Unity Catalog 统一管理权限
   - 实施最小权限原则
   - 定期审计访问权限

2. 数据保护
   - 对敏感数据实施列掩码
   - 使用行级安全控制数据访问
   - 加密静态和传输中的数据

3. 凭证管理
   - 使用 Databricks Secrets 存储凭证
   - 避免在代码中硬编码敏感信息
   - 定期轮换访问令牌

4. 网络安全
   - 使用 Private Link 连接云服务
   - 配置 IP 访问列表
   - 启用 VPC 对等连接
"""

# 使用 Secrets 管理凭证
# 在 Databricks CLI 中创建 secret scope
# databricks secrets create-scope --scope production
# databricks secrets put --scope production --key db_password

# 在代码中安全访问
db_password = dbutils.secrets.get(scope="production", key="db_password")
api_key = dbutils.secrets.get(scope="production", key="api_key")

# 使用 secrets 连接外部系统
jdbc_url = f"jdbc:postgresql://host:5432/db?user=app&password={db_password}"
```

### 生产部署检查清单

```python
"""
部署前检查清单：

1. 代码质量
   [ ] 代码已通过审查
   [ ] 单元测试通过
   [ ] 集成测试通过
   [ ] 性能测试符合预期

2. 数据质量
   [ ] 数据验证规则已定义
   [ ] 异常处理机制就绪
   [ ] 数据血缘已追踪

3. 监控与告警
   [ ] 作业监控已配置
   [ ] 失败告警已设置
   [ ] SLA 指标已定义

4. 文档
   [ ] 技术文档已更新
   [ ] 运维手册已准备
   [ ] 回滚计划已制定

5. 安全
   [ ] 权限配置正确
   [ ] 敏感数据已保护
   [ ] 审计日志已启用

6. 成本
   [ ] 资源配置已优化
   [ ] 成本预算已设定
   [ ] 自动终止已启用
"""
```

## 常见面试问题

### 架构与概念

```
Q1: Lakehouse 架构与传统数据仓库的区别？
A:
- 存储：Lakehouse 使用开放格式（Delta Lake）存储在对象存储中，成本更低
- 处理：支持批处理和流处理统一处理
- 数据类型：支持结构化、半结构化和非结构化数据
- ACID：通过 Delta Lake 提供事务支持
- 灵活性：避免供应商锁定，支持多种引擎访问

Q2: Delta Lake 的核心特性？
A:
- ACID 事务：确保数据一致性
- 时间旅行：支持查询历史版本
- Schema 演进：安全地修改表结构
- 统一批流：同一表同时支持批处理和流处理
- 性能优化：Z-Order、数据跳过、文件合并

Q3: Unity Catalog 的价值？
A:
- 统一治理：跨工作区的集中式数据管理
- 细粒度权限：表、列、行级别的访问控制
- 数据血缘：自动追踪数据流向
- 审计日志：完整的访问记录
- 数据发现：标签和搜索功能
```

### 性能优化

```
Q4: 如何优化 Spark 作业性能？
A:
1. 数据层面：
   - 选择合适的分区策略
   - 使用 Z-Order 优化
   - 定期执行 OPTIMIZE

2. 配置层面：
   - 启用 Adaptive Query Execution
   - 合理设置并行度
   - 使用 Photon 加速

3. 代码层面：
   - 避免数据倾斜
   - 减少 Shuffle 操作
   - 使用广播变量

Q5: 如何处理数据倾斜？
A:
- 使用 salting 技术分散热点 key
- 启用 AQE 的自动倾斜处理
- 调整分区策略
- 使用广播 join 处理小表
```

### 实际场景

```
Q6: 如何设计实时数据管道？
A:
1. 数据摄取：使用 Auto Loader 或 Kafka 连接器
2. 处理层：
   - Bronze：原始数据，Schema 自动推断
   - Silver：清洗和标准化数据
   - Gold：业务聚合数据
3. 使用 Delta Live Tables 声明式定义管道
4. 配置数据质量检查和告警

Q7: MLOps 在 Databricks 中的实现？
A:
1. 特征工程：使用 Feature Store
2. 实验跟踪：MLflow Experiments
3. 模型注册：MLflow Model Registry
4. 模型部署：Model Serving
5. 监控：模型漂移检测
```

## 延伸学习

### 官方资源

- [Databricks 官方文档](https://docs.databricks.com/)
- [Delta Lake 文档](https://docs.delta.io/)
- [MLflow 文档](https://mlflow.org/docs/latest/index.html)
- [Databricks Academy](https://www.databricks.com/learn)

### 认证路径

- **Databricks Certified Data Engineer Associate**
- **Databricks Certified Data Engineer Professional**
- **Databricks Certified Machine Learning Associate**
- **Databricks Certified Machine Learning Professional**

### 推荐书籍

- 《Learning Spark, 2nd Edition》- O'Reilly
- 《Delta Lake: The Definitive Guide》- O'Reilly
- 《Fundamentals of Data Engineering》- O'Reilly

### 相关技术栈

- **Apache Spark**：分布式计算引擎
- **Delta Lake**：开源存储层
- **MLflow**：ML 生命周期管理
- **Apache Kafka**：流数据集成
- **dbt**：数据转换工具
- **Airflow**：工作流编排

---

Databricks 作为领先的 Lakehouse 平台，统一了数据工程、数据科学和业务分析的工作流。通过本指南的学习，你应该能够：

- 熟练使用 Databricks 工作区和 Notebooks 进行数据开发
- 合理配置和管理计算集群
- 利用 Delta Lake 构建可靠的数据管道
- 使用 Unity Catalog 实现企业级数据治理
- 通过 MLflow 管理机器学习全生命周期
- 优化成本和性能

建议在实际项目中持续实践，深入掌握 Databricks 的最佳实践和高级功能。
