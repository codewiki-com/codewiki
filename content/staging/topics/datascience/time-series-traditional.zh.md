---
title: 时间序列分析：传统统计方法
description: 掌握经典时间序列方法：ARIMA、SARIMA、指数平滑和Prophet
track: datascience
section: classical-ml
difficulty: intermediate
tags:
  - 时间序列
  - ARIMA
  - Prophet
  - 预测
status: imported
origin: old/src/content/docs/datascience/time-series-traditional.zh.md
divergence: 0.152
issues: []
legacy:
  category: DataScience
  subcategory: TimeSeries
  order: 21
  lastUpdated: 2026-01-07
---

时间序列分析是数据科学中最重要的领域之一，广泛应用于金融预测、销售预测、需求规划、气象预报等场景。本文将系统介绍传统时间序列分析方法，从基础概念到实战应用，帮助你掌握这一核心技能。

## 时间序列基础概念

### 什么是时间序列

时间序列（Time Series）是按时间顺序排列的一系列数据点，每个数据点都对应一个特定的时间戳。与普通的横截面数据不同，时间序列数据具有时间依赖性，即当前值可能与历史值存在关联。

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# 创建一个简单的时间序列
dates = pd.date_range('2023-01-01', periods=365, freq='D')
values = np.cumsum(np.random.randn(365)) + 100  # 随机游走

ts = pd.Series(values, index=dates, name='价格')
print(ts.head(10))

# 可视化
plt.figure(figsize=(12, 4))
plt.plot(ts)
plt.title('时间序列示例')
plt.xlabel('日期')
plt.ylabel('价格')
plt.grid(True)
plt.show()
```

### 时间序列的组成成分

一个时间序列通常可以分解为以下四个成分：

| 成分 | 英文 | 描述 | 示例 |
|------|------|------|------|
| 趋势 | Trend | 长期的上升或下降方向 | 经济增长、人口增加 |
| 季节性 | Seasonality | 固定周期的重复模式 | 夏季用电高峰、节假日销售 |
| 周期性 | Cyclical | 非固定周期的波动 | 经济周期、行业周期 |
| 残差 | Residual | 随机噪声 | 不可预测的随机波动 |

```python
from statsmodels.tsa.seasonal import seasonal_decompose

# 创建带有趋势和季节性的数据
np.random.seed(42)
n = 365 * 2
dates = pd.date_range('2022-01-01', periods=n, freq='D')

# 趋势成分
trend = np.linspace(100, 150, n)
# 季节性成分（周期为365天）
seasonal = 20 * np.sin(2 * np.pi * np.arange(n) / 365)
# 随机噪声
noise = np.random.normal(0, 5, n)

ts = pd.Series(trend + seasonal + noise, index=dates)

# 时间序列分解
decomposition = seasonal_decompose(ts, model='additive', period=365)

fig, axes = plt.subplots(4, 1, figsize=(12, 10))
decomposition.observed.plot(ax=axes[0], title='原始序列')
decomposition.trend.plot(ax=axes[1], title='趋势成分')
decomposition.seasonal.plot(ax=axes[2], title='季节性成分')
decomposition.resid.plot(ax=axes[3], title='残差成分')
plt.tight_layout()
plt.show()
```

### 加法模型与乘法模型

时间序列分解有两种主要模型：

**加法模型**：$Y_t = T_t + S_t + C_t + R_t$
- 适用于季节性波动幅度恒定的情况
- 各成分相互独立

**乘法模型**：$Y_t = T_t \times S_t \times C_t \times R_t$
- 适用于季节性波动幅度随趋势变化的情况
- 可以通过对数变换转换为加法模型

```python
# 乘法模型示例
trend_mult = np.linspace(100, 200, n)
seasonal_mult = 1 + 0.2 * np.sin(2 * np.pi * np.arange(n) / 365)
noise_mult = np.random.normal(1, 0.05, n)

ts_mult = pd.Series(trend_mult * seasonal_mult * noise_mult, index=dates)

# 使用乘法模型分解
decomposition_mult = seasonal_decompose(ts_mult, model='multiplicative', period=365)
```

## 平稳性检验

### 什么是平稳性

平稳性（Stationarity）是时间序列分析中最重要的概念之一。一个平稳的时间序列具有以下特征：

- **均值恒定**：序列的均值不随时间变化
- **方差恒定**：序列的方差不随时间变化
- **自协方差只与滞后阶数有关**：不依赖于时间点本身

大多数传统时间序列模型（如 ARIMA）都要求数据是平稳的。

### ADF 检验（Augmented Dickey-Fuller Test）

ADF 检验是最常用的平稳性检验方法，用于检测时间序列中是否存在单位根。

**假设检验**：
- $H_0$（原假设）：存在单位根，序列非平稳
- $H_1$（备择假设）：不存在单位根，序列平稳

**判断标准**：
- p-value < 0.05：拒绝原假设，序列平稳
- p-value >= 0.05：无法拒绝原假设，序列可能非平稳

```python
from statsmodels.tsa.stattools import adfuller

def adf_test(series, title=''):
    """
    执行 ADF 检验并打印结果
    """
    result = adfuller(series.dropna(), autolag='AIC')

    print(f'=== ADF 检验结果：{title} ===')
    print(f'ADF 统计量: {result[0]:.4f}')
    print(f'p-value: {result[1]:.4f}')
    print(f'使用的滞后阶数: {result[2]}')
    print(f'观测数量: {result[3]}')
    print('临界值:')
    for key, value in result[4].items():
        print(f'  {key}: {value:.4f}')

    if result[1] < 0.05:
        print('\n结论: p-value < 0.05，拒绝原假设，序列是平稳的')
    else:
        print('\n结论: p-value >= 0.05，无法拒绝原假设，序列可能非平稳')

    return result[1] < 0.05

# 示例：非平稳序列（随机游走）
np.random.seed(42)
random_walk = np.cumsum(np.random.randn(500))
ts_nonstationary = pd.Series(random_walk)
adf_test(ts_nonstationary, '随机游走序列')

print('\n')

# 示例：平稳序列（白噪声）
white_noise = np.random.randn(500)
ts_stationary = pd.Series(white_noise)
adf_test(ts_stationary, '白噪声序列')
```

### KPSS 检验

KPSS（Kwiatkowski-Phillips-Schmidt-Shin）检验是另一种平稳性检验，其假设与 ADF 相反：

- $H_0$（原假设）：序列平稳
- $H_1$（备择假设）：序列非平稳

建议同时使用 ADF 和 KPSS 检验进行交叉验证。

```python
from statsmodels.tsa.stattools import kpss

def kpss_test(series, title=''):
    """
    执行 KPSS 检验并打印结果
    """
    result = kpss(series.dropna(), regression='c')

    print(f'=== KPSS 检验结果：{title} ===')
    print(f'KPSS 统计量: {result[0]:.4f}')
    print(f'p-value: {result[1]:.4f}')
    print(f'使用的滞后阶数: {result[2]}')
    print('临界值:')
    for key, value in result[3].items():
        print(f'  {key}: {value:.4f}')

    if result[1] < 0.05:
        print('\n结论: p-value < 0.05，拒绝原假设，序列非平稳')
    else:
        print('\n结论: p-value >= 0.05，无法拒绝原假设，序列可能平稳')

    return result[1] >= 0.05

