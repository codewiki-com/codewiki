---
title: "Feature Engineering: Feature Selection Methods"
description: "Master three feature selection approaches: filter, wrapper, and embedded methods"
track: datascience
section: classical-ml
difficulty: intermediate
tags:
  - feature selection
  - feature engineering
  - filter method
  - embedded method
status: imported
origin: old/src/content/docs/datascience/feature-selection.en.md
divergence: 0.242
issues:
  - title-lang-zh
  - title-language
legacy:
  category: DataScience
  subcategory: FeatureEngineering
  order: 9
  lastUpdated: 2026-01-07
---

Feature selection is a critical step in the machine learning pipeline that involves identifying and selecting the most relevant features from your dataset. By removing irrelevant, redundant, or noisy features, you can improve model performance, reduce training time, enhance interpretability, and prevent overfitting. We'll provide a comprehensive overview of feature selection methods with practical Scikit-learn implementations.

## Why Feature Selection Matters

Feature selection addresses several fundamental challenges in machine learning:

### The Curse of Dimensionality

As the number of features increases, the amount of data needed to generalize accurately grows exponentially. This phenomenon, known as the curse of dimensionality, leads to:

- **Sparse data**: Data points become increasingly spread out in high-dimensional space
- **Overfitting**: Models memorize noise rather than learning patterns
- **Computational burden**: Training time increases significantly with more features

### Benefits of Feature Selection

| Benefit | Description |
|---------|-------------|
| Improved accuracy | Removing noise helps models focus on relevant patterns |
| Reduced overfitting | Fewer features mean less chance of memorizing training data |
| Faster training | Smaller feature space requires less computation |
| Better interpretability | Easier to understand model decisions with fewer features |
| Lower storage | Reduced memory requirements for datasets and models |
| Simpler deployment | Models with fewer features are easier to maintain |

### Feature Selection vs Dimensionality Reduction

While both techniques reduce the number of input variables, they differ fundamentally:

```python
import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.feature_selection import SelectKBest, f_classif

# Generate sample data
np.random.seed(42)
X = np.random.randn(100, 10)
y = (X[:, 0] + X[:, 1] > 0).astype(int)

# Feature Selection: Keeps original features
selector = SelectKBest(score_func=f_classif, k=3)
X_selected = selector.fit_transform(X, y)
print(f"Feature Selection - Shape: {X_selected.shape}")
print(f"Selected feature indices: {selector.get_support(indices=True)}")

# Dimensionality Reduction: Creates new features
pca = PCA(n_components=3)
X_pca = pca.fit_transform(X)
print(f"\nPCA - Shape: {X_pca.shape}")
print(f"Explained variance: {pca.explained_variance_ratio_}")
```

**Key differences:**
- Feature selection preserves original features and their interpretability
- Dimensionality reduction creates new composite features
- Feature selection is preferred when interpretability is important

## Filter Methods

Filter methods evaluate features independently of any machine learning algorithm. They use statistical measures to score and rank features, then select the top-k features based on these scores.

### Variance Threshold

The simplest filter method removes features with low variance. Features with little variation provide minimal information for distinguishing between samples.

```python
from sklearn.feature_selection import VarianceThreshold
import pandas as pd
import numpy as np

# Create sample data with varying variance
np.random.seed(42)
df = pd.DataFrame({
    'constant': [1] * 100,                      # Zero variance
    'low_var': np.random.choice([0, 1], 100, p=[0.99, 0.01]),  # Very low variance
    'medium_var': np.random.randn(100) * 0.5,   # Medium variance
    'high_var': np.random.randn(100) * 2,       # High variance
    'categorical': np.random.randint(0, 10, 100)  # Discrete values
})

print("Feature variances:")
print(df.var())

# Remove features with variance below threshold
selector = VarianceThreshold(threshold=0.1)
X_selected = selector.fit_transform(df)

selected_features = df.columns[selector.get_support()].tolist()
print(f"\nSelected features: {selected_features}")
print(f"Removed features: {[col for col in df.columns if col not in selected_features]}")
```

**When to use:**
- As a preprocessing step to quickly remove obviously uninformative features
- For binary features, use threshold based on `p(1-p)` where p is the proportion of ones
- Set threshold to 0 to remove only constant features

### Correlation-Based Selection

Highly correlated features provide redundant information. Removing one feature from each highly correlated pair can reduce multicollinearity and improve model stability.

```python
import numpy as np
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt

def correlation_filter(X, threshold=0.9):
    """
    Remove features that are highly correlated with each other.

    Parameters:
    -----------
    X : DataFrame
        Feature matrix
    threshold : float
        Correlation threshold above which features are considered redundant

    Returns:
    --------
    DataFrame with reduced features, list of dropped features
    """
    # Calculate correlation matrix
    corr_matrix = X.corr().abs()

    # Create upper triangle mask
    upper_tri = corr_matrix.where(
        np.triu(np.ones(corr_matrix.shape), k=1).astype(bool)
    )

    # Find features with correlation above threshold
    to_drop = [column for column in upper_tri.columns
               if any(upper_tri[column] > threshold)]

    return X.drop(columns=to_drop), to_drop

# Example usage
np.random.seed(42)
X = pd.DataFrame({
    'feature_1': np.random.randn(100),
    'feature_2': np.random.randn(100),
    'feature_3': np.random.randn(100),
})
# Add correlated features
X['feature_1_copy'] = X['feature_1'] + np.random.randn(100) * 0.1
X['feature_2_copy'] = X['feature_2'] + np.random.randn(100) * 0.05

print("Original correlation matrix:")
print(X.corr().round(3))

X_reduced, dropped = correlation_filter(X, threshold=0.9)
print(f"\nDropped features: {dropped}")
print(f"Remaining features: {X_reduced.columns.tolist()}")
```

**Target correlation selection:**

```python
def select_by_target_correlation(X, y, k=5, method='pearson'):
    """
    Select top k features most correlated with the target.

    Parameters:
    -----------
    X : DataFrame
        Feature matrix
    y : Series or array
        Target variable
    k : int
        Number of features to select
    method : str
        Correlation method ('pearson', 'spearman', 'kendall')
    """
    correlations = pd.DataFrame({
        'feature': X.columns,
        'correlation': [X[col].corr(pd.Series(y), method=method)
                       for col in X.columns]
    })
    correlations['abs_correlation'] = correlations['correlation'].abs()
    correlations = correlations.sort_values('abs_correlation', ascending=False)

    top_features = correlations.head(k)['feature'].tolist()

    return X[top_features], correlations

# Example
y = X['feature_1'] * 2 + np.random.randn(100) * 0.5
X_selected, corr_scores = select_by_target_correlation(X, y, k=3)
print("\nCorrelation with target:")
print(corr_scores)
```

### Mutual Information

Mutual information measures the dependency between two variables, capturing both linear and non-linear relationships. Unlike correlation, it can detect complex patterns.

