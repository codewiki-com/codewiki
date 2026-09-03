---
title: 特征存储与数据湖架构
description: 构建ML数据基础设施：数据湖、特征存储和向量数据库
track: data
section: data-engineering
difficulty: advanced
tags:
  - 特征存储
  - 数据湖
  - 向量数据库
  - MLOps
status: imported
origin: old/src/content/docs/datascience/feature-store.zh.md
divergence: 0.143
issues: []
legacy:
  category: DataScience
  subcategory: DataEngineering
  order: 5
  lastUpdated: 2026-01-07
---

特征存储（Feature Store）是现代机器学习基础设施的核心组件，它为 ML 管道提供统一的特征管理、存储和服务能力。本文将深入探讨数据湖架构、特征存储概念、主流工具实践以及向量数据库集成。

## 数据湖架构

### 什么是数据湖

数据湖（Data Lake）是一种集中式存储库，可以存储任意规模的结构化和非结构化数据。与传统数据仓库不同，数据湖采用"先存储，后处理"的模式，保持数据的原始格式。

```
┌─────────────────────────────────────────────────────────────────────┐
│                        数据湖 vs 数据仓库                             │
├─────────────────────┬───────────────────┬───────────────────────────┤
│       特性          │     数据湖        │        数据仓库           │
├─────────────────────┼───────────────────┼───────────────────────────┤
│     数据类型        │  结构化+非结构化  │       结构化数据          │
│     存储模式        │   原始格式存储    │      清洗后存储           │
│     Schema         │   读时模式        │       写时模式            │
│     用户群体        │  数据科学家/工程师 │      业务分析师           │
│     主要用途        │  ML/高级分析      │       报表/BI             │
│     典型技术        │  S3/HDFS/Delta    │    BigQuery/Snowflake     │
└─────────────────────┴───────────────────┴───────────────────────────┘
```

### 现代数据湖架构

现代数据湖采用分层架构，通常分为 Bronze（原始层）、Silver（清洗层）和 Gold（精炼层）：

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Medallion Architecture                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  数据源                Bronze Layer        Silver Layer        Gold │
│  ┌──────┐            ┌───────────┐       ┌───────────┐      ┌─────┐│
│  │ Kafka│───────────▶│  原始数据  │──────▶│  清洗数据  │─────▶│特征 ││
│  │ API  │            │  Raw Data │       │  Cleaned  │      │模型 ││
│  │ DB   │            │           │       │  Data     │      │报表 ││
│  │ Files│            └───────────┘       └───────────┘      └─────┘│
│  └──────┘                                                           │
│                                                                     │
│  特点：              保持原始格式         去重、清洗、         面向应用│
│                      不做转换            标准化               聚合汇总│
└─────────────────────────────────────────────────────────────────────┘
```

### 数据湖核心技术栈

```python
# Delta Lake 示例 - 支持 ACID 事务的数据湖
from delta import DeltaTable
from pyspark.sql import SparkSession

# 初始化 Spark Session
spark = SparkSession.builder \
    .appName("DataLake") \
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
    .config("spark.sql.catalog.spark_catalog",
            "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
    .getOrCreate()

# Bronze Layer: 摄入原始数据
raw_events = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "user_events") \
    .load()

# 写入 Bronze 层
raw_events.writeStream \
    .format("delta") \
    .outputMode("append") \
    .option("checkpointLocation", "/lake/bronze/_checkpoints/events") \
    .start("/lake/bronze/events")

# Silver Layer: 数据清洗和转换
bronze_events = spark.read.format("delta").load("/lake/bronze/events")

silver_events = bronze_events \
    .select(
        "event_id",
        "user_id",
        "event_type",
        "event_timestamp",
        "properties"
    ) \
    .filter("event_id IS NOT NULL") \
    .dropDuplicates(["event_id"]) \
    .withColumn("event_date", F.to_date("event_timestamp"))

silver_events.write \
    .format("delta") \
    .mode("overwrite") \
    .partitionBy("event_date") \
    .save("/lake/silver/events")

# Gold Layer: 业务聚合
gold_user_metrics = spark.sql("""
    SELECT
        user_id,
        COUNT(*) as total_events,
        COUNT(DISTINCT event_type) as unique_event_types,
        MAX(event_timestamp) as last_activity,
        MIN(event_timestamp) as first_activity
    FROM delta.`/lake/silver/events`
    GROUP BY user_id
""")

gold_user_metrics.write \
    .format("delta") \
    .mode("overwrite") \
    .save("/lake/gold/user_metrics")
```

### 数据湖格式对比

| 特性 | Delta Lake | Apache Iceberg | Apache Hudi |
|------|------------|----------------|-------------|
| ACID 事务 | 支持 | 支持 | 支持 |
| Time Travel | 支持 | 支持 | 支持 |
| Schema Evolution | 支持 | 支持 | 支持 |
| 增量读取 | Change Data Feed | Incremental Reads | Incremental Queries |
| 主要支持 | Databricks | Netflix/Apple | Uber |
| 计算引擎 | Spark 优先 | 引擎无关 | Spark/Flink |

---

## 特征存储概念

### 什么是特征存储

特征存储（Feature Store）是用于管理、存储和服务机器学习特征的专用系统。它解决了 ML 工程中的几个核心问题：

```
┌─────────────────────────────────────────────────────────────────────┐
│                    特征存储核心价值                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. 特征复用                                                        │
│     └─ 避免重复计算，跨团队/项目共享特征                              │
│                                                                     │
│  2. 训练-推理一致性                                                  │
│     └─ 确保训练时和推理时使用相同的特征计算逻辑                       │
│                                                                     │
│  3. 特征发现                                                        │
│     └─ 提供特征目录，方便搜索和探索可用特征                           │
│                                                                     │
│  4. 特征版本管理                                                    │
│     └─ 追踪特征定义的变化，支持回滚和审计                            │
│                                                                     │
│  5. 时间旅行查询                                                    │
│     └─ 获取历史某一时刻的特征值，支持回测                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 特征存储架构

一个完整的特征存储系统通常包含以下组件：

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Feature Store Architecture                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Feature Registry                          │   │
│  │           (特征定义、元数据、血缘关系)                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│           ┌──────────────────┼──────────────────┐                  │
│           │                  │                  │                  │
│           ▼                  ▼                  ▼                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐            │
│  │ Offline     │    │ Online      │    │ Streaming   │            │
│  │ Store       │    │ Store       │    │ Engine      │            │
│  │ (历史特征)   │    │ (实时特征)   │    │ (特征计算)   │            │
│  │             │    │             │    │             │            │
│  │ Parquet/    │    │ Redis/      │    │ Spark/      │            │
│  │ Delta Lake  │    │ DynamoDB    │    │ Flink       │            │
│  └─────────────┘    └─────────────┘    └─────────────┘            │
│           │                  │                  │                  │
│           │                  │                  │                  │
│           ▼                  ▼                  ▼                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Feature Service API                       │   │
│  │              (训练数据生成 / 在线特征服务)                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│           ┌──────────────────┼──────────────────┐                  │
│           ▼                  ▼                  ▼                  │
│      训练管道            推理服务            分析探索              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 特征的生命周期

```python
"""
特征生命周期管理示例
"""

# 特征定义（Feature Definition）
from dataclasses import dataclass
from datetime import timedelta
from typing import List, Optional

@dataclass
class FeatureDefinition:
    """特征定义类"""
    name: str
    description: str
    entity: str  # 实体类型（user, item, transaction 等）
    dtype: str
    owner: str
    tags: List[str]
    ttl: Optional[timedelta] = None  # 特征有效期

    # 特征计算逻辑
    transformation: Optional[str] = None
    source_tables: Optional[List[str]] = None

# 定义用户特征
user_features = [
    FeatureDefinition(
        name="user_total_purchases_30d",
        description="用户最近30天总购买次数",
        entity="user",
        dtype="int64",
        owner="ml-team",
        tags=["user", "purchase", "aggregation"],
        ttl=timedelta(hours=24),
        transformation="""
            SELECT
                user_id,
                COUNT(*) as user_total_purchases_30d
            FROM orders
            WHERE order_date >= current_date - 30
            GROUP BY user_id
        """,
        source_tables=["orders"]
    ),
    FeatureDefinition(
        name="user_avg_order_value_30d",
        description="用户最近30天平均订单金额",
        entity="user",
        dtype="float64",
        owner="ml-team",
        tags=["user", "purchase", "aggregation"],
        ttl=timedelta(hours=24),
        transformation="""
            SELECT
                user_id,
                AVG(order_amount) as user_avg_order_value_30d
            FROM orders
            WHERE order_date >= current_date - 30
            GROUP BY user_id
        """,
        source_tables=["orders"]
    )
]

# 特征计算（Feature Computation）
class FeatureComputer:
    """特征计算引擎"""

    def __init__(self, spark_session):
        self.spark = spark_session

    def compute_batch_features(
        self,
        feature_def: FeatureDefinition,
        as_of_date: str
    ):
        """批量计算特征"""
        query = feature_def.transformation.replace(
            "current_date", f"'{as_of_date}'"
        )
        return self.spark.sql(query)

    def compute_streaming_features(
        self,
        feature_def: FeatureDefinition,
        input_stream
    ):
        """流式计算特征"""
        # 使用 Structured Streaming 实时计算
        pass

# 特征存储（Feature Storage）
class FeatureStore:
    """特征存储管理"""

    def __init__(self, offline_store_path: str, online_store_client):
        self.offline_path = offline_store_path
        self.online_client = online_store_client

    def write_offline(self, features_df, feature_group: str, timestamp: str):
        """写入离线存储"""
        features_df.write \
            .format("delta") \
            .mode("append") \
            .partitionBy("feature_date") \
            .save(f"{self.offline_path}/{feature_group}")

    def write_online(self, features_df, feature_group: str, ttl: int):
        """写入在线存储"""
        for row in features_df.collect():
            key = f"{feature_group}:{row['entity_id']}"
            self.online_client.setex(key, ttl, row.asDict())

# 特征服务（Feature Serving）
class FeatureService:
    """特征服务 API"""

    def get_online_features(
        self,
        feature_names: List[str],
        entity_ids: List[str]
    ) -> dict:
        """获取在线特征（低延迟）"""
        pass

    def get_historical_features(
        self,
        feature_names: List[str],
        entity_df,  # 包含 entity_id 和 event_timestamp
    ):
        """获取历史特征（用于训练）"""
        pass
```

