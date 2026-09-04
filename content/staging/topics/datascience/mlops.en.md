---
title: MLOps Machine Learning Operations Guide
description: Master MLOps for ML model deployment and management
track: datascience
section: deployment
difficulty: advanced
tags:
  - MLOps
  - Model Deployment
  - MLflow
  - Feature Store
status: imported
origin: old/src/content/docs/ai/mlops.en.md
divergence: 0.143
issues: []
legacy:
  category: AI
  subcategory: MLOps
  order: 10
  lastUpdated: 2026-01-07
---

MLOps (Machine Learning Operations) bridges the gap between machine learning development and production deployment. It combines machine learning, DevOps, and data engineering practices to standardize and streamline the ML lifecycle. This comprehensive guide covers the essential concepts, tools, and best practices for implementing MLOps in production environments.

---

## MLOps Concepts

### What is MLOps?

MLOps is a set of practices that aims to deploy and maintain machine learning models in production reliably and efficiently. It applies DevOps principles to the machine learning lifecycle, addressing the unique challenges of ML systems.

**Core Objectives:**
- Automate the ML pipeline from data preparation to model deployment
- Enable reproducibility of experiments and model training
- Ensure model quality through continuous testing and validation
- Monitor model performance and detect degradation
- Facilitate collaboration between data scientists, ML engineers, and operations teams

### The ML Lifecycle

```
Data Collection -> Data Preparation -> Feature Engineering -> Model Training
        |                                                        |
   Data Versioning                                        Model Versioning
        |                                                        |
   Feature Store  <---------------------------------------->  Model Registry
        |                                                        |
   Model Serving <------- CI/CD Pipeline <--------------- Model Validation
        |                                                        |
   Production Deployment ---------> Monitoring ----------> Retraining Trigger
```

### MLOps Maturity Levels

| Level | Description | Characteristics |
|-------|-------------|-----------------|
| Level 0 | Manual Process | Manual model training, no CI/CD, manual deployment |
| Level 1 | ML Pipeline Automation | Automated training pipeline, basic monitoring |
| Level 2 | CI/CD Pipeline Automation | Automated testing, continuous training, A/B testing |
| Level 3 | Full Automation | Automated retraining, drift detection, self-healing |

### Key Components of MLOps

```python
# MLOps Architecture Overview
mlops_components = {
    "data_management": {
        "data_versioning": ["DVC", "Delta Lake", "LakeFS"],
        "data_validation": ["Great Expectations", "TFDV", "Pandera"],
        "feature_store": ["Feast", "Tecton", "Hopsworks"]
    },
    "model_development": {
        "experiment_tracking": ["MLflow", "Weights & Biases", "Neptune"],
        "model_registry": ["MLflow", "SageMaker", "Vertex AI"],
        "hyperparameter_tuning": ["Optuna", "Ray Tune", "Hyperopt"]
    },
    "deployment": {
        "model_serving": ["TensorFlow Serving", "Triton", "Seldon Core"],
        "container_orchestration": ["Kubernetes", "Docker Swarm"],
        "api_gateway": ["Kong", "Istio", "AWS API Gateway"]
    },
    "monitoring": {
        "model_monitoring": ["Evidently AI", "Whylabs", "Arize"],
        "logging": ["ELK Stack", "Grafana Loki"],
        "alerting": ["Prometheus", "PagerDuty", "Datadog"]
    }
}
```

---

## Experiment Tracking

### Why Experiment Tracking Matters

Machine learning development is inherently experimental. Data scientists run numerous experiments with different hyperparameters, features, and model architectures. Without proper tracking, it becomes impossible to reproduce results or understand what led to improvements.

### MLflow Experiment Tracking

MLflow is the most widely adopted open-source platform for managing the ML lifecycle.

```python
import mlflow
import mlflow.sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import train_test_split
from sklearn.datasets import load_iris

# Set tracking URI (local or remote)
mlflow.set_tracking_uri("http://localhost:5000")

# Set experiment name
mlflow.set_experiment("iris-classification")

# Load and prepare data
iris = load_iris()
X_train, X_test, y_train, y_test = train_test_split(
    iris.data, iris.target, test_size=0.2, random_state=42
)

# Define hyperparameters
params = {
    "n_estimators": 100,
    "max_depth": 5,
    "min_samples_split": 2,
    "random_state": 42
}

# Start MLflow run
with mlflow.start_run(run_name="rf-baseline"):
    # Log parameters
    mlflow.log_params(params)

    # Log custom tags
    mlflow.set_tags({
        "model_type": "RandomForest",
        "feature_engineering": "none",
        "author": "data-science-team"
    })

    # Train model
    model = RandomForestClassifier(**params)
    model.fit(X_train, y_train)

    # Make predictions
    y_pred = model.predict(X_test)

    # Calculate and log metrics
    accuracy = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average="weighted")

    mlflow.log_metrics({
        "accuracy": accuracy,
        "f1_score": f1,
        "train_samples": len(X_train),
        "test_samples": len(X_test)
    })

    # Log model
    mlflow.sklearn.log_model(
        model,
        "model",
        registered_model_name="iris-classifier"
    )

    # Log artifacts (plots, data samples, etc.)
    import matplotlib.pyplot as plt
    from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay

    cm = confusion_matrix(y_test, y_pred)
    disp = ConfusionMatrixDisplay(cm, display_labels=iris.target_names)
    disp.plot()
    plt.savefig("confusion_matrix.png")
    mlflow.log_artifact("confusion_matrix.png")

    print(f"Run ID: {mlflow.active_run().info.run_id}")
    print(f"Accuracy: {accuracy:.4f}, F1: {f1:.4f}")
```

