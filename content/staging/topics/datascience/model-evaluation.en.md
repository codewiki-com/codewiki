---
title: Machine Learning Model Evaluation Guide
description: Master model evaluation for scientific validation
track: datascience
section: classical-ml
difficulty: intermediate
tags:
  - Model Evaluation
  - Cross-validation
  - Metrics
  - Overfitting
status: imported
origin: old/src/content/docs/ai/model-evaluation.en.md
divergence: 0.309
issues: []
legacy:
  category: AI
  subcategory: Machine Learning
  order: 17
  lastUpdated: 2026-01-07
---

Model evaluation is arguably the most critical phase in the machine learning workflow. A model that performs exceptionally on training data but fails in production is not only useless but potentially dangerous. This comprehensive guide explores the principles, metrics, and techniques essential for rigorous model evaluation and scientific validation.

## Fundamentals of Model Evaluation

Before diving into specific metrics and techniques, it is essential to understand why proper evaluation matters and the foundational concepts that underpin all evaluation strategies.

### Why Model Evaluation Matters

Model evaluation serves multiple critical purposes in the machine learning pipeline:

**Generalization Assessment**: The primary goal is to estimate how well a model will perform on unseen data. A model that memorizes training examples without learning underlying patterns is useless in practice.

**Model Selection**: When comparing multiple algorithms or hyperparameter configurations, proper evaluation enables objective selection of the best-performing approach.

**Risk Mitigation**: In high-stakes applications like medical diagnosis or autonomous vehicles, rigorous evaluation helps identify potential failure modes before deployment.

**Continuous Improvement**: Evaluation metrics provide feedback for iterative model improvement and help identify areas where the model underperforms.

### The Train-Test Split Paradigm

The fundamental principle of model evaluation is separating data used for training from data used for evaluation. This prevents the model from being evaluated on examples it has already seen.

```python
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.datasets import load_breast_cancer
from sklearn.ensemble import RandomForestClassifier

# Load dataset
data = load_breast_cancer()
X, y = data.data, data.target

# Basic train-test split (80% train, 20% test)
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y  # Maintain class distribution
)

# Train model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Evaluate on held-out test set
test_score = model.score(X_test, y_test)
print(f"Test Accuracy: {test_score:.4f}")
```

### The Validation Set

In practice, a two-way split is insufficient. We need a third partition, the validation set, for hyperparameter tuning and model selection:

```python
# Three-way split: train (60%), validation (20%), test (20%)
X_temp, X_test, y_temp, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
X_train, X_val, y_train, y_val = train_test_split(
    X_temp, y_temp, test_size=0.25, random_state=42, stratify=y_temp
)

print(f"Training set size: {len(X_train)}")
print(f"Validation set size: {len(X_val)}")
print(f"Test set size: {len(X_test)}")
```

The validation set is used during development for hyperparameter tuning, while the test set is reserved exclusively for final evaluation.

## Classification Metrics

Classification problems require specialized metrics that capture different aspects of model performance. Choosing the right metric depends on the specific problem and business requirements.

### Accuracy

Accuracy is the simplest and most intuitive metric: the proportion of correct predictions.

```python
from sklearn.metrics import accuracy_score

y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"Accuracy: {accuracy:.4f}")
```

**Limitations**: Accuracy can be misleading with imbalanced datasets. A model predicting the majority class for all samples can achieve high accuracy while being completely useless.

```python
# Example: Imbalanced dataset problem
import numpy as np

# 95% negative, 5% positive
y_imbalanced = np.array([0]*950 + [1]*50)
y_pred_naive = np.zeros(1000)  # Always predict negative

accuracy = accuracy_score(y_imbalanced, y_pred_naive)
print(f"Naive accuracy: {accuracy:.2f}")  # 0.95 - misleadingly high!
```

### Precision, Recall, and F1-Score

These metrics provide a more nuanced view of classification performance, especially for imbalanced problems.

**Precision**: Of all positive predictions, what proportion was actually positive?