---

## Feast 特征存储

### Feast 简介

Feast（Feature Store）是一个开源的特征存储系统，由 Tecton 和 Gojek 联合开发。它提供了特征定义、存储和服务的完整解决方案。

```bash
# 安装 Feast
pip install feast

# 初始化 Feast 项目
feast init my_feature_store
cd my_feature_store
```

### Feast 核心概念

```python
# feature_repo/feature_definitions.py
from datetime import timedelta
from feast import (
    Entity,
    Feature,
    FeatureView,
    FileSource,
    ValueType,
    Field
)
from feast.types import Float32, Int64, String

# 定义数据源（Data Source）
user_daily_stats_source = FileSource(
    name="user_daily_stats_source",
    path="data/user_daily_stats.parquet",
    timestamp_field="event_timestamp",
    created_timestamp_column="created_timestamp",
)

# 定义实体（Entity）
user_entity = Entity(
    name="user_id",
    description="用户唯一标识",
    value_type=ValueType.INT64,
)

# 定义特征视图（Feature View）
user_stats_fv = FeatureView(
    name="user_stats",
    description="用户统计特征",
    entities=[user_entity],
    ttl=timedelta(days=1),
    schema=[
        Field(name="total_orders", dtype=Int64),
        Field(name="total_amount", dtype=Float32),
        Field(name="avg_order_value", dtype=Float32),
        Field(name="days_since_last_order", dtype=Int64),
        Field(name="favorite_category", dtype=String),
    ],
    online=True,  # 是否同步到在线存储
    source=user_daily_stats_source,
    tags={"team": "ml-platform", "data_quality": "high"},
)

# 定义 On-Demand 特征（实时计算）
from feast import on_demand_feature_view
from feast.types import Float64
import pandas as pd

@on_demand_feature_view(
    sources=[user_stats_fv],
    schema=[
        Field(name="order_frequency_score", dtype=Float64),
        Field(name="is_high_value_user", dtype=Int64),
    ],
)
def user_derived_features(inputs: pd.DataFrame) -> pd.DataFrame:
    """基于已有特征计算衍生特征"""
    df = pd.DataFrame()

    # 订单频率评分
    df["order_frequency_score"] = inputs["total_orders"] / (
        inputs["days_since_last_order"] + 1
    )

    # 高价值用户标识
    df["is_high_value_user"] = (
        (inputs["total_amount"] > 10000) &
        (inputs["total_orders"] > 10)
    ).astype(int)

    return df
```

### Feast 特征物化与服务

```python
# feast_workflow.py
from feast import FeatureStore
from datetime import datetime, timedelta
import pandas as pd

# 初始化 Feature Store
store = FeatureStore(repo_path="feature_repo/")

# 特征物化（Materialization）
# 将离线数据同步到在线存储
store.materialize(
    start_date=datetime.now() - timedelta(days=7),
    end_date=datetime.now()
)

# 增量物化
store.materialize_incremental(end_date=datetime.now())

# 获取训练数据（Historical Features）
# 定义实体数据框（包含 entity_id 和 event_timestamp）
entity_df = pd.DataFrame({
    "user_id": [1001, 1002, 1003, 1004, 1005],
    "event_timestamp": pd.to_datetime([
        "2024-01-15 10:00:00",
        "2024-01-15 11:00:00",
        "2024-01-15 12:00:00",
        "2024-01-15 13:00:00",
        "2024-01-15 14:00:00",
    ])
})

# 获取历史特征（Point-in-Time Join）
training_df = store.get_historical_features(
    entity_df=entity_df,
    features=[
        "user_stats:total_orders",
        "user_stats:total_amount",
        "user_stats:avg_order_value",
        "user_stats:days_since_last_order",
        "user_derived_features:order_frequency_score",
        "user_derived_features:is_high_value_user",
    ],
).to_df()

print("训练数据:")
print(training_df.head())

# 在线特征服务（Online Serving）
online_features = store.get_online_features(
    features=[
        "user_stats:total_orders",
        "user_stats:total_amount",
        "user_stats:avg_order_value",
        "user_derived_features:is_high_value_user",
    ],
    entity_rows=[
        {"user_id": 1001},
        {"user_id": 1002},
    ]
).to_dict()

print("\n在线特征:")
for key, values in online_features.items():
    print(f"  {key}: {values}")
```

### Feast 与 ML 管道集成

```python
# ml_pipeline_with_feast.py
from feast import FeatureStore
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
import mlflow

# 初始化
store = FeatureStore(repo_path="feature_repo/")

def create_training_dataset(
    label_df: pd.DataFrame,
    feature_names: list
) -> pd.DataFrame:
    """
    创建训练数据集

    Args:
        label_df: 包含 user_id, event_timestamp, label 的数据框
        feature_names: 特征列表
    """
    # 使用 Feast 进行 Point-in-Time Join
    training_df = store.get_historical_features(
        entity_df=label_df[["user_id", "event_timestamp"]],
        features=feature_names
    ).to_df()

    # 合并标签
    training_df = training_df.merge(
        label_df[["user_id", "event_timestamp", "label"]],
        on=["user_id", "event_timestamp"]
    )

    return training_df

def train_model(training_df: pd.DataFrame, feature_columns: list):
    """训练模型"""
    X = training_df[feature_columns]
    y = training_df["label"]

    # 处理缺失值
    X = X.fillna(0)

    # 划分数据集
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # 训练模型
    with mlflow.start_run():
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        model.fit(X_train, y_train)

        # 评估
        y_pred = model.predict(X_test)
        report = classification_report(y_test, y_pred, output_dict=True)

        # 记录指标
        mlflow.log_metric("accuracy", report["accuracy"])
        mlflow.log_metric("f1_weighted", report["weighted avg"]["f1-score"])

        # 记录使用的特征
        mlflow.log_param("features", feature_columns)

        # 保存模型
        mlflow.sklearn.log_model(model, "model")

    return model

# 使用示例
label_data = pd.DataFrame({
    "user_id": [1001, 1002, 1003, 1004, 1005] * 100,
    "event_timestamp": pd.date_range(
        "2024-01-01", periods=500, freq="H"
    ),
    "label": np.random.randint(0, 2, 500)
})

feature_list = [
    "user_stats:total_orders",
    "user_stats:total_amount",
    "user_stats:avg_order_value",
    "user_stats:days_since_last_order",
    "user_derived_features:order_frequency_score",
]

# 创建训练数据
training_data = create_training_dataset(label_data, feature_list)

# 训练模型
feature_cols = [
    "total_orders",
    "total_amount",
    "avg_order_value",
    "days_since_last_order",
    "order_frequency_score"
]
model = train_model(training_data, feature_cols)
```

---

## 离线/在线特征

### 离线特征与在线特征的区别

```
┌─────────────────────────────────────────────────────────────────────┐
│                   离线特征 vs 在线特征                               │
├─────────────────────┬───────────────────┬───────────────────────────┤
│       特性          │    离线特征       │       在线特征            │
├─────────────────────┼───────────────────┼───────────────────────────┤
│     使用场景        │   模型训练/回测   │       实时推理            │
│     延迟要求        │   秒级到分钟级    │       毫秒级              │
│     数据量          │   大批量历史数据  │       单条/小批量         │
│     计算方式        │   批处理          │       预计算/实时计算     │
│     存储系统        │   数据湖/数仓     │       Redis/DynamoDB      │
│     更新频率        │   小时/天级别     │       实时/准实时         │
│     成本            │   较低            │       较高                │
└─────────────────────┴───────────────────┴───────────────────────────┘
```

### 离线特征实现

