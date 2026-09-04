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
origin: old/src/content/docs/data/statistics-fundamentals.zh.md
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

统计学是数据分析的基石。无论你是在进行探索性数据分析、构建机器学习模型，还是设计 A/B 测试，扎实的统计学基础都是不可或缺的。本文将系统地介绍数据分析中最常用的统计概念和方法，帮助你建立全面的统计学知识体系。

## 描述性统计

描述性统计提供了定量描述数据集基本特征的方法。主要包括集中趋势度量和离散程度度量两大类。

### 集中趋势度量

**均值（Mean）**：所有数据点的算术平均值。它对异常值敏感。

$$\bar{x} = \frac{1}{n}\sum_{i=1}^{n}x_i$$

**中位数（Median）**：将数据按升序排列后位于中间的值。它对异常值具有鲁棒性，在偏态分布中能更好地代表"典型"值。

**众数（Mode）**：数据集中出现频率最高的值。它特别适用于分类数据。

### 离散程度度量

**方差（Variance）**：衡量数据点相对于均值的分散程度。

$$s^2 = \frac{1}{n-1}\sum_{i=1}^{n}(x_i - \bar{x})^2$$

**标准差（Standard Deviation）**：方差的平方根，与原始数据单位相同，更易于解释。

**四分位距（IQR）**：第75百分位数（Q3）与第25百分位数（Q1）之差。常用于识别异常值。

```python
import numpy as np
import pandas as pd
from scipy import stats

# 创建示例数据
data = np.random.normal(loc=100, scale=15, size=1000)

# 计算描述性统计量
print(f"Mean: {np.mean(data):.2f}")
print(f"Median: {np.median(data):.2f}")
print(f"Standard Deviation: {np.std(data, ddof=1):.2f}")
print(f"Variance: {np.var(data, ddof=1):.2f}")

# 使用 pandas describe() 获取综合统计信息
df = pd.DataFrame({'value': data})
print(df.describe())

# 偏度和峰度
print(f"Skewness: {stats.skew(data):.4f}")
print(f"Kurtosis: {stats.kurtosis(data):.4f}")

# 百分位数和四分位距
q1 = np.percentile(data, 25)
q3 = np.percentile(data, 75)
iqr = q3 - q1
print(f"Q1: {q1:.2f}, Q3: {q3:.2f}, IQR: {iqr:.2f}")

# 使用 IQR 方法识别异常值
lower_bound = q1 - 1.5 * iqr
upper_bound = q3 + 1.5 * iqr
outliers = data[(data < lower_bound) | (data > upper_bound)]
print(f"Number of outliers: {len(outliers)}")
```

### 分布形态

**偏度（Skewness）**：衡量数据分布的不对称性。正偏度表示右尾较长，负偏度表示左尾较长。

**峰度（Kurtosis）**：衡量分布的"尾部厚度"。高峰度表示数据集中在均值附近且尾部较厚（异常值更多），低峰度表示尾部较轻。

```python
import matplotlib.pyplot as plt

# 可视化偏度
fig, axes = plt.subplots(1, 3, figsize=(15, 4))

# 左偏（负偏度）
left_skewed = np.random.beta(5, 2, 1000) * 100
axes[0].hist(left_skewed, bins=30, edgecolor='black')
axes[0].set_title(f'Left-Skewed (Skewness: {stats.skew(left_skewed):.2f})')

# 对称（正态）
symmetric = np.random.normal(50, 10, 1000)
axes[1].hist(symmetric, bins=30, edgecolor='black')
axes[1].set_title(f'Symmetric (Skewness: {stats.skew(symmetric):.2f})')

# 右偏（正偏度）
right_skewed = np.random.exponential(20, 1000)
axes[2].hist(right_skewed, bins=30, edgecolor='black')
axes[2].set_title(f'Right-Skewed (Skewness: {stats.skew(right_skewed):.2f})')

plt.tight_layout()
plt.show()
```

## 概率分布

理解常见概率分布是统计推断的基础。它们是随机现象的数学模型。

### 离散分布

**二项分布（Binomial Distribution）**：描述 n 次独立伯努利试验中成功次数的分布。

$$P(X=k) = \binom{n}{k}p^k(1-p)^{n-k}$$

应用场景：点击率分析、质量控制缺陷计数、A/B 测试转化率。

```python
from scipy import stats
import matplotlib.pyplot as plt

# 二项分布示例：n 次试验中 k 次成功的概率
n, p = 100, 0.3  # 100 次试验，成功概率 30%

# 计算概率
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

# 实际案例：如果基准转化率为 30%，至少 35 次转化的概率
prob_at_least_35 = 1 - stats.binom.cdf(34, n, p)
print(f"P(X >= 35) = {prob_at_least_35:.4f}")
```

