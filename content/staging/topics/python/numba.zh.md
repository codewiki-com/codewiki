---
title: Python Numba JIT 编译
description: 深入理解 Numba JIT 编译：@jit、@njit、nopython 模式、向量化与 CUDA GPU 加速
track: python
section: typing-tooling
difficulty: advanced
tags:
  - Python
  - Numba
  - JIT
  - 性能优化
  - GPU
  - CUDA
  - 并行计算
status: imported
origin: old/src/content/docs/python/numba.zh.md
divergence: 0.204
issues:
  - title-lang-en
  - title-language
legacy:
  category: Python
  subcategory: 性能优化
  order: 50
  lastUpdated: 2026-01-07
---

## 概念解释

### 什么是 Numba？

Numba 是一个开源的 JIT（Just-In-Time，即时编译）编译器，能够将 Python 和 NumPy 代码编译为高效的机器码。通过简单地添加装饰器，Numba 可以将纯 Python 函数的执行速度提升数十甚至数百倍，而无需修改代码结构或学习新的编程语言。

### 历史背景

Numba 由 Anaconda（原 Continuum Analytics）开发，于 2012 年首次发布。它的设计目标是让科学计算和数据分析领域的 Python 开发者能够轻松获得接近 C/Fortran 的性能，同时保持 Python 的简洁性和易用性。

### 解决什么问题？

Python 作为解释型语言，在执行数值计算密集型任务时性能较低。传统的解决方案包括：

1. **使用 NumPy**：向量化操作，但仍有 Python 解释器开销
2. **编写 C/C++ 扩展**：性能好但开发复杂
3. **使用 Cython**：需要学习新语法，编译过程繁琐

Numba 提供了一种更简单的解决方案：

```python
from numba import jit
import numpy as np

# 普通 Python 函数 - 较慢
def slow_sum(arr):
    total = 0
    for i in range(len(arr)):
        total += arr[i]
    return total

# 添加 @jit 装饰器 - 快数十倍
@jit(nopython=True)
def fast_sum(arr):
    total = 0
    for i in range(len(arr)):
        total += arr[i]
    return total

arr = np.random.random(1000000)
# fast_sum 比 slow_sum 快约 100 倍
```

## 核心原理

### JIT 编译的工作流程

Numba 的 JIT 编译过程分为以下几个阶段：

```
Python 源码 → 字节码分析 → 类型推断 → LLVM IR → 机器码
```

1. **字节码分析**：Numba 分析 Python 函数的字节码
2. **类型推断**：根据输入参数推断变量类型
3. **IR 生成**：生成 LLVM 中间表示（IR）
4. **机器码编译**：LLVM 将 IR 编译为优化的机器码
5. **缓存**：编译结果被缓存，后续调用直接使用

### 类型推断机制

```python
from numba import jit
import numpy as np

@jit(nopython=True)
def type_inference_example(x, y):
    # Numba 自动推断：
    # x: float64（如果传入浮点数）
    # y: int64（如果传入整数）
    # result: float64（浮点运算结果）
    result = x * 2.0 + y
    return result

# 第一次调用时编译（针对 float64, int64）
print(type_inference_example(3.14, 10))

# 不同类型的参数会触发重新编译
print(type_inference_example(np.array([1.0, 2.0]), 5))
```

### nopython 模式 vs object 模式

Numba 有两种编译模式：

**nopython 模式**（推荐）：
- 完全编译为机器码，不调用 Python 解释器
- 性能最佳，通常比纯 Python 快 10-100 倍
- 限制：只支持 Numba 支持的类型和操作

**object 模式**：
- 回退到 Python 对象操作
- 性能较差，可能比纯 Python 还慢
- 支持更多 Python 特性

```python
from numba import jit

# 强制 nopython 模式，不支持的操作会报错
@jit(nopython=True)  # 等价于 @njit
def nopython_func(x):
    return x ** 2

# 允许回退到 object 模式（不推荐）
@jit(forceobj=True)
def object_func(x):
    return str(x)  # 字符串操作需要 object 模式
```

## 核心要点

### @jit 装饰器

`@jit` 是 Numba 最基本的装饰器：

```python
from numba import jit

# 基本用法
@jit
def basic_function(x, y):
    return x + y

# 带参数的用法
@jit(nopython=True, cache=True, parallel=True)
def optimized_function(arr):
    total = 0.0
    for i in range(len(arr)):
        total += arr[i]
    return total
```

常用参数说明：

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `nopython` | 强制 nopython 模式 | `False` |
| `cache` | 缓存编译结果到磁盘 | `False` |
| `parallel` | 启用自动并行化 | `False` |
| `fastmath` | 使用快速数学运算（牺牲精度） | `False` |
| `nogil` | 释放 GIL（与 parallel 一起使用） | `False` |

### @njit 装饰器

`@njit` 是 `@jit(nopython=True)` 的简写，推荐使用：

