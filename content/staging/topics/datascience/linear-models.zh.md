---
title: 经典机器学习：线性模型
description: 深入理解线性回归、逻辑回归和正则化方法(L1/L2)
track: datascience
section: classical-ml
difficulty: intermediate
tags:
  - 线性回归
  - 逻辑回归
  - 正则化
  - 机器学习
status: imported
origin: old/src/content/docs/datascience/linear-models.zh.md
divergence: 0.261
issues: []
legacy:
  category: DataScience
  subcategory: ClassicalML
  order: 11
  lastUpdated: 2026-01-07
---

线性模型是机器学习中最基础也最重要的模型家族。尽管结构简单，线性模型因其可解释性强、训练效率高、理论基础扎实，至今仍在工业界广泛应用。本文将深入介绍线性回归、逻辑回归以及各种正则化方法，帮助读者建立完整的线性模型知识体系。

---

## 线性回归原理

### 基本概念

线性回归（Linear Regression）是最经典的回归算法，用于预测连续型目标变量。其核心假设是：目标变量 $y$ 与特征 $x$ 之间存在线性关系。

**数学表达式：**

对于单变量线性回归：

$$y = w_0 + w_1 x + \epsilon$$

对于多变量线性回归（$n$ 个特征）：

$$y = w_0 + w_1 x_1 + w_2 x_2 + \cdots + w_n x_n + \epsilon = \mathbf{w}^T \mathbf{x} + \epsilon$$

其中：
- $\mathbf{w} = [w_0, w_1, \ldots, w_n]^T$ 是权重向量（包含偏置项）
- $\mathbf{x} = [1, x_1, x_2, \ldots, x_n]^T$ 是特征向量（添加常数1以包含偏置）
- $\epsilon$ 是误差项，假设服从均值为0的正态分布

### 线性回归的假设

线性回归的有效性依赖于以下假设：

| 假设 | 说明 | 违反后果 |
|------|------|----------|
| 线性性 | 特征与目标之间存在线性关系 | 模型欠拟合 |
| 独立性 | 样本之间相互独立 | 估计值偏差 |
| 同方差性 | 误差项方差恒定 | 置信区间不准确 |
| 正态性 | 误差项服从正态分布 | 假设检验失效 |
| 无多重共线性 | 特征之间不存在高度相关 | 系数不稳定 |

### 向量化表示

在实际计算中，我们使用矩阵形式表示线性回归：

$$\mathbf{y} = \mathbf{X}\mathbf{w} + \boldsymbol{\epsilon}$$

其中：
- $\mathbf{X} \in \mathbb{R}^{m \times (n+1)}$ 是设计矩阵（$m$ 个样本，$n+1$ 个特征包括偏置项）
- $\mathbf{y} \in \mathbb{R}^{m}$ 是目标向量
- $\mathbf{w} \in \mathbb{R}^{n+1}$ 是权重向量

```python
import numpy as np

class LinearRegressionFromScratch:
    """从零实现线性回归"""

    def __init__(self):
        self.weights = None

    def _add_bias(self, X):
        """添加偏置项（截距）"""
        m = X.shape[0]
        return np.hstack([np.ones((m, 1)), X])

    def predict(self, X):
        """预测"""
        X_with_bias = self._add_bias(X)
        return X_with_bias @ self.weights

    def score(self, X, y):
        """计算R^2分数"""
        y_pred = self.predict(X)
        ss_res = np.sum((y - y_pred) ** 2)
        ss_tot = np.sum((y - np.mean(y)) ** 2)
        return 1 - (ss_res / ss_tot)
```

---

## 最小二乘法

### 损失函数

线性回归使用均方误差（Mean Squared Error, MSE）作为损失函数：

$$J(\mathbf{w}) = \frac{1}{2m} \sum_{i=1}^{m} (h_\mathbf{w}(\mathbf{x}^{(i)}) - y^{(i)})^2 = \frac{1}{2m} \|\mathbf{X}\mathbf{w} - \mathbf{y}\|_2^2$$

其中 $h_\mathbf{w}(\mathbf{x}) = \mathbf{w}^T\mathbf{x}$ 是预测函数。

### 正规方程（Normal Equation）

通过对损失函数求导并令导数为零，可以直接得到最优解：

$$\frac{\partial J}{\partial \mathbf{w}} = \frac{1}{m} \mathbf{X}^T(\mathbf{X}\mathbf{w} - \mathbf{y}) = 0$$

求解得到正规方程：

$$\mathbf{w}^* = (\mathbf{X}^T\mathbf{X})^{-1}\mathbf{X}^T\mathbf{y}$$

这个公式直接给出了线性回归的解析解。

**正规方程的优缺点：**

| 优点 | 缺点 |
|------|------|
| 直接求得最优解 | 需要计算矩阵逆，复杂度 $O(n^3)$ |
| 不需要选择学习率 | 当特征数 $n$ 很大时计算慢 |
| 不需要迭代 | $\mathbf{X}^T\mathbf{X}$ 可能不可逆 |

```python
class LinearRegressionNormalEquation(LinearRegressionFromScratch):
    """使用正规方程求解线性回归"""

    def fit(self, X, y):
        """训练模型"""
        X_with_bias = self._add_bias(X)

        # 正规方程：w = (X^T X)^(-1) X^T y
        # 使用伪逆以处理不可逆情况
        self.weights = np.linalg.pinv(X_with_bias.T @ X_with_bias) @ X_with_bias.T @ y

        return self

# 示例使用
np.random.seed(42)
X = np.random.randn(100, 3)
y = 2 + 3 * X[:, 0] - 1.5 * X[:, 1] + 0.5 * X[:, 2] + np.random.randn(100) * 0.5

model = LinearRegressionNormalEquation()
model.fit(X, y)

print(f"学习到的权重: {model.weights}")
print(f"R^2 分数: {model.score(X, y):.4f}")
```

### 正规方程的数值稳定性

当 $\mathbf{X}^T\mathbf{X}$ 接近奇异时（特征高度共线性），直接求逆可能导致数值不稳定。更稳定的方法是使用奇异值分解（SVD）或QR分解：

```python
class LinearRegressionSVD(LinearRegressionFromScratch):
    """使用SVD求解线性回归（更稳定）"""

    def fit(self, X, y):
        """使用SVD分解求解"""
        X_with_bias = self._add_bias(X)

        # SVD分解：X = U @ S @ Vt
        U, S, Vt = np.linalg.svd(X_with_bias, full_matrices=False)

        # 计算伪逆：X^+ = V @ S^(-1) @ U^T
        # 处理接近零的奇异值
        S_inv = np.zeros_like(S)
        threshold = 1e-10 * S[0]  # 相对阈值
        non_zero = S > threshold
        S_inv[non_zero] = 1.0 / S[non_zero]

        self.weights = Vt.T @ np.diag(S_inv) @ U.T @ y

        return self
```

---

## 梯度下降求解

当特征维度很高或数据量很大时，使用梯度下降法更为高效。

### 批量梯度下降（Batch Gradient Descent）

损失函数对权重的梯度：

$$\nabla_\mathbf{w} J(\mathbf{w}) = \frac{1}{m} \mathbf{X}^T(\mathbf{X}\mathbf{w} - \mathbf{y})$$

权重更新规则：

$$\mathbf{w} := \mathbf{w} - \alpha \nabla_\mathbf{w} J(\mathbf{w})$$

其中 $\alpha$ 是学习率。

