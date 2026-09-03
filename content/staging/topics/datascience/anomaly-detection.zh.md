---
title: 异常检测：从统计方法到深度学习
description: 全面掌握异常检测技术：统计方法、孤立森林、深度学习异常检测与实战应用
track: datascience
section: classical-ml
difficulty: intermediate
tags:
  - 异常检测
  - Isolation Forest
  - Autoencoder
  - 时间序列
  - 离群点检测
status: imported
origin: old/src/content/docs/datascience/anomaly-detection.zh.md
divergence: 0.2
issues: []
legacy:
  category: DataScience
  subcategory: TimeSeries
  order: 23
  lastUpdated: 2026-01-07
---

异常检测（Anomaly Detection）是数据科学中的核心任务之一，在金融欺诈检测、工业设备监控、网络安全、医疗诊断等领域有着广泛应用。本文将系统介绍时间序列异常检测的各种方法，从传统统计方法到现代深度学习技术。

---

## 异常类型概述

在时间序列数据中，异常可以分为三种主要类型，理解这些类型对于选择合适的检测方法至关重要。

### 点异常（Point Anomaly）

点异常是最简单的异常类型，指单个数据点显著偏离其他数据点的情况。

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# 生成包含点异常的时间序列
np.random.seed(42)
n_points = 200

# 正常数据
normal_data = np.sin(np.linspace(0, 4*np.pi, n_points)) + np.random.normal(0, 0.1, n_points)

# 插入点异常
anomaly_indices = [50, 100, 150]
data_with_anomalies = normal_data.copy()
data_with_anomalies[anomaly_indices] = [3.5, -2.8, 4.0]

# 可视化
plt.figure(figsize=(14, 5))
plt.plot(data_with_anomalies, label='时间序列数据', alpha=0.7)
plt.scatter(anomaly_indices, data_with_anomalies[anomaly_indices],
            color='red', s=100, label='点异常', zorder=5)
plt.xlabel('时间')
plt.ylabel('值')
plt.title('点异常示例')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()
```

**特点：**
- 单个数据点与整体分布明显不同
- 相对容易检测
- 常见于传感器故障、数据录入错误

### 上下文异常（Contextual Anomaly）

上下文异常是指在特定上下文中异常，但在其他上下文中可能是正常的数据点。

```python
# 生成季节性数据
days = 365
time = np.arange(days)

# 基础趋势 + 季节性
trend = 0.01 * time
seasonality = 10 * np.sin(2 * np.pi * time / 365)
noise = np.random.normal(0, 1, days)
temperature = 20 + trend + seasonality + noise

# 插入上下文异常：夏天出现低温
summer_anomaly_idx = 180  # 夏季中期
temperature[summer_anomaly_idx] = 5  # 夏天出现5度的低温

# 可视化
plt.figure(figsize=(14, 5))
plt.plot(time, temperature, label='温度数据')
plt.scatter([summer_anomaly_idx], [temperature[summer_anomaly_idx]],
            color='red', s=100, label='上下文异常', zorder=5)
plt.xlabel('天数')
plt.ylabel('温度 (°C)')
plt.title('上下文异常示例：夏季出现低温')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()
```

**特点：**
- 取决于上下文（时间、位置、条件等）
- 需要考虑时间序列的周期性和趋势
- 检测难度较高

### 集体异常（Collective Anomaly）

集体异常是指一组数据点作为整体表现异常，但单个数据点可能并不异常。

```python
# 生成包含集体异常的数据
n_points = 500
normal_data = np.random.normal(0, 1, n_points)

# 插入集体异常：一段持续的异常模式
anomaly_start, anomaly_end = 200, 250
collective_anomaly = np.sin(np.linspace(0, 4*np.pi, anomaly_end - anomaly_start)) * 0.5

data_with_collective = normal_data.copy()
data_with_collective[anomaly_start:anomaly_end] = collective_anomaly

# 可视化
plt.figure(figsize=(14, 5))
plt.plot(data_with_collective, label='时间序列数据', alpha=0.7)
plt.axvspan(anomaly_start, anomaly_end, color='red', alpha=0.3, label='集体异常区域')
plt.xlabel('时间')
plt.ylabel('值')
plt.title('集体异常示例：异常的周期性模式')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()
```

**特点：**
- 需要分析数据点序列的整体行为
- 常见于系统故障、攻击行为
- 检测需要考虑时间窗口

### 异常类型总结

| 异常类型 | 定义 | 检测难度 | 典型场景 |
|---------|------|---------|---------|
| 点异常 | 单个数据点异常 | 低 | 传感器故障、数据错误 |
| 上下文异常 | 特定上下文中异常 | 中 | 季节性偏差、周期性异常 |
| 集体异常 | 一组数据点集体异常 | 高 | 系统故障、网络攻击 |

---

## 统计方法

统计方法是异常检测的基础，简单直观，适用于数据分布已知或可估计的场景。

### Z-Score 方法

Z-Score（标准分数）方法假设数据服从正态分布，通过计算每个数据点偏离均值的标准差数来判断是否为异常。

$$Z = \frac{x - \mu}{\sigma}$$

其中 $\mu$ 是均值，$\sigma$ 是标准差。通常 $|Z| > 3$ 被认为是异常。

```python
import numpy as np
import pandas as pd
from scipy import stats

class ZScoreDetector:
    """基于Z-Score的异常检测器"""

    def __init__(self, threshold: float = 3.0):
        """
        初始化检测器

        Args:
            threshold: Z-Score阈值，默认为3
        """
        self.threshold = threshold
        self.mean = None
        self.std = None

    def fit(self, data: np.ndarray) -> 'ZScoreDetector':
        """
        拟合数据，计算均值和标准差

        Args:
            data: 训练数据
        """
        self.mean = np.mean(data)
        self.std = np.std(data)
        return self

    def detect(self, data: np.ndarray) -> np.ndarray:
        """
        检测异常

        Args:
            data: 待检测数据

        Returns:
            布尔数组，True表示异常
        """
        if self.mean is None or self.std is None:
            raise ValueError("请先调用fit方法拟合数据")

        z_scores = np.abs((data - self.mean) / self.std)
        return z_scores > self.threshold

    def fit_detect(self, data: np.ndarray) -> np.ndarray:
        """拟合并检测"""
        self.fit(data)
        return self.detect(data)

    def get_z_scores(self, data: np.ndarray) -> np.ndarray:
        """获取Z-Score值"""
        return (data - self.mean) / self.std


# 使用示例
np.random.seed(42)
data = np.random.normal(100, 15, 1000)
# 插入一些异常值
data[100] = 200
data[500] = 20
data[800] = 180

detector = ZScoreDetector(threshold=3.0)
anomalies = detector.fit_detect(data)

print(f"检测到 {anomalies.sum()} 个异常点")
print(f"异常点索引: {np.where(anomalies)[0]}")
print(f"异常值: {data[anomalies]}")
```

### 改进的 Z-Score（MAD）

传统 Z-Score 对异常值敏感，因为均值和标准差本身会受到异常值影响。使用中位数绝对偏差（MAD）可以提高鲁棒性。

$$MAD = median(|x_i - median(x)|)$$

$$Modified\ Z = \frac{0.6745 \times (x - median(x))}{MAD}$$

```python
class RobustZScoreDetector:
    """基于MAD的鲁棒Z-Score检测器"""

    def __init__(self, threshold: float = 3.5):
        """
        初始化检测器

        Args:
            threshold: 修正Z-Score阈值，默认为3.5
        """
        self.threshold = threshold
        self.median = None
        self.mad = None

    def fit(self, data: np.ndarray) -> 'RobustZScoreDetector':
        """拟合数据"""
        self.median = np.median(data)
        self.mad = np.median(np.abs(data - self.median))
        return self

    def detect(self, data: np.ndarray) -> np.ndarray:
        """检测异常"""
        if self.mad == 0:
            return np.zeros(len(data), dtype=bool)

        # 0.6745是正态分布的MAD与标准差的比值
        modified_z_scores = 0.6745 * np.abs(data - self.median) / self.mad
        return modified_z_scores > self.threshold

    def fit_detect(self, data: np.ndarray) -> np.ndarray:
        """拟合并检测"""
        self.fit(data)
        return self.detect(data)