```python
from numba import njit
import numpy as np

@njit
def matrix_multiply(A, B):
    """手动实现矩阵乘法"""
    M, K = A.shape
    K2, N = B.shape
    assert K == K2

    C = np.zeros((M, N))
    for i in range(M):
        for j in range(N):
            for k in range(K):
                C[i, j] += A[i, k] * B[k, j]
    return C

A = np.random.random((100, 100))
B = np.random.random((100, 100))
result = matrix_multiply(A, B)
```

### 类型签名

可以显式指定函数签名以避免首次调用时的编译延迟：

```python
from numba import njit, int64, float64

# 单一签名
@njit(float64(float64, float64))
def add_floats(x, y):
    return x + y

# 多个签名（函数重载）
@njit([
    int64(int64, int64),
    float64(float64, float64)
])
def add_numbers(x, y):
    return x + y

# 数组签名
@njit(float64[:](float64[:], float64))
def scale_array(arr, factor):
    return arr * factor
```

### @vectorize 装饰器

`@vectorize` 创建 NumPy ufunc（通用函数）：

```python
from numba import vectorize, float64, int64
import numpy as np

# 创建向量化函数
@vectorize([float64(float64, float64)])
def fast_add(x, y):
    return x + y

# 支持广播
a = np.array([1.0, 2.0, 3.0])
b = np.array([4.0, 5.0, 6.0])
print(fast_add(a, b))  # [5. 7. 9.]

# 标量与数组
print(fast_add(a, 10.0))  # [11. 12. 13.]
```

### @guvectorize 装饰器

`@guvectorize` 用于广义 ufunc，可以处理多维数组：

```python
from numba import guvectorize, float64
import numpy as np

@guvectorize([(float64[:], float64[:], float64[:])], '(n),(n)->(n)')
def add_arrays(a, b, result):
    """逐元素相加，结果存入 result"""
    for i in range(len(a)):
        result[i] = a[i] + b[i]

# 一维数组
a = np.array([1.0, 2.0, 3.0])
b = np.array([4.0, 5.0, 6.0])
result = np.zeros(3)
add_arrays(a, b, result)
print(result)  # [5. 7. 9.]

# 归约操作
@guvectorize([(float64[:], float64[:])], '(n)->()')
def sum_array(arr, result):
    """对数组求和"""
    total = 0.0
    for i in range(len(arr)):
        total += arr[i]
    result[0] = total

arr = np.array([1.0, 2.0, 3.0, 4.0])
result = np.zeros(1)
sum_array(arr, result)
print(result[0])  # 10.0
```

### 并行计算 (prange)

使用 `prange` 替代 `range` 实现自动并行化：

```python
from numba import njit, prange
import numpy as np

@njit(parallel=True)
def parallel_sum(arr):
    """并行求和"""
    total = 0.0
    for i in prange(len(arr)):
        total += arr[i]
    return total

@njit(parallel=True)
def parallel_matrix_multiply(A, B):
    """并行矩阵乘法"""
    M, K = A.shape
    K2, N = B.shape
    C = np.zeros((M, N))

    for i in prange(M):  # 并行化外层循环
        for j in range(N):
            for k in range(K):
                C[i, j] += A[i, k] * B[k, j]
    return C

# 测试
arr = np.random.random(10000000)
print(parallel_sum(arr))

A = np.random.random((500, 500))
B = np.random.random((500, 500))
C = parallel_matrix_multiply(A, B)
```

### CUDA GPU 支持

Numba 支持 NVIDIA GPU 加速：

```python
from numba import cuda
import numpy as np
import math

# GPU 核函数
@cuda.jit
def gpu_add(a, b, result):
    """在 GPU 上执行向量加法"""
    idx = cuda.grid(1)  # 获取全局线程索引
    if idx < len(a):
        result[idx] = a[idx] + b[idx]

# 主机代码
n = 1000000
a = np.random.random(n).astype(np.float32)
b = np.random.random(n).astype(np.float32)
result = np.zeros(n, dtype=np.float32)

# 复制数据到 GPU
d_a = cuda.to_device(a)
d_b = cuda.to_device(b)
d_result = cuda.to_device(result)

# 配置线程块
threads_per_block = 256
blocks_per_grid = (n + threads_per_block - 1) // threads_per_block

# 启动核函数
gpu_add[blocks_per_grid, threads_per_block](d_a, d_b, d_result)

# 复制结果回主机
result = d_result.copy_to_host()
print(result[:10])
```

**CUDA 设备函数**：

```python
from numba import cuda
import math

# 设备函数（可被核函数调用）
@cuda.jit(device=True)
def device_sigmoid(x):
    return 1.0 / (1.0 + math.exp(-x))

@cuda.jit
def apply_sigmoid(arr, result):
    idx = cuda.grid(1)
    if idx < len(arr):
        result[idx] = device_sigmoid(arr[idx])
```

**共享内存优化**：

