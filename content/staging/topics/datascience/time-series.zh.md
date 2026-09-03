---
title: 时间序列分析完全指南
description: 掌握时间序列分析和预测技术
track: datascience
section: classical-ml
difficulty: advanced
tags:
  - 时间序列
  - 预测
  - ARIMA
  - LSTM
status: imported
origin: old/src/content/docs/ai/time-series.zh.md
divergence: 0.195
issues:
  - title-lang-en
  - title-language
legacy:
  category: AI
  subcategory: Machine Learning
  order: 18
  lastUpdated: 2026-01-07
---

时间序列分析是数据科学和机器学习中的重要分支，广泛应用于金融预测、销售预测、天气预报、需求规划等领域。本文将系统介绍时间序列分析的核心概念、经典方法和深度学习技术，帮助你全面掌握时间序列预测的理论与实践。

---

## 时间序列基础概念

### 什么是时间序列

时间序列（Time Series）是按时间顺序排列的一系列数据点，每个数据点都与特定的时间戳相关联。与传统的独立同分布（i.i.d.）数据不同，时间序列数据具有时间依赖性，当前值往往与历史值存在相关关系。

**时间序列的特点：**
- **时序依赖性**：当前观测值依赖于过去的观测值
- **非独立性**：数据点之间存在自相关
- **趋势性**：数据可能呈现长期上升或下降趋势
- **周期性**：数据可能存在固定周期的重复模式

### 时间序列的主要成分

时间序列通常可以分解为以下四个基本成分：

| 成分 | 英文名 | 描述 | 示例 |
|------|--------|------|------|
| 趋势 | Trend | 长期的上升或下降变化 | GDP增长趋势 |
| 季节性 | Seasonality | 固定周期的重复模式 | 夏季空调销量增加 |
| 周期性 | Cyclicity | 不固定周期的波动 | 经济周期 |
| 残差 | Residual | 随机波动和噪声 | 无法解释的随机变化 |

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# 创建示例时间序列数据
np.random.seed(42)
dates = pd.date_range(start='2020-01-01', periods=365*3, freq='D')

# 构建包含趋势、季节性和噪声的时间序列
trend = np.linspace(100, 200, len(dates))  # 上升趋势
seasonality = 20 * np.sin(2 * np.pi * np.arange(len(dates)) / 365)  # 年度季节性
noise = np.random.normal(0, 5, len(dates))  # 随机噪声

# 合成时间序列
ts_data = trend + seasonality + noise

# 创建DataFrame
df = pd.DataFrame({'date': dates, 'value': ts_data})
df.set_index('date', inplace=True)

# 可视化
fig, axes = plt.subplots(4, 1, figsize=(14, 10))

axes[0].plot(df.index, ts_data, label='原始序列')
axes[0].set_title('完整时间序列')
axes[0].legend()

axes[1].plot(df.index, trend, color='red', label='趋势成分')
axes[1].set_title('趋势成分 (Trend)')
axes[1].legend()

axes[2].plot(df.index, seasonality, color='green', label='季节性成分')
axes[2].set_title('季节性成分 (Seasonality)')
axes[2].legend()

axes[3].plot(df.index, noise, color='gray', label='残差成分')
axes[3].set_title('残差成分 (Residual)')
axes[3].legend()

plt.tight_layout()
plt.show()
```

### 常用的时间序列数据类型

```python
import pandas as pd

# 单变量时间序列
univariate_ts = pd.Series(
    data=[100, 102, 105, 103, 108, 112],
    index=pd.date_range('2024-01-01', periods=6, freq='D'),
    name='sales'
)

# 多变量时间序列
multivariate_ts = pd.DataFrame({
    'temperature': [20, 22, 25, 23, 21, 19],
    'humidity': [60, 55, 50, 52, 58, 62],
    'sales': [100, 120, 150, 130, 110, 95]
}, index=pd.date_range('2024-01-01', periods=6, freq='D'))

# 面板数据（多个实体的时间序列）
panel_data = pd.DataFrame({
    'date': pd.date_range('2024-01-01', periods=3, freq='D').tolist() * 2,
    'store_id': ['A', 'A', 'A', 'B', 'B', 'B'],
    'sales': [100, 110, 105, 200, 220, 210]
})

print("单变量时间序列:")
print(univariate_ts)
print("\n多变量时间序列:")
print(multivariate_ts)
```

---

## 时间序列分解

时间序列分解是分析时间序列的重要方法，它将原始序列拆分为多个可解释的成分，帮助我们理解数据的内在结构。

### 加法分解与乘法分解

**加法模型**：适用于季节波动幅度相对稳定的情况

$$Y_t = T_t + S_t + R_t$$

**乘法模型**：适用于季节波动幅度随趋势变化的情况

$$Y_t = T_t \times S_t \times R_t$$

其中 $Y_t$ 是观测值，$T_t$ 是趋势成分，$S_t$ 是季节成分，$R_t$ 是残差成分。

### 经典分解方法

```python
import pandas as pd
import numpy as np
from statsmodels.tsa.seasonal import seasonal_decompose
import matplotlib.pyplot as plt

# 创建示例数据
np.random.seed(42)
dates = pd.date_range(start='2020-01-01', periods=365*2, freq='D')
trend = np.linspace(100, 150, len(dates))
seasonality = 15 * np.sin(2 * np.pi * np.arange(len(dates)) / 365)
noise = np.random.normal(0, 3, len(dates))
data = trend + seasonality + noise

ts = pd.Series(data, index=dates)

# 加法分解
decomposition_add = seasonal_decompose(ts, model='additive', period=365)

# 乘法分解（数据必须为正值）
decomposition_mul = seasonal_decompose(ts, model='multiplicative', period=365)

# 绘制分解结果
def plot_decomposition(decomposition, title):
    fig, axes = plt.subplots(4, 1, figsize=(14, 10))
    
    decomposition.observed.plot(ax=axes[0], title='原始序列')
    decomposition.trend.plot(ax=axes[1], title='趋势成分')
    decomposition.seasonal.plot(ax=axes[2], title='季节性成分')
    decomposition.resid.plot(ax=axes[3], title='残差成分')
    
    fig.suptitle(title, fontsize=14)
    plt.tight_layout()
    plt.show()

plot_decomposition(decomposition_add, '加法分解')
```

### STL分解（更强大的方法）

STL（Seasonal and Trend decomposition using Loess）是一种更加灵活和鲁棒的分解方法，能够处理任意类型的季节性，并对异常值具有更好的鲁棒性。

```python
from statsmodels.tsa.seasonal import STL
import matplotlib.pyplot as plt

# STL分解
stl = STL(ts, period=365, robust=True)
result = stl.fit()

# 绘制STL分解结果
fig = result.plot()
fig.set_size_inches(14, 10)
plt.show()

# 获取各成分
trend_component = result.trend
seasonal_component = result.seasonal
residual_component = result.resid

# 计算季节性强度和趋势强度
def calculate_strength(residual, component):
    """计算成分强度"""
    var_residual = np.var(residual)
    var_component_residual = np.var(component + residual)
    strength = max(0, 1 - var_residual / var_component_residual)
    return strength

trend_strength = calculate_strength(residual_component.dropna(),
                                    trend_component.dropna())
seasonal_strength = calculate_strength(residual_component.dropna(),
                                       seasonal_component.dropna())

