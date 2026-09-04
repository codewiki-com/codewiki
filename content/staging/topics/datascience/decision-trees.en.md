---
title: 经典机器学习：决策树
description: 深入理解决策树算法：ID3、C4.5、CART和剪枝策略
track: datascience
section: classical-ml
difficulty: intermediate
tags:
  - 决策树
  - CART
  - 分类
  - 机器学习
status: imported
origin: old/src/content/docs/datascience/decision-trees.en.md
divergence: 0.19
issues:
  - title-lang-en
  - title-language
legacy:
  category: DataScience
  subcategory: ClassicalML
  order: 12
  lastUpdated: 2026-01-07
---

Decision Trees are among the most intuitive and easily understandable algorithms in machine learning. They make decisions through a tree structure, where each internal node represents a test on a feature attribute, each branch represents the test outcome, and each leaf node represents a class label or numerical value. We'll delve into the core principles, classic algorithms, pruning strategies, and practical applications of decision trees.

---

## Decision Tree Principles

### What is a Decision Tree

A decision tree is a tree-structure-based supervised learning algorithm that can be used for both classification and regression tasks. Its core idea is to build a tree for prediction by recursively partitioning the feature space.

**Components of a Decision Tree:**

- **Root Node**: The starting node of the tree, containing all training samples
- **Internal Node**: Represents a test condition on a certain feature
- **Branch**: Represents the test result, connecting parent and child nodes
- **Leaf Node**: Represents the final decision result (class label or numerical value)

### The Learning Process of Decision Trees

Decision tree learning is essentially inducing a set of classification rules from training data. The learning process typically includes three steps:

1. **Feature Selection**: Selecting the optimal feature for splitting
2. **Tree Generation**: Recursively building subtrees
3. **Tree Pruning**: Preventing overfitting and improving generalization ability

```
Decision Tree Learning Algorithm (Pseudocode):
Input: Training dataset D, Feature set A
Output: Decision tree T

function BuildTree(D, A):
    if all samples in D belong to the same class C:
        return leaf node (class=C)

    if A is empty or samples in D have the same values on A:
        return leaf node (class=majority class in D)

    Select optimal feature a* from A

    for each value v of a*:
        Dv = subset of samples in D with value v on a*
        if Dv is empty:
            create leaf node (class=majority class in D)
        else:
            use BuildTree(Dv, A-{a*}) as child node

    return internal node with a* as splitting feature
```

### Advantages and Disadvantages of Decision Trees

**Advantages:**
- Intuitive and easy to understand, highly interpretable models
- No need for feature standardization or normalization
- Can handle both numerical and categorical features
- Capable of capturing non-linear relationships between features
- Relatively low computational cost

**Disadvantages:**
- Prone to overfitting, especially when the tree is very deep
- Sensitive to data changes; small changes may result in completely different trees
- May produce bias toward features with more values
- Difficult to handle correlations between features

---

## Feature Selection Criteria

Feature selection is the core problem in decision tree learning. Good feature selection criteria enable the decision tree to converge more quickly to pure leaf nodes. Common criteria include information gain, gain ratio, and Gini index.

### Information Entropy

Information entropy is a metric for measuring the purity of a sample set. Given a sample set $D$ where the proportion of samples belonging to class $k$ is $p_k$, the information entropy is defined as:

$$H(D) = -\sum_{k=1}^{K} p_k \log_2 p_k$$

**Characteristics:**
- Higher entropy means greater uncertainty in the sample set
- When all samples belong to the same class, entropy is 0
- When samples are uniformly distributed across classes, entropy is maximum

```python
import numpy as np

def entropy(y):
    """Calculate information entropy"""
    _, counts = np.unique(y, return_counts=True)
    probabilities = counts / len(y)
    return -np.sum(probabilities * np.log2(probabilities + 1e-10))

# Example
y_pure = np.array([1, 1, 1, 1, 1])
y_mixed = np.array([1, 1, 0, 0, 1])
y_uniform = np.array([0, 0, 1, 1, 2, 2])

print(f"Pure sample entropy: {entropy(y_pure):.4f}")      # 0.0
print(f"Mixed sample entropy: {entropy(y_mixed):.4f}")     # 0.9710
print(f"Uniform distribution entropy: {entropy(y_uniform):.4f}")   # 1.5850
```

### Information Gain

Information gain represents the reduction in uncertainty of a sample set after knowing the information of feature $A$. Given feature $A$ has $V$ possible values $\{a^1, a^2, ..., a^V\}$, the information gain is defined as:

$$Gain(D, A) = H(D) - \sum_{v=1}^{V} \frac{|D^v|}{|D|} H(D^v)$$

Where $D^v$ represents the subset of $D$ with value $a^v$ on feature $A$.

**The ID3 algorithm uses information gain as the feature selection criterion.**

```python
def information_gain(X, y, feature_idx):
    """Calculate information gain"""
    # Calculate parent node entropy
    parent_entropy = entropy(y)

    # Get all values of the feature
    values = np.unique(X[:, feature_idx])

    # Calculate weighted child node entropy
    weighted_child_entropy = 0
    for value in values:
        mask = X[:, feature_idx] == value
        child_y = y[mask]
        weight = len(child_y) / len(y)
        weighted_child_entropy += weight * entropy(child_y)

    return parent_entropy - weighted_child_entropy

# Example: Weather dataset
X = np.array([
    ['Sunny', 'Hot', 'High', 'Weak'],
    ['Sunny', 'Hot', 'High', 'Strong'],
    ['Overcast', 'Hot', 'High', 'Weak'],
    ['Rain', 'Mild', 'High', 'Weak'],
    ['Rain', 'Cool', 'Normal', 'Weak'],
    ['Rain', 'Cool', 'Normal', 'Strong'],
    ['Overcast', 'Cool', 'Normal', 'Strong'],
    ['Sunny', 'Mild', 'High', 'Weak'],
    ['Sunny', 'Cool', 'Normal', 'Weak'],
    ['Rain', 'Mild', 'Normal', 'Weak'],
    ['Sunny', 'Mild', 'Normal', 'Strong'],
    ['Overcast', 'Mild', 'High', 'Strong'],
    ['Overcast', 'Hot', 'Normal', 'Weak'],
    ['Rain', 'Mild', 'High', 'Strong'],
])
y = np.array([0, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0])  # 0=Don't play, 1=Play

feature_names = ['Weather', 'Temperature', 'Humidity', 'Wind']
for i, name in enumerate(feature_names):
    gain = information_gain(X, y, i)
    print(f"Information gain of feature '{name}': {gain:.4f}")
```

### Gain Ratio

Information gain tends to favor features with more values. To overcome this problem, the C4.5 algorithm uses gain ratio as the feature selection criterion:

$$GainRatio(D, A) = \frac{Gain(D, A)}{IV(A)}$$

Where $IV(A)$ is the Intrinsic Value of feature $A$:

$$IV(A) = -\sum_{v=1}^{V} \frac{|D^v|}{|D|} \log_2 \frac{|D^v|}{|D|}$$

```python
def intrinsic_value(X, feature_idx):
    """Calculate intrinsic value of a feature"""
    _, counts = np.unique(X[:, feature_idx], return_counts=True)
    probabilities = counts / len(X)
    return -np.sum(probabilities * np.log2(probabilities + 1e-10))

def gain_ratio(X, y, feature_idx):
    """Calculate gain ratio"""
    gain = information_gain(X, y, feature_idx)
    iv = intrinsic_value(X, feature_idx)

    # Avoid division by zero
    if iv == 0:
        return 0

    return gain / iv

# Calculate gain ratio for each feature
for i, name in enumerate(feature_names):
    gr = gain_ratio(X, y, i)
    iv = intrinsic_value(X, i)
    print(f"Feature '{name}': IV={iv:.4f}, Gain Ratio={gr:.4f}")
```

### Gini Index

