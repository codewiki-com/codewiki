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
origin: old/src/content/docs/datascience/optuna-hyperopt.zh.md
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

超参数优化（HPO）是机器学习流程中的关键组成部分，可以显著影响模型性能。与训练过程中学习的模型参数不同，超参数是在训练开始前设置的，用于控制学习率、模型架构和正则化强度等方面。本指南涵盖了自动化超参数搜索的最强大工具：Optuna、Ray Tune 和 Hyperopt。

---

## 超参数优化问题

### 什么是超参数？

超参数是控制学习过程和模型架构的配置设置。与模型参数（权重和偏置）不同，超参数不是从数据中学习的。

**常见的超参数类型：**

| 类别 | 示例 | 典型范围 |
|----------|----------|---------------|
| 学习 | 学习率、批量大小、训练轮数 | 1e-5 到 1e-1、16-512、10-1000 |
| 架构 | 层数、隐藏单元数、卷积核大小 | 1-100、32-2048、3-7 |
| 正则化 | Dropout 率、L1/L2 惩罚、权重衰减 | 0-0.5、1e-6 到 1e-2 |
| 优化器 | 动量、beta 值、epsilon | 0.9-0.99、(0.9, 0.999) |

### 为什么手动调参不够好

```python
# 朴素方法：网格搜索
from sklearn.model_selection import GridSearchCV
from sklearn.ensemble import RandomForestClassifier

param_grid = {
    'n_estimators': [50, 100, 200, 500],
    'max_depth': [5, 10, 20, None],
    'min_samples_split': [2, 5, 10],
    'min_samples_leaf': [1, 2, 4]
}

# 这会产生 4 * 4 * 3 * 3 = 144 种组合！
# 每种组合都需要完整的模型训练
grid_search = GridSearchCV(
    RandomForestClassifier(random_state=42),
    param_grid,
    cv=5,
    scoring='accuracy',
    n_jobs=-1
)
```

**网格搜索的问题：**

- **指数级复杂度**：添加一个超参数会使搜索空间翻倍
- **浪费性探索**：在有希望和没希望的区域花费相同的时间
- **固定粒度**：可能会错过网格点之间的最优值

### 搜索空间挑战

超参数优化问题可以形式化为：在搜索空间中找到最小化目标函数的最优配置。

**搜索空间类型：**

```python
# 类别型：离散选择
optimizer_type = ['adam', 'sgd', 'adamw']

# 整数型：离散数字
num_layers = range(1, 10)

# 连续型：实数
learning_rate = (1e-5, 1e-1)  # 通常使用对数尺度

# 条件型：取决于其他选择
if optimizer_type == 'sgd':
    momentum = (0.0, 0.99)
```

---

## Optuna：现代超参数优化

Optuna 是新一代超参数优化框架，强调易用性、灵活性和效率。

### 安装和基本用法

```bash
pip install optuna optuna-dashboard
```

```python
import optuna
from sklearn.datasets import load_iris
from sklearn.model_selection import cross_val_score
from sklearn.ensemble import RandomForestClassifier

def objective(trial):
    """定义要优化的目标函数。"""

    # 建议超参数
    n_estimators = trial.suggest_int('n_estimators', 50, 500)
    max_depth = trial.suggest_int('max_depth', 3, 20)
    min_samples_split = trial.suggest_int('min_samples_split', 2, 20)
    min_samples_leaf = trial.suggest_int('min_samples_leaf', 1, 10)

    # 使用建议的超参数创建模型
    clf = RandomForestClassifier(
        n_estimators=n_estimators,
        max_depth=max_depth,
        min_samples_split=min_samples_split,
        min_samples_leaf=min_samples_leaf,
        random_state=42,
        n_jobs=-1
    )

    # 加载数据并评估
    iris = load_iris()
    scores = cross_val_score(clf, iris.data, iris.target, cv=5, scoring='accuracy')

    return scores.mean()

# 创建研究并优化
study = optuna.create_study(direction='maximize')
study.optimize(objective, n_trials=100, show_progress_bar=True)

# 结果
print(f"最佳试验: {study.best_trial.number}")
print(f"最佳值: {study.best_value:.4f}")
print(f"最佳参数: {study.best_params}")
```

### Suggest 方法：定义搜索空间