**泊松分布（Poisson Distribution）**：描述在固定时间或空间区间内事件发生次数的分布。

$$P(X=k) = \frac{\lambda^k e^{-\lambda}}{k!}$$

应用场景：网站流量分析、呼叫中心来电、系统故障计数、稀有事件建模。

```python
# 泊松分布示例
lambda_param = 5  # 平均每时间单位 5 个事件

k = np.arange(0, 15)
probabilities = stats.poisson.pmf(k, lambda_param)

plt.figure(figsize=(10, 4))
plt.bar(k, probabilities, color='coral', edgecolor='black')
plt.xlabel('Number of Events')
plt.ylabel('Probability')
plt.title(f'Poisson Distribution (lambda = {lambda_param})')
plt.show()

# 示例：平均每小时 5 个工单时，收到超过 8 个工单的概率
prob_more_than_8 = 1 - stats.poisson.cdf(8, lambda_param)
print(f"P(X > 8) = {prob_more_than_8:.4f}")
```

### 连续分布

**正态分布（高斯分布）**：最重要的连续分布，完全由均值和标准差决定。

$$f(x) = \frac{1}{\sigma\sqrt{2\pi}}e^{-\frac{(x-\mu)^2}{2\sigma^2}}$$

**中心极限定理**：无论总体分布如何，随着样本量增大，样本均值的分布趋近于正态分布。这是许多统计推断方法的理论基础。

```python
# 中心极限定理演示
np.random.seed(42)

# 从指数分布（明显非正态）生成样本
population = np.random.exponential(scale=2, size=100000)

# 重复抽样并计算均值
sample_sizes = [5, 30, 100]
fig, axes = plt.subplots(1, 4, figsize=(16, 4))

# 原始总体分布
axes[0].hist(population, bins=50, density=True, edgecolor='black')
axes[0].set_title('Population (Exponential)')

for i, n in enumerate(sample_sizes):
    sample_means = [np.mean(np.random.choice(population, n)) for _ in range(1000)]
    axes[i+1].hist(sample_means, bins=30, density=True, edgecolor='black')
    axes[i+1].set_title(f'Sample Means (n={n})')

plt.tight_layout()
plt.show()
```

**其他重要分布**：

```python
# 常见分布对比
fig, axes = plt.subplots(2, 2, figsize=(12, 10))
x = np.linspace(-5, 5, 100)

# 正态分布
axes[0, 0].plot(x, stats.norm.pdf(x, 0, 1), 'b-', label='N(0,1)')
axes[0, 0].plot(x, stats.norm.pdf(x, 0, 2), 'r--', label='N(0,2)')
axes[0, 0].set_title('Normal Distribution')
axes[0, 0].legend()

# t 分布（尾部比正态分布更厚）
axes[0, 1].plot(x, stats.norm.pdf(x), 'b-', label='Normal')
axes[0, 1].plot(x, stats.t.pdf(x, df=3), 'r--', label='t (df=3)')
axes[0, 1].plot(x, stats.t.pdf(x, df=10), 'g-.', label='t (df=10)')
axes[0, 1].set_title('t-Distribution vs Normal')
axes[0, 1].legend()

# 卡方分布
x_chi = np.linspace(0, 20, 100)
for df in [2, 5, 10]:
    axes[1, 0].plot(x_chi, stats.chi2.pdf(x_chi, df), label=f'df={df}')
axes[1, 0].set_title('Chi-Squared Distribution')
axes[1, 0].legend()

# F 分布
x_f = np.linspace(0, 5, 100)
axes[1, 1].plot(x_f, stats.f.pdf(x_f, 5, 20), label='F(5,20)')
axes[1, 1].plot(x_f, stats.f.pdf(x_f, 10, 30), label='F(10,30)')
axes[1, 1].set_title('F-Distribution')
axes[1, 1].legend()

plt.tight_layout()
plt.show()
```

## 假设检验

假设检验是统计推断的核心方法，用于根据样本数据对总体参数做出决策。

### 假设检验的基本步骤

1. **建立假设**：原假设（H0）和备择假设（H1）
2. **选择显著性水平**：通常 alpha = 0.05
3. **计算检验统计量**
4. **确定 P 值或临界值**
5. **做出决策**：拒绝或不拒绝原假设

### 理解第一类和第二类错误

| 决策 | H0 为真 | H0 为假 |
|----------|---------|----------|
| 拒绝 H0 | 第一类错误 (alpha) | 正确决策（检验效能）|
| 不拒绝 H0 | 正确决策 | 第二类错误 (beta) |

- **第一类错误（假阳性）**：当 H0 实际为真时拒绝 H0。概率 = alpha
- **第二类错误（假阴性）**：当 H0 实际为假时未能拒绝 H0。概率 = beta
- **统计检验效能** = 1 - beta = 正确拒绝错误 H0 的概率

