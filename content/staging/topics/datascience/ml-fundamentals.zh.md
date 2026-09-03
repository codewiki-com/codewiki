---
title: 机器学习基础
description: 掌握机器学习核心概念和算法
track: datascience
section: classical-ml
difficulty: intermediate
tags:
  - 机器学习
  - ML
  - 算法
  - AI
status: imported
origin: old/src/content/docs/ai/ml-fundamentals.zh.md
divergence: 0.228
issues: []
legacy:
  category: AI
  subcategory: Machine Learning
  order: 1
  lastUpdated: 2026-01-07
---

机器学习（ML）是人工智能的关键分支，它使计算机能够从数据中学习模式，并基于这些模式做出预测或决策。本综合指南涵盖了核心概念、主要算法类型、模型评估方法以及每个机器学习从业者必须掌握的实用技术。

## 机器学习的类型

机器学习方法根据学习信号的性质和学习系统可获得的反馈进行分类。理解这些范式是选择正确方法解决任何给定问题的基础。

### 监督学习

监督学习是最常见的机器学习范式。训练数据由输入特征及其对应的标签（目标值）组成，算法学习将输入映射到输出。

**关键特征：**
- 需要带标签的训练数据
- 目标是为新的、未见过的数据预测标签
- 包括分类和回归问题

**常见应用：**
- 垃圾邮件检测（分类）
- 房价预测（回归）
- 图像分类
- 信用评分
- 医疗诊断

```python
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

# 示例：二分类
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)
model = LogisticRegression()
model.fit(X_train, y_train)
predictions = model.predict(X_test)
print(f"准确率: {accuracy_score(y_test, predictions):.4f}")
```

### 无监督学习

无监督学习处理无标签数据。算法必须在没有明确指导的情况下发现数据中固有的结构和模式。

**关键特征：**
- 不需要带标签的数据
- 目标是发现数据中隐藏的结构
- 常用于数据探索和预处理

**常见应用：**
- 客户细分（聚类）
- 异常检测
- 可视化降维
- 购物篮分析
- 文本主题建模

```python
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

# 示例：客户细分
scaler = StandardScaler()
X_scaled = scaler.fit_transform(customer_data)

kmeans = KMeans(n_clusters=5, random_state=42)
clusters = kmeans.fit_predict(X_scaled)
```

### 强化学习

强化学习是一种范式，其中智能体通过与环境的交互来学习最优行为。智能体采取行动、观察结果，并根据奖励或惩罚调整其策略。

**核心组件：**
- **智能体**：决策实体
- **环境**：智能体与之交互的世界
- **状态**：环境的当前情况
- **动作**：智能体可用的选择
- **奖励**：来自环境的反馈信号
- **策略**：将状态映射到动作的策略

**常见应用：**
- 游戏AI（如AlphaGo、国际象棋引擎）
- 机器人控制
- 自动驾驶汽车
- 推荐系统优化
- 资源管理

```python
# Q学习概念伪代码
import numpy as np

class QLearningAgent:
    def __init__(self, states, actions, learning_rate=0.1, discount=0.95):
        self.q_table = np.zeros((states, actions))
        self.lr = learning_rate
        self.gamma = discount

    def update(self, state, action, reward, next_state):
        current_q = self.q_table[state, action]
        max_next_q = np.max(self.q_table[next_state])
        new_q = current_q + self.lr * (reward + self.gamma * max_next_q - current_q)
        self.q_table[state, action] = new_q
```

## 分类算法

分类是一种监督学习任务，目标是预测离散的类别标签。以下是每个机器学习从业者都应该掌握的最重要的分类算法。

### 逻辑回归

尽管名字中有"回归"，但逻辑回归是一种分类算法。它使用逻辑（sigmoid）函数来建模类别成员的概率。

**优势：**
- 产生概率输出
- 高度可解释
- 对线性可分数据效果好
- 计算效率高

```python
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

# 创建包含缩放和逻辑回归的管道
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('classifier', LogisticRegression(C=1.0, max_iter=1000))
])

pipeline.fit(X_train, y_train)
probabilities = pipeline.predict_proba(X_test)
```

