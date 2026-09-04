---
title: "Time Series Analysis: Traditional Statistical Methods"
description: "Master classic time series methods: ARIMA, SARIMA, exponential smoothing, and Prophet"
track: datascience
section: classical-ml
difficulty: intermediate
tags:
  - time series
  - ARIMA
  - Prophet
  - forecasting
status: imported
origin: old/src/content/docs/datascience/time-series-traditional.en.md
divergence: 0.152
issues: []
legacy:
  category: DataScience
  subcategory: TimeSeries
  order: 21
  lastUpdated: 2026-01-07
---

Time series analysis is a fundamental skill for data scientists working with sequential data. Whether forecasting sales, predicting stock prices, or planning resource allocation, traditional statistical methods provide robust, interpretable solutions that remain highly relevant even in the age of deep learning. We cover classical time series methods, from foundational concepts to practical Python implementations.

## Understanding Time Series Fundamentals

A time series is a sequence of observations recorded at successive points in time. Unlike cross-sectional data, time series data exhibits temporal dependencies where the order of observations matters and past values influence future ones.

### Components of a Time Series

Every time series can be decomposed into four fundamental components:

**Trend**: The long-term movement or direction in the data. It represents the underlying growth or decline pattern over extended periods. For example, global GDP data typically shows an upward trend over decades.

**Seasonality**: Regular, predictable patterns that repeat at fixed intervals. These patterns are tied to calendar periods such as daily, weekly, monthly, or yearly cycles. Retail sales peaking during holidays or electricity consumption varying by time of day are classic examples.

**Cyclical Patterns**: Longer-term fluctuations that are not of fixed period. Unlike seasonality, cycles do not have a predetermined length. Economic business cycles lasting 5-10 years exemplify cyclical behavior.

**Residual (Noise)**: The random, irregular component that cannot be explained by trend, seasonality, or cycles. This represents the unpredictable variation in the data.

```python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from statsmodels.tsa.seasonal import seasonal_decompose

# Generate synthetic time series data
np.random.seed(42)
dates = pd.date_range(start='2020-01-01', periods=730, freq='D')

# Create components
trend = np.linspace(100, 180, 730)
seasonal = 20 * np.sin(2 * np.pi * np.arange(730) / 365)
weekly = 5 * np.sin(2 * np.pi * np.arange(730) / 7)
noise = np.random.normal(0, 5, 730)

# Combine into time series
data = trend + seasonal + weekly + noise
ts = pd.Series(data, index=dates, name='Sales')

# Perform decomposition
decomposition = seasonal_decompose(ts, model='additive', period=365)

# Visualize all components
fig, axes = plt.subplots(4, 1, figsize=(14, 12))
decomposition.observed.plot(ax=axes[0], title='Original Time Series')
decomposition.trend.plot(ax=axes[1], title='Trend Component')
decomposition.seasonal.plot(ax=axes[2], title='Seasonal Component')
decomposition.resid.plot(ax=axes[3], title='Residual Component')
plt.tight_layout()
plt.show()

# Print summary statistics
print(f"Time Series Summary:")
print(f"  Period: {ts.index[0]} to {ts.index[-1]}")
print(f"  Number of observations: {len(ts)}")
print(f"  Mean: {ts.mean():.2f}")
print(f"  Std Dev: {ts.std():.2f}")
print(f"  Min: {ts.min():.2f}")
print(f"  Max: {ts.max():.2f}")
```

### Additive vs Multiplicative Decomposition

The choice between additive and multiplicative decomposition depends on how the components interact:

**Additive Model**: Y(t) = Trend + Seasonality + Residual
- Use when seasonal fluctuations are constant regardless of the level
- Appropriate when the data does not show increasing variance over time

**Multiplicative Model**: Y(t) = Trend x Seasonality x Residual
- Use when seasonal fluctuations grow proportionally with the level
- Common in economic and financial data where percentage changes are more meaningful

```python
# Compare additive and multiplicative decomposition
fig, axes = plt.subplots(2, 4, figsize=(16, 8))

# Create data with multiplicative seasonality
trend_mult = np.linspace(100, 300, 730)
seasonal_mult = 1 + 0.2 * np.sin(2 * np.pi * np.arange(730) / 365)
noise_mult = np.random.normal(1, 0.05, 730)
data_mult = trend_mult * seasonal_mult * noise_mult
ts_mult = pd.Series(data_mult, index=dates, name='Multiplicative Series')

# Additive decomposition
decomp_add = seasonal_decompose(ts_mult, model='additive', period=365)
decomp_add.observed.plot(ax=axes[0, 0], title='Observed (Additive)')
decomp_add.trend.plot(ax=axes[0, 1], title='Trend')
decomp_add.seasonal.plot(ax=axes[0, 2], title='Seasonal')
decomp_add.resid.plot(ax=axes[0, 3], title='Residual')

# Multiplicative decomposition
decomp_mult = seasonal_decompose(ts_mult, model='multiplicative', period=365)
decomp_mult.observed.plot(ax=axes[1, 0], title='Observed (Multiplicative)')
decomp_mult.trend.plot(ax=axes[1, 1], title='Trend')
decomp_mult.seasonal.plot(ax=axes[1, 2], title='Seasonal')
decomp_mult.resid.plot(ax=axes[1, 3], title='Residual')

plt.tight_layout()
plt.show()
```

## Stationarity: The Foundation of Time Series Analysis

Stationarity is perhaps the most critical concept in classical time series analysis. A stationary time series has statistical properties that do not depend on the time at which the series is observed.

### Types of Stationarity

**Strict Stationarity**: The joint probability distribution of any collection of observations is invariant to time shifts. This is a very strong condition rarely met in practice.

**Weak (Covariance) Stationarity**: A more practical definition requiring:
1. Constant mean: E[Y(t)] = mu for all t
2. Constant variance: Var[Y(t)] = sigma^2 for all t
3. Autocovariance depends only on lag: Cov[Y(t), Y(t+k)] = gamma(k) for all t

### Why Stationarity Matters

Most classical time series models (ARMA, ARIMA) assume stationarity because:
- Statistical properties remain constant, enabling reliable parameter estimation
- Forecasts become meaningful as future behavior mirrors past behavior
- Mathematical tractability allows derivation of model properties

### Testing for Stationarity: The Augmented Dickey-Fuller (ADF) Test

The ADF test is the most widely used test for stationarity. It tests the null hypothesis that a unit root is present (series is non-stationary).

```python
from statsmodels.tsa.stattools import adfuller, kpss
import warnings
warnings.filterwarnings('ignore')

def adf_test(series, name='Time Series'):
    """
    Perform Augmented Dickey-Fuller test for stationarity.

    H0: Series has a unit root (non-stationary)
    H1: Series is stationary
    """
    result = adfuller(series.dropna(), autolag='AIC')

    print(f"\n{'='*60}")
    print(f"Augmented Dickey-Fuller Test: {name}")
    print(f"{'='*60}")
    print(f"Test Statistic:   {result[0]:.6f}")
    print(f"P-Value:          {result[1]:.6f}")
    print(f"Lags Used:        {result[2]}")
    print(f"Observations:     {result[3]}")
    print(f"\nCritical Values:")
    for key, value in result[4].items():
        print(f"  {key}: {value:.4f}")

    # Interpretation
    if result[1] < 0.05:
        print(f"\nConclusion: REJECT H0 - Series is STATIONARY (p < 0.05)")
    else:
        print(f"\nConclusion: FAIL TO REJECT H0 - Series is NON-STATIONARY")

    return result[1] < 0.05

# Test our original series
is_stationary = adf_test(ts, 'Original Sales Data')
```

### The KPSS Test: A Complementary Approach

While ADF tests for the presence of a unit root, the KPSS test has the opposite null hypothesis: the series is stationary.

