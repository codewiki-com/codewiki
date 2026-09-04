---
title: 模型评估：评估指标详解
description: 掌握ML评估指标：分类、回归和排序任务的评估方法
track: datascience
section: evaluation
difficulty: intermediate
tags:
  - 评估指标
  - 分类
  - 回归
  - 模型评估
status: imported
origin: old/src/content/docs/datascience/evaluation-metrics.zh.md
divergence: 0.348
issues: []
legacy:
  category: DataScience
  subcategory: Evaluation
  order: 32
  lastUpdated: 2026-01-07
---

模型评估是机器学习流程中至关重要的环节。选择正确的评估指标不仅能帮助我们准确衡量模型性能，还能指导模型优化方向。本文将全面介绍分类、回归和排序任务中常用的评估指标，深入探讨不平衡数据评估策略，并结合 Scikit-learn 提供完整的代码实现。

## 分类指标详解

分类任务是机器学习中最常见的任务类型。根据类别数量，可分为二分类和多分类问题。

### 混淆矩阵 (Confusion Matrix)

混淆矩阵是分类评估的基础，展示了模型预测结果与真实标签之间的对应关系。

**二分类混淆矩阵：**

|  | 预测正例 (Positive) | 预测负例 (Negative) |
|--|---------------------|---------------------|
| 实际正例 | TP（真正例） | FN（假负例） |
| 实际负例 | FP（假正例） | TN（真负例） |

- **TP (True Positive)**：正确预测为正例
- **TN (True Negative)**：正确预测为负例
- **FP (False Positive)**：错误地将负例预测为正例（Type I Error）
- **FN (False Negative)**：错误地将正例预测为负例（Type II Error）

```python
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression

# 生成示例数据
X, y = make_classification(n_samples=1000, n_features=20, n_classes=2,
                           weights=[0.7, 0.3], random_state=42)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# 训练模型
model = LogisticRegression(random_state=42)
model.fit(X_train, y_train)
y_pred = model.predict(X_test)

# 计算混淆矩阵
cm = confusion_matrix(y_test, y_pred)
print("混淆矩阵:")
print(cm)

# 可视化混淆矩阵
fig, ax = plt.subplots(figsize=(8, 6))
disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=['负例', '正例'])
disp.plot(ax=ax, cmap='Blues')
plt.title('混淆矩阵可视化')
plt.show()

# 从混淆矩阵提取各项指标
tn, fp, fn, tp = cm.ravel()
print(f"\nTN={tn}, FP={fp}, FN={fn}, TP={tp}")
```

### 准确率 (Accuracy)

准确率是最直观的分类指标，表示预测正确的样本占总样本的比例。

$$\text{Accuracy} = \frac{TP + TN}{TP + TN + FP + FN}$$

```python
from sklearn.metrics import accuracy_score

accuracy = accuracy_score(y_test, y_pred)
print(f"准确率: {accuracy:.4f}")

# 手动计算
manual_accuracy = (tp + tn) / (tp + tn + fp + fn)
print(f"手动计算准确率: {manual_accuracy:.4f}")
```

**准确率的局限性：**

准确率在类别不平衡时可能具有误导性。例如，在欺诈检测场景中，若正常交易占99%，即使模型将所有样本预测为正常，准确率也高达99%，但这样的模型毫无价值。

### 精确率 (Precision)

精确率衡量模型预测为正例的样本中，实际为正例的比例。高精确率意味着较少的假正例。

$$\text{Precision} = \frac{TP}{TP + FP}$$

**适用场景：**
- 垃圾邮件过滤（不希望误将正常邮件标为垃圾）
- 推荐系统（推荐的商品应该是用户真正感兴趣的）

```python
from sklearn.metrics import precision_score

precision = precision_score(y_test, y_pred)
print(f"精确率: {precision:.4f}")

# 手动计算
manual_precision = tp / (tp + fp) if (tp + fp) > 0 else 0
print(f"手动计算精确率: {manual_precision:.4f}")
```

### 召回率 (Recall / Sensitivity / TPR)

召回率衡量实际为正例的样本中，被正确预测为正例的比例。高召回率意味着较少的假负例。

$$\text{Recall} = \frac{TP}{TP + FN}$$

**适用场景：**
- 疾病诊断（不希望漏诊患者）
- 欺诈检测（不希望漏掉欺诈交易）
- 安全系统（不希望漏掉入侵行为）

```python
from sklearn.metrics import recall_score

recall = recall_score(y_test, y_pred)
print(f"召回率: {recall:.4f}")

# 手动计算
manual_recall = tp / (tp + fn) if (tp + fn) > 0 else 0
print(f"手动计算召回率: {manual_recall:.4f}")
```

### F1 分数 (F1 Score)

F1 分数是精确率和召回率的调和平均值，综合考虑了两个指标。

$$F1 = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}} = \frac{2TP}{2TP + FP + FN}$$

**为什么使用调和平均？**

调和平均对较小值更敏感。如果精确率或召回率很低，F1分数也会很低，这确保了模型需要在两个指标上都表现良好。

```python
from sklearn.metrics import f1_score

f1 = f1_score(y_test, y_pred)
print(f"F1分数: {f1:.4f}")

# 手动计算
manual_f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
print(f"手动计算F1分数: {manual_f1:.4f}")
```

### F-beta 分数

F-beta 分数是 F1 的泛化形式，允许调整精确率和召回率的权重。

$$F_\beta = (1 + \beta^2) \times \frac{\text{Precision} \times \text{Recall}}{\beta^2 \times \text{Precision} + \text{Recall}}$$

- **beta < 1**：更重视精确率
- **beta = 1**：等同于 F1 分数
- **beta > 1**：更重视召回率
- **beta = 2**：召回率的权重是精确率的两倍

```python
from sklearn.metrics import fbeta_score

# F0.5 分数（更重视精确率）
f05 = fbeta_score(y_test, y_pred, beta=0.5)
print(f"F0.5分数: {f05:.4f}")

# F2 分数（更重视召回率）
f2 = fbeta_score(y_test, y_pred, beta=2)
print(f"F2分数: {f2:.4f}")
```

