---
title: 机器学习数学基础：概率与统计
description: 掌握机器学习必备的概率统计知识：概率分布、贝叶斯定理和统计推断
track: datascience
section: statistics
difficulty: intermediate
tags:
  - 概率
  - 统计
  - 贝叶斯
  - 机器学习
status: imported
origin: old/src/content/docs/datascience/probability-statistics.zh.md
divergence: 0.303
issues: []
legacy:
  category: DataScience
  subcategory: Math
  order: 2
  lastUpdated: 2026-01-07
---

概率统计是机器学习的数学基石。从朴素贝叶斯分类器到深度学习中的变分自编码器，概率论的思想贯穿始终。本文将系统介绍机器学习中最核心的概率统计知识，包括概率论基础、常见概率分布、贝叶斯定理、最大似然估计、统计推断等内容，并配合Python代码实现。

## 概率论基础

### 随机变量与概率

**随机变量（Random Variable）** 是将随机试验结果映射到实数的函数。根据取值范围不同，分为：

- **离散随机变量**：取有限或可数无限个值（如抛硬币次数、用户点击次数）
- **连续随机变量**：取某区间内任意值（如身高、温度、股票价格）

**概率的基本性质**：

1. 非负性：$P(A) \geq 0$
2. 规范性：$P(\Omega) = 1$（样本空间的概率为1）
3. 可加性：对于互斥事件 $A$ 和 $B$，$P(A \cup B) = P(A) + P(B)$

### 概率质量函数与概率密度函数

**概率质量函数（PMF）** 用于描述离散随机变量的概率分布：

$$P(X = x_i) = p_i, \quad \sum_{i} p_i = 1$$

**概率密度函数（PDF）** 用于描述连续随机变量的概率分布：

$$P(a \leq X \leq b) = \int_a^b f(x)dx, \quad \int_{-\infty}^{+\infty} f(x)dx = 1$$

```python
import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

# 离散分布示例：泊松分布的PMF
fig, axes = plt.subplots(1, 2, figsize=(12, 4))

# 泊松分布 PMF
lambda_param = 5
x_discrete = np.arange(0, 15)
pmf = stats.poisson.pmf(x_discrete, lambda_param)

axes[0].bar(x_discrete, pmf, color='steelblue', alpha=0.7)
axes[0].set_xlabel('k')
axes[0].set_ylabel('P(X = k)')
axes[0].set_title(f'泊松分布 PMF (lambda={lambda_param})')

# 连续分布示例：正态分布的PDF
x_continuous = np.linspace(-4, 4, 100)
pdf = stats.norm.pdf(x_continuous, loc=0, scale=1)

axes[1].plot(x_continuous, pdf, 'b-', linewidth=2)
axes[1].fill_between(x_continuous, pdf, alpha=0.3)
axes[1].set_xlabel('x')
axes[1].set_ylabel('f(x)')
axes[1].set_title('标准正态分布 PDF')

plt.tight_layout()
plt.show()
```

### 期望、方差与协方差

**期望（Expected Value）** 表示随机变量的平均取值：

$$E[X] = \begin{cases}
\sum_i x_i \cdot P(X = x_i) & \text{离散型} \\
\int_{-\infty}^{+\infty} x \cdot f(x)dx & \text{连续型}
\end{cases}$$

**方差（Variance）** 衡量随机变量偏离期望的程度：

$$\text{Var}(X) = E[(X - E[X])^2] = E[X^2] - (E[X])^2$$

**协方差（Covariance）** 衡量两个随机变量的线性相关程度：

$$\text{Cov}(X, Y) = E[(X - E[X])(Y - E[Y])] = E[XY] - E[X]E[Y]$$

**相关系数（Correlation Coefficient）** 是标准化的协方差：

$$\rho_{XY} = \frac{\text{Cov}(X, Y)}{\sqrt{\text{Var}(X) \cdot \text{Var}(Y)}}$$

```python
import numpy as np

# 生成相关的两组数据
np.random.seed(42)
x = np.random.randn(1000)
y = 0.8 * x + 0.6 * np.random.randn(1000)

# 计算期望、方差、协方差
print(f"E[X] = {np.mean(x):.4f}")
print(f"E[Y] = {np.mean(y):.4f}")
print(f"Var(X) = {np.var(x, ddof=1):.4f}")
print(f"Var(Y) = {np.var(y, ddof=1):.4f}")
print(f"Cov(X, Y) = {np.cov(x, y)[0, 1]:.4f}")
print(f"Corr(X, Y) = {np.corrcoef(x, y)[0, 1]:.4f}")
```

### 条件概率与独立性

**条件概率** 表示在事件B发生的条件下，事件A发生的概率：

$$P(A|B) = \frac{P(A \cap B)}{P(B)}$$

**乘法公式**：

$$P(A \cap B) = P(A|B) \cdot P(B) = P(B|A) \cdot P(A)$$

**全概率公式**：如果 $B_1, B_2, ..., B_n$ 是样本空间的一个划分，则：

$$P(A) = \sum_{i=1}^{n} P(A|B_i) \cdot P(B_i)$$

**独立性**：如果 $P(A \cap B) = P(A) \cdot P(B)$，则称A和B相互独立。

```python
# 条件概率示例：邮件分类
# 假设：垃圾邮件占30%，垃圾邮件中含"优惠"的概率为80%，正常邮件中含"优惠"的概率为10%

P_spam = 0.30
P_ham = 0.70
P_discount_given_spam = 0.80
P_discount_given_ham = 0.10

# 全概率公式：计算邮件含"优惠"的总概率
P_discount = P_discount_given_spam * P_spam + P_discount_given_ham * P_ham
print(f"P(含优惠) = {P_discount:.4f}")

# 贝叶斯公式：已知邮件含"优惠"，计算是垃圾邮件的概率
P_spam_given_discount = (P_discount_given_spam * P_spam) / P_discount
print(f"P(垃圾邮件|含优惠) = {P_spam_given_discount:.4f}")
```

## 常见概率分布

理解常见的概率分布对于机器学习建模至关重要。不同的问题场景适用不同的分布假设。

### 离散分布

#### 伯努利分布（Bernoulli Distribution）

描述单次试验的二元结果（成功/失败）：

$$P(X = k) = p^k(1-p)^{1-k}, \quad k \in \{0, 1\}$$

- 期望：$E[X] = p$
- 方差：$\text{Var}(X) = p(1-p)$

#### 二项分布（Binomial Distribution）

描述n次独立伯努利试验中成功的次数：

$$P(X = k) = \binom{n}{k}p^k(1-p)^{n-k}, \quad k = 0, 1, ..., n$$

- 期望：$E[X] = np$
- 方差：$\text{Var}(X) = np(1-p)$

应用场景：用户点击率预测、A/B测试分析、质量控制

#### 泊松分布（Poisson Distribution）

描述单位时间/空间内随机事件发生的次数：

$$P(X = k) = \frac{\lambda^k e^{-\lambda}}{k!}, \quad k = 0, 1, 2, ...$$

- 期望：$E[X] = \lambda$
- 方差：$\text{Var}(X) = \lambda$

应用场景：网站访问量、客服电话数、系统故障次数、稀有事件建模

```python
import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

fig, axes = plt.subplots(1, 3, figsize=(15, 4))

# 伯努利分布
p = 0.3
x = [0, 1]
prob = [1-p, p]
axes[0].bar(x, prob, color='steelblue')
axes[0].set_xticks([0, 1])
axes[0].set_xlabel('k')
axes[0].set_ylabel('P(X=k)')
axes[0].set_title(f'伯努利分布 (p={p})')

# 二项分布
n, p = 20, 0.3
x = np.arange(0, n+1)
prob = stats.binom.pmf(x, n, p)
axes[1].bar(x, prob, color='steelblue')
axes[1].set_xlabel('k')
axes[1].set_ylabel('P(X=k)')
axes[1].set_title(f'二项分布 B({n}, {p})')

# 泊松分布
lambdas = [2, 5, 10]
x = np.arange(0, 20)
for lam in lambdas:
    prob = stats.poisson.pmf(x, lam)
    axes[2].plot(x, prob, 'o-', label=f'lambda={lam}')
axes[2].set_xlabel('k')
axes[2].set_ylabel('P(X=k)')
axes[2].set_title('泊松分布')
axes[2].legend()

plt.tight_layout()
plt.show()
```

