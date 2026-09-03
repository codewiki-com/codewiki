---
title: "Feature Engineering: Feature Extraction"
description: "Master feature extraction methods for different data types: numerical, categorical, text, and time features"
track: datascience
section: classical-ml
difficulty: intermediate
tags:
  - feature extraction
  - feature engineering
  - data processing
  - ML
status: imported
origin: old/src/content/docs/datascience/feature-extraction.en.md
divergence: 0.276
issues: []
legacy:
  category: DataScience
  subcategory: FeatureEngineering
  order: 8
  lastUpdated: 2026-01-07
---

Feature extraction is the process of transforming raw data into meaningful numerical representations that machine learning algorithms can understand and learn from effectively. It is arguably the most critical step in the machine learning pipeline, often having a greater impact on model performance than the choice of algorithm itself.

This comprehensive guide covers feature extraction techniques for all major data types: numerical, categorical, text, time series, and images.

## Why Feature Extraction Matters

Raw data rarely comes in a format suitable for machine learning models. Feature extraction bridges the gap between raw data and model-ready inputs by:

- **Reducing dimensionality**: Extracting the most informative signals from high-dimensional data
- **Encoding semantics**: Converting categorical and textual data into numerical representations
- **Capturing patterns**: Deriving features that highlight underlying patterns in the data
- **Improving model performance**: Well-crafted features often outperform complex models with poor features

```python
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import OneHotEncoder, LabelEncoder
import warnings
warnings.filterwarnings('ignore')

# Sample dataset for demonstrations
np.random.seed(42)
sample_data = pd.DataFrame({
    'age': [25, 32, 47, 51, 62, 28, 35, 41],
    'income': [50000, 75000, 120000, 95000, 88000, 62000, 85000, 105000],
    'city': ['New York', 'Los Angeles', 'Chicago', 'New York', 'Chicago', 'Los Angeles', 'New York', 'Chicago'],
    'education': ['Bachelor', 'Master', 'PhD', 'Bachelor', 'Master', 'Bachelor', 'PhD', 'Master'],
    'purchase_date': pd.date_range('2024-01-01', periods=8, freq='W'),
    'product_review': [
        'Great product, highly recommend!',
        'Average quality, nothing special',
        'Excellent value for money',
        'Poor customer service',
        'Best purchase ever made',
        'Not worth the price',
        'Fantastic features and design',
        'Decent product overall'
    ]
})
print(sample_data.head())
```

---

## Numerical Feature Processing

Numerical features require careful preprocessing to ensure models can learn effectively from them. Different algorithms have different sensitivities to feature scales and distributions.

### Standardization (Z-Score Normalization)

Standardization transforms features to have zero mean and unit variance. This is essential for algorithms that assume normally distributed data or are sensitive to feature magnitudes.

**When to use:**
- Linear regression, logistic regression
- Support Vector Machines (SVM)
- Principal Component Analysis (PCA)
- Neural networks
- K-means clustering

```python
from sklearn.preprocessing import StandardScaler

# Sample numerical data
numerical_data = sample_data[['age', 'income']].copy()

# Apply standardization
scaler = StandardScaler()
standardized = scaler.fit_transform(numerical_data)
standardized_df = pd.DataFrame(standardized, columns=['age_std', 'income_std'])

print("Original Data Statistics:")
print(numerical_data.describe())
print("\nStandardized Data Statistics:")
print(standardized_df.describe())

# The formula: z = (x - mean) / std
# Manual verification
print(f"\nManual calculation for age:")
print(f"Mean: {numerical_data['age'].mean():.2f}, Std: {numerical_data['age'].std():.2f}")
print(f"First value standardized: {(numerical_data['age'].iloc[0] - numerical_data['age'].mean()) / numerical_data['age'].std():.4f}")
```

### Min-Max Normalization

Min-Max scaling transforms features to a fixed range, typically [0, 1]. This preserves the original distribution shape while bounding values.

**When to use:**
- Neural networks (especially with sigmoid/tanh activations)
- Image pixel values
- When you need bounded outputs
- K-Nearest Neighbors (distance-based)

```python
from sklearn.preprocessing import MinMaxScaler

# Apply Min-Max scaling
minmax_scaler = MinMaxScaler(feature_range=(0, 1))
normalized = minmax_scaler.fit_transform(numerical_data)
normalized_df = pd.DataFrame(normalized, columns=['age_norm', 'income_norm'])

print("Min-Max Normalized Data:")
print(normalized_df.describe())

# Custom range example
custom_scaler = MinMaxScaler(feature_range=(-1, 1))
custom_normalized = custom_scaler.fit_transform(numerical_data)
print("\nCustom Range [-1, 1] Normalized:")
print(pd.DataFrame(custom_normalized, columns=['age', 'income']).describe())
```

### Robust Scaling

Robust scaling uses median and interquartile range (IQR) instead of mean and standard deviation, making it resistant to outliers.

**When to use:**
- Data with significant outliers
- When you cannot remove outliers
- Financial data with extreme values

```python
from sklearn.preprocessing import RobustScaler

# Create data with outliers
data_with_outliers = numerical_data.copy()
data_with_outliers.loc[0, 'income'] = 1000000  # Add outlier

# Compare Standard vs Robust scaling
standard_scaled = StandardScaler().fit_transform(data_with_outliers)
robust_scaled = RobustScaler().fit_transform(data_with_outliers)

print("With Outlier - Standard Scaling:")
print(pd.DataFrame(standard_scaled, columns=['age', 'income']).describe())

print("\nWith Outlier - Robust Scaling:")
print(pd.DataFrame(robust_scaled, columns=['age', 'income']).describe())
```

### Log Transformation

