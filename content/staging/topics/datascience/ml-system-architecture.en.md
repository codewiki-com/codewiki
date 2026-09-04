---
title: "Machine Learning System Design: Overall Architecture"
description: "Design end-to-end ML systems: feature platforms, training platforms, and inference platforms"
track: datascience
section: deployment
difficulty: advanced
tags:
  - ML Systems
  - Architecture
  - Platform
  - Engineering
status: imported
origin: old/src/content/docs/datascience/ml-system-architecture.en.md
divergence: 0.224
issues: []
legacy:
  category: DataScience
  subcategory: MLSystems
  order: 40
  lastUpdated: 2026-01-07
---

Machine learning system design goes far beyond model training and tuning. In production environments, a complete ML system needs to cover data management, feature engineering, model training, model serving, monitoring and alerting, and many other aspects. We'll explore how to design and build enterprise-grade machine learning platforms from a system architecture perspective.

## ML System Overview

### End-to-End ML System Architecture

A complete machine learning system typically includes the following core components:

```
+--------------------------------------------------------------------------------+
|                              ML System Architecture Overview                    |
+--------------------------------------------------------------------------------+
|                                                                                |
|  +-------------+    +-------------+    +-------------+    +-------------+     |
|  |   Data      |--->|   Data      |--->|   Feature   |--->|   Training  |     |
|  |   Source    |    |   Pipeline  |    |   Store     |    |   Platform  |     |
|  | (Data Lake) |    |             |    |             |    |             |     |
|  +-------------+    +-------------+    +-------------+    +------+------+     |
|                                                                   |            |
|                                              +--------------------+            |
|                                              v                                 |
|  +-------------+    +-------------+    +-------------+    +-------------+     |
|  |  Monitoring |<---|  Inference  |<---|   Model     |<---|    Model    |     |
|  |   & Alerts  |    |  Platform   |    |  Registry   |    |  Validation |     |
|  +-------------+    +-------------+    +-------------+    +-------------+     |
|                                                                                |
+--------------------------------------------------------------------------------+
```

### Three Pillars of ML Systems

| Pillar | Core Responsibilities | Key Technologies |
|--------|----------------------|------------------|
| **Feature Platform** | Feature storage, computation, serving | Feature Store, real-time computation, batch processing |
| **Training Platform** | Model training, experiment management, hyperparameter optimization | Distributed training, AutoML, experiment tracking |
| **Inference Platform** | Model deployment, online prediction, batch inference | Model serving, A/B testing, traffic control |

### MLOps Maturity Model

```
Level 0: Manual Processes
+-- Data scientists manually train models
+-- Manual model deployment to production
+-- No automation

Level 1: ML Pipeline Automation
+-- Automated data processing and feature engineering
+-- Continuous Training (CT)
+-- Automated model deployment

Level 2: CI/CD Pipeline Automation
+-- Code version control
+-- Model version control
+-- Automated testing and validation
+-- Continuous Integration/Continuous Deployment

Level 3: Fully Automated MLOps
+-- Automated feature engineering
+-- Automated model selection and hyperparameter optimization
+-- Automated monitoring and retraining
+-- End-to-end observability
```

## Data Pipeline Design

### Data Pipeline Architecture

The data pipeline is the foundation of ML systems, responsible for transforming raw data into features usable for training and inference.

```
+------------------------------------------------------------------------------+
|                              Data Pipeline Architecture                       |
+------------------------------------------------------------------------------+
|                                                                              |
|   Data Source Layer            Processing Layer              Storage Layer   |
|  +-----------+              +---------------+            +---------------+   |
|  |   Logs    |-----+        |               |            |   Data Lake   |   |
|  +-----------+     |        |    Batch      |----------->|   (Parquet)   |   |
|  +-----------+     |   +--->|  Processing   |            +---------------+   |
|  | Database  |-----+---|    |    (Spark)    |                                |
|  +-----------+     |   |    |               |            +---------------+   |
|  +-----------+     |   |    +---------------+            |  Feature      |   |
|  |   API     |-----+   +---->+---------------+---------->|   Store       |   |
|  +-----------+              |    Stream     |            |               |   |
|  +-----------+              |  Processing   |            +---------------+   |
|  |  Event    |------------->|(Flink/Kafka)  |                                |
|  |  Stream   |              |               |                                |
|  +-----------+              +---------------+                                |
|                                                                              |
+------------------------------------------------------------------------------+
```

### Batch and Stream Processing

**Batch Processing Pipeline (Offline):**

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, when, avg, count
from datetime import datetime, timedelta

class BatchFeaturePipeline:
    """Batch feature processing pipeline"""

    def __init__(self, spark: SparkSession):
        self.spark = spark

    def extract_user_features(self, date: str) -> "DataFrame":
        """Extract user behavior features"""
        # Read user behavior logs
        user_logs = self.spark.read.parquet(
            f"s3://data-lake/user_logs/dt={date}"
        )

        # Calculate user statistical features
        user_features = user_logs.groupBy("user_id").agg(
            count("*").alias("total_actions"),
            count(when(col("action") == "click", 1)).alias("click_count"),
            count(when(col("action") == "purchase", 1)).alias("purchase_count"),
            avg("session_duration").alias("avg_session_duration"),
            avg("page_views").alias("avg_page_views")
        )

        # Calculate conversion rate features
        user_features = user_features.withColumn(
            "click_to_purchase_rate",
            col("purchase_count") / col("click_count")
        ).fillna(0)

        return user_features

    def extract_item_features(self, date: str) -> "DataFrame":
        """Extract item features"""
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
        """Execute complete feature pipeline"""
        # Extract features
        user_features = self.extract_user_features(date)
        item_features = self.extract_item_features(date)

        # Write to feature store
        user_features.write.mode("overwrite").parquet(
            f"s3://feature-store/user_features/dt={date}"
        )
        item_features.write.mode("overwrite").parquet(
            f"s3://feature-store/item_features/dt={date}"
        )

        print(f"Pipeline completed for date: {date}")
```

**Stream Processing Pipeline (Real-time):**

```python
from pyflink.datastream import StreamExecutionEnvironment
from pyflink.table import StreamTableEnvironment, EnvironmentSettings
from pyflink.table.window import Tumble
from pyflink.table.expressions import col, lit

class StreamFeaturePipeline:
    """Real-time feature processing pipeline"""

    def __init__(self):
        env = StreamExecutionEnvironment.get_execution_environment()
        settings = EnvironmentSettings.new_instance() \
            .in_streaming_mode() \
            .build()
        self.t_env = StreamTableEnvironment.create(env, settings)

    def setup_source(self):
        """Configure Kafka data source"""
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
        """Configure feature store sink"""
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
        """Compute real-time features"""
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

### Data Quality Monitoring