### Weights & Biases Integration

```python
import wandb
import torch
import torch.nn as nn
from torch.utils.data import DataLoader

# Initialize W&B
wandb.init(
    project="image-classification",
    name="resnet50-experiment",
    config={
        "learning_rate": 0.001,
        "epochs": 50,
        "batch_size": 32,
        "architecture": "ResNet50",
        "optimizer": "Adam",
        "dataset": "CIFAR-10"
    }
)

# Access config
config = wandb.config

class Trainer:
    def __init__(self, model, train_loader, val_loader, criterion, optimizer):
        self.model = model
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.criterion = criterion
        self.optimizer = optimizer
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)

    def train_epoch(self, epoch):
        self.model.train()
        total_loss = 0
        correct = 0
        total = 0

        for batch_idx, (data, target) in enumerate(self.train_loader):
            data, target = data.to(self.device), target.to(self.device)

            self.optimizer.zero_grad()
            output = self.model(data)
            loss = self.criterion(output, target)
            loss.backward()
            self.optimizer.step()

            total_loss += loss.item()
            pred = output.argmax(dim=1)
            correct += pred.eq(target).sum().item()
            total += target.size(0)

            # Log batch metrics
            if batch_idx % 100 == 0:
                wandb.log({
                    "batch_loss": loss.item(),
                    "batch_accuracy": correct / total
                })

        return total_loss / len(self.train_loader), correct / total

    def validate(self):
        self.model.eval()
        total_loss = 0
        correct = 0
        total = 0

        with torch.no_grad():
            for data, target in self.val_loader:
                data, target = data.to(self.device), target.to(self.device)
                output = self.model(data)
                loss = self.criterion(output, target)

                total_loss += loss.item()
                pred = output.argmax(dim=1)
                correct += pred.eq(target).sum().item()
                total += target.size(0)

        return total_loss / len(self.val_loader), correct / total

    def train(self, epochs):
        best_val_acc = 0

        for epoch in range(epochs):
            train_loss, train_acc = self.train_epoch(epoch)
            val_loss, val_acc = self.validate()

            # Log epoch metrics to W&B
            wandb.log({
                "epoch": epoch,
                "train_loss": train_loss,
                "train_accuracy": train_acc,
                "val_loss": val_loss,
                "val_accuracy": val_acc,
                "learning_rate": self.optimizer.param_groups[0]["lr"]
            })

            # Save best model
            if val_acc > best_val_acc:
                best_val_acc = val_acc
                torch.save(self.model.state_dict(), "best_model.pth")
                wandb.save("best_model.pth")

                # Log model artifact
                artifact = wandb.Artifact(
                    name="best-model",
                    type="model",
                    metadata={"val_accuracy": val_acc}
                )
                artifact.add_file("best_model.pth")
                wandb.log_artifact(artifact)

            print(f"Epoch {epoch}: Train Loss={train_loss:.4f}, Val Acc={val_acc:.4f}")

# Finish the run
wandb.finish()
```

---

## Model Versioning

### Why Version Models?

Model versioning is crucial for:
- **Reproducibility**: Recreate any previous model state
- **Rollback capability**: Quickly revert to a working model
- **Audit trails**: Track who changed what and when
- **Collaboration**: Enable team members to work on different versions

### MLflow Model Registry

```python
import mlflow
from mlflow.tracking import MlflowClient

# Initialize MLflow client
client = MlflowClient()

# Register a new model version
run_id = "abc123"  # from training run
model_uri = f"runs:/{run_id}/model"
model_details = mlflow.register_model(
    model_uri=model_uri,
    name="fraud-detection-model"
)

# Transition model to staging
client.transition_model_version_stage(
    name="fraud-detection-model",
    version=model_details.version,
    stage="Staging"
)

# Add model description
client.update_model_version(
    name="fraud-detection-model",
    version=model_details.version,
    description="XGBoost model trained on Q4 2024 data with enhanced feature engineering"
)

# Set model version tags
client.set_model_version_tag(
    name="fraud-detection-model",
    version=model_details.version,
    key="validation_status",
    value="passed"
)

# Load model from registry
model_version = 1
model = mlflow.pyfunc.load_model(
    model_uri=f"models:/fraud-detection-model/{model_version}"
)

# Load model by stage
staging_model = mlflow.pyfunc.load_model(
    model_uri="models:/fraud-detection-model/Staging"
)

production_model = mlflow.pyfunc.load_model(
    model_uri="models:/fraud-detection-model/Production"
)

# List all versions of a model
versions = client.search_model_versions("name='fraud-detection-model'")
for v in versions:
    print(f"Version {v.version}: Stage={v.current_stage}, Status={v.status}")
```

### DVC for Data and Model Versioning

```yaml
# dvc.yaml - Pipeline definition
stages:
  prepare:
    cmd: python src/prepare_data.py
    deps:
      - src/prepare_data.py
      - data/raw/
    params:
      - prepare.train_ratio
      - prepare.random_seed
    outs:
      - data/processed/train.csv
      - data/processed/test.csv

  train:
    cmd: python src/train.py
    deps:
      - src/train.py
      - data/processed/train.csv
    params:
      - train.n_estimators
      - train.max_depth
      - train.learning_rate
    outs:
      - models/model.pkl
    metrics:
      - metrics/scores.json:
          cache: false
    plots:
      - metrics/confusion_matrix.csv:
          x: predicted
          y: actual

  assess:
    cmd: python src/assess.py
    deps:
      - src/assess.py
      - models/model.pkl
      - data/processed/test.csv
    metrics:
      - metrics/assessment_scores.json:
          cache: false
```

