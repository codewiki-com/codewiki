---
title: Statistics Fundamentals for Data Analysis
description: Master statistical concepts essential for data science
track: datascience
section: statistics
difficulty: intermediate
tags:
  - Statistics
  - Data Science
  - Analysis
  - Probability
status: imported
origin: old/src/content/docs/data/statistics-fundamentals.en.md
divergence: 0.198
issues:
  - title-lang-zh
  - title-language
legacy:
  category: Data
  subcategory: Statistics
  order: 3
  lastUpdated: 2026-01-07
---

Statistics is the backbone of data analysis. Whether you are conducting exploratory data analysis, building machine learning models, or designing A/B tests, a solid understanding of statistical concepts is indispensable. This article covers the most commonly used statistical concepts and methods in data analysis, to help you build a comprehensive knowledge foundation in statistics.

## Descriptive Statistics

Descriptive statistics provides methods to quantitatively describe the basic characteristics of a dataset. It mainly consists of two categories: measures of central tendency and measures of dispersion.

### Measures of Central Tendency

**Mean**: The arithmetic average of all data points. It is sensitive to outliers.

$$\bar{x} = \frac{1}{n}\sum_{i=1}^{n}x_i$$

**Median**: The middle value when data is sorted in ascending order. It is robust to outliers and provides a better representation of the "typical" value in skewed distributions.

**Mode**: The most frequently occurring value in a dataset. It is particularly useful for categorical data.

### Measures of Dispersion

**Variance**: Measures how far the data points are spread out from their mean.

$$s^2 = \frac{1}{n-1}\sum_{i=1}^{n}(x_i - \bar{x})^2$$

**Standard Deviation**: The square root of variance, expressed in the same units as the original data, making it more interpretable.

**Interquartile Range (IQR)**: The difference between the 75th percentile (Q3) and 25th percentile (Q1). It is commonly used for identifying outliers.

```python
import numpy as np
import pandas as pd
from scipy import stats

# Create sample data
data = np.random.normal(loc=100, scale=15, size=1000)

# Calculate descriptive statistics
print(f"Mean: {np.mean(data):.2f}")
print(f"Median: {np.median(data):.2f}")
print(f"Standard Deviation: {np.std(data, ddof=1):.2f}")
print(f"Variance: {np.var(data, ddof=1):.2f}")

# Using pandas describe() for comprehensive statistics
df = pd.DataFrame({'value': data})
print(df.describe())

# Skewness and Kurtosis
print(f"Skewness: {stats.skew(data):.4f}")
print(f"Kurtosis: {stats.kurtosis(data):.4f}")

# Percentiles and IQR
q1 = np.percentile(data, 25)
q3 = np.percentile(data, 75)
iqr = q3 - q1
print(f"Q1: {q1:.2f}, Q3: {q3:.2f}, IQR: {iqr:.2f}")

# Identifying outliers using IQR method
lower_bound = q1 - 1.5 * iqr
upper_bound = q3 + 1.5 * iqr
outliers = data[(data < lower_bound) | (data > upper_bound)]
print(f"Number of outliers: {len(outliers)}")
```

### Distribution Shape

**Skewness**: Measures the asymmetry of the data distribution. Positive skewness indicates a longer right tail, while negative skewness indicates a longer left tail.

**Kurtosis**: Measures the "tailedness" of the distribution. High kurtosis indicates data concentrated around the mean with heavy tails (more outliers), while low kurtosis indicates lighter tails.

```python
import matplotlib.pyplot as plt

# Visualizing skewness
fig, axes = plt.subplots(1, 3, figsize=(15, 4))

# Left-skewed (negative skewness)
left_skewed = np.random.beta(5, 2, 1000) * 100
axes[0].hist(left_skewed, bins=30, edgecolor='black')
axes[0].set_title(f'Left-Skewed (Skewness: {stats.skew(left_skewed):.2f})')

# Symmetric (normal)
symmetric = np.random.normal(50, 10, 1000)
axes[1].hist(symmetric, bins=30, edgecolor='black')
axes[1].set_title(f'Symmetric (Skewness: {stats.skew(symmetric):.2f})')

# Right-skewed (positive skewness)
right_skewed = np.random.exponential(20, 1000)
axes[2].hist(right_skewed, bins=30, edgecolor='black')
axes[2].set_title(f'Right-Skewed (Skewness: {stats.skew(right_skewed):.2f})')

plt.tight_layout()
plt.show()
```

## Probability Distributions

Understanding common probability distributions is fundamental to statistical inference. They serve as mathematical models for random phenomena.

### Discrete Distributions

**Binomial Distribution**: Describes the number of successes in n independent Bernoulli trials.

$$P(X=k) = \binom{n}{k}p^k(1-p)^{n-k}$$

Use cases: Click-through rate analysis, quality control defect counting, A/B test conversion rates.

