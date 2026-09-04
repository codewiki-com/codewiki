---
title: 模型评估：模型选择与调参
description: 掌握模型选择方法：交叉验证、超参数搜索和贝叶斯优化
track: datascience
section: evaluation
difficulty: intermediate
tags:
  - 模型选择
  - 交叉验证
  - 超参数
  - 贝叶斯优化
status: imported
origin: old/src/content/docs/datascience/model-selection.zh.md
divergence: 0.453
issues:
  - divergent
legacy:
  category: DataScience
  subcategory: Evaluation
  order: 33
  lastUpdated: 2026-01-07
---

在机器学习项目中，选择合适的模型和优化超参数是决定最终模型性能的关键步骤。本文将系统性地介绍数据集划分策略、交叉验证方法、超参数搜索技术以及模型选择的最佳实践。

---

## 训练/验证/测试集划分

### 为什么需要划分数据集

在机器学习中，我们需要评估模型对未见数据的泛化能力。如果使用同一批数据进行训练和评估，模型可能会"记住"训练数据的噪声，导致在实际应用中表现不佳。因此，正确划分数据集是保证模型评估可靠性的基础。

### 三种数据集的作用

| 数据集 | 用途 | 使用频率 | 典型比例 |
|--------|------|----------|----------|
| 训练集（Training Set） | 训练模型，学习参数 | 每次训练 | 60-80% |
| 验证集（Validation Set） | 调参、模型选择、早停 | 训练过程中多次 | 10-20% |
| 测试集（Test Set） | 最终评估模型性能 | 仅最终评估一次 | 10-20% |

### 基础划分方法

```python
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.datasets import load_breast_cancer

# 加载示例数据
data = load_breast_cancer()
X, y = data.data, data.target

print(f"数据集大小: {X.shape}")
print(f"类别分布: {np.bincount(y)}")

# 方法1: 两次划分（推荐）
# 第一次划分：分出测试集
X_temp, X_test, y_temp, y_test = train_test_split(
    X, y,
    test_size=0.2,      # 20% 作为测试集
    random_state=42,    # 确保可复现性
    stratify=y          # 保持类别比例
)

# 第二次划分：从剩余数据中分出验证集
X_train, X_val, y_train, y_val = train_test_split(
    X_temp, y_temp,
    test_size=0.25,     # 0.25 * 0.8 = 0.2，即20%作为验证集
    random_state=42,
    stratify=y_temp
)

print(f"\n划分结果:")
print(f"训练集: {X_train.shape[0]} 样本 ({X_train.shape[0]/len(X)*100:.1f}%)")
print(f"验证集: {X_val.shape[0]} 样本 ({X_val.shape[0]/len(X)*100:.1f}%)")
print(f"测试集: {X_test.shape[0]} 样本 ({X_test.shape[0]/len(X)*100:.1f}%)")
```

### 数据泄露问题

数据泄露（Data Leakage）是指测试集信息无意中"泄露"到训练过程中，导致评估结果过于乐观。

**常见的数据泄露场景：**

```python
# 错误示例：在划分前进行特征标准化
from sklearn.preprocessing import StandardScaler

# 这样会导致数据泄露！
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)  # 使用了全部数据的统计信息
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2)

# 正确做法：先划分，再在训练集上fit
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)    # 仅在训练集上fit
X_test_scaled = scaler.transform(X_test)          # 用训练集的参数transform测试集
```

**避免数据泄露的原则：**

1. 先划分数据，再进行任何预处理
2. 预处理步骤（标准化、填充缺失值等）仅在训练集上fit
3. 使用Pipeline确保预处理和模型训练的一致性
4. 时间序列数据必须按时间顺序划分

### 使用Pipeline避免数据泄露

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score

# 创建Pipeline
pipeline = Pipeline([
    ('scaler', StandardScaler()),           # 预处理
    ('classifier', RandomForestClassifier(random_state=42))  # 模型
])

# 交叉验证时自动处理数据泄露问题
scores = cross_val_score(pipeline, X, y, cv=5, scoring='accuracy')
print(f"交叉验证准确率: {scores.mean():.4f} (+/- {scores.std() * 2:.4f})")
```

---

## K折交叉验证

### 基本原理

K折交叉验证（K-Fold Cross-Validation）将数据集分成K个大小相等的子集（折），每次使用K-1个折作为训练集，剩余1个折作为验证集，重复K次，确保每个样本都被用作验证一次。

**优点：**
- 充分利用有限的数据
- 减少单次划分的随机性
- 提供更稳定的性能估计

### 基础K折交叉验证

```python
from sklearn.model_selection import KFold, cross_val_score, cross_validate
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
import numpy as np

# 加载数据
X, y = load_breast_cancer(return_X_y=True)

# 创建K折交叉验证器
kfold = KFold(n_splits=5, shuffle=True, random_state=42)

# 方法1: 使用cross_val_score
model = RandomForestClassifier(n_estimators=100, random_state=42)
scores = cross_val_score(model, X, y, cv=kfold, scoring='accuracy')

print("K折交叉验证结果:")
print(f"每折得分: {scores}")
print(f"平均准确率: {scores.mean():.4f}")
print(f"标准差: {scores.std():.4f}")
print(f"95%置信区间: {scores.mean():.4f} +/- {scores.std() * 1.96:.4f}")

# 方法2: 使用cross_validate获取更多信息
cv_results = cross_validate(
    model, X, y, cv=kfold,
    scoring=['accuracy', 'precision', 'recall', 'f1'],
    return_train_score=True
)

print("\n详细交叉验证结果:")
for metric in ['accuracy', 'precision', 'recall', 'f1']:
    train_scores = cv_results[f'train_{metric}']
    test_scores = cv_results[f'test_{metric}']
    print(f"{metric}:")
    print(f"  训练集: {train_scores.mean():.4f} (+/- {train_scores.std():.4f})")
    print(f"  验证集: {test_scores.mean():.4f} (+/- {test_scores.std():.4f})")
```

### 手动实现K折交叉验证

```python
from sklearn.model_selection import KFold
from sklearn.metrics import accuracy_score
from sklearn.ensemble import GradientBoostingClassifier