```python
from numba import cuda
import numpy as np

@cuda.jit
def matrix_multiply_shared(A, B, C):
    """使用共享内存的矩阵乘法"""
    # 定义共享内存
    TILE_SIZE = 16
    sA = cuda.shared.array((TILE_SIZE, TILE_SIZE), dtype=np.float32)
    sB = cuda.shared.array((TILE_SIZE, TILE_SIZE), dtype=np.float32)

    tx = cuda.threadIdx.x
    ty = cuda.threadIdx.y
    bx = cuda.blockIdx.x
    by = cuda.blockIdx.y

    row = by * TILE_SIZE + ty
    col = bx * TILE_SIZE + tx

    # 累加器
    tmp = 0.0

    # 分块计算
    for m in range((A.shape[1] + TILE_SIZE - 1) // TILE_SIZE):
        # 加载到共享内存
        if row < A.shape[0] and m * TILE_SIZE + tx < A.shape[1]:
            sA[ty, tx] = A[row, m * TILE_SIZE + tx]
        else:
            sA[ty, tx] = 0.0

        if m * TILE_SIZE + ty < B.shape[0] and col < B.shape[1]:
            sB[ty, tx] = B[m * TILE_SIZE + ty, col]
        else:
            sB[ty, tx] = 0.0

        # 同步线程
        cuda.syncthreads()

        # 计算部分结果
        for k in range(TILE_SIZE):
            tmp += sA[ty, k] * sB[k, tx]

        cuda.syncthreads()

    # 写回结果
    if row < C.shape[0] and col < C.shape[1]:
        C[row, col] = tmp
```

## 代码示例

### 示例 1：数值计算加速

```python
from numba import njit
import numpy as np
import time

# 蒙特卡洛方法计算 Pi
@njit
def monte_carlo_pi(n_samples):
    """使用蒙特卡洛方法估算 Pi"""
    inside = 0
    for _ in range(n_samples):
        x = np.random.random()
        y = np.random.random()
        if x**2 + y**2 <= 1.0:
            inside += 1
    return 4.0 * inside / n_samples

def pure_python_pi(n_samples):
    """纯 Python 实现"""
    import random
    inside = 0
    for _ in range(n_samples):
        x = random.random()
        y = random.random()
        if x**2 + y**2 <= 1.0:
            inside += 1
    return 4.0 * inside / n_samples

# 性能对比
n = 10000000

# 预热 JIT
monte_carlo_pi(100)

start = time.time()
pi_numba = monte_carlo_pi(n)
numba_time = time.time() - start

start = time.time()
pi_python = pure_python_pi(n)
python_time = time.time() - start

print(f"Numba: Pi = {pi_numba:.6f}, 耗时 {numba_time:.3f} 秒")
print(f"Python: Pi = {pi_python:.6f}, 耗时 {python_time:.3f} 秒")
print(f"加速比: {python_time / numba_time:.1f}x")
```

### 示例 2：图像处理

```python
from numba import njit, prange
import numpy as np

@njit(parallel=True)
def blur_image(image, kernel_size=5):
    """高斯模糊（均值滤波近似）"""
    height, width = image.shape
    half_k = kernel_size // 2
    result = np.zeros_like(image)

    for i in prange(half_k, height - half_k):
        for j in range(half_k, width - half_k):
            total = 0.0
            count = 0
            for ki in range(-half_k, half_k + 1):
                for kj in range(-half_k, half_k + 1):
                    total += image[i + ki, j + kj]
                    count += 1
            result[i, j] = total / count

    return result

@njit
def sobel_edge_detection(image):
    """Sobel 边缘检测"""
    height, width = image.shape
    result = np.zeros_like(image)

    # Sobel 算子
    Gx = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], dtype=np.float64)
    Gy = np.array([[-1, -2, -1], [0, 0, 0], [1, 2, 1]], dtype=np.float64)

    for i in range(1, height - 1):
        for j in range(1, width - 1):
            gx = 0.0
            gy = 0.0
            for ki in range(-1, 2):
                for kj in range(-1, 2):
                    pixel = image[i + ki, j + kj]
                    gx += pixel * Gx[ki + 1, kj + 1]
                    gy += pixel * Gy[ki + 1, kj + 1]
            result[i, j] = np.sqrt(gx**2 + gy**2)

    return result

# 测试
image = np.random.random((1000, 1000))
blurred = blur_image(image)
edges = sobel_edge_detection(image)
print(f"模糊图像形状: {blurred.shape}")
print(f"边缘图像形状: {edges.shape}")
```

### 示例 3：科学计算