### 连续分布

#### 均匀分布（Uniform Distribution）

在区间[a, b]上等概率分布：

$$f(x) = \frac{1}{b-a}, \quad a \leq x \leq b$$

- 期望：$E[X] = \frac{a+b}{2}$
- 方差：$\text{Var}(X) = \frac{(b-a)^2}{12}$

#### 正态分布（Normal/Gaussian Distribution）

最重要的连续分布，由均值和标准差完全确定：

$$f(x) = \frac{1}{\sigma\sqrt{2\pi}} \exp\left(-\frac{(x-\mu)^2}{2\sigma^2}\right)$$

- 期望：$E[X] = \mu$
- 方差：$\text{Var}(X) = \sigma^2$

**标准正态分布**：$\mu = 0, \sigma = 1$

**正态分布的重要性质**：
- 68-95-99.7法则：约68%的数据在$\mu \pm \sigma$内，约95%在$\mu \pm 2\sigma$内，约99.7%在$\mu \pm 3\sigma$内
- 正态分布的线性组合仍是正态分布
- 中心极限定理保证了样本均值近似服从正态分布

#### 指数分布（Exponential Distribution）

描述独立随机事件发生的时间间隔：

$$f(x) = \lambda e^{-\lambda x}, \quad x \geq 0$$

- 期望：$E[X] = \frac{1}{\lambda}$
- 方差：$\text{Var}(X) = \frac{1}{\lambda^2}$
- 无记忆性：$P(X > s + t | X > s) = P(X > t)$

应用场景：设备寿命建模、用户等待时间、排队论

#### Beta分布（Beta Distribution）

定义在[0, 1]区间上，常用于概率的先验分布：

$$f(x; \alpha, \beta) = \frac{x^{\alpha-1}(1-x)^{\beta-1}}{B(\alpha, \beta)}$$

其中$B(\alpha, \beta)$是Beta函数。

- 期望：$E[X] = \frac{\alpha}{\alpha + \beta}$
- 方差：$\text{Var}(X) = \frac{\alpha\beta}{(\alpha+\beta)^2(\alpha+\beta+1)}$

应用场景：贝叶斯推断中的共轭先验、概率估计

```python
import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# 正态分布
x = np.linspace(-4, 4, 100)
for mu, sigma in [(0, 1), (0, 2), (1, 1)]:
    pdf = stats.norm.pdf(x, mu, sigma)
    axes[0, 0].plot(x, pdf, label=f'mu={mu}, sigma={sigma}')
axes[0, 0].set_title('正态分布')
axes[0, 0].legend()
axes[0, 0].set_xlabel('x')
axes[0, 0].set_ylabel('f(x)')

# 指数分布
x = np.linspace(0, 5, 100)
for lam in [0.5, 1, 2]:
    pdf = stats.expon.pdf(x, scale=1/lam)
    axes[0, 1].plot(x, pdf, label=f'lambda={lam}')
axes[0, 1].set_title('指数分布')
axes[0, 1].legend()
axes[0, 1].set_xlabel('x')
axes[0, 1].set_ylabel('f(x)')

# Beta分布
x = np.linspace(0, 1, 100)
params = [(0.5, 0.5), (2, 2), (2, 5), (5, 2)]
for alpha, beta in params:
    pdf = stats.beta.pdf(x, alpha, beta)
    axes[1, 0].plot(x, pdf, label=f'alpha={alpha}, beta={beta}')
axes[1, 0].set_title('Beta分布')
axes[1, 0].legend()
axes[1, 0].set_xlabel('x')
axes[1, 0].set_ylabel('f(x)')

# 均匀分布
x = np.linspace(-1, 3, 100)
for a, b in [(0, 1), (0, 2), (1, 2)]:
    pdf = stats.uniform.pdf(x, a, b-a)
    axes[1, 1].plot(x, pdf, label=f'[{a}, {b}]')
axes[1, 1].set_title('均匀分布')
axes[1, 1].legend()
axes[1, 1].set_xlabel('x')
axes[1, 1].set_ylabel('f(x)')

plt.tight_layout()
plt.show()
```

### 多维分布

#### 多元正态分布（Multivariate Normal Distribution）

$$f(\mathbf{x}) = \frac{1}{(2\pi)^{d/2}|\boldsymbol{\Sigma}|^{1/2}} \exp\left(-\frac{1}{2}(\mathbf{x}-\boldsymbol{\mu})^T\boldsymbol{\Sigma}^{-1}(\mathbf{x}-\boldsymbol{\mu})\right)$$

其中$\boldsymbol{\mu}$是均值向量，$\boldsymbol{\Sigma}$是协方差矩阵。

```python
import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

# 二维正态分布
mean = [0, 0]
cov_matrices = [
    [[1, 0], [0, 1]],           # 独立
    [[1, 0.8], [0.8, 1]],       # 正相关
    [[1, -0.8], [-0.8, 1]]      # 负相关
]
titles = ['独立 (rho=0)', '正相关 (rho=0.8)', '负相关 (rho=-0.8)']

fig, axes = plt.subplots(1, 3, figsize=(15, 4))

for ax, cov, title in zip(axes, cov_matrices, titles):
    # 生成网格点
    x = np.linspace(-3, 3, 100)
    y = np.linspace(-3, 3, 100)
    X, Y = np.meshgrid(x, y)
    pos = np.dstack((X, Y))

    # 计算PDF
    rv = stats.multivariate_normal(mean, cov)
    Z = rv.pdf(pos)

    # 绘制等高线
    ax.contour(X, Y, Z, levels=10)
    ax.set_title(title)
    ax.set_xlabel('X')
    ax.set_ylabel('Y')
    ax.set_aspect('equal')

plt.tight_layout()
plt.show()
```

## 贝叶斯定理

贝叶斯定理是概率论中最重要的定理之一，它描述了如何根据新的证据更新我们对事件的信念。

### 贝叶斯定理的形式

$$P(A|B) = \frac{P(B|A) \cdot P(A)}{P(B)}$$

在机器学习中，通常写成：

$$P(\theta|D) = \frac{P(D|\theta) \cdot P(\theta)}{P(D)}$$

其中：
- $P(\theta)$：**先验概率（Prior）** - 观测数据之前对参数的信念
- $P(D|\theta)$：**似然函数（Likelihood）** - 给定参数时观测到数据的概率
- $P(\theta|D)$：**后验概率（Posterior）** - 观测数据后对参数的更新信念
- $P(D)$：**边缘似然/证据（Evidence）** - 数据的总概率

### 贝叶斯推断的直观理解

贝叶斯推断的核心思想：

$$\text{后验} \propto \text{似然} \times \text{先验}$$

这意味着我们的信念更新是由"数据告诉我们什么"（似然）和"我们之前相信什么"（先验）共同决定的。

