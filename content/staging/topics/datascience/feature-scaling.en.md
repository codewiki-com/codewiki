---
title: "Feature Engineering: Feature Transformation and Dimensionality Reduction"
description: "Master feature transformation: standardization, normalization, feature crossing, and dimensionality reduction"
track: datascience
section: classical-ml
difficulty: intermediate
tags:
  - feature transformation
  - dimensionality reduction
  - PCA
  - standardization
status: imported
origin: old/src/content/docs/datascience/feature-scaling.en.md
divergence: 0.209
issues:
  - title-lang-zh
  - title-language
legacy:
  category: DataScience
  subcategory: FeatureEngineering
  order: 10
  lastUpdated: 2026-01-07
---

Feature transformation is one of the most critical steps in the machine learning pipeline. Raw data rarely comes in a format that is optimal for model training. Through careful feature transformation, we can improve model performance, reduce training time, and extract more meaningful patterns from data. This comprehensive guide covers the essential techniques every data scientist should master, from basic scaling methods to advanced dimensionality reduction algorithms.

## Why Feature Transformation Matters

Before diving into specific techniques, it is important to understand why feature transformation is essential:

1. **Algorithm Requirements**: Many machine learning algorithms assume features are on similar scales. Gradient descent converges faster when features are normalized.

2. **Distance-Based Methods**: Algorithms like KNN, K-Means, and SVM rely on distance calculations that can be dominated by features with larger magnitudes.

3. **Regularization Fairness**: L1 and L2 regularization penalize coefficients equally, which only makes sense when features are on comparable scales.

4. **Numerical Stability**: Extreme values can cause numerical overflow or underflow during computations.

5. **Feature Interpretability**: Transformed features can reveal patterns that are hidden in raw data.

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.datasets import make_classification

# Demonstrate the impact of feature scaling
np.random.seed(42)

# Create features with vastly different scales
X = np.column_stack([
    np.random.normal(0, 1, 1000),           # Feature 1: scale ~1
    np.random.normal(1000, 100, 1000),      # Feature 2: scale ~1000
    np.random.normal(0.001, 0.0001, 1000)   # Feature 3: scale ~0.001
])
y = (X[:, 0] + X[:, 1]/1000 + X[:, 2]*1000 > 1).astype(int)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Without scaling
model_unscaled = LogisticRegression(max_iter=1000)
model_unscaled.fit(X_train, y_train)
print(f"Accuracy without scaling: {model_unscaled.score(X_test, y_test):.4f}")
print(f"Coefficients: {model_unscaled.coef_[0]}")

# With scaling
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

model_scaled = LogisticRegression(max_iter=1000)
model_scaled.fit(X_train_scaled, y_train)
print(f"\nAccuracy with scaling: {model_scaled.score(X_test_scaled, y_test):.4f}")
print(f"Coefficients: {model_scaled.coef_[0]}")
```

## Standardization vs Normalization

The terms "standardization" and "normalization" are often used interchangeably, but they refer to different transformations. Understanding when to use each is crucial for effective feature engineering.

### Standardization (Z-Score Normalization)

Standardization transforms features to have zero mean and unit variance. This technique is based on the assumption that features follow a Gaussian distribution.

$$z = \frac{x - \mu}{\sigma}$$

Where:
- $x$ is the original value
- $\mu$ is the mean of the feature
- $\sigma$ is the standard deviation of the feature

**When to Use Standardization:**
- When features roughly follow a Gaussian distribution
- For algorithms that assume zero-centered data (PCA, many neural networks)
- When outliers should retain their relative position
- For regularized models (Ridge, Lasso, Elastic Net)

```python
from sklearn.preprocessing import StandardScaler
import numpy as np
import pandas as pd

# Create sample data with different distributions
np.random.seed(42)
data = pd.DataFrame({
    'age': np.random.normal(35, 10, 1000),
    'income': np.random.normal(50000, 15000, 1000),
    'score': np.random.normal(75, 12, 1000)
})

print("Original Data Statistics:")
print(data.describe())

# Apply standardization
scaler = StandardScaler()
data_standardized = pd.DataFrame(
    scaler.fit_transform(data),
    columns=data.columns
)

print("\nStandardized Data Statistics:")
print(data_standardized.describe())

# Verify: mean should be ~0, std should be ~1
print(f"\nVerification - Mean: {data_standardized.mean().values}")
print(f"Verification - Std:  {data_standardized.std().values}")

# Important: Save scaler parameters for later use
print(f"\nScaler means: {scaler.mean_}")
print(f"Scaler stds:  {scaler.scale_}")

# Transform new data using the same parameters
new_data = pd.DataFrame({
    'age': [25, 45, 60],
    'income': [30000, 70000, 100000],
    'score': [60, 80, 95]
})
new_data_standardized = scaler.transform(new_data)
print(f"\nNew data transformed:\n{new_data_standardized}")
```

### Min-Max Normalization

Min-Max normalization scales features to a fixed range, typically [0, 1] or [-1, 1].

$$x_{norm} = \frac{x - x_{min}}{x_{max} - x_{min}}$$

For a custom range [a, b]:

$$x_{scaled} = a + \frac{(x - x_{min})(b - a)}{x_{max} - x_{min}}$$

**When to Use Min-Max Normalization:**
- When you need bounded values (e.g., image pixels, neural network inputs)
- When the distribution is not Gaussian
- When you want to preserve zero values
- For algorithms that expect input in a specific range

```python
from sklearn.preprocessing import MinMaxScaler

# Sample data
np.random.seed(42)
data = pd.DataFrame({
    'feature_a': np.random.exponential(5, 1000),
    'feature_b': np.random.uniform(10, 100, 1000),
    'feature_c': np.random.beta(2, 5, 1000) * 50
})

print("Original Data Range:")
print(f"Min:\n{data.min()}")
print(f"Max:\n{data.max()}")

# Default [0, 1] range
scaler_01 = MinMaxScaler()
data_01 = pd.DataFrame(
    scaler_01.fit_transform(data),
    columns=data.columns
)

print("\nNormalized to [0, 1]:")
print(f"Min:\n{data_01.min()}")
print(f"Max:\n{data_01.max()}")

# Custom [-1, 1] range
scaler_11 = MinMaxScaler(feature_range=(-1, 1))
data_11 = pd.DataFrame(
    scaler_11.fit_transform(data),
    columns=data.columns
)

print("\nNormalized to [-1, 1]:")
print(f"Min:\n{data_11.min()}")
print(f"Max:\n{data_11.max()}")
```

### Robust Scaling

Robust scaling uses statistics that are robust to outliers: the median and the interquartile range (IQR).

$$x_{robust} = \frac{x - Q_{50}}{Q_{75} - Q_{25}}$$

**When to Use Robust Scaling:**
- When data contains significant outliers
- When you want to reduce the influence of extreme values
- For datasets where outliers are valid data points (not errors)

```python
from sklearn.preprocessing import RobustScaler

# Create data with outliers
np.random.seed(42)
normal_data = np.random.normal(50, 10, 1000)
outliers = np.array([200, 250, 300, -100, -150])
data_with_outliers = np.concatenate([normal_data, outliers]).reshape(-1, 1)

# Compare different scalers
scalers = {
    'StandardScaler': StandardScaler(),
    'MinMaxScaler': MinMaxScaler(),
    'RobustScaler': RobustScaler()
}

fig, axes = plt.subplots(2, 2, figsize=(12, 10))
axes = axes.flatten()

# Original data
axes[0].hist(data_with_outliers, bins=50, edgecolor='black')
axes[0].set_title('Original Data (with outliers)')
axes[0].axvline(x=np.median(data_with_outliers), color='r', linestyle='--', label='Median')
axes[0].legend()