```python
from sklearn.feature_selection import mutual_info_classif, mutual_info_regression
from sklearn.feature_selection import SelectKBest
import numpy as np
import pandas as pd

def mutual_information_selection(X, y, task='classification', k=5):
    """
    Select features using mutual information scores.

    Parameters:
    -----------
    X : DataFrame or array
        Feature matrix
    y : array
        Target variable
    task : str
        'classification' or 'regression'
    k : int
        Number of features to select
    """
    # Choose appropriate scoring function
    if task == 'classification':
        mi_func = mutual_info_classif
    else:
        mi_func = mutual_info_regression

    # Calculate mutual information scores
    mi_scores = mi_func(X, y, random_state=42)

    # Create results DataFrame
    if isinstance(X, pd.DataFrame):
        feature_names = X.columns
    else:
        feature_names = [f'feature_{i}' for i in range(X.shape[1])]

    results = pd.DataFrame({
        'feature': feature_names,
        'mi_score': mi_scores
    }).sort_values('mi_score', ascending=False)

    # Select top k features
    selector = SelectKBest(score_func=mi_func, k=k)
    X_selected = selector.fit_transform(X, y)
    selected_features = np.array(feature_names)[selector.get_support()]

    return X_selected, results, selected_features

# Example with non-linear relationship
np.random.seed(42)
X = pd.DataFrame({
    'linear': np.random.randn(500),
    'quadratic': np.random.randn(500),
    'sinusoidal': np.random.randn(500),
    'noise1': np.random.randn(500),
    'noise2': np.random.randn(500),
})

# Create target with different relationships
y = (X['linear'] + X['quadratic']**2 + np.sin(X['sinusoidal'] * 2) > 1).astype(int)

X_selected, mi_results, selected = mutual_information_selection(X, y, k=3)
print("Mutual Information Scores:")
print(mi_results)
print(f"\nSelected features: {selected}")
```

### Statistical Tests

Different statistical tests are appropriate for different data types and tasks:

```python
from sklearn.feature_selection import (
    SelectKBest, chi2, f_classif, f_regression
)
from scipy import stats
import numpy as np
import pandas as pd

class StatisticalFeatureSelector:
    """
    Feature selection using various statistical tests.
    """

    def __init__(self, task='classification'):
        self.task = task

    def select_with_anova(self, X, y, k=5):
        """
        ANOVA F-test for numerical features and categorical target.
        Tests whether the means of groups defined by the target are equal.
        """
        selector = SelectKBest(score_func=f_classif, k=k)
        X_selected = selector.fit_transform(X, y)

        results = pd.DataFrame({
            'feature': X.columns if isinstance(X, pd.DataFrame) else range(X.shape[1]),
            'f_score': selector.scores_,
            'p_value': selector.pvalues_
        }).sort_values('f_score', ascending=False)

        return X_selected, results

    def select_with_chi2(self, X, y, k=5):
        """
        Chi-squared test for non-negative categorical features.
        Tests independence between feature and target.
        """
        # Chi-squared requires non-negative values
        X_positive = X - X.min() if (X < 0).any().any() else X

        selector = SelectKBest(score_func=chi2, k=k)
        X_selected = selector.fit_transform(X_positive, y)

        results = pd.DataFrame({
            'feature': X.columns if isinstance(X, pd.DataFrame) else range(X.shape[1]),
            'chi2_score': selector.scores_,
            'p_value': selector.pvalues_
        }).sort_values('chi2_score', ascending=False)

        return X_selected, results

    def select_with_f_regression(self, X, y, k=5):
        """
        F-test for numerical features and continuous target.
        Tests linear relationship between each feature and target.
        """
        selector = SelectKBest(score_func=f_regression, k=k)
        X_selected = selector.fit_transform(X, y)

        results = pd.DataFrame({
            'feature': X.columns if isinstance(X, pd.DataFrame) else range(X.shape[1]),
            'f_score': selector.scores_,
            'p_value': selector.pvalues_
        }).sort_values('f_score', ascending=False)

        return X_selected, results

# Example usage
np.random.seed(42)
X = pd.DataFrame(np.random.randn(200, 8),
                 columns=[f'feature_{i}' for i in range(8)])
y_class = (X['feature_0'] + X['feature_1'] > 0).astype(int)
y_reg = X['feature_0'] * 2 + X['feature_1'] * 0.5 + np.random.randn(200) * 0.1

selector = StatisticalFeatureSelector()

# ANOVA for classification
_, anova_results = selector.select_with_anova(X, y_class, k=3)
print("ANOVA F-test results:")
print(anova_results.head())

# F-regression for regression
_, freg_results = selector.select_with_f_regression(X, y_reg, k=3)
print("\nF-regression results:")
print(freg_results.head())
```

### Complete Filter Methods Pipeline

```python
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.feature_selection import VarianceThreshold, SelectKBest, mutual_info_classif
import numpy as np
import pandas as pd

class FilterMethodPipeline(BaseEstimator, TransformerMixin):
    """
    Combined filter method feature selection pipeline.
    """

    def __init__(self, variance_threshold=0.01, correlation_threshold=0.9,
                 k_best=10, score_func=mutual_info_classif):
        self.variance_threshold = variance_threshold
        self.correlation_threshold = correlation_threshold
        self.k_best = k_best
        self.score_func = score_func

        self.variance_selector_ = None
        self.correlation_drops_ = None
        self.kbest_selector_ = None
        self.feature_names_ = None

    def fit(self, X, y=None):
        X = pd.DataFrame(X) if not isinstance(X, pd.DataFrame) else X.copy()
        self.feature_names_ = X.columns.tolist()

        # Step 1: Variance threshold
        self.variance_selector_ = VarianceThreshold(threshold=self.variance_threshold)
        X_var = pd.DataFrame(
            self.variance_selector_.fit_transform(X),
            columns=X.columns[self.variance_selector_.get_support()]
        )

        # Step 2: Correlation filter
        corr_matrix = X_var.corr().abs()
        upper_tri = corr_matrix.where(
            np.triu(np.ones(corr_matrix.shape), k=1).astype(bool)
        )
        self.correlation_drops_ = [col for col in upper_tri.columns
                                   if any(upper_tri[col] > self.correlation_threshold)]
        X_corr = X_var.drop(columns=self.correlation_drops_)

        # Step 3: SelectKBest
        k = min(self.k_best, X_corr.shape[1])
        self.kbest_selector_ = SelectKBest(score_func=self.score_func, k=k)
        self.kbest_selector_.fit(X_corr, y)

        self.selected_features_ = X_corr.columns[self.kbest_selector_.get_support()].tolist()

        return self

    def transform(self, X):
        X = pd.DataFrame(X) if not isinstance(X, pd.DataFrame) else X.copy()

        # Apply variance threshold
        X_var = pd.DataFrame(
            self.variance_selector_.transform(X),
            columns=[col for i, col in enumerate(self.feature_names_)
                    if self.variance_selector_.get_support()[i]]
        )

        # Apply correlation filter
        X_corr = X_var.drop(columns=self.correlation_drops_, errors='ignore')

        # Apply SelectKBest
        X_selected = self.kbest_selector_.transform(X_corr)

        return X_selected

    def get_support(self):
        return self.selected_features_

# Example usage
np.random.seed(42)
X = pd.DataFrame(np.random.randn(300, 20),
                 columns=[f'feature_{i}' for i in range(20)])
X['constant'] = 1  # Will be removed by variance threshold
X['feature_0_dup'] = X['feature_0'] + np.random.randn(300) * 0.01  # Highly correlated

y = (X['feature_0'] + X['feature_1'] - X['feature_2'] > 0).astype(int)

pipeline = FilterMethodPipeline(
    variance_threshold=0.01,
    correlation_threshold=0.95,
    k_best=5
)
X_filtered = pipeline.fit_transform(X, y)

print(f"Original features: {X.shape[1]}")
print(f"Selected features: {X_filtered.shape[1]}")
print(f"Selected feature names: {pipeline.get_support()}")
```

## Wrapper Methods

Wrapper methods use a machine learning model to evaluate feature subsets. They search through different combinations of features and select the subset that produces the best model performance.

### Recursive Feature Elimination (RFE)

RFE recursively removes the least important features based on model coefficients or feature importances.

