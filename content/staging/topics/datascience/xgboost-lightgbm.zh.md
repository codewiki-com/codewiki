---
title: 经典机器学习：XGBoost 与 LightGBM
description: 掌握最强表格数据模型：GBDT、XGBoost、LightGBM和CatBoost
track: datascience
section: classical-ml
difficulty: advanced
tags:
  - XGBoost
  - LightGBM
  - GBDT
  - Boosting
status: imported
origin: old/src/content/docs/datascience/xgboost-lightgbm.zh.md
divergence: 0.413
issues:
  - divergent
legacy:
  category: DataScience
  subcategory: ClassicalML
  order: 14
  lastUpdated: 2026-01-07
---

在结构化数据（表格数据）领域，梯度提升树（Gradient Boosting Decision Tree, GBDT）及其变体一直是最强大的机器学习算法。XGBoost、LightGBM 和 CatBoost 作为 GBDT 的优秀实现，在 Kaggle 竞赛和工业界应用中屡创佳绩。本文将深入剖析这些算法的原理、优化技巧和实战应用。

---

## GBDT 原理详解

### 集成学习基础

集成学习通过组合多个基学习器来获得比单个学习器更好的泛化性能。主要分为两大类：

| 方法 | 代表算法 | 核心思想 | 特点 |
|------|---------|----------|------|
| Bagging | 随机森林 | 并行训练多个模型，投票/平均 | 降低方差 |
| Boosting | GBDT, AdaBoost | 串行训练，后续模型修正前序错误 | 降低偏差 |

### Boosting 核心思想

Boosting 的基本思想是：串行训练多个弱学习器，每个新的学习器都专注于纠正之前模型的错误。最终预测结果是所有弱学习器的加权组合。

**数学表示：**

对于输入 $x$，最终预测为：

$$\hat{y} = \sum_{m=1}^{M} \alpha_m h_m(x)$$

其中 $h_m(x)$ 是第 $m$ 个弱学习器，$\alpha_m$ 是其权重。

### GBDT 算法原理

GBDT（Gradient Boosting Decision Tree）使用决策树作为弱学习器，通过梯度下降优化损失函数。

**核心步骤：**

1. 初始化模型为常数值：$F_0(x) = \arg\min_\gamma \sum_{i=1}^{n} L(y_i, \gamma)$
2. 对于 $m = 1, 2, ..., M$：
   - 计算负梯度（伪残差）：$r_{im} = -\left[\frac{\partial L(y_i, F(x_i))}{\partial F(x_i)}\right]_{F=F_{m-1}}$
   - 拟合决策树 $h_m$ 到伪残差
   - 计算最优步长：$\gamma_m = \arg\min_\gamma \sum_{i=1}^{n} L(y_i, F_{m-1}(x_i) + \gamma h_m(x_i))$
   - 更新模型：$F_m(x) = F_{m-1}(x) + \eta \gamma_m h_m(x)$

**为什么使用负梯度？**

在函数空间中，负梯度方向是损失函数下降最快的方向。GBDT 通过让每棵新树拟合负梯度，实现在函数空间中的梯度下降。

```python
import numpy as np
from sklearn.tree import DecisionTreeRegressor

class SimpleGBDT:
    """简化版 GBDT 实现，帮助理解原理"""

    def __init__(self, n_estimators=100, learning_rate=0.1, max_depth=3):
        self.n_estimators = n_estimators
        self.learning_rate = learning_rate
        self.max_depth = max_depth
        self.trees = []
        self.init_prediction = None

    def _compute_negative_gradient(self, y, y_pred):
        """计算负梯度（MSE 损失的情况下就是残差）"""
        return y - y_pred

    def fit(self, X, y):
        # 初始化预测为均值
        self.init_prediction = np.mean(y)
        y_pred = np.full(len(y), self.init_prediction)

        for i in range(self.n_estimators):
            # 计算负梯度（伪残差）
            residuals = self._compute_negative_gradient(y, y_pred)

            # 拟合决策树到残差
            tree = DecisionTreeRegressor(max_depth=self.max_depth)
            tree.fit(X, residuals)
            self.trees.append(tree)

            # 更新预测
            y_pred += self.learning_rate * tree.predict(X)

            # 计算当前损失
            if (i + 1) % 10 == 0:
                mse = np.mean((y - y_pred) ** 2)
                print(f"Iteration {i+1}, MSE: {mse:.4f}")

        return self

    def predict(self, X):
        y_pred = np.full(len(X), self.init_prediction)
        for tree in self.trees:
            y_pred += self.learning_rate * tree.predict(X)
        return y_pred

# 使用示例
from sklearn.datasets import make_regression
from sklearn.model_selection import train_test_split

X, y = make_regression(n_samples=1000, n_features=10, noise=0.1, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = SimpleGBDT(n_estimators=100, learning_rate=0.1, max_depth=3)
model.fit(X_train, y_train)
y_pred = model.predict(X_test)
print(f"Test MSE: {np.mean((y_test - y_pred) ** 2):.4f}")
```

### 不同损失函数的梯度

| 任务 | 损失函数 | 负梯度 |
|------|---------|--------|
| 回归 (MSE) | $\frac{1}{2}(y - F)^2$ | $y - F$ |
| 回归 (MAE) | $\|y - F\|$ | $\text{sign}(y - F)$ |
| 二分类 (Logloss) | $-[y\log p + (1-y)\log(1-p)]$ | $y - p$ |
| 多分类 (Softmax) | $-\sum_k y_k \log p_k$ | $y_k - p_k$ |

---

## XGBoost 核心创新

XGBoost（eXtreme Gradient Boosting）由陈天奇于 2014 年提出，在 GBDT 基础上进行了多项重要改进。

### 正则化目标函数

XGBoost 的核心创新之一是在目标函数中加入正则化项：

$$\mathcal{L} = \sum_{i=1}^{n} l(y_i, \hat{y}_i) + \sum_{k=1}^{K} \Omega(f_k)$$

其中正则化项：

$$\Omega(f) = \gamma T + \frac{1}{2}\lambda \sum_{j=1}^{T} w_j^2$$

- $T$：叶子节点数量
- $w_j$：叶子节点权重
- $\gamma$：叶子节点数量的惩罚系数
- $\lambda$：L2 正则化系数

### 二阶泰勒展开

XGBoost 使用二阶泰勒展开近似损失函数，利用了更多的梯度信息：

$$\mathcal{L}^{(t)} \approx \sum_{i=1}^{n} [g_i f_t(x_i) + \frac{1}{2} h_i f_t^2(x_i)] + \Omega(f_t)$$

其中：
- $g_i = \frac{\partial l(y_i, \hat{y}^{(t-1)})}{\partial \hat{y}^{(t-1)}}$：一阶导数（梯度）
- $h_i = \frac{\partial^2 l(y_i, \hat{y}^{(t-1)})}{\partial (\hat{y}^{(t-1)})^2}$：二阶导数（Hessian）

**最优叶子权重：**

$$w_j^* = -\frac{\sum_{i \in I_j} g_i}{\sum_{i \in I_j} h_i + \lambda}$$

**分裂增益计算：**

$$Gain = \frac{1}{2}\left[\frac{(\sum_{i \in I_L} g_i)^2}{\sum_{i \in I_L} h_i + \lambda} + \frac{(\sum_{i \in I_R} g_i)^2}{\sum_{i \in I_R} h_i + \lambda} - \frac{(\sum_{i \in I} g_i)^2}{\sum_{i \in I} h_i + \lambda}\right] - \gamma$$

