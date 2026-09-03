---
title: 经典机器学习：支持向量机
description: 深入理解SVM原理：最大间隔、核技巧和软间隔
track: datascience
section: classical-ml
difficulty: advanced
tags:
  - SVM
  - 核方法
  - 分类
  - 机器学习
status: imported
origin: old/src/content/docs/datascience/svm.zh.md
divergence: 0.124
issues: []
legacy:
  category: DataScience
  subcategory: ClassicalML
  order: 15
  lastUpdated: 2026-01-07
---

支持向量机（SVM）是机器学习中最强大且理论最完善的分类算法之一。它的核心思想是找到一个最优超平面，将不同类别的数据分开，并使分类间隔最大化。本文将从直觉理解出发，深入讲解SVM的数学原理、核技巧、软间隔以及实际应用。

---

## SVM直觉理解

### 什么是SVM？

假设我们有两类数据点（红色和蓝色），需要找一条直线（在二维空间）或一个超平面（在高维空间）将它们分开。有无数条直线可以完成这个任务，那么哪条直线是最好的呢？

SVM的答案是：**选择距离两类数据点都最远的那条直线**。这就是所谓的"最大间隔"思想。

### 为什么要最大化间隔？

直觉上，间隔越大的分类器：

1. **泛化能力更强**：对新数据的分类更加鲁棒
2. **抗噪声能力更好**：即使数据有轻微扰动也不会导致错误分类
3. **理论保证**：根据统计学习理论，最大间隔分类器具有更低的VC维，泛化误差更小

### 几何视角

想象你要在两群人之间画一条线，最好的画法是让这条线与两边最近的人保持最大距离。这些"最近的人"就是**支持向量**，而这条线到两边支持向量的距离就是**间隔（Margin）**。

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import make_blobs

# 生成示例数据
X, y = make_blobs(n_samples=100, centers=2, random_state=42, cluster_std=1.5)

# 可视化
plt.figure(figsize=(10, 6))
plt.scatter(X[y == 0, 0], X[y == 0, 1], c='red', label='类别 0', s=50)
plt.scatter(X[y == 1, 0], X[y == 1, 1], c='blue', label='类别 1', s=50)
plt.xlabel('特征 1')
plt.ylabel('特征 2')
plt.title('SVM直觉：找到最优分类边界')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()
```

---

## 最大间隔分类器

### 数学定义

给定训练数据 $\{(\mathbf{x}_i, y_i)\}_{i=1}^{n}$，其中 $\mathbf{x}_i \in \mathbb{R}^d$，$y_i \in \{-1, +1\}$。

超平面的方程为：

$$\mathbf{w}^T\mathbf{x} + b = 0$$

其中 $\mathbf{w}$ 是法向量，$b$ 是截距。

### 分类规则

对于任意样本 $\mathbf{x}$：

- 如果 $\mathbf{w}^T\mathbf{x} + b > 0$，预测 $y = +1$
- 如果 $\mathbf{w}^T\mathbf{x} + b < 0$，预测 $y = -1$

可以统一写成：$y_i(\mathbf{w}^T\mathbf{x}_i + b) > 0$ 表示正确分类。

### 函数间隔与几何间隔

**函数间隔**（Functional Margin）：

$$\hat{\gamma}_i = y_i(\mathbf{w}^T\mathbf{x}_i + b)$$

函数间隔的问题是：当我们同时放大 $\mathbf{w}$ 和 $b$ 时，超平面不变，但函数间隔会变大。

**几何间隔**（Geometric Margin）：

$$\gamma_i = \frac{y_i(\mathbf{w}^T\mathbf{x}_i + b)}{\|\mathbf{w}\|}$$

几何间隔就是样本点到超平面的真实距离，它不受 $\mathbf{w}$ 缩放的影响。

### 最大间隔优化问题

我们的目标是最大化几何间隔：

$$\max_{\mathbf{w}, b} \frac{\hat{\gamma}}{\|\mathbf{w}\|} \quad \text{s.t.} \quad y_i(\mathbf{w}^T\mathbf{x}_i + b) \geq \hat{\gamma}, \quad \forall i$$

通过令 $\hat{\gamma} = 1$（函数间隔归一化），问题转化为：

$$\min_{\mathbf{w}, b} \frac{1}{2}\|\mathbf{w}\|^2 \quad \text{s.t.} \quad y_i(\mathbf{w}^T\mathbf{x}_i + b) \geq 1, \quad \forall i$$

这是一个**凸二次规划（Convex Quadratic Programming）**问题，可以用标准的优化算法求解。

### 为什么是 $\frac{1}{2}\|\mathbf{w}\|^2$？

1. **数学便利**：求导后系数为1，简化计算
2. **等价于最大化间隔**：$\min \frac{1}{2}\|\mathbf{w}\|^2$ 等价于 $\max \frac{1}{\|\mathbf{w}\|}$（间隔 = $\frac{2}{\|\mathbf{w}\|}$）

---

## 支持向量

### 什么是支持向量？

支持向量是距离分类超平面最近的那些训练样本点。它们满足：

$$y_i(\mathbf{w}^T\mathbf{x}_i + b) = 1$$

即落在间隔边界上的点。

### 支持向量的重要性

1. **决定分类边界**：SVM的决策边界完全由支持向量决定
2. **稀疏性**：只有少数样本是支持向量，其他样本对模型无影响
3. **高效预测**：预测时只需计算与支持向量的内积

### 可视化支持向量

```python
from sklearn.svm import SVC
import numpy as np
import matplotlib.pyplot as plt

