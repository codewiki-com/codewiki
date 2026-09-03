---
title: Feature Engineering Complete Guide
description: Master feature engineering for better ML models
track: datascience
section: classical-ml
difficulty: intermediate
tags:
  - Feature Engineering
  - Machine Learning
  - Data Preprocessing
  - Feature Selection
status: imported
origin: old/src/content/docs/ai/feature-engineering.en.md
divergence: 0.407
issues:
  - divergent
legacy:
  category: AI
  subcategory: Machine Learning
  order: 16
  lastUpdated: 2026-01-07
---

Feature engineering is the process of using domain knowledge to create, transform, and select features (input variables) that make machine learning algorithms work more effectively. It is often considered the most critical step in building successful machine learning models, as the quality and relevance of features directly impact model performance.

This comprehensive guide covers the essential techniques for feature extraction, transformation, selection, encoding, and dimensionality reduction, with practical code examples to help you master these skills.

## Understanding Feature Engineering

Feature engineering bridges the gap between raw data and the mathematical models that learn from it. Even the most sophisticated algorithms cannot overcome poorly engineered features, while well-crafted features can enable simple models to achieve remarkable results.

### Why Feature Engineering Matters

**Key Benefits:**
- Improves model accuracy and generalization
- Reduces overfitting by creating meaningful representations
- Decreases training time by removing noise
- Enables simpler models to capture complex patterns
- Provides interpretable insights into the data

**The Feature Engineering Pipeline:**

```python
import pandas as pd
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer

# Example: Complete feature engineering pipeline
def create_feature_pipeline(numerical_features, categorical_features):
    """Create a comprehensive feature engineering pipeline."""

    # Numerical feature processing
    numerical_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    # Categorical feature processing
    categorical_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
        ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])

    # Combine pipelines
    preprocessor = ColumnTransformer([
        ('numerical', numerical_pipeline, numerical_features),
        ('categorical', categorical_pipeline, categorical_features)
    ])

    return preprocessor
```

### Types of Features

Understanding the different types of features helps in selecting appropriate engineering techniques:

| Feature Type | Description | Examples |
|-------------|-------------|----------|
| Numerical | Continuous or discrete numbers | Age, price, count |
| Categorical | Discrete categories or labels | Color, country, status |
| Ordinal | Categories with natural ordering | Education level, rating |
| Text | Unstructured text data | Reviews, descriptions |
| Temporal | Date and time information | Timestamps, durations |
| Spatial | Geographic or location data | Coordinates, addresses |

## Feature Extraction

Feature extraction involves deriving new features from existing raw data. This process transforms data into a format that better represents the underlying problem to machine learning algorithms.

### Extracting Features from Text

Text data requires special handling to convert unstructured content into numerical representations:

```python
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
import nltk
from nltk.tokenize import word_tokenize
from nltk.stem import PorterStemmer

class TextFeatureExtractor:
    """Extract features from text data."""

    def __init__(self, max_features=1000):
        self.tfidf = TfidfVectorizer(max_features=max_features)
        self.count_vec = CountVectorizer(max_features=max_features)
        self.stemmer = PorterStemmer()

    def extract_basic_features(self, texts):
        """Extract basic text statistics."""
        features = pd.DataFrame()
        features['char_count'] = texts.apply(len)
        features['word_count'] = texts.apply(lambda x: len(x.split()))
        features['avg_word_length'] = texts.apply(
            lambda x: np.mean([len(w) for w in x.split()]) if x.split() else 0
        )
        features['sentence_count'] = texts.apply(lambda x: x.count('.') + 1)
        features['unique_words'] = texts.apply(lambda x: len(set(x.lower().split())))
        return features

    def extract_tfidf_features(self, texts):
        """Extract TF-IDF features."""
        tfidf_matrix = self.tfidf.fit_transform(texts)
        feature_names = self.tfidf.get_feature_names_out()
        return pd.DataFrame(tfidf_matrix.toarray(), columns=feature_names)

    def extract_ngram_features(self, texts, ngram_range=(1, 2)):
        """Extract n-gram features."""
        vectorizer = CountVectorizer(ngram_range=ngram_range, max_features=500)
        ngram_matrix = vectorizer.fit_transform(texts)
        return pd.DataFrame(
            ngram_matrix.toarray(),
            columns=vectorizer.get_feature_names_out()
        )

# Usage example
texts = pd.Series([
    "Machine learning is fascinating",
    "Deep learning requires large datasets",
    "Feature engineering improves model performance"
])

extractor = TextFeatureExtractor()
basic_features = extractor.extract_basic_features(texts)
print(basic_features)
```

### Extracting Features from Dates and Times

Temporal data contains rich information that can be decomposed into multiple meaningful features:

```python
import pandas as pd
from datetime import datetime

class TemporalFeatureExtractor:
    """Extract features from datetime columns."""

    def __init__(self, datetime_column):
        self.datetime_column = datetime_column

    def extract_all_features(self, df):
        """Extract comprehensive datetime features."""
        dt = pd.to_datetime(df[self.datetime_column])

        features = pd.DataFrame()

        # Basic components
        features['year'] = dt.dt.year
        features['month'] = dt.dt.month
        features['day'] = dt.dt.day
        features['hour'] = dt.dt.hour
        features['minute'] = dt.dt.minute
        features['dayofweek'] = dt.dt.dayofweek
        features['dayofyear'] = dt.dt.dayofyear
        features['weekofyear'] = dt.dt.isocalendar().week
        features['quarter'] = dt.dt.quarter

        # Binary features
        features['is_weekend'] = (dt.dt.dayofweek >= 5).astype(int)
        features['is_month_start'] = dt.dt.is_month_start.astype(int)
        features['is_month_end'] = dt.dt.is_month_end.astype(int)
        features['is_quarter_start'] = dt.dt.is_quarter_start.astype(int)
        features['is_quarter_end'] = dt.dt.is_quarter_end.astype(int)

        # Cyclical encoding for periodic features
        features['month_sin'] = np.sin(2 * np.pi * dt.dt.month / 12)
        features['month_cos'] = np.cos(2 * np.pi * dt.dt.month / 12)
        features['hour_sin'] = np.sin(2 * np.pi * dt.dt.hour / 24)
        features['hour_cos'] = np.cos(2 * np.pi * dt.dt.hour / 24)
        features['dayofweek_sin'] = np.sin(2 * np.pi * dt.dt.dayofweek / 7)
        features['dayofweek_cos'] = np.cos(2 * np.pi * dt.dt.dayofweek / 7)

        return features

# Usage example
df = pd.DataFrame({
    'timestamp': ['2024-01-15 14:30:00', '2024-06-21 09:15:00', '2024-12-25 18:45:00']
})
extractor = TemporalFeatureExtractor('timestamp')
temporal_features = extractor.extract_all_features(df)
print(temporal_features.head())
```

### Extracting Features from Images

For image data, features can be extracted using traditional computer vision techniques or deep learning:

```python
import numpy as np
from skimage import feature, color
from skimage.measure import regionprops

def extract_image_features(image):
    """Extract traditional image features."""
    features = {}

    # Convert to grayscale if needed
    if len(image.shape) == 3:
        gray = color.rgb2gray(image)
    else:
        gray = image

    # Basic statistics
    features['mean_intensity'] = np.mean(gray)
    features['std_intensity'] = np.std(gray)
    features['min_intensity'] = np.min(gray)
    features['max_intensity'] = np.max(gray)

    # Histogram features
    hist, _ = np.histogram(gray, bins=16, range=(0, 1))
    for i, h in enumerate(hist):
        features[f'hist_bin_{i}'] = h

    # Edge features using Canny
    edges = feature.canny(gray)
    features['edge_density'] = np.mean(edges)

    # Texture features using Local Binary Pattern
    lbp = feature.local_binary_pattern(gray, P=8, R=1, method='uniform')
    lbp_hist, _ = np.histogram(lbp, bins=10, range=(0, 10))
    for i, h in enumerate(lbp_hist):
        features[f'lbp_bin_{i}'] = h

    return features

# For deep learning feature extraction
def extract_deep_features(images, model_name='resnet50'):
    """Extract features using pretrained CNN."""
    from tensorflow.keras.applications import ResNet50
    from tensorflow.keras.applications.resnet50 import preprocess_input
    from tensorflow.keras.models import Model

    # Load pretrained model without top layers
    base_model = ResNet50(weights='imagenet', include_top=False, pooling='avg')

    # Preprocess images
    processed = preprocess_input(images)

    # Extract features
    features = base_model.predict(processed)

    return features
```

## Feature Transformation

Feature transformation modifies existing features to improve their distribution, scale, or relationship with the target variable.

### Scaling and Normalization

Different scaling techniques are appropriate for different scenarios:

```python
from sklearn.preprocessing import (
    StandardScaler, MinMaxScaler, RobustScaler,
    MaxAbsScaler, Normalizer, PowerTransformer
)

class FeatureScaler:
    """Apply various scaling techniques to features."""

    def __init__(self):
        self.scalers = {
            'standard': StandardScaler(),      # Zero mean, unit variance
            'minmax': MinMaxScaler(),          # Scale to [0, 1]
            'robust': RobustScaler(),          # Robust to outliers
            'maxabs': MaxAbsScaler(),          # Scale by max absolute value
            'l2_norm': Normalizer(norm='l2'),  # L2 normalization
            'power': PowerTransformer()        # Make data more Gaussian
        }

    def compare_scalers(self, X, feature_name='feature'):
        """Compare different scaling methods."""
        results = pd.DataFrame()
        results['original'] = X.flatten()

        for name, scaler in self.scalers.items():
            scaled = scaler.fit_transform(X.reshape(-1, 1))
            results[name] = scaled.flatten()

        return results.describe()

# Usage example
np.random.seed(42)
X = np.random.exponential(scale=2, size=(1000, 1))

scaler = FeatureScaler()
comparison = scaler.compare_scalers(X)
print(comparison)
```

### Mathematical Transformations

Apply mathematical functions to handle skewed distributions and non-linear relationships:

