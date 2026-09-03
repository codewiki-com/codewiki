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
origin: old/src/content/docs/ai/time-series.en.md
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

Time series analysis is an important branch of data science and machine learning, widely applied in financial forecasting, sales prediction, weather forecasting, demand planning, and other fields. We cover the core concepts, classical methods, and deep learning techniques of time series analysis to help you master the theory and practice of time series forecasting.

---

## Time Series Fundamentals

### What is a Time Series

A time series is a sequence of data points arranged in chronological order, where each data point is associated with a specific timestamp. Unlike traditional independent and identically distributed (i.i.d.) data, time series data exhibits temporal dependence, where current values often have correlations with historical values.

**Characteristics of Time Series:**
- **Temporal Dependence**: Current observations depend on past observations
- **Non-independence**: Data points are autocorrelated
- **Trend**: Data may exhibit long-term upward or downward patterns
- **Periodicity**: Data may contain repeating patterns with fixed cycles

### Main Components of Time Series

A time series can typically be decomposed into four basic components:

| Component | English Name | Description | Example |
|-----------|--------------|-------------|---------|
| Trend | Trend | Long-term upward or downward changes | GDP growth trend |
| Seasonality | Seasonality | Repeating patterns with fixed periods | Increased air conditioner sales in summer |
| Cyclicity | Cyclicity | Fluctuations with non-fixed periods | Economic cycles |
| Residual | Residual | Random fluctuations and noise | Unexplainable random variations |

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# Create example time series data
np.random.seed(42)
dates = pd.date_range(start='2020-01-01', periods=365*3, freq='D')

# Build time series with trend, seasonality, and noise
trend = np.linspace(100, 200, len(dates))  # Upward trend
seasonality = 20 * np.sin(2 * np.pi * np.arange(len(dates)) / 365)  # Annual seasonality
noise = np.random.normal(0, 5, len(dates))  # Random noise

# Compose time series
ts_data = trend + seasonality + noise

# Create DataFrame
df = pd.DataFrame({'date': dates, 'value': ts_data})
df.set_index('date', inplace=True)

# Visualization
fig, axes = plt.subplots(4, 1, figsize=(14, 10))

axes[0].plot(df.index, ts_data, label='Original Series')
axes[0].set_title('Complete Time Series')
axes[0].legend()

axes[1].plot(df.index, trend, color='red', label='Trend Component')
axes[1].set_title('Trend Component')
axes[1].legend()

axes[2].plot(df.index, seasonality, color='green', label='Seasonal Component')
axes[2].set_title('Seasonal Component (Seasonality)')
axes[2].legend()

axes[3].plot(df.index, noise, color='gray', label='Residual Component')
axes[3].set_title('Residual Component')
axes[3].legend()

plt.tight_layout()
plt.show()
```

### Common Time Series Data Types

```python
import pandas as pd

# Univariate time series
univariate_ts = pd.Series(
    data=[100, 102, 105, 103, 108, 112],
    index=pd.date_range('2024-01-01', periods=6, freq='D'),
    name='sales'
)

# Multivariate time series
multivariate_ts = pd.DataFrame({
    'temperature': [20, 22, 25, 23, 21, 19],
    'humidity': [60, 55, 50, 52, 58, 62],
    'sales': [100, 120, 150, 130, 110, 95]
}, index=pd.date_range('2024-01-01', periods=6, freq='D'))

# Panel data (time series for multiple entities)
panel_data = pd.DataFrame({
    'date': pd.date_range('2024-01-01', periods=3, freq='D').tolist() * 2,
    'store_id': ['A', 'A', 'A', 'B', 'B', 'B'],
    'sales': [100, 110, 105, 200, 220, 210]
})

print("Univariate time series:")
print(univariate_ts)
print("\nMultivariate time series:")
print(multivariate_ts)
```

---

## Time Series Decomposition

Time series decomposition is an important method for analyzing time series. It breaks down the original series into multiple interpretable components, helping us understand the underlying structure of the data.

### Additive and Multiplicative Decomposition

**Additive Model**: Suitable when seasonal fluctuations are relatively stable

$$Y_t = T_t + S_t + R_t$$

**Multiplicative Model**: Suitable when seasonal fluctuations vary with the trend

$$Y_t = T_t \times S_t \times R_t$$

Where $Y_t$ is the observed value, $T_t$ is the trend component, $S_t$ is the seasonal component, and $R_t$ is the residual component.

### Classical Decomposition Methods

```python
import pandas as pd
import numpy as np
from statsmodels.tsa.seasonal import seasonal_decompose
import matplotlib.pyplot as plt

# Create example data
np.random.seed(42)
dates = pd.date_range(start='2020-01-01', periods=365*2, freq='D')
trend = np.linspace(100, 150, len(dates))
seasonality = 15 * np.sin(2 * np.pi * np.arange(len(dates)) / 365)
noise = np.random.normal(0, 3, len(dates))
data = trend + seasonality + noise

ts = pd.Series(data, index=dates)

# Additive decomposition
decomposition_add = seasonal_decompose(ts, model='additive', period=365)

# Multiplicative decomposition (data must be positive)
decomposition_mul = seasonal_decompose(ts, model='multiplicative', period=365)

# Plot decomposition results
def plot_decomposition(decomposition, title):
    fig, axes = plt.subplots(4, 1, figsize=(14, 10))

    decomposition.observed.plot(ax=axes[0], title='Original Series')
    decomposition.trend.plot(ax=axes[1], title='Trend Component')
    decomposition.seasonal.plot(ax=axes[2], title='Seasonal Component')
    decomposition.resid.plot(ax=axes[3], title='Residual Component')

    fig.suptitle(title, fontsize=14)
    plt.tight_layout()
    plt.show()

plot_decomposition(decomposition_add, 'Additive Decomposition')
```

### STL Decomposition (A More Powerful Method)

STL (Seasonal and Trend decomposition using Loess) is a more flexible and robust decomposition method that can handle arbitrary types of seasonality and has better robustness against outliers.

```python
from statsmodels.tsa.seasonal import STL
import matplotlib.pyplot as plt

# STL decomposition
stl = STL(ts, period=365, robust=True)
result = stl.fit()

# Plot STL decomposition results
fig = result.plot()
fig.set_size_inches(14, 10)
plt.show()

