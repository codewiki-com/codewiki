---
title: "Math Foundations for ML: Probability and Statistics"
description: "Master probability and statistics for machine learning: distributions, Bayes theorem, and statistical inference"
track: datascience
section: statistics
difficulty: intermediate
tags:
  - probability
  - statistics
  - Bayesian
  - machine learning
status: imported
origin: old/src/content/docs/datascience/probability-statistics.en.md
divergence: 0.303
issues: []
legacy:
  category: DataScience
  subcategory: Math
  order: 2
  lastUpdated: 2026-01-07
---

Probability and statistics form the mathematical backbone of machine learning. From understanding uncertainty in predictions to training models using maximum likelihood estimation, these concepts are essential for any ML practitioner. This comprehensive guide covers the fundamental concepts you need to master, complete with Python implementations.

## Probability Fundamentals

Probability theory provides the framework for reasoning about uncertainty. Understanding these foundations is crucial for interpreting model outputs, understanding generative models, and grasping the theory behind many ML algorithms.

### Basic Probability Concepts

**Sample Space and Events:**
The sample space ($\Omega$) is the set of all possible outcomes. An event is a subset of the sample space.

**Probability Axioms:**
1. Non-negativity: $P(A) \geq 0$ for any event $A$
2. Normalization: $P(\Omega) = 1$
3. Additivity: For mutually exclusive events $A$ and $B$: $P(A \cup B) = P(A) + P(B)$

**Key Probability Rules:**

```python
import numpy as np
from scipy import stats

# Complement Rule: P(A') = 1 - P(A)
p_rain = 0.3
p_no_rain = 1 - p_rain
print(f"P(no rain) = {p_no_rain}")

# Addition Rule: P(A or B) = P(A) + P(B) - P(A and B)
p_a = 0.4
p_b = 0.5
p_a_and_b = 0.2
p_a_or_b = p_a + p_b - p_a_and_b
print(f"P(A or B) = {p_a_or_b}")

# Conditional Probability: P(A|B) = P(A and B) / P(B)
p_a_given_b = p_a_and_b / p_b
print(f"P(A|B) = {p_a_given_b}")
```

### Conditional Probability and Independence

**Conditional Probability:**
The probability of event $A$ occurring given that event $B$ has occurred:

$$P(A|B) = \frac{P(A \cap B)}{P(B)}$$

**Independence:**
Two events are independent if the occurrence of one does not affect the probability of the other:

$$P(A \cap B) = P(A) \cdot P(B)$$

or equivalently: $P(A|B) = P(A)$

```python
# Example: Testing for independence
# Two coin flips
p_heads_first = 0.5
p_heads_second = 0.5
p_both_heads = 0.25

# Check independence
is_independent = np.isclose(p_both_heads, p_heads_first * p_heads_second)
print(f"Coin flips are independent: {is_independent}")

# Conditional independence example (important in ML)
# X and Y are conditionally independent given Z if:
# P(X, Y | Z) = P(X | Z) * P(Y | Z)
```

### The Chain Rule and Total Probability

**Chain Rule (Product Rule):**
$$P(A_1, A_2, ..., A_n) = P(A_1) \cdot P(A_2|A_1) \cdot P(A_3|A_1, A_2) \cdots P(A_n|A_1, ..., A_{n-1})$$

**Law of Total Probability:**
If $B_1, B_2, ..., B_n$ partition the sample space:
$$P(A) = \sum_{i=1}^{n} P(A|B_i) \cdot P(B_i)$$

```python
# Example: Total Probability
# Medical test scenario
p_disease = 0.01  # Prior probability of having disease
p_positive_given_disease = 0.95  # Sensitivity (true positive rate)
p_positive_given_no_disease = 0.05  # False positive rate

# Total probability of testing positive
p_positive = (p_positive_given_disease * p_disease +
              p_positive_given_no_disease * (1 - p_disease))
print(f"P(positive test) = {p_positive:.4f}")
```

## Random Variables and Probability Distributions

Random variables map outcomes to numerical values, enabling mathematical analysis of uncertain events.

### Discrete Random Variables

A discrete random variable takes on a countable number of values. It is characterized by a Probability Mass Function (PMF).

**Expected Value (Mean):**
$$E[X] = \sum_{x} x \cdot P(X = x)$$

**Variance:**
$$Var(X) = E[(X - E[X])^2] = E[X^2] - (E[X])^2$$

```python
import numpy as np
from scipy import stats

# Example: Discrete random variable
# Die roll
outcomes = np.array([1, 2, 3, 4, 5, 6])
probabilities = np.array([1/6] * 6)

# Expected value
expected_value = np.sum(outcomes * probabilities)
print(f"E[X] = {expected_value:.4f}")

# Variance
variance = np.sum((outcomes - expected_value)**2 * probabilities)
print(f"Var(X) = {variance:.4f}")

# Standard deviation
std_dev = np.sqrt(variance)
print(f"Std(X) = {std_dev:.4f}")
```

### Continuous Random Variables

A continuous random variable can take any value in an interval. It is characterized by a Probability Density Function (PDF).

**Properties:**
- $f(x) \geq 0$ for all $x$
- $\int_{-\infty}^{\infty} f(x) dx = 1$
- $P(a \leq X \leq b) = \int_a^b f(x) dx$

**Cumulative Distribution Function (CDF):**
$$F(x) = P(X \leq x) = \int_{-\infty}^{x} f(t) dt$$

```python
import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

# Example: Normal distribution
mu, sigma = 0, 1
x = np.linspace(-4, 4, 1000)

# PDF and CDF
pdf = stats.norm.pdf(x, mu, sigma)
cdf = stats.norm.cdf(x, mu, sigma)

fig, axes = plt.subplots(1, 2, figsize=(12, 4))

axes[0].plot(x, pdf, 'b-', linewidth=2)
axes[0].fill_between(x, pdf, alpha=0.3)
axes[0].set_title('Probability Density Function (PDF)')
axes[0].set_xlabel('x')
axes[0].set_ylabel('f(x)')

axes[1].plot(x, cdf, 'r-', linewidth=2)
axes[1].set_title('Cumulative Distribution Function (CDF)')
axes[1].set_xlabel('x')
axes[1].set_ylabel('F(x)')

plt.tight_layout()
plt.show()
```

### Joint, Marginal, and Conditional Distributions

**Joint Distribution:**
For two random variables $X$ and $Y$, the joint distribution describes the probability of both variables taking specific values simultaneously.

**Marginal Distribution:**
$$P(X = x) = \sum_y P(X = x, Y = y)$$

**Conditional Distribution:**
$$P(Y = y | X = x) = \frac{P(X = x, Y = y)}{P(X = x)}$$