### 特异度 (Specificity / TNR)

特异度衡量实际为负例的样本中，被正确预测为负例的比例。

$$\text{Specificity} = \frac{TN}{TN + FP}$$

```python
# 手动计算特异度
specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
print(f"特异度: {specificity:.4f}")
```

### AUC-ROC 曲线

ROC（Receiver Operating Characteristic）曲线展示了在不同分类阈值下，真正例率（TPR/召回率）与假正例率（FPR）之间的权衡关系。

$$\text{TPR} = \frac{TP}{TP + FN}, \quad \text{FPR} = \frac{FP}{FP + TN}$$

AUC（Area Under Curve）是 ROC 曲线下的面积，取值范围为 [0, 1]。

- **AUC = 1.0**：完美分类器
- **AUC = 0.5**：随机猜测
- **AUC < 0.5**：比随机猜测还差

```python
from sklearn.metrics import roc_curve, roc_auc_score, RocCurveDisplay

# 获取预测概率
y_prob = model.predict_proba(X_test)[:, 1]

# 计算 AUC
auc = roc_auc_score(y_test, y_prob)
print(f"AUC-ROC: {auc:.4f}")

# 绘制 ROC 曲线
fpr, tpr, thresholds = roc_curve(y_test, y_prob)

plt.figure(figsize=(8, 6))
plt.plot(fpr, tpr, label=f'ROC曲线 (AUC = {auc:.4f})')
plt.plot([0, 1], [0, 1], 'k--', label='随机猜测')
plt.xlabel('假正例率 (FPR)')
plt.ylabel('真正例率 (TPR)')
plt.title('ROC曲线')
plt.legend()
plt.grid(True)
plt.show()

# 使用 sklearn 内置显示
RocCurveDisplay.from_estimator(model, X_test, y_test)
plt.title('ROC曲线')
plt.show()
```

**AUC 的优势：**
- 不依赖于分类阈值选择
- 对类别不平衡具有一定的鲁棒性
- 可以比较不同模型的整体性能

### Precision-Recall 曲线与 AUC-PR

在高度不平衡的数据集中，AUC-PR 比 AUC-ROC 更有意义。

```python
from sklearn.metrics import precision_recall_curve, average_precision_score, PrecisionRecallDisplay

# 计算 Average Precision (AUC-PR)
ap = average_precision_score(y_test, y_prob)
print(f"Average Precision (AUC-PR): {ap:.4f}")

# 绘制 PR 曲线
precision_curve, recall_curve, thresholds_pr = precision_recall_curve(y_test, y_prob)

plt.figure(figsize=(8, 6))
plt.plot(recall_curve, precision_curve, label=f'PR曲线 (AP = {ap:.4f})')
plt.xlabel('召回率')
plt.ylabel('精确率')
plt.title('Precision-Recall曲线')
plt.legend()
plt.grid(True)
plt.show()
```

**何时使用 AUC-PR vs AUC-ROC：**
- 类别平衡时：两者都可以
- 类别不平衡且关注正类：优先使用 AUC-PR
- 需要全局比较模型性能：使用 AUC-ROC

### 对数损失 (Log Loss / Cross-Entropy)

对数损失衡量预测概率与真实标签之间的差距，是概率预测的重要指标。

$$\text{Log Loss} = -\frac{1}{n}\sum_{i=1}^{n}[y_i \log(p_i) + (1-y_i)\log(1-p_i)]$$

```python
from sklearn.metrics import log_loss

logloss = log_loss(y_test, y_prob)
print(f"Log Loss: {logloss:.4f}")
```

**Log Loss 的特点：**
- 对置信度高但错误的预测惩罚严重
- 越小越好，0 表示完美预测
- 适用于需要校准概率的场景

### 综合分类报告

```python
from sklearn.metrics import classification_report

def comprehensive_classification_report(y_true, y_pred, y_prob=None):
    """生成综合分类评估报告"""
    print("=" * 60)
    print("分类模型综合评估报告")
    print("=" * 60)

    # 基础指标
    print("\n【基础分类指标】")
    print(f"准确率 (Accuracy): {accuracy_score(y_true, y_pred):.4f}")
    print(f"精确率 (Precision): {precision_score(y_true, y_pred):.4f}")
    print(f"召回率 (Recall): {recall_score(y_true, y_pred):.4f}")
    print(f"F1分数: {f1_score(y_true, y_pred):.4f}")

    if y_prob is not None:
        print(f"\n【概率指标】")
        print(f"AUC-ROC: {roc_auc_score(y_true, y_prob):.4f}")
        print(f"Average Precision: {average_precision_score(y_true, y_prob):.4f}")
        print(f"Log Loss: {log_loss(y_true, y_prob):.4f}")

    # 详细分类报告
    print("\n【详细分类报告】")
    print(classification_report(y_true, y_pred, target_names=['负例', '正例']))

    # 混淆矩阵
    print("【混淆矩阵】")
    cm = confusion_matrix(y_true, y_pred)
    print(cm)

# 使用示例
comprehensive_classification_report(y_test, y_pred, y_prob)
```

## 多类别评估指标

当分类任务涉及多个类别时，需要考虑如何聚合各类别的指标。

### 多类别混淆矩阵

```python
from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier

# 加载多分类数据
iris = load_iris()
X_iris, y_iris = iris.data, iris.target
X_train_iris, X_test_iris, y_train_iris, y_test_iris = train_test_split(
    X_iris, y_iris, test_size=0.3, random_state=42
)

# 训练模型
rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
rf_model.fit(X_train_iris, y_train_iris)
y_pred_iris = rf_model.predict(X_test_iris)

# 多类别混淆矩阵
cm_multi = confusion_matrix(y_test_iris, y_pred_iris)

plt.figure(figsize=(8, 6))
sns.heatmap(cm_multi, annot=True, fmt='d', cmap='Blues',
            xticklabels=iris.target_names, yticklabels=iris.target_names)
plt.xlabel('预测标签')
plt.ylabel('真实标签')
plt.title('多分类混淆矩阵')
plt.show()
```

