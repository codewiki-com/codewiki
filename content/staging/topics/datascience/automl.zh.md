---
title: AutoML 自动机器学习
description: 了解AutoML自动化机器学习流程
track: datascience
section: classical-ml
difficulty: intermediate
tags:
  - AutoML
  - 自动化
  - 模型选择
  - 超参数
status: imported
origin: old/src/content/docs/ai/automl.zh.md
divergence: 0.285
issues: []
legacy:
  category: AI
  subcategory: ML
  order: 20
  lastUpdated: 2026-01-07
---

AutoML（Automated Machine Learning，自动机器学习）是一套旨在自动化机器学习模型开发全流程的技术和方法。它能够自动完成数据预处理、特征工程、模型选择、超参数调优等繁琐任务，大大降低了机器学习的门槛，让非专家用户也能构建高质量的机器学习模型。

## AutoML 核心概念

### 什么是 AutoML

传统的机器学习工作流程需要数据科学家手动完成多个步骤：

```
原始数据 → 数据清洗 → 特征工程 → 模型选择 → 超参数调优 → 模型评估 → 部署
```

AutoML 的目标是将上述流程中的大部分步骤自动化，主要包括：

- **自动数据预处理**：处理缺失值、异常值、数据类型转换
- **自动特征工程**：特征选择、特征生成、特征变换
- **自动模型选择**：从候选模型库中选择最优模型
- **自动超参数优化**：寻找最优的超参数组合
- **自动模型集成**：组合多个模型以提升性能

### AutoML 的核心挑战

AutoML 面临的主要技术挑战包括：

| 挑战 | 描述 | 解决方案 |
|------|------|----------|
| 搜索空间巨大 | 模型和超参数组合数量庞大 | 贝叶斯优化、遗传算法 |
| 计算成本高 | 评估每个配置需要完整训练 | 早停策略、代理模型 |
| 泛化能力 | 避免过拟合验证集 | 交叉验证、元学习 |
| 可解释性 | 自动选择的模型难以解释 | 特征重要性分析 |

### CASH 问题

AutoML 的核心可以形式化为 **CASH（Combined Algorithm Selection and Hyperparameter optimization）问题**：

```python
# CASH 问题的形式化定义
# 目标：找到最优的算法 A* 和超参数配置 λ*

# min L(A, λ, D_train, D_valid)
# 其中：
# - A: 算法（如随机森林、SVM、神经网络等）
# - λ: 超参数配置
# - D_train: 训练数据集
# - D_valid: 验证数据集
# - L: 损失函数

from sklearn.model_selection import cross_val_score
import numpy as np

def evaluate_configuration(algorithm, hyperparams, X, y, cv=5):
    """评估特定算法和超参数配置的性能"""
    model = algorithm(**hyperparams)
    scores = cross_val_score(model, X, y, cv=cv, scoring='accuracy')
    return np.mean(scores), np.std(scores)
```

## 超参数优化方法

### 网格搜索（Grid Search）

网格搜索是最简单的超参数搜索方法，遍历所有可能的参数组合：

```python
from sklearn.model_selection import GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris

# 加载数据
X, y = load_iris(return_X_y=True)

# 定义参数网格
param_grid = {
    'n_estimators': [50, 100, 200],
    'max_depth': [3, 5, 10, None],
    'min_samples_split': [2, 5, 10],
    'min_samples_leaf': [1, 2, 4]
}

# 创建网格搜索对象
grid_search = GridSearchCV(
    estimator=RandomForestClassifier(random_state=42),
    param_grid=param_grid,
    cv=5,
    scoring='accuracy',
    n_jobs=-1,
    verbose=1
)

# 执行搜索
grid_search.fit(X, y)

print(f"最优参数: {grid_search.best_params_}")
print(f"最优得分: {grid_search.best_score_:.4f}")
```

**优缺点：**
- 优点：简单直观，保证找到网格内最优解
- 缺点：计算成本随参数数量指数增长，不适合大搜索空间

### 随机搜索（Random Search）

随机搜索从参数空间中随机采样，通常比网格搜索更高效：

```python
from sklearn.model_selection import RandomizedSearchCV
from scipy.stats import randint, uniform

# 定义参数分布
param_distributions = {
    'n_estimators': randint(50, 500),
    'max_depth': randint(3, 20),
    'min_samples_split': randint(2, 20),
    'min_samples_leaf': randint(1, 10),
    'max_features': uniform(0.1, 0.9)
}

# 创建随机搜索对象
random_search = RandomizedSearchCV(
    estimator=RandomForestClassifier(random_state=42),
    param_distributions=param_distributions,
    n_iter=100,  # 采样次数
    cv=5,
    scoring='accuracy',
    n_jobs=-1,
    random_state=42
)

random_search.fit(X, y)
print(f"最优参数: {random_search.best_params_}")
print(f"最优得分: {random_search.best_score_:.4f}")
```

