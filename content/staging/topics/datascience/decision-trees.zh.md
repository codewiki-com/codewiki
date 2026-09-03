---
title: 经典机器学习：决策树
description: 深入理解决策树算法：ID3、C4.5、CART和剪枝策略
track: datascience
section: classical-ml
difficulty: intermediate
tags:
  - 决策树
  - CART
  - 分类
  - 机器学习
status: imported
origin: old/src/content/docs/datascience/decision-trees.zh.md
divergence: 0.19
issues:
  - title-lang-en
  - title-language
legacy:
  category: DataScience
  subcategory: ClassicalML
  order: 12
  lastUpdated: 2026-01-07
---

决策树（Decision Tree）是机器学习中最直观、最易于理解的算法之一。它通过树形结构进行决策，每个内部节点表示一个特征属性的测试，每个分支代表测试输出，每个叶节点代表一种类别或数值。本文将深入探讨决策树的核心原理、经典算法、剪枝策略以及实际应用。

---

## 决策树原理

### 什么是决策树

决策树是一种基于树结构的监督学习算法，可用于分类和回归任务。其核心思想是通过对特征空间进行递归划分，构建一棵树来进行预测。

**决策树的组成部分：**

- **根节点（Root Node）**：树的起始节点，包含所有训练样本
- **内部节点（Internal Node）**：表示对某个特征的测试条件
- **分支（Branch）**：表示测试结果，连接父节点和子节点
- **叶节点（Leaf Node）**：表示最终的决策结果（类别或数值）

### 决策树的学习过程

决策树的学习本质上是从训练数据中归纳出一组分类规则。学习过程通常包括三个步骤：

1. **特征选择**：选择最优特征进行分裂
2. **决策树生成**：递归地构建子树
3. **决策树剪枝**：防止过拟合，提高泛化能力

```
决策树学习算法（伪代码）：
输入：训练数据集D，特征集A
输出：决策树T

function BuildTree(D, A):
    if D中所有样本属于同一类C:
        return 叶节点（类别=C）

    if A为空 or D中样本在A上取值相同:
        return 叶节点（类别=D中最多的类）

    选择最优特征 a* ∈ A

    for a* 的每个取值 v:
        Dv = D中在a*上取值为v的样本子集
        if Dv为空:
            创建叶节点（类别=D中最多的类）
        else:
            以BuildTree(Dv, A-{a*})为子节点

    return 以a*为分裂特征的内部节点
```

### 决策树的优缺点

**优点：**
- 直观易懂，模型可解释性强
- 无需特征标准化或归一化
- 可以处理数值型和类别型特征
- 能够捕捉特征间的非线性关系
- 计算成本相对较低

**缺点：**
- 容易过拟合，尤其是树很深时
- 对数据变化敏感，微小变化可能导致完全不同的树
- 可能产生偏向于取值较多的特征的偏差
- 难以处理特征间的相关性

---

## 特征选择准则

特征选择是决策树学习的核心问题。好的特征选择准则能够使决策树更快地收敛到纯净的叶节点。常用的准则包括信息增益、增益率和基尼系数。

### 信息熵（Information Entropy）

信息熵是度量样本集合纯度的指标。设样本集合 $D$ 中第 $k$ 类样本所占的比例为 $p_k$，则信息熵定义为：

$$H(D) = -\sum_{k=1}^{K} p_k \log_2 p_k$$

**特点：**
- 熵值越大，样本集合的不确定性越高
- 当所有样本属于同一类时，熵为0
- 当各类样本均匀分布时，熵最大

```python
import numpy as np

def entropy(y):
    """计算信息熵"""
    _, counts = np.unique(y, return_counts=True)
    probabilities = counts / len(y)
    return -np.sum(probabilities * np.log2(probabilities + 1e-10))

# 示例
y_pure = np.array([1, 1, 1, 1, 1])
y_mixed = np.array([1, 1, 0, 0, 1])
y_uniform = np.array([0, 0, 1, 1, 2, 2])

print(f"纯净样本熵: {entropy(y_pure):.4f}")      # 0.0
print(f"混合样本熵: {entropy(y_mixed):.4f}")     # 0.9710
print(f"均匀分布熵: {entropy(y_uniform):.4f}")   # 1.5850
```

### 信息增益（Information Gain）

信息增益表示在得知特征 $A$ 的信息后，样本集合不确定性减少的程度。设特征 $A$ 有 $V$ 个可能取值 $\{a^1, a^2, ..., a^V\}$，则信息增益定义为：

$$Gain(D, A) = H(D) - \sum_{v=1}^{V} \frac{|D^v|}{|D|} H(D^v)$$

其中 $D^v$ 表示 $D$ 中在特征 $A$ 上取值为 $a^v$ 的样本子集。

**ID3算法使用信息增益作为特征选择准则。**

```python
def information_gain(X, y, feature_idx):
    """计算信息增益"""
    # 计算父节点熵
    parent_entropy = entropy(y)

    # 获取特征的所有取值
    values = np.unique(X[:, feature_idx])

    # 计算加权子节点熵
    weighted_child_entropy = 0
    for value in values:
        mask = X[:, feature_idx] == value
        child_y = y[mask]
        weight = len(child_y) / len(y)
        weighted_child_entropy += weight * entropy(child_y)

    return parent_entropy - weighted_child_entropy

# 示例：天气数据集
X = np.array([
    ['晴', '热', '高', '弱'],
    ['晴', '热', '高', '强'],
    ['阴', '热', '高', '弱'],
    ['雨', '温', '高', '弱'],
    ['雨', '冷', '正常', '弱'],
    ['雨', '冷', '正常', '强'],
    ['阴', '冷', '正常', '强'],
    ['晴', '温', '高', '弱'],
    ['晴', '冷', '正常', '弱'],
    ['雨', '温', '正常', '弱'],
    ['晴', '温', '正常', '强'],
    ['阴', '温', '高', '强'],
    ['阴', '热', '正常', '弱'],
    ['雨', '温', '高', '强'],
])
y = np.array([0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0])  # 0=不打球, 1=打球

feature_names = ['天气', '温度', '湿度', '风力']
for i, name in enumerate(feature_names):
    gain = information_gain(X, y, i)
    print(f"特征'{name}'的信息增益: {gain:.4f}")
```

### 增益率（Gain Ratio）

信息增益偏向于选择取值较多的特征。为了克服这个问题，C4.5算法使用增益率作为特征选择准则：

$$GainRatio(D, A) = \frac{Gain(D, A)}{IV(A)}$$

其中 $IV(A)$ 是特征 $A$ 的固有值（Intrinsic Value）：

$$IV(A) = -\sum_{v=1}^{V} \frac{|D^v|}{|D|} \log_2 \frac{|D^v|}{|D|}$$

```python
def intrinsic_value(X, feature_idx):
    """计算特征的固有值"""
    _, counts = np.unique(X[:, feature_idx], return_counts=True)
    probabilities = counts / len(X)
    return -np.sum(probabilities * np.log2(probabilities + 1e-10))

def gain_ratio(X, y, feature_idx):
    """计算增益率"""
    gain = information_gain(X, y, feature_idx)
    iv = intrinsic_value(X, feature_idx)

    # 避免除以零
    if iv == 0:
        return 0

    return gain / iv

# 计算各特征的增益率
for i, name in enumerate(feature_names):
    gr = gain_ratio(X, y, i)
    iv = intrinsic_value(X, i)
    print(f"特征'{name}': IV={iv:.4f}, 增益率={gr:.4f}")
```

### 基尼系数（Gini Index）

基尼系数衡量从数据集中随机抽取两个样本，其类别不一致的概率。基尼系数越小，数据集纯度越高。

$$Gini(D) = 1 - \sum_{k=1}^{K} p_k^2$$