```python
class LinearRegressionGD(LinearRegressionFromScratch):
    """使用批量梯度下降求解线性回归"""

    def fit(self, X, y, learning_rate=0.01, n_iterations=1000, tol=1e-6, verbose=False):
        """
        训练模型

        参数:
            X: 特征矩阵
            y: 目标向量
            learning_rate: 学习率
            n_iterations: 最大迭代次数
            tol: 收敛阈值
            verbose: 是否打印训练过程
        """
        X_with_bias = self._add_bias(X)
        m, n = X_with_bias.shape

        # 初始化权重
        self.weights = np.zeros(n)
        self.loss_history = []

        for iteration in range(n_iterations):
            # 计算预测值
            y_pred = X_with_bias @ self.weights

            # 计算损失
            loss = np.mean((y_pred - y) ** 2) / 2
            self.loss_history.append(loss)

            # 计算梯度
            gradient = (1 / m) * X_with_bias.T @ (y_pred - y)

            # 更新权重
            self.weights -= learning_rate * gradient

            # 检查收敛
            if len(self.loss_history) > 1 and abs(self.loss_history[-2] - self.loss_history[-1]) < tol:
                if verbose:
                    print(f"收敛于第 {iteration} 次迭代")
                break

            if verbose and iteration % 100 == 0:
                print(f"迭代 {iteration}: 损失 = {loss:.6f}")

        return self

# 示例
model_gd = LinearRegressionGD()
model_gd.fit(X, y, learning_rate=0.1, n_iterations=1000, verbose=True)
print(f"梯度下降得到的权重: {model_gd.weights}")
```

### 随机梯度下降（Stochastic Gradient Descent）

批量梯度下降每次迭代需要计算所有样本的梯度，计算量大。随机梯度下降（SGD）每次只使用一个样本更新权重：

$$\mathbf{w} := \mathbf{w} - \alpha (h_\mathbf{w}(\mathbf{x}^{(i)}) - y^{(i)}) \mathbf{x}^{(i)}$$

```python
class LinearRegressionSGD(LinearRegressionFromScratch):
    """使用随机梯度下降求解线性回归"""

    def fit(self, X, y, learning_rate=0.01, n_epochs=100, batch_size=1,
            learning_rate_schedule='constant', verbose=False):
        """
        训练模型

        参数:
            batch_size: 批量大小（1为SGD，大于1为Mini-batch GD）
            learning_rate_schedule: 学习率调度策略
        """
        X_with_bias = self._add_bias(X)
        m, n = X_with_bias.shape

        # 初始化权重
        self.weights = np.random.randn(n) * 0.01
        self.loss_history = []

        for epoch in range(n_epochs):
            # 打乱数据
            indices = np.random.permutation(m)
            X_shuffled = X_with_bias[indices]
            y_shuffled = y[indices]

            epoch_loss = 0

            # Mini-batch 迭代
            for i in range(0, m, batch_size):
                X_batch = X_shuffled[i:i+batch_size]
                y_batch = y_shuffled[i:i+batch_size]

                # 计算预测值和梯度
                y_pred = X_batch @ self.weights
                gradient = (1 / len(y_batch)) * X_batch.T @ (y_pred - y_batch)

                # 学习率调度
                if learning_rate_schedule == 'constant':
                    lr = learning_rate
                elif learning_rate_schedule == 'inverse':
                    lr = learning_rate / (1 + epoch)
                elif learning_rate_schedule == 'sqrt':
                    lr = learning_rate / np.sqrt(1 + epoch)

                # 更新权重
                self.weights -= lr * gradient

                epoch_loss += np.mean((y_pred - y_batch) ** 2) / 2

            self.loss_history.append(epoch_loss / (m // batch_size))

            if verbose and epoch % 10 == 0:
                print(f"Epoch {epoch}: 损失 = {self.loss_history[-1]:.6f}")

        return self
```

### 梯度下降变体对比

| 方法 | 每次迭代使用样本数 | 优点 | 缺点 |
|------|-------------------|------|------|
| 批量GD | 全部 | 稳定收敛 | 计算慢，内存占用大 |
| 随机GD | 1 | 计算快，能跳出局部最优 | 震荡大，难收敛 |
| Mini-batch GD | 部分（如32/64） | 平衡速度和稳定性 | 需要选择batch size |

### 学习率的影响

学习率是梯度下降中最重要的超参数：

- **学习率过大**：可能导致损失震荡甚至发散
- **学习率过小**：收敛速度慢，可能陷入局部最优
- **合适的学习率**：损失平滑下降并收敛

```python
import matplotlib.pyplot as plt

def visualize_learning_rates(X, y, learning_rates=[0.001, 0.01, 0.1, 1.0]):
    """可视化不同学习率的影响"""
    plt.figure(figsize=(12, 4))

    for lr in learning_rates:
        model = LinearRegressionGD()
        model.fit(X, y, learning_rate=lr, n_iterations=500, verbose=False)
        plt.plot(model.loss_history, label=f'lr={lr}')

    plt.xlabel('迭代次数')
    plt.ylabel('损失')
    plt.title('不同学习率的收敛曲线')
    plt.legend()
    plt.yscale('log')
    plt.grid(True)
    plt.show()
```

---

## 逻辑回归

### 从回归到分类

虽然名字中包含"回归"，但逻辑回归（Logistic Regression）实际上是一种分类算法。它通过引入Sigmoid函数将线性回归的输出映射到概率区间 $[0, 1]$。

**核心思想**：预测样本属于正类的概率。

$$P(y=1|\mathbf{x}) = \sigma(\mathbf{w}^T\mathbf{x}) = \frac{1}{1 + e^{-\mathbf{w}^T\mathbf{x}}}$$

### 决策边界

逻辑回归的决策边界是一个超平面：

- 当 $P(y=1|\mathbf{x}) \geq 0.5$ 时，预测为正类
- 当 $P(y=1|\mathbf{x}) < 0.5$ 时，预测为负类

决策边界方程：$\mathbf{w}^T\mathbf{x} = 0$

```python
import numpy as np
import matplotlib.pyplot as plt

def plot_decision_boundary(X, y, model, title="决策边界"):
    """绘制二维数据的决策边界"""
    h = 0.02  # 网格步长

    x_min, x_max = X[:, 0].min() - 1, X[:, 0].max() + 1
    y_min, y_max = X[:, 1].min() - 1, X[:, 1].max() + 1

    xx, yy = np.meshgrid(np.arange(x_min, x_max, h),
                         np.arange(y_min, y_max, h))

    Z = model.predict(np.c_[xx.ravel(), yy.ravel()])
    Z = Z.reshape(xx.shape)

    plt.figure(figsize=(10, 6))
    plt.contourf(xx, yy, Z, alpha=0.4, cmap='RdYlBu')
    plt.scatter(X[:, 0], X[:, 1], c=y, cmap='RdYlBu', edgecolors='black')
    plt.xlabel('特征1')
    plt.ylabel('特征2')
    plt.title(title)
    plt.colorbar(label='预测概率')
    plt.show()
```

---

## Sigmoid函数

### 定义与性质

Sigmoid函数（又称逻辑函数）是逻辑回归的核心：

$$\sigma(z) = \frac{1}{1 + e^{-z}}$$

**重要性质：**

1. **值域**：$(0, 1)$，适合表示概率
2. **对称性**：$\sigma(-z) = 1 - \sigma(z)$
3. **导数**：$\sigma'(z) = \sigma(z)(1 - \sigma(z))$
4. **单调递增**：$z$ 越大，$\sigma(z)$ 越接近1