Log transformation is useful for handling right-skewed distributions and reducing the impact of extreme values.

**When to use:**
- Income, prices, counts (naturally right-skewed)
- Data spanning multiple orders of magnitude
- When you need to stabilize variance

```python
# Log transformation for skewed data
skewed_data = pd.DataFrame({
    'original': [100, 1000, 10000, 100000, 1000000],
})

# Apply log transformations
skewed_data['log'] = np.log(skewed_data['original'])
skewed_data['log1p'] = np.log1p(skewed_data['original'])  # log(1 + x), handles zeros
skewed_data['log10'] = np.log10(skewed_data['original'])

print("Log Transformations:")
print(skewed_data)

# Box-Cox transformation (requires positive values)
from sklearn.preprocessing import PowerTransformer

power_transformer = PowerTransformer(method='box-cox')  # or 'yeo-johnson' for any data
positive_data = numerical_data[['income']].values
transformed = power_transformer.fit_transform(positive_data)
print(f"\nBox-Cox lambda: {power_transformer.lambdas_}")
```

### Binning (Discretization)

Binning converts continuous features into discrete categories, which can capture non-linear relationships and reduce noise.

**When to use:**
- Age groups, income brackets
- When continuous relationships are not linear
- Decision trees and rule-based systems
- Reducing noise in noisy features

```python
from sklearn.preprocessing import KBinsDiscretizer

# Different binning strategies
strategies = ['uniform', 'quantile', 'kmeans']

age_data = numerical_data[['age']].values

for strategy in strategies:
    discretizer = KBinsDiscretizer(n_bins=4, encode='ordinal', strategy=strategy)
    binned = discretizer.fit_transform(age_data)
    print(f"\n{strategy.upper()} Binning:")
    print(f"Bin edges: {discretizer.bin_edges_[0]}")
    print(f"Binned values: {binned.flatten()}")

# Manual binning with pandas
sample_data['age_group'] = pd.cut(
    sample_data['age'],
    bins=[0, 30, 45, 60, 100],
    labels=['Young', 'Middle', 'Senior', 'Elder']
)
print("\nManual Age Groups:")
print(sample_data[['age', 'age_group']])
```

### Polynomial Features

Polynomial features capture non-linear relationships and interactions between features.

```python
from sklearn.preprocessing import PolynomialFeatures

# Create polynomial features
poly = PolynomialFeatures(degree=2, include_bias=False, interaction_only=False)
poly_features = poly.fit_transform(numerical_data)

print(f"Original features: {numerical_data.columns.tolist()}")
print(f"Polynomial feature names: {poly.get_feature_names_out()}")
print(f"Original shape: {numerical_data.shape}")
print(f"Polynomial shape: {poly_features.shape}")

# Interaction-only features (no powers)
poly_interaction = PolynomialFeatures(degree=2, include_bias=False, interaction_only=True)
interaction_features = poly_interaction.fit_transform(numerical_data)
print(f"\nInteraction-only features: {poly_interaction.get_feature_names_out()}")
```

---

## Categorical Feature Encoding

Categorical features must be converted to numerical representations. The choice of encoding method significantly impacts model performance.

### One-Hot Encoding

One-Hot encoding creates binary columns for each category. It is the most common encoding for nominal (unordered) categories.

**When to use:**
- Nominal categories (no natural ordering)
- Linear models, neural networks
- When categories are independent

**Limitations:**
- Creates high-dimensional sparse data for high-cardinality features
- Does not capture relationships between categories

```python
from sklearn.preprocessing import OneHotEncoder

# One-Hot encoding
categorical_data = sample_data[['city', 'education']]

# Scikit-learn OneHotEncoder
encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
encoded = encoder.fit_transform(categorical_data)
encoded_df = pd.DataFrame(
    encoded,
    columns=encoder.get_feature_names_out()
)

print("One-Hot Encoded Features:")
print(encoded_df)

# Pandas get_dummies (simpler for DataFrames)
dummies = pd.get_dummies(categorical_data, prefix=['city', 'edu'])
print("\nPandas get_dummies:")
print(dummies)

# Drop first to avoid multicollinearity (for linear models)
dummies_dropped = pd.get_dummies(categorical_data, drop_first=True)
print("\nWith drop_first=True:")
print(dummies_dropped)
```

### Label Encoding

Label encoding assigns a unique integer to each category. It is suitable for ordinal categories or tree-based models.

**When to use:**
- Ordinal categories (natural ordering)
- Tree-based models (Random Forest, XGBoost)
- Target variable encoding

**Caution:**
- Implies ordinal relationship even when none exists
- Not suitable for linear models with nominal categories

```python
from sklearn.preprocessing import LabelEncoder, OrdinalEncoder

# Label Encoding (single column)
label_encoder = LabelEncoder()
sample_data['city_encoded'] = label_encoder.fit_transform(sample_data['city'])
print("Label Encoded Cities:")
print(sample_data[['city', 'city_encoded']])
print(f"Classes: {label_encoder.classes_}")

# Ordinal Encoding with custom order
education_order = [['Bachelor', 'Master', 'PhD']]
ordinal_encoder = OrdinalEncoder(categories=education_order)
sample_data['education_encoded'] = ordinal_encoder.fit_transform(
    sample_data[['education']]
)
print("\nOrdinal Encoded Education:")
print(sample_data[['education', 'education_encoded']])
```

### Target Encoding (Mean Encoding)

Target encoding replaces categories with the mean of the target variable for that category. It is powerful for high-cardinality features.

**When to use:**
- High-cardinality categorical features
- Competition settings (Kaggle)
- When categories have predictive relationships with target

**Caution:**
- Risk of data leakage - must use cross-validation
- Can overfit on rare categories