基于特征 $A$ 的基尼指数为：

$$Gini\_index(D, A) = \sum_{v=1}^{V} \frac{|D^v|}{|D|} Gini(D^v)$$

**CART算法使用基尼系数作为特征选择准则。**

```python
def gini(y):
    """计算基尼系数"""
    _, counts = np.unique(y, return_counts=True)
    probabilities = counts / len(y)
    return 1 - np.sum(probabilities ** 2)

def gini_index(X, y, feature_idx, threshold=None):
    """计算基尼指数

    对于离散特征，计算所有取值的加权基尼系数
    对于连续特征，使用阈值进行二分
    """
    if threshold is None:
        # 离散特征
        values = np.unique(X[:, feature_idx])
        gini_sum = 0
        for value in values:
            mask = X[:, feature_idx] == value
            weight = mask.sum() / len(y)
            gini_sum += weight * gini(y[mask])
        return gini_sum
    else:
        # 连续特征，二分
        left_mask = X[:, feature_idx] <= threshold
        right_mask = ~left_mask

        left_weight = left_mask.sum() / len(y)
        right_weight = right_mask.sum() / len(y)

        return left_weight * gini(y[left_mask]) + right_weight * gini(y[right_mask])

# 示例
print(f"样本基尼系数: {gini(y):.4f}")
for i, name in enumerate(feature_names):
    gi = gini_index(X, y, i)
    print(f"特征'{name}'的基尼指数: {gi:.4f}")
```

### 三种准则的比较

| 准则 | 使用算法 | 特点 | 计算复杂度 |
|------|----------|------|-----------|
| 信息增益 | ID3 | 偏向多值特征 | 较低 |
| 增益率 | C4.5 | 克服多值偏好 | 中等 |
| 基尼系数 | CART | 计算简单，二分树 | 较低 |

---

## 经典算法详解

### ID3算法

ID3（Iterative Dichotomiser 3）是最早的决策树算法之一，由Ross Quinlan于1986年提出。

**算法特点：**
- 使用信息增益作为特征选择准则
- 只能处理离散特征
- 生成多叉树
- 容易过拟合

```python
import numpy as np
from collections import Counter

class ID3DecisionTree:
    """ID3决策树分类器"""

    def __init__(self, max_depth=None, min_samples_split=2):
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.tree = None
        self.feature_names = None

    def fit(self, X, y, feature_names=None):
        """训练决策树"""
        self.feature_names = feature_names or [f"feature_{i}" for i in range(X.shape[1])]
        self.tree = self._build_tree(X, y, list(range(X.shape[1])), depth=0)
        return self

    def _entropy(self, y):
        """计算信息熵"""
        _, counts = np.unique(y, return_counts=True)
        probs = counts / len(y)
        return -np.sum(probs * np.log2(probs + 1e-10))

    def _information_gain(self, X, y, feature_idx):
        """计算信息增益"""
        parent_entropy = self._entropy(y)

        values = np.unique(X[:, feature_idx])
        weighted_entropy = 0

        for value in values:
            mask = X[:, feature_idx] == value
            weight = mask.sum() / len(y)
            weighted_entropy += weight * self._entropy(y[mask])

        return parent_entropy - weighted_entropy

    def _best_feature(self, X, y, available_features):
        """选择最佳分裂特征"""
        best_gain = -1
        best_feature = None

        for feature_idx in available_features:
            gain = self._information_gain(X, y, feature_idx)
            if gain > best_gain:
                best_gain = gain
                best_feature = feature_idx

        return best_feature, best_gain

    def _build_tree(self, X, y, available_features, depth):
        """递归构建决策树"""
        # 停止条件1：所有样本属于同一类
        if len(np.unique(y)) == 1:
            return {'leaf': True, 'class': y[0]}

        # 停止条件2：没有可用特征
        if len(available_features) == 0:
            return {'leaf': True, 'class': Counter(y).most_common(1)[0][0]}

        # 停止条件3：达到最大深度
        if self.max_depth is not None and depth >= self.max_depth:
            return {'leaf': True, 'class': Counter(y).most_common(1)[0][0]}

        # 停止条件4：样本数小于最小分裂数
        if len(y) < self.min_samples_split:
            return {'leaf': True, 'class': Counter(y).most_common(1)[0][0]}

        # 选择最佳特征
        best_feature, best_gain = self._best_feature(X, y, available_features)

        # 如果信息增益为0，返回叶节点
        if best_gain == 0:
            return {'leaf': True, 'class': Counter(y).most_common(1)[0][0]}

        # 构建内部节点
        node = {
            'leaf': False,
            'feature': best_feature,
            'feature_name': self.feature_names[best_feature],
            'children': {}
        }

        # 递归构建子树
        remaining_features = [f for f in available_features if f != best_feature]

        for value in np.unique(X[:, best_feature]):
            mask = X[:, best_feature] == value
            child_X, child_y = X[mask], y[mask]

            if len(child_y) == 0:
                node['children'][value] = {
                    'leaf': True,
                    'class': Counter(y).most_common(1)[0][0]
                }
            else:
                node['children'][value] = self._build_tree(
                    child_X, child_y, remaining_features, depth + 1
                )

        return node

    def predict_one(self, x, node=None):
        """预测单个样本"""
        if node is None:
            node = self.tree

        if node['leaf']:
            return node['class']

        feature_value = x[node['feature']]

        if feature_value in node['children']:
            return self.predict_one(x, node['children'][feature_value])
        else:
            # 处理未见过的特征值：返回最常见的类别
            return self._most_common_class(node)

    def _most_common_class(self, node):
        """获取子树中最常见的类别"""
        if node['leaf']:
            return node['class']

        classes = []
        for child in node['children'].values():
            classes.append(self._most_common_class(child))

        return Counter(classes).most_common(1)[0][0]

    def predict(self, X):
        """预测多个样本"""
        return np.array([self.predict_one(x) for x in X])

    def print_tree(self, node=None, indent=""):
        """打印决策树结构"""
        if node is None:
            node = self.tree

        if node['leaf']:
            print(f"{indent}叶节点: 类别={node['class']}")
        else:
            print(f"{indent}[{node['feature_name']}]")
            for value, child in node['children'].items():
                print(f"{indent}  |-- {value}:")
                self.print_tree(child, indent + "  |   ")

# 使用示例
id3 = ID3DecisionTree(max_depth=5)
id3.fit(X, y, feature_names)
id3.print_tree()

# 预测
predictions = id3.predict(X)
accuracy = (predictions == y).mean()
print(f"\n训练集准确率: {accuracy:.4f}")
```

### C4.5算法

C4.5是ID3的改进版本，同样由Ross Quinlan提出。

**相对于ID3的改进：**
- 使用增益率替代信息增益，避免偏向多值特征
- 能够处理连续特征（通过寻找最优切分点）
- 能够处理缺失值
- 引入剪枝机制