print(f"趋势强度: {trend_strength:.4f}")
print(f"季节性强度: {seasonal_strength:.4f}")
```

### MSTL分解（多重季节性）

当时间序列存在多个季节性周期时（如日周期和周周期），可以使用MSTL分解。

```python
from statsmodels.tsa.seasonal import MSTL

# 创建具有多重季节性的数据（小时数据，包含日周期和周周期）
np.random.seed(42)
hours = 24 * 7 * 12  # 12周的小时数据
dates = pd.date_range(start='2024-01-01', periods=hours, freq='H')

# 日周期（24小时）+ 周周期（168小时）
daily_season = 10 * np.sin(2 * np.pi * np.arange(hours) / 24)
weekly_season = 20 * np.sin(2 * np.pi * np.arange(hours) / 168)
trend = np.linspace(100, 120, hours)
noise = np.random.normal(0, 2, hours)

multi_seasonal_data = trend + daily_season + weekly_season + noise
ts_multi = pd.Series(multi_seasonal_data, index=dates)

# MSTL分解
mstl = MSTL(ts_multi, periods=[24, 168])  # 日周期和周周期
result_mstl = mstl.fit()

# 查看分解结果
print("分解成分:")
print(f"趋势成分形状: {result_mstl.trend.shape}")
print(f"季节性成分形状: {result_mstl.seasonal.shape}")
print(f"残差成分形状: {result_mstl.resid.shape}")
```

---

## 平稳性检验与差分

### 平稳性的重要性

平稳性（Stationarity）是时间序列分析中的核心概念。一个平稳的时间序列具有以下特性：
- **均值恒定**：序列的期望值不随时间变化
- **方差恒定**：序列的方差不随时间变化
- **自协方差只与滞后阶数有关**：不同时间点的协方差只取决于时间间隔

许多经典的时间序列模型（如ARIMA）要求数据是平稳的，因此我们需要对非平稳序列进行转换。

### ADF检验（单位根检验）

Augmented Dickey-Fuller (ADF) 检验是最常用的平稳性检验方法。

**假设检验：**
- H0（原假设）：序列存在单位根，即非平稳
- H1（备择假设）：序列平稳

```python
from statsmodels.tsa.stattools import adfuller, kpss
import pandas as pd
import numpy as np

def adf_test(series, significance_level=0.05):
    """
    ADF平稳性检验
    
    Parameters:
    -----------
    series : pd.Series
        时间序列数据
    significance_level : float
        显著性水平，默认0.05
    
    Returns:
    --------
    dict : 检验结果
    """
    result = adfuller(series.dropna(), autolag='AIC')
    
    output = {
        'ADF统计量': result[0],
        'p值': result[1],
        '滞后阶数': result[2],
        '观测数': result[3],
        '临界值': result[4],
        '是否平稳': result[1] < significance_level
    }
    
    print("=" * 50)
    print("ADF平稳性检验结果")
    print("=" * 50)
    print(f"ADF统计量: {result[0]:.6f}")
    print(f"p值: {result[1]:.6f}")
    print(f"使用的滞后阶数: {result[2]}")
    print(f"观测数量: {result[3]}")
    print("\n临界值:")
    for key, value in result[4].items():
        print(f"  {key}: {value:.6f}")
    print("-" * 50)
    
    if result[1] < significance_level:
        print(f"结论: p值 < {significance_level}，拒绝原假设，序列是平稳的")
    else:
        print(f"结论: p值 >= {significance_level}，无法拒绝原假设，序列是非平稳的")
    
    return output

# 创建非平稳序列（随机游走）
np.random.seed(42)
random_walk = np.cumsum(np.random.randn(500))
ts_nonstationary = pd.Series(random_walk)

# 创建平稳序列
ts_stationary = pd.Series(np.random.randn(500))

print("非平稳序列检验:")
adf_test(ts_nonstationary)

print("\n\n平稳序列检验:")
adf_test(ts_stationary)
```

### KPSS检验

KPSS检验与ADF检验的原假设相反，可以作为互补的检验方法。

```python
from statsmodels.tsa.stattools import kpss

def kpss_test(series, regression='c'):
    """
    KPSS平稳性检验
    
    Parameters:
    -----------
    series : pd.Series
        时间序列数据
    regression : str
        'c' 表示检验水平平稳性
        'ct' 表示检验趋势平稳性
    
    Returns:
    --------
    dict : 检验结果
    """
    result = kpss(series.dropna(), regression=regression)
    
    print("=" * 50)
    print("KPSS平稳性检验结果")
    print("=" * 50)
    print(f"KPSS统计量: {result[0]:.6f}")
    print(f"p值: {result[1]:.6f}")
    print(f"滞后阶数: {result[2]}")
    print("\n临界值:")
    for key, value in result[3].items():
        print(f"  {key}: {value:.6f}")
    print("-" * 50)
    
    # KPSS的原假设是序列平稳
    if result[1] < 0.05:
        print("结论: p值 < 0.05，拒绝原假设，序列是非平稳的")
    else:
        print("结论: p值 >= 0.05，无法拒绝原假设，序列是平稳的")
    
    return {
        'KPSS统计量': result[0],
        'p值': result[1],
        '滞后阶数': result[2],
        '临界值': result[3]
    }

# 执行KPSS检验
kpss_test(ts_nonstationary)
```

### 差分处理

对于非平稳序列，差分是最常用的平稳化方法。

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

def difference_series(series, order=1, seasonal_period=None):
    """
    对时间序列进行差分处理
    
    Parameters:
    -----------
    series : pd.Series
        原始时间序列
    order : int
        差分阶数
    seasonal_period : int or None
        季节性差分周期
    
    Returns:
    --------
    pd.Series : 差分后的序列
    """
    diff_series = series.copy()
    
    # 普通差分
    for _ in range(order):
        diff_series = diff_series.diff().dropna()
    
    # 季节性差分
    if seasonal_period is not None:
        diff_series = diff_series.diff(seasonal_period).dropna()
    
    return diff_series

def find_optimal_diff_order(series, max_order=3):
    """
    自动寻找最优差分阶数
    """
    for d in range(max_order + 1):
        if d == 0:
            test_series = series
        else:
            test_series = series.diff(d).dropna()
        
        result = adfuller(test_series, autolag='AIC')
        p_value = result[1]
        
        print(f"差分阶数 d={d}: ADF统计量={result[0]:.4f}, p值={p_value:.4f}")
        
        if p_value < 0.05:
            print(f"\n最优差分阶数: {d}")
            return d
    
    print(f"\n警告: 达到最大差分阶数 {max_order} 仍未平稳")
    return max_order

# 示例：对非平稳序列进行差分
np.random.seed(42)
trend_data = np.cumsum(np.random.randn(500)) + np.linspace(0, 50, 500)
ts = pd.Series(trend_data)

# 寻找最优差分阶数
optimal_d = find_optimal_diff_order(ts)

# 可视化差分结果
fig, axes = plt.subplots(3, 1, figsize=(14, 10))

axes[0].plot(ts)
axes[0].set_title('原始序列（非平稳）')

axes[1].plot(ts.diff().dropna())
axes[1].set_title('一阶差分')

axes[2].plot(ts.diff().diff().dropna())
axes[2].set_title('二阶差分')

plt.tight_layout()
plt.show()
```

---

## ARIMA模型详解

