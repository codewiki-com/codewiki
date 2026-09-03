---
title: "Model Evaluation: Metrics Deep Dive"
description: "Master ML evaluation metrics: classification, regression, and ranking evaluation methods"
track: datascience
section: evaluation
difficulty: intermediate
tags:
  - evaluation metrics
  - classification
  - regression
  - model evaluation
status: imported
origin: old/src/content/docs/datascience/evaluation-metrics.en.md
divergence: 0.348
issues: []
legacy:
  category: DataScience
  subcategory: Evaluation
  order: 32
  lastUpdated: 2026-01-07
---

Choosing the right evaluation metric is one of the most critical decisions in any machine learning project. The metric you optimize directly shapes model behavior, and selecting an inappropriate metric can lead to models that perform well on paper but fail to deliver business value. This comprehensive guide explores evaluation metrics for classification, regression, and ranking problems, with practical implementation using Scikit-learn.

## Classification Metrics

Classification is the most common machine learning task, and it comes with a rich set of evaluation metrics. The appropriate choice depends on the problem characteristics, class distribution, and business requirements.

### Accuracy

Accuracy is the simplest and most intuitive metric: the proportion of correct predictions out of all predictions.

$$\text{Accuracy} = \frac{TP + TN}{TP + TN + FP + FN}$$

```python
from sklearn.metrics import accuracy_score
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import numpy as np

# Load and prepare data
data = load_breast_cancer()
X, y = data.data, data.target
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Train model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)
y_pred = model.predict(X_test)

# Calculate accuracy
accuracy = accuracy_score(y_test, y_pred)
print(f"Accuracy: {accuracy:.4f}")
```

**When to Use Accuracy:**
- Balanced datasets where classes have similar frequencies
- When all types of errors have equal cost
- As a quick baseline metric

**Limitations of Accuracy:**

Accuracy can be highly misleading with imbalanced datasets:

```python
# Demonstration: Accuracy failure on imbalanced data
y_imbalanced = np.array([0] * 950 + [1] * 50)
y_pred_naive = np.zeros(1000)  # Always predict majority class

accuracy_naive = accuracy_score(y_imbalanced, y_pred_naive)
print(f"Naive accuracy (always predict 0): {accuracy_naive:.2%}")
# Output: 95.00% - misleadingly high!
```

### Precision and Recall

Precision and recall provide a more nuanced view of classification performance, especially for imbalanced problems.

**Precision** answers: "Of all predicted positives, how many are actually positive?"

$$\text{Precision} = \frac{TP}{TP + FP}$$

**Recall (Sensitivity, True Positive Rate)** answers: "Of all actual positives, how many did we correctly identify?"

$$\text{Recall} = \frac{TP}{TP + FN}$$

```python
from sklearn.metrics import precision_score, recall_score

precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)

print(f"Precision: {precision:.4f}")
print(f"Recall: {recall:.4f}")
```

**Precision vs. Recall Trade-off:**

There is an inherent trade-off between precision and recall. Increasing one typically decreases the other.

```python
from sklearn.metrics import precision_recall_curve
import matplotlib.pyplot as plt

# Get probability predictions
y_prob = model.predict_proba(X_test)[:, 1]

# Calculate precision-recall curve
precisions, recalls, thresholds = precision_recall_curve(y_test, y_prob)

# Plot the trade-off
plt.figure(figsize=(10, 5))
plt.subplot(1, 2, 1)
plt.plot(thresholds, precisions[:-1], 'b-', label='Precision')
plt.plot(thresholds, recalls[:-1], 'r-', label='Recall')
plt.xlabel('Classification Threshold')
plt.ylabel('Score')
plt.title('Precision-Recall Trade-off')
plt.legend()
plt.grid(True, alpha=0.3)

plt.subplot(1, 2, 2)
plt.plot(recalls, precisions)
plt.xlabel('Recall')
plt.ylabel('Precision')
plt.title('Precision-Recall Curve')
plt.grid(True, alpha=0.3)

plt.tight_layout()
plt.show()
```

**Choosing Between Precision and Recall:**

| Priority | Use Case | Example |
|----------|----------|---------|
| High Precision | False positives are costly | Spam detection (legitimate emails marked as spam) |
| High Recall | False negatives are costly | Cancer detection (missing a positive case) |
| Balanced | Both errors have similar cost | General classification tasks |

### F1 Score and F-beta Score

The F1 score is the harmonic mean of precision and recall, providing a single metric that balances both concerns.

$$F_1 = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$$

The F-beta score generalizes F1, allowing you to weight precision or recall more heavily:

$$F_\beta = (1 + \beta^2) \times \frac{\text{Precision} \times \text{Recall}}{\beta^2 \times \text{Precision} + \text{Recall}}$$

- **F0.5**: Weights precision twice as much as recall
- **F1**: Equal weight to precision and recall
- **F2**: Weights recall twice as much as precision

```python
from sklearn.metrics import f1_score, fbeta_score

f1 = f1_score(y_test, y_pred)
f05 = fbeta_score(y_test, y_pred, beta=0.5)  # Precision-focused
f2 = fbeta_score(y_test, y_pred, beta=2)     # Recall-focused

print(f"F1 Score: {f1:.4f}")
print(f"F0.5 Score (precision-weighted): {f05:.4f}")
print(f"F2 Score (recall-weighted): {f2:.4f}")
```

### Confusion Matrix

The confusion matrix provides a complete breakdown of classification results, showing all four possible outcomes.

```python
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay
import matplotlib.pyplot as plt

# Generate confusion matrix
cm = confusion_matrix(y_test, y_pred)
print("Confusion Matrix:")
print(cm)

# Visual representation
fig, ax = plt.subplots(figsize=(8, 6))
disp = ConfusionMatrixDisplay(
    confusion_matrix=cm,
    display_labels=['Malignant', 'Benign']
)
disp.plot(ax=ax, cmap='Blues', values_format='d')
plt.title('Confusion Matrix')
plt.tight_layout()
plt.show()
```

**Extracting All Metrics from Confusion Matrix:**

