---
title: 机器学习数学基础：优化理论
description: 掌握机器学习优化核心：凸优化、梯度下降变种和约束优化
track: datascience
section: statistics
difficulty: advanced
tags:
  - 优化
  - 梯度下降
  - 凸优化
  - 数学
status: imported
origin: old/src/content/docs/datascience/optimization-theory.en.md
divergence: 0.157
issues:
  - title-lang-en
  - title-language
legacy:
  category: DataScience
  subcategory: Math
  order: 3
  lastUpdated: 2026-01-07
---

Optimization theory is the mathematical cornerstone of machine learning. Whether training neural networks, fitting regression models, or tuning hyperparameters, the essence is solving optimization problems. This article covers convex optimization theory, various gradient descent algorithms and their variants, learning rate scheduling strategies, and constrained optimization methods.

---

## Fundamentals of Optimization Problems

### What is an Optimization Problem

The general form of an optimization problem is:

$$\min_{x \in \mathcal{X}} f(x)$$

Where:
- $f(x)$ is the **objective function**
- $x$ is the **decision variable**
- $\mathcal{X}$ is the **feasible region**

In machine learning, the objective function is typically a loss function, and the decision variables are model parameters.

### Classification of Optimization Problems

| Classification Dimension | Type | Characteristics |
|--------------------------|------|-----------------|
| Constraints | Unconstrained Optimization | No additional restrictions |
|             | Constrained Optimization | Has equality or inequality constraints |
| Objective Function Properties | Convex Optimization | Local optimum equals global optimum |
|                               | Non-convex Optimization | May have multiple local optima |
| Variable Type | Continuous Optimization | Variables take real values |
|               | Discrete Optimization | Variables take discrete values |

### Optimization Problems in Machine Learning

**Least Squares Problem in Linear Regression:**

$$\min_{\mathbf{w}} \frac{1}{2n}\|\mathbf{Xw} - \mathbf{y}\|_2^2$$

**Cross-Entropy Loss in Logistic Regression:**

$$\min_{\mathbf{w}} -\frac{1}{n}\sum_{i=1}^{n}[y_i\log(\sigma(\mathbf{w}^T\mathbf{x}_i)) + (1-y_i)\log(1-\sigma(\mathbf{w}^T\mathbf{x}_i))]$$

**Loss Function in Neural Networks:**

$$\min_{\theta} \mathcal{L}(\theta) = \frac{1}{n}\sum_{i=1}^{n} \ell(f_\theta(\mathbf{x}_i), y_i) + \lambda R(\theta)$$

---

## Convex Functions and Convex Optimization

### Definition of Convex Sets

A set $C$ is convex if and only if for any $x, y \in C$ and $\theta \in [0, 1]$:

$$\theta x + (1-\theta)y \in C$$

Intuitive understanding: The line segment connecting any two points in the set lies entirely within the set.

```python
import numpy as np
import matplotlib.pyplot as plt

def visualize_convex_set():
    """Visualize convex and non-convex sets"""
    fig, axes = plt.subplots(1, 2, figsize=(12, 5))

    # Convex set: circle
    theta = np.linspace(0, 2*np.pi, 100)
    x_circle = np.cos(theta)
    y_circle = np.sin(theta)

    axes[0].fill(x_circle, y_circle, alpha=0.3, color='blue')
    axes[0].plot(x_circle, y_circle, 'b-', linewidth=2)
    # Show that any line segment between two points is within the set
    axes[0].plot([-0.5, 0.7], [0.3, -0.4], 'r-', linewidth=2, label='Any line segment')
    axes[0].scatter([-0.5, 0.7], [0.3, -0.4], color='red', s=100, zorder=5)
    axes[0].set_title('Convex Set Example (Circle)', fontsize=14)
    axes[0].set_aspect('equal')
    axes[0].legend()

    # Non-convex set: star shape
    angles = np.linspace(0, 2*np.pi, 11)[:-1]
    radii = np.array([1, 0.4, 1, 0.4, 1, 0.4, 1, 0.4, 1, 0.4])
    x_star = radii * np.cos(angles)
    y_star = radii * np.sin(angles)

    axes[1].fill(x_star, y_star, alpha=0.3, color='orange')
    axes[1].plot(np.append(x_star, x_star[0]),
                 np.append(y_star, y_star[0]), 'orange', linewidth=2)
    # Show that line segment may be outside the set
    axes[1].plot([-0.8, 0.8], [0.3, 0.3], 'r--', linewidth=2, label='Line segment (partially outside)')
    axes[1].scatter([-0.8, 0.8], [0.3, 0.3], color='red', s=100, zorder=5)
    axes[1].set_title('Non-convex Set Example (Star)', fontsize=14)
    axes[1].set_aspect('equal')
    axes[1].legend()

    plt.tight_layout()
    plt.savefig('convex_sets.png', dpi=150, bbox_inches='tight')
    plt.show()
```

### Definition of Convex Functions

A function $f: \mathbb{R}^n \rightarrow \mathbb{R}$ is convex if and only if for any $x, y$ and $\theta \in [0, 1]$:

$$f(\theta x + (1-\theta)y) \leq \theta f(x) + (1-\theta)f(y)$$

**Geometric meaning**: The line segment connecting any two points on the function graph lies above (or coincides with) the function graph.

**Strictly convex function**: The above inequality holds strictly ($<$), guaranteeing a unique global optimum.

### Conditions for Convexity

**First-order condition** (for differentiable functions):

A function $f$ is convex if and only if for all $x, y$:

$$f(y) \geq f(x) + \nabla f(x)^T(y - x)$$

**Second-order condition** (for twice differentiable functions):

A function $f$ is convex if and only if the Hessian matrix is positive semi-definite:

$$\nabla^2 f(x) \succeq 0, \quad \forall x$$

```python
import numpy as np
from numpy.linalg import eigvals

def is_convex_function(hessian_func, x_samples):
    """
    Determine convexity by checking positive semi-definiteness of Hessian

    Parameters:
        hessian_func: function that returns the Hessian matrix
        x_samples: list of sample points

    Returns:
        bool: whether the function is convex
    """
    for x in x_samples:
        H = hessian_func(x)
        eigenvalues = eigvals(H)
        if np.any(eigenvalues < -1e-10):  # numerical tolerance
            return False
    return True

# Example: quadratic function f(x) = x^T A x + b^T x + c
def quadratic_hessian(A):
    """The Hessian of a quadratic function is 2A"""
    return lambda x: 2 * A

# Positive definite matrix -> convex function
A_convex = np.array([[2, 0], [0, 3]])
print(f"Positive definite case: eigenvalues = {eigvals(2*A_convex)}")  # all positive

# Indefinite matrix -> non-convex function
A_nonconvex = np.array([[2, 0], [0, -1]])
print(f"Indefinite case: eigenvalues = {eigvals(2*A_nonconvex)}")  # some positive, some negative
```

### Common Convex Functions

| Function | Expression | Notes |
|----------|------------|-------|
| Linear function | $f(x) = a^Tx + b$ | Both convex and concave |
| Quadratic function | $f(x) = x^TAx + b^Tx + c$ | Convex when $A \succeq 0$ |
| Exponential function | $f(x) = e^{ax}$ | Convex for any $a$ |
| Negative logarithm | $f(x) = -\log x$ | $x > 0$ |
| Norms | $f(x) = \|x\|_p$ | For any $p \geq 1$ |
| Log-Sum-Exp | $f(x) = \log(\sum_i e^{x_i})$ | Log-Sum-Exp |

### Properties of Convex Optimization Problems

**Core theorem**: Any local optimum of a convex optimization problem is also a global optimum.

This is why convex optimization is so important in machine learning:
- Linear regression, logistic regression, SVM, etc. are all convex optimization problems
- Efficient convex optimization algorithms can be used to solve them
- The solution found is guaranteed to be optimal

