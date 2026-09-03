---
title: "Experiment Management: MLflow and Weights & Biases"
description: "Master ML experiment tracking tools: MLflow and W&B usage and comparison"
track: datascience
section: evaluation
difficulty: intermediate
tags:
  - MLflow
  - W&B
  - experiment tracking
  - MLOps
status: imported
origin: old/src/content/docs/datascience/mlflow-wandb.en.md
divergence: 0.219
issues: []
legacy:
  category: DataScience
  subcategory: Experiment
  order: 41
  lastUpdated: 2026-01-07
---

As machine learning projects grow in complexity, tracking experiments becomes essential for reproducibility, collaboration, and model improvement. We'll take a deep dive into two leading experiment tracking tools: MLflow and Weights & Biases (W&B), covering their core features, practical usage, and guidance on choosing the right tool for your needs.

---

## Why Experiment Tracking Matters

Machine learning development is inherently iterative. Data scientists and ML engineers constantly experiment with different architectures, hyperparameters, feature sets, and preprocessing techniques. Without proper tracking, this leads to several challenges:

### Common Problems Without Tracking

1. **Irreproducibility**: Unable to recreate successful experiments
2. **Lost Knowledge**: Forgetting which configurations worked best
3. **Collaboration Barriers**: Difficulty sharing findings with team members
4. **Inefficient Debugging**: Hard to trace back what caused model degradation
5. **Compliance Issues**: Audit trails required in regulated industries

### Benefits of Experiment Tracking

| Benefit | Description |
|---------|-------------|
| **Reproducibility** | Every experiment can be recreated exactly |
| **Comparison** | Easy comparison of metrics across experiments |
| **Collaboration** | Team members can access and build on each other's work |
| **Debugging** | Trace issues back to specific changes |
| **Model Governance** | Track model lineage and deployment history |

```python
# Without experiment tracking - chaos!
# train_v1.py, train_v2_final.py, train_v2_final_REAL.py...

# With experiment tracking - organized and reproducible
import mlflow

with mlflow.start_run():
    mlflow.log_param("learning_rate", 0.001)
    mlflow.log_param("epochs", 100)
    mlflow.log_metric("accuracy", 0.95)
    mlflow.log_artifact("model.pkl")
```

---

## MLflow Overview

MLflow is an open-source platform developed by Databricks for managing the complete machine learning lifecycle. It provides four main components that work together to streamline ML workflows.

### MLflow Components

```
+------------------+     +------------------+     +------------------+
|   MLflow         |     |   MLflow         |     |   MLflow         |
|   Tracking       |---->|   Projects       |---->|   Models         |
+------------------+     +------------------+     +------------------+
         |                                               |
         v                                               v
+------------------+                             +------------------+
|   MLflow         |<----------------------------|   Model          |
|   UI/Server      |                             |   Registry       |
+------------------+                             +------------------+
```

### Installation and Setup

```bash
# Install MLflow
pip install mlflow

# Start the MLflow tracking server
mlflow server --host 0.0.0.0 --port 5000

# Or use MLflow with a database backend for production
mlflow server \
    --backend-store-uri postgresql://user:password@localhost/mlflow \
    --default-artifact-root s3://my-mlflow-bucket/artifacts \
    --host 0.0.0.0 \
    --port 5000
```

### Basic Configuration

```python
import mlflow

# Set tracking URI (optional - defaults to local ./mlruns directory)
mlflow.set_tracking_uri("http://localhost:5000")

# Set experiment name
mlflow.set_experiment("my-classification-experiment")

# Check current tracking URI and experiment
print(f"Tracking URI: {mlflow.get_tracking_uri()}")
print(f"Experiment: {mlflow.get_experiment_by_name('my-classification-experiment')}")
```

---

## MLflow Tracking

MLflow Tracking is the core component for logging and querying experiments. It allows you to record parameters, metrics, artifacts, and metadata for each run.

### Logging Parameters and Metrics

```python
import mlflow
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris
from sklearn.metrics import accuracy_score, f1_score

# Load data
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
with mlflow.start_run(run_name="random_forest_experiment"):
    # Log parameters
    mlflow.log_params(params)

    # Train model
    model = RandomForestClassifier(**params)
    model.fit(X_train, y_train)

    # Make predictions
    y_pred = model.predict(X_test)

    # Calculate and log metrics
    accuracy = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average='weighted')

    mlflow.log_metric("accuracy", accuracy)
    mlflow.log_metric("f1_score", f1)

    # Log metrics over iterations
    for epoch in range(10):
        mlflow.log_metric("training_loss", np.random.random(), step=epoch)
        mlflow.log_metric("validation_loss", np.random.random(), step=epoch)

    print(f"Run ID: {mlflow.active_run().info.run_id}")
    print(f"Accuracy: {accuracy:.4f}")
```