**Recall (Sensitivity)**: Of all actual positives, what proportion was correctly identified?

**F1-Score**: The harmonic mean of precision and recall, balancing both concerns.

```python
from sklearn.metrics import precision_score, recall_score, f1_score
from sklearn.metrics import classification_report

y_pred = model.predict(X_test)

precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)

print(f"Precision: {precision:.4f}")
print(f"Recall: {recall:.4f}")
print(f"F1-Score: {f1:.4f}")

# Comprehensive classification report
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=data.target_names))
```

**Choosing Between Precision and Recall**:
- **High Precision Priority**: When false positives are costly (e.g., spam detection where legitimate emails should not be marked as spam)
- **High Recall Priority**: When false negatives are costly (e.g., cancer detection where missing a positive case is dangerous)

### The Confusion Matrix

The confusion matrix provides a complete breakdown of classification results, showing all four possible outcomes for binary classification.

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
    display_labels=data.target_names
)
disp.plot(ax=ax, cmap='Blues', values_format='d')
plt.title('Confusion Matrix')
plt.tight_layout()
plt.savefig('confusion_matrix.png', dpi=150)
plt.show()
```

**Interpreting the Confusion Matrix**:
- **True Positives (TP)**: Correctly predicted positive cases
- **True Negatives (TN)**: Correctly predicted negative cases
- **False Positives (FP)**: Incorrectly predicted as positive (Type I error)
- **False Negatives (FN)**: Incorrectly predicted as negative (Type II error)

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
    }

    metrics['f1_score'] = (
        2 * metrics['precision'] * metrics['recall'] /
        (metrics['precision'] + metrics['recall'])
        if (metrics['precision'] + metrics['recall']) > 0 else 0
    )

    return metrics

metrics = analyze_confusion_matrix(y_test, y_pred)
for name, value in metrics.items():
    print(f"{name.replace('_', ' ').title()}: {value:.4f}")
```

### ROC Curve and AUC

The Receiver Operating Characteristic (ROC) curve and Area Under the Curve (AUC) are powerful tools for evaluating classifiers, especially when comparing models or selecting probability thresholds.

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
         label='Random classifier')
plt.xlim([0.0, 1.0])
plt.ylim([0.0, 1.05])
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('Receiver Operating Characteristic (ROC) Curve')
plt.legend(loc='lower right')
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig('roc_curve.png', dpi=150)
plt.show()

print(f"AUC Score: {roc_auc:.4f}")
```

**Interpreting AUC**:
- **AUC = 1.0**: Perfect classifier
- **AUC = 0.5**: Random classifier (no discrimination ability)
- **AUC < 0.5**: Worse than random (predictions are inverted)
- **AUC > 0.7**: Generally considered acceptable
- **AUC > 0.8**: Good discrimination
- **AUC > 0.9**: Excellent discrimination

### Precision-Recall Curve

For imbalanced datasets, the Precision-Recall curve often provides more insight than the ROC curve.

```python
from sklearn.metrics import precision_recall_curve, average_precision_score

# Calculate precision-recall curve
precision_vals, recall_vals, thresholds = precision_recall_curve(y_test, y_prob)
avg_precision = average_precision_score(y_test, y_prob)

# Plot
plt.figure(figsize=(8, 6))
plt.plot(recall_vals, precision_vals, color='darkorange', lw=2,
         label=f'PR curve (AP = {avg_precision:.4f})')
plt.xlabel('Recall')
plt.ylabel('Precision')
plt.title('Precision-Recall Curve')
plt.legend(loc='lower left')
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig('precision_recall_curve.png', dpi=150)
plt.show()
```

## Regression Metrics

Regression problems require different metrics that quantify the magnitude and distribution of prediction errors.

### Mean Squared Error (MSE) and Root Mean Squared Error (RMSE)

MSE penalizes larger errors more heavily due to the squaring operation, making it sensitive to outliers.

```python
from sklearn.metrics import mean_squared_error
from sklearn.linear_model import LinearRegression
from sklearn.datasets import fetch_california_housing
import numpy as np