```python
from scipy import stats
import matplotlib.pyplot as plt

# Binomial distribution example: probability of k successes in n trials
n, p = 100, 0.3  # 100 trials, 30% success probability

# Calculate probabilities
k = np.arange(0, 50)
probabilities = stats.binom.pmf(k, n, p)

plt.figure(figsize=(10, 4))
plt.bar(k, probabilities, color='steelblue', edgecolor='black')
plt.xlabel('Number of Successes')
plt.ylabel('Probability')
plt.title(f'Binomial Distribution B({n}, {p})')
plt.axvline(x=n*p, color='red', linestyle='--', label=f'Expected value = {n*p}')
plt.legend()
plt.show()

# Practical example: probability of at least 35 conversions
# if baseline conversion rate is 30%
prob_at_least_35 = 1 - stats.binom.cdf(34, n, p)
print(f"P(X >= 35) = {prob_at_least_35:.4f}")
```

**Poisson Distribution**: Describes the number of events occurring in a fixed interval of time or space.

$$P(X=k) = \frac{\lambda^k e^{-\lambda}}{k!}$$

Use cases: Website traffic analysis, call center arrivals, system failure counts, rare event modeling.

```python
# Poisson distribution example
lambda_param = 5  # average 5 events per time unit

k = np.arange(0, 15)
probabilities = stats.poisson.pmf(k, lambda_param)

plt.figure(figsize=(10, 4))
plt.bar(k, probabilities, color='coral', edgecolor='black')
plt.xlabel('Number of Events')
plt.ylabel('Probability')
plt.title(f'Poisson Distribution (lambda = {lambda_param})')
plt.show()

# Example: probability of receiving more than 8 support tickets per hour
# when average is 5 tickets/hour
prob_more_than_8 = 1 - stats.poisson.cdf(8, lambda_param)
print(f"P(X > 8) = {prob_more_than_8:.4f}")
```

### Continuous Distributions

**Normal Distribution (Gaussian)**: The most important continuous distribution, completely determined by its mean and standard deviation.

$$f(x) = \frac{1}{\sigma\sqrt{2\pi}}e^{-\frac{(x-\mu)^2}{2\sigma^2}}$$

**Central Limit Theorem**: Regardless of the population distribution, the distribution of sample means approaches a normal distribution as the sample size increases. This is the theoretical foundation for many statistical inference methods.

```python
# Central Limit Theorem demonstration
np.random.seed(42)

# Generate samples from an exponential distribution (clearly non-normal)
population = np.random.exponential(scale=2, size=100000)

# Take repeated samples and compute means
sample_sizes = [5, 30, 100]
fig, axes = plt.subplots(1, 4, figsize=(16, 4))

# Original population distribution
axes[0].hist(population, bins=50, density=True, edgecolor='black')
axes[0].set_title('Population (Exponential)')

for i, n in enumerate(sample_sizes):
    sample_means = [np.mean(np.random.choice(population, n)) for _ in range(1000)]
    axes[i+1].hist(sample_means, bins=30, density=True, edgecolor='black')
    axes[i+1].set_title(f'Sample Means (n={n})')

plt.tight_layout()
plt.show()
```

**Other Important Distributions**:

```python
# Comparison of common distributions
fig, axes = plt.subplots(2, 2, figsize=(12, 10))
x = np.linspace(-5, 5, 100)

# Normal distribution
axes[0, 0].plot(x, stats.norm.pdf(x, 0, 1), 'b-', label='N(0,1)')
axes[0, 0].plot(x, stats.norm.pdf(x, 0, 2), 'r--', label='N(0,2)')
axes[0, 0].set_title('Normal Distribution')
axes[0, 0].legend()

# t-distribution (heavier tails than normal)
axes[0, 1].plot(x, stats.norm.pdf(x), 'b-', label='Normal')
axes[0, 1].plot(x, stats.t.pdf(x, df=3), 'r--', label='t (df=3)')
axes[0, 1].plot(x, stats.t.pdf(x, df=10), 'g-.', label='t (df=10)')
axes[0, 1].set_title('t-Distribution vs Normal')
axes[0, 1].legend()

# Chi-squared distribution
x_chi = np.linspace(0, 20, 100)
for df in [2, 5, 10]:
    axes[1, 0].plot(x_chi, stats.chi2.pdf(x_chi, df), label=f'df={df}')
axes[1, 0].set_title('Chi-Squared Distribution')
axes[1, 0].legend()

# F-distribution
x_f = np.linspace(0, 5, 100)
axes[1, 1].plot(x_f, stats.f.pdf(x_f, 5, 20), label='F(5,20)')
axes[1, 1].plot(x_f, stats.f.pdf(x_f, 10, 30), label='F(10,30)')
axes[1, 1].set_title('F-Distribution')
axes[1, 1].legend()

plt.tight_layout()
plt.show()
```

## Hypothesis Testing

Hypothesis testing is a core method of statistical inference, used to make decisions about population parameters based on sample data.

### Basic Steps of Hypothesis Testing

1. **Formulate Hypotheses**: Null hypothesis (H0) and alternative hypothesis (H1)
2. **Choose Significance Level**: Typically alpha = 0.05
3. **Calculate Test Statistic**
4. **Determine P-value or Critical Value**
5. **Make a Decision**: Reject or fail to reject the null hypothesis

### Understanding Type I and Type II Errors

| Decision | H0 True | H0 False |
|----------|---------|----------|
| Reject H0 | Type I Error (alpha) | Correct Decision (Power) |
| Fail to Reject H0 | Correct Decision | Type II Error (beta) |

- **Type I Error (False Positive)**: Rejecting H0 when it is actually true. Probability = alpha
- **Type II Error (False Negative)**: Failing to reject H0 when it is actually false. Probability = beta
- **Statistical Power** = 1 - beta = probability of correctly rejecting a false H0