### 贝叶斯优化（Bayesian Optimization）

贝叶斯优化使用概率模型来指导搜索，更智能地选择下一个评估点：

```python
# 使用 Optuna 进行贝叶斯优化
import optuna
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score
from sklearn.datasets import load_iris

X, y = load_iris(return_X_y=True)

def objective(trial):
    """定义优化目标函数"""
    # 定义超参数搜索空间
    n_estimators = trial.suggest_int('n_estimators', 50, 500)
    max_depth = trial.suggest_int('max_depth', 3, 20)
    min_samples_split = trial.suggest_int('min_samples_split', 2, 20)
    min_samples_leaf = trial.suggest_int('min_samples_leaf', 1, 10)
    max_features = trial.suggest_float('max_features', 0.1, 1.0)

    # 创建模型
    model = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth,
        min_samples_split=min_samples_split,
        min_samples_leaf=min_samples_leaf,
        max_features=max_features,
        random_state=42
    )

    # 交叉验证评估
    scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
    return scores.mean()

# 创建 study 并优化
study = optuna.create_study(direction='maximize')
study.optimize(objective, n_trials=100, show_progress_bar=True)

print(f"最优参数: {study.best_params}")
print(f"最优得分: {study.best_value:.4f}")

# 可视化优化过程
# optuna.visualization.plot_optimization_history(study)
# optuna.visualization.plot_param_importances(study)
```

### 超参数优化方法对比

| 方法 | 搜索效率 | 实现复杂度 | 适用场景 |
|------|----------|------------|----------|
| 网格搜索 | 低 | 简单 | 小搜索空间、参数较少 |
| 随机搜索 | 中 | 简单 | 中等搜索空间、初步探索 |
| 贝叶斯优化 | 高 | 中等 | 大搜索空间、计算成本高 |
| 遗传算法 | 中-高 | 复杂 | 复杂搜索空间、离散参数 |
| 多保真度优化 | 很高 | 复杂 | 训练成本高的模型 |

## Auto-sklearn

Auto-sklearn 是基于 scikit-learn 的 AutoML 框架，自动处理算法选择和超参数优化。

### 基本使用

```python
import autosklearn.classification
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

# 加载数据
X, y = load_breast_cancer(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 创建 Auto-sklearn 分类器
automl = autosklearn.classification.AutoSklearnClassifier(
    time_left_for_this_task=300,  # 总时间限制（秒）
    per_run_time_limit=30,        # 单次运行时间限制
    memory_limit=4096,            # 内存限制（MB）
    n_jobs=-1,
    seed=42,
    # 可选：指定要搜索的模型
    include={
        'classifier': ['random_forest', 'gradient_boosting', 'extra_trees']
    }
)

# 训练
automl.fit(X_train, y_train)

# 预测和评估
y_pred = automl.predict(X_test)
print(f"准确率: {accuracy_score(y_test, y_pred):.4f}")
print(classification_report(y_test, y_pred))

# 查看模型集成
print("\n最终模型集成:")
print(automl.show_models())

# 查看搜索统计
print("\n搜索统计:")
print(automl.sprint_statistics())
```

### Auto-sklearn 的关键特性

```python
# 元学习：利用历史任务信息加速搜索
automl_meta = autosklearn.classification.AutoSklearnClassifier(
    time_left_for_this_task=300,
    initial_configurations_via_metalearning=25,  # 使用25个元学习配置
)

# 模型集成：自动组合多个模型
automl_ensemble = autosklearn.classification.AutoSklearnClassifier(
    time_left_for_this_task=300,
    ensemble_size=50,           # 集成中的模型数量
    ensemble_nbest=50,          # 考虑的最佳模型数量
)

# 自定义评估指标
from autosklearn.metrics import make_scorer
from sklearn.metrics import f1_score

custom_scorer = make_scorer(
    name='custom_f1',
    score_func=f1_score,
    optimum=1,
    greater_is_better=True,
    needs_proba=False,
    needs_threshold=False
)

automl_custom = autosklearn.classification.AutoSklearnClassifier(
    time_left_for_this_task=300,
    metric=custom_scorer
)

# 回归任务
import autosklearn.regression

automl_reg = autosklearn.regression.AutoSklearnRegressor(
    time_left_for_this_task=300,
    per_run_time_limit=30
)
```

### Auto-sklearn 工作原理

Auto-sklearn 的工作流程：

1. **元学习初始化**：基于数据集特征，从历史任务中选择有前景的初始配置
2. **贝叶斯优化**：使用 SMAC（Sequential Model-based Algorithm Configuration）搜索最优配置
3. **自动特征预处理**：自动选择数据预处理和特征工程方法
4. **模型集成**：使用集成选择从候选模型中构建最终集成