```python
class C45DecisionTree:
    """C4.5决策树分类器"""

    def __init__(self, max_depth=None, min_samples_split=2, min_gain_ratio=0.01):
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.min_gain_ratio = min_gain_ratio
        self.tree = None

    def fit(self, X, y, feature_names=None, feature_types=None):
        """训练决策树

        Parameters:
        -----------
        feature_types: list
            'discrete' 或 'continuous'，指定每个特征的类型
        """
        self.feature_names = feature_names or [f"f{i}" for i in range(X.shape[1])]
        self.feature_types = feature_types or ['discrete'] * X.shape[1]
        self.tree = self._build_tree(X, y, list(range(X.shape[1])), depth=0)
        return self

    def _entropy(self, y):
        """计算信息熵"""
        if len(y) == 0:
            return 0
        _, counts = np.unique(y, return_counts=True)
        probs = counts / len(y)
        return -np.sum(probs * np.log2(probs + 1e-10))

    def _intrinsic_value(self, X, feature_idx, threshold=None):
        """计算固有值"""
        if threshold is None:
            _, counts = np.unique(X[:, feature_idx], return_counts=True)
        else:
            left = (X[:, feature_idx] <= threshold).sum()
            right = len(X) - left
            counts = np.array([left, right])

        probs = counts / len(X)
        probs = probs[probs > 0]  # 避免log(0)
        return -np.sum(probs * np.log2(probs))

    def _find_best_threshold(self, X, y, feature_idx):
        """为连续特征寻找最佳切分点"""
        values = np.unique(X[:, feature_idx])

        if len(values) <= 1:
            return None, 0

        # 候选切分点：相邻值的中点
        thresholds = (values[:-1] + values[1:]) / 2

        parent_entropy = self._entropy(y)
        best_gain = -1
        best_threshold = None

        for threshold in thresholds:
            left_mask = X[:, feature_idx] <= threshold
            right_mask = ~left_mask

            if left_mask.sum() == 0 or right_mask.sum() == 0:
                continue

            left_entropy = self._entropy(y[left_mask])
            right_entropy = self._entropy(y[right_mask])

            weighted_entropy = (
                left_mask.sum() / len(y) * left_entropy +
                right_mask.sum() / len(y) * right_entropy
            )

            gain = parent_entropy - weighted_entropy

            if gain > best_gain:
                best_gain = gain
                best_threshold = threshold

        return best_threshold, best_gain

    def _gain_ratio(self, X, y, feature_idx, threshold=None):
        """计算增益率"""
        parent_entropy = self._entropy(y)

        if threshold is None:
            # 离散特征
            values = np.unique(X[:, feature_idx])
            weighted_entropy = 0

            for value in values:
                mask = X[:, feature_idx] == value
                weight = mask.sum() / len(y)
                weighted_entropy += weight * self._entropy(y[mask])
        else:
            # 连续特征
            left_mask = X[:, feature_idx] <= threshold
            right_mask = ~left_mask

            weighted_entropy = (
                left_mask.sum() / len(y) * self._entropy(y[left_mask]) +
                right_mask.sum() / len(y) * self._entropy(y[right_mask])
            )

        gain = parent_entropy - weighted_entropy
        iv = self._intrinsic_value(X, feature_idx, threshold)

        if iv == 0:
            return 0, gain

        return gain / iv, gain

    def _best_feature(self, X, y, available_features):
        """选择最佳分裂特征"""
        best_ratio = -1
        best_feature = None
        best_threshold = None
        best_gain = 0

        # 先计算所有特征的信息增益平均值
        gains = []
        for feature_idx in available_features:
            if self.feature_types[feature_idx] == 'continuous':
                threshold, gain = self._find_best_threshold(X, y, feature_idx)
            else:
                _, gain = self._gain_ratio(X, y, feature_idx)
            gains.append(gain)

        avg_gain = np.mean(gains) if gains else 0

        # 从信息增益高于平均值的特征中选择增益率最大的
        for i, feature_idx in enumerate(available_features):
            if self.feature_types[feature_idx] == 'continuous':
                threshold, gain = self._find_best_threshold(X, y, feature_idx)
                if threshold is None:
                    continue
                ratio, _ = self._gain_ratio(X, y, feature_idx, threshold)
            else:
                threshold = None
                ratio, gain = self._gain_ratio(X, y, feature_idx)

            # C4.5启发式：先筛选信息增益高于平均的特征
            if gain >= avg_gain and ratio > best_ratio:
                best_ratio = ratio
                best_feature = feature_idx
                best_threshold = threshold
                best_gain = gain

        return best_feature, best_threshold, best_ratio

    def _build_tree(self, X, y, available_features, depth):
        """递归构建决策树"""
        # 停止条件
        if len(np.unique(y)) == 1:
            return {'leaf': True, 'class': y[0], 'samples': len(y)}

        if len(available_features) == 0:
            return {'leaf': True, 'class': Counter(y).most_common(1)[0][0], 'samples': len(y)}

        if self.max_depth is not None and depth >= self.max_depth:
            return {'leaf': True, 'class': Counter(y).most_common(1)[0][0], 'samples': len(y)}

        if len(y) < self.min_samples_split:
            return {'leaf': True, 'class': Counter(y).most_common(1)[0][0], 'samples': len(y)}

        # 选择最佳特征
        best_feature, best_threshold, best_ratio = self._best_feature(X, y, available_features)

        if best_feature is None or best_ratio < self.min_gain_ratio:
            return {'leaf': True, 'class': Counter(y).most_common(1)[0][0], 'samples': len(y)}

        # 构建节点
        node = {
            'leaf': False,
            'feature': best_feature,
            'feature_name': self.feature_names[best_feature],
            'threshold': best_threshold,
            'samples': len(y),
            'children': {}
        }

        if best_threshold is not None:
            # 连续特征：二分
            left_mask = X[:, best_feature] <= best_threshold
            right_mask = ~left_mask

            # 连续特征可以重复使用
            node['children']['<='] = self._build_tree(
                X[left_mask], y[left_mask], available_features, depth + 1
            )
            node['children']['>'] = self._build_tree(
                X[right_mask], y[right_mask], available_features, depth + 1
            )
        else:
            # 离散特征：多分支
            remaining_features = [f for f in available_features if f != best_feature]

            for value in np.unique(X[:, best_feature]):
                mask = X[:, best_feature] == value
                if mask.sum() > 0:
                    node['children'][value] = self._build_tree(
                        X[mask], y[mask], remaining_features, depth + 1
                    )

        return node

    def predict_one(self, x, node=None):
        """预测单个样本"""
        if node is None:
            node = self.tree

        if node['leaf']:
            return node['class']

        feature_value = x[node['feature']]

        if node['threshold'] is not None:
            # 连续特征
            if feature_value <= node['threshold']:
                return self.predict_one(x, node['children']['<='])
            else:
                return self.predict_one(x, node['children']['>'])
        else:
            # 离散特征
            if feature_value in node['children']:
                return self.predict_one(x, node['children'][feature_value])
            else:
                # 返回最常见类别
                return self._get_majority_class(node)

    def _get_majority_class(self, node):
        """获取节点下最常见的类别"""
        if node['leaf']:
            return node['class']

        classes = []
        for child in node['children'].values():
            classes.append(self._get_majority_class(child))

        return Counter(classes).most_common(1)[0][0] if classes else 0

    def predict(self, X):
        """预测多个样本"""
        return np.array([self.predict_one(x) for x in X])
```

### CART算法

CART（Classification and Regression Trees）是最常用的决策树算法，由Breiman等人于1984年提出。

**CART算法特点：**
- 使用基尼系数作为特征选择准则
- 只生成二叉树
- 可用于分类和回归
- 使用代价复杂度剪枝