### 平均策略 (Averaging Strategies)

多分类任务中，可以使用不同的平均策略来计算整体指标：

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| **micro** | 全局计算 TP/FP/FN，然后计算指标 | 关注整体性能 |
| **macro** | 计算每个类别的指标，然后取平均 | 各类别同等重要 |
| **weighted** | 按类别样本数加权平均 | 考虑类别不平衡 |
| **samples** | 针对多标签分类 | 多标签问题 |

```python
from sklearn.metrics import precision_score, recall_score, f1_score

# 各种平均策略的指标计算
print("【多分类指标 - 不同平均策略】\n")

for average in ['micro', 'macro', 'weighted']:
    p = precision_score(y_test_iris, y_pred_iris, average=average)
    r = recall_score(y_test_iris, y_pred_iris, average=average)
    f = f1_score(y_test_iris, y_pred_iris, average=average)
    print(f"{average.capitalize():10s} - Precision: {p:.4f}, Recall: {r:.4f}, F1: {f:.4f}")

# 各类别单独的指标
print("\n【各类别指标】")
p_per_class = precision_score(y_test_iris, y_pred_iris, average=None)
r_per_class = recall_score(y_test_iris, y_pred_iris, average=None)
f_per_class = f1_score(y_test_iris, y_pred_iris, average=None)

for i, name in enumerate(iris.target_names):
    print(f"{name:15s} - Precision: {p_per_class[i]:.4f}, Recall: {r_per_class[i]:.4f}, F1: {f_per_class[i]:.4f}")
```

### 多类别 AUC-ROC

对于多分类问题，AUC-ROC 需要特殊处理：

```python
from sklearn.preprocessing import label_binarize
from sklearn.metrics import roc_auc_score

# 获取多类别概率
y_prob_iris = rf_model.predict_proba(X_test_iris)

# One-vs-Rest (OvR) AUC
auc_ovr = roc_auc_score(y_test_iris, y_prob_iris, multi_class='ovr')
print(f"AUC-ROC (OvR): {auc_ovr:.4f}")

# One-vs-One (OvO) AUC
auc_ovo = roc_auc_score(y_test_iris, y_prob_iris, multi_class='ovo')
print(f"AUC-ROC (OvO): {auc_ovo:.4f}")

# 各类别的 AUC
y_test_bin = label_binarize(y_test_iris, classes=[0, 1, 2])
for i, name in enumerate(iris.target_names):
    auc_class = roc_auc_score(y_test_bin[:, i], y_prob_iris[:, i])
    print(f"{name}: AUC = {auc_class:.4f}")
```

### Cohen's Kappa 系数

Kappa 系数衡量分类器的性能相对于随机猜测的提升程度，考虑了类别不平衡的影响。

$$\kappa = \frac{p_o - p_e}{1 - p_e}$$

其中 $p_o$ 是观测一致率，$p_e$ 是期望一致率。

```python
from sklearn.metrics import cohen_kappa_score

kappa = cohen_kappa_score(y_test_iris, y_pred_iris)
print(f"Cohen's Kappa: {kappa:.4f}")

# Kappa 解释
# < 0.20: 极差
# 0.20-0.40: 一般
# 0.40-0.60: 中等
# 0.60-0.80: 良好
# 0.80-1.00: 优秀
```

### Matthews 相关系数 (MCC)

MCC 是一个平衡的指标，即使在类别不平衡时也能给出可靠的评估。

$$\text{MCC} = \frac{TP \times TN - FP \times FN}{\sqrt{(TP+FP)(TP+FN)(TN+FP)(TN+FN)}}$$

```python
from sklearn.metrics import matthews_corrcoef

# 二分类 MCC
mcc_binary = matthews_corrcoef(y_test, y_pred)
print(f"MCC (二分类): {mcc_binary:.4f}")

# 多分类 MCC
mcc_multi = matthews_corrcoef(y_test_iris, y_pred_iris)
print(f"MCC (多分类): {mcc_multi:.4f}")
```

## 回归指标详解

回归任务的目标是预测连续数值，需要不同的评估指标来衡量预测值与真实值之间的差距。

### 均方误差 (MSE)

MSE 是最常用的回归指标，计算预测值与真实值差的平方的平均值。

$$\text{MSE} = \frac{1}{n}\sum_{i=1}^{n}(y_i - \hat{y}_i)^2$$

```python
from sklearn.datasets import fetch_california_housing
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_squared_error

# 加载回归数据
housing = fetch_california_housing()
X_reg, y_reg = housing.data, housing.target
X_train_reg, X_test_reg, y_train_reg, y_test_reg = train_test_split(
    X_reg, y_reg, test_size=0.2, random_state=42
)

# 训练模型
reg_model = GradientBoostingRegressor(n_estimators=100, random_state=42)
reg_model.fit(X_train_reg, y_train_reg)
y_pred_reg = reg_model.predict(X_test_reg)

# 计算 MSE
mse = mean_squared_error(y_test_reg, y_pred_reg)
print(f"MSE: {mse:.4f}")
```

**MSE 的特点：**
- 对大误差惩罚严重（平方项）
- 受异常值影响大
- 单位是原始数据的平方

### 均方根误差 (RMSE)

RMSE 是 MSE 的平方根，与原始数据具有相同的单位。

$$\text{RMSE} = \sqrt{\text{MSE}} = \sqrt{\frac{1}{n}\sum_{i=1}^{n}(y_i - \hat{y}_i)^2}$$

```python
rmse = np.sqrt(mean_squared_error(y_test_reg, y_pred_reg))
print(f"RMSE: {rmse:.4f}")

# 在 sklearn >= 1.4 中可以直接使用
# from sklearn.metrics import root_mean_squared_error
# rmse = root_mean_squared_error(y_test_reg, y_pred_reg)
```

### 平均绝对误差 (MAE)

MAE 计算预测值与真实值差的绝对值的平均。

