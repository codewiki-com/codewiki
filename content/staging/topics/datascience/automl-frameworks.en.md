---
title: "Automated Machine Learning: AutoML Frameworks"
description: "Master AutoML frameworks: Auto-sklearn, H2O, AutoGluon, and FLAML"
track: datascience
section: classical-ml
difficulty: intermediate
tags:
  - AutoML
  - Auto-sklearn
  - AutoGluon
  - automation
status: imported
origin: old/src/content/docs/datascience/automl-frameworks.en.md
divergence: 0.282
issues: []
legacy:
  category: DataScience
  subcategory: AutoML
  order: 37
  lastUpdated: 2026-01-07
---

Automated Machine Learning (AutoML) represents a paradigm shift in how machine learning models are developed. By automating the time-consuming and expertise-intensive aspects of ML pipeline construction, AutoML democratizes machine learning and enables practitioners to build high-performing models with minimal manual intervention. We'll provide comprehensive coverage of leading AutoML frameworks, their principles, and practical applications.

## Introduction to AutoML

### What is AutoML?

AutoML refers to the process of automating the end-to-end process of applying machine learning to real-world problems. It encompasses several key stages of the ML pipeline:

**Core Components of AutoML:**
- **Data Preprocessing**: Automated handling of missing values, encoding, and scaling
- **Feature Engineering**: Automatic creation and selection of informative features
- **Algorithm Selection**: Choosing the best model architecture for the given problem
- **Hyperparameter Optimization**: Finding optimal configuration for selected algorithms
- **Model Selection**: Comparing and selecting the best performing model
- **Ensemble Construction**: Combining multiple models for improved performance

### Why Use AutoML?

**Benefits:**
- **Time Efficiency**: Reduces weeks of manual experimentation to hours
- **Democratization**: Enables non-experts to build competitive ML models
- **Consistency**: Provides systematic exploration of the search space
- **Performance**: Often achieves results comparable to or better than manual tuning
- **Baseline Generation**: Quickly establishes strong baselines for comparison

**Limitations:**
- **Computational Cost**: Extensive search requires significant compute resources
- **Black Box Nature**: May reduce understanding of why certain choices work
- **Domain Knowledge**: Cannot fully replace domain expertise in feature engineering
- **Edge Cases**: May not handle highly specialized or unusual problems well

### AutoML Pipeline Overview

```
Raw Data
    |
    v
+-------------------+
| Data Preprocessing|
| - Missing values  |
| - Type detection  |
| - Encoding        |
+-------------------+
    |
    v
+-------------------+
| Feature Engineering|
| - Generation      |
| - Selection       |
| - Transformation  |
+-------------------+
    |
    v
+-------------------+
| Model Selection   |
| - Algorithm search|
| - Architecture    |
+-------------------+
    |
    v
+-------------------+
| Hyperparameter    |
| Optimization      |
| - Grid/Random     |
| - Bayesian        |
| - Evolutionary    |
+-------------------+
    |
    v
+-------------------+
| Ensemble Building |
| - Stacking        |
| - Blending        |
| - Weighted voting |
+-------------------+
    |
    v
Final Model
```

## AutoML Principles and Techniques

### Hyperparameter Optimization Methods

Understanding the underlying optimization techniques is essential for effective use of AutoML frameworks.

**Grid Search:**
- Exhaustively searches all combinations of predefined values
- Guarantees finding the best combination within the grid
- Computationally expensive for large search spaces

```python
from sklearn.model_selection import GridSearchCV
from sklearn.ensemble import RandomForestClassifier

param_grid = {
    'n_estimators': [50, 100, 200],
    'max_depth': [5, 10, 20, None],
    'min_samples_split': [2, 5, 10]
}

grid_search = GridSearchCV(
    RandomForestClassifier(random_state=42),
    param_grid,
    cv=5,
    scoring='accuracy',
    n_jobs=-1
)
grid_search.fit(X_train, y_train)
print(f"Best parameters: {grid_search.best_params_}")
```

**Random Search:**
- Samples random combinations from the search space
- More efficient than grid search for high-dimensional spaces
- Can find good solutions faster with proper sampling

```python
from sklearn.model_selection import RandomizedSearchCV
from scipy.stats import randint, uniform

param_distributions = {
    'n_estimators': randint(50, 500),
    'max_depth': [None] + list(range(5, 30)),
    'min_samples_split': randint(2, 20),
    'max_features': uniform(0.1, 0.9)
}

random_search = RandomizedSearchCV(
    RandomForestClassifier(random_state=42),
    param_distributions,
    n_iter=100,
    cv=5,
    scoring='accuracy',
    n_jobs=-1,
    random_state=42
)
random_search.fit(X_train, y_train)
```

**Bayesian Optimization:**
- Uses probabilistic models to guide the search
- Balances exploration and exploitation
- More sample-efficient than random search

```python
from skopt import BayesSearchCV
from skopt.space import Integer, Real, Categorical

search_spaces = {
    'n_estimators': Integer(50, 500),
    'max_depth': Integer(3, 30),
    'min_samples_split': Integer(2, 20),
    'max_features': Real(0.1, 0.9)
}

bayes_search = BayesSearchCV(
    RandomForestClassifier(random_state=42),
    search_spaces,
    n_iter=50,
    cv=5,
    scoring='accuracy',
    n_jobs=-1,
    random_state=42
)
bayes_search.fit(X_train, y_train)
```