```python
# offline_features.py
"""
离线特征计算 - 使用 Spark
"""
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.window import Window
from datetime import datetime, timedelta

spark = SparkSession.builder \
    .appName("OfflineFeatureComputation") \
    .getOrCreate()

class OfflineFeatureComputer:
    """离线特征计算器"""

    def __init__(self, spark):
        self.spark = spark

    def compute_user_features(
        self,
        orders_df,
        as_of_date: str
    ):
        """计算用户特征"""

        # 过滤到指定日期之前的数据
        filtered_orders = orders_df.filter(
            F.col("order_date") <= as_of_date
        )

        # 基础聚合特征
        user_base_features = filtered_orders.groupBy("user_id").agg(
            # 全量统计
            F.count("order_id").alias("lifetime_orders"),
            F.sum("order_amount").alias("lifetime_amount"),
            F.avg("order_amount").alias("lifetime_avg_order"),
            F.min("order_date").alias("first_order_date"),
            F.max("order_date").alias("last_order_date"),
            F.countDistinct("product_category").alias("unique_categories"),
        )

        # 时间窗口特征
        window_features = self._compute_window_features(
            filtered_orders, as_of_date
        )

        # 行为序列特征
        sequence_features = self._compute_sequence_features(
            filtered_orders, as_of_date
        )

        # 合并所有特征
        user_features = user_base_features \
            .join(window_features, "user_id", "left") \
            .join(sequence_features, "user_id", "left") \
            .withColumn("feature_timestamp", F.lit(as_of_date))

        return user_features

    def _compute_window_features(self, orders_df, as_of_date: str):
        """计算时间窗口特征"""

        as_of_datetime = datetime.strptime(as_of_date, "%Y-%m-%d")

        window_configs = [
            ("7d", 7),
            ("30d", 30),
            ("90d", 90),
        ]

        result_df = None

        for suffix, days in window_configs:
            start_date = (as_of_datetime - timedelta(days=days)).strftime("%Y-%m-%d")

            window_df = orders_df.filter(
                (F.col("order_date") >= start_date) &
                (F.col("order_date") <= as_of_date)
            ).groupBy("user_id").agg(
                F.count("order_id").alias(f"orders_{suffix}"),
                F.sum("order_amount").alias(f"amount_{suffix}"),
                F.avg("order_amount").alias(f"avg_order_{suffix}"),
            )

            if result_df is None:
                result_df = window_df
            else:
                result_df = result_df.join(window_df, "user_id", "outer")

        return result_df

    def _compute_sequence_features(self, orders_df, as_of_date: str):
        """计算行为序列特征"""

        # 计算最近N次订单的特征
        window_spec = Window.partitionBy("user_id") \
            .orderBy(F.col("order_date").desc())

        recent_orders = orders_df \
            .withColumn("row_num", F.row_number().over(window_spec)) \
            .filter(F.col("row_num") <= 5)

        sequence_features = recent_orders.groupBy("user_id").agg(
            # 最近5次订单的平均金额
            F.avg("order_amount").alias("recent_5_avg_amount"),
            # 最近订单金额的标准差
            F.stddev("order_amount").alias("recent_5_amount_std"),
            # 最近订单的类别列表
            F.collect_list("product_category").alias("recent_categories"),
        )

        return sequence_features.select(
            "user_id",
            "recent_5_avg_amount",
            "recent_5_amount_std",
        )

# 使用示例
computer = OfflineFeatureComputer(spark)

# 读取订单数据
orders = spark.read.parquet("/data/orders/")

# 计算特定日期的特征
user_features = computer.compute_user_features(
    orders,
    as_of_date="2024-01-15"
)

# 保存到特征存储
user_features.write \
    .format("delta") \
    .mode("append") \
    .partitionBy("feature_timestamp") \
    .save("/feature_store/user_features/")
```

### 在线特征实现

```python
# online_features.py
"""
在线特征服务 - 使用 Redis
"""
import redis
import json
from typing import Dict, List, Optional
from dataclasses import dataclass
import time

@dataclass
class FeatureValue:
    """特征值包装类"""
    value: any
    timestamp: float
    ttl: int

class OnlineFeatureStore:
    """在线特征存储"""

    def __init__(
        self,
        redis_host: str = "localhost",
        redis_port: int = 6379,
        redis_db: int = 0,
        default_ttl: int = 86400  # 默认24小时
    ):
        self.redis_client = redis.Redis(
            host=redis_host,
            port=redis_port,
            db=redis_db,
            decode_responses=True
        )
        self.default_ttl = default_ttl

    def _get_key(self, entity_type: str, entity_id: str, feature_name: str) -> str:
        """生成 Redis Key"""
        return f"feature:{entity_type}:{entity_id}:{feature_name}"

    def set_feature(
        self,
        entity_type: str,
        entity_id: str,
        feature_name: str,
        value: any,
        ttl: Optional[int] = None
    ):
        """设置单个特征"""
        key = self._get_key(entity_type, entity_id, feature_name)
        feature_data = {
            "value": value,
            "timestamp": time.time()
        }
        ttl = ttl or self.default_ttl
        self.redis_client.setex(key, ttl, json.dumps(feature_data))

    def set_features_batch(
        self,
        entity_type: str,
        entity_id: str,
        features: Dict[str, any],
        ttl: Optional[int] = None
    ):
        """批量设置特征"""
        ttl = ttl or self.default_ttl
        pipeline = self.redis_client.pipeline()
        timestamp = time.time()

        for feature_name, value in features.items():
            key = self._get_key(entity_type, entity_id, feature_name)
            feature_data = {
                "value": value,
                "timestamp": timestamp
            }
            pipeline.setex(key, ttl, json.dumps(feature_data))

        pipeline.execute()

    def get_feature(
        self,
        entity_type: str,
        entity_id: str,
        feature_name: str
    ) -> Optional[any]:
        """获取单个特征"""
        key = self._get_key(entity_type, entity_id, feature_name)
        data = self.redis_client.get(key)

        if data:
            feature_data = json.loads(data)
            return feature_data["value"]
        return None

    def get_features(
        self,
        entity_type: str,
        entity_id: str,
        feature_names: List[str]
    ) -> Dict[str, any]:
        """批量获取特征"""
        keys = [
            self._get_key(entity_type, entity_id, name)
            for name in feature_names
        ]

        values = self.redis_client.mget(keys)

        result = {}
        for name, data in zip(feature_names, values):
            if data:
                feature_data = json.loads(data)
                result[name] = feature_data["value"]
            else:
                result[name] = None

        return result

    def get_features_for_entities(
        self,
        entity_type: str,
        entity_ids: List[str],
        feature_names: List[str]
    ) -> Dict[str, Dict[str, any]]:
        """为多个实体批量获取特征"""
        pipeline = self.redis_client.pipeline()

        # 构建所有需要查询的 key
        key_mapping = {}
        for entity_id in entity_ids:
            for feature_name in feature_names:
                key = self._get_key(entity_type, entity_id, feature_name)
                key_mapping[key] = (entity_id, feature_name)
                pipeline.get(key)

        # 执行批量查询
        values = pipeline.execute()

        # 组装结果
        result = {entity_id: {} for entity_id in entity_ids}
        for key, value in zip(key_mapping.keys(), values):
            entity_id, feature_name = key_mapping[key]
            if value:
                feature_data = json.loads(value)
                result[entity_id][feature_name] = feature_data["value"]
            else:
                result[entity_id][feature_name] = None

        return result


# 在线特征服务 API
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict

app = FastAPI(title="Online Feature Service")
feature_store = OnlineFeatureStore()

class FeatureRequest(BaseModel):
    entity_type: str
    entity_ids: List[str]
    feature_names: List[str]

class FeatureResponse(BaseModel):
    features: Dict[str, Dict[str, any]]
    latency_ms: float

@app.post("/features", response_model=FeatureResponse)
async def get_features(request: FeatureRequest):
    """获取在线特征"""
    start_time = time.time()

    try:
        features = feature_store.get_features_for_entities(
            entity_type=request.entity_type,
            entity_ids=request.entity_ids,
            feature_names=request.feature_names
        )

        latency_ms = (time.time() - start_time) * 1000

        return FeatureResponse(
            features=features,
            latency_ms=latency_ms
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 启动服务: uvicorn online_features:app --host 0.0.0.0 --port 8000
```

### 特征同步机制

```python
# feature_sync.py
"""
离线到在线特征同步
"""
from pyspark.sql import SparkSession
from concurrent.futures import ThreadPoolExecutor
import redis
import json

class FeatureSynchronizer:
    """特征同步器"""

    def __init__(
        self,
        spark: SparkSession,
        redis_host: str,
        redis_port: int,
        batch_size: int = 1000,
        max_workers: int = 10
    ):
        self.spark = spark
        self.redis_client = redis.Redis(
            host=redis_host,
            port=redis_port,
            decode_responses=True
        )
        self.batch_size = batch_size
        self.max_workers = max_workers

    def sync_features(
        self,
        offline_path: str,
        entity_type: str,
        entity_id_col: str,
        feature_columns: list,
        ttl: int = 86400
    ):
        """从离线存储同步到在线存储"""

        # 读取最新的离线特征
        df = self.spark.read.format("delta").load(offline_path)

        # 获取最新日期的数据
        latest_date = df.agg({"feature_timestamp": "max"}).collect()[0][0]
        latest_features = df.filter(
            df.feature_timestamp == latest_date
        ).select(entity_id_col, *feature_columns)

        # 分批同步到 Redis
        total_rows = latest_features.count()
        print(f"开始同步 {total_rows} 条特征数据")

        # 使用分区并行写入
        def sync_partition(partition):
            pipeline = self.redis_client.pipeline()
            count = 0

            for row in partition:
                entity_id = str(row[entity_id_col])

                for feature_name in feature_columns:
                    key = f"feature:{entity_type}:{entity_id}:{feature_name}"
                    value = row[feature_name]

                    if value is not None:
                        feature_data = json.dumps({
                            "value": value,
                            "timestamp": latest_date
                        })
                        pipeline.setex(key, ttl, feature_data)

                count += 1

                # 每 batch_size 条执行一次
                if count % self.batch_size == 0:
                    pipeline.execute()
                    pipeline = self.redis_client.pipeline()

            # 执行剩余的
            if count % self.batch_size != 0:
                pipeline.execute()

            return [count]

        # 执行同步
        synced_counts = latest_features.rdd.mapPartitions(
            sync_partition
        ).collect()

        total_synced = sum(synced_counts)
        print(f"同步完成: {total_synced} 条记录")

        return total_synced

# 使用示例
spark = SparkSession.builder.getOrCreate()
synchronizer = FeatureSynchronizer(
    spark=spark,
    redis_host="localhost",
    redis_port=6379
)

# 同步用户特征
synchronizer.sync_features(
    offline_path="/feature_store/user_features/",
    entity_type="user",
    entity_id_col="user_id",
    feature_columns=[
        "lifetime_orders",
        "lifetime_amount",
        "orders_30d",
        "amount_30d",
        "recent_5_avg_amount"
    ],
    ttl=86400
)
```