```python
def comprehensive_objective(trial):
    """演示所有 suggest 方法。"""

    # 整数参数
    n_layers = trial.suggest_int('n_layers', 1, 5)

    # 浮点参数（线性尺度）
    dropout = trial.suggest_float('dropout', 0.0, 0.5)

    # 浮点参数（对数尺度 - 用于学习率）
    lr = trial.suggest_float('lr', 1e-5, 1e-1, log=True)

    # 类别参数
    optimizer = trial.suggest_categorical('optimizer', ['adam', 'sgd', 'adamw'])
    activation = trial.suggest_categorical('activation', ['relu', 'gelu', 'silu'])

    # 条件参数
    if optimizer == 'sgd':
        momentum = trial.suggest_float('momentum', 0.0, 0.99)
    else:
        momentum = None

    # 步进式浮点（离散浮点值）
    weight_decay = trial.suggest_float('weight_decay', 0.0, 0.1, step=0.01)

    # 基于建议构建模型
    hidden_sizes = []
    for i in range(n_layers):
        hidden_sizes.append(trial.suggest_int(f'hidden_size_{i}', 32, 512))

    # ... 训练和评估模型
    return validation_accuracy
```

### 研究存储和持久化

```python
import optuna

# SQLite 存储用于持久化
study = optuna.create_study(
    study_name='my_experiment',
    storage='sqlite:///optuna_study.db',
    direction='maximize',
    load_if_exists=True  # 恢复之前的研究
)

# PostgreSQL 用于分布式优化
study = optuna.create_study(
    study_name='distributed_experiment',
    storage='postgresql://user:password@localhost/optuna',
    direction='maximize',
    load_if_exists=True
)

# 运行优化（可以从多个进程执行）
study.optimize(objective, n_trials=100)
```

### 可视化工具

```python
import optuna
from optuna.visualization import (
    plot_optimization_history,
    plot_param_importances,
    plot_parallel_coordinate,
    plot_contour,
    plot_slice
)

# 优化后，可视化结果
fig1 = plot_optimization_history(study)
fig1.show()

# 参数重要性
fig2 = plot_param_importances(study)
fig2.show()

# 平行坐标图
fig3 = plot_parallel_coordinate(study)
fig3.show()

# 两个参数的等高线图
fig4 = plot_contour(study, params=['lr', 'dropout'])
fig4.show()

# 每个参数的切片图
fig5 = plot_slice(study)
fig5.show()
```

### Optuna 仪表板

```bash
# 启动仪表板
optuna-dashboard sqlite:///optuna_study.db

# 访问 http://localhost:8080
```

---

## TPE 采样器：理解算法

树形 Parzen 估计器（TPE）是 Optuna 的默认采样算法。它是一种高效建模搜索空间的贝叶斯优化方法。

### TPE 的工作原理

与传统的贝叶斯优化建模 P(y|theta) 不同，TPE 通过维护两个分布来建模 P(theta|y)：

- **l(theta)**：导致良好结果的超参数分布
- **g(theta)**：导致较差结果的超参数分布
- **y***：阈值（通常是前 20% 的观察值）

期望改进与 l(theta)/g(theta) 成正比。

```python
import optuna
from optuna.samplers import TPESampler

# 配置 TPE 采样器
sampler = TPESampler(
    n_startup_trials=10,     # TPE 启动前的随机试验次数
    n_ei_candidates=24,      # EI 计算的候选数量
    seed=42
)

study = optuna.create_study(
    direction='minimize',
    sampler=sampler
)

study.optimize(objective, n_trials=100)
```

### 替代采样器

```python
from optuna.samplers import (
    TPESampler,
    CmaEsSampler,
    RandomSampler,
    GridSampler,
    NSGAIISampler
)

# CMA-ES：适用于连续空间
cma_sampler = CmaEsSampler(
    n_startup_trials=10,
    seed=42
)

# 随机采样器：作为比较基准
random_sampler = RandomSampler(seed=42)

# 网格采样器：用于穷举搜索
grid_sampler = GridSampler({
    'lr': [1e-4, 1e-3, 1e-2],
    'dropout': [0.1, 0.2, 0.3]
})

# NSGA-II：用于多目标优化
nsga_sampler = NSGAIISampler(seed=42)

# 为不同参数类型使用不同采样器
from optuna.samplers import PartialFixedSampler

# 固定某些参数同时优化其他参数
partial_sampler = PartialFixedSampler(
    fixed_params={'lr': 1e-3},
    base_sampler=TPESampler()
)
```

---

## 剪枝策略