# 生成数据
np.random.seed(42)
X = np.random.randn(100, 2)
y = np.array([1 if x[0] + x[1] > 0 else -1 for x in X])

# 训练SVM
svm = SVC(kernel='linear', C=1000)  # 大C值使其接近硬间隔
svm.fit(X, y)

# 获取支持向量
support_vectors = svm.support_vectors_

# 绘图
plt.figure(figsize=(10, 8))

# 绘制数据点
plt.scatter(X[y == 1, 0], X[y == 1, 1], c='blue', label='类别 +1', s=50)
plt.scatter(X[y == -1, 0], X[y == -1, 1], c='red', label='类别 -1', s=50)

# 突出显示支持向量
plt.scatter(support_vectors[:, 0], support_vectors[:, 1],
            s=200, facecolors='none', edgecolors='green', linewidth=2,
            label='支持向量')

# 绘制决策边界和间隔
ax = plt.gca()
xlim = ax.get_xlim()
ylim = ax.get_ylim()

xx = np.linspace(xlim[0], xlim[1], 50)
yy = np.linspace(ylim[0], ylim[1], 50)
XX, YY = np.meshgrid(xx, yy)
xy = np.vstack([XX.ravel(), YY.ravel()]).T
Z = svm.decision_function(xy).reshape(XX.shape)

# 绘制决策边界和间隔边界
ax.contour(XX, YY, Z, colors='k', levels=[-1, 0, 1],
           alpha=0.5, linestyles=['--', '-', '--'])

plt.xlabel('特征 1')
plt.ylabel('特征 2')
plt.title('SVM分类与支持向量')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()

