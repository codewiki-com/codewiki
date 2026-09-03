---
title: "Classical ML: Support Vector Machines"
description: "Deep dive into SVM principles: maximum margin, kernel trick, and soft margin"
track: datascience
section: classical-ml
difficulty: advanced
tags:
  - SVM
  - kernel methods
  - classification
  - machine learning
status: imported
origin: old/src/content/docs/datascience/svm.en.md
divergence: 0.124
issues: []
legacy:
  category: DataScience
  subcategory: ClassicalML
  order: 15
  lastUpdated: 2026-01-07
---

Support Vector Machines (SVMs) are one of the most powerful and elegant supervised learning algorithms in classical machine learning. Originally developed by Vladimir Vapnik and colleagues in the 1990s, SVMs remain highly relevant for many classification and regression tasks, particularly when dealing with small to medium-sized datasets with clear margins of separation.

---

## SVM Intuition

### The Core Idea

Imagine you have a dataset with two classes of points scattered on a plane. Your goal is to draw a line (or in higher dimensions, a hyperplane) that separates these classes. While many lines could technically separate the data, SVM finds the **optimal** separating hyperplane -- the one that maximizes the distance (margin) between the hyperplane and the nearest data points from each class.

**Why maximize the margin?**

A larger margin provides better generalization to unseen data. If the separating boundary is too close to the training points, small perturbations in new data could lead to misclassification. A wide margin acts as a buffer zone, making the classifier more robust.

### Geometric Interpretation

Consider a binary classification problem where we want to separate class +1 from class -1. The decision boundary is defined by:

$$\mathbf{w}^T \mathbf{x} + b = 0$$

Where:
- $\mathbf{w}$ is the weight vector (normal to the hyperplane)
- $\mathbf{x}$ is the input feature vector
- $b$ is the bias term

Points are classified based on which side of the hyperplane they fall:

$$f(\mathbf{x}) = \text{sign}(\mathbf{w}^T \mathbf{x} + b)$$

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import make_blobs

# Generate linearly separable data
X, y = make_blobs(n_samples=100, centers=2, random_state=42, cluster_std=1.5)
y = np.where(y == 0, -1, 1)  # Convert to {-1, +1}

# Visualize the data
plt.figure(figsize=(10, 6))
plt.scatter(X[y == 1][:, 0], X[y == 1][:, 1], c='blue', label='Class +1', edgecolors='k')
plt.scatter(X[y == -1][:, 0], X[y == -1][:, 1], c='red', label='Class -1', edgecolors='k')
plt.xlabel('Feature 1')
plt.ylabel('Feature 2')
plt.title('Binary Classification Problem')
plt.legend()
plt.show()
```

---

## Maximum Margin Classifier

### Mathematical Formulation

For a linearly separable dataset, we want to find a hyperplane that:
1. Correctly classifies all training points
2. Maximizes the margin between the two classes

The distance from a point $\mathbf{x}_i$ to the hyperplane is:

$$\text{distance} = \frac{|\ \mathbf{w}^T \mathbf{x}_i + b\ |}{\|\mathbf{w}\|}$$

For correct classification, we require:

$$y_i(\mathbf{w}^T \mathbf{x}_i + b) \geq 1 \quad \forall i$$

The margin is $\frac{2}{\|\mathbf{w}\|}$, so maximizing the margin is equivalent to minimizing $\|\mathbf{w}\|$.

### Primal Optimization Problem

The hard-margin SVM optimization problem is:

$$\min_{\mathbf{w}, b} \frac{1}{2}\|\mathbf{w}\|^2$$

Subject to:

$$y_i(\mathbf{w}^T \mathbf{x}_i + b) \geq 1 \quad \forall i = 1, \ldots, n$$

This is a convex quadratic programming problem with linear constraints, guaranteeing a unique global solution.

### Lagrangian Formulation

Introducing Lagrange multipliers $\alpha_i \geq 0$, we get the Lagrangian:

$$\mathcal{L}(\mathbf{w}, b, \boldsymbol{\alpha}) = \frac{1}{2}\|\mathbf{w}\|^2 - \sum_{i=1}^{n} \alpha_i [y_i(\mathbf{w}^T \mathbf{x}_i + b) - 1]$$

Taking derivatives and setting them to zero:

$$\frac{\partial \mathcal{L}}{\partial \mathbf{w}} = 0 \Rightarrow \mathbf{w} = \sum_{i=1}^{n} \alpha_i y_i \mathbf{x}_i$$

$$\frac{\partial \mathcal{L}}{\partial b} = 0 \Rightarrow \sum_{i=1}^{n} \alpha_i y_i = 0$$

### Dual Problem

Substituting back, we obtain the dual formulation:

$$\max_{\boldsymbol{\alpha}} \sum_{i=1}^{n} \alpha_i - \frac{1}{2} \sum_{i=1}^{n} \sum_{j=1}^{n} \alpha_i \alpha_j y_i y_j \mathbf{x}_i^T \mathbf{x}_j$$

Subject to:

$$\alpha_i \geq 0 \quad \forall i$$
$$\sum_{i=1}^{n} \alpha_i y_i = 0$$

**Why use the dual formulation?**

1. The optimization involves only inner products $\mathbf{x}_i^T \mathbf{x}_j$, enabling the kernel trick
2. The number of parameters equals the number of training samples, not the feature dimension
3. Sparse solutions: only support vectors have $\alpha_i > 0$

```python
import numpy as np
from scipy.optimize import minimize

