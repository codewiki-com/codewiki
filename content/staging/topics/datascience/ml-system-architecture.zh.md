---
title: 机器学习系统设计：整体架构
description: 设计端到端ML系统：特征平台、训练平台和推理平台
track: datascience
section: deployment
difficulty: advanced
tags:
  - ML系统
  - 架构
  - 平台
  - 工程
status: imported
origin: old/src/content/docs/datascience/ml-system-architecture.zh.md
divergence: 0.224
issues: []
legacy:
  category: DataScience
  subcategory: MLSystems
  order: 40
  lastUpdated: 2026-01-07
---

机器学习系统的设计远不止于模型的训练和调优。在生产环境中，一个完整的 ML 系统需要涵盖数据管理、特征工程、模型训练、模型服务、监控告警等多个环节。本文将从系统架构的角度，深入探讨如何设计和构建企业级的机器学习平台。

## ML 系统全景图

### 端到端 ML 系统架构

一个完整的机器学习系统通常包含以下核心组件：

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                              ML 系统全景架构                                    │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   数据源    │───▶│  数据管道   │───▶│  特征平台   │───▶│  训练平台   │     │
│  │ (Data Lake) │    │ (Pipeline)  │    │(Feature Str)│    │ (Training)  │     │
│  └─────────────┘    └─────────────┘    └─────────────┘    └──────┬──────┘     │
│                                                                   │            │
│                                              ┌────────────────────┘            │
│                                              ▼                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   监控告警  │◀───│  推理平台   │◀───│ 模型注册中心│◀───│  模型验证   │     │
│  │(Monitoring) │    │ (Serving)   │    │(Model Regis)│    │(Validation) │     │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

### ML 系统的三大支柱

| 支柱 | 核心职责 | 关键技术 |
|------|----------|----------|
| **特征平台** | 特征存储、计算、服务 | 特征存储、实时计算、离线计算 |
| **训练平台** | 模型训练、实验管理、超参优化 | 分布式训练、AutoML、实验追踪 |
| **推理平台** | 模型部署、在线预测、批量推理 | 模型服务、A/B测试、流量控制 |

### MLOps 成熟度模型

```
Level 0: 手动过程
├── 数据科学家手动训练模型
├── 手动部署模型到生产环境
└── 无自动化流程

Level 1: ML 流水线自动化
├── 自动化数据处理和特征工程
├── 持续训练 (CT)
└── 模型自动部署

Level 2: CI/CD 流水线自动化
├── 代码版本控制
├── 模型版本控制
├── 自动化测试和验证
└── 持续集成/持续部署

Level 3: 全自动化 MLOps
├── 自动特征工程
├── 自动模型选择和超参优化
├── 自动监控和重训练
└── 端到端可观测性
```

## 数据管道设计

### 数据管道架构

数据管道是 ML 系统的基础，负责将原始数据转化为可用于训练和推理的特征。

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              数据管道架构                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   数据源层                    处理层                       存储层             │
│  ┌─────────┐              ┌─────────────┐            ┌─────────────┐        │
│  │  日志   │─────┐        │             │            │   数据湖    │        │
│  └─────────┘     │        │   批处理    │───────────▶│   (Parquet) │        │
│  ┌─────────┐     │   ┌───▶│   (Spark)   │            └─────────────┘        │
│  │  数据库 │─────┼───┤    │             │                                    │
│  └─────────┘     │   │    └─────────────┘            ┌─────────────┐        │
│  ┌─────────┐     │   │    ┌─────────────┐            │  特征存储   │        │
│  │  API    │─────┘   └───▶│   流处理    │───────────▶│  (Feature   │        │
│  └─────────┘              │(Flink/Kafka)│            │   Store)    │        │
│  ┌─────────┐              │             │            └─────────────┘        │
│  │  事件流 │─────────────▶│             │                                    │
│  └─────────┘              └─────────────┘                                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 批处理与流处理

**批处理管道（离线）：**

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, when, avg, count
from datetime import datetime, timedelta

class BatchFeaturePipeline:
    """批量特征处理管道"""

    def __init__(self, spark: SparkSession):
        self.spark = spark

    def extract_user_features(self, date: str) -> "DataFrame":
        """提取用户行为特征"""
        # 读取用户行为日志
        user_logs = self.spark.read.parquet(
            f"s3://data-lake/user_logs/dt={date}"
        )

        # 计算用户统计特征
        user_features = user_logs.groupBy("user_id").agg(
            count("*").alias("total_actions"),
            count(when(col("action") == "click", 1)).alias("click_count"),
            count(when(col("action") == "purchase", 1)).alias("purchase_count"),
            avg("session_duration").alias("avg_session_duration"),
            avg("page_views").alias("avg_page_views")
        )

        # 计算转化率特征
        user_features = user_features.withColumn(
            "click_to_purchase_rate",
            col("purchase_count") / col("click_count")
        ).fillna(0)

        return user_features

    def extract_item_features(self, date: str) -> "DataFrame":
        """提取商品特征"""
        item_logs = self.spark.read.parquet(
            f"s3://data-lake/item_logs/dt={date}"
        )

        item_features = item_logs.groupBy("item_id").agg(
            count("*").alias("total_views"),
            count(when(col("action") == "add_cart", 1)).alias("add_cart_count"),
            count(when(col("action") == "purchase", 1)).alias("purchase_count"),
            avg("price").alias("avg_price"),
            avg("rating").alias("avg_rating")
        )

        return item_features

    def run_pipeline(self, date: str):
        """执行完整的特征管道"""
        # 提取特征
        user_features = self.extract_user_features(date)
        item_features = self.extract_item_features(date)

        # 写入特征存储
        user_features.write.mode("overwrite").parquet(
            f"s3://feature-store/user_features/dt={date}"
        )
        item_features.write.mode("overwrite").parquet(
            f"s3://feature-store/item_features/dt={date}"
        )

        print(f"Pipeline completed for date: {date}")
```

**流处理管道（实时）：**

```python
from pyflink.datastream import StreamExecutionEnvironment
from pyflink.table import StreamTableEnvironment, EnvironmentSettings
from pyflink.table.window import Tumble
from pyflink.table.expressions import col, lit

class StreamFeaturePipeline:
    """实时特征处理管道"""

    def __init__(self):
        env = StreamExecutionEnvironment.get_execution_environment()
        settings = EnvironmentSettings.new_instance() \
            .in_streaming_mode() \
            .build()
        self.t_env = StreamTableEnvironment.create(env, settings)

    def setup_source(self):
        """配置 Kafka 数据源"""
        self.t_env.execute_sql("""
            CREATE TABLE user_events (
                user_id STRING,
                event_type STRING,
                item_id STRING,
                timestamp TIMESTAMP(3),
                WATERMARK FOR timestamp AS timestamp - INTERVAL '5' SECOND
            ) WITH (
                'connector' = 'kafka',
                'topic' = 'user-events',
                'properties.bootstrap.servers' = 'kafka:9092',
                'format' = 'json',
                'scan.startup.mode' = 'latest-offset'
            )
        """)

    def setup_sink(self):
        """配置特征存储 Sink"""
        self.t_env.execute_sql("""
            CREATE TABLE realtime_features (
                user_id STRING,
                window_start TIMESTAMP(3),
                click_count BIGINT,
                view_count BIGINT,
                purchase_count BIGINT,
                PRIMARY KEY (user_id, window_start) NOT ENFORCED
            ) WITH (
                'connector' = 'redis',
                'redis.host' = 'redis',
                'redis.port' = '6379'
            )
        """)

    def compute_realtime_features(self):
        """计算实时特征"""
        self.t_env.execute_sql("""
            INSERT INTO realtime_features
            SELECT
                user_id,
                TUMBLE_START(timestamp, INTERVAL '5' MINUTE) as window_start,
                COUNT(CASE WHEN event_type = 'click' THEN 1 END) as click_count,
                COUNT(CASE WHEN event_type = 'view' THEN 1 END) as view_count,
                COUNT(CASE WHEN event_type = 'purchase' THEN 1 END) as purchase_count
            FROM user_events
            GROUP BY
                user_id,
                TUMBLE(timestamp, INTERVAL '5' MINUTE)
        """)
```

### 数据质量监控

```python
from dataclasses import dataclass
from typing import Dict, List, Optional
import pandas as pd
import numpy as np
from scipy import stats

@dataclass
class DataQualityCheck:
    """数据质量检查结果"""
    check_name: str
    passed: bool
    message: str
    details: Optional[Dict] = None

