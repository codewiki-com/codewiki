---
title: 机器学习模型评估指南
description: 掌握模型评估方法，科学验证模型效果
track: datascience
section: classical-ml
difficulty: intermediate
tags:
  - 模型评估
  - 交叉验证
  - 指标
  - 过拟合
status: imported
origin: old/src/content/docs/ai/model-evaluation.zh.md
divergence: 0.309
issues: []
legacy:
  category: AI
  subcategory: Machine Learning
  order: 17
  lastUpdated: 2026-01-07
---

模型评估是机器学习工作流程中至关重要的环节。一个优秀的机器学习工程师不仅要会训练模型，更要掌握科学评估模型的方法。本文将深入介绍各种评估指标、交叉验证技术、混淆矩阵分析、ROC/AUC 曲线以及过拟合检测方法，帮助你全面掌握模型评估的核心技能。

## 评估指标（Evaluation Metrics）

不同类型的机器学习任务需要使用不同的评估指标。选择正确的评估指标对于客观衡量模型性能至关重要。

### 分类任务评估指标

#### 准确率（Accuracy）

准确率是最直观的分类指标，表示正确分类的样本占总样本的比例。

```python
from sklearn.metrics import accuracy_score
import numpy as np

# 真实标签和预测标签
y_true = np.array([1, 0, 1, 1, 0, 1, 0, 0, 1, 1])
y_pred = np.array([1, 0, 1, 0, 0, 1, 1, 0, 1, 1])

# 计算准确率
accuracy = accuracy_score(y_true, y_pred)
print(f"准确率: {accuracy:.4f}")  # 输出: 准确率: 0.8000
```

**准确率的局限性：** 在类别不平衡的数据集中，准确率可能会产生误导。例如，在一个 99% 为负样本的数据集中，一个总是预测负类的模型也能达到 99% 的准确率。

#### 精确率（Precision）

精确率表示在所有预测为正类的样本中，实际为正类的比例。精确率关注的是"预测为正的有多少是真正的正例"。

$$\text{Precision} = \frac{TP}{TP + FP}$$

```python
from sklearn.metrics import precision_score

precision = precision_score(y_true, y_pred)
print(f"精确率: {precision:.4f}")  # 输出: 精确率: 0.8333
```

#### 召回率（Recall）/ 灵敏度（Sensitivity）

召回率表示在所有实际为正类的样本中，被正确预测为正类的比例。召回率关注的是"真正的正例有多少被找出来了"。

$$\text{Recall} = \frac{TP}{TP + FN}$$

```python
from sklearn.metrics import recall_score

recall = recall_score(y_true, y_pred)
print(f"召回率: {recall:.4f}")  # 输出: 召回率: 0.8333
```

#### F1 分数（F1 Score）

F1 分数是精确率和召回率的调和平均值，在需要同时考虑两者时非常有用。

$$F1 = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$$

```python
from sklearn.metrics import f1_score, classification_report

f1 = f1_score(y_true, y_pred)
print(f"F1 分数: {f1:.4f}")

# 获取完整的分类报告
print("\n分类报告:")
print(classification_report(y_true, y_pred, target_names=['负类', '正类']))
```

输出示例：
```
分类报告:
              precision    recall  f1-score   support

          负类       0.75      0.75      0.75         4
          正类       0.83      0.83      0.83         6

    accuracy                           0.80        10
   macro avg       0.79      0.79      0.79        10
weighted avg       0.80      0.80      0.80        10
```

#### 多分类评估指标

对于多分类问题，我们需要考虑如何聚合各类别的指标：

```python
from sklearn.metrics import precision_score, recall_score, f1_score

# 多分类示例
y_true_multi = [0, 1, 2, 0, 1, 2, 0, 1, 2]
y_pred_multi = [0, 2, 1, 0, 0, 2, 0, 1, 2]

# macro: 各类别指标的算术平均（不考虑类别样本数量）
print(f"Macro F1: {f1_score(y_true_multi, y_pred_multi, average='macro'):.4f}")

# weighted: 按各类别样本数量加权平均
print(f"Weighted F1: {f1_score(y_true_multi, y_pred_multi, average='weighted'):.4f}")

# micro: 汇总所有类别的 TP、FP、FN 后计算
print(f"Micro F1: {f1_score(y_true_multi, y_pred_multi, average='micro'):.4f}")
```

