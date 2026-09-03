---
title: AutoML Automated Machine Learning
description: Learn AutoML for automating machine learning workflows
track: datascience
section: classical-ml
difficulty: intermediate
tags:
  - AutoML
  - automation
  - model selection
  - hyperparameters
status: imported
origin: old/src/content/docs/ai/automl.en.md
divergence: 0.285
issues: []
legacy:
  category: AI
  subcategory: ML
  order: 20
  lastUpdated: 2026-01-07
---

Automated Machine Learning (AutoML) represents a paradigm shift in how machine learning models are developed and deployed. By automating the tedious and expertise-intensive aspects of the ML pipeline, AutoML democratizes access to machine learning while enabling experienced practitioners to focus on higher-level problems.

## Understanding AutoML

### What is AutoML?

AutoML refers to the process of automating the end-to-end process of applying machine learning to real-world problems. It encompasses everything from raw data to a deployable model, automating tasks that traditionally required significant expertise and manual effort.

**Key Components Automated by AutoML:**
- Data preprocessing and cleaning
- Feature engineering and selection
- Algorithm selection
- Hyperparameter optimization
- Model architecture design
- Model evaluation and selection
- Ensemble creation

```python
# Traditional ML workflow vs AutoML
# Traditional approach - many manual steps
from sklearn.preprocessing import StandardScaler
from sklearn.feature_selection import SelectKBest
from sklearn.model_selection import GridSearchCV
from sklearn.ensemble import RandomForestClassifier

# Manual preprocessing
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Manual feature selection
selector = SelectKBest(k=10)
X_selected = selector.fit_transform(X_scaled, y)

# Manual hyperparameter tuning
param_grid = {'n_estimators': [100, 200], 'max_depth': [5, 10]}
grid_search = GridSearchCV(RandomForestClassifier(), param_grid, cv=5)
grid_search.fit(X_selected, y)

# AutoML approach - one line
# from auto_sklearn import AutoSklearnClassifier
# automl = AutoSklearnClassifier(time_left_for_this_task=3600)
# automl.fit(X, y)
```

### The AutoML Pipeline

A comprehensive AutoML system typically automates these stages:

| Stage | Traditional ML | AutoML Automation |
|-------|---------------|-------------------|
| Data Preprocessing | Manual imputation, encoding | Automatic detection and handling |
| Feature Engineering | Domain expertise required | Automated feature generation |
| Algorithm Selection | Trial and error | Systematic search across algorithms |
| Hyperparameter Tuning | Grid/Random search | Bayesian optimization, meta-learning |
| Model Evaluation | Manual cross-validation | Automated validation strategies |
| Ensemble Creation | Manual stacking | Automatic ensemble construction |

### Why AutoML Matters

**Benefits:**
- Reduces time-to-model from weeks to hours
- Democratizes ML for non-experts
- Explores larger search spaces than manual tuning
- Produces reproducible, well-documented pipelines
- Often discovers non-obvious algorithm combinations

**Limitations:**
- Computationally expensive
- May not handle highly specialized domains well
- Black-box nature can hinder interpretability
- Requires careful validation to avoid overfitting

## Auto-sklearn

Auto-sklearn is one of the most popular open-source AutoML libraries, built on top of scikit-learn. It uses Bayesian optimization and meta-learning to efficiently search the model space.

### Core Concepts

Auto-sklearn extends scikit-learn with:
- **Meta-learning**: Uses historical performance data to warm-start optimization
- **Bayesian Optimization**: Efficiently explores the hyperparameter space
- **Ensemble Selection**: Automatically builds ensembles from trained models

```python
import autosklearn.classification
from sklearn.model_selection import train_test_split
from sklearn.datasets import load_breast_cancer
from sklearn.metrics import accuracy_score, classification_report

# Load data
data = load_breast_cancer()
X_train, X_test, y_train, y_test = train_test_split(
    data.data, data.target, test_size=0.2, random_state=42
)

# Create and train Auto-sklearn classifier
automl = autosklearn.classification.AutoSklearnClassifier(
    time_left_for_this_task=600,  # 10 minutes total
    per_run_time_limit=60,        # 1 minute per model
    n_jobs=-1,
    memory_limit=8192,            # 8 GB RAM limit
    ensemble_size=50,             # Size of final ensemble
    initial_configurations_via_metalearning=25,
    seed=42
)

# Fit the model
automl.fit(X_train, y_train)

# Evaluate
y_pred = automl.predict(X_test)
print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
print(classification_report(y_test, y_pred))
```

### Understanding Auto-sklearn Results

```python
# View the models that were trained
print(automl.leaderboard())

# See the final ensemble composition
print(automl.show_models())

# Get statistics about the search
print(automl.sprint_statistics())

# Access the best performing pipeline
print("Best pipeline configuration:")
for model_id, model_info in automl.show_models().items():
    print(f"\nModel {model_id}:")
    print(f"  Weight: {model_info['weight']}")
    print(f"  Cost: {model_info['cost']}")
```

### Advanced Auto-sklearn Configuration

