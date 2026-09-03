---
title: MLOps 机器学习运维
description: 掌握MLOps实践，实现ML模型的持续集成与部署
track: datascience
section: deployment
difficulty: advanced
tags:
  - MLOps
  - 模型部署
  - MLflow
  - 特征存储
status: imported
origin: old/src/content/docs/ai/mlops.zh.md
divergence: 0.143
issues: []
legacy:
  category: AI
  subcategory: MLOps
  order: 10
  lastUpdated: 2026-01-07
---

MLOps（Machine Learning Operations）是将机器学习模型从实验阶段推向生产环境并持续维护的一套工程实践。它结合了机器学习、DevOps 和数据工程的最佳实践，旨在实现 ML 系统的自动化、可靠性和可扩展性。本文将全面介绍 MLOps 的核心概念、关键技术栈和实践经验。

## MLOps 核心概念

### 什么是 MLOps

MLOps 是一套方法论和实践，用于：

- **标准化** ML 工作流程
- **自动化** 模型训练、验证和部署
- **监控** 生产环境中的模型性能
- **治理** 模型生命周期和数据血缘

### MLOps 成熟度模型

Google 提出的 MLOps 成熟度模型分为三个级别：

| 级别 | 特征 | 自动化程度 |
|------|------|------------|
| Level 0 | 手动流程，Jupyter Notebook 驱动 | 无 |
| Level 1 | ML 流水线自动化，持续训练 | 训练自动化 |
| Level 2 | CI/CD 流水线自动化，持续部署 | 全流程自动化 |

### MLOps vs DevOps

```
传统 DevOps:
代码 → 构建 → 测试 → 部署 → 监控

MLOps（更复杂）:
数据 → 特征工程 → 训练 → 验证 → 部署 → 监控 → 反馈
        ↑                                    |
        +------------------------------------+
                    持续训练循环
```

MLOps 的独特挑战：
- **数据依赖**：模型性能强依赖于数据质量和分布
- **实验管理**：需要追踪大量超参数和模型版本
- **模型衰退**：生产数据分布变化导致模型性能下降
- **可解释性**：需要理解模型决策过程

## 实验追踪

实验追踪是 MLOps 的基础，帮助团队记录和复现实验结果。

### MLflow 实验追踪

MLflow 是最流行的开源 ML 生命周期管理平台：

```python
import mlflow
import mlflow.sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import train_test_split
import pandas as pd

# 设置实验名称
mlflow.set_experiment("customer_churn_prediction")

# 加载数据
df = pd.read_csv("customer_data.csv")
X = df.drop("churn", axis=1)
y = df["churn"]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# 定义超参数
params = {
    "n_estimators": 100,
    "max_depth": 10,
    "min_samples_split": 5,
    "random_state": 42
}

# 开始实验追踪
with mlflow.start_run(run_name="rf_baseline"):
    # 记录参数
    mlflow.log_params(params)

    # 训练模型
    model = RandomForestClassifier(**params)
    model.fit(X_train, y_train)

    # 预测和验证
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)

    # 记录指标
    mlflow.log_metrics({
        "accuracy": accuracy,
        "f1_score": f1
    })

    # 记录模型
    mlflow.sklearn.log_model(model, "model")

    # 记录特征重要性图
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(figsize=(10, 6))
    feature_importance = pd.Series(
        model.feature_importances_,
        index=X.columns
    ).sort_values(ascending=False)
    feature_importance.plot(kind='bar', ax=ax)
    plt.title("Feature Importance")
    plt.tight_layout()
    mlflow.log_figure(fig, "feature_importance.png")

    print(f"Accuracy: {accuracy:.4f}, F1: {f1:.4f}")
```

### Weights & Biases (W&B) 实验追踪

W&B 提供更丰富的可视化和协作功能：

```python
import wandb
import torch
import torch.nn as nn
from torch.utils.data import DataLoader

# 初始化 W&B
wandb.init(
    project="image-classification",
    config={
        "learning_rate": 0.001,
        "epochs": 50,
        "batch_size": 32,
        "architecture": "ResNet50",
        "optimizer": "Adam"
    }
)

config = wandb.config

# 定义模型
model = torchvision.models.resnet50(pretrained=True)
model.fc = nn.Linear(model.fc.in_features, num_classes)

optimizer = torch.optim.Adam(model.parameters(), lr=config.learning_rate)
criterion = nn.CrossEntropyLoss()

# 训练循环
for epoch in range(config.epochs):
    model.train()
    train_loss = 0.0
    correct = 0
    total = 0

    for batch_idx, (images, labels) in enumerate(train_loader):
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        train_loss += loss.item()
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()

    # 验证
    model.eval()
    val_loss = 0.0
    val_correct = 0
    val_total = 0

    with torch.no_grad():
        for images, labels in val_loader:
            outputs = model(images)
            loss = criterion(outputs, labels)
            val_loss += loss.item()
            _, predicted = outputs.max(1)
            val_total += labels.size(0)
            val_correct += predicted.eq(labels).sum().item()

    # 记录到 W&B
    wandb.log({
        "epoch": epoch,
        "train_loss": train_loss / len(train_loader),
        "train_accuracy": 100. * correct / total,
        "val_loss": val_loss / len(val_loader),
        "val_accuracy": 100. * val_correct / val_total,
    })

    # 记录模型检查点
    if val_correct / val_total > best_accuracy:
        best_accuracy = val_correct / val_total
        wandb.save("best_model.pth")

# 完成实验
wandb.finish()
```