### t 检验

t 检验用于比较均值，特别适用于样本量较小或总体标准差未知的情况。

**单样本 t 检验**：检验样本均值是否等于某个特定值。

```python
from scipy import stats

# 单样本 t 检验：均值是否等于 100？
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

**独立样本 t 检验**：比较两个独立组的均值。

```python
# 独立样本 t 检验
group_a = np.random.normal(100, 15, 50)
group_b = np.random.normal(105, 15, 50)

# 首先检验方差齐性（Levene 检验）
levene_stat, levene_p = stats.levene(group_a, group_b)
print(f"Levene's test for equality of variances: p = {levene_p:.4f}")

# 根据 Levene 检验结果选择 equal_var 参数
equal_var = levene_p > 0.05
t_stat, p_value = stats.ttest_ind(group_a, group_b, equal_var=equal_var)

print(f"Group A mean: {np.mean(group_a):.2f}")
print(f"Group B mean: {np.mean(group_b):.2f}")
print(f"t-statistic: {t_stat:.4f}")
print(f"P-value: {p_value:.4f}")

# 效应量（Cohen's d）
pooled_std = np.sqrt(((len(group_a)-1)*np.var(group_a, ddof=1) +
                       (len(group_b)-1)*np.var(group_b, ddof=1)) /
                      (len(group_a) + len(group_b) - 2))
cohens_d = (np.mean(group_b) - np.mean(group_a)) / pooled_std
print(f"Cohen's d effect size: {cohens_d:.4f}")
```

**配对样本 t 检验**：比较同一组在两种条件下的均值。

```python
# 配对 t 检验：处理前后对比
before = np.random.normal(50, 10, 30)
after = before + np.random.normal(5, 5, 30)  # 模拟改善效果

t_stat, p_value = stats.ttest_rel(before, after)
print(f"Mean before: {np.mean(before):.2f}")
print(f"Mean after: {np.mean(after):.2f}")
print(f"Mean difference: {np.mean(after - before):.2f}")
print(f"Paired t-test p-value: {p_value:.4f}")
```

### 卡方检验

卡方检验用于分类数据，检验独立性或拟合优度。

**独立性检验**：检验两个分类变量是否独立。

```python
# 卡方独立性检验
# 示例：性别与产品偏好是否独立？
observed = np.array([
    [50, 30, 20],   # 男性对产品 A、B、C 的偏好
    [35, 45, 20]    # 女性对产品 A、B、C 的偏好
])

chi2, p_value, dof, expected = stats.chi2_contingency(observed)
print(f"Chi-square statistic: {chi2:.4f}")
print(f"P-value: {p_value:.4f}")
print(f"Degrees of freedom: {dof}")
print(f"Expected frequencies:\n{expected}")

# 效应量（Cramer's V）
n = observed.sum()
min_dim = min(observed.shape) - 1
cramers_v = np.sqrt(chi2 / (n * min_dim))
print(f"Cramer's V: {cramers_v:.4f}")
```

**拟合优度检验**：检验观察频率是否符合期望频率。

```python
# 拟合优度检验：这个骰子是否公平？
observed_freq = [18, 22, 16, 21, 19, 24]  # 实际投掷结果
expected_freq = [20, 20, 20, 20, 20, 20]  # 公平骰子的期望频率

chi2, p_value = stats.chisquare(observed_freq, expected_freq)
print(f"Chi-square statistic: {chi2:.4f}")
print(f"P-value: {p_value:.4f}")

if p_value < 0.05:
    print("The die appears to be unfair")
else:
    print("No evidence that the die is unfair")
```

## 置信区间

置信区间为总体参数提供了一个可信值范围，表达了我们估计的不确定性。

### 理解置信区间

95% 置信区间的含义是：如果我们重复多次抽样过程，约 95% 的计算区间会包含真实的总体参数。

**重要提示**：置信水平指的是这个过程，而不是某个特定区间包含参数的概率。

```python
from scipy import stats

# 计算均值的 95% 置信区间
sample = np.random.normal(100, 15, 50)
mean = np.mean(sample)
se = stats.sem(sample)  # 均值的标准误

# 使用 t 分布计算置信区间
confidence_level = 0.95
ci = stats.t.interval(confidence_level, len(sample)-1, loc=mean, scale=se)
print(f"Sample mean: {mean:.2f}")
print(f"Standard error: {se:.2f}")
print(f"95% Confidence Interval: [{ci[0]:.2f}, {ci[1]:.2f}]")

# 不同置信水平的置信区间
for level in [0.90, 0.95, 0.99]:
    ci = stats.t.interval(level, len(sample)-1, loc=mean, scale=se)
    print(f"{int(level*100)}% CI: [{ci[0]:.2f}, {ci[1]:.2f}]")