### t-Tests

The t-test is used to compare means, especially suitable when sample sizes are small or population standard deviation is unknown.

**One-Sample t-Test**: Tests whether a sample mean equals a specific value.

```python
from scipy import stats

# One-sample t-test: Is the mean equal to 100?
sample = np.random.normal(102, 15, 30)
t_stat, p_value = stats.ttest_1samp(sample, 100)

print(f"Sample mean: {np.mean(sample):.2f}")
print(f"t-statistic: {t_stat:.4f}")
print(f"P-value: {p_value:.4f}")

alpha = 0.05
if p_value < alpha:
    print(f"Reject H0: Sample mean is significantly different from 100 (p < {alpha})")
else:
    print(f"Fail to reject H0: No sufficient evidence that mean differs from 100")
```

**Independent Samples t-Test**: Compares means of two independent groups.

```python
# Independent samples t-test
group_a = np.random.normal(100, 15, 50)
group_b = np.random.normal(105, 15, 50)

# First, test for equality of variances (Levene's test)
levene_stat, levene_p = stats.levene(group_a, group_b)
print(f"Levene's test for equality of variances: p = {levene_p:.4f}")

# Choose equal_var based on Levene's test result
equal_var = levene_p > 0.05
t_stat, p_value = stats.ttest_ind(group_a, group_b, equal_var=equal_var)

print(f"Group A mean: {np.mean(group_a):.2f}")
print(f"Group B mean: {np.mean(group_b):.2f}")
print(f"t-statistic: {t_stat:.4f}")
print(f"P-value: {p_value:.4f}")

# Effect size (Cohen's d)
pooled_std = np.sqrt(((len(group_a)-1)*np.var(group_a, ddof=1) +
                       (len(group_b)-1)*np.var(group_b, ddof=1)) /
                      (len(group_a) + len(group_b) - 2))
cohens_d = (np.mean(group_b) - np.mean(group_a)) / pooled_std
print(f"Cohen's d effect size: {cohens_d:.4f}")
```

**Paired Samples t-Test**: Compares means from the same group under two conditions.

```python
# Paired t-test: before and after treatment
before = np.random.normal(50, 10, 30)
after = before + np.random.normal(5, 5, 30)  # Simulating improvement

t_stat, p_value = stats.ttest_rel(before, after)
print(f"Mean before: {np.mean(before):.2f}")
print(f"Mean after: {np.mean(after):.2f}")
print(f"Mean difference: {np.mean(after - before):.2f}")
print(f"Paired t-test p-value: {p_value:.4f}")
```

### Chi-Square Tests

Chi-square tests are used for categorical data to test independence or goodness of fit.

**Test of Independence**: Tests whether two categorical variables are independent.

```python
# Chi-square test of independence
# Example: Is gender independent of product preference?
observed = np.array([
    [50, 30, 20],   # Male preferences for products A, B, C
    [35, 45, 20]    # Female preferences for products A, B, C
])

chi2, p_value, dof, expected = stats.chi2_contingency(observed)
print(f"Chi-square statistic: {chi2:.4f}")
print(f"P-value: {p_value:.4f}")
print(f"Degrees of freedom: {dof}")
print(f"Expected frequencies:\n{expected}")

# Effect size (Cramer's V)
n = observed.sum()
min_dim = min(observed.shape) - 1
cramers_v = np.sqrt(chi2 / (n * min_dim))
print(f"Cramer's V: {cramers_v:.4f}")
```

**Goodness of Fit Test**: Tests whether observed frequencies match expected frequencies.

```python
# Goodness of fit test: Is this die fair?
observed_freq = [18, 22, 16, 21, 19, 24]  # Actual rolls
expected_freq = [20, 20, 20, 20, 20, 20]  # Expected for fair die

chi2, p_value = stats.chisquare(observed_freq, expected_freq)
print(f"Chi-square statistic: {chi2:.4f}")
print(f"P-value: {p_value:.4f}")

if p_value < 0.05:
    print("The die appears to be unfair")
else:
    print("No evidence that the die is unfair")
```

## Confidence Intervals

Confidence intervals provide a range of plausible values for a population parameter, expressing the uncertainty in our estimates.

### Understanding Confidence Intervals

A 95% confidence interval means: If we repeated the sampling procedure many times, about 95% of the calculated intervals would contain the true population parameter.

**Important**: The confidence level refers to the procedure, not the probability that the specific interval contains the parameter.

```python
from scipy import stats

# Calculate 95% confidence interval for the mean
sample = np.random.normal(100, 15, 50)
mean = np.mean(sample)
se = stats.sem(sample)  # Standard error of the mean

# Using t-distribution for confidence interval
confidence_level = 0.95
ci = stats.t.interval(confidence_level, len(sample)-1, loc=mean, scale=se)
print(f"Sample mean: {mean:.2f}")
print(f"Standard error: {se:.2f}")
print(f"95% Confidence Interval: [{ci[0]:.2f}, {ci[1]:.2f}]")

# Confidence intervals for different levels
for level in [0.90, 0.95, 0.99]:
    ci = stats.t.interval(level, len(sample)-1, loc=mean, scale=se)
    print(f"{int(level*100)}% CI: [{ci[0]:.2f}, {ci[1]:.2f}]")
```