```python
def kpss_test(series, name='Time Series', regression='c'):
    """
    Perform KPSS test for stationarity.

    H0: Series is stationary
    H1: Series has a unit root (non-stationary)

    regression: 'c' for constant (level stationarity)
                'ct' for constant + trend (trend stationarity)
    """
    result = kpss(series.dropna(), regression=regression, nlags='auto')

    print(f"\n{'='*60}")
    print(f"KPSS Test: {name}")
    print(f"{'='*60}")
    print(f"Test Statistic:   {result[0]:.6f}")
    print(f"P-Value:          {result[1]:.6f}")
    print(f"Lags Used:        {result[2]}")
    print(f"\nCritical Values:")
    for key, value in result[3].items():
        print(f"  {key}: {value:.4f}")

    if result[1] < 0.05:
        print(f"\nConclusion: REJECT H0 - Series is NON-STATIONARY (p < 0.05)")
    else:
        print(f"\nConclusion: FAIL TO REJECT H0 - Series is STATIONARY")

    return result[1] >= 0.05

# Combined stationarity assessment
def comprehensive_stationarity_test(series, name='Time Series'):
    """
    Perform both ADF and KPSS tests for robust stationarity assessment.

    Interpretation:
    - ADF rejects, KPSS fails to reject: Stationary
    - ADF fails to reject, KPSS rejects: Non-stationary
    - Both reject: Difference stationary (has unit root but also deterministic trend)
    - Neither rejects: Trend stationary (stationary around deterministic trend)
    """
    adf_stationary = adf_test(series, name)
    kpss_stationary = kpss_test(series, name)

    print(f"\n{'='*60}")
    print(f"Combined Assessment: {name}")
    print(f"{'='*60}")

    if adf_stationary and kpss_stationary:
        print("Result: Series is STATIONARY")
        return True
    elif not adf_stationary and not kpss_stationary:
        print("Result: Series is NON-STATIONARY (unit root present)")
        return False
    elif adf_stationary and not kpss_stationary:
        print("Result: Series is DIFFERENCE STATIONARY")
        return False
    else:
        print("Result: Series is TREND STATIONARY")
        return False

comprehensive_stationarity_test(ts, 'Sales Data')
```

### Making Data Stationary: Differencing and Transformation

Non-stationary data can often be transformed to achieve stationarity through differencing, log transformation, or a combination of both.

```python
def make_stationary(series, max_diff=2, test_log=True):
    """
    Attempt to make a series stationary through differencing and/or log transformation.
    Returns the transformed series and the transformations applied.
    """
    results = []

    # Test original series
    adf_result = adfuller(series.dropna(), autolag='AIC')
    results.append({
        'transformation': 'Original',
        'adf_stat': adf_result[0],
        'p_value': adf_result[1],
        'stationary': adf_result[1] < 0.05,
        'series': series
    })

    # Test log transformation (if all values positive)
    if test_log and (series > 0).all():
        log_series = np.log(series)
        adf_result = adfuller(log_series.dropna(), autolag='AIC')
        results.append({
            'transformation': 'Log',
            'adf_stat': adf_result[0],
            'p_value': adf_result[1],
            'stationary': adf_result[1] < 0.05,
            'series': log_series
        })

    # Test differencing
    for d in range(1, max_diff + 1):
        diff_series = series.diff(d).dropna()
        adf_result = adfuller(diff_series, autolag='AIC')
        results.append({
            'transformation': f'Diff(d={d})',
            'adf_stat': adf_result[0],
            'p_value': adf_result[1],
            'stationary': adf_result[1] < 0.05,
            'series': diff_series
        })

        # Log + differencing
        if test_log and (series > 0).all():
            log_diff_series = np.log(series).diff(d).dropna()
            adf_result = adfuller(log_diff_series, autolag='AIC')
            results.append({
                'transformation': f'Log + Diff(d={d})',
                'adf_stat': adf_result[0],
                'p_value': adf_result[1],
                'stationary': adf_result[1] < 0.05,
                'series': log_diff_series
            })

    # Display results
    results_df = pd.DataFrame(results)[['transformation', 'adf_stat', 'p_value', 'stationary']]
    print("\nStationarity Transformation Results:")
    print(results_df.to_string(index=False))

    # Return first stationary transformation
    for r in results:
        if r['stationary']:
            print(f"\nRecommended transformation: {r['transformation']}")
            return r['series'], r['transformation']

    print("\nWarning: Could not achieve stationarity with tested transformations")
    return series, 'None'

# Apply to our data
stationary_series, transformation = make_stationary(ts)

# Visualize original vs stationary
fig, axes = plt.subplots(2, 1, figsize=(14, 8))
ts.plot(ax=axes[0], title='Original Series')
stationary_series.plot(ax=axes[1], title=f'Stationary Series ({transformation})')
plt.tight_layout()
plt.show()
```

## Autocorrelation and Partial Autocorrelation

Understanding autocorrelation is essential for identifying appropriate time series models and detecting patterns in the data.

### Autocorrelation Function (ACF)

The autocorrelation function measures the correlation between a time series and its lagged values. It captures both direct and indirect relationships between observations.

```python
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf
from statsmodels.tsa.stattools import acf, pacf

def analyze_autocorrelation(series, lags=40, title=''):
    """
    Comprehensive autocorrelation analysis with ACF and PACF plots.
    """
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))

    # Time series plot
    series.plot(ax=axes[0, 0], title=f'{title} - Time Series')
    axes[0, 0].set_xlabel('Date')
    axes[0, 0].set_ylabel('Value')

    # Distribution
    series.hist(ax=axes[0, 1], bins=30, edgecolor='black')
    axes[0, 1].set_title(f'{title} - Distribution')

    # ACF plot
    plot_acf(series.dropna(), lags=lags, ax=axes[1, 0], title='Autocorrelation Function (ACF)')

    # PACF plot
    plot_pacf(series.dropna(), lags=lags, ax=axes[1, 1], title='Partial Autocorrelation Function (PACF)')

    plt.tight_layout()
    plt.show()

    # Print significant lags
    acf_values = acf(series.dropna(), nlags=lags)
    pacf_values = pacf(series.dropna(), nlags=lags)

    # Confidence interval (approximate)
    conf_int = 1.96 / np.sqrt(len(series))

    print(f"\nSignificant ACF lags (outside +/- {conf_int:.4f}):")
    significant_acf = [(i, acf_values[i]) for i in range(1, len(acf_values))
                       if abs(acf_values[i]) > conf_int]
    for lag, val in significant_acf[:10]:
        print(f"  Lag {lag}: {val:.4f}")

    print(f"\nSignificant PACF lags:")
    significant_pacf = [(i, pacf_values[i]) for i in range(1, len(pacf_values))
                        if abs(pacf_values[i]) > conf_int]
    for lag, val in significant_pacf[:10]:
        print(f"  Lag {lag}: {val:.4f}")

# Analyze our stationary series
analyze_autocorrelation(stationary_series, lags=50, title='Differenced Sales Data')
```

### Partial Autocorrelation Function (PACF)

The PACF measures the direct correlation between a time series and its lag, after removing the effects of intermediate lags. This is crucial for identifying the order of AR models.

### Interpreting ACF and PACF for Model Selection

The patterns in ACF and PACF plots guide the selection of ARIMA model parameters:

| Pattern | ACF | PACF | Model |
|---------|-----|------|-------|
| AR(p) | Exponential decay or damped oscillation | Cuts off after lag p | Autoregressive |
| MA(q) | Cuts off after lag q | Exponential decay or damped oscillation | Moving Average |
| ARMA(p,q) | Exponential decay | Exponential decay | Mixed model |

```python
# Generate example patterns for different models
from statsmodels.tsa.arima_process import ArmaProcess
np.random.seed(42)

fig, axes = plt.subplots(3, 3, figsize=(15, 12))

# AR(1) process
ar1 = np.array([1, -0.7])
ma1 = np.array([1])
ar1_process = ArmaProcess(ar1, ma1)
ar1_data = ar1_process.generate_sample(500)

axes[0, 0].plot(ar1_data)
axes[0, 0].set_title('AR(1) Process')
plot_acf(ar1_data, ax=axes[0, 1], lags=20, title='AR(1) ACF')
plot_pacf(ar1_data, ax=axes[0, 2], lags=20, title='AR(1) PACF')

# MA(1) process
ar2 = np.array([1])
ma2 = np.array([1, 0.7])
ma1_process = ArmaProcess(ar2, ma2)
ma1_data = ma1_process.generate_sample(500)

axes[1, 0].plot(ma1_data)
axes[1, 0].set_title('MA(1) Process')
plot_acf(ma1_data, ax=axes[1, 1], lags=20, title='MA(1) ACF')
plot_pacf(ma1_data, ax=axes[1, 2], lags=20, title='MA(1) PACF')

# ARMA(1,1) process
ar3 = np.array([1, -0.7])
ma3 = np.array([1, 0.7])
arma_process = ArmaProcess(ar3, ma3)
arma_data = arma_process.generate_sample(500)

axes[2, 0].plot(arma_data)
axes[2, 0].set_title('ARMA(1,1) Process')
plot_acf(arma_data, ax=axes[2, 1], lags=20, title='ARMA(1,1) ACF')
plot_pacf(arma_data, ax=axes[2, 2], lags=20, title='ARMA(1,1) PACF')

plt.tight_layout()
plt.show()
```