```python
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

def visualize_convex_vs_nonconvex():
    """Visualize the optimization landscape of convex vs non-convex functions"""
    fig = plt.figure(figsize=(14, 5))

    x = np.linspace(-3, 3, 100)
    y = np.linspace(-3, 3, 100)
    X, Y = np.meshgrid(x, y)

    # Convex function: quadratic
    Z_convex = X**2 + Y**2

    ax1 = fig.add_subplot(121, projection='3d')
    ax1.plot_surface(X, Y, Z_convex, cmap='viridis', alpha=0.8)
    ax1.set_title('Convex Function: $f(x,y) = x^2 + y^2$\nUnique Global Optimum', fontsize=12)
    ax1.set_xlabel('x')
    ax1.set_ylabel('y')
    ax1.set_zlabel('f(x,y)')

    # Non-convex function: Rastrigin function
    A = 10
    Z_nonconvex = A*2 + (X**2 - A*np.cos(2*np.pi*X)) + (Y**2 - A*np.cos(2*np.pi*Y))

    ax2 = fig.add_subplot(122, projection='3d')
    ax2.plot_surface(X, Y, Z_nonconvex, cmap='plasma', alpha=0.8)
    ax2.set_title('Non-convex Function: Rastrigin Function\nMultiple Local Optima', fontsize=12)
    ax2.set_xlabel('x')
    ax2.set_ylabel('y')
    ax2.set_zlabel('f(x,y)')

    plt.tight_layout()
    plt.savefig('convex_vs_nonconvex.png', dpi=150, bbox_inches='tight')
    plt.show()
```

---

## Gradient Descent

### Basic Principle

Gradient descent is the most fundamental first-order optimization algorithm. The core idea is: iteratively update parameters in the direction opposite to the gradient of the objective function.

**Update rule:**

$$\theta_{t+1} = \theta_t - \eta \nabla f(\theta_t)$$

Where:
- $\theta_t$ is the parameter at iteration $t$
- $\eta$ is the learning rate (step size)
- $\nabla f(\theta_t)$ is the gradient of the objective function at $\theta_t$

### Intuitive Understanding of Gradient Descent

The gradient $\nabla f(x)$ points in the direction of steepest ascent, so the negative gradient direction is the direction of steepest descent.

```python
import numpy as np
import matplotlib.pyplot as plt

def gradient_descent_visualization():
    """Visualize the gradient descent process"""
    # Objective function: f(x, y) = x^2 + 2y^2
    def f(x, y):
        return x**2 + 2*y**2

    def grad_f(x, y):
        return np.array([2*x, 4*y])

    # Gradient descent
    def gradient_descent(start, lr=0.1, n_iters=20):
        path = [start.copy()]
        point = start.copy()

        for _ in range(n_iters):
            grad = grad_f(point[0], point[1])
            point = point - lr * grad
            path.append(point.copy())

        return np.array(path)

    # Visualization
    fig, ax = plt.subplots(figsize=(10, 8))

    # Contour plot
    x = np.linspace(-3, 3, 100)
    y = np.linspace(-3, 3, 100)
    X, Y = np.meshgrid(x, y)
    Z = f(X, Y)

    contours = ax.contour(X, Y, Z, levels=20, cmap='viridis')
    ax.clabel(contours, inline=True, fontsize=8)

    # Gradient descent path
    start = np.array([2.5, 2.0])
    path = gradient_descent(start, lr=0.15, n_iters=15)

    ax.plot(path[:, 0], path[:, 1], 'ro-', markersize=8, linewidth=2,
            label='Gradient descent path')
    ax.plot(start[0], start[1], 'g^', markersize=15, label='Starting point')
    ax.plot(0, 0, 'b*', markersize=20, label='Optimal point')

    ax.set_xlabel('x', fontsize=12)
    ax.set_ylabel('y', fontsize=12)
    ax.set_title('Gradient Descent Visualization: $f(x,y) = x^2 + 2y^2$', fontsize=14)
    ax.legend(fontsize=10)
    ax.set_aspect('equal')

    plt.savefig('gradient_descent.png', dpi=150, bbox_inches='tight')
    plt.show()

    return path
```

### Batch Gradient Descent

Computes the gradient using all training data:

$$\theta_{t+1} = \theta_t - \eta \frac{1}{n}\sum_{i=1}^{n}\nabla_\theta \ell(f_\theta(x_i), y_i)$$

**Advantages:**
- Accurate gradient estimation
- Stable convergence

**Disadvantages:**
- High computational cost (requires traversing all data per iteration)
- Not suitable for large-scale datasets
- Difficult to escape saddle points

```python
import numpy as np

class BatchGradientDescent:
    """Batch gradient descent implementation"""

    def __init__(self, learning_rate=0.01, max_iters=1000, tol=1e-6):
        self.lr = learning_rate
        self.max_iters = max_iters
        self.tol = tol
        self.history = {'loss': [], 'params': []}

    def fit(self, X, y, loss_func, grad_func, init_params):
        """
        Parameters:
            X: feature matrix (n_samples, n_features)
            y: label vector (n_samples,)
            loss_func: loss function loss_func(params, X, y)
            grad_func: gradient function grad_func(params, X, y)
            init_params: initial parameters
        """
        params = init_params.copy()
        n_samples = X.shape[0]

        for i in range(self.max_iters):
            # Compute full batch gradient
            gradient = grad_func(params, X, y)

            # Update parameters
            params = params - self.lr * gradient

            # Record history
            loss = loss_func(params, X, y)
            self.history['loss'].append(loss)
            self.history['params'].append(params.copy())

            # Convergence check
            if np.linalg.norm(gradient) < self.tol:
                print(f"Converged at iteration {i+1}")
                break

        return params

# Example: linear regression
def mse_loss(w, X, y):
    predictions = X @ w
    return np.mean((predictions - y) ** 2)

def mse_gradient(w, X, y):
    predictions = X @ w
    return 2 * X.T @ (predictions - y) / len(y)

# Generate data
np.random.seed(42)
X = np.column_stack([np.ones(100), np.random.randn(100, 2)])
true_w = np.array([1, 2, -1])
y = X @ true_w + 0.1 * np.random.randn(100)

# Train
bgd = BatchGradientDescent(learning_rate=0.1, max_iters=100)
init_w = np.zeros(3)
final_w = bgd.fit(X, y, mse_loss, mse_gradient, init_w)

print(f"True parameters: {true_w}")
print(f"Learned parameters: {final_w}")
```

### Convergence Analysis

For $L$-smooth convex functions (gradients satisfy Lipschitz condition), the convergence rate of batch gradient descent is:

$$f(\theta_t) - f(\theta^*) \leq \frac{L\|\theta_0 - \theta^*\|^2}{2t}$$

This means the convergence rate is $O(1/t)$, requiring $O(1/\epsilon)$ iterations to achieve $\epsilon$ accuracy.

---

## Stochastic Gradient Descent (SGD)

### Basic Idea

Each iteration uses only one sample (or a small batch of samples) to estimate the gradient:

$$\theta_{t+1} = \theta_t - \eta \nabla_\theta \ell(f_\theta(x_i), y_i)$$

Where $i$ is a randomly selected sample index.

### Mini-batch Stochastic Gradient Descent

The most commonly used form in practice, using a mini-batch to estimate the gradient:

$$\theta_{t+1} = \theta_t - \eta \frac{1}{|B|}\sum_{i \in B}\nabla_\theta \ell(f_\theta(x_i), y_i)$$

Where $B$ is a randomly sampled batch.

```python
import numpy as np

class MiniBatchSGD:
    """Mini-batch stochastic gradient descent implementation"""

    def __init__(self, learning_rate=0.01, batch_size=32,
                 max_epochs=100, shuffle=True):
        self.lr = learning_rate
        self.batch_size = batch_size
        self.max_epochs = max_epochs
        self.shuffle = shuffle
        self.history = {'loss': [], 'epoch_loss': []}

    def fit(self, X, y, loss_func, grad_func, init_params):
        params = init_params.copy()
        n_samples = X.shape[0]

        for epoch in range(self.max_epochs):
            # Shuffle data
            if self.shuffle:
                indices = np.random.permutation(n_samples)
                X_shuffled = X[indices]
                y_shuffled = y[indices]
            else:
                X_shuffled, y_shuffled = X, y

            epoch_losses = []

            # Iterate through all batches
            for start_idx in range(0, n_samples, self.batch_size):
                end_idx = min(start_idx + self.batch_size, n_samples)
                X_batch = X_shuffled[start_idx:end_idx]
                y_batch = y_shuffled[start_idx:end_idx]

                # Compute mini-batch gradient
                gradient = grad_func(params, X_batch, y_batch)

                # Update parameters
                params = params - self.lr * gradient

                # Record loss
                batch_loss = loss_func(params, X_batch, y_batch)
                self.history['loss'].append(batch_loss)
                epoch_losses.append(batch_loss)

            # Record average loss per epoch
            avg_epoch_loss = np.mean(epoch_losses)
            self.history['epoch_loss'].append(avg_epoch_loss)

            if (epoch + 1) % 10 == 0:
                print(f"Epoch {epoch+1}/{self.max_epochs}, Loss: {avg_epoch_loss:.6f}")

        return params

# Compare batch GD and mini-batch SGD
def compare_optimizers():
    np.random.seed(42)
    n_samples = 1000
    X = np.column_stack([np.ones(n_samples), np.random.randn(n_samples, 5)])
    true_w = np.array([1, 2, -1, 0.5, -0.3, 1.5])
    y = X @ true_w + 0.1 * np.random.randn(n_samples)

    init_w = np.zeros(6)

    # Batch GD
    bgd = BatchGradientDescent(learning_rate=0.01, max_iters=100)
    w_bgd = bgd.fit(X, y, mse_loss, mse_gradient, init_w.copy())

    # Mini-batch SGD
    sgd = MiniBatchSGD(learning_rate=0.01, batch_size=32, max_epochs=100)
    w_sgd = sgd.fit(X, y, mse_loss, mse_gradient, init_w.copy())

    print(f"\nTrue parameters: {true_w}")
    print(f"Batch GD result: {w_bgd}")
    print(f"SGD result: {w_sgd}")
```