### 决策树

决策树通过学习一系列决策规则将特征空间划分为区域。它们直观且产生可解释的模型。

**优势：**
- 易于理解和可视化
- 处理数值和分类数据
- 需要最少的数据预处理
- 能够捕获非线性关系

```python
from sklearn.tree import DecisionTreeClassifier, plot_tree
import matplotlib.pyplot as plt

dt_classifier = DecisionTreeClassifier(
    max_depth=5,
    min_samples_split=10,
    min_samples_leaf=5,
    random_state=42
)
dt_classifier.fit(X_train, y_train)

# 可视化树
plt.figure(figsize=(20, 10))
plot_tree(dt_classifier, feature_names=feature_names, filled=True)
plt.show()
```

### 随机森林

随机森林是一种集成方法，它构建多棵决策树并通过投票（分类）或平均（回归）组合它们的预测。

**优势：**
- 与单棵树相比减少过拟合
- 很好地处理高维数据
- 提供特征重要性排名
- 对异常值和噪声鲁棒

```python
from sklearn.ensemble import RandomForestClassifier

rf_classifier = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,
    min_samples_split=5,
    n_jobs=-1,
    random_state=42
)
rf_classifier.fit(X_train, y_train)

# 特征重要性
feature_importance = pd.DataFrame({
    'feature': feature_names,
    'importance': rf_classifier.feature_importances_
}).sort_values('importance', ascending=False)
```

### 支持向量机（SVM）

SVM 找到最大化类之间间隔的超平面。通过核技巧，它们可以处理非线性可分的数据。

**优势：**
- 在高维空间中有效
- 内存效率高（仅使用支持向量）
- 通过不同核函数具有多功能性
- 强大的泛化能力

```python
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler

# SVM 需要特征缩放
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

svm_classifier = SVC(
    kernel='rbf',
    C=1.0,
    gamma='scale',
    probability=True
)
svm_classifier.fit(X_train_scaled, y_train)
```

### K近邻（KNN）

KNN 根据其 k 个最近邻居中的多数类别对数据点进行分类。它是一种惰性学习算法，没有显式的训练阶段。

```python
from sklearn.neighbors import KNeighborsClassifier

knn = KNeighborsClassifier(
    n_neighbors=5,
    weights='distance',
    metric='euclidean'
)
knn.fit(X_train_scaled, y_train)
```

### 梯度提升（XGBoost、LightGBM）

梯度提升按顺序构建弱学习器的集成，每个新模型都在纠正前一个模型的错误。

```python
from xgboost import XGBClassifier

xgb_classifier = XGBClassifier(
    n_estimators=100,
    max_depth=6,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42
)
xgb_classifier.fit(X_train, y_train)
```

## 回归算法

回归预测连续的数值。理解这些算法对于价格预测、需求预测和风险评估等问题至关重要。

### 线性回归

线性回归将特征和目标之间的关系建模为线性组合加上截距项。

```python
from sklearn.linear_model import LinearRegression
import numpy as np

lr = LinearRegression()
lr.fit(X_train, y_train)

print(f"截距: {lr.intercept_:.4f}")
print(f"系数: {lr.coef_}")
print(f"R方: {lr.score(X_test, y_test):.4f}")
```

### 岭回归（L2正则化）

岭回归在损失函数中添加 L2 惩罚，防止系数值过大并减少过拟合。

```python
from sklearn.linear_model import Ridge

ridge = Ridge(alpha=1.0)
ridge.fit(X_train, y_train)
```

### Lasso回归（L1正则化）

Lasso回归使用 L1 惩罚，它可以将某些系数精确地驱动为零，执行自动特征选择。

```python
from sklearn.linear_model import Lasso

lasso = Lasso(alpha=0.1)
lasso.fit(X_train, y_train)

# 检查哪些特征具有非零系数
selected_features = np.where(lasso.coef_ != 0)[0]
print(f"选中的特征: {selected_features}")
```

### 弹性网络

弹性网络结合了 L1 和 L2 正则化，平衡特征选择和系数收缩。

