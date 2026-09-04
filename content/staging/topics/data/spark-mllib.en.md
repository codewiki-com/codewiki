---
title: "Spark MLlib: Distributed Machine Learning"
description: "Large-scale ML with Apache Spark: MLlib core features and best practices"
track: data
section: data-engineering
difficulty: advanced
tags:
  - Spark
  - MLlib
  - distributed
  - big data
status: imported
origin: old/src/content/docs/datascience/spark-mllib.en.md
divergence: 0.221
issues: []
legacy:
  category: DataScience
  subcategory: DataEngineering
  order: 6
  lastUpdated: 2026-01-07
---

Apache Spark MLlib is a scalable machine learning library built on top of Apache Spark. It provides a rich set of algorithms and utilities for building, training, and deploying machine learning models at scale. We'll cover the fundamental concepts, core APIs, and best practices for leveraging MLlib in production data science workflows.

## MLlib Overview: spark.ml vs spark.mllib

Spark provides two machine learning libraries with different API styles. Understanding the distinction is crucial for modern Spark ML development.

### The Two APIs

**spark.mllib (RDD-based API)**
- Original machine learning API built on RDDs
- Algorithms operate on RDDs of vectors and labeled points
- In maintenance mode since Spark 2.0
- Will be deprecated and removed in future Spark versions

**spark.ml (DataFrame-based API)**
- Modern, preferred API built on DataFrames
- Unified Pipeline API for building ML workflows
- Leverages Catalyst optimizer for query optimization
- Full support for new features and improvements

```python
# Legacy mllib approach (NOT RECOMMENDED for new projects)
from pyspark.mllib.classification import LogisticRegressionWithLBFGS
from pyspark.mllib.regression import LabeledPoint

# Modern ml approach (RECOMMENDED)
from pyspark.ml.classification import LogisticRegression
from pyspark.ml.feature import VectorAssembler
```

### Why Choose spark.ml?

| Feature | spark.mllib (RDD) | spark.ml (DataFrame) |
|---------|-------------------|---------------------|
| API Style | Low-level, functional | High-level, declarative |
| Data Structure | RDD[Vector], LabeledPoint | DataFrame with feature columns |
| Pipeline Support | No | Yes, with Pipeline API |
| Optimization | Basic | Catalyst optimizer |
| Parameter Tuning | Manual | Built-in CrossValidator, ParamGrid |
| Model Persistence | Limited | Full MLWriter/MLReader support |
| Maintenance Status | Deprecated | Active development |

### Migration from mllib to ml

```python
# OLD: mllib approach with LabeledPoint
from pyspark.mllib.regression import LabeledPoint
from pyspark.mllib.classification import LogisticRegressionWithLBFGS

# Create LabeledPoint RDD
labeled_rdd = data.map(lambda row: LabeledPoint(row.label, row.features))
model = LogisticRegressionWithLBFGS.train(labeled_rdd)

# NEW: ml approach with DataFrame
from pyspark.ml.classification import LogisticRegression
from pyspark.ml.feature import VectorAssembler

# Create feature vector column
assembler = VectorAssembler(inputCols=["col1", "col2", "col3"], outputCol="features")
df_with_features = assembler.transform(data)

lr = LogisticRegression(featuresCol="features", labelCol="label")
model = lr.fit(df_with_features)
```

## DataFrame ML API

The DataFrame-based ML API provides a consistent interface for all machine learning operations in Spark.

### Core Concepts

**Transformer**: An algorithm that transforms one DataFrame into another by appending columns.

**Estimator**: An algorithm that fits on a DataFrame to produce a Transformer (model).

**Pipeline**: A sequence of Transformers and Estimators chained together.

**Param**: Named parameters used by Transformers and Estimators.

```python
from pyspark.sql import SparkSession
from pyspark.ml.linalg import Vectors

# Initialize Spark session
spark = SparkSession.builder \
    .appName("MLlib DataFrame API") \
    .config("spark.driver.memory", "4g") \
    .getOrCreate()

# Create sample DataFrame for ML
data = spark.createDataFrame([
    (0, 1.0, 0.5, "cat", 1.0),
    (1, 2.0, 1.0, "dog", 0.0),
    (2, 3.0, 1.5, "cat", 1.0),
    (3, 4.0, 2.0, "dog", 0.0),
    (4, 5.0, 2.5, "cat", 1.0),
], ["id", "feature1", "feature2", "category", "label"])

data.show()
data.printSchema()
```

### Estimator and Transformer Pattern

```python
from pyspark.ml.feature import StringIndexer, VectorAssembler
from pyspark.ml.classification import LogisticRegression

# StringIndexer: Estimator that produces StringIndexerModel (Transformer)
indexer = StringIndexer(inputCol="category", outputCol="category_index")
indexer_model = indexer.fit(data)  # Estimator.fit() -> Transformer
indexed_data = indexer_model.transform(data)  # Transformer.transform()

# VectorAssembler: Transformer (no fitting needed)
assembler = VectorAssembler(
    inputCols=["feature1", "feature2", "category_index"],
    outputCol="features"
)
assembled_data = assembler.transform(indexed_data)

# LogisticRegression: Estimator
lr = LogisticRegression(featuresCol="features", labelCol="label")
lr_model = lr.fit(assembled_data)  # Returns LogisticRegressionModel

# Make predictions
predictions = lr_model.transform(assembled_data)
predictions.select("id", "features", "label", "prediction", "probability").show()
```

### Working with ML Vectors

```python
from pyspark.ml.linalg import Vectors, VectorUDT
from pyspark.sql.types import StructType, StructField, DoubleType

# Dense vectors (all values stored)
dense = Vectors.dense([1.0, 2.0, 3.0, 4.0, 5.0])

# Sparse vectors (only non-zero values stored)
# Sparse(size, indices, values)
sparse = Vectors.sparse(5, [0, 2, 4], [1.0, 3.0, 5.0])

# Create DataFrame with vector column
data_with_vectors = spark.createDataFrame([
    (0, Vectors.dense([1.0, 2.0, 3.0]), 1.0),
    (1, Vectors.dense([4.0, 5.0, 6.0]), 0.0),
    (2, Vectors.sparse(3, [0, 2], [1.0, 3.0]), 1.0),
], ["id", "features", "label"])

data_with_vectors.printSchema()
data_with_vectors.show(truncate=False)
```

## Feature Transformers

MLlib provides a comprehensive set of feature transformers for preprocessing and feature engineering.

### Categorical Feature Encoding

```python
from pyspark.ml.feature import (
    StringIndexer, IndexToString, OneHotEncoder,
    StringIndexerModel
)

# Sample data with categorical columns
df = spark.createDataFrame([
    (0, "red", "small"),
    (1, "blue", "medium"),
    (2, "green", "large"),
    (3, "red", "medium"),
    (4, "blue", "small"),
], ["id", "color", "size"])

# StringIndexer: Convert string labels to numerical indices
color_indexer = StringIndexer(inputCol="color", outputCol="color_index")
color_model = color_indexer.fit(df)
df = color_model.transform(df)

# Handle unseen labels during transformation
size_indexer = StringIndexer(
    inputCol="size",
    outputCol="size_index",
    handleInvalid="keep"  # Options: "error", "skip", "keep"
)
size_model = size_indexer.fit(df)
df = size_model.transform(df)

# OneHotEncoder: Convert indices to binary vectors
encoder = OneHotEncoder(
    inputCols=["color_index", "size_index"],
    outputCols=["color_vec", "size_vec"],
    dropLast=True  # Drop last category to avoid multicollinearity
)
encoder_model = encoder.fit(df)
df = encoder_model.transform(df)

df.show(truncate=False)

# IndexToString: Convert indices back to original labels
converter = IndexToString(
    inputCol="color_index",
    outputCol="original_color",
    labels=color_model.labels
)
df = converter.transform(df)
```