# Get components
trend_component = result.trend
seasonal_component = result.seasonal
residual_component = result.resid

# Calculate seasonal strength and trend strength
def calculate_strength(residual, component):
    """Calculate component strength"""
    var_residual = np.var(residual)
    var_component_residual = np.var(component + residual)
    strength = max(0, 1 - var_residual / var_component_residual)
    return strength

trend_strength = calculate_strength(residual_component.dropna(),
                                    trend_component.dropna())
seasonal_strength = calculate_strength(residual_component.dropna(),
                                       seasonal_component.dropna())

print(f"Trend strength: {trend_strength:.4f}")
print(f"Seasonal strength: {seasonal_strength:.4f}")
```

### MSTL Decomposition (Multiple Seasonality)

When a time series has multiple seasonal periods (such as daily and weekly cycles), MSTL decomposition can be used.

```python
from statsmodels.tsa.seasonal import MSTL

# Create data with multiple seasonalities (hourly data with daily and weekly cycles)
np.random.seed(42)
hours = 24 * 7 * 12  # 12 weeks of hourly data
dates = pd.date_range(start='2024-01-01', periods=hours, freq='H')

# Daily cycle (24 hours) + Weekly cycle (168 hours)
daily_season = 10 * np.sin(2 * np.pi * np.arange(hours) / 24)
weekly_season = 20 * np.sin(2 * np.pi * np.arange(hours) / 168)
trend = np.linspace(100, 120, hours)
noise = np.random.normal(0, 2, hours)

multi_seasonal_data = trend + daily_season + weekly_season + noise
ts_multi = pd.Series(multi_seasonal_data, index=dates)

# MSTL decomposition
mstl = MSTL(ts_multi, periods=[24, 168])  # Daily and weekly cycles
result_mstl = mstl.fit()

# View decomposition results
print("Decomposition components:")
print(f"Trend component shape: {result_mstl.trend.shape}")
print(f"Seasonal component shape: {result_mstl.seasonal.shape}")
print(f"Residual component shape: {result_mstl.resid.shape}")
```

---

## Stationarity Testing and Differencing

### The Importance of Stationarity

Stationarity is a core concept in time series analysis. A stationary time series has the following properties:
- **Constant Mean**: The expected value of the series does not change over time
- **Constant Variance**: The variance of the series does not change over time
- **Autocovariance depends only on lag**: The covariance between different time points depends only on the time interval

Many classical time series models (such as ARIMA) require the data to be stationary, so we need to transform non-stationary series.

### ADF Test (Unit Root Test)

The Augmented Dickey-Fuller (ADF) test is the most commonly used stationarity test method.

**Hypothesis Testing:**
- H0 (Null Hypothesis): The series has a unit root, i.e., non-stationary
- H1 (Alternative Hypothesis): The series is stationary

```python
from statsmodels.tsa.stattools import adfuller, kpss
import pandas as pd
import numpy as np

def adf_test(series, significance_level=0.05):
    """
    ADF Stationarity Test

    Parameters:
    -----------
    series : pd.Series
        Time series data
    significance_level : float
        Significance level, default 0.05

    Returns:
    --------
    dict : Test results
    """
    result = adfuller(series.dropna(), autolag='AIC')

    output = {
        'ADF Statistic': result[0],
        'p-value': result[1],
        'Lags Used': result[2],
        'Number of Observations': result[3],
        'Critical Values': result[4],
        'Is Stationary': result[1] < significance_level
    }

    print("=" * 50)
    print("ADF Stationarity Test Results")
    print("=" * 50)
    print(f"ADF Statistic: {result[0]:.6f}")
    print(f"p-value: {result[1]:.6f}")
    print(f"Lags Used: {result[2]}")
    print(f"Number of Observations: {result[3]}")
    print("\nCritical Values:")
    for key, value in result[4].items():
        print(f"  {key}: {value:.6f}")
    print("-" * 50)

    if result[1] < significance_level:
        print(f"Conclusion: p-value < {significance_level}, reject null hypothesis, series is stationary")
    else:
        print(f"Conclusion: p-value >= {significance_level}, cannot reject null hypothesis, series is non-stationary")

    return output

# Create non-stationary series (random walk)
np.random.seed(42)
random_walk = np.cumsum(np.random.randn(500))
ts_nonstationary = pd.Series(random_walk)

# Create stationary series
ts_stationary = pd.Series(np.random.randn(500))

print("Non-stationary series test:")
adf_test(ts_nonstationary)

print("\n\nStationary series test:")
adf_test(ts_stationary)
```

### KPSS Test

The KPSS test has the opposite null hypothesis from the ADF test and can serve as a complementary testing method.

```python
from statsmodels.tsa.stattools import kpss

def kpss_test(series, regression='c'):
    """
    KPSS Stationarity Test

    Parameters:
    -----------
    series : pd.Series
        Time series data
    regression : str
        'c' tests for level stationarity
        'ct' tests for trend stationarity

    Returns:
    --------
    dict : Test results
    """
    result = kpss(series.dropna(), regression=regression)

    print("=" * 50)
    print("KPSS Stationarity Test Results")
    print("=" * 50)
    print(f"KPSS Statistic: {result[0]:.6f}")
    print(f"p-value: {result[1]:.6f}")
    print(f"Lags Used: {result[2]}")
    print("\nCritical Values:")
    for key, value in result[3].items():
        print(f"  {key}: {value:.6f}")
    print("-" * 50)

    # KPSS null hypothesis is that the series is stationary
    if result[1] < 0.05:
        print("Conclusion: p-value < 0.05, reject null hypothesis, series is non-stationary")
    else:
        print("Conclusion: p-value >= 0.05, cannot reject null hypothesis, series is stationary")

    return {
        'KPSS Statistic': result[0],
        'p-value': result[1],
        'Lags Used': result[2],
        'Critical Values': result[3]
    }