### Bootstrap Confidence Intervals

Bootstrap methods provide non-parametric confidence intervals by resampling.

```python
from scipy.stats import bootstrap

# Bootstrap confidence interval
np.random.seed(42)
sample = np.random.normal(100, 15, 50)

# Using scipy's bootstrap function
data = (sample,)
res = bootstrap(data, np.mean, n_resamples=10000, random_state=42)
print(f"Bootstrap 95% CI: [{res.confidence_interval.low:.2f}, "
      f"{res.confidence_interval.high:.2f}]")

# Manual bootstrap implementation
def bootstrap_ci(data, statistic=np.mean, n_bootstrap=10000, ci=0.95):
    boot_stats = []
    for _ in range(n_bootstrap):
        boot_sample = np.random.choice(data, size=len(data), replace=True)
        boot_stats.append(statistic(boot_sample))

    lower = np.percentile(boot_stats, (1-ci)/2 * 100)
    upper = np.percentile(boot_stats, (1+ci)/2 * 100)
    return lower, upper

ci_lower, ci_upper = bootstrap_ci(sample)
print(f"Manual Bootstrap 95% CI: [{ci_lower:.2f}, {ci_upper:.2f}]")
```

### Confidence Interval for Proportions

```python
from statsmodels.stats.proportion import proportion_confint

# Confidence interval for a proportion
successes = 120
trials = 400
proportion = successes / trials

# Wilson score interval (recommended)
ci_wilson = proportion_confint(successes, trials, method='wilson')
print(f"Sample proportion: {proportion:.4f}")
print(f"Wilson 95% CI: [{ci_wilson[0]:.4f}, {ci_wilson[1]:.4f}]")

# Normal approximation (use only for large samples)
ci_normal = proportion_confint(successes, trials, method='normal')
print(f"Normal 95% CI: [{ci_normal[0]:.4f}, {ci_normal[1]:.4f}]")
```

## Correlation and Regression

### Correlation Analysis

Correlation measures the strength and direction of the linear relationship between two variables.

**Pearson Correlation Coefficient**: Measures linear correlation between continuous variables, ranging from -1 to 1.

$$r = \frac{\sum_{i=1}^{n}(x_i-\bar{x})(y_i-\bar{y})}{\sqrt{\sum_{i=1}^{n}(x_i-\bar{x})^2}\sqrt{\sum_{i=1}^{n}(y_i-\bar{y})^2}}$$

**Spearman Rank Correlation**: Suitable for non-linear monotonic relationships or ordinal data.

**Kendall's Tau**: Another rank-based correlation, more robust for small samples.

```python
np.random.seed(42)
x = np.random.randn(100)
y = 2 * x + np.random.randn(100) * 0.5

# Pearson correlation
pearson_r, pearson_p = stats.pearsonr(x, y)
print(f"Pearson r: {pearson_r:.4f}, p-value: {pearson_p:.4f}")

# Spearman rank correlation
spearman_r, spearman_p = stats.spearmanr(x, y)
print(f"Spearman rho: {spearman_r:.4f}, p-value: {spearman_p:.4f}")

# Kendall's tau
kendall_tau, kendall_p = stats.kendalltau(x, y)
print(f"Kendall tau: {kendall_tau:.4f}, p-value: {kendall_p:.4f}")

# Visualize the correlation
plt.figure(figsize=(8, 6))
plt.scatter(x, y, alpha=0.6)
plt.xlabel('X')
plt.ylabel('Y')
plt.title(f'Scatter Plot (r = {pearson_r:.3f})')

# Add regression line
z = np.polyfit(x, y, 1)
p = np.poly1d(z)
plt.plot(x, p(x), "r-", linewidth=2, label='Best fit line')
plt.legend()
plt.show()
```

**Critical Reminder**: Correlation does not imply causation! A correlation between two variables might be caused by a third confounding variable.

### Linear Regression

Linear regression models the relationship between a dependent variable and one or more independent variables.

**Simple Linear Regression**:

$$y = \beta_0 + \beta_1 x + \epsilon$$

```python
import statsmodels.api as sm
from sklearn.linear_model import LinearRegression

# Generate data
np.random.seed(42)
X = np.random.randn(100, 1)
y = 3 + 2 * X.flatten() + np.random.randn(100) * 0.5

# Using statsmodels for detailed statistical output
X_with_const = sm.add_constant(X)
model = sm.OLS(y, X_with_const).fit()
print(model.summary())

# Key metrics interpretation
print(f"\n--- Key Interpretation ---")
print(f"R-squared: {model.rsquared:.4f} (explains {model.rsquared*100:.1f}% of variance)")
print(f"Adjusted R-squared: {model.rsquared_adj:.4f}")
print(f"Intercept (beta_0): {model.params[0]:.4f}")
print(f"Slope (beta_1): {model.params[1]:.4f}")
print(f"Slope p-value: {model.pvalues[1]:.4f}")
```

**Multiple Linear Regression**:

```python
# Multiple linear regression
np.random.seed(42)
n = 200
X1 = np.random.randn(n)
X2 = np.random.randn(n)
X3 = np.random.randn(n)
y = 2 + 3*X1 - 1.5*X2 + 0.5*X3 + np.random.randn(n) * 0.8

X = np.column_stack([X1, X2, X3])
X_with_const = sm.add_constant(X)
model = sm.OLS(y, X_with_const).fit()
print(model.summary())

# Check for multicollinearity using VIF
from statsmodels.stats.outliers_influence import variance_inflation_factor

vif_data = pd.DataFrame()
vif_data["Variable"] = ["X1", "X2", "X3"]
vif_data["VIF"] = [variance_inflation_factor(X, i) for i in range(X.shape[1])]
print("\nVariance Inflation Factors (VIF > 5 indicates multicollinearity):")
print(vif_data)
```

### Regression Diagnostics

```python
# Residual analysis
residuals = model.resid
fitted = model.fittedvalues

fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# Residuals vs Fitted values
axes[0, 0].scatter(fitted, residuals, alpha=0.5)
axes[0, 0].axhline(y=0, color='r', linestyle='--')
axes[0, 0].set_xlabel('Fitted Values')
axes[0, 0].set_ylabel('Residuals')
axes[0, 0].set_title('Residuals vs Fitted (check for homoscedasticity)')

# Q-Q plot for normality
stats.probplot(residuals, dist="norm", plot=axes[0, 1])
axes[0, 1].set_title('Normal Q-Q Plot')

# Histogram of residuals
axes[1, 0].hist(residuals, bins=20, edgecolor='black', density=True)
x_norm = np.linspace(residuals.min(), residuals.max(), 100)
axes[1, 0].plot(x_norm, stats.norm.pdf(x_norm, 0, residuals.std()), 'r-')
axes[1, 0].set_title('Residual Distribution')

# Scale-Location plot
standardized_residuals = (residuals - residuals.mean()) / residuals.std()
axes[1, 1].scatter(fitted, np.sqrt(np.abs(standardized_residuals)), alpha=0.5)
axes[1, 1].set_xlabel('Fitted Values')
axes[1, 1].set_ylabel('sqrt(|Standardized Residuals|)')
axes[1, 1].set_title('Scale-Location Plot')

plt.tight_layout()
plt.show()

# Formal tests
# Shapiro-Wilk test for normality of residuals
shapiro_stat, shapiro_p = stats.shapiro(residuals)
print(f"Shapiro-Wilk test for normality: p = {shapiro_p:.4f}")

# Breusch-Pagan test for heteroscedasticity
from statsmodels.stats.diagnostic import het_breuschpagan
bp_stat, bp_p, _, _ = het_breuschpagan(residuals, X_with_const)
print(f"Breusch-Pagan test for heteroscedasticity: p = {bp_p:.4f}")
```

## A/B Testing

A/B testing is a fundamental tool for data-driven decision making, used to compare two versions of something to determine which performs better.

### Sample Size Calculation

Before running an A/B test, calculate the required sample size to ensure adequate statistical power.

```python
from statsmodels.stats.power import TTestIndPower, NormalIndPower
from statsmodels.stats.proportion import proportion_effectsize

# Sample size for comparing means
analysis = TTestIndPower()

# Parameters
effect_size = 0.3    # Cohen's d (0.2=small, 0.5=medium, 0.8=large)
alpha = 0.05         # Significance level
power = 0.8          # Statistical power (1 - Type II error rate)

sample_size = analysis.solve_power(effect_size=effect_size,
                                    alpha=alpha,
                                    power=power,
                                    ratio=1.0,
                                    alternative='two-sided')
print(f"Required sample size per group: {int(np.ceil(sample_size))}")

# Sample size for comparing proportions
from statsmodels.stats.power import zt_ind_solve_power

p1 = 0.10  # Control group conversion rate
p2 = 0.12  # Expected treatment group conversion rate (20% relative lift)
effect_size = proportion_effectsize(p1, p2)

sample_size = zt_ind_solve_power(effect_size=effect_size,
                                  alpha=0.05,
                                  power=0.8,
                                  alternative='two-sided')
print(f"Required sample size per group for proportion test: {int(np.ceil(sample_size))}")

# Create a power curve
sample_sizes = np.arange(50, 1000, 50)
powers = [analysis.power(effect_size=0.3, nobs1=n, alpha=0.05, ratio=1.0)
          for n in sample_sizes]

plt.figure(figsize=(10, 5))
plt.plot(sample_sizes, powers, 'b-', linewidth=2)
plt.axhline(y=0.8, color='r', linestyle='--', label='80% power')
plt.xlabel('Sample Size per Group')
plt.ylabel('Statistical Power')
plt.title('Power Curve for Effect Size = 0.3')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()
```

### Analyzing A/B Test Results