```python
from sklearn.linear_model import ElasticNet

elastic_net = ElasticNet(alpha=0.1, l1_ratio=0.5)
elastic_net.fit(X_train, y_train)
```

### 梯度提升回归

```python
from sklearn.ensemble import GradientBoostingRegressor

gbr = GradientBoostingRegressor(
    n_estimators=100,
    max_depth=5,
    learning_rate=0.1,
    loss='squared_error',
    random_state=42
)
gbr.fit(X_train, y_train)
```

## 特征工程

特征工程通常是机器学习流程中影响最大的步骤。精心设计的特征可以显著提高模型性能，往往比算法选择更重要。

### 数值特征变换

**标准化（Z分数归一化）：**
```python
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
X_standardized = scaler.fit_transform(X)
# 结果: 均值=0, 标准差=1
```

**最小-最大归一化：**
```python
from sklearn.preprocessing import MinMaxScaler

scaler = MinMaxScaler(feature_range=(0, 1))
X_normalized = scaler.fit_transform(X)
# 结果: 值在 [0, 1] 范围内
```

**对数变换（用于偏态分布）：**
```python
import numpy as np

# 处理偏态分布
X_log = np.log1p(X)  # log(1 + x) 以处理零值
```

**分箱（离散化）：**
```python
from sklearn.preprocessing import KBinsDiscretizer

discretizer = KBinsDiscretizer(n_bins=5, encode='ordinal', strategy='quantile')
X_binned = discretizer.fit_transform(X)
```

### 分类特征编码

**独热编码：**
```python
from sklearn.preprocessing import OneHotEncoder

encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
X_encoded = encoder.fit_transform(categorical_features)
```

**标签编码：**
```python
from sklearn.preprocessing import LabelEncoder

label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(categories)
```

**目标编码：**
```python
# 目标编码用目标变量的均值替换类别
def target_encode(df, column, target):
    mean_target = df.groupby(column)[target].mean()
    return df[column].map(mean_target)
```

### 特征创建

```python
import pandas as pd

# 多项式特征
from sklearn.preprocessing import PolynomialFeatures
poly = PolynomialFeatures(degree=2, include_bias=False)
X_poly = poly.fit_transform(X)

# 交互特征
df['price_per_sqft'] = df['price'] / df['square_feet']
df['rooms_per_floor'] = df['total_rooms'] / df['floors']

# 日期特征
df['day_of_week'] = pd.to_datetime(df['date']).dt.dayofweek
df['month'] = pd.to_datetime(df['date']).dt.month
df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
```

### 特征选择

**过滤方法：**
```python
from sklearn.feature_selection import SelectKBest, f_classif, mutual_info_classif

# 基于统计测试选择前 k 个特征
selector = SelectKBest(score_func=f_classif, k=10)
X_selected = selector.fit_transform(X, y)
selected_features = selector.get_support(indices=True)
```

**包装方法（递归特征消除）：**
```python
from sklearn.feature_selection import RFE
from sklearn.ensemble import RandomForestClassifier

estimator = RandomForestClassifier(n_estimators=100)
rfe = RFE(estimator, n_features_to_select=10, step=1)
X_rfe = rfe.fit_transform(X, y)
```

**嵌入方法（使用模型特征重要性）：**
```python
from sklearn.feature_selection import SelectFromModel

selector = SelectFromModel(
    RandomForestClassifier(n_estimators=100),
    threshold='median'
)
X_embedded = selector.fit_transform(X, y)
```

### 完整特征工程管道

```python
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer

# 定义特征类型
numeric_features = ['age', 'income', 'credit_score']
categorical_features = ['education', 'occupation', 'region']

# 创建预处理管道
numeric_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())
])

categorical_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
    ('encoder', OneHotEncoder(handle_unknown='ignore'))
])

# 组合转换器
preprocessor = ColumnTransformer(
    transformers=[
        ('num', numeric_transformer, numeric_features),
        ('cat', categorical_transformer, categorical_features)
    ]
)

# 创建包含模型的完整管道
full_pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('classifier', RandomForestClassifier(n_estimators=100))
])
```