```python
def analyze_confusion_matrix(y_true, y_pred):
    """
    Extract and explain all metrics from confusion matrix.
    """
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()

    metrics = {
        'accuracy': (tp + tn) / (tp + tn + fp + fn),
        'precision': tp / (tp + fp) if (tp + fp) > 0 else 0,
        'recall': tp / (tp + fn) if (tp + fn) > 0 else 0,
        'specificity': tn / (tn + fp) if (tn + fp) > 0 else 0,
        'false_positive_rate': fp / (fp + tn) if (fp + tn) > 0 else 0,
        'false_negative_rate': fn / (fn + tp) if (fn + tp) > 0 else 0,
        'negative_predictive_value': tn / (tn + fn) if (tn + fn) > 0 else 0,
    }

    # F1 Score
    if (metrics['precision'] + metrics['recall']) > 0:
        metrics['f1_score'] = (
            2 * metrics['precision'] * metrics['recall'] /
            (metrics['precision'] + metrics['recall'])
        )
    else:
        metrics['f1_score'] = 0

    print("Classification Metrics Summary")
    print("=" * 45)
    for name, value in metrics.items():
        print(f"{name.replace('_', ' ').title():30s}: {value:.4f}")

    return metrics

metrics = analyze_confusion_matrix(y_test, y_pred)
```

### ROC Curve and AUC-ROC

The Receiver Operating Characteristic (ROC) curve plots the True Positive Rate (Recall) against the False Positive Rate at various classification thresholds. The Area Under the Curve (AUC) summarizes this curve into a single number.

```python
from sklearn.metrics import roc_curve, roc_auc_score, auc
import matplotlib.pyplot as plt

# Get probability predictions
y_prob = model.predict_proba(X_test)[:, 1]

# Calculate ROC curve
fpr, tpr, thresholds = roc_curve(y_test, y_prob)
roc_auc = auc(fpr, tpr)

# Plot ROC curve
plt.figure(figsize=(8, 6))
plt.plot(fpr, tpr, color='darkorange', lw=2,
         label=f'ROC curve (AUC = {roc_auc:.4f})')
plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--',
         label='Random classifier (AUC = 0.5)')
plt.fill_between(fpr, tpr, alpha=0.3, color='darkorange')
plt.xlim([0.0, 1.0])
plt.ylim([0.0, 1.05])
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('Receiver Operating Characteristic (ROC) Curve')
plt.legend(loc='lower right')
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.show()

print(f"AUC-ROC Score: {roc_auc:.4f}")
```

**Interpreting AUC-ROC:**

| AUC Value | Interpretation |
|-----------|----------------|
| 0.5 | No discrimination (random guessing) |
| 0.5-0.7 | Poor discrimination |
| 0.7-0.8 | Acceptable discrimination |
| 0.8-0.9 | Good discrimination |
| 0.9-1.0 | Excellent discrimination |
| 1.0 | Perfect discrimination |

**Finding Optimal Threshold Using ROC:**

```python
from sklearn.metrics import f1_score

def find_optimal_threshold(y_true, y_prob, metric='f1'):
    """
    Find the optimal classification threshold.
    """
    thresholds = np.arange(0.0, 1.01, 0.01)
    scores = []

    for threshold in thresholds:
        y_pred_thresh = (y_prob >= threshold).astype(int)
        if metric == 'f1':
            score = f1_score(y_true, y_pred_thresh, zero_division=0)
        elif metric == 'youden':
            # Youden's J statistic (TPR - FPR)
            tn, fp, fn, tp = confusion_matrix(y_true, y_pred_thresh).ravel()
            tpr = tp / (tp + fn) if (tp + fn) > 0 else 0
            fpr = fp / (fp + tn) if (fp + tn) > 0 else 0
            score = tpr - fpr
        scores.append(score)

    optimal_idx = np.argmax(scores)
    optimal_threshold = thresholds[optimal_idx]

    return optimal_threshold, scores[optimal_idx]

optimal_thresh, best_f1 = find_optimal_threshold(y_test, y_prob, metric='f1')
print(f"Optimal threshold for F1: {optimal_thresh:.2f}")
print(f"Best F1 at optimal threshold: {best_f1:.4f}")
```

### Precision-Recall Curve and AUC-PR

For imbalanced datasets, the Precision-Recall curve often provides more insight than the ROC curve because it focuses on the minority (positive) class.

```python
from sklearn.metrics import precision_recall_curve, average_precision_score

# Calculate precision-recall curve
precisions, recalls, thresholds = precision_recall_curve(y_test, y_prob)
avg_precision = average_precision_score(y_test, y_prob)

# Plot
plt.figure(figsize=(8, 6))
plt.plot(recalls, precisions, color='darkorange', lw=2,
         label=f'PR curve (AP = {avg_precision:.4f})')
plt.fill_between(recalls, precisions, alpha=0.3, color='darkorange')
plt.xlabel('Recall')
plt.ylabel('Precision')
plt.title('Precision-Recall Curve')
plt.legend(loc='lower left')
plt.grid(True, alpha=0.3)
plt.xlim([0.0, 1.0])
plt.ylim([0.0, 1.05])
plt.tight_layout()
plt.show()

print(f"Average Precision (AUC-PR): {avg_precision:.4f}")
```

**ROC-AUC vs. PR-AUC:**

| Aspect | ROC-AUC | PR-AUC |
|--------|---------|--------|
| Sensitivity to imbalance | Less sensitive | More sensitive |
| Considers true negatives | Yes | No |
| Best for | Balanced datasets | Imbalanced datasets |
| Interpretation | Probability of ranking positive higher | Average precision across thresholds |

### Log Loss (Cross-Entropy Loss)

Log loss measures the quality of probability predictions, penalizing confident wrong predictions more heavily.

$$\text{Log Loss} = -\frac{1}{n}\sum_{i=1}^{n}[y_i \log(p_i) + (1-y_i)\log(1-p_i)]$$

```python
from sklearn.metrics import log_loss

logloss = log_loss(y_test, y_prob)
print(f"Log Loss: {logloss:.4f}")

# Compare with baseline (predicting class proportions)
baseline_prob = y_train.mean()
baseline_logloss = log_loss(y_test, [baseline_prob] * len(y_test))
print(f"Baseline Log Loss: {baseline_logloss:.4f}")
print(f"Improvement over baseline: {(baseline_logloss - logloss) / baseline_logloss:.2%}")
```

### Complete Classification Evaluation

```python
from sklearn.metrics import classification_report

def comprehensive_classification_evaluation(y_true, y_pred, y_prob=None,
                                            class_names=None):
    """
    Comprehensive evaluation of a classification model.
    """
    print("=" * 60)
    print("COMPREHENSIVE CLASSIFICATION EVALUATION")
    print("=" * 60)

    # Classification report
    print("\nClassification Report:")
    print(classification_report(y_true, y_pred, target_names=class_names))

    # Additional metrics
    print("\nAdditional Metrics:")
    print(f"  Accuracy:  {accuracy_score(y_true, y_pred):.4f}")
    print(f"  Precision: {precision_score(y_true, y_pred, average='weighted'):.4f}")
    print(f"  Recall:    {recall_score(y_true, y_pred, average='weighted'):.4f}")
    print(f"  F1 Score:  {f1_score(y_true, y_pred, average='weighted'):.4f}")

    if y_prob is not None:
        print(f"  AUC-ROC:   {roc_auc_score(y_true, y_prob):.4f}")
        print(f"  Log Loss:  {log_loss(y_true, y_prob):.4f}")
        print(f"  Avg Precision: {average_precision_score(y_true, y_prob):.4f}")

    return

# Example usage
comprehensive_classification_evaluation(
    y_test, y_pred, y_prob,
    class_names=['Malignant', 'Benign']
)
```