```python
import numpy as np
import matplotlib.pyplot as plt

def sigmoid(z):
    """Sigmoid函数"""
    return 1 / (1 + np.exp(-z))

def sigmoid_derivative(z):
    """Sigmoid函数的导数"""
    s = sigmoid(z)
    return s * (1 - s)

# 可视化Sigmoid函数
z = np.linspace(-10, 10, 100)

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Sigmoid函数
axes[0].plot(z, sigmoid(z), 'b-', linewidth=2)
axes[0].axhline(y=0.5, color='r', linestyle='--', alpha=0.5)
axes[0].axvline(x=0, color='r', linestyle='--', alpha=0.5)
axes[0].set_xlabel('z')
axes[0].set_ylabel('sigma(z)')
axes[0].set_title('Sigmoid函数')
axes[0].grid(True)

# Sigmoid导数
axes[1].plot(z, sigmoid_derivative(z), 'g-', linewidth=2)
axes[1].set_xlabel('z')
axes[1].set_ylabel("sigma'(z)")
axes[1].set_title('Sigmoid函数的导数')
axes[1].grid(True)

plt.tight_layout()
plt.show()
```

### 数值稳定的实现

直接计算 $e^{-z}$ 当 $z$ 是很大的负数时可能导致数值溢出。更稳定的实现：

```python
def stable_sigmoid(z):
    """数值稳定的Sigmoid实现"""
    positive_mask = z >= 0
    negative_mask = ~positive_mask

    result = np.zeros_like(z, dtype=float)

    # 对于正数：直接计算
    result[positive_mask] = 1 / (1 + np.exp(-z[positive_mask]))

    # 对于负数：使用等价形式避免exp爆炸
    exp_z = np.exp(z[negative_mask])
    result[negative_mask] = exp_z / (1 + exp_z)

    return result
```

---

## 逻辑回归的损失函数

### 交叉熵损失（Cross-Entropy Loss）

线性回归使用MSE作为损失函数，但对于逻辑回归，MSE会导致非凸优化问题。因此使用交叉熵损失（也称对数损失）：

对于单个样本：

$$L(y, \hat{y}) = -[y \log(\hat{y}) + (1-y) \log(1-\hat{y})]$$

对于整个数据集：

$$J(\mathbf{w}) = -\frac{1}{m} \sum_{i=1}^{m} [y^{(i)} \log(\hat{y}^{(i)}) + (1-y^{(i)}) \log(1-\hat{y}^{(i)})]$$

其中 $\hat{y}^{(i)} = \sigma(\mathbf{w}^T\mathbf{x}^{(i)})$。

### 最大似然解释

交叉熵损失可以从最大似然估计的角度推导。假设 $y \sim \text{Bernoulli}(p)$，其中 $p = \sigma(\mathbf{w}^T\mathbf{x})$：

$$P(y|\mathbf{x}; \mathbf{w}) = \hat{y}^y (1-\hat{y})^{1-y}$$

对数似然：

$$\log L(\mathbf{w}) = \sum_{i=1}^{m} [y^{(i)} \log(\hat{y}^{(i)}) + (1-y^{(i)}) \log(1-\hat{y}^{(i)})]$$

最大化对数似然等价于最小化交叉熵损失。

### 梯度计算

交叉熵损失对权重的梯度形式非常简洁：

$$\frac{\partial J}{\partial \mathbf{w}} = \frac{1}{m} \mathbf{X}^T(\hat{\mathbf{y}} - \mathbf{y}) = \frac{1}{m} \mathbf{X}^T(\sigma(\mathbf{X}\mathbf{w}) - \mathbf{y})$$

这与线性回归的梯度形式相同，只是预测值从 $\mathbf{X}\mathbf{w}$ 变成了 $\sigma(\mathbf{X}\mathbf{w})$。

```python
class LogisticRegression:
    """从零实现逻辑回归"""

    def __init__(self):
        self.weights = None
        self.loss_history = []

    def _add_bias(self, X):
        """添加偏置项"""
        return np.hstack([np.ones((X.shape[0], 1)), X])

    def _sigmoid(self, z):
        """数值稳定的Sigmoid"""
        return np.where(z >= 0,
                       1 / (1 + np.exp(-z)),
                       np.exp(z) / (1 + np.exp(z)))

    def _compute_loss(self, y, y_pred):
        """计算交叉熵损失"""
        epsilon = 1e-15  # 防止log(0)
        y_pred = np.clip(y_pred, epsilon, 1 - epsilon)
        return -np.mean(y * np.log(y_pred) + (1 - y) * np.log(1 - y_pred))

    def fit(self, X, y, learning_rate=0.01, n_iterations=1000, verbose=False):
        """训练模型"""
        X_with_bias = self._add_bias(X)
        m, n = X_with_bias.shape

        # 初始化权重
        self.weights = np.zeros(n)

        for iteration in range(n_iterations):
            # 前向传播
            z = X_with_bias @ self.weights
            y_pred = self._sigmoid(z)

            # 计算损失
            loss = self._compute_loss(y, y_pred)
            self.loss_history.append(loss)

            # 计算梯度
            gradient = (1 / m) * X_with_bias.T @ (y_pred - y)

            # 更新权重
            self.weights -= learning_rate * gradient

            if verbose and iteration % 100 == 0:
                print(f"迭代 {iteration}: 损失 = {loss:.6f}")

        return self

    def predict_proba(self, X):
        """预测概率"""
        X_with_bias = self._add_bias(X)
        return self._sigmoid(X_with_bias @ self.weights)

    def predict(self, X, threshold=0.5):
        """预测类别"""
        return (self.predict_proba(X) >= threshold).astype(int)

    def score(self, X, y):
        """计算准确率"""
        return np.mean(self.predict(X) == y)

# 示例：使用逻辑回归
from sklearn.datasets import make_classification

X, y = make_classification(n_samples=500, n_features=2, n_redundant=0,
                           n_informative=2, random_state=42, n_clusters_per_class=1)

model = LogisticRegression()
model.fit(X, y, learning_rate=0.1, n_iterations=1000, verbose=True)
print(f"训练准确率: {model.score(X, y):.4f}")
```

---

## L1/L2正则化

### 过拟合问题

当模型过于复杂或特征维度过高时，模型可能会过拟合训练数据。正则化是解决过拟合的重要手段。

### L2正则化（Ridge）

L2正则化在损失函数中添加权重的平方和惩罚项：

$$J_{L2}(\mathbf{w}) = J(\mathbf{w}) + \frac{\lambda}{2m} \sum_{j=1}^{n} w_j^2 = J(\mathbf{w}) + \frac{\lambda}{2m} \|\mathbf{w}\|_2^2$$

**特点：**
- 使权重趋向于较小的值，但不会变为0
- 解决多重共线性问题
- 也称为权重衰减（Weight Decay）

**梯度更新：**

$$\mathbf{w} := \mathbf{w}(1 - \frac{\alpha\lambda}{m}) - \alpha \nabla_\mathbf{w} J(\mathbf{w})$$

### L1正则化（Lasso）

L1正则化在损失函数中添加权重的绝对值和惩罚项：

$$J_{L1}(\mathbf{w}) = J(\mathbf{w}) + \frac{\lambda}{m} \sum_{j=1}^{n} |w_j| = J(\mathbf{w}) + \frac{\lambda}{m} \|\mathbf{w}\|_1$$