## ARIMA Models: The Workhorse of Time Series Forecasting

ARIMA (AutoRegressive Integrated Moving Average) is the most widely used classical time series forecasting method. It combines three components to model complex temporal patterns.

### Understanding ARIMA Components

**AR (AutoRegressive) Component - p**: Uses past values to predict future values.
$$Y_t = c + \phi_1 Y_{t-1} + \phi_2 Y_{t-2} + ... + \phi_p Y_{t-p} + \epsilon_t$$

**I (Integrated) Component - d**: The number of differences needed to achieve stationarity.

**MA (Moving Average) Component - q**: Uses past forecast errors to predict future values.
$$Y_t = c + \epsilon_t + \theta_1 \epsilon_{t-1} + \theta_2 \epsilon_{t-2} + ... + \theta_q \epsilon_{t-q}$$

### ARIMA(p, d, q) Notation

The model is specified by three parameters:
- **p**: Order of the autoregressive component
- **d**: Degree of differencing
- **q**: Order of the moving average component

```python
from statsmodels.tsa.arima.model import ARIMA

# Generate example data
np.random.seed(42)
dates = pd.date_range(start='2020-01-01', periods=500, freq='D')
trend = np.linspace(100, 150, 500)
seasonal = 10 * np.sin(2 * np.pi * np.arange(500) / 30)
noise = np.random.normal(0, 3, 500)
arima_data = pd.Series(trend + seasonal + noise, index=dates, name='Value')

# Split into train and test
train_size = int(len(arima_data) * 0.8)
train, test = arima_data[:train_size], arima_data[train_size:]

print(f"Training set: {len(train)} observations")
print(f"Test set: {len(test)} observations")

# Fit ARIMA model
model = ARIMA(train, order=(2, 1, 2))
fitted_model = model.fit()

# Display model summary
print(fitted_model.summary())
```

### Model Diagnostics

Proper model diagnostics are essential to validate ARIMA model assumptions.

```python
def arima_diagnostics(model_fit, title='ARIMA Model'):
    """
    Comprehensive ARIMA model diagnostics.
    """
    residuals = model_fit.resid

    fig, axes = plt.subplots(2, 2, figsize=(14, 10))

    # Residuals over time
    residuals.plot(ax=axes[0, 0], title='Residuals Over Time')
    axes[0, 0].axhline(y=0, color='r', linestyle='--')
    axes[0, 0].set_xlabel('Date')
    axes[0, 0].set_ylabel('Residual')

    # Histogram of residuals
    residuals.hist(ax=axes[0, 1], bins=30, edgecolor='black', density=True)

    # Overlay normal distribution
    x = np.linspace(residuals.min(), residuals.max(), 100)
    from scipy import stats
    axes[0, 1].plot(x, stats.norm.pdf(x, residuals.mean(), residuals.std()),
                    'r-', linewidth=2, label='Normal')
    axes[0, 1].set_title('Residual Distribution')
    axes[0, 1].legend()

    # Q-Q plot
    stats.probplot(residuals, dist="norm", plot=axes[1, 0])
    axes[1, 0].set_title('Q-Q Plot')

    # ACF of residuals
    plot_acf(residuals, ax=axes[1, 1], lags=30, title='ACF of Residuals')

    plt.suptitle(f'{title} - Diagnostic Plots', fontsize=14, y=1.02)
    plt.tight_layout()
    plt.show()

    # Statistical tests
    print("\n" + "="*60)
    print("Residual Diagnostic Tests")
    print("="*60)

    # Ljung-Box test for autocorrelation
    from statsmodels.stats.diagnostic import acorr_ljungbox
    lb_result = acorr_ljungbox(residuals, lags=[10, 20, 30], return_df=True)
    print("\nLjung-Box Test for Autocorrelation:")
    print(lb_result)

    # Shapiro-Wilk test for normality
    if len(residuals) <= 5000:
        shapiro_stat, shapiro_p = stats.shapiro(residuals)
        print(f"\nShapiro-Wilk Test for Normality:")
        print(f"  Statistic: {shapiro_stat:.4f}")
        print(f"  P-value: {shapiro_p:.4f}")
        if shapiro_p > 0.05:
            print("  Conclusion: Residuals appear normally distributed")
        else:
            print("  Conclusion: Residuals deviate from normality")

    # Jarque-Bera test
    jb_stat, jb_p, skew, kurt = stats.jarque_bera(residuals)
    print(f"\nJarque-Bera Test:")
    print(f"  Statistic: {jb_stat:.4f}")
    print(f"  P-value: {jb_p:.4f}")
    print(f"  Skewness: {skew:.4f}")
    print(f"  Kurtosis: {kurt:.4f}")

# Run diagnostics on our fitted model
arima_diagnostics(fitted_model, 'ARIMA(2,1,2)')
```

### Forecasting with ARIMA

```python
def forecast_arima(model_fit, steps, test_data=None):
    """
    Generate forecasts with confidence intervals.
    """
    # Get forecast
    forecast_result = model_fit.get_forecast(steps=steps)
    forecast_mean = forecast_result.predicted_mean
    forecast_ci = forecast_result.conf_int(alpha=0.05)

    # Create visualization
    fig, ax = plt.subplots(figsize=(14, 6))

    # Plot training data
    train.plot(ax=ax, label='Training Data', color='blue')

    # Plot forecast
    forecast_mean.plot(ax=ax, label='Forecast', color='red')

    # Plot confidence interval
    ax.fill_between(forecast_ci.index,
                    forecast_ci.iloc[:, 0],
                    forecast_ci.iloc[:, 1],
                    color='red', alpha=0.2, label='95% Confidence Interval')

    # Plot actual test data if provided
    if test_data is not None:
        test_data.plot(ax=ax, label='Actual', color='green', linestyle='--')

    ax.set_title('ARIMA Forecast')
    ax.set_xlabel('Date')
    ax.set_ylabel('Value')
    ax.legend()
    plt.tight_layout()
    plt.show()

    # Calculate forecast accuracy if test data provided
    if test_data is not None:
        from sklearn.metrics import mean_absolute_error, mean_squared_error

        mae = mean_absolute_error(test_data, forecast_mean)
        rmse = np.sqrt(mean_squared_error(test_data, forecast_mean))
        mape = np.mean(np.abs((test_data - forecast_mean) / test_data)) * 100

        print("\nForecast Accuracy Metrics:")
        print(f"  MAE:  {mae:.4f}")
        print(f"  RMSE: {rmse:.4f}")
        print(f"  MAPE: {mape:.2f}%")

    return forecast_mean, forecast_ci

# Generate forecast
forecast_mean, forecast_ci = forecast_arima(fitted_model, steps=len(test), test_data=test)
```

### Automatic Parameter Selection with Auto-ARIMA

Manually selecting ARIMA parameters can be tedious. The `pmdarima` library automates this process using information criteria.

```python
import pmdarima as pm

def auto_arima_model(series, seasonal=False, m=1, trace=True):
    """
    Automatically find the best ARIMA parameters.

    Parameters:
    - series: Time series data
    - seasonal: Whether to fit seasonal ARIMA
    - m: Seasonal period
    - trace: Whether to print search progress
    """
    auto_model = pm.auto_arima(
        series,
        start_p=0, start_q=0,
        max_p=5, max_q=5,
        d=None,           # Auto-detect differencing
        start_P=0, start_Q=0,
        max_P=2, max_Q=2,
        D=None,           # Auto-detect seasonal differencing
        m=m,              # Seasonal period
        seasonal=seasonal,
        trace=trace,
        error_action='ignore',
        suppress_warnings=True,
        stepwise=True,
        information_criterion='aic',
        n_fits=50
    )

    print("\n" + "="*60)
    print("Best Model Found")
    print("="*60)
    print(f"Order: {auto_model.order}")
    if seasonal:
        print(f"Seasonal Order: {auto_model.seasonal_order}")
    print(f"AIC: {auto_model.aic():.2f}")
    print(f"BIC: {auto_model.bic():.2f}")

    return auto_model

# Find best model automatically
best_model = auto_arima_model(train, seasonal=False)
print(best_model.summary())
```

