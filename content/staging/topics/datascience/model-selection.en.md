---
title: "Model Evaluation: Model Selection and Tuning"
description: "Master model selection: cross-validation, hyperparameter search, and Bayesian optimization"
track: datascience
section: evaluation
difficulty: intermediate
tags:
  - model selection
  - cross-validation
  - hyperparameters
  - Bayesian optimization
status: imported
origin: old/src/content/docs/datascience/model-selection.en.md
divergence: 0.453
issues:
  - divergent
legacy:
  category: DataScience
  subcategory: Evaluation
  order: 33
  lastUpdated: 2026-01-07
---

Model selection and hyperparameter tuning are critical steps in the machine learning pipeline that directly impact model performance in production. While a well-chosen algorithm provides a foundation, proper tuning and validation ensure that your model generalizes well to unseen data. This comprehensive guide covers essential techniques from basic data splitting strategies to advanced Bayesian optimization methods.

## Data Splitting Strategies

Before training any model, you must properly partition your data to enable unbiased evaluation. The way you split your data fundamentally affects your ability to assess model performance and detect overfitting.

### Train/Validation/Test Split

The three-way split is the foundation of model development. Each partition serves a distinct purpose:

- **Training Set (60-70%)**: Used to fit model parameters
- **Validation Set (15-20%)**: Used for hyperparameter tuning and model selection
- **Test Set (15-20%)**: Reserved exclusively for final evaluation

```python
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.datasets import load_breast_cancer

# Load dataset
data = load_breast_cancer()
X, y = data.data, data.target

# First split: separate test set (never touch until final evaluation)
X_temp, X_test, y_temp, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y  # Maintain class distribution
)

# Second split: separate training and validation sets
X_train, X_val, y_train, y_val = train_test_split(
    X_temp, y_temp,
    test_size=0.25,  # 0.25 * 0.8 = 0.2 of original data
    random_state=42,
    stratify=y_temp
)

print(f"Training set size: {len(X_train)} ({len(X_train)/len(X)*100:.1f}%)")
print(f"Validation set size: {len(X_val)} ({len(X_val)/len(X)*100:.1f}%)")
print(f"Test set size: {len(X_test)} ({len(X_test)/len(X)*100:.1f}%)")

# Verify class distribution is preserved
print(f"\nOriginal class distribution: {np.bincount(y) / len(y)}")
print(f"Training class distribution: {np.bincount(y_train) / len(y_train)}")
print(f"Test class distribution: {np.bincount(y_test) / len(y_test)}")
```

**Why Three Splits Instead of Two?**

A common mistake is using only train/test splits, then repeatedly evaluating on the test set during development. This leads to implicit overfitting on the test set, as model decisions are influenced by test performance. The validation set provides a buffer for iterative model improvement while preserving test set integrity.

```python
# WRONG: Using test set for model selection
# This leads to overfitting on the test set
for params in parameter_grid:
    model.fit(X_train, y_train)
    score = model.score(X_test, y_test)  # Information leak!
    if score > best_score:
        best_params = params

# CORRECT: Using validation set for model selection
for params in parameter_grid:
    model.fit(X_train, y_train)
    score = model.score(X_val, y_val)  # Proper validation
    if score > best_score:
        best_params = params

# Only evaluate on test set once, at the very end
final_score = model.score(X_test, y_test)
```

### Choosing Split Ratios

The optimal split ratio depends on your dataset size:

| Dataset Size | Recommended Split | Reasoning |
|--------------|-------------------|-----------|
| Small (<1,000) | Use cross-validation | Every sample matters |
| Medium (1,000-100,000) | 60/20/20 or 70/15/15 | Balance training data and evaluation reliability |
| Large (>100,000) | 80/10/10 or 90/5/5 | Sufficient data for all purposes |

```python
def recommend_split_ratio(n_samples):
    """Recommend train/val/test split based on dataset size."""
    if n_samples < 1000:
        return "Use K-fold cross-validation instead of holdout"
    elif n_samples < 10000:
        return "60/20/20 split recommended"
    elif n_samples < 100000:
        return "70/15/15 or 80/10/10 split recommended"
    else:
        return "80/10/10 or 90/5/5 split recommended"

print(recommend_split_ratio(len(X)))
```

## K-Fold Cross-Validation

Cross-validation provides more reliable performance estimates than a single train/test split, especially for smaller datasets. By rotating through multiple train/validation splits, we reduce the variance of our performance estimates.

### Standard K-Fold Cross-Validation

K-Fold CV divides data into K equal parts, using each fold once as validation while training on the remaining K-1 folds.

```python
from sklearn.model_selection import cross_val_score, KFold
from sklearn.ensemble import RandomForestClassifier
import matplotlib.pyplot as plt

# Define model
model = RandomForestClassifier(n_estimators=100, random_state=42)

# Standard K-fold cross-validation
kf = KFold(n_splits=5, shuffle=True, random_state=42)

# Compute cross-validation scores
cv_scores = cross_val_score(model, X, y, cv=kf, scoring='accuracy')

print("K-Fold Cross-Validation Results")
print("=" * 40)
print(f"Fold scores: {cv_scores}")
print(f"Mean accuracy: {cv_scores.mean():.4f}")
print(f"Standard deviation: {cv_scores.std():.4f}")
print(f"95% Confidence interval: [{cv_scores.mean() - 1.96*cv_scores.std():.4f}, "
      f"{cv_scores.mean() + 1.96*cv_scores.std():.4f}]")

# Visualize fold performance
plt.figure(figsize=(10, 5))
plt.bar(range(1, len(cv_scores) + 1), cv_scores, color='steelblue', edgecolor='black')
plt.axhline(y=cv_scores.mean(), color='red', linestyle='--',
            label=f'Mean = {cv_scores.mean():.4f}')
plt.fill_between(range(0, len(cv_scores) + 2),
                 cv_scores.mean() - cv_scores.std(),
                 cv_scores.mean() + cv_scores.std(),
                 alpha=0.2, color='red', label='1 Std Dev')
plt.xlabel('Fold')
plt.ylabel('Accuracy')
plt.title('K-Fold Cross-Validation Performance')
plt.legend()
plt.xticks(range(1, len(cv_scores) + 1))
plt.ylim([0.9, 1.0])
plt.tight_layout()
plt.show()
```

### Stratified K-Fold Cross-Validation

For classification problems, especially with imbalanced classes, stratified K-fold ensures each fold maintains the original class distribution.