### Neural Architecture Search (NAS)

NAS automates the design of neural network architectures:

**Search Strategies:**
- **Reinforcement Learning**: Controller generates architectures, trained by validation performance
- **Evolutionary Algorithms**: Population-based search with mutation and selection
- **Differentiable Search**: Makes architecture search differentiable for gradient-based optimization
- **One-Shot Methods**: Trains a supernetwork containing all possible architectures

### Meta-Learning

Meta-learning leverages knowledge from previous tasks to improve learning on new tasks:

- **Warm Starting**: Initialize search from configurations that worked well on similar datasets
- **Portfolio Selection**: Maintain a portfolio of algorithms that collectively perform well
- **Transfer Learning**: Apply learned hyperparameter landscapes to new problems

## Auto-sklearn

Auto-sklearn is built on top of scikit-learn and uses Bayesian optimization with meta-learning for automated machine learning.

### Installation and Setup

```bash
# Install auto-sklearn
pip install auto-sklearn

# Note: auto-sklearn requires specific dependencies
# On Ubuntu/Debian:
# sudo apt-get install build-essential swig
```

### Basic Usage

```python
import autosklearn.classification
import autosklearn.regression
from sklearn.datasets import load_breast_cancer, load_boston
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_squared_error
import numpy as np

# Classification Example
data = load_breast_cancer()
X, y = data.data, data.target
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Create and train Auto-sklearn classifier
automl_classifier = autosklearn.classification.AutoSklearnClassifier(
    time_left_for_this_task=300,  # Total time in seconds
    per_run_time_limit=30,         # Time limit per model
    n_jobs=-1,
    memory_limit=4096,             # Memory limit in MB
    seed=42
)

automl_classifier.fit(X_train, y_train)

# Evaluate
y_pred = automl_classifier.predict(X_test)
print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")

# View the final ensemble
print(automl_classifier.show_models())
```

### Advanced Configuration

```python
import autosklearn.classification
from autosklearn.metrics import balanced_accuracy, f1

# Advanced Auto-sklearn configuration
automl = autosklearn.classification.AutoSklearnClassifier(
    time_left_for_this_task=600,
    per_run_time_limit=60,

    # Include/exclude specific algorithms
    include={
        'classifier': ['random_forest', 'gradient_boosting', 'extra_trees'],
        'feature_preprocessor': ['no_preprocessing', 'pca', 'select_percentile_classification']
    },

    # Ensemble configuration
    ensemble_size=50,
    ensemble_nbest=50,

    # Resampling strategy
    resampling_strategy='cv',
    resampling_strategy_arguments={'folds': 5},

    # Metric to optimize
    metric=balanced_accuracy,

    # Memory and parallelization
    memory_limit=8192,
    n_jobs=4,

    # Reproducibility
    seed=42
)

automl.fit(X_train, y_train)

# Get detailed statistics
print(automl.sprint_statistics())

# Get leaderboard
print(automl.leaderboard())
```

### Custom Metrics and Constraints

```python
from autosklearn.metrics import make_scorer
from sklearn.metrics import fbeta_score

# Create custom metric
def custom_f2_score(y_true, y_pred):
    return fbeta_score(y_true, y_pred, beta=2, average='weighted')

f2_scorer = make_scorer(
    name='f2_weighted',
    score_func=custom_f2_score,
    optimum=1.0,
    greater_is_better=True
)

automl_custom = autosklearn.classification.AutoSklearnClassifier(
    time_left_for_this_task=300,
    per_run_time_limit=30,
    metric=f2_scorer
)
```

### Regression with Auto-sklearn

```python
import autosklearn.regression
from sklearn.datasets import fetch_california_housing
from sklearn.metrics import mean_squared_error, r2_score

# Load regression dataset
housing = fetch_california_housing()
X, y = housing.data, housing.target
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Create Auto-sklearn regressor
automl_regressor = autosklearn.regression.AutoSklearnRegressor(
    time_left_for_this_task=300,
    per_run_time_limit=30,
    n_jobs=-1,
    seed=42
)

automl_regressor.fit(X_train, y_train)

# Evaluate
y_pred = automl_regressor.predict(X_test)
print(f"RMSE: {np.sqrt(mean_squared_error(y_test, y_pred)):.4f}")
print(f"R2 Score: {r2_score(y_test, y_pred):.4f}")
```

## H2O AutoML

H2O AutoML is a scalable, distributed machine learning platform that automates the ML workflow with support for large datasets.

### Installation and Setup

```bash
# Install H2O
pip install h2o

# Or install with additional dependencies
pip install h2o requests tabulate
```

### Basic Usage