### Logging Artifacts

Artifacts are output files such as models, plots, or data files that you want to associate with a run.

```python
import mlflow
import matplotlib.pyplot as plt
import pandas as pd
import json

with mlflow.start_run():
    # Log a trained model
    mlflow.sklearn.log_model(model, "model")

    # Log a confusion matrix plot
    from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay

    cm = confusion_matrix(y_test, y_pred)
    disp = ConfusionMatrixDisplay(confusion_matrix=cm)
    disp.plot()
    plt.savefig("confusion_matrix.png")
    mlflow.log_artifact("confusion_matrix.png")

    # Log feature importance as JSON
    feature_importance = dict(zip(
        iris.feature_names,
        model.feature_importances_.tolist()
    ))
    with open("feature_importance.json", "w") as f:
        json.dump(feature_importance, f, indent=2)
    mlflow.log_artifact("feature_importance.json")

    # Log a directory of artifacts
    # mlflow.log_artifacts("output_directory", artifact_path="outputs")

    # Log a DataFrame as CSV
    results_df = pd.DataFrame({
        "actual": y_test,
        "predicted": y_pred
    })
    results_df.to_csv("predictions.csv", index=False)
    mlflow.log_artifact("predictions.csv")
```

### Auto-Logging

MLflow provides automatic logging for popular ML frameworks, reducing boilerplate code significantly.

```python
import mlflow
import mlflow.sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import GridSearchCV

# Enable auto-logging for scikit-learn
mlflow.sklearn.autolog()

# All parameters, metrics, and model will be logged automatically
model = RandomForestClassifier(n_estimators=100, max_depth=5)
model.fit(X_train, y_train)

# Auto-logging also works with GridSearchCV
param_grid = {
    "n_estimators": [50, 100, 200],
    "max_depth": [3, 5, 10]
}

grid_search = GridSearchCV(
    RandomForestClassifier(random_state=42),
    param_grid,
    cv=5,
    scoring="accuracy"
)
grid_search.fit(X_train, y_train)
```

```python
# Auto-logging for PyTorch Lightning
import mlflow.pytorch

mlflow.pytorch.autolog()

# Auto-logging for TensorFlow/Keras
import mlflow.tensorflow

mlflow.tensorflow.autolog()

# Auto-logging for XGBoost
import mlflow.xgboost

mlflow.xgboost.autolog()
```

### Querying Runs

```python
import mlflow
from mlflow.tracking import MlflowClient

client = MlflowClient()

# Get experiment by name
experiment = client.get_experiment_by_name("my-classification-experiment")

# Search runs with filters
runs = client.search_runs(
    experiment_ids=[experiment.experiment_id],
    filter_string="metrics.accuracy > 0.9 AND params.n_estimators = '100'",
    order_by=["metrics.accuracy DESC"],
    max_results=10
)

for run in runs:
    print(f"Run ID: {run.info.run_id}")
    print(f"  Accuracy: {run.data.metrics.get('accuracy')}")
    print(f"  Parameters: {run.data.params}")

# Get a specific run
run = client.get_run("run_id_here")
print(f"Run status: {run.info.status}")
print(f"Run metrics: {run.data.metrics}")

# Download artifacts
local_path = client.download_artifacts("run_id_here", "model", "/tmp/")
```

---

## MLflow Projects

MLflow Projects provide a standard format for packaging and reproducing ML code. A project is simply a directory or Git repository with a specific structure.

### Project Structure

```
my_ml_project/
├── MLproject              # Project configuration file
├── conda.yaml             # Conda environment specification
├── requirements.txt       # Alternative: pip requirements
├── train.py               # Training script
├── assess.py              # Assessment script
└── data/
    └── dataset.csv
```

### MLproject File

```yaml
# MLproject
name: My ML Project

conda_env: conda.yaml
# Or use docker_env for containerized execution:
# docker_env:
#   image: my-ml-image:latest

entry_points:
  main:
    parameters:
      learning_rate: {type: float, default: 0.001}
      epochs: {type: int, default: 100}
      batch_size: {type: int, default: 32}
      data_path: {type: string, default: "data/dataset.csv"}
    command: "python train.py --lr {learning_rate} --epochs {epochs} --batch-size {batch_size} --data {data_path}"

  assess:
    parameters:
      model_path: {type: string}
      test_data: {type: string}
    command: "python assess.py --model {model_path} --test-data {test_data}"
```

### Conda Environment File

```yaml
# conda.yaml
name: my_ml_project
channels:
  - defaults
  - conda-forge
dependencies:
  - python=3.9
  - numpy>=1.21.0
  - pandas>=1.3.0
  - scikit-learn>=1.0.0
  - pip:
    - mlflow>=2.0.0
    - torch>=1.12.0
```

### Training Script Example