## Regression Metrics

Regression problems require different metrics that quantify the magnitude and distribution of prediction errors.

### Mean Squared Error (MSE) and Root Mean Squared Error (RMSE)

MSE is the average of squared differences between predicted and actual values. RMSE is the square root of MSE, expressed in the same units as the target variable.

$$\text{MSE} = \frac{1}{n}\sum_{i=1}^{n}(y_i - \hat{y}_i)^2$$

$$\text{RMSE} = \sqrt{\text{MSE}}$$

```python
from sklearn.metrics import mean_squared_error
from sklearn.datasets import fetch_california_housing
from sklearn.linear_model import LinearRegression, Ridge
from sklearn.ensemble import RandomForestRegressor
import numpy as np

# Load regression dataset
housing = fetch_california_housing()
X, y = housing.data, housing.target

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train model
reg_model = RandomForestRegressor(n_estimators=100, random_state=42)
reg_model.fit(X_train, y_train)
y_pred = reg_model.predict(X_test)

# Calculate MSE and RMSE
mse = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)

print(f"MSE:  {mse:.4f}")
print(f"RMSE: {rmse:.4f}")
```

**Characteristics of MSE/RMSE:**
- Sensitive to outliers due to squaring
- RMSE is in the same units as the target variable
- Always positive; lower is better
- MSE is commonly used as the loss function for optimization

### Mean Absolute Error (MAE)

MAE is the average of absolute differences between predicted and actual values, providing a more robust measure that is less sensitive to outliers.

$$\text{MAE} = \frac{1}{n}\sum_{i=1}^{n}|y_i - \hat{y}_i|$$

```python
from sklearn.metrics import mean_absolute_error

mae = mean_absolute_error(y_test, y_pred)
print(f"MAE: {mae:.4f}")
```

**MSE vs. MAE:**

| Aspect | MSE/RMSE | MAE |
|--------|----------|-----|
| Outlier sensitivity | High (due to squaring) | Low |
| Gradient | Varies with error magnitude | Constant |
| Interpretation | Standard deviation of errors | Average error magnitude |
| Optimization | Easier (smooth gradient) | Harder (non-smooth at 0) |

### Mean Absolute Percentage Error (MAPE)

MAPE expresses error as a percentage of the actual value, making it scale-independent and easier to interpret.

$$\text{MAPE} = \frac{100\%}{n}\sum_{i=1}^{n}\left|\frac{y_i - \hat{y}_i}{y_i}\right|$$

```python
from sklearn.metrics import mean_absolute_percentage_error

mape = mean_absolute_percentage_error(y_test, y_pred) * 100
print(f"MAPE: {mape:.2f}%")
```

**Limitations of MAPE:**
- Undefined when actual values are zero
- Asymmetric (penalizes under-prediction more than over-prediction)
- Can be misleading for values close to zero

### R-squared (Coefficient of Determination)

R-squared indicates the proportion of variance in the target variable explained by the model.

$$R^2 = 1 - \frac{\sum_{i=1}^{n}(y_i - \hat{y}_i)^2}{\sum_{i=1}^{n}(y_i - \bar{y})^2} = 1 - \frac{SS_{res}}{SS_{tot}}$$

```python
from sklearn.metrics import r2_score

r2 = r2_score(y_test, y_pred)
print(f"R-squared: {r2:.4f}")
print(f"Model explains {r2*100:.1f}% of variance in the target")

# Adjusted R-squared (accounts for number of features)
n = len(y_test)
p = X_test.shape[1]
adj_r2 = 1 - (1 - r2) * (n - 1) / (n - p - 1)
print(f"Adjusted R-squared: {adj_r2:.4f}")
```

**Interpreting R-squared:**

| R-squared Value | Interpretation |
|-----------------|----------------|
| < 0 | Model worse than predicting mean |
| 0 | Model equivalent to predicting mean |
| 0.0-0.3 | Low explanatory power |
| 0.3-0.5 | Moderate explanatory power |
| 0.5-0.7 | Good explanatory power |
| 0.7-0.9 | High explanatory power |
| 0.9-1.0 | Excellent (possibly overfitting) |

### Median Absolute Error

Median Absolute Error is robust to outliers and represents the median of all absolute differences.

```python
from sklearn.metrics import median_absolute_error

median_ae = median_absolute_error(y_test, y_pred)
print(f"Median Absolute Error: {median_ae:.4f}")
```

### Comprehensive Regression Evaluation

```python
def comprehensive_regression_evaluation(y_true, y_pred, X_test=None):
    """
    Comprehensive regression model evaluation with visualization.
    """
    from sklearn.metrics import (
        mean_squared_error, mean_absolute_error,
        r2_score, median_absolute_error,
        mean_absolute_percentage_error
    )

    mse = mean_squared_error(y_true, y_pred)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(y_true, y_pred)
    median_ae = median_absolute_error(y_true, y_pred)
    r2 = r2_score(y_true, y_pred)
    mape = mean_absolute_percentage_error(y_true, y_pred) * 100

    # Adjusted R-squared if X_test is provided
    if X_test is not None:
        n, p = len(y_true), X_test.shape[1]
        adj_r2 = 1 - (1 - r2) * (n - 1) / (n - p - 1)
    else:
        adj_r2 = None

    print("=" * 50)
    print("REGRESSION METRICS SUMMARY")
    print("=" * 50)
    print(f"\nError Metrics:")
    print(f"  MSE:                  {mse:.4f}")
    print(f"  RMSE:                 {rmse:.4f}")
    print(f"  MAE:                  {mae:.4f}")
    print(f"  Median AE:            {median_ae:.4f}")
    print(f"  MAPE:                 {mape:.2f}%")
    print(f"\nExplained Variance:")
    print(f"  R-squared:            {r2:.4f}")
    if adj_r2 is not None:
        print(f"  Adjusted R-squared:   {adj_r2:.4f}")

    # Residual analysis
    residuals = y_true - y_pred

    fig, axes = plt.subplots(2, 2, figsize=(12, 10))

    # 1. Predicted vs Actual
    axes[0, 0].scatter(y_true, y_pred, alpha=0.5, edgecolors='k', linewidths=0.5)
    min_val = min(y_true.min(), y_pred.min())
    max_val = max(y_true.max(), y_pred.max())
    axes[0, 0].plot([min_val, max_val], [min_val, max_val], 'r--', lw=2)
    axes[0, 0].set_xlabel('Actual Values')
    axes[0, 0].set_ylabel('Predicted Values')
    axes[0, 0].set_title('Predicted vs Actual')

    # 2. Residuals vs Predicted
    axes[0, 1].scatter(y_pred, residuals, alpha=0.5, edgecolors='k', linewidths=0.5)
    axes[0, 1].axhline(y=0, color='r', linestyle='--', lw=2)
    axes[0, 1].set_xlabel('Predicted Values')
    axes[0, 1].set_ylabel('Residuals')
    axes[0, 1].set_title('Residuals vs Predicted')

    # 3. Residual Distribution
    axes[1, 0].hist(residuals, bins=30, edgecolor='black', density=True)
    axes[1, 0].set_xlabel('Residuals')
    axes[1, 0].set_ylabel('Density')
    axes[1, 0].set_title('Residual Distribution')

    # 4. Q-Q Plot
    from scipy import stats
    stats.probplot(residuals, dist="norm", plot=axes[1, 1])
    axes[1, 1].set_title('Normal Q-Q Plot')

    plt.tight_layout()
    plt.show()

    return {
        'mse': mse, 'rmse': rmse, 'mae': mae,
        'median_ae': median_ae, 'r2': r2, 'adj_r2': adj_r2, 'mape': mape
    }

# Example usage
metrics = comprehensive_regression_evaluation(y_test, y_pred, X_test)
```

