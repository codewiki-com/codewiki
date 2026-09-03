---
title: 实验管理：MLflow与Weights & Biases
description: 掌握ML实验追踪工具：MLflow和W&B的使用与对比
track: datascience
section: evaluation
difficulty: intermediate
tags:
  - MLflow
  - W&B
  - 实验追踪
  - MLOps
status: imported
origin: old/src/content/docs/datascience/mlflow-wandb.zh.md
divergence: 0.219
issues: []
legacy:
  category: DataScience
  subcategory: Experiment
  order: 41
  lastUpdated: 2026-01-07
---

在机器学习项目中，实验管理是一个经常被忽视但至关重要的环节。随着模型迭代次数的增加，如何系统地追踪参数、指标、模型版本和数据集变得越来越复杂。本文将深入介绍两款主流的实验追踪工具——MLflow和Weights & Biases（W&B），帮助你建立规范的MLOps实践。

---

## 实验追踪的重要性

### 为什么需要实验追踪

在机器学习开发过程中，数据科学家通常会进行大量实验：

- 尝试不同的模型架构
- 调整超参数组合
- 使用不同的数据预处理方法
- 比较各种特征工程策略

如果没有系统的实验追踪，很快就会面临以下问题：

```
# 典型的"实验管理混乱"场景
models/
├── model_v1.pkl
├── model_v2_final.pkl
├── model_v2_final_v2.pkl
├── model_best.pkl
├── model_best_new.pkl
├── model_best_really_final.pkl
└── model_dont_delete.pkl
```

### 实验追踪解决的核心问题

| 问题 | 描述 | 解决方案 |
|------|------|----------|
| 可重复性 | 无法复现之前的实验结果 | 记录所有参数、代码版本、数据版本 |
| 可比较性 | 难以比较不同实验的效果 | 统一的指标记录和可视化 |
| 可追溯性 | 不知道生产模型的来源 | 完整的实验血缘追踪 |
| 协作性 | 团队成员难以共享实验 | 集中式实验管理平台 |

### 实验追踪的关键要素

一个完整的实验追踪系统应该记录：

```python
# 实验追踪应该记录的核心信息
experiment_record = {
    # 1. 基本信息
    "experiment_name": "sentiment_classification_v2",
    "run_id": "abc123",
    "timestamp": "2024-01-15 10:30:00",
    "user": "alice",

    # 2. 超参数
    "parameters": {
        "learning_rate": 0.001,
        "batch_size": 32,
        "epochs": 100,
        "model_type": "transformer",
        "hidden_size": 256,
        "dropout": 0.3
    },

    # 3. 指标
    "metrics": {
        "train_loss": 0.234,
        "val_loss": 0.312,
        "val_accuracy": 0.892,
        "val_f1": 0.876,
        "inference_time_ms": 12.5
    },

    # 4. 产出物
    "artifacts": {
        "model": "model.pkl",
        "config": "config.yaml",
        "plots": ["loss_curve.png", "confusion_matrix.png"]
    },

    # 5. 环境信息
    "environment": {
        "python_version": "3.9.7",
        "pytorch_version": "2.0.1",
        "cuda_version": "11.8",
        "git_commit": "a1b2c3d"
    }
}
```

---

## MLflow核心组件

MLflow是一个开源的机器学习生命周期管理平台，由Databricks开发。它包含四个核心组件：

### MLflow架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                         MLflow                               │
├─────────────┬─────────────┬─────────────┬──────────────────┤
│   Tracking  │   Projects  │   Models    │   Model Registry │
├─────────────┼─────────────┼─────────────┼──────────────────┤
│ 记录实验    │ 打包代码    │ 模型部署    │ 模型版本管理     │
│ 参数/指标   │ 可重复运行  │ 多框架支持  │ 阶段转换         │
│ 产出物      │ 依赖管理    │ 统一格式    │ 审批流程         │
└─────────────┴─────────────┴─────────────┴──────────────────┘
```

### 安装与基础配置

```bash
# 安装MLflow
pip install mlflow

# 启动MLflow UI（本地使用）
mlflow ui --port 5000

# 或使用远程tracking server
mlflow server \
    --backend-store-uri postgresql://user:password@localhost/mlflow \
    --default-artifact-root s3://my-mlflow-bucket/ \
    --host 0.0.0.0 \
    --port 5000
```

```python
import mlflow

# 设置tracking URI（可选，默认使用本地./mlruns目录）
mlflow.set_tracking_uri("http://localhost:5000")

# 或使用环境变量
# export MLFLOW_TRACKING_URI=http://localhost:5000
```

---

## MLflow Tracking

MLflow Tracking是最常用的组件，用于记录和查询实验。

### 基础使用

```python
import mlflow
import mlflow.sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score

# 加载数据
iris = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    iris.data, iris.target, test_size=0.2, random_state=42
)

# 设置实验名称
mlflow.set_experiment("iris_classification")

# 开始一次实验运行
with mlflow.start_run(run_name="random_forest_baseline"):
    # 定义超参数
    n_estimators = 100
    max_depth = 5
    min_samples_split = 2

    # 记录参数
    mlflow.log_param("n_estimators", n_estimators)
    mlflow.log_param("max_depth", max_depth)
    mlflow.log_param("min_samples_split", min_samples_split)

    # 训练模型
    model = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth,
        min_samples_split=min_samples_split,
        random_state=42
    )
    model.fit(X_train, y_train)

    # 预测并计算指标
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average='weighted')

    # 记录指标
    mlflow.log_metric("accuracy", accuracy)
    mlflow.log_metric("f1_score", f1)

    # 记录模型
    mlflow.sklearn.log_model(model, "model")

    # 记录特征重要性图
    import matplotlib.pyplot as plt
    import numpy as np

    fig, ax = plt.subplots(figsize=(10, 6))
    feature_importance = model.feature_importances_
    ax.barh(range(len(feature_importance)), feature_importance)
    ax.set_yticks(range(len(feature_importance)))
    ax.set_yticklabels(iris.feature_names)
    ax.set_xlabel('Feature Importance')
    ax.set_title('Random Forest Feature Importance')
    plt.tight_layout()
    plt.savefig("feature_importance.png")

    # 记录图片产出物
    mlflow.log_artifact("feature_importance.png")

    print(f"Run ID: {mlflow.active_run().info.run_id}")
    print(f"Accuracy: {accuracy:.4f}")
    print(f"F1 Score: {f1:.4f}")