print(f"支持向量数量: {len(support_vectors)}")
print(f"总样本数量: {len(X)}")
```

---

## 核技巧

### 线性不可分问题

当数据在原始空间中线性不可分时，我们需要将数据映射到高维空间，在高维空间中寻找线性分类边界。

**核心思想**：$\phi: \mathbb{R}^d \to \mathbb{R}^D$，其中 $D >> d$

在高维空间中的超平面：

$$\mathbf{w}^T\phi(\mathbf{x}) + b = 0$$

### 核函数

直接计算高维映射 $\phi(\mathbf{x})$ 可能非常昂贵甚至不可行。核函数提供了一种高效的解决方案：

**核函数定义**：

$$K(\mathbf{x}_i, \mathbf{x}_j) = \phi(\mathbf{x}_i)^T\phi(\mathbf{x}_j)$$

核函数直接计算两个样本在高维空间的内积，而无需显式计算映射 $\phi$。这就是著名的**核技巧（Kernel Trick）**。

### 常用核函数

#### 线性核（Linear Kernel）

$$K(\mathbf{x}_i, \mathbf{x}_j) = \mathbf{x}_i^T\mathbf{x}_j$$

- 适用于线性可分或高维稀疏数据
- 计算效率高
- 文本分类常用

#### 多项式核（Polynomial Kernel）

$$K(\mathbf{x}_i, \mathbf{x}_j) = (\gamma \mathbf{x}_i^T\mathbf{x}_j + r)^d$$

- $d$：多项式阶数
- $\gamma$：缩放系数
- $r$：常数项（coef0）
- 可以学习特征的交互作用

#### 高斯径向基核（RBF Kernel / Gaussian Kernel）

$$K(\mathbf{x}_i, \mathbf{x}_j) = \exp\left(-\gamma\|\mathbf{x}_i - \mathbf{x}_j\|^2\right)$$

或等价地：

$$K(\mathbf{x}_i, \mathbf{x}_j) = \exp\left(-\frac{\|\mathbf{x}_i - \mathbf{x}_j\|^2}{2\sigma^2}\right)$$

其中 $\gamma = \frac{1}{2\sigma^2}$

**RBF核的特点**：
- 隐式映射到无限维空间
- 最常用的核函数
- 局部性：只有相近的点才有较大的核值
- 可以拟合任意复杂的决策边界

#### Sigmoid核

$$K(\mathbf{x}_i, \mathbf{x}_j) = \tanh(\gamma \mathbf{x}_i^T\mathbf{x}_j + r)$$

- 与神经网络有联系
- 使用较少

### 核函数的选择

| 核函数 | 适用场景 | 超参数 |
|--------|----------|--------|
| 线性核 | 高维稀疏数据、文本分类 | 无 |
| RBF核 | 通用场景、非线性分类 | $\gamma$ |
| 多项式核 | 图像处理、特征交互 | $d$, $\gamma$, $r$ |

### 核函数可视化

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.svm import SVC
from sklearn.datasets import make_circles, make_moons

# 创建非线性可分数据
fig, axes = plt.subplots(2, 3, figsize=(15, 10))

# 数据集1：同心圆
X1, y1 = make_circles(n_samples=200, noise=0.1, factor=0.3, random_state=42)

# 数据集2：月牙形
X2, y2 = make_moons(n_samples=200, noise=0.1, random_state=42)

kernels = ['linear', 'poly', 'rbf']
kernel_names = ['线性核', '多项式核 (d=3)', 'RBF核']

for i, (kernel, name) in enumerate(zip(kernels, kernel_names)):
    for j, (X, y, title) in enumerate([(X1, y1, '同心圆'), (X2, y2, '月牙形')]):
        ax = axes[j, i]

        # 训练SVM
        if kernel == 'poly':
            svm = SVC(kernel=kernel, degree=3, gamma='auto')
        else:
            svm = SVC(kernel=kernel, gamma='auto')
        svm.fit(X, y)

        # 创建网格
        xx, yy = np.meshgrid(np.linspace(X[:, 0].min()-0.5, X[:, 0].max()+0.5, 100),
                            np.linspace(X[:, 1].min()-0.5, X[:, 1].max()+0.5, 100))
        Z = svm.predict(np.c_[xx.ravel(), yy.ravel()]).reshape(xx.shape)

        # 绘制决策边界
        ax.contourf(xx, yy, Z, alpha=0.3, cmap='RdYlBu')
        ax.scatter(X[y == 0, 0], X[y == 0, 1], c='red', s=30)
        ax.scatter(X[y == 1, 0], X[y == 1, 1], c='blue', s=30)
        ax.set_title(f'{title} - {name}')
        ax.set_xlabel('特征 1')
        ax.set_ylabel('特征 2')

plt.tight_layout()
plt.show()
```

### 核函数的数学性质

一个函数 $K(\mathbf{x}, \mathbf{z})$ 要成为有效的核函数，必须满足**Mercer定理**：

对于任意数据 $\{\mathbf{x}_1, ..., \mathbf{x}_n\}$，核矩阵（Gram矩阵）$\mathbf{K}$ 必须是**半正定的**：

$$K_{ij} = K(\mathbf{x}_i, \mathbf{x}_j)$$

$$\mathbf{K} \succeq 0$$

---

## 软间隔SVM

### 为什么需要软间隔？

在实际问题中，数据往往：
1. 存在噪声和异常值
2. 即使在高维空间也不能完全线性可分
3. 过度追求完美分类会导致过拟合

**软间隔SVM**允许部分样本违反间隔约束，以获得更好的泛化能力。

### 松弛变量

引入松弛变量 $\xi_i \geq 0$，允许样本点落在间隔内甚至错误一侧：

$$y_i(\mathbf{w}^T\mathbf{x}_i + b) \geq 1 - \xi_i$$

- $\xi_i = 0$：样本在间隔边界外，正确分类
- $0 < \xi_i < 1$：样本在间隔内，但正确分类
- $\xi_i \geq 1$：样本被错误分类

### 软间隔优化问题

$$\min_{\mathbf{w}, b, \xi} \frac{1}{2}\|\mathbf{w}\|^2 + C\sum_{i=1}^{n}\xi_i$$

约束条件：

$$y_i(\mathbf{w}^T\mathbf{x}_i + b) \geq 1 - \xi_i, \quad \xi_i \geq 0, \quad \forall i$$

### 正则化参数C

参数 $C$ 控制间隔最大化与分类错误之间的权衡：

| C值 | 效果 |
|-----|------|
| 大C | 严格分类，小间隔，可能过拟合 |
| 小C | 允许更多错误，大间隔，可能欠拟合 |

### C值的影响可视化

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.svm import SVC
from sklearn.datasets import make_classification