$$\text{MAE} = \frac{1}{n}\sum_{i=1}^{n}|y_i - \hat{y}_i|$$

```python
from sklearn.metrics import mean_absolute_error

mae = mean_absolute_error(y_test_reg, y_pred_reg)
print(f"MAE: {mae:.4f}")
```

**MAE vs MSE：**
- MAE 对异常值更鲁棒
- MSE 对大误差惩罚更严重
- 若要严格控制大误差，选择 MSE/RMSE
- 若数据有较多异常值，选择 MAE

### 平均绝对百分比误差 (MAPE)

MAPE 以百分比形式表示误差，便于跨量纲比较。

$$\text{MAPE} = \frac{100\%}{n}\sum_{i=1}^{n}\left|\frac{y_i - \hat{y}_i}{y_i}\right|$$

```python
from sklearn.metrics import mean_absolute_percentage_error

mape = mean_absolute_percentage_error(y_test_reg, y_pred_reg)
print(f"MAPE: {mape:.4f} ({mape*100:.2f}%)")
```

**MAPE 的注意事项：**
- 当真实值接近或等于0时，MAPE会趋向无穷大
- 对低值样本的误差更敏感
- 不对称：高估和低估的惩罚不同

### 决定系数 (R-squared / R2)

R2 表示模型解释的方差比例，衡量模型拟合数据的程度。

$$R^2 = 1 - \frac{SS_{res}}{SS_{tot}} = 1 - \frac{\sum_{i=1}^{n}(y_i - \hat{y}_i)^2}{\sum_{i=1}^{n}(y_i - \bar{y})^2}$$

```python
from sklearn.metrics import r2_score

r2 = r2_score(y_test_reg, y_pred_reg)
print(f"R2: {r2:.4f}")
```

**R2 的解释：**
- **R2 = 1**：完美预测
- **R2 = 0**：模型等同于预测均值
- **R2 < 0**：模型比预测均值还差
- 一般认为 R2 > 0.7 表示较好的拟合

### 调整 R2 (Adjusted R-squared)

调整 R2 考虑了特征数量，惩罚过多的无用特征。

$$R^2_{adj} = 1 - \frac{(1-R^2)(n-1)}{n-p-1}$$

其中 n 是样本数，p 是特征数。

```python
def adjusted_r2(y_true, y_pred, n_features):
    """计算调整 R2"""
    r2 = r2_score(y_true, y_pred)
    n = len(y_true)
    adj_r2 = 1 - (1 - r2) * (n - 1) / (n - n_features - 1)
    return adj_r2

adj_r2 = adjusted_r2(y_test_reg, y_pred_reg, X_test_reg.shape[1])
print(f"R2: {r2:.4f}")
print(f"Adjusted R2: {adj_r2:.4f}")
```

### Huber 损失

Huber 损失结合了 MSE 和 MAE 的优点，对异常值更鲁棒。

$$L_\delta(y, \hat{y}) = \begin{cases}
\frac{1}{2}(y - \hat{y})^2 & \text{if } |y - \hat{y}| \leq \delta \\
\delta |y - \hat{y}| - \frac{1}{2}\delta^2 & \text{otherwise}
\end{cases}$$

```python
from sklearn.metrics import mean_squared_error
import numpy as np

def huber_loss(y_true, y_pred, delta=1.0):
    """计算 Huber 损失"""
    error = y_true - y_pred
    is_small_error = np.abs(error) <= delta
    squared_loss = 0.5 * error ** 2
    linear_loss = delta * np.abs(error) - 0.5 * delta ** 2
    return np.mean(np.where(is_small_error, squared_loss, linear_loss))

huber = huber_loss(y_test_reg, y_pred_reg, delta=1.35)
print(f"Huber Loss (delta=1.35): {huber:.4f}")
```

### 综合回归报告

```python
def comprehensive_regression_report(y_true, y_pred, n_features=None):
    """生成综合回归评估报告"""
    print("=" * 60)
    print("回归模型综合评估报告")
    print("=" * 60)

    mse = mean_squared_error(y_true, y_pred)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(y_true, y_pred)
    mape = mean_absolute_percentage_error(y_true, y_pred)
    r2 = r2_score(y_true, y_pred)

    print(f"\n【误差指标】")
    print(f"MSE (均方误差): {mse:.4f}")
    print(f"RMSE (均方根误差): {rmse:.4f}")
    print(f"MAE (平均绝对误差): {mae:.4f}")
    print(f"MAPE (平均绝对百分比误差): {mape*100:.2f}%")

    print(f"\n【拟合优度】")
    print(f"R2 (决定系数): {r2:.4f}")

    if n_features is not None:
        adj_r2 = adjusted_r2(y_true, y_pred, n_features)
        print(f"Adjusted R2: {adj_r2:.4f}")

    # 残差分析
    residuals = y_true - y_pred
    print(f"\n【残差统计】")
    print(f"残差均值: {np.mean(residuals):.4f}")
    print(f"残差标准差: {np.std(residuals):.4f}")
    print(f"残差中位数: {np.median(residuals):.4f}")

# 使用示例
comprehensive_regression_report(y_test_reg, y_pred_reg, X_test_reg.shape[1])
```

## 排序指标详解

排序指标主要用于信息检索、推荐系统等场景，衡量模型对相关项目排序的质量。

### NDCG (Normalized Discounted Cumulative Gain)

NDCG 衡量排序结果的质量，考虑了位置的重要性（排在前面的结果更重要）。

**DCG (Discounted Cumulative Gain):**
$$\text{DCG}_k = \sum_{i=1}^{k}\frac{rel_i}{\log_2(i+1)}$$

**NDCG:**
$$\text{NDCG}_k = \frac{\text{DCG}_k}{\text{IDCG}_k}$$

其中 IDCG 是理想排序情况下的 DCG。