### 实验追踪最佳实践

```python
# 创建可复现的实验配置
from dataclasses import dataclass, asdict
import yaml
import hashlib

@dataclass
class ExperimentConfig:
    # 数据配置
    data_path: str = "data/train.csv"
    test_size: float = 0.2
    random_state: int = 42

    # 模型配置
    model_type: str = "xgboost"
    n_estimators: int = 100
    max_depth: int = 6
    learning_rate: float = 0.1

    # 训练配置
    early_stopping_rounds: int = 10
    scoring_metric: str = "auc"

    def to_dict(self):
        return asdict(self)

    def get_hash(self):
        """生成配置哈希，用于标识实验"""
        config_str = yaml.dump(self.to_dict(), sort_keys=True)
        return hashlib.md5(config_str.encode()).hexdigest()[:8]

    def save(self, path: str):
        with open(path, 'w') as f:
            yaml.dump(self.to_dict(), f)

    @classmethod
    def load(cls, path: str):
        with open(path, 'r') as f:
            config_dict = yaml.safe_load(f)
        return cls(**config_dict)

# 使用示例
config = ExperimentConfig(
    n_estimators=200,
    max_depth=8,
    learning_rate=0.05
)

experiment_name = f"xgb_{config.get_hash()}"
print(f"Experiment: {experiment_name}")
```

## 模型版本管理

### MLflow Model Registry

```python
import mlflow
from mlflow.tracking import MlflowClient

client = MlflowClient()

# 注册模型
model_uri = f"runs:/{run_id}/model"
model_name = "customer_churn_model"

# 创建注册模型
mlflow.register_model(model_uri, model_name)

# 获取模型版本
model_version = client.get_latest_versions(model_name, stages=["None"])[0]
print(f"Version: {model_version.version}")

# 添加模型描述
client.update_model_version(
    name=model_name,
    version=model_version.version,
    description="Random Forest baseline model for customer churn prediction"
)

# 转换模型阶段
client.transition_model_version_stage(
    name=model_name,
    version=model_version.version,
    stage="Staging"
)

# 设置模型标签
client.set_model_version_tag(
    name=model_name,
    version=model_version.version,
    key="validation_status",
    value="approved"
)

# 加载特定阶段的模型
staging_model = mlflow.pyfunc.load_model(
    model_uri=f"models:/{model_name}/Staging"
)

# 加载特定版本的模型
versioned_model = mlflow.pyfunc.load_model(
    model_uri=f"models:/{model_name}/3"
)
```

### DVC (Data Version Control)

DVC 用于数据和模型的版本控制：

```bash
# 初始化 DVC
dvc init

# 添加数据文件到 DVC 追踪
dvc add data/training_data.csv
git add data/training_data.csv.dvc data/.gitignore

# 添加模型文件
dvc add models/model.pkl
git add models/model.pkl.dvc

# 配置远程存储
dvc remote add -d myremote s3://my-bucket/dvc-storage

# 推送数据到远程
dvc push

# 拉取数据
dvc pull

# 切换到不同版本的数据
git checkout v1.0
dvc checkout
```

DVC Pipeline 定义（`dvc.yaml`）：

```yaml
stages:
  prepare:
    cmd: python src/prepare.py
    deps:
      - src/prepare.py
      - data/raw
    params:
      - prepare.split_ratio
    outs:
      - data/processed

  train:
    cmd: python src/train.py
    deps:
      - src/train.py
      - data/processed
    params:
      - train.n_estimators
      - train.max_depth
    outs:
      - models/model.pkl
    metrics:
      - metrics.json:
          cache: false

  validate:
    cmd: python src/validate.py
    deps:
      - src/validate.py
      - models/model.pkl
      - data/processed
    metrics:
      - validation.json:
          cache: false
    plots:
      - plots/confusion_matrix.png
```

## 特征存储（Feature Store）

特征存储是 MLOps 的核心组件，用于管理、存储和服务机器学习特征。

### Feast 特征存储