**特点：**
- 产生稀疏解，部分权重会变为0
- 可用于特征选择
- 对异常值更鲁棒

### L1 vs L2 对比

| 特性 | L1 (Lasso) | L2 (Ridge) |
|------|------------|------------|
| 惩罚项 | $\|\mathbf{w}\|_1$ | $\|\mathbf{w}\|_2^2$ |
| 解的特性 | 稀疏（部分权重为0） | 权重整体缩小 |
| 特征选择 | 是 | 否 |
| 多重共线性 | 随机选择一个 | 所有特征权重缩小 |
| 计算 | 无解析解 | 有解析解 |
| 对异常值 | 更鲁棒 | 敏感 |

### 几何解释

**L2正则化**：等高线与圆形约束的交点通常不在坐标轴上，权重不会完全为0。

**L1正则化**：等高线与菱形约束的交点更可能在坐标轴上，导致某些权重为0。

```python
import numpy as np
import matplotlib.pyplot as plt

def plot_regularization_geometry():
    """可视化L1和L2正则化的几何解释"""
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))

    # 创建网格
    x = np.linspace(-2, 2, 100)
    y = np.linspace(-2, 2, 100)
    X, Y = np.meshgrid(x, y)

    # 模拟损失函数等高线（椭圆）
    Z = (X - 1) ** 2 + 2 * (Y - 1) ** 2

    # L2正则化约束（圆形）
    theta = np.linspace(0, 2*np.pi, 100)
    circle_x = np.cos(theta)
    circle_y = np.sin(theta)

    axes[0].contour(X, Y, Z, levels=15, cmap='RdYlBu')
    axes[0].plot(circle_x, circle_y, 'g-', linewidth=2, label='L2约束')
    axes[0].scatter([0.5], [0.5], color='red', s=100, zorder=5, label='最优解')
    axes[0].axhline(y=0, color='k', linestyle='-', alpha=0.3)
    axes[0].axvline(x=0, color='k', linestyle='-', alpha=0.3)
    axes[0].set_xlabel('w1')
    axes[0].set_ylabel('w2')
    axes[0].set_title('L2正则化（Ridge）')
    axes[0].legend()
    axes[0].set_aspect('equal')

    # L1正则化约束（菱形）
    diamond_x = [1, 0, -1, 0, 1]
    diamond_y = [0, 1, 0, -1, 0]

    axes[1].contour(X, Y, Z, levels=15, cmap='RdYlBu')
    axes[1].plot(diamond_x, diamond_y, 'g-', linewidth=2, label='L1约束')
    axes[1].scatter([1], [0], color='red', s=100, zorder=5, label='最优解（稀疏）')
    axes[1].axhline(y=0, color='k', linestyle='-', alpha=0.3)
    axes[1].axvline(x=0, color='k', linestyle='-', alpha=0.3)
    axes[1].set_xlabel('w1')
    axes[1].set_ylabel('w2')
    axes[1].set_title('L1正则化（Lasso）')
    axes[1].legend()
    axes[1].set_aspect('equal')

    plt.tight_layout()
    plt.show()

plot_regularization_geometry()
```

---

## Ridge/Lasso/ElasticNet

### Ridge回归（岭回归）

Ridge回归的损失函数：

$$J(\mathbf{w}) = \frac{1}{2m} \|\mathbf{X}\mathbf{w} - \mathbf{y}\|_2^2 + \frac{\lambda}{2} \|\mathbf{w}\|_2^2$$

**解析解：**

$$\mathbf{w}^* = (\mathbf{X}^T\mathbf{X} + \lambda\mathbf{I})^{-1}\mathbf{X}^T\mathbf{y}$$

注意：$\lambda\mathbf{I}$ 的加入使矩阵一定可逆，解决了多重共线性问题。

```python
class RidgeRegression:
    """Ridge回归实现"""

    def __init__(self, alpha=1.0):
        self.alpha = alpha
        self.weights = None

    def _add_bias(self, X):
        return np.hstack([np.ones((X.shape[0], 1)), X])

    def fit(self, X, y):
        """使用解析解训练"""
        X_with_bias = self._add_bias(X)
        n_features = X_with_bias.shape[1]

        # 正则化矩阵（不惩罚偏置项）
        reg_matrix = self.alpha * np.eye(n_features)
        reg_matrix[0, 0] = 0  # 不惩罚偏置项

        # 解析解
        self.weights = np.linalg.solve(
            X_with_bias.T @ X_with_bias + reg_matrix,
            X_with_bias.T @ y
        )

        return self

    def predict(self, X):
        X_with_bias = self._add_bias(X)
        return X_with_bias @ self.weights

    def score(self, X, y):
        y_pred = self.predict(X)
        ss_res = np.sum((y - y_pred) ** 2)
        ss_tot = np.sum((y - np.mean(y)) ** 2)
        return 1 - (ss_res / ss_tot)
```

### Lasso回归

Lasso回归的损失函数：

$$J(\mathbf{w}) = \frac{1}{2m} \|\mathbf{X}\mathbf{w} - \mathbf{y}\|_2^2 + \lambda \|\mathbf{w}\|_1$$

由于L1范数在0点不可导，Lasso没有解析解，通常使用坐标下降法或近端梯度下降法求解。

**坐标下降法：**

每次只优化一个坐标（权重），保持其他坐标不变。

```python
class LassoRegression:
    """Lasso回归（坐标下降法）"""

    def __init__(self, alpha=1.0, max_iter=1000, tol=1e-4):
        self.alpha = alpha
        self.max_iter = max_iter
        self.tol = tol
        self.weights = None

    def _soft_threshold(self, x, threshold):
        """软阈值函数"""
        return np.sign(x) * np.maximum(np.abs(x) - threshold, 0)

    def fit(self, X, y):
        """使用坐标下降法训练"""
        m, n = X.shape

        # 标准化特征（Lasso对尺度敏感）
        self.X_mean = X.mean(axis=0)
        self.X_std = X.std(axis=0)
        self.X_std[self.X_std == 0] = 1  # 避免除以0
        X_scaled = (X - self.X_mean) / self.X_std

        self.y_mean = y.mean()
        y_centered = y - self.y_mean

        # 初始化权重
        self.weights = np.zeros(n)

        for iteration in range(self.max_iter):
            weights_old = self.weights.copy()

            for j in range(n):
                # 计算残差（不包括第j个特征的贡献）
                residual = y_centered - X_scaled @ self.weights + X_scaled[:, j] * self.weights[j]

                # 计算第j个特征的相关性
                rho_j = X_scaled[:, j] @ residual

                # 更新第j个权重（软阈值）
                self.weights[j] = self._soft_threshold(rho_j / m, self.alpha) / (np.sum(X_scaled[:, j] ** 2) / m)

            # 检查收敛
            if np.max(np.abs(self.weights - weights_old)) < self.tol:
                break

        # 转换回原始尺度
        self.weights = self.weights / self.X_std
        self.intercept = self.y_mean - self.X_mean @ self.weights

        return self

    def predict(self, X):
        return X @ self.weights + self.intercept

    def score(self, X, y):
        y_pred = self.predict(X)
        ss_res = np.sum((y - y_pred) ** 2)
        ss_tot = np.sum((y - np.mean(y)) ** 2)
        return 1 - (ss_res / ss_tot)
```

### ElasticNet（弹性网络）

ElasticNet结合了L1和L2正则化的优点：