def manual_cross_validation(X, y, model, n_splits=5, random_state=42):
    """手动实现K折交叉验证"""
    kfold = KFold(n_splits=n_splits, shuffle=True, random_state=random_state)

    train_scores = []
    val_scores = []
    fold_models = []

    for fold, (train_idx, val_idx) in enumerate(kfold.split(X)):
        # 划分数据
        X_train, X_val = X[train_idx], X[val_idx]
        y_train, y_val = y[train_idx], y[val_idx]

        # 克隆模型（避免模型状态污染）
        from sklearn.base import clone
        fold_model = clone(model)

        # 训练
        fold_model.fit(X_train, y_train)

        # 评估
        train_pred = fold_model.predict(X_train)
        val_pred = fold_model.predict(X_val)

        train_acc = accuracy_score(y_train, train_pred)
        val_acc = accuracy_score(y_val, val_pred)

        train_scores.append(train_acc)
        val_scores.append(val_acc)
        fold_models.append(fold_model)

        print(f"Fold {fold + 1}: Train Acc = {train_acc:.4f}, Val Acc = {val_acc:.4f}")

    print(f"\n平均训练准确率: {np.mean(train_scores):.4f} (+/- {np.std(train_scores):.4f})")
    print(f"平均验证准确率: {np.mean(val_scores):.4f} (+/- {np.std(val_scores):.4f})")

    return fold_models, train_scores, val_scores

# 使用示例
model = GradientBoostingClassifier(n_estimators=100, random_state=42)
fold_models, train_scores, val_scores = manual_cross_validation(X, y, model)
```

### 留一法交叉验证（LOOCV）

留一法是K折交叉验证的特例，其中K等于样本数量。每次仅用一个样本作为验证集。

```python
from sklearn.model_selection import LeaveOneOut, cross_val_score

# 留一法（适用于小数据集）
loo = LeaveOneOut()
model = LogisticRegression(max_iter=1000)

# 注意：LOOCV计算量大，仅适用于小数据集
# 这里仅取前100个样本演示
X_small, y_small = X[:100], y[:100]
scores = cross_val_score(model, X_small, y_small, cv=loo)
print(f"LOOCV准确率: {scores.mean():.4f}")
```

### 重复K折交叉验证

通过多次重复K折交叉验证，可以获得更稳定的结果：

```python
from sklearn.model_selection import RepeatedKFold, RepeatedStratifiedKFold

# 重复K折交叉验证
rkfold = RepeatedKFold(n_splits=5, n_repeats=10, random_state=42)
model = RandomForestClassifier(n_estimators=100, random_state=42)

scores = cross_val_score(model, X, y, cv=rkfold, scoring='accuracy')
print(f"重复K折交叉验证:")
print(f"总共 {len(scores)} 次评估")
print(f"平均准确率: {scores.mean():.4f} (+/- {scores.std():.4f})")
```

---

## 分层采样

### 为什么需要分层采样

当数据集类别不平衡时，简单的随机划分可能导致某些折中类别比例严重失衡，影响模型训练和评估的可靠性。分层采样确保每个子集中各类别的比例与原数据集一致。

### 分层K折交叉验证

```python
from sklearn.model_selection import StratifiedKFold
from sklearn.datasets import make_classification

# 创建不平衡数据集
X_imb, y_imb = make_classification(
    n_samples=1000,
    n_classes=2,
    weights=[0.9, 0.1],  # 90% vs 10% 不平衡
    random_state=42
)

print(f"类别分布: {np.bincount(y_imb)}")

# 普通K折 vs 分层K折
kfold = KFold(n_splits=5, shuffle=True, random_state=42)
skfold = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

print("\n普通K折各折类别分布:")
for fold, (train_idx, val_idx) in enumerate(kfold.split(X_imb)):
    print(f"Fold {fold + 1}: 训练集 {np.bincount(y_imb[train_idx])}, 验证集 {np.bincount(y_imb[val_idx])}")

print("\n分层K折各折类别分布:")
for fold, (train_idx, val_idx) in enumerate(skfold.split(X_imb, y_imb)):
    print(f"Fold {fold + 1}: 训练集 {np.bincount(y_imb[train_idx])}, 验证集 {np.bincount(y_imb[val_idx])}")
```

### 分组交叉验证

当数据中存在组结构（如同一用户的多条记录）时，需要确保同一组的数据不会同时出现在训练集和验证集中：

```python
from sklearn.model_selection import GroupKFold, LeaveOneGroupOut

# 假设有用户ID作为分组
groups = np.array([1, 1, 1, 2, 2, 3, 3, 3, 3, 4, 4, 5] * 50)  # 模拟用户ID
X_grouped = np.random.randn(len(groups), 10)
y_grouped = np.random.randint(0, 2, len(groups))

# 分组K折交叉验证
gkfold = GroupKFold(n_splits=5)
model = LogisticRegression(max_iter=1000)

scores = cross_val_score(model, X_grouped, y_grouped, cv=gkfold, groups=groups)
print(f"分组K折交叉验证准确率: {scores.mean():.4f} (+/- {scores.std():.4f})")

# 留一组交叉验证
logo = LeaveOneGroupOut()
scores_logo = cross_val_score(model, X_grouped, y_grouped, cv=logo, groups=groups)
print(f"留一组交叉验证准确率: {scores_logo.mean():.4f}")
```

### 时间序列交叉验证

时间序列数据不能使用随机划分，必须保持时间顺序：

```python
from sklearn.model_selection import TimeSeriesSplit

# 创建时间序列交叉验证器
tscv = TimeSeriesSplit(n_splits=5)

# 模拟时间序列数据
X_ts = np.arange(100).reshape(-1, 1)
y_ts = np.sin(X_ts).ravel() + np.random.randn(100) * 0.1

print("时间序列交叉验证划分:")
for fold, (train_idx, val_idx) in enumerate(tscv.split(X_ts)):
    print(f"Fold {fold + 1}:")
    print(f"  训练集: 索引 {train_idx[0]} - {train_idx[-1]} (共 {len(train_idx)} 个)")
    print(f"  验证集: 索引 {val_idx[0]} - {val_idx[-1]} (共 {len(val_idx)} 个)")
```

---

## 网格搜索

### 基本原理

网格搜索（Grid Search）是最基础的超参数搜索方法，通过穷举所有可能的超参数组合来找到最优配置。

**优点：**
- 简单直观，易于实现
- 保证找到搜索空间内的最优解
- 结果可复现

**缺点：**
- 计算量大，时间复杂度为 O(n^k)，n为每个参数的取值数，k为参数数量
- 不适合高维超参数空间
- 无法利用已有搜索结果指导后续搜索

### 基础网格搜索

```python
from sklearn.model_selection import GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_breast_cancer

