---
title: Python统计学模块
description: Python statistics模块完全指南，涵盖均值、中位数、标准差、方差等统计函数及其应用
track: python
section: stdlib
difficulty: beginner
tags:
  - Python
  - 统计
  - 数据分析
  - 均值
  - 标准差
  - 方差
status: imported
origin: old/src/content/docs/python/statistics.zh.md
divergence: 0.276
issues:
  - missing-subcategory-en
  - order-mismatch
legacy:
  category: Python
  subcategory: 标准库
  order: 45
  lastUpdated: 2026-01-07
---

`statistics` 模块是 Python 标准库中用于基本统计计算的内置模块。它提供了计算平均值、中位数、众数、标准差、方差等统计指标的函数，适用于小型数据集和一般性统计需求。本文将深入介绍该模块的核心功能、应用场景及最佳实践。

## 概念解释

### 什么是 statistics 模块

`statistics` 模块是 Python 3.4+ 引入的统计学函数库，用于处理数值数据的统计计算。其特点包括：

- **简洁易用**：提供直观的统计函数接口
- **纯 Python 实现**：无外部依赖，内置于标准库
- **精度保证**：对数据精度的处理更加谨慎
- **容错能力**：对异常数据有合理的处理机制
- **适用小数据**：主要面向小型数据集（与 NumPy 形成互补）

### 核心统计概念

- **均值（Mean）**：所有数据的算术平均值
- **中位数（Median）**：将数据分成两部分的中间值
- **众数（Mode）**：出现频率最高的数据
- **标准差（Standard Deviation）**：数据分散程度的度量
- **方差（Variance）**：标准差的平方，衡量数据波动

### 统计模块 vs NumPy

| 特性 | statistics | NumPy |
|------|-----------|-------|
| 依赖关系 | 无外部依赖 | 需要安装 |
| 数据规模 | 小数据集 | 大数据集 |
| 性能 | 较低 | 非常高 |
| 功能完整性 | 基础统计 | 高级统计 |
| 易用程度 | 简单易用 | 学习曲线陡 |

## 核心原理

### 统计函数工作原理

```
统计计算流程:
输入数据 → 数据验证 → 计算统计量 → 返回结果
         ↓
     类型检查、异常处理
```

### 均值计算原理

```python
# 算术均值
mean = (sum(data)) / (count(data))

# 示例: [1, 2, 3, 4, 5]
# mean = (1+2+3+4+5) / 5 = 15 / 5 = 3
```

### 中位数计算原理

```python
# 对数据排序后：
# 奇数个元素：中间位置的值
# 偶数个元素：中间两个值的平均

# 示例: [1, 3, 2, 5, 4]
# 排序后: [1, 2, 3, 4, 5]
# 中位数: 3（第3个元素）

# 示例: [1, 2, 3, 4]
# 排序后: [1, 2, 3, 4]
# 中位数: (2 + 3) / 2 = 2.5
```

### 标准差计算原理

```python
# 标准差 = sqrt(方差)
# 方差 = sum((x - mean)²) / (n - 1)  [样本方差]
# 或   = sum((x - mean)²) / n        [总体方差]

# 示例: [1, 2, 3, 4, 5]
# mean = 3
# variance = ((1-3)² + (2-3)² + (3-3)² + (4-3)² + (5-3)²) / 4
#          = (4 + 1 + 0 + 1 + 4) / 4 = 2.5
# stdev = sqrt(2.5) ≈ 1.58
```

### 模块架构

```
statistics 模块
├── 均值函数
│   ├── mean()      # 算术均值
│   ├── fmean()     # 快速均值（float）
│   └── harmonic_mean()  # 调和均值
│
├── 中位数函数
│   ├── median()    # 中位数（通用）
│   ├── median_low()  # 中位数（偏低）
│   └── median_high() # 中位数（偏高）
│
├── 众数函数
│   └── mode()      # 众数
│
├── 离散程度函数
│   ├── stdev()     # 样本标准差
│   ├── pstdev()    # 总体标准差
│   ├── variance()  # 样本方差
│   └── pvariance() # 总体方差
│
├── 数据类
│   └── StatisticsError # 统计异常类
│
└── 常数
    └── NormalDist  # 正态分布（Python 3.8+）
```