```bash
# DVC Commands
# Initialize DVC
dvc init

# Add data to DVC tracking
dvc add data/raw/dataset.csv

# Run pipeline
dvc repro

# Push data to remote storage
dvc push

# Compare experiments
dvc metrics diff

# Create and switch experiments
dvc exp run --name baseline
dvc exp run --name improved -S train.n_estimators=200

# List experiments
dvc exp show
```

---

## Feature Store

### Understanding Feature Stores

A feature store is a centralized repository for storing, managing, and serving features for machine learning models. It addresses the challenge of feature reuse and consistency between training and serving.

**Key Benefits:**
- **Feature reusability**: Share features across multiple models
- **Consistency**: Same feature values in training and inference
- **Point-in-time correctness**: Prevent data leakage in training
- **Low-latency serving**: Optimized feature retrieval for online inference

### Feast Implementation

```python
# feature_repo/feature_definitions.py
from datetime import timedelta
from feast import Entity, Feature, FeatureView, FileSource, ValueType
from feast.types import Float32, Int64, String

# Define entities
customer = Entity(
    name="customer_id",
    value_type=ValueType.INT64,
    description="Unique customer identifier"
)

# Define data sources
customer_stats_source = FileSource(
    path="data/customer_stats.parquet",
    timestamp_field="event_timestamp",
    created_timestamp_column="created_timestamp"
)

# Define feature views
customer_stats_fv = FeatureView(
    name="customer_stats",
    entities=["customer_id"],
    ttl=timedelta(days=90),
    schema=[
        Feature(name="total_transactions", dtype=Int64),
        Feature(name="avg_transaction_amount", dtype=Float32),
        Feature(name="days_since_last_purchase", dtype=Int64),
        Feature(name="customer_segment", dtype=String),
        Feature(name="lifetime_value", dtype=Float32),
    ],
    online=True,
    source=customer_stats_source,
    tags={"team": "fraud-detection", "owner": "data-engineering"}
)
```

```python
# feature_serving.py
from feast import FeatureStore
from datetime import datetime
import pandas as pd

# Initialize feature store
store = FeatureStore(repo_path="./feature_repo")

# Materialize features to online store
store.materialize_incremental(end_date=datetime.now())

# Get historical features for training
entity_df = pd.DataFrame({
    "customer_id": [1001, 1002, 1003, 1004, 1005],
    "event_timestamp": [
        datetime(2024, 1, 1, 12, 0, 0),
        datetime(2024, 1, 1, 12, 30, 0),
        datetime(2024, 1, 1, 13, 0, 0),
        datetime(2024, 1, 1, 13, 30, 0),
        datetime(2024, 1, 1, 14, 0, 0),
    ]
})

training_df = store.get_historical_features(
    entity_df=entity_df,
    features=[
        "customer_stats:total_transactions",
        "customer_stats:avg_transaction_amount",
        "customer_stats:lifetime_value",
        "customer_stats:customer_segment"
    ]
).to_df()

print(training_df.head())

# Get online features for inference
online_features = store.get_online_features(
    features=[
        "customer_stats:total_transactions",
        "customer_stats:avg_transaction_amount",
    ],
    entity_rows=[
        {"customer_id": 1001},
        {"customer_id": 1002}
    ]
).to_dict()

print(online_features)
```

### Feature Store Architecture

```
+-------------------+     +-------------------+     +-------------------+
|  Data Sources     |     |   Feature Store   |     |   Consumers       |
+-------------------+     +-------------------+     +-------------------+
|                   |     |                   |     |                   |
| Batch Sources     |---->| Feature Registry  |---->| Training Pipeline |
| - Data Warehouse  |     | - Definitions     |     | - Historical      |
| - Data Lake       |     | - Metadata        |     |   Features        |
|                   |     | - Lineage         |     |                   |
| Stream Sources    |     +-------------------+     | Inference Service |
| - Kafka           |     |                   |     | - Online Features |
| - Kinesis         |---->| Offline Store     |     |                   |
|                   |     | - Parquet/Delta   |---->| Monitoring        |
|                   |     | - Historical Data |     | - Feature Health  |
+-------------------+     +-------------------+     +-------------------+
                          |                   |
                          | Online Store      |
                          | - Redis/DynamoDB  |
                          | - Low Latency     |
                          +-------------------+
```

---

## Model Serving

### Serving Architectures

Model serving refers to deploying trained models to production to make predictions on new data. There are several patterns for serving models.

**Batch Inference:**
```python
# batch_inference.py
import pandas as pd
import mlflow
from pyspark.sql import SparkSession

# Initialize Spark
spark = SparkSession.builder \
    .appName("BatchInference") \
    .getOrCreate()

# Load model from MLflow
model_uri = "models:/fraud-detection-model/Production"
model = mlflow.pyfunc.spark_udf(spark, model_uri)

# Load batch data
df = spark.read.parquet("s3://data-lake/transactions/date=2024-01-15/")

# Apply model
predictions = df.withColumn("fraud_probability", model(*df.columns))

# Save predictions
predictions.write.parquet(
    "s3://predictions/fraud/date=2024-01-15/",
    mode="overwrite"
)
```