# 对比传统Z-Score和鲁棒Z-Score
np.random.seed(42)
data = np.random.normal(100, 15, 100)
# 插入极端异常值
data[50] = 500

z_detector = ZScoreDetector(threshold=3.0)
robust_detector = RobustZScoreDetector(threshold=3.5)

z_anomalies = z_detector.fit_detect(data)
robust_anomalies = robust_detector.fit_detect(data)

print(f"传统Z-Score检测到: {z_anomalies.sum()} 个异常")
print(f"鲁棒Z-Score检测到: {robust_anomalies.sum()} 个异常")
print(f"\n传统方法的均值: {z_detector.mean:.2f} (受异常值影响)")
print(f"鲁棒方法的中位数: {robust_detector.median:.2f} (不受异常值影响)")
```

### IQR 方法（四分位距）

IQR 方法基于数据的四分位数，对异常值更加鲁棒，不假设数据服从正态分布。

$$IQR = Q_3 - Q_1$$

异常边界：$[Q_1 - k \times IQR, Q_3 + k \times IQR]$，其中 $k$ 通常取 1.5。

```python
class IQRDetector:
    """基于IQR的异常检测器"""

    def __init__(self, k: float = 1.5):
        """
        初始化检测器

        Args:
            k: IQR倍数，默认为1.5
        """
        self.k = k
        self.q1 = None
        self.q3 = None
        self.iqr = None
        self.lower_bound = None
        self.upper_bound = None

    def fit(self, data: np.ndarray) -> 'IQRDetector':
        """拟合数据，计算四分位数和边界"""
        self.q1 = np.percentile(data, 25)
        self.q3 = np.percentile(data, 75)
        self.iqr = self.q3 - self.q1
        self.lower_bound = self.q1 - self.k * self.iqr
        self.upper_bound = self.q3 + self.k * self.iqr
        return self

    def detect(self, data: np.ndarray) -> np.ndarray:
        """检测异常"""
        return (data < self.lower_bound) | (data > self.upper_bound)

    def fit_detect(self, data: np.ndarray) -> np.ndarray:
        """拟合并检测"""
        self.fit(data)
        return self.detect(data)

    def get_bounds(self) -> tuple:
        """获取异常边界"""
        return self.lower_bound, self.upper_bound


# 使用示例
np.random.seed(42)
data = np.concatenate([
    np.random.normal(50, 10, 200),  # 正常数据
    np.array([100, 110, 0, -10])     # 异常值
])

detector = IQRDetector(k=1.5)
anomalies = detector.fit_detect(data)

print(f"Q1: {detector.q1:.2f}")
print(f"Q3: {detector.q3:.2f}")
print(f"IQR: {detector.iqr:.2f}")
print(f"下界: {detector.lower_bound:.2f}")
print(f"上界: {detector.upper_bound:.2f}")
print(f"检测到 {anomalies.sum()} 个异常点")
```

### 滑动窗口统计方法

对于时间序列数据，使用滑动窗口计算局部统计量可以捕捉时变特性。

```python
class SlidingWindowDetector:
    """滑动窗口异常检测器"""

    def __init__(self, window_size: int = 20, threshold: float = 3.0):
        """
        初始化检测器

        Args:
            window_size: 滑动窗口大小
            threshold: 异常阈值（标准差倍数）
        """
        self.window_size = window_size
        self.threshold = threshold

    def detect(self, data: np.ndarray) -> np.ndarray:
        """
        使用滑动窗口检测异常

        Args:
            data: 时间序列数据

        Returns:
            布尔数组，True表示异常
        """
        n = len(data)
        anomalies = np.zeros(n, dtype=bool)

        for i in range(self.window_size, n):
            # 获取窗口数据（不包含当前点）
            window = data[i - self.window_size:i]

            # 计算窗口统计量
            mean = np.mean(window)
            std = np.std(window)

            # 判断当前点是否异常
            if std > 0:
                z_score = abs(data[i] - mean) / std
                anomalies[i] = z_score > self.threshold

        return anomalies

    def detect_with_scores(self, data: np.ndarray) -> tuple:
        """
        检测异常并返回异常分数

        Returns:
            (anomalies, scores): 异常标记和异常分数
        """
        n = len(data)
        scores = np.zeros(n)

        for i in range(self.window_size, n):
            window = data[i - self.window_size:i]
            mean = np.mean(window)
            std = np.std(window)

            if std > 0:
                scores[i] = abs(data[i] - mean) / std

        anomalies = scores > self.threshold
        return anomalies, scores


# 使用示例：检测时间序列中的异常
np.random.seed(42)

# 生成带有趋势和噪声的时间序列
t = np.arange(200)
trend = 0.05 * t
noise = np.random.normal(0, 1, 200)
data = trend + noise

# 插入异常
data[50] = 15
data[100] = -10
data[150] = 20

detector = SlidingWindowDetector(window_size=20, threshold=3.0)
anomalies, scores = detector.detect_with_scores(data)

print(f"检测到 {anomalies.sum()} 个异常点")
print(f"异常点索引: {np.where(anomalies)[0]}")
```

### EWMA 指数加权移动平均

EWMA 对近期数据赋予更高权重，能够更快地响应数据变化。

$$EWMA_t = \alpha \cdot x_t + (1 - \alpha) \cdot EWMA_{t-1}$$

```python
class EWMADetector:
    """基于EWMA的异常检测器"""

    def __init__(self, alpha: float = 0.3, threshold: float = 3.0):
        """
        初始化检测器

        Args:
            alpha: 平滑因子，取值范围(0, 1)
            threshold: 异常阈值
        """
        self.alpha = alpha
        self.threshold = threshold

    def detect(self, data: np.ndarray) -> tuple:
        """
        检测异常

        Returns:
            (anomalies, ewma, upper_bound, lower_bound)
        """
        n = len(data)
        ewma = np.zeros(n)
        ewma_std = np.zeros(n)

        # 初始化
        ewma[0] = data[0]
        ewma_std[0] = 0

        # 计算EWMA和EWMA标准差
        for i in range(1, n):
            ewma[i] = self.alpha * data[i] + (1 - self.alpha) * ewma[i-1]
            diff = data[i] - ewma[i-1]
            ewma_std[i] = np.sqrt(
                self.alpha * diff**2 + (1 - self.alpha) * ewma_std[i-1]**2
            )

        # 计算控制边界
        upper_bound = ewma + self.threshold * ewma_std
        lower_bound = ewma - self.threshold * ewma_std

        # 检测异常
        anomalies = (data > upper_bound) | (data < lower_bound)

        return anomalies, ewma, upper_bound, lower_bound


# 使用示例
np.random.seed(42)
t = np.arange(300)
# 生成带有均值漂移的数据
data = np.concatenate([
    np.random.normal(10, 1, 100),
    np.random.normal(12, 1, 100),  # 均值漂移
    np.random.normal(10, 1, 100)
])
# 插入点异常
data[50] = 20
data[200] = 5

detector = EWMADetector(alpha=0.2, threshold=3.0)
anomalies, ewma, upper, lower = detector.detect(data)

print(f"检测到 {anomalies.sum()} 个异常点")
```

---

## 机器学习方法

### 隔离森林（Isolation Forest）

隔离森林是一种无监督的异常检测算法，基于这样的直觉：异常点更容易被"隔离"。

**核心思想：**
- 异常点的特征值与正常点差异大
- 随机划分时，异常点需要更少的划分次数就能被隔离
- 异常点在树中的平均路径长度较短

```python
from sklearn.ensemble import IsolationForest
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