```python
import xgboost as xgb
import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score

# 加载数据
data = load_breast_cancer()
X, y = data.data, data.target
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 创建 DMatrix（XGBoost 的数据格式）
dtrain = xgb.DMatrix(X_train, label=y_train)
dtest = xgb.DMatrix(X_test, label=y_test)

# 参数设置
params = {
    'objective': 'binary:logistic',  # 二分类
    'eval_metric': 'auc',            # 评估指标
    'max_depth': 6,                  # 树的最大深度
    'eta': 0.1,                      # 学习率
    'subsample': 0.8,                # 行采样比例
    'colsample_bytree': 0.8,         # 列采样比例
    'lambda': 1.0,                   # L2 正则化
    'alpha': 0.0,                    # L1 正则化
    'min_child_weight': 1,           # 叶子节点最小权重和
    'gamma': 0.0,                    # 分裂所需最小增益
    'seed': 42
}

# 训练模型
evals = [(dtrain, 'train'), (dtest, 'eval')]
model = xgb.train(
    params,
    dtrain,
    num_boost_round=200,
    evals=evals,
    early_stopping_rounds=20,
    verbose_eval=10
)

# 预测
y_pred_proba = model.predict(dtest)
y_pred = (y_pred_proba > 0.5).astype(int)

print(f"\nAccuracy: {accuracy_score(y_test, y_pred):.4f}")
print(f"AUC: {roc_auc_score(y_test, y_pred_proba):.4f}")
```

### XGBoost 并行化策略

XGBoost 的并行化主要体现在特征维度上：

1. **预排序（Pre-sorted）算法**：
   - 训练前对所有特征进行排序
   - 分裂时可并行计算每个特征的最优分裂点
   - 空间复杂度：$O(2 \times \text{data} \times \text{features})$

2. **Block 结构**：
   - 数据以块为单位存储
   - 支持并行读取和计算
   - 便于缓存访问优化

3. **分位数近似（Approximate Algorithm）**：
   - 使用分位数划分桶，减少候选分裂点
   - 加权分位数草图（Weighted Quantile Sketch）

```python
# XGBoost 的 Scikit-learn 接口（更常用）
from xgboost import XGBClassifier, XGBRegressor

# 分类器
clf = XGBClassifier(
    n_estimators=200,
    max_depth=6,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    reg_lambda=1.0,
    reg_alpha=0.0,
    n_jobs=-1,           # 使用所有 CPU 核心
    random_state=42,
    use_label_encoder=False,
    eval_metric='logloss'
)

clf.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    early_stopping_rounds=20,
    verbose=10
)

# 回归器
reg = XGBRegressor(
    n_estimators=200,
    max_depth=6,
    learning_rate=0.1,
    objective='reg:squarederror',
    n_jobs=-1,
    random_state=42
)
```

### XGBoost 处理缺失值

XGBoost 能够自动处理缺失值，通过学习数据决定将缺失值分配到左子树还是右子树：

```python
import numpy as np
import xgboost as xgb

# 创建包含缺失值的数据
X_with_nan = X_train.copy()
# 随机插入缺失值
mask = np.random.random(X_with_nan.shape) < 0.1
X_with_nan[mask] = np.nan

# XGBoost 自动处理缺失值
dtrain_nan = xgb.DMatrix(X_with_nan, label=y_train)
model = xgb.train(params, dtrain_nan, num_boost_round=100)
```

---

## LightGBM 优化策略

LightGBM 由微软于 2017 年推出，通过多项创新技术实现了更快的训练速度和更低的内存消耗。

### GOSS：基于梯度的单边采样

GOSS（Gradient-based One-Side Sampling）的核心思想是：梯度大的样本对信息增益贡献更大，应该被保留。

**算法步骤：**

1. 按梯度绝对值降序排列所有样本
2. 保留梯度最大的 top $a \times 100\%$ 样本
3. 从剩余样本中随机采样 $b \times 100\%$
4. 对随机采样的样本乘以放大系数 $\frac{1-a}{b}$

```python
import numpy as np

def goss_sampling(gradients, a=0.2, b=0.1):
    """
    GOSS 采样实现

    Parameters:
    -----------
    gradients : 梯度数组
    a : 保留大梯度样本的比例
    b : 从小梯度样本中采样的比例

    Returns:
    --------
    selected_indices : 选中的样本索引
    weights : 样本权重
    """
    n = len(gradients)
    sorted_indices = np.argsort(np.abs(gradients))[::-1]

    # 保留梯度最大的 top a 样本
    top_n = int(a * n)
    top_indices = sorted_indices[:top_n]

    # 从剩余样本中随机采样 b
    rest_indices = sorted_indices[top_n:]
    rand_n = int(b * n)
    rand_indices = np.random.choice(rest_indices, rand_n, replace=False)

    # 组合索引
    selected_indices = np.concatenate([top_indices, rand_indices])

    # 计算权重
    weights = np.ones(len(selected_indices))
    weights[top_n:] = (1 - a) / b  # 放大系数

    return selected_indices, weights
```

### EFB：互斥特征绑定

EFB（Exclusive Feature Bundling）的核心思想是：很多特征是互斥的（很少同时非零），可以绑定到一起。

**为什么可以绑定？**

在高维稀疏数据中，很多特征的非零值几乎不重叠。将这些特征合并可以减少特征数量，加速训练。

**算法步骤：**

1. 构建特征冲突图（非零值重叠的特征连边）
2. 使用图着色算法找到可以绑定的特征组
3. 将同组特征合并为一个特征

```python
def exclusive_feature_bundling_demo():
    """EFB 概念演示"""
    import numpy as np

    # 假设有 3 个稀疏特征
    feature1 = np.array([1, 0, 0, 2, 0, 0])
    feature2 = np.array([0, 3, 0, 0, 4, 0])
    feature3 = np.array([0, 0, 5, 0, 0, 6])

    # 这三个特征互斥（非零位置不重叠），可以绑定
    # 通过偏移量区分原始特征
    offset1 = 0
    offset2 = max(feature1) + 1  # 3
    offset3 = offset2 + max(feature2) + 1  # 8

    # 合并后的特征
    bundled = (feature1 + offset1) + (feature2 + offset2) * (feature2 > 0) + \
              (feature3 + offset3) * (feature3 > 0)

    print(f"Feature 1: {feature1}")
    print(f"Feature 2: {feature2}")
    print(f"Feature 3: {feature3}")
    print(f"Bundled:   {bundled}")
    # 从 bundled 可以恢复原始特征

exclusive_feature_bundling_demo()
```

### Histogram-based 算法

LightGBM 使用直方图算法代替预排序算法：

**优势：**
1. **内存节省**：将连续特征离散化为 bins（默认 256 个）
2. **速度提升**：遍历直方图比遍历所有数据点更快
3. **直方图作差**：父节点直方图 - 左子节点直方图 = 右子节点直方图