## 核心要点

### 主要函数速查表

| 函数 | 说明 | 输入 | 输出 |
|-----|------|------|------|
| `mean(data)` | 算术均值 | 序列 | 数字 |
| `fmean(data)` | 快速均值（浮点数） | 序列 | float |
| `median(data)` | 中位数 | 序列 | 数字 |
| `median_low(data)` | 中位数向下 | 序列 | 数字 |
| `median_high(data)` | 中位数向上 | 序列 | 数字 |
| `mode(data)` | 众数 | 序列 | 数字 |
| `stdev(data)` | 样本标准差 | 序列 | float |
| `pstdev(data)` | 总体标准差 | 序列 | float |
| `variance(data)` | 样本方差 | 序列 | float |
| `pvariance(data)` | 总体方差 | 序列 | float |
| `quantiles(data, n)` | 分位数 | 序列, 整数 | list |
| `harmonic_mean(data)` | 调和均值 | 序列 | 数字 |

### 关键特性

- **自动数据类型转换**：接受整数、浮点数、Decimal、Fraction
- **异常处理**：统计错误抛出 `StatisticsError`
- **空数据处理**：空序列抛出异常
- **Decimal/Fraction支持**：保持精度
- **样本 vs 总体**：区分样本统计和总体统计

### 数据类型要求

```python
# 接受的数据类型
int, float, Decimal, Fraction
complex  # 仅 mean() 支持

# 不接受的类型
str, None, 对象
```

## 代码示例

### 基础均值计算

```python
from statistics import mean

# 简单列表
data = [1, 2, 3, 4, 5]
avg = mean(data)
print(f"平均值: {avg}")  # 3

# 整数列表
scores = [85, 90, 78, 92, 88]
avg_score = mean(scores)
print(f"平均成绩: {avg_score}")  # 86.6

# 浮点数列表
prices = [19.99, 29.99, 39.99, 49.99]
avg_price = mean(prices)
print(f"平均价格: {avg_price}")  # 34.99
```

### 中位数计算

```python
from statistics import median, median_low, median_high

# 奇数个元素
data1 = [1, 3, 2, 5, 4]
print(median(data1))  # 3

# 偶数个元素（使用平均值）
data2 = [1, 2, 3, 4]
print(median(data2))  # 2.5
print(median_low(data2))  # 2
print(median_high(data2))  # 3

# 实际应用：薪资中位数
salaries = [8000, 9000, 10000, 15000, 25000, 50000]
print(f"薪资中位数: {median(salaries)}")  # 12500
```

### 众数计算

```python
from statistics import mode, StatisticsError

# 单个众数
grades = ['A', 'B', 'A', 'C', 'A', 'B']
print(mode(grades))  # 'A'

# 数值众数
data = [1, 2, 2, 3, 3, 3, 4, 4, 4, 4]
print(mode(data))  # 4

# 没有众数（Python 3.8+ 返回第一个）
data_no_mode = [1, 2, 3, 4, 5]
try:
    print(mode(data_no_mode))
except StatisticsError as e:
    print(f"错误: {e}")  # Python 3.8之前会抛出异常

# Python 3.8+: multimode() 返回所有众数
from statistics import multimode
data_multi = [1, 1, 2, 2, 3]
print(multimode(data_multi))  # [1, 2]
```

### 标准差和方差

```python
from statistics import stdev, pstdev, variance, pvariance

# 样本数据
sample_data = [2, 4, 4, 4, 5, 5, 7, 9]

# 样本统计（除以 n-1）
sample_var = variance(sample_data)
sample_std = stdev(sample_data)
print(f"样本方差: {sample_var:.4f}")  # 4.5714
print(f"样本标准差: {sample_std:.4f}")  # 2.1381

# 总体统计（除以 n）
population_var = pvariance(sample_data)
population_std = pstdev(sample_data)
print(f"总体方差: {population_var:.4f}")  # 3.9844
print(f"总体标准差: {population_std:.4f}")  # 1.9961

# 实际应用：测试成绩的变异性
test_scores = [85, 87, 89, 91, 93]
print(f"成绩变异性（标准差）: {stdev(test_scores):.2f}")
```

