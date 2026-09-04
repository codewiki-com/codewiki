---
title: 机器学习数学基础：优化理论
description: 掌握机器学习优化核心：凸优化、梯度下降变种和约束优化
track: datascience
section: statistics
difficulty: advanced
tags:
  - 优化
  - 梯度下降
  - 凸优化
  - 数学
status: imported
origin: old/src/content/docs/datascience/optimization-theory.zh.md
divergence: 0.157
issues:
  - title-lang-en
  - title-language
legacy:
  category: DataScience
  subcategory: Math
  order: 3
  lastUpdated: 2026-01-07
---

优化理论是机器学习的数学基石。无论是训练神经网络、拟合回归模型，还是调整超参数，本质上都是在求解优化问题。本文将系统性地介绍凸优化理论、各种梯度下降算法及其变种、学习率调度策略，以及约束优化方法。

---

## 优化问题基础

### 什么是优化问题

优化问题的一般形式为：

$$\min_{x \in \mathcal{X}} f(x)$$

其中：
- $f(x)$ 是**目标函数**（objective function）
- $x$ 是**决策变量**（decision variable）
- $\mathcal{X}$ 是**可行域**（feasible region）

在机器学习中，目标函数通常是损失函数，决策变量是模型参数。

### 优化问题的分类

| 分类维度 | 类型 | 特点 |
|----------|------|------|
| 约束条件 | 无约束优化 | 没有额外限制 |
|          | 约束优化 | 存在等式或不等式约束 |
| 目标函数性质 | 凸优化 | 局部最优即全局最优 |
|              | 非凸优化 | 可能存在多个局部最优 |
| 变量类型 | 连续优化 | 变量取实数值 |
|          | 离散优化 | 变量取离散值 |

### 机器学习中的优化问题

**线性回归的最小二乘问题：**

$$\min_{\mathbf{w}} \frac{1}{2n}\|\mathbf{Xw} - \mathbf{y}\|_2^2$$

**逻辑回归的交叉熵损失：**

$$\min_{\mathbf{w}} -\frac{1}{n}\sum_{i=1}^{n}[y_i\log(\sigma(\mathbf{w}^T\mathbf{x}_i)) + (1-y_i)\log(1-\sigma(\mathbf{w}^T\mathbf{x}_i))]$$

**神经网络的损失函数：**

$$\min_{\theta} \mathcal{L}(\theta) = \frac{1}{n}\sum_{i=1}^{n} \ell(f_\theta(\mathbf{x}_i), y_i) + \lambda R(\theta)$$

---

## 凸函数与凸优化

### 凸集的定义

一个集合 $C$ 是凸集，当且仅当对于任意 $x, y \in C$ 和 $\theta \in [0, 1]$：

$$\theta x + (1-\theta)y \in C$$

直观理解：集合内任意两点的连线都在集合内。

```python
import numpy as np
import matplotlib.pyplot as plt

def visualize_convex_set():
    """可视化凸集与非凸集"""
    fig, axes = plt.subplots(1, 2, figsize=(12, 5))

    # 凸集：圆
    theta = np.linspace(0, 2*np.pi, 100)
    x_circle = np.cos(theta)
    y_circle = np.sin(theta)

    axes[0].fill(x_circle, y_circle, alpha=0.3, color='blue')
    axes[0].plot(x_circle, y_circle, 'b-', linewidth=2)
    # 展示任意两点连线在集合内
    axes[0].plot([-0.5, 0.7], [0.3, -0.4], 'r-', linewidth=2, label='任意连线')
    axes[0].scatter([-0.5, 0.7], [0.3, -0.4], color='red', s=100, zorder=5)
    axes[0].set_title('凸集示例（圆）', fontsize=14)
    axes[0].set_aspect('equal')
    axes[0].legend()

    # 非凸集：星形
    angles = np.linspace(0, 2*np.pi, 11)[:-1]
    radii = np.array([1, 0.4, 1, 0.4, 1, 0.4, 1, 0.4, 1, 0.4])
    x_star = radii * np.cos(angles)
    y_star = radii * np.sin(angles)

    axes[1].fill(x_star, y_star, alpha=0.3, color='orange')
    axes[1].plot(np.append(x_star, x_star[0]),
                 np.append(y_star, y_star[0]), 'orange', linewidth=2)
    # 展示连线可能在集合外
    axes[1].plot([-0.8, 0.8], [0.3, 0.3], 'r--', linewidth=2, label='连线（部分在外）')
    axes[1].scatter([-0.8, 0.8], [0.3, 0.3], color='red', s=100, zorder=5)
    axes[1].set_title('非凸集示例（星形）', fontsize=14)
    axes[1].set_aspect('equal')
    axes[1].legend()

    plt.tight_layout()
    plt.savefig('convex_sets.png', dpi=150, bbox_inches='tight')
    plt.show()
```

### 凸函数的定义

函数 $f: \mathbb{R}^n \rightarrow \mathbb{R}$ 是凸函数，当且仅当对于任意 $x, y$ 和 $\theta \in [0, 1]$：

$$f(\theta x + (1-\theta)y) \leq \theta f(x) + (1-\theta)f(y)$$

**几何意义**：函数图像上任意两点的连线都在函数图像的上方（或重合）。

**严格凸函数**：上述不等式严格成立（$<$），保证全局最优解唯一。

### 凸函数的判定条件

**一阶条件**（可微函数）：

函数 $f$ 是凸函数，当且仅当对于所有 $x, y$：

$$f(y) \geq f(x) + \nabla f(x)^T(y - x)$$

**二阶条件**（二阶可微函数）：

函数 $f$ 是凸函数，当且仅当海森矩阵半正定：

$$\nabla^2 f(x) \succeq 0, \quad \forall x$$

```python
import numpy as np
from numpy.linalg import eigvals

def is_convex_function(hessian_func, x_samples):
    """
    通过检查海森矩阵的半正定性判断凸性

    参数:
        hessian_func: 返回海森矩阵的函数
        x_samples: 采样点列表

    返回:
        bool: 是否为凸函数
    """
    for x in x_samples:
        H = hessian_func(x)
        eigenvalues = eigvals(H)
        if np.any(eigenvalues < -1e-10):  # 数值容差
            return False
    return True

# 示例：二次函数 f(x) = x^T A x + b^T x + c
def quadratic_hessian(A):
    """二次函数的海森矩阵就是 2A"""
    return lambda x: 2 * A

# 正定矩阵 -> 凸函数
A_convex = np.array([[2, 0], [0, 3]])
print(f"正定矩阵情况：特征值 = {eigvals(2*A_convex)}")  # 都是正数

# 不定矩阵 -> 非凸函数
A_nonconvex = np.array([[2, 0], [0, -1]])
print(f"不定矩阵情况：特征值 = {eigvals(2*A_nonconvex)}")  # 有正有负
```

### 常见凸函数

| 函数 | 表达式 | 备注 |
|------|--------|------|
| 线性函数 | $f(x) = a^Tx + b$ | 既凸又凹 |
| 二次函数 | $f(x) = x^TAx + b^Tx + c$ | $A \succeq 0$ 时凸 |
| 指数函数 | $f(x) = e^{ax}$ | 对任意 $a$ 都凸 |
| 负对数 | $f(x) = -\log x$ | $x > 0$ |
| 范数 | $f(x) = \|x\|_p$ | 对任意 $p \geq 1$ |
| 对数和指数 | $f(x) = \log(\sum_i e^{x_i})$ | Log-Sum-Exp |

### 凸优化问题的性质

**核心定理**：凸优化问题的任何局部最优解都是全局最优解。

这是凸优化在机器学习中如此重要的原因：
- 线性回归、逻辑回归、SVM等都是凸优化问题
- 可以使用高效的凸优化算法求解
- 收敛到的解一定是最优解