```python
# train.py
import argparse
import mlflow
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--lr", type=float, default=0.001)
    parser.add_argument("--epochs", type=int, default=100)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--data", type=str, required=True)
    args = parser.parse_args()

    with mlflow.start_run():
        # Log parameters
        mlflow.log_param("learning_rate", args.lr)
        mlflow.log_param("epochs", args.epochs)
        mlflow.log_param("batch_size", args.batch_size)

        # Load and preprocess data
        df = pd.read_csv(args.data)
        X = df.drop("target", axis=1)
        y = df["target"]
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

        # Train model
        model = RandomForestClassifier(n_estimators=args.epochs)
        model.fit(X_train, y_train)

        # Assess and log metrics
        accuracy = accuracy_score(y_test, model.predict(X_test))
        mlflow.log_metric("accuracy", accuracy)

        # Log model
        mlflow.sklearn.log_model(model, "model")

        print(f"Training completed. Accuracy: {accuracy:.4f}")

if __name__ == "__main__":
    main()
```

### Running Projects

```bash
# Run locally from project directory
mlflow run . -P learning_rate=0.01 -P epochs=50

# Run from Git repository
mlflow run https://github.com/user/ml-project.git -P learning_rate=0.01

# Run a specific entry point
mlflow run . -e assess -P model_path=/path/to/model -P test_data=data/test.csv

# Run with a specific experiment
mlflow run . --experiment-name "production-experiment"

# Run in a Docker container
mlflow run . --env-manager=docker
```

```python
# Run projects programmatically
import mlflow

# Run a local project
mlflow.projects.run(
    uri=".",
    entry_point="main",
    parameters={"learning_rate": 0.01, "epochs": 50},
    experiment_name="my-experiment"
)

# Run from GitHub
mlflow.projects.run(
    uri="https://github.com/user/ml-project.git",
    parameters={"learning_rate": 0.01}
)
```

---

## MLflow Models

MLflow Models provides a standard format for packaging models that can be deployed to various platforms.

### Model Flavors

MLflow supports multiple "flavors" for different ML frameworks:

| Flavor | Framework | Import |
|--------|-----------|--------|
| `sklearn` | scikit-learn | `mlflow.sklearn` |
| `pytorch` | PyTorch | `mlflow.pytorch` |
| `tensorflow` | TensorFlow | `mlflow.tensorflow` |
| `keras` | Keras | `mlflow.keras` |
| `xgboost` | XGBoost | `mlflow.xgboost` |
| `lightgbm` | LightGBM | `mlflow.lightgbm` |
| `spark` | Apache Spark MLlib | `mlflow.spark` |
| `onnx` | ONNX | `mlflow.onnx` |
| `pyfunc` | Generic Python | `mlflow.pyfunc` |

### Saving and Loading Models

```python
import mlflow
import mlflow.sklearn
from sklearn.ensemble import RandomForestClassifier

# Train a model
model = RandomForestClassifier(n_estimators=100)
model.fit(X_train, y_train)

# Save model to MLflow
with mlflow.start_run():
    # Log model with automatic signature inference
    mlflow.sklearn.log_model(
        model,
        artifact_path="model",
        registered_model_name="iris-classifier",  # Optional: register in Model Registry
        input_example=X_train[:5],  # Optional: save example inputs
    )

    run_id = mlflow.active_run().info.run_id

# Load model from run
loaded_model = mlflow.sklearn.load_model(f"runs:/{run_id}/model")

# Load model from Model Registry
loaded_model = mlflow.sklearn.load_model("models:/iris-classifier/Production")

# Load as generic Python function
pyfunc_model = mlflow.pyfunc.load_model(f"runs:/{run_id}/model")
predictions = pyfunc_model.predict(X_test)
```

### Custom Models with PyFunc

For custom models or complex inference logic, use the `pyfunc` flavor:

```python
import mlflow
import mlflow.pyfunc
import pandas as pd

class CustomModel(mlflow.pyfunc.PythonModel):
    """Custom model wrapper for complex inference logic"""

    def __init__(self, preprocessor, model):
        self.preprocessor = preprocessor
        self.model = model

    def load_context(self, context):
        """Load artifacts when the model is loaded"""
        # Load any additional artifacts if needed
        pass

    def predict(self, context, model_input):
        """Custom prediction logic"""
        # Preprocess input
        if isinstance(model_input, pd.DataFrame):
            processed = self.preprocessor.transform(model_input)
        else:
            processed = model_input

        # Make predictions
        predictions = self.model.predict(processed)
        probabilities = self.model.predict_proba(processed)

        # Return enhanced output
        return pd.DataFrame({
            "prediction": predictions,
            "confidence": probabilities.max(axis=1)
        })

# Save custom model
with mlflow.start_run():
    custom_model = CustomModel(preprocessor, model)

    mlflow.pyfunc.log_model(
        artifact_path="custom_model",
        python_model=custom_model,
        conda_env={
            "dependencies": [
                "python=3.9",
                "scikit-learn>=1.0.0",
                "pandas>=1.3.0"
            ]
        }
    )
```