### 调和均值

```python
from statistics import harmonic_mean

# 调和均值用于速率、比率等倒数平均
# 公式: n / (1/x1 + 1/x2 + ... + 1/xn)

# 汽车往返速率问题
# 去程速度80km/h，回程速度120km/h
# 平均速度应该用调和均值
speeds = [80, 120]
avg_speed = harmonic_mean(speeds)
print(f"平均速度: {avg_speed:.2f}")  # 96.0 km/h

# 电阻并联问题
# 两个电阻 3Ω 和 6Ω 并联的等效电阻
resistances = [3, 6]
equivalent = harmonic_mean(resistances) / len(resistances)
print(f"等效电阻: {equivalent:.2f}")  # 2.0 Ω

# 注意：调和均值不接受0或负数
try:
    harmonic_mean([1, 0, 3])
except ValueError as e:
    print(f"错误: {e}")  # 参数不能为0
```

### 高精度数据处理

```python
from statistics import mean, stdev
from decimal import Decimal
from fractions import Fraction

# 使用 Decimal 保持高精度
prices = [Decimal('19.99'), Decimal('29.99'), Decimal('39.99')]
avg_decimal = mean(prices)
print(f"精确平均价格: {avg_decimal}")  # 29.99

# 使用 Fraction 处理分数
fractions = [Fraction(1, 2), Fraction(1, 3), Fraction(1, 4)]
avg_fraction = mean(fractions)
print(f"分数平均值: {avg_fraction}")  # 13/36

# 混合类型（自动转换）
mixed = [1, 2.5, Decimal('3.5'), Fraction(4, 1)]
avg_mixed = mean(mixed)
print(f"混合平均值: {avg_mixed}")
```

### 复杂数值的均值

```python
from statistics import mean

# 复数均值（仅 mean() 支持）
complex_nums = [1+2j, 3+4j, 5+6j]
avg_complex = mean(complex_nums)
print(f"复数均值: {avg_complex}")  # (3+4j)

# 但其他函数不支持复数
from statistics import stdev
try:
    stdev(complex_nums)
except TypeError as e:
    print(f"错误: {e}")  # complex 数字不支持
```

### 分位数计算 (Python 3.8+)

```python
from statistics import quantiles

# 计算四分位数
data = list(range(1, 101))
quarts = quantiles(data, n=4)
print(f"四分位数: {quarts}")
# [25.25, 50.5, 75.75]

# 计算十分位数
deciles = quantiles(data, n=10)
print(f"十分位数: {deciles[:3]}")
# [10.25, 20.5, 30.75, ...]

# 计算百分位数
percentiles = quantiles(data, n=100)
print(f"第50百分位: {percentiles[49]}")
```

### 快速均值计算

```python
from statistics import mean, fmean
import time

# fmean() 比 mean() 更快（但使用浮点运算）
large_data = list(range(1000000))

# 常规 mean（更精确）
start = time.time()
result1 = mean(large_data)
time1 = time.time() - start

# 快速 fmean（性能优先）
start = time.time()
result2 = fmean(large_data)
time2 = time.time() - start

print(f"mean 结果: {result1}, 耗时: {time1:.4f}s")
print(f"fmean 结果: {result2}, 耗时: {time2:.4f}s")
```

### 异常处理

```python
from statistics import mean, stdev, StatisticsError

# 空序列
try:
    mean([])
except StatisticsError as e:
    print(f"均值错误: {e}")  # 'mean requires at least one data point'

# 单个数据点的标准差
try:
    stdev([5])
except StatisticsError as e:
    print(f"标准差错误: {e}")  # 需要至少两个数据点

# 无效数据类型
try:
    mean(['a', 'b', 'c'])
except TypeError as e:
    print(f"类型错误: {e}")  # unsupported operand type(s)

# 调和均值中的零值
from statistics import harmonic_mean
try:
    harmonic_mean([1, 0, 3])
except ValueError as e:
    print(f"值错误: {e}")  # harmonic mean requires non-zero values
```