```python
# Target Encoding implementation
def target_encode(df, column, target, smoothing=1.0):
    """
    Target encoding with smoothing to handle rare categories.

    smoothing: weight given to global mean vs category mean
    """
    global_mean = df[target].mean()

    # Calculate category statistics
    agg = df.groupby(column)[target].agg(['mean', 'count'])

    # Apply smoothing: weighted average of category mean and global mean
    # More samples -> more weight to category mean
    smoothed_mean = (agg['count'] * agg['mean'] + smoothing * global_mean) / (agg['count'] + smoothing)

    return df[column].map(smoothed_mean)

# Example with synthetic target
sample_data['purchased'] = [1, 0, 1, 0, 1, 0, 1, 1]

sample_data['city_target_encoded'] = target_encode(
    sample_data, 'city', 'purchased', smoothing=1.0
)
print("Target Encoded Cities:")
print(sample_data[['city', 'purchased', 'city_target_encoded']])

# Using category_encoders library (recommended for production)
# pip install category_encoders
try:
    from category_encoders import TargetEncoder

    target_enc = TargetEncoder(smoothing=1.0)
    sample_data['city_target_enc'] = target_enc.fit_transform(
        sample_data['city'], sample_data['purchased']
    )
    print("\nUsing category_encoders TargetEncoder:")
    print(sample_data[['city', 'city_target_enc']])
except ImportError:
    print("category_encoders not installed")
```

### Frequency Encoding

Frequency encoding replaces categories with their frequency (count or proportion) in the dataset.

**When to use:**
- When category frequency correlates with target
- Alternative to target encoding (no leakage risk)
- Tree-based models

```python
def frequency_encode(df, column, normalize=True):
    """
    Frequency encoding: replace categories with their frequency.
    """
    freq = df[column].value_counts(normalize=normalize)
    return df[column].map(freq)

sample_data['city_freq'] = frequency_encode(sample_data, 'city', normalize=True)
print("Frequency Encoded Cities:")
print(sample_data[['city', 'city_freq']])
```

### Binary Encoding

Binary encoding represents categories as binary digits, reducing dimensionality compared to one-hot encoding.

**When to use:**
- High-cardinality features (many unique values)
- When one-hot creates too many columns
- Memory-constrained environments

```python
def binary_encode(df, column):
    """
    Binary encoding: represent categories as binary numbers.
    """
    # First, label encode
    label_encoder = LabelEncoder()
    labels = label_encoder.fit_transform(df[column])

    # Calculate number of binary digits needed
    n_digits = int(np.ceil(np.log2(len(label_encoder.classes_) + 1)))

    # Convert to binary representation
    binary_cols = []
    for i in range(n_digits):
        binary_cols.append((labels >> i) & 1)

    binary_df = pd.DataFrame(
        np.column_stack(binary_cols),
        columns=[f'{column}_bin_{i}' for i in range(n_digits)]
    )
    return binary_df

binary_encoded = binary_encode(sample_data, 'city')
print("Binary Encoded Cities:")
print(pd.concat([sample_data[['city']], binary_encoded], axis=1))
```

### Comparison of Encoding Methods

| Method | Cardinality | Pros | Cons | Best For |
|--------|-------------|------|------|----------|
| One-Hot | Low | Simple, no assumptions | High dimensionality | Nominal, low cardinality |
| Label | Any | Compact | Implies ordering | Ordinal, tree models |
| Target | High | Captures target relationship | Leakage risk | High cardinality |
| Frequency | High | No leakage | May not capture target info | Tree models |
| Binary | High | Compact representation | Less interpretable | Memory-constrained |

---

## Text Feature Extraction

Text data requires specialized techniques to convert unstructured text into numerical features that capture semantic meaning.

### Bag of Words (CountVectorizer)

Bag of Words represents text as word frequency counts, ignoring word order.

```python
from sklearn.feature_extraction.text import CountVectorizer

reviews = sample_data['product_review'].tolist()

# Basic Count Vectorizer
count_vec = CountVectorizer()
bow_matrix = count_vec.fit_transform(reviews)

print("Vocabulary:")
print(count_vec.get_feature_names_out())
print(f"\nBoW Matrix Shape: {bow_matrix.shape}")
print("\nBoW Matrix (dense):")
print(pd.DataFrame(
    bow_matrix.toarray(),
    columns=count_vec.get_feature_names_out()
))

# With preprocessing options
count_vec_custom = CountVectorizer(
    lowercase=True,
    stop_words='english',
    max_features=20,
    ngram_range=(1, 2),  # Unigrams and bigrams
    min_df=1,  # Minimum document frequency
    max_df=0.9  # Maximum document frequency (remove too common words)
)
bow_custom = count_vec_custom.fit_transform(reviews)
print(f"\nCustom BoW features: {count_vec_custom.get_feature_names_out()}")
```

### TF-IDF (Term Frequency-Inverse Document Frequency)

TF-IDF weights words by their importance in a document relative to the entire corpus. It reduces the weight of common words and emphasizes distinctive terms.

**Formula:**
- TF(t,d) = frequency of term t in document d
- IDF(t) = log(N / df(t)), where N = total documents, df(t) = documents containing t
- TF-IDF(t,d) = TF(t,d) * IDF(t)