### Model Serving

```bash
# Serve model locally as REST API
mlflow models serve -m "runs:/<run_id>/model" -p 5001

# Serve model from Model Registry
mlflow models serve -m "models:/iris-classifier/Production" -p 5001

# Build Docker image for deployment
mlflow models build-docker -m "runs:/<run_id>/model" -n "my-model-image"

# Run the Docker container
docker run -p 5001:8080 my-model-image
```

```python
# Make predictions via REST API
import requests

data = {
    "inputs": X_test[:5].tolist()
}

response = requests.post(
    "http://localhost:5001/invocations",
    json=data,
    headers={"Content-Type": "application/json"}
)

predictions = response.json()
print(predictions)
```

---

## MLflow Model Registry

The Model Registry provides centralized model management with versioning, stage transitions, and annotations.

### Registering Models

```python
import mlflow
from mlflow.tracking import MlflowClient

client = MlflowClient()

# Register a model during logging
with mlflow.start_run():
    mlflow.sklearn.log_model(
        model,
        "model",
        registered_model_name="iris-classifier"
    )

# Or register an existing run's model
result = mlflow.register_model(
    model_uri=f"runs:/{run_id}/model",
    name="iris-classifier"
)

print(f"Model version: {result.version}")
```

### Managing Model Versions

```python
from mlflow.tracking import MlflowClient

client = MlflowClient()

# List all registered models
for model in client.search_registered_models():
    print(f"Model: {model.name}")
    for version in model.latest_versions:
        print(f"  Version: {version.version}, Stage: {version.current_stage}")

# Get specific model version
model_version = client.get_model_version("iris-classifier", "1")
print(f"Run ID: {model_version.run_id}")
print(f"Status: {model_version.status}")

# Transition model stage
client.transition_model_version_stage(
    name="iris-classifier",
    version="1",
    stage="Staging"  # Options: None, Staging, Production, Archived
)

# Add description and tags
client.update_model_version(
    name="iris-classifier",
    version="1",
    description="Random Forest classifier trained on Iris dataset"
)

client.set_model_version_tag(
    name="iris-classifier",
    version="1",
    key="validation_status",
    value="approved"
)
```

### Model Lifecycle Example

```python
import mlflow
from mlflow.tracking import MlflowClient

client = MlflowClient()

def promote_model_to_production(model_name: str, version: str):
    """Promote a model version to production after validation"""

    # Archive current production model
    for mv in client.search_model_versions(f"name='{model_name}'"):
        if mv.current_stage == "Production":
            client.transition_model_version_stage(
                name=model_name,
                version=mv.version,
                stage="Archived"
            )

    # Promote new version to production
    client.transition_model_version_stage(
        name=model_name,
        version=version,
        stage="Production"
    )

    print(f"Model {model_name} version {version} promoted to Production")

# Load production model for inference
def load_production_model(model_name: str):
    """Load the current production model"""
    return mlflow.pyfunc.load_model(f"models:/{model_name}/Production")

# Example usage
promote_model_to_production("iris-classifier", "2")
model = load_production_model("iris-classifier")
```

---

## Weights & Biases Overview

Weights & Biases (W&B) is a cloud-based MLOps platform that provides experiment tracking, dataset versioning, model management, and collaboration features. It is known for its intuitive UI and powerful visualization capabilities.

### Installation and Setup

```bash
# Install W&B
pip install wandb

# Login to W&B (creates account if needed)
wandb login
```

```python
import wandb

# Initialize a new run
wandb.init(
    project="my-ml-project",
    entity="my-team",  # Optional: your W&B username or team name
    name="experiment-001",
    config={
        "learning_rate": 0.001,
        "epochs": 100,
        "batch_size": 32,
        "architecture": "ResNet50"
    },
    tags=["baseline", "resnet"],
    notes="Initial baseline experiment with ResNet50"
)
```

### W&B Architecture

```
+------------------+     +------------------+     +------------------+
|   W&B Runs       |---->|   W&B Dashboard  |---->|   Reports &      |
|   (Experiments)  |     |   (Visualization)|     |   Collaboration  |
+------------------+     +------------------+     +------------------+
         |                       |
         v                       v
+------------------+     +------------------+
|   W&B Artifacts  |     |   W&B Sweeps     |
|   (Data/Models)  |     |   (HPO)          |
+------------------+     +------------------+
```

---

## W&B Core Features

### Logging Metrics and Parameters