### Advantages and Disadvantages of SGD

**Advantages:**
- High computational efficiency, suitable for large-scale data
- Randomness helps escape local optima and saddle points
- Supports online learning

**Disadvantages:**
- Oscillating convergence path
- Requires careful learning rate tuning
- Noisy gradient estimates

### Convergence of SGD

For convex functions, with appropriate learning rate decay (such as $\eta_t = O(1/\sqrt{t})$), the expected convergence rate of SGD is:

$$\mathbb{E}[f(\bar{\theta}_T)] - f(\theta^*) \leq O\left(\frac{1}{\sqrt{T}}\right)$$

---

## Momentum Methods

### Momentum

Momentum accelerates convergence and reduces oscillation by accumulating historical gradient information.

**Update rule:**

$$v_t = \gamma v_{t-1} + \eta \nabla f(\theta_t)$$
$$\theta_{t+1} = \theta_t - v_t$$

Where $\gamma$ (typically 0.9) is the momentum coefficient.

**Intuitive understanding**: Like a ball rolling on the loss function surface, accumulating velocity.

```python
import numpy as np

class MomentumSGD:
    """SGD with momentum implementation"""

    def __init__(self, learning_rate=0.01, momentum=0.9,
                 batch_size=32, max_epochs=100):
        self.lr = learning_rate
        self.momentum = momentum
        self.batch_size = batch_size
        self.max_epochs = max_epochs
        self.history = {'loss': []}

    def fit(self, X, y, loss_func, grad_func, init_params):
        params = init_params.copy()
        velocity = np.zeros_like(params)
        n_samples = X.shape[0]

        for epoch in range(self.max_epochs):
            indices = np.random.permutation(n_samples)
            X_shuffled = X[indices]
            y_shuffled = y[indices]

            for start_idx in range(0, n_samples, self.batch_size):
                end_idx = min(start_idx + self.batch_size, n_samples)
                X_batch = X_shuffled[start_idx:end_idx]
                y_batch = y_shuffled[start_idx:end_idx]

                gradient = grad_func(params, X_batch, y_batch)

                # Momentum update
                velocity = self.momentum * velocity + self.lr * gradient
                params = params - velocity

                loss = loss_func(params, X_batch, y_batch)
                self.history['loss'].append(loss)

        return params
```

### Nesterov Accelerated Gradient (NAG)

Nesterov momentum is an improved version of momentum that first "predicts" the next position based on momentum, then computes the gradient.

**Update rule:**

$$v_t = \gamma v_{t-1} + \eta \nabla f(\theta_t - \gamma v_{t-1})$$
$$\theta_{t+1} = \theta_t - v_t$$

**Advantages**: Faster convergence, less oscillation.

```python
class NesterovMomentum:
    """Nesterov accelerated gradient implementation"""

    def __init__(self, learning_rate=0.01, momentum=0.9,
                 batch_size=32, max_epochs=100):
        self.lr = learning_rate
        self.momentum = momentum
        self.batch_size = batch_size
        self.max_epochs = max_epochs
        self.history = {'loss': []}

    def fit(self, X, y, loss_func, grad_func, init_params):
        params = init_params.copy()
        velocity = np.zeros_like(params)
        n_samples = X.shape[0]

        for epoch in range(self.max_epochs):
            indices = np.random.permutation(n_samples)

            for start_idx in range(0, n_samples, self.batch_size):
                end_idx = min(start_idx + self.batch_size, n_samples)
                X_batch = X[indices[start_idx:end_idx]]
                y_batch = y[indices[start_idx:end_idx]]

                # Nesterov: look ahead first, then compute gradient
                params_lookahead = params - self.momentum * velocity
                gradient = grad_func(params_lookahead, X_batch, y_batch)

                velocity = self.momentum * velocity + self.lr * gradient
                params = params - velocity

                self.history['loss'].append(loss_func(params, X_batch, y_batch))

        return params
```

### Momentum Visualization

```python
def visualize_momentum_effect():
    """Visualize the effect of momentum on optimization path"""
    # Rosenbrock function (non-convex, has narrow valley)
    def rosenbrock(x, y):
        return (1 - x)**2 + 100 * (y - x**2)**2

    def rosenbrock_grad(point):
        x, y = point
        dx = -2*(1-x) - 400*x*(y - x**2)
        dy = 200*(y - x**2)
        return np.array([dx, dy])

    # SGD (without momentum)
    def sgd_path(start, lr=0.0001, n_iters=500):
        path = [start.copy()]
        point = start.copy()
        for _ in range(n_iters):
            grad = rosenbrock_grad(point)
            point = point - lr * grad
            path.append(point.copy())
        return np.array(path)

    # SGD with Momentum
    def momentum_path(start, lr=0.0001, momentum=0.9, n_iters=500):
        path = [start.copy()]
        point = start.copy()
        velocity = np.zeros(2)
        for _ in range(n_iters):
            grad = rosenbrock_grad(point)
            velocity = momentum * velocity + lr * grad
            point = point - velocity
            path.append(point.copy())
        return np.array(path)

    # Visualization
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))

    x = np.linspace(-2, 2, 200)
    y = np.linspace(-1, 3, 200)
    X, Y = np.meshgrid(x, y)
    Z = rosenbrock(X, Y)

    start = np.array([-1.5, 2.0])

    for ax, optimizer, title in [
        (axes[0], sgd_path, 'SGD (without momentum)'),
        (axes[1], momentum_path, 'SGD + Momentum')
    ]:
        ax.contour(X, Y, Z, levels=np.logspace(-1, 3, 20), cmap='viridis')
        path = optimizer(start)
        ax.plot(path[:, 0], path[:, 1], 'r.-', markersize=2, linewidth=1,
                label=f'Optimization path ({len(path)} steps)')
        ax.plot(start[0], start[1], 'go', markersize=10, label='Start')
        ax.plot(1, 1, 'b*', markersize=15, label='Optimal point (1,1)')
        ax.set_title(title, fontsize=14)
        ax.legend()
        ax.set_xlabel('x')
        ax.set_ylabel('y')

    plt.tight_layout()
    plt.savefig('momentum_comparison.png', dpi=150, bbox_inches='tight')
    plt.show()
```

---

## Adaptive Learning Rate Methods

### AdaGrad

Adaptively adjusts the learning rate for each parameter, using smaller learning rates for frequently updated parameters.

**Update rule:**

$$G_t = G_{t-1} + g_t^2$$
$$\theta_{t+1} = \theta_t - \frac{\eta}{\sqrt{G_t + \epsilon}} \odot g_t$$

Where $g_t = \nabla f(\theta_t)$, and $\epsilon$ is a small constant to prevent division by zero.

**Problem**: $G_t$ increases monotonically, causing the learning rate to gradually approach zero.

```python
class AdaGrad:
    """AdaGrad optimizer implementation"""

    def __init__(self, learning_rate=0.01, epsilon=1e-8,
                 batch_size=32, max_epochs=100):
        self.lr = learning_rate
        self.epsilon = epsilon
        self.batch_size = batch_size
        self.max_epochs = max_epochs
        self.history = {'loss': []}

    def fit(self, X, y, loss_func, grad_func, init_params):
        params = init_params.copy()
        G = np.zeros_like(params)  # accumulated squared gradients
        n_samples = X.shape[0]

        for epoch in range(self.max_epochs):
            indices = np.random.permutation(n_samples)

            for start_idx in range(0, n_samples, self.batch_size):
                end_idx = min(start_idx + self.batch_size, n_samples)
                X_batch = X[indices[start_idx:end_idx]]
                y_batch = y[indices[start_idx:end_idx]]

                gradient = grad_func(params, X_batch, y_batch)

                # AdaGrad update
                G = G + gradient ** 2
                adjusted_lr = self.lr / (np.sqrt(G) + self.epsilon)
                params = params - adjusted_lr * gradient

                self.history['loss'].append(loss_func(params, X_batch, y_batch))

        return params
```