# Load regression dataset
housing = fetch_california_housing()
X, y = housing.data, housing.target

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train regression model
reg_model = LinearRegression()
reg_model.fit(X_train, y_train)
y_pred = reg_model.predict(X_test)

# Calculate MSE and RMSE
mse = mean_squared_error(y_test, y_pred)
rmse = np.sqrt(mse)

print(f"MSE: {mse:.4f}")
print(f"RMSE: {rmse:.4f}")
```

### Mean Absolute Error (MAE)

MAE provides a more robust measure that is less sensitive to outliers.

```python
from sklearn.metrics import mean_absolute_error

mae = mean_absolute_error(y_test, y_pred)
print(f"MAE: {mae:.4f}")
```

### R-squared (Coefficient of Determination)

R-squared indicates the proportion of variance in the target variable explained by the model.

```python
from sklearn.metrics import r2_score

r2 = r2_score(y_test, y_pred)
print(f"R-squared: {r2:.4f}")

# Adjusted R-squared (accounts for number of features)
n = len(y_test)
p = X_test.shape[1]
adj_r2 = 1 - (1 - r2) * (n - 1) / (n - p - 1)
print(f"Adjusted R-squared: {adj_r2:.4f}")
```

### Comprehensive Regression Evaluation

```python
def evaluate_regression(y_true, y_pred, X_test):
    """
    Comprehensive regression model evaluation.
    """
    from sklearn.metrics import (
        mean_squared_error, mean_absolute_error,
        r2_score, mean_absolute_percentage_error
    )

    mse = mean_squared_error(y_true, y_pred)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(y_true, y_pred)
    r2 = r2_score(y_true, y_pred)
    mape = mean_absolute_percentage_error(y_true, y_pred) * 100

    n, p = len(y_true), X_test.shape[1]
    adj_r2 = 1 - (1 - r2) * (n - 1) / (n - p - 1)

    print("Regression Metrics Summary")
    print("=" * 40)
    print(f"MSE:                {mse:.4f}")
    print(f"RMSE:               {rmse:.4f}")
    print(f"MAE:                {mae:.4f}")
    print(f"MAPE:               {mape:.2f}%")
    print(f"R-squared:          {r2:.4f}")
    print(f"Adjusted R-squared: {adj_r2:.4f}")

    return {'mse': mse, 'rmse': rmse, 'mae': mae, 'r2': r2, 'adj_r2': adj_r2}

metrics = evaluate_regression(y_test, y_pred, X_test)
```

## Cross-Validation

Cross-validation is essential for obtaining reliable performance estimates, especially with limited data. It reduces the variance in evaluation metrics by using multiple train-test splits.

### K-Fold Cross-Validation

K-Fold CV divides the data into K equal parts, training on K-1 folds and testing on the remaining fold, rotating through all combinations.

```python
from sklearn.model_selection import cross_val_score, KFold
from sklearn.ensemble import RandomForestClassifier

# Load classification data
data = load_breast_cancer()
X, y = data.data, data.target

# Define model
model = RandomForestClassifier(n_estimators=100, random_state=42)

# 5-fold cross-validation
cv_scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')

print(f"CV Scores: {cv_scores}")
print(f"Mean CV Score: {cv_scores.mean():.4f}")
print(f"Standard Deviation: {cv_scores.std():.4f}")
print(f"95% Confidence Interval: [{cv_scores.mean() - 1.96*cv_scores.std():.4f}, "
      f"{cv_scores.mean() + 1.96*cv_scores.std():.4f}]")
```

### Stratified K-Fold

For classification problems, stratified K-fold ensures each fold maintains the same class distribution as the original dataset.

```python
from sklearn.model_selection import StratifiedKFold, cross_val_score

# Stratified K-Fold
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