```python
from numba import njit
import numpy as np

@njit
def runge_kutta_4(f, y0, t0, t1, n_steps):
    """四阶龙格-库塔方法求解常微分方程

    求解 dy/dt = f(t, y)
    """
    dt = (t1 - t0) / n_steps
    t = t0
    y = y0

    results_t = np.zeros(n_steps + 1)
    results_y = np.zeros(n_steps + 1)
    results_t[0] = t
    results_y[0] = y

    for i in range(n_steps):
        k1 = f(t, y)
        k2 = f(t + dt/2, y + dt*k1/2)
        k3 = f(t + dt/2, y + dt*k2/2)
        k4 = f(t + dt, y + dt*k3)

        y = y + (dt/6) * (k1 + 2*k2 + 2*k3 + k4)
        t = t + dt

        results_t[i + 1] = t
        results_y[i + 1] = y

    return results_t, results_y

@njit
def harmonic_oscillator(t, y):
    """简谐振动 dy/dt = -sin(y)"""
    return -np.sin(y)

# 求解
t, y = runge_kutta_4(harmonic_oscillator, 1.0, 0.0, 10.0, 1000)
print(f"t 范围: [{t[0]:.2f}, {t[-1]:.2f}]")
print(f"y 终值: {y[-1]:.6f}")
```

### 示例 4：并行数据处理

```python
from numba import njit, prange
import numpy as np

@njit(parallel=True)
def parallel_histogram(data, bins, min_val, max_val):
    """并行直方图计算"""
    n_bins = len(bins) - 1
    histogram = np.zeros(n_bins, dtype=np.int64)
    bin_width = (max_val - min_val) / n_bins

    for i in prange(len(data)):
        val = data[i]
        if min_val <= val < max_val:
            bin_idx = int((val - min_val) / bin_width)
            if bin_idx >= n_bins:
                bin_idx = n_bins - 1
            histogram[bin_idx] += 1

    return histogram

@njit(parallel=True)
def parallel_moving_average(data, window_size):
    """并行滑动平均"""
    n = len(data)
    result = np.zeros(n)
    half_window = window_size // 2

    for i in prange(n):
        start = max(0, i - half_window)
        end = min(n, i + half_window + 1)
        total = 0.0
        for j in range(start, end):
            total += data[j]
        result[i] = total / (end - start)

    return result

# 测试
data = np.random.randn(10000000)

bins = np.linspace(-4, 4, 101)
hist = parallel_histogram(data, bins, -4.0, 4.0)
print(f"直方图 bin 数量: {len(hist)}")

smooth_data = parallel_moving_average(data, 5)
print(f"平滑数据长度: {len(smooth_data)}")
```

### 示例 5：CUDA GPU 计算

```python
from numba import cuda
import numpy as np
import math

@cuda.jit
def mandelbrot_kernel(min_x, max_x, min_y, max_y, image, max_iters):
    """Mandelbrot 集合计算（GPU 版本）"""
    height, width = image.shape

    x, y = cuda.grid(2)

    if x < width and y < height:
        # 计算复平面坐标
        real = min_x + (x / width) * (max_x - min_x)
        imag = min_y + (y / height) * (max_y - min_y)

        c = complex(real, imag)
        z = 0j

        for i in range(max_iters):
            z = z * z + c
            if abs(z) > 2:
                image[y, x] = i
                return

        image[y, x] = max_iters

def compute_mandelbrot_gpu(width, height, max_iters=256):
    """在 GPU 上计算 Mandelbrot 集合"""
    # 分配设备内存
    image = cuda.device_array((height, width), dtype=np.int32)

    # 配置线程网格
    threads_per_block = (16, 16)
    blocks_per_grid_x = (width + threads_per_block[0] - 1) // threads_per_block[0]
    blocks_per_grid_y = (height + threads_per_block[1] - 1) // threads_per_block[1]
    blocks_per_grid = (blocks_per_grid_x, blocks_per_grid_y)

    # 启动核函数
    mandelbrot_kernel[blocks_per_grid, threads_per_block](
        -2.0, 1.0, -1.5, 1.5, image, max_iters
    )

    # 复制结果回主机
    return image.copy_to_host()

# 使用示例（需要 CUDA 环境）
# result = compute_mandelbrot_gpu(1920, 1080, 256)
# print(f"Mandelbrot 图像形状: {result.shape}")
```

## 最佳实践

### 优先使用 @njit

```python
from numba import njit

# 推荐：明确要求 nopython 模式
@njit
def good_function(x):
    return x ** 2

# 不推荐：可能回退到 object 模式
from numba import jit

@jit
def maybe_slow_function(x):
    return x ** 2
```

### 启用缓存

```python
from numba import njit

# 启用磁盘缓存，避免重复编译
@njit(cache=True)
def cached_function(arr):
    total = 0.0
    for i in range(len(arr)):
        total += arr[i]
    return total
```

### 使用正确的数据类型

```python
from numba import njit
import numpy as np

@njit
def type_aware_function(arr):
    # 使用与输入相同的类型初始化
    total = arr.dtype.type(0)  # 自动匹配类型
    for i in range(len(arr)):
        total += arr[i]
    return total

# 指定正确的 dtype
arr_float32 = np.random.random(1000).astype(np.float32)
arr_float64 = np.random.random(1000).astype(np.float64)

result32 = type_aware_function(arr_float32)  # 返回 float32
result64 = type_aware_function(arr_float64)  # 返回 float64
```