```python
# A/B test analysis for conversion rates
np.random.seed(42)

# Simulated experiment data
n_control = 5000
n_treatment = 5000
conversions_control = 500    # 10% conversion rate
conversions_treatment = 560  # 11.2% conversion rate

# Calculate conversion rates
rate_control = conversions_control / n_control
rate_treatment = conversions_treatment / n_treatment
relative_lift = (rate_treatment - rate_control) / rate_control

print(f"Control conversion rate: {rate_control:.4f} ({rate_control*100:.2f}%)")
print(f"Treatment conversion rate: {rate_treatment:.4f} ({rate_treatment*100:.2f}%)")
print(f"Absolute difference: {rate_treatment - rate_control:.4f}")
print(f"Relative lift: {relative_lift*100:.2f}%")

# Two-proportion z-test
from statsmodels.stats.proportion import proportions_ztest

count = np.array([conversions_treatment, conversions_control])
nobs = np.array([n_treatment, n_control])

z_stat, p_value = proportions_ztest(count, nobs, alternative='two-sided')
print(f"\nZ-statistic: {z_stat:.4f}")
print(f"P-value: {p_value:.4f}")

# Confidence interval for the difference
from statsmodels.stats.proportion import confint_proportions_2indep

ci_low, ci_high = confint_proportions_2indep(
    conversions_treatment, n_treatment,
    conversions_control, n_control,
    method='wald'
)
print(f"95% CI for difference: [{ci_low:.4f}, {ci_high:.4f}]")

# Decision
alpha = 0.05
if p_value < alpha:
    if ci_low > 0:
        print("\nConclusion: Treatment significantly outperforms control")
    elif ci_high < 0:
        print("\nConclusion: Control significantly outperforms treatment")
else:
    print("\nConclusion: No statistically significant difference detected")
```

### A/B Testing Best Practices

```python
# Stratified analysis to check for Simpson's Paradox
def stratified_ab_analysis(data, strata_col, treatment_col, conversion_col):
    """
    Perform stratified A/B test analysis.

    Parameters:
    - data: DataFrame with experiment data
    - strata_col: Column name for stratification variable
    - treatment_col: Column name for treatment indicator (0/1)
    - conversion_col: Column name for conversion indicator (0/1)
    """
    results = []

    for stratum in data[strata_col].unique():
        subset = data[data[strata_col] == stratum]

        control = subset[subset[treatment_col] == 0]
        treatment = subset[subset[treatment_col] == 1]

        control_rate = control[conversion_col].mean()
        treatment_rate = treatment[conversion_col].mean()

        # Perform test within stratum
        count = np.array([treatment[conversion_col].sum(),
                         control[conversion_col].sum()])
        nobs = np.array([len(treatment), len(control)])

        z_stat, p_val = proportions_ztest(count, nobs, alternative='two-sided')

        results.append({
            'Stratum': stratum,
            'Control_N': len(control),
            'Treatment_N': len(treatment),
            'Control_Rate': control_rate,
            'Treatment_Rate': treatment_rate,
            'Lift': (treatment_rate - control_rate) / control_rate if control_rate > 0 else np.nan,
            'P_Value': p_val
        })

    return pd.DataFrame(results)

# Example usage (with simulated data)
np.random.seed(42)
n = 10000

ab_data = pd.DataFrame({
    'user_segment': np.random.choice(['New', 'Returning', 'VIP'], n, p=[0.5, 0.35, 0.15]),
    'treatment': np.random.binomial(1, 0.5, n),
    'converted': np.zeros(n)
})

# Simulate different conversion rates by segment and treatment
for idx, row in ab_data.iterrows():
    base_rate = {'New': 0.05, 'Returning': 0.10, 'VIP': 0.20}[row['user_segment']]
    lift = 0.15 if row['treatment'] == 1 else 0
    ab_data.loc[idx, 'converted'] = np.random.binomial(1, base_rate * (1 + lift))

# Perform stratified analysis
strat_results = stratified_ab_analysis(ab_data, 'user_segment', 'treatment', 'converted')
print("Stratified A/B Test Results:")
print(strat_results.to_string(index=False))
```

### A/B Testing Pitfalls to Avoid

1. **Peeking at Results**: Do not check results before reaching planned sample size
2. **Multiple Comparisons**: Adjust for testing multiple metrics
3. **Sample Ratio Mismatch**: Verify randomization is working correctly
4. **Novelty Effects**: New features may perform differently initially
5. **Seasonal Effects**: Ensure test duration accounts for cyclical patterns
6. **Interference Between Groups**: User interactions can contaminate results

## Statistical Significance

### Understanding P-values Correctly

A p-value is the probability of observing results as extreme as (or more extreme than) the observed data, assuming the null hypothesis is true.

**What P-value IS NOT**:
- NOT the probability that the null hypothesis is true
- NOT the probability that the result is due to chance
- NOT a measure of effect size
- NOT a guarantee of reproducibility

```python
# Demonstration: P-value simulation
np.random.seed(42)

# Simulate many experiments under H0 (no true effect)
n_simulations = 10000
p_values_null = []

for _ in range(n_simulations):
    group_a = np.random.normal(100, 15, 50)
    group_b = np.random.normal(100, 15, 50)  # Same mean - no effect
    _, p = stats.ttest_ind(group_a, group_b)
    p_values_null.append(p)

# Under H0, p-values should be uniformly distributed
plt.figure(figsize=(10, 4))
plt.hist(p_values_null, bins=20, edgecolor='black', density=True)
plt.axhline(y=1, color='r', linestyle='--', label='Expected uniform distribution')
plt.xlabel('P-value')
plt.ylabel('Density')
plt.title('Distribution of P-values Under Null Hypothesis')
plt.legend()
plt.show()

# Calculate false positive rate at alpha = 0.05
false_positives = sum(p < 0.05 for p in p_values_null) / n_simulations
print(f"False positive rate at alpha=0.05: {false_positives:.4f}")
```