## Seasonal ARIMA (SARIMA)

When data exhibits seasonal patterns, SARIMA extends ARIMA to capture both non-seasonal and seasonal dynamics.

### SARIMA Model Structure

SARIMA is denoted as ARIMA(p, d, q)(P, D, Q)m where:
- (p, d, q): Non-seasonal parameters
- (P, D, Q): Seasonal parameters
- m: Seasonal period (e.g., 12 for monthly data with yearly seasonality)

```python
from statsmodels.tsa.statespace.sarimax import SARIMAX

# Generate seasonal data
np.random.seed(42)
dates = pd.date_range(start='2018-01-01', periods=156, freq='W')  # 3 years of weekly data
trend = np.linspace(100, 150, 156)
seasonal_yearly = 20 * np.sin(2 * np.pi * np.arange(156) / 52)
noise = np.random.normal(0, 5, 156)
seasonal_data = pd.Series(trend + seasonal_yearly + noise, index=dates, name='Weekly Sales')

# Split data
train_seasonal = seasonal_data[:-26]  # Keep last 26 weeks for testing
test_seasonal = seasonal_data[-26:]

print(f"Training period: {train_seasonal.index[0]} to {train_seasonal.index[-1]}")
print(f"Test period: {test_seasonal.index[0]} to {test_seasonal.index[-1]}")

# Fit SARIMA model
sarima_model = SARIMAX(
    train_seasonal,
    order=(1, 1, 1),
    seasonal_order=(1, 1, 1, 52),  # Yearly seasonality in weekly data
    enforce_stationarity=False,
    enforce_invertibility=False
)

sarima_fit = sarima_model.fit(disp=False)
print(sarima_fit.summary())
```

### SARIMA Forecasting and Evaluation

```python
def sarima_forecast(model_fit, train_data, test_data, title='SARIMA'):
    """
    Generate SARIMA forecasts and evaluate performance.
    """
    # Get forecast
    forecast = model_fit.get_forecast(steps=len(test_data))
    forecast_mean = forecast.predicted_mean
    forecast_ci = forecast.conf_int(alpha=0.05)

    # Align indices
    forecast_mean.index = test_data.index
    forecast_ci.index = test_data.index

    # Plot
    fig, axes = plt.subplots(2, 1, figsize=(14, 10))

    # Full series view
    train_data.plot(ax=axes[0], label='Training', color='blue')
    test_data.plot(ax=axes[0], label='Actual', color='green')
    forecast_mean.plot(ax=axes[0], label='Forecast', color='red')
    axes[0].fill_between(forecast_ci.index,
                         forecast_ci.iloc[:, 0],
                         forecast_ci.iloc[:, 1],
                         color='red', alpha=0.2)
    axes[0].set_title(f'{title} - Full Series View')
    axes[0].legend()

    # Zoomed view on forecast period
    test_data.plot(ax=axes[1], label='Actual', color='green', marker='o')
    forecast_mean.plot(ax=axes[1], label='Forecast', color='red', marker='x')
    axes[1].fill_between(forecast_ci.index,
                         forecast_ci.iloc[:, 0],
                         forecast_ci.iloc[:, 1],
                         color='red', alpha=0.2)
    axes[1].set_title(f'{title} - Forecast Period Detail')
    axes[1].legend()

    plt.tight_layout()
    plt.show()

    # Calculate metrics
    from sklearn.metrics import mean_absolute_error, mean_squared_error

    mae = mean_absolute_error(test_data, forecast_mean)
    rmse = np.sqrt(mean_squared_error(test_data, forecast_mean))
    mape = np.mean(np.abs((test_data - forecast_mean) / test_data)) * 100

    print("\n" + "="*60)
    print(f"{title} Forecast Accuracy")
    print("="*60)
    print(f"MAE:  {mae:.4f}")
    print(f"RMSE: {rmse:.4f}")
    print(f"MAPE: {mape:.2f}%")

    return forecast_mean, forecast_ci

# Generate SARIMA forecast
sarima_forecast_mean, sarima_forecast_ci = sarima_forecast(
    sarima_fit, train_seasonal, test_seasonal, 'SARIMA(1,1,1)(1,1,1,52)'
)
```

### Auto-SARIMA for Seasonal Data

```python
# Automatic SARIMA parameter selection
seasonal_auto_model = auto_arima_model(
    train_seasonal,
    seasonal=True,
    m=52,  # Weekly data with yearly seasonality
    trace=True
)

# Forecast with auto-selected model
auto_forecast, auto_ci = seasonal_auto_model.predict(
    n_periods=len(test_seasonal),
    return_conf_int=True
)

# Evaluate
auto_forecast_series = pd.Series(auto_forecast, index=test_seasonal.index)
from sklearn.metrics import mean_absolute_error, mean_squared_error

print("\nAuto-SARIMA Forecast Accuracy:")
print(f"MAE:  {mean_absolute_error(test_seasonal, auto_forecast_series):.4f}")
print(f"RMSE: {np.sqrt(mean_squared_error(test_seasonal, auto_forecast_series)):.4f}")
```

## Exponential Smoothing Methods

Exponential smoothing methods are elegant alternatives to ARIMA that weight recent observations more heavily than distant ones.

### Simple Exponential Smoothing (SES)

SES is appropriate for data without trend or seasonality. It produces forecasts that are weighted averages of past observations.

```python
from statsmodels.tsa.holtwinters import SimpleExpSmoothing, ExponentialSmoothing

# Simple Exponential Smoothing
def simple_exponential_smoothing_demo(series, alpha_values=[0.1, 0.5, 0.9]):
    """
    Demonstrate Simple Exponential Smoothing with different smoothing parameters.
    """
    fig, ax = plt.subplots(figsize=(14, 6))

    series.plot(ax=ax, label='Actual', color='black', linewidth=2)

    colors = ['red', 'green', 'blue']
    for alpha, color in zip(alpha_values, colors):
        model = SimpleExpSmoothing(series).fit(smoothing_level=alpha, optimized=False)
        fitted = model.fittedvalues
        fitted.plot(ax=ax, label=f'SES (alpha={alpha})', color=color, linestyle='--')

    ax.set_title('Simple Exponential Smoothing with Different Alpha Values')
    ax.legend()
    plt.tight_layout()
    plt.show()

    # Show the effect of alpha
    print("\nAlpha Parameter Effect:")
    print("- Low alpha (0.1): Slow adaptation, smoother forecasts")
    print("- High alpha (0.9): Fast adaptation, more responsive to recent changes")

# Create simple series without trend/seasonality
np.random.seed(42)
simple_series = pd.Series(
    100 + np.random.normal(0, 10, 200),
    index=pd.date_range('2020-01-01', periods=200, freq='D')
)

simple_exponential_smoothing_demo(simple_series)
```

### Holt's Linear Trend Method (Double Exponential Smoothing)

Holt's method extends SES to capture linear trends.

```python
from statsmodels.tsa.holtwinters import Holt

def holts_method_demo(series):
    """
    Demonstrate Holt's Linear Trend Method.
    """
    # Fit models with different trend types
    fit_linear = Holt(series, initialization_method='estimated').fit()
    fit_exponential = Holt(series, exponential=True, initialization_method='estimated').fit()
    fit_damped = Holt(series, damped_trend=True, initialization_method='estimated').fit()

    # Forecast
    steps = 30
    fcast_linear = fit_linear.forecast(steps)
    fcast_exponential = fit_exponential.forecast(steps)
    fcast_damped = fit_damped.forecast(steps)

    # Plot
    fig, ax = plt.subplots(figsize=(14, 6))

    series.plot(ax=ax, label='Actual', color='black', linewidth=2)
    fcast_linear.plot(ax=ax, label='Linear Trend', color='red', linestyle='--')
    fcast_exponential.plot(ax=ax, label='Exponential Trend', color='green', linestyle='--')
    fcast_damped.plot(ax=ax, label='Damped Trend', color='blue', linestyle='--')

    ax.set_title("Holt's Linear Trend Method - Forecast Comparison")
    ax.legend()
    plt.tight_layout()
    plt.show()

    # Print parameters
    print("\nModel Parameters:")
    print(f"Linear: alpha={fit_linear.params['smoothing_level']:.4f}, "
          f"beta={fit_linear.params['smoothing_trend']:.4f}")
    print(f"Exponential: alpha={fit_exponential.params['smoothing_level']:.4f}, "
          f"beta={fit_exponential.params['smoothing_trend']:.4f}")
    print(f"Damped: alpha={fit_damped.params['smoothing_level']:.4f}, "
          f"beta={fit_damped.params['smoothing_trend']:.4f}, "
          f"phi={fit_damped.params['damping_trend']:.4f}")

# Create series with trend
np.random.seed(42)
trend_series = pd.Series(
    100 + np.arange(200) * 0.5 + np.random.normal(0, 5, 200),
    index=pd.date_range('2020-01-01', periods=200, freq='D')
)

holts_method_demo(trend_series)
```

