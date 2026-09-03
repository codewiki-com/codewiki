---
title: "Classical Machine Learning: Random Forest"
description: "Master the Random Forest ensemble learning method: Bagging principles and practical applications"
track: datascience
section: classical-ml
difficulty: intermediate
tags:
  - Random Forest
  - Ensemble Learning
  - Bagging
  - Machine Learning
status: imported
origin: old/src/content/docs/datascience/random-forest.en.md
divergence: 0.357
issues:
  - divergent
legacy:
  category: DataScience
  subcategory: ClassicalML
  order: 13
  lastUpdated: 2026-01-07
---

Random Forest is one of the most successful ensemble learning algorithms in machine learning, formally proposed by Leo Breiman in 2001. By combining predictions from multiple decision trees, it achieves high accuracy, resistance to overfitting, and strong interpretability, making it widely used for classification, regression, and feature selection tasks. This article covers the principles, implementation, and best practices of Random Forest.

---

## Ensemble Learning Concepts

### What is Ensemble Learning?

Ensemble Learning is a machine learning approach that constructs and combines multiple learners to complete a learning task. Its core idea is "the wisdom of the crowd" - combining multiple weak learners into a strong learner to achieve better generalization performance than any single learner.

**Basic Assumptions of Ensemble Learning:**

1. **Diversity of base learners**: Base learners should have certain differences from each other
2. **Accuracy of base learners**: Each base learner's prediction accuracy should be higher than random guessing
3. **Independence of base learners**: Errors of base learners should be as uncorrelated as possible

### Main Types of Ensemble Learning

| Type | Characteristics | Representative Algorithms | Use Cases |
|------|-----------------|---------------------------|-----------|
| **Bagging** | Parallel training, reduces variance | Random Forest | Reducing overfitting |
| **Boosting** | Sequential training, reduces bias | AdaBoost, XGBoost, LightGBM | Improving accuracy |
| **Stacking** | Multi-layer combination, meta-learning | Stacking, Blending | Competition scenarios |

### Why is Ensemble Learning Effective?

From a statistical perspective, assume there are $n$ independent base learners, each with error $\epsilon$, and errors are mutually independent. If using voting for ensemble, the probability of the ensemble model making an error is:

$$P(\text{error}) = \sum_{k > n/2}^{n} \binom{n}{k} \epsilon^k (1-\epsilon)^{n-k}$$

When $\epsilon < 0.5$, as $n$ increases, the error rate of the ensemble model decreases exponentially. This is the theoretical foundation of ensemble learning.

```python
import numpy as np
import matplotlib.pyplot as plt
from scipy.special import comb

def ensemble_error_rate(n_learners, individual_error):
    """Calculate ensemble model error rate"""
    error_rate = 0
    for k in range(n_learners // 2 + 1, n_learners + 1):
        error_rate += comb(n_learners, k) * (individual_error ** k) * ((1 - individual_error) ** (n_learners - k))
    return error_rate

# Visualize ensemble error rate with different numbers of base learners
n_values = range(1, 101, 2)
individual_errors = [0.3, 0.4, 0.45]

plt.figure(figsize=(10, 6))
for err in individual_errors:
    ensemble_errors = [ensemble_error_rate(n, err) for n in n_values]
    plt.plot(n_values, ensemble_errors, label=f'Individual error rate = {err}')

plt.xlabel('Number of base learners')
plt.ylabel('Ensemble model error rate')
plt.title('Effect of Ensemble Learning')
plt.legend()
plt.grid(True)
plt.show()
```

### Ensemble Learning vs Single Model

| Comparison Dimension | Single Model | Ensemble Model |
|---------------------|--------------|----------------|
| Bias | May be high | Depends on ensemble method |
| Variance | May be high | Usually lower (Bagging) |
| Overfitting risk | Higher | Lower |
| Training time | Short | Long |
| Interpretability | Better | Relatively complex |
| Generalization ability | Average | Usually better |

---

## Bagging Principles

### Bootstrap Aggregating

Bagging (short for Bootstrap Aggregating) is an ensemble learning method proposed by Leo Breiman in 1996. Its core idea is to generate multiple different training subsets through Bootstrap Sampling, train multiple base learners separately, and finally make predictions through voting (classification) or averaging (regression).

**Bagging Workflow:**

```
Original training set D = {(x1,y1), (x2,y2), ..., (xn,yn)}
                    |
    +---------------+---------------+
    |               |               |
Bootstrap sampling  Bootstrap sampling  Bootstrap sampling
    |               |               |
  Subset D1         Subset D2         Subset Dm
    |               |               |
 Base learner h1   Base learner h2   Base learner hm
    |               |               |
    +---------------+---------------+
                    |
          Combination strategy (voting/averaging)
                    |
              Final prediction
```