```python
from sklearn.model_selection import StratifiedKFold

# Stratified K-Fold preserves class distribution in each fold
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

# Demonstrate class distribution preservation
print("Stratified K-Fold: Class Distribution per Fold")
print("=" * 50)

for fold, (train_idx, val_idx) in enumerate(skf.split(X, y), 1):
    y_train_fold = y[train_idx]
    y_val_fold = y[val_idx]

    train_dist = np.bincount(y_train_fold) / len(y_train_fold)
    val_dist = np.bincount(y_val_fold) / len(y_val_fold)

    print(f"Fold {fold}:")
    print(f"  Train: Class 0={train_dist[0]:.3f}, Class 1={train_dist[1]:.3f}")
    print(f"  Val:   Class 0={val_dist[0]:.3f}, Class 1={val_dist[1]:.3f}")

# Cross-validation with stratification
cv_scores_stratified = cross_val_score(model, X, y, cv=skf, scoring='f1')
print(f"\nStratified CV F1 Score: {cv_scores_stratified.mean():.4f} "
      f"(+/- {cv_scores_stratified.std()*2:.4f})")
```

### Choosing the Number of Folds

The number of folds (K) involves a trade-off:

| K Value | Pros | Cons |
|---------|------|------|
| K=5 | Good balance, fast computation | Less training data per fold |
| K=10 | More training data, lower bias | Higher variance, slower |
| K=N (LOOCV) | Maximum training data | Very high variance, very slow |

```python
from sklearn.model_selection import LeaveOneOut
import time

# Compare different K values
k_values = [3, 5, 10, 20]
results = {}

for k in k_values:
    kf = KFold(n_splits=k, shuffle=True, random_state=42)

    start_time = time.time()
    scores = cross_val_score(model, X, y, cv=kf, scoring='accuracy')
    elapsed_time = time.time() - start_time

    results[k] = {
        'mean': scores.mean(),
        'std': scores.std(),
        'time': elapsed_time
    }

print("Comparison of Different K Values")
print("=" * 60)
print(f"{'K':>4} {'Mean Accuracy':>15} {'Std Dev':>12} {'Time (s)':>12}")
print("-" * 60)
for k, res in results.items():
    print(f"{k:>4} {res['mean']:>15.4f} {res['std']:>12.4f} {res['time']:>12.4f}")

# Leave-One-Out Cross-Validation (for small datasets only)
# Note: LOOCV is computationally expensive
if len(X) <= 200:  # Only for small datasets
    loo = LeaveOneOut()
    loo_scores = cross_val_score(model, X, y, cv=loo, scoring='accuracy')
    print(f"\nLOOCV Accuracy: {loo_scores.mean():.4f}")
```

### Cross-Validation for Time Series

Standard K-fold is inappropriate for time series data due to temporal dependencies. Use time series specific splits that respect temporal order.

```python
from sklearn.model_selection import TimeSeriesSplit

# Generate synthetic time series data
np.random.seed(42)
n_samples = 1000
X_ts = np.random.randn(n_samples, 5)
y_ts = (np.cumsum(X_ts[:, 0]) > 0).astype(int)

# Time Series Cross-Validation
tscv = TimeSeriesSplit(n_splits=5, gap=10)  # gap prevents data leakage

print("Time Series Cross-Validation Splits")
print("=" * 50)
for fold, (train_idx, test_idx) in enumerate(tscv.split(X_ts), 1):
    print(f"Fold {fold}:")
    print(f"  Train: {train_idx[0]:>4} to {train_idx[-1]:>4} (n={len(train_idx)})")
    print(f"  Test:  {test_idx[0]:>4} to {test_idx[-1]:>4} (n={len(test_idx)})")

# Visualize time series splits
fig, ax = plt.subplots(figsize=(12, 6))
for fold, (train_idx, test_idx) in enumerate(tscv.split(X_ts)):
    ax.scatter(train_idx, [fold] * len(train_idx), c='blue', marker='s', s=5)
    ax.scatter(test_idx, [fold] * len(test_idx), c='red', marker='s', s=5)

ax.set_xlabel('Sample Index')
ax.set_ylabel('CV Fold')
ax.set_title('Time Series Cross-Validation (Blue=Train, Red=Test)')
plt.tight_layout()
plt.show()
```

## Stratified Sampling

Stratified sampling ensures that subgroups in your data are proportionally represented in each split. This is crucial for imbalanced datasets and when certain features are important to preserve.

### Stratification by Target Variable

```python
from sklearn.model_selection import train_test_split
from collections import Counter

# Create an imbalanced dataset
np.random.seed(42)
n_samples = 1000
X_imb = np.random.randn(n_samples, 10)
y_imb = np.concatenate([np.zeros(900), np.ones(100)])  # 90% vs 10%

# Without stratification
X_train_ns, X_test_ns, y_train_ns, y_test_ns = train_test_split(
    X_imb, y_imb, test_size=0.2, random_state=42
)

# With stratification
X_train_s, X_test_s, y_train_s, y_test_s = train_test_split(
    X_imb, y_imb, test_size=0.2, random_state=42, stratify=y_imb
)

print("Effect of Stratification on Class Distribution")
print("=" * 60)
print(f"Original distribution: {Counter(y_imb)}")
print(f"\nWithout stratification:")
print(f"  Train: {Counter(y_train_ns)} ({Counter(y_train_ns)[1]/len(y_train_ns)*100:.1f}% minority)")
print(f"  Test:  {Counter(y_test_ns)} ({Counter(y_test_ns)[1]/len(y_test_ns)*100:.1f}% minority)")
print(f"\nWith stratification:")
print(f"  Train: {Counter(y_train_s)} ({Counter(y_train_s)[1]/len(y_train_s)*100:.1f}% minority)")
print(f"  Test:  {Counter(y_test_s)} ({Counter(y_test_s)[1]/len(y_test_s)*100:.1f}% minority)")
```

### Multi-Variable Stratification

Sometimes you need to stratify on multiple variables, such as both target and an important feature.