### Numerical Feature Transformations

```python
from pyspark.ml.feature import (
    StandardScaler, MinMaxScaler, MaxAbsScaler,
    Normalizer, VectorAssembler, Bucketizer,
    QuantileDiscretizer, Imputer
)

# Create sample numerical data
num_data = spark.createDataFrame([
    (0, 100.0, 0.5, 1000.0, None),
    (1, 200.0, 1.0, 2000.0, 50.0),
    (2, 150.0, None, 1500.0, 75.0),
    (3, 300.0, 2.0, 3000.0, 100.0),
    (4, 250.0, 1.5, 2500.0, None),
], ["id", "income", "score", "balance", "age"])

# Imputer: Fill missing values
imputer = Imputer(
    inputCols=["score", "age"],
    outputCols=["score_imputed", "age_imputed"],
    strategy="median"  # Options: "mean", "median", "mode"
)
imputer_model = imputer.fit(num_data)
num_data = imputer_model.transform(num_data)

# Assemble features into vector
assembler = VectorAssembler(
    inputCols=["income", "score_imputed", "balance", "age_imputed"],
    outputCol="features",
    handleInvalid="skip"  # Skip rows with null values
)
num_data = assembler.transform(num_data)

# StandardScaler: Zero mean, unit variance
standard_scaler = StandardScaler(
    inputCol="features",
    outputCol="scaled_features",
    withMean=True,  # Center data
    withStd=True    # Scale to unit variance
)
scaler_model = standard_scaler.fit(num_data)
num_data = scaler_model.transform(num_data)

# MinMaxScaler: Scale to [0, 1] range
minmax_scaler = MinMaxScaler(
    inputCol="features",
    outputCol="minmax_features",
    min=0.0,
    max=1.0
)
minmax_model = minmax_scaler.fit(num_data)
num_data = minmax_model.transform(num_data)

# Normalizer: Scale to unit norm (L1, L2, or Linf)
normalizer = Normalizer(
    inputCol="features",
    outputCol="normalized_features",
    p=2.0  # L2 norm (Euclidean)
)
num_data = normalizer.transform(num_data)

# Bucketizer: Discretize continuous features into bins
bucketizer = Bucketizer(
    splits=[0, 150, 250, float("inf")],
    inputCol="income",
    outputCol="income_bucket"
)
num_data = bucketizer.transform(num_data)

# QuantileDiscretizer: Data-driven binning
discretizer = QuantileDiscretizer(
    numBuckets=4,
    inputCol="balance",
    outputCol="balance_quantile"
)
discretizer_model = discretizer.fit(num_data)
num_data = discretizer_model.transform(num_data)
```

### Text Feature Extraction

```python
from pyspark.ml.feature import (
    Tokenizer, RegexTokenizer, StopWordsRemover,
    HashingTF, IDF, CountVectorizer, Word2Vec,
    NGram
)

# Sample text data
text_data = spark.createDataFrame([
    (0, "Spark MLlib is great for machine learning"),
    (1, "Machine learning at scale with distributed computing"),
    (2, "Deep learning and neural networks for AI"),
    (3, "Big data processing with Apache Spark"),
], ["id", "text"])

# Tokenizer: Split text into words
tokenizer = Tokenizer(inputCol="text", outputCol="words")
text_data = tokenizer.transform(text_data)

# RegexTokenizer: Custom tokenization pattern
regex_tokenizer = RegexTokenizer(
    inputCol="text",
    outputCol="regex_words",
    pattern="\\W",  # Split on non-word characters
    toLowercase=True
)
text_data = regex_tokenizer.transform(text_data)

# StopWordsRemover: Remove common words
remover = StopWordsRemover(
    inputCol="words",
    outputCol="filtered_words",
    stopWords=["is", "for", "with", "and", "the", "a", "at"]
)
text_data = remover.transform(text_data)

# NGram: Generate n-grams
ngram = NGram(n=2, inputCol="filtered_words", outputCol="bigrams")
text_data = ngram.transform(text_data)

# HashingTF: Term frequency with hashing
hashing_tf = HashingTF(
    inputCol="filtered_words",
    outputCol="raw_features",
    numFeatures=1000  # Size of hash table
)
text_data = hashing_tf.transform(text_data)

# IDF: Inverse Document Frequency
idf = IDF(inputCol="raw_features", outputCol="tfidf_features")
idf_model = idf.fit(text_data)
text_data = idf_model.transform(text_data)

# CountVectorizer: Alternative to HashingTF (vocabulary-based)
count_vectorizer = CountVectorizer(
    inputCol="filtered_words",
    outputCol="count_features",
    vocabSize=1000,
    minDF=1.0  # Minimum document frequency
)
cv_model = count_vectorizer.fit(text_data)
text_data = cv_model.transform(text_data)

# Word2Vec: Word embeddings
word2vec = Word2Vec(
    vectorSize=100,
    minCount=1,
    inputCol="filtered_words",
    outputCol="word_vectors"
)
w2v_model = word2vec.fit(text_data)
text_data = w2v_model.transform(text_data)

# Find synonyms
synonyms = w2v_model.findSynonyms("learning", 5)
synonyms.show()
```

### Dimensionality Reduction

```python
from pyspark.ml.feature import PCA, ChiSqSelector
from pyspark.ml.linalg import Vectors

# Create high-dimensional data
high_dim_data = spark.createDataFrame([
    (Vectors.dense([1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0]), 1.0),
    (Vectors.dense([2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0]), 0.0),
    (Vectors.dense([3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0]), 1.0),
    (Vectors.dense([4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0]), 0.0),
], ["features", "label"])

# PCA: Principal Component Analysis
pca = PCA(k=3, inputCol="features", outputCol="pca_features")
pca_model = pca.fit(high_dim_data)

# Explained variance ratio
print(f"Explained variance: {pca_model.explainedVariance}")

pca_result = pca_model.transform(high_dim_data)
pca_result.select("features", "pca_features").show(truncate=False)

# ChiSqSelector: Feature selection based on chi-squared test
selector = ChiSqSelector(
    numTopFeatures=5,
    featuresCol="features",
    outputCol="selected_features",
    labelCol="label"
)
selector_model = selector.fit(high_dim_data)
selected_result = selector_model.transform(high_dim_data)

print(f"Selected feature indices: {selector_model.selectedFeatures}")
```

## Common Algorithms

MLlib includes implementations of popular machine learning algorithms optimized for distributed computing.

### Classification Algorithms

