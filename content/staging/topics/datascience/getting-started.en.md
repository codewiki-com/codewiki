---
title: Data Science and Machine Learning Getting Started Guide
description: Learn core concepts, technology stack, and learning path for data science and ML engineering
track: datascience
section: classical-ml
difficulty: beginner
tags:
  - getting started
  - data science
  - machine learning
  - learning path
status: imported
origin: old/src/content/docs/datascience/getting-started.en.md
divergence: 0.529
issues:
  - divergent
legacy:
  category: DataScience
  subcategory: Introduction
  order: 0
  lastUpdated: 2026-01-07
---

Welcome to the Data Science and Machine Learning section of Code Wiki! This comprehensive guide will help you understand the core concepts, essential skills, technology stack, and recommended learning path for becoming a proficient data scientist or machine learning engineer.

## What is Data Science and Machine Learning Engineering

Data Science is an interdisciplinary field that uses scientific methods, algorithms, and systems to extract knowledge and insights from structured and unstructured data. Machine Learning Engineering focuses on designing, building, and deploying machine learning models into production systems at scale.

While these roles overlap significantly, they have distinct emphases:

**Data Scientists** focus on:
- Exploratory data analysis and hypothesis testing
- Statistical modeling and inference
- Building predictive models
- Communicating insights to stakeholders
- Experimental design and A/B testing

**Machine Learning Engineers** focus on:
- Building scalable ML pipelines
- Deploying models to production
- Optimizing model performance and latency
- MLOps and model monitoring
- System design for ML applications

### The Data Science and ML Workflow

```
Problem Definition -> Data Collection -> Data Preparation -> Exploratory Analysis
        |                                                         |
   Deployment <- Model Optimization <- Model Assessment <- Model Training
        |
   Monitoring -> Feedback Loop -> Model Retraining
```

This iterative process is at the heart of both data science and ML engineering, with different roles emphasizing different stages.

## Core Skills: The Three Pillars

Success in data science and ML requires proficiency in three fundamental areas: mathematics, programming, and domain knowledge.

### Mathematics and Statistics

A solid mathematical foundation enables you to understand algorithms deeply, not just apply them.

#### Linear Algebra

Linear algebra is the language of machine learning, underlying everything from data representation to neural networks.

```python
import numpy as np

# Vectors and Matrices - The Building Blocks
# Data points are vectors, datasets are matrices
X = np.array([[1, 2, 3],
              [4, 5, 6],
              [7, 8, 9]])

# Matrix operations are fundamental to ML
# Dot product - measures similarity between vectors
v1 = np.array([1, 2, 3])
v2 = np.array([4, 5, 6])
similarity = np.dot(v1, v2)  # 32

# Matrix multiplication - core of neural networks
W = np.random.randn(3, 4)  # Weight matrix
b = np.random.randn(4)      # Bias vector
output = np.dot(X, W) + b   # Linear transformation

# Eigendecomposition - used in PCA and many algorithms
eigenvalues, eigenvectors = np.linalg.eig(X)

# Singular Value Decomposition - dimensionality reduction, recommendations
U, S, Vt = np.linalg.svd(X)

# Norms - measuring vector magnitudes
l2_norm = np.linalg.norm(v1)        # Euclidean distance
l1_norm = np.linalg.norm(v1, ord=1) # Manhattan distance

# Matrix properties important for ML
print(f"Rank: {np.linalg.matrix_rank(X)}")
print(f"Determinant: {np.linalg.det(X):.4f}")
print(f"Condition number: {np.linalg.cond(X):.4f}")
```

#### Calculus and Optimization

Calculus powers the optimization algorithms that train ML models.