class IsolationForestDetector:
    """隔离森林异常检测器"""

    def __init__(self, contamination: float = 0.1, n_estimators: int = 100,
                 max_samples: str = 'auto', random_state: int = 42):
        """
        初始化检测器

        Args:
            contamination: 异常比例估计
            n_estimators: 树的数量
            max_samples: 每棵树的样本数
            random_state: 随机种子
        """
        self.model = IsolationForest(
            contamination=contamination,
            n_estimators=n_estimators,
            max_samples=max_samples,
            random_state=random_state,
            n_jobs=-1
        )

    def fit(self, data: np.ndarray) -> 'IsolationForestDetector':
        """拟合模型"""
        if data.ndim == 1:
            data = data.reshape(-1, 1)
        self.model.fit(data)
        return self

    def predict(self, data: np.ndarray) -> np.ndarray:
        """
        预测异常

        Returns:
            布尔数组，True表示异常
        """
        if data.ndim == 1:
            data = data.reshape(-1, 1)
        predictions = self.model.predict(data)
        return predictions == -1  # -1表示异常

    def decision_function(self, data: np.ndarray) -> np.ndarray:
        """获取异常分数（越小越异常）"""
        if data.ndim == 1:
            data = data.reshape(-1, 1)
        return self.model.decision_function(data)

    def fit_predict(self, data: np.ndarray) -> np.ndarray:
        """拟合并预测"""
        self.fit(data)
        return self.predict(data)


# 一维时间序列异常检测
np.random.seed(42)
n_samples = 500

# 生成正常数据
normal_data = np.sin(np.linspace(0, 8*np.pi, n_samples)) + np.random.normal(0, 0.1, n_samples)

# 插入异常
data = normal_data.copy()
anomaly_idx = [50, 150, 250, 350, 450]
data[anomaly_idx] = [3, -2.5, 2.8, -3, 2.5]

# 检测
detector = IsolationForestDetector(contamination=0.02)
anomalies = detector.fit_predict(data)
scores = detector.decision_function(data)

print(f"检测到 {anomalies.sum()} 个异常点")
print(f"真实异常: {anomaly_idx}")
print(f"检测到的异常: {np.where(anomalies)[0].tolist()}")
```

### 多维特征的隔离森林

在实际应用中，通常需要从时间序列中提取多个特征进行异常检测。

```python
from sklearn.preprocessing import StandardScaler

class TimeSeriesFeatureExtractor:
    """时间序列特征提取器"""

    def __init__(self, window_size: int = 20):
        self.window_size = window_size

    def extract_features(self, data: np.ndarray) -> np.ndarray:
        """
        从滑动窗口提取特征

        Features:
        - 均值
        - 标准差
        - 最大值
        - 最小值
        - 斜率
        - 峰度
        - 偏度
        """
        from scipy import stats

        n = len(data)
        features = []

        for i in range(self.window_size, n):
            window = data[i - self.window_size:i]

            # 基本统计特征
            mean = np.mean(window)
            std = np.std(window)
            max_val = np.max(window)
            min_val = np.min(window)

            # 趋势特征
            slope = np.polyfit(range(len(window)), window, 1)[0]

            # 分布特征
            kurtosis = stats.kurtosis(window)
            skewness = stats.skew(window)

            # 当前点与窗口的关系
            current_value = data[i]
            z_score = (current_value - mean) / (std + 1e-8)

            features.append([
                mean, std, max_val, min_val, slope,
                kurtosis, skewness, current_value, z_score
            ])

        return np.array(features)


# 使用多维特征进行异常检测
np.random.seed(42)

# 生成更复杂的时间序列
n_samples = 500
t = np.arange(n_samples)
trend = 0.01 * t
seasonality = 2 * np.sin(2 * np.pi * t / 50)
noise = np.random.normal(0, 0.3, n_samples)
data = trend + seasonality + noise

# 插入不同类型的异常
data[100] = 10      # 点异常
data[200:210] = 8   # 集体异常
data[350] = -5      # 点异常

# 特征提取
extractor = TimeSeriesFeatureExtractor(window_size=20)
features = extractor.extract_features(data)

# 异常检测
detector = IsolationForestDetector(contamination=0.05)
anomalies_features = detector.fit_predict(features)

# 映射回原始索引
anomaly_indices = np.where(anomalies_features)[0] + extractor.window_size

print(f"检测到 {len(anomaly_indices)} 个异常点")
print(f"异常点索引: {anomaly_indices}")
```

### One-Class SVM

One-Class SVM 学习正常数据的边界，将落在边界外的点标记为异常。

```python
from sklearn.svm import OneClassSVM

class OneClassSVMDetector:
    """One-Class SVM异常检测器"""

    def __init__(self, kernel: str = 'rbf', nu: float = 0.1, gamma: str = 'scale'):
        """
        初始化检测器

        Args:
            kernel: 核函数类型
            nu: 异常比例的上界
            gamma: RBF核参数
        """
        self.scaler = StandardScaler()
        self.model = OneClassSVM(kernel=kernel, nu=nu, gamma=gamma)

    def fit(self, data: np.ndarray) -> 'OneClassSVMDetector':
        """拟合模型"""
        if data.ndim == 1:
            data = data.reshape(-1, 1)

        data_scaled = self.scaler.fit_transform(data)
        self.model.fit(data_scaled)
        return self

    def predict(self, data: np.ndarray) -> np.ndarray:
        """预测异常"""
        if data.ndim == 1:
            data = data.reshape(-1, 1)

        data_scaled = self.scaler.transform(data)
        predictions = self.model.predict(data_scaled)
        return predictions == -1

    def decision_function(self, data: np.ndarray) -> np.ndarray:
        """获取异常分数"""
        if data.ndim == 1:
            data = data.reshape(-1, 1)

        data_scaled = self.scaler.transform(data)
        return self.model.decision_function(data_scaled)

    def fit_predict(self, data: np.ndarray) -> np.ndarray:
        """拟合并预测"""
        self.fit(data)
        return self.predict(data)


# 使用示例
np.random.seed(42)

# 生成二维数据（便于可视化）
n_samples = 300
normal_data = np.random.multivariate_normal([0, 0], [[1, 0.5], [0.5, 1]], n_samples)

# 添加异常点
anomalies_data = np.array([[4, 4], [-4, 3], [3, -4], [-3, -3], [5, 0]])
data = np.vstack([normal_data, anomalies_data])

# 检测
detector = OneClassSVMDetector(nu=0.05)
predictions = detector.fit_predict(data)
scores = detector.decision_function(data)

print(f"检测到 {predictions.sum()} 个异常点")
```

### Local Outlier Factor (LOF)

LOF 基于密度的异常检测方法，比较每个点与其邻居的局部密度。

```python
from sklearn.neighbors import LocalOutlierFactor

class LOFDetector:
    """局部异常因子检测器"""

    def __init__(self, n_neighbors: int = 20, contamination: float = 0.1):
        """
        初始化检测器

        Args:
            n_neighbors: 邻居数量
            contamination: 异常比例估计
        """
        self.model = LocalOutlierFactor(
            n_neighbors=n_neighbors,
            contamination=contamination,
            novelty=True
        )
        self.scaler = StandardScaler()

    def fit(self, data: np.ndarray) -> 'LOFDetector':
        """拟合模型"""
        if data.ndim == 1:
            data = data.reshape(-1, 1)

        data_scaled = self.scaler.fit_transform(data)
        self.model.fit(data_scaled)
        return self

    def predict(self, data: np.ndarray) -> np.ndarray:
        """预测异常"""
        if data.ndim == 1:
            data = data.reshape(-1, 1)

        data_scaled = self.scaler.transform(data)
        predictions = self.model.predict(data_scaled)
        return predictions == -1

    def decision_function(self, data: np.ndarray) -> np.ndarray:
        """获取异常分数"""
        if data.ndim == 1:
            data = data.reshape(-1, 1)

        data_scaled = self.scaler.transform(data)
        return self.model.decision_function(data_scaled)


# 使用示例
np.random.seed(42)

# 生成包含不同密度簇的数据
cluster1 = np.random.normal([0, 0], 0.5, (100, 2))
cluster2 = np.random.normal([4, 4], 0.3, (50, 2))
anomalies_data = np.array([[2, 2], [-2, 3], [6, 1]])

data = np.vstack([cluster1, cluster2, anomalies_data])