```python
from feast import FeatureStore, Entity, FeatureView, Field, FileSource
from feast.types import Float32, Int64, String
from datetime import timedelta

# 定义实体
customer = Entity(
    name="customer_id",
    description="Customer identifier"
)

# 定义数据源
customer_stats_source = FileSource(
    path="data/customer_stats.parquet",
    timestamp_field="event_timestamp",
    created_timestamp_column="created_timestamp"
)

# 定义特征视图
customer_stats_view = FeatureView(
    name="customer_stats",
    entities=[customer],
    ttl=timedelta(days=365),
    schema=[
        Field(name="total_purchases", dtype=Int64),
        Field(name="avg_purchase_amount", dtype=Float32),
        Field(name="days_since_last_purchase", dtype=Int64),
        Field(name="customer_segment", dtype=String),
    ],
    source=customer_stats_source,
    online=True,
    tags={"team": "customer_analytics"}
)

# feature_store.yaml 配置
"""
project: customer_churn
registry: data/registry.db
provider: local
online_store:
  type: redis
  connection_string: localhost:6379
offline_store:
  type: file
"""

# 初始化 Feature Store
store = FeatureStore(repo_path=".")

# 物化特征到在线存储
store.materialize_incremental(end_date=datetime.now())

# 获取训练数据（离线特征）
entity_df = pd.DataFrame({
    "customer_id": [1001, 1002, 1003],
    "event_timestamp": [datetime.now()] * 3
})

training_df = store.get_historical_features(
    entity_df=entity_df,
    features=[
        "customer_stats:total_purchases",
        "customer_stats:avg_purchase_amount",
        "customer_stats:days_since_last_purchase",
    ]
).to_df()

# 获取在线特征（实时推理）
online_features = store.get_online_features(
    features=[
        "customer_stats:total_purchases",
        "customer_stats:avg_purchase_amount",
    ],
    entity_rows=[{"customer_id": 1001}]
).to_dict()

print(online_features)
```

### 特征工程流水线

```python
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
import joblib

# 定义特征处理流水线
numeric_features = ['age', 'income', 'account_balance']
categorical_features = ['gender', 'occupation', 'region']

numeric_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())
])

categorical_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
    ('onehot', OneHotEncoder(handle_unknown='ignore', sparse=False))
])

preprocessor = ColumnTransformer(
    transformers=[
        ('num', numeric_transformer, numeric_features),
        ('cat', categorical_transformer, categorical_features)
    ]
)

# 完整的 ML 流水线
full_pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('classifier', RandomForestClassifier(n_estimators=100))
])

# 训练流水线
full_pipeline.fit(X_train, y_train)

# 保存流水线（包含特征处理逻辑）
joblib.dump(full_pipeline, 'models/full_pipeline.pkl')

# 在生产环境中使用
loaded_pipeline = joblib.load('models/full_pipeline.pkl')
predictions = loaded_pipeline.predict(new_data)
```

## 模型服务

### TorchServe 部署

创建模型处理器（`handler.py`）：

```python
import torch
import torch.nn.functional as F
from ts.torch_handler.base_handler import BaseHandler
import json

class ImageClassificationHandler(BaseHandler):
    def __init__(self):
        super().__init__()
        self.initialized = False

    def initialize(self, context):
        """初始化模型"""
        self.manifest = context.manifest
        properties = context.system_properties
        model_dir = properties.get("model_dir")

        # 加载模型
        self.model = torch.jit.load(f"{model_dir}/model.pt")
        self.model.requires_grad_(False)

        # 加载类别映射
        with open(f"{model_dir}/index_to_name.json") as f:
            self.idx_to_class = json.load(f)

        self.initialized = True

    def preprocess(self, data):
        """预处理输入数据"""
        images = []
        for row in data:
            image = row.get("data") or row.get("body")
            if isinstance(image, (bytes, bytearray)):
                image = Image.open(io.BytesIO(image))

            # 标准化预处理
            transform = transforms.Compose([
                transforms.Resize(256),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225]
                )
            ])
            images.append(transform(image))

        return torch.stack(images)

    def inference(self, data):
        """模型推理"""
        with torch.no_grad():
            outputs = self.model(data)
            probs = F.softmax(outputs, dim=1)
        return probs

    def postprocess(self, inference_output):
        """后处理输出"""
        results = []
        for probs in inference_output:
            top5_prob, top5_idx = torch.topk(probs, 5)
            result = {
                self.idx_to_class[str(idx.item())]: prob.item()
                for prob, idx in zip(top5_prob, top5_idx)
            }
            results.append(result)
        return results
```

打包和启动服务：

```bash
# 创建 MAR 文件
torch-model-archiver \
    --model-name image_classifier \
    --version 1.0 \
    --serialized-file model.pt \
    --handler handler.py \
    --extra-files index_to_name.json \
    --export-path model_store

# 启动 TorchServe
torchserve --start \
    --model-store model_store \
    --models image_classifier=image_classifier.mar \
    --ts-config config.properties

# 测试推理
curl -X POST http://localhost:8080/predictions/image_classifier \
    -T test_image.jpg
```

### TensorFlow Serving

```python
# 保存 SavedModel 格式
import tensorflow as tf

model = tf.keras.models.load_model('my_model.h5')

# 导出为 SavedModel
tf.saved_model.save(model, 'models/my_model/1')

# 检查模型签名
# saved_model_cli show --dir models/my_model/1 --tag_set serve --signature_def serving_default
```

Docker 部署配置：

```yaml
# docker-compose.yml
version: '3'
services:
  tf-serving:
    image: tensorflow/serving:latest
    ports:
      - "8501:8501"
      - "8500:8500"
    volumes:
      - ./models:/models
    environment:
      - MODEL_NAME=my_model
    command: >
      --model_config_file=/models/models.config
      --enable_batching=true
      --batching_parameters_file=/models/batching.config

# models.config
model_config_list {
  config {
    name: 'my_model'
    base_path: '/models/my_model'
    model_platform: 'tensorflow'
    model_version_policy {
      specific {
        versions: 1
        versions: 2
      }
    }
  }
}

# batching.config
max_batch_size { value: 32 }
batch_timeout_micros { value: 5000 }
num_batch_threads { value: 4 }
max_enqueued_batches { value: 100 }
```