## Google Cloud AutoML

Google Cloud AutoML 是一套云端 AutoML 服务，支持多种机器学习任务。

### AutoML Tables（表格数据）

```python
from google.cloud import automl_v1beta1 as automl

def create_dataset(project_id, display_name):
    """创建 AutoML Tables 数据集"""
    client = automl.TablesClient(project=project_id, region="us-central1")

    dataset = client.create_dataset(display_name=display_name)
    print(f"数据集创建成功: {dataset.name}")
    return dataset

def import_data(project_id, dataset_id, gcs_uri):
    """从 GCS 导入数据"""
    client = automl.TablesClient(project=project_id, region="us-central1")

    response = client.import_data(
        dataset=dataset_id,
        gcs_input_uris=gcs_uri
    )
    print(f"数据导入完成: {response.result()}")

def train_model(project_id, dataset_id, target_column, model_name):
    """训练 AutoML Tables 模型"""
    client = automl.TablesClient(project=project_id, region="us-central1")

    # 设置目标列
    client.set_target_column(
        dataset=dataset_id,
        column_spec_display_name=target_column
    )

    # 开始训练
    response = client.create_model(
        model_display_name=model_name,
        dataset=dataset_id,
        train_budget_milli_node_hours=1000,  # 训练预算
        optimization_objective="MAXIMIZE_AU_ROC"  # 优化目标
    )

    print(f"模型训练中...")
    model = response.result()
    print(f"模型训练完成: {model.name}")
    return model

def predict(project_id, model_id, inputs):
    """使用模型进行预测"""
    client = automl.TablesClient(project=project_id, region="us-central1")

    response = client.predict(
        model=model_id,
        inputs=inputs
    )

    return response.payload
```

### AutoML Vision（图像分类）

```python
from google.cloud import automl

def create_vision_dataset(project_id, display_name):
    """创建图像分类数据集"""
    client = automl.AutoMlClient()
    project_location = f"projects/{project_id}/locations/us-central1"

    # 配置数据集元数据
    metadata = automl.ImageClassificationDatasetMetadata(
        classification_type=automl.ClassificationType.MULTICLASS
    )

    dataset = automl.Dataset(
        display_name=display_name,
        image_classification_dataset_metadata=metadata
    )

    response = client.create_dataset(
        parent=project_location,
        dataset=dataset
    )

    print(f"数据集创建成功: {response.name}")
    return response

def train_vision_model(project_id, dataset_id, display_name):
    """训练图像分类模型"""
    client = automl.AutoMlClient()
    project_location = f"projects/{project_id}/locations/us-central1"

    metadata = automl.ImageClassificationModelMetadata(
        train_budget_milli_node_hours=24000  # 24 node hours
    )

    model = automl.Model(
        display_name=display_name,
        dataset_id=dataset_id,
        image_classification_model_metadata=metadata
    )

    response = client.create_model(
        parent=project_location,
        model=model
    )

    print(f"模型训练中...")
    return response.result()
```

### AutoML Natural Language（文本分类）

```python
from google.cloud import automl

def create_text_dataset(project_id, display_name):
    """创建文本分类数据集"""
    client = automl.AutoMlClient()
    project_location = f"projects/{project_id}/locations/us-central1"

    metadata = automl.TextClassificationDatasetMetadata(
        classification_type=automl.ClassificationType.MULTICLASS
    )

    dataset = automl.Dataset(
        display_name=display_name,
        text_classification_dataset_metadata=metadata
    )

    response = client.create_dataset(
        parent=project_location,
        dataset=dataset
    )

    return response

def predict_text(project_id, model_id, content):
    """文本分类预测"""
    client = automl.PredictionServiceClient()
    model_path = f"projects/{project_id}/locations/us-central1/models/{model_id}"

    payload = automl.ExamplePayload(
        text_snippet=automl.TextSnippet(content=content, mime_type="text/plain")
    )

    response = client.predict(name=model_path, payload=payload)

    for result in response.payload:
        print(f"类别: {result.display_name}, 置信度: {result.classification.score:.4f}")

    return response.payload
```

## H2O AutoML

H2O AutoML 是一个开源的 AutoML 框架，支持大规模数据处理和分布式计算。

### 基本使用