# 检测
detector = LOFDetector(n_neighbors=20, contamination=0.05)
detector.fit(data)
predictions = detector.predict(data)

print(f"检测到 {predictions.sum()} 个异常点")
```

---

## 深度学习方法

深度学习方法在复杂数据和高维场景中表现出色，特别适合捕捉非线性模式。

### 自编码器（Autoencoder）异常检测

自编码器学习数据的压缩表示，对于正常数据能够良好重构，而异常数据的重构误差较大。

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

class Autoencoder(nn.Module):
    """基础自编码器"""

    def __init__(self, input_dim: int, encoding_dim: int = 8):
        super().__init__()

        # 编码器
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 64),
            nn.ReLU(),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, encoding_dim),
            nn.ReLU()
        )

        # 解码器
        self.decoder = nn.Sequential(
            nn.Linear(encoding_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 64),
            nn.ReLU(),
            nn.Linear(64, input_dim)
        )

    def forward(self, x):
        encoded = self.encoder(x)
        decoded = self.decoder(encoded)
        return decoded

    def encode(self, x):
        return self.encoder(x)


class AutoencoderDetector:
    """基于自编码器的异常检测器"""

    def __init__(self, input_dim: int, encoding_dim: int = 8,
                 threshold_percentile: float = 95):
        """
        初始化检测器

        Args:
            input_dim: 输入维度
            encoding_dim: 编码维度
            threshold_percentile: 重构误差阈值的百分位数
        """
        self.model = Autoencoder(input_dim, encoding_dim)
        self.threshold_percentile = threshold_percentile
        self.threshold = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(self.device)

    def fit(self, data: np.ndarray, epochs: int = 100, batch_size: int = 32,
            learning_rate: float = 1e-3, verbose: bool = True):
        """
        训练自编码器

        Args:
            data: 训练数据（假设为正常数据）
            epochs: 训练轮数
            batch_size: 批大小
            learning_rate: 学习率
            verbose: 是否打印训练信息
        """
        # 转换为张量
        data_tensor = torch.FloatTensor(data).to(self.device)
        dataset = TensorDataset(data_tensor, data_tensor)
        dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

        # 优化器和损失函数
        optimizer = optim.Adam(self.model.parameters(), lr=learning_rate)
        criterion = nn.MSELoss()

        # 训练
        self.model.train()
        for epoch in range(epochs):
            total_loss = 0
            for batch_data, _ in dataloader:
                optimizer.zero_grad()
                reconstructed = self.model(batch_data)
                loss = criterion(reconstructed, batch_data)
                loss.backward()
                optimizer.step()
                total_loss += loss.item()

            if verbose and (epoch + 1) % 20 == 0:
                avg_loss = total_loss / len(dataloader)
                print(f'Epoch [{epoch+1}/{epochs}], Loss: {avg_loss:.6f}')

        # 计算阈值
        self.model.eval()
        with torch.no_grad():
            reconstructed = self.model(data_tensor)
            reconstruction_errors = torch.mean((data_tensor - reconstructed) ** 2, dim=1)
            self.threshold = np.percentile(
                reconstruction_errors.cpu().numpy(),
                self.threshold_percentile
            )

        return self

    def predict(self, data: np.ndarray) -> np.ndarray:
        """预测异常"""
        errors = self.reconstruction_error(data)
        return errors > self.threshold

    def reconstruction_error(self, data: np.ndarray) -> np.ndarray:
        """计算重构误差"""
        self.model.eval()
        data_tensor = torch.FloatTensor(data).to(self.device)

        with torch.no_grad():
            reconstructed = self.model(data_tensor)
            errors = torch.mean((data_tensor - reconstructed) ** 2, dim=1)

        return errors.cpu().numpy()


# 使用示例：时间序列窗口异常检测
np.random.seed(42)

# 生成正常时间序列
n_samples = 1000
normal_data = np.sin(np.linspace(0, 20*np.pi, n_samples)) + np.random.normal(0, 0.1, n_samples)

# 创建滑动窗口特征
window_size = 20
def create_windows(data, window_size):
    windows = []
    for i in range(len(data) - window_size + 1):
        windows.append(data[i:i + window_size])
    return np.array(windows)

# 训练数据（正常数据）
train_windows = create_windows(normal_data[:800], window_size)

# 测试数据（包含异常）
test_data = normal_data.copy()
test_data[850] = 5  # 点异常
test_data[900:910] = 3  # 集体异常
test_windows = create_windows(test_data[800:], window_size)

# 训练检测器
detector = AutoencoderDetector(input_dim=window_size, encoding_dim=4, threshold_percentile=95)
detector.fit(train_windows, epochs=100, verbose=True)

# 检测异常
anomalies = detector.predict(test_windows)
errors = detector.reconstruction_error(test_windows)

print(f"\n检测到 {anomalies.sum()} 个异常窗口")
print(f"异常窗口起始索引: {np.where(anomalies)[0] + 800}")
print(f"阈值: {detector.threshold:.6f}")
```

### LSTM 自编码器

LSTM 自编码器能够捕捉时间序列的时序依赖关系。

```python
class LSTMAutoencoder(nn.Module):
    """LSTM自编码器"""

    def __init__(self, input_dim: int, hidden_dim: int = 64,
                 latent_dim: int = 16, num_layers: int = 2):
        super().__init__()

        self.hidden_dim = hidden_dim
        self.num_layers = num_layers

        # 编码器LSTM
        self.encoder_lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.2
        )

        # 压缩层
        self.encoder_fc = nn.Linear(hidden_dim, latent_dim)

        # 解码器
        self.decoder_fc = nn.Linear(latent_dim, hidden_dim)

        self.decoder_lstm = nn.LSTM(
            input_size=hidden_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.2
        )

        # 输出层
        self.output_layer = nn.Linear(hidden_dim, input_dim)

    def forward(self, x):
        # x shape: (batch, seq_len, input_dim)
        batch_size, seq_len, _ = x.size()

        # 编码
        _, (hidden, cell) = self.encoder_lstm(x)

        # 使用最后一层的隐藏状态
        latent = self.encoder_fc(hidden[-1])

        # 解码
        decoder_input = self.decoder_fc(latent)
        decoder_input = decoder_input.unsqueeze(1).repeat(1, seq_len, 1)

        decoder_output, _ = self.decoder_lstm(decoder_input)
        reconstructed = self.output_layer(decoder_output)

        return reconstructed, latent


class LSTMAutoencoderDetector:
    """基于LSTM自编码器的异常检测器"""

    def __init__(self, input_dim: int = 1, hidden_dim: int = 64,
                 latent_dim: int = 16, threshold_percentile: float = 95):
        self.model = LSTMAutoencoder(input_dim, hidden_dim, latent_dim)
        self.threshold_percentile = threshold_percentile
        self.threshold = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(self.device)

    def fit(self, data: np.ndarray, epochs: int = 100, batch_size: int = 32,
            learning_rate: float = 1e-3, verbose: bool = True):
        """
        训练LSTM自编码器

        Args:
            data: 形状为 (n_samples, seq_len, n_features) 的数据
        """
        if data.ndim == 2:
            data = data[:, :, np.newaxis]

        data_tensor = torch.FloatTensor(data).to(self.device)
        dataset = TensorDataset(data_tensor, data_tensor)
        dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

        optimizer = optim.Adam(self.model.parameters(), lr=learning_rate)
        criterion = nn.MSELoss()

        self.model.train()
        for epoch in range(epochs):
            total_loss = 0
            for batch_data, _ in dataloader:
                optimizer.zero_grad()
                reconstructed, _ = self.model(batch_data)
                loss = criterion(reconstructed, batch_data)
                loss.backward()
                optimizer.step()
                total_loss += loss.item()

            if verbose and (epoch + 1) % 20 == 0:
                avg_loss = total_loss / len(dataloader)
                print(f'Epoch [{epoch+1}/{epochs}], Loss: {avg_loss:.6f}')

        # 计算阈值
        errors = self.reconstruction_error(data)
        self.threshold = np.percentile(errors, self.threshold_percentile)

        return self

    def reconstruction_error(self, data: np.ndarray) -> np.ndarray:
        """计算重构误差"""
        if data.ndim == 2:
            data = data[:, :, np.newaxis]

        self.model.eval()
        data_tensor = torch.FloatTensor(data).to(self.device)

        with torch.no_grad():
            reconstructed, _ = self.model(data_tensor)
            errors = torch.mean((data_tensor - reconstructed) ** 2, dim=(1, 2))

        return errors.cpu().numpy()

    def predict(self, data: np.ndarray) -> np.ndarray:
        """预测异常"""
        errors = self.reconstruction_error(data)
        return errors > self.threshold
```