```python
import h2o
from h2o.automl import H2OAutoML
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
import pandas as pd

# Initialize H2O cluster
h2o.init(max_mem_size="4G")

# Prepare data
data = load_breast_cancer()
df = pd.DataFrame(data.data, columns=data.feature_names)
df['target'] = data.target

# Convert to H2O Frame
hf = h2o.H2OFrame(df)

# Specify target and features
target = 'target'
features = [col for col in hf.columns if col != target]

# Convert target to factor for classification
hf[target] = hf[target].asfactor()

# Split data
train, test = hf.split_frame(ratios=[0.8], seed=42)

# Run AutoML
aml = H2OAutoML(
    max_runtime_secs=300,
    max_models=20,
    seed=42,
    sort_metric='AUC'
)

aml.train(x=features, y=target, training_frame=train)

# View leaderboard
lb = aml.leaderboard
print(lb.head(10))

# Get best model
best_model = aml.leader
print(f"Best model: {best_model.model_id}")

# Evaluate on test set
perf = best_model.model_performance(test)
print(f"AUC: {perf.auc():.4f}")
print(f"Accuracy: {perf.accuracy()[0][1]:.4f}")
```

### Advanced Configuration

```python
# Advanced H2O AutoML configuration
aml_advanced = H2OAutoML(
    max_runtime_secs=600,
    max_models=50,

    # Algorithm selection
    include_algos=['GBM', 'XGBoost', 'DRF', 'GLM', 'StackedEnsemble'],
    # exclude_algos=['DeepLearning'],  # Alternative: exclude specific algorithms

    # Cross-validation
    nfolds=5,

    # Stacked ensemble options
    keep_cross_validation_predictions=True,
    keep_cross_validation_models=True,

    # Stopping criteria
    stopping_metric='AUC',
    stopping_tolerance=0.001,
    stopping_rounds=3,

    # Reproducibility
    seed=42,

    # Exploitation vs exploration
    exploitation_ratio=0.1,

    # Model export
    export_checkpoints_dir='/tmp/h2o_checkpoints'
)

aml_advanced.train(x=features, y=target, training_frame=train)
```

### Working with Large Datasets

```python
# For large datasets, use H2O's distributed capabilities
h2o.init(
    nthreads=-1,           # Use all available cores
    max_mem_size="16G"     # Allocate more memory
)

# Import large CSV directly to H2O
large_data = h2o.import_file('/path/to/large_dataset.csv')

# Use data streaming for very large files
large_data = h2o.import_file(
    '/path/to/large_dataset.csv',
    parse_type='CSV',
    chunk_size=1000000  # Read in chunks
)
```

### Model Explanation and Export

```python
# Model explanation
from h2o.estimators.stackedensemble import H2OStackedEnsembleEstimator

# Variable importance
varimp = best_model.varimp_plot()

# SHAP values (for tree-based models)
if hasattr(best_model, 'shap_summary_plot'):
    shap_plot = best_model.shap_summary_plot(test)

# Partial dependence plots
best_model.partial_plot(
    frame=test,
    cols=['feature1', 'feature2'],
    plot=True
)

# Export model
model_path = h2o.save_model(model=best_model, path='/tmp/h2o_models', force=True)
print(f"Model saved to: {model_path}")

# Load model
loaded_model = h2o.load_model(model_path)

# Export as MOJO for production deployment
mojo_path = best_model.download_mojo(path='/tmp/h2o_mojos', get_genmodel_jar=True)
print(f"MOJO saved to: {mojo_path}")

# Shutdown H2O cluster when done
h2o.shutdown(prompt=False)
```

### Regression with H2O AutoML

```python
import h2o
from h2o.automl import H2OAutoML
import pandas as pd

h2o.init()

# Prepare regression data
from sklearn.datasets import fetch_california_housing
housing = fetch_california_housing()
df = pd.DataFrame(housing.data, columns=housing.feature_names)
df['target'] = housing.target

hf = h2o.H2OFrame(df)
target = 'target'
features = [col for col in hf.columns if col != target]

train, test = hf.split_frame(ratios=[0.8], seed=42)

# Run AutoML for regression
aml_reg = H2OAutoML(
    max_runtime_secs=300,
    max_models=20,
    seed=42,
    sort_metric='RMSE'  # Use regression metric
)

aml_reg.train(x=features, y=target, training_frame=train)

# Evaluate
perf = aml_reg.leader.model_performance(test)
print(f"RMSE: {perf.rmse():.4f}")
print(f"R2: {perf.r2():.4f}")
```

## AutoGluon

AutoGluon is developed by AWS and provides state-of-the-art AutoML capabilities for tabular, text, and image data with minimal code.

### Installation

```bash
# Install AutoGluon
pip install autogluon

# Or install specific modules
pip install autogluon.tabular
pip install autogluon.text
pip install autogluon.vision
pip install autogluon.multimodal
```

### Tabular Data

```python
from autogluon.tabular import TabularDataset, TabularPredictor
from sklearn.datasets import load_breast_cancer
import pandas as pd

# Prepare data
data = load_breast_cancer()
df = pd.DataFrame(data.data, columns=data.feature_names)
df['target'] = data.target

# Split data
train_data = TabularDataset(df.sample(frac=0.8, random_state=42))
test_data = TabularDataset(df.drop(train_data.index))

# Train AutoGluon predictor
predictor = TabularPredictor(
    label='target',
    problem_type='binary',
    eval_metric='accuracy'
).fit(
    train_data=train_data,
    time_limit=300,
    presets='best_quality'  # Options: 'medium_quality', 'high_quality', 'best_quality'
)

# Evaluate
results = predictor.evaluate(test_data)
print(f"Test accuracy: {results['accuracy']:.4f}")

# View leaderboard
leaderboard = predictor.leaderboard(test_data)
print(leaderboard)
```