```python
import pandas as pd
from sklearn.model_selection import StratifiedShuffleSplit

# Create dataset with multiple important variables
np.random.seed(42)
df = pd.DataFrame({
    'feature1': np.random.randn(1000),
    'feature2': np.random.randn(1000),
    'region': np.random.choice(['North', 'South', 'East', 'West'], 1000),
    'target': np.random.choice([0, 1], 1000, p=[0.7, 0.3])
})

# Create combined stratification column
df['strata'] = df['target'].astype(str) + '_' + df['region']

print("Multi-Variable Stratification")
print("=" * 50)
print("Original strata distribution:")
print(df['strata'].value_counts(normalize=True).sort_index())

# Stratified split on combined variable
sss = StratifiedShuffleSplit(n_splits=1, test_size=0.2, random_state=42)

for train_idx, test_idx in sss.split(df, df['strata']):
    df_train = df.iloc[train_idx]
    df_test = df.iloc[test_idx]

print("\nTrain set strata distribution:")
print(df_train['strata'].value_counts(normalize=True).sort_index())
print("\nTest set strata distribution:")
print(df_test['strata'].value_counts(normalize=True).sort_index())
```

### Group K-Fold for Dependent Samples

When samples are not independent (e.g., multiple samples from the same patient), use GroupKFold to ensure all samples from a group stay together.

```python
from sklearn.model_selection import GroupKFold, GroupShuffleSplit

# Simulate data where each patient has multiple samples
np.random.seed(42)
n_patients = 100
samples_per_patient = np.random.randint(3, 10, n_patients)
total_samples = samples_per_patient.sum()

X_grouped = np.random.randn(total_samples, 5)
y_grouped = np.random.choice([0, 1], total_samples)
groups = np.repeat(range(n_patients), samples_per_patient)

print(f"Total samples: {total_samples}")
print(f"Number of groups (patients): {n_patients}")
print(f"Samples per group: {samples_per_patient.min()}-{samples_per_patient.max()}")

# Group K-Fold ensures no patient appears in both train and validation
gkf = GroupKFold(n_splits=5)

print("\nGroup K-Fold Splits")
print("=" * 50)
for fold, (train_idx, val_idx) in enumerate(gkf.split(X_grouped, y_grouped, groups), 1):
    train_groups = set(groups[train_idx])
    val_groups = set(groups[val_idx])
    overlap = train_groups & val_groups

    print(f"Fold {fold}:")
    print(f"  Train samples: {len(train_idx)}, Val samples: {len(val_idx)}")
    print(f"  Train groups: {len(train_groups)}, Val groups: {len(val_groups)}")
    print(f"  Group overlap: {len(overlap)} (should be 0)")
```

## Grid Search

Grid search exhaustively evaluates all combinations of specified hyperparameters. It is simple and guarantees finding the best combination within the search space.

### Basic Grid Search

```python
from sklearn.model_selection import GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_breast_cancer
import time

# Load data
data = load_breast_cancer()
X, y = data.data, data.target

# Define parameter grid
param_grid = {
    'n_estimators': [50, 100, 200],
    'max_depth': [5, 10, 20, None],
    'min_samples_split': [2, 5, 10],
    'min_samples_leaf': [1, 2, 4]
}

# Calculate total combinations
n_combinations = 1
for param, values in param_grid.items():
    n_combinations *= len(values)
print(f"Total parameter combinations: {n_combinations}")

# Create GridSearchCV object
grid_search = GridSearchCV(
    estimator=RandomForestClassifier(random_state=42),
    param_grid=param_grid,
    cv=5,  # 5-fold cross-validation
    scoring='accuracy',
    n_jobs=-1,  # Use all CPU cores
    verbose=1,
    return_train_score=True
)

# Execute search
start_time = time.time()
grid_search.fit(X, y)
elapsed_time = time.time() - start_time

print(f"\nGrid Search completed in {elapsed_time:.2f} seconds")
print(f"Total fits: {n_combinations * 5}")  # combinations * cv folds
print(f"\nBest parameters: {grid_search.best_params_}")
print(f"Best CV score: {grid_search.best_score_:.4f}")
```

### Analyzing Grid Search Results

```python
import pandas as pd

# Convert results to DataFrame for analysis
results_df = pd.DataFrame(grid_search.cv_results_)

# Select important columns
important_cols = ['param_n_estimators', 'param_max_depth',
                  'param_min_samples_split', 'param_min_samples_leaf',
                  'mean_test_score', 'std_test_score', 'rank_test_score',
                  'mean_train_score']
results_summary = results_df[important_cols].sort_values('rank_test_score')

print("Top 10 Parameter Combinations")
print("=" * 80)
print(results_summary.head(10).to_string())

# Check for overfitting (gap between train and test scores)
results_df['overfit_gap'] = results_df['mean_train_score'] - results_df['mean_test_score']

print("\n\nOverfitting Analysis")
print("=" * 50)
print(f"Mean train-test gap: {results_df['overfit_gap'].mean():.4f}")
print(f"Max train-test gap: {results_df['overfit_gap'].max():.4f}")

# Identify overfitting configurations
overfit_threshold = 0.05
overfit_configs = results_df[results_df['overfit_gap'] > overfit_threshold]
print(f"Configurations with gap > {overfit_threshold}: {len(overfit_configs)}")
```

### Visualizing Grid Search Results

```python
import matplotlib.pyplot as plt
import seaborn as sns

# Heatmap for two parameters
fig, axes = plt.subplots(2, 2, figsize=(14, 12))

# Prepare pivot tables for different parameter pairs
for idx, (param1, param2) in enumerate([
    ('n_estimators', 'max_depth'),
    ('n_estimators', 'min_samples_split'),
    ('max_depth', 'min_samples_split'),
    ('min_samples_leaf', 'min_samples_split')
]):
    ax = axes[idx // 2, idx % 2]

    # Create pivot table
    pivot = results_df.pivot_table(
        values='mean_test_score',
        index=f'param_{param1}',
        columns=f'param_{param2}',
        aggfunc='mean'
    )

    sns.heatmap(pivot, annot=True, fmt='.3f', cmap='YlGnBu', ax=ax)
    ax.set_title(f'{param1} vs {param2}')
    ax.set_xlabel(param2)
    ax.set_ylabel(param1)

plt.tight_layout()
plt.savefig('grid_search_heatmaps.png', dpi=150)
plt.show()
```

### Pipeline with Grid Search

Combining preprocessing with model tuning in a pipeline ensures proper cross-validation without data leakage.

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.svm import SVC

# Create pipeline
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('pca', PCA()),
    ('svm', SVC())
])