### 回归任务评估指标

#### 均方误差（MSE）和均方根误差（RMSE）

MSE 衡量预测值与真实值之间差异的平方的平均值，RMSE 是其平方根，与原始数据单位一致。

```python
from sklearn.metrics import mean_squared_error
import numpy as np

# 真实值和预测值
y_true_reg = np.array([3.0, 5.0, 2.5, 7.0, 4.5])
y_pred_reg = np.array([2.8, 5.2, 2.0, 6.5, 4.8])

# 计算 MSE 和 RMSE
mse = mean_squared_error(y_true_reg, y_pred_reg)
rmse = np.sqrt(mse)

print(f"MSE: {mse:.4f}")
print(f"RMSE: {rmse:.4f}")
```

#### 平均绝对误差（MAE）

MAE 衡量预测值与真实值之间绝对差异的平均值，对异常值不如 MSE 敏感。

```python
from sklearn.metrics import mean_absolute_error

mae = mean_absolute_error(y_true_reg, y_pred_reg)
print(f"MAE: {mae:.4f}")
```

#### 决定系数（R-squared，R²）

R² 表示模型解释了多少目标变量的方差，取值范围通常在 0 到 1 之间（可能为负）。

```python
from sklearn.metrics import r2_score

r2 = r2_score(y_true_reg, y_pred_reg)
print(f"R² 分数: {r2:.4f}")
```

### 评估指标选择指南

| 场景 | 推荐指标 | 原因 |
|------|----------|------|
| 类别平衡的分类 | 准确率、F1 | 直观且全面 |
| 类别不平衡的分类 | F1、AUC-ROC、精确率/召回率 | 避免准确率的误导 |
| 关注减少误报 | 精确率 | 降低假阳性 |
| 关注减少漏报 | 召回率 | 降低假阴性 |
| 回归任务 | RMSE、MAE、R² | 根据对异常值敏感度选择 |
| 排序/推荐任务 | AUC-ROC、NDCG | 关注排序质量 |

## 交叉验证（Cross-Validation）

交叉验证是一种强大的模型评估技术，通过多次划分数据来获得更稳定、更可靠的性能估计。

### K 折交叉验证（K-Fold Cross-Validation）

K 折交叉验证将数据集分成 K 个大小相等的子集，每次使用其中一个子集作为验证集，其余作为训练集。

```python
from sklearn.model_selection import cross_val_score, KFold
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris

# 加载数据
iris = load_iris()
X, y = iris.data, iris.target

# 创建模型
model = RandomForestClassifier(n_estimators=100, random_state=42)

# 5 折交叉验证
kfold = KFold(n_splits=5, shuffle=True, random_state=42)
scores = cross_val_score(model, X, y, cv=kfold, scoring='accuracy')

print(f"各折准确率: {scores}")
print(f"平均准确率: {scores.mean():.4f} (+/- {scores.std() * 2:.4f})")
```

输出示例：
```
各折准确率: [0.96666667 0.96666667 0.93333333 0.96666667 1.        ]
平均准确率: 0.9667 (+/- 0.0422)
```

### 分层 K 折交叉验证（Stratified K-Fold）

分层交叉验证确保每一折中各类别的比例与原始数据集一致，特别适用于类别不平衡的情况。

```python
from sklearn.model_selection import StratifiedKFold, cross_val_score

# 分层 K 折交叉验证
stratified_kfold = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scores = cross_val_score(model, X, y, cv=stratified_kfold, scoring='accuracy')

print(f"分层交叉验证准确率: {scores.mean():.4f} (+/- {scores.std() * 2:.4f})")
```

### 留一法交叉验证（Leave-One-Out Cross-Validation）

留一法是 K 折交叉验证的极端情况，每次只留一个样本作为验证集。

```python
from sklearn.model_selection import LeaveOneOut, cross_val_score

# 留一法交叉验证（适用于小数据集）
loo = LeaveOneOut()
scores = cross_val_score(model, X, y, cv=loo, scoring='accuracy')

print(f"留一法准确率: {scores.mean():.4f}")
```

### 时间序列交叉验证

对于时间序列数据，需要使用特殊的交叉验证方法以避免未来数据泄露。