```python
import numpy as np
import matplotlib.pyplot as plt

# Gradient Descent - The Foundation of ML Training
def gradient_descent(f, df, x0, learning_rate=0.01, n_iterations=100):
    """
    Generic gradient descent optimizer
    f: objective function
    df: gradient of f
    x0: starting point
    """
    x = x0
    history = [x]

    for _ in range(n_iterations):
        gradient = df(x)
        x = x - learning_rate * gradient
        history.append(x)

    return x, history

# Example: Minimizing a quadratic function
f = lambda x: x**2 + 2*x + 1       # f(x) = (x+1)^2
df = lambda x: 2*x + 2              # f'(x) = 2x + 2

optimal_x, history = gradient_descent(f, df, x0=5.0, learning_rate=0.1)
print(f"Optimal x: {optimal_x:.4f}")  # Should be close to -1

# Linear Regression via Gradient Descent
class LinearRegressionGD:
    def __init__(self, learning_rate=0.01, n_iterations=1000):
        self.lr = learning_rate
        self.n_iterations = n_iterations
        self.weights = None
        self.bias = None
        self.loss_history = []

    def fit(self, X, y):
        n_samples, n_features = X.shape
        self.weights = np.zeros(n_features)
        self.bias = 0

        for _ in range(self.n_iterations):
            # Forward pass
            y_pred = np.dot(X, self.weights) + self.bias

            # Compute loss (MSE)
            loss = np.mean((y_pred - y) ** 2)
            self.loss_history.append(loss)

            # Compute gradients
            dw = (2 / n_samples) * np.dot(X.T, (y_pred - y))
            db = (2 / n_samples) * np.sum(y_pred - y)

            # Update parameters
            self.weights -= self.lr * dw
            self.bias -= self.lr * db

        return self

    def predict(self, X):
        return np.dot(X, self.weights) + self.bias
```

#### Probability and Statistics

Statistical thinking is essential for understanding uncertainty and making valid inferences.

```python
import numpy as np
from scipy import stats
import pandas as pd

# Probability Distributions
# Understanding distributions is key to modeling

# Normal Distribution - most common in nature
mu, sigma = 0, 1
samples = np.random.normal(mu, sigma, 10000)
print(f"Mean: {np.mean(samples):.4f}, Std: {np.std(samples):.4f}")

# Important distributions for ML
distributions = {
    'Normal': stats.norm(0, 1),
    'Uniform': stats.uniform(0, 1),
    'Exponential': stats.expon(scale=1),
    'Poisson': stats.poisson(mu=5),
    'Binomial': stats.binom(n=10, p=0.5),
    'Beta': stats.beta(a=2, b=5)
}

# Maximum Likelihood Estimation
def mle_normal(data):
    """Estimate normal distribution parameters via MLE"""
    mu_hat = np.mean(data)
    sigma_hat = np.std(data, ddof=0)  # MLE uses ddof=0
    return mu_hat, sigma_hat

# Bayesian Inference - updating beliefs with evidence
def bayesian_update(prior_mean, prior_var, data_mean, data_var, n):
    """
    Update normal prior with normal likelihood
    Returns posterior mean and variance
    """
    posterior_var = 1 / (1/prior_var + n/data_var)
    posterior_mean = posterior_var * (prior_mean/prior_var + n*data_mean/data_var)
    return posterior_mean, posterior_var

# Hypothesis Testing
def ab_test_analysis(control, treatment, alpha=0.05):
    """
    Perform statistical analysis of A/B test results
    """
    # Two-sample t-test
    t_stat, p_value = stats.ttest_ind(control, treatment)

    # Effect size (Cohen's d)
    pooled_std = np.sqrt((np.var(control) + np.var(treatment)) / 2)
    cohens_d = (np.mean(treatment) - np.mean(control)) / pooled_std

    # Confidence interval for difference
    diff_mean = np.mean(treatment) - np.mean(control)
    se = np.sqrt(np.var(control)/len(control) + np.var(treatment)/len(treatment))
    ci = stats.t.interval(1-alpha, df=len(control)+len(treatment)-2,
                          loc=diff_mean, scale=se)

    return {
        'control_mean': np.mean(control),
        'treatment_mean': np.mean(treatment),
        'difference': diff_mean,
        'p_value': p_value,
        'significant': p_value < alpha,
        'cohens_d': cohens_d,
        'confidence_interval': ci
    }

# Example usage
np.random.seed(42)
control = np.random.normal(100, 15, 500)
treatment = np.random.normal(105, 15, 500)
results = ab_test_analysis(control, treatment)
print(f"A/B Test Results:")
print(f"  Difference: {results['difference']:.2f}")
print(f"  P-value: {results['p_value']:.4f}")
print(f"  Significant: {results['significant']}")
print(f"  Effect size (Cohen's d): {results['cohens_d']:.3f}")
```