### Bootstrap Sampling

Bootstrap sampling is a random sampling method with replacement. For a dataset containing $n$ samples, each sampling randomly selects one sample (with replacement), repeated $n$ times, resulting in a Bootstrap sample set of size $n$.

**Key Statistical Property:**

The probability of a sample not being selected in one sampling is $(1 - \frac{1}{n})$, and after $n$ samplings, the probability of not being selected is:

$$P(\text{sample not selected}) = \left(1 - \frac{1}{n}\right)^n$$

When $n \to \infty$:

$$\lim_{n \to \infty} \left(1 - \frac{1}{n}\right)^n = \frac{1}{e} \approx 0.368$$

This means each Bootstrap sample set contains approximately **63.2%** of the unique samples from the original data, with the remaining approximately **36.8%** of samples not selected, called **Out-of-Bag (OOB) samples**.

```python
import numpy as np
from collections import Counter

def bootstrap_sample(data, n_bootstrap):
    """Bootstrap sampling"""
    n_samples = len(data)
    indices = np.random.choice(n_samples, size=n_samples, replace=True)
    return data[indices], indices

# Verify the 36.8% theoretical value
def verify_oob_ratio(n_samples=1000, n_iterations=1000):
    """Verify OOB sample ratio"""
    oob_ratios = []
    data = np.arange(n_samples)

    for _ in range(n_iterations):
        _, indices = bootstrap_sample(data, n_samples)
        unique_indices = len(np.unique(indices))
        oob_ratio = 1 - unique_indices / n_samples
        oob_ratios.append(oob_ratio)

    return np.mean(oob_ratios)

oob_ratio = verify_oob_ratio()
print(f"Experimental OOB ratio: {oob_ratio:.4f}")
print(f"Theoretical OOB ratio: {1/np.e:.4f}")
```

### How Bagging Reduces Variance

Assume the predictions of base learners are independent and identically distributed random variables, each with expectation $\mu$ and variance $\sigma^2$. Averaging the predictions of $m$ base learners:

$$\bar{h}(x) = \frac{1}{m}\sum_{i=1}^{m}h_i(x)$$

Then:
- Expectation: $E[\bar{h}(x)] = \mu$ (unbiased)
- Variance: $Var[\bar{h}(x)] = \frac{\sigma^2}{m}$

The variance after ensemble is reduced to $\frac{1}{m}$ of the original. In practice, there is correlation $\rho$ between base learners:

$$Var[\bar{h}(x)] = \rho\sigma^2 + \frac{1-\rho}{m}\sigma^2$$

Therefore, **reducing correlation between base learners** is key to improving Bagging's effectiveness, which is why Random Forest introduces random feature selection.

```python
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import BaggingClassifier
from sklearn.datasets import make_classification
from sklearn.model_selection import cross_val_score
import numpy as np

# Generate sample data
X, y = make_classification(n_samples=1000, n_features=20,
                          n_informative=10, random_state=42)

# Single decision tree
single_tree = DecisionTreeClassifier(random_state=42)
single_scores = cross_val_score(single_tree, X, y, cv=5)

# Bagging ensemble
bagging = BaggingClassifier(
    estimator=DecisionTreeClassifier(),
    n_estimators=50,
    bootstrap=True,
    random_state=42
)
bagging_scores = cross_val_score(bagging, X, y, cv=5)

print(f"Single decision tree - Average accuracy: {single_scores.mean():.4f} (+/- {single_scores.std()*2:.4f})")
print(f"Bagging ensemble - Average accuracy: {bagging_scores.mean():.4f} (+/- {bagging_scores.std()*2:.4f})")
```

---

## Random Forest Algorithm

### Algorithm Definition

Random Forest is an extended variant of Bagging that introduces a **random feature selection** mechanism during decision tree training. Specifically, when constructing each node of each decision tree, instead of selecting the optimal splitting feature from all features, it first randomly selects a feature subset, then selects the optimal splitting feature from this subset.

**Random Forest's "Dual Randomness":**

1. **Sample randomness**: Generate different training subsets through Bootstrap sampling
2. **Feature randomness**: Only consider a subset of features when splitting each node

### Algorithm Flow

```
Input: Training dataset D = {(x1,y1), ..., (xn,yn)}
       Feature set A = {a1, a2, ..., ap}
       Number of decision trees T
       Number of features to consider at each node k (typically k = sqrt(p) or k = log2(p))

Output: Random Forest model H(x)

Algorithm steps:
for t = 1 to T do:
    1. Bootstrap sample from D to get subset Dt
    2. Train decision tree ht using Dt:
       - At each node split:
         a. Randomly select k features from A to form subset As
         b. Select optimal splitting feature from As for splitting
       - Continue splitting until stopping condition is met
end for

Final prediction:
- Classification: H(x) = argmax_y sum(I(ht(x) = y))  (majority voting)
- Regression: H(x) = (1/T) sum(ht(x))  (average)
```

