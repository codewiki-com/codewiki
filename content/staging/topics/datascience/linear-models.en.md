---
title: "Classical ML: Linear Models"
description: Deep dive into linear regression, logistic regression, and regularization methods (L1/L2)
track: datascience
section: classical-ml
difficulty: intermediate
tags:
  - linear regression
  - logistic regression
  - regularization
  - machine learning
status: imported
origin: old/src/content/docs/datascience/linear-models.en.md
divergence: 0.261
issues: []
legacy:
  category: DataScience
  subcategory: ClassicalML
  order: 11
  lastUpdated: 2026-01-07
---

Linear models form the foundation of machine learning and remain among the most widely used algorithms in practice. Despite their simplicity, linear models are powerful, interpretable, and serve as essential building blocks for understanding more complex algorithms. This comprehensive guide covers linear regression, logistic regression, regularization techniques, and their practical implementation using Scikit-learn.

## Linear Regression Principles

Linear regression is the most fundamental supervised learning algorithm for predicting continuous numerical values. It models the relationship between input features and output as a linear combination.

### The Linear Model

The basic linear regression model assumes a linear relationship between input features $\mathbf{x}$ and target $y$:

$$y = w_0 + w_1x_1 + w_2x_2 + \cdots + w_nx_n + \epsilon$$

Or in vector notation:

$$y = \mathbf{w}^T\mathbf{x} + \epsilon$$

Where:
- $\mathbf{w} = [w_0, w_1, \ldots, w_n]^T$ are the model parameters (weights)
- $w_0$ is the bias (intercept) term
- $\mathbf{x} = [1, x_1, \ldots, x_n]^T$ is the feature vector (with 1 prepended for bias)
- $\epsilon$ is the error term (noise)

**Key Assumptions:**
1. **Linearity**: The relationship between features and target is linear
2. **Independence**: Observations are independent of each other
3. **Homoscedasticity**: Constant variance of residuals
4. **Normality**: Residuals are normally distributed (for inference)
5. **No multicollinearity**: Features are not highly correlated with each other

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

# Generate sample data
np.random.seed(42)
X = 2 * np.random.rand(100, 1)
y = 4 + 3 * X + np.random.randn(100, 1)

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Fit linear regression
model = LinearRegression()
model.fit(X_train, y_train)

print(f"Intercept (w0): {model.intercept_[0]:.4f}")
print(f"Coefficient (w1): {model.coef_[0][0]:.4f}")

# Predictions
y_pred = model.predict(X_test)
print(f"R-squared: {r2_score(y_test, y_pred):.4f}")
print(f"RMSE: {np.sqrt(mean_squared_error(y_test, y_pred)):.4f}")
```

### Multiple Linear Regression

When we have multiple features, the model extends naturally:

```python
from sklearn.datasets import fetch_california_housing
import pandas as pd

# Load California housing dataset
housing = fetch_california_housing()
X = pd.DataFrame(housing.data, columns=housing.feature_names)
y = housing.target

print(f"Features: {list(X.columns)}")
print(f"Dataset shape: {X.shape}")

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Fit multiple linear regression
model = LinearRegression()
model.fit(X_train, y_train)

# Display coefficients
coefficients = pd.DataFrame({
    'Feature': X.columns,
    'Coefficient': model.coef_
}).sort_values('Coefficient', key=abs, ascending=False)

print("\nFeature Coefficients:")
print(coefficients.to_string(index=False))
print(f"\nIntercept: {model.intercept_:.4f}")
print(f"R-squared (test): {model.score(X_test, y_test):.4f}")
```

## Least Squares Method

The Ordinary Least Squares (OLS) method finds the optimal weights by minimizing the sum of squared residuals.

### Cost Function

The OLS cost function (also called the loss function or objective function) is:

$$J(\mathbf{w}) = \frac{1}{2n}\sum_{i=1}^{n}(y_i - \hat{y}_i)^2 = \frac{1}{2n}\sum_{i=1}^{n}(y_i - \mathbf{w}^T\mathbf{x}_i)^2$$

In matrix form:

$$J(\mathbf{w}) = \frac{1}{2n}(\mathbf{y} - \mathbf{X}\mathbf{w})^T(\mathbf{y} - \mathbf{X}\mathbf{w})$$

Where:
- $\mathbf{X}$ is the $n \times (p+1)$ design matrix (n samples, p features + 1 bias)
- $\mathbf{y}$ is the $n \times 1$ target vector
- $\mathbf{w}$ is the $(p+1) \times 1$ weight vector

### Closed-Form Solution (Normal Equation)

Taking the derivative of $J(\mathbf{w})$ with respect to $\mathbf{w}$ and setting it to zero:

$$\frac{\partial J}{\partial \mathbf{w}} = -\frac{1}{n}\mathbf{X}^T(\mathbf{y} - \mathbf{X}\mathbf{w}) = 0$$

Solving for $\mathbf{w}$:

$$\mathbf{w}^* = (\mathbf{X}^T\mathbf{X})^{-1}\mathbf{X}^T\mathbf{y}$$

This is the **Normal Equation**, providing an analytical solution.

```python
import numpy as np

def linear_regression_normal_equation(X, y):
    """
    Compute linear regression using the Normal Equation.

    Parameters:
    -----------
    X : ndarray of shape (n_samples, n_features)
        Training data
    y : ndarray of shape (n_samples,)
        Target values

    Returns:
    --------
    w : ndarray of shape (n_features + 1,)
        Learned weights including bias
    """
    # Add bias column (column of ones)
    n_samples = X.shape[0]
    X_b = np.c_[np.ones((n_samples, 1)), X]

    # Normal equation: w = (X^T X)^(-1) X^T y
    w = np.linalg.inv(X_b.T @ X_b) @ X_b.T @ y

    return w

# Example usage
np.random.seed(42)
X = 2 * np.random.rand(100, 2)
y = 4 + 3 * X[:, 0] + 2 * X[:, 1] + np.random.randn(100)