```python
import h2o
from h2o.automl import H2OAutoML

# 初始化 H2O 集群
h2o.init()

# 加载数据
data = h2o.import_file("data/train.csv")

# 定义特征和目标
target = "label"
features = data.columns
features.remove(target)

# 划分数据集
train, valid, test = data.split_frame(ratios=[0.7, 0.15], seed=42)

# 将目标列转换为因子（分类任务）
train[target] = train[target].asfactor()
valid[target] = valid[target].asfactor()
test[target] = test[target].asfactor()

# 创建 AutoML 对象
aml = H2OAutoML(
    max_runtime_secs=3600,           # 最大运行时间（秒）
    max_models=20,                    # 最大模型数量
    seed=42,
    balance_classes=True,             # 处理类别不平衡
    stopping_metric="AUC",            # 早停指标
    sort_metric="AUC",                # 排序指标
    exclude_algos=["DeepLearning"],   # 排除某些算法
    nfolds=5,                         # 交叉验证折数
    keep_cross_validation_predictions=True
)

# 训练
aml.train(x=features, y=target, training_frame=train, validation_frame=valid)

# 查看排行榜
print("模型排行榜:")
print(aml.leaderboard.head(10))

# 获取最佳模型
best_model = aml.leader
print(f"\n最佳模型: {best_model.model_id}")

# 在测试集上评估
perf = best_model.model_performance(test)
print(f"测试集 AUC: {perf.auc():.4f}")

# 预测
predictions = best_model.predict(test)
print(predictions.head())
```

### H2O AutoML 高级配置

```python
# 自定义算法列表
aml_custom = H2OAutoML(
    max_runtime_secs=3600,
    include_algos=["GBM", "XGBoost", "DRF", "GLM"],  # 只使用指定算法
    seed=42
)

# Stacked Ensemble 配置
aml_stacked = H2OAutoML(
    max_runtime_secs=3600,
    nfolds=5,
    keep_cross_validation_models=True,
    keep_cross_validation_predictions=True,
    # 自动创建 Stacked Ensemble
)

# 获取 Stacked Ensemble 模型
stacked_ensemble = h2o.get_model([
    m for m in aml_stacked.leaderboard.as_data_frame()['model_id'].values
    if 'StackedEnsemble' in m
][0])

# 模型解释性
from h2o.estimators import H2OGradientBoostingEstimator

# 获取变量重要性
var_importance = best_model.varimp(use_pandas=True)
print("\n变量重要性:")
print(var_importance.head(10))

# SHAP 值（如果模型支持）
if hasattr(best_model, 'shap_summary_plot'):
    best_model.shap_summary_plot(test)
```

### H2O AutoML 与 Spark 集成

```python
from pysparkling import H2OContext
from pyspark.sql import SparkSession

# 创建 Spark Session
spark = SparkSession.builder \
    .appName("H2O-AutoML-Spark") \
    .config("spark.ext.h2o.cloud.timeout", "60000") \
    .getOrCreate()

# 创建 H2O Context
hc = H2OContext.getOrCreate()

# 从 Spark DataFrame 转换
spark_df = spark.read.parquet("data/large_dataset.parquet")
h2o_frame = hc.asH2OFrame(spark_df)

# 使用 AutoML
aml = H2OAutoML(max_runtime_secs=3600, seed=42)
aml.train(x=features, y=target, training_frame=h2o_frame)

# 将预测结果转换回 Spark
predictions_h2o = aml.leader.predict(h2o_frame)
predictions_spark = hc.asSparkFrame(predictions_h2o)
```

## 神经架构搜索（NAS）

神经架构搜索（Neural Architecture Search, NAS）是 AutoML 在深度学习领域的重要应用，旨在自动发现最优的神经网络架构。

### NAS 基本概念

NAS 主要包含三个核心组件：

1. **搜索空间（Search Space）**：定义可能的网络架构
2. **搜索策略（Search Strategy）**：如何探索搜索空间
3. **性能评估策略（Performance Estimation）**：如何评估候选架构

```python
# NAS 搜索空间示例
search_space = {
    'num_layers': [2, 3, 4, 5, 6],
    'layer_types': ['conv', 'separable_conv', 'dilated_conv'],
    'kernel_sizes': [3, 5, 7],
    'num_filters': [32, 64, 128, 256],
    'activation': ['relu', 'swish', 'gelu'],
    'use_skip_connection': [True, False],
    'dropout_rate': [0.0, 0.1, 0.2, 0.3]
}
```

### 使用 Keras Tuner 进行 NAS