# 加载数据
X, y = load_breast_cancer(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 定义参数网格
param_grid = {
    'n_estimators': [50, 100, 200],
    'max_depth': [None, 5, 10, 20],
    'min_samples_split': [2, 5, 10],
    'min_samples_leaf': [1, 2, 4]
}

# 计算总组合数
total_combinations = 1
for values in param_grid.values():
    total_combinations *= len(values)
print(f"总参数组合数: {total_combinations}")

# 创建网格搜索器
model = RandomForestClassifier(random_state=42)
grid_search = GridSearchCV(
    estimator=model,
    param_grid=param_grid,
    cv=5,                    # 5折交叉验证
    scoring='accuracy',      # 评估指标
    n_jobs=-1,              # 使用所有CPU核心
    verbose=2,              # 显示进度
    return_train_score=True # 返回训练集得分
)

# 执行搜索
grid_search.fit(X_train, y_train)

# 输出结果
print(f"\n最佳参数: {grid_search.best_params_}")
print(f"最佳交叉验证得分: {grid_search.best_score_:.4f}")
print(f"测试集得分: {grid_search.score(X_test, y_test):.4f}")
```

### 分析网格搜索结果

```python
import pandas as pd

# 将搜索结果转为DataFrame
results_df = pd.DataFrame(grid_search.cv_results_)

# 查看结果列
print("可用的结果列:")
print(results_df.columns.tolist())

# 查看最好的几个参数组合
top_results = results_df.nsmallest(10, 'rank_test_score')[
    ['params', 'mean_test_score', 'std_test_score', 'mean_train_score', 'rank_test_score']
]
print("\n前10个参数组合:")
print(top_results.to_string())

# 分析单个参数的影响
def plot_param_effect(results_df, param_name):
    """绘制单个参数对性能的影响"""
    param_col = f'param_{param_name}'

    # 按参数值分组计算平均得分
    grouped = results_df.groupby(param_col)['mean_test_score'].agg(['mean', 'std'])

    print(f"\n{param_name} 的影响:")
    print(grouped)

    return grouped

# 分析各参数的影响
for param in param_grid.keys():
    plot_param_effect(results_df, param)
```

### 使用Pipeline进行网格搜索

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

# 创建Pipeline
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('svm', SVC(random_state=42))
])

# 定义参数网格（注意参数名称的格式：步骤名__参数名）
param_grid = {
    'svm__C': [0.1, 1, 10, 100],
    'svm__kernel': ['rbf', 'poly'],
    'svm__gamma': ['scale', 'auto', 0.1, 1]
}

# 网格搜索
grid_search = GridSearchCV(
    pipeline,
    param_grid,
    cv=5,
    scoring='accuracy',
    n_jobs=-1,
    verbose=1
)

grid_search.fit(X_train, y_train)
print(f"最佳参数: {grid_search.best_params_}")
print(f"最佳得分: {grid_search.best_score_:.4f}")
```

### 多指标网格搜索

```python
from sklearn.model_selection import GridSearchCV
from sklearn.metrics import make_scorer, f1_score, precision_score, recall_score

# 定义多个评估指标
scoring = {
    'accuracy': 'accuracy',
    'precision': 'precision',
    'recall': 'recall',
    'f1': 'f1'
}

# 网格搜索
grid_search = GridSearchCV(
    RandomForestClassifier(random_state=42),
    param_grid={'n_estimators': [50, 100], 'max_depth': [5, 10, None]},
    cv=5,
    scoring=scoring,
    refit='f1',  # 使用F1分数选择最佳模型
    return_train_score=True
)

grid_search.fit(X_train, y_train)

# 查看各指标的最佳结果
results_df = pd.DataFrame(grid_search.cv_results_)
for metric in scoring.keys():
    best_idx = results_df[f'rank_test_{metric}'].idxmin()
    print(f"\n{metric} 最佳:")
    print(f"  参数: {results_df.loc[best_idx, 'params']}")
    print(f"  得分: {results_df.loc[best_idx, f'mean_test_{metric}']:.4f}")
```

---

## 随机搜索

### 基本原理

随机搜索（Random Search）在参数空间中随机采样，而不是穷举所有组合。研究表明，对于大多数问题，随机搜索比网格搜索更高效。

**优点：**
- 计算效率高，可以探索更大的参数空间
- 对高维参数空间更有效
- 可以使用连续分布定义搜索空间

**理论基础：**
Bergstra & Bengio (2012) 证明，当超参数对模型性能的影响存在差异时，随机搜索比网格搜索更高效。因为网格搜索在不重要的参数上浪费了大量计算资源。

### 基础随机搜索

```python
from sklearn.model_selection import RandomizedSearchCV
from scipy.stats import randint, uniform, loguniform

# 定义参数分布
param_distributions = {
    'n_estimators': randint(50, 500),           # 离散均匀分布
    'max_depth': [None] + list(range(5, 50)),   # 离散选项
    'min_samples_split': randint(2, 20),        # 离散均匀分布
    'min_samples_leaf': randint(1, 10),         # 离散均匀分布
    'max_features': ['sqrt', 'log2', None],     # 离散选项
    'bootstrap': [True, False]                   # 布尔选项
}

# 创建随机搜索器
model = RandomForestClassifier(random_state=42)
random_search = RandomizedSearchCV(
    estimator=model,
    param_distributions=param_distributions,
    n_iter=100,           # 采样100个参数组合
    cv=5,
    scoring='accuracy',
    n_jobs=-1,
    verbose=1,
    random_state=42,
    return_train_score=True
)

# 执行搜索
random_search.fit(X_train, y_train)

print(f"最佳参数: {random_search.best_params_}")
print(f"最佳交叉验证得分: {random_search.best_score_:.4f}")
print(f"测试集得分: {random_search.score(X_test, y_test):.4f}")
```

### 使用连续分布

```python
from scipy.stats import loguniform, uniform

# 对于需要在对数尺度上搜索的参数（如学习率），使用loguniform
param_distributions = {
    'learning_rate': loguniform(1e-4, 1e-1),  # 在[0.0001, 0.1]之间对数均匀采样
    'n_estimators': randint(50, 500),
    'max_depth': randint(3, 15),
    'subsample': uniform(0.6, 0.4),           # 在[0.6, 1.0]之间均匀采样
    'colsample_bytree': uniform(0.6, 0.4),
    'reg_alpha': loguniform(1e-5, 10),        # L1正则化
    'reg_lambda': loguniform(1e-5, 10)        # L2正则化
}

# 示例：GradientBoosting参数搜索
from sklearn.ensemble import GradientBoostingClassifier

gb_model = GradientBoostingClassifier(random_state=42)
gb_param_dist = {
    'learning_rate': loguniform(1e-3, 1e-1),
    'n_estimators': randint(50, 300),
    'max_depth': randint(3, 10),
    'min_samples_split': randint(2, 20),
    'min_samples_leaf': randint(1, 10),
    'subsample': uniform(0.6, 0.4)
}

random_search_gb = RandomizedSearchCV(
    gb_model,
    gb_param_dist,
    n_iter=50,
    cv=5,
    scoring='accuracy',
    n_jobs=-1,
    random_state=42
)

random_search_gb.fit(X_train, y_train)
print(f"GradientBoosting 最佳参数: {random_search_gb.best_params_}")
```

### 网格搜索 vs 随机搜索对比

```python
import time

# 定义相同的搜索空间
param_grid = {
    'n_estimators': [50, 100, 150, 200, 250],
    'max_depth': [3, 5, 7, 10, 15, None],
    'min_samples_split': [2, 5, 10, 15],
    'min_samples_leaf': [1, 2, 4, 8]
}

# 网格搜索
total_grid = 5 * 6 * 4 * 4  # 480个组合
print(f"网格搜索总组合数: {total_grid}")

start = time.time()
grid_search = GridSearchCV(
    RandomForestClassifier(random_state=42),
    param_grid, cv=5, scoring='accuracy', n_jobs=-1
)
grid_search.fit(X_train, y_train)
grid_time = time.time() - start

# 随机搜索（采样60个组合，约为网格搜索的12.5%）
param_dist = {
    'n_estimators': randint(50, 250),
    'max_depth': [3, 5, 7, 10, 15, None],
    'min_samples_split': randint(2, 15),
    'min_samples_leaf': randint(1, 8)
}

start = time.time()
random_search = RandomizedSearchCV(
    RandomForestClassifier(random_state=42),
    param_dist, n_iter=60, cv=5, scoring='accuracy', n_jobs=-1, random_state=42
)
random_search.fit(X_train, y_train)
random_time = time.time() - start

# 比较结果
print("\n对比结果:")
print(f"{'方法':<15} {'时间(秒)':<12} {'最佳CV得分':<15} {'测试集得分'}")
print(f"{'网格搜索':<15} {grid_time:<12.2f} {grid_search.best_score_:<15.4f} {grid_search.score(X_test, y_test):.4f}")
print(f"{'随机搜索':<15} {random_time:<12.2f} {random_search.best_score_:<15.4f} {random_search.score(X_test, y_test):.4f}")
```

---

## 贝叶斯优化

### 基本原理

贝叶斯优化（Bayesian Optimization）是一种基于概率模型的超参数优化方法。它使用先前的评估结果来指导下一次搜索，相比随机搜索更加高效。

**核心思想：**
1. 使用代理模型（Surrogate Model）拟合目标函数
2. 使用采集函数（Acquisition Function）决定下一个采样点
3. 评估新的采样点，更新代理模型
4. 重复直到收敛或达到预算

**常用库：**
- Optuna：功能强大，支持剪枝
- Hyperopt：基于TPE算法
- scikit-optimize：API友好
- BayesianOptimization：简单易用

### Optuna基础使用

```python
import optuna
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score

# 定义目标函数
def objective(trial):
    # 定义超参数搜索空间
    params = {
        'n_estimators': trial.suggest_int('n_estimators', 50, 500),
        'max_depth': trial.suggest_int('max_depth', 3, 30),
        'min_samples_split': trial.suggest_int('min_samples_split', 2, 20),
        'min_samples_leaf': trial.suggest_int('min_samples_leaf', 1, 10),
        'max_features': trial.suggest_categorical('max_features', ['sqrt', 'log2', None]),
        'bootstrap': trial.suggest_categorical('bootstrap', [True, False])
    }

    # 创建模型
    model = RandomForestClassifier(**params, random_state=42, n_jobs=-1)

    # 交叉验证评估
    scores = cross_val_score(model, X_train, y_train, cv=5, scoring='accuracy')

    return scores.mean()

# 创建study并优化
study = optuna.create_study(
    direction='maximize',  # 最大化准确率
    sampler=optuna.samplers.TPESampler(seed=42)  # TPE采样器
)

# 运行优化
study.optimize(objective, n_trials=100, show_progress_bar=True)

# 输出结果
print(f"\n最佳参数: {study.best_params}")
print(f"最佳得分: {study.best_value:.4f}")

# 使用最佳参数训练最终模型
best_model = RandomForestClassifier(**study.best_params, random_state=42)
best_model.fit(X_train, y_train)
print(f"测试集得分: {best_model.score(X_test, y_test):.4f}")
```

### Optuna高级功能：剪枝

```python
import optuna
from optuna.pruners import MedianPruner
from optuna.samplers import TPESampler
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import cross_val_score

# 定义带剪枝的目标函数
def objective_with_pruning(trial):
    params = {
        'learning_rate': trial.suggest_float('learning_rate', 1e-4, 0.3, log=True),
        'n_estimators': trial.suggest_int('n_estimators', 50, 500),
        'max_depth': trial.suggest_int('max_depth', 3, 15),
        'min_samples_split': trial.suggest_int('min_samples_split', 2, 20),
        'min_samples_leaf': trial.suggest_int('min_samples_leaf', 1, 10),
        'subsample': trial.suggest_float('subsample', 0.5, 1.0)
    }

    model = GradientBoostingClassifier(**params, random_state=42)

    # 使用K折交叉验证，支持剪枝
    from sklearn.model_selection import StratifiedKFold
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    scores = []
    for step, (train_idx, val_idx) in enumerate(skf.split(X_train, y_train)):
        X_fold_train, X_fold_val = X_train[train_idx], X_train[val_idx]
        y_fold_train, y_fold_val = y_train[train_idx], y_train[val_idx]

        model.fit(X_fold_train, y_fold_train)
        score = model.score(X_fold_val, y_fold_val)
        scores.append(score)

        # 报告中间结果用于剪枝
        intermediate_value = sum(scores) / len(scores)
        trial.report(intermediate_value, step)

        # 如果trial应该被剪枝，则提前终止
        if trial.should_prune():
            raise optuna.TrialPruned()

    return sum(scores) / len(scores)

# 创建带剪枝的study
study = optuna.create_study(
    direction='maximize',
    sampler=TPESampler(seed=42),
    pruner=MedianPruner(n_startup_trials=10, n_warmup_steps=2)
)

study.optimize(objective_with_pruning, n_trials=50, show_progress_bar=True)

print(f"最佳参数: {study.best_params}")
print(f"最佳得分: {study.best_value:.4f}")
print(f"完成的试验数: {len([t for t in study.trials if t.state == optuna.trial.TrialState.COMPLETE])}")
print(f"被剪枝的试验数: {len([t for t in study.trials if t.state == optuna.trial.TrialState.PRUNED])}")
```

### Optuna可视化

```python
import optuna
from optuna.visualization import (
    plot_optimization_history,
    plot_param_importances,
    plot_parallel_coordinate,
    plot_slice
)

# 绘制优化历史
fig = plot_optimization_history(study)
fig.write_html("optimization_history.html")

# 绘制参数重要性
fig = plot_param_importances(study)
fig.write_html("param_importances.html")

# 绘制平行坐标图
fig = plot_parallel_coordinate(study)
fig.write_html("parallel_coordinate.html")

# 绘制参数切片图
fig = plot_slice(study)
fig.write_html("param_slice.html")

# 打印参数重要性
importances = optuna.importance.get_param_importances(study)
print("\n参数重要性:")
for param, importance in importances.items():
    print(f"  {param}: {importance:.4f}")
```

### 使用scikit-optimize

```python
from skopt import BayesSearchCV
from skopt.space import Real, Integer, Categorical

# 定义搜索空间
search_spaces = {
    'n_estimators': Integer(50, 500),
    'max_depth': Integer(3, 30),
    'min_samples_split': Integer(2, 20),
    'min_samples_leaf': Integer(1, 10),
    'max_features': Categorical(['sqrt', 'log2', None]),
    'bootstrap': Categorical([True, False])
}

# 贝叶斯搜索
bayes_search = BayesSearchCV(
    RandomForestClassifier(random_state=42),
    search_spaces,
    n_iter=50,
    cv=5,
    scoring='accuracy',
    n_jobs=-1,
    random_state=42
)

bayes_search.fit(X_train, y_train)
print(f"最佳参数: {bayes_search.best_params_}")
print(f"最佳得分: {bayes_search.best_score_:.4f}")
```

### 各搜索方法对比

```python
import time
import numpy as np

# 定义公共参数空间
param_grid = {
    'n_estimators': [50, 100, 150, 200],
    'max_depth': [5, 10, 15, 20],
    'min_samples_split': [2, 5, 10],
    'min_samples_leaf': [1, 2, 4]
}

results = {}

# 网格搜索
start = time.time()
grid = GridSearchCV(
    RandomForestClassifier(random_state=42),
    param_grid, cv=5, scoring='accuracy', n_jobs=-1
)
grid.fit(X_train, y_train)
results['网格搜索'] = {
    'time': time.time() - start,
    'best_score': grid.best_score_,
    'test_score': grid.score(X_test, y_test)
}

# 随机搜索
start = time.time()
random = RandomizedSearchCV(
    RandomForestClassifier(random_state=42),
    param_distributions={
        'n_estimators': randint(50, 200),
        'max_depth': randint(5, 20),
        'min_samples_split': randint(2, 10),
        'min_samples_leaf': randint(1, 4)
    },
    n_iter=30, cv=5, scoring='accuracy', n_jobs=-1, random_state=42
)
random.fit(X_train, y_train)
results['随机搜索'] = {
    'time': time.time() - start,
    'best_score': random.best_score_,
    'test_score': random.score(X_test, y_test)
}

# 贝叶斯优化
start = time.time()
def objective_compare(trial):
    params = {
        'n_estimators': trial.suggest_int('n_estimators', 50, 200),
        'max_depth': trial.suggest_int('max_depth', 5, 20),
        'min_samples_split': trial.suggest_int('min_samples_split', 2, 10),
        'min_samples_leaf': trial.suggest_int('min_samples_leaf', 1, 4)
    }
    model = RandomForestClassifier(**params, random_state=42, n_jobs=-1)
    scores = cross_val_score(model, X_train, y_train, cv=5, scoring='accuracy')
    return scores.mean()

study_compare = optuna.create_study(direction='maximize', sampler=TPESampler(seed=42))
study_compare.optimize(objective_compare, n_trials=30, show_progress_bar=False)

best_model_optuna = RandomForestClassifier(**study_compare.best_params, random_state=42)
best_model_optuna.fit(X_train, y_train)

results['贝叶斯优化'] = {
    'time': time.time() - start,
    'best_score': study_compare.best_value,
    'test_score': best_model_optuna.score(X_test, y_test)
}

# 输出对比结果
print("\n超参数搜索方法对比:")
print(f"{'方法':<12} {'时间(秒)':<12} {'最佳CV得分':<15} {'测试集得分'}")
print("-" * 55)
for method, result in results.items():
    print(f"{method:<12} {result['time']:<12.2f} {result['best_score']:<15.4f} {result['test_score']:.4f}")
```

---

## 早停策略

### 基本原理

早停（Early Stopping）是一种正则化技术，通过监控验证集性能来防止模型过拟合。当验证集性能不再提升时，提前终止训练。

**优点：**
- 防止过拟合
- 节省训练时间
- 自动确定最优训练轮数

### 基础早停实现

```python
class EarlyStopping:
    """早停类"""

    def __init__(self, patience=10, min_delta=0, restore_best_weights=True):
        """
        Args:
            patience: 性能不提升的最大轮数
            min_delta: 性能提升的最小阈值
            restore_best_weights: 是否恢复最佳权重
        """
        self.patience = patience
        self.min_delta = min_delta
        self.restore_best_weights = restore_best_weights

        self.best_score = None
        self.best_weights = None
        self.counter = 0
        self.early_stop = False

    def __call__(self, score, model=None):
        if self.best_score is None:
            self.best_score = score
            if self.restore_best_weights and model is not None:
                self.best_weights = self._get_weights(model)
        elif score < self.best_score + self.min_delta:
            self.counter += 1
            if self.counter >= self.patience:
                self.early_stop = True
        else:
            self.best_score = score
            self.counter = 0
            if self.restore_best_weights and model is not None:
                self.best_weights = self._get_weights(model)

    def _get_weights(self, model):
        """获取模型权重的深拷贝"""
        import copy
        if hasattr(model, 'state_dict'):  # PyTorch
            return copy.deepcopy(model.state_dict())
        elif hasattr(model, 'get_weights'):  # Keras
            return model.get_weights()
        return None
```

### scikit-learn中的早停

```python
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.neural_network import MLPClassifier

# GradientBoosting的早停
gb_model = GradientBoostingClassifier(
    n_estimators=500,
    validation_fraction=0.2,    # 从训练集中划出20%作为验证集
    n_iter_no_change=10,        # patience
    tol=1e-4,                   # 最小改进阈值
    random_state=42
)

gb_model.fit(X_train, y_train)
print(f"实际训练轮数: {gb_model.n_estimators_}")
print(f"测试集得分: {gb_model.score(X_test, y_test):.4f}")

# MLP的早停
mlp_model = MLPClassifier(
    hidden_layer_sizes=(100, 50),
    max_iter=500,
    early_stopping=True,        # 启用早停
    validation_fraction=0.1,    # 验证集比例
    n_iter_no_change=10,        # patience
    tol=1e-4,
    random_state=42
)

mlp_model.fit(X_train, y_train)
print(f"实际训练轮数: {mlp_model.n_iter_}")
print(f"测试集得分: {mlp_model.score(X_test, y_test):.4f}")
```

### XGBoost/LightGBM中的早停

```python
# XGBoost早停示例
try:
    import xgboost as xgb

    # 准备数据
    dtrain = xgb.DMatrix(X_train, label=y_train)
    dval = xgb.DMatrix(X_val, label=y_val)
    dtest = xgb.DMatrix(X_test, label=y_test)

    params = {
        'objective': 'binary:logistic',
        'max_depth': 6,
        'learning_rate': 0.1,
        'seed': 42
    }

    # 训练带早停
    evals_list = [(dtrain, 'train'), (dval, 'validation')]
    model = xgb.train(
        params,
        dtrain,
        num_boost_round=1000,
        evals=evals_list,
        early_stopping_rounds=50,  # patience
        verbose_eval=50
    )

    print(f"\n最佳轮数: {model.best_iteration}")
    print(f"最佳验证得分: {model.best_score:.4f}")

except ImportError:
    print("XGBoost未安装，跳过示例")

# LightGBM早停示例
try:
    import lightgbm as lgb

    # 准备数据
    train_data = lgb.Dataset(X_train, label=y_train)
    val_data = lgb.Dataset(X_val, label=y_val, reference=train_data)

    params = {
        'objective': 'binary',
        'metric': 'binary_logloss',
        'max_depth': 6,
        'learning_rate': 0.1,
        'seed': 42,
        'verbose': -1
    }

    # 使用callback实现早停
    callbacks = [
        lgb.early_stopping(stopping_rounds=50),
        lgb.log_evaluation(period=50)
    ]

    model = lgb.train(
        params,
        train_data,
        num_boost_round=1000,
        valid_sets=[train_data, val_data],
        valid_names=['train', 'valid'],
        callbacks=callbacks
    )

    print(f"\n最佳轮数: {model.best_iteration}")

except ImportError:
    print("LightGBM未安装，跳过示例")
```

### PyTorch中的早停

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

class PyTorchEarlyStopping:
    """PyTorch早停实现"""

    def __init__(self, patience=10, min_delta=0, path='checkpoint.pt'):
        self.patience = patience
        self.min_delta = min_delta
        self.path = path
        self.counter = 0
        self.best_loss = None
        self.early_stop = False

    def __call__(self, val_loss, model):
        if self.best_loss is None:
            self.best_loss = val_loss
            self.save_checkpoint(model)
        elif val_loss > self.best_loss - self.min_delta:
            self.counter += 1
            if self.counter >= self.patience:
                self.early_stop = True
        else:
            self.best_loss = val_loss
            self.save_checkpoint(model)
            self.counter = 0

    def save_checkpoint(self, model):
        torch.save(model.state_dict(), self.path)

    def load_best_model(self, model):
        model.load_state_dict(torch.load(self.path))

# PyTorch训练示例
class SimpleNN(nn.Module):
    def __init__(self, input_dim, hidden_dim, output_dim):
        super().__init__()
        self.fc1 = nn.Linear(input_dim, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, output_dim)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.3)

    def forward(self, x):
        x = self.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.fc2(x)
        return x

