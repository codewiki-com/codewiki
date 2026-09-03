---
title: 机器学习系统设计：端到端架构
description: 设计生产级机器学习系统：特征平台、训练平台、推理平台和数据飞轮
track: datascience
section: deployment
difficulty: advanced
tags:
  - 机器学习系统
  - 架构
  - 平台
  - 工程
  - MLOps
status: imported
origin: old/src/content/docs/datascience/ml-system-design.zh.md
divergence: 0.222
issues:
  - missing-subcategory-zh
  - order-mismatch
  - category-casing
legacy:
  category: datascience
  subcategory: ""
  order: 41
  lastUpdated: 2026-01-07
---

设计机器学习系统远不止于模型训练和调优。在生产环境中，完整的机器学习系统必须包含数据管理、特征工程、模型训练、模型服务、监控和持续改进。本指南探讨了构建企业级机器学习平台的架构和设计原则。

---

## ML系统概览

### 端到端ML系统架构

一个完整的机器学习系统通常包含以下核心组件：

```
+--------------------------------------------------------------------------------+
|                        ML 系统架构概览                                         |
+--------------------------------------------------------------------------------+
|                                                                                  |
|  +-----------+    +-----------+    +-----------+    +-----------+               |
|  |   数据    |--->|   数据    |--->|  特征     |--->|  训练     |               |
|  |  来源    |    |  管道     |    |  平台     |    |  平台     |               |
|  +-----------+    +-----------+    +-----------+    +-----+-----+               |
|                                                           |                      |
|                                        +------------------+                      |
|                                        v                                         |
|  +-----------+    +-----------+    +-----------+    +-----------+               |
|  | 监控      |<---|  推理      |<---|   模型    |<---| 模型      |               |
|  | & 日志   |    |  平台      |    |  注册表   |    | 验证      |               |
|  +-----------+    +-----------+    +-----------+    +-----------+               |
|                         |                                                        |
|                         v                                                        |
|                   +-----------+                                                  |
|                   |   数据    |-----> 回流到数据来源 (数据飞轮)                  |
|                   |  飞轮     |                                                  |
|                   +-----------+                                                  |
|                                                                                  |
+--------------------------------------------------------------------------------+
```

### ML系统的三大支柱

| 支柱 | 核心职责 | 关键技术 |
|--------|----------------------|------------------|
| **特征平台** | 特征存储、计算、服务 | 特征存储、实时/批处理计算 |
| **训练平台** | 模型训练、实验管理、超参数优化 | 分布式训练、AutoML、实验跟踪 |
| **推理平台** | 模型部署、在线预测、批量推理 | 模型服务、A/B测试、流量管理 |

### MLOps成熟度模型

了解您的组织的MLOps成熟度有助于优先安排基础设施投资：

```
等级0：手工流程
+-- 数据科学家手工训练模型
+-- 手工部署到生产环境
+-- 没有自动化或可重复性

等级1：ML管道自动化
+-- 自动化数据处理和特征工程
+-- 连续训练 (CT)
+-- 自动化模型部署

等级2：CI/CD管道自动化
+-- 代码版本控制
+-- 模型版本控制
+-- 自动化测试和验证
+-- 连续集成/持续部署

等级3：完整MLOps自动化
+-- 自动化特征工程
+-- 自动化模型选择和超参数调优
+-- 自动化监控和重新训练
+-- 端到端可观测性和治理
```

---

## 特征平台

特征平台是任何机器学习系统的骨干，负责在训练和推理中一致地计算、存储和服务特征。

### 特征平台架构

```
+------------------------------------------------------------------------------+
|                          特征平台架构                                         |
+------------------------------------------------------------------------------+
|                                                                                |
|  数据来源              特征计算              特征存储                          |
|                                                                                |
|  +----------+             +----------------+           +-----------------+     |
|  |  事件    |------------>|                |           |   离线存储      |     |
|  | (Kafka)  |             |  流引擎        |---------->|   (数据湖)      |     |
|  +----------+             |   (Flink)      |           +-----------------+     |
|                           |                |                    |              |
|  +----------+             +----------------+                    |              |
|  |  批处理  |                    |                    +---------v---------+   |
|  |  (S3)    |---+                |                    |   特征            |   |
|  +----------+   |         +------v-------+            |   注册表          |   |
|                 |         |              |            |   (元数据)        |   |
|  +----------+   +-------->| 批处理引擎   |            +-------------------+   |
|  |  数据库  |------------>|  (Spark)     |                    |              |
|  +----------+             |              |            +---------v---------+   |
|                           +------+-------+            |   在线存储        |   |
|                                  |                    |   (Redis/DynamoDB)|   |
|                                  +-------------------->                   |   |
|                                                       +-------------------+   |
|                                                                |              |
|                   特征服务                              |              |
|                   +-------------------+                        |              |
|                   |   特征服务器      |<-----------------------+              |
|                   |   (REST/gRPC)     |                                       |
|                   +-------------------+                                       |
|                           |                                                   |
|             +-------------+-------------+                                     |
|             v                           v                                     |
|      训练管道                       推理服务                                  |
|                                                                                |
+------------------------------------------------------------------------------+
```

### 特征类型和计算模式

特征可以按其计算需求进行分类：

```
+------------------------------------------------------------------------------+
|                         特征计算模式                                          |
+------------------------------------------------------------------------------+
|                                                                                |
|  批处理特征 (离线)                                                             |
|  +------------------------+                                                   |
|  | - 定期计算 (小时/天)                                                       |
|  | - 历史聚合                                                                 |
|  | - 复杂转换                                                                 |
|  | - 示例: 30天购买历史、客户终身价值                                          |
|  +------------------------+                                                   |
|                                                                                |
|  流处理特征 (近实时)                                                           |
|  +------------------------+                                                   |
|  | - 从事件流计算                                                             |
|  | - 滑动窗口聚合                                                             |
|  | - 亚分钟级新鲜度                                                           |
|  | - 示例: 最后一小时的点击、会话时长                                          |
|  +------------------------+                                                   |
|                                                                                |
|  按需特征 (实时)                                                               |
|  +------------------------+                                                   |
|  | - 在请求时计算                                                             |
|  | - 不能预先计算                                                             |
|  | - 请求特定的上下文                                                         |
|  | - 示例: 距离上次操作的时间、当前位置距离                                    |
|  +------------------------+                                                   |
|                                                                                |
+------------------------------------------------------------------------------+
```

