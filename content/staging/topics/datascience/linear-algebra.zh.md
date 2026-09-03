---
title: 机器学习数学基础：线性代数
description: 掌握机器学习必备的线性代数知识：向量空间、矩阵运算、特征值分解和SVD
track: datascience
section: statistics
difficulty: intermediate
tags:
  - 线性代数
  - 数学
  - 机器学习
  - SVD
status: imported
origin: old/src/content/docs/datascience/linear-algebra.zh.md
divergence: 0.193
issues:
  - title-lang-en
  - title-language
legacy:
  category: DataScience
  subcategory: Math
  order: 1
  lastUpdated: 2026-01-07
---

线性代数是机器学习最重要的数学基础之一。从数据表示到模型优化，从降维算法到神经网络，线性代数无处不在。本文将系统介绍机器学习中常用的线性代数知识，并通过 NumPy 代码展示其实际应用。

## 向量空间与基

### 向量的基本概念

在机器学习中，向量是数据的基本表示形式。一个 n 维向量可以表示一个数据点的 n 个特征。

```python
import numpy as np

# 向量的表示
# 行向量
row_vector = np.array([1, 2, 3])
print(f"行向量: {row_vector}, 形状: {row_vector.shape}")

# 列向量
col_vector = np.array([[1], [2], [3]])
print(f"列向量:\n{col_vector}, 形状: {col_vector.shape}")

# 在机器学习中，通常使用列向量表示数据点
# 例如：一个有3个特征的样本
sample = np.array([[170],   # 身高 (cm)
                   [65],    # 体重 (kg)
                   [25]])   # 年龄
print(f"样本向量:\n{sample}")
```

### 向量运算

```python
# 向量加法
a = np.array([1, 2, 3])
b = np.array([4, 5, 6])
print(f"向量加法: a + b = {a + b}")

# 标量乘法
c = 2
print(f"标量乘法: {c} * a = {c * a}")

# 向量点积（内积）
dot_product = np.dot(a, b)  # 或 a @ b 或 np.inner(a, b)
print(f"点积: a · b = {dot_product}")  # 1*4 + 2*5 + 3*6 = 32

# 向量范数
# L1 范数（曼哈顿距离）
l1_norm = np.linalg.norm(a, ord=1)
print(f"L1 范数: ||a||_1 = {l1_norm}")  # |1| + |2| + |3| = 6

# L2 范数（欧几里得距离）
l2_norm = np.linalg.norm(a, ord=2)
print(f"L2 范数: ||a||_2 = {l2_norm:.4f}")  # sqrt(1^2 + 2^2 + 3^2)

# 无穷范数
inf_norm = np.linalg.norm(a, ord=np.inf)
print(f"无穷范数: ||a||_∞ = {inf_norm}")  # max(|1|, |2|, |3|) = 3

# 向量规范化（单位向量）
unit_vector = a / np.linalg.norm(a)
print(f"单位向量: {unit_vector}")
print(f"单位向量的范数: {np.linalg.norm(unit_vector):.4f}")  # 1.0
```

### 向量空间与子空间

向量空间是满足加法和标量乘法封闭性的向量集合。机器学习中，数据通常存在于高维向量空间中。

```python
# 线性组合
v1 = np.array([1, 0, 0])
v2 = np.array([0, 1, 0])
v3 = np.array([0, 0, 1])

# 任意向量都可以表示为基向量的线性组合
target = np.array([3, 4, 5])
# target = 3*v1 + 4*v2 + 5*v3
coefficients = np.array([3, 4, 5])
reconstructed = coefficients[0]*v1 + coefficients[1]*v2 + coefficients[2]*v3
print(f"线性组合重构: {reconstructed}")

# 线性无关性检验
# 如果矩阵的秩等于向量个数，则向量组线性无关
vectors = np.array([[1, 0, 0],
                    [0, 1, 0],
                    [0, 0, 1]])
rank = np.linalg.matrix_rank(vectors)
print(f"矩阵秩: {rank}")
print(f"向量组{'线性无关' if rank == 3 else '线性相关'}")
```

### 基与维度

基是向量空间中线性无关的向量组，可以张成整个空间。

```python
# 标准基（正交基）
e1 = np.array([1, 0])
e2 = np.array([0, 1])

# 非标准基
b1 = np.array([1, 1])
b2 = np.array([1, -1])

# 验证 b1, b2 可以作为 R^2 的基
basis_matrix = np.column_stack([b1, b2])
print(f"基矩阵:\n{basis_matrix}")
print(f"基矩阵的秩: {np.linalg.matrix_rank(basis_matrix)}")

# 坐标变换：将标准基下的坐标转换到新基下
point_standard = np.array([3, 1])  # 标准基下的坐标

# 求新基下的坐标：解 basis_matrix @ coords = point_standard
coords_new_basis = np.linalg.solve(basis_matrix, point_standard)
print(f"标准基下坐标: {point_standard}")
print(f"新基下坐标: {coords_new_basis}")

# 验证：用新坐标和新基重构原向量
reconstructed = coords_new_basis[0] * b1 + coords_new_basis[1] * b2
print(f"重构验证: {reconstructed}")
```

### 正交与正交基

正交性在机器学习中非常重要，正交基使得很多运算变得简单。

```python
# 判断向量正交
def are_orthogonal(v1, v2, tolerance=1e-10):
    """判断两个向量是否正交"""
    return abs(np.dot(v1, v2)) < tolerance

a = np.array([1, 0, 0])
b = np.array([0, 1, 0])
c = np.array([1, 1, 0])

print(f"a 和 b 正交: {are_orthogonal(a, b)}")  # True
print(f"a 和 c 正交: {are_orthogonal(a, c)}")  # False

# 施密特正交化（Gram-Schmidt）
def gram_schmidt(vectors):
    """施密特正交化过程"""
    orthogonal = []
    for v in vectors:
        # 减去在已有正交向量上的投影
        for u in orthogonal:
            v = v - (np.dot(v, u) / np.dot(u, u)) * u
        if np.linalg.norm(v) > 1e-10:  # 非零向量
            orthogonal.append(v)
    return np.array(orthogonal)

# 正交化一组向量
vectors = np.array([[1, 1, 0],
                    [1, 0, 1],
                    [0, 1, 1]], dtype=float)
orthogonal_vectors = gram_schmidt(vectors)
print(f"正交化后的向量:\n{orthogonal_vectors}")

# 验证正交性
print(f"v1·v2 = {np.dot(orthogonal_vectors[0], orthogonal_vectors[1]):.10f}")
print(f"v1·v3 = {np.dot(orthogonal_vectors[0], orthogonal_vectors[2]):.10f}")
print(f"v2·v3 = {np.dot(orthogonal_vectors[1], orthogonal_vectors[2]):.10f}")

# 正交归一化（单位正交基）
orthonormal_vectors = orthogonal_vectors / np.linalg.norm(orthogonal_vectors, axis=1, keepdims=True)
print(f"正交归一化向量:\n{orthonormal_vectors}")
```

## 矩阵运算

### 矩阵基础

在机器学习中，矩阵用于表示数据集（每行一个样本）、权重参数、变换等。

