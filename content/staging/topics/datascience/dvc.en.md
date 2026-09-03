---
title: "Experiment Management: DVC Data Version Control"
description: "Use DVC for data and model versioning: Git for ML projects"
track: datascience
section: evaluation
difficulty: intermediate
tags:
  - DVC
  - version control
  - data management
  - MLOps
status: imported
origin: old/src/content/docs/datascience/dvc.en.md
divergence: 0.194
issues: []
legacy:
  category: DataScience
  subcategory: Experiment
  order: 42
  lastUpdated: 2026-01-07
---

Data Version Control (DVC) is an open-source tool that brings Git-like version control to machine learning projects. While Git excels at tracking code changes, it struggles with large files like datasets and trained models. DVC bridges this gap by providing a seamless workflow for versioning data, models, and experiments alongside your code.

## Introduction to DVC

### The Problem DVC Solves

Machine learning projects face unique challenges that traditional version control cannot address:

- **Large files**: Datasets and models can be gigabytes or terabytes in size
- **Binary files**: Git cannot efficiently diff or merge binary data files
- **Reproducibility**: Tracking which data version was used for which experiment
- **Collaboration**: Sharing large files across team members
- **Storage costs**: Keeping multiple versions of large files in Git repositories

### How DVC Works

DVC works alongside Git, not as a replacement. It uses a clever approach:

1. **Metafiles**: DVC creates small `.dvc` files that act as pointers to actual data
2. **Content-addressable storage**: Files are identified by their content hash (MD5)
3. **Remote storage**: Large files are stored in configurable remote storage (S3, GCS, Azure, etc.)
4. **Git integration**: The `.dvc` metafiles are tracked by Git, linking code versions to data versions

```
+-------------------------------------------------------------+
|                    Your ML Project                          |
+-------------------------------------------------------------+
|  Code (*.py, *.ipynb)  ---------------------->  Git Repository  |
|                                                             |
|  Data & Models (*.csv, *.pkl)  -->  DVC Cache  -->  Remote  |
|         |                              Storage              |
|         v                                                   |
|  .dvc metafiles  ------------------------>  Git Repository  |
+-------------------------------------------------------------+
```

### DVC vs Other Tools

| Feature | Git LFS | DVC | MLflow | Weights & Biases |
|---------|---------|-----|--------|------------------|
| Data versioning | Yes | Yes | Limited | Limited |
| Pipeline support | No | Yes | Yes | Yes |
| Experiment tracking | No | Yes | Yes | Yes |
| Remote storage flexibility | Limited | Extensive | Limited | Proprietary |
| Git integration | Tight | Seamless | Separate | Separate |
| Open source | Yes | Yes | Yes | Partial |
| Complexity | Low | Medium | Medium | Medium |

## Getting Started with DVC

### Installation

DVC can be installed via pip, conda, or system package managers:

```bash
# Using pip (recommended)
pip install dvc

# Install with specific remote storage support
pip install "dvc[s3]"      # Amazon S3
pip install "dvc[gs]"      # Google Cloud Storage
pip install "dvc[azure]"   # Azure Blob Storage
pip install "dvc[ssh]"     # SSH/SFTP
pip install "dvc[all]"     # All remote storage options

# Using conda
conda install -c conda-forge dvc

# Verify installation
dvc version
```

### Initializing a DVC Project

```bash
# Initialize Git repository (if not already done)
git init

# Initialize DVC in the repository
dvc init

# This creates:
# .dvc/           - DVC internal directory
# .dvc/config     - DVC configuration file
# .dvc/.gitignore - Excludes cache from Git
# .dvcignore      - Similar to .gitignore for DVC

# Commit the DVC initialization
git add .dvc .dvcignore
git commit -m "Initialize DVC"
```

### Project Structure

A typical DVC-enabled ML project structure:

```
ml-project/
├── .dvc/
│   ├── config           # DVC configuration
│   ├── cache/           # Local cache for data files
│   └── tmp/             # Temporary files
├── .dvcignore           # Files to ignore by DVC
├── data/
│   ├── raw/             # Raw data files
│   │   └── dataset.csv
│   └── processed/       # Processed data
│       └── features.csv
├── models/
│   └── model.pkl        # Trained model
├── src/
│   ├── prepare.py       # Data preparation script
│   ├── train.py         # Training script
│   └── evaluate.py      # Evaluation script
├── dvc.yaml             # Pipeline definition
├── dvc.lock             # Pipeline state lock file
├── params.yaml          # Parameters configuration
├── data.dvc             # DVC metafile for data
└── requirements.txt
```

## Data Version Control

### Tracking Data Files

To start tracking a file or directory with DVC:

```bash
# Track a single file
dvc add data/raw/dataset.csv

# Track an entire directory
dvc add data/raw/

# This creates:
# data/raw/dataset.csv.dvc  - Metafile with hash and size
# data/raw/.gitignore       - Prevents Git from tracking the data

# View the generated .dvc file
cat data/raw/dataset.csv.dvc
```

The `.dvc` file content:

```yaml
outs:
- md5: a8f5f167f44f4964e6c998dee827110c
  size: 14445097
  hash: md5
  path: dataset.csv
```

### Understanding the DVC Cache

DVC uses a content-addressable cache to store file versions efficiently:

```bash
# Cache location (default: .dvc/cache)
ls -la .dvc/cache/files/md5/

# Structure: first 2 characters of hash / remaining hash
# .dvc/cache/files/md5/a8/f5f167f44f4964e6c998dee827110c

# Check cache status
dvc cache dir

# Clean up unused cache entries
dvc gc --workspace
```

### Committing Changes

After adding files to DVC:

```bash
# Add the .dvc metafile and .gitignore to Git
git add data/raw/dataset.csv.dvc data/raw/.gitignore

# Commit with a descriptive message
git commit -m "Add raw dataset v1.0"

# Tag the version for easy reference
git tag -a "data-v1.0" -m "Initial dataset version"
```

### Updating Data

When your data changes:

```bash
# After updating dataset.csv, run:
dvc add data/raw/dataset.csv

# DVC updates the .dvc file with new hash
git add data/raw/dataset.csv.dvc
git commit -m "Update dataset with new samples"
git tag -a "data-v1.1" -m "Added 1000 new samples"
```

### Switching Between Data Versions

```bash
# Checkout a specific data version
git checkout data-v1.0
dvc checkout

# Or checkout specific files
dvc checkout data/raw/dataset.csv.dvc

# View data file status
dvc status

# Compare data versions
dvc diff HEAD~1
```

## Remote Storage Configuration

### Supported Remote Types

DVC supports various remote storage backends:

| Remote Type | Protocol | Use Case |
|-------------|----------|----------|
| Amazon S3 | `s3://` | Cloud storage, team collaboration |
| Google Cloud Storage | `gs://` | GCP-based projects |
| Azure Blob Storage | `azure://` | Azure-based projects |
| SSH/SFTP | `ssh://` | Self-hosted servers |
| HDFS | `hdfs://` | Big data environments |
| HTTP/WebDAV | `http://` | Simple file servers |
| Local path | `/path/to/dir` | Local network storage |

### Configuring Remote Storage

```bash
# Add an S3 remote (default remote)
dvc remote add -d myremote s3://mybucket/dvc-storage

# Add Google Cloud Storage remote
dvc remote add gcs-remote gs://mybucket/dvc-storage

# Add Azure Blob Storage remote
dvc remote add azure-remote azure://mycontainer/dvc-storage

# Add SSH remote
dvc remote add ssh-remote ssh://user@server.com/path/to/storage

# Add local remote (useful for testing)
dvc remote add local-remote /mnt/shared/dvc-storage

# List configured remotes
dvc remote list

# Set default remote
dvc remote default myremote
```

### Remote Authentication