```python
from sklearn.model_selection import TimeSeriesSplit
import numpy as np

# 创建时间序列数据
X_ts = np.array([[i] for i in range(100)])
y_ts = np.array([i % 2 for i in range(100)])

# 时间序列分割
tscv = TimeSeriesSplit(n_splits=5)

for i, (train_index, test_index) in enumerate(tscv.split(X_ts)):
    print(f"Fold {i+1}:")
    print(f"  训练集索引范围: {train_index[0]} - {train_index[-1]}")
    print(f"  测试集索引范围: {test_index[0]} - {test_index[-1]}")
```

### 使用 cross_validate 获取更多信息

```python
from sklearn.model_selection import cross_validate

# 获取多个评估指标和训练/测试时间
scoring = ['accuracy', 'precision_macro', 'recall_macro', 'f1_macro']

cv_results = cross_validate(
    model, X, y,
    cv=5,
    scoring=scoring,
    return_train_score=True
)

print("交叉验证详细结果:")
for metric in scoring:
    train_scores = cv_results[f'train_{metric}']
    test_scores = cv_results[f'test_{metric}']
    print(f"{metric}:")
    print(f"  训练集: {train_scores.mean():.4f} (+/- {train_scores.std() * 2:.4f})")
    print(f"  测试集: {test_scores.mean():.4f} (+/- {test_scores.std() * 2:.4f})")
```

## 混淆矩阵（Confusion Matrix）

混淆矩阵是评估分类模型性能的强大工具，它展示了模型预测结果与真实标签之间的对应关系。

### 二分类混淆矩阵

```python
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay
import matplotlib.pyplot as plt
import numpy as np

# 生成示例数据
np.random.seed(42)
y_true = np.random.randint(0, 2, 100)
y_pred = np.random.randint(0, 2, 100)

# 计算混淆矩阵
cm = confusion_matrix(y_true, y_pred)
print("混淆矩阵:")
print(cm)

# 可视化混淆矩阵
fig, ax = plt.subplots(figsize=(8, 6))
disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=['负类', '正类'])
disp.plot(ax=ax, cmap='Blues')
plt.title('混淆矩阵可视化')
plt.savefig('confusion_matrix.png', dpi=150, bbox_inches='tight')
plt.show()
```

### 理解混淆矩阵中的四个象限

| | 预测为正 | 预测为负 |
|---|---|---|
| **实际为正** | TP (真阳性) | FN (假阴性) - 漏报 |
| **实际为负** | FP (假阳性) - 误报 | TN (真阴性) |

```python
# 从混淆矩阵提取各指标
tn, fp, fn, tp = cm.ravel()

print(f"真阳性 (TP): {tp}")
print(f"真阴性 (TN): {tn}")
print(f"假阳性 (FP): {fp}")
print(f"假阴性 (FN): {fn}")

# 手动计算各评估指标
accuracy = (tp + tn) / (tp + tn + fp + fn)
precision = tp / (tp + fp) if (tp + fp) > 0 else 0
recall = tp / (tp + fn) if (tp + fn) > 0 else 0
specificity = tn / (tn + fp) if (tn + fp) > 0 else 0  # 特异度
f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0

print(f"\n计算得到的指标:")
print(f"准确率: {accuracy:.4f}")
print(f"精确率: {precision:.4f}")
print(f"召回率: {recall:.4f}")
print(f"特异度: {specificity:.4f}")
print(f"F1 分数: {f1:.4f}")
```

### 多分类混淆矩阵

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay

# 加载鸢尾花数据集
iris = load_iris()
X, y = iris.data, iris.target

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

# 训练模型
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)
y_pred = model.predict(X_test)

# 多分类混淆矩阵
cm = confusion_matrix(y_test, y_pred)

# 可视化
fig, ax = plt.subplots(figsize=(10, 8))
disp = ConfusionMatrixDisplay(
    confusion_matrix=cm,
    display_labels=iris.target_names
)
disp.plot(ax=ax, cmap='Blues', values_format='d')
plt.title('多分类混淆矩阵 - 鸢尾花数据集')
plt.savefig('multiclass_confusion_matrix.png', dpi=150, bbox_inches='tight')
plt.show()
```

### 归一化混淆矩阵

```python
# 按真实标签归一化（每行和为1）
cm_normalized = confusion_matrix(y_test, y_pred, normalize='true')

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# 原始混淆矩阵
ConfusionMatrixDisplay(cm, display_labels=iris.target_names).plot(
    ax=axes[0], cmap='Blues', values_format='d'
)
axes[0].set_title('原始混淆矩阵')