调用服务：

```python
import requests
import json
import numpy as np

# REST API 调用
def predict_rest(instances):
    url = "http://localhost:8501/v1/models/my_model:predict"
    payload = {"instances": instances}
    response = requests.post(url, json=payload)
    return response.json()["predictions"]

# gRPC 调用（更高性能）
import grpc
from tensorflow_serving.apis import predict_pb2
from tensorflow_serving.apis import prediction_service_pb2_grpc
import tensorflow as tf

def predict_grpc(instances):
    channel = grpc.insecure_channel('localhost:8500')
    stub = prediction_service_pb2_grpc.PredictionServiceStub(channel)

    request = predict_pb2.PredictRequest()
    request.model_spec.name = 'my_model'
    request.model_spec.signature_name = 'serving_default'
    request.inputs['input'].CopyFrom(
        tf.make_tensor_proto(instances, shape=instances.shape)
    )

    response = stub.Predict(request, timeout=10.0)
    return tf.make_ndarray(response.outputs['output'])

# 使用示例
test_data = np.random.randn(10, 224, 224, 3).astype(np.float32)
predictions = predict_grpc(test_data)
```

## CI/CD for ML

### GitHub Actions ML Pipeline

```yaml
# .github/workflows/ml-pipeline.yml
name: ML Pipeline

on:
  push:
    branches: [main]
    paths:
      - 'src/**'
      - 'data/**'
      - 'configs/**'
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-cov

      - name: Run unit tests
        run: pytest tests/unit --cov=src --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml

  data-validation:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v3

      - name: Set up DVC
        uses: iterative/setup-dvc@v1

      - name: Pull data
        run: dvc pull
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

      - name: Validate data schema
        run: python src/validate_data.py

  train:
    runs-on: ubuntu-latest
    needs: data-validation
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'

      - name: Pull data with DVC
        run: |
          pip install dvc[s3]
          dvc pull

      - name: Train model
        run: python src/train.py --config configs/train_config.yaml
        env:
          MLFLOW_TRACKING_URI: ${{ secrets.MLFLOW_TRACKING_URI }}

      - name: Upload model artifact
        uses: actions/upload-artifact@v3
        with:
          name: model
          path: models/

  model-validation:
    runs-on: ubuntu-latest
    needs: train
    steps:
      - uses: actions/checkout@v3

      - name: Download model
        uses: actions/download-artifact@v3
        with:
          name: model
          path: models/

      - name: Validate model performance
        run: python src/validate_model.py

      - name: Check model performance
        run: |
          python -c "
          import json
          with open('metrics.json') as f:
              metrics = json.load(f)
          assert metrics['accuracy'] > 0.85, 'Model accuracy below threshold'
          assert metrics['f1_score'] > 0.80, 'Model F1 score below threshold'
          "

  deploy-staging:
    runs-on: ubuntu-latest
    needs: model-validation
    if: github.ref == 'refs/heads/main'
    environment: staging
    steps:
      - name: Deploy to staging
        run: |
          # 部署到 staging 环境
          kubectl apply -f k8s/staging/

  deploy-production:
    runs-on: ubuntu-latest
    needs: deploy-staging
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - name: Deploy to production
        run: |
          # 金丝雀发布
          kubectl apply -f k8s/production/canary/
```

### 模型验证门控

```python
# src/model_validation.py
import json
import sys
from dataclasses import dataclass
from typing import Dict, Any

@dataclass
class ValidationResult:
    passed: bool
    metrics: Dict[str, float]
    checks: Dict[str, bool]
    message: str

def validate_model(metrics_path: str, thresholds: Dict[str, float]) -> ValidationResult:
    """验证模型是否满足部署条件"""

    with open(metrics_path) as f:
        metrics = json.load(f)

    checks = {}
    failed_checks = []

    # 性能指标检查
    for metric_name, threshold in thresholds.items():
        if metric_name in metrics:
            passed = metrics[metric_name] >= threshold
            checks[f"{metric_name}_threshold"] = passed
            if not passed:
                failed_checks.append(
                    f"{metric_name}: {metrics[metric_name]:.4f} < {threshold}"
                )

    # 模型大小检查
    model_size_mb = metrics.get("model_size_mb", 0)
    if model_size_mb > 500:  # 500MB 限制
        checks["model_size"] = False
        failed_checks.append(f"Model too large: {model_size_mb}MB > 500MB")
    else:
        checks["model_size"] = True

    # 推理延迟检查
    inference_latency_ms = metrics.get("inference_latency_p99_ms", 0)
    if inference_latency_ms > 100:  # 100ms P99 延迟限制
        checks["latency"] = False
        failed_checks.append(f"Latency too high: {inference_latency_ms}ms > 100ms")
    else:
        checks["latency"] = True

    all_passed = all(checks.values())

    return ValidationResult(
        passed=all_passed,
        metrics=metrics,
        checks=checks,
        message="All checks passed" if all_passed else f"Failed: {', '.join(failed_checks)}"
    )

if __name__ == "__main__":
    thresholds = {
        "accuracy": 0.85,
        "f1_score": 0.80,
        "auc_roc": 0.85
    }

    result = validate_model("metrics.json", thresholds)
    print(f"Validation: {'PASSED' if result.passed else 'FAILED'}")
    print(f"Message: {result.message}")

    if not result.passed:
        sys.exit(1)
```