### Holt-Winters Method (Triple Exponential Smoothing)

Holt-Winters extends Holt's method to capture both trend and seasonality, making it one of the most versatile exponential smoothing methods.

```python
def holt_winters_demo(series, seasonal_periods=52):
    """
    Comprehensive Holt-Winters demonstration with additive and multiplicative seasonality.
    """
    train = series[:-seasonal_periods]
    test = series[-seasonal_periods:]

    # Fit models
    models = {
        'Additive': ExponentialSmoothing(
            train,
            trend='add',
            seasonal='add',
            seasonal_periods=seasonal_periods,
            initialization_method='estimated'
        ).fit(),
        'Multiplicative': ExponentialSmoothing(
            train,
            trend='add',
            seasonal='mul',
            seasonal_periods=seasonal_periods,
            initialization_method='estimated'
        ).fit(),
        'Damped Additive': ExponentialSmoothing(
            train,
            trend='add',
            damped_trend=True,
            seasonal='add',
            seasonal_periods=seasonal_periods,
            initialization_method='estimated'
        ).fit()
    }

    # Plot
    fig, axes = plt.subplots(2, 1, figsize=(14, 10))

    # Full view
    train.plot(ax=axes[0], label='Training', color='black', linewidth=1.5)
    test.plot(ax=axes[0], label='Test', color='gray', linewidth=1.5)

    colors = ['red', 'green', 'blue']
    for (name, model), color in zip(models.items(), colors):
        forecast = model.forecast(seasonal_periods)
        forecast.index = test.index
        forecast.plot(ax=axes[0], label=f'{name}', color=color, linestyle='--')

    axes[0].set_title('Holt-Winters Forecast Comparison')
    axes[0].legend()

    # Component view (for additive model)
    add_model = models['Additive']
    axes[1].plot(add_model.level, label='Level', color='blue')
    axes[1].plot(train.index, add_model.trend, label='Trend', color='green')
    axes[1].set_title('Holt-Winters Components (Additive Model)')
    axes[1].legend()

    plt.tight_layout()
    plt.show()

    # Evaluate models
    print("\n" + "="*60)
    print("Holt-Winters Model Comparison")
    print("="*60)

    from sklearn.metrics import mean_absolute_error, mean_squared_error

    for name, model in models.items():
        forecast = model.forecast(seasonal_periods)
        forecast.index = test.index
        mae = mean_absolute_error(test, forecast)
        rmse = np.sqrt(mean_squared_error(test, forecast))
        aic = model.aic

        print(f"\n{name}:")
        print(f"  MAE:  {mae:.4f}")
        print(f"  RMSE: {rmse:.4f}")
        print(f"  AIC:  {aic:.2f}")
        print(f"  Alpha (level): {model.params['smoothing_level']:.4f}")
        print(f"  Beta (trend):  {model.params['smoothing_trend']:.4f}")
        print(f"  Gamma (seasonal): {model.params['smoothing_seasonal']:.4f}")

# Use our seasonal data
holt_winters_demo(seasonal_data, seasonal_periods=52)
```

### ETS Framework

The ETS (Error, Trend, Seasonal) framework provides a systematic way to specify exponential smoothing models:

| Component | Options |
|-----------|---------|
| Error (E) | Additive (A), Multiplicative (M) |
| Trend (T) | None (N), Additive (A), Additive Damped (Ad), Multiplicative (M), Multiplicative Damped (Md) |
| Seasonal (S) | None (N), Additive (A), Multiplicative (M) |

```python
from statsmodels.tsa.exponential_smoothing.ets import ETSModel

def ets_model_comparison(series, seasonal_periods=52):
    """
    Compare different ETS model specifications.
    """
    train = series[:-seasonal_periods]
    test = series[-seasonal_periods:]

    # Define model specifications
    specifications = [
        ('AAN', {'error': 'add', 'trend': 'add', 'seasonal': None}),
        ('AAA', {'error': 'add', 'trend': 'add', 'seasonal': 'add'}),
        ('AAM', {'error': 'add', 'trend': 'add', 'seasonal': 'mul'}),
        ('MAA', {'error': 'mul', 'trend': 'add', 'seasonal': 'add'}),
        ('MAM', {'error': 'mul', 'trend': 'add', 'seasonal': 'mul'}),
    ]

    results = []

    for name, spec in specifications:
        try:
            model = ETSModel(
                train,
                seasonal_periods=seasonal_periods if spec['seasonal'] else None,
                **spec
            )
            fit = model.fit()
            forecast = fit.forecast(seasonal_periods)

            mae = mean_absolute_error(test, forecast)
            aic = fit.aic
            bic = fit.bic

            results.append({
                'Model': name,
                'MAE': mae,
                'AIC': aic,
                'BIC': bic
            })
        except Exception as e:
            print(f"Model {name} failed: {str(e)[:50]}")

    results_df = pd.DataFrame(results).sort_values('AIC')
    print("\nETS Model Comparison:")
    print(results_df.to_string(index=False))

    return results_df

# Compare ETS models
ets_results = ets_model_comparison(seasonal_data, seasonal_periods=52)
```

## Facebook Prophet: Modern Time Series Forecasting

Prophet is a forecasting library developed by Facebook (Meta) that combines the interpretability of classical methods with the flexibility to handle complex patterns.

### Prophet Model Structure

Prophet uses a decomposable model:

$$y(t) = g(t) + s(t) + h(t) + \epsilon_t$$

Where:
- g(t): Piecewise linear or logistic growth trend
- s(t): Seasonality modeled using Fourier series
- h(t): Holiday effects
- epsilon_t: Error term

```python
from prophet import Prophet
import logging
logging.getLogger('prophet').setLevel(logging.WARNING)

def prophet_basic_demo(series):
    """
    Basic Prophet model demonstration.
    """
    # Prepare data in Prophet format
    df = series.reset_index()
    df.columns = ['ds', 'y']

    # Split data
    train_size = int(len(df) * 0.8)
    train_df = df[:train_size]
    test_df = df[train_size:]

    # Initialize and fit Prophet model
    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=False,
        changepoint_prior_scale=0.05,  # Flexibility of trend
        seasonality_prior_scale=10.0,  # Flexibility of seasonality
        interval_width=0.95            # Uncertainty interval width
    )

    model.fit(train_df)

    # Create future dataframe
    future = model.make_future_dataframe(periods=len(test_df), freq='D')

    # Generate forecast
    forecast = model.predict(future)

    # Plot forecast
    fig = model.plot(forecast)
    plt.title('Prophet Forecast')
    plt.show()

    # Plot components
    fig_components = model.plot_components(forecast)
    plt.show()

    # Evaluate on test set
    test_forecast = forecast[forecast['ds'].isin(test_df['ds'])]
    mae = mean_absolute_error(test_df['y'], test_forecast['yhat'])
    rmse = np.sqrt(mean_squared_error(test_df['y'], test_forecast['yhat']))

    print("\nProphet Forecast Accuracy:")
    print(f"MAE:  {mae:.4f}")
    print(f"RMSE: {rmse:.4f}")

    return model, forecast

# Use our data
prophet_model, prophet_forecast = prophet_basic_demo(seasonal_data)
```

### Handling Holidays and Special Events

Prophet excels at incorporating domain knowledge about holidays and events that impact the time series.