## Ranking Metrics

Ranking metrics are essential for information retrieval systems, recommendation engines, and search applications. They evaluate how well a model orders items by relevance.

### Normalized Discounted Cumulative Gain (NDCG)

NDCG measures ranking quality by considering both the relevance of items and their positions. Items ranked higher receive more weight.

$$\text{DCG}_k = \sum_{i=1}^{k}\frac{2^{rel_i} - 1}{\log_2(i + 1)}$$

$$\text{NDCG}_k = \frac{\text{DCG}_k}{\text{IDCG}_k}$$

Where IDCG is the DCG of the ideal (perfect) ranking.

```python
from sklearn.metrics import ndcg_score
import numpy as np

def demonstrate_ndcg():
    """
    Demonstrate NDCG calculation with examples.
    """
    # True relevance scores (ground truth)
    y_true = np.array([[3, 2, 1, 0, 0]])  # Ideal ranking: 3, 2, 1, 0, 0

    # Predicted relevance scores (model output)
    y_pred_good = np.array([[3.5, 2.2, 1.1, 0.1, 0.0]])  # Good ranking
    y_pred_bad = np.array([[0.0, 0.1, 1.1, 2.2, 3.5]])   # Reversed ranking

    # Calculate NDCG at different k values
    for k in [1, 3, 5]:
        ndcg_good = ndcg_score(y_true, y_pred_good, k=k)
        ndcg_bad = ndcg_score(y_true, y_pred_bad, k=k)
        print(f"NDCG@{k} - Good ranking: {ndcg_good:.4f}, Bad ranking: {ndcg_bad:.4f}")

    return

demonstrate_ndcg()
```

**Custom NDCG Implementation for Understanding:**

```python
def calculate_dcg(relevances, k=None):
    """
    Calculate Discounted Cumulative Gain.
    """
    if k is None:
        k = len(relevances)
    relevances = np.array(relevances)[:k]
    positions = np.arange(1, len(relevances) + 1)
    discounts = np.log2(positions + 1)
    gains = (2 ** relevances - 1) / discounts
    return np.sum(gains)

def calculate_ndcg(y_true, y_pred, k=None):
    """
    Calculate NDCG from scratch.
    """
    # Sort by predicted scores
    sorted_indices = np.argsort(y_pred)[::-1]
    sorted_true = np.array(y_true)[sorted_indices]

    # Calculate DCG
    dcg = calculate_dcg(sorted_true, k)

    # Calculate Ideal DCG (perfect ranking)
    ideal_sorted = np.sort(y_true)[::-1]
    idcg = calculate_dcg(ideal_sorted, k)

    # Avoid division by zero
    if idcg == 0:
        return 0.0

    return dcg / idcg

# Example
true_relevances = [3, 2, 1, 0, 0]
predicted_scores = [0.9, 0.8, 0.3, 0.1, 0.05]

ndcg = calculate_ndcg(true_relevances, predicted_scores, k=5)
print(f"Custom NDCG@5: {ndcg:.4f}")
```

### Mean Average Precision (MAP)

MAP is widely used in information retrieval. It computes the average precision across all queries and averages them.

$$\text{AP} = \frac{1}{|R|}\sum_{k=1}^{n}P(k) \times rel(k)$$

$$\text{MAP} = \frac{1}{|Q|}\sum_{q=1}^{|Q|}\text{AP}(q)$$

```python
def average_precision(y_true, y_scores):
    """
    Calculate Average Precision for a single query.

    Args:
        y_true: Binary relevance labels (1 = relevant, 0 = not relevant)
        y_scores: Predicted scores

    Returns:
        Average precision score
    """
    # Sort by predicted scores (descending)
    sorted_indices = np.argsort(y_scores)[::-1]
    y_true_sorted = np.array(y_true)[sorted_indices]

    # Calculate precision at each relevant item
    precisions = []
    num_relevant = 0

    for i, is_relevant in enumerate(y_true_sorted, 1):
        if is_relevant:
            num_relevant += 1
            precision_at_k = num_relevant / i
            precisions.append(precision_at_k)

    if not precisions:
        return 0.0

    return np.mean(precisions)

def mean_average_precision(y_true_list, y_scores_list):
    """
    Calculate MAP across multiple queries.
    """
    aps = [average_precision(yt, ys)
           for yt, ys in zip(y_true_list, y_scores_list)]
    return np.mean(aps)

# Example: Multiple queries
queries = [
    # Query 1: 5 results, 3 relevant
    {'y_true': [1, 0, 1, 0, 1], 'y_scores': [0.9, 0.7, 0.6, 0.4, 0.2]},
    # Query 2: 5 results, 2 relevant
    {'y_true': [0, 1, 1, 0, 0], 'y_scores': [0.8, 0.7, 0.6, 0.3, 0.1]},
    # Query 3: 5 results, 4 relevant
    {'y_true': [1, 1, 0, 1, 1], 'y_scores': [0.95, 0.85, 0.75, 0.65, 0.55]},
]

y_true_list = [q['y_true'] for q in queries]
y_scores_list = [q['y_scores'] for q in queries]

map_score = mean_average_precision(y_true_list, y_scores_list)
print(f"Mean Average Precision (MAP): {map_score:.4f}")

# Individual AP for each query
for i, q in enumerate(queries, 1):
    ap = average_precision(q['y_true'], q['y_scores'])
    print(f"  Query {i} AP: {ap:.4f}")
```