## 模型监控与漂移检测

### 数据漂移检测

```python
import numpy as np
from scipy import stats
from typing import Dict, List, Tuple
import pandas as pd

class DriftDetector:
    def __init__(self, reference_data: pd.DataFrame):
        self.reference_data = reference_data
        self.reference_stats = self._compute_stats(reference_data)

    def _compute_stats(self, data: pd.DataFrame) -> Dict:
        """计算数据统计信息"""
        stats_dict = {}
        for col in data.columns:
            if data[col].dtype in ['float64', 'int64']:
                stats_dict[col] = {
                    'mean': data[col].mean(),
                    'std': data[col].std(),
                    'min': data[col].min(),
                    'max': data[col].max(),
                    'distribution': data[col].values
                }
            else:
                stats_dict[col] = {
                    'value_counts': data[col].value_counts(normalize=True).to_dict()
                }
        return stats_dict

    def detect_drift(self, current_data: pd.DataFrame,
                     threshold: float = 0.05) -> Dict[str, Dict]:
        """检测数据漂移"""
        results = {}

        for col in self.reference_data.columns:
            if col not in current_data.columns:
                continue

            if self.reference_data[col].dtype in ['float64', 'int64']:
                # 数值特征：使用 KS 检验
                ks_stat, p_value = stats.ks_2samp(
                    self.reference_stats[col]['distribution'],
                    current_data[col].values
                )

                drift_detected = p_value < threshold

                results[col] = {
                    'type': 'numerical',
                    'test': 'KS',
                    'statistic': ks_stat,
                    'p_value': p_value,
                    'drift_detected': drift_detected,
                    'reference_mean': self.reference_stats[col]['mean'],
                    'current_mean': current_data[col].mean()
                }
            else:
                # 类别特征：使用卡方检验
                ref_counts = self.reference_stats[col]['value_counts']
                curr_counts = current_data[col].value_counts(normalize=True).to_dict()

                # PSI (Population Stability Index) 计算
                psi = self._calculate_psi(ref_counts, curr_counts)
                drift_detected = psi > 0.2  # PSI > 0.2 表示显著漂移

                results[col] = {
                    'type': 'categorical',
                    'test': 'PSI',
                    'statistic': psi,
                    'drift_detected': drift_detected
                }

        return results

    def _calculate_psi(self, expected: Dict, actual: Dict) -> float:
        """计算 PSI (Population Stability Index)"""
        psi = 0.0
        all_categories = set(expected.keys()) | set(actual.keys())

        for cat in all_categories:
            e = expected.get(cat, 0.0001)  # 避免除零
            a = actual.get(cat, 0.0001)
            psi += (a - e) * np.log(a / e)

        return psi

# 使用示例
detector = DriftDetector(reference_data=training_data)
drift_results = detector.detect_drift(production_data)

for feature, result in drift_results.items():
    if result['drift_detected']:
        print(f"DRIFT DETECTED in {feature}: {result}")
```

### 模型性能监控

```python
import prometheus_client
from prometheus_client import Counter, Histogram, Gauge
import time
from functools import wraps

# 定义 Prometheus 指标
PREDICTION_COUNTER = Counter(
    'model_predictions_total',
    'Total number of predictions',
    ['model_name', 'model_version', 'prediction_class']
)

PREDICTION_LATENCY = Histogram(
    'model_prediction_latency_seconds',
    'Prediction latency in seconds',
    ['model_name', 'model_version'],
    buckets=[0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 1.0]
)

PREDICTION_CONFIDENCE = Histogram(
    'model_prediction_confidence',
    'Prediction confidence scores',
    ['model_name', 'model_version'],
    buckets=[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 0.99]
)

MODEL_ACCURACY = Gauge(
    'model_accuracy',
    'Model accuracy (updated periodically)',
    ['model_name', 'model_version']
)

class MonitoredModel:
    def __init__(self, model, model_name: str, model_version: str):
        self.model = model
        self.model_name = model_name
        self.model_version = model_version

    def predict(self, features):
        """带监控的预测方法"""
        start_time = time.time()

        # 执行预测
        predictions = self.model.predict(features)
        probabilities = self.model.predict_proba(features)

        # 记录延迟
        latency = time.time() - start_time
        PREDICTION_LATENCY.labels(
            model_name=self.model_name,
            model_version=self.model_version
        ).observe(latency)

        # 记录预测
        for pred, probs in zip(predictions, probabilities):
            PREDICTION_COUNTER.labels(
                model_name=self.model_name,
                model_version=self.model_version,
                prediction_class=str(pred)
            ).inc()

            # 记录置信度
            confidence = max(probs)
            PREDICTION_CONFIDENCE.labels(
                model_name=self.model_name,
                model_version=self.model_version
            ).observe(confidence)

        return predictions, probabilities

# Grafana Dashboard JSON (部分)
dashboard_config = {
    "panels": [
        {
            "title": "Prediction Latency P99",
            "type": "graph",
            "targets": [
                {
                    "expr": "histogram_quantile(0.99, rate(model_prediction_latency_seconds_bucket[5m]))",
                    "legendFormat": "{{model_name}}-{{model_version}}"
                }
            ]
        },
        {
            "title": "Predictions per Second",
            "type": "graph",
            "targets": [
                {
                    "expr": "rate(model_predictions_total[1m])",
                    "legendFormat": "{{model_name}}-{{prediction_class}}"
                }
            ]
        },
        {
            "title": "Low Confidence Predictions Rate",
            "type": "stat",
            "targets": [
                {
                    "expr": "sum(rate(model_prediction_confidence_bucket{le='0.5'}[5m])) / sum(rate(model_prediction_confidence_count[5m]))"
                }
            ]
        }
    ]
}
```

