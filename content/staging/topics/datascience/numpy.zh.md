---
title: NumPy 科学计算指南
description: 掌握NumPy数组计算，构建高效数据处理流程
track: datascience
section: python-stack
difficulty: beginner
tags:
  - NumPy
  - 数组
  - 科学计算
  - Python
status: imported
origin: old/src/content/docs/data/numpy.zh.md
divergence: 0.189
issues: []
legacy:
  category: Data
  subcategory: Python
  order: 12
  lastUpdated: 2026-01-07
---

NumPy（Numerical Python）是 Python 科学计算的基础库，为 Python 提供了高性能的多维数组对象和丰富的数学函数库。它是数据科学、机器学习、深度学习等领域的基石，几乎所有的 Python 科学计算库（如 Pandas、SciPy、Scikit-learn、TensorFlow）都构建在 NumPy 之上。

## 为什么选择 NumPy？

### 性能优势

Python 原生列表虽然灵活，但在处理大规模数值计算时效率低下。NumPy 通过以下方式实现高性能：

1. **连续内存存储**：NumPy 数组在内存中连续存储，提高缓存命中率
2. **固定数据类型**：避免了 Python 对象的类型检查开销
3. **向量化操作**：底层使用 C 语言实现，避免 Python 循环
4. **SIMD 优化**：利用 CPU 的单指令多数据特性

```python
import numpy as np
import time

# 性能对比：Python 列表 vs NumPy 数组
size = 1000000

# Python 列表操作
python_list = list(range(size))
start = time.time()
python_result = [x * 2 for x in python_list]
print(f"Python 列表耗时: {time.time() - start:.4f}秒")

# NumPy 数组操作
numpy_array = np.arange(size)
start = time.time()
numpy_result = numpy_array * 2
print(f"NumPy 数组耗时: {time.time() - start:.4f}秒")

# 通常 NumPy 比 Python 列表快 10-100 倍
```

## NumPy 数组基础（ndarray）

### 什么是 ndarray？

ndarray（N-dimensional array）是 NumPy 的核心数据结构，它是一个多维数组对象，具有以下关键属性：

```python
import numpy as np

# 创建一个简单的数组
arr = np.array([[1, 2, 3], [4, 5, 6]])

# ndarray 的核心属性
print(f"数组内容:\n{arr}")
print(f"维度数量 (ndim): {arr.ndim}")        # 2
print(f"形状 (shape): {arr.shape}")          # (2, 3)
print(f"元素总数 (size): {arr.size}")        # 6
print(f"数据类型 (dtype): {arr.dtype}")      # int64
print(f"每个元素字节数 (itemsize): {arr.itemsize}")  # 8
print(f"总字节数 (nbytes): {arr.nbytes}")    # 48
```

### 数据类型（dtype）

NumPy 支持丰富的数据类型，合理选择可以优化内存使用：

```python
# 常用数据类型
int_arr = np.array([1, 2, 3], dtype=np.int32)      # 32位整数
float_arr = np.array([1.0, 2.0], dtype=np.float64) # 64位浮点数
bool_arr = np.array([True, False], dtype=np.bool_) # 布尔值
str_arr = np.array(['a', 'b'], dtype='U10')        # Unicode 字符串

# 类型转换
arr = np.array([1.7, 2.3, 3.9])
int_arr = arr.astype(np.int32)  # 转换为整数（截断小数）
print(int_arr)  # [1 2 3]

# 查看所有可用数据类型
print("整数类型: int8, int16, int32, int64")
print("无符号整数: uint8, uint16, uint32, uint64")
print("浮点数: float16, float32, float64")
print("复数: complex64, complex128")
```

## 数组创建与初始化

### 从 Python 数据结构创建