### RMSprop

Solves AdaGrad's problem of learning rate decaying too fast by using exponential moving average.

**Update rule:**

$$G_t = \gamma G_{t-1} + (1-\gamma) g_t^2$$
$$\theta_{t+1} = \theta_t - \frac{\eta}{\sqrt{G_t + \epsilon}} g_t$$

Typically $\gamma = 0.9$.

```python
class RMSprop:
    """RMSprop optimizer implementation"""

    def __init__(self, learning_rate=0.001, decay_rate=0.9,
                 epsilon=1e-8, batch_size=32, max_epochs=100):
        self.lr = learning_rate
        self.decay_rate = decay_rate
        self.epsilon = epsilon
        self.batch_size = batch_size
        self.max_epochs = max_epochs
        self.history = {'loss': []}

    def fit(self, X, y, loss_func, grad_func, init_params):
        params = init_params.copy()
        G = np.zeros_like(params)  # moving average of squared gradients
        n_samples = X.shape[0]

        for epoch in range(self.max_epochs):
            indices = np.random.permutation(n_samples)

            for start_idx in range(0, n_samples, self.batch_size):
                end_idx = min(start_idx + self.batch_size, n_samples)
                X_batch = X[indices[start_idx:end_idx]]
                y_batch = y[indices[start_idx:end_idx]]

                gradient = grad_func(params, X_batch, y_batch)

                # RMSprop update
                G = self.decay_rate * G + (1 - self.decay_rate) * gradient ** 2
                adjusted_lr = self.lr / (np.sqrt(G) + self.epsilon)
                params = params - adjusted_lr * gradient

                self.history['loss'].append(loss_func(params, X_batch, y_batch))

        return params
```

### Adam

Adam (Adaptive Moment Estimation) combines the advantages of momentum and RMSprop.

**Update rule:**

$$m_t = \beta_1 m_{t-1} + (1 - \beta_1) g_t$$
$$v_t = \beta_2 v_{t-1} + (1 - \beta_2) g_t^2$$

**Bias correction** (important!):

$$\hat{m}_t = \frac{m_t}{1 - \beta_1^t}$$
$$\hat{v}_t = \frac{v_t}{1 - \beta_2^t}$$

**Parameter update:**

$$\theta_{t+1} = \theta_t - \frac{\eta}{\sqrt{\hat{v}_t} + \epsilon} \hat{m}_t$$

**Default hyperparameters**: $\beta_1 = 0.9$, $\beta_2 = 0.999$, $\epsilon = 10^{-8}$.

```python
class Adam:
    """Adam optimizer implementation"""

    def __init__(self, learning_rate=0.001, beta1=0.9, beta2=0.999,
                 epsilon=1e-8, batch_size=32, max_epochs=100):
        self.lr = learning_rate
        self.beta1 = beta1
        self.beta2 = beta2
        self.epsilon = epsilon
        self.batch_size = batch_size
        self.max_epochs = max_epochs
        self.history = {'loss': []}

    def fit(self, X, y, loss_func, grad_func, init_params):
        params = init_params.copy()
        m = np.zeros_like(params)  # first moment estimate
        v = np.zeros_like(params)  # second moment estimate
        t = 0
        n_samples = X.shape[0]

        for epoch in range(self.max_epochs):
            indices = np.random.permutation(n_samples)

            for start_idx in range(0, n_samples, self.batch_size):
                t += 1
                end_idx = min(start_idx + self.batch_size, n_samples)
                X_batch = X[indices[start_idx:end_idx]]
                y_batch = y[indices[start_idx:end_idx]]

                gradient = grad_func(params, X_batch, y_batch)

                # Update first and second moment estimates
                m = self.beta1 * m + (1 - self.beta1) * gradient
                v = self.beta2 * v + (1 - self.beta2) * gradient ** 2

                # Bias correction
                m_hat = m / (1 - self.beta1 ** t)
                v_hat = v / (1 - self.beta2 ** t)

                # Parameter update
                params = params - self.lr * m_hat / (np.sqrt(v_hat) + self.epsilon)

                self.history['loss'].append(loss_func(params, X_batch, y_batch))

        return params
```

### AdamW

AdamW decouples weight decay, making it the preferred optimizer for training large models like Transformers.

**Difference from Adam**: Weight decay acts directly on parameters rather than being added to the loss function as L2 regularization.

$$\theta_{t+1} = \theta_t - \eta\left(\frac{\hat{m}_t}{\sqrt{\hat{v}_t} + \epsilon} + \lambda \theta_t\right)$$

```python
class AdamW:
    """AdamW optimizer implementation"""

    def __init__(self, learning_rate=0.001, beta1=0.9, beta2=0.999,
                 epsilon=1e-8, weight_decay=0.01, batch_size=32, max_epochs=100):
        self.lr = learning_rate
        self.beta1 = beta1
        self.beta2 = beta2
        self.epsilon = epsilon
        self.weight_decay = weight_decay
        self.batch_size = batch_size
        self.max_epochs = max_epochs
        self.history = {'loss': []}

    def fit(self, X, y, loss_func, grad_func, init_params):
        params = init_params.copy()
        m = np.zeros_like(params)
        v = np.zeros_like(params)
        t = 0
        n_samples = X.shape[0]

        for epoch in range(self.max_epochs):
            indices = np.random.permutation(n_samples)

            for start_idx in range(0, n_samples, self.batch_size):
                t += 1
                end_idx = min(start_idx + self.batch_size, n_samples)
                X_batch = X[indices[start_idx:end_idx]]
                y_batch = y[indices[start_idx:end_idx]]

                gradient = grad_func(params, X_batch, y_batch)

                # Adam part
                m = self.beta1 * m + (1 - self.beta1) * gradient
                v = self.beta2 * v + (1 - self.beta2) * gradient ** 2

                m_hat = m / (1 - self.beta1 ** t)
                v_hat = v / (1 - self.beta2 ** t)

                # AdamW: decoupled weight decay
                adam_update = m_hat / (np.sqrt(v_hat) + self.epsilon)
                params = params - self.lr * (adam_update + self.weight_decay * params)

                self.history['loss'].append(loss_func(params, X_batch, y_batch))

        return params
```

### Optimizer Comparison

| Optimizer | Advantages | Disadvantages | Use Cases |
|-----------|------------|---------------|-----------|
| SGD | Simple, good generalization | Slow convergence, needs tuning | Computer vision |
| SGD+Momentum | Accelerates convergence | May overshoot optimum | General purpose |
| AdaGrad | Adaptive learning rate | Learning rate tends to zero | Sparse features |
| RMSprop | Solves AdaGrad problem | May be unstable | RNN |
| Adam | Fast convergence, robust | May have poor generalization | Default choice |
| AdamW | Better regularization | Needs weight_decay tuning | Transformer |

```python
def compare_optimizers_visual():
    """Visually compare different optimizers"""
    import matplotlib.pyplot as plt

    # Generate data
    np.random.seed(42)
    n = 500
    X = np.column_stack([np.ones(n), np.random.randn(n, 3)])
    true_w = np.array([1, 2, -1, 0.5])
    y = X @ true_w + 0.1 * np.random.randn(n)
    init_w = np.zeros(4)

    optimizers = {
        'SGD': MiniBatchSGD(learning_rate=0.01, batch_size=32, max_epochs=50),
        'Momentum': MomentumSGD(learning_rate=0.01, momentum=0.9, batch_size=32, max_epochs=50),
        'RMSprop': RMSprop(learning_rate=0.01, batch_size=32, max_epochs=50),
        'Adam': Adam(learning_rate=0.01, batch_size=32, max_epochs=50),
    }

    fig, ax = plt.subplots(figsize=(12, 6))

    for name, optimizer in optimizers.items():
        optimizer.fit(X, y, mse_loss, mse_gradient, init_w.copy())

        # Smooth loss curve
        losses = optimizer.history['loss']
        window = 50
        smoothed = np.convolve(losses, np.ones(window)/window, mode='valid')
        ax.plot(smoothed, label=name, linewidth=2)

    ax.set_xlabel('Iteration', fontsize=12)
    ax.set_ylabel('Loss', fontsize=12)
    ax.set_title('Convergence Comparison of Different Optimizers', fontsize=14)
    ax.legend(fontsize=10)
    ax.set_yscale('log')
    ax.grid(True, alpha=0.3)

    plt.savefig('optimizer_comparison.png', dpi=150, bbox_inches='tight')
    plt.show()
```