The Gini index measures the probability that two randomly drawn samples from a dataset have inconsistent class labels. A smaller Gini index indicates higher purity of the dataset.

$$Gini(D) = 1 - \sum_{k=1}^{K} p_k^2$$

The Gini index based on feature $A$ is:

$$Gini\_index(D, A) = \sum_{v=1}^{V} \frac{|D^v|}{|D|} Gini(D^v)$$

**The CART algorithm uses the Gini index as the feature selection criterion.**

```python
def gini(y):
    """Calculate Gini index"""
    _, counts = np.unique(y, return_counts=True)
    probabilities = counts / len(y)
    return 1 - np.sum(probabilities ** 2)

def gini_index(X, y, feature_idx, threshold=None):
    """Calculate Gini index

    For discrete features, calculate weighted Gini index for all values
    For continuous features, use threshold for binary split
    """
    if threshold is None:
        # Discrete feature
        values = np.unique(X[:, feature_idx])
        gini_sum = 0
        for value in values:
            mask = X[:, feature_idx] == value
            weight = mask.sum() / len(y)
            gini_sum += weight * gini(y[mask])
        return gini_sum
    else:
        # Continuous feature, binary split
        left_mask = X[:, feature_idx] <= threshold
        right_mask = ~left_mask

        left_weight = left_mask.sum() / len(y)
        right_weight = right_mask.sum() / len(y)

        return left_weight * gini(y[left_mask]) + right_weight * gini(y[right_mask])

# Example
print(f"Sample Gini index: {gini(y):.4f}")
for i, name in enumerate(feature_names):
    gi = gini_index(X, y, i)
    print(f"Gini index of feature '{name}': {gi:.4f}")
```

### Comparison of Three Criteria

| Criterion | Algorithm | Characteristics | Computational Complexity |
|-----------|-----------|-----------------|-------------------------|
| Information Gain | ID3 | Favors multi-valued features | Lower |
| Gain Ratio | C4.5 | Overcomes multi-value preference | Medium |
| Gini Index | CART | Simple computation, binary tree | Lower |

---

## Classic Algorithms Explained

### ID3 Algorithm

ID3 (Iterative Dichotomiser 3) is one of the earliest decision tree algorithms, proposed by Ross Quinlan in 1986.

**Algorithm Characteristics:**
- Uses information gain as the feature selection criterion
- Can only handle discrete features
- Generates multi-way trees
- Prone to overfitting

```python
import numpy as np
from collections import Counter

class ID3DecisionTree:
    """ID3 Decision Tree Classifier"""

    def __init__(self, max_depth=None, min_samples_split=2):
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.tree = None
        self.feature_names = None

    def fit(self, X, y, feature_names=None):
        """Train decision tree"""
        self.feature_names = feature_names or [f"feature_{i}" for i in range(X.shape[1])]
        self.tree = self._build_tree(X, y, list(range(X.shape[1])), depth=0)
        return self

    def _entropy(self, y):
        """Calculate information entropy"""
        _, counts = np.unique(y, return_counts=True)
        probs = counts / len(y)
        return -np.sum(probs * np.log2(probs + 1e-10))

    def _information_gain(self, X, y, feature_idx):
        """Calculate information gain"""
        parent_entropy = self._entropy(y)

        values = np.unique(X[:, feature_idx])
        weighted_entropy = 0

        for value in values:
            mask = X[:, feature_idx] == value
            weight = mask.sum() / len(y)
            weighted_entropy += weight * self._entropy(y[mask])

        return parent_entropy - weighted_entropy

    def _best_feature(self, X, y, available_features):
        """Select best splitting feature"""
        best_gain = -1
        best_feature = None

        for feature_idx in available_features:
            gain = self._information_gain(X, y, feature_idx)
            if gain > best_gain:
                best_gain = gain
                best_feature = feature_idx

        return best_feature, best_gain

    def _build_tree(self, X, y, available_features, depth):
        """Recursively build decision tree"""
        # Stopping condition 1: All samples belong to the same class
        if len(np.unique(y)) == 1:
            return {'leaf': True, 'class': y[0]}

        # Stopping condition 2: No available features
        if len(available_features) == 0:
            return {'leaf': True, 'class': Counter(y).most_common(1)[0][0]}

        # Stopping condition 3: Maximum depth reached
        if self.max_depth is not None and depth >= self.max_depth:
            return {'leaf': True, 'class': Counter(y).most_common(1)[0][0]}

        # Stopping condition 4: Sample count below minimum split threshold
        if len(y) < self.min_samples_split:
            return {'leaf': True, 'class': Counter(y).most_common(1)[0][0]}

        # Select best feature
        best_feature, best_gain = self._best_feature(X, y, available_features)

        # If information gain is 0, return leaf node
        if best_gain == 0:
            return {'leaf': True, 'class': Counter(y).most_common(1)[0][0]}

        # Build internal node
        node = {
            'leaf': False,
            'feature': best_feature,
            'feature_name': self.feature_names[best_feature],
            'children': {}
        }

        # Recursively build subtrees
        remaining_features = [f for f in available_features if f != best_feature]

        for value in np.unique(X[:, best_feature]):
            mask = X[:, best_feature] == value
            child_X, child_y = X[mask], y[mask]

            if len(child_y) == 0:
                node['children'][value] = {
                    'leaf': True,
                    'class': Counter(y).most_common(1)[0][0]
                }
            else:
                node['children'][value] = self._build_tree(
                    child_X, child_y, remaining_features, depth + 1
                )

        return node

    def predict_one(self, x, node=None):
        """Predict single sample"""
        if node is None:
            node = self.tree

        if node['leaf']:
            return node['class']

        feature_value = x[node['feature']]

        if feature_value in node['children']:
            return self.predict_one(x, node['children'][feature_value])
        else:
            # Handle unseen feature values: return most common class
            return self._most_common_class(node)

    def _most_common_class(self, node):
        """Get most common class in subtree"""
        if node['leaf']:
            return node['class']

        classes = []
        for child in node['children'].values():
            classes.append(self._most_common_class(child))

        return Counter(classes).most_common(1)[0][0]

    def predict(self, X):
        """Predict multiple samples"""
        return np.array([self.predict_one(x) for x in X])

    def print_tree(self, node=None, indent=""):
        """Print decision tree structure"""
        if node is None:
            node = self.tree

        if node['leaf']:
            print(f"{indent}Leaf node: class={node['class']}")
        else:
            print(f"{indent}[{node['feature_name']}]")
            for value, child in node['children'].items():
                print(f"{indent}  |-- {value}:")
                self.print_tree(child, indent + "  |   ")

# Usage example
id3 = ID3DecisionTree(max_depth=5)
id3.fit(X, y, feature_names)
id3.print_tree()

# Prediction
predictions = id3.predict(X)
accuracy = (predictions == y).mean()
print(f"\nTraining accuracy: {accuracy:.4f}")
```

### C4.5 Algorithm

C4.5 is an improved version of ID3, also proposed by Ross Quinlan.

**Improvements over ID3:**
- Uses gain ratio instead of information gain to avoid bias toward multi-valued features
- Can handle continuous features (by finding optimal split points)
- Can handle missing values
- Introduces pruning mechanism