```python
# 从列表创建
arr1 = np.array([1, 2, 3, 4, 5])
arr2 = np.array([[1, 2, 3], [4, 5, 6]])  # 二维数组

# 从元组创建
arr3 = np.array((1, 2, 3))

# 嵌套列表创建多维数组
arr4 = np.array([[[1, 2], [3, 4]], [[5, 6], [7, 8]]])  # 三维数组
print(f"三维数组形状: {arr4.shape}")  # (2, 2, 2)
```

### 使用内置函数创建

```python
# 创建全零数组
zeros = np.zeros((3, 4))
print(f"全零数组:\n{zeros}")

# 创建全一数组
ones = np.ones((2, 3), dtype=np.int32)
print(f"全一数组:\n{ones}")

# 创建指定值填充的数组
full = np.full((2, 2), 7)
print(f"填充数组:\n{full}")

# 创建单位矩阵
eye = np.eye(3)
print(f"单位矩阵:\n{eye}")

# 创建对角矩阵
diag = np.diag([1, 2, 3, 4])
print(f"对角矩阵:\n{diag}")

# 创建未初始化数组（速度快，值随机）
empty = np.empty((2, 3))
print(f"未初始化数组:\n{empty}")
```

### 序列数组创建

```python
# arange：类似 Python range，但返回数组
arr1 = np.arange(10)           # [0, 1, 2, ..., 9]
arr2 = np.arange(2, 10, 2)     # [2, 4, 6, 8]
arr3 = np.arange(0, 1, 0.1)    # 支持浮点步长

# linspace：指定元素个数的等差数列
arr4 = np.linspace(0, 1, 5)    # [0, 0.25, 0.5, 0.75, 1]
arr5 = np.linspace(0, 1, 5, endpoint=False)  # 不包含终点

# logspace：等比数列（对数空间）
arr6 = np.logspace(0, 3, 4)    # [1, 10, 100, 1000]

# geomspace：几何级数
arr7 = np.geomspace(1, 1000, 4)  # [1, 10, 100, 1000]

print(f"等差数列: {arr4}")
print(f"等比数列: {arr6}")
```

### 数组形状操作

```python
# reshape：改变数组形状
arr = np.arange(12)
reshaped = arr.reshape(3, 4)
print(f"重塑为 3x4:\n{reshaped}")

# 使用 -1 自动计算维度
auto_reshape = arr.reshape(2, -1)  # 自动计算为 (2, 6)
print(f"自动计算形状:\n{auto_reshape}")

# flatten 和 ravel：展平数组
flat = reshaped.flatten()   # 返回副本
ravel = reshaped.ravel()    # 返回视图（更高效）

# transpose：转置
transposed = reshaped.T
print(f"转置后:\n{transposed}")

# 增加和删除维度
arr = np.array([1, 2, 3])
expanded = np.expand_dims(arr, axis=0)  # 增加维度
expanded2 = arr[np.newaxis, :]          # 等价方式
squeezed = np.squeeze(expanded)         # 删除长度为1的维度
```

## 索引与切片

### 基础索引

```python
# 一维数组索引
arr = np.array([10, 20, 30, 40, 50])
print(arr[0])     # 10（第一个元素）
print(arr[-1])    # 50（最后一个元素）
print(arr[1:4])   # [20, 30, 40]（切片）
print(arr[::2])   # [10, 30, 50]（步长为2）
print(arr[::-1])  # [50, 40, 30, 20, 10]（反转）

# 二维数组索引
arr2d = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
print(arr2d[0, 0])     # 1
print(arr2d[1, 2])     # 6
print(arr2d[0])        # [1, 2, 3]（第一行）
print(arr2d[:, 1])     # [2, 5, 8]（第二列）
print(arr2d[0:2, 1:3]) # [[2, 3], [5, 6]]（子矩阵）
```

### 高级索引