class DataQualityMonitor:
    """数据质量监控器"""

    def __init__(self, baseline_stats: Dict):
        self.baseline_stats = baseline_stats
        self.checks: List[DataQualityCheck] = []

    def check_null_ratio(self, df: pd.DataFrame,
                         column: str,
                         threshold: float = 0.1) -> DataQualityCheck:
        """检查空值比例"""
        null_ratio = df[column].isnull().mean()
        passed = null_ratio <= threshold

        return DataQualityCheck(
            check_name=f"null_ratio_{column}",
            passed=passed,
            message=f"Null ratio: {null_ratio:.2%} (threshold: {threshold:.2%})",
            details={"null_ratio": null_ratio, "threshold": threshold}
        )

    def check_value_range(self, df: pd.DataFrame,
                          column: str,
                          min_val: float,
                          max_val: float) -> DataQualityCheck:
        """检查数值范围"""
        out_of_range = ((df[column] < min_val) | (df[column] > max_val)).mean()
        passed = out_of_range <= 0.01  # 允许1%的异常值

        return DataQualityCheck(
            check_name=f"value_range_{column}",
            passed=passed,
            message=f"Out of range ratio: {out_of_range:.2%}",
            details={
                "out_of_range_ratio": out_of_range,
                "min_val": min_val,
                "max_val": max_val
            }
        )

    def check_distribution_drift(self, df: pd.DataFrame,
                                  column: str,
                                  p_threshold: float = 0.05) -> DataQualityCheck:
        """检查分布漂移（使用 KS 检验）"""
        baseline_values = self.baseline_stats.get(f"{column}_values", [])
        current_values = df[column].dropna().values

        if len(baseline_values) == 0 or len(current_values) == 0:
            return DataQualityCheck(
                check_name=f"distribution_drift_{column}",
                passed=True,
                message="Insufficient data for drift check"
            )

        # KS 检验
        statistic, p_value = stats.ks_2samp(baseline_values, current_values)
        passed = p_value >= p_threshold

        return DataQualityCheck(
            check_name=f"distribution_drift_{column}",
            passed=passed,
            message=f"KS statistic: {statistic:.4f}, p-value: {p_value:.4f}",
            details={"ks_statistic": statistic, "p_value": p_value}
        )

    def check_schema(self, df: pd.DataFrame,
                     expected_columns: List[str]) -> DataQualityCheck:
        """检查数据 Schema"""
        missing_columns = set(expected_columns) - set(df.columns)
        passed = len(missing_columns) == 0

        return DataQualityCheck(
            check_name="schema_check",
            passed=passed,
            message=f"Missing columns: {missing_columns}" if missing_columns else "All columns present",
            details={"missing_columns": list(missing_columns)}
        )

    def run_all_checks(self, df: pd.DataFrame,
                       config: Dict) -> List[DataQualityCheck]:
        """运行所有质量检查"""
        checks = []

        # Schema 检查
        checks.append(self.check_schema(df, config.get("expected_columns", [])))

        # 空值检查
        for column, threshold in config.get("null_checks", {}).items():
            checks.append(self.check_null_ratio(df, column, threshold))

        # 范围检查
        for column, (min_val, max_val) in config.get("range_checks", {}).items():
            checks.append(self.check_value_range(df, column, min_val, max_val))

        # 分布漂移检查
        for column in config.get("drift_check_columns", []):
            checks.append(self.check_distribution_drift(df, column))

        self.checks = checks
        return checks

    def generate_report(self) -> Dict:
        """生成质量报告"""
        total_checks = len(self.checks)
        passed_checks = sum(1 for c in self.checks if c.passed)

        return {
            "summary": {
                "total_checks": total_checks,
                "passed_checks": passed_checks,
                "failed_checks": total_checks - passed_checks,
                "pass_rate": passed_checks / total_checks if total_checks > 0 else 0
            },
            "details": [
                {
                    "check_name": c.check_name,
                    "passed": c.passed,
                    "message": c.message,
                    "details": c.details
                }
                for c in self.checks
            ]
        }
```

## 特征平台设计

### 特征平台架构

特征平台（Feature Store）是现代 ML 系统的核心组件，它解决了特征复用、一致性、版本管理等关键问题。

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              特征平台架构                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                            ┌─────────────────┐                               │
│                            │   特征注册中心   │                               │
│                            │  (Feature Reg)  │                               │
│                            └────────┬────────┘                               │
│                                     │                                        │
│    ┌────────────────────────────────┼────────────────────────────────┐       │
│    │                                │                                │       │
│    ▼                                ▼                                ▼       │
│  ┌──────────────┐           ┌──────────────┐            ┌──────────────┐    │
│  │   离线存储   │           │   在线存储   │            │   特征服务   │    │
│  │   (Hive/S3)  │◀─────────▶│   (Redis)    │◀──────────▶│  (Feature    │    │
│  │              │   同步     │              │   读取     │   Server)    │    │
│  └──────────────┘           └──────────────┘            └──────────────┘    │
│         │                          │                           │            │
│         │                          │                           │            │
│         ▼                          ▼                           ▼            │
│  ┌──────────────┐           ┌──────────────┐            ┌──────────────┐    │
│  │   模型训练   │           │   实时推理   │            │   批量推理   │    │
│  └──────────────┘           └──────────────┘            └──────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 特征存储实现

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from datetime import datetime
import json
import redis
import pandas as pd
from pyarrow import parquet as pq

@dataclass
class FeatureDefinition:
    """特征定义"""
    name: str
    dtype: str
    description: str
    entity: str  # 关联的实体类型（如 user, item）
    tags: List[str] = field(default_factory=list)
    owner: str = ""
    created_at: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> Dict:
        return {
            "name": self.name,
            "dtype": self.dtype,
            "description": self.description,
            "entity": self.entity,
            "tags": self.tags,
            "owner": self.owner,
            "created_at": self.created_at.isoformat()
        }

@dataclass
class FeatureGroup:
    """特征组"""
    name: str
    entity: str
    features: List[FeatureDefinition]
    description: str = ""
    version: int = 1

class FeatureStore(ABC):
    """特征存储抽象基类"""

    @abstractmethod
    def get_online_features(self, entity_ids: List[str],
                           feature_names: List[str]) -> pd.DataFrame:
        """获取在线特征"""
        pass

    @abstractmethod
    def get_offline_features(self, entity_ids: List[str],
                            feature_names: List[str],
                            start_time: datetime,
                            end_time: datetime) -> pd.DataFrame:
        """获取离线特征（用于训练）"""
        pass

    @abstractmethod
    def materialize_features(self, feature_group: str,
                            start_time: datetime,
                            end_time: datetime):
        """物化特征到在线存储"""
        pass

class RedisOnlineStore:
    """Redis 在线特征存储"""

    def __init__(self, host: str = "localhost", port: int = 6379):
        self.client = redis.Redis(host=host, port=port, decode_responses=True)
        self.feature_ttl = 86400 * 7  # 7天过期

    def _get_key(self, entity: str, entity_id: str, feature_group: str) -> str:
        """生成 Redis key"""
        return f"features:{entity}:{entity_id}:{feature_group}"

    def set_features(self, entity: str, entity_id: str,
                     feature_group: str, features: Dict[str, Any]):
        """写入特征"""
        key = self._get_key(entity, entity_id, feature_group)
        self.client.hset(key, mapping=features)
        self.client.expire(key, self.feature_ttl)

    def get_features(self, entity: str, entity_id: str,
                    feature_group: str,
                    feature_names: Optional[List[str]] = None) -> Dict[str, Any]:
        """读取特征"""
        key = self._get_key(entity, entity_id, feature_group)

        if feature_names:
            values = self.client.hmget(key, feature_names)
            return dict(zip(feature_names, values))
        else:
            return self.client.hgetall(key)

    def batch_get_features(self, entity: str, entity_ids: List[str],
                          feature_group: str,
                          feature_names: List[str]) -> pd.DataFrame:
        """批量读取特征"""
        pipe = self.client.pipeline()

        for entity_id in entity_ids:
            key = self._get_key(entity, entity_id, feature_group)
            pipe.hmget(key, feature_names)

        results = pipe.execute()

        data = []
        for entity_id, values in zip(entity_ids, results):
            row = {"entity_id": entity_id}
            row.update(dict(zip(feature_names, values)))
            data.append(row)

        return pd.DataFrame(data)

class ParquetOfflineStore:
    """Parquet 离线特征存储"""

    def __init__(self, base_path: str):
        self.base_path = base_path

    def _get_path(self, feature_group: str, date: str) -> str:
        """生成存储路径"""
        return f"{self.base_path}/{feature_group}/dt={date}"

    def write_features(self, feature_group: str, date: str,
                       df: pd.DataFrame):
        """写入特征"""
        path = self._get_path(feature_group, date)
        df.to_parquet(path, index=False)

    def read_features(self, feature_group: str,
                     start_date: str, end_date: str,
                     entity_ids: Optional[List[str]] = None) -> pd.DataFrame:
        """读取特征"""
        # 生成日期范围
        dates = pd.date_range(start_date, end_date, freq='D')

        dfs = []
        for date in dates:
            path = self._get_path(feature_group, date.strftime('%Y-%m-%d'))
            try:
                df = pd.read_parquet(path)
                if entity_ids:
                    df = df[df['entity_id'].isin(entity_ids)]
                dfs.append(df)
            except FileNotFoundError:
                continue

        if not dfs:
            return pd.DataFrame()

        return pd.concat(dfs, ignore_index=True)

class FeatureStoreService:
    """特征存储服务"""

    def __init__(self, online_store: RedisOnlineStore,
                 offline_store: ParquetOfflineStore):
        self.online_store = online_store
        self.offline_store = offline_store
        self.feature_registry: Dict[str, FeatureGroup] = {}

    def register_feature_group(self, feature_group: FeatureGroup):
        """注册特征组"""
        self.feature_registry[feature_group.name] = feature_group
        print(f"Registered feature group: {feature_group.name}")

    def get_online_features(self, entity: str, entity_ids: List[str],
                           feature_groups: List[str]) -> pd.DataFrame:
        """获取在线特征"""
        result_df = pd.DataFrame({"entity_id": entity_ids})

        for fg_name in feature_groups:
            fg = self.feature_registry.get(fg_name)
            if not fg:
                continue

            feature_names = [f.name for f in fg.features]
            features_df = self.online_store.batch_get_features(
                entity, entity_ids, fg_name, feature_names
            )

            result_df = result_df.merge(features_df, on="entity_id", how="left")

        return result_df

    def get_training_data(self, entity: str, entity_ids: List[str],
                         feature_groups: List[str],
                         start_date: str, end_date: str) -> pd.DataFrame:
        """获取训练数据"""
        result_df = pd.DataFrame({"entity_id": entity_ids})

        for fg_name in feature_groups:
            features_df = self.offline_store.read_features(
                fg_name, start_date, end_date, entity_ids
            )

            if not features_df.empty:
                result_df = result_df.merge(features_df, on="entity_id", how="left")

        return result_df

    def materialize(self, feature_group: str, date: str):
        """物化特征：从离线存储同步到在线存储"""
        fg = self.feature_registry.get(feature_group)
        if not fg:
            raise ValueError(f"Feature group {feature_group} not found")

        # 读取离线特征
        df = self.offline_store.read_features(feature_group, date, date)

        if df.empty:
            print(f"No data to materialize for {feature_group} on {date}")
            return

        # 写入在线存储
        feature_names = [f.name for f in fg.features]
        for _, row in df.iterrows():
            entity_id = row["entity_id"]
            features = {name: row[name] for name in feature_names if name in row}
            self.online_store.set_features(fg.entity, entity_id, feature_group, features)

        print(f"Materialized {len(df)} records for {feature_group}")
```