```python
from dataclasses import dataclass
from typing import Dict, List, Optional
import pandas as pd
import numpy as np
from scipy import stats

@dataclass
class DataQualityCheck:
    """Data quality check result"""
    check_name: str
    passed: bool
    message: str
    details: Optional[Dict] = None

class DataQualityMonitor:
    """Data quality monitor"""

    def __init__(self, baseline_stats: Dict):
        self.baseline_stats = baseline_stats
        self.checks: List[DataQualityCheck] = []

    def check_null_ratio(self, df: pd.DataFrame,
                         column: str,
                         threshold: float = 0.1) -> DataQualityCheck:
        """Check null value ratio"""
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
        """Check value range"""
        out_of_range = ((df[column] < min_val) | (df[column] > max_val)).mean()
        passed = out_of_range <= 0.01  # Allow 1% outliers

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
        """Check distribution drift (using KS test)"""
        baseline_values = self.baseline_stats.get(f"{column}_values", [])
        current_values = df[column].dropna().values

        if len(baseline_values) == 0 or len(current_values) == 0:
            return DataQualityCheck(
                check_name=f"distribution_drift_{column}",
                passed=True,
                message="Insufficient data for drift check"
            )

        # KS test
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
        """Check data schema"""
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
        """Run all quality checks"""
        checks = []

        # Schema check
        checks.append(self.check_schema(df, config.get("expected_columns", [])))

        # Null checks
        for column, threshold in config.get("null_checks", {}).items():
            checks.append(self.check_null_ratio(df, column, threshold))

        # Range checks
        for column, (min_val, max_val) in config.get("range_checks", {}).items():
            checks.append(self.check_value_range(df, column, min_val, max_val))

        # Distribution drift checks
        for column in config.get("drift_check_columns", []):
            checks.append(self.check_distribution_drift(df, column))

        self.checks = checks
        return checks

    def generate_report(self) -> Dict:
        """Generate quality report"""
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

## Feature Platform Design

### Feature Platform Architecture

The Feature Store is a core component of modern ML systems, solving key problems like feature reuse, consistency, and version management.

```
+------------------------------------------------------------------------------+
|                              Feature Platform Architecture                    |
+------------------------------------------------------------------------------+
|                                                                              |
|                            +-----------------+                               |
|                            |  Feature        |                               |
|                            |  Registry       |                               |
|                            +---------+-------+                               |
|                                     |                                        |
|    +--------------------------------+--------------------------------+       |
|    |                                |                                |       |
|    v                                v                                v       |
|  +--------------+           +--------------+            +--------------+    |
|  | Offline      |           | Online       |            | Feature      |    |
|  | Storage      |<--------->| Storage      |<---------->| Service      |    |
|  | (Hive/S3)    |   Sync    | (Redis)      |   Read     |              |    |
|  +--------------+           +--------------+            +--------------+    |
|         |                          |                           |            |
|         |                          |                           |            |
|         v                          v                           v            |
|  +--------------+           +--------------+            +--------------+    |
|  | Model        |           | Real-time    |            | Batch        |    |
|  | Training     |           | Inference    |            | Inference    |    |
|  +--------------+           +--------------+            +--------------+    |
|                                                                              |
+------------------------------------------------------------------------------+
```

### Feature Store Implementation

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
    """Feature definition"""
    name: str
    dtype: str
    description: str
    entity: str  # Associated entity type (e.g., user, item)
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
    """Feature group"""
    name: str
    entity: str
    features: List[FeatureDefinition]
    description: str = ""
    version: int = 1

class FeatureStore(ABC):
    """Feature store abstract base class"""

    @abstractmethod
    def get_online_features(self, entity_ids: List[str],
                           feature_names: List[str]) -> pd.DataFrame:
        """Get online features"""
        pass

    @abstractmethod
    def get_offline_features(self, entity_ids: List[str],
                            feature_names: List[str],
                            start_time: datetime,
                            end_time: datetime) -> pd.DataFrame:
        """Get offline features (for training)"""
        pass

    @abstractmethod
    def materialize_features(self, feature_group: str,
                            start_time: datetime,
                            end_time: datetime):
        """Materialize features to online storage"""
        pass

class RedisOnlineStore:
    """Redis online feature store"""

    def __init__(self, host: str = "localhost", port: int = 6379):
        self.client = redis.Redis(host=host, port=port, decode_responses=True)
        self.feature_ttl = 86400 * 7  # 7 days TTL

    def _get_key(self, entity: str, entity_id: str, feature_group: str) -> str:
        """Generate Redis key"""
        return f"features:{entity}:{entity_id}:{feature_group}"

    def set_features(self, entity: str, entity_id: str,
                     feature_group: str, features: Dict[str, Any]):
        """Write features"""
        key = self._get_key(entity, entity_id, feature_group)
        self.client.hset(key, mapping=features)
        self.client.expire(key, self.feature_ttl)

    def get_features(self, entity: str, entity_id: str,
                    feature_group: str,
                    feature_names: Optional[List[str]] = None) -> Dict[str, Any]:
        """Read features"""
        key = self._get_key(entity, entity_id, feature_group)

        if feature_names:
            values = self.client.hmget(key, feature_names)
            return dict(zip(feature_names, values))
        else:
            return self.client.hgetall(key)

    def batch_get_features(self, entity: str, entity_ids: List[str],
                          feature_group: str,
                          feature_names: List[str]) -> pd.DataFrame:
        """Batch read features"""
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
    """Parquet offline feature store"""

    def __init__(self, base_path: str):
        self.base_path = base_path

    def _get_path(self, feature_group: str, date: str) -> str:
        """Generate storage path"""
        return f"{self.base_path}/{feature_group}/dt={date}"

    def write_features(self, feature_group: str, date: str,
                       df: pd.DataFrame):
        """Write features"""
        path = self._get_path(feature_group, date)
        df.to_parquet(path, index=False)

    def read_features(self, feature_group: str,
                     start_date: str, end_date: str,
                     entity_ids: Optional[List[str]] = None) -> pd.DataFrame:
        """Read features"""
        # Generate date range
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
    """Feature store service"""

    def __init__(self, online_store: RedisOnlineStore,
                 offline_store: ParquetOfflineStore):
        self.online_store = online_store
        self.offline_store = offline_store
        self.feature_registry: Dict[str, FeatureGroup] = {}

    def register_feature_group(self, feature_group: FeatureGroup):
        """Register feature group"""
        self.feature_registry[feature_group.name] = feature_group
        print(f"Registered feature group: {feature_group.name}")

    def get_online_features(self, entity: str, entity_ids: List[str],
                           feature_groups: List[str]) -> pd.DataFrame:
        """Get online features"""
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
        """Get training data"""
        result_df = pd.DataFrame({"entity_id": entity_ids})

        for fg_name in feature_groups:
            features_df = self.offline_store.read_features(
                fg_name, start_date, end_date, entity_ids
            )

            if not features_df.empty:
                result_df = result_df.merge(features_df, on="entity_id", how="left")

        return result_df

    def materialize(self, feature_group: str, date: str):
        """Materialize features: sync from offline to online storage"""
        fg = self.feature_registry.get(feature_group)
        if not fg:
            raise ValueError(f"Feature group {feature_group} not found")

        # Read offline features
        df = self.offline_store.read_features(feature_group, date, date)

        if df.empty:
            print(f"No data to materialize for {feature_group} on {date}")
            return

        # Write to online storage
        feature_names = [f.name for f in fg.features]
        for _, row in df.iterrows():
            entity_id = row["entity_id"]
            features = {name: row[name] for name in feature_names if name in row}
            self.online_store.set_features(fg.entity, entity_id, feature_group, features)

        print(f"Materialized {len(df)} records for {feature_group}")
```

### Feature Service API

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn

app = FastAPI(title="Feature Store API")

# Global feature store service instance
feature_store: Optional[FeatureStoreService] = None

class OnlineFeatureRequest(BaseModel):
    """Online feature request"""
    entity: str
    entity_ids: List[str]
    feature_groups: List[str]

class OnlineFeatureResponse(BaseModel):
    """Online feature response"""
    features: List[Dict[str, Any]]

class TrainingDataRequest(BaseModel):
    """Training data request"""
    entity: str
    entity_ids: List[str]
    feature_groups: List[str]
    start_date: str
    end_date: str

@app.post("/features/online", response_model=OnlineFeatureResponse)
async def get_online_features(request: OnlineFeatureRequest):
    """Get online features"""
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
    """Get training features"""
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
    """List all feature groups"""
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
    """Get feature group details"""
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

## Training Platform Architecture

### Training Platform Overall Architecture