```python
class C45DecisionTree:
    """C4.5 Decision Tree Classifier"""

    def __init__(self, max_depth=None, min_samples_split=2, min_gain_ratio=0.01):
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.min_gain_ratio = min_gain_ratio
        self.tree = None

    def fit(self, X, y, feature_names=None, feature_types=None):
        """Train decision tree

        Parameters:
        -----------
        feature_types: list
            'discrete' or 'continuous', specifying each feature's type
        """
        self.feature_names = feature_names or [f"f{i}" for i in range(X.shape[1])]
        self.feature_types = feature_types or ['discrete'] * X.shape[1]
        self.tree = self._build_tree(X, y, list(range(X.shape[1])), depth=0)
        return self

    def _entropy(self, y):
        """Calculate information entropy"""
        if len(y) == 0:
            return 0
        _, counts = np.unique(y, return_counts=True)
        probs = counts / len(y)
        return -np.sum(probs * np.log2(probs + 1e-10))

    def _intrinsic_value(self, X, feature_idx, threshold=None):
        """Calculate intrinsic value"""
        if threshold is None:
            _, counts = np.unique(X[:, feature_idx], return_counts=True)
        else:
            left = (X[:, feature_idx] <= threshold).sum()
            right = len(X) - left
            counts = np.array([left, right])

        probs = counts / len(X)
        probs = probs[probs > 0]  # Avoid log(0)
        return -np.sum(probs * np.log2(probs))

    def _find_best_threshold(self, X, y, feature_idx):
        """Find best split point for continuous feature"""
        values = np.unique(X[:, feature_idx])

        if len(values) <= 1:
            return None, 0

        # Candidate split points: midpoints between adjacent values
        thresholds = (values[:-1] + values[1:]) / 2

        parent_entropy = self._entropy(y)
        best_gain = -1
        best_threshold = None

        for threshold in thresholds:
            left_mask = X[:, feature_idx] <= threshold
            right_mask = ~left_mask

            if left_mask.sum() == 0 or right_mask.sum() == 0:
                continue

            left_entropy = self._entropy(y[left_mask])
            right_entropy = self._entropy(y[right_mask])

            weighted_entropy = (
                left_mask.sum() / len(y) * left_entropy +
                right_mask.sum() / len(y) * right_entropy
            )

            gain = parent_entropy - weighted_entropy

            if gain > best_gain:
                best_gain = gain
                best_threshold = threshold

        return best_threshold, best_gain

    def _gain_ratio(self, X, y, feature_idx, threshold=None):
        """Calculate gain ratio"""
        parent_entropy = self._entropy(y)

        if threshold is None:
            # Discrete feature
            values = np.unique(X[:, feature_idx])
            weighted_entropy = 0

            for value in values:
                mask = X[:, feature_idx] == value
                weight = mask.sum() / len(y)
                weighted_entropy += weight * self._entropy(y[mask])
        else:
            # Continuous feature
            left_mask = X[:, feature_idx] <= threshold
            right_mask = ~left_mask

            weighted_entropy = (
                left_mask.sum() / len(y) * self._entropy(y[left_mask]) +
                right_mask.sum() / len(y) * self._entropy(y[right_mask])
            )

        gain = parent_entropy - weighted_entropy
        iv = self._intrinsic_value(X, feature_idx, threshold)

        if iv == 0:
            return 0, gain

        return gain / iv, gain

    def _best_feature(self, X, y, available_features):
        """Select best splitting feature"""
        best_ratio = -1
        best_feature = None
        best_threshold = None
        best_gain = 0

        # First calculate average information gain for all features
        gains = []
        for feature_idx in available_features:
            if self.feature_types[feature_idx] == 'continuous':
                threshold, gain = self._find_best_threshold(X, y, feature_idx)
            else:
                _, gain = self._gain_ratio(X, y, feature_idx)
            gains.append(gain)

        avg_gain = np.mean(gains) if gains else 0

        # Select feature with highest gain ratio among those with above-average information gain
        for i, feature_idx in enumerate(available_features):
            if self.feature_types[feature_idx] == 'continuous':
                threshold, gain = self._find_best_threshold(X, y, feature_idx)
                if threshold is None:
                    continue
                ratio, _ = self._gain_ratio(X, y, feature_idx, threshold)
            else:
                threshold = None
                ratio, gain = self._gain_ratio(X, y, feature_idx)

            # C4.5 heuristic: first filter features with above-average information gain
            if gain >= avg_gain and ratio > best_ratio:
                best_ratio = ratio
                best_feature = feature_idx
                best_threshold = threshold
                best_gain = gain

        return best_feature, best_threshold, best_ratio

    def _build_tree(self, X, y, available_features, depth):
        """Recursively build decision tree"""
        # Stopping conditions
        if len(np.unique(y)) == 1:
            return {'leaf': True, 'class': y[0], 'samples': len(y)}

        if len(available_features) == 0:
            return {'leaf': True, 'class': Counter(y).most_common(1)[0][0], 'samples': len(y)}

        if self.max_depth is not None and depth >= self.max_depth:
            return {'leaf': True, 'class': Counter(y).most_common(1)[0][0], 'samples': len(y)}

        if len(y) < self.min_samples_split:
            return {'leaf': True, 'class': Counter(y).most_common(1)[0][0], 'samples': len(y)}

        # Select best feature
        best_feature, best_threshold, best_ratio = self._best_feature(X, y, available_features)

        if best_feature is None or best_ratio < self.min_gain_ratio:
            return {'leaf': True, 'class': Counter(y).most_common(1)[0][0], 'samples': len(y)}

        # Build node
        node = {
            'leaf': False,
            'feature': best_feature,
            'feature_name': self.feature_names[best_feature],
            'threshold': best_threshold,
            'samples': len(y),
            'children': {}
        }

        if best_threshold is not None:
            # Continuous feature: binary split
            left_mask = X[:, best_feature] <= best_threshold
            right_mask = ~left_mask

            # Continuous features can be reused
            node['children']['<='] = self._build_tree(
                X[left_mask], y[left_mask], available_features, depth + 1
            )
            node['children']['>'] = self._build_tree(
                X[right_mask], y[right_mask], available_features, depth + 1
            )
        else:
            # Discrete feature: multi-way split
            remaining_features = [f for f in available_features if f != best_feature]

            for value in np.unique(X[:, best_feature]):
                mask = X[:, best_feature] == value
                if mask.sum() > 0:
                    node['children'][value] = self._build_tree(
                        X[mask], y[mask], remaining_features, depth + 1
                    )

        return node

    def predict_one(self, x, node=None):
        """Predict single sample"""
        if node is None:
            node = self.tree

        if node['leaf']:
            return node['class']

        feature_value = x[node['feature']]

        if node['threshold'] is not None:
            # Continuous feature
            if feature_value <= node['threshold']:
                return self.predict_one(x, node['children']['<='])
            else:
                return self.predict_one(x, node['children']['>'])
        else:
            # Discrete feature
            if feature_value in node['children']:
                return self.predict_one(x, node['children'][feature_value])
            else:
                # Return most common class
                return self._get_majority_class(node)

    def _get_majority_class(self, node):
        """Get most common class under node"""
        if node['leaf']:
            return node['class']

        classes = []
        for child in node['children'].values():
            classes.append(self._get_majority_class(child))

        return Counter(classes).most_common(1)[0][0] if classes else 0

    def predict(self, X):
        """Predict multiple samples"""
        return np.array([self.predict_one(x) for x in X])
```

### CART Algorithm

CART (Classification and Regression Trees) is the most commonly used decision tree algorithm, proposed by Breiman et al. in 1984.

**CART Algorithm Characteristics:**
- Uses Gini index as the feature selection criterion
- Only generates binary trees
- Can be used for both classification and regression
- Uses cost-complexity pruning