w = linear_regression_normal_equation(X, y)
print(f"Weights (including bias): {w}")
print(f"Bias: {w[0]:.4f}")
print(f"w1: {w[1]:.4f}")
print(f"w2: {w[2]:.4f}")
```

### Computational Considerations

**Normal Equation:**
- Time complexity: $O(n \cdot p^2 + p^3)$ where n is samples and p is features
- Space complexity: $O(p^2)$ for storing $\mathbf{X}^T\mathbf{X}$
- Requires matrix inversion, which can be unstable if $\mathbf{X}^T\mathbf{X}$ is singular or near-singular

**When to use Normal Equation:**
- Small to medium datasets (up to ~10,000 features)
- When exact solution is needed
- When data fits in memory

**When to avoid:**
- Large number of features (p > 10,000)
- When $\mathbf{X}^T\mathbf{X}$ is not invertible (use pseudoinverse or regularization)

```python
# Using SVD for numerical stability
def linear_regression_svd(X, y):
    """
    Compute linear regression using SVD (more numerically stable).
    """
    n_samples = X.shape[0]
    X_b = np.c_[np.ones((n_samples, 1)), X]

    # Use pseudoinverse (based on SVD)
    w = np.linalg.lstsq(X_b, y, rcond=None)[0]

    return w

w_svd = linear_regression_svd(X, y)
print(f"SVD solution: {w_svd}")
```

## Gradient Descent Solution

For large datasets, gradient descent provides an efficient iterative solution to minimize the cost function.

### Batch Gradient Descent

The gradient of the cost function with respect to weights:

$$\nabla_{\mathbf{w}} J(\mathbf{w}) = \frac{1}{n}\mathbf{X}^T(\mathbf{X}\mathbf{w} - \mathbf{y})$$

Update rule:

$$\mathbf{w} := \mathbf{w} - \alpha \nabla_{\mathbf{w}} J(\mathbf{w})$$

Where $\alpha$ is the learning rate.

```python
import numpy as np

def batch_gradient_descent(X, y, learning_rate=0.01, n_iterations=1000, tol=1e-6):
    """
    Perform batch gradient descent for linear regression.

    Parameters:
    -----------
    X : ndarray of shape (n_samples, n_features)
        Training data
    y : ndarray of shape (n_samples,)
        Target values
    learning_rate : float
        Step size for gradient descent
    n_iterations : int
        Maximum number of iterations
    tol : float
        Convergence tolerance

    Returns:
    --------
    w : ndarray
        Learned weights
    history : list
        Cost function values during training
    """
    n_samples, n_features = X.shape

    # Add bias column
    X_b = np.c_[np.ones((n_samples, 1)), X]

    # Initialize weights randomly
    w = np.random.randn(n_features + 1)

    history = []

    for iteration in range(n_iterations):
        # Compute predictions
        y_pred = X_b @ w

        # Compute cost
        cost = (1 / (2 * n_samples)) * np.sum((y_pred - y) ** 2)
        history.append(cost)

        # Compute gradient
        gradient = (1 / n_samples) * X_b.T @ (y_pred - y)

        # Update weights
        w = w - learning_rate * gradient

        # Check convergence
        if iteration > 0 and abs(history[-2] - history[-1]) < tol:
            print(f"Converged at iteration {iteration}")
            break

    return w, history

# Example
np.random.seed(42)
X = 2 * np.random.rand(1000, 2)
y = 4 + 3 * X[:, 0] + 2 * X[:, 1] + np.random.randn(1000)

w, history = batch_gradient_descent(X, y, learning_rate=0.1, n_iterations=1000)

print(f"Final weights: bias={w[0]:.4f}, w1={w[1]:.4f}, w2={w[2]:.4f}")

# Plot convergence
plt.figure(figsize=(10, 4))
plt.plot(history)
plt.xlabel('Iteration')
plt.ylabel('Cost')
plt.title('Gradient Descent Convergence')
plt.yscale('log')
plt.grid(True)
plt.show()
```

### Stochastic Gradient Descent (SGD)

SGD updates weights using one sample at a time, making it faster but noisier:

```python
def stochastic_gradient_descent(X, y, learning_rate=0.01, n_epochs=50, random_state=42):
    """
    Perform stochastic gradient descent for linear regression.
    """
    np.random.seed(random_state)
    n_samples, n_features = X.shape

    # Add bias column
    X_b = np.c_[np.ones((n_samples, 1)), X]

    # Initialize weights
    w = np.random.randn(n_features + 1)

    history = []

    for epoch in range(n_epochs):
        # Shuffle data
        indices = np.random.permutation(n_samples)
        X_shuffled = X_b[indices]
        y_shuffled = y[indices]

        for i in range(n_samples):
            # Single sample gradient
            xi = X_shuffled[i:i+1]
            yi = y_shuffled[i:i+1]

            gradient = xi.T @ (xi @ w - yi)
            w = w - learning_rate * gradient.flatten()

        # Record cost at end of epoch
        y_pred = X_b @ w
        cost = (1 / (2 * n_samples)) * np.sum((y_pred - y) ** 2)
        history.append(cost)

    return w, history

w_sgd, history_sgd = stochastic_gradient_descent(X, y, learning_rate=0.01, n_epochs=50)
print(f"SGD weights: bias={w_sgd[0]:.4f}, w1={w_sgd[1]:.4f}, w2={w_sgd[2]:.4f}")
```

### Mini-Batch Gradient Descent

Mini-batch combines the benefits of batch and stochastic GD:

```python
def mini_batch_gradient_descent(X, y, batch_size=32, learning_rate=0.01, n_epochs=50):
    """
    Perform mini-batch gradient descent for linear regression.
    """
    n_samples, n_features = X.shape
    X_b = np.c_[np.ones((n_samples, 1)), X]
    w = np.random.randn(n_features + 1)

    history = []
    n_batches = n_samples // batch_size

    for epoch in range(n_epochs):
        indices = np.random.permutation(n_samples)
        X_shuffled = X_b[indices]
        y_shuffled = y[indices]

        for batch in range(n_batches):
            start = batch * batch_size
            end = start + batch_size

            X_batch = X_shuffled[start:end]
            y_batch = y_shuffled[start:end]

            gradient = (1 / batch_size) * X_batch.T @ (X_batch @ w - y_batch)
            w = w - learning_rate * gradient

        # Record cost
        y_pred = X_b @ w
        cost = (1 / (2 * n_samples)) * np.sum((y_pred - y) ** 2)
        history.append(cost)

    return w, history