---

## Learning Rate Scheduling

### Why Learning Rate Scheduling is Needed

- **Early stage**: Larger learning rate helps explore quickly
- **Later stage**: Smaller learning rate helps fine-tune

### Common Scheduling Strategies

#### Step Decay

Multiply learning rate by decay factor every fixed number of steps:

$$\eta_t = \eta_0 \times \gamma^{\lfloor t / s \rfloor}$$

```python
class StepLRScheduler:
    """Step learning rate scheduler"""

    def __init__(self, initial_lr, step_size, gamma=0.1):
        self.initial_lr = initial_lr
        self.step_size = step_size
        self.gamma = gamma

    def get_lr(self, epoch):
        return self.initial_lr * (self.gamma ** (epoch // self.step_size))

# Example
scheduler = StepLRScheduler(initial_lr=0.1, step_size=30, gamma=0.1)
for epoch in [0, 29, 30, 59, 60]:
    print(f"Epoch {epoch}: lr = {scheduler.get_lr(epoch):.4f}")
```

#### Exponential Decay

$$\eta_t = \eta_0 \times \gamma^t$$

```python
class ExponentialLRScheduler:
    """Exponential learning rate scheduler"""

    def __init__(self, initial_lr, gamma=0.95):
        self.initial_lr = initial_lr
        self.gamma = gamma

    def get_lr(self, epoch):
        return self.initial_lr * (self.gamma ** epoch)
```

#### Cosine Annealing

$$\eta_t = \eta_{min} + \frac{1}{2}(\eta_{max} - \eta_{min})\left(1 + \cos\left(\frac{t}{T}\pi\right)\right)$$

```python
import numpy as np

class CosineAnnealingScheduler:
    """Cosine annealing learning rate scheduler"""

    def __init__(self, initial_lr, T_max, eta_min=0):
        self.initial_lr = initial_lr
        self.T_max = T_max
        self.eta_min = eta_min

    def get_lr(self, epoch):
        return self.eta_min + 0.5 * (self.initial_lr - self.eta_min) * \
               (1 + np.cos(np.pi * epoch / self.T_max))
```

#### Cosine Annealing with Warm Restarts

Periodically resets the learning rate, helping escape local optima.

```python
class CosineAnnealingWarmRestarts:
    """Cosine annealing with warm restarts"""

    def __init__(self, initial_lr, T_0, T_mult=1, eta_min=0):
        self.initial_lr = initial_lr
        self.T_0 = T_0
        self.T_mult = T_mult
        self.eta_min = eta_min

    def get_lr(self, epoch):
        T_cur = epoch
        T_i = self.T_0

        # Find current cycle
        while T_cur >= T_i:
            T_cur -= T_i
            T_i *= self.T_mult

        return self.eta_min + 0.5 * (self.initial_lr - self.eta_min) * \
               (1 + np.cos(np.pi * T_cur / T_i))
```

#### Learning Rate Warmup

Start from a very small learning rate and gradually increase to the target learning rate.

```python
class WarmupScheduler:
    """Learning rate warmup scheduler"""

    def __init__(self, target_lr, warmup_epochs, total_epochs):
        self.target_lr = target_lr
        self.warmup_epochs = warmup_epochs
        self.total_epochs = total_epochs

    def get_lr(self, epoch):
        if epoch < self.warmup_epochs:
            # Linear warmup
            return self.target_lr * (epoch + 1) / self.warmup_epochs
        else:
            # Cosine annealing after warmup
            progress = (epoch - self.warmup_epochs) / (self.total_epochs - self.warmup_epochs)
            return self.target_lr * 0.5 * (1 + np.cos(np.pi * progress))
```

### Visualizing Learning Rate Schedules

```python
def visualize_lr_schedules():
    """Visualize different learning rate scheduling strategies"""
    epochs = 100
    initial_lr = 0.1

    schedulers = {
        'Step Decay': StepLRScheduler(initial_lr, step_size=30, gamma=0.1),
        'Exponential': ExponentialLRScheduler(initial_lr, gamma=0.95),
        'Cosine Annealing': CosineAnnealingScheduler(initial_lr, T_max=epochs),
        'Warmup + Cosine': WarmupScheduler(initial_lr, warmup_epochs=10, total_epochs=epochs),
    }

    fig, ax = plt.subplots(figsize=(12, 6))

    for name, scheduler in schedulers.items():
        lrs = [scheduler.get_lr(e) for e in range(epochs)]
        ax.plot(lrs, label=name, linewidth=2)

    ax.set_xlabel('Epoch', fontsize=12)
    ax.set_ylabel('Learning Rate', fontsize=12)
    ax.set_title('Comparison of Learning Rate Scheduling Strategies', fontsize=14)
    ax.legend(fontsize=10)
    ax.grid(True, alpha=0.3)

    plt.savefig('lr_schedules.png', dpi=150, bbox_inches='tight')
    plt.show()
```

---

## Constrained Optimization and Lagrange Multipliers

### Constrained Optimization Problems

**General form:**

$$\min_{x} f(x)$$
$$\text{subject to } g_i(x) \leq 0, \quad i = 1, \ldots, m$$
$$\quad\quad\quad\quad h_j(x) = 0, \quad j = 1, \ldots, p$$

Where:
- $g_i(x) \leq 0$ are inequality constraints
- $h_j(x) = 0$ are equality constraints

### Lagrangian Function

Introduce Lagrange multipliers $\lambda_i$ (for inequality constraints) and $\mu_j$ (for equality constraints):

$$\mathcal{L}(x, \lambda, \mu) = f(x) + \sum_{i=1}^{m}\lambda_i g_i(x) + \sum_{j=1}^{p}\mu_j h_j(x)$$

### Lagrange Multiplier Method for Equality Constraints

**Problem**:

$$\min_{x} f(x) \quad \text{s.t. } h(x) = 0$$

**Necessary conditions**:

$$\nabla_x \mathcal{L} = \nabla f(x) + \mu \nabla h(x) = 0$$
$$h(x) = 0$$

**Geometric interpretation**: At the optimal point, the gradient of the objective function is parallel to the normal of the constraint surface.

```python
import numpy as np
from scipy.optimize import minimize

def lagrange_multiplier_example():
    """
    Example: Minimize f(x,y) = x^2 + y^2
    Constraint: x + y = 1
    """

    # Method 1: Analytical solution using Lagrange multipliers
    # L = x^2 + y^2 + mu*(x + y - 1)
    # dL/dx = 2x + mu = 0  =>  x = -mu/2
    # dL/dy = 2y + mu = 0  =>  y = -mu/2
    # x + y = 1  =>  -mu = 1  =>  mu = -1
    # So x = y = 0.5

    print("Analytical solution: x = 0.5, y = 0.5")
    print(f"Optimal value: f(0.5, 0.5) = {0.5**2 + 0.5**2}")

    # Method 2: Numerical solution using scipy
    def objective(xy):
        return xy[0]**2 + xy[1]**2

    def constraint(xy):
        return xy[0] + xy[1] - 1

    from scipy.optimize import minimize

    result = minimize(
        objective,
        x0=[0, 0],
        constraints={'type': 'eq', 'fun': constraint},
        method='SLSQP'
    )

    print(f"\nNumerical solution: x = {result.x[0]:.4f}, y = {result.x[1]:.4f}")
    print(f"Optimal value: {result.fun:.4f}")

lagrange_multiplier_example()
```

### Lagrangian Duality in SVM

Support Vector Machine is a classic application of Lagrangian methods in machine learning.

**Primal problem**:

$$\min_{\mathbf{w}, b} \frac{1}{2}\|\mathbf{w}\|^2$$
$$\text{s.t. } y_i(\mathbf{w}^T\mathbf{x}_i + b) \geq 1, \quad i = 1, \ldots, n$$

**Lagrangian function**:

$$\mathcal{L}(\mathbf{w}, b, \alpha) = \frac{1}{2}\|\mathbf{w}\|^2 - \sum_{i=1}^{n}\alpha_i[y_i(\mathbf{w}^T\mathbf{x}_i + b) - 1]$$

**Dual problem**:

$$\max_{\alpha} \sum_{i=1}^{n}\alpha_i - \frac{1}{2}\sum_{i,j}\alpha_i\alpha_j y_i y_j \mathbf{x}_i^T\mathbf{x}_j$$
$$\text{s.t. } \alpha_i \geq 0, \quad \sum_{i=1}^{n}\alpha_i y_i = 0$$