```python
class CARTClassifier:
    """CART分类树"""

    def __init__(self, max_depth=None, min_samples_split=2,
                 min_samples_leaf=1, min_impurity_decrease=0.0):
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.min_samples_leaf = min_samples_leaf
        self.min_impurity_decrease = min_impurity_decrease
        self.tree = None

    def fit(self, X, y):
        """训练CART分类树"""
        self.n_features = X.shape[1]
        self.n_classes = len(np.unique(y))
        self.tree = self._build_tree(X, y, depth=0)
        return self

    def _gini(self, y):
        """计算基尼系数"""
        if len(y) == 0:
            return 0
        _, counts = np.unique(y, return_counts=True)
        probs = counts / len(y)
        return 1 - np.sum(probs ** 2)

    def _gini_split(self, y_left, y_right):
        """计算分裂后的加权基尼系数"""
        n = len(y_left) + len(y_right)
        if n == 0:
            return 0

        return (len(y_left) / n * self._gini(y_left) +
                len(y_right) / n * self._gini(y_right))

    def _find_best_split(self, X, y):
        """寻找最佳分裂点"""
        best_gini = float('inf')
        best_feature = None
        best_threshold = None

        current_gini = self._gini(y)

        for feature_idx in range(X.shape[1]):
            # 获取排序后的唯一值
            values = np.unique(X[:, feature_idx])

            if len(values) <= 1:
                continue

            # 候选切分点
            thresholds = (values[:-1] + values[1:]) / 2

            for threshold in thresholds:
                left_mask = X[:, feature_idx] <= threshold
                right_mask = ~left_mask

                # 检查最小叶子节点样本数
                if left_mask.sum() < self.min_samples_leaf:
                    continue
                if right_mask.sum() < self.min_samples_leaf:
                    continue

                gini = self._gini_split(y[left_mask], y[right_mask])

                # 检查最小不纯度减少
                if current_gini - gini < self.min_impurity_decrease:
                    continue

                if gini < best_gini:
                    best_gini = gini
                    best_feature = feature_idx
                    best_threshold = threshold

        return best_feature, best_threshold, best_gini

    def _build_tree(self, X, y, depth):
        """递归构建CART树"""
        n_samples = len(y)
        n_classes = len(np.unique(y))

        # 计算当前节点的类别分布
        class_counts = np.bincount(y, minlength=self.n_classes)
        predicted_class = np.argmax(class_counts)

        node = {
            'n_samples': n_samples,
            'class_distribution': class_counts,
            'predicted_class': predicted_class,
            'gini': self._gini(y)
        }

        # 检查停止条件
        if (self.max_depth is not None and depth >= self.max_depth):
            node['leaf'] = True
            return node

        if n_classes == 1:
            node['leaf'] = True
            return node

        if n_samples < self.min_samples_split:
            node['leaf'] = True
            return node

        # 寻找最佳分裂
        best_feature, best_threshold, best_gini = self._find_best_split(X, y)

        if best_feature is None:
            node['leaf'] = True
            return node

        # 执行分裂
        left_mask = X[:, best_feature] <= best_threshold
        right_mask = ~left_mask

        node['leaf'] = False
        node['feature'] = best_feature
        node['threshold'] = best_threshold
        node['left'] = self._build_tree(X[left_mask], y[left_mask], depth + 1)
        node['right'] = self._build_tree(X[right_mask], y[right_mask], depth + 1)

        return node

    def predict_one(self, x, node=None):
        """预测单个样本"""
        if node is None:
            node = self.tree

        if node['leaf']:
            return node['predicted_class']

        if x[node['feature']] <= node['threshold']:
            return self.predict_one(x, node['left'])
        else:
            return self.predict_one(x, node['right'])

    def predict(self, X):
        """预测多个样本"""
        return np.array([self.predict_one(x) for x in X])

    def predict_proba(self, X):
        """预测类别概率"""
        probas = []
        for x in X:
            node = self.tree
            while not node['leaf']:
                if x[node['feature']] <= node['threshold']:
                    node = node['left']
                else:
                    node = node['right']

            proba = node['class_distribution'] / node['n_samples']
            probas.append(proba)

        return np.array(probas)

# 使用示例
from sklearn.datasets import make_classification

X_train, y_train = make_classification(
    n_samples=500, n_features=10, n_informative=5,
    n_redundant=2, random_state=42
)

cart = CARTClassifier(max_depth=5, min_samples_split=10)
cart.fit(X_train, y_train)

predictions = cart.predict(X_train)
accuracy = (predictions == y_train).mean()
print(f"CART训练集准确率: {accuracy:.4f}")
```

---

## 剪枝策略

剪枝是防止决策树过拟合的关键技术。分为预剪枝和后剪枝两种策略。

### 预剪枝（Pre-pruning）

预剪枝在树的生成过程中提前停止分裂。常用的预剪枝条件包括：

1. **最大深度限制**：树达到指定深度后停止分裂
2. **最小样本数**：节点样本数小于阈值时停止分裂
3. **最小不纯度减少**：分裂带来的不纯度减少小于阈值时停止
4. **最大叶节点数**：限制叶节点总数

```python
class PrePrunedDecisionTree:
    """带预剪枝的决策树"""

    def __init__(self,
                 max_depth=None,           # 最大深度
                 min_samples_split=2,      # 内部节点最小样本数
                 min_samples_leaf=1,       # 叶节点最小样本数
                 max_leaf_nodes=None,      # 最大叶节点数
                 min_impurity_decrease=0.0 # 最小不纯度减少
                 ):
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.min_samples_leaf = min_samples_leaf
        self.max_leaf_nodes = max_leaf_nodes
        self.min_impurity_decrease = min_impurity_decrease

    def _should_stop(self, X, y, depth, n_leaves):
        """检查是否应该停止分裂"""
        # 条件1：达到最大深度
        if self.max_depth is not None and depth >= self.max_depth:
            return True

        # 条件2：样本数不足
        if len(y) < self.min_samples_split:
            return True

        # 条件3：所有样本属于同一类
        if len(np.unique(y)) == 1:
            return True

        # 条件4：达到最大叶节点数
        if self.max_leaf_nodes is not None and n_leaves >= self.max_leaf_nodes:
            return True

        return False

    def _is_valid_split(self, y_left, y_right, impurity_decrease):
        """检查分裂是否有效"""
        # 检查叶节点最小样本数
        if len(y_left) < self.min_samples_leaf:
            return False
        if len(y_right) < self.min_samples_leaf:
            return False

        # 检查最小不纯度减少
        if impurity_decrease < self.min_impurity_decrease:
            return False

        return True
```

**预剪枝的优缺点：**

| 优点 | 缺点 |
|------|------|
| 降低过拟合风险 | 可能导致欠拟合 |
| 减少训练时间和空间 | 难以确定最佳参数 |
| 生成较小的树 | 可能错过最优分裂 |

### 后剪枝（Post-pruning）

后剪枝先生成完整的决策树，然后自底向上地剪除某些子树，用叶节点替代。

#### 代价复杂度剪枝（Cost-Complexity Pruning）

CART算法使用的后剪枝方法，通过优化以下目标函数：

$$C_\alpha(T) = C(T) + \alpha|T|$$

其中：
- $C(T)$ 是树 $T$ 的训练误差
- $|T|$ 是叶节点数量
- $\alpha$ 是复杂度参数