### Random Forest Implementation from Scratch

```python
import numpy as np
from collections import Counter

class DecisionTreeNode:
    """Decision tree node"""
    def __init__(self, feature_idx=None, threshold=None, left=None,
                 right=None, value=None):
        self.feature_idx = feature_idx  # Splitting feature index
        self.threshold = threshold      # Splitting threshold
        self.left = left               # Left subtree
        self.right = right             # Right subtree
        self.value = value             # Leaf node prediction value

class DecisionTreeClassifier:
    """Decision tree classifier"""
    def __init__(self, max_depth=None, min_samples_split=2,
                 max_features=None, random_state=None):
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.max_features = max_features
        self.random_state = random_state
        self.root = None

    def _gini(self, y):
        """Calculate Gini impurity"""
        counter = Counter(y)
        n = len(y)
        return 1 - sum((count/n)**2 for count in counter.values())

    def _best_split(self, X, y, feature_indices):
        """Find best split point"""
        best_gain = -1
        best_feature_idx = None
        best_threshold = None

        n_samples = len(y)
        parent_gini = self._gini(y)

        for feature_idx in feature_indices:
            thresholds = np.unique(X[:, feature_idx])

            for threshold in thresholds:
                left_mask = X[:, feature_idx] <= threshold
                right_mask = ~left_mask

                if np.sum(left_mask) == 0 or np.sum(right_mask) == 0:
                    continue

                # Calculate information gain
                left_gini = self._gini(y[left_mask])
                right_gini = self._gini(y[right_mask])

                n_left = np.sum(left_mask)
                n_right = np.sum(right_mask)

                weighted_gini = (n_left * left_gini + n_right * right_gini) / n_samples
                gain = parent_gini - weighted_gini

                if gain > best_gain:
                    best_gain = gain
                    best_feature_idx = feature_idx
                    best_threshold = threshold

        return best_feature_idx, best_threshold

    def _build_tree(self, X, y, depth=0):
        """Recursively build decision tree"""
        n_samples, n_features = X.shape
        n_classes = len(np.unique(y))

        # Stopping conditions
        if (self.max_depth is not None and depth >= self.max_depth) or \
           n_samples < self.min_samples_split or n_classes == 1:
            # Return leaf node
            counter = Counter(y)
            most_common = counter.most_common(1)[0][0]
            return DecisionTreeNode(value=most_common)

        # Randomly select feature subset
        if self.max_features is None:
            feature_indices = range(n_features)
        else:
            feature_indices = np.random.choice(
                n_features, self.max_features, replace=False
            )

        # Find best split
        best_feature_idx, best_threshold = self._best_split(X, y, feature_indices)

        if best_feature_idx is None:
            counter = Counter(y)
            most_common = counter.most_common(1)[0][0]
            return DecisionTreeNode(value=most_common)

        # Split data
        left_mask = X[:, best_feature_idx] <= best_threshold
        right_mask = ~left_mask

        # Recursively build subtrees
        left_child = self._build_tree(X[left_mask], y[left_mask], depth + 1)
        right_child = self._build_tree(X[right_mask], y[right_mask], depth + 1)

        return DecisionTreeNode(
            feature_idx=best_feature_idx,
            threshold=best_threshold,
            left=left_child,
            right=right_child
        )

    def fit(self, X, y):
        """Train model"""
        if self.random_state is not None:
            np.random.seed(self.random_state)
        self.root = self._build_tree(X, y)
        return self

    def _predict_single(self, x, node):
        """Single sample prediction"""
        if node.value is not None:
            return node.value

        if x[node.feature_idx] <= node.threshold:
            return self._predict_single(x, node.left)
        else:
            return self._predict_single(x, node.right)

    def predict(self, X):
        """Batch prediction"""
        return np.array([self._predict_single(x, self.root) for x in X])


class RandomForestClassifier:
    """Random Forest classifier"""
    def __init__(self, n_estimators=100, max_depth=None,
                 min_samples_split=2, max_features='sqrt',
                 bootstrap=True, oob_score=False, random_state=None):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.max_features = max_features
        self.bootstrap = bootstrap
        self.oob_score = oob_score
        self.random_state = random_state
        self.trees = []
        self.oob_score_ = None

    def _get_max_features(self, n_features):
        """Get number of features to consider at each node"""
        if self.max_features == 'sqrt':
            return int(np.sqrt(n_features))
        elif self.max_features == 'log2':
            return int(np.log2(n_features))
        elif isinstance(self.max_features, int):
            return self.max_features
        elif isinstance(self.max_features, float):
            return int(self.max_features * n_features)
        else:
            return n_features

    def fit(self, X, y):
        """Train Random Forest"""
        if self.random_state is not None:
            np.random.seed(self.random_state)

        n_samples, n_features = X.shape
        max_features = self._get_max_features(n_features)

        self.trees = []
        oob_predictions = np.zeros((n_samples, len(np.unique(y))))
        oob_counts = np.zeros(n_samples)

        for i in range(self.n_estimators):
            # Bootstrap sampling
            if self.bootstrap:
                indices = np.random.choice(n_samples, n_samples, replace=True)
                X_sample = X[indices]
                y_sample = y[indices]
                oob_indices = np.setdiff1d(np.arange(n_samples), np.unique(indices))
            else:
                X_sample = X
                y_sample = y
                oob_indices = np.array([])

            # Train decision tree
            tree = DecisionTreeClassifier(
                max_depth=self.max_depth,
                min_samples_split=self.min_samples_split,
                max_features=max_features,
                random_state=self.random_state + i if self.random_state else None
            )
            tree.fit(X_sample, y_sample)
            self.trees.append(tree)

            # Calculate OOB predictions
            if self.oob_score and len(oob_indices) > 0:
                oob_pred = tree.predict(X[oob_indices])
                for idx, pred in zip(oob_indices, oob_pred):
                    oob_predictions[idx, int(pred)] += 1
                    oob_counts[idx] += 1

        # Calculate OOB score
        if self.oob_score:
            valid_samples = oob_counts > 0
            oob_final_pred = np.argmax(oob_predictions[valid_samples], axis=1)
            self.oob_score_ = np.mean(oob_final_pred == y[valid_samples])

        return self

    def predict(self, X):
        """Predict"""
        predictions = np.array([tree.predict(X) for tree in self.trees])
        # Majority voting
        return np.array([Counter(predictions[:, i]).most_common(1)[0][0]
                        for i in range(X.shape[0])])

    def predict_proba(self, X):
        """Predict probabilities"""
        predictions = np.array([tree.predict(X) for tree in self.trees])
        n_samples = X.shape[0]
        n_classes = len(np.unique(predictions))

        proba = np.zeros((n_samples, n_classes))
        for i in range(n_samples):
            counter = Counter(predictions[:, i])
            for cls, count in counter.items():
                proba[i, int(cls)] = count / self.n_estimators

        return proba


# Test custom implementation
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# Load data
iris = load_iris()
X, y = iris.data, iris.target
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
rf = RandomForestClassifier(n_estimators=100, max_depth=5, oob_score=True, random_state=42)
rf.fit(X_train, y_train)

# Evaluate
y_pred = rf.predict(X_test)
print(f"Test set accuracy: {accuracy_score(y_test, y_pred):.4f}")
print(f"OOB score: {rf.oob_score_:.4f}")
```