```

### 批量记录参数和指标

```python
import mlflow

with mlflow.start_run():
    # 批量记录参数
    params = {
        "learning_rate": 0.001,
        "batch_size": 32,
        "epochs": 100,
        "optimizer": "adam",
        "hidden_layers": [256, 128, 64]
    }
    mlflow.log_params(params)

    # 记录训练过程中的指标（带步数）
    for epoch in range(100):
        train_loss = 1.0 / (epoch + 1)  # 模拟训练损失
        val_loss = 1.2 / (epoch + 1)    # 模拟验证损失

        mlflow.log_metric("train_loss", train_loss, step=epoch)
        mlflow.log_metric("val_loss", val_loss, step=epoch)

    # 批量记录最终指标
    final_metrics = {
        "final_train_loss": 0.01,
        "final_val_loss": 0.02,
        "best_accuracy": 0.95
    }
    mlflow.log_metrics(final_metrics)
```

### 记录产出物（Artifacts）

```python
import mlflow
import json
import pandas as pd

with mlflow.start_run():
    # 记录单个文件
    mlflow.log_artifact("config.yaml")

    # 记录目录
    mlflow.log_artifacts("./plots", artifact_path="visualizations")

    # 记录字典为JSON
    config = {"model": "transformer", "version": "1.0"}
    with open("config.json", "w") as f:
        json.dump(config, f)
    mlflow.log_artifact("config.json")

    # 记录DataFrame
    df = pd.DataFrame({"feature": ["a", "b"], "importance": [0.8, 0.2]})
    df.to_csv("feature_importance.csv", index=False)
    mlflow.log_artifact("feature_importance.csv")

    # 使用log_text记录文本（MLflow 1.25+）
    mlflow.log_text("This is a summary of the experiment.", "summary.txt")

    # 使用log_dict记录字典（MLflow 1.25+）
    mlflow.log_dict({"key": "value"}, "metadata.json")
```

### 自动日志记录（Autologging）

MLflow支持多个框架的自动日志记录：

```python
import mlflow

# 启用sklearn自动日志
mlflow.sklearn.autolog()

# 启用PyTorch自动日志
mlflow.pytorch.autolog()

# 启用TensorFlow/Keras自动日志
mlflow.tensorflow.autolog()

# 启用XGBoost自动日志
mlflow.xgboost.autolog()

# 启用LightGBM自动日志
mlflow.lightgbm.autolog()

# 示例：sklearn自动日志
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split

mlflow.sklearn.autolog()

iris = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    iris.data, iris.target, test_size=0.2
)

with mlflow.start_run():
    # 自动记录所有参数、指标和模型
    model = RandomForestClassifier(n_estimators=100, max_depth=5)
    model.fit(X_train, y_train)
    # MLflow自动记录：
    # - 所有超参数
    # - 训练指标（如果有）
    # - 特征重要性
    # - 模型本身
```

### PyTorch集成示例

```python
import mlflow
import mlflow.pytorch
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

class SimpleNN(nn.Module):
    def __init__(self, input_size, hidden_size, output_size):
        super().__init__()
        self.fc1 = nn.Linear(input_size, hidden_size)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        x = self.fc1(x)
        x = self.relu(x)
        x = self.fc2(x)
        return x

def train_model():
    # 设置实验
    mlflow.set_experiment("pytorch_experiment")

    # 超参数
    params = {
        "input_size": 10,
        "hidden_size": 64,
        "output_size": 3,
        "learning_rate": 0.001,
        "epochs": 50,
        "batch_size": 32
    }

    with mlflow.start_run():
        # 记录参数
        mlflow.log_params(params)

        # 创建模型
        model = SimpleNN(
            params["input_size"],
            params["hidden_size"],
            params["output_size"]
        )

        criterion = nn.CrossEntropyLoss()
        optimizer = optim.Adam(model.parameters(), lr=params["learning_rate"])

        # 模拟数据
        X = torch.randn(1000, params["input_size"])
        y = torch.randint(0, params["output_size"], (1000,))
        dataset = TensorDataset(X, y)
        dataloader = DataLoader(dataset, batch_size=params["batch_size"], shuffle=True)

        # 训练循环
        for epoch in range(params["epochs"]):
            total_loss = 0
            for batch_X, batch_y in dataloader:
                optimizer.zero_grad()
                outputs = model(batch_X)
                loss = criterion(outputs, batch_y)
                loss.backward()
                optimizer.step()
                total_loss += loss.item()

            avg_loss = total_loss / len(dataloader)
            mlflow.log_metric("train_loss", avg_loss, step=epoch)

            if (epoch + 1) % 10 == 0:
                print(f"Epoch [{epoch+1}/{params['epochs']}], Loss: {avg_loss:.4f}")

        # 记录模型
        mlflow.pytorch.log_model(model, "model")

        # 记录模型签名（输入输出格式）
        from mlflow.models.signature import infer_signature
        signature = infer_signature(X.numpy(), model(X).detach().numpy())
        mlflow.pytorch.log_model(model, "model_with_signature", signature=signature)

        print(f"Model saved in run {mlflow.active_run().info.run_id}")

if __name__ == "__main__":
    train_model()
```

### 查询和比较实验

```python
import mlflow
from mlflow.tracking import MlflowClient

client = MlflowClient()

# 获取实验信息
experiment = client.get_experiment_by_name("iris_classification")
print(f"Experiment ID: {experiment.experiment_id}")