```python
from pyspark.ml.classification import (
    LogisticRegression, DecisionTreeClassifier,
    RandomForestClassifier, GBTClassifier,
    MultilayerPerceptronClassifier, NaiveBayes,
    LinearSVC, OneVsRest
)
from pyspark.ml.feature import VectorAssembler, StringIndexer
from pyspark.ml.evaluation import MulticlassClassificationEvaluator

# Prepare sample classification data
classification_data = spark.createDataFrame([
    (1.0, 0.5, 1.0, 0),
    (2.0, 1.0, 0.0, 0),
    (3.0, 1.5, 1.0, 1),
    (4.0, 2.0, 0.0, 1),
    (5.0, 2.5, 1.0, 1),
    (1.5, 0.7, 0.5, 0),
    (3.5, 1.8, 0.5, 1),
], ["f1", "f2", "f3", "label"])

assembler = VectorAssembler(inputCols=["f1", "f2", "f3"], outputCol="features")
data = assembler.transform(classification_data)
train, test = data.randomSplit([0.8, 0.2], seed=42)

# Logistic Regression
lr = LogisticRegression(
    featuresCol="features",
    labelCol="label",
    maxIter=100,
    regParam=0.01,            # L2 regularization
    elasticNetParam=0.8,      # L1/L2 mix (0=L2, 1=L1)
    threshold=0.5,            # Classification threshold
    family="multinomial"      # For multi-class
)
lr_model = lr.fit(train)

# Model coefficients
print(f"Coefficients: {lr_model.coefficientMatrix}")
print(f"Intercepts: {lr_model.interceptVector}")

# Decision Tree Classifier
dt = DecisionTreeClassifier(
    featuresCol="features",
    labelCol="label",
    maxDepth=5,
    minInstancesPerNode=1,
    impurity="gini"  # or "entropy"
)
dt_model = dt.fit(train)

# Feature importance
print(f"Feature importances: {dt_model.featureImportances}")

# Random Forest Classifier
rf = RandomForestClassifier(
    featuresCol="features",
    labelCol="label",
    numTrees=100,
    maxDepth=10,
    featureSubsetStrategy="sqrt",  # Features per split
    subsamplingRate=0.8,
    seed=42
)
rf_model = rf.fit(train)

# Gradient Boosted Trees
gbt = GBTClassifier(
    featuresCol="features",
    labelCol="label",
    maxIter=100,
    maxDepth=5,
    stepSize=0.1,  # Learning rate
    subsamplingRate=0.8
)
gbt_model = gbt.fit(train)

# Multilayer Perceptron (Neural Network)
layers = [3, 8, 4, 2]  # Input layer (3), hidden layers, output (2 classes)
mlp = MultilayerPerceptronClassifier(
    featuresCol="features",
    labelCol="label",
    layers=layers,
    maxIter=100,
    blockSize=128,
    seed=42
)
mlp_model = mlp.fit(train)

# Naive Bayes
nb = NaiveBayes(
    featuresCol="features",
    labelCol="label",
    modelType="multinomial",  # or "gaussian", "complement"
    smoothing=1.0
)
nb_model = nb.fit(train)

# Linear SVM
lsvc = LinearSVC(
    featuresCol="features",
    labelCol="label",
    maxIter=100,
    regParam=0.1
)
lsvc_model = lsvc.fit(train)

# One-vs-Rest for multi-class with binary classifier
ovr = OneVsRest(classifier=LogisticRegression())
ovr_model = ovr.fit(train)

# Evaluate all models
evaluator = MulticlassClassificationEvaluator(
    labelCol="label",
    predictionCol="prediction",
    metricName="accuracy"
)

models = {
    "Logistic Regression": lr_model,
    "Decision Tree": dt_model,
    "Random Forest": rf_model,
    "GBT": gbt_model,
    "MLP": mlp_model,
    "Naive Bayes": nb_model,
    "Linear SVC": lsvc_model
}

for name, model in models.items():
    predictions = model.transform(test)
    accuracy = evaluator.evaluate(predictions)
    print(f"{name}: Accuracy = {accuracy:.4f}")
```

### Regression Algorithms

```python
from pyspark.ml.regression import (
    LinearRegression, DecisionTreeRegressor,
    RandomForestRegressor, GBTRegressor,
    GeneralizedLinearRegression, IsotonicRegression,
    FMRegressor
)
from pyspark.ml.evaluation import RegressionEvaluator

# Sample regression data
regression_data = spark.createDataFrame([
    (1.0, 2.0, 3.0, 10.5),
    (2.0, 3.0, 4.0, 15.2),
    (3.0, 4.0, 5.0, 20.1),
    (4.0, 5.0, 6.0, 25.8),
    (5.0, 6.0, 7.0, 30.3),
    (6.0, 7.0, 8.0, 35.9),
], ["f1", "f2", "f3", "target"])

assembler = VectorAssembler(inputCols=["f1", "f2", "f3"], outputCol="features")
data = assembler.transform(regression_data)
train, test = data.randomSplit([0.8, 0.2], seed=42)

# Linear Regression
lr = LinearRegression(
    featuresCol="features",
    labelCol="target",
    maxIter=100,
    regParam=0.01,
    elasticNetParam=0.5,
    solver="normal"  # or "l-bfgs"
)
lr_model = lr.fit(train)

# Model summary
print(f"Coefficients: {lr_model.coefficients}")
print(f"Intercept: {lr_model.intercept}")

# Training summary
training_summary = lr_model.summary
print(f"RMSE: {training_summary.rootMeanSquaredError}")
print(f"R2: {training_summary.r2}")
print(f"MAE: {training_summary.meanAbsoluteError}")

# Generalized Linear Regression
glr = GeneralizedLinearRegression(
    featuresCol="features",
    labelCol="target",
    family="gaussian",  # gaussian, binomial, poisson, gamma
    link="identity",    # identity, log, logit, probit, etc.
    maxIter=100,
    regParam=0.01
)
glr_model = glr.fit(train)

# Decision Tree Regressor
dtr = DecisionTreeRegressor(
    featuresCol="features",
    labelCol="target",
    maxDepth=5,
    minInstancesPerNode=1
)
dtr_model = dtr.fit(train)

# Random Forest Regressor
rfr = RandomForestRegressor(
    featuresCol="features",
    labelCol="target",
    numTrees=100,
    maxDepth=10,
    featureSubsetStrategy="onethird"
)
rfr_model = rfr.fit(train)

# Gradient Boosted Trees Regressor
gbtr = GBTRegressor(
    featuresCol="features",
    labelCol="target",
    maxIter=100,
    maxDepth=5,
    stepSize=0.1,
    lossType="squared"  # or "absolute"
)
gbtr_model = gbtr.fit(train)

# Evaluate regression models
evaluator = RegressionEvaluator(
    labelCol="target",
    predictionCol="prediction",
    metricName="rmse"
)

reg_models = {
    "Linear Regression": lr_model,
    "GLM": glr_model,
    "Decision Tree": dtr_model,
    "Random Forest": rfr_model,
    "GBT": gbtr_model
}

for name, model in reg_models.items():
    predictions = model.transform(test)
    rmse = evaluator.evaluate(predictions)
    evaluator.setMetricName("r2")
    r2 = evaluator.evaluate(predictions)
    evaluator.setMetricName("rmse")
    print(f"{name}: RMSE = {rmse:.4f}, R2 = {r2:.4f}")
```

### Clustering Algorithms