```python
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

def visualize_convex_vs_nonconvex():
    """可视化凸函数与非凸函数的优化景观"""
    fig = plt.figure(figsize=(14, 5))

    x = np.linspace(-3, 3, 100)
    y = np.linspace(-3, 3, 100)
    X, Y = np.meshgrid(x, y)

    # 凸函数：二次函数
    Z_convex = X**2 + Y**2

    ax1 = fig.add_subplot(121, projection='3d')
    ax1.plot_surface(X, Y, Z_convex, cmap='viridis', alpha=0.8)
    ax1.set_title('凸函数：$f(x,y) = x^2 + y^2$\n唯一全局最优点', fontsize=12)
    ax1.set_xlabel('x')
    ax1.set_ylabel('y')
    ax1.set_zlabel('f(x,y)')

    # 非凸函数：Rastrigin函数
    A = 10
    Z_nonconvex = A*2 + (X**2 - A*np.cos(2*np.pi*X)) + (Y**2 - A*np.cos(2*np.pi*Y))

    ax2 = fig.add_subplot(122, projection='3d')
    ax2.plot_surface(X, Y, Z_nonconvex, cmap='plasma', alpha=0.8)
    ax2.set_title('非凸函数：Rastrigin函数\n多个局部最优点', fontsize=12)
    ax2.set_xlabel('x')
    ax2.set_ylabel('y')
    ax2.set_zlabel('f(x,y)')

    plt.tight_layout()
    plt.savefig('convex_vs_nonconvex.png', dpi=150, bbox_inches='tight')
    plt.show()
```

---

## 梯度下降法

### 基本原理

梯度下降是最基础的一阶优化算法。核心思想是：沿着目标函数梯度的反方向迭代更新参数。

**更新规则：**

$$\theta_{t+1} = \theta_t - \eta \nabla f(\theta_t)$$

其中：
- $\theta_t$ 是第 $t$ 次迭代的参数
- $\eta$ 是学习率（步长）
- $\nabla f(\theta_t)$ 是目标函数在 $\theta_t$ 处的梯度

### 梯度下降的直观理解

梯度 $\nabla f(x)$ 指向函数增长最快的方向，因此负梯度方向是函数下降最快的方向。

```python
import numpy as np
import matplotlib.pyplot as plt

def gradient_descent_visualization():
    """可视化梯度下降过程"""
    # 目标函数：f(x, y) = x^2 + 2y^2
    def f(x, y):
        return x**2 + 2*y**2

    def grad_f(x, y):
        return np.array([2*x, 4*y])

    # 梯度下降
    def gradient_descent(start, lr=0.1, n_iters=20):
        path = [start.copy()]
        point = start.copy()

        for _ in range(n_iters):
            grad = grad_f(point[0], point[1])
            point = point - lr * grad
            path.append(point.copy())

        return np.array(path)

    # 可视化
    fig, ax = plt.subplots(figsize=(10, 8))

    # 等高线图
    x = np.linspace(-3, 3, 100)
    y = np.linspace(-3, 3, 100)
    X, Y = np.meshgrid(x, y)
    Z = f(X, Y)

    contours = ax.contour(X, Y, Z, levels=20, cmap='viridis')
    ax.clabel(contours, inline=True, fontsize=8)

    # 梯度下降路径
    start = np.array([2.5, 2.0])
    path = gradient_descent(start, lr=0.15, n_iters=15)

    ax.plot(path[:, 0], path[:, 1], 'ro-', markersize=8, linewidth=2,
            label='梯度下降路径')
    ax.plot(start[0], start[1], 'g^', markersize=15, label='起始点')
    ax.plot(0, 0, 'b*', markersize=20, label='最优点')

    ax.set_xlabel('x', fontsize=12)
    ax.set_ylabel('y', fontsize=12)
    ax.set_title('梯度下降可视化：$f(x,y) = x^2 + 2y^2$', fontsize=14)
    ax.legend(fontsize=10)
    ax.set_aspect('equal')

    plt.savefig('gradient_descent.png', dpi=150, bbox_inches='tight')
    plt.show()

    return path
```

### 批量梯度下降（Batch Gradient Descent）

使用全部训练数据计算梯度：

$$\theta_{t+1} = \theta_t - \eta \frac{1}{n}\sum_{i=1}^{n}\nabla_\theta \ell(f_\theta(x_i), y_i)$$

**优点：**
- 梯度估计准确
- 收敛稳定

**缺点：**
- 计算成本高（每次迭代需要遍历全部数据）
- 不适合大规模数据集
- 难以逃离鞍点

```python
import numpy as np

class BatchGradientDescent:
    """批量梯度下降实现"""

    def __init__(self, learning_rate=0.01, max_iters=1000, tol=1e-6):
        self.lr = learning_rate
        self.max_iters = max_iters
        self.tol = tol
        self.history = {'loss': [], 'params': []}

    def fit(self, X, y, loss_func, grad_func, init_params):
        """
        参数:
            X: 特征矩阵 (n_samples, n_features)
            y: 标签向量 (n_samples,)
            loss_func: 损失函数 loss_func(params, X, y)
            grad_func: 梯度函数 grad_func(params, X, y)
            init_params: 初始参数
        """
        params = init_params.copy()
        n_samples = X.shape[0]

        for i in range(self.max_iters):
            # 计算全批量梯度
            gradient = grad_func(params, X, y)

            # 更新参数
            params = params - self.lr * gradient

            # 记录历史
            loss = loss_func(params, X, y)
            self.history['loss'].append(loss)
            self.history['params'].append(params.copy())

            # 收敛检查
            if np.linalg.norm(gradient) < self.tol:
                print(f"收敛于第 {i+1} 次迭代")
                break

        return params

# 示例：线性回归
def mse_loss(w, X, y):
    predictions = X @ w
    return np.mean((predictions - y) ** 2)

def mse_gradient(w, X, y):
    predictions = X @ w
    return 2 * X.T @ (predictions - y) / len(y)

# 生成数据
np.random.seed(42)
X = np.column_stack([np.ones(100), np.random.randn(100, 2)])
true_w = np.array([1, 2, -1])
y = X @ true_w + 0.1 * np.random.randn(100)

# 训练
bgd = BatchGradientDescent(learning_rate=0.1, max_iters=100)
init_w = np.zeros(3)
final_w = bgd.fit(X, y, mse_loss, mse_gradient, init_w)

print(f"真实参数: {true_w}")
print(f"学习到的参数: {final_w}")
```

### 收敛性分析

对于 $L$-光滑的凸函数（梯度满足Lipschitz条件），批量梯度下降的收敛率为：

$$f(\theta_t) - f(\theta^*) \leq \frac{L\|\theta_0 - \theta^*\|^2}{2t}$$

这意味着收敛速度是 $O(1/t)$，需要 $O(1/\epsilon)$ 次迭代达到 $\epsilon$ 精度。

---

## 随机梯度下降（SGD）

### 基本思想

每次迭代只使用一个样本（或小批量样本）来估计梯度：

$$\theta_{t+1} = \theta_t - \eta \nabla_\theta \ell(f_\theta(x_i), y_i)$$

其中 $i$ 是随机选取的样本索引。

### 小批量随机梯度下降（Mini-batch SGD）

实践中最常用的形式，使用一个小批量数据估计梯度：

$$\theta_{t+1} = \theta_t - \eta \frac{1}{|B|}\sum_{i \in B}\nabla_\theta \ell(f_\theta(x_i), y_i)$$

其中 $B$ 是随机采样的批量（batch）。

```python
import numpy as np

class MiniBatchSGD:
    """小批量随机梯度下降实现"""

    def __init__(self, learning_rate=0.01, batch_size=32,
                 max_epochs=100, shuffle=True):
        self.lr = learning_rate
        self.batch_size = batch_size
        self.max_epochs = max_epochs
        self.shuffle = shuffle
        self.history = {'loss': [], 'epoch_loss': []}

    def fit(self, X, y, loss_func, grad_func, init_params):
        params = init_params.copy()
        n_samples = X.shape[0]

        for epoch in range(self.max_epochs):
            # 打乱数据
            if self.shuffle:
                indices = np.random.permutation(n_samples)
                X_shuffled = X[indices]
                y_shuffled = y[indices]
            else:
                X_shuffled, y_shuffled = X, y

            epoch_losses = []

            # 遍历所有批量
            for start_idx in range(0, n_samples, self.batch_size):
                end_idx = min(start_idx + self.batch_size, n_samples)
                X_batch = X_shuffled[start_idx:end_idx]
                y_batch = y_shuffled[start_idx:end_idx]

                # 计算小批量梯度
                gradient = grad_func(params, X_batch, y_batch)

                # 更新参数
                params = params - self.lr * gradient

                # 记录损失
                batch_loss = loss_func(params, X_batch, y_batch)
                self.history['loss'].append(batch_loss)
                epoch_losses.append(batch_loss)

            # 记录每个epoch的平均损失
            avg_epoch_loss = np.mean(epoch_losses)
            self.history['epoch_loss'].append(avg_epoch_loss)

            if (epoch + 1) % 10 == 0:
                print(f"Epoch {epoch+1}/{self.max_epochs}, Loss: {avg_epoch_loss:.6f}")

        return params

# 比较批量GD和小批量SGD
def compare_optimizers():
    np.random.seed(42)
    n_samples = 1000
    X = np.column_stack([np.ones(n_samples), np.random.randn(n_samples, 5)])
    true_w = np.array([1, 2, -1, 0.5, -0.3, 1.5])
    y = X @ true_w + 0.1 * np.random.randn(n_samples)

    init_w = np.zeros(6)

    # 批量GD
    bgd = BatchGradientDescent(learning_rate=0.01, max_iters=100)
    w_bgd = bgd.fit(X, y, mse_loss, mse_gradient, init_w.copy())

    # 小批量SGD
    sgd = MiniBatchSGD(learning_rate=0.01, batch_size=32, max_epochs=100)
    w_sgd = sgd.fit(X, y, mse_loss, mse_gradient, init_w.copy())

    print(f"\n真实参数: {true_w}")
    print(f"批量GD结果: {w_bgd}")
    print(f"SGD结果: {w_sgd}")
```