```python
class PostPrunedDecisionTree:
    """带后剪枝的决策树"""

    def __init__(self, max_depth=None):
        self.max_depth = max_depth
        self.tree = None

    def fit(self, X, y):
        """训练决策树"""
        # 先生成完整的树
        self.tree = self._build_full_tree(X, y, depth=0)
        return self

    def prune(self, X_val, y_val):
        """使用验证集进行后剪枝

        采用降低错误剪枝（Reduced Error Pruning）
        """
        # 获取所有内部节点（自底向上）
        internal_nodes = self._get_internal_nodes_bottom_up(self.tree)

        for node in internal_nodes:
            # 记录剪枝前的准确率
            accuracy_before = self._accuracy(X_val, y_val)

            # 临时剪枝：将内部节点变为叶节点
            original_state = self._prune_node(node)

            # 计算剪枝后的准确率
            accuracy_after = self._accuracy(X_val, y_val)

            # 如果准确率没有下降，保留剪枝
            if accuracy_after >= accuracy_before:
                pass  # 保持剪枝状态
            else:
                # 恢复原状态
                self._restore_node(node, original_state)

        return self

    def _prune_node(self, node):
        """将内部节点剪枝为叶节点"""
        original_state = {
            'leaf': node['leaf'],
            'left': node.get('left'),
            'right': node.get('right'),
            'feature': node.get('feature'),
            'threshold': node.get('threshold')
        }

        node['leaf'] = True
        node.pop('left', None)
        node.pop('right', None)
        node.pop('feature', None)
        node.pop('threshold', None)

        return original_state

    def _restore_node(self, node, original_state):
        """恢复节点状态"""
        node.update(original_state)

    def _get_internal_nodes_bottom_up(self, node, nodes=None):
        """自底向上获取所有内部节点"""
        if nodes is None:
            nodes = []

        if not node['leaf']:
            # 先递归处理子节点
            self._get_internal_nodes_bottom_up(node['left'], nodes)
            self._get_internal_nodes_bottom_up(node['right'], nodes)
            # 再添加当前节点
            nodes.append(node)

        return nodes

    def _accuracy(self, X, y):
        """计算准确率"""
        predictions = self.predict(X)
        return (predictions == y).mean()

    def cost_complexity_pruning_path(self, X, y):
        """计算代价复杂度剪枝路径

        返回不同alpha值对应的子树
        """
        alphas = [0]
        impurities = [self._total_impurity(self.tree)]

        # 计算每个内部节点的有效alpha
        while True:
            min_alpha = float('inf')
            best_node = None

            internal_nodes = self._get_internal_nodes_bottom_up(self.tree)

            if len(internal_nodes) == 0:
                break

            for node in internal_nodes:
                # 计算该节点的有效alpha
                # alpha = (R(t) - R(T_t)) / (|T_t| - 1)
                leaf_impurity = node['n_samples'] * node['gini']
                subtree_impurity = self._subtree_impurity(node)
                n_leaves = self._count_leaves(node)

                if n_leaves > 1:
                    alpha = (leaf_impurity - subtree_impurity) / (n_leaves - 1)

                    if alpha < min_alpha:
                        min_alpha = alpha
                        best_node = node

            if best_node is None:
                break

            # 剪枝
            self._prune_node(best_node)
            alphas.append(min_alpha)
            impurities.append(self._total_impurity(self.tree))

        return np.array(alphas), np.array(impurities)

    def _subtree_impurity(self, node):
        """计算子树的总不纯度"""
        if node['leaf']:
            return node['n_samples'] * node['gini']

        return (self._subtree_impurity(node['left']) +
                self._subtree_impurity(node['right']))

    def _count_leaves(self, node):
        """计算叶节点数"""
        if node['leaf']:
            return 1
        return self._count_leaves(node['left']) + self._count_leaves(node['right'])

    def _total_impurity(self, node):
        """计算整棵树的总不纯度"""
        return self._subtree_impurity(node)
```

#### 使用Scikit-learn进行代价复杂度剪枝

```python
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import cross_val_score
import matplotlib.pyplot as plt

# 创建完整的决策树
clf = DecisionTreeClassifier(random_state=42)
clf.fit(X_train, y_train)

# 获取代价复杂度剪枝路径
path = clf.cost_complexity_pruning_path(X_train, y_train)
ccp_alphas = path.ccp_alphas
impurities = path.impurities

# 对每个alpha值训练一棵树
clfs = []
for ccp_alpha in ccp_alphas:
    clf = DecisionTreeClassifier(ccp_alpha=ccp_alpha, random_state=42)
    clf.fit(X_train, y_train)
    clfs.append(clf)

# 计算训练和测试准确率
train_scores = [clf.score(X_train, y_train) for clf in clfs]
test_scores = [clf.score(X_test, y_test) for clf in clfs]

# 可视化
fig, ax = plt.subplots(figsize=(10, 6))
ax.plot(ccp_alphas, train_scores, marker='o', label='训练集', drawstyle='steps-post')
ax.plot(ccp_alphas, test_scores, marker='o', label='测试集', drawstyle='steps-post')
ax.set_xlabel('Alpha (ccp_alpha)')
ax.set_ylabel('准确率')
ax.set_title('代价复杂度剪枝：准确率 vs Alpha')
ax.legend()
plt.tight_layout()
plt.show()

# 使用交叉验证选择最佳alpha
alpha_scores = []
for ccp_alpha in ccp_alphas:
    clf = DecisionTreeClassifier(ccp_alpha=ccp_alpha, random_state=42)
    scores = cross_val_score(clf, X_train, y_train, cv=5, scoring='accuracy')
    alpha_scores.append(scores.mean())

best_alpha = ccp_alphas[np.argmax(alpha_scores)]
print(f"最佳alpha: {best_alpha:.6f}")
print(f"最佳交叉验证准确率: {max(alpha_scores):.4f}")
```

---

## 回归树

回归树用于预测连续值目标变量，使用不同的分裂准则和叶节点预测方法。

### 回归树原理

**分裂准则**：通常使用均方误差（MSE）或平均绝对误差（MAE）

$$MSE = \frac{1}{n} \sum_{i=1}^{n} (y_i - \bar{y})^2$$

**叶节点预测**：使用叶节点中所有样本的均值

```python
class CARTRegressor:
    """CART回归树"""

    def __init__(self, max_depth=None, min_samples_split=2,
                 min_samples_leaf=1, min_impurity_decrease=0.0):
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.min_samples_leaf = min_samples_leaf
        self.min_impurity_decrease = min_impurity_decrease
        self.tree = None

    def fit(self, X, y):
        """训练回归树"""
        self.tree = self._build_tree(X, y, depth=0)
        return self

    def _mse(self, y):
        """计算均方误差"""
        if len(y) == 0:
            return 0
        return np.mean((y - np.mean(y)) ** 2)

    def _mse_reduction(self, y, y_left, y_right):
        """计算分裂带来的MSE减少"""
        n = len(y)
        n_left, n_right = len(y_left), len(y_right)

        if n == 0:
            return 0

        mse_parent = self._mse(y)
        mse_children = (n_left / n * self._mse(y_left) +
                       n_right / n * self._mse(y_right))

        return mse_parent - mse_children

    def _find_best_split(self, X, y):
        """寻找最佳分裂点"""
        best_reduction = -float('inf')
        best_feature = None
        best_threshold = None

        for feature_idx in range(X.shape[1]):
            values = np.unique(X[:, feature_idx])

            if len(values) <= 1:
                continue

            thresholds = (values[:-1] + values[1:]) / 2

            for threshold in thresholds:
                left_mask = X[:, feature_idx] <= threshold
                right_mask = ~left_mask

                if left_mask.sum() < self.min_samples_leaf:
                    continue
                if right_mask.sum() < self.min_samples_leaf:
                    continue

                reduction = self._mse_reduction(y, y[left_mask], y[right_mask])

                if reduction < self.min_impurity_decrease:
                    continue

                if reduction > best_reduction:
                    best_reduction = reduction
                    best_feature = feature_idx
                    best_threshold = threshold

        return best_feature, best_threshold, best_reduction

    def _build_tree(self, X, y, depth):
        """递归构建回归树"""
        n_samples = len(y)
        prediction = np.mean(y)
        mse = self._mse(y)

        node = {
            'n_samples': n_samples,
            'prediction': prediction,
            'mse': mse
        }

        # 检查停止条件
        if self.max_depth is not None and depth >= self.max_depth:
            node['leaf'] = True
            return node

        if n_samples < self.min_samples_split:
            node['leaf'] = True
            return node

        # 寻找最佳分裂
        best_feature, best_threshold, _ = self._find_best_split(X, y)

        if best_feature is None:
            node['leaf'] = True
            return node

        # 执行分裂
        left_mask = X[:, best_feature] <= best_threshold
        right_mask = ~left_mask

        node['leaf'] = False
        node['feature'] = best_feature
        node['threshold'] = best_threshold
        node['left'] = self._build_tree(X[left_mask], y[left_mask], depth + 1)
        node['right'] = self._build_tree(X[right_mask], y[right_mask], depth + 1)

        return node

    def predict_one(self, x, node=None):
        """预测单个样本"""
        if node is None:
            node = self.tree

        if node['leaf']:
            return node['prediction']

        if x[node['feature']] <= node['threshold']:
            return self.predict_one(x, node['left'])
        else:
            return self.predict_one(x, node['right'])

    def predict(self, X):
        """预测多个样本"""
        return np.array([self.predict_one(x) for x in X])

# 使用示例
from sklearn.datasets import make_regression
from sklearn.metrics import mean_squared_error, r2_score

X_reg, y_reg = make_regression(n_samples=500, n_features=5, noise=10, random_state=42)

reg_tree = CARTRegressor(max_depth=5, min_samples_split=10)
reg_tree.fit(X_reg, y_reg)

predictions = reg_tree.predict(X_reg)
mse = mean_squared_error(y_reg, predictions)
r2 = r2_score(y_reg, predictions)

print(f"回归树 MSE: {mse:.4f}")
print(f"回归树 R2: {r2:.4f}")
```