### ARIMA模型原理

ARIMA（AutoRegressive Integrated Moving Average）是最经典的时间序列预测模型，由三个部分组成：

**AR（自回归）部分**：当前值与过去值的线性组合

$$y_t = c + \phi_1 y_{t-1} + \phi_2 y_{t-2} + ... + \phi_p y_{t-p} + \epsilon_t$$

**I（差分）部分**：通过差分使序列平稳

**MA（移动平均）部分**：当前值与过去误差项的线性组合

$$y_t = c + \epsilon_t + \theta_1 \epsilon_{t-1} + \theta_2 \epsilon_{t-2} + ... + \theta_q \epsilon_{t-q}$$

其中 B 是滞后算子，p 是自回归阶数，d 是差分阶数，q 是移动平均阶数。

### 参数选择：ACF和PACF分析

```python
import pandas as pd
import numpy as np
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf
from statsmodels.tsa.stattools import acf, pacf
import matplotlib.pyplot as plt

def analyze_acf_pacf(series, lags=40, title='ACF和PACF分析'):
    """
    分析时间序列的自相关和偏自相关函数
    """
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    
    # 原始序列
    axes[0, 0].plot(series)
    axes[0, 0].set_title('时间序列')
    axes[0, 0].set_xlabel('时间')
    axes[0, 0].set_ylabel('值')
    
    # 差分后序列
    diff_series = series.diff().dropna()
    axes[0, 1].plot(diff_series)
    axes[0, 1].set_title('一阶差分序列')
    axes[0, 1].set_xlabel('时间')
    axes[0, 1].set_ylabel('值')
    
    # ACF
    plot_acf(diff_series, lags=lags, ax=axes[1, 0], title='自相关函数 (ACF)')
    
    # PACF
    plot_pacf(diff_series, lags=lags, ax=axes[1, 1], title='偏自相关函数 (PACF)')
    
    plt.suptitle(title, fontsize=14)
    plt.tight_layout()
    plt.show()
    
    # 参数选择指南
    print("\n参数选择指南:")
    print("=" * 50)
    print("ACF图:")
    print("  - 如果ACF呈指数衰减，考虑AR模型")
    print("  - 如果ACF在q阶后截尾，MA(q)模型合适")
    print("\nPACF图:")
    print("  - 如果PACF在p阶后截尾，AR(p)模型合适")
    print("  - 如果PACF呈指数衰减，考虑MA模型")
    print("\n组合情况:")
    print("  - ACF和PACF都呈指数衰减 -> ARMA模型")
    print("=" * 50)

# 创建示例数据
np.random.seed(42)
n = 500
# 模拟AR(2)过程
ar_data = np.zeros(n)
for i in range(2, n):
    ar_data[i] = 0.6 * ar_data[i-1] - 0.3 * ar_data[i-2] + np.random.randn()

ts_ar = pd.Series(ar_data)
analyze_acf_pacf(ts_ar, title='AR(2)过程的ACF和PACF分析')
```

### 自动参数选择

```python
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.stattools import adfuller
import warnings
warnings.filterwarnings('ignore')

def auto_arima(series, max_p=5, max_d=2, max_q=5, criterion='aic'):
    """
    自动选择最优ARIMA参数
    """
    # 首先确定d
    d = 0
    temp_series = series.copy()
    for i in range(max_d + 1):
        result = adfuller(temp_series.dropna())
        if result[1] < 0.05:
            d = i
            break
        temp_series = temp_series.diff().dropna()
        d = i + 1
    
    print(f"确定的差分阶数 d = {d}")
    
    # 网格搜索p和q
    best_score = float('inf')
    best_params = (0, d, 0)
    results = []
    
    for p in range(max_p + 1):
        for q in range(max_q + 1):
            try:
                model = ARIMA(series, order=(p, d, q))
                fitted = model.fit()
                
                if criterion == 'aic':
                    score = fitted.aic
                else:
                    score = fitted.bic
                
                results.append({
                    'p': p, 'd': d, 'q': q,
                    'AIC': fitted.aic, 'BIC': fitted.bic
                })
                
                if score < best_score:
                    best_score = score
                    best_params = (p, d, q)
            
            except Exception as e:
                continue
    
    # 显示结果
    results_df = pd.DataFrame(results).sort_values(criterion.upper())
    print(f"\n最优参数 (按{criterion.upper()}): ARIMA{best_params}")
    print(f"最优{criterion.upper()}: {best_score:.2f}")
    print("\n前10个最优模型:")
    print(results_df.head(10).to_string(index=False))
    
    return best_params

# 使用示例
np.random.seed(42)
n = 500
data = np.zeros(n)
data[0] = np.random.randn()
for i in range(1, n):
    data[i] = data[i-1] + 0.5 * np.random.randn()

ts = pd.Series(data)
best_order = auto_arima(ts)
```

### ARIMA模型训练与预测

```python
import pandas as pd
import numpy as np
from statsmodels.tsa.arima.model import ARIMA
from sklearn.metrics import mean_squared_error, mean_absolute_error
import matplotlib.pyplot as plt

class ARIMAForecaster:
    """ARIMA时间序列预测器"""
    
    def __init__(self, order=(1, 1, 1)):
        self.order = order
        self.model = None
        self.fitted_model = None
    
    def fit(self, train_data):
        """训练ARIMA模型"""
        self.model = ARIMA(train_data, order=self.order)
        self.fitted_model = self.model.fit()
        print("模型训练完成")
        print(self.fitted_model.summary())
        return self
    
    def predict(self, steps):
        """进行预测"""
        if self.fitted_model is None:
            raise ValueError("请先训练模型")
        forecast = self.fitted_model.forecast(steps=steps)
        return forecast
    
    def get_confidence_interval(self, steps, alpha=0.05):
        """获取预测置信区间"""
        forecast = self.fitted_model.get_forecast(steps=steps)
        conf_int = forecast.conf_int(alpha=alpha)
        
        result = pd.DataFrame({
            'forecast': forecast.predicted_mean,
            'lower': conf_int.iloc[:, 0],
            'upper': conf_int.iloc[:, 1]
        })
        return result
    
    def diagnose(self):
        """模型诊断"""
        if self.fitted_model is None:
            raise ValueError("请先训练模型")
        fig = self.fitted_model.plot_diagnostics(figsize=(14, 10))
        plt.tight_layout()
        plt.show()

# 完整示例
def arima_forecast_example():
    # 创建示例数据
    np.random.seed(42)
    dates = pd.date_range(start='2020-01-01', periods=500, freq='D')
    trend = np.linspace(100, 150, 500)
    noise = np.random.randn(500) * 5
    data = trend + noise
    
    ts = pd.Series(data, index=dates)
    
    # 划分训练集和测试集
    train_size = int(len(ts) * 0.8)
    train, test = ts[:train_size], ts[train_size:]
    
    print(f"训练集大小: {len(train)}")
    print(f"测试集大小: {len(test)}")
    
    # 训练模型
    forecaster = ARIMAForecaster(order=(2, 1, 2))
    forecaster.fit(train)
    
    # 预测
    predictions = forecaster.predict(steps=len(test))
    conf_interval = forecaster.get_confidence_interval(steps=len(test))
    
    # 评估
    rmse = np.sqrt(mean_squared_error(test, predictions))
    mae = mean_absolute_error(test, predictions)
    mape = np.mean(np.abs((test.values - predictions.values) / test.values)) * 100
    
    print(f"\n评估指标:")
    print(f"RMSE: {rmse:.4f}")
    print(f"MAE: {mae:.4f}")
    print(f"MAPE: {mape:.2f}%")
    
    # 可视化
    plt.figure(figsize=(14, 6))
    plt.plot(train.index, train, label='训练数据', color='blue')
    plt.plot(test.index, test, label='测试数据', color='green')
    plt.plot(test.index, predictions, label='预测值', color='red', linestyle='--')
    plt.fill_between(test.index,
                     conf_interval['lower'],
                     conf_interval['upper'],
                     color='red', alpha=0.2, label='95%置信区间')
    plt.legend()
    plt.title('ARIMA预测结果')
    plt.xlabel('日期')
    plt.ylabel('值')
    plt.show()
    
    return forecaster

forecaster = arima_forecast_example()
```