### 特征服务 API

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn

app = FastAPI(title="Feature Store API")

# 全局特征存储服务实例
feature_store: Optional[FeatureStoreService] = None

class OnlineFeatureRequest(BaseModel):
    """在线特征请求"""
    entity: str
    entity_ids: List[str]
    feature_groups: List[str]

class OnlineFeatureResponse(BaseModel):
    """在线特征响应"""
    features: List[Dict[str, Any]]

class TrainingDataRequest(BaseModel):
    """训练数据请求"""
    entity: str
    entity_ids: List[str]
    feature_groups: List[str]
    start_date: str
    end_date: str

@app.post("/features/online", response_model=OnlineFeatureResponse)
async def get_online_features(request: OnlineFeatureRequest):
    """获取在线特征"""
    if not feature_store:
        raise HTTPException(status_code=500, detail="Feature store not initialized")

    df = feature_store.get_online_features(
        request.entity,
        request.entity_ids,
        request.feature_groups
    )

    return OnlineFeatureResponse(features=df.to_dict(orient="records"))

@app.post("/features/training")
async def get_training_features(request: TrainingDataRequest):
    """获取训练特征"""
    if not feature_store:
        raise HTTPException(status_code=500, detail="Feature store not initialized")

    df = feature_store.get_training_data(
        request.entity,
        request.entity_ids,
        request.feature_groups,
        request.start_date,
        request.end_date
    )

    return {"features": df.to_dict(orient="records")}

@app.get("/feature-groups")
async def list_feature_groups():
    """列出所有特征组"""
    if not feature_store:
        raise HTTPException(status_code=500, detail="Feature store not initialized")

    return {
        "feature_groups": [
            {
                "name": fg.name,
                "entity": fg.entity,
                "version": fg.version,
                "feature_count": len(fg.features)
            }
            for fg in feature_store.feature_registry.values()
        ]
    }

@app.get("/feature-groups/{name}")
async def get_feature_group(name: str):
    """获取特征组详情"""
    if not feature_store:
        raise HTTPException(status_code=500, detail="Feature store not initialized")

    fg = feature_store.feature_registry.get(name)
    if not fg:
        raise HTTPException(status_code=404, detail=f"Feature group {name} not found")

    return {
        "name": fg.name,
        "entity": fg.entity,
        "version": fg.version,
        "description": fg.description,
        "features": [f.to_dict() for f in fg.features]
    }
```

## 训练平台架构

### 训练平台整体架构

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              训练平台架构                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         实验管理层                                   │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        │    │
│  │  │实验追踪   │  │超参优化   │  │模型比较   │  │可视化     │        │    │
│  │  │(MLflow)   │  │(Optuna)   │  │(Dashboard)│  │(TensorBrd)│        │    │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                     │                                        │
│                                     ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         训练执行层                                   │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        │    │
│  │  │单机训练   │  │分布式训练 │  │GPU 集群   │  │任务调度   │        │    │
│  │  │(PyTorch)  │  │(Horovod)  │  │(K8s+GPU)  │  │(Kubeflow) │        │    │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                     │                                        │
│                                     ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         资源管理层                                   │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        │    │
│  │  │计算资源   │  │存储资源   │  │网络资源   │  │成本控制   │        │    │
│  │  │(CPU/GPU)  │  │(S3/HDFS)  │  │(高速网络) │  │(Quota)    │        │    │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 实验追踪系统

```python
import mlflow
import mlflow.pytorch
from dataclasses import dataclass
from typing import Dict, Any, Optional, List
import json
import os
from datetime import datetime

@dataclass
class ExperimentConfig:
    """实验配置"""
    name: str
    model_type: str
    hyperparameters: Dict[str, Any]
    data_config: Dict[str, Any]
    tags: Dict[str, str] = None

    def to_dict(self) -> Dict:
        return {
            "name": self.name,
            "model_type": self.model_type,
            "hyperparameters": self.hyperparameters,
            "data_config": self.data_config,
            "tags": self.tags or {}
        }

class ExperimentTracker:
    """实验追踪器"""

    def __init__(self, tracking_uri: str = "http://mlflow:5000"):
        mlflow.set_tracking_uri(tracking_uri)
        self.current_run = None

    def start_experiment(self, config: ExperimentConfig) -> str:
        """开始实验"""
        # 设置实验
        mlflow.set_experiment(config.name)

        # 开始运行
        self.current_run = mlflow.start_run()
        run_id = self.current_run.info.run_id

        # 记录配置
        mlflow.log_params(config.hyperparameters)
        mlflow.log_param("model_type", config.model_type)
        mlflow.log_dict(config.data_config, "data_config.json")

        # 设置标签
        if config.tags:
            mlflow.set_tags(config.tags)

        print(f"Started experiment run: {run_id}")
        return run_id

    def log_metrics(self, metrics: Dict[str, float], step: Optional[int] = None):
        """记录指标"""
        for name, value in metrics.items():
            mlflow.log_metric(name, value, step=step)

    def log_model(self, model, model_name: str,
                  signature=None, input_example=None):
        """记录模型"""
        mlflow.pytorch.log_model(
            model,
            model_name,
            signature=signature,
            input_example=input_example
        )

    def log_artifact(self, local_path: str, artifact_path: str = None):
        """记录制品"""
        mlflow.log_artifact(local_path, artifact_path)

    def end_experiment(self, status: str = "FINISHED"):
        """结束实验"""
        if self.current_run:
            mlflow.end_run(status=status)
            self.current_run = None

    def get_best_run(self, experiment_name: str,
                     metric: str, mode: str = "max") -> Dict:
        """获取最佳运行"""
        experiment = mlflow.get_experiment_by_name(experiment_name)
        if not experiment:
            return None

        order = "DESC" if mode == "max" else "ASC"
        runs = mlflow.search_runs(
            experiment_ids=[experiment.experiment_id],
            order_by=[f"metrics.{metric} {order}"],
            max_results=1
        )

        if runs.empty:
            return None

        return runs.iloc[0].to_dict()

class TrainingPipeline:
    """训练流水线"""

    def __init__(self, tracker: ExperimentTracker,
                 feature_store: FeatureStoreService):
        self.tracker = tracker
        self.feature_store = feature_store

    def prepare_data(self, config: Dict) -> tuple:
        """准备训练数据"""
        # 从特征存储获取训练数据
        df = self.feature_store.get_training_data(
            entity=config["entity"],
            entity_ids=config["entity_ids"],
            feature_groups=config["feature_groups"],
            start_date=config["start_date"],
            end_date=config["end_date"]
        )

        # 分离特征和标签
        feature_columns = config["feature_columns"]
        label_column = config["label_column"]

        X = df[feature_columns].values
        y = df[label_column].values

        # 划分训练集和验证集
        from sklearn.model_selection import train_test_split
        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        return (X_train, y_train), (X_val, y_val)

    def train(self, config: ExperimentConfig,
              model_class, train_data: tuple,
              val_data: tuple) -> Any:
        """执行训练"""
        import torch
        import torch.nn as nn
        from torch.utils.data import DataLoader, TensorDataset

        # 开始实验追踪
        self.tracker.start_experiment(config)

        try:
            X_train, y_train = train_data
            X_val, y_val = val_data

            # 创建数据加载器
            train_dataset = TensorDataset(
                torch.FloatTensor(X_train),
                torch.FloatTensor(y_train)
            )
            val_dataset = TensorDataset(
                torch.FloatTensor(X_val),
                torch.FloatTensor(y_val)
            )

            train_loader = DataLoader(
                train_dataset,
                batch_size=config.hyperparameters.get("batch_size", 32),
                shuffle=True
            )
            val_loader = DataLoader(
                val_dataset,
                batch_size=config.hyperparameters.get("batch_size", 32)
            )

            # 初始化模型
            model = model_class(**config.hyperparameters.get("model_params", {}))
            optimizer = torch.optim.Adam(
                model.parameters(),
                lr=config.hyperparameters.get("learning_rate", 0.001)
            )
            criterion = nn.MSELoss()

            # 训练循环
            epochs = config.hyperparameters.get("epochs", 10)
            best_val_loss = float('inf')

            for epoch in range(epochs):
                # 训练阶段
                model.train()
                train_loss = 0.0
                for batch_X, batch_y in train_loader:
                    optimizer.zero_grad()
                    outputs = model(batch_X)
                    loss = criterion(outputs.squeeze(), batch_y)
                    loss.backward()
                    optimizer.step()
                    train_loss += loss.item()

                train_loss /= len(train_loader)

                # 验证阶段
                model.set_to_test_mode()  # model.eval() equivalent
                val_loss = 0.0
                with torch.no_grad():
                    for batch_X, batch_y in val_loader:
                        outputs = model(batch_X)
                        loss = criterion(outputs.squeeze(), batch_y)
                        val_loss += loss.item()

                val_loss /= len(val_loader)

                # 记录指标
                self.tracker.log_metrics({
                    "train_loss": train_loss,
                    "val_loss": val_loss
                }, step=epoch)

                # 保存最佳模型
                if val_loss < best_val_loss:
                    best_val_loss = val_loss
                    self.tracker.log_model(model, "best_model")

                print(f"Epoch {epoch+1}/{epochs} - "
                      f"Train Loss: {train_loss:.4f}, Val Loss: {val_loss:.4f}")

            self.tracker.end_experiment("FINISHED")
            return model

        except Exception as e:
            self.tracker.end_experiment("FAILED")
            raise e