---

## Random Feature Selection

### Choosing Feature Subset Size

Random feature selection is the key innovation that distinguishes Random Forest from regular Bagging. At each node split, $k$ features are randomly selected from all $p$ features to form a candidate set, then the optimal splitting feature is selected from these $k$ features.

**Recommended $k$ value choices:**

| Task Type | Recommended Value | Notes |
|-----------|-------------------|-------|
| Classification | $k = \sqrt{p}$ | Classic recommendation |
| Regression | $k = p/3$ | Usually needs more features |
| High-dimensional data | $k = \log_2(p)$ | Reduces computation |

### Role of Feature Randomness

**Reducing correlation between trees:**

Without restricting feature selection, when a few strong features exist, all trees will prioritize these features for splitting, causing high similarity (correlation) between trees. Random feature selection forces trees to use different features, increasing diversity.

**Improving generalization:**

By letting different trees focus on different feature subspaces, Random Forest can better explore the feature space and discover useful information hidden by strong features.

```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import make_classification
import numpy as np
import matplotlib.pyplot as plt

# Generate data with strong features
X, y = make_classification(
    n_samples=1000,
    n_features=20,
    n_informative=5,  # 5 informative features
    n_redundant=2,    # 2 redundant features
    n_repeated=0,
    random_state=42
)

# Compare different max_features values
max_features_values = [1, 2, 4, 'sqrt', 'log2', None]
results = []

for max_feat in max_features_values:
    rf = RandomForestClassifier(
        n_estimators=100,
        max_features=max_feat,
        random_state=42
    )
    rf.fit(X, y)

    # Calculate correlation between trees
    predictions = np.array([tree.predict(X) for tree in rf.estimators_])
    correlations = []
    for i in range(len(rf.estimators_)):
        for j in range(i+1, len(rf.estimators_)):
            corr = np.corrcoef(predictions[i], predictions[j])[0, 1]
            correlations.append(corr)

    avg_correlation = np.mean(correlations)
    oob_score = rf.oob_score_ if hasattr(rf, 'oob_score_') else None

    results.append({
        'max_features': max_feat,
        'avg_tree_correlation': avg_correlation,
    })

    print(f"max_features={max_feat}: Average tree correlation={avg_correlation:.4f}")
```