# 综合判断函数
def stationarity_test(series, title=''):
    """
    综合 ADF 和 KPSS 检验判断平稳性
    """
    adf_stationary = adf_test(series, title)
    print()
    kpss_stationary = kpss_test(series, title)

    print(f'\n=== 综合判断 ===')
    if adf_stationary and kpss_stationary:
        print('结论：序列是平稳的')
        return 'stationary'
    elif not adf_stationary and not kpss_stationary:
        print('结论：序列是非平稳的')
        return 'non-stationary'
    elif adf_stationary and not kpss_stationary:
        print('结论：序列是差分平稳的（趋势平稳）')
        return 'trend-stationary'
    else:
        print('结论：序列是差分平稳的（含单位根）')
        return 'difference-stationary'
```

### 差分使序列平稳

对于非平稳序列，可以通过差分操作使其平稳：

```python
# 一阶差分
def make_stationary(series, max_diff=3):
    """
    通过差分使序列平稳
    """
    diff_series = series.copy()
    diff_order = 0

    for i in range(max_diff):
        result = adfuller(diff_series.dropna())
        if result[1] < 0.05:
            print(f'{i}阶差分后序列平稳，p-value = {result[1]:.4f}')
            break
        else:
            diff_series = diff_series.diff()
            diff_order += 1
            print(f'{i}阶差分后 p-value = {result[1]:.4f}，继续差分...')

    return diff_series.dropna(), diff_order

# 示例
ts_diff, d = make_stationary(ts_nonstationary)

# 可视化差分前后对比
fig, axes = plt.subplots(2, 1, figsize=(12, 6))
axes[0].plot(ts_nonstationary)
axes[0].set_title('原始序列（非平稳）')
axes[1].plot(ts_diff)
axes[1].set_title(f'{d}阶差分后（平稳）')
plt.tight_layout()
plt.show()
```

## 自相关与偏自相关

### 自相关函数（ACF）

自相关函数（Autocorrelation Function）衡量时间序列与其滞后版本之间的相关性。

$$\rho_k = \frac{Cov(Y_t, Y_{t-k})}{Var(Y_t)}$$

其中 $k$ 是滞后阶数。

```python
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf
from statsmodels.tsa.stattools import acf, pacf

# 计算并绘制 ACF
def plot_acf_pacf(series, lags=40, title=''):
    """
    绘制 ACF 和 PACF 图
    """
    fig, axes = plt.subplots(1, 2, figsize=(14, 4))

    # ACF
    plot_acf(series, lags=lags, ax=axes[0], alpha=0.05)
    axes[0].set_title(f'自相关函数 (ACF) - {title}')

    # PACF
    plot_pacf(series, lags=lags, ax=axes[1], alpha=0.05, method='ywm')
    axes[1].set_title(f'偏自相关函数 (PACF) - {title}')

    plt.tight_layout()
    plt.show()

# 示例：AR(1) 过程
np.random.seed(42)
n = 500
ar1 = [0]
for i in range(1, n):
    ar1.append(0.7 * ar1[i-1] + np.random.randn())

ar1_series = pd.Series(ar1)
plot_acf_pacf(ar1_series, title='AR(1) 过程')
```

### 偏自相关函数（PACF）

偏自相关函数（Partial Autocorrelation Function）衡量在控制中间滞后项影响后，时间序列与其滞后版本之间的相关性。

### ACF/PACF 模式识别

ACF 和 PACF 的模式可以帮助识别时间序列的类型：

| 模型 | ACF 特征 | PACF 特征 |
|------|----------|-----------|
| AR(p) | 指数衰减或振荡衰减 | 在滞后 p 处截尾 |
| MA(q) | 在滞后 q 处截尾 | 指数衰减或振荡衰减 |
| ARMA(p,q) | 指数衰减 | 指数衰减 |
| 随机游走 | 缓慢衰减 | 滞后1处显著，其余为0 |

```python
# MA(2) 过程示例
np.random.seed(42)
n = 500
noise = np.random.randn(n)
ma2 = [0, 0]
for i in range(2, n):
    ma2.append(noise[i] + 0.6 * noise[i-1] + 0.3 * noise[i-2])

ma2_series = pd.Series(ma2)
plot_acf_pacf(ma2_series, title='MA(2) 过程')

# ARMA(1,1) 过程示例
np.random.seed(42)
from statsmodels.tsa.arima_process import ArmaProcess

ar_params = [1, -0.7]  # AR(1) 系数
ma_params = [1, 0.5]    # MA(1) 系数
arma_process = ArmaProcess(ar_params, ma_params)
arma_series = pd.Series(arma_process.generate_sample(nsample=500))
plot_acf_pacf(arma_series, title='ARMA(1,1) 过程')
```

## ARIMA 模型

### ARIMA 模型概述

ARIMA（AutoRegressive Integrated Moving Average）是最经典的时间序列预测模型，由三个部分组成：

- **AR(p)**：自回归部分，使用过去 p 个时间点的值进行预测
- **I(d)**：差分部分，对序列进行 d 阶差分使其平稳
- **MA(q)**：移动平均部分，使用过去 q 个预测误差进行修正

ARIMA(p,d,q) 模型的数学表达式：

$$\phi(B)(1-B)^d Y_t = \theta(B)\varepsilon_t$$

其中：
- $B$ 是滞后算子
- $\phi(B) = 1 - \phi_1 B - \phi_2 B^2 - ... - \phi_p B^p$
- $\theta(B) = 1 + \theta_1 B + \theta_2 B^2 + ... + \theta_q B^q$
- $\varepsilon_t$ 是白噪声

### 模型参数选择

选择 ARIMA 模型的参数 (p, d, q) 有以下方法：

**方法一：ACF/PACF 图分析**

```python
def determine_arima_order(series, max_d=2):
    """
    通过 ACF/PACF 分析确定 ARIMA 阶数
    """
    # 1. 确定 d（差分阶数）
    diff_series = series.copy()
    d = 0
    for i in range(max_d + 1):
        result = adfuller(diff_series.dropna())
        if result[1] < 0.05:
            print(f'd = {i}: 序列平稳 (p-value = {result[1]:.4f})')
            d = i
            break
        else:
            print(f'd = {i}: 序列非平稳 (p-value = {result[1]:.4f})')
            diff_series = diff_series.diff()

    # 2. 绘制 ACF/PACF 确定 p 和 q
    print(f'\n建议差分阶数 d = {d}')
    print('请根据以下 ACF/PACF 图确定 p 和 q：')
    plot_acf_pacf(diff_series.dropna(), title=f'{d}阶差分后')

    return d