```python
import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

# 示例：抛硬币问题
# 我们想估计硬币正面朝上的概率 theta

# 先验：假设我们对theta一无所知，使用均匀分布（Beta(1,1)）
# 或者假设硬币大概率是公平的，使用Beta(10, 10)

def plot_beta_posterior(alpha_prior, beta_prior, heads, tails, ax, title):
    """绘制贝叶斯后验更新过程"""
    theta = np.linspace(0, 1, 100)

    # 先验
    prior = stats.beta.pdf(theta, alpha_prior, beta_prior)

    # 后验（Beta-二项共轭）
    alpha_post = alpha_prior + heads
    beta_post = beta_prior + tails
    posterior = stats.beta.pdf(theta, alpha_post, beta_post)

    # 似然（未归一化）
    likelihood = theta**heads * (1-theta)**tails
    likelihood = likelihood / likelihood.max() * posterior.max()  # 缩放以便显示

    ax.plot(theta, prior, 'g--', label='先验', linewidth=2)
    ax.plot(theta, likelihood, 'b:', label='似然', linewidth=2)
    ax.plot(theta, posterior, 'r-', label='后验', linewidth=2)
    ax.axvline(x=heads/(heads+tails) if heads+tails > 0 else 0.5,
               color='gray', linestyle='--', alpha=0.5, label='MLE')
    ax.set_xlabel('theta')
    ax.set_ylabel('密度')
    ax.set_title(title)
    ax.legend()

fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# 不同的数据量和先验设置
scenarios = [
    (1, 1, 7, 3, '均匀先验 + 10次试验 (7正3反)'),
    (10, 10, 7, 3, '信息先验 + 10次试验 (7正3反)'),
    (1, 1, 70, 30, '均匀先验 + 100次试验 (70正30反)'),
    (10, 10, 70, 30, '信息先验 + 100次试验 (70正30反)')
]

for ax, (a, b, h, t, title) in zip(axes.flat, scenarios):
    plot_beta_posterior(a, b, h, t, ax, title)

plt.tight_layout()
plt.show()
```

### 朴素贝叶斯分类器

朴素贝叶斯分类器是贝叶斯定理在分类问题中的直接应用，假设特征之间条件独立：

$$P(y|x_1, x_2, ..., x_n) = \frac{P(y) \prod_{i=1}^{n} P(x_i|y)}{P(x_1, x_2, ..., x_n)}$$

分类决策：

$$\hat{y} = \arg\max_y P(y) \prod_{i=1}^{n} P(x_i|y)$$

```python
import numpy as np
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.naive_bayes import GaussianNB
from sklearn.metrics import accuracy_score, classification_report

# 加载数据
iris = load_iris()
X, y = iris.data, iris.target

# 划分训练集和测试集
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

# 训练朴素贝叶斯分类器
gnb = GaussianNB()
gnb.fit(X_train, y_train)

# 预测
y_pred = gnb.predict(X_test)

# 评估
print(f"准确率: {accuracy_score(y_test, y_pred):.4f}")
print("\n分类报告:")
print(classification_report(y_test, y_pred, target_names=iris.target_names))

# 查看学习到的参数
print("\n各类别的先验概率:")
for i, prob in enumerate(gnb.class_prior_):
    print(f"  P(y={iris.target_names[i]}) = {prob:.4f}")

print("\n各类别的特征均值:")
for i in range(len(iris.target_names)):
    print(f"  类别 {iris.target_names[i]}: {gnb.theta_[i]}")
```

### 贝叶斯与频率学派的对比

| 方面 | 频率学派 | 贝叶斯学派 |
|------|----------|------------|
| 概率解释 | 长期频率 | 信念程度 |
| 参数性质 | 固定未知常数 | 随机变量 |
| 推断目标 | 点估计+置信区间 | 后验分布 |
| 先验信息 | 不使用 | 显式纳入 |
| 小样本表现 | 可能不稳定 | 先验提供正则化 |
| 计算复杂度 | 通常较低 | 可能需要MCMC |

## 最大似然估计（MLE）

最大似然估计是频率学派中最重要的参数估计方法，其核心思想是：选择使观测数据出现概率最大的参数值。

### 似然函数

给定独立同分布的观测数据 $D = \{x_1, x_2, ..., x_n\}$，似然函数定义为：

$$L(\theta) = P(D|\theta) = \prod_{i=1}^{n} P(x_i|\theta)$$

为了计算方便，通常使用对数似然：

$$\ell(\theta) = \log L(\theta) = \sum_{i=1}^{n} \log P(x_i|\theta)$$

### MLE的计算

最大似然估计：

$$\hat{\theta}_{MLE} = \arg\max_\theta L(\theta) = \arg\max_\theta \ell(\theta)$$

求解方法：
1. 对 $\ell(\theta)$ 求导并令其为零
2. 解方程得到参数估计

### 常见分布的MLE

#### 正态分布的MLE

给定样本 $x_1, x_2, ..., x_n$，正态分布参数的MLE为：

$$\hat{\mu}_{MLE} = \frac{1}{n}\sum_{i=1}^{n}x_i = \bar{x}$$

$$\hat{\sigma}^2_{MLE} = \frac{1}{n}\sum_{i=1}^{n}(x_i - \bar{x})^2$$

注意：$\hat{\sigma}^2_{MLE}$ 是有偏估计，无偏估计应除以 $n-1$。

#### 伯努利分布的MLE

给定 $n$ 次试验中有 $k$ 次成功：

$$\hat{p}_{MLE} = \frac{k}{n}$$

```python
import numpy as np
from scipy import stats
from scipy.optimize import minimize_scalar, minimize
import matplotlib.pyplot as plt

# 示例1：正态分布的MLE
np.random.seed(42)
true_mu, true_sigma = 5, 2
samples = np.random.normal(true_mu, true_sigma, 100)

# 手动计算MLE
mu_mle = np.mean(samples)
sigma_mle = np.std(samples, ddof=0)  # MLE使用ddof=0

print(f"真实参数: mu={true_mu}, sigma={true_sigma}")
print(f"MLE估计: mu={mu_mle:.4f}, sigma={sigma_mle:.4f}")

# 可视化似然函数
fig, axes = plt.subplots(1, 2, figsize=(12, 4))

# 固定sigma，画出关于mu的对数似然
mu_range = np.linspace(3, 7, 100)
log_likelihood_mu = [np.sum(stats.norm.logpdf(samples, mu, sigma_mle))
                     for mu in mu_range]

axes[0].plot(mu_range, log_likelihood_mu)
axes[0].axvline(x=mu_mle, color='r', linestyle='--', label=f'MLE={mu_mle:.2f}')
axes[0].set_xlabel('mu')
axes[0].set_ylabel('对数似然')
axes[0].set_title('对数似然函数 (关于mu)')
axes[0].legend()

# 固定mu，画出关于sigma的对数似然
sigma_range = np.linspace(1, 4, 100)
log_likelihood_sigma = [np.sum(stats.norm.logpdf(samples, mu_mle, sigma))
                        for sigma in sigma_range]

axes[1].plot(sigma_range, log_likelihood_sigma)
axes[1].axvline(x=sigma_mle, color='r', linestyle='--', label=f'MLE={sigma_mle:.2f}')
axes[1].set_xlabel('sigma')
axes[1].set_ylabel('对数似然')
axes[1].set_title('对数似然函数 (关于sigma)')
axes[1].legend()

plt.tight_layout()
plt.show()
```

### MLE的性质

MLE具有良好的渐近性质（当样本量趋于无穷时）：

1. **一致性（Consistency）**：$\hat{\theta}_{MLE} \xrightarrow{P} \theta_0$
2. **渐近正态性（Asymptotic Normality）**：$\sqrt{n}(\hat{\theta}_{MLE} - \theta_0) \xrightarrow{d} N(0, I(\theta_0)^{-1})$
3. **渐近有效性（Asymptotic Efficiency）**：达到Cramer-Rao下界

其中 $I(\theta)$ 是Fisher信息量：

$$I(\theta) = -E\left[\frac{\partial^2}{\partial\theta^2}\log P(X|\theta)\right]$$

### 最大后验估计（MAP）

MAP估计是贝叶斯推断与MLE的折中：

$$\hat{\theta}_{MAP} = \arg\max_\theta P(\theta|D) = \arg\max_\theta P(D|\theta) \cdot P(\theta)$$

对数形式：

$$\hat{\theta}_{MAP} = \arg\max_\theta \left[\log P(D|\theta) + \log P(\theta)\right]$$

MAP相当于在MLE的基础上加入了先验作为正则化项。