```python
import lightgbm as lgb
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score

# 加载数据
data = load_breast_cancer()
X, y = data.data, data.target
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 创建 Dataset
train_data = lgb.Dataset(X_train, label=y_train)
test_data = lgb.Dataset(X_test, label=y_test, reference=train_data)

# 参数设置
params = {
    'objective': 'binary',
    'metric': 'auc',
    'boosting_type': 'gbdt',     # 或 'dart', 'goss'
    'num_leaves': 31,            # 叶子节点数（重要参数）
    'max_depth': -1,             # -1 表示不限制
    'learning_rate': 0.05,
    'n_estimators': 200,
    'subsample': 0.8,            # bagging_fraction
    'colsample_bytree': 0.8,     # feature_fraction
    'reg_alpha': 0.0,            # L1 正则化
    'reg_lambda': 0.0,           # L2 正则化
    'min_child_samples': 20,     # 叶子节点最小样本数
    'min_split_gain': 0.0,       # 分裂所需最小增益
    'max_bin': 255,              # 直方图 bins 数量
    'verbose': -1,
    'random_state': 42,
    'n_jobs': -1
}

# 训练模型
callbacks = [
    lgb.early_stopping(stopping_rounds=20),
    lgb.log_evaluation(period=10)
]

model = lgb.train(
    params,
    train_data,
    num_boost_round=500,
    valid_sets=[train_data, test_data],
    valid_names=['train', 'valid'],
    callbacks=callbacks
)

# 预测
y_pred_proba = model.predict(X_test)
y_pred = (y_pred_proba > 0.5).astype(int)

print(f"\nAccuracy: {accuracy_score(y_test, y_pred):.4f}")
print(f"AUC: {roc_auc_score(y_test, y_pred_proba):.4f}")
```

### Leaf-wise vs Level-wise 生长策略

| 策略 | 使用者 | 描述 | 特点 |
|------|--------|------|------|
| Level-wise | XGBoost | 按层生长，同一层所有节点一起分裂 | 稳定，不易过拟合 |
| Leaf-wise | LightGBM | 选择增益最大的叶子分裂 | 更快收敛，可能过拟合 |

```python
# LightGBM Scikit-learn 接口
from lightgbm import LGBMClassifier, LGBMRegressor

clf = LGBMClassifier(
    n_estimators=200,
    num_leaves=31,
    max_depth=-1,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    reg_alpha=0.0,
    reg_lambda=0.0,
    random_state=42,
    n_jobs=-1
)

clf.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    eval_metric='auc',
    callbacks=[lgb.early_stopping(20), lgb.log_evaluation(10)]
)
```

---

## CatBoost 类别特征处理

CatBoost 由 Yandex 于 2017 年推出，在类别特征处理方面有独特优势。

### Ordered Target Encoding

传统的 Target Encoding 存在数据泄露问题。CatBoost 使用 Ordered Target Encoding：

**原理：**
- 对于每个样本，只使用其之前样本的目标值计算编码
- 通过多次随机排列减少随机性

$$\hat{x}_k^i = \frac{\sum_{j=1}^{p-1} [x_j^i = x_k^i] \cdot y_j + a \cdot P}{\sum_{j=1}^{p-1} [x_j^i = x_k^i] + a}$$

其中 $p$ 是当前样本的排列位置，$a$ 是平滑参数，$P$ 是先验值。

```python
import catboost as cb
from catboost import CatBoostClassifier, CatBoostRegressor
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split

# 创建包含类别特征的示例数据
np.random.seed(42)
n_samples = 1000

data = pd.DataFrame({
    'age': np.random.randint(18, 70, n_samples),
    'income': np.random.randint(20000, 200000, n_samples),
    'city': np.random.choice(['北京', '上海', '广州', '深圳', '杭州'], n_samples),
    'education': np.random.choice(['高中', '本科', '硕士', '博士'], n_samples),
    'job': np.random.choice(['工程师', '销售', '管理', '设计', '其他'], n_samples)
})

# 目标变量（与特征有一定关联）
y = (data['income'] > 80000).astype(int) + \
    (data['education'].isin(['硕士', '博士'])).astype(int)
y = (y > 0).astype(int)

X_train, X_test, y_train, y_test = train_test_split(
    data, y, test_size=0.2, random_state=42
)

# 指定类别特征
cat_features = ['city', 'education', 'job']

# 创建 CatBoost 分类器
model = CatBoostClassifier(
    iterations=500,
    depth=6,
    learning_rate=0.1,
    loss_function='Logloss',
    eval_metric='AUC',
    cat_features=cat_features,  # 指定类别特征
    random_seed=42,
    verbose=50
)

# 训练模型
model.fit(
    X_train, y_train,
    eval_set=(X_test, y_test),
    early_stopping_rounds=50,
    use_best_model=True
)

# 评估
y_pred_proba = model.predict_proba(X_test)[:, 1]
print(f"AUC: {roc_auc_score(y_test, y_pred_proba):.4f}")
```

### Ordered Boosting

CatBoost 使用 Ordered Boosting 解决传统 GBDT 的预测偏移问题：

**传统 GBDT 的问题：**
- 训练集的残差计算使用了当前模型
- 而当前模型是在同一批数据上训练的
- 这导致梯度估计有偏

**Ordered Boosting 解决方案：**
- 对每个样本，使用不包含该样本训练的模型来计算残差
- 通过多个排列来增强鲁棒性

### CatBoost 其他特性

```python
# CatBoost 完整参数示例
model = CatBoostClassifier(
    # 基本参数
    iterations=1000,
    learning_rate=0.03,
    depth=6,

    # 正则化
    l2_leaf_reg=3.0,           # L2 正则化
    random_strength=1.0,        # 随机强度（用于对抗过拟合）
    bagging_temperature=1.0,    # 贝叶斯 bagging 温度

    # 类别特征
    cat_features=cat_features,
    one_hot_max_size=10,        # 小于此值的类别使用 one-hot

    # 采样
    subsample=0.8,              # 样本采样比例（需要 boosting_type='Bernoulli'）
    colsample_bylevel=0.8,      # 每层特征采样

    # 其他
    auto_class_weights='Balanced',  # 自动处理类别不平衡
    early_stopping_rounds=50,
    use_best_model=True,
    random_seed=42,
    verbose=100
)
```

---

## 超参数调优指南

### XGBoost 关键参数

| 参数 | 默认值 | 说明 | 调优建议 |
|------|--------|------|----------|
| `max_depth` | 6 | 树的最大深度 | 3-10，越大越容易过拟合 |
| `learning_rate` | 0.3 | 学习率 | 0.01-0.3，通常配合 n_estimators |
| `n_estimators` | 100 | 树的数量 | 配合早停使用 |
| `min_child_weight` | 1 | 叶子节点最小权重和 | 1-10，越大越保守 |
| `subsample` | 1 | 行采样比例 | 0.5-1.0 |
| `colsample_bytree` | 1 | 列采样比例 | 0.5-1.0 |
| `gamma` | 0 | 分裂最小增益 | 0-5 |
| `lambda` | 1 | L2 正则化 | 0-10 |
| `alpha` | 0 | L1 正则化 | 0-10 |

### LightGBM 关键参数

| 参数 | 默认值 | 说明 | 调优建议 |
|------|--------|------|----------|
| `num_leaves` | 31 | 叶子节点数量 | 20-150，与深度相关 |
| `max_depth` | -1 | 树的最大深度 | 配合 num_leaves |
| `learning_rate` | 0.1 | 学习率 | 0.01-0.3 |
| `min_child_samples` | 20 | 叶子最小样本数 | 10-100 |
| `subsample` | 1.0 | 样本采样比例 | 0.5-1.0 |
| `colsample_bytree` | 1.0 | 特征采样比例 | 0.5-1.0 |
| `reg_alpha` | 0 | L1 正则化 | 0-10 |
| `reg_lambda` | 0 | L2 正则化 | 0-10 |
| `min_split_gain` | 0 | 分裂最小增益 | 0-5 |