```python
# 整数数组索引（Fancy Indexing）
arr = np.array([10, 20, 30, 40, 50])
indices = np.array([0, 2, 4])
print(arr[indices])  # [10, 30, 50]

# 二维数组的花式索引
arr2d = np.arange(12).reshape(3, 4)
rows = np.array([0, 1, 2])
cols = np.array([0, 1, 2])
print(arr2d[rows, cols])  # [0, 5, 10]（对角线元素）

# 布尔索引
arr = np.array([1, 2, 3, 4, 5, 6])
mask = arr > 3
print(mask)       # [False, False, False, True, True, True]
print(arr[mask])  # [4, 5, 6]

# 复合条件
mask = (arr > 2) & (arr < 5)
print(arr[mask])  # [3, 4]

# np.where：条件索引
indices = np.where(arr > 3)
print(indices)     # (array([3, 4, 5]),)
print(arr[indices]) # [4, 5, 6]

# np.where 的三元表达式用法
result = np.where(arr > 3, arr * 2, arr)
print(result)  # [1, 2, 3, 8, 10, 12]
```

### 视图与副本

```python
# 切片创建的是视图（共享内存）
arr = np.array([1, 2, 3, 4, 5])
view = arr[1:4]
view[0] = 100
print(arr)  # [1, 100, 3, 4, 5]（原数组也被修改）

# 创建副本
arr = np.array([1, 2, 3, 4, 5])
copy = arr[1:4].copy()
copy[0] = 100
print(arr)  # [1, 2, 3, 4, 5]（原数组未变）

# 判断是否为视图
print(view.base is arr)  # True（是视图）
print(copy.base is None) # True（是副本）
```

## 广播机制

广播（Broadcasting）是 NumPy 最强大的特性之一，它允许不同形状的数组进行算术运算。

### 广播规则

1. 如果两个数组维度数不同，将维度较小的数组的形状在左边补1
2. 如果两个数组在某个维度上的大小不同，且其中一个为1，则扩展该维度
3. 如果两个数组在某个维度上的大小不同，且都不为1，则报错

```python
# 标量与数组
arr = np.array([1, 2, 3])
print(arr + 10)  # [11, 12, 13]

# 一维与二维数组
arr2d = np.array([[1, 2, 3], [4, 5, 6]])
arr1d = np.array([10, 20, 30])
print(arr2d + arr1d)
# [[11, 22, 33],
#  [14, 25, 36]]

# 列向量与行向量
col = np.array([[1], [2], [3]])  # (3, 1)
row = np.array([10, 20, 30])     # (3,) -> (1, 3)
print(col + row)
# [[11, 21, 31],
#  [12, 22, 32],
#  [13, 23, 33]]
```

### 广播的实际应用

```python
# 图像标准化（每个通道减去均值）
image = np.random.rand(100, 100, 3)  # RGB 图像
channel_means = image.mean(axis=(0, 1))  # 每个通道的均值
normalized = image - channel_means  # 广播自动处理

# 距离矩阵计算
points = np.array([[0, 0], [1, 1], [2, 2], [3, 3]])
# 利用广播计算所有点对之间的差
diff = points[:, np.newaxis, :] - points[np.newaxis, :, :]
distances = np.sqrt((diff ** 2).sum(axis=2))
print(f"距离矩阵:\n{distances}")

# 批量数据处理
data = np.random.rand(1000, 10)  # 1000个样本，10个特征
weights = np.array([0.1, 0.2, 0.15, 0.1, 0.05, 0.1, 0.1, 0.08, 0.07, 0.05])
weighted_data = data * weights  # 广播应用权重
```

## 数组运算（向量化）

### 基本算术运算

```python
a = np.array([1, 2, 3, 4])
b = np.array([5, 6, 7, 8])

# 元素级运算
print(a + b)   # [ 6,  8, 10, 12]
print(a - b)   # [-4, -4, -4, -4]
print(a * b)   # [ 5, 12, 21, 32]
print(a / b)   # [0.2, 0.33, 0.43, 0.5]
print(a ** 2)  # [ 1,  4,  9, 16]
print(a % 2)   # [1, 0, 1, 0]
print(a // 2)  # [0, 1, 1, 2]

# 比较运算
print(a > 2)   # [False, False, True, True]
print(a == b)  # [False, False, False, False]
```