```python
import numpy as np
import pandas as pd

# Example: Joint distribution
# Creating a joint probability table
joint_prob = np.array([
    [0.1, 0.2, 0.1],  # Y = 0
    [0.15, 0.25, 0.2]  # Y = 1
])

# Marginal distributions
marginal_x = joint_prob.sum(axis=0)  # Sum over Y
marginal_y = joint_prob.sum(axis=1)  # Sum over X

print("Joint Distribution:")
print(joint_prob)
print(f"\nMarginal P(X): {marginal_x}")
print(f"Marginal P(Y): {marginal_y}")

# Conditional distribution P(Y|X=1)
x_index = 1
conditional_y_given_x1 = joint_prob[:, x_index] / marginal_x[x_index]
print(f"\nP(Y|X=1): {conditional_y_given_x1}")
```

## Common Probability Distributions

Understanding common distributions is essential for modeling real-world phenomena and selecting appropriate likelihood functions in ML.

### Bernoulli and Binomial Distributions

**Bernoulli Distribution:**
Models a single trial with two outcomes (success/failure).
- $P(X = 1) = p$
- $P(X = 0) = 1 - p$
- $E[X] = p$, $Var(X) = p(1-p)$

**Binomial Distribution:**
Models the number of successes in $n$ independent Bernoulli trials.
$$P(X = k) = \binom{n}{k} p^k (1-p)^{n-k}$$

```python
from scipy import stats
import numpy as np
import matplotlib.pyplot as plt

# Bernoulli distribution
p = 0.7
bernoulli = stats.bernoulli(p)
print(f"Bernoulli(p={p})")
print(f"  Mean: {bernoulli.mean():.4f}")
print(f"  Variance: {bernoulli.var():.4f}")

# Binomial distribution
n, p = 20, 0.3
binomial = stats.binom(n, p)

k = np.arange(0, n+1)
pmf = binomial.pmf(k)

plt.figure(figsize=(10, 4))
plt.bar(k, pmf, color='steelblue', edgecolor='black')
plt.xlabel('Number of Successes (k)')
plt.ylabel('P(X = k)')
plt.title(f'Binomial Distribution (n={n}, p={p})')
plt.axvline(x=n*p, color='red', linestyle='--', label=f'Mean = {n*p}')
plt.legend()
plt.show()

print(f"\nBinomial(n={n}, p={p})")
print(f"  Mean: {binomial.mean():.4f}")
print(f"  Variance: {binomial.var():.4f}")
```

### Poisson Distribution

Models the number of events occurring in a fixed interval when events occur with a constant average rate.

$$P(X = k) = \frac{\lambda^k e^{-\lambda}}{k!}$$

**Properties:**
- $E[X] = \lambda$
- $Var(X) = \lambda$

**Applications:** Website traffic, customer arrivals, defects per unit.

```python
from scipy import stats
import numpy as np
import matplotlib.pyplot as plt

# Poisson distribution for different lambda values
lambdas = [1, 4, 10]
k = np.arange(0, 20)

fig, axes = plt.subplots(1, 3, figsize=(14, 4))

for ax, lam in zip(axes, lambdas):
    poisson = stats.poisson(lam)
    pmf = poisson.pmf(k)
    ax.bar(k, pmf, color='steelblue', edgecolor='black')
    ax.set_xlabel('k')
    ax.set_ylabel('P(X = k)')
    ax.set_title(f'Poisson(lambda={lam})')
    ax.axvline(x=lam, color='red', linestyle='--', label=f'Mean = {lam}')
    ax.legend()

plt.tight_layout()
plt.show()
```

### Normal (Gaussian) Distribution

The most important continuous distribution, characterized by mean ($\mu$) and standard deviation ($\sigma$).

$$f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{(x-\mu)^2}{2\sigma^2}}$$

**Properties:**
- Symmetric around the mean
- 68-95-99.7 rule: ~68% of data within 1 std, ~95% within 2 std, ~99.7% within 3 std
- Sum of independent normal random variables is also normal

```python
from scipy import stats
import numpy as np
import matplotlib.pyplot as plt

# Standard normal vs. other normal distributions
x = np.linspace(-6, 6, 1000)

fig, ax = plt.subplots(figsize=(10, 6))

params = [(0, 1), (0, 2), (2, 1), (-2, 0.5)]
colors = ['blue', 'green', 'red', 'purple']

for (mu, sigma), color in zip(params, colors):
    pdf = stats.norm.pdf(x, mu, sigma)
    ax.plot(x, pdf, color=color, linewidth=2,
            label=f'N({mu}, {sigma}^2)')

ax.set_xlabel('x')
ax.set_ylabel('f(x)')
ax.set_title('Normal Distributions with Different Parameters')
ax.legend()
ax.grid(True, alpha=0.3)
plt.show()

# 68-95-99.7 rule verification
normal = stats.norm(0, 1)
print("68-95-99.7 Rule for Standard Normal:")
print(f"  P(-1 < X < 1) = {normal.cdf(1) - normal.cdf(-1):.4f}")
print(f"  P(-2 < X < 2) = {normal.cdf(2) - normal.cdf(-2):.4f}")
print(f"  P(-3 < X < 3) = {normal.cdf(3) - normal.cdf(-3):.4f}")
```

### Exponential Distribution

Models the time between events in a Poisson process.

$$f(x) = \lambda e^{-\lambda x}, \quad x \geq 0$$

**Properties:**
- $E[X] = 1/\lambda$
- $Var(X) = 1/\lambda^2$
- Memoryless property: $P(X > s + t | X > s) = P(X > t)$

```python
from scipy import stats
import numpy as np
import matplotlib.pyplot as plt

# Exponential distribution
lambdas = [0.5, 1, 2]
x = np.linspace(0, 6, 1000)

fig, ax = plt.subplots(figsize=(10, 5))

for lam in lambdas:
    # scipy uses scale = 1/lambda
    exp_dist = stats.expon(scale=1/lam)
    pdf = exp_dist.pdf(x)
    ax.plot(x, pdf, linewidth=2, label=f'lambda={lam}')

ax.set_xlabel('x')
ax.set_ylabel('f(x)')
ax.set_title('Exponential Distributions')
ax.legend()
ax.grid(True, alpha=0.3)
plt.show()
```

### Uniform Distribution

All values in an interval are equally likely.

**Continuous Uniform:**
$$f(x) = \frac{1}{b-a}, \quad a \leq x \leq b$$

```python
from scipy import stats
import numpy as np

# Uniform distribution
a, b = 2, 8
uniform = stats.uniform(loc=a, scale=b-a)

print(f"Uniform({a}, {b})")
print(f"  Mean: {uniform.mean():.4f}")
print(f"  Variance: {uniform.var():.4f}")
print(f"  P(3 < X < 6): {uniform.cdf(6) - uniform.cdf(3):.4f}")
```

### Beta Distribution

Defined on [0, 1], commonly used as a prior for probability parameters.

$$f(x; \alpha, \beta) = \frac{x^{\alpha-1}(1-x)^{\beta-1}}{B(\alpha, \beta)}$$

