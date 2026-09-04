---
title: "ML System Design: End-to-End Architecture"
description: "Design production ML systems: feature platform, training platform, inference platform, and data flywheel"
track: datascience
section: deployment
difficulty: advanced
tags:
  - ML systems
  - architecture
  - platform
  - engineering
  - MLOps
status: imported
origin: old/src/content/docs/datascience/ml-system-design.en.md
divergence: 0.222
issues:
  - missing-subcategory-zh
  - order-mismatch
  - category-casing
legacy:
  category: DataScience
  subcategory: MLSystems
  order: 41
  lastUpdated: 2026-01-07
---

Designing machine learning systems extends far beyond model training and tuning. In production environments, a complete ML system must encompass data management, feature engineering, model training, model serving, monitoring, and continuous improvement. We'll explore the architecture and design principles for building enterprise-grade machine learning platforms.

---

## ML System Overview

### End-to-End ML System Architecture

A complete machine learning system typically consists of the following core components:

```
+--------------------------------------------------------------------------------+
|                          ML System Architecture Overview                         |
+--------------------------------------------------------------------------------+
|                                                                                  |
|  +-----------+    +-----------+    +-----------+    +-----------+               |
|  |   Data    |--->|   Data    |--->|  Feature  |--->|  Training |               |
|  |  Sources  |    |  Pipeline |    |  Platform |    |  Platform |               |
|  +-----------+    +-----------+    +-----------+    +-----+-----+               |
|                                                           |                      |
|                                        +------------------+                      |
|                                        v                                         |
|  +-----------+    +-----------+    +-----------+    +-----------+               |
|  | Monitoring|<---|  Inference|<---|   Model   |<---| Model     |               |
|  | & Logging |    |  Platform |    |  Registry |    | Validation|               |
|  +-----------+    +-----------+    +-----------+    +-----------+               |
|                         |                                                        |
|                         v                                                        |
|                   +-----------+                                                  |
|                   |   Data    |-----> Back to Data Sources (Flywheel)           |
|                   |  Flywheel |                                                  |
|                   +-----------+                                                  |
|                                                                                  |
+--------------------------------------------------------------------------------+
```

### The Three Pillars of ML Systems

| Pillar | Core Responsibilities | Key Technologies |
|--------|----------------------|------------------|
| **Feature Platform** | Feature storage, computation, serving | Feature stores, real-time/batch compute |
| **Training Platform** | Model training, experiment management, hyperparameter optimization | Distributed training, AutoML, experiment tracking |
| **Inference Platform** | Model deployment, online prediction, batch inference | Model serving, A/B testing, traffic management |

### MLOps Maturity Model

Understanding your organization's MLOps maturity helps prioritize infrastructure investments:

```
Level 0: Manual Process
+-- Data scientists manually train models
+-- Manual deployment to production
+-- No automation or reproducibility

Level 1: ML Pipeline Automation
+-- Automated data processing and feature engineering
+-- Continuous Training (CT)
+-- Automated model deployment

Level 2: CI/CD Pipeline Automation
+-- Code version control
+-- Model version control
+-- Automated testing and validation
+-- Continuous Integration/Continuous Deployment

Level 3: Full MLOps Automation
+-- Automated feature engineering
+-- Automated model selection and hyperparameter tuning
+-- Automated monitoring and retraining
+-- End-to-end observability and governance
```

---

## Feature Platform

The feature platform is the backbone of any ML system, responsible for computing, storing, and serving features consistently across training and inference.

### Feature Platform Architecture

```
+------------------------------------------------------------------------------+
|                        Feature Platform Architecture                           |
+------------------------------------------------------------------------------+
|                                                                                |
|  Data Sources              Feature Computation           Feature Storage       |
|                                                                                |
|  +----------+             +----------------+           +-----------------+     |
|  |  Events  |------------>|                |           |   Offline Store |     |
|  | (Kafka)  |             |  Stream Engine |---------->|   (Data Lake)   |     |
|  +----------+             |   (Flink)      |           +-----------------+     |
|                           |                |                    |              |
|  +----------+             +----------------+                    |              |
|  |  Batch   |                    |                    +---------v---------+   |
|  |  (S3)    |---+                |                    |   Feature         |   |
|  +----------+   |         +------v-------+            |   Registry        |   |
|                 |         |              |            |   (Metadata)      |   |
|  +----------+   +-------->| Batch Engine |            +-------------------+   |
|  |  DBs     |------------>|  (Spark)     |                    |              |
|  +----------+             |              |            +---------v---------+   |
|                           +------+-------+            |   Online Store    |   |
|                                  |                    |   (Redis/DynamoDB)|   |
|                                  +-------------------->                   |   |
|                                                       +-------------------+   |
|                                                                |              |
|                   Feature Serving                              |              |
|                   +-------------------+                        |              |
|                   |   Feature Server  |<-----------------------+              |
|                   |   (REST/gRPC)     |                                       |
|                   +-------------------+                                       |
|                           |                                                   |
|             +-------------+-------------+                                     |
|             v                           v                                     |
|      Training Pipeline          Inference Service                             |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Feature Types and Computation Patterns

Features can be categorized by their computation requirements:

```
+------------------------------------------------------------------------------+
|                         Feature Computation Patterns                          |
+------------------------------------------------------------------------------+
|                                                                                |
|  Batch Features (Offline)                                                     |
|  +------------------------+                                                   |
|  | - Computed periodically (hourly/daily)                                    |
|  | - Historical aggregations                                                  |
|  | - Complex transformations                                                  |
|  | - Examples: 30-day purchase history, lifetime value                       |
|  +------------------------+                                                   |
|                                                                                |
|  Streaming Features (Near Real-time)                                          |
|  +------------------------+                                                   |
|  | - Computed from event streams                                             |
|  | - Sliding window aggregations                                             |
|  | - Sub-minute freshness                                                    |
|  | - Examples: clicks in last hour, session duration                         |
|  +------------------------+                                                   |
|                                                                                |
|  On-Demand Features (Real-time)                                               |
|  +------------------------+                                                   |
|  | - Computed at request time                                                |
|  | - Cannot be pre-computed                                                  |
|  | - Request-specific context                                                |
|  | - Examples: time since last action, current location distance             |
|  +------------------------+                                                   |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Feature Store Implementation

