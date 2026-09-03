---
title: "Classical ML: XGBoost and LightGBM"
description: "Master top tabular data models: GBDT, XGBoost, LightGBM, and CatBoost"
track: datascience
section: classical-ml
difficulty: advanced
tags:
  - XGBoost
  - LightGBM
  - GBDT
  - Boosting
status: imported
origin: old/src/content/docs/datascience/xgboost-lightgbm.en.md
divergence: 0.413
issues:
  - divergent
legacy:
  category: DataScience
  subcategory: ClassicalML
  order: 14
  lastUpdated: 2026-01-07
---

Gradient Boosted Decision Trees (GBDT) have dominated machine learning competitions and real-world tabular data applications for over a decade. XGBoost, LightGBM, and CatBoost represent the state-of-the-art implementations that power countless production systems worldwide. This comprehensive guide covers the theoretical foundations of gradient boosting, the innovations that make each library unique, and practical techniques for achieving winning performance.

## Gradient Boosted Decision Trees (GBDT) Fundamentals

### Understanding Ensemble Methods

Ensemble methods combine multiple base learners to create a stronger model. The two primary approaches are:

**Bagging (Bootstrap Aggregating)**: Trains multiple models on random subsets of data in parallel. Random Forest is the classic example, where each tree votes independently and results are averaged.

**Boosting**: Trains models sequentially, with each new model focusing on the errors of previous ones. Gradient boosting is the most powerful variant, using gradient descent to minimize a loss function.

### The Gradient Boosting Algorithm

Gradient boosting builds an additive model by iteratively fitting new base learners to the negative gradient (pseudo-residuals) of the loss function:

**Mathematical Foundation:**

For a loss function $L(y, F(x))$, gradient boosting constructs:

$$F_m(x) = F_{m-1}(x) + \eta \cdot h_m(x)$$

Where:
- $F_m(x)$ is the model at iteration m
- $\eta$ is the learning rate (shrinkage)
- $h_m(x)$ is the new base learner fitted to negative gradients

**Pseudo-residuals:**

$$r_{im} = -\left[\frac{\partial L(y_i, F(x_i))}{\partial F(x_i)}\right]_{F=F_{m-1}}$$

For squared error loss: $r_{im} = y_i - F_{m-1}(x_i)$

```python
import numpy as np
from sklearn.tree import DecisionTreeRegressor

class SimpleGradientBoosting:
    """
    Simple gradient boosting implementation for educational purposes
    """
    def __init__(self, n_estimators=100, learning_rate=0.1, max_depth=3):
        self.n_estimators = n_estimators
        self.learning_rate = learning_rate
        self.max_depth = max_depth
        self.trees = []
        self.initial_prediction = None

    def fit(self, X, y):
        # Initialize with mean prediction
        self.initial_prediction = np.mean(y)
        current_prediction = np.full(len(y), self.initial_prediction)

        for _ in range(self.n_estimators):
            # Compute pseudo-residuals (negative gradient for MSE)
            residuals = y - current_prediction

            # Fit tree to residuals
            tree = DecisionTreeRegressor(max_depth=self.max_depth)
            tree.fit(X, residuals)
            self.trees.append(tree)

            # Update predictions with learning rate
            current_prediction += self.learning_rate * tree.predict(X)

        return self

    def predict(self, X):
        prediction = np.full(len(X), self.initial_prediction)
        for tree in self.trees:
            prediction += self.learning_rate * tree.predict(X)
        return prediction
```

### Key Concepts in GBDT

**Learning Rate (Shrinkage)**: Controls the contribution of each tree. Lower values require more trees but often generalize better.

**Tree Depth**: Deeper trees capture more complex interactions but risk overfitting. Typically 3-10 for boosting.

**Number of Estimators**: More trees can improve performance but increase training time and risk overfitting.

**Subsampling**: Using random subsets of data or features per tree reduces overfitting and training time.

```python
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split

# Create sample dataset
X, y = make_classification(n_samples=10000, n_features=20, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Sklearn Gradient Boosting
gb_model = GradientBoostingClassifier(
    n_estimators=100,
    learning_rate=0.1,
    max_depth=5,
    subsample=0.8,
    random_state=42
)
gb_model.fit(X_train, y_train)
print(f"Sklearn GB Accuracy: {gb_model.score(X_test, y_test):.4f}")
```

## XGBoost: Extreme Gradient Boosting

XGBoost (eXtreme Gradient Boosting), developed by Tianqi Chen, introduced groundbreaking innovations that made gradient boosting faster, more scalable, and more accurate. It became the dominant algorithm in machine learning competitions.

### XGBoost Innovations

**Regularized Learning Objective:**

XGBoost adds regularization directly to the objective function:

$$\mathcal{L}(\phi) = \sum_i l(y_i, \hat{y}_i) + \sum_k \Omega(f_k)$$

Where the regularization term:

$$\Omega(f) = \gamma T + \frac{1}{2}\lambda \sum_{j=1}^T w_j^2$$

- $T$ = number of leaves
- $w_j$ = leaf weights
- $\gamma$ = complexity penalty for adding leaves
- $\lambda$ = L2 regularization on leaf weights

**Second-Order Approximation:**

XGBoost uses a second-order Taylor expansion of the loss:

$$\mathcal{L}^{(t)} \approx \sum_{i=1}^n [g_i f_t(x_i) + \frac{1}{2} h_i f_t^2(x_i)] + \Omega(f_t)$$

Where:
- $g_i = \partial_{\hat{y}} l(y_i, \hat{y}^{(t-1)})$ (gradient)
- $h_i = \partial^2_{\hat{y}} l(y_i, \hat{y}^{(t-1)})$ (hessian)

This enables exact greedy algorithms and weighted quantile sketch for split finding.

**Sparsity-Aware Split Finding:**

XGBoost handles missing values natively by learning the optimal direction for missing values at each split.

### System Optimizations

**Column Block for Parallel Learning**: Data is stored in compressed column format, enabling parallel computation of split candidates.

**Cache-Aware Access**: Block structure is designed to minimize cache misses during gradient computation.

**Out-of-Core Computing**: Support for training on data that doesn't fit in memory using disk-based computation.

### XGBoost Implementation

```python
import xgboost as xgb
from sklearn.metrics import accuracy_score, roc_auc_score
import matplotlib.pyplot as plt

# Create DMatrix (XGBoost's optimized data structure)
dtrain = xgb.DMatrix(X_train, label=y_train)
dtest = xgb.DMatrix(X_test, label=y_test)

# XGBoost parameters
params = {
    'objective': 'binary:logistic',
    'eval_metric': ['logloss', 'auc'],
    'max_depth': 6,
    'learning_rate': 0.1,
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'min_child_weight': 1,
    'gamma': 0,
    'lambda': 1,  # L2 regularization
    'alpha': 0,   # L1 regularization
    'seed': 42
}

# Train with evaluation
evals = [(dtrain, 'train'), (dtest, 'eval')]
evals_result = {}

xgb_model = xgb.train(
    params,
    dtrain,
    num_boost_round=500,
    evals=evals,
    evals_result=evals_result,
    early_stopping_rounds=50,
    verbose_eval=50
)

# Predictions
y_pred_proba = xgb_model.predict(dtest)
y_pred = (y_pred_proba > 0.5).astype(int)

print(f"\nXGBoost Results:")
print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
print(f"AUC-ROC: {roc_auc_score(y_test, y_pred_proba):.4f}")
print(f"Best iteration: {xgb_model.best_iteration}")
```