### SGD的优缺点

**优点：**
- 计算效率高，适合大规模数据
- 随机性有助于逃离局部最优和鞍点
- 可以进行在线学习

**缺点：**
- 收敛路径震荡
- 需要仔细调整学习率
- 梯度估计有噪声

### SGD的收敛性

对于凸函数，使用适当的学习率衰减策略（如 $\eta_t = O(1/\sqrt{t})$），SGD的期望收敛率为：

$$\mathbb{E}[f(\bar{\theta}_T)] - f(\theta^*) \leq O\left(\frac{1}{\sqrt{T}}\right)$$

---

## 动量方法

### 动量法（Momentum）

动量法通过累积历史梯度信息来加速收敛，减少震荡。

**更新规则：**

$$v_t = \gamma v_{t-1} + \eta \nabla f(\theta_t)$$
$$\theta_{t+1} = \theta_t - v_t$$

其中 $\gamma$（通常取0.9）是动量系数。

**直观理解**：像一个小球在损失函数曲面上滚动，积累速度。

```python
import numpy as np

class MomentumSGD:
    """带动量的SGD实现"""

    def __init__(self, learning_rate=0.01, momentum=0.9,
                 batch_size=32, max_epochs=100):
        self.lr = learning_rate
        self.momentum = momentum
        self.batch_size = batch_size
        self.max_epochs = max_epochs
        self.history = {'loss': []}

    def fit(self, X, y, loss_func, grad_func, init_params):
        params = init_params.copy()
        velocity = np.zeros_like(params)
        n_samples = X.shape[0]

        for epoch in range(self.max_epochs):
            indices = np.random.permutation(n_samples)
            X_shuffled = X[indices]
            y_shuffled = y[indices]

            for start_idx in range(0, n_samples, self.batch_size):
                end_idx = min(start_idx + self.batch_size, n_samples)
                X_batch = X_shuffled[start_idx:end_idx]
                y_batch = y_shuffled[start_idx:end_idx]

                gradient = grad_func(params, X_batch, y_batch)

                # 动量更新
                velocity = self.momentum * velocity + self.lr * gradient
                params = params - velocity

                loss = loss_func(params, X_batch, y_batch)
                self.history['loss'].append(loss)

        return params
```

### Nesterov加速梯度（NAG）

Nesterov动量是动量法的改进版本，先根据动量"预测"下一步位置，再计算梯度。

**更新规则：**

$$v_t = \gamma v_{t-1} + \eta \nabla f(\theta_t - \gamma v_{t-1})$$
$$\theta_{t+1} = \theta_t - v_t$$

**优点**：收敛更快，震荡更小。

```python
class NesterovMomentum:
    """Nesterov加速梯度实现"""

    def __init__(self, learning_rate=0.01, momentum=0.9,
                 batch_size=32, max_epochs=100):
        self.lr = learning_rate
        self.momentum = momentum
        self.batch_size = batch_size
        self.max_epochs = max_epochs
        self.history = {'loss': []}

    def fit(self, X, y, loss_func, grad_func, init_params):
        params = init_params.copy()
        velocity = np.zeros_like(params)
        n_samples = X.shape[0]

        for epoch in range(self.max_epochs):
            indices = np.random.permutation(n_samples)

            for start_idx in range(0, n_samples, self.batch_size):
                end_idx = min(start_idx + self.batch_size, n_samples)
                X_batch = X[indices[start_idx:end_idx]]
                y_batch = y[indices[start_idx:end_idx]]

                # Nesterov: 先"展望"，再计算梯度
                params_lookahead = params - self.momentum * velocity
                gradient = grad_func(params_lookahead, X_batch, y_batch)

                velocity = self.momentum * velocity + self.lr * gradient
                params = params - velocity

                self.history['loss'].append(loss_func(params, X_batch, y_batch))

        return params
```

### 动量法可视化

```python
def visualize_momentum_effect():
    """可视化动量对优化路径的影响"""
    # Rosenbrock函数（非凸，有狭长山谷）
    def rosenbrock(x, y):
        return (1 - x)**2 + 100 * (y - x**2)**2

    def rosenbrock_grad(point):
        x, y = point
        dx = -2*(1-x) - 400*x*(y - x**2)
        dy = 200*(y - x**2)
        return np.array([dx, dy])

    # SGD（无动量）
    def sgd_path(start, lr=0.0001, n_iters=500):
        path = [start.copy()]
        point = start.copy()
        for _ in range(n_iters):
            grad = rosenbrock_grad(point)
            point = point - lr * grad
            path.append(point.copy())
        return np.array(path)

    # SGD with Momentum
    def momentum_path(start, lr=0.0001, momentum=0.9, n_iters=500):
        path = [start.copy()]
        point = start.copy()
        velocity = np.zeros(2)
        for _ in range(n_iters):
            grad = rosenbrock_grad(point)
            velocity = momentum * velocity + lr * grad
            point = point - velocity
            path.append(point.copy())
        return np.array(path)

    # 可视化
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))

    x = np.linspace(-2, 2, 200)
    y = np.linspace(-1, 3, 200)
    X, Y = np.meshgrid(x, y)
    Z = rosenbrock(X, Y)

    start = np.array([-1.5, 2.0])

    for ax, optimizer, title in [
        (axes[0], sgd_path, 'SGD（无动量）'),
        (axes[1], momentum_path, 'SGD + 动量')
    ]:
        ax.contour(X, Y, Z, levels=np.logspace(-1, 3, 20), cmap='viridis')
        path = optimizer(start)
        ax.plot(path[:, 0], path[:, 1], 'r.-', markersize=2, linewidth=1,
                label=f'优化路径 ({len(path)}步)')
        ax.plot(start[0], start[1], 'go', markersize=10, label='起点')
        ax.plot(1, 1, 'b*', markersize=15, label='最优点(1,1)')
        ax.set_title(title, fontsize=14)
        ax.legend()
        ax.set_xlabel('x')
        ax.set_ylabel('y')

    plt.tight_layout()
    plt.savefig('momentum_comparison.png', dpi=150, bbox_inches='tight')
    plt.show()
```

---

## 自适应学习率方法

### AdaGrad

自适应地调整每个参数的学习率，对频繁更新的参数使用较小的学习率。

**更新规则：**

$$G_t = G_{t-1} + g_t^2$$
$$\theta_{t+1} = \theta_t - \frac{\eta}{\sqrt{G_t + \epsilon}} \odot g_t$$

其中 $g_t = \nabla f(\theta_t)$，$\epsilon$ 是防止除零的小常数。

**问题**：$G_t$ 单调递增，学习率会逐渐趋近于零。

```python
class AdaGrad:
    """AdaGrad优化器实现"""

    def __init__(self, learning_rate=0.01, epsilon=1e-8,
                 batch_size=32, max_epochs=100):
        self.lr = learning_rate
        self.epsilon = epsilon
        self.batch_size = batch_size
        self.max_epochs = max_epochs
        self.history = {'loss': []}

    def fit(self, X, y, loss_func, grad_func, init_params):
        params = init_params.copy()
        G = np.zeros_like(params)  # 梯度平方累积
        n_samples = X.shape[0]

        for epoch in range(self.max_epochs):
            indices = np.random.permutation(n_samples)

            for start_idx in range(0, n_samples, self.batch_size):
                end_idx = min(start_idx + self.batch_size, n_samples)
                X_batch = X[indices[start_idx:end_idx]]
                y_batch = y[indices[start_idx:end_idx]]

                gradient = grad_func(params, X_batch, y_batch)

                # AdaGrad更新
                G = G + gradient ** 2
                adjusted_lr = self.lr / (np.sqrt(G) + self.epsilon)
                params = params - adjusted_lr * gradient

                self.history['loss'].append(loss_func(params, X_batch, y_batch))

        return params
```