```

### Bootstrap 置信区间

Bootstrap 方法通过重抽样提供非参数置信区间。

```python
from scipy.stats import bootstrap

# Bootstrap 置信区间
np.random.seed(42)
sample = np.random.normal(100, 15, 50)

# 使用 scipy 的 bootstrap 函数
data = (sample,)
res = bootstrap(data, np.mean, n_resamples=10000, random_state=42)
print(f"Bootstrap 95% CI: [{res.confidence_interval.low:.2f}, "
      f"{res.confidence_interval.high:.2f}]")

# 手动实现 bootstrap
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

### 比例的置信区间

```python
from statsmodels.stats.proportion import proportion_confint

# 比例的置信区间
successes = 120
trials = 400
proportion = successes / trials

# Wilson 评分区间（推荐）
ci_wilson = proportion_confint(successes, trials, method='wilson')
print(f"Sample proportion: {proportion:.4f}")
print(f"Wilson 95% CI: [{ci_wilson[0]:.4f}, {ci_wilson[1]:.4f}]")

# 正态近似（仅适用于大样本）
ci_normal = proportion_confint(successes, trials, method='normal')
print(f"Normal 95% CI: [{ci_normal[0]:.4f}, {ci_normal[1]:.4f}]")
```

## 相关与回归

### 相关分析

相关性衡量两个变量之间线性关系的强度和方向。

**皮尔逊相关系数**：衡量连续变量之间的线性相关性，取值范围 -1 到 1。

$$r = \frac{\sum_{i=1}^{n}(x_i-\bar{x})(y_i-\bar{y})}{\sqrt{\sum_{i=1}^{n}(x_i-\bar{x})^2}\sqrt{\sum_{i=1}^{n}(y_i-\bar{y})^2}}$$

**斯皮尔曼等级相关**：适用于非线性单调关系或有序数据。

**肯德尔 tau**：另一种基于等级的相关系数，对小样本更稳健。

```python
np.random.seed(42)
x = np.random.randn(100)
y = 2 * x + np.random.randn(100) * 0.5

# 皮尔逊相关
pearson_r, pearson_p = stats.pearsonr(x, y)
print(f"Pearson r: {pearson_r:.4f}, p-value: {pearson_p:.4f}")

# 斯皮尔曼等级相关
spearman_r, spearman_p = stats.spearmanr(x, y)
print(f"Spearman rho: {spearman_r:.4f}, p-value: {spearman_p:.4f}")

# 肯德尔 tau
kendall_tau, kendall_p = stats.kendalltau(x, y)
print(f"Kendall tau: {kendall_tau:.4f}, p-value: {kendall_p:.4f}")

# 可视化相关性
plt.figure(figsize=(8, 6))
plt.scatter(x, y, alpha=0.6)
plt.xlabel('X')
plt.ylabel('Y')
plt.title(f'Scatter Plot (r = {pearson_r:.3f})')

# 添加回归线
z = np.polyfit(x, y, 1)
p = np.poly1d(z)
plt.plot(x, p(x), "r-", linewidth=2, label='Best fit line')
plt.legend()
plt.show()
```

**重要提醒**：相关不等于因果！两个变量之间的相关性可能是由第三个混杂变量引起的。

### 线性回归

线性回归建模因变量与一个或多个自变量之间的关系。

**简单线性回归**：

$$y = \beta_0 + \beta_1 x + \epsilon$$

```python
import statsmodels.api as sm
from sklearn.linear_model import LinearRegression

# 生成数据
np.random.seed(42)
X = np.random.randn(100, 1)
y = 3 + 2 * X.flatten() + np.random.randn(100) * 0.5

# 使用 statsmodels 获取详细统计输出
X_with_const = sm.add_constant(X)
model = sm.OLS(y, X_with_const).fit()
print(model.summary())

# 关键指标解读
print(f"\n--- Key Interpretation ---")
print(f"R-squared: {model.rsquared:.4f} (explains {model.rsquared*100:.1f}% of variance)")
print(f"Adjusted R-squared: {model.rsquared_adj:.4f}")
print(f"Intercept (beta_0): {model.params[0]:.4f}")
print(f"Slope (beta_1): {model.params[1]:.4f}")
print(f"Slope p-value: {model.pvalues[1]:.4f}")
```

**多元线性回归**：

```python
# 多元线性回归
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

# 使用 VIF 检验多重共线性
from statsmodels.stats.outliers_influence import variance_inflation_factor

vif_data = pd.DataFrame()
vif_data["Variable"] = ["X1", "X2", "X3"]
vif_data["VIF"] = [variance_inflation_factor(X, i) for i in range(X.shape[1])]
print("\nVariance Inflation Factors (VIF > 5 indicates multicollinearity):")
print(vif_data)
```