## A/B 测试与灰度发布

### A/B 测试框架

```python
import hashlib
import random
from typing import Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import json

@dataclass
class Experiment:
    name: str
    variants: Dict[str, float]  # variant_name -> traffic_percentage
    start_time: datetime
    end_time: Optional[datetime] = None

    def get_variant(self, user_id: str) -> str:
        """基于用户 ID 确定性地分配变体"""
        hash_input = f"{self.name}:{user_id}"
        hash_value = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
        bucket = (hash_value % 10000) / 10000.0

        cumulative = 0.0
        for variant, percentage in self.variants.items():
            cumulative += percentage
            if bucket < cumulative:
                return variant

        return list(self.variants.keys())[-1]

class ABTestingService:
    def __init__(self):
        self.experiments: Dict[str, Experiment] = {}
        self.models: Dict[str, Any] = {}
        self.results: Dict[str, Dict] = {}

    def create_experiment(self, name: str, variants: Dict[str, float]):
        """创建新实验"""
        assert abs(sum(variants.values()) - 1.0) < 0.001, "Traffic must sum to 100%"

        self.experiments[name] = Experiment(
            name=name,
            variants=variants,
            start_time=datetime.now()
        )
        self.results[name] = {v: {"impressions": 0, "conversions": 0} for v in variants}

    def register_model(self, variant_name: str, model):
        """注册模型变体"""
        self.models[variant_name] = model

    def get_prediction(self, experiment_name: str, user_id: str, features) -> Dict:
        """获取预测结果"""
        experiment = self.experiments[experiment_name]
        variant = experiment.get_variant(user_id)

        model = self.models[variant]
        prediction = model.predict(features)

        # 记录展示
        self.results[experiment_name][variant]["impressions"] += 1

        return {
            "variant": variant,
            "prediction": prediction,
            "experiment": experiment_name
        }

    def record_conversion(self, experiment_name: str, user_id: str):
        """记录转化"""
        experiment = self.experiments[experiment_name]
        variant = experiment.get_variant(user_id)
        self.results[experiment_name][variant]["conversions"] += 1

    def get_results(self, experiment_name: str) -> Dict:
        """获取实验结果"""
        results = self.results[experiment_name]

        analysis = {}
        for variant, data in results.items():
            impressions = data["impressions"]
            conversions = data["conversions"]
            conversion_rate = conversions / impressions if impressions > 0 else 0

            analysis[variant] = {
                "impressions": impressions,
                "conversions": conversions,
                "conversion_rate": conversion_rate
            }

        # 计算统计显著性
        if len(analysis) == 2:
            variants = list(analysis.keys())
            from scipy.stats import chi2_contingency

            table = [
                [analysis[variants[0]]["conversions"],
                 analysis[variants[0]]["impressions"] - analysis[variants[0]]["conversions"]],
                [analysis[variants[1]]["conversions"],
                 analysis[variants[1]]["impressions"] - analysis[variants[1]]["conversions"]]
            ]

            chi2, p_value, _, _ = chi2_contingency(table)
            analysis["statistical_significance"] = {
                "chi2": chi2,
                "p_value": p_value,
                "significant": p_value < 0.05
            }

        return analysis

# 使用示例
ab_service = ABTestingService()

# 创建实验：新模型 vs 旧模型
ab_service.create_experiment(
    name="churn_model_v2",
    variants={"control": 0.5, "treatment": 0.5}
)

ab_service.register_model("control", old_model)
ab_service.register_model("treatment", new_model)

# 在生产环境中使用
result = ab_service.get_prediction(
    experiment_name="churn_model_v2",
    user_id="user_12345",
    features=user_features
)
```

### Kubernetes 金丝雀发布