### 特征存储实现

```python
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
import redis
import pandas as pd
from pyspark.sql import SparkSession

@dataclass
class FeatureDefinition:
    """特征定义及其元数据。"""
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
    统一的特征平台用于ML系统。
    为训练和服务提供一致的特征访问。
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
        """在目录中注册特征定义。"""
        self.feature_registry[definition.name] = definition
        print(f"注册特征: {definition.name}")

    def compute_batch_features(
        self,
        spark: SparkSession,
        feature_names: List[str],
        start_date: str,
        end_date: str
    ) -> pd.DataFrame:
        """
        为日期范围计算批处理特征。
        用于生成训练数据集。
        """
        # 加载源数据
        events_df = spark.read.parquet(
            f"{self.offline_store_path}/events"
        ).filter(
            f"event_date >= '{start_date}' AND event_date <= '{end_date}'"
        )

        # 计算请求的特征
        feature_dfs = []
        for feature_name in feature_names:
            if feature_name not in self.feature_registry:
                raise ValueError(f"未知特征: {feature_name}")

            definition = self.feature_registry[feature_name]
            # 应用特征定义中的转换
            feature_df = self._apply_transformation(
                events_df, definition
            )
            feature_dfs.append(feature_df)

        # 连接所有特征
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
        从在线存储检索特征用于实时服务。
        优化低延迟 (<10ms 目标)。
        """
        result = {}

        # 使用管道进行批量检索
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
        将离线特征具体化到在线存储。
        定期运行以保持在线特征新鲜。
        """
        # 从离线存储加载最新特征
        offline_features = pd.read_parquet(
            f"{self.offline_store_path}/{entity_type}_features/latest"
        )

        # 写入在线存储
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
        print(f"具体化了 {len(offline_features)} 个实体")

    def get_training_dataset(
        self,
        entity_df: pd.DataFrame,
        feature_names: List[str],
        label_column: str
    ) -> pd.DataFrame:
        """
        生成具有时间点正确性的训练数据集。
        通过使用事件时间可用的特征来防止数据泄漏。
        """
        # 按时间戳排序以进行有效的时间点连接
        entity_df = entity_df.sort_values("event_timestamp")

        # 加载特征历史
        feature_history = pd.read_parquet(
            f"{self.offline_store_path}/feature_history"
        )

        # 时间点连接
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
        """从特征定义应用转换逻辑。"""
        # 实现取决于转换DSL
        pass

    def _parse_value(self, val: Optional[str]) -> Any:
        """将Redis中的字符串值解析为适当类型。"""
        if val is None:
            return None
        try:
            return float(val)
        except ValueError:
            return val


# 示例: 特征定义
user_features = [
    FeatureDefinition(
        name="user_purchase_count_30d",
        entity="user",
        dtype="int64",
        description="过去30天的购买次数",
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
        description="过去30天的平均订单价值",
        tags=["user", "monetary"],
        owner="ml-team",
        freshness="daily",
        source="transactions",
        transformation="AVG(order_value) WHERE event_date >= current_date - 30"
    ),
]
```

### 特征一致性：训练-服务偏差

在机器学习系统中最关键的挑战之一是确保训练和服务之间的特征一致性：

```
+------------------------------------------------------------------------------+
|                     训练-服务偏差防止                                         |
+------------------------------------------------------------------------------+
|                                                                                |
|  偏差的常见原因：                                                             |
|                                                                                |
|  1. 不同的代码路径                                                             |
|     +------------------+          +------------------+                        |
|     |  训练代码         |   =/=    |  服务代码        |                        |
|     |  (Python/Spark)   |          |  (Java/Go)       |                        |
|     +------------------+          +------------------+                        |
|                                                                                |
|  2. 时间旅行问题                                                               |
|     训练: 意外使用未来数据 (数据泄漏)                                         |
|     服务: 只有过去数据可用                                                   |
|                                                                                |
|  3. 预处理差异                                                                 |
|     - 不同的标准化参数                                                       |
|     - 缺失值处理不一致                                                       |
|     - 特征编码不匹配                                                         |
|                                                                                |
|  解决方案：                                                                    |
|                                                                                |
|  +------------------------------------------------------------------+        |
|  |                   统一特征存储                                    |        |
|  |                                                                   |        |
|  |  特征定义的单一真实来源                                           |        |
|  |      |                                    |                       |        |
|  |      v                                    v                       |        |
|  | +------------+                    +-------------+                 |        |
|  | |  训练      |                    |   服务      |                 |        |
|  | |  管道      |                    |   管道      |                 |        |
|  | +------------+                    +-------------+                 |        |
|  |                                                                   |        |
|  |  相同的特征计算逻辑、相同的预处理                                 |        |
|  +------------------------------------------------------------------+        |
|                                                                                |
+------------------------------------------------------------------------------+
```

---

## 训练平台

训练平台管理整个模型开发生命周期，从实验到生产就绪的模型。

### 训练平台架构

```
+------------------------------------------------------------------------------+
|                          训练平台架构                                         |
+------------------------------------------------------------------------------+
|                                                                                |
|  +-------------------+    +-------------------+    +-------------------+       |
|  |  实验             |    |  训练             |    |  模型             |       |
|  |  管理             |    |  编排             |    |  注册表           |       |
|  +-------------------+    +-------------------+    +-------------------+       |
|         |                        |                        |                   |
|         v                        v                        v                   |
|  +----------------------------------------------------------------+          |
|  |                     训练基础设施                                  |          |
|  |                                                                  |          |
|  |  +------------+    +------------+    +------------+             |          |
|  |  |   CPU      |    |   GPU      |    |   TPU      |             |          |
|  |  |   集群     |    |   集群     |    |   Pods     |             |          |
|  |  +------------+    +------------+    +------------+             |          |
|  |                                                                  |          |
|  |  +----------------------------------------------------------+   |          |
|  |  |           分布式训练框架                                  |   |          |
|  |  |    (Horovod / PyTorch DDP / TensorFlow Distribution)     |   |          |
|  |  +----------------------------------------------------------+   |          |
|  +----------------------------------------------------------------+          |
|                               |                                               |
|                               v                                               |
|  +----------------------------------------------------------------+          |
|  |                     训练管道                                    |          |
|  |                                                                  |          |
|  |  1. 数据加载 --> 2. 预处理 --> 3. 训练                           |          |
|  |                                        |                        |          |
|  |  6. 部署 <-- 5. 验证 <-- 4. 评估              |          |
|  +----------------------------------------------------------------+          |
|                                                                                |
+------------------------------------------------------------------------------+
```