```python
import wandb
import numpy as np

# Initialize run with configuration
config = {
    "learning_rate": 0.001,
    "epochs": 100,
    "batch_size": 32,
    "optimizer": "adam",
    "architecture": "CNN"
}

wandb.init(project="image-classification", config=config)

# Access config (useful when using sweeps)
config = wandb.config

# Log metrics during training
for epoch in range(config.epochs):
    train_loss = np.random.random()  # Replace with actual training
    val_loss = np.random.random()
    accuracy = np.random.random()

    # Log multiple metrics at once
    wandb.log({
        "epoch": epoch,
        "train/loss": train_loss,
        "val/loss": val_loss,
        "val/accuracy": accuracy
    })

# Log summary metrics
wandb.run.summary["best_accuracy"] = 0.95
wandb.run.summary["best_epoch"] = 50

# Finish the run
wandb.finish()
```

### Logging Images and Media

W&B excels at visualizing rich media types:

```python
import wandb
import numpy as np
from PIL import Image
import matplotlib.pyplot as plt

wandb.init(project="visualization-demo")

# Log images
images = [np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8) for _ in range(4)]
wandb.log({
    "examples": [wandb.Image(img, caption=f"Image {i}") for i, img in enumerate(images)]
})

# Log matplotlib figures
fig, ax = plt.subplots()
ax.plot([1, 2, 3, 4], [1, 4, 2, 3])
ax.set_title("Training Progress")
wandb.log({"chart": wandb.Image(fig)})
plt.close()

# Log confusion matrix
wandb.log({
    "confusion_matrix": wandb.plot.confusion_matrix(
        y_true=y_test,
        preds=y_pred,
        class_names=["class_0", "class_1", "class_2"]
    )
})

# Log precision-recall curve
wandb.log({
    "pr_curve": wandb.plot.pr_curve(
        y_true=y_test,
        y_probas=y_proba,
        labels=["class_0", "class_1", "class_2"]
    )
})

# Log audio
sample_rate = 44100
audio_data = np.random.randn(sample_rate * 2)  # 2 seconds of audio
wandb.log({"audio_sample": wandb.Audio(audio_data, sample_rate=sample_rate)})

# Log video
video_frames = np.random.randint(0, 255, (100, 64, 64, 3), dtype=np.uint8)
wandb.log({"video": wandb.Video(video_frames, fps=30)})

# Log 3D point clouds
points = np.random.randn(1000, 3)
wandb.log({"point_cloud": wandb.Object3D(points)})

wandb.finish()
```

### Tables and Data Visualization

```python
import wandb
import pandas as pd

wandb.init(project="data-analysis")

# Create and log a table
df = pd.DataFrame({
    "id": range(100),
    "prediction": np.random.choice(["cat", "dog", "bird"], 100),
    "confidence": np.random.random(100),
    "correct": np.random.choice([True, False], 100)
})

# Log as W&B Table for interactive exploration
table = wandb.Table(dataframe=df)
wandb.log({"predictions": table})

# Log table with images
table_with_images = wandb.Table(columns=["image", "label", "prediction", "confidence"])
for i in range(10):
    img = np.random.randint(0, 255, (64, 64, 3), dtype=np.uint8)
    table_with_images.add_data(
        wandb.Image(img),
        "cat",
        "dog",
        0.87
    )
wandb.log({"image_predictions": table_with_images})

wandb.finish()
```

### Artifacts for Dataset and Model Versioning

```python
import wandb
import pandas as pd

# Create and log a dataset artifact
wandb.init(project="artifact-demo")

# Log dataset artifact
dataset_artifact = wandb.Artifact(
    name="iris-dataset",
    type="dataset",
    description="Iris flower dataset for classification",
    metadata={"num_samples": 150, "num_features": 4}
)

# Add files to artifact
dataset_artifact.add_file("data/iris.csv")
dataset_artifact.add_dir("data/processed/")

# Log artifact
wandb.log_artifact(dataset_artifact)

wandb.finish()

# Use artifact in another run
wandb.init(project="artifact-demo")

# Download and use artifact
artifact = wandb.use_artifact("iris-dataset:latest")
artifact_dir = artifact.download()

# Log model artifact with lineage
model_artifact = wandb.Artifact(
    name="iris-model",
    type="model",
    description="Random Forest model for Iris classification"
)
model_artifact.add_file("models/model.pkl")

# Track input artifact (creates lineage graph)
model_artifact.use_artifact(artifact)

wandb.log_artifact(model_artifact)
wandb.finish()
```

### Integration with Deep Learning Frameworks