```python
from sklearn.feature_selection import RFE, RFECV
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold
import numpy as np
import pandas as pd

class RFESelector:
    """
    Feature selection using Recursive Feature Elimination.
    """

    def __init__(self, estimator=None, n_features_to_select=5, step=1):
        self.estimator = estimator or LogisticRegression(max_iter=1000)
        self.n_features_to_select = n_features_to_select
        self.step = step
        self.rfe_ = None

    def fit_rfe(self, X, y):
        """
        Apply basic RFE with specified number of features.
        """
        self.rfe_ = RFE(
            estimator=self.estimator,
            n_features_to_select=self.n_features_to_select,
            step=self.step
        )
        self.rfe_.fit(X, y)

        # Create ranking DataFrame
        if isinstance(X, pd.DataFrame):
            feature_names = X.columns
        else:
            feature_names = [f'feature_{i}' for i in range(X.shape[1])]

        rankings = pd.DataFrame({
            'feature': feature_names,
            'ranking': self.rfe_.ranking_,
            'selected': self.rfe_.support_
        }).sort_values('ranking')

        return self.rfe_.transform(X), rankings

    def fit_rfecv(self, X, y, cv=5, scoring='accuracy'):
        """
        Apply RFE with cross-validation to find optimal number of features.
        """
        rfecv = RFECV(
            estimator=self.estimator,
            step=self.step,
            cv=StratifiedKFold(cv),
            scoring=scoring,
            n_jobs=-1
        )
        rfecv.fit(X, y)

        print(f"Optimal number of features: {rfecv.n_features_}")

        if isinstance(X, pd.DataFrame):
            feature_names = X.columns
        else:
            feature_names = [f'feature_{i}' for i in range(X.shape[1])]

        rankings = pd.DataFrame({
            'feature': feature_names,
            'ranking': rfecv.ranking_,
            'selected': rfecv.support_
        }).sort_values('ranking')

        # Cross-validation scores
        cv_results = pd.DataFrame({
            'n_features': range(1, len(rfecv.cv_results_['mean_test_score']) + 1),
            'mean_score': rfecv.cv_results_['mean_test_score'],
            'std_score': rfecv.cv_results_['std_test_score']
        })

        return rfecv.transform(X), rankings, cv_results

    def transform(self, X):
        return self.rfe_.transform(X)

# Example usage
np.random.seed(42)
n_samples, n_features = 500, 20
X = pd.DataFrame(
    np.random.randn(n_samples, n_features),
    columns=[f'feature_{i}' for i in range(n_features)]
)

# Create target with only some features being relevant
y = (2 * X['feature_0'] + 1.5 * X['feature_1'] - X['feature_2'] +
     0.5 * X['feature_3'] + np.random.randn(n_samples) * 0.1 > 0).astype(int)

# Using Random Forest as base estimator
selector = RFESelector(
    estimator=RandomForestClassifier(n_estimators=100, random_state=42),
    n_features_to_select=5
)

X_selected, rankings = selector.fit_rfe(X, y)
print("Feature Rankings:")
print(rankings.head(10))
print(f"\nSelected features shape: {X_selected.shape}")

# With cross-validation
selector_cv = RFESelector(
    estimator=RandomForestClassifier(n_estimators=100, random_state=42)
)
X_selected_cv, rankings_cv, cv_results = selector_cv.fit_rfecv(X, y, cv=5)
print("\nCross-validation results:")
print(cv_results.head(10))
```

### Sequential Feature Selection

Sequential Feature Selection adds or removes features one at a time based on cross-validation performance.

```python
from sklearn.feature_selection import SequentialFeatureSelector
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score
import numpy as np
import pandas as pd

class SequentialSelector:
    """
    Forward and Backward Sequential Feature Selection.
    """

    def __init__(self, estimator=None, n_features_to_select='auto',
                 direction='forward', cv=5, scoring='accuracy'):
        self.estimator = estimator or RandomForestClassifier(n_estimators=100, random_state=42)
        self.n_features_to_select = n_features_to_select
        self.direction = direction
        self.cv = cv
        self.scoring = scoring
        self.selector_ = None

    def fit_transform(self, X, y):
        """
        Fit the selector and transform the data.
        """
        self.selector_ = SequentialFeatureSelector(
            estimator=self.estimator,
            n_features_to_select=self.n_features_to_select,
            direction=self.direction,
            cv=self.cv,
            scoring=self.scoring,
            n_jobs=-1
        )

        X_selected = self.selector_.fit_transform(X, y)

        if isinstance(X, pd.DataFrame):
            selected_features = X.columns[self.selector_.get_support()].tolist()
        else:
            selected_features = list(np.where(self.selector_.get_support())[0])

        return X_selected, selected_features

    def transform(self, X):
        return self.selector_.transform(X)

def compare_selection_directions(X, y, estimator, n_features=5):
    """
    Compare forward and backward selection strategies.
    """
    results = {}

    for direction in ['forward', 'backward']:
        selector = SequentialSelector(
            estimator=estimator,
            n_features_to_select=n_features,
            direction=direction,
            cv=5
        )
        X_selected, features = selector.fit_transform(X, y)

        # Evaluate with cross-validation
        cv_scores = cross_val_score(estimator, X_selected, y, cv=5)

        results[direction] = {
            'features': features,
            'mean_cv_score': cv_scores.mean(),
            'std_cv_score': cv_scores.std()
        }

    return results

# Example usage
np.random.seed(42)
X = pd.DataFrame(
    np.random.randn(300, 15),
    columns=[f'feature_{i}' for i in range(15)]
)
y = (X['feature_0'] + X['feature_1'] - X['feature_2'] > 0).astype(int)

# Compare forward and backward selection
comparison = compare_selection_directions(
    X, y,
    LogisticRegression(max_iter=1000),
    n_features=5
)

for direction, result in comparison.items():
    print(f"\n{direction.upper()} Selection:")
    print(f"  Selected features: {result['features']}")
    print(f"  CV Score: {result['mean_cv_score']:.4f} (+/- {result['std_cv_score']:.4f})")
```

### Exhaustive Feature Selection

For small feature sets, exhaustive search evaluates all possible combinations.

```python
from itertools import combinations
from sklearn.model_selection import cross_val_score
from sklearn.linear_model import LogisticRegression
import numpy as np
import pandas as pd
from concurrent.futures import ProcessPoolExecutor

def exhaustive_feature_selection(X, y, estimator, min_features=1, max_features=None,
                                 cv=5, scoring='accuracy', n_jobs=-1):
    """
    Exhaustive search over all feature subsets.

    Warning: Computationally expensive for large feature sets!
    Time complexity: O(2^n) where n is the number of features.
    """
    if isinstance(X, pd.DataFrame):
        feature_names = X.columns.tolist()
        X_array = X.values
    else:
        feature_names = list(range(X.shape[1]))
        X_array = X

    n_features = len(feature_names)
    max_features = max_features or n_features

    results = []

    for k in range(min_features, max_features + 1):
        for feature_subset in combinations(range(n_features), k):
            X_subset = X_array[:, feature_subset]
            cv_scores = cross_val_score(estimator, X_subset, y, cv=cv, scoring=scoring)

            results.append({
                'features': [feature_names[i] for i in feature_subset],
                'n_features': k,
                'mean_score': cv_scores.mean(),
                'std_score': cv_scores.std()
            })

    results_df = pd.DataFrame(results).sort_values('mean_score', ascending=False)

    return results_df

# Example with small feature set
np.random.seed(42)
X = pd.DataFrame(
    np.random.randn(200, 6),  # Only 6 features for exhaustive search
    columns=['A', 'B', 'C', 'D', 'E', 'F']
)
y = (X['A'] + X['B'] > 0).astype(int)

print("Running exhaustive feature selection...")
results = exhaustive_feature_selection(
    X, y,
    LogisticRegression(max_iter=1000),
    min_features=1,
    max_features=4,
    cv=5
)

print("\nTop 10 feature combinations:")
print(results.head(10))
```