for i, (name, scaler) in enumerate(scalers.items(), 1):
    scaled_data = scaler.fit_transform(data_with_outliers)
    axes[i].hist(scaled_data, bins=50, edgecolor='black')
    axes[i].set_title(f'{name}')
    axes[i].axvline(x=np.median(scaled_data), color='r', linestyle='--')

plt.tight_layout()
plt.show()

# Quantitative comparison
print("Effect of Outliers on Different Scalers:")
print("-" * 60)
for name, scaler in scalers.items():
    scaled = scaler.fit_transform(data_with_outliers)
    print(f"{name:20} - Range: [{scaled.min():.2f}, {scaled.max():.2f}], "
          f"Mean: {scaled.mean():.2f}, Median: {np.median(scaled):.2f}")
```

### Comparison and Selection Guide

| Scaler | Preserves Outliers | Bounded Output | Handles Sparse Data | Best For |
|--------|-------------------|----------------|---------------------|----------|
| StandardScaler | Yes | No | Yes (with_mean=False) | Gaussian-like data, PCA |
| MinMaxScaler | No | Yes | No | Neural networks, image data |
| RobustScaler | No | No | Yes | Data with outliers |
| MaxAbsScaler | Yes | [-1, 1] | Yes | Sparse data |

```python
from sklearn.preprocessing import MaxAbsScaler

# Decision framework for scaler selection
def recommend_scaler(data, has_outliers=False, needs_bounded=False,
                     is_sparse=False, is_gaussian=True):
    """
    Recommend appropriate scaler based on data characteristics.
    """
    recommendations = []

    if is_sparse:
        recommendations.append("MaxAbsScaler (preserves sparsity)")
        if has_outliers:
            recommendations.append("RobustScaler (with_centering=False)")
    elif has_outliers:
        recommendations.append("RobustScaler (robust to outliers)")
    elif needs_bounded:
        recommendations.append("MinMaxScaler (bounded output)")
    elif is_gaussian:
        recommendations.append("StandardScaler (optimal for Gaussian data)")
    else:
        recommendations.append("MinMaxScaler or QuantileTransformer")

    return recommendations

# Example usage
print("Scenario 1: Data with outliers")
print(recommend_scaler(None, has_outliers=True))

print("\nScenario 2: Neural network input")
print(recommend_scaler(None, needs_bounded=True))

print("\nScenario 3: Sparse text data")
print(recommend_scaler(None, is_sparse=True))
```

## Numerical Transformations

Beyond scaling, various mathematical transformations can help normalize distributions, stabilize variance, and improve model performance.

### Log Transformation

Log transformation is effective for right-skewed data (positive skewness). It compresses large values and expands small values.

$$x_{log} = \log(x + c)$$

Where $c$ is a constant (often 1) to handle zero values.

**When to Use:**
- Right-skewed distributions (income, population, prices)
- Multiplicative relationships
- When variance increases with the mean
- Data spanning multiple orders of magnitude

```python
import numpy as np
import matplotlib.pyplot as plt
from scipy import stats

# Generate right-skewed data (like income or house prices)
np.random.seed(42)
skewed_data = np.random.lognormal(mean=10, sigma=1, size=5000)

# Log transformation
log_data = np.log1p(skewed_data)  # log(1 + x) to handle potential zeros

fig, axes = plt.subplots(2, 2, figsize=(12, 10))

# Original distribution
axes[0, 0].hist(skewed_data, bins=50, edgecolor='black', density=True)
axes[0, 0].set_title(f'Original Data (Skewness: {stats.skew(skewed_data):.2f})')
axes[0, 0].set_xlabel('Value')

# Log-transformed distribution
axes[0, 1].hist(log_data, bins=50, edgecolor='black', density=True)
axes[0, 1].set_title(f'Log-Transformed (Skewness: {stats.skew(log_data):.2f})')
axes[0, 1].set_xlabel('log(1 + Value)')

# Q-Q plots
stats.probplot(skewed_data, dist="norm", plot=axes[1, 0])
axes[1, 0].set_title('Q-Q Plot: Original')

stats.probplot(log_data, dist="norm", plot=axes[1, 1])
axes[1, 1].set_title('Q-Q Plot: Log-Transformed')

plt.tight_layout()
plt.show()

# Practical example: House prices
house_prices = pd.DataFrame({
    'price': [150000, 200000, 175000, 450000, 280000, 1200000, 350000, 195000],
    'sqft': [1200, 1500, 1350, 2800, 1800, 4500, 2200, 1400]
})

house_prices['log_price'] = np.log1p(house_prices['price'])
house_prices['log_sqft'] = np.log1p(house_prices['sqft'])

print("House Prices Data:")
print(house_prices)
print(f"\nOriginal price skewness: {stats.skew(house_prices['price']):.2f}")
print(f"Log price skewness: {stats.skew(house_prices['log_price']):.2f}")
```

### Box-Cox Transformation

Box-Cox transformation is a family of power transformations that can handle various distributions. It finds the optimal lambda value to normalize data.

$$y(\lambda) = \begin{cases}
\frac{x^\lambda - 1}{\lambda} & \text{if } \lambda \neq 0 \\
\ln(x) & \text{if } \lambda = 0
\end{cases}$$

**Requirements:**
- Data must be strictly positive (x > 0)
- Scikit-learn's PowerTransformer can handle zero and negative values with Yeo-Johnson

```python
from sklearn.preprocessing import PowerTransformer
from scipy import stats
import numpy as np

# Generate various skewed distributions
np.random.seed(42)
distributions = {
    'Right-skewed': np.random.exponential(2, 1000),
    'Left-skewed': 10 - np.random.exponential(2, 1000),
    'Heavy-tailed': np.random.standard_t(df=3, size=1000)
}

fig, axes = plt.subplots(3, 3, figsize=(15, 12))

for i, (name, data) in enumerate(distributions.items()):
    # Original
    axes[i, 0].hist(data, bins=50, edgecolor='black', density=True)
    axes[i, 0].set_title(f'{name} - Original\nSkewness: {stats.skew(data):.2f}')

    # Box-Cox (for positive data) or Yeo-Johnson
    pt_bc = PowerTransformer(method='yeo-johnson')
    data_bc = pt_bc.fit_transform(data.reshape(-1, 1)).flatten()
    axes[i, 1].hist(data_bc, bins=50, edgecolor='black', density=True)
    axes[i, 1].set_title(f'Yeo-Johnson (lambda={pt_bc.lambdas_[0]:.2f})\nSkewness: {stats.skew(data_bc):.2f}')

    # Standard Normal for reference
    normal_data = np.random.normal(0, 1, 1000)
    axes[i, 2].hist(normal_data, bins=50, edgecolor='black', density=True)
    axes[i, 2].set_title(f'Standard Normal\nSkewness: {stats.skew(normal_data):.2f}')

plt.tight_layout()
plt.show()

# Box-Cox for strictly positive data
positive_data = np.random.exponential(5, 1000) + 0.1
boxcox_data, fitted_lambda = stats.boxcox(positive_data)
print(f"Box-Cox optimal lambda: {fitted_lambda:.4f}")
print(f"Original skewness: {stats.skew(positive_data):.4f}")
print(f"Transformed skewness: {stats.skew(boxcox_data):.4f}")
```

### Quantile Transformation

Quantile transformation maps the data to a specified distribution (uniform or normal) using the quantile function. This is a non-linear transformation that can handle any distribution.

```python
from sklearn.preprocessing import QuantileTransformer

# Create heavily skewed data
np.random.seed(42)
skewed = np.random.exponential(3, 5000).reshape(-1, 1)

# Transform to uniform distribution
qt_uniform = QuantileTransformer(output_distribution='uniform', random_state=42)
uniform_data = qt_uniform.fit_transform(skewed)