```python
# PyTorch Integration
import wandb
import torch
import torch.nn as nn
import torch.optim as optim

wandb.init(project="pytorch-example")

model = nn.Sequential(
    nn.Linear(784, 256),
    nn.ReLU(),
    nn.Linear(256, 10)
)

# Watch model to log gradients and parameters
wandb.watch(model, log="all", log_freq=100)

optimizer = optim.Adam(model.parameters(), lr=wandb.config.learning_rate)
criterion = nn.CrossEntropyLoss()

for epoch in range(100):
    for batch_idx, (data, target) in enumerate(train_loader):
        optimizer.zero_grad()
        output = model(data.view(data.size(0), -1))
        loss = criterion(output, target)
        loss.backward()
        optimizer.step()

        if batch_idx % 100 == 0:
            wandb.log({"loss": loss.item()})

wandb.finish()
```

```python
# TensorFlow/Keras Integration
import wandb
from wandb.keras import WandbCallback
import tensorflow as tf

wandb.init(project="keras-example")

model = tf.keras.Sequential([
    tf.keras.layers.Dense(256, activation='relu', input_shape=(784,)),
    tf.keras.layers.Dense(10, activation='softmax')
])

model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

# Use WandbCallback for automatic logging
model.fit(
    X_train, y_train,
    epochs=10,
    validation_data=(X_val, y_val),
    callbacks=[WandbCallback(
        save_model=True,
        log_evaluation=True
    )]
)

wandb.finish()
```

---

## W&B Sweeps

W&B Sweeps provide automated hyperparameter optimization with support for grid search, random search, and Bayesian optimization.

### Sweep Configuration

```yaml
# sweep_config.yaml
program: train.py
method: bayes  # Options: grid, random, bayes
metric:
  name: val/accuracy
  goal: maximize

parameters:
  learning_rate:
    distribution: log_uniform_values
    min: 0.0001
    max: 0.1

  batch_size:
    values: [16, 32, 64, 128]

  epochs:
    value: 100  # Fixed value

  optimizer:
    values: ["adam", "sgd", "rmsprop"]

  hidden_layers:
    values: [1, 2, 3]

  hidden_size:
    distribution: int_uniform
    min: 64
    max: 512

early_terminate:
  type: hyperband
  min_iter: 10
  eta: 3
```

### Creating and Running Sweeps

```python
import wandb

# Define sweep configuration in Python
sweep_config = {
    "method": "bayes",
    "metric": {
        "name": "val/accuracy",
        "goal": "maximize"
    },
    "parameters": {
        "learning_rate": {
            "distribution": "log_uniform_values",
            "min": 0.0001,
            "max": 0.1
        },
        "batch_size": {
            "values": [16, 32, 64, 128]
        },
        "optimizer": {
            "values": ["adam", "sgd"]
        },
        "dropout": {
            "distribution": "uniform",
            "min": 0.1,
            "max": 0.5
        }
    },
    "early_terminate": {
        "type": "hyperband",
        "min_iter": 5
    }
}

# Create sweep
sweep_id = wandb.sweep(sweep_config, project="hyperparameter-tuning")

print(f"Sweep ID: {sweep_id}")
```

### Training Function for Sweeps

```python
import wandb
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris
from sklearn.metrics import accuracy_score

def train():
    """Training function for sweep agent"""
    # Initialize run (config comes from sweep)
    wandb.init()
    config = wandb.config

    # Load data
    iris = load_iris()
    X_train, X_test, y_train, y_test = train_test_split(
        iris.data, iris.target, test_size=0.2, random_state=42
    )

    # Create model with sweep parameters
    model = RandomForestClassifier(
        n_estimators=config.n_estimators,
        max_depth=config.max_depth,
        min_samples_split=config.min_samples_split,
        random_state=42
    )

    # Train
    model.fit(X_train, y_train)

    # Measure performance
    train_acc = accuracy_score(y_train, model.predict(X_train))
    val_acc = accuracy_score(y_test, model.predict(X_test))

    # Log metrics
    wandb.log({
        "train/accuracy": train_acc,
        "val/accuracy": val_acc
    })

# Run sweep agent
sweep_id = wandb.sweep(sweep_config, project="rf-sweep")
wandb.agent(sweep_id, function=train, count=50)  # Run 50 experiments
```

### Deep Learning Sweep Example