# Execute KPSS test
kpss_test(ts_nonstationary)
```

### Differencing

For non-stationary series, differencing is the most commonly used method to achieve stationarity.

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

def difference_series(series, order=1, seasonal_period=None):
    """
    Perform differencing on time series

    Parameters:
    -----------
    series : pd.Series
        Original time series
    order : int
        Differencing order
    seasonal_period : int or None
        Seasonal differencing period

    Returns:
    --------
    pd.Series : Differenced series
    """
    diff_series = series.copy()

    # Regular differencing
    for _ in range(order):
        diff_series = diff_series.diff().dropna()

    # Seasonal differencing
    if seasonal_period is not None:
        diff_series = diff_series.diff(seasonal_period).dropna()

    return diff_series

def find_optimal_diff_order(series, max_order=3):
    """
    Automatically find optimal differencing order
    """
    for d in range(max_order + 1):
        if d == 0:
            test_series = series
        else:
            test_series = series.diff(d).dropna()

        result = adfuller(test_series, autolag='AIC')
        p_value = result[1]

        print(f"Differencing order d={d}: ADF statistic={result[0]:.4f}, p-value={p_value:.4f}")

        if p_value < 0.05:
            print(f"\nOptimal differencing order: {d}")
            return d

    print(f"\nWarning: Maximum differencing order {max_order} reached but still non-stationary")
    return max_order

# Example: Differencing a non-stationary series
np.random.seed(42)
trend_data = np.cumsum(np.random.randn(500)) + np.linspace(0, 50, 500)
ts = pd.Series(trend_data)

# Find optimal differencing order
optimal_d = find_optimal_diff_order(ts)

# Visualize differencing results
fig, axes = plt.subplots(3, 1, figsize=(14, 10))

axes[0].plot(ts)
axes[0].set_title('Original Series (Non-stationary)')

axes[1].plot(ts.diff().dropna())
axes[1].set_title('First-order Differencing')

axes[2].plot(ts.diff().diff().dropna())
axes[2].set_title('Second-order Differencing')

plt.tight_layout()
plt.show()
```

---

## ARIMA Model Explained

### ARIMA Model Principles

ARIMA (AutoRegressive Integrated Moving Average) is the most classical time series forecasting model, consisting of three parts:

**AR (AutoRegressive) Part**: Linear combination of current and past values

$$y_t = c + \phi_1 y_{t-1} + \phi_2 y_{t-2} + ... + \phi_p y_{t-p} + \epsilon_t$$

**I (Integrated) Part**: Making the series stationary through differencing

**MA (Moving Average) Part**: Linear combination of current value and past error terms

$$y_t = c + \epsilon_t + \theta_1 \epsilon_{t-1} + \theta_2 \epsilon_{t-2} + ... + \theta_q \epsilon_{t-q}$$

Where B is the lag operator, p is the autoregressive order, d is the differencing order, and q is the moving average order.

### Parameter Selection: ACF and PACF Analysis

```python
import pandas as pd
import numpy as np
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf
from statsmodels.tsa.stattools import acf, pacf
import matplotlib.pyplot as plt

def analyze_acf_pacf(series, lags=40, title='ACF and PACF Analysis'):
    """
    Analyze autocorrelation and partial autocorrelation functions of time series
    """
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))

    # Original series
    axes[0, 0].plot(series)
    axes[0, 0].set_title('Time Series')
    axes[0, 0].set_xlabel('Time')
    axes[0, 0].set_ylabel('Value')

    # Differenced series
    diff_series = series.diff().dropna()
    axes[0, 1].plot(diff_series)
    axes[0, 1].set_title('First-order Differenced Series')
    axes[0, 1].set_xlabel('Time')
    axes[0, 1].set_ylabel('Value')

    # ACF
    plot_acf(diff_series, lags=lags, ax=axes[1, 0], title='Autocorrelation Function (ACF)')

    # PACF
    plot_pacf(diff_series, lags=lags, ax=axes[1, 1], title='Partial Autocorrelation Function (PACF)')

    plt.suptitle(title, fontsize=14)
    plt.tight_layout()
    plt.show()

    # Parameter selection guide
    print("\nParameter Selection Guide:")
    print("=" * 50)
    print("ACF Plot:")
    print("  - If ACF decays exponentially, consider AR model")
    print("  - If ACF cuts off after lag q, MA(q) model is appropriate")
    print("\nPACF Plot:")
    print("  - If PACF cuts off after lag p, AR(p) model is appropriate")
    print("  - If PACF decays exponentially, consider MA model")
    print("\nCombined Cases:")
    print("  - Both ACF and PACF decay exponentially -> ARMA model")
    print("=" * 50)

# Create example data
np.random.seed(42)
n = 500
# Simulate AR(2) process
ar_data = np.zeros(n)
for i in range(2, n):
    ar_data[i] = 0.6 * ar_data[i-1] - 0.3 * ar_data[i-2] + np.random.randn()

ts_ar = pd.Series(ar_data)
analyze_acf_pacf(ts_ar, title='ACF and PACF Analysis of AR(2) Process')
```

### Automatic Parameter Selection

```python
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.stattools import adfuller
import warnings
warnings.filterwarnings('ignore')

def auto_arima(series, max_p=5, max_d=2, max_q=5, criterion='aic'):
    """
    Automatically select optimal ARIMA parameters
    """
    # First determine d
    d = 0
    temp_series = series.copy()
    for i in range(max_d + 1):
        result = adfuller(temp_series.dropna())
        if result[1] < 0.05:
            d = i
            break
        temp_series = temp_series.diff().dropna()
        d = i + 1

    print(f"Determined differencing order d = {d}")

    # Grid search for p and q
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

    # Display results
    results_df = pd.DataFrame(results).sort_values(criterion.upper())
    print(f"\nOptimal parameters (by {criterion.upper()}): ARIMA{best_params}")
    print(f"Optimal {criterion.upper()}: {best_score:.2f}")
    print("\nTop 10 best models:")
    print(results_df.head(10).to_string(index=False))

    return best_params

# Usage example
np.random.seed(42)
n = 500
data = np.zeros(n)
data[0] = np.random.randn()
for i in range(1, n):
    data[i] = data[i-1] + 0.5 * np.random.randn()

ts = pd.Series(data)
best_order = auto_arima(ts)
```

### ARIMA Model Training and Prediction