```
+------------------------------------------------------------------------------+
|                              Training Platform Architecture                   |
+------------------------------------------------------------------------------+
|                                                                              |
|  +-----------------------------------------------------------------------+   |
|  |                         Experiment Management Layer                    |   |
|  |  +-------------+  +-------------+  +-------------+  +-------------+   |   |
|  |  | Experiment  |  | Hyperpar.   |  | Model       |  |Visualization|   |   |
|  |  | Tracking    |  | Optimization|  | Comparison  |  |(TensorBoard)|   |   |
|  |  | (MLflow)    |  | (Optuna)    |  | (Dashboard) |  |             |   |   |
|  |  +-------------+  +-------------+  +-------------+  +-------------+   |   |
|  +-----------------------------------------------------------------------+   |
|                                     |                                        |
|                                     v                                        |
|  +-----------------------------------------------------------------------+   |
|  |                         Training Execution Layer                       |   |
|  |  +-------------+  +-------------+  +-------------+  +-------------+   |   |
|  |  | Single-Node |  | Distributed |  | GPU Cluster |  | Job         |   |   |
|  |  | Training    |  | Training    |  | (K8s+GPU)   |  | Scheduler   |   |   |
|  |  | (PyTorch)   |  | (Horovod)   |  |             |  | (Kubeflow)  |   |   |
|  |  +-------------+  +-------------+  +-------------+  +-------------+   |   |
|  +-----------------------------------------------------------------------+   |
|                                     |                                        |
|                                     v                                        |
|  +-----------------------------------------------------------------------+   |
|  |                         Resource Management Layer                      |   |
|  |  +-------------+  +-------------+  +-------------+  +-------------+   |   |
|  |  | Compute     |  | Storage     |  | Network     |  | Cost        |   |   |
|  |  | Resources   |  | Resources   |  | Resources   |  | Control     |   |   |
|  |  | (CPU/GPU)   |  | (S3/HDFS)   |  | (High-speed)|  | (Quota)     |   |   |
|  |  +-------------+  +-------------+  +-------------+  +-------------+   |   |
|  +-----------------------------------------------------------------------+   |
|                                                                              |
+------------------------------------------------------------------------------+
```

### Experiment Tracking System

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
    """Experiment configuration"""
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
    """Experiment tracker"""

    def __init__(self, tracking_uri: str = "http://mlflow:5000"):
        mlflow.set_tracking_uri(tracking_uri)
        self.current_run = None

    def start_experiment(self, config: ExperimentConfig) -> str:
        """Start experiment"""
        # Set experiment
        mlflow.set_experiment(config.name)

        # Start run
        self.current_run = mlflow.start_run()
        run_id = self.current_run.info.run_id

        # Log configuration
        mlflow.log_params(config.hyperparameters)
        mlflow.log_param("model_type", config.model_type)
        mlflow.log_dict(config.data_config, "data_config.json")

        # Set tags
        if config.tags:
            mlflow.set_tags(config.tags)

        print(f"Started experiment run: {run_id}")
        return run_id

    def log_metrics(self, metrics: Dict[str, float], step: Optional[int] = None):
        """Log metrics"""
        for name, value in metrics.items():
            mlflow.log_metric(name, value, step=step)

    def log_model(self, model, model_name: str,
                  signature=None, input_example=None):
        """Log model"""
        mlflow.pytorch.log_model(
            model,
            model_name,
            signature=signature,
            input_example=input_example
        )

    def log_artifact(self, local_path: str, artifact_path: str = None):
        """Log artifact"""
        mlflow.log_artifact(local_path, artifact_path)

    def end_experiment(self, status: str = "FINISHED"):
        """End experiment"""
        if self.current_run:
            mlflow.end_run(status=status)
            self.current_run = None

    def get_best_run(self, experiment_name: str,
                     metric: str, mode: str = "max") -> Dict:
        """Get best run"""
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
    """Training pipeline"""

    def __init__(self, tracker: ExperimentTracker,
                 feature_store: FeatureStoreService):
        self.tracker = tracker
        self.feature_store = feature_store

    def prepare_data(self, config: Dict) -> tuple:
        """Prepare training data"""
        # Get training data from feature store
        df = self.feature_store.get_training_data(
            entity=config["entity"],
            entity_ids=config["entity_ids"],
            feature_groups=config["feature_groups"],
            start_date=config["start_date"],
            end_date=config["end_date"]
        )

        # Separate features and labels
        feature_columns = config["feature_columns"]
        label_column = config["label_column"]

        X = df[feature_columns].values
        y = df[label_column].values

        # Split train and validation sets
        from sklearn.model_selection import train_test_split
        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        return (X_train, y_train), (X_val, y_val)

    def train(self, config: ExperimentConfig,
              model_class, train_data: tuple,
              val_data: tuple) -> Any:
        """Execute training"""
        import torch
        import torch.nn as nn
        from torch.utils.data import DataLoader, TensorDataset

        # Start experiment tracking
        self.tracker.start_experiment(config)

        try:
            X_train, y_train = train_data
            X_val, y_val = val_data

            # Create data loaders
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

            # Initialize model
            model = model_class(**config.hyperparameters.get("model_params", {}))
            optimizer = torch.optim.Adam(
                model.parameters(),
                lr=config.hyperparameters.get("learning_rate", 0.001)
            )
            criterion = nn.MSELoss()

            # Training loop
            epochs = config.hyperparameters.get("epochs", 10)
            best_val_loss = float('inf')

            for epoch in range(epochs):
                # Training phase
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

                # Validation phase
                model.eval()
                val_loss = 0.0
                with torch.no_grad():
                    for batch_X, batch_y in val_loader:
                        outputs = model(batch_X)
                        loss = criterion(outputs.squeeze(), batch_y)
                        val_loss += loss.item()

                val_loss /= len(val_loader)

                # Log metrics
                self.tracker.log_metrics({
                    "train_loss": train_loss,
                    "val_loss": val_loss
                }, step=epoch)

                # Save best model
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

### Distributed Training

```python
import torch
import torch.distributed as dist
import torch.nn as nn
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data.distributed import DistributedSampler
import os

class DistributedTrainer:
    """Distributed trainer"""

    def __init__(self, model: nn.Module,
                 backend: str = "nccl"):
        self.backend = backend
        self.model = model
        self.world_size = int(os.environ.get("WORLD_SIZE", 1))
        self.rank = int(os.environ.get("RANK", 0))
        self.local_rank = int(os.environ.get("LOCAL_RANK", 0))

    def setup(self):
        """Initialize distributed environment"""
        if self.world_size > 1:
            dist.init_process_group(
                backend=self.backend,
                init_method="env://",
                world_size=self.world_size,
                rank=self.rank
            )

            # Set device
            torch.cuda.set_device(self.local_rank)
            self.device = torch.device(f"cuda:{self.local_rank}")

            # Wrap model
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
        """Clean up distributed environment"""
        if self.world_size > 1:
            dist.destroy_process_group()

    def get_sampler(self, dataset):
        """Get distributed sampler"""
        if self.world_size > 1:
            return DistributedSampler(
                dataset,
                num_replicas=self.world_size,
                rank=self.rank
            )
        return None

    def is_main_process(self) -> bool:
        """Check if main process"""
        return self.rank == 0

    def train_epoch(self, train_loader, optimizer, criterion):
        """Train one epoch"""
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

        # Aggregate loss from all processes
        if self.world_size > 1:
            total_loss_tensor = torch.tensor(total_loss).to(self.device)
            dist.all_reduce(total_loss_tensor, op=dist.ReduceOp.SUM)
            total_loss = total_loss_tensor.item() / self.world_size

        return total_loss / len(train_loader)

    def save_checkpoint(self, path: str, epoch: int,
                       optimizer, loss: float):
        """Save checkpoint (main process only)"""
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

# Kubernetes distributed training job configuration
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

### Hyperparameter Optimization

```python
import optuna
from optuna.integration import PyTorchLightningPruningCallback
from typing import Dict, Any, Callable
import torch.nn as nn