```python
from sklearn.feature_extraction.text import TfidfVectorizer

# Basic TF-IDF
tfidf_vec = TfidfVectorizer()
tfidf_matrix = tfidf_vec.fit_transform(reviews)

print("TF-IDF Vocabulary:")
print(tfidf_vec.get_feature_names_out())
print(f"\nTF-IDF Matrix Shape: {tfidf_matrix.shape}")

# Display TF-IDF scores
tfidf_df = pd.DataFrame(
    tfidf_matrix.toarray(),
    columns=tfidf_vec.get_feature_names_out()
)
print("\nTF-IDF Scores (sample):")
print(tfidf_df.iloc[:3, :10])

# Advanced TF-IDF configuration
tfidf_advanced = TfidfVectorizer(
    lowercase=True,
    stop_words='english',
    ngram_range=(1, 3),
    max_features=100,
    min_df=1,
    max_df=0.85,
    sublinear_tf=True,  # Use log(1 + tf) instead of tf
    norm='l2'  # L2 normalization
)
tfidf_advanced_matrix = tfidf_advanced.fit_transform(reviews)
print(f"\nAdvanced TF-IDF shape: {tfidf_advanced_matrix.shape}")
print(f"Features: {tfidf_advanced.get_feature_names_out()}")
```

### Word Embeddings (Word2Vec, GloVe)

Word embeddings represent words as dense vectors that capture semantic relationships. Words with similar meanings have similar vectors.

```python
# Using Gensim for Word2Vec
try:
    from gensim.models import Word2Vec
    from nltk.tokenize import word_tokenize
    import nltk
    nltk.download('punkt', quiet=True)

    # Tokenize reviews
    tokenized_reviews = [word_tokenize(review.lower()) for review in reviews]

    # Train Word2Vec model
    w2v_model = Word2Vec(
        sentences=tokenized_reviews,
        vector_size=50,  # Embedding dimension
        window=3,  # Context window
        min_count=1,  # Minimum word frequency
        workers=4,
        epochs=100
    )

    # Get word vector
    if 'product' in w2v_model.wv:
        print("Word vector for 'product':")
        print(w2v_model.wv['product'][:10])  # First 10 dimensions

    # Document embedding: average of word vectors
    def get_document_vector(text, model, vector_size=50):
        words = word_tokenize(text.lower())
        word_vectors = [model.wv[word] for word in words if word in model.wv]
        if word_vectors:
            return np.mean(word_vectors, axis=0)
        return np.zeros(vector_size)

    doc_vectors = np.array([get_document_vector(review, w2v_model) for review in reviews])
    print(f"\nDocument vectors shape: {doc_vectors.shape}")

except ImportError:
    print("Gensim not installed. Install with: pip install gensim")
```

### Pre-trained Embeddings (Sentence Transformers)

Pre-trained models like BERT and Sentence Transformers provide high-quality embeddings without training.

```python
# Using Sentence Transformers for document embeddings
try:
    from sentence_transformers import SentenceTransformer

    # Load pre-trained model
    model = SentenceTransformer('all-MiniLM-L6-v2')

    # Generate embeddings
    embeddings = model.encode(reviews)

    print(f"Sentence embeddings shape: {embeddings.shape}")
    print(f"First review embedding (first 10 dims): {embeddings[0][:10]}")

    # Calculate similarity between reviews
    from sklearn.metrics.pairwise import cosine_similarity
    similarity_matrix = cosine_similarity(embeddings)
    print(f"\nSimilarity between review 0 and review 2: {similarity_matrix[0][2]:.4f}")

except ImportError:
    print("sentence-transformers not installed. Install with: pip install sentence-transformers")
```

### Text Feature Engineering Best Practices

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer

# Comprehensive text feature extraction pipeline
def create_text_features(texts):
    """
    Extract multiple text features from a list of texts.
    """
    features = pd.DataFrame()

    # Basic statistics
    features['char_count'] = [len(text) for text in texts]
    features['word_count'] = [len(text.split()) for text in texts]
    features['avg_word_length'] = [
        np.mean([len(word) for word in text.split()]) if text.split() else 0
        for text in texts
    ]

    # Punctuation and special characters
    features['exclamation_count'] = [text.count('!') for text in texts]
    features['question_count'] = [text.count('?') for text in texts]
    features['uppercase_ratio'] = [
        sum(1 for c in text if c.isupper()) / len(text) if text else 0
        for text in texts
    ]

    # Sentiment indicators (simple)
    positive_words = ['great', 'excellent', 'best', 'fantastic', 'good', 'love']
    negative_words = ['poor', 'bad', 'worst', 'terrible', 'hate', 'awful']

    features['positive_word_count'] = [
        sum(1 for word in text.lower().split() if word in positive_words)
        for text in texts
    ]
    features['negative_word_count'] = [
        sum(1 for word in text.lower().split() if word in negative_words)
        for text in texts
    ]

    return features

text_features = create_text_features(reviews)
print("Engineered Text Features:")
print(text_features)
```

---

## Time Feature Extraction

Time-based features are crucial for capturing temporal patterns, seasonality, and trends in time series data.

### Basic DateTime Components

```python
# Create time-based sample data
time_data = pd.DataFrame({
    'timestamp': pd.date_range('2024-01-01', periods=100, freq='H'),
    'value': np.random.randn(100).cumsum()
})

# Extract datetime components
time_data['year'] = time_data['timestamp'].dt.year
time_data['month'] = time_data['timestamp'].dt.month
time_data['day'] = time_data['timestamp'].dt.day
time_data['hour'] = time_data['timestamp'].dt.hour
time_data['minute'] = time_data['timestamp'].dt.minute
time_data['dayofweek'] = time_data['timestamp'].dt.dayofweek  # 0=Monday
time_data['dayofyear'] = time_data['timestamp'].dt.dayofyear
time_data['weekofyear'] = time_data['timestamp'].dt.isocalendar().week
time_data['quarter'] = time_data['timestamp'].dt.quarter