### 回归诊断

```python
# 残差分析
residuals = model.resid
fitted = model.fittedvalues

fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# 残差 vs 拟合值
axes[0, 0].scatter(fitted, residuals, alpha=0.5)
axes[0, 0].axhline(y=0, color='r', linestyle='--')
axes[0, 0].set_xlabel('Fitted Values')
axes[0, 0].set_ylabel('Residuals')
axes[0, 0].set_title('Residuals vs Fitted (check for homoscedasticity)')

# 正态性 Q-Q 图
stats.probplot(residuals, dist="norm", plot=axes[0, 1])
axes[0, 1].set_title('Normal Q-Q Plot')

# 残差直方图
axes[1, 0].hist(residuals, bins=20, edgecolor='black', density=True)
x_norm = np.linspace(residuals.min(), residuals.max(), 100)
axes[1, 0].plot(x_norm, stats.norm.pdf(x_norm, 0, residuals.std()), 'r-')
axes[1, 0].set_title('Residual Distribution')

# 尺度-位置图
standardized_residuals = (residuals - residuals.mean()) / residuals.std()
axes[1, 1].scatter(fitted, np.sqrt(np.abs(standardized_residuals)), alpha=0.5)
axes[1, 1].set_xlabel('Fitted Values')
axes[1, 1].set_ylabel('sqrt(|Standardized Residuals|)')
axes[1, 1].set_title('Scale-Location Plot')

plt.tight_layout()
plt.show()

# 正式检验
# Shapiro-Wilk 残差正态性检验
shapiro_stat, shapiro_p = stats.shapiro(residuals)
print(f"Shapiro-Wilk test for normality: p = {shapiro_p:.4f}")

# Breusch-Pagan 异方差检验
from statsmodels.stats.diagnostic import het_breuschpagan
bp_stat, bp_p, _, _ = het_breuschpagan(residuals, X_with_const)
print(f"Breusch-Pagan test for heteroscedasticity: p = {bp_p:.4f}")
```

## A/B 测试

A/B 测试是数据驱动决策的基础工具，用于比较两个版本以确定哪个表现更好。

### 样本量计算

在运行 A/B 测试之前，需要计算所需的样本量以确保足够的统计检验效能。

```python
from statsmodels.stats.power import TTestIndPower, NormalIndPower
from statsmodels.stats.proportion import proportion_effectsize

# 比较均值的样本量计算
analysis = TTestIndPower()

# 参数
effect_size = 0.3    # Cohen's d（0.2=小，0.5=中，0.8=大）
alpha = 0.05         # 显著性水平
power = 0.8          # 统计检验效能（1 - 第二类错误率）

sample_size = analysis.solve_power(effect_size=effect_size,
                                    alpha=alpha,
                                    power=power,
                                    ratio=1.0,
                                    alternative='two-sided')
print(f"Required sample size per group: {int(np.ceil(sample_size))}")

# 比较比例的样本量计算
from statsmodels.stats.power import zt_ind_solve_power

p1 = 0.10  # 对照组转化率
p2 = 0.12  # 实验组预期转化率（20% 相对提升）
effect_size = proportion_effectsize(p1, p2)

sample_size = zt_ind_solve_power(effect_size=effect_size,
                                  alpha=0.05,
                                  power=0.8,
                                  alternative='two-sided')
print(f"Required sample size per group for proportion test: {int(np.ceil(sample_size))}")

# 绘制检验效能曲线
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

### 分析 A/B 测试结果

```python
# 转化率 A/B 测试分析
np.random.seed(42)

# 模拟实验数据
n_control = 5000
n_treatment = 5000
conversions_control = 500    # 10% 转化率
conversions_treatment = 560  # 11.2% 转化率

# 计算转化率
rate_control = conversions_control / n_control
rate_treatment = conversions_treatment / n_treatment
relative_lift = (rate_treatment - rate_control) / rate_control

print(f"Control conversion rate: {rate_control:.4f} ({rate_control*100:.2f}%)")
print(f"Treatment conversion rate: {rate_treatment:.4f} ({rate_treatment*100:.2f}%)")
print(f"Absolute difference: {rate_treatment - rate_control:.4f}")
print(f"Relative lift: {relative_lift*100:.2f}%")

# 两比例 z 检验
from statsmodels.stats.proportion import proportions_ztest

count = np.array([conversions_treatment, conversions_control])
nobs = np.array([n_treatment, n_control])

z_stat, p_value = proportions_ztest(count, nobs, alternative='two-sided')
print(f"\nZ-statistic: {z_stat:.4f}")
print(f"P-value: {p_value:.4f}")