剪枝允许提前终止没有希望的试验，显著减少计算时间。

### 内置剪枝器

```python
import optuna
from optuna.pruners import (
    MedianPruner,
    PercentilePruner,
    SuccessiveHalvingPruner,
    HyperbandPruner,
    ThresholdPruner
)

# 中位数剪枝器：如果低于之前试验的中位数则剪枝
median_pruner = MedianPruner(
    n_startup_trials=5,      # 剪枝开始前的试验次数
    n_warmup_steps=10,       # 每个试验中剪枝前的步数
    interval_steps=1         # 每 N 步检查剪枝
)

# 百分位剪枝器：更激进的剪枝
percentile_pruner = PercentilePruner(
    percentile=25.0,         # 剪枝底部 75%
    n_startup_trials=5,
    n_warmup_steps=10
)

# 逐次减半：高效的资源分配
sha_pruner = SuccessiveHalvingPruner(
    min_resource=1,
    reduction_factor=3,
    min_early_stopping_rate=0
)

# Hyperband：最先进的剪枝
hyperband_pruner = HyperbandPruner(
    min_resource=1,
    max_resource=100,
    reduction_factor=3
)

# 阈值剪枝器：简单的基于阈值的剪枝
threshold_pruner = ThresholdPruner(
    upper=0.9,  # 如果验证损失 > 0.9 则剪枝
    n_warmup_steps=5
)
```

### 在目标函数中实现剪枝

```python
import optuna
import torch
import torch.nn as nn
from torch.utils.data import DataLoader

def objective_with_pruning(trial):
    """带有中间值报告的目标函数，用于剪枝。"""

    # 建议超参数
    lr = trial.suggest_float('lr', 1e-5, 1e-1, log=True)
    n_layers = trial.suggest_int('n_layers', 1, 5)
    hidden_size = trial.suggest_int('hidden_size', 32, 256)
    dropout = trial.suggest_float('dropout', 0.0, 0.5)

    # 构建模型
    model = build_model(n_layers, hidden_size, dropout)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    criterion = nn.CrossEntropyLoss()

    # 带剪枝的训练循环
    n_epochs = 100
    for epoch in range(n_epochs):
        # 训练
        model.train()
        for batch in train_loader:
            optimizer.zero_grad()
            loss = criterion(model(batch['x']), batch['y'])
            loss.backward()
            optimizer.step()

        # 验证
        model.eval()
        val_accuracy = evaluate(model, val_loader)

        # 报告中间值用于剪枝
        trial.report(val_accuracy, epoch)

        # 检查试验是否应该被剪枝
        if trial.should_prune():
            raise optuna.TrialPruned()

    return val_accuracy

# 创建带剪枝器的研究
study = optuna.create_study(
    direction='maximize',
    pruner=optuna.pruners.HyperbandPruner(
        min_resource=1,
        max_resource=100,
        reduction_factor=3
    )
)

study.optimize(objective_with_pruning, n_trials=100)

# 检查被剪枝的试验
n_pruned = len([t for t in study.trials if t.state == optuna.trial.TrialState.PRUNED])
print(f"被剪枝的试验: {n_pruned}/{len(study.trials)}")
```

### PyTorch Lightning 集成与剪枝

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

    # 剪枝回调
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

## Ray Tune：分布式超参数调优

Ray Tune 是一个基于 Ray 构建的可扩展超参数调优库，专为分布式计算环境设计。

### 安装和设置

```bash
pip install "ray[tune]" hyperopt bayesian-optimization
```

### Ray Tune 基本用法