## Embedded Methods

Embedded methods perform feature selection as part of the model training process. They combine the advantages of filter and wrapper methods while being computationally efficient.

### L1 Regularization (Lasso)

L1 regularization drives feature coefficients to exactly zero, effectively performing feature selection.

```python
from sklearn.linear_model import Lasso, LassoCV, LogisticRegression
from sklearn.preprocessing import StandardScaler
import numpy as np
import pandas as pd

class LassoFeatureSelector:
    """
    Feature selection using L1 (Lasso) regularization.
    """

    def __init__(self, task='regression', cv=5, max_iter=10000):
        self.task = task
        self.cv = cv
        self.max_iter = max_iter
        self.model_ = None
        self.scaler_ = StandardScaler()

    def fit(self, X, y):
        """
        Fit Lasso model with cross-validation to find optimal alpha.
        """
        X_scaled = self.scaler_.fit_transform(X)

        if self.task == 'regression':
            self.model_ = LassoCV(cv=self.cv, max_iter=self.max_iter, random_state=42)
        else:
            # For classification, use LogisticRegression with L1
            from sklearn.linear_model import LogisticRegressionCV
            self.model_ = LogisticRegressionCV(
                penalty='l1',
                solver='saga',
                cv=self.cv,
                max_iter=self.max_iter,
                random_state=42
            )

        self.model_.fit(X_scaled, y)

        return self

    def get_feature_importance(self, feature_names=None):
        """
        Get feature coefficients and selection status.
        """
        if self.task == 'regression':
            coefs = self.model_.coef_
        else:
            coefs = self.model_.coef_.ravel()

        if feature_names is None:
            feature_names = [f'feature_{i}' for i in range(len(coefs))]

        importance = pd.DataFrame({
            'feature': feature_names,
            'coefficient': coefs,
            'abs_coefficient': np.abs(coefs),
            'selected': coefs != 0
        }).sort_values('abs_coefficient', ascending=False)

        return importance

    def transform(self, X, feature_names=None):
        """
        Return only selected features.
        """
        importance = self.get_feature_importance(feature_names)
        selected = importance[importance['selected']]['feature'].tolist()

        if isinstance(X, pd.DataFrame):
            return X[selected]
        else:
            selected_indices = importance[importance['selected']].index.tolist()
            return X[:, selected_indices]

# Example for regression
np.random.seed(42)
n_samples = 500
X = pd.DataFrame({
    'relevant_1': np.random.randn(n_samples),
    'relevant_2': np.random.randn(n_samples),
    'relevant_3': np.random.randn(n_samples),
    'noise_1': np.random.randn(n_samples),
    'noise_2': np.random.randn(n_samples),
    'noise_3': np.random.randn(n_samples),
    'noise_4': np.random.randn(n_samples),
    'noise_5': np.random.randn(n_samples),
})

# Target depends only on relevant features
y = (3 * X['relevant_1'] + 2 * X['relevant_2'] - X['relevant_3'] +
     np.random.randn(n_samples) * 0.5)

selector = LassoFeatureSelector(task='regression')
selector.fit(X, y)

importance = selector.get_feature_importance(X.columns.tolist())
print("Lasso Feature Selection Results:")
print(importance)

print(f"\nOptimal alpha: {selector.model_.alpha_:.6f}")
print(f"Number of selected features: {importance['selected'].sum()}")
```

### Tree-Based Feature Importance

Tree-based models provide built-in feature importance measures.

```python
from sklearn.ensemble import (
    RandomForestClassifier, RandomForestRegressor,
    GradientBoostingClassifier, GradientBoostingRegressor,
    ExtraTreesClassifier
)
from sklearn.inspection import permutation_importance
import numpy as np
import pandas as pd

class TreeBasedFeatureSelector:
    """
    Feature selection using tree-based model importance.
    """

    def __init__(self, model_type='random_forest', task='classification',
                 n_estimators=100, random_state=42):
        self.model_type = model_type
        self.task = task
        self.n_estimators = n_estimators
        self.random_state = random_state
        self.model_ = None

    def _get_model(self):
        """Get the appropriate model based on configuration."""
        models = {
            ('random_forest', 'classification'): RandomForestClassifier,
            ('random_forest', 'regression'): RandomForestRegressor,
            ('gradient_boosting', 'classification'): GradientBoostingClassifier,
            ('gradient_boosting', 'regression'): GradientBoostingRegressor,
            ('extra_trees', 'classification'): ExtraTreesClassifier,
        }

        model_class = models.get((self.model_type, self.task))
        if model_class is None:
            raise ValueError(f"Unknown model type: {self.model_type}")

        return model_class(n_estimators=self.n_estimators,
                          random_state=self.random_state)

    def fit(self, X, y):
        """Fit the tree-based model."""
        self.model_ = self._get_model()
        self.model_.fit(X, y)
        return self

    def get_feature_importance(self, X, feature_names=None, method='default'):
        """
        Get feature importance scores.

        Parameters:
        -----------
        method : str
            'default' - Use model's built-in feature_importances_
            'permutation' - Use permutation importance
        """
        if feature_names is None:
            if isinstance(X, pd.DataFrame):
                feature_names = X.columns.tolist()
            else:
                feature_names = [f'feature_{i}' for i in range(X.shape[1])]

        if method == 'default':
            importances = self.model_.feature_importances_
            importance_std = np.zeros_like(importances)

            # For Random Forest, we can get std from individual trees
            if hasattr(self.model_, 'estimators_'):
                all_importances = np.array([tree.feature_importances_
                                           for tree in self.model_.estimators_])
                importance_std = all_importances.std(axis=0)

        elif method == 'permutation':
            # Permutation importance is more reliable but slower
            y_pred = self.model_.predict(X)  # Need to refit for proper evaluation
            perm_importance = permutation_importance(
                self.model_, X, y_pred,
                n_repeats=10,
                random_state=self.random_state
            )
            importances = perm_importance.importances_mean
            importance_std = perm_importance.importances_std
        else:
            raise ValueError(f"Unknown method: {method}")

        results = pd.DataFrame({
            'feature': feature_names,
            'importance': importances,
            'std': importance_std
        }).sort_values('importance', ascending=False)

        return results

    def select_features(self, X, y, threshold='mean'):
        """
        Select features based on importance threshold.

        Parameters:
        -----------
        threshold : str or float
            'mean' - Select features above mean importance
            'median' - Select features above median importance
            float - Select features above this threshold
        """
        self.fit(X, y)
        importance = self.get_feature_importance(X)

        if threshold == 'mean':
            thresh_value = importance['importance'].mean()
        elif threshold == 'median':
            thresh_value = importance['importance'].median()
        else:
            thresh_value = threshold

        selected = importance[importance['importance'] >= thresh_value]['feature'].tolist()

        return selected, importance

# Example usage
np.random.seed(42)
X = pd.DataFrame(np.random.randn(500, 10),
                 columns=[f'feature_{i}' for i in range(10)])
y = (X['feature_0'] * 3 + X['feature_1'] * 2 + X['feature_2'] +
     np.random.randn(500) * 0.5 > 0).astype(int)

selector = TreeBasedFeatureSelector(model_type='random_forest', task='classification')

selected_features, importance = selector.select_features(X, y, threshold='mean')

print("Feature Importance (Random Forest):")
print(importance)
print(f"\nSelected features (above mean): {selected_features}")

# Compare with permutation importance
selector.fit(X, y)
perm_importance = selector.get_feature_importance(X, method='permutation')
print("\nPermutation Importance:")
print(perm_importance)
```

### Feature Importance from Gradient Boosting