### XGBoost with Scikit-Learn API

```python
from xgboost import XGBClassifier
from sklearn.model_selection import cross_val_score

# Scikit-learn compatible interface
xgb_clf = XGBClassifier(
    n_estimators=500,
    max_depth=6,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=1,
    reg_lambda=1,
    reg_alpha=0,
    use_label_encoder=False,
    eval_metric='logloss',
    early_stopping_rounds=50,
    random_state=42
)

# Fit with early stopping
xgb_clf.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    verbose=False
)

# Cross-validation
cv_scores = cross_val_score(
    XGBClassifier(n_estimators=100, random_state=42),
    X, y, cv=5, scoring='accuracy'
)
print(f"CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
```

### XGBoost Key Parameters

| Category | Parameter | Description | Typical Values |
|----------|-----------|-------------|----------------|
| **Tree** | max_depth | Maximum tree depth | 3-10 |
| | min_child_weight | Minimum sum of instance weight in child | 1-10 |
| | gamma | Minimum loss reduction for split | 0-5 |
| **Sampling** | subsample | Row sampling ratio | 0.5-1.0 |
| | colsample_bytree | Feature sampling per tree | 0.5-1.0 |
| | colsample_bylevel | Feature sampling per level | 0.5-1.0 |
| **Regularization** | lambda (reg_lambda) | L2 regularization | 0-10 |
| | alpha (reg_alpha) | L1 regularization | 0-10 |
| **Learning** | learning_rate (eta) | Step size shrinkage | 0.01-0.3 |
| | n_estimators | Number of boosting rounds | 100-10000 |

## LightGBM: Light Gradient Boosting Machine

LightGBM, developed by Microsoft, introduced revolutionary techniques that dramatically improved training speed while maintaining accuracy. It is often the go-to choice for large-scale datasets.

### LightGBM Innovations

**Gradient-based One-Side Sampling (GOSS):**

GOSS keeps instances with large gradients (underfit) and randomly samples those with small gradients:

1. Sort instances by absolute gradient
2. Select top a% instances with largest gradients
3. Randomly sample b% from remaining instances
4. Amplify sampled instances by factor (1-a)/b

This reduces data size while preserving gradient information.

```python
# Conceptual illustration of GOSS
def goss_sampling(gradients, top_rate=0.2, other_rate=0.1):
    """
    Gradient-based One-Side Sampling
    """
    n = len(gradients)
    sorted_indices = np.argsort(np.abs(gradients))[::-1]

    # Top instances with large gradients
    top_n = int(n * top_rate)
    top_indices = sorted_indices[:top_n]

    # Random sample from remaining
    remaining_indices = sorted_indices[top_n:]
    rand_n = int(n * other_rate)
    rand_indices = np.random.choice(remaining_indices, rand_n, replace=False)

    # Weight amplification factor for sampled instances
    weight_factor = (1 - top_rate) / other_rate

    return top_indices, rand_indices, weight_factor
```

**Exclusive Feature Bundling (EFB):**

EFB bundles mutually exclusive features (features that rarely take non-zero values simultaneously) to reduce dimensionality:

1. Build a graph where edges connect features that are NOT mutually exclusive
2. Use graph coloring to find feature bundles
3. Merge features in each bundle using offset encoding

This is particularly effective for sparse, high-dimensional data.

**Leaf-Wise (Best-First) Tree Growth:**

Unlike XGBoost's level-wise growth, LightGBM grows trees leaf-wise:

- Splits the leaf with maximum delta loss
- Can produce deeper, more asymmetric trees
- Often achieves better accuracy with fewer leaves
- Requires max_depth or num_leaves constraint to prevent overfitting

**Histogram-Based Split Finding:**