### 实验管理

```python
import mlflow
from mlflow.tracking import MlflowClient
from typing import Dict, Any, List, Optional
import hashlib
import json
from datetime import datetime

class ExperimentManager:
    """
    使用版本控制、跟踪和可重复性管理ML实验。
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
        """使用元数据创建新实验。"""
        experiment_id = mlflow.create_experiment(
            name=name,
            artifact_location=f"{self.artifact_location}/{name}",
            tags=tags or {}
        )

        # 记录实验元数据
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
        使用自动参数日志记录启动新的训练运行。
        """
        mlflow.set_experiment(experiment_name)

        # 创建可重复性哈希
        config_hash = hashlib.sha256(
            json.dumps(params, sort_keys=True).encode()
        ).hexdigest()[:8]

        with mlflow.start_run(run_name=run_name) as run:
            # 记录参数
            mlflow.log_params(params)

            # 记录标签
            mlflow.set_tag("config_hash", config_hash)
            if tags:
                for key, value in tags.items():
                    mlflow.set_tag(key, value)

            return run.info.run_id

    def log_metrics(self, metrics: Dict[str, float], step: int = None):
        """为当前运行记录指标。"""
        for name, value in metrics.items():
            mlflow.log_metric(name, value, step=step)

    def log_model(
        self,
        model,
        artifact_path: str,
        signature=None,
        input_example=None
    ):
        """使用签名记录训练的模型。"""
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
        """通过特定指标比较运行。"""
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
    具有最佳实践的端到端训练管道。
    """

    def __init__(
        self,
        experiment_manager: ExperimentManager,
        feature_platform,  # FeaturePlatform实例
        model_registry  # ModelRegistry实例
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
        执行完整的训练管道。

        返回:
            注册表中的模型版本ID
        """
        # 1. 准备训练数据
        print("步骤1: 准备训练数据...")
        train_df, val_df, test_df = self._prepare_data(data_config)

        # 2. 启动实验跟踪
        print("步骤2: 启动实验...")
        run_id = self.experiment_manager.start_run(
            experiment_name=training_config["experiment_name"],
            run_name=training_config["run_name"],
            params={**model_config, **training_config, **data_config}
        )

        try:
            # 3. 训练模型
            print("步骤3: 训练模型...")
            model = self._train_model(
                train_df, val_df,
                model_config, training_config
            )

            # 4. 评估模型
            print("步骤4: 评估模型...")
            metrics = self._evaluate_model(model, test_df)
            self.experiment_manager.log_metrics(metrics)

            # 5. 验证模型质量
            print("步骤5: 验证模型...")
            validation_passed = self._validate_model(metrics, training_config)

            if not validation_passed:
                raise ValueError("模型验证失败")

            # 6. 注册模型
            print("步骤6: 注册模型...")
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
        """准备具有特征的训练/验证/测试分割。"""
        # 从特征平台获取训练数据集
        entity_df = self._load_entity_data(data_config)

        full_df = self.feature_platform.get_training_dataset(
            entity_df=entity_df,
            feature_names=data_config["feature_names"],
            label_column=data_config["label_column"]
        )

        # 分割数据
        train_df = full_df[full_df["split"] == "train"]
        val_df = full_df[full_df["split"] == "val"]
        test_df = full_df[full_df["split"] == "test"]

        return train_df, val_df, test_df

    def _train_model(self, train_df, val_df, model_config, training_config):
        """使用早期停止和检查点训练模型。"""
        # 实现取决于框架
        pass

    def _evaluate_model(self, model, test_df) -> Dict[str, float]:
        """在测试集上评估模型。"""
        # 实现取决于任务类型
        pass

    def _validate_model(self, metrics: Dict, config: Dict) -> bool:
        """验证模型是否满足质量阈值。"""
        thresholds = config.get("quality_thresholds", {})

        for metric_name, threshold in thresholds.items():
            if metric_name in metrics:
                if metrics[metric_name] < threshold:
                    print(f"验证失败: {metric_name}={metrics[metric_name]} < {threshold}")
                    return False

        return True

    def _load_entity_data(self, data_config: Dict):
        """加载用于训练的实体数据。"""
        pass
```

### 分布式训练架构

```
+------------------------------------------------------------------------------+
|                        分布式训练模式                                         |
+------------------------------------------------------------------------------+
|                                                                                |
|  数据并行化 (最常见)                                                           |
|  +----------------------------------------------------------------------+    |
|  |                                                                       |    |
|  |  +----------+    +----------+    +----------+    +----------+        |    |
|  |  | 工作节点0 |    | 工作节点1 |    | 工作节点2 |    | 工作节点3 |        |    |
|  |  | 数据[0]   |    | 数据[1]   |    | 数据[2]   |    | 数据[3]   |        |    |
|  |  | 模型      |    | 模型      |    | 模型      |    | 模型      |        |    |
|  |  | 副本      |    | 副本      |    | 副本      |    | 副本      |        |    |
|  |  +----+-----+    +----+-----+    +----+-----+    +----+-----+        |    |
|  |       |              |              |              |                  |    |
|  |       +------+-------+-------+------+              |                  |    |
|  |              |               |                     |                  |    |
|  |              v               v                     v                  |    |
|  |         +--------+      梯度同步          +--------+     |    |
|  |         | AllReduce (Ring, Tree, or Hierarchical)    |         |     |    |
|  |         +--------------------------------------------+         |     |    |
|  |                                                                       |    |
|  +----------------------------------------------------------------------+    |
|                                                                                |
|  模型并行化 (大型模型)                                                        |
|  +----------------------------------------------------------------------+    |
|  |                                                                       |    |
|  |  +----------+    +----------+    +----------+    +----------+        |    |
|  |  | GPU 0    |    | GPU 1    |    | GPU 2    |    | GPU 3    |        |    |
|  |  | 层       |--->| 层       |--->| 层       |--->| 层       |        |    |
|  |  | 1-4      |    | 5-8      |    | 9-12     |    | 13-16    |        |    |
|  |  +----------+    +----------+    +----------+    +----------+        |    |
|  |                                                                       |    |
|  |  管道并行化: 微批次通过阶段流动                                       |    |
|  +----------------------------------------------------------------------+    |
|                                                                                |
+------------------------------------------------------------------------------+
```