```python
# 矩阵创建
A = np.array([[1, 2, 3],
              [4, 5, 6]])
print(f"矩阵 A:\n{A}")
print(f"形状: {A.shape}")  # (2, 3) - 2行3列

# 特殊矩阵
identity = np.eye(3)  # 单位矩阵
zeros = np.zeros((2, 3))  # 零矩阵
ones = np.ones((2, 3))  # 全1矩阵
diag = np.diag([1, 2, 3])  # 对角矩阵

print(f"单位矩阵:\n{identity}")
print(f"对角矩阵:\n{diag}")

# 矩阵基本属性
A = np.array([[1, 2], [3, 4], [5, 6]])
print(f"转置 A^T:\n{A.T}")
print(f"迹 trace(A^T A): {np.trace(A.T @ A)}")  # 对角线元素之和
```

### 矩阵乘法

矩阵乘法是机器学习中最核心的运算。

```python
# 矩阵乘法
A = np.array([[1, 2],
              [3, 4]])
B = np.array([[5, 6],
              [7, 8]])

# 矩阵乘法（三种等价写法）
C1 = np.dot(A, B)
C2 = A @ B
C3 = np.matmul(A, B)
print(f"矩阵乘法 AB:\n{C1}")

# 注意：矩阵乘法不满足交换律
print(f"BA:\n{B @ A}")
print(f"AB == BA: {np.allclose(A @ B, B @ A)}")  # False

# 元素级乘法（Hadamard 积）
hadamard = A * B
print(f"Hadamard 积:\n{hadamard}")

# 矩阵-向量乘法
x = np.array([1, 2])
y = A @ x  # 矩阵左乘向量
print(f"Ax = {y}")

# 批量矩阵-向量乘法（机器学习中常见）
# 多个样本同时通过一个线性变换
samples = np.array([[1, 2],
                    [3, 4],
                    [5, 6]])  # 3个样本，每个2维
W = np.array([[0.5, -0.5],
              [0.3, 0.7]])  # 权重矩阵
# 每个样本 x 变换为 Wx
transformed = samples @ W.T  # (3, 2) @ (2, 2).T = (3, 2)
print(f"批量变换结果:\n{transformed}")
```

### 矩阵的逆与伪逆

```python
# 方阵的逆
A = np.array([[1, 2],
              [3, 4]])

# 判断是否可逆（行列式不为0）
det_A = np.linalg.det(A)
print(f"行列式 det(A) = {det_A}")

if abs(det_A) > 1e-10:
    A_inv = np.linalg.inv(A)
    print(f"逆矩阵 A^(-1):\n{A_inv}")

    # 验证 A @ A_inv = I
    print(f"A @ A^(-1):\n{A @ A_inv}")

# Moore-Penrose 伪逆（适用于非方阵和奇异矩阵）
B = np.array([[1, 2],
              [3, 4],
              [5, 6]])  # 3x2 矩阵，不可逆

B_pinv = np.linalg.pinv(B)
print(f"伪逆 B^+:\n{B_pinv}")
print(f"B^+ 的形状: {B_pinv.shape}")  # (2, 3)

# 伪逆的性质：B @ B^+ @ B = B
print(f"B @ B^+ @ B:\n{B @ B_pinv @ B}")
```

### 矩阵分解基础

```python
# LU 分解
from scipy.linalg import lu

A = np.array([[2, 1, 1],
              [4, 3, 3],
              [8, 7, 9]], dtype=float)

P, L, U = lu(A)
print(f"P (置换矩阵):\n{P}")
print(f"L (下三角):\n{L}")
print(f"U (上三角):\n{U}")
print(f"验证 P @ L @ U = A:\n{P @ L @ U}")

# QR 分解
A = np.array([[1, 2],
              [3, 4],
              [5, 6]], dtype=float)

Q, R = np.linalg.qr(A)
print(f"Q (正交矩阵):\n{Q}")
print(f"R (上三角矩阵):\n{R}")
print(f"验证 Q @ R = A:\n{Q @ R}")

# Q 的正交性验证
print(f"Q^T @ Q:\n{Q.T @ Q}")  # 应该接近单位矩阵
```

### 矩阵的秩与零空间

```python
# 矩阵的秩
A = np.array([[1, 2, 3],
              [4, 5, 6],
              [7, 8, 9]])

rank = np.linalg.matrix_rank(A)
print(f"矩阵 A:\n{A}")
print(f"秩: {rank}")  # 2，因为第三行是前两行的线性组合

# 满秩矩阵
B = np.array([[1, 0, 0],
              [0, 2, 0],
              [0, 0, 3]])
print(f"矩阵 B 的秩: {np.linalg.matrix_rank(B)}")  # 3

# 零空间（核空间）- 满足 Ax = 0 的所有 x
# 使用 SVD 计算零空间
def null_space(A, tol=1e-10):
    """计算矩阵的零空间"""
    U, S, Vh = np.linalg.svd(A)
    null_mask = (S <= tol)
    null = Vh[null_mask].T
    return null

A = np.array([[1, 2, 3],
              [4, 5, 6],
              [7, 8, 9]])
null = null_space(A)
if null.size > 0:
    print(f"零空间基:\n{null}")
    # 验证 A @ null ≈ 0
    print(f"A @ null:\n{A @ null}")
```

## 线性变换

### 线性变换的概念

线性变换是保持向量加法和标量乘法的映射，可以用矩阵表示。

```python
# 线性变换示例
import matplotlib.pyplot as plt

def plot_transformation(A, title):
    """可视化2D线性变换"""
    # 原始向量
    vectors = np.array([[1, 0], [0, 1], [1, 1], [-1, 1]])

    fig, axes = plt.subplots(1, 2, figsize=(12, 5))

    # 原始向量
    ax1 = axes[0]
    ax1.set_xlim(-3, 3)
    ax1.set_ylim(-3, 3)
    ax1.axhline(y=0, color='k', linewidth=0.5)
    ax1.axvline(x=0, color='k', linewidth=0.5)
    ax1.grid(True, alpha=0.3)
    for v in vectors:
        ax1.arrow(0, 0, v[0], v[1], head_width=0.1, head_length=0.1, fc='blue', ec='blue')
    ax1.set_title('原始向量')
    ax1.set_aspect('equal')

    # 变换后的向量
    ax2 = axes[1]
    ax2.set_xlim(-3, 3)
    ax2.set_ylim(-3, 3)
    ax2.axhline(y=0, color='k', linewidth=0.5)
    ax2.axvline(x=0, color='k', linewidth=0.5)
    ax2.grid(True, alpha=0.3)
    for v in vectors:
        tv = A @ v
        ax2.arrow(0, 0, tv[0], tv[1], head_width=0.1, head_length=0.1, fc='red', ec='red')
    ax2.set_title(f'变换后 ({title})')
    ax2.set_aspect('equal')

    plt.tight_layout()
    plt.savefig(f'transform_{title}.png', dpi=100, bbox_inches='tight')
    plt.close()

# 缩放变换
scale = np.array([[2, 0],
                  [0, 0.5]])
print(f"缩放矩阵:\n{scale}")

# 旋转变换（逆时针旋转 45 度）
theta = np.pi / 4
rotation = np.array([[np.cos(theta), -np.sin(theta)],
                     [np.sin(theta), np.cos(theta)]])
print(f"旋转矩阵 (45度):\n{rotation}")

# 剪切变换
shear = np.array([[1, 0.5],
                  [0, 1]])
print(f"剪切矩阵:\n{shear}")

# 反射变换（关于 x 轴）
reflection = np.array([[1, 0],
                       [0, -1]])
print(f"反射矩阵:\n{reflection}")

# 投影变换（投影到 x 轴）
projection = np.array([[1, 0],
                       [0, 0]])
print(f"投影矩阵:\n{projection}")
```

### 变换的组合