# 搜索运行记录
runs = mlflow.search_runs(
    experiment_ids=[experiment.experiment_id],
    filter_string="metrics.accuracy > 0.9",
    order_by=["metrics.accuracy DESC"],
    max_results=10
)
print(runs[["run_id", "params.n_estimators", "metrics.accuracy"]])

# 获取特定运行的详细信息
run = client.get_run("abc123")
print(f"Parameters: {run.data.params}")
print(f"Metrics: {run.data.metrics}")

# 下载产出物
client.download_artifacts("abc123", "model", "./downloaded_model")

# 加载已保存的模型
loaded_model = mlflow.sklearn.load_model("runs:/abc123/model")
```

---

## MLflow Projects

MLflow Projects提供了一种标准化的方式来打包和运行机器学习代码。

### 项目结构

```
my_ml_project/
├── MLproject              # 项目配置文件
├── conda.yaml             # Conda环境定义
├── requirements.txt       # pip依赖（可选）
├── train.py              # 训练脚本
├── assess.py             # 评估脚本
└── data/
    └── dataset.csv
```

### MLproject文件

```yaml
# MLproject
name: my_ml_project

# 使用Conda环境
conda_env: conda.yaml

# 或使用Docker
# docker_env:
#   image: my-docker-image:latest

# 定义入口点
entry_points:
  main:
    parameters:
      learning_rate: {type: float, default: 0.001}
      epochs: {type: int, default: 100}
      batch_size: {type: int, default: 32}
      data_path: {type: str, default: "data/dataset.csv"}
    command: "python train.py --lr {learning_rate} --epochs {epochs} --batch-size {batch_size} --data {data_path}"

  assess:
    parameters:
      model_path: {type: str}
      test_data: {type: str}
    command: "python assess.py --model {model_path} --test-data {test_data}"
```

### Conda环境文件

```yaml
# conda.yaml
name: my_ml_project
channels:
  - defaults
  - conda-forge
dependencies:
  - python=3.9
  - pip
  - numpy>=1.21
  - pandas>=1.3
  - scikit-learn>=1.0
  - pip:
    - mlflow>=2.0
    - torch>=2.0
```

### 训练脚本示例

```python
# train.py
import argparse
import mlflow
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import accuracy_score, f1_score

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--lr", type=float, default=0.1)
    parser.add_argument("--epochs", type=int, default=100)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--data", type=str, required=True)
    return parser.parse_args()

def main():
    args = parse_args()

    # 加载数据
    df = pd.read_csv(args.data)
    X = df.drop("target", axis=1)
    y = df["target"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

    with mlflow.start_run():
        # 记录参数
        mlflow.log_param("learning_rate", args.lr)
        mlflow.log_param("n_estimators", args.epochs)

        # 训练模型
        model = GradientBoostingClassifier(
            learning_rate=args.lr,
            n_estimators=args.epochs
        )
        model.fit(X_train, y_train)

        # 评估
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred, average='weighted')

        mlflow.log_metric("accuracy", accuracy)
        mlflow.log_metric("f1_score", f1)

        # 保存模型
        mlflow.sklearn.log_model(model, "model")

        print(f"Accuracy: {accuracy:.4f}")

if __name__ == "__main__":
    main()
```

### 运行MLflow Projects

```bash
# 本地运行
mlflow run . -P learning_rate=0.01 -P epochs=200

# 从Git仓库运行
mlflow run https://github.com/user/ml-project.git -P learning_rate=0.01

# 指定入口点
mlflow run . -e assess -P model_path=./model -P test_data=./test.csv

# 使用特定环境
mlflow run . --env-manager=conda

# 后台运行
mlflow run . --backend local &
```

```python
# 通过Python API运行
import mlflow

submitted_run = mlflow.run(
    uri=".",
    entry_point="main",
    parameters={
        "learning_rate": 0.01,
        "epochs": 200
    },
    env_manager="conda"
)

print(f"Run ID: {submitted_run.run_id}")
```

---

## MLflow Models

MLflow Models提供了标准化的模型打包格式，支持多种部署方式。

### 模型格式（MLmodel文件）

```yaml
# MLmodel
artifact_path: model
flavors:
  python_function:
    env: conda.yaml
    loader_module: mlflow.sklearn
    model_path: model.pkl
    python_version: 3.9.7
  sklearn:
    code: null
    pickled_model: model.pkl
    serialization_format: cloudpickle
    sklearn_version: 1.0.2
mlflow_version: 2.0.1
model_uuid: abc123
signature:
  inputs: '[{"name": "feature1", "type": "double"}, {"name": "feature2", "type": "double"}]'
  outputs: '[{"type": "long"}]'
```

### 模型签名和输入示例

```python
import mlflow
from mlflow.models.signature import ModelSignature, infer_signature
from mlflow.types.schema import Schema, ColSpec
import pandas as pd
import numpy as np

# 方法1：自动推断签名
X_train = pd.DataFrame({
    "feature1": [1.0, 2.0, 3.0],
    "feature2": [4.0, 5.0, 6.0]
})
y_train = np.array([0, 1, 0])

model.fit(X_train, y_train)
signature = infer_signature(X_train, model.predict(X_train))

mlflow.sklearn.log_model(model, "model", signature=signature)

# 方法2：手动定义签名
input_schema = Schema([
    ColSpec("double", "feature1"),
    ColSpec("double", "feature2")
])
output_schema = Schema([ColSpec("long")])
signature = ModelSignature(inputs=input_schema, outputs=output_schema)

# 添加输入示例（用于模型验证和文档）
input_example = X_train.iloc[:3]
mlflow.sklearn.log_model(
    model,
    "model",
    signature=signature,
    input_example=input_example
)
```

### 自定义模型（PyFunc）

```python
import mlflow
import mlflow.pyfunc
import pandas as pd
import numpy as np