### 正态分布 (Python 3.8+)

```python
from statistics import NormalDist

# 创建正态分布
dist = NormalDist(mu=100, sigma=15)  # 均值100，标准差15

# 概率密度函数（PDF）
print(f"P(X=100): {dist.pdf(100):.4f}")

# 累积分布函数（CDF）
print(f"P(X≤100): {dist.cdf(100):.4f}")  # 0.5

# 四分位数
print(f"第1四分位: {dist.quantiles(n=4)[0]:.2f}")

# 正态分布的样本
samples = dist.samples(5)
print(f"样本: {samples}")
```

### 实际数据分析示例

```python
from statistics import mean, median, stdev, variance, mode

# 销售数据分析
sales_data = [1200, 1500, 1300, 1600, 1200, 1400, 1300, 1500]

print("=== 销售数据分析 ===")
print(f"总销售额: {sum(sales_data)}")
print(f"平均销售: {mean(sales_data):.2f}")
print(f"中位销售: {median(sales_data):.2f}")
print(f"最常见销售: {mode(sales_data):.2f}")
print(f"标准差: {stdev(sales_data):.2f}")
print(f"方差: {variance(sales_data):.2f}")

# 学生成绩统计
grades = [85, 90, 78, 92, 88, 85, 95, 87, 85]

print("\n=== 学生成绩统计 ===")
print(f"平均成绩: {mean(grades):.2f}")
print(f"中位成绩: {median(grades):.2f}")
print(f"最常见成绩: {mode(grades):.2f}")
print(f"成绩波动度: {stdev(grades):.2f}")

# 异常值识别
def identify_outliers(data, threshold=2):
    """识别超过 threshold 个标准差的异常值"""
    m = mean(data)
    s = stdev(data)
    return [x for x in data if abs(x - m) > threshold * s]

outliers = identify_outliers([1, 2, 3, 4, 5, 100])
print(f"异常值: {outliers}")
```

## 最佳实践

### 选择正确的均值类型

```python
from statistics import mean, fmean, harmonic_mean

# 一般均值：使用 mean()
general_data = [1, 2, 3, 4, 5]
avg = mean(general_data)  # 推荐

# 大数据集：使用 fmean()（更快）
large_data = list(range(1000000))
avg = fmean(large_data)  # 更快

# 速率、比率均值：使用 harmonic_mean()
speeds = [60, 80, 100]
avg_speed = harmonic_mean(speeds)  # 正确方式
```

### 正确区分样本和总体统计

```python
from statistics import stdev, pstdev, variance, pvariance

# 样本数据（从总体中抽样）
sample = [1, 2, 3, 4, 5]
sample_std = stdev(sample)  # 除以 n-1
sample_var = variance(sample)

# 总体数据（整个群体）
population = [1, 2, 3, 4, 5]  # 实际所有数据
pop_std = pstdev(population)  # 除以 n
pop_var = pvariance(population)
```

### 数据验证和清洗

```python
from statistics import mean, StatisticsError

def safe_mean(data):
    """安全的均值计算"""
    # 移除 None 值
    clean_data = [x for x in data if x is not None]

    # 验证数据不为空
    if not clean_data:
        return None

    try:
        return mean(clean_data)
    except (TypeError, StatisticsError) as e:
        print(f"计算失败: {e}")
        return None

result = safe_mean([1, 2, None, 4, 5])
print(result)  # 3.0
```

### 使用 Decimal 处理金融数据

```python
from statistics import mean, stdev
from decimal import Decimal, ROUND_HALF_UP

# 金融数据必须使用 Decimal
prices = [Decimal('19.99'), Decimal('29.99'), Decimal('39.99')]
avg = mean(prices)

# 正确舍入
rounded = avg.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
print(f"平均价格: {rounded}")  # 29.99
```

### 统计数据的分层分析