```python
# 变换的组合通过矩阵乘法实现
# 先旋转 45 度，再缩放

theta = np.pi / 4
R = np.array([[np.cos(theta), -np.sin(theta)],
              [np.sin(theta), np.cos(theta)]])

S = np.array([[2, 0],
              [0, 0.5]])

# 组合变换：先 R 后 S，矩阵从右到左作用
# T = S @ R 表示：先应用 R，再应用 S
T = S @ R
print(f"组合变换矩阵 T = S @ R:\n{T}")

# 验证
v = np.array([1, 0])
v_rotated = R @ v
v_final = S @ v_rotated
v_combined = T @ v
print(f"分步变换结果: {v_final}")
print(f"组合变换结果: {v_combined}")
print(f"结果相同: {np.allclose(v_final, v_combined)}")
```

### 线性变换在机器学习中的应用

```python
# 神经网络中的线性层
def linear_layer(X, W, b):
    """
    线性层：Y = XW^T + b
    X: (batch_size, input_dim) 输入数据
    W: (output_dim, input_dim) 权重矩阵
    b: (output_dim,) 偏置向量
    """
    return X @ W.T + b

# 示例：3个样本，4维输入，2维输出
np.random.seed(42)
X = np.random.randn(3, 4)  # 3个样本，4个特征
W = np.random.randn(2, 4)  # 输出2维
b = np.random.randn(2)     # 偏置

Y = linear_layer(X, W, b)
print(f"输入形状: {X.shape}")
print(f"输出形状: {Y.shape}")
print(f"输出:\n{Y}")

# 数据标准化也是一种线性变换
def standardize(X):
    """Z-score 标准化"""
    mean = X.mean(axis=0)
    std = X.std(axis=0)
    return (X - mean) / std

X_std = standardize(X)
print(f"标准化后均值: {X_std.mean(axis=0)}")  # 接近0
print(f"标准化后标准差: {X_std.std(axis=0)}")  # 接近1
```

## 特征值与特征向量

### 特征值分解的概念

特征值和特征向量是理解矩阵的关键。对于方阵 A，如果存在非零向量 v 和标量 lambda 使得：

$$Av = \lambda v$$

则 lambda 是特征值，v 是对应的特征向量。

```python
# 计算特征值和特征向量
A = np.array([[4, 2],
              [1, 3]])

eigenvalues, eigenvectors = np.linalg.eig(A)
print(f"矩阵 A:\n{A}")
print(f"特征值: {eigenvalues}")
print(f"特征向量:\n{eigenvectors}")

# 验证 Av = λv
for i in range(len(eigenvalues)):
    lam = eigenvalues[i]
    v = eigenvectors[:, i]
    Av = A @ v
    lam_v = lam * v
    print(f"\n特征值 λ{i+1} = {lam:.4f}")
    print(f"特征向量 v{i+1} = {v}")
    print(f"Av = {Av}")
    print(f"λv = {lam_v}")
    print(f"验证通过: {np.allclose(Av, lam_v)}")
```

### 特征值的几何意义

```python
# 特征向量表示变换的主方向
# 特征值表示在该方向上的缩放因子

def visualize_eigenvectors(A):
    """可视化特征向量"""
    eigenvalues, eigenvectors = np.linalg.eig(A)

    # 生成圆上的点
    theta = np.linspace(0, 2*np.pi, 100)
    circle = np.array([np.cos(theta), np.sin(theta)])

    # 变换后的椭圆
    ellipse = A @ circle

    plt.figure(figsize=(10, 5))

    # 原始圆和变换后的椭圆
    plt.subplot(1, 2, 1)
    plt.plot(circle[0], circle[1], 'b-', label='原始单位圆')
    plt.plot(ellipse[0], ellipse[1], 'r-', label='变换后')

    # 绘制特征向量
    for i in range(len(eigenvalues)):
        v = eigenvectors[:, i].real
        lam = eigenvalues[i].real
        plt.arrow(0, 0, v[0], v[1], head_width=0.1, head_length=0.05,
                  fc='green', ec='green', linewidth=2)
        plt.arrow(0, 0, lam*v[0], lam*v[1], head_width=0.1, head_length=0.05,
                  fc='orange', ec='orange', linewidth=2, linestyle='--')

    plt.xlim(-4, 4)
    plt.ylim(-4, 4)
    plt.grid(True, alpha=0.3)
    plt.axis('equal')
    plt.legend()
    plt.title('特征向量的几何意义')

    plt.subplot(1, 2, 2)
    # 显示矩阵信息
    info = f"矩阵 A:\n{A}\n\n"
    info += f"特征值:\nλ1 = {eigenvalues[0]:.3f}\nλ2 = {eigenvalues[1]:.3f}\n\n"
    info += f"特征向量:\nv1 = {eigenvectors[:, 0]}\nv2 = {eigenvectors[:, 1]}"
    plt.text(0.1, 0.5, info, fontsize=12, family='monospace',
             transform=plt.gca().transAxes, verticalalignment='center')
    plt.axis('off')

    plt.tight_layout()
    plt.savefig('eigenvectors_visualization.png', dpi=100, bbox_inches='tight')
    plt.close()

# 示例
A = np.array([[3, 1],
              [1, 3]])
# visualize_eigenvectors(A)
eigenvalues, eigenvectors = np.linalg.eig(A)
print(f"特征值: {eigenvalues}")  # [4, 2]
print(f"特征向量:\n{eigenvectors}")
```

### 对称矩阵的特征值分解

对称矩阵在机器学习中非常常见（如协方差矩阵），它有很好的性质。

```python
# 对称矩阵的特征值分解
# 对称矩阵的特征值都是实数，特征向量正交

# 创建对称矩阵（协方差矩阵）
np.random.seed(42)
X = np.random.randn(100, 3)  # 100个样本，3个特征
cov_matrix = np.cov(X.T)
print(f"协方差矩阵:\n{cov_matrix}")
print(f"是否对称: {np.allclose(cov_matrix, cov_matrix.T)}")

# 特征值分解
eigenvalues, eigenvectors = np.linalg.eigh(cov_matrix)  # eigh 用于对称矩阵
print(f"\n特征值: {eigenvalues}")
print(f"特征向量:\n{eigenvectors}")

# 验证特征向量正交
print(f"\n特征向量正交性验证 (V^T V):\n{eigenvectors.T @ eigenvectors}")

# 谱分解：A = V @ diag(λ) @ V^T
Lambda = np.diag(eigenvalues)
A_reconstructed = eigenvectors @ Lambda @ eigenvectors.T
print(f"\n谱分解重构误差: {np.linalg.norm(cov_matrix - A_reconstructed):.2e}")
```

### 特征值在机器学习中的应用

```python
# 判断矩阵的正定性（优化问题中很重要）
def is_positive_definite(A):
    """判断矩阵是否正定"""
    try:
        eigenvalues = np.linalg.eigvalsh(A)
        return np.all(eigenvalues > 0)
    except:
        return False

# 正定矩阵示例
A_pd = np.array([[2, -1],
                 [-1, 2]])
print(f"矩阵 A 正定: {is_positive_definite(A_pd)}")
print(f"特征值: {np.linalg.eigvalsh(A_pd)}")  # 都为正

# 矩阵的条件数（数值稳定性）
def condition_number(A):
    """计算矩阵的条件数"""
    eigenvalues = np.abs(np.linalg.eigvals(A))
    return np.max(eigenvalues) / np.min(eigenvalues)

A = np.array([[1, 2],
              [1.001, 2]])  # 病态矩阵
print(f"\n条件数: {condition_number(A):.2f}")
print(f"NumPy 条件数: {np.linalg.cond(A):.2f}")

# 幂迭代法求最大特征值
def power_iteration(A, num_iterations=100):
    """幂迭代法求最大特征值和对应特征向量"""
    n = A.shape[0]
    v = np.random.rand(n)
    v = v / np.linalg.norm(v)

    for _ in range(num_iterations):
        Av = A @ v
        v = Av / np.linalg.norm(Av)

    eigenvalue = v @ A @ v
    return eigenvalue, v

A = np.array([[4, 2],
              [1, 3]])
max_eigenvalue, max_eigenvector = power_iteration(A)
print(f"\n幂迭代法结果:")
print(f"最大特征值: {max_eigenvalue:.4f}")
print(f"对应特征向量: {max_eigenvector}")

# 验证
true_eigenvalues = np.linalg.eigvals(A)
print(f"真实最大特征值: {np.max(true_eigenvalues):.4f}")
```