```python
import autosklearn.classification
from autosklearn.metrics import balanced_accuracy, f1, precision, recall

# Custom configuration for imbalanced data
automl_custom = autosklearn.classification.AutoSklearnClassifier(
    time_left_for_this_task=3600,
    per_run_time_limit=120,

    # Focus on specific algorithms
    include={
        'classifier': ['random_forest', 'gradient_boosting', 'extra_trees'],
        'feature_preprocessor': ['no_preprocessing', 'select_percentile']
    },

    # Exclude certain components
    exclude={
        'classifier': ['gaussian_nb', 'decision_tree']
    },

    # Custom metric
    metric=balanced_accuracy,

    # Resampling strategy
    resampling_strategy='cv',
    resampling_strategy_arguments={'folds': 5},

    # Memory and compute settings
    memory_limit=16384,
    n_jobs=4,
    seed=42
)

# For regression tasks
import autosklearn.regression

automl_regressor = autosklearn.regression.AutoSklearnRegressor(
    time_left_for_this_task=1800,
    per_run_time_limit=90,
    metric=autosklearn.metrics.mean_squared_error,
    seed=42
)
```

### Auto-sklearn with Custom Data Preprocessing

```python
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.pipeline import Pipeline
import pandas as pd

# Prepare data with mixed types
df = pd.DataFrame({
    'age': [25, 30, 35, 40, 45],
    'income': [50000, 60000, 70000, 80000, 90000],
    'education': ['bachelor', 'master', 'phd', 'bachelor', 'master'],
    'target': [0, 1, 1, 0, 1]
})

numeric_features = ['age', 'income']
categorical_features = ['education']

# Create preprocessing pipeline
preprocessor = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), numeric_features),
        ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
    ]
)

# Preprocess data before AutoML
X = df.drop('target', axis=1)
y = df['target']

X_preprocessed = preprocessor.fit_transform(X)

# Now use Auto-sklearn on preprocessed data
automl = autosklearn.classification.AutoSklearnClassifier(
    time_left_for_this_task=300,
    include={'feature_preprocessor': ['no_preprocessing']}  # Already preprocessed
)
automl.fit(X_preprocessed, y)
```

## Google Cloud AutoML

Google Cloud AutoML provides enterprise-grade automated machine learning services with minimal code requirements. It supports various data types including tabular data, images, video, text, and translation.

### AutoML Tables (Tabular Data)

```python
from google.cloud import automl_v1beta1 as automl

# Initialize client
client = automl.TablesClient(project='your-project-id', region='us-central1')

# Create dataset
dataset = client.create_dataset(
    dataset_display_name='customer_churn_dataset',
    metadata={'primary_table_spec_id': 'table_id'}
)

# Import data from BigQuery or GCS
import_response = client.import_data(
    dataset=dataset,
    gcs_input_uris=['gs://your-bucket/train.csv']
)
import_response.result()  # Wait for import to complete

# Set target column
client.set_target_column(
    dataset=dataset,
    column_spec_display_name='churn'
)

# Train model
model_response = client.create_model(
    model_display_name='churn_prediction_model',
    dataset=dataset,
    train_budget_milli_node_hours=1000  # 1 node hour
)

# Wait for training and get model
model = model_response.result()
print(f"Model name: {model.name}")
print(f"Model deployment state: {model.deployment_state}")
```

### AutoML Vision (Image Classification)

```python
from google.cloud import automl

# Initialize client
client = automl.AutoMlClient()
project_location = f"projects/your-project-id/locations/us-central1"

# Create dataset for image classification
dataset = automl.Dataset(
    display_name="product_images",
    image_classification_dataset_metadata=automl.ImageClassificationDatasetMetadata(
        classification_type=automl.ClassificationType.MULTICLASS
    )
)

created_dataset = client.create_dataset(parent=project_location, dataset=dataset)

# Import images (requires CSV with image URIs and labels)
gcs_source = automl.GcsSource(input_uris=["gs://your-bucket/image_labels.csv"])
input_config = automl.InputConfig(gcs_source=gcs_source)

import_operation = client.import_data(
    name=created_dataset.name,
    input_config=input_config
)
import_operation.result()

# Train model
model = automl.Model(
    display_name="product_classifier",
    dataset_id=created_dataset.name.split('/')[-1],
    image_classification_model_metadata=automl.ImageClassificationModelMetadata(
        train_budget_milli_node_hours=24000  # 24 node hours
    )
)

training_operation = client.create_model(parent=project_location, model=model)
trained_model = training_operation.result()
```

### AutoML Natural Language

```python
from google.cloud import automl

client = automl.AutoMlClient()
project_location = f"projects/your-project-id/locations/us-central1"

# Create text classification dataset
dataset = automl.Dataset(
    display_name="sentiment_analysis",
    text_classification_dataset_metadata=automl.TextClassificationDatasetMetadata(
        classification_type=automl.ClassificationType.MULTICLASS
    )
)

created_dataset = client.create_dataset(parent=project_location, dataset=dataset)

# Import training data
# CSV format: text,label
gcs_source = automl.GcsSource(input_uris=["gs://your-bucket/text_data.csv"])
input_config = automl.InputConfig(gcs_source=gcs_source)

import_op = client.import_data(name=created_dataset.name, input_config=input_config)
import_op.result()

# Train the model
model = automl.Model(
    display_name="sentiment_classifier",
    dataset_id=created_dataset.name.split('/')[-1],
    text_classification_model_metadata=automl.TextClassificationModelMetadata()
)

training_op = client.create_model(parent=project_location, model=model)
trained_model = training_op.result()
```