### Advanced Tabular Configuration

```python
from autogluon.tabular import TabularPredictor

# Advanced configuration with hyperparameters
predictor = TabularPredictor(
    label='target',
    problem_type='binary',
    eval_metric='roc_auc',
    path='AutogluonModels/'
)

# Custom hyperparameter configuration
hyperparameters = {
    'GBM': [
        {'num_boost_round': 100, 'num_leaves': 31},
        {'num_boost_round': 200, 'num_leaves': 63}
    ],
    'CAT': {'iterations': 500, 'depth': 6},
    'XGB': {'n_estimators': 200, 'max_depth': 6},
    'RF': {'n_estimators': 300, 'max_depth': 10},
    'NN_TORCH': {'num_epochs': 50, 'learning_rate': 0.001},
}

predictor.fit(
    train_data=train_data,
    time_limit=600,
    hyperparameters=hyperparameters,
    num_bag_folds=5,
    num_stack_levels=1,
    verbosity=2
)

# Feature importance
importance = predictor.feature_importance(test_data)
print(importance)

# Model information
model_info = predictor.info()
print(model_info)
```

### Image Classification with AutoGluon

```python
from autogluon.vision import ImagePredictor
import pandas as pd

# Prepare image dataset
# Assumes a CSV with 'image' (file paths) and 'label' columns
train_data = pd.read_csv('train_images.csv')
test_data = pd.read_csv('test_images.csv')

# Train image classifier
predictor = ImagePredictor()
predictor.fit(
    train_data=train_data,
    time_limit=600,
    hyperparameters={
        'model': 'resnet50d',
        'lr': 0.01,
        'epochs': 10,
        'batch_size': 32
    }
)

# Evaluate
results = predictor.evaluate(test_data)
print(f"Test accuracy: {results['top1']:.4f}")

# Predict on new images
predictions = predictor.predict(test_data)
probabilities = predictor.predict_proba(test_data)
```

### Text Classification with AutoGluon

```python
from autogluon.text import TextPredictor
import pandas as pd

# Prepare text dataset
train_data = pd.DataFrame({
    'text': ['Great product!', 'Terrible experience', 'Average quality', ...],
    'label': ['positive', 'negative', 'neutral', ...]
})

test_data = pd.DataFrame({
    'text': ['Loved it!', 'Not worth the money', ...],
    'label': ['positive', 'negative', ...]
})

# Train text classifier
predictor = TextPredictor(label='label')
predictor.fit(
    train_data=train_data,
    time_limit=300,
    hyperparameters={
        'model.hf_text.checkpoint_name': 'bert-base-uncased',
        'optimization.learning_rate': 2e-5,
        'optimization.num_train_epochs': 3
    }
)

# Evaluate
results = predictor.evaluate(test_data)
print(f"Test accuracy: {results['accuracy']:.4f}")

# Predict
predictions = predictor.predict(test_data['text'])
```

### Multimodal Learning with AutoGluon

```python
from autogluon.multimodal import MultiModalPredictor
import pandas as pd

# Prepare multimodal dataset (combining tabular, text, and image)
train_data = pd.DataFrame({
    'image_path': ['path/to/image1.jpg', 'path/to/image2.jpg', ...],
    'text_description': ['A red car', 'A blue house', ...],
    'numeric_feature1': [1.0, 2.5, ...],
    'numeric_feature2': [0.5, 1.2, ...],
    'label': [0, 1, ...]
})

# Train multimodal predictor
predictor = MultiModalPredictor(
    label='label',
    problem_type='binary'
)

predictor.fit(
    train_data=train_data,
    time_limit=600,
    hyperparameters={
        'model.hf_text.checkpoint_name': 'bert-base-uncased',
        'model.timm_image.checkpoint_name': 'resnet18',
        'optimization.learning_rate': 1e-4,
        'optimization.max_epochs': 10
    }
)

# Predict
predictions = predictor.predict(test_data)
probabilities = predictor.predict_proba(test_data)
```

## FLAML

FLAML (Fast and Lightweight AutoML) is a lightweight library developed by Microsoft that focuses on efficiency and cost-effectiveness.

### Installation

```bash
pip install flaml
# For additional features
pip install flaml[automl,notebook]
```

### Basic Usage

```python
from flaml import AutoML
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# Load data
data = load_breast_cancer()
X, y = data.data, data.target
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Create and configure AutoML
automl = AutoML()

# Configure settings
settings = {
    'time_budget': 60,           # Total time in seconds
    'metric': 'accuracy',        # Optimization metric
    'task': 'classification',    # Task type
    'log_file_name': 'flaml.log',
    'seed': 42
}

# Train
automl.fit(X_train, y_train, **settings)

# Evaluate
y_pred = automl.predict(X_test)
print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")

# Best model information
print(f"Best model: {automl.best_estimator}")
print(f"Best config: {automl.best_config}")
print(f"Best validation score: {automl.best_loss}")
```

### Advanced Configuration