### 使用 Optuna 进行超参数优化

```python
import optuna
from optuna.integration import LightGBMPruningCallback
import lightgbm as lgb
from sklearn.model_selection import cross_val_score, StratifiedKFold
import numpy as np

def objective(trial):
    """Optuna 目标函数"""

    params = {
        'objective': 'binary',
        'metric': 'auc',
        'verbosity': -1,
        'boosting_type': 'gbdt',
        'random_state': 42,

        # 需要调优的参数
        'num_leaves': trial.suggest_int('num_leaves', 20, 150),
        'max_depth': trial.suggest_int('max_depth', 3, 12),
        'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
        'n_estimators': trial.suggest_int('n_estimators', 100, 1000),
        'min_child_samples': trial.suggest_int('min_child_samples', 5, 100),
        'subsample': trial.suggest_float('subsample', 0.5, 1.0),
        'colsample_bytree': trial.suggest_float('colsample_bytree', 0.5, 1.0),
        'reg_alpha': trial.suggest_float('reg_alpha', 1e-8, 10.0, log=True),
        'reg_lambda': trial.suggest_float('reg_lambda', 1e-8, 10.0, log=True),
    }

    # 交叉验证
    model = lgb.LGBMClassifier(**params)

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scores = cross_val_score(model, X_train, y_train, cv=cv, scoring='roc_auc')

    return scores.mean()

# 创建 study 并优化
study = optuna.create_study(direction='maximize', study_name='lgbm_tuning')
study.optimize(objective, n_trials=100, show_progress_bar=True)

print(f"Best AUC: {study.best_value:.4f}")
print(f"Best params: {study.best_params}")

# 使用最佳参数训练最终模型
best_params = study.best_params
best_params['objective'] = 'binary'
best_params['metric'] = 'auc'
best_params['random_state'] = 42

final_model = lgb.LGBMClassifier(**best_params)
final_model.fit(X_train, y_train)
```

### 网格搜索与随机搜索

```python
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV
from scipy.stats import uniform, randint
import xgboost as xgb

# 网格搜索
param_grid = {
    'max_depth': [3, 5, 7],
    'learning_rate': [0.01, 0.05, 0.1],
    'n_estimators': [100, 200, 300],
    'min_child_weight': [1, 3, 5],
    'subsample': [0.7, 0.8, 0.9],
    'colsample_bytree': [0.7, 0.8, 0.9]
}

xgb_clf = xgb.XGBClassifier(
    objective='binary:logistic',
    eval_metric='auc',
    use_label_encoder=False,
    random_state=42
)

grid_search = GridSearchCV(
    xgb_clf,
    param_grid,
    cv=5,
    scoring='roc_auc',
    n_jobs=-1,
    verbose=1
)

grid_search.fit(X_train, y_train)
print(f"Best params: {grid_search.best_params_}")
print(f"Best AUC: {grid_search.best_score_:.4f}")

# 随机搜索（更高效）
param_distributions = {
    'max_depth': randint(3, 10),
    'learning_rate': uniform(0.01, 0.29),
    'n_estimators': randint(100, 500),
    'min_child_weight': randint(1, 10),
    'subsample': uniform(0.5, 0.5),
    'colsample_bytree': uniform(0.5, 0.5),
    'gamma': uniform(0, 5),
    'reg_lambda': uniform(0, 10)
}

random_search = RandomizedSearchCV(
    xgb_clf,
    param_distributions,
    n_iter=50,
    cv=5,
    scoring='roc_auc',
    n_jobs=-1,
    random_state=42,
    verbose=1
)

random_search.fit(X_train, y_train)
print(f"Best params: {random_search.best_params_}")
print(f"Best AUC: {random_search.best_score_:.4f}")
```

---

## 早停策略与交叉验证

### 早停策略

早停是防止过拟合的重要技术，当验证集性能不再提升时停止训练。

```python
import xgboost as xgb
import lightgbm as lgb
from sklearn.model_selection import train_test_split

# 划分训练集和验证集
X_train, X_val, y_train, y_val = train_test_split(
    X_train_full, y_train_full, test_size=0.2, random_state=42
)

# XGBoost 早停
xgb_model = xgb.XGBClassifier(
    n_estimators=1000,  # 设置较大的值
    learning_rate=0.05,
    max_depth=6,
    random_state=42
)

xgb_model.fit(
    X_train, y_train,
    eval_set=[(X_val, y_val)],
    early_stopping_rounds=50,  # 50 轮不提升则停止
    verbose=True
)

print(f"Best iteration: {xgb_model.best_iteration}")
print(f"Best score: {xgb_model.best_score}")

# LightGBM 早停
lgb_model = lgb.LGBMClassifier(
    n_estimators=1000,
    learning_rate=0.05,
    num_leaves=31,
    random_state=42
)

lgb_model.fit(
    X_train, y_train,
    eval_set=[(X_val, y_val)],
    eval_metric='auc',
    callbacks=[
        lgb.early_stopping(stopping_rounds=50),
        lgb.log_evaluation(period=20)
    ]
)

print(f"Best iteration: {lgb_model.best_iteration_}")
print(f"Best score: {lgb_model.best_score_}")
```

### 交叉验证

```python
import xgboost as xgb
import lightgbm as lgb
from sklearn.model_selection import StratifiedKFold
import numpy as np

def cross_validate_model(model_type, X, y, params, n_folds=5):
    """通用交叉验证函数"""

    kfold = StratifiedKFold(n_splits=n_folds, shuffle=True, random_state=42)

    oof_predictions = np.zeros(len(y))
    scores = []

    for fold, (train_idx, val_idx) in enumerate(kfold.split(X, y)):
        X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
        y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]

        if model_type == 'xgb':
            model = xgb.XGBClassifier(**params)
            model.fit(
                X_train, y_train,
                eval_set=[(X_val, y_val)],
                early_stopping_rounds=50,
                verbose=False
            )
        elif model_type == 'lgb':
            model = lgb.LGBMClassifier(**params)
            model.fit(
                X_train, y_train,
                eval_set=[(X_val, y_val)],
                callbacks=[lgb.early_stopping(50), lgb.log_evaluation(0)]
            )

        # 预测验证集
        oof_predictions[val_idx] = model.predict_proba(X_val)[:, 1]

        # 计算当前折的分数
        fold_score = roc_auc_score(y_val, oof_predictions[val_idx])
        scores.append(fold_score)
        print(f"Fold {fold + 1} AUC: {fold_score:.4f}")

    # 总体 OOF 分数
    oof_score = roc_auc_score(y, oof_predictions)
    print(f"\nMean AUC: {np.mean(scores):.4f} (+/- {np.std(scores):.4f})")
    print(f"OOF AUC: {oof_score:.4f}")

    return oof_predictions, scores

# XGBoost 交叉验证
xgb_params = {
    'n_estimators': 1000,
    'max_depth': 6,
    'learning_rate': 0.05,
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'random_state': 42,
    'use_label_encoder': False,
    'eval_metric': 'auc'
}

oof_xgb, scores_xgb = cross_validate_model('xgb', X, y, xgb_params)
```

### XGBoost/LightGBM 内置交叉验证