### Vertex AI AutoML (Unified Platform)

```python
from google.cloud import aiplatform

# Initialize Vertex AI
aiplatform.init(project='your-project-id', location='us-central1')

# Create and import dataset
dataset = aiplatform.TabularDataset.create(
    display_name='customer_dataset',
    gcs_source=['gs://your-bucket/data.csv']
)

# Train AutoML model
job = aiplatform.AutoMLTabularTrainingJob(
    display_name='customer_churn_automl',
    optimization_prediction_type='classification',
    optimization_objective='maximize-au-roc',
    column_transformations=[
        {'numeric': {'column_name': 'age'}},
        {'categorical': {'column_name': 'gender'}},
        {'numeric': {'column_name': 'tenure'}},
    ]
)

model = job.run(
    dataset=dataset,
    target_column='churn',
    training_fraction_split=0.8,
    validation_fraction_split=0.1,
    test_fraction_split=0.1,
    budget_milli_node_hours=1000,
    model_display_name='churn_model'
)

# Deploy model for online predictions
endpoint = model.deploy(
    machine_type='n1-standard-4',
    min_replica_count=1,
    max_replica_count=5
)

# Make predictions
prediction = endpoint.predict(instances=[
    {'age': 35, 'gender': 'M', 'tenure': 24}
])
print(prediction.predictions)
```

## H2O AutoML

H2O AutoML is a powerful open-source platform that automatically trains and tunes multiple models, building stacked ensembles for optimal performance.

### Getting Started with H2O AutoML

```python
import h2o
from h2o.automl import H2OAutoML

# Initialize H2O cluster
h2o.init(max_mem_size='8G')

# Load data
train = h2o.import_file('train.csv')
test = h2o.import_file('test.csv')

# Identify target and features
target = 'target_column'
features = [col for col in train.columns if col != target]

# For classification, convert target to factor
train[target] = train[target].asfactor()
test[target] = test[target].asfactor()

# Run AutoML
aml = H2OAutoML(
    max_models=20,              # Maximum number of models to train
    max_runtime_secs=3600,      # Maximum runtime in seconds
    seed=42,
    balance_classes=True,       # Handle imbalanced data
    sort_metric='AUC',          # Metric for leaderboard ranking
    stopping_metric='AUC',      # Metric for early stopping
    stopping_rounds=3,          # Stop if no improvement for N rounds
    stopping_tolerance=0.001,   # Minimum improvement required
    nfolds=5,                   # Cross-validation folds
    keep_cross_validation_predictions=True,
    keep_cross_validation_models=True
)

# Train
aml.train(x=features, y=target, training_frame=train)

# View leaderboard
lb = aml.leaderboard
print(lb.head(rows=20))
```

### Working with H2O AutoML Results

```python
# Get the best model
best_model = aml.leader
print(f"Best model: {best_model.model_id}")

# Get model performance on test data
performance = best_model.model_performance(test)
print(f"AUC: {performance.auc()}")
print(f"Accuracy: {performance.accuracy()[0][1]}")
print(f"F1: {performance.F1()[0][1]}")

# Confusion matrix
print(performance.confusion_matrix())

# Variable importance (if available)
if hasattr(best_model, 'varimp'):
    print(best_model.varimp(use_pandas=True))

# Get all models sorted by performance
for model_id in lb['model_id'].as_data_frame()['model_id'][:5]:
    model = h2o.get_model(model_id)
    print(f"{model_id}: AUC = {model.auc(xval=True):.4f}")
```

### H2O Stacked Ensembles

```python
# Access the stacked ensemble models
stacked_ensemble_models = [
    model_id for model_id in lb['model_id'].as_data_frame()['model_id']
    if 'StackedEnsemble' in model_id
]

print("Stacked Ensemble Models:")
for ensemble_id in stacked_ensemble_models:
    ensemble = h2o.get_model(ensemble_id)
    print(f"\n{ensemble_id}")
    print(f"  Base models: {ensemble.metalearner().params['training_frame']['actual']}")
    print(f"  AUC: {ensemble.auc(xval=True):.4f}")

# Create custom stacked ensemble
from h2o.estimators import H2OStackedEnsembleEstimator

# Get base model IDs
base_models = [
    model_id for model_id in lb['model_id'].as_data_frame()['model_id'][:10]
    if 'StackedEnsemble' not in model_id
]

# Build custom stacked ensemble
custom_ensemble = H2OStackedEnsembleEstimator(
    model_id='custom_ensemble',
    base_models=base_models,
    metalearner_algorithm='GBM',
    metalearner_nfolds=5
)

custom_ensemble.train(x=features, y=target, training_frame=train)
print(f"Custom ensemble AUC: {custom_ensemble.auc(xval=True):.4f}")
```