class CustomModel(mlflow.pyfunc.PythonModel):
    """自定义模型包装器"""

    def __init__(self, preprocessing_params=None):
        self.preprocessing_params = preprocessing_params or {}

    def load_context(self, context):
        """加载模型时调用，用于初始化"""
        import joblib
        # 加载任何需要的产出物
        self.model = joblib.load(context.artifacts["model"])
        self.scaler = joblib.load(context.artifacts["scaler"])

    def predict(self, context, model_input):
        """预测方法"""
        # 预处理
        if isinstance(model_input, pd.DataFrame):
            X = model_input.values
        else:
            X = model_input

        X_scaled = self.scaler.transform(X)

        # 预测
        predictions = self.model.predict(X_scaled)

        # 后处理
        return pd.DataFrame({"prediction": predictions})

# 保存自定义模型
import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier

# 训练模型和scaler
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_train)
model = RandomForestClassifier().fit(X_scaled, y_train)

# 保存artifacts
joblib.dump(model, "model.pkl")
joblib.dump(scaler, "scaler.pkl")

# 记录自定义模型
artifacts = {
    "model": "model.pkl",
    "scaler": "scaler.pkl"
}

with mlflow.start_run():
    mlflow.pyfunc.log_model(
        artifact_path="custom_model",
        python_model=CustomModel(),
        artifacts=artifacts,
        conda_env={
            "channels": ["defaults"],
            "dependencies": [
                "python=3.9",
                "scikit-learn",
                "pandas",
                "joblib"
            ]
        }
    )
```

### 模型部署

```python
# 本地加载和预测
model = mlflow.pyfunc.load_model("runs:/abc123/model")
predictions = model.predict(X_test)

# 作为REST API部署
# mlflow models serve -m runs:/abc123/model -p 5001

# 生成Docker镜像
# mlflow models build-docker -m runs:/abc123/model -n my-model-image

# 部署到云平台
# mlflow deployments create -t sagemaker -m runs:/abc123/model
```

### Model Registry（模型注册中心）

```python
import mlflow
from mlflow.tracking import MlflowClient

client = MlflowClient()

# 注册模型
result = mlflow.register_model(
    model_uri="runs:/abc123/model",
    name="iris_classifier"
)

# 查看注册的模型
for rm in client.search_registered_models():
    print(f"Model: {rm.name}")
    for mv in rm.latest_versions:
        print(f"  Version: {mv.version}, Stage: {mv.current_stage}")

# 更新模型版本状态
client.transition_model_version_stage(
    name="iris_classifier",
    version=1,
    stage="Production"  # None, Staging, Production, Archived
)

# 添加模型描述
client.update_registered_model(
    name="iris_classifier",
    description="Iris flower classification model using Random Forest"
)

# 添加版本描述
client.update_model_version(
    name="iris_classifier",
    version=1,
    description="Initial version with 95% accuracy"
)

# 加载生产环境模型
model = mlflow.pyfunc.load_model("models:/iris_classifier/Production")
predictions = model.predict(X_test)

# 或加载特定版本
model = mlflow.pyfunc.load_model("models:/iris_classifier/1")
```

---

## Weights & Biases入门

Weights & Biases（W&B）是一个功能丰富的MLOps平台，提供实验追踪、数据集版本管理、模型管理等功能。

### 安装与配置

```bash
# 安装wandb
pip install wandb

# 登录（获取API key: https://wandb.ai/authorize）
wandb login
```

```python
import wandb

# 初始化项目
wandb.init(
    project="my-ml-project",      # 项目名称
    entity="my-team",             # 团队/用户名（可选）
    name="experiment-001",        # 运行名称
    tags=["baseline", "cnn"],     # 标签
    notes="First baseline model", # 备注
    config={                      # 超参数配置
        "learning_rate": 0.001,
        "epochs": 100,
        "batch_size": 32
    }
)
```

### 基础实验追踪

```python
import wandb
import random

# 初始化
wandb.init(project="demo-project", name="basic-run")

# 记录配置
config = wandb.config
config.learning_rate = 0.001
config.epochs = 100
config.batch_size = 32
config.architecture = "ResNet50"

# 模拟训练循环
for epoch in range(config.epochs):
    # 模拟指标
    train_loss = 1.0 / (epoch + 1) + random.uniform(0, 0.1)
    val_loss = 1.2 / (epoch + 1) + random.uniform(0, 0.1)
    accuracy = 1 - val_loss + random.uniform(0, 0.05)

    # 记录指标
    wandb.log({
        "epoch": epoch,
        "train/loss": train_loss,
        "val/loss": val_loss,
        "val/accuracy": accuracy,
        "learning_rate": config.learning_rate * (0.95 ** epoch)  # 学习率衰减
    })

# 记录最终指标
wandb.run.summary["best_accuracy"] = 0.95
wandb.run.summary["best_epoch"] = 87

# 结束运行
wandb.finish()
```

### PyTorch集成

```python
import wandb
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms

def train():
    # 初始化wandb
    wandb.init(
        project="pytorch-mnist",
        config={
            "learning_rate": 0.001,
            "epochs": 10,
            "batch_size": 64,
            "hidden_size": 128,
            "dropout": 0.2
        }
    )
    config = wandb.config

    # 数据加载
    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.1307,), (0.3081,))
    ])

    train_dataset = datasets.MNIST('./data', train=True, download=True, transform=transform)
    test_dataset = datasets.MNIST('./data', train=False, transform=transform)

    train_loader = DataLoader(train_dataset, batch_size=config.batch_size, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=config.batch_size)

    # 定义模型
    class Net(nn.Module):
        def __init__(self):
            super().__init__()
            self.fc1 = nn.Linear(784, config.hidden_size)
            self.dropout = nn.Dropout(config.dropout)
            self.fc2 = nn.Linear(config.hidden_size, 10)

        def forward(self, x):
            x = x.view(-1, 784)
            x = torch.relu(self.fc1(x))
            x = self.dropout(x)
            x = self.fc2(x)
            return x

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = Net().to(device)

    # 监控模型梯度和参数
    wandb.watch(model, log="all", log_freq=100)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=config.learning_rate)

    # 训练循环
    for epoch in range(config.epochs):
        model.train()
        train_loss = 0
        correct = 0
        total = 0

        for batch_idx, (data, target) in enumerate(train_loader):
            data, target = data.to(device), target.to(device)

            optimizer.zero_grad()
            output = model(data)
            loss = criterion(output, target)
            loss.backward()
            optimizer.step()

            train_loss += loss.item()
            pred = output.argmax(dim=1)
            correct += pred.eq(target).sum().item()
            total += target.size(0)

            # 每100个batch记录一次
            if batch_idx % 100 == 0:
                wandb.log({
                    "batch_loss": loss.item(),
                    "batch_accuracy": correct / total
                })

        # 测试阶段
        model.train(False)
        test_loss = 0
        test_correct = 0
        test_total = 0

        with torch.no_grad():
            for data, target in test_loader:
                data, target = data.to(device), target.to(device)
                output = model(data)
                test_loss += criterion(output, target).item()
                pred = output.argmax(dim=1)
                test_correct += pred.eq(target).sum().item()
                test_total += target.size(0)

        # 记录epoch指标
        wandb.log({
            "epoch": epoch,
            "train/loss": train_loss / len(train_loader),
            "train/accuracy": correct / total,
            "test/loss": test_loss / len(test_loader),
            "test/accuracy": test_correct / test_total
        })

        print(f"Epoch {epoch}: Test Accuracy: {test_correct/test_total:.4f}")

    # 保存模型到wandb
    torch.save(model.state_dict(), "model.pth")
    wandb.save("model.pth")

    wandb.finish()

if __name__ == "__main__":
    train()
```

### 记录丰富的媒体

```python
import wandb
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image

wandb.init(project="media-demo")

# 记录图像
images = np.random.rand(16, 28, 28)
wandb.log({"examples": [wandb.Image(img, caption=f"Image {i}")
                        for i, img in enumerate(images)]})

# 记录带标注的图像
image = Image.open("test_image.jpg")
wandb.log({
    "predictions": wandb.Image(image, boxes={
        "predictions": {
            "box_data": [
                {"position": {"minX": 0.1, "maxX": 0.5, "minY": 0.2, "maxY": 0.8},
                 "class_id": 1,
                 "scores": {"confidence": 0.95}}
            ],
            "class_labels": {1: "cat", 2: "dog"}
        }
    })
})

# 记录matplotlib图表
fig, ax = plt.subplots()
ax.plot([1, 2, 3, 4], [1, 4, 2, 3])
ax.set_title("Training Progress")
wandb.log({"chart": wandb.Image(fig)})
plt.close()

# 记录plotly图表
import plotly.express as px
df = px.data.iris()
fig = px.scatter(df, x="sepal_width", y="sepal_length", color="species")
wandb.log({"plotly_chart": fig})

# 记录表格
table = wandb.Table(columns=["id", "prediction", "ground_truth"])
for i in range(10):
    table.add_data(i, f"pred_{i}", f"gt_{i}")
wandb.log({"predictions_table": table})

# 记录混淆矩阵
y_true = [0, 1, 2, 0, 1, 2, 0, 1, 2]
y_pred = [0, 1, 1, 0, 1, 2, 0, 2, 2]
class_names = ["cat", "dog", "bird"]
wandb.log({"confusion_matrix": wandb.plot.confusion_matrix(
    y_true=y_true,
    preds=y_pred,
    class_names=class_names
)})

# 记录PR曲线
wandb.log({"pr_curve": wandb.plot.pr_curve(
    y_true=np.array([0, 0, 1, 1]),
    y_probas=np.array([[0.9, 0.1], [0.8, 0.2], [0.3, 0.7], [0.2, 0.8]]),
    labels=["negative", "positive"]
)})

# 记录音频
audio = np.random.randn(16000)  # 1秒音频，16kHz
wandb.log({"audio": wandb.Audio(audio, sample_rate=16000, caption="Generated audio")})

# 记录3D点云
point_cloud = np.random.randn(100, 3)
wandb.log({"point_cloud": wandb.Object3D(point_cloud)})

wandb.finish()
```

### Artifacts（数据和模型版本管理）

```python
import wandb
import pandas as pd

# 创建和记录数据集artifact
def log_dataset():
    wandb.init(project="artifact-demo", job_type="data-preparation")

    # 创建数据集
    df = pd.DataFrame({
        "feature1": range(1000),
        "feature2": range(1000, 2000),
        "label": [i % 2 for i in range(1000)]
    })
    df.to_csv("dataset.csv", index=False)

    # 创建artifact
    artifact = wandb.Artifact(
        name="my-dataset",
        type="dataset",
        description="Training dataset for classification",
        metadata={"num_samples": 1000, "num_features": 2}
    )

    # 添加文件
    artifact.add_file("dataset.csv")

    # 记录artifact
    wandb.log_artifact(artifact)

    wandb.finish()

# 使用数据集artifact进行训练
def train_with_artifact():
    wandb.init(project="artifact-demo", job_type="training")

    # 获取artifact
    artifact = wandb.use_artifact("my-dataset:latest")
    artifact_dir = artifact.download()

    # 加载数据
    df = pd.read_csv(f"{artifact_dir}/dataset.csv")

    # 训练模型...
    # ...

    # 保存模型artifact
    model_artifact = wandb.Artifact(
        name="trained-model",
        type="model",
        description="Trained classification model",
        metadata={"accuracy": 0.95, "framework": "sklearn"}
    )

    # 假设我们保存了模型
    # joblib.dump(model, "model.pkl")
    model_artifact.add_file("model.pkl")

    # 记录模型artifact，并关联到数据集
    wandb.log_artifact(model_artifact)

    wandb.finish()