# 生成带噪声的数据
np.random.seed(42)
X, y = make_classification(n_samples=100, n_features=2, n_redundant=0,
                          n_informative=2, n_clusters_per_class=1,
                          flip_y=0.1, random_state=42)

fig, axes = plt.subplots(1, 3, figsize=(15, 5))
C_values = [0.1, 1, 100]

for ax, C in zip(axes, C_values):
    svm = SVC(kernel='linear', C=C)
    svm.fit(X, y)

    # 创建网格
    xx, yy = np.meshgrid(np.linspace(X[:, 0].min()-1, X[:, 0].max()+1, 100),
                        np.linspace(X[:, 1].min()-1, X[:, 1].max()+1, 100))
    Z = svm.decision_function(np.c_[xx.ravel(), yy.ravel()]).reshape(xx.shape)

    # 绘制决策边界和间隔
    ax.contourf(xx, yy, Z, levels=50, alpha=0.3, cmap='RdYlBu')
    ax.contour(xx, yy, Z, colors='k', levels=[-1, 0, 1],
               alpha=0.5, linestyles=['--', '-', '--'])
    ax.scatter(X[y == 0, 0], X[y == 0, 1], c='red', s=50, label='类别 0')
    ax.scatter(X[y == 1, 0], X[y == 1, 1], c='blue', s=50, label='类别 1')

    # 标记支持向量
    ax.scatter(svm.support_vectors_[:, 0], svm.support_vectors_[:, 1],
               s=200, facecolors='none', edgecolors='green', linewidth=2)

    ax.set_title(f'C = {C}\n支持向量数: {len(svm.support_vectors_)}')
    ax.set_xlabel('特征 1')
    ax.set_ylabel('特征 2')

plt.tight_layout()
plt.show()
```

### 对偶形式与KKT条件

软间隔SVM的拉格朗日对偶问题：

$$\max_{\alpha} \sum_{i=1}^{n}\alpha_i - \frac{1}{2}\sum_{i=1}^{n}\sum_{j=1}^{n}\alpha_i\alpha_j y_i y_j K(\mathbf{x}_i, \mathbf{x}_j)$$

约束条件：

$$0 \leq \alpha_i \leq C, \quad \sum_{i=1}^{n}\alpha_i y_i = 0$$

**KKT条件**揭示了 $\alpha_i$ 与样本状态的关系：

| 条件 | $\alpha_i$ 值 | 样本状态 |
|------|---------------|----------|
| $y_i f(\mathbf{x}_i) > 1$ | $\alpha_i = 0$ | 正确分类，在间隔外 |
| $y_i f(\mathbf{x}_i) = 1$ | $0 < \alpha_i < C$ | 在间隔边界上（支持向量） |
| $y_i f(\mathbf{x}_i) < 1$ | $\alpha_i = C$ | 违反间隔（错误或在间隔内） |

---

## SMO算法

### 为什么需要SMO？

传统的二次规划求解器在大规模数据上效率很低。SMO（Sequential Minimal Optimization）算法由John Platt于1998年提出，是目前最广泛使用的SVM求解算法。

### SMO的核心思想

1. **每次只优化两个变量**：由于约束 $\sum \alpha_i y_i = 0$，至少需要同时更新两个变量
2. **迭代更新**：重复选择变量对并更新，直到收敛
3. **解析解**：两个变量的子问题有闭式解

### 变量选择策略

**第一个变量**（外层循环）：选择违反KKT条件最严重的样本

**第二个变量**（内层循环）：选择使 $|E_1 - E_2|$ 最大的样本，其中 $E_i = f(\mathbf{x}_i) - y_i$ 是预测误差

### SMO算法步骤

```
1. 初始化：α = 0, b = 0
2. 重复以下步骤直到收敛：
   a. 选择第一个变量 α₁（违反KKT条件）
   b. 选择第二个变量 α₂（最大化|E₁ - E₂|）
   c. 计算新的 α₂：
      - 计算边界 L 和 H
      - 计算未修剪的 α₂_new
      - 修剪 α₂_new 到 [L, H]
   d. 计算新的 α₁：α₁_new = α₁ + y₁y₂(α₂ - α₂_new)
   e. 更新阈值 b