```python
from ray import tune
from ray.tune import CLIReporter
from ray.tune.schedulers import ASHAScheduler
import torch
import torch.nn as nn

def train_model(config):
    """Ray Tune 的训练函数。"""

    # 使用配置构建模型
    model = nn.Sequential(
        nn.Linear(784, config['hidden_size']),
        nn.ReLU(),
        nn.Dropout(config['dropout']),
        nn.Linear(config['hidden_size'], 10)
    )

    optimizer = torch.optim.Adam(model.parameters(), lr=config['lr'])
    criterion = nn.CrossEntropyLoss()

    for epoch in range(100):
        # 训练循环
        train_loss = 0
        for batch in train_loader:
            optimizer.zero_grad()
            loss = criterion(model(batch[0]), batch[1])
            loss.backward()
            optimizer.step()
            train_loss += loss.item()

        # 验证
        val_loss, val_acc = evaluate(model, val_loader)

        # 向 Ray Tune 报告指标
        tune.report(
            loss=val_loss,
            accuracy=val_acc,
            epoch=epoch
        )

# 定义搜索空间
config = {
    'lr': tune.loguniform(1e-5, 1e-1),
    'hidden_size': tune.choice([64, 128, 256, 512]),
    'dropout': tune.uniform(0.0, 0.5),
    'batch_size': tune.choice([32, 64, 128])
}

# ASHA 调度器用于早停
scheduler = ASHAScheduler(
    metric='loss',
    mode='min',
    max_t=100,
    grace_period=10,
    reduction_factor=3
)

# 进度报告器
reporter = CLIReporter(
    metric_columns=['loss', 'accuracy', 'training_iteration']
)

# 运行调优
analysis = tune.run(
    train_model,
    config=config,
    num_samples=50,
    scheduler=scheduler,
    progress_reporter=reporter,
    resources_per_trial={'cpu': 2, 'gpu': 0.5},
    local_dir='./ray_results'
)

# 获取最佳配置
best_config = analysis.get_best_config(metric='loss', mode='min')
print(f"最佳配置: {best_config}")

# 获取最佳结果
best_result = analysis.get_best_trial(metric='loss', mode='min')
print(f"最佳损失: {best_result.last_result['loss']}")
```

### 高级搜索算法

```python
from ray import tune
from ray.tune.search.optuna import OptunaSearch
from ray.tune.search.hyperopt import HyperOptSearch
from ray.tune.search.bayesopt import BayesOptSearch
from ray.tune.search import ConcurrencyLimiter

# Optuna 集成
optuna_search = OptunaSearch(
    metric='loss',
    mode='min'
)

# Hyperopt 集成
hyperopt_search = HyperOptSearch(
    metric='loss',
    mode='min',
    n_initial_points=10
)

# 贝叶斯优化
bayesopt_search = BayesOptSearch(
    metric='loss',
    mode='min'
)

# 限制并发试验
search_alg = ConcurrencyLimiter(optuna_search, max_concurrent=4)

analysis = tune.run(
    train_model,
    config=config,
    search_alg=search_alg,
    num_samples=100,
    scheduler=scheduler
)
```

### 基于种群的训练（PBT）

```python
from ray.tune.schedulers import PopulationBasedTraining
import random

# 定义扰动函数
pbt_scheduler = PopulationBasedTraining(
    time_attr='training_iteration',
    perturbation_interval=5,
    hyperparam_mutations={
        'lr': tune.loguniform(1e-5, 1e-1),
        'dropout': tune.uniform(0.0, 0.5),
    },
    quantile_fraction=0.25,  # 底部 25% 利用顶部 25%
    resample_probability=0.25,
    custom_explore_fn=None
)

def train_pbt(config, checkpoint_dir=None):
    """PBT 的带检查点训练函数。"""

    model = build_model(config)
    optimizer = torch.optim.Adam(model.parameters(), lr=config['lr'])

    # 如果可用，加载检查点
    start_epoch = 0
    if checkpoint_dir:
        checkpoint = torch.load(os.path.join(checkpoint_dir, 'checkpoint.pt'))
        model.load_state_dict(checkpoint['model'])
        optimizer.load_state_dict(checkpoint['optimizer'])
        start_epoch = checkpoint['epoch']

    for epoch in range(start_epoch, 100):
        train_loss = train_epoch(model, optimizer, train_loader)
        val_loss, val_acc = evaluate(model, val_loader)

        # 保存检查点
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

### Ray 分布式训练

```python
from ray import tune
from ray.tune.integration.pytorch_lightning import TuneReportCallback
import pytorch_lightning as pl

def train_distributed(config):
    """使用 Ray 和 PyTorch Lightning 进行分布式训练。"""

    model = LitModel(config)

    trainer = pl.Trainer(
        max_epochs=config['epochs'],
        accelerator='auto',
        devices='auto',
        strategy='ddp',  # 分布式数据并行
        callbacks=[
            TuneReportCallback(
                metrics={'loss': 'val_loss', 'accuracy': 'val_accuracy'},
                on='validation_end'
            )
        ]
    )

    trainer.fit(model, train_loader, val_loader)

