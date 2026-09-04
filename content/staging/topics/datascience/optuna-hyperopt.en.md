---
title: "Automated Machine Learning: Hyperparameter Optimization"
description: "Master hyperparameter optimization tools: Optuna, Ray Tune, and Hyperopt"
track: datascience
section: classical-ml
difficulty: intermediate
tags:
  - hyperparameters
  - Optuna
  - Ray Tune
  - optimization
status: imported
origin: old/src/content/docs/datascience/optuna-hyperopt.en.md
divergence: 0.219
issues:
  - title-lang-zh
  - title-language
legacy:
  category: DataScience
  subcategory: AutoML
  order: 39
  lastUpdated: 2026-01-07
---

Hyperparameter optimization (HPO) is a critical component of the machine learning pipeline that can significantly impact model performance. Unlike model parameters learned during training, hyperparameters are set before training begins and control aspects like learning rate, model architecture, and regularization strength. We'll cover the most powerful tools for automating hyperparameter search: Optuna, Ray Tune, and Hyperopt.

---

## The Hyperparameter Optimization Problem

### What Are Hyperparameters?

Hyperparameters are configuration settings that control the learning process and model architecture. Unlike model parameters (weights and biases), hyperparameters are not learned from data.

**Common Types of Hyperparameters:**

| Category | Examples | Typical Range |
|----------|----------|---------------|
| Learning | Learning rate, batch size, epochs | 1e-5 to 1e-1, 16-512, 10-1000 |
| Architecture | Number of layers, hidden units, kernel size | 1-100, 32-2048, 3-7 |
| Regularization | Dropout rate, L1/L2 penalty, weight decay | 0-0.5, 1e-6 to 1e-2 |
| Optimizer | Momentum, beta values, epsilon | 0.9-0.99, (0.9, 0.999) |

### Why Manual Tuning Falls Short

```python
# The naive approach: Grid Search
from sklearn.model_selection import GridSearchCV
from sklearn.ensemble import RandomForestClassifier

param_grid = {
    'n_estimators': [50, 100, 200, 500],
    'max_depth': [5, 10, 20, None],
    'min_samples_split': [2, 5, 10],
    'min_samples_leaf': [1, 2, 4]
}

# This creates 4 * 4 * 3 * 3 = 144 combinations!
# Each requiring full model training
grid_search = GridSearchCV(
    RandomForestClassifier(random_state=42),
    param_grid,
    cv=5,
    scoring='accuracy',
    n_jobs=-1
)
```

**Problems with Grid Search:**

- **Exponential complexity**: Adding one hyperparameter doubles search space
- **Wasteful exploration**: Equal time spent on promising and unpromising regions
- **Fixed granularity**: May miss optimal values between grid points

### The Search Space Challenge

The hyperparameter optimization problem can be formalized as finding the optimal configuration that minimizes the objective function over the search space.

**Search Space Types:**

```python
# Categorical: Discrete choices
optimizer_type = ['adam', 'sgd', 'adamw']

# Integer: Discrete numbers
num_layers = range(1, 10)

# Continuous: Real numbers
learning_rate = (1e-5, 1e-1)  # Often log-scale

# Conditional: Depends on other choices
if optimizer_type == 'sgd':
    momentum = (0.0, 0.99)
```

---

## Optuna: Modern Hyperparameter Optimization

Optuna is a next-generation hyperparameter optimization framework that emphasizes ease of use, flexibility, and efficiency.

### Installation and Basic Usage

```bash
pip install optuna optuna-dashboard
```

```python
import optuna
from sklearn.datasets import load_iris
from sklearn.model_selection import cross_val_score
from sklearn.ensemble import RandomForestClassifier

def objective(trial):
    """Define the objective function to optimize."""

    # Suggest hyperparameters
    n_estimators = trial.suggest_int('n_estimators', 50, 500)
    max_depth = trial.suggest_int('max_depth', 3, 20)
    min_samples_split = trial.suggest_int('min_samples_split', 2, 20)
    min_samples_leaf = trial.suggest_int('min_samples_leaf', 1, 10)

    # Create model with suggested hyperparameters
    clf = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth,
        min_samples_split=min_samples_split,
        min_samples_leaf=min_samples_leaf,
        random_state=42,
        n_jobs=-1
    )

    # Load data and evaluate
    iris = load_iris()
    scores = cross_val_score(clf, iris.data, iris.target, cv=5, scoring='accuracy')

    return scores.mean()

# Create study and optimize
study = optuna.create_study(direction='maximize')
study.optimize(objective, n_trials=100, show_progress_bar=True)

# Results
print(f"Best trial: {study.best_trial.number}")
print(f"Best value: {study.best_value:.4f}")
print(f"Best params: {study.best_params}")
```

### Suggest Methods: Defining Search Spaces

```python
def comprehensive_objective(trial):
    """Demonstrate all suggest methods."""

    # Integer parameters
    n_layers = trial.suggest_int('n_layers', 1, 5)

    # Float parameters (linear scale)
    dropout = trial.suggest_float('dropout', 0.0, 0.5)

    # Float parameters (log scale - for learning rates)
    lr = trial.suggest_float('lr', 1e-5, 1e-1, log=True)

    # Categorical parameters
    optimizer = trial.suggest_categorical('optimizer', ['adam', 'sgd', 'adamw'])
    activation = trial.suggest_categorical('activation', ['relu', 'gelu', 'silu'])

    # Conditional parameters
    if optimizer == 'sgd':
        momentum = trial.suggest_float('momentum', 0.0, 0.99)
    else:
        momentum = None

    # Step-wise float (discrete float values)
    weight_decay = trial.suggest_float('weight_decay', 0.0, 0.1, step=0.01)

    # Build model based on suggestions
    hidden_sizes = []
    for i in range(n_layers):
        hidden_sizes.append(trial.suggest_int(f'hidden_size_{i}', 32, 512))

    # ... train and evaluate model
    return validation_accuracy
```

### Study Storage and Persistence