3. 输出：支持向量和决策函数
```

### SMO更新公式

设要更新的两个变量为 $\alpha_1$ 和 $\alpha_2$：

**未修剪的 $\alpha_2$**：

$$\alpha_2^{new,unc} = \alpha_2 + \frac{y_2(E_1 - E_2)}{\eta}$$

其中 $\eta = K_{11} + K_{22} - 2K_{12}$

**修剪边界**：

如果 $y_1 \neq y_2$：
$$L = \max(0, \alpha_2 - \alpha_1), \quad H = \min(C, C + \alpha_2 - \alpha_1)$$

如果 $y_1 = y_2$：
$$L = \max(0, \alpha_2 + \alpha_1 - C), \quad H = \min(C, \alpha_2 + \alpha_1)$$

**修剪后的 $\alpha_2$**：

$$\alpha_2^{new} = \begin{cases}
H & \text{if } \alpha_2^{new,unc} > H \\
\alpha_2^{new,unc} & \text{if } L \leq \alpha_2^{new,unc} \leq H \\
L & \text{if } \alpha_2^{new,unc} < L
\end{cases}$$

### SMO简化实现

```python
import numpy as np

class SimpleSMO:
    def __init__(self, C=1.0, tol=1e-3, max_iter=100):
        self.C = C
        self.tol = tol
        self.max_iter = max_iter

    def fit(self, X, y):
        n_samples, n_features = X.shape
        self.alpha = np.zeros(n_samples)
        self.b = 0
        self.X = X
        self.y = y

        # 计算核矩阵（线性核）
        self.K = np.dot(X, X.T)

        for _ in range(self.max_iter):
            alpha_changed = 0

            for i in range(n_samples):
                E_i = self._decision_function(i) - y[i]

                # 检查KKT条件
                if ((y[i] * E_i < -self.tol and self.alpha[i] < self.C) or
                    (y[i] * E_i > self.tol and self.alpha[i] > 0)):

                    # 选择第二个变量
                    j = self._select_j(i, E_i, n_samples)
                    E_j = self._decision_function(j) - y[j]

                    alpha_i_old = self.alpha[i]
                    alpha_j_old = self.alpha[j]

                    # 计算边界
                    if y[i] != y[j]:
                        L = max(0, self.alpha[j] - self.alpha[i])
                        H = min(self.C, self.C + self.alpha[j] - self.alpha[i])
                    else:
                        L = max(0, self.alpha[i] + self.alpha[j] - self.C)
                        H = min(self.C, self.alpha[i] + self.alpha[j])

                    if L == H:
                        continue

                    # 计算eta
                    eta = self.K[i, i] + self.K[j, j] - 2 * self.K[i, j]
                    if eta <= 0:
                        continue

                    # 更新alpha_j
                    self.alpha[j] += y[j] * (E_i - E_j) / eta
                    self.alpha[j] = np.clip(self.alpha[j], L, H)

                    if abs(self.alpha[j] - alpha_j_old) < 1e-5:
                        continue

                    # 更新alpha_i
                    self.alpha[i] += y[i] * y[j] * (alpha_j_old - self.alpha[j])

                    # 更新b
                    b1 = (self.b - E_i - y[i] * (self.alpha[i] - alpha_i_old) * self.K[i, i]
                          - y[j] * (self.alpha[j] - alpha_j_old) * self.K[i, j])
                    b2 = (self.b - E_j - y[i] * (self.alpha[i] - alpha_i_old) * self.K[i, j]
                          - y[j] * (self.alpha[j] - alpha_j_old) * self.K[j, j])

                    if 0 < self.alpha[i] < self.C:
                        self.b = b1
                    elif 0 < self.alpha[j] < self.C:
                        self.b = b2
                    else:
                        self.b = (b1 + b2) / 2

                    alpha_changed += 1

            if alpha_changed == 0:
                break

        # 提取支持向量
        sv_idx = self.alpha > 1e-5
        self.support_vectors_ = X[sv_idx]
        self.support_vector_labels_ = y[sv_idx]
        self.support_vector_alphas_ = self.alpha[sv_idx]

        return self

    def _decision_function(self, i):
        return np.sum(self.alpha * self.y * self.K[:, i]) + self.b

    def _select_j(self, i, E_i, n_samples):
        # 简化版：随机选择不同的j
        j = i
        while j == i:
            j = np.random.randint(0, n_samples)
        return j

    def predict(self, X):
        K = np.dot(X, self.X.T)
        decision = np.dot(K, self.alpha * self.y) + self.b
        return np.sign(decision)