```python
import pandas as pd
import numpy as np
from statsmodels.tsa.arima.model import ARIMA
from sklearn.metrics import mean_squared_error, mean_absolute_error
import matplotlib.pyplot as plt

class ARIMAForecaster:
    """ARIMA Time Series Forecaster"""

    def __init__(self, order=(1, 1, 1)):
        self.order = order
        self.model = None
        self.fitted_model = None

    def fit(self, train_data):
        """Train ARIMA model"""
        self.model = ARIMA(train_data, order=self.order)
        self.fitted_model = self.model.fit()
        print("Model training completed")
        print(self.fitted_model.summary())
        return self

    def predict(self, steps):
        """Make predictions"""
        if self.fitted_model is None:
            raise ValueError("Please train the model first")
        forecast = self.fitted_model.forecast(steps=steps)
        return forecast

    def get_confidence_interval(self, steps, alpha=0.05):
        """Get prediction confidence interval"""
        forecast = self.fitted_model.get_forecast(steps=steps)
        conf_int = forecast.conf_int(alpha=alpha)

        result = pd.DataFrame({
            'forecast': forecast.predicted_mean,
            'lower': conf_int.iloc[:, 0],
            'upper': conf_int.iloc[:, 1]
        })
        return result

    def diagnose(self):
        """Model diagnostics"""
        if self.fitted_model is None:
            raise ValueError("Please train the model first")
        fig = self.fitted_model.plot_diagnostics(figsize=(14, 10))
        plt.tight_layout()
        plt.show()

# Complete example
def arima_forecast_example():
    # Create example data
    np.random.seed(42)
    dates = pd.date_range(start='2020-01-01', periods=500, freq='D')
    trend = np.linspace(100, 150, 500)
    noise = np.random.randn(500) * 5
    data = trend + noise

    ts = pd.Series(data, index=dates)

    # Split into training and test sets
    train_size = int(len(ts) * 0.8)
    train, test = ts[:train_size], ts[train_size:]

    print(f"Training set size: {len(train)}")
    print(f"Test set size: {len(test)}")

    # Train model
    forecaster = ARIMAForecaster(order=(2, 1, 2))
    forecaster.fit(train)

    # Predict
    predictions = forecaster.predict(steps=len(test))
    conf_interval = forecaster.get_confidence_interval(steps=len(test))

    # Evaluate
    rmse = np.sqrt(mean_squared_error(test, predictions))
    mae = mean_absolute_error(test, predictions)
    mape = np.mean(np.abs((test.values - predictions.values) / test.values)) * 100

    print(f"\nEvaluation Metrics:")
    print(f"RMSE: {rmse:.4f}")
    print(f"MAE: {mae:.4f}")
    print(f"MAPE: {mape:.2f}%")

    # Visualization
    plt.figure(figsize=(14, 6))
    plt.plot(train.index, train, label='Training Data', color='blue')
    plt.plot(test.index, test, label='Test Data', color='green')
    plt.plot(test.index, predictions, label='Predictions', color='red', linestyle='--')
    plt.fill_between(test.index,
                     conf_interval['lower'],
                     conf_interval['upper'],
                     color='red', alpha=0.2, label='95% Confidence Interval')
    plt.legend()
    plt.title('ARIMA Forecast Results')
    plt.xlabel('Date')
    plt.ylabel('Value')
    plt.show()

    return forecaster

forecaster = arima_forecast_example()
```

### SARIMA (Seasonal ARIMA)

When data exhibits clear seasonality, the SARIMA model is more appropriate.

```python
from statsmodels.tsa.statespace.sarimax import SARIMAX

class SARIMAForecaster:
    """SARIMA Time Series Forecaster"""

    def __init__(self, order=(1, 1, 1), seasonal_order=(1, 1, 1, 12)):
        self.order = order
        self.seasonal_order = seasonal_order
        self.model = None
        self.fitted_model = None

    def fit(self, train_data):
        """Train SARIMA model"""
        self.model = SARIMAX(
            train_data,
            order=self.order,
            seasonal_order=self.seasonal_order,
            enforce_stationarity=False,
            enforce_invertibility=False
        )
        self.fitted_model = self.model.fit(disp=False)

        print("SARIMA model training completed")
        print(f"AIC: {self.fitted_model.aic:.2f}")
        print(f"BIC: {self.fitted_model.bic:.2f}")
        return self

    def predict(self, steps):
        """Make predictions"""
        return self.fitted_model.forecast(steps=steps)

    def get_forecast_df(self, steps, alpha=0.05):
        """Get forecast results DataFrame"""
        forecast = self.fitted_model.get_forecast(steps=steps)
        conf_int = forecast.conf_int(alpha=alpha)

        return pd.DataFrame({
            'forecast': forecast.predicted_mean,
            'lower': conf_int.iloc[:, 0],
            'upper': conf_int.iloc[:, 1]
        })

# Usage example
def sarima_example():
    # Create data with seasonality
    np.random.seed(42)
    n_years = 5
    dates = pd.date_range(start='2019-01-01', periods=n_years*12, freq='MS')

    # Trend + Annual seasonality + Noise
    trend = np.linspace(100, 150, len(dates))
    seasonality = 20 * np.sin(2 * np.pi * np.arange(len(dates)) / 12)
    noise = np.random.randn(len(dates)) * 5

    data = trend + seasonality + noise
    ts = pd.Series(data, index=dates)

    # Split data
    train = ts[:-12]  # Keep last year for testing
    test = ts[-12:]

    # Train SARIMA model
    forecaster = SARIMAForecaster(
        order=(1, 1, 1),
        seasonal_order=(1, 1, 1, 12)
    )
    forecaster.fit(train)

    # Predict
    forecast_df = forecaster.get_forecast_df(steps=12)

    # Visualization
    plt.figure(figsize=(14, 6))
    plt.plot(train.index, train, label='Training Data')
    plt.plot(test.index, test, label='Test Data', color='green')
    plt.plot(test.index, forecast_df['forecast'], label='Prediction', color='red', linestyle='--')
    plt.fill_between(test.index,
                     forecast_df['lower'],
                     forecast_df['upper'],
                     color='red', alpha=0.2)
    plt.legend()
    plt.title('SARIMA Forecast Results')
    plt.show()

    return forecaster

sarima_model = sarima_example()
```

---

## Prophet Forecasting Framework

### Introduction to Prophet