### Multiple Comparisons Problem

When performing multiple tests, the probability of at least one false positive increases dramatically.

```python
from statsmodels.stats.multitest import multipletests

# Simulated p-values from 20 hypothesis tests
np.random.seed(42)
p_values = [0.01, 0.04, 0.03, 0.08, 0.005,
            0.12, 0.02, 0.15, 0.06, 0.001,
            0.07, 0.11, 0.035, 0.09, 0.025,
            0.18, 0.045, 0.22, 0.015, 0.13]

print("Original P-values:", [f"{p:.3f}" for p in p_values])
print(f"Significant at 0.05 (unadjusted): {sum(p < 0.05 for p in p_values)}")

# Bonferroni correction (most conservative)
rejected_bonf, p_bonf, _, _ = multipletests(p_values, alpha=0.05, method='bonferroni')
print(f"\nBonferroni correction:")
print(f"  Significant: {sum(rejected_bonf)}")

# Holm-Bonferroni (step-down, more powerful)
rejected_holm, p_holm, _, _ = multipletests(p_values, alpha=0.05, method='holm')
print(f"\nHolm-Bonferroni correction:")
print(f"  Significant: {sum(rejected_holm)}")

# Benjamini-Hochberg (FDR control)
rejected_fdr, p_fdr, _, _ = multipletests(p_values, alpha=0.05, method='fdr_bh')
print(f"\nBenjamini-Hochberg (FDR) correction:")
print(f"  Significant: {sum(rejected_fdr)}")

# Comparison table
comparison = pd.DataFrame({
    'Original P': p_values,
    'Bonferroni': p_bonf.round(4),
    'Holm': p_holm.round(4),
    'FDR': p_fdr.round(4)
})
print("\nAdjusted P-values comparison:")
print(comparison.head(10))
```

### Effect Size

Statistical significance alone is not enough. Always report effect sizes to understand practical significance.

```python
# Common effect size measures

def cohens_d(group1, group2):
    """Cohen's d for two independent groups"""
    n1, n2 = len(group1), len(group2)
    var1, var2 = np.var(group1, ddof=1), np.var(group2, ddof=1)
    pooled_std = np.sqrt(((n1-1)*var1 + (n2-1)*var2) / (n1+n2-2))
    return (np.mean(group1) - np.mean(group2)) / pooled_std

def hedges_g(group1, group2):
    """Hedges' g (bias-corrected Cohen's d)"""
    n1, n2 = len(group1), len(group2)
    d = cohens_d(group1, group2)
    correction = 1 - (3 / (4*(n1+n2) - 9))
    return d * correction

# Example
np.random.seed(42)
control = np.random.normal(100, 15, 100)
treatment = np.random.normal(105, 15, 100)

d = cohens_d(treatment, control)
g = hedges_g(treatment, control)

print(f"Cohen's d: {d:.4f}")
print(f"Hedges' g: {g:.4f}")
print("\nInterpretation guidelines for Cohen's d:")
print("  |d| < 0.2: Negligible")
print("  |d| = 0.2: Small")
print("  |d| = 0.5: Medium")
print("  |d| >= 0.8: Large")
```

## Common Pitfalls in Statistical Analysis

### Survivorship Bias

Analyzing only successful cases while ignoring failures leads to biased conclusions.

### Simpson's Paradox

A trend that appears in different groups can disappear or reverse when the groups are combined.

```python
# Simpson's Paradox demonstration
# Hypothetical data: Treatment success rates

data = pd.DataFrame({
    'Group': ['Treatment', 'Treatment', 'Control', 'Control'],
    'Severity': ['Mild', 'Severe', 'Mild', 'Severe'],
    'Patients': [100, 900, 900, 100],
    'Recovered': [90, 360, 810, 30]
})

data['Recovery_Rate'] = data['Recovered'] / data['Patients']
print("Recovery Rates by Group and Severity:")
print(data)

# Aggregate statistics
treatment = data[data['Group'] == 'Treatment']
control = data[data['Group'] == 'Control']

treatment_overall = treatment['Recovered'].sum() / treatment['Patients'].sum()
control_overall = control['Recovered'].sum() / control['Patients'].sum()

print(f"\nOverall Recovery Rates:")
print(f"  Treatment: {treatment_overall:.1%}")
print(f"  Control: {control_overall:.1%}")
print(f"\nParadox: Treatment appears worse overall, but is better in each subgroup!")
```

### Regression to the Mean

Extreme observations tend to be followed by more typical observations.

### Confusing Correlation with Causation

Always consider potential confounding variables and use proper causal inference methods when making causal claims.

### P-hacking and Data Dredging

- Analyzing data multiple ways until finding a significant result
- Adding/removing data points or variables to achieve significance
- Stopping data collection early when p < 0.05

### Ignoring Assumptions