---

## 特征一致性

### 训练-推理偏差问题

特征一致性是机器学习系统中最常见也最难以发现的问题之一。训练时使用的特征与推理时使用的特征不一致，会导致模型性能严重下降。

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Training-Serving Skew 来源                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. 特征计算逻辑不一致                                               │
│     └─ 训练用 SQL，推理用 Python，计算结果可能不同                    │
│                                                                     │
│  2. 数据处理管道不同                                                 │
│     └─ 训练数据经过 ETL，在线数据直接使用                            │
│                                                                     │
│  3. 时间戳处理差异                                                   │
│     └─ 训练时使用 T-1 日特征，推理时使用当天实时特征                  │
│                                                                     │
│  4. 缺失值处理不同                                                   │
│     └─ 训练时用平均值填充，推理时用 0 填充                           │
│                                                                     │
│  5. 特征版本不匹配                                                   │
│     └─ 模型用 v1 特征训练，推理用 v2 特征                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 保证特征一致性的方法

```python
# feature_consistency.py
"""
特征一致性保障方案
"""
from typing import Dict, Any, Callable
from dataclasses import dataclass
import hashlib
import json
import pandas as pd
import numpy as np

@dataclass
class FeatureSchema:
    """特征 Schema 定义"""
    name: str
    dtype: str
    default_value: Any
    nullable: bool = False
    min_value: float = None
    max_value: float = None
    allowed_values: list = None

class FeatureTransformer:
    """统一特征转换器 - 训练和推理使用同一套代码"""

    def __init__(self, schema: Dict[str, FeatureSchema]):
        self.schema = schema
        self.version = self._compute_version()

    def _compute_version(self) -> str:
        """计算 Schema 版本哈希"""
        schema_str = json.dumps(
            {k: v.__dict__ for k, v in self.schema.items()},
            sort_keys=True
        )
        return hashlib.md5(schema_str.encode()).hexdigest()[:8]

    def validate(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """验证并转换特征"""
        validated = {}

        for name, schema in self.schema.items():
            value = features.get(name)

            # 处理缺失值
            if value is None:
                if schema.nullable:
                    validated[name] = schema.default_value
                else:
                    raise ValueError(f"Feature {name} cannot be null")
            else:
                # 类型转换
                validated[name] = self._cast_type(value, schema.dtype)

                # 范围验证
                if schema.min_value is not None and validated[name] < schema.min_value:
                    validated[name] = schema.min_value
                if schema.max_value is not None and validated[name] > schema.max_value:
                    validated[name] = schema.max_value

                # 枚举值验证
                if schema.allowed_values and validated[name] not in schema.allowed_values:
                    validated[name] = schema.default_value

        return validated

    def _cast_type(self, value: Any, dtype: str) -> Any:
        """类型转换"""
        type_mapping = {
            "int64": int,
            "float64": float,
            "string": str,
            "bool": bool
        }
        return type_mapping[dtype](value)

    def transform_batch(self, df: pd.DataFrame) -> pd.DataFrame:
        """批量转换（用于训练）"""
        result = pd.DataFrame()

        for name, schema in self.schema.items():
            if name in df.columns:
                # 填充缺失值
                col = df[name].fillna(schema.default_value)

                # 类型转换
                if schema.dtype == "int64":
                    col = col.astype(np.int64)
                elif schema.dtype == "float64":
                    col = col.astype(np.float64)

                # 范围裁剪
                if schema.min_value is not None:
                    col = col.clip(lower=schema.min_value)
                if schema.max_value is not None:
                    col = col.clip(upper=schema.max_value)

                result[name] = col
            else:
                result[name] = schema.default_value

        return result

    def transform_single(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """单条转换（用于推理）"""
        return self.validate(features)


# 定义特征 Schema
user_feature_schema = {
    "lifetime_orders": FeatureSchema(
        name="lifetime_orders",
        dtype="int64",
        default_value=0,
        min_value=0,
        max_value=10000
    ),
    "lifetime_amount": FeatureSchema(
        name="lifetime_amount",
        dtype="float64",
        default_value=0.0,
        min_value=0,
        max_value=1000000
    ),
    "days_since_last_order": FeatureSchema(
        name="days_since_last_order",
        dtype="int64",
        default_value=365,
        min_value=0,
        max_value=3650
    ),
    "user_segment": FeatureSchema(
        name="user_segment",
        dtype="string",
        default_value="unknown",
        allowed_values=["new", "active", "churned", "vip", "unknown"]
    )
}

# 创建转换器
transformer = FeatureTransformer(user_feature_schema)

print(f"Feature Schema Version: {transformer.version}")

# 训练时使用
training_df = pd.DataFrame({
    "lifetime_orders": [10, None, 50, 100],
    "lifetime_amount": [1000.0, 2000.0, None, 5000.0],
    "days_since_last_order": [5, 30, 60, 1],
    "user_segment": ["active", "new", "invalid", "vip"]
})

transformed_training = transformer.transform_batch(training_df)
print("\n训练数据转换结果:")
print(transformed_training)

# 推理时使用
inference_features = {
    "lifetime_orders": 25,
    "lifetime_amount": 3000.0,
    "days_since_last_order": 10,
    "user_segment": "active"
}

transformed_inference = transformer.transform_single(inference_features)
print("\n推理特征转换结果:")
print(transformed_inference)
```

### 特征监控与验证