---

## 特征重要性

决策树可以自然地度量特征的重要性，这是其可解释性强的重要原因之一。

### 基于不纯度减少的特征重要性

特征重要性定义为该特征在所有节点分裂中带来的不纯度减少的加权和：

$$Importance(f) = \sum_{t \in T_f} \frac{n_t}{n} \Delta i(t)$$

其中：
- $T_f$ 是使用特征 $f$ 进行分裂的所有节点
- $n_t$ 是节点 $t$ 的样本数
- $n$ 是总样本数
- $\Delta i(t)$ 是节点 $t$ 分裂带来的不纯度减少

```python
def compute_feature_importances(tree, n_samples, n_features):
    """计算特征重要性"""
    importances = np.zeros(n_features)

    def traverse(node, total_samples):
        if node['leaf']:
            return

        # 计算不纯度减少
        left = node['left']
        right = node['right']

        impurity_decrease = (
            node['n_samples'] / total_samples * node['gini'] -
            left['n_samples'] / total_samples * left['gini'] -
            right['n_samples'] / total_samples * right['gini']
        )

        importances[node['feature']] += impurity_decrease

        # 递归处理子节点
        traverse(left, total_samples)
        traverse(right, total_samples)

    traverse(tree, n_samples)

    # 归一化
    if importances.sum() > 0:
        importances /= importances.sum()

    return importances

# 使用Scikit-learn
from sklearn.tree import DecisionTreeClassifier
from sklearn.datasets import load_iris
import pandas as pd

iris = load_iris()
X, y = iris.data, iris.target
feature_names = iris.feature_names

clf = DecisionTreeClassifier(max_depth=4, random_state=42)
clf.fit(X, y)

# 获取特征重要性
importances = clf.feature_importances_

# 可视化
importance_df = pd.DataFrame({
    'feature': feature_names,
    'importance': importances
}).sort_values('importance', ascending=False)

print("特征重要性排序：")
print(importance_df)

# 绘制条形图
import matplotlib.pyplot as plt

plt.figure(figsize=(10, 6))
plt.barh(importance_df['feature'], importance_df['importance'])
plt.xlabel('特征重要性')
plt.title('决策树特征重要性')
plt.gca().invert_yaxis()
plt.tight_layout()
plt.show()
```

### 基于排列的特征重要性

排列重要性（Permutation Importance）通过打乱特征值来衡量模型性能的下降程度：

```python
from sklearn.inspection import permutation_importance

# 计算排列重要性
perm_importance = permutation_importance(clf, X, y, n_repeats=10, random_state=42)

# 可视化
sorted_idx = perm_importance.importances_mean.argsort()

fig, ax = plt.subplots(figsize=(10, 6))
ax.boxplot(perm_importance.importances[sorted_idx].T, vert=False,
           labels=np.array(feature_names)[sorted_idx])
ax.set_xlabel('排列重要性')
ax.set_title('基于排列的特征重要性')
plt.tight_layout()
plt.show()
```

---

## 决策树可视化

可视化决策树有助于理解模型的决策逻辑。

### 使用Scikit-learn可视化

```python
from sklearn.tree import plot_tree, export_text, export_graphviz
import matplotlib.pyplot as plt

# 方法1：使用plot_tree
fig, ax = plt.subplots(figsize=(20, 10))
plot_tree(clf,
          feature_names=feature_names,
          class_names=iris.target_names,
          filled=True,
          rounded=True,
          fontsize=10,
          ax=ax)
plt.title('决策树可视化')
plt.tight_layout()
plt.savefig('decision_tree.png', dpi=150, bbox_inches='tight')
plt.show()

# 方法2：导出文本规则
text_rules = export_text(clf, feature_names=feature_names)
print("决策规则：")
print(text_rules)

# 方法3：导出Graphviz格式
dot_data = export_graphviz(clf,
                           feature_names=feature_names,
                           class_names=iris.target_names,
                           filled=True,
                           rounded=True,
                           special_characters=True)

# 如果安装了graphviz，可以直接渲染
# import graphviz
# graph = graphviz.Source(dot_data)
# graph.render('decision_tree', format='png')
```

### 自定义可视化

```python
def print_tree_structure(node, feature_names, class_names=None, indent=""):
    """打印树结构的文本表示"""
    if node['leaf']:
        if class_names is not None:
            class_name = class_names[node['predicted_class']]
        else:
            class_name = node['predicted_class']
        print(f"{indent}=> 类别: {class_name} (样本数: {node['n_samples']})")
    else:
        feature_name = feature_names[node['feature']]
        threshold = node['threshold']

        print(f"{indent}[{feature_name} <= {threshold:.2f}]")
        print(f"{indent}|-- True:")
        print_tree_structure(node['left'], feature_names, class_names, indent + "|   ")
        print(f"{indent}|-- False:")
        print_tree_structure(node['right'], feature_names, class_names, indent + "    ")

# 决策边界可视化（2D特征）
def plot_decision_boundary(clf, X, y, feature_names, class_names):
    """绘制决策边界"""
    h = 0.02  # 网格步长

    x_min, x_max = X[:, 0].min() - 1, X[:, 0].max() + 1
    y_min, y_max = X[:, 1].min() - 1, X[:, 1].max() + 1

    xx, yy = np.meshgrid(np.arange(x_min, x_max, h),
                         np.arange(y_min, y_max, h))

    Z = clf.predict(np.c_[xx.ravel(), yy.ravel()])
    Z = Z.reshape(xx.shape)

    plt.figure(figsize=(10, 8))
    plt.contourf(xx, yy, Z, alpha=0.4, cmap=plt.cm.RdYlBu)

    scatter = plt.scatter(X[:, 0], X[:, 1], c=y, cmap=plt.cm.RdYlBu, edgecolors='black')

    plt.xlabel(feature_names[0])
    plt.ylabel(feature_names[1])
    plt.title('决策树决策边界')
    plt.colorbar(scatter)
    plt.tight_layout()
    plt.show()

# 示例：使用iris数据集的前两个特征
X_2d = iris.data[:, :2]
clf_2d = DecisionTreeClassifier(max_depth=4, random_state=42)
clf_2d.fit(X_2d, y)

plot_decision_boundary(clf_2d, X_2d, y, feature_names[:2], iris.target_names)
```

---

## Scikit-learn实现

### 分类任务完整示例