w_mb, history_mb = mini_batch_gradient_descent(X, y, batch_size=32, learning_rate=0.01)
print(f"Mini-batch weights: bias={w_mb[0]:.4f}, w1={w_mb[1]:.4f}, w2={w_mb[2]:.4f}")
```

### Using Scikit-learn's SGDRegressor

```python
from sklearn.linear_model import SGDRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

# SGD requires feature scaling
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('sgd', SGDRegressor(
        loss='squared_error',
        penalty=None,
        alpha=0.0,
        learning_rate='invscaling',
        eta0=0.01,
        max_iter=1000,
        tol=1e-6,
        random_state=42
    ))
])

pipeline.fit(X, y)
y_pred = pipeline.predict(X)
print(f"R-squared: {r2_score(y, y_pred):.4f}")
```

## Logistic Regression

Despite its name, logistic regression is a classification algorithm. It models the probability of class membership using the logistic (sigmoid) function.

### The Sigmoid Function

The sigmoid function maps any real number to the range (0, 1):

$$\sigma(z) = \frac{1}{1 + e^{-z}}$$

Properties:
- Output is always between 0 and 1
- $\sigma(0) = 0.5$
- $\sigma(-z) = 1 - \sigma(z)$
- Derivative: $\sigma'(z) = \sigma(z)(1 - \sigma(z))$

```python
import numpy as np
import matplotlib.pyplot as plt

def sigmoid(z):
    """Compute sigmoid function."""
    return 1 / (1 + np.exp(-z))

# Visualize sigmoid
z = np.linspace(-10, 10, 100)
plt.figure(figsize=(10, 4))

plt.subplot(1, 2, 1)
plt.plot(z, sigmoid(z), 'b-', linewidth=2)
plt.axhline(y=0.5, color='r', linestyle='--', alpha=0.5)
plt.axvline(x=0, color='r', linestyle='--', alpha=0.5)
plt.xlabel('z')
plt.ylabel('sigmoid(z)')
plt.title('Sigmoid Function')
plt.grid(True)

# Sigmoid derivative
plt.subplot(1, 2, 2)
sigmoid_derivative = sigmoid(z) * (1 - sigmoid(z))
plt.plot(z, sigmoid_derivative, 'g-', linewidth=2)
plt.xlabel('z')
plt.ylabel("sigmoid'(z)")
plt.title('Sigmoid Derivative')
plt.grid(True)

plt.tight_layout()
plt.show()
```

### Logistic Regression Model

For binary classification, the model predicts the probability of class 1:

$$P(y=1|\mathbf{x}) = \sigma(\mathbf{w}^T\mathbf{x}) = \frac{1}{1 + e^{-\mathbf{w}^T\mathbf{x}}}$$

The decision boundary is where $P(y=1|\mathbf{x}) = 0.5$, which occurs when $\mathbf{w}^T\mathbf{x} = 0$.

### Log Loss (Binary Cross-Entropy)

The cost function for logistic regression is the log loss:

$$J(\mathbf{w}) = -\frac{1}{n}\sum_{i=1}^{n}\left[y_i\log(\hat{p}_i) + (1-y_i)\log(1-\hat{p}_i)\right]$$

Where $\hat{p}_i = \sigma(\mathbf{w}^T\mathbf{x}_i)$ is the predicted probability.

```python
import numpy as np
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, log_loss

class LogisticRegressionFromScratch:
    """
    Logistic Regression implementation from scratch.
    """
    def __init__(self, learning_rate=0.01, n_iterations=1000):
        self.learning_rate = learning_rate
        self.n_iterations = n_iterations
        self.weights = None
        self.bias = None
        self.history = []

    def sigmoid(self, z):
        # Clip to avoid overflow
        z = np.clip(z, -500, 500)
        return 1 / (1 + np.exp(-z))

    def fit(self, X, y):
        n_samples, n_features = X.shape

        # Initialize weights and bias
        self.weights = np.zeros(n_features)
        self.bias = 0

        for _ in range(self.n_iterations):
            # Linear model
            z = X @ self.weights + self.bias

            # Predictions (probabilities)
            y_pred = self.sigmoid(z)

            # Compute gradients
            dw = (1 / n_samples) * X.T @ (y_pred - y)
            db = (1 / n_samples) * np.sum(y_pred - y)

            # Update weights
            self.weights -= self.learning_rate * dw
            self.bias -= self.learning_rate * db

            # Compute and store loss
            loss = self._compute_loss(y, y_pred)
            self.history.append(loss)

        return self

    def _compute_loss(self, y, y_pred):
        # Clip predictions to avoid log(0)
        y_pred = np.clip(y_pred, 1e-15, 1 - 1e-15)
        return -np.mean(y * np.log(y_pred) + (1 - y) * np.log(1 - y_pred))

    def predict_proba(self, X):
        z = X @ self.weights + self.bias
        return self.sigmoid(z)

    def predict(self, X, threshold=0.5):
        return (self.predict_proba(X) >= threshold).astype(int)

# Generate classification data
X, y = make_classification(n_samples=1000, n_features=2, n_redundant=0,
                          n_informative=2, n_clusters_per_class=1, random_state=42)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train custom model
model = LogisticRegressionFromScratch(learning_rate=0.1, n_iterations=1000)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)

print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
print(f"Log Loss: {log_loss(y_test, y_prob):.4f}")
```

### Using Scikit-learn

```python
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, roc_auc_score

# Create pipeline with scaling
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('classifier', LogisticRegression(
        C=1.0,              # Inverse of regularization strength
        penalty='l2',        # Regularization type
        solver='lbfgs',      # Optimization algorithm
        max_iter=1000,
        random_state=42
    ))
])

pipeline.fit(X_train, y_train)

# Predictions
y_pred = pipeline.predict(X_test)
y_prob = pipeline.predict_proba(X_test)[:, 1]