```python
import wandb
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader

def build_model(config):
    """Build model based on sweep configuration"""
    layers = []
    input_size = 784

    for i in range(config.hidden_layers):
        layers.append(nn.Linear(input_size, config.hidden_size))
        layers.append(nn.ReLU())
        layers.append(nn.Dropout(config.dropout))
        input_size = config.hidden_size

    layers.append(nn.Linear(input_size, 10))

    return nn.Sequential(*layers)

def train_epoch(model, train_loader, optimizer, criterion, device):
    model.train()
    total_loss = 0
    correct = 0
    total = 0

    for data, target in train_loader:
        data, target = data.to(device), target.to(device)

        optimizer.zero_grad()
        output = model(data.view(data.size(0), -1))
        loss = criterion(output, target)
        loss.backward()
        optimizer.step()

        total_loss += loss.item()
        pred = output.argmax(dim=1)
        correct += pred.eq(target).sum().item()
        total += target.size(0)

    return total_loss / len(train_loader), correct / total

def test_model(model, test_loader, criterion, device):
    model.train(False)
    total_loss = 0
    correct = 0
    total = 0

    with torch.no_grad():
        for data, target in test_loader:
            data, target = data.to(device), target.to(device)
            output = model(data.view(data.size(0), -1))
            total_loss += criterion(output, target).item()
            pred = output.argmax(dim=1)
            correct += pred.eq(target).sum().item()
            total += target.size(0)

    return total_loss / len(test_loader), correct / total

def sweep_train():
    """Training function for deep learning sweep"""
    wandb.init()
    config = wandb.config

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Build model
    model = build_model(config).to(device)
    wandb.watch(model, log="gradients", log_freq=100)

    # Setup optimizer
    if config.optimizer == "adam":
        optimizer = optim.Adam(model.parameters(), lr=config.learning_rate)
    elif config.optimizer == "sgd":
        optimizer = optim.SGD(model.parameters(), lr=config.learning_rate, momentum=0.9)

    criterion = nn.CrossEntropyLoss()

    # Training loop
    best_val_acc = 0
    for epoch in range(config.epochs):
        train_loss, train_acc = train_epoch(model, train_loader, optimizer, criterion, device)
        val_loss, val_acc = test_model(model, val_loader, criterion, device)

        wandb.log({
            "epoch": epoch,
            "train/loss": train_loss,
            "train/accuracy": train_acc,
            "val/loss": val_loss,
            "val/accuracy": val_acc
        })

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            # Save best model
            torch.save(model.state_dict(), "best_model.pth")

    # Log best accuracy
    wandb.run.summary["best_val_accuracy"] = best_val_acc

# Run the sweep
sweep_config = {
    "method": "bayes",
    "metric": {"name": "val/accuracy", "goal": "maximize"},
    "parameters": {
        "learning_rate": {"distribution": "log_uniform_values", "min": 1e-5, "max": 1e-2},
        "hidden_layers": {"values": [1, 2, 3, 4]},
        "hidden_size": {"values": [128, 256, 512]},
        "dropout": {"distribution": "uniform", "min": 0.1, "max": 0.5},
        "optimizer": {"values": ["adam", "sgd"]},
        "epochs": {"value": 20}
    }
}

sweep_id = wandb.sweep(sweep_config, project="mnist-sweep")
wandb.agent(sweep_id, function=sweep_train, count=30)
```

---

## Tool Comparison and Selection

### Feature Comparison

| Feature | MLflow | Weights & Biases |
|---------|--------|------------------|
| **Deployment** | Self-hosted or Databricks | Cloud-hosted (self-hosted available for Enterprise) |
| **Cost** | Free (open-source) | Free tier available; paid for teams |
| **Experiment Tracking** | Excellent | Excellent |
| **Visualization** | Good (basic UI) | Excellent (rich, interactive) |
| **Hyperparameter Tuning** | Limited (manual) | Built-in Sweeps |
| **Model Registry** | Built-in | Built-in |
| **Dataset Versioning** | Via artifacts | Via Artifacts |
| **Collaboration** | Basic | Excellent (reports, dashboards) |
| **Integration** | Broad framework support | Broad framework support |
| **Real-time Logging** | Yes | Yes (with live dashboard) |
| **Media Logging** | Basic | Extensive (images, video, audio, 3D) |
| **Offline Support** | Yes | Yes (sync when online) |

### When to Choose MLflow

MLflow is ideal when you need:

1. **Full Control**: Self-hosted solution with complete data ownership
2. **Cost Efficiency**: Free, open-source for unlimited usage
3. **Databricks Integration**: Seamless integration with Databricks ecosystem
4. **Model Serving**: Built-in model serving and deployment capabilities
5. **Regulatory Compliance**: Data stays within your infrastructure

```python
# MLflow is great for production ML pipelines
import mlflow
from mlflow.tracking import MlflowClient

# Set up your own tracking server
mlflow.set_tracking_uri("http://your-mlflow-server:5000")

# Register and deploy models easily
mlflow.sklearn.log_model(model, "model", registered_model_name="production-model")

# Query experiments programmatically
client = MlflowClient()
runs = client.search_runs(
    experiment_ids=["1"],
    filter_string="metrics.accuracy > 0.9",
    order_by=["metrics.accuracy DESC"]
)
```

### When to Choose Weights & Biases

W&B is ideal when you need:

1. **Rich Visualization**: Interactive charts, media logging, dashboards
2. **Team Collaboration**: Shared workspaces, reports, and comments
3. **Hyperparameter Optimization**: Built-in Sweeps with Bayesian optimization
4. **Quick Setup**: Zero infrastructure management
5. **Deep Learning Focus**: Excellent PyTorch/TensorFlow integration