```python
from statistics import mean, stdev

# 按类别分层统计
data = {
    '地区A': [100, 120, 110, 115],
    '地区B': [200, 210, 205, 215],
    '地区C': [150, 155, 160, 165]
}

for region, values in data.items():
    print(f"{region}:")
    print(f"  平均值: {mean(values):.2f}")
    print(f"  标准差: {stdev(values):.2f}")
    print()
```

### 时间序列数据的滑动平均

```python
from statistics import mean

def moving_average(data, window_size=3):
    """计算滑动平均"""
    if window_size > len(data):
        return None

    result = []
    for i in range(len(data) - window_size + 1):
        window = data[i:i + window_size]
        result.append(mean(window))
    return result

prices = [100, 102, 101, 103, 105, 104, 106]
ma = moving_average(prices, 3)
print(f"滑动平均（窗口=3）: {ma}")
# [101.0, 102.0, 103.0, 104.0, 105.0]
```

### 异常值检测和处理

```python
from statistics import mean, stdev

def detect_anomalies(data, std_threshold=2):
    """检测异常值"""
    if len(data) < 2:
        return []

    m = mean(data)
    s = stdev(data)
    return [x for x in data if abs(x - m) > std_threshold * s]

# 应用
sales = [100, 105, 102, 98, 500]  # 500 是异常值
anomalies = detect_anomalies(sales, std_threshold=2)
print(f"异常值: {anomalies}")  # [500]
```

### 对比分析

```python
from statistics import mean, stdev

def compare_groups(group1, group2):
    """对比两组数据"""
    return {
        'group1': {'mean': mean(group1), 'stdev': stdev(group1)},
        'group2': {'mean': mean(group2), 'stdev': stdev(group2)},
        'mean_diff': mean(group1) - mean(group2)
    }

# 两个学校的考试成绩对比
school_a = [80, 85, 90, 88, 92]
school_b = [75, 78, 82, 80, 85]

result = compare_groups(school_a, school_b)
print(result)
```

## 常见陷阱

### 样本和总体混淆

```python
from statistics import stdev, pstdev

data = [1, 2, 3, 4, 5]

# 错误：将样本当作总体计算
std_wrong = pstdev(data)  # 1.4142...

# 正确：明确指定是样本还是总体
std_correct = stdev(data)  # 1.5811...

# 区别：样本方差除以 n-1，总体方差除以 n
```

### 中位数偶数情况理解错误

```python
from statistics import median, median_low, median_high

data = [1, 2, 3, 4]

# 中位数是两个中间值的平均
print(median(data))  # 2.5
print(median_low(data))  # 2 （向下）
print(median_high(data))  # 3 （向上）

# 不是简单的 (3 + 4) / 2 = 3.5
```

### 调和均值的适用场景错误

```python
from statistics import mean, harmonic_mean

# 错误：对所有情况都用算术均值
speeds = [60, 120]  # 往返速度
avg_wrong = mean(speeds)  # 90 - 错误！

# 正确：速率应该用调和均值
avg_correct = harmonic_mean(speeds)  # 80.0 - 正确

# 调和均值总是小于等于算术均值
```

### 空序列处理不当

```python
from statistics import mean, StatisticsError

# 错误：直接对空序列调用统计函数
try:
    result = mean([])  # 抛出异常
except StatisticsError:
    pass

# 正确：事先检查数据
data = []
if data:
    result = mean(data)
else:
    result = None
```

### 单个数据点的标准差

```python
from statistics import stdev, StatisticsError

# 错误：单个数据点没有标准差
try:
    std = stdev([5])  # 抛出异常
except StatisticsError as e:
    print(e)  # stdev requires at least two data points

# 正确：确保至少两个数据点
data = [5, 5, 5]  # 即使都相同
std = stdev(data)  # 0.0
```

### 众数无唯一值处理

```python
from statistics import mode, StatisticsError, multimode

# Python 3.8之前：无众数会抛出异常
data = [1, 2, 3, 4, 5]
try:
    m = mode(data)  # StatisticsError
except StatisticsError:
    pass

# Python 3.8+：返回第一个或使用 multimode()
multimode(data)  # [1, 2, 3, 4, 5] 都一样频繁

# 正确做法：检查是否有多个众数
from statistics import multimode
if len(multimode(data)) > 1:
    print("数据无明确众数")
```