```python
import numpy as np
from scipy.optimize import minimize
from scipy import stats

# MAP估计示例：估计正态分布均值
# 先验：mu ~ N(0, 1)
# 似然：x_i | mu ~ N(mu, sigma^2)

np.random.seed(42)
true_mu = 3
sigma = 2  # 已知
n_samples = 10
samples = np.random.normal(true_mu, sigma, n_samples)

# 先验参数
prior_mu = 0
prior_sigma = 1

def neg_log_posterior(mu, samples, sigma, prior_mu, prior_sigma):
    """负对数后验（用于最小化）"""
    log_likelihood = np.sum(stats.norm.logpdf(samples, mu, sigma))
    log_prior = stats.norm.logpdf(mu, prior_mu, prior_sigma)
    return -(log_likelihood + log_prior)

# MLE
mu_mle = np.mean(samples)

# MAP（数值优化）
result = minimize(neg_log_posterior, x0=0,
                  args=(samples, sigma, prior_mu, prior_sigma))
mu_map = result.x[0]

# MAP解析解（正态-正态共轭）
precision_prior = 1 / prior_sigma**2
precision_likelihood = n_samples / sigma**2
mu_map_analytical = (precision_prior * prior_mu + precision_likelihood * mu_mle) / \
                    (precision_prior + precision_likelihood)

print(f"真实值: {true_mu}")
print(f"MLE: {mu_mle:.4f}")
print(f"MAP (数值): {mu_map:.4f}")
print(f"MAP (解析): {mu_map_analytical:.4f}")
print(f"样本均值: {np.mean(samples):.4f}")
```

## 统计推断

统计推断是根据样本数据对总体参数做出判断的过程，主要包括参数估计和假设检验两大类。

### 点估计与区间估计

**点估计** 给出参数的单一估计值：
- 矩估计法
- 最大似然估计
- 最小二乘估计

**区间估计** 给出包含真实参数的区间：

$$P(\hat{\theta}_L \leq \theta \leq \hat{\theta}_U) = 1 - \alpha$$

对于正态分布均值的 $(1-\alpha)$ 置信区间：

$$\bar{x} \pm z_{\alpha/2} \cdot \frac{\sigma}{\sqrt{n}} \quad \text{(已知总体方差)}$$

$$\bar{x} \pm t_{\alpha/2, n-1} \cdot \frac{s}{\sqrt{n}} \quad \text{(未知总体方差)}$$

```python
import numpy as np
from scipy import stats

# 置信区间计算
np.random.seed(42)
samples = np.random.normal(100, 15, 50)

# 样本统计量
n = len(samples)
mean = np.mean(samples)
std = np.std(samples, ddof=1)
se = std / np.sqrt(n)

# 95%置信区间（使用t分布）
alpha = 0.05
t_critical = stats.t.ppf(1 - alpha/2, df=n-1)
ci_lower = mean - t_critical * se
ci_upper = mean + t_critical * se

print(f"样本均值: {mean:.4f}")
print(f"样本标准差: {std:.4f}")
print(f"标准误: {se:.4f}")
print(f"95%置信区间: [{ci_lower:.4f}, {ci_upper:.4f}]")

# 使用scipy直接计算
ci = stats.t.interval(0.95, df=n-1, loc=mean, scale=se)
print(f"scipy计算的95%置信区间: [{ci[0]:.4f}, {ci[1]:.4f}]")
```

### 假设检验的基本概念

**假设检验的步骤**：

1. 建立原假设 $H_0$ 和备择假设 $H_1$
2. 选择显著性水平 $\alpha$（通常为0.05）
3. 计算检验统计量
4. 确定拒绝域或计算p值
5. 做出决策

**两类错误**：

| | $H_0$ 为真 | $H_0$ 为假 |
|--|-----------|-----------|
| 接受 $H_0$ | 正确决策 | 第II类错误 ($\beta$) |
| 拒绝 $H_0$ | 第I类错误 ($\alpha$) | 正确决策 |

**统计功效（Power）**：$1 - \beta$，即正确拒绝错误原假设的概率。

### 常用假设检验

#### t检验

```python
import numpy as np
from scipy import stats

# 单样本t检验
sample = np.random.normal(102, 15, 30)
t_stat, p_value = stats.ttest_1samp(sample, 100)
print(f"单样本t检验:")
print(f"  H0: mu = 100")
print(f"  t统计量: {t_stat:.4f}")
print(f"  p值: {p_value:.4f}")

# 独立样本t检验
group_a = np.random.normal(100, 15, 50)
group_b = np.random.normal(105, 15, 50)

# Welch's t检验（不假设方差相等）
t_stat, p_value = stats.ttest_ind(group_a, group_b, equal_var=False)
print(f"\n独立样本t检验 (Welch):")
print(f"  t统计量: {t_stat:.4f}")
print(f"  p值: {p_value:.4f}")

# 配对样本t检验
before = np.random.normal(50, 10, 30)
after = before + np.random.normal(5, 3, 30)
t_stat, p_value = stats.ttest_rel(before, after)
print(f"\n配对样本t检验:")
print(f"  t统计量: {t_stat:.4f}")
print(f"  p值: {p_value:.4f}")
```

#### z检验（大样本比例检验）

```python
from statsmodels.stats.proportion import proportions_ztest

# 比例检验：检验网站改版后转化率是否提升
# 对照组：1000人中100人转化
# 实验组：1000人中120人转化

count = np.array([120, 100])
nobs = np.array([1000, 1000])

z_stat, p_value = proportions_ztest(count, nobs, alternative='larger')
print(f"比例z检验:")
print(f"  H0: p1 <= p2")
print(f"  H1: p1 > p2")
print(f"  z统计量: {z_stat:.4f}")
print(f"  p值: {p_value:.4f}")
```

#### 卡方检验

```python
from scipy.stats import chi2_contingency, chisquare

# 独立性检验
observed = np.array([
    [50, 30, 20],   # 男性
    [35, 45, 20]    # 女性
])
chi2, p_value, dof, expected = chi2_contingency(observed)
print(f"卡方独立性检验:")
print(f"  卡方统计量: {chi2:.4f}")
print(f"  p值: {p_value:.4f}")
print(f"  自由度: {dof}")

# 拟合优度检验
observed_freq = [18, 22, 16, 21, 19, 24]
expected_freq = [20, 20, 20, 20, 20, 20]
chi2, p_value = chisquare(observed_freq, expected_freq)
print(f"\n拟合优度检验:")
print(f"  卡方统计量: {chi2:.4f}")
print(f"  p值: {p_value:.4f}")
```

## 置信区间

置信区间提供了参数估计的不确定性量化，是统计推断的重要组成部分。

### 置信区间的正确解读

**正确理解**：如果我们重复抽样并构建置信区间，长期来看有 $100(1-\alpha)\%$ 的区间会包含真实参数值。

**常见误区**：
- 错误："真实参数有95%的概率落在这个区间内"
- 正确："使用这种方法构建的区间，有95%的概率包含真实参数"

### 各种参数的置信区间