```python
import numpy as np
from scipy import stats

class MathematicalTransformer:
    """Apply mathematical transformations to features."""

    @staticmethod
    def log_transform(X, offset=1):
        """Log transformation for right-skewed data."""
        return np.log(X + offset)

    @staticmethod
    def sqrt_transform(X):
        """Square root transformation for moderate skew."""
        return np.sqrt(np.abs(X)) * np.sign(X)

    @staticmethod
    def box_cox_transform(X):
        """Box-Cox transformation (requires positive values)."""
        X_positive = X - X.min() + 1
        transformed, lambda_param = stats.boxcox(X_positive)
        return transformed, lambda_param

    @staticmethod
    def yeo_johnson_transform(X):
        """Yeo-Johnson transformation (handles negative values)."""
        from sklearn.preprocessing import PowerTransformer
        pt = PowerTransformer(method='yeo-johnson')
        return pt.fit_transform(X.reshape(-1, 1)).flatten()

    @staticmethod
    def quantile_transform(X, n_quantiles=100, output_distribution='normal'):
        """Transform to uniform or normal distribution."""
        from sklearn.preprocessing import QuantileTransformer
        qt = QuantileTransformer(
            n_quantiles=n_quantiles,
            output_distribution=output_distribution
        )
        return qt.fit_transform(X.reshape(-1, 1)).flatten()

# Example usage
np.random.seed(42)
skewed_data = np.random.exponential(scale=2, size=1000)

transformer = MathematicalTransformer()
print(f"Original skewness: {stats.skew(skewed_data):.3f}")
print(f"Log transform skewness: {stats.skew(transformer.log_transform(skewed_data)):.3f}")
print(f"Yeo-Johnson skewness: {stats.skew(transformer.yeo_johnson_transform(skewed_data)):.3f}")
```

### Binning and Discretization

Convert continuous features into discrete bins:

```python
from sklearn.preprocessing import KBinsDiscretizer

class FeatureBinner:
    """Bin continuous features into discrete categories."""

    def __init__(self, n_bins=5, strategy='quantile'):
        self.n_bins = n_bins
        self.strategy = strategy

    def equal_width_binning(self, X, n_bins=None):
        """Create bins of equal width."""
        n_bins = n_bins or self.n_bins
        return pd.cut(X, bins=n_bins, labels=False)

    def equal_frequency_binning(self, X, n_bins=None):
        """Create bins with equal number of samples."""
        n_bins = n_bins or self.n_bins
        return pd.qcut(X, q=n_bins, labels=False, duplicates='drop')

    def custom_binning(self, X, bins, labels=None):
        """Create bins based on custom boundaries."""
        return pd.cut(X, bins=bins, labels=labels)

    def sklearn_binning(self, X, strategy='quantile', encode='ordinal'):
        """Use sklearn's KBinsDiscretizer."""
        kbd = KBinsDiscretizer(
            n_bins=self.n_bins,
            encode=encode,
            strategy=strategy
        )
        return kbd.fit_transform(X.reshape(-1, 1)).flatten()

# Usage example
ages = np.array([22, 25, 30, 35, 42, 48, 55, 60, 65, 72])

binner = FeatureBinner(n_bins=4)

# Custom age groups
age_bins = [0, 30, 50, 65, 100]
age_labels = ['Young', 'Middle', 'Senior', 'Elderly']
binned_ages = binner.custom_binning(ages, bins=age_bins, labels=age_labels)
print(f"Age groups: {binned_ages.tolist()}")
```

### Polynomial and Interaction Features

Create new features by combining existing ones:

```python
from sklearn.preprocessing import PolynomialFeatures
from itertools import combinations

class InteractionFeatureCreator:
    """Create polynomial and interaction features."""

    def __init__(self, degree=2, interaction_only=False):
        self.degree = degree
        self.interaction_only = interaction_only

    def create_polynomial_features(self, X, feature_names=None):
        """Create polynomial features using sklearn."""
        poly = PolynomialFeatures(
            degree=self.degree,
            interaction_only=self.interaction_only,
            include_bias=False
        )
        X_poly = poly.fit_transform(X)

        if feature_names is not None:
            new_names = poly.get_feature_names_out(feature_names)
            return pd.DataFrame(X_poly, columns=new_names)
        return X_poly

    def create_ratio_features(self, df, numerators, denominators):
        """Create ratio features between columns."""
        ratio_features = pd.DataFrame()

        for num in numerators:
            for denom in denominators:
                if num != denom:
                    name = f'{num}_div_{denom}'
                    ratio_features[name] = df[num] / (df[denom] + 1e-8)

        return ratio_features

    def create_difference_features(self, df, columns):
        """Create difference features between pairs of columns."""
        diff_features = pd.DataFrame()

        for col1, col2 in combinations(columns, 2):
            diff_features[f'{col1}_minus_{col2}'] = df[col1] - df[col2]
            diff_features[f'{col2}_minus_{col1}'] = df[col2] - df[col1]

        return diff_features

# Usage example
df = pd.DataFrame({
    'height': [170, 165, 180, 175, 160],
    'weight': [70, 55, 85, 72, 50],
    'age': [25, 30, 35, 28, 45]
})

creator = InteractionFeatureCreator(degree=2)

# Polynomial features
poly_features = creator.create_polynomial_features(
    df[['height', 'weight']].values,
    feature_names=['height', 'weight']
)
print("Polynomial features:")
print(poly_features.head())

# Ratio features (like BMI)
df['bmi'] = df['weight'] / ((df['height'] / 100) ** 2)
print(f"\nBMI values: {df['bmi'].tolist()}")
```