```python
from flaml import AutoML
import numpy as np

# Advanced FLAML configuration
automl = AutoML()

# Define custom metric
def custom_metric(X_val, y_val, estimator, labels, X_train, y_train,
                  weight_val=None, weight_train=None, config=None,
                  groups_val=None, groups_train=None):
    from sklearn.metrics import f1_score
    y_pred = estimator.predict(X_val)
    return 1 - f1_score(y_val, y_pred, average='weighted'), {
        'f1_weighted': f1_score(y_val, y_pred, average='weighted')
    }

settings = {
    'time_budget': 300,
    'task': 'classification',

    # Specify estimators to consider
    'estimator_list': ['lgbm', 'xgboost', 'rf', 'extra_tree', 'catboost'],

    # Custom metric
    'metric': custom_metric,

    # Cross-validation
    'n_splits': 5,

    # Early stopping
    'early_stop': True,

    # Ensemble
    'ensemble': True,

    # Resource constraints
    'max_iter': 100,
    'n_jobs': -1,

    # Verbosity
    'verbose': 2,

    'seed': 42
}

automl.fit(X_train, y_train, **settings)

# Get feature importance
if hasattr(automl.model, 'feature_importances_'):
    importance = automl.model.feature_importances_
    print("Feature importances:", importance)
```

### FLAML for Regression

```python
from flaml import AutoML
from sklearn.datasets import fetch_california_housing
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import numpy as np

# Load data
housing = fetch_california_housing()
X, y = housing.data, housing.target
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Configure for regression
automl = AutoML()
settings = {
    'time_budget': 120,
    'metric': 'rmse',
    'task': 'regression',
    'estimator_list': ['lgbm', 'xgboost', 'rf', 'catboost'],
    'seed': 42
}

automl.fit(X_train, y_train, **settings)

# Evaluate
y_pred = automl.predict(X_test)
print(f"RMSE: {np.sqrt(mean_squared_error(y_test, y_pred)):.4f}")
print(f"R2: {r2_score(y_test, y_pred):.4f}")
```

### FLAML with Custom Search Space

```python
from flaml import AutoML, tune

# Define custom search space for specific estimator
custom_hp = {
    'lgbm': {
        'n_estimators': tune.lograndint(50, 1000),
        'max_depth': tune.randint(3, 15),
        'learning_rate': tune.loguniform(0.001, 0.3),
        'num_leaves': tune.lograndint(4, 256),
        'min_child_samples': tune.lograndint(2, 100),
        'subsample': tune.uniform(0.5, 1.0),
        'colsample_bytree': tune.uniform(0.5, 1.0),
    }
}

automl = AutoML()
automl.fit(
    X_train, y_train,
    task='classification',
    time_budget=300,
    custom_hp=custom_hp,
    seed=42
)
```

### Zero-Shot AutoML with FLAML

```python
from flaml import AutoML

# Zero-shot AutoML uses meta-learning to quickly find good configurations
automl = AutoML()
automl.fit(
    X_train, y_train,
    task='classification',
    time_budget=60,
    starting_points='data',  # Use data-dependent starting points
    seed=42
)
```

## TPOT

TPOT (Tree-based Pipeline Optimization Tool) uses genetic programming to optimize machine learning pipelines.

### Installation

```bash
pip install tpot
# For additional features
pip install tpot[dask]  # Distributed computing support
```

### Basic Usage

```python
from tpot import TPOTClassifier, TPOTRegressor
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

# Load data
data = load_breast_cancer()
X, y = data.data, data.target
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Create TPOT classifier
tpot = TPOTClassifier(
    generations=5,           # Number of generations
    population_size=20,      # Population size per generation
    cv=5,                    # Cross-validation folds
    random_state=42,
    verbosity=2,
    n_jobs=-1
)

# Train
tpot.fit(X_train, y_train)

# Evaluate
y_pred = tpot.predict(X_test)
print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")

# Export the best pipeline as Python code
tpot.export('best_pipeline.py')
```

### Advanced TPOT Configuration

```python
from tpot import TPOTClassifier
from tpot.config import classifier_config_dict

# View default configuration
print(classifier_config_dict.keys())

# Custom configuration dictionary
custom_config = {
    'sklearn.ensemble.RandomForestClassifier': {
        'n_estimators': [100, 200, 500],
        'max_depth': [5, 10, 20, None],
        'min_samples_split': [2, 5, 10],
        'min_samples_leaf': [1, 2, 4]
    },
    'sklearn.ensemble.GradientBoostingClassifier': {
        'n_estimators': [100, 200],
        'learning_rate': [0.01, 0.1, 0.2],
        'max_depth': [3, 5, 7]
    },
    'xgboost.XGBClassifier': {
        'n_estimators': [100, 200],
        'max_depth': [3, 5, 7],
        'learning_rate': [0.01, 0.1, 0.2]
    },
    'sklearn.preprocessing.StandardScaler': {},
    'sklearn.decomposition.PCA': {
        'n_components': [0.7, 0.8, 0.9]
    }
}

# Use custom configuration
tpot_custom = TPOTClassifier(
    generations=10,
    population_size=50,
    config_dict=custom_config,
    scoring='roc_auc',
    cv=5,
    random_state=42,
    verbosity=2,
    n_jobs=-1,
    max_time_mins=30,        # Maximum time in minutes
    max_eval_time_mins=5,    # Maximum time per pipeline evaluation
    early_stop=5             # Stop if no improvement for N generations
)

tpot_custom.fit(X_train, y_train)
```