```python
import numpy as np
from sklearn.svm import SVC
from sklearn.datasets import make_classification
import matplotlib.pyplot as plt

def svm_lagrange_demo():
    """Demonstrate SVM and Lagrange multipliers"""
    # Generate binary classification data
    X, y = make_classification(n_samples=100, n_features=2,
                               n_redundant=0, n_clusters_per_class=1,
                               random_state=42)
    y = 2 * y - 1  # Convert to {-1, 1}

    # Train SVM
    svm = SVC(kernel='linear', C=1.0)
    svm.fit(X, y)

    # Get Lagrange multipliers of support vectors
    print(f"Number of support vectors: {len(svm.support_)}")
    print(f"Dual coefficients (alpha * y): {svm.dual_coef_}")

    # Visualization
    fig, ax = plt.subplots(figsize=(10, 8))

    # Draw decision boundary
    xlim = ax.get_xlim()
    ylim = ax.get_ylim()
    xx, yy = np.meshgrid(np.linspace(X[:, 0].min()-1, X[:, 0].max()+1, 100),
                         np.linspace(X[:, 1].min()-1, X[:, 1].max()+1, 100))
    Z = svm.decision_function(np.c_[xx.ravel(), yy.ravel()])
    Z = Z.reshape(xx.shape)

    ax.contour(xx, yy, Z, levels=[-1, 0, 1], linestyles=['--', '-', '--'],
               colors='k')
    ax.contourf(xx, yy, Z, levels=[-np.inf, 0, np.inf], alpha=0.2,
                colors=['blue', 'red'])

    # Plot data points
    ax.scatter(X[y == 1, 0], X[y == 1, 1], c='red', marker='o',
               label='Positive class', edgecolors='k')
    ax.scatter(X[y == -1, 0], X[y == -1, 1], c='blue', marker='s',
               label='Negative class', edgecolors='k')

    # Mark support vectors
    ax.scatter(svm.support_vectors_[:, 0], svm.support_vectors_[:, 1],
               s=200, facecolors='none', edgecolors='green', linewidths=2,
               label='Support vectors')

    ax.set_xlabel('$x_1$', fontsize=12)
    ax.set_ylabel('$x_2$', fontsize=12)
    ax.set_title('SVM and Lagrange Multipliers', fontsize=14)
    ax.legend()

    plt.savefig('svm_lagrange.png', dpi=150, bbox_inches='tight')
    plt.show()
```

---

## KKT Conditions

### Overview of KKT Conditions

Karush-Kuhn-Tucker (KKT) conditions are necessary conditions for optimal solutions of constrained optimization problems (and also sufficient for convex optimization problems).

For the problem:

$$\min_x f(x) \quad \text{s.t. } g_i(x) \leq 0, h_j(x) = 0$$

### Four Parts of KKT Conditions

1. **Primal Feasibility**:
   $$g_i(x^*) \leq 0, \quad h_j(x^*) = 0$$

2. **Dual Feasibility**:
   $$\lambda_i^* \geq 0$$

3. **Complementary Slackness**:
   $$\lambda_i^* g_i(x^*) = 0$$

4. **Stationarity**:
   $$\nabla f(x^*) + \sum_i \lambda_i^* \nabla g_i(x^*) + \sum_j \mu_j^* \nabla h_j(x^*) = 0$$

### Meaning of Complementary Slackness

$$\lambda_i^* g_i(x^*) = 0$$

This means:
- If $\lambda_i^* > 0$, then $g_i(x^*) = 0$ (constraint is active)
- If $g_i(x^*) < 0$, then $\lambda_i^* = 0$ (constraint is inactive)

### KKT Conditions Application Example

```python
import numpy as np
from scipy.optimize import minimize

def kkt_conditions_example():
    """
    Example problem:
    min f(x,y) = (x-2)^2 + (y-1)^2
    s.t. x + y <= 2
         x >= 0
         y >= 0
    """

    def objective(xy):
        x, y = xy
        return (x - 2)**2 + (y - 1)**2

    def objective_gradient(xy):
        x, y = xy
        return np.array([2*(x - 2), 2*(y - 1)])

    # Constraint definitions (scipy requires inequality constraints in form >= 0)
    constraints = [
        {'type': 'ineq', 'fun': lambda xy: 2 - xy[0] - xy[1]},  # x + y <= 2
        {'type': 'ineq', 'fun': lambda xy: xy[0]},              # x >= 0
        {'type': 'ineq', 'fun': lambda xy: xy[1]},              # y >= 0
    ]

    # Solve
    result = minimize(
        objective,
        x0=[0, 0],
        method='SLSQP',
        constraints=constraints,
        jac=objective_gradient
    )

    x_opt, y_opt = result.x
    print(f"Optimal solution: x = {x_opt:.4f}, y = {y_opt:.4f}")
    print(f"Optimal value: {result.fun:.4f}")

    # Verify KKT conditions
    print("\nVerifying KKT conditions:")

    # Primal feasibility
    print(f"1. Primal feasibility:")
    print(f"   x + y = {x_opt + y_opt:.4f} <= 2 check")
    print(f"   x = {x_opt:.4f} >= 0 check")
    print(f"   y = {y_opt:.4f} >= 0 check")

    # Check which constraints are active
    print(f"\n2. Constraint activity:")
    print(f"   x + y - 2 = {x_opt + y_opt - 2:.4f}")

    # Gradient condition
    grad = objective_gradient(result.x)
    print(f"\n3. Objective function gradient: {grad}")

kkt_conditions_example()
```

### L1 Regularization and KKT

The mathematical explanation for why L1 regularization leads to sparse solutions is closely related to KKT conditions.

$$\min_w \frac{1}{2}\|\mathbf{Xw} - \mathbf{y}\|^2 + \lambda\|\mathbf{w}\|_1$$

Is equivalent to:

$$\min_w \frac{1}{2}\|\mathbf{Xw} - \mathbf{y}\|^2 \quad \text{s.t. } \|\mathbf{w}\|_1 \leq t$$

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.linear_model import Lasso, Ridge
from sklearn.datasets import make_regression

def l1_sparsity_demo():
    """Demonstrate sparsity of L1 regularization"""
    # Generate data (only a few features are truly useful)
    np.random.seed(42)
    n_samples, n_features = 100, 20
    n_informative = 5

    X, y, true_coef = make_regression(
        n_samples=n_samples,
        n_features=n_features,
        n_informative=n_informative,
        coef=True,
        noise=10,
        random_state=42
    )

    # Different regularization strengths
    alphas = [0.01, 0.1, 1.0, 10.0]

    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    axes = axes.ravel()

    for ax, alpha in zip(axes, alphas):
        # L1 (Lasso)
        lasso = Lasso(alpha=alpha)
        lasso.fit(X, y)

        # L2 (Ridge)
        ridge = Ridge(alpha=alpha)
        ridge.fit(X, y)

        # Visualize coefficients
        x_pos = np.arange(n_features)
        width = 0.35

        ax.bar(x_pos - width/2, np.abs(lasso.coef_), width,
               label='L1 (Lasso)', alpha=0.7)
        ax.bar(x_pos + width/2, np.abs(ridge.coef_), width,
               label='L2 (Ridge)', alpha=0.7)

        ax.set_xlabel('Feature index')
        ax.set_ylabel('Absolute coefficient value')
        ax.set_title(f'alpha = {alpha}\n'
                     f'L1 non-zero coefficients: {np.sum(np.abs(lasso.coef_) > 1e-5)}, '
                     f'L2 non-zero coefficients: {np.sum(np.abs(ridge.coef_) > 1e-5)}')
        ax.legend()
        ax.set_xticks(x_pos[::2])

    plt.tight_layout()
    plt.savefig('l1_sparsity.png', dpi=150, bbox_inches='tight')
    plt.show()