print("Classification Report:")
print(classification_report(y_test, y_pred))
print(f"AUC-ROC: {roc_auc_score(y_test, y_prob):.4f}")

# Access model coefficients
lr_model = pipeline.named_steps['classifier']
print(f"\nCoefficients: {lr_model.coef_}")
print(f"Intercept: {lr_model.intercept_}")
```

### Decision Boundary Visualization

```python
import numpy as np
import matplotlib.pyplot as plt

def plot_decision_boundary(model, X, y, title="Decision Boundary"):
    """Plot decision boundary for 2D data."""
    # Create mesh grid
    h = 0.02
    x_min, x_max = X[:, 0].min() - 1, X[:, 0].max() + 1
    y_min, y_max = X[:, 1].min() - 1, X[:, 1].max() + 1
    xx, yy = np.meshgrid(np.arange(x_min, x_max, h),
                         np.arange(y_min, y_max, h))

    # Predict on mesh
    Z = model.predict(np.c_[xx.ravel(), yy.ravel()])
    Z = Z.reshape(xx.shape)

    # Plot
    plt.figure(figsize=(10, 6))
    plt.contourf(xx, yy, Z, alpha=0.3, cmap='RdYlBu')
    plt.scatter(X[:, 0], X[:, 1], c=y, cmap='RdYlBu', edgecolors='black')
    plt.xlabel('Feature 1')
    plt.ylabel('Feature 2')
    plt.title(title)
    plt.colorbar(label='Class')
    plt.show()

# Plot decision boundary
plot_decision_boundary(pipeline, X_test, y_test, "Logistic Regression Decision Boundary")
```

## Multiclass Logistic Regression

Logistic regression can be extended to handle multiple classes using two main approaches.

### One-vs-Rest (OvR)

One-vs-Rest trains K binary classifiers for K classes. Each classifier distinguishes one class from all others.

```python
from sklearn.datasets import load_iris
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

# Load iris dataset (3 classes)
iris = load_iris()
X, y = iris.data, iris.target

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# One-vs-Rest logistic regression
model_ovr = LogisticRegression(
    multi_class='ovr',      # One-vs-Rest
    solver='lbfgs',
    max_iter=1000,
    random_state=42
)

model_ovr.fit(X_train, y_train)
y_pred = model_ovr.predict(X_test)

print("One-vs-Rest Classification Report:")
print(classification_report(y_test, y_pred, target_names=iris.target_names))
```

### Multinomial (Softmax Regression)

Softmax regression directly models multi-class probabilities using the softmax function:

$$P(y=k|\mathbf{x}) = \frac{e^{\mathbf{w}_k^T\mathbf{x}}}{\sum_{j=1}^{K}e^{\mathbf{w}_j^T\mathbf{x}}}$$

```python
# Multinomial logistic regression
model_multinomial = LogisticRegression(
    multi_class='multinomial',   # Softmax
    solver='lbfgs',
    max_iter=1000,
    random_state=42
)

model_multinomial.fit(X_train, y_train)
y_pred = model_multinomial.predict(X_test)

print("Multinomial (Softmax) Classification Report:")
print(classification_report(y_test, y_pred, target_names=iris.target_names))

# Get probability predictions
y_prob = model_multinomial.predict_proba(X_test)
print(f"\nSample probability predictions (first 5):")
print(y_prob[:5])
```

### Softmax Function Implementation

```python
def softmax(z):
    """
    Compute softmax values for each set of scores in z.
    """
    # Subtract max for numerical stability
    exp_z = np.exp(z - np.max(z, axis=1, keepdims=True))
    return exp_z / np.sum(exp_z, axis=1, keepdims=True)

# Example
z = np.array([[2.0, 1.0, 0.1],
              [1.0, 2.0, 0.1]])
probs = softmax(z)
print("Softmax probabilities:")
print(probs)
print(f"Sum of each row: {probs.sum(axis=1)}")
```

## L1 and L2 Regularization

Regularization prevents overfitting by adding a penalty term to the cost function, discouraging large weight values.

### L2 Regularization (Ridge)

L2 regularization adds the sum of squared weights to the cost function:

$$J_{L2}(\mathbf{w}) = J(\mathbf{w}) + \frac{\lambda}{2}\sum_{j=1}^{n}w_j^2 = J(\mathbf{w}) + \frac{\lambda}{2}\|\mathbf{w}\|_2^2$$

**Key Properties:**
- Shrinks all coefficients towards zero uniformly
- Never sets coefficients exactly to zero
- More stable when features are correlated
- Closed-form solution exists for linear regression

```python
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score
import numpy as np

# Generate data with many features
np.random.seed(42)
n_samples, n_features = 100, 50
X = np.random.randn(n_samples, n_features)
y = X[:, :5] @ np.array([1, 2, 3, 4, 5]) + 0.5 * np.random.randn(n_samples)

# Scale features
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Compare different regularization strengths
alphas = [0.001, 0.01, 0.1, 1.0, 10.0, 100.0]

print("Ridge Regression - Effect of Alpha:")
print("-" * 50)

for alpha in alphas:
    ridge = Ridge(alpha=alpha)
    scores = cross_val_score(ridge, X_scaled, y, cv=5, scoring='r2')

    ridge.fit(X_scaled, y)
    n_nonzero = np.sum(np.abs(ridge.coef_) > 0.01)

    print(f"Alpha={alpha:>6.3f}: R2={scores.mean():.4f} (+/-{scores.std():.4f}), "
          f"Non-zero coefs: {n_nonzero}")
```

### L1 Regularization (Lasso)

L1 regularization adds the sum of absolute weights:

$$J_{L1}(\mathbf{w}) = J(\mathbf{w}) + \lambda\sum_{j=1}^{n}|w_j| = J(\mathbf{w}) + \lambda\|\mathbf{w}\|_1$$

**Key Properties:**
- Can set coefficients exactly to zero (sparse solutions)
- Performs automatic feature selection
- Useful when many features are irrelevant
- No closed-form solution; requires iterative optimization

```python
from sklearn.linear_model import Lasso

print("\nLasso Regression - Effect of Alpha:")
print("-" * 50)