```bash
# S3 with credentials (uses AWS CLI configuration by default)
dvc remote modify myremote access_key_id 'AKIAIOSFODNN7EXAMPLE'
dvc remote modify myremote secret_access_key 'wJalrXUtnFEMI/K7MDENG'

# S3 with IAM role (no credentials needed)
dvc remote modify myremote profile myprofile

# Google Cloud Storage (uses gcloud auth)
dvc remote modify gcs-remote credentialpath /path/to/credentials.json

# SSH with key file
dvc remote modify ssh-remote keyfile /path/to/private_key

# Store sensitive credentials locally (not in Git)
dvc remote modify --local myremote access_key_id 'AKIAIOSFODNN7EXAMPLE'
```

### Pushing and Pulling Data

```bash
# Push all tracked data to remote
dvc push

# Push specific files
dvc push data/raw/dataset.csv.dvc

# Pull all data from remote
dvc pull

# Pull specific files
dvc pull data/raw/dataset.csv.dvc

# Fetch without checkout (download to cache only)
dvc fetch

# Check what would be pushed/pulled
dvc push --dry-run
dvc pull --dry-run
```

### Configuration File

The `.dvc/config` file stores remote configurations:

```ini
[core]
    remote = myremote
    autostage = true

[remote "myremote"]
    url = s3://mybucket/dvc-storage

[remote "gcs-remote"]
    url = gs://mybucket/dvc-storage
```

## DVC Pipelines

### Why Pipelines?

DVC Pipelines allow you to define reproducible ML workflows:

- **Dependency tracking**: Automatically detect when stages need to rerun
- **Reproducibility**: Anyone can reproduce your entire workflow
- **Caching**: Skip stages that have not changed
- **Visualization**: See your workflow as a DAG (Directed Acyclic Graph)

### Defining Pipelines

Create a `dvc.yaml` file:

```yaml
stages:
  prepare:
    cmd: python src/prepare.py
    deps:
      - src/prepare.py
      - data/raw/dataset.csv
    params:
      - prepare.split_ratio
      - prepare.seed
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
      - metrics/train_metrics.json:
          cache: false

  evaluate:
    cmd: python src/evaluate.py
    deps:
      - src/evaluate.py
      - models/model.pkl
      - data/processed/test.csv
    metrics:
      - metrics/eval_metrics.json:
          cache: false
    plots:
      - plots/confusion_matrix.csv:
          x: predicted
          y: actual
      - plots/roc_curve.csv:
          x: fpr
          y: tpr
```

### Parameters File

Create a `params.yaml` file for experiment parameters:

```yaml
prepare:
  split_ratio: 0.2
  seed: 42

train:
  n_estimators: 100
  max_depth: 10
  learning_rate: 0.1

evaluate:
  threshold: 0.5
```

### Pipeline Scripts

Example `src/prepare.py`:

```python
import pandas as pd
from sklearn.model_selection import train_test_split
import yaml
import os

def prepare_data():
    # Load parameters
    with open("params.yaml", "r") as f:
        params = yaml.safe_load(f)

    # Read raw data
    df = pd.read_csv("data/raw/dataset.csv")

    # Split data
    train, test = train_test_split(
        df,
        test_size=params["prepare"]["split_ratio"],
        random_state=params["prepare"]["seed"]
    )

    # Ensure output directory exists
    os.makedirs("data/processed", exist_ok=True)

    # Save processed data
    train.to_csv("data/processed/train.csv", index=False)
    test.to_csv("data/processed/test.csv", index=False)

    print(f"Train samples: {len(train)}")
    print(f"Test samples: {len(test)}")

if __name__ == "__main__":
    prepare_data()
```

Example `src/train.py`:

```python
import pandas as pd
import json
import yaml
import os
import joblib
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import accuracy_score, f1_score

def train_model():
    # Load parameters
    with open("params.yaml", "r") as f:
        params = yaml.safe_load(f)

    # Load training data
    train = pd.read_csv("data/processed/train.csv")
    X_train = train.drop("target", axis=1)
    y_train = train["target"]

    # Initialize and train model
    model = GradientBoostingClassifier(
        n_estimators=params["train"]["n_estimators"],
        max_depth=params["train"]["max_depth"],
        learning_rate=params["train"]["learning_rate"],
        random_state=42
    )
    model.fit(X_train, y_train)

    # Calculate training metrics
    y_pred = model.predict(X_train)
    metrics = {
        "train_accuracy": accuracy_score(y_train, y_pred),
        "train_f1": f1_score(y_train, y_pred, average="weighted")
    }

    # Ensure output directories exist
    os.makedirs("models", exist_ok=True)
    os.makedirs("metrics", exist_ok=True)

    # Save model using joblib (recommended for scikit-learn models)
    joblib.dump(model, "models/model.pkl")

    # Save metrics
    with open("metrics/train_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"Training accuracy: {metrics['train_accuracy']:.4f}")

if __name__ == "__main__":
    train_model()
```

Example `src/evaluate.py`:

```python
import pandas as pd
import json
import yaml
import os
import joblib
from sklearn.metrics import (
    accuracy_score, f1_score, precision_score,
    recall_score, confusion_matrix, roc_curve
)

def evaluate_model():
    # Load parameters
    with open("params.yaml", "r") as f:
        params = yaml.safe_load(f)

    # Load test data
    test = pd.read_csv("data/processed/test.csv")
    X_test = test.drop("target", axis=1)
    y_test = test["target"]

    # Load model
    model = joblib.load("models/model.pkl")

    # Make predictions
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    # Calculate metrics
    metrics = {
        "accuracy": accuracy_score(y_test, y_pred),
        "f1": f1_score(y_test, y_pred, average="weighted"),
        "precision": precision_score(y_test, y_pred, average="weighted"),
        "recall": recall_score(y_test, y_pred, average="weighted")
    }

    # Ensure output directories exist
    os.makedirs("metrics", exist_ok=True)
    os.makedirs("plots", exist_ok=True)

    # Save metrics
    with open("metrics/eval_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    # Save confusion matrix for plotting
    cm = confusion_matrix(y_test, y_pred)
    cm_df = pd.DataFrame({
        "actual": [0, 0, 1, 1],
        "predicted": [0, 1, 0, 1],
        "count": cm.flatten()
    })
    cm_df.to_csv("plots/confusion_matrix.csv", index=False)

    # Save ROC curve data
    fpr, tpr, _ = roc_curve(y_test, y_prob)
    roc_df = pd.DataFrame({"fpr": fpr, "tpr": tpr})
    roc_df.to_csv("plots/roc_curve.csv", index=False)

    print(f"Test accuracy: {metrics['accuracy']:.4f}")
    print(f"Test F1 score: {metrics['f1']:.4f}")

if __name__ == "__main__":
    evaluate_model()
```

### Running Pipelines

```bash
# Run the entire pipeline
dvc repro

# Run a specific stage
dvc repro train

# Force rerun even if dependencies have not changed
dvc repro --force

# Run pipeline in dry-run mode
dvc repro --dry

# Visualize the pipeline DAG
dvc dag

# View pipeline DAG in ASCII
dvc dag --ascii
```

### Pipeline Lock File

After running `dvc repro`, a `dvc.lock` file is generated:

```yaml
schema: '2.0'
stages:
  prepare:
    cmd: python src/prepare.py
    deps:
    - path: data/raw/dataset.csv
      hash: md5
      md5: a8f5f167f44f4964e6c998dee827110c
      size: 14445097
    - path: src/prepare.py
      hash: md5
      md5: 35e4b8c2a9d6f7e8b9c0d1e2f3a4b5c6
      size: 1024
    params:
      params.yaml:
        prepare.seed: 42
        prepare.split_ratio: 0.2
    outs:
    - path: data/processed/test.csv
      hash: md5
      md5: d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9
      size: 2889019
    - path: data/processed/train.csv
      hash: md5
      md5: b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6
      size: 11556078
  # ... other stages
```

## Experiment Tracking