### H2O AutoML for Regression

```python
# Regression example
train = h2o.import_file('house_prices.csv')

target = 'price'
features = [col for col in train.columns if col != target]

# Configure AutoML for regression
aml_regression = H2OAutoML(
    max_models=30,
    max_runtime_secs=1800,
    seed=42,
    sort_metric='RMSE',          # Root Mean Squared Error
    stopping_metric='RMSE',
    stopping_rounds=3,
    nfolds=5,
    include_algos=['GBM', 'XGBoost', 'DRF', 'GLM', 'StackedEnsemble']
)

aml_regression.train(x=features, y=target, training_frame=train)

# Evaluate regression performance
best_reg_model = aml_regression.leader
reg_performance = best_reg_model.model_performance(test)

print(f"RMSE: {reg_performance.rmse()}")
print(f"MAE: {reg_performance.mae()}")
print(f"R2: {reg_performance.r2()}")
```

### Saving and Loading H2O Models

```python
# Save the best model
model_path = h2o.save_model(model=aml.leader, path='/path/to/models', force=True)
print(f"Model saved to: {model_path}")

# Save all models from leaderboard
import os
save_dir = '/path/to/all_models'
os.makedirs(save_dir, exist_ok=True)

for model_id in lb['model_id'].as_data_frame()['model_id'][:10]:
    model = h2o.get_model(model_id)
    h2o.save_model(model=model, path=save_dir, force=True)

# Load a saved model
loaded_model = h2o.load_model(model_path)
predictions = loaded_model.predict(test)

# Export to MOJO for production deployment
mojo_path = aml.leader.download_mojo(path='/path/to/mojo', get_genmodel_jar=True)
print(f"MOJO saved to: {mojo_path}")

# Shutdown H2O cluster
h2o.cluster().shutdown()
```

## Neural Architecture Search (NAS)

Neural Architecture Search automates the design of neural network architectures. Instead of manually designing layers and connections, NAS algorithms discover optimal architectures for specific tasks.

### Understanding NAS

**Key Components:**
- **Search Space**: Defines possible architectures (layers, connections, operations)
- **Search Strategy**: How to explore the search space (RL, evolutionary, gradient-based)
- **Performance Estimation**: How to evaluate candidate architectures

**Common Search Strategies:**

| Strategy | Description | Pros | Cons |
|----------|-------------|------|------|
| Reinforcement Learning | Controller learns to generate architectures | Flexible | Computationally expensive |
| Evolutionary | Population-based architecture evolution | Parallelizable | Slow convergence |
| Gradient-based (DARTS) | Continuous relaxation of architecture | Efficient | Memory intensive |
| Weight Sharing | Supernet with shared weights | Fast | Suboptimal architectures |

### Using NAS with Keras Tuner

```python
import keras_tuner as kt
import tensorflow as tf
from tensorflow import keras

# Define a model-building function with hyperparameters
def build_model(hp):
    model = keras.Sequential()

    # Input layer
    model.add(keras.layers.Flatten(input_shape=(28, 28)))

    # Variable number of hidden layers
    for i in range(hp.Int('num_layers', min_value=1, max_value=5)):
        # Variable units per layer
        units = hp.Int(f'units_{i}', min_value=32, max_value=512, step=32)
        model.add(keras.layers.Dense(units, activation='relu'))

        # Optional dropout
        if hp.Boolean(f'dropout_{i}'):
            model.add(keras.layers.Dropout(
                hp.Float(f'dropout_rate_{i}', min_value=0.1, max_value=0.5, step=0.1)
            ))

    # Output layer
    model.add(keras.layers.Dense(10, activation='softmax'))

    # Variable learning rate
    learning_rate = hp.Float('learning_rate', min_value=1e-4, max_value=1e-2, sampling='log')

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=learning_rate),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )

    return model

# Load data
(x_train, y_train), (x_test, y_test) = keras.datasets.mnist.load_data()
x_train, x_test = x_train / 255.0, x_test / 255.0

# Create tuner
tuner = kt.Hyperband(
    build_model,
    objective='val_accuracy',
    max_epochs=50,
    factor=3,
    hyperband_iterations=2,
    directory='nas_results',
    project_name='mnist_nas'
)

# Search for best architecture
tuner.search(
    x_train, y_train,
    epochs=50,
    validation_split=0.2,
    callbacks=[keras.callbacks.EarlyStopping(patience=5)]
)

# Get best hyperparameters
best_hps = tuner.get_best_hyperparameters(num_trials=1)[0]
print(f"Best number of layers: {best_hps.get('num_layers')}")
print(f"Best learning rate: {best_hps.get('learning_rate')}")

# Build and train the best model
best_model = tuner.hypermodel.build(best_hps)
history = best_model.fit(x_train, y_train, epochs=50, validation_split=0.2)
```

### CNN Architecture Search