```python
from sklearn.metrics import ndcg_score

# 模拟推荐场景
# 真实相关性分数（越高越相关）
y_true_rank = np.array([[3, 2, 3, 0, 1, 2, 3, 2]])  # 真实相关性
y_score_rank = np.array([[0.9, 0.8, 0.75, 0.1, 0.2, 0.5, 0.85, 0.6]])  # 预测分数

# 计算 NDCG
ndcg_5 = ndcg_score(y_true_rank, y_score_rank, k=5)
ndcg_10 = ndcg_score(y_true_rank, y_score_rank, k=10)
ndcg_all = ndcg_score(y_true_rank, y_score_rank)

print(f"NDCG@5: {ndcg_5:.4f}")
print(f"NDCG@10: {ndcg_10:.4f}")
print(f"NDCG@全部: {ndcg_all:.4f}")
```

### MAP (Mean Average Precision)

MAP 是各查询的平均精确率（AP）的均值，常用于信息检索评估。

**Average Precision (AP):**
$$\text{AP} = \frac{\sum_{k=1}^{n}(P(k) \times rel(k))}{\text{相关文档数}}$$

```python
from sklearn.metrics import average_precision_score

def calculate_map(y_true_queries, y_score_queries):
    """
    计算 MAP
    y_true_queries: list of arrays, 每个数组是一个查询的真实标签
    y_score_queries: list of arrays, 每个数组是一个查询的预测分数
    """
    aps = []
    for y_true, y_score in zip(y_true_queries, y_score_queries):
        ap = average_precision_score(y_true, y_score)
        aps.append(ap)
    return np.mean(aps)

# 模拟多个查询
queries_true = [
    np.array([1, 0, 1, 0, 1]),
    np.array([0, 1, 1, 0, 0]),
    np.array([1, 1, 0, 1, 0])
]
queries_score = [
    np.array([0.9, 0.1, 0.8, 0.3, 0.7]),
    np.array([0.2, 0.9, 0.7, 0.1, 0.3]),
    np.array([0.8, 0.9, 0.2, 0.6, 0.3])
]

map_score = calculate_map(queries_true, queries_score)
print(f"MAP: {map_score:.4f}")
```

### MRR (Mean Reciprocal Rank)

MRR 计算第一个相关结果位置的倒数的平均值。

$$\text{MRR} = \frac{1}{|Q|}\sum_{i=1}^{|Q|}\frac{1}{\text{rank}_i}$$

```python
def mean_reciprocal_rank(y_true_queries, y_score_queries):
    """
    计算 MRR
    """
    reciprocal_ranks = []
    for y_true, y_score in zip(y_true_queries, y_score_queries):
        # 按分数降序排列，找到第一个相关项的位置
        sorted_indices = np.argsort(y_score)[::-1]
        sorted_true = np.array(y_true)[sorted_indices]

        # 找到第一个相关项的位置（1-indexed）
        for rank, is_relevant in enumerate(sorted_true, 1):
            if is_relevant:
                reciprocal_ranks.append(1.0 / rank)
                break
        else:
            reciprocal_ranks.append(0.0)

    return np.mean(reciprocal_ranks)

mrr = mean_reciprocal_rank(queries_true, queries_score)
print(f"MRR: {mrr:.4f}")
```

### Hit Rate (命中率)

Hit Rate 衡量前 K 个推荐结果中是否包含至少一个相关项。

```python
def hit_rate_at_k(y_true_queries, y_score_queries, k=5):
    """
    计算 Hit Rate@K
    """
    hits = 0
    for y_true, y_score in zip(y_true_queries, y_score_queries):
        # 获取前 K 个推荐
        top_k_indices = np.argsort(y_score)[::-1][:k]

        # 检查是否有命中
        if any(y_true[i] for i in top_k_indices):
            hits += 1

    return hits / len(y_true_queries)

hr5 = hit_rate_at_k(queries_true, queries_score, k=5)
hr3 = hit_rate_at_k(queries_true, queries_score, k=3)
print(f"Hit Rate@5: {hr5:.4f}")
print(f"Hit Rate@3: {hr3:.4f}")
```

### Precision@K 和 Recall@K

```python
def precision_at_k(y_true, y_score, k):
    """计算 Precision@K"""
    top_k_indices = np.argsort(y_score)[::-1][:k]
    relevant_in_top_k = sum(y_true[i] for i in top_k_indices)
    return relevant_in_top_k / k

def recall_at_k(y_true, y_score, k):
    """计算 Recall@K"""
    top_k_indices = np.argsort(y_score)[::-1][:k]
    relevant_in_top_k = sum(y_true[i] for i in top_k_indices)
    total_relevant = sum(y_true)
    return relevant_in_top_k / total_relevant if total_relevant > 0 else 0

# 示例计算
y_true_single = np.array([1, 0, 1, 0, 1, 0, 1, 0, 0, 1])
y_score_single = np.array([0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.05])

for k in [3, 5, 10]:
    p_k = precision_at_k(y_true_single, y_score_single, k)
    r_k = recall_at_k(y_true_single, y_score_single, k)
    print(f"K={k}: Precision@K={p_k:.4f}, Recall@K={r_k:.4f}")
```

## 不平衡数据评估策略

类别不平衡是实际应用中的常见问题，需要特殊的评估策略。

### 不平衡数据的问题

```python
# 创建高度不平衡的数据集
from sklearn.datasets import make_classification

X_imb, y_imb = make_classification(
    n_samples=10000,
    n_features=20,
    n_informative=10,
    n_classes=2,
    weights=[0.95, 0.05],  # 95% 负例, 5% 正例
    random_state=42
)

print(f"类别分布: {np.bincount(y_imb)}")
print(f"正例比例: {np.mean(y_imb):.2%}")

X_train_imb, X_test_imb, y_train_imb, y_test_imb = train_test_split(
    X_imb, y_imb, test_size=0.3, random_state=42, stratify=y_imb
)
```

### 准确率的陷阱