## Categorical Feature Encoding

Converting categorical variables into numerical representations is essential for most machine learning algorithms.

### Label and Ordinal Encoding

```python
from sklearn.preprocessing import LabelEncoder, OrdinalEncoder

class CategoricalEncoder:
    """Encode categorical features using various methods."""

    def label_encode(self, series):
        """Simple integer encoding."""
        le = LabelEncoder()
        return le.fit_transform(series), le.classes_

    def ordinal_encode(self, df, columns, categories_order=None):
        """Ordinal encoding with custom order."""
        oe = OrdinalEncoder(categories=categories_order)
        encoded = oe.fit_transform(df[columns])
        return pd.DataFrame(encoded, columns=columns)

    def frequency_encode(self, series):
        """Encode based on frequency of categories."""
        freq_map = series.value_counts(normalize=True).to_dict()
        return series.map(freq_map)

    def count_encode(self, series):
        """Encode based on count of categories."""
        count_map = series.value_counts().to_dict()
        return series.map(count_map)

# Usage example
df = pd.DataFrame({
    'education': ['High School', 'Bachelor', 'Master', 'PhD', 'Bachelor', 'High School'],
    'city': ['NYC', 'LA', 'NYC', 'Chicago', 'NYC', 'LA']
})

encoder = CategoricalEncoder()

# Ordinal encoding with custom order
education_order = [['High School', 'Bachelor', 'Master', 'PhD']]
encoded_edu = encoder.ordinal_encode(df, ['education'], education_order)
print("Ordinal encoded education:", encoded_edu['education'].tolist())

# Frequency encoding
freq_encoded_city = encoder.frequency_encode(df['city'])
print("Frequency encoded city:", freq_encoded_city.tolist())
```

### One-Hot Encoding

```python
from sklearn.preprocessing import OneHotEncoder
import pandas as pd

class OneHotEncoderWrapper:
    """One-hot encoding with various options."""

    def __init__(self, drop='first', handle_unknown='ignore'):
        self.drop = drop
        self.handle_unknown = handle_unknown

    def pandas_dummies(self, df, columns, prefix=None):
        """Use pandas get_dummies for one-hot encoding."""
        return pd.get_dummies(
            df,
            columns=columns,
            prefix=prefix,
            drop_first=(self.drop == 'first')
        )

    def sklearn_onehot(self, X, feature_names=None):
        """Use sklearn's OneHotEncoder."""
        ohe = OneHotEncoder(
            drop=self.drop,
            sparse_output=False,
            handle_unknown=self.handle_unknown
        )
        encoded = ohe.fit_transform(X)

        if feature_names is not None:
            new_names = ohe.get_feature_names_out(feature_names)
            return pd.DataFrame(encoded, columns=new_names)
        return encoded

# Usage example
df = pd.DataFrame({
    'color': ['red', 'blue', 'green', 'red', 'blue'],
    'size': ['S', 'M', 'L', 'M', 'S']
})

ohe_wrapper = OneHotEncoderWrapper(drop='first')
encoded_df = ohe_wrapper.pandas_dummies(df, columns=['color', 'size'])
print(encoded_df)
```

### Target Encoding

Target encoding replaces categories with their mean target value:

```python
import numpy as np
from sklearn.model_selection import KFold

class TargetEncoder:
    """Target encoding with smoothing and cross-validation."""

    def __init__(self, smoothing=10, min_samples=1):
        self.smoothing = smoothing
        self.min_samples = min_samples
        self.encoding_map = {}
        self.global_mean = None

    def fit(self, X, y, column):
        """Fit the encoder on training data."""
        self.global_mean = y.mean()

        # Calculate category statistics
        df = pd.DataFrame({column: X[column], 'target': y})
        agg = df.groupby(column)['target'].agg(['mean', 'count'])

        # Apply smoothing
        smoothed_mean = (
            (agg['count'] * agg['mean'] + self.smoothing * self.global_mean) /
            (agg['count'] + self.smoothing)
        )

        self.encoding_map[column] = smoothed_mean.to_dict()
        return self

    def transform(self, X, column):
        """Transform using fitted encoding."""
        return X[column].map(self.encoding_map[column]).fillna(self.global_mean)

    def fit_transform_cv(self, X, y, column, n_splits=5):
        """Apply target encoding with cross-validation to prevent leakage."""
        encoded = pd.Series(index=X.index, dtype=float)
        kf = KFold(n_splits=n_splits, shuffle=True, random_state=42)

        for train_idx, val_idx in kf.split(X):
            # Fit on training fold
            train_df = pd.DataFrame({column: X.iloc[train_idx][column], 'target': y.iloc[train_idx]})
            global_mean = y.iloc[train_idx].mean()
            agg = train_df.groupby(column)['target'].agg(['mean', 'count'])

            smoothed_mean = (
                (agg['count'] * agg['mean'] + self.smoothing * global_mean) /
                (agg['count'] + self.smoothing)
            )

            # Transform validation fold
            encoded.iloc[val_idx] = X.iloc[val_idx][column].map(smoothed_mean).fillna(global_mean)

        return encoded

# Usage example
df = pd.DataFrame({
    'category': ['A', 'B', 'A', 'C', 'B', 'A', 'C', 'B', 'A', 'C'],
    'target': [1, 0, 1, 0, 1, 1, 0, 0, 1, 1]
})

te = TargetEncoder(smoothing=2)
encoded = te.fit_transform_cv(df, df['target'], 'category')
print(f"Target encoded values: {encoded.tolist()}")
```