```python
import numpy as np
import pandas as pd
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

# 加载数据
data = load_breast_cancer()
X, y = data.data, data.target
feature_names = data.feature_names

print(f"数据集形状: {X.shape}")
print(f"类别分布: {np.bincount(y)}")

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 基础决策树
basic_tree = DecisionTreeClassifier(random_state=42)
basic_tree.fit(X_train, y_train)

print("\n=== 基础决策树（无剪枝）===")
print(f"训练集准确率: {basic_tree.score(X_train, y_train):.4f}")
print(f"测试集准确率: {basic_tree.score(X_test, y_test):.4f}")
print(f"树深度: {basic_tree.get_depth()}")
print(f"叶节点数: {basic_tree.get_n_leaves()}")

# 带预剪枝的决策树
pruned_tree = DecisionTreeClassifier(
    max_depth=5,
    min_samples_split=20,
    min_samples_leaf=5,
    random_state=42
)
pruned_tree.fit(X_train, y_train)

print("\n=== 预剪枝决策树 ===")
print(f"训练集准确率: {pruned_tree.score(X_train, y_train):.4f}")
print(f"测试集准确率: {pruned_tree.score(X_test, y_test):.4f}")
print(f"树深度: {pruned_tree.get_depth()}")
print(f"叶节点数: {pruned_tree.get_n_leaves()}")

# 使用交叉验证进行超参数调优
param_grid = {
    'max_depth': [3, 5, 7, 10, None],
    'min_samples_split': [2, 5, 10, 20],
    'min_samples_leaf': [1, 2, 5, 10],
    'criterion': ['gini', 'entropy']
}

grid_search = GridSearchCV(
    DecisionTreeClassifier(random_state=42),
    param_grid,
    cv=5,
    scoring='accuracy',
    n_jobs=-1
)
grid_search.fit(X_train, y_train)

print("\n=== 网格搜索最佳参数 ===")
print(f"最佳参数: {grid_search.best_params_}")
print(f"最佳交叉验证得分: {grid_search.best_score_:.4f}")

best_tree = grid_search.best_estimator_
print(f"测试集准确率: {best_tree.score(X_test, y_test):.4f}")

# 代价复杂度剪枝
path = basic_tree.cost_complexity_pruning_path(X_train, y_train)
ccp_alphas = path.ccp_alphas

# 训练不同alpha的树
train_scores = []
test_scores = []
depths = []
n_leaves = []

for alpha in ccp_alphas:
    tree = DecisionTreeClassifier(ccp_alpha=alpha, random_state=42)
    tree.fit(X_train, y_train)
    train_scores.append(tree.score(X_train, y_train))
    test_scores.append(tree.score(X_test, y_test))
    depths.append(tree.get_depth())
    n_leaves.append(tree.get_n_leaves())

# 可视化
fig, axes = plt.subplots(2, 2, figsize=(14, 10))

# 准确率vs alpha
axes[0, 0].plot(ccp_alphas, train_scores, label='训练集')
axes[0, 0].plot(ccp_alphas, test_scores, label='测试集')
axes[0, 0].set_xlabel('Alpha')
axes[0, 0].set_ylabel('准确率')
axes[0, 0].set_title('代价复杂度剪枝：准确率')
axes[0, 0].legend()

# 树深度vs alpha
axes[0, 1].plot(ccp_alphas, depths)
axes[0, 1].set_xlabel('Alpha')
axes[0, 1].set_ylabel('树深度')
axes[0, 1].set_title('代价复杂度剪枝：树深度')

# 叶节点数vs alpha
axes[1, 0].plot(ccp_alphas, n_leaves)
axes[1, 0].set_xlabel('Alpha')
axes[1, 0].set_ylabel('叶节点数')
axes[1, 0].set_title('代价复杂度剪枝：叶节点数')

# 特征重要性
importance_df = pd.DataFrame({
    'feature': feature_names,
    'importance': best_tree.feature_importances_
}).sort_values('importance', ascending=True).tail(15)

axes[1, 1].barh(importance_df['feature'], importance_df['importance'])
axes[1, 1].set_xlabel('特征重要性')
axes[1, 1].set_title('Top 15 特征重要性')

plt.tight_layout()
plt.savefig('decision_tree_analysis.png', dpi=150)
plt.show()

# 最终模型评估
y_pred = best_tree.predict(X_test)
y_proba = best_tree.predict_proba(X_test)

print("\n=== 最终模型评估 ===")
print(classification_report(y_test, y_pred, target_names=data.target_names))

# 混淆矩阵
plt.figure(figsize=(8, 6))
cm = confusion_matrix(y_test, y_pred)
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=data.target_names,
            yticklabels=data.target_names)
plt.xlabel('预测标签')
plt.ylabel('真实标签')
plt.title('混淆矩阵')
plt.tight_layout()
plt.show()
```

### 回归任务完整示例

```python
from sklearn.datasets import fetch_california_housing
from sklearn.tree import DecisionTreeRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

# 加载数据
housing = fetch_california_housing()
X, y = housing.data, housing.target
feature_names = housing.feature_names

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 训练回归树
reg_tree = DecisionTreeRegressor(
    max_depth=10,
    min_samples_split=20,
    min_samples_leaf=10,
    random_state=42
)
reg_tree.fit(X_train, y_train)

# 预测
y_pred_train = reg_tree.predict(X_train)
y_pred_test = reg_tree.predict(X_test)

# 评估
print("=== 回归树评估 ===")
print(f"训练集 MSE: {mean_squared_error(y_train, y_pred_train):.4f}")
print(f"测试集 MSE: {mean_squared_error(y_test, y_pred_test):.4f}")
print(f"训练集 MAE: {mean_absolute_error(y_train, y_pred_train):.4f}")
print(f"测试集 MAE: {mean_absolute_error(y_test, y_pred_test):.4f}")
print(f"训练集 R2: {r2_score(y_train, y_pred_train):.4f}")
print(f"测试集 R2: {r2_score(y_test, y_pred_test):.4f}")

# 特征重要性
importance_df = pd.DataFrame({
    'feature': feature_names,
    'importance': reg_tree.feature_importances_
}).sort_values('importance', ascending=False)

print("\n特征重要性：")
print(importance_df)

# 可视化预测vs真实值
plt.figure(figsize=(10, 6))
plt.scatter(y_test, y_pred_test, alpha=0.5)
plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', lw=2)
plt.xlabel('真实值')
plt.ylabel('预测值')
plt.title('回归树预测结果')
plt.tight_layout()
plt.show()

# 残差分析
residuals = y_test - y_pred_test

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# 残差直方图
axes[0].hist(residuals, bins=50, edgecolor='black')
axes[0].axvline(x=0, color='r', linestyle='--')
axes[0].set_xlabel('残差')
axes[0].set_ylabel('频数')
axes[0].set_title('残差分布')

# 残差vs预测值
axes[1].scatter(y_pred_test, residuals, alpha=0.5)
axes[1].axhline(y=0, color='r', linestyle='--')
axes[1].set_xlabel('预测值')
axes[1].set_ylabel('残差')
axes[1].set_title('残差 vs 预测值')

plt.tight_layout()
plt.show()
```

### 与其他模型的比较