```yaml
# canary-deployment.yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: ml-model-rollout
spec:
  replicas: 10
  selector:
    matchLabels:
      app: ml-model
  template:
    metadata:
      labels:
        app: ml-model
    spec:
      containers:
      - name: ml-model
        image: ml-model:v2
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
  strategy:
    canary:
      steps:
      # 第一阶段：5% 流量
      - setWeight: 5
      - pause: {duration: 1h}
      - analysis:
          templates:
          - templateName: success-rate
          args:
          - name: service-name
            value: ml-model

      # 第二阶段：20% 流量
      - setWeight: 20
      - pause: {duration: 2h}
      - analysis:
          templates:
          - templateName: success-rate

      # 第三阶段：50% 流量
      - setWeight: 50
      - pause: {duration: 4h}
      - analysis:
          templates:
          - templateName: success-rate

      # 全量发布
      - setWeight: 100

---
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: success-rate
spec:
  args:
  - name: service-name
  metrics:
  - name: success-rate
    interval: 5m
    successCondition: result[0] >= 0.95
    failureLimit: 3
    provider:
      prometheus:
        address: http://prometheus:9090
        query: |
          sum(rate(
            http_requests_total{service="{{args.service-name}}",status=~"2.."}[5m]
          )) /
          sum(rate(
            http_requests_total{service="{{args.service-name}}"}[5m]
          ))

  - name: latency-p99
    interval: 5m
    successCondition: result[0] <= 0.1
    failureLimit: 3
    provider:
      prometheus:
        address: http://prometheus:9090
        query: |
          histogram_quantile(0.99,
            sum(rate(
              http_request_duration_seconds_bucket{service="{{args.service-name}}"}[5m]
            )) by (le)
          )
```

## 平台选型

### Kubeflow

Kubeflow 是基于 Kubernetes 的端到端 ML 平台：

```python
# Kubeflow Pipelines 定义
import kfp
from kfp import dsl
from kfp.components import func_to_container_op

@func_to_container_op
def preprocess_data(input_path: str, output_path: str) -> str:
    import pandas as pd
    from sklearn.preprocessing import StandardScaler

    df = pd.read_csv(input_path)
    scaler = StandardScaler()
    df_scaled = pd.DataFrame(scaler.fit_transform(df), columns=df.columns)
    df_scaled.to_csv(output_path, index=False)
    return output_path

@func_to_container_op
def train_model(data_path: str, model_path: str) -> str:
    import pandas as pd
    from sklearn.ensemble import RandomForestClassifier
    import joblib

    df = pd.read_csv(data_path)
    X = df.drop('target', axis=1)
    y = df['target']

    model = RandomForestClassifier(n_estimators=100)
    model.fit(X, y)
    joblib.dump(model, model_path)
    return model_path

@func_to_container_op
def validate_model(model_path: str, test_data_path: str) -> float:
    import pandas as pd
    from sklearn.metrics import accuracy_score
    import joblib

    model = joblib.load(model_path)
    df = pd.read_csv(test_data_path)
    X = df.drop('target', axis=1)
    y = df['target']

    predictions = model.predict(X)
    accuracy = accuracy_score(y, predictions)
    return accuracy

@func_to_container_op
def deploy_model(model_path: str, accuracy: float, threshold: float = 0.85):
    if accuracy >= threshold:
        print(f"Deploying model with accuracy {accuracy}")
        # 部署逻辑
    else:
        print(f"Model accuracy {accuracy} below threshold {threshold}")
        raise ValueError("Model not good enough for deployment")

@dsl.pipeline(
    name='ML Training Pipeline',
    description='End-to-end ML pipeline'
)
def ml_pipeline(
    input_data: str = 'gs://my-bucket/data/train.csv',
    test_data: str = 'gs://my-bucket/data/test.csv'
):
    # 数据预处理
    preprocess_task = preprocess_data(
        input_path=input_data,
        output_path='/tmp/processed_data.csv'
    )

    # 模型训练
    train_task = train_model(
        data_path=preprocess_task.output,
        model_path='/tmp/model.pkl'
    )

    # 模型验证
    validate_task = validate_model(
        model_path=train_task.output,
        test_data_path=test_data
    )

    # 条件部署
    deploy_task = deploy_model(
        model_path=train_task.output,
        accuracy=validate_task.output
    )

# 编译和提交 Pipeline
kfp.compiler.Compiler().compile(ml_pipeline, 'pipeline.yaml')

client = kfp.Client()
client.create_run_from_pipeline_func(
    ml_pipeline,
    arguments={
        'input_data': 'gs://my-bucket/data/train.csv',
        'test_data': 'gs://my-bucket/data/test.csv'
    }
)
```

### AWS SageMaker