```python
def prophet_with_holidays(series):
    """
    Prophet model with custom holidays and events.
    """
    df = series.reset_index()
    df.columns = ['ds', 'y']

    # Define custom holidays
    holidays = pd.DataFrame({
        'holiday': 'black_friday',
        'ds': pd.to_datetime([
            '2018-11-23', '2019-11-29', '2020-11-27',
            '2021-11-26', '2022-11-25', '2023-11-24'
        ]),
        'lower_window': -1,  # Include day before
        'upper_window': 1,   # Include day after
    })

    # Add more holidays
    christmas = pd.DataFrame({
        'holiday': 'christmas',
        'ds': pd.to_datetime([
            '2018-12-25', '2019-12-25', '2020-12-25',
            '2021-12-25', '2022-12-25', '2023-12-25'
        ]),
        'lower_window': -3,
        'upper_window': 0,
    })

    all_holidays = pd.concat([holidays, christmas])

    # Create model with holidays
    model = Prophet(
        holidays=all_holidays,
        yearly_seasonality=True,
        weekly_seasonality=True
    )

    # Add country-specific holidays
    model.add_country_holidays(country_name='US')

    model.fit(df)

    # Forecast
    future = model.make_future_dataframe(periods=90, freq='D')
    forecast = model.predict(future)

    # Plot holiday effects
    fig, ax = plt.subplots(figsize=(14, 6))

    # Extract holiday components
    holiday_cols = [col for col in forecast.columns if col.startswith('christmas')
                    or col.startswith('black_friday')]

    for col in holiday_cols[:5]:  # Limit to first 5 holiday columns
        ax.plot(forecast['ds'], forecast[col], label=col)

    ax.set_title('Holiday Effects in Prophet Model')
    ax.legend()
    plt.tight_layout()
    plt.show()

    return model, forecast

# Demonstrate with holidays (using synthetic data)
prophet_holiday_model, prophet_holiday_forecast = prophet_with_holidays(seasonal_data)
```

### Adding Custom Seasonality and Regressors

```python
def prophet_advanced(series, temperature_data=None):
    """
    Advanced Prophet model with custom seasonality and external regressors.
    """
    df = series.reset_index()
    df.columns = ['ds', 'y']

    # Add external regressor (e.g., temperature)
    if temperature_data is not None:
        df['temperature'] = temperature_data
    else:
        # Simulate temperature data
        df['temperature'] = 20 + 10 * np.sin(2 * np.pi * np.arange(len(df)) / 365) + \
                           np.random.normal(0, 2, len(df))

    # Create model with custom configuration
    model = Prophet(
        yearly_seasonality=False,  # We'll add custom yearly seasonality
        weekly_seasonality=True,
        daily_seasonality=False,
        changepoint_prior_scale=0.1,
        seasonality_mode='multiplicative'  # Use multiplicative seasonality
    )

    # Add custom yearly seasonality with more Fourier terms
    model.add_seasonality(
        name='yearly',
        period=365.25,
        fourier_order=15  # More terms for complex patterns
    )

    # Add monthly seasonality
    model.add_seasonality(
        name='monthly',
        period=30.5,
        fourier_order=5
    )

    # Add external regressor
    model.add_regressor('temperature', mode='additive')

    # Fit model
    model.fit(df)

    # Create future dataframe with regressor
    future = model.make_future_dataframe(periods=90, freq='D')
    future['temperature'] = 20 + 10 * np.sin(2 * np.pi * np.arange(len(future)) / 365) + \
                           np.random.normal(0, 2, len(future))

    # Forecast
    forecast = model.predict(future)

    # Plot components
    fig = model.plot_components(forecast)
    plt.show()

    # Show regressor effects
    print("\nRegressor Coefficients:")
    for regressor in model.extra_regressors:
        coef = model.params['beta'][-1]
        print(f"  {regressor}: {coef:.4f}")

    return model, forecast

prophet_adv_model, prophet_adv_forecast = prophet_advanced(seasonal_data)
```

### Prophet Cross-Validation

Prophet provides built-in cross-validation functionality for robust model evaluation.

```python
from prophet.diagnostics import cross_validation, performance_metrics
from prophet.plot import plot_cross_validation_metric

def prophet_cross_validation(model, initial='365 days', period='30 days', horizon='90 days'):
    """
    Perform time series cross-validation for Prophet model.
    """
    # Perform cross-validation
    df_cv = cross_validation(
        model,
        initial=initial,   # Initial training period
        period=period,     # Spacing between cutoff dates
        horizon=horizon    # Forecast horizon
    )

    # Calculate performance metrics
    df_metrics = performance_metrics(df_cv)

    print("\nCross-Validation Performance Metrics:")
    print(df_metrics[['horizon', 'mape', 'rmse', 'mae', 'coverage']].tail(10))

    # Plot MAPE by horizon
    fig = plot_cross_validation_metric(df_cv, metric='mape')
    plt.title('MAPE by Forecast Horizon')
    plt.show()

    # Plot RMSE by horizon
    fig = plot_cross_validation_metric(df_cv, metric='rmse')
    plt.title('RMSE by Forecast Horizon')
    plt.show()

    return df_cv, df_metrics

# Run cross-validation
cv_results, cv_metrics = prophet_cross_validation(
    prophet_model,
    initial='365 days',
    period='30 days',
    horizon='90 days'
)
```

## Model Comparison and Selection

Choosing the right model requires systematic comparison across multiple criteria.

### Information Criteria

Information criteria balance model fit against complexity:

- **AIC (Akaike Information Criterion)**: $AIC = 2k - 2\ln(L)$
- **BIC (Bayesian Information Criterion)**: $BIC = k\ln(n) - 2\ln(L)$

Where k is the number of parameters, n is the sample size, and L is the likelihood.

```python
def compare_models(series, seasonal_periods=52):
    """
    Comprehensive comparison of time series models.
    """
    train = series[:-seasonal_periods]
    test = series[-seasonal_periods:]

    results = []

    # 1. ARIMA
    try:
        arima_model = ARIMA(train, order=(2, 1, 2)).fit()
        arima_forecast = arima_model.forecast(steps=len(test))
        arima_forecast.index = test.index

        results.append({
            'Model': 'ARIMA(2,1,2)',
            'MAE': mean_absolute_error(test, arima_forecast),
            'RMSE': np.sqrt(mean_squared_error(test, arima_forecast)),
            'AIC': arima_model.aic,
            'BIC': arima_model.bic
        })
    except Exception as e:
        print(f"ARIMA failed: {e}")

    # 2. SARIMA
    try:
        sarima_model = SARIMAX(
            train,
            order=(1, 1, 1),
            seasonal_order=(1, 1, 1, seasonal_periods)
        ).fit(disp=False)
        sarima_forecast = sarima_model.forecast(steps=len(test))
        sarima_forecast.index = test.index

        results.append({
            'Model': f'SARIMA(1,1,1)(1,1,1,{seasonal_periods})',
            'MAE': mean_absolute_error(test, sarima_forecast),
            'RMSE': np.sqrt(mean_squared_error(test, sarima_forecast)),
            'AIC': sarima_model.aic,
            'BIC': sarima_model.bic
        })
    except Exception as e:
        print(f"SARIMA failed: {e}")

    # 3. Holt-Winters
    try:
        hw_model = ExponentialSmoothing(
            train,
            trend='add',
            seasonal='add',
            seasonal_periods=seasonal_periods
        ).fit()
        hw_forecast = hw_model.forecast(len(test))
        hw_forecast.index = test.index

        results.append({
            'Model': 'Holt-Winters (Additive)',
            'MAE': mean_absolute_error(test, hw_forecast),
            'RMSE': np.sqrt(mean_squared_error(test, hw_forecast)),
            'AIC': hw_model.aic,
            'BIC': hw_model.bic
        })
    except Exception as e:
        print(f"Holt-Winters failed: {e}")

    # 4. Prophet
    try:
        df = train.reset_index()
        df.columns = ['ds', 'y']

        prophet_m = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False
        )
        prophet_m.fit(df)

        future = prophet_m.make_future_dataframe(periods=len(test), freq='W')
        prophet_forecast = prophet_m.predict(future)

        # Align with test
        prophet_pred = prophet_forecast['yhat'].values[-len(test):]

        results.append({
            'Model': 'Prophet',
            'MAE': mean_absolute_error(test.values, prophet_pred),
            'RMSE': np.sqrt(mean_squared_error(test.values, prophet_pred)),
            'AIC': np.nan,
            'BIC': np.nan
        })
    except Exception as e:
        print(f"Prophet failed: {e}")

    # Create comparison table
    results_df = pd.DataFrame(results)
    results_df = results_df.sort_values('RMSE')

    print("\n" + "="*70)
    print("Model Comparison Results")
    print("="*70)
    print(results_df.to_string(index=False))

    # Visualize
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    results_df.plot(x='Model', y=['MAE', 'RMSE'], kind='bar', ax=axes[0])
    axes[0].set_title('Forecast Error Comparison')
    axes[0].set_xlabel('')
    axes[0].tick_params(axis='x', rotation=45)

    # AIC/BIC comparison (excluding NaN)
    valid_ic = results_df.dropna(subset=['AIC', 'BIC'])
    if len(valid_ic) > 0:
        valid_ic.plot(x='Model', y=['AIC', 'BIC'], kind='bar', ax=axes[1])
        axes[1].set_title('Information Criteria Comparison')
        axes[1].set_xlabel('')
        axes[1].tick_params(axis='x', rotation=45)

    plt.tight_layout()
    plt.show()

    return results_df

# Compare all models
model_comparison = compare_models(seasonal_data, seasonal_periods=52)
```