### Mean Reciprocal Rank (MRR)

MRR measures how high the first relevant item is ranked. It is the average of reciprocal ranks across queries.

$$\text{MRR} = \frac{1}{|Q|}\sum_{q=1}^{|Q|}\frac{1}{\text{rank}_q}$$

```python
def reciprocal_rank(y_true, y_scores):
    """
    Calculate Reciprocal Rank for a single query.
    """
    sorted_indices = np.argsort(y_scores)[::-1]
    y_true_sorted = np.array(y_true)[sorted_indices]

    for i, is_relevant in enumerate(y_true_sorted, 1):
        if is_relevant:
            return 1.0 / i

    return 0.0

def mean_reciprocal_rank(y_true_list, y_scores_list):
    """
    Calculate MRR across multiple queries.
    """
    rrs = [reciprocal_rank(yt, ys)
           for yt, ys in zip(y_true_list, y_scores_list)]
    return np.mean(rrs)

# Using the same queries as before
mrr = mean_reciprocal_rank(y_true_list, y_scores_list)
print(f"Mean Reciprocal Rank (MRR): {mrr:.4f}")

# Individual RR for each query
for i, q in enumerate(queries, 1):
    rr = reciprocal_rank(q['y_true'], q['y_scores'])
    print(f"  Query {i} RR: {rr:.4f}")
```

### Precision@K and Recall@K

These metrics evaluate precision and recall considering only the top K ranked items.

```python
def precision_at_k(y_true, y_scores, k):
    """
    Calculate Precision@K.
    """
    sorted_indices = np.argsort(y_scores)[::-1][:k]
    y_true_at_k = np.array(y_true)[sorted_indices]
    return np.sum(y_true_at_k) / k

def recall_at_k(y_true, y_scores, k):
    """
    Calculate Recall@K.
    """
    sorted_indices = np.argsort(y_scores)[::-1][:k]
    y_true_at_k = np.array(y_true)[sorted_indices]
    total_relevant = np.sum(y_true)
    if total_relevant == 0:
        return 0.0
    return np.sum(y_true_at_k) / total_relevant

# Example
y_true = [1, 0, 1, 0, 1, 0, 1, 0, 0, 0]  # 4 relevant items
y_scores = [0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45]

for k in [1, 3, 5, 10]:
    p_at_k = precision_at_k(y_true, y_scores, k)
    r_at_k = recall_at_k(y_true, y_scores, k)
    print(f"P@{k}: {p_at_k:.4f}, R@{k}: {r_at_k:.4f}")
```

### Complete Ranking Evaluation

```python
def comprehensive_ranking_evaluation(y_true_list, y_scores_list, k_values=[1, 3, 5, 10]):
    """
    Comprehensive ranking evaluation across multiple queries.
    """
    print("=" * 60)
    print("RANKING METRICS EVALUATION")
    print("=" * 60)

    # MRR
    mrr = mean_reciprocal_rank(y_true_list, y_scores_list)
    print(f"\nMean Reciprocal Rank (MRR): {mrr:.4f}")

    # MAP
    map_score = mean_average_precision(y_true_list, y_scores_list)
    print(f"Mean Average Precision (MAP): {map_score:.4f}")

    # NDCG at different K
    print("\nNDCG at different K:")
    for k in k_values:
        ndcg_scores = []
        for yt, ys in zip(y_true_list, y_scores_list):
            if len(yt) >= k:
                ndcg = ndcg_score([yt], [ys], k=k)
                ndcg_scores.append(ndcg)
        if ndcg_scores:
            print(f"  NDCG@{k}: {np.mean(ndcg_scores):.4f}")

    # Precision@K and Recall@K
    print("\nPrecision@K and Recall@K:")
    for k in k_values:
        p_scores = []
        r_scores = []
        for yt, ys in zip(y_true_list, y_scores_list):
            if len(yt) >= k:
                p_scores.append(precision_at_k(yt, ys, k))
                r_scores.append(recall_at_k(yt, ys, k))
        if p_scores:
            print(f"  P@{k}: {np.mean(p_scores):.4f}, R@{k}: {np.mean(r_scores):.4f}")

    return

# Example evaluation
comprehensive_ranking_evaluation(y_true_list, y_scores_list)
```

## Multiclass Evaluation

Multiclass classification requires extending binary metrics to handle multiple classes.

### Averaging Strategies

When dealing with multiclass problems, metrics can be aggregated in different ways:

```python
from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import precision_score, recall_score, f1_score

# Load multiclass dataset
iris = load_iris()
X, y = iris.data, iris.target

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Train model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)
y_pred = model.predict(X_test)

# Different averaging strategies
print("Averaging Strategies for Multiclass Metrics:")
print("=" * 50)

for average in ['micro', 'macro', 'weighted']:
    precision = precision_score(y_test, y_pred, average=average)
    recall = recall_score(y_test, y_pred, average=average)
    f1 = f1_score(y_test, y_pred, average=average)
    print(f"\n{average.upper()} Averaging:")
    print(f"  Precision: {precision:.4f}")
    print(f"  Recall:    {recall:.4f}")
    print(f"  F1 Score:  {f1:.4f}")
```

**Averaging Strategy Comparison:**

| Strategy | Description | Best For |
|----------|-------------|----------|
| Micro | Calculate globally across all samples | Imbalanced classes |
| Macro | Calculate per class, then average | Equal importance to all classes |
| Weighted | Macro with class weights by support | Account for class imbalance |

### Multiclass Confusion Matrix

```python
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay
import matplotlib.pyplot as plt

# Generate confusion matrix
cm = confusion_matrix(y_test, y_pred)

# Visualize
fig, ax = plt.subplots(figsize=(8, 6))
disp = ConfusionMatrixDisplay(
    confusion_matrix=cm,
    display_labels=iris.target_names
)
disp.plot(ax=ax, cmap='Blues', values_format='d')
plt.title('Multiclass Confusion Matrix')
plt.tight_layout()
plt.show()
```

### Per-Class Metrics

```python
from sklearn.metrics import classification_report

# Detailed per-class metrics
print("\nDetailed Classification Report:")
print(classification_report(y_test, y_pred, target_names=iris.target_names))
```

### Multiclass ROC-AUC

For multiclass problems, ROC-AUC can be calculated using One-vs-Rest (OvR) or One-vs-One (OvO) strategies:

```python
from sklearn.metrics import roc_auc_score
from sklearn.preprocessing import label_binarize

# Get probability predictions
y_prob = model.predict_proba(X_test)

# Binarize labels for multiclass ROC calculation
y_test_bin = label_binarize(y_test, classes=[0, 1, 2])

# Calculate multiclass AUC
auc_ovr_macro = roc_auc_score(y_test_bin, y_prob, multi_class='ovr', average='macro')
auc_ovr_weighted = roc_auc_score(y_test_bin, y_prob, multi_class='ovr', average='weighted')
auc_ovo_macro = roc_auc_score(y_test, y_prob, multi_class='ovo', average='macro')

print("\nMulticlass AUC-ROC:")
print(f"  OvR Macro: {auc_ovr_macro:.4f}")
print(f"  OvR Weighted: {auc_ovr_weighted:.4f}")
print(f"  OvO Macro: {auc_ovo_macro:.4f}")
```

## Imbalanced Data Evaluation

Imbalanced datasets require special consideration in metric selection and evaluation.

### Challenges with Imbalanced Data

```python
from sklearn.datasets import make_classification

# Create imbalanced dataset
X_imb, y_imb = make_classification(
    n_samples=10000,
    n_features=20,
    n_informative=10,
    n_redundant=5,
    n_classes=2,
    weights=[0.95, 0.05],  # 95% class 0, 5% class 1
    random_state=42
)

print(f"Class distribution:")
print(f"  Class 0: {sum(y_imb == 0)} ({sum(y_imb == 0)/len(y_imb):.1%})")
print(f"  Class 1: {sum(y_imb == 1)} ({sum(y_imb == 1)/len(y_imb):.1%})")
```

### Recommended Metrics for Imbalanced Data

```python
from sklearn.metrics import (
    balanced_accuracy_score,
    cohen_kappa_score,
    matthews_corrcoef,
    average_precision_score,
    precision_recall_fscore_support
)

X_train_imb, X_test_imb, y_train_imb, y_test_imb = train_test_split(
    X_imb, y_imb, test_size=0.2, random_state=42, stratify=y_imb
)

model_imb = RandomForestClassifier(n_estimators=100, random_state=42)
model_imb.fit(X_train_imb, y_train_imb)
y_pred_imb = model_imb.predict(X_test_imb)
y_prob_imb = model_imb.predict_proba(X_test_imb)[:, 1]

def evaluate_imbalanced(y_true, y_pred, y_prob):
    """
    Comprehensive evaluation for imbalanced datasets.
    """
    print("=" * 60)
    print("IMBALANCED DATA EVALUATION")
    print("=" * 60)

    # Standard metrics (for comparison)
    print("\nStandard Metrics (can be misleading):")
    print(f"  Accuracy: {accuracy_score(y_true, y_pred):.4f}")

    # Better metrics for imbalanced data
    print("\nRecommended Metrics for Imbalanced Data:")
    print(f"  Balanced Accuracy: {balanced_accuracy_score(y_true, y_pred):.4f}")
    print(f"  Cohen's Kappa: {cohen_kappa_score(y_true, y_pred):.4f}")
    print(f"  Matthews Correlation Coefficient: {matthews_corrcoef(y_true, y_pred):.4f}")
    print(f"  Average Precision (PR-AUC): {average_precision_score(y_true, y_prob):.4f}")
    print(f"  ROC-AUC: {roc_auc_score(y_true, y_prob):.4f}")

    # Per-class metrics
    precision, recall, f1, support = precision_recall_fscore_support(y_true, y_pred)
    print("\nPer-Class Metrics:")
    print(f"  Minority Class (1):")
    print(f"    Precision: {precision[1]:.4f}")
    print(f"    Recall: {recall[1]:.4f}")
    print(f"    F1 Score: {f1[1]:.4f}")
    print(f"    Support: {support[1]}")

    return

evaluate_imbalanced(y_test_imb, y_pred_imb, y_prob_imb)
```

### Matthews Correlation Coefficient (MCC)

MCC is considered one of the best metrics for imbalanced binary classification, as it takes into account all four confusion matrix values.

$$\text{MCC} = \frac{TP \times TN - FP \times FN}{\sqrt{(TP+FP)(TP+FN)(TN+FP)(TN+FN)}}$$

```python
from sklearn.metrics import matthews_corrcoef

mcc = matthews_corrcoef(y_test_imb, y_pred_imb)
print(f"Matthews Correlation Coefficient: {mcc:.4f}")

# MCC interpretation:
# +1: Perfect prediction
#  0: No better than random
# -1: Total disagreement
```

### Balanced Accuracy

Balanced accuracy is the average of recall for each class, giving equal weight to all classes regardless of their size.

$$\text{Balanced Accuracy} = \frac{1}{2}\left(\frac{TP}{TP+FN} + \frac{TN}{TN+FP}\right)$$

```python
from sklearn.metrics import balanced_accuracy_score

balanced_acc = balanced_accuracy_score(y_test_imb, y_pred_imb)
print(f"Balanced Accuracy: {balanced_acc:.4f}")
```

## Custom Business Metrics

In real-world applications, standard metrics often need to be adapted to reflect business objectives.

### Cost-Sensitive Evaluation

Different types of errors often have different costs. A cost matrix allows you to incorporate these differences.

```python
def cost_sensitive_evaluation(y_true, y_pred, cost_matrix):
    """
    Evaluate model using a custom cost matrix.

    Args:
        y_true: True labels
        y_pred: Predicted labels
        cost_matrix: 2x2 matrix where cost_matrix[i][j] is the cost
                     of predicting j when true label is i

    Returns:
        Total cost and average cost per prediction
    """
    cm = confusion_matrix(y_true, y_pred)

    total_cost = np.sum(cm * cost_matrix)
    avg_cost = total_cost / len(y_true)

    print("Cost-Sensitive Evaluation")
    print("=" * 40)
    print(f"Cost Matrix:")
    print(f"  TN cost: {cost_matrix[0][0]}, FP cost: {cost_matrix[0][1]}")
    print(f"  FN cost: {cost_matrix[1][0]}, TP cost: {cost_matrix[1][1]}")
    print(f"\nConfusion Matrix:")
    print(cm)
    print(f"\nTotal Cost: {total_cost:.2f}")
    print(f"Average Cost per Prediction: {avg_cost:.4f}")

    return total_cost, avg_cost

# Example: Fraud detection where false negatives are 10x more costly
# than false positives
cost_matrix = np.array([
    [0, 1],    # TN: 0 cost, FP: $1 cost
    [10, 0]    # FN: $10 cost, TP: 0 cost
])

cost_sensitive_evaluation(y_test_imb, y_pred_imb, cost_matrix)
```