### Binary and Hash Encoding

```python
import hashlib

class AdvancedCategoricalEncoder:
    """Advanced encoding methods for high-cardinality features."""

    def binary_encode(self, series):
        """Binary encoding for categorical variables."""
        # Get unique categories
        categories = series.unique()
        n_categories = len(categories)

        # Calculate required bits
        n_bits = int(np.ceil(np.log2(n_categories + 1)))

        # Create mapping
        cat_to_int = {cat: i + 1 for i, cat in enumerate(categories)}

        # Convert to binary
        binary_features = pd.DataFrame()
        int_encoded = series.map(cat_to_int)

        for i in range(n_bits):
            binary_features[f'bin_{i}'] = (int_encoded >> i) & 1

        return binary_features

    def hash_encode(self, series, n_features=8):
        """Hash encoding for very high cardinality features."""
        def hash_value(val, n_features):
            hash_obj = hashlib.md5(str(val).encode())
            hash_int = int(hash_obj.hexdigest(), 16)
            return hash_int % n_features

        hashed = pd.DataFrame()
        hash_values = series.apply(lambda x: hash_value(x, n_features))

        for i in range(n_features):
            hashed[f'hash_{i}'] = (hash_values == i).astype(int)

        return hashed

# Usage example
df = pd.DataFrame({
    'product_id': ['P001', 'P002', 'P003', 'P004', 'P005', 'P001', 'P002']
})

encoder = AdvancedCategoricalEncoder()
binary_encoded = encoder.binary_encode(df['product_id'])
print("Binary encoded:")
print(binary_encoded)
```

## Feature Selection

Feature selection identifies the most relevant features for a given task, reducing dimensionality and improving model performance.

### Filter Methods

Filter methods evaluate features independently of the model:

```python
from sklearn.feature_selection import (
    SelectKBest, f_classif, f_regression,
    mutual_info_classif, mutual_info_regression,
    chi2, VarianceThreshold
)
from scipy import stats

class FilterFeatureSelector:
    """Feature selection using filter methods."""

    def variance_threshold(self, X, threshold=0.01):
        """Remove low variance features."""
        selector = VarianceThreshold(threshold=threshold)
        X_selected = selector.fit_transform(X)
        selected_features = X.columns[selector.get_support()].tolist()
        return X_selected, selected_features

    def correlation_filter(self, X, y=None, threshold=0.9):
        """Remove highly correlated features."""
        corr_matrix = X.corr().abs()
        upper = corr_matrix.where(
            np.triu(np.ones(corr_matrix.shape), k=1).astype(bool)
        )

        # Find features with correlation above threshold
        to_drop = [col for col in upper.columns if any(upper[col] > threshold)]

        return X.drop(columns=to_drop), to_drop

    def statistical_tests(self, X, y, task='classification', k=10):
        """Select features using statistical tests."""
        if task == 'classification':
            selector = SelectKBest(score_func=f_classif, k=k)
        else:
            selector = SelectKBest(score_func=f_regression, k=k)

        X_selected = selector.fit_transform(X, y)
        scores = pd.DataFrame({
            'feature': X.columns,
            'score': selector.scores_,
            'p_value': selector.pvalues_
        }).sort_values('score', ascending=False)

        return X_selected, scores

    def mutual_information(self, X, y, task='classification', k=10):
        """Select features using mutual information."""
        if task == 'classification':
            mi_scores = mutual_info_classif(X, y, random_state=42)
        else:
            mi_scores = mutual_info_regression(X, y, random_state=42)

        scores = pd.DataFrame({
            'feature': X.columns,
            'mi_score': mi_scores
        }).sort_values('mi_score', ascending=False)

        top_features = scores.head(k)['feature'].tolist()

        return X[top_features], scores

# Usage example
np.random.seed(42)
X = pd.DataFrame({
    'feature_1': np.random.randn(100),
    'feature_2': np.random.randn(100),
    'feature_3': np.random.randn(100) * 0.01,  # Low variance
    'feature_4': np.random.randn(100),
})
X['feature_5'] = X['feature_1'] + np.random.randn(100) * 0.1  # Correlated with feature_1
y = (X['feature_1'] + X['feature_2'] > 0).astype(int)

selector = FilterFeatureSelector()

# Remove low variance features
X_var, selected = selector.variance_threshold(X, threshold=0.1)
print(f"Features after variance threshold: {selected}")

# Remove correlated features
X_uncorr, dropped = selector.correlation_filter(X, threshold=0.8)
print(f"Dropped correlated features: {dropped}")
```

### Wrapper Methods

Wrapper methods use the model performance to select features:

```python
from sklearn.feature_selection import RFE, RFECV, SequentialFeatureSelector
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression

class WrapperFeatureSelector:
    """Feature selection using wrapper methods."""

    def __init__(self, estimator=None):
        self.estimator = estimator or RandomForestClassifier(n_estimators=100, random_state=42)

    def recursive_feature_elimination(self, X, y, n_features=5):
        """Select features using RFE."""
        rfe = RFE(estimator=self.estimator, n_features_to_select=n_features)
        rfe.fit(X, y)

        ranking = pd.DataFrame({
            'feature': X.columns,
            'ranking': rfe.ranking_,
            'selected': rfe.support_
        }).sort_values('ranking')

        return X.loc[:, rfe.support_], ranking

    def recursive_feature_elimination_cv(self, X, y, cv=5):
        """RFE with cross-validation to find optimal number of features."""
        rfecv = RFECV(estimator=self.estimator, cv=cv, scoring='accuracy')
        rfecv.fit(X, y)

        print(f"Optimal number of features: {rfecv.n_features_}")

        ranking = pd.DataFrame({
            'feature': X.columns,
            'ranking': rfecv.ranking_,
            'selected': rfecv.support_
        })

        return X.loc[:, rfecv.support_], ranking

    def sequential_selection(self, X, y, n_features=5, direction='forward'):
        """Forward or backward sequential feature selection."""
        sfs = SequentialFeatureSelector(
            self.estimator,
            n_features_to_select=n_features,
            direction=direction,
            cv=5
        )
        sfs.fit(X, y)

        selected_features = X.columns[sfs.get_support()].tolist()

        return X[selected_features], selected_features

# Usage example
np.random.seed(42)
X = pd.DataFrame(np.random.randn(200, 10), columns=[f'feature_{i}' for i in range(10)])
y = (X['feature_0'] + X['feature_1'] - X['feature_2'] > 0).astype(int)

selector = WrapperFeatureSelector()
X_selected, ranking = selector.recursive_feature_elimination(X, y, n_features=3)
print("RFE Feature Ranking:")
print(ranking)
```

### Embedded Methods

Embedded methods perform feature selection during model training:

```python
from sklearn.linear_model import LassoCV, ElasticNetCV
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
import xgboost as xgb

class EmbeddedFeatureSelector:
    """Feature selection using embedded methods."""

    def lasso_selection(self, X, y, cv=5):
        """Use L1 regularization for feature selection."""
        lasso = LassoCV(cv=cv, random_state=42)
        lasso.fit(X, y)

        importance = pd.DataFrame({
            'feature': X.columns,
            'coefficient': np.abs(lasso.coef_),
            'selected': lasso.coef_ != 0
        }).sort_values('coefficient', ascending=False)

        selected_features = importance[importance['selected']]['feature'].tolist()

        return X[selected_features], importance

    def tree_importance(self, X, y, model_type='rf'):
        """Use tree-based feature importance."""
        if model_type == 'rf':
            model = RandomForestClassifier(n_estimators=100, random_state=42)
        elif model_type == 'gb':
            model = GradientBoostingClassifier(n_estimators=100, random_state=42)
        else:
            model = xgb.XGBClassifier(n_estimators=100, random_state=42)

        model.fit(X, y)

        importance = pd.DataFrame({
            'feature': X.columns,
            'importance': model.feature_importances_
        }).sort_values('importance', ascending=False)

        return importance

    def permutation_importance(self, X, y, model, n_repeats=10):
        """Calculate permutation importance."""
        from sklearn.inspection import permutation_importance

        model.fit(X, y)
        result = permutation_importance(model, X, y, n_repeats=n_repeats, random_state=42)

        importance = pd.DataFrame({
            'feature': X.columns,
            'importance_mean': result.importances_mean,
            'importance_std': result.importances_std
        }).sort_values('importance_mean', ascending=False)

        return importance

# Usage example
np.random.seed(42)
X = pd.DataFrame(np.random.randn(500, 15), columns=[f'feature_{i}' for i in range(15)])
y = (X['feature_0'] + 2*X['feature_1'] - X['feature_2'] + 0.5*X['feature_3'] > 0).astype(int)

selector = EmbeddedFeatureSelector()
importance = selector.tree_importance(X, y, model_type='rf')
print("Feature Importance (Random Forest):")
print(importance.head(10))
```

## Dimensionality Reduction

Dimensionality reduction transforms high-dimensional data into lower-dimensional representations while preserving important information.

### Principal Component Analysis (PCA)