```python
from pyspark.ml.clustering import (
    KMeans, BisectingKMeans, GaussianMixture,
    LDA, PowerIterationClustering
)
from pyspark.ml.evaluation import ClusteringEvaluator

# Sample clustering data
cluster_data = spark.createDataFrame([
    (Vectors.dense([1.0, 1.0]),),
    (Vectors.dense([1.5, 1.2]),),
    (Vectors.dense([1.2, 0.8]),),
    (Vectors.dense([5.0, 5.0]),),
    (Vectors.dense([5.5, 5.2]),),
    (Vectors.dense([5.2, 4.8]),),
    (Vectors.dense([10.0, 10.0]),),
    (Vectors.dense([10.5, 10.2]),),
    (Vectors.dense([10.2, 9.8]),),
], ["features"])

# K-Means Clustering
kmeans = KMeans(
    featuresCol="features",
    predictionCol="prediction",
    k=3,
    maxIter=100,
    initMode="k-means||",  # or "random"
    seed=42
)
kmeans_model = kmeans.fit(cluster_data)

# Cluster centers
print("K-Means Cluster Centers:")
for center in kmeans_model.clusterCenters():
    print(center)

# Within Set Sum of Squared Errors
print(f"WSSSE: {kmeans_model.summary.trainingCost}")

# Transform data
predictions = kmeans_model.transform(cluster_data)
predictions.show()

# Evaluate clustering
evaluator = ClusteringEvaluator(
    featuresCol="features",
    predictionCol="prediction",
    metricName="silhouette"
)
silhouette = evaluator.evaluate(predictions)
print(f"Silhouette Score: {silhouette:.4f}")

# Bisecting K-Means (hierarchical)
bisecting = BisectingKMeans(
    featuresCol="features",
    predictionCol="prediction",
    k=3,
    maxIter=100,
    seed=42
)
bisecting_model = bisecting.fit(cluster_data)

# Gaussian Mixture Model
gmm = GaussianMixture(
    featuresCol="features",
    predictionCol="prediction",
    k=3,
    maxIter=100,
    seed=42
)
gmm_model = gmm.fit(cluster_data)

# GMM provides probability distribution
gmm_predictions = gmm_model.transform(cluster_data)
gmm_predictions.select("features", "prediction", "probability").show(truncate=False)

# Latent Dirichlet Allocation (for topic modeling)
# LDA requires term frequency vectors
from pyspark.ml.feature import CountVectorizer

# Sample text for LDA
text_df = spark.createDataFrame([
    (["spark", "machine", "learning"],),
    (["deep", "learning", "neural"],),
    (["big", "data", "spark"],),
    (["machine", "learning", "ai"],),
], ["words"])

cv = CountVectorizer(inputCol="words", outputCol="features")
cv_model = cv.fit(text_df)
text_features = cv_model.transform(text_df)

lda = LDA(
    featuresCol="features",
    k=2,  # Number of topics
    maxIter=100,
    optimizer="online"  # or "em"
)
lda_model = lda.fit(text_features)

# Topic descriptions
topics = lda_model.describeTopics(maxTermsPerTopic=3)
topics.show(truncate=False)

# Log likelihood and perplexity
print(f"Log Likelihood: {lda_model.logLikelihood(text_features)}")
print(f"Perplexity: {lda_model.logPerplexity(text_features)}")
```

### Recommendation with ALS

```python
from pyspark.ml.recommendation import ALS
from pyspark.ml.evaluation import RegressionEvaluator

# Sample rating data (user, item, rating)
ratings = spark.createDataFrame([
    (0, 0, 4.0),
    (0, 1, 2.0),
    (0, 2, 3.5),
    (1, 0, 4.0),
    (1, 1, 1.0),
    (1, 3, 5.0),
    (2, 1, 3.0),
    (2, 2, 4.5),
    (2, 3, 2.0),
    (3, 0, 5.0),
    (3, 2, 3.0),
    (3, 3, 4.0),
], ["userId", "itemId", "rating"])

train, test = ratings.randomSplit([0.8, 0.2], seed=42)

# Alternating Least Squares
als = ALS(
    userCol="userId",
    itemCol="itemId",
    ratingCol="rating",
    maxIter=10,
    regParam=0.1,
    rank=10,  # Number of latent factors
    coldStartStrategy="drop",  # Handle missing predictions
    implicitPrefs=False,  # True for implicit feedback
    seed=42
)
als_model = als.fit(train)

# Evaluate
predictions = als_model.transform(test)
evaluator = RegressionEvaluator(
    labelCol="rating",
    predictionCol="prediction",
    metricName="rmse"
)
rmse = evaluator.evaluate(predictions)
print(f"RMSE: {rmse:.4f}")

# Generate recommendations
# Top 3 items for each user
user_recs = als_model.recommendForAllUsers(3)
user_recs.show(truncate=False)

# Top 3 users for each item
item_recs = als_model.recommendForAllItems(3)

# Recommendations for specific users
user_subset = ratings.select("userId").distinct().limit(2)
recs_for_users = als_model.recommendForUserSubset(user_subset, 3)
recs_for_users.show(truncate=False)
```

## Pipeline Construction

The Pipeline API enables building complex ML workflows as a sequence of stages.

### Building a Complete Pipeline

```python
from pyspark.ml import Pipeline
from pyspark.ml.feature import (
    StringIndexer, VectorAssembler,
    StandardScaler, OneHotEncoder
)
from pyspark.ml.classification import RandomForestClassifier

# Sample data with mixed feature types
data = spark.createDataFrame([
    (0, "male", "urban", 25, 50000.0, 1),
    (1, "female", "rural", 30, 60000.0, 0),
    (2, "male", "suburban", 35, 70000.0, 1),
    (3, "female", "urban", 40, 80000.0, 0),
    (4, "male", "rural", 45, 90000.0, 1),
    (5, "female", "suburban", 28, 55000.0, 0),
    (6, "male", "urban", 33, 65000.0, 1),
    (7, "female", "rural", 38, 75000.0, 0),
], ["id", "gender", "location", "age", "income", "label"])

train, test = data.randomSplit([0.8, 0.2], seed=42)

# Define pipeline stages
# Stage 1: Index categorical columns
gender_indexer = StringIndexer(inputCol="gender", outputCol="gender_index")
location_indexer = StringIndexer(inputCol="location", outputCol="location_index")

# Stage 2: One-hot encode categorical features
encoder = OneHotEncoder(
    inputCols=["gender_index", "location_index"],
    outputCols=["gender_vec", "location_vec"]
)

# Stage 3: Assemble all features
assembler = VectorAssembler(
    inputCols=["gender_vec", "location_vec", "age", "income"],
    outputCol="raw_features"
)

# Stage 4: Scale features
scaler = StandardScaler(
    inputCol="raw_features",
    outputCol="features",
    withMean=True,
    withStd=True
)

# Stage 5: Classifier
classifier = RandomForestClassifier(
    featuresCol="features",
    labelCol="label",
    numTrees=100,
    maxDepth=5
)

# Create and fit pipeline
pipeline = Pipeline(stages=[
    gender_indexer,
    location_indexer,
    encoder,
    assembler,
    scaler,
    classifier
])

# Train the pipeline
pipeline_model = pipeline.fit(train)

# Make predictions
predictions = pipeline_model.transform(test)
predictions.select("id", "features", "label", "prediction", "probability").show()

# Access individual stage models
rf_model = pipeline_model.stages[-1]
print(f"Feature importances: {rf_model.featureImportances}")
```

### Dynamic Pipeline Building

```python
from pyspark.ml import Pipeline
from pyspark.ml.feature import StringIndexer, VectorAssembler

def build_dynamic_pipeline(df, categorical_cols, numerical_cols, estimator):
    """Build a pipeline dynamically based on column types."""
    stages = []
    feature_cols = []

    # Add indexers for categorical columns
    for col in categorical_cols:
        indexer = StringIndexer(
            inputCol=col,
            outputCol=f"{col}_index",
            handleInvalid="keep"
        )
        stages.append(indexer)
        feature_cols.append(f"{col}_index")

    # Add numerical columns directly
    feature_cols.extend(numerical_cols)

    # Add vector assembler
    assembler = VectorAssembler(
        inputCols=feature_cols,
        outputCol="features",
        handleInvalid="skip"
    )
    stages.append(assembler)

    # Add estimator
    stages.append(estimator)

    return Pipeline(stages=stages)

# Usage
from pyspark.ml.classification import LogisticRegression

categorical = ["gender", "location"]
numerical = ["age", "income"]
lr = LogisticRegression(featuresCol="features", labelCol="label")

dynamic_pipeline = build_dynamic_pipeline(data, categorical, numerical, lr)
dynamic_model = dynamic_pipeline.fit(train)
```