### 聚合函数

```python
arr = np.array([[1, 2, 3], [4, 5, 6]])

# 全局聚合
print(np.sum(arr))    # 21
print(np.mean(arr))   # 3.5
print(np.std(arr))    # 1.707...
print(np.var(arr))    # 2.916...
print(np.min(arr))    # 1
print(np.max(arr))    # 6
print(np.prod(arr))   # 720（所有元素的乘积）

# 沿轴聚合
print(np.sum(arr, axis=0))   # [5, 7, 9]（按列求和）
print(np.sum(arr, axis=1))   # [6, 15]（按行求和）
print(np.mean(arr, axis=0))  # [2.5, 3.5, 4.5]

# 累积函数
print(np.cumsum(arr))  # [ 1,  3,  6, 10, 15, 21]
print(np.cumprod(arr)) # [  1,   2,   6,  24, 120, 720]

# 索引函数
print(np.argmax(arr))         # 5（最大值的扁平索引）
print(np.argmin(arr, axis=1)) # [0, 0]（每行最小值的索引）
```

### 逻辑运算

```python
arr = np.array([1, 2, 3, 4, 5])

# 条件判断
print(np.any(arr > 3))   # True（是否有元素满足条件）
print(np.all(arr > 0))   # True（是否所有元素满足条件）

# 逻辑运算
a = np.array([True, True, False, False])
b = np.array([True, False, True, False])
print(np.logical_and(a, b))  # [True, False, False, False]
print(np.logical_or(a, b))   # [True, True, True, False]
print(np.logical_not(a))     # [False, False, True, True]
print(np.logical_xor(a, b))  # [False, True, True, False]
```

## 常用数学函数

### 基础数学函数

```python
arr = np.array([1, 4, 9, 16, 25])

# 算术函数
print(np.sqrt(arr))    # [1, 2, 3, 4, 5]
print(np.cbrt(arr))    # 立方根
print(np.abs([-1, -2, 3]))  # [1, 2, 3]
print(np.sign([-2, 0, 2]))  # [-1, 0, 1]

# 幂和对数
print(np.exp([1, 2, 3]))       # [2.718, 7.389, 20.085]
print(np.log([1, np.e, 10]))   # [0, 1, 2.302]（自然对数）
print(np.log10([1, 10, 100]))  # [0, 1, 2]
print(np.log2([1, 2, 4, 8]))   # [0, 1, 2, 3]
print(np.power([2, 3], [3, 2])) # [8, 9]

# 取整函数
arr = np.array([1.2, 2.5, 3.7, -1.5])
print(np.floor(arr))   # [ 1,  2,  3, -2]（向下取整）
print(np.ceil(arr))    # [ 2,  3,  4, -1]（向上取整）
print(np.round(arr))   # [ 1,  2,  4, -2]（四舍五入）
print(np.trunc(arr))   # [ 1,  2,  3, -1]（截断小数）
```

### 三角函数

```python
# 角度转换
degrees = np.array([0, 30, 45, 60, 90])
radians = np.deg2rad(degrees)  # 度转弧度
back_to_degrees = np.rad2deg(radians)  # 弧度转度

# 三角函数
print(np.sin(radians))   # [0, 0.5, 0.707, 0.866, 1]
print(np.cos(radians))   # [1, 0.866, 0.707, 0.5, 0]
print(np.tan(radians[:4]))  # [0, 0.577, 1, 1.732]

# 反三角函数
print(np.arcsin([0, 0.5, 1]))  # [0, 0.523, 1.570]
print(np.arccos([1, 0.5, 0]))  # [0, 1.047, 1.570]
print(np.arctan([0, 1]))       # [0, 0.785]

# 双曲函数
print(np.sinh([0, 1]))  # 双曲正弦
print(np.cosh([0, 1]))  # 双曲余弦
print(np.tanh([0, 1]))  # 双曲正切
```