```python
import keras_tuner as kt
from tensorflow import keras
from tensorflow.keras import layers

def build_cnn(hp):
    inputs = keras.Input(shape=(32, 32, 3))
    x = inputs

    # Search for optimal number of conv blocks
    for i in range(hp.Int('conv_blocks', 2, 5)):
        # Filters for this block
        filters = hp.Int(f'filters_{i}', min_value=32, max_value=256, step=32)

        # Kernel size
        kernel_size = hp.Choice(f'kernel_{i}', values=[3, 5])

        x = layers.Conv2D(
            filters, kernel_size,
            padding='same',
            activation='relu'
        )(x)

        # Optional batch normalization
        if hp.Boolean(f'batch_norm_{i}'):
            x = layers.BatchNormalization()(x)

        # Pooling choice
        pool_type = hp.Choice(f'pool_{i}', values=['max', 'avg', 'none'])
        if pool_type == 'max':
            x = layers.MaxPooling2D(2)(x)
        elif pool_type == 'avg':
            x = layers.AveragePooling2D(2)(x)

    x = layers.GlobalAveragePooling2D()(x)

    # Dense layers
    x = layers.Dense(
        hp.Int('dense_units', 64, 512, step=64),
        activation='relu'
    )(x)
    x = layers.Dropout(hp.Float('dropout', 0.0, 0.5, step=0.1))(x)

    outputs = layers.Dense(10, activation='softmax')(x)

    model = keras.Model(inputs, outputs)

    model.compile(
        optimizer=keras.optimizers.Adam(
            hp.Float('lr', 1e-4, 1e-2, sampling='log')
        ),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )

    return model

# Use Bayesian Optimization for CNN search
tuner = kt.BayesianOptimization(
    build_cnn,
    objective='val_accuracy',
    max_trials=50,
    directory='cnn_search',
    project_name='cifar10_cnn'
)

# Load CIFAR-10
(x_train, y_train), (x_test, y_test) = keras.datasets.cifar10.load_data()
x_train, x_test = x_train / 255.0, x_test / 255.0

# Search
tuner.search(x_train, y_train, epochs=30, validation_split=0.2)
```

### AutoKeras for Easy NAS

```python
import autokeras as ak
import tensorflow as tf

# Image classification
clf = ak.ImageClassifier(
    max_trials=10,
    overwrite=True
)

# Automatically finds the best CNN architecture
clf.fit(x_train, y_train, epochs=10)

# Evaluate
accuracy = clf.evaluate(x_test, y_test)
print(f"Test accuracy: {accuracy[1]:.4f}")

# Export the best model
best_model = clf.export_model()
best_model.summary()

# Text classification
text_clf = ak.TextClassifier(
    max_trials=10,
    overwrite=True
)
text_clf.fit(x_train_text, y_train_text, epochs=10)

# Structured data (tabular)
struct_clf = ak.StructuredDataClassifier(
    max_trials=10,
    overwrite=True
)
struct_clf.fit(x_train_tabular, y_train_tabular)

# Regression
regressor = ak.StructuredDataRegressor(
    max_trials=10,
    overwrite=True
)
regressor.fit(x_train, y_train)
```

## Automated Feature Engineering

Automated feature engineering discovers and creates meaningful features from raw data without manual intervention. This is often the most impactful step in the ML pipeline.

### Featuretools for Automated Feature Engineering

```python
import featuretools as ft
import pandas as pd

# Create sample e-commerce data
customers = pd.DataFrame({
    'customer_id': [1, 2, 3, 4, 5],
    'join_date': pd.to_datetime(['2020-01-01', '2020-02-15', '2020-03-20',
                                  '2020-04-10', '2020-05-25']),
    'region': ['East', 'West', 'East', 'South', 'West']
})

transactions = pd.DataFrame({
    'transaction_id': range(1, 16),
    'customer_id': [1, 1, 1, 2, 2, 3, 3, 3, 3, 4, 4, 5, 5, 5, 5],
    'amount': [100, 150, 200, 80, 120, 300, 250, 180, 90, 50, 75, 200, 180, 160, 140],
    'transaction_date': pd.to_datetime([
        '2020-06-01', '2020-06-15', '2020-07-01',
        '2020-06-05', '2020-06-20',
        '2020-06-10', '2020-06-25', '2020-07-05', '2020-07-15',
        '2020-06-12', '2020-06-28',
        '2020-06-08', '2020-06-22', '2020-07-02', '2020-07-18'
    ]),
    'product_category': ['Electronics', 'Clothing', 'Electronics',
                          'Food', 'Electronics',
                          'Clothing', 'Electronics', 'Food', 'Clothing',
                          'Food', 'Food',
                          'Electronics', 'Clothing', 'Electronics', 'Food']
})

# Create EntitySet
es = ft.EntitySet(id='ecommerce')

# Add dataframes with relationships
es = es.add_dataframe(
    dataframe_name='customers',
    dataframe=customers,
    index='customer_id',
    time_index='join_date'
)

es = es.add_dataframe(
    dataframe_name='transactions',
    dataframe=transactions,
    index='transaction_id',
    time_index='transaction_date'
)

# Define relationship
es = es.add_relationship('customers', 'customer_id', 'transactions', 'customer_id')

# Run Deep Feature Synthesis
feature_matrix, feature_defs = ft.dfs(
    entityset=es,
    target_dataframe_name='customers',
    agg_primitives=['mean', 'sum', 'count', 'max', 'min', 'std', 'mode'],
    trans_primitives=['month', 'weekday', 'time_since_previous'],
    max_depth=2
)

print(f"Generated {len(feature_defs)} features")
print(feature_matrix.head())
```