```python
import numpy as np
import pandas as pd

# XGBoost feature importance
def xgboost_feature_selection(X, y, task='classification'):
    """
    Feature selection using XGBoost importance types.
    """
    try:
        import xgboost as xgb
    except ImportError:
        print("XGBoost not installed. Install with: pip install xgboost")
        return None

    if task == 'classification':
        model = xgb.XGBClassifier(n_estimators=100, random_state=42, eval_metric='logloss')
    else:
        model = xgb.XGBRegressor(n_estimators=100, random_state=42)

    model.fit(X, y)

    feature_names = X.columns.tolist() if isinstance(X, pd.DataFrame) else \
                    [f'feature_{i}' for i in range(X.shape[1])]

    # XGBoost provides multiple importance types
    importance_types = ['weight', 'gain', 'cover']
    results = pd.DataFrame({'feature': feature_names})

    for imp_type in importance_types:
        booster = model.get_booster()
        importance = booster.get_score(importance_type=imp_type)

        # Map feature names to importance values
        results[imp_type] = [importance.get(f, 0) for f in feature_names]

    # Normalize each importance type
    for col in importance_types:
        if results[col].sum() > 0:
            results[f'{col}_normalized'] = results[col] / results[col].sum()

    return results.sort_values('gain', ascending=False)

# LightGBM feature importance
def lightgbm_feature_selection(X, y, task='classification'):
    """
    Feature selection using LightGBM importance.
    """
    try:
        import lightgbm as lgb
    except ImportError:
        print("LightGBM not installed. Install with: pip install lightgbm")
        return None

    if task == 'classification':
        model = lgb.LGBMClassifier(n_estimators=100, random_state=42, verbose=-1)
    else:
        model = lgb.LGBMRegressor(n_estimators=100, random_state=42, verbose=-1)

    model.fit(X, y)

    feature_names = X.columns.tolist() if isinstance(X, pd.DataFrame) else \
                    [f'feature_{i}' for i in range(X.shape[1])]

    results = pd.DataFrame({
        'feature': feature_names,
        'split_importance': model.booster_.feature_importance(importance_type='split'),
        'gain_importance': model.booster_.feature_importance(importance_type='gain')
    })

    return results.sort_values('gain_importance', ascending=False)

# Example usage
np.random.seed(42)
X = pd.DataFrame(np.random.randn(500, 10),
                 columns=[f'feature_{i}' for i in range(10)])
y = (X['feature_0'] * 3 + X['feature_1'] * 2 + X['feature_2'] > 0).astype(int)

print("XGBoost Feature Importance:")
xgb_importance = xgboost_feature_selection(X, y)
if xgb_importance is not None:
    print(xgb_importance)

print("\nLightGBM Feature Importance:")
lgb_importance = lightgbm_feature_selection(X, y)
if lgb_importance is not None:
    print(lgb_importance)
```

### Elastic Net Selection

Elastic Net combines L1 and L2 regularization for feature selection with grouped variables.

```python
from sklearn.linear_model import ElasticNetCV, ElasticNet
from sklearn.preprocessing import StandardScaler
import numpy as np
import pandas as pd

class ElasticNetSelector:
    """
    Feature selection using Elastic Net regularization.
    Combines L1 (sparsity) and L2 (grouping) penalties.
    """

    def __init__(self, l1_ratio=0.5, cv=5, max_iter=10000):
        """
        Parameters:
        -----------
        l1_ratio : float
            Mixing parameter. l1_ratio=1 is Lasso, l1_ratio=0 is Ridge.
            Values between 0 and 1 combine both penalties.
        """
        self.l1_ratio = l1_ratio
        self.cv = cv
        self.max_iter = max_iter
        self.model_ = None
        self.scaler_ = StandardScaler()

    def fit(self, X, y):
        """Fit Elastic Net with cross-validation."""
        X_scaled = self.scaler_.fit_transform(X)

        self.model_ = ElasticNetCV(
            l1_ratio=self.l1_ratio,
            cv=self.cv,
            max_iter=self.max_iter,
            random_state=42
        )
        self.model_.fit(X_scaled, y)

        return self

    def get_feature_importance(self, feature_names=None):
        """Get feature coefficients and selection status."""
        coefs = self.model_.coef_

        if feature_names is None:
            feature_names = [f'feature_{i}' for i in range(len(coefs))]

        results = pd.DataFrame({
            'feature': feature_names,
            'coefficient': coefs,
            'abs_coefficient': np.abs(coefs),
            'selected': coefs != 0
        }).sort_values('abs_coefficient', ascending=False)

        return results

    def compare_l1_ratios(self, X, y, l1_ratios=[0.1, 0.5, 0.7, 0.9, 0.95, 0.99]):
        """
        Compare feature selection across different L1 ratios.
        """
        X_scaled = self.scaler_.fit_transform(X)
        results = []

        for ratio in l1_ratios:
            model = ElasticNetCV(
                l1_ratio=ratio,
                cv=self.cv,
                max_iter=self.max_iter,
                random_state=42
            )
            model.fit(X_scaled, y)

            n_selected = np.sum(model.coef_ != 0)
            results.append({
                'l1_ratio': ratio,
                'n_selected_features': n_selected,
                'alpha': model.alpha_,
                'r2_score': model.score(X_scaled, y)
            })

        return pd.DataFrame(results)

# Example usage
np.random.seed(42)
n_samples = 500
n_features = 20

# Create features with groups (correlated)
X = pd.DataFrame()
for i in range(5):
    base = np.random.randn(n_samples)
    for j in range(4):
        X[f'group{i}_feat{j}'] = base + np.random.randn(n_samples) * 0.3

# Target depends on one feature from each group
y = (X['group0_feat0'] + X['group1_feat0'] + X['group2_feat0'] +
     np.random.randn(n_samples) * 0.5)

selector = ElasticNetSelector(l1_ratio=0.5)
selector.fit(X, y)

importance = selector.get_feature_importance(X.columns.tolist())
print("Elastic Net Feature Selection:")
print(importance[importance['selected']])

# Compare different L1 ratios
comparison = selector.compare_l1_ratios(X, y)
print("\nL1 Ratio Comparison:")
print(comparison)
```

## Stability Selection

Stability selection addresses the instability of feature selection by combining randomization with selection algorithms.

### Implementation with Scikit-learn