### Programming Skills

Strong programming skills enable you to implement, experiment, and deploy ML solutions.

#### Python Fundamentals for Data Science

```python
import numpy as np
import pandas as pd
from typing import List, Dict, Optional, Callable
from dataclasses import dataclass
from functools import lru_cache
import logging

# Set up logging for ML experiments
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Data Classes for Clean ML Code
@dataclass
class ModelConfig:
    """Configuration for ML model training"""
    learning_rate: float = 0.001
    batch_size: int = 32
    epochs: int = 100
    hidden_dims: List[int] = None
    dropout_rate: float = 0.1

    def __post_init__(self):
        if self.hidden_dims is None:
            self.hidden_dims = [128, 64]

@dataclass
class TrainingResult:
    """Results from model training"""
    train_loss: List[float]
    val_loss: List[float]
    best_epoch: int
    best_val_loss: float
    training_time: float

# Efficient Data Processing Patterns
def process_data_in_chunks(filepath: str, chunk_size: int = 10000) -> pd.DataFrame:
    """Process large CSV files in chunks to manage memory"""
    chunks = []

    for chunk in pd.read_csv(filepath, chunksize=chunk_size):
        # Process each chunk
        chunk = clean_chunk(chunk)
        chunks.append(chunk)
        logger.info(f"Processed chunk with {len(chunk)} rows")

    return pd.concat(chunks, ignore_index=True)

def clean_chunk(df: pd.DataFrame) -> pd.DataFrame:
    """Clean a data chunk"""
    # Remove duplicates
    df = df.drop_duplicates()

    # Handle missing values
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    df[numeric_cols] = df[numeric_cols].fillna(df[numeric_cols].median())

    categorical_cols = df.select_dtypes(include=['object']).columns
    df[categorical_cols] = df[categorical_cols].fillna('unknown')

    return df

# Caching for Expensive Computations
@lru_cache(maxsize=128)
def compute_embeddings(text: str, model_name: str = 'default') -> tuple:
    """Cache expensive embedding computations"""
    # Simulated embedding computation
    np.random.seed(hash(text) % 2**32)
    embedding = tuple(np.random.randn(768))
    return embedding

# Generator Pattern for Memory-Efficient Data Loading
def data_generator(X: np.ndarray, y: np.ndarray, batch_size: int):
    """Generate batches of data for training"""
    n_samples = len(X)
    indices = np.arange(n_samples)
    np.random.shuffle(indices)

    for start in range(0, n_samples, batch_size):
        end = min(start + batch_size, n_samples)
        batch_indices = indices[start:end]
        yield X[batch_indices], y[batch_indices]

# Context Manager for Experiment Tracking
class ExperimentTracker:
    """Context manager for tracking ML experiments"""

    def __init__(self, experiment_name: str):
        self.experiment_name = experiment_name
        self.metrics = {}
        self.start_time = None

    def __enter__(self):
        import time
        self.start_time = time.time()
        logger.info(f"Starting experiment: {self.experiment_name}")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        import time
        duration = time.time() - self.start_time
        logger.info(f"Experiment {self.experiment_name} completed in {duration:.2f}s")
        if exc_type:
            logger.error(f"Experiment failed: {exc_val}")
        return False

    def log_metric(self, name: str, value: float):
        self.metrics[name] = value
        logger.info(f"{name}: {value:.4f}")

# Usage
with ExperimentTracker("baseline_model") as tracker:
    # Training code here
    tracker.log_metric("accuracy", 0.95)
    tracker.log_metric("f1_score", 0.93)
```

#### Data Manipulation with Pandas