```python
import numpy as np
from scipy import stats
import warnings
warnings.filterwarnings('ignore')

# 单样本均值置信区间
def mean_ci(data, confidence=0.95):
    n = len(data)
    mean = np.mean(data)
    se = stats.sem(data)
    ci = stats.t.interval(confidence, df=n-1, loc=mean, scale=se)
    return mean, ci

# 两独立样本均值差的置信区间
def mean_diff_ci(data1, data2, confidence=0.95):
    n1, n2 = len(data1), len(data2)
    mean_diff = np.mean(data1) - np.mean(data2)

    # Welch方法
    se = np.sqrt(np.var(data1, ddof=1)/n1 + np.var(data2, ddof=1)/n2)

    # Welch-Satterthwaite自由度
    var1, var2 = np.var(data1, ddof=1), np.var(data2, ddof=1)
    df = (var1/n1 + var2/n2)**2 / \
         ((var1/n1)**2/(n1-1) + (var2/n2)**2/(n2-1))

    t_critical = stats.t.ppf((1 + confidence) / 2, df)
    ci = (mean_diff - t_critical * se, mean_diff + t_critical * se)
    return mean_diff, ci

# 比例的置信区间
def proportion_ci(successes, n, confidence=0.95):
    p_hat = successes / n
    z = stats.norm.ppf((1 + confidence) / 2)

    # Wald区间
    se = np.sqrt(p_hat * (1 - p_hat) / n)
    wald_ci = (p_hat - z * se, p_hat + z * se)

    # Wilson区间（更准确）
    denominator = 1 + z**2 / n
    center = (p_hat + z**2 / (2*n)) / denominator
    spread = z * np.sqrt(p_hat*(1-p_hat)/n + z**2/(4*n**2)) / denominator
    wilson_ci = (center - spread, center + spread)

    return p_hat, wald_ci, wilson_ci

# 示例
np.random.seed(42)
data1 = np.random.normal(100, 15, 50)
data2 = np.random.normal(95, 15, 50)

# 单样本均值CI
mean1, ci1 = mean_ci(data1)
print(f"样本1均值: {mean1:.4f}, 95% CI: [{ci1[0]:.4f}, {ci1[1]:.4f}]")

# 均值差CI
diff, ci_diff = mean_diff_ci(data1, data2)
print(f"均值差: {diff:.4f}, 95% CI: [{ci_diff[0]:.4f}, {ci_diff[1]:.4f}]")

# 比例CI
p, wald, wilson = proportion_ci(75, 100)
print(f"比例: {p:.4f}")
print(f"  Wald 95% CI: [{wald[0]:.4f}, {wald[1]:.4f}]")
print(f"  Wilson 95% CI: [{wilson[0]:.4f}, {wilson[1]:.4f}]")
```

### Bootstrap置信区间

Bootstrap是一种基于重抽样的非参数方法，不依赖分布假设：

```python
import numpy as np
from scipy import stats

def bootstrap_ci(data, statistic=np.mean, n_bootstrap=10000,
                 confidence=0.95, method='percentile'):
    """
    Bootstrap置信区间

    Parameters:
    -----------
    data : array-like
        原始数据
    statistic : callable
        统计量函数
    n_bootstrap : int
        Bootstrap重抽样次数
    confidence : float
        置信水平
    method : str
        'percentile' 或 'bca'
    """
    n = len(data)
    boot_stats = []

    for _ in range(n_bootstrap):
        # 有放回重抽样
        boot_sample = np.random.choice(data, size=n, replace=True)
        boot_stats.append(statistic(boot_sample))

    boot_stats = np.array(boot_stats)

    if method == 'percentile':
        # 百分位法
        alpha = 1 - confidence
        lower = np.percentile(boot_stats, 100 * alpha / 2)
        upper = np.percentile(boot_stats, 100 * (1 - alpha / 2))

    return statistic(data), (lower, upper), boot_stats

# 示例
np.random.seed(42)
data = np.random.exponential(scale=2, size=100)

# 均值的Bootstrap CI
mean_est, ci, boot_means = bootstrap_ci(data, np.mean)
print(f"均值估计: {mean_est:.4f}")
print(f"Bootstrap 95% CI: [{ci[0]:.4f}, {ci[1]:.4f}]")

# 中位数的Bootstrap CI
median_est, ci_median, _ = bootstrap_ci(data, np.median)
print(f"中位数估计: {median_est:.4f}")
print(f"Bootstrap 95% CI: [{ci_median[0]:.4f}, {ci_median[1]:.4f}]")

# 可视化
import matplotlib.pyplot as plt

fig, axes = plt.subplots(1, 2, figsize=(12, 4))

axes[0].hist(boot_means, bins=50, edgecolor='black', alpha=0.7)
axes[0].axvline(x=mean_est, color='r', linestyle='-', linewidth=2, label='点估计')
axes[0].axvline(x=ci[0], color='g', linestyle='--', linewidth=2, label='95% CI')
axes[0].axvline(x=ci[1], color='g', linestyle='--', linewidth=2)
axes[0].set_xlabel('Bootstrap均值')
axes[0].set_ylabel('频数')
axes[0].set_title('Bootstrap均值分布')
axes[0].legend()

# 原始数据分布
axes[1].hist(data, bins=30, edgecolor='black', alpha=0.7)
axes[1].set_xlabel('数据值')
axes[1].set_ylabel('频数')
axes[1].set_title('原始数据分布（指数分布）')

plt.tight_layout()
plt.show()
```

## 机器学习中的概率统计应用

### 概率图模型

概率图模型是表示随机变量之间依赖关系的图形化框架：

- **贝叶斯网络（有向图）**：表示因果关系
- **马尔可夫随机场（无向图）**：表示相关关系

```python
# 简单的贝叶斯网络示例
# 使用pgmpy库（需要安装：pip install pgmpy）

# 假设我们有一个简单的因果模型：
# 天气 -> 草地湿润
# 洒水器 -> 草地湿润
# 草地湿润 -> 滑倒

import numpy as np

class SimpleBayesNet:
    """简化的贝叶斯网络实现"""

    def __init__(self):
        # 条件概率表
        self.P_rain = 0.2  # P(Rain)
        self.P_sprinkler_given_rain = {True: 0.01, False: 0.4}  # P(Sprinkler|Rain)
        self.P_wet_given_rain_sprinkler = {
            (True, True): 0.99,
            (True, False): 0.8,
            (False, True): 0.9,
            (False, False): 0.0
        }

    def joint_probability(self, rain, sprinkler, wet):
        """计算联合概率 P(R, S, W)"""
        p_r = self.P_rain if rain else (1 - self.P_rain)
        p_s_given_r = self.P_sprinkler_given_rain[rain] if sprinkler else \
                      (1 - self.P_sprinkler_given_rain[rain])
        p_w_given_rs = self.P_wet_given_rain_sprinkler[(rain, sprinkler)] if wet else \
                       (1 - self.P_wet_given_rain_sprinkler[(rain, sprinkler)])
        return p_r * p_s_given_r * p_w_given_rs

    def inference(self, query, evidence):
        """
        贝叶斯推断：给定证据，计算查询变量的概率
        """
        # 枚举法（适用于小规模网络）
        total_prob = 0
        query_prob = 0

        for rain in [True, False]:
            for sprinkler in [True, False]:
                for wet in [True, False]:
                    state = {'rain': rain, 'sprinkler': sprinkler, 'wet': wet}

                    # 检查是否满足证据
                    if all(state[k] == v for k, v in evidence.items()):
                        jp = self.joint_probability(rain, sprinkler, wet)
                        total_prob += jp

                        # 检查是否满足查询
                        if all(state[k] == v for k, v in query.items()):
                            query_prob += jp

        return query_prob / total_prob if total_prob > 0 else 0

# 使用示例
bn = SimpleBayesNet()

# 查询：已知草地是湿的，下雨的概率是多少？
prob_rain_given_wet = bn.inference(
    query={'rain': True},
    evidence={'wet': True}
)
print(f"P(Rain=True | Wet=True) = {prob_rain_given_wet:.4f}")

# 查询：已知草地是湿的且洒水器开着，下雨的概率是多少？
prob_rain_given_wet_sprinkler = bn.inference(
    query={'rain': True},
    evidence={'wet': True, 'sprinkler': True}
)
print(f"P(Rain=True | Wet=True, Sprinkler=True) = {prob_rain_given_wet_sprinkler:.4f}")
```

### EM算法

期望最大化（EM）算法用于含有隐变量的概率模型参数估计：

**E步（Expectation）**：在当前参数下，计算隐变量的期望

**M步（Maximization）**：最大化期望对数似然，更新参数