```python
# feature_monitoring.py
"""
特征监控系统
"""
import numpy as np
import pandas as pd
from scipy import stats
from typing import Dict, List, Tuple
from dataclasses import dataclass
from datetime import datetime

@dataclass
class FeatureStats:
    """特征统计信息"""
    name: str
    mean: float
    std: float
    min_val: float
    max_val: float
    null_ratio: float
    distribution: Dict[str, float]  # 分位数分布

class FeatureMonitor:
    """特征监控器"""

    def __init__(self, baseline_stats: Dict[str, FeatureStats]):
        self.baseline_stats = baseline_stats
        self.alerts = []

    def compute_stats(self, df: pd.DataFrame, feature_name: str) -> FeatureStats:
        """计算特征统计信息"""
        col = df[feature_name]

        return FeatureStats(
            name=feature_name,
            mean=col.mean(),
            std=col.std(),
            min_val=col.min(),
            max_val=col.max(),
            null_ratio=col.isnull().mean(),
            distribution={
                "p10": col.quantile(0.1),
                "p25": col.quantile(0.25),
                "p50": col.quantile(0.5),
                "p75": col.quantile(0.75),
                "p90": col.quantile(0.9),
            }
        )

    def detect_drift(
        self,
        current_df: pd.DataFrame,
        feature_name: str,
        method: str = "psi"
    ) -> Tuple[float, bool]:
        """
        检测特征漂移

        Args:
            current_df: 当前数据
            feature_name: 特征名
            method: 检测方法 (psi, ks, mean_shift)

        Returns:
            drift_score: 漂移分数
            is_drifted: 是否发生漂移
        """
        baseline = self.baseline_stats[feature_name]
        current_stats = self.compute_stats(current_df, feature_name)

        if method == "psi":
            drift_score = self._calculate_psi(baseline, current_stats)
            is_drifted = drift_score > 0.2

        elif method == "ks":
            # 需要原始数据
            drift_score, _ = stats.ks_2samp(
                baseline.distribution.values(),
                [current_stats.distribution[k] for k in baseline.distribution.keys()]
            )
            is_drifted = drift_score > 0.1

        elif method == "mean_shift":
            # 均值漂移检测
            if baseline.std > 0:
                z_score = abs(current_stats.mean - baseline.mean) / baseline.std
                drift_score = z_score
                is_drifted = z_score > 3
            else:
                drift_score = 0
                is_drifted = False
        else:
            raise ValueError(f"Unknown method: {method}")

        if is_drifted:
            self.alerts.append({
                "feature": feature_name,
                "method": method,
                "drift_score": drift_score,
                "timestamp": datetime.now().isoformat(),
                "baseline_mean": baseline.mean,
                "current_mean": current_stats.mean
            })

        return drift_score, is_drifted

    def _calculate_psi(
        self,
        baseline: FeatureStats,
        current: FeatureStats,
        bins: int = 10
    ) -> float:
        """
        计算 Population Stability Index (PSI)

        PSI < 0.1: 无显著变化
        0.1 <= PSI < 0.2: 轻微变化
        PSI >= 0.2: 显著变化
        """
        baseline_dist = np.array(list(baseline.distribution.values()))
        current_dist = np.array(list(current.distribution.values()))

        # 避免除零
        baseline_dist = np.clip(baseline_dist, 1e-10, None)
        current_dist = np.clip(current_dist, 1e-10, None)

        # 归一化
        baseline_dist = baseline_dist / baseline_dist.sum()
        current_dist = current_dist / current_dist.sum()

        # 计算 PSI
        psi = np.sum(
            (current_dist - baseline_dist) *
            np.log(current_dist / baseline_dist)
        )

        return psi

    def check_data_quality(
        self,
        df: pd.DataFrame
    ) -> Dict[str, List[str]]:
        """检查数据质量"""
        issues = {
            "null_ratio_high": [],
            "out_of_range": [],
            "unexpected_values": []
        }

        for feature_name, baseline in self.baseline_stats.items():
            if feature_name not in df.columns:
                continue

            col = df[feature_name]

            # 检查空值比例
            null_ratio = col.isnull().mean()
            if null_ratio > baseline.null_ratio * 2:
                issues["null_ratio_high"].append(
                    f"{feature_name}: {null_ratio:.2%} (baseline: {baseline.null_ratio:.2%})"
                )

            # 检查值范围
            if col.min() < baseline.min_val * 0.5 or col.max() > baseline.max_val * 2:
                issues["out_of_range"].append(
                    f"{feature_name}: [{col.min()}, {col.max()}] " +
                    f"(baseline: [{baseline.min_val}, {baseline.max_val}])"
                )

        return issues

    def generate_report(self, current_df: pd.DataFrame) -> Dict:
        """生成监控报告"""
        report = {
            "timestamp": datetime.now().isoformat(),
            "total_features": len(self.baseline_stats),
            "drift_summary": [],
            "quality_issues": self.check_data_quality(current_df),
            "alerts": self.alerts
        }

        for feature_name in self.baseline_stats.keys():
            if feature_name in current_df.columns:
                drift_score, is_drifted = self.detect_drift(
                    current_df, feature_name, method="psi"
                )
                report["drift_summary"].append({
                    "feature": feature_name,
                    "psi": drift_score,
                    "is_drifted": is_drifted
                })

        return report


# 使用示例
# 建立基线（使用训练数据）
baseline_data = pd.DataFrame({
    "lifetime_orders": np.random.poisson(20, 10000),
    "lifetime_amount": np.random.exponential(5000, 10000),
    "days_since_last_order": np.random.exponential(30, 10000)
})

baseline_stats = {}
for col in baseline_data.columns:
    monitor = FeatureMonitor({})
    baseline_stats[col] = monitor.compute_stats(baseline_data, col)

# 创建监控器
monitor = FeatureMonitor(baseline_stats)

# 监控生产数据
production_data = pd.DataFrame({
    "lifetime_orders": np.random.poisson(25, 1000),  # 轻微漂移
    "lifetime_amount": np.random.exponential(8000, 1000),  # 显著漂移
    "days_since_last_order": np.random.exponential(30, 1000)  # 无漂移
})

# 生成报告
report = monitor.generate_report(production_data)
print("特征监控报告:")
print(json.dumps(report, indent=2, default=str))
```

---

## 向量数据库集成

### 向量特征存储

在现代 ML 系统中，向量数据库不仅用于相似性搜索，还可以作为特征存储的一部分，存储 Embedding 特征。

```python
# vector_feature_store.py
"""
向量数据库作为特征存储
"""
from typing import List, Dict, Optional
import numpy as np

# Pinecone 示例
from pinecone import Pinecone, ServerlessSpec

class VectorFeatureStore:
    """基于向量数据库的特征存储"""

    def __init__(
        self,
        api_key: str,
        index_name: str,
        dimension: int = 768,
        metric: str = "cosine"
    ):
        self.pc = Pinecone(api_key=api_key)
        self.index_name = index_name
        self.dimension = dimension

        # 创建或获取索引
        if index_name not in self.pc.list_indexes().names():
            self.pc.create_index(
                name=index_name,
                dimension=dimension,
                metric=metric,
                spec=ServerlessSpec(
                    cloud="aws",
                    region="us-east-1"
                )
            )

        self.index = self.pc.Index(index_name)

    def upsert_embeddings(
        self,
        entity_ids: List[str],
        embeddings: np.ndarray,
        metadata: Optional[List[Dict]] = None,
        namespace: str = "default"
    ):
        """
        存储 Embedding 特征

        Args:
            entity_ids: 实体 ID 列表
            embeddings: Embedding 矩阵 (N x D)
            metadata: 附加元数据
            namespace: 命名空间
        """
        vectors = []
        for i, (entity_id, embedding) in enumerate(zip(entity_ids, embeddings)):
            vector_data = {
                "id": entity_id,
                "values": embedding.tolist()
            }
            if metadata and i < len(metadata):
                vector_data["metadata"] = metadata[i]
            vectors.append(vector_data)

        # 批量写入
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i + batch_size]
            self.index.upsert(vectors=batch, namespace=namespace)

    def get_embeddings(
        self,
        entity_ids: List[str],
        namespace: str = "default"
    ) -> Dict[str, np.ndarray]:
        """获取 Embedding 特征"""
        result = self.index.fetch(
            ids=entity_ids,
            namespace=namespace
        )

        embeddings = {}
        for entity_id, data in result["vectors"].items():
            embeddings[entity_id] = np.array(data["values"])

        return embeddings

    def find_similar(
        self,
        query_embedding: np.ndarray,
        top_k: int = 10,
        filter_dict: Optional[Dict] = None,
        namespace: str = "default"
    ) -> List[Dict]:
        """查找相似实体"""
        results = self.index.query(
            vector=query_embedding.tolist(),
            top_k=top_k,
            include_metadata=True,
            filter=filter_dict,
            namespace=namespace
        )

        return [
            {
                "id": match["id"],
                "score": match["score"],
                "metadata": match.get("metadata", {})
            }
            for match in results["matches"]
        ]


# Milvus 示例
from pymilvus import (
    connections, utility,
    Collection, FieldSchema, CollectionSchema, DataType
)

class MilvusFeatureStore:
    """基于 Milvus 的向量特征存储"""

    def __init__(
        self,
        host: str = "localhost",
        port: int = 19530,
        collection_name: str = "user_embeddings",
        dimension: int = 768
    ):
        connections.connect(host=host, port=port)

        self.collection_name = collection_name
        self.dimension = dimension

        # 创建 Collection
        if not utility.has_collection(collection_name):
            self._create_collection()

        self.collection = Collection(collection_name)
        self.collection.load()

    def _create_collection(self):
        """创建 Collection"""
        fields = [
            FieldSchema(name="entity_id", dtype=DataType.VARCHAR,
                       is_primary=True, max_length=64),
            FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR,
                       dim=self.dimension),
            FieldSchema(name="entity_type", dtype=DataType.VARCHAR, max_length=32),
            FieldSchema(name="updated_at", dtype=DataType.INT64),
        ]

        schema = CollectionSchema(
            fields=fields,
            description="Entity embedding storage"
        )

        collection = Collection(name=self.collection_name, schema=schema)

        # 创建索引
        index_params = {
            "metric_type": "COSINE",
            "index_type": "HNSW",
            "params": {"M": 16, "efConstruction": 256}
        }
        collection.create_index(
            field_name="embedding",
            index_params=index_params
        )

    def upsert(
        self,
        entity_ids: List[str],
        embeddings: List[List[float]],
        entity_type: str = "user",
        timestamp: int = None
    ):
        """写入或更新 Embedding"""
        import time
        timestamp = timestamp or int(time.time())

        data = [
            entity_ids,
            embeddings,
            [entity_type] * len(entity_ids),
            [timestamp] * len(entity_ids)
        ]

        self.collection.insert(data)
        self.collection.flush()

    def search_similar(
        self,
        query_embedding: List[float],
        top_k: int = 10,
        entity_type: Optional[str] = None
    ):
        """搜索相似实体"""
        search_params = {
            "metric_type": "COSINE",
            "params": {"ef": 64}
        }

        expr = None
        if entity_type:
            expr = f'entity_type == "{entity_type}"'

        results = self.collection.search(
            data=[query_embedding],
            anns_field="embedding",
            param=search_params,
            limit=top_k,
            expr=expr,
            output_fields=["entity_id", "entity_type"]
        )

        return [
            {
                "entity_id": hit.entity.get("entity_id"),
                "entity_type": hit.entity.get("entity_type"),
                "distance": hit.distance
            }
            for hit in results[0]
        ]
```

### Embedding 特征生成与管理