for alpha in alphas:
    lasso = Lasso(alpha=alpha, max_iter=10000)
    scores = cross_val_score(lasso, X_scaled, y, cv=5, scoring='r2')

    lasso.fit(X_scaled, y)
    n_nonzero = np.sum(np.abs(lasso.coef_) > 1e-10)

    print(f"Alpha={alpha:>6.3f}: R2={scores.mean():.4f} (+/-{scores.std():.4f}), "
          f"Non-zero coefs: {n_nonzero}")
```

### Comparing L1 and L2

```python
import matplotlib.pyplot as plt

# Visualize coefficient paths
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Ridge coefficient path
alphas_plot = np.logspace(-3, 3, 100)
ridge_coefs = []
for alpha in alphas_plot:
    ridge = Ridge(alpha=alpha)
    ridge.fit(X_scaled, y)
    ridge_coefs.append(ridge.coef_)

ridge_coefs = np.array(ridge_coefs)

axes[0].plot(np.log10(alphas_plot), ridge_coefs)
axes[0].axhline(0, linestyle='--', color='gray', alpha=0.5)
axes[0].set_xlabel('log10(alpha)')
axes[0].set_ylabel('Coefficients')
axes[0].set_title('Ridge (L2) Coefficient Path')
axes[0].grid(True)

# Lasso coefficient path
lasso_coefs = []
for alpha in alphas_plot:
    lasso = Lasso(alpha=alpha, max_iter=10000)
    lasso.fit(X_scaled, y)
    lasso_coefs.append(lasso.coef_)

lasso_coefs = np.array(lasso_coefs)

axes[1].plot(np.log10(alphas_plot), lasso_coefs)
axes[1].axhline(0, linestyle='--', color='gray', alpha=0.5)
axes[1].set_xlabel('log10(alpha)')
axes[1].set_ylabel('Coefficients')
axes[1].set_title('Lasso (L1) Coefficient Path')
axes[1].grid(True)

plt.tight_layout()
plt.show()
```

### Geometric Interpretation

The constraint regions for L1 and L2 have different shapes:

- **L2 (Ridge)**: Circular constraint region $\|\mathbf{w}\|_2^2 \leq t$
- **L1 (Lasso)**: Diamond-shaped constraint region $\|\mathbf{w}\|_1 \leq t$

The diamond shape of L1 has corners on the axes, making it more likely for the optimal solution to touch a corner (where some coefficients are zero).

```python
# Visualize constraint regions
fig, axes = plt.subplots(1, 2, figsize=(12, 5))

theta = np.linspace(0, 2*np.pi, 100)

# L2 constraint (circle)
x_l2 = np.cos(theta)
y_l2 = np.sin(theta)
axes[0].plot(x_l2, y_l2, 'b-', linewidth=2, label='L2 constraint')
axes[0].fill(x_l2, y_l2, alpha=0.2)
axes[0].set_xlim(-1.5, 1.5)
axes[0].set_ylim(-1.5, 1.5)
axes[0].set_aspect('equal')
axes[0].set_xlabel('w1')
axes[0].set_ylabel('w2')
axes[0].set_title('L2 (Ridge) Constraint Region')
axes[0].grid(True)
axes[0].axhline(0, color='k', linewidth=0.5)
axes[0].axvline(0, color='k', linewidth=0.5)

# L1 constraint (diamond)
x_l1 = [1, 0, -1, 0, 1]
y_l1 = [0, 1, 0, -1, 0]
axes[1].plot(x_l1, y_l1, 'r-', linewidth=2, label='L1 constraint')
axes[1].fill(x_l1, y_l1, alpha=0.2, color='red')
axes[1].set_xlim(-1.5, 1.5)
axes[1].set_ylim(-1.5, 1.5)
axes[1].set_aspect('equal')
axes[1].set_xlabel('w1')
axes[1].set_ylabel('w2')
axes[1].set_title('L1 (Lasso) Constraint Region')
axes[1].grid(True)
axes[1].axhline(0, color='k', linewidth=0.5)
axes[1].axvline(0, color='k', linewidth=0.5)

plt.tight_layout()
plt.show()
```

## Ridge, Lasso, and ElasticNet

### Ridge Regression

Ridge regression is linear regression with L2 regularization:

$$\min_{\mathbf{w}} \frac{1}{2n}\|\mathbf{y} - \mathbf{X}\mathbf{w}\|_2^2 + \alpha\|\mathbf{w}\|_2^2$$

Closed-form solution:

$$\mathbf{w}^* = (\mathbf{X}^T\mathbf{X} + \alpha\mathbf{I})^{-1}\mathbf{X}^T\mathbf{y}$$

```python
from sklearn.linear_model import Ridge, RidgeCV
from sklearn.datasets import fetch_california_housing
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score
import numpy as np

# Load data
housing = fetch_california_housing()
X, y = housing.data, housing.target

# Split and scale
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Ridge with cross-validation for alpha selection
ridge_cv = RidgeCV(alphas=[0.01, 0.1, 1.0, 10.0, 100.0], cv=5)
ridge_cv.fit(X_train_scaled, y_train)

print(f"Best alpha: {ridge_cv.alpha_}")

# Evaluate
y_pred = ridge_cv.predict(X_test_scaled)
print(f"R-squared: {r2_score(y_test, y_pred):.4f}")
print(f"RMSE: {np.sqrt(mean_squared_error(y_test, y_pred)):.4f}")

# Display coefficients
import pandas as pd
coef_df = pd.DataFrame({
    'Feature': housing.feature_names,
    'Coefficient': ridge_cv.coef_
}).sort_values('Coefficient', key=abs, ascending=False)
print("\nFeature Coefficients:")
print(coef_df.to_string(index=False))
```

### Lasso Regression

Lasso regression uses L1 regularization:

$$\min_{\mathbf{w}} \frac{1}{2n}\|\mathbf{y} - \mathbf{X}\mathbf{w}\|_2^2 + \alpha\|\mathbf{w}\|_1$$

```python
from sklearn.linear_model import Lasso, LassoCV