print("DateTime Components:")
print(time_data[['timestamp', 'year', 'month', 'day', 'hour', 'dayofweek']].head(10))
```

### Cyclical Encoding

For cyclical features (hour, day of week, month), linear encoding does not capture the cyclical nature. Sine/cosine encoding preserves cyclical relationships.

```python
def cyclical_encode(df, column, max_value):
    """
    Encode cyclical features using sine and cosine transformations.

    This ensures that values at the beginning and end of the cycle
    are close together (e.g., hour 23 is close to hour 0).
    """
    df[f'{column}_sin'] = np.sin(2 * np.pi * df[column] / max_value)
    df[f'{column}_cos'] = np.cos(2 * np.pi * df[column] / max_value)
    return df

# Apply cyclical encoding
time_data = cyclical_encode(time_data, 'hour', 24)
time_data = cyclical_encode(time_data, 'dayofweek', 7)
time_data = cyclical_encode(time_data, 'month', 12)

print("Cyclical Encoding for Hour:")
print(time_data[['hour', 'hour_sin', 'hour_cos']].drop_duplicates().sort_values('hour'))
```

### Time-Based Aggregations

```python
# Create sample transaction data
np.random.seed(42)
transactions = pd.DataFrame({
    'timestamp': pd.date_range('2024-01-01', periods=1000, freq='H'),
    'amount': np.random.exponential(100, 1000),
    'user_id': np.random.randint(1, 50, 1000)
})

# Rolling window features
transactions = transactions.sort_values('timestamp')
transactions['amount_rolling_mean_24h'] = transactions['amount'].rolling(window=24).mean()
transactions['amount_rolling_std_24h'] = transactions['amount'].rolling(window=24).std()
transactions['amount_rolling_max_24h'] = transactions['amount'].rolling(window=24).max()

# Expanding window features (cumulative)
transactions['amount_cumsum'] = transactions['amount'].cumsum()
transactions['amount_cummax'] = transactions['amount'].expanding().max()

# Lag features
transactions['amount_lag_1h'] = transactions['amount'].shift(1)
transactions['amount_lag_24h'] = transactions['amount'].shift(24)

# Difference features
transactions['amount_diff_1h'] = transactions['amount'].diff(1)
transactions['amount_pct_change'] = transactions['amount'].pct_change()

print("Time-Based Features:")
print(transactions[['timestamp', 'amount', 'amount_rolling_mean_24h',
                    'amount_lag_1h', 'amount_diff_1h']].head(30))
```

### Time Since Events

```python
# Time since specific events
def time_since_event(df, timestamp_col, event_dates):
    """
    Calculate time since the most recent event.
    """
    features = pd.DataFrame(index=df.index)

    for event_name, event_date in event_dates.items():
        event_date = pd.to_datetime(event_date)
        features[f'days_since_{event_name}'] = (
            df[timestamp_col] - event_date
        ).dt.total_seconds() / (24 * 3600)

    return features

# Example events
events = {
    'new_year': '2024-01-01',
    'promotion_start': '2024-01-15',
}

event_features = time_since_event(transactions, 'timestamp', events)
print("Time Since Events:")
print(pd.concat([transactions[['timestamp']], event_features], axis=1).head(10))
```

### Holiday and Special Day Features

```python
def create_holiday_features(df, date_col):
    """
    Create features for holidays and special days.
    """
    features = pd.DataFrame(index=df.index)
    dates = pd.to_datetime(df[date_col])

    # Weekend indicator
    features['is_weekend'] = dates.dt.dayofweek.isin([5, 6]).astype(int)

    # Month start/end
    features['is_month_start'] = dates.dt.is_month_start.astype(int)
    features['is_month_end'] = dates.dt.is_month_end.astype(int)

    # Quarter start/end
    features['is_quarter_start'] = dates.dt.is_quarter_start.astype(int)
    features['is_quarter_end'] = dates.dt.is_quarter_end.astype(int)

    # Simple holiday detection (extend with actual holiday calendar)
    # Using US holidays as example
    us_holidays = [
        '2024-01-01',  # New Year
        '2024-01-15',  # MLK Day
        '2024-02-19',  # Presidents Day
        '2024-07-04',  # Independence Day
        '2024-12-25',  # Christmas
    ]
    features['is_holiday'] = dates.dt.strftime('%Y-%m-%d').isin(us_holidays).astype(int)

    return features

holiday_features = create_holiday_features(transactions, 'timestamp')
print("Holiday Features:")
print(pd.concat([transactions[['timestamp']], holiday_features], axis=1).head(10))
```

---

## Image Feature Extraction

Image features can be extracted using traditional computer vision techniques or deep learning approaches.

### Basic Image Statistics

```python
# Basic image feature extraction (without deep learning)
try:
    from PIL import Image
    import numpy as np

    def extract_basic_image_features(image_path):
        """
        Extract basic statistical features from an image.
        """
        img = Image.open(image_path)
        img_array = np.array(img)

        features = {}

        # Dimensions
        features['width'] = img.width
        features['height'] = img.height
        features['aspect_ratio'] = img.width / img.height
        features['total_pixels'] = img.width * img.height

        # Color statistics (if RGB)
        if len(img_array.shape) == 3:
            for i, channel in enumerate(['red', 'green', 'blue']):
                features[f'{channel}_mean'] = img_array[:, :, i].mean()
                features[f'{channel}_std'] = img_array[:, :, i].std()
                features[f'{channel}_min'] = img_array[:, :, i].min()
                features[f'{channel}_max'] = img_array[:, :, i].max()

        # Overall brightness
        if len(img_array.shape) == 3:
            gray = np.mean(img_array, axis=2)
        else:
            gray = img_array
        features['brightness_mean'] = gray.mean()
        features['brightness_std'] = gray.std()

        return features

    # Example usage (uncomment with actual image)
    # features = extract_basic_image_features('sample_image.jpg')
    # print(features)
    print("Basic image feature extraction function defined.")