```

**方法二：信息准则自动选择（AIC/BIC）**

```python
from statsmodels.tsa.arima.model import ARIMA
import warnings
warnings.filterwarnings('ignore')

def auto_arima_grid_search(series, max_p=5, max_d=2, max_q=5):
    """
    网格搜索最优 ARIMA 参数
    """
    best_aic = float('inf')
    best_order = None
    results = []

    for p in range(max_p + 1):
        for d in range(max_d + 1):
            for q in range(max_q + 1):
                try:
                    model = ARIMA(series, order=(p, d, q))
                    fitted = model.fit()
                    aic = fitted.aic
                    bic = fitted.bic

                    results.append({
                        'order': (p, d, q),
                        'AIC': aic,
                        'BIC': bic
                    })

                    if aic < best_aic:
                        best_aic = aic
                        best_order = (p, d, q)

                except Exception as e:
                    continue

    results_df = pd.DataFrame(results).sort_values('AIC')
    print('Top 5 模型（按 AIC 排序）：')
    print(results_df.head())
    print(f'\n最优模型: ARIMA{best_order}')

    return best_order, results_df
```

**方法三：使用 pmdarima 自动选择**

```python
# pip install pmdarima
from pmdarima import auto_arima

def auto_select_arima(series, seasonal=False, m=1):
    """
    使用 pmdarima 自动选择 ARIMA 参数
    """
    model = auto_arima(
        series,
        start_p=0, start_q=0,
        max_p=5, max_q=5,
        d=None,  # 自动确定
        seasonal=seasonal,
        m=m,  # 季节周期
        trace=True,
        error_action='ignore',
        suppress_warnings=True,
        stepwise=True
    )

    print(f'\n最优模型: {model.summary()}')
    return model

# 使用示例
# best_model = auto_select_arima(ts_data)
```

### ARIMA 模型拟合与预测

```python
from statsmodels.tsa.arima.model import ARIMA

def fit_arima_model(series, order, forecast_steps=30):
    """
    拟合 ARIMA 模型并进行预测
    """
    # 拟合模型
    model = ARIMA(series, order=order)
    fitted = model.fit()

    # 打印模型摘要
    print(fitted.summary())

    # 模型诊断
    print('\n=== 模型诊断 ===')
    residuals = fitted.resid
    print(f'残差均值: {residuals.mean():.4f}')
    print(f'残差标准差: {residuals.std():.4f}')

    # 残差 ADF 检验
    adf_result = adfuller(residuals.dropna())
    print(f'残差 ADF p-value: {adf_result[1]:.4f}')

    # 进行预测
    forecast = fitted.get_forecast(steps=forecast_steps)
    forecast_mean = forecast.predicted_mean
    forecast_ci = forecast.conf_int()

    return fitted, forecast_mean, forecast_ci

# 完整示例
np.random.seed(42)

# 生成 ARIMA(1,1,1) 过程
n = 200
series = pd.Series([100])
for i in range(1, n):
    diff = 0.5 * (series[i-1] - series[i-2] if i > 1 else 0) + np.random.randn()
    series = pd.concat([series, pd.Series([series[i-1] + diff])])

series.index = pd.date_range('2022-01-01', periods=n, freq='D')

# 拟合模型
fitted, forecast_mean, forecast_ci = fit_arima_model(series, order=(1, 1, 1))

# 可视化
plt.figure(figsize=(12, 5))
plt.plot(series, label='历史数据')
plt.plot(forecast_mean.index, forecast_mean, 'r--', label='预测')
plt.fill_between(forecast_ci.index,
                 forecast_ci.iloc[:, 0],
                 forecast_ci.iloc[:, 1],
                 color='red', alpha=0.2, label='95% 置信区间')
plt.legend()
plt.title('ARIMA 模型预测')
plt.xlabel('日期')
plt.ylabel('值')
plt.grid(True)
plt.show()
```

### 模型诊断

```python
from statsmodels.stats.diagnostic import acorr_ljungbox
from scipy import stats

def diagnose_arima(fitted_model, series):
    """
    ARIMA 模型诊断
    """
    residuals = fitted_model.resid

    fig, axes = plt.subplots(2, 2, figsize=(12, 8))

    # 1. 残差时序图
    axes[0, 0].plot(residuals)
    axes[0, 0].axhline(y=0, color='r', linestyle='--')
    axes[0, 0].set_title('残差时序图')

    # 2. 残差直方图（检验正态性）
    axes[0, 1].hist(residuals, bins=30, density=True, alpha=0.7)
    x = np.linspace(residuals.min(), residuals.max(), 100)
    axes[0, 1].plot(x, stats.norm.pdf(x, residuals.mean(), residuals.std()), 'r-')
    axes[0, 1].set_title('残差分布（与正态分布对比）')

    # 3. 残差 ACF
    plot_acf(residuals, ax=axes[1, 0], lags=20)
    axes[1, 0].set_title('残差 ACF')

    # 4. QQ 图
    stats.probplot(residuals, dist="norm", plot=axes[1, 1])
    axes[1, 1].set_title('残差 Q-Q 图')

    plt.tight_layout()
    plt.show()

    # Ljung-Box 检验（检验残差是否为白噪声）
    lb_test = acorr_ljungbox(residuals, lags=[10, 20, 30], return_df=True)
    print('\n=== Ljung-Box 检验 ===')
    print(lb_test)

    if all(lb_test['lb_pvalue'] > 0.05):
        print('\n结论: 所有滞后阶数的 p-value > 0.05，残差为白噪声，模型拟合良好')
    else:
        print('\n结论: 存在显著自相关，模型可能需要改进')

    # 正态性检验
    _, p_value = stats.shapiro(residuals[:min(len(residuals), 5000)])
    print(f'\n=== Shapiro-Wilk 正态性检验 ===')
    print(f'p-value: {p_value:.4f}')
    if p_value > 0.05:
        print('结论: 残差服从正态分布')
    else:
        print('结论: 残差不服从正态分布')
```

## 季节性 SARIMA 模型

### SARIMA 模型概述

SARIMA（Seasonal ARIMA）是 ARIMA 的扩展，专门处理具有季节性模式的时间序列。

SARIMA(p,d,q)(P,D,Q,m) 包含：
- 非季节性部分：(p, d, q)
- 季节性部分：(P, D, Q, m)，其中 m 是季节周期

```python
from statsmodels.tsa.statespace.sarimax import SARIMAX

# 创建带有季节性的数据
np.random.seed(42)
n = 365 * 3  # 3年日数据
dates = pd.date_range('2021-01-01', periods=n, freq='D')

# 趋势
trend = np.linspace(100, 130, n)
# 年度季节性（周期365）
yearly_seasonal = 20 * np.sin(2 * np.pi * np.arange(n) / 365)
# 周季节性（周期7）
weekly_seasonal = 5 * np.sin(2 * np.pi * np.arange(n) / 7)
# 噪声
noise = np.random.normal(0, 3, n)

seasonal_ts = pd.Series(trend + yearly_seasonal + weekly_seasonal + noise, index=dates)