### 统计函数

```python
data = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])

# 基本统计
print(np.mean(data))    # 5.5（均值）
print(np.median(data))  # 5.5（中位数）
print(np.std(data))     # 2.872（标准差）
print(np.var(data))     # 8.25（方差）

# 百分位数
print(np.percentile(data, 25))   # 3.25（25%分位数）
print(np.percentile(data, 50))   # 5.5（中位数）
print(np.percentile(data, [25, 50, 75]))  # 四分位数

# 协方差和相关系数
x = np.array([1, 2, 3, 4, 5])
y = np.array([2, 4, 5, 4, 5])
print(np.cov(x, y))      # 协方差矩阵
print(np.corrcoef(x, y)) # 相关系数矩阵

# 直方图
hist, bin_edges = np.histogram(data, bins=5)
print(f"直方图: {hist}")
print(f"分箱边界: {bin_edges}")
```

## 线性代数操作

NumPy 提供了强大的线性代数功能，主要在 `np.linalg` 模块中。

### 矩阵运算

```python
A = np.array([[1, 2], [3, 4]])
B = np.array([[5, 6], [7, 8]])

# 矩阵乘法
print(np.dot(A, B))      # 矩阵乘法
print(A @ B)             # Python 3.5+ 矩阵乘法运算符
print(np.matmul(A, B))   # 等价写法

# 元素级乘法（不是矩阵乘法）
print(A * B)  # [[ 5, 12], [21, 32]]

# 转置
print(A.T)
print(np.transpose(A))

# 矩阵的迹
print(np.trace(A))  # 5（对角线元素之和）

# 矩阵的秩
print(np.linalg.matrix_rank(A))  # 2
```

### 向量操作

```python
v1 = np.array([1, 2, 3])
v2 = np.array([4, 5, 6])

# 点积
print(np.dot(v1, v2))     # 32
print(v1 @ v2)            # 32

# 叉积
print(np.cross(v1, v2))   # [-3, 6, -3]

# 向量范数
print(np.linalg.norm(v1))         # L2 范数（欧几里得距离）
print(np.linalg.norm(v1, ord=1))  # L1 范数
print(np.linalg.norm(v1, ord=np.inf))  # 无穷范数

# 向量规范化
normalized = v1 / np.linalg.norm(v1)
print(normalized)
print(np.linalg.norm(normalized))  # 1.0
```

### 矩阵分解

```python
A = np.array([[1, 2], [3, 4]])

# 行列式
det = np.linalg.det(A)
print(f"行列式: {det}")  # -2.0

# 逆矩阵
inv_A = np.linalg.inv(A)
print(f"逆矩阵:\n{inv_A}")
print(f"验证 A @ inv_A:\n{A @ inv_A}")  # 单位矩阵

# 特征值和特征向量
eigenvalues, eigenvectors = np.linalg.eig(A)
print(f"特征值: {eigenvalues}")
print(f"特征向量:\n{eigenvectors}")

# 奇异值分解 (SVD)
U, S, Vt = np.linalg.svd(A)
print(f"U:\n{U}")
print(f"S: {S}")
print(f"Vt:\n{Vt}")

# QR 分解
Q, R = np.linalg.qr(A)
print(f"Q:\n{Q}")
print(f"R:\n{R}")

# Cholesky 分解（要求正定矩阵）
B = np.array([[4, 2], [2, 5]])
L = np.linalg.cholesky(B)
print(f"Cholesky L:\n{L}")
```

### 线性方程组求解