# 使用特定版本的artifact
def use_specific_version():
    wandb.init(project="artifact-demo", job_type="inference")

    # 使用特定版本
    artifact = wandb.use_artifact("my-dataset:v2")

    # 或使用别名
    artifact = wandb.use_artifact("trained-model:best")

    wandb.finish()

# 添加artifact别名
def add_alias():
    api = wandb.Api()
    artifact = api.artifact("my-team/artifact-demo/trained-model:v3")
    artifact.aliases.append("production")
    artifact.save()
```

---

## W&B Sweeps超参数搜索

W&B Sweeps提供了强大的超参数搜索功能。

### 定义Sweep配置

```python
import wandb

# 方法1：使用字典配置
sweep_config = {
    "name": "hyperparameter-sweep",
    "method": "bayes",  # grid, random, bayes
    "metric": {
        "name": "val/accuracy",
        "goal": "maximize"
    },
    "parameters": {
        "learning_rate": {
            "distribution": "log_uniform_values",
            "min": 1e-5,
            "max": 1e-2
        },
        "batch_size": {
            "values": [16, 32, 64, 128]
        },
        "epochs": {
            "value": 50  # 固定值
        },
        "hidden_size": {
            "distribution": "int_uniform",
            "min": 64,
            "max": 512
        },
        "dropout": {
            "distribution": "uniform",
            "min": 0.1,
            "max": 0.5
        },
        "optimizer": {
            "values": ["adam", "sgd", "adamw"]
        }
    },
    "early_terminate": {
        "type": "hyperband",
        "min_iter": 5,
        "eta": 2
    }
}

# 创建sweep
sweep_id = wandb.sweep(sweep_config, project="sweep-demo")
print(f"Sweep ID: {sweep_id}")
```

### Sweep训练函数

```python
import wandb
import torch
import torch.nn as nn
import torch.optim as optim

def train_sweep():
    """Sweep训练函数"""
    # 初始化wandb（配置会自动从sweep注入）
    wandb.init()
    config = wandb.config

    # 构建模型
    model = nn.Sequential(
        nn.Linear(784, config.hidden_size),
        nn.ReLU(),
        nn.Dropout(config.dropout),
        nn.Linear(config.hidden_size, 10)
    )

    # 选择优化器
    if config.optimizer == "adam":
        optimizer = optim.Adam(model.parameters(), lr=config.learning_rate)
    elif config.optimizer == "sgd":
        optimizer = optim.SGD(model.parameters(), lr=config.learning_rate, momentum=0.9)
    else:
        optimizer = optim.AdamW(model.parameters(), lr=config.learning_rate)

    criterion = nn.CrossEntropyLoss()

    # 模拟训练
    for epoch in range(config.epochs):
        # 训练逻辑...
        train_loss = 1.0 / (epoch + 1) + config.learning_rate * 10
        val_loss = 1.2 / (epoch + 1) + config.learning_rate * 10
        val_accuracy = 1 - val_loss * 0.5

        wandb.log({
            "epoch": epoch,
            "train/loss": train_loss,
            "val/loss": val_loss,
            "val/accuracy": val_accuracy
        })

    wandb.finish()

# 运行sweep
wandb.agent(sweep_id, function=train_sweep, count=50)  # 运行50次
```

### 命令行方式运行Sweep

```yaml
# sweep.yaml
program: train.py
method: bayes
metric:
  name: val/accuracy
  goal: maximize
parameters:
  learning_rate:
    distribution: log_uniform_values
    min: 0.00001
    max: 0.01
  batch_size:
    values: [16, 32, 64]
  hidden_size:
    distribution: int_uniform
    min: 64
    max: 512
early_terminate:
  type: hyperband
  min_iter: 5
```

```bash
# 创建sweep
wandb sweep sweep.yaml

# 运行agent
wandb agent <sweep_id>

# 并行运行多个agent
wandb agent --count 10 <sweep_id> &
wandb agent --count 10 <sweep_id> &
```

### 高级Sweep功能

```python
import wandb

# 网格搜索
grid_config = {
    "method": "grid",
    "parameters": {
        "learning_rate": {"values": [0.001, 0.01, 0.1]},
        "batch_size": {"values": [32, 64]},
        "optimizer": {"values": ["adam", "sgd"]}
    }
}

# 随机搜索
random_config = {
    "method": "random",
    "parameters": {
        "learning_rate": {"distribution": "log_uniform_values", "min": 1e-5, "max": 1e-1},
        "batch_size": {"distribution": "q_log_uniform_values", "min": 16, "max": 256, "q": 16}
    }
}

# 贝叶斯优化（推荐用于连续参数）
bayes_config = {
    "method": "bayes",
    "metric": {"name": "val_loss", "goal": "minimize"},
    "parameters": {
        "learning_rate": {"distribution": "log_uniform_values", "min": 1e-5, "max": 1e-1},
        "weight_decay": {"distribution": "uniform", "min": 0, "max": 0.1}
    }
}

# 条件参数
conditional_config = {
    "method": "bayes",
    "parameters": {
        "model_type": {"values": ["cnn", "transformer"]},
        # CNN特定参数
        "kernel_size": {
            "values": [3, 5, 7],
            "conditions": [{"model_type": "cnn"}]
        },
        # Transformer特定参数
        "num_heads": {
            "values": [4, 8, 16],
            "conditions": [{"model_type": "transformer"}]
        }
    }
}
```

---

## 工具对比与选择

### 功能对比

| 功能 | MLflow | Weights & Biases |
|------|--------|------------------|
| **开源性** | 完全开源 | 部分开源（核心功能） |
| **部署方式** | 自托管/Databricks | 云托管/自托管（企业版） |
| **实验追踪** | 支持 | 支持（更丰富的可视化） |
| **超参数搜索** | 需集成第三方 | 内置Sweeps |
| **模型注册** | MLflow Model Registry | W&B Model Registry |
| **数据版本管理** | 有限支持 | W&B Artifacts |
| **团队协作** | 基础功能 | 丰富的协作功能 |
| **可视化** | 基础图表 | 丰富的交互式图表 |
| **报告功能** | 无 | W&B Reports |
| **成本** | 免费（自托管成本） | 免费层/付费版 |

### 使用场景建议

```python
# 场景1：企业内部MLOps平台 -> MLflow
# 原因：完全开源、可自托管、与Spark/Databricks集成好