```python
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Creating and Loading Data
df = pd.DataFrame({
    'user_id': range(1, 1001),
    'signup_date': pd.date_range('2023-01-01', periods=1000, freq='H'),
    'age': np.random.randint(18, 65, 1000),
    'revenue': np.random.exponential(100, 1000),
    'category': np.random.choice(['A', 'B', 'C'], 1000),
    'is_premium': np.random.choice([True, False], 1000, p=[0.3, 0.7])
})

# Advanced Filtering
# Multiple conditions with query method (more readable)
filtered = df.query('age >= 25 and revenue > 50 and category == "A"')

# Using loc with complex conditions
mask = (df['age'].between(25, 40)) & (df['is_premium']) & (df['revenue'] > df['revenue'].median())
filtered = df.loc[mask]

# Feature Engineering
df['signup_month'] = df['signup_date'].dt.to_period('M')
df['signup_dayofweek'] = df['signup_date'].dt.day_name()
df['revenue_log'] = np.log1p(df['revenue'])
df['age_group'] = pd.cut(df['age'], bins=[0, 25, 35, 45, 55, 100],
                         labels=['18-24', '25-34', '35-44', '45-54', '55+'])

# Aggregation Patterns
summary = df.groupby(['category', 'is_premium']).agg({
    'revenue': ['sum', 'mean', 'std', 'count'],
    'age': ['mean', 'min', 'max'],
    'user_id': 'nunique'
}).round(2)

# Flatten multi-level columns
summary.columns = ['_'.join(col).strip() for col in summary.columns.values]

# Window Functions (equivalent to SQL window functions)
df['revenue_rank'] = df.groupby('category')['revenue'].rank(ascending=False)
df['revenue_pct'] = df.groupby('category')['revenue'].transform(
    lambda x: x / x.sum() * 100
)
df['cumulative_revenue'] = df.sort_values('signup_date').groupby('category')['revenue'].cumsum()

# Rolling Statistics
df = df.sort_values('signup_date')
df['revenue_rolling_mean'] = df.groupby('category')['revenue'].transform(
    lambda x: x.rolling(window=24, min_periods=1).mean()
)

# Pivot Tables for Analysis
pivot = pd.pivot_table(
    df,
    values='revenue',
    index='age_group',
    columns='category',
    aggfunc=['sum', 'mean', 'count'],
    fill_value=0
)

# Merging and Joining
# Example: Joining with transaction data
transactions = pd.DataFrame({
    'user_id': np.random.choice(range(1, 1001), 5000),
    'transaction_date': pd.date_range('2023-01-01', periods=5000, freq='30min'),
    'amount': np.random.exponential(50, 5000)
})

# Left join to keep all users
user_transactions = df.merge(
    transactions.groupby('user_id').agg({
        'amount': ['sum', 'count', 'mean']
    }).reset_index(),
    on='user_id',
    how='left'
)

# Vectorized approach for categorization (faster than apply)
conditions = [
    df['revenue'] > df['revenue'].quantile(0.75),
    df['revenue'] > df['revenue'].quantile(0.25)
]
choices = ['high_value', 'medium_value']
df['value_segment'] = np.select(conditions, choices, default='low_value')
```

### Domain Knowledge

While technical skills are essential, understanding the business or scientific context of your work determines whether your models provide real value.

**Key Domain Knowledge Areas:**

- **Problem Framing**: Translating business questions into ML problems
- **Metric Selection**: Choosing appropriate success metrics aligned with business goals
- **Feature Engineering**: Creating meaningful features from domain expertise
- **Result Interpretation**: Explaining model outputs in domain-specific terms
- **Stakeholder Communication**: Presenting findings to non-technical audiences

## Career Development Paths

### Data Scientist Track

Data Scientists focus on deriving insights and building models to answer business questions.

**Junior Data Scientist (0-2 years)**
- Strong SQL and Python skills
- Basic statistics and ML knowledge
- Data visualization proficiency
- Ability to conduct exploratory analysis

**Mid-Level Data Scientist (2-5 years)**
- Advanced statistical modeling
- Feature engineering expertise
- A/B testing and experimentation
- Cross-functional collaboration
- Project ownership