### RMSprop

解决AdaGrad学习率衰减过快的问题，使用指数移动平均。

**更新规则：**

$$G_t = \gamma G_{t-1} + (1-\gamma) g_t^2$$
$$\theta_{t+1} = \theta_t - \frac{\eta}{\sqrt{G_t + \epsilon}} g_t$$

通常 $\gamma = 0.9$。

```python
class RMSprop:
    """RMSprop优化器实现"""

    def __init__(self, learning_rate=0.001, decay_rate=0.9,
                 epsilon=1e-8, batch_size=32, max_epochs=100):
        self.lr = learning_rate
        self.decay_rate = decay_rate
        self.epsilon = epsilon
        self.batch_size = batch_size
        self.max_epochs = max_epochs
        self.history = {'loss': []}

    def fit(self, X, y, loss_func, grad_func, init_params):
        params = init_params.copy()
        G = np.zeros_like(params)  # 梯度平方的移动平均
        n_samples = X.shape[0]

        for epoch in range(self.max_epochs):
            indices = np.random.permutation(n_samples)

            for start_idx in range(0, n_samples, self.batch_size):
                end_idx = min(start_idx + self.batch_size, n_samples)
                X_batch = X[indices[start_idx:end_idx]]
                y_batch = y[indices[start_idx:end_idx]]

                gradient = grad_func(params, X_batch, y_batch)

                # RMSprop更新
                G = self.decay_rate * G + (1 - self.decay_rate) * gradient ** 2
                adjusted_lr = self.lr / (np.sqrt(G) + self.epsilon)
                params = params - adjusted_lr * gradient

                self.history['loss'].append(loss_func(params, X_batch, y_batch))

        return params
```

### Adam

Adam（Adaptive Moment Estimation）结合了动量和RMSprop的优点。

**更新规则：**

$$m_t = \beta_1 m_{t-1} + (1 - \beta_1) g_t$$
$$v_t = \beta_2 v_{t-1} + (1 - \beta_2) g_t^2$$

**偏差校正**（重要！）：

$$\hat{m}_t = \frac{m_t}{1 - \beta_1^t}$$
$$\hat{v}_t = \frac{v_t}{1 - \beta_2^t}$$

**参数更新：**

$$\theta_{t+1} = \theta_t - \frac{\eta}{\sqrt{\hat{v}_t} + \epsilon} \hat{m}_t$$

**默认超参数**：$\beta_1 = 0.9$，$\beta_2 = 0.999$，$\epsilon = 10^{-8}$。

```python
class Adam:
    """Adam优化器实现"""

    def __init__(self, learning_rate=0.001, beta1=0.9, beta2=0.999,
                 epsilon=1e-8, batch_size=32, max_epochs=100):
        self.lr = learning_rate
        self.beta1 = beta1
        self.beta2 = beta2
        self.epsilon = epsilon
        self.batch_size = batch_size
        self.max_epochs = max_epochs
        self.history = {'loss': []}

    def fit(self, X, y, loss_func, grad_func, init_params):
        params = init_params.copy()
        m = np.zeros_like(params)  # 一阶矩估计
        v = np.zeros_like(params)  # 二阶矩估计
        t = 0
        n_samples = X.shape[0]

        for epoch in range(self.max_epochs):
            indices = np.random.permutation(n_samples)

            for start_idx in range(0, n_samples, self.batch_size):
                t += 1
                end_idx = min(start_idx + self.batch_size, n_samples)
                X_batch = X[indices[start_idx:end_idx]]
                y_batch = y[indices[start_idx:end_idx]]

                gradient = grad_func(params, X_batch, y_batch)

                # 更新一阶和二阶矩估计
                m = self.beta1 * m + (1 - self.beta1) * gradient
                v = self.beta2 * v + (1 - self.beta2) * gradient ** 2

                # 偏差校正
                m_hat = m / (1 - self.beta1 ** t)
                v_hat = v / (1 - self.beta2 ** t)

                # 参数更新
                params = params - self.lr * m_hat / (np.sqrt(v_hat) + self.epsilon)

                self.history['loss'].append(loss_func(params, X_batch, y_batch))

        return params
```

### AdamW

AdamW对权重衰减进行了解耦，是目前训练Transformer等大模型的首选优化器。

**与Adam的区别**：权重衰减直接作用于参数，而不是通过L2正则化加入损失函数。

$$\theta_{t+1} = \theta_t - \eta\left(\frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \epsilon} + \lambda \theta_t\right)$$

```python
class AdamW:
    """AdamW优化器实现"""

    def __init__(self, learning_rate=0.001, beta1=0.9, beta2=0.999,
                 epsilon=1e-8, weight_decay=0.01, batch_size=32, max_epochs=100):
        self.lr = learning_rate
        self.beta1 = beta1
        self.beta2 = beta2
        self.epsilon = epsilon
        self.weight_decay = weight_decay
        self.batch_size = batch_size
        self.max_epochs = max_epochs
        self.history = {'loss': []}

    def fit(self, X, y, loss_func, grad_func, init_params):
        params = init_params.copy()
        m = np.zeros_like(params)
        v = np.zeros_like(params)
        t = 0
        n_samples = X.shape[0]

        for epoch in range(self.max_epochs):
            indices = np.random.permutation(n_samples)

            for start_idx in range(0, n_samples, self.batch_size):
                t += 1
                end_idx = min(start_idx + self.batch_size, n_samples)
                X_batch = X[indices[start_idx:end_idx]]
                y_batch = y[indices[start_idx:end_idx]]

                gradient = grad_func(params, X_batch, y_batch)

                # Adam部分
                m = self.beta1 * m + (1 - self.beta1) * gradient
                v = self.beta2 * v + (1 - self.beta2) * gradient ** 2

                m_hat = m / (1 - self.beta1 ** t)
                v_hat = v / (1 - self.beta2 ** t)

                # AdamW: 解耦的权重衰减
                adam_update = m_hat / (np.sqrt(v_hat) + self.epsilon)
                params = params - self.lr * (adam_update + self.weight_decay * params)

                self.history['loss'].append(loss_func(params, X_batch, y_batch))

        return params
```

### 优化器比较

| 优化器 | 优点 | 缺点 | 适用场景 |
|--------|------|------|----------|
| SGD | 简单，泛化性好 | 收敛慢，需调参 | 计算机视觉 |
| SGD+Momentum | 加速收敛 | 可能冲过最优点 | 通用 |
| AdaGrad | 自适应学习率 | 学习率趋于零 | 稀疏特征 |
| RMSprop | 解决AdaGrad问题 | 可能不稳定 | RNN |
| Adam | 收敛快，鲁棒 | 可能泛化差 | 默认选择 |
| AdamW | 更好的正则化 | 需要调weight_decay | Transformer |

```python
def compare_optimizers_visual():
    """可视化比较不同优化器"""
    import matplotlib.pyplot as plt

    # 生成数据
    np.random.seed(42)
    n = 500
    X = np.column_stack([np.ones(n), np.random.randn(n, 3)])
    true_w = np.array([1, 2, -1, 0.5])
    y = X @ true_w + 0.1 * np.random.randn(n)
    init_w = np.zeros(4)

    optimizers = {
        'SGD': MiniBatchSGD(learning_rate=0.01, batch_size=32, max_epochs=50),
        'Momentum': MomentumSGD(learning_rate=0.01, momentum=0.9, batch_size=32, max_epochs=50),
        'RMSprop': RMSprop(learning_rate=0.01, batch_size=32, max_epochs=50),
        'Adam': Adam(learning_rate=0.01, batch_size=32, max_epochs=50),
    }

    fig, ax = plt.subplots(figsize=(12, 6))

    for name, optimizer in optimizers.items():
        optimizer.fit(X, y, mse_loss, mse_gradient, init_w.copy())

        # 平滑损失曲线
        losses = optimizer.history['loss']
        window = 50
        smoothed = np.convolve(losses, np.ones(window)/window, mode='valid')
        ax.plot(smoothed, label=name, linewidth=2)

    ax.set_xlabel('迭代次数', fontsize=12)
    ax.set_ylabel('损失', fontsize=12)
    ax.set_title('不同优化器的收敛曲线比较', fontsize=14)
    ax.legend(fontsize=10)
    ax.set_yscale('log')
    ax.grid(True, alpha=0.3)

    plt.savefig('optimizer_comparison.png', dpi=150, bbox_inches='tight')
    plt.show()
```