# 每个试验使用多个 GPU 运行
analysis = tune.run(
    train_distributed,
    config=config,
    num_samples=20,
    resources_per_trial={
        'cpu': 8,
        'gpu': 2  # 每个试验使用 2 个 GPU
    }
)
```

---

## Hyperopt：贝叶斯优化

Hyperopt 是最早使用 TPE 算法进行超参数优化的 Python 库之一。

### Hyperopt 基本用法

```bash
pip install hyperopt
```

```python
from hyperopt import fmin, tpe, hp, STATUS_OK, Trials
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import cross_val_score
import numpy as np

# 定义搜索空间
space = {
    'n_estimators': hp.choice('n_estimators', range(50, 500, 50)),
    'max_depth': hp.choice('max_depth', range(3, 15)),
    'learning_rate': hp.loguniform('learning_rate', np.log(0.01), np.log(0.3)),
    'min_samples_split': hp.choice('min_samples_split', range(2, 20)),
    'min_samples_leaf': hp.choice('min_samples_leaf', range(1, 10)),
    'subsample': hp.uniform('subsample', 0.6, 1.0)
}

def objective(params):
    """要最小化的目标函数。"""

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
        'loss': -scores.mean(),  # Hyperopt 进行最小化
        'status': STATUS_OK,
        'std': scores.std()
    }

# 运行优化
trials = Trials()
best = fmin(
    fn=objective,
    space=space,
    algo=tpe.suggest,
    max_trials=100,
    trials=trials,
    verbose=True
)

print(f"最佳参数: {best}")

# 访问试验历史
for trial in trials.trials[:5]:
    print(f"损失: {trial['result']['loss']:.4f}, 参数: {trial['misc']['vals']}")
```

### Hyperopt 搜索空间定义

```python
from hyperopt import hp
import numpy as np

# 类别选择
optimizer = hp.choice('optimizer', ['adam', 'sgd', 'rmsprop'])

# 均匀分布
dropout = hp.uniform('dropout', 0.0, 0.5)

# 对数均匀分布（用于学习率）
learning_rate = hp.loguniform('lr', np.log(1e-5), np.log(1e-1))

# 量化均匀（步进式）
batch_size = hp.quniform('batch_size', 16, 256, 16)

# 正态分布
weight = hp.normal('weight', 0, 1)

# 对数正态分布
scale = hp.lognormal('scale', 0, 1)

# 范围内的整数
n_layers = hp.randint('n_layers', 1, 10)

# 条件空间
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

### 使用 MongoDB 进行分布式搜索的 Hyperopt

```python
from hyperopt import fmin, tpe, hp
from hyperopt.mongoexp import MongoTrials

# 连接到 MongoDB 进行分布式优化
trials = MongoTrials('mongo://localhost:27017/mydb/jobs', exp_key='experiment_1')

# 并行运行工作进程（在单独的终端中）
# hyperopt-mongo-worker --mongo=localhost:27017/mydb --poll-interval=0.1

best = fmin(
    fn=objective,
    space=space,
    algo=tpe.suggest,
    max_trials=100,
    trials=trials
)
```

### Hyperopt 早停

```python
from hyperopt import fmin, tpe, hp, STATUS_OK, STATUS_FAIL
from hyperopt.early_stop import no_progress_loss

def objective_with_early_stop(params):
    """带早停功能的目标函数。"""

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
            break  # 早停

    return {
        'loss': best_val_loss,
        'status': STATUS_OK,
        'epochs_trained': epoch + 1
    }

# 在 fmin 中使用早停
best = fmin(
    fn=objective_with_early_stop,
    space=space,
    algo=tpe.suggest,
    max_trials=100,
    early_stop_fn=no_progress_loss(50)  # 如果 50 次试验没有改进则停止
)
```

---

## 多目标优化

多目标优化在竞争目标之间寻找权衡，产生最优解的帕累托前沿。

### Optuna 多目标优化