# 归一化混淆矩阵
ConfusionMatrixDisplay(cm_normalized, display_labels=iris.target_names).plot(
    ax=axes[1], cmap='Blues', values_format='.2f'
)
axes[1].set_title('归一化混淆矩阵（按真实标签）')

plt.tight_layout()
plt.savefig('normalized_confusion_matrix.png', dpi=150, bbox_inches='tight')
plt.show()
```

## ROC 曲线与 AUC（ROC/AUC）

ROC（Receiver Operating Characteristic）曲线和 AUC（Area Under Curve）是评估二分类模型性能的重要工具，特别适合于类别不平衡的情况。

### 理解 ROC 曲线

ROC 曲线以假阳性率（FPR）为横轴，真阳性率（TPR/召回率）为纵轴绘制。

- **真阳性率（TPR）**：$TPR = \frac{TP}{TP + FN}$
- **假阳性率（FPR）**：$FPR = \frac{FP}{FP + TN}$

```python
from sklearn.metrics import roc_curve, roc_auc_score
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import make_classification
import matplotlib.pyplot as plt

# 生成二分类数据
X, y = make_classification(
    n_samples=1000, n_features=20, n_classes=2,
    random_state=42, n_informative=10
)

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

# 训练逻辑回归模型
model = LogisticRegression(random_state=42, max_iter=1000)
model.fit(X_train, y_train)

# 获取预测概率
y_prob = model.predict_proba(X_test)[:, 1]

# 计算 ROC 曲线
fpr, tpr, thresholds = roc_curve(y_test, y_prob)
auc_score = roc_auc_score(y_test, y_prob)

# 绘制 ROC 曲线
plt.figure(figsize=(8, 6))
plt.plot(fpr, tpr, 'b-', linewidth=2, label=f'ROC 曲线 (AUC = {auc_score:.4f})')
plt.plot([0, 1], [0, 1], 'k--', linewidth=1, label='随机分类器')
plt.fill_between(fpr, tpr, alpha=0.3)
plt.xlabel('假阳性率 (FPR)')
plt.ylabel('真阳性率 (TPR)')
plt.title('ROC 曲线')
plt.legend(loc='lower right')
plt.grid(True, alpha=0.3)
plt.savefig('roc_curve.png', dpi=150, bbox_inches='tight')
plt.show()

print(f"AUC 分数: {auc_score:.4f}")
```

### AUC 分数解读

| AUC 值 | 模型性能 |
|--------|----------|
| 0.9 - 1.0 | 优秀 |
| 0.8 - 0.9 | 良好 |
| 0.7 - 0.8 | 一般 |
| 0.6 - 0.7 | 较差 |
| 0.5 - 0.6 | 接近随机猜测 |

### 比较多个模型的 ROC 曲线

```python
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC

# 定义多个模型
models = {
    'Logistic Regression': LogisticRegression(random_state=42, max_iter=1000),
    'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
    'Gradient Boosting': GradientBoostingClassifier(n_estimators=100, random_state=42),
    'SVM': SVC(probability=True, random_state=42)
}

plt.figure(figsize=(10, 8))

for name, model in models.items():
    # 训练模型
    model.fit(X_train, y_train)

    # 获取预测概率
    y_prob = model.predict_proba(X_test)[:, 1]

    # 计算 ROC 曲线和 AUC
    fpr, tpr, _ = roc_curve(y_test, y_prob)
    auc_score = roc_auc_score(y_test, y_prob)

    # 绘制 ROC 曲线
    plt.plot(fpr, tpr, linewidth=2, label=f'{name} (AUC = {auc_score:.4f})')

plt.plot([0, 1], [0, 1], 'k--', linewidth=1, label='随机分类器')
plt.xlabel('假阳性率 (FPR)')
plt.ylabel('真阳性率 (TPR)')
plt.title('多模型 ROC 曲线比较')
plt.legend(loc='lower right')
plt.grid(True, alpha=0.3)
plt.savefig('multi_model_roc.png', dpi=150, bbox_inches='tight')
plt.show()
```

### 精确率-召回率曲线（PR Curve）

对于严重不平衡的数据集，PR 曲线比 ROC 曲线更能反映模型性能。

```python
from sklearn.metrics import precision_recall_curve, average_precision_score