## 模型评估

正确的模型评估对于理解模型对未见数据的泛化能力至关重要。不同的指标适用于不同的问题类型和业务场景。

### 分类指标

**混淆矩阵：**

|  | 预测正类 | 预测负类 |
|--|--------------------|--------------------|
| 实际正类 | 真正例 (TP) | 假负例 (FN) |
| 实际负类 | 假正例 (FP) | 真负例 (TN) |

**关键指标：**

- **准确率**: $(TP + TN) / (TP + TN + FP + FN)$
- **精确率**: $TP / (TP + FP)$ - 在预测的正例中，有多少是正确的？
- **召回率（灵敏度）**: $TP / (TP + FN)$ - 在实际正例中，我们找到了多少？
- **F1分数**: $2 \times \frac{精确率 \times 召回率}{精确率 + 召回率}$
- **AUC-ROC**: 接收者操作特征曲线下面积

```python
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, classification_report, confusion_matrix,
    precision_recall_curve, roc_curve
)
import matplotlib.pyplot as plt
import seaborn as sns

def evaluate_classifier(y_true, y_pred, y_prob=None):
    """综合分类评估。"""
    print("=" * 50)
    print("分类评估报告")
    print("=" * 50)

    print(f"\n准确率:  {accuracy_score(y_true, y_pred):.4f}")
    print(f"精确率: {precision_score(y_true, y_pred, average='weighted'):.4f}")
    print(f"召回率:    {recall_score(y_true, y_pred, average='weighted'):.4f}")
    print(f"F1分数:  {f1_score(y_true, y_pred, average='weighted'):.4f}")

    if y_prob is not None:
        print(f"AUC-ROC:   {roc_auc_score(y_true, y_prob):.4f}")

    print("\n详细分类报告:")
    print(classification_report(y_true, y_pred))

    # 绘制混淆矩阵
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
    plt.xlabel('预测标签')
    plt.ylabel('真实标签')
    plt.title('混淆矩阵')
    plt.show()

# 绘制 ROC 曲线
def plot_roc_curve(y_true, y_prob):
    fpr, tpr, thresholds = roc_curve(y_true, y_prob)
    auc = roc_auc_score(y_true, y_prob)

    plt.figure(figsize=(8, 6))
    plt.plot(fpr, tpr, label=f'ROC 曲线 (AUC = {auc:.4f})')
    plt.plot([0, 1], [0, 1], 'k--', label='随机分类器')
    plt.xlabel('假正例率')
    plt.ylabel('真正例率')
    plt.title('ROC 曲线')
    plt.legend()
    plt.show()
```

### 回归指标

| 指标 | 公式 | 解释 |
|--------|---------|----------------|
| MAE | $\frac{1}{n}\sum\|y_i - \hat{y}_i\|$ | 平均绝对误差 |
| MSE | $\frac{1}{n}\sum(y_i - \hat{y}_i)^2$ | 平均平方误差 |
| RMSE | $\sqrt{MSE}$ | 均方根误差 |
| R方 | $1 - \frac{SS_{res}}{SS_{tot}}$ | 解释方差的比例 |
| MAPE | $\frac{100}{n}\sum\|\frac{y_i - \hat{y}_i}{y_i}\|$ | 平均绝对百分比误差 |