```python
import optuna

def multi_objective(trial):
    """同时优化准确率和模型大小。"""

    # 超参数
    n_layers = trial.suggest_int('n_layers', 1, 5)
    hidden_size = trial.suggest_int('hidden_size', 32, 512)
    dropout = trial.suggest_float('dropout', 0.0, 0.5)
    lr = trial.suggest_float('lr', 1e-5, 1e-1, log=True)

    # 构建和训练模型
    model = build_model(n_layers, hidden_size, dropout)
    train(model, lr)

    # 计算目标
    accuracy = evaluate_accuracy(model)
    num_params = sum(p.numel() for p in model.parameters())
    inference_time = measure_inference_time(model)

    return accuracy, num_params, inference_time

# 创建多目标研究
study = optuna.create_study(
    directions=['maximize', 'minimize', 'minimize'],  # 准确率、参数数、时间
    sampler=optuna.samplers.NSGAIISampler()
)

study.optimize(multi_objective, n_trials=100)

# 获取帕累托前沿
pareto_trials = study.best_trials
print(f"帕累托最优解数量: {len(pareto_trials)}")

for trial in pareto_trials:
    print(f"值: {trial.values}, 参数: {trial.params}")

# 可视化帕累托前沿
from optuna.visualization import plot_pareto_front
fig = plot_pareto_front(study, target_names=['准确率', '参数数', '推理时间'])
fig.show()
```

### 加权和方法

```python
def weighted_objective(trial):
    """使用权重组合多个目标。"""

    # 模型配置
    config = {
        'n_layers': trial.suggest_int('n_layers', 1, 5),
        'hidden_size': trial.suggest_int('hidden_size', 32, 512),
        'lr': trial.suggest_float('lr', 1e-5, 1e-1, log=True)
    }

    model = build_and_train(config)

    # 计算各个目标
    accuracy = evaluate_accuracy(model)
    latency = measure_latency(model)
    memory = measure_memory(model)

    # 归一化目标（0-1 尺度）
    norm_accuracy = accuracy  # 已经是 0-1
    norm_latency = 1 - (latency - min_latency) / (max_latency - min_latency)
    norm_memory = 1 - (memory - min_memory) / (max_memory - min_memory)

    # 加权和
    weights = {'accuracy': 0.5, 'latency': 0.3, 'memory': 0.2}
    combined_score = (
        weights['accuracy'] * norm_accuracy +
        weights['latency'] * norm_latency +
        weights['memory'] * norm_memory
    )

    # 将各个指标存储为用户属性
    trial.set_user_attr('accuracy', accuracy)
    trial.set_user_attr('latency', latency)
    trial.set_user_attr('memory', memory)

    return combined_score

study = optuna.create_study(direction='maximize')
study.optimize(weighted_objective, n_trials=100)
```

### 约束优化

```python
def objective_with_constraints(trial):
    """带延迟和内存约束的优化。"""

    config = {
        'n_layers': trial.suggest_int('n_layers', 1, 10),
        'hidden_size': trial.suggest_int('hidden_size', 64, 1024),
        'lr': trial.suggest_float('lr', 1e-5, 1e-1, log=True)
    }

    model = build_and_train(config)

    accuracy = evaluate_accuracy(model)
    latency = measure_latency(model)
    memory_mb = measure_memory_mb(model)

    # 定义约束
    latency_constraint = latency - 10.0  # 必须 < 10ms
    memory_constraint = memory_mb - 100.0  # 必须 < 100MB

    # 存储约束用于分析
    trial.set_user_attr('latency', latency)
    trial.set_user_attr('memory_mb', memory_mb)
    trial.set_user_attr('latency_constraint', latency_constraint)
    trial.set_user_attr('memory_constraint', memory_constraint)

    # 惩罚约束违反
    penalty = 0
    if latency_constraint > 0:
        penalty += latency_constraint * 0.1
    if memory_constraint > 0:
        penalty += memory_constraint * 0.01

    return accuracy - penalty

# 替代方案：使用带约束的采样器（Optuna 3.0+）
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

## 机器学习框架集成

### Scikit-learn 集成

```python
import optuna
from sklearn.model_selection import cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC

def sklearn_objective(trial):
    """跨不同 sklearn 模型进行优化。"""

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

### XGBoost 集成

```python
import optuna
import xgboost as xgb
from sklearn.model_selection import cross_val_score

def xgboost_objective(trial):
    """优化 XGBoost 超参数。"""

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

    # 使用 XGBoost 内置的带剪枝的 CV
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

### LightGBM 集成

```python
import optuna
import lightgbm as lgb

def lightgbm_objective(trial):
    """优化 LightGBM 超参数。"""

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

    # 剪枝回调
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

### PyTorch 集成

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
    """使用 Optuna 优化 PyTorch 模型。"""

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    # 模型
    model = Net(trial).to(device)

    # 优化器
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

    # 训练
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

        # 验证
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

        # 报告和剪枝
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

### TensorFlow/Keras 集成