**Real-time Inference with FastAPI:**
```python
# model_server.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import mlflow
import numpy as np
from prometheus_client import Counter, Histogram, generate_latest
import time

app = FastAPI(title="Model Serving API")

# Prometheus metrics
PREDICTION_COUNTER = Counter(
    "predictions_total",
    "Total predictions made",
    ["model_name", "model_version"]
)
PREDICTION_LATENCY = Histogram(
    "prediction_latency_seconds",
    "Prediction latency in seconds",
    ["model_name"]
)

# Load model at startup
MODEL_NAME = "fraud-detection-model"
MODEL_VERSION = "Production"
model = mlflow.pyfunc.load_model(f"models:/{MODEL_NAME}/{MODEL_VERSION}")

class PredictionRequest(BaseModel):
    features: List[float]
    customer_id: str

class PredictionResponse(BaseModel):
    customer_id: str
    prediction: float
    model_version: str
    latency_ms: float

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    start_time = time.time()

    try:
        # Prepare input
        input_data = np.array(request.features).reshape(1, -1)

        # Make prediction
        prediction = model.predict(input_data)[0]

        # Calculate latency
        latency_ms = (time.time() - start_time) * 1000

        # Update metrics
        PREDICTION_COUNTER.labels(
            model_name=MODEL_NAME,
            model_version=MODEL_VERSION
        ).inc()
        PREDICTION_LATENCY.labels(model_name=MODEL_NAME).observe(latency_ms / 1000)

        return PredictionResponse(
            customer_id=request.customer_id,
            prediction=float(prediction),
            model_version=MODEL_VERSION,
            latency_ms=latency_ms
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model": MODEL_NAME, "version": MODEL_VERSION}

@app.get("/metrics")
async def metrics():
    return generate_latest()
```

### TensorFlow Serving

```python
# Export model for TensorFlow Serving
import tensorflow as tf

# Save model in SavedModel format
model.save(
    "exported_models/1",  # Version directory
    save_format="tf"
)

# Create serving signature
@tf.function(input_signature=[tf.TensorSpec(shape=[None, 10], dtype=tf.float32)])
def serving_fn(inputs):
    return {"predictions": model(inputs)}

tf.saved_model.save(
    model,
    "exported_models/1",
    signatures={"serving_default": serving_fn}
)
```

```yaml
# docker-compose.yaml for TensorFlow Serving
version: "3"
services:
  tf-serving:
    image: tensorflow/serving:latest
    ports:
      - "8501:8501"
      - "8500:8500"
    volumes:
      - ./exported_models:/models/fraud_model
    environment:
      - MODEL_NAME=fraud_model
    command: >
      --model_config_file=/models/model.config
      --monitoring_config_file=/models/monitoring.config
```

### Triton Inference Server

```
# config.pbtxt for Triton
name: "fraud_detector"
platform: "pytorch_libtorch"
max_batch_size: 64
input [
  {
    name: "INPUT"
    data_type: TYPE_FP32
    dims: [ 10 ]
  }
]
output [
  {
    name: "OUTPUT"
    data_type: TYPE_FP32
    dims: [ 1 ]
  }
]
instance_group [
  {
    count: 2
    kind: KIND_GPU
    gpus: [ 0, 1 ]
  }
]
dynamic_batching {
  preferred_batch_size: [ 16, 32, 64 ]
  max_queue_delay_microseconds: 100
}
```

```python
# Client code for Triton
import tritonclient.http as httpclient
import numpy as np

client = httpclient.InferenceServerClient(url="localhost:8000")

# Prepare input
input_data = np.random.randn(1, 10).astype(np.float32)
inputs = [httpclient.InferInput("INPUT", input_data.shape, "FP32")]
inputs[0].set_data_from_numpy(input_data)

# Prepare output
outputs = [httpclient.InferRequestedOutput("OUTPUT")]

# Make inference request
response = client.infer(
    model_name="fraud_detector",
    inputs=inputs,
    outputs=outputs
)

result = response.as_numpy("OUTPUT")
print(f"Prediction: {result}")
```

---

## CI/CD for ML

### ML Pipeline with GitHub Actions