```python
import sagemaker
from sagemaker.sklearn import SKLearn
from sagemaker.model_monitor import DataCaptureConfig
import boto3

# 初始化 SageMaker Session
session = sagemaker.Session()
role = sagemaker.get_execution_role()

# 定义训练脚本
sklearn_estimator = SKLearn(
    entry_point='train.py',
    source_dir='src',
    role=role,
    instance_count=1,
    instance_type='ml.m5.xlarge',
    framework_version='1.0-1',
    hyperparameters={
        'n_estimators': 100,
        'max_depth': 10
    }
)

# 训练模型
sklearn_estimator.fit({'train': 's3://my-bucket/train', 'test': 's3://my-bucket/test'})

# 配置数据捕获（用于模型监控）
data_capture_config = DataCaptureConfig(
    enable_capture=True,
    sampling_percentage=100,
    destination_s3_uri='s3://my-bucket/data-capture'
)

# 部署模型
predictor = sklearn_estimator.deploy(
    initial_instance_count=1,
    instance_type='ml.t2.medium',
    data_capture_config=data_capture_config
)

# 创建模型监控
from sagemaker.model_monitor import DefaultModelMonitor

my_monitor = DefaultModelMonitor(
    role=role,
    instance_count=1,
    instance_type='ml.m5.xlarge',
    volume_size_in_gb=20,
    max_runtime_in_seconds=3600
)

# 创建基线
my_monitor.suggest_baseline(
    baseline_dataset='s3://my-bucket/baseline-data/data.csv',
    dataset_format=DatasetFormat.csv(header=True),
    output_s3_uri='s3://my-bucket/baseline-results'
)

# 创建监控计划
from sagemaker.model_monitor import CronExpressionGenerator

my_monitor.create_monitoring_schedule(
    monitor_schedule_name='my-monitoring-schedule',
    endpoint_input=predictor.endpoint_name,
    output_s3_uri='s3://my-bucket/monitoring-results',
    statistics=my_monitor.baseline_statistics(),
    constraints=my_monitor.suggested_constraints(),
    schedule_cron_expression=CronExpressionGenerator.hourly()
)
```

### 平台对比

| 特性 | Kubeflow | SageMaker | MLflow |
|------|----------|-----------|--------|
| 部署方式 | 自托管 (K8s) | 托管服务 | 自托管/托管 |
| 学习曲线 | 陡峭 | 中等 | 平缓 |
| 成本 | 基础设施成本 | 按使用付费 | 低 |
| 灵活性 | 高 | 中 | 高 |
| 生态系统 | Kubernetes | AWS | 开源 |
| 适用场景 | 大规模 K8s 用户 | AWS 用户 | 通用 |

## 面试要点

### 常见面试问题

**Q1: 什么是 MLOps？为什么重要？**

MLOps 是将 ML 模型从实验推向生产并持续维护的工程实践。重要性：
- 缩短模型上线周期
- 提高模型可靠性
- 实现持续改进
- 降低运维成本

**Q2: 如何检测模型漂移？**

```python
# 数据漂移：比较训练数据和生产数据的分布
# - KS 检验（连续变量）
# - 卡方检验（类别变量）
# - PSI（Population Stability Index）

# 概念漂移：监控模型性能指标
# - 准确率下降
# - 预测分布变化
# - 特征重要性变化
```

**Q3: 如何设计 ML 系统的 CI/CD？**

关键步骤：
1. 代码测试（单元测试、集成测试）
2. 数据验证（schema、质量、漂移）
3. 模型训练（自动化 pipeline）
4. 模型验证（性能门控、偏差检测）
5. 部署（蓝绿/金丝雀）
6. 监控（性能、数据、基础设施）

**Q4: 特征存储的作用是什么？**

- **特征复用**：避免重复计算
- **一致性**：训练和推理使用相同特征
- **时间旅行**：获取历史时间点的特征
- **特征发现**：团队间共享特征

**Q5: 如何处理模型服务的延迟问题？**

```python
# 优化策略：
# 模型优化
#    - 量化（INT8/FP16）
#    - 剪枝
#    - 知识蒸馏

# 推理优化
#    - 批处理
#    - 异步推理
#    - 模型缓存

# 基础设施
#    - GPU 加速
#    - 模型并行
#    - 边缘部署
```

### 实战经验总结

1. **从简单开始**：先实现 MLOps Level 0，再逐步自动化
2. **监控优先**：没有监控的模型不应上生产
3. **可复现性**：所有实验必须可复现
4. **渐进发布**：始终使用金丝雀或蓝绿部署
5. **数据版本化**：数据和模型同等重要
6. **特征工程标准化**：投资特征存储
7. **自动化测试**：包括数据测试和模型测试

### MLOps 技术栈选型建议

| 场景 | 推荐方案 |
|------|----------|
| 初创团队 | MLflow + GitHub Actions + Docker |
| 中型团队 | MLflow + Kubeflow + Feast |
| AWS 用户 | SageMaker 全家桶 |
| GCP 用户 | Vertex AI |
| 大规模团队 | 自建平台 + 开源组件 |

## 总结

MLOps 是现代 ML 工程的核心实践，涵盖从实验管理到生产监控的完整生命周期。掌握 MLOps 需要理解：

1. **实验追踪**：使用 MLflow 或 W&B 记录实验
2. **版本管理**：模型和数据的版本控制
3. **特征存储**：实现特征复用和一致性
4. **模型服务**：高效可靠的推理服务
5. **CI/CD**：自动化 ML 流水线
6. **监控与漂移**：持续监控模型性能
7. **渐进发布**：A/B 测试和金丝雀发布

随着 ML 应用的普及，MLOps 工程师的需求将持续增长。建议读者在实践中不断积累经验，构建自己的 MLOps 知识体系。