```

### 分布式训练

```python
import torch
import torch.distributed as dist
import torch.nn as nn
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data.distributed import DistributedSampler
import os

class DistributedTrainer:
    """分布式训练器"""

    def __init__(self, model: nn.Module,
                 backend: str = "nccl"):
        self.backend = backend
        self.model = model
        self.world_size = int(os.environ.get("WORLD_SIZE", 1))
        self.rank = int(os.environ.get("RANK", 0))
        self.local_rank = int(os.environ.get("LOCAL_RANK", 0))

    def setup(self):
        """初始化分布式环境"""
        if self.world_size > 1:
            dist.init_process_group(
                backend=self.backend,
                init_method="env://",
                world_size=self.world_size,
                rank=self.rank
            )

            # 设置设备
            torch.cuda.set_device(self.local_rank)
            self.device = torch.device(f"cuda:{self.local_rank}")

            # 包装模型
            self.model = self.model.to(self.device)
            self.model = DDP(
                self.model,
                device_ids=[self.local_rank],
                output_device=self.local_rank
            )
        else:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            self.model = self.model.to(self.device)

    def cleanup(self):
        """清理分布式环境"""
        if self.world_size > 1:
            dist.destroy_process_group()

    def get_sampler(self, dataset):
        """获取分布式采样器"""
        if self.world_size > 1:
            return DistributedSampler(
                dataset,
                num_replicas=self.world_size,
                rank=self.rank
            )
        return None

    def is_main_process(self) -> bool:
        """是否为主进程"""
        return self.rank == 0

    def train_epoch(self, train_loader, optimizer, criterion):
        """训练一个 epoch"""
        self.model.train()
        total_loss = 0.0

        for batch_idx, (data, target) in enumerate(train_loader):
            data, target = data.to(self.device), target.to(self.device)

            optimizer.zero_grad()
            output = self.model(data)
            loss = criterion(output, target)
            loss.backward()
            optimizer.step()

            total_loss += loss.item()

        # 汇总所有进程的损失
        if self.world_size > 1:
            total_loss_tensor = torch.tensor(total_loss).to(self.device)
            dist.all_reduce(total_loss_tensor, op=dist.ReduceOp.SUM)
            total_loss = total_loss_tensor.item() / self.world_size

        return total_loss / len(train_loader)

    def save_checkpoint(self, path: str, epoch: int,
                       optimizer, loss: float):
        """保存检查点（仅主进程）"""
        if not self.is_main_process():
            return

        model_state = self.model.module.state_dict() if self.world_size > 1 \
                      else self.model.state_dict()

        torch.save({
            "epoch": epoch,
            "model_state_dict": model_state,
            "optimizer_state_dict": optimizer.state_dict(),
            "loss": loss
        }, path)

# Kubernetes 分布式训练 Job 配置
DISTRIBUTED_TRAINING_JOB = """
apiVersion: "kubeflow.org/v1"
kind: PyTorchJob
metadata:
  name: distributed-training-job
spec:
  pytorchReplicaSpecs:
    Master:
      replicas: 1
      restartPolicy: OnFailure
      template:
        spec:
          containers:
            - name: pytorch
              image: ml-training:latest
              resources:
                limits:
                  nvidia.com/gpu: 1
              env:
                - name: MASTER_PORT
                  value: "23456"
              command:
                - python
                - -m
                - torch.distributed.launch
                - --nproc_per_node=1
                - train.py
    Worker:
      replicas: 3
      restartPolicy: OnFailure
      template:
        spec:
          containers:
            - name: pytorch
              image: ml-training:latest
              resources:
                limits:
                  nvidia.com/gpu: 1
              command:
                - python
                - -m
                - torch.distributed.launch
                - --nproc_per_node=1
                - train.py
"""
```

### 超参数优化

```python
import optuna
from optuna.integration import PyTorchLightningPruningCallback
from typing import Dict, Any, Callable
import torch.nn as nn

class HyperparameterOptimizer:
    """超参数优化器"""

    def __init__(self, study_name: str,
                 storage: str = "sqlite:///optuna.db"):
        self.study_name = study_name
        self.storage = storage
        self.study = None

    def create_study(self, direction: str = "minimize",
                     pruner: optuna.pruners.BasePruner = None):
        """创建优化研究"""
        self.study = optuna.create_study(
            study_name=self.study_name,
            storage=self.storage,
            direction=direction,
            pruner=pruner or optuna.pruners.MedianPruner(),
            load_if_exists=True
        )
        return self.study

    def define_search_space(self, trial: optuna.Trial) -> Dict[str, Any]:
        """定义搜索空间"""
        return {
            # 学习率：对数均匀分布
            "learning_rate": trial.suggest_float(
                "learning_rate", 1e-5, 1e-2, log=True
            ),
            # 批量大小：类别选择
            "batch_size": trial.suggest_categorical(
                "batch_size", [16, 32, 64, 128]
            ),
            # 隐藏层大小
            "hidden_size": trial.suggest_int(
                "hidden_size", 64, 512, step=64
            ),
            # Dropout 率
            "dropout": trial.suggest_float(
                "dropout", 0.1, 0.5
            ),
            # 层数
            "num_layers": trial.suggest_int(
                "num_layers", 1, 4
            ),
            # 优化器类型
            "optimizer": trial.suggest_categorical(
                "optimizer", ["adam", "sgd", "adamw"]
            ),
            # 权重衰减
            "weight_decay": trial.suggest_float(
                "weight_decay", 1e-6, 1e-2, log=True
            )
        }

    def objective(self, trial: optuna.Trial,
                  model_class: type,
                  train_fn: Callable,
                  train_data: tuple,
                  val_data: tuple) -> float:
        """优化目标函数"""
        # 获取超参数
        params = self.define_search_space(trial)

        # 创建模型
        model = model_class(
            hidden_size=params["hidden_size"],
            num_layers=params["num_layers"],
            dropout=params["dropout"]
        )

        # 训练并获取验证损失
        val_loss = train_fn(
            model=model,
            train_data=train_data,
            val_data=val_data,
            params=params,
            trial=trial  # 用于早停
        )

        return val_loss

    def optimize(self, model_class: type,
                 train_fn: Callable,
                 train_data: tuple,
                 val_data: tuple,
                 n_trials: int = 100,
                 timeout: int = None) -> Dict[str, Any]:
        """执行优化"""
        if not self.study:
            self.create_study()

        self.study.optimize(
            lambda trial: self.objective(
                trial, model_class, train_fn, train_data, val_data
            ),
            n_trials=n_trials,
            timeout=timeout,
            show_progress_bar=True
        )

        return {
            "best_params": self.study.best_params,
            "best_value": self.study.best_value,
            "best_trial": self.study.best_trial.number
        }

    def get_optimization_history(self) -> Dict:
        """获取优化历史"""
        if not self.study:
            return {}

        return {
            "trials": [
                {
                    "number": t.number,
                    "value": t.value,
                    "params": t.params,
                    "state": str(t.state)
                }
                for t in self.study.trials
            ],
            "best_trial": self.study.best_trial.number,
            "best_value": self.study.best_value,
            "best_params": self.study.best_params
        }