```python
class CARTClassifier:
    """CART Classification Tree"""

    def __init__(self, max_depth=None, min_samples_split=2,
                 min_samples_leaf=1, min_impurity_decrease=0.0):
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.min_samples_leaf = min_samples_leaf
        self.min_impurity_decrease = min_impurity_decrease
        self.tree = None

    def fit(self, X, y):
        """Train CART classification tree"""
        self.n_features = X.shape[1]
        self.n_classes = len(np.unique(y))
        self.tree = self._build_tree(X, y, depth=0)
        return self

    def _gini(self, y):
        """Calculate Gini index"""
        if len(y) == 0:
            return 0
        _, counts = np.unique(y, return_counts=True)
        probs = counts / len(y)
        return 1 - np.sum(probs ** 2)

    def _gini_split(self, y_left, y_right):
        """Calculate weighted Gini index after split"""
        n = len(y_left) + len(y_right)
        if n == 0:
            return 0

        return (len(y_left) / n * self._gini(y_left) +
                len(y_right) / n * self._gini(y_right))

    def _find_best_split(self, X, y):
        """Find best split point"""
        best_gini = float('inf')
        best_feature = None
        best_threshold = None

        current_gini = self._gini(y)

        for feature_idx in range(X.shape[1]):
            # Get sorted unique values
            values = np.unique(X[:, feature_idx])

            if len(values) <= 1:
                continue

            # Candidate split points
            thresholds = (values[:-1] + values[1:]) / 2

            for threshold in thresholds:
                left_mask = X[:, feature_idx] <= threshold
                right_mask = ~left_mask

                # Check minimum leaf node sample count
                if left_mask.sum() < self.min_samples_leaf:
                    continue
                if right_mask.sum() < self.min_samples_leaf:
                    continue

                gini = self._gini_split(y[left_mask], y[right_mask])

                # Check minimum impurity decrease
                if current_gini - gini < self.min_impurity_decrease:
                    continue

                if gini < best_gini:
                    best_gini = gini
                    best_feature = feature_idx
                    best_threshold = threshold

        return best_feature, best_threshold, best_gini

    def _build_tree(self, X, y, depth):
        """Recursively build CART tree"""
        n_samples = len(y)
        n_classes = len(np.unique(y))

        # Calculate class distribution of current node
        class_counts = np.bincount(y, minlength=self.n_classes)
        predicted_class = np.argmax(class_counts)

        node = {
            'n_samples': n_samples,
            'class_distribution': class_counts,
            'predicted_class': predicted_class,
            'gini': self._gini(y)
        }

        # Check stopping conditions
        if (self.max_depth is not None and depth >= self.max_depth):
            node['leaf'] = True
            return node

        if n_classes == 1:
            node['leaf'] = True
            return node

        if n_samples < self.min_samples_split:
            node['leaf'] = True
            return node

        # Find best split
        best_feature, best_threshold, best_gini = self._find_best_split(X, y)

        if best_feature is None:
            node['leaf'] = True
            return node

        # Execute split
        left_mask = X[:, best_feature] <= best_threshold
        right_mask = ~left_mask

        node['leaf'] = False
        node['feature'] = best_feature
        node['threshold'] = best_threshold
        node['left'] = self._build_tree(X[left_mask], y[left_mask], depth + 1)
        node['right'] = self._build_tree(X[right_mask], y[right_mask], depth + 1)

        return node

    def predict_one(self, x, node=None):
        """Predict single sample"""
        if node is None:
            node = self.tree

        if node['leaf']:
            return node['predicted_class']

        if x[node['feature']] <= node['threshold']:
            return self.predict_one(x, node['left'])
        else:
            return self.predict_one(x, node['right'])

    def predict(self, X):
        """Predict multiple samples"""
        return np.array([self.predict_one(x) for x in X])

    def predict_proba(self, X):
        """Predict class probabilities"""
        probas = []
        for x in X:
            node = self.tree
            while not node['leaf']:
                if x[node['feature']] <= node['threshold']:
                    node = node['left']
                else:
                    node = node['right']

            proba = node['class_distribution'] / node['n_samples']
            probas.append(proba)

        return np.array(probas)

# Usage example
from sklearn.datasets import make_classification

X_train, y_train = make_classification(
    n_samples=500, n_features=10, n_informative=5,
    n_redundant=2, random_state=42
)

cart = CARTClassifier(max_depth=5, min_samples_split=10)
cart.fit(X_train, y_train)

predictions = cart.predict(X_train)
accuracy = (predictions == y_train).mean()
print(f"CART training accuracy: {accuracy:.4f}")
```

---

## Pruning Strategies

Pruning is a key technique for preventing decision tree overfitting. It can be divided into two strategies: pre-pruning and post-pruning.

### Pre-pruning

Pre-pruning stops splitting early during tree generation. Common pre-pruning conditions include:

1. **Maximum depth limit**: Stop splitting when tree reaches specified depth
2. **Minimum sample count**: Stop splitting when node sample count is below threshold
3. **Minimum impurity decrease**: Stop when impurity decrease from split is below threshold
4. **Maximum leaf nodes**: Limit total number of leaf nodes

```python
class PrePrunedDecisionTree:
    """Decision Tree with Pre-pruning"""

    def __init__(self,
                 max_depth=None,           # Maximum depth
                 min_samples_split=2,      # Minimum samples for internal node
                 min_samples_leaf=1,       # Minimum samples for leaf node
                 max_leaf_nodes=None,      # Maximum leaf nodes
                 min_impurity_decrease=0.0 # Minimum impurity decrease
                 ):
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.min_samples_leaf = min_samples_leaf
        self.max_leaf_nodes = max_leaf_nodes
        self.min_impurity_decrease = min_impurity_decrease

    def _should_stop(self, X, y, depth, n_leaves):
        """Check if splitting should stop"""
        # Condition 1: Maximum depth reached
        if self.max_depth is not None and depth >= self.max_depth:
            return True

        # Condition 2: Insufficient samples
        if len(y) < self.min_samples_split:
            return True

        # Condition 3: All samples belong to same class
        if len(np.unique(y)) == 1:
            return True

        # Condition 4: Maximum leaf nodes reached
        if self.max_leaf_nodes is not None and n_leaves >= self.max_leaf_nodes:
            return True

        return False

    def _is_valid_split(self, y_left, y_right, impurity_decrease):
        """Check if split is valid"""
        # Check minimum leaf node samples
        if len(y_left) < self.min_samples_leaf:
            return False
        if len(y_right) < self.min_samples_leaf:
            return False

        # Check minimum impurity decrease
        if impurity_decrease < self.min_impurity_decrease:
            return False

        return True
```

**Advantages and Disadvantages of Pre-pruning:**

| Advantages | Disadvantages |
|------------|---------------|
| Reduces overfitting risk | May cause underfitting |
| Reduces training time and space | Difficult to determine optimal parameters |
| Generates smaller trees | May miss optimal splits |

### Post-pruning

Post-pruning first generates a complete decision tree, then prunes certain subtrees from bottom to top, replacing them with leaf nodes.

#### Cost-Complexity Pruning

The post-pruning method used by the CART algorithm optimizes the following objective function:

$$C_\alpha(T) = C(T) + \alpha|T|$$

Where:
- $C(T)$ is the training error of tree $T$
- $|T|$ is the number of leaf nodes
- $\alpha$ is the complexity parameter