```python
# 训练一个"天真"的模型（总是预测多数类）
class NaiveClassifier:
    def fit(self, X, y):
        self.majority_class = np.bincount(y).argmax()
        return self

    def predict(self, X):
        return np.full(len(X), self.majority_class)

naive = NaiveClassifier().fit(X_train_imb, y_train_imb)
y_pred_naive = naive.predict(X_test_imb)

print("天真分类器（总是预测多数类）:")
print(f"准确率: {accuracy_score(y_test_imb, y_pred_naive):.4f}")
print(f"召回率: {recall_score(y_test_imb, y_pred_naive):.4f}")
print(f"精确率: {precision_score(y_test_imb, y_pred_naive, zero_division=0):.4f}")
```

### 适合不平衡数据的指标

```python
from sklearn.ensemble import RandomForestClassifier

# 训练真正的模型
rf_imb = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
rf_imb.fit(X_train_imb, y_train_imb)
y_pred_imb = rf_imb.predict(X_test_imb)
y_prob_imb = rf_imb.predict_proba(X_test_imb)[:, 1]

print("\n随机森林（类别权重平衡）:")
print(f"准确率: {accuracy_score(y_test_imb, y_pred_imb):.4f}")
print(f"召回率: {recall_score(y_test_imb, y_pred_imb):.4f}")
print(f"精确率: {precision_score(y_test_imb, y_pred_imb):.4f}")
print(f"F1分数: {f1_score(y_test_imb, y_pred_imb):.4f}")
print(f"AUC-ROC: {roc_auc_score(y_test_imb, y_prob_imb):.4f}")
print(f"AUC-PR: {average_precision_score(y_test_imb, y_prob_imb):.4f}")
print(f"MCC: {matthews_corrcoef(y_test_imb, y_pred_imb):.4f}")
```

### Balanced Accuracy

平衡准确率是各类别召回率的平均，对不平衡数据更公平。

$$\text{Balanced Accuracy} = \frac{1}{2}\left(\frac{TP}{TP+FN} + \frac{TN}{TN+FP}\right)$$

```python
from sklearn.metrics import balanced_accuracy_score

ba = balanced_accuracy_score(y_test_imb, y_pred_imb)
print(f"平衡准确率: {ba:.4f}")

# 与普通准确率对比
print(f"普通准确率: {accuracy_score(y_test_imb, y_pred_imb):.4f}")
```

### 阈值调整

通过调整分类阈值来优化特定指标：

```python
from sklearn.metrics import precision_recall_curve

def find_optimal_threshold(y_true, y_prob, metric='f1'):
    """
    找到最优分类阈值
    """
    precisions, recalls, thresholds = precision_recall_curve(y_true, y_prob)

    if metric == 'f1':
        f1_scores = 2 * (precisions * recalls) / (precisions + recalls + 1e-10)
        optimal_idx = np.argmax(f1_scores)
    elif metric == 'precision':
        # 找到召回率 >= 0.5 时的最高精确率
        valid_idx = recalls >= 0.5
        if valid_idx.any():
            optimal_idx = np.where(valid_idx)[0][np.argmax(precisions[valid_idx])]
        else:
            optimal_idx = np.argmax(precisions)
    elif metric == 'recall':
        # 找到精确率 >= 0.5 时的最高召回率
        valid_idx = precisions >= 0.5
        if valid_idx.any():
            optimal_idx = np.where(valid_idx)[0][np.argmax(recalls[valid_idx])]
        else:
            optimal_idx = np.argmax(recalls)
    else:
        raise ValueError(f"Unknown metric: {metric}")

    return thresholds[optimal_idx] if optimal_idx < len(thresholds) else 0.5

# 找到最优 F1 阈值
optimal_threshold = find_optimal_threshold(y_test_imb, y_prob_imb, metric='f1')
print(f"最优阈值（F1）: {optimal_threshold:.4f}")

# 使用最优阈值进行预测
y_pred_optimal = (y_prob_imb >= optimal_threshold).astype(int)
print(f"\n使用最优阈值后的指标:")
print(f"F1分数: {f1_score(y_test_imb, y_pred_optimal):.4f}")
print(f"精确率: {precision_score(y_test_imb, y_pred_optimal):.4f}")
print(f"召回率: {recall_score(y_test_imb, y_pred_optimal):.4f}")
```

### 不同阈值的影响可视化

```python
def plot_threshold_analysis(y_true, y_prob):
    """可视化不同阈值对指标的影响"""
    thresholds = np.arange(0.1, 1.0, 0.05)
    metrics = {'precision': [], 'recall': [], 'f1': [], 'accuracy': []}

    for threshold in thresholds:
        y_pred = (y_prob >= threshold).astype(int)
        metrics['precision'].append(precision_score(y_true, y_pred, zero_division=0))
        metrics['recall'].append(recall_score(y_true, y_pred))
        metrics['f1'].append(f1_score(y_true, y_pred, zero_division=0))
        metrics['accuracy'].append(accuracy_score(y_true, y_pred))

    plt.figure(figsize=(10, 6))
    for name, values in metrics.items():
        plt.plot(thresholds, values, label=name, linewidth=2)

    plt.xlabel('分类阈值')
    plt.ylabel('指标值')
    plt.title('阈值对各指标的影响')
    plt.legend()
    plt.grid(True)
    plt.show()

plot_threshold_analysis(y_test_imb, y_prob_imb)
```

## 自定义业务指标

在实际业务中，标准指标可能无法完全反映业务价值，需要定义自定义指标。

### 成本敏感评估

不同类型的错误可能有不同的业务成本：

```python
def cost_sensitive_score(y_true, y_pred, cost_matrix):
    """
    计算成本敏感评估
    cost_matrix: 2x2矩阵, cost_matrix[i][j] 表示真实类别i预测为j的成本
                [[TN成本, FP成本],
                 [FN成本, TP成本]]
    """
    cm = confusion_matrix(y_true, y_pred)
    total_cost = np.sum(cm * cost_matrix)
    avg_cost = total_cost / len(y_true)
    return total_cost, avg_cost

# 定义成本矩阵（例如：欺诈检测场景）
# FN（漏检欺诈）的成本是 FP（误报）的 10 倍
cost_matrix = np.array([
    [0, 1],     # TN成本=0, FP成本=1
    [10, 0]     # FN成本=10, TP成本=0
])

total_cost, avg_cost = cost_sensitive_score(y_test_imb, y_pred_imb, cost_matrix)
print(f"总成本: {total_cost:.0f}")
print(f"平均成本: {avg_cost:.4f}")
```