Prophet is an open-source time series forecasting tool from Facebook, particularly suitable for handling business time series with the following characteristics:
- Strong seasonal effects
- Multiple seasonal periods
- Known special events or holidays
- Trend change points
- Missing data or outliers

### Prophet Model Principles

Prophet uses an additive decomposition model:

$$y(t) = g(t) + s(t) + h(t) + \epsilon_t$$

Where:
- g(t): Trend function (linear or logistic growth)
- s(t): Seasonal component (Fourier series)
- h(t): Holiday effects
- epsilon_t: Error term

```python
from prophet import Prophet
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

class ProphetForecaster:
    """Prophet Time Series Forecaster"""

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
        """Add custom seasonality"""
        self.model.add_seasonality(
            name=name,
            period=period,
            fourier_order=fourier_order
        )
        return self

    def add_regressor(self, name):
        """Add external regressor"""
        self.model.add_regressor(name)
        return self

    def fit(self, df):
        """Train model (df must contain 'ds' and 'y' columns)"""
        self.model.fit(df)
        print("Prophet model training completed")
        return self

    def predict(self, periods, freq='D', include_history=True):
        """Make predictions"""
        future = self.model.make_future_dataframe(periods=periods, freq=freq,
                                                   include_history=include_history)
        self.forecast = self.model.predict(future)
        return self.forecast

    def plot_forecast(self, figsize=(14, 6)):
        """Plot forecast results"""
        if self.forecast is None:
            raise ValueError("Please make predictions first")
        fig = self.model.plot(self.forecast, figsize=figsize)
        plt.title('Prophet Forecast Results')
        plt.show()
        return fig

    def plot_components(self, figsize=(14, 10)):
        """Plot component decomposition"""
        if self.forecast is None:
            raise ValueError("Please make predictions first")
        fig = self.model.plot_components(self.forecast, figsize=figsize)
        plt.show()
        return fig

    def cross_validate(self, initial, period, horizon):
        """Time series cross-validation"""
        from prophet.diagnostics import cross_validation, performance_metrics

        df_cv = cross_validation(self.model, initial=initial,
                                  period=period, horizon=horizon)
        df_metrics = performance_metrics(df_cv)

        print("Cross-validation evaluation metrics:")
        print(df_metrics[['horizon', 'mse', 'rmse', 'mae', 'mape']].to_string())

        return df_cv, df_metrics

# Complete example
def prophet_example():
    # Create example data
    np.random.seed(42)
    dates = pd.date_range(start='2020-01-01', end='2023-12-31', freq='D')

    # Trend + Annual seasonality + Weekly seasonality + Noise
    n = len(dates)
    trend = np.linspace(100, 200, n)
    yearly_seasonality = 30 * np.sin(2 * np.pi * np.arange(n) / 365.25)
    weekly_seasonality = 10 * np.sin(2 * np.pi * np.arange(n) / 7)
    noise = np.random.randn(n) * 10

    values = trend + yearly_seasonality + weekly_seasonality + noise

    # Data format required by Prophet
    df = pd.DataFrame({
        'ds': dates,
        'y': values
    })

    print(f"Data range: {df['ds'].min()} to {df['ds'].max()}")
    print(f"Number of data points: {len(df)}")

    # Split into training and test sets
    train_df = df[df['ds'] < '2023-10-01']
    test_df = df[df['ds'] >= '2023-10-01']

    # Create holiday DataFrame (example)
    holidays = pd.DataFrame({
        'holiday': 'special_event',
        'ds': pd.to_datetime(['2020-07-04', '2021-07-04', '2022-07-04', '2023-07-04']),
        'lower_window': 0,
        'upper_window': 1,
    })

    # Train Prophet model
    forecaster = ProphetForecaster(
        yearly_seasonality=True,
        weekly_seasonality=True,
        holidays=holidays
    )

    # Add custom seasonality (e.g., monthly seasonality)
    forecaster.add_custom_seasonality('monthly', period=30.5, fourier_order=5)

    # Train
    forecaster.fit(train_df)

    # Predict
    forecast = forecaster.predict(periods=len(test_df))

    # Visualization
    forecaster.plot_forecast()
    forecaster.plot_components()

    # Evaluate
    predictions = forecast[forecast['ds'].isin(test_df['ds'])]['yhat'].values
    actuals = test_df['y'].values

    rmse = np.sqrt(np.mean((predictions - actuals) ** 2))
    mae = np.mean(np.abs(predictions - actuals))
    mape = np.mean(np.abs((actuals - predictions) / actuals)) * 100

    print(f"\nEvaluation Metrics:")
    print(f"RMSE: {rmse:.4f}")
    print(f"MAE: {mae:.4f}")
    print(f"MAPE: {mape:.2f}%")

    return forecaster

prophet_model = prophet_example()
```

---

## LSTM Time Series Prediction

### LSTM Principles Review

LSTM (Long Short-Term Memory) is a special RNN architecture that solves the vanishing gradient problem of traditional RNNs through gating mechanisms. It is particularly suitable for learning long-term dependencies in time series.

### Data Preprocessing

```python
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
import torch
from torch.utils.data import Dataset, DataLoader

class TimeSeriesDataset(Dataset):
    """Time Series Dataset"""

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
    """Prepare time series data"""
    # Extract target column
    data = df[target_col].values.reshape(-1, 1)

    # Normalization
    scaler = MinMaxScaler(feature_range=(0, 1))
    data_scaled = scaler.fit_transform(data)

    # Split dataset
    n = len(data_scaled)
    train_end = int(n * train_ratio)
    val_end = int(n * (train_ratio + val_ratio))

    train_data = data_scaled[:train_end]
    val_data = data_scaled[train_end:val_end]
    test_data = data_scaled[val_end:]

    # Create datasets
    train_dataset = TimeSeriesDataset(train_data, seq_length, pred_length)
    val_dataset = TimeSeriesDataset(val_data, seq_length, pred_length)
    test_dataset = TimeSeriesDataset(test_data, seq_length, pred_length)

    # Create data loaders
    train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False)
    test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False)

    print(f"Training set size: {len(train_dataset)}")
    print(f"Validation set size: {len(val_dataset)}")
    print(f"Test set size: {len(test_dataset)}")

    return train_loader, val_loader, test_loader, scaler

# Alternative method for creating sliding window data
def create_sequences(data, seq_length):
    """Create sliding window sequences"""
    X, y = [], []
    for i in range(len(data) - seq_length):
        X.append(data[i:i + seq_length])
        y.append(data[i + seq_length])
    return np.array(X), np.array(y)
```