# Lasso with cross-validation
lasso_cv = LassoCV(alphas=[0.001, 0.01, 0.1, 1.0], cv=5, max_iter=10000)
lasso_cv.fit(X_train_scaled, y_train)

print(f"\nBest alpha: {lasso_cv.alpha_}")

# Evaluate
y_pred_lasso = lasso_cv.predict(X_test_scaled)
print(f"R-squared: {r2_score(y_test, y_pred_lasso):.4f}")
print(f"RMSE: {np.sqrt(mean_squared_error(y_test, y_pred_lasso)):.4f}")

# Feature selection (Lasso can zero out coefficients)
selected_features = np.where(np.abs(lasso_cv.coef_) > 1e-10)[0]
print(f"\nSelected features ({len(selected_features)}/{len(housing.feature_names)}):")
for idx in selected_features:
    print(f"  {housing.feature_names[idx]}: {lasso_cv.coef_[idx]:.4f}")
```

### Elastic Net

Elastic Net combines L1 and L2 regularization:

$$\min_{\mathbf{w}} \frac{1}{2n}\|\mathbf{y} - \mathbf{X}\mathbf{w}\|_2^2 + \alpha\rho\|\mathbf{w}\|_1 + \frac{\alpha(1-\rho)}{2}\|\mathbf{w}\|_2^2$$

Where $\rho$ (l1_ratio in scikit-learn) controls the mix:
- $\rho = 1$: Pure Lasso
- $\rho = 0$: Pure Ridge

```python
from sklearn.linear_model import ElasticNet, ElasticNetCV

# Elastic Net with cross-validation
elastic_cv = ElasticNetCV(
    l1_ratio=[0.1, 0.5, 0.7, 0.9, 0.95, 0.99, 1],  # Mix of L1/L2
    alphas=[0.001, 0.01, 0.1, 1.0],
    cv=5,
    max_iter=10000
)
elastic_cv.fit(X_train_scaled, y_train)

print(f"\nBest alpha: {elastic_cv.alpha_}")
print(f"Best l1_ratio: {elastic_cv.l1_ratio_}")

# Evaluate
y_pred_elastic = elastic_cv.predict(X_test_scaled)
print(f"R-squared: {r2_score(y_test, y_pred_elastic):.4f}")
print(f"RMSE: {np.sqrt(mean_squared_error(y_test, y_pred_elastic)):.4f}")

# Count non-zero coefficients
n_nonzero = np.sum(np.abs(elastic_cv.coef_) > 1e-10)
print(f"Non-zero coefficients: {n_nonzero}/{len(elastic_cv.coef_)}")
```

### Comparison Summary

```python
from sklearn.linear_model import LinearRegression

# Compare all models
models = {
    'Linear Regression': LinearRegression(),
    'Ridge': RidgeCV(alphas=[0.01, 0.1, 1.0, 10.0, 100.0], cv=5),
    'Lasso': LassoCV(alphas=[0.001, 0.01, 0.1, 1.0], cv=5, max_iter=10000),
    'Elastic Net': ElasticNetCV(l1_ratio=[0.1, 0.5, 0.9], cv=5, max_iter=10000)
}

results = []
for name, model in models.items():
    model.fit(X_train_scaled, y_train)
    y_pred = model.predict(X_test_scaled)

    # Get coefficients
    if hasattr(model, 'coef_'):
        coef = model.coef_
    else:
        coef = model.coef_

    n_nonzero = np.sum(np.abs(coef) > 1e-10)

    results.append({
        'Model': name,
        'R-squared': r2_score(y_test, y_pred),
        'RMSE': np.sqrt(mean_squared_error(y_test, y_pred)),
        'Non-zero Coefs': n_nonzero
    })

results_df = pd.DataFrame(results)
print("\nModel Comparison:")
print(results_df.to_string(index=False))
```

## Regularized Logistic Regression

Regularization is equally important for logistic regression to prevent overfitting.

### L2 Regularized Logistic Regression

```python
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report

# Generate high-dimensional data
X, y = make_classification(
    n_samples=1000,
    n_features=100,
    n_informative=10,
    n_redundant=20,
    random_state=42
)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# L2 regularized logistic regression
# C is the inverse of regularization strength (smaller C = stronger regularization)
lr_l2 = LogisticRegression(penalty='l2', C=1.0, solver='lbfgs', max_iter=1000)
lr_l2.fit(X_train_scaled, y_train)

print("L2 Regularized Logistic Regression:")
print(classification_report(y_test, lr_l2.predict(X_test_scaled)))
```

### L1 Regularized Logistic Regression

```python
# L1 regularized logistic regression (requires saga or liblinear solver)
lr_l1 = LogisticRegression(penalty='l1', C=1.0, solver='saga', max_iter=1000)
lr_l1.fit(X_train_scaled, y_train)

print("L1 Regularized Logistic Regression:")
print(classification_report(y_test, lr_l1.predict(X_test_scaled)))
print(f"Non-zero coefficients: {np.sum(np.abs(lr_l1.coef_) > 1e-10)}/{lr_l1.coef_.size}")
```

### Elastic Net Logistic Regression

```python
# Elastic Net regularized logistic regression
lr_elastic = LogisticRegression(
    penalty='elasticnet',
    C=1.0,
    solver='saga',
    l1_ratio=0.5,
    max_iter=1000
)
lr_elastic.fit(X_train_scaled, y_train)

print("Elastic Net Logistic Regression:")
print(classification_report(y_test, lr_elastic.predict(X_test_scaled)))
```

### Hyperparameter Tuning

```python
from sklearn.model_selection import GridSearchCV

# Grid search for optimal regularization
param_grid = {
    'C': [0.001, 0.01, 0.1, 1.0, 10.0, 100.0],
    'penalty': ['l1', 'l2']
}

grid_search = GridSearchCV(
    LogisticRegression(solver='saga', max_iter=1000),
    param_grid,
    cv=5,
    scoring='accuracy',
    n_jobs=-1
)

grid_search.fit(X_train_scaled, y_train)

print(f"Best parameters: {grid_search.best_params_}")
print(f"Best CV score: {grid_search.best_score_:.4f}")