```python
import xgboost as xgb
import lightgbm as lgb

# XGBoost 内置 CV
dtrain = xgb.DMatrix(X, label=y)

params = {
    'objective': 'binary:logistic',
    'eval_metric': 'auc',
    'max_depth': 6,
    'learning_rate': 0.05,
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'seed': 42
}

cv_results = xgb.cv(
    params,
    dtrain,
    num_boost_round=1000,
    nfold=5,
    stratified=True,
    early_stopping_rounds=50,
    verbose_eval=20,
    seed=42
)

print(f"Best round: {len(cv_results)}")
print(f"Best AUC: {cv_results['test-auc-mean'].max():.4f}")

# LightGBM 内置 CV
train_data = lgb.Dataset(X, label=y)

params = {
    'objective': 'binary',
    'metric': 'auc',
    'num_leaves': 31,
    'learning_rate': 0.05,
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'seed': 42
}

cv_results = lgb.cv(
    params,
    train_data,
    num_boost_round=1000,
    nfold=5,
    stratified=True,
    callbacks=[lgb.early_stopping(50), lgb.log_evaluation(20)],
    seed=42
)

print(f"Best round: {len(cv_results['valid auc-mean'])}")
print(f"Best AUC: {max(cv_results['valid auc-mean']):.4f}")
```

---

## 特征重要性分析

### 三种特征重要性计算方法

| 方法 | 说明 | 适用场景 |
|------|------|----------|
| Weight/Frequency | 特征被选作分裂点的次数 | 快速评估 |
| Gain | 特征带来的平均增益 | 评估特征价值 |
| Cover | 特征覆盖的样本数量 | 评估特征影响范围 |

```python
import xgboost as xgb
import lightgbm as lgb
import matplotlib.pyplot as plt
import pandas as pd

# XGBoost 特征重要性
xgb_model = xgb.XGBClassifier(n_estimators=200, max_depth=6, random_state=42)
xgb_model.fit(X_train, y_train)

# 获取不同类型的重要性
importance_weight = xgb_model.get_booster().get_score(importance_type='weight')
importance_gain = xgb_model.get_booster().get_score(importance_type='gain')
importance_cover = xgb_model.get_booster().get_score(importance_type='cover')

# 绘制重要性图
fig, axes = plt.subplots(1, 3, figsize=(18, 6))

for ax, (imp_type, importance) in zip(axes, [
    ('Weight', importance_weight),
    ('Gain', importance_gain),
    ('Cover', importance_cover)
]):
    # 排序并绘图
    sorted_imp = sorted(importance.items(), key=lambda x: x[1], reverse=True)[:15]
    features, values = zip(*sorted_imp)

    ax.barh(range(len(features)), values, align='center')
    ax.set_yticks(range(len(features)))
    ax.set_yticklabels(features)
    ax.set_title(f'XGBoost Feature Importance ({imp_type})')
    ax.invert_yaxis()

plt.tight_layout()
plt.savefig('xgb_feature_importance.png')
plt.show()

# LightGBM 特征重要性
lgb_model = lgb.LGBMClassifier(n_estimators=200, num_leaves=31, random_state=42)
lgb_model.fit(X_train, y_train)

# 获取重要性
importance_split = lgb_model.feature_importances_  # 默认是 split（分裂次数）
importance_gain = lgb_model.booster_.feature_importance(importance_type='gain')

# 创建 DataFrame
feature_names = X_train.columns if hasattr(X_train, 'columns') else [f'f{i}' for i in range(X_train.shape[1])]

importance_df = pd.DataFrame({
    'feature': feature_names,
    'split': importance_split,
    'gain': importance_gain
}).sort_values('gain', ascending=False)

print("Top 10 Features by Gain:")
print(importance_df.head(10))

# 使用 LightGBM 内置绘图
lgb.plot_importance(lgb_model, importance_type='gain', max_num_features=15, figsize=(10, 8))
plt.title('LightGBM Feature Importance (Gain)')
plt.tight_layout()
plt.savefig('lgb_feature_importance.png')
plt.show()
```

### SHAP 值分析

SHAP（SHapley Additive exPlanations）提供了更深入的特征重要性分析：

```python
import shap
import matplotlib.pyplot as plt

# 训练模型
model = xgb.XGBClassifier(n_estimators=200, max_depth=6, random_state=42)
model.fit(X_train, y_train)

# 创建 SHAP 解释器
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test)

# 全局特征重要性（Summary Plot）
plt.figure(figsize=(10, 8))
shap.summary_plot(shap_values, X_test, plot_type='bar', show=False)
plt.title('SHAP Feature Importance')
plt.tight_layout()
plt.savefig('shap_importance.png')
plt.show()

# 详细 Summary Plot（显示特征值对预测的影响）
plt.figure(figsize=(10, 8))
shap.summary_plot(shap_values, X_test, show=False)
plt.title('SHAP Summary Plot')
plt.tight_layout()
plt.savefig('shap_summary.png')
plt.show()

# 单个样本解释（Force Plot）
# 解释第一个测试样本
shap.initjs()
shap.force_plot(
    explainer.expected_value,
    shap_values[0, :],
    X_test.iloc[0, :] if hasattr(X_test, 'iloc') else X_test[0, :],
    matplotlib=True
)
plt.savefig('shap_force_plot.png')
plt.show()

# 特征交互分析（Dependence Plot）
plt.figure(figsize=(10, 6))
shap.dependence_plot(
    0,  # 第一个特征
    shap_values,
    X_test,
    interaction_index=1,  # 与第二个特征的交互
    show=False
)
plt.title('SHAP Dependence Plot')
plt.tight_layout()
plt.savefig('shap_dependence.png')
plt.show()

# Waterfall Plot（详细解释单个预测）
plt.figure(figsize=(10, 8))
shap.waterfall_plot(shap.Explanation(
    values=shap_values[0],
    base_values=explainer.expected_value,
    data=X_test.iloc[0] if hasattr(X_test, 'iloc') else X_test[0],
    feature_names=feature_names
))
plt.tight_layout()
plt.savefig('shap_waterfall.png')
plt.show()
```

### 排列重要性

```python
from sklearn.inspection import permutation_importance
import numpy as np

# 计算排列重要性
perm_importance = permutation_importance(
    model, X_test, y_test,
    n_repeats=10,
    random_state=42,
    n_jobs=-1
)

# 整理结果
perm_importance_df = pd.DataFrame({
    'feature': feature_names,
    'importance_mean': perm_importance.importances_mean,
    'importance_std': perm_importance.importances_std
}).sort_values('importance_mean', ascending=False)

print("Permutation Feature Importance:")
print(perm_importance_df.head(15))

# 绘图
plt.figure(figsize=(10, 8))
plt.barh(
    range(15),
    perm_importance_df['importance_mean'].head(15),
    xerr=perm_importance_df['importance_std'].head(15),
    align='center'
)
plt.yticks(range(15), perm_importance_df['feature'].head(15))
plt.xlabel('Mean Importance')
plt.title('Permutation Feature Importance')
plt.gca().invert_yaxis()
plt.tight_layout()
plt.savefig('permutation_importance.png')
plt.show()
```

---

## Kaggle 竞赛实战

### 竞赛标准流程