## 特征值分解（EVD）

### 特征值分解的定义

对于可对角化的方阵 A，特征值分解表示为：

$$A = V \Lambda V^{-1}$$

其中 V 是特征向量矩阵，Lambda 是特征值对角矩阵。

```python
# 特征值分解
A = np.array([[4, 2],
              [1, 3]])

eigenvalues, V = np.linalg.eig(A)
Lambda = np.diag(eigenvalues)

print(f"矩阵 A:\n{A}")
print(f"特征值 Λ:\n{Lambda}")
print(f"特征向量矩阵 V:\n{V}")

# 重构 A = V @ Λ @ V^(-1)
V_inv = np.linalg.inv(V)
A_reconstructed = V @ Lambda @ V_inv
print(f"\n重构的 A:\n{A_reconstructed.real}")
print(f"重构误差: {np.linalg.norm(A - A_reconstructed):.2e}")
```

### 对称矩阵的特征值分解

对称矩阵的特征值分解更简单，因为特征向量正交：

$$A = V \Lambda V^T$$

```python
# 对称矩阵的特征值分解
A = np.array([[4, 2, 0],
              [2, 5, 3],
              [0, 3, 6]])

print(f"对称矩阵 A:\n{A}")
print(f"验证对称性: {np.allclose(A, A.T)}")

# 使用 eigh 进行对称矩阵分解
eigenvalues, V = np.linalg.eigh(A)
Lambda = np.diag(eigenvalues)

print(f"\n特征值: {eigenvalues}")
print(f"特征向量矩阵 V:\n{V}")

# 验证正交性 V^T V = I
print(f"\nV^T V:\n{V.T @ V}")

# 重构 A = V Λ V^T
A_reconstructed = V @ Lambda @ V.T
print(f"\n重构误差: {np.linalg.norm(A - A_reconstructed):.2e}")
```

### 矩阵的幂运算

特征值分解使得矩阵幂运算变得简单：

$$A^n = V \Lambda^n V^{-1}$$

```python
# 矩阵的幂运算
A = np.array([[2, 1],
              [1, 2]])

eigenvalues, V = np.linalg.eig(A)
V_inv = np.linalg.inv(V)

# 计算 A^10
n = 10
Lambda_n = np.diag(eigenvalues ** n)
A_n = V @ Lambda_n @ V_inv

print(f"A^{n} (通过特征值分解):\n{A_n.real}")

# 验证
A_n_direct = np.linalg.matrix_power(A, n)
print(f"A^{n} (直接计算):\n{A_n_direct}")
print(f"误差: {np.linalg.norm(A_n - A_n_direct):.2e}")

# 矩阵指数 e^A
def matrix_exp_via_evd(A):
    """通过特征值分解计算矩阵指数"""
    eigenvalues, V = np.linalg.eig(A)
    exp_Lambda = np.diag(np.exp(eigenvalues))
    return V @ exp_Lambda @ np.linalg.inv(V)

from scipy.linalg import expm
A = np.array([[1, 2],
              [0, 3]])
print(f"\ne^A (特征值分解):\n{matrix_exp_via_evd(A).real}")
print(f"e^A (scipy):\n{expm(A)}")
```

## 奇异值分解（SVD）

### SVD 的定义

奇异值分解是线性代数中最重要的矩阵分解，适用于任何矩阵（包括非方阵）：

$$A = U \Sigma V^T$$

其中：
- U：m x m 正交矩阵（左奇异向量）
- Sigma：m x n 对角矩阵（奇异值）
- V：n x n 正交矩阵（右奇异向量）

```python
# SVD 分解
A = np.array([[1, 2, 3],
              [4, 5, 6],
              [7, 8, 9],
              [10, 11, 12]])

print(f"原矩阵 A ({A.shape[0]}x{A.shape[1]}):\n{A}")

# 完整 SVD
U, S, Vt = np.linalg.svd(A)

print(f"\nU ({U.shape[0]}x{U.shape[1]}):\n{U}")
print(f"\n奇异值 S: {S}")
print(f"\nVt ({Vt.shape[0]}x{Vt.shape[1]}):\n{Vt}")

# 重构原矩阵
# 需要将 S 转换为对角矩阵
Sigma = np.zeros_like(A, dtype=float)
np.fill_diagonal(Sigma, S)
A_reconstructed = U @ Sigma @ Vt

print(f"\n重构的 A:\n{A_reconstructed}")
print(f"重构误差: {np.linalg.norm(A - A_reconstructed):.2e}")
```

### 紧凑 SVD 与截断 SVD

```python
# 紧凑 SVD（经济 SVD）
A = np.array([[1, 2, 3],
              [4, 5, 6],
              [7, 8, 9],
              [10, 11, 12]])

U, S, Vt = np.linalg.svd(A, full_matrices=False)
print(f"紧凑 SVD:")
print(f"U 形状: {U.shape}")  # (4, 3)
print(f"S 长度: {len(S)}")   # 3
print(f"Vt 形状: {Vt.shape}")  # (3, 3)

# 截断 SVD（保留前 k 个奇异值）
def truncated_svd(A, k):
    """截断 SVD：保留前 k 个奇异值"""
    U, S, Vt = np.linalg.svd(A, full_matrices=False)
    return U[:, :k], S[:k], Vt[:k, :]

# 使用截断 SVD 进行低秩近似
k = 2
U_k, S_k, Vt_k = truncated_svd(A, k)
A_approx = U_k @ np.diag(S_k) @ Vt_k

print(f"\n秩-{k} 近似:")
print(f"近似矩阵:\n{A_approx}")
print(f"近似误差: {np.linalg.norm(A - A_approx):.4f}")
print(f"原矩阵秩: {np.linalg.matrix_rank(A)}")
```

### SVD 与特征值分解的关系

```python
# SVD 与特征值分解的关系
A = np.array([[1, 2],
              [3, 4],
              [5, 6]])

U, S, Vt = np.linalg.svd(A)

# A^T A 的特征值分解
AtA = A.T @ A
eigenvalues_AtA, eigenvectors_AtA = np.linalg.eigh(AtA)

print("A^T A 的特征值分解:")
print(f"特征值: {np.sort(eigenvalues_AtA)[::-1]}")
print(f"奇异值的平方: {S ** 2}")
print(f"关系: 奇异值 = sqrt(特征值)")

# A A^T 的特征值分解
AAt = A @ A.T
eigenvalues_AAt, eigenvectors_AAt = np.linalg.eigh(AAt)

print(f"\nA A^T 的非零特征值: {np.sort(eigenvalues_AAt)[::-1][:2]}")
print(f"与 A^T A 的特征值相同")

# V 是 A^T A 的特征向量
print(f"\nVt.T (V):\n{Vt.T}")
# 注意：符号可能不同，但方向相同
```