```

---

## SVM回归（SVR）

### 从分类到回归

支持向量回归（Support Vector Regression, SVR）将SVM的思想扩展到回归问题。与分类不同，SVR的目标是拟合一个函数，使得所有样本点都落在该函数的 $\epsilon$ 邻域内。

### $\epsilon$-不敏感损失函数

$$L_\epsilon(y, f(x)) = \begin{cases}
0 & \text{if } |y - f(x)| \leq \epsilon \\
|y - f(x)| - \epsilon & \text{otherwise}
\end{cases}$$

这意味着：预测值与真实值的误差在 $\epsilon$ 以内时，损失为0。

### SVR优化问题

$$\min_{\mathbf{w}, b, \xi, \xi^*} \frac{1}{2}\|\mathbf{w}\|^2 + C\sum_{i=1}^{n}(\xi_i + \xi_i^*)$$

约束条件：

$$y_i - (\mathbf{w}^T\mathbf{x}_i + b) \leq \epsilon + \xi_i$$
$$(\mathbf{w}^T\mathbf{x}_i + b) - y_i \leq \epsilon + \xi_i^*$$
$$\xi_i, \xi_i^* \geq 0$$

### SVR可视化

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.svm import SVR

# 生成非线性回归数据
np.random.seed(42)
X = np.sort(5 * np.random.rand(100, 1), axis=0)
y = np.sin(X).ravel() + np.random.normal(0, 0.1, X.shape[0])

# 训练不同核函数的SVR
fig, axes = plt.subplots(1, 3, figsize=(15, 5))
kernels = ['linear', 'poly', 'rbf']
kernel_names = ['线性核', '多项式核', 'RBF核']

X_test = np.linspace(0, 5, 100).reshape(-1, 1)

for ax, kernel, name in zip(axes, kernels, kernel_names):
    svr = SVR(kernel=kernel, C=100, gamma='auto', epsilon=0.1)
    svr.fit(X, y)
    y_pred = svr.predict(X_test)

    ax.scatter(X, y, c='darkorange', label='数据点')
    ax.plot(X_test, y_pred, c='navy', label='SVR预测')

    # 绘制epsilon管道
    ax.fill_between(X_test.ravel(), y_pred - 0.1, y_pred + 0.1,
                    alpha=0.2, color='navy', label='ε-管道')

    # 标记支持向量
    sv_idx = svr.support_
    ax.scatter(X[sv_idx], y[sv_idx], c='red', s=100,
               facecolors='none', edgecolors='red', linewidth=2,
               label=f'支持向量 ({len(sv_idx)}个)')

    ax.set_title(f'SVR - {name}')
    ax.set_xlabel('X')
    ax.set_ylabel('y')
    ax.legend()

plt.tight_layout()
plt.show()
```

### SVR超参数

| 参数 | 说明 | 影响 |
|------|------|------|
| C | 正则化参数 | 大C：更拟合，可能过拟合 |
| $\epsilon$ | 不敏感区域宽度 | 大$\epsilon$：更多点在管道内，模型更简单 |
| kernel | 核函数类型 | 决定拟合能力 |
| $\gamma$ | RBF核参数 | 大$\gamma$：局部影响，可能过拟合 |

---

## Scikit-learn实现

### 基本使用

```python
from sklearn.svm import SVC, SVR
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import classification_report, accuracy_score
from sklearn.pipeline import Pipeline
from sklearn.datasets import load_breast_cancer
import numpy as np

# 加载数据
data = load_breast_cancer()
X, y = data.data, data.target

# 划分数据集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 创建Pipeline（特征标准化对SVM很重要！）
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('svm', SVC(kernel='rbf', random_state=42))
])

# 训练模型
pipeline.fit(X_train, y_train)

# 预测和评估
y_pred = pipeline.predict(X_test)
print("准确率:", accuracy_score(y_test, y_pred))
print("\n分类报告:")
print(classification_report(y_test, y_pred, target_names=data.target_names))
```

### 超参数调优

```python
from sklearn.model_selection import GridSearchCV

# 定义参数网格
param_grid = {
    'svm__C': [0.1, 1, 10, 100],
    'svm__gamma': ['scale', 'auto', 0.01, 0.1, 1],
    'svm__kernel': ['rbf', 'poly']
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

print("最佳参数:", grid_search.best_params_)
print("最佳交叉验证得分:", grid_search.best_score_)

# 使用最佳模型预测
y_pred_best = grid_search.predict(X_test)
print("测试集准确率:", accuracy_score(y_test, y_pred_best))
```

### 概率输出

```python
# SVC默认不输出概率，需要设置probability=True
svm_prob = SVC(kernel='rbf', probability=True, random_state=42)
pipeline_prob = Pipeline([
    ('scaler', StandardScaler()),
    ('svm', svm_prob)
])

pipeline_prob.fit(X_train, y_train)

# 获取概率预测
y_prob = pipeline_prob.predict_proba(X_test)
print("前5个样本的类别概率:")
print(y_prob[:5])

# 计算AUC-ROC
from sklearn.metrics import roc_auc_score, roc_curve
import matplotlib.pyplot as plt

auc_score = roc_auc_score(y_test, y_prob[:, 1])
fpr, tpr, _ = roc_curve(y_test, y_prob[:, 1])

plt.figure(figsize=(8, 6))
plt.plot(fpr, tpr, label=f'SVM (AUC = {auc_score:.3f})')
plt.plot([0, 1], [0, 1], 'k--', label='随机猜测')
plt.xlabel('假阳性率')
plt.ylabel('真阳性率')
plt.title('ROC曲线')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()
```