def hard_margin_svm(X, y):
    """
    Solve the hard-margin SVM using the dual formulation.
    """
    n_samples = X.shape[0]

    # Compute the Gram matrix
    K = np.dot(X, X.T)

    # Objective function (negative because we minimize instead of maximize)
    def objective(alpha):
        return 0.5 * np.sum(alpha.reshape(-1, 1) * alpha * y.reshape(-1, 1) * y * K) - np.sum(alpha)

    # Gradient of the objective
    def gradient(alpha):
        return np.sum(alpha * y * y.reshape(-1, 1) * K, axis=1) - 1

    # Constraints
    constraints = [
        {'type': 'eq', 'fun': lambda alpha: np.dot(alpha, y)},  # sum(alpha * y) = 0
    ]

    # Bounds: alpha >= 0
    bounds = [(0, None) for _ in range(n_samples)]

    # Initial guess
    alpha0 = np.zeros(n_samples)

    # Solve
    result = minimize(objective, alpha0, method='SLSQP', jac=gradient,
                     bounds=bounds, constraints=constraints)

    alpha = result.x

    # Compute w and b
    w = np.sum((alpha * y).reshape(-1, 1) * X, axis=0)

    # Find support vectors (alpha > threshold)
    sv_mask = alpha > 1e-5
    b = np.mean(y[sv_mask] - np.dot(X[sv_mask], w))

    return w, b, alpha
```

---

## Support Vectors

### What Are Support Vectors?

Support vectors are the training samples that lie exactly on the margin boundaries. They are the **critical elements** that define the decision boundary. Mathematically, support vectors are points for which the Lagrange multiplier $\alpha_i > 0$.

**Key Properties:**

1. **Sparse representation**: Only support vectors contribute to the solution
2. **Defining the boundary**: Removing any support vector would change the decision boundary
3. **Typical proportion**: Usually only a small fraction of training points become support vectors

### The Decision Function

The classification of a new point $\mathbf{x}$ depends only on the support vectors:

$$f(\mathbf{x}) = \text{sign}\left(\sum_{i \in SV} \alpha_i y_i \mathbf{x}_i^T \mathbf{x} + b\right)$$

Where $SV$ denotes the set of support vector indices.

```python
from sklearn.svm import SVC
import matplotlib.pyplot as plt
import numpy as np

# Train an SVM
svm = SVC(kernel='linear', C=1e6)  # Large C for hard margin
svm.fit(X, y)

# Identify support vectors
print(f"Number of support vectors: {len(svm.support_)}")
print(f"Support vector indices: {svm.support_}")
print(f"Number per class: {svm.n_support_}")

# Visualize
plt.figure(figsize=(10, 6))
plt.scatter(X[:, 0], X[:, 1], c=y, cmap='coolwarm', edgecolors='k')
plt.scatter(X[svm.support_, 0], X[svm.support_, 1],
            s=200, facecolors='none', edgecolors='green', linewidths=2,
            label='Support Vectors')

# Plot decision boundary and margins
ax = plt.gca()
xlim = ax.get_xlim()
ylim = ax.get_ylim()

xx = np.linspace(xlim[0], xlim[1], 30)
yy = np.linspace(ylim[0], ylim[1], 30)
YY, XX = np.meshgrid(yy, xx)
xy = np.vstack([XX.ravel(), YY.ravel()]).T
Z = svm.decision_function(xy).reshape(XX.shape)

ax.contour(XX, YY, Z, colors='k', levels=[-1, 0, 1],
           linestyles=['--', '-', '--'])

plt.legend()
plt.title('SVM with Support Vectors Highlighted')
plt.show()
```

### KKT Conditions

The Karush-Kuhn-Tucker (KKT) conditions provide optimality conditions for the SVM:

1. **Stationarity**: $\mathbf{w} = \sum_i \alpha_i y_i \mathbf{x}_i$
2. **Primal feasibility**: $y_i(\mathbf{w}^T \mathbf{x}_i + b) \geq 1$
3. **Dual feasibility**: $\alpha_i \geq 0$
4. **Complementary slackness**: $\alpha_i[y_i(\mathbf{w}^T \mathbf{x}_i + b) - 1] = 0$

The complementary slackness condition tells us that:
- If $\alpha_i > 0$, then $y_i(\mathbf{w}^T \mathbf{x}_i + b) = 1$ (point is on the margin)
- If $y_i(\mathbf{w}^T \mathbf{x}_i + b) > 1$, then $\alpha_i = 0$ (point is not a support vector)

---

## The Kernel Trick

### Motivation: Handling Non-linear Data

Real-world data is often not linearly separable. The kernel trick allows SVMs to find non-linear decision boundaries by implicitly mapping data to a higher-dimensional feature space.

**Key Insight**: Instead of explicitly computing the high-dimensional feature map $\phi(\mathbf{x})$, we only need to compute inner products in that space: $K(\mathbf{x}_i, \mathbf{x}_j) = \phi(\mathbf{x}_i)^T \phi(\mathbf{x}_j)$

### Common Kernel Functions

#### Linear Kernel

$$K(\mathbf{x}_i, \mathbf{x}_j) = \mathbf{x}_i^T \mathbf{x}_j$$

No transformation; equivalent to standard linear SVM.

#### Polynomial Kernel

$$K(\mathbf{x}_i, \mathbf{x}_j) = (\gamma \mathbf{x}_i^T \mathbf{x}_j + r)^d$$

Parameters:
- $d$: polynomial degree
- $\gamma$: scaling factor
- $r$: constant term (often called coef0)

```python
# Example: Polynomial kernel maps to feature space
# For d=2, gamma=1, r=0 in 2D:
# phi([x1, x2]) = [x1^2, sqrt(2)*x1*x2, x2^2]
```

#### Radial Basis Function (RBF) / Gaussian Kernel

$$K(\mathbf{x}_i, \mathbf{x}_j) = \exp\left(-\gamma \|\mathbf{x}_i - \mathbf{x}_j\|^2\right)$$

Or equivalently:

$$K(\mathbf{x}_i, \mathbf{x}_j) = \exp\left(-\frac{\|\mathbf{x}_i - \mathbf{x}_j\|^2}{2\sigma^2}\right)$$

Where $\gamma = \frac{1}{2\sigma^2}$.

**Properties of RBF:**
- Infinite-dimensional implicit feature space
- Local behavior: points far apart have kernel value close to 0
- Universal approximator: can approximate any continuous function

#### Sigmoid Kernel

$$K(\mathbf{x}_i, \mathbf{x}_j) = \tanh(\gamma \mathbf{x}_i^T \mathbf{x}_j + r)$$

Related to neural networks (single hidden layer).

### Mercer's Condition

A function $K(\mathbf{x}_i, \mathbf{x}_j)$ is a valid kernel if and only if the kernel matrix (Gram matrix) is positive semi-definite for any set of input points:

$$K_{ij} = K(\mathbf{x}_i, \mathbf{x}_j)$$

This ensures that there exists a feature map $\phi$ such that $K(\mathbf{x}_i, \mathbf{x}_j) = \phi(\mathbf{x}_i)^T \phi(\mathbf{x}_j)$.

```python
import numpy as np
from sklearn.datasets import make_circles
from sklearn.svm import SVC
import matplotlib.pyplot as plt