```python
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import numpy as np

def evaluate_regressor(y_true, y_pred):
    """综合回归评估。"""
    mae = mean_absolute_error(y_true, y_pred)
    mse = mean_squared_error(y_true, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_true, y_pred)
    mape = np.mean(np.abs((y_true - y_pred) / y_true)) * 100

    print("=" * 50)
    print("回归评估报告")
    print("=" * 50)
    print(f"\nMAE (平均绝对误差):     {mae:.4f}")
    print(f"MSE (平均平方误差):      {mse:.4f}")
    print(f"RMSE (均方根误差): {rmse:.4f}")
    print(f"R方:                      {r2:.4f}")
    print(f"MAPE (平均绝对百分比误差):   {mape:.2f}%")

    # 残差图
    residuals = y_true - y_pred
    plt.figure(figsize=(10, 4))

    plt.subplot(1, 2, 1)
    plt.scatter(y_pred, residuals, alpha=0.5)
    plt.axhline(y=0, color='r', linestyle='--')
    plt.xlabel('预测值')
    plt.ylabel('残差')
    plt.title('残差图')

    plt.subplot(1, 2, 2)
    plt.hist(residuals, bins=30, edgecolor='black')
    plt.xlabel('残差')
    plt.ylabel('频率')
    plt.title('残差分布')

    plt.tight_layout()
    plt.show()

    return {'mae': mae, 'mse': mse, 'rmse': rmse, 'r2': r2, 'mape': mape}
```

## 交叉验证

交叉验证对于获得可靠的模型性能估计和超参数调优至关重要。它有助于避免对单次训练-测试划分的过拟合。

### K折交叉验证

K折交叉验证将数据分成 K 个相等的部分。每个折叠轮流作为验证集，而其余 K-1 个折叠组成训练集。

```python
from sklearn.model_selection import cross_val_score, KFold
from sklearn.ensemble import RandomForestClassifier

model = RandomForestClassifier(n_estimators=100, random_state=42)

# 基本 K 折交叉验证
kfold = KFold(n_splits=5, shuffle=True, random_state=42)
scores = cross_val_score(model, X, y, cv=kfold, scoring='accuracy')

print(f"交叉验证分数: {scores}")
print(f"平均准确率: {scores.mean():.4f} (+/- {scores.std() * 2:.4f})")
```

### 分层K折交叉验证

对于不平衡数据集，分层 K 折确保每个折叠保持原始类别分布。

```python
from sklearn.model_selection import StratifiedKFold

skfold = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scores = cross_val_score(model, X, y, cv=skfold, scoring='f1_weighted')

print(f"分层CV分数: {scores}")
print(f"平均F1: {scores.mean():.4f}")
```

### 留一交叉验证（LOOCV）

LOOCV 在每次迭代中使用单个观察作为验证集。对于小数据集有用，但计算成本高。

```python
from sklearn.model_selection import LeaveOneOut

loo = LeaveOneOut()
scores = cross_val_score(model, X, y, cv=loo, scoring='accuracy')
print(f"LOOCV 平均准确率: {scores.mean():.4f}")
```

### 时间序列交叉验证

对于时间依赖的数据，我们必须确保训练数据始终在验证数据之前，以防止数据泄露。

```python
from sklearn.model_selection import TimeSeriesSplit

tscv = TimeSeriesSplit(n_splits=5)

for fold, (train_idx, val_idx) in enumerate(tscv.split(X)):
    print(f"折叠 {fold + 1}:")
    print(f"  训练索引: {train_idx[0]} 到 {train_idx[-1]}")
    print(f"  验证索引: {val_idx[0]} 到 {val_idx[-1]}")
```

### 嵌套交叉验证

用于带超参数调优的无偏模型选择：

```python
from sklearn.model_selection import cross_val_score, GridSearchCV

# 内循环用于超参数调优
param_grid = {
    'n_estimators': [50, 100, 200],
    'max_depth': [5, 10, None]
}

inner_cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
outer_cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

# 网格搜索作为估计器
grid_search = GridSearchCV(
    RandomForestClassifier(random_state=42),
    param_grid,
    cv=inner_cv,
    scoring='accuracy'
)

# 外循环用于性能估计
nested_scores = cross_val_score(grid_search, X, y, cv=outer_cv, scoring='accuracy')
print(f"嵌套CV平均准确率: {nested_scores.mean():.4f} (+/- {nested_scores.std() * 2:.4f})")
```

## 过拟合与正则化

理解和控制过拟合是构建能够很好泛化到新数据的模型的基础。

### 理解过拟合和欠拟合

**欠拟合（高偏差）：**
- 模型过于简单，无法捕获底层模式
- 高训练误差和高测试误差
- 训练和测试误差相似但都很高