```

## 推理平台设计

### 推理平台架构

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              推理平台架构                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                            ┌─────────────────┐                               │
│                            │   API Gateway   │                               │
│                            │  (流量入口)     │                               │
│                            └────────┬────────┘                               │
│                                     │                                        │
│               ┌─────────────────────┼─────────────────────┐                  │
│               │                     │                     │                  │
│               ▼                     ▼                     ▼                  │
│        ┌──────────┐          ┌──────────┐          ┌──────────┐             │
│        │  在线    │          │  近实时  │          │  批量    │             │
│        │  推理    │          │  推理    │          │  推理    │             │
│        │(<100ms)  │          │(<1s)     │          │(分钟级)  │             │
│        └────┬─────┘          └────┬─────┘          └────┬─────┘             │
│             │                     │                     │                    │
│             └─────────────────────┴─────────────────────┘                    │
│                                   │                                          │
│                                   ▼                                          │
│        ┌─────────────────────────────────────────────────────────┐          │
│        │                    模型服务层                            │          │
│        │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │          │
│        │  │ Model A │  │ Model B │  │ Model C │  │ Model D │    │          │
│        │  │ v1.0    │  │ v2.1    │  │ v1.3    │  │ v3.0    │    │          │
│        │  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │          │
│        └─────────────────────────────────────────────────────────┘          │
│                                   │                                          │
│                                   ▼                                          │
│        ┌─────────────────────────────────────────────────────────┐          │
│        │                  基础设施层                              │          │
│        │  ┌───────────┐  ┌───────────┐  ┌───────────────────┐   │          │
│        │  │ 模型注册  │  │ 特征服务  │  │ 监控 & 日志       │   │          │
│        │  │ 中心      │  │           │  │                   │   │          │
│        │  └───────────┘  └───────────┘  └───────────────────┘   │          │
│        └─────────────────────────────────────────────────────────┘          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 模型服务实现

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional
import torch
import numpy as np
from datetime import datetime
import asyncio
import aiohttp
from concurrent.futures import ThreadPoolExecutor

@dataclass
class ModelMetadata:
    """模型元数据"""
    name: str
    version: str
    framework: str  # pytorch, tensorflow, onnx, etc.
    input_schema: Dict[str, Any]
    output_schema: Dict[str, Any]
    created_at: datetime = field(default_factory=datetime.now)
    tags: Dict[str, str] = field(default_factory=dict)

@dataclass
class PredictionRequest:
    """预测请求"""
    model_name: str
    model_version: Optional[str] = None
    features: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class PredictionResponse:
    """预测响应"""
    predictions: Any
    model_name: str
    model_version: str
    latency_ms: float
    metadata: Dict[str, Any] = field(default_factory=dict)

class ModelServer(ABC):
    """模型服务抽象基类"""

    @abstractmethod
    def load(self, model_path: str, metadata: ModelMetadata):
        """加载模型"""
        pass

    @abstractmethod
    def predict(self, request: PredictionRequest) -> PredictionResponse:
        """同步预测"""
        pass

    @abstractmethod
    async def predict_async(self, request: PredictionRequest) -> PredictionResponse:
        """异步预测"""
        pass

class PyTorchModelServer(ModelServer):
    """PyTorch 模型服务"""

    def __init__(self):
        self.models: Dict[str, Dict[str, torch.nn.Module]] = {}
        self.metadata: Dict[str, ModelMetadata] = {}
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.executor = ThreadPoolExecutor(max_workers=4)

    def load(self, model_path: str, metadata: ModelMetadata):
        """加载 PyTorch 模型"""
        model = torch.jit.load(model_path, map_location=self.device)
        model.set_to_inference_mode()  # Set model to inference mode

        model_name = metadata.name
        model_version = metadata.version

        if model_name not in self.models:
            self.models[model_name] = {}

        self.models[model_name][model_version] = model
        self.metadata[f"{model_name}:{model_version}"] = metadata

        print(f"Loaded model: {model_name} v{model_version}")

    def _get_model(self, model_name: str,
                   model_version: Optional[str] = None) -> tuple:
        """获取模型"""
        if model_name not in self.models:
            raise ValueError(f"Model {model_name} not found")

        versions = self.models[model_name]

        if model_version:
            if model_version not in versions:
                raise ValueError(f"Version {model_version} not found for {model_name}")
            return versions[model_version], model_version
        else:
            # 返回最新版本
            latest_version = max(versions.keys())
            return versions[latest_version], latest_version

    def predict(self, request: PredictionRequest) -> PredictionResponse:
        """同步预测"""
        import time
        start_time = time.time()

        model, version = self._get_model(request.model_name, request.model_version)

        # 准备输入数据
        input_tensor = self._prepare_input(request.features)

        # 执行推理
        with torch.no_grad():
            output = model(input_tensor)

        # 处理输出
        predictions = self._process_output(output)

        latency_ms = (time.time() - start_time) * 1000

        return PredictionResponse(
            predictions=predictions,
            model_name=request.model_name,
            model_version=version,
            latency_ms=latency_ms
        )

    async def predict_async(self, request: PredictionRequest) -> PredictionResponse:
        """异步预测"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self.executor, self.predict, request)

    def _prepare_input(self, features: Dict[str, Any]) -> torch.Tensor:
        """准备输入张量"""
        if isinstance(features, dict):
            # 假设特征是扁平的数值列表
            values = list(features.values())
            return torch.FloatTensor([values]).to(self.device)
        elif isinstance(features, list):
            return torch.FloatTensor([features]).to(self.device)
        else:
            return torch.FloatTensor(features).to(self.device)

    def _process_output(self, output: torch.Tensor) -> Any:
        """处理输出"""
        return output.cpu().numpy().tolist()

class ModelServingAPI:
    """模型服务 API"""

    def __init__(self, model_server: ModelServer):
        self.model_server = model_server
        self.request_count = 0
        self.total_latency = 0.0

    async def predict(self, request: PredictionRequest) -> PredictionResponse:
        """处理预测请求"""
        response = await self.model_server.predict_async(request)

        # 更新统计
        self.request_count += 1
        self.total_latency += response.latency_ms

        return response

    async def batch_predict(self, requests: List[PredictionRequest]) -> List[PredictionResponse]:
        """批量预测"""
        tasks = [self.predict(req) for req in requests]
        return await asyncio.gather(*tasks)

    def get_stats(self) -> Dict[str, float]:
        """获取服务统计"""
        avg_latency = self.total_latency / self.request_count if self.request_count > 0 else 0
        return {
            "request_count": self.request_count,
            "avg_latency_ms": avg_latency,
            "total_latency_ms": self.total_latency
        }
```

### A/B 测试与流量控制

```python
import random
import hashlib
from dataclasses import dataclass
from typing import Dict, List, Optional
from datetime import datetime

@dataclass
class ABExperimentConfig:
    """A/B实验配置"""
    name: str
    variants: Dict[str, float]  # variant_name -> traffic_percentage
    start_time: datetime
    end_time: Optional[datetime] = None
    description: str = ""

class ABTestManager:
    """A/B 测试管理器"""

    def __init__(self):
        self.experiments: Dict[str, ABExperimentConfig] = {}
        self.assignment_cache: Dict[str, str] = {}  # user_id -> variant

    def create_experiment(self, config: ABExperimentConfig):
        """创建实验"""
        # 验证流量分配
        total_traffic = sum(config.variants.values())
        if abs(total_traffic - 1.0) > 0.001:
            raise ValueError(f"Traffic allocation must sum to 1.0, got {total_traffic}")

        self.experiments[config.name] = config
        print(f"Created experiment: {config.name}")

    def get_variant(self, experiment_name: str, user_id: str) -> str:
        """获取用户分配的变体"""
        if experiment_name not in self.experiments:
            raise ValueError(f"Experiment {experiment_name} not found")

        config = self.experiments[experiment_name]

        # 检查实验是否在有效期内
        now = datetime.now()
        if now < config.start_time:
            return "control"  # 实验未开始，返回控制组
        if config.end_time and now > config.end_time:
            return "control"  # 实验已结束，返回控制组

        # 检查缓存
        cache_key = f"{experiment_name}:{user_id}"
        if cache_key in self.assignment_cache:
            return self.assignment_cache[cache_key]

        # 使用一致性哈希分配变体
        variant = self._assign_variant(user_id, config.variants)
        self.assignment_cache[cache_key] = variant

        return variant

    def _assign_variant(self, user_id: str, variants: Dict[str, float]) -> str:
        """使用一致性哈希分配变体"""
        # 生成 0-1 之间的哈希值
        hash_value = int(hashlib.md5(user_id.encode()).hexdigest(), 16) % 10000 / 10000

        cumulative = 0.0
        for variant_name, percentage in variants.items():
            cumulative += percentage
            if hash_value < cumulative:
                return variant_name

        return list(variants.keys())[-1]

    def log_exposure(self, experiment_name: str, user_id: str, variant: str):
        """记录实验曝光"""
        # 实际实现中应写入日志系统
        print(f"Exposure: experiment={experiment_name}, user={user_id}, variant={variant}")

    def log_conversion(self, experiment_name: str, user_id: str,
                       metric_name: str, metric_value: float):
        """记录转化指标"""
        # 实际实现中应写入日志系统
        print(f"Conversion: experiment={experiment_name}, user={user_id}, "
              f"metric={metric_name}, value={metric_value}")

class TrafficRouter:
    """流量路由器"""

    def __init__(self, ab_test_manager: ABTestManager):
        self.ab_manager = ab_test_manager
        self.model_mappings: Dict[str, Dict[str, str]] = {}  # experiment -> variant -> model_version

    def register_model_mapping(self, experiment_name: str,
                               mappings: Dict[str, str]):
        """注册模型映射"""
        self.model_mappings[experiment_name] = mappings

    def route_request(self, experiment_name: str, user_id: str,
                     model_name: str) -> str:
        """路由请求到指定模型版本"""
        # 获取用户变体
        variant = self.ab_manager.get_variant(experiment_name, user_id)

        # 记录曝光
        self.ab_manager.log_exposure(experiment_name, user_id, variant)

        # 获取对应的模型版本
        mappings = self.model_mappings.get(experiment_name, {})
        model_version = mappings.get(variant, "default")

        return model_version

# 金丝雀发布
class CanaryDeployer:
    """金丝雀部署器"""

    def __init__(self):
        self.deployments: Dict[str, Dict] = {}

    def create_canary(self, model_name: str,
                      new_version: str,
                      canary_percentage: float = 0.05):
        """创建金丝雀部署"""
        self.deployments[model_name] = {
            "stable_version": self._get_stable_version(model_name),
            "canary_version": new_version,
            "canary_percentage": canary_percentage,
            "created_at": datetime.now(),
            "status": "active"
        }
        print(f"Created canary deployment for {model_name}: "
              f"{canary_percentage*100}% traffic to v{new_version}")

    def _get_stable_version(self, model_name: str) -> str:
        """获取当前稳定版本"""
        # 实际实现中从模型注册中心获取
        return "1.0"

    def route_to_version(self, model_name: str, user_id: str) -> str:
        """路由到对应版本"""
        deployment = self.deployments.get(model_name)

        if not deployment or deployment["status"] != "active":
            return self._get_stable_version(model_name)

        # 使用用户 ID 的哈希值决定路由
        hash_value = int(hashlib.md5(user_id.encode()).hexdigest(), 16) % 100

        if hash_value < deployment["canary_percentage"] * 100:
            return deployment["canary_version"]
        else:
            return deployment["stable_version"]

    def promote_canary(self, model_name: str):
        """推广金丝雀版本为稳定版本"""
        deployment = self.deployments.get(model_name)
        if deployment:
            deployment["status"] = "promoted"
            print(f"Promoted canary version {deployment['canary_version']} "
                  f"to stable for {model_name}")

    def rollback_canary(self, model_name: str):
        """回滚金丝雀部署"""
        deployment = self.deployments.get(model_name)
        if deployment:
            deployment["status"] = "rolled_back"
            print(f"Rolled back canary deployment for {model_name}")

    def update_canary_percentage(self, model_name: str, new_percentage: float):
        """更新金丝雀流量比例"""
        deployment = self.deployments.get(model_name)
        if deployment and deployment["status"] == "active":
            deployment["canary_percentage"] = new_percentage
            print(f"Updated canary percentage for {model_name} to {new_percentage*100}%")
```