### 多分类SVM

```python
from sklearn.datasets import load_iris
from sklearn.multiclass import OneVsRestClassifier, OneVsOneClassifier

# 加载多分类数据
iris = load_iris()
X, y = iris.data, iris.target

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 方法1：SVC默认使用One-vs-One
svm_ovo = SVC(kernel='rbf', decision_function_shape='ovo')
svm_ovo.fit(X_train, y_train)
print("One-vs-One准确率:", svm_ovo.score(X_test, y_test))

# 方法2：One-vs-Rest
svm_ovr = SVC(kernel='rbf', decision_function_shape='ovr')
svm_ovr.fit(X_train, y_train)
print("One-vs-Rest准确率:", svm_ovr.score(X_test, y_test))
```

### SVR回归示例

```python
from sklearn.svm import SVR
from sklearn.datasets import fetch_california_housing
from sklearn.metrics import mean_squared_error, r2_score
import numpy as np

# 加载回归数据（使用子集加速）
housing = fetch_california_housing()
X, y = housing.data[:2000], housing.target[:2000]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# 创建SVR Pipeline
svr_pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('svr', SVR(kernel='rbf', C=100, gamma='scale', epsilon=0.1))
])

# 训练和评估
svr_pipeline.fit(X_train, y_train)
y_pred = svr_pipeline.predict(X_test)

print("SVR回归结果:")
print(f"  MSE: {mean_squared_error(y_test, y_pred):.4f}")
print(f"  RMSE: {np.sqrt(mean_squared_error(y_test, y_pred)):.4f}")
print(f"  R²: {r2_score(y_test, y_pred):.4f}")
```

### 大规模数据处理

对于大规模数据，可以使用LinearSVC（基于liblinear）或SGDClassifier：

```python
from sklearn.svm import LinearSVC
from sklearn.linear_model import SGDClassifier

# LinearSVC：适合大规模线性分类
linear_svc = LinearSVC(C=1.0, max_iter=10000)

# SGDClassifier with hinge loss：等价于线性SVM
sgd_svm = SGDClassifier(loss='hinge', alpha=0.0001, max_iter=1000)

# Pipeline示例
large_scale_pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('svm', LinearSVC(C=1.0, dual='auto', max_iter=10000))
])

large_scale_pipeline.fit(X_train, y_train)
print("LinearSVC准确率:", large_scale_pipeline.score(X_test, y_test))
```

### 完整示例：文本分类

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.pipeline import Pipeline
from sklearn.datasets import fetch_20newsgroups

# 加载文本数据
categories = ['sci.space', 'rec.sport.baseball', 'comp.graphics']
newsgroups_train = fetch_20newsgroups(subset='train', categories=categories)
newsgroups_test = fetch_20newsgroups(subset='test', categories=categories)

# 创建文本分类Pipeline
text_clf = Pipeline([
    ('tfidf', TfidfVectorizer(stop_words='english', max_features=10000)),
    ('svm', LinearSVC(C=1.0, dual='auto'))
])

# 训练和评估
text_clf.fit(newsgroups_train.data, newsgroups_train.target)
y_pred = text_clf.predict(newsgroups_test.data)

print("文本分类准确率:", accuracy_score(newsgroups_test.target, y_pred))
print("\n分类报告:")
print(classification_report(newsgroups_test.target, y_pred,
                          target_names=newsgroups_test.target_names))