### Nested Pipelines

```python
from pyspark.ml import Pipeline
from pyspark.ml.feature import (
    Tokenizer, StopWordsRemover, HashingTF, IDF,
    VectorAssembler
)
from pyspark.ml.classification import LogisticRegression

# Sample multi-modal data (text + numerical)
multimodal_data = spark.createDataFrame([
    (0, "great product highly recommend", 4.5, 1),
    (1, "terrible waste of money", 1.0, 0),
    (2, "average nothing special", 3.0, 0),
    (3, "excellent quality fantastic", 5.0, 1),
], ["id", "review", "rating", "label"])

# Text processing sub-pipeline
text_stages = [
    Tokenizer(inputCol="review", outputCol="words"),
    StopWordsRemover(inputCol="words", outputCol="filtered"),
    HashingTF(inputCol="filtered", outputCol="raw_tf", numFeatures=100),
    IDF(inputCol="raw_tf", outputCol="text_features")
]
text_pipeline = Pipeline(stages=text_stages)

# Fit text pipeline
text_model = text_pipeline.fit(multimodal_data)
text_features_df = text_model.transform(multimodal_data)

# Combine text and numerical features
final_assembler = VectorAssembler(
    inputCols=["text_features", "rating"],
    outputCol="features"
)

classifier = LogisticRegression(featuresCol="features", labelCol="label")

# Final pipeline
final_pipeline = Pipeline(stages=[
    text_pipeline,
    final_assembler,
    classifier
])

final_model = final_pipeline.fit(multimodal_data)
predictions = final_model.transform(multimodal_data)
predictions.select("id", "review", "rating", "prediction").show()
```

## Model Selection and Tuning

MLlib provides tools for systematic hyperparameter tuning and model selection.

### Cross-Validation with Parameter Grid

```python
from pyspark.ml.tuning import CrossValidator, ParamGridBuilder
from pyspark.ml.evaluation import BinaryClassificationEvaluator
from pyspark.ml.classification import RandomForestClassifier

# Create sample data
from pyspark.ml.linalg import Vectors

train_data = spark.createDataFrame([
    (Vectors.dense([1.0, 0.5]), 1.0),
    (Vectors.dense([2.0, 1.0]), 1.0),
    (Vectors.dense([3.0, 1.5]), 0.0),
    (Vectors.dense([4.0, 2.0]), 0.0),
    (Vectors.dense([5.0, 2.5]), 1.0),
    (Vectors.dense([1.5, 0.7]), 1.0),
    (Vectors.dense([2.5, 1.2]), 0.0),
    (Vectors.dense([3.5, 1.7]), 0.0),
], ["features", "label"])

# Define estimator
rf = RandomForestClassifier(featuresCol="features", labelCol="label")

# Define parameter grid
param_grid = ParamGridBuilder() \
    .addGrid(rf.numTrees, [10, 50, 100]) \
    .addGrid(rf.maxDepth, [3, 5, 10]) \
    .addGrid(rf.minInstancesPerNode, [1, 2, 5]) \
    .build()

print(f"Total parameter combinations: {len(param_grid)}")

# Define evaluator
evaluator = BinaryClassificationEvaluator(
    labelCol="label",
    metricName="areaUnderROC"
)

# Create cross-validator
cv = CrossValidator(
    estimator=rf,
    estimatorParamMaps=param_grid,
    evaluator=evaluator,
    numFolds=3,
    parallelism=4,  # Parallel model training
    seed=42
)

# Fit cross-validator
cv_model = cv.fit(train_data)

# Best model and parameters
best_model = cv_model.bestModel
print(f"Best numTrees: {best_model.getNumTrees}")
print(f"Best maxDepth: {best_model.getMaxDepth()}")

# Average metrics for each parameter combination
avg_metrics = cv_model.avgMetrics
for params, metric in zip(param_grid, avg_metrics):
    print(f"Params: {params}, AUC: {metric:.4f}")
```

### Train-Validation Split

```python
from pyspark.ml.tuning import TrainValidationSplit, ParamGridBuilder
from pyspark.ml.classification import LogisticRegression
from pyspark.ml.evaluation import BinaryClassificationEvaluator

# Define estimator with parameters
lr = LogisticRegression(featuresCol="features", labelCol="label")

# Parameter grid
param_grid = ParamGridBuilder() \
    .addGrid(lr.regParam, [0.001, 0.01, 0.1, 1.0]) \
    .addGrid(lr.elasticNetParam, [0.0, 0.5, 1.0]) \
    .addGrid(lr.maxIter, [50, 100, 200]) \
    .build()

# Evaluator
evaluator = BinaryClassificationEvaluator(
    labelCol="label",
    metricName="areaUnderROC"
)

# Train-Validation Split (faster than CV but less robust)
tvs = TrainValidationSplit(
    estimator=lr,
    estimatorParamMaps=param_grid,
    evaluator=evaluator,
    trainRatio=0.8,  # 80% training, 20% validation
    parallelism=4,
    seed=42
)

# Fit
tvs_model = tvs.fit(train_data)

# Best model
best_lr = tvs_model.bestModel
print(f"Best regParam: {best_lr.getRegParam()}")
print(f"Best elasticNetParam: {best_lr.getElasticNetParam()}")
print(f"Best maxIter: {best_lr.getMaxIter()}")
```

### Pipeline with Cross-Validation

```python
from pyspark.ml import Pipeline
from pyspark.ml.feature import VectorAssembler, StandardScaler
from pyspark.ml.classification import GBTClassifier
from pyspark.ml.tuning import CrossValidator, ParamGridBuilder
from pyspark.ml.evaluation import MulticlassClassificationEvaluator

# Sample data
data = spark.createDataFrame([
    (1.0, 2.0, 3.0, 0),
    (2.0, 3.0, 4.0, 1),
    (3.0, 4.0, 5.0, 0),
    (4.0, 5.0, 6.0, 1),
    (5.0, 6.0, 7.0, 0),
    (6.0, 7.0, 8.0, 1),
], ["f1", "f2", "f3", "label"])

# Build pipeline
assembler = VectorAssembler(inputCols=["f1", "f2", "f3"], outputCol="raw_features")
scaler = StandardScaler(inputCol="raw_features", outputCol="features")
gbt = GBTClassifier(featuresCol="features", labelCol="label")

pipeline = Pipeline(stages=[assembler, scaler, gbt])

# Parameter grid for pipeline stages
param_grid = ParamGridBuilder() \
    .addGrid(scaler.withMean, [True, False]) \
    .addGrid(gbt.maxDepth, [3, 5]) \
    .addGrid(gbt.maxIter, [10, 50]) \
    .addGrid(gbt.stepSize, [0.1, 0.2]) \
    .build()

# Evaluator
evaluator = MulticlassClassificationEvaluator(
    labelCol="label",
    predictionCol="prediction",
    metricName="f1"
)

# Cross-validator with pipeline
cv = CrossValidator(
    estimator=pipeline,
    estimatorParamMaps=param_grid,
    evaluator=evaluator,
    numFolds=3,
    parallelism=4
)

cv_model = cv.fit(data)

# Access best pipeline model
best_pipeline = cv_model.bestModel
best_gbt = best_pipeline.stages[-1]
print(f"Best GBT maxDepth: {best_gbt.getMaxDepth()}")
print(f"Best GBT maxIter: {best_gbt.getMaxIter()}")
```

### Custom Evaluator