```python
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
import redis
import pandas as pd
from pyspark.sql import SparkSession

@dataclass
class FeatureDefinition:
    """Definition of a feature with metadata."""
    name: str
    entity: str
    dtype: str
    description: str
    tags: List[str]
    owner: str
    freshness: str  # "realtime", "hourly", "daily"
    source: str
    transformation: str

class FeaturePlatform:
    """
    Unified feature platform for ML systems.
    Provides consistent feature access for training and serving.
    """

    def __init__(
        self,
        offline_store_path: str,
        online_store_host: str,
        online_store_port: int = 6379
    ):
        self.offline_store_path = offline_store_path
        self.online_store = redis.Redis(
            host=online_store_host,
            port=online_store_port,
            decode_responses=True
        )
        self.feature_registry: Dict[str, FeatureDefinition] = {}

    def register_feature(self, definition: FeatureDefinition):
        """Register a feature definition in the catalog."""
        self.feature_registry[definition.name] = definition
        print(f"Registered feature: {definition.name}")

    def compute_batch_features(
        self,
        spark: SparkSession,
        feature_names: List[str],
        start_date: str,
        end_date: str
    ) -> pd.DataFrame:
        """
        Compute batch features for a date range.
        Used for generating training datasets.
        """
        # Load source data
        events_df = spark.read.parquet(
            f"{self.offline_store_path}/events"
        ).filter(
            f"event_date >= '{start_date}' AND event_date <= '{end_date}'"
        )

        # Compute requested features
        feature_dfs = []
        for feature_name in feature_names:
            if feature_name not in self.feature_registry:
                raise ValueError(f"Unknown feature: {feature_name}")

            definition = self.feature_registry[feature_name]
            # Apply transformation based on feature definition
            feature_df = self._apply_transformation(
                events_df, definition
            )
            feature_dfs.append(feature_df)

        # Join all features
        result = feature_dfs[0]
        for df in feature_dfs[1:]:
            result = result.join(df, on="entity_id", how="outer")

        return result.toPandas()

    def get_online_features(
        self,
        entity_type: str,
        entity_ids: List[str],
        feature_names: List[str]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Retrieve features from online store for real-time serving.
        Optimized for low latency (<10ms target).
        """
        result = {}

        # Use pipeline for batch retrieval
        pipe = self.online_store.pipeline()

        for entity_id in entity_ids:
            key = f"features:{entity_type}:{entity_id}"
            pipe.hmget(key, feature_names)

        values = pipe.execute()

        for entity_id, feature_values in zip(entity_ids, values):
            result[entity_id] = {
                name: self._parse_value(val)
                for name, val in zip(feature_names, feature_values)
            }

        return result

    def materialize_features(
        self,
        entity_type: str,
        feature_names: List[str],
        ttl_seconds: int = 86400
    ):
        """
        Materialize offline features to online store.
        Run periodically to keep online features fresh.
        """
        # Load latest features from offline store
        offline_features = pd.read_parquet(
            f"{self.offline_store_path}/{entity_type}_features/latest"
        )

        # Write to online store
        pipe = self.online_store.pipeline()

        for _, row in offline_features.iterrows():
            entity_id = row["entity_id"]
            key = f"features:{entity_type}:{entity_id}"

            feature_dict = {
                name: str(row[name])
                for name in feature_names
                if name in row
            }

            pipe.hset(key, mapping=feature_dict)
            pipe.expire(key, ttl_seconds)

        pipe.execute()
        print(f"Materialized {len(offline_features)} entities")

    def get_training_dataset(
        self,
        entity_df: pd.DataFrame,
        feature_names: List[str],
        label_column: str
    ) -> pd.DataFrame:
        """
        Generate training dataset with point-in-time correct features.
        Prevents data leakage by using features available at event time.
        """
        # Sort by timestamp for efficient point-in-time join
        entity_df = entity_df.sort_values("event_timestamp")

        # Load feature history
        feature_history = pd.read_parquet(
            f"{self.offline_store_path}/feature_history"
        )

        # Point-in-time join
        result = pd.merge_asof(
            entity_df,
            feature_history[["entity_id", "feature_timestamp"] + feature_names],
            left_on="event_timestamp",
            right_on="feature_timestamp",
            by="entity_id",
            direction="backward"
        )

        return result

    def _apply_transformation(self, df, definition: FeatureDefinition):
        """Apply transformation logic from feature definition."""
        # Implementation depends on transformation DSL
        pass

    def _parse_value(self, val: Optional[str]) -> Any:
        """Parse string value from Redis to appropriate type."""
        if val is None:
            return None
        try:
            return float(val)
        except ValueError:
            return val


# Example: Feature definitions
user_features = [
    FeatureDefinition(
        name="user_purchase_count_30d",
        entity="user",
        dtype="int64",
        description="Number of purchases in last 30 days",
        tags=["user", "engagement", "purchase"],
        owner="ml-team",
        freshness="daily",
        source="transactions",
        transformation="COUNT(*) WHERE event_type='purchase' AND event_date >= current_date - 30"
    ),
    FeatureDefinition(
        name="user_avg_order_value_30d",
        entity="user",
        dtype="float64",
        description="Average order value in last 30 days",
        tags=["user", "monetary"],
        owner="ml-team",
        freshness="daily",
        source="transactions",
        transformation="AVG(order_value) WHERE event_date >= current_date - 30"
    ),
]
```

### Feature Consistency: Training-Serving Skew

One of the most critical challenges in ML systems is ensuring feature consistency between training and serving:

```
+------------------------------------------------------------------------------+
|                     Training-Serving Skew Prevention                          |
+------------------------------------------------------------------------------+
|                                                                                |
|  Common Causes of Skew:                                                       |
|                                                                                |
|  1. Different Code Paths                                                      |
|     +------------------+          +------------------+                        |
|     |  Training Code   |   =/=    |  Serving Code    |                        |
|     |  (Python/Spark)  |          |  (Java/Go)       |                        |
|     +------------------+          +------------------+                        |
|                                                                                |
|  2. Time Travel Issues                                                        |
|     Training: Uses future data accidentally (data leakage)                   |
|     Serving: Only has past data available                                    |
|                                                                                |
|  3. Preprocessing Differences                                                 |
|     - Different normalization parameters                                      |
|     - Missing value handling inconsistencies                                  |
|     - Feature encoding mismatches                                            |
|                                                                                |
|  Solutions:                                                                    |
|                                                                                |
|  +------------------------------------------------------------------+        |
|  |                   Unified Feature Store                          |        |
|  |                                                                   |        |
|  |  Single Source of Truth for Feature Definitions                  |        |
|  |      |                                    |                       |        |
|  |      v                                    v                       |        |
|  | +------------+                    +-------------+                 |        |
|  | |  Training  |                    |   Serving   |                 |        |
|  | |  Pipeline  |                    |   Pipeline  |                 |        |
|  | +------------+                    +-------------+                 |        |
|  |                                                                   |        |
|  |  Same feature computation logic, same preprocessing              |        |
|  +------------------------------------------------------------------+        |
|                                                                                |
+------------------------------------------------------------------------------+
```

---

## Training Platform

The training platform manages the entire model development lifecycle, from experimentation to production-ready models.

### Training Platform Architecture

```
+------------------------------------------------------------------------------+
|                        Training Platform Architecture                          |
+------------------------------------------------------------------------------+
|                                                                                |
|  +-------------------+    +-------------------+    +-------------------+       |
|  |  Experiment       |    |  Training         |    |  Model            |       |
|  |  Management       |    |  Orchestration    |    |  Registry         |       |
|  +-------------------+    +-------------------+    +-------------------+       |
|         |                        |                        |                   |
|         v                        v                        v                   |
|  +----------------------------------------------------------------+          |
|  |                     Training Infrastructure                      |          |
|  |                                                                  |          |
|  |  +------------+    +------------+    +------------+             |          |
|  |  |   CPU      |    |   GPU      |    |   TPU      |             |          |
|  |  |   Cluster  |    |   Cluster  |    |   Pods     |             |          |
|  |  +------------+    +------------+    +------------+             |          |
|  |                                                                  |          |
|  |  +----------------------------------------------------------+   |          |
|  |  |           Distributed Training Framework                  |   |          |
|  |  |    (Horovod / PyTorch DDP / TensorFlow Distribution)     |   |          |
|  |  +----------------------------------------------------------+   |          |
|  +----------------------------------------------------------------+          |
|                               |                                               |
|                               v                                               |
|  +----------------------------------------------------------------+          |
|  |                     Training Pipeline                           |          |
|  |                                                                  |          |
|  |  1. Data Loading --> 2. Preprocessing --> 3. Training           |          |
|  |                                               |                  |          |
|  |  6. Deployment <-- 5. Validation <-- 4. Evaluation              |          |
|  +----------------------------------------------------------------+          |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Experiment Management

```python
import mlflow
from mlflow.tracking import MlflowClient
from typing import Dict, Any, List, Optional
import hashlib
import json
from datetime import datetime