except ImportError:
    print("PIL not installed. Install with: pip install Pillow")
```

### CNN Feature Extraction (Transfer Learning)

Pre-trained CNN models provide powerful feature extractors for images.

```python
# CNN feature extraction using pre-trained models
try:
    import torch
    import torchvision.models as models
    import torchvision.transforms as transforms
    from PIL import Image

    class CNNFeatureExtractor:
        """
        Extract features from images using pre-trained CNN models.
        """
        def __init__(self, model_name='resnet50'):
            # Load pre-trained model
            if model_name == 'resnet50':
                self.model = models.resnet50(pretrained=True)
                # Remove the final classification layer
                self.model = torch.nn.Sequential(*list(self.model.children())[:-1])
                self.feature_dim = 2048
            elif model_name == 'vgg16':
                self.model = models.vgg16(pretrained=True)
                self.model = self.model.features
                self.feature_dim = 512 * 7 * 7

            self.model.set_to_evaluation_mode()

            # Standard ImageNet preprocessing
            self.transform = transforms.Compose([
                transforms.Resize(256),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225]
                )
            ])

        def extract_features(self, image_path):
            """Extract features from a single image."""
            img = Image.open(image_path).convert('RGB')
            img_tensor = self.transform(img).unsqueeze(0)

            with torch.no_grad():
                features = self.model(img_tensor)

            return features.squeeze().numpy()

        def extract_batch_features(self, image_paths):
            """Extract features from multiple images."""
            features_list = []
            for path in image_paths:
                features = self.extract_features(path)
                features_list.append(features.flatten())
            return np.array(features_list)

    # Example usage
    # extractor = CNNFeatureExtractor('resnet50')
    # features = extractor.extract_features('image.jpg')
    print("CNN Feature Extractor class defined.")
    print("Feature dimensions: ResNet50=2048, VGG16=25088")

except ImportError:
    print("PyTorch not installed. Install with: pip install torch torchvision")
```

### Histogram of Oriented Gradients (HOG)

HOG is a traditional computer vision technique for feature extraction, particularly useful for object detection.

```python
try:
    from skimage.feature import hog
    from skimage import io, color
    import numpy as np

    def extract_hog_features(image_path, pixels_per_cell=(8, 8), cells_per_block=(2, 2)):
        """
        Extract HOG features from an image.
        """
        # Read and convert to grayscale
        image = io.imread(image_path)
        if len(image.shape) == 3:
            image = color.rgb2gray(image)

        # Extract HOG features
        features, hog_image = hog(
            image,
            orientations=9,
            pixels_per_cell=pixels_per_cell,
            cells_per_block=cells_per_block,
            visualize=True,
            feature_vector=True
        )

        return features, hog_image

    # Example usage (uncomment with actual image)
    # features, hog_img = extract_hog_features('sample.jpg')
    # print(f"HOG feature vector length: {len(features)}")
    print("HOG feature extraction function defined.")

except ImportError:
    print("scikit-image not installed. Install with: pip install scikit-image")
```

---

## Feature Combinations and Interactions

Creating feature combinations can capture complex relationships that individual features cannot represent.

### Arithmetic Combinations

```python
# Sample data for feature combinations
combo_data = pd.DataFrame({
    'price': [100, 200, 150, 300, 250],
    'quantity': [10, 5, 8, 3, 6],
    'discount_pct': [0.1, 0.2, 0.15, 0.05, 0.1],
    'shipping_cost': [10, 15, 12, 20, 18]
})

# Arithmetic combinations
combo_data['total_value'] = combo_data['price'] * combo_data['quantity']
combo_data['discounted_price'] = combo_data['price'] * (1 - combo_data['discount_pct'])
combo_data['price_per_unit_with_shipping'] = (
    (combo_data['price'] + combo_data['shipping_cost']) / combo_data['quantity']
)
combo_data['discount_amount'] = combo_data['price'] * combo_data['discount_pct']
combo_data['shipping_ratio'] = combo_data['shipping_cost'] / combo_data['price']

print("Arithmetic Feature Combinations:")
print(combo_data)
```

### Statistical Combinations

```python
# Statistical combinations across features
def create_statistical_combinations(df, numeric_cols):
    """
    Create statistical combination features.
    """
    features = pd.DataFrame(index=df.index)

    # Row-wise statistics
    features['row_mean'] = df[numeric_cols].mean(axis=1)
    features['row_std'] = df[numeric_cols].std(axis=1)
    features['row_min'] = df[numeric_cols].min(axis=1)
    features['row_max'] = df[numeric_cols].max(axis=1)
    features['row_range'] = features['row_max'] - features['row_min']
    features['row_sum'] = df[numeric_cols].sum(axis=1)

    # Relative features
    for col in numeric_cols:
        features[f'{col}_vs_mean'] = df[col] / features['row_mean']
        features[f'{col}_zscore'] = (df[col] - features['row_mean']) / features['row_std']

    return features

numeric_cols = ['price', 'quantity', 'discount_pct', 'shipping_cost']
stat_features = create_statistical_combinations(combo_data, numeric_cols)
print("\nStatistical Combinations:")
print(stat_features[['row_mean', 'row_std', 'row_range', 'price_vs_mean']])
```

### Categorical Interaction Features

```python
# Categorical interaction features
interaction_data = pd.DataFrame({
    'category': ['A', 'B', 'A', 'C', 'B', 'A'],
    'region': ['East', 'West', 'East', 'West', 'East', 'West'],
    'channel': ['Online', 'Store', 'Online', 'Store', 'Online', 'Store'],
    'sales': [100, 150, 120, 180, 140, 160]
})