```python
import optuna

# SQLite storage for persistence
study = optuna.create_study(
    study_name='my_experiment',
    storage='sqlite:///optuna_study.db',
    direction='maximize',
    load_if_exists=True  # Resume previous study
)

# PostgreSQL for distributed optimization
study = optuna.create_study(
    study_name='distributed_experiment',
    storage='postgresql://user:password@localhost/optuna',
    direction='maximize',
    load_if_exists=True
)

# Run optimization (can be done from multiple processes)
study.optimize(objective, n_trials=100)
```

### Visualization Tools

```python
import optuna
from optuna.visualization import (
    plot_optimization_history,
    plot_param_importances,
    plot_parallel_coordinate,
    plot_contour,
    plot_slice
)

# After optimization, visualize results
fig1 = plot_optimization_history(study)
fig1.show()

# Parameter importance
fig2 = plot_param_importances(study)
fig2.show()

# Parallel coordinate plot
fig3 = plot_parallel_coordinate(study)
fig3.show()

# Contour plot for two parameters
fig4 = plot_contour(study, params=['lr', 'dropout'])
fig4.show()

# Slice plot for each parameter
fig5 = plot_slice(study)
fig5.show()
```

### Optuna Dashboard

```bash
# Launch the dashboard
optuna-dashboard sqlite:///optuna_study.db

# Access at http://localhost:8080
```

---

## TPE Sampler: Understanding the Algorithm

The Tree-structured Parzen Estimator (TPE) is Optuna's default sampling algorithm. It's a Bayesian optimization method that models the search space efficiently.

### How TPE Works

Unlike traditional Bayesian optimization that models P(y|theta), TPE models P(theta|y) by maintaining two distributions:

- **l(theta)**: Distribution of hyperparameters that led to good results
- **g(theta)**: Distribution of hyperparameters that led to poor results
- **y***: Threshold (typically top 20% of observations)

The Expected Improvement is proportional to l(theta)/g(theta).

```python
import optuna
from optuna.samplers import TPESampler

# Configure TPE sampler
sampler = TPESampler(
    n_startup_trials=10,     # Random trials before TPE kicks in
    n_ei_candidates=24,      # Number of candidates for EI calculation
    seed=42
)

study = optuna.create_study(
    direction='minimize',
    sampler=sampler
)

study.optimize(objective, n_trials=100)
```

### Alternative Samplers

```python
from optuna.samplers import (
    TPESampler,
    CmaEsSampler,
    RandomSampler,
    GridSampler,
    NSGAIISampler
)

# CMA-ES: Good for continuous spaces
cma_sampler = CmaEsSampler(
    n_startup_trials=10,
    seed=42
)

# Random Sampler: Baseline for comparison
random_sampler = RandomSampler(seed=42)

# Grid Sampler: For exhaustive search
grid_sampler = GridSampler({
    'lr': [1e-4, 1e-3, 1e-2],
    'dropout': [0.1, 0.2, 0.3]
})

# NSGA-II: For multi-objective optimization
nsga_sampler = NSGAIISampler(seed=42)

# Using different samplers for different parameter types
from optuna.samplers import PartialFixedSampler

# Fix some parameters while optimizing others
partial_sampler = PartialFixedSampler(
    fixed_params={'lr': 1e-3},
    base_sampler=TPESampler()
)
```

---

## Pruning Strategies

Pruning allows early termination of unpromising trials, significantly reducing computation time.

### Built-in Pruners

```python
import optuna
from optuna.pruners import (
    MedianPruner,
    PercentilePruner,
    SuccessiveHalvingPruner,
    HyperbandPruner,
    ThresholdPruner
)

# Median Pruner: Prune if below median of previous trials
median_pruner = MedianPruner(
    n_startup_trials=5,      # Trials before pruning starts
    n_warmup_steps=10,       # Steps before pruning in each trial
    interval_steps=1         # Check pruning every N steps
)

# Percentile Pruner: More aggressive pruning
percentile_pruner = PercentilePruner(
    percentile=25.0,         # Prune bottom 75%
    n_startup_trials=5,
    n_warmup_steps=10
)

# Successive Halving: Efficient resource allocation
sha_pruner = SuccessiveHalvingPruner(
    min_resource=1,
    reduction_factor=3,
    min_early_stopping_rate=0
)

# Hyperband: State-of-the-art pruning
hyperband_pruner = HyperbandPruner(
    min_resource=1,
    max_resource=100,
    reduction_factor=3
)

# Threshold Pruner: Simple threshold-based pruning
threshold_pruner = ThresholdPruner(
    upper=0.9,  # Prune if validation loss > 0.9
    n_warmup_steps=5
)
```

### Implementing Pruning in Objective Function

```python
import optuna
import torch
import torch.nn as nn
from torch.utils.data import DataLoader

def objective_with_pruning(trial):
    """Objective function with intermediate value reporting for pruning."""

    # Suggest hyperparameters
    lr = trial.suggest_float('lr', 1e-5, 1e-1, log=True)
    n_layers = trial.suggest_int('n_layers', 1, 5)
    hidden_size = trial.suggest_int('hidden_size', 32, 256)
    dropout = trial.suggest_float('dropout', 0.0, 0.5)

    # Build model
    model = build_model(n_layers, hidden_size, dropout)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    criterion = nn.CrossEntropyLoss()

    # Training loop with pruning
    n_epochs = 100
    for epoch in range(n_epochs):
        # Training
        model.train()
        for batch in train_loader:
            optimizer.zero_grad()
            loss = criterion(model(batch['x']), batch['y'])
            loss.backward()
            optimizer.step()

        # Validation
        model.eval()
        val_accuracy = evaluate(model, val_loader)

        # Report intermediate value for pruning
        trial.report(val_accuracy, epoch)

        # Check if trial should be pruned
        if trial.should_prune():
            raise optuna.TrialPruned()

    return val_accuracy

# Create study with pruner
study = optuna.create_study(
    direction='maximize',
    pruner=optuna.pruners.HyperbandPruner(
        min_resource=1,
        max_resource=100,
        reduction_factor=3
    )
)

study.optimize(objective_with_pruning, n_trials=100)

# Check pruned trials
n_pruned = len([t for t in study.trials if t.state == optuna.trial.TrialState.PRUNED])
print(f"Pruned trials: {n_pruned}/{len(study.trials)}")
```