```python
class PostPrunedDecisionTree:
    """Decision Tree with Post-pruning"""

    def __init__(self, max_depth=None):
        self.max_depth = max_depth
        self.tree = None

    def fit(self, X, y):
        """Train decision tree"""
        # First generate complete tree
        self.tree = self._build_full_tree(X, y, depth=0)
        return self

    def prune(self, X_val, y_val):
        """Post-prune using validation set

        Uses Reduced Error Pruning
        """
        # Get all internal nodes (bottom-up)
        internal_nodes = self._get_internal_nodes_bottom_up(self.tree)

        for node in internal_nodes:
            # Record accuracy before pruning
            accuracy_before = self._accuracy(X_val, y_val)

            # Temporarily prune: convert internal node to leaf
            original_state = self._prune_node(node)

            # Calculate accuracy after pruning
            accuracy_after = self._accuracy(X_val, y_val)

            # If accuracy doesn't decrease, keep pruning
            if accuracy_after >= accuracy_before:
                pass  # Keep pruned state
            else:
                # Restore original state
                self._restore_node(node, original_state)

        return self

    def _prune_node(self, node):
        """Prune internal node to leaf"""
        original_state = {
            'leaf': node['leaf'],
            'left': node.get('left'),
            'right': node.get('right'),
            'feature': node.get('feature'),
            'threshold': node.get('threshold')
        }

        node['leaf'] = True
        node.pop('left', None)
        node.pop('right', None)
        node.pop('feature', None)
        node.pop('threshold', None)

        return original_state

    def _restore_node(self, node, original_state):
        """Restore node state"""
        node.update(original_state)

    def _get_internal_nodes_bottom_up(self, node, nodes=None):
        """Get all internal nodes bottom-up"""
        if nodes is None:
            nodes = []

        if not node['leaf']:
            # First recursively process child nodes
            self._get_internal_nodes_bottom_up(node['left'], nodes)
            self._get_internal_nodes_bottom_up(node['right'], nodes)
            # Then add current node
            nodes.append(node)

        return nodes

    def _accuracy(self, X, y):
        """Calculate accuracy"""
        predictions = self.predict(X)
        return (predictions == y).mean()

    def cost_complexity_pruning_path(self, X, y):
        """Calculate cost-complexity pruning path

        Returns subtrees for different alpha values
        """
        alphas = [0]
        impurities = [self._total_impurity(self.tree)]

        # Calculate effective alpha for each internal node
        while True:
            min_alpha = float('inf')
            best_node = None

            internal_nodes = self._get_internal_nodes_bottom_up(self.tree)

            if len(internal_nodes) == 0:
                break

            for node in internal_nodes:
                # Calculate effective alpha for this node
                # alpha = (R(t) - R(T_t)) / (|T_t| - 1)
                leaf_impurity = node['n_samples'] * node['gini']
                subtree_impurity = self._subtree_impurity(node)
                n_leaves = self._count_leaves(node)

                if n_leaves > 1:
                    alpha = (leaf_impurity - subtree_impurity) / (n_leaves - 1)

                    if alpha < min_alpha:
                        min_alpha = alpha
                        best_node = node

            if best_node is None:
                break

            # Prune
            self._prune_node(best_node)
            alphas.append(min_alpha)
            impurities.append(self._total_impurity(self.tree))

        return np.array(alphas), np.array(impurities)

    def _subtree_impurity(self, node):
        """Calculate total impurity of subtree"""
        if node['leaf']:
            return node['n_samples'] * node['gini']

        return (self._subtree_impurity(node['left']) +
                self._subtree_impurity(node['right']))

    def _count_leaves(self, node):
        """Count leaf nodes"""
        if node['leaf']:
            return 1
        return self._count_leaves(node['left']) + self._count_leaves(node['right'])

    def _total_impurity(self, node):
        """Calculate total impurity of entire tree"""
        return self._subtree_impurity(node)
```

#### Cost-Complexity Pruning with Scikit-learn

```python
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import cross_val_score
import matplotlib.pyplot as plt

# Create complete decision tree
clf = DecisionTreeClassifier(random_state=42)
clf.fit(X_train, y_train)

# Get cost-complexity pruning path
path = clf.cost_complexity_pruning_path(X_train, y_train)
ccp_alphas = path.ccp_alphas
impurities = path.impurities

# Train a tree for each alpha value
clfs = []
for ccp_alpha in ccp_alphas:
    clf = DecisionTreeClassifier(ccp_alpha=ccp_alpha, random_state=42)
    clf.fit(X_train, y_train)
    clfs.append(clf)

# Calculate training and test accuracy
train_scores = [clf.score(X_train, y_train) for clf in clfs]
test_scores = [clf.score(X_test, y_test) for clf in clfs]

# Visualization
fig, ax = plt.subplots(figsize=(10, 6))
ax.plot(ccp_alphas, train_scores, marker='o', label='Training', drawstyle='steps-post')
ax.plot(ccp_alphas, test_scores, marker='o', label='Test', drawstyle='steps-post')
ax.set_xlabel('Alpha (ccp_alpha)')
ax.set_ylabel('Accuracy')
ax.set_title('Cost-Complexity Pruning: Accuracy vs Alpha')
ax.legend()
plt.tight_layout()
plt.show()

# Use cross-validation to select best alpha
alpha_scores = []
for ccp_alpha in ccp_alphas:
    clf = DecisionTreeClassifier(ccp_alpha=ccp_alpha, random_state=42)
    scores = cross_val_score(clf, X_train, y_train, cv=5, scoring='accuracy')
    alpha_scores.append(scores.mean())

best_alpha = ccp_alphas[np.argmax(alpha_scores)]
print(f"Best alpha: {best_alpha:.6f}")
print(f"Best cross-validation accuracy: {max(alpha_scores):.4f}")
```

---

## Regression Trees

Regression trees are used for predicting continuous target variables, using different splitting criteria and leaf node prediction methods.

### Regression Tree Principles

**Splitting Criterion**: Typically uses Mean Squared Error (MSE) or Mean Absolute Error (MAE)

$$MSE = \frac{1}{n} \sum_{i=1}^{n} (y_i - \bar{y})^2$$

**Leaf Node Prediction**: Uses the mean of all samples in the leaf node

```python
class CARTRegressor:
    """CART Regression Tree"""

    def __init__(self, max_depth=None, min_samples_split=2,
                 min_samples_leaf=1, min_impurity_decrease=0.0):
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.min_samples_leaf = min_samples_leaf
        self.min_impurity_decrease = min_impurity_decrease
        self.tree = None

    def fit(self, X, y):
        """Train regression tree"""
        self.tree = self._build_tree(X, y, depth=0)
        return self

    def _mse(self, y):
        """Calculate mean squared error"""
        if len(y) == 0:
            return 0
        return np.mean((y - np.mean(y)) ** 2)

    def _mse_reduction(self, y, y_left, y_right):
        """Calculate MSE reduction from split"""
        n = len(y)
        n_left, n_right = len(y_left), len(y_right)

        if n == 0:
            return 0

        mse_parent = self._mse(y)
        mse_children = (n_left / n * self._mse(y_left) +
                       n_right / n * self._mse(y_right))

        return mse_parent - mse_children

    def _find_best_split(self, X, y):
        """Find best split point"""
        best_reduction = -float('inf')
        best_feature = None
        best_threshold = None

        for feature_idx in range(X.shape[1]):
            values = np.unique(X[:, feature_idx])

            if len(values) <= 1:
                continue

            thresholds = (values[:-1] + values[1:]) / 2

            for threshold in thresholds:
                left_mask = X[:, feature_idx] <= threshold
                right_mask = ~left_mask

                if left_mask.sum() < self.min_samples_leaf:
                    continue
                if right_mask.sum() < self.min_samples_leaf:
                    continue

                reduction = self._mse_reduction(y, y[left_mask], y[right_mask])

                if reduction < self.min_impurity_decrease:
                    continue

                if reduction > best_reduction:
                    best_reduction = reduction
                    best_feature = feature_idx
                    best_threshold = threshold

        return best_feature, best_threshold, best_reduction

    def _build_tree(self, X, y, depth):
        """Recursively build regression tree"""
        n_samples = len(y)
        prediction = np.mean(y)
        mse = self._mse(y)

        node = {
            'n_samples': n_samples,
            'prediction': prediction,
            'mse': mse
        }

        # Check stopping conditions
        if self.max_depth is not None and depth >= self.max_depth:
            node['leaf'] = True
            return node

        if n_samples < self.min_samples_split:
            node['leaf'] = True
            return node

        # Find best split
        best_feature, best_threshold, _ = self._find_best_split(X, y)

        if best_feature is None:
            node['leaf'] = True
            return node

        # Execute split
        left_mask = X[:, best_feature] <= best_threshold
        right_mask = ~left_mask

        node['leaf'] = False
        node['feature'] = best_feature
        node['threshold'] = best_threshold
        node['left'] = self._build_tree(X[left_mask], y[left_mask], depth + 1)
        node['right'] = self._build_tree(X[right_mask], y[right_mask], depth + 1)

        return node

    def predict_one(self, x, node=None):
        """Predict single sample"""
        if node is None:
            node = self.tree

        if node['leaf']:
            return node['prediction']

        if x[node['feature']] <= node['threshold']:
            return self.predict_one(x, node['left'])
        else:
            return self.predict_one(x, node['right'])

    def predict(self, X):
        """Predict multiple samples"""
        return np.array([self.predict_one(x) for x in X])

# Usage example
from sklearn.datasets import make_regression
from sklearn.metrics import mean_squared_error, r2_score

X_reg, y_reg = make_regression(n_samples=500, n_features=5, noise=10, random_state=42)

reg_tree = CARTRegressor(max_depth=5, min_samples_split=10)
reg_tree.fit(X_reg, y_reg)

predictions = reg_tree.predict(X_reg)
mse = mean_squared_error(y_reg, predictions)
r2 = r2_score(y_reg, predictions)

print(f"Regression Tree MSE: {mse:.4f}")
print(f"Regression Tree R2: {r2:.4f}")
```