cv_scores = cross_val_score(model, X, y, cv=skf, scoring='f1')
print(f"Stratified CV F1 Scores: {cv_scores}")
print(f"Mean F1: {cv_scores.mean():.4f} (+/- {cv_scores.std()*2:.4f})")
```

### Leave-One-Out Cross-Validation (LOOCV)

LOOCV is an extreme case where K equals the number of samples. Each sample serves as a test set exactly once.

```python
from sklearn.model_selection import LeaveOneOut, cross_val_score

# LOOCV (computationally expensive for large datasets)
loo = LeaveOneOut()

# Using a smaller dataset for demonstration
X_small, y_small = X[:100], y[:100]

cv_scores = cross_val_score(model, X_small, y_small, cv=loo, scoring='accuracy')
print(f"LOOCV Accuracy: {cv_scores.mean():.4f}")
```

### Time Series Cross-Validation

Standard K-fold is inappropriate for time series data due to temporal dependencies. Time series CV respects the temporal order.

```python
from sklearn.model_selection import TimeSeriesSplit

# Time series cross-validation
tscv = TimeSeriesSplit(n_splits=5)

# Visualize the splits
for i, (train_idx, test_idx) in enumerate(tscv.split(X)):
    print(f"Fold {i+1}:")
    print(f"  Train: indices {train_idx[0]} to {train_idx[-1]} "
          f"(n={len(train_idx)})")
    print(f"  Test:  indices {test_idx[0]} to {test_idx[-1]} "
          f"(n={len(test_idx)})")
```

### Nested Cross-Validation

For unbiased evaluation when performing hyperparameter tuning, nested CV uses an outer loop for evaluation and an inner loop for tuning.

```python
from sklearn.model_selection import cross_val_score, GridSearchCV

# Define parameter grid
param_grid = {
    'n_estimators': [50, 100, 200],
    'max_depth': [5, 10, None],
    'min_samples_split': [2, 5, 10]
}

# Inner CV for hyperparameter tuning
inner_cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
grid_search = GridSearchCV(
    RandomForestClassifier(random_state=42),
    param_grid,
    cv=inner_cv,
    scoring='f1',
    n_jobs=-1
)

# Outer CV for unbiased performance estimation
outer_cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
nested_scores = cross_val_score(grid_search, X, y, cv=outer_cv, scoring='f1')

print(f"Nested CV F1 Scores: {nested_scores}")
print(f"Mean Nested CV F1: {nested_scores.mean():.4f} (+/- {nested_scores.std()*2:.4f})")
```

## Overfitting and Underfitting Detection

Understanding and detecting overfitting is crucial for building models that generalize well to new data.

### Understanding the Bias-Variance Tradeoff

**Underfitting (High Bias)**: The model is too simple to capture the underlying patterns.
- Symptoms: Poor performance on both training and test data
- Solutions: Use more complex models, add features, reduce regularization

**Overfitting (High Variance)**: The model memorizes training data including noise.
- Symptoms: Excellent training performance, poor test performance
- Solutions: Regularization, more data, simpler models, early stopping

### Learning Curves

Learning curves visualize model performance as a function of training set size, helping diagnose underfitting and overfitting.

```python
from sklearn.model_selection import learning_curve
import matplotlib.pyplot as plt
import numpy as np

def plot_learning_curve(estimator, X, y, title="Learning Curve"):
    """
    Generate and plot learning curves.
    """
    train_sizes, train_scores, val_scores = learning_curve(
        estimator, X, y,
        train_sizes=np.linspace(0.1, 1.0, 10),
        cv=5,
        scoring='accuracy',
        n_jobs=-1,
        random_state=42
    )

    train_mean = train_scores.mean(axis=1)
    train_std = train_scores.std(axis=1)
    val_mean = val_scores.mean(axis=1)
    val_std = val_scores.std(axis=1)

    plt.figure(figsize=(10, 6))

    # Plot training scores
    plt.plot(train_sizes, train_mean, 'o-', color='blue',
             label='Training score')
    plt.fill_between(train_sizes, train_mean - train_std,
                     train_mean + train_std, alpha=0.1, color='blue')

    # Plot validation scores
    plt.plot(train_sizes, val_mean, 'o-', color='orange',
             label='Cross-validation score')
    plt.fill_between(train_sizes, val_mean - val_std,
                     val_mean + val_std, alpha=0.1, color='orange')

    plt.xlabel('Training Set Size')
    plt.ylabel('Accuracy Score')
    plt.title(title)
    plt.legend(loc='lower right')
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig('learning_curve.png', dpi=150)
    plt.show()

    return train_sizes, train_mean, val_mean