```python
from scipy import stats
import numpy as np
import matplotlib.pyplot as plt

# Beta distributions with different parameters
x = np.linspace(0, 1, 1000)
params = [(1, 1), (2, 2), (2, 5), (5, 2), (0.5, 0.5)]

fig, ax = plt.subplots(figsize=(10, 6))

for alpha, beta in params:
    pdf = stats.beta.pdf(x, alpha, beta)
    ax.plot(x, pdf, linewidth=2, label=f'Beta({alpha}, {beta})')

ax.set_xlabel('x')
ax.set_ylabel('f(x)')
ax.set_title('Beta Distributions')
ax.legend()
ax.grid(True, alpha=0.3)
ax.set_xlim(0, 1)
plt.show()
```

### Multivariate Normal Distribution

Extension of the normal distribution to multiple dimensions, fundamental for many ML algorithms.

$$f(\mathbf{x}) = \frac{1}{(2\pi)^{d/2}|\Sigma|^{1/2}} \exp\left(-\frac{1}{2}(\mathbf{x}-\boldsymbol{\mu})^T\Sigma^{-1}(\mathbf{x}-\boldsymbol{\mu})\right)$$

```python
from scipy import stats
import numpy as np
import matplotlib.pyplot as plt

# Bivariate normal distribution
mean = [0, 0]
cov_matrices = [
    [[1, 0], [0, 1]],       # Uncorrelated
    [[1, 0.8], [0.8, 1]],   # Positive correlation
    [[1, -0.8], [-0.8, 1]]  # Negative correlation
]
titles = ['Uncorrelated', 'Positive Correlation', 'Negative Correlation']

fig, axes = plt.subplots(1, 3, figsize=(15, 4))

x = np.linspace(-3, 3, 100)
y = np.linspace(-3, 3, 100)
X, Y = np.meshgrid(x, y)
pos = np.dstack((X, Y))

for ax, cov, title in zip(axes, cov_matrices, titles):
    rv = stats.multivariate_normal(mean, cov)
    Z = rv.pdf(pos)
    ax.contour(X, Y, Z, levels=10)
    ax.set_xlabel('X')
    ax.set_ylabel('Y')
    ax.set_title(title)
    ax.set_aspect('equal')

plt.tight_layout()
plt.show()
```

## Bayes' Theorem

Bayes' theorem is foundational to Bayesian machine learning, enabling us to update beliefs based on new evidence.

### The Theorem

$$P(A|B) = \frac{P(B|A) \cdot P(A)}{P(B)}$$

**Components:**
- $P(A|B)$: **Posterior** - probability of A after observing B
- $P(B|A)$: **Likelihood** - probability of observing B given A
- $P(A)$: **Prior** - initial belief about A before observing B
- $P(B)$: **Evidence** - total probability of observing B

### Medical Diagnosis Example

```python
# Classic medical test example
# Disease prevalence (prior)
p_disease = 0.001  # 0.1% of population has disease

# Test characteristics
sensitivity = 0.99  # P(positive | disease) - true positive rate
specificity = 0.95  # P(negative | no disease) - true negative rate

# Calculate P(disease | positive test) using Bayes' theorem
p_positive_given_disease = sensitivity
p_positive_given_no_disease = 1 - specificity

# P(positive) using law of total probability
p_positive = (p_positive_given_disease * p_disease +
              p_positive_given_no_disease * (1 - p_disease))

# Bayes' theorem
p_disease_given_positive = (p_positive_given_disease * p_disease) / p_positive

print("Medical Test Analysis")
print("=" * 50)
print(f"Disease prevalence (prior):     {p_disease:.4f}")
print(f"Test sensitivity:               {sensitivity:.4f}")
print(f"Test specificity:               {specificity:.4f}")
print(f"P(positive test):               {p_positive:.4f}")
print(f"P(disease | positive test):     {p_disease_given_positive:.4f}")
print("\nInterpretation: Even with a positive test, there's only a " +
      f"{p_disease_given_positive*100:.1f}% chance of having the disease!")
```

### Bayesian Inference Framework

```python
import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

# Bayesian inference example: Estimating a coin's bias
# Prior: Beta(1, 1) - uniform prior (no prior knowledge)
# Likelihood: Binomial
# Posterior: Beta(alpha + successes, beta + failures)

def bayesian_coin_update(prior_alpha, prior_beta, heads, tails):
    """Update belief about coin bias using Bayesian inference."""
    posterior_alpha = prior_alpha + heads
    posterior_beta = prior_beta + tails
    return posterior_alpha, posterior_beta

# Simulation: observing coin flips
np.random.seed(42)
true_p = 0.7  # True (unknown) bias
n_flips = 100
flips = np.random.binomial(1, true_p, n_flips)

# Track posterior evolution
x = np.linspace(0, 1, 1000)
fig, axes = plt.subplots(2, 3, figsize=(14, 8))
axes = axes.flatten()

checkpoints = [0, 5, 10, 25, 50, 100]
alpha, beta = 1, 1  # Uniform prior

for idx, n in enumerate(checkpoints):
    if n == 0:
        current_alpha, current_beta = alpha, beta
    else:
        heads = flips[:n].sum()
        tails = n - heads
        current_alpha, current_beta = bayesian_coin_update(alpha, beta, heads, tails)

    posterior = stats.beta.pdf(x, current_alpha, current_beta)

    axes[idx].plot(x, posterior, 'b-', linewidth=2)
    axes[idx].axvline(x=true_p, color='red', linestyle='--',
                      label=f'True p = {true_p}')
    axes[idx].fill_between(x, posterior, alpha=0.3)
    axes[idx].set_title(f'After {n} flips')
    axes[idx].set_xlabel('p')
    axes[idx].set_ylabel('Density')
    axes[idx].legend()

plt.suptitle('Bayesian Update of Coin Bias Belief', fontsize=14)
plt.tight_layout()
plt.show()
```

### Naive Bayes Classifier

One of the most practical applications of Bayes' theorem in ML:

```python
from sklearn.naive_bayes import GaussianNB, MultinomialNB
from sklearn.datasets import load_iris, fetch_20newsgroups
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.feature_extraction.text import CountVectorizer

# Example 1: Gaussian Naive Bayes for continuous features
iris = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    iris.data, iris.target, test_size=0.3, random_state=42
)

gnb = GaussianNB()
gnb.fit(X_train, y_train)
y_pred = gnb.predict(X_test)

print("Gaussian Naive Bayes on Iris Dataset")
print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=iris.target_names))

# Example 2: Multinomial Naive Bayes for text classification
categories = ['sci.space', 'rec.sport.baseball']
newsgroups = fetch_20newsgroups(subset='train', categories=categories,
                                 remove=('headers', 'footers', 'quotes'))

vectorizer = CountVectorizer(max_features=5000)
X = vectorizer.fit_transform(newsgroups.data)
y = newsgroups.target

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

mnb = MultinomialNB()
mnb.fit(X_train, y_train)
y_pred = mnb.predict(X_test)

print("\nMultinomial Naive Bayes on Text Data")
print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
```

## Maximum Likelihood Estimation (MLE)

MLE is a fundamental method for estimating parameters of probability distributions from data.

### The Concept

Given observed data $X = \{x_1, x_2, ..., x_n\}$ and a parametric model with parameter $\theta$:

**Likelihood Function:**
$$L(\theta) = P(X|\theta) = \prod_{i=1}^{n} P(x_i|\theta)$$

**Log-Likelihood (more numerically stable):**
$$\ell(\theta) = \log L(\theta) = \sum_{i=1}^{n} \log P(x_i|\theta)$$

**MLE Estimate:**
$$\hat{\theta}_{MLE} = \arg\max_\theta \ell(\theta)$$

### MLE for Normal Distribution

```python
import numpy as np
from scipy import stats
from scipy.optimize import minimize
import matplotlib.pyplot as plt

# Generate data from normal distribution
np.random.seed(42)
true_mu, true_sigma = 5, 2
data = np.random.normal(true_mu, true_sigma, 100)

# Analytical MLE for normal distribution
mle_mu = np.mean(data)
mle_sigma = np.std(data, ddof=0)  # MLE uses n, not n-1

print(f"True parameters: mu={true_mu}, sigma={true_sigma}")
print(f"MLE estimates:   mu={mle_mu:.4f}, sigma={mle_sigma:.4f}")

# Numerical MLE using optimization
def neg_log_likelihood(params, data):
    mu, sigma = params
    if sigma <= 0:
        return np.inf
    return -np.sum(stats.norm.logpdf(data, mu, sigma))

# Optimize
result = minimize(neg_log_likelihood, x0=[0, 1], args=(data,),
                  method='Nelder-Mead')
print(f"Numerical MLE:   mu={result.x[0]:.4f}, sigma={result.x[1]:.4f}")

# Visualize likelihood surface
mu_range = np.linspace(3, 7, 100)
sigma_range = np.linspace(1, 4, 100)
MU, SIGMA = np.meshgrid(mu_range, sigma_range)
LL = np.zeros_like(MU)

for i in range(len(sigma_range)):
    for j in range(len(mu_range)):
        LL[i, j] = -neg_log_likelihood([MU[i, j], SIGMA[i, j]], data)

fig, ax = plt.subplots(figsize=(10, 8))
contour = ax.contour(MU, SIGMA, LL, levels=30)
ax.clabel(contour, inline=True, fontsize=8)
ax.plot(mle_mu, mle_sigma, 'r*', markersize=15, label='MLE')
ax.plot(true_mu, true_sigma, 'g^', markersize=15, label='True')
ax.set_xlabel('mu')
ax.set_ylabel('sigma')
ax.set_title('Log-Likelihood Surface for Normal Distribution')
ax.legend()
plt.show()
```

### MLE for Bernoulli Distribution

```python
import numpy as np

# MLE for Bernoulli/Binomial: p_hat = number of successes / total trials
np.random.seed(42)
true_p = 0.7
n_samples = 100
data = np.random.binomial(1, true_p, n_samples)

# MLE estimate
mle_p = np.mean(data)
print(f"True p: {true_p}")
print(f"MLE p:  {mle_p:.4f}")

# Derive: log-likelihood = k*log(p) + (n-k)*log(1-p)
# d/dp: k/p - (n-k)/(1-p) = 0
# Solving: p = k/n
```

### MLE in Linear Regression

Under Gaussian noise assumption, MLE for linear regression is equivalent to ordinary least squares (OLS):

```python
import numpy as np
from sklearn.linear_model import LinearRegression
import matplotlib.pyplot as plt

# Generate data
np.random.seed(42)
n = 100
X = np.random.randn(n, 1)
true_w, true_b = 2.5, 1.0
y = true_w * X.flatten() + true_b + np.random.randn(n) * 0.5

# MLE via sklearn (equivalent to OLS)
model = LinearRegression()
model.fit(X, y)

print(f"True parameters:  w={true_w}, b={true_b}")
print(f"MLE estimates:    w={model.coef_[0]:.4f}, b={model.intercept_:.4f}")

# Manual MLE derivation for simple linear regression
# MLE: minimize sum of squared residuals
X_with_bias = np.column_stack([np.ones(n), X])
theta_mle = np.linalg.inv(X_with_bias.T @ X_with_bias) @ X_with_bias.T @ y
print(f"Manual MLE:       w={theta_mle[1]:.4f}, b={theta_mle[0]:.4f}")
```

### Maximum A Posteriori (MAP) Estimation

MAP combines MLE with prior information:

$$\hat{\theta}_{MAP} = \arg\max_\theta P(\theta|X) = \arg\max_\theta [P(X|\theta) \cdot P(\theta)]$$

```python
import numpy as np
from scipy import stats
from scipy.optimize import minimize

# MAP estimation with Gaussian prior
np.random.seed(42)
data = np.random.normal(5, 2, 20)  # Small sample

# Prior: N(0, 1) - we believe mean is around 0
prior_mu, prior_sigma = 0, 1

def neg_log_posterior(mu, data, prior_mu, prior_sigma):
    # Log-likelihood
    ll = np.sum(stats.norm.logpdf(data, mu, np.std(data)))
    # Log-prior
    lp = stats.norm.logpdf(mu, prior_mu, prior_sigma)
    return -(ll + lp)

# MLE (no prior)
mle = np.mean(data)

# MAP (with prior)
result = minimize(neg_log_posterior, x0=[0],
                  args=(data, prior_mu, prior_sigma))
map_estimate = result.x[0]

print(f"Data mean: {np.mean(data):.4f}")
print(f"MLE:       {mle:.4f}")
print(f"MAP:       {map_estimate:.4f}")
print("\nMAP is pulled toward the prior mean of 0")
```

## Statistical Inference

Statistical inference allows us to draw conclusions about populations from sample data.

### Point Estimation and Properties

**Desirable Estimator Properties:**

1. **Unbiasedness**: $E[\hat{\theta}] = \theta$
2. **Consistency**: $\hat{\theta} \to \theta$ as $n \to \infty$
3. **Efficiency**: Minimum variance among unbiased estimators

```python
import numpy as np
import matplotlib.pyplot as plt

# Demonstration of consistency
np.random.seed(42)
true_mean = 10
sample_sizes = [10, 50, 100, 500, 1000, 5000]
n_simulations = 1000

estimates = []
for n in sample_sizes:
    means = [np.mean(np.random.normal(true_mean, 3, n))
             for _ in range(n_simulations)]
    estimates.append(means)

fig, ax = plt.subplots(figsize=(12, 6))
bp = ax.boxplot(estimates, labels=sample_sizes)
ax.axhline(y=true_mean, color='red', linestyle='--', label='True Mean')
ax.set_xlabel('Sample Size')
ax.set_ylabel('Sample Mean')
ax.set_title('Consistency of Sample Mean Estimator')
ax.legend()
plt.show()
```

### Sampling Distributions

The sampling distribution describes how a statistic varies across different samples from the same population.