```python
import numpy as np
from scipy import stats
import matplotlib.pyplot as plt

def gaussian_mixture_em(X, K, max_iters=100, tol=1e-6):
    """
    高斯混合模型的EM算法实现

    Parameters:
    -----------
    X : array-like, shape (n_samples,)
        数据
    K : int
        高斯分量数
    max_iters : int
        最大迭代次数
    tol : float
        收敛阈值
    """
    n = len(X)

    # 初始化参数
    np.random.seed(42)
    indices = np.random.choice(n, K, replace=False)
    means = X[indices].copy()
    variances = np.ones(K) * np.var(X)
    weights = np.ones(K) / K

    log_likelihoods = []

    for iteration in range(max_iters):
        # E步：计算责任度（后验概率）
        responsibilities = np.zeros((n, K))
        for k in range(K):
            responsibilities[:, k] = weights[k] * stats.norm.pdf(X, means[k], np.sqrt(variances[k]))

        # 归一化
        responsibilities /= responsibilities.sum(axis=1, keepdims=True)

        # M步：更新参数
        Nk = responsibilities.sum(axis=0)

        for k in range(K):
            weights[k] = Nk[k] / n
            means[k] = np.sum(responsibilities[:, k] * X) / Nk[k]
            variances[k] = np.sum(responsibilities[:, k] * (X - means[k])**2) / Nk[k]

        # 计算对数似然
        log_likelihood = 0
        for k in range(K):
            log_likelihood += np.sum(responsibilities[:, k] *
                                     (np.log(weights[k]) +
                                      stats.norm.logpdf(X, means[k], np.sqrt(variances[k]))))
        log_likelihoods.append(log_likelihood)

        # 检查收敛
        if iteration > 0 and abs(log_likelihoods[-1] - log_likelihoods[-2]) < tol:
            print(f"收敛于第 {iteration+1} 次迭代")
            break

    return weights, means, variances, responsibilities, log_likelihoods

# 生成混合高斯数据
np.random.seed(42)
n1, n2, n3 = 300, 400, 300
X1 = np.random.normal(-3, 1, n1)
X2 = np.random.normal(0, 0.5, n2)
X3 = np.random.normal(3, 1.5, n3)
X = np.concatenate([X1, X2, X3])

# 运行EM算法
weights, means, variances, responsibilities, log_likelihoods = gaussian_mixture_em(X, K=3)

print(f"\n估计的参数:")
for k in range(3):
    print(f"  分量 {k+1}: weight={weights[k]:.3f}, mean={means[k]:.3f}, var={variances[k]:.3f}")

# 可视化
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# 数据和拟合的分布
x_plot = np.linspace(-8, 8, 200)
axes[0].hist(X, bins=50, density=True, alpha=0.6, label='数据')

# 画出各个高斯分量
for k in range(3):
    pdf = weights[k] * stats.norm.pdf(x_plot, means[k], np.sqrt(variances[k]))
    axes[0].plot(x_plot, pdf, linewidth=2, label=f'分量 {k+1}')

# 画出混合分布
mixture_pdf = sum(weights[k] * stats.norm.pdf(x_plot, means[k], np.sqrt(variances[k]))
                  for k in range(3))
axes[0].plot(x_plot, mixture_pdf, 'k--', linewidth=2, label='混合分布')
axes[0].set_xlabel('x')
axes[0].set_ylabel('密度')
axes[0].set_title('高斯混合模型拟合')
axes[0].legend()

# 对数似然收敛曲线
axes[1].plot(log_likelihoods, 'b-o')
axes[1].set_xlabel('迭代次数')
axes[1].set_ylabel('对数似然')
axes[1].set_title('EM算法收敛曲线')

plt.tight_layout()
plt.show()
```

### 交叉熵与KL散度

**交叉熵（Cross-Entropy）** 衡量两个分布之间的差异，在机器学习中常用作分类问题的损失函数：

$$H(p, q) = -\sum_x p(x) \log q(x)$$

**KL散度（Kullback-Leibler Divergence）** 衡量一个分布相对于另一个分布的信息损失：

$$D_{KL}(p \| q) = \sum_x p(x) \log \frac{p(x)}{q(x)} = H(p, q) - H(p)$$

```python
import numpy as np
from scipy.special import kl_div, rel_entr

def cross_entropy(p, q):
    """计算交叉熵 H(p, q)"""
    # 避免log(0)
    q = np.clip(q, 1e-15, 1)
    return -np.sum(p * np.log(q))

def kl_divergence(p, q):
    """计算KL散度 D_KL(p || q)"""
    # 避免log(0)
    p = np.clip(p, 1e-15, 1)
    q = np.clip(q, 1e-15, 1)
    return np.sum(p * np.log(p / q))

def entropy(p):
    """计算熵 H(p)"""
    p = np.clip(p, 1e-15, 1)
    return -np.sum(p * np.log(p))

# 示例
p = np.array([0.4, 0.3, 0.2, 0.1])  # 真实分布
q1 = np.array([0.4, 0.3, 0.2, 0.1])  # 完美匹配
q2 = np.array([0.25, 0.25, 0.25, 0.25])  # 均匀分布
q3 = np.array([0.1, 0.2, 0.3, 0.4])  # 相反分布

print(f"p的熵 H(p): {entropy(p):.4f}")
print()
print(f"交叉熵 H(p, q1): {cross_entropy(p, q1):.4f}")
print(f"KL散度 D_KL(p || q1): {kl_divergence(p, q1):.4f}")
print()
print(f"交叉熵 H(p, q2): {cross_entropy(p, q2):.4f}")
print(f"KL散度 D_KL(p || q2): {kl_divergence(p, q2):.4f}")
print()
print(f"交叉熵 H(p, q3): {cross_entropy(p, q3):.4f}")
print(f"KL散度 D_KL(p || q3): {kl_divergence(p, q3):.4f}")
```

### 信息论在特征选择中的应用

**互信息（Mutual Information）** 衡量两个随机变量之间的依赖程度：

$$I(X; Y) = \sum_{x, y} p(x, y) \log \frac{p(x, y)}{p(x)p(y)}$$

```python
from sklearn.datasets import load_iris
from sklearn.feature_selection import mutual_info_classif
import pandas as pd

# 加载数据
iris = load_iris()
X, y = iris.data, iris.target

# 计算各特征与目标变量的互信息
mi_scores = mutual_info_classif(X, y, random_state=42)

# 创建特征重要性表
feature_importance = pd.DataFrame({
    '特征': iris.feature_names,
    '互信息': mi_scores
}).sort_values('互信息', ascending=False)

print("基于互信息的特征重要性:")
print(feature_importance.to_string(index=False))

# 可视化
import matplotlib.pyplot as plt

plt.figure(figsize=(10, 5))
plt.barh(feature_importance['特征'], feature_importance['互信息'], color='steelblue')
plt.xlabel('互信息')
plt.title('特征与目标变量的互信息')
plt.gca().invert_yaxis()
plt.tight_layout()
plt.show()
```

## Python实现汇总

### 概率分布工具类