```python
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import time

# 定义模型
models = {
    '决策树': DecisionTreeClassifier(max_depth=5, random_state=42),
    '随机森林': RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42),
    '梯度提升': GradientBoostingClassifier(n_estimators=100, max_depth=3, random_state=42),
    '逻辑回归': Pipeline([
        ('scaler', StandardScaler()),
        ('clf', LogisticRegression(max_iter=1000, random_state=42))
    ]),
    'SVM': Pipeline([
        ('scaler', StandardScaler()),
        ('clf', SVC(kernel='rbf', random_state=42))
    ]),
    'KNN': Pipeline([
        ('scaler', StandardScaler()),
        ('clf', KNeighborsClassifier(n_neighbors=5))
    ]),
    '朴素贝叶斯': GaussianNB()
}

# 比较各模型
results = []

for name, model in models.items():
    start_time = time.time()

    # 训练
    model.fit(X_train, y_train)
    train_time = time.time() - start_time

    # 预测
    start_time = time.time()
    y_pred = model.predict(X_test)
    predict_time = time.time() - start_time

    # 评估
    train_acc = model.score(X_train, y_train)
    test_acc = model.score(X_test, y_test)

    # 交叉验证
    cv_scores = cross_val_score(model, X_train, y_train, cv=5)

    results.append({
        '模型': name,
        '训练准确率': train_acc,
        '测试准确率': test_acc,
        'CV平均': cv_scores.mean(),
        'CV标准差': cv_scores.std(),
        '训练时间(s)': train_time,
        '预测时间(s)': predict_time
    })

results_df = pd.DataFrame(results)
results_df = results_df.sort_values('测试准确率', ascending=False)

print("\n=== 模型比较 ===")
print(results_df.to_string(index=False))

# 可视化比较
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# 准确率比较
x = np.arange(len(results_df))
width = 0.35

axes[0].bar(x - width/2, results_df['训练准确率'], width, label='训练集')
axes[0].bar(x + width/2, results_df['测试准确率'], width, label='测试集')
axes[0].set_xlabel('模型')
axes[0].set_ylabel('准确率')
axes[0].set_title('模型准确率比较')
axes[0].set_xticks(x)
axes[0].set_xticklabels(results_df['模型'], rotation=45, ha='right')
axes[0].legend()

# 训练时间比较
axes[1].barh(results_df['模型'], results_df['训练时间(s)'])
axes[1].set_xlabel('训练时间 (秒)')
axes[1].set_title('模型训练时间比较')

plt.tight_layout()
plt.show()
```

---

## 面试要点

### 常见面试问题

**Q1: 决策树如何处理连续特征？**

决策树通过寻找最优切分点将连续特征离散化。对于每个连续特征，算法会遍历所有可能的切分点（通常是相邻值的中点），计算每个切分点的不纯度减少，选择最优的切分点。

```python
# 连续特征处理示例
def find_best_split_continuous(X, y, feature_idx):
    """寻找连续特征的最佳切分点"""
    values = np.sort(np.unique(X[:, feature_idx]))
    thresholds = (values[:-1] + values[1:]) / 2

    best_gini = float('inf')
    best_threshold = None

    for threshold in thresholds:
        left_mask = X[:, feature_idx] <= threshold
        gini = gini_split(y[left_mask], y[~left_mask])
        if gini < best_gini:
            best_gini = gini
            best_threshold = threshold

    return best_threshold, best_gini
```

**Q2: 信息增益和基尼系数有什么区别？**

| 特性 | 信息增益 | 基尼系数 |
|------|---------|---------|
| 数学基础 | 信息论（熵） | 概率统计 |
| 计算复杂度 | 需要对数运算，稍慢 | 只需平方运算，更快 |
| 偏好 | 偏向多值特征 | 较为平衡 |
| 使用算法 | ID3, C4.5 | CART |

在实践中，两者效果通常相似，选择基尼系数更为常见。

**Q3: 如何防止决策树过拟合？**

1. **预剪枝**：
   - 限制最大深度（max_depth）
   - 设置最小分裂样本数（min_samples_split）
   - 设置叶节点最小样本数（min_samples_leaf）
   - 限制最大叶节点数（max_leaf_nodes）

2. **后剪枝**：
   - 代价复杂度剪枝（ccp_alpha）
   - 降低错误剪枝

3. **其他方法**：
   - 使用集成方法（随机森林、梯度提升）
   - 交叉验证选择超参数

**Q4: 决策树的特征重要性是如何计算的？**

基于不纯度减少的特征重要性计算：

$$Importance(f) = \sum_{t: split\ on\ f} \frac{n_t}{N} (impurity_t - \frac{n_{left}}{n_t}impurity_{left} - \frac{n_{right}}{n_t}impurity_{right})$$

所有特征的重要性归一化后总和为1。

**Q5: ID3、C4.5和CART的主要区别？**

| 特性 | ID3 | C4.5 | CART |
|------|-----|------|------|
| 特征选择准则 | 信息增益 | 增益率 | 基尼系数 |
| 树结构 | 多叉树 | 多叉树 | 二叉树 |
| 连续特征 | 不支持 | 支持 | 支持 |
| 缺失值处理 | 不支持 | 支持 | 支持 |
| 剪枝方法 | 无 | 悲观剪枝 | 代价复杂度剪枝 |
| 任务类型 | 分类 | 分类 | 分类+回归 |

**Q6: 决策树与随机森林的关系？**

随机森林是决策树的集成方法：
- 使用Bagging思想：对训练数据进行有放回采样
- 特征随机性：每次分裂时只考虑随机子集的特征
- 最终预测：多棵树投票（分类）或取平均（回归）

随机森林通过引入随机性降低方差，提高泛化能力，但牺牲了可解释性。

### 代码实现题

**题目：手写信息增益计算**

```python
def information_gain(X, y, feature_idx):
    """
    计算特征的信息增益

    Parameters:
    -----------
    X : array-like, shape (n_samples, n_features)
        特征矩阵
    y : array-like, shape (n_samples,)
        标签向量
    feature_idx : int
        特征索引

    Returns:
    --------
    float : 信息增益值
    """
    # 计算父节点熵
    def entropy(labels):
        if len(labels) == 0:
            return 0
        probs = np.bincount(labels) / len(labels)
        probs = probs[probs > 0]
        return -np.sum(probs * np.log2(probs))

    parent_entropy = entropy(y)

    # 计算加权子节点熵
    values = np.unique(X[:, feature_idx])
    weighted_entropy = 0

    for value in values:
        mask = X[:, feature_idx] == value
        weight = mask.sum() / len(y)
        weighted_entropy += weight * entropy(y[mask])

    return parent_entropy - weighted_entropy
```

---

## 延伸阅读

### 推荐书籍

- **《机器学习》（周志华）**：第4章详细讲解决策树，包括ID3、C4.5、CART和剪枝
- **《统计学习方法》（李航）**：第5章决策树，理论严谨
- **《The Elements of Statistical Learning》**：第9章树模型，深入数学推导

### 进阶主题

1. **集成方法**：
   - 随机森林（Random Forest）
   - 梯度提升树（GBDT）
   - XGBoost、LightGBM、CatBoost

2. **决策树变体**：
   - 模糊决策树
   - 增量决策树
   - 多输出决策树

3. **可解释性方法**：
   - LIME（Local Interpretable Model-agnostic Explanations）
   - SHAP（SHapley Additive exPlanations）

4. **规则提取**：
   - 从决策树提取规则
   - 规则集学习

### 工业应用场景

1. **金融风控**：信用评分、欺诈检测
2. **医疗诊断**：疾病预测、风险评估
3. **推荐系统**：用户画像、行为分析
4. **营销分析**：客户分群、流失预测

---

## 总结

决策树是机器学习中最基础且最重要的算法之一，具有以下核心要点：

1. **算法理解**：
   - 掌握信息增益、增益率、基尼系数的计算方法
   - 理解ID3、C4.5、CART三种算法的区别
   - 熟悉预剪枝和后剪枝的策略

2. **实践技巧**：
   - 使用交叉验证选择超参数
   - 关注特征重要性进行特征选择
   - 可视化决策树辅助模型解释

3. **应用场景**：
   - 需要可解释性的场景优先考虑决策树
   - 追求性能时使用集成方法
   - 结合业务需求选择合适的剪枝策略

决策树的学习为理解更复杂的集成方法（随机森林、GBDT等）奠定了基础。建议在掌握单棵决策树后，继续学习集成学习方法，以在实际项目中获得更好的效果。