```python
import keras_tuner as kt
import tensorflow as tf
from tensorflow import keras

def build_model(hp):
    """定义可调超参数的模型构建函数"""
    model = keras.Sequential()

    # 输入层
    model.add(keras.layers.InputLayer(input_shape=(28, 28, 1)))

    # 搜索卷积层数量
    for i in range(hp.Int('num_conv_layers', 1, 4)):
        model.add(keras.layers.Conv2D(
            filters=hp.Int(f'filters_{i}', 32, 256, step=32),
            kernel_size=hp.Choice(f'kernel_size_{i}', [3, 5]),
            activation='relu',
            padding='same'
        ))

        if hp.Boolean(f'batch_norm_{i}'):
            model.add(keras.layers.BatchNormalization())

        if hp.Boolean(f'pooling_{i}'):
            model.add(keras.layers.MaxPooling2D(2))

        model.add(keras.layers.Dropout(
            hp.Float(f'dropout_{i}', 0, 0.5, step=0.1)
        ))

    model.add(keras.layers.Flatten())

    # 搜索全连接层
    for j in range(hp.Int('num_dense_layers', 1, 3)):
        model.add(keras.layers.Dense(
            units=hp.Int(f'dense_units_{j}', 64, 512, step=64),
            activation='relu'
        ))
        model.add(keras.layers.Dropout(
            hp.Float(f'dense_dropout_{j}', 0, 0.5, step=0.1)
        ))

    model.add(keras.layers.Dense(10, activation='softmax'))

    # 搜索优化器配置
    optimizer = hp.Choice('optimizer', ['adam', 'sgd', 'rmsprop'])
    learning_rate = hp.Float('learning_rate', 1e-4, 1e-2, sampling='log')

    if optimizer == 'adam':
        opt = keras.optimizers.Adam(learning_rate=learning_rate)
    elif optimizer == 'sgd':
        opt = keras.optimizers.SGD(learning_rate=learning_rate, momentum=0.9)
    else:
        opt = keras.optimizers.RMSprop(learning_rate=learning_rate)

    model.compile(
        optimizer=opt,
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )

    return model

# 创建 Hyperband tuner
tuner = kt.Hyperband(
    build_model,
    objective='val_accuracy',
    max_epochs=50,
    factor=3,
    directory='nas_results',
    project_name='mnist_nas'
)

# 加载数据
(x_train, y_train), (x_test, y_test) = keras.datasets.mnist.load_data()
x_train = x_train.reshape(-1, 28, 28, 1).astype('float32') / 255.0
x_test = x_test.reshape(-1, 28, 28, 1).astype('float32') / 255.0

# 执行搜索
tuner.search(
    x_train, y_train,
    validation_split=0.2,
    epochs=50,
    callbacks=[
        keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True)
    ]
)

# 获取最佳模型
best_model = tuner.get_best_models(num_models=1)[0]
best_hyperparameters = tuner.get_best_hyperparameters(num_trials=1)[0]

print("最佳超参数:")
for param, value in best_hyperparameters.values.items():
    print(f"  {param}: {value}")
```

### DARTS（可微分架构搜索）

DARTS 是一种高效的 NAS 方法，将离散的架构搜索问题转化为连续优化问题：

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class MixedOp(nn.Module):
    """混合操作：所有候选操作的加权和"""
    def __init__(self, C, stride, ops):
        super().__init__()
        self.ops = nn.ModuleList()
        for op_name in ops:
            self.ops.append(self._build_op(op_name, C, stride))

    def _build_op(self, name, C, stride):
        """构建操作"""
        if name == 'sep_conv_3x3':
            return SepConv(C, C, 3, stride, 1)
        elif name == 'sep_conv_5x5':
            return SepConv(C, C, 5, stride, 2)
        elif name == 'dil_conv_3x3':
            return DilConv(C, C, 3, stride, 2, 2)
        elif name == 'skip_connect':
            return nn.Identity() if stride == 1 else FactorizedReduce(C, C)
        elif name == 'max_pool_3x3':
            return nn.MaxPool2d(3, stride=stride, padding=1)
        elif name == 'avg_pool_3x3':
            return nn.AvgPool2d(3, stride=stride, padding=1)
        elif name == 'none':
            return Zero(stride)

    def forward(self, x, weights):
        """前向传播：对所有操作加权求和"""
        return sum(w * op(x) for w, op in zip(weights, self.ops))

class DARTSCell(nn.Module):
    """DARTS 单元格"""
    def __init__(self, steps, C_prev_prev, C_prev, C, reduction):
        super().__init__()
        self.reduction = reduction
        self.steps = steps

        # 预处理层
        self.preprocess0 = ReLUConvBN(C_prev_prev, C, 1, 1, 0)
        self.preprocess1 = ReLUConvBN(C_prev, C, 1, 1, 0)

        # 混合操作
        self.ops = nn.ModuleList()
        self.num_ops = len(PRIMITIVES)

        for i in range(self.steps):
            for j in range(2 + i):
                stride = 2 if reduction and j < 2 else 1
                op = MixedOp(C, stride, PRIMITIVES)
                self.ops.append(op)

    def forward(self, s0, s1, weights):
        s0 = self.preprocess0(s0)
        s1 = self.preprocess1(s1)

        states = [s0, s1]
        offset = 0

        for i in range(self.steps):
            s = sum(self.ops[offset + j](h, weights[offset + j])
                    for j, h in enumerate(states))
            offset += len(states)
            states.append(s)

        return torch.cat(states[-self.steps:], dim=1)