# Evaluate best model
best_model = grid_search.best_estimator_
y_pred = best_model.predict(X_test_scaled)
print(f"Test accuracy: {accuracy_score(y_test, y_pred):.4f}")
```

## Complete Pipeline Example

A comprehensive example combining all concepts:

### Regression Pipeline

```python
import numpy as np
import pandas as pd
from sklearn.datasets import fetch_california_housing
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
from sklearn.linear_model import LinearRegression, Ridge, Lasso, ElasticNet
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import warnings
warnings.filterwarnings('ignore')

# Load data
housing = fetch_california_housing()
X = pd.DataFrame(housing.data, columns=housing.feature_names)
y = housing.target

print(f"Dataset shape: {X.shape}")
print(f"Features: {list(X.columns)}")

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Define models with pipelines
pipelines = {
    'Linear Regression': Pipeline([
        ('scaler', StandardScaler()),
        ('regressor', LinearRegression())
    ]),
    'Ridge': Pipeline([
        ('scaler', StandardScaler()),
        ('regressor', Ridge(alpha=1.0))
    ]),
    'Lasso': Pipeline([
        ('scaler', StandardScaler()),
        ('regressor', Lasso(alpha=0.01, max_iter=10000))
    ]),
    'ElasticNet': Pipeline([
        ('scaler', StandardScaler()),
        ('regressor', ElasticNet(alpha=0.01, l1_ratio=0.5, max_iter=10000))
    ]),
    'Polynomial Ridge': Pipeline([
        ('scaler', StandardScaler()),
        ('poly', PolynomialFeatures(degree=2, include_bias=False)),
        ('regressor', Ridge(alpha=10.0))
    ])
}

# Train and evaluate all models
results = []
for name, pipeline in pipelines.items():
    # Cross-validation
    cv_scores = cross_val_score(pipeline, X_train, y_train, cv=5, scoring='r2')

    # Train and test
    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)

    results.append({
        'Model': name,
        'CV R2 Mean': cv_scores.mean(),
        'CV R2 Std': cv_scores.std(),
        'Test R2': r2_score(y_test, y_pred),
        'Test RMSE': np.sqrt(mean_squared_error(y_test, y_pred)),
        'Test MAE': mean_absolute_error(y_test, y_pred)
    })

results_df = pd.DataFrame(results)
print("\n" + "=" * 80)
print("Model Comparison Results")
print("=" * 80)
print(results_df.to_string(index=False))

# Hyperparameter tuning for best model (Ridge with polynomial features)
print("\n" + "=" * 80)
print("Hyperparameter Tuning for Polynomial Ridge")
print("=" * 80)

param_grid = {
    'poly__degree': [1, 2, 3],
    'regressor__alpha': [0.01, 0.1, 1.0, 10.0, 100.0]
}

pipeline_tune = Pipeline([
    ('scaler', StandardScaler()),
    ('poly', PolynomialFeatures(include_bias=False)),
    ('regressor', Ridge())
])

grid_search = GridSearchCV(
    pipeline_tune,
    param_grid,
    cv=5,
    scoring='r2',
    n_jobs=-1
)

grid_search.fit(X_train, y_train)

print(f"Best parameters: {grid_search.best_params_}")
print(f"Best CV R2: {grid_search.best_score_:.4f}")

y_pred_best = grid_search.predict(X_test)
print(f"Test R2: {r2_score(y_test, y_pred_best):.4f}")
print(f"Test RMSE: {np.sqrt(mean_squared_error(y_test, y_pred_best)):.4f}")
```

### Classification Pipeline

```python
import numpy as np
import pandas as pd
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import (classification_report, roc_auc_score,
                           confusion_matrix, precision_recall_curve)
import matplotlib.pyplot as plt

# Load data
data = load_breast_cancer()
X = pd.DataFrame(data.data, columns=data.feature_names)
y = data.target

print(f"Dataset shape: {X.shape}")
print(f"Class distribution: {np.bincount(y)}")
print(f"Class names: {data.target_names}")

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Define logistic regression variants
models = {
    'No Regularization': LogisticRegression(penalty=None, solver='lbfgs', max_iter=1000),
    'L2 (C=0.1)': LogisticRegression(penalty='l2', C=0.1, solver='lbfgs', max_iter=1000),
    'L2 (C=1.0)': LogisticRegression(penalty='l2', C=1.0, solver='lbfgs', max_iter=1000),
    'L2 (C=10.0)': LogisticRegression(penalty='l2', C=10.0, solver='lbfgs', max_iter=1000),
    'L1 (C=1.0)': LogisticRegression(penalty='l1', C=1.0, solver='saga', max_iter=1000),
    'Elastic Net': LogisticRegression(penalty='elasticnet', C=1.0, l1_ratio=0.5,
                                      solver='saga', max_iter=1000)
}

# Scale features first
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train and evaluate
results = []
for name, model in models.items():
    # Cross-validation
    cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring='roc_auc')

    # Train and test
    model.fit(X_train_scaled, y_train)
    y_pred = model.predict(X_test_scaled)
    y_prob = model.predict_proba(X_test_scaled)[:, 1]

    # Count non-zero coefficients
    n_nonzero = np.sum(np.abs(model.coef_) > 1e-10)

    results.append({
        'Model': name,
        'CV AUC Mean': cv_scores.mean(),
        'CV AUC Std': cv_scores.std(),
        'Test AUC': roc_auc_score(y_test, y_prob),
        'Test Accuracy': accuracy_score(y_test, y_pred),
        'Non-zero Coefs': n_nonzero
    })

results_df = pd.DataFrame(results)
print("\n" + "=" * 80)
print("Logistic Regression Comparison")
print("=" * 80)
print(results_df.to_string(index=False))

# Detailed evaluation of best model
print("\n" + "=" * 80)
print("Detailed Evaluation of L2 (C=1.0)")
print("=" * 80)

best_model = LogisticRegression(penalty='l2', C=1.0, solver='lbfgs', max_iter=1000)
best_model.fit(X_train_scaled, y_train)

y_pred = best_model.predict(X_test_scaled)
y_prob = best_model.predict_proba(X_test_scaled)[:, 1]