# Define parameter grid for pipeline
# Note: prefix parameter names with step name
param_grid_pipeline = {
    'pca__n_components': [5, 10, 15, 20],
    'svm__C': [0.1, 1, 10],
    'svm__kernel': ['rbf', 'poly'],
    'svm__gamma': ['scale', 'auto']
}

# Grid search with pipeline
grid_search_pipeline = GridSearchCV(
    pipeline,
    param_grid_pipeline,
    cv=5,
    scoring='accuracy',
    n_jobs=-1,
    verbose=1
)

grid_search_pipeline.fit(X, y)

print("Pipeline Grid Search Results")
print("=" * 50)
print(f"Best parameters: {grid_search_pipeline.best_params_}")
print(f"Best CV score: {grid_search_pipeline.best_score_:.4f}")
```

## Random Search

Random search samples random combinations from the parameter space. For high-dimensional parameter spaces, it is often more efficient than grid search.

### Basic Random Search

```python
from sklearn.model_selection import RandomizedSearchCV
from scipy.stats import randint, uniform, loguniform

# Define parameter distributions (not fixed values)
param_distributions = {
    'n_estimators': randint(50, 500),  # Discrete uniform
    'max_depth': randint(3, 30),
    'min_samples_split': randint(2, 20),
    'min_samples_leaf': randint(1, 10),
    'max_features': uniform(0.1, 0.9),  # Continuous uniform
    'bootstrap': [True, False]  # Categorical
}

# Random search
random_search = RandomizedSearchCV(
    estimator=RandomForestClassifier(random_state=42),
    param_distributions=param_distributions,
    n_iter=100,  # Number of random combinations to try
    cv=5,
    scoring='accuracy',
    n_jobs=-1,
    verbose=1,
    random_state=42,
    return_train_score=True
)

start_time = time.time()
random_search.fit(X, y)
elapsed_time = time.time() - start_time

print(f"\nRandom Search completed in {elapsed_time:.2f} seconds")
print(f"Best parameters: {random_search.best_params_}")
print(f"Best CV score: {random_search.best_score_:.4f}")
```

### Grid Search vs Random Search

```python
import matplotlib.pyplot as plt
import numpy as np

# Simulate search efficiency comparison
np.random.seed(42)

# True optimum location
true_optimal = (0.7, 0.3)

# Generate grid search points (uniform grid)
grid_n = 10
grid_x = np.linspace(0, 1, grid_n)
grid_y = np.linspace(0, 1, grid_n)
grid_points_x, grid_points_y = np.meshgrid(grid_x, grid_y)
grid_points = np.column_stack([grid_points_x.ravel(), grid_points_y.ravel()])

# Generate random search points
n_random = grid_n * grid_n  # Same number of total evaluations
random_points = np.random.rand(n_random, 2)

# Calculate distances to optimal
grid_distances = np.sqrt(np.sum((grid_points - true_optimal)**2, axis=1))
random_distances = np.sqrt(np.sum((random_points - true_optimal)**2, axis=1))

# Plot comparison
fig, axes = plt.subplots(1, 3, figsize=(15, 5))

# Grid search pattern
axes[0].scatter(grid_points[:, 0], grid_points[:, 1], c='blue', alpha=0.6, s=30)
axes[0].scatter(*true_optimal, c='red', marker='*', s=200, label='True optimal')
axes[0].set_title(f'Grid Search (min dist: {grid_distances.min():.3f})')
axes[0].set_xlabel('Parameter 1')
axes[0].set_ylabel('Parameter 2')
axes[0].legend()

# Random search pattern
axes[1].scatter(random_points[:, 0], random_points[:, 1], c='green', alpha=0.6, s=30)
axes[1].scatter(*true_optimal, c='red', marker='*', s=200, label='True optimal')
axes[1].set_title(f'Random Search (min dist: {random_distances.min():.3f})')
axes[1].set_xlabel('Parameter 1')
axes[1].set_ylabel('Parameter 2')
axes[1].legend()

# Distance distribution comparison
axes[2].hist(grid_distances, bins=20, alpha=0.5, label='Grid Search', color='blue')
axes[2].hist(random_distances, bins=20, alpha=0.5, label='Random Search', color='green')
axes[2].axvline(grid_distances.min(), color='blue', linestyle='--')
axes[2].axvline(random_distances.min(), color='green', linestyle='--')
axes[2].set_title('Distance to Optimal Distribution')
axes[2].set_xlabel('Distance')
axes[2].set_ylabel('Frequency')
axes[2].legend()

plt.tight_layout()
plt.savefig('grid_vs_random_search.png', dpi=150)
plt.show()

print("\nSearch Method Comparison")
print("=" * 50)
print(f"Grid Search - Closest point distance: {grid_distances.min():.4f}")
print(f"Random Search - Closest point distance: {random_distances.min():.4f}")
```

### Log-Scale Sampling for Learning Rates

Many hyperparameters, like learning rates, are best searched on a logarithmic scale.

```python
from scipy.stats import loguniform

# Log-uniform distribution for learning rate
# Values between 1e-4 and 1e-1 are equally likely on log scale
learning_rate_dist = loguniform(1e-4, 1e-1)

# Sample and visualize
samples = learning_rate_dist.rvs(10000)

fig, axes = plt.subplots(1, 2, figsize=(12, 4))

# Linear scale histogram
axes[0].hist(samples, bins=50, edgecolor='black')
axes[0].set_xlabel('Learning Rate')
axes[0].set_ylabel('Frequency')
axes[0].set_title('Log-Uniform Sampling (Linear Scale)')

# Log scale histogram
axes[1].hist(np.log10(samples), bins=50, edgecolor='black')
axes[1].set_xlabel('Log10(Learning Rate)')
axes[1].set_ylabel('Frequency')
axes[1].set_title('Log-Uniform Sampling (Log Scale)')

plt.tight_layout()
plt.show()

# Example: XGBoost random search with log-scale learning rate
from sklearn.datasets import make_classification

X_xgb, y_xgb = make_classification(n_samples=1000, n_features=20, random_state=42)

try:
    from xgboost import XGBClassifier

    xgb_param_dist = {
        'n_estimators': randint(50, 500),
        'max_depth': randint(3, 10),
        'learning_rate': loguniform(1e-3, 0.3),
        'subsample': uniform(0.6, 0.4),
        'colsample_bytree': uniform(0.6, 0.4),
        'min_child_weight': randint(1, 10),
        'reg_alpha': loguniform(1e-3, 10),
        'reg_lambda': loguniform(1e-3, 10)
    }

    xgb_random = RandomizedSearchCV(
        XGBClassifier(random_state=42, use_label_encoder=False, eval_metric='logloss'),
        xgb_param_dist,
        n_iter=50,
        cv=5,
        scoring='accuracy',
        n_jobs=-1,
        random_state=42
    )

    xgb_random.fit(X_xgb, y_xgb)
    print(f"Best XGBoost params: {xgb_random.best_params_}")
    print(f"Best score: {xgb_random.best_score_:.4f}")