### SARIMA（季节性ARIMA）

当数据存在明显的季节性时，使用SARIMA模型更为合适。

```python
from statsmodels.tsa.statespace.sarimax import SARIMAX

class SARIMAForecaster:
    """SARIMA时间序列预测器"""
    
    def __init__(self, order=(1, 1, 1), seasonal_order=(1, 1, 1, 12)):
        self.order = order
        self.seasonal_order = seasonal_order
        self.model = None
        self.fitted_model = None
    
    def fit(self, train_data):
        """训练SARIMA模型"""
        self.model = SARIMAX(
            train_data,
            order=self.order,
            seasonal_order=self.seasonal_order,
            enforce_stationarity=False,
            enforce_invertibility=False
        )
        self.fitted_model = self.model.fit(disp=False)
        
        print("SARIMA模型训练完成")
        print(f"AIC: {self.fitted_model.aic:.2f}")
        print(f"BIC: {self.fitted_model.bic:.2f}")
        return self
    
    def predict(self, steps):
        """进行预测"""
        return self.fitted_model.forecast(steps=steps)
    
    def get_forecast_df(self, steps, alpha=0.05):
        """获取预测结果DataFrame"""
        forecast = self.fitted_model.get_forecast(steps=steps)
        conf_int = forecast.conf_int(alpha=alpha)
        
        return pd.DataFrame({
            'forecast': forecast.predicted_mean,
            'lower': conf_int.iloc[:, 0],
            'upper': conf_int.iloc[:, 1]
        })

# 使用示例
def sarima_example():
    # 创建带季节性的数据
    np.random.seed(42)
    n_years = 5
    dates = pd.date_range(start='2019-01-01', periods=n_years*12, freq='MS')
    
    # 趋势 + 年度季节性 + 噪声
    trend = np.linspace(100, 150, len(dates))
    seasonality = 20 * np.sin(2 * np.pi * np.arange(len(dates)) / 12)
    noise = np.random.randn(len(dates)) * 5
    
    data = trend + seasonality + noise
    ts = pd.Series(data, index=dates)
    
    # 划分数据
    train = ts[:-12]  # 保留最后一年作为测试
    test = ts[-12:]
    
    # 训练SARIMA模型
    forecaster = SARIMAForecaster(
        order=(1, 1, 1),
        seasonal_order=(1, 1, 1, 12)
    )
    forecaster.fit(train)
    
    # 预测
    forecast_df = forecaster.get_forecast_df(steps=12)
    
    # 可视化
    plt.figure(figsize=(14, 6))
    plt.plot(train.index, train, label='训练数据')
    plt.plot(test.index, test, label='测试数据', color='green')
    plt.plot(test.index, forecast_df['forecast'], label='预测', color='red', linestyle='--')
    plt.fill_between(test.index,
                     forecast_df['lower'],
                     forecast_df['upper'],
                     color='red', alpha=0.2)
    plt.legend()
    plt.title('SARIMA预测结果')
    plt.show()
    
    return forecaster

sarima_model = sarima_example()
```

---

## Prophet预测框架

### Prophet简介

Prophet是Facebook开源的时间序列预测工具，特别适合处理具有以下特点的业务时间序列：
- 强烈的季节性效应
- 多个季节性周期
- 已知的特殊事件或假期
- 趋势变化点
- 数据缺失或异常值

### Prophet模型原理

Prophet采用加法分解模型：

$$y(t) = g(t) + s(t) + h(t) + \epsilon_t$$

其中：
- g(t)：趋势函数（线性或逻辑增长）
- s(t)：季节性成分（傅里叶级数）
- h(t)：假期效应
- epsilon_t：误差项

```python
from prophet import Prophet
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

class ProphetForecaster:
    """Prophet时间序列预测器"""
    
    def __init__(self, yearly_seasonality=True, weekly_seasonality=True,
                 daily_seasonality=False, holidays=None):
        self.model = Prophet(
            yearly_seasonality=yearly_seasonality,
            weekly_seasonality=weekly_seasonality,
            daily_seasonality=daily_seasonality,
            holidays=holidays
        )
        self.forecast = None
    
    def add_custom_seasonality(self, name, period, fourier_order):
        """添加自定义季节性"""
        self.model.add_seasonality(
            name=name,
            period=period,
            fourier_order=fourier_order
        )
        return self
    
    def add_regressor(self, name):
        """添加外部回归变量"""
        self.model.add_regressor(name)
        return self
    
    def fit(self, df):
        """训练模型（df必须包含 'ds' 和 'y' 列）"""
        self.model.fit(df)
        print("Prophet模型训练完成")
        return self
    
    def predict(self, periods, freq='D', include_history=True):
        """进行预测"""
        future = self.model.make_future_dataframe(periods=periods, freq=freq,
                                                   include_history=include_history)
        self.forecast = self.model.predict(future)
        return self.forecast
    
    def plot_forecast(self, figsize=(14, 6)):
        """绘制预测结果"""
        if self.forecast is None:
            raise ValueError("请先进行预测")
        fig = self.model.plot(self.forecast, figsize=figsize)
        plt.title('Prophet预测结果')
        plt.show()
        return fig
    
    def plot_components(self, figsize=(14, 10)):
        """绘制成分分解图"""
        if self.forecast is None:
            raise ValueError("请先进行预测")
        fig = self.model.plot_components(self.forecast, figsize=figsize)
        plt.show()
        return fig
    
    def cross_validate(self, initial, period, horizon):
        """时间序列交叉验证"""
        from prophet.diagnostics import cross_validation, performance_metrics
        
        df_cv = cross_validation(self.model, initial=initial,
                                  period=period, horizon=horizon)
        df_metrics = performance_metrics(df_cv)
        
        print("交叉验证评估指标:")
        print(df_metrics[['horizon', 'mse', 'rmse', 'mae', 'mape']].to_string())
        
        return df_cv, df_metrics

# 完整示例
def prophet_example():
    # 创建示例数据
    np.random.seed(42)
    dates = pd.date_range(start='2020-01-01', end='2023-12-31', freq='D')
    
    # 趋势 + 年度季节性 + 周季节性 + 噪声
    n = len(dates)
    trend = np.linspace(100, 200, n)
    yearly_seasonality = 30 * np.sin(2 * np.pi * np.arange(n) / 365.25)
    weekly_seasonality = 10 * np.sin(2 * np.pi * np.arange(n) / 7)
    noise = np.random.randn(n) * 10
    
    values = trend + yearly_seasonality + weekly_seasonality + noise
    
    # Prophet要求的数据格式
    df = pd.DataFrame({
        'ds': dates,
        'y': values
    })
    
    print(f"数据范围: {df['ds'].min()} 到 {df['ds'].max()}")
    print(f"数据点数: {len(df)}")
    
    # 划分训练集和测试集
    train_df = df[df['ds'] < '2023-10-01']
    test_df = df[df['ds'] >= '2023-10-01']
    
    # 创建假期DataFrame（示例）
    holidays = pd.DataFrame({
        'holiday': 'special_event',
        'ds': pd.to_datetime(['2020-07-04', '2021-07-04', '2022-07-04', '2023-07-04']),
        'lower_window': 0,
        'upper_window': 1,
    })
    
    # 训练Prophet模型
    forecaster = ProphetForecaster(
        yearly_seasonality=True,
        weekly_seasonality=True,
        holidays=holidays
    )
    
    # 添加自定义季节性（如月度季节性）
    forecaster.add_custom_seasonality('monthly', period=30.5, fourier_order=5)
    
    # 训练
    forecaster.fit(train_df)
    
    # 预测
    forecast = forecaster.predict(periods=len(test_df))
    
    # 可视化
    forecaster.plot_forecast()
    forecaster.plot_components()
    
    # 评估
    predictions = forecast[forecast['ds'].isin(test_df['ds'])]['yhat'].values
    actuals = test_df['y'].values
    
    rmse = np.sqrt(np.mean((predictions - actuals) ** 2))
    mae = np.mean(np.abs(predictions - actuals))
    mape = np.mean(np.abs((actuals - predictions) / actuals)) * 100
    
    print(f"\n评估指标:")
    print(f"RMSE: {rmse:.4f}")
    print(f"MAE: {mae:.4f}")
    print(f"MAPE: {mape:.2f}%")
    
    return forecaster

prophet_model = prophet_example()
```