```python
import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

# Sampling distribution of the mean
np.random.seed(42)
population = np.random.exponential(scale=2, size=100000)  # Non-normal population

sample_sizes = [5, 30, 100]
n_samples = 10000

fig, axes = plt.subplots(1, 3, figsize=(14, 4))

for ax, n in zip(axes, sample_sizes):
    sample_means = [np.mean(np.random.choice(population, n, replace=True))
                    for _ in range(n_samples)]

    ax.hist(sample_means, bins=50, density=True, alpha=0.7, edgecolor='black')

    # Overlay theoretical normal
    mean_of_means = np.mean(sample_means)
    std_of_means = np.std(sample_means)
    x = np.linspace(min(sample_means), max(sample_means), 100)
    ax.plot(x, stats.norm.pdf(x, mean_of_means, std_of_means),
            'r-', linewidth=2, label='Normal Fit')

    ax.set_title(f'n = {n}')
    ax.set_xlabel('Sample Mean')
    ax.set_ylabel('Density')
    ax.legend()

plt.suptitle('Central Limit Theorem: Sampling Distribution of Mean', fontsize=14)
plt.tight_layout()
plt.show()
```

### Central Limit Theorem (CLT)

The CLT states that the sampling distribution of the mean approaches a normal distribution as sample size increases, regardless of the population distribution:

$$\bar{X} \sim N\left(\mu, \frac{\sigma^2}{n}\right) \text{ as } n \to \infty$$

**Standard Error of the Mean:**
$$SE = \frac{\sigma}{\sqrt{n}}$$

```python
import numpy as np
from scipy import stats

# Verify CLT numerically
np.random.seed(42)
population_mean = 5
population_std = 2
n = 100

# Standard error
se = population_std / np.sqrt(n)
print(f"Theoretical SE: {se:.4f}")

# Simulate
sample_means = [np.mean(np.random.normal(population_mean, population_std, n))
                for _ in range(10000)]
print(f"Empirical SE:   {np.std(sample_means):.4f}")
```

## Confidence Intervals

Confidence intervals quantify the uncertainty in parameter estimates.

### Confidence Interval for the Mean

For large samples or normal population with known variance:
$$CI = \bar{x} \pm z_{\alpha/2} \cdot \frac{\sigma}{\sqrt{n}}$$

For small samples with unknown variance (using t-distribution):
$$CI = \bar{x} \pm t_{\alpha/2, n-1} \cdot \frac{s}{\sqrt{n}}$$

```python
import numpy as np
from scipy import stats

# Sample data
np.random.seed(42)
sample = np.random.normal(100, 15, 50)

# Calculate 95% confidence interval
confidence_level = 0.95
sample_mean = np.mean(sample)
sample_std = np.std(sample, ddof=1)
n = len(sample)
se = sample_std / np.sqrt(n)

# Using t-distribution (unknown population variance)
t_critical = stats.t.ppf((1 + confidence_level) / 2, df=n-1)
margin_of_error = t_critical * se
ci_lower = sample_mean - margin_of_error
ci_upper = sample_mean + margin_of_error

print(f"Sample mean: {sample_mean:.4f}")
print(f"Standard error: {se:.4f}")
print(f"95% CI: [{ci_lower:.4f}, {ci_upper:.4f}]")

# Using scipy's built-in function
ci = stats.t.interval(confidence_level, df=n-1, loc=sample_mean, scale=se)
print(f"95% CI (scipy): [{ci[0]:.4f}, {ci[1]:.4f}]")
```

### Bootstrap Confidence Intervals

Non-parametric approach that doesn't assume any distribution:

```python
import numpy as np
from scipy import stats

def bootstrap_ci(data, statistic=np.mean, n_bootstrap=10000,
                 confidence_level=0.95):
    """Calculate bootstrap confidence interval."""
    n = len(data)
    bootstrap_samples = np.random.choice(data, size=(n_bootstrap, n),
                                         replace=True)
    bootstrap_stats = np.apply_along_axis(statistic, 1, bootstrap_samples)

    alpha = 1 - confidence_level
    lower = np.percentile(bootstrap_stats, 100 * alpha / 2)
    upper = np.percentile(bootstrap_stats, 100 * (1 - alpha / 2))

    return lower, upper, bootstrap_stats

# Example
np.random.seed(42)
data = np.random.exponential(scale=2, size=100)

# Bootstrap CI for mean
ci_lower, ci_upper, boot_stats = bootstrap_ci(data)
print(f"Bootstrap 95% CI for mean: [{ci_lower:.4f}, {ci_upper:.4f}]")

# Bootstrap CI for median
ci_lower, ci_upper, _ = bootstrap_ci(data, statistic=np.median)
print(f"Bootstrap 95% CI for median: [{ci_lower:.4f}, {ci_upper:.4f}]")
```

### Confidence Intervals for Proportions

```python
import numpy as np
from scipy import stats
from statsmodels.stats.proportion import proportion_confint

# Sample proportion
n_successes = 65
n_trials = 100
p_hat = n_successes / n_trials

# Normal approximation (Wald interval)
se = np.sqrt(p_hat * (1 - p_hat) / n_trials)
z_critical = stats.norm.ppf(0.975)
ci_wald = (p_hat - z_critical * se, p_hat + z_critical * se)
print(f"Wald CI:    [{ci_wald[0]:.4f}, {ci_wald[1]:.4f}]")

# Wilson score interval (more accurate for extreme proportions)
ci_wilson = proportion_confint(n_successes, n_trials, method='wilson')
print(f"Wilson CI:  [{ci_wilson[0]:.4f}, {ci_wilson[1]:.4f}]")

# Clopper-Pearson (exact) interval
ci_exact = proportion_confint(n_successes, n_trials, method='beta')
print(f"Exact CI:   [{ci_exact[0]:.4f}, {ci_exact[1]:.4f}]")
```

## Hypothesis Testing

Hypothesis testing provides a framework for making decisions about population parameters based on sample data.

### Fundamentals

**Null Hypothesis ($H_0$)**: The default assumption (no effect, no difference)

**Alternative Hypothesis ($H_1$ or $H_a$)**: What we want to test for

**Key Concepts:**
- **Type I Error ($\alpha$)**: Rejecting $H_0$ when it's true (false positive)
- **Type II Error ($\beta$)**: Failing to reject $H_0$ when it's false (false negative)
- **Power ($1 - \beta$)**: Probability of correctly rejecting a false $H_0$
- **p-value**: Probability of observing data as extreme as ours, assuming $H_0$ is true