## 模型注册中心

### 模型注册中心架构

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            模型注册中心架构                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         模型元数据存储                               │   │
│   │  ┌──────────────────────────────────────────────────────────────┐   │   │
│   │  │  Model: recommendation-v2                                     │   │   │
│   │  │  |-- Version: 2.0.1                                          │   │   │
│   │  │  |   |-- Metrics: {AUC: 0.85, Latency: 15ms}                │   │   │
│   │  │  |   |-- Artifacts: s3://models/rec/v2.0.1/model.pt         │   │   │
│   │  │  |   |-- Status: Production                                  │   │   │
│   │  │  |   +-- Created: 2024-01-15                                 │   │   │
│   │  │  +-- Version: 2.0.0                                          │   │   │
│   │  │      |-- Status: Archived                                    │   │   │
│   │  │      +-- ...                                                 │   │   │
│   │  └──────────────────────────────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         模型生命周期管理                             │   │
│   │                                                                      │   │
│   │   [注册] --> [验证] --> [Staging] --> [Production] --> [归档]       │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         API 接口                                     │   │
│   │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        │   │
│   │  │  注册模型 │  │  查询模型 │  │  下载模型 │  │  更新状态 │        │   │
│   │  └───────────┘  └───────────┘  └───────────┘  └───────────┘        │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 模型注册中心实现

```python
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from datetime import datetime
from enum import Enum
import json
import hashlib
import shutil
from pathlib import Path

class ModelStage(Enum):
    """模型阶段"""
    NONE = "None"
    STAGING = "Staging"
    PRODUCTION = "Production"
    ARCHIVED = "Archived"

@dataclass
class ModelVersion:
    """模型版本"""
    version: str
    artifact_path: str
    metrics: Dict[str, float]
    parameters: Dict[str, Any]
    stage: ModelStage
    description: str = ""
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    tags: Dict[str, str] = field(default_factory=dict)
    signature: Optional[Dict] = None  # 输入输出签名

    def to_dict(self) -> Dict:
        return {
            "version": self.version,
            "artifact_path": self.artifact_path,
            "metrics": self.metrics,
            "parameters": self.parameters,
            "stage": self.stage.value,
            "description": self.description,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "tags": self.tags,
            "signature": self.signature
        }

@dataclass
class RegisteredModel:
    """注册的模型"""
    name: str
    description: str = ""
    versions: Dict[str, ModelVersion] = field(default_factory=dict)
    tags: Dict[str, str] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

    def get_latest_version(self) -> Optional[ModelVersion]:
        """获取最新版本"""
        if not self.versions:
            return None
        latest = max(self.versions.keys())
        return self.versions[latest]

    def get_production_version(self) -> Optional[ModelVersion]:
        """获取生产版本"""
        for version in self.versions.values():
            if version.stage == ModelStage.PRODUCTION:
                return version
        return None

class ModelRegistry:
    """模型注册中心"""

    def __init__(self, storage_path: str = "./model_registry"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.models: Dict[str, RegisteredModel] = {}
        self._load_registry()

    def _load_registry(self):
        """加载注册表"""
        registry_file = self.storage_path / "registry.json"
        if registry_file.exists():
            with open(registry_file, "r") as f:
                data = json.load(f)
                # 反序列化模型数据
                for name, model_data in data.items():
                    versions = {}
                    for ver, ver_data in model_data.get("versions", {}).items():
                        ver_data["stage"] = ModelStage(ver_data["stage"])
                        ver_data["created_at"] = datetime.fromisoformat(ver_data["created_at"])
                        ver_data["updated_at"] = datetime.fromisoformat(ver_data["updated_at"])
                        versions[ver] = ModelVersion(**ver_data)

                    self.models[name] = RegisteredModel(
                        name=name,
                        description=model_data.get("description", ""),
                        versions=versions,
                        tags=model_data.get("tags", {}),
                        created_at=datetime.fromisoformat(model_data["created_at"]),
                        updated_at=datetime.fromisoformat(model_data["updated_at"])
                    )

    def _save_registry(self):
        """保存注册表"""
        registry_file = self.storage_path / "registry.json"
        data = {}
        for name, model in self.models.items():
            data[name] = {
                "description": model.description,
                "versions": {ver: v.to_dict() for ver, v in model.versions.items()},
                "tags": model.tags,
                "created_at": model.created_at.isoformat(),
                "updated_at": model.updated_at.isoformat()
            }

        with open(registry_file, "w") as f:
            json.dump(data, f, indent=2)

    def create_registered_model(self, name: str,
                                description: str = "",
                                tags: Dict[str, str] = None) -> RegisteredModel:
        """创建注册模型"""
        if name in self.models:
            raise ValueError(f"Model {name} already exists")

        model = RegisteredModel(
            name=name,
            description=description,
            tags=tags or {}
        )
        self.models[name] = model
        self._save_registry()

        print(f"Created registered model: {name}")
        return model

    def register_model_version(self,
                               model_name: str,
                               artifact_path: str,
                               metrics: Dict[str, float],
                               parameters: Dict[str, Any] = None,
                               description: str = "",
                               tags: Dict[str, str] = None,
                               signature: Dict = None) -> ModelVersion:
        """注册模型版本"""
        if model_name not in self.models:
            self.create_registered_model(model_name)

        model = self.models[model_name]

        # 生成版本号
        if model.versions:
            latest_version = max(model.versions.keys())
            parts = latest_version.split(".")
            new_version = f"{parts[0]}.{parts[1]}.{int(parts[2])+1}"
        else:
            new_version = "1.0.0"

        # 复制模型文件到注册中心存储
        model_storage = self.storage_path / model_name / new_version
        model_storage.mkdir(parents=True, exist_ok=True)

        if Path(artifact_path).is_file():
            dest_path = model_storage / Path(artifact_path).name
            shutil.copy2(artifact_path, dest_path)
        else:
            dest_path = model_storage / "model"
            shutil.copytree(artifact_path, dest_path)

        # 创建版本记录
        version = ModelVersion(
            version=new_version,
            artifact_path=str(dest_path),
            metrics=metrics,
            parameters=parameters or {},
            stage=ModelStage.NONE,
            description=description,
            tags=tags or {},
            signature=signature
        )

        model.versions[new_version] = version
        model.updated_at = datetime.now()
        self._save_registry()

        print(f"Registered model version: {model_name} v{new_version}")
        return version

    def transition_model_stage(self, model_name: str,
                               version: str,
                               stage: ModelStage,
                               archive_existing: bool = True):
        """转换模型阶段"""
        if model_name not in self.models:
            raise ValueError(f"Model {model_name} not found")

        model = self.models[model_name]

        if version not in model.versions:
            raise ValueError(f"Version {version} not found for {model_name}")

        # 如果转换到 Production，归档现有 Production 版本
        if stage == ModelStage.PRODUCTION and archive_existing:
            for ver in model.versions.values():
                if ver.stage == ModelStage.PRODUCTION:
                    ver.stage = ModelStage.ARCHIVED
                    ver.updated_at = datetime.now()

        model.versions[version].stage = stage
        model.versions[version].updated_at = datetime.now()
        model.updated_at = datetime.now()
        self._save_registry()

        print(f"Transitioned {model_name} v{version} to {stage.value}")

    def get_model(self, model_name: str) -> Optional[RegisteredModel]:
        """获取模型"""
        return self.models.get(model_name)

    def get_model_version(self, model_name: str,
                          version: str) -> Optional[ModelVersion]:
        """获取模型版本"""
        model = self.get_model(model_name)
        if model:
            return model.versions.get(version)
        return None

    def get_latest_version(self, model_name: str,
                           stage: ModelStage = None) -> Optional[ModelVersion]:
        """获取最新版本"""
        model = self.get_model(model_name)
        if not model:
            return None

        if stage:
            versions = [v for v in model.versions.values() if v.stage == stage]
            if not versions:
                return None
            return max(versions, key=lambda v: v.version)

        return model.get_latest_version()

    def list_models(self) -> List[Dict]:
        """列出所有模型"""
        return [
            {
                "name": model.name,
                "description": model.description,
                "version_count": len(model.versions),
                "latest_version": model.get_latest_version().version if model.versions else None,
                "production_version": model.get_production_version().version
                                      if model.get_production_version() else None,
                "tags": model.tags
            }
            for model in self.models.values()
        ]

    def search_models(self, query: str = None,
                      tags: Dict[str, str] = None) -> List[RegisteredModel]:
        """搜索模型"""
        results = list(self.models.values())

        if query:
            query = query.lower()
            results = [m for m in results
                      if query in m.name.lower() or query in m.description.lower()]

        if tags:
            for key, value in tags.items():
                results = [m for m in results
                          if m.tags.get(key) == value]

        return results

    def delete_model_version(self, model_name: str, version: str):
        """删除模型版本"""
        if model_name not in self.models:
            raise ValueError(f"Model {model_name} not found")

        model = self.models[model_name]

        if version not in model.versions:
            raise ValueError(f"Version {version} not found")

        # 不允许删除 Production 版本
        if model.versions[version].stage == ModelStage.PRODUCTION:
            raise ValueError("Cannot delete Production version")

        # 删除文件
        artifact_path = Path(model.versions[version].artifact_path)
        if artifact_path.exists():
            if artifact_path.is_file():
                artifact_path.unlink()
            else:
                shutil.rmtree(artifact_path)

        del model.versions[version]
        self._save_registry()

        print(f"Deleted {model_name} v{version}")
```

## 监控告警系统