class HyperparameterOptimizer:
    """Hyperparameter optimizer"""

    def __init__(self, study_name: str,
                 storage: str = "sqlite:///optuna.db"):
        self.study_name = study_name
        self.storage = storage
        self.study = None

    def create_study(self, direction: str = "minimize",
                     pruner: optuna.pruners.BasePruner = None):
        """Create optimization study"""
        self.study = optuna.create_study(
            study_name=self.study_name,
            storage=self.storage,
            direction=direction,
            pruner=pruner or optuna.pruners.MedianPruner(),
            load_if_exists=True
        )
        return self.study

    def define_search_space(self, trial: optuna.Trial) -> Dict[str, Any]:
        """Define search space"""
        return {
            # Learning rate: log-uniform distribution
            "learning_rate": trial.suggest_float(
                "learning_rate", 1e-5, 1e-2, log=True
            ),
            # Batch size: categorical selection
            "batch_size": trial.suggest_categorical(
                "batch_size", [16, 32, 64, 128]
            ),
            # Hidden layer size
            "hidden_size": trial.suggest_int(
                "hidden_size", 64, 512, step=64
            ),
            # Dropout rate
            "dropout": trial.suggest_float(
                "dropout", 0.1, 0.5
            ),
            # Number of layers
            "num_layers": trial.suggest_int(
                "num_layers", 1, 4
            ),
            # Optimizer type
            "optimizer": trial.suggest_categorical(
                "optimizer", ["adam", "sgd", "adamw"]
            ),
            # Weight decay
            "weight_decay": trial.suggest_float(
                "weight_decay", 1e-6, 1e-2, log=True
            )
        }

    def objective(self, trial: optuna.Trial,
                  model_class: type,
                  train_fn: Callable,
                  train_data: tuple,
                  val_data: tuple) -> float:
        """Optimization objective function"""
        # Get hyperparameters
        params = self.define_search_space(trial)

        # Create model
        model = model_class(
            hidden_size=params["hidden_size"],
            num_layers=params["num_layers"],
            dropout=params["dropout"]
        )

        # Train and get validation loss
        val_loss = train_fn(
            model=model,
            train_data=train_data,
            val_data=val_data,
            params=params,
            trial=trial  # For early stopping
        )

        return val_loss

    def optimize(self, model_class: type,
                 train_fn: Callable,
                 train_data: tuple,
                 val_data: tuple,
                 n_trials: int = 100,
                 timeout: int = None) -> Dict[str, Any]:
        """Execute optimization"""
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
        """Get optimization history"""
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

## Inference Platform Design

### Inference Platform Architecture

```
+------------------------------------------------------------------------------+
|                              Inference Platform Architecture                  |
+------------------------------------------------------------------------------+
|                                                                              |
|                            +-----------------+                               |
|                            |   API Gateway   |                               |
|                            | (Traffic Entry) |                               |
|                            +---------+-------+                               |
|                                     |                                        |
|               +---------------------+---------------------+                  |
|               |                     |                     |                  |
|               v                     v                     v                  |
|        +------------+          +------------+          +------------+       |
|        |  Online    |          | Near       |          |  Batch     |       |
|        | Inference  |          | Real-time  |          | Inference  |       |
|        | (<100ms)   |          | (<1s)      |          | (Minutes)  |       |
|        +-----+------+          +-----+------+          +-----+------+       |
|              |                       |                       |              |
|              +-----------------------+-----------------------+              |
|                                     |                                        |
|                                     v                                        |
|        +-------------------------------------------------------------+      |
|        |                    Model Serving Layer                       |      |
|        |  +-----------+  +-----------+  +-----------+  +-----------+ |      |
|        |  | Model A   |  | Model B   |  | Model C   |  | Model D   | |      |
|        |  | v1.0      |  | v2.1      |  | v1.3      |  | v3.0      | |      |
|        |  +-----------+  +-----------+  +-----------+  +-----------+ |      |
|        +-------------------------------------------------------------+      |
|                                     |                                        |
|                                     v                                        |
|        +-------------------------------------------------------------+      |
|        |                  Infrastructure Layer                        |      |
|        |  +-------------+  +-------------+  +---------------------+  |      |
|        |  | Model       |  | Feature     |  | Monitoring & Logs   |  |      |
|        |  | Registry    |  | Service     |  |                     |  |      |
|        |  +-------------+  +-------------+  +---------------------+  |      |
|        +-------------------------------------------------------------+      |
|                                                                              |
+------------------------------------------------------------------------------+
```

### Model Serving Implementation

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
    """Model metadata"""
    name: str
    version: str
    framework: str  # pytorch, tensorflow, onnx, etc.
    input_schema: Dict[str, Any]
    output_schema: Dict[str, Any]
    created_at: datetime = field(default_factory=datetime.now)
    tags: Dict[str, str] = field(default_factory=dict)

@dataclass
class PredictionRequest:
    """Prediction request"""
    model_name: str
    model_version: Optional[str] = None
    features: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class PredictionResponse:
    """Prediction response"""
    predictions: Any
    model_name: str
    model_version: str
    latency_ms: float
    metadata: Dict[str, Any] = field(default_factory=dict)

class ModelServer(ABC):
    """Model server abstract base class"""

    @abstractmethod
    def load(self, model_path: str, metadata: ModelMetadata):
        """Load model"""
        pass

    @abstractmethod
    def predict(self, request: PredictionRequest) -> PredictionResponse:
        """Synchronous prediction"""
        pass

    @abstractmethod
    async def predict_async(self, request: PredictionRequest) -> PredictionResponse:
        """Asynchronous prediction"""
        pass