```python
from pyspark.ml.evaluation import Evaluator
from pyspark.ml.param import Param, Params
from pyspark.ml.util import DefaultParamsReadable, DefaultParamsWritable

class F1Evaluator(Evaluator, DefaultParamsReadable, DefaultParamsWritable):
    """Custom evaluator for F1 score."""

    labelCol = Param(Params._dummy(), "labelCol", "label column name")
    predictionCol = Param(Params._dummy(), "predictionCol", "prediction column name")

    def __init__(self, labelCol="label", predictionCol="prediction"):
        super().__init__()
        self._setDefault(labelCol="label", predictionCol="prediction")
        self._set(labelCol=labelCol, predictionCol=predictionCol)

    def _evaluate(self, dataset):
        label = self.getOrDefault(self.labelCol)
        prediction = self.getOrDefault(self.predictionCol)

        # Calculate F1 score
        tp = dataset.filter(f"{label} = 1 AND {prediction} = 1").count()
        fp = dataset.filter(f"{label} = 0 AND {prediction} = 1").count()
        fn = dataset.filter(f"{label} = 1 AND {prediction} = 0").count()

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0

        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
        return f1

    def isLargerBetter(self):
        return True

# Usage
custom_evaluator = F1Evaluator(labelCol="label", predictionCol="prediction")
f1_score = custom_evaluator.evaluate(predictions)
print(f"F1 Score: {f1_score:.4f}")
```

## Distributed Training

Understanding how MLlib distributes training across a cluster is essential for optimizing performance.

### Data Parallelism in MLlib

```python
from pyspark.sql import SparkSession
from pyspark.ml.classification import RandomForestClassifier

# Configure Spark for distributed training
spark = SparkSession.builder \
    .appName("Distributed MLlib") \
    .config("spark.executor.instances", "4") \
    .config("spark.executor.cores", "4") \
    .config("spark.executor.memory", "8g") \
    .config("spark.driver.memory", "4g") \
    .config("spark.sql.shuffle.partitions", "200") \
    .getOrCreate()

# MLlib algorithms use data parallelism
# Data is partitioned across executors
# Each executor trains on its partition
# Results are aggregated on the driver

# Example: Random Forest training
rf = RandomForestClassifier(
    featuresCol="features",
    labelCol="label",
    numTrees=100,
    maxDepth=10,
    # Each tree is trained on a bootstrap sample
    # Trees are distributed across executors
    subsamplingRate=1.0,
    seed=42
)

# The fit() call distributes training across the cluster
# model = rf.fit(large_training_data)
```

### Partitioning Strategies

```python
# Optimal partitioning for ML workloads
def prepare_ml_data(df, num_partitions=None):
    """Prepare data with optimal partitioning for ML training."""

    # Estimate optimal partitions
    if num_partitions is None:
        # Rule of thumb: 2-4 partitions per core
        num_cores = spark.sparkContext.defaultParallelism
        num_partitions = num_cores * 2

    # Repartition data evenly
    df = df.repartition(num_partitions)

    # Cache for iterative algorithms
    df.cache()

    # Force materialization
    df.count()

    return df

# For very large datasets, consider partition size
def check_partition_sizes(df):
    """Check partition size distribution."""
    partition_sizes = df.rdd.mapPartitions(
        lambda x: [sum(1 for _ in x)]
    ).collect()

    print(f"Number of partitions: {len(partition_sizes)}")
    print(f"Min partition size: {min(partition_sizes)}")
    print(f"Max partition size: {max(partition_sizes)}")
    print(f"Avg partition size: {sum(partition_sizes) / len(partition_sizes):.2f}")

    return partition_sizes
```

### Memory Management for Large Models

```python
# Configuration for memory-intensive ML
spark_conf = {
    # Executor memory
    "spark.executor.memory": "16g",
    "spark.executor.memoryOverhead": "4g",

    # Driver memory (for collecting large models)
    "spark.driver.memory": "8g",
    "spark.driver.maxResultSize": "4g",

    # Memory management
    "spark.memory.fraction": "0.6",
    "spark.memory.storageFraction": "0.5",

    # Serialization
    "spark.serializer": "org.apache.spark.serializer.KryoSerializer",
    "spark.kryoserializer.buffer.max": "1024m",

    # Shuffle
    "spark.sql.shuffle.partitions": "200",
    "spark.shuffle.compress": "true",

    # Broadcast threshold for small datasets
    "spark.sql.autoBroadcastJoinThreshold": "100MB"
}

# Create SparkSession with optimized config
spark = SparkSession.builder \
    .appName("Memory Optimized ML") \
    .config("spark.executor.memory", "16g") \
    .config("spark.driver.memory", "8g") \
    .getOrCreate()

# For very large feature vectors, use sparse representation
from pyspark.ml.linalg import Vectors

# Dense vector (stores all values)
dense = Vectors.dense([0.0, 0.0, 1.0, 0.0, 0.0, 2.0, 0.0, 0.0, 3.0, 0.0])

# Sparse vector (stores only non-zero values) - memory efficient
sparse = Vectors.sparse(10, [2, 5, 8], [1.0, 2.0, 3.0])
```

### Checkpointing for Long Pipelines

```python
# Enable checkpointing for long-running jobs
spark.sparkContext.setCheckpointDir("/tmp/spark-checkpoints")

# Periodic checkpointing during iterative training
from pyspark.ml.classification import GBTClassifier

gbt = GBTClassifier(
    featuresCol="features",
    labelCol="label",
    maxIter=100,
    checkpointInterval=10,  # Checkpoint every 10 iterations
    cacheNodeIds=True       # Cache node IDs for efficiency
)

# For custom checkpointing in pipelines
def train_with_checkpointing(pipeline, train_data, checkpoint_path):
    """Train pipeline with intermediate checkpointing."""

    # Checkpoint input data
    train_data.checkpoint()
    train_data.count()  # Force materialization

    # Fit pipeline
    model = pipeline.fit(train_data)

    # Save intermediate model
    model.write().overwrite().save(checkpoint_path)

    return model
```

## Model Persistence

MLlib provides robust mechanisms for saving and loading models and pipelines.

### Saving and Loading Models

```python
from pyspark.ml.classification import (
    RandomForestClassifier,
    RandomForestClassificationModel
)
from pyspark.ml import Pipeline, PipelineModel
from pyspark.ml.feature import VectorAssembler

# Train a model
assembler = VectorAssembler(inputCols=["f1", "f2"], outputCol="features")
rf = RandomForestClassifier(featuresCol="features", labelCol="label")
pipeline = Pipeline(stages=[assembler, rf])

model = pipeline.fit(train_data)

# Save the pipeline model
model_path = "/models/rf_pipeline"
model.write().overwrite().save(model_path)

# Load the pipeline model
loaded_model = PipelineModel.load(model_path)

# Make predictions with loaded model
predictions = loaded_model.transform(test_data)

# Save individual model stages
rf_model = model.stages[-1]
rf_model.write().overwrite().save("/models/rf_classifier")

# Load individual model
loaded_rf = RandomForestClassificationModel.load("/models/rf_classifier")
```

### Cross-Platform Model Export

```python
# Save model for different environments

# Save as MLlib format (native Spark)
model.write().overwrite().save("hdfs:///models/spark_native")

# Extract model parameters for external use
rf_model = model.stages[-1]
model_params = {
    "numTrees": rf_model.getNumTrees,
    "maxDepth": rf_model.getMaxDepth(),
    "featureImportances": rf_model.featureImportances.toArray().tolist(),
    "numFeatures": rf_model.numFeatures,
    "numClasses": rf_model.numClasses
}

import json
with open("model_params.json", "w") as f:
    json.dump(model_params, f)

# Export tree structures for visualization
from pyspark.ml.classification import DecisionTreeClassificationModel

def extract_tree_structure(tree_model):
    """Extract decision tree structure as dictionary."""
    return tree_model.toDebugString

# For Random Forest, extract all trees
trees = rf_model.trees
for i, tree in enumerate(trees):
    print(f"Tree {i}:")
    print(tree.toDebugString[:500])  # First 500 chars
```