**Senior Data Scientist (5+ years)**
- Complex problem formulation
- Research and methodology development
- Technical mentorship
- Strategic thinking
- Stakeholder management

### Machine Learning Engineer Track

ML Engineers focus on building production-grade ML systems.

**Junior ML Engineer (0-2 years)**
- Strong software engineering fundamentals
- ML algorithm understanding
- Basic model deployment
- Version control and testing

**Mid-Level ML Engineer (2-5 years)**
- ML pipeline development
- Model optimization and scaling
- MLOps practices
- System design for ML
- Performance monitoring

**Senior ML Engineer (5+ years)**
- Architecture design for ML systems
- Team technical leadership
- Cross-team collaboration
- Innovation and research

### Hybrid Roles

**Applied Scientist**: Combines research capabilities with production delivery. Common at research-focused companies.

**Analytics Engineer**: Bridges data engineering and analytics. Focuses on data modeling and transformation.

**ML Platform Engineer**: Builds infrastructure and tools that enable other ML practitioners.

## Technology Stack Overview

### Python Ecosystem

Python is the dominant language in data science and ML, with a rich ecosystem of libraries.

```python
# Core Scientific Computing
import numpy as np       # Numerical computing foundation
import pandas as pd      # Data manipulation and analysis
import scipy            # Scientific computing utilities

# Machine Learning
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.model_selection import cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, confusion_matrix

# Example: Complete ML Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer

def create_ml_pipeline(numeric_features: list, categorical_features: list):
    """Create a complete preprocessing and modeling pipeline"""

    # Preprocessing for numeric features
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])

    # Preprocessing for categorical features
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='constant', fill_value='missing')),
        ('encoder', LabelEncoder())  # Or OneHotEncoder for nominal
    ])

    # Combine preprocessing steps
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features)
        ])

    # Complete pipeline with model
    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
    ])

    return pipeline

# Hyperparameter Tuning
param_grid = {
    'classifier__n_estimators': [50, 100, 200],
    'classifier__max_depth': [5, 10, 20, None],
    'classifier__min_samples_split': [2, 5, 10]
}

# grid_search = GridSearchCV(
#     pipeline, param_grid, cv=5, scoring='f1_weighted', n_jobs=-1
# )
```

### Deep Learning Frameworks

#### PyTorch

PyTorch is the preferred framework for research and increasingly for production.

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
import numpy as np

# Custom Dataset
class TabularDataset(Dataset):
    def __init__(self, X: np.ndarray, y: np.ndarray):
        self.X = torch.FloatTensor(X)
        self.y = torch.LongTensor(y)

    def __len__(self):
        return len(self.X)

    def __getitem__(self, idx):
        return self.X[idx], self.y[idx]

# Neural Network Architecture
class MLP(nn.Module):
    def __init__(self, input_dim: int, hidden_dims: list, output_dim: int, dropout: float = 0.3):
        super().__init__()

        layers = []
        prev_dim = input_dim

        for hidden_dim in hidden_dims:
            layers.extend([
                nn.Linear(prev_dim, hidden_dim),
                nn.BatchNorm1d(hidden_dim),
                nn.ReLU(),
                nn.Dropout(dropout)
            ])
            prev_dim = hidden_dim

        layers.append(nn.Linear(prev_dim, output_dim))
        self.network = nn.Sequential(*layers)

    def forward(self, x):
        return self.network(x)