### 利润/收益评估

```python
def profit_score(y_true, y_pred, profit_matrix):
    """
    计算利润评估
    profit_matrix: 各种情况的利润
    """
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()

    # 假设业务场景：信用卡欺诈检测
    # TP: 检测到欺诈，避免损失 $500
    # TN: 正常交易，正常收益 $10
    # FP: 误报，调查成本 $50
    # FN: 漏报，损失 $500

    profit = (
        tp * profit_matrix.get('tp', 0) +
        tn * profit_matrix.get('tn', 0) +
        fp * profit_matrix.get('fp', 0) +
        fn * profit_matrix.get('fn', 0)
    )
    return profit

profit_matrix = {
    'tp': 500,   # 检测到欺诈，避免损失
    'tn': 10,    # 正常交易收益
    'fp': -50,   # 误报调查成本
    'fn': -500   # 漏报损失
}

profit = profit_score(y_test_imb, y_pred_imb, profit_matrix)
print(f"总利润: ${profit:,.0f}")
```

### 自定义 Scikit-learn Scorer

```python
from sklearn.metrics import make_scorer

def custom_fbeta(y_true, y_pred, beta=2):
    """自定义 F-beta 分数"""
    return fbeta_score(y_true, y_pred, beta=beta)

def business_metric(y_true, y_pred):
    """自定义业务指标：召回率 * 0.7 + 精确率 * 0.3"""
    r = recall_score(y_true, y_pred)
    p = precision_score(y_true, y_pred)
    return r * 0.7 + p * 0.3

# 创建 scorer
f2_scorer = make_scorer(custom_fbeta, beta=2)
business_scorer = make_scorer(business_metric)

# 在交叉验证中使用自定义 scorer
from sklearn.model_selection import cross_val_score

scores = cross_val_score(rf_imb, X_train_imb, y_train_imb, cv=5, scoring=business_scorer)
print(f"业务指标交叉验证得分: {scores.mean():.4f} (+/- {scores.std()*2:.4f})")
```

### 多指标综合评估

```python
from sklearn.model_selection import cross_validate

# 同时评估多个指标
scoring = {
    'accuracy': 'accuracy',
    'precision': 'precision',
    'recall': 'recall',
    'f1': 'f1',
    'roc_auc': 'roc_auc',
    'average_precision': 'average_precision'
}

cv_results = cross_validate(rf_imb, X_train_imb, y_train_imb, cv=5, scoring=scoring)

print("多指标交叉验证结果:")
print("-" * 50)
for metric, values in cv_results.items():
    if metric.startswith('test_'):
        metric_name = metric.replace('test_', '')
        print(f"{metric_name:20s}: {values.mean():.4f} (+/- {values.std()*2:.4f})")
```

## 指标选择指南

### 分类任务指标选择

| 场景 | 推荐指标 | 原因 |
|------|----------|------|
| 类别平衡，整体性能 | 准确率、F1 | 综合反映模型性能 |
| 类别不平衡 | AUC-ROC、AUC-PR、MCC | 不受类别分布影响 |
| 不能漏检 | 召回率、F2 | 最小化假负例 |
| 不能误报 | 精确率、F0.5 | 最小化假正例 |
| 概率校准重要 | Log Loss、Brier Score | 评估概率预测质量 |
| 多分类 | Macro F1、Weighted F1 | 考虑各类别表现 |

### 回归任务指标选择

| 场景 | 推荐指标 | 原因 |
|------|----------|------|
| 通用场景 | RMSE、MAE | 直观易解释 |
| 有异常值 | MAE、Huber Loss | 对异常值鲁棒 |
| 跨量纲比较 | MAPE、R2 | 无量纲 |
| 解释模型能力 | R2、Adjusted R2 | 反映模型解释的方差比例 |
| 大误差敏感 | MSE、RMSE | 对大误差惩罚更严重 |

### 排序任务指标选择

| 场景 | 推荐指标 | 原因 |
|------|----------|------|
| 信息检索 | MAP、NDCG | 考虑位置和相关性 |
| 推荐系统 | NDCG、Hit Rate | 用户只看前几个结果 |
| 问答系统 | MRR | 第一个正确答案最重要 |
| 全排序评估 | NDCG | 考虑完整排序质量 |

## 完整示例：端到端评估流程