---

## 学习率调度

### 为什么需要学习率调度

- **初期**：较大的学习率帮助快速探索
- **后期**：较小的学习率帮助精细调整

### 常用调度策略

#### 阶梯衰减（Step Decay）

每隔固定步数，将学习率乘以衰减因子：

$$\eta_t = \eta_0 \times \gamma^{\lfloor t / s \rfloor}$$

```python
class StepLRScheduler:
    """阶梯学习率调度器"""

    def __init__(self, initial_lr, step_size, gamma=0.1):
        self.initial_lr = initial_lr
        self.step_size = step_size
        self.gamma = gamma

    def get_lr(self, epoch):
        return self.initial_lr * (self.gamma ** (epoch // self.step_size))

# 示例
scheduler = StepLRScheduler(initial_lr=0.1, step_size=30, gamma=0.1)
for epoch in [0, 29, 30, 59, 60]:
    print(f"Epoch {epoch}: lr = {scheduler.get_lr(epoch):.4f}")
```

#### 指数衰减（Exponential Decay）

$$\eta_t = \eta_0 \times \gamma^t$$

```python
class ExponentialLRScheduler:
    """指数学习率调度器"""

    def __init__(self, initial_lr, gamma=0.95):
        self.initial_lr = initial_lr
        self.gamma = gamma

    def get_lr(self, epoch):
        return self.initial_lr * (self.gamma ** epoch)
```

#### 余弦退火（Cosine Annealing）

$$\eta_t = \eta_{min} + \frac{1}{2}(\eta_{max} - \eta_{min})\left(1 + \cos\left(\frac{t}{T}\pi\right)\right)$$

```python
import numpy as np

class CosineAnnealingScheduler:
    """余弦退火学习率调度器"""

    def __init__(self, initial_lr, T_max, eta_min=0):
        self.initial_lr = initial_lr
        self.T_max = T_max
        self.eta_min = eta_min

    def get_lr(self, epoch):
        return self.eta_min + 0.5 * (self.initial_lr - self.eta_min) * \
               (1 + np.cos(np.pi * epoch / self.T_max))
```

#### 带热重启的余弦退火（Cosine Annealing with Warm Restarts）

周期性地重置学习率，有助于跳出局部最优。

```python
class CosineAnnealingWarmRestarts:
    """带热重启的余弦退火"""

    def __init__(self, initial_lr, T_0, T_mult=1, eta_min=0):
        self.initial_lr = initial_lr
        self.T_0 = T_0
        self.T_mult = T_mult
        self.eta_min = eta_min

    def get_lr(self, epoch):
        T_cur = epoch
        T_i = self.T_0

        # 找到当前周期
        while T_cur >= T_i:
            T_cur -= T_i
            T_i *= self.T_mult

        return self.eta_min + 0.5 * (self.initial_lr - self.eta_min) * \
               (1 + np.cos(np.pi * T_cur / T_i))
```

#### 学习率预热（Warmup）

从很小的学习率开始，逐渐增加到目标学习率。

```python
class WarmupScheduler:
    """学习率预热调度器"""

    def __init__(self, target_lr, warmup_epochs, total_epochs):
        self.target_lr = target_lr
        self.warmup_epochs = warmup_epochs
        self.total_epochs = total_epochs

    def get_lr(self, epoch):
        if epoch < self.warmup_epochs:
            # 线性预热
            return self.target_lr * (epoch + 1) / self.warmup_epochs
        else:
            # 预热后使用余弦退火
            progress = (epoch - self.warmup_epochs) / (self.total_epochs - self.warmup_epochs)
            return self.target_lr * 0.5 * (1 + np.cos(np.pi * progress))
```

### 可视化学习率调度

```python
def visualize_lr_schedules():
    """可视化不同学习率调度策略"""
    epochs = 100
    initial_lr = 0.1

    schedulers = {
        'Step Decay': StepLRScheduler(initial_lr, step_size=30, gamma=0.1),
        'Exponential': ExponentialLRScheduler(initial_lr, gamma=0.95),
        'Cosine Annealing': CosineAnnealingScheduler(initial_lr, T_max=epochs),
        'Warmup + Cosine': WarmupScheduler(initial_lr, warmup_epochs=10, total_epochs=epochs),
    }

    fig, ax = plt.subplots(figsize=(12, 6))

    for name, scheduler in schedulers.items():
        lrs = [scheduler.get_lr(e) for e in range(epochs)]
        ax.plot(lrs, label=name, linewidth=2)

    ax.set_xlabel('Epoch', fontsize=12)
    ax.set_ylabel('Learning Rate', fontsize=12)
    ax.set_title('学习率调度策略比较', fontsize=14)
    ax.legend(fontsize=10)
    ax.grid(True, alpha=0.3)

    plt.savefig('lr_schedules.png', dpi=150, bbox_inches='tight')
    plt.show()
```

---

## 约束优化与拉格朗日乘数法

### 约束优化问题

**一般形式：**

$$\min_{x} f(x)$$
$$\text{subject to } g_i(x) \leq 0, \quad i = 1, \ldots, m$$
$$\quad\quad\quad\quad h_j(x) = 0, \quad j = 1, \ldots, p$$

其中：
- $g_i(x) \leq 0$ 是不等式约束
- $h_j(x) = 0$ 是等式约束

### 拉格朗日函数

引入拉格朗日乘数 $\lambda_i$（不等式约束）和 $\mu_j$（等式约束）：

$$\mathcal{L}(x, \lambda, \mu) = f(x) + \sum_{i=1}^{m}\lambda_i g_i(x) + \sum_{j=1}^{p}\mu_j h_j(x)$$

### 等式约束的拉格朗日乘数法

**问题**：

$$\min_{x} f(x) \quad \text{s.t. } h(x) = 0$$

**必要条件**：

$$\nabla_x \mathcal{L} = \nabla f(x) + \mu \nabla h(x) = 0$$
$$h(x) = 0$$

**几何解释**：在最优点，目标函数的梯度与约束曲面的法向量平行。

```python
import numpy as np
from scipy.optimize import minimize

def lagrange_multiplier_example():
    """
    示例：最小化 f(x,y) = x^2 + y^2
    约束条件：x + y = 1
    """

    # 方法1：使用拉格朗日乘数法解析求解
    # L = x^2 + y^2 + mu*(x + y - 1)
    # dL/dx = 2x + mu = 0  =>  x = -mu/2
    # dL/dy = 2y + mu = 0  =>  y = -mu/2
    # x + y = 1  =>  -mu = 1  =>  mu = -1
    # 所以 x = y = 0.5

    print("解析解: x = 0.5, y = 0.5")
    print(f"最优值: f(0.5, 0.5) = {0.5**2 + 0.5**2}")

    # 方法2：使用scipy数值求解
    def objective(xy):
        return xy[0]**2 + xy[1]**2

    def constraint(xy):
        return xy[0] + xy[1] - 1

    from scipy.optimize import minimize

    result = minimize(
        objective,
        x0=[0, 0],
        constraints={'type': 'eq', 'fun': constraint},
        method='SLSQP'
    )

    print(f"\n数值解: x = {result.x[0]:.4f}, y = {result.x[1]:.4f}")
    print(f"最优值: {result.fun:.4f}")

lagrange_multiplier_example()
```

### SVM中的拉格朗日对偶

支持向量机是拉格朗日方法在机器学习中的经典应用。

**原问题**：

$$\min_{\mathbf{w}, b} \frac{1}{2}\|\mathbf{w}\|^2$$
$$\text{s.t. } y_i(\mathbf{w}^T\mathbf{x}_i + b) \geq 1, \quad i = 1, \ldots, n$$

**拉格朗日函数**：

$$\mathcal{L}(\mathbf{w}, b, \alpha) = \frac{1}{2}\|\mathbf{w}\|^2 - \sum_{i=1}^{n}\alpha_i[y_i(\mathbf{w}^T\mathbf{x}_i + b) - 1]$$

**对偶问题**：