class PyTorchModelServer(ModelServer):
    """PyTorch model server"""

    def __init__(self):
        self.models: Dict[str, Dict[str, torch.nn.Module]] = {}
        self.metadata: Dict[str, ModelMetadata] = {}
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.executor = ThreadPoolExecutor(max_workers=4)

    def load(self, model_path: str, metadata: ModelMetadata):
        """Load PyTorch model"""
        model = torch.jit.load(model_path, map_location=self.device)
        model.eval()

        model_name = metadata.name
        model_version = metadata.version

        if model_name not in self.models:
            self.models[model_name] = {}

        self.models[model_name][model_version] = model
        self.metadata[f"{model_name}:{model_version}"] = metadata

        print(f"Loaded model: {model_name} v{model_version}")

    def _get_model(self, model_name: str,
                   model_version: Optional[str] = None) -> tuple:
        """Get model"""
        if model_name not in self.models:
            raise ValueError(f"Model {model_name} not found")

        versions = self.models[model_name]

        if model_version:
            if model_version not in versions:
                raise ValueError(f"Version {model_version} not found for {model_name}")
            return versions[model_version], model_version
        else:
            # Return latest version
            latest_version = max(versions.keys())
            return versions[latest_version], latest_version

    def predict(self, request: PredictionRequest) -> PredictionResponse:
        """Synchronous prediction"""
        import time
        start_time = time.time()

        model, version = self._get_model(request.model_name, request.model_version)

        # Prepare input data
        input_tensor = self._prepare_input(request.features)

        # Execute inference
        with torch.no_grad():
            output = model(input_tensor)

        # Process output
        predictions = self._process_output(output)

        latency_ms = (time.time() - start_time) * 1000

        return PredictionResponse(
            predictions=predictions,
            model_name=request.model_name,
            model_version=version,
            latency_ms=latency_ms
        )

    async def predict_async(self, request: PredictionRequest) -> PredictionResponse:
        """Asynchronous prediction"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self.executor, self.predict, request)

    def _prepare_input(self, features: Dict[str, Any]) -> torch.Tensor:
        """Prepare input tensor"""
        if isinstance(features, dict):
            # Assume features are flat numeric list
            values = list(features.values())
            return torch.FloatTensor([values]).to(self.device)
        elif isinstance(features, list):
            return torch.FloatTensor([features]).to(self.device)
        else:
            return torch.FloatTensor(features).to(self.device)

    def _process_output(self, output: torch.Tensor) -> Any:
        """Process output"""
        return output.cpu().numpy().tolist()

class ModelServingAPI:
    """Model serving API"""

    def __init__(self, model_server: ModelServer):
        self.model_server = model_server
        self.request_count = 0
        self.total_latency = 0.0

    async def predict(self, request: PredictionRequest) -> PredictionResponse:
        """Handle prediction request"""
        response = await self.model_server.predict_async(request)

        # Update statistics
        self.request_count += 1
        self.total_latency += response.latency_ms

        return response

    async def batch_predict(self, requests: List[PredictionRequest]) -> List[PredictionResponse]:
        """Batch prediction"""
        tasks = [self.predict(req) for req in requests]
        return await asyncio.gather(*tasks)

    def get_stats(self) -> Dict[str, float]:
        """Get service statistics"""
        avg_latency = self.total_latency / self.request_count if self.request_count > 0 else 0
        return {
            "request_count": self.request_count,
            "avg_latency_ms": avg_latency,
            "total_latency_ms": self.total_latency
        }
```

### A/B Testing and Traffic Control

```python
import random
import hashlib
from dataclasses import dataclass
from typing import Dict, List, Optional
from datetime import datetime

@dataclass
class ABExperimentConfig:
    """A/B experiment configuration"""
    name: str
    variants: Dict[str, float]  # variant_name -> traffic_percentage
    start_time: datetime
    end_time: Optional[datetime] = None
    description: str = ""

class ABTestManager:
    """A/B test manager"""

    def __init__(self):
        self.experiments: Dict[str, ABExperimentConfig] = {}
        self.assignment_cache: Dict[str, str] = {}  # user_id -> variant

    def create_experiment(self, config: ABExperimentConfig):
        """Create experiment"""
        # Validate traffic allocation
        total_traffic = sum(config.variants.values())
        if abs(total_traffic - 1.0) > 0.001:
            raise ValueError(f"Traffic allocation must sum to 1.0, got {total_traffic}")

        self.experiments[config.name] = config
        print(f"Created experiment: {config.name}")

    def get_variant(self, experiment_name: str, user_id: str) -> str:
        """Get user assigned variant"""
        if experiment_name not in self.experiments:
            raise ValueError(f"Experiment {experiment_name} not found")

        config = self.experiments[experiment_name]

        # Check if experiment is active
        now = datetime.now()
        if now < config.start_time:
            return "control"  # Experiment not started, return control
        if config.end_time and now > config.end_time:
            return "control"  # Experiment ended, return control

        # Check cache
        cache_key = f"{experiment_name}:{user_id}"
        if cache_key in self.assignment_cache:
            return self.assignment_cache[cache_key]

        # Use consistent hashing to assign variant
        variant = self._assign_variant(user_id, config.variants)
        self.assignment_cache[cache_key] = variant

        return variant

    def _assign_variant(self, user_id: str, variants: Dict[str, float]) -> str:
        """Use consistent hashing to assign variant"""
        # Generate hash value between 0-1
        hash_value = int(hashlib.md5(user_id.encode()).hexdigest(), 16) % 10000 / 10000

        cumulative = 0.0
        for variant_name, percentage in variants.items():
            cumulative += percentage
            if hash_value < cumulative:
                return variant_name

        return list(variants.keys())[-1]

    def log_exposure(self, experiment_name: str, user_id: str, variant: str):
        """Log experiment exposure"""
        # In practice, should write to logging system
        print(f"Exposure: experiment={experiment_name}, user={user_id}, variant={variant}")

    def log_conversion(self, experiment_name: str, user_id: str,
                       metric_name: str, metric_value: float):
        """Log conversion metric"""
        # In practice, should write to logging system
        print(f"Conversion: experiment={experiment_name}, user={user_id}, "
              f"metric={metric_name}, value={metric_value}")

class TrafficRouter:
    """Traffic router"""

    def __init__(self, ab_test_manager: ABTestManager):
        self.ab_manager = ab_test_manager
        self.model_mappings: Dict[str, Dict[str, str]] = {}  # experiment -> variant -> model_version

    def register_model_mapping(self, experiment_name: str,
                               mappings: Dict[str, str]):
        """Register model mapping"""
        self.model_mappings[experiment_name] = mappings

    def route_request(self, experiment_name: str, user_id: str,
                     model_name: str) -> str:
        """Route request to specified model version"""
        # Get user variant
        variant = self.ab_manager.get_variant(experiment_name, user_id)

        # Log exposure
        self.ab_manager.log_exposure(experiment_name, user_id, variant)

        # Get corresponding model version
        mappings = self.model_mappings.get(experiment_name, {})
        model_version = mappings.get(variant, "default")

        return model_version

# Canary deployment
class CanaryDeployer:
    """Canary deployer"""

    def __init__(self):
        self.deployments: Dict[str, Dict] = {}

    def create_canary(self, model_name: str,
                      new_version: str,
                      canary_percentage: float = 0.05):
        """Create canary deployment"""
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
        """Get current stable version"""
        # In practice, get from model registry
        return "1.0"

    def route_to_version(self, model_name: str, user_id: str) -> str:
        """Route to corresponding version"""
        deployment = self.deployments.get(model_name)

        if not deployment or deployment["status"] != "active":
            return self._get_stable_version(model_name)

        # Use user ID hash to determine routing
        hash_value = int(hashlib.md5(user_id.encode()).hexdigest(), 16) % 100

        if hash_value < deployment["canary_percentage"] * 100:
            return deployment["canary_version"]
        else:
            return deployment["stable_version"]

    def promote_canary(self, model_name: str):
        """Promote canary version to stable"""
        deployment = self.deployments.get(model_name)
        if deployment:
            deployment["status"] = "promoted"
            print(f"Promoted canary version {deployment['canary_version']} "
                  f"to stable for {model_name}")

    def rollback_canary(self, model_name: str):
        """Rollback canary deployment"""
        deployment = self.deployments.get(model_name)
        if deployment:
            deployment["status"] = "rolled_back"
            print(f"Rolled back canary deployment for {model_name}")

    def update_canary_percentage(self, model_name: str, new_percentage: float):
        """Update canary traffic percentage"""
        deployment = self.deployments.get(model_name)
        if deployment and deployment["status"] == "active":
            deployment["canary_percentage"] = new_percentage
            print(f"Updated canary percentage for {model_name} to {new_percentage*100}%")
```

## Model Registry

### Model Registry Architecture

```
+------------------------------------------------------------------------------+
|                            Model Registry Architecture                        |
+------------------------------------------------------------------------------+
|                                                                              |
|   +-----------------------------------------------------------------------+  |
|   |                         Model Metadata Storage                         |  |
|   |  +------------------------------------------------------------------+ |  |
|   |  |  Model: recommendation-v2                                         | |  |
|   |  |  |-- Version: 2.0.1                                              | |  |
|   |  |  |   |-- Metrics: {AUC: 0.85, Latency: 15ms}                    | |  |
|   |  |  |   |-- Artifacts: s3://models/rec/v2.0.1/model.pt             | |  |
|   |  |  |   |-- Status: Production                                      | |  |
|   |  |  |   +-- Created: 2024-01-15                                     | |  |
|   |  |  +-- Version: 2.0.0                                              | |  |
|   |  |      |-- Status: Archived                                        | |  |
|   |  |      +-- ...                                                     | |  |
|   |  +------------------------------------------------------------------+ |  |
|   +-----------------------------------------------------------------------+  |
|                                                                              |
|   +-----------------------------------------------------------------------+  |
|   |                         Model Lifecycle Management                     |  |
|   |                                                                        |  |
|   |   [Register] --> [Validate] --> [Staging] --> [Production] --> [Archive]|  |
|   |                                                                        |  |
|   +-----------------------------------------------------------------------+  |
|                                                                              |
|   +-----------------------------------------------------------------------+  |
|   |                         API Interface                                  |  |
|   |  +-------------+  +-------------+  +-------------+  +-------------+   |  |
|   |  | Register    |  | Query       |  | Download    |  | Update      |   |  |
|   |  | Model       |  | Model       |  | Model       |  | Status      |   |  |
|   |  +-------------+  +-------------+  +-------------+  +-------------+   |  |
|   +-----------------------------------------------------------------------+  |
|                                                                              |
+------------------------------------------------------------------------------+
```

### Model Registry Implementation

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
    """Model stage"""
    NONE = "None"
    STAGING = "Staging"
    PRODUCTION = "Production"
    ARCHIVED = "Archived"

@dataclass
class ModelVersion:
    """Model version"""
    version: str
    artifact_path: str
    metrics: Dict[str, float]
    parameters: Dict[str, Any]
    stage: ModelStage
    description: str = ""
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    tags: Dict[str, str] = field(default_factory=dict)
    signature: Optional[Dict] = None  # Input/output signature

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
    """Registered model"""
    name: str
    description: str = ""
    versions: Dict[str, ModelVersion] = field(default_factory=dict)
    tags: Dict[str, str] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)

    def get_latest_version(self) -> Optional[ModelVersion]:
        """Get latest version"""
        if not self.versions:
            return None
        latest = max(self.versions.keys())
        return self.versions[latest]

    def get_production_version(self) -> Optional[ModelVersion]:
        """Get production version"""
        for version in self.versions.values():
            if version.stage == ModelStage.PRODUCTION:
                return version
        return None

class ModelRegistry:
    """Model registry"""

    def __init__(self, storage_path: str = "./model_registry"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.models: Dict[str, RegisteredModel] = {}
        self._load_registry()

    def _load_registry(self):
        """Load registry"""
        registry_file = self.storage_path / "registry.json"
        if registry_file.exists():
            with open(registry_file, "r") as f:
                data = json.load(f)
                # Deserialize model data
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
        """Save registry"""
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
        """Create registered model"""
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
        """Register model version"""
        if model_name not in self.models:
            self.create_registered_model(model_name)

        model = self.models[model_name]

        # Generate version number
        if model.versions:
            latest_version = max(model.versions.keys())
            parts = latest_version.split(".")
            new_version = f"{parts[0]}.{parts[1]}.{int(parts[2])+1}"
        else:
            new_version = "1.0.0"

        # Copy model files to registry storage
        model_storage = self.storage_path / model_name / new_version
        model_storage.mkdir(parents=True, exist_ok=True)

        if Path(artifact_path).is_file():
            dest_path = model_storage / Path(artifact_path).name
            shutil.copy2(artifact_path, dest_path)
        else:
            dest_path = model_storage / "model"
            shutil.copytree(artifact_path, dest_path)

        # Create version record
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
        """Transition model stage"""
        if model_name not in self.models:
            raise ValueError(f"Model {model_name} not found")

        model = self.models[model_name]

        if version not in model.versions:
            raise ValueError(f"Version {version} not found for {model_name}")

        # If transitioning to Production, archive existing Production version
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
        """Get model"""
        return self.models.get(model_name)

    def get_model_version(self, model_name: str,
                          version: str) -> Optional[ModelVersion]:
        """Get model version"""
        model = self.get_model(model_name)
        if model:
            return model.versions.get(version)
        return None

    def get_latest_version(self, model_name: str,
                           stage: ModelStage = None) -> Optional[ModelVersion]:
        """Get latest version"""
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
        """List all models"""
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
        """Search models"""
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
        """Delete model version"""
        if model_name not in self.models:
            raise ValueError(f"Model {model_name} not found")

        model = self.models[model_name]

        if version not in model.versions:
            raise ValueError(f"Version {version} not found")

        # Cannot delete Production version
        if model.versions[version].stage == ModelStage.PRODUCTION:
            raise ValueError("Cannot delete Production version")

        # Delete files
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

## Monitoring and Alerting System

### ML System Monitoring Architecture

```
+------------------------------------------------------------------------------+
|                            ML Monitoring & Alerting Architecture              |
+------------------------------------------------------------------------------+
|                                                                              |
|                           +-----------------+                                |
|                           |   Alert         |                                |
|                           |   Manager       |                                |
|                           +---------+-------+                                |
|                                    |                                         |
|                                    v                                         |
|   +-----------------------------------------------------------------------+  |
|   |                         Monitoring Dashboard                           |  |
|   |  +------------+  +------------+  +------------+  +------------+       |  |
|   |  | System     |  | Model      |  | Data       |  | Business   |       |  |
|   |  | Metrics    |  | Metrics    |  | Metrics    |  | Metrics    |       |  |
|   |  +------------+  +------------+  +------------+  +------------+       |  |
|   +-----------------------------------------------------------------------+  |
|                                    |                                         |
|                                    v                                         |
|   +-----------------------------------------------------------------------+  |
|   |                         Metrics Collection Layer                       |  |
|   |  +-------------+  +-------------+  +-------------+  +-------------+   |  |
|   |  | Prometheus  |  | StatsD      |  | Logging     |  | APM         |   |  |
|   |  |             |  |             |  | System      |  |             |   |  |
|   |  +-------------+  +-------------+  +-------------+  +-------------+   |  |
|   +-----------------------------------------------------------------------+  |
|                                    |                                         |
|        +---------------------------+---------------------------+            |
|        |                           |                           |            |
|        v                           v                           v            |
|  +--------------+          +--------------+          +--------------+      |
|  |   Training   |          |   Inference  |          |   Feature    |      |
|  |   Platform   |          |   Platform   |          |   Platform   |      |
|  +--------------+          +--------------+          +--------------+      |
|                                                                              |
+------------------------------------------------------------------------------+
```

### Monitoring Metrics System

```python
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from enum import Enum
import numpy as np
from prometheus_client import Counter, Histogram, Gauge, CollectorRegistry

class MetricType(Enum):
    """Metric type"""
    SYSTEM = "system"      # System metrics
    MODEL = "model"        # Model metrics
    DATA = "data"          # Data metrics
    BUSINESS = "business"  # Business metrics

@dataclass
class MetricDefinition:
    """Metric definition"""
    name: str
    type: MetricType
    description: str
    unit: str
    threshold_warning: Optional[float] = None
    threshold_critical: Optional[float] = None
    comparison: str = "gt"  # gt, lt, eq

class MLMetricsCollector:
    """ML metrics collector"""

    def __init__(self, registry: CollectorRegistry = None):
        self.registry = registry or CollectorRegistry()
        self._setup_metrics()

    def _setup_metrics(self):
        """Setup metrics"""
        # System metrics
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

        # Model metrics
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

        # Data quality metrics
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

        # Business metrics
        self.conversion_rate = Gauge(
            "ml_conversion_rate",
            "Model-driven conversion rate",
            ["model_name", "experiment"],
            registry=self.registry
        )

    def record_request(self, model_name: str, model_version: str,
                       latency: float, status: str = "success"):
        """Record request metrics"""
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
        """Record prediction value"""
        self.prediction_value.labels(
            model_name=model_name,
            model_version=model_version
        ).observe(prediction)

    def record_feature(self, feature_name: str, value: float):
        """Record feature value"""
        self.feature_value.labels(feature_name=feature_name).observe(value)

    def update_data_quality(self, feature_name: str,
                            null_ratio: float, drift_score: float):
        """Update data quality metrics"""
        self.feature_null_ratio.labels(feature_name=feature_name).set(null_ratio)
        self.data_drift_score.labels(feature_name=feature_name).set(drift_score)

class ModelPerformanceMonitor:
    """Model performance monitor"""

    def __init__(self, window_size: int = 1000):
        self.window_size = window_size
        self.predictions: Dict[str, List[float]] = {}
        self.actuals: Dict[str, List[float]] = {}
        self.timestamps: Dict[str, List[datetime]] = {}

    def record_prediction(self, model_name: str,
                          prediction: float, actual: float = None):
        """Record prediction and actual values"""
        if model_name not in self.predictions:
            self.predictions[model_name] = []
            self.actuals[model_name] = []
            self.timestamps[model_name] = []

        self.predictions[model_name].append(prediction)
        if actual is not None:
            self.actuals[model_name].append(actual)
        self.timestamps[model_name].append(datetime.now())

        # Maintain window size
        if len(self.predictions[model_name]) > self.window_size:
            self.predictions[model_name] = self.predictions[model_name][-self.window_size:]
            self.actuals[model_name] = self.actuals[model_name][-self.window_size:]
            self.timestamps[model_name] = self.timestamps[model_name][-self.window_size:]

    def get_performance_metrics(self, model_name: str) -> Dict[str, float]:
        """Get performance metrics"""
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

        # If actual values available, calculate accuracy metrics
        actuals = self.actuals.get(model_name, [])
        if len(actuals) == len(predictions) and len(actuals) > 0:
            actuals = np.array(actuals)

            # Regression metrics
            metrics["mae"] = float(np.mean(np.abs(predictions - actuals)))
            metrics["mse"] = float(np.mean((predictions - actuals) ** 2))
            metrics["rmse"] = float(np.sqrt(metrics["mse"]))

            # Classification metrics (if binary classification)
            if set(actuals) == {0, 1} or set(actuals) == {0.0, 1.0}:
                pred_binary = (predictions >= 0.5).astype(int)
                metrics["accuracy"] = float(np.mean(pred_binary == actuals))

        return metrics

    def detect_drift(self, model_name: str,
                    baseline_predictions: List[float],
                    threshold: float = 0.05) -> Dict[str, Any]:
        """Detect prediction distribution drift"""
        from scipy import stats

        if model_name not in self.predictions:
            return {"drift_detected": False, "message": "No data"}

        current = np.array(self.predictions[model_name])
        baseline = np.array(baseline_predictions)

        # KS test
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
    """Alert manager"""

    def __init__(self):
        self.rules: List[Dict] = []
        self.alerts: List[Dict] = []

    def add_rule(self, name: str, condition: str,
                 threshold: float, severity: str,
                 notification_channels: List[str]):
        """Add alert rule"""
        self.rules.append({
            "name": name,
            "condition": condition,
            "threshold": threshold,
            "severity": severity,
            "notification_channels": notification_channels,
            "enabled": True
        })

    def check_metric(self, metric_name: str, value: float) -> List[Dict]:
        """Check if metric triggers alert"""
        triggered_alerts = []

        for rule in self.rules:
            if not rule["enabled"]:
                continue

            if metric_name not in rule["condition"]:
                continue

            # Simple threshold check
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
        """Check condition"""
        if ">" in condition:
            return value > threshold
        elif "<" in condition:
            return value < threshold
        elif "=" in condition:
            return abs(value - threshold) < 0.001
        return False

    def get_active_alerts(self, since: datetime = None) -> List[Dict]:
        """Get active alerts"""
        if since is None:
            since = datetime.now() - timedelta(hours=24)

        return [
            alert for alert in self.alerts
            if datetime.fromisoformat(alert["timestamp"]) > since
        ]

# Prometheus alert rules example
PROMETHEUS_ALERT_RULES = """
groups:
  - name: ml_alerts
    rules:
      # High latency alert
      - alert: HighModelLatency
        expr: histogram_quantile(0.99, rate(ml_request_latency_seconds_bucket[5m])) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High model latency detected"
          description: "P99 latency is {{ $value }}s for model {{ $labels.model_name }}"

      # High error rate alert
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

      # Data drift alert
      - alert: DataDriftDetected
        expr: ml_data_drift_score > 0.1
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Data drift detected"
          description: "Feature {{ $labels.feature_name }} drift score: {{ $value }}"

      # Feature null alert
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