class ExperimentManager:
    """
    Manage ML experiments with versioning, tracking, and reproducibility.
    """

    def __init__(self, tracking_uri: str, artifact_location: str):
        mlflow.set_tracking_uri(tracking_uri)
        self.client = MlflowClient()
        self.artifact_location = artifact_location

    def create_experiment(
        self,
        name: str,
        description: str,
        tags: Dict[str, str] = None
    ) -> str:
        """Create a new experiment with metadata."""
        experiment_id = mlflow.create_experiment(
            name=name,
            artifact_location=f"{self.artifact_location}/{name}",
            tags=tags or {}
        )

        # Log experiment metadata
        self.client.set_experiment_tag(
            experiment_id,
            "description",
            description
        )
        self.client.set_experiment_tag(
            experiment_id,
            "created_at",
            datetime.now().isoformat()
        )

        return experiment_id

    def start_run(
        self,
        experiment_name: str,
        run_name: str,
        params: Dict[str, Any],
        tags: Dict[str, str] = None
    ):
        """
        Start a new training run with automatic parameter logging.
        """
        mlflow.set_experiment(experiment_name)

        # Create reproducibility hash
        config_hash = hashlib.sha256(
            json.dumps(params, sort_keys=True).encode()
        ).hexdigest()[:8]

        with mlflow.start_run(run_name=run_name) as run:
            # Log parameters
            mlflow.log_params(params)

            # Log tags
            mlflow.set_tag("config_hash", config_hash)
            if tags:
                for key, value in tags.items():
                    mlflow.set_tag(key, value)

            return run.info.run_id

    def log_metrics(self, metrics: Dict[str, float], step: int = None):
        """Log metrics for current run."""
        for name, value in metrics.items():
            mlflow.log_metric(name, value, step=step)

    def log_model(
        self,
        model,
        artifact_path: str,
        signature=None,
        input_example=None
    ):
        """Log trained model with signature."""
        mlflow.pytorch.log_model(
            model,
            artifact_path,
            signature=signature,
            input_example=input_example
        )

    def compare_runs(
        self,
        experiment_name: str,
        metric_name: str,
        top_k: int = 5
    ) -> List[Dict]:
        """Compare runs by a specific metric."""
        experiment = mlflow.get_experiment_by_name(experiment_name)

        runs = self.client.search_runs(
            experiment_ids=[experiment.experiment_id],
            order_by=[f"metrics.{metric_name} DESC"],
            max_results=top_k
        )

        comparisons = []
        for run in runs:
            comparisons.append({
                "run_id": run.info.run_id,
                "run_name": run.info.run_name,
                metric_name: run.data.metrics.get(metric_name),
                "params": run.data.params,
                "start_time": run.info.start_time
            })

        return comparisons


class TrainingPipeline:
    """
    End-to-end training pipeline with best practices.
    """

    def __init__(
        self,
        experiment_manager: ExperimentManager,
        feature_platform,  # FeaturePlatform instance
        model_registry  # ModelRegistry instance
    ):
        self.experiment_manager = experiment_manager
        self.feature_platform = feature_platform
        self.model_registry = model_registry

    def run_training_job(
        self,
        model_config: Dict[str, Any],
        training_config: Dict[str, Any],
        data_config: Dict[str, Any]
    ) -> str:
        """
        Execute complete training pipeline.

        Returns:
            Model version ID in registry
        """
        # 1. Prepare training data
        print("Step 1: Preparing training data...")
        train_df, val_df, test_df = self._prepare_data(data_config)

        # 2. Start experiment tracking
        print("Step 2: Starting experiment...")
        run_id = self.experiment_manager.start_run(
            experiment_name=training_config["experiment_name"],
            run_name=training_config["run_name"],
            params={**model_config, **training_config, **data_config}
        )

        try:
            # 3. Train model
            print("Step 3: Training model...")
            model = self._train_model(
                train_df, val_df,
                model_config, training_config
            )

            # 4. Evaluate model
            print("Step 4: Evaluating model...")
            metrics = self._evaluate_model(model, test_df)
            self.experiment_manager.log_metrics(metrics)

            # 5. Validate model quality
            print("Step 5: Validating model...")
            validation_passed = self._validate_model(metrics, training_config)

            if not validation_passed:
                raise ValueError("Model validation failed")

            # 6. Register model
            print("Step 6: Registering model...")
            model_version = self.model_registry.register_model(
                model=model,
                model_name=training_config["model_name"],
                metrics=metrics,
                config=model_config
            )

            return model_version

        except Exception as e:
            mlflow.set_tag("status", "failed")
            mlflow.set_tag("error", str(e))
            raise

    def _prepare_data(self, data_config: Dict) -> tuple:
        """Prepare train/val/test splits with features."""
        # Get training dataset from feature platform
        entity_df = self._load_entity_data(data_config)

        full_df = self.feature_platform.get_training_dataset(
            entity_df=entity_df,
            feature_names=data_config["feature_names"],
            label_column=data_config["label_column"]
        )

        # Split data
        train_df = full_df[full_df["split"] == "train"]
        val_df = full_df[full_df["split"] == "val"]
        test_df = full_df[full_df["split"] == "test"]

        return train_df, val_df, test_df

    def _train_model(self, train_df, val_df, model_config, training_config):
        """Train model with early stopping and checkpointing."""
        # Implementation depends on framework
        pass

    def _evaluate_model(self, model, test_df) -> Dict[str, float]:
        """Evaluate model on test set."""
        # Implementation depends on task type
        pass

    def _validate_model(self, metrics: Dict, config: Dict) -> bool:
        """Validate model meets quality thresholds."""
        thresholds = config.get("quality_thresholds", {})

        for metric_name, threshold in thresholds.items():
            if metric_name in metrics:
                if metrics[metric_name] < threshold:
                    print(f"Validation failed: {metric_name}={metrics[metric_name]} < {threshold}")
                    return False

        return True

    def _load_entity_data(self, data_config: Dict):
        """Load entity data for training."""
        pass
```

### Distributed Training Architecture

```
+------------------------------------------------------------------------------+
|                      Distributed Training Patterns                            |
+------------------------------------------------------------------------------+
|                                                                                |
|  Data Parallelism (Most Common)                                               |
|  +----------------------------------------------------------------------+    |
|  |                                                                       |    |
|  |  +----------+    +----------+    +----------+    +----------+        |    |
|  |  | Worker 0 |    | Worker 1 |    | Worker 2 |    | Worker 3 |        |    |
|  |  | Data[0]  |    | Data[1]  |    | Data[2]  |    | Data[3]  |        |    |
|  |  | Model    |    | Model    |    | Model    |    | Model    |        |    |
|  |  | Copy     |    | Copy     |    | Copy     |    | Copy     |        |    |
|  |  +----+-----+    +----+-----+    +----+-----+    +----+-----+        |    |
|  |       |              |              |              |                  |    |
|  |       +------+-------+-------+------+              |                  |    |
|  |              |               |                     |                  |    |
|  |              v               v                     v                  |    |
|  |         +--------+      Gradient Synchronization      +--------+     |    |
|  |         | AllReduce (Ring, Tree, or Hierarchical)    |         |     |    |
|  |         +--------------------------------------------+         |     |    |
|  |                                                                       |    |
|  +----------------------------------------------------------------------+    |
|                                                                                |
|  Model Parallelism (Large Models)                                             |
|  +----------------------------------------------------------------------+    |
|  |                                                                       |    |
|  |  +----------+    +----------+    +----------+    +----------+        |    |
|  |  | GPU 0    |    | GPU 1    |    | GPU 2    |    | GPU 3    |        |    |
|  |  | Layer    |--->| Layer    |--->| Layer    |--->| Layer    |        |    |
|  |  | 1-4      |    | 5-8      |    | 9-12     |    | 13-16    |        |    |
|  |  +----------+    +----------+    +----------+    +----------+        |    |
|  |                                                                       |    |
|  |  Pipeline Parallelism: Micro-batches flow through stages             |    |
|  +----------------------------------------------------------------------+    |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Hyperparameter Optimization