except ImportError:
    print("XGBoost not installed. Install with: pip install xgboost")
```

## Bayesian Optimization with Optuna

Bayesian optimization uses probabilistic models to guide the search toward promising hyperparameter regions. Optuna is a state-of-the-art framework for hyperparameter optimization.

### Introduction to Optuna

```python
import optuna
from optuna.samplers import TPESampler
from sklearn.model_selection import cross_val_score
from sklearn.ensemble import RandomForestClassifier

# Suppress Optuna info logs
optuna.logging.set_verbosity(optuna.logging.WARNING)

def objective(trial):
    """Optuna objective function for Random Forest optimization."""

    # Define hyperparameter search space
    params = {
        'n_estimators': trial.suggest_int('n_estimators', 50, 500),
        'max_depth': trial.suggest_int('max_depth', 3, 30),
        'min_samples_split': trial.suggest_int('min_samples_split', 2, 20),
        'min_samples_leaf': trial.suggest_int('min_samples_leaf', 1, 10),
        'max_features': trial.suggest_float('max_features', 0.1, 1.0),
        'bootstrap': trial.suggest_categorical('bootstrap', [True, False])
    }

    model = RandomForestClassifier(**params, random_state=42, n_jobs=-1)

    # Cross-validation score
    scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')

    return scores.mean()

# Create study with TPE sampler (Tree-structured Parzen Estimator)
study = optuna.create_study(
    direction='maximize',  # We want to maximize accuracy
    sampler=TPESampler(seed=42)
)

# Run optimization
study.optimize(objective, n_trials=100, show_progress_bar=True)

print("\nOptuna Optimization Results")
print("=" * 50)
print(f"Best trial value (accuracy): {study.best_trial.value:.4f}")
print(f"Best parameters:")
for key, value in study.best_trial.params.items():
    print(f"  {key}: {value}")
```

### Advanced Optuna Features

```python
from optuna.visualization import (
    plot_optimization_history,
    plot_param_importances,
    plot_parallel_coordinate,
    plot_contour
)

# Visualization of optimization history
fig = plot_optimization_history(study)
fig.show()

# Parameter importance
fig = plot_param_importances(study)
fig.show()

# Parallel coordinate plot
fig = plot_parallel_coordinate(study)
fig.show()

# Contour plot for two important parameters
fig = plot_contour(study, params=['n_estimators', 'max_depth'])
fig.show()
```

### Conditional Hyperparameters

Optuna supports conditional hyperparameters where some parameters depend on others.

```python
def objective_with_conditions(trial):
    """Objective with conditional hyperparameters."""

    # Choose classifier type
    classifier_name = trial.suggest_categorical(
        'classifier', ['RandomForest', 'SVM', 'GradientBoosting']
    )

    if classifier_name == 'RandomForest':
        params = {
            'n_estimators': trial.suggest_int('rf_n_estimators', 50, 300),
            'max_depth': trial.suggest_int('rf_max_depth', 3, 20),
            'min_samples_split': trial.suggest_int('rf_min_samples_split', 2, 10)
        }
        model = RandomForestClassifier(**params, random_state=42)

    elif classifier_name == 'SVM':
        from sklearn.svm import SVC
        kernel = trial.suggest_categorical('svm_kernel', ['rbf', 'poly', 'sigmoid'])
        params = {
            'C': trial.suggest_float('svm_C', 1e-3, 100, log=True),
            'kernel': kernel,
            'gamma': trial.suggest_float('svm_gamma', 1e-4, 1, log=True)
        }
        if kernel == 'poly':
            params['degree'] = trial.suggest_int('svm_degree', 2, 5)
        model = SVC(**params, random_state=42)

    else:  # GradientBoosting
        from sklearn.ensemble import GradientBoostingClassifier
        params = {
            'n_estimators': trial.suggest_int('gb_n_estimators', 50, 300),
            'learning_rate': trial.suggest_float('gb_learning_rate', 1e-3, 0.3, log=True),
            'max_depth': trial.suggest_int('gb_max_depth', 3, 10),
            'subsample': trial.suggest_float('gb_subsample', 0.6, 1.0)
        }
        model = GradientBoostingClassifier(**params, random_state=42)

    scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
    return scores.mean()

# Create and run study
study_conditional = optuna.create_study(direction='maximize', sampler=TPESampler(seed=42))
study_conditional.optimize(objective_with_conditions, n_trials=100, show_progress_bar=True)

print("\nConditional Optimization Results")
print("=" * 50)
print(f"Best classifier: {study_conditional.best_trial.params['classifier']}")
print(f"Best accuracy: {study_conditional.best_trial.value:.4f}")
print("Best parameters:")
for key, value in study_conditional.best_trial.params.items():
    print(f"  {key}: {value}")
```

### Pruning Unpromising Trials

Optuna can terminate unpromising trials early, saving computational resources.

```python
from optuna.pruners import MedianPruner, SuccessiveHalvingPruner
from sklearn.model_selection import StratifiedKFold

def objective_with_pruning(trial):
    """Objective with early stopping via pruning."""

    params = {
        'n_estimators': trial.suggest_int('n_estimators', 50, 500),
        'max_depth': trial.suggest_int('max_depth', 3, 20),
        'min_samples_split': trial.suggest_int('min_samples_split', 2, 15),
        'min_samples_leaf': trial.suggest_int('min_samples_leaf', 1, 10)
    }

    model = RandomForestClassifier(**params, random_state=42, n_jobs=-1)

    # Manual cross-validation to enable pruning
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scores = []

    for step, (train_idx, val_idx) in enumerate(skf.split(X, y)):
        X_train_fold, X_val_fold = X[train_idx], X[val_idx]
        y_train_fold, y_val_fold = y[train_idx], y[val_idx]

        model.fit(X_train_fold, y_train_fold)
        score = model.score(X_val_fold, y_val_fold)
        scores.append(score)

        # Report intermediate value for pruning
        trial.report(np.mean(scores), step)

        # Check if trial should be pruned
        if trial.should_prune():
            raise optuna.TrialPruned()

    return np.mean(scores)