### Profit Curve

A profit curve shows expected profit as a function of the classification threshold.

```python
def plot_profit_curve(y_true, y_prob, benefit_tp, cost_fp, cost_fn=0, benefit_tn=0):
    """
    Plot profit curve for different classification thresholds.

    Args:
        y_true: True labels
        y_prob: Predicted probabilities
        benefit_tp: Benefit of true positive
        cost_fp: Cost of false positive
        cost_fn: Cost of false negative
        benefit_tn: Benefit of true negative
    """
    thresholds = np.arange(0, 1.01, 0.01)
    profits = []

    for threshold in thresholds:
        y_pred_thresh = (y_prob >= threshold).astype(int)
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred_thresh).ravel()

        profit = (
            tp * benefit_tp +
            tn * benefit_tn -
            fp * cost_fp -
            fn * cost_fn
        )
        profits.append(profit)

    # Find optimal threshold
    optimal_idx = np.argmax(profits)
    optimal_threshold = thresholds[optimal_idx]
    max_profit = profits[optimal_idx]

    plt.figure(figsize=(10, 6))
    plt.plot(thresholds, profits, 'b-', linewidth=2)
    plt.axvline(x=optimal_threshold, color='r', linestyle='--',
                label=f'Optimal threshold: {optimal_threshold:.2f}')
    plt.scatter([optimal_threshold], [max_profit], color='r', s=100, zorder=5)
    plt.xlabel('Classification Threshold')
    plt.ylabel('Total Profit')
    plt.title('Profit Curve')
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.show()

    print(f"Optimal Threshold: {optimal_threshold:.2f}")
    print(f"Maximum Profit: {max_profit:.2f}")

    return optimal_threshold, max_profit

# Example: Credit card fraud detection
# Catching fraud saves $1000, false alarm costs $50
plot_profit_curve(y_test_imb, y_prob_imb,
                  benefit_tp=1000, cost_fp=50, cost_fn=1000)
```

### Custom Scoring Functions for Cross-Validation

```python
from sklearn.metrics import make_scorer
from sklearn.model_selection import cross_val_score

def custom_business_metric(y_true, y_pred):
    """
    Custom business metric that weights false negatives more heavily.
    """
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()

    # Business formula: TP value - FP cost - 10 * FN cost
    score = tp * 100 - fp * 10 - fn * 100

    return score

# Create scorer
business_scorer = make_scorer(custom_business_metric, greater_is_better=True)

# Use in cross-validation
model = RandomForestClassifier(n_estimators=100, random_state=42)
cv_scores = cross_val_score(model, X_imb, y_imb, cv=5, scoring=business_scorer)

print(f"Cross-validation business scores: {cv_scores}")
print(f"Mean: {cv_scores.mean():.2f} (+/- {cv_scores.std()*2:.2f})")
```

### Conversion Rate Optimization

For marketing and conversion optimization problems:

```python
def conversion_metrics(y_true, y_pred, y_prob):
    """
    Calculate conversion-related business metrics.
    """
    # Predicted positive rate (targeting rate)
    targeting_rate = np.mean(y_pred)

    # Actual conversion rate
    actual_conversion_rate = np.mean(y_true)

    # Conversion rate among predicted positives (precision)
    if np.sum(y_pred) > 0:
        predicted_conversion_rate = precision_score(y_true, y_pred)
    else:
        predicted_conversion_rate = 0

    # Lift: improvement over random targeting
    if actual_conversion_rate > 0:
        lift = predicted_conversion_rate / actual_conversion_rate
    else:
        lift = 0

    # Cumulative gains
    sorted_indices = np.argsort(y_prob)[::-1]
    y_true_sorted = np.array(y_true)[sorted_indices]
    cumulative_gains = np.cumsum(y_true_sorted) / np.sum(y_true)

    print("Conversion Metrics")
    print("=" * 40)
    print(f"Targeting Rate: {targeting_rate:.2%}")
    print(f"Baseline Conversion Rate: {actual_conversion_rate:.2%}")
    print(f"Predicted Conversion Rate: {predicted_conversion_rate:.2%}")
    print(f"Lift: {lift:.2f}x")

    # Plot cumulative gains
    plt.figure(figsize=(8, 6))
    percentages = np.arange(1, len(y_true) + 1) / len(y_true)
    plt.plot(percentages, cumulative_gains, 'b-', label='Model')
    plt.plot([0, 1], [0, 1], 'k--', label='Random')
    plt.xlabel('Proportion of Population Targeted')
    plt.ylabel('Proportion of Conversions Captured')
    plt.title('Cumulative Gains Chart')
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.show()

    return

conversion_metrics(y_test_imb, y_pred_imb, y_prob_imb)
```

## Scikit-learn Implementation Patterns

### Using Scorer Objects

```python
from sklearn.metrics import (
    get_scorer, get_scorer_names, make_scorer
)
from sklearn.model_selection import cross_val_score, GridSearchCV

# List available scorers
print("Available scorers:")
print(sorted(get_scorer_names())[:20])

# Get a specific scorer
f1_scorer = get_scorer('f1')
roc_auc_scorer = get_scorer('roc_auc')

# Use in cross-validation
model = RandomForestClassifier(n_estimators=100, random_state=42)
data = load_breast_cancer()
X, y = data.data, data.target

# Multiple metrics at once
from sklearn.model_selection import cross_validate

scoring = {
    'accuracy': 'accuracy',
    'precision': 'precision',
    'recall': 'recall',
    'f1': 'f1',
    'roc_auc': 'roc_auc'
}

cv_results = cross_validate(model, X, y, cv=5, scoring=scoring)

print("\nCross-validation with multiple metrics:")
for metric in scoring.keys():
    scores = cv_results[f'test_{metric}']
    print(f"  {metric}: {scores.mean():.4f} (+/- {scores.std()*2:.4f})")
```

### Hyperparameter Tuning with Custom Metrics

```python
from sklearn.model_selection import GridSearchCV

# Define parameter grid
param_grid = {
    'n_estimators': [50, 100, 200],
    'max_depth': [5, 10, None],
    'min_samples_split': [2, 5, 10]
}

# Grid search with F1 score
grid_search = GridSearchCV(
    RandomForestClassifier(random_state=42),
    param_grid,
    cv=5,
    scoring='f1',
    n_jobs=-1,
    verbose=1
)

grid_search.fit(X_train, y_train)

print(f"\nBest parameters: {grid_search.best_params_}")
print(f"Best F1 score: {grid_search.best_score_:.4f}")

# Evaluate best model
best_model = grid_search.best_estimator_
y_pred_best = best_model.predict(X_test)
print(f"Test F1 score: {f1_score(y_test, y_pred_best):.4f}")
```