## Enterprise ML Platform Case Studies

### Typical ML Platform Comparison

| Platform | Company | Features | Open Source Status |
|----------|---------|----------|-------------------|
| **Michelangelo** | Uber | End-to-end platform, strong feature management | Partially open source (Feast) |
| **FBLearner Flow** | Meta | Large-scale distributed training, AutoML | Not open source |
| **TFX** | Google | End-to-end platform based on TensorFlow | Fully open source |
| **SageMaker** | AWS | Cloud-native, one-stop service | Commercial product |
| **MLflow** | Databricks | Experiment tracking, model management | Fully open source |
| **Kubeflow** | Google | Kubernetes-native ML platform | Fully open source |

### Uber Michelangelo Architecture Analysis

```
+------------------------------------------------------------------------------+
|                        Michelangelo Architecture                              |
+------------------------------------------------------------------------------+
|                                                                              |
|   +-----------------------------------------------------------------------+  |
|   |                         User Interface Layer                           |  |
|   |  +-------------+  +-------------+  +-------------+  +-------------+   |  |
|   |  | Web UI      |  | Python SDK  |  | REST API    |  | CLI         |   |  |
|   |  +-------------+  +-------------+  +-------------+  +-------------+   |  |
|   +-----------------------------------------------------------------------+  |
|                                     |                                        |
|                                     v                                        |
|   +-----------------------------------------------------------------------+  |
|   |                         Workflow Management                            |  |
|   |  +------------------------------------------------------------------+ |  |
|   |  |  DAG Scheduler (based on Apache Airflow)                         | |  |
|   |  +------------------------------------------------------------------+ |  |
|   +-----------------------------------------------------------------------+  |
|                                     |                                        |
|         +---------------------------+---------------------------+           |
|         |                           |                           |           |
|         v                           v                           v           |
|  +--------------+           +--------------+           +--------------+    |
|  | Feature      |           | Training     |           | Prediction   |    |
|  | Store        |           | Service      |           | Service      |    |
|  | (Palette)    |           | (Horovod)    |           | (Peloton)    |    |
|  |              |           |              |           |              |    |
|  | - Offline    |           | - Distributed|           | - Online     |    |
|  |   Features   |           |   Training   |           |   Inference  |    |
|  | - Online     |           | - Hyperpar.  |           | - Batch      |    |
|  |   Features   |           |   Tuning     |           |   Inference  |    |
|  | - Feature    |           | - Experiment |           | - A/B Test   |    |
|  |   Transform  |           |   Management |           |              |    |
|  +--------------+           +--------------+           +--------------+    |
|         |                           |                           |           |
|         +---------------------------+---------------------------+           |
|                                     |                                        |
|                                     v                                        |
|   +-----------------------------------------------------------------------+  |
|   |                         Data Storage Layer                             |  |
|   |  +-------------+  +-------------+  +-------------+  +-------------+   |  |
|   |  | HDFS        |  | Cassandra   |  | Redis       |  | MySQL       |   |  |
|   |  | (Offline)   |  | (Online)    |  | (Cache)     |  | (Metadata)  |   |  |
|   |  +-------------+  +-------------+  +-------------+  +-------------+   |  |
|   +-----------------------------------------------------------------------+  |
|                                                                              |
+------------------------------------------------------------------------------+
```