### PyTorch Lightning Integration with Pruning

```python
import optuna
from optuna.integration import PyTorchLightningPruningCallback
import pytorch_lightning as pl

class LitModel(pl.LightningModule):
    def __init__(self, trial):
        super().__init__()
        self.trial = trial
        self.lr = trial.suggest_float('lr', 1e-5, 1e-1, log=True)
        self.hidden_size = trial.suggest_int('hidden_size', 32, 256)

        self.model = nn.Sequential(
            nn.Linear(784, self.hidden_size),
            nn.ReLU(),
            nn.Linear(self.hidden_size, 10)
        )

    def training_step(self, batch, batch_idx):
        x, y = batch
        loss = nn.functional.cross_entropy(self.model(x), y)
        self.log('train_loss', loss)
        return loss

    def validation_step(self, batch, batch_idx):
        x, y = batch
        loss = nn.functional.cross_entropy(self.model(x), y)
        self.log('val_loss', loss)
        return loss

    def configure_optimizers(self):
        return torch.optim.Adam(self.parameters(), lr=self.lr)

def objective(trial):
    model = LitModel(trial)

    # Pruning callback
    pruning_callback = PyTorchLightningPruningCallback(trial, monitor='val_loss')

    trainer = pl.Trainer(
        max_epochs=100,
        callbacks=[pruning_callback],
        enable_checkpointing=False,
        logger=False
    )

    trainer.fit(model, train_loader, val_loader)

    return trainer.callback_metrics['val_loss'].item()

study = optuna.create_study(
    direction='minimize',
    pruner=optuna.pruners.MedianPruner()
)
study.optimize(objective, n_trials=50)
```

---

## Ray Tune: Distributed Hyperparameter Tuning

Ray Tune is a scalable hyperparameter tuning library built on Ray, designed for distributed computing environments.

### Installation and Setup

```bash
pip install "ray[tune]" hyperopt bayesian-optimization
```

### Basic Ray Tune Usage

```python
from ray import tune
from ray.tune import CLIReporter
from ray.tune.schedulers import ASHAScheduler
import torch
import torch.nn as nn

def train_model(config):
    """Training function for Ray Tune."""

    # Build model with config
    model = nn.Sequential(
        nn.Linear(784, config['hidden_size']),
        nn.ReLU(),
        nn.Dropout(config['dropout']),
        nn.Linear(config['hidden_size'], 10)
    )

    optimizer = torch.optim.Adam(model.parameters(), lr=config['lr'])
    criterion = nn.CrossEntropyLoss()

    for epoch in range(100):
        # Training loop
        train_loss = 0
        for batch in train_loader:
            optimizer.zero_grad()
            loss = criterion(model(batch[0]), batch[1])
            loss.backward()
            optimizer.step()
            train_loss += loss.item()

        # Validation
        val_loss, val_acc = evaluate(model, val_loader)

        # Report metrics to Ray Tune
        tune.report(
            loss=val_loss,
            accuracy=val_acc,
            epoch=epoch
        )

# Define search space
config = {
    'lr': tune.loguniform(1e-5, 1e-1),
    'hidden_size': tune.choice([64, 128, 256, 512]),
    'dropout': tune.uniform(0.0, 0.5),
    'batch_size': tune.choice([32, 64, 128])
}

# ASHA scheduler for early stopping
scheduler = ASHAScheduler(
    metric='loss',
    mode='min',
    max_t=100,
    grace_period=10,
    reduction_factor=3
)

# Progress reporter
reporter = CLIReporter(
    metric_columns=['loss', 'accuracy', 'training_iteration']
)

# Run tuning
analysis = tune.run(
    train_model,
    config=config,
    num_samples=50,
    scheduler=scheduler,
    progress_reporter=reporter,
    resources_per_trial={'cpu': 2, 'gpu': 0.5},
    local_dir='./ray_results'
)

# Get best config
best_config = analysis.get_best_config(metric='loss', mode='min')
print(f"Best config: {best_config}")

# Get best result
best_result = analysis.get_best_trial(metric='loss', mode='min')
print(f"Best loss: {best_result.last_result['loss']}")
```

### Advanced Search Algorithms

```python
from ray import tune
from ray.tune.search.optuna import OptunaSearch
from ray.tune.search.hyperopt import HyperOptSearch
from ray.tune.search.bayesopt import BayesOptSearch
from ray.tune.search import ConcurrencyLimiter

# Optuna integration
optuna_search = OptunaSearch(
    metric='loss',
    mode='min'
)

# Hyperopt integration
hyperopt_search = HyperOptSearch(
    metric='loss',
    mode='min',
    n_initial_points=10
)

# Bayesian Optimization
bayesopt_search = BayesOptSearch(
    metric='loss',
    mode='min'
)

# Limit concurrent trials
search_alg = ConcurrencyLimiter(optuna_search, max_concurrent=4)

analysis = tune.run(
    train_model,
    config=config,
    search_alg=search_alg,
    num_samples=100,
    scheduler=scheduler
)
```

### Population Based Training (PBT)