### 避免 Python 对象操作

```python
from numba import njit
import numpy as np

# 错误示例：使用 Python 列表
# @njit
# def bad_function():
#     result = []  # Python 列表不支持
#     for i in range(10):
#         result.append(i)
#     return result

# 正确示例：使用 NumPy 数组
@njit
def good_function():
    result = np.zeros(10, dtype=np.int64)
    for i in range(10):
        result[i] = i
    return result
```

### 正确使用 prange

```python
from numba import njit, prange
import numpy as np

# 适合并行化：独立迭代
@njit(parallel=True)
def good_parallel(arr):
    result = np.zeros_like(arr)
    for i in prange(len(arr)):
        result[i] = arr[i] ** 2  # 每次迭代独立
    return result

# 需要归约：使用正确的模式
@njit(parallel=True)
def parallel_reduction(arr):
    total = 0.0
    for i in prange(len(arr)):
        total += arr[i]  # Numba 自动处理归约
    return total
```

### 预热 JIT 编译

```python
from numba import njit
import numpy as np
import time

@njit
def my_function(arr):
    return np.sum(arr ** 2)

# 预热：首次调用触发编译
dummy = np.array([1.0, 2.0, 3.0])
my_function(dummy)  # 编译

# 现在可以准确测量性能
arr = np.random.random(1000000)
start = time.time()
result = my_function(arr)
elapsed = time.time() - start
print(f"执行时间: {elapsed:.4f} 秒")
```

### 使用 fastmath 加速（牺牲精度）

```python
from numba import njit
import numpy as np

# 默认：严格 IEEE 754 浮点运算
@njit
def precise_function(arr):
    return np.sum(arr)

# fastmath：更快但可能有精度损失
@njit(fastmath=True)
def fast_function(arr):
    return np.sum(arr)

# 适用于对精度要求不高的场景
arr = np.random.random(1000000)
# fast_function 可能快 2-5 倍，但结果可能略有不同
```

## 常见陷阱

### 首次调用延迟

```python
from numba import njit
import time

@njit
def slow_first_call(arr):
    return arr.sum()

arr = np.random.random(100)

# 首次调用包含编译时间
start = time.time()
slow_first_call(arr)
print(f"首次调用: {time.time() - start:.4f} 秒")  # 可能较慢

# 后续调用很快
start = time.time()
slow_first_call(arr)
print(f"后续调用: {time.time() - start:.6f} 秒")  # 很快
```

**解决方案**：使用 `cache=True` 或预热。

### 不支持的 Python 特性

```python
from numba import njit

# 错误：不支持字典推导
# @njit
# def bad_dict_comp():
#     return {i: i**2 for i in range(10)}

# 错误：不支持 set
# @njit
# def bad_set():
#     return set([1, 2, 3])

# 错误：不支持 try/except
# @njit
# def bad_exception():
#     try:
#         return 1 / 0
#     except:
#         return 0

# 正确：使用支持的类型
@njit
def good_function():
    result = np.zeros(10)
    for i in range(10):
        result[i] = i ** 2
    return result
```

### 字符串操作不支持

```python
from numba import njit

# 错误：字符串操作不支持
# @njit
# def bad_string():
#     s = "hello"
#     return s.upper()

# 解决方案：在 Numba 外处理字符串
def process_with_strings(arr):
    # 字符串处理在外部
    label = "result"

    @njit
    def numeric_part(arr):
        return arr.sum()

    result = numeric_part(arr)
    return f"{label}: {result}"
```

### 全局变量陷阱

```python
from numba import njit
import numpy as np

# 陷阱：全局变量在编译时捕获
GLOBAL_VALUE = 10

@njit
def uses_global():
    return GLOBAL_VALUE * 2

print(uses_global())  # 20

GLOBAL_VALUE = 20  # 修改全局变量
print(uses_global())  # 仍然是 20！（使用编译时的值）

# 解决方案：将变量作为参数传递
@njit
def better_function(value):
    return value * 2

print(better_function(10))  # 20
print(better_function(20))  # 40
```

### 类型不匹配导致重复编译

```python
from numba import njit
import numpy as np

@njit
def type_sensitive(arr):
    return arr.sum()

# 每种类型组合都会触发新的编译
arr_float32 = np.array([1.0, 2.0], dtype=np.float32)
arr_float64 = np.array([1.0, 2.0], dtype=np.float64)
arr_int32 = np.array([1, 2], dtype=np.int32)

type_sensitive(arr_float32)  # 编译 1
type_sensitive(arr_float64)  # 编译 2
type_sensitive(arr_int32)    # 编译 3

# 解决方案：统一数据类型
arr = np.array([1, 2], dtype=np.float64)  # 统一使用 float64
```

### 递归深度限制