```python
# 求解 Ax = b
A = np.array([[3, 1], [1, 2]])
b = np.array([9, 8])

# 直接求解
x = np.linalg.solve(A, b)
print(f"解: {x}")  # [2, 3]

# 验证
print(f"验证 A @ x = {A @ x}")  # [9, 8]

# 最小二乘解（超定方程组）
A = np.array([[1, 1], [1, 2], [1, 3]])
b = np.array([1, 2, 2])
x, residuals, rank, s = np.linalg.lstsq(A, b, rcond=None)
print(f"最小二乘解: {x}")
print(f"残差: {residuals}")
```

## 随机数生成

NumPy 提供了强大的随机数生成功能，推荐使用新的 Generator API。

### 基本随机数

```python
# 推荐使用：Generator API（NumPy 1.17+）
rng = np.random.default_rng(seed=42)  # 创建随机数生成器

# 均匀分布 [0, 1)
print(rng.random(5))          # 5个随机数
print(rng.random((2, 3)))     # 2x3 随机数组

# 指定范围的均匀分布
print(rng.uniform(1, 10, 5))  # [1, 10) 之间的5个随机数

# 整数随机数
print(rng.integers(0, 10, 5))       # [0, 10) 之间的5个整数
print(rng.integers(1, 7, (2, 3)))   # 模拟骰子

# 从数组中随机选择
arr = np.array(['A', 'B', 'C', 'D'])
print(rng.choice(arr, 3))              # 随机选择3个（可重复）
print(rng.choice(arr, 3, replace=False))  # 不重复选择
```

### 常用概率分布

```python
rng = np.random.default_rng(42)

# 正态分布（高斯分布）
normal = rng.normal(loc=0, scale=1, size=1000)  # 均值0，标准差1
print(f"正态分布均值: {normal.mean():.3f}")
print(f"正态分布标准差: {normal.std():.3f}")

# 标准正态分布
standard_normal = rng.standard_normal(1000)

# 二项分布
binomial = rng.binomial(n=10, p=0.5, size=1000)  # 10次试验，成功概率0.5

# 泊松分布
poisson = rng.poisson(lam=5, size=1000)  # lambda=5

# 指数分布
exponential = rng.exponential(scale=1.0, size=1000)

# 伽马分布
gamma = rng.gamma(shape=2, scale=2, size=1000)

# 贝塔分布
beta = rng.beta(a=2, b=5, size=1000)

# 卡方分布
chisquare = rng.chisquare(df=3, size=1000)
```

### 随机排列和打乱

```python
rng = np.random.default_rng(42)

# 打乱数组
arr = np.arange(10)
rng.shuffle(arr)  # 原地打乱
print(f"打乱后: {arr}")

# 返回打乱后的副本
arr = np.arange(10)
shuffled = rng.permutation(arr)  # 返回副本，原数组不变
print(f"原数组: {arr}")
print(f"打乱副本: {shuffled}")

# 生成随机排列
perm = rng.permutation(10)  # 0-9 的随机排列
print(f"随机排列: {perm}")
```

### 设置随机种子

```python
# 方法1：创建带种子的生成器（推荐）
rng = np.random.default_rng(42)
print(rng.random(3))

# 每次使用相同种子得到相同结果
rng = np.random.default_rng(42)
print(rng.random(3))  # 与上面相同

# 方法2：旧式 API（仍可用但不推荐）
np.random.seed(42)
print(np.random.rand(3))
```

## 性能优化技巧

### 避免 Python 循环

```python
# 不好的做法：使用 Python 循环
def slow_function(arr):
    result = np.zeros_like(arr)
    for i in range(len(arr)):
        result[i] = arr[i] ** 2 + 2 * arr[i] + 1
    return result

# 好的做法：向量化操作
def fast_function(arr):
    return arr ** 2 + 2 * arr + 1

# 性能对比
arr = np.arange(100000)
# fast_function 通常快 100 倍以上
```

### 使用视图而非副本

```python
# 尽量使用视图
arr = np.arange(1000000)

# 视图（高效）
view = arr[::2]  # 不复制数据

# 副本（慢，占用内存）
copy = arr[::2].copy()  # 复制数据

# 判断是否为视图
print(view.base is arr)  # True
print(copy.base is None)  # True
```