**解决方案：**
- 增加模型复杂度
- 添加更多特征
- 减少正则化强度
- 使用更强大的算法

**过拟合（高方差）：**
- 模型记住了训练数据包括噪声
- 低训练误差但高测试误差
- 训练和测试性能之间差距大

**解决方案：**
- 获取更多训练数据
- 应用正则化
- 降低模型复杂度
- 使用 dropout（神经网络）
- 早停
- 交叉验证

### 偏差-方差权衡

总误差可以分解为：

$$\text{总误差} = \text{偏差}^2 + \text{方差} + \text{不可约误差}$$

| 模型复杂度 | 偏差 | 方差 | 典型问题 |
|------------------|------|----------|---------------|
| 低 | 高 | 低 | 欠拟合 |
| 高 | 低 | 高 | 过拟合 |
| 最优 | 平衡 | 平衡 | 最佳泛化 |

### 正则化技术

**L1正则化（Lasso）：**
- 在损失函数中添加系数绝对值之和
- 产生稀疏模型（一些系数变为精确的零）
- 对特征选择有用

```python
from sklearn.linear_model import Lasso

# L1 正则化
lasso = Lasso(alpha=0.1)  # 更高的 alpha = 更强的正则化
lasso.fit(X_train, y_train)

# 检查稀疏性
n_zero_coefs = np.sum(lasso.coef_ == 0)
print(f"零系数的数量: {n_zero_coefs}")
```

**L2正则化（Ridge）：**
- 在损失函数中添加系数平方之和
- 将所有系数收缩向零
- 系数保持非零但较小

```python
from sklearn.linear_model import Ridge

# L2 正则化
ridge = Ridge(alpha=1.0)
ridge.fit(X_train, y_train)
```

**弹性网络（组合 L1 + L2）：**
```python
from sklearn.linear_model import ElasticNet

# l1_ratio: 0 = 纯 L2, 1 = 纯 L1
elastic = ElasticNet(alpha=0.1, l1_ratio=0.5)
elastic.fit(X_train, y_train)
```

**树模型中的正则化：**
```python
from sklearn.ensemble import RandomForestClassifier

# 控制随机森林中的过拟合
rf = RandomForestClassifier(
    n_estimators=100,
    max_depth=10,           # 限制树深度
    min_samples_split=10,    # 分裂节点所需的最小样本数
    min_samples_leaf=5,      # 叶节点的最小样本数
    max_features='sqrt',     # 限制每次分裂的特征数
    random_state=42
)
```

### 学习曲线

可视化学习曲线有助于诊断偏差-方差问题：

```python
from sklearn.model_selection import learning_curve
import numpy as np
import matplotlib.pyplot as plt

def plot_learning_curves(estimator, X, y, cv=5):
    train_sizes, train_scores, val_scores = learning_curve(
        estimator, X, y, cv=cv,
        train_sizes=np.linspace(0.1, 1.0, 10),
        scoring='accuracy',
        n_jobs=-1
    )

    train_mean = np.mean(train_scores, axis=1)
    train_std = np.std(train_scores, axis=1)
    val_mean = np.mean(val_scores, axis=1)
    val_std = np.std(val_scores, axis=1)

    plt.figure(figsize=(10, 6))
    plt.plot(train_sizes, train_mean, 'o-', label='训练分数')
    plt.plot(train_sizes, val_mean, 'o-', label='验证分数')
    plt.fill_between(train_sizes, train_mean - train_std,
                     train_mean + train_std, alpha=0.1)
    plt.fill_between(train_sizes, val_mean - val_std,
                     val_mean + val_std, alpha=0.1)
    plt.xlabel('训练集大小')
    plt.ylabel('准确率')
    plt.title('学习曲线')
    plt.legend(loc='best')
    plt.grid(True)
    plt.show()
```

## 模型选择

选择正确的模型和超参数对于获得最佳性能至关重要。

### 超参数调优