# Generate non-linearly separable data
X, y = make_circles(n_samples=200, factor=0.5, noise=0.1, random_state=42)

# Compare different kernels
kernels = ['linear', 'poly', 'rbf']
fig, axes = plt.subplots(1, 3, figsize=(15, 5))

for ax, kernel in zip(axes, kernels):
    svm = SVC(kernel=kernel, gamma='auto', degree=3)
    svm.fit(X, y)

    # Create mesh for decision boundary
    xx, yy = np.meshgrid(np.linspace(-1.5, 1.5, 100),
                         np.linspace(-1.5, 1.5, 100))
    Z = svm.predict(np.c_[xx.ravel(), yy.ravel()])
    Z = Z.reshape(xx.shape)

    ax.contourf(xx, yy, Z, alpha=0.3, cmap='coolwarm')
    ax.scatter(X[:, 0], X[:, 1], c=y, cmap='coolwarm', edgecolors='k')
    ax.scatter(X[svm.support_, 0], X[svm.support_, 1],
               s=100, facecolors='none', edgecolors='green', linewidths=2)
    ax.set_title(f'{kernel.upper()} Kernel\n{len(svm.support_)} support vectors')
    ax.set_xlim(-1.5, 1.5)
    ax.set_ylim(-1.5, 1.5)

plt.tight_layout()
plt.show()
```

### Custom Kernels

You can define custom kernel functions for domain-specific applications:

```python
from sklearn.svm import SVC
from sklearn.metrics.pairwise import rbf_kernel, polynomial_kernel

# Custom kernel: combination of RBF and polynomial
def custom_kernel(X1, X2):
    rbf_part = rbf_kernel(X1, X2, gamma=0.5)
    poly_part = polynomial_kernel(X1, X2, degree=2)
    return 0.7 * rbf_part + 0.3 * poly_part

# Use custom kernel
svm_custom = SVC(kernel=custom_kernel)
svm_custom.fit(X, y)

# Alternatively, pass a precomputed kernel matrix
from sklearn.svm import SVC

K_train = custom_kernel(X_train, X_train)
svm = SVC(kernel='precomputed')
svm.fit(K_train, y_train)

K_test = custom_kernel(X_test, X_train)
predictions = svm.predict(K_test)
```

---

## Soft Margin SVM

### Motivation

Hard-margin SVM requires that all data points be correctly classified with margin at least 1. This is problematic when:
1. Data is not linearly separable (even in kernel space)
2. There are outliers that would severely distort the margin
3. We prefer some misclassifications for better generalization

### Slack Variables

Soft-margin SVM introduces slack variables $\xi_i \geq 0$ to allow some violations:

$$y_i(\mathbf{w}^T \mathbf{x}_i + b) \geq 1 - \xi_i$$

The optimization problem becomes:

$$\min_{\mathbf{w}, b, \boldsymbol{\xi}} \frac{1}{2}\|\mathbf{w}\|^2 + C \sum_{i=1}^{n} \xi_i$$

Subject to:

$$y_i(\mathbf{w}^T \mathbf{x}_i + b) \geq 1 - \xi_i \quad \forall i$$
$$\xi_i \geq 0 \quad \forall i$$

### The C Parameter

The regularization parameter $C$ controls the trade-off between:
- **Large C**: Smaller margin but fewer misclassifications (risk of overfitting)
- **Small C**: Larger margin but more misclassifications (risk of underfitting)

| C Value | Margin | Misclassifications | Risk |
|---------|--------|-------------------|------|
| Very Large | Small | Few | Overfitting |
| Moderate | Medium | Some | Good generalization |
| Very Small | Large | Many | Underfitting |

### Dual Formulation with Soft Margin

The dual problem for soft-margin SVM:

$$\max_{\boldsymbol{\alpha}} \sum_{i=1}^{n} \alpha_i - \frac{1}{2} \sum_{i=1}^{n} \sum_{j=1}^{n} \alpha_i \alpha_j y_i y_j K(\mathbf{x}_i, \mathbf{x}_j)$$

Subject to:

$$0 \leq \alpha_i \leq C \quad \forall i$$
$$\sum_{i=1}^{n} \alpha_i y_i = 0$$

The only change from hard-margin is the upper bound $C$ on the Lagrange multipliers.

### Classification of Points

Based on the KKT conditions, training points fall into three categories:

| Condition | Location | Role |
|-----------|----------|------|
| $\alpha_i = 0$ | Correctly classified, outside margin | Non-support vector |
| $0 < \alpha_i < C$ | Exactly on margin boundary | Free support vector |
| $\alpha_i = C$ | Inside margin or misclassified | Bounded support vector |

```python
import numpy as np
from sklearn.svm import SVC
import matplotlib.pyplot as plt