# 计算 PR 曲线
precision, recall, thresholds = precision_recall_curve(y_test, y_prob)
ap_score = average_precision_score(y_test, y_prob)

plt.figure(figsize=(8, 6))
plt.plot(recall, precision, 'b-', linewidth=2,
         label=f'PR 曲线 (AP = {ap_score:.4f})')
plt.fill_between(recall, precision, alpha=0.3)
plt.xlabel('召回率 (Recall)')
plt.ylabel('精确率 (Precision)')
plt.title('精确率-召回率曲线')
plt.legend(loc='lower left')
plt.grid(True, alpha=0.3)
plt.savefig('pr_curve.png', dpi=150, bbox_inches='tight')
plt.show()
```

### 多分类的 ROC 曲线

```python
from sklearn.preprocessing import label_binarize
from sklearn.multiclass import OneVsRestClassifier
from sklearn.metrics import roc_curve, auc

# 加载鸢尾花数据集
iris = load_iris()
X, y = iris.data, iris.target
n_classes = 3

# 二值化标签
y_bin = label_binarize(y, classes=[0, 1, 2])

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y_bin, test_size=0.3, random_state=42
)

# 使用 One-vs-Rest 策略训练模型
classifier = OneVsRestClassifier(LogisticRegression(random_state=42, max_iter=1000))
classifier.fit(X_train, y_train)
y_score = classifier.predict_proba(X_test)

# 计算每个类别的 ROC 曲线和 AUC
plt.figure(figsize=(10, 8))
colors = ['blue', 'green', 'red']

for i, color in zip(range(n_classes), colors):
    fpr, tpr, _ = roc_curve(y_test[:, i], y_score[:, i])
    roc_auc = auc(fpr, tpr)
    plt.plot(fpr, tpr, color=color, linewidth=2,
             label=f'{iris.target_names[i]} (AUC = {roc_auc:.4f})')

plt.plot([0, 1], [0, 1], 'k--', linewidth=1)
plt.xlabel('假阳性率 (FPR)')
plt.ylabel('真阳性率 (TPR)')
plt.title('多分类 ROC 曲线')
plt.legend(loc='lower right')
plt.grid(True, alpha=0.3)
plt.savefig('multiclass_roc.png', dpi=150, bbox_inches='tight')
plt.show()
```

## 过拟合检测（Overfitting Detection）

过拟合是机器学习中最常见的问题之一，指模型在训练集上表现优秀但在新数据上泛化能力差。

### 过拟合的识别信号

1. **训练集与验证集性能差距大**：训练集准确率远高于验证集
2. **验证集性能先升后降**：随着训练进行，验证集性能开始下降
3. **模型过于复杂**：参数数量远超样本数量

### 学习曲线分析

学习曲线是检测过拟合的有效工具，它展示了模型性能随训练样本数量的变化。

```python
from sklearn.model_selection import learning_curve
import numpy as np
import matplotlib.pyplot as plt

def plot_learning_curve(estimator, X, y, title, cv=5):
    """绘制学习曲线"""
    train_sizes, train_scores, test_scores = learning_curve(
        estimator, X, y, cv=cv, n_jobs=-1,
        train_sizes=np.linspace(0.1, 1.0, 10),
        scoring='accuracy'
    )

    train_mean = train_scores.mean(axis=1)
    train_std = train_scores.std(axis=1)
    test_mean = test_scores.mean(axis=1)
    test_std = test_scores.std(axis=1)

    plt.figure(figsize=(10, 6))

    # 训练集得分
    plt.plot(train_sizes, train_mean, 'o-', color='blue',
             label='训练集得分', linewidth=2)
    plt.fill_between(train_sizes, train_mean - train_std,
                     train_mean + train_std, alpha=0.1, color='blue')

    # 验证集得分
    plt.plot(train_sizes, test_mean, 'o-', color='green',
             label='验证集得分', linewidth=2)
    plt.fill_between(train_sizes, test_mean - test_std,
                     test_mean + test_std, alpha=0.1, color='green')

    plt.xlabel('训练样本数量')
    plt.ylabel('准确率')
    plt.title(title)
    plt.legend(loc='lower right')
    plt.grid(True, alpha=0.3)
    plt.ylim(0.5, 1.05)

    return plt