def train_pytorch_model(model, train_loader, val_loader, epochs=100, patience=10):
    """PyTorch模型训练带早停"""
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = model.to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    early_stopping = PyTorchEarlyStopping(patience=patience)

    for epoch in range(epochs):
        # 训练阶段
        model.train()
        train_loss = 0
        for batch_x, batch_y in train_loader:
            batch_x, batch_y = batch_x.to(device), batch_y.to(device)

            optimizer.zero_grad()
            outputs = model(batch_x)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()

            train_loss += loss.item()

        # 验证阶段
        model.train(False)  # 设置为评估模式
        val_loss = 0
        correct = 0
        total = 0
        with torch.no_grad():
            for batch_x, batch_y in val_loader:
                batch_x, batch_y = batch_x.to(device), batch_y.to(device)
                outputs = model(batch_x)
                loss = criterion(outputs, batch_y)
                val_loss += loss.item()

                _, predicted = outputs.max(1)
                total += batch_y.size(0)
                correct += predicted.eq(batch_y).sum().item()

        train_loss /= len(train_loader)
        val_loss /= len(val_loader)
        val_acc = 100. * correct / total

        print(f"Epoch {epoch + 1}: Train Loss={train_loss:.4f}, Val Loss={val_loss:.4f}, Val Acc={val_acc:.2f}%")

        # 早停检查
        early_stopping(val_loss, model)
        if early_stopping.early_stop:
            print(f"\n早停触发于第 {epoch + 1} 轮")
            break

    # 加载最佳模型
    early_stopping.load_best_model(model)
    return model