# Create study with pruner
study_pruned = optuna.create_study(
    direction='maximize',
    sampler=TPESampler(seed=42),
    pruner=MedianPruner(n_startup_trials=10, n_warmup_steps=2)
)

study_pruned.optimize(objective_with_pruning, n_trials=100, show_progress_bar=True)

# Analyze pruning statistics
pruned_trials = [t for t in study_pruned.trials if t.state == optuna.trial.TrialState.PRUNED]
complete_trials = [t for t in study_pruned.trials if t.state == optuna.trial.TrialState.COMPLETE]

print(f"\nPruning Statistics")
print("=" * 50)
print(f"Completed trials: {len(complete_trials)}")
print(f"Pruned trials: {len(pruned_trials)}")
print(f"Pruning rate: {len(pruned_trials)/len(study_pruned.trials)*100:.1f}%")
print(f"Best accuracy: {study_pruned.best_trial.value:.4f}")
```

### Multi-Objective Optimization

Optuna supports optimizing multiple objectives simultaneously (e.g., accuracy and inference time).

```python
import time

def multi_objective(trial):
    """Multi-objective: maximize accuracy while minimizing training time."""

    params = {
        'n_estimators': trial.suggest_int('n_estimators', 10, 300),
        'max_depth': trial.suggest_int('max_depth', 2, 20),
        'min_samples_split': trial.suggest_int('min_samples_split', 2, 20)
    }

    model = RandomForestClassifier(**params, random_state=42, n_jobs=1)

    # Measure training time
    start = time.time()
    scores = cross_val_score(model, X, y, cv=3, scoring='accuracy')
    train_time = time.time() - start

    return scores.mean(), train_time  # Returns tuple for multi-objective

# Create multi-objective study
study_multi = optuna.create_study(
    directions=['maximize', 'minimize'],  # Maximize accuracy, minimize time
    sampler=TPESampler(seed=42)
)

study_multi.optimize(multi_objective, n_trials=50, show_progress_bar=True)

# Analyze Pareto front
print("\nPareto Front (Best Trade-offs)")
print("=" * 60)
print(f"{'Trial':>6} {'Accuracy':>12} {'Time (s)':>12} {'n_estimators':>15}")
print("-" * 60)

for trial in study_multi.best_trials:
    print(f"{trial.number:>6} {trial.values[0]:>12.4f} {trial.values[1]:>12.4f} "
          f"{trial.params['n_estimators']:>15}")
```

## Early Stopping

Early stopping prevents overfitting by monitoring validation performance during training and stopping when performance degrades.

### Early Stopping in Gradient Boosting

```python
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train with early stopping
gb_model = GradientBoostingClassifier(
    n_estimators=1000,  # Maximum iterations
    validation_fraction=0.2,  # Use 20% for validation
    n_iter_no_change=20,  # Stop if no improvement for 20 iterations
    tol=1e-4,
    random_state=42,
    verbose=1
)

gb_model.fit(X_train, y_train)

print(f"\nEarly Stopping Results")
print("=" * 50)
print(f"Maximum iterations: 1000")
print(f"Actual iterations: {gb_model.n_estimators_}")
print(f"Train accuracy: {gb_model.score(X_train, y_train):.4f}")
print(f"Test accuracy: {gb_model.score(X_test, y_test):.4f}")
```

### Early Stopping in XGBoost

```python
try:
    from xgboost import XGBClassifier
    import xgboost as xgb

    # Further split training data for early stopping
    X_train_xgb, X_eval, y_train_xgb, y_eval = train_test_split(
        X_train, y_train, test_size=0.2, random_state=42
    )

    # Create model
    xgb_model = XGBClassifier(
        n_estimators=1000,
        learning_rate=0.01,
        max_depth=6,
        random_state=42,
        use_label_encoder=False,
        eval_metric='logloss',
        early_stopping_rounds=50  # Stop if no improvement for 50 rounds
    )

    # Fit with evaluation set
    xgb_model.fit(
        X_train_xgb, y_train_xgb,
        eval_set=[(X_train_xgb, y_train_xgb), (X_eval, y_eval)],
        verbose=False
    )

    print(f"\nXGBoost Early Stopping Results")
    print("=" * 50)
    print(f"Best iteration: {xgb_model.best_iteration}")
    print(f"Best score: {xgb_model.best_score:.4f}")
    print(f"Test accuracy: {xgb_model.score(X_test, y_test):.4f}")

    # Plot learning curve
    results = xgb_model.evals_result()

    plt.figure(figsize=(10, 5))
    plt.plot(results['validation_0']['logloss'], label='Train')
    plt.plot(results['validation_1']['logloss'], label='Validation')
    plt.axvline(x=xgb_model.best_iteration, color='red', linestyle='--',
                label=f'Best iteration ({xgb_model.best_iteration})')
    plt.xlabel('Iteration')
    plt.ylabel('Log Loss')
    plt.title('XGBoost Learning Curve with Early Stopping')
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.show()

except ImportError:
    print("XGBoost not installed")
```

### Early Stopping in LightGBM

```python
try:
    import lightgbm as lgb

    # Create datasets
    train_data = lgb.Dataset(X_train_xgb, label=y_train_xgb)
    eval_data = lgb.Dataset(X_eval, label=y_eval, reference=train_data)

    # Parameters
    params = {
        'objective': 'binary',
        'metric': 'binary_logloss',
        'boosting_type': 'gbdt',
        'num_leaves': 31,
        'learning_rate': 0.01,
        'feature_fraction': 0.9,
        'bagging_fraction': 0.8,
        'bagging_freq': 5,
        'verbose': -1,
        'seed': 42
    }

    # Train with early stopping using callbacks
    callbacks = [
        lgb.early_stopping(stopping_rounds=50),
        lgb.log_evaluation(period=100)
    ]

    lgb_model = lgb.train(
        params,
        train_data,
        num_boost_round=1000,
        valid_sets=[train_data, eval_data],
        valid_names=['train', 'valid'],
        callbacks=callbacks
    )

    print(f"\nLightGBM Early Stopping Results")
    print("=" * 50)
    print(f"Best iteration: {lgb_model.best_iteration}")
    print(f"Best score: {lgb_model.best_score['valid']['binary_logloss']:.4f}")