# Create interaction features
interaction_data['category_region'] = (
    interaction_data['category'] + '_' + interaction_data['region']
)
interaction_data['full_segment'] = (
    interaction_data['category'] + '_' +
    interaction_data['region'] + '_' +
    interaction_data['channel']
)

print("Categorical Interactions:")
print(interaction_data)

# Target statistics by interaction groups
interaction_stats = interaction_data.groupby('category_region')['sales'].agg(['mean', 'count'])
interaction_data['category_region_mean_sales'] = interaction_data['category_region'].map(
    interaction_stats['mean']
)
print("\nWith Target Statistics:")
print(interaction_data)
```

---

## Complete Scikit-learn Pipeline

Scikit-learn pipelines ensure reproducible preprocessing and prevent data leakage.

### Column Transformer for Mixed Data Types

```python
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

# Create a complete dataset
complete_data = pd.DataFrame({
    'age': [25, 32, np.nan, 51, 62, 28, 35, 41],
    'income': [50000, 75000, 120000, np.nan, 88000, 62000, 85000, 105000],
    'city': ['New York', 'Los Angeles', 'Chicago', 'New York', 'Chicago', 'Los Angeles', 'New York', 'Chicago'],
    'education': ['Bachelor', 'Master', 'PhD', 'Bachelor', 'Master', 'Bachelor', 'PhD', 'Master'],
    'review': [
        'Great product!', 'Average quality', 'Excellent value',
        'Poor service', 'Best ever', 'Not worth it', 'Fantastic', 'Decent'
    ],
    'purchased': [1, 0, 1, 0, 1, 0, 1, 1]
})

# Define column types
numeric_features = ['age', 'income']
categorical_features = ['city', 'education']
text_features = 'review'

# Create transformers for each type
numeric_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='median')),
    ('scaler', StandardScaler())
])

categorical_transformer = Pipeline(steps=[
    ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
    ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
])

# Combine transformers
preprocessor = ColumnTransformer(
    transformers=[
        ('num', numeric_transformer, numeric_features),
        ('cat', categorical_transformer, categorical_features),
        ('text', TfidfVectorizer(max_features=20), text_features)
    ],
    remainder='drop'  # Drop columns not specified
)

# Create full pipeline with model
full_pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
])

# Split data
X = complete_data.drop('purchased', axis=1)
y = complete_data['purchased']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)

# Fit and predict
full_pipeline.fit(X_train, y_train)
predictions = full_pipeline.predict(X_test)
accuracy = (predictions == y_test).mean()

print(f"Pipeline Accuracy: {accuracy:.2%}")
print(f"\nFeature names from preprocessor:")

# Get feature names (sklearn 1.0+)
try:
    feature_names = full_pipeline.named_steps['preprocessor'].get_feature_names_out()
    print(feature_names)
except AttributeError:
    print("Feature names not available in this sklearn version")
```

### Custom Transformer

```python
from sklearn.base import BaseEstimator, TransformerMixin

class DateFeatureExtractor(BaseEstimator, TransformerMixin):
    """
    Custom transformer to extract features from datetime columns.
    """
    def __init__(self, date_column, cyclical=True):
        self.date_column = date_column
        self.cyclical = cyclical

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X = X.copy()
        dates = pd.to_datetime(X[self.date_column])

        features = pd.DataFrame(index=X.index)
        features['year'] = dates.dt.year
        features['month'] = dates.dt.month
        features['day'] = dates.dt.day
        features['dayofweek'] = dates.dt.dayofweek
        features['hour'] = dates.dt.hour
        features['is_weekend'] = dates.dt.dayofweek.isin([5, 6]).astype(int)

        if self.cyclical:
            features['month_sin'] = np.sin(2 * np.pi * dates.dt.month / 12)
            features['month_cos'] = np.cos(2 * np.pi * dates.dt.month / 12)
            features['dayofweek_sin'] = np.sin(2 * np.pi * dates.dt.dayofweek / 7)
            features['dayofweek_cos'] = np.cos(2 * np.pi * dates.dt.dayofweek / 7)
            features['hour_sin'] = np.sin(2 * np.pi * dates.dt.hour / 24)
            features['hour_cos'] = np.cos(2 * np.pi * dates.dt.hour / 24)

        return features.values

    def get_feature_names_out(self, input_features=None):
        names = ['year', 'month', 'day', 'dayofweek', 'hour', 'is_weekend']
        if self.cyclical:
            names.extend(['month_sin', 'month_cos', 'dayofweek_sin',
                         'dayofweek_cos', 'hour_sin', 'hour_cos'])
        return np.array(names)

# Example usage
date_data = pd.DataFrame({
    'timestamp': pd.date_range('2024-01-01', periods=10, freq='D'),
    'value': np.random.randn(10)
})

date_extractor = DateFeatureExtractor('timestamp', cyclical=True)
date_features = date_extractor.fit_transform(date_data)
print("Custom Date Features:")
print(pd.DataFrame(date_features, columns=date_extractor.get_feature_names_out()))
```

### Feature Selection in Pipeline

```python
from sklearn.feature_selection import SelectKBest, f_classif, RFE
from sklearn.ensemble import RandomForestClassifier

# Feature selection methods in pipeline
feature_selection_pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('feature_selection', SelectKBest(score_func=f_classif, k=10)),
    ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
])

# RFE (Recursive Feature Elimination) pipeline
rfe_pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('rfe', RFE(
        estimator=RandomForestClassifier(n_estimators=50, random_state=42),
        n_features_to_select=10,
        step=1
    )),
    ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
])