### Model Versioning

```python
import datetime
import json
import os

class ModelRegistry:
    """Simple model registry for version management."""

    def __init__(self, base_path):
        self.base_path = base_path
        self.metadata_path = f"{base_path}/metadata.json"
        self._load_metadata()

    def _load_metadata(self):
        """Load or initialize metadata."""
        try:
            with open(self.metadata_path) as f:
                self.metadata = json.load(f)
        except FileNotFoundError:
            self.metadata = {"models": {}}

    def _save_metadata(self):
        """Save metadata to file."""
        os.makedirs(self.base_path, exist_ok=True)
        with open(self.metadata_path, "w") as f:
            json.dump(self.metadata, f, indent=2)

    def save_model(self, model, model_name, version=None, metrics=None):
        """Save model with version tracking."""
        if version is None:
            # Auto-increment version
            existing = self.metadata["models"].get(model_name, {})
            versions = [int(v.split(".")[-1]) for v in existing.keys()
                       if v.startswith("v")]
            version = f"v{max(versions, default=0) + 1}"

        # Save model
        model_path = f"{self.base_path}/{model_name}/{version}"
        model.write().overwrite().save(model_path)

        # Update metadata
        if model_name not in self.metadata["models"]:
            self.metadata["models"][model_name] = {}

        self.metadata["models"][model_name][version] = {
            "path": model_path,
            "created": datetime.datetime.now().isoformat(),
            "metrics": metrics or {}
        }
        self._save_metadata()

        return model_path

    def load_model(self, model_name, version="latest"):
        """Load model by name and version."""
        versions = self.metadata["models"].get(model_name, {})

        if version == "latest":
            version = max(versions.keys())

        model_path = versions[version]["path"]
        return PipelineModel.load(model_path)

    def list_models(self):
        """List all registered models."""
        for name, versions in self.metadata["models"].items():
            print(f"\n{name}:")
            for ver, info in versions.items():
                print(f"  {ver}: {info['created']}")
                if info.get("metrics"):
                    for metric, value in info["metrics"].items():
                        print(f"    - {metric}: {value}")

# Usage
registry = ModelRegistry("/models/registry")

# Save model with metrics
metrics = {"accuracy": 0.95, "f1": 0.92}
registry.save_model(model, "customer_churn", metrics=metrics)

# Load latest model
loaded = registry.load_model("customer_churn", "latest")

# List all models
registry.list_models()
```

### PMML and ONNX Export

```python
# For interoperability with other systems

# Using pyspark2pmml (third-party library)
# pip install pyspark2pmml

# from pyspark2pmml import PMMLBuilder
# pmml_builder = PMMLBuilder(spark.sparkContext, train_data, pipeline_model)
# pmml_builder.buildFile("model.pmml")

# Manual feature extraction for ONNX conversion
def extract_lr_for_onnx(lr_model):
    """Extract Logistic Regression parameters for ONNX conversion."""
    return {
        "coefficients": lr_model.coefficients.toArray().tolist(),
        "intercept": lr_model.intercept,
        "numClasses": lr_model.numClasses,
        "numFeatures": lr_model.numFeatures
    }

# Using MLeap for portable models
# MLeap provides serialization for Spark ML pipelines
# https://combust.github.io/mleap-docs/

# Example MLeap usage (requires mleap-spark package):
# import mleap.pyspark
# from mleap.pyspark.spark_support import SimpleSparkSerializer
#
# model.serializeToBundle(
#     "jar:file:/models/mleap_bundle.zip",
#     model.transform(train_data)
# )
```

## Best Practices

### Data Preparation

```python
# Best practices for ML data preparation

# Handle missing values before ML
from pyspark.ml.feature import Imputer

def handle_missing_values(df, numeric_cols, categorical_cols):
    """Comprehensive missing value handling."""

    # Impute numeric columns
    imputer = Imputer(
        inputCols=numeric_cols,
        outputCols=[f"{c}_imputed" for c in numeric_cols],
        strategy="median"
    )
    df = imputer.fit(df).transform(df)

    # Fill categorical columns with mode or 'unknown'
    for col in categorical_cols:
        mode = df.groupBy(col).count().orderBy("count", ascending=False).first()[0]
        df = df.fillna({col: mode if mode else "unknown"})

    return df

# Handle class imbalance
def balance_classes(df, label_col, strategy="oversample"):
    """Balance classes for classification."""

    # Get class counts
    class_counts = df.groupBy(label_col).count().collect()
    class_counts = {row[label_col]: row["count"] for row in class_counts}

    if strategy == "oversample":
        max_count = max(class_counts.values())
        balanced_dfs = []

        for cls, count in class_counts.items():
            cls_df = df.filter(df[label_col] == cls)
            ratio = max_count / count

            if ratio > 1:
                # Oversample minority class
                cls_df = cls_df.sample(withReplacement=True, fraction=ratio, seed=42)

            balanced_dfs.append(cls_df)

        return balanced_dfs[0].union(balanced_dfs[1])

    elif strategy == "undersample":
        min_count = min(class_counts.values())
        balanced_dfs = []

        for cls, count in class_counts.items():
            cls_df = df.filter(df[label_col] == cls)

            if count > min_count:
                cls_df = cls_df.sample(withReplacement=False,
                                       fraction=min_count/count, seed=42)

            balanced_dfs.append(cls_df)

        return balanced_dfs[0].union(balanced_dfs[1])

    return df

# Feature scaling is critical for many algorithms
# Always scale features for: Logistic Regression, SVM, Neural Networks
# Not necessary for: Tree-based models (RF, GBT)
```

### Pipeline Design

```python
# Best practices for pipeline design

# Always use pipelines (even for simple models)
# This ensures reproducibility and proper handling of new data

# Order matters in pipelines
# - Imputation first
# - Encoding second
# - Scaling third (after encoding)
# - Feature selection fourth
# - Model last

# Use handleInvalid parameter for robustness
from pyspark.ml.feature import StringIndexer, VectorAssembler

# Handle unseen categories in production
indexer = StringIndexer(
    inputCol="category",
    outputCol="category_index",
    handleInvalid="keep"  # Assigns unseen categories to a new index
)

# Handle null values in feature assembly
assembler = VectorAssembler(
    inputCols=["f1", "f2", "f3"],
    outputCol="features",
    handleInvalid="skip"  # Skip rows with nulls
)

# Separate feature engineering from modeling
# This allows swapping models without redoing feature engineering

feature_pipeline = Pipeline(stages=[
    indexer,
    encoder,
    assembler,
    scaler
])

# Fit feature pipeline once
feature_model = feature_pipeline.fit(train_data)
train_features = feature_model.transform(train_data)
test_features = feature_model.transform(test_data)

# Try different models
for model in [LogisticRegression(), RandomForestClassifier(), GBTClassifier()]:
    fitted = model.fit(train_features)
    predictions = fitted.transform(test_features)
    # Evaluate...
```

### Hyperparameter Tuning