### 使用适当的数据类型

```python
# 根据数据范围选择合适的类型
small_ints = np.array([1, 2, 3, 4], dtype=np.int8)   # -128 到 127
large_ints = np.array([1, 2, 3, 4], dtype=np.int64)  # 更大范围

print(f"int8 内存: {small_ints.nbytes} bytes")
print(f"int64 内存: {large_ints.nbytes} bytes")

# 对于不需要高精度的浮点数，使用 float32
float32_arr = np.random.rand(1000000).astype(np.float32)
float64_arr = np.random.rand(1000000).astype(np.float64)
print(f"float32 内存: {float32_arr.nbytes / 1e6} MB")
print(f"float64 内存: {float64_arr.nbytes / 1e6} MB")
```

### 预分配数组

```python
# 不好的做法：动态扩展
def bad_append():
    result = np.array([])
    for i in range(10000):
        result = np.append(result, i)
    return result

# 好的做法：预分配
def good_preallocate():
    result = np.zeros(10000)
    for i in range(10000):
        result[i] = i
    return result

# 最好的做法：直接向量化
def best_vectorized():
    return np.arange(10000)
```

### 使用 np.einsum 进行复杂运算

```python
# einsum 是一个强大的工具，可以高效执行各种张量运算
A = np.random.rand(100, 200)
B = np.random.rand(200, 300)
C = np.random.rand(100, 300)

# 矩阵乘法
result = np.einsum('ij,jk->ik', A, B)

# 矩阵转置
transposed = np.einsum('ij->ji', A)

# 对角线元素
diag = np.einsum('ii->i', np.eye(5))

# 迹
trace = np.einsum('ii->', np.array([[1, 2], [3, 4]]))

# 外积
outer = np.einsum('i,j->ij', np.array([1, 2, 3]), np.array([4, 5]))

# 批量矩阵乘法
batch_A = np.random.rand(10, 3, 4)
batch_B = np.random.rand(10, 4, 5)
batch_result = np.einsum('nij,njk->nik', batch_A, batch_B)
```

### 内存布局优化

```python
# C 顺序（行优先）vs Fortran 顺序（列优先）
arr_c = np.zeros((1000, 1000), order='C')  # C 顺序（默认）
arr_f = np.zeros((1000, 1000), order='F')  # Fortran 顺序

# 按行访问 C 顺序更快
# 按列访问 Fortran 顺序更快

# 检查数组是否连续
print(arr_c.flags['C_CONTIGUOUS'])  # True
print(arr_c.flags['F_CONTIGUOUS'])  # False

# 使用 np.ascontiguousarray 确保连续性
arr = np.random.rand(100, 100)[:, ::2]  # 非连续
contiguous = np.ascontiguousarray(arr)  # 转为连续
```

## 面试要点

### NumPy 数组与 Python 列表的区别

```python
# Python 列表：动态类型，元素可以不同类型
py_list = [1, 'hello', 3.14, True]

# NumPy 数组：固定类型，所有元素类型相同
np_array = np.array([1, 2, 3, 4])

# 主要区别：
# 类型：NumPy 数组是同质的（同一类型）
# 性能：NumPy 使用连续内存，向量化操作更快
# 功能：NumPy 提供丰富的数学和科学计算函数
# 内存：NumPy 数组占用更少内存
```

### 广播机制的工作原理

```python
# 广播规则（从右向左比较形状）：
# 维度相等
# 其中一个维度为 1

# 例子
a = np.ones((3, 4, 5))  # shape: (3, 4, 5)
b = np.ones((4, 5))     # shape: (4, 5) -> (1, 4, 5)
c = a + b               # shape: (3, 4, 5) - 可以广播

a = np.ones((3, 4))     # shape: (3, 4)
b = np.ones((3,))       # shape: (3,) -> (1, 3)
# c = a + b             # 错误！(3, 4) 和 (1, 3) 不兼容
```