```python
import numpy as np
from scipy import stats
import matplotlib.pyplot as plt

class ProbabilityDistributions:
    """概率分布工具类"""

    @staticmethod
    def plot_discrete_distribution(dist_name, params, x_range=None):
        """绘制离散分布的PMF"""
        if dist_name == 'binomial':
            n, p = params
            x = np.arange(0, n + 1) if x_range is None else x_range
            pmf = stats.binom.pmf(x, n, p)
            title = f'二项分布 B({n}, {p})'
        elif dist_name == 'poisson':
            lam = params
            x = np.arange(0, 20) if x_range is None else x_range
            pmf = stats.poisson.pmf(x, lam)
            title = f'泊松分布 Pois({lam})'
        elif dist_name == 'geometric':
            p = params
            x = np.arange(1, 15) if x_range is None else x_range
            pmf = stats.geom.pmf(x, p)
            title = f'几何分布 Geom({p})'
        else:
            raise ValueError(f"Unknown distribution: {dist_name}")

        plt.figure(figsize=(8, 5))
        plt.bar(x, pmf, color='steelblue', alpha=0.7)
        plt.xlabel('x')
        plt.ylabel('P(X = x)')
        plt.title(title)
        plt.show()

        return x, pmf

    @staticmethod
    def plot_continuous_distribution(dist_name, params, x_range=(-5, 5)):
        """绘制连续分布的PDF"""
        x = np.linspace(x_range[0], x_range[1], 200)

        if dist_name == 'normal':
            mu, sigma = params
            pdf = stats.norm.pdf(x, mu, sigma)
            title = f'正态分布 N({mu}, {sigma}^2)'
        elif dist_name == 'exponential':
            lam = params
            x = np.linspace(0, 10, 200)
            pdf = stats.expon.pdf(x, scale=1/lam)
            title = f'指数分布 Exp({lam})'
        elif dist_name == 'gamma':
            alpha, beta = params
            x = np.linspace(0, 20, 200)
            pdf = stats.gamma.pdf(x, alpha, scale=1/beta)
            title = f'Gamma分布 Gamma({alpha}, {beta})'
        elif dist_name == 'beta':
            a, b = params
            x = np.linspace(0, 1, 200)
            pdf = stats.beta.pdf(x, a, b)
            title = f'Beta分布 Beta({a}, {b})'
        else:
            raise ValueError(f"Unknown distribution: {dist_name}")

        plt.figure(figsize=(8, 5))
        plt.plot(x, pdf, 'b-', linewidth=2)
        plt.fill_between(x, pdf, alpha=0.3)
        plt.xlabel('x')
        plt.ylabel('f(x)')
        plt.title(title)
        plt.show()

        return x, pdf

    @staticmethod
    def compare_distributions(samples, theoretical_dist, params):
        """比较样本分布与理论分布"""
        fig, axes = plt.subplots(1, 2, figsize=(12, 4))

        # 直方图与理论PDF
        axes[0].hist(samples, bins=30, density=True, alpha=0.7, label='样本分布')

        if theoretical_dist == 'normal':
            x = np.linspace(min(samples), max(samples), 100)
            pdf = stats.norm.pdf(x, *params)
            axes[0].plot(x, pdf, 'r-', linewidth=2, label='理论分布')

        axes[0].legend()
        axes[0].set_title('分布比较')

        # Q-Q图
        stats.probplot(samples, dist="norm", sparams=params, plot=axes[1])
        axes[1].set_title('Q-Q图')

        plt.tight_layout()
        plt.show()

# 使用示例
pd_tool = ProbabilityDistributions()
pd_tool.plot_discrete_distribution('binomial', (20, 0.3))
pd_tool.plot_continuous_distribution('normal', (0, 1))
```

### 统计推断工具类

```python
import numpy as np
from scipy import stats

class StatisticalInference:
    """统计推断工具类"""

    @staticmethod
    def one_sample_ttest(sample, mu0, alpha=0.05, alternative='two-sided'):
        """单样本t检验"""
        t_stat, p_value = stats.ttest_1samp(sample, mu0)

        if alternative == 'greater':
            p_value = p_value / 2 if t_stat > 0 else 1 - p_value / 2
        elif alternative == 'less':
            p_value = p_value / 2 if t_stat < 0 else 1 - p_value / 2

        reject = p_value < alpha

        return {
            't_statistic': t_stat,
            'p_value': p_value,
            'reject_null': reject,
            'sample_mean': np.mean(sample),
            'sample_std': np.std(sample, ddof=1),
            'n': len(sample)
        }

    @staticmethod
    def two_sample_ttest(sample1, sample2, alpha=0.05, equal_var=False):
        """双样本t检验（Welch's t-test）"""
        t_stat, p_value = stats.ttest_ind(sample1, sample2, equal_var=equal_var)

        return {
            't_statistic': t_stat,
            'p_value': p_value,
            'reject_null': p_value < alpha,
            'mean_diff': np.mean(sample1) - np.mean(sample2),
            'n1': len(sample1),
            'n2': len(sample2)
        }

    @staticmethod
    def proportion_ztest(successes, n, p0, alpha=0.05, alternative='two-sided'):
        """单样本比例z检验"""
        from statsmodels.stats.proportion import proportions_ztest

        z_stat, p_value = proportions_ztest(successes, n, value=p0,
                                            alternative=alternative)

        return {
            'z_statistic': z_stat,
            'p_value': p_value,
            'reject_null': p_value < alpha,
            'sample_proportion': successes / n,
            'null_proportion': p0
        }

    @staticmethod
    def chi2_independence(contingency_table, alpha=0.05):
        """卡方独立性检验"""
        chi2, p_value, dof, expected = stats.chi2_contingency(contingency_table)

        return {
            'chi2_statistic': chi2,
            'p_value': p_value,
            'degrees_of_freedom': dof,
            'expected_frequencies': expected,
            'reject_null': p_value < alpha
        }

    @staticmethod
    def confidence_interval(sample, confidence=0.95, method='t'):
        """计算置信区间"""
        n = len(sample)
        mean = np.mean(sample)
        se = stats.sem(sample)

        if method == 't':
            ci = stats.t.interval(confidence, df=n-1, loc=mean, scale=se)
        elif method == 'z':
            z = stats.norm.ppf((1 + confidence) / 2)
            ci = (mean - z * se, mean + z * se)
        else:
            raise ValueError(f"Unknown method: {method}")

        return {
            'mean': mean,
            'se': se,
            'ci_lower': ci[0],
            'ci_upper': ci[1],
            'confidence': confidence
        }

    @staticmethod
    def sample_size_ttest(effect_size, alpha=0.05, power=0.8, alternative='two-sided'):
        """计算t检验所需样本量"""
        from statsmodels.stats.power import TTestIndPower

        analysis = TTestIndPower()
        n = analysis.solve_power(effect_size=effect_size,
                                 alpha=alpha,
                                 power=power,
                                 alternative=alternative)
        return int(np.ceil(n))

# 使用示例
si = StatisticalInference()

# 单样本t检验
np.random.seed(42)
sample = np.random.normal(102, 15, 50)
result = si.one_sample_ttest(sample, mu0=100)
print("单样本t检验结果:")
for key, value in result.items():
    print(f"  {key}: {value}")

# 置信区间
ci_result = si.confidence_interval(sample, confidence=0.95)
print("\n95%置信区间:")
for key, value in ci_result.items():
    print(f"  {key}: {value}")
```

### 贝叶斯推断工具类