# 可视化
fig, axes = plt.subplots(3, 1, figsize=(12, 8))
axes[0].plot(seasonal_ts)
axes[0].set_title('完整序列')
axes[1].plot(seasonal_ts['2023-01':'2023-03'])
axes[1].set_title('2023年Q1放大（显示周季节性）')
axes[2].plot(seasonal_ts.resample('M').mean())
axes[2].set_title('月均值（显示年度季节性）')
plt.tight_layout()
plt.show()
```

### SARIMA 模型拟合

```python
def fit_sarima_model(series, order, seasonal_order, forecast_steps=30):
    """
    拟合 SARIMA 模型并进行预测
    """
    model = SARIMAX(
        series,
        order=order,
        seasonal_order=seasonal_order,
        enforce_stationarity=False,
        enforce_invertibility=False
    )

    fitted = model.fit(disp=False)
    print(fitted.summary())

    # 预测
    forecast = fitted.get_forecast(steps=forecast_steps)
    forecast_mean = forecast.predicted_mean
    forecast_ci = forecast.conf_int()

    return fitted, forecast_mean, forecast_ci

# 使用月度数据示例（周期12）
# 假设有销售数据
np.random.seed(42)
n_months = 60
dates = pd.date_range('2019-01-01', periods=n_months, freq='M')

# 趋势 + 季节性
trend = np.linspace(1000, 1500, n_months)
seasonal = 200 * np.sin(2 * np.pi * np.arange(n_months) / 12)
noise = np.random.normal(0, 50, n_months)

sales = pd.Series(trend + seasonal + noise, index=dates)

# 拟合 SARIMA(1,1,1)(1,1,1,12)
fitted, forecast_mean, forecast_ci = fit_sarima_model(
    sales,
    order=(1, 1, 1),
    seasonal_order=(1, 1, 1, 12),
    forecast_steps=12
)

# 可视化
plt.figure(figsize=(12, 5))
plt.plot(sales, label='历史销售')
plt.plot(forecast_mean.index, forecast_mean, 'r--', label='预测')
plt.fill_between(forecast_ci.index,
                 forecast_ci.iloc[:, 0],
                 forecast_ci.iloc[:, 1],
                 color='red', alpha=0.2, label='95% 置信区间')
plt.legend()
plt.title('SARIMA 季节性销售预测')
plt.xlabel('日期')
plt.ylabel('销售额')
plt.grid(True)
plt.show()
```

### 使用 pmdarima 自动选择 SARIMA 参数

```python
from pmdarima import auto_arima

def auto_sarima(series, m=12):
    """
    自动选择 SARIMA 参数
    """
    model = auto_arima(
        series,
        start_p=0, start_q=0,
        max_p=3, max_q=3,
        start_P=0, start_Q=0,
        max_P=2, max_Q=2,
        m=m,  # 季节周期
        seasonal=True,
        d=None, D=None,  # 自动确定差分阶数
        trace=True,
        error_action='ignore',
        suppress_warnings=True,
        stepwise=True,
        n_jobs=-1
    )

    print(model.summary())
    return model

# 使用示例
# sarima_model = auto_sarima(sales, m=12)
```

## 指数平滑方法

### 简单指数平滑

简单指数平滑（Simple Exponential Smoothing, SES）适用于没有趋势和季节性的序列。

$$\hat{y}_{t+1} = \alpha y_t + (1-\alpha)\hat{y}_t$$

其中 $\alpha$ 是平滑系数（0 < $\alpha$ < 1）。

```python
from statsmodels.tsa.holtwinters import SimpleExpSmoothing

# 创建简单序列
np.random.seed(42)
simple_ts = pd.Series(np.random.normal(100, 10, 100))

# 简单指数平滑
ses_model = SimpleExpSmoothing(simple_ts).fit(smoothing_level=0.2)
ses_forecast = ses_model.forecast(10)

print(f'平滑系数 alpha: {ses_model.params["smoothing_level"]:.4f}')

plt.figure(figsize=(12, 4))
plt.plot(simple_ts, label='原始数据')
plt.plot(ses_model.fittedvalues, label='拟合值')
plt.plot(range(len(simple_ts), len(simple_ts) + 10), ses_forecast, 'r--', label='预测')
plt.legend()
plt.title('简单指数平滑')
plt.show()
```

### Holt 线性趋势法

Holt 方法处理具有趋势但无季节性的序列，包含两个平滑方程：

- 水平方程：$l_t = \alpha y_t + (1-\alpha)(l_{t-1} + b_{t-1})$
- 趋势方程：$b_t = \beta(l_t - l_{t-1}) + (1-\beta)b_{t-1}$
- 预测方程：$\hat{y}_{t+h} = l_t + hb_t$

```python
from statsmodels.tsa.holtwinters import Holt

# 创建有趋势的序列
np.random.seed(42)
n = 100
trend_ts = pd.Series(np.linspace(100, 200, n) + np.random.normal(0, 5, n))

# Holt 线性趋势模型
holt_model = Holt(trend_ts).fit(smoothing_level=0.3, smoothing_trend=0.1)
holt_forecast = holt_model.forecast(20)

print(f'水平平滑系数 alpha: {holt_model.params["smoothing_level"]:.4f}')
print(f'趋势平滑系数 beta: {holt_model.params["smoothing_trend"]:.4f}')

# 带阻尼趋势的 Holt 模型
holt_damped = Holt(trend_ts, damped_trend=True).fit()
holt_damped_forecast = holt_damped.forecast(20)

plt.figure(figsize=(12, 4))
plt.plot(trend_ts, label='原始数据')
plt.plot(holt_model.fittedvalues, label='Holt 拟合')
plt.plot(range(len(trend_ts), len(trend_ts) + 20), holt_forecast, 'r--', label='Holt 预测')
plt.plot(range(len(trend_ts), len(trend_ts) + 20), holt_damped_forecast, 'g--', label='阻尼 Holt 预测')
plt.legend()
plt.title('Holt 线性趋势法')
plt.show()
```

### Holt-Winters 方法

Holt-Winters 方法是指数平滑的完整形式，同时处理趋势和季节性。分为加法季节性和乘法季节性两种：

**加法模型**：适用于季节性振幅恒定
**乘法模型**：适用于季节性振幅随水平变化

```python
from statsmodels.tsa.holtwinters import ExponentialSmoothing

def holt_winters_forecast(series, seasonal_periods, trend='add', seasonal='add',
                           forecast_steps=12, damped_trend=False):
    """
    Holt-Winters 指数平滑预测
    """
    model = ExponentialSmoothing(
        series,
        trend=trend,
        seasonal=seasonal,
        seasonal_periods=seasonal_periods,
        damped_trend=damped_trend
    )

    fitted = model.fit()

    print('=== Holt-Winters 参数 ===')
    print(f'水平平滑系数 (alpha): {fitted.params["smoothing_level"]:.4f}')
    print(f'趋势平滑系数 (beta): {fitted.params["smoothing_trend"]:.4f}')
    print(f'季节平滑系数 (gamma): {fitted.params["smoothing_seasonal"]:.4f}')
    if damped_trend:
        print(f'阻尼系数 (phi): {fitted.params["damping_trend"]:.4f}')

    forecast = fitted.forecast(forecast_steps)

    return fitted, forecast