### DVC Experiments Overview

DVC Experiments extend pipelines with powerful experiment tracking capabilities:

- Run multiple experiments with different parameters
- Compare metrics across experiments
- Share experiments without creating Git branches
- Queue and parallelize experiment runs

### Running Experiments

```bash
# Run an experiment with modified parameters
dvc exp run --set-param train.n_estimators=200

# Run with multiple parameter changes
dvc exp run -S train.n_estimators=200 -S train.learning_rate=0.05

# Queue multiple experiments
dvc exp run --queue -S train.n_estimators=100
dvc exp run --queue -S train.n_estimators=200
dvc exp run --queue -S train.n_estimators=300

# Run all queued experiments
dvc exp run --run-all

# Run queued experiments in parallel
dvc exp run --run-all --parallel 4

# Run experiment with a custom name
dvc exp run --name "high-lr-experiment" -S train.learning_rate=0.2
```

### Comparing Experiments

```bash
# List all experiments
dvc exp show

# Show experiments in table format with specific columns
dvc exp show --include-params train --include-metrics accuracy,f1

# Compare specific experiments
dvc exp diff exp-abc123 exp-def456

# Show experiments as JSON for scripting
dvc exp show --json
```

Example output of `dvc exp show`:

```
+----------------------+----------+----------------+--------------------+
| Experiment           | accuracy | n_estimators   | learning_rate      |
+----------------------+----------+----------------+--------------------+
| workspace            | 0.8523   | 100            | 0.1                |
| main                 | 0.8523   | 100            | 0.1                |
| |-- exp-abc123       | 0.8712   | 200            | 0.1                |
| |-- exp-def456       | 0.8634   | 100            | 0.05               |
| +-- high-lr-exp      | 0.8245   | 100            | 0.2                |
+----------------------+----------+----------------+--------------------+
```

### Managing Experiments

```bash
# Apply an experiment to workspace (make it the current state)
dvc exp apply exp-abc123

# Create a Git branch from an experiment
dvc exp branch exp-abc123 feature/improved-model

# Remove experiments
dvc exp remove exp-abc123

# Remove all experiments
dvc exp remove --all

# Push experiments to remote Git
dvc exp push origin exp-abc123

# Pull experiments from remote
dvc exp pull origin
```

### Experiment Metrics and Plots

```bash
# Show metrics
dvc metrics show

# Compare metrics across experiments
dvc metrics diff

# Show plots
dvc plots show

# Generate comparison plots
dvc plots diff exp-abc123 exp-def456

# Modify plot configuration
dvc plots modify plots/roc_curve.csv -x fpr -y tpr --title "ROC Curve"
```

## Model Versioning

### Tracking Models

Models are tracked the same way as data:

```bash
# Track a trained model
dvc add models/model.pkl

# Or include in pipeline outputs (recommended)
# In dvc.yaml:
#   train:
#     outs:
#       - models/model.pkl

# Commit model version
git add models/model.pkl.dvc
git commit -m "Add trained model v1.0"
git tag -a "model-v1.0" -m "Baseline model"
```

### Model Registry Pattern

Organize models with a structured approach:

```bash
# Create a model registry structure
models/
|-- production/
|   +-- model.pkl          # Current production model
|-- staging/
|   +-- model.pkl          # Model being validated
+-- experiments/
    |-- 2024-01-15_baseline/
    |   +-- model.pkl
    +-- 2024-01-20_improved/
        +-- model.pkl

# Track the entire models directory
dvc add models/

# Or use DVC pipeline for automated model versioning
```

### Promoting Models

```bash
# Checkout a specific model version
git checkout model-v1.0
dvc checkout models/

# Copy model to production (in your deployment workflow)
cp models/model.pkl /path/to/production/

# Or use DVC to manage model promotion
dvc get https://github.com/org/repo models/model.pkl --rev model-v2.0 -o production/
```

## Git Collaboration Workflows

### Team Workflow