# Generate data with some overlap
np.random.seed(42)
X1 = np.random.randn(50, 2) + np.array([2, 2])
X2 = np.random.randn(50, 2) + np.array([0, 0])
X = np.vstack([X1, X2])
y = np.hstack([np.ones(50), -np.ones(50)])

# Compare different C values
C_values = [0.1, 1, 10, 100]
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

for ax, C in zip(axes.ravel(), C_values):
    svm = SVC(kernel='linear', C=C)
    svm.fit(X, y)

    # Create mesh
    xx, yy = np.meshgrid(np.linspace(-3, 5, 100),
                         np.linspace(-3, 5, 100))
    Z = svm.decision_function(np.c_[xx.ravel(), yy.ravel()])
    Z = Z.reshape(xx.shape)

    ax.contourf(xx, yy, Z, levels=np.linspace(-3, 3, 20),
                alpha=0.5, cmap='coolwarm')
    ax.contour(xx, yy, Z, levels=[-1, 0, 1], colors='k',
               linestyles=['--', '-', '--'])
    ax.scatter(X[:, 0], X[:, 1], c=y, cmap='coolwarm', edgecolors='k')
    ax.scatter(X[svm.support_, 0], X[svm.support_, 1],
               s=150, facecolors='none', edgecolors='yellow', linewidths=2)
    ax.set_title(f'C = {C}\n{len(svm.support_)} support vectors')

plt.tight_layout()
plt.show()
```

---

## Sequential Minimal Optimization (SMO)

### Overview

Sequential Minimal Optimization is an efficient algorithm for solving the SVM quadratic programming problem, developed by John Platt in 1998. Instead of solving the full QP problem at once, SMO breaks it into smaller sub-problems.

### Key Insight

The constraint $\sum_i \alpha_i y_i = 0$ means we cannot optimize a single $\alpha_i$ independently. The minimum number of variables we can optimize at once is two. SMO iteratively selects pairs of $\alpha$ values to optimize.

### Algorithm Steps

1. **Initialize**: Set all $\alpha_i = 0$
2. **Select working set**: Choose two $\alpha$ values ($\alpha_i$, $\alpha_j$) that violate KKT conditions
3. **Optimize**: Analytically solve for the optimal values
4. **Update**: Update $\alpha_i$ and $\alpha_j$
5. **Repeat**: Until convergence

### Analytical Solution for Two Variables

When optimizing $\alpha_i$ and $\alpha_j$ with all other $\alpha$'s fixed, we have:

$$\alpha_i y_i + \alpha_j y_j = \text{constant}$$

The optimal unclipped value for $\alpha_j$:

$$\alpha_j^{\text{new, unclipped}} = \alpha_j^{\text{old}} + \frac{y_j(E_i - E_j)}{\eta}$$

Where:
- $E_i = f(\mathbf{x}_i) - y_i$ is the error on sample $i$
- $\eta = K_{ii} + K_{jj} - 2K_{ij}$

Then clip to the feasible region $[L, H]$:

$$\alpha_j^{\text{new}} = \begin{cases}
H & \text{if } \alpha_j^{\text{new, unclipped}} > H \\
L & \text{if } \alpha_j^{\text{new, unclipped}} < L \\
\alpha_j^{\text{new, unclipped}} & \text{otherwise}
\end{cases}$$

```python
import numpy as np