```python
# Best practices for hyperparameter tuning

# Start with coarse grid, then refine
coarse_grid = ParamGridBuilder() \
    .addGrid(rf.numTrees, [10, 100]) \
    .addGrid(rf.maxDepth, [5, 15]) \
    .build()

# After finding good region, refine
fine_grid = ParamGridBuilder() \
    .addGrid(rf.numTrees, [80, 100, 120]) \
    .addGrid(rf.maxDepth, [12, 15, 18]) \
    .build()

# Use parallelism for faster tuning
cv = CrossValidator(
    estimator=pipeline,
    estimatorParamMaps=param_grid,
    evaluator=evaluator,
    numFolds=5,
    parallelism=4  # Train 4 models in parallel
)

# For large datasets, use TrainValidationSplit
# It's faster (single split) but less robust than CV
tvs = TrainValidationSplit(
    estimator=pipeline,
    estimatorParamMaps=param_grid,
    evaluator=evaluator,
    trainRatio=0.8,
    parallelism=4
)

# Early stopping for iterative algorithms
# Some algorithms support early stopping
from pyspark.ml.classification import GBTClassifier

gbt = GBTClassifier(
    maxIter=100,
    validationIndicatorCol="isValidation",  # Column indicating validation rows
    # Model stops when validation metric stops improving
)
```

### Production Deployment

```python
# Best practices for production deployment

# Always version your models
import datetime

model_version = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
model_path = f"/production/models/churn_model_{model_version}"
pipeline_model.write().overwrite().save(model_path)

# Log model metadata
model_metadata = {
    "version": model_version,
    "trained_at": datetime.datetime.now().isoformat(),
    "training_data_path": "/data/training/churn_2024.parquet",
    "features": feature_columns,
    "target": "churned",
    "metrics": {
        "accuracy": accuracy,
        "f1": f1_score,
        "auc": auc_score
    },
    "spark_version": spark.version,
    "hyperparameters": best_params
}

# Validate loaded model before serving
def validate_model(model, validation_data, expected_schema):
    """Validate model works correctly before deployment."""

    # Check schema compatibility
    input_cols = set(validation_data.columns)
    required_cols = set(expected_schema)

    if not required_cols.issubset(input_cols):
        missing = required_cols - input_cols
        raise ValueError(f"Missing required columns: {missing}")

    # Test prediction
    try:
        predictions = model.transform(validation_data.limit(10))
        predictions.select("prediction").collect()
    except Exception as e:
        raise ValueError(f"Model prediction failed: {e}")

    return True

# Monitor model performance in production
def log_prediction_metrics(predictions, label_col, prediction_col):
    """Log metrics for monitoring model drift."""

    # Calculate metrics
    evaluator = MulticlassClassificationEvaluator(
        labelCol=label_col,
        predictionCol=prediction_col
    )

    metrics = {}
    for metric_name in ["accuracy", "f1", "weightedPrecision", "weightedRecall"]:
        evaluator.setMetricName(metric_name)
        metrics[metric_name] = evaluator.evaluate(predictions)

    # Log to monitoring system
    print(f"Production metrics: {metrics}")

    # Alert if metrics drop significantly
    if metrics["accuracy"] < 0.8:  # Threshold
        print("WARNING: Model accuracy below threshold!")

    return metrics
```

## Interview Key Points

### Core Concepts

**Q1: What is the difference between spark.ml and spark.mllib?**

- spark.mllib is the RDD-based API (deprecated)
- spark.ml is the DataFrame-based API (recommended)
- spark.ml provides Pipeline API, better optimization, and active development
- spark.ml uses Estimator/Transformer pattern for consistent API

**Q2: Explain the Transformer and Estimator concepts.**

- **Estimator**: Algorithm that fits on data to produce a Transformer (e.g., LogisticRegression)
- **Transformer**: Algorithm that transforms DataFrames (e.g., fitted model, VectorAssembler)
- Estimator.fit(DataFrame) returns Transformer
- Transformer.transform(DataFrame) returns DataFrame

**Q3: How does MLlib handle distributed training?**

- Data parallelism: Data is partitioned across executors
- Each executor processes its partition independently
- Results are aggregated on the driver
- Algorithms like RF train trees on different data partitions

### Feature Engineering

**Q4: What feature transformers are commonly used?**

- StringIndexer: Encode categorical strings to indices
- OneHotEncoder: Create binary vectors from indices
- VectorAssembler: Combine features into a single vector
- StandardScaler: Zero mean, unit variance scaling
- Imputer: Handle missing values

**Q5: When should you use sparse vs dense vectors?**

- Use sparse vectors when most values are zero (e.g., text TF-IDF)
- Use dense vectors for features with mostly non-zero values
- Sparse vectors save memory for high-dimensional sparse data

### Model Selection

**Q6: How do you perform hyperparameter tuning in MLlib?**

- Use ParamGridBuilder to define parameter search space
- CrossValidator for k-fold cross-validation
- TrainValidationSplit for single train/validation split (faster)
- Set parallelism parameter for parallel model training

**Q7: What evaluation metrics are available?**

Classification:
- BinaryClassificationEvaluator: AUC-ROC, AUC-PR
- MulticlassClassificationEvaluator: accuracy, f1, precision, recall

Regression:
- RegressionEvaluator: RMSE, MSE, MAE, R2

Clustering:
- ClusteringEvaluator: silhouette score

### Production Considerations

**Q8: How do you save and load ML models?**

```python
# Save
model.write().overwrite().save("path/to/model")

# Load
from pyspark.ml import PipelineModel
model = PipelineModel.load("path/to/model")
```

**Q9: What are best practices for production ML pipelines?**

- Always use Pipeline API for reproducibility
- Handle missing values and unseen categories (handleInvalid)
- Version your models with metadata
- Validate models before deployment
- Monitor model performance for drift

## Further Reading

### Official Resources

- [Spark MLlib Guide](https://spark.apache.org/docs/latest/ml-guide.html)
- [MLlib API Documentation](https://spark.apache.org/docs/latest/api/python/reference/pyspark.ml.html)
- [ML Tuning Guide](https://spark.apache.org/docs/latest/ml-tuning.html)
- [ML Pipeline Guide](https://spark.apache.org/docs/latest/ml-pipeline.html)

### Recommended Books

- **"Learning Spark, 2nd Edition"** by Jules Damji et al. - Comprehensive Spark coverage including MLlib
- **"Spark: The Definitive Guide"** by Bill Chambers and Matei Zaharia - Deep dive into all Spark components
- **"Machine Learning with PySpark"** by Pramod Singh - Focused on ML with PySpark

### Related Topics

- **Spark Core and SQL**: Foundation for MLlib (see [Apache Spark Big Data Guide](/docs/data/spark))
- **ML Fundamentals**: Core ML concepts (see [Machine Learning Fundamentals](/docs/ai/ml-fundamentals))
- **Distributed Systems**: Understanding cluster computing
- **Feature Engineering**: Advanced feature creation techniques
- **MLOps**: Model deployment and monitoring at scale

### Advanced Topics

- **Delta Lake for ML**: ACID transactions for ML data pipelines
- **Spark Structured Streaming + ML**: Real-time ML predictions
- **Hyperopt + SparkTrials**: Distributed hyperparameter optimization
- **Koalas/pandas API on Spark**: Familiar pandas interface for Spark
- **XGBoost/LightGBM on Spark**: External libraries for gradient boosting

---

Spark MLlib provides a robust foundation for building machine learning applications at scale. The key to success with MLlib is understanding the DataFrame-based API, leveraging the Pipeline pattern for reproducible workflows, and following best practices for distributed training and model deployment. As data volumes continue to grow, MLlib's ability to scale horizontally makes it an essential tool for data scientists and ML engineers working with big data.