except ImportError:
    print("LightGBM not installed")
```

### Implementing Custom Early Stopping

```python
from sklearn.base import clone
import numpy as np

class EarlyStopping:
    """Custom early stopping callback for iterative models."""

    def __init__(self, patience=10, min_delta=0.001, restore_best=True):
        self.patience = patience
        self.min_delta = min_delta
        self.restore_best = restore_best
        self.best_score = None
        self.best_model = None
        self.counter = 0
        self.history = []

    def __call__(self, model, score):
        """Check if training should stop."""
        self.history.append(score)

        if self.best_score is None:
            self.best_score = score
            if self.restore_best:
                self.best_model = clone(model)
            return False

        if score > self.best_score + self.min_delta:
            self.best_score = score
            self.counter = 0
            if self.restore_best:
                self.best_model = clone(model)
            return False
        else:
            self.counter += 1
            if self.counter >= self.patience:
                return True  # Stop training
            return False

# Example usage with manual training loop
def train_with_early_stopping(X, y, max_iter=500, patience=20):
    """Train a model with custom early stopping."""
    from sklearn.linear_model import SGDClassifier

    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

    early_stop = EarlyStopping(patience=patience, min_delta=0.001)
    model = SGDClassifier(loss='log_loss', max_iter=1, warm_start=True, random_state=42)

    for iteration in range(max_iter):
        model.fit(X_train, y_train)
        val_score = model.score(X_val, y_val)

        if early_stop(model, val_score):
            print(f"Early stopping at iteration {iteration}")
            break

    print(f"Best validation score: {early_stop.best_score:.4f}")
    print(f"Total iterations: {iteration + 1}")

    # Plot training history
    plt.figure(figsize=(10, 5))
    plt.plot(early_stop.history)
    plt.axvline(x=np.argmax(early_stop.history), color='red', linestyle='--',
                label=f'Best iteration ({np.argmax(early_stop.history)})')
    plt.xlabel('Iteration')
    plt.ylabel('Validation Score')
    plt.title('Training Progress with Early Stopping')
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.show()

    return early_stop.best_model if early_stop.restore_best else model

best_model = train_with_early_stopping(X, y)
```

## Model Selection Best Practices

### Nested Cross-Validation

For unbiased model selection and evaluation, use nested cross-validation: an inner loop for hyperparameter tuning and an outer loop for performance estimation.

```python
from sklearn.model_selection import cross_val_score, GridSearchCV, StratifiedKFold

def nested_cross_validation(X, y, estimator, param_grid, inner_cv=3, outer_cv=5):
    """
    Perform nested cross-validation for unbiased model evaluation.

    Inner loop: Hyperparameter tuning
    Outer loop: Performance estimation
    """
    outer_scores = []
    best_params_list = []

    outer_cv_split = StratifiedKFold(n_splits=outer_cv, shuffle=True, random_state=42)
    inner_cv_split = StratifiedKFold(n_splits=inner_cv, shuffle=True, random_state=42)

    for fold, (train_idx, test_idx) in enumerate(outer_cv_split.split(X, y), 1):
        X_train_outer, X_test_outer = X[train_idx], X[test_idx]
        y_train_outer, y_test_outer = y[train_idx], y[test_idx]

        # Inner loop: hyperparameter tuning
        grid_search = GridSearchCV(
            clone(estimator),
            param_grid,
            cv=inner_cv_split,
            scoring='accuracy',
            n_jobs=-1
        )
        grid_search.fit(X_train_outer, y_train_outer)

        # Evaluate on outer test fold
        score = grid_search.score(X_test_outer, y_test_outer)
        outer_scores.append(score)
        best_params_list.append(grid_search.best_params_)

        print(f"Fold {fold}: Test accuracy = {score:.4f}, "
              f"Best params = {grid_search.best_params_}")

    print("\n" + "=" * 60)
    print(f"Nested CV Mean Accuracy: {np.mean(outer_scores):.4f} "
          f"(+/- {np.std(outer_scores)*2:.4f})")

    return outer_scores, best_params_list

# Example
from sklearn.base import clone

param_grid = {
    'n_estimators': [50, 100, 200],
    'max_depth': [5, 10, None],
    'min_samples_split': [2, 5, 10]
}

outer_scores, best_params = nested_cross_validation(
    X, y,
    RandomForestClassifier(random_state=42),
    param_grid
)
```

### Model Comparison Framework

```python
from sklearn.model_selection import cross_validate
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
import pandas as pd

def compare_models(X, y, models, cv=5, scoring=['accuracy', 'f1', 'roc_auc']):
    """
    Compare multiple models using cross-validation.
    """
    results = []

    for name, model in models.items():
        print(f"Evaluating {name}...")

        cv_results = cross_validate(
            model, X, y,
            cv=cv,
            scoring=scoring,
            return_train_score=True,
            n_jobs=-1
        )

        result = {'model': name}
        for metric in scoring:
            train_key = f'train_{metric}'
            test_key = f'test_{metric}'

            result[f'{metric}_train'] = cv_results[train_key].mean()
            result[f'{metric}_test'] = cv_results[test_key].mean()
            result[f'{metric}_std'] = cv_results[test_key].std()
            result[f'{metric}_overfit'] = (
                cv_results[train_key].mean() - cv_results[test_key].mean()
            )

        result['fit_time'] = cv_results['fit_time'].mean()
        results.append(result)

    return pd.DataFrame(results)

# Define models to compare
models = {
    'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
    'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
    'Gradient Boosting': GradientBoostingClassifier(n_estimators=100, random_state=42),
    'SVM (RBF)': SVC(kernel='rbf', probability=True, random_state=42),
    'KNN': KNeighborsClassifier(n_neighbors=5)
}

comparison_results = compare_models(X, y, models)

print("\nModel Comparison Results")
print("=" * 80)
print(comparison_results.to_string(index=False))

# Visualize comparison
fig, axes = plt.subplots(1, 3, figsize=(15, 5))

# Accuracy comparison
comparison_results.plot(
    x='model', y=['accuracy_train', 'accuracy_test'],
    kind='bar', ax=axes[0], rot=45
)
axes[0].set_title('Accuracy: Train vs Test')
axes[0].set_ylabel('Accuracy')

# Overfitting comparison
comparison_results.plot(
    x='model', y='accuracy_overfit',
    kind='bar', ax=axes[1], rot=45, color='orange'
)
axes[1].set_title('Overfitting (Train - Test)')
axes[1].set_ylabel('Accuracy Gap')
axes[1].axhline(y=0, color='black', linestyle='--')