### SVD 的几何意义

```python
# SVD 的几何意义：任何线性变换可以分解为旋转-缩放-旋转
def visualize_svd(A):
    """可视化 SVD 的几何意义"""
    U, S, Vt = np.linalg.svd(A)

    # 生成单位圆上的点
    theta = np.linspace(0, 2*np.pi, 100)
    circle = np.array([np.cos(theta), np.sin(theta)])

    fig, axes = plt.subplots(1, 4, figsize=(16, 4))

    # 步骤1：原始单位圆
    axes[0].plot(circle[0], circle[1], 'b-', linewidth=2)
    axes[0].set_xlim(-3, 3)
    axes[0].set_ylim(-3, 3)
    axes[0].set_aspect('equal')
    axes[0].grid(True, alpha=0.3)
    axes[0].set_title('Step 1: 单位圆')

    # 步骤2：V^T 旋转
    rotated = Vt @ circle
    axes[1].plot(rotated[0], rotated[1], 'g-', linewidth=2)
    axes[1].set_xlim(-3, 3)
    axes[1].set_ylim(-3, 3)
    axes[1].set_aspect('equal')
    axes[1].grid(True, alpha=0.3)
    axes[1].set_title('Step 2: V^T 旋转')

    # 步骤3：Σ 缩放
    Sigma = np.diag(S)
    scaled = Sigma @ rotated
    axes[2].plot(scaled[0], scaled[1], 'm-', linewidth=2)
    axes[2].set_xlim(-3, 3)
    axes[2].set_ylim(-3, 3)
    axes[2].set_aspect('equal')
    axes[2].grid(True, alpha=0.3)
    axes[2].set_title('Step 3: Σ 缩放')

    # 步骤4：U 旋转（最终结果）
    final = U @ scaled
    axes[3].plot(final[0], final[1], 'r-', linewidth=2)
    axes[3].set_xlim(-3, 3)
    axes[3].set_ylim(-3, 3)
    axes[3].set_aspect('equal')
    axes[3].grid(True, alpha=0.3)
    axes[3].set_title('Step 4: U 旋转 (最终)')

    plt.tight_layout()
    plt.savefig('svd_geometry.png', dpi=100, bbox_inches='tight')
    plt.close()

A = np.array([[2, 1],
              [1, 2]])
# visualize_svd(A)

# 验证分解
U, S, Vt = np.linalg.svd(A)
print(f"矩阵 A:\n{A}")
print(f"奇异值: {S}")
print(f"U (旋转):\n{U}")
print(f"V^T (旋转):\n{Vt}")
```

### SVD 的应用

```python
# 图像压缩
def compress_image(image, k):
    """使用 SVD 压缩图像"""
    # 对每个颜色通道进行 SVD
    compressed = np.zeros_like(image, dtype=float)

    for channel in range(3):  # RGB
        U, S, Vt = np.linalg.svd(image[:, :, channel], full_matrices=False)
        compressed[:, :, channel] = U[:, :k] @ np.diag(S[:k]) @ Vt[:k, :]

    return np.clip(compressed, 0, 255).astype(np.uint8)

# 模拟图像压缩
np.random.seed(42)
fake_image = np.random.randint(0, 256, (100, 100, 3), dtype=np.uint8)
compressed = compress_image(fake_image, k=20)

# 计算压缩比
original_size = 100 * 100 * 3
compressed_size = 3 * (100 * 20 + 20 + 20 * 100)  # U, S, Vt
print(f"图像压缩示例:")
print(f"原始大小: {original_size}")
print(f"压缩大小: {compressed_size}")
print(f"压缩比: {original_size / compressed_size:.2f}x")

# 伪逆计算
def pseudo_inverse_via_svd(A, tol=1e-10):
    """通过 SVD 计算伪逆"""
    U, S, Vt = np.linalg.svd(A, full_matrices=False)
    # 对非零奇异值取倒数
    S_inv = np.where(S > tol, 1/S, 0)
    return Vt.T @ np.diag(S_inv) @ U.T

A = np.array([[1, 2],
              [3, 4],
              [5, 6]])
A_pinv_svd = pseudo_inverse_via_svd(A)
A_pinv_numpy = np.linalg.pinv(A)
print(f"\n伪逆 (SVD):\n{A_pinv_svd}")
print(f"伪逆 (NumPy):\n{A_pinv_numpy}")
print(f"误差: {np.linalg.norm(A_pinv_svd - A_pinv_numpy):.2e}")

# 最小二乘解
def least_squares_svd(A, b):
    """通过 SVD 求解最小二乘问题 min ||Ax - b||"""
    A_pinv = pseudo_inverse_via_svd(A)
    return A_pinv @ b

A = np.array([[1, 1],
              [1, 2],
              [1, 3]])
b = np.array([1, 2, 2])
x_svd = least_squares_svd(A, b)
x_lstsq = np.linalg.lstsq(A, b, rcond=None)[0]
print(f"\n最小二乘解 (SVD): {x_svd}")
print(f"最小二乘解 (lstsq): {x_lstsq}")
```

## PCA 的数学原理

### PCA 概述

主成分分析（PCA）是最常用的降维方法，其数学本质是通过特征值分解或 SVD 找到数据方差最大的方向。

```python
# PCA 的数学推导
np.random.seed(42)

# 生成相关数据
n_samples = 200
mean = [0, 0]
cov = [[1, 0.8], [0.8, 1]]  # 相关的二维数据
X = np.random.multivariate_normal(mean, cov, n_samples)

print(f"数据形状: {X.shape}")
print(f"数据均值: {X.mean(axis=0)}")
print(f"数据协方差:\n{np.cov(X.T)}")
```

### PCA 的协方差矩阵方法

```python
def pca_covariance(X, n_components):
    """
    通过协方差矩阵的特征值分解实现 PCA

    步骤：
    1. 数据中心化
    2. 计算协方差矩阵
    3. 对协方差矩阵进行特征值分解
    4. 选择前 k 个主成分
    """
    # 1. 中心化
    X_centered = X - X.mean(axis=0)

    # 2. 计算协方差矩阵
    n = X.shape[0]
    cov_matrix = (X_centered.T @ X_centered) / (n - 1)

    # 3. 特征值分解
    eigenvalues, eigenvectors = np.linalg.eigh(cov_matrix)

    # 4. 按特征值降序排列
    idx = np.argsort(eigenvalues)[::-1]
    eigenvalues = eigenvalues[idx]
    eigenvectors = eigenvectors[:, idx]

    # 5. 选择前 k 个主成分
    components = eigenvectors[:, :n_components]

    # 6. 投影到新空间
    X_pca = X_centered @ components

    # 计算解释的方差比例
    explained_variance_ratio = eigenvalues / eigenvalues.sum()

    return X_pca, components, eigenvalues, explained_variance_ratio

# 应用 PCA
X_pca, components, eigenvalues, var_ratio = pca_covariance(X, n_components=2)

print("PCA 结果 (协方差矩阵方法):")
print(f"主成分:\n{components}")
print(f"特征值: {eigenvalues}")
print(f"解释方差比例: {var_ratio}")
print(f"累计解释方差: {np.cumsum(var_ratio)}")
```

### PCA 的 SVD 方法