$$J(\mathbf{w}) = \frac{1}{2m} \|\mathbf{X}\mathbf{w} - \mathbf{y}\|_2^2 + \lambda_1 \|\mathbf{w}\|_1 + \frac{\lambda_2}{2} \|\mathbf{w}\|_2^2$$

或者使用混合比例参数 $\rho \in [0, 1]$：

$$J(\mathbf{w}) = \frac{1}{2m} \|\mathbf{X}\mathbf{w} - \mathbf{y}\|_2^2 + \lambda [\rho \|\mathbf{w}\|_1 + \frac{1-\rho}{2} \|\mathbf{w}\|_2^2]$$

**特点：**
- 当特征高度相关时，Lasso倾向于随机选择一个，而ElasticNet会选择整组
- 结合了L1的稀疏性和L2的稳定性

```python
class ElasticNet:
    """ElasticNet回归"""

    def __init__(self, alpha=1.0, l1_ratio=0.5, max_iter=1000, tol=1e-4):
        """
        参数:
            alpha: 正则化强度
            l1_ratio: L1正则化比例（0到1之间）
        """
        self.alpha = alpha
        self.l1_ratio = l1_ratio
        self.max_iter = max_iter
        self.tol = tol
        self.weights = None

    def _soft_threshold(self, x, threshold):
        return np.sign(x) * np.maximum(np.abs(x) - threshold, 0)

    def fit(self, X, y):
        """使用坐标下降法训练"""
        m, n = X.shape

        # 标准化
        self.X_mean = X.mean(axis=0)
        self.X_std = X.std(axis=0)
        self.X_std[self.X_std == 0] = 1
        X_scaled = (X - self.X_mean) / self.X_std

        self.y_mean = y.mean()
        y_centered = y - self.y_mean

        # 初始化
        self.weights = np.zeros(n)

        l1_penalty = self.alpha * self.l1_ratio
        l2_penalty = self.alpha * (1 - self.l1_ratio)

        for iteration in range(self.max_iter):
            weights_old = self.weights.copy()

            for j in range(n):
                residual = y_centered - X_scaled @ self.weights + X_scaled[:, j] * self.weights[j]
                rho_j = X_scaled[:, j] @ residual / m

                # 软阈值 + L2惩罚
                self.weights[j] = self._soft_threshold(rho_j, l1_penalty) / (1 + l2_penalty)

            if np.max(np.abs(self.weights - weights_old)) < self.tol:
                break

        # 转换回原始尺度
        self.weights = self.weights / self.X_std
        self.intercept = self.y_mean - self.X_mean @ self.weights

        return self

    def predict(self, X):
        return X @ self.weights + self.intercept
```

### 正则化路径

通过绘制不同正则化强度下的系数路径，可以观察特征的重要性：

```python
def plot_regularization_path(X, y, alphas=None, model_type='lasso'):
    """绘制正则化路径"""
    from sklearn.linear_model import Lasso, Ridge, ElasticNet

    if alphas is None:
        alphas = np.logspace(-4, 2, 100)

    n_features = X.shape[1]
    coefs = []

    for alpha in alphas:
        if model_type == 'lasso':
            model = Lasso(alpha=alpha, max_iter=10000)
        elif model_type == 'ridge':
            model = Ridge(alpha=alpha)
        else:
            model = ElasticNet(alpha=alpha, l1_ratio=0.5, max_iter=10000)

        model.fit(X, y)
        coefs.append(model.coef_)

    coefs = np.array(coefs)

    plt.figure(figsize=(12, 6))
    for i in range(n_features):
        plt.plot(alphas, coefs[:, i], label=f'特征 {i+1}')

    plt.xscale('log')
    plt.xlabel('正则化参数 alpha')
    plt.ylabel('系数值')
    plt.title(f'{model_type.capitalize()} 正则化路径')
    plt.legend(loc='best')
    plt.grid(True)
    plt.show()
```

---

## 多分类逻辑回归

### One-vs-Rest (OvR)

最常用的多分类策略。对于 $K$ 个类别，训练 $K$ 个二分类器，每个分类器区分一个类别与其他所有类别。

预测时，选择概率最高的类别：

$$\hat{y} = \arg\max_k P(y=k|\mathbf{x})$$

```python
class LogisticRegressionOvR:
    """One-vs-Rest多分类逻辑回归"""

    def __init__(self, learning_rate=0.01, n_iterations=1000):
        self.learning_rate = learning_rate
        self.n_iterations = n_iterations
        self.classifiers = {}
        self.classes = None

    def fit(self, X, y):
        self.classes = np.unique(y)

        for cls in self.classes:
            # 创建二分类标签
            binary_y = (y == cls).astype(int)

            # 训练二分类器
            classifier = LogisticRegression()
            classifier.fit(X, binary_y, self.learning_rate, self.n_iterations)

            self.classifiers[cls] = classifier

        return self

    def predict_proba(self, X):
        """返回每个类别的概率"""
        probas = np.zeros((X.shape[0], len(self.classes)))

        for i, cls in enumerate(self.classes):
            probas[:, i] = self.classifiers[cls].predict_proba(X)

        # 归一化
        probas = probas / probas.sum(axis=1, keepdims=True)

        return probas

    def predict(self, X):
        probas = self.predict_proba(X)
        return self.classes[np.argmax(probas, axis=1)]

    def score(self, X, y):
        return np.mean(self.predict(X) == y)
```

### Softmax回归（多项逻辑回归）

直接对 $K$ 个类别建模，使用Softmax函数将线性输出转换为概率分布：

$$P(y=k|\mathbf{x}) = \frac{e^{\mathbf{w}_k^T\mathbf{x}}}{\sum_{j=1}^{K} e^{\mathbf{w}_j^T\mathbf{x}}}$$

**损失函数（交叉熵）：**

$$J(\mathbf{W}) = -\frac{1}{m} \sum_{i=1}^{m} \sum_{k=1}^{K} \mathbf{1}\{y^{(i)}=k\} \log P(y^{(i)}=k|\mathbf{x}^{(i)})$$

```python
class SoftmaxRegression:
    """Softmax回归（多分类）"""

    def __init__(self, n_classes=None):
        self.n_classes = n_classes
        self.weights = None

    def _add_bias(self, X):
        return np.hstack([np.ones((X.shape[0], 1)), X])

    def _softmax(self, z):
        """数值稳定的Softmax"""
        exp_z = np.exp(z - np.max(z, axis=1, keepdims=True))
        return exp_z / np.sum(exp_z, axis=1, keepdims=True)

    def _one_hot(self, y):
        """将标签转换为one-hot编码"""
        n_samples = len(y)
        one_hot = np.zeros((n_samples, self.n_classes))
        one_hot[np.arange(n_samples), y] = 1
        return one_hot

    def fit(self, X, y, learning_rate=0.01, n_iterations=1000, verbose=False):
        """训练模型"""
        X_with_bias = self._add_bias(X)
        m, n = X_with_bias.shape

        if self.n_classes is None:
            self.n_classes = len(np.unique(y))

        # 初始化权重矩阵
        self.weights = np.zeros((n, self.n_classes))

        # One-hot编码
        y_one_hot = self._one_hot(y)

        self.loss_history = []

        for iteration in range(n_iterations):
            # 前向传播
            z = X_with_bias @ self.weights
            y_pred = self._softmax(z)

            # 计算损失
            loss = -np.mean(np.sum(y_one_hot * np.log(y_pred + 1e-15), axis=1))
            self.loss_history.append(loss)

            # 计算梯度
            gradient = (1 / m) * X_with_bias.T @ (y_pred - y_one_hot)

            # 更新权重
            self.weights -= learning_rate * gradient

            if verbose and iteration % 100 == 0:
                print(f"迭代 {iteration}: 损失 = {loss:.6f}")

        return self

    def predict_proba(self, X):
        """预测概率"""
        X_with_bias = self._add_bias(X)
        z = X_with_bias @ self.weights
        return self._softmax(z)

    def predict(self, X):
        """预测类别"""
        return np.argmax(self.predict_proba(X), axis=1)

    def score(self, X, y):
        """计算准确率"""
        return np.mean(self.predict(X) == y)

# 示例
from sklearn.datasets import load_iris

iris = load_iris()
X, y = iris.data, iris.target

# 训练Softmax回归
model = SoftmaxRegression(n_classes=3)
model.fit(X, y, learning_rate=0.1, n_iterations=1000, verbose=True)
print(f"训练准确率: {model.score(X, y):.4f}")
```