### TPOT for Regression

```python
from tpot import TPOTRegressor
from sklearn.datasets import fetch_california_housing
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import numpy as np

# Load data
housing = fetch_california_housing()
X, y = housing.data, housing.target
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Create TPOT regressor
tpot_reg = TPOTRegressor(
    generations=5,
    population_size=20,
    cv=5,
    scoring='neg_mean_squared_error',
    random_state=42,
    verbosity=2,
    n_jobs=-1
)

tpot_reg.fit(X_train, y_train)

# Evaluate
y_pred = tpot_reg.predict(X_test)
print(f"RMSE: {np.sqrt(mean_squared_error(y_test, y_pred)):.4f}")
print(f"R2: {r2_score(y_test, y_pred):.4f}")

# Export pipeline
tpot_reg.export('best_regression_pipeline.py')
```

### Using TPOT with Dask for Distributed Computing

```python
from tpot import TPOTClassifier
from dask.distributed import Client

# Initialize Dask client
client = Client()  # Connects to local cluster

# Use TPOT with Dask
tpot_dask = TPOTClassifier(
    generations=10,
    population_size=50,
    cv=5,
    random_state=42,
    verbosity=2,
    use_dask=True  # Enable Dask parallelization
)

tpot_dask.fit(X_train, y_train)
```

## Framework Comparison and Selection

### Comparison Table

| Feature | Auto-sklearn | H2O AutoML | AutoGluon | FLAML | TPOT |
|---------|-------------|------------|-----------|-------|------|
| **Backend** | scikit-learn | H2O | MXNet/PyTorch | Various | scikit-learn |
| **Optimization** | Bayesian + Meta | Grid + Random | Ensemble | Cost-Frugal | Genetic |
| **Ease of Use** | High | High | Very High | High | Medium |
| **Speed** | Medium | Fast | Medium | Very Fast | Slow |
| **Scalability** | Medium | Very High | High | High | Medium |
| **Distributed** | No | Yes | Yes | Yes (Dask) | Yes (Dask) |
| **Tabular** | Excellent | Excellent | Excellent | Excellent | Excellent |
| **Image** | No | No | Yes | No | No |
| **Text** | No | No | Yes | No | No |
| **Multimodal** | No | No | Yes | No | No |
| **Production Ready** | Yes | Yes | Yes | Yes | Medium |
| **Model Export** | Yes | Yes (MOJO) | Yes | Yes | Yes (Code) |

### When to Use Each Framework

**Auto-sklearn:**
- When working with tabular data and scikit-learn ecosystem
- When meta-learning benefits are important (similar to previous problems)
- When you need good ensemble construction
- Medium-sized datasets (fits in memory)

**H2O AutoML:**
- When working with large datasets that need distributed processing
- When production deployment with MOJO is required
- When you need excellent documentation and enterprise support
- When scalability is a primary concern

**AutoGluon:**
- When working with multiple data modalities (tabular, text, image)
- When you want the simplest API with state-of-the-art results
- When you need good out-of-the-box performance
- When AWS ecosystem integration is beneficial

**FLAML:**
- When computational resources are limited
- When you need the fastest AutoML solution
- When cost-efficiency is important
- When you need fine-grained control over the search

**TPOT:**
- When you want interpretable pipelines as Python code
- When genetic programming approach fits your needs
- When you want to understand the full pipeline structure
- For educational purposes or research

### Decision Flowchart

```
Start
  |
  v
Do you have image or text data?
  |
  Yes --> Use AutoGluon (supports multimodal)
  |
  No
  |
  v
Is your dataset very large (>1M rows)?
  |
  Yes --> Use H2O AutoML (distributed computing)
  |
  No
  |
  v
Do you have strict time/compute constraints?
  |
  Yes --> Use FLAML (most efficient)
  |
  No
  |
  v
Do you need exportable Python code?
  |
  Yes --> Use TPOT (generates sklearn pipelines)
  |
  No
  |
  v
Do you prefer scikit-learn ecosystem?
  |
  Yes --> Use Auto-sklearn
  |
  No --> Use AutoGluon or H2O AutoML
```

### Performance Benchmarks

A conceptual comparison based on common benchmarks:

```python
import pandas as pd

# Conceptual benchmark results (actual results vary by dataset)
benchmark_results = pd.DataFrame({
    'Framework': ['Auto-sklearn', 'H2O AutoML', 'AutoGluon', 'FLAML', 'TPOT'],
    'Avg_Accuracy': [0.92, 0.93, 0.94, 0.91, 0.90],
    'Avg_Training_Time_min': [30, 15, 25, 5, 60],
    'Memory_GB': [4, 8, 6, 2, 4],
    'Ease_of_Use': [4, 4, 5, 4, 3]
})

print(benchmark_results.to_string(index=False))
```

## Best Practices and Production Deployment

### Data Preparation Best Practices