# 场景2：快速实验迭代、个人/小团队 -> W&B
# 原因：开箱即用、可视化丰富、免费层够用

# 场景3：需要复杂超参数搜索 -> W&B Sweeps
# 原因：内置贝叶斯优化、易于并行化

# 场景4：生产模型管理 -> MLflow Model Registry
# 原因：成熟的模型生命周期管理、多种部署选项

# 场景5：研究论文实验 -> W&B
# 原因：自动生成报告、易于分享结果

# 场景6：两者结合使用
import mlflow
import wandb

def hybrid_tracking():
    """同时使用MLflow和W&B"""
    # W&B用于实验追踪和可视化
    wandb.init(project="hybrid-demo")

    # MLflow用于模型管理和部署
    mlflow.set_experiment("hybrid-demo")

    with mlflow.start_run():
        config = {"lr": 0.001, "epochs": 100}

        # 两边都记录参数
        wandb.config.update(config)
        mlflow.log_params(config)

        for epoch in range(config["epochs"]):
            loss = 1.0 / (epoch + 1)

            # 两边都记录指标
            wandb.log({"loss": loss})
            mlflow.log_metric("loss", loss, step=epoch)

        # MLflow保存模型用于部署
        mlflow.sklearn.log_model(model, "model")

        # W&B保存artifact用于版本管理
        artifact = wandb.Artifact("model", type="model")
        artifact.add_file("model.pkl")
        wandb.log_artifact(artifact)

    wandb.finish()
```

### 迁移指南

```python
# 从MLflow迁移到W&B
# MLflow代码
import mlflow
mlflow.set_experiment("my_experiment")
with mlflow.start_run():
    mlflow.log_param("lr", 0.001)
    mlflow.log_metric("loss", 0.5)
    mlflow.sklearn.log_model(model, "model")

# W&B等效代码
import wandb
wandb.init(project="my_experiment", config={"lr": 0.001})
wandb.log({"loss": 0.5})
torch.save(model.state_dict(), "model.pth")
wandb.save("model.pth")
wandb.finish()

# 从W&B迁移到MLflow
# W&B代码
import wandb
wandb.init(project="my_experiment")
wandb.config.lr = 0.001
wandb.log({"loss": 0.5})
wandb.finish()

# MLflow等效代码
import mlflow
mlflow.set_experiment("my_experiment")
with mlflow.start_run():
    mlflow.log_param("lr", 0.001)
    mlflow.log_metric("loss", 0.5)
```

---

## 最佳实践

### 实验命名规范

```python
import wandb
from datetime import datetime

# 使用有意义的命名
def get_run_name(model_type, dataset, experiment_type):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    return f"{model_type}_{dataset}_{experiment_type}_{timestamp}"

wandb.init(
    project="nlp-sentiment",
    name=get_run_name("bert", "imdb", "baseline"),
    tags=["bert", "baseline", "v1"],
    group="bert-experiments",  # 分组相关实验
    job_type="training"
)
```

### 配置管理

```python
import yaml
import wandb
from dataclasses import dataclass, asdict
from typing import Optional

@dataclass
class TrainingConfig:
    """训练配置类"""
    # 模型参数
    model_name: str = "resnet50"
    num_classes: int = 10
    pretrained: bool = True

    # 训练参数
    learning_rate: float = 0.001
    batch_size: int = 32
    epochs: int = 100
    optimizer: str = "adamw"
    weight_decay: float = 0.01

    # 数据参数
    data_path: str = "./data"
    train_split: float = 0.8
    augmentation: bool = True

    # 其他
    seed: int = 42
    device: str = "cuda"

    @classmethod
    def from_yaml(cls, path: str) -> "TrainingConfig":
        with open(path) as f:
            config_dict = yaml.safe_load(f)
        return cls(**config_dict)

    def to_wandb_config(self):
        return asdict(self)

# 使用配置
config = TrainingConfig.from_yaml("config.yaml")
wandb.init(project="my-project", config=config.to_wandb_config())
```

### 模型检查点管理

```python
import wandb
import torch
import os

class ModelCheckpointer:
    """模型检查点管理器"""

    def __init__(self, save_dir="checkpoints", monitor="val_loss", mode="min"):
        self.save_dir = save_dir
        self.monitor = monitor
        self.mode = mode
        self.best_score = float('inf') if mode == 'min' else float('-inf')
        os.makedirs(save_dir, exist_ok=True)

    def save_checkpoint(self, model, optimizer, epoch, metrics, is_best=False):
        checkpoint = {
            "epoch": epoch,
            "model_state_dict": model.state_dict(),
            "optimizer_state_dict": optimizer.state_dict(),
            "metrics": metrics
        }

        # 保存最新检查点
        latest_path = os.path.join(self.save_dir, "checkpoint_latest.pt")
        torch.save(checkpoint, latest_path)

        # 保存最佳检查点
        if is_best:
            best_path = os.path.join(self.save_dir, "checkpoint_best.pt")
            torch.save(checkpoint, best_path)

            # 上传到wandb
            wandb.save(best_path)
            wandb.run.summary["best_epoch"] = epoch
            wandb.run.summary[f"best_{self.monitor}"] = metrics[self.monitor]

    def should_save_best(self, current_score):
        if self.mode == 'min':
            is_best = current_score < self.best_score
        else:
            is_best = current_score > self.best_score

        if is_best:
            self.best_score = current_score

        return is_best

# 使用示例
checkpointer = ModelCheckpointer(monitor="val_loss", mode="min")