# 差异的置信区间
from statsmodels.stats.proportion import confint_proportions_2indep

ci_low, ci_high = confint_proportions_2indep(
    conversions_treatment, n_treatment,
    conversions_control, n_control,
    method='wald'
)
print(f"95% CI for difference: [{ci_low:.4f}, {ci_high:.4f}]")

# 决策
alpha = 0.05
if p_value < alpha:
    if ci_low > 0:
        print("\nConclusion: Treatment significantly outperforms control")
    elif ci_high < 0:
        print("\nConclusion: Control significantly outperforms treatment")
else:
    print("\nConclusion: No statistically significant difference detected")
```

### A/B 测试最佳实践

```python
# 分层分析以检查辛普森悖论
def stratified_ab_analysis(data, strata_col, treatment_col, conversion_col):
    """
    执行分层 A/B 测试分析。

    参数：
    - data: 包含实验数据的 DataFrame
    - strata_col: 分层变量的列名
    - treatment_col: 处理标识列名（0/1）
    - conversion_col: 转化标识列名（0/1）
    """
    results = []

    for stratum in data[strata_col].unique():
        subset = data[data[strata_col] == stratum]

        control = subset[subset[treatment_col] == 0]
        treatment = subset[subset[treatment_col] == 1]

        control_rate = control[conversion_col].mean()
        treatment_rate = treatment[conversion_col].mean()

        # 在分层内进行检验
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

# 使用示例（模拟数据）
np.random.seed(42)
n = 10000

ab_data = pd.DataFrame({
    'user_segment': np.random.choice(['New', 'Returning', 'VIP'], n, p=[0.5, 0.35, 0.15]),
    'treatment': np.random.binomial(1, 0.5, n),
    'converted': np.zeros(n)
})

# 按分层和处理模拟不同的转化率
for idx, row in ab_data.iterrows():
    base_rate = {'New': 0.05, 'Returning': 0.10, 'VIP': 0.20}[row['user_segment']]
    lift = 0.15 if row['treatment'] == 1 else 0
    ab_data.loc[idx, 'converted'] = np.random.binomial(1, base_rate * (1 + lift))

# 执行分层分析
strat_results = stratified_ab_analysis(ab_data, 'user_segment', 'treatment', 'converted')
print("Stratified A/B Test Results:")
print(strat_results.to_string(index=False))
```

### A/B 测试需要避免的陷阱

1. **过早查看结果**：在达到计划样本量之前不要检查结果
2. **多重比较**：测试多个指标时需要进行调整
3. **样本比例不匹配**：验证随机化是否正常工作
4. **新奇效应**：新功能初期可能表现不同
5. **季节性效应**：确保测试持续时间涵盖周期性模式
6. **组间干扰**：用户交互可能污染结果

## 统计显著性

### 正确理解 P 值

P 值是在假设原假设为真的条件下，观察到与当前数据一样极端（或更极端）结果的概率。

**P 值不是**：
- 不是原假设为真的概率
- 不是结果由随机产生的概率
- 不是效应量的度量
- 不是可重复性的保证

```python
# 演示：P 值模拟
np.random.seed(42)

# 在 H0 成立（无真实效应）的情况下模拟多次实验
n_simulations = 10000
p_values_null = []

for _ in range(n_simulations):
    group_a = np.random.normal(100, 15, 50)
    group_b = np.random.normal(100, 15, 50)  # 相同均值 - 无效应
    _, p = stats.ttest_ind(group_a, group_b)
    p_values_null.append(p)

# 在 H0 成立时，P 值应服从均匀分布
plt.figure(figsize=(10, 4))
plt.hist(p_values_null, bins=20, edgecolor='black', density=True)
plt.axhline(y=1, color='r', linestyle='--', label='Expected uniform distribution')
plt.xlabel('P-value')
plt.ylabel('Density')
plt.title('Distribution of P-values Under Null Hypothesis')
plt.legend()
plt.show()

# 计算 alpha = 0.05 时的假阳性率
false_positives = sum(p < 0.05 for p in p_values_null) / n_simulations
print(f"False positive rate at alpha=0.05: {false_positives:.4f}")
```

### 多重比较问题

进行多次检验时，至少出现一次假阳性的概率会急剧增加。

```python
from statsmodels.stats.multitest import multipletests

# 模拟 20 个假设检验的 P 值
np.random.seed(42)
p_values = [0.01, 0.04, 0.03, 0.08, 0.005,
            0.12, 0.02, 0.15, 0.06, 0.001,
            0.07, 0.11, 0.035, 0.09, 0.025,
            0.18, 0.045, 0.22, 0.015, 0.13]

print("Original P-values:", [f"{p:.3f}" for p in p_values])
print(f"Significant at 0.05 (unadjusted): {sum(p < 0.05 for p in p_values)}")