### 超参数优化

```python
import optuna
from optuna.integration import MLflowCallback
from typing import Dict, Any, Callable
import numpy as np

class HyperparameterOptimizer:
    """
    使用Optuna集成进行超参数优化。
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
        从配置定义超参数搜索空间。
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
        运行超参数优化。

        参数:
            objective_fn: 接收参数字典并返回指标的函数
            search_config: 搜索空间配置
            n_trials: 试验次数
            timeout: 最大时间 (秒)
            n_jobs: 并行作业数

        返回:
            找到的最佳参数
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
        """获取优化历史和统计。"""
        return {
            "best_value": self.study.best_value,
            "best_params": self.study.best_params,
            "n_trials": len(self.study.trials),
            "best_trial": self.study.best_trial.number,
            "param_importances": optuna.importance.get_param_importances(self.study)
        }


# 示例搜索配置
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

## 推理平台

推理平台处理模型部署、服务和大规模实时预测。

### 推理平台架构

```
+------------------------------------------------------------------------------+
|                          推理平台架构                                         |
+------------------------------------------------------------------------------+
|                                                                                |
|                            流量管理层                                          |
|  +----------------------------------------------------------------------+    |
|  |  +----------+    +------------+    +-----------+    +------------+   |    |
|  |  |   负载   |    |   速率     |    |   A/B     |    |  断路器    |   |    |
|  |  | 均衡器   |    |  限制器    |    |  路由器   |    |            |   |    |
|  |  +----------+    +------------+    +-----------+    +------------+   |    |
|  +----------------------------------------------------------------------+    |
|                                     |                                         |
|                                     v                                         |
|                            模型服务层                                          |
|  +----------------------------------------------------------------------+    |
|  |                                                                       |    |
|  |  +------------------+  +------------------+  +------------------+     |    |
|  |  |  模型服务器A     |  |  模型服务器B     |  |  模型服务器C     |     |    |
|  |  |  (版本1.0)       |  |  (版本1.1)       |  |  (挑战者)        |     |    |
|  |  |                  |  |                  |  |                  |     |    |
|  |  |  +------------+  |  |  +------------+  |  |  +------------+  |     |    |
|  |  |  |   模型     |  |  |  |   模型     |  |  |  |   模型     |  |     |    |
|  |  |  +------------+  |  |  +------------+  |  |  +------------+  |     |    |
|  |  |  | 预处理     |  |  |  | 预处理     |  |  |  | 预处理     |  |     |    |
|  |  |  +------------+  |  |  +------------+  |  |  +------------+  |     |    |
|  |  |  | 后处理     |  |  |  | 后处理     |  |  |  | 后处理     |  |     |    |
|  |  |  +------------+  |  |  +------------+  |  |  +------------+  |     |    |
|  |  +------------------+  +------------------+  +------------------+     |    |
|  |           |                    |                    |                 |    |
|  +----------------------------------------------------------------------+    |
|              |                    |                    |                      |
|              +--------------------+--------------------+                      |
|                                   |                                           |
|                                   v                                           |
|                            基础设施层                                          |
|  +----------------------------------------------------------------------+    |
|  |  +------------+  +------------+  +------------+  +------------+      |    |
|  |  |   GPU      |  |   缓存     |  |  特征      |  |  日志/     |      |    |
|  |  |   池       |  |   层       |  |  服务      |  |  指标      |      |    |
|  |  +------------+  +------------+  +------------+  +------------+      |    |
|  +----------------------------------------------------------------------+    |
|                                                                                |
+------------------------------------------------------------------------------+
```

### 模型服务实现

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
    生产推理平台，具有缓存、批处理和监控。
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

        # 模型缓存
        self.loaded_models: Dict[str, Any] = {}

        # 请求批处理
        self.batch_queue: Dict[str, List] = {}
        self.batch_size = 32
        self.max_batch_wait_ms = 10

        # 用于异步操作的线程池
        self.executor = ThreadPoolExecutor(max_workers=10)

    async def predict(
        self,
        request: PredictionRequest
    ) -> PredictionResponse:
        """
        处理具有完整服务管道的预测请求。
        """
        start_time = time.time()

        try:
            # 1. 检查缓存
            cache_key = self._get_cache_key(request)
            cached_result = await self._check_cache(cache_key)
            if cached_result:
                self.metrics.increment("cache_hits", tags={"model": request.model_name})
                return cached_result

            # 2. 获取特征
            features = await self._get_features(request)

            # 3. 获取模型
            model, model_version = await self._get_model(
                request.model_name,
                request.model_version
            )

            # 4. 预处理
            processed_features = self._preprocess(features, model_version)

            # 5. 运行推理
            raw_predictions = await self._run_inference(
                model, processed_features
            )

            # 6. 后处理
            predictions = self._postprocess(raw_predictions, model_version)

            # 7. 构建响应
            latency_ms = (time.time() - start_time) * 1000

            response = PredictionResponse(
                request_id=request.request_id,
                predictions=predictions,
                model_version=model_version,
                latency_ms=latency_ms,
                metadata={"cached": False}
            )

            # 8. 缓存结果
            await self._cache_result(cache_key, response)

            # 9. 记录指标
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
        高效处理批量预测请求。
        """
        # 按模型分组
        by_model: Dict[str, List[PredictionRequest]] = {}
        for req in requests:
            key = f"{req.model_name}:{req.model_version or 'latest'}"
            if key not in by_model:
                by_model[key] = []
            by_model[key].append(req)

        # 处理每个模型组
        all_responses = []
        for model_key, model_requests in by_model.items():
            responses = await self._batch_predict_for_model(
                model_requests
            )
            all_responses.extend(responses)

        # 恢复原始顺序
        response_map = {r.request_id: r for r in all_responses}
        return [response_map[req.request_id] for req in requests]

    async def _get_model(
        self,
        model_name: str,
        model_version: Optional[str]
    ) -> tuple:
        """从缓存或注册表加载模型。"""
        cache_key = f"{model_name}:{model_version or 'latest'}"

        if cache_key not in self.loaded_models:
            # 从注册表加载
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
        """从特征平台检索特征。"""
        # 合并请求特征和存储的特征
        if "entity_id" in request.features:
            stored_features = await asyncio.get_event_loop().run_in_executor(
                self.executor,
                self.feature_platform.get_online_features,
                request.features["entity_type"],
                [request.features["entity_id"]],
                request.metadata.get("feature_names", [])
            )

            # 与请求特征合并 (请求优先)
            features = stored_features.get(request.features["entity_id"], {})
            features.update(request.features)
            return features

        return request.features

    async def _run_inference(
        self,
        model,
        features: np.ndarray
    ) -> np.ndarray:
        """运行模型推理。"""
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
        """预处理用于模型输入的特征。"""
        # 获取模型版本的预处理配置
        # 应用转换
        pass

    def _postprocess(
        self,
        predictions: np.ndarray,
        model_version: str
    ) -> Any:
        """后处理模型输出。"""
        # 应用反向转换
        # 格式化用于响应
        pass

    async def _check_cache(self, key: str) -> Optional[PredictionResponse]:
        """检查预测缓存。"""
        pass

    async def _cache_result(self, key: str, response: PredictionResponse):
        """缓存预测结果。"""
        pass

    def _get_cache_key(self, request: PredictionRequest) -> str:
        """为请求生成缓存键。"""
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
        """记录预测指标。"""
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

### A/B测试和流量管理

```
+------------------------------------------------------------------------------+
|                          A/B 测试架构                                         |
+------------------------------------------------------------------------------+
|                                                                                |
|                              请求路由器                                        |
|  +----------------------------------------------------------------------+    |
|  |                                                                       |    |
|  |                    流量分配规则                                       |    |
|  |  +------------------------+  +------------------------+              |    |
|  |  | 模型A (对照组)        |  | 模型B (处理组)        |              |    |
|  |  | 流量: 80%             |  | 流量: 20%             |              |    |
|  |  +------------------------+  +------------------------+              |    |
|  |                                                                       |    |
|  |  路由策略：                                                           |    |
|  |  - 随机: 每个请求随机分配                                            |    |
|  |  - 粘性: 用户一致看到同一变体                                        |    |
|  |  - 基于特征: 按用户段路由                                            |    |
|  |                                                                       |    |
|  +----------------------------------------------------------------------+    |
|                                     |                                         |
|                                     v                                         |
|                          指标收集                                              |
|  +----------------------------------------------------------------------+    |
|  |                                                                       |    |
|  |  业务指标：        技术指标：                                         |    |
|  |  - 转化率          - 延迟 (p50, p95, p99)                           |    |
|  |  - 单用户收入       - 错误率                                          |    |
|  |  - 参与度评分       - 吞吐量                                          |    |
|  |  - 用户满意度       - 资源利用率                                      |    |
|  |                                                                       |    |
|  +----------------------------------------------------------------------+    |
|                                     |                                         |
|                                     v                                         |
|                        统计分析                                                |
|  +----------------------------------------------------------------------+    |
|  |                                                                       |    |
|  |  假设检验：                                                           |    |
|  |  H0: 模型B性能 <= 模型A性能                                          |    |
|  |  H1: 模型B性能 > 模型A性能                                           |    |
|  |                                                                       |    |
|  |  统计功效: 可靠结论的最小样本量                                       |    |
|  |  置信水平: 95% (p值 < 0.05)                                          |    |
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
    traffic_split: float  # 处理组的百分比
    primary_metric: str
    secondary_metrics: List[str]
    min_sample_size: int
    confidence_level: float = 0.95