### Advanced Featuretools Usage

```python
# Custom primitives
from featuretools.primitives import AggregationPrimitive, TransformPrimitive
from woodwork.column_schema import ColumnSchema
from woodwork.logical_types import Double
import numpy as np

class PercentileValue(AggregationPrimitive):
    """Calculate the 90th percentile of a numeric column."""
    name = 'percentile_90'
    input_types = [ColumnSchema(logical_type=Double)]
    return_type = ColumnSchema(logical_type=Double)

    def get_function(self):
        def percentile_90(values):
            return np.percentile(values, 90)
        return percentile_90

class RatioToMean(TransformPrimitive):
    """Calculate ratio of each value to the mean."""
    name = 'ratio_to_mean'
    input_types = [ColumnSchema(logical_type=Double)]
    return_type = ColumnSchema(logical_type=Double)

    def get_function(self):
        def ratio_to_mean(values):
            mean = values.mean()
            return values / mean if mean != 0 else values
        return ratio_to_mean

# Use custom primitives
feature_matrix, feature_defs = ft.dfs(
    entityset=es,
    target_dataframe_name='customers',
    agg_primitives=['mean', 'sum', 'count', PercentileValue],
    trans_primitives=[RatioToMean],
    max_depth=2
)
```

### Feature Selection with Automated Tools

```python
from sklearn.feature_selection import SelectFromModel, RFE
from sklearn.ensemble import RandomForestClassifier
import pandas as pd

def automated_feature_selection(X, y, method='importance', n_features=None):
    """
    Automated feature selection using multiple methods.

    Args:
        X: Feature matrix
        y: Target variable
        method: 'importance', 'rfe', or 'both'
        n_features: Number of features to select (None for auto)

    Returns:
        Selected feature names
    """
    results = {}

    if method in ['importance', 'both']:
        # Feature importance-based selection
        rf = RandomForestClassifier(n_estimators=100, random_state=42)
        rf.fit(X, y)

        if n_features:
            selector = SelectFromModel(rf, max_features=n_features, prefit=True)
        else:
            selector = SelectFromModel(rf, threshold='median', prefit=True)

        importance_mask = selector.get_support()
        results['importance'] = X.columns[importance_mask].tolist()

        # Feature importance ranking
        importance_df = pd.DataFrame({
            'feature': X.columns,
            'importance': rf.feature_importances_
        }).sort_values('importance', ascending=False)

        print("Top 10 Features by Importance:")
        print(importance_df.head(10))

    if method in ['rfe', 'both']:
        # Recursive Feature Elimination
        rf = RandomForestClassifier(n_estimators=50, random_state=42)
        n_select = n_features or max(1, X.shape[1] // 2)

        rfe = RFE(estimator=rf, n_features_to_select=n_select, step=1)
        rfe.fit(X, y)

        results['rfe'] = X.columns[rfe.support_].tolist()

    if method == 'both':
        # Intersection of both methods
        common = set(results['importance']) & set(results['rfe'])
        results['common'] = list(common)
        print(f"\nFeatures selected by both methods: {len(common)}")

    return results

# Usage example
# selected = automated_feature_selection(feature_matrix, y, method='both', n_features=20)
```

### TSFresh for Time Series Feature Engineering

```python
from tsfresh import extract_features, select_features
from tsfresh.utilities.dataframe_functions import impute
import pandas as pd
import numpy as np

# Create sample time series data
np.random.seed(42)
n_samples = 100
n_timepoints = 50

# Generate synthetic time series
data = []
for sample_id in range(n_samples):
    for t in range(n_timepoints):
        data.append({
            'id': sample_id,
            'time': t,
            'value': np.sin(t / 10 + sample_id) + np.random.normal(0, 0.1)
        })

timeseries_df = pd.DataFrame(data)

# Target variable
y = pd.Series([i % 2 for i in range(n_samples)], index=range(n_samples))

# Extract features automatically
extracted_features = extract_features(
    timeseries_df,
    column_id='id',
    column_sort='time',
    column_value='value',
    disable_progressbar=False
)

# Impute missing values
impute(extracted_features)

# Select only relevant features
selected_features = select_features(extracted_features, y)

print(f"Extracted {extracted_features.shape[1]} features")
print(f"Selected {selected_features.shape[1]} relevant features")
print(f"\nTop selected features: {selected_features.columns[:10].tolist()}")
```

## When to Use AutoML

### Ideal Use Cases

**AutoML is Best For:**