```

---

## 模型选择最佳实践

### 完整的模型选择流程

```python
import numpy as np
import pandas as pd
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import classification_report, roc_auc_score
import warnings
warnings.filterwarnings('ignore')

# 数据准备
print("=" * 60)
print("步骤1: 数据准备")
print("=" * 60)

data = load_breast_cancer()
X, y = data.data, data.target

# 划分训练集、验证集、测试集
X_temp, X_test, y_temp, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
X_train, X_val, y_train, y_val = train_test_split(
    X_temp, y_temp, test_size=0.25, random_state=42, stratify=y_temp
)

print(f"训练集: {X_train.shape[0]} 样本")
print(f"验证集: {X_val.shape[0]} 样本")
print(f"测试集: {X_test.shape[0]} 样本")

# 定义候选模型
print("\n" + "=" * 60)
print("步骤2: 定义候选模型")
print("=" * 60)

models = {
    'Logistic Regression': Pipeline([
        ('scaler', StandardScaler()),
        ('clf', LogisticRegression(max_iter=1000, random_state=42))
    ]),
    'Decision Tree': DecisionTreeClassifier(random_state=42),
    'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
    'Gradient Boosting': GradientBoostingClassifier(random_state=42),
    'SVM': Pipeline([
        ('scaler', StandardScaler()),
        ('clf', SVC(probability=True, random_state=42))
    ]),
    'KNN': Pipeline([
        ('scaler', StandardScaler()),
        ('clf', KNeighborsClassifier())
    ])
}