# Example usage
model = RandomForestClassifier(n_estimators=100, random_state=42)
plot_learning_curve(model, X, y, "Random Forest Learning Curve")
```

**Interpreting Learning Curves**:
- **Converging curves with gap**: Normal behavior, may benefit from more data
- **Large persistent gap**: Overfitting - consider regularization
- **Both curves plateau low**: Underfitting - use more complex model
- **High variance in validation**: Insufficient data or unstable model

### Validation Curves

Validation curves show how model performance varies with a specific hyperparameter.

```python
from sklearn.model_selection import validation_curve

def plot_validation_curve(estimator, X, y, param_name, param_range, title):
    """
    Generate and plot validation curves.
    """
    train_scores, val_scores = validation_curve(
        estimator, X, y,
        param_name=param_name,
        param_range=param_range,
        cv=5,
        scoring='accuracy',
        n_jobs=-1
    )

    train_mean = train_scores.mean(axis=1)
    train_std = train_scores.std(axis=1)
    val_mean = val_scores.mean(axis=1)
    val_std = val_scores.std(axis=1)

    plt.figure(figsize=(10, 6))

    plt.semilogx(param_range, train_mean, 'o-', color='blue',
                 label='Training score')
    plt.fill_between(param_range, train_mean - train_std,
                     train_mean + train_std, alpha=0.1, color='blue')

    plt.semilogx(param_range, val_mean, 'o-', color='orange',
                 label='Cross-validation score')
    plt.fill_between(param_range, val_mean - val_std,
                     val_mean + val_std, alpha=0.1, color='orange')

    plt.xlabel(param_name)
    plt.ylabel('Accuracy Score')
    plt.title(title)
    plt.legend(loc='best')
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig('validation_curve.png', dpi=150)
    plt.show()

# Example: Varying max_depth
param_range = [1, 2, 3, 5, 7, 10, 15, 20, None]
plot_validation_curve(
    RandomForestClassifier(n_estimators=100, random_state=42),
    X, y,
    param_name='max_depth',
    param_range=[1, 2, 3, 5, 7, 10, 15, 20],
    title='Validation Curve: max_depth'
)
```

### Early Stopping

Early stopping prevents overfitting by monitoring validation performance during training and stopping when it begins to degrade.

```python
from sklearn.ensemble import GradientBoostingClassifier
import numpy as np

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Gradient Boosting with early stopping
gb_model = GradientBoostingClassifier(
    n_estimators=500,
    validation_fraction=0.2,
    n_iter_no_change=10,  # Early stopping patience
    tol=1e-4,
    random_state=42,
    verbose=1
)

gb_model.fit(X_train, y_train)

print(f"\nStopped at iteration: {gb_model.n_estimators_}")
print(f"Test Accuracy: {gb_model.score(X_test, y_test):.4f}")
```

### Regularization Techniques

Regularization adds constraints to prevent overfitting.

```python
from sklearn.linear_model import Ridge, Lasso, ElasticNet
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

# Create pipelines with regularization
models = {
    'Ridge (L2)': Pipeline([
        ('scaler', StandardScaler()),
        ('model', Ridge(alpha=1.0))
    ]),
    'Lasso (L1)': Pipeline([
        ('scaler', StandardScaler()),
        ('model', Lasso(alpha=0.1))
    ]),
    'ElasticNet': Pipeline([
        ('scaler', StandardScaler()),
        ('model', ElasticNet(alpha=0.1, l1_ratio=0.5))
    ])
}