```yaml
# .github/workflows/ml-pipeline.yaml
name: ML Pipeline

on:
  push:
    branches: [main]
    paths:
      - "src/**"
      - "data/**"
      - "models/**"
  pull_request:
    branches: [main]
  schedule:
    - cron: "0 0 * * 0"  # Weekly retraining

env:
  MLFLOW_TRACKING_URI: ${{ secrets.MLFLOW_TRACKING_URI }}
  AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
  AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

jobs:
  data-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.10"
          cache: "pip"

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Validate data quality
        run: |
          python src/data_validation.py \
            --input data/raw/ \
            --config config/data_expectations.yaml

      - name: Check for data drift
        run: |
          python src/data_drift.py \
            --reference data/reference/ \
            --current data/raw/

  train:
    needs: data-validation
    runs-on: ubuntu-latest
    outputs:
      model_version: ${{ steps.train.outputs.model_version }}
      run_id: ${{ steps.train.outputs.run_id }}
    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.10"
          cache: "pip"

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Train model
        id: train
        run: |
          python src/train.py \
            --config config/training_config.yaml \
            --output-dir models/

          echo "model_version=$(cat models/version.txt)" >> $GITHUB_OUTPUT
          echo "run_id=$(cat models/run_id.txt)" >> $GITHUB_OUTPUT

      - name: Upload model artifact
        uses: actions/upload-artifact@v4
        with:
          name: model-${{ steps.train.outputs.model_version }}
          path: models/

  assess:
    needs: train
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Download model
        uses: actions/download-artifact@v4
        with:
          name: model-${{ needs.train.outputs.model_version }}
          path: models/

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.10"

      - name: Assess model
        id: assess
        run: |
          python src/assess.py \
            --model models/ \
            --test-data data/test/ \
            --output metrics.json

          # Check if model meets performance threshold
          python src/check_thresholds.py \
            --metrics metrics.json \
            --thresholds config/thresholds.yaml

  register-model:
    needs: [train, assess]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Register model to MLflow
        run: |
          python src/register_model.py \
            --run-id ${{ needs.train.outputs.run_id }} \
            --model-name fraud-detection-model \
            --stage Staging

  deploy-staging:
    needs: register-model
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging-ml.example.com
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to staging
        run: |
          kubectl set image deployment/fraud-detector \
            model-server=gcr.io/${{ env.PROJECT_ID }}/model-server:${{ needs.train.outputs.model_version }}

      - name: Run integration tests
        run: |
          python tests/integration/test_staging.py \
            --endpoint https://staging-ml.example.com

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://ml.example.com
    steps:
      - name: Promote to production
        run: |
          python src/promote_model.py \
            --model-name fraud-detection-model \
            --from-stage Staging \
            --to-stage Production

      - name: Deploy canary
        run: |
          kubectl apply -f k8s/canary-deployment.yaml

      - name: Monitor canary metrics
        run: |
          python src/canary_analysis.py \
            --duration 30m \
            --threshold 0.99

      - name: Full rollout
        run: |
          kubectl apply -f k8s/production-deployment.yaml
```

### Model Testing Framework

```python
# tests/test_model.py
import pytest
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, precision_score, recall_score

class TestModelQuality:
    """Model quality tests"""

    @pytest.fixture
    def model(self):
        import mlflow
        return mlflow.pyfunc.load_model("models:/fraud-detection-model/Staging")

    @pytest.fixture
    def test_data(self):
        return pd.read_parquet("data/test/test_data.parquet")

    def test_accuracy_threshold(self, model, test_data):
        """Test that model accuracy meets minimum threshold"""
        X = test_data.drop("label", axis=1)
        y_true = test_data["label"]
        y_pred = model.predict(X)

        accuracy = accuracy_score(y_true, y_pred)
        assert accuracy >= 0.95, f"Accuracy {accuracy} below threshold 0.95"

    def test_no_class_bias(self, model, test_data):
        """Test that model does not have severe class bias"""
        X = test_data.drop("label", axis=1)
        y_true = test_data["label"]
        y_pred = model.predict(X)

        precision = precision_score(y_true, y_pred)
        recall = recall_score(y_true, y_pred)

        # Precision and recall should be reasonably balanced
        assert abs(precision - recall) < 0.2, "Model shows significant class bias"

    def test_prediction_consistency(self, model, test_data):
        """Test that model produces consistent predictions"""
        X = test_data.drop("label", axis=1).head(100)

        predictions_1 = model.predict(X)
        predictions_2 = model.predict(X)

        assert np.array_equal(predictions_1, predictions_2), "Predictions are not deterministic"


class TestModelInference:
    """Model inference tests"""

    @pytest.fixture
    def model(self):
        import mlflow
        return mlflow.pyfunc.load_model("models:/fraud-detection-model/Staging")

    def test_prediction_latency(self, model):
        """Test that inference latency is acceptable"""
        import time

        X = np.random.randn(1, 10)

        start = time.time()
        for _ in range(100):
            model.predict(X)
        avg_latency = (time.time() - start) / 100

        assert avg_latency < 0.01, f"Average latency {avg_latency}s exceeds 10ms threshold"

    def test_batch_prediction(self, model):
        """Test that batch prediction works correctly"""
        X = np.random.randn(1000, 10)
        predictions = model.predict(X)

        assert len(predictions) == 1000
        assert all(0 <= p <= 1 for p in predictions)

    def test_invalid_input_handling(self, model):
        """Test that model handles invalid inputs gracefully"""
        with pytest.raises(Exception):
            model.predict(None)

        with pytest.raises(Exception):
            model.predict(np.array([]))
```

---

## Monitoring and Drift Detection

### Model Monitoring Architecture

Monitoring ML systems requires tracking multiple dimensions:

1. **Infrastructure metrics**: CPU, memory, GPU utilization
2. **Prediction metrics**: Latency, throughput, error rates
3. **Data quality**: Input validation, missing values, schema drift
4. **Model performance**: Prediction distribution, feature importance
5. **Business metrics**: Conversion rates, fraud detection rates

### Drift Detection with Evidently