```python
from ray.tune.schedulers import PopulationBasedTraining
import random

# Define perturbation functions
pbt_scheduler = PopulationBasedTraining(
    time_attr='training_iteration',
    perturbation_interval=5,
    hyperparam_mutations={
        'lr': tune.loguniform(1e-5, 1e-1),
        'dropout': tune.uniform(0.0, 0.5),
    },
    quantile_fraction=0.25,  # Bottom 25% exploit top 25%
    resample_probability=0.25,
    custom_explore_fn=None
)

def train_pbt(config, checkpoint_dir=None):
    """Training function with checkpointing for PBT."""

    model = build_model(config)
    optimizer = torch.optim.Adam(model.parameters(), lr=config['lr'])

    # Load checkpoint if available
    start_epoch = 0
    if checkpoint_dir:
        checkpoint = torch.load(os.path.join(checkpoint_dir, 'checkpoint.pt'))
        model.load_state_dict(checkpoint['model'])
        optimizer.load_state_dict(checkpoint['optimizer'])
        start_epoch = checkpoint['epoch']

    for epoch in range(start_epoch, 100):
        train_loss = train_epoch(model, optimizer, train_loader)
        val_loss, val_acc = evaluate(model, val_loader)

        # Save checkpoint
        with tune.checkpoint_dir(epoch) as checkpoint_dir:
            torch.save({
                'model': model.state_dict(),
                'optimizer': optimizer.state_dict(),
                'epoch': epoch
            }, os.path.join(checkpoint_dir, 'checkpoint.pt'))

        tune.report(loss=val_loss, accuracy=val_acc)

analysis = tune.run(
    train_pbt,
    config={
        'lr': tune.uniform(1e-4, 1e-2),
        'dropout': tune.uniform(0.1, 0.4),
        'hidden_size': 256
    },
    scheduler=pbt_scheduler,
    num_samples=8,
    stop={'training_iteration': 100}
)
```

### Distributed Training with Ray

```python
from ray import tune
from ray.tune.integration.pytorch_lightning import TuneReportCallback
import pytorch_lightning as pl

def train_distributed(config):
    """Distributed training with Ray and PyTorch Lightning."""

    model = LitModel(config)

    trainer = pl.Trainer(
        max_epochs=config['epochs'],
        accelerator='auto',
        devices='auto',
        strategy='ddp',  # Distributed Data Parallel
        callbacks=[
            TuneReportCallback(
                metrics={'loss': 'val_loss', 'accuracy': 'val_accuracy'},
                on='validation_end'
            )
        ]
    )

    trainer.fit(model, train_loader, val_loader)

# Run with multiple GPUs per trial
analysis = tune.run(
    train_distributed,
    config=config,
    num_samples=20,
    resources_per_trial={
        'cpu': 8,
        'gpu': 2  # Use 2 GPUs per trial
    }
)
```

---

## Hyperopt: Bayesian Optimization

Hyperopt is one of the original Python libraries for hyperparameter optimization using TPE algorithm.

### Basic Hyperopt Usage

```bash
pip install hyperopt
```

```python
from hyperopt import fmin, tpe, hp, STATUS_OK, Trials
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import cross_val_score
import numpy as np

# Define search space
space = {
    'n_estimators': hp.choice('n_estimators', range(50, 500, 50)),
    'max_depth': hp.choice('max_depth', range(3, 15)),
    'learning_rate': hp.loguniform('learning_rate', np.log(0.01), np.log(0.3)),
    'min_samples_split': hp.choice('min_samples_split', range(2, 20)),
    'min_samples_leaf': hp.choice('min_samples_leaf', range(1, 10)),
    'subsample': hp.uniform('subsample', 0.6, 1.0)
}

def objective(params):
    """Objective function to minimize."""

    clf = GradientBoostingClassifier(
        n_estimators=params['n_estimators'],
        max_depth=params['max_depth'],
        learning_rate=params['learning_rate'],
        min_samples_split=params['min_samples_split'],
        min_samples_leaf=params['min_samples_leaf'],
        subsample=params['subsample'],
        random_state=42
    )

    scores = cross_val_score(clf, X_train, y_train, cv=5, scoring='accuracy')

    return {
        'loss': -scores.mean(),  # Hyperopt minimizes
        'status': STATUS_OK,
        'std': scores.std()
    }

# Run optimization
trials = Trials()
best = fmin(
    fn=objective,
    space=space,
    algo=tpe.suggest,
    max_trials=100,
    trials=trials,
    verbose=True
)

print(f"Best parameters: {best}")

# Access trial history
for trial in trials.trials[:5]:
    print(f"Loss: {trial['result']['loss']:.4f}, Params: {trial['misc']['vals']}")
```

### Hyperopt Search Space Definitions

```python
from hyperopt import hp
import numpy as np

# Categorical choices
optimizer = hp.choice('optimizer', ['adam', 'sgd', 'rmsprop'])

# Uniform distribution
dropout = hp.uniform('dropout', 0.0, 0.5)

# Log-uniform distribution (for learning rates)
learning_rate = hp.loguniform('lr', np.log(1e-5), np.log(1e-1))

# Quantized uniform (step-wise)
batch_size = hp.quniform('batch_size', 16, 256, 16)

# Normal distribution
weight = hp.normal('weight', 0, 1)

# Log-normal distribution
scale = hp.lognormal('scale', 0, 1)

# Integer in range
n_layers = hp.randint('n_layers', 1, 10)

# Conditional spaces
space = hp.choice('model_type', [
    {
        'type': 'random_forest',
        'n_estimators': hp.choice('rf_n_estimators', range(50, 500, 50)),
        'max_depth': hp.choice('rf_max_depth', range(3, 20))
    },
    {
        'type': 'xgboost',
        'n_estimators': hp.choice('xgb_n_estimators', range(50, 500, 50)),
        'learning_rate': hp.loguniform('xgb_lr', np.log(0.01), np.log(0.3))
    }
])
```

### Hyperopt with MongoDB for Distributed Search

```python
from hyperopt import fmin, tpe, hp
from hyperopt.mongoexp import MongoTrials

# Connect to MongoDB for distributed optimization
trials = MongoTrials('mongo://localhost:27017/mydb/jobs', exp_key='experiment_1')

# Run workers in parallel (in separate terminals)
# hyperopt-mongo-worker --mongo=localhost:27017/mydb --poll-interval=0.1

best = fmin(
    fn=objective,
    space=space,
    algo=tpe.suggest,
    max_trials=100,
    trials=trials
)
```

### Early Stopping with Hyperopt