$$\max_{\alpha} \sum_{i=1}^{n}\alpha_i - \frac{1}{2}\sum_{i,j}\alpha_i\alpha_j y_i y_j \mathbf{x}_i^T\mathbf{x}_j$$
$$\text{s.t. } \alpha_i \geq 0, \quad \sum_{i=1}^{n}\alpha_i y_i = 0$$

```python
import numpy as np
from sklearn.svm import SVC
from sklearn.datasets import make_classification
import matplotlib.pyplot as plt

def svm_lagrange_demo():
    """演示SVM与拉格朗日乘数"""
    # 生成二分类数据
    X, y = make_classification(n_samples=100, n_features=2,
                               n_redundant=0, n_clusters_per_class=1,
                               random_state=42)
    y = 2 * y - 1  # 转换为 {-1, 1}

    # 训练SVM
    svm = SVC(kernel='linear', C=1.0)
    svm.fit(X, y)

    # 获取支持向量的拉格朗日乘数
    print(f"支持向量数量: {len(svm.support_)}")
    print(f"对偶系数 (alpha * y): {svm.dual_coef_}")

    # 可视化
    fig, ax = plt.subplots(figsize=(10, 8))

    # 绘制决策边界
    xlim = ax.get_xlim()
    ylim = ax.get_ylim()
    xx, yy = np.meshgrid(np.linspace(X[:, 0].min()-1, X[:, 0].max()+1, 100),
                         np.linspace(X[:, 1].min()-1, X[:, 1].max()+1, 100))
    Z = svm.decision_function(np.c_[xx.ravel(), yy.ravel()])
    Z = Z.reshape(xx.shape)

    ax.contour(xx, yy, Z, levels=[-1, 0, 1], linestyles=['--', '-', '--'],
               colors='k')
    ax.contourf(xx, yy, Z, levels=[-np.inf, 0, np.inf], alpha=0.2,
                colors=['blue', 'red'])

    # 绘制数据点
    ax.scatter(X[y == 1, 0], X[y == 1, 1], c='red', marker='o',
               label='正类', edgecolors='k')
    ax.scatter(X[y == -1, 0], X[y == -1, 1], c='blue', marker='s',
               label='负类', edgecolors='k')

    # 标记支持向量
    ax.scatter(svm.support_vectors_[:, 0], svm.support_vectors_[:, 1],
               s=200, facecolors='none', edgecolors='green', linewidths=2,
               label='支持向量')

    ax.set_xlabel('$x_1$', fontsize=12)
    ax.set_ylabel('$x_2$', fontsize=12)
    ax.set_title('SVM与拉格朗日乘数', fontsize=14)
    ax.legend()

    plt.savefig('svm_lagrange.png', dpi=150, bbox_inches='tight')
    plt.show()
```

---

## KKT条件

### KKT条件概述

Karush-Kuhn-Tucker（KKT）条件是约束优化问题最优解的必要条件（对于凸优化问题也是充分条件）。

对于问题：

$$\min_x f(x) \quad \text{s.t. } g_i(x) \leq 0, h_j(x) = 0$$

### KKT条件的四个部分

1. **原始可行性（Primal Feasibility）**：
   $$g_i(x^*) \leq 0, \quad h_j(x^*) = 0$$

2. **对偶可行性（Dual Feasibility）**：
   $$\lambda_i^* \geq 0$$

3. **互补松弛性（Complementary Slackness）**：
   $$\lambda_i^* g_i(x^*) = 0$$

4. **梯度条件（Stationarity）**：
   $$\nabla f(x^*) + \sum_i \lambda_i^* \nabla g_i(x^*) + \sum_j \mu_j^* \nabla h_j(x^*) = 0$$

### 互补松弛性的含义

$$\lambda_i^* g_i(x^*) = 0$$

这意味着：
- 若 $\lambda_i^* > 0$，则 $g_i(x^*) = 0$（约束紧致）
- 若 $g_i(x^*) < 0$，则 $\lambda_i^* = 0$（约束不起作用）

### KKT条件应用示例

```python
import numpy as np
from scipy.optimize import minimize

def kkt_conditions_example():
    """
    示例问题：
    min f(x,y) = (x-2)^2 + (y-1)^2
    s.t. x + y <= 2
         x >= 0
         y >= 0
    """

    def objective(xy):
        x, y = xy
        return (x - 2)**2 + (y - 1)**2

    def objective_gradient(xy):
        x, y = xy
        return np.array([2*(x - 2), 2*(y - 1)])

    # 约束定义（scipy要求不等式约束形式为 >= 0）
    constraints = [
        {'type': 'ineq', 'fun': lambda xy: 2 - xy[0] - xy[1]},  # x + y <= 2
        {'type': 'ineq', 'fun': lambda xy: xy[0]},              # x >= 0
        {'type': 'ineq', 'fun': lambda xy: xy[1]},              # y >= 0
    ]

    # 求解
    result = minimize(
        objective,
        x0=[0, 0],
        method='SLSQP',
        constraints=constraints,
        jac=objective_gradient
    )

    x_opt, y_opt = result.x
    print(f"最优解: x = {x_opt:.4f}, y = {y_opt:.4f}")
    print(f"最优值: {result.fun:.4f}")

    # 验证KKT条件
    print("\n验证KKT条件:")

    # 原始可行性
    print(f"1. 原始可行性:")
    print(f"   x + y = {x_opt + y_opt:.4f} <= 2 ✓")
    print(f"   x = {x_opt:.4f} >= 0 ✓")
    print(f"   y = {y_opt:.4f} >= 0 ✓")

    # 检查哪些约束是紧致的
    print(f"\n2. 约束紧致性:")
    print(f"   x + y - 2 = {x_opt + y_opt - 2:.4f}")

    # 梯度条件
    grad = objective_gradient(result.x)
    print(f"\n3. 目标函数梯度: {grad}")

kkt_conditions_example()
```

### L1正则化与KKT

L1正则化导致稀疏解的数学解释与KKT条件密切相关。

$$\min_w \frac{1}{2}\|\mathbf{Xw} - \mathbf{y}\|^2 + \lambda\|\mathbf{w}\|_1$$

等价于：

$$\min_w \frac{1}{2}\|\mathbf{Xw} - \mathbf{y}\|^2 \quad \text{s.t. } \|\mathbf{w}\|_1 \leq t$$

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.linear_model import Lasso, Ridge
from sklearn.datasets import make_regression

def l1_sparsity_demo():
    """演示L1正则化的稀疏性"""
    # 生成数据（只有少数特征真正有用）
    np.random.seed(42)
    n_samples, n_features = 100, 20
    n_informative = 5

    X, y, true_coef = make_regression(
        n_samples=n_samples,
        n_features=n_features,
        n_informative=n_informative,
        coef=True,
        noise=10,
        random_state=42
    )

    # 不同正则化强度
    alphas = [0.01, 0.1, 1.0, 10.0]

    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    axes = axes.ravel()

    for ax, alpha in zip(axes, alphas):
        # L1 (Lasso)
        lasso = Lasso(alpha=alpha)
        lasso.fit(X, y)

        # L2 (Ridge)
        ridge = Ridge(alpha=alpha)
        ridge.fit(X, y)

        # 可视化系数
        x_pos = np.arange(n_features)
        width = 0.35

        ax.bar(x_pos - width/2, np.abs(lasso.coef_), width,
               label='L1 (Lasso)', alpha=0.7)
        ax.bar(x_pos + width/2, np.abs(ridge.coef_), width,
               label='L2 (Ridge)', alpha=0.7)

        ax.set_xlabel('特征索引')
        ax.set_ylabel('系数绝对值')
        ax.set_title(f'alpha = {alpha}\n'
                     f'L1非零系数: {np.sum(np.abs(lasso.coef_) > 1e-5)}, '
                     f'L2非零系数: {np.sum(np.abs(ridge.coef_) > 1e-5)}')
        ax.legend()
        ax.set_xticks(x_pos[::2])

    plt.tight_layout()
    plt.savefig('l1_sparsity.png', dpi=150, bbox_inches='tight')
    plt.show()