```python
import optuna
from optuna.integration import MLflowCallback
from typing import Dict, Any, Callable
import numpy as np

class HyperparameterOptimizer:
    """
    Hyperparameter optimization with Optuna integration.
    """

    def __init__(
        self,
        study_name: str,
        storage_url: str,
        direction: str = "maximize"
    ):
        self.study = optuna.create_study(
            study_name=study_name,
            storage=storage_url,
            direction=direction,
            load_if_exists=True
        )

    def define_search_space(
        self,
        trial: optuna.Trial,
        search_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Define hyperparameter search space from configuration.
        """
        params = {}

        for param_name, param_config in search_config.items():
            param_type = param_config["type"]

            if param_type == "int":
                params[param_name] = trial.suggest_int(
                    param_name,
                    param_config["low"],
                    param_config["high"],
                    log=param_config.get("log", False)
                )
            elif param_type == "float":
                params[param_name] = trial.suggest_float(
                    param_name,
                    param_config["low"],
                    param_config["high"],
                    log=param_config.get("log", False)
                )
            elif param_type == "categorical":
                params[param_name] = trial.suggest_categorical(
                    param_name,
                    param_config["choices"]
                )

        return params

    def optimize(
        self,
        objective_fn: Callable,
        search_config: Dict[str, Any],
        n_trials: int = 100,
        timeout: int = None,
        n_jobs: int = 1
    ) -> Dict[str, Any]:
        """
        Run hyperparameter optimization.

        Args:
            objective_fn: Function that takes params dict and returns metric
            search_config: Search space configuration
            n_trials: Number of trials
            timeout: Maximum time in seconds
            n_jobs: Number of parallel jobs

        Returns:
            Best parameters found
        """
        def wrapped_objective(trial):
            params = self.define_search_space(trial, search_config)
            return objective_fn(params)

        self.study.optimize(
            wrapped_objective,
            n_trials=n_trials,
            timeout=timeout,
            n_jobs=n_jobs,
            callbacks=[MLflowCallback(
                tracking_uri=mlflow.get_tracking_uri(),
                metric_name="objective_value"
            )]
        )

        return self.study.best_params

    def get_optimization_history(self) -> Dict:
        """Get optimization history and statistics."""
        return {
            "best_value": self.study.best_value,
            "best_params": self.study.best_params,
            "n_trials": len(self.study.trials),
            "best_trial": self.study.best_trial.number,
            "param_importances": optuna.importance.get_param_importances(self.study)
        }


# Example search configuration
search_config = {
    "learning_rate": {
        "type": "float",
        "low": 1e-5,
        "high": 1e-2,
        "log": True
    },
    "batch_size": {
        "type": "categorical",
        "choices": [32, 64, 128, 256]
    },
    "num_layers": {
        "type": "int",
        "low": 2,
        "high": 8
    },
    "hidden_dim": {
        "type": "int",
        "low": 64,
        "high": 512,
        "log": True
    },
    "dropout": {
        "type": "float",
        "low": 0.0,
        "high": 0.5
    }
}
```

---

## Inference Platform

The inference platform handles model deployment, serving, and real-time predictions at scale.

### Inference Platform Architecture

```
+------------------------------------------------------------------------------+
|                        Inference Platform Architecture                         |
+------------------------------------------------------------------------------+
|                                                                                |
|                            Traffic Management Layer                            |
|  +----------------------------------------------------------------------+    |
|  |  +----------+    +------------+    +-----------+    +------------+   |    |
|  |  |   Load   |    |   Rate     |    |   A/B     |    |  Circuit   |   |    |
|  |  | Balancer |    |  Limiter   |    |  Router   |    |  Breaker   |   |    |
|  |  +----------+    +------------+    +-----------+    +------------+   |    |
|  +----------------------------------------------------------------------+    |
|                                     |                                         |
|                                     v                                         |
|                            Model Serving Layer                                |
|  +----------------------------------------------------------------------+    |
|  |                                                                       |    |
|  |  +------------------+  +------------------+  +------------------+     |    |
|  |  |  Model Server A  |  |  Model Server B  |  |  Model Server C  |     |    |
|  |  |  (Version 1.0)   |  |  (Version 1.1)   |  |  (Challenger)    |     |    |
|  |  |                  |  |                  |  |                  |     |    |
|  |  |  +------------+  |  |  +------------+  |  |  +------------+  |     |    |
|  |  |  |   Model    |  |  |  |   Model    |  |  |  |   Model    |  |     |    |
|  |  |  +------------+  |  |  +------------+  |  |  +------------+  |     |    |
|  |  |  | Preprocess |  |  |  | Preprocess |  |  |  | Preprocess |  |     |    |
|  |  |  +------------+  |  |  +------------+  |  |  +------------+  |     |    |
|  |  |  | Postprocess|  |  |  | Postprocess|  |  |  | Postprocess|  |     |    |
|  |  |  +------------+  |  |  +------------+  |  |  +------------+  |     |    |
|  |  +------------------+  +------------------+  +------------------+     |    |
|  |           |                    |                    |                 |    |
|  +----------------------------------------------------------------------+    |
|              |                    |                    |                      |
|              +--------------------+--------------------+                      |
|                                   |                                           |
|                                   v                                           |
|                            Infrastructure Layer                               |
|  +----------------------------------------------------------------------+    |
|  |  +------------+  +------------+  +------------+  +------------+      |    |
|  |  |   GPU      |  |   Cache    |  |  Feature   |  |  Logging/  |      |    |
|  |  |   Pool     |  |   Layer    |  |  Service   |  |  Metrics   |      |    |
|  |  +------------+  +------------+  +------------+  +------------+      |    |
|  +----------------------------------------------------------------------+    |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Model Serving Implementation

```python
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import time
import asyncio
from concurrent.futures import ThreadPoolExecutor
import numpy as np

@dataclass
class PredictionRequest:
    request_id: str
    model_name: str
    model_version: Optional[str]
    features: Dict[str, Any]
    metadata: Dict[str, Any]

@dataclass
class PredictionResponse:
    request_id: str
    predictions: Any
    model_version: str
    latency_ms: float
    metadata: Dict[str, Any]

class InferencePlatform:
    """
    Production inference platform with caching, batching, and monitoring.
    """

    def __init__(
        self,
        model_registry,
        feature_platform,
        cache_client,
        metrics_client
    ):
        self.model_registry = model_registry
        self.feature_platform = feature_platform
        self.cache = cache_client
        self.metrics = metrics_client

        # Model cache
        self.loaded_models: Dict[str, Any] = {}

        # Request batching
        self.batch_queue: Dict[str, List] = {}
        self.batch_size = 32
        self.max_batch_wait_ms = 10

        # Thread pool for async operations
        self.executor = ThreadPoolExecutor(max_workers=10)

    async def predict(
        self,
        request: PredictionRequest
    ) -> PredictionResponse:
        """
        Handle prediction request with full serving pipeline.
        """
        start_time = time.time()

        try:
            # 1. Check cache
            cache_key = self._get_cache_key(request)
            cached_result = await self._check_cache(cache_key)
            if cached_result:
                self.metrics.increment("cache_hits", tags={"model": request.model_name})
                return cached_result

            # 2. Get features
            features = await self._get_features(request)

            # 3. Get model
            model, model_version = await self._get_model(
                request.model_name,
                request.model_version
            )

            # 4. Preprocess
            processed_features = self._preprocess(features, model_version)

            # 5. Run inference
            raw_predictions = await self._run_inference(
                model, processed_features
            )

            # 6. Postprocess
            predictions = self._postprocess(raw_predictions, model_version)

            # 7. Build response
            latency_ms = (time.time() - start_time) * 1000

            response = PredictionResponse(
                request_id=request.request_id,
                predictions=predictions,
                model_version=model_version,
                latency_ms=latency_ms,
                metadata={"cached": False}
            )

            # 8. Cache result
            await self._cache_result(cache_key, response)

            # 9. Log metrics
            self._log_metrics(request, response)

            return response

        except Exception as e:
            self.metrics.increment(
                "prediction_errors",
                tags={"model": request.model_name, "error": type(e).__name__}
            )
            raise

    async def predict_batch(
        self,
        requests: List[PredictionRequest]
    ) -> List[PredictionResponse]:
        """
        Handle batch prediction requests efficiently.
        """
        # Group by model
        by_model: Dict[str, List[PredictionRequest]] = {}
        for req in requests:
            key = f"{req.model_name}:{req.model_version or 'latest'}"
            if key not in by_model:
                by_model[key] = []
            by_model[key].append(req)

        # Process each model group
        all_responses = []
        for model_key, model_requests in by_model.items():
            responses = await self._batch_predict_for_model(
                model_requests
            )
            all_responses.extend(responses)

        # Restore original order
        response_map = {r.request_id: r for r in all_responses}
        return [response_map[req.request_id] for req in requests]

    async def _get_model(
        self,
        model_name: str,
        model_version: Optional[str]
    ) -> tuple:
        """Load model from cache or registry."""
        cache_key = f"{model_name}:{model_version or 'latest'}"

        if cache_key not in self.loaded_models:
            # Load from registry
            model, version = await asyncio.get_event_loop().run_in_executor(
                self.executor,
                self.model_registry.load_model,
                model_name,
                model_version
            )
            self.loaded_models[cache_key] = (model, version)

        return self.loaded_models[cache_key]

    async def _get_features(
        self,
        request: PredictionRequest
    ) -> Dict[str, Any]:
        """Retrieve features from feature platform."""
        # Merge request features with stored features
        if "entity_id" in request.features:
            stored_features = await asyncio.get_event_loop().run_in_executor(
                self.executor,
                self.feature_platform.get_online_features,
                request.features["entity_type"],
                [request.features["entity_id"]],
                request.metadata.get("feature_names", [])
            )

            # Merge with request features (request takes precedence)
            features = stored_features.get(request.features["entity_id"], {})
            features.update(request.features)
            return features

        return request.features

    async def _run_inference(
        self,
        model,
        features: np.ndarray
    ) -> np.ndarray:
        """Run model inference."""
        return await asyncio.get_event_loop().run_in_executor(
            self.executor,
            model.predict,
            features
        )

    def _preprocess(
        self,
        features: Dict[str, Any],
        model_version: str
    ) -> np.ndarray:
        """Preprocess features for model input."""
        # Get preprocessing config for model version
        # Apply transformations
        pass

    def _postprocess(
        self,
        predictions: np.ndarray,
        model_version: str
    ) -> Any:
        """Postprocess model output."""
        # Apply inverse transformations
        # Format for response
        pass

    async def _check_cache(self, key: str) -> Optional[PredictionResponse]:
        """Check prediction cache."""
        pass

    async def _cache_result(self, key: str, response: PredictionResponse):
        """Cache prediction result."""
        pass

    def _get_cache_key(self, request: PredictionRequest) -> str:
        """Generate cache key for request."""
        import hashlib
        import json

        key_data = {
            "model": request.model_name,
            "version": request.model_version,
            "features": request.features
        }

        return hashlib.sha256(
            json.dumps(key_data, sort_keys=True).encode()
        ).hexdigest()

    def _log_metrics(
        self,
        request: PredictionRequest,
        response: PredictionResponse
    ):
        """Log prediction metrics."""
        self.metrics.histogram(
            "prediction_latency_ms",
            response.latency_ms,
            tags={
                "model": request.model_name,
                "version": response.model_version
            }
        )
        self.metrics.increment(
            "predictions_total",
            tags={"model": request.model_name}
        )