```python
def pca_svd(X, n_components):
    """
    通过 SVD 实现 PCA

    优点：
    1. 数值更稳定
    2. 不需要显式计算协方差矩阵
    3. 计算效率更高（特别是高维数据）
    """
    # 1. 中心化
    X_centered = X - X.mean(axis=0)

    # 2. SVD 分解
    U, S, Vt = np.linalg.svd(X_centered, full_matrices=False)

    # 3. 主成分就是 V 的列
    components = Vt.T[:, :n_components]

    # 4. 投影（可以直接使用 U 和 S）
    X_pca = U[:, :n_components] * S[:n_components]
    # 或者 X_pca = X_centered @ components

    # 5. 计算解释的方差
    n = X.shape[0]
    explained_variance = (S ** 2) / (n - 1)
    explained_variance_ratio = explained_variance / explained_variance.sum()

    return X_pca, components, explained_variance[:n_components], explained_variance_ratio

# 应用 SVD-PCA
X_pca_svd, components_svd, var_svd, var_ratio_svd = pca_svd(X, n_components=2)

print("\nPCA 结果 (SVD 方法):")
print(f"主成分:\n{components_svd}")
print(f"解释方差: {var_svd}")
print(f"解释方差比例: {var_ratio_svd}")

# 验证两种方法结果一致
print(f"\n两种方法主成分是否一致: {np.allclose(np.abs(components), np.abs(components_svd))}")
```

### 使用 scikit-learn 实现 PCA

```python
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

# 标准化数据（可选，但推荐）
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 使用 sklearn PCA
pca = PCA(n_components=2)
X_pca_sklearn = pca.fit_transform(X)

print("sklearn PCA 结果:")
print(f"主成分:\n{pca.components_.T}")
print(f"解释方差: {pca.explained_variance_}")
print(f"解释方差比例: {pca.explained_variance_ratio_}")
print(f"累计解释方差: {np.cumsum(pca.explained_variance_ratio_)}")

# 重构数据
X_reconstructed = pca.inverse_transform(X_pca_sklearn)
reconstruction_error = np.mean((X - X_reconstructed) ** 2)
print(f"重构误差: {reconstruction_error:.6f}")
```

### PCA 可视化

```python
def visualize_pca(X, X_pca, components, title="PCA Visualization"):
    """可视化 PCA 结果"""
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    # 原始数据和主成分方向
    ax1 = axes[0]
    ax1.scatter(X[:, 0], X[:, 1], alpha=0.5, s=20)

    # 绘制主成分方向
    mean = X.mean(axis=0)
    for i, (comp, var) in enumerate(zip(components.T, [2, 1])):
        ax1.arrow(mean[0], mean[1], comp[0]*var, comp[1]*var,
                  head_width=0.1, head_length=0.05, fc=f'C{i+1}', ec=f'C{i+1}',
                  linewidth=2, label=f'PC{i+1}')

    ax1.set_xlabel('X1')
    ax1.set_ylabel('X2')
    ax1.set_title('原始数据与主成分方向')
    ax1.legend()
    ax1.axis('equal')
    ax1.grid(True, alpha=0.3)

    # 投影后的数据
    ax2 = axes[1]
    ax2.scatter(X_pca[:, 0], X_pca[:, 1] if X_pca.shape[1] > 1 else np.zeros_like(X_pca[:, 0]),
                alpha=0.5, s=20)
    ax2.axhline(y=0, color='k', linewidth=0.5)
    ax2.axvline(x=0, color='k', linewidth=0.5)
    ax2.set_xlabel('PC1')
    ax2.set_ylabel('PC2')
    ax2.set_title('PCA 投影后的数据')
    ax2.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig('pca_visualization.png', dpi=100, bbox_inches='tight')
    plt.close()

# visualize_pca(X, X_pca, components)
print("PCA 可视化图已保存")
```

### 选择主成分数量

```python
def select_n_components(X, variance_threshold=0.95):
    """根据解释方差选择主成分数量"""
    pca = PCA()
    pca.fit(X)

    cumsum = np.cumsum(pca.explained_variance_ratio_)
    n_components = np.argmax(cumsum >= variance_threshold) + 1

    return n_components, cumsum

# 高维数据示例
np.random.seed(42)
X_high = np.random.randn(500, 50)  # 50 维数据

n_comp, cumsum = select_n_components(X_high, variance_threshold=0.95)
print(f"保留 95% 方差需要的主成分数: {n_comp}")

# 可视化
plt.figure(figsize=(10, 5))
plt.subplot(1, 2, 1)
pca_full = PCA().fit(X_high)
plt.bar(range(1, len(pca_full.explained_variance_ratio_) + 1),
        pca_full.explained_variance_ratio_)
plt.xlabel('主成分')
plt.ylabel('解释方差比例')
plt.title('各主成分解释方差')

plt.subplot(1, 2, 2)
plt.plot(range(1, len(cumsum) + 1), cumsum, 'bo-')
plt.axhline(y=0.95, color='r', linestyle='--', label='95% 阈值')
plt.axvline(x=n_comp, color='g', linestyle='--', label=f'n={n_comp}')
plt.xlabel('主成分数量')
plt.ylabel('累计解释方差')
plt.title('累计解释方差曲线')
plt.legend()
plt.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig('pca_variance_explained.png', dpi=100, bbox_inches='tight')
plt.close()
```

### PCA 应用：降维与可视化

```python
from sklearn.datasets import load_iris

# 加载 Iris 数据集
iris = load_iris()
X_iris = iris.data  # (150, 4)
y_iris = iris.target

print(f"Iris 数据形状: {X_iris.shape}")
print(f"特征名称: {iris.feature_names}")

# PCA 降维到 2D
pca_iris = PCA(n_components=2)
X_iris_pca = pca_iris.fit_transform(X_iris)

print(f"\nPCA 降维后形状: {X_iris_pca.shape}")
print(f"解释方差比例: {pca_iris.explained_variance_ratio_}")
print(f"累计解释方差: {sum(pca_iris.explained_variance_ratio_):.4f}")

# 可视化
plt.figure(figsize=(10, 8))
scatter = plt.scatter(X_iris_pca[:, 0], X_iris_pca[:, 1],
                      c=y_iris, cmap='viridis', alpha=0.7)
plt.colorbar(scatter, label='类别')
plt.xlabel(f'PC1 ({pca_iris.explained_variance_ratio_[0]:.2%})')
plt.ylabel(f'PC2 ({pca_iris.explained_variance_ratio_[1]:.2%})')
plt.title('Iris 数据集 PCA 可视化')
plt.grid(True, alpha=0.3)
plt.savefig('iris_pca.png', dpi=100, bbox_inches='tight')
plt.close()

# 查看主成分的含义（特征权重）
print("\n主成分的特征权重:")
for i, (comp, var) in enumerate(zip(pca_iris.components_,
                                     pca_iris.explained_variance_ratio_)):
    print(f"\nPC{i+1} (解释方差: {var:.2%}):")
    for feat, weight in zip(iris.feature_names, comp):
        print(f"  {feat}: {weight:.4f}")
```

## NumPy 线性代数实现

### 完整的矩阵分解工具集