### 类型转换隐藏的精度损失

```python
from statistics import mean
from decimal import Decimal

# 错误：混合 float 和 Decimal
data = [1.5, Decimal('2.5'), 3.5]
result = mean(data)  # 转换为 float，失去精度

# 正确：保持一致的数据类型
data = [Decimal('1.5'), Decimal('2.5'), Decimal('3.5')]
result = mean(data)  # 保持 Decimal 精度
```

### 调和均值中的零值

```python
from statistics import harmonic_mean

# 错误：包含零值
try:
    result = harmonic_mean([1, 0, 3])  # ValueError
except ValueError as e:
    print(e)  # harmonic mean requires non-zero values

# 正确：过滤零值
data = [1, 0, 3]
non_zero = [x for x in data if x != 0]
result = harmonic_mean(non_zero)  # 1.5
```

## 性能考量

### statistics vs NumPy 性能对比

```python
from statistics import mean, stdev
import numpy as np
import time

# 大数据集性能测试
data_size = 1000000
data = list(range(data_size))
np_data = np.array(data)

# statistics 模块
start = time.time()
for _ in range(100):
    mean(data)
stats_time = time.time() - start

# NumPy
start = time.time()
for _ in range(100):
    np.mean(np_data)
numpy_time = time.time() - start

print(f"statistics: {stats_time:.4f}s")
print(f"NumPy: {numpy_time:.4f}s")
# NumPy 快 100 倍以上
```

### fmean() 和 mean() 性能对比

```python
from statistics import mean, fmean
import time

data = list(range(100000))

# mean() - 更精确但较慢
start = time.time()
for _ in range(1000):
    mean(data)
time_mean = time.time() - start

# fmean() - 更快但使用浮点
start = time.time()
for _ in range(1000):
    fmean(data)
time_fmean = time.time() - start

print(f"mean: {time_mean:.4f}s")
print(f"fmean: {time_fmean:.4f}s")
# fmean 通常快 2-3 倍
```

### 内存使用

```python
from statistics import mean, median
import sys

data = list(range(1000000))

# statistics 模块函数的内存效率
# mean() 需要遍历一次，O(n) 时间，O(1) 空间
mean_result = mean(data)

# median() 需要排序，O(n) 空间
median_result = median(data)

# 大数据集建议：
# 使用 NumPy 或 Pandas
# 使用流式处理
# 分块计算
```

### 优化建议

```python
from statistics import fmean, median
from typing import List

def efficient_stats(data: List[float]) -> dict:
    """高效的统计计算"""
    # 1. 使用 fmean 而不是 mean（如果精度允许）
    avg = fmean(data)

    # 2. 对大数据集分块处理
    chunk_size = 10000
    if len(data) > chunk_size:
        # 分块计算
        pass

    # 3. 缓存结果避免重复计算
    cached_median = None

    return {'mean': avg}
```

## 实战场景

### 网站性能监控

```python
from statistics import mean, median, stdev
from datetime import datetime, timedelta

class PerformanceMonitor:
    """网站性能监控"""

    def __init__(self):
        self.response_times = []
        self.errors = []

    def add_request(self, response_time_ms, error=None):
        self.response_times.append(response_time_ms)
        if error:
            self.errors.append(error)

    def get_metrics(self):
        """获取性能指标"""
        if not self.response_times:
            return None

        return {
            '平均响应时间': f"{mean(self.response_times):.2f}ms",
            '中位响应时间': f"{median(self.response_times):.2f}ms",
            '响应时间变异性': f"{stdev(self.response_times):.2f}ms",
            '错误率': f"{len(self.errors) / len(self.response_times) * 100:.2f}%"
        }

# 使用
monitor = PerformanceMonitor()
for resp_time in [45, 52, 48, 150, 49, 51]:  # 150ms 是异常
    monitor.add_request(resp_time)

print(monitor.get_metrics())
```