### Complete Evaluation Pipeline

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_validate

def complete_evaluation_pipeline(X, y, model, cv=5):
    """
    Complete evaluation pipeline with preprocessing and multiple metrics.
    """
    # Create pipeline with preprocessing
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('model', model)
    ])

    # Define comprehensive scoring
    scoring = {
        'accuracy': 'accuracy',
        'balanced_accuracy': 'balanced_accuracy',
        'precision_weighted': 'precision_weighted',
        'recall_weighted': 'recall_weighted',
        'f1_weighted': 'f1_weighted',
        'roc_auc': 'roc_auc'
    }

    # Cross-validation with multiple metrics
    cv_results = cross_validate(
        pipeline, X, y,
        cv=cv,
        scoring=scoring,
        return_train_score=True,
        n_jobs=-1
    )

    print("=" * 60)
    print("COMPLETE EVALUATION PIPELINE RESULTS")
    print("=" * 60)

    print(f"\n{cv}-Fold Cross-Validation Results:")
    print("-" * 50)

    for metric in scoring.keys():
        train_key = f'train_{metric}'
        test_key = f'test_{metric}'

        train_mean = cv_results[train_key].mean()
        train_std = cv_results[train_key].std()
        test_mean = cv_results[test_key].mean()
        test_std = cv_results[test_key].std()
        gap = train_mean - test_mean

        print(f"\n{metric.upper().replace('_', ' ')}:")
        print(f"  Train: {train_mean:.4f} (+/- {train_std*2:.4f})")
        print(f"  Test:  {test_mean:.4f} (+/- {test_std*2:.4f})")
        if gap > 0.05:
            print(f"  Gap:   {gap:.4f} (potential overfitting)")

    return cv_results

# Example usage
model = RandomForestClassifier(n_estimators=100, random_state=42)
results = complete_evaluation_pipeline(X, y, model)
```

## Best Practices and Guidelines

### Metric Selection Guide

| Problem Type | Primary Metrics | When to Use |
|--------------|----------------|-------------|
| Binary Classification (Balanced) | Accuracy, F1, AUC-ROC | Standard classification |
| Binary Classification (Imbalanced) | PR-AUC, F1, MCC, Balanced Accuracy | Rare event detection |
| Multiclass Classification | Macro F1, Weighted F1, Accuracy | Multiple categories |
| Regression | RMSE, MAE, R-squared | Continuous predictions |
| Ranking | NDCG, MAP, MRR | Search/recommendation |
| Business Application | Custom metrics | Revenue/cost optimization |

### Common Pitfalls

```python
def demonstrate_common_pitfalls():
    """
    Demonstrate common pitfalls in model evaluation.
    """
    print("COMMON EVALUATION PITFALLS")
    print("=" * 60)

    # Pitfall 1: Using accuracy on imbalanced data
    print("\n1. Using accuracy on imbalanced data:")
    print("   - A naive classifier predicting majority class")
    print("   - can achieve 95% accuracy on 95/5 split!")
    print("   - Use PR-AUC, F1, or MCC instead")

    # Pitfall 2: Ignoring confidence intervals
    print("\n2. Ignoring confidence intervals:")
    print("   - Single train-test split gives point estimate")
    print("   - Use cross-validation for reliability")
    print("   - Report mean +/- standard deviation")

    # Pitfall 3: Leaking test data
    print("\n3. Data leakage:")
    print("   - Preprocessing on full dataset before split")
    print("   - Using future data for prediction")
    print("   - Always fit scalers/encoders on training data only")

    # Pitfall 4: Wrong metric for the problem
    print("\n4. Metric-problem mismatch:")
    print("   - Optimizing accuracy when costs are unequal")
    print("   - Using RMSE when outliers should be ignored")
    print("   - Choose metrics aligned with business goals")

    # Pitfall 5: Ignoring calibration
    print("\n5. Ignoring probability calibration:")
    print("   - High AUC does not mean calibrated probabilities")
    print("   - Use calibration curves to verify")
    print("   - Consider Platt scaling or isotonic regression")

demonstrate_common_pitfalls()
```

### Evaluation Checklist

```python
def evaluation_checklist():
    """
    Comprehensive evaluation checklist for ML projects.
    """
    checklist = """
    MACHINE LEARNING EVALUATION CHECKLIST
    =====================================

    DATA PREPARATION:
    [ ] Proper train/validation/test split
    [ ] No data leakage from test set
    [ ] Stratified sampling for classification
    [ ] Time-based split for temporal data

    METRIC SELECTION:
    [ ] Metric aligned with business objective
    [ ] Appropriate metric for class balance
    [ ] Multiple metrics for comprehensive view
    [ ] Custom metrics for specific business needs

    VALIDATION:
    [ ] Cross-validation for reliable estimates
    [ ] Confidence intervals reported
    [ ] Statistical significance testing
    [ ] Learning curves analyzed

    THRESHOLD SELECTION:
    [ ] Optimal threshold determined
    [ ] Threshold based on business constraints
    [ ] Sensitivity analysis performed

    DOCUMENTATION:
    [ ] All metrics clearly documented
    [ ] Baseline comparison included
    [ ] Limitations acknowledged
    [ ] Reproducibility ensured
    """
    print(checklist)

evaluation_checklist()
```

## Summary

Evaluation metrics are the compass that guides machine learning development. This guide covered:

1. **Classification Metrics**: From basic accuracy to sophisticated measures like AUC-ROC and PR-AUC, understanding when to use each metric is crucial.

2. **Regression Metrics**: MSE, MAE, RMSE, and R-squared each tell a different story about model performance.

3. **Ranking Metrics**: NDCG, MAP, and MRR are essential for search and recommendation systems.

4. **Multiclass Evaluation**: Different averaging strategies (micro, macro, weighted) serve different purposes.

5. **Imbalanced Data**: Special metrics like MCC and balanced accuracy address the challenges of skewed class distributions.

6. **Custom Business Metrics**: Real-world applications often require metrics tailored to specific business objectives.

Key takeaways:

1. **No single metric is universally best** - Choose metrics that align with your specific problem and business goals.

2. **Always use multiple metrics** - A single metric rarely tells the complete story.

3. **Consider class imbalance** - Standard accuracy can be highly misleading with imbalanced data.

4. **Use cross-validation** - Single train-test splits can be unreliable.

5. **Understand the trade-offs** - Precision vs. recall, MSE vs. MAE - know what you are optimizing for.

6. **Think about business impact** - Technical metrics should translate to real-world value.

7. **Document and reproduce** - Always document your evaluation methodology for reproducibility.

Mastering evaluation metrics enables you to build models that perform well on paper and deliver tangible value in production.