```python
import optuna
import tensorflow as tf
from tensorflow import keras

def keras_objective(trial):
    """使用 Optuna 优化 Keras 模型。"""

    # 清除会话
    keras.backend.clear_session()

    # 模型架构
    n_layers = trial.suggest_int('n_layers', 1, 4)
    model = keras.Sequential()
    model.add(keras.layers.Flatten(input_shape=(28, 28)))

    for i in range(n_layers):
        n_units = trial.suggest_int(f'n_units_{i}', 32, 512)
        model.add(keras.layers.Dense(n_units, activation='relu'))

        dropout = trial.suggest_float(f'dropout_{i}', 0.0, 0.5)
        model.add(keras.layers.Dropout(dropout))

    model.add(keras.layers.Dense(10, activation='softmax'))

    # 优化器
    lr = trial.suggest_float('lr', 1e-5, 1e-1, log=True)
    optimizer = keras.optimizers.Adam(learning_rate=lr)

    model.compile(
        optimizer=optimizer,
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )

    # 剪枝回调
    callbacks = [
        optuna.integration.TFKerasPruningCallback(trial, 'val_accuracy'),
        keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True)
    ]

    # 训练
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

## 最佳实践与对比

### 工具对比

| 特性 | Optuna | Ray Tune | Hyperopt |
|---------|--------|----------|----------|
| 易用性 | 优秀 | 良好 | 良好 |
| 分布式 | 是（需数据库） | 优秀 | 是（MongoDB） |
| 可视化 | 内置 | TensorBoard | 基础 |
| 早停 | 优秀 | 优秀 | 手动 |
| 多目标 | 原生支持 | 有限 | 否 |
| 搜索算法 | 多种 | 多种 | TPE、随机 |
| 框架集成 | 广泛 | 广泛 | 有限 |
| 生产就绪 | 是 | 是 | 是 |

### 最佳实践

```python
# 从合理的基线开始
baseline_params = {
    'lr': 1e-3,
    'batch_size': 64,
    'hidden_size': 256
}

# 对学习率和正则化使用对数尺度
lr = trial.suggest_float('lr', 1e-5, 1e-1, log=True)
weight_decay = trial.suggest_float('weight_decay', 1e-6, 1e-2, log=True)

# 基于领域知识设置合理的边界
dropout = trial.suggest_float('dropout', 0.0, 0.5)  # 不是 0-1

# 使用剪枝节省计算
study = optuna.create_study(
    pruner=optuna.pruners.MedianPruner(n_warmup_steps=10)
)

# 保存研究以便复现
study = optuna.create_study(
    study_name='experiment_v1',
    storage='sqlite:///studies.db',
    load_if_exists=True
)

# 使用适当数量的试验
# 经验法则：每个超参数 10-20 次试验
n_hyperparams = 5
n_trials = 100  # 20 * 5

# 设置随机种子以便复现
sampler = optuna.samplers.TPESampler(seed=42)

# 监控和分析结果
optuna.visualization.plot_optimization_history(study)
optuna.visualization.plot_param_importances(study)

# 使用回调实现自定义行为
def my_callback(study, trial):
    if study.best_trial.number == trial.number:
        print(f"新的最佳试验: {trial.number}")
        save_model(trial.params)

study.optimize(objective, n_trials=100, callbacks=[my_callback])

# 优雅地处理失败的试验
def robust_objective(trial):
    try:
        return train_and_evaluate(trial)
    except Exception as e:
        print(f"试验失败: {e}")
        return float('inf')  # 或者 raise optuna.TrialPruned()
```

### 选择正确的工具

```python
# 使用 Optuna 的场景：
# - 你需要易用的 API 和优秀的文档
# - 需要多目标优化
# - 你想要内置的可视化
# - 在单机或小型集群上工作

# 使用 Ray Tune 的场景：
# - 需要大规模分布式优化
# - 你已经在使用 Ray 生态系统
# - 需要基于种群的训练
# - 需要复杂的资源分配（多 GPU）