```python
from sklearn.linear_model import LassoCV
from sklearn.utils import resample
from sklearn.preprocessing import StandardScaler
import numpy as np
import pandas as pd

class StabilitySelector:
    """
    Stability selection for robust feature selection.

    Repeatedly subsamples the data and applies a feature selection method,
    tracking how often each feature is selected.
    """

    def __init__(self, base_selector=None, n_bootstrap=100,
                 sample_fraction=0.5, threshold=0.6):
        """
        Parameters:
        -----------
        base_selector : estimator
            Feature selector to use (must have coef_ or feature_importances_)
        n_bootstrap : int
            Number of bootstrap iterations
        sample_fraction : float
            Fraction of samples to use in each iteration
        threshold : float
            Selection threshold (features selected in >threshold% of iterations)
        """
        self.base_selector = base_selector or LassoCV(cv=5, max_iter=10000)
        self.n_bootstrap = n_bootstrap
        self.sample_fraction = sample_fraction
        self.threshold = threshold
        self.selection_frequencies_ = None
        self.scaler_ = StandardScaler()

    def fit(self, X, y):
        """
        Run stability selection.
        """
        n_samples = X.shape[0]
        n_features = X.shape[1]
        sample_size = int(n_samples * self.sample_fraction)

        X_scaled = self.scaler_.fit_transform(X)

        # Track selection counts
        selection_counts = np.zeros(n_features)

        for i in range(self.n_bootstrap):
            # Bootstrap sample
            indices = resample(range(n_samples), n_samples=sample_size,
                             random_state=i)
            X_boot = X_scaled[indices]
            y_boot = y.iloc[indices] if hasattr(y, 'iloc') else y[indices]

            # Fit selector
            self.base_selector.fit(X_boot, y_boot)

            # Track selected features
            if hasattr(self.base_selector, 'coef_'):
                selected = self.base_selector.coef_ != 0
            elif hasattr(self.base_selector, 'feature_importances_'):
                threshold = np.mean(self.base_selector.feature_importances_)
                selected = self.base_selector.feature_importances_ >= threshold
            else:
                raise ValueError("Selector must have coef_ or feature_importances_")

            selection_counts += selected.astype(int)

        self.selection_frequencies_ = selection_counts / self.n_bootstrap

        return self

    def get_selected_features(self, feature_names=None):
        """
        Get features selected above the threshold.
        """
        if feature_names is None:
            feature_names = [f'feature_{i}' for i in range(len(self.selection_frequencies_))]

        results = pd.DataFrame({
            'feature': feature_names,
            'selection_frequency': self.selection_frequencies_,
            'selected': self.selection_frequencies_ >= self.threshold
        }).sort_values('selection_frequency', ascending=False)

        return results

    def transform(self, X, feature_names=None):
        """Return only stable features."""
        results = self.get_selected_features(feature_names)
        selected = results[results['selected']]['feature'].tolist()

        if isinstance(X, pd.DataFrame):
            return X[selected]
        else:
            selected_indices = results[results['selected']].index.tolist()
            return X[:, selected_indices]

# Example usage
np.random.seed(42)
n_samples = 300
n_features = 20

X = pd.DataFrame(
    np.random.randn(n_samples, n_features),
    columns=[f'feature_{i}' for i in range(n_features)]
)

# Only first 5 features are relevant
y = (X.iloc[:, :5].sum(axis=1) + np.random.randn(n_samples) * 0.5)

stability_selector = StabilitySelector(
    n_bootstrap=50,
    sample_fraction=0.5,
    threshold=0.6
)

stability_selector.fit(X, y)
results = stability_selector.get_selected_features(X.columns.tolist())

print("Stability Selection Results:")
print(results)

selected = results[results['selected']]['feature'].tolist()
print(f"\nStable features (threshold=0.6): {selected}")
```

### Visualization of Selection Stability

```python
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

def plot_stability_path(X, y, base_selector, n_bootstrap=50,
                        sample_fractions=[0.3, 0.5, 0.7]):
    """
    Plot stability selection frequencies across different sample fractions.
    """
    from sklearn.preprocessing import StandardScaler
    from sklearn.utils import resample

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    feature_names = X.columns.tolist() if isinstance(X, pd.DataFrame) else \
                    [f'feature_{i}' for i in range(X.shape[1])]

    fig, axes = plt.subplots(1, len(sample_fractions), figsize=(5*len(sample_fractions), 5))

    for ax, fraction in zip(axes, sample_fractions):
        n_samples = X.shape[0]
        sample_size = int(n_samples * fraction)
        selection_counts = np.zeros(X.shape[1])

        for i in range(n_bootstrap):
            indices = resample(range(n_samples), n_samples=sample_size, random_state=i)
            X_boot = X_scaled[indices]
            y_boot = y.iloc[indices] if hasattr(y, 'iloc') else y[indices]

            base_selector.fit(X_boot, y_boot)

            if hasattr(base_selector, 'coef_'):
                selected = base_selector.coef_ != 0
            else:
                threshold = np.mean(base_selector.feature_importances_)
                selected = base_selector.feature_importances_ >= threshold

            selection_counts += selected.astype(int)

        frequencies = selection_counts / n_bootstrap

        # Sort by frequency
        sorted_idx = np.argsort(frequencies)[::-1]
        sorted_freq = frequencies[sorted_idx]
        sorted_names = [feature_names[i] for i in sorted_idx]

        ax.barh(range(len(sorted_freq)), sorted_freq)
        ax.set_yticks(range(len(sorted_names)))
        ax.set_yticklabels(sorted_names, fontsize=8)
        ax.set_xlabel('Selection Frequency')
        ax.set_title(f'Sample Fraction: {fraction}')
        ax.axvline(x=0.6, color='red', linestyle='--', label='Threshold')
        ax.invert_yaxis()
        ax.legend()

    plt.tight_layout()
    return fig

# Example
from sklearn.linear_model import LassoCV

np.random.seed(42)
X = pd.DataFrame(np.random.randn(200, 10),
                 columns=[f'feat_{i}' for i in range(10)])
y = X['feat_0'] * 3 + X['feat_1'] * 2 + X['feat_2'] + np.random.randn(200) * 0.5

fig = plot_stability_path(X, y, LassoCV(cv=3, max_iter=5000), n_bootstrap=30)
plt.savefig('stability_selection.png', dpi=150, bbox_inches='tight')
print("Stability selection plot saved.")
```

## Automatic Feature Selection

Automatic feature selection combines multiple methods to create robust feature selection pipelines.

### Combined Selection Strategy