### Extremely Randomized Trees (Extra Trees)

Extremely Randomized Trees is a variant of Random Forest that further randomizes the split point selection on top of random feature selection:

- **Random Forest**: Selects optimal split point from randomly selected feature subset
- **Extra Trees**: Randomly selects split point from randomly selected feature subset

```python
from sklearn.ensemble import ExtraTreesClassifier

# Extra Trees
et = ExtraTreesClassifier(
    n_estimators=100,
    max_features='sqrt',
    random_state=42
)

# Random Forest
rf = RandomForestClassifier(
    n_estimators=100,
    max_features='sqrt',
    random_state=42
)

# Compare training time and performance
import time

start = time.time()
et.fit(X, y)
et_time = time.time() - start

start = time.time()
rf.fit(X, y)
rf_time = time.time() - start

print(f"Extra Trees - Training time: {et_time:.4f}s")
print(f"Random Forest - Training time: {rf_time:.4f}s")
```

**Extra Trees characteristics:**

- Faster training (no need to search for optimal split points)
- Lower variance (stronger randomness)
- May have slightly higher bias
- Suitable for large-scale datasets

---

## OOB Evaluation

### Concept of OOB (Out-of-Bag) Samples

In Random Forest, each tree uses only about 63.2% of training samples for training, with the remaining approximately 36.8% of samples not used by that tree, called Out-of-Bag (OOB) samples for that tree.

OOB samples provide a way to evaluate model performance without cross-validation, which is particularly useful when training data is limited or computational resources are constrained.

### Principle of OOB Evaluation

```
Sample x1: Not used by trees 1,3,5,7 -> Use trees 1,3,5,7 to predict x1 -> Vote to get OOB prediction
Sample x2: Not used by trees 2,4,6,8 -> Use trees 2,4,6,8 to predict x2 -> Vote to get OOB prediction
...
Final OOB score = Accuracy of all samples' OOB predictions
```

**Advantages of OOB Evaluation:**

1. **No additional dataset needed**: Fully utilizes training data
2. **Close to cross-validation**: OOB score is close to leave-one-out cross-validation results
3. **Computationally efficient**: No need to retrain models
4. **Real-time monitoring**: Can be calculated during training

```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score
from sklearn.datasets import load_breast_cancer
import numpy as np

# Load data
data = load_breast_cancer()
X, y = data.data, data.target

# Using OOB evaluation
rf_oob = RandomForestClassifier(
    n_estimators=100,
    oob_score=True,  # Enable OOB evaluation
    random_state=42
)
rf_oob.fit(X, y)

# Using cross-validation evaluation
rf_cv = RandomForestClassifier(n_estimators=100, random_state=42)
cv_scores = cross_val_score(rf_cv, X, y, cv=5)

print(f"OOB score: {rf_oob.oob_score_:.4f}")
print(f"5-fold cross-validation score: {cv_scores.mean():.4f} (+/- {cv_scores.std()*2:.4f})")

# OOB prediction probabilities
print(f"\nOOB prediction probability matrix shape: {rf_oob.oob_decision_function_.shape}")
```

### OOB Error Curve

The OOB error curve can help determine the optimal number of trees:

```python
import numpy as np
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_digits

# Load data
digits = load_digits()
X, y = digits.data, digits.target

# Calculate OOB error for different numbers of trees
n_estimators_range = range(10, 301, 10)
oob_errors = []

for n_estimators in n_estimators_range:
    rf = RandomForestClassifier(
        n_estimators=n_estimators,
        oob_score=True,
        random_state=42,
        warm_start=True,  # Incremental training
        n_jobs=-1
    )
    rf.fit(X, y)
    oob_error = 1 - rf.oob_score_
    oob_errors.append(oob_error)

# Plot OOB error curve
plt.figure(figsize=(10, 6))
plt.plot(n_estimators_range, oob_errors, 'b-', linewidth=2)
plt.xlabel('Number of Decision Trees')
plt.ylabel('OOB Error Rate')
plt.title('OOB Error vs Number of Trees')
plt.grid(True)

# Find optimal point
best_n = n_estimators_range[np.argmin(oob_errors)]
best_error = min(oob_errors)
plt.axvline(x=best_n, color='r', linestyle='--', label=f'Optimal: n={best_n}')
plt.legend()
plt.show()

print(f"Optimal number of trees: {best_n}, OOB error: {best_error:.4f}")
```