```python
from hyperopt import fmin, tpe, hp, STATUS_OK, STATUS_FAIL
from hyperopt.early_stop import no_progress_loss

def objective_with_early_stop(params):
    """Objective with early stopping capability."""

    model = build_model(params)

    best_val_loss = float('inf')
    patience = 10
    patience_counter = 0

    for epoch in range(100):
        train_loss = train_epoch(model)
        val_loss = validate(model)

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            patience_counter = 0
        else:
            patience_counter += 1

        if patience_counter >= patience:
            break  # Early stopping

    return {
        'loss': best_val_loss,
        'status': STATUS_OK,
        'epochs_trained': epoch + 1
    }

# Use early stopping in fmin
best = fmin(
    fn=objective_with_early_stop,
    space=space,
    algo=tpe.suggest,
    max_trials=100,
    early_stop_fn=no_progress_loss(50)  # Stop if no improvement in 50 trials
)
```

---

## Multi-Objective Optimization

Multi-objective optimization finds trade-offs between competing objectives, producing a Pareto front of optimal solutions.

### Optuna Multi-Objective Optimization

```python
import optuna

def multi_objective(trial):
    """Optimize for both accuracy and model size."""

    # Hyperparameters
    n_layers = trial.suggest_int('n_layers', 1, 5)
    hidden_size = trial.suggest_int('hidden_size', 32, 512)
    dropout = trial.suggest_float('dropout', 0.0, 0.5)
    lr = trial.suggest_float('lr', 1e-5, 1e-1, log=True)

    # Build and train model
    model = build_model(n_layers, hidden_size, dropout)
    train(model, lr)

    # Calculate objectives
    accuracy = evaluate_accuracy(model)
    num_params = sum(p.numel() for p in model.parameters())
    inference_time = measure_inference_time(model)

    return accuracy, num_params, inference_time

# Create multi-objective study
study = optuna.create_study(
    directions=['maximize', 'minimize', 'minimize'],  # accuracy, params, time
    sampler=optuna.samplers.NSGAIISampler()
)

study.optimize(multi_objective, n_trials=100)

# Get Pareto front
pareto_trials = study.best_trials
print(f"Number of Pareto optimal solutions: {len(pareto_trials)}")

for trial in pareto_trials:
    print(f"Values: {trial.values}, Params: {trial.params}")

# Visualize Pareto front
from optuna.visualization import plot_pareto_front
fig = plot_pareto_front(study, target_names=['Accuracy', 'Parameters', 'Inference Time'])
fig.show()
```

### Weighted Sum Approach

```python
def weighted_objective(trial):
    """Combine multiple objectives with weights."""

    # Model configuration
    config = {
        'n_layers': trial.suggest_int('n_layers', 1, 5),
        'hidden_size': trial.suggest_int('hidden_size', 32, 512),
        'lr': trial.suggest_float('lr', 1e-5, 1e-1, log=True)
    }

    model = build_and_train(config)

    # Calculate individual objectives
    accuracy = evaluate_accuracy(model)
    latency = measure_latency(model)
    memory = measure_memory(model)

    # Normalize objectives (0-1 scale)
    norm_accuracy = accuracy  # Already 0-1
    norm_latency = 1 - (latency - min_latency) / (max_latency - min_latency)
    norm_memory = 1 - (memory - min_memory) / (max_memory - min_memory)

    # Weighted sum
    weights = {'accuracy': 0.5, 'latency': 0.3, 'memory': 0.2}
    combined_score = (
        weights['accuracy'] * norm_accuracy +
        weights['latency'] * norm_latency +
        weights['memory'] * norm_memory
    )

    # Store individual metrics as user attributes
    trial.set_user_attr('accuracy', accuracy)
    trial.set_user_attr('latency', latency)
    trial.set_user_attr('memory', memory)

    return combined_score

study = optuna.create_study(direction='maximize')
study.optimize(weighted_objective, n_trials=100)
```

### Constraint Optimization

```python
def objective_with_constraints(trial):
    """Optimize with constraints on latency and memory."""

    config = {
        'n_layers': trial.suggest_int('n_layers', 1, 10),
        'hidden_size': trial.suggest_int('hidden_size', 64, 1024),
        'lr': trial.suggest_float('lr', 1e-5, 1e-1, log=True)
    }

    model = build_and_train(config)

    accuracy = evaluate_accuracy(model)
    latency = measure_latency(model)
    memory_mb = measure_memory_mb(model)

    # Define constraints
    latency_constraint = latency - 10.0  # Must be < 10ms
    memory_constraint = memory_mb - 100.0  # Must be < 100MB

    # Store constraints for analysis
    trial.set_user_attr('latency', latency)
    trial.set_user_attr('memory_mb', memory_mb)
    trial.set_user_attr('latency_constraint', latency_constraint)
    trial.set_user_attr('memory_constraint', memory_constraint)

    # Penalize constraint violations
    penalty = 0
    if latency_constraint > 0:
        penalty += latency_constraint * 0.1
    if memory_constraint > 0:
        penalty += memory_constraint * 0.01

    return accuracy - penalty

# Alternative: Use sampler with constraints (Optuna 3.0+)
from optuna.samplers import TPESampler

def constraints_func(trial):
    return [
        trial.user_attrs.get('latency_constraint', 0),
        trial.user_attrs.get('memory_constraint', 0)
    ]

sampler = TPESampler(constraints_func=constraints_func)
study = optuna.create_study(direction='maximize', sampler=sampler)
```

---

## ML Framework Integration

### Scikit-learn Integration