# 示例：比较不同复杂度的模型
from sklearn.tree import DecisionTreeClassifier

# 准备数据
X, y = make_classification(n_samples=1000, n_features=20, random_state=42)

# 欠拟合模型（树深度太浅）
model_underfit = DecisionTreeClassifier(max_depth=1, random_state=42)
plot_learning_curve(model_underfit, X, y, '欠拟合模型 (max_depth=1)')
plt.savefig('learning_curve_underfit.png', dpi=150, bbox_inches='tight')

# 适当拟合模型
model_good = DecisionTreeClassifier(max_depth=5, random_state=42)
plot_learning_curve(model_good, X, y, '适当拟合模型 (max_depth=5)')
plt.savefig('learning_curve_good.png', dpi=150, bbox_inches='tight')

# 过拟合模型（无深度限制）
model_overfit = DecisionTreeClassifier(max_depth=None, random_state=42)
plot_learning_curve(model_overfit, X, y, '过拟合模型 (max_depth=None)')
plt.savefig('learning_curve_overfit.png', dpi=150, bbox_inches='tight')

plt.show()
```

### 验证曲线分析

验证曲线展示了模型性能随超参数变化的情况。

```python
from sklearn.model_selection import validation_curve

def plot_validation_curve(estimator, X, y, param_name, param_range, title):
    """绘制验证曲线"""
    train_scores, test_scores = validation_curve(
        estimator, X, y, param_name=param_name,
        param_range=param_range, cv=5, scoring='accuracy', n_jobs=-1
    )

    train_mean = train_scores.mean(axis=1)
    train_std = train_scores.std(axis=1)
    test_mean = test_scores.mean(axis=1)
    test_std = test_scores.std(axis=1)

    plt.figure(figsize=(10, 6))

    plt.semilogx(param_range, train_mean, 'o-', color='blue',
                 label='训练集得分', linewidth=2)
    plt.fill_between(param_range, train_mean - train_std,
                     train_mean + train_std, alpha=0.1, color='blue')

    plt.semilogx(param_range, test_mean, 'o-', color='green',
                 label='验证集得分', linewidth=2)
    plt.fill_between(param_range, test_mean - test_std,
                     test_mean + test_std, alpha=0.1, color='green')

    plt.xlabel(param_name)
    plt.ylabel('准确率')
    plt.title(title)
    plt.legend(loc='best')
    plt.grid(True, alpha=0.3)

    return plt

# 示例：决策树深度的验证曲线
param_range = [1, 2, 3, 5, 7, 10, 15, 20, 30, 50]
plot_validation_curve(
    DecisionTreeClassifier(random_state=42), X, y,
    'max_depth', param_range, '决策树深度验证曲线'
)
plt.savefig('validation_curve.png', dpi=150, bbox_inches='tight')
plt.show()
```

### 训练过程中的过拟合监控

对于迭代训练的模型（如神经网络、梯度提升），可以监控训练过程中的过拟合。

```python
from sklearn.ensemble import GradientBoostingClassifier
import numpy as np

# 准备数据
X_train, X_val, y_train, y_val = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 设置较多的迭代次数以观察过拟合
model = GradientBoostingClassifier(
    n_estimators=200, learning_rate=0.1,
    max_depth=5, random_state=42
)

# 训练模型
model.fit(X_train, y_train)

# 获取每次迭代后的预测
train_scores = []
val_scores = []

for i, y_pred in enumerate(model.staged_predict(X_train)):
    train_scores.append(accuracy_score(y_train, y_pred))

for i, y_pred in enumerate(model.staged_predict(X_val)):
    val_scores.append(accuracy_score(y_val, y_pred))

# 绘制训练过程曲线
plt.figure(figsize=(10, 6))
plt.plot(range(1, len(train_scores) + 1), train_scores, 'b-',
         label='训练集', linewidth=2)
plt.plot(range(1, len(val_scores) + 1), val_scores, 'g-',
         label='验证集', linewidth=2)
plt.xlabel('迭代次数')
plt.ylabel('准确率')
plt.title('梯度提升模型训练过程')
plt.legend(loc='lower right')
plt.grid(True, alpha=0.3)