**网格搜索：**
```python
from sklearn.model_selection import GridSearchCV

param_grid = {
    'n_estimators': [50, 100, 200],
    'max_depth': [None, 5, 10, 20],
    'min_samples_split': [2, 5, 10],
    'min_samples_leaf': [1, 2, 4]
}

grid_search = GridSearchCV(
    RandomForestClassifier(random_state=42),
    param_grid,
    cv=5,
    scoring='accuracy',
    n_jobs=-1,
    verbose=1
)
grid_search.fit(X_train, y_train)

print(f"最佳参数: {grid_search.best_params_}")
print(f"最佳CV分数: {grid_search.best_score_:.4f}")
```

**随机搜索：**
```python
from sklearn.model_selection import RandomizedSearchCV
from scipy.stats import randint, uniform

param_distributions = {
    'n_estimators': randint(50, 500),
    'max_depth': [None] + list(range(5, 30)),
    'min_samples_split': randint(2, 20),
    'min_samples_leaf': randint(1, 10),
    'max_features': ['sqrt', 'log2', None]
}

random_search = RandomizedSearchCV(
    RandomForestClassifier(random_state=42),
    param_distributions,
    n_iter=100,
    cv=5,
    scoring='accuracy',
    n_jobs=-1,
    random_state=42
)
random_search.fit(X_train, y_train)
```

### 模型比较框架

```python
from sklearn.model_selection import cross_val_score
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
import pandas as pd

# 定义要比较的模型
models = {
    '逻辑回归': LogisticRegression(max_iter=1000),
    '决策树': DecisionTreeClassifier(random_state=42),
    '随机森林': RandomForestClassifier(n_estimators=100, random_state=42),
    '梯度提升': GradientBoostingClassifier(random_state=42),
    'SVM': SVC(kernel='rbf', probability=True),
    'KNN': KNeighborsClassifier(n_neighbors=5)
}

# 比较模型
results = []
for name, model in models.items():
    scores = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring='accuracy')
    results.append({
        '模型': name,
        '平均准确率': scores.mean(),
        '标准差': scores.std(),
        '最小值': scores.min(),
        '最大值': scores.max()
    })

results_df = pd.DataFrame(results).sort_values('平均准确率', ascending=False)
print(results_df.to_string(index=False))
```

### 完整模型选择管道

```python
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score

# 加载数据
data = load_breast_cancer()
X, y = data.data, data.target

# 划分数据
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 创建管道
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('classifier', RandomForestClassifier(random_state=42))
])

# 定义参数网格
param_grid = {
    'classifier__n_estimators': [50, 100, 200],
    'classifier__max_depth': [None, 5, 10],
    'classifier__min_samples_split': [2, 5, 10]
}

# 带交叉验证的网格搜索
grid_search = GridSearchCV(
    pipeline, param_grid, cv=5,
    scoring='roc_auc', n_jobs=-1, verbose=1
)
grid_search.fit(X_train, y_train)

# 在测试集上评估
print(f"\n最佳参数: {grid_search.best_params_}")
print(f"最佳CV分数: {grid_search.best_score_:.4f}")

y_pred = grid_search.predict(X_test)
y_prob = grid_search.predict_proba(X_test)[:, 1]

print("\n测试集结果:")
print(classification_report(y_test, y_pred, target_names=data.target_names))
print(f"AUC-ROC: {roc_auc_score(y_test, y_prob):.4f}")
```

## 面试重点

### 常见面试问题

**问题1：如何识别和解决过拟合？**

识别：比较训练误差和测试误差。差距大表示过拟合。

解决方案：
- 增加训练数据
- 应用正则化（L1、L2）
- 降低模型复杂度
- 使用 dropout（神经网络）
- 早停
- 使用交叉验证进行模型选择

**问题2：解释偏差-方差权衡。**

偏差衡量预测与真实值的差距（模型拟合数据的能力）。方差衡量对训练数据波动的敏感度（模型的稳定性）。高偏差导致欠拟合；高方差导致过拟合。目标是找到最佳平衡。

**问题3：什么时候应该使用 L1 vs L2 正则化？**

L1（Lasso）：
- 当你怀疑许多特征是无关的
- 需要自动特征选择
- 想要稀疏、可解释的模型