# Load regression data
housing = fetch_california_housing()
X, y = housing.data, housing.target
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Evaluate each model
for name, model in models.items():
    model.fit(X_train, y_train)
    train_score = model.score(X_train, y_train)
    test_score = model.score(X_test, y_test)
    print(f"{name}:")
    print(f"  Train R2: {train_score:.4f}")
    print(f"  Test R2:  {test_score:.4f}")
    print(f"  Gap:      {train_score - test_score:.4f}")
```

## Advanced Evaluation Techniques

### Multi-class Evaluation

For multi-class problems, metrics need to be aggregated across classes.

```python
from sklearn.datasets import load_iris
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.ensemble import RandomForestClassifier

# Load multi-class dataset
iris = load_iris()
X, y = iris.data, iris.target

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)
y_pred = model.predict(X_test)

# Classification report with multiple averaging strategies
print("Classification Report:")
print(classification_report(y_test, y_pred, target_names=iris.target_names))

# Multi-class confusion matrix
cm = confusion_matrix(y_test, y_pred)
print("\nConfusion Matrix:")
print(cm)
```

### Probability Calibration

Well-calibrated probabilities are essential for decision-making based on prediction confidence.

```python
from sklearn.calibration import calibration_curve, CalibratedClassifierCV
import matplotlib.pyplot as plt

def plot_calibration_curve(y_true, y_prob, n_bins=10, title="Calibration Curve"):
    """
    Plot reliability diagram for probability calibration.
    """
    fraction_of_positives, mean_predicted_value = calibration_curve(
        y_true, y_prob, n_bins=n_bins
    )

    plt.figure(figsize=(8, 6))
    plt.plot([0, 1], [0, 1], 'k--', label='Perfectly calibrated')
    plt.plot(mean_predicted_value, fraction_of_positives, 's-',
             label='Model')
    plt.xlabel('Mean Predicted Probability')
    plt.ylabel('Fraction of Positives')
    plt.title(title)
    plt.legend(loc='lower right')
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig('calibration_curve.png', dpi=150)
    plt.show()

# Example with breast cancer dataset
data = load_breast_cancer()
X, y = data.data, data.target
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)
y_prob = model.predict_proba(X_test)[:, 1]

plot_calibration_curve(y_test, y_prob, title="Random Forest Calibration")
```

### Statistical Significance Testing

When comparing models, statistical tests help determine if performance differences are significant.

```python
from scipy import stats
import numpy as np

def compare_models_statistically(scores1, scores2, alpha=0.05):
    """
    Perform paired t-test to compare two sets of CV scores.
    """
    # Paired t-test
    t_stat, p_value = stats.ttest_rel(scores1, scores2)

    # Effect size (Cohen's d)
    diff = np.array(scores1) - np.array(scores2)
    cohens_d = diff.mean() / diff.std()

    print("Statistical Comparison")
    print("=" * 40)
    print(f"Model 1 Mean: {np.mean(scores1):.4f} (+/- {np.std(scores1):.4f})")
    print(f"Model 2 Mean: {np.mean(scores2):.4f} (+/- {np.std(scores2):.4f})")
    print(f"Difference:   {np.mean(diff):.4f}")
    print(f"t-statistic:  {t_stat:.4f}")
    print(f"p-value:      {p_value:.4f}")
    print(f"Cohen's d:    {cohens_d:.4f}")

    if p_value < alpha:
        print(f"\nConclusion: Difference is statistically significant (p < {alpha})")
    else:
        print(f"\nConclusion: Difference is NOT statistically significant (p >= {alpha})")

# Compare two models
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier

model1 = RandomForestClassifier(n_estimators=100, random_state=42)
model2 = GradientBoostingClassifier(n_estimators=100, random_state=42)