# Training Loop
def train_model(model, train_loader, val_loader, epochs=100, lr=0.001, device='cuda'):
    model = model.to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=0.01)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=5, factor=0.5)

    best_val_loss = float('inf')
    patience_counter = 0
    early_stopping_patience = 10

    for epoch in range(epochs):
        # Training phase
        model.train()
        train_loss = 0

        for X_batch, y_batch in train_loader:
            X_batch, y_batch = X_batch.to(device), y_batch.to(device)

            optimizer.zero_grad()
            outputs = model(X_batch)
            loss = criterion(outputs, y_batch)
            loss.backward()

            # Gradient clipping for stability
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

            optimizer.step()
            train_loss += loss.item()

        # Validation phase
        model.train(False)
        val_loss = 0
        correct = 0
        total = 0

        with torch.no_grad():
            for X_batch, y_batch in val_loader:
                X_batch, y_batch = X_batch.to(device), y_batch.to(device)
                outputs = model(X_batch)
                val_loss += criterion(outputs, y_batch).item()

                _, predicted = outputs.max(1)
                total += y_batch.size(0)
                correct += predicted.eq(y_batch).sum().item()

        train_loss /= len(train_loader)
        val_loss /= len(val_loader)
        val_acc = correct / total

        scheduler.step(val_loss)

        # Early stopping
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            patience_counter = 0
            torch.save(model.state_dict(), 'best_model.pth')
        else:
            patience_counter += 1
            if patience_counter >= early_stopping_patience:
                print(f"Early stopping at epoch {epoch}")
                break

        if epoch % 10 == 0:
            print(f"Epoch {epoch}: Train Loss={train_loss:.4f}, Val Loss={val_loss:.4f}, Val Acc={val_acc:.4f}")

    return model
```

#### TensorFlow/Keras

TensorFlow offers production-ready tools and Keras provides a user-friendly API.

```python
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, Model
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau

# Functional API for Flexible Architectures
def build_model(input_dim: int, num_classes: int):
    inputs = keras.Input(shape=(input_dim,))

    x = layers.Dense(256, activation='relu')(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.3)(x)

    x = layers.Dense(128, activation='relu')(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.3)(x)

    x = layers.Dense(64, activation='relu')(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.2)(x)

    outputs = layers.Dense(num_classes, activation='softmax')(x)

    model = Model(inputs, outputs)

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )

    return model

# Callbacks for Training
callbacks = [
    EarlyStopping(
        monitor='val_loss',
        patience=10,
        restore_best_weights=True
    ),
    ModelCheckpoint(
        'best_model.keras',
        monitor='val_loss',
        save_best_only=True
    ),
    ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.5,
        patience=5,
        min_lr=1e-6
    )
]

# Training example
# model = build_model(input_dim=100, num_classes=10)
# history = model.fit(
#     X_train, y_train,
#     validation_data=(X_val, y_val),
#     epochs=100,
#     batch_size=32,
#     callbacks=callbacks
# )
```

### Cloud Platforms for ML

Modern data science often involves cloud-based compute and services.

```python
# AWS SageMaker Example
import sagemaker
from sagemaker.sklearn import SKLearn
from sagemaker.tuner import HyperparameterTuner, ContinuousParameter, IntegerParameter

# Define training job
sklearn_estimator = SKLearn(
    entry_point='train.py',
    role=sagemaker.get_execution_role(),
    instance_type='ml.m5.xlarge',
    instance_count=1,
    framework_version='1.0-1',
    py_version='py3',
    hyperparameters={
        'n_estimators': 100,
        'max_depth': 10
    }
)

# Hyperparameter tuning
hyperparameter_ranges = {
    'n_estimators': IntegerParameter(50, 300),
    'max_depth': IntegerParameter(3, 20),
    'learning_rate': ContinuousParameter(0.01, 0.3)
}

tuner = HyperparameterTuner(
    sklearn_estimator,
    objective_metric_name='validation:auc',
    hyperparameter_ranges=hyperparameter_ranges,
    max_jobs=20,
    max_parallel_jobs=4
)

# Google Cloud AI Platform / Vertex AI
from google.cloud import aiplatform

aiplatform.init(project='your-project', location='us-central1')

# Create and run training job
job = aiplatform.CustomTrainingJob(
    display_name='my-training-job',
    script_path='train.py',
    container_uri='gcr.io/cloud-aiplatform/training/scikit-learn-cpu.1-0:latest',
    requirements=['pandas', 'scikit-learn']
)

# model = job.run(
#     replica_count=1,
#     machine_type='n1-standard-4',
#     args=['--epochs', '100', '--batch-size', '32']
# )
```

### MLOps Tools

```python
# MLflow for Experiment Tracking
import mlflow
import mlflow.sklearn