```python
import numpy as np
from scipy import stats

class BayesianInference:
    """贝叶斯推断工具类"""

    @staticmethod
    def beta_binomial_posterior(prior_alpha, prior_beta, successes, trials):
        """
        Beta-二项共轭先验的后验分布

        Prior: p ~ Beta(alpha, beta)
        Likelihood: k | p ~ Binomial(n, p)
        Posterior: p | k ~ Beta(alpha + k, beta + n - k)
        """
        post_alpha = prior_alpha + successes
        post_beta = prior_beta + (trials - successes)

        posterior = stats.beta(post_alpha, post_beta)

        return {
            'posterior_alpha': post_alpha,
            'posterior_beta': post_beta,
            'posterior_mean': post_alpha / (post_alpha + post_beta),
            'posterior_mode': (post_alpha - 1) / (post_alpha + post_beta - 2)
                              if post_alpha > 1 and post_beta > 1 else None,
            'posterior_std': np.sqrt(post_alpha * post_beta /
                                     ((post_alpha + post_beta)**2 * (post_alpha + post_beta + 1))),
            '95_credible_interval': posterior.interval(0.95),
            'distribution': posterior
        }

    @staticmethod
    def normal_normal_posterior(prior_mu, prior_sigma, data, likelihood_sigma):
        """
        正态-正态共轭先验的后验分布

        Prior: mu ~ N(prior_mu, prior_sigma^2)
        Likelihood: x_i | mu ~ N(mu, likelihood_sigma^2)
        """
        n = len(data)
        data_mean = np.mean(data)

        # 精度（方差的倒数）
        prior_precision = 1 / prior_sigma**2
        likelihood_precision = n / likelihood_sigma**2

        # 后验参数
        post_precision = prior_precision + likelihood_precision
        post_sigma = np.sqrt(1 / post_precision)
        post_mu = (prior_precision * prior_mu + likelihood_precision * data_mean) / post_precision

        posterior = stats.norm(post_mu, post_sigma)

        return {
            'posterior_mean': post_mu,
            'posterior_std': post_sigma,
            '95_credible_interval': posterior.interval(0.95),
            'distribution': posterior
        }

    @staticmethod
    def bayes_factor(data, model1_likelihood, model2_likelihood,
                     prior1=0.5, prior2=0.5):
        """
        计算贝叶斯因子 BF_12 = P(D|M1) / P(D|M2)
        """
        log_bf = model1_likelihood - model2_likelihood
        bf = np.exp(log_bf)

        # 后验概率
        posterior1 = (prior1 * np.exp(model1_likelihood)) / \
                     (prior1 * np.exp(model1_likelihood) + prior2 * np.exp(model2_likelihood))

        return {
            'bayes_factor': bf,
            'log_bayes_factor': log_bf,
            'posterior_prob_model1': posterior1,
            'posterior_prob_model2': 1 - posterior1
        }

    @staticmethod
    def plot_posterior_update(prior_alpha, prior_beta, successes_list, trials_list):
        """可视化后验更新过程"""
        import matplotlib.pyplot as plt

        theta = np.linspace(0, 1, 200)
        fig, ax = plt.subplots(figsize=(10, 6))

        # 绘制先验
        prior = stats.beta.pdf(theta, prior_alpha, prior_beta)
        ax.plot(theta, prior, 'k--', linewidth=2, label='先验')

        # 逐步更新后验
        colors = plt.cm.Blues(np.linspace(0.3, 0.9, len(successes_list)))

        total_successes = 0
        total_trials = 0

        for i, (s, n) in enumerate(zip(successes_list, trials_list)):
            total_successes += s
            total_trials += n

            result = BayesianInference.beta_binomial_posterior(
                prior_alpha, prior_beta, total_successes, total_trials
            )
            posterior = result['distribution'].pdf(theta)

            ax.plot(theta, posterior, color=colors[i], linewidth=2,
                   label=f'后验 (观测{total_trials}次, {total_successes}次成功)')

        ax.set_xlabel('theta')
        ax.set_ylabel('密度')
        ax.set_title('贝叶斯后验更新')
        ax.legend()

        plt.tight_layout()
        plt.show()

# 使用示例
bi = BayesianInference()

# Beta-二项后验
result = bi.beta_binomial_posterior(prior_alpha=1, prior_beta=1,
                                     successes=7, trials=10)
print("Beta-二项后验:")
for key, value in result.items():
    if key != 'distribution':
        print(f"  {key}: {value}")

# 可视化后验更新
bi.plot_posterior_update(
    prior_alpha=1, prior_beta=1,
    successes_list=[3, 4, 5, 6],
    trials_list=[5, 5, 5, 5]
)
```

## 面试要点

### 核心概念题

**Q1: 什么是贝叶斯定理？它在机器学习中有哪些应用？**

贝叶斯定理描述了如何根据新证据更新概率信念：$P(A|B) = \frac{P(B|A)P(A)}{P(B)}$

应用：
- 朴素贝叶斯分类器
- 贝叶斯优化（超参数调优）
- 贝叶斯神经网络
- 隐马尔可夫模型
- 变分推断

**Q2: MLE和MAP有什么区别？**

- MLE最大化似然函数：$\hat{\theta}_{MLE} = \arg\max P(D|\theta)$
- MAP最大化后验：$\hat{\theta}_{MAP} = \arg\max P(D|\theta)P(\theta)$

MAP相当于在MLE基础上加入先验正则化。当先验为均匀分布时，MAP等价于MLE。

**Q3: 解释置信区间和贝叶斯可信区间的区别**

- 置信区间：频率学派概念，如果重复抽样，95%的区间会包含真实参数
- 可信区间：贝叶斯概念，参数有95%的概率落在这个区间内

**Q4: 什么是中心极限定理？为什么重要？**

中心极限定理指出，无论总体分布如何，样本均值的分布在样本量足够大时趋近于正态分布。

重要性：
- 是假设检验的理论基础
- 解释了为什么正态分布如此普遍
- 允许我们对非正态数据使用基于正态分布的推断方法

**Q5: 如何理解偏差-方差权衡与贝叶斯推断的关系？**

- 高偏差对应强先验（过度限制模型）
- 高方差对应弱先验（模型过于灵活）
- 贝叶斯推断通过选择合适的先验来平衡偏差和方差

### 实践应用题

**Q1: 如何选择合适的概率分布？**

根据数据特征选择：
- 计数数据：泊松分布、负二项分布
- 二元结果：伯努利分布、二项分布
- 连续数据：正态分布、对数正态分布、指数分布
- 比例/概率：Beta分布
- 正值连续：Gamma分布、Weibull分布

**Q2: 实际项目中如何进行假设检验？**

1. 明确研究问题和假设
2. 选择合适的检验方法
3. 确定样本量（功效分析）
4. 收集数据并进行检验
5. 报告效应量和置信区间，不仅仅是p值
6. 考虑多重比较校正

**Q3: 贝叶斯方法在小样本场景下的优势？**

- 可以纳入先验知识，减少对数据的依赖
- 提供完整的后验分布，而不仅是点估计
- 自然地量化不确定性
- 随着数据增加，后验会逐渐被似然主导

### 常见陷阱

1. **混淆条件概率**：$P(A|B) \neq P(B|A)$（检察官谬误）
2. **忽视基础率**：在计算后验时忘记考虑先验
3. **P值误用**：p值不是假设为真的概率
4. **过度依赖统计显著性**：忽视效应量和实际意义
5. **多重比较问题**：进行多次检验但不校正
6. **选择性报告**：只报告显著结果

## 延伸阅读

### 推荐书籍

- **《Pattern Recognition and Machine Learning》（Bishop）**：从贝叶斯视角讲解机器学习
- **《Statistical Inference》（Casella & Berger）**：经典统计推断教材
- **《Bayesian Data Analysis》（Gelman等）**：贝叶斯统计的权威教材
- **《The Elements of Statistical Learning》**：统计学习的百科全书
- **《概率论与数理统计》（茆诗松）**：中文经典教材

### 在线资源

- [Seeing Theory](https://seeing-theory.brown.edu/)：可视化概率统计概念
- [3Blue1Brown - 贝叶斯定理](https://www.youtube.com/watch?v=HZGCoVF3YvM)：直观理解贝叶斯
- [StatQuest](https://www.youtube.com/c/joshstarmer)：统计学视频讲解

### 进阶主题

学完本文后，可以继续探索：
- 马尔可夫链蒙特卡洛（MCMC）
- 变分推断
- 高斯过程
- 隐马尔可夫模型
- 因果推断
- 非参数贝叶斯方法

## 总结

概率统计是机器学习的数学基石。本文系统介绍了：

1. **概率论基础**：随机变量、期望、方差、条件概率
2. **常见概率分布**：离散分布（二项、泊松）和连续分布（正态、指数、Beta）
3. **贝叶斯定理**：后验推断、朴素贝叶斯分类器
4. **最大似然估计**：参数估计的核心方法
5. **统计推断**：假设检验、置信区间
6. **机器学习应用**：EM算法、信息论

掌握这些知识，你将能够：
- 理解机器学习算法背后的概率原理
- 正确进行统计推断和假设检验
- 在贝叶斯和频率学派框架下分析问题
- 量化模型预测的不确定性

概率统计不仅是数学工具，更是一种思维方式。它教会我们如何在不确定性中做出理性决策，如何根据证据更新信念。这种思维方式在数据科学、人工智能乃至日常生活中都有广泛应用。