```python
import optuna
from sklearn.model_selection import cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC

def sklearn_objective(trial):
    """Optimize across different sklearn models."""

    classifier_name = trial.suggest_categorical(
        'classifier', ['RandomForest', 'GradientBoosting', 'SVM']
    )

    if classifier_name == 'RandomForest':
        params = {
            'n_estimators': trial.suggest_int('rf_n_estimators', 50, 500),
            'max_depth': trial.suggest_int('rf_max_depth', 3, 20),
            'min_samples_split': trial.suggest_int('rf_min_samples_split', 2, 20),
            'min_samples_leaf': trial.suggest_int('rf_min_samples_leaf', 1, 10)
        }
        clf = RandomForestClassifier(**params, random_state=42, n_jobs=-1)

    elif classifier_name == 'GradientBoosting':
        params = {
            'n_estimators': trial.suggest_int('gb_n_estimators', 50, 500),
            'learning_rate': trial.suggest_float('gb_lr', 0.01, 0.3, log=True),
            'max_depth': trial.suggest_int('gb_max_depth', 3, 10),
            'subsample': trial.suggest_float('gb_subsample', 0.6, 1.0)
        }
        clf = GradientBoostingClassifier(**params, random_state=42)

    else:  # SVM
        params = {
            'C': trial.suggest_float('svm_c', 1e-3, 1e3, log=True),
            'gamma': trial.suggest_float('svm_gamma', 1e-4, 1e1, log=True),
            'kernel': trial.suggest_categorical('svm_kernel', ['rbf', 'poly'])
        }
        clf = SVC(**params, random_state=42)

    scores = cross_val_score(clf, X_train, y_train, cv=5, scoring='accuracy')
    return scores.mean()

study = optuna.create_study(direction='maximize')
study.optimize(sklearn_objective, n_trials=100)
```

### XGBoost Integration

```python
import optuna
import xgboost as xgb
from sklearn.model_selection import cross_val_score

def xgboost_objective(trial):
    """Optimize XGBoost hyperparameters."""

    params = {
        'objective': 'binary:logistic',
        'booster': trial.suggest_categorical('booster', ['gbtree', 'dart']),
        'lambda': trial.suggest_float('lambda', 1e-8, 10.0, log=True),
        'alpha': trial.suggest_float('alpha', 1e-8, 10.0, log=True),
        'max_depth': trial.suggest_int('max_depth', 3, 15),
        'eta': trial.suggest_float('eta', 0.01, 0.3, log=True),
        'gamma': trial.suggest_float('gamma', 1e-8, 10.0, log=True),
        'grow_policy': trial.suggest_categorical('grow_policy', ['depthwise', 'lossguide']),
        'subsample': trial.suggest_float('subsample', 0.5, 1.0),
        'colsample_bytree': trial.suggest_float('colsample_bytree', 0.5, 1.0),
        'min_child_weight': trial.suggest_int('min_child_weight', 1, 10),
    }

    if params['booster'] == 'dart':
        params['sample_type'] = trial.suggest_categorical('sample_type', ['uniform', 'weighted'])
        params['normalize_type'] = trial.suggest_categorical('normalize_type', ['tree', 'forest'])
        params['rate_drop'] = trial.suggest_float('rate_drop', 0.0, 0.5)
        params['skip_drop'] = trial.suggest_float('skip_drop', 0.0, 0.5)

    # Use XGBoost's built-in CV with pruning
    pruning_callback = optuna.integration.XGBoostPruningCallback(trial, 'test-logloss')

    dtrain = xgb.DMatrix(X_train, label=y_train)

    cv_results = xgb.cv(
        params,
        dtrain,
        num_boost_round=1000,
        nfold=5,
        callbacks=[pruning_callback],
        early_stopping_rounds=50,
        verbose_eval=False
    )

    return cv_results['test-logloss-mean'].iloc[-1]

study = optuna.create_study(
    direction='minimize',
    pruner=optuna.pruners.MedianPruner()
)
study.optimize(xgboost_objective, n_trials=100)
```

### LightGBM Integration

```python
import optuna
import lightgbm as lgb

def lightgbm_objective(trial):
    """Optimize LightGBM hyperparameters."""

    params = {
        'objective': 'binary',
        'metric': 'binary_logloss',
        'verbosity': -1,
        'boosting_type': trial.suggest_categorical('boosting_type', ['gbdt', 'dart', 'goss']),
        'num_leaves': trial.suggest_int('num_leaves', 20, 300),
        'max_depth': trial.suggest_int('max_depth', 3, 15),
        'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
        'n_estimators': trial.suggest_int('n_estimators', 100, 1000),
        'min_child_samples': trial.suggest_int('min_child_samples', 5, 100),
        'subsample': trial.suggest_float('subsample', 0.5, 1.0),
        'colsample_bytree': trial.suggest_float('colsample_bytree', 0.5, 1.0),
        'reg_alpha': trial.suggest_float('reg_alpha', 1e-8, 10.0, log=True),
        'reg_lambda': trial.suggest_float('reg_lambda', 1e-8, 10.0, log=True),
    }

    if params['boosting_type'] == 'dart':
        params['drop_rate'] = trial.suggest_float('drop_rate', 0.0, 0.5)
        params['skip_drop'] = trial.suggest_float('skip_drop', 0.0, 0.5)

    if params['boosting_type'] == 'goss':
        params['top_rate'] = trial.suggest_float('top_rate', 0.1, 0.5)
        params['other_rate'] = trial.suggest_float('other_rate', 0.05, 0.2)

    # Pruning callback
    pruning_callback = optuna.integration.LightGBMPruningCallback(trial, 'binary_logloss')

    dtrain = lgb.Dataset(X_train, label=y_train)
    dval = lgb.Dataset(X_val, label=y_val, reference=dtrain)

    model = lgb.train(
        params,
        dtrain,
        valid_sets=[dval],
        callbacks=[pruning_callback, lgb.early_stopping(50)]
    )

    preds = model.predict(X_val)
    return log_loss(y_val, preds)

study = optuna.create_study(direction='minimize')
study.optimize(lightgbm_objective, n_trials=100)
```

### PyTorch Integration