class SimpleSMO:
    """
    Simplified SMO algorithm for educational purposes.
    """
    def __init__(self, C=1.0, kernel='linear', tol=1e-3, max_iter=1000):
        self.C = C
        self.kernel = kernel
        self.tol = tol
        self.max_iter = max_iter

    def _kernel(self, x1, x2):
        if self.kernel == 'linear':
            return np.dot(x1, x2)
        elif self.kernel == 'rbf':
            gamma = 0.5
            return np.exp(-gamma * np.linalg.norm(x1 - x2) ** 2)

    def fit(self, X, y):
        n_samples = X.shape[0]
        self.X = X
        self.y = y
        self.alpha = np.zeros(n_samples)
        self.b = 0

        # Precompute kernel matrix
        self.K = np.zeros((n_samples, n_samples))
        for i in range(n_samples):
            for j in range(n_samples):
                self.K[i, j] = self._kernel(X[i], X[j])

        iteration = 0
        while iteration < self.max_iter:
            num_changed = 0
            for i in range(n_samples):
                Ei = self._decision_function(i) - y[i]

                # Check KKT conditions
                if (y[i] * Ei < -self.tol and self.alpha[i] < self.C) or \
                   (y[i] * Ei > self.tol and self.alpha[i] > 0):

                    # Select j randomly (simplified heuristic)
                    j = np.random.choice([k for k in range(n_samples) if k != i])
                    Ej = self._decision_function(j) - y[j]

                    # Save old alphas
                    alpha_i_old = self.alpha[i]
                    alpha_j_old = self.alpha[j]

                    # Compute bounds
                    if y[i] != y[j]:
                        L = max(0, self.alpha[j] - self.alpha[i])
                        H = min(self.C, self.C + self.alpha[j] - self.alpha[i])
                    else:
                        L = max(0, self.alpha[i] + self.alpha[j] - self.C)
                        H = min(self.C, self.alpha[i] + self.alpha[j])

                    if L == H:
                        continue

                    # Compute eta
                    eta = 2 * self.K[i, j] - self.K[i, i] - self.K[j, j]
                    if eta >= 0:
                        continue

                    # Update alpha_j
                    self.alpha[j] = alpha_j_old - y[j] * (Ei - Ej) / eta
                    self.alpha[j] = np.clip(self.alpha[j], L, H)

                    if abs(self.alpha[j] - alpha_j_old) < 1e-5:
                        continue

                    # Update alpha_i
                    self.alpha[i] = alpha_i_old + y[i] * y[j] * (alpha_j_old - self.alpha[j])

                    # Update b
                    b1 = self.b - Ei - y[i] * (self.alpha[i] - alpha_i_old) * self.K[i, i] \
                         - y[j] * (self.alpha[j] - alpha_j_old) * self.K[i, j]
                    b2 = self.b - Ej - y[i] * (self.alpha[i] - alpha_i_old) * self.K[i, j] \
                         - y[j] * (self.alpha[j] - alpha_j_old) * self.K[j, j]

                    if 0 < self.alpha[i] < self.C:
                        self.b = b1
                    elif 0 < self.alpha[j] < self.C:
                        self.b = b2
                    else:
                        self.b = (b1 + b2) / 2

                    num_changed += 1

            if num_changed == 0:
                iteration += 1
            else:
                iteration = 0

        # Store support vectors
        self.support_ = np.where(self.alpha > 1e-5)[0]
        return self

    def _decision_function(self, i):
        return np.sum(self.alpha * self.y * self.K[:, i]) + self.b

    def predict(self, X_test):
        predictions = []
        for x in X_test:
            decision = self.b
            for i in self.support_:
                decision += self.alpha[i] * self.y[i] * self._kernel(self.X[i], x)
            predictions.append(np.sign(decision))
        return np.array(predictions)
```

### Heuristics for Selecting $\alpha$ Pairs

Efficient implementations use heuristics to select the pair $(\alpha_i, \alpha_j)$:

1. **First choice (outer loop)**: Select $\alpha_i$ that violates KKT conditions most severely
2. **Second choice (inner loop)**: Select $\alpha_j$ to maximize $|E_i - E_j|$

---

## Support Vector Regression (SVR)

### From Classification to Regression

Support Vector Regression adapts SVM for regression tasks. Instead of finding a maximum margin separating hyperplane, SVR finds a function that deviates from training targets by at most $\epsilon$ while being as flat as possible.

### Epsilon-Insensitive Loss

SVR uses the $\epsilon$-insensitive loss function:

$$L_\epsilon(y, f(\mathbf{x})) = \max(0, |y - f(\mathbf{x})| - \epsilon)$$

Errors within $\epsilon$ of the true value are ignored (treated as zero loss).

### Optimization Problem

The primal SVR optimization:

$$\min_{\mathbf{w}, b, \boldsymbol{\xi}, \boldsymbol{\xi}^*} \frac{1}{2}\|\mathbf{w}\|^2 + C \sum_{i=1}^{n} (\xi_i + \xi_i^*)$$

Subject to:

$$y_i - (\mathbf{w}^T \mathbf{x}_i + b) \leq \epsilon + \xi_i$$
$$(\mathbf{w}^T \mathbf{x}_i + b) - y_i \leq \epsilon + \xi_i^*$$
$$\xi_i, \xi_i^* \geq 0$$

### Dual Formulation

The dual problem involves pairs of Lagrange multipliers $(\alpha_i, \alpha_i^*)$:

$$\max_{\boldsymbol{\alpha}, \boldsymbol{\alpha}^*} -\frac{1}{2} \sum_{i,j} (\alpha_i - \alpha_i^*)(\alpha_j - \alpha_j^*) K(\mathbf{x}_i, \mathbf{x}_j) - \epsilon \sum_i (\alpha_i + \alpha_i^*) + \sum_i y_i(\alpha_i - \alpha_i^*)$$

The regression function:

$$f(\mathbf{x}) = \sum_{i=1}^{n} (\alpha_i - \alpha_i^*) K(\mathbf{x}_i, \mathbf{x}) + b$$

```python
from sklearn.svm import SVR
import numpy as np
import matplotlib.pyplot as plt

# Generate regression data
np.random.seed(42)
X = np.sort(5 * np.random.rand(100, 1), axis=0)
y = np.sin(X).ravel() + np.random.randn(100) * 0.1

# Compare different SVR parameters
fig, axes = plt.subplots(2, 2, figsize=(12, 10))