# 候选操作列表
PRIMITIVES = [
    'none',
    'max_pool_3x3',
    'avg_pool_3x3',
    'skip_connect',
    'sep_conv_3x3',
    'sep_conv_5x5',
    'dil_conv_3x3',
]
```

### 其他 NAS 方法

| 方法 | 搜索策略 | 特点 |
|------|----------|------|
| NASNet | 强化学习 | 开创性工作，计算成本高 |
| ENAS | 参数共享 + RL | 显著降低计算成本 |
| DARTS | 梯度下降 | 高效，可微分 |
| ProxylessNAS | 梯度 + 路径采样 | 直接在目标硬件搜索 |
| Once-for-All | 渐进式收缩 | 一次训练，多种部署 |

## 自动特征工程

自动特征工程是 AutoML 的重要组成部分，旨在自动发现和构建有价值的特征。

### 使用 Featuretools 进行自动特征工程

```python
import featuretools as ft
import pandas as pd
import numpy as np

# 创建示例数据
customers = pd.DataFrame({
    'customer_id': [1, 2, 3, 4, 5],
    'join_date': pd.to_datetime(['2020-01-01', '2020-02-15', '2020-03-20',
                                  '2020-04-10', '2020-05-05']),
    'age': [25, 32, 45, 28, 55],
    'region': ['North', 'South', 'East', 'West', 'North']
})

transactions = pd.DataFrame({
    'transaction_id': range(1, 21),
    'customer_id': [1, 1, 1, 2, 2, 2, 2, 3, 3, 4,
                    4, 4, 4, 4, 5, 5, 5, 5, 5, 5],
    'amount': [100, 200, 150, 300, 50, 75, 200, 500, 250,
               80, 90, 110, 120, 100, 200, 300, 150, 175, 225, 125],
    'product_category': ['Electronics', 'Clothing', 'Electronics',
                         'Books', 'Electronics', 'Books', 'Clothing',
                         'Electronics', 'Books', 'Clothing', 'Electronics',
                         'Books', 'Clothing', 'Electronics', 'Books',
                         'Clothing', 'Electronics', 'Books', 'Clothing', 'Electronics'],
    'transaction_date': pd.date_range('2020-06-01', periods=20, freq='3D')
})

# 创建 EntitySet
es = ft.EntitySet(id='customer_transactions')

# 添加实体
es = es.add_dataframe(
    dataframe_name='customers',
    dataframe=customers,
    index='customer_id',
    time_index='join_date'
)

es = es.add_dataframe(
    dataframe_name='transactions',
    dataframe=transactions,
    index='transaction_id',
    time_index='transaction_date'
)

# 添加关系
es = es.add_relationship('customers', 'customer_id',
                         'transactions', 'customer_id')

# 自动生成特征
feature_matrix, feature_defs = ft.dfs(
    entityset=es,
    target_dataframe_name='customers',
    agg_primitives=['mean', 'sum', 'count', 'min', 'max', 'std',
                    'num_unique', 'trend'],
    trans_primitives=['month', 'weekday', 'year', 'day'],
    max_depth=2,
    verbose=True
)

print("生成的特征:")
print(feature_matrix.head())
print(f"\n特征数量: {len(feature_defs)}")
print("\n特征列表:")
for feat in feature_defs[:10]:
    print(f"  - {feat}")
```

### 使用 TPOT 进行特征工程和模型选择

```python
from tpot import TPOTClassifier
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split

# 加载数据
digits = load_digits()
X_train, X_test, y_train, y_test = train_test_split(
    digits.data, digits.target, test_size=0.2, random_state=42
)

# 创建 TPOT 分类器
tpot = TPOTClassifier(
    generations=5,              # 进化代数
    population_size=50,         # 种群大小
    cv=5,                       # 交叉验证折数
    random_state=42,
    verbosity=2,
    n_jobs=-1,
    # 配置搜索空间
    config_dict='TPOT light',   # 使用轻量级配置
    # 或自定义配置
    # config_dict={
    #     'sklearn.ensemble.RandomForestClassifier': {
    #         'n_estimators': [100, 200],
    #         'max_depth': [3, 5, 10]
    #     },
    #     'sklearn.preprocessing.StandardScaler': {},
    #     'sklearn.feature_selection.SelectKBest': {
    #         'k': [10, 20, 50]
    #     }
    # }
)

# 训练
tpot.fit(X_train, y_train)

# 评估
print(f"测试集准确率: {tpot.score(X_test, y_test):.4f}")

# 导出最优流水线
tpot.export('best_pipeline.py')

# 查看最优流水线
print("\n最优流水线:")
print(tpot.fitted_pipeline_)
```

### 自动特征选择

```python
from sklearn.feature_selection import (
    SelectKBest, f_classif, mutual_info_classif,
    RFE, RFECV, SelectFromModel
)
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
import numpy as np