```python
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split

def prepare_data_for_automl(df, target_column, test_size=0.2, random_state=42):
    """
    Prepare data for AutoML frameworks with best practices.
    """
    # Make a copy to avoid modifying original data
    data = df.copy()

    # 1. Handle duplicates
    initial_rows = len(data)
    data = data.drop_duplicates()
    print(f"Removed {initial_rows - len(data)} duplicate rows")

    # 2. Identify column types
    numeric_cols = data.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = data.select_dtypes(include=['object', 'category']).columns.tolist()

    if target_column in numeric_cols:
        numeric_cols.remove(target_column)
    if target_column in categorical_cols:
        categorical_cols.remove(target_column)

    # 3. Basic missing value report
    missing_report = data.isnull().sum()
    missing_report = missing_report[missing_report > 0]
    if len(missing_report) > 0:
        print("Missing values:")
        print(missing_report)

    # 4. Split data
    X = data.drop(columns=[target_column])
    y = data[target_column]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state,
        stratify=y if data[target_column].dtype == 'object' or data[target_column].nunique() < 20 else None
    )

    print(f"Training set size: {len(X_train)}")
    print(f"Test set size: {len(X_test)}")

    return X_train, X_test, y_train, y_test
```

### Hyperparameter Budget Allocation

```python
def get_automl_time_budget(dataset_size, num_features, task_complexity='medium'):
    """
    Estimate appropriate time budget for AutoML based on data characteristics.
    """
    base_time = 60  # 1 minute base

    # Scale by dataset size
    if dataset_size < 1000:
        size_multiplier = 1
    elif dataset_size < 10000:
        size_multiplier = 2
    elif dataset_size < 100000:
        size_multiplier = 5
    else:
        size_multiplier = 10

    # Scale by features
    if num_features < 20:
        feature_multiplier = 1
    elif num_features < 100:
        feature_multiplier = 2
    else:
        feature_multiplier = 3

    # Scale by task complexity
    complexity_map = {'low': 0.5, 'medium': 1, 'high': 2}
    complexity_multiplier = complexity_map.get(task_complexity, 1)

    total_time = base_time * size_multiplier * feature_multiplier * complexity_multiplier

    return int(min(total_time, 3600))  # Cap at 1 hour
```

### Model Deployment Pipeline

```python
import joblib
import json
from datetime import datetime

class AutoMLModelWrapper:
    """
    Wrapper class for deploying AutoML models to production.
    """

    def __init__(self, model, preprocessor=None, metadata=None):
        self.model = model
        self.preprocessor = preprocessor
        self.metadata = metadata or {}
        self.metadata['created_at'] = datetime.now().isoformat()

    def predict(self, X):
        if self.preprocessor:
            X = self.preprocessor.transform(X)
        return self.model.predict(X)

    def predict_proba(self, X):
        if self.preprocessor:
            X = self.preprocessor.transform(X)
        if hasattr(self.model, 'predict_proba'):
            return self.model.predict_proba(X)
        raise AttributeError("Model does not support predict_proba")

    def save(self, path):
        """Save model and metadata."""
        joblib.dump(self, f"{path}/model.joblib")
        with open(f"{path}/metadata.json", 'w') as f:
            json.dump(self.metadata, f, indent=2)

    @classmethod
    def load(cls, path):
        """Load model from path."""
        return joblib.load(f"{path}/model.joblib")


# Example usage
def deploy_automl_model(automl_model, X_train, y_train, save_path):
    """
    Prepare and save AutoML model for deployment.
    """
    # Create wrapper
    wrapper = AutoMLModelWrapper(
        model=automl_model,
        metadata={
            'framework': type(automl_model).__module__.split('.')[0],
            'training_samples': len(X_train),
            'features': list(X_train.columns) if hasattr(X_train, 'columns') else X_train.shape[1]
        }
    )

    # Save
    wrapper.save(save_path)
    print(f"Model saved to {save_path}")

    return wrapper
```

### Monitoring and Retraining

```python
import numpy as np
from scipy import stats

class ModelMonitor:
    """
    Monitor model performance and data drift in production.
    """

    def __init__(self, reference_data, reference_predictions):
        self.reference_data = reference_data
        self.reference_predictions = reference_predictions
        self.drift_threshold = 0.05

    def check_data_drift(self, new_data):
        """
        Check for data drift using Kolmogorov-Smirnov test.
        """
        drift_results = {}

        for col in range(self.reference_data.shape[1]):
            stat, p_value = stats.ks_2samp(
                self.reference_data[:, col],
                new_data[:, col]
            )
            drift_results[col] = {
                'statistic': stat,
                'p_value': p_value,
                'drift_detected': p_value < self.drift_threshold
            }

        return drift_results

    def check_prediction_drift(self, new_predictions):
        """
        Check for prediction distribution drift.
        """
        stat, p_value = stats.ks_2samp(
            self.reference_predictions,
            new_predictions
        )

        return {
            'statistic': stat,
            'p_value': p_value,
            'drift_detected': p_value < self.drift_threshold
        }

    def should_retrain(self, new_data, new_predictions):
        """
        Determine if model should be retrained based on drift detection.
        """
        data_drift = self.check_data_drift(new_data)
        pred_drift = self.check_prediction_drift(new_predictions)

        drift_features = sum(1 for v in data_drift.values() if v['drift_detected'])

        return (
            drift_features > len(data_drift) * 0.3 or  # >30% features drifted
            pred_drift['drift_detected']
        )
```

## Complete Example: End-to-End AutoML Workflow