```python
from numba import njit

# 深度递归可能有问题
@njit
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# 小数值可以
print(fibonacci(20))  # OK

# 大数值可能失败
# print(fibonacci(1000))  # 可能栈溢出

# 解决方案：使用迭代
@njit
def fibonacci_iterative(n):
    if n < 2:
        return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b
```

## 性能考量

### 编译开销分析

```python
from numba import njit
import numpy as np
import time

@njit
def example_function(arr):
    return np.sum(arr ** 2)

arr = np.random.random(1000)

# 首次调用（包含编译）
start = time.time()
example_function(arr)
compile_time = time.time() - start

# 后续调用（纯执行）
times = []
for _ in range(100):
    start = time.time()
    example_function(arr)
    times.append(time.time() - start)

avg_time = np.mean(times)

print(f"编译时间: {compile_time:.4f} 秒")
print(f"平均执行时间: {avg_time:.6f} 秒")
print(f"需要调用 {int(compile_time / avg_time)} 次才能抵消编译开销")
```

### 何时使用 Numba

| 场景 | 是否推荐 | 原因 |
|------|----------|------|
| 数值循环计算 | 强烈推荐 | 性能提升显著 |
| NumPy 数组操作 | 推荐 | 可以进一步优化 |
| 大量数据处理 | 推荐 | 编译开销可以被摊销 |
| 简单的一次性计算 | 不推荐 | 编译开销大于收益 |
| 字符串/IO 操作 | 不支持 | 使用原生 Python |
| 复杂对象操作 | 不推荐 | 支持有限 |

### 内存使用优化

```python
from numba import njit
import numpy as np

# 原地操作减少内存分配
@njit
def inplace_operation(arr):
    for i in range(len(arr)):
        arr[i] = arr[i] ** 2
    # 不返回新数组，原地修改

# 预分配输出数组
@njit
def preallocated_output(arr, result):
    for i in range(len(arr)):
        result[i] = arr[i] ** 2
    # 结果写入预分配的数组

# 使用示例
arr = np.random.random(1000000)
result = np.empty_like(arr)
preallocated_output(arr, result)
```

### 并行效率分析

```python
from numba import njit, prange
import numpy as np
import time

@njit
def serial_compute(arr):
    result = np.zeros_like(arr)
    for i in range(len(arr)):
        result[i] = arr[i] ** 2 + np.sin(arr[i])
    return result

@njit(parallel=True)
def parallel_compute(arr):
    result = np.zeros_like(arr)
    for i in prange(len(arr)):
        result[i] = arr[i] ** 2 + np.sin(arr[i])
    return result

# 测试不同数据规模
for size in [1000, 10000, 100000, 1000000]:
    arr = np.random.random(size)

    # 预热
    serial_compute(arr)
    parallel_compute(arr)

    # 测量
    start = time.time()
    for _ in range(10):
        serial_compute(arr)
    serial_time = (time.time() - start) / 10

    start = time.time()
    for _ in range(10):
        parallel_compute(arr)
    parallel_time = (time.time() - start) / 10

    speedup = serial_time / parallel_time
    print(f"数据规模: {size:>8} | 串行: {serial_time:.6f}s | 并行: {parallel_time:.6f}s | 加速比: {speedup:.2f}x")
```

## 实战场景

### 场景 1：金融量化计算

```python
from numba import njit, prange
import numpy as np

@njit(parallel=True)
def monte_carlo_option_pricing(S0, K, r, sigma, T, n_simulations, n_steps):
    """蒙特卡洛期权定价

    参数:
        S0: 初始股价
        K: 行权价
        r: 无风险利率
        sigma: 波动率
        T: 到期时间（年）
        n_simulations: 模拟次数
        n_steps: 时间步数

    返回:
        欧式看涨期权价格
    """
    dt = T / n_steps
    discount = np.exp(-r * T)

    payoffs = np.zeros(n_simulations)

    for i in prange(n_simulations):
        S = S0
        for j in range(n_steps):
            z = np.random.randn()
            S = S * np.exp((r - 0.5 * sigma**2) * dt + sigma * np.sqrt(dt) * z)

        payoffs[i] = max(S - K, 0)

    option_price = discount * np.mean(payoffs)
    return option_price

# 使用示例
price = monte_carlo_option_pricing(
    S0=100,      # 初始股价
    K=105,       # 行权价
    r=0.05,      # 无风险利率 5%
    sigma=0.2,   # 波动率 20%
    T=1.0,       # 1 年到期
    n_simulations=1000000,
    n_steps=252  # 交易日
)
print(f"期权价格: ${price:.2f}")
```

### 场景 2：信号处理