---

## LSTM时序预测

### LSTM原理回顾

LSTM（Long Short-Term Memory）是一种特殊的RNN结构，通过门控机制解决了传统RNN的梯度消失问题，特别适合学习时间序列中的长期依赖关系。

### 数据预处理

```python
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
import torch
from torch.utils.data import Dataset, DataLoader

class TimeSeriesDataset(Dataset):
    """时间序列数据集"""
    
    def __init__(self, data, seq_length, pred_length=1):
        self.data = data
        self.seq_length = seq_length
        self.pred_length = pred_length
    
    def __len__(self):
        return len(self.data) - self.seq_length - self.pred_length + 1
    
    def __getitem__(self, idx):
        x = self.data[idx:idx + self.seq_length]
        y = self.data[idx + self.seq_length:idx + self.seq_length + self.pred_length]
        return torch.FloatTensor(x), torch.FloatTensor(y)

def prepare_data(df, target_col, seq_length=60, pred_length=1,
                 train_ratio=0.8, val_ratio=0.1):
    """准备时间序列数据"""
    # 提取目标列
    data = df[target_col].values.reshape(-1, 1)
    
    # 归一化
    scaler = MinMaxScaler(feature_range=(0, 1))
    data_scaled = scaler.fit_transform(data)
    
    # 划分数据集
    n = len(data_scaled)
    train_end = int(n * train_ratio)
    val_end = int(n * (train_ratio + val_ratio))
    
    train_data = data_scaled[:train_end]
    val_data = data_scaled[train_end:val_end]
    test_data = data_scaled[val_end:]
    
    # 创建数据集
    train_dataset = TimeSeriesDataset(train_data, seq_length, pred_length)
    val_dataset = TimeSeriesDataset(val_data, seq_length, pred_length)
    test_dataset = TimeSeriesDataset(test_data, seq_length, pred_length)
    
    # 创建数据加载器
    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False)
    test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False)
    
    print(f"训练集大小: {len(train_dataset)}")
    print(f"验证集大小: {len(val_dataset)}")
    print(f"测试集大小: {len(test_dataset)}")
    
    return train_loader, val_loader, test_loader, scaler

# 创建滑动窗口数据的另一种方法
def create_sequences(data, seq_length):
    """创建滑动窗口序列"""
    X, y = [], []
    for i in range(len(data) - seq_length):
        X.append(data[i:i + seq_length])
        y.append(data[i + seq_length])
    return np.array(X), np.array(y)
```

### LSTM模型实现

```python
import torch
import torch.nn as nn

class LSTMModel(nn.Module):
    """LSTM时间序列预测模型"""
    
    def __init__(self, input_size=1, hidden_size=64, num_layers=2,
                 output_size=1, dropout=0.2):
        super(LSTMModel, self).__init__()
        
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        # LSTM层
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0,
            bidirectional=False
        )
        
        # 全连接层
        self.fc = nn.Sequential(
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_size // 2, output_size)
        )
    
    def forward(self, x):
        # LSTM前向传播
        lstm_out, (h_n, c_n) = self.lstm(x)
        
        # 使用最后一个时间步的输出
        last_output = lstm_out[:, -1, :]
        
        # 全连接层
        output = self.fc(last_output)
        return output

class BiLSTMModel(nn.Module):
    """双向LSTM时间序列预测模型"""
    
    def __init__(self, input_size=1, hidden_size=64, num_layers=2,
                 output_size=1, dropout=0.2):
        super(BiLSTMModel, self).__init__()
        
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0,
            bidirectional=True
        )
        
        # 双向LSTM输出维度是hidden_size * 2
        self.fc = nn.Sequential(
            nn.Linear(hidden_size * 2, hidden_size),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_size, output_size)
        )
    
    def forward(self, x):
        lstm_out, _ = self.lstm(x)
        last_output = lstm_out[:, -1, :]
        output = self.fc(last_output)
        return output

class LSTMAttention(nn.Module):
    """带注意力机制的LSTM模型"""
    
    def __init__(self, input_size=1, hidden_size=64, num_layers=2,
                 output_size=1, dropout=0.2):
        super(LSTMAttention, self).__init__()
        
        self.hidden_size = hidden_size
        
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )
        
        # 注意力层
        self.attention = nn.Sequential(
            nn.Linear(hidden_size, hidden_size),
            nn.Tanh(),
            nn.Linear(hidden_size, 1)
        )
        
        self.fc = nn.Linear(hidden_size, output_size)
    
    def forward(self, x):
        lstm_out, _ = self.lstm(x)  # (batch, seq_len, hidden_size)
        
        # 计算注意力权重
        attn_weights = self.attention(lstm_out)  # (batch, seq_len, 1)
        attn_weights = torch.softmax(attn_weights, dim=1)
        
        # 加权求和
        context = torch.sum(attn_weights * lstm_out, dim=1)  # (batch, hidden_size)
        
        output = self.fc(context)
        return output
```

### 训练与评估