```python
"""
Complete AutoML workflow example using multiple frameworks.
"""

import pandas as pd
import numpy as np
from sklearn.datasets import fetch_openml
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, classification_report
)
import warnings
warnings.filterwarnings('ignore')

# Load dataset
print("Loading dataset...")
data = fetch_openml(name='credit-g', version=1, as_frame=True)
X = data.data
y = (data.target == 'good').astype(int)

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"Training samples: {len(X_train)}")
print(f"Test samples: {len(X_test)}")
print(f"Features: {X_train.shape[1]}")

# Results storage
results = {}

# FLAML (fastest)
print("\n" + "="*50)
print("Training with FLAML...")
print("="*50)

from flaml import AutoML

flaml_automl = AutoML()
flaml_automl.fit(
    X_train, y_train,
    task='classification',
    metric='roc_auc',
    time_budget=60,
    seed=42
)

y_pred_flaml = flaml_automl.predict(X_test)
y_prob_flaml = flaml_automl.predict_proba(X_test)[:, 1]

results['FLAML'] = {
    'accuracy': accuracy_score(y_test, y_pred_flaml),
    'precision': precision_score(y_test, y_pred_flaml),
    'recall': recall_score(y_test, y_pred_flaml),
    'f1': f1_score(y_test, y_pred_flaml),
    'roc_auc': roc_auc_score(y_test, y_prob_flaml),
    'best_model': flaml_automl.best_estimator
}
print(f"FLAML Best Model: {flaml_automl.best_estimator}")
print(f"FLAML ROC-AUC: {results['FLAML']['roc_auc']:.4f}")

# AutoGluon
print("\n" + "="*50)
print("Training with AutoGluon...")
print("="*50)

from autogluon.tabular import TabularDataset, TabularPredictor

train_data = pd.concat([X_train, y_train.rename('target')], axis=1)
test_data = pd.concat([X_test, y_test.rename('target')], axis=1)

ag_predictor = TabularPredictor(
    label='target',
    eval_metric='roc_auc',
    path='AutogluonModels/credit'
).fit(
    train_data=train_data,
    time_limit=60,
    presets='medium_quality'
)

y_pred_ag = ag_predictor.predict(test_data.drop('target', axis=1))
y_prob_ag = ag_predictor.predict_proba(test_data.drop('target', axis=1))[1]

results['AutoGluon'] = {
    'accuracy': accuracy_score(y_test, y_pred_ag),
    'precision': precision_score(y_test, y_pred_ag),
    'recall': recall_score(y_test, y_pred_ag),
    'f1': f1_score(y_test, y_pred_ag),
    'roc_auc': roc_auc_score(y_test, y_prob_ag),
    'best_model': ag_predictor.get_model_best()
}
print(f"AutoGluon Best Model: {ag_predictor.get_model_best()}")
print(f"AutoGluon ROC-AUC: {results['AutoGluon']['roc_auc']:.4f}")

# Compare results
print("\n" + "="*50)
print("RESULTS COMPARISON")
print("="*50)

results_df = pd.DataFrame(results).T
print(results_df[['accuracy', 'precision', 'recall', 'f1', 'roc_auc']].round(4))

# Best framework
best_framework = results_df['roc_auc'].idxmax()
print(f"\nBest performing framework: {best_framework}")
print(f"Best ROC-AUC: {results_df.loc[best_framework, 'roc_auc']:.4f}")
```

## Summary

### Key Takeaways

1. **AutoML Purpose**: Automates tedious and expertise-intensive aspects of ML pipeline construction including preprocessing, feature engineering, model selection, and hyperparameter tuning.

2. **Framework Selection**: Choose based on your specific needs:
   - **Auto-sklearn**: Best for scikit-learn integration and meta-learning
   - **H2O AutoML**: Best for large-scale distributed computing
   - **AutoGluon**: Best for multimodal data and ease of use
   - **FLAML**: Best for speed and efficiency
   - **TPOT**: Best for interpretable pipeline code

3. **Optimization Techniques**: Modern AutoML uses sophisticated methods including Bayesian optimization, meta-learning, genetic algorithms, and cost-frugal search strategies.

4. **Production Deployment**: AutoML models can be deployed to production with proper model wrapping, monitoring for data drift, and automated retraining pipelines.

5. **Best Practices**:
   - Start with reasonable time budgets and increase as needed
   - Always validate on held-out test data
   - Monitor model performance in production
   - Document the AutoML configuration used

### When AutoML May Not Be Suitable

- **Highly specialized domains** requiring deep domain expertise
- **Real-time inference** requirements with strict latency constraints
- **Extremely small datasets** where manual feature engineering is crucial
- **When interpretability is paramount** and black-box ensembles are not acceptable
- **Novel research problems** requiring custom architectures

### Future of AutoML

The field continues to evolve with:
- **Neural Architecture Search (NAS)** becoming more efficient
- **AutoML for specialized domains** (time series, graphs, etc.)
- **Integration with MLOps** for end-to-end automation
- **Federated AutoML** for privacy-preserving model building
- **Green AutoML** focusing on energy-efficient search strategies

AutoML represents a powerful tool in the modern ML practitioner's toolkit. While it does not replace the need for understanding ML fundamentals, it significantly accelerates the model development process and often achieves results that match or exceed those of manual tuning by experts.