### 变分自编码器（VAE）异常检测

VAE 学习数据的潜在分布，可以通过重构概率或 ELBO 来检测异常。

```python
class VAE(nn.Module):
    """变分自编码器"""

    def __init__(self, input_dim: int, hidden_dim: int = 64, latent_dim: int = 16):
        super().__init__()

        # 编码器
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU()
        )

        # 均值和方差层
        self.fc_mu = nn.Linear(hidden_dim // 2, latent_dim)
        self.fc_logvar = nn.Linear(hidden_dim // 2, latent_dim)

        # 解码器
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(hidden_dim // 2, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, input_dim)
        )

    def encode(self, x):
        h = self.encoder(x)
        mu = self.fc_mu(h)
        logvar = self.fc_logvar(h)
        return mu, logvar

    def reparameterize(self, mu, logvar):
        """重参数化技巧"""
        std = torch.exp(0.5 * logvar)
        eps = torch.randn_like(std)
        return mu + eps * std

    def decode(self, z):
        return self.decoder(z)

    def forward(self, x):
        mu, logvar = self.encode(x)
        z = self.reparameterize(mu, logvar)
        reconstructed = self.decode(z)
        return reconstructed, mu, logvar


def vae_loss(reconstructed, original, mu, logvar):
    """VAE损失函数 = 重构损失 + KL散度"""
    # 重构损失
    reconstruction_loss = nn.functional.mse_loss(reconstructed, original, reduction='sum')

    # KL散度
    kl_loss = -0.5 * torch.sum(1 + logvar - mu.pow(2) - logvar.exp())

    return reconstruction_loss + kl_loss


class VAEDetector:
    """基于VAE的异常检测器"""

    def __init__(self, input_dim: int, hidden_dim: int = 64,
                 latent_dim: int = 16, threshold_percentile: float = 95):
        self.model = VAE(input_dim, hidden_dim, latent_dim)
        self.threshold_percentile = threshold_percentile
        self.threshold = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(self.device)

    def fit(self, data: np.ndarray, epochs: int = 100, batch_size: int = 32,
            learning_rate: float = 1e-3, verbose: bool = True):
        """训练VAE"""
        data_tensor = torch.FloatTensor(data).to(self.device)
        dataset = TensorDataset(data_tensor, data_tensor)
        dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

        optimizer = optim.Adam(self.model.parameters(), lr=learning_rate)

        self.model.train()
        for epoch in range(epochs):
            total_loss = 0
            for batch_data, _ in dataloader:
                optimizer.zero_grad()
                reconstructed, mu, logvar = self.model(batch_data)
                loss = vae_loss(reconstructed, batch_data, mu, logvar)
                loss.backward()
                optimizer.step()
                total_loss += loss.item()

            if verbose and (epoch + 1) % 20 == 0:
                avg_loss = total_loss / len(dataset)
                print(f'Epoch [{epoch+1}/{epochs}], Loss: {avg_loss:.4f}')

        # 计算阈值
        errors = self.anomaly_score(data)
        self.threshold = np.percentile(errors, self.threshold_percentile)

        return self

    def anomaly_score(self, data: np.ndarray) -> np.ndarray:
        """
        计算异常分数
        使用重构误差 + KL散度作为异常分数
        """
        self.model.eval()
        data_tensor = torch.FloatTensor(data).to(self.device)

        with torch.no_grad():
            reconstructed, mu, logvar = self.model(data_tensor)

            # 重构误差
            reconstruction_error = torch.mean((data_tensor - reconstructed) ** 2, dim=1)

            # KL散度
            kl_divergence = -0.5 * torch.sum(1 + logvar - mu.pow(2) - logvar.exp(), dim=1)

            # 综合异常分数
            scores = reconstruction_error + 0.1 * kl_divergence

        return scores.cpu().numpy()

    def predict(self, data: np.ndarray) -> np.ndarray:
        """预测异常"""
        scores = self.anomaly_score(data)
        return scores > self.threshold

    def generate_samples(self, n_samples: int) -> np.ndarray:
        """从学习到的分布生成样本"""
        self.model.eval()
        with torch.no_grad():
            z = torch.randn(n_samples, self.model.fc_mu.out_features).to(self.device)
            samples = self.model.decode(z)
        return samples.cpu().numpy()


# 使用示例
np.random.seed(42)

# 生成正常数据
n_train = 1000
n_test = 200
input_dim = 20

# 正常数据来自多元高斯分布
normal_train = np.random.multivariate_normal(
    np.zeros(input_dim),
    np.eye(input_dim),
    n_train
)

normal_test = np.random.multivariate_normal(
    np.zeros(input_dim),
    np.eye(input_dim),
    n_test - 20
)

# 异常数据
anomaly_test = np.random.multivariate_normal(
    np.ones(input_dim) * 3,
    np.eye(input_dim),
    20
)

test_data = np.vstack([normal_test, anomaly_test])
test_labels = np.array([0] * (n_test - 20) + [1] * 20)

# 训练和检测
detector = VAEDetector(input_dim=input_dim, hidden_dim=64, latent_dim=8)
detector.fit(normal_train, epochs=100, verbose=True)

predictions = detector.predict(test_data)
scores = detector.anomaly_score(test_data)

print(f"\n检测到 {predictions.sum()} 个异常点")
print(f"真实异常数: {test_labels.sum()}")
```

### Transformer 异常检测

Transformer 架构利用自注意力机制捕捉长距离依赖，适合处理复杂的时间序列模式。

```python
class TransformerEncoder(nn.Module):
    """Transformer编码器用于时间序列异常检测"""

    def __init__(self, input_dim: int, d_model: int = 64, nhead: int = 4,
                 num_layers: int = 2, dim_feedforward: int = 128, dropout: float = 0.1):
        super().__init__()

        # 输入嵌入
        self.input_embedding = nn.Linear(input_dim, d_model)

        # 位置编码
        self.pos_encoder = PositionalEncoding(d_model, dropout)

        # Transformer编码器层
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=dim_feedforward,
            dropout=dropout,
            batch_first=True
        )
        self.transformer_encoder = nn.TransformerEncoder(encoder_layer, num_layers)

        # 输出层（重构）
        self.output_layer = nn.Linear(d_model, input_dim)

    def forward(self, x):
        # x shape: (batch, seq_len, input_dim)
        x = self.input_embedding(x)
        x = self.pos_encoder(x)
        encoded = self.transformer_encoder(x)
        reconstructed = self.output_layer(encoded)
        return reconstructed


class PositionalEncoding(nn.Module):
    """位置编码"""

    def __init__(self, d_model: int, dropout: float = 0.1, max_len: int = 5000):
        super().__init__()
        self.dropout = nn.Dropout(p=dropout)

        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-np.log(10000.0) / d_model))

        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0)

        self.register_buffer('pe', pe)

    def forward(self, x):
        x = x + self.pe[:, :x.size(1), :]
        return self.dropout(x)


class TransformerDetector:
    """基于Transformer的异常检测器"""

    def __init__(self, input_dim: int = 1, d_model: int = 64, nhead: int = 4,
                 num_layers: int = 2, threshold_percentile: float = 95):
        self.model = TransformerEncoder(input_dim, d_model, nhead, num_layers)
        self.threshold_percentile = threshold_percentile
        self.threshold = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(self.device)

    def fit(self, data: np.ndarray, epochs: int = 100, batch_size: int = 32,
            learning_rate: float = 1e-3, verbose: bool = True):
        """训练Transformer"""
        if data.ndim == 2:
            data = data[:, :, np.newaxis]

        data_tensor = torch.FloatTensor(data).to(self.device)
        dataset = TensorDataset(data_tensor, data_tensor)
        dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

        optimizer = optim.Adam(self.model.parameters(), lr=learning_rate)
        criterion = nn.MSELoss()

        self.model.train()
        for epoch in range(epochs):
            total_loss = 0
            for batch_data, _ in dataloader:
                optimizer.zero_grad()
                reconstructed = self.model(batch_data)
                loss = criterion(reconstructed, batch_data)
                loss.backward()
                optimizer.step()
                total_loss += loss.item()

            if verbose and (epoch + 1) % 20 == 0:
                avg_loss = total_loss / len(dataloader)
                print(f'Epoch [{epoch+1}/{epochs}], Loss: {avg_loss:.6f}')

        errors = self.reconstruction_error(data)
        self.threshold = np.percentile(errors, self.threshold_percentile)

        return self

    def reconstruction_error(self, data: np.ndarray) -> np.ndarray:
        """计算重构误差"""
        if data.ndim == 2:
            data = data[:, :, np.newaxis]

        self.model.eval()
        data_tensor = torch.FloatTensor(data).to(self.device)

        with torch.no_grad():
            reconstructed = self.model(data_tensor)
            errors = torch.mean((data_tensor - reconstructed) ** 2, dim=(1, 2))

        return errors.cpu().numpy()

    def predict(self, data: np.ndarray) -> np.ndarray:
        """预测异常"""
        errors = self.reconstruction_error(data)
        return errors > self.threshold
```