---

## Feature Importance

Decision trees can naturally measure feature importance, which is an important reason for their strong interpretability.

### Feature Importance Based on Impurity Decrease

Feature importance is defined as the weighted sum of impurity decreases brought by that feature across all node splits:

$$Importance(f) = \sum_{t \in T_f} \frac{n_t}{n} \Delta i(t)$$

Where:
- $T_f$ is all nodes that split on feature $f$
- $n_t$ is the sample count at node $t$
- $n$ is the total sample count
- $\Delta i(t)$ is the impurity decrease from splitting at node $t$

```python
def compute_feature_importances(tree, n_samples, n_features):
    """Calculate feature importance"""
    importances = np.zeros(n_features)

    def traverse(node, total_samples):
        if node['leaf']:
            return

        # Calculate impurity decrease
        left = node['left']
        right = node['right']

        impurity_decrease = (
            node['n_samples'] / total_samples * node['gini'] -
            left['n_samples'] / total_samples * left['gini'] -
            right['n_samples'] / total_samples * right['gini']
        )

        importances[node['feature']] += impurity_decrease

        # Recursively process child nodes
        traverse(left, total_samples)
        traverse(right, total_samples)

    traverse(tree, n_samples)

    # Normalize
    if importances.sum() > 0:
        importances /= importances.sum()

    return importances

# Using Scikit-learn
from sklearn.tree import DecisionTreeClassifier
from sklearn.datasets import load_iris
import pandas as pd

iris = load_iris()
X, y = iris.data, iris.target
feature_names = iris.feature_names

clf = DecisionTreeClassifier(max_depth=4, random_state=42)
clf.fit(X, y)

# Get feature importance
importances = clf.feature_importances_

# Visualization
importance_df = pd.DataFrame({
    'feature': feature_names,
    'importance': importances
}).sort_values('importance', ascending=False)

print("Feature Importance Ranking:")
print(importance_df)

# Plot bar chart
import matplotlib.pyplot as plt

plt.figure(figsize=(10, 6))
plt.barh(importance_df['feature'], importance_df['importance'])
plt.xlabel('Feature Importance')
plt.title('Decision Tree Feature Importance')
plt.gca().invert_yaxis()
plt.tight_layout()
plt.show()
```

### Permutation-Based Feature Importance

Permutation Importance measures the decrease in model performance by shuffling feature values:

```python
from sklearn.inspection import permutation_importance

# Calculate permutation importance
perm_importance = permutation_importance(clf, X, y, n_repeats=10, random_state=42)

# Visualization
sorted_idx = perm_importance.importances_mean.argsort()

fig, ax = plt.subplots(figsize=(10, 6))
ax.boxplot(perm_importance.importances[sorted_idx].T, vert=False,
           labels=np.array(feature_names)[sorted_idx])
ax.set_xlabel('Permutation Importance')
ax.set_title('Permutation-Based Feature Importance')
plt.tight_layout()
plt.show()
```

---

## Decision Tree Visualization

Visualizing decision trees helps understand the model's decision logic.

### Visualization with Scikit-learn

```python
from sklearn.tree import plot_tree, export_text, export_graphviz
import matplotlib.pyplot as plt

# Method 1: Using plot_tree
fig, ax = plt.subplots(figsize=(20, 10))
plot_tree(clf,
          feature_names=feature_names,
          class_names=iris.target_names,
          filled=True,
          rounded=True,
          fontsize=10,
          ax=ax)
plt.title('Decision Tree Visualization')
plt.tight_layout()
plt.savefig('decision_tree.png', dpi=150, bbox_inches='tight')
plt.show()

# Method 2: Export text rules
text_rules = export_text(clf, feature_names=feature_names)
print("Decision Rules:")
print(text_rules)

# Method 3: Export Graphviz format
dot_data = export_graphviz(clf,
                           feature_names=feature_names,
                           class_names=iris.target_names,
                           filled=True,
                           rounded=True,
                           special_characters=True)

# If graphviz is installed, can render directly
# import graphviz
# graph = graphviz.Source(dot_data)
# graph.render('decision_tree', format='png')
```

### Custom Visualization

```python
def print_tree_structure(node, feature_names, class_names=None, indent=""):
    """Print text representation of tree structure"""
    if node['leaf']:
        if class_names is not None:
            class_name = class_names[node['predicted_class']]
        else:
            class_name = node['predicted_class']
        print(f"{indent}=> Class: {class_name} (samples: {node['n_samples']})")
    else:
        feature_name = feature_names[node['feature']]
        threshold = node['threshold']

        print(f"{indent}[{feature_name} <= {threshold:.2f}]")
        print(f"{indent}|-- True:")
        print_tree_structure(node['left'], feature_names, class_names, indent + "|   ")
        print(f"{indent}|-- False:")
        print_tree_structure(node['right'], feature_names, class_names, indent + "    ")

# Decision boundary visualization (2D features)
def plot_decision_boundary(clf, X, y, feature_names, class_names):
    """Plot decision boundary"""
    h = 0.02  # Grid step size

    x_min, x_max = X[:, 0].min() - 1, X[:, 0].max() + 1
    y_min, y_max = X[:, 1].min() - 1, X[:, 1].max() + 1

    xx, yy = np.meshgrid(np.arange(x_min, x_max, h),
                         np.arange(y_min, y_max, h))

    Z = clf.predict(np.c_[xx.ravel(), yy.ravel()])
    Z = Z.reshape(xx.shape)

    plt.figure(figsize=(10, 8))
    plt.contourf(xx, yy, Z, alpha=0.4, cmap=plt.cm.RdYlBu)

    scatter = plt.scatter(X[:, 0], X[:, 1], c=y, cmap=plt.cm.RdYlBu, edgecolors='black')

    plt.xlabel(feature_names[0])
    plt.ylabel(feature_names[1])
    plt.title('Decision Tree Decision Boundary')
    plt.colorbar(scatter)
    plt.tight_layout()
    plt.show()

# Example: Using first two features of iris dataset
X_2d = iris.data[:, :2]
clf_2d = DecisionTreeClassifier(max_depth=4, random_state=42)
clf_2d.fit(X_2d, y)

plot_decision_boundary(clf_2d, X_2d, y, feature_names[:2], iris.target_names)
```

---

## Scikit-learn Implementation

### Complete Classification Example