configs = [
    {'kernel': 'rbf', 'C': 1, 'epsilon': 0.1},
    {'kernel': 'rbf', 'C': 100, 'epsilon': 0.1},
    {'kernel': 'rbf', 'C': 1, 'epsilon': 0.5},
    {'kernel': 'poly', 'C': 1, 'epsilon': 0.1, 'degree': 3},
]

X_plot = np.linspace(0, 5, 1000).reshape(-1, 1)

for ax, config in zip(axes.ravel(), configs):
    svr = SVR(**config)
    svr.fit(X, y)
    y_pred = svr.predict(X_plot)

    ax.scatter(X, y, c='gray', alpha=0.5, label='Data')
    ax.plot(X_plot, y_pred, 'r-', linewidth=2, label='SVR')
    ax.plot(X_plot, y_pred + config['epsilon'], 'g--', linewidth=1)
    ax.plot(X_plot, y_pred - config['epsilon'], 'g--', linewidth=1, label='Epsilon tube')
    ax.scatter(X[svr.support_], y[svr.support_],
               s=80, facecolors='none', edgecolors='blue', linewidths=1.5,
               label=f'{len(svr.support_)} SVs')

    title = f"kernel={config['kernel']}, C={config['C']}, eps={config['epsilon']}"
    ax.set_title(title)
    ax.legend(loc='upper right')

plt.tight_layout()
plt.show()
```

### Key Hyperparameters for SVR

| Parameter | Effect |
|-----------|--------|
| C | Regularization: larger C means less tolerance for errors |
| epsilon | Width of tube: larger epsilon means more points inside tube |
| kernel | RBF for smooth functions, polynomial for polynomial trends |
| gamma (RBF) | Influences curve flexibility |

---

## Scikit-learn Implementation

### Basic Classification

```python
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.datasets import load_breast_cancer
from sklearn.metrics import classification_report, confusion_matrix

# Load data
data = load_breast_cancer()
X, y = data.data, data.target

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Create pipeline with scaling (important for SVM!)
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('svm', SVC(kernel='rbf', random_state=42))
])

# Train
pipeline.fit(X_train, y_train)

# Evaluate
y_pred = pipeline.predict(X_test)
print("Classification Report:")
print(classification_report(y_test, y_pred, target_names=data.target_names))

# Confusion Matrix
print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))
```

### Hyperparameter Tuning

```python
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV
from scipy.stats import loguniform

# Define parameter grid
param_grid = {
    'svm__C': [0.1, 1, 10, 100],
    'svm__gamma': ['scale', 'auto', 0.1, 0.01, 0.001],
    'svm__kernel': ['rbf', 'poly', 'sigmoid']
}

# Grid search
grid_search = GridSearchCV(
    pipeline,
    param_grid,
    cv=5,
    scoring='accuracy',
    n_jobs=-1,
    verbose=1
)
grid_search.fit(X_train, y_train)

print(f"Best parameters: {grid_search.best_params_}")
print(f"Best CV score: {grid_search.best_score_:.4f}")
print(f"Test score: {grid_search.score(X_test, y_test):.4f}")

# For larger parameter spaces, use RandomizedSearchCV
param_distributions = {
    'svm__C': loguniform(1e-2, 1e3),
    'svm__gamma': loguniform(1e-4, 1e0),
    'svm__kernel': ['rbf', 'poly']
}

random_search = RandomizedSearchCV(
    pipeline,
    param_distributions,
    n_iter=50,
    cv=5,
    scoring='accuracy',
    random_state=42,
    n_jobs=-1
)
random_search.fit(X_train, y_train)
```

### Probability Estimation

```python
# Enable probability estimation
svm_proba = SVC(kernel='rbf', probability=True, random_state=42)
svm_proba.fit(X_train, y_train)

# Get probability estimates
probabilities = svm_proba.predict_proba(X_test)
print(f"Class probabilities for first 5 samples:\n{probabilities[:5]}")

# Note: probability=True uses Platt scaling, which fits a sigmoid
# function to the SVM scores. This is slower and may not be well-calibrated.
```

### Multi-class Classification

```python
from sklearn.datasets import load_digits
from sklearn.svm import SVC

# Load multi-class data
digits = load_digits()
X, y = digits.data, digits.target

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# SVM handles multi-class via one-vs-one or one-vs-rest
# Default: one-vs-one (n_classes * (n_classes - 1) / 2 classifiers)
svm_ovo = SVC(kernel='rbf', decision_function_shape='ovo')
svm_ovo.fit(X_train, y_train)

# One-vs-rest
svm_ovr = SVC(kernel='rbf', decision_function_shape='ovr')
svm_ovr.fit(X_train, y_train)

print(f"OvO accuracy: {svm_ovo.score(X_test, y_test):.4f}")
print(f"OvR accuracy: {svm_ovr.score(X_test, y_test):.4f}")
```

### SVR Example

```python
from sklearn.svm import SVR
from sklearn.model_selection import cross_val_score
from sklearn.datasets import fetch_california_housing
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import numpy as np

# Load regression data
housing = fetch_california_housing()
X, y = housing.data, housing.target

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# SVR pipeline
svr_pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('svr', SVR(kernel='rbf', C=10, epsilon=0.1))
])

# Cross-validation
cv_scores = cross_val_score(svr_pipeline, X_train, y_train,
                            cv=5, scoring='neg_mean_squared_error')