```

---

## 实战代码示例

### PyTorch中的优化器使用

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import numpy as np
import matplotlib.pyplot as plt

# 创建一个简单的神经网络
class SimpleNN(nn.Module):
    def __init__(self, input_dim, hidden_dim, output_dim):
        super().__init__()
        self.fc1 = nn.Linear(input_dim, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.fc3 = nn.Linear(hidden_dim, output_dim)
        self.relu = nn.ReLU()

    def forward(self, x):
        x = self.relu(self.fc1(x))
        x = self.relu(self.fc2(x))
        return self.fc3(x)

# 训练函数
def train_with_optimizer(model, optimizer, scheduler, train_loader,
                         n_epochs=50, device='cpu'):
    model = model.to(device)
    criterion = nn.MSELoss()
    history = {'loss': [], 'lr': []}

    for epoch in range(n_epochs):
        model.train()
        epoch_loss = 0

        for batch_x, batch_y in train_loader:
            batch_x, batch_y = batch_x.to(device), batch_y.to(device)

            optimizer.zero_grad()
            outputs = model(batch_x)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()

            epoch_loss += loss.item()

        avg_loss = epoch_loss / len(train_loader)
        current_lr = optimizer.param_groups[0]['lr']
        history['loss'].append(avg_loss)
        history['lr'].append(current_lr)

        if scheduler is not None:
            scheduler.step()

        if (epoch + 1) % 10 == 0:
            print(f"Epoch {epoch+1}/{n_epochs}, Loss: {avg_loss:.6f}, LR: {current_lr:.6f}")

    return history

# 比较不同优化器
def compare_pytorch_optimizers():
    # 生成回归数据
    np.random.seed(42)
    torch.manual_seed(42)

    n_samples = 1000
    X = np.random.randn(n_samples, 10).astype(np.float32)
    y = (X @ np.random.randn(10, 1) + 0.1 * np.random.randn(n_samples, 1)).astype(np.float32)

    dataset = TensorDataset(torch.from_numpy(X), torch.from_numpy(y))
    train_loader = DataLoader(dataset, batch_size=32, shuffle=True)

    # 不同优化器配置
    optimizer_configs = {
        'SGD': lambda params: optim.SGD(params, lr=0.01),
        'SGD+Momentum': lambda params: optim.SGD(params, lr=0.01, momentum=0.9),
        'Adam': lambda params: optim.Adam(params, lr=0.001),
        'AdamW': lambda params: optim.AdamW(params, lr=0.001, weight_decay=0.01),
        'RMSprop': lambda params: optim.RMSprop(params, lr=0.001),
    }

    results = {}

    for name, opt_func in optimizer_configs.items():
        print(f"\n训练使用 {name}:")
        model = SimpleNN(10, 64, 1)
        optimizer = opt_func(model.parameters())

        # 使用余弦退火调度器
        scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=50)

        history = train_with_optimizer(model, optimizer, scheduler, train_loader)
        results[name] = history

    # 可视化
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    for name, history in results.items():
        ax1.plot(history['loss'], label=name, linewidth=2)

    ax1.set_xlabel('Epoch')
    ax1.set_ylabel('Loss')
    ax1.set_title('不同优化器的损失曲线')
    ax1.legend()
    ax1.set_yscale('log')
    ax1.grid(True, alpha=0.3)

    for name, history in results.items():
        ax2.plot(history['lr'], label=name, linewidth=2)

    ax2.set_xlabel('Epoch')
    ax2.set_ylabel('Learning Rate')
    ax2.set_title('学习率变化')
    ax2.legend()
    ax2.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig('pytorch_optimizers.png', dpi=150, bbox_inches='tight')
    plt.show()

    return results
```

### 自定义优化器

```python
import torch
from torch.optim import Optimizer

class CustomAdam(Optimizer):
    """自定义Adam优化器实现"""

    def __init__(self, params, lr=1e-3, betas=(0.9, 0.999),
                 eps=1e-8, weight_decay=0):
        defaults = dict(lr=lr, betas=betas, eps=eps, weight_decay=weight_decay)
        super().__init__(params, defaults)

    @torch.no_grad()
    def step(self, closure=None):
        loss = None
        if closure is not None:
            with torch.enable_grad():
                loss = closure()

        for group in self.param_groups:
            for p in group['params']:
                if p.grad is None:
                    continue

                grad = p.grad
                if grad.is_sparse:
                    raise RuntimeError('CustomAdam不支持稀疏梯度')

                state = self.state[p]

                # 状态初始化
                if len(state) == 0:
                    state['step'] = 0
                    state['exp_avg'] = torch.zeros_like(p)
                    state['exp_avg_sq'] = torch.zeros_like(p)

                exp_avg, exp_avg_sq = state['exp_avg'], state['exp_avg_sq']
                beta1, beta2 = group['betas']

                state['step'] += 1

                # 权重衰减
                if group['weight_decay'] != 0:
                    grad = grad.add(p, alpha=group['weight_decay'])

                # 更新一阶和二阶矩估计
                exp_avg.mul_(beta1).add_(grad, alpha=1 - beta1)
                exp_avg_sq.mul_(beta2).addcmul_(grad, grad, value=1 - beta2)

                # 偏差校正
                bias_correction1 = 1 - beta1 ** state['step']
                bias_correction2 = 1 - beta2 ** state['step']

                step_size = group['lr'] / bias_correction1
                denom = (exp_avg_sq.sqrt() / (bias_correction2 ** 0.5)).add_(group['eps'])

                # 参数更新
                p.addcdiv_(exp_avg, denom, value=-step_size)

        return loss

# 使用自定义优化器
def test_custom_optimizer():
    model = SimpleNN(10, 64, 1)
    optimizer = CustomAdam(model.parameters(), lr=0.001)

    # 简单测试
    x = torch.randn(32, 10)
    y = torch.randn(32, 1)

    for i in range(10):
        optimizer.zero_grad()
        output = model(x)
        loss = ((output - y) ** 2).mean()
        loss.backward()
        optimizer.step()

        print(f"Step {i+1}, Loss: {loss.item():.6f}")
```

### 约束优化实践

```python
import numpy as np
from scipy.optimize import minimize, LinearConstraint, NonlinearConstraint

def portfolio_optimization():
    """
    投资组合优化问题
    最小化组合风险（方差），同时满足收益和投资约束
    """
    np.random.seed(42)

    # 5种资产
    n_assets = 5
    asset_names = ['股票A', '股票B', '债券C', '房产D', '黄金E']

    # 预期收益率
    expected_returns = np.array([0.12, 0.10, 0.05, 0.08, 0.06])

    # 协方差矩阵（资产间相关性）
    cov_matrix = np.array([
        [0.04, 0.02, 0.01, 0.015, 0.01],
        [0.02, 0.03, 0.005, 0.01, 0.008],
        [0.01, 0.005, 0.01, 0.005, 0.003],
        [0.015, 0.01, 0.005, 0.025, 0.007],
        [0.01, 0.008, 0.003, 0.007, 0.015]
    ])

    # 目标函数：最小化组合方差
    def portfolio_variance(weights):
        return weights @ cov_matrix @ weights

    def portfolio_variance_gradient(weights):
        return 2 * cov_matrix @ weights

    # 约束1：权重之和为1
    weight_sum_constraint = LinearConstraint(
        np.ones(n_assets), lb=1, ub=1
    )

    # 约束2：预期收益率至少8%
    target_return = 0.08
    return_constraint = LinearConstraint(
        expected_returns, lb=target_return, ub=np.inf
    )

    # 约束3：每个资产权重在[0, 0.4]之间（不允许做空，单一资产不超过40%）
    bounds = [(0, 0.4) for _ in range(n_assets)]

    # 初始猜测：等权重
    initial_weights = np.ones(n_assets) / n_assets

    # 求解
    result = minimize(
        portfolio_variance,
        initial_weights,
        method='SLSQP',
        jac=portfolio_variance_gradient,
        bounds=bounds,
        constraints=[
            {'type': 'eq', 'fun': lambda w: np.sum(w) - 1},
            {'type': 'ineq', 'fun': lambda w: expected_returns @ w - target_return}
        ]
    )

    optimal_weights = result.x
    optimal_variance = result.fun
    optimal_return = expected_returns @ optimal_weights
    optimal_std = np.sqrt(optimal_variance)

    print("=" * 50)
    print("投资组合优化结果")
    print("=" * 50)
    print("\n最优权重分配:")
    for name, weight in zip(asset_names, optimal_weights):
        print(f"  {name}: {weight*100:.2f}%")

    print(f"\n组合预期收益率: {optimal_return*100:.2f}%")
    print(f"组合标准差（风险）: {optimal_std*100:.2f}%")
    print(f"夏普比率（假设无风险利率3%）: {(optimal_return - 0.03) / optimal_std:.2f}")

    # 可视化有效前沿
    plot_efficient_frontier(expected_returns, cov_matrix, n_assets)

    return optimal_weights

def plot_efficient_frontier(returns, cov_matrix, n_assets):
    """绘制有效前沿"""
    target_returns = np.linspace(min(returns), max(returns), 50)
    portfolio_stds = []
    portfolio_weights_list = []

    for target in target_returns:
        def variance(w):
            return w @ cov_matrix @ w

        result = minimize(
            variance,
            np.ones(n_assets) / n_assets,
            method='SLSQP',
            bounds=[(0, 1) for _ in range(n_assets)],
            constraints=[
                {'type': 'eq', 'fun': lambda w: np.sum(w) - 1},
                {'type': 'eq', 'fun': lambda w, t=target: returns @ w - t}
            ]
        )

        if result.success:
            portfolio_stds.append(np.sqrt(result.fun))
            portfolio_weights_list.append(result.x)
        else:
            portfolio_stds.append(np.nan)

    fig, ax = plt.subplots(figsize=(10, 6))

    ax.plot(portfolio_stds, target_returns * 100, 'b-', linewidth=2, label='有效前沿')
    ax.scatter([np.sqrt(cov_matrix[i, i]) for i in range(n_assets)],
               returns * 100, marker='o', s=100, c='red', label='单一资产')

    ax.set_xlabel('风险（标准差）%', fontsize=12)
    ax.set_ylabel('预期收益率 %', fontsize=12)
    ax.set_title('投资组合有效前沿', fontsize=14)
    ax.legend()
    ax.grid(True, alpha=0.3)

    plt.savefig('efficient_frontier.png', dpi=150, bbox_inches='tight')
    plt.show()
```