```python
import pandas as pd
import numpy as np
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import roc_auc_score
import xgboost as xgb
import lightgbm as lgb
import catboost as cb
import warnings
warnings.filterwarnings('ignore')

class KaggleCompetition:
    """Kaggle 竞赛标准代码框架"""

    def __init__(self, train_df, test_df, target_col, id_col=None):
        self.train_df = train_df.copy()
        self.test_df = test_df.copy()
        self.target_col = target_col
        self.id_col = id_col

        # 分离特征和标签
        self.y = self.train_df[target_col]
        self.train_id = self.train_df[id_col] if id_col else None
        self.test_id = self.test_df[id_col] if id_col else None

        # 删除 ID 和目标列
        drop_cols = [target_col]
        if id_col:
            drop_cols.append(id_col)

        self.X = self.train_df.drop(columns=drop_cols)
        self.X_test = self.test_df.drop(columns=[id_col] if id_col else [])

    def feature_engineering(self):
        """特征工程（根据具体问题定制）"""
        # 示例：添加统计特征
        numeric_cols = self.X.select_dtypes(include=[np.number]).columns.tolist()

        for df in [self.X, self.X_test]:
            # 行统计特征
            df['row_mean'] = df[numeric_cols].mean(axis=1)
            df['row_std'] = df[numeric_cols].std(axis=1)
            df['row_max'] = df[numeric_cols].max(axis=1)
            df['row_min'] = df[numeric_cols].min(axis=1)

        return self

    def train_single_model(self, model_type='lgb', params=None, n_folds=5):
        """训练单个模型"""
        kfold = StratifiedKFold(n_splits=n_folds, shuffle=True, random_state=42)

        oof_predictions = np.zeros(len(self.X))
        test_predictions = np.zeros(len(self.X_test))
        feature_importances = np.zeros(self.X.shape[1])

        for fold, (train_idx, val_idx) in enumerate(kfold.split(self.X, self.y)):
            print(f"\n{'='*50}")
            print(f"Fold {fold + 1}")
            print(f"{'='*50}")

            X_train = self.X.iloc[train_idx]
            X_val = self.X.iloc[val_idx]
            y_train = self.y.iloc[train_idx]
            y_val = self.y.iloc[val_idx]

            if model_type == 'lgb':
                model = lgb.LGBMClassifier(**params)
                model.fit(
                    X_train, y_train,
                    eval_set=[(X_val, y_val)],
                    callbacks=[lgb.early_stopping(100), lgb.log_evaluation(50)]
                )
                feature_importances += model.feature_importances_ / n_folds

            elif model_type == 'xgb':
                model = xgb.XGBClassifier(**params)
                model.fit(
                    X_train, y_train,
                    eval_set=[(X_val, y_val)],
                    early_stopping_rounds=100,
                    verbose=50
                )
                feature_importances += model.feature_importances_ / n_folds

            elif model_type == 'cat':
                model = cb.CatBoostClassifier(**params)
                model.fit(
                    X_train, y_train,
                    eval_set=(X_val, y_val),
                    early_stopping_rounds=100,
                    verbose=50
                )
                feature_importances += model.feature_importances_ / n_folds

            # 验证集预测
            oof_predictions[val_idx] = model.predict_proba(X_val)[:, 1]

            # 测试集预测
            test_predictions += model.predict_proba(self.X_test)[:, 1] / n_folds

            # 当前折分数
            fold_score = roc_auc_score(y_val, oof_predictions[val_idx])
            print(f"Fold {fold + 1} AUC: {fold_score:.5f}")

        # 总体分数
        oof_score = roc_auc_score(self.y, oof_predictions)
        print(f"\n{'='*50}")
        print(f"OOF AUC: {oof_score:.5f}")
        print(f"{'='*50}")

        return oof_predictions, test_predictions, feature_importances

    def train_ensemble(self):
        """模型融合"""
        # LightGBM 参数
        lgb_params = {
            'n_estimators': 2000,
            'num_leaves': 64,
            'max_depth': 8,
            'learning_rate': 0.03,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'reg_alpha': 0.1,
            'reg_lambda': 0.1,
            'random_state': 42,
            'n_jobs': -1
        }

        # XGBoost 参数
        xgb_params = {
            'n_estimators': 2000,
            'max_depth': 6,
            'learning_rate': 0.03,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'reg_alpha': 0.1,
            'reg_lambda': 0.1,
            'random_state': 42,
            'n_jobs': -1,
            'use_label_encoder': False,
            'eval_metric': 'auc'
        }

        # CatBoost 参数
        cat_params = {
            'iterations': 2000,
            'depth': 6,
            'learning_rate': 0.03,
            'l2_leaf_reg': 3,
            'random_seed': 42,
            'verbose': 0
        }

        # 训练各模型
        print("\n" + "="*60)
        print("Training LightGBM")
        print("="*60)
        oof_lgb, pred_lgb, _ = self.train_single_model('lgb', lgb_params)

        print("\n" + "="*60)
        print("Training XGBoost")
        print("="*60)
        oof_xgb, pred_xgb, _ = self.train_single_model('xgb', xgb_params)

        print("\n" + "="*60)
        print("Training CatBoost")
        print("="*60)
        oof_cat, pred_cat, _ = self.train_single_model('cat', cat_params)

        # 简单平均融合
        oof_ensemble = (oof_lgb + oof_xgb + oof_cat) / 3
        pred_ensemble = (pred_lgb + pred_xgb + pred_cat) / 3

        # 融合后分数
        ensemble_score = roc_auc_score(self.y, oof_ensemble)
        print(f"\n{'='*60}")
        print(f"Ensemble OOF AUC: {ensemble_score:.5f}")
        print(f"{'='*60}")

        # 加权融合（根据单模型表现调整权重）
        lgb_score = roc_auc_score(self.y, oof_lgb)
        xgb_score = roc_auc_score(self.y, oof_xgb)
        cat_score = roc_auc_score(self.y, oof_cat)

        # 使用 softmax 将分数转换为权重
        scores = np.array([lgb_score, xgb_score, cat_score])
        weights = np.exp(scores * 100) / np.sum(np.exp(scores * 100))

        print(f"\nModel weights: LGB={weights[0]:.3f}, XGB={weights[1]:.3f}, CAT={weights[2]:.3f}")

        oof_weighted = oof_lgb * weights[0] + oof_xgb * weights[1] + oof_cat * weights[2]
        pred_weighted = pred_lgb * weights[0] + pred_xgb * weights[1] + pred_cat * weights[2]

        weighted_score = roc_auc_score(self.y, oof_weighted)
        print(f"Weighted Ensemble OOF AUC: {weighted_score:.5f}")

        return {
            'oof_lgb': oof_lgb, 'pred_lgb': pred_lgb,
            'oof_xgb': oof_xgb, 'pred_xgb': pred_xgb,
            'oof_cat': oof_cat, 'pred_cat': pred_cat,
            'oof_ensemble': oof_ensemble, 'pred_ensemble': pred_ensemble,
            'oof_weighted': oof_weighted, 'pred_weighted': pred_weighted
        }

    def create_submission(self, predictions, filename='submission.csv'):
        """创建提交文件"""
        submission = pd.DataFrame({
            self.id_col: self.test_id,
            self.target_col: predictions
        })
        submission.to_csv(filename, index=False)
        print(f"Submission saved to {filename}")
        print(submission.head())

# 使用示例
# competition = KaggleCompetition(train_df, test_df, target_col='target', id_col='id')
# competition.feature_engineering()
# results = competition.train_ensemble()
# competition.create_submission(results['pred_weighted'], 'submission.csv')
```

### 高级特征工程技巧