```python
from sklearn.decomposition import PCA, IncrementalPCA
import matplotlib.pyplot as plt

class PCAReducer:
    """Dimensionality reduction using PCA variants."""

    def standard_pca(self, X, n_components=None, variance_threshold=0.95):
        """Apply standard PCA."""
        if n_components is None:
            # Find components explaining variance_threshold
            pca_full = PCA()
            pca_full.fit(X)
            cumsum = np.cumsum(pca_full.explained_variance_ratio_)
            n_components = np.argmax(cumsum >= variance_threshold) + 1

        pca = PCA(n_components=n_components)
        X_reduced = pca.fit_transform(X)

        # Create DataFrame with component names
        columns = [f'PC{i+1}' for i in range(n_components)]
        X_pca = pd.DataFrame(X_reduced, columns=columns)

        # Explained variance
        explained_var = pd.DataFrame({
            'component': columns,
            'explained_variance_ratio': pca.explained_variance_ratio_,
            'cumulative_variance': np.cumsum(pca.explained_variance_ratio_)
        })

        return X_pca, explained_var, pca

    def incremental_pca(self, X, n_components, batch_size=100):
        """Apply incremental PCA for large datasets."""
        ipca = IncrementalPCA(n_components=n_components, batch_size=batch_size)
        X_reduced = ipca.fit_transform(X)
        return X_reduced, ipca

    def plot_explained_variance(self, pca, title="PCA Explained Variance"):
        """Plot explained variance ratio."""
        fig, ax = plt.subplots(1, 2, figsize=(12, 4))

        # Individual variance
        ax[0].bar(range(len(pca.explained_variance_ratio_)),
                  pca.explained_variance_ratio_)
        ax[0].set_xlabel('Principal Component')
        ax[0].set_ylabel('Explained Variance Ratio')
        ax[0].set_title('Individual Explained Variance')

        # Cumulative variance
        ax[1].plot(np.cumsum(pca.explained_variance_ratio_), 'bo-')
        ax[1].axhline(y=0.95, color='r', linestyle='--', label='95% threshold')
        ax[1].set_xlabel('Number of Components')
        ax[1].set_ylabel('Cumulative Explained Variance')
        ax[1].set_title('Cumulative Explained Variance')
        ax[1].legend()

        plt.tight_layout()
        return fig

# Usage example
np.random.seed(42)
X = pd.DataFrame(np.random.randn(500, 20), columns=[f'feature_{i}' for i in range(20)])

reducer = PCAReducer()
X_pca, explained_var, pca = reducer.standard_pca(X, variance_threshold=0.90)
print("Explained Variance:")
print(explained_var)
```

### Other Dimensionality Reduction Techniques

```python
from sklearn.decomposition import TruncatedSVD, NMF, FactorAnalysis
from sklearn.manifold import TSNE
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis

class DimensionalityReducer:
    """Various dimensionality reduction techniques."""

    def truncated_svd(self, X, n_components=10):
        """SVD for sparse matrices."""
        svd = TruncatedSVD(n_components=n_components, random_state=42)
        X_reduced = svd.fit_transform(X)
        return X_reduced, svd.explained_variance_ratio_

    def nmf(self, X, n_components=10):
        """Non-negative Matrix Factorization (requires non-negative values)."""
        X_positive = X - X.min().min()  # Ensure non-negative
        nmf = NMF(n_components=n_components, random_state=42)
        X_reduced = nmf.fit_transform(X_positive)
        return X_reduced, nmf.components_

    def lda(self, X, y, n_components=None):
        """Linear Discriminant Analysis for supervised reduction."""
        if n_components is None:
            n_components = len(np.unique(y)) - 1

        lda = LinearDiscriminantAnalysis(n_components=n_components)
        X_reduced = lda.fit_transform(X, y)
        return X_reduced, lda.explained_variance_ratio_

    def tsne(self, X, n_components=2, perplexity=30):
        """t-SNE for visualization (non-linear)."""
        tsne = TSNE(n_components=n_components, perplexity=perplexity,
                    random_state=42, n_iter=1000)
        X_reduced = tsne.fit_transform(X)
        return X_reduced

    def umap_reduction(self, X, n_components=2, n_neighbors=15):
        """UMAP for visualization and reduction."""
        try:
            import umap
            reducer = umap.UMAP(n_components=n_components,
                               n_neighbors=n_neighbors,
                               random_state=42)
            X_reduced = reducer.fit_transform(X)
            return X_reduced
        except ImportError:
            print("UMAP not installed. Install with: pip install umap-learn")
            return None

# Usage example
np.random.seed(42)
X = pd.DataFrame(np.random.randn(300, 50), columns=[f'feature_{i}' for i in range(50)])
y = np.random.randint(0, 3, 300)

reducer = DimensionalityReducer()

# t-SNE for visualization
X_tsne = reducer.tsne(X, n_components=2)
print(f"t-SNE output shape: {X_tsne.shape}")

# LDA for supervised reduction
X_lda, var_ratio = reducer.lda(X, y)
print(f"LDA output shape: {X_lda.shape}")
print(f"LDA explained variance: {var_ratio}")
```

### Autoencoders for Feature Learning

```python
import tensorflow as tf
from tensorflow.keras.layers import Input, Dense
from tensorflow.keras.models import Model

class AutoencoderReducer:
    """Use autoencoders for non-linear dimensionality reduction."""

    def __init__(self, input_dim, encoding_dim, hidden_layers=None):
        self.input_dim = input_dim
        self.encoding_dim = encoding_dim
        self.hidden_layers = hidden_layers or [128, 64]
        self.autoencoder = None
        self.encoder = None

    def build_autoencoder(self):
        """Build the autoencoder architecture."""
        # Encoder
        input_layer = Input(shape=(self.input_dim,))
        encoded = input_layer

        for units in self.hidden_layers:
            encoded = Dense(units, activation='relu')(encoded)

        encoded = Dense(self.encoding_dim, activation='relu', name='encoding')(encoded)

        # Decoder
        decoded = encoded
        for units in reversed(self.hidden_layers):
            decoded = Dense(units, activation='relu')(decoded)

        decoded = Dense(self.input_dim, activation='linear')(decoded)

        # Models
        self.autoencoder = Model(input_layer, decoded)
        self.encoder = Model(input_layer, encoded)

        self.autoencoder.compile(optimizer='adam', loss='mse')

        return self

    def fit_transform(self, X, epochs=50, batch_size=32, validation_split=0.1):
        """Train the autoencoder and return encoded features."""
        if self.autoencoder is None:
            self.build_autoencoder()

        self.autoencoder.fit(
            X, X,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=validation_split,
            verbose=0
        )

        return self.encoder.predict(X)

    def transform(self, X):
        """Transform new data using trained encoder."""
        return self.encoder.predict(X)

# Usage example
np.random.seed(42)
X = np.random.randn(1000, 100)

ae_reducer = AutoencoderReducer(input_dim=100, encoding_dim=10, hidden_layers=[64, 32])
X_encoded = ae_reducer.fit_transform(X, epochs=20)
print(f"Autoencoder output shape: {X_encoded.shape}")
```