### Time Series Cross-Validation

Standard cross-validation does not work for time series due to temporal dependencies. Use expanding or sliding window approaches instead.

```python
from sklearn.model_selection import TimeSeriesSplit

def time_series_cv_comparison(series, n_splits=5, forecast_horizon=26):
    """
    Compare models using time series cross-validation.
    """
    tscv = TimeSeriesSplit(n_splits=n_splits, test_size=forecast_horizon)

    models = {
        'ARIMA(2,1,2)': lambda train: ARIMA(train, order=(2, 1, 2)).fit(),
        'Holt-Winters': lambda train: ExponentialSmoothing(
            train, trend='add', seasonal='add', seasonal_periods=52
        ).fit()
    }

    cv_results = {name: [] for name in models.keys()}

    for fold, (train_idx, test_idx) in enumerate(tscv.split(series)):
        train = series.iloc[train_idx]
        test = series.iloc[test_idx]

        for name, model_func in models.items():
            try:
                model = model_func(train)
                if 'ARIMA' in name:
                    forecast = model.forecast(steps=len(test))
                else:
                    forecast = model.forecast(len(test))

                rmse = np.sqrt(mean_squared_error(test, forecast))
                cv_results[name].append(rmse)
            except Exception as e:
                cv_results[name].append(np.nan)

    # Summarize results
    summary = pd.DataFrame({
        name: {
            'Mean RMSE': np.nanmean(values),
            'Std RMSE': np.nanstd(values),
            'Min RMSE': np.nanmin(values),
            'Max RMSE': np.nanmax(values)
        }
        for name, values in cv_results.items()
    }).T

    print("\nTime Series Cross-Validation Results:")
    print(summary.to_string())

    # Visualize
    fig, ax = plt.subplots(figsize=(10, 6))
    cv_df = pd.DataFrame(cv_results)
    cv_df.index = [f'Fold {i+1}' for i in range(n_splits)]
    cv_df.plot(kind='bar', ax=ax)
    ax.set_title('RMSE by Cross-Validation Fold')
    ax.set_xlabel('Fold')
    ax.set_ylabel('RMSE')
    plt.tight_layout()
    plt.show()

    return cv_results, summary

# Run cross-validation comparison
cv_results, cv_summary = time_series_cv_comparison(seasonal_data)
```

## Practical Implementation: Complete Forecasting Pipeline

The following is a complete, production-ready forecasting pipeline that incorporates all the concepts covered.

```python
class TimeSeriesForecaster:
    """
    A comprehensive time series forecasting class that implements
    multiple traditional methods with automatic model selection.
    """

    def __init__(self, series, seasonal_periods=None, test_size=0.2):
        """
        Initialize the forecaster.

        Parameters:
        -----------
        series : pd.Series
            Time series data with DatetimeIndex
        seasonal_periods : int, optional
            Seasonal period (e.g., 12 for monthly, 52 for weekly)
        test_size : float
            Proportion of data to use for testing
        """
        self.series = series
        self.seasonal_periods = seasonal_periods
        self.test_size = test_size

        # Split data
        split_idx = int(len(series) * (1 - test_size))
        self.train = series[:split_idx]
        self.test = series[split_idx:]

        self.models = {}
        self.forecasts = {}
        self.metrics = {}

    def check_stationarity(self):
        """Check and report on stationarity."""
        adf_result = adfuller(self.series.dropna(), autolag='AIC')

        print("\nStationarity Analysis")
        print("="*50)
        print(f"ADF Statistic: {adf_result[0]:.4f}")
        print(f"P-Value: {adf_result[1]:.4f}")
        print(f"Is Stationary: {adf_result[1] < 0.05}")

        return adf_result[1] < 0.05

    def fit_arima(self, order=None):
        """Fit ARIMA model with automatic or specified order."""
        if order is None:
            # Use auto_arima
            auto_model = pm.auto_arima(
                self.train,
                start_p=0, start_q=0,
                max_p=5, max_q=5,
                seasonal=False,
                trace=False,
                error_action='ignore',
                suppress_warnings=True
            )
            order = auto_model.order

        model = ARIMA(self.train, order=order).fit()
        self.models['ARIMA'] = model

        forecast = model.forecast(steps=len(self.test))
        forecast.index = self.test.index
        self.forecasts['ARIMA'] = forecast

        return model

    def fit_sarima(self, order=None, seasonal_order=None):
        """Fit SARIMA model."""
        if order is None or seasonal_order is None:
            auto_model = pm.auto_arima(
                self.train,
                seasonal=True,
                m=self.seasonal_periods or 12,
                trace=False,
                error_action='ignore',
                suppress_warnings=True
            )
            order = auto_model.order
            seasonal_order = auto_model.seasonal_order

        model = SARIMAX(
            self.train,
            order=order,
            seasonal_order=seasonal_order
        ).fit(disp=False)

        self.models['SARIMA'] = model

        forecast = model.forecast(steps=len(self.test))
        forecast.index = self.test.index
        self.forecasts['SARIMA'] = forecast

        return model

    def fit_holt_winters(self, trend='add', seasonal='add', damped=False):
        """Fit Holt-Winters exponential smoothing."""
        model = ExponentialSmoothing(
            self.train,
            trend=trend,
            seasonal=seasonal,
            seasonal_periods=self.seasonal_periods,
            damped_trend=damped
        ).fit()

        name = f"HW_{trend}_{seasonal}{'_damped' if damped else ''}"
        self.models[name] = model

        forecast = model.forecast(len(self.test))
        forecast.index = self.test.index
        self.forecasts[name] = forecast

        return model

    def fit_prophet(self, yearly_seasonality=True, weekly_seasonality=False):
        """Fit Facebook Prophet model."""
        df = self.train.reset_index()
        df.columns = ['ds', 'y']

        model = Prophet(
            yearly_seasonality=yearly_seasonality,
            weekly_seasonality=weekly_seasonality,
            daily_seasonality=False
        )
        model.fit(df)

        self.models['Prophet'] = model

        future = model.make_future_dataframe(
            periods=len(self.test),
            freq=pd.infer_freq(self.series.index) or 'D'
        )
        forecast_df = model.predict(future)
        forecast = pd.Series(
            forecast_df['yhat'].values[-len(self.test):],
            index=self.test.index
        )
        self.forecasts['Prophet'] = forecast

        return model

    def fit_all(self):
        """Fit all available models."""
        print("Fitting models...")

        self.fit_arima()
        print("  ARIMA: Done")

        if self.seasonal_periods:
            self.fit_sarima()
            print("  SARIMA: Done")

            self.fit_holt_winters()
            print("  Holt-Winters: Done")

        self.fit_prophet()
        print("  Prophet: Done")

        return self

    def evaluate(self):
        """Evaluate all fitted models."""
        for name, forecast in self.forecasts.items():
            mae = mean_absolute_error(self.test, forecast)
            rmse = np.sqrt(mean_squared_error(self.test, forecast))
            mape = np.mean(np.abs((self.test - forecast) / self.test)) * 100

            self.metrics[name] = {
                'MAE': mae,
                'RMSE': rmse,
                'MAPE': mape
            }

        metrics_df = pd.DataFrame(self.metrics).T.sort_values('RMSE')
        print("\nModel Evaluation Results:")
        print(metrics_df.to_string())

        return metrics_df

    def plot_forecasts(self):
        """Visualize all forecasts."""
        fig, axes = plt.subplots(2, 1, figsize=(14, 10))

        # Full view
        self.train.plot(ax=axes[0], label='Training', color='black')
        self.test.plot(ax=axes[0], label='Actual', color='gray', linewidth=2)

        colors = plt.cm.Set1(np.linspace(0, 1, len(self.forecasts)))
        for (name, forecast), color in zip(self.forecasts.items(), colors):
            forecast.plot(ax=axes[0], label=name, color=color, linestyle='--')

        axes[0].set_title('All Model Forecasts')
        axes[0].legend(loc='upper left')

        # Zoomed view
        self.test.plot(ax=axes[1], label='Actual', color='gray', linewidth=2)
        for (name, forecast), color in zip(self.forecasts.items(), colors):
            forecast.plot(ax=axes[1], label=name, color=color, linestyle='--')

        axes[1].set_title('Forecast Period Detail')
        axes[1].legend(loc='upper left')

        plt.tight_layout()
        plt.show()

    def get_best_model(self, metric='RMSE'):
        """Return the best model based on specified metric."""
        if not self.metrics:
            self.evaluate()

        metrics_df = pd.DataFrame(self.metrics).T
        best_model_name = metrics_df[metric].idxmin()

        print(f"\nBest model by {metric}: {best_model_name}")
        print(f"{metric}: {metrics_df.loc[best_model_name, metric]:.4f}")

        return best_model_name, self.models[best_model_name]

    def forecast_future(self, model_name, periods):
        """Generate future forecasts using specified model."""
        model = self.models[model_name]

        if model_name == 'Prophet':
            future = model.make_future_dataframe(
                periods=periods,
                freq=pd.infer_freq(self.series.index) or 'D'
            )
            forecast = model.predict(future)
            return forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(periods)

        elif 'ARIMA' in model_name or 'SARIMA' in model_name:
            forecast_result = model.get_forecast(steps=periods)
            forecast = forecast_result.predicted_mean
            conf_int = forecast_result.conf_int()
            return pd.DataFrame({
                'forecast': forecast,
                'lower': conf_int.iloc[:, 0],
                'upper': conf_int.iloc[:, 1]
            })

        else:  # Exponential smoothing
            forecast = model.forecast(periods)
            return forecast


# Example usage
print("="*70)
print("COMPLETE TIME SERIES FORECASTING PIPELINE")
print("="*70)

# Initialize forecaster
forecaster = TimeSeriesForecaster(
    seasonal_data,
    seasonal_periods=52,
    test_size=0.2
)

# Check stationarity
forecaster.check_stationarity()

# Fit all models
forecaster.fit_all()

# Evaluate
metrics = forecaster.evaluate()

# Plot all forecasts
forecaster.plot_forecasts()

# Get best model
best_name, best_model = forecaster.get_best_model('RMSE')

# Generate future forecast
future_forecast = forecaster.forecast_future(best_name, periods=26)
print(f"\nFuture forecast using {best_name}:")
print(future_forecast.head())
```