L2（Ridge）：
- 当预期大多数特征是相关的
- 想防止任何单个特征占主导地位
- 数值上更稳定

两者都需要时使用弹性网络。

**问题4：如何处理不平衡数据集？**

- 重采样：过采样少数类（SMOTE）或欠采样多数类
- 类权重：调整算法以更多惩罚少数类错误
- 评估指标：使用 F1、精确率-召回率 AUC 而不是准确率
- 阈值调整：根据业务需求移动决策阈值
- 集成方法：平衡随机森林、Easy Ensemble

**问题5：解释交叉验证及其重要性。**

交叉验证通过在不同数据子集上训练和验证来提供稳健的性能估计。它减少了单次训练-测试划分的方差，并帮助检测过拟合。K折交叉验证是标准的；分类使用分层交叉验证，时间数据使用时间序列交叉验证。

**问题6：什么是特征工程，为什么重要？**

特征工程将原始数据转换为更好地表示底层问题的特征。好的特征往往比算法选择更重要。它包括：
- 处理缺失值
- 编码分类变量
- 缩放数值特征
- 创建交互特征
- 领域特定变换

### 实用技巧总结

1. **数据质量优先**：投入时间理解和清理数据
2. **从简单开始**：在使用复杂模型之前，用简单模型建立基准
3. **特征工程很重要**：好的特征往往胜过复杂的模型
4. **使用交叉验证**：避免依赖单次训练-测试划分
5. **注意数据泄露**：在划分数据后应用预处理
6. **选择适当的指标**：使指标与业务目标一致
7. **考虑可解释性**：平衡准确性和可解释性
8. **监控生产模型**：实施漂移检测和定期重训练

## 延伸阅读

### 推荐书籍

- **《Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow》**（Aurelien Geron）：面向初学者到中级从业者的实用、代码丰富的指南
- **《Pattern Recognition and Machine Learning》**（Christopher Bishop）：从概率角度对机器学习的严格数学处理
- **《The Elements of Statistical Learning》**（Hastie, Tibshirani, Friedman）：全面的统计学习参考
- **《Machine Learning: A Probabilistic Perspective》**（Kevin Murphy）：现代概率方法的机器学习

### 在线资源

- **Andrew Ng 的机器学习课程**（Coursera）：初学者的基础课程
- **fast.ai**：自上而下方法的实用深度学习课程
- **Kaggle**：用于实践的数据科学竞赛
- **scikit-learn 文档**：带示例的优秀 API 参考
- **Google 机器学习速成课程**：免费、实用的入门

### 高级主题

- **深度学习**：神经网络、CNN、RNN、Transformer
- **自然语言处理**：词嵌入、BERT、GPT、LLM
- **计算机视觉**：图像分类、目标检测、分割
- **推荐系统**：协同过滤、矩阵分解
- **强化学习**：DQN、策略梯度、Actor-Critic
- **AutoML**：自动化机器学习管道
- **MLOps**：模型部署、监控和生命周期管理
- **可解释AI**：SHAP、LIME、可解释模型

## 总结

机器学习是一个不断发展的广阔领域。本指南涵盖了每个机器学习从业者必须掌握的基础概念：

1. **机器学习类型**：了解何时使用监督、无监督或强化学习
2. **算法**：了解主要分类和回归算法的优缺点
3. **特征工程**：创建提高模型性能的信息性特征
4. **模型评估**：选择适当的指标并正确解释结果
5. **交叉验证**：获得可靠的性能估计
6. **正则化**：通过各种技术控制过拟合
7. **模型选择**：超参数调优和模型比较的系统方法

要真正掌握机器学习，请关注：

1. **强大的数学基础**：线性代数、概率论、统计学和优化
2. **大量实践**：参与多样化的项目和竞赛
3. **持续学习**：跟上最新的研究和工具
4. **业务理解**：将技术适当地应用于现实问题

机器学习不仅仅是关于算法和模型。它涵盖了理解问题、准备数据、构建和评估模型以及部署解决方案的整个过程。本指南为你的机器学习之旅提供了坚实的基础。