# 交叉验证评估
print("\n" + "=" * 60)
print("步骤3: 交叉验证评估")
print("=" * 60)

skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_results = {}

for name, model in models.items():
    scores = cross_val_score(model, X_train, y_train, cv=skf, scoring='accuracy')
    cv_results[name] = {
        'mean': scores.mean(),
        'std': scores.std(),
        'scores': scores
    }
    print(f"{name}: {scores.mean():.4f} (+/- {scores.std():.4f})")

# 选择最佳模型进行超参数调优
print("\n" + "=" * 60)
print("步骤4: 超参数调优")
print("=" * 60)

# 选择表现最好的模型（假设是Random Forest）
best_base_model = max(cv_results.items(), key=lambda x: x[1]['mean'])[0]
print(f"选择 {best_base_model} 进行超参数调优")

# 使用Optuna进行超参数优化
import optuna

def rf_objective(trial):
    params = {
        'n_estimators': trial.suggest_int('n_estimators', 50, 300),
        'max_depth': trial.suggest_int('max_depth', 3, 20),
        'min_samples_split': trial.suggest_int('min_samples_split', 2, 20),
        'min_samples_leaf': trial.suggest_int('min_samples_leaf', 1, 10),
        'max_features': trial.suggest_categorical('max_features', ['sqrt', 'log2', None])
    }

    model = RandomForestClassifier(**params, random_state=42, n_jobs=-1)
    scores = cross_val_score(model, X_train, y_train, cv=skf, scoring='accuracy')
    return scores.mean()