```python
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.feature_selection import (
    VarianceThreshold, SelectKBest, mutual_info_classif, RFE
)
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LassoCV
from sklearn.preprocessing import StandardScaler
import numpy as np
import pandas as pd

class AutoFeatureSelector(BaseEstimator, TransformerMixin):
    """
    Automatic feature selection combining multiple methods.

    Strategy:
    1. Remove low variance features (filter)
    2. Remove highly correlated features (filter)
    3. Statistical selection with mutual information (filter)
    4. Model-based selection with Lasso (embedded)
    5. Final selection based on consensus
    """

    def __init__(self, variance_threshold=0.01, correlation_threshold=0.95,
                 mi_percentile=50, consensus_threshold=2):
        """
        Parameters:
        -----------
        variance_threshold : float
            Minimum variance for features
        correlation_threshold : float
            Maximum correlation between features
        mi_percentile : int
            Percentile threshold for mutual information selection
        consensus_threshold : int
            Minimum number of methods that must select a feature
        """
        self.variance_threshold = variance_threshold
        self.correlation_threshold = correlation_threshold
        self.mi_percentile = mi_percentile
        self.consensus_threshold = consensus_threshold

        self.variance_selector_ = None
        self.correlation_drops_ = []
        self.mi_scores_ = None
        self.lasso_coefs_ = None
        self.selection_summary_ = None
        self.selected_features_ = None

    def fit(self, X, y):
        """Fit all selection methods."""
        X = pd.DataFrame(X) if not isinstance(X, pd.DataFrame) else X.copy()
        feature_names = X.columns.tolist()

        selection_votes = pd.DataFrame({'feature': feature_names})
        selection_votes['variance'] = False
        selection_votes['correlation'] = False
        selection_votes['mutual_info'] = False
        selection_votes['lasso'] = False

        # Step 1: Variance threshold
        self.variance_selector_ = VarianceThreshold(threshold=self.variance_threshold)
        self.variance_selector_.fit(X)
        variance_selected = self.variance_selector_.get_support()
        selection_votes.loc[variance_selected, 'variance'] = True

        # Continue with variance-filtered features
        X_var = X.loc[:, variance_selected]
        var_features = X_var.columns.tolist()

        # Step 2: Correlation filter
        corr_matrix = X_var.corr().abs()
        upper_tri = corr_matrix.where(
            np.triu(np.ones(corr_matrix.shape), k=1).astype(bool)
        )
        self.correlation_drops_ = [col for col in upper_tri.columns
                                   if any(upper_tri[col] > self.correlation_threshold)]
        corr_selected = [f for f in var_features if f not in self.correlation_drops_]
        selection_votes.loc[selection_votes['feature'].isin(corr_selected), 'correlation'] = True

        # Step 3: Mutual information
        X_corr = X_var.drop(columns=self.correlation_drops_)
        mi_scores = mutual_info_classif(X_corr, y, random_state=42)
        threshold = np.percentile(mi_scores, self.mi_percentile)
        mi_selected = X_corr.columns[mi_scores >= threshold].tolist()
        selection_votes.loc[selection_votes['feature'].isin(mi_selected), 'mutual_info'] = True
        self.mi_scores_ = dict(zip(X_corr.columns, mi_scores))

        # Step 4: Lasso selection
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X_corr)
        lasso = LassoCV(cv=5, max_iter=10000, random_state=42)
        lasso.fit(X_scaled, y)
        lasso_selected = X_corr.columns[lasso.coef_ != 0].tolist()
        selection_votes.loc[selection_votes['feature'].isin(lasso_selected), 'lasso'] = True
        self.lasso_coefs_ = dict(zip(X_corr.columns, lasso.coef_))

        # Consensus selection
        vote_cols = ['variance', 'correlation', 'mutual_info', 'lasso']
        selection_votes['total_votes'] = selection_votes[vote_cols].sum(axis=1)
        selection_votes['selected'] = selection_votes['total_votes'] >= self.consensus_threshold

        self.selection_summary_ = selection_votes
        self.selected_features_ = selection_votes[selection_votes['selected']]['feature'].tolist()

        return self

    def transform(self, X):
        """Transform data to selected features."""
        X = pd.DataFrame(X) if not isinstance(X, pd.DataFrame) else X
        return X[self.selected_features_]

    def get_selection_summary(self):
        """Return detailed selection summary."""
        return self.selection_summary_.sort_values('total_votes', ascending=False)

# Example usage
np.random.seed(42)
n_samples = 500
n_features = 30

X = pd.DataFrame(
    np.random.randn(n_samples, n_features),
    columns=[f'feature_{i}' for i in range(n_features)]
)

# Add some problematic features
X['constant'] = 1  # Zero variance
X['low_var'] = np.random.choice([0, 1], n_samples, p=[0.99, 0.01])
X['highly_correlated'] = X['feature_0'] + np.random.randn(n_samples) * 0.01

# Target depends on subset of features
y = (X['feature_0'] * 3 + X['feature_1'] * 2 + X['feature_2'] - X['feature_3'] +
     np.random.randn(n_samples) * 0.5 > 0).astype(int)

auto_selector = AutoFeatureSelector(
    variance_threshold=0.01,
    correlation_threshold=0.95,
    mi_percentile=50,
    consensus_threshold=2
)

X_selected = auto_selector.fit_transform(X, y)

print("Automatic Feature Selection Summary:")
summary = auto_selector.get_selection_summary()
print(summary.head(15))

print(f"\nSelected features ({len(auto_selector.selected_features_)}):")
print(auto_selector.selected_features_)
```

### Cross-Validated Feature Selection

```python
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.feature_selection import SelectFromModel
from sklearn.ensemble import RandomForestClassifier
import numpy as np
import pandas as pd

class CrossValidatedFeatureSelector:
    """
    Feature selection with cross-validation to prevent overfitting.
    """

    def __init__(self, n_splits=5, random_state=42):
        self.n_splits = n_splits
        self.random_state = random_state
        self.cv_results_ = None

    def evaluate_selection_methods(self, X, y, final_estimator=None):
        """
        Compare different feature selection methods using cross-validation.
        """
        if final_estimator is None:
            final_estimator = LogisticRegression(max_iter=1000)

        # Define selection methods
        selection_methods = {
            'no_selection': None,
            'variance_threshold': VarianceThreshold(threshold=0.01),
            'mutual_info': SelectKBest(score_func=mutual_info_classif, k=10),
            'lasso': SelectFromModel(LassoCV(cv=3, max_iter=5000)),
            'tree_importance': SelectFromModel(
                RandomForestClassifier(n_estimators=50, random_state=42)
            ),
            'rfe': RFE(estimator=LogisticRegression(max_iter=1000),
                      n_features_to_select=10)
        }

        cv = StratifiedKFold(n_splits=self.n_splits, shuffle=True,
                            random_state=self.random_state)

        results = []

        for name, selector in selection_methods.items():
            if selector is None:
                pipeline = Pipeline([
                    ('scaler', StandardScaler()),
                    ('classifier', final_estimator)
                ])
            else:
                pipeline = Pipeline([
                    ('scaler', StandardScaler()),
                    ('selector', selector),
                    ('classifier', final_estimator)
                ])

            scores = cross_val_score(pipeline, X, y, cv=cv, scoring='accuracy')

            results.append({
                'method': name,
                'mean_accuracy': scores.mean(),
                'std_accuracy': scores.std(),
                'min_accuracy': scores.min(),
                'max_accuracy': scores.max()
            })

        self.cv_results_ = pd.DataFrame(results).sort_values(
            'mean_accuracy', ascending=False
        )

        return self.cv_results_

    def nested_cv_selection(self, X, y, selector, estimator,
                           outer_cv=5, inner_cv=3):
        """
        Nested cross-validation for unbiased evaluation of feature selection.

        Outer loop: Evaluate final model performance
        Inner loop: Tune feature selection
        """
        outer_cv_splits = StratifiedKFold(n_splits=outer_cv, shuffle=True,
                                          random_state=self.random_state)

        outer_scores = []
        selected_features_per_fold = []

        for fold, (train_idx, test_idx) in enumerate(outer_cv_splits.split(X, y)):
            X_train = X.iloc[train_idx] if isinstance(X, pd.DataFrame) else X[train_idx]
            X_test = X.iloc[test_idx] if isinstance(X, pd.DataFrame) else X[test_idx]
            y_train = y.iloc[train_idx] if hasattr(y, 'iloc') else y[train_idx]
            y_test = y.iloc[test_idx] if hasattr(y, 'iloc') else y[test_idx]

            # Inner CV for feature selection
            pipeline = Pipeline([
                ('scaler', StandardScaler()),
                ('selector', selector),
                ('classifier', estimator)
            ])

            pipeline.fit(X_train, y_train)
            score = pipeline.score(X_test, y_test)
            outer_scores.append(score)

            # Track selected features
            if hasattr(pipeline.named_steps['selector'], 'get_support'):
                if isinstance(X, pd.DataFrame):
                    selected = X.columns[pipeline.named_steps['selector'].get_support()].tolist()
                else:
                    selected = list(np.where(pipeline.named_steps['selector'].get_support())[0])
                selected_features_per_fold.append(selected)

        return {
            'mean_score': np.mean(outer_scores),
            'std_score': np.std(outer_scores),
            'scores': outer_scores,
            'selected_features_per_fold': selected_features_per_fold
        }

# Example usage
np.random.seed(42)
X = pd.DataFrame(np.random.randn(400, 20),
                 columns=[f'feature_{i}' for i in range(20)])
y = (X['feature_0'] * 2 + X['feature_1'] - X['feature_2'] > 0).astype(int)

cv_selector = CrossValidatedFeatureSelector(n_splits=5)

# Compare methods
print("Comparing Feature Selection Methods:")
results = cv_selector.evaluate_selection_methods(X, y)
print(results)

# Nested CV for unbiased evaluation
print("\nNested CV Results:")
nested_results = cv_selector.nested_cv_selection(
    X, y,
    selector=SelectKBest(score_func=mutual_info_classif, k=5),
    estimator=LogisticRegression(max_iter=1000)
)
print(f"Mean Score: {nested_results['mean_score']:.4f} (+/- {nested_results['std_score']:.4f})")
```

## Complete Scikit-learn Pipeline