```python
from numba import njit
import numpy as np

@njit
def fft_cooley_tukey(x):
    """Cooley-Tukey FFT 算法实现"""
    n = len(x)

    if n == 1:
        return x.copy()

    if n % 2 != 0:
        raise ValueError("长度必须是 2 的幂")

    # 分治
    even = fft_cooley_tukey(x[0::2])
    odd = fft_cooley_tukey(x[1::2])

    # 合并
    result = np.zeros(n, dtype=np.complex128)
    for k in range(n // 2):
        t = np.exp(-2j * np.pi * k / n) * odd[k]
        result[k] = even[k] + t
        result[k + n // 2] = even[k] - t

    return result

@njit
def apply_low_pass_filter(signal, cutoff_ratio):
    """低通滤波器"""
    n = len(signal)

    # FFT
    spectrum = np.fft.fft(signal)

    # 滤波
    cutoff = int(n * cutoff_ratio)
    for i in range(cutoff, n - cutoff):
        spectrum[i] = 0

    # IFFT
    filtered = np.fft.ifft(spectrum)

    return np.real(filtered)

# 使用示例
t = np.linspace(0, 1, 1024)
signal = np.sin(2 * np.pi * 5 * t) + 0.5 * np.sin(2 * np.pi * 50 * t)  # 5Hz + 50Hz
filtered = apply_low_pass_filter(signal, 0.1)  # 保留低频
print(f"原始信号长度: {len(signal)}")
print(f"滤波后信号长度: {len(filtered)}")
```

### 场景 3：物理模拟

```python
from numba import njit, prange
import numpy as np

@njit(parallel=True)
def n_body_simulation(positions, velocities, masses, dt, n_steps):
    """N 体问题模拟

    参数:
        positions: 位置数组 (n, 3)
        velocities: 速度数组 (n, 3)
        masses: 质量数组 (n,)
        dt: 时间步长
        n_steps: 模拟步数
    """
    G = 6.67430e-11  # 引力常数
    n = len(masses)
    softening = 1e-9  # 软化参数，避免除零

    for step in range(n_steps):
        # 计算加速度
        accelerations = np.zeros_like(positions)

        for i in prange(n):
            for j in range(n):
                if i != j:
                    r = positions[j] - positions[i]
                    dist = np.sqrt(np.sum(r**2) + softening**2)
                    accelerations[i] += G * masses[j] * r / dist**3

        # 更新速度和位置（Verlet 积分）
        velocities += accelerations * dt
        positions += velocities * dt

    return positions, velocities

# 使用示例：三体问题
positions = np.array([
    [0.0, 0.0, 0.0],
    [1e11, 0.0, 0.0],
    [0.5e11, 0.866e11, 0.0]
], dtype=np.float64)

velocities = np.array([
    [0.0, 0.0, 0.0],
    [0.0, 3e4, 0.0],
    [-2.6e4, -1.5e4, 0.0]
], dtype=np.float64)

masses = np.array([1.989e30, 1.989e30, 1.989e30], dtype=np.float64)  # 三个太阳质量

final_pos, final_vel = n_body_simulation(positions, velocities, masses, dt=3600, n_steps=1000)
print(f"最终位置:\n{final_pos}")
```

### 场景 4：机器学习核心计算

```python
from numba import njit, prange
import numpy as np

@njit(parallel=True)
def k_means_iteration(data, centroids):
    """K-Means 单次迭代

    参数:
        data: 数据点 (n_samples, n_features)
        centroids: 聚类中心 (k, n_features)

    返回:
        labels: 每个点的聚类标签
        new_centroids: 更新后的聚类中心
    """
    n_samples, n_features = data.shape
    k = len(centroids)

    # 分配标签
    labels = np.zeros(n_samples, dtype=np.int64)
    for i in prange(n_samples):
        min_dist = np.inf
        for j in range(k):
            dist = 0.0
            for f in range(n_features):
                dist += (data[i, f] - centroids[j, f]) ** 2
            if dist < min_dist:
                min_dist = dist
                labels[i] = j

    # 更新聚类中心
    new_centroids = np.zeros_like(centroids)
    counts = np.zeros(k, dtype=np.int64)

    for i in range(n_samples):
        label = labels[i]
        counts[label] += 1
        for f in range(n_features):
            new_centroids[label, f] += data[i, f]

    for j in range(k):
        if counts[j] > 0:
            for f in range(n_features):
                new_centroids[j, f] /= counts[j]
        else:
            # 空聚类，保持原中心
            new_centroids[j] = centroids[j]

    return labels, new_centroids

def k_means(data, k, max_iters=100, tol=1e-4):
    """K-Means 聚类"""
    n_samples = len(data)

    # 随机初始化聚类中心
    indices = np.random.choice(n_samples, k, replace=False)
    centroids = data[indices].copy()

    for i in range(max_iters):
        labels, new_centroids = k_means_iteration(data, centroids)

        # 检查收敛
        shift = np.sqrt(np.sum((new_centroids - centroids) ** 2))
        if shift < tol:
            print(f"K-Means 在第 {i+1} 次迭代后收敛")
            break

        centroids = new_centroids

    return labels, centroids

# 使用示例
np.random.seed(42)
data = np.vstack([
    np.random.randn(1000, 2) + [0, 0],
    np.random.randn(1000, 2) + [5, 5],
    np.random.randn(1000, 2) + [10, 0]
])

labels, centroids = k_means(data, k=3)
print(f"聚类中心:\n{centroids}")
```