```

### A/B Testing and Traffic Management

```
+------------------------------------------------------------------------------+
|                        A/B Testing Architecture                               |
+------------------------------------------------------------------------------+
|                                                                                |
|                              Request Router                                    |
|  +----------------------------------------------------------------------+    |
|  |                                                                       |    |
|  |                    Traffic Allocation Rules                          |    |
|  |  +------------------------+  +------------------------+              |    |
|  |  | Model A (Control)      |  | Model B (Treatment)    |              |    |
|  |  | Traffic: 80%           |  | Traffic: 20%           |              |    |
|  |  +------------------------+  +------------------------+              |    |
|  |                                                                       |    |
|  |  Routing Strategies:                                                  |    |
|  |  - Random: Each request randomly assigned                            |    |
|  |  - Sticky: User consistently sees same variant                       |    |
|  |  - Feature-based: Route by user segment                              |    |
|  |                                                                       |    |
|  +----------------------------------------------------------------------+    |
|                                     |                                         |
|                                     v                                         |
|                          Metrics Collection                                   |
|  +----------------------------------------------------------------------+    |
|  |                                                                       |    |
|  |  Business Metrics:        Technical Metrics:                         |    |
|  |  - Conversion rate        - Latency (p50, p95, p99)                 |    |
|  |  - Revenue per user       - Error rate                               |    |
|  |  - Engagement score       - Throughput                               |    |
|  |  - User satisfaction      - Resource utilization                     |    |
|  |                                                                       |    |
|  +----------------------------------------------------------------------+    |
|                                     |                                         |
|                                     v                                         |
|                        Statistical Analysis                                   |
|  +----------------------------------------------------------------------+    |
|  |                                                                       |    |
|  |  Hypothesis Testing:                                                  |    |
|  |  H0: Model B performance <= Model A performance                      |    |
|  |  H1: Model B performance > Model A performance                       |    |
|  |                                                                       |    |
|  |  Statistical Power: Minimum sample size for reliable conclusions     |    |
|  |  Confidence Level: 95% (p-value < 0.05)                             |    |
|  |                                                                       |    |
|  +----------------------------------------------------------------------+    |
|                                                                                |
+------------------------------------------------------------------------------+
```

```python
import numpy as np
from scipy import stats
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import hashlib

@dataclass
class ExperimentConfig:
    name: str
    control_model: str
    treatment_model: str
    traffic_split: float  # Percentage to treatment
    primary_metric: str
    secondary_metrics: List[str]
    min_sample_size: int
    confidence_level: float = 0.95

class ABTestingService:
    """
    A/B testing service for model comparison.
    """

    def __init__(self):
        self.experiments: Dict[str, ExperimentConfig] = {}
        self.metrics_store: Dict[str, List[Dict]] = {}

    def create_experiment(self, config: ExperimentConfig):
        """Create a new A/B test experiment."""
        self.experiments[config.name] = config
        self.metrics_store[config.name] = []

    def route_request(
        self,
        experiment_name: str,
        user_id: str
    ) -> Tuple[str, str]:
        """
        Route request to model variant.
        Uses consistent hashing for sticky sessions.

        Returns:
            Tuple of (model_name, variant_name)
        """
        if experiment_name not in self.experiments:
            raise ValueError(f"Unknown experiment: {experiment_name}")

        config = self.experiments[experiment_name]

        # Consistent hashing for user assignment
        hash_value = int(hashlib.sha256(
            f"{experiment_name}:{user_id}".encode()
        ).hexdigest(), 16)

        bucket = hash_value % 100

        if bucket < config.traffic_split * 100:
            return config.treatment_model, "treatment"
        else:
            return config.control_model, "control"

    def record_outcome(
        self,
        experiment_name: str,
        user_id: str,
        variant: str,
        metrics: Dict[str, float]
    ):
        """Record experiment outcome for a user."""
        self.metrics_store[experiment_name].append({
            "user_id": user_id,
            "variant": variant,
            "metrics": metrics,
            "timestamp": time.time()
        })

    def analyze_experiment(
        self,
        experiment_name: str
    ) -> Dict[str, Any]:
        """
        Perform statistical analysis of experiment results.
        """
        if experiment_name not in self.experiments:
            raise ValueError(f"Unknown experiment: {experiment_name}")

        config = self.experiments[experiment_name]
        outcomes = self.metrics_store[experiment_name]

        # Split by variant
        control_outcomes = [
            o for o in outcomes if o["variant"] == "control"
        ]
        treatment_outcomes = [
            o for o in outcomes if o["variant"] == "treatment"
        ]

        # Extract primary metric
        control_values = [
            o["metrics"][config.primary_metric]
            for o in control_outcomes
        ]
        treatment_values = [
            o["metrics"][config.primary_metric]
            for o in treatment_outcomes
        ]

        # Statistical tests
        results = {
            "experiment_name": experiment_name,
            "sample_sizes": {
                "control": len(control_values),
                "treatment": len(treatment_values)
            },
            "means": {
                "control": np.mean(control_values),
                "treatment": np.mean(treatment_values)
            },
            "std": {
                "control": np.std(control_values),
                "treatment": np.std(treatment_values)
            }
        }

        # Welch's t-test
        if len(control_values) >= 30 and len(treatment_values) >= 30:
            t_stat, p_value = stats.ttest_ind(
                treatment_values,
                control_values,
                equal_var=False
            )

            results["statistical_test"] = {
                "test": "welch_t_test",
                "t_statistic": t_stat,
                "p_value": p_value,
                "significant": p_value < (1 - config.confidence_level),
                "lift": (
                    (results["means"]["treatment"] - results["means"]["control"])
                    / results["means"]["control"]
                    * 100
                )
            }

        # Check if we have enough samples
        results["sufficient_samples"] = (
            len(control_values) >= config.min_sample_size
            and len(treatment_values) >= config.min_sample_size
        )

        return results

    def calculate_required_sample_size(
        self,
        baseline_rate: float,
        minimum_detectable_effect: float,
        alpha: float = 0.05,
        power: float = 0.8
    ) -> int:
        """
        Calculate required sample size per variant.

        Args:
            baseline_rate: Expected conversion rate of control
            minimum_detectable_effect: Minimum relative lift to detect
            alpha: Significance level (Type I error rate)
            power: Statistical power (1 - Type II error rate)
        """
        # Effect size
        p1 = baseline_rate
        p2 = baseline_rate * (1 + minimum_detectable_effect)

        pooled_p = (p1 + p2) / 2

        # Cohen's h for proportions
        h = 2 * (np.arcsin(np.sqrt(p2)) - np.arcsin(np.sqrt(p1)))

        # Z-scores
        z_alpha = stats.norm.ppf(1 - alpha / 2)
        z_beta = stats.norm.ppf(power)

        # Sample size per group
        n = 2 * ((z_alpha + z_beta) / h) ** 2

        return int(np.ceil(n))