```python
import numpy as np
import pandas as pd
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

# Load data
data = load_breast_cancer()
X, y = data.data, data.target
feature_names = data.feature_names

print(f"Dataset shape: {X.shape}")
print(f"Class distribution: {np.bincount(y)}")

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Basic decision tree
basic_tree = DecisionTreeClassifier(random_state=42)
basic_tree.fit(X_train, y_train)

print("\n=== Basic Decision Tree (No Pruning) ===")
print(f"Training accuracy: {basic_tree.score(X_train, y_train):.4f}")
print(f"Test accuracy: {basic_tree.score(X_test, y_test):.4f}")
print(f"Tree depth: {basic_tree.get_depth()}")
print(f"Number of leaves: {basic_tree.get_n_leaves()}")

# Decision tree with pre-pruning
pruned_tree = DecisionTreeClassifier(
    max_depth=5,
    min_samples_split=20,
    min_samples_leaf=5,
    random_state=42
)
pruned_tree.fit(X_train, y_train)

print("\n=== Pre-pruned Decision Tree ===")
print(f"Training accuracy: {pruned_tree.score(X_train, y_train):.4f}")
print(f"Test accuracy: {pruned_tree.score(X_test, y_test):.4f}")
print(f"Tree depth: {pruned_tree.get_depth()}")
print(f"Number of leaves: {pruned_tree.get_n_leaves()}")

# Hyperparameter tuning with cross-validation
param_grid = {
    'max_depth': [3, 5, 7, 10, None],
    'min_samples_split': [2, 5, 10, 20],
    'min_samples_leaf': [1, 2, 5, 10],
    'criterion': ['gini', 'entropy']
}

grid_search = GridSearchCV(
    DecisionTreeClassifier(random_state=42),
    param_grid,
    cv=5,
    scoring='accuracy',
    n_jobs=-1
)
grid_search.fit(X_train, y_train)

print("\n=== Grid Search Best Parameters ===")
print(f"Best parameters: {grid_search.best_params_}")
print(f"Best cross-validation score: {grid_search.best_score_:.4f}")

best_tree = grid_search.best_estimator_
print(f"Test accuracy: {best_tree.score(X_test, y_test):.4f}")

# Cost-complexity pruning
path = basic_tree.cost_complexity_pruning_path(X_train, y_train)
ccp_alphas = path.ccp_alphas

# Train trees with different alphas
train_scores = []
test_scores = []
depths = []
n_leaves = []

for alpha in ccp_alphas:
    tree = DecisionTreeClassifier(ccp_alpha=alpha, random_state=42)
    tree.fit(X_train, y_train)
    train_scores.append(tree.score(X_train, y_train))
    test_scores.append(tree.score(X_test, y_test))
    depths.append(tree.get_depth())
    n_leaves.append(tree.get_n_leaves())

# Visualization
fig, axes = plt.subplots(2, 2, figsize=(14, 10))

# Accuracy vs alpha
axes[0, 0].plot(ccp_alphas, train_scores, label='Training')
axes[0, 0].plot(ccp_alphas, test_scores, label='Test')
axes[0, 0].set_xlabel('Alpha')
axes[0, 0].set_ylabel('Accuracy')
axes[0, 0].set_title('Cost-Complexity Pruning: Accuracy')
axes[0, 0].legend()

# Tree depth vs alpha
axes[0, 1].plot(ccp_alphas, depths)
axes[0, 1].set_xlabel('Alpha')
axes[0, 1].set_ylabel('Tree Depth')
axes[0, 1].set_title('Cost-Complexity Pruning: Tree Depth')

# Number of leaves vs alpha
axes[1, 0].plot(ccp_alphas, n_leaves)
axes[1, 0].set_xlabel('Alpha')
axes[1, 0].set_ylabel('Number of Leaves')
axes[1, 0].set_title('Cost-Complexity Pruning: Number of Leaves')

# Feature importance
importance_df = pd.DataFrame({
    'feature': feature_names,
    'importance': best_tree.feature_importances_
}).sort_values('importance', ascending=True).tail(15)

axes[1, 1].barh(importance_df['feature'], importance_df['importance'])
axes[1, 1].set_xlabel('Feature Importance')
axes[1, 1].set_title('Top 15 Feature Importance')

plt.tight_layout()
plt.savefig('decision_tree_analysis.png', dpi=150)
plt.show()

# Final model evaluation
y_pred = best_tree.predict(X_test)
y_proba = best_tree.predict_proba(X_test)

print("\n=== Final Model Evaluation ===")
print(classification_report(y_test, y_pred, target_names=data.target_names))

# Confusion matrix
plt.figure(figsize=(8, 6))
cm = confusion_matrix(y_test, y_pred)
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=data.target_names,
            yticklabels=data.target_names)
plt.xlabel('Predicted Label')
plt.ylabel('True Label')
plt.title('Confusion Matrix')
plt.tight_layout()
plt.show()
```

### Complete Regression Example

```python
from sklearn.datasets import fetch_california_housing
from sklearn.tree import DecisionTreeRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

# Load data
housing = fetch_california_housing()
X, y = housing.data, housing.target
feature_names = housing.feature_names

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train regression tree
reg_tree = DecisionTreeRegressor(
    max_depth=10,
    min_samples_split=20,
    min_samples_leaf=10,
    random_state=42
)
reg_tree.fit(X_train, y_train)

# Predictions
y_pred_train = reg_tree.predict(X_train)
y_pred_test = reg_tree.predict(X_test)

# Evaluation
print("=== Regression Tree Evaluation ===")
print(f"Training MSE: {mean_squared_error(y_train, y_pred_train):.4f}")
print(f"Test MSE: {mean_squared_error(y_test, y_pred_test):.4f}")
print(f"Training MAE: {mean_absolute_error(y_train, y_pred_train):.4f}")
print(f"Test MAE: {mean_absolute_error(y_test, y_pred_test):.4f}")
print(f"Training R2: {r2_score(y_train, y_pred_train):.4f}")
print(f"Test R2: {r2_score(y_test, y_pred_test):.4f}")

# Feature importance
importance_df = pd.DataFrame({
    'feature': feature_names,
    'importance': reg_tree.feature_importances_
}).sort_values('importance', ascending=False)

print("\nFeature Importance:")
print(importance_df)

# Visualize predictions vs actual values
plt.figure(figsize=(10, 6))
plt.scatter(y_test, y_pred_test, alpha=0.5)
plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', lw=2)
plt.xlabel('Actual Values')
plt.ylabel('Predicted Values')
plt.title('Regression Tree Prediction Results')
plt.tight_layout()
plt.show()

# Residual analysis
residuals = y_test - y_pred_test

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Residual histogram
axes[0].hist(residuals, bins=50, edgecolor='black')
axes[0].axvline(x=0, color='r', linestyle='--')
axes[0].set_xlabel('Residuals')
axes[0].set_ylabel('Frequency')
axes[0].set_title('Residual Distribution')

# Residuals vs predictions
axes[1].scatter(y_pred_test, residuals, alpha=0.5)
axes[1].axhline(y=0, color='r', linestyle='--')
axes[1].set_xlabel('Predicted Values')
axes[1].set_ylabel('Residuals')
axes[1].set_title('Residuals vs Predictions')

plt.tight_layout()
plt.show()
```

### Comparison with Other Models