# 标记最佳迭代点
best_n = np.argmax(val_scores) + 1
plt.axvline(x=best_n, color='r', linestyle='--',
            label=f'最佳迭代次数: {best_n}')
plt.legend()
plt.savefig('training_process.png', dpi=150, bbox_inches='tight')
plt.show()

print(f"最佳迭代次数: {best_n}")
print(f"最佳验证集准确率: {max(val_scores):.4f}")
```

### 过拟合解决方案

#### 正则化

```python
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.model_selection import cross_val_score

# L1 正则化（Lasso）
model_l1 = LogisticRegression(penalty='l1', solver='saga', C=1.0, random_state=42)

# L2 正则化（Ridge）
model_l2 = LogisticRegression(penalty='l2', C=1.0, random_state=42)

# 比较不同正则化强度
C_values = [0.001, 0.01, 0.1, 1, 10, 100]

for C in C_values:
    model = LogisticRegression(penalty='l2', C=C, random_state=42, max_iter=1000)
    scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
    print(f"C={C:>6}: 准确率 = {scores.mean():.4f} (+/- {scores.std() * 2:.4f})")
```

#### 早停（Early Stopping）

```python
from sklearn.neural_network import MLPClassifier

# 使用早停训练神经网络
model = MLPClassifier(
    hidden_layer_sizes=(100, 50),
    max_iter=1000,
    early_stopping=True,
    validation_fraction=0.1,
    n_iter_no_change=10,
    random_state=42
)

model.fit(X_train, y_train)
print(f"实际迭代次数: {model.n_iter_}")
print(f"最佳验证集损失: {model.best_loss_:.4f}")
```

#### Dropout（神经网络）

```python
# PyTorch 示例
import torch
import torch.nn as nn

class ModelWithDropout(nn.Module):
    def __init__(self, input_size, hidden_size, output_size, dropout_rate=0.5):
        super().__init__()
        self.fc1 = nn.Linear(input_size, hidden_size)
        self.dropout = nn.Dropout(dropout_rate)
        self.fc2 = nn.Linear(hidden_size, output_size)
        self.relu = nn.ReLU()

    def forward(self, x):
        x = self.relu(self.fc1(x))
        x = self.dropout(x)  # 训练时随机丢弃神经元
        x = self.fc2(x)
        return x
```

#### 数据增强

```python
# 图像数据增强示例（使用 torchvision）
from torchvision import transforms

train_transform = transforms.Compose([
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomRotation(degrees=15),
    transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),
    transforms.ColorJitter(brightness=0.2, contrast=0.2),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                        std=[0.229, 0.224, 0.225])
])
```

## 综合实战案例

让我们通过一个完整的案例来综合运用本文介绍的评估技术。

```python
import numpy as np
import pandas as pd
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, roc_auc_score,
    roc_curve, precision_recall_curve
)
import matplotlib.pyplot as plt
import warnings
warnings.filterwarnings('ignore')

# 加载数据
print("=" * 60)
print("1. 数据加载与探索")
print("=" * 60)

data = load_breast_cancer()
X, y = data.data, data.target
feature_names = data.feature_names

print(f"样本数量: {X.shape[0]}")
print(f"特征数量: {X.shape[1]}")
print(f"类别分布: 良性={sum(y==1)}, 恶性={sum(y==0)}")

# 数据划分与预处理
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 定义和训练多个模型
print("\n" + "=" * 60)
print("2. 模型训练与交叉验证")
print("=" * 60)

models = {
    'Logistic Regression': LogisticRegression(random_state=42, max_iter=1000),
    'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
    'Gradient Boosting': GradientBoostingClassifier(n_estimators=100, random_state=42),
    'SVM': SVC(probability=True, random_state=42)
}

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
results = {}

for name, model in models.items():
    # 交叉验证
    cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=cv, scoring='accuracy')

    # 训练模型
    model.fit(X_train_scaled, y_train)

    # 预测
    y_pred = model.predict(X_test_scaled)
    y_prob = model.predict_proba(X_test_scaled)[:, 1]

    # 计算各项指标
    results[name] = {
        'cv_mean': cv_scores.mean(),
        'cv_std': cv_scores.std(),
        'accuracy': accuracy_score(y_test, y_pred),
        'precision': precision_score(y_test, y_pred),
        'recall': recall_score(y_test, y_pred),
        'f1': f1_score(y_test, y_pred),
        'auc': roc_auc_score(y_test, y_prob),
        'y_prob': y_prob
    }

    print(f"\n{name}:")
    print(f"  交叉验证准确率: {results[name]['cv_mean']:.4f} (+/- {results[name]['cv_std']*2:.4f})")
    print(f"  测试集准确率: {results[name]['accuracy']:.4f}")
    print(f"  AUC: {results[name]['auc']:.4f}")