```

---

## Data Flywheel

The data flywheel is a virtuous cycle where production data continuously improves model performance.

### Data Flywheel Architecture

```
+------------------------------------------------------------------------------+
|                           Data Flywheel Architecture                          |
+------------------------------------------------------------------------------+
|                                                                                |
|                          The Flywheel Cycle                                   |
|                                                                                |
|                    +------------------+                                        |
|                    |                  |                                        |
|           +------->|  Model Training  |--------+                              |
|           |        |                  |        |                              |
|           |        +------------------+        |                              |
|           |                                    v                              |
|   +-------+--------+                  +--------+-------+                      |
|   |                |                  |                |                      |
|   | Data Labeling  |                  | Model Serving  |                      |
|   |                |                  |                |                      |
|   +-------+--------+                  +--------+-------+                      |
|           ^                                    |                              |
|           |        +------------------+        |                              |
|           |        |                  |        |                              |
|           +--------| Data Collection  |<-------+                              |
|                    |                  |                                        |
|                    +------------------+                                        |
|                                                                                |
|  Each cycle:                                                                   |
|  1. Model serves predictions in production                                    |
|  2. User interactions generate new data                                       |
|  3. New data is collected and labeled                                        |
|  4. Model is retrained on expanded dataset                                   |
|  5. Improved model deployed, repeat                                          |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Feedback Loop Implementation

```python
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
import json

@dataclass
class PredictionFeedback:
    prediction_id: str
    model_name: str
    model_version: str
    features: Dict[str, Any]
    prediction: Any
    ground_truth: Optional[Any]
    feedback_type: str  # "explicit", "implicit", "delayed"
    feedback_timestamp: datetime
    user_id: Optional[str]
    metadata: Dict[str, Any]

class DataFlywheel:
    """
    Data flywheel for continuous model improvement.
    """

    def __init__(
        self,
        feedback_store,
        label_queue,
        training_trigger,
        metrics_client
    ):
        self.feedback_store = feedback_store
        self.label_queue = label_queue
        self.training_trigger = training_trigger
        self.metrics = metrics_client

    async def collect_prediction(
        self,
        prediction_id: str,
        model_name: str,
        model_version: str,
        features: Dict[str, Any],
        prediction: Any,
        user_id: Optional[str] = None
    ):
        """
        Log prediction for feedback collection.
        """
        await self.feedback_store.save_prediction({
            "prediction_id": prediction_id,
            "model_name": model_name,
            "model_version": model_version,
            "features": features,
            "prediction": prediction,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat(),
            "ground_truth": None,
            "feedback_collected": False
        })

    async def collect_feedback(
        self,
        prediction_id: str,
        feedback_type: str,
        ground_truth: Any = None,
        feedback_signal: float = None,
        metadata: Dict[str, Any] = None
    ):
        """
        Collect feedback for a prediction.

        Feedback types:
        - explicit: User explicitly labels (correct/incorrect)
        - implicit: Inferred from user behavior (click, purchase)
        - delayed: Ground truth available later (e.g., churn after 30 days)
        """
        # Retrieve prediction
        prediction = await self.feedback_store.get_prediction(prediction_id)

        if prediction is None:
            raise ValueError(f"Prediction not found: {prediction_id}")

        # Update with feedback
        feedback = PredictionFeedback(
            prediction_id=prediction_id,
            model_name=prediction["model_name"],
            model_version=prediction["model_version"],
            features=prediction["features"],
            prediction=prediction["prediction"],
            ground_truth=ground_truth,
            feedback_type=feedback_type,
            feedback_timestamp=datetime.utcnow(),
            user_id=prediction.get("user_id"),
            metadata=metadata or {}
        )

        await self.feedback_store.update_feedback(feedback)

        # Log metrics
        self._log_feedback_metrics(feedback)

        # Queue for labeling if needed
        if feedback_type == "implicit" and ground_truth is None:
            await self._queue_for_labeling(feedback)

    async def _queue_for_labeling(self, feedback: PredictionFeedback):
        """Queue ambiguous cases for human labeling."""
        # Prioritize based on uncertainty or business value
        priority = self._calculate_labeling_priority(feedback)

        await self.label_queue.add({
            "prediction_id": feedback.prediction_id,
            "features": feedback.features,
            "prediction": feedback.prediction,
            "priority": priority,
            "created_at": datetime.utcnow().isoformat()
        })

    def _calculate_labeling_priority(
        self,
        feedback: PredictionFeedback
    ) -> float:
        """
        Calculate priority score for human labeling.
        Higher scores = higher priority.
        """
        priority = 0.0

        # Prioritize uncertain predictions
        if "prediction_confidence" in feedback.metadata:
            confidence = feedback.metadata["prediction_confidence"]
            # Low confidence -> high priority
            priority += (1 - confidence) * 0.4

        # Prioritize edge cases
        if "is_edge_case" in feedback.metadata:
            priority += 0.3 if feedback.metadata["is_edge_case"] else 0

        # Prioritize high-value users
        if "user_value" in feedback.metadata:
            priority += min(feedback.metadata["user_value"] / 1000, 0.3)

        return priority

    async def generate_training_dataset(
        self,
        model_name: str,
        start_date: datetime,
        end_date: datetime,
        min_confidence: float = 0.8
    ) -> str:
        """
        Generate training dataset from collected feedback.

        Returns:
            Path to generated dataset
        """
        # Query feedback with ground truth
        feedbacks = await self.feedback_store.query_feedback(
            model_name=model_name,
            start_date=start_date,
            end_date=end_date,
            has_ground_truth=True
        )

        # Filter by label confidence
        high_quality_feedbacks = [
            f for f in feedbacks
            if self._get_label_confidence(f) >= min_confidence
        ]

        # Generate dataset
        dataset = {
            "features": [f.features for f in high_quality_feedbacks],
            "labels": [f.ground_truth for f in high_quality_feedbacks],
            "weights": [
                self._calculate_sample_weight(f)
                for f in high_quality_feedbacks
            ],
            "metadata": {
                "model_name": model_name,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "num_samples": len(high_quality_feedbacks),
                "generated_at": datetime.utcnow().isoformat()
            }
        }

        # Save dataset
        dataset_path = await self.feedback_store.save_dataset(dataset)

        return dataset_path

    def _get_label_confidence(self, feedback: PredictionFeedback) -> float:
        """Get confidence score for a label."""
        if feedback.feedback_type == "explicit":
            return 1.0  # Human labeled
        elif feedback.feedback_type == "delayed":
            return 0.95  # Ground truth verified
        else:
            return feedback.metadata.get("label_confidence", 0.7)

    def _calculate_sample_weight(
        self,
        feedback: PredictionFeedback
    ) -> float:
        """Calculate importance weight for training sample."""
        weight = 1.0

        # Recent samples weighted higher
        age_days = (datetime.utcnow() - feedback.feedback_timestamp).days
        recency_weight = max(0.5, 1 - age_days / 365)
        weight *= recency_weight

        # Correct predictions of rare classes weighted higher
        if "class_frequency" in feedback.metadata:
            freq = feedback.metadata["class_frequency"]
            weight *= 1 / (freq + 0.1)

        return weight

    def _log_feedback_metrics(self, feedback: PredictionFeedback):
        """Log feedback collection metrics."""
        self.metrics.increment(
            "feedback_collected",
            tags={
                "model": feedback.model_name,
                "type": feedback.feedback_type
            }
        )

        # Calculate prediction accuracy if ground truth available
        if feedback.ground_truth is not None:
            is_correct = feedback.prediction == feedback.ground_truth
            self.metrics.increment(
                "prediction_correct" if is_correct else "prediction_incorrect",
                tags={"model": feedback.model_name}
            )


class AutomaticRetraining:
    """
    Automatic retraining trigger based on data flywheel metrics.
    """

    def __init__(
        self,
        flywheel: DataFlywheel,
        training_pipeline,
        config: Dict[str, Any]
    ):
        self.flywheel = flywheel
        self.training_pipeline = training_pipeline
        self.config = config

    async def check_retraining_criteria(
        self,
        model_name: str
    ) -> Dict[str, Any]:
        """
        Check if model should be retrained.
        """
        criteria_results = {}

        # Criterion 1: Performance degradation
        current_metrics = await self._get_current_metrics(model_name)
        baseline_metrics = await self._get_baseline_metrics(model_name)

        degradation = (
            baseline_metrics["accuracy"] - current_metrics["accuracy"]
        ) / baseline_metrics["accuracy"]

        criteria_results["performance_degradation"] = {
            "current": current_metrics["accuracy"],
            "baseline": baseline_metrics["accuracy"],
            "degradation": degradation,
            "threshold": self.config["degradation_threshold"],
            "triggered": degradation > self.config["degradation_threshold"]
        }

        # Criterion 2: Data drift detected
        drift_score = await self._calculate_drift_score(model_name)
        criteria_results["data_drift"] = {
            "drift_score": drift_score,
            "threshold": self.config["drift_threshold"],
            "triggered": drift_score > self.config["drift_threshold"]
        }

        # Criterion 3: New labeled data available
        new_samples = await self._count_new_labeled_samples(model_name)
        criteria_results["new_data"] = {
            "new_samples": new_samples,
            "threshold": self.config["min_new_samples"],
            "triggered": new_samples > self.config["min_new_samples"]
        }

        # Criterion 4: Time since last training
        last_training = await self._get_last_training_time(model_name)
        days_since_training = (datetime.utcnow() - last_training).days

        criteria_results["time_based"] = {
            "days_since_training": days_since_training,
            "threshold_days": self.config["max_days_between_training"],
            "triggered": days_since_training > self.config["max_days_between_training"]
        }

        # Overall decision
        should_retrain = any(
            c["triggered"] for c in criteria_results.values()
        )

        return {
            "should_retrain": should_retrain,
            "criteria": criteria_results
        }

    async def trigger_retraining(
        self,
        model_name: str,
        reason: str
    ):
        """Trigger automatic retraining."""
        # Generate new training dataset
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=90)

        dataset_path = await self.flywheel.generate_training_dataset(
            model_name=model_name,
            start_date=start_date,
            end_date=end_date
        )

        # Submit training job
        job_id = await self.training_pipeline.submit_job(
            model_name=model_name,
            dataset_path=dataset_path,
            config={
                "trigger": "automatic",
                "reason": reason
            }
        )

        return job_id
```