```python
# embedding_features.py
"""
Embedding 特征生成和管理
"""
from typing import List, Dict, Optional
import numpy as np
from sentence_transformers import SentenceTransformer
import torch

class EmbeddingFeatureGenerator:
    """Embedding 特征生成器"""

    def __init__(
        self,
        model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    ):
        self.model = SentenceTransformer(model_name)
        self.dimension = self.model.get_sentence_embedding_dimension()

    def generate_text_embeddings(
        self,
        texts: List[str],
        batch_size: int = 32,
        normalize: bool = True
    ) -> np.ndarray:
        """生成文本 Embedding"""
        embeddings = self.model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=True,
            normalize_embeddings=normalize
        )
        return embeddings

    def generate_user_embeddings(
        self,
        user_profiles: List[Dict],
        text_fields: List[str] = ["bio", "interests"]
    ) -> np.ndarray:
        """生成用户 Embedding"""
        user_texts = []

        for profile in user_profiles:
            # 合并多个文本字段
            text_parts = []
            for field in text_fields:
                if field in profile and profile[field]:
                    text_parts.append(str(profile[field]))
            user_texts.append(" ".join(text_parts))

        return self.generate_text_embeddings(user_texts)

    def generate_item_embeddings(
        self,
        items: List[Dict],
        text_fields: List[str] = ["title", "description", "category"]
    ) -> np.ndarray:
        """生成物品 Embedding"""
        item_texts = []

        for item in items:
            text_parts = []
            for field in text_fields:
                if field in item and item[field]:
                    text_parts.append(str(item[field]))
            item_texts.append(" ".join(text_parts))

        return self.generate_text_embeddings(item_texts)


class BehaviorEmbeddingGenerator:
    """基于行为序列的 Embedding 生成器"""

    def __init__(
        self,
        item_embedding_dim: int = 128,
        num_items: int = 100000
    ):
        self.item_embedding_dim = item_embedding_dim
        self.num_items = num_items

        # 简化示例：使用随机初始化的 item embedding
        # 实际应用中应从训练好的模型加载
        self.item_embeddings = np.random.randn(
            num_items, item_embedding_dim
        ).astype(np.float32)

    def generate_from_sequence(
        self,
        item_sequences: List[List[int]],
        aggregation: str = "mean"
    ) -> np.ndarray:
        """
        从行为序列生成用户 Embedding

        Args:
            item_sequences: 用户交互的物品 ID 序列
            aggregation: 聚合方式 (mean, attention, last_n)
        """
        user_embeddings = []

        for sequence in item_sequences:
            if not sequence:
                # 空序列用零向量
                user_embeddings.append(
                    np.zeros(self.item_embedding_dim)
                )
                continue

            # 获取序列中物品的 embedding
            item_embs = self.item_embeddings[sequence]

            if aggregation == "mean":
                user_emb = np.mean(item_embs, axis=0)
            elif aggregation == "last_n":
                # 使用最近 N 个物品
                n = min(10, len(item_embs))
                user_emb = np.mean(item_embs[-n:], axis=0)
            elif aggregation == "weighted":
                # 时间衰减加权
                weights = np.exp(np.linspace(-2, 0, len(item_embs)))
                weights = weights / weights.sum()
                user_emb = np.average(item_embs, axis=0, weights=weights)
            else:
                user_emb = np.mean(item_embs, axis=0)

            user_embeddings.append(user_emb)

        return np.array(user_embeddings)


# 使用示例
text_generator = EmbeddingFeatureGenerator()

# 生成用户文本 Embedding
user_profiles = [
    {"user_id": "u1", "bio": "热爱科技和编程", "interests": "AI, Python, 机器学习"},
    {"user_id": "u2", "bio": "喜欢旅行和美食", "interests": "旅游, 摄影, 美食"},
]

user_embeddings = text_generator.generate_user_embeddings(user_profiles)
print(f"用户 Embedding 维度: {user_embeddings.shape}")

# 生成物品 Embedding
items = [
    {"item_id": "i1", "title": "Python 编程入门", "category": "编程"},
    {"item_id": "i2", "title": "日本旅行攻略", "category": "旅游"},
]

item_embeddings = text_generator.generate_item_embeddings(items)
print(f"物品 Embedding 维度: {item_embeddings.shape}")

# 计算相似度
from sklearn.metrics.pairwise import cosine_similarity
similarity = cosine_similarity(user_embeddings, item_embeddings)
print(f"\n用户-物品相似度矩阵:\n{similarity}")
```

---

## 特征版本管理

### 特征版本控制系统

```python
# feature_versioning.py
"""
特征版本管理系统
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Any
import hashlib
import json
import sqlite3
from enum import Enum

class FeatureStatus(Enum):
    """特征状态"""
    DRAFT = "draft"
    ACTIVE = "active"
    DEPRECATED = "deprecated"
    ARCHIVED = "archived"

@dataclass
class FeatureVersion:
    """特征版本"""
    version_id: str
    feature_name: str
    version_number: int
    schema: Dict[str, Any]
    transformation: str
    created_at: datetime
    created_by: str
    status: FeatureStatus
    description: str = ""
    parent_version: Optional[str] = None

    @property
    def fingerprint(self) -> str:
        """计算特征指纹"""
        content = json.dumps({
            "schema": self.schema,
            "transformation": self.transformation
        }, sort_keys=True)
        return hashlib.sha256(content.encode()).hexdigest()[:12]

class FeatureRegistry:
    """特征注册表"""

    def __init__(self, db_path: str = "feature_registry.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """初始化数据库"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS feature_versions (
                version_id TEXT PRIMARY KEY,
                feature_name TEXT NOT NULL,
                version_number INTEGER NOT NULL,
                schema TEXT NOT NULL,
                transformation TEXT NOT NULL,
                created_at TEXT NOT NULL,
                created_by TEXT NOT NULL,
                status TEXT NOT NULL,
                description TEXT,
                parent_version TEXT,
                fingerprint TEXT NOT NULL,
                UNIQUE(feature_name, version_number)
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS feature_lineage (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                feature_version_id TEXT NOT NULL,
                source_table TEXT NOT NULL,
                source_columns TEXT NOT NULL,
                FOREIGN KEY(feature_version_id) REFERENCES feature_versions(version_id)
            )
        """)

        conn.commit()
        conn.close()

    def register_feature(
        self,
        feature_name: str,
        schema: Dict[str, Any],
        transformation: str,
        created_by: str,
        description: str = "",
        source_tables: List[str] = None,
        source_columns: Dict[str, List[str]] = None
    ) -> FeatureVersion:
        """注册新特征版本"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # 获取当前最新版本号
        cursor.execute(
            "SELECT MAX(version_number) FROM feature_versions WHERE feature_name = ?",
            (feature_name,)
        )
        result = cursor.fetchone()[0]
        version_number = (result or 0) + 1

        # 获取父版本
        parent_version = None
        if version_number > 1:
            cursor.execute(
                "SELECT version_id FROM feature_versions WHERE feature_name = ? AND version_number = ?",
                (feature_name, version_number - 1)
            )
            parent_result = cursor.fetchone()
            if parent_result:
                parent_version = parent_result[0]

        # 创建新版本
        version = FeatureVersion(
            version_id=f"{feature_name}_v{version_number}",
            feature_name=feature_name,
            version_number=version_number,
            schema=schema,
            transformation=transformation,
            created_at=datetime.now(),
            created_by=created_by,
            status=FeatureStatus.DRAFT,
            description=description,
            parent_version=parent_version
        )

        # 保存到数据库
        cursor.execute("""
            INSERT INTO feature_versions
            (version_id, feature_name, version_number, schema, transformation,
             created_at, created_by, status, description, parent_version, fingerprint)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            version.version_id,
            version.feature_name,
            version.version_number,
            json.dumps(version.schema),
            version.transformation,
            version.created_at.isoformat(),
            version.created_by,
            version.status.value,
            version.description,
            version.parent_version,
            version.fingerprint
        ))

        # 记录血缘关系
        if source_tables and source_columns:
            for table in source_tables:
                columns = source_columns.get(table, [])
                cursor.execute("""
                    INSERT INTO feature_lineage
                    (feature_version_id, source_table, source_columns)
                    VALUES (?, ?, ?)
                """, (version.version_id, table, json.dumps(columns)))

        conn.commit()
        conn.close()

        return version

    def activate_version(self, version_id: str):
        """激活特征版本"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # 获取特征名称
        cursor.execute(
            "SELECT feature_name FROM feature_versions WHERE version_id = ?",
            (version_id,)
        )
        feature_name = cursor.fetchone()[0]

        # 将同一特征的其他激活版本设为 deprecated
        cursor.execute("""
            UPDATE feature_versions
            SET status = ?
            WHERE feature_name = ? AND status = ?
        """, (FeatureStatus.DEPRECATED.value, feature_name, FeatureStatus.ACTIVE.value))

        # 激活新版本
        cursor.execute("""
            UPDATE feature_versions
            SET status = ?
            WHERE version_id = ?
        """, (FeatureStatus.ACTIVE.value, version_id))

        conn.commit()
        conn.close()

    def get_active_version(self, feature_name: str) -> Optional[FeatureVersion]:
        """获取激活的特征版本"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM feature_versions
            WHERE feature_name = ? AND status = ?
        """, (feature_name, FeatureStatus.ACTIVE.value))

        row = cursor.fetchone()
        conn.close()

        if row:
            return self._row_to_version(row)
        return None

    def get_version_history(self, feature_name: str) -> List[FeatureVersion]:
        """获取特征版本历史"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM feature_versions
            WHERE feature_name = ?
            ORDER BY version_number DESC
        """, (feature_name,))

        rows = cursor.fetchall()
        conn.close()

        return [self._row_to_version(row) for row in rows]

    def compare_versions(
        self,
        version_id_1: str,
        version_id_2: str
    ) -> Dict[str, Any]:
        """比较两个版本的差异"""
        v1 = self.get_version(version_id_1)
        v2 = self.get_version(version_id_2)

        return {
            "schema_changed": v1.schema != v2.schema,
            "transformation_changed": v1.transformation != v2.transformation,
            "fingerprint_1": v1.fingerprint,
            "fingerprint_2": v2.fingerprint,
            "schema_diff": self._diff_dict(v1.schema, v2.schema),
        }

    def get_version(self, version_id: str) -> Optional[FeatureVersion]:
        """获取指定版本"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute(
            "SELECT * FROM feature_versions WHERE version_id = ?",
            (version_id,)
        )

        row = cursor.fetchone()
        conn.close()

        if row:
            return self._row_to_version(row)
        return None

    def _row_to_version(self, row) -> FeatureVersion:
        """将数据库行转换为 FeatureVersion 对象"""
        return FeatureVersion(
            version_id=row[0],
            feature_name=row[1],
            version_number=row[2],
            schema=json.loads(row[3]),
            transformation=row[4],
            created_at=datetime.fromisoformat(row[5]),
            created_by=row[6],
            status=FeatureStatus(row[7]),
            description=row[8],
            parent_version=row[9]
        )

    def _diff_dict(self, d1: Dict, d2: Dict) -> Dict:
        """比较两个字典的差异"""
        diff = {
            "added": {},
            "removed": {},
            "changed": {}
        }

        all_keys = set(d1.keys()) | set(d2.keys())

        for key in all_keys:
            if key not in d1:
                diff["added"][key] = d2[key]
            elif key not in d2:
                diff["removed"][key] = d1[key]
            elif d1[key] != d2[key]:
                diff["changed"][key] = {
                    "old": d1[key],
                    "new": d2[key]
                }

        return diff


# 使用示例
registry = FeatureRegistry()

# 注册特征 v1
v1 = registry.register_feature(
    feature_name="user_purchase_stats",
    schema={
        "total_orders": {"dtype": "int64", "nullable": False},
        "total_amount": {"dtype": "float64", "nullable": False},
    },
    transformation="""
        SELECT
            user_id,
            COUNT(*) as total_orders,
            SUM(amount) as total_amount
        FROM orders
        GROUP BY user_id
    """,
    created_by="data-engineer",
    description="用户购买统计特征 v1",
    source_tables=["orders"],
    source_columns={"orders": ["user_id", "amount"]}
)

print(f"创建特征版本: {v1.version_id}")
print(f"特征指纹: {v1.fingerprint}")

# 激活版本
registry.activate_version(v1.version_id)

# 注册特征 v2（添加新字段）
v2 = registry.register_feature(
    feature_name="user_purchase_stats",
    schema={
        "total_orders": {"dtype": "int64", "nullable": False},
        "total_amount": {"dtype": "float64", "nullable": False},
        "avg_order_value": {"dtype": "float64", "nullable": False},  # 新增
    },
    transformation="""
        SELECT
            user_id,
            COUNT(*) as total_orders,
            SUM(amount) as total_amount,
            AVG(amount) as avg_order_value
        FROM orders
        GROUP BY user_id
    """,
    created_by="data-engineer",
    description="用户购买统计特征 v2 - 添加平均订单金额",
    source_tables=["orders"],
    source_columns={"orders": ["user_id", "amount"]}
)

print(f"\n创建特征版本: {v2.version_id}")
print(f"特征指纹: {v2.fingerprint}")

# 比较版本
diff = registry.compare_versions(v1.version_id, v2.version_id)
print(f"\n版本差异:")
print(json.dumps(diff, indent=2))

# 获取版本历史
history = registry.get_version_history("user_purchase_stats")
print(f"\n版本历史:")
for v in history:
    print(f"  {v.version_id}: {v.status.value} ({v.created_at})")
```