| Scenario | Reason |
|----------|--------|
| Rapid prototyping | Quick baseline models without deep expertise |
| Limited ML expertise | Democratizes access to ML |
| Standard ML tasks | Classification, regression on tabular data |
| Hyperparameter exploration | Explores larger search spaces systematically |
| Baseline establishment | Creates strong benchmarks for comparison |
| Time-constrained projects | Automates tedious tuning work |

**Example Decision Framework:**

```python
def should_use_automl(project_context):
    """
    Decision framework for AutoML usage.

    Args:
        project_context: dict with project characteristics

    Returns:
        recommendation: str
    """

    # Strong indicators for AutoML
    automl_favorable = [
        project_context.get('limited_ml_expertise', False),
        project_context.get('need_quick_baseline', False),
        project_context.get('standard_tabular_data', False),
        project_context.get('time_constrained', False),
        project_context.get('exploration_phase', False)
    ]

    # Indicators against AutoML
    manual_favorable = [
        project_context.get('specialized_domain', False),
        project_context.get('custom_architecture_needed', False),
        project_context.get('strict_interpretability', False),
        project_context.get('real_time_constraints', False),
        project_context.get('very_large_data', False)
    ]

    automl_score = sum(automl_favorable)
    manual_score = sum(manual_favorable)

    if automl_score > manual_score:
        return "Recommend AutoML: Quick iteration, strong baselines"
    elif manual_score > automl_score:
        return "Recommend Manual ML: Better control for specialized needs"
    else:
        return "Consider Hybrid: AutoML baseline + manual refinement"
```

### When to Avoid AutoML

**AutoML May Not Be Suitable For:**

1. **Highly Specialized Domains**
   - Medical imaging with specific preprocessing needs
   - Financial models requiring regulatory compliance
   - Safety-critical systems needing full auditability

2. **Custom Architecture Requirements**
   - Novel neural network designs
   - Domain-specific model architectures
   - Multi-modal learning with unique fusion strategies

3. **Extreme Scale**
   - Very large datasets where AutoML overhead is prohibitive
   - Real-time inference with strict latency requirements

4. **Interpretability Requirements**
   - Regulated industries requiring model explanations
   - Scientific research needing causal understanding

### Hybrid Approaches

```python
# Best practice: Use AutoML as starting point, then refine

# Step 1: AutoML for baseline and feature insights
import h2o
from h2o.automl import H2OAutoML

h2o.init()
train = h2o.import_file('data.csv')

aml = H2OAutoML(max_runtime_secs=3600, seed=42)
aml.train(x=features, y=target, training_frame=train)

# Step 2: Analyze AutoML results
best_model = aml.leader
print(f"Best model: {best_model.model_id}")
print(f"Performance: {best_model.auc():.4f}")

# Get insights from AutoML
if hasattr(best_model, 'varimp'):
    important_features = best_model.varimp(use_pandas=True)['variable'][:20]
    print(f"Top features discovered: {list(important_features)}")

# Step 3: Manual refinement with domain knowledge
from xgboost import XGBClassifier
from sklearn.model_selection import cross_val_score

# Use insights from AutoML to build refined model
refined_model = XGBClassifier(
    # Parameters inspired by AutoML's best model
    n_estimators=200,
    max_depth=8,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    # Domain-specific adjustments
    scale_pos_weight=3,  # Based on domain knowledge about class imbalance
    reg_alpha=0.1,       # Regularization based on feature analysis
)

# Train on AutoML-selected features
X_refined = X[important_features]
scores = cross_val_score(refined_model, X_refined, y, cv=5, scoring='roc_auc')
print(f"Refined model CV AUC: {scores.mean():.4f}")
```

### AutoML Best Practices

```python
# Best practices for using AutoML effectively

# Always validate AutoML results thoroughly
from sklearn.model_selection import cross_val_score, StratifiedKFold

def validate_automl_model(model, X, y, cv=5):
    """Thorough validation of AutoML models."""
    cv_strategy = StratifiedKFold(n_splits=cv, shuffle=True, random_state=42)

    scores = {
        'accuracy': cross_val_score(model, X, y, cv=cv_strategy, scoring='accuracy'),
        'roc_auc': cross_val_score(model, X, y, cv=cv_strategy, scoring='roc_auc'),
        'f1': cross_val_score(model, X, y, cv=cv_strategy, scoring='f1_weighted')
    }

    for metric, score in scores.items():
        print(f"{metric}: {score.mean():.4f} (+/- {score.std()*2:.4f})")

    return scores

# Check for data leakage
def check_data_leakage(model, X_train, X_test, y_train, y_test):
    """Detect potential data leakage in AutoML models."""
    train_score = model.score(X_train, y_train)
    test_score = model.score(X_test, y_test)

    gap = train_score - test_score

    if gap > 0.1:
        print(f"WARNING: Large train-test gap ({gap:.4f}). Possible overfitting or leakage.")
    elif train_score > 0.99:
        print("WARNING: Suspiciously high training accuracy. Check for data leakage.")
    else:
        print(f"Train: {train_score:.4f}, Test: {test_score:.4f}, Gap: {gap:.4f}")
        print("No obvious signs of leakage detected.")

# Monitor computational resources
import time
import psutil

def run_automl_with_monitoring(automl_func, *args, **kwargs):
    """Run AutoML with resource monitoring."""
    start_time = time.time()
    start_memory = psutil.Process().memory_info().rss / 1024 / 1024

    result = automl_func(*args, **kwargs)

    end_time = time.time()
    end_memory = psutil.Process().memory_info().rss / 1024 / 1024

    print(f"Time elapsed: {end_time - start_time:.2f} seconds")
    print(f"Memory used: {end_memory - start_memory:.2f} MB")

    return result
```