```python
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, TargetEncoder
from sklearn.model_selection import StratifiedKFold

class AdvancedFeatureEngineering:
    """高级特征工程"""

    def __init__(self, train_df, test_df, target_col, cat_cols=None, num_cols=None):
        self.train_df = train_df.copy()
        self.test_df = test_df.copy()
        self.target_col = target_col
        self.cat_cols = cat_cols or []
        self.num_cols = num_cols or []

    def target_encoding_cv(self, n_folds=5, smooth=10):
        """交叉验证 Target Encoding（避免数据泄露）"""
        kfold = StratifiedKFold(n_splits=n_folds, shuffle=True, random_state=42)

        for col in self.cat_cols:
            # 训练集使用 OOF 方式编码
            self.train_df[f'{col}_te'] = 0.0

            for train_idx, val_idx in kfold.split(self.train_df, self.train_df[self.target_col]):
                # 使用训练折计算编码
                train_fold = self.train_df.iloc[train_idx]

                # 计算平滑 target mean
                global_mean = train_fold[self.target_col].mean()
                agg = train_fold.groupby(col)[self.target_col].agg(['sum', 'count'])

                # 平滑编码
                te = (agg['sum'] + smooth * global_mean) / (agg['count'] + smooth)

                # 应用到验证折
                self.train_df.loc[val_idx, f'{col}_te'] = \
                    self.train_df.loc[val_idx, col].map(te).fillna(global_mean)

            # 测试集使用全量训练数据编码
            global_mean = self.train_df[self.target_col].mean()
            agg = self.train_df.groupby(col)[self.target_col].agg(['sum', 'count'])
            te = (agg['sum'] + smooth * global_mean) / (agg['count'] + smooth)
            self.test_df[f'{col}_te'] = self.test_df[col].map(te).fillna(global_mean)

        return self

    def frequency_encoding(self):
        """频率编码"""
        for col in self.cat_cols:
            # 合并计算频率
            freq = pd.concat([self.train_df[col], self.test_df[col]]).value_counts()
            freq_norm = freq / len(freq)

            self.train_df[f'{col}_freq'] = self.train_df[col].map(freq)
            self.test_df[f'{col}_freq'] = self.test_df[col].map(freq)

            self.train_df[f'{col}_freq_norm'] = self.train_df[col].map(freq_norm)
            self.test_df[f'{col}_freq_norm'] = self.test_df[col].map(freq_norm)

        return self

    def aggregation_features(self, group_cols, agg_cols, aggs=['mean', 'std', 'min', 'max']):
        """聚合特征"""
        combined = pd.concat([self.train_df, self.test_df], ignore_index=True)

        for group_col in group_cols:
            for agg_col in agg_cols:
                for agg_func in aggs:
                    new_col = f'{group_col}_{agg_col}_{agg_func}'

                    agg_values = combined.groupby(group_col)[agg_col].transform(agg_func)

                    n_train = len(self.train_df)
                    self.train_df[new_col] = agg_values[:n_train].values
                    self.test_df[new_col] = agg_values[n_train:].values

        return self

    def interaction_features(self):
        """特征交互"""
        for i, col1 in enumerate(self.num_cols):
            for col2 in self.num_cols[i+1:]:
                # 加法交互
                self.train_df[f'{col1}_plus_{col2}'] = self.train_df[col1] + self.train_df[col2]
                self.test_df[f'{col1}_plus_{col2}'] = self.test_df[col1] + self.test_df[col2]

                # 乘法交互
                self.train_df[f'{col1}_mul_{col2}'] = self.train_df[col1] * self.train_df[col2]
                self.test_df[f'{col1}_mul_{col2}'] = self.test_df[col1] * self.test_df[col2]

                # 除法交互（避免除零）
                self.train_df[f'{col1}_div_{col2}'] = self.train_df[col1] / (self.train_df[col2] + 1e-8)
                self.test_df[f'{col1}_div_{col2}'] = self.test_df[col1] / (self.test_df[col2] + 1e-8)

        return self

    def binning_features(self, n_bins=10):
        """分箱特征"""
        for col in self.num_cols:
            # 使用训练集的分位数作为边界
            bins = pd.qcut(self.train_df[col], q=n_bins, duplicates='drop', retbins=True)[1]

            self.train_df[f'{col}_bin'] = pd.cut(self.train_df[col], bins=bins, labels=False)
            self.test_df[f'{col}_bin'] = pd.cut(self.test_df[col], bins=bins, labels=False)

        return self

    def get_data(self):
        """返回处理后的数据"""
        return self.train_df, self.test_df
```

### Stacking 模型融合

```python
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold
import numpy as np

class StackingEnsemble:
    """Stacking 集成"""

    def __init__(self, base_models, meta_model=None, n_folds=5):
        self.base_models = base_models
        self.meta_model = meta_model or LogisticRegression()
        self.n_folds = n_folds
        self.base_oof = None
        self.base_test_pred = None

    def fit(self, X, y, X_test):
        n_samples = len(X)
        n_test = len(X_test)
        n_models = len(self.base_models)

        # 存储 OOF 预测和测试集预测
        self.base_oof = np.zeros((n_samples, n_models))
        self.base_test_pred = np.zeros((n_test, n_models))

        kfold = StratifiedKFold(n_splits=self.n_folds, shuffle=True, random_state=42)

        # 训练基模型
        for i, (name, model) in enumerate(self.base_models):
            print(f"\nTraining {name}...")

            test_pred_fold = np.zeros((n_test, self.n_folds))

            for fold, (train_idx, val_idx) in enumerate(kfold.split(X, y)):
                X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
                y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]

                # 克隆模型避免污染
                fold_model = model.__class__(**model.get_params())

                if hasattr(fold_model, 'fit'):
                    if 'LGBM' in name or 'XGB' in name:
                        fold_model.fit(
                            X_train, y_train,
                            eval_set=[(X_val, y_val)],
                            verbose=0
                        )
                    else:
                        fold_model.fit(X_train, y_train)

                # OOF 预测
                if hasattr(fold_model, 'predict_proba'):
                    self.base_oof[val_idx, i] = fold_model.predict_proba(X_val)[:, 1]
                    test_pred_fold[:, fold] = fold_model.predict_proba(X_test)[:, 1]
                else:
                    self.base_oof[val_idx, i] = fold_model.predict(X_val)
                    test_pred_fold[:, fold] = fold_model.predict(X_test)

            # 平均测试集预测
            self.base_test_pred[:, i] = test_pred_fold.mean(axis=1)

            # 打印基模型分数
            base_score = roc_auc_score(y, self.base_oof[:, i])
            print(f"{name} OOF AUC: {base_score:.5f}")

        # 训练元模型
        print("\nTraining meta model...")
        self.meta_model.fit(self.base_oof, y)

        return self

    def predict(self, X_test=None):
        if X_test is not None:
            # 如果提供了新的测试数据，需要重新用基模型预测
            raise NotImplementedError("需要使用 fit 时的测试集预测")

        # 使用元模型预测
        if hasattr(self.meta_model, 'predict_proba'):
            return self.meta_model.predict_proba(self.base_test_pred)[:, 1]
        return self.meta_model.predict(self.base_test_pred)

    def get_oof_score(self, y):
        if hasattr(self.meta_model, 'predict_proba'):
            oof_pred = self.meta_model.predict_proba(self.base_oof)[:, 1]
        else:
            oof_pred = self.meta_model.predict(self.base_oof)

        return roc_auc_score(y, oof_pred)

# 使用示例
base_models = [
    ('LGBM', lgb.LGBMClassifier(n_estimators=500, num_leaves=31, learning_rate=0.05, random_state=42)),
    ('XGB', xgb.XGBClassifier(n_estimators=500, max_depth=6, learning_rate=0.05, random_state=42, use_label_encoder=False, eval_metric='logloss')),
    ('CatBoost', cb.CatBoostClassifier(iterations=500, depth=6, learning_rate=0.05, random_seed=42, verbose=0))
]

stacking = StackingEnsemble(base_models, meta_model=LogisticRegression())
stacking.fit(X_train, y_train, X_test)
predictions = stacking.predict()

print(f"\nStacking OOF AUC: {stacking.get_oof_score(y_train):.5f}")
```