# 创建季节性数据
np.random.seed(42)
n = 48  # 4年月度数据
dates = pd.date_range('2020-01-01', periods=n, freq='M')

# 趋势 + 季节性
trend = np.linspace(100, 150, n)
seasonal = 20 * np.sin(2 * np.pi * np.arange(n) / 12)
noise = np.random.normal(0, 3, n)

hw_series = pd.Series(trend + seasonal + noise, index=dates)

# 拟合 Holt-Winters 加法模型
hw_add_fitted, hw_add_forecast = holt_winters_forecast(
    hw_series,
    seasonal_periods=12,
    trend='add',
    seasonal='add',
    forecast_steps=12
)

# 拟合 Holt-Winters 乘法模型
hw_mul_fitted, hw_mul_forecast = holt_winters_forecast(
    hw_series,
    seasonal_periods=12,
    trend='add',
    seasonal='mul',
    forecast_steps=12
)

# 可视化比较
plt.figure(figsize=(14, 5))
plt.plot(hw_series, 'b-', label='原始数据')
plt.plot(hw_add_fitted.fittedvalues, 'g-', alpha=0.7, label='加法模型拟合')
plt.plot(hw_add_forecast.index, hw_add_forecast, 'g--', label='加法模型预测')
plt.plot(hw_mul_forecast.index, hw_mul_forecast, 'r--', label='乘法模型预测')
plt.legend()
plt.title('Holt-Winters 指数平滑')
plt.xlabel('日期')
plt.ylabel('值')
plt.grid(True)
plt.show()
```

### 指数平滑方法选择指南

| 数据特征 | 推荐方法 | 模型代码 |
|----------|----------|----------|
| 无趋势、无季节性 | 简单指数平滑 | `SimpleExpSmoothing` |
| 有趋势、无季节性 | Holt 线性趋势法 | `Holt` |
| 无趋势、有季节性 | 季节性指数平滑 | `ExponentialSmoothing(seasonal='add')` |
| 有趋势、有季节性 | Holt-Winters | `ExponentialSmoothing` |
| 趋势减缓 | 阻尼趋势模型 | `damped_trend=True` |

```python
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from sklearn.metrics import mean_absolute_error, mean_squared_error
import numpy as np

def compare_exponential_smoothing(series, seasonal_periods=12, test_size=12):
    """
    比较不同指数平滑方法的预测效果
    """
    # 划分训练集和测试集
    train = series[:-test_size]
    test = series[-test_size:]

    models = {
        'SES': SimpleExpSmoothing(train).fit(),
        'Holt': Holt(train).fit(),
        'Holt-Damped': Holt(train, damped_trend=True).fit(),
        'HW-Add': ExponentialSmoothing(train, trend='add', seasonal='add',
                                        seasonal_periods=seasonal_periods).fit(),
        'HW-Mul': ExponentialSmoothing(train, trend='add', seasonal='mul',
                                        seasonal_periods=seasonal_periods).fit(),
    }

    results = []
    for name, model in models.items():
        forecast = model.forecast(test_size)
        mae = mean_absolute_error(test, forecast)
        rmse = np.sqrt(mean_squared_error(test, forecast))
        results.append({
            'Model': name,
            'MAE': mae,
            'RMSE': rmse
        })

    results_df = pd.DataFrame(results).sort_values('RMSE')
    print('=== 模型比较 ===')
    print(results_df)

    return results_df

# 使用示例
# compare_exponential_smoothing(hw_series, seasonal_periods=12)
```

## Prophet 预测模型

### Prophet 简介

Prophet 是 Facebook（现 Meta）开发的时间序列预测工具，特别适合处理：
- 具有强季节性效应的数据
- 包含节假日影响的数据
- 存在缺失值或异常值的数据
- 趋势发生变化的数据

Prophet 模型采用可分解时间序列模型：

$$y(t) = g(t) + s(t) + h(t) + \varepsilon_t$$

其中：
- $g(t)$：趋势函数
- $s(t)$：季节性函数
- $h(t)$：节假日效应
- $\varepsilon_t$：误差项

### Prophet 安装与基本使用

```python
# pip install prophet
from prophet import Prophet
import pandas as pd
import numpy as np

# Prophet 要求数据格式：ds（日期）和 y（值）
np.random.seed(42)
n = 365 * 3
dates = pd.date_range('2021-01-01', periods=n, freq='D')

# 创建带有趋势和季节性的数据
trend = np.linspace(100, 150, n)
yearly_seasonal = 20 * np.sin(2 * np.pi * np.arange(n) / 365)
weekly_seasonal = 5 * np.sin(2 * np.pi * np.arange(n) / 7)
noise = np.random.normal(0, 3, n)

df = pd.DataFrame({
    'ds': dates,
    'y': trend + yearly_seasonal + weekly_seasonal + noise
})

print(df.head())
print(df.tail())
```

### Prophet 模型训练与预测

```python
def prophet_forecast(df, periods=30, freq='D'):
    """
    使用 Prophet 进行预测
    """
    # 创建并拟合模型
    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=False,
        changepoint_prior_scale=0.05  # 趋势变化灵活度
    )

    model.fit(df)

    # 创建未来日期框架
    future = model.make_future_dataframe(periods=periods, freq=freq)

    # 预测
    forecast = model.predict(future)

    return model, forecast

# 拟合模型
model, forecast = prophet_forecast(df, periods=60)

# 查看预测结果
print(forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(10))

# 可视化预测
fig1 = model.plot(forecast)
plt.title('Prophet 预测结果')
plt.show()

# 可视化成分分解
fig2 = model.plot_components(forecast)
plt.show()
```

### Prophet 高级配置

```python
def advanced_prophet(df, holidays_df=None, periods=30):
    """
    Prophet 高级配置
    """
    model = Prophet(
        # 增长模型
        growth='linear',  # 或 'logistic' 用于饱和增长

        # 季节性配置
        yearly_seasonality=10,  # 傅里叶阶数
        weekly_seasonality=3,
        daily_seasonality=False,

        # 趋势灵活性
        changepoint_prior_scale=0.05,
        changepoint_range=0.8,  # 检测变化点的数据比例

        # 季节性模式
        seasonality_mode='additive',  # 或 'multiplicative'

        # 置信区间
        interval_width=0.95
    )

    # 添加自定义季节性
    model.add_seasonality(
        name='monthly',
        period=30.5,
        fourier_order=5
    )

    # 添加节假日
    if holidays_df is not None:
        model = Prophet(holidays=holidays_df)

    model.fit(df)

    future = model.make_future_dataframe(periods=periods)
    forecast = model.predict(future)

    return model, forecast