---

## Feature Importance

### Methods for Calculating Feature Importance

Random Forest provides multiple methods for calculating feature importance, which is one of its important advantages.

**1. Impurity-based Feature Importance (MDI - Mean Decrease Impurity):**

Calculates the weighted average of impurity decrease (Gini impurity or information gain) for each feature across all trees:

$$\text{Importance}(f) = \frac{1}{T}\sum_{t=1}^{T}\sum_{n \in N_f^{(t)}} p(n) \cdot \Delta I(n)$$

Where:
- $T$ is the number of trees
- $N_f^{(t)}$ is the set of nodes in tree $t$ that use feature $f$ for splitting
- $p(n)$ is the proportion of samples reaching node $n$
- $\Delta I(n)$ is the impurity decrease from splitting at node $n$

**2. Permutation-based Feature Importance (MDA - Mean Decrease Accuracy):**

Measures feature importance by randomly shuffling feature values and observing the decrease in model performance:

```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.inspection import permutation_importance
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
import numpy as np
import matplotlib.pyplot as plt

# Load data
data = load_breast_cancer()
X, y = data.data, data.target
feature_names = data.feature_names

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
rf = RandomForestClassifier(n_estimators=100, random_state=42)
rf.fit(X_train, y_train)

# Method 1: Impurity-based feature importance
mdi_importance = rf.feature_importances_

# Method 2: Permutation-based feature importance
perm_importance = permutation_importance(
    rf, X_test, y_test,
    n_repeats=10,
    random_state=42
)

# Visualization comparison
fig, axes = plt.subplots(1, 2, figsize=(16, 8))

# MDI importance
sorted_idx_mdi = np.argsort(mdi_importance)
axes[0].barh(range(len(sorted_idx_mdi)), mdi_importance[sorted_idx_mdi])
axes[0].set_yticks(range(len(sorted_idx_mdi)))
axes[0].set_yticklabels(feature_names[sorted_idx_mdi])
axes[0].set_xlabel('Impurity Decrease')
axes[0].set_title('Impurity-based Feature Importance (MDI)')

# Permutation importance
sorted_idx_perm = np.argsort(perm_importance.importances_mean)
axes[1].barh(range(len(sorted_idx_perm)),
             perm_importance.importances_mean[sorted_idx_perm])
axes[1].set_yticks(range(len(sorted_idx_perm)))
axes[1].set_yticklabels(feature_names[sorted_idx_perm])
axes[1].set_xlabel('Accuracy Decrease')
axes[1].set_title('Permutation-based Feature Importance (MDA)')

plt.tight_layout()
plt.show()
```

### Differences Between MDI and MDA

| Comparison Dimension | MDI (Impurity) | MDA (Permutation) |
|---------------------|----------------|-------------------|
| Calculation method | Automatically calculated during training | Requires additional calculation |
| Calculation speed | Fast | Slow |
| For high-cardinality features | May be biased high | Unbiased |
| For correlated features | May underestimate | More accurate |
| Use case | Quick screening | Precise evaluation |

---

## Hyperparameter Tuning

### Key Hyperparameters

| Parameter | Description | Recommended Value | Effect |
|-----------|-------------|-------------------|--------|
| `n_estimators` | Number of trees | 100-500 | More trees usually better, but increases computation |
| `max_depth` | Maximum tree depth | None or 10-30 | Limiting prevents overfitting |
| `min_samples_split` | Minimum samples for node split | 2-10 | Increasing prevents overfitting |
| `min_samples_leaf` | Minimum samples at leaf node | 1-5 | Increasing prevents overfitting |
| `max_features` | Number of features considered per split | 'sqrt' or 'log2' | Reducing increases diversity |
| `max_leaf_nodes` | Maximum leaf nodes | None or limited value | Limits tree complexity |
| `bootstrap` | Whether to use Bootstrap sampling | True | False becomes Bagging |
| `class_weight` | Class weights | 'balanced' or None | Handle imbalanced data |

### Grid Search Tuning

```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV
from sklearn.datasets import load_breast_cancer
import numpy as np

# Load data
data = load_breast_cancer()
X, y = data.data, data.target

# Define parameter grid
param_grid = {
    'n_estimators': [50, 100, 200],
    'max_depth': [None, 10, 20, 30],
    'min_samples_split': [2, 5, 10],
    'min_samples_leaf': [1, 2, 4],
    'max_features': ['sqrt', 'log2', None]
}

# Grid search
rf = RandomForestClassifier(random_state=42)
grid_search = GridSearchCV(
    rf,
    param_grid,
    cv=5,
    scoring='accuracy',
    n_jobs=-1,
    verbose=1
)
grid_search.fit(X, y)

print("Best parameters:")
print(grid_search.best_params_)
print(f"Best cross-validation score: {grid_search.best_score_:.4f}")
```