### LSTM Model Implementation

```python
import torch
import torch.nn as nn

class LSTMModel(nn.Module):
    """LSTM Time Series Prediction Model"""

    def __init__(self, input_size=1, hidden_size=64, num_layers=2,
                 output_size=1, dropout=0.2):
        super(LSTMModel, self).__init__()

        self.hidden_size = hidden_size
        self.num_layers = num_layers

        # LSTM layers
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0,
            bidirectional=False
        )

        # Fully connected layers
        self.fc = nn.Sequential(
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_size // 2, output_size)
        )

    def forward(self, x):
        # LSTM forward pass
        lstm_out, (h_n, c_n) = self.lstm(x)

        # Use output from the last time step
        last_output = lstm_out[:, -1, :]

        # Fully connected layer
        output = self.fc(last_output)
        return output

class BiLSTMModel(nn.Module):
    """Bidirectional LSTM Time Series Prediction Model"""

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

        # Bidirectional LSTM output dimension is hidden_size * 2
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
    """LSTM Model with Attention Mechanism"""

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

        # Attention layer
        self.attention = nn.Sequential(
            nn.Linear(hidden_size, hidden_size),
            nn.Tanh(),
            nn.Linear(hidden_size, 1)
        )

        self.fc = nn.Linear(hidden_size, output_size)

    def forward(self, x):
        lstm_out, _ = self.lstm(x)  # (batch, seq_len, hidden_size)

        # Calculate attention weights
        attn_weights = self.attention(lstm_out)  # (batch, seq_len, 1)
        attn_weights = torch.softmax(attn_weights, dim=1)

        # Weighted sum
        context = torch.sum(attn_weights * lstm_out, dim=1)  # (batch, hidden_size)

        output = self.fc(context)
        return output
```

### Training and Evaluation

```python
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import matplotlib.pyplot as plt

class LSTMTrainer:
    """LSTM Trainer"""

    def __init__(self, model, device='cuda'):
        self.model = model.to(device)
        self.device = device
        self.train_losses = []
        self.val_losses = []

    def train_epoch(self, train_loader, criterion, optimizer):
        """Train one epoch"""
        self.model.train()
        total_loss = 0

        for X_batch, y_batch in train_loader:
            X_batch = X_batch.to(self.device)
            y_batch = y_batch.to(self.device)

            optimizer.zero_grad()
            predictions = self.model(X_batch)
            loss = criterion(predictions, y_batch.squeeze(-1))
            loss.backward()

            # Gradient clipping
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)

            optimizer.step()
            total_loss += loss.item()

        return total_loss / len(train_loader)

    @torch.no_grad()
    def validate(self, data_loader, criterion):
        """Evaluate model"""
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
        """Complete training process"""
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

            # Save best model
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                torch.save(self.model.state_dict(), save_path)
                patience_counter = 0
            else:
                patience_counter += 1

            # Early stopping
            if patience_counter >= patience:
                print(f'Early stopping at epoch {epoch + 1}')
                break

        # Load best model
        self.model.load_state_dict(torch.load(save_path))
        print(f'Training completed. Best val loss: {best_val_loss:.6f}')

    def plot_losses(self):
        """Plot loss curves"""
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
        """Make predictions"""
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

# Complete example
def lstm_forecast_example():
    # Set random seed
    torch.manual_seed(42)
    np.random.seed(42)

    # Create example data
    dates = pd.date_range(start='2020-01-01', periods=1000, freq='D')
    trend = np.linspace(100, 200, 1000)
    seasonality = 20 * np.sin(2 * np.pi * np.arange(1000) / 365)
    noise = np.random.randn(1000) * 5
    data = trend + seasonality + noise

    df = pd.DataFrame({'date': dates, 'value': data})
    df.set_index('date', inplace=True)

    # Prepare data
    seq_length = 60
    train_loader, val_loader, test_loader, scaler = prepare_data(
        df, 'value', seq_length=seq_length
    )

    # Set device
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f'Using device: {device}')

    # Create model
    model = LSTMModel(
        input_size=1,
        hidden_size=64,
        num_layers=2,
        output_size=1,
        dropout=0.2
    )

    # Train
    trainer = LSTMTrainer(model, device)
    trainer.train(train_loader, val_loader, epochs=100, lr=0.001)

    # Plot loss curves
    trainer.plot_losses()

    # Predict
    predictions, actuals = trainer.predict(test_loader, scaler)

    # Evaluate
    rmse = np.sqrt(np.mean((predictions - actuals) ** 2))
    mae = np.mean(np.abs(predictions - actuals))
    mape = np.mean(np.abs((actuals - predictions) / actuals)) * 100

    print(f'\nEvaluation Metrics:')
    print(f'RMSE: {rmse:.4f}')
    print(f'MAE: {mae:.4f}')
    print(f'MAPE: {mape:.2f}%')

    # Visualize prediction results
    plt.figure(figsize=(14, 6))
    plt.plot(actuals, label='Actual Values', alpha=0.7)
    plt.plot(predictions, label='Predicted Values', alpha=0.7)
    plt.legend()
    plt.title('LSTM Prediction Results')
    plt.xlabel('Time Step')
    plt.ylabel('Value')
    plt.show()

    return trainer

trainer = lstm_forecast_example()
```

### Multi-step Prediction

```python
import torch
import numpy as np

class MultiStepLSTM(nn.Module):
    """Multi-step Prediction LSTM Model"""

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
    """Recursive multi-step prediction"""
    model.set_mode_to_evaluation()
    predictions = []
    current_sequence = torch.FloatTensor(initial_sequence).unsqueeze(0).to(device)

    with torch.no_grad():
        for _ in range(n_steps):
            # Predict next step
            pred = model(current_sequence)
            predictions.append(pred.cpu().numpy()[0, 0])

            # Update sequence
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

## Model Evaluation and Selection

### Time Series Evaluation Metrics

```python
import numpy as np
from sklearn.metrics import mean_squared_error, mean_absolute_error