```python
import optuna
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader

class Net(nn.Module):
    def __init__(self, trial):
        super().__init__()

        n_layers = trial.suggest_int('n_layers', 1, 5)
        layers = []

        in_features = 784
        for i in range(n_layers):
            out_features = trial.suggest_int(f'n_units_{i}', 32, 512)
            layers.append(nn.Linear(in_features, out_features))
            layers.append(nn.ReLU())

            dropout = trial.suggest_float(f'dropout_{i}', 0.0, 0.5)
            layers.append(nn.Dropout(dropout))

            in_features = out_features

        layers.append(nn.Linear(in_features, 10))
        self.model = nn.Sequential(*layers)

    def forward(self, x):
        return self.model(x.view(-1, 784))

def pytorch_objective(trial):
    """PyTorch model optimization with Optuna."""

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    # Model
    model = Net(trial).to(device)

    # Optimizer
    optimizer_name = trial.suggest_categorical('optimizer', ['Adam', 'SGD', 'AdamW'])
    lr = trial.suggest_float('lr', 1e-5, 1e-1, log=True)

    if optimizer_name == 'Adam':
        optimizer = optim.Adam(model.parameters(), lr=lr)
    elif optimizer_name == 'SGD':
        momentum = trial.suggest_float('momentum', 0.0, 0.99)
        optimizer = optim.SGD(model.parameters(), lr=lr, momentum=momentum)
    else:
        weight_decay = trial.suggest_float('weight_decay', 1e-5, 1e-2, log=True)
        optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=weight_decay)

    # Training
    criterion = nn.CrossEntropyLoss()

    for epoch in range(20):
        model.train()
        for batch_x, batch_y in train_loader:
            batch_x, batch_y = batch_x.to(device), batch_y.to(device)

            optimizer.zero_grad()
            output = model(batch_x)
            loss = criterion(output, batch_y)
            loss.backward()
            optimizer.step()

        # Validation
        model.eval()
        correct = 0
        total = 0
        with torch.no_grad():
            for batch_x, batch_y in val_loader:
                batch_x, batch_y = batch_x.to(device), batch_y.to(device)
                output = model(batch_x)
                _, predicted = torch.max(output.data, 1)
                total += batch_y.size(0)
                correct += (predicted == batch_y).sum().item()

        accuracy = correct / total

        # Report and pruning
        trial.report(accuracy, epoch)
        if trial.should_prune():
            raise optuna.TrialPruned()

    return accuracy

study = optuna.create_study(
    direction='maximize',
    pruner=optuna.pruners.MedianPruner()
)
study.optimize(pytorch_objective, n_trials=100, timeout=3600)
```

### TensorFlow/Keras Integration

```python
import optuna
import tensorflow as tf
from tensorflow import keras

def keras_objective(trial):
    """Keras model optimization with Optuna."""

    # Clear session
    keras.backend.clear_session()

    # Model architecture
    n_layers = trial.suggest_int('n_layers', 1, 4)
    model = keras.Sequential()
    model.add(keras.layers.Flatten(input_shape=(28, 28)))

    for i in range(n_layers):
        n_units = trial.suggest_int(f'n_units_{i}', 32, 512)
        model.add(keras.layers.Dense(n_units, activation='relu'))

        dropout = trial.suggest_float(f'dropout_{i}', 0.0, 0.5)
        model.add(keras.layers.Dropout(dropout))

    model.add(keras.layers.Dense(10, activation='softmax'))

    # Optimizer
    lr = trial.suggest_float('lr', 1e-5, 1e-1, log=True)
    optimizer = keras.optimizers.Adam(learning_rate=lr)

    model.compile(
        optimizer=optimizer,
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )

    # Callbacks for pruning
    callbacks = [
        optuna.integration.TFKerasPruningCallback(trial, 'val_accuracy'),
        keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True)
    ]

    # Training
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=50,
        batch_size=trial.suggest_categorical('batch_size', [32, 64, 128]),
        callbacks=callbacks,
        verbose=0
    )

    return max(history.history['val_accuracy'])

study = optuna.create_study(direction='maximize')
study.optimize(keras_objective, n_trials=50)
```

---

## Best Practices and Comparison

### Tool Comparison

| Feature | Optuna | Ray Tune | Hyperopt |
|---------|--------|----------|----------|
| Ease of use | Excellent | Good | Good |
| Distributed | Yes (with DB) | Excellent | Yes (MongoDB) |
| Visualization | Built-in | TensorBoard | Basic |
| Early stopping | Excellent | Excellent | Manual |
| Multi-objective | Native | Limited | No |
| Search algorithms | Many | Many | TPE, Random |
| Framework integration | Extensive | Extensive | Limited |
| Production ready | Yes | Yes | Yes |

### Best Practices

```python
# Start with a sensible baseline
baseline_params = {
    'lr': 1e-3,
    'batch_size': 64,
    'hidden_size': 256
}

# Use log scale for learning rates and regularization
lr = trial.suggest_float('lr', 1e-5, 1e-1, log=True)
weight_decay = trial.suggest_float('weight_decay', 1e-6, 1e-2, log=True)

# Set reasonable bounds based on domain knowledge
dropout = trial.suggest_float('dropout', 0.0, 0.5)  # Not 0-1

# Use pruning to save computation
study = optuna.create_study(
    pruner=optuna.pruners.MedianPruner(n_warmup_steps=10)
)

# Save studies for reproducibility
study = optuna.create_study(
    study_name='experiment_v1',
    storage='sqlite:///studies.db',
    load_if_exists=True
)

# Use appropriate number of trials
# Rule of thumb: 10-20 trials per hyperparameter
n_hyperparams = 5
n_trials = 100  # 20 * 5

# Set random seeds for reproducibility
sampler = optuna.samplers.TPESampler(seed=42)

# Monitor and analyze results
optuna.visualization.plot_optimization_history(study)
optuna.visualization.plot_param_importances(study)

# Use callbacks for custom behavior
def my_callback(study, trial):
    if study.best_trial.number == trial.number:
        print(f"New best trial: {trial.number}")
        save_model(trial.params)

study.optimize(objective, n_trials=100, callbacks=[my_callback])

# Handle failed trials gracefully
def robust_objective(trial):
    try:
        return train_and_evaluate(trial)
    except Exception as e:
        print(f"Trial failed: {e}")
        return float('inf')  # or raise optuna.TrialPruned()
```