```

---

## 面试要点

### 基础概念

**Q1: SVM的核心思想是什么？**

SVM的核心思想是找到一个最优超平面，使得两类样本之间的间隔最大化。这个间隔由距离超平面最近的样本（支持向量）决定。

**Q2: 什么是支持向量？为什么叫"支持"向量机？**

支持向量是落在间隔边界上的样本点，即满足 $y_i(\mathbf{w}^T\mathbf{x}_i + b) = 1$ 的点。这些向量"支撑"起了分类边界，移除其他样本不影响决策边界，因此称为支持向量机。

**Q3: 为什么SVM需要特征标准化？**

- SVM基于距离计算，特征尺度不同会影响距离度量
- 核函数（如RBF）对特征尺度敏感
- 标准化可以加速优化收敛

### 核函数

**Q4: 核函数的作用是什么？为什么使用核技巧？**

核函数将数据隐式映射到高维空间，使得原本线性不可分的数据变得线性可分。核技巧的优势是：不需要显式计算高维映射，只需计算核函数值（内积），计算效率高。

**Q5: 如何选择核函数？**

- **线性核**：数据线性可分、高维稀疏数据（如文本）
- **RBF核**：通用选择，非线性分类，需要调节gamma
- **多项式核**：已知特征交互时使用

**Q6: RBF核的gamma参数有什么影响？**

- **大gamma**：每个样本影响范围小，决策边界复杂，可能过拟合
- **小gamma**：每个样本影响范围大，决策边界平滑，可能欠拟合

### 优化与参数

**Q7: 软间隔SVM中参数C的作用？**

C是正则化参数，控制间隔最大化与分类错误之间的权衡：
- **大C**：严格分类，小间隔，可能过拟合
- **小C**：允许更多错误，大间隔，更好的泛化

**Q8: SVM如何处理多分类问题？**

- **One-vs-One (OvO)**：训练 $\frac{n(n-1)}{2}$ 个二分类器，投票决定
- **One-vs-Rest (OvR)**：训练 $n$ 个二分类器，取最高置信度

**Q9: SMO算法的基本思想？**

SMO每次选择两个变量进行优化（因为约束条件限制），利用闭式解更新，迭代直到收敛。这比通用QP求解器更高效。

### 实践问题

**Q10: SVM的优缺点？**

**优点**：
- 高维空间有效（适合文本分类）
- 理论基础完善，泛化能力强
- 只依赖支持向量，具有稀疏性
- 核技巧处理非线性问题

**缺点**：
- 大规模数据训练慢（$O(n^2)$ 到 $O(n^3)$）
- 多分类需要额外策略
- 对噪声和核函数选择敏感
- 不直接输出概率

**Q11: SVM和逻辑回归的区别？**

| 方面 | SVM | 逻辑回归 |
|------|-----|----------|
| 损失函数 | Hinge Loss | Log Loss |
| 决策边界 | 最大间隔 | 概率边界 |
| 概率输出 | 间接（Platt scaling） | 直接 |
| 稀疏性 | 只依赖支持向量 | 依赖所有数据 |
| 高维数据 | 更有效 | 可能过拟合 |

**Q12: 如何处理SVM的过拟合？**

- 减小C值（增加正则化）
- 增大gamma（RBF核）
- 使用更简单的核函数
- 增加训练数据
- 特征选择/降维

---

## 延伸阅读

### 经典论文

1. **原始SVM论文**：Cortes & Vapnik, "Support-Vector Networks", 1995
2. **SMO算法**：Platt, "Sequential Minimal Optimization", 1998
3. **核方法综述**：Scholkopf & Smola, "Learning with Kernels", 2002
4. **SVM教程**：Burges, "A Tutorial on Support Vector Machines", 1998

### 推荐书籍

1. **《统计学习方法》（李航）**：第7章详细讲解SVM
2. **《机器学习》（周志华）**：西瓜书第6章
3. **《Pattern Recognition and Machine Learning》（Bishop）**：第7章核方法
4. **《Learning with Kernels》（Scholkopf & Smola）**：核方法权威著作

### 进阶主题

1. **结构化SVM**：处理序列标注、图结构等问题
2. **在线SVM**：增量学习和流数据处理
3. **多核学习（MKL）**：组合多个核函数
4. **深度核学习**：结合深度学习和核方法
5. **核近似方法**：随机傅里叶特征、Nystrom方法

### 工具与实现

- **scikit-learn**：基于libsvm，功能全面
- **LIBSVM**：SVM标准实现库
- **LIBLINEAR**：大规模线性SVM
- **ThunderSVM**：GPU加速的SVM

---

## 总结

支持向量机是机器学习中理论与实践兼备的经典算法。本文从直觉理解出发，系统讲解了SVM的核心概念：

1. **最大间隔原理**：找到使分类间隔最大的超平面
2. **支持向量**：决定决策边界的关键样本
3. **核技巧**：隐式映射到高维空间处理非线性问题
4. **软间隔**：引入松弛变量处理噪声和异常值
5. **SMO算法**：高效求解SVM优化问题
6. **SVR回归**：将SVM思想扩展到回归任务

在实际应用中，SVM特别适合：
- 高维数据（如文本分类、基因分析）
- 小样本学习
- 需要高泛化能力的场景

虽然深度学习在很多领域取代了SVM，但理解SVM的原理对于掌握机器学习的核心思想仍然非常重要。SVM展示了凸优化、核方法、统计学习理论的完美结合，是每个机器学习从业者应该深入理解的经典算法。