```python
# Checking assumptions before applying statistical tests

def check_t_test_assumptions(group1, group2):
    """Check assumptions for independent samples t-test"""

    print("=== Checking t-test Assumptions ===\n")

    # 1. Normality (for small samples, n < 30)
    print("1. Normality Test (Shapiro-Wilk):")
    for i, group in enumerate([group1, group2], 1):
        stat, p = stats.shapiro(group)
        status = "PASS" if p > 0.05 else "FAIL"
        print(f"   Group {i}: p = {p:.4f} [{status}]")

    # 2. Homogeneity of variances
    print("\n2. Equality of Variances (Levene's Test):")
    stat, p = stats.levene(group1, group2)
    status = "PASS" if p > 0.05 else "FAIL"
    print(f"   p = {p:.4f} [{status}]")
    if p < 0.05:
        print("   Recommendation: Use Welch's t-test (equal_var=False)")

    # 3. Sample size
    print("\n3. Sample Sizes:")
    print(f"   Group 1: n = {len(group1)}")
    print(f"   Group 2: n = {len(group2)}")
    if len(group1) >= 30 and len(group2) >= 30:
        print("   Note: With n >= 30, t-test is robust to non-normality (CLT)")

# Example
np.random.seed(42)
group1 = np.random.normal(100, 15, 50)
group2 = np.random.exponential(15, 50) + 85  # Non-normal data

check_t_test_assumptions(group1, group2)
```

## Interview Key Points

### Common Interview Questions

**Q1: When should you use a t-test vs. a chi-square test?**

- **t-test**: Comparing means of continuous variables
- **Chi-square test**: Testing independence or fit for categorical variables

The choice depends on your data type:
- Continuous dependent variable -> t-test/ANOVA
- Categorical dependent variable -> Chi-square test

**Q2: How do you interpret a p-value?**

A p-value is the probability of observing results as extreme as the current data, assuming the null hypothesis is true. A small p-value provides evidence against H0, but it is NOT:
- The probability that H0 is true
- A measure of effect magnitude
- A guarantee of reproducibility

**Q3: What is the difference between Type I and Type II errors?**

- **Type I Error (False Positive)**: Rejecting H0 when it is true (probability = alpha)
- **Type II Error (False Negative)**: Failing to reject H0 when it is false (probability = beta)
- **Power** = 1 - beta = probability of correctly rejecting a false H0

**Q4: How is correlation different from causation?**

Correlation only indicates statistical association, not causation. Establishing causation requires:
- Randomized controlled experiments (A/B tests)
- Instrumental variables
- Regression discontinuity
- Difference-in-differences
- Other causal inference methods

**Q5: How do you handle multiple comparisons?**

When performing multiple tests, the overall Type I error rate inflates. Solutions:
- **Bonferroni correction**: Divide alpha by number of tests (most conservative)
- **Holm method**: Step-down procedure (more powerful)
- **FDR control**: Control false discovery rate (for exploratory analysis)

**Q6: What is statistical power and why does it matter?**

Statistical power is the probability of detecting a true effect (rejecting H0 when it is false). It depends on:
- Effect size (larger effect = more power)
- Sample size (larger n = more power)
- Significance level (larger alpha = more power, but more false positives)
- Variance (less variance = more power)

### Practical Skills Checklist

1. Select appropriate statistical methods based on data characteristics
2. Proficiently use Python for statistical analysis
3. Correctly interpret statistical results, distinguishing statistical from practical significance
4. Design and analyze A/B tests
5. Identify and handle common statistical pitfalls
6. Estimate effect sizes and calculate required sample sizes

## Further Reading

### Recommended Books

1. **"An Introduction to Statistical Learning" (ISLR)** - James et al. - Classic textbook for statistical foundations of machine learning
2. **"Naked Statistics"** - Charles Wheelan - Accessible introduction to statistics
3. **"Think Stats"** - Allen Downey - Python-based practical statistics
4. **"Statistics Done Wrong"** - Alex Reinhart - Common statistical mistakes and how to avoid them
5. **"The Art of Statistics"** - David Spiegelhalter - Learning from data

### Online Resources

- [Khan Academy Statistics](https://www.khanacademy.org/math/statistics-probability) - Free video courses
- [Seeing Theory](https://seeing-theory.brown.edu/) - Interactive visualization of statistical concepts
- [Statistics by Jim](https://statisticsbyjim.com/) - In-depth statistics blog
- [Stat Quest (YouTube)](https://www.youtube.com/c/joshstarmer) - Excellent video explanations

### Advanced Topics

After mastering the fundamentals, explore:
- Bayesian Statistics
- Survival Analysis
- Causal Inference Methods
- Multilevel/Mixed Effects Models
- Non-parametric Statistics
- Time Series Analysis

## Summary

Statistics is the foundation of data analysis. This article covered core topics from descriptive statistics to hypothesis testing, from correlation analysis to regression modeling, and provided practical guidance on A/B testing design. These concepts help you excel in interviews and make data-driven decisions in your career.

Remember, the purpose of statistical analysis is to extract insights from data and support decision-making, not just to compute p-values. Always focus on effect sizes, confidence intervals, and practical business implications. Avoid the trap of "p-value worship." Through continuous practice and integrating statistical thinking into your daily analytical work, you will become an excellent data analyst.

Key takeaways:
1. **Understand your data** before applying any statistical method
2. **Check assumptions** before running statistical tests
3. **Report effect sizes** alongside p-values
4. **Use confidence intervals** to express uncertainty
5. **Be aware of multiple comparisons** when testing multiple hypotheses
6. **Correlation is not causation** - use proper causal inference methods
7. **Pre-register** your analysis plan to avoid p-hacking
8. **Replicate** important findings before making major decisions