class AutoFeatureSelector:
    """自动特征选择器"""

    def __init__(self, n_features='auto'):
        self.n_features = n_features
        self.selected_features = None
        self.feature_scores = {}

    def fit(self, X, y, feature_names=None):
        """使用多种方法进行特征选择"""
        if feature_names is None:
            feature_names = [f'feature_{i}' for i in range(X.shape[1])]

        # 方法1: 基于统计测试
        selector_stat = SelectKBest(f_classif, k='all')
        selector_stat.fit(X, y)
        self.feature_scores['f_classif'] = selector_stat.scores_

        # 方法2: 基于互信息
        mi_scores = mutual_info_classif(X, y, random_state=42)
        self.feature_scores['mutual_info'] = mi_scores

        # 方法3: 基于模型重要性
        rf = RandomForestClassifier(n_estimators=100, random_state=42)
        rf.fit(X, y)
        self.feature_scores['rf_importance'] = rf.feature_importances_

        gb = GradientBoostingClassifier(n_estimators=100, random_state=42)
        gb.fit(X, y)
        self.feature_scores['gb_importance'] = gb.feature_importances_

        # 综合评分
        combined_scores = self._combine_scores()

        # 确定特征数量
        if self.n_features == 'auto':
            n_select = self._determine_n_features(combined_scores)
        else:
            n_select = self.n_features

        # 选择特征
        indices = np.argsort(combined_scores)[::-1][:n_select]
        self.selected_features = [feature_names[i] for i in indices]

        return self

    def _combine_scores(self):
        """综合多种方法的评分"""
        # 标准化每种方法的分数
        normalized_scores = {}
        for method, scores in self.feature_scores.items():
            scores = np.array(scores)
            normalized = (scores - scores.min()) / (scores.max() - scores.min() + 1e-10)
            normalized_scores[method] = normalized

        # 加权平均
        weights = {
            'f_classif': 0.2,
            'mutual_info': 0.3,
            'rf_importance': 0.25,
            'gb_importance': 0.25
        }

        combined = np.zeros(len(list(normalized_scores.values())[0]))
        for method, scores in normalized_scores.items():
            combined += weights[method] * scores

        return combined

    def _determine_n_features(self, scores):
        """自动确定最优特征数量"""
        # 使用肘部法则
        sorted_scores = np.sort(scores)[::-1]
        diffs = np.diff(sorted_scores)

        # 找到斜率变化最大的点
        elbow = np.argmin(diffs) + 1
        return max(elbow, 5)  # 至少保留5个特征

    def transform(self, X, feature_names=None):
        """转换数据，只保留选择的特征"""
        if feature_names is None:
            feature_names = [f'feature_{i}' for i in range(X.shape[1])]

        indices = [feature_names.index(f) for f in self.selected_features]
        return X[:, indices]

    def get_feature_ranking(self, feature_names=None):
        """获取特征排名"""
        combined = self._combine_scores()
        if feature_names is None:
            feature_names = [f'feature_{i}' for i in range(len(combined))]

        ranking = sorted(zip(feature_names, combined),
                        key=lambda x: x[1], reverse=True)
        return ranking

# 使用示例
from sklearn.datasets import make_classification

X, y = make_classification(
    n_samples=1000, n_features=50, n_informative=10,
    n_redundant=10, n_clusters_per_class=2, random_state=42
)

selector = AutoFeatureSelector(n_features='auto')
selector.fit(X, y)

print("选择的特征:")
print(selector.selected_features)
print(f"\n选择了 {len(selector.selected_features)} 个特征")

print("\n特征排名 (前10):")
for name, score in selector.get_feature_ranking()[:10]:
    print(f"  {name}: {score:.4f}")
```

## AutoML 使用场景与最佳实践

### 何时使用 AutoML

**适合使用 AutoML 的场景：**

| 场景 | 原因 |
|------|------|
| 快速原型验证 | 快速评估 ML 是否适用于特定问题 |
| 基准性能建立 | 为后续优化提供参考基准 |
| 非 ML 专家团队 | 降低机器学习门槛 |
| 大量数据集 | 自动化处理多个数据集 |
| 时间受限项目 | 快速交付 ML 解决方案 |
| 模型选择和调参 | 替代繁琐的手动调参 |

**不适合使用 AutoML 的场景：**

| 场景 | 原因 |
|------|------|
| 需要深度定制 | AutoML 可能无法满足特殊需求 |
| 计算资源受限 | AutoML 通常需要大量计算 |
| 实时要求极高 | 需要手动优化模型延迟 |
| 数据量很小 | 可能过拟合，手动选择更可靠 |
| 需要可解释性 | 自动选择的复杂模型难以解释 |

### AutoML 最佳实践

```python
# 数据准备最佳实践
def prepare_data_for_automl(df, target_col):
    """为 AutoML 准备数据"""
    import pandas as pd
    from sklearn.model_selection import train_test_split

    # 分离特征和目标
    X = df.drop(columns=[target_col])
    y = df[target_col]

    # 处理缺失值（AutoML 通常可以处理，但提前处理更好）
    numeric_cols = X.select_dtypes(include=[np.number]).columns
    categorical_cols = X.select_dtypes(include=['object', 'category']).columns

    X[numeric_cols] = X[numeric_cols].fillna(X[numeric_cols].median())
    X[categorical_cols] = X[categorical_cols].fillna('Unknown')

    # 划分数据集
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    return X_train, X_test, y_train, y_test