### ML 系统监控架构

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            ML 监控告警架构                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                           ┌─────────────────┐                                │
│                           │   告警管理      │                                │
│                           │  (Alert Rules)  │                                │
│                           └────────┬────────┘                                │
│                                    │                                         │
│                                    ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         监控仪表盘                                   │   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │   │
│   │  │ 系统指标 │  │ 模型指标 │  │ 数据指标 │  │ 业务指标 │            │   │
│   │  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         指标收集层                                   │   │
│   │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        │   │
│   │  │Prometheus │  │ StatsD    │  │ 日志系统  │  │ APM       │        │   │
│   │  └───────────┘  └───────────┘  └───────────┘  └───────────┘        │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│        ┌───────────────────────────┼───────────────────────────┐            │
│        │                           │                           │            │
│        ▼                           ▼                           ▼            │
│  ┌──────────────┐          ┌──────────────┐          ┌──────────────┐      │
│  │   训练平台   │          │   推理平台   │          │   特征平台   │      │
│  └──────────────┘          └──────────────┘          └──────────────┘      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 监控指标体系

```python
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from enum import Enum
import numpy as np
from prometheus_client import Counter, Histogram, Gauge, CollectorRegistry

class MetricType(Enum):
    """指标类型"""
    SYSTEM = "system"      # 系统指标
    MODEL = "model"        # 模型指标
    DATA = "data"          # 数据指标
    BUSINESS = "business"  # 业务指标

@dataclass
class MetricDefinition:
    """指标定义"""
    name: str
    type: MetricType
    description: str
    unit: str
    threshold_warning: Optional[float] = None
    threshold_critical: Optional[float] = None
    comparison: str = "gt"  # gt, lt, eq

class MLMetricsCollector:
    """ML 指标收集器"""

    def __init__(self, registry: CollectorRegistry = None):
        self.registry = registry or CollectorRegistry()
        self._setup_metrics()

    def _setup_metrics(self):
        """设置指标"""
        # 系统指标
        self.request_count = Counter(
            "ml_request_total",
            "Total number of ML requests",
            ["model_name", "model_version", "status"],
            registry=self.registry
        )

        self.request_latency = Histogram(
            "ml_request_latency_seconds",
            "Request latency in seconds",
            ["model_name", "model_version"],
            buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0],
            registry=self.registry
        )

        self.model_load_time = Histogram(
            "ml_model_load_seconds",
            "Model loading time in seconds",
            ["model_name", "model_version"],
            registry=self.registry
        )

        # 模型指标
        self.prediction_value = Histogram(
            "ml_prediction_value",
            "Distribution of prediction values",
            ["model_name", "model_version"],
            buckets=[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
            registry=self.registry
        )

        self.feature_value = Histogram(
            "ml_feature_value",
            "Distribution of feature values",
            ["feature_name"],
            buckets=[-3, -2, -1, -0.5, 0, 0.5, 1, 2, 3],
            registry=self.registry
        )

        # 数据质量指标
        self.feature_null_ratio = Gauge(
            "ml_feature_null_ratio",
            "Null value ratio for features",
            ["feature_name"],
            registry=self.registry
        )

        self.data_drift_score = Gauge(
            "ml_data_drift_score",
            "Data drift score",
            ["feature_name"],
            registry=self.registry
        )

        # 业务指标
        self.conversion_rate = Gauge(
            "ml_conversion_rate",
            "Model-driven conversion rate",
            ["model_name", "experiment"],
            registry=self.registry
        )

    def record_request(self, model_name: str, model_version: str,
                       latency: float, status: str = "success"):
        """记录请求指标"""
        self.request_count.labels(
            model_name=model_name,
            model_version=model_version,
            status=status
        ).inc()

        self.request_latency.labels(
            model_name=model_name,
            model_version=model_version
        ).observe(latency)

    def record_prediction(self, model_name: str, model_version: str,
                          prediction: float):
        """记录预测值"""
        self.prediction_value.labels(
            model_name=model_name,
            model_version=model_version
        ).observe(prediction)

    def record_feature(self, feature_name: str, value: float):
        """记录特征值"""
        self.feature_value.labels(feature_name=feature_name).observe(value)

    def update_data_quality(self, feature_name: str,
                            null_ratio: float, drift_score: float):
        """更新数据质量指标"""
        self.feature_null_ratio.labels(feature_name=feature_name).set(null_ratio)
        self.data_drift_score.labels(feature_name=feature_name).set(drift_score)

class ModelPerformanceMonitor:
    """模型性能监控器"""

    def __init__(self, window_size: int = 1000):
        self.window_size = window_size
        self.predictions: Dict[str, List[float]] = {}
        self.actuals: Dict[str, List[float]] = {}
        self.timestamps: Dict[str, List[datetime]] = {}

    def record_prediction(self, model_name: str,
                          prediction: float, actual: float = None):
        """记录预测和实际值"""
        if model_name not in self.predictions:
            self.predictions[model_name] = []
            self.actuals[model_name] = []
            self.timestamps[model_name] = []

        self.predictions[model_name].append(prediction)
        if actual is not None:
            self.actuals[model_name].append(actual)
        self.timestamps[model_name].append(datetime.now())

        # 保持窗口大小
        if len(self.predictions[model_name]) > self.window_size:
            self.predictions[model_name] = self.predictions[model_name][-self.window_size:]
            self.actuals[model_name] = self.actuals[model_name][-self.window_size:]
            self.timestamps[model_name] = self.timestamps[model_name][-self.window_size:]

    def get_performance_metrics(self, model_name: str) -> Dict[str, float]:
        """获取性能指标"""
        if model_name not in self.predictions:
            return {}

        predictions = np.array(self.predictions[model_name])

        metrics = {
            "prediction_mean": float(np.mean(predictions)),
            "prediction_std": float(np.std(predictions)),
            "prediction_min": float(np.min(predictions)),
            "prediction_max": float(np.max(predictions)),
            "sample_count": len(predictions)
        }

        # 如果有实际值，计算准确性指标
        actuals = self.actuals.get(model_name, [])
        if len(actuals) == len(predictions) and len(actuals) > 0:
            actuals = np.array(actuals)

            # 回归指标
            metrics["mae"] = float(np.mean(np.abs(predictions - actuals)))
            metrics["mse"] = float(np.mean((predictions - actuals) ** 2))
            metrics["rmse"] = float(np.sqrt(metrics["mse"]))

            # 分类指标（如果是二分类）
            if set(actuals) == {0, 1} or set(actuals) == {0.0, 1.0}:
                pred_binary = (predictions >= 0.5).astype(int)
                metrics["accuracy"] = float(np.mean(pred_binary == actuals))

        return metrics

    def detect_drift(self, model_name: str,
                    baseline_predictions: List[float],
                    threshold: float = 0.05) -> Dict[str, Any]:
        """检测预测分布漂移"""
        from scipy import stats

        if model_name not in self.predictions:
            return {"drift_detected": False, "message": "No data"}

        current = np.array(self.predictions[model_name])
        baseline = np.array(baseline_predictions)

        # KS 检验
        statistic, p_value = stats.ks_2samp(baseline, current)

        drift_detected = p_value < threshold

        return {
            "drift_detected": drift_detected,
            "ks_statistic": float(statistic),
            "p_value": float(p_value),
            "threshold": threshold,
            "message": "Drift detected!" if drift_detected else "No significant drift"
        }

class AlertManager:
    """告警管理器"""

    def __init__(self):
        self.rules: List[Dict] = []
        self.alerts: List[Dict] = []

    def add_rule(self, name: str, condition: str,
                 threshold: float, severity: str,
                 notification_channels: List[str]):
        """添加告警规则"""
        self.rules.append({
            "name": name,
            "condition": condition,
            "threshold": threshold,
            "severity": severity,
            "notification_channels": notification_channels,
            "enabled": True
        })

    def check_metric(self, metric_name: str, value: float) -> List[Dict]:
        """检查指标是否触发告警"""
        triggered_alerts = []

        for rule in self.rules:
            if not rule["enabled"]:
                continue

            if metric_name not in rule["condition"]:
                continue

            # 简单的阈值检查
            if self._check_condition(value, rule["condition"], rule["threshold"]):
                alert = {
                    "rule_name": rule["name"],
                    "metric_name": metric_name,
                    "value": value,
                    "threshold": rule["threshold"],
                    "severity": rule["severity"],
                    "timestamp": datetime.now().isoformat(),
                    "notification_channels": rule["notification_channels"]
                }
                triggered_alerts.append(alert)
                self.alerts.append(alert)

        return triggered_alerts

    def _check_condition(self, value: float, condition: str,
                           threshold: float) -> bool:
        """检查条件"""
        if ">" in condition:
            return value > threshold
        elif "<" in condition:
            return value < threshold
        elif "=" in condition:
            return abs(value - threshold) < 0.001
        return False

    def get_active_alerts(self, since: datetime = None) -> List[Dict]:
        """获取活跃告警"""
        if since is None:
            since = datetime.now() - timedelta(hours=24)

        return [
            alert for alert in self.alerts
            if datetime.fromisoformat(alert["timestamp"]) > since
        ]

# Prometheus 告警规则示例
PROMETHEUS_ALERT_RULES = """
groups:
  - name: ml_alerts
    rules:
      # 高延迟告警
      - alert: HighModelLatency
        expr: histogram_quantile(0.99, rate(ml_request_latency_seconds_bucket[5m])) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High model latency detected"
          description: "P99 latency is {{ $value }}s for model {{ $labels.model_name }}"

      # 高错误率告警
      - alert: HighErrorRate
        expr: |
          sum(rate(ml_request_total{status="error"}[5m])) by (model_name)
          /
          sum(rate(ml_request_total[5m])) by (model_name) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate for model {{ $labels.model_name }}"
          description: "Error rate is {{ $value | humanizePercentage }}"

      # 数据漂移告警
      - alert: DataDriftDetected
        expr: ml_data_drift_score > 0.1
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Data drift detected"
          description: "Feature {{ $labels.feature_name }} drift score: {{ $value }}"

      # 特征缺失告警
      - alert: HighFeatureNullRatio
        expr: ml_feature_null_ratio > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High null ratio for feature {{ $labels.feature_name }}"
          description: "Null ratio is {{ $value | humanizePercentage }}"
"""
```