```python
import numpy as np
from scipy import stats

# Visualization of Type I and Type II errors
import matplotlib.pyplot as plt

fig, ax = plt.subplots(figsize=(12, 6))

# Null distribution
x = np.linspace(-4, 8, 1000)
null_dist = stats.norm(0, 1)
alt_dist = stats.norm(3, 1)  # Alternative with effect size = 3

ax.plot(x, null_dist.pdf(x), 'b-', linewidth=2, label='Null Distribution')
ax.plot(x, alt_dist.pdf(x), 'r-', linewidth=2, label='Alternative Distribution')

# Critical value (alpha = 0.05, one-tailed)
critical_value = stats.norm.ppf(0.95)
ax.axvline(x=critical_value, color='green', linestyle='--',
           label=f'Critical Value = {critical_value:.2f}')

# Shade Type I error region
x_type1 = np.linspace(critical_value, 4, 100)
ax.fill_between(x_type1, null_dist.pdf(x_type1), alpha=0.3, color='blue',
                label='Type I Error (alpha)')

# Shade Type II error region
x_type2 = np.linspace(-4, critical_value, 100)
ax.fill_between(x_type2, alt_dist.pdf(x_type2), alpha=0.3, color='red',
                label='Type II Error (beta)')

ax.set_xlabel('Test Statistic')
ax.set_ylabel('Density')
ax.set_title('Type I and Type II Errors in Hypothesis Testing')
ax.legend()
plt.show()

# Calculate alpha and beta
alpha = 1 - null_dist.cdf(critical_value)
beta = alt_dist.cdf(critical_value)
power = 1 - beta

print(f"Alpha (Type I error rate): {alpha:.4f}")
print(f"Beta (Type II error rate): {beta:.4f}")
print(f"Power: {power:.4f}")
```

### t-Tests

**One-Sample t-Test**: Test if sample mean differs from a hypothesized value.

```python
from scipy import stats
import numpy as np

# One-sample t-test
np.random.seed(42)
sample = np.random.normal(102, 15, 30)  # Sample from population with mean ~102
hypothesized_mean = 100

t_stat, p_value = stats.ttest_1samp(sample, hypothesized_mean)
print("One-Sample t-Test")
print(f"H0: mu = {hypothesized_mean}")
print(f"Sample mean: {np.mean(sample):.4f}")
print(f"t-statistic: {t_stat:.4f}")
print(f"p-value: {p_value:.4f}")
print(f"Reject H0 at alpha=0.05: {p_value < 0.05}")
```

**Independent Two-Sample t-Test**: Compare means of two independent groups.

```python
from scipy import stats
import numpy as np

# Two-sample t-test
np.random.seed(42)
group_a = np.random.normal(100, 15, 50)
group_b = np.random.normal(108, 15, 50)

# First check for equal variances (Levene's test)
levene_stat, levene_p = stats.levene(group_a, group_b)
print(f"Levene's test p-value: {levene_p:.4f}")

# Use appropriate t-test
equal_var = levene_p > 0.05
t_stat, p_value = stats.ttest_ind(group_a, group_b, equal_var=equal_var)

print(f"\nTwo-Sample t-Test (equal_var={equal_var})")
print(f"Group A mean: {np.mean(group_a):.4f}")
print(f"Group B mean: {np.mean(group_b):.4f}")
print(f"t-statistic: {t_stat:.4f}")
print(f"p-value: {p_value:.4f}")
```

**Paired t-Test**: Compare means for matched samples.

```python
from scipy import stats
import numpy as np

# Paired t-test (e.g., before/after treatment)
np.random.seed(42)
before = np.random.normal(50, 10, 30)
after = before + np.random.normal(5, 5, 30)  # Treatment effect ~5 units

t_stat, p_value = stats.ttest_rel(before, after)
print("Paired t-Test")
print(f"Mean before: {np.mean(before):.4f}")
print(f"Mean after: {np.mean(after):.4f}")
print(f"Mean difference: {np.mean(after - before):.4f}")
print(f"t-statistic: {t_stat:.4f}")
print(f"p-value: {p_value:.4f}")
```

### Chi-Square Tests

**Chi-Square Test for Independence**: Test if two categorical variables are independent.

```python
from scipy import stats
import numpy as np

# Chi-square test for independence
# Example: Testing if gender and product preference are independent
observed = np.array([
    [50, 30, 20],   # Male preferences for products A, B, C
    [35, 45, 20]    # Female preferences
])

chi2, p_value, dof, expected = stats.chi2_contingency(observed)

print("Chi-Square Test for Independence")
print(f"Observed frequencies:\n{observed}")
print(f"\nExpected frequencies:\n{expected.round(2)}")
print(f"\nChi-square statistic: {chi2:.4f}")
print(f"Degrees of freedom: {dof}")
print(f"p-value: {p_value:.4f}")
```

**Chi-Square Goodness of Fit**: Test if observed frequencies match expected distribution.

```python
from scipy import stats
import numpy as np

# Goodness of fit test (e.g., testing if a die is fair)
observed = np.array([18, 22, 16, 21, 19, 24])  # Observed counts
expected = np.array([20, 20, 20, 20, 20, 20])  # Expected for fair die

chi2, p_value = stats.chisquare(observed, expected)
print("Chi-Square Goodness of Fit Test")
print(f"Observed: {observed}")
print(f"Expected: {expected}")
print(f"Chi-square statistic: {chi2:.4f}")
print(f"p-value: {p_value:.4f}")
```

### ANOVA (Analysis of Variance)

Compare means across three or more groups.

```python
from scipy import stats
import numpy as np

# One-way ANOVA
np.random.seed(42)
group1 = np.random.normal(100, 10, 30)
group2 = np.random.normal(105, 10, 30)
group3 = np.random.normal(110, 10, 30)

f_stat, p_value = stats.f_oneway(group1, group2, group3)

print("One-Way ANOVA")
print(f"Group 1 mean: {np.mean(group1):.4f}")
print(f"Group 2 mean: {np.mean(group2):.4f}")
print(f"Group 3 mean: {np.mean(group3):.4f}")
print(f"F-statistic: {f_stat:.4f}")
print(f"p-value: {p_value:.4f}")

# Post-hoc test (Tukey's HSD) if ANOVA is significant
if p_value < 0.05:
    from statsmodels.stats.multicomp import pairwise_tukeyhsd
    import pandas as pd

    all_data = np.concatenate([group1, group2, group3])
    groups = ['Group1']*30 + ['Group2']*30 + ['Group3']*30

    tukey = pairwise_tukeyhsd(all_data, groups, alpha=0.05)
    print("\nTukey HSD Post-Hoc Test:")
    print(tukey)
```

### Multiple Testing Correction

When performing multiple hypothesis tests, the probability of false positives increases. Corrections are needed:

```python
from statsmodels.stats.multitest import multipletests
import numpy as np

# Simulate multiple p-values
np.random.seed(42)
p_values = [0.001, 0.01, 0.02, 0.04, 0.08, 0.10, 0.15, 0.20, 0.30, 0.50]

print("Multiple Testing Corrections")
print(f"Original p-values: {p_values}")
print()

# Bonferroni correction (most conservative)
rejected_bonf, p_bonf, _, _ = multipletests(p_values, alpha=0.05,
                                            method='bonferroni')
print(f"Bonferroni adjusted: {p_bonf.round(4)}")
print(f"Rejected (Bonferroni): {rejected_bonf}")
print()

# Holm-Bonferroni (step-down, more powerful)
rejected_holm, p_holm, _, _ = multipletests(p_values, alpha=0.05,
                                            method='holm')
print(f"Holm adjusted: {p_holm.round(4)}")
print(f"Rejected (Holm): {rejected_holm}")
print()

# Benjamini-Hochberg (FDR control)
rejected_bh, p_bh, _, _ = multipletests(p_values, alpha=0.05,
                                        method='fdr_bh')
print(f"BH adjusted: {p_bh.round(4)}")
print(f"Rejected (BH): {rejected_bh}")
```