class ABTestingService:
    """
    用于模型比较的A/B测试服务。
    """

    def __init__(self):
        self.experiments: Dict[str, ExperimentConfig] = {}
        self.metrics_store: Dict[str, List[Dict]] = {}

    def create_experiment(self, config: ExperimentConfig):
        """创建新的A/B测试实验。"""
        self.experiments[config.name] = config
        self.metrics_store[config.name] = []

    def route_request(
        self,
        experiment_name: str,
        user_id: str
    ) -> Tuple[str, str]:
        """
        将请求路由到模型变体。
        使用一致哈希进行粘性会话。

        返回:
            (模型名称, 变体名称) 的元组
        """
        if experiment_name not in self.experiments:
            raise ValueError(f"未知实验: {experiment_name}")

        config = self.experiments[experiment_name]

        # 用户分配的一致哈希
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
        """为用户记录实验结果。"""
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
        执行实验结果的统计分析。
        """
        if experiment_name not in self.experiments:
            raise ValueError(f"未知实验: {experiment_name}")

        config = self.experiments[experiment_name]
        outcomes = self.metrics_store[experiment_name]

        # 按变体分割
        control_outcomes = [
            o for o in outcomes if o["variant"] == "control"
        ]
        treatment_outcomes = [
            o for o in outcomes if o["variant"] == "treatment"
        ]

        # 提取主要指标
        control_values = [
            o["metrics"][config.primary_metric]
            for o in control_outcomes
        ]
        treatment_values = [
            o["metrics"][config.primary_metric]
            for o in treatment_outcomes
        ]

        # 统计检验
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

        # Welch's t检验
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

        # 检查是否有足够样本
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
        计算每个变体所需的样本量。

        参数:
            baseline_rate: 对照组的预期转化率
            minimum_detectable_effect: 要检测的最小相对提升
            alpha: 显著性水平 (第一类错误率)
            power: 统计功效 (1 - 第二类错误率)
        """
        # 效应量
        p1 = baseline_rate
        p2 = baseline_rate * (1 + minimum_detectable_effect)

        pooled_p = (p1 + p2) / 2

        # 比例的Cohen's h
        h = 2 * (np.arcsin(np.sqrt(p2)) - np.arcsin(np.sqrt(p1)))

        # Z分数
        z_alpha = stats.norm.ppf(1 - alpha / 2)
        z_beta = stats.norm.ppf(power)

        # 每组样本量
        n = 2 * ((z_alpha + z_beta) / h) ** 2

        return int(np.ceil(n))