### Active Learning Integration

```
+------------------------------------------------------------------------------+
|                        Active Learning Pipeline                               |
+------------------------------------------------------------------------------+
|                                                                                |
|                         Uncertainty Sampling                                   |
|  +----------------------------------------------------------------------+    |
|  |                                                                       |    |
|  |  Production Predictions                                              |    |
|  |         |                                                            |    |
|  |         v                                                            |    |
|  |  +------------------+                                                |    |
|  |  | Uncertainty      |---> Low confidence predictions                 |    |
|  |  | Calculation      |     selected for labeling                      |    |
|  |  +------------------+                                                |    |
|  |                                                                       |    |
|  |  Selection Strategies:                                               |    |
|  |  - Least Confidence: min(max(p(y|x)))                               |    |
|  |  - Margin Sampling: min(p(y1|x) - p(y2|x))                          |    |
|  |  - Entropy: max(H(p(y|x)))                                          |    |
|  |                                                                       |    |
|  +----------------------------------------------------------------------+    |
|                                     |                                         |
|                                     v                                         |
|  +----------------------------------------------------------------------+    |
|  |                     Human-in-the-Loop                                |    |
|  |                                                                       |    |
|  |  +--------------+    +---------------+    +----------------+         |    |
|  |  | Labeling     |--->| Quality       |--->| Dataset        |         |    |
|  |  | Interface    |    | Assurance     |    | Integration    |         |    |
|  |  +--------------+    +---------------+    +----------------+         |    |
|  |                                                                       |    |
|  +----------------------------------------------------------------------+    |
|                                                                                |
+------------------------------------------------------------------------------+
```

---

## System Integration Patterns

### End-to-End ML Pipeline

```
+------------------------------------------------------------------------------+
|                        End-to-End ML Pipeline                                 |
+------------------------------------------------------------------------------+
|                                                                                |
|  +-----------+    +-----------+    +-----------+    +-----------+            |
|  |  Data     |    |  Feature  |    |  Model    |    |  Model    |            |
|  |  Ingestion|--->|  Pipeline |--->|  Training |--->|  Validation|           |
|  +-----------+    +-----------+    +-----------+    +-----------+            |
|       |                |                |                |                    |
|       v                v                v                v                    |
|  +-----------+    +-----------+    +-----------+    +-----------+            |
|  |  Data     |    |  Feature  |    |  Experiment|    |  Model    |            |
|  |  Registry |    |  Store    |    |  Tracking  |    |  Registry |            |
|  +-----------+    +-----------+    +-----------+    +-----------+            |
|                                                            |                  |
|                                                            v                  |
|  +-----------+    +-----------+    +-----------+    +-----------+            |
|  |  Alerting |    |  Model    |    |  Traffic  |    |  Model    |            |
|  |  System   |<---|  Monitoring|<---|  Routing  |<---|  Serving  |           |
|  +-----------+    +-----------+    +-----------+    +-----------+            |
|       |                                                    |                  |
|       v                                                    v                  |
|  +-----------+                                       +-----------+            |
|  |  Auto     |                                       |  User     |            |
|  |  Retraining|<-------------------------------------|  Feedback |           |
|  +-----------+                                       +-----------+            |
|                                                                                |
+------------------------------------------------------------------------------+
```

### Technology Stack Reference

| Component | Open Source Options | Cloud Services |
|-----------|--------------------| ---------------|
| **Feature Store** | Feast, Hopsworks | AWS SageMaker Feature Store, Vertex AI Feature Store |
| **Experiment Tracking** | MLflow, Weights & Biases, Neptune | SageMaker Experiments, Vertex AI Experiments |
| **Model Registry** | MLflow, DVC | SageMaker Model Registry, Vertex AI Model Registry |
| **Training Orchestration** | Kubeflow, Airflow, Prefect | SageMaker Pipelines, Vertex AI Pipelines |
| **Model Serving** | TensorFlow Serving, TorchServe, Triton | SageMaker Endpoints, Vertex AI Prediction |
| **Monitoring** | Prometheus, Grafana, Evidently | CloudWatch, Cloud Monitoring |

---

## Best Practices

### Design for Reproducibility