**Michelangelo Key Design Principles:**

1. **Unified Feature Management**: Palette feature store ensures training and inference use the same feature definitions
2. **End-to-End Tracking**: Complete lineage tracking from data to model
3. **Automated Deployment**: One-click model deployment to production
4. **Multi-Framework Support**: Supports XGBoost, TensorFlow, PyTorch, etc.

### Google TFX Architecture Analysis

```
+------------------------------------------------------------------------------+
|                           TFX Pipeline Architecture                           |
+------------------------------------------------------------------------------+
|                                                                              |
|   +------------------------------------------------------------------------+ |
|   |                         TFX Component Pipeline                          | |
|   |                                                                         | |
|   |   +----------+    +----------+    +----------+    +----------+         | |
|   |   | Example  |--->| Statist- |--->| Schema   |--->| Example  |         | |
|   |   |   Gen    |    | icsGen   |    |   Gen    |    | Validator|         | |
|   |   +----------+    +----------+    +----------+    +----------+         | |
|   |                                                        |                | |
|   |                                                        v                | |
|   |   +----------+    +----------+    +----------+    +----------+         | |
|   |   | Pusher   |<---| Model    |<---| Evaluator|<---| Transform|<------  | |
|   |   |          |    | Validator|    |          |    |          |         | |
|   |   +----------+    +----------+    +----------+    +----------+         | |
|   |       |                                ^               |                | |
|   |       |              +-----------------+               |                | |
|   |       |              |                                 |                | |
|   |       v         +----------+                           v                | |
|   |   +----------+  | Tuner    |                      +----------+         | |
|   |   | Serving  |  | (Optional)|                     | Trainer  |         | |
|   |   +----------+  +----------+                      +----------+         | |
|   |                                                                         | |
|   +------------------------------------------------------------------------+ |
|                                                                              |
|   +------------------------------------------------------------------------+ |
|   |                         Metadata Storage (ML Metadata)                  | |
|   |  - Artifact tracking                                                    | |
|   |  - Execution records                                                    | |
|   |  - Lineage tracking                                                     | |
|   +------------------------------------------------------------------------+ |
|                                                                              |
+------------------------------------------------------------------------------+
```