# 设置合理的时间和资源限制
automl_config = {
    'time_budget': 3600,        # 1小时通常足够
    'memory_limit': 8192,       # 8GB内存
    'n_jobs': -1,               # 使用所有CPU
    'early_stopping': True,     # 启用早停
}

# 使用交叉验证避免过拟合
from sklearn.model_selection import StratifiedKFold

cv_strategy = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

# 合理的评估指标选择
metrics_by_problem = {
    'binary_classification': ['roc_auc', 'f1', 'precision', 'recall'],
    'multiclass_classification': ['accuracy', 'f1_macro', 'f1_weighted'],
    'regression': ['rmse', 'mae', 'r2'],
    'imbalanced_classification': ['f1', 'pr_auc', 'balanced_accuracy']
}

# 后处理和验证
def validate_automl_results(automl_model, X_test, y_test):
    """验证 AutoML 结果"""
    from sklearn.metrics import classification_report, confusion_matrix
    import matplotlib.pyplot as plt

    y_pred = automl_model.predict(X_test)

    # 详细评估报告
    print("分类报告:")
    print(classification_report(y_test, y_pred))

    # 混淆矩阵
    cm = confusion_matrix(y_test, y_pred)
    print("\n混淆矩阵:")
    print(cm)

    # 检查是否过拟合
    train_score = automl_model.score(X_train, y_train)
    test_score = automl_model.score(X_test, y_test)

    if train_score - test_score > 0.1:
        print("\n警告: 可能存在过拟合!")
        print(f"训练集得分: {train_score:.4f}")
        print(f"测试集得分: {test_score:.4f}")

    return y_pred
```

### AutoML 工具选择指南

| 工具 | 适用场景 | 优势 | 局限 |
|------|----------|------|------|
| Auto-sklearn | 中小规模数据、scikit-learn 生态 | 易用、集成好 | 不支持深度学习 |
| H2O AutoML | 大规模数据、企业级应用 | 高性能、分布式 | 学习曲线较陡 |
| TPOT | 特征工程、管道优化 | 可导出代码 | 计算成本高 |
| Google AutoML | 云端部署、无服务器 | 托管服务、易扩展 | 成本较高、厂商锁定 |
| AutoGluon | 多模态数据、快速原型 | 易用、性能好 | 资源需求高 |
| Keras Tuner | 深度学习超参数 | Keras 集成好 | 仅限 Keras/TF |

## 总结

### AutoML 的价值

AutoML 通过自动化机器学习流程中的关键步骤，为机器学习的普及和应用带来了巨大价值：

1. **降低门槛**：让非专家也能构建高质量的机器学习模型
2. **提高效率**：自动化繁琐的调参和模型选择过程
3. **保证质量**：系统性搜索通常能找到比手动调参更好的配置
4. **标准化流程**：提供可重复、可比较的机器学习实验流程

### AutoML 的局限性

1. **计算成本**：大规模搜索需要大量计算资源
2. **黑盒性质**：自动选择的模型可能难以解释
3. **领域知识**：无法替代领域专家的洞察
4. **数据质量**：AutoML 无法修复数据质量问题
5. **特殊需求**：复杂的定制需求仍需手动实现

### 未来发展趋势

- **更高效的搜索算法**：减少计算成本
- **多目标优化**：同时优化精度、延迟、模型大小等
- **可解释 AutoML**：提供模型选择的解释
- **端到端自动化**：从数据收集到模型部署的全流程自动化
- **AutoML for AutoML**：自动选择最优的 AutoML 策略

## 参考资源

- [Auto-sklearn 官方文档](https://automl.github.io/auto-sklearn/)
- [H2O AutoML 文档](https://docs.h2o.ai/h2o/latest-stable/h2o-docs/automl.html)
- [Google Cloud AutoML](https://cloud.google.com/automl)
- [Keras Tuner](https://keras.io/keras_tuner/)
- [Optuna 文档](https://optuna.readthedocs.io/)
- [Featuretools](https://featuretools.alteryx.com/)
- [TPOT 文档](http://epistasislab.github.io/tpot/)