### Production-Ready Feature Selection Pipeline

```python
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.feature_selection import SelectFromModel, VarianceThreshold
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, GridSearchCV
import numpy as np
import pandas as pd

def create_feature_selection_pipeline(numerical_features, categorical_features,
                                      selection_method='tree', n_features=10):
    """
    Create a complete preprocessing and feature selection pipeline.

    Parameters:
    -----------
    numerical_features : list
        Names of numerical columns
    categorical_features : list
        Names of categorical columns
    selection_method : str
        'tree', 'lasso', or 'kbest'
    n_features : int
        Number of features to select
    """
    # Numerical preprocessing
    numerical_transformer = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    # Categorical preprocessing
    categorical_transformer = Pipeline([
        ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
        ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])

    # Combine preprocessors
    preprocessor = ColumnTransformer([
        ('numerical', numerical_transformer, numerical_features),
        ('categorical', categorical_transformer, categorical_features)
    ])

    # Feature selection step
    if selection_method == 'tree':
        selector = SelectFromModel(
            RandomForestClassifier(n_estimators=100, random_state=42),
            max_features=n_features
        )
    elif selection_method == 'lasso':
        selector = SelectFromModel(
            LassoCV(cv=5, max_iter=10000, random_state=42),
            max_features=n_features
        )
    else:
        from sklearn.feature_selection import SelectKBest, mutual_info_classif
        selector = SelectKBest(score_func=mutual_info_classif, k=n_features)

    # Complete pipeline
    pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('variance_filter', VarianceThreshold(threshold=0.01)),
        ('feature_selector', selector),
        ('classifier', LogisticRegression(max_iter=1000))
    ])

    return pipeline

# Example with mixed data types
np.random.seed(42)
n_samples = 500

data = pd.DataFrame({
    'age': np.random.randint(18, 80, n_samples),
    'income': np.random.exponential(50000, n_samples),
    'credit_score': np.random.randint(300, 850, n_samples),
    'years_employed': np.random.randint(0, 40, n_samples),
    'education': np.random.choice(['HS', 'Bachelor', 'Master', 'PhD'], n_samples),
    'region': np.random.choice(['North', 'South', 'East', 'West'], n_samples),
    'employment_type': np.random.choice(['Full-time', 'Part-time', 'Contract'], n_samples)
})

# Add some noise features
for i in range(5):
    data[f'noise_{i}'] = np.random.randn(n_samples)

# Target
y = ((data['income'] > 50000) & (data['credit_score'] > 650)).astype(int)

numerical_features = ['age', 'income', 'credit_score', 'years_employed'] + \
                     [f'noise_{i}' for i in range(5)]
categorical_features = ['education', 'region', 'employment_type']

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    data, y, test_size=0.2, random_state=42
)

# Create and train pipeline
pipeline = create_feature_selection_pipeline(
    numerical_features, categorical_features,
    selection_method='tree', n_features=10
)

pipeline.fit(X_train, y_train)

print(f"Training accuracy: {pipeline.score(X_train, y_train):.4f}")
print(f"Test accuracy: {pipeline.score(X_test, y_test):.4f}")

# Get selected feature mask after preprocessing
selector = pipeline.named_steps['feature_selector']
print(f"\nNumber of features after preprocessing: {selector.n_features_in_}")
print(f"Number of selected features: {sum(selector.get_support())}")
```

### Hyperparameter Tuning for Feature Selection

```python
from sklearn.model_selection import GridSearchCV, RandomizedSearchCV
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import SelectKBest, mutual_info_classif, f_classif
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
import numpy as np
import pandas as pd

def tune_feature_selection(X, y, cv=5):
    """
    Tune feature selection hyperparameters using GridSearchCV.
    """
    # Create pipeline
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('selector', SelectKBest()),
        ('classifier', LogisticRegression(max_iter=1000))
    ])

    # Parameter grid
    param_grid = {
        'selector__score_func': [mutual_info_classif, f_classif],
        'selector__k': [5, 10, 15, 20, 'all'],
        'classifier__C': [0.1, 1.0, 10.0]
    }

    # Grid search
    grid_search = GridSearchCV(
        pipeline,
        param_grid,
        cv=cv,
        scoring='accuracy',
        n_jobs=-1,
        verbose=1
    )

    grid_search.fit(X, y)

    print(f"Best parameters: {grid_search.best_params_}")
    print(f"Best CV score: {grid_search.best_score_:.4f}")

    # Results DataFrame
    results = pd.DataFrame(grid_search.cv_results_)
    results = results[['param_selector__score_func', 'param_selector__k',
                       'param_classifier__C', 'mean_test_score', 'std_test_score']]
    results = results.sort_values('mean_test_score', ascending=False)

    return grid_search.best_estimator_, results

# Example usage
np.random.seed(42)
X = pd.DataFrame(np.random.randn(500, 25),
                 columns=[f'feature_{i}' for i in range(25)])
y = (X['feature_0'] * 2 + X['feature_1'] - X['feature_2'] + X['feature_3'] > 0).astype(int)

best_pipeline, tuning_results = tune_feature_selection(X, y)

print("\nTop tuning results:")
print(tuning_results.head(10))
```

## Best Practices Summary

### Method Selection Guide

| Scenario | Recommended Method | Reason |
|----------|-------------------|--------|
| Large dataset, many features | Filter methods | Fast, scalable |
| Small dataset | Wrapper methods (RFE) | More accurate selection |
| Interpretability important | Lasso, Tree importance | Clear feature ranking |
| Non-linear relationships | Mutual information, Tree-based | Capture complex patterns |
| Correlated features | Elastic Net | Handles grouped features |
| Production system | Pipeline with CV | Robust, reproducible |
| Research/exploration | Multiple methods | Comprehensive analysis |

### Common Pitfalls to Avoid

1. **Data Leakage**: Always fit selectors on training data only
2. **Overfitting**: Use cross-validation for unbiased evaluation
3. **Single Method Reliance**: Compare multiple selection methods
4. **Ignoring Domain Knowledge**: Combine automatic selection with expert input
5. **Feature Scaling**: Scale features before Lasso or distance-based methods
6. **Sample Size**: Ensure sufficient samples for reliable selection

### Recommended Workflow

```python
def feature_selection_workflow(X, y, task='classification'):
    """
    Recommended feature selection workflow.
    """
    from sklearn.model_selection import train_test_split

    # 1. Split data first
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # 2. Quick filter (remove obvious non-informative features)
    variance_selector = VarianceThreshold(threshold=0.01)
    X_train_var = variance_selector.fit_transform(X_train)
    X_test_var = variance_selector.transform(X_test)

    # 3. Remove highly correlated features
    # (Use correlation_filter from earlier examples)

    # 4. Apply multiple selection methods
    # - Mutual information
    # - Lasso/Elastic Net
    # - Tree-based importance

    # 5. Use stability selection for robustness

    # 6. Validate with cross-validation

    # 7. Final model evaluation on held-out test set

    return selected_features
```

## Conclusion

Feature selection is an essential step in building effective machine learning models. The three main approaches offer different trade-offs:

- **Filter methods** provide fast, model-agnostic selection suitable for initial screening
- **Wrapper methods** offer superior selection accuracy at higher computational cost
- **Embedded methods** integrate selection with model training for efficiency

Key takeaways:

1. Always split data before feature selection to prevent leakage
2. Use cross-validation to evaluate selection performance
3. Combine multiple methods for robust selection
4. Consider domain knowledge alongside automatic selection
5. Document your selection process for reproducibility

By mastering these techniques and applying them thoughtfully, you can significantly improve your models' performance, interpretability, and generalization ability. Start with simple filter methods, then progressively apply more sophisticated techniques as needed for your specific problem.