### Effect Size

Statistical significance doesn't tell you about practical importance. Effect size measures the magnitude of an effect.

```python
import numpy as np
from scipy import stats

def cohens_d(group1, group2):
    """Calculate Cohen's d effect size."""
    n1, n2 = len(group1), len(group2)
    var1, var2 = np.var(group1, ddof=1), np.var(group2, ddof=1)
    pooled_std = np.sqrt(((n1-1)*var1 + (n2-1)*var2) / (n1+n2-2))
    return (np.mean(group1) - np.mean(group2)) / pooled_std

# Example
np.random.seed(42)
group_a = np.random.normal(100, 15, 100)
group_b = np.random.normal(105, 15, 100)

# Statistical test
t_stat, p_value = stats.ttest_ind(group_a, group_b)

# Effect size
d = cohens_d(group_a, group_b)

print(f"t-statistic: {t_stat:.4f}")
print(f"p-value: {p_value:.4f}")
print(f"Cohen's d: {d:.4f}")
print()
print("Cohen's d interpretation:")
print("  |d| < 0.2: negligible")
print("  0.2 <= |d| < 0.5: small")
print("  0.5 <= |d| < 0.8: medium")
print("  |d| >= 0.8: large")
```

## Sample Size and Power Analysis

Proper sample size calculation ensures studies have sufficient power to detect meaningful effects.

### Power Analysis for t-Test

```python
from statsmodels.stats.power import TTestIndPower, TTestPower
import numpy as np
import matplotlib.pyplot as plt

# Power analysis for independent t-test
analysis = TTestIndPower()

# Calculate required sample size
effect_size = 0.5  # Cohen's d (medium effect)
alpha = 0.05
power = 0.8

sample_size = analysis.solve_power(effect_size=effect_size,
                                    alpha=alpha,
                                    power=power,
                                    ratio=1.0,  # Equal group sizes
                                    alternative='two-sided')
print(f"Required sample size per group: {int(np.ceil(sample_size))}")

# Plot power curves
sample_sizes = np.arange(10, 200)
effect_sizes = [0.2, 0.5, 0.8]

fig, ax = plt.subplots(figsize=(10, 6))

for es in effect_sizes:
    powers = [analysis.solve_power(effect_size=es, nobs1=n,
                                   alpha=0.05, ratio=1.0)
              for n in sample_sizes]
    ax.plot(sample_sizes, powers, linewidth=2, label=f'd = {es}')

ax.axhline(y=0.8, color='red', linestyle='--', label='Power = 0.8')
ax.set_xlabel('Sample Size per Group')
ax.set_ylabel('Power')
ax.set_title('Power Analysis for Independent t-Test')
ax.legend()
ax.grid(True, alpha=0.3)
plt.show()
```

### Sample Size for Proportion Tests

```python
from statsmodels.stats.power import zt_ind_solve_power
from statsmodels.stats.proportion import proportion_effectsize

# Sample size for comparing two proportions
p1 = 0.10  # Control group conversion rate
p2 = 0.12  # Expected treatment group rate

# Calculate effect size (Cohen's h)
effect_size = proportion_effectsize(p1, p2)

# Calculate required sample size
sample_size = zt_ind_solve_power(effect_size=effect_size,
                                  alpha=0.05,
                                  power=0.8,
                                  ratio=1.0,
                                  alternative='two-sided')

print(f"Baseline conversion: {p1}")
print(f"Expected improvement: {p2}")
print(f"Relative lift: {(p2-p1)/p1*100:.1f}%")
print(f"Effect size (Cohen's h): {effect_size:.4f}")
print(f"Required sample size per group: {int(np.ceil(sample_size))}")
```

## Practical Applications in ML

### A/B Testing Framework

```python
import numpy as np
from scipy import stats
from statsmodels.stats.proportion import proportions_ztest

def ab_test_analysis(control_conversions, control_visitors,
                     treatment_conversions, treatment_visitors,
                     alpha=0.05):
    """Complete A/B test analysis."""
    # Calculate conversion rates
    control_rate = control_conversions / control_visitors
    treatment_rate = treatment_conversions / treatment_visitors

    # Relative improvement
    relative_lift = (treatment_rate - control_rate) / control_rate

    # Two-proportion z-test
    count = np.array([treatment_conversions, control_conversions])
    nobs = np.array([treatment_visitors, control_visitors])
    z_stat, p_value = proportions_ztest(count, nobs, alternative='two-sided')

    # Effect size (Cohen's h)
    h = 2 * (np.arcsin(np.sqrt(treatment_rate)) -
             np.arcsin(np.sqrt(control_rate)))

    # Confidence interval for difference
    se_diff = np.sqrt(control_rate*(1-control_rate)/control_visitors +
                      treatment_rate*(1-treatment_rate)/treatment_visitors)
    z_critical = stats.norm.ppf(1 - alpha/2)
    ci_diff = (treatment_rate - control_rate - z_critical * se_diff,
               treatment_rate - control_rate + z_critical * se_diff)

    print("=" * 60)
    print("A/B TEST RESULTS")
    print("=" * 60)
    print(f"\nControl:   {control_conversions}/{control_visitors} = {control_rate:.4f}")
    print(f"Treatment: {treatment_conversions}/{treatment_visitors} = {treatment_rate:.4f}")
    print(f"\nRelative Lift: {relative_lift*100:.2f}%")
    print(f"Absolute Difference: {(treatment_rate-control_rate)*100:.2f}pp")
    print(f"\nZ-statistic: {z_stat:.4f}")
    print(f"P-value: {p_value:.4f}")
    print(f"Effect size (Cohen's h): {h:.4f}")
    print(f"\n95% CI for difference: [{ci_diff[0]*100:.2f}pp, {ci_diff[1]*100:.2f}pp]")
    print(f"\nStatistically significant at alpha={alpha}: {p_value < alpha}")

    return {
        'control_rate': control_rate,
        'treatment_rate': treatment_rate,
        'relative_lift': relative_lift,
        'p_value': p_value,
        'significant': p_value < alpha
    }

# Example usage
results = ab_test_analysis(
    control_conversions=500,
    control_visitors=10000,
    treatment_conversions=550,
    treatment_visitors=10000
)
```

### Model Comparison with Statistical Tests