# 创建中国节假日数据框
def create_china_holidays():
    """
    创建中国主要节假日数据
    """
    holidays = pd.DataFrame({
        'holiday': 'spring_festival',
        'ds': pd.to_datetime(['2021-02-11', '2022-01-31', '2023-01-21']),
        'lower_window': -2,
        'upper_window': 5
    })

    national_day = pd.DataFrame({
        'holiday': 'national_day',
        'ds': pd.to_datetime(['2021-10-01', '2022-10-01', '2023-10-01']),
        'lower_window': 0,
        'upper_window': 6
    })

    return pd.concat([holidays, national_day])

# 使用示例
# china_holidays = create_china_holidays()
# model, forecast = advanced_prophet(df, holidays_df=china_holidays)
```

### Prophet 交叉验证

```python
from prophet.diagnostics import cross_validation, performance_metrics

def prophet_cv_evaluation(model, initial='365 days', period='30 days', horizon='90 days'):
    """
    Prophet 交叉验证评估
    """
    # 交叉验证
    df_cv = cross_validation(
        model,
        initial=initial,
        period=period,
        horizon=horizon
    )

    print('交叉验证结果示例：')
    print(df_cv.head())

    # 计算性能指标
    df_metrics = performance_metrics(df_cv)
    print('\n性能指标：')
    print(df_metrics)

    # 可视化预测误差
    from prophet.plot import plot_cross_validation_metric
    fig = plot_cross_validation_metric(df_cv, metric='mape')
    plt.show()

    return df_cv, df_metrics

# 使用示例
# df_cv, df_metrics = prophet_cv_evaluation(model)
```

### Prophet 超参数调优

```python
from prophet.diagnostics import cross_validation, performance_metrics
import itertools

def tune_prophet_hyperparameters(df, param_grid, cv_initial='365 days',
                                   cv_period='30 days', cv_horizon='90 days'):
    """
    Prophet 超参数网格搜索
    """
    # 生成所有参数组合
    keys = param_grid.keys()
    combinations = list(itertools.product(*param_grid.values()))

    results = []

    for values in combinations:
        params = dict(zip(keys, values))

        try:
            # 创建并训练模型
            model = Prophet(**params)
            model.fit(df)

            # 交叉验证
            df_cv = cross_validation(
                model,
                initial=cv_initial,
                period=cv_period,
                horizon=cv_horizon
            )

            # 计算 MAPE
            df_metrics = performance_metrics(df_cv)
            mape = df_metrics['mape'].mean()

            results.append({
                **params,
                'mape': mape
            })

            print(f'Params: {params}, MAPE: {mape:.4f}')

        except Exception as e:
            print(f'Error with params {params}: {e}')
            continue

    results_df = pd.DataFrame(results).sort_values('mape')
    print('\n最佳参数：')
    print(results_df.head(5))

    return results_df

# 参数网格
param_grid = {
    'changepoint_prior_scale': [0.001, 0.01, 0.1],
    'seasonality_prior_scale': [0.01, 0.1, 1.0],
    'seasonality_mode': ['additive', 'multiplicative']
}

# 使用示例（运行时间较长）
# best_params = tune_prophet_hyperparameters(df, param_grid)
```

## 模型评估与比较

### 预测评估指标

```python
from sklearn.metrics import mean_absolute_error, mean_squared_error, mean_absolute_percentage_error
import numpy as np

def calculate_metrics(y_true, y_pred):
    """
    计算时间序列预测评估指标
    """
    # 确保没有 NaN 值
    mask = ~(np.isnan(y_true) | np.isnan(y_pred))
    y_true = np.array(y_true)[mask]
    y_pred = np.array(y_pred)[mask]

    mae = mean_absolute_error(y_true, y_pred)
    mse = mean_squared_error(y_true, y_pred)
    rmse = np.sqrt(mse)
    mape = mean_absolute_percentage_error(y_true, y_pred) * 100

    # SMAPE (Symmetric Mean Absolute Percentage Error)
    smape = 100 * np.mean(2 * np.abs(y_pred - y_true) / (np.abs(y_true) + np.abs(y_pred)))

    print('=== 预测评估指标 ===')
    print(f'MAE (平均绝对误差): {mae:.4f}')
    print(f'MSE (均方误差): {mse:.4f}')
    print(f'RMSE (均方根误差): {rmse:.4f}')
    print(f'MAPE (平均绝对百分比误差): {mape:.2f}%')
    print(f'SMAPE (对称平均绝对百分比误差): {smape:.2f}%')

    return {
        'MAE': mae,
        'MSE': mse,
        'RMSE': rmse,
        'MAPE': mape,
        'SMAPE': smape
    }
```

### 时间序列交叉验证

```python
from sklearn.model_selection import TimeSeriesSplit

def time_series_cv(series, model_func, n_splits=5, test_size=None):
    """
    时间序列交叉验证
    """
    tscv = TimeSeriesSplit(n_splits=n_splits, test_size=test_size)

    scores = []

    for fold, (train_idx, test_idx) in enumerate(tscv.split(series)):
        train = series.iloc[train_idx]
        test = series.iloc[test_idx]

        # 训练模型并预测
        model = model_func(train)
        predictions = model.forecast(len(test))

        # 计算 RMSE
        rmse = np.sqrt(mean_squared_error(test, predictions))
        scores.append(rmse)

        print(f'Fold {fold + 1}: RMSE = {rmse:.4f}')

    print(f'\n平均 RMSE: {np.mean(scores):.4f} (+/- {np.std(scores):.4f})')

    return scores

# 使用示例
def arima_model_func(train):
    from statsmodels.tsa.arima.model import ARIMA
    model = ARIMA(train, order=(1, 1, 1))
    return model.fit()

# scores = time_series_cv(series, arima_model_func)
```

### 多模型比较框架

```python
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from prophet import Prophet
import warnings
warnings.filterwarnings('ignore')