### 学生成绩评估系统

```python
from statistics import mean, median, stdev, mode

class GradeAnalysis:
    """学生成绩分析"""

    def __init__(self, grades: list):
        self.grades = grades

    def get_summary(self):
        """获取成绩总结"""
        if len(self.grades) < 2:
            return "数据不足"

        return {
            '平均成绩': f"{mean(self.grades):.1f}",
            '中位成绩': f"{median(self.grades):.1f}",
            '最常见成绩': mode(self.grades),
            '成绩波动': f"{stdev(self.grades):.2f}",
            '最高分': max(self.grades),
            '最低分': min(self.grades),
            '分数跨度': max(self.grades) - min(self.grades)
        }

    def get_level(self, grade):
        """评估成绩水平"""
        avg = mean(self.grades)
        std = stdev(self.grades)

        if grade >= avg + std:
            return '优秀'
        elif grade >= avg:
            return '良好'
        elif grade >= avg - std:
            return '及格'
        else:
            return '不及格'

# 使用
analysis = GradeAnalysis([85, 90, 78, 92, 88, 85, 95, 87, 85])
print(analysis.get_summary())
print(f"成绩86水平: {analysis.get_level(86)}")
```

### 销售数据分析

```python
from statistics import mean, median, stdev, variance
from datetime import datetime

class SalesAnalytics:
    """销售数据分析"""

    def __init__(self):
        self.daily_sales = []
        self.weekly_sales = {}

    def add_daily_sale(self, amount, date=None):
        """记录日销售额"""
        self.daily_sales.append(amount)

    def analyze_sales(self):
        """分析销售数据"""
        if not self.daily_sales:
            return None

        return {
            '总销售额': sum(self.daily_sales),
            '日均销售': f"{mean(self.daily_sales):.2f}",
            '中位销售': f"{median(self.daily_sales):.2f}",
            '销售波动性': f"{stdev(self.daily_sales):.2f}",
            '销售方差': f"{variance(self.daily_sales):.2f}",
            '最高日销售': max(self.daily_sales),
            '最低日销售': min(self.daily_sales)
        }

# 使用
analytics = SalesAnalytics()
for sale in [1200, 1500, 1300, 1600, 1200, 1400, 1300]:
    analytics.add_daily_sale(sale)

print(analytics.analyze_sales())
```

### 数据质量检查

```python
from statistics import mean, stdev

def quality_check(data, expected_mean=None, tolerance=2):
    """数据质量检查"""
    if not data:
        return {'status': '失败', '原因': '数据为空'}

    m = mean(data)
    s = stdev(data) if len(data) > 1 else 0

    # 检查异常值
    anomalies = [x for x in data if abs(x - m) > tolerance * s]

    result = {
        '数据点数': len(data),
        '平均值': f"{m:.2f}",
        '标准差': f"{s:.2f}",
        '异常值数': len(anomalies),
        '异常值': anomalies[:10]  # 显示前10个
    }

    if expected_mean and abs(m - expected_mean) > tolerance * s:
        result['状态'] = '警告：平均值偏离预期'
    else:
        result['状态'] = '正常'

    return result

# 使用
data = [98, 100, 102, 99, 101, 500]  # 500 是异常
print(quality_check(data, expected_mean=100))
```

### 医疗健康指标分析

```python
from statistics import mean, median, stdev

class HealthMetrics:
    """健康指标分析"""

    @staticmethod
    def bmi_analysis(heights, weights):
        """BMI 分析"""
        bmis = [w / (h ** 2) for h, w in zip(heights, weights)]

        return {
            '平均BMI': f"{mean(bmis):.2f}",
            '中位BMI': f"{median(bmis):.2f}",
            '标准差': f"{stdev(bmis):.2f}",
            '健康人数': sum(1 for bmi in bmis if 18.5 <= bmi < 25)
        }

    @staticmethod
    def blood_pressure_analysis(systolic, diastolic):
        """血压分析"""
        return {
            '平均收缩压': f"{mean(systolic):.1f}",
            '平均舒张压': f"{mean(diastolic):.1f}",
            '正常血压人数': sum(1 for s, d in zip(systolic, diastolic)
                          if s < 120 and d < 80)
        }

# 使用
heights = [1.70, 1.75, 1.68, 1.80]
weights = [65, 72, 60, 80]
print(HealthMetrics.bmi_analysis(heights, weights))
```