```python
import numpy as np
from scipy import stats
from sklearn.model_selection import cross_val_score
from sklearn.datasets import load_breast_cancer
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression

# Load data
data = load_breast_cancer()
X, y = data.data, data.target

# Compare two models using cross-validation
model_a = LogisticRegression(max_iter=1000)
model_b = RandomForestClassifier(n_estimators=100, random_state=42)

# Get cross-validation scores (same folds for both)
np.random.seed(42)
scores_a = cross_val_score(model_a, X, y, cv=10, scoring='accuracy')
scores_b = cross_val_score(model_b, X, y, cv=10, scoring='accuracy')

print("Model Comparison")
print(f"Logistic Regression: {scores_a.mean():.4f} (+/- {scores_a.std()*2:.4f})")
print(f"Random Forest:       {scores_b.mean():.4f} (+/- {scores_b.std()*2:.4f})")

# Paired t-test (same folds)
t_stat, p_value = stats.ttest_rel(scores_a, scores_b)
print(f"\nPaired t-test:")
print(f"t-statistic: {t_stat:.4f}")
print(f"p-value: {p_value:.4f}")

# Wilcoxon signed-rank test (non-parametric alternative)
stat, p_wilcoxon = stats.wilcoxon(scores_a, scores_b)
print(f"\nWilcoxon signed-rank test:")
print(f"p-value: {p_wilcoxon:.4f}")
```

### Feature Selection with Statistical Tests

```python
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.datasets import load_breast_cancer
from sklearn.feature_selection import SelectKBest, f_classif, mutual_info_classif

# Load data
data = load_breast_cancer()
X = pd.DataFrame(data.data, columns=data.feature_names)
y = data.target

# ANOVA F-test for feature selection
f_scores, p_values = f_classif(X, y)

feature_stats = pd.DataFrame({
    'feature': data.feature_names,
    'f_score': f_scores,
    'p_value': p_values
}).sort_values('f_score', ascending=False)

print("Feature Selection using ANOVA F-test")
print(feature_stats.head(10))

# Mutual information (non-linear dependencies)
mi_scores = mutual_info_classif(X, y, random_state=42)

mi_df = pd.DataFrame({
    'feature': data.feature_names,
    'mi_score': mi_scores
}).sort_values('mi_score', ascending=False)

print("\nFeature Selection using Mutual Information")
print(mi_df.head(10))
```

## Interview Key Points

### Common Questions

**Q1: Explain Bayes' theorem and give an example.**

Bayes' theorem relates conditional probabilities: $P(A|B) = \frac{P(B|A)P(A)}{P(B)}$

Classic example: A medical test with 99% sensitivity and 95% specificity, testing for a disease with 1% prevalence. Even with a positive test, the probability of having the disease is only about 17%, because false positives dominate given the low base rate.

**Q2: What is the difference between MLE and MAP estimation?**

MLE finds parameters that maximize the likelihood of observed data: $\hat{\theta}_{MLE} = \arg\max P(D|\theta)$

MAP incorporates prior beliefs: $\hat{\theta}_{MAP} = \arg\max P(D|\theta)P(\theta)$

MAP with uniform prior equals MLE. With informative priors, MAP is pulled toward prior beliefs, useful when data is limited.

**Q3: Explain Type I and Type II errors.**

- Type I (False Positive): Rejecting true null hypothesis. Probability = alpha (significance level)
- Type II (False Negative): Failing to reject false null hypothesis. Probability = beta
- Power = 1 - beta = probability of correctly detecting a true effect

Trade-off: Reducing Type I error increases Type II error (and vice versa) for fixed sample size.

**Q4: When should you use parametric vs. non-parametric tests?**

Parametric tests (t-test, ANOVA):
- Assume specific distribution (usually normal)
- More powerful when assumptions are met
- Require larger samples for robustness

Non-parametric tests (Mann-Whitney, Wilcoxon):
- No distribution assumptions
- Use ranks instead of raw values
- Better for ordinal data or heavily skewed distributions
- Less powerful but more robust

**Q5: How do you interpret a p-value?**

The p-value is the probability of observing data as extreme as yours (or more extreme) if the null hypothesis is true. It is NOT:
- The probability that H0 is true
- The probability of making a wrong decision
- A measure of effect size

A small p-value suggests the data is unlikely under H0, but doesn't prove H1 or indicate practical significance.

**Q6: What is the Central Limit Theorem and why is it important?**

CLT states that the sampling distribution of the mean approaches normal as sample size increases, regardless of population distribution. Importance:
- Justifies using normal-based inference
- Explains why mean is often normally distributed
- Enables confidence intervals and hypothesis tests
- Works for sums of many independent random variables

### Practical Tips

1. **Always report effect sizes** alongside p-values to communicate practical significance
2. **Use appropriate tests** based on data type, sample size, and assumptions
3. **Check assumptions** before applying parametric tests
4. **Correct for multiple comparisons** when testing multiple hypotheses
5. **Consider Bayesian approaches** when prior information is available
6. **Understand the difference** between statistical and practical significance
7. **Visualize distributions** before applying statistical tests
8. **Use bootstrap methods** when parametric assumptions are questionable

## Further Reading

### Recommended Books

- **"Statistical Inference"** (Casella & Berger): Rigorous mathematical treatment of probability and inference
- **"All of Statistics"** (Wasserman): Modern introduction covering both frequentist and Bayesian approaches
- **"Bayesian Data Analysis"** (Gelman et al.): Comprehensive guide to Bayesian methods
- **"The Elements of Statistical Learning"** (Hastie, Tibshirani, Friedman): Statistical perspective on ML
- **"Think Stats"** (Downey): Practical statistics with Python

### Online Resources

- **Khan Academy Statistics**: Free video courses covering fundamentals
- **Seeing Theory** (Brown University): Interactive visualizations of probability concepts
- **StatQuest** (YouTube): Clear explanations of statistical concepts
- **scipy.stats Documentation**: Comprehensive reference for statistical functions
- **3Blue1Brown** (YouTube): Visual explanations of probability and Bayes

### Advanced Topics

After mastering the fundamentals, explore:
- **Bayesian Inference**: MCMC, Variational Inference, Probabilistic Programming
- **Causal Inference**: Randomized experiments, observational studies, DAGs
- **Survival Analysis**: Time-to-event data, hazard functions
- **Information Theory**: Entropy, KL divergence, mutual information
- **Probabilistic Graphical Models**: Bayesian networks, Markov random fields
- **Nonparametric Statistics**: Kernel density estimation, rank-based methods

## Summary

Probability and statistics provide the essential mathematical framework for machine learning:

1. **Probability Fundamentals**: Understanding uncertainty, conditional probability, and independence
2. **Distributions**: Knowing common distributions and when to use them
3. **Bayes' Theorem**: Updating beliefs with evidence, foundation for Bayesian ML
4. **Maximum Likelihood**: Primary method for parameter estimation
5. **Statistical Inference**: Drawing conclusions from sample data
6. **Confidence Intervals**: Quantifying uncertainty in estimates
7. **Hypothesis Testing**: Making data-driven decisions
8. **Power Analysis**: Ensuring studies can detect meaningful effects

These concepts are not just theoretical. They appear throughout ML:
- Classification uses probability estimates
- Neural networks often optimize log-likelihood
- Regularization can be viewed through a Bayesian lens (MAP estimation)
- Model evaluation requires proper statistical testing
- A/B testing validates ML improvements in production

Mastering probability and statistics will deepen your understanding of why ML algorithms work and help you make better modeling decisions. The mathematical rigor will serve you well whether you're tuning hyperparameters, evaluating model performance, or designing experiments to validate new features.