```

---

## 数据飞轮

数据飞轮是一个良性循环，生产数据持续改进模型性能。

### 数据飞轮架构

```
+------------------------------------------------------------------------------+
|                          数据飞轮架构                                         |
+------------------------------------------------------------------------------+
|                                                                                |
|                          飞轮循环                                              |
|                                                                                |
|                    +------------------+                                        |
|                    |                  |                                        |
|           +------->|  模型训练        |--------+                              |
|           |        |                  |        |                              |
|           |        +------------------+        |                              |
|           |                                    v                              |
|   +-------+--------+                  +--------+-------+                      |
|   |                |                  |                |                      |
|   | 数据标注        |                  | 模型服务        |                      |
|   |                |                  |                |                      |
|   +-------+--------+                  +--------+-------+                      |
|           ^                                    |                              |
|           |        +------------------+        |                              |
|           |        |                  |        |                              |
|           +--------| 数据收集          |<-------+                              |
|                    |                  |                                        |
|                    +------------------+                                        |
|                                                                                |
|  每个循环：                                                                    |
|  1. 模型在生产中服务预测                                                       |
|  2. 用户互动产生新数据                                                        |
|  3. 新数据被收集和标注                                                        |
|  4. 在扩展数据集上重新训练模型                                                |
|  5. 改进的模型被部署, 重复                                                    |
|                                                                                |
+------------------------------------------------------------------------------+
```

### 反馈循环实现

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
    用于持续模型改进的数据飞轮。
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
        记录预测以进行反馈收集。
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
        为预测收集反馈。

        反馈类型:
        - explicit: 用户显式标注 (正确/不正确)
        - implicit: 从用户行为推断 (点击、购买)
        - delayed: 稍后可用的真实值 (例如30天后的流失)
        """
        # 检索预测
        prediction = await self.feedback_store.get_prediction(prediction_id)

        if prediction is None:
            raise ValueError(f"预测未找到: {prediction_id}")

        # 使用反馈更新
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

        # 记录指标
        self._log_feedback_metrics(feedback)

        # 如果需要，加入标注队列
        if feedback_type == "implicit" and ground_truth is None:
            await self._queue_for_labeling(feedback)

    async def _queue_for_labeling(self, feedback: PredictionFeedback):
        """将不确定的案例加入人类标注队列。"""
        # 基于不确定性或业务价值优先级排序
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
        计算人类标注的优先级得分。
        更高分数 = 更高优先级。
        """
        priority = 0.0

        # 优先级不确定的预测
        if "prediction_confidence" in feedback.metadata:
            confidence = feedback.metadata["prediction_confidence"]
            # 低信心 -> 高优先级
            priority += (1 - confidence) * 0.4

        # 优先级边界情况
        if "is_edge_case" in feedback.metadata:
            priority += 0.3 if feedback.metadata["is_edge_case"] else 0

        # 优先级高价值用户
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
        从收集的反馈生成训练数据集。

        返回:
            生成的数据集的路径
        """
        # 查询有真实标签的反馈
        feedbacks = await self.feedback_store.query_feedback(
            model_name=model_name,
            start_date=start_date,
            end_date=end_date,
            has_ground_truth=True
        )

        # 按标签信心过滤
        high_quality_feedbacks = [
            f for f in feedbacks
            if self._get_label_confidence(f) >= min_confidence
        ]

        # 生成数据集
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

        # 保存数据集
        dataset_path = await self.feedback_store.save_dataset(dataset)

        return dataset_path

    def _get_label_confidence(self, feedback: PredictionFeedback) -> float:
        """获取标签的信心分数。"""
        if feedback.feedback_type == "explicit":
            return 1.0  # 人工标注
        elif feedback.feedback_type == "delayed":
            return 0.95  # 真实标签已验证
        else:
            return feedback.metadata.get("label_confidence", 0.7)

    def _calculate_sample_weight(
        self,
        feedback: PredictionFeedback
    ) -> float:
        """计算训练样本的重要性权重。"""
        weight = 1.0

        # 最近的样本权重更高
        age_days = (datetime.utcnow() - feedback.feedback_timestamp).days
        recency_weight = max(0.5, 1 - age_days / 365)
        weight *= recency_weight

        # 稀有类的正确预测权重更高
        if "class_frequency" in feedback.metadata:
            freq = feedback.metadata["class_frequency"]
            weight *= 1 / (freq + 0.1)

        return weight

    def _log_feedback_metrics(self, feedback: PredictionFeedback):
        """记录反馈收集指标。"""
        self.metrics.increment(
            "feedback_collected",
            tags={
                "model": feedback.model_name,
                "type": feedback.feedback_type
            }
        )

        # 如果有真实标签, 计算预测准确度
        if feedback.ground_truth is not None:
            is_correct = feedback.prediction == feedback.ground_truth
            self.metrics.increment(
                "prediction_correct" if is_correct else "prediction_incorrect",
                tags={"model": feedback.model_name}
            )


class AutomaticRetraining:
    """
    基于数据飞轮指标的自动重新训练触发器。
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
        检查模型是否应该重新训练。
        """
        criteria_results = {}

        # 标准1: 性能下降
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

        # 标准2: 检测到数据漂移
        drift_score = await self._calculate_drift_score(model_name)
        criteria_results["data_drift"] = {
            "drift_score": drift_score,
            "threshold": self.config["drift_threshold"],
            "triggered": drift_score > self.config["drift_threshold"]
        }

        # 标准3: 新标注数据可用
        new_samples = await self._count_new_labeled_samples(model_name)
        criteria_results["new_data"] = {
            "new_samples": new_samples,
            "threshold": self.config["min_new_samples"],
            "triggered": new_samples > self.config["min_new_samples"]
        }

        # 标准4: 距离上次训练的时间
        last_training = await self._get_last_training_time(model_name)
        days_since_training = (datetime.utcnow() - last_training).days

        criteria_results["time_based"] = {
            "days_since_training": days_since_training,
            "threshold_days": self.config["max_days_between_training"],
            "triggered": days_since_training > self.config["max_days_between_training"]
        }

        # 总体决策
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
        """触发自动重新训练。"""
        # 生成新的训练数据集
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=90)

        dataset_path = await self.flywheel.generate_training_dataset(
            model_name=model_name,
            start_date=start_date,
            end_date=end_date
        )

        # 提交训练作业
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

### 主动学习集成

```
+------------------------------------------------------------------------------+
|                          主动学习管道                                         |
+------------------------------------------------------------------------------+
|                                                                                |
|                         不确定性采样                                           |
|  +----------------------------------------------------------------------+    |
|  |                                                                       |    |
|  |  生产预测                                                             |    |
|  |         |                                                            |    |
|  |         v                                                            |    |
|  |  +------------------+                                                |    |
|  |  | 不确定性         |---> 低信心预测                                 |    |
|  |  | 计算             |     被选中用于标注                             |    |
|  |  +------------------+                                                |    |
|  |                                                                       |    |
|  |  选择策略：                                                           |    |
|  |  - 最低信心: min(max(p(y|x)))                                        |    |
|  |  - 边界采样: min(p(y1|x) - p(y2|x))                                  |    |
|  |  - 熵: max(H(p(y|x)))                                                |    |
|  |                                                                       |    |
|  +----------------------------------------------------------------------+    |
|                                     |                                         |
|                                     v                                         |
|  +----------------------------------------------------------------------+    |
|  |                     人在环路中                                        |    |
|  |                                                                       |    |
|  |  +--------------+    +---------------+    +----------------+         |    |
|  |  | 标注         |--->| 质量         |--->| 数据集         |         |    |
|  |  | 界面         |    | 保证         |    | 集成           |         |    |
|  |  +--------------+    +---------------+    +----------------+         |    |
|  |                                                                       |    |
|  +----------------------------------------------------------------------+    |
|                                                                                |
+------------------------------------------------------------------------------+
```

---

## 系统集成模式

### 端到端ML管道

```
+------------------------------------------------------------------------------+
|                          端到端 ML 管道                                       |
+------------------------------------------------------------------------------+
|                                                                                |
|  +-----------+    +-----------+    +-----------+    +-----------+            |
|  |  数据     |    |  特征     |    |  模型     |    |  模型     |            |
|  |  摄入     |--->|  管道     |--->|  训练     |--->|  验证     |           |
|  +-----------+    +-----------+    +-----------+    +-----------+            |
|       |                |                |                |                    |
|       v                v                v                v                    |
|  +-----------+    +-----------+    +-----------+    +-----------+            |
|  |  数据     |    |  特征     |    |  实验     |    |  模型     |            |
|  |  注册表   |    |  存储     |    |  跟踪     |    |  注册表   |            |
|  +-----------+    +-----------+    +-----------+    +-----------+            |
|                                                            |                  |
|                                                            v                  |
|  +-----------+    +-----------+    +-----------+    +-----------+            |
|  |  告警     |    |  模型     |    |  流量     |    |  模型     |            |
|  |  系统     |<---|  监控     |<---|  路由     |<---|  服务     |           |
|  +-----------+    +-----------+    +-----------+    +-----------+            |
|       |                                                    |                  |
|       v                                                    v                  |
|  +-----------+                                       +-----------+            |
|  |  自动     |                                       |  用户     |            |
|  |  重新训练 |<-------------------------------------|  反馈     |           |
|  +-----------+                                       +-----------+            |
|                                                                                |
+------------------------------------------------------------------------------+
```

### 技术栈参考

| 组件 | 开源选项 | 云服务 |
|-----------|--------------------| ---------------|
| **特征存储** | Feast、Hopsworks | AWS SageMaker Feature Store、Vertex AI Feature Store |
| **实验跟踪** | MLflow、Weights & Biases、Neptune | SageMaker Experiments、Vertex AI Experiments |
| **模型注册表** | MLflow、DVC | SageMaker Model Registry、Vertex AI Model Registry |
| **训练编排** | Kubeflow、Airflow、Prefect | SageMaker Pipelines、Vertex AI Pipelines |
| **模型服务** | TensorFlow Serving、TorchServe、Triton | SageMaker Endpoints、Vertex AI Prediction |
| **监控** | Prometheus、Grafana、Evidently | CloudWatch、Cloud Monitoring |

---

## 最佳实践

### 设计可重复性

```python
# 可重复性检查表
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
        "gpu_determinism": True,  # CUDA 确定性操作
        "environment_variables_logged": True
    }
}
```

### 实施适当的测试

```
+------------------------------------------------------------------------------+
|                           ML 测试金字塔                                       |
+------------------------------------------------------------------------------+
|                                                                                |
|                              /\                                               |
|                             /  \                                              |
|                            /    \                                             |
|                           / E2E  \      端到端管道测试                         |
|                          /  测试 \                                            |
|                         /----------\                                          |
|                        /            \                                         |
|                       / 集成        \    模型 + 基础设施测试                |
|                      /    测试       \                                        |
|                     /------------------\                                      |
|                    /                    \                                     |
|                   /    单元测试        \   数据验证、模型测试                |
|                  /------------------------\                                   |
|                 /                          \                                  |
|                /    数据质量测试           \  模式、分布、漂移             |
|               /------------------------------\                                |
|                                                                                |
+------------------------------------------------------------------------------+
```

```python
# 示例测试用例
import pytest
import numpy as np