```

---

## Practical Code Examples

### Using Optimizers in PyTorch

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import numpy as np
import matplotlib.pyplot as plt

# Create a simple neural network
class SimpleNN(nn.Module):
    def __init__(self, input_dim, hidden_dim, output_dim):
        super().__init__()
        self.fc1 = nn.Linear(input_dim, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.fc3 = nn.Linear(hidden_dim, output_dim)
        self.relu = nn.ReLU()

    def forward(self, x):
        x = self.relu(self.fc1(x))
        x = self.relu(self.fc2(x))
        return self.fc3(x)

# Training function
def train_with_optimizer(model, optimizer, scheduler, train_loader,
                         n_epochs=50, device='cpu'):
    model = model.to(device)
    criterion = nn.MSELoss()
    history = {'loss': [], 'lr': []}

    for epoch in range(n_epochs):
        model.train()
        epoch_loss = 0

        for batch_x, batch_y in train_loader:
            batch_x, batch_y = batch_x.to(device), batch_y.to(device)

            optimizer.zero_grad()
            outputs = model(batch_x)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()

            epoch_loss += loss.item()

        avg_loss = epoch_loss / len(train_loader)
        current_lr = optimizer.param_groups[0]['lr']
        history['loss'].append(avg_loss)
        history['lr'].append(current_lr)

        if scheduler is not None:
            scheduler.step()

        if (epoch + 1) % 10 == 0:
            print(f"Epoch {epoch+1}/{n_epochs}, Loss: {avg_loss:.6f}, LR: {current_lr:.6f}")

    return history

# Compare different optimizers
def compare_pytorch_optimizers():
    # Generate regression data
    np.random.seed(42)
    torch.manual_seed(42)

    n_samples = 1000
    X = np.random.randn(n_samples, 10).astype(np.float32)
    y = (X @ np.random.randn(10, 1) + 0.1 * np.random.randn(n_samples, 1)).astype(np.float32)

    dataset = TensorDataset(torch.from_numpy(X), torch.from_numpy(y))
    train_loader = DataLoader(dataset, batch_size=32, shuffle=True)

    # Different optimizer configurations
    optimizer_configs = {
        'SGD': lambda params: optim.SGD(params, lr=0.01),
        'SGD+Momentum': lambda params: optim.SGD(params, lr=0.01, momentum=0.9),
        'Adam': lambda params: optim.Adam(params, lr=0.001),
        'AdamW': lambda params: optim.AdamW(params, lr=0.001, weight_decay=0.01),
        'RMSprop': lambda params: optim.RMSprop(params, lr=0.001),
    }

    results = {}

    for name, opt_func in optimizer_configs.items():
        print(f"\nTraining with {name}:")
        model = SimpleNN(10, 64, 1)
        optimizer = opt_func(model.parameters())

        # Use cosine annealing scheduler
        scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=50)

        history = train_with_optimizer(model, optimizer, scheduler, train_loader)
        results[name] = history

    # Visualization
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    for name, history in results.items():
        ax1.plot(history['loss'], label=name, linewidth=2)

    ax1.set_xlabel('Epoch')
    ax1.set_ylabel('Loss')
    ax1.set_title('Loss Curves of Different Optimizers')
    ax1.legend()
    ax1.set_yscale('log')
    ax1.grid(True, alpha=0.3)

    for name, history in results.items():
        ax2.plot(history['lr'], label=name, linewidth=2)

    ax2.set_xlabel('Epoch')
    ax2.set_ylabel('Learning Rate')
    ax2.set_title('Learning Rate Changes')
    ax2.legend()
    ax2.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig('pytorch_optimizers.png', dpi=150, bbox_inches='tight')
    plt.show()

    return results
```

### Custom Optimizer

```python
import torch
from torch.optim import Optimizer

class CustomAdam(Optimizer):
    """Custom Adam optimizer implementation"""

    def __init__(self, params, lr=1e-3, betas=(0.9, 0.999),
                 eps=1e-8, weight_decay=0):
        defaults = dict(lr=lr, betas=betas, eps=eps, weight_decay=weight_decay)
        super().__init__(params, defaults)

    @torch.no_grad()
    def step(self, closure=None):
        loss = None
        if closure is not None:
            with torch.enable_grad():
                loss = closure()

        for group in self.param_groups:
            for p in group['params']:
                if p.grad is None:
                    continue

                grad = p.grad
                if grad.is_sparse:
                    raise RuntimeError('CustomAdam does not support sparse gradients')

                state = self.state[p]

                # State initialization
                if len(state) == 0:
                    state['step'] = 0
                    state['exp_avg'] = torch.zeros_like(p)
                    state['exp_avg_sq'] = torch.zeros_like(p)

                exp_avg, exp_avg_sq = state['exp_avg'], state['exp_avg_sq']
                beta1, beta2 = group['betas']

                state['step'] += 1

                # Weight decay
                if group['weight_decay'] != 0:
                    grad = grad.add(p, alpha=group['weight_decay'])

                # Update first and second moment estimates
                exp_avg.mul_(beta1).add_(grad, alpha=1 - beta1)
                exp_avg_sq.mul_(beta2).addcmul_(grad, grad, value=1 - beta2)

                # Bias correction
                bias_correction1 = 1 - beta1 ** state['step']
                bias_correction2 = 1 - beta2 ** state['step']

                step_size = group['lr'] / bias_correction1
                denom = (exp_avg_sq.sqrt() / (bias_correction2 ** 0.5)).add_(group['eps'])

                # Parameter update
                p.addcdiv_(exp_avg, denom, value=-step_size)

        return loss

# Using custom optimizer
def test_custom_optimizer():
    model = SimpleNN(10, 64, 1)
    optimizer = CustomAdam(model.parameters(), lr=0.001)

    # Simple test
    x = torch.randn(32, 10)
    y = torch.randn(32, 1)

    for i in range(10):
        optimizer.zero_grad()
        output = model(x)
        loss = ((output - y) ** 2).mean()
        loss.backward()
        optimizer.step()

        print(f"Step {i+1}, Loss: {loss.item():.6f}")
```

### Constrained Optimization in Practice

```python
import numpy as np
from scipy.optimize import minimize, LinearConstraint, NonlinearConstraint

def portfolio_optimization():
    """
    Portfolio optimization problem
    Minimize portfolio risk (variance) while satisfying return and investment constraints
    """
    np.random.seed(42)

    # 5 assets
    n_assets = 5
    asset_names = ['Stock A', 'Stock B', 'Bond C', 'Real Estate D', 'Gold E']

    # Expected returns
    expected_returns = np.array([0.12, 0.10, 0.05, 0.08, 0.06])

    # Covariance matrix (correlations between assets)
    cov_matrix = np.array([
        [0.04, 0.02, 0.01, 0.015, 0.01],
        [0.02, 0.03, 0.005, 0.01, 0.008],
        [0.01, 0.005, 0.01, 0.005, 0.003],
        [0.015, 0.01, 0.005, 0.025, 0.007],
        [0.01, 0.008, 0.003, 0.007, 0.015]
    ])

    # Objective function: minimize portfolio variance
    def portfolio_variance(weights):
        return weights @ cov_matrix @ weights

    def portfolio_variance_gradient(weights):
        return 2 * cov_matrix @ weights

    # Constraint 1: weights sum to 1
    weight_sum_constraint = LinearConstraint(
        np.ones(n_assets), lb=1, ub=1
    )

    # Constraint 2: expected return at least 8%
    target_return = 0.08
    return_constraint = LinearConstraint(
        expected_returns, lb=target_return, ub=np.inf
    )

    # Constraint 3: each asset weight between [0, 0.4] (no short selling, single asset not exceeding 40%)
    bounds = [(0, 0.4) for _ in range(n_assets)]

    # Initial guess: equal weights
    initial_weights = np.ones(n_assets) / n_assets

    # Solve
    result = minimize(
        portfolio_variance,
        initial_weights,
        method='SLSQP',
        jac=portfolio_variance_gradient,
        bounds=bounds,
        constraints=[
            {'type': 'eq', 'fun': lambda w: np.sum(w) - 1},
            {'type': 'ineq', 'fun': lambda w: expected_returns @ w - target_return}
        ]
    )

    optimal_weights = result.x
    optimal_variance = result.fun
    optimal_return = expected_returns @ optimal_weights
    optimal_std = np.sqrt(optimal_variance)

    print("=" * 50)
    print("Portfolio Optimization Results")
    print("=" * 50)
    print("\nOptimal weight allocation:")
    for name, weight in zip(asset_names, optimal_weights):
        print(f"  {name}: {weight*100:.2f}%")

    print(f"\nPortfolio expected return: {optimal_return*100:.2f}%")
    print(f"Portfolio standard deviation (risk): {optimal_std*100:.2f}%")
    print(f"Sharpe ratio (assuming 3% risk-free rate): {(optimal_return - 0.03) / optimal_std:.2f}")

    # Visualize efficient frontier
    plot_efficient_frontier(expected_returns, cov_matrix, n_assets)

    return optimal_weights

def plot_efficient_frontier(returns, cov_matrix, n_assets):
    """Plot the efficient frontier"""
    target_returns = np.linspace(min(returns), max(returns), 50)
    portfolio_stds = []
    portfolio_weights_list = []

    for target in target_returns:
        def variance(w):
            return w @ cov_matrix @ w

        result = minimize(
            variance,
            np.ones(n_assets) / n_assets,
            method='SLSQP',
            bounds=[(0, 1) for _ in range(n_assets)],
            constraints=[
                {'type': 'eq', 'fun': lambda w: np.sum(w) - 1},
                {'type': 'eq', 'fun': lambda w, t=target: returns @ w - t}
            ]
        )

        if result.success:
            portfolio_stds.append(np.sqrt(result.fun))
            portfolio_weights_list.append(result.x)
        else:
            portfolio_stds.append(np.nan)

    fig, ax = plt.subplots(figsize=(10, 6))

    ax.plot(portfolio_stds, target_returns * 100, 'b-', linewidth=2, label='Efficient Frontier')
    ax.scatter([np.sqrt(cov_matrix[i, i]) for i in range(n_assets)],
               returns * 100, marker='o', s=100, c='red', label='Individual Assets')

    ax.set_xlabel('Risk (Standard Deviation) %', fontsize=12)
    ax.set_ylabel('Expected Return %', fontsize=12)
    ax.set_title('Portfolio Efficient Frontier', fontsize=14)
    ax.legend()
    ax.grid(True, alpha=0.3)

    plt.savefig('efficient_frontier.png', dpi=150, bbox_inches='tight')
    plt.show()
```