### Choosing the Right Tool

```python
# Use Optuna when:
# - You need easy-to-use API with excellent documentation
# - Multi-objective optimization is required
# - You want built-in visualization
# - Working with single machine or small cluster

# Use Ray Tune when:
# - Large-scale distributed optimization is needed
# - You're already using Ray ecosystem
# - Population-based training is required
# - Complex resource allocation (multi-GPU) is needed

# Use Hyperopt when:
# - You need simple TPE optimization
# - Legacy codebase already uses it
# - MongoDB-based distribution is preferred
```

---

## Interview Questions

### Conceptual Questions

**Q1: What is the difference between hyperparameters and model parameters?**

Model parameters are learned from data during training (weights, biases), while hyperparameters are set before training and control the learning process (learning rate, architecture). Hyperparameters require a separate optimization process.

**Q2: Explain how TPE (Tree-structured Parzen Estimator) works.**

TPE is a Bayesian optimization algorithm that models P(theta|y) instead of P(y|theta). It maintains two distributions:
- l(theta): Distribution of hyperparameters that led to good results
- g(theta): Distribution of hyperparameters that led to poor results

It samples new points to maximize l(theta)/g(theta), which approximates the Expected Improvement.

**Q3: What is the advantage of pruning in hyperparameter optimization?**

Pruning allows early termination of unpromising trials, significantly reducing computation time. By monitoring intermediate results and comparing with historical trials, we can stop trials that are unlikely to improve upon the best known result.

**Q4: How does Population-Based Training differ from standard HPO?**

PBT combines hyperparameter optimization with training:
- Multiple models train in parallel (population)
- Periodically, poorly performing models copy weights from better ones
- Hyperparameters are perturbed during training
- Results in adaptive hyperparameters that change during training

**Q5: When would you use multi-objective optimization?**

Use multi-objective optimization when:
- Optimizing conflicting objectives (accuracy vs. inference time)
- Need to understand trade-offs between objectives
- Want to present multiple Pareto-optimal solutions
- Different stakeholders have different priorities

### Practical Questions

**Q6: Design a hyperparameter search strategy for a new deep learning project.**

```python
# Step 1: Define search space based on model architecture
# Step 2: Start with random search to understand landscape
# Step 3: Use TPE/Bayesian optimization for fine-tuning
# Step 4: Apply pruning for efficiency
# Step 5: Consider multi-fidelity methods (Hyperband)

def strategy(trial):
    # Phase 1: Coarse search with pruning
    if study.n_trials < 50:
        # Wider search bounds
        lr = trial.suggest_float('lr', 1e-6, 1e-1, log=True)
    else:
        # Narrow based on best results
        best_lr = study.best_params['lr']
        lr = trial.suggest_float('lr', best_lr/10, best_lr*10, log=True)

    return train_and_evaluate(lr)
```

**Q7: How do you handle conditional hyperparameters?**

```python
def conditional_objective(trial):
    # Conditional on model type
    model_type = trial.suggest_categorical('model', ['cnn', 'rnn', 'transformer'])

    if model_type == 'cnn':
        kernel_size = trial.suggest_int('kernel_size', 3, 7, step=2)
        n_filters = trial.suggest_int('n_filters', 32, 256)
    elif model_type == 'rnn':
        hidden_size = trial.suggest_int('hidden_size', 64, 512)
        n_layers = trial.suggest_int('n_layers', 1, 4)
    else:  # transformer
        n_heads = trial.suggest_int('n_heads', 2, 16)
        d_model = trial.suggest_int('d_model', 128, 512, step=64)

    # Conditional on optimizer
    optimizer = trial.suggest_categorical('optimizer', ['adam', 'sgd'])
    if optimizer == 'sgd':
        momentum = trial.suggest_float('momentum', 0.0, 0.99)
```

**Q8: How do you ensure reproducibility in HPO experiments?**

```python
import random
import numpy as np
import torch
import optuna

def set_seed(seed=42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True

# Use seeded sampler
sampler = optuna.samplers.TPESampler(seed=42)

# Store study in database
study = optuna.create_study(
    storage='sqlite:///study.db',
    sampler=sampler
)

# Log all trial details
def objective(trial):
    set_seed(42 + trial.number)
    # ... training code
    trial.set_user_attr('git_hash', get_git_hash())
    trial.set_user_attr('timestamp', datetime.now().isoformat())
```

---

## Summary

Hyperparameter optimization is essential for achieving optimal model performance. Key takeaways:

1. **Choose the right tool**: Optuna for ease of use, Ray Tune for distributed computing, Hyperopt for simplicity
2. **Use intelligent search**: TPE and Bayesian methods outperform grid/random search
3. **Apply pruning**: Save computation by terminating unpromising trials early
4. **Consider multi-objective**: Real-world problems often have multiple competing objectives
5. **Integrate with frameworks**: Use built-in integrations for seamless optimization
6. **Follow best practices**: Log scale for rates, reasonable bounds, reproducibility

Mastering these tools will significantly improve your ML workflow efficiency and model performance.

## Further Reading

### Documentation
- [Optuna Documentation](https://optuna.readthedocs.io/)
- [Ray Tune Documentation](https://docs.ray.io/en/latest/tune/)
- [Hyperopt Documentation](https://hyperopt.github.io/hyperopt/)

### Papers
- "Optuna: A Next-generation Hyperparameter Optimization Framework" (Akiba et al., 2019)
- "Algorithms for Hyper-Parameter Optimization" (Bergstra et al., 2011)
- "Hyperband: A Novel Bandit-Based Approach to Hyperparameter Optimization" (Li et al., 2017)

### Advanced Topics
- Neural Architecture Search (NAS)
- Meta-learning for HPO
- Transfer learning for HPO
- AutoML systems (Auto-sklearn, AutoGluon)