### OvR vs Softmax对比

| 特性 | One-vs-Rest | Softmax |
|------|-------------|---------|
| 分类器数量 | K个 | 1个 |
| 概率校准 | 需要额外处理 | 天然校准 |
| 训练效率 | 可并行 | 联合训练 |
| 类别不平衡 | 每个分类器独立处理 | 全局处理 |

---

## Scikit-learn实战

### 线性回归

```python
from sklearn.linear_model import LinearRegression, Ridge, Lasso, ElasticNet
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_squared_error, r2_score
import numpy as np
import matplotlib.pyplot as plt

# 生成示例数据
np.random.seed(42)
n_samples = 200
X = np.random.randn(n_samples, 5)
# 真实关系：只有前3个特征有用
true_weights = np.array([3, -2, 1.5, 0, 0])
y = X @ true_weights + np.random.randn(n_samples) * 0.5

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 基础线性回归
lr = LinearRegression()
lr.fit(X_train, y_train)
print("线性回归:")
print(f"  系数: {lr.coef_}")
print(f"  截距: {lr.intercept_:.4f}")
print(f"  R^2: {lr.score(X_test, y_test):.4f}")

# Ridge回归
ridge = Ridge(alpha=1.0)
ridge.fit(X_train, y_train)
print("\nRidge回归 (alpha=1.0):")
print(f"  系数: {ridge.coef_}")
print(f"  R^2: {ridge.score(X_test, y_test):.4f}")

# Lasso回归
lasso = Lasso(alpha=0.1)
lasso.fit(X_train, y_train)
print("\nLasso回归 (alpha=0.1):")
print(f"  系数: {lasso.coef_}")  # 注意：无用特征的系数接近0
print(f"  R^2: {lasso.score(X_test, y_test):.4f}")

# ElasticNet
elastic = ElasticNet(alpha=0.1, l1_ratio=0.5)
elastic.fit(X_train, y_train)
print("\nElasticNet (alpha=0.1, l1_ratio=0.5):")
print(f"  系数: {elastic.coef_}")
print(f"  R^2: {elastic.score(X_test, y_test):.4f}")
```

### 正则化参数调优

```python
from sklearn.model_selection import GridSearchCV, learning_curve
import numpy as np

def tune_regularization(X, y, model_class, param_grid):
    """调优正则化参数"""
    # 创建Pipeline（包含标准化）
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('model', model_class())
    ])

    # 调整参数名称
    param_grid_pipeline = {f'model__{k}': v for k, v in param_grid.items()}

    # 网格搜索
    grid_search = GridSearchCV(
        pipeline, param_grid_pipeline, cv=5,
        scoring='neg_mean_squared_error',
        return_train_score=True
    )
    grid_search.fit(X, y)

    print(f"最佳参数: {grid_search.best_params_}")
    print(f"最佳CV分数 (负MSE): {grid_search.best_score_:.4f}")

    return grid_search

# Ridge调优
ridge_params = {'alpha': np.logspace(-4, 4, 20)}
ridge_search = tune_regularization(X_train, y_train, Ridge, ridge_params)

# Lasso调优
lasso_params = {'alpha': np.logspace(-4, 1, 20)}
lasso_search = tune_regularization(X_train, y_train, Lasso, lasso_params)

# ElasticNet调优
elastic_params = {
    'alpha': np.logspace(-4, 1, 10),
    'l1_ratio': [0.1, 0.3, 0.5, 0.7, 0.9]
}
elastic_search = tune_regularization(X_train, y_train, ElasticNet, elastic_params)
```

### 逻辑回归实战

```python
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, roc_auc_score, roc_curve
import matplotlib.pyplot as plt

# 加载数据
data = load_breast_cancer()
X, y = data.data, data.target

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# 标准化
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 训练不同正则化的逻辑回归
models = {
    'L2 (默认)': LogisticRegression(penalty='l2', C=1.0, max_iter=1000),
    'L1': LogisticRegression(penalty='l1', C=1.0, solver='saga', max_iter=1000),
    'ElasticNet': LogisticRegression(penalty='elasticnet', C=1.0, solver='saga',
                                      l1_ratio=0.5, max_iter=1000),
    '无正则化': LogisticRegression(penalty=None, max_iter=1000)
}

print("=== 逻辑回归模型对比 ===\n")
for name, model in models.items():
    model.fit(X_train_scaled, y_train)

    y_pred = model.predict(X_test_scaled)
    y_prob = model.predict_proba(X_test_scaled)[:, 1]

    accuracy = model.score(X_test_scaled, y_test)
    auc = roc_auc_score(y_test, y_prob)
    n_nonzero = np.sum(model.coef_ != 0)

    print(f"{name}:")
    print(f"  准确率: {accuracy:.4f}")
    print(f"  AUC: {auc:.4f}")
    print(f"  非零系数数量: {n_nonzero}/{len(model.coef_[0])}")
    print()
```

### 绘制ROC曲线

```python
def plot_roc_curves(models, X_test, y_test):
    """绘制多个模型的ROC曲线"""
    plt.figure(figsize=(10, 8))

    for name, model in models.items():
        y_prob = model.predict_proba(X_test)[:, 1]
        fpr, tpr, _ = roc_curve(y_test, y_prob)
        auc = roc_auc_score(y_test, y_prob)
        plt.plot(fpr, tpr, label=f'{name} (AUC = {auc:.3f})')

    plt.plot([0, 1], [0, 1], 'k--', label='随机猜测')
    plt.xlabel('假正例率 (FPR)')
    plt.ylabel('真正例率 (TPR)')
    plt.title('ROC曲线对比')
    plt.legend(loc='lower right')
    plt.grid(True)
    plt.show()

# 绘制ROC曲线
plot_roc_curves(models, X_test_scaled, y_test)
```

### 多分类逻辑回归

```python
from sklearn.datasets import load_iris
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import StandardScaler

# 加载数据
iris = load_iris()
X, y = iris.data, iris.target

# 标准化
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# OvR策略
lr_ovr = LogisticRegression(multi_class='ovr', solver='lbfgs', max_iter=1000)
scores_ovr = cross_val_score(lr_ovr, X_scaled, y, cv=5)
print(f"OvR策略 - 交叉验证准确率: {scores_ovr.mean():.4f} (+/- {scores_ovr.std()*2:.4f})")

# Softmax策略
lr_softmax = LogisticRegression(multi_class='multinomial', solver='lbfgs', max_iter=1000)
scores_softmax = cross_val_score(lr_softmax, X_scaled, y, cv=5)
print(f"Softmax策略 - 交叉验证准确率: {scores_softmax.mean():.4f} (+/- {scores_softmax.std()*2:.4f})")

# 查看系数
lr_softmax.fit(X_scaled, y)
print(f"\n系数矩阵形状: {lr_softmax.coef_.shape}")  # (3, 4) - 3个类别，4个特征
print("各类别系数:")
for i, class_name in enumerate(iris.target_names):
    print(f"  {class_name}: {lr_softmax.coef_[i]}")
```