---

## 面试要点

### 核心概念题

**Q1: GBDT 和随机森林的区别是什么？**

| 对比项 | 随机森林 | GBDT |
|--------|---------|------|
| 集成方式 | Bagging（并行） | Boosting（串行） |
| 基学习器 | 独立构建 | 依赖前序模型 |
| 目标 | 降低方差 | 降低偏差 |
| 过拟合风险 | 较低 | 较高（需要正则化） |
| 特征采样 | 必需 | 可选 |
| 训练速度 | 可并行，较快 | 串行，较慢 |

**Q2: XGBoost 相比 GBDT 有哪些改进？**

1. **正则化**：目标函数中加入了 L1 和 L2 正则化
2. **二阶泰勒展开**：使用二阶导数信息，更精确地近似损失函数
3. **列采样**：借鉴随机森林，增加随机性防止过拟合
4. **缺失值处理**：自动学习缺失值的最优分裂方向
5. **并行化**：特征级别的并行计算
6. **分位数近似**：加速候选分裂点的查找

**Q3: LightGBM 为什么比 XGBoost 快？**

1. **Histogram-based 算法**：将连续特征离散化为 bins，减少计算量
2. **GOSS**：基于梯度的单边采样，减少训练样本
3. **EFB**：互斥特征绑定，减少特征数量
4. **Leaf-wise 生长策略**：比 Level-wise 更快收敛
5. **直方图作差**：计算右子节点直方图时可以复用父节点和左子节点的信息

**Q4: CatBoost 如何处理类别特征？**

1. **Ordered Target Encoding**：对每个样本，只使用其之前样本计算目标编码，避免数据泄露
2. **多次排列**：通过多个随机排列减少编码的方差
3. **类别特征组合**：自动生成类别特征的交叉组合

**Q5: 如何选择 XGBoost、LightGBM 和 CatBoost？**

| 场景 | 推荐 | 原因 |
|------|------|------|
| 大规模数据 | LightGBM | 训练速度快，内存效率高 |
| 类别特征多 | CatBoost | 自动处理类别特征，效果好 |
| 需要精细调参 | XGBoost | 文档丰富，社区成熟 |
| GPU 加速 | 都支持 | XGBoost/LightGBM/CatBoost 均支持 GPU |
| 追求极致精度 | 模型融合 | 融合多个模型通常效果最好 |

### 工程实践题

**Q6: 如何调优 num_leaves 和 max_depth？**

- LightGBM 的 `num_leaves` 是 Leaf-wise 生长策略下控制复杂度的主要参数
- 经验法则：`num_leaves < 2^max_depth` 避免过拟合
- 对于平衡的树：`num_leaves = 2^max_depth - 1`
- 实际调参建议：先固定 `max_depth = -1`，调整 `num_leaves`（20-150）

**Q7: 早停策略的最佳实践？**

```python
# 设置足够大的 n_estimators
# 使用合适的 early_stopping_rounds（通常 50-200）
# 监控验证集指标

model.fit(
    X_train, y_train,
    eval_set=[(X_val, y_val)],
    early_stopping_rounds=100,  # 100 轮不提升则停止
    verbose=50
)

# 最佳迭代次数通常用于最终预测
print(f"Best iteration: {model.best_iteration_}")
```

**Q8: 如何处理过拟合？**

1. **降低模型复杂度**：减少 `max_depth`、`num_leaves`
2. **增加正则化**：提高 `reg_alpha`、`reg_lambda`
3. **增加随机性**：降低 `subsample`、`colsample_bytree`
4. **增加叶子节点最小样本数**：提高 `min_child_samples`/`min_child_weight`
5. **使用早停**：避免训练过多轮次
6. **增加数据量**：如果可能，收集更多数据

**Q9: 特征重要性不一致怎么办？**

不同方法得到的特征重要性可能不一致：
- **Gain**：反映特征对模型的贡献
- **Split/Frequency**：反映特征被使用的频率
- **SHAP**：更可靠的因果解释
- **排列重要性**：最直观的影响评估

建议：
1. 使用多种方法综合评估
2. 关注 SHAP 值作为主要参考
3. 结合业务知识判断特征合理性

**Q10: 如何进行有效的特征工程？**

1. **理解数据**：EDA 发现数据规律
2. **Target Encoding**：对类别特征使用交叉验证避免泄露
3. **聚合特征**：按类别分组计算统计量
4. **交互特征**：重要特征的组合
5. **时间特征**：提取年月日、周期性特征
6. **特征选择**：使用重要性评分筛选特征
7. **降维**：高维场景下使用 PCA 等方法

---

## 延伸阅读

### 推荐资源

1. **官方文档**
   - [XGBoost Documentation](https://xgboost.readthedocs.io/)
   - [LightGBM Documentation](https://lightgbm.readthedocs.io/)
   - [CatBoost Documentation](https://catboost.ai/docs/)

2. **经典论文**
   - XGBoost: "XGBoost: A Scalable Tree Boosting System" (Chen & Guestrin, 2016)
   - LightGBM: "LightGBM: A Highly Efficient Gradient Boosting Decision Tree" (Ke et al., 2017)
   - CatBoost: "CatBoost: unbiased boosting with categorical features" (Prokhorenkova et al., 2018)

3. **实战资源**
   - Kaggle 竞赛解决方案
   - Analytics Vidhya 教程
   - Machine Learning Mastery

### 进阶主题

- **深度梯度提升**：GBDT 与神经网络结合（如 NODE、TabNet）
- **自动机器学习**：AutoML 中的 GBDT 应用
- **分布式训练**：大规模数据的 GBDT 训练
- **模型解释性**：SHAP、LIME 等可解释性方法
- **在线学习**：增量学习和模型更新
- **混合精度训练**：GPU 加速优化

---

## 总结

XGBoost、LightGBM 和 CatBoost 是结构化数据建模的三大利器，各有特色：

- **XGBoost**：成熟稳定，文档丰富，适合精细调参
- **LightGBM**：速度快，内存效率高，适合大规模数据
- **CatBoost**：类别特征处理出色，开箱即用效果好

掌握这些工具，需要：
1. 理解 GBDT 的核心原理（梯度提升、残差拟合）
2. 熟悉各框架的特色优化（XGBoost 的正则化、LightGBM 的 GOSS/EFB、CatBoost 的 Ordered Encoding）
3. 积累调参经验（学习率、树深度、采样比例等）
4. 掌握特征工程技巧（编码、聚合、交互等）
5. 了解模型融合策略（Blending、Stacking）

在实际应用中，建议从简单模型开始，逐步优化特征和参数，并通过模型融合进一步提升效果。这些技能不仅在 Kaggle 竞赛中至关重要，在工业界的表格数据建模场景中同样是核心竞争力。