---

## 模型评估指标

异常检测的模型评估需要特别关注类别不平衡问题，因为异常通常是少数类。

### 基本模型评估指标

```python
from sklearn.metrics import (
    precision_score, recall_score, f1_score,
    accuracy_score, confusion_matrix, roc_auc_score,
    precision_recall_curve, roc_curve, average_precision_score
)
import matplotlib.pyplot as plt

def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray,
                    y_scores: np.ndarray = None) -> dict:
    """
    计算异常检测器性能指标

    Args:
        y_true: 真实标签（0=正常，1=异常）
        y_pred: 预测标签
        y_scores: 异常分数（可选）

    Returns:
        指标字典
    """
    metrics = {}

    # 基本指标
    metrics['accuracy'] = accuracy_score(y_true, y_pred)
    metrics['precision'] = precision_score(y_true, y_pred, zero_division=0)
    metrics['recall'] = recall_score(y_true, y_pred, zero_division=0)
    metrics['f1'] = f1_score(y_true, y_pred, zero_division=0)

    # 混淆矩阵
    cm = confusion_matrix(y_true, y_pred)
    metrics['confusion_matrix'] = cm

    # 计算特定指标
    tn, fp, fn, tp = cm.ravel()
    metrics['true_positives'] = tp
    metrics['false_positives'] = fp
    metrics['true_negatives'] = tn
    metrics['false_negatives'] = fn

    # 特异度（真负率）
    metrics['specificity'] = tn / (tn + fp) if (tn + fp) > 0 else 0

    # 如果有异常分数，计算AUC
    if y_scores is not None:
        metrics['roc_auc'] = roc_auc_score(y_true, y_scores)
        metrics['pr_auc'] = average_precision_score(y_true, y_scores)

    return metrics


def print_metrics_report(metrics: dict):
    """打印指标报告"""
    print("=" * 50)
    print("异常检测指标报告")
    print("=" * 50)

    print(f"\n准确率 (Accuracy): {metrics['accuracy']:.4f}")
    print(f"精确率 (Precision): {metrics['precision']:.4f}")
    print(f"召回率 (Recall): {metrics['recall']:.4f}")
    print(f"F1分数: {metrics['f1']:.4f}")
    print(f"特异度 (Specificity): {metrics['specificity']:.4f}")

    if 'roc_auc' in metrics:
        print(f"ROC AUC: {metrics['roc_auc']:.4f}")
        print(f"PR AUC: {metrics['pr_auc']:.4f}")

    print(f"\n混淆矩阵:")
    print(f"  真正例(TP): {metrics['true_positives']}")
    print(f"  假正例(FP): {metrics['false_positives']}")
    print(f"  真负例(TN): {metrics['true_negatives']}")
    print(f"  假负例(FN): {metrics['false_negatives']}")


# 使用示例
np.random.seed(42)

# 模拟真实标签和预测
n_samples = 1000
n_anomalies = 50

y_true = np.zeros(n_samples)
y_true[:n_anomalies] = 1
np.random.shuffle(y_true)

# 模拟预测（80%准确率）
y_pred = y_true.copy()
flip_indices = np.random.choice(n_samples, size=int(n_samples * 0.2), replace=False)
y_pred[flip_indices] = 1 - y_pred[flip_indices]

# 模拟异常分数
y_scores = np.random.beta(2, 5, n_samples)
y_scores[y_true == 1] = np.random.beta(5, 2, int(y_true.sum()))

# 计算指标
metrics = compute_metrics(y_true, y_pred, y_scores)
print_metrics_report(metrics)
```

### ROC 曲线和 PR 曲线

```python
def plot_curves(y_true: np.ndarray, y_scores: np.ndarray):
    """绘制ROC曲线和PR曲线"""
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    # ROC曲线
    fpr, tpr, thresholds = roc_curve(y_true, y_scores)
    roc_auc = roc_auc_score(y_true, y_scores)

    axes[0].plot(fpr, tpr, 'b-', linewidth=2, label=f'ROC曲线 (AUC = {roc_auc:.4f})')
    axes[0].plot([0, 1], [0, 1], 'r--', linewidth=1, label='随机猜测')
    axes[0].fill_between(fpr, tpr, alpha=0.2)
    axes[0].set_xlabel('假正率 (FPR)')
    axes[0].set_ylabel('真正率 (TPR)')
    axes[0].set_title('ROC曲线')
    axes[0].legend(loc='lower right')
    axes[0].grid(True, alpha=0.3)

    # PR曲线
    precision, recall, thresholds = precision_recall_curve(y_true, y_scores)
    pr_auc = average_precision_score(y_true, y_scores)

    axes[1].plot(recall, precision, 'g-', linewidth=2, label=f'PR曲线 (AP = {pr_auc:.4f})')
    baseline = y_true.sum() / len(y_true)
    axes[1].axhline(y=baseline, color='r', linestyle='--', label=f'基线 ({baseline:.4f})')
    axes[1].fill_between(recall, precision, alpha=0.2, color='green')
    axes[1].set_xlabel('召回率 (Recall)')
    axes[1].set_ylabel('精确率 (Precision)')
    axes[1].set_title('精确率-召回率曲线')
    axes[1].legend(loc='lower left')
    axes[1].grid(True, alpha=0.3)

    plt.tight_layout()
    plt.show()

    return roc_auc, pr_auc


# 绘制曲线
roc_auc, pr_auc = plot_curves(y_true, y_scores)
```

### 阈值选择策略

```python
def find_optimal_threshold(y_true: np.ndarray, y_scores: np.ndarray,
                           strategy: str = 'f1') -> float:
    """
    寻找最优阈值

    Args:
        y_true: 真实标签
        y_scores: 异常分数
        strategy: 优化策略 ('f1', 'precision', 'recall', 'youden')

    Returns:
        最优阈值
    """
    thresholds = np.percentile(y_scores, np.arange(0, 100, 1))
    best_threshold = thresholds[0]
    best_score = 0

    for threshold in thresholds:
        y_pred = (y_scores >= threshold).astype(int)

        if strategy == 'f1':
            score = f1_score(y_true, y_pred, zero_division=0)
        elif strategy == 'precision':
            score = precision_score(y_true, y_pred, zero_division=0)
        elif strategy == 'recall':
            score = recall_score(y_true, y_pred, zero_division=0)
        elif strategy == 'youden':
            # Youden's J statistic: TPR - FPR
            tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
            tpr = tp / (tp + fn) if (tp + fn) > 0 else 0
            fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
            score = tpr - fpr
        else:
            raise ValueError(f"未知策略: {strategy}")

        if score > best_score:
            best_score = score
            best_threshold = threshold

    return best_threshold


# 寻找不同策略的最优阈值
strategies = ['f1', 'precision', 'recall', 'youden']
print("不同策略的最优阈值:")
for strategy in strategies:
    threshold = find_optimal_threshold(y_true, y_scores, strategy)
    y_pred = (y_scores >= threshold).astype(int)
    f1 = f1_score(y_true, y_pred)
    print(f"  {strategy}: 阈值={threshold:.4f}, F1={f1:.4f}")
```