### 视图 vs 副本

```python
arr = np.array([1, 2, 3, 4, 5])

# 创建视图的操作（共享内存）：
view1 = arr[1:4]       # 切片
view2 = arr.reshape(5, 1)  # reshape
view3 = arr.T          # 转置

# 创建副本的操作（独立内存）：
copy1 = arr[[0, 2, 4]]  # 花式索引
copy2 = arr.copy()      # 显式复制
copy3 = arr.flatten()   # flatten
```

### axis 参数的理解

```python
arr = np.array([[1, 2, 3],
                [4, 5, 6]])

# axis=0：沿着第一个维度（行）操作，结果减少行
print(np.sum(arr, axis=0))  # [5, 7, 9]

# axis=1：沿着第二个维度（列）操作，结果减少列
print(np.sum(arr, axis=1))  # [6, 15]

# 记忆技巧：axis 指定的维度会"消失"
```

### 常见陷阱

```python
# 陷阱1：整数除法
a = np.array([1, 2, 3])
b = np.array([2, 2, 2])
print(a / b)   # [0.5, 1.0, 1.5] - Python 3 中是浮点除法
print(a // b)  # [0, 1, 1] - 整数除法

# 陷阱2：比较浮点数
a = 0.1 + 0.2
b = 0.3
print(a == b)  # False（浮点精度问题）
print(np.isclose(a, b))  # True（正确做法）
print(np.allclose([a], [b]))  # True（数组比较）

# 陷阱3：修改视图影响原数组
arr = np.array([1, 2, 3, 4, 5])
view = arr[1:4]
view[0] = 100
print(arr)  # [1, 100, 3, 4, 5]（原数组也变了！）

# 陷阱4：空数组的聚合
empty = np.array([])
# print(np.max(empty))  # 错误！
print(np.max(empty, initial=0))  # 0（提供默认值）
```

### 性能优化面试题

```python
# 问：如何高效计算两个数组对应元素的欧氏距离？

# 低效做法
def slow_dist(a, b):
    return [np.sqrt((a[i] - b[i])**2) for i in range(len(a))]

# 高效做法
def fast_dist(a, b):
    return np.sqrt((a - b)**2)

# 最高效（直接使用 abs）
def fastest_dist(a, b):
    return np.abs(a - b)
```

### 实际应用示例

```python
# 图像处理：灰度化
def rgb_to_gray(image):
    """将 RGB 图像转换为灰度图"""
    # image shape: (H, W, 3)
    weights = np.array([0.299, 0.587, 0.114])
    return np.dot(image[..., :3], weights)

# 机器学习：特征标准化
def standardize(X):
    """Z-score 标准化"""
    mean = X.mean(axis=0)
    std = X.std(axis=0)
    return (X - mean) / std

# 数值计算：梯度计算
def numerical_gradient(f, x, h=1e-4):
    """计算数值梯度"""
    grad = np.zeros_like(x)
    for i in range(x.size):
        x_plus = x.copy()
        x_plus[i] += h
        x_minus = x.copy()
        x_minus[i] -= h
        grad[i] = (f(x_plus) - f(x_minus)) / (2 * h)
    return grad
```

## 总结

NumPy 是 Python 科学计算的基石，掌握它对于数据科学、机器学习和科学研究至关重要。关键要点包括：

1. **ndarray 是核心**：理解其属性、数据类型和内存布局
2. **向量化思维**：避免 Python 循环，利用广播和向量化操作
3. **索引灵活运用**：熟练使用基础索引、花式索引和布尔索引
4. **线性代数基础**：掌握矩阵运算和常用分解方法
5. **性能意识**：了解视图/副本区别，选择合适的数据类型

NumPy 的学习是一个持续的过程，建议在实际项目中多加练习，逐步提高对其高级特性的理解和运用能力。