```bash
# Developer A: Add new data and push
dvc add data/new_samples.csv
git add data/new_samples.csv.dvc
git commit -m "Add new training samples"
dvc push
git push

# Developer B: Pull changes
git pull
dvc pull  # Downloads the new data from remote storage

# Both developers now have the same data version
```

### Branching Strategy

```bash
# Create feature branch
git checkout -b feature/new-model

# Run experiments
dvc exp run -S train.n_estimators=300

# Push experiment for review
dvc exp push origin

# After merge, clean up
git checkout main
git merge feature/new-model
dvc exp apply exp-abc123  # Apply best experiment
dvc push
git push
```

### Importing Data from Other Repositories

```bash
# Import data file from another DVC repository
dvc import https://github.com/org/data-repo data/dataset.csv

# Import with specific version
dvc import https://github.com/org/data-repo data/dataset.csv --rev v1.0

# Update imported data
dvc update data/dataset.csv.dvc

# Get a file without tracking (one-time download)
dvc get https://github.com/org/data-repo data/dataset.csv -o local_copy.csv
```

### Sharing Experiments

```bash
# Push experiment to shared remote
dvc exp push origin exp-abc123

# List remote experiments
dvc exp list origin

# Pull colleague's experiment
dvc exp pull origin colleague-exp-xyz

# Apply and review
dvc exp apply colleague-exp-xyz
dvc metrics show
```

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/ml-pipeline.yml`:

```yaml
name: ML Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
  AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

jobs:
  train:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.10"

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install "dvc[s3]"

      - name: Pull DVC data
        run: dvc pull

      - name: Run DVC pipeline
        run: dvc repro

      - name: Push results
        if: github.ref == 'refs/heads/main'
        run: |
          dvc push

      - name: Comment metrics on PR
        if: github.event_name == 'pull_request'
        uses: iterative/cml@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
        env:
          REPO_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          echo "## Model Metrics" >> report.md
          dvc metrics show --md >> report.md
          echo "## Metrics Diff" >> report.md
          dvc metrics diff main --md >> report.md
          cml comment create report.md
```

### GitLab CI Example

Create `.gitlab-ci.yml`:

```yaml
stages:
  - train
  - evaluate
  - deploy

variables:
  PIP_CACHE_DIR: "$CI_PROJECT_DIR/.cache/pip"

cache:
  paths:
    - .cache/pip

train:
  stage: train
  image: python:3.10
  before_script:
    - pip install -r requirements.txt
    - pip install "dvc[s3]"
    - dvc remote modify --local myremote access_key_id $AWS_ACCESS_KEY_ID
    - dvc remote modify --local myremote secret_access_key $AWS_SECRET_ACCESS_KEY
  script:
    - dvc pull
    - dvc repro
    - dvc push
  artifacts:
    paths:
      - metrics/
      - models/
    reports:
      metrics: metrics/eval_metrics.json

evaluate:
  stage: evaluate
  image: python:3.10
  script:
    - pip install "dvc[s3]"
    - dvc metrics show
    - dvc plots show --out plots_output
  artifacts:
    paths:
      - plots_output/
  dependencies:
    - train

deploy:
  stage: deploy
  image: python:3.10
  script:
    - echo "Deploying model to production..."
    # Add deployment scripts here
  only:
    - main
  when: manual
```

### CML (Continuous Machine Learning)

DVC integrates with CML for ML-specific CI/CD:

```yaml
# .github/workflows/cml.yml
name: CML Report

on: [pull_request]

jobs:
  report:
    runs-on: ubuntu-latest
    container: docker://ghcr.io/iterative/cml:0-dvc2-base1

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Train model
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          pip install -r requirements.txt
          dvc pull
          dvc repro

      - name: Create CML report
        env:
          REPO_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          echo "# Experiment Report" >> report.md

          echo "## Metrics" >> report.md
          dvc metrics show --md >> report.md

          echo "## Metrics Comparison" >> report.md
          dvc metrics diff --md >> report.md

          echo "## Plots" >> report.md
          dvc plots diff \
            --target plots/roc_curve.csv \
            --show-vega > vega.json
          vl2png vega.json -s 1.5 > roc.png
          echo "![ROC Curve](./roc.png)" >> report.md

          cml comment create report.md