def calculate_metrics(y_true, y_pred):
    """Calculate time series forecasting evaluation metrics"""
    # Ensure numpy arrays
    y_true = np.array(y_true).flatten()
    y_pred = np.array(y_pred).flatten()

    # Remove NaN values
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
    print("Time Series Forecasting Evaluation Metrics")
    print("=" * 50)
    for name, value in metrics.items():
        if np.isnan(value):
            print(f"{name}: N/A")
        else:
            print(f"{name}: {value:.4f}")
    print("=" * 50)

    return metrics

# Usage example
np.random.seed(42)
y_true = np.random.randn(100) * 10 + 100
y_pred = y_true + np.random.randn(100) * 2

metrics = calculate_metrics(y_true, y_pred)
```

### Time Series Cross-Validation

```python
import numpy as np
import pandas as pd
from sklearn.model_selection import TimeSeriesSplit

def time_series_cv(model_class, data, n_splits=5, **model_params):
    """Time series cross-validation"""
    tscv = TimeSeriesSplit(n_splits=n_splits)

    scores = {
        'RMSE': [],
        'MAE': [],
        'MAPE': []
    }

    for fold, (train_idx, test_idx) in enumerate(tscv.split(data)):
        train_data = data.iloc[train_idx]
        test_data = data.iloc[test_idx]

        # Train model
        model = model_class(**model_params)
        model.fit(train_data)

        # Predict
        predictions = model.predict(len(test_data))

        # Calculate metrics
        rmse = np.sqrt(np.mean((test_data.values - predictions) ** 2))
        mae = np.mean(np.abs(test_data.values - predictions))
        mape = np.mean(np.abs((test_data.values - predictions) / test_data.values)) * 100

        scores['RMSE'].append(rmse)
        scores['MAE'].append(mae)
        scores['MAPE'].append(mape)

        print(f"Fold {fold + 1}: RMSE={rmse:.4f}, MAE={mae:.4f}, MAPE={mape:.2f}%")

    print("\nCross-validation Summary:")
    print(f"Average RMSE: {np.mean(scores['RMSE']):.4f} (+/- {np.std(scores['RMSE']):.4f})")
    print(f"Average MAE: {np.mean(scores['MAE']):.4f} (+/- {np.std(scores['MAE']):.4f})")
    print(f"Average MAPE: {np.mean(scores['MAPE']):.2f}% (+/- {np.std(scores['MAPE']):.2f}%)")

    return scores
```

---

## Practical Case Studies

### Stock Price Prediction Example

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
    """Calculate RSI indicator"""
    delta = prices.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def stock_price_prediction_example():
    """Complete stock price prediction case"""

    # 1. Generate simulated stock data
    np.random.seed(42)
    dates = pd.date_range(start='2020-01-01', periods=1000, freq='B')

    # Simulate stock price (Geometric Brownian Motion)
    mu = 0.0002  # Average daily return
    sigma = 0.02  # Volatility
    S0 = 100  # Initial price

    returns = np.random.normal(mu, sigma, len(dates))
    price = S0 * np.exp(np.cumsum(returns))

    # Add volume
    volume = np.random.randint(1000000, 10000000, len(dates))

    df = pd.DataFrame({
        'date': dates,
        'close': price,
        'volume': volume
    })
    df.set_index('date', inplace=True)

    print("Data Overview:")
    print(df.head())
    print(f"\nData shape: {df.shape}")

    # 2. Feature Engineering
    df['returns'] = df['close'].pct_change()
    df['ma_5'] = df['close'].rolling(window=5).mean()
    df['ma_20'] = df['close'].rolling(window=20).mean()
    df['volatility'] = df['returns'].rolling(window=20).std()
    df['rsi'] = calculate_rsi(df['close'], 14)

    # Remove NaN
    df = df.dropna()

    # 3. Data Preparation
    features = ['close', 'volume', 'returns', 'ma_5', 'ma_20', 'volatility', 'rsi']
    target = 'close'

    # Normalization
    scaler_X = MinMaxScaler()
    scaler_y = MinMaxScaler()

    X_scaled = scaler_X.fit_transform(df[features])
    y_scaled = scaler_y.fit_transform(df[[target]])

    # Create sequence data
    seq_length = 60
    X, y = [], []
    for i in range(len(X_scaled) - seq_length):
        X.append(X_scaled[i:i+seq_length])
        y.append(y_scaled[i+seq_length])

    X = np.array(X)
    y = np.array(y)

    # Split dataset
    train_size = int(len(X) * 0.8)
    val_size = int(len(X) * 0.1)

    X_train, y_train = X[:train_size], y[:train_size]
    X_val, y_val = X[train_size:train_size+val_size], y[train_size:train_size+val_size]
    X_test, y_test = X[train_size+val_size:], y[train_size+val_size:]

    print(f"\nTraining set: {X_train.shape}")
    print(f"Validation set: {X_val.shape}")
    print(f"Test set: {X_test.shape}")

    # 4. Convert to PyTorch tensors
    X_train_t = torch.FloatTensor(X_train)
    y_train_t = torch.FloatTensor(y_train)
    X_val_t = torch.FloatTensor(X_val)
    y_val_t = torch.FloatTensor(y_val)
    X_test_t = torch.FloatTensor(X_test)

    # 5. Define model
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

    # 6. Training
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001)

    best_val_loss = float('inf')
    train_losses, val_losses = [], []

    for epoch in range(100):
        # Training
        model.train()
        optimizer.zero_grad()
        outputs = model(X_train_t.to(device))
        loss = criterion(outputs, y_train_t.to(device))
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()
        train_losses.append(loss.item())

        # Validation
        model.set_mode_to_evaluation()
        with torch.no_grad():
            val_outputs = model(X_val_t.to(device))
            val_loss = criterion(val_outputs, y_val_t.to(device))
            val_losses.append(val_loss.item())

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(model.state_dict(), 'best_stock_model.pt')

        if (epoch + 1) % 10 == 0:
            print(f'Epoch [{epoch+1}/100], Train Loss: {loss.item():.6f}, Val Loss: {val_loss.item():.6f}')

    # 7. Testing
    model.load_state_dict(torch.load('best_stock_model.pt'))
    model.set_mode_to_evaluation()

    with torch.no_grad():
        predictions = model(X_test_t.to(device)).cpu().numpy()

    # Inverse normalization
    predictions = scaler_y.inverse_transform(predictions)
    actuals = scaler_y.inverse_transform(y_test)

    # 8. Evaluation
    rmse = np.sqrt(np.mean((predictions - actuals) ** 2))
    mae = np.mean(np.abs(predictions - actuals))
    mape = np.mean(np.abs((actuals - predictions) / actuals)) * 100

    print(f'\nTest Set Evaluation:')
    print(f'RMSE: {rmse:.4f}')
    print(f'MAE: {mae:.4f}')
    print(f'MAPE: {mape:.2f}%')

    # 9. Visualization
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))

    # Loss curves
    axes[0, 0].plot(train_losses, label='Train Loss')
    axes[0, 0].plot(val_losses, label='Val Loss')
    axes[0, 0].set_title('Training Loss Curve')
    axes[0, 0].legend()

    # Prediction vs Actual
    axes[0, 1].plot(actuals, label='Actual Price', alpha=0.7)
    axes[0, 1].plot(predictions, label='Predicted Price', alpha=0.7)
    axes[0, 1].set_title('Stock Price Prediction')
    axes[0, 1].legend()

    # Prediction error distribution
    errors = predictions.flatten() - actuals.flatten()
    axes[1, 0].hist(errors, bins=50, edgecolor='black')
    axes[1, 0].set_title('Prediction Error Distribution')
    axes[1, 0].axvline(x=0, color='r', linestyle='--')

    # Scatter plot
    axes[1, 1].scatter(actuals, predictions, alpha=0.5)
    axes[1, 1].plot([actuals.min(), actuals.max()], [actuals.min(), actuals.max()], 'r--')
    axes[1, 1].set_xlabel('Actual Price')
    axes[1, 1].set_ylabel('Predicted Price')
    axes[1, 1].set_title('Predicted vs Actual Values')

    plt.tight_layout()
    plt.show()

    return model, scaler_X, scaler_y

# Run example
model, scaler_X, scaler_y = stock_price_prediction_example()
```