study = optuna.create_study(direction='maximize', sampler=optuna.samplers.TPESampler(seed=42))
study.optimize(rf_objective, n_trials=50, show_progress_bar=True)

print(f"\n最佳参数: {study.best_params}")
print(f"最佳CV得分: {study.best_value:.4f}")

# 在验证集上评估
print("\n" + "=" * 60)
print("步骤5: 验证集评估")
print("=" * 60)

best_model = RandomForestClassifier(**study.best_params, random_state=42)
best_model.fit(X_train, y_train)
val_score = best_model.score(X_val, y_val)
val_proba = best_model.predict_proba(X_val)[:, 1]
val_auc = roc_auc_score(y_val, val_proba)

print(f"验证集准确率: {val_score:.4f}")
print(f"验证集AUC: {val_auc:.4f}")

# 最终测试
print("\n" + "=" * 60)
print("步骤6: 最终测试集评估")
print("=" * 60)

# 使用全部训练+验证数据重新训练
X_full_train = np.vstack([X_train, X_val])
y_full_train = np.hstack([y_train, y_val])

final_model = RandomForestClassifier(**study.best_params, random_state=42)
final_model.fit(X_full_train, y_full_train)

test_pred = final_model.predict(X_test)
test_proba = final_model.predict_proba(X_test)[:, 1]

print("\n分类报告:")
print(classification_report(y_test, test_pred, target_names=data.target_names))
print(f"测试集AUC: {roc_auc_score(y_test, test_proba):.4f}")
```

### 模型选择决策树

```
                          开始
                            |
                    数据量是否充足？
                   /              \
                  是               否
                  |                |
            是否需要可解释性？     考虑简单模型
           /           \          (逻辑回归、决策树)
          是            否
          |             |
     线性模型       是否有充足计算资源？
  (逻辑回归、       /            \
   决策树)        是             否
                  |              |
            集成方法         单模型
         (XGBoost、        (随机森林、
          LightGBM)         SVM)
```

### 常见场景的模型推荐

| 场景 | 推荐模型 | 说明 |
|------|----------|------|
| 结构化数据竞赛 | XGBoost/LightGBM | 表格数据首选，通常性能最佳 |
| 需要快速原型 | 随机森林 | 开箱即用，超参数不敏感 |
| 需要可解释性 | 逻辑回归/决策树 | 系数/规则可直接解释 |
| 小数据集 | SVM/KNN | 不需要大量数据 |
| 在线学习 | SGD分类器 | 支持增量训练 |
| 基线模型 | 逻辑回归 | 简单有效的基线 |

### 避免常见错误

```python
# 错误1: 在测试集上调参
# 错误示例
for params in param_grid:
    model.set_params(**params)
    model.fit(X_train, y_train)
    score = model.score(X_test, y_test)  # 不应该用测试集选参数！

# 正确做法：使用验证集或交叉验证
for params in param_grid:
    model.set_params(**params)
    cv_score = cross_val_score(model, X_train, y_train, cv=5).mean()

# 错误2: 数据泄露
# 错误示例
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)  # 使用了全部数据！
X_train, X_test = train_test_split(X_scaled, ...)