**TFX Core Component Description:**

| Component | Function | Output |
|-----------|----------|--------|
| ExampleGen | Data ingestion | TFRecord |
| StatisticsGen | Data statistics | Statistics |
| SchemaGen | Schema generation | Schema definition |
| ExampleValidator | Data validation | Anomaly report |
| Transform | Feature engineering | Transformed data |
| Trainer | Model training | SavedModel |
| Tuner | Hyperparameter optimization | Best hyperparameters |
| Evaluator | Model quality checking | Evaluation results |
| ModelValidator | Infrastructure validation | Validation results |
| Pusher | Model deployment | Deployed model |

### Open Source ML Platform Selection Guide

```
+----------------------------------------------------------------------------+
|                          ML Platform Selection Decision Tree                |
+----------------------------------------------------------------------------+
|                                                                            |
|  Need end-to-end platform?                                                 |
|      |                                                                     |
|      |-- Yes --> Using Kubernetes?                                         |
|      |              |                                                      |
|      |              |-- Yes --> Kubeflow                                   |
|      |              |                                                      |
|      |              +-- No --> Using TensorFlow?                           |
|      |                             |                                       |
|      |                             |-- Yes --> TFX                         |
|      |                             |                                       |
|      |                             +-- No --> MLflow + Custom Components   |
|      |                                                                     |
|      +-- No --> What functionality needed?                                 |
|                    |                                                       |
|                    |-- Experiment Tracking --> MLflow / Weights & Biases   |
|                    |                                                       |
|                    |-- Feature Store --> Feast / Tecton                    |
|                    |                                                       |
|                    |-- Model Serving --> Seldon / KServe                   |
|                    |                                                       |
|                    +-- Data Validation --> Great Expectations / TFX Data Val|
|                                                                            |
+----------------------------------------------------------------------------+
```

## Best Practices Summary

### ML System Design Principles

1. **Reproducibility**
   - Code version control
   - Data version control
   - Environment version control
   - Experiment parameter logging

2. **Scalability**
   - Distributed training support
   - Elastic inference services
   - Scalable feature computation

3. **Observability**
   - Comprehensive monitoring metrics
   - Log tracing
   - Alerting mechanisms

4. **Automation**
   - CI/CD pipelines
   - Automated testing
   - Automated retraining

### Common Problems and Solutions

| Problem | Cause | Solution |
|---------|-------|----------|
| Training-Serving Skew | Inconsistent feature computation | Use feature store for unified management |
| Model Performance Degradation | Data drift | Continuous monitoring, automated retraining |
| High Inference Latency | Large model/slow feature retrieval | Model compression/feature caching |
| Experiment Irreproducibility | Incomplete environment/parameter logging | Use experiment tracking tools |
| High Deployment Risk | Lack of gradual rollout mechanism | Canary deployment/A/B testing |

### Interview Key Points

**Q1: How to design a feature platform?**

Core points:
- Separate offline feature storage (data lake) and online feature storage (Redis/Cassandra)
- Feature registry to manage feature metadata
- Support batch and stream processing for feature computation
- Feature version control and lineage tracking

**Q2: How to ensure training-inference consistency?**

Solutions:
- Use feature store to unify feature definitions
- Online inference directly retrieves features from feature store
- Feature transformation logic compiled into reusable modules
- Comprehensive testing and validation mechanisms

**Q3: How to monitor model online performance?**

Monitoring dimensions:
- System metrics: latency, throughput, error rate
- Model metrics: prediction distribution, accuracy (requires labels)
- Data metrics: feature distribution, data quality
- Business metrics: conversion rate, CTR, etc.

**Q4: How to implement safe model deployment?**

Strategies:
- Canary deployment: validate with small traffic
- A/B testing: comparative experiments
- Shadow mode: parallel testing without affecting production
- Rollback mechanism: quick rollback to stable version

## Further Reading

### Recommended Books

- **"Designing Machine Learning Systems"** - Chip Huyen
- **"Machine Learning Engineering"** - Andriy Burkov
- **"Building Machine Learning Pipelines"** - Hannes Hapke

### Online Resources

- [Google ML Best Practices](https://developers.google.com/machine-learning/guides/rules-of-ml)
- [MLOps Community](https://mlops.community/)
- [Feast Feature Store Docs](https://docs.feast.dev/)
- [Kubeflow Docs](https://www.kubeflow.org/docs/)

### Open Source Projects

- **Feast**: Feature store
- **MLflow**: Experiment tracking and model management
- **Kubeflow**: Kubernetes-native ML platform
- **Seldon Core**: Model serving
- **Great Expectations**: Data quality validation

## Summary

Building enterprise-grade ML systems is a complex systems engineering task that requires comprehensive consideration of data management, feature engineering, model training, model serving, monitoring and alerting, and many other aspects. This article has detailed the design principles and implementation approaches for each component from an architectural perspective.

Core takeaways:

1. **Feature Platform is the Foundation**: Unified feature management is key to solving training-serving skew
2. **Automation is the Direction**: Moving from manual to automated MLOps reflects platform maturity
3. **Observability is the Safeguard**: Comprehensive monitoring and alerting ensures stable system operation
4. **Iterative Optimization is the Norm**: ML systems require continuous optimization and evolution

We hope this article helps readers build a comprehensive understanding of ML system architecture to design and build efficient, reliable machine learning platforms in practical work.