---

## 实战案例

### 案例1：服务器CPU使用率异常检测

```python
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

class ServerMonitoringSystem:
    """服务器监控系统"""

    def __init__(self):
        self.detectors = {}
        self.thresholds = {}

    def generate_sample_data(self, days: int = 7) -> pd.DataFrame:
        """生成模拟服务器监控数据"""
        np.random.seed(42)

        # 时间索引
        start_date = datetime.now() - timedelta(days=days)
        timestamps = pd.date_range(start=start_date, periods=days*24*60, freq='1min')

        n_points = len(timestamps)

        # CPU使用率：日周期性 + 噪声
        hour = np.array([t.hour for t in timestamps])
        day_pattern = 30 + 20 * np.sin(2 * np.pi * hour / 24 - np.pi/2)
        cpu_usage = day_pattern + np.random.normal(0, 5, n_points)
        cpu_usage = np.clip(cpu_usage, 0, 100)

        # 插入异常
        # 1. CPU尖峰
        spike_indices = np.random.choice(n_points, size=20, replace=False)
        cpu_usage[spike_indices] = np.random.uniform(90, 100, 20)

        # 2. 异常低使用率（可能是服务崩溃）
        crash_start = n_points // 2
        cpu_usage[crash_start:crash_start + 30] = np.random.uniform(0, 5, 30)

        # 内存使用率
        memory_usage = 60 + np.random.normal(0, 10, n_points)
        memory_usage = np.clip(memory_usage, 0, 100)

        # 网络流量
        network_traffic = 100 + 50 * np.sin(2 * np.pi * hour / 24) + np.random.normal(0, 20, n_points)
        network_traffic = np.clip(network_traffic, 0, 300)

        df = pd.DataFrame({
            'timestamp': timestamps,
            'cpu_usage': cpu_usage,
            'memory_usage': memory_usage,
            'network_traffic': network_traffic
        })

        return df

    def train_detectors(self, df: pd.DataFrame):
        """训练异常检测器"""
        # 对每个指标训练检测器
        for column in ['cpu_usage', 'memory_usage', 'network_traffic']:
            data = df[column].values

            # 使用滑动窗口统计方法
            detector = SlidingWindowDetector(window_size=60, threshold=3.0)
            self.detectors[column] = detector

    def detect_anomalies(self, df: pd.DataFrame) -> pd.DataFrame:
        """检测异常"""
        results = df.copy()

        for column in ['cpu_usage', 'memory_usage', 'network_traffic']:
            data = df[column].values
            detector = self.detectors[column]
            anomalies, scores = detector.detect_with_scores(data)

            results[f'{column}_anomaly'] = anomalies
            results[f'{column}_score'] = scores

        # 综合异常标记
        results['is_anomaly'] = (
            results['cpu_usage_anomaly'] |
            results['memory_usage_anomaly'] |
            results['network_traffic_anomaly']
        )

        return results

    def generate_report(self, results: pd.DataFrame) -> str:
        """生成异常报告"""
        report = []
        report.append("=" * 60)
        report.append("服务器监控异常报告")
        report.append("=" * 60)

        total_anomalies = results['is_anomaly'].sum()
        report.append(f"\n总异常数: {total_anomalies}")
        report.append(f"数据时间范围: {results['timestamp'].min()} - {results['timestamp'].max()}")

        for column in ['cpu_usage', 'memory_usage', 'network_traffic']:
            anomaly_count = results[f'{column}_anomaly'].sum()
            report.append(f"\n{column} 异常数: {anomaly_count}")

            if anomaly_count > 0:
                anomaly_data = results[results[f'{column}_anomaly']]
                report.append(f"  最大异常分数: {anomaly_data[f'{column}_score'].max():.2f}")
                report.append(f"  异常时间点示例:")
                for _, row in anomaly_data.head(3).iterrows():
                    report.append(f"    - {row['timestamp']}: {row[column]:.2f}")

        return '\n'.join(report)


# 运行示例
monitor = ServerMonitoringSystem()

# 生成数据
print("生成模拟数据...")
df = monitor.generate_sample_data(days=3)
print(f"数据点数: {len(df)}")

# 训练检测器
print("\n训练检测器...")
monitor.train_detectors(df)

# 检测异常
print("检测异常...")
results = monitor.detect_anomalies(df)

# 生成报告
report = monitor.generate_report(results)
print(report)
```

### 案例2：金融交易异常检测

```python
class FraudDetectionSystem:
    """金融欺诈检测系统"""

    def __init__(self):
        self.isolation_forest = None
        self.autoencoder = None
        self.scaler = StandardScaler()

    def generate_sample_transactions(self, n_normal: int = 10000,
                                      n_fraud: int = 200) -> pd.DataFrame:
        """生成模拟交易数据"""
        np.random.seed(42)

        # 正常交易特征
        normal_transactions = pd.DataFrame({
            'amount': np.random.lognormal(4, 1, n_normal),  # 对数正态分布
            'time_since_last': np.random.exponential(24, n_normal),  # 小时
            'distance_from_home': np.random.exponential(10, n_normal),  # 公里
            'merchant_category': np.random.randint(0, 20, n_normal),
            'transaction_count_24h': np.random.poisson(3, n_normal),
            'is_fraud': 0
        })

        # 欺诈交易特征
        fraud_transactions = pd.DataFrame({
            'amount': np.random.lognormal(6, 1.5, n_fraud),  # 较大金额
            'time_since_last': np.random.exponential(1, n_fraud),  # 短时间间隔
            'distance_from_home': np.random.exponential(100, n_fraud),  # 远距离
            'merchant_category': np.random.randint(0, 20, n_fraud),
            'transaction_count_24h': np.random.poisson(10, n_fraud),  # 高频交易
            'is_fraud': 1
        })

        df = pd.concat([normal_transactions, fraud_transactions], ignore_index=True)
        df = df.sample(frac=1, random_state=42).reset_index(drop=True)  # 打乱顺序

        return df

    def extract_features(self, df: pd.DataFrame) -> np.ndarray:
        """提取特征"""
        feature_columns = ['amount', 'time_since_last', 'distance_from_home',
                          'merchant_category', 'transaction_count_24h']

        # 添加衍生特征
        df = df.copy()
        df['log_amount'] = np.log1p(df['amount'])
        df['amount_per_transaction'] = df['amount'] / (df['transaction_count_24h'] + 1)

        extended_features = feature_columns + ['log_amount', 'amount_per_transaction']

        return df[extended_features].values

    def train(self, df: pd.DataFrame):
        """训练检测模型"""
        features = self.extract_features(df)
        features_scaled = self.scaler.fit_transform(features)

        # 只使用正常数据训练（无监督）
        normal_mask = df['is_fraud'] == 0
        normal_features = features_scaled[normal_mask]

        # 训练隔离森林
        self.isolation_forest = IsolationForest(
            contamination=0.02,
            n_estimators=100,
            random_state=42
        )
        self.isolation_forest.fit(normal_features)

        # 训练自编码器
        self.autoencoder = AutoencoderDetector(
            input_dim=features_scaled.shape[1],
            encoding_dim=4,
            threshold_percentile=98
        )
        self.autoencoder.fit(normal_features, epochs=50, verbose=False)

        print("模型训练完成")

    def predict(self, df: pd.DataFrame) -> pd.DataFrame:
        """预测欺诈"""
        features = self.extract_features(df)
        features_scaled = self.scaler.transform(features)

        results = df.copy()

        # 隔离森林预测
        if_scores = -self.isolation_forest.decision_function(features_scaled)
        if_predictions = self.isolation_forest.predict(features_scaled) == -1

        # 自编码器预测
        ae_scores = self.autoencoder.reconstruction_error(features_scaled)
        ae_predictions = ae_scores > self.autoencoder.threshold

        # 综合预测（任一模型认为异常）
        results['if_score'] = if_scores
        results['if_fraud'] = if_predictions
        results['ae_score'] = ae_scores
        results['ae_fraud'] = ae_predictions
        results['predicted_fraud'] = if_predictions | ae_predictions

        return results

    def run_assessment(self, results: pd.DataFrame):
        """检验模型性能"""
        y_true = results['is_fraud'].values

        print("\n" + "=" * 50)
        print("欺诈检测性能报告")
        print("=" * 50)

        for model_name, pred_col, score_col in [
            ('隔离森林', 'if_fraud', 'if_score'),
            ('自编码器', 'ae_fraud', 'ae_score'),
            ('综合模型', 'predicted_fraud', 'if_score')
        ]:
            y_pred = results[pred_col].values
            y_scores = results[score_col].values

            print(f"\n{model_name}:")
            print(f"  精确率: {precision_score(y_true, y_pred):.4f}")
            print(f"  召回率: {recall_score(y_true, y_pred):.4f}")
            print(f"  F1分数: {f1_score(y_true, y_pred):.4f}")
            print(f"  ROC AUC: {roc_auc_score(y_true, y_scores):.4f}")


# 运行示例
fraud_system = FraudDetectionSystem()

# 生成数据
print("生成模拟交易数据...")
df = fraud_system.generate_sample_transactions(n_normal=5000, n_fraud=100)
print(f"总交易数: {len(df)}, 欺诈交易数: {df['is_fraud'].sum()}")

# 划分训练和测试集
train_size = int(len(df) * 0.7)
train_df = df.iloc[:train_size]
test_df = df.iloc[train_size:]

# 训练
print("\n训练检测模型...")
fraud_system.train(train_df)

# 预测和检验
print("\n在测试集上检验...")
results = fraud_system.predict(test_df)
fraud_system.run_assessment(results)
```