class TestDataQuality:
    """ML管道的数据质量测试。"""

    def test_no_null_features(self, training_data):
        """验证所需特征中没有空值。"""
        required_features = ["user_id", "item_id", "timestamp"]
        for feature in required_features:
            assert training_data[feature].isnull().sum() == 0

    def test_feature_distributions(self, training_data, reference_data):
        """验证特征分布没有显著漂移。"""
        for feature in training_data.columns:
            if training_data[feature].dtype in [np.float64, np.int64]:
                stat, p_value = ks_2samp(
                    training_data[feature],
                    reference_data[feature]
                )
                assert p_value > 0.05, f"特征分布漂移: {feature}"

    def test_label_balance(self, training_data):
        """验证标签平衡在可接受范围内。"""
        label_counts = training_data["label"].value_counts(normalize=True)
        assert label_counts.min() > 0.1, "检测到严重的类不平衡"


class TestModelQuality:
    """模型质量测试。"""

    def test_model_accuracy_threshold(self, model, test_data):
        """验证模型满足最小准确度阈值。"""
        predictions = model.predict(test_data["features"])
        accuracy = (predictions == test_data["labels"]).mean()
        assert accuracy > 0.8, f"模型准确度 {accuracy} 低于阈值"

    def test_model_fairness(self, model, test_data):
        """验证模型在受保护组间的公平性。"""
        groups = test_data["protected_attribute"].unique()
        accuracies = {}

        for group in groups:
            mask = test_data["protected_attribute"] == group
            predictions = model.predict(test_data["features"][mask])
            accuracies[group] = (predictions == test_data["labels"][mask]).mean()

        # 检查公平性: 准确度差异 < 10%
        accuracy_range = max(accuracies.values()) - min(accuracies.values())
        assert accuracy_range < 0.1, f"公平性违规: 准确度范围 {accuracy_range}"

    def test_model_latency(self, model, sample_input):
        """验证模型推理延迟在可接受范围内。"""
        import time

        latencies = []
        for _ in range(100):
            start = time.time()
            model.predict(sample_input)
            latencies.append((time.time() - start) * 1000)

        p95_latency = np.percentile(latencies, 95)
        assert p95_latency < 100, f"P95 延迟 {p95_latency}ms 超过 100ms 阈值"