```python
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import matplotlib.pyplot as plt

class LSTMTrainer:
    """LSTM训练器"""
    
    def __init__(self, model, device='cuda'):
        self.model = model.to(device)
        self.device = device
        self.train_losses = []
        self.val_losses = []
    
    def train_epoch(self, train_loader, criterion, optimizer):
        """训练一个epoch"""
        self.model.train()
        total_loss = 0
        
        for X_batch, y_batch in train_loader:
            X_batch = X_batch.to(self.device)
            y_batch = y_batch.to(self.device)
            
            optimizer.zero_grad()
            predictions = self.model(X_batch)
            loss = criterion(predictions, y_batch.squeeze(-1))
            loss.backward()
            
            # 梯度裁剪
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
            
            optimizer.step()
            total_loss += loss.item()
        
        return total_loss / len(train_loader)
    
    @torch.no_grad()
    def validate(self, data_loader, criterion):
        """评估模型"""
        self.model.eval()
        total_loss = 0
        
        for X_batch, y_batch in data_loader:
            X_batch = X_batch.to(self.device)
            y_batch = y_batch.to(self.device)
            
            predictions = self.model(X_batch)
            loss = criterion(predictions, y_batch.squeeze(-1))
            total_loss += loss.item()
        
        return total_loss / len(data_loader)
    
    def train(self, train_loader, val_loader, epochs=100, lr=0.001,
              patience=10, save_path='best_lstm_model.pt'):
        """完整训练流程"""
        criterion = nn.MSELoss()
        optimizer = optim.Adam(self.model.parameters(), lr=lr)
        scheduler = optim.lr_scheduler.ReduceLROnPlateau(
            optimizer, mode='min', factor=0.5, patience=5, verbose=True
        )
        
        best_val_loss = float('inf')
        patience_counter = 0
        
        for epoch in range(epochs):
            train_loss = self.train_epoch(train_loader, criterion, optimizer)
            val_loss = self.validate(val_loader, criterion)
            
            self.train_losses.append(train_loss)
            self.val_losses.append(val_loss)
            
            scheduler.step(val_loss)
            
            if (epoch + 1) % 10 == 0:
                print(f'Epoch [{epoch+1}/{epochs}], '
                      f'Train Loss: {train_loss:.6f}, '
                      f'Val Loss: {val_loss:.6f}')
            
            # 保存最佳模型
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                torch.save(self.model.state_dict(), save_path)
                patience_counter = 0
            else:
                patience_counter += 1
            
            # 早停
            if patience_counter >= patience:
                print(f'Early stopping at epoch {epoch + 1}')
                break
        
        # 加载最佳模型
        self.model.load_state_dict(torch.load(save_path))
        print(f'Training completed. Best val loss: {best_val_loss:.6f}')
    
    def plot_losses(self):
        """绘制损失曲线"""
        plt.figure(figsize=(10, 6))
        plt.plot(self.train_losses, label='Train Loss')
        plt.plot(self.val_losses, label='Val Loss')
        plt.xlabel('Epoch')
        plt.ylabel('Loss')
        plt.title('Training and Validation Loss')
        plt.legend()
        plt.show()
    
    @torch.no_grad()
    def predict(self, data_loader, scaler=None):
        """进行预测"""
        self.model.eval()
        predictions = []
        actuals = []
        
        for X_batch, y_batch in data_loader:
            X_batch = X_batch.to(self.device)
            preds = self.model(X_batch)
            
            predictions.extend(preds.cpu().numpy())
            actuals.extend(y_batch.numpy())
        
        predictions = np.array(predictions)
        actuals = np.array(actuals)
        
        if scaler is not None:
            predictions = scaler.inverse_transform(predictions.reshape(-1, 1))
            actuals = scaler.inverse_transform(actuals.reshape(-1, 1))
        
        return predictions.flatten(), actuals.flatten()

# 完整示例
def lstm_forecast_example():
    # 设置随机种子
    torch.manual_seed(42)
    np.random.seed(42)
    
    # 创建示例数据
    dates = pd.date_range(start='2020-01-01', periods=1000, freq='D')
    trend = np.linspace(100, 200, 1000)
    seasonality = 20 * np.sin(2 * np.pi * np.arange(1000) / 365)
    noise = np.random.randn(1000) * 5
    data = trend + seasonality + noise
    
    df = pd.DataFrame({'date': dates, 'value': data})
    df.set_index('date', inplace=True)
    
    # 准备数据
    seq_length = 60
    train_loader, val_loader, test_loader, scaler = prepare_data(
        df, 'value', seq_length=seq_length
    )
    
    # 设置设备
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f'Using device: {device}')
    
    # 创建模型
    model = LSTMModel(
        input_size=1,
        hidden_size=64,
        num_layers=2,
        output_size=1,
        dropout=0.2
    )
    
    # 训练
    trainer = LSTMTrainer(model, device)
    trainer.train(train_loader, val_loader, epochs=100, lr=0.001)
    
    # 绘制损失曲线
    trainer.plot_losses()
    
    # 预测
    predictions, actuals = trainer.predict(test_loader, scaler)
    
    # 评估
    rmse = np.sqrt(np.mean((predictions - actuals) ** 2))
    mae = np.mean(np.abs(predictions - actuals))
    mape = np.mean(np.abs((actuals - predictions) / actuals)) * 100
    
    print(f'\n评估指标:')
    print(f'RMSE: {rmse:.4f}')
    print(f'MAE: {mae:.4f}')
    print(f'MAPE: {mape:.2f}%')
    
    # 可视化预测结果
    plt.figure(figsize=(14, 6))
    plt.plot(actuals, label='实际值', alpha=0.7)
    plt.plot(predictions, label='预测值', alpha=0.7)
    plt.legend()
    plt.title('LSTM预测结果')
    plt.xlabel('时间步')
    plt.ylabel('值')
    plt.show()
    
    return trainer

trainer = lstm_forecast_example()
```

### 多步预测

```python
import torch
import numpy as np

class MultiStepLSTM(nn.Module):
    """多步预测LSTM模型"""
    
    def __init__(self, input_size=1, hidden_size=64, num_layers=2,
                 output_steps=7, dropout=0.2):
        super(MultiStepLSTM, self).__init__()
        
        self.output_steps = output_steps
        
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )
        
        self.fc = nn.Linear(hidden_size, output_steps)
    
    def forward(self, x):
        lstm_out, _ = self.lstm(x)
        last_output = lstm_out[:, -1, :]
        output = self.fc(last_output)
        return output

def recursive_forecast(model, initial_sequence, n_steps, scaler=None, device='cpu'):
    """递归多步预测"""
    model.eval()
    predictions = []
    current_sequence = torch.FloatTensor(initial_sequence).unsqueeze(0).to(device)
    
    with torch.no_grad():
        for _ in range(n_steps):
            # 预测下一步
            pred = model(current_sequence)
            predictions.append(pred.cpu().numpy()[0, 0])
            
            # 更新序列
            new_value = pred.cpu().numpy().reshape(1, 1, 1)
            current_sequence = torch.cat([
                current_sequence[:, 1:, :],
                torch.FloatTensor(new_value).to(device)
            ], dim=1)
    
    predictions = np.array(predictions)
    
    if scaler is not None:
        predictions = scaler.inverse_transform(predictions.reshape(-1, 1)).flatten()
    
    return predictions
```

---

## 模型评估与选择

### 时间序列评估指标