# Bonferroni 校正（最保守）
rejected_bonf, p_bonf, _, _ = multipletests(p_values, alpha=0.05, method='bonferroni')
print(f"\nBonferroni correction:")
print(f"  Significant: {sum(rejected_bonf)}")

# Holm-Bonferroni（逐步下降，更强效）
rejected_holm, p_holm, _, _ = multipletests(p_values, alpha=0.05, method='holm')
print(f"\nHolm-Bonferroni correction:")
print(f"  Significant: {sum(rejected_holm)}")

# Benjamini-Hochberg（FDR 控制）
rejected_fdr, p_fdr, _, _ = multipletests(p_values, alpha=0.05, method='fdr_bh')
print(f"\nBenjamini-Hochberg (FDR) correction:")
print(f"  Significant: {sum(rejected_fdr)}")

# 对比表
comparison = pd.DataFrame({
    'Original P': p_values,
    'Bonferroni': p_bonf.round(4),
    'Holm': p_holm.round(4),
    'FDR': p_fdr.round(4)
})
print("\nAdjusted P-values comparison:")
print(comparison.head(10))
```

### 效应量

仅有统计显著性是不够的。始终报告效应量以了解实际意义。

```python
# 常见效应量度量

def cohens_d(group1, group2):
    """两个独立组的 Cohen's d"""
    n1, n2 = len(group1), len(group2)
    var1, var2 = np.var(group1, ddof=1), np.var(group2, ddof=1)
    pooled_std = np.sqrt(((n1-1)*var1 + (n2-1)*var2) / (n1+n2-2))
    return (np.mean(group1) - np.mean(group2)) / pooled_std

def hedges_g(group1, group2):
    """Hedges' g（偏差校正的 Cohen's d）"""
    n1, n2 = len(group1), len(group2)
    d = cohens_d(group1, group2)
    correction = 1 - (3 / (4*(n1+n2) - 9))
    return d * correction

# 示例
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

## 统计分析常见陷阱

### 幸存者偏差

仅分析成功案例而忽略失败案例会导致有偏的结论。

### 辛普森悖论

在不同组中出现的趋势在合并数据后可能消失或逆转。

```python
# 辛普森悖论演示
# 假设数据：治疗成功率

data = pd.DataFrame({
    'Group': ['Treatment', 'Treatment', 'Control', 'Control'],
    'Severity': ['Mild', 'Severe', 'Mild', 'Severe'],
    'Patients': [100, 900, 900, 100],
    'Recovered': [90, 360, 810, 30]
})

data['Recovery_Rate'] = data['Recovered'] / data['Patients']
print("Recovery Rates by Group and Severity:")
print(data)

# 汇总统计
treatment = data[data['Group'] == 'Treatment']
control = data[data['Group'] == 'Control']

treatment_overall = treatment['Recovered'].sum() / treatment['Patients'].sum()
control_overall = control['Recovered'].sum() / control['Patients'].sum()

print(f"\nOverall Recovery Rates:")
print(f"  Treatment: {treatment_overall:.1%}")
print(f"  Control: {control_overall:.1%}")
print(f"\nParadox: Treatment appears worse overall, but is better in each subgroup!")
```

### 回归到均值

极端观测值之后往往会出现更典型的观测值。

### 混淆相关与因果

在做因果声明时，始终考虑潜在的混杂变量并使用适当的因果推断方法。

### P-hacking 和数据挖掘

- 用多种方式分析数据直到找到显著结果
- 添加/删除数据点或变量以达到显著性
- 当 p < 0.05 时提前停止数据收集

### 忽略假设条件

```python
# 应用统计检验前检查假设条件

def check_t_test_assumptions(group1, group2):
    """检查独立样本 t 检验的假设条件"""

    print("=== Checking t-test Assumptions ===\n")

    # 1. 正态性（对于小样本，n < 30）
    print("1. Normality Test (Shapiro-Wilk):")
    for i, group in enumerate([group1, group2], 1):
        stat, p = stats.shapiro(group)
        status = "PASS" if p > 0.05 else "FAIL"
        print(f"   Group {i}: p = {p:.4f} [{status}]")

    # 2. 方差齐性
    print("\n2. Equality of Variances (Levene's Test):")
    stat, p = stats.levene(group1, group2)
    status = "PASS" if p > 0.05 else "FAIL"
    print(f"   p = {p:.4f} [{status}]")
    if p < 0.05:
        print("   Recommendation: Use Welch's t-test (equal_var=False)")

    # 3. 样本量
    print("\n3. Sample Sizes:")
    print(f"   Group 1: n = {len(group1)}")
    print(f"   Group 2: n = {len(group2)}")
    if len(group1) >= 30 and len(group2) >= 30:
        print("   Note: With n >= 30, t-test is robust to non-normality (CLT)")

# 示例
np.random.seed(42)
group1 = np.random.normal(100, 15, 50)
group2 = np.random.exponential(15, 50) + 85  # 非正态数据

check_t_test_assumptions(group1, group2)
```