---

## 实时特征计算

### 流式特征计算架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                    实时特征计算架构                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│    事件源                流处理引擎              特征存储             │
│  ┌────────┐           ┌──────────┐          ┌──────────┐           │
│  │ Kafka  │──────────▶│  Flink   │─────────▶│  Redis   │           │
│  │        │           │          │          │          │           │
│  │ 用户行为│           │ 特征计算  │          │ 在线特征 │           │
│  │ 交易事件│           │ 窗口聚合  │          │          │           │
│  │ 点击流 │           │ 状态管理  │          │          │           │
│  └────────┘           └──────────┘          └──────────┘           │
│                             │                     │                 │
│                             │                     ▼                 │
│                             │              ┌──────────┐             │
│                             │              │ 推理服务 │             │
│                             │              └──────────┘             │
│                             │                                       │
│                             ▼                                       │
│                      ┌──────────┐                                   │
│                      │ Delta    │                                   │
│                      │ Lake     │                                   │
│                      │ (离线)   │                                   │
│                      └──────────┘                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Flink 实时特征计算

```python
# flink_streaming_features.py
"""
使用 PyFlink 进行实时特征计算
"""
from pyflink.datastream import StreamExecutionEnvironment
from pyflink.table import StreamTableEnvironment, EnvironmentSettings
from pyflink.table.window import Tumble, Slide
from pyflink.table import expressions as F

# 初始化环境
env = StreamExecutionEnvironment.get_execution_environment()
env.set_parallelism(4)

settings = EnvironmentSettings.new_instance() \
    .in_streaming_mode() \
    .build()

t_env = StreamTableEnvironment.create(env, settings)

# 创建 Kafka Source
t_env.execute_sql("""
    CREATE TABLE user_events (
        user_id STRING,
        event_type STRING,
        item_id STRING,
        amount DOUBLE,
        event_time TIMESTAMP(3),
        WATERMARK FOR event_time AS event_time - INTERVAL '5' SECOND
    ) WITH (
        'connector' = 'kafka',
        'topic' = 'user_events',
        'properties.bootstrap.servers' = 'localhost:9092',
        'properties.group.id' = 'feature_compute',
        'format' = 'json',
        'scan.startup.mode' = 'latest-offset'
    )
""")

# 创建 Redis Sink
t_env.execute_sql("""
    CREATE TABLE user_realtime_features (
        user_id STRING,
        window_end TIMESTAMP(3),
        event_count_5min BIGINT,
        purchase_amount_5min DOUBLE,
        unique_items_5min BIGINT,
        last_event_type STRING,
        PRIMARY KEY (user_id) NOT ENFORCED
    ) WITH (
        'connector' = 'redis',
        'mode' = 'single',
        'host' = 'localhost',
        'port' = '6379',
        'command' = 'HSET',
        'key' = 'user_features'
    )
""")

# 实时特征计算：5分钟滑动窗口
t_env.execute_sql("""
    INSERT INTO user_realtime_features
    SELECT
        user_id,
        TUMBLE_END(event_time, INTERVAL '5' MINUTE) as window_end,
        COUNT(*) as event_count_5min,
        SUM(CASE WHEN event_type = 'purchase' THEN amount ELSE 0 END) as purchase_amount_5min,
        COUNT(DISTINCT item_id) as unique_items_5min,
        LAST_VALUE(event_type) as last_event_type
    FROM user_events
    GROUP BY
        user_id,
        TUMBLE(event_time, INTERVAL '5' MINUTE)
""")

# 更复杂的实时特征：多窗口聚合
t_env.execute_sql("""
    CREATE TABLE user_multi_window_features (
        user_id STRING,
        -- 5分钟窗口
        events_5min BIGINT,
        amount_5min DOUBLE,
        -- 1小时窗口
        events_1h BIGINT,
        amount_1h DOUBLE,
        -- 实时速率
        event_rate_per_min DOUBLE,
        PRIMARY KEY (user_id) NOT ENFORCED
    ) WITH (
        'connector' = 'redis',
        'mode' = 'single',
        'host' = 'localhost',
        'port' = '6379',
        'command' = 'HSET',
        'key' = 'user_multi_features'
    )
""")

# 使用 SQL 实现多窗口特征
# 注：实际实现可能需要自定义聚合函数或使用 Table API
multi_window_query = """
WITH
window_5min AS (
    SELECT
        user_id,
        COUNT(*) as events_5min,
        SUM(amount) as amount_5min
    FROM user_events
    GROUP BY
        user_id,
        TUMBLE(event_time, INTERVAL '5' MINUTE)
),
window_1h AS (
    SELECT
        user_id,
        COUNT(*) as events_1h,
        SUM(amount) as amount_1h
    FROM user_events
    GROUP BY
        user_id,
        TUMBLE(event_time, INTERVAL '1' HOUR)
)
SELECT
    w5.user_id,
    w5.events_5min,
    w5.amount_5min,
    COALESCE(w1.events_1h, 0) as events_1h,
    COALESCE(w1.amount_1h, 0) as amount_1h,
    CAST(w5.events_5min AS DOUBLE) / 5.0 as event_rate_per_min
FROM window_5min w5
LEFT JOIN window_1h w1 ON w5.user_id = w1.user_id
"""
```

### Python 流式特征计算