# 正确做法
X_train, X_test = train_test_split(X, ...)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 错误3: 忽略类别不平衡
# 错误示例
model = RandomForestClassifier()
model.fit(X_train, y_train)  # 类别严重不平衡时效果差

# 正确做法
model = RandomForestClassifier(class_weight='balanced')
# 或使用过采样/欠采样

# 错误4: 过度调参
# 错误示例：对每个超参数都精细搜索
param_grid = {
    'max_depth': list(range(1, 50)),  # 50个值，太多了
    'n_estimators': list(range(10, 500, 10))  # 49个值，太多了
}

# 正确做法：先粗搜索，再细搜索
# 第一轮：粗搜索
param_grid_coarse = {
    'max_depth': [5, 10, 20, 30],
    'n_estimators': [50, 100, 200]
}
# 找到最优区域后，再细搜索
```

### 模型融合策略

```python
from sklearn.ensemble import VotingClassifier, StackingClassifier

# 投票集成
voting_clf = VotingClassifier(
    estimators=[
        ('rf', RandomForestClassifier(n_estimators=100, random_state=42)),
        ('gb', GradientBoostingClassifier(random_state=42)),
        ('lr', Pipeline([
            ('scaler', StandardScaler()),
            ('clf', LogisticRegression(max_iter=1000, random_state=42))
        ]))
    ],
    voting='soft'  # 使用预测概率进行软投票
)

voting_clf.fit(X_train, y_train)
print(f"投票集成测试得分: {voting_clf.score(X_test, y_test):.4f}")

# 堆叠集成
stacking_clf = StackingClassifier(
    estimators=[
        ('rf', RandomForestClassifier(n_estimators=100, random_state=42)),
        ('gb', GradientBoostingClassifier(random_state=42)),
        ('svm', Pipeline([
            ('scaler', StandardScaler()),
            ('clf', SVC(probability=True, random_state=42))
        ]))
    ],
    final_estimator=LogisticRegression(max_iter=1000, random_state=42),
    cv=5
)

stacking_clf.fit(X_train, y_train)
print(f"堆叠集成测试得分: {stacking_clf.score(X_test, y_test):.4f}")
```

---

## 面试要点

### 常见面试问题

**Q1: 为什么要划分验证集，不直接用测试集调参？**

答：如果使用测试集调参，模型会"间接学习"测试集的信息，导致评估结果过于乐观。测试集应该完全独立，仅用于最终评估。验证集用于调参和模型选择，避免了对测试集的污染。

**Q2: K折交叉验证的K值如何选择？**

答：
- K=5或K=10是常用选择
- K值越大，偏差越小（训练集越大），方差越大（验证集越小）
- 数据量小时，可以使用较大的K值（如10）或LOOCV
- 数据量大时，K=5通常足够

**Q3: 网格搜索和随机搜索各有什么优缺点？**

答：
- 网格搜索：保证找到搜索空间内的最优解，但计算量大，不适合高维空间
- 随机搜索：计算效率高，可以探索更大的空间，但不保证找到最优解
- 对于大多数问题，随机搜索在相同时间预算下能找到更好的解

**Q4: 贝叶斯优化相比随机搜索的优势是什么？**

答：贝叶斯优化使用先前的评估结果来指导下一次搜索，更"智能"地探索参数空间，通常需要更少的迭代次数就能找到好的参数组合。但它的缺点是不易并行化，且对于低维简单问题可能不比随机搜索好多少。

**Q5: 如何处理数据泄露问题？**

答：
- 先划分数据，再进行任何预处理
- 使用Pipeline确保预处理步骤仅在训练集上fit
- 时间序列数据按时间顺序划分
- 特征工程时避免使用未来信息

**Q6: 早停的patience参数如何设置？**

答：
- 通常设置为5-20
- 如果模型收敛快，使用较小的patience
- 如果训练不稳定（如深度学习），使用较大的patience
- 可以通过观察学习曲线来调整

### 实战技巧总结

1. **建立基线**：先用简单模型建立baseline，再尝试复杂模型
2. **使用Pipeline**：确保预处理和模型训练的一致性
3. **分层采样**：对于不平衡数据集必须使用
4. **多指标评估**：不要只看单一指标
5. **重复实验**：使用不同随机种子验证结果的稳定性
6. **记录实验**：使用MLflow等工具记录所有实验

---

## 延伸阅读

### 推荐论文

1. **Random Search for Hyper-Parameter Optimization** (Bergstra & Bengio, 2012)
   - 证明了随机搜索比网格搜索更高效的理论基础

2. **Practical Bayesian Optimization of Machine Learning Algorithms** (Snoek et al., 2012)
   - 贝叶斯优化在机器学习中的应用

3. **Hyperband: A Novel Bandit-Based Approach** (Li et al., 2018)
   - 基于多臂赌博机的超参数优化方法

### 推荐书籍

- **《机器学习》（周志华）**：第2章详细介绍模型评估与选择
- **《统计学习方法》（李航）**：模型选择的理论基础
- **《AutoML: Methods, Systems, Challenges》**：自动化机器学习前沿

### 工具与框架

- **Optuna**：功能强大的超参数优化框架
- **Hyperopt**：基于TPE的贝叶斯优化库
- **Ray Tune**：分布式超参数调优
- **MLflow**：机器学习实验跟踪
- **Weights & Biases**：实验管理平台

### 进阶主题

- **神经架构搜索（NAS）**：自动搜索网络结构
- **元学习**：学习如何学习，自动选择算法
- **AutoML**：自动化整个机器学习流程
- **迁移学习中的模型选择**：如何选择预训练模型

---

## 总结

模型选择与调参是机器学习实践中的核心环节。本文介绍了：

1. **数据划分策略**：正确划分训练/验证/测试集，避免数据泄露
2. **交叉验证方法**：K折、分层、时间序列等多种交叉验证技术
3. **超参数搜索**：从网格搜索到随机搜索再到贝叶斯优化的演进
4. **早停策略**：防止过拟合，节省训练时间
5. **最佳实践**：完整的模型选择流程和常见错误避免

掌握这些技术，能够帮助你：
- 更可靠地评估模型性能
- 更高效地搜索超参数空间
- 构建更稳定的机器学习系统

记住，没有放之四海而皆准的最佳方法，需要根据具体问题、数据特点和资源限制来选择合适的策略。实践是最好的老师，多动手尝试不同的方法，积累经验。