# Fit time comparison
comparison_results.plot(
    x='model', y='fit_time',
    kind='bar', ax=axes[2], rot=45, color='green'
)
axes[2].set_title('Average Fit Time')
axes[2].set_ylabel('Time (seconds)')

plt.tight_layout()
plt.savefig('model_comparison.png', dpi=150)
plt.show()
```

### Final Model Selection Checklist

```python
def model_selection_checklist(model, X_train, X_test, y_train, y_test):
    """
    Comprehensive model evaluation checklist.
    """
    from sklearn.metrics import (
        accuracy_score, precision_score, recall_score, f1_score,
        roc_auc_score, classification_report, confusion_matrix
    )

    print("MODEL SELECTION CHECKLIST")
    print("=" * 60)

    # 1. Performance Metrics
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1] if hasattr(model, 'predict_proba') else None

    print("\n1. PERFORMANCE METRICS")
    print("-" * 40)
    print(f"Accuracy:  {accuracy_score(y_test, y_pred):.4f}")
    print(f"Precision: {precision_score(y_test, y_pred):.4f}")
    print(f"Recall:    {recall_score(y_test, y_pred):.4f}")
    print(f"F1 Score:  {f1_score(y_test, y_pred):.4f}")
    if y_prob is not None:
        print(f"ROC AUC:   {roc_auc_score(y_test, y_prob):.4f}")

    # 2. Overfitting Check
    print("\n2. OVERFITTING CHECK")
    print("-" * 40)
    train_score = model.score(X_train, y_train)
    test_score = model.score(X_test, y_test)
    gap = train_score - test_score
    print(f"Train accuracy: {train_score:.4f}")
    print(f"Test accuracy:  {test_score:.4f}")
    print(f"Gap:            {gap:.4f}")
    if gap > 0.05:
        print("WARNING: Potential overfitting detected!")
    else:
        print("OK: No significant overfitting")

    # 3. Cross-Validation Stability
    print("\n3. CROSS-VALIDATION STABILITY")
    print("-" * 40)
    cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='accuracy')
    print(f"CV Mean:   {cv_scores.mean():.4f}")
    print(f"CV Std:    {cv_scores.std():.4f}")
    print(f"CV Range:  [{cv_scores.min():.4f}, {cv_scores.max():.4f}]")
    if cv_scores.std() > 0.05:
        print("WARNING: High variance across folds")
    else:
        print("OK: Stable across folds")

    # 4. Confusion Matrix
    print("\n4. CONFUSION MATRIX")
    print("-" * 40)
    cm = confusion_matrix(y_test, y_pred)
    print(cm)

    # 5. Classification Report
    print("\n5. CLASSIFICATION REPORT")
    print("-" * 40)
    print(classification_report(y_test, y_pred))

    return {
        'train_score': train_score,
        'test_score': test_score,
        'cv_mean': cv_scores.mean(),
        'cv_std': cv_scores.std()
    }

# Run checklist
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
best_model = RandomForestClassifier(**random_search.best_params_, random_state=42)
results = model_selection_checklist(best_model, X_train, X_test, y_train, y_test)
```

### Common Pitfalls and Solutions

| Pitfall | Problem | Solution |
|---------|---------|----------|
| Data Leakage | Test data influences model training | Use proper train/val/test splits; fit preprocessors on training data only |
| Overfitting to Validation | Repeated evaluation on same validation set | Use nested CV or hold out a separate test set |
| Selection Bias | Choosing model based on test performance | Use validation set for selection; test set only for final evaluation |
| Hyperparameter Overfitting | Too many hyperparameter combinations tried | Limit search space; use early stopping in optimization |
| Ignoring Computational Cost | Selecting model without considering inference time | Include inference time in evaluation criteria |
| Class Imbalance | Poor performance on minority class | Use stratified sampling; consider appropriate metrics |

```python
# Example: Preventing data leakage with pipelines
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer

# WRONG: Fitting preprocessor on all data before split
# scaler = StandardScaler()
# X_scaled = scaler.fit_transform(X)  # Data leakage!
# X_train, X_test, y_train, y_test = train_test_split(X_scaled, y)

# CORRECT: Use pipeline to ensure proper data handling
pipeline = Pipeline([
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler()),
    ('classifier', RandomForestClassifier(random_state=42))
])

# Grid search with pipeline ensures no leakage
param_grid_safe = {
    'classifier__n_estimators': [50, 100],
    'classifier__max_depth': [5, 10, None]
}

grid_search_safe = GridSearchCV(
    pipeline,
    param_grid_safe,
    cv=5,
    scoring='accuracy'
)
grid_search_safe.fit(X_train, y_train)

print(f"Safe Grid Search Score: {grid_search_safe.best_score_:.4f}")
```

## Summary

Model selection and hyperparameter tuning are essential skills for any machine learning practitioner. This guide covered:

1. **Data Splitting**: Proper train/validation/test splits prevent information leakage and enable unbiased evaluation.

2. **K-Fold Cross-Validation**: Provides reliable performance estimates by averaging over multiple train/test splits. Use stratified K-fold for classification and time series CV for temporal data.

3. **Stratified Sampling**: Ensures representative splits, especially crucial for imbalanced datasets and when preserving subgroup distributions matters.

4. **Grid Search**: Exhaustively evaluates all hyperparameter combinations. Best for small search spaces where you want to guarantee finding the optimal combination.

5. **Random Search**: More efficient for large search spaces. Often finds good solutions faster than grid search.

6. **Bayesian Optimization (Optuna)**: Uses probabilistic models to intelligently explore the hyperparameter space. Best for expensive objective functions and complex search spaces.

7. **Early Stopping**: Prevents overfitting by monitoring validation performance and stopping when it degrades.

8. **Best Practices**: Nested cross-validation for unbiased evaluation, proper model comparison frameworks, and avoiding common pitfalls like data leakage.

### Key Recommendations

- Start with random search to understand the hyperparameter landscape
- Use Bayesian optimization (Optuna) for fine-tuning after narrowing the search space
- Always use nested cross-validation when reporting final model performance
- Consider computational cost alongside predictive performance
- Document your experimental setup for reproducibility
- Use pipelines to prevent data leakage

By following these principles and techniques, you can build models that perform well on validation data and generalize effectively to real-world applications.