print(f"CV RMSE: {np.sqrt(-cv_scores.mean()):.4f} (+/- {np.sqrt(-cv_scores).std():.4f})")

# Train and evaluate
svr_pipeline.fit(X_train, y_train)
y_pred = svr_pipeline.predict(X_test)

from sklearn.metrics import mean_squared_error, r2_score
print(f"Test RMSE: {np.sqrt(mean_squared_error(y_test, y_pred)):.4f}")
print(f"Test R^2: {r2_score(y_test, y_pred):.4f}")
```

### Linear SVM with SGD

For very large datasets, `SGDClassifier` with hinge loss provides a scalable alternative:

```python
from sklearn.linear_model import SGDClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline

# SGD-based linear SVM (much faster for large datasets)
sgd_svm = make_pipeline(
    StandardScaler(),
    SGDClassifier(loss='hinge', penalty='l2', alpha=0.0001,
                  max_iter=1000, tol=1e-3, random_state=42)
)

sgd_svm.fit(X_train, y_train)
print(f"SGD SVM accuracy: {sgd_svm.score(X_test, y_test):.4f}")
```

---

## Practical Considerations

### Feature Scaling

**Critical**: SVM is sensitive to feature scales. Always standardize or normalize features.

```python
from sklearn.preprocessing import StandardScaler, MinMaxScaler

# StandardScaler: zero mean, unit variance
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# MinMaxScaler: scale to [0, 1] range
scaler = MinMaxScaler()
X_scaled = scaler.fit_transform(X)
```

### Choosing the Kernel

| Scenario | Recommended Kernel |
|----------|-------------------|
| High-dimensional, sparse data (e.g., text) | Linear |
| Low-dimensional, non-linear data | RBF |
| Need interpretability | Linear |
| Polynomial relationship suspected | Polynomial |
| Default choice when unsure | RBF |

### Handling Imbalanced Classes

```python
from sklearn.svm import SVC
from sklearn.utils.class_weight import compute_class_weight
import numpy as np

# Method 1: Use class_weight parameter
svm = SVC(kernel='rbf', class_weight='balanced')

# Method 2: Compute custom weights
classes = np.unique(y_train)
weights = compute_class_weight('balanced', classes=classes, y=y_train)
class_weight_dict = dict(zip(classes, weights))
svm = SVC(kernel='rbf', class_weight=class_weight_dict)
```

### Computational Considerations

| Aspect | Complexity | Notes |
|--------|------------|-------|
| Training | $O(n^2)$ to $O(n^3)$ | Depends on implementation |
| Prediction | $O(n_{sv} \cdot d)$ | Linear in support vectors |
| Memory | $O(n^2)$ | For kernel matrix |

**Tips for large datasets:**
1. Use `LinearSVC` for linear kernels (faster)
2. Use `SGDClassifier` with hinge loss for very large data
3. Consider kernel approximation (Nystrom, RBF sampler)
4. Subsample for hyperparameter tuning

```python
from sklearn.kernel_approximation import Nystroem, RBFSampler
from sklearn.linear_model import SGDClassifier
from sklearn.pipeline import make_pipeline

# Kernel approximation for scalability
kernel_approx = make_pipeline(
    StandardScaler(),
    Nystroem(kernel='rbf', gamma=0.1, n_components=300, random_state=42),
    SGDClassifier(loss='hinge', max_iter=1000, random_state=42)
)