# 使用 Hyperopt 的场景：
# - 你需要简单的 TPE 优化
# - 遗留代码库已经在使用它
# - 偏好基于 MongoDB 的分布式
```

---

## 面试问题

### 概念性问题

**问题1：超参数和模型参数有什么区别？**

模型参数是在训练过程中从数据中学习的（权重、偏置），而超参数是在训练前设置的，用于控制学习过程（学习率、架构）。超参数需要单独的优化过程。

**问题2：解释 TPE（树形 Parzen 估计器）的工作原理。**

TPE 是一种贝叶斯优化算法，它建模 P(theta|y) 而不是 P(y|theta)。它维护两个分布：
- l(theta)：导致良好结果的超参数分布
- g(theta)：导致较差结果的超参数分布

它采样新点以最大化 l(theta)/g(theta)，这近似于期望改进。

**问题3：超参数优化中剪枝的优势是什么？**

剪枝允许提前终止没有希望的试验，显著减少计算时间。通过监控中间结果并与历史试验比较，我们可以停止那些不太可能超过已知最佳结果的试验。

**问题4：基于种群的训练（PBT）与标准 HPO 有何不同？**

PBT 将超参数优化与训练结合：
- 多个模型并行训练（种群）
- 定期地，表现差的模型从表现好的模型复制权重
- 超参数在训练过程中被扰动
- 结果是在训练过程中变化的自适应超参数

**问题5：什么时候会使用多目标优化？**

使用多目标优化的场景：
- 优化冲突的目标（准确率 vs. 推理时间）
- 需要理解目标之间的权衡
- 想要呈现多个帕累托最优解
- 不同的利益相关者有不同的优先级

### 实践性问题

**问题6：为新的深度学习项目设计超参数搜索策略。**

```python
# 步骤 1：基于模型架构定义搜索空间
# 步骤 2：从随机搜索开始以了解景观
# 步骤 3：使用 TPE/贝叶斯优化进行微调
# 步骤 4：应用剪枝提高效率
# 步骤 5：考虑多保真度方法（Hyperband）

def strategy(trial):
    # 阶段 1：带剪枝的粗搜索
    if study.n_trials < 50:
        # 更宽的搜索边界
        lr = trial.suggest_float('lr', 1e-6, 1e-1, log=True)
    else:
        # 基于最佳结果缩小范围
        best_lr = study.best_params['lr']
        lr = trial.suggest_float('lr', best_lr/10, best_lr*10, log=True)

    return train_and_evaluate(lr)
```

**问题7：如何处理条件超参数？**

```python
def conditional_objective(trial):
    # 基于模型类型的条件
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

    # 基于优化器的条件
    optimizer = trial.suggest_categorical('optimizer', ['adam', 'sgd'])
    if optimizer == 'sgd':
        momentum = trial.suggest_float('momentum', 0.0, 0.99)
```

**问题8：如何确保 HPO 实验的可复现性？**

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

# 使用带种子的采样器
sampler = optuna.samplers.TPESampler(seed=42)

# 将研究存储在数据库中
study = optuna.create_study(
    storage='sqlite:///study.db',
    sampler=sampler
)

# 记录所有试验详情
def objective(trial):
    set_seed(42 + trial.number)
    # ... 训练代码
    trial.set_user_attr('git_hash', get_git_hash())
    trial.set_user_attr('timestamp', datetime.now().isoformat())
```

---

## 总结

超参数优化对于实现最佳模型性能至关重要。主要要点：

1. **选择正确的工具**：Optuna 易用性最佳，Ray Tune 适合分布式计算，Hyperopt 简单易用
2. **使用智能搜索**：TPE 和贝叶斯方法优于网格/随机搜索
3. **应用剪枝**：通过提前终止没有希望的试验来节省计算
4. **考虑多目标**：现实问题通常有多个竞争目标
5. **与框架集成**：使用内置集成实现无缝优化
6. **遵循最佳实践**：对速率使用对数尺度、合理的边界、可复现性

掌握这些工具将显著提高你的机器学习工作流程效率和模型性能。

## 延伸阅读

### 文档
- [Optuna 文档](https://optuna.readthedocs.io/)
- [Ray Tune 文档](https://docs.ray.io/en/latest/tune/)
- [Hyperopt 文档](https://hyperopt.github.io/hyperopt/)

### 论文
- "Optuna: A Next-generation Hyperparameter Optimization Framework" (Akiba et al., 2019)
- "Algorithms for Hyper-Parameter Optimization" (Bergstra et al., 2011)
- "Hyperband: A Novel Bandit-Based Approach to Hyperparameter Optimization" (Li et al., 2017)

### 高级主题
- 神经架构搜索（NAS）
- HPO 的元学习
- HPO 的迁移学习
- AutoML 系统（Auto-sklearn、AutoGluon）