scores1 = cross_val_score(model1, X, y, cv=10, scoring='accuracy')
scores2 = cross_val_score(model2, X, y, cv=10, scoring='accuracy')

compare_models_statistically(scores1, scores2)
```

## Best Practices for Model Evaluation

### Evaluation Checklist

Follow this checklist to ensure rigorous evaluation:

```python
def comprehensive_evaluation(model, X, y, cv=5):
    """
    Comprehensive model evaluation pipeline.
    """
    from sklearn.model_selection import cross_validate

    # Define multiple scoring metrics
    scoring = {
        'accuracy': 'accuracy',
        'precision': 'precision_weighted',
        'recall': 'recall_weighted',
        'f1': 'f1_weighted',
        'roc_auc': 'roc_auc'
    }

    # Perform cross-validation with multiple metrics
    cv_results = cross_validate(
        model, X, y,
        cv=cv,
        scoring=scoring,
        return_train_score=True,
        n_jobs=-1
    )

    print("Comprehensive Evaluation Results")
    print("=" * 60)

    for metric in scoring.keys():
        train_key = f'train_{metric}'
        test_key = f'test_{metric}'

        train_mean = cv_results[train_key].mean()
        train_std = cv_results[train_key].std()
        test_mean = cv_results[test_key].mean()
        test_std = cv_results[test_key].std()
        gap = train_mean - test_mean

        print(f"\n{metric.upper()}:")
        print(f"  Train: {train_mean:.4f} (+/- {train_std:.4f})")
        print(f"  Test:  {test_mean:.4f} (+/- {test_std:.4f})")
        print(f"  Gap:   {gap:.4f} {'(potential overfitting)' if gap > 0.05 else ''}")

    return cv_results

# Example usage
data = load_breast_cancer()
X, y = data.data, data.target
model = RandomForestClassifier(n_estimators=100, random_state=42)

results = comprehensive_evaluation(model, X, y)
```

### Common Pitfalls to Avoid

1. **Data Leakage**: Never use test data for any training decisions
2. **Cherry-picking**: Report all metrics, not just favorable ones
3. **Ignoring Class Imbalance**: Use appropriate metrics and sampling strategies
4. **Single Train-Test Split**: Always use cross-validation for reliable estimates
5. **Overfitting to Validation Set**: Use nested CV when tuning hyperparameters

### Documentation and Reproducibility

Always document your evaluation setup for reproducibility:

```python
import json
from datetime import datetime

def document_experiment(model, X, y, cv_results, filename='experiment_log.json'):
    """
    Document experiment setup and results.
    """
    experiment = {
        'timestamp': datetime.now().isoformat(),
        'model': str(model),
        'model_params': model.get_params(),
        'dataset_shape': X.shape,
        'class_distribution': dict(zip(*np.unique(y, return_counts=True))),
        'cv_folds': 5,
        'results': {
            key: {
                'mean': float(values.mean()),
                'std': float(values.std()),
                'values': values.tolist()
            }
            for key, values in cv_results.items()
            if isinstance(values, np.ndarray)
        }
    }

    with open(filename, 'w') as f:
        json.dump(experiment, f, indent=2, default=str)

    print(f"Experiment documented to {filename}")
    return experiment

# Document your experiment
experiment = document_experiment(model, X, y, results)
```

## Conclusion

Model evaluation is a critical discipline that separates successful machine learning projects from failures. Key takeaways include:

1. **Never trust training performance alone** - Always evaluate on held-out data
2. **Choose metrics that align with business objectives** - Accuracy is not always appropriate
3. **Use cross-validation for reliable estimates** - Single splits can be misleading
4. **Monitor for overfitting continuously** - Use learning curves and validation curves
5. **Document everything** - Reproducibility is essential for scientific validity

By following the principles and techniques outlined in this guide, you can build machine learning models that perform well in development and deliver value in production. Remember that model evaluation is not a one-time activity but an ongoing process that continues throughout the model's lifecycle.