for epoch in range(epochs):
    train_metrics = train_epoch(model, train_loader)
    val_metrics = validate(model, val_loader)

    is_best = checkpointer.should_save_best(val_metrics["val_loss"])
    checkpointer.save_checkpoint(model, optimizer, epoch, val_metrics, is_best)

    wandb.log({**train_metrics, **val_metrics})
```

### 实验复现

```python
import wandb
import torch
import numpy as np
import random

def set_seed(seed: int):
    """设置所有随机种子以确保可复现性"""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False

def init_reproducible_run(project, config, seed=42):
    """初始化可复现的实验运行"""
    set_seed(seed)

    run = wandb.init(
        project=project,
        config={**config, "seed": seed},
        settings=wandb.Settings(code_dir=".")  # 保存代码
    )

    # 记录环境信息
    wandb.config.update({
        "python_version": sys.version,
        "pytorch_version": torch.__version__,
        "cuda_version": torch.version.cuda,
        "cudnn_version": torch.backends.cudnn.version()
    })

    return run

# 复现之前的实验
def reproduce_run(run_path):
    """从之前的运行复现实验"""
    api = wandb.Api()
    run = api.run(run_path)

    # 获取配置
    config = run.config

    # 下载代码
    run.file("code/train.py").download()

    # 使用相同配置重新运行
    init_reproducible_run("my-project", config, seed=config["seed"])
```

---

## 面试要点

### 常见面试问题

**Q1: 为什么需要实验追踪工具？**

实验追踪工具解决以下核心问题：
- **可重复性**：记录完整的实验配置（参数、代码版本、数据版本），确保实验可复现
- **可比较性**：统一的指标记录和可视化，便于比较不同实验
- **协作效率**：团队成员可以共享实验结果，避免重复工作
- **模型血缘**：追踪生产模型的来源，满足合规要求

**Q2: MLflow和W&B的主要区别是什么？**

```
MLflow:
- 完全开源，可自托管
- 与Databricks/Spark生态集成好
- 模型部署功能强大
- 适合企业内部MLOps平台

W&B:
- 云托管为主，开箱即用
- 可视化和协作功能丰富
- 内置超参数搜索（Sweeps）
- 适合快速实验迭代
```

**Q3: 如何设计一个可扩展的实验追踪系统？**

```python
# 关键设计原则
class ExperimentTracker:
    """可扩展的实验追踪抽象"""

    def __init__(self, backend="wandb"):
        if backend == "wandb":
            self.tracker = WandbTracker()
        elif backend == "mlflow":
            self.tracker = MLflowTracker()
        else:
            raise ValueError(f"Unknown backend: {backend}")

    def log_params(self, params: dict):
        self.tracker.log_params(params)

    def log_metrics(self, metrics: dict, step: int = None):
        self.tracker.log_metrics(metrics, step)

    def log_artifact(self, path: str, name: str = None):
        self.tracker.log_artifact(path, name)

    def finish(self):
        self.tracker.finish()

# 使用抽象层，便于切换后端
tracker = ExperimentTracker(backend="wandb")
tracker.log_params({"lr": 0.001})
tracker.log_metrics({"loss": 0.5})
tracker.finish()
```

**Q4: 如何处理大规模实验的管理？**

```python
# 使用分组和标签
wandb.init(
    project="large-scale-nlp",
    group="bert-fine-tuning",      # 分组相关实验
    job_type="hyperparameter-search",
    tags=["bert-base", "squad", "lr-sweep"]
)

# 使用Sweeps进行系统化搜索
sweep_config = {
    "method": "bayes",
    "metric": {"name": "f1", "goal": "maximize"},
    "parameters": {...}
}

# 设置实验优先级和资源分配
# 定期清理低价值实验
# 使用artifact缓存避免重复计算
```

**Q5: 实验追踪中如何保证数据安全？**

```python
# 敏感信息过滤
def filter_sensitive_config(config):
    sensitive_keys = ["api_key", "password", "secret"]
    return {k: v for k, v in config.items()
            if not any(s in k.lower() for s in sensitive_keys)}

# 使用环境变量
import os
api_key = os.environ.get("API_KEY")  # 不记录到实验中

# 私有项目设置
wandb.init(project="private-project", entity="my-team")

# 自托管方案
# MLflow: 部署在内网
# W&B: 使用企业版自托管
```

### 实践技巧总结

1. **标准化命名**：使用一致的实验/运行命名规范
2. **配置管理**：使用配置文件而非硬编码参数
3. **版本控制**：记录代码和数据版本
4. **自动化**：使用CI/CD触发实验
5. **定期清理**：删除失败或低价值实验
6. **文档化**：使用W&B Reports或README记录实验结论
7. **团队规范**：制定团队统一的实验管理规范

---

## 延伸阅读

### 推荐资源

1. **官方文档**
   - [MLflow Documentation](https://mlflow.org/docs/latest/index.html)
   - [Weights & Biases Documentation](https://docs.wandb.ai/)

2. **教程和课程**
   - MLflow官方教程
   - W&B Courses
   - Made With ML的MLOps课程

3. **相关工具**
   - DVC（数据版本控制）
   - Kubeflow（ML工作流）
   - Neptune.ai（实验追踪）
   - ClearML（MLOps平台）

### 进阶主题

- 模型注册和版本管理
- A/B测试集成
- 模型监控和漂移检测
- 特征存储（Feature Store）
- ML Pipeline编排
- 分布式训练追踪

---

## 总结

实验追踪是MLOps的基础设施之一。MLflow和W&B各有优势：

- **选择MLflow**：需要完全开源、自托管、与Databricks生态集成
- **选择W&B**：需要丰富可视化、快速上手、内置超参数搜索

无论选择哪个工具，关键是建立规范的实验管理流程：

1. 统一的参数和指标记录
2. 完整的环境和代码版本追踪
3. 系统化的模型版本管理
4. 可复现的实验配置

通过本文的学习，你应该能够：
- 理解实验追踪的重要性
- 熟练使用MLflow和W&B进行实验管理
- 根据场景选择合适的工具
- 建立规范的MLOps实践