# Transform to normal distribution
qt_normal = QuantileTransformer(output_distribution='normal', random_state=42)
normal_data = qt_normal.fit_transform(skewed)

fig, axes = plt.subplots(1, 3, figsize=(15, 4))

axes[0].hist(skewed, bins=50, edgecolor='black', density=True)
axes[0].set_title(f'Original (Skewness: {stats.skew(skewed.flatten()):.2f})')

axes[1].hist(uniform_data, bins=50, edgecolor='black', density=True)
axes[1].set_title('Quantile Transform -> Uniform')

axes[2].hist(normal_data, bins=50, edgecolor='black', density=True)
axes[2].set_title(f'Quantile Transform -> Normal (Skewness: {stats.skew(normal_data.flatten()):.2f})')

plt.tight_layout()
plt.show()

# Important: QuantileTransformer is sensitive to outliers in new data
print("Note: Values outside training range will be clipped to min/max quantile")
```

### Transformation Selection Guide

| Transformation | Best For | Handles Zeros | Handles Negatives | Interpretable |
|----------------|----------|---------------|-------------------|---------------|
| Log | Right-skewed, multiplicative | With +c | No | Yes |
| Square Root | Count data, moderate skew | Yes | No | Yes |
| Box-Cox | Various skewness, need optimal | No (need shift) | No | Lambda value |
| Yeo-Johnson | Various skewness | Yes | Yes | Lambda value |
| Quantile | Any distribution | Yes | Yes | No |

```python
# Comprehensive transformation comparison function
def compare_transformations(data, title="Transformation Comparison"):
    """Compare multiple transformation methods on the same data."""
    from sklearn.preprocessing import FunctionTransformer

    transformations = {
        'Original': data.copy(),
        'Log(1+x)': np.log1p(np.maximum(data, 0)),
        'Sqrt': np.sqrt(np.maximum(data, 0)),
        'Yeo-Johnson': PowerTransformer(method='yeo-johnson').fit_transform(data.reshape(-1, 1)).flatten(),
        'Quantile-Normal': QuantileTransformer(output_distribution='normal', random_state=42).fit_transform(data.reshape(-1, 1)).flatten()
    }

    fig, axes = plt.subplots(1, len(transformations), figsize=(20, 4))

    for ax, (name, transformed) in zip(axes, transformations.items()):
        ax.hist(transformed, bins=50, edgecolor='black', density=True)
        skewness = stats.skew(transformed[~np.isnan(transformed)])
        ax.set_title(f'{name}\nSkewness: {skewness:.2f}')

    plt.suptitle(title, fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.show()

# Example usage
np.random.seed(42)
test_data = np.random.lognormal(3, 1.5, 3000)
compare_transformations(test_data, "Income-like Data")
```

## Feature Crossing and Interaction

Feature crossing creates new features by combining existing ones. This can capture non-linear relationships and interactions that linear models cannot learn directly.

### Manual Feature Crossing

```python
import pandas as pd
import numpy as np
from sklearn.preprocessing import PolynomialFeatures

# Sample e-commerce data
np.random.seed(42)
data = pd.DataFrame({
    'user_age': np.random.randint(18, 65, 1000),
    'session_duration': np.random.exponential(10, 1000),
    'pages_viewed': np.random.poisson(5, 1000),
    'is_mobile': np.random.binomial(1, 0.6, 1000),
    'day_of_week': np.random.randint(0, 7, 1000)
})

# Manual feature crosses
data['age_x_duration'] = data['user_age'] * data['session_duration']
data['pages_per_minute'] = data['pages_viewed'] / (data['session_duration'] + 1)
data['mobile_duration'] = data['is_mobile'] * data['session_duration']
data['is_weekend'] = (data['day_of_week'] >= 5).astype(int)
data['weekend_x_mobile'] = data['is_weekend'] * data['is_mobile']

# Age bins for categorical crossing
data['age_group'] = pd.cut(data['user_age'],
                           bins=[0, 25, 35, 50, 100],
                           labels=['young', 'adult', 'middle', 'senior'])

print("Feature Crosses Created:")
print(data.head())
print(f"\nNew feature statistics:")
print(data[['age_x_duration', 'pages_per_minute', 'mobile_duration']].describe())
```

### Polynomial Features

Polynomial features generate higher-order terms and interactions automatically.

```python
from sklearn.preprocessing import PolynomialFeatures

# Simple example
X = np.array([[1, 2], [3, 4], [5, 6]])

# Degree 2 polynomial features
poly = PolynomialFeatures(degree=2, include_bias=False)
X_poly = poly.fit_transform(X)

print("Original features: x1, x2")
print(X)
print(f"\nPolynomial features: {poly.get_feature_names_out(['x1', 'x2'])}")
print(X_poly)

# Practical example: Predicting house prices
np.random.seed(42)
n_samples = 500

sqft = np.random.uniform(800, 3000, n_samples)
bedrooms = np.random.randint(1, 6, n_samples)
bathrooms = np.random.randint(1, 4, n_samples)

# True relationship has interactions
true_price = (100 * sqft +
              20000 * bedrooms +
              15000 * bathrooms +
              50 * sqft * bedrooms / 1000 +  # Interaction
              0.01 * sqft ** 2 / 1000 +      # Non-linear
              np.random.normal(0, 20000, n_samples))

X = np.column_stack([sqft, bedrooms, bathrooms])
y = true_price

from sklearn.linear_model import LinearRegression
from sklearn.model_selection import cross_val_score

# Without polynomial features
lr_simple = LinearRegression()
scores_simple = cross_val_score(lr_simple, X, y, cv=5, scoring='r2')
print(f"\nLinear model R2: {scores_simple.mean():.4f} (+/- {scores_simple.std()*2:.4f})")

# With polynomial features
poly = PolynomialFeatures(degree=2, include_bias=False)
X_poly = poly.fit_transform(X)
lr_poly = LinearRegression()
scores_poly = cross_val_score(lr_poly, X_poly, y, cv=5, scoring='r2')
print(f"Polynomial model R2: {scores_poly.mean():.4f} (+/- {scores_poly.std()*2:.4f})")

print(f"\nPolynomial features generated: {X_poly.shape[1]}")
print(f"Feature names: {poly.get_feature_names_out(['sqft', 'beds', 'baths'])}")
```

### Feature Crossing for Categorical Variables

```python
import pandas as pd
from sklearn.preprocessing import OneHotEncoder

# Categorical data
data = pd.DataFrame({
    'color': ['red', 'blue', 'green', 'red', 'blue'],
    'size': ['S', 'M', 'L', 'M', 'S'],
    'material': ['cotton', 'silk', 'cotton', 'wool', 'silk']
})

# Create crossed feature
data['color_size'] = data['color'] + '_' + data['size']
data['full_combo'] = data['color'] + '_' + data['size'] + '_' + data['material']

print("Original + Crossed Features:")
print(data)

# One-hot encode the crossed features
encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
crossed_encoded = encoder.fit_transform(data[['color_size']])
print(f"\nOne-hot encoded crossed feature shape: {crossed_encoded.shape}")
print(f"Categories: {encoder.categories_[0]}")
```

### Interaction Features in Practice

```python
from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GridSearchCV
from sklearn.datasets import make_classification

# Create a classification problem with interactions
np.random.seed(42)
X, y = make_classification(n_samples=1000, n_features=4, n_informative=2,
                           n_redundant=0, random_state=42)

# Add meaningful feature names
feature_names = ['feature_A', 'feature_B', 'feature_C', 'feature_D']

# Pipeline with polynomial features
pipeline = Pipeline([
    ('poly', PolynomialFeatures(include_bias=False)),
    ('scaler', StandardScaler()),
    ('classifier', LogisticRegression(max_iter=1000))
])

# Grid search for optimal polynomial degree
param_grid = {
    'poly__degree': [1, 2, 3],
    'poly__interaction_only': [True, False],
    'classifier__C': [0.1, 1, 10]
}

grid_search = GridSearchCV(pipeline, param_grid, cv=5, scoring='accuracy', n_jobs=-1)
grid_search.fit(X, y)

print(f"Best parameters: {grid_search.best_params_}")
print(f"Best CV accuracy: {grid_search.best_score_:.4f}")

# Feature importance with interactions
best_model = grid_search.best_estimator_
poly = best_model.named_steps['poly']
classifier = best_model.named_steps['classifier']

feature_names_poly = poly.get_feature_names_out(feature_names)
coef_importance = pd.DataFrame({
    'feature': feature_names_poly,
    'coefficient': classifier.coef_[0]
}).sort_values('coefficient', key=abs, ascending=False)

print("\nTop 10 Most Important Features (by coefficient magnitude):")
print(coef_importance.head(10))
```

## Principal Component Analysis (PCA)

PCA is the most widely used dimensionality reduction technique. It finds orthogonal directions (principal components) that maximize variance in the data.

### PCA Fundamentals

PCA works by:
1. Centering the data (subtracting the mean)
2. Computing the covariance matrix
3. Finding eigenvalues and eigenvectors
4. Projecting data onto the top k eigenvectors

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

# Generate correlated 2D data
np.random.seed(42)
n_samples = 500

# Create correlated features
mean = [0, 0]
cov = [[1, 0.8], [0.8, 1]]
X = np.random.multivariate_normal(mean, cov, n_samples)

# Fit PCA
pca = PCA()
X_pca = pca.fit_transform(X)

# Visualize
fig, axes = plt.subplots(1, 3, figsize=(15, 5))

# Original data with principal components
axes[0].scatter(X[:, 0], X[:, 1], alpha=0.5)
origin = pca.mean_
for i, (comp, var) in enumerate(zip(pca.components_, pca.explained_variance_)):
    axes[0].annotate('', xy=origin + comp * np.sqrt(var) * 2,
                     xytext=origin,
                     arrowprops=dict(arrowstyle='->', color='red', lw=2))
axes[0].set_xlabel('Feature 1')
axes[0].set_ylabel('Feature 2')
axes[0].set_title('Original Data with Principal Components')
axes[0].axis('equal')

# Transformed data
axes[1].scatter(X_pca[:, 0], X_pca[:, 1], alpha=0.5)
axes[1].set_xlabel('PC1')
axes[1].set_ylabel('PC2')
axes[1].set_title('PCA Transformed Data')
axes[1].axis('equal')

# Explained variance
axes[2].bar([1, 2], pca.explained_variance_ratio_, color='steelblue')
axes[2].set_xlabel('Principal Component')
axes[2].set_ylabel('Explained Variance Ratio')
axes[2].set_title(f'Total Variance Explained: {sum(pca.explained_variance_ratio_)*100:.1f}%')

plt.tight_layout()
plt.show()

print(f"Explained variance ratio: {pca.explained_variance_ratio_}")
print(f"Components:\n{pca.components_}")
```

### Choosing the Number of Components

```python
from sklearn.datasets import load_digits

# Load high-dimensional data
digits = load_digits()
X = digits.data
y = digits.target

print(f"Original data shape: {X.shape}")

# Standardize before PCA
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Fit PCA with all components
pca_full = PCA()
pca_full.fit(X_scaled)

# Plot cumulative explained variance
cumulative_variance = np.cumsum(pca_full.explained_variance_ratio_)

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Scree plot
axes[0].plot(range(1, len(pca_full.explained_variance_ratio_) + 1),
             pca_full.explained_variance_ratio_, 'bo-')
axes[0].set_xlabel('Principal Component')
axes[0].set_ylabel('Explained Variance Ratio')
axes[0].set_title('Scree Plot')

# Cumulative variance
axes[1].plot(range(1, len(cumulative_variance) + 1), cumulative_variance, 'ro-')
axes[1].axhline(y=0.95, color='k', linestyle='--', label='95% threshold')
axes[1].axhline(y=0.99, color='g', linestyle='--', label='99% threshold')
axes[1].set_xlabel('Number of Components')
axes[1].set_ylabel('Cumulative Explained Variance')
axes[1].set_title('Cumulative Explained Variance')
axes[1].legend()

plt.tight_layout()
plt.show()

# Find number of components for different thresholds
for threshold in [0.90, 0.95, 0.99]:
    n_components = np.argmax(cumulative_variance >= threshold) + 1
    print(f"{threshold*100:.0f}% variance explained with {n_components} components")

# Automatic selection with variance threshold
pca_auto = PCA(n_components=0.95)
X_reduced = pca_auto.fit_transform(X_scaled)
print(f"\nWith 95% variance threshold:")
print(f"  Components: {pca_auto.n_components_}")
print(f"  Reduced shape: {X_reduced.shape}")
```

### PCA for Visualization

```python
from sklearn.datasets import load_iris, fetch_openml
from sklearn.decomposition import PCA

# Load iris dataset
iris = load_iris()
X, y = iris.data, iris.target

# Standardize and apply PCA
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)

# Visualize
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# 2D PCA plot
scatter = axes[0].scatter(X_pca[:, 0], X_pca[:, 1], c=y, cmap='viridis', alpha=0.7)
axes[0].set_xlabel(f'PC1 ({pca.explained_variance_ratio_[0]*100:.1f}%)')
axes[0].set_ylabel(f'PC2 ({pca.explained_variance_ratio_[1]*100:.1f}%)')
axes[0].set_title('Iris Dataset - PCA Projection')
plt.colorbar(scatter, ax=axes[0], label='Species')

# Feature loadings
feature_names = iris.feature_names
loadings = pd.DataFrame(
    pca.components_.T,
    columns=['PC1', 'PC2'],
    index=feature_names
)

loadings.plot(kind='bar', ax=axes[1])
axes[1].set_title('Feature Loadings')
axes[1].set_ylabel('Loading')
axes[1].legend(title='Component')
plt.xticks(rotation=45, ha='right')

plt.tight_layout()
plt.show()

print("\nFeature Loadings:")
print(loadings)

# Interpret: Which features contribute most to each component?
for i, pc in enumerate(['PC1', 'PC2']):
    top_features = loadings[pc].abs().sort_values(ascending=False).head(2)
    print(f"\n{pc} top contributors: {list(top_features.index)}")
```

### PCA in Machine Learning Pipelines

```python
from sklearn.pipeline import Pipeline
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GridSearchCV, cross_val_score
from sklearn.datasets import load_digits

# Load data
digits = load_digits()
X, y = digits.data, digits.target

# Create pipeline
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('pca', PCA()),
    ('classifier', LogisticRegression(max_iter=1000))
])

# Grid search for optimal number of components
param_grid = {
    'pca__n_components': [10, 20, 30, 40, 50, 60],
    'classifier__C': [0.1, 1, 10]
}

grid_search = GridSearchCV(pipeline, param_grid, cv=5, scoring='accuracy', n_jobs=-1)
grid_search.fit(X, y)

print(f"Best parameters: {grid_search.best_params_}")
print(f"Best CV accuracy: {grid_search.best_score_:.4f}")

# Compare with full features
pipeline_full = Pipeline([
    ('scaler', StandardScaler()),
    ('classifier', LogisticRegression(max_iter=1000, C=grid_search.best_params_['classifier__C']))
])
scores_full = cross_val_score(pipeline_full, X, y, cv=5, scoring='accuracy')

print(f"\nFull features ({X.shape[1]} dimensions) accuracy: {scores_full.mean():.4f}")
print(f"PCA ({grid_search.best_params_['pca__n_components']} dimensions) accuracy: {grid_search.best_score_:.4f}")
print(f"Dimensionality reduction: {100*(1 - grid_search.best_params_['pca__n_components']/X.shape[1]):.1f}%")
```

## t-SNE and UMAP for Visualization

While PCA is effective for linear dimensionality reduction, t-SNE and UMAP excel at preserving local structure and revealing clusters in non-linear data.

### t-SNE (t-Distributed Stochastic Neighbor Embedding)

t-SNE converts high-dimensional distances into probability distributions and minimizes the KL divergence between high and low-dimensional distributions.

```python
from sklearn.manifold import TSNE
from sklearn.datasets import load_digits
import matplotlib.pyplot as plt

# Load data
digits = load_digits()
X, y = digits.data, digits.target

# Apply t-SNE
tsne = TSNE(n_components=2, random_state=42, perplexity=30, n_iter=1000)
X_tsne = tsne.fit_transform(X)

# Visualize
fig, axes = plt.subplots(1, 2, figsize=(14, 6))

# t-SNE visualization
scatter = axes[0].scatter(X_tsne[:, 0], X_tsne[:, 1], c=y, cmap='tab10', alpha=0.7, s=10)
axes[0].set_xlabel('t-SNE 1')
axes[0].set_ylabel('t-SNE 2')
axes[0].set_title('t-SNE Visualization of Digits Dataset')
plt.colorbar(scatter, ax=axes[0], label='Digit')

# Compare with PCA
pca = PCA(n_components=2)
X_pca = pca.fit_transform(X)
scatter2 = axes[1].scatter(X_pca[:, 0], X_pca[:, 1], c=y, cmap='tab10', alpha=0.7, s=10)
axes[1].set_xlabel('PC1')
axes[1].set_ylabel('PC2')
axes[1].set_title('PCA Visualization of Digits Dataset')
plt.colorbar(scatter2, ax=axes[1], label='Digit')

plt.tight_layout()
plt.show()

print("t-SNE reveals clear cluster structure that PCA misses")
```

### t-SNE Hyperparameter Tuning

```python
# Perplexity affects the balance between local and global structure
perplexities = [5, 30, 50, 100]

fig, axes = plt.subplots(2, 2, figsize=(12, 12))
axes = axes.flatten()

for ax, perp in zip(axes, perplexities):
    tsne = TSNE(n_components=2, perplexity=perp, random_state=42, n_iter=1000)
    X_embedded = tsne.fit_transform(X)

    scatter = ax.scatter(X_embedded[:, 0], X_embedded[:, 1], c=y, cmap='tab10', alpha=0.7, s=10)
    ax.set_title(f'Perplexity = {perp}')
    ax.set_xlabel('t-SNE 1')
    ax.set_ylabel('t-SNE 2')

plt.suptitle('Effect of Perplexity on t-SNE', fontsize=14, fontweight='bold')
plt.tight_layout()
plt.show()

print("Guidelines for perplexity:")
print("- Typical range: 5-50")
print("- Larger datasets may benefit from higher perplexity")
print("- Lower perplexity emphasizes local structure")
print("- Higher perplexity emphasizes global structure")
```

### UMAP (Uniform Manifold Approximation and Projection)

UMAP is often faster than t-SNE and better preserves global structure. It has become the preferred choice for many applications.

```python
# Note: UMAP requires installation: pip install umap-learn
try:
    import umap

    # Apply UMAP
    reducer = umap.UMAP(n_components=2, random_state=42, n_neighbors=15, min_dist=0.1)
    X_umap = reducer.fit_transform(X)

    # Compare all three methods
    fig, axes = plt.subplots(1, 3, figsize=(18, 5))

    # PCA
    pca = PCA(n_components=2)
    X_pca = pca.fit_transform(X)
    axes[0].scatter(X_pca[:, 0], X_pca[:, 1], c=y, cmap='tab10', alpha=0.7, s=10)
    axes[0].set_title('PCA')

    # t-SNE
    tsne = TSNE(n_components=2, random_state=42, perplexity=30)
    X_tsne = tsne.fit_transform(X)
    axes[1].scatter(X_tsne[:, 0], X_tsne[:, 1], c=y, cmap='tab10', alpha=0.7, s=10)
    axes[1].set_title('t-SNE')

    # UMAP
    axes[2].scatter(X_umap[:, 0], X_umap[:, 1], c=y, cmap='tab10', alpha=0.7, s=10)
    axes[2].set_title('UMAP')

    plt.suptitle('Comparison of Dimensionality Reduction Methods', fontsize=14, fontweight='bold')
    plt.tight_layout()
    plt.show()

except ImportError:
    print("UMAP not installed. Install with: pip install umap-learn")
    print("\nExample code for UMAP:")
    print("""
import umap

reducer = umap.UMAP(
    n_components=2,      # Output dimensions
    n_neighbors=15,      # Local neighborhood size
    min_dist=0.1,        # Minimum distance between points
    metric='euclidean',  # Distance metric
    random_state=42
)
X_umap = reducer.fit_transform(X)
""")
```

### When to Use Each Method

| Method | Best For | Speed | Preserves Global Structure | Preserves Local Structure |
|--------|----------|-------|---------------------------|--------------------------|
| PCA | Linear relationships, preprocessing | Fast | Yes | Limited |
| t-SNE | Cluster visualization | Slow | Poor | Excellent |
| UMAP | General visualization, clustering | Fast | Good | Excellent |

```python
# Practical recommendations
def recommend_reduction_method(n_samples, n_features, purpose):
    """Recommend appropriate dimensionality reduction method."""
    recommendations = []

    if purpose == 'preprocessing':
        recommendations.append("PCA - Fast, invertible, good for removing noise")
        if n_features > 100:
            recommendations.append("Consider Truncated SVD for sparse data")

    elif purpose == 'visualization':
        if n_samples < 5000:
            recommendations.append("t-SNE - Best local structure, try perplexity 5-50")
        recommendations.append("UMAP - Faster, preserves more global structure")

    elif purpose == 'clustering':
        recommendations.append("UMAP - Better for downstream clustering tasks")
        recommendations.append("PCA - If data has linear relationships")

    return recommendations

# Example
print("For 10000 samples, 500 features:")
print("\nFor preprocessing:")
print(recommend_reduction_method(10000, 500, 'preprocessing'))
print("\nFor visualization:")
print(recommend_reduction_method(10000, 500, 'visualization'))
```

## Autoencoder-Based Dimensionality Reduction

Autoencoders are neural networks that learn compressed representations of data. They can capture non-linear relationships that PCA cannot.

### Basic Autoencoder Architecture

```python
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, Model
from sklearn.datasets import load_digits
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

# Load and prepare data
digits = load_digits()
X = digits.data
y = digits.target

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

# Define autoencoder architecture
input_dim = X.shape[1]  # 64
encoding_dim = 2  # For visualization

# Encoder
inputs = keras.Input(shape=(input_dim,))
encoded = layers.Dense(32, activation='relu')(inputs)
encoded = layers.Dense(16, activation='relu')(encoded)
encoded = layers.Dense(encoding_dim, activation='linear')(encoded)

# Decoder
decoded = layers.Dense(16, activation='relu')(encoded)
decoded = layers.Dense(32, activation='relu')(decoded)
decoded = layers.Dense(input_dim, activation='linear')(decoded)

# Models
autoencoder = Model(inputs, decoded)
encoder = Model(inputs, encoded)

# Compile and train
autoencoder.compile(optimizer='adam', loss='mse')
history = autoencoder.fit(
    X_train, X_train,
    epochs=100,
    batch_size=32,
    validation_data=(X_test, X_test),
    verbose=0
)

# Plot training history
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Loss curve
axes[0].plot(history.history['loss'], label='Training Loss')
axes[0].plot(history.history['val_loss'], label='Validation Loss')
axes[0].set_xlabel('Epoch')
axes[0].set_ylabel('MSE Loss')
axes[0].set_title('Autoencoder Training')
axes[0].legend()

# Encoded representation
X_encoded = encoder.predict(X_scaled, verbose=0)
scatter = axes[1].scatter(X_encoded[:, 0], X_encoded[:, 1], c=y, cmap='tab10', alpha=0.7, s=10)
axes[1].set_xlabel('Encoding Dimension 1')
axes[1].set_ylabel('Encoding Dimension 2')
axes[1].set_title('Autoencoder 2D Encoding')
plt.colorbar(scatter, ax=axes[1], label='Digit')

plt.tight_layout()
plt.show()

print(f"Final training loss: {history.history['loss'][-1]:.4f}")
print(f"Final validation loss: {history.history['val_loss'][-1]:.4f}")
```

### Variational Autoencoder (VAE)

VAEs learn a probabilistic latent space, making them useful for generation and more structured representations.

```python
from tensorflow.keras import backend as K

# Sampling layer
class Sampling(layers.Layer):
    def call(self, inputs):
        z_mean, z_log_var = inputs
        batch = tf.shape(z_mean)[0]
        dim = tf.shape(z_mean)[1]
        epsilon = tf.random.normal(shape=(batch, dim))
        return z_mean + tf.exp(0.5 * z_log_var) * epsilon

# VAE architecture
latent_dim = 2
input_dim = X.shape[1]

# Encoder
encoder_inputs = keras.Input(shape=(input_dim,))
x = layers.Dense(32, activation='relu')(encoder_inputs)
x = layers.Dense(16, activation='relu')(x)
z_mean = layers.Dense(latent_dim, name='z_mean')(x)
z_log_var = layers.Dense(latent_dim, name='z_log_var')(x)
z = Sampling()([z_mean, z_log_var])

encoder_vae = Model(encoder_inputs, [z_mean, z_log_var, z], name='encoder')

# Decoder
latent_inputs = keras.Input(shape=(latent_dim,))
x = layers.Dense(16, activation='relu')(latent_inputs)
x = layers.Dense(32, activation='relu')(x)
decoder_outputs = layers.Dense(input_dim, activation='linear')(x)

decoder_vae = Model(latent_inputs, decoder_outputs, name='decoder')

# VAE model
class VAE(Model):
    def __init__(self, encoder, decoder, **kwargs):
        super().__init__(**kwargs)
        self.encoder = encoder
        self.decoder = decoder
        self.total_loss_tracker = keras.metrics.Mean(name='total_loss')
        self.reconstruction_loss_tracker = keras.metrics.Mean(name='reconstruction_loss')
        self.kl_loss_tracker = keras.metrics.Mean(name='kl_loss')

    @property
    def metrics(self):
        return [self.total_loss_tracker, self.reconstruction_loss_tracker, self.kl_loss_tracker]

    def train_step(self, data):
        with tf.GradientTape() as tape:
            z_mean, z_log_var, z = self.encoder(data)
            reconstruction = self.decoder(z)
            reconstruction_loss = tf.reduce_mean(
                keras.losses.mse(data, reconstruction)
            ) * input_dim
            kl_loss = -0.5 * tf.reduce_mean(
                1 + z_log_var - tf.square(z_mean) - tf.exp(z_log_var)
            )
            total_loss = reconstruction_loss + kl_loss

        grads = tape.gradient(total_loss, self.trainable_weights)
        self.optimizer.apply_gradients(zip(grads, self.trainable_weights))

        self.total_loss_tracker.update_state(total_loss)
        self.reconstruction_loss_tracker.update_state(reconstruction_loss)
        self.kl_loss_tracker.update_state(kl_loss)

        return {
            'loss': self.total_loss_tracker.result(),
            'reconstruction_loss': self.reconstruction_loss_tracker.result(),
            'kl_loss': self.kl_loss_tracker.result()
        }

# Train VAE
vae = VAE(encoder_vae, decoder_vae)
vae.compile(optimizer='adam')
vae.fit(X_train, epochs=100, batch_size=32, verbose=0)

# Visualize VAE latent space
z_mean, z_log_var, z = encoder_vae.predict(X_scaled, verbose=0)

plt.figure(figsize=(10, 8))
scatter = plt.scatter(z_mean[:, 0], z_mean[:, 1], c=y, cmap='tab10', alpha=0.7, s=10)
plt.xlabel('Latent Dimension 1')
plt.ylabel('Latent Dimension 2')
plt.title('VAE Latent Space')
plt.colorbar(scatter, label='Digit')
plt.show()

print("VAE advantages:")
print("- Continuous latent space enables interpolation")
print("- Can generate new samples")
print("- Regularized to prevent overfitting")
```

### Comparing Autoencoder Methods

```python
# Compare reconstruction quality
methods = {
    'PCA': PCA(n_components=10),
    'Standard AE': autoencoder,  # From previous cell
}

# For fair comparison, train autoencoders with same bottleneck as PCA
# This is a conceptual comparison

print("Dimensionality Reduction Method Comparison:")
print("-" * 60)
print(f"{'Method':<20} {'Dimensions':<15} {'Reconstruction Error':<20}")
print("-" * 60)

# PCA reconstruction
pca_10 = PCA(n_components=10)
X_pca_10 = pca_10.fit_transform(X_scaled)
X_pca_reconstructed = pca_10.inverse_transform(X_pca_10)
pca_error = np.mean((X_scaled - X_pca_reconstructed) ** 2)
print(f"{'PCA':<20} {'10':<15} {pca_error:.4f}")

# Standard Autoencoder
ae_reconstructed = autoencoder.predict(X_scaled, verbose=0)
ae_error = np.mean((X_scaled - ae_reconstructed) ** 2)
print(f"{'Autoencoder':<20} {'2':<15} {ae_error:.4f}")

print("-" * 60)
print("\nKey differences:")
print("- PCA: Linear, fast, deterministic")
print("- Autoencoder: Non-linear, requires training, more expressive")
print("- VAE: Probabilistic, regularized latent space, generative")
```

## Scikit-learn Implementation Guide

### Complete Feature Transformation Pipeline

```python
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import (
    StandardScaler, MinMaxScaler, RobustScaler,
    OneHotEncoder, OrdinalEncoder, PowerTransformer
)
from sklearn.impute import SimpleImputer
from sklearn.decomposition import PCA
from sklearn.feature_selection import SelectKBest, f_classif
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score

# Create sample dataset with mixed types
np.random.seed(42)
n_samples = 1000

data = pd.DataFrame({
    # Numerical features
    'age': np.random.normal(35, 10, n_samples),
    'income': np.random.lognormal(10.5, 0.5, n_samples),  # Skewed
    'years_employed': np.random.exponential(5, n_samples),
    'credit_score': np.random.normal(700, 50, n_samples),

    # Categorical features
    'education': np.random.choice(['High School', 'Bachelor', 'Master', 'PhD'], n_samples),
    'job_type': np.random.choice(['Full-time', 'Part-time', 'Contract', 'Freelance'], n_samples),
    'region': np.random.choice(['North', 'South', 'East', 'West'], n_samples),

    # Target
    'approved': np.random.binomial(1, 0.3, n_samples)
})

# Define feature types
numeric_features = ['age', 'income', 'years_employed', 'credit_score']
skewed_features = ['income', 'years_employed']
normal_features = ['age', 'credit_score']
categorical_features = ['education', 'job_type', 'region']

X = data.drop('approved', axis=1)
y = data['approved']

# Build comprehensive preprocessing pipeline
numeric_transformer_standard = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())
])

numeric_transformer_skewed = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='median')),
    ('power', PowerTransformer(method='yeo-johnson')),
    ('scaler', StandardScaler())
])

categorical_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
    ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
])

# Combine transformers
preprocessor = ColumnTransformer(
    transformers=[
        ('num_standard', numeric_transformer_standard, normal_features),
        ('num_skewed', numeric_transformer_skewed, skewed_features),
        ('cat', categorical_transformer, categorical_features)
    ]
)

# Full pipeline with feature selection and classification
full_pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('feature_selection', SelectKBest(f_classif, k='all')),
    ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
])

# Evaluate
scores = cross_val_score(full_pipeline, X, y, cv=5, scoring='accuracy')
print(f"Cross-validation accuracy: {scores.mean():.4f} (+/- {scores.std()*2:.4f})")

# Fit and inspect
full_pipeline.fit(X, y)

# Get feature names after transformation
preprocessor_fitted = full_pipeline.named_steps['preprocessor']
feature_names = preprocessor_fitted.get_feature_names_out()
print(f"\nTransformed features ({len(feature_names)}):")
for name in feature_names[:10]:
    print(f"  - {name}")
if len(feature_names) > 10:
    print(f"  ... and {len(feature_names) - 10} more")
```

### Custom Transformers

```python
from sklearn.base import BaseEstimator, TransformerMixin

class LogTransformer(BaseEstimator, TransformerMixin):
    """Custom log transformer with handling for zeros and negatives."""

    def __init__(self, offset=1.0):
        self.offset = offset

    def fit(self, X, y=None):
        # Store minimum for potential offset adjustment
        self.min_values_ = np.min(X, axis=0)
        return self

    def transform(self, X):
        X = np.array(X)
        # Shift values to be positive if needed
        X_shifted = X - self.min_values_ + self.offset
        return np.log(X_shifted)

    def inverse_transform(self, X):
        X = np.array(X)
        return np.exp(X) + self.min_values_ - self.offset

class OutlierClipper(BaseEstimator, TransformerMixin):
    """Clip outliers based on IQR method."""

    def __init__(self, multiplier=1.5):
        self.multiplier = multiplier

    def fit(self, X, y=None):
        X = np.array(X)
        q1 = np.percentile(X, 25, axis=0)
        q3 = np.percentile(X, 75, axis=0)
        iqr = q3 - q1
        self.lower_bound_ = q1 - self.multiplier * iqr
        self.upper_bound_ = q3 + self.multiplier * iqr
        return self

    def transform(self, X):
        X = np.array(X).copy()
        for i in range(X.shape[1]):
            X[:, i] = np.clip(X[:, i], self.lower_bound_[i], self.upper_bound_[i])
        return X

class FeatureCrosser(BaseEstimator, TransformerMixin):
    """Create interaction features between specified columns."""

    def __init__(self, feature_pairs):
        """
        feature_pairs: list of tuples, e.g., [(0, 1), (1, 2)]
        """
        self.feature_pairs = feature_pairs

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = np.array(X)
        crossed = []
        for i, j in self.feature_pairs:
            crossed.append(X[:, i] * X[:, j])
        return np.column_stack([X] + crossed)

# Example usage
np.random.seed(42)
X_example = np.column_stack([
    np.random.exponential(5, 100),  # Skewed
    np.random.normal(50, 10, 100),
    np.random.uniform(0, 100, 100)
])

# Add outliers
X_example[0, 0] = 100
X_example[1, 1] = 150

pipeline_custom = Pipeline([
    ('clipper', OutlierClipper(multiplier=2.0)),
    ('log', LogTransformer()),
    ('crosser', FeatureCrosser([(0, 1), (1, 2)])),
    ('scaler', StandardScaler())
])

X_transformed = pipeline_custom.fit_transform(X_example)
print(f"Original shape: {X_example.shape}")
print(f"Transformed shape: {X_transformed.shape}")
print(f"Added 2 interaction features")
```

### Handling Different Data Types

```python
from sklearn.preprocessing import FunctionTransformer

# Datetime feature extraction
def extract_datetime_features(X):
    """Extract useful features from datetime columns."""
    result = []
    for col in X.columns:
        dt = pd.to_datetime(X[col])
        result.append(pd.DataFrame({
            f'{col}_year': dt.dt.year,
            f'{col}_month': dt.dt.month,
            f'{col}_day': dt.dt.day,
            f'{col}_dayofweek': dt.dt.dayofweek,
            f'{col}_hour': dt.dt.hour if dt.dt.hour.notna().any() else 0,
            f'{col}_is_weekend': (dt.dt.dayofweek >= 5).astype(int)
        }))
    return pd.concat(result, axis=1)

# Text length feature
def extract_text_features(X):
    """Extract basic features from text columns."""
    result = []
    for col in X.columns:
        result.append(pd.DataFrame({
            f'{col}_length': X[col].str.len(),
            f'{col}_word_count': X[col].str.split().str.len(),
            f'{col}_has_special': X[col].str.contains(r'[!@#$%^&*()]', regex=True).astype(int)
        }))
    return pd.concat(result, axis=1)

# Create sample data with dates and text
sample_data = pd.DataFrame({
    'signup_date': pd.date_range('2023-01-01', periods=100, freq='D'),
    'description': ['Product review text here!' * np.random.randint(1, 5) for _ in range(100)],
    'amount': np.random.exponential(100, 100)
})

# Apply transformations
date_features = extract_datetime_features(sample_data[['signup_date']])
text_features = extract_text_features(sample_data[['description']])

print("Datetime Features:")
print(date_features.head())
print("\nText Features:")
print(text_features.head())
```

## Best Practices and Common Pitfalls

### Data Leakage Prevention

```python
from sklearn.model_selection import train_test_split

# WRONG: Fitting scaler on entire dataset
# This leaks test set information into training
X_scaled_wrong = StandardScaler().fit_transform(X)
X_train_wrong, X_test_wrong = train_test_split(X_scaled_wrong, test_size=0.2)

# CORRECT: Fit scaler only on training data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)  # Fit and transform
X_test_scaled = scaler.transform(X_test)        # Only transform (no fitting!)

print("Correct approach: Fit preprocessing on training data only")

# Using Pipeline ensures no leakage
from sklearn.pipeline import Pipeline

pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('classifier', RandomForestClassifier())
])

# This automatically handles fitting on training data only
pipeline.fit(X_train, y_train)
score = pipeline.score(X_test, y_test)
print(f"Test accuracy: {score:.4f}")
```

### Handling Missing Values Before Transformation

```python
from sklearn.impute import SimpleImputer, KNNImputer

# Create data with missing values
X_missing = np.random.randn(100, 3)
X_missing[np.random.choice(100, 20), 0] = np.nan
X_missing[np.random.choice(100, 15), 1] = np.nan

# Different imputation strategies
imputers = {
    'Mean': SimpleImputer(strategy='mean'),
    'Median': SimpleImputer(strategy='median'),
    'KNN': KNNImputer(n_neighbors=5)
}

print("Imputation Comparison:")
print("-" * 50)
for name, imputer in imputers.items():
    X_imputed = imputer.fit_transform(X_missing)
    print(f"{name:10} - Mean after imputation: {X_imputed[:, 0].mean():.4f}")

# Important: Always impute before scaling
correct_pipeline = Pipeline([
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler()),
    ('pca', PCA(n_components=2))
])

# This will fail if NaN values reach the scaler
try:
    wrong_pipeline = Pipeline([
        ('scaler', StandardScaler()),  # Will fail with NaN
        ('imputer', SimpleImputer(strategy='median')),
    ])
    wrong_pipeline.fit_transform(X_missing)
except ValueError as e:
    print(f"\nError with wrong order: {str(e)[:50]}...")
```

### Preserving Feature Names

```python
from sklearn.compose import make_column_transformer
from sklearn.pipeline import make_pipeline

# Create named transformers
preprocessor = make_column_transformer(
    (StandardScaler(), normal_features),
    (PowerTransformer(), skewed_features),
    (OneHotEncoder(handle_unknown='ignore'), categorical_features),
    remainder='passthrough',
    verbose_feature_names_out=True
)

# Fit and get feature names
preprocessor.fit(X)
transformed_names = preprocessor.get_feature_names_out()

print("Transformed feature names:")
for i, name in enumerate(transformed_names[:15]):
    print(f"  {i}: {name}")

# Create a DataFrame with proper column names
X_transformed = preprocessor.transform(X)
X_transformed_df = pd.DataFrame(X_transformed, columns=transformed_names)
print(f"\nTransformed DataFrame shape: {X_transformed_df.shape}")
print(X_transformed_df.head())
```

### Transformation Strategy by Algorithm

```python
# Different algorithms have different preprocessing requirements

algorithm_recommendations = {
    'Linear Regression': {
        'scaling': 'StandardScaler (important for regularized versions)',
        'skewed_features': 'Log or Box-Cox transformation',
        'outliers': 'Consider RobustScaler or outlier removal',
        'categorical': 'OneHotEncoder'
    },
    'Logistic Regression': {
        'scaling': 'StandardScaler (required for convergence)',
        'skewed_features': 'Power transformation recommended',
        'outliers': 'RobustScaler or clip outliers',
        'categorical': 'OneHotEncoder or TargetEncoder'
    },
    'Random Forest': {
        'scaling': 'Not required (tree-based)',
        'skewed_features': 'Not required',
        'outliers': 'Robust to outliers',
        'categorical': 'OrdinalEncoder or OneHotEncoder'
    },
    'SVM': {
        'scaling': 'Required (StandardScaler or MinMaxScaler)',
        'skewed_features': 'Transformation recommended',
        'outliers': 'Very sensitive - use RobustScaler',
        'categorical': 'OneHotEncoder'
    },
    'KNN': {
        'scaling': 'Required (distances affected by scale)',
        'skewed_features': 'Transformation recommended',
        'outliers': 'Sensitive - consider clipping',
        'categorical': 'OneHotEncoder or distance-based encoding'
    },
    'Neural Networks': {
        'scaling': 'Required (BatchNorm or StandardScaler)',
        'skewed_features': 'Transformation helps convergence',
        'outliers': 'Clip to reasonable range',
        'categorical': 'OneHotEncoder or learned embeddings'
    },
    'XGBoost/LightGBM': {
        'scaling': 'Not required',
        'skewed_features': 'Not required',
        'outliers': 'Robust to outliers',
        'categorical': 'Native support (LightGBM) or OrdinalEncoder'
    }
}

print("Feature Transformation Recommendations by Algorithm")
print("=" * 70)
for algo, recs in algorithm_recommendations.items():
    print(f"\n{algo}:")
    for aspect, rec in recs.items():
        print(f"  - {aspect}: {rec}")
```

## Interview Key Points

### Common Interview Questions

**Q1: What is the difference between standardization and normalization?**

Standardization (Z-score) transforms data to have mean=0 and std=1. It is suitable for Gaussian-distributed data and algorithms that assume centered data (PCA, neural networks).

Normalization (Min-Max) scales data to a fixed range [0, 1]. It is suitable for bounded requirements and non-Gaussian data.

**Q2: When should you apply feature scaling?**

- Distance-based algorithms (KNN, K-Means, SVM)
- Gradient descent optimization (Linear Regression, Neural Networks)
- Regularized models (Ridge, Lasso)
- PCA and other variance-based methods

Tree-based algorithms (Random Forest, XGBoost) generally do not require scaling.

**Q3: What is data leakage in feature transformation?**

Data leakage occurs when information from the test set influences the training process. In feature transformation:
- WRONG: Fitting scaler on entire dataset, then splitting
- CORRECT: Split first, then fit scaler only on training data

Always use sklearn Pipelines to prevent leakage automatically.

**Q4: Explain PCA and when to use it.**

PCA finds orthogonal directions of maximum variance:
1. Centers the data
2. Computes covariance matrix
3. Finds eigenvalues/eigenvectors
4. Projects onto top k components

Use PCA when:
- Reducing dimensionality for visualization
- Removing multicollinearity
- Speeding up training with high-dimensional data
- Preprocessing for algorithms sensitive to feature count

**Q5: How do you handle skewed features?**

Options include:
- Log transformation: For right-skewed, positive data
- Square root: For moderate skewness, count data
- Box-Cox: Finds optimal transformation parameter
- Yeo-Johnson: Handles zero and negative values
- Quantile transformation: Non-parametric, maps to any distribution

**Q6: What is the difference between t-SNE and UMAP?**

Both are non-linear dimensionality reduction for visualization:

t-SNE:
- Preserves local structure excellently
- Slower, especially for large datasets
- Perplexity parameter controls neighborhood size
- Not suitable for new data projection

UMAP:
- Faster, scales better
- Preserves both local and global structure
- Can project new data
- n_neighbors and min_dist control structure

### Quick Reference Formulas

**Standardization (Z-score):**
$$z = \frac{x - \mu}{\sigma}$$

**Min-Max Normalization:**
$$x_{norm} = \frac{x - x_{min}}{x_{max} - x_{min}}$$

**Robust Scaling:**
$$x_{robust} = \frac{x - Q_{50}}{Q_{75} - Q_{25}}$$

**Log Transformation:**
$$x_{log} = \log(x + c)$$

**Explained Variance Ratio (PCA):**
$$EVR_i = \frac{\lambda_i}{\sum_{j=1}^{n}\lambda_j}$$

## Summary

Feature transformation is a fundamental skill for any data scientist or machine learning practitioner. This guide covered:

1. **Scaling Methods**: StandardScaler, MinMaxScaler, RobustScaler - each suited for different data characteristics and algorithm requirements.

2. **Numerical Transformations**: Log, Box-Cox, Yeo-Johnson, and Quantile transformations for handling skewed distributions.

3. **Feature Crossing**: Creating interaction features through polynomial expansion and manual feature engineering.

4. **Dimensionality Reduction**: PCA for linear reduction, t-SNE and UMAP for visualization, and autoencoders for non-linear representations.

5. **Implementation Best Practices**: Using scikit-learn pipelines, preventing data leakage, and creating custom transformers.

Key takeaways:

1. **Always prevent data leakage** by fitting transformers only on training data
2. **Choose transformations based on algorithm requirements** and data characteristics
3. **Use pipelines** to create reproducible and maintainable preprocessing workflows
4. **Visualize distributions** before and after transformation to verify effectiveness
5. **Consider interpretability** when choosing between different transformation methods

Feature transformation is often where the most significant improvements in model performance come from. A well-engineered feature pipeline can be more valuable than sophisticated algorithm tuning.

## Further Reading

### Recommended Resources

1. **"Feature Engineering and Selection" by Max Kuhn and Kjell Johnson** - Comprehensive guide to feature engineering techniques

2. **"Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow" by Aurelien Geron** - Practical implementation guide

3. **Scikit-learn Documentation** - [Preprocessing](https://scikit-learn.org/stable/modules/preprocessing.html) - Official reference for all transformers

4. **"An Introduction to Statistical Learning" by James et al.** - Statistical foundation for understanding transformations

### Online Resources

- [Scikit-learn User Guide: Preprocessing](https://scikit-learn.org/stable/modules/preprocessing.html)
- [Feature Engine Library](https://feature-engine.readthedocs.io/) - Additional transformers
- [Kaggle Feature Engineering Course](https://www.kaggle.com/learn/feature-engineering)

### Advanced Topics to Explore

- Target Encoding for high-cardinality categorical features
- Entity Embeddings for categorical variables
- Feature selection methods (Filter, Wrapper, Embedded)
- Automated Feature Engineering (Featuretools, AutoML)
- Domain-specific transformations (text, images, time series)