```python
# Reproducibility checklist
REPRODUCIBILITY_CONFIG = {
    "code_versioning": {
        "git_commit_hash": True,
        "dependency_lock_file": True,  # requirements.txt or poetry.lock
        "dockerfile_versioning": True
    },
    "data_versioning": {
        "dataset_checksums": True,
        "data_lineage_tracking": True,
        "feature_store_snapshots": True
    },
    "model_versioning": {
        "hyperparameters_logged": True,
        "random_seeds_fixed": True,
        "training_config_stored": True
    },
    "environment": {
        "containerized_training": True,
        "gpu_determinism": True,  # CUDA deterministic operations
        "environment_variables_logged": True
    }
}
```

### Implement Proper Testing

```
+------------------------------------------------------------------------------+
|                           ML Testing Pyramid                                  |
+------------------------------------------------------------------------------+
|                                                                                |
|                              /\                                               |
|                             /  \                                              |
|                            /    \                                             |
|                           / E2E  \      End-to-End Pipeline Tests            |
|                          /  Tests \                                           |
|                         /----------\                                          |
|                        /            \                                         |
|                       / Integration  \    Model + Infrastructure Tests       |
|                      /    Tests       \                                       |
|                     /------------------\                                      |
|                    /                    \                                     |
|                   /    Unit Tests        \   Data Validation, Model Tests    |
|                  /------------------------\                                   |
|                 /                          \                                  |
|                /    Data Quality Tests      \  Schema, Distribution, Drift   |
|               /------------------------------\                                |
|                                                                                |
+------------------------------------------------------------------------------+
```

```python
# Example test cases
import pytest
import numpy as np

class TestDataQuality:
    """Data quality tests for ML pipeline."""

    def test_no_null_features(self, training_data):
        """Verify no null values in required features."""
        required_features = ["user_id", "item_id", "timestamp"]
        for feature in required_features:
            assert training_data[feature].isnull().sum() == 0

    def test_feature_distributions(self, training_data, reference_data):
        """Verify feature distributions haven't drifted significantly."""
        for feature in training_data.columns:
            if training_data[feature].dtype in [np.float64, np.int64]:
                stat, p_value = ks_2samp(
                    training_data[feature],
                    reference_data[feature]
                )
                assert p_value > 0.05, f"Distribution drift in {feature}"

    def test_label_balance(self, training_data):
        """Verify label balance is within acceptable range."""
        label_counts = training_data["label"].value_counts(normalize=True)
        assert label_counts.min() > 0.1, "Severe class imbalance detected"


class TestModelQuality:
    """Model quality tests."""

    def test_model_accuracy_threshold(self, model, test_data):
        """Verify model meets minimum accuracy threshold."""
        predictions = model.predict(test_data["features"])
        accuracy = (predictions == test_data["labels"]).mean()
        assert accuracy > 0.8, f"Model accuracy {accuracy} below threshold"

    def test_model_fairness(self, model, test_data):
        """Verify model fairness across protected groups."""
        groups = test_data["protected_attribute"].unique()
        accuracies = {}

        for group in groups:
            mask = test_data["protected_attribute"] == group
            predictions = model.predict(test_data["features"][mask])
            accuracies[group] = (predictions == test_data["labels"][mask]).mean()

        # Check fairness: accuracy difference < 10%
        accuracy_range = max(accuracies.values()) - min(accuracies.values())
        assert accuracy_range < 0.1, f"Fairness violation: accuracy range {accuracy_range}"

    def test_model_latency(self, model, sample_input):
        """Verify model inference latency is acceptable."""
        import time

        latencies = []
        for _ in range(100):
            start = time.time()
            model.predict(sample_input)
            latencies.append((time.time() - start) * 1000)

        p95_latency = np.percentile(latencies, 95)
        assert p95_latency < 100, f"P95 latency {p95_latency}ms exceeds 100ms threshold"
```

### Documentation Standards

Every ML system should have comprehensive documentation:

```
ml-project/
+-- README.md                    # Project overview
+-- docs/
|   +-- architecture.md          # System architecture
|   +-- data_dictionary.md       # Feature definitions
|   +-- model_cards/             # Model documentation
|   |   +-- model_v1.md
|   |   +-- model_v2.md
|   +-- runbooks/                # Operational procedures
|       +-- incident_response.md
|       +-- retraining_procedure.md
+-- configs/
|   +-- feature_config.yaml
|   +-- training_config.yaml
|   +-- serving_config.yaml
```

---

## Interview Questions

### System Design Questions

**Q1: Design a real-time recommendation system for an e-commerce platform.**

Key considerations:
1. **Scale**: Handle millions of users and items
2. **Latency**: Sub-100ms response time
3. **Freshness**: Incorporate recent user behavior

Architecture outline:
```
User Request --> Feature Service --> Candidate Retrieval --> Ranking Model --> Filtering --> Response
                      |                    |                      |
                      v                    v                      v
               Online Features      Vector Index           Model Server
               (Redis Cluster)    (Approximate NN)        (GPU Cluster)
```

**Q2: How would you handle model performance degradation in production?**

Answer framework:
1. **Detection**: Monitoring dashboards, alerting thresholds
2. **Diagnosis**: Data drift analysis, feature attribution
3. **Mitigation**: Traffic rollback, shadow mode
4. **Recovery**: Automatic retraining, model rollback

**Q3: Design a feature platform that serves both training and serving.**

Key points:
- Single source of truth for feature definitions
- Offline store for historical features (training)
- Online store for low-latency serving (inference)
- Point-in-time correctness for training data
- Feature versioning and lineage tracking

### Technical Questions

**Q4: What is training-serving skew and how do you prevent it?**

Training-serving skew occurs when features used during training differ from those at inference time. Prevention strategies:
- Use feature stores for consistent feature access
- Share preprocessing code between training and serving
- Implement feature validation in serving pipeline
- Monitor feature distributions in production

**Q5: Explain the data flywheel concept and its importance.**

The data flywheel is a virtuous cycle:
1. Model serves predictions
2. Users interact, generating new data
3. Feedback is collected (explicit or implicit)
4. New data improves model training
5. Better model leads to better user experience
6. More users generate more data

This creates compound improvement over time.

**Q6: How do you decide when to retrain a model?**

Retraining triggers:
- **Performance-based**: Accuracy drops below threshold
- **Drift-based**: Input distribution changes significantly
- **Data-based**: Sufficient new labeled data accumulated
- **Time-based**: Regular schedule (weekly/monthly)
- **Event-based**: Major product or market changes

---

## Summary

Building production ML systems requires careful attention to three core platforms:

1. **Feature Platform**: Ensures consistent feature computation and serving across training and inference, preventing training-serving skew.

2. **Training Platform**: Manages the model development lifecycle with experiment tracking, distributed training, and hyperparameter optimization.

3. **Inference Platform**: Handles model deployment, serving, A/B testing, and traffic management at scale.

4. **Data Flywheel**: Creates continuous improvement through feedback collection, active learning, and automatic retraining.

Key principles for success:
- Design for reproducibility from day one
- Implement comprehensive testing at all levels
- Monitor both technical and business metrics
- Build automation for common operations
- Document everything for team knowledge sharing

As ML systems mature, the infrastructure investment pays dividends through faster iteration, more reliable deployments, and continuous model improvement.

---

## Further Reading

### Official Documentation
- [MLflow](https://mlflow.org/docs/latest/index.html) - Experiment tracking and model registry
- [Feast](https://docs.feast.dev/) - Open-source feature store
- [Kubeflow](https://www.kubeflow.org/docs/) - ML pipelines on Kubernetes
- [Ray](https://docs.ray.io/en/latest/) - Distributed computing framework

### Recommended Books
- **"Designing Machine Learning Systems"** - Chip Huyen
- **"Machine Learning Engineering"** - Andriy Burkov
- **"Building Machine Learning Pipelines"** - Hannes Hapke, Catherine Nelson

### Research Papers
- "Hidden Technical Debt in Machine Learning Systems" - Google
- "Rules of Machine Learning: Best Practices for ML Engineering" - Google
- "Challenges in Deploying Machine Learning: a Survey of Case Studies" - Cambridge