# 绘制模型比较图
print("\n" + "=" * 60)
print("3. 模型性能比较")
print("=" * 60)

# 创建比较表格
comparison_df = pd.DataFrame({
    name: {
        '交叉验证准确率': f"{r['cv_mean']:.4f} +/- {r['cv_std']*2:.4f}",
        '测试准确率': f"{r['accuracy']:.4f}",
        '精确率': f"{r['precision']:.4f}",
        '召回率': f"{r['recall']:.4f}",
        'F1 分数': f"{r['f1']:.4f}",
        'AUC': f"{r['auc']:.4f}"
    } for name, r in results.items()
}).T

print(comparison_df)

# 绘制 ROC 曲线比较
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# ROC 曲线
for name, r in results.items():
    fpr, tpr, _ = roc_curve(y_test, r['y_prob'])
    axes[0].plot(fpr, tpr, linewidth=2, label=f"{name} (AUC={r['auc']:.4f})")

axes[0].plot([0, 1], [0, 1], 'k--', linewidth=1)
axes[0].set_xlabel('假阳性率 (FPR)')
axes[0].set_ylabel('真阳性率 (TPR)')
axes[0].set_title('ROC 曲线比较')
axes[0].legend(loc='lower right')
axes[0].grid(True, alpha=0.3)

# PR 曲线
for name, r in results.items():
    precision, recall, _ = precision_recall_curve(y_test, r['y_prob'])
    axes[1].plot(recall, precision, linewidth=2, label=name)

axes[1].set_xlabel('召回率 (Recall)')
axes[1].set_ylabel('精确率 (Precision)')
axes[1].set_title('精确率-召回率曲线比较')
axes[1].legend(loc='lower left')
axes[1].grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('model_comparison.png', dpi=150, bbox_inches='tight')
plt.show()

# 选择最佳模型并输出详细报告
best_model_name = max(results.keys(), key=lambda x: results[x]['auc'])
print(f"\n最佳模型: {best_model_name}")

best_model = models[best_model_name]
y_pred_best = best_model.predict(X_test_scaled)

print("\n详细分类报告:")
print(classification_report(y_test, y_pred_best, target_names=['恶性', '良性']))

print("\n混淆矩阵:")
cm = confusion_matrix(y_test, y_pred_best)
print(cm)
```

## 总结与最佳实践

### 评估工作流程清单

1. **明确评估目标**：根据业务需求选择合适的评估指标
2. **正确划分数据**：确保训练集、验证集、测试集的独立性
3. **使用交叉验证**：获得更稳定的性能估计
4. **分析混淆矩阵**：深入理解模型的错误模式
5. **绘制 ROC/PR 曲线**：评估模型在不同阈值下的表现
6. **检测过拟合**：使用学习曲线和验证曲线进行诊断
7. **对比多个模型**：选择最适合业务场景的模型

### 常见陷阱

| 陷阱 | 解决方案 |
|------|----------|
| 数据泄露 | 严格按顺序进行数据划分和预处理 |
| 忽视类别不平衡 | 使用适当的评估指标和采样技术 |
| 过度调参 | 使用嵌套交叉验证 |
| 忽略统计显著性 | 报告置信区间，进行统计检验 |
| 只看单一指标 | 综合考虑多个评估维度 |

### 进阶建议

1. **对于不平衡数据**：优先使用 F1、AUC-PR 而非准确率
2. **对于业务敏感场景**：根据业务成本调整分类阈值
3. **对于生产环境**：建立持续监控机制，检测模型退化
4. **对于模型比较**：使用配对统计检验（如 McNemar 检验）
5. **对于解释性要求**：结合 SHAP 值等解释性工具

掌握模型评估是成为优秀机器学习工程师的关键一步。通过科学的评估方法，我们能够客观地衡量模型性能，做出正确的模型选择决策，最终构建出真正有价值的机器学习系统。