## 面试要点

### 什么是 Numba？它的主要用途是什么？

**答案**：Numba 是一个开源的 JIT（即时编译）编译器，能够将 Python 和 NumPy 代码编译为高效的机器码。它主要用于：
- 加速数值计算密集型 Python 代码
- 无需修改代码结构即可获得接近 C 语言的性能
- 支持 CPU 多核并行和 NVIDIA GPU 加速

### @jit 和 @njit 有什么区别？

**答案**：
- `@jit`：默认允许回退到 object 模式（如果代码包含不支持的特性）
- `@njit`：等价于 `@jit(nopython=True)`，强制使用 nopython 模式，如果代码包含不支持的特性会报错

推荐使用 `@njit`，因为 object 模式性能较差，可能比纯 Python 还慢。

### Numba 的 nopython 模式和 object 模式有什么区别？

**答案**：
- **nopython 模式**：完全编译为机器码，不调用 Python 解释器，性能最佳（通常快 10-100 倍）
- **object 模式**：使用 Python 对象操作，性能较差，但支持更多 Python 特性

nopython 模式的限制：只支持 Numba 支持的数据类型（NumPy 数组、基本数值类型等），不支持 Python 列表、字典、字符串等。

### 如何使用 Numba 实现并行计算？

**答案**：使用 `@njit(parallel=True)` 装饰器配合 `prange` 替代 `range`：

```python
from numba import njit, prange

@njit(parallel=True)
def parallel_sum(arr):
    total = 0.0
    for i in prange(len(arr)):
        total += arr[i]
    return total
```

Numba 会自动处理归约操作（如求和）的线程安全问题。

### Numba 支持哪些 Python/NumPy 特性？

**答案**：
**支持**：
- NumPy 数组及大多数 NumPy 函数
- 基本数值类型（int、float、complex）
- 元组
- 循环、条件语句
- 基本数学运算

**不支持**：
- Python 列表、字典、集合
- 字符串操作
- try/except 异常处理
- 类（有限支持）
- 大多数 Python 标准库

### 什么情况下不应该使用 Numba？

**答案**：
- 简单的一次性计算（编译开销大于收益）
- 涉及字符串、IO 操作的代码
- 需要使用 Python 字典、列表等数据结构
- 调用不支持的第三方库
- 小数据量的处理

### 如何优化 Numba 的首次调用延迟？

**答案**：
1. **使用缓存**：`@njit(cache=True)` 将编译结果缓存到磁盘
2. **预热**：在性能关键路径之前调用一次函数
3. **显式签名**：提前声明类型签名，避免类型推断
4. **AOT 编译**：使用 `@cc.export` 进行提前编译

### Numba 如何支持 GPU 计算？

**答案**：Numba 通过 `numba.cuda` 模块支持 NVIDIA GPU：

```python
from numba import cuda

@cuda.jit
def gpu_kernel(arr):
    idx = cuda.grid(1)
    if idx < len(arr):
        arr[idx] = arr[idx] ** 2
```

需要配置线程块和网格，管理设备内存，使用 CUDA 编程模型。

## 延伸阅读

### 官方资源

- [Numba 官方文档](https://numba.pydata.org/numba-doc/latest/index.html) - 最权威的参考文档
- [Numba GitHub 仓库](https://github.com/numba/numba) - 源码和问题追踪
- [Numba 示例集合](https://numba.pydata.org/numba-doc/latest/user/examples.html) - 官方示例代码

### 进阶学习

- [CUDA 编程指南](https://docs.nvidia.com/cuda/cuda-c-programming-guide/) - 理解 GPU 编程模型
- [LLVM 项目](https://llvm.org/) - 了解底层编译技术
- [NumPy 文档](https://numpy.org/doc/) - Numba 与 NumPy 紧密集成

### 相关技术对比

- **Cython**：需要额外语法，但支持更广泛的 Python 特性
- **PyPy**：整体 Python 解释器加速，但与 NumPy 兼容性有限
- **JAX**：Google 开发，支持自动微分和 GPU/TPU 加速
- **CuPy**：NumPy 的 GPU 版本，API 兼容

### 书籍推荐

- 《High Performance Python》- 涵盖多种 Python 优化技术
- 《Python for Data Analysis》- 数据分析性能优化
- 《Parallel Programming with Python》- 并行计算实践

### 社区资源

- [Numba 用户邮件列表](https://groups.google.com/g/numba-users) - 官方用户社区
- [Stack Overflow numba 标签](https://stackoverflow.com/questions/tagged/numba) - 问答社区
- [Real Python Numba 教程](https://realpython.com/numpy-tutorial/) - 入门教程