## 面试要点

### 常见面试问题

**Q1：什么时候应该使用 t 检验 vs. 卡方检验？**

- **t 检验**：比较连续变量的均值
- **卡方检验**：检验分类变量的独立性或拟合度

选择取决于你的数据类型：
- 连续因变量 -> t 检验/ANOVA
- 分类因变量 -> 卡方检验

**Q2：如何解释 P 值？**

P 值是在原假设为真的条件下，观察到与当前数据一样极端结果的概率。小的 P 值提供了反对 H0 的证据，但它不是：
- 原假设为真的概率
- 效应大小的度量
- 可重复性的保证

**Q3：第一类错误和第二类错误有什么区别？**

- **第一类错误（假阳性）**：当 H0 为真时拒绝 H0（概率 = alpha）
- **第二类错误（假阴性）**：当 H0 为假时未能拒绝 H0（概率 = beta）
- **检验效能** = 1 - beta = 正确拒绝错误 H0 的概率

**Q4：相关和因果有什么区别？**

相关仅表示统计关联，不等于因果。建立因果关系需要：
- 随机对照实验（A/B 测试）
- 工具变量
- 断点回归
- 双重差分
- 其他因果推断方法

**Q5：如何处理多重比较问题？**

进行多次检验时，总体第一类错误率会膨胀。解决方案：
- **Bonferroni 校正**：将 alpha 除以检验次数（最保守）
- **Holm 方法**：逐步下降程序（更强效）
- **FDR 控制**：控制错误发现率（适用于探索性分析）

**Q6：什么是统计检验效能，为什么它很重要？**

统计检验效能是检测到真实效应的概率（当 H0 为假时拒绝 H0）。它取决于：
- 效应量（效应越大 = 检验效能越高）
- 样本量（n 越大 = 检验效能越高）
- 显著性水平（alpha 越大 = 检验效能越高，但假阳性更多）
- 方差（方差越小 = 检验效能越高）

### 实践技能清单

1. 根据数据特征选择合适的统计方法
2. 熟练使用 Python 进行统计分析
3. 正确解释统计结果，区分统计显著性和实际意义
4. 设计和分析 A/B 测试
5. 识别和处理常见的统计陷阱
6. 估计效应量并计算所需样本量

## 延伸阅读

### 推荐书籍

1. **《An Introduction to Statistical Learning》（ISLR）** - James 等 - 机器学习统计基础经典教材
2. **《Naked Statistics》** - Charles Wheelan - 通俗易懂的统计学入门
3. **《Think Stats》** - Allen Downey - 基于 Python 的实践统计学
4. **《Statistics Done Wrong》** - Alex Reinhart - 常见统计错误及如何避免
5. **《The Art of Statistics》** - David Spiegelhalter - 从数据中学习

### 在线资源

- [Khan Academy Statistics](https://www.khanacademy.org/math/statistics-probability) - 免费视频课程
- [Seeing Theory](https://seeing-theory.brown.edu/) - 统计概念的交互式可视化
- [Statistics by Jim](https://statisticsbyjim.com/) - 深入的统计学博客
- [Stat Quest (YouTube)](https://www.youtube.com/c/joshstarmer) - 优秀的视频讲解

### 进阶主题

掌握基础后，可以探索：
- 贝叶斯统计
- 生存分析
- 因果推断方法
- 多层/混合效应模型
- 非参数统计
- 时间序列分析

## 总结

统计学是数据分析的基础。本文涵盖了从描述性统计到假设检验、从相关分析到回归建模的核心主题，并提供了 A/B 测试设计的实践指导。掌握这些概念将帮助你在面试中脱颖而出，并在职业生涯中做出数据驱动的决策。

记住，统计分析的目的是从数据中提取洞见并支持决策，而不仅仅是计算 P 值。始终关注效应量、置信区间和实际业务意义。避免陷入"P 值崇拜"的陷阱。通过不断实践并将统计思维融入日常分析工作，你将成为一名优秀的数据分析师。

关键要点：
1. 在应用任何统计方法之前**理解你的数据**
2. 在运行统计检验之前**检查假设条件**
3. **报告效应量**，不仅仅是 P 值
4. 使用**置信区间**来表达不确定性
5. 在检验多个假设时**注意多重比较问题**
6. **相关不等于因果** - 使用适当的因果推断方法
7. **预先注册**你的分析计划以避免 P-hacking
8. 在做出重大决策之前**重复验证**重要发现