### Randomized Search Tuning

For large parameter spaces, random search is more efficient than grid search:

```python
from scipy.stats import randint, uniform

# Define parameter distributions
param_dist = {
    'n_estimators': randint(50, 500),
    'max_depth': randint(5, 50),
    'min_samples_split': randint(2, 20),
    'min_samples_leaf': randint(1, 10),
    'max_features': ['sqrt', 'log2', None, 0.3, 0.5, 0.7]
}

# Random search
rf = RandomForestClassifier(random_state=42)
random_search = RandomizedSearchCV(
    rf,
    param_dist,
    n_iter=100,  # Sample 100 parameter combinations
    cv=5,
    scoring='accuracy',
    n_jobs=-1,
    random_state=42,
    verbose=1
)
random_search.fit(X, y)

print("Best parameters:")
print(random_search.best_params_)
print(f"Best cross-validation score: {random_search.best_score_:.4f}")
```

---

## Parallel Training

### Parallel Characteristics of Random Forest

Random Forest naturally supports parallel training because each tree's construction is independent. This is an important advantage of Random Forest over Boosting methods.

**Levels of parallelization:**

1. **Tree-level parallelism**: Train multiple decision trees simultaneously
2. **Feature-level parallelism**: Calculate features in parallel when searching for best split point
3. **Sample-level parallelism**: Parallelize Bootstrap sampling and prediction

### Parallel Settings in Scikit-learn

```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import make_classification
import time
import numpy as np

# Generate large-scale data
X, y = make_classification(n_samples=50000, n_features=100, random_state=42)

def benchmark_parallel(n_jobs_list, n_estimators=100):
    """Benchmark training time with different parallelism levels"""
    results = []

    for n_jobs in n_jobs_list:
        rf = RandomForestClassifier(
            n_estimators=n_estimators,
            n_jobs=n_jobs,
            random_state=42
        )

        start = time.time()
        rf.fit(X, y)
        elapsed = time.time() - start

        results.append({
            'n_jobs': n_jobs,
            'time': elapsed
        })
        print(f"n_jobs={n_jobs}: {elapsed:.2f} seconds")

    return results

# Test different parallelism levels
n_jobs_list = [1, 2, 4, -1]  # -1 means use all CPU cores
results = benchmark_parallel(n_jobs_list)
```

---

## Scikit-learn Practice

### Complete Classification Task Workflow

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import (classification_report, confusion_matrix,
                           roc_curve, auc, precision_recall_curve)
from sklearn.datasets import load_breast_cancer
import seaborn as sns

# Data loading and exploration
data = load_breast_cancer()
X = pd.DataFrame(data.data, columns=data.feature_names)
y = pd.Series(data.target, name='target')

print("Dataset shape:", X.shape)
print("\nFeature statistics:")
print(X.describe())
print("\nClass distribution:")
print(y.value_counts())

# Data preprocessing
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Model training
rf = RandomForestClassifier(
    n_estimators=200,
    max_depth=None,
    min_samples_split=2,
    min_samples_leaf=1,
    max_features='sqrt',
    bootstrap=True,
    oob_score=True,
    random_state=42,
    n_jobs=-1
)

rf.fit(X_train, y_train)

# Model evaluation
print("\n=== Model Evaluation ===")
print(f"Training set accuracy: {rf.score(X_train, y_train):.4f}")
print(f"Test set accuracy: {rf.score(X_test, y_test):.4f}")
print(f"OOB score: {rf.oob_score_:.4f}")

# Cross-validation
cv_scores = cross_val_score(rf, X, y, cv=5, scoring='accuracy')
print(f"5-fold cross-validation: {cv_scores.mean():.4f} (+/- {cv_scores.std()*2:.4f})")

# Detailed classification report
y_pred = rf.predict(X_test)
y_prob = rf.predict_proba(X_test)[:, 1]

print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=data.target_names))
```

### Model Saving and Loading

```python
import joblib
from sklearn.ensemble import RandomForestClassifier

# Train model
rf = RandomForestClassifier(n_estimators=100, random_state=42)
rf.fit(X_train, y_train)

# Save and load using joblib (recommended, supports large numpy arrays)
joblib.dump(rf, 'random_forest_model.joblib')
rf_loaded = joblib.load('random_forest_model.joblib')