### 特征选择与正则化路径

```python
from sklearn.linear_model import LassoCV, lasso_path
import matplotlib.pyplot as plt
import numpy as np

def lasso_feature_selection(X, y, feature_names=None):
    """使用Lasso进行特征选择"""
    # 使用LassoCV自动选择最佳alpha
    lasso_cv = LassoCV(cv=5, random_state=42)
    lasso_cv.fit(X, y)

    print(f"最佳alpha: {lasso_cv.alpha_:.6f}")
    print(f"R^2: {lasso_cv.score(X, y):.4f}")

    # 获取重要特征
    coef = lasso_cv.coef_
    importance = pd.DataFrame({
        'feature': feature_names if feature_names else [f'特征_{i}' for i in range(len(coef))],
        'coefficient': coef
    }).sort_values('coefficient', key=abs, ascending=False)

    # 筛选非零系数
    selected = importance[importance['coefficient'] != 0]
    print(f"\n选中的特征 ({len(selected)}/{len(coef)}):")
    print(selected)

    return lasso_cv, selected

def plot_lasso_path(X, y):
    """绘制Lasso路径"""
    # 计算Lasso路径
    alphas, coefs, _ = lasso_path(X, y, n_alphas=100)

    plt.figure(figsize=(12, 6))
    for i in range(coefs.shape[0]):
        plt.plot(alphas, coefs[i, :], label=f'特征 {i+1}')

    plt.xscale('log')
    plt.xlabel('alpha')
    plt.ylabel('系数')
    plt.title('Lasso正则化路径')
    plt.legend(loc='best')
    plt.grid(True)
    plt.gca().invert_xaxis()  # alpha从大到小
    plt.show()

# 示例
import pandas as pd
from sklearn.datasets import fetch_california_housing

housing = fetch_california_housing()
X, y = housing.data, housing.target

# 标准化
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 特征选择
lasso_model, selected_features = lasso_feature_selection(X_scaled, y, housing.feature_names)

# 绘制Lasso路径
plot_lasso_path(X_scaled, y)
```

### 完整Pipeline示例

```python
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, PolynomialFeatures
from sklearn.linear_model import Ridge, LogisticRegression
from sklearn.model_selection import cross_val_score
import pandas as pd
import numpy as np

def create_regression_pipeline(numeric_features, categorical_features=None,
                                degree=1, alpha=1.0):
    """创建完整的回归Pipeline"""

    # 数值特征处理
    numeric_transformer = Pipeline(steps=[
        ('scaler', StandardScaler()),
        ('poly', PolynomialFeatures(degree=degree, include_bias=False))
    ])

    # 如果有类别特征
    if categorical_features:
        categorical_transformer = Pipeline(steps=[
            ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ])

        preprocessor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, numeric_features),
                ('cat', categorical_transformer, categorical_features)
            ]
        )
    else:
        preprocessor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, numeric_features)
            ]
        )

    # 完整Pipeline
    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', Ridge(alpha=alpha))
    ])

    return pipeline

# 示例使用
# 创建示例数据
np.random.seed(42)
df = pd.DataFrame({
    'age': np.random.randint(20, 60, 100),
    'income': np.random.randn(100) * 20000 + 50000,
    'education': np.random.choice(['高中', '本科', '硕士', '博士'], 100),
    'city': np.random.choice(['北京', '上海', '广州', '深圳'], 100),
    'satisfaction': np.random.randn(100) * 2 + 7  # 目标变量
})

X = df.drop('satisfaction', axis=1)
y = df['satisfaction']

# 创建并训练Pipeline
pipeline = create_regression_pipeline(
    numeric_features=['age', 'income'],
    categorical_features=['education', 'city'],
    degree=2,
    alpha=1.0
)

# 交叉验证
scores = cross_val_score(pipeline, X, y, cv=5, scoring='r2')
print(f"交叉验证 R^2: {scores.mean():.4f} (+/- {scores.std()*2:.4f})")

# 训练完整模型
pipeline.fit(X, y)
print(f"\n模型系数数量: {len(pipeline.named_steps['regressor'].coef_)}")
```

---

## 面试要点

### 基础概念题

**Q1: 线性回归的假设有哪些？违反这些假设会怎样？**

线性回归的假设：
1. **线性性**：特征与目标之间存在线性关系
2. **独立性**：样本之间相互独立
3. **同方差性**：误差项方差恒定（不随X变化）
4. **正态性**：误差项服从正态分布
5. **无多重共线性**：特征之间不存在高度相关

违反后果：
- 违反线性性：模型欠拟合，需要特征转换或非线性模型
- 违反独立性：参数估计有偏
- 违反同方差性：置信区间不准确
- 违反正态性：小样本时假设检验失效
- 多重共线性：系数不稳定，方差增大

**Q2: L1和L2正则化的区别是什么？分别在什么场景下使用？**

```
L1 (Lasso):
- 惩罚项：|w|的和
- 产生稀疏解，部分权重为0
- 适用场景：
  * 特征选择
  * 高维稀疏数据
  * 需要可解释性

L2 (Ridge):
- 惩罚项：w^2的和
- 所有权重整体缩小
- 适用场景：
  * 多重共线性问题
  * 特征之间相关性高
  * 所有特征都可能重要
```

**Q3: 为什么逻辑回归使用交叉熵损失而不是MSE？**

1. **凸优化问题**：MSE用于逻辑回归会导致非凸损失函数，容易陷入局部最优。交叉熵损失保证是凸函数。

2. **概率解释**：交叉熵损失等价于最大似然估计，有良好的概率解释。

3. **梯度特性**：MSE的梯度在Sigmoid饱和区域（概率接近0或1时）非常小，导致梯度消失。交叉熵的梯度更合理。

**Q4: 正规方程 vs 梯度下降，如何选择？**

| 方面 | 正规方程 | 梯度下降 |
|------|----------|----------|
| 时间复杂度 | O(n^3) | O(kn^2) |
| 特征数量n | 小于10000时适用 | 任意规模 |
| 内存需求 | 需要存储X^TX | 可分批处理 |
| 超参数 | 无需调参 | 需要选择学习率 |
| 收敛性 | 直接得到最优解 | 需要迭代 |

**Q5: 逻辑回归如何处理多分类问题？**

```python
# One-vs-Rest (OvR)
# 训练K个二分类器，每个区分一个类别与其他
lr_ovr = LogisticRegression(multi_class='ovr')

# Softmax (Multinomial)
# 直接建模K个类别的概率分布
lr_softmax = LogisticRegression(multi_class='multinomial')

# 区别：
# - OvR：可并行训练，概率不一定归一化
# - Softmax：联合训练，概率天然归一化
```

### 代码实现题

**Q6: 实现带L2正则化的逻辑回归梯度下降**