```python
# streaming_features.py
"""
使用 Python 进行简化的流式特征计算
适用于中小规模场景
"""
import redis
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass
from collections import defaultdict
import asyncio
from kafka import KafkaConsumer

@dataclass
class StreamingWindow:
    """滑动窗口配置"""
    name: str
    duration_seconds: int
    slide_seconds: int

class StreamingFeatureComputer:
    """流式特征计算器"""

    def __init__(
        self,
        redis_client: redis.Redis,
        windows: List[StreamingWindow]
    ):
        self.redis = redis_client
        self.windows = windows
        # 内存中的窗口状态
        self.window_states: Dict[str, Dict[str, list]] = defaultdict(
            lambda: defaultdict(list)
        )

    def process_event(self, event: Dict):
        """处理单个事件"""
        user_id = event["user_id"]
        event_time = datetime.fromisoformat(event["event_time"])

        # 更新每个窗口
        for window in self.windows:
            self._update_window(user_id, event, event_time, window)

        # 计算并写入特征
        features = self._compute_features(user_id)
        self._write_features(user_id, features)

    def _update_window(
        self,
        user_id: str,
        event: Dict,
        event_time: datetime,
        window: StreamingWindow
    ):
        """更新窗口状态"""
        window_key = f"{user_id}:{window.name}"

        # 添加新事件
        self.window_states[window_key]["events"].append({
            "event": event,
            "timestamp": event_time
        })

        # 清理过期事件
        cutoff_time = event_time - timedelta(seconds=window.duration_seconds)
        self.window_states[window_key]["events"] = [
            e for e in self.window_states[window_key]["events"]
            if e["timestamp"] > cutoff_time
        ]

    def _compute_features(self, user_id: str) -> Dict:
        """计算特征"""
        features = {}

        for window in self.windows:
            window_key = f"{user_id}:{window.name}"
            events = self.window_states[window_key]["events"]

            if events:
                # 事件计数
                features[f"event_count_{window.name}"] = len(events)

                # 购买金额
                purchase_events = [
                    e["event"] for e in events
                    if e["event"].get("event_type") == "purchase"
                ]
                features[f"purchase_amount_{window.name}"] = sum(
                    e.get("amount", 0) for e in purchase_events
                )

                # 唯一物品数
                unique_items = set(
                    e["event"].get("item_id") for e in events
                    if e["event"].get("item_id")
                )
                features[f"unique_items_{window.name}"] = len(unique_items)

                # 最后事件类型
                features[f"last_event_type_{window.name}"] = events[-1]["event"].get("event_type")
            else:
                features[f"event_count_{window.name}"] = 0
                features[f"purchase_amount_{window.name}"] = 0.0
                features[f"unique_items_{window.name}"] = 0
                features[f"last_event_type_{window.name}"] = None

        return features

    def _write_features(self, user_id: str, features: Dict):
        """写入 Redis"""
        key = f"realtime_features:{user_id}"
        features["updated_at"] = datetime.now().isoformat()
        self.redis.hset(key, mapping={
            k: json.dumps(v) if not isinstance(v, (int, float, str)) else str(v)
            for k, v in features.items()
        })
        self.redis.expire(key, 86400)  # 24小时过期


async def consume_events(computer: StreamingFeatureComputer):
    """消费 Kafka 事件"""
    consumer = KafkaConsumer(
        'user_events',
        bootstrap_servers=['localhost:9092'],
        value_deserializer=lambda m: json.loads(m.decode('utf-8')),
        group_id='feature_compute',
        auto_offset_reset='latest'
    )

    for message in consumer:
        event = message.value
        computer.process_event(event)


# 使用示例
redis_client = redis.Redis(host='localhost', port=6379)

windows = [
    StreamingWindow(name="5min", duration_seconds=300, slide_seconds=60),
    StreamingWindow(name="1hour", duration_seconds=3600, slide_seconds=300),
]

computer = StreamingFeatureComputer(redis_client, windows)

# 模拟事件处理
events = [
    {
        "user_id": "u1",
        "event_type": "view",
        "item_id": "item_1",
        "amount": 0,
        "event_time": datetime.now().isoformat()
    },
    {
        "user_id": "u1",
        "event_type": "purchase",
        "item_id": "item_2",
        "amount": 99.99,
        "event_time": datetime.now().isoformat()
    },
    {
        "user_id": "u1",
        "event_type": "view",
        "item_id": "item_3",
        "amount": 0,
        "event_time": datetime.now().isoformat()
    },
]

for event in events:
    computer.process_event(event)

# 读取计算结果
features = redis_client.hgetall("realtime_features:u1")
print("实时特征:")
for k, v in features.items():
    print(f"  {k.decode()}: {v.decode()}")
```

---

## 面试要点

### 核心概念题

**Q1: 什么是特征存储？它解决了什么问题？**

```
特征存储是管理、存储和服务 ML 特征的专用系统。

核心解决的问题：
1. 特征复用 - 避免重复计算，跨团队共享
2. 训练-推理一致性 - 统一特征计算逻辑
3. 特征发现 - 提供特征目录和元数据
4. 时间旅行 - 支持历史特征获取和回测
5. 特征版本管理 - 追踪特征变化
```

**Q2: 离线特征和在线特征的区别？**

```
离线特征：
- 用于模型训练和批量推理
- 存储在数据湖/数仓（Delta Lake, Parquet）
- 延迟要求低，可以秒级到分钟级
- 支持大规模历史数据

在线特征：
- 用于实时推理
- 存储在低延迟存储（Redis, DynamoDB）
- 延迟要求高，毫秒级响应
- 单条/小批量查询
```

**Q3: 什么是 Training-Serving Skew？如何解决？**

```
Training-Serving Skew 是指训练时和推理时特征不一致的问题。

常见原因：
1. 特征计算逻辑不一致（训练用 SQL，推理用 Python）
2. 数据处理管道不同
3. 时间戳处理差异
4. 缺失值处理不同

解决方案：
1. 使用统一的特征转换器（训练/推理共用）
2. 将特征计算逻辑中心化到特征存储
3. 特征监控和漂移检测
4. 特征版本管理
```

### 系统设计题

**Q4: 设计一个支持千万级用户的实时特征系统**

```python
"""
系统设计要点：

1. 数据流架构
   - Kafka 接收用户事件
   - Flink 进行实时特征计算
   - Redis Cluster 存储在线特征
   - Delta Lake 存储离线特征

2. 特征计算策略
   - 实时特征：流式计算，5分钟窗口
   - 近实时特征：微批处理，每小时更新
   - 离线特征：批处理，每天更新

3. 存储设计
   - Redis Cluster：16 分片，主从复制
   - 特征 Key 设计：feature:{entity_type}:{entity_id}:{feature_name}
   - TTL 策略：实时特征 24h，离线特征 7d

4. 服务层
   - 特征服务 API：支持批量获取
   - 缓存策略：本地缓存 + Redis
   - 降级策略：特征缺失时使用默认值

5. 监控
   - 特征延迟监控
   - 特征漂移检测
   - 数据质量检查
"""

class ScalableFeatureSystem:
    def __init__(self):
        # 流处理
        self.streaming_engine = FlinkCluster()

        # 在线存储
        self.online_store = RedisCluster(
            nodes=["redis-1:6379", "redis-2:6379", ...],
            replicas=2
        )

        # 离线存储
        self.offline_store = DeltaLake(
            path="s3://feature-store/",
            partitions=["entity_type", "feature_date"]
        )

        # 特征服务
        self.feature_service = FeatureService(
            online_store=self.online_store,
            offline_store=self.offline_store,
            cache_ttl=60
        )
```

**Q5: 如何保证特征的一致性和质量？**

```
1. 一致性保证
   - 统一特征定义（Schema + 转换逻辑）
   - 版本管理和血缘追踪
   - 训练/推理使用同一套特征计算代码

2. 质量保证
   - 数据验证（空值、范围、类型）
   - 特征漂移监控（PSI、KS 检验）
   - 统计信息追踪（均值、方差、分布）

3. 自动化检查
   - CI/CD 中的特征测试
   - 定期数据质量报告
   - 异常告警
```

### 实战经验题

**Q6: 特征存储选型建议？**

```
开源方案：
- Feast：轻量级，易于上手，社区活跃
- Hopsworks：功能全面，支持 GPU 训练

商业方案：
- Tecton：Feast 商业版，生产级稳定性
- Databricks Feature Store：与 Spark/MLflow 集成
- AWS SageMaker Feature Store：AWS 生态集成

选型考虑：
1. 团队规模和技术栈
2. 实时性要求
3. 数据规模
4. 现有基础设施
```

---

## 总结

特征存储是构建生产级 ML 系统的关键基础设施。本文涵盖了：

1. **数据湖架构**：Bronze-Silver-Gold 分层，Delta Lake 等现代格式
2. **特征存储概念**：核心价值、架构组件、特征生命周期
3. **Feast 实战**：特征定义、物化、在线/离线服务
4. **离线/在线特征**：存储选型、计算策略、同步机制
5. **特征一致性**：Training-Serving Skew 问题及解决方案
6. **向量数据库**：Embedding 特征存储与检索
7. **版本管理**：特征版本控制和血缘追踪
8. **实时计算**：Flink 流式特征、窗口聚合

构建特征存储系统需要综合考虑数据规模、实时性要求、团队能力等因素。建议从简单场景开始，逐步演进到完整的特征平台。