---

## 面试要点

### 核心概念题

**Q1: 解释异常检测中的点异常、上下文异常和集体异常的区别？**

- **点异常**：单个数据点与其他数据明显不同，如信用卡交易金额突然增大100倍
- **上下文异常**：在特定上下文中异常，如夏天气温为0度是异常，但冬天则正常
- **集体异常**：一组数据点整体异常，如网络流量在某段时间呈现异常模式

**Q2: Z-Score方法和IQR方法各有什么优缺点？**

| 方法 | 优点 | 缺点 |
|------|------|------|
| Z-Score | 简单直观，有概率解释 | 假设正态分布，受异常值影响 |
| IQR | 不假设分布，对异常鲁棒 | 无法利用分布信息 |

**Q3: 隔离森林的核心思想是什么？为什么异常点路径长度更短？**

核心思想：异常点的特征值与正常点差异大，在随机划分时更容易被"隔离"出来。

路径长度短的原因：
1. 异常点通常位于特征空间的稀疏区域
2. 随机选择划分特征和阈值时，更容易选中能隔离异常点的划分
3. 正常点密集，需要更多划分才能区分

**Q4: 自编码器如何用于异常检测？**

```python
# 基本原理
# 用正常数据训练自编码器学习数据的压缩表示
# 正常数据能够被良好重构，异常数据重构误差大
# 使用重构误差作为异常分数

# 异常分数 = ||x - decode(encode(x))||^2
```

关键点：
- 只用正常数据训练
- 编码维度的选择影响检测效果
- 可以使用重构误差的百分位数作为阈值

**Q5: 在类别极度不平衡的异常检测中，应该使用什么性能指标？**

- **不推荐**：准确率（Accuracy）会被大量正常样本主导
- **推荐**：
  - 精确率-召回率曲线（PR曲线）和PR AUC
  - F1分数
  - 召回率@特定精确率
  - 如果异常检测成本不对称，使用加权F分数

### 工程实践题

**Q6: 如何处理时间序列异常检测中的季节性和趋势？**

```python
from statsmodels.tsa.seasonal import seasonal_decompose

def decompose_and_detect(data, period=24):
    """分解时间序列并检测异常"""
    # 1. 分解时间序列
    decomposition = seasonal_decompose(data, period=period, model='additive')

    # 2. 在残差上检测异常（去除趋势和季节性）
    residual = decomposition.resid

    # 3. 使用统计方法检测残差中的异常
    detector = ZScoreDetector(threshold=3.0)
    anomalies = detector.fit_detect(residual[~np.isnan(residual)])

    return anomalies, decomposition
```

**Q7: 实时异常检测系统的设计考虑？**

1. **延迟要求**：选择计算复杂度低的方法（如滑动窗口统计）
2. **模型更新**：定期重训练或使用在线学习算法
3. **阈值调整**：动态阈值适应数据分布变化
4. **报警策略**：设置冷却时间避免重复报警
5. **可解释性**：提供异常原因分析

**Q8: 如何选择合适的异常检测方法？**

| 场景 | 推荐方法 |
|------|---------|
| 数据量小，特征少 | 统计方法（Z-Score, IQR） |
| 高维数据 | 隔离森林, One-Class SVM |
| 时序依赖强 | LSTM自编码器, Transformer |
| 需要概率解释 | VAE, 高斯混合模型 |
| 实时检测 | 滑动窗口统计, EWMA |

### 算法设计题

**Q9: 设计一个多尺度时间序列异常检测系统**

```python
class MultiScaleAnomalyDetector:
    """多尺度异常检测器"""

    def __init__(self, scales=[1, 5, 15, 60]):
        """
        Args:
            scales: 不同时间尺度（分钟）
        """
        self.scales = scales
        self.detectors = {}

    def aggregate_data(self, data, scale):
        """按时间尺度聚合数据"""
        # 实现数据聚合逻辑
        pass

    def detect(self, data):
        """多尺度检测"""
        all_anomalies = []

        for scale in self.scales:
            # 1. 聚合数据
            aggregated = self.aggregate_data(data, scale)

            # 2. 在该尺度上检测
            detector = self.detectors.get(scale)
            anomalies = detector.detect(aggregated)

            # 3. 映射回原始时间点
            all_anomalies.append(self.map_to_original(anomalies, scale))

        # 4. 综合多尺度结果
        return self.combine_results(all_anomalies)
```

**Q10: 如何处理多变量时间序列的异常检测？**

1. **独立检测**：对每个变量单独检测，然后汇总
2. **联合检测**：将多变量作为特征向量，使用多维方法（如隔离森林）
3. **相关性检测**：监控变量间的相关性变化
4. **深度学习**：使用多变量LSTM或Transformer

---

## 延伸阅读

### 推荐资源

1. **书籍**
   - 《Outlier Analysis》- Charu C. Aggarwal
   - 《Anomaly Detection: A Survey》- Varun Chandola等

2. **论文**
   - "Isolation Forest" - Liu et al., 2008
   - "Deep Learning for Anomaly Detection: A Survey" - Chalapathy & Chawla, 2019
   - "LSTM-based Encoder-Decoder for Multi-sensor Anomaly Detection" - Malhotra et al., 2016

3. **工具库**
   - PyOD: Python异常检测工具库
   - Alibi Detect: 机器学习模型监控
   - ADTK: 时间序列异常检测工具包

### 进阶主题

- 在线异常检测与流数据处理
- 图神经网络异常检测
- 联邦学习中的异常检测
- 可解释异常检测
- 自监督学习异常检测

---

通过本文的学习，你应该能够：

1. 理解不同类型的异常及其特点
2. 掌握统计方法、机器学习方法和深度学习方法
3. 正确进行异常检测模型的性能检验
4. 在实际项目中应用异常检测技术
5. 在面试中自信地回答异常检测相关问题

异常检测是一个不断发展的领域，新的方法和技术层出不穷。建议持续关注最新研究，并在实际项目中积累经验。