```python
class LinearAlgebraToolkit:
    """线性代数工具集"""

    @staticmethod
    def gram_schmidt(vectors):
        """Gram-Schmidt 正交化"""
        n, m = vectors.shape
        orthogonal = np.zeros_like(vectors, dtype=float)

        for i in range(m):
            v = vectors[:, i].astype(float)
            for j in range(i):
                u = orthogonal[:, j]
                v = v - (np.dot(v, u) / np.dot(u, u)) * u
            orthogonal[:, i] = v

        # 归一化
        norms = np.linalg.norm(orthogonal, axis=0)
        orthonormal = orthogonal / norms
        return orthonormal

    @staticmethod
    def power_iteration(A, num_iterations=100, tol=1e-10):
        """幂迭代法求最大特征值"""
        n = A.shape[0]
        v = np.random.rand(n)
        v = v / np.linalg.norm(v)

        eigenvalue_old = 0
        for i in range(num_iterations):
            Av = A @ v
            v_new = Av / np.linalg.norm(Av)
            eigenvalue = v_new @ A @ v_new

            if abs(eigenvalue - eigenvalue_old) < tol:
                break
            eigenvalue_old = eigenvalue
            v = v_new

        return eigenvalue, v

    @staticmethod
    def qr_iteration(A, num_iterations=100, tol=1e-10):
        """QR 迭代求所有特征值"""
        Ak = A.copy().astype(float)
        n = A.shape[0]

        for _ in range(num_iterations):
            Q, R = np.linalg.qr(Ak)
            Ak_new = R @ Q

            # 检查收敛（下三角趋近于0）
            off_diag = np.sum(np.abs(np.tril(Ak_new, -1)))
            if off_diag < tol:
                break
            Ak = Ak_new

        return np.diag(Ak_new)

    @staticmethod
    def svd_via_evd(A):
        """通过特征值分解计算 SVD"""
        AtA = A.T @ A
        AAt = A @ A.T

        # V 来自 A^T A
        eigenvalues_AtA, V = np.linalg.eigh(AtA)
        idx = np.argsort(eigenvalues_AtA)[::-1]
        eigenvalues_AtA = eigenvalues_AtA[idx]
        V = V[:, idx]

        # 奇异值
        S = np.sqrt(np.maximum(eigenvalues_AtA, 0))

        # U 来自 A A^T
        eigenvalues_AAt, U = np.linalg.eigh(AAt)
        idx = np.argsort(eigenvalues_AAt)[::-1]
        U = U[:, idx]

        return U, S, V.T

# 使用示例
toolkit = LinearAlgebraToolkit()

# Gram-Schmidt 正交化
vectors = np.array([[1, 1, 0],
                    [1, 0, 1],
                    [0, 1, 1]], dtype=float).T
orthonormal = toolkit.gram_schmidt(vectors)
print("Gram-Schmidt 正交化:")
print(f"正交矩阵:\n{orthonormal}")
print(f"验证正交性:\n{orthonormal.T @ orthonormal}")

# 幂迭代
A = np.array([[4, 2],
              [1, 3]])
max_eig, max_vec = toolkit.power_iteration(A)
print(f"\n幂迭代最大特征值: {max_eig:.6f}")

# QR 迭代
eigenvalues = toolkit.qr_iteration(A)
print(f"QR 迭代特征值: {eigenvalues}")
print(f"NumPy 特征值: {np.linalg.eigvals(A)}")
```

### 线性方程组求解器

```python
class LinearSolver:
    """线性方程组求解器"""

    @staticmethod
    def solve_lu(A, b):
        """LU 分解求解 Ax = b"""
        from scipy.linalg import lu_factor, lu_solve
        lu, piv = lu_factor(A)
        return lu_solve((lu, piv), b)

    @staticmethod
    def solve_cholesky(A, b):
        """Cholesky 分解求解（要求 A 正定）"""
        L = np.linalg.cholesky(A)
        # 前向替换：Ly = b
        y = np.linalg.solve(L, b)
        # 后向替换：L^T x = y
        x = np.linalg.solve(L.T, y)
        return x

    @staticmethod
    def solve_qr(A, b):
        """QR 分解求解"""
        Q, R = np.linalg.qr(A)
        # Rx = Q^T b
        return np.linalg.solve(R, Q.T @ b)

    @staticmethod
    def solve_svd(A, b, tol=1e-10):
        """SVD 求解（包括欠定和超定系统）"""
        U, S, Vt = np.linalg.svd(A, full_matrices=False)
        # x = V @ S^(-1) @ U^T @ b
        S_inv = np.where(S > tol, 1/S, 0)
        return Vt.T @ (S_inv * (U.T @ b))

    @staticmethod
    def conjugate_gradient(A, b, x0=None, tol=1e-10, max_iter=1000):
        """共轭梯度法（要求 A 对称正定）"""
        n = len(b)
        x = x0 if x0 is not None else np.zeros(n)
        r = b - A @ x
        p = r.copy()

        for i in range(max_iter):
            Ap = A @ p
            alpha = np.dot(r, r) / np.dot(p, Ap)
            x = x + alpha * p
            r_new = r - alpha * Ap

            if np.linalg.norm(r_new) < tol:
                break

            beta = np.dot(r_new, r_new) / np.dot(r, r)
            p = r_new + beta * p
            r = r_new

        return x

# 使用示例
solver = LinearSolver()

# 正定矩阵系统
A = np.array([[4, 2],
              [2, 5]], dtype=float)
b = np.array([1, 2], dtype=float)

x_direct = np.linalg.solve(A, b)
x_cholesky = solver.solve_cholesky(A, b)
x_cg = solver.conjugate_gradient(A, b)

print("线性方程组求解:")
print(f"直接求解: {x_direct}")
print(f"Cholesky: {x_cholesky}")
print(f"共轭梯度: {x_cg}")

# 超定系统（最小二乘）
A_over = np.array([[1, 1],
                   [1, 2],
                   [1, 3]], dtype=float)
b_over = np.array([1, 2, 2], dtype=float)

x_lstsq = np.linalg.lstsq(A_over, b_over, rcond=None)[0]
x_svd = solver.solve_svd(A_over, b_over)

print(f"\n超定系统最小二乘解:")
print(f"lstsq: {x_lstsq}")
print(f"SVD: {x_svd}")
```

### 矩阵分析工具

```python
class MatrixAnalysis:
    """矩阵分析工具"""

    @staticmethod
    def condition_number(A, p=2):
        """计算条件数"""
        if p == 2:
            S = np.linalg.svd(A, compute_uv=False)
            return S[0] / S[-1] if S[-1] > 0 else np.inf
        else:
            return np.linalg.cond(A, p)

    @staticmethod
    def matrix_rank(A, tol=None):
        """计算矩阵秩"""
        S = np.linalg.svd(A, compute_uv=False)
        if tol is None:
            tol = S[0] * max(A.shape) * np.finfo(float).eps
        return np.sum(S > tol)

    @staticmethod
    def null_space(A, tol=1e-10):
        """计算零空间"""
        U, S, Vt = np.linalg.svd(A)
        null_mask = S <= tol
        null_dim = np.sum(null_mask)
        if null_dim == 0:
            return np.array([]).reshape(A.shape[1], 0)
        return Vt[-null_dim:].T

    @staticmethod
    def column_space(A, tol=1e-10):
        """计算列空间"""
        U, S, Vt = np.linalg.svd(A)
        rank = np.sum(S > tol)
        return U[:, :rank]

    @staticmethod
    def row_space(A, tol=1e-10):
        """计算行空间"""
        U, S, Vt = np.linalg.svd(A)
        rank = np.sum(S > tol)
        return Vt[:rank].T

    @staticmethod
    def is_symmetric(A, tol=1e-10):
        """判断是否对称"""
        return np.allclose(A, A.T, atol=tol)

    @staticmethod
    def is_positive_definite(A):
        """判断是否正定"""
        if not MatrixAnalysis.is_symmetric(A):
            return False
        try:
            eigenvalues = np.linalg.eigvalsh(A)
            return np.all(eigenvalues > 0)
        except:
            return False

    @staticmethod
    def spectral_radius(A):
        """计算谱半径"""
        eigenvalues = np.linalg.eigvals(A)
        return np.max(np.abs(eigenvalues))

# 使用示例
analysis = MatrixAnalysis()

A = np.array([[1, 2, 3],
              [4, 5, 6],
              [7, 8, 9]])

print("矩阵分析:")
print(f"矩阵 A:\n{A}")
print(f"秩: {analysis.matrix_rank(A)}")
print(f"条件数: {analysis.condition_number(A):.2f}")
print(f"谱半径: {analysis.spectral_radius(A):.4f}")
print(f"是否对称: {analysis.is_symmetric(A)}")

# 零空间
null = analysis.null_space(A)
if null.size > 0:
    print(f"零空间维度: {null.shape[1]}")
    print(f"验证 A @ null:\n{A @ null}")

# 正定矩阵
B = np.array([[4, 2],
              [2, 5]])
print(f"\n矩阵 B 正定: {analysis.is_positive_definite(B)}")
print(f"B 的特征值: {np.linalg.eigvalsh(B)}")
```