```python
# drift_detection.py
import pandas as pd
from evidently import ColumnMapping
from evidently.report import Report
from evidently.metric_preset import DataDriftPreset, TargetDriftPreset
from evidently.metrics import (
    DatasetDriftMetric,
    DataDriftTable,
    ColumnDriftMetric,
    DatasetMissingValuesMetric
)

class DriftMonitor:
    """Monitor data and prediction drift"""

    def __init__(self, reference_data: pd.DataFrame, column_mapping: ColumnMapping):
        self.reference_data = reference_data
        self.column_mapping = column_mapping

    def generate_drift_report(
        self,
        current_data: pd.DataFrame,
        output_path: str = "drift_report.html"
    ):
        """Generate comprehensive drift report"""
        report = Report(metrics=[
            DatasetDriftMetric(),
            DataDriftTable(),
            DatasetMissingValuesMetric()
        ])

        report.run(
            reference_data=self.reference_data,
            current_data=current_data,
            column_mapping=self.column_mapping
        )

        report.save_html(output_path)
        return report.as_dict()

    def check_feature_drift(
        self,
        current_data: pd.DataFrame,
        feature_name: str,
        threshold: float = 0.1
    ) -> bool:
        """Check if specific feature has drifted"""
        report = Report(metrics=[
            ColumnDriftMetric(column_name=feature_name)
        ])

        report.run(
            reference_data=self.reference_data,
            current_data=current_data,
            column_mapping=self.column_mapping
        )

        result = report.as_dict()
        drift_score = result["metrics"][0]["result"]["drift_score"]

        return drift_score > threshold

    def get_drifted_features(
        self,
        current_data: pd.DataFrame,
        threshold: float = 0.1
    ) -> list:
        """Get list of features that have drifted"""
        drifted_features = []

        for feature in self.column_mapping.numerical_features:
            if self.check_feature_drift(current_data, feature, threshold):
                drifted_features.append(feature)

        return drifted_features


# Usage
column_mapping = ColumnMapping(
    target="fraud_label",
    prediction="prediction",
    numerical_features=["amount", "hour", "day_of_week"],
    categorical_features=["merchant_category", "card_type"]
)

reference_data = pd.read_parquet("data/reference.parquet")
monitor = DriftMonitor(reference_data, column_mapping)

# Check daily
today_data = pd.read_parquet("data/today.parquet")
drift_report = monitor.generate_drift_report(
    current_data=today_data,
    output_path="reports/drift_2024_01_15.html"
)

drifted_features = monitor.get_drifted_features(today_data)
if drifted_features:
    print(f"Warning: Features {drifted_features} have drifted!")
    # Trigger alert or retraining
```

### Custom Monitoring with Prometheus

```python
# model_monitor.py
from prometheus_client import Counter, Histogram, Gauge, start_http_server
import numpy as np
from collections import deque
import time

class ModelMonitor:
    """Custom model monitoring with Prometheus metrics"""

    def __init__(self, model_name: str, window_size: int = 1000):
        self.model_name = model_name
        self.window_size = window_size

        # Prediction buffer for drift detection
        self.prediction_buffer = deque(maxlen=window_size)
        self.feature_buffers = {}

        # Prometheus metrics
        self.prediction_counter = Counter(
            "ml_predictions_total",
            "Total number of predictions",
            ["model", "status"]
        )

        self.prediction_latency = Histogram(
            "ml_prediction_latency_seconds",
            "Prediction latency",
            ["model"],
            buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0]
        )

        self.prediction_value = Histogram(
            "ml_prediction_value",
            "Distribution of prediction values",
            ["model"],
            buckets=[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
        )

        self.feature_mean = Gauge(
            "ml_feature_mean",
            "Rolling mean of input features",
            ["model", "feature"]
        )

        self.drift_score = Gauge(
            "ml_drift_score",
            "Current drift score",
            ["model", "drift_type"]
        )

    def record_prediction(
        self,
        features: np.ndarray,
        prediction: float,
        latency: float,
        success: bool = True
    ):
        """Record a prediction for monitoring"""
        status = "success" if success else "error"

        # Update counters
        self.prediction_counter.labels(
            model=self.model_name,
            status=status
        ).inc()

        # Update latency histogram
        self.prediction_latency.labels(
            model=self.model_name
        ).observe(latency)

        # Update prediction distribution
        self.prediction_value.labels(
            model=self.model_name
        ).observe(prediction)

        # Store prediction for drift detection
        self.prediction_buffer.append(prediction)

        # Update feature statistics
        for i, value in enumerate(features.flatten()):
            feature_name = f"feature_{i}"
            if feature_name not in self.feature_buffers:
                self.feature_buffers[feature_name] = deque(maxlen=self.window_size)

            self.feature_buffers[feature_name].append(value)

            # Update rolling mean
            self.feature_mean.labels(
                model=self.model_name,
                feature=feature_name
            ).set(np.mean(self.feature_buffers[feature_name]))

    def calculate_prediction_drift(self, reference_mean: float, reference_std: float) -> float:
        """Calculate prediction drift using z-score"""
        if len(self.prediction_buffer) < 100:
            return 0.0

        current_mean = np.mean(self.prediction_buffer)
        z_score = abs(current_mean - reference_mean) / reference_std

        self.drift_score.labels(
            model=self.model_name,
            drift_type="prediction"
        ).set(z_score)

        return z_score


# Start Prometheus metrics server
start_http_server(8000)

# Initialize monitor
monitor = ModelMonitor(model_name="fraud-detector")

# Use in prediction loop
def predict_with_monitoring(model, features):
    start_time = time.time()
    try:
        prediction = model.predict(features)[0]
        latency = time.time() - start_time
        monitor.record_prediction(features, prediction, latency, success=True)
        return prediction
    except Exception as e:
        latency = time.time() - start_time
        monitor.record_prediction(features, 0, latency, success=False)
        raise e
```

### Alerting Rules (Prometheus)