```python
import numpy as np
from sklearn.metrics import mean_squared_error, mean_absolute_error

def calculate_metrics(y_true, y_pred):
    """计算时间序列预测评估指标"""
    # 确保是numpy数组
    y_true = np.array(y_true).flatten()
    y_pred = np.array(y_pred).flatten()
    
    # 移除NaN值
    mask = ~np.isnan(y_true) & ~np.isnan(y_pred)
    y_true = y_true[mask]
    y_pred = y_pred[mask]
    
    # MSE (Mean Squared Error)
    mse = mean_squared_error(y_true, y_pred)
    
    # RMSE (Root Mean Squared Error)
    rmse = np.sqrt(mse)
    
    # MAE (Mean Absolute Error)
    mae = mean_absolute_error(y_true, y_pred)
    
    # MAPE (Mean Absolute Percentage Error)
    non_zero_mask = y_true != 0
    if np.sum(non_zero_mask) > 0:
        mape = np.mean(np.abs((y_true[non_zero_mask] - y_pred[non_zero_mask])
                              / y_true[non_zero_mask])) * 100
    else:
        mape = np.nan
    
    # SMAPE (Symmetric Mean Absolute Percentage Error)
    denominator = (np.abs(y_true) + np.abs(y_pred)) / 2
    non_zero_mask = denominator != 0
    if np.sum(non_zero_mask) > 0:
        smape = np.mean(np.abs(y_true[non_zero_mask] - y_pred[non_zero_mask])
                        / denominator[non_zero_mask]) * 100
    else:
        smape = np.nan
    
    # R-squared
    ss_res = np.sum((y_true - y_pred) ** 2)
    ss_tot = np.sum((y_true - np.mean(y_true)) ** 2)
    r2 = 1 - (ss_res / ss_tot) if ss_tot != 0 else np.nan
    
    metrics = {
        'MSE': mse,
        'RMSE': rmse,
        'MAE': mae,
        'MAPE': mape,
        'SMAPE': smape,
        'R2': r2
    }
    
    print("=" * 50)
    print("时间序列预测评估指标")
    print("=" * 50)
    for name, value in metrics.items():
        if np.isnan(value):
            print(f"{name}: N/A")
        else:
            print(f"{name}: {value:.4f}")
    print("=" * 50)
    
    return metrics

# 使用示例
np.random.seed(42)
y_true = np.random.randn(100) * 10 + 100
y_pred = y_true + np.random.randn(100) * 2

metrics = calculate_metrics(y_true, y_pred)
```

### 时间序列交叉验证

```python
import numpy as np
import pandas as pd
from sklearn.model_selection import TimeSeriesSplit

def time_series_cv(model_class, data, n_splits=5, **model_params):
    """时间序列交叉验证"""
    tscv = TimeSeriesSplit(n_splits=n_splits)
    
    scores = {
        'RMSE': [],
        'MAE': [],
        'MAPE': []
    }
    
    for fold, (train_idx, test_idx) in enumerate(tscv.split(data)):
        train_data = data.iloc[train_idx]
        test_data = data.iloc[test_idx]
        
        # 训练模型
        model = model_class(**model_params)
        model.fit(train_data)
        
        # 预测
        predictions = model.predict(len(test_data))
        
        # 计算指标
        rmse = np.sqrt(np.mean((test_data.values - predictions) ** 2))
        mae = np.mean(np.abs(test_data.values - predictions))
        mape = np.mean(np.abs((test_data.values - predictions) / test_data.values)) * 100
        
        scores['RMSE'].append(rmse)
        scores['MAE'].append(mae)
        scores['MAPE'].append(mape)
        
        print(f"Fold {fold + 1}: RMSE={rmse:.4f}, MAE={mae:.4f}, MAPE={mape:.2f}%")
    
    print("\n交叉验证汇总:")
    print(f"平均 RMSE: {np.mean(scores['RMSE']):.4f} (+/- {np.std(scores['RMSE']):.4f})")
    print(f"平均 MAE: {np.mean(scores['MAE']):.4f} (+/- {np.std(scores['MAE']):.4f})")
    print(f"平均 MAPE: {np.mean(scores['MAPE']):.2f}% (+/- {np.std(scores['MAPE']):.2f}%)")
    
    return scores
```

---

## 实战案例

### 股票价格预测示例

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import torch
import torch.nn as nn
from sklearn.preprocessing import MinMaxScaler
import warnings
warnings.filterwarnings('ignore')

def calculate_rsi(prices, period=14):
    """计算RSI指标"""
    delta = prices.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def stock_price_prediction_example():
    """股票价格预测完整案例"""
    
    # 1. 生成模拟股票数据
    np.random.seed(42)
    dates = pd.date_range(start='2020-01-01', periods=1000, freq='B')
    
    # 模拟股票价格（几何布朗运动）
    mu = 0.0002  # 日均收益率
    sigma = 0.02  # 波动率
    S0 = 100  # 初始价格
    
    returns = np.random.normal(mu, sigma, len(dates))
    price = S0 * np.exp(np.cumsum(returns))
    
    # 添加成交量
    volume = np.random.randint(1000000, 10000000, len(dates))
    
    df = pd.DataFrame({
        'date': dates,
        'close': price,
        'volume': volume
    })
    df.set_index('date', inplace=True)
    
    print("数据概览:")
    print(df.head())
    print(f"\n数据形状: {df.shape}")
    
    # 2. 特征工程
    df['returns'] = df['close'].pct_change()
    df['ma_5'] = df['close'].rolling(window=5).mean()
    df['ma_20'] = df['close'].rolling(window=20).mean()
    df['volatility'] = df['returns'].rolling(window=20).std()
    df['rsi'] = calculate_rsi(df['close'], 14)
    
    # 移除NaN
    df = df.dropna()
    
    # 3. 数据准备
    features = ['close', 'volume', 'returns', 'ma_5', 'ma_20', 'volatility', 'rsi']
    target = 'close'
    
    # 归一化
    scaler_X = MinMaxScaler()
    scaler_y = MinMaxScaler()
    
    X_scaled = scaler_X.fit_transform(df[features])
    y_scaled = scaler_y.fit_transform(df[[target]])
    
    # 创建序列数据
    seq_length = 60
    X, y = [], []
    for i in range(len(X_scaled) - seq_length):
        X.append(X_scaled[i:i+seq_length])
        y.append(y_scaled[i+seq_length])
    
    X = np.array(X)
    y = np.array(y)
    
    # 划分数据集
    train_size = int(len(X) * 0.8)
    val_size = int(len(X) * 0.1)
    
    X_train, y_train = X[:train_size], y[:train_size]
    X_val, y_val = X[train_size:train_size+val_size], y[train_size:train_size+val_size]
    X_test, y_test = X[train_size+val_size:], y[train_size+val_size:]
    
    print(f"\n训练集: {X_train.shape}")
    print(f"验证集: {X_val.shape}")
    print(f"测试集: {X_test.shape}")
    
    # 4. 转换为PyTorch张量
    X_train_t = torch.FloatTensor(X_train)
    y_train_t = torch.FloatTensor(y_train)
    X_val_t = torch.FloatTensor(X_val)
    y_val_t = torch.FloatTensor(y_val)
    X_test_t = torch.FloatTensor(X_test)
    
    # 5. 定义模型
    class StockLSTM(nn.Module):
        def __init__(self, input_size, hidden_size=128, num_layers=2, dropout=0.2):
            super(StockLSTM, self).__init__()
            self.lstm = nn.LSTM(input_size, hidden_size, num_layers,
                               batch_first=True, dropout=dropout)
            self.fc = nn.Sequential(
                nn.Linear(hidden_size, 64),
                nn.ReLU(),
                nn.Dropout(dropout),
                nn.Linear(64, 1)
            )
        
        def forward(self, x):
            lstm_out, _ = self.lstm(x)
            out = self.fc(lstm_out[:, -1, :])
            return out
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = StockLSTM(input_size=len(features)).to(device)
    
    # 6. 训练
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)
    
    best_val_loss = float('inf')
    train_losses, val_losses = [], []
    
    for epoch in range(100):
        # 训练
        model.train()
        optimizer.zero_grad()
        outputs = model(X_train_t.to(device))
        loss = criterion(outputs, y_train_t.to(device))
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()
        train_losses.append(loss.item())
        
        # 验证
        model.eval()
        with torch.no_grad():
            val_outputs = model(X_val_t.to(device))
            val_loss = criterion(val_outputs, y_val_t.to(device))
            val_losses.append(val_loss.item())
        
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(model.state_dict(), 'best_stock_model.pt')
        
        if (epoch + 1) % 10 == 0:
            print(f'Epoch [{epoch+1}/100], Train Loss: {loss.item():.6f}, Val Loss: {val_loss.item():.6f}')
    
    # 7. 测试
    model.load_state_dict(torch.load('best_stock_model.pt'))
    model.eval()
    
    with torch.no_grad():
        predictions = model(X_test_t.to(device)).cpu().numpy()
    
    # 反归一化
    predictions = scaler_y.inverse_transform(predictions)
    actuals = scaler_y.inverse_transform(y_test)
    
    # 8. 评估
    rmse = np.sqrt(np.mean((predictions - actuals) ** 2))
    mae = np.mean(np.abs(predictions - actuals))
    mape = np.mean(np.abs((actuals - predictions) / actuals)) * 100
    
    print(f'\n测试集评估:')
    print(f'RMSE: {rmse:.4f}')
    print(f'MAE: {mae:.4f}')
    print(f'MAPE: {mape:.2f}%')
    
    # 9. 可视化
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    
    # 损失曲线
    axes[0, 0].plot(train_losses, label='Train Loss')
    axes[0, 0].plot(val_losses, label='Val Loss')
    axes[0, 0].set_title('训练损失曲线')
    axes[0, 0].legend()
    
    # 预测vs实际
    axes[0, 1].plot(actuals, label='实际价格', alpha=0.7)
    axes[0, 1].plot(predictions, label='预测价格', alpha=0.7)
    axes[0, 1].set_title('股票价格预测')
    axes[0, 1].legend()
    
    # 预测误差分布
    errors = predictions.flatten() - actuals.flatten()
    axes[1, 0].hist(errors, bins=50, edgecolor='black')
    axes[1, 0].set_title('预测误差分布')
    axes[1, 0].axvline(x=0, color='r', linestyle='--')
    
    # 散点图
    axes[1, 1].scatter(actuals, predictions, alpha=0.5)
    axes[1, 1].plot([actuals.min(), actuals.max()], [actuals.min(), actuals.max()], 'r--')
    axes[1, 1].set_xlabel('实际价格')
    axes[1, 1].set_ylabel('预测价格')
    axes[1, 1].set_title('预测值 vs 实际值')
    
    plt.tight_layout()
    plt.show()
    
    return model, scaler_X, scaler_y