kernel_approx.fit(X_train, y_train)
```

### Common Pitfalls

1. **Forgetting to scale features**: Always scale!
2. **Using default gamma**: `gamma='scale'` is usually better than `'auto'`
3. **Overfitting with RBF**: Small gamma or large C can lead to overfitting
4. **Ignoring training time**: SVM is slow for large datasets
5. **Not tuning C**: The default C=1 is rarely optimal

---

## Interview Questions

### Conceptual Questions

**Q1: What is the intuition behind SVMs?**

SVM finds the optimal hyperplane that maximizes the margin between classes. The margin is the distance between the hyperplane and the nearest data points (support vectors). A larger margin generally leads to better generalization because it provides a buffer zone for new, unseen data points.

**Q2: Why do we need the kernel trick?**

Real-world data is often not linearly separable. The kernel trick allows us to implicitly map data to a higher-dimensional feature space where linear separation is possible, without actually computing the transformation. This is computationally efficient because we only need inner products (kernel evaluations) in the high-dimensional space.

**Q3: What are support vectors and why are they important?**

Support vectors are the training points that lie on the margin boundaries (points where the constraint is active, i.e., $\alpha_i > 0$). They are important because:
- The decision boundary depends only on support vectors
- Removing non-support vectors does not change the solution
- The sparsity of support vectors makes prediction efficient

**Q4: Explain the role of the C parameter in soft-margin SVM.**

C is a regularization parameter that controls the trade-off between maximizing the margin and minimizing classification errors:
- Large C: Prioritizes correct classification, may overfit (small margin, few errors)
- Small C: Prioritizes large margin, may underfit (large margin, more errors)

**Q5: What is the difference between RBF and polynomial kernels?**

- **RBF (Gaussian)**: Measures similarity based on Euclidean distance. Has infinite-dimensional implicit feature space. Local influence (points far apart have kernel value near 0). Single hyperparameter gamma.
- **Polynomial**: Computes polynomial combinations of features. Finite-dimensional feature space. Global influence. Hyperparameters: degree, gamma, coef0.

RBF is more flexible and commonly used when the relationship is unknown. Polynomial is useful when the underlying relationship is known to be polynomial.

### Technical Questions

**Q6: Derive the dual formulation of SVM.**

Starting from the Lagrangian:
$$\mathcal{L}(\mathbf{w}, b, \boldsymbol{\alpha}) = \frac{1}{2}\|\mathbf{w}\|^2 - \sum_{i=1}^{n} \alpha_i [y_i(\mathbf{w}^T \mathbf{x}_i + b) - 1]$$

Take derivatives:
$$\frac{\partial \mathcal{L}}{\partial \mathbf{w}} = \mathbf{w} - \sum_i \alpha_i y_i \mathbf{x}_i = 0 \Rightarrow \mathbf{w} = \sum_i \alpha_i y_i \mathbf{x}_i$$
$$\frac{\partial \mathcal{L}}{\partial b} = -\sum_i \alpha_i y_i = 0$$

Substitute back to get the dual:
$$\max_{\boldsymbol{\alpha}} \sum_i \alpha_i - \frac{1}{2}\sum_{i,j} \alpha_i \alpha_j y_i y_j \mathbf{x}_i^T \mathbf{x}_j$$

**Q7: How does SMO solve the SVM optimization problem?**

SMO (Sequential Minimal Optimization) breaks the QP problem into minimal sub-problems:
1. Select two Lagrange multipliers that violate KKT conditions
2. Analytically solve for the optimal values while keeping others fixed
3. Update the two multipliers and the bias term
4. Repeat until convergence

This avoids expensive matrix operations and allows for efficient memory usage.

**Q8: How would you handle a multi-class classification problem with SVM?**

Two main approaches:
- **One-vs-One (OvO)**: Train $\frac{k(k-1)}{2}$ binary classifiers for k classes. Each classifier distinguishes one class from another. Prediction by voting.
- **One-vs-Rest (OvR)**: Train k binary classifiers, each distinguishing one class from all others. Prediction by highest score.

Scikit-learn uses OvO by default because it's faster (smaller subproblems), though OvR may give better probability estimates.

### Practical Questions

**Q9: When would you choose SVM over other algorithms?**

Choose SVM when:
- Data is high-dimensional (e.g., text classification)
- Sample size is small to medium
- Clear margin of separation exists
- You need a robust, well-regularized model
- Interpretability is less important than performance

Avoid SVM when:
- Dataset is very large (>100K samples)
- Features are noisy and numerous
- You need probability estimates (SVMs need Platt scaling)
- Training time is critical

**Q10: How do you tune SVM hyperparameters?**

Key hyperparameters and tuning strategy:
1. **C**: Try logarithmic scale (0.001, 0.01, 0.1, 1, 10, 100)
2. **gamma** (for RBF): Try 'scale', 'auto', and logarithmic values
3. **kernel**: Start with RBF; try linear for high-dimensional data

Use cross-validation with GridSearchCV or RandomizedSearchCV. For large datasets, use a subset for tuning.

**Q11: Why is feature scaling important for SVM?**

SVM uses distances (or inner products) between samples. If features have different scales, features with larger values dominate the distance calculation. For example, if feature A ranges 0-1 and feature B ranges 0-1000, feature B will dominate. Scaling ensures all features contribute equally to the decision boundary.

---

## Further Reading

### Foundational Papers

1. **Vapnik, V. (1995)**. "The Nature of Statistical Learning Theory" - The foundational text on SVM theory
2. **Cortes, C. & Vapnik, V. (1995)**. "Support-Vector Networks" - Original SVM paper
3. **Platt, J. (1998)**. "Sequential Minimal Optimization: A Fast Algorithm for Training Support Vector Machines" - SMO algorithm
4. **Scholkopf, B. & Smola, A. (2002)**. "Learning with Kernels" - Comprehensive treatment of kernel methods

### Books

- **"Pattern Recognition and Machine Learning"** by Christopher Bishop - Chapters on kernel methods
- **"The Elements of Statistical Learning"** by Hastie, Tibshirani, and Friedman - Practical perspective on SVMs
- **"Introduction to Statistical Learning"** by James et al. - Accessible introduction with R examples

### Online Resources

- **Scikit-learn SVM Documentation**: Comprehensive API reference and tutorials
- **Stanford CS229 Notes**: Andrew Ng's lecture notes on SVMs
- **LIBSVM**: Popular SVM library with practical guide

### Advanced Topics

- **Multiple Kernel Learning**: Combining multiple kernels
- **Structured SVMs**: For structured output prediction
- **Online SVMs**: For streaming data
- **Kernel PCA**: Dimensionality reduction with kernels
- **One-class SVM**: For anomaly detection

---

## Summary

Support Vector Machines represent a powerful and mathematically elegant approach to supervised learning. Key takeaways:

1. **Core Principle**: Find the maximum margin hyperplane that separates classes
2. **Support Vectors**: Only a subset of training points (those on the margin) determine the decision boundary
3. **Kernel Trick**: Handle non-linear data by implicitly mapping to higher dimensions
4. **Soft Margin**: Allow some misclassifications for better generalization (controlled by C)
5. **Practical Usage**: Always scale features, tune C and gamma, use cross-validation

SVMs remain relevant despite the deep learning revolution, particularly for:
- Small to medium datasets
- High-dimensional sparse data (text, genomics)
- Problems requiring strong theoretical guarantees
- Situations where interpretability and robustness matter

Understanding SVM principles also provides a foundation for more advanced kernel methods and helps develop intuition for optimization and regularization in machine learning.