## 大厂 ML 平台案例分析

### 典型 ML 平台对比

| 平台 | 公司 | 特点 | 开源情况 |
|------|------|------|----------|
| **Michelangelo** | Uber | 端到端平台，强调特征管理 | 部分开源（Feast） |
| **FBLearner Flow** | Meta | 大规模分布式训练，AutoML | 未开源 |
| **TFX** | Google | 基于 TensorFlow 的端到端平台 | 完全开源 |
| **SageMaker** | AWS | 云原生，一站式服务 | 商业产品 |
| **MLflow** | Databricks | 实验追踪、模型管理 | 完全开源 |
| **Kubeflow** | Google | Kubernetes 原生 ML 平台 | 完全开源 |

### Uber Michelangelo 架构分析

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        Michelangelo 架构                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         用户界面层                                   │   │
│   │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        │   │
│   │  │ Web UI    │  │ Python SDK│  │ REST API  │  │ CLI       │        │   │
│   │  └───────────┘  └───────────┘  └───────────┘  └───────────┘        │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                     │                                        │
│                                     ▼                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         工作流管理                                   │   │
│   │  ┌────────────────────────────────────────────────────────────┐     │   │
│   │  │  DAG Scheduler (基于 Apache Airflow)                       │     │   │
│   │  └────────────────────────────────────────────────────────────┘     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                     │                                        │
│         ┌───────────────────────────┼───────────────────────────┐           │
│         │                           │                           │           │
│         ▼                           ▼                           ▼           │
│  ┌──────────────┐           ┌──────────────┐           ┌──────────────┐    │
│  │   特征存储   │           │   训练服务   │           │   预测服务   │    │
│  │   (Palette)  │           │  (Horovod)   │           │  (Peloton)   │    │
│  │              │           │              │           │              │    │
│  │  - 离线特征  │           │  - 分布式训练│           │  - 在线推理  │    │
│  │  - 在线特征  │           │  - 超参优化  │           │  - 批量推理  │    │
│  │  - 特征转换  │           │  - 实验管理  │           │  - A/B 测试  │    │
│  └──────────────┘           └──────────────┘           └──────────────┘    │
│         │                           │                           │           │
│         └───────────────────────────┴───────────────────────────┘           │
│                                     │                                        │
│                                     ▼                                        │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         数据存储层                                   │   │
│   │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        │   │
│   │  │ HDFS      │  │ Cassandra │  │ Redis     │  │ MySQL     │        │   │
│   │  │ (离线)    │  │ (在线)    │  │ (缓存)    │  │ (元数据)  │        │   │
│   │  └───────────┘  └───────────┘  └───────────┘  └───────────┘        │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Michelangelo 关键设计原则：**

1. **统一特征管理**：Palette 特征存储确保训练和推理使用相同的特征定义
2. **端到端追踪**：从数据到模型的完整血缘追踪
3. **自动化部署**：一键式模型部署到生产环境
4. **多框架支持**：支持 XGBoost、TensorFlow、PyTorch 等

### Google TFX 架构分析

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           TFX Pipeline 架构                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                         TFX 组件流水线                                │  │
│   │                                                                       │  │
│   │   ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐              │  │
│   │   │Example │───▶│Statist-│───▶│ Schema │───▶│Example │              │  │
│   │   │  Gen   │    │icsGen │    │  Gen   │    │Validator│              │  │
│   │   └────────┘    └────────┘    └────────┘    └────────┘              │  │
│   │                                                  │                    │  │
│   │                                                  ▼                    │  │
│   │   ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐              │  │
│   │   │Pusher  │◀───│Model   │◀───│Assessor│◀───│Transform│◀──────────  │  │
│   │   │        │    │Validator│   │        │    │        │              │  │
│   │   └────────┘    └────────┘    └────────┘    └────────┘              │  │
│   │       │                            ▲             │                    │  │
│   │       │              ┌─────────────┘             │                    │  │
│   │       │              │                           │                    │  │
│   │       ▼         ┌────────┐                       ▼                    │  │
│   │   ┌────────┐    │ Tuner  │                  ┌────────┐              │  │
│   │   │Serving │    │(可选)  │                  │Trainer │              │  │
│   │   └────────┘    └────────┘                  └────────┘              │  │
│   │                                                                       │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                         元数据存储 (ML Metadata)                      │  │
│   │  - Artifact 追踪                                                      │  │
│   │  - 执行记录                                                           │  │
│   │  - 血缘追踪                                                           │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**TFX 核心组件说明：**

| 组件 | 功能 | 输出 |
|------|------|------|
| ExampleGen | 数据摄入 | TFRecord |
| StatisticsGen | 数据统计 | 统计信息 |
| SchemaGen | Schema 生成 | Schema 定义 |
| ExampleValidator | 数据验证 | 异常报告 |
| Transform | 特征工程 | 转换后的数据 |
| Trainer | 模型训练 | SavedModel |
| Tuner | 超参优化 | 最佳超参数 |
| Assessor | 模型质量检查 | 检查结果 |
| ModelValidator | 基础设施验证 | 验证结果 |
| Pusher | 模型部署 | 部署的模型 |

### 开源 ML 平台选型建议

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          ML 平台选型决策树                                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  需要端到端平台？                                                           │
│      │                                                                     │
│      |-- 是 --> 使用 Kubernetes？                                          │
│      │              │                                                      │
│      │              |-- 是 --> Kubeflow                                    │
│      │              │                                                      │
│      │              +-- 否 --> 使用 TensorFlow？                           │
│      │                             │                                       │
│      │                             |-- 是 --> TFX                          │
│      │                             │                                       │
│      │                             +-- 否 --> MLflow + 自定义组件          │
│      │                                                                     │
│      +-- 否 --> 需要什么功能？                                             │
│                    │                                                       │
│                    |-- 实验追踪 --> MLflow / Weights & Biases             │
│                    │                                                       │
│                    |-- 特征存储 --> Feast / Tecton                         │
│                    │                                                       │
│                    |-- 模型服务 --> Seldon / KServe                        │
│                    │                                                       │
│                    +-- 数据验证 --> Great Expectations / TFX Data Val     │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

## 最佳实践总结

### ML 系统设计原则

1. **可复现性（Reproducibility）**
   - 代码版本控制
   - 数据版本控制
   - 环境版本控制
   - 实验参数记录

2. **可扩展性（Scalability）**
   - 分布式训练支持
   - 弹性推理服务
   - 特征计算可扩展

3. **可观测性（Observability）**
   - 完善的监控指标
   - 日志追踪
   - 告警机制

4. **自动化（Automation）**
   - CI/CD 流水线
   - 自动化测试
   - 自动重训练

### 常见问题与解决方案

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 训练-服务偏差 | 特征计算不一致 | 使用特征存储统一管理 |
| 模型性能下降 | 数据漂移 | 持续监控，自动重训练 |
| 推理延迟高 | 模型过大/特征获取慢 | 模型压缩/特征缓存 |
| 实验难以复现 | 环境/参数记录不完整 | 使用实验追踪工具 |
| 部署风险大 | 缺乏灰度发布机制 | 金丝雀部署/A/B 测试 |

### 面试要点

**Q1: 如何设计一个特征平台？**

核心要点：
- 离线特征存储（数据湖）与在线特征存储（Redis/Cassandra）分离
- 特征注册中心管理特征元数据
- 支持批处理和流处理的特征计算
- 特征版本控制和血缘追踪

**Q2: 如何保证训练-推理一致性？**

解决方案：
- 使用特征存储统一特征定义
- 在线推理时直接从特征存储获取特征
- 特征转换逻辑编译为可重用的模块
- 完善的测试验证机制

**Q3: 如何监控模型在线性能？**

监控维度：
- 系统指标：延迟、吞吐量、错误率
- 模型指标：预测分布、准确率（需要标签）
- 数据指标：特征分布、数据质量
- 业务指标：转化率、CTR 等

**Q4: 如何实现模型的安全部署？**

策略：
- 金丝雀发布：小流量验证
- A/B 测试：对比实验
- 影子模式：并行测试不影响生产
- 回滚机制：快速回退到稳定版本

## 延伸阅读

### 推荐书籍

- **《Designing Machine Learning Systems》** - Chip Huyen
- **《Machine Learning Engineering》** - Andriy Burkov
- **《Building Machine Learning Pipelines》** - Hannes Hapke

### 在线资源

- [Google ML Best Practices](https://developers.google.com/machine-learning/guides/rules-of-ml)
- [MLOps Community](https://mlops.community/)
- [Feast Feature Store Docs](https://docs.feast.dev/)
- [Kubeflow Docs](https://www.kubeflow.org/docs/)

### 开源项目

- **Feast**：特征存储
- **MLflow**：实验追踪和模型管理
- **Kubeflow**：Kubernetes 原生 ML 平台
- **Seldon Core**：模型服务
- **Great Expectations**：数据质量验证

## 总结

构建企业级 ML 系统是一项复杂的系统工程，需要综合考虑数据管理、特征工程、模型训练、模型服务、监控告警等多个环节。本文从架构设计的角度，详细介绍了各个组件的设计原则和实现方案。

核心要点：

1. **特征平台是基础**：统一的特征管理是解决训练-服务偏差的关键
2. **自动化是方向**：从手动到自动化 MLOps 是平台成熟度的体现
3. **可观测性是保障**：完善的监控告警确保系统稳定运行
4. **迭代优化是常态**：ML 系统需要持续优化和演进

希望本文能够帮助读者建立对 ML 系统架构的整体认识，在实际工作中设计和构建高效、可靠的机器学习平台。