## Best Practices and Complete Pipeline

### Complete Feature Engineering Pipeline

```python
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.feature_selection import SelectKBest, mutual_info_classif
from sklearn.decomposition import PCA

class FeatureEngineeringPipeline:
    """Complete feature engineering pipeline."""

    def __init__(self, numerical_features, categorical_features,
                 n_pca_components=None, n_select_features=None):
        self.numerical_features = numerical_features
        self.categorical_features = categorical_features
        self.n_pca_components = n_pca_components
        self.n_select_features = n_select_features
        self.pipeline = None

    def build_pipeline(self):
        """Construct the complete pipeline."""
        # Numerical preprocessing
        numerical_pipeline = Pipeline([
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ])

        # Categorical preprocessing
        categorical_pipeline = Pipeline([
            ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
            ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ])

        # Column transformer
        preprocessor = ColumnTransformer([
            ('numerical', numerical_pipeline, self.numerical_features),
            ('categorical', categorical_pipeline, self.categorical_features)
        ])

        # Build full pipeline
        steps = [('preprocessor', preprocessor)]

        if self.n_pca_components:
            steps.append(('pca', PCA(n_components=self.n_pca_components)))

        if self.n_select_features:
            steps.append(('selector', SelectKBest(
                score_func=mutual_info_classif,
                k=self.n_select_features
            )))

        self.pipeline = Pipeline(steps)
        return self

    def fit_transform(self, X, y=None):
        """Fit and transform the data."""
        if self.pipeline is None:
            self.build_pipeline()
        return self.pipeline.fit_transform(X, y)

    def transform(self, X):
        """Transform new data."""
        return self.pipeline.transform(X)

# Usage example
np.random.seed(42)
df = pd.DataFrame({
    'age': np.random.randint(18, 70, 500),
    'income': np.random.exponential(50000, 500),
    'score': np.random.randn(500) * 10 + 50,
    'education': np.random.choice(['HS', 'Bachelor', 'Master', 'PhD'], 500),
    'region': np.random.choice(['North', 'South', 'East', 'West'], 500)
})
y = (df['income'] > 50000).astype(int)

pipeline = FeatureEngineeringPipeline(
    numerical_features=['age', 'income', 'score'],
    categorical_features=['education', 'region'],
    n_pca_components=5
)

X_transformed = pipeline.fit_transform(df, y)
print(f"Transformed shape: {X_transformed.shape}")
```

### Feature Engineering Best Practices

**Key Guidelines:**

1. **Understand Your Data**: Always start with exploratory data analysis to understand distributions, missing values, and relationships.

2. **Handle Missing Values Appropriately**: Choose imputation strategies based on the nature of missingness (MCAR, MAR, MNAR).

3. **Address Outliers**: Decide whether to remove, cap, or transform outliers based on domain knowledge.

4. **Prevent Data Leakage**: Always fit transformers on training data only, then apply to test data.

5. **Use Cross-Validation**: When using target-based encoding, use cross-validation to prevent overfitting.

6. **Domain Knowledge**: Incorporate domain expertise to create meaningful features.

7. **Iterate and Experiment**: Feature engineering is iterative; continuously test and refine features.

```python
# Example: Preventing data leakage
from sklearn.model_selection import train_test_split

def proper_feature_engineering(X, y):
    """Demonstrate proper train/test split with feature engineering."""
    # Split data FIRST
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Fit transformers on training data only
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)  # Only transform, don't fit

    return X_train_scaled, X_test_scaled, y_train, y_test
```

## Conclusion

Feature engineering is a critical skill that separates good machine learning practitioners from great ones. The techniques covered in this guide provide a comprehensive toolkit for transforming raw data into meaningful features that improve model performance.

Key takeaways:

1. **Feature Extraction** creates new features from raw data sources like text, dates, and images
2. **Feature Transformation** modifies existing features through scaling, mathematical operations, and binning
3. **Categorical Encoding** converts non-numerical data into formats suitable for machine learning
4. **Feature Selection** identifies the most relevant features while reducing noise and overfitting
5. **Dimensionality Reduction** compresses high-dimensional data while preserving important information

Remember that feature engineering is both an art and a science. While these techniques provide a strong foundation, the most effective features often come from deep domain understanding and creative problem-solving. Continuously experiment, validate your features using cross-validation, and iterate to build the best possible models.

By mastering these techniques and applying them thoughtfully, you will significantly improve your machine learning models and gain deeper insights into your data.