---

## Interview Key Points

### Basic Concepts

**Q1: What is convex optimization? Why is convex optimization important in machine learning?**

Convex optimization is an optimization problem where the objective function is convex and the feasible region is a convex set. Its core property is: any local optimum is also a global optimum.

Importance:
- Classic models like linear regression, logistic regression, SVM are all convex optimization problems
- Efficient convex optimization algorithms can be used to guarantee finding the global optimum
- Convex optimization theory provides a foundation for understanding non-convex optimization (such as neural networks)

**Q2: Explain the principle of gradient descent and convergence conditions**

Principle: Iteratively update parameters in the direction opposite to the gradient of the objective function, because the negative gradient direction is the direction of steepest descent.

Convergence conditions:
- Learning rate is small enough (for L-smooth functions, $\eta < 2/L$)
- For convex functions, guarantees convergence to global optimum
- For non-convex functions, converges to stationary points (where gradient is zero)

**Q3: What are the differences between batch gradient descent, stochastic gradient descent, and mini-batch gradient descent?**

| Method | Samples Used Per Iteration | Gradient Estimate | Convergence Characteristics |
|--------|---------------------------|-------------------|---------------------------|
| BGD | All data | Exact | Stable but slow |
| SGD | Single sample | High noise | Fast but oscillating |
| Mini-batch | Small batch | Trade-off | Most commonly used |

### Optimizer Related

**Q4: What is the principle of Adam optimizer? Why is it widely used?**

Adam combines momentum (first moment estimate) and RMSprop (second moment estimate):
- First moment: exponential moving average of gradients, providing momentum effect
- Second moment: exponential moving average of squared gradients, adaptively adjusting learning rate
- Bias correction: corrects bias in initial stages

Advantages:
- Insensitive to hyperparameters, default values work well
- Suitable for most problems, fast convergence
- Adaptive learning rate, different step sizes for different parameters

**Q5: How do momentum methods help optimization?**

Momentum accumulates historical gradients:
- Accelerates when gradient direction is consistent (e.g., flat regions)
- Decelerates when gradient direction changes (e.g., oscillating regions)
- Helps escape local optima and saddle points

**Q6: Why is learning rate scheduling needed? What are common strategies?**

Reasons:
- Early stage needs large learning rate for fast exploration
- Later stage needs small learning rate for fine-tuning

Common strategies:
- Step decay: decay every fixed number of epochs
- Cosine annealing: smooth decrease
- Warmup: start from small learning rate and gradually increase
- Adaptive: adjust based on validation set performance

### Constrained Optimization

**Q7: What is the Lagrange multiplier method? What are KKT conditions?**

Lagrange multiplier method: transforms constrained optimization into unconstrained problem by introducing multipliers to add constraints to the objective function.

KKT conditions are necessary conditions for optimal solutions of constrained optimization problems, including:
1. Primal feasibility: satisfies all constraints
2. Dual feasibility: multipliers for inequality constraints are non-negative
3. Complementary slackness: product of multiplier and constraint equals zero
4. Stationarity: gradient of Lagrangian with respect to primal variables is zero

**Q8: Why does L1 regularization produce sparse solutions?**

From KKT conditions perspective:
- L1 regularization is equivalent to constraint $\|\mathbf{w}\|_1 \leq t$
- The constraint region is a diamond (vertices on coordinate axes)
- Contour lines more likely to intersect with diamond at vertices (some coordinates are zero)

From subgradient perspective:
- L1 is not differentiable at zero
- Subgradient is the interval $[-1, 1]$
- When gradient falls in this interval, solution stays at zero

### Practical Questions

**Q9: How to choose optimizer and learning rate when training neural networks?**

Optimizer selection:
- Use Adam/AdamW by default
- Computer vision often uses SGD+Momentum
- Transformers use AdamW

Learning rate selection:
- Use learning rate finder to find suitable range
- Combine with warmup and cosine annealing
- Monitor validation set performance, adjust if necessary

**Q10: How to diagnose and solve optimization problems?**

Common problems and solutions:

| Problem | Symptoms | Solutions |
|---------|----------|-----------|
| Learning rate too large | Loss oscillates or diverges | Reduce learning rate |
| Learning rate too small | Very slow convergence | Increase learning rate |
| Vanishing gradients | Deep layer gradients near zero | Residual connections, BatchNorm |
| Exploding gradients | Very large gradient values | Gradient clipping |
| Stuck at saddle point | Loss stagnates | Use momentum, larger batch |

---

## Further Reading

### Recommended Books

1. **"Convex Optimization"** - Stephen Boyd, Lieven Vandenberghe
   - Classic textbook in convex optimization
   - Free online version: https://web.stanford.edu/~boyd/cvxbook/

2. **"Numerical Optimization"** - Jorge Nocedal, Stephen Wright
   - Comprehensive coverage of numerical optimization methods
   - Contains many practical algorithm details

3. **"Optimization for Machine Learning"** - Suvrit Sra et al.
   - Focuses on optimization problems in machine learning

4. **"Deep Learning"** - Ian Goodfellow et al.
   - Chapter 8 details deep learning optimization

### Online Resources

1. **Stanford CS229** - Machine Learning Course
   - Contains optimization theory fundamentals

2. **Stanford EE364a** - Convex Optimization Course
   - Professor Boyd's classic course
   - Videos and homework freely available

3. **fast.ai** - Practical Deep Learning
   - Contains practical guidance on optimizer selection

### Classic Papers

1. **Adam**: Kingma & Ba, "Adam: A Method for Stochastic Optimization", 2014
2. **AdamW**: Loshchilov & Hutter, "Decoupled Weight Decay Regularization", 2017
3. **Learning Rate Warmup**: Goyal et al., "Accurate, Large Minibatch SGD", 2017
4. **Cosine Annealing**: Loshchilov & Hutter, "SGDR: Stochastic Gradient Descent with Warm Restarts", 2016
5. **Gradient Clipping**: Pascanu et al., "On the difficulty of training recurrent neural networks", 2013

### Advanced Topics

- **Second-order optimization methods**: Newton's method, Quasi-Newton methods (L-BFGS)
- **Distributed optimization**: Data parallelism, Model parallelism
- **Neural network optimization theory**: Loss surface analysis, Generalization theory
- **Optimization in AutoML**: Hyperparameter optimization, Neural architecture search
- **Online convex optimization**: Regret bounds, Adversarial learning

---

## Summary

Optimization theory is the core foundation of machine learning. We've covered the following key topics:

1. **Convex optimization fundamentals**: Definition and verification of convex functions and convex sets, importance of convex optimization

2. **Gradient descent family**:
   - Batch gradient descent: accurate but slow
   - Stochastic gradient descent: fast but oscillating
   - Mini-batch SGD: best choice in practice

3. **Advanced optimizers**:
   - Momentum methods: accelerate convergence
   - AdaGrad/RMSprop: adaptive learning rates
   - Adam/AdamW: combine advantages of both

4. **Learning rate scheduling**: warmup, step decay, cosine annealing

5. **Constrained optimization**: Lagrange multiplier method, KKT conditions

Mastering this knowledge helps understand how machine learning algorithms work and enables more effective model training in practice. Readers are encouraged to practice with the code examples to deepen their understanding of the theory.