print("Feature selection pipelines created.")
```

---

## Best Practices and Common Pitfalls

### Avoiding Data Leakage

```python
# WRONG: Fitting scaler on entire dataset before splitting
# scaler = StandardScaler()
# X_scaled = scaler.fit_transform(X)  # LEAKAGE!
# X_train, X_test = train_test_split(X_scaled, ...)

# CORRECT: Fit only on training data
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)  # Fit and transform
X_test_scaled = scaler.transform(X_test)  # Only transform (use training statistics)

# BEST: Use pipelines to ensure proper handling
from sklearn.pipeline import Pipeline

pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('model', RandomForestClassifier())
])

# Pipeline handles fit/transform correctly in cross-validation
from sklearn.model_selection import cross_val_score
scores = cross_val_score(pipeline, X_train, y_train, cv=5)
print(f"Cross-validation scores: {scores.mean():.4f} (+/- {scores.std()*2:.4f})")
```

### Handling New Categories in Production

```python
# Handle unknown categories in production
encoder = OneHotEncoder(handle_unknown='ignore', sparse_output=False)

# Training data
train_categories = pd.DataFrame({'city': ['NYC', 'LA', 'Chicago']})
encoder.fit(train_categories)

# Production data with new category
prod_categories = pd.DataFrame({'city': ['NYC', 'Boston', 'LA']})  # Boston is new
encoded = encoder.transform(prod_categories)

print("Handling Unknown Categories:")
print(f"Training categories: {encoder.categories_[0]}")
print(f"Encoded production data:\n{encoded}")
# Boston (unknown) will be encoded as all zeros
```

### Feature Extraction Checklist

**1. NUMERICAL FEATURES:**
- Handle missing values (imputation)
- Handle outliers (clip, transform, or remove)
- Apply appropriate scaling (Standard, MinMax, Robust)
- Consider log transformation for skewed data
- Create polynomial/interaction features if needed
- Bin continuous features if relationships are non-linear

**2. CATEGORICAL FEATURES:**
- Handle missing values
- Choose appropriate encoding (One-Hot, Label, Target)
- Handle high cardinality (frequency, target, or hash encoding)
- Plan for unknown categories in production

**3. TEXT FEATURES:**
- Clean text (lowercase, remove punctuation, etc.)
- Choose representation (BoW, TF-IDF, embeddings)
- Consider n-grams for context
- Extract meta-features (length, word count, etc.)

**4. TIME FEATURES:**
- Extract datetime components
- Use cyclical encoding for periodic features
- Create lag features and rolling statistics
- Add holiday/special event indicators

**5. GENERAL:**
- Use pipelines to prevent data leakage
- Document all transformations
- Version control preprocessing code
- Test pipeline with edge cases
- Monitor feature distributions in production

---

## Interview Key Points

### Common Interview Questions

**Q1: What is the difference between feature extraction and feature selection?**

Feature extraction transforms raw data into new features (e.g., PCA, TF-IDF), while feature selection chooses a subset of existing features. Extraction creates new representations; selection filters existing ones.

**Q2: When would you use One-Hot encoding vs Label encoding?**

- **One-Hot**: Nominal categories without ordering (colors, cities), linear models
- **Label**: Ordinal categories with natural order (education levels), tree-based models

One-Hot is safer for linear models as Label encoding implies numerical relationships.

**Q3: How do you handle high-cardinality categorical features?**

Options include:
- Target encoding (with proper cross-validation to prevent leakage)
- Frequency encoding
- Hash encoding
- Grouping rare categories
- Embedding layers (deep learning)

**Q4: Explain TF-IDF and when to use it.**

TF-IDF weights terms by their importance: common terms get lower weights, rare terms get higher weights. Use it when:
- You want to distinguish documents by distinctive words
- Common words (stopwords) should be downweighted
- Document length normalization is needed

**Q5: How do you prevent data leakage in feature extraction?**

- Always fit transformers on training data only
- Use sklearn pipelines for automatic handling
- Be careful with target encoding (use cross-validation)
- Split data before any preprocessing
- Never use future information for time series features

**Q6: What is cyclical encoding and why is it important?**

Cyclical encoding uses sine/cosine transformations for periodic features (hour, day of week, month). It ensures that values at cycle boundaries are close (e.g., hour 23 and hour 0 are adjacent), which linear encoding fails to capture.

---

## Summary

Feature extraction is a critical skill for any data scientist or machine learning practitioner. Key takeaways:

1. **Numerical Features**: Scale appropriately, handle outliers, consider transformations
2. **Categorical Features**: Choose encoding based on cardinality and model type
3. **Text Features**: TF-IDF for traditional ML, embeddings for deep learning
4. **Time Features**: Extract components, use cyclical encoding, create lag features
5. **Image Features**: Use pre-trained CNN models for transfer learning
6. **Pipelines**: Always use sklearn pipelines to prevent data leakage

The quality of your features often matters more than the complexity of your model. Invest time in understanding your data and crafting meaningful features.

---

## Further Reading

### Official Documentation

- [Scikit-learn Preprocessing](https://scikit-learn.org/stable/modules/preprocessing.html)
- [Scikit-learn Feature Extraction](https://scikit-learn.org/stable/modules/feature_extraction.html)
- [Category Encoders Library](https://contrib.scikit-learn.org/category_encoders/)

### Recommended Resources

- **"Feature Engineering for Machine Learning"** - Alice Zheng and Amanda Casari
- **"Hands-On Machine Learning with Scikit-Learn"** - Aurelien Geron
- [Kaggle Feature Engineering Course](https://www.kaggle.com/learn/feature-engineering)

### Related Articles

- [Machine Learning Fundamentals](/ai/ml-fundamentals) - Core ML concepts
- [Pandas Complete Guide](/data/pandas-guide) - Data manipulation
- [NumPy Fundamentals](/data/numpy) - Numerical computing basics