```yaml
# prometheus_rules.yaml
groups:
  - name: ml_model_alerts
    rules:
      - alert: HighPredictionLatency
        expr: histogram_quantile(0.99, ml_prediction_latency_seconds_bucket) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High prediction latency detected"
          description: "P99 latency is {{ $value }}s for model {{ $labels.model }}"

      - alert: ModelDriftDetected
        expr: ml_drift_score{drift_type="prediction"} > 3
        for: 15m
        labels:
          severity: critical
        annotations:
          summary: "Model drift detected"
          description: "Drift score {{ $value }} exceeds threshold for {{ $labels.model }}"

      - alert: PredictionErrorRate
        expr: |
          rate(ml_predictions_total{status="error"}[5m]) /
          rate(ml_predictions_total[5m]) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High prediction error rate"
          description: "Error rate is {{ $value | humanizePercentage }} for {{ $labels.model }}"

      - alert: PredictionVolumeAnomaly
        expr: |
          abs(rate(ml_predictions_total[5m]) -
          avg_over_time(rate(ml_predictions_total[5m])[1h])) >
          2 * stddev_over_time(rate(ml_predictions_total[5m])[1h])
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Unusual prediction volume"
          description: "Prediction rate anomaly detected for {{ $labels.model }}"
```

---

## Platform Comparison

### Major MLOps Platforms

| Platform | Strengths | Weaknesses | Best For |
|----------|-----------|------------|----------|
| **MLflow** | Open-source, flexible, wide adoption | Basic UI, manual scaling | Teams wanting control |
| **Kubeflow** | Kubernetes-native, scalable | Complex setup, steep learning curve | K8s-heavy organizations |
| **SageMaker** | Fully managed, AWS integration | Vendor lock-in, cost | AWS-first teams |
| **Vertex AI** | GCP integration, AutoML | Limited customization | GCP users |
| **Databricks** | Unified analytics, Spark integration | Expensive | Data-intensive workloads |
| **Azure ML** | Enterprise features, Azure integration | Complex pricing | Microsoft shops |
| **Weights & Biases** | Best experiment tracking UI | Limited deployment features | Research teams |

### Feature Comparison Matrix

```
Feature              | MLflow | Kubeflow | SageMaker | Vertex AI | Databricks
---------------------|--------|----------|-----------|-----------|------------
Experiment Tracking  | +++    | ++       | +++       | +++       | +++
Model Registry       | +++    | ++       | +++       | +++       | +++
Feature Store        | -      | +        | +++       | +++       | +++
AutoML               | -      | +        | +++       | +++       | ++
Pipelines            | ++     | +++      | +++       | +++       | +++
Serving              | ++     | +++      | +++       | +++       | ++
Monitoring           | +      | ++       | +++       | ++        | ++
Cost                 | Free   | Free     | $$$       | $$$       | $$$$
Vendor Lock-in       | None   | Low      | High      | High      | Medium

Legend: +++ Excellent, ++ Good, + Basic, - Not Available
```

### Choosing the Right Platform

```python
# Decision framework
def recommend_platform(requirements: dict) -> str:
    """Recommend MLOps platform based on requirements"""

    if requirements.get("budget") == "minimal":
        if requirements.get("kubernetes_experience"):
            return "Kubeflow"
        return "MLflow"

    if requirements.get("cloud_provider") == "AWS":
        if requirements.get("fully_managed"):
            return "SageMaker"
        return "MLflow on AWS"

    if requirements.get("cloud_provider") == "GCP":
        return "Vertex AI"

    if requirements.get("cloud_provider") == "Azure":
        return "Azure ML"

    if requirements.get("heavy_spark_usage"):
        return "Databricks"

    if requirements.get("research_focused"):
        return "Weights & Biases + MLflow"

    # Default recommendation
    return "MLflow"  # Most flexible, widely adopted
```

---

## Interview Key Points

### Common MLOps Interview Questions

**Q1: What is the difference between ML and MLOps?**

ML focuses on building models that learn from data, while MLOps focuses on deploying, monitoring, and maintaining these models in production. MLOps bridges the gap between experimental ML and production systems, ensuring models are reliable, reproducible, and scalable.

**Q2: How do you handle model versioning and reproducibility?**

Key practices include:
- Version control for code (Git), data (DVC), and models (MLflow)
- Containerization to capture environment dependencies
- Logging all hyperparameters and random seeds
- Using infrastructure-as-code for reproducible environments
- Maintaining lineage between data, features, and models

**Q3: Explain the concept of feature stores and their benefits.**

Feature stores centralize feature computation and serving, providing:
- Consistency between training and inference
- Feature reusability across models
- Point-in-time correctness preventing data leakage
- Low-latency feature serving for real-time inference
- Feature documentation and discovery

**Q4: How do you detect and handle model drift?**

```python
# Model drift detection approaches
drift_detection = {
    "data_drift": {
        "methods": ["PSI", "KS test", "Chi-square test"],
        "tools": ["Evidently", "Whylabs", "Great Expectations"],
        "action": "Monitor features, alert on significant changes"
    },
    "concept_drift": {
        "methods": ["Performance monitoring", "Label drift"],
        "tools": ["Custom metrics", "Prometheus"],
        "action": "Retrain model when performance degrades"
    },
    "prediction_drift": {
        "methods": ["Distribution comparison", "Statistical tests"],
        "tools": ["Evidently", "Custom monitoring"],
        "action": "Investigate root cause, consider retraining"
    }
}
```

**Q5: Design a CI/CD pipeline for ML systems.**

Essential components:
1. **Data validation**: Check schema, quality, and drift
2. **Model training**: Automated training with reproducibility
3. **Model assessment**: Performance tests, fairness checks
4. **Model registration**: Version and stage management
5. **Deployment**: Canary/blue-green deployment strategies
6. **Monitoring**: Performance tracking, alerting