## 面试要点总结

### 核心概念速查

```python
# 向量范数
v = np.array([3, 4])
print(f"L1 范数: {np.linalg.norm(v, 1)}")  # 7
print(f"L2 范数: {np.linalg.norm(v, 2)}")  # 5
print(f"L∞ 范数: {np.linalg.norm(v, np.inf)}")  # 4

# 矩阵的秩
A = np.array([[1, 2], [2, 4]])  # 线性相关
print(f"秩: {np.linalg.matrix_rank(A)}")  # 1

# 特征值与奇异值
A = np.array([[3, 1], [1, 3]])
eigenvalues = np.linalg.eigvals(A)
singular_values = np.linalg.svd(A, compute_uv=False)
print(f"特征值: {eigenvalues}")  # [4, 2]
print(f"奇异值: {singular_values}")  # [4, 2]

# 正交矩阵性质
Q = np.array([[0, -1], [1, 0]])  # 旋转90度
print(f"Q^T Q = I: {np.allclose(Q.T @ Q, np.eye(2))}")  # True
print(f"det(Q) = +/-1: {np.linalg.det(Q)}")  # 1
```

### 常见面试问题

```python
"""
Q1: 特征值分解和 SVD 的区别？
A:
- 特征值分解：仅适用于方阵，A = V Λ V^(-1)
- SVD：适用于任意矩阵，A = U Σ V^T
- 对称矩阵：两者等价，因为特征向量正交

Q2: 为什么 PCA 用 SVD 而不是特征值分解？
A:
- 数值稳定性：SVD 更稳定
- 计算效率：不需要计算协方差矩阵
- 内存：协方差矩阵是 n x n，当 n 很大时内存开销大

Q3: 矩阵的秩有什么意义？
A:
- 线性无关的行/列数
- 图像/列空间的维度
- 方程组有解的条件

Q4: 什么是正定矩阵？有什么性质？
A:
- 所有特征值为正
- 对于任意非零向量 x，x^T A x > 0
- 可以 Cholesky 分解
- 优化问题中保证凸性

Q5: 条件数的意义？
A:
- 衡量矩阵数值稳定性
- 条件数大：病态矩阵，小扰动导致大误差
- 条件数 = 最大奇异值 / 最小奇异值
"""

# 代码验证
A = np.array([[1, 1], [1, 1.001]])  # 病态矩阵
print(f"条件数: {np.linalg.cond(A):.0f}")  # 非常大

b1 = np.array([2, 2.001])
b2 = np.array([2, 2.002])  # 微小扰动
x1 = np.linalg.solve(A, b1)
x2 = np.linalg.solve(A, b2)
print(f"b 的相对变化: {np.linalg.norm(b2-b1)/np.linalg.norm(b1):.6f}")
print(f"x 的相对变化: {np.linalg.norm(x2-x1)/np.linalg.norm(x1):.6f}")
```

### 机器学习中的应用

```python
"""
线性代数在机器学习中的应用：

1. 数据表示
   - 特征矩阵 X: (n_samples, n_features)
   - 权重矩阵 W: (input_dim, output_dim)

2. 线性模型
   - 线性回归: w = (X^T X)^(-1) X^T y
   - 岭回归: w = (X^T X + λI)^(-1) X^T y
   - 支持向量机: 核矩阵

3. 降维
   - PCA: 特征值分解 / SVD
   - LDA: 广义特征值问题
   - 矩阵分解: NMF, ICA

4. 深度学习
   - 前向传播: 矩阵乘法
   - 反向传播: 梯度计算
   - 权重初始化: 奇异值分析
   - 批归一化: 协方差矩阵

5. 推荐系统
   - 矩阵分解: SVD
   - 协同过滤: 相似度矩阵

6. 自然语言处理
   - 词嵌入: 矩阵分解 (LSA)
   - 注意力机制: 矩阵运算
"""

# 示例：使用线性代数实现线性回归
def linear_regression_closed_form(X, y):
    """闭式解: w = (X^T X)^(-1) X^T y"""
    return np.linalg.solve(X.T @ X, X.T @ y)

def ridge_regression(X, y, alpha=1.0):
    """岭回归: w = (X^T X + αI)^(-1) X^T y"""
    n_features = X.shape[1]
    return np.linalg.solve(X.T @ X + alpha * np.eye(n_features), X.T @ y)

# 测试
np.random.seed(42)
X = np.random.randn(100, 5)
X = np.column_stack([np.ones(100), X])  # 添加偏置
true_w = np.array([1, 2, -1, 0.5, 3, -2])
y = X @ true_w + 0.1 * np.random.randn(100)

w_ols = linear_regression_closed_form(X, y)
w_ridge = ridge_regression(X, y, alpha=0.1)

print(f"真实权重: {true_w}")
print(f"OLS 估计: {w_ols}")
print(f"Ridge 估计: {w_ridge}")
```

## 延伸阅读

### 推荐资源

**书籍：**
- 《Linear Algebra Done Right》- Sheldon Axler：理论清晰
- 《Introduction to Linear Algebra》- Gilbert Strang：MIT 经典教材
- 《Matrix Computations》- Golub & Van Loan：数值线性代数圣经
- 《线性代数应该这样学》- Axler（中译本）

**视频课程：**
- MIT 18.06 Linear Algebra - Gilbert Strang
- 3Blue1Brown - Essence of Linear Algebra（强烈推荐）
- Khan Academy Linear Algebra

**在线资源：**
- NumPy 官方文档：线性代数模块
- SciPy 线性代数教程
- Matrix Cookbook：矩阵公式速查

### 进阶主题

- **稀疏矩阵运算**：大规模数据处理
- **张量分解**：多维数据分析
- **随机矩阵理论**：高维统计
- **矩阵微积分**：深度学习优化
- **数值稳定性**：浮点运算精度
- **并行线性代数**：GPU 加速计算

## 总结

线性代数是机器学习的数学基石。本文系统介绍了：

1. **向量空间与基**：数据表示的基础
2. **矩阵运算**：数据变换的核心
3. **线性变换**：理解神经网络的关键
4. **特征值分解**：理解矩阵本质
5. **SVD 分解**：最强大的矩阵分解工具
6. **PCA 原理**：降维的数学基础

掌握这些知识，不仅能帮助你理解机器学习算法的原理，还能在实际工作中：
- 更好地处理数值计算问题
- 理解和优化模型性能
- 调试和诊断算法问题

建议通过大量练习和实际项目来加深理解，将数学知识与编程实践相结合。