# Verify loaded model
print("Original model prediction:", rf.predict(X_test[:5]))
print("Loaded model prediction:", rf_loaded.predict(X_test[:5]))
```

---

## Interview Key Points

### Basic Concept Questions

**Q1: What is Random Forest? How does it differ from regular Bagging?**

Random Forest is an ensemble learning algorithm based on Bagging that uses decision trees as base learners. The main difference from regular Bagging is the introduction of random feature selection: at each node split, the optimal splitting feature is selected only from a randomly chosen feature subset, not from all features. This "dual randomness" (sample randomness + feature randomness) makes trees less correlated, resulting in better ensemble performance.

**Q2: Explain how Bagging reduces variance?**

Bagging performs Bootstrap sampling on training data to get multiple different training subsets, training base learners separately. Assuming base learners are independent with variance $\sigma^2$, the variance after averaging n base learners is $\sigma^2/n$. In practice, there is correlation $\rho$ between base learners, with variance being $\rho\sigma^2 + (1-\rho)\sigma^2/n$. Even with correlation, as long as $\rho<1$, the ensemble variance is still smaller than a single model.

**Q3: Why does Random Forest need random feature selection?**

Without restricting feature selection, when a few strong features exist, all trees will prioritize these features for the first split, causing high similarity (high correlation) between trees. Random feature selection forces different trees to use different feature subsets, reducing correlation between trees and improving ensemble performance. It also enables the model to discover useful information hidden by strong features.

**Q4: What is OOB evaluation? Why can it substitute for a validation set?**

OOB (Out-of-Bag samples) are the approximately 36.8% of samples not selected during Bootstrap sampling. Each tree can only predict its OOB samples (since these samples didn't participate in that tree's training). Aggregating all trees' OOB predictions for each sample gives an overall OOB score. This evaluation method doesn't require an additional validation set, and theoretical proof shows its effectiveness is close to leave-one-out cross-validation.

### Practical Questions

**Q8: What are the pros and cons of Random Forest compared to XGBoost/LightGBM?**

| Comparison Item | Random Forest | XGBoost/LightGBM |
|-----------------|---------------|------------------|
| Training speed | Fast (parallel) | Relatively slow (sequential) |
| Prediction accuracy | Good | Usually better |
| Tuning difficulty | Simple | Complex |
| Overfitting | Not prone | Needs attention |
| Interpretability | Good | Relatively poor |

Recommendation: First use Random Forest to quickly establish a baseline, then try Boosting methods if accuracy needs improvement.

---

## Further Reading

### Classic Papers

1. **Original Random Forest Paper**: Breiman, L. (2001). "Random Forests". Machine Learning, 45(1), 5-32.
2. **Bagging Paper**: Breiman, L. (1996). "Bagging Predictors". Machine Learning, 24(2), 123-140.
3. **Extremely Randomized Trees**: Geurts, P., Ernst, D., & Wehenkel, L. (2006). "Extremely Randomized Trees". Machine Learning, 63(1), 3-42.

### Recommended Books

1. **"Statistical Learning Methods" (Li Hang)**: Chapter 5 covers decision trees and ensemble learning in detail
2. **"Machine Learning" (Zhou Zhihua)**: Chapter 8 on ensemble learning, theoretically in-depth
3. **"Hands-On Machine Learning with Scikit-Learn"**: Chapter 7, practice-oriented
4. **"The Elements of Statistical Learning"**: Chapter 15, mathematically rigorous

### Online Resources

- **scikit-learn Official Documentation**: [RandomForest](https://scikit-learn.org/stable/modules/ensemble.html#random-forests)
- **Kaggle Competitions**: Many excellent Notebooks using Random Forest
- **Machine Learning Courses**: Andrew Ng's Machine Learning course

---

## Summary

Random Forest is one of the most successful algorithms in machine learning, with the following core advantages:

1. **Out-of-the-box**: Default parameters usually achieve good results
2. **Anti-overfitting**: Bagging mechanism and random feature selection effectively reduce overfitting risk
3. **Parallelizable**: Fast training speed, easy for large-scale applications
4. **Interpretable**: Provides feature importance for model understanding
5. **Robust**: Insensitive to noise and outliers, can handle mixed feature types

**Best Practice Recommendations:**

1. Start with Random Forest to establish a baseline model
2. Use OOB score for quick evaluation
3. Perform feature selection through feature importance
4. Set a reasonable number of trees (usually 100-500 is sufficient)
5. Use class_weight parameter for imbalanced data
6. Leverage parallelization to speed up training (n_jobs=-1)

While Random Forest as a classic ensemble learning method has been surpassed by Boosting methods in some scenarios, its simplicity, efficiency, and stability make it still hold an important position in practical applications. Mastering the principles and practices of Random Forest is an essential skill for machine learning practitioners.