**Q6: How do you ensure model quality in production?**

```python
# Model quality assurance checklist
quality_assurance = {
    "pre_deployment": [
        "Unit tests for preprocessing and inference code",
        "Integration tests with feature store",
        "Performance benchmarks (latency, throughput)",
        "A/B test against current production model",
        "Fairness and bias checks"
    ],
    "during_deployment": [
        "Canary deployment with gradual traffic shift",
        "Automated rollback on metric degradation",
        "Shadow mode testing"
    ],
    "post_deployment": [
        "Continuous performance monitoring",
        "Data and prediction drift detection",
        "Regular model retraining schedule",
        "Incident response procedures"
    ]
}
```

**Q7: What metrics would you track for a production ML system?**

| Category | Metrics |
|----------|---------|
| Infrastructure | CPU/GPU utilization, memory usage, network I/O |
| Latency | P50, P95, P99 prediction latency |
| Throughput | Predictions per second, batch processing time |
| Model Quality | Accuracy, precision, recall, F1 (if labels available) |
| Data Quality | Missing values, schema violations, drift scores |
| Business | Revenue impact, user engagement, fraud detection rate |

**Q8: How do you handle model rollback?**

```python
# Model rollback strategy
class ModelRollbackManager:
    def __init__(self, model_registry):
        self.registry = model_registry

    def rollback(self, model_name: str, reason: str):
        # Get current production model
        current = self.registry.get_model(model_name, stage="Production")

        # Get previous production model
        previous = self.registry.get_previous_production(model_name)

        # Demote current
        self.registry.transition_stage(
            model_name,
            current.version,
            "Archived"
        )

        # Promote previous
        self.registry.transition_stage(
            model_name,
            previous.version,
            "Production"
        )

        # Log rollback
        self.log_rollback(current, previous, reason)

        # Alert team
        self.send_alert(f"Rolled back {model_name} to v{previous.version}: {reason}")
```

---

## Further Reading

### Official Documentation

- [MLflow Documentation](https://mlflow.org/docs/latest/index.html)
- [Kubeflow Documentation](https://www.kubeflow.org/docs/)
- [Feast Documentation](https://docs.feast.dev/)
- [Evidently AI Documentation](https://docs.evidentlyai.com/)
- [TensorFlow Serving Guide](https://www.tensorflow.org/tfx/guide/serving)
- [NVIDIA Triton Inference Server](https://developer.nvidia.com/nvidia-triton-inference-server)

### Recommended Books

- **"Designing Machine Learning Systems"** - Chip Huyen
- **"Machine Learning Engineering"** - Andriy Burkov
- **"Building Machine Learning Pipelines"** - Hannes Hapke & Catherine Nelson
- **"Practical MLOps"** - Noah Gift & Alfredo Deza
- **"Machine Learning Design Patterns"** - Valliappa Lakshmanan et al.

### Online Resources

- [Google ML Engineering Best Practices](https://developers.google.com/machine-learning/guides/rules-of-ml)
- [Made With ML](https://madewithml.com/) - MLOps course
- [Full Stack Deep Learning](https://fullstackdeeplearning.com/) - Production ML course
- [Neptune.ai Blog](https://neptune.ai/blog) - MLOps tutorials
- [Awesome MLOps](https://github.com/visenger/awesome-mlops) - Curated resources

### Advanced Topics

- **Feature Engineering at Scale**: Spark-based feature pipelines, real-time feature computation
- **Model Optimization**: Quantization, pruning, knowledge distillation
- **Distributed Training**: Data parallelism, model parallelism, pipeline parallelism
- **Edge Deployment**: TensorFlow Lite, ONNX Runtime, TensorRT
- **ML Security**: Adversarial attacks, model stealing, privacy-preserving ML
- **Responsible AI**: Fairness metrics, explainability, model governance

### Tools Ecosystem

```
Category              Tools
------------------    ------------------------------------------------
Experiment Tracking   MLflow, W&B, Neptune, Comet, Sacred
Model Registry        MLflow, SageMaker, Vertex AI, BentoML
Feature Store         Feast, Tecton, Hopsworks, Databricks
Data Versioning       DVC, LakeFS, Delta Lake, Pachyderm
Model Serving         TF Serving, Triton, Seldon Core, BentoML, Ray Serve
Monitoring            Evidently, Whylabs, Arize, Fiddler, Arthur
Orchestration         Airflow, Prefect, Dagster, Kubeflow Pipelines
AutoML                AutoGluon, H2O, TPOT, Auto-sklearn
```

---

## Summary

MLOps is essential for bridging the gap between ML experimentation and production deployment. Key takeaways:

1. **Start with the basics**: Implement experiment tracking and model versioning before complex pipelines
2. **Automate early**: CI/CD for ML reduces manual errors and accelerates iteration
3. **Monitor everything**: Data drift, model performance, and infrastructure metrics
4. **Choose tools wisely**: Balance flexibility vs. managed solutions based on team capabilities
5. **Think about scale**: Design systems that can grow with your ML needs
6. **Prioritize reproducibility**: Version data, code, and environments together
7. **Plan for failure**: Implement rollback mechanisms and alerting from day one

MLOps is not just about tools - it is about establishing practices that enable reliable, scalable, and maintainable machine learning systems. As the field continues to mature, staying current with best practices and emerging tools will be crucial for ML practitioners.