def compare_models(series, test_size=30, seasonal_period=12):
    """
    比较多种时间序列模型
    """
    # 划分训练集和测试集
    train = series[:-test_size]
    test = series[-test_size:]

    results = []
    predictions = {}

    # 1. ARIMA
    try:
        arima_model = ARIMA(train, order=(1, 1, 1))
        arima_fitted = arima_model.fit()
        arima_pred = arima_fitted.forecast(test_size)
        predictions['ARIMA'] = arima_pred

        arima_metrics = calculate_metrics(test.values, arima_pred.values)
        results.append({'Model': 'ARIMA(1,1,1)', **arima_metrics})
    except Exception as e:
        print(f'ARIMA 错误: {e}')

    # 2. SARIMA
    try:
        from statsmodels.tsa.statespace.sarimax import SARIMAX
        sarima_model = SARIMAX(train, order=(1, 1, 1), seasonal_order=(1, 1, 1, seasonal_period))
        sarima_fitted = sarima_model.fit(disp=False)
        sarima_pred = sarima_fitted.forecast(test_size)
        predictions['SARIMA'] = sarima_pred

        sarima_metrics = calculate_metrics(test.values, sarima_pred.values)
        results.append({'Model': 'SARIMA', **sarima_metrics})
    except Exception as e:
        print(f'SARIMA 错误: {e}')

    # 3. Holt-Winters
    try:
        hw_model = ExponentialSmoothing(
            train,
            trend='add',
            seasonal='add',
            seasonal_periods=seasonal_period
        )
        hw_fitted = hw_model.fit()
        hw_pred = hw_fitted.forecast(test_size)
        predictions['Holt-Winters'] = hw_pred

        hw_metrics = calculate_metrics(test.values, hw_pred.values)
        results.append({'Model': 'Holt-Winters', **hw_metrics})
    except Exception as e:
        print(f'Holt-Winters 错误: {e}')

    # 4. Prophet
    try:
        train_df = pd.DataFrame({
            'ds': train.index,
            'y': train.values
        })

        prophet_model = Prophet(yearly_seasonality=True, weekly_seasonality=False)
        prophet_model.fit(train_df)

        future = prophet_model.make_future_dataframe(periods=test_size, freq='D')
        prophet_forecast = prophet_model.predict(future)
        prophet_pred = prophet_forecast['yhat'].iloc[-test_size:].values
        predictions['Prophet'] = pd.Series(prophet_pred, index=test.index)

        prophet_metrics = calculate_metrics(test.values, prophet_pred)
        results.append({'Model': 'Prophet', **prophet_metrics})
    except Exception as e:
        print(f'Prophet 错误: {e}')

    # 汇总结果
    results_df = pd.DataFrame(results)
    print('\n=== 模型比较汇总 ===')
    print(results_df.sort_values('RMSE'))

    # 可视化
    plt.figure(figsize=(14, 6))
    plt.plot(test.index, test.values, 'b-', label='真实值', linewidth=2)

    colors = ['r', 'g', 'orange', 'purple']
    for i, (name, pred) in enumerate(predictions.items()):
        plt.plot(test.index, pred.values, f'{colors[i]}--', label=name, alpha=0.7)

    plt.legend()
    plt.title('多模型预测比较')
    plt.xlabel('日期')
    plt.ylabel('值')
    plt.grid(True)
    plt.show()

    return results_df, predictions

# 使用示例
# results, predictions = compare_models(seasonal_ts, test_size=60, seasonal_period=365)
```

## 完整实战案例

### 销售预测案例

```python
import pandas as pd
import numpy as np
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.holtwinters import ExponentialSmoothing
from prophet import Prophet
import matplotlib.pyplot as plt
import warnings
warnings.filterwarnings('ignore')

# 生成模拟销售数据
np.random.seed(42)
n = 365 * 2  # 两年日数据

dates = pd.date_range('2022-01-01', periods=n, freq='D')

# 基础销量
base = 1000

# 长期趋势（缓慢增长）
trend = np.linspace(0, 200, n)

# 年度季节性（夏季销售高峰）
yearly = 150 * np.sin(2 * np.pi * (np.arange(n) - 90) / 365)

# 周季节性（周末销售下降）
weekly = -100 * (np.arange(n) % 7 >= 5).astype(float)

# 节假日效应（简化处理）
holidays_effect = np.zeros(n)
# 假设每年的双十一（第315天附近）销量翻倍
for year_offset in [0, 365]:
    if year_offset + 315 < n:
        holidays_effect[year_offset + 315: year_offset + 320] = 500

# 随机噪声
noise = np.random.normal(0, 50, n)

# 最终销量
sales = pd.Series(
    base + trend + yearly + weekly + holidays_effect + noise,
    index=dates,
    name='销量'
)

# 确保销量为正
sales = sales.clip(lower=0)

print('数据概览：')
print(sales.describe())

# 可视化
fig, axes = plt.subplots(3, 1, figsize=(14, 10))

axes[0].plot(sales)
axes[0].set_title('完整销售时序')

axes[1].plot(sales['2023-01':'2023-03'])
axes[1].set_title('2023年Q1放大（显示周季节性）')

monthly_sales = sales.resample('M').sum()
axes[2].bar(monthly_sales.index, monthly_sales.values)
axes[2].set_title('月度销售汇总')

plt.tight_layout()
plt.show()
```

### 模型构建与评估

```python
# 划分数据
train_size = int(len(sales) * 0.8)
train = sales[:train_size]
test = sales[train_size:]

print(f'训练集大小: {len(train)}')
print(f'测试集大小: {len(test)}')

# SARIMA 模型
print('\n=== 训练 SARIMA 模型 ===')
from statsmodels.tsa.statespace.sarimax import SARIMAX

sarima_model = SARIMAX(
    train,
    order=(1, 1, 1),
    seasonal_order=(1, 1, 1, 7),  # 周季节性
    enforce_stationarity=False,
    enforce_invertibility=False
)
sarima_fitted = sarima_model.fit(disp=False)
sarima_pred = sarima_fitted.forecast(len(test))

# Holt-Winters 模型
print('\n=== 训练 Holt-Winters 模型 ===')
hw_model = ExponentialSmoothing(
    train,
    trend='add',
    seasonal='add',
    seasonal_periods=7
)
hw_fitted = hw_model.fit()
hw_pred = hw_fitted.forecast(len(test))

# Prophet 模型
print('\n=== 训练 Prophet 模型 ===')
train_df = pd.DataFrame({
    'ds': train.index,
    'y': train.values
})

prophet_model = Prophet(
    yearly_seasonality=True,
    weekly_seasonality=True,
    daily_seasonality=False,
    changepoint_prior_scale=0.05
)
prophet_model.fit(train_df)

future = prophet_model.make_future_dataframe(periods=len(test), freq='D')
prophet_forecast = prophet_model.predict(future)
prophet_pred = prophet_forecast['yhat'].iloc[-len(test):]

# 评估
print('\n' + '='*50)
print('SARIMA 模型评估：')
sarima_metrics = calculate_metrics(test.values, sarima_pred.values)

print('\n' + '='*50)
print('Holt-Winters 模型评估：')
hw_metrics = calculate_metrics(test.values, hw_pred.values)

print('\n' + '='*50)
print('Prophet 模型评估：')
prophet_metrics = calculate_metrics(test.values, prophet_pred.values)

# 可视化比较
plt.figure(figsize=(14, 6))
plt.plot(test.index, test.values, 'b-', label='真实销量', alpha=0.7)
plt.plot(test.index, sarima_pred.values, 'r--', label='SARIMA', alpha=0.7)
plt.plot(test.index, hw_pred.values, 'g--', label='Holt-Winters', alpha=0.7)
plt.plot(test.index, prophet_pred.values, 'orange', linestyle='--', label='Prophet', alpha=0.7)