mlflow.set_tracking_uri("http://localhost:5000")
mlflow.set_experiment("my_experiment")

with mlflow.start_run(run_name="baseline_model"):
    # Log parameters
    mlflow.log_param("n_estimators", 100)
    mlflow.log_param("max_depth", 10)

    # Train model
    from sklearn.ensemble import RandomForestClassifier
    model = RandomForestClassifier(n_estimators=100, max_depth=10)
    # model.fit(X_train, y_train)

    # Log metrics
    # train_acc = model.score(X_train, y_train)
    # val_acc = model.score(X_val, y_val)
    # mlflow.log_metric("train_accuracy", train_acc)
    # mlflow.log_metric("val_accuracy", val_acc)

    # Log model
    # mlflow.sklearn.log_model(model, "model")

# Weights & Biases for Experiment Tracking
import wandb

wandb.init(project="my-project", name="baseline-run")

wandb.config.update({
    "learning_rate": 0.001,
    "epochs": 100,
    "batch_size": 32
})

# for epoch in range(epochs):
#     # Training code
#     wandb.log({
#         "train_loss": train_loss,
#         "val_loss": val_loss,
#         "val_accuracy": val_acc
#     })

wandb.finish()
```

## Learning Path Recommendations

### Foundation Stage (1-3 Months)

Build the essential groundwork for all future learning.

1. **Python Programming**
   - Core Python syntax and data structures
   - NumPy for numerical computing
   - Pandas for data manipulation
   - Practice: Complete Python exercises on LeetCode or HackerRank

2. **Mathematics Fundamentals**
   - Linear algebra basics: vectors, matrices, operations
   - Calculus: derivatives, gradients, chain rule
   - Probability: distributions, Bayes theorem
   - Practice: Khan Academy, 3Blue1Brown videos

3. **Statistics Essentials**
   - Descriptive statistics
   - Probability distributions
   - Hypothesis testing basics
   - Practice: Complete statistical exercises with real datasets

4. **SQL Proficiency**
   - CRUD operations and JOINs
   - Aggregations and GROUP BY
   - Window functions
   - Practice: SQLZoo, LeetCode SQL problems

### Intermediate Stage (3-6 Months)

Develop practical ML skills and project experience.

1. **Machine Learning Algorithms**
   - Supervised learning: regression, classification
   - Unsupervised learning: clustering, dimensionality reduction
   - Model validation and assessment
   - Practice: Kaggle competitions (start with "Getting Started" competitions)

2. **Deep Learning Fundamentals**
   - Neural network architecture
   - Backpropagation and optimization
   - CNNs for images, RNNs/Transformers for sequences
   - Practice: Build image classifier, text classifier

3. **Feature Engineering**
   - Feature creation and transformation
   - Handling missing data
   - Encoding categorical variables
   - Feature selection techniques

4. **Model Deployment Basics**
   - REST API development (FastAPI/Flask)
   - Docker containerization
   - Basic cloud deployment
   - Practice: Deploy a model to AWS/GCP/Azure

### Advanced Stage (6-12 Months)

Master production-grade ML and specialized domains.

1. **MLOps and Production ML**
   - ML pipeline design and orchestration
   - Model monitoring and drift detection
   - A/B testing for ML models
   - CI/CD for ML systems

2. **Advanced Deep Learning**
   - Transformer architectures
   - Generative models (GANs, VAEs, Diffusion)
   - Transfer learning and fine-tuning
   - Multi-modal learning

3. **Specialized Domains** (choose based on interest)
   - Natural Language Processing
   - Computer Vision
   - Recommender Systems
   - Time Series Forecasting
   - Reinforcement Learning

4. **System Design for ML**
   - Designing scalable ML systems
   - Real-time inference systems
   - Feature stores
   - Model serving architectures

## Interview Preparation

### Technical Fundamentals

**Statistics and Probability**
- Explain the central limit theorem
- When would you use Bayesian vs frequentist approaches?
- How do you detect and handle outliers?
- Explain Type I and Type II errors

**Machine Learning Concepts**
- Explain the bias-variance tradeoff
- How do you handle imbalanced datasets?
- Compare L1 vs L2 regularization
- Explain cross-validation strategies
- How do you select features?

**Deep Learning**
- Explain backpropagation step by step
- Compare different optimizers (SGD, Adam, etc.)
- How do you prevent overfitting in neural networks?
- Explain attention mechanisms
- What is transfer learning and when is it useful?

### Coding Assessments

```python
# Common Data Science Coding Questions