```python
import numpy as np
import pandas as pd
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, log_loss,
    confusion_matrix, classification_report, matthews_corrcoef,
    balanced_accuracy_score
)
import warnings
warnings.filterwarnings('ignore')

class ModelEvaluator:
    """模型评估工具类"""

    def __init__(self, models, X_train, X_test, y_train, y_test):
        self.models = models
        self.X_train = X_train
        self.X_test = X_test
        self.y_train = y_train
        self.y_test = y_test
        self.results = {}

    def evaluate_all(self):
        """评估所有模型"""
        for name, model in self.models.items():
            print(f"\n{'='*60}")
            print(f"评估模型: {name}")
            print('='*60)

            # 训练模型
            model.fit(self.X_train, self.y_train)

            # 预测
            y_pred = model.predict(self.X_test)
            y_prob = model.predict_proba(self.X_test)[:, 1] if hasattr(model, 'predict_proba') else None

            # 计算指标
            metrics = self._calculate_metrics(y_pred, y_prob)
            self.results[name] = metrics

            # 打印结果
            self._print_metrics(metrics)

    def _calculate_metrics(self, y_pred, y_prob):
        """计算所有指标"""
        metrics = {
            'accuracy': accuracy_score(self.y_test, y_pred),
            'balanced_accuracy': balanced_accuracy_score(self.y_test, y_pred),
            'precision': precision_score(self.y_test, y_pred),
            'recall': recall_score(self.y_test, y_pred),
            'f1': f1_score(self.y_test, y_pred),
            'mcc': matthews_corrcoef(self.y_test, y_pred)
        }

        if y_prob is not None:
            metrics['auc_roc'] = roc_auc_score(self.y_test, y_prob)
            metrics['auc_pr'] = average_precision_score(self.y_test, y_prob)
            metrics['log_loss'] = log_loss(self.y_test, y_prob)

        return metrics

    def _print_metrics(self, metrics):
        """打印指标"""
        print("\n【分类指标】")
        print(f"准确率: {metrics['accuracy']:.4f}")
        print(f"平衡准确率: {metrics['balanced_accuracy']:.4f}")
        print(f"精确率: {metrics['precision']:.4f}")
        print(f"召回率: {metrics['recall']:.4f}")
        print(f"F1分数: {metrics['f1']:.4f}")
        print(f"MCC: {metrics['mcc']:.4f}")

        if 'auc_roc' in metrics:
            print("\n【概率指标】")
            print(f"AUC-ROC: {metrics['auc_roc']:.4f}")
            print(f"AUC-PR: {metrics['auc_pr']:.4f}")
            print(f"Log Loss: {metrics['log_loss']:.4f}")

    def compare_models(self):
        """比较所有模型"""
        if not self.results:
            print("请先运行 evaluate_all() 方法")
            return

        df = pd.DataFrame(self.results).T

        print("\n" + "="*60)
        print("模型比较汇总")
        print("="*60)
        print(df.round(4).to_string())

        # 找出每个指标的最佳模型
        print("\n【各指标最佳模型】")
        for col in df.columns:
            if col == 'log_loss':
                best_model = df[col].idxmin()
                best_value = df[col].min()
            else:
                best_model = df[col].idxmax()
                best_value = df[col].max()
            print(f"{col}: {best_model} ({best_value:.4f})")

        return df


# 使用示例
if __name__ == "__main__":
    # 创建数据集
    X, y = make_classification(
        n_samples=5000,
        n_features=20,
        n_informative=15,
        n_classes=2,
        weights=[0.8, 0.2],
        random_state=42
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=42, stratify=y
    )

    # 定义多个模型
    models = {
        'Logistic Regression': Pipeline([
            ('scaler', StandardScaler()),
            ('clf', LogisticRegression(random_state=42, class_weight='balanced'))
        ]),
        'Random Forest': RandomForestClassifier(
            n_estimators=100, random_state=42, class_weight='balanced'
        ),
        'Gradient Boosting': GradientBoostingClassifier(
            n_estimators=100, random_state=42
        )
    }

    # 评估模型
    evaluator = ModelEvaluator(models, X_train, X_test, y_train, y_test)
    evaluator.evaluate_all()

    # 比较模型
    comparison_df = evaluator.compare_models()
```

## 面试要点

### 常见面试问题

**Q1: 准确率和精确率有什么区别？**

准确率（Accuracy）衡量所有预测中正确的比例；精确率（Precision）衡量预测为正例的样本中真正为正例的比例。在类别不平衡时，准确率可能具有误导性，而精确率和召回率能更好地反映模型性能。

**Q2: 什么情况下 AUC-PR 比 AUC-ROC 更有意义？**

在高度不平衡的数据集中，AUC-PR 比 AUC-ROC 更有意义。因为 ROC 曲线使用 FPR，而在负例占绝大多数时，FPR 变化不敏感。AUC-PR 直接关注正例的预测质量，更能反映模型对少数类的识别能力。

**Q3: 如何处理多分类问题的评估？**

多分类评估需要选择合适的平均策略：
- Micro：全局汇总后计算，适合整体性能评估
- Macro：各类别等权平均，适合各类别同等重要的场景
- Weighted：按样本数加权平均，考虑类别不平衡

**Q4: F1 分数为什么使用调和平均而不是算术平均？**

调和平均对较小值更敏感。如果精确率或召回率很低，F1 分数也会很低。这确保了模型需要在精确率和召回率两个指标上都表现良好，避免了一个指标很高另一个很低的极端情况。

**Q5: 如何选择分类阈值？**

分类阈值的选择取决于业务需求：
- 如果更重视召回率（如疾病诊断），降低阈值
- 如果更重视精确率（如垃圾邮件过滤），提高阈值
- 可以通过 PR 曲线找到最优 F1 对应的阈值
- 也可以基于成本矩阵选择使总成本最小的阈值

**Q6: MSE 和 MAE 的区别是什么？何时使用哪个？**

MSE 对大误差惩罚更严重（平方项），对异常值敏感；MAE 对各种大小的误差惩罚相同，对异常值更鲁棒。
- 如果大误差不可接受，使用 MSE
- 如果数据有异常值，使用 MAE
- 如果需要梯度优化，MSE 的梯度更平滑

### 实战技巧

1. **总是从混淆矩阵开始分析**：它提供了最直观的错误分布信息
2. **多个指标综合评估**：不要只看一个指标，要综合考虑多个指标
3. **考虑业务场景**：选择与业务目标一致的指标
4. **注意类别不平衡**：使用 AUC、MCC 等对不平衡鲁棒的指标
5. **交叉验证评估**：避免单次划分的随机性
6. **可视化辅助分析**：绘制 ROC、PR 曲线帮助理解模型性能

## 总结

模型评估是机器学习中至关重要的环节。本文全面介绍了分类、回归和排序任务中的评估指标，包括：

1. **分类指标**：准确率、精确率、召回率、F1、AUC-ROC、AUC-PR 等
2. **多类别评估**：各种平均策略、Kappa、MCC 等
3. **回归指标**：MSE、RMSE、MAE、MAPE、R2 等
4. **排序指标**：NDCG、MAP、MRR 等
5. **不平衡数据策略**：平衡准确率、阈值调整、成本敏感评估
6. **自定义指标**：根据业务需求定义评估指标

选择合适的评估指标需要深入理解业务场景和指标特性。记住，没有放之四海而皆准的最佳指标，只有最适合当前任务的指标。在实际应用中，建议综合使用多个指标，从不同角度全面评估模型性能。