## Best Practices and Common Pitfalls

### Best Practices

1. **Always visualize your data first**: Plot the time series to identify trends, seasonality, and anomalies before modeling.

2. **Check for stationarity**: Use both ADF and KPSS tests for robust assessment.

3. **Use appropriate differencing**: Over-differencing can introduce unnecessary complexity and artificial patterns.

4. **Validate with proper cross-validation**: Use time series cross-validation, never random splits.

5. **Consider multiple models**: No single model works best for all scenarios.

6. **Monitor residuals**: Well-specified models should have residuals that resemble white noise.

7. **Use information criteria wisely**: AIC and BIC help balance fit and complexity, but should not be the sole criterion.

8. **Document your analysis**: Record the transformations, parameters, and rationale for model choices.

### Common Pitfalls

1. **Using future information**: Ensure all features are available at forecast time.

2. **Ignoring seasonality**: Failing to account for seasonal patterns leads to systematic errors.

3. **Over-reliance on p-values**: Statistical significance does not guarantee forecasting accuracy.

4. **Neglecting domain knowledge**: Incorporate business understanding into model design.

5. **Insufficient data**: Traditional methods require adequate historical data for reliable parameter estimation.

6. **Ignoring structural breaks**: Major events (e.g., COVID-19) can invalidate historical patterns.

## Interview Key Points

### Common Interview Questions

**Q1: When would you choose ARIMA over Prophet?**

ARIMA is preferred when:
- You need a parsimonious, interpretable model
- Data does not have strong holiday effects
- You require formal statistical inference (confidence intervals, hypothesis tests)

Prophet is better when:
- Data has strong seasonal patterns with multiple frequencies
- Holiday effects are important
- You need to quickly prototype and iterate

**Q2: How do you determine the order (p, d, q) for ARIMA?**

1. Use the ADF test to determine d (differencing order)
2. Examine ACF plot: significant spike at lag q suggests MA(q)
3. Examine PACF plot: significant spike at lag p suggests AR(p)
4. Use auto.arima or pmdarima for automatic selection
5. Compare models using AIC/BIC and out-of-sample performance

**Q3: What is the difference between additive and multiplicative decomposition?**

Additive: Y = Trend + Seasonal + Residual
- Use when seasonal amplitude is constant
- Common in temperature data

Multiplicative: Y = Trend x Seasonal x Residual
- Use when seasonal amplitude grows with the level
- Common in economic data where percentage changes are more meaningful

**Q4: How do you handle missing values in time series?**

Options include:
1. Forward fill (use previous value)
2. Backward fill (use next value)
3. Linear interpolation
4. Seasonal interpolation
5. Model-based imputation (e.g., Kalman filter)

The choice depends on the missing mechanism and domain context.

**Q5: What is the difference between stationarity and seasonality?**

Stationarity: Statistical properties (mean, variance) are constant over time
Seasonality: Regular, predictable patterns that repeat at fixed intervals

A series can be seasonal but stationary (seasonal pattern does not change) or non-seasonal but non-stationary (trending mean or changing variance).

## Further Reading

### Books
- **"Forecasting: Principles and Practice" (3rd ed.)** by Rob J. Hyndman and George Athanasopoulos - Available free online
- **"Time Series Analysis" by James D. Hamilton** - Comprehensive theoretical treatment
- **"Introduction to Time Series and Forecasting"** by Brockwell and Davis

### Online Resources
- [Prophet Documentation](https://facebook.github.io/prophet/)
- [Statsmodels Time Series Documentation](https://www.statsmodels.org/stable/tsa.html)
- [pmdarima Documentation](http://alkaline-ml.com/pmdarima/)

### Papers
- Box, G.E.P. and Jenkins, G.M. (1970). "Time Series Analysis: Forecasting and Control"
- Taylor, S.J. and Letham, B. (2018). "Forecasting at Scale" (Prophet paper)
- Hyndman, R.J. et al. (2002). "A state space framework for automatic forecasting using exponential smoothing methods"

## Summary

Traditional time series methods remain powerful tools for forecasting despite the rise of deep learning approaches. Their interpretability, theoretical foundations, and computational efficiency make them ideal for many business applications. This article covered:

1. **Fundamentals**: Time series components, decomposition, and the critical concept of stationarity
2. **Stationarity Testing**: ADF and KPSS tests with practical implementation
3. **Autocorrelation Analysis**: ACF and PACF for model identification
4. **ARIMA Family**: From basic ARIMA to seasonal SARIMA with automatic parameter selection
5. **Exponential Smoothing**: From simple smoothing to Holt-Winters and the ETS framework
6. **Prophet**: Modern forecasting with holiday effects and custom seasonality
7. **Model Comparison**: Systematic approaches to model selection and validation

The key to successful time series forecasting lies not in finding the "best" method, but in understanding your data, applying appropriate transformations, validating rigorously, and combining domain knowledge with statistical methodology. Start with simpler models, validate thoroughly, and only increase complexity when warranted by the data and business requirements.