LightGBM buckets continuous features into discrete bins, enabling:
- O(#data x #feature) to O(#bin x #feature) speedup
- Reduced memory usage
- Implicit regularization effect

### LightGBM Implementation

```python
import lightgbm as lgb
from sklearn.metrics import accuracy_score, roc_auc_score

# Create LightGBM datasets
lgb_train = lgb.Dataset(X_train, label=y_train)
lgb_eval = lgb.Dataset(X_test, label=y_test, reference=lgb_train)

# LightGBM parameters
lgb_params = {
    'objective': 'binary',
    'metric': ['binary_logloss', 'auc'],
    'boosting_type': 'gbdt',  # gbdt, dart, goss, rf
    'num_leaves': 31,
    'max_depth': -1,  # -1 means no limit
    'learning_rate': 0.1,
    'feature_fraction': 0.8,  # colsample_bytree equivalent
    'bagging_fraction': 0.8,  # subsample equivalent
    'bagging_freq': 5,
    'min_child_samples': 20,
    'lambda_l1': 0,
    'lambda_l2': 1,
    'verbose': -1,
    'seed': 42
}

# Train with callbacks
callbacks = [
    lgb.early_stopping(stopping_rounds=50),
    lgb.log_evaluation(period=50)
]

lgb_model = lgb.train(
    lgb_params,
    lgb_train,
    num_boost_round=500,
    valid_sets=[lgb_train, lgb_eval],
    valid_names=['train', 'eval'],
    callbacks=callbacks
)

# Predictions
y_pred_proba = lgb_model.predict(X_test)
y_pred = (y_pred_proba > 0.5).astype(int)

print(f"\nLightGBM Results:")
print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
print(f"AUC-ROC: {roc_auc_score(y_test, y_pred_proba):.4f}")
print(f"Best iteration: {lgb_model.best_iteration}")
```

### LightGBM with Scikit-Learn API

```python
from lightgbm import LGBMClassifier

lgbm_clf = LGBMClassifier(
    n_estimators=500,
    num_leaves=31,
    max_depth=-1,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_samples=20,
    reg_lambda=1,
    reg_alpha=0,
    random_state=42,
    verbose=-1
)

# Fit with early stopping
lgbm_clf.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    eval_metric='logloss',
    callbacks=[lgb.early_stopping(50), lgb.log_evaluation(0)]
)

print(f"LightGBM Sklearn API Accuracy: {lgbm_clf.score(X_test, y_test):.4f}")
```

### LightGBM Key Parameters

| Category | Parameter | Description | Typical Values |
|----------|-----------|-------------|----------------|
| **Tree** | num_leaves | Max leaves per tree | 20-300 |
| | max_depth | Max depth (-1 = unlimited) | -1 or 3-15 |
| | min_child_samples | Min data in leaf | 10-100 |
| **Sampling** | feature_fraction | Column sampling | 0.5-1.0 |
| | bagging_fraction | Row sampling | 0.5-1.0 |
| | bagging_freq | Bagging frequency | 1-10 |
| **Regularization** | lambda_l1 | L1 regularization | 0-10 |
| | lambda_l2 | L2 regularization | 0-10 |
| | min_gain_to_split | Min gain for split | 0-1 |
| **Learning** | learning_rate | Step size | 0.01-0.3 |
| | n_estimators | Number of trees | 100-10000 |
| **Speed** | num_threads | Parallel threads | -1 (all) |
| | device_type | cpu or gpu | cpu/gpu |

### LightGBM GOSS and DART Modes

```python
# GOSS (Gradient-based One-Side Sampling)
lgb_goss_params = {
    'boosting_type': 'goss',
    'top_rate': 0.2,      # Top instances ratio
    'other_rate': 0.1,    # Random sample ratio
    'objective': 'binary',
    'metric': 'auc',
    'num_leaves': 31,
    'learning_rate': 0.1,
    'verbose': -1
}

# DART (Dropouts meet Multiple Additive Regression Trees)
lgb_dart_params = {
    'boosting_type': 'dart',
    'drop_rate': 0.1,     # Dropout rate
    'max_drop': 50,       # Max trees to drop
    'skip_drop': 0.5,     # Probability to skip dropout
    'objective': 'binary',
    'metric': 'auc',
    'num_leaves': 31,
    'learning_rate': 0.1,
    'verbose': -1
}
```

## CatBoost: Categorical Boosting

CatBoost, developed by Yandex, excels at handling categorical features natively and introduces ordered boosting to reduce prediction shift.

### CatBoost Innovations

**Ordered Target Statistics (Ordered TS):**

CatBoost addresses the prediction shift problem by computing target statistics using only "past" observations:

$$\hat{x}_k^i = \frac{\sum_{j=1}^{p-1} [x_j = x_k^i] \cdot y_j + a \cdot P}{\sum_{j=1}^{p-1} [x_j = x_k^i] + a}$$

Where:
- $p$ is the current sample's position in a random permutation
- $a$ is a smoothing parameter
- $P$ is the prior (target mean)

**Ordered Boosting:**

Uses different permutations for different tree levels to avoid overfitting.

**Symmetric Trees:**

CatBoost builds balanced, symmetric trees where the same splitting condition is used across all nodes at each level. This enables fast inference via bitwise operations.

### CatBoost Implementation

```python
from catboost import CatBoostClassifier, Pool
from sklearn.metrics import accuracy_score, roc_auc_score

# Create mixed dataset with categorical features
import pandas as pd

np.random.seed(42)
n_samples = 10000
df = pd.DataFrame({
    'num_feat1': np.random.randn(n_samples),
    'num_feat2': np.random.randn(n_samples),
    'cat_feat1': np.random.choice(['A', 'B', 'C', 'D'], n_samples),
    'cat_feat2': np.random.choice(['X', 'Y', 'Z'], n_samples),
    'target': np.random.randint(0, 2, n_samples)
})

# Split data
train_df = df.iloc[:8000]
test_df = df.iloc[8000:]

X_train_cat = train_df.drop('target', axis=1)
y_train_cat = train_df['target']
X_test_cat = test_df.drop('target', axis=1)
y_test_cat = test_df['target']

# Identify categorical columns
cat_features = ['cat_feat1', 'cat_feat2']

# CatBoost classifier
cat_model = CatBoostClassifier(
    iterations=500,
    depth=6,
    learning_rate=0.1,
    loss_function='Logloss',
    eval_metric='AUC',
    cat_features=cat_features,
    l2_leaf_reg=3,
    bootstrap_type='Bayesian',
    bagging_temperature=1,
    random_seed=42,
    verbose=50,
    early_stopping_rounds=50
)

# Train
cat_model.fit(
    X_train_cat, y_train_cat,
    eval_set=(X_test_cat, y_test_cat),
    plot=False
)

# Predictions
y_pred_cat = cat_model.predict(X_test_cat)
y_pred_proba_cat = cat_model.predict_proba(X_test_cat)[:, 1]

print(f"\nCatBoost Results:")
print(f"Accuracy: {accuracy_score(y_test_cat, y_pred_cat):.4f}")
print(f"AUC-ROC: {roc_auc_score(y_test_cat, y_pred_proba_cat):.4f}")
```

### CatBoost Key Parameters

| Category | Parameter | Description | Typical Values |
|----------|-----------|-------------|----------------|
| **Tree** | depth | Tree depth | 4-10 |
| | l2_leaf_reg | L2 regularization | 1-10 |
| | min_data_in_leaf | Min samples in leaf | 1-100 |
| **Categorical** | cat_features | Categorical column indices | list |
| | one_hot_max_size | Max categories for one-hot | 2-255 |
| **Sampling** | subsample | Row sampling | 0.5-1.0 |
| | rsm | Column sampling | 0.5-1.0 |
| **Learning** | learning_rate | Step size | 0.01-0.3 |
| | iterations | Number of trees | 100-10000 |
| **Other** | bootstrap_type | Bayesian, Bernoulli, MVS | - |
| | grow_policy | Depthwise, Lossguide | - |

## Library Comparison

### Feature Comparison

| Feature | XGBoost | LightGBM | CatBoost |
|---------|---------|----------|----------|
| Tree Growth | Level-wise | Leaf-wise | Symmetric |
| Categorical Support | Requires encoding | Basic support | Native (Ordered TS) |
| Missing Values | Native handling | Native handling | Native handling |
| GPU Support | Yes | Yes | Yes |
| Distributed Training | Yes | Yes | Yes |
| Speed (Large Data) | Medium | Fastest | Medium |
| Default Performance | Good | Good | Often best |
| Memory Usage | Medium | Low | Higher |

### Speed Benchmark

```python
import time

def benchmark_training(X_train, y_train, X_test, y_test):
    """
    Benchmark training time for each library
    """
    results = {}

    # XGBoost
    start = time.time()
    xgb_clf = XGBClassifier(n_estimators=100, max_depth=6, random_state=42,
                            use_label_encoder=False, eval_metric='logloss')
    xgb_clf.fit(X_train, y_train)
    xgb_time = time.time() - start
    results['XGBoost'] = {
        'time': xgb_time,
        'accuracy': accuracy_score(y_test, xgb_clf.predict(X_test))
    }

    # LightGBM
    start = time.time()
    lgbm_clf = LGBMClassifier(n_estimators=100, max_depth=6, random_state=42,
                              verbose=-1)
    lgbm_clf.fit(X_train, y_train)
    lgbm_time = time.time() - start
    results['LightGBM'] = {
        'time': lgbm_time,
        'accuracy': accuracy_score(y_test, lgbm_clf.predict(X_test))
    }

    # CatBoost
    start = time.time()
    cat_clf = CatBoostClassifier(iterations=100, depth=6, random_seed=42,
                                 verbose=0)
    cat_clf.fit(X_train, y_train)
    cat_time = time.time() - start
    results['CatBoost'] = {
        'time': cat_time,
        'accuracy': accuracy_score(y_test, cat_clf.predict(X_test))
    }

    return results

# Run benchmark
benchmark_results = benchmark_training(X_train, y_train, X_test, y_test)

print("\nBenchmark Results:")
print("-" * 50)
for name, metrics in benchmark_results.items():
    print(f"{name}: Time={metrics['time']:.2f}s, Accuracy={metrics['accuracy']:.4f}")
```

### When to Use Each Library

**Choose XGBoost when:**
- You need a well-documented, battle-tested solution
- Working with medium-sized datasets
- Require extensive community support
- Need monotonic constraints or custom objectives

**Choose LightGBM when:**
- Training speed is critical
- Working with large datasets (millions of rows)
- Memory is a constraint
- High-cardinality categorical features (with proper encoding)

**Choose CatBoost when:**
- Dataset has many categorical features
- Minimal preprocessing is desired
- Need good out-of-box performance
- Working on ranking problems

## Hyperparameter Tuning

### Optuna for Bayesian Optimization

```python
import optuna
from sklearn.model_selection import cross_val_score

def objective_xgb(trial):
    """
    Optuna objective function for XGBoost
    """
    params = {
        'n_estimators': trial.suggest_int('n_estimators', 100, 1000),
        'max_depth': trial.suggest_int('max_depth', 3, 10),
        'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
        'subsample': trial.suggest_float('subsample', 0.5, 1.0),
        'colsample_bytree': trial.suggest_float('colsample_bytree', 0.5, 1.0),
        'min_child_weight': trial.suggest_int('min_child_weight', 1, 10),
        'reg_lambda': trial.suggest_float('reg_lambda', 1e-8, 10.0, log=True),
        'reg_alpha': trial.suggest_float('reg_alpha', 1e-8, 10.0, log=True),
        'gamma': trial.suggest_float('gamma', 0, 5),
        'random_state': 42,
        'use_label_encoder': False,
        'eval_metric': 'logloss'
    }

    model = XGBClassifier(**params)
    score = cross_val_score(model, X_train, y_train, cv=5, scoring='roc_auc').mean()

    return score

# Run optimization
study_xgb = optuna.create_study(direction='maximize')
study_xgb.optimize(objective_xgb, n_trials=100, show_progress_bar=True)

print(f"\nBest XGBoost Parameters:")
print(study_xgb.best_params)
print(f"Best CV AUC: {study_xgb.best_value:.4f}")
```

### LightGBM Hyperparameter Tuning

```python
def objective_lgbm(trial):
    """
    Optuna objective function for LightGBM
    """
    params = {
        'n_estimators': trial.suggest_int('n_estimators', 100, 1000),
        'num_leaves': trial.suggest_int('num_leaves', 20, 300),
        'max_depth': trial.suggest_int('max_depth', 3, 15),
        'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
        'subsample': trial.suggest_float('subsample', 0.5, 1.0),
        'colsample_bytree': trial.suggest_float('colsample_bytree', 0.5, 1.0),
        'min_child_samples': trial.suggest_int('min_child_samples', 5, 100),
        'reg_lambda': trial.suggest_float('reg_lambda', 1e-8, 10.0, log=True),
        'reg_alpha': trial.suggest_float('reg_alpha', 1e-8, 10.0, log=True),
        'min_gain_to_split': trial.suggest_float('min_gain_to_split', 0, 1),
        'random_state': 42,
        'verbose': -1
    }

    model = LGBMClassifier(**params)
    score = cross_val_score(model, X_train, y_train, cv=5, scoring='roc_auc').mean()

    return score

# Run optimization
study_lgbm = optuna.create_study(direction='maximize')
study_lgbm.optimize(objective_lgbm, n_trials=100, show_progress_bar=True)

print(f"\nBest LightGBM Parameters:")
print(study_lgbm.best_params)
print(f"Best CV AUC: {study_lgbm.best_value:.4f}")
```

### Grid Search for Quick Tuning

```python
from sklearn.model_selection import GridSearchCV

# Quick parameter grid for XGBoost
xgb_param_grid = {
    'max_depth': [3, 5, 7],
    'learning_rate': [0.01, 0.1, 0.2],
    'n_estimators': [100, 200, 300],
    'subsample': [0.8, 1.0],
    'colsample_bytree': [0.8, 1.0]
}

xgb_grid = GridSearchCV(
    XGBClassifier(random_state=42, use_label_encoder=False, eval_metric='logloss'),
    xgb_param_grid,
    cv=5,
    scoring='roc_auc',
    n_jobs=-1,
    verbose=1
)

xgb_grid.fit(X_train, y_train)

print(f"Best parameters: {xgb_grid.best_params_}")
print(f"Best CV Score: {xgb_grid.best_score_:.4f}")
```

### Effective Tuning Strategy

A recommended approach for efficient hyperparameter tuning:

```python
def staged_hyperparameter_tuning(X_train, y_train, n_trials=50):
    """
    Three-stage hyperparameter tuning strategy
    """
    # Stage 1: Find good n_estimators with default params and early stopping
    print("Stage 1: Finding optimal n_estimators...")
    model_stage1 = LGBMClassifier(random_state=42, verbose=-1)
    model_stage1.fit(
        X_train, y_train,
        eval_set=[(X_train, y_train)],
        eval_metric='auc',
        callbacks=[lgb.early_stopping(50), lgb.log_evaluation(0)]
    )
    best_n_estimators = model_stage1.best_iteration_
    print(f"  Best n_estimators: {best_n_estimators}")

    # Stage 2: Tune tree structure parameters
    print("\nStage 2: Tuning tree structure...")
    def objective_structure(trial):
        params = {
            'n_estimators': best_n_estimators,
            'num_leaves': trial.suggest_int('num_leaves', 20, 150),
            'max_depth': trial.suggest_int('max_depth', 3, 12),
            'min_child_samples': trial.suggest_int('min_child_samples', 10, 100),
            'random_state': 42,
            'verbose': -1
        }
        model = LGBMClassifier(**params)
        return cross_val_score(model, X_train, y_train, cv=3, scoring='roc_auc').mean()

    study_structure = optuna.create_study(direction='maximize')
    study_structure.optimize(objective_structure, n_trials=n_trials // 2, show_progress_bar=True)
    best_structure = study_structure.best_params

    # Stage 3: Tune regularization and sampling
    print("\nStage 3: Tuning regularization...")
    def objective_reg(trial):
        params = {
            'n_estimators': best_n_estimators,
            **best_structure,
            'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
            'subsample': trial.suggest_float('subsample', 0.5, 1.0),
            'colsample_bytree': trial.suggest_float('colsample_bytree', 0.5, 1.0),
            'reg_lambda': trial.suggest_float('reg_lambda', 1e-3, 10.0, log=True),
            'reg_alpha': trial.suggest_float('reg_alpha', 1e-3, 10.0, log=True),
            'random_state': 42,
            'verbose': -1
        }
        model = LGBMClassifier(**params)
        return cross_val_score(model, X_train, y_train, cv=3, scoring='roc_auc').mean()

    study_reg = optuna.create_study(direction='maximize')
    study_reg.optimize(objective_reg, n_trials=n_trials // 2, show_progress_bar=True)

    # Combine best parameters
    best_params = {
        'n_estimators': best_n_estimators,
        **best_structure,
        **study_reg.best_params
    }

    return best_params
```

## Early Stopping

Early stopping prevents overfitting by monitoring validation performance and stopping when it degrades.

### XGBoost Early Stopping

```python
# XGBoost with early stopping
xgb_es_model = xgb.train(
    params,
    dtrain,
    num_boost_round=10000,  # Set high, early stopping will determine actual
    evals=[(dtrain, 'train'), (dtest, 'eval')],
    early_stopping_rounds=50,  # Stop if no improvement for 50 rounds
    verbose_eval=100
)

print(f"Best iteration: {xgb_es_model.best_iteration}")
print(f"Best score: {xgb_es_model.best_score}")
```

### LightGBM Early Stopping

```python
# LightGBM with early stopping callbacks
lgb_es_model = lgb.train(
    lgb_params,
    lgb_train,
    num_boost_round=10000,
    valid_sets=[lgb_eval],
    callbacks=[
        lgb.early_stopping(stopping_rounds=50, verbose=True),
        lgb.log_evaluation(period=100)
    ]
)

print(f"Best iteration: {lgb_es_model.best_iteration}")
```

### CatBoost Early Stopping

```python
# CatBoost with early stopping
cat_es_model = CatBoostClassifier(
    iterations=10000,
    depth=6,
    learning_rate=0.1,
    early_stopping_rounds=50,
    verbose=100,
    random_seed=42
)

cat_es_model.fit(
    X_train, y_train,
    eval_set=(X_test, y_test)
)

print(f"Best iteration: {cat_es_model.get_best_iteration()}")
```

### Cross-Validation with Early Stopping

```python
# XGBoost cross-validation with early stopping
cv_results = xgb.cv(
    params,
    dtrain,
    num_boost_round=1000,
    nfold=5,
    metrics=['auc', 'logloss'],
    early_stopping_rounds=50,
    verbose_eval=50,
    seed=42
)

optimal_rounds = cv_results['test-auc-mean'].idxmax()
print(f"Optimal boosting rounds: {optimal_rounds}")
print(f"CV AUC: {cv_results['test-auc-mean'].iloc[optimal_rounds]:.4f}")
```

## Feature Importance

Understanding feature importance helps with model interpretation, feature selection, and debugging.

### Built-in Feature Importance

```python
import matplotlib.pyplot as plt

# Train models for comparison
xgb_model_fi = XGBClassifier(n_estimators=100, random_state=42,
                              use_label_encoder=False, eval_metric='logloss')
xgb_model_fi.fit(X_train, y_train)

lgbm_model_fi = LGBMClassifier(n_estimators=100, random_state=42, verbose=-1)
lgbm_model_fi.fit(X_train, y_train)

# XGBoost feature importance (multiple types)
fig, axes = plt.subplots(1, 3, figsize=(18, 6))

# Weight: Number of times feature is used to split
xgb.plot_importance(xgb_model_fi, importance_type='weight', ax=axes[0],
                    title='XGBoost - Weight (Split Count)', max_num_features=10)

# Gain: Average gain when feature is used
xgb.plot_importance(xgb_model_fi, importance_type='gain', ax=axes[1],
                    title='XGBoost - Gain (Avg Improvement)', max_num_features=10)

# Cover: Average coverage when feature is used
xgb.plot_importance(xgb_model_fi, importance_type='cover', ax=axes[2],
                    title='XGBoost - Cover (Avg Samples)', max_num_features=10)

plt.tight_layout()
plt.show()
```

### LightGBM Feature Importance

```python
# LightGBM feature importance
fig, axes = plt.subplots(1, 2, figsize=(14, 6))

# Split importance: number of times feature is used
lgb.plot_importance(lgbm_model_fi, importance_type='split', ax=axes[0],
                    title='LightGBM - Split Count', max_num_features=10)

# Gain importance: total gain from splits using this feature
lgb.plot_importance(lgbm_model_fi, importance_type='gain', ax=axes[1],
                    title='LightGBM - Total Gain', max_num_features=10)

plt.tight_layout()
plt.show()
```

### SHAP Values for Interpretability

SHAP (SHapley Additive exPlanations) provides consistent, theoretically grounded feature importance:

```python
import shap

# Create SHAP explainer for XGBoost
explainer = shap.TreeExplainer(xgb_model_fi)
shap_values = explainer.shap_values(X_test)

# Summary plot
plt.figure(figsize=(10, 8))
shap.summary_plot(shap_values, X_test, plot_type="bar", show=False)
plt.title("SHAP Feature Importance")
plt.tight_layout()
plt.show()

# Detailed summary plot showing feature effects
plt.figure(figsize=(10, 8))
shap.summary_plot(shap_values, X_test, show=False)
plt.title("SHAP Summary - Feature Effects")
plt.tight_layout()
plt.show()
```

### SHAP Dependence Plots

```python
# Dependence plot for top feature
top_feature_idx = np.abs(shap_values).mean(axis=0).argmax()

plt.figure(figsize=(10, 6))
shap.dependence_plot(
    top_feature_idx,
    shap_values,
    X_test,
    interaction_index='auto',
    show=False
)
plt.title(f"SHAP Dependence - Feature {top_feature_idx}")
plt.tight_layout()
plt.show()
```

### Explaining Individual Predictions

```python
# Force plot for single prediction
sample_idx = 0

# Initialize JavaScript visualization
shap.initjs()

# Force plot
shap.force_plot(
    explainer.expected_value,
    shap_values[sample_idx],
    X_test[sample_idx],
    matplotlib=True
)

# Waterfall plot (alternative visualization)
plt.figure(figsize=(10, 6))
shap.plots.waterfall(shap.Explanation(
    values=shap_values[sample_idx],
    base_values=explainer.expected_value,
    data=X_test[sample_idx]
))
plt.tight_layout()
plt.show()
```

### Permutation Importance

```python
from sklearn.inspection import permutation_importance

# Calculate permutation importance
perm_importance = permutation_importance(
    xgb_model_fi, X_test, y_test,
    n_repeats=10,
    random_state=42,
    n_jobs=-1
)

# Sort by importance
sorted_idx = perm_importance.importances_mean.argsort()[::-1]

# Plot
plt.figure(figsize=(10, 8))
plt.boxplot(
    perm_importance.importances[sorted_idx[:15]].T,
    vert=False,
    labels=[f"Feature {i}" for i in sorted_idx[:15]]
)
plt.xlabel("Decrease in Accuracy")
plt.title("Permutation Importance")
plt.tight_layout()
plt.show()
```

## Kaggle Competition Best Practices

### Competition Pipeline

```python
import pandas as pd
import numpy as np
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import roc_auc_score

class KaggleGBDTPipeline:
    """
    Production-ready pipeline for Kaggle competitions using GBDT models
    """

    def __init__(self, n_folds=5, random_state=42):
        self.n_folds = n_folds
        self.random_state = random_state
        self.models = []
        self.oof_predictions = None
        self.feature_importance = None

    def train_kfold(self, X, y, params, model_type='lgb'):
        """
        Train with K-fold cross-validation and return OOF predictions
        """
        kfold = StratifiedKFold(n_splits=self.n_folds, shuffle=True,
                                random_state=self.random_state)

        self.oof_predictions = np.zeros(len(X))
        self.models = []
        feature_importance_list = []

        for fold, (train_idx, val_idx) in enumerate(kfold.split(X, y)):
            print(f"\n{'='*50}")
            print(f"Fold {fold + 1}/{self.n_folds}")
            print('='*50)

            X_train_fold = X.iloc[train_idx] if hasattr(X, 'iloc') else X[train_idx]
            X_val_fold = X.iloc[val_idx] if hasattr(X, 'iloc') else X[val_idx]
            y_train_fold = y.iloc[train_idx] if hasattr(y, 'iloc') else y[train_idx]
            y_val_fold = y.iloc[val_idx] if hasattr(y, 'iloc') else y[val_idx]

            if model_type == 'lgb':
                model = self._train_lgb(X_train_fold, y_train_fold,
                                        X_val_fold, y_val_fold, params)
            elif model_type == 'xgb':
                model = self._train_xgb(X_train_fold, y_train_fold,
                                        X_val_fold, y_val_fold, params)
            elif model_type == 'cat':
                model = self._train_cat(X_train_fold, y_train_fold,
                                        X_val_fold, y_val_fold, params)

            self.models.append(model)

            # OOF predictions
            if model_type == 'lgb':
                self.oof_predictions[val_idx] = model.predict(X_val_fold)
                fi = pd.DataFrame({
                    'feature': X.columns if hasattr(X, 'columns') else range(X.shape[1]),
                    'importance': model.feature_importances_
                })
            elif model_type == 'xgb':
                dval = xgb.DMatrix(X_val_fold)
                self.oof_predictions[val_idx] = model.predict(dval)
                fi = pd.DataFrame({
                    'feature': X.columns if hasattr(X, 'columns') else range(X.shape[1]),
                    'importance': list(model.get_score(importance_type='gain').values())
                })
            elif model_type == 'cat':
                self.oof_predictions[val_idx] = model.predict_proba(X_val_fold)[:, 1]
                fi = pd.DataFrame({
                    'feature': X.columns if hasattr(X, 'columns') else range(X.shape[1]),
                    'importance': model.feature_importances_
                })

            feature_importance_list.append(fi)

            fold_auc = roc_auc_score(y_val_fold, self.oof_predictions[val_idx])
            print(f"Fold {fold + 1} AUC: {fold_auc:.6f}")

        # Aggregate feature importance
        self.feature_importance = pd.concat(feature_importance_list).groupby('feature')['importance'].mean().reset_index()
        self.feature_importance = self.feature_importance.sort_values('importance', ascending=False)

        # Overall OOF score
        oof_auc = roc_auc_score(y, self.oof_predictions)
        print(f"\n{'='*50}")
        print(f"Overall OOF AUC: {oof_auc:.6f}")
        print('='*50)

        return self.oof_predictions

    def _train_lgb(self, X_train, y_train, X_val, y_val, params):
        lgb_train = lgb.Dataset(X_train, label=y_train)
        lgb_val = lgb.Dataset(X_val, label=y_val, reference=lgb_train)

        model = lgb.train(
            params,
            lgb_train,
            num_boost_round=10000,
            valid_sets=[lgb_train, lgb_val],
            valid_names=['train', 'valid'],
            callbacks=[
                lgb.early_stopping(100),
                lgb.log_evaluation(200)
            ]
        )
        return model

    def _train_xgb(self, X_train, y_train, X_val, y_val, params):
        dtrain = xgb.DMatrix(X_train, label=y_train)
        dval = xgb.DMatrix(X_val, label=y_val)

        model = xgb.train(
            params,
            dtrain,
            num_boost_round=10000,
            evals=[(dtrain, 'train'), (dval, 'valid')],
            early_stopping_rounds=100,
            verbose_eval=200
        )
        return model

    def _train_cat(self, X_train, y_train, X_val, y_val, params):
        model = CatBoostClassifier(**params)
        model.fit(
            X_train, y_train,
            eval_set=(X_val, y_val),
            early_stopping_rounds=100,
            verbose=200
        )
        return model

    def predict(self, X_test, model_type='lgb'):
        """
        Generate predictions by averaging across all folds
        """
        predictions = np.zeros(len(X_test))

        for model in self.models:
            if model_type == 'lgb':
                predictions += model.predict(X_test) / self.n_folds
            elif model_type == 'xgb':
                dtest = xgb.DMatrix(X_test)
                predictions += model.predict(dtest) / self.n_folds
            elif model_type == 'cat':
                predictions += model.predict_proba(X_test)[:, 1] / self.n_folds

        return predictions
```

### Feature Engineering for Competitions

```python
def create_competition_features(df, target_col=None):
    """
    Comprehensive feature engineering for tabular competitions
    """
    df = df.copy()

    # Numerical features
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if target_col and target_col in num_cols:
        num_cols.remove(target_col)

    # Statistical features per row
    if len(num_cols) > 1:
        df['row_mean'] = df[num_cols].mean(axis=1)
        df['row_std'] = df[num_cols].std(axis=1)
        df['row_max'] = df[num_cols].max(axis=1)
        df['row_min'] = df[num_cols].min(axis=1)
        df['row_range'] = df['row_max'] - df['row_min']
        df['row_skew'] = df[num_cols].skew(axis=1)
        df['row_kurtosis'] = df[num_cols].kurtosis(axis=1)
        df['row_nunique'] = df[num_cols].nunique(axis=1)
        df['row_zeros'] = (df[num_cols] == 0).sum(axis=1)
        df['row_nulls'] = df[num_cols].isnull().sum(axis=1)

    # Interaction features (pairwise)
    for i, col1 in enumerate(num_cols[:5]):  # Limit to prevent explosion
        for col2 in num_cols[i+1:6]:
            df[f'{col1}_plus_{col2}'] = df[col1] + df[col2]
            df[f'{col1}_minus_{col2}'] = df[col1] - df[col2]
            df[f'{col1}_times_{col2}'] = df[col1] * df[col2]
            df[f'{col1}_div_{col2}'] = df[col1] / (df[col2] + 1e-8)

    # Binning features
    for col in num_cols[:10]:
        df[f'{col}_bin10'] = pd.qcut(df[col], q=10, labels=False, duplicates='drop')

    return df
```

### Ensemble Strategies

```python
def ensemble_predictions(predictions_dict, weights=None, method='average'):
    """
    Ensemble multiple model predictions

    Args:
        predictions_dict: Dict of {model_name: predictions}
        weights: Dict of {model_name: weight} or None for equal weights
        method: 'average', 'rank_average', 'power_average'
    """
    model_names = list(predictions_dict.keys())

    if weights is None:
        weights = {name: 1.0 / len(model_names) for name in model_names}

    # Normalize weights
    total_weight = sum(weights.values())
    weights = {k: v / total_weight for k, v in weights.items()}

    if method == 'average':
        # Weighted average
        ensemble = np.zeros_like(list(predictions_dict.values())[0])
        for name, preds in predictions_dict.items():
            ensemble += weights[name] * preds
        return ensemble

    elif method == 'rank_average':
        # Rank-based averaging (robust to scale differences)
        from scipy.stats import rankdata
        ensemble = np.zeros_like(list(predictions_dict.values())[0])
        for name, preds in predictions_dict.items():
            ranks = rankdata(preds) / len(preds)
            ensemble += weights[name] * ranks
        return ensemble

    elif method == 'power_average':
        # Power average (emphasizes confident predictions)
        power = 2
        ensemble = np.zeros_like(list(predictions_dict.values())[0])
        for name, preds in predictions_dict.items():
            ensemble += weights[name] * np.power(preds, power)
        ensemble = np.power(ensemble, 1/power)
        return ensemble

# Example usage
predictions = {
    'lgb_fold': lgb_predictions,
    'xgb_fold': xgb_predictions,
    'cat_fold': cat_predictions
}

# Optimize weights using validation data
from scipy.optimize import minimize

def optimize_ensemble_weights(predictions_dict, y_true):
    """
    Find optimal ensemble weights using scipy minimize
    """
    def objective(weights):
        ensemble = np.zeros_like(y_true, dtype=float)
        for i, (name, preds) in enumerate(predictions_dict.items()):
            ensemble += weights[i] * preds
        return -roc_auc_score(y_true, ensemble)  # Negative for minimization

    n_models = len(predictions_dict)
    initial_weights = [1.0 / n_models] * n_models

    # Constraints: weights sum to 1, all weights >= 0
    constraints = {'type': 'eq', 'fun': lambda w: sum(w) - 1}
    bounds = [(0, 1)] * n_models

    result = minimize(objective, initial_weights, method='SLSQP',
                     bounds=bounds, constraints=constraints)

    optimal_weights = dict(zip(predictions_dict.keys(), result.x))
    return optimal_weights
```

### Stacking

```python
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import StackingClassifier

def create_stacking_ensemble(base_models, meta_model=None, cv=5):
    """
    Create a stacking ensemble with GBDT base models
    """
    if meta_model is None:
        meta_model = LogisticRegression(C=1, max_iter=1000)

    estimators = [(name, model) for name, model in base_models.items()]

    stacking_clf = StackingClassifier(
        estimators=estimators,
        final_estimator=meta_model,
        cv=cv,
        stack_method='predict_proba',
        n_jobs=-1,
        passthrough=False  # Set True to include original features
    )

    return stacking_clf

# Example
base_models = {
    'lgb': LGBMClassifier(n_estimators=100, random_state=42, verbose=-1),
    'xgb': XGBClassifier(n_estimators=100, random_state=42,
                         use_label_encoder=False, eval_metric='logloss'),
    'cat': CatBoostClassifier(iterations=100, random_seed=42, verbose=0)
}

stacking_model = create_stacking_ensemble(base_models)
stacking_model.fit(X_train, y_train)
stacking_predictions = stacking_model.predict_proba(X_test)[:, 1]
```

### Seed Averaging

```python
def seed_averaged_predictions(X_train, y_train, X_test, params, n_seeds=5, model_type='lgb'):
    """
    Average predictions across different random seeds for stability
    """
    predictions = []

    for seed in range(n_seeds):
        params_seed = params.copy()

        if model_type == 'lgb':
            params_seed['seed'] = seed
            params_seed['feature_fraction_seed'] = seed
            params_seed['bagging_seed'] = seed
            model = LGBMClassifier(**params_seed)
        elif model_type == 'xgb':
            params_seed['seed'] = seed
            model = XGBClassifier(**params_seed)
        elif model_type == 'cat':
            params_seed['random_seed'] = seed
            model = CatBoostClassifier(**params_seed)

        model.fit(X_train, y_train)

        if model_type in ['lgb', 'xgb']:
            pred = model.predict_proba(X_test)[:, 1]
        else:
            pred = model.predict_proba(X_test)[:, 1]

        predictions.append(pred)
        print(f"Seed {seed} completed")

    return np.mean(predictions, axis=0)
```

## Advanced Topics

### GPU Training

```python
# XGBoost GPU
xgb_gpu_params = {
    'tree_method': 'gpu_hist',
    'gpu_id': 0,
    'predictor': 'gpu_predictor',
    'objective': 'binary:logistic',
    'eval_metric': 'auc',
    'max_depth': 6,
    'learning_rate': 0.1
}

# LightGBM GPU
lgb_gpu_params = {
    'device': 'gpu',
    'gpu_platform_id': 0,
    'gpu_device_id': 0,
    'objective': 'binary',
    'metric': 'auc',
    'num_leaves': 31,
    'learning_rate': 0.1
}

# CatBoost GPU
cat_gpu_model = CatBoostClassifier(
    task_type='GPU',
    devices='0',
    iterations=1000,
    depth=6,
    learning_rate=0.1
)
```

### Handling Imbalanced Data

```python
# XGBoost scale_pos_weight
n_positive = y_train.sum()
n_negative = len(y_train) - n_positive
scale_pos_weight = n_negative / n_positive

xgb_imbalanced_params = {
    'scale_pos_weight': scale_pos_weight,
    'objective': 'binary:logistic',
    'eval_metric': 'auc'
}

# LightGBM is_unbalance
lgb_imbalanced_params = {
    'is_unbalance': True,  # Or use scale_pos_weight
    'objective': 'binary',
    'metric': 'auc'
}

# CatBoost auto_class_weights
cat_imbalanced = CatBoostClassifier(
    auto_class_weights='Balanced',  # Or 'SqrtBalanced'
    iterations=500
)

# Alternative: Use sample weights
from sklearn.utils.class_weight import compute_sample_weight
sample_weights = compute_sample_weight('balanced', y_train)
```

### Multi-class Classification

```python
# XGBoost multi-class
xgb_multi_params = {
    'objective': 'multi:softprob',  # or 'multi:softmax'
    'num_class': n_classes,
    'eval_metric': 'mlogloss'
}

# LightGBM multi-class
lgb_multi_params = {
    'objective': 'multiclass',
    'num_class': n_classes,
    'metric': 'multi_logloss'
}

# CatBoost multi-class
cat_multi = CatBoostClassifier(
    loss_function='MultiClass',
    classes_count=n_classes
)
```

### Regression Tasks

```python
# XGBoost regression
xgb_reg_params = {
    'objective': 'reg:squarederror',  # or 'reg:squaredlogerror', 'reg:pseudohubererror'
    'eval_metric': 'rmse'
}

# LightGBM regression
lgb_reg_params = {
    'objective': 'regression',  # or 'regression_l1', 'huber', 'fair'
    'metric': 'rmse'
}

# CatBoost regression
cat_reg = CatBoostRegressor(
    loss_function='RMSE',  # or 'MAE', 'MAPE', 'Quantile'
    iterations=500
)
```

### Custom Objectives and Metrics

```python
# Custom objective function for XGBoost
def custom_asymmetric_mse(predt, dtrain):
    """
    Asymmetric MSE: penalize under-predictions more than over-predictions
    """
    y = dtrain.get_label()
    residual = y - predt
    grad = np.where(residual > 0, -2 * residual * 2, -2 * residual)  # Higher penalty for under
    hess = np.where(residual > 0, 2 * 2, 2)
    return grad, hess

# Custom evaluation metric for XGBoost
def custom_metric_xgb(predt, dtrain):
    """
    Custom F1 score metric
    """
    y = dtrain.get_label()
    pred_binary = (predt > 0.5).astype(int)
    from sklearn.metrics import f1_score
    f1 = f1_score(y, pred_binary)
    return 'custom_f1', -f1  # Negative because XGBoost minimizes

# Use custom objective
xgb_custom_model = xgb.train(
    {'max_depth': 6, 'learning_rate': 0.1},
    dtrain,
    num_boost_round=100,
    obj=custom_asymmetric_mse,
    feval=custom_metric_xgb,
    evals=[(dtest, 'eval')]
)
```

### Monotonic Constraints

```python
# Enforce monotonic relationships
# 1 = increasing, -1 = decreasing, 0 = no constraint

# XGBoost monotonic constraints
xgb_mono_params = {
    'monotone_constraints': '(1,-1,0,0,1)',  # For 5 features
    'objective': 'binary:logistic'
}

# LightGBM monotonic constraints
lgb_mono_params = {
    'monotone_constraints': [1, -1, 0, 0, 1],
    'objective': 'binary'
}

# CatBoost monotonic constraints
cat_mono = CatBoostClassifier(
    monotone_constraints={'feature_0': 1, 'feature_1': -1}
)
```

## Troubleshooting Common Issues

### Overfitting

**Symptoms**: Large gap between training and validation scores

**Solutions**:
```python
# Reduce model complexity
params_reduce_overfit = {
    'max_depth': 4,            # Reduce from 6-10
    'num_leaves': 15,          # For LightGBM
    'min_child_samples': 50,   # Increase
    'min_child_weight': 10,    # For XGBoost
    'subsample': 0.7,          # Reduce
    'colsample_bytree': 0.7,   # Reduce
    'reg_lambda': 5,           # Increase L2
    'reg_alpha': 1,            # Add L1
    'learning_rate': 0.01,     # Reduce
}
```

### Underfitting

**Symptoms**: Both training and validation scores are low

**Solutions**:
```python
# Increase model complexity
params_reduce_underfit = {
    'max_depth': 10,           # Increase
    'num_leaves': 100,         # For LightGBM
    'min_child_samples': 10,   # Decrease
    'n_estimators': 2000,      # Increase
    'learning_rate': 0.1,      # Increase
}
```

### Slow Training

**Solutions**:
```python
# Speed up training
params_faster = {
    'device': 'gpu',           # Use GPU
    'num_threads': -1,         # Use all CPU cores
    'histogram_pool_size': -1,
    'max_bin': 63,             # Reduce bins (default 255)
    'subsample': 0.5,          # More aggressive sampling
    'colsample_bytree': 0.5,
    'early_stopping_rounds': 30,
}
```

### Memory Issues

**Solutions**:
```python
# Reduce memory usage
params_low_memory = {
    'max_bin': 63,
    'min_data_in_bin': 10,
    'feature_pre_filter': True,
    'is_sparse': True,
}

# For XGBoost: Use external memory
dtrain = xgb.DMatrix('train.libsvm#train.cache')
```

## Summary and Best Practices

### Quick Reference

| Task | Recommended Approach |
|------|---------------------|
| Starting point | LightGBM with default params |
| Large dataset (>1M rows) | LightGBM with GOSS |
| Many categorical features | CatBoost |
| Need interpretability | XGBoost with SHAP |
| Production deployment | All three support ONNX |
| GPU training | CatBoost (easiest), XGBoost (stable) |

### Workflow Checklist

1. **Data Preparation**
   - Handle missing values (or let GBDT handle natively)
   - Encode categorical features appropriately
   - Create meaningful features
   - Split data properly (time-based for temporal data)

2. **Initial Modeling**
   - Start with LightGBM default parameters
   - Use early stopping to find optimal iterations
   - Evaluate with cross-validation

3. **Hyperparameter Tuning**
   - Stage 1: n_estimators with early stopping
   - Stage 2: Tree structure (depth, leaves)
   - Stage 3: Regularization and sampling

4. **Validation**
   - Use appropriate CV strategy
   - Monitor for overfitting
   - Check feature importance for sanity

5. **Ensembling**
   - Combine multiple seeds
   - Blend different algorithms
   - Consider stacking for final boost

### Parameter Starting Points

```python
# LightGBM solid baseline
lgb_baseline = {
    'objective': 'binary',
    'metric': 'auc',
    'boosting_type': 'gbdt',
    'num_leaves': 31,
    'learning_rate': 0.05,
    'feature_fraction': 0.8,
    'bagging_fraction': 0.8,
    'bagging_freq': 5,
    'verbose': -1
}

# XGBoost solid baseline
xgb_baseline = {
    'objective': 'binary:logistic',
    'eval_metric': 'auc',
    'max_depth': 6,
    'learning_rate': 0.05,
    'subsample': 0.8,
    'colsample_bytree': 0.8
}

# CatBoost solid baseline
cat_baseline = {
    'iterations': 1000,
    'depth': 6,
    'learning_rate': 0.05,
    'l2_leaf_reg': 3,
    'verbose': 0
}
```

XGBoost, LightGBM, and CatBoost represent the pinnacle of classical machine learning for tabular data. While deep learning has revolutionized many domains, these gradient boosting libraries remain unmatched for structured data problems. Mastering these tools, understanding their unique innovations, and knowing when to apply each will serve any data scientist well in both competitions and production environments.

The key to success lies not just in understanding the algorithms, but in developing intuition for hyperparameter tuning, building robust validation strategies, and creating meaningful features. Combined with proper ensembling techniques, these methods continue to win Kaggle competitions and power critical business applications worldwide.