print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=data.target_names))

# Feature importance (absolute coefficient values)
coef_importance = pd.DataFrame({
    'Feature': data.feature_names,
    'Coefficient': best_model.coef_[0],
    'Abs_Coefficient': np.abs(best_model.coef_[0])
}).sort_values('Abs_Coefficient', ascending=False)

print("\nTop 10 Most Important Features:")
print(coef_importance.head(10).to_string(index=False))
```

## Interview Key Points

### Common Interview Questions

**Q1: What is the difference between Ridge and Lasso regression?**

Ridge (L2):
- Adds sum of squared coefficients as penalty
- Shrinks all coefficients towards zero but never exactly to zero
- Better when all features are expected to be relevant
- More stable with correlated features

Lasso (L1):
- Adds sum of absolute coefficients as penalty
- Can set coefficients exactly to zero (sparse solutions)
- Performs automatic feature selection
- May arbitrarily select one among correlated features

**Q2: When would you use Elastic Net over Ridge or Lasso?**

Elastic Net is preferred when:
- You have many correlated features (Lasso may drop all but one)
- You want feature selection (unlike Ridge) but more stability than Lasso
- The number of features exceeds the number of samples
- You want to balance the benefits of both penalties

**Q3: Why does feature scaling matter for linear models with regularization?**

Regularization penalizes coefficient magnitudes. Without scaling:
- Features with larger scales have smaller coefficients
- Features with smaller scales have larger coefficients
- The penalty becomes biased toward features with larger scales
- Scaling ensures the penalty treats all features equally

**Q4: Explain the closed-form solution vs gradient descent for linear regression.**

Normal Equation (Closed-form):
- Direct solution: $\mathbf{w} = (\mathbf{X}^T\mathbf{X})^{-1}\mathbf{X}^T\mathbf{y}$
- No hyperparameters to tune
- Computationally expensive for large feature sets ($O(p^3)$)
- May be unstable if $\mathbf{X}^T\mathbf{X}$ is singular

Gradient Descent:
- Iterative optimization
- Requires learning rate tuning
- Scales better to large datasets ($O(np)$ per iteration)
- Can handle datasets that do not fit in memory (SGD)

**Q5: What is the intuition behind logistic regression's decision boundary?**

The logistic function transforms the linear combination $\mathbf{w}^T\mathbf{x}$ to probabilities. The decision boundary is where $P(y=1) = 0.5$, which occurs when $\mathbf{w}^T\mathbf{x} = 0$. This is a hyperplane in feature space, making logistic regression a linear classifier. Non-linear boundaries require feature engineering or kernel methods.

**Q6: How do you handle multiclass classification with logistic regression?**

Two main approaches:

One-vs-Rest (OvR):
- Train K binary classifiers
- Each classifier distinguishes one class from all others
- Prediction: class with highest confidence

Multinomial (Softmax):
- Single model with K output probabilities
- Uses softmax function to ensure probabilities sum to 1
- More principled probabilistic interpretation
- Generally preferred in modern implementations

### Best Practices Summary

1. **Always scale features** when using regularization
2. **Use cross-validation** to select regularization strength
3. **Start with L2 regularization** as a default; switch to L1 or Elastic Net if sparsity is needed
4. **Check for multicollinearity** before applying Lasso (consider Elastic Net instead)
5. **Interpret coefficients carefully** - they represent the change in output per unit change in feature (after scaling)
6. **Use appropriate solvers**:
   - L2: 'lbfgs', 'newton-cg', 'sag'
   - L1: 'saga', 'liblinear'
   - Elastic Net: 'saga'
7. **Monitor convergence** - increase max_iter if warnings appear

## Further Reading

### Recommended Books

- **"The Elements of Statistical Learning"** (Hastie, Tibshirani, Friedman): Comprehensive treatment of regularization and model selection
- **"Pattern Recognition and Machine Learning"** (Bishop): Probabilistic perspective on linear models
- **"An Introduction to Statistical Learning"** (James, Witten, Hastie, Tibshirani): Accessible introduction with R examples
- **"Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow"** (Geron): Practical Python implementation guide

### Online Resources

- **Scikit-learn Documentation**: Excellent API reference and examples for all linear models
- **Stanford CS229 Machine Learning**: Lecture notes on linear models and regularization
- **StatQuest**: Clear visual explanations of Ridge, Lasso, and Elastic Net
- **Coursera Machine Learning Specialization**: Andrew Ng's foundational course

### Advanced Topics

- **Generalized Linear Models (GLMs)**: Extension to exponential family distributions
- **Bayesian Linear Regression**: Probabilistic formulation with uncertainty quantification
- **Kernel Methods**: Non-linear extensions via the kernel trick
- **Coordinate Descent**: Efficient optimization algorithm for Lasso
- **LARS (Least Angle Regression)**: Efficient algorithm for computing Lasso solution path
- **Group Lasso**: Regularization for grouped features
- **Sparse Logistic Regression**: Feature selection in classification

## Summary

Linear models remain fundamental tools in machine learning due to their interpretability, efficiency, and solid theoretical foundations. This guide covered:

1. **Linear Regression**: Modeling linear relationships between features and continuous targets
2. **Least Squares Method**: Analytical and geometric understanding of the OLS solution
3. **Gradient Descent**: Iterative optimization for large-scale problems
4. **Logistic Regression**: Classification using the sigmoid function and log loss
5. **Multiclass Classification**: One-vs-Rest and Softmax approaches
6. **Regularization**: L1 (Lasso), L2 (Ridge), and Elastic Net for preventing overfitting
7. **Practical Implementation**: Complete pipelines using Scikit-learn

Key takeaways:

- **Start simple**: Linear models often provide strong baselines
- **Regularization is essential**: Prevents overfitting, especially with many features
- **Feature engineering matters**: Good features can make linear models competitive with complex algorithms
- **Interpretability is valuable**: Coefficients have clear meaning for decision-making
- **Scale your features**: Essential for regularized models and gradient-based optimization

Linear models are not just building blocks for understanding machine learning; they are practical tools that solve real problems efficiently. Master them thoroughly before moving to more complex algorithms.