```

## Best Practices

### Project Organization

```bash
# Recommended .gitignore additions
/data/raw/*
/data/processed/*
/models/*
!/data/raw/.gitkeep
!/data/processed/.gitkeep
!/models/.gitkeep

# Keep .dvc files tracked
!*.dvc

# Recommended .dvcignore
# Ignore IDE and OS files
.idea/
.vscode/
__pycache__/
*.pyc
.DS_Store
```

### Naming Conventions

```bash
# Data versioning with meaningful tags
git tag -a "data-raw-v1.0" -m "Initial dataset: 10K samples"
git tag -a "data-processed-v1.0" -m "Features extracted, cleaned"
git tag -a "model-baseline-v1.0" -m "Logistic regression baseline"
git tag -a "model-rf-v1.0" -m "Random Forest with optimized hyperparameters"

# Experiment naming
dvc exp run --name "rf-n100-d10-lr0.1"  # Algorithm-param-param-param
dvc exp run --name "2024-01-15-baseline"  # Date-based naming
```

### Performance Optimization

```bash
# Enable symlinks for faster checkout (Unix systems)
dvc config cache.type symlink

# Use hardlinks when possible
dvc config cache.type hardlink

# Enable parallel file operations
dvc config core.jobs 4

# Use shared cache for multiple projects
dvc cache dir --global /shared/dvc-cache
dvc config cache.shared group
```

### Security Considerations

```bash
# Store credentials locally (not in repo)
dvc remote modify --local myremote access_key_id 'AKIA...'
dvc remote modify --local myremote secret_access_key 'secret...'

# Use environment variables in CI/CD
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret

# Verify remote storage encryption
dvc remote modify myremote sse aws:kms
dvc remote modify myremote sse_kms_key_id 'key-id'
```

### Common Pitfalls to Avoid

| Pitfall | Problem | Solution |
|---------|---------|----------|
| Large .dvc files in Git | Tracking too many small files individually | Use directory tracking |
| Missing data on checkout | Forgot to run `dvc pull` | Add to post-checkout hook |
| Cache bloat | Old versions consuming disk space | Run `dvc gc` periodically |
| Broken pipelines | Hardcoded paths | Use relative paths and params.yaml |
| Inconsistent environments | Different Python/package versions | Use requirements.txt with pinned versions |

## Troubleshooting

### Common Issues and Solutions

```bash
# Issue: "Unable to find remote"
dvc remote list  # Check configured remotes
dvc remote default myremote  # Set default

# Issue: "Checkout failed, cannot find cache"
dvc fetch  # Download to cache first
dvc checkout

# Issue: "Pipeline stage failed"
dvc repro --verbose  # See detailed output
dvc repro --force  # Force rerun

# Issue: "Data file modified but not tracked"
dvc status  # Check what changed
dvc add data/file.csv  # Re-add modified file

# Issue: "Out of disk space"
dvc gc --workspace --cloud  # Remove unused cache
du -sh .dvc/cache/  # Check cache size

# Issue: "Slow push/pull"
dvc remote modify myremote jobs 8  # Increase parallelism
```

### Debugging Commands

```bash
# Verbose output
dvc pull -v
dvc push -v
dvc repro -v

# Check DVC version and configuration
dvc version
dvc config --list

# Verify data integrity
dvc diff
dvc status

# Check remote connectivity
dvc remote list
dvc push --dry-run
```

## Interview Questions

### Conceptual Questions

**Q: How does DVC handle large files differently from Git?**

A: DVC stores large files in a content-addressable cache and remote storage, while only tracking small metafiles (`.dvc`) in Git. These metafiles contain MD5 hashes that point to the actual data. This approach keeps the Git repository lightweight while enabling full version control of large files.

**Q: What is the difference between `dvc add` and including a file in `dvc.yaml` outputs?**

A: `dvc add` is used for manually tracking static files that do not change frequently (like raw datasets). Pipeline outputs in `dvc.yaml` are automatically tracked and updated when the pipeline runs. Use `dvc add` for input data and `dvc.yaml` outputs for derived artifacts.

**Q: How does DVC ensure reproducibility?**

A: DVC ensures reproducibility through: (1) tracking exact versions of data via content hashes, (2) recording pipeline dependencies and parameters in `dvc.lock`, (3) caching intermediate results, and (4) allowing anyone to reproduce the exact environment by running `dvc repro` with the same `dvc.lock` file.

### Practical Questions

**Q: How would you handle a situation where two team members are working on different data versions?**

A: Each team member works on their own Git branch with corresponding data versions tracked by `.dvc` files. When merging, Git handles the `.dvc` file conflicts like any other file. After resolving conflicts and running `dvc checkout`, each branch maintains its data version independently until explicitly merged.

**Q: What is your strategy for migrating an existing ML project to DVC?**

A: Step-by-step approach:
1. Initialize DVC in the existing Git repo (`dvc init`)
2. Configure remote storage for large files
3. Add existing data files to DVC (`dvc add`)
4. Create `dvc.yaml` to define the ML pipeline
5. Add `params.yaml` for experiment parameters
6. Run `dvc repro` to generate `dvc.lock`
7. Commit all changes and push data to remote
8. Document the workflow for team members

**Q: How do you optimize DVC for a team with limited storage budget?**

A: Optimization strategies:
1. Use `dvc gc --cloud` to remove unused versions from remote
2. Implement a retention policy for old experiments
3. Use compression for remote storage
4. Enable cache deduplication with hardlinks/symlinks
5. Store only essential data; regenerate derived data via pipelines
6. Use differential storage if supported by remote backend

## Further Reading

### Official Resources

- [DVC Documentation](https://dvc.org/doc)
- [DVC Command Reference](https://dvc.org/doc/command-reference)
- [DVC User Guide](https://dvc.org/doc/user-guide)
- [Iterative.ai Blog](https://iterative.ai/blog)

### Related Tools

- **CML**: Continuous Machine Learning - CI/CD for ML projects
- **MLEM**: ML model deployment and packaging
- **DVCLive**: Real-time experiment logging
- **Studio**: Web-based experiment tracking dashboard

### Complementary Technologies

- **MLflow**: Broader ML lifecycle management
- **Weights & Biases**: Experiment tracking and visualization
- **Kubeflow**: Kubernetes-native ML pipelines
- **Great Expectations**: Data validation and quality

### Learning Resources

- [DVC Tutorial Series](https://dvc.org/doc/start)
- [Made With ML - MLOps Course](https://madewithml.com/)
- [Full Stack Deep Learning](https://fullstackdeeplearning.com/)
- [MLOps Community](https://mlops.community/)

---

## Summary

DVC (Data Version Control) is an essential tool for modern machine learning projects. It solves the critical problem of versioning large data files and models that Git cannot efficiently handle. Key takeaways:

1. **Seamless Git Integration**: DVC works alongside Git, using metafiles to link code versions with data versions.

2. **Flexible Storage**: Support for multiple remote storage backends (S3, GCS, Azure, SSH) makes it adaptable to any infrastructure.

3. **Reproducible Pipelines**: Define your ML workflow in `dvc.yaml` to ensure experiments are reproducible and cacheable.

4. **Experiment Management**: Track, compare, and share experiments without creating Git branch clutter.

5. **Team Collaboration**: Enable data and model sharing across teams with simple push/pull commands.

6. **CI/CD Ready**: Integrates well with GitHub Actions, GitLab CI, and specialized ML CI/CD tools like CML.

As ML projects grow in complexity, adopting tools like DVC early in the development lifecycle pays dividends in reproducibility, collaboration, and operational efficiency. Whether you are working solo or in a large team, DVC provides the foundation for professional ML engineering practices.