## 面试要点

### statistics 模块的适用场景

```
适用场景：
✓ 小数据集统计分析
✓ 快速原型开发
✓ 不想依赖第三方库
✓ 教学和学习
✓ 简单的统计计算

不适用场景：
✗ 大数据集（>1MB）
✗ 复杂统计分析
✗ 科学计算
✗ 性能敏感的应用
✗ 需要矩阵运算
```

### mean() 和 fmean() 的区别

```python
# mean()：
# - 使用 Fraction 进行精确计算
# - 支持 int, float, Decimal, Fraction, complex
# - 精度高但速度慢
# - 推荐用于金融、科学计算

# fmean()：
# - 使用浮点运算
# - 只支持数值类型
# - 速度快（约2-3倍）
# - 推荐用于大数据集
```

### 样本标准差 vs 总体标准差

```python
# 样本标准差 stdev()：
# - 用于从总体中抽样的数据
# - 分母为 n-1（贝塞尔修正）
# - 更大的值，考虑采样误差

# 总体标准差 pstdev()：
# - 用于整个总体的数据
# - 分母为 n
# - 更小的值

# 实践中：
# - 99% 的情况使用样本标准差 stdev()
# - 除非确定数据是完整总体
```

### 中位数的实际意义

```python
# 中位数的优势：
# - 不受极端值影响
# - 适合非对称分布
# - 更能代表"典型"值

# 示例：
data = [1, 2, 3, 100000]
mean(data)      # 25000.75（被100000拉高）
median(data)    # 2.5（更能代表真实情况）
```

### 常见面试问题

```
Q: statistics 和 NumPy 如何选择？
A: 小数据用 statistics，大数据用 NumPy

Q: 如何处理空列表？
A: 检查 if data:，或使用 try-except 捕获 StatisticsError

Q: 什么时候用调和均值？
A: 速率、比率、倒数平均时使用

Q: median() 和 median_low()/median_high() 区别？
A: 偶数个元素时，median 返回平均值，其他两个返回边界值

Q: 单个数据点能计算标准差吗？
A: 不能，至少需要两个数据点
```

### 代码设计问题

```python
# Q: 如何设计一个鲁棒的统计函数？
def robust_stats(data):
    """鲁棒的统计函数"""
    # 1. 输入验证
    if not data:
        return None

    # 2. 数据清洗
    clean_data = [x for x in data if x is not None]

    # 3. 异常处理
    try:
        return {
            'mean': mean(clean_data),
            'median': median(clean_data),
            'stdev': stdev(clean_data) if len(clean_data) > 1 else 0
        }
    except StatisticsError as e:
        print(f"错误: {e}")
        return None
```

## 延伸阅读

### 相关标准库

- **decimal**：精确十进制浮点算术
- **math**：数学函数
- **random**：随机数生成
- **itertools**：迭代工具

### 推荐第三方库

- **NumPy**：科学计算和数组操作
- **Pandas**：数据分析和处理
- **SciPy**：科学计算扩展
- **Matplotlib/Seaborn**：数据可视化
- **statsmodels**：统计模型

### 深入学习主题

1. **概率和统计基础**
   - 正态分布、二项分布等
   - 假设检验、置信区间
   - 相关性和回归分析

2. **高级统计方法**
   - 时间序列分析
   - 机器学习
   - 贝叶斯统计

3. **数据分析工作流**
   - 数据收集和清洗
   - 探索性数据分析
   - 结果可视化和报告

### 官方文档

- Python 官方文档：https://docs.python.org/3/library/statistics.html
- PEP 450：将 statistics 模块添加到标准库

### 学习资源

- Python 官方教程
- Coursera：Data Science with Python
- DataCamp：Statistics with Python
- Real Python：statistics 模块教程