```python
class LogisticRegressionL2:
    """带L2正则化的逻辑回归"""

    def __init__(self, learning_rate=0.01, lambda_reg=0.1, n_iterations=1000):
        self.learning_rate = learning_rate
        self.lambda_reg = lambda_reg  # L2正则化系数
        self.n_iterations = n_iterations
        self.weights = None

    def _sigmoid(self, z):
        return np.where(z >= 0,
                       1 / (1 + np.exp(-z)),
                       np.exp(z) / (1 + np.exp(z)))

    def fit(self, X, y):
        m, n = X.shape
        X_with_bias = np.hstack([np.ones((m, 1)), X])
        n_features = n + 1

        self.weights = np.zeros(n_features)

        for _ in range(self.n_iterations):
            # 前向传播
            z = X_with_bias @ self.weights
            y_pred = self._sigmoid(z)

            # 计算梯度（注意：不惩罚偏置项）
            gradient = (1 / m) * X_with_bias.T @ (y_pred - y)
            gradient[1:] += (self.lambda_reg / m) * self.weights[1:]  # L2惩罚

            # 更新权重
            self.weights -= self.learning_rate * gradient

        return self

    def predict_proba(self, X):
        X_with_bias = np.hstack([np.ones((X.shape[0], 1)), X])
        return self._sigmoid(X_with_bias @ self.weights)

    def predict(self, X, threshold=0.5):
        return (self.predict_proba(X) >= threshold).astype(int)
```

**Q7: 实现特征标准化（Z-score归一化）**

```python
class StandardScaler:
    """标准化：(x - mean) / std"""

    def __init__(self):
        self.mean = None
        self.std = None

    def fit(self, X):
        """计算均值和标准差"""
        self.mean = np.mean(X, axis=0)
        self.std = np.std(X, axis=0)
        # 避免除以0
        self.std[self.std == 0] = 1
        return self

    def transform(self, X):
        """应用标准化"""
        return (X - self.mean) / self.std

    def fit_transform(self, X):
        """拟合并转换"""
        return self.fit(X).transform(X)

    def inverse_transform(self, X_scaled):
        """反向转换"""
        return X_scaled * self.std + self.mean
```

### 实战问题

**Q8: 模型系数如何解释？**

```python
def interpret_coefficients(model, feature_names):
    """解释逻辑回归系数"""
    coef = model.coef_[0] if len(model.coef_.shape) > 1 else model.coef_

    interpretation = pd.DataFrame({
        'feature': feature_names,
        'coefficient': coef,
        'odds_ratio': np.exp(coef)  # 优势比
    }).sort_values('coefficient', key=abs, ascending=False)

    print("系数解释（逻辑回归）:")
    print("- 正系数：该特征增加时，正类概率增加")
    print("- 负系数：该特征增加时，正类概率减少")
    print("- 优势比：特征增加1单位时，优势（odds）的倍数变化")
    print()

    for _, row in interpretation.iterrows():
        direction = "增加" if row['coefficient'] > 0 else "减少"
        print(f"{row['feature']}: 系数={row['coefficient']:.4f}, "
              f"优势比={row['odds_ratio']:.4f}")
        print(f"  -> 该特征每增加1单位，正类优势{direction}{abs(row['odds_ratio']-1)*100:.2f}%")

    return interpretation
```

**Q9: 如何处理类别不平衡问题？**

```python
from sklearn.linear_model import LogisticRegression
from sklearn.utils.class_weight import compute_class_weight

# 方法1：使用class_weight参数
lr_balanced = LogisticRegression(class_weight='balanced')

# 方法2：自定义权重
classes = np.unique(y_train)
weights = compute_class_weight('balanced', classes=classes, y=y_train)
class_weights = dict(zip(classes, weights))
lr_custom = LogisticRegression(class_weight=class_weights)

# 方法3：调整决策阈值
model = LogisticRegression()
model.fit(X_train, y_train)

# 使用不同阈值
y_prob = model.predict_proba(X_test)[:, 1]
y_pred_default = (y_prob >= 0.5).astype(int)
y_pred_low_threshold = (y_prob >= 0.3).astype(int)  # 更低阈值，增加正类召回
```

**Q10: 正则化强度如何选择？**

```python
from sklearn.linear_model import LogisticRegressionCV, RidgeCV, LassoCV

# 方法1：使用内置CV类
# 逻辑回归
lr_cv = LogisticRegressionCV(Cs=np.logspace(-4, 4, 20), cv=5, scoring='roc_auc')
lr_cv.fit(X_train, y_train)
print(f"最佳C值: {lr_cv.C_[0]}")  # C = 1/lambda

# Ridge回归
ridge_cv = RidgeCV(alphas=np.logspace(-4, 4, 20), cv=5)
ridge_cv.fit(X_train, y_train)
print(f"最佳alpha: {ridge_cv.alpha_}")

# Lasso回归
lasso_cv = LassoCV(alphas=np.logspace(-4, 1, 20), cv=5)
lasso_cv.fit(X_train, y_train)
print(f"最佳alpha: {lasso_cv.alpha_}")

# 方法2：使用学习曲线
def plot_validation_curve(X, y, param_range, param_name='C'):
    """绘制验证曲线"""
    from sklearn.model_selection import validation_curve

    train_scores, test_scores = validation_curve(
        LogisticRegression(max_iter=1000), X, y,
        param_name=param_name, param_range=param_range,
        cv=5, scoring='accuracy'
    )

    train_mean = np.mean(train_scores, axis=1)
    test_mean = np.mean(test_scores, axis=1)

    plt.figure(figsize=(10, 6))
    plt.semilogx(param_range, train_mean, label='训练集')
    plt.semilogx(param_range, test_mean, label='验证集')
    plt.xlabel(param_name)
    plt.ylabel('准确率')
    plt.title('验证曲线')
    plt.legend()
    plt.grid(True)
    plt.show()
```

---

## 总结

### 线性模型知识图谱

```
线性模型
├── 回归
│   ├── 线性回归 (最小二乘法)
│   ├── Ridge回归 (L2正则化)
│   ├── Lasso回归 (L1正则化)
│   └── ElasticNet (L1+L2)
│
├── 分类
│   ├── 逻辑回归 (二分类)
│   │   ├── One-vs-Rest (多分类)
│   │   └── Softmax回归 (多分类)
│   └── 感知机 (线性二分类)
│
├── 求解方法
│   ├── 解析解 (正规方程)
│   ├── 批量梯度下降
│   ├── 随机梯度下降
│   └── 坐标下降 (Lasso)
│
└── 正则化
    ├── L1 (稀疏、特征选择)
    ├── L2 (权重衰减、稳定性)
    └── ElasticNet (综合)
```

### 实践建议

1. **数据预处理**
   - 始终对特征进行标准化，特别是使用正则化时
   - 检查并处理缺失值和异常值

2. **模型选择**
   - 从简单模型开始，逐步增加复杂度
   - 使用交叉验证选择超参数

3. **正则化选择**
   - 特征选择需求 -> Lasso
   - 所有特征可能重要 -> Ridge
   - 不确定 -> ElasticNet

4. **评估与解释**
   - 回归：R^2, MSE, 残差分析
   - 分类：准确率, 精确率, 召回率, AUC
   - 分析系数以理解特征重要性

5. **常见陷阱**
   - 忘记标准化导致系数不可比
   - 数据泄露（用测试集调参）
   - 忽略多重共线性

线性模型虽然简单，但理解透彻对于学习更复杂的模型（如神经网络、SVM）非常重要。它们是机器学习的基石，在许多实际应用中仍然是首选方法。