# Implement K-means from scratch
def kmeans(X, k, max_iters=100):
    n_samples, n_features = X.shape

    # Random initialization
    centroids = X[np.random.choice(n_samples, k, replace=False)]

    for _ in range(max_iters):
        # Assign points to nearest centroid
        distances = np.sqrt(((X[:, np.newaxis] - centroids) ** 2).sum(axis=2))
        labels = np.argmin(distances, axis=1)

        # Update centroids
        new_centroids = np.array([X[labels == i].mean(axis=0) for i in range(k)])

        # Check convergence
        if np.allclose(centroids, new_centroids):
            break
        centroids = new_centroids

    return labels, centroids

# Implement Logistic Regression
class LogisticRegression:
    def __init__(self, lr=0.01, n_iters=1000):
        self.lr = lr
        self.n_iters = n_iters

    def sigmoid(self, z):
        return 1 / (1 + np.exp(-np.clip(z, -500, 500)))

    def fit(self, X, y):
        n_samples, n_features = X.shape
        self.weights = np.zeros(n_features)
        self.bias = 0

        for _ in range(self.n_iters):
            z = np.dot(X, self.weights) + self.bias
            predictions = self.sigmoid(z)

            dw = (1/n_samples) * np.dot(X.T, (predictions - y))
            db = (1/n_samples) * np.sum(predictions - y)

            self.weights -= self.lr * dw
            self.bias -= self.lr * db

    def predict_proba(self, X):
        return self.sigmoid(np.dot(X, self.weights) + self.bias)

    def predict(self, X, threshold=0.5):
        return (self.predict_proba(X) >= threshold).astype(int)

# Implement assessment metrics
def precision_recall_f1(y_true, y_pred):
    tp = np.sum((y_true == 1) & (y_pred == 1))
    fp = np.sum((y_true == 0) & (y_pred == 1))
    fn = np.sum((y_true == 1) & (y_pred == 0))

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0

    return precision, recall, f1
```

### System Design Questions

Prepare to discuss end-to-end ML system design:

**Common Questions:**
- Design a recommendation system for an e-commerce platform
- Design a fraud detection system with real-time requirements
- Design a content moderation system using ML
- Design an ML pipeline for a ride-sharing surge pricing model

**Key Considerations:**
- Data collection and storage
- Feature engineering pipeline
- Model training and selection
- Model serving and scaling
- Monitoring and retraining
- A/B testing framework

### Behavioral and Case Study

**Project Discussion:**
- Explain your most impactful ML project
- What challenges did you face and how did you overcome them?
- How did you measure success?
- What would you do differently?

**Case Studies:**
- Given a business problem, how would you approach it with ML?
- How would you prioritize between accuracy and latency?
- How would you explain model predictions to stakeholders?

## Further Reading

Continue your learning journey with these Code Wiki resources:

**Foundational Topics:**
- Statistics fundamentals for data science
- Advanced SQL techniques
- Python data engineering patterns

**Machine Learning:**
- Deep learning architectures
- Natural language processing
- Computer vision fundamentals
- Recommender systems

**Production ML:**
- MLOps best practices
- Model serving and scaling
- Feature store design
- A/B testing for ML

**Specialized Topics:**
- Transformer architectures explained
- Retrieval-augmented generation (RAG)
- Vector databases for ML

Data science and machine learning are rapidly evolving fields that reward continuous learning. Focus on building strong fundamentals, gain hands-on experience through projects, and stay current with emerging techniques and tools. The most effective practitioners combine deep technical skills with the ability to translate business problems into impactful ML solutions.