```python
# W&B excels at visualization and collaboration
import wandb

wandb.init(project="team-project", entity="research-team")

# Rich media logging
wandb.log({
    "images": [wandb.Image(img) for img in sample_images],
    "confusion_matrix": wandb.plot.confusion_matrix(y_true, y_pred, labels),
    "attention_weights": wandb.Image(attention_heatmap)
})

# Automatic hyperparameter optimization
sweep_id = wandb.sweep(sweep_config, project="hyperopt")
wandb.agent(sweep_id, function=train, count=100)
```

### Hybrid Approach

Many teams use both tools together:

```python
import mlflow
import wandb

# Use W&B for experiment tracking and visualization
wandb.init(project="research", config=config)

# Use MLflow for model registry and deployment
with mlflow.start_run():
    # Train and log to both
    model = train_model(config)

    # Log metrics to W&B
    wandb.log({"accuracy": accuracy, "loss": loss})

    # Log model to MLflow for production deployment
    mlflow.sklearn.log_model(
        model, "model",
        registered_model_name="production-model"
    )

wandb.finish()
```

### Decision Framework

```
                        Start
                          |
                          v
            +---------------------------+
            | Need full data control?   |
            +---------------------------+
                    |           |
                   Yes          No
                    |           |
                    v           v
            +----------+   +-------------------------+
            | MLflow   |   | Rich visualization      |
            |          |   | needs?                  |
            +----------+   +-------------------------+
                                |           |
                               Yes          No
                                |           |
                                v           v
                        +----------+   +----------+
                        | W&B      |   | Either   |
                        |          |   | works    |
                        +----------+   +----------+
```

### Cost Comparison

| Scenario | MLflow | Weights & Biases |
|----------|--------|------------------|
| Solo developer | Free | Free tier (limited) |
| Small team (5) | Free (self-hosted infra costs) | $50/user/month |
| Enterprise | Free + support contracts | Custom pricing |
| Academic | Free | Free for academics |

### Migration Considerations

```python
# Convert MLflow runs to W&B
import mlflow
import wandb
from mlflow.tracking import MlflowClient

client = MlflowClient()

# Get all runs from MLflow
runs = client.search_runs(experiment_ids=["1"])

for run in runs:
    # Create corresponding W&B run
    wandb.init(
        project="migrated-from-mlflow",
        name=run.info.run_name,
        config=run.data.params
    )

    # Log metrics
    for key, value in run.data.metrics.items():
        wandb.log({key: value})

    wandb.finish()
```

---

## Best Practices

### General Best Practices

1. **Consistent Naming**: Use consistent experiment and run naming conventions
2. **Log Everything**: Log all hyperparameters, not just those you are tuning
3. **Version Control**: Tag runs with git commit hashes
4. **Documentation**: Add notes and descriptions to experiments
5. **Clean Up**: Archive or delete failed runs to keep workspaces organized

### MLflow Best Practices

```python
import mlflow
import git

# Always include git information
repo = git.Repo(search_parent_directories=True)
git_commit = repo.head.object.hexsha

with mlflow.start_run():
    mlflow.set_tag("git_commit", git_commit)
    mlflow.set_tag("developer", "your_name")
    mlflow.set_tag("environment", "development")

    # Log all relevant information
    mlflow.log_params(all_hyperparameters)
    mlflow.log_artifact("config.yaml")
```

### W&B Best Practices

```python
import wandb

# Use config objects for organized hyperparameters
config = wandb.config
config.model = {
    "architecture": "ResNet50",
    "pretrained": True,
    "num_classes": 10
}
config.training = {
    "epochs": 100,
    "batch_size": 32,
    "learning_rate": 0.001
}

# Use tags for easy filtering
wandb.init(
    project="production",
    tags=["baseline", "v1.0", "resnet"],
    notes="Baseline experiment with ResNet50 backbone"
)

# Log system metrics
wandb.log({"gpu_memory": torch.cuda.memory_allocated()})
```

---

## Summary

Both MLflow and Weights & Biases are powerful tools for experiment tracking and ML lifecycle management. The choice between them depends on your specific needs:

- **Choose MLflow** for self-hosted deployments, full data control, and tight integration with model serving and the Databricks ecosystem.

- **Choose Weights & Biases** for superior visualization, team collaboration, built-in hyperparameter optimization, and minimal infrastructure management.

- **Consider using both** for research and development with W&B, and production deployment with MLflow.

Regardless of which tool you choose, the most important thing is to start tracking your experiments systematically. The discipline of logging parameters, metrics, and artifacts will significantly improve your ML development workflow and make your work more reproducible and collaborative.