---

## 面试要点

### 基础概念

**Q1: 什么是凸优化？为什么凸优化在机器学习中很重要？**

凸优化是目标函数为凸函数、可行域为凸集的优化问题。其核心性质是：任何局部最优解都是全局最优解。

重要性：
- 线性回归、逻辑回归、SVM等经典模型都是凸优化问题
- 可以使用高效的凸优化算法保证找到全局最优解
- 凸优化理论为理解非凸优化（如神经网络）提供了基础

**Q2: 解释梯度下降法的原理和收敛条件**

原理：沿着目标函数梯度的反方向迭代更新参数，因为负梯度方向是函数下降最快的方向。

收敛条件：
- 学习率足够小（对于L-光滑函数，$\eta < 2/L$）
- 对于凸函数，保证收敛到全局最优
- 对于非凸函数，收敛到驻点（梯度为零的点）

**Q3: 批量梯度下降、随机梯度下降和小批量梯度下降的区别？**

| 方法 | 每次迭代使用的样本 | 梯度估计 | 收敛特点 |
|------|-------------------|---------|---------|
| BGD | 全部数据 | 精确 | 稳定但慢 |
| SGD | 单个样本 | 噪声大 | 快但震荡 |
| Mini-batch | 小批量样本 | 折中 | 最常用 |

### 优化器相关

**Q4: Adam优化器的原理是什么？为什么广泛使用？**

Adam结合了动量（一阶矩估计）和RMSprop（二阶矩估计）：
- 一阶矩：梯度的指数移动平均，提供动量效果
- 二阶矩：梯度平方的指数移动平均，自适应调整学习率
- 偏差校正：修正初始阶段的偏差

优势：
- 对超参数不敏感，默认值就能工作良好
- 适合大多数问题，收敛快
- 自适应学习率，不同参数使用不同步长

**Q5: 动量方法如何帮助优化？**

动量通过累积历史梯度：
- 在梯度方向一致时加速（如平坦区域）
- 在梯度方向变化时减速（如震荡区域）
- 有助于逃离局部最优和鞍点

**Q6: 为什么需要学习率调度？常用策略有哪些？**

原因：
- 初期需要大学习率快速探索
- 后期需要小学习率精细调整

常用策略：
- 阶梯衰减：每隔固定epoch衰减
- 余弦退火：平滑下降
- Warmup：从小学习率开始逐渐增加
- 自适应：根据验证集性能调整

### 约束优化

**Q7: 什么是拉格朗日乘数法？KKT条件是什么？**

拉格朗日乘数法：将约束优化问题转化为无约束问题，通过引入乘数将约束条件加入目标函数。

KKT条件是约束优化问题最优解的必要条件，包括：
1. 原始可行性：满足所有约束
2. 对偶可行性：不等式约束的乘数非负
3. 互补松弛性：乘数与约束的乘积为零
4. 梯度条件：拉格朗日函数对原变量的梯度为零

**Q8: L1正则化为什么能产生稀疏解？**

从KKT条件角度：
- L1正则化等价于约束$\|\mathbf{w}\|_1 \leq t$
- 约束区域是菱形（顶点在坐标轴上）
- 等高线与菱形的交点更可能在顶点（某些坐标为零）

从次梯度角度：
- L1在零点不可导
- 次梯度为$[-1, 1]$区间
- 当梯度落入此区间时，解停留在零点

### 实践问题

**Q9: 训练神经网络时如何选择优化器和学习率？**

优化器选择：
- 默认使用Adam/AdamW
- 计算机视觉常用SGD+Momentum
- Transformer使用AdamW

学习率选择：
- 使用学习率finder找到合适范围
- 配合warmup和余弦退火
- 关注验证集性能，必要时调整

**Q10: 如何诊断和解决优化问题？**

常见问题和解决方案：

| 问题 | 现象 | 解决方案 |
|------|------|---------|
| 学习率过大 | 损失震荡或发散 | 减小学习率 |
| 学习率过小 | 收敛极慢 | 增大学习率 |
| 梯度消失 | 深层梯度接近零 | 残差连接、BatchNorm |
| 梯度爆炸 | 梯度值极大 | 梯度裁剪 |
| 陷入鞍点 | 损失停滞 | 使用动量、更大batch |

---

## 延伸阅读

### 推荐书籍

1. **《Convex Optimization》** - Stephen Boyd, Lieven Vandenberghe
   - 凸优化领域的经典教材
   - 免费在线版本：https://web.stanford.edu/~boyd/cvxbook/

2. **《Numerical Optimization》** - Jorge Nocedal, Stephen Wright
   - 全面覆盖数值优化方法
   - 包含大量实际算法细节

3. **《Optimization for Machine Learning》** - Suvrit Sra等
   - 专注于机器学习中的优化问题

4. **《Deep Learning》** - Ian Goodfellow等
   - 第8章详细介绍深度学习优化

### 在线资源

1. **Stanford CS229** - 机器学习课程
   - 包含优化理论基础

2. **Stanford EE364a** - 凸优化课程
   - Boyd教授的经典课程
   - 视频和作业免费开放

3. **fast.ai** - 实用深度学习
   - 包含优化器选择的实践指导

### 经典论文

1. **Adam**: Kingma & Ba, "Adam: A Method for Stochastic Optimization", 2014
2. **AdamW**: Loshchilov & Hutter, "Decoupled Weight Decay Regularization", 2017
3. **Learning Rate Warmup**: Goyal et al., "Accurate, Large Minibatch SGD", 2017
4. **Cosine Annealing**: Loshchilov & Hutter, "SGDR: Stochastic Gradient Descent with Warm Restarts", 2016
5. **Gradient Clipping**: Pascanu et al., "On the difficulty of training recurrent neural networks", 2013

### 进阶主题

- **二阶优化方法**：牛顿法、拟牛顿法（L-BFGS）
- **分布式优化**：数据并行、模型并行
- **神经网络优化理论**：损失曲面分析、泛化理论
- **AutoML中的优化**：超参数优化、神经架构搜索
- **在线凸优化**：后悔界、对抗学习

---

## 总结

优化理论是机器学习的核心基础。本文覆盖了以下关键内容：

1. **凸优化基础**：凸函数、凸集的定义与判定，凸优化的重要性

2. **梯度下降家族**：
   - 批量梯度下降：精确但慢
   - 随机梯度下降：快但震荡
   - 小批量SGD：实践中的最佳选择

3. **高级优化器**：
   - 动量方法：加速收敛
   - AdaGrad/RMSprop：自适应学习率
   - Adam/AdamW：结合两者优点

4. **学习率调度**：预热、阶梯衰减、余弦退火

5. **约束优化**：拉格朗日乘数法、KKT条件

掌握这些知识不仅有助于理解机器学习算法的工作原理，也能帮助在实践中更有效地训练模型。建议读者结合代码示例进行实践，加深对理论的理解。