---

## Interview Key Points

### Common Interview Questions

**Q1: What are the differences between time series data and regular data?**

Main characteristics of time series data:
- **Temporal dependence**: Data points have dependency relationships in chronological order
- **Non-i.i.d.**: Does not satisfy the independent and identically distributed assumption
- **Autocorrelation**: Current values are correlated with historical values
- **Trend and seasonality**: May exhibit long-term trends and periodic changes
- **Data splitting requirements**: Must be split in chronological order, cannot be randomly shuffled

**Q2: What is stationarity? Why do we need to test for stationarity?**

Stationarity means that the statistical properties (mean, variance, autocovariance) of a time series do not change over time.

Reasons for testing stationarity:
- Many classical models (such as ARIMA) require stationary data
- Non-stationary data may lead to spurious regression
- Stationarity is a fundamental assumption for modeling and forecasting

Testing methods: ADF test, KPSS test, PP test

**Q3: How to select p, d, q parameters in an ARIMA model?**

- d (differencing order): Determine through ADF test the number of differences needed to make the series stationary
- p (AR order): Observe the PACF plot to find the cutoff point
- q (MA order): Observe the ACF plot to find the cutoff point

In practice, auto_arima is commonly used for automatic selection.

**Q4: What are the main differences between Prophet and ARIMA?**

| Feature | ARIMA | Prophet |
|---------|-------|---------|
| Use case | General time series | Business time series |
| Seasonality handling | Manual SARIMA specification required | Automatic multiple seasonality handling |
| Holiday effects | Not supported | Native support |
| Missing values | Need to be filled | Automatically handled |
| Interpretability | Lower | Component interpretable |
| Ease of use | Requires expertise | Relatively simple |

**Q5: How does LSTM handle time series data? What are its advantages?**

How LSTM processes time series:
- Uses sliding windows to create input sequences
- Captures long-term dependencies through gating mechanisms
- Hidden states pass historical information

Advantages:
- Can learn complex nonlinear patterns
- Handles long-term dependencies
- Does not require stationary data
- Can handle multivariate inputs

**Q6: How to avoid data leakage in time series forecasting?**

Correct practices:
1. Split data in chronological order
2. Fit feature engineering only on the training set
3. Use time series cross-validation (TimeSeriesSplit)

**Q7: How to evaluate time series forecasting models?**

Common evaluation metrics:
- **RMSE**: Sensitive to large errors
- **MAE**: Intuitive and easy to interpret
- **MAPE**: Percentage error, convenient for comparison
- **SMAPE**: Symmetric MAPE, handles values close to zero

Evaluation methods:
- Time series cross-validation
- Sliding window validation
- Multi-step prediction evaluation

### Practical Tips Summary

1. **Data Preprocessing**:
   - Handle missing values and outliers
   - Test and achieve stationarity
   - Proper feature engineering

2. **Model Selection**:
   - Use ARIMA/ETS for simple problems
   - Use Prophet for business data
   - Use deep learning for complex patterns

3. **Training Techniques**:
   - Use validation set for early stopping
   - Proper learning rate scheduling
   - Gradient clipping to prevent gradient explosion

4. **Deployment Considerations**:
   - Regular model retraining
   - Monitor prediction performance
   - Set up alerting mechanisms

---

## Summary

Time series analysis is an important skill in data science. This article covered:

1. **Fundamental Concepts**: Core concepts of time series components, stationarity, differencing, etc.
2. **Classical Methods**: Principles and applications of ARIMA/SARIMA models
3. **Modern Tools**: Usage and advanced features of the Prophet framework
4. **Deep Learning**: Application of neural networks like LSTM in time series forecasting
5. **Engineering Practices**: Practical techniques for model evaluation, cross-validation, feature engineering, etc.

Mastering time series analysis requires combining theory with practice. Recommendations:

- Fully understand statistical fundamentals (stationarity, autocorrelation)
- Practice more projects and accumulate practical experience
- Choose appropriate methods based on specific scenarios
- Stay updated on latest technological developments (such as Transformer applications in time series)

Time series forecasting is a continuously evolving field with new methods and techniques emerging constantly. Maintaining enthusiasm for learning and continuously improving your skills will help you excel in practical work.