## AutoML Tools Comparison

### Feature Comparison Matrix

| Feature | Auto-sklearn | Google AutoML | H2O AutoML | TPOT | AutoKeras |
|---------|--------------|---------------|------------|------|-----------|
| Open Source | Yes | No | Yes | Yes | Yes |
| Cloud Required | No | Yes | No | No | No |
| Tabular Data | Excellent | Excellent | Excellent | Excellent | Good |
| Image Data | No | Excellent | No | No | Excellent |
| Text Data | Limited | Excellent | Limited | Limited | Excellent |
| NAS Support | No | Yes | No | No | Yes |
| Meta-learning | Yes | Yes | No | No | No |
| Ensemble | Yes | Limited | Yes | Yes | No |
| Interpretability | Good | Limited | Good | Good | Limited |
| Scalability | Medium | High | High | Low | Medium |

### Choosing the Right Tool

```python
def recommend_automl_tool(requirements):
    """
    Recommend AutoML tool based on requirements.

    Args:
        requirements: dict with project requirements

    Returns:
        recommendations: list of (tool, score, reason) tuples
    """
    tools = {
        'auto-sklearn': {
            'tabular': 5, 'open_source': 5, 'interpretability': 4,
            'image': 0, 'text': 1, 'scalability': 3, 'cloud': 0
        },
        'h2o': {
            'tabular': 5, 'open_source': 5, 'interpretability': 4,
            'image': 0, 'text': 2, 'scalability': 5, 'cloud': 0
        },
        'google_automl': {
            'tabular': 5, 'open_source': 0, 'interpretability': 2,
            'image': 5, 'text': 5, 'scalability': 5, 'cloud': 5
        },
        'autokeras': {
            'tabular': 3, 'open_source': 5, 'interpretability': 2,
            'image': 5, 'text': 4, 'scalability': 3, 'cloud': 0
        },
        'tpot': {
            'tabular': 4, 'open_source': 5, 'interpretability': 4,
            'image': 0, 'text': 1, 'scalability': 2, 'cloud': 0
        }
    }

    scores = {}
    for tool, capabilities in tools.items():
        score = sum(
            capabilities.get(req, 0) * weight
            for req, weight in requirements.items()
        )
        scores[tool] = score

    ranked = sorted(scores.items(), key=lambda x: -x[1])
    return ranked

# Example usage
requirements = {
    'tabular': 1.0,
    'open_source': 0.8,
    'interpretability': 0.6,
    'scalability': 0.4
}

recommendations = recommend_automl_tool(requirements)
print("Recommended AutoML tools:")
for tool, score in recommendations[:3]:
    print(f"  {tool}: {score:.2f}")
```

## Summary

AutoML has transformed machine learning by automating complex tasks that previously required extensive expertise. Key takeaways:

### Core Concepts

1. **AutoML Scope**: Automates preprocessing, feature engineering, algorithm selection, hyperparameter tuning, and ensemble creation

2. **Major Tools**:
   - **Auto-sklearn**: Open-source, meta-learning, excellent for tabular data
   - **Google AutoML**: Enterprise-grade, supports images/text/video
   - **H2O AutoML**: Scalable, strong ensembles, good interpretability
   - **AutoKeras/Keras Tuner**: Neural architecture search made accessible

3. **Neural Architecture Search**: Automates neural network design using RL, evolutionary algorithms, or gradient-based methods

4. **Automated Feature Engineering**: Tools like Featuretools and TSFresh discover features automatically

### Best Practices

1. **Start with AutoML** for rapid prototyping and baseline establishment
2. **Validate thoroughly** to detect overfitting and data leakage
3. **Use hybrid approaches** combining AutoML insights with domain expertise
4. **Consider trade-offs** between automation convenience and model control
5. **Monitor resources** as AutoML can be computationally intensive

### When to Use AutoML

| Use AutoML | Avoid AutoML |
|------------|--------------|
| Limited ML expertise | Highly specialized domains |
| Time-constrained projects | Custom architecture needs |
| Standard classification/regression | Strict interpretability requirements |
| Baseline establishment | Extreme scale or latency constraints |
| Hyperparameter exploration | Regulatory compliance needs |

AutoML continues to evolve rapidly, with improvements in efficiency, capabilities, and accessibility. While it does not replace ML expertise, it augments it by handling routine tasks and enabling practitioners to focus on higher-level challenges like problem formulation, data collection, and deployment strategies.