# 运行示例
model, scaler_X, scaler_y = stock_price_prediction_example()
```

---

## 面试要点

### 常见面试问题

**Q1: 时间序列数据与普通数据有什么区别？**

时间序列数据的主要特点：
- **时序依赖性**：数据点之间存在时间顺序上的依赖关系
- **非独立同分布**：不满足i.i.d.假设
- **自相关性**：当前值与历史值存在相关性
- **趋势和季节性**：可能存在长期趋势和周期性变化
- **数据划分要求**：必须按时间顺序划分，不能随机打乱

**Q2: 什么是平稳性？为什么要检验平稳性？**

平稳性指时间序列的统计特性（均值、方差、自协方差）不随时间变化。

检验平稳性的原因：
- 许多经典模型（如ARIMA）要求数据平稳
- 非平稳数据可能导致虚假回归
- 平稳性是建模和预测的基础假设

检验方法：ADF检验、KPSS检验、PP检验

**Q3: ARIMA模型中p、d、q参数如何选择？**

- d（差分阶数）：通过ADF检验确定使序列平稳所需的差分次数
- p（AR阶数）：观察PACF图，找到截尾点
- q（MA阶数）：观察ACF图，找到截尾点

实际操作中常用auto_arima自动选择。

**Q4: Prophet和ARIMA的主要区别是什么？**

| 特性 | ARIMA | Prophet |
|------|-------|---------|
| 适用场景 | 通用时间序列 | 业务时间序列 |
| 季节性处理 | 需要手动指定SARIMA | 自动处理多重季节性 |
| 假期效应 | 不支持 | 原生支持 |
| 缺失值 | 需要填充 | 自动处理 |
| 可解释性 | 较低 | 成分可解释 |
| 使用难度 | 需要专业知识 | 相对简单 |

**Q5: LSTM如何处理时间序列数据？有什么优势？**

LSTM处理时间序列的方式：
- 使用滑动窗口创建输入序列
- 通过门控机制捕捉长期依赖
- 隐藏状态传递历史信息

优势：
- 能学习复杂的非线性模式
- 处理长期依赖关系
- 不需要数据平稳
- 可以处理多变量输入

**Q6: 时间序列预测中如何避免数据泄露？**

正确的做法：
1. 按时间顺序划分数据
2. 特征工程只在训练集上fit
3. 使用时间序列交叉验证（TimeSeriesSplit）

**Q7: 如何评估时间序列预测模型？**

常用评估指标：
- **RMSE**：对大误差敏感
- **MAE**：直观易解释
- **MAPE**：百分比误差，便于比较
- **SMAPE**：对称MAPE，处理接近零的值

评估方法：
- 时间序列交叉验证
- 滑动窗口验证
- 多步预测评估

### 实战技巧总结

1. **数据预处理**：
   - 处理缺失值和异常值
   - 检验并实现平稳性
   - 合理的特征工程

2. **模型选择**：
   - 简单问题用ARIMA/ETS
   - 业务数据用Prophet
   - 复杂模式用深度学习

3. **训练技巧**：
   - 使用验证集进行早停
   - 合理的学习率调度
   - 梯度裁剪防止梯度爆炸

4. **部署注意**：
   - 模型定期重训练
   - 监控预测性能
   - 设置预警机制

---

## 总结

时间序列分析是数据科学中的重要技能，本文系统介绍了：

1. **基础概念**：时间序列的成分、平稳性、差分等核心概念
2. **经典方法**：ARIMA/SARIMA模型的原理和应用
3. **现代工具**：Prophet框架的使用和高级功能
4. **深度学习**：LSTM等神经网络在时序预测中的应用
5. **工程实践**：模型评估、交叉验证、特征工程等实用技巧

掌握时间序列分析需要理论与实践相结合，建议：

- 深入理解统计学基础（平稳性、自相关）
- 多做项目练习，积累实战经验
- 根据具体场景选择合适的方法
- 持续关注最新技术发展（如Transformer在时序领域的应用）

时间序列预测是一个不断发展的领域，新的方法和技术层出不穷。保持学习的热情，不断提升自己的技能，才能在实际工作中游刃有余。