```python
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import time

# Define models
models = {
    'Decision Tree': DecisionTreeClassifier(max_depth=5, random_state=42),
    'Random Forest': RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42),
    'Gradient Boosting': GradientBoostingClassifier(n_estimators=100, max_depth=3, random_state=42),
    'Logistic Regression': Pipeline([
        ('scaler', StandardScaler()),
        ('clf', LogisticRegression(max_iter=1000, random_state=42))
    ]),
    'SVM': Pipeline([
        ('scaler', StandardScaler()),
        ('clf', SVC(kernel='rbf', random_state=42))
    ]),
    'KNN': Pipeline([
        ('scaler', StandardScaler()),
        ('clf', KNeighborsClassifier(n_neighbors=5))
    ]),
    'Naive Bayes': GaussianNB()
}

# Compare models
results = []

for name, model in models.items():
    start_time = time.time()

    # Training
    model.fit(X_train, y_train)
    train_time = time.time() - start_time

    # Prediction
    start_time = time.time()
    y_pred = model.predict(X_test)
    predict_time = time.time() - start_time

    # Evaluation
    train_acc = model.score(X_train, y_train)
    test_acc = model.score(X_test, y_test)

    # Cross-validation
    cv_scores = cross_val_score(model, X_train, y_train, cv=5)

    results.append({
        'Model': name,
        'Train Accuracy': train_acc,
        'Test Accuracy': test_acc,
        'CV Mean': cv_scores.mean(),
        'CV Std': cv_scores.std(),
        'Train Time (s)': train_time,
        'Predict Time (s)': predict_time
    })

results_df = pd.DataFrame(results)
results_df = results_df.sort_values('Test Accuracy', ascending=False)

print("\n=== Model Comparison ===")
print(results_df.to_string(index=False))

# Visualization comparison
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# Accuracy comparison
x = np.arange(len(results_df))
width = 0.35

axes[0].bar(x - width/2, results_df['Train Accuracy'], width, label='Training')
axes[0].bar(x + width/2, results_df['Test Accuracy'], width, label='Test')
axes[0].set_xlabel('Model')
axes[0].set_ylabel('Accuracy')
axes[0].set_title('Model Accuracy Comparison')
axes[0].set_xticks(x)
axes[0].set_xticklabels(results_df['Model'], rotation=45, ha='right')
axes[0].legend()

# Training time comparison
axes[1].barh(results_df['Model'], results_df['Train Time (s)'])
axes[1].set_xlabel('Training Time (seconds)')
axes[1].set_title('Model Training Time Comparison')

plt.tight_layout()
plt.show()
```

---

## Interview Key Points

### Common Interview Questions

**Q1: How do decision trees handle continuous features?**

Decision trees discretize continuous features by finding optimal split points. For each continuous feature, the algorithm iterates through all possible split points (usually midpoints between adjacent values), calculates the impurity decrease for each split point, and selects the optimal one.

```python
# Continuous feature handling example
def find_best_split_continuous(X, y, feature_idx):
    """Find best split point for continuous feature"""
    values = np.sort(np.unique(X[:, feature_idx]))
    thresholds = (values[:-1] + values[1:]) / 2

    best_gini = float('inf')
    best_threshold = None

    for threshold in thresholds:
        left_mask = X[:, feature_idx] <= threshold
        gini = gini_split(y[left_mask], y[~left_mask])
        if gini < best_gini:
            best_gini = gini
            best_threshold = threshold

    return best_threshold, best_gini
```

**Q2: What's the difference between information gain and Gini index?**

| Property | Information Gain | Gini Index |
|----------|-----------------|------------|
| Mathematical Basis | Information theory (entropy) | Probability statistics |
| Computational Complexity | Requires logarithm, slightly slower | Only requires squaring, faster |
| Preference | Favors multi-valued features | More balanced |
| Algorithm | ID3, C4.5 | CART |

In practice, both usually yield similar results; Gini index is more commonly chosen.

**Q3: How to prevent decision tree overfitting?**

1. **Pre-pruning**:
   - Limit maximum depth (max_depth)
   - Set minimum samples for split (min_samples_split)
   - Set minimum samples for leaf node (min_samples_leaf)
   - Limit maximum leaf nodes (max_leaf_nodes)

2. **Post-pruning**:
   - Cost-complexity pruning (ccp_alpha)
   - Reduced error pruning

3. **Other methods**:
   - Use ensemble methods (Random Forest, Gradient Boosting)
   - Cross-validation for hyperparameter selection

**Q4: How is decision tree feature importance calculated?**

Feature importance based on impurity decrease:

$$Importance(f) = \sum_{t: split\ on\ f} \frac{n_t}{N} (impurity_t - \frac{n_{left}}{n_t}impurity_{left} - \frac{n_{right}}{n_t}impurity_{right})$$

All feature importances sum to 1 after normalization.

**Q5: What are the main differences between ID3, C4.5, and CART?**

| Property | ID3 | C4.5 | CART |
|----------|-----|------|------|
| Feature Selection Criterion | Information Gain | Gain Ratio | Gini Index |
| Tree Structure | Multi-way tree | Multi-way tree | Binary tree |
| Continuous Features | Not supported | Supported | Supported |
| Missing Values | Not supported | Supported | Supported |
| Pruning Method | None | Pessimistic pruning | Cost-complexity pruning |
| Task Type | Classification | Classification | Classification + Regression |

**Q6: What's the relationship between decision trees and random forests?**

Random Forest is an ensemble method based on decision trees:
- Uses Bagging: bootstrap sampling with replacement on training data
- Feature randomness: only considers a random subset of features at each split
- Final prediction: voting (classification) or averaging (regression) across multiple trees

Random Forest reduces variance by introducing randomness, improving generalization ability, but sacrifices interpretability.

### Coding Interview Questions

**Problem: Implement information gain calculation by hand**

```python
def information_gain(X, y, feature_idx):
    """
    Calculate information gain for a feature

    Parameters:
    -----------
    X : array-like, shape (n_samples, n_features)
        Feature matrix
    y : array-like, shape (n_samples,)
        Label vector
    feature_idx : int
        Feature index

    Returns:
    --------
    float : Information gain value
    """
    # Calculate parent node entropy
    def entropy(labels):
        if len(labels) == 0:
            return 0
        probs = np.bincount(labels) / len(labels)
        probs = probs[probs > 0]
        return -np.sum(probs * np.log2(probs))

    parent_entropy = entropy(y)

    # Calculate weighted child node entropy
    values = np.unique(X[:, feature_idx])
    weighted_entropy = 0

    for value in values:
        mask = X[:, feature_idx] == value
        weight = mask.sum() / len(y)
        weighted_entropy += weight * entropy(y[mask])

    return parent_entropy - weighted_entropy
```

---

## Further Reading

### Recommended Books

- **"Machine Learning" (Zhou Zhihua)**: Chapter 4 explains decision trees in detail, including ID3, C4.5, CART, and pruning
- **"Statistical Learning Methods" (Li Hang)**: Chapter 5 on decision trees, rigorous theoretical treatment
- **"The Elements of Statistical Learning"**: Chapter 9 on tree models, in-depth mathematical derivations

### Advanced Topics

1. **Ensemble Methods**:
   - Random Forest
   - Gradient Boosting Decision Trees (GBDT)
   - XGBoost, LightGBM, CatBoost

2. **Decision Tree Variants**:
   - Fuzzy decision trees
   - Incremental decision trees
   - Multi-output decision trees

3. **Interpretability Methods**:
   - LIME (Local Interpretable Model-agnostic Explanations)
   - SHAP (SHapley Additive exPlanations)

4. **Rule Extraction**:
   - Extracting rules from decision trees
   - Rule set learning

### Industrial Application Scenarios

1. **Financial Risk Control**: Credit scoring, fraud detection
2. **Medical Diagnosis**: Disease prediction, risk assessment
3. **Recommendation Systems**: User profiling, behavior analysis
4. **Marketing Analytics**: Customer segmentation, churn prediction

---

## Summary

Decision trees are among the most fundamental and important algorithms in machine learning, with the following key points:

1. **Algorithm Understanding**:
   - Master the calculation methods for information gain, gain ratio, and Gini index
   - Understand the differences between ID3, C4.5, and CART algorithms
   - Be familiar with pre-pruning and post-pruning strategies

2. **Practical Skills**:
   - Use cross-validation for hyperparameter selection
   - Focus on feature importance for feature selection
   - Visualize decision trees to aid model interpretation

3. **Application Scenarios**:
   - Prioritize decision trees when interpretability is needed
   - Use ensemble methods when pursuing performance
   - Choose appropriate pruning strategies based on business requirements

Learning decision trees lays the foundation for understanding more complex ensemble methods (Random Forest, GBDT, etc.). After mastering single decision trees, it's recommended to continue learning ensemble learning methods to achieve better results in real projects.