plt.legend()
plt.title('销售预测模型比较')
plt.xlabel('日期')
plt.ylabel('销量')
plt.grid(True)
plt.show()
```

### 最终预测与报告

```python
def generate_forecast_report(series, best_model_name, forecast_horizon=30):
    """
    生成预测报告
    """
    print('='*60)
    print('              销售预测报告')
    print('='*60)

    # 使用全部数据重新训练最佳模型
    if best_model_name == 'SARIMA':
        model = SARIMAX(
            series,
            order=(1, 1, 1),
            seasonal_order=(1, 1, 1, 7)
        )
        fitted = model.fit(disp=False)
        forecast = fitted.get_forecast(forecast_horizon)
        pred_mean = forecast.predicted_mean
        pred_ci = forecast.conf_int()

    elif best_model_name == 'Holt-Winters':
        model = ExponentialSmoothing(
            series,
            trend='add',
            seasonal='add',
            seasonal_periods=7
        )
        fitted = model.fit()
        pred_mean = fitted.forecast(forecast_horizon)
        # 简化置信区间估计
        std = series.std() * 0.1
        pred_ci = pd.DataFrame({
            'lower': pred_mean - 1.96 * std,
            'upper': pred_mean + 1.96 * std
        })

    elif best_model_name == 'Prophet':
        df = pd.DataFrame({
            'ds': series.index,
            'y': series.values
        })
        model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True
        )
        model.fit(df)
        future = model.make_future_dataframe(periods=forecast_horizon, freq='D')
        forecast = model.predict(future)
        pred_mean = forecast['yhat'].iloc[-forecast_horizon:]
        pred_ci = pd.DataFrame({
            'lower': forecast['yhat_lower'].iloc[-forecast_horizon:].values,
            'upper': forecast['yhat_upper'].iloc[-forecast_horizon:].values
        })

    # 打印预测摘要
    print(f'\n预测模型: {best_model_name}')
    print(f'预测期数: {forecast_horizon} 天')
    print(f'\n预测日期范围: {pred_mean.index[0]} 到 {pred_mean.index[-1]}')

    print(f'\n预测统计摘要:')
    print(f'  预测均值: {pred_mean.mean():.2f}')
    print(f'  预测最大值: {pred_mean.max():.2f}')
    print(f'  预测最小值: {pred_mean.min():.2f}')
    print(f'  预测总量: {pred_mean.sum():.2f}')

    # 可视化
    fig, axes = plt.subplots(2, 1, figsize=(14, 8))

    # 历史 + 预测
    axes[0].plot(series.index, series.values, 'b-', label='历史数据')
    axes[0].plot(pred_mean.index, pred_mean.values, 'r-', label='预测')
    if isinstance(pred_ci, pd.DataFrame):
        axes[0].fill_between(
            pred_mean.index,
            pred_ci['lower'] if 'lower' in pred_ci.columns else pred_ci.iloc[:, 0],
            pred_ci['upper'] if 'upper' in pred_ci.columns else pred_ci.iloc[:, 1],
            color='red', alpha=0.2, label='95% 置信区间'
        )
    axes[0].legend()
    axes[0].set_title('销售预测')
    axes[0].grid(True)

    # 预测放大
    axes[1].plot(pred_mean.index, pred_mean.values, 'r-o', label='预测值')
    if isinstance(pred_ci, pd.DataFrame):
        axes[1].fill_between(
            pred_mean.index,
            pred_ci['lower'] if 'lower' in pred_ci.columns else pred_ci.iloc[:, 0],
            pred_ci['upper'] if 'upper' in pred_ci.columns else pred_ci.iloc[:, 1],
            color='red', alpha=0.2
        )
    axes[1].legend()
    axes[1].set_title(f'未来 {forecast_horizon} 天预测')
    axes[1].grid(True)

    plt.tight_layout()
    plt.show()

    return pred_mean, pred_ci

# 生成报告
pred_mean, pred_ci = generate_forecast_report(sales, 'SARIMA', forecast_horizon=30)
```

## 面试要点与实践建议

### 常见面试问题

**Q1: ARIMA 和指数平滑有什么区别？**

ARIMA 基于自回归和移动平均的统计框架，适合处理平稳或可差分为平稳的序列。指数平滑是一种加权平均方法，通过指数递减的权重赋予近期数据更多影响力。指数平滑通常更直观、计算更快，但灵活性不如 ARIMA。

**Q2: 如何判断时间序列的平稳性？**

主要通过以下方法：
1. 可视化观察：趋势和方差是否随时间变化
2. ADF 检验：检测单位根
3. KPSS 检验：与 ADF 假设相反，交叉验证
4. ACF 图：平稳序列的 ACF 应快速衰减

**Q3: Prophet 和 ARIMA 的适用场景有何不同？**

Prophet 更适合：
- 具有强季节性的业务数据
- 含有节假日效应的数据
- 非统计背景的分析师使用
- 需要快速获得合理预测结果

ARIMA 更适合：
- 需要深入理解时序动态的场景
- 学术研究和模型解释
- 数据相对规整、缺失值少的情况

**Q4: 如何处理时间序列中的异常值？**

1. 检测方法：箱线图、Z-score、STL 分解残差
2. 处理方法：插值、平滑、使用鲁棒模型
3. Prophet 内置异常值处理机制

**Q5: 时间序列预测的评估指标如何选择？**

- RMSE：对大误差敏感，适合惩罚极端预测
- MAE：更稳健，不受异常值影响
- MAPE：便于解释（百分比误差），但对零值敏感
- SMAPE：对称版本，解决 MAPE 的不对称问题

### 实践建议

1. **数据探索先行**
   - 始终从可视化开始
   - 检查数据质量（缺失值、异常值）
   - 理解数据的业务背景

2. **特征工程**
   - 提取日期特征（年、月、周、节假日）
   - 考虑外部因素（天气、促销活动）
   - 创建滞后特征

3. **模型选择**
   - 从简单模型开始（移动平均、指数平滑）
   - 使用多种模型并比较
   - 考虑集成多个模型

4. **验证策略**
   - 使用时间序列交叉验证
   - 避免使用未来信息
   - 测试集应反映真实预测场景

5. **持续监控**
   - 部署后持续监控预测准确性
   - 定期重训练模型
   - 设置预警机制

## 总结

本文系统介绍了时间序列分析的传统方法，涵盖了从基础概念到实战应用的完整流程：

1. **基础概念**：时间序列组成成分、加法与乘法模型
2. **平稳性检验**：ADF 检验、KPSS 检验、差分方法
3. **自相关分析**：ACF/PACF 的计算与模式识别
4. **ARIMA 模型**：参数选择、模型拟合、诊断检验
5. **SARIMA 模型**：处理季节性时间序列
6. **指数平滑**：从简单平滑到 Holt-Winters
7. **Prophet**：Facebook 的时间序列预测工具
8. **模型评估**：评估指标、交叉验证、多模型比较

掌握这些传统方法是进行时间序列分析的基础。虽然深度学习方法（如 LSTM、Transformer）在某些场景下表现出色，但传统方法依然因其可解释性强、计算效率高、适用场景广而被广泛使用。

在实际应用中，建议：
- 根据数据特点选择合适的方法
- 多种方法并行尝试并比较
- 重视模型的可解释性和可维护性
- 持续监控模型性能并及时更新