```

### 文档标准

每个ML系统都应该有全面的文档：

```
ml-project/
+-- README.md                    # 项目概览
+-- docs/
|   +-- architecture.md          # 系统架构
|   +-- data_dictionary.md       # 特征定义
|   +-- model_cards/             # 模型文档
|   |   +-- model_v1.md
|   |   +-- model_v2.md
|   +-- runbooks/                # 操作程序
|       +-- incident_response.md
|       +-- retraining_procedure.md
+-- configs/
|   +-- feature_config.yaml
|   +-- training_config.yaml
|   +-- serving_config.yaml
```

---

## 面试问题

### 系统设计问题

**Q1: 为电子商务平台设计实时推荐系统。**

关键考虑因素：
1. **规模**: 处理数百万用户和商品
2. **延迟**: 亚100毫秒响应时间
3. **新鲜度**: 融合最近的用户行为

架构概述：
```
用户请求 --> 特征服务 --> 候选检索 --> 排序模型 --> 过滤 --> 响应
                 |            |            |
                 v            v            v
          在线特征      向量索引        模型服务器
          (Redis集群)   (近似NN)        (GPU集群)
```

**Q2: 如何处理生产中的模型性能下降？**

答题框架：
1. **检测**: 监控仪表板、告警阈值
2. **诊断**: 数据漂移分析、特征属性
3. **缓解**: 流量回滚、影子模式
4. **恢复**: 自动重新训练、模型回滚

**Q3: 设计一个既服务训练又服务推理的特征平台。**

关键要点：
- 特征定义的单一真实来源
- 离线存储用于历史特征 (训练)
- 在线存储用于低延迟服务 (推理)
- 训练数据的时间点正确性
- 特征版本控制和血缘追踪

### 技术问题

**Q4: 什么是训练-服务偏差, 如何防止它？**

当训练期间使用的特征与推理时间不同时会发生训练-服务偏差。预防策略：
- 使用特征存储实现一致的特征访问
- 在训练和服务之间共享预处理代码
- 在服务管道中实施特征验证
- 监控生产中的特征分布

**Q5: 解释数据飞轮概念及其重要性。**

数据飞轮是一个良性循环：
1. 模型服务预测
2. 用户互动产生新数据
3. 收集反馈 (显式或隐式)
4. 新数据改进模型训练
5. 更好的模型导致更好的用户体验
6. 更多用户产生更多数据

这随着时间的推移产生复合改进。

**Q6: 如何决定何时重新训练模型？**

重新训练触发器：
- **基于性能**: 准确度低于阈值
- **基于漂移**: 输入分布显著变化
- **基于数据**: 累积了足够的新标注数据
- **基于时间**: 定期日程 (每周/每月)
- **基于事件**: 重大产品或市场变化

---

## 总结

构建生产级机器学习系统需要关注三个核心平台：

1. **特征平台**: 确保在训练和推理中一致的特征计算和服务，防止训练-服务偏差。

2. **训练平台**: 使用实验跟踪、分布式训练和超参数优化管理模型开发生命周期。

3. **推理平台**: 在大规模处理模型部署、服务、A/B测试和流量管理。

4. **数据飞轮**: 通过反馈收集、主动学习和自动重新训练创建持续改进。

成功的关键原则：
- 从一开始就设计可重复性
- 在所有级别实施全面测试
- 监控技术和业务指标
- 为常见操作构建自动化
- 为团队知识共享记录一切

随着机器学习系统的成熟，基础设施投资通过更快的迭代、更可靠的部署和持续的模型改进获得回报。

---

## 延伸阅读

### 官方文档
- [MLflow](https://mlflow.org/docs/latest/index.html) - 实验跟踪和模型注册表
- [Feast](https://docs.feast.dev/) - 开源特征存储
- [Kubeflow](https://www.kubeflow.org/docs/) - Kubernetes上的ML管道
- [Ray](https://docs.ray.io/en/latest/) - 分布式计算框架

### 推荐书籍
- **"Designing Machine Learning Systems"** - Chip Huyen
- **"Machine Learning Engineering"** - Andriy Burkov
- **"Building Machine Learning Pipelines"** - Hannes Hapke、Catherine Nelson

### 研究论文
- "Hidden Technical Debt in Machine Learning Systems" - Google
- "Rules of Machine Learning: Best Practices for ML Engineering" - Google
- "Challenges in Deploying Machine Learning: a Survey of Case Studies" - Cambridge
